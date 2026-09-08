import type {
  ActivityRecord,
  LearningStatus,
  ReviewStatus,
  VocabularyEntry,
  VocabularyUserMetadata
} from "@platform/domain";

export type PracticeFocus = "weak" | "favorites" | "recent" | "collection" | "tag";

export interface PracticeSignal {
  readonly normalizedWord: string;
  readonly word: string;
  readonly cefr: VocabularyEntry["cefr"];
  readonly favorite: boolean;
  readonly tags: readonly string[];
  readonly learningStatus: LearningStatus;
  readonly reviewStatus: ReviewStatus;
  readonly viewCount: number;
  readonly lastViewedAt?: string | undefined;
  readonly lastActivityAt?: string | undefined;
  readonly due: boolean;
  readonly weak: boolean;
  readonly recent: boolean;
}

export interface PracticeDeckOptions {
  readonly focus: PracticeFocus;
  readonly durationMinutes: 5 | 10 | 15;
  readonly now?: Date;
}

export interface PracticeHomeStats {
  readonly due: number;
  readonly weak: number;
  readonly recent: number;
  readonly favorites: number;
  readonly total: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 14;
const LEARNING_REVIEW_DAYS = 2;
const KNOWN_REVIEW_DAYS = 14;
const NEW_REVIEW_DAYS = 7;

function validTime(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function daysSince(value: string | undefined, nowMs: number): number | undefined {
  const timestamp = validTime(value);
  if (timestamp === undefined) return undefined;
  return Math.max(0, (nowMs - timestamp) / DAY_MS);
}

function latestActivityByWord(activity: readonly ActivityRecord[]): ReadonlyMap<string, string> {
  const latest = new Map<string, string>();

  for (const record of activity) {
    if (record.target === undefined || record.scope !== "vocabulary") continue;

    const candidateTime = validTime(record.occurredAt);
    if (candidateTime === undefined) continue;

    const current = latest.get(record.target);
    const currentTime = validTime(current);
    if (currentTime === undefined || candidateTime > currentTime) {
      latest.set(record.target, record.occurredAt);
    }
  }

  return latest;
}

function resolveDue(
  metadata: VocabularyUserMetadata | undefined,
  lastActivityAt: string | undefined,
  nowMs: number
): boolean {
  if (metadata === undefined) return false;

  const anchor = metadata.lastViewedAt ?? lastActivityAt ?? metadata.createdAt;
  const age = daysSince(anchor, nowMs);

  if (age === undefined) return false;

  if (metadata.learningStatus === "learning") {
    return age >= LEARNING_REVIEW_DAYS;
  }

  if (metadata.learningStatus === "known") {
    return age >= KNOWN_REVIEW_DAYS;
  }

  return metadata.viewCount > 0 && age >= NEW_REVIEW_DAYS;
}

function resolveWeak(metadata: VocabularyUserMetadata | undefined): boolean {
  if (metadata === undefined) return false;

  return (
    metadata.learningStatus === "learning" ||
    (metadata.learningStatus !== "known" && metadata.viewCount >= 2) ||
    (metadata.reviewStatus === "imported" && metadata.viewCount > 0)
  );
}

function resolveRecent(
  entry: VocabularyEntry,
  metadata: VocabularyUserMetadata | undefined,
  lastActivityAt: string | undefined,
  nowMs: number
): boolean {
  const anchors = [lastActivityAt, metadata?.createdAt, entry.createdAt]
    .map((value) => validTime(value))
    .filter((value): value is number => value !== undefined);

  if (anchors.length === 0) return false;
  return (nowMs - Math.max(...anchors)) / DAY_MS <= RECENT_WINDOW_DAYS;
}

/**
 * Converts existing vocabulary + metadata + activity into the signals Practice needs.
 *
 * The engine never creates a second vocabulary database: the word content still lives
 * in VocabularyRepository, while user-owned learning state stays in metadata/activity.
 */
export function createPracticeSignals(
  entries: readonly VocabularyEntry[],
  metadata: readonly VocabularyUserMetadata[],
  activity: readonly ActivityRecord[],
  now: Date = new Date()
): readonly PracticeSignal[] {
  const metadataByWord = new Map(metadata.map((item) => [item.normalizedWord, item] as const));
  const activityByWord = latestActivityByWord(activity);
  const nowMs = now.getTime();

  return Object.freeze(
    entries.map((entry) => {
      const userMetadata = metadataByWord.get(entry.normalizedWord);
      const lastActivityAt = activityByWord.get(entry.normalizedWord);

      return Object.freeze({
        normalizedWord: entry.normalizedWord,
        word: entry.word,
        cefr: entry.cefr,
        favorite: userMetadata?.favorite ?? false,
        tags: Object.freeze(userMetadata?.tags.map((tag) => tag.normalizedName) ?? []),
        learningStatus: userMetadata?.learningStatus ?? "new",
        reviewStatus: userMetadata?.reviewStatus ?? "validated",
        viewCount: userMetadata?.viewCount ?? 0,
        ...(userMetadata?.lastViewedAt === undefined
          ? {}
          : { lastViewedAt: userMetadata.lastViewedAt }),
        ...(lastActivityAt === undefined ? {} : { lastActivityAt }),
        due: resolveDue(userMetadata, lastActivityAt, nowMs),
        weak: resolveWeak(userMetadata),
        recent: resolveRecent(entry, userMetadata, lastActivityAt, nowMs)
      });
    })
  );
}

export function summarizePracticeSignals(
  signals: readonly PracticeSignal[]
): PracticeHomeStats {
  return {
    due: signals.filter((item) => item.due).length,
    weak: signals.filter((item) => item.weak).length,
    recent: signals.filter((item) => item.recent).length,
    favorites: signals.filter((item) => item.favorite).length,
    total: signals.length
  };
}

function focusMatches(item: PracticeSignal, focus: PracticeFocus): boolean {
  switch (focus) {
    case "weak":
      return item.weak;
    case "favorites":
      return item.favorite;
    case "recent":
      return item.recent;
    case "tag":
      return item.tags.length > 0;
    case "collection":
      // Collection membership is resolved by the UI adapter once a collection is chosen.
      return true;
  }
}

function practicePriority(item: PracticeSignal): number {
  let score = 0;
  if (item.weak) score += 100;
  if (item.due) score += 70;
  if (item.recent) score += 35;
  if (item.favorite) score += 10;
  score += Math.min(item.viewCount, 10);
  return score;
}

function deckSizeForDuration(durationMinutes: 5 | 10 | 15): number {
  if (durationMinutes === 15) return 24;
  if (durationMinutes === 10) return 18;
  return 12;
}

/**
 * Builds a deterministic deck. Weak/due words come first, but the deck can always
 * fall back to the broader vocabulary pool when a chosen focus has too few words.
 */
export function buildPracticeDeck(
  signals: readonly PracticeSignal[],
  options: PracticeDeckOptions
): readonly PracticeSignal[] {
  const limit = deckSizeForDuration(options.durationMinutes);
  const matching = signals.filter((item) => focusMatches(item, options.focus));
  const source = matching.length >= Math.min(4, limit) ? matching : signals;

  return Object.freeze(
    [...source]
      .sort((left, right) => {
        const scoreDifference = practicePriority(right) - practicePriority(left);
        if (scoreDifference !== 0) return scoreDifference;

        const activityDifference =
          (validTime(right.lastActivityAt) ?? 0) - (validTime(left.lastActivityAt) ?? 0);
        if (activityDifference !== 0) return activityDifference;

        return left.word.localeCompare(right.word);
      })
      .slice(0, limit)
  );
}
