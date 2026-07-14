import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";
import { vocabularyEntrySchema } from "@platform/schemas";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}

function parseEntry(candidate: unknown, index: number): VocabularyEntry {
  const result = vocabularyEntrySchema.safeParse(candidate);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const issuePath = firstIssue?.path.join(".") ?? "entry";
    const issueMessage = firstIssue?.message ?? "Unknown schema error";

    throw new Error(
      `Vocabulary content entry ${index + 1} is invalid at '${issuePath}': ${issueMessage}`
    );
  }

  return deepFreeze(result.data);
}

/**
 * Validates local content once, then exposes an immutable read-only catalog.
 * It deliberately contains no save, replace, delete, or metadata operations.
 */
export class ValidatedVocabularyContentSource implements VocabularyContentSource {
  private readonly entries: readonly VocabularyEntry[];
  private readonly entriesById: ReadonlyMap<string, VocabularyEntry>;
  private readonly entriesByNormalizedWord: ReadonlyMap<string, VocabularyEntry>;

  constructor(candidates: readonly unknown[]) {
    const parsedEntries = candidates.map(parseEntry);
    const entriesById = new Map<string, VocabularyEntry>();
    const entriesByNormalizedWord = new Map<string, VocabularyEntry>();

    for (const entry of parsedEntries) {
      if (entriesById.has(entry.id)) {
        throw new Error(`Duplicate vocabulary content id '${entry.id}'.`);
      }

      if (entriesByNormalizedWord.has(entry.normalizedWord)) {
        throw new Error(`Duplicate normalized vocabulary word '${entry.normalizedWord}'.`);
      }

      entriesById.set(entry.id, entry);
      entriesByNormalizedWord.set(entry.normalizedWord, entry);
    }

    this.entries = deepFreeze([...parsedEntries]);
    this.entriesById = entriesById;
    this.entriesByNormalizedWord = entriesByNormalizedWord;
  }

  listEntries(): readonly VocabularyEntry[] {
    return this.entries;
  }

  getEntryById(entryId: string): VocabularyEntry | undefined {
    return this.entriesById.get(entryId);
  }

  getEntryByNormalizedWord(normalizedWord: string): VocabularyEntry | undefined {
    return this.entriesByNormalizedWord.get(normalizedWord);
  }
}
