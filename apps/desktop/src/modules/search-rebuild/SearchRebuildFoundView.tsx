import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { ActivityKind, ActivityRecord, VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { useActivity, useVocabularyRepository } from "../../app/providers";
import { buildVocabularyEntryPath, ROUTE_PATHS } from "../../app/router";
import sparklePair from "../../assets/decorative/accent-sparkle-pair.png";
import wordieReading from "../../assets/wordie/wordie-cutout-reading.png";
import { AppIcon } from "../../design-system";
import { dispatchAssistantRequest } from "../assistant";

import "./search-rebuild.css";
import "./search-package-1-context-rail.css";
import "./search-package-3-detail-polish.css";

type SearchRebuildDetailTab = "definition" | "examples" | "synonyms" | "word-family";

type InflectionType = VocabularyEntry["morphology"]["inflectedForms"][number]["type"];

interface DetailActivityItem {
  readonly word: string;
  readonly normalizedWord: string;
  readonly occurredAt: string;
}

interface DetailActivitySectionProps {
  readonly title: string;
  readonly items: readonly DetailActivityItem[];
  readonly kind: "viewed" | "added";
}

export interface SearchRebuildFoundViewProps {
  readonly entry: VocabularyEntry;
  readonly metadata?: VocabularyUserMetadata | undefined;
  readonly backLabel?: string | undefined;
  readonly onBack: () => void;
  readonly onEditEntry: () => void;
  readonly onEditMetadata: () => void;
  readonly onToggleFavorite?: (() => void) | undefined;
  readonly onImportReplacement: () => void;
  readonly onExport: () => void;
}

function formatRelativeTime(value: string): string {
  const occurredAt = new Date(value);
  const elapsedMs = Date.now() - occurredAt.getTime();

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return "Recently";
  }

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(occurredAt);
}

function formatInflectionType(type: InflectionType): string {
  switch (type) {
    case "base":
      return "Main form";
    case "plural":
      return "Plural";
    case "past":
      return "Past tense";
    case "past-participle":
      return "Past participle";
    case "present-participle":
      return "-ing form";
    case "third-person-singular":
      return "He / she / it form";
    case "comparative":
      return "Comparative";
    case "superlative":
      return "Superlative";
    case "other":
      return "Related form";
  }
}

function RailChevron({ pointsRight }: { readonly pointsRight: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d={pointsRight ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

function DetailActivitySection({ items, kind, title }: DetailActivitySectionProps) {
  return (
    <section className="wvsr-activity" aria-label={title}>
      <header className="wvsr-activity__header">
        <span className="wvsr-activity__header-icon" aria-hidden="true">
          <AppIcon name={kind === "viewed" ? "search" : "bookmark"} size={22} />
        </span>
        <h2>{title}</h2>
        <Link className="wvsr-activity__view-all" to={ROUTE_PATHS.library}>
          View all
        </Link>
      </header>

      <div className="wvsr-activity__rows">
        {items.map((item) => (
          <Link
            className="wvsr-activity__row"
            key={`${kind}-${item.normalizedWord}`}
            to={buildVocabularyEntryPath(item.normalizedWord)}
          >
            <span className="wvsr-activity__row-icon" aria-hidden="true">
              <AppIcon name={kind === "viewed" ? "bookmark" : "book-open"} size={18} />
            </span>
            <span className="wvsr-activity__word">{item.word}</span>
            <span className="wvsr-activity__time">{formatRelativeTime(item.occurredAt)}</span>
          </Link>
        ))}

        {items.length === 0 ? (
          <p className="wvsr-activity__empty">
            {kind === "viewed" ? "Words you open will appear here." : "Saved words will appear here."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function SearchRebuildFoundView({
  backLabel = "Back to vocabulary",
  entry,
  metadata,
  onBack,
  onEditEntry,
  onEditMetadata,
  onToggleFavorite = onEditMetadata,
  onImportReplacement,
  onExport
}: SearchRebuildFoundViewProps) {
  const [activeTab, setActiveTab] = useState<SearchRebuildDetailTab>("definition");
  const [contextOpen, setContextOpen] = useState(true);
  const { activity } = useActivity();
  const { contentSource } = useVocabularyRepository();

  const primaryMeaning = entry.meanings[0];
  const pronunciation = entry.pronunciations[0]?.ipa;
  const favorite = metadata?.favorite === true;
  const englishDefinition =
    primaryMeaning?.definitionEn ?? "An English definition isn’t available for this word yet.";
  const turkishDefinition =
    primaryMeaning?.translationsTr.join(", ") ?? "Türkçe açıklama henüz mevcut değil.";
  const examples = entry.examples.slice(0, 3);
  const morphologyParts = [
    ["Main form", entry.morphology.baseForm],
    ["Word root", entry.morphology.root],
    ["Prefix", entry.morphology.prefix],
    ["Suffix", entry.morphology.suffix]
  ].filter((item): item is [string, string] => item[1] !== undefined && item[1].length > 0);
  const normalizedBaseForm = (entry.morphology.baseForm ?? entry.word)
    .trim()
    .toLocaleLowerCase("en-US");
  const inflectedForms = entry.morphology.inflectedForms
    .filter((form) => form.form.trim().toLocaleLowerCase("en-US") !== normalizedBaseForm)
    .filter(
      (form, index, forms) =>
        forms.findIndex(
          (candidate) =>
            candidate.form.trim().toLocaleLowerCase("en-US") ===
              form.form.trim().toLocaleLowerCase("en-US") && candidate.type === form.type
        ) === index
    )
    .slice(0, 8);

  const { recentAdditions, recentViewed } = useMemo(() => {
    function collect(kinds: readonly ActivityKind[]): DetailActivityItem[] {
      const seen = new Set<string>();
      const ordered = [...activity].sort(
        (left: ActivityRecord, right: ActivityRecord) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
      );
      const result: DetailActivityItem[] = [];

      for (const record of ordered) {
        if (!kinds.includes(record.kind) || record.target === undefined || seen.has(record.target)) {
          continue;
        }

        const vocabularyEntry = contentSource.getEntryByNormalizedWord(record.target);
        if (vocabularyEntry === undefined) {
          continue;
        }

        seen.add(record.target);
        result.push({
          normalizedWord: record.target,
          occurredAt: record.occurredAt,
          word: vocabularyEntry.word
        });

        if (result.length === 5) {
          break;
        }
      }

      return result;
    }

    return {
      recentAdditions: collect(["vocabulary-saved", "entry-kept"]),
      recentViewed: collect(["vocabulary-viewed"])
    };
  }, [activity, contentSource]);

  return (
    <article
      aria-label={`${entry.word} vocabulary entry`}
      className={`wvsr-detail-root wvsr-detail-root--package-one wvsr-detail-root--package-three ${
        contextOpen ? "wvsr-detail-root--context-open" : "wvsr-detail-root--context-closed"
      }`}
      data-search-ui="rebuild-detail-v1"
    >
      <div className="wvsr-detail-root__wash" aria-hidden="true" />

      <div className="wvsr-detail-main">
        <section className="wvsr-detail-card">
          <header className="wvsr-detail-header">
            <button
              aria-label={backLabel}
              className="wvsr-detail-back"
              onClick={onBack}
              type="button"
            >
              <span aria-hidden="true">←</span>
              <span>Back to results</span>
            </button>

            <details className="wvsr-detail-menu">
              <summary aria-label="Word options">•••</summary>
              <div className="wvsr-detail-menu__popover">
                <button onClick={onEditEntry} type="button">Edit word details</button>
                <button onClick={onEditMetadata} type="button">Notes & learning status</button>
                <button onClick={onImportReplacement} type="button">Replace word data</button>
                <button onClick={onExport} type="button">Download word data</button>
              </div>
            </details>

            <div className="wvsr-detail-identity">
              <h1>{entry.word}</h1>
              {pronunciation === undefined ? null : (
                <span className="wvsr-detail-pronunciation">
                  /{pronunciation.replaceAll("/", "")}/
                </span>
              )}
              <span className="wvsr-detail-cefr">{entry.cefr}</span>
            </div>
          </header>

          <nav aria-label="Vocabulary entry sections" className="wvsr-detail-tabs">
            {([
              ["definition", "Definition"],
              ["examples", "Examples"],
              ["synonyms", "Similar words"],
              ["word-family", "Word forms"]
            ] as const).map(([tab, label]) => (
              <button
                aria-current={activeTab === tab ? "page" : undefined}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          <section className="wvsr-detail-content">
            {activeTab === "definition" ? (
              <div className="wvsr-detail-definition">
                <div className="wvsr-detail-definition__block">
                  <h2>English Definition</h2>
                  <p>{englishDefinition}</p>
                </div>
                <div className="wvsr-detail-rule" />
                <div className="wvsr-detail-definition__block">
                  <h2>Türkçe Anlamı</h2>
                  <p>{turkishDefinition}</p>
                </div>
              </div>
            ) : null}

            {activeTab === "examples" ? (
              <div className="wvsr-detail-examples">
                {examples.length === 0 ? (
                  <div className="wvsr-detail-empty">
                    <strong>No examples are saved for this word yet.</strong>
                    <span>Wordie can show you a natural sentence and explain how the word fits into it.</span>
                    <button
                      onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                      type="button"
                    >
                      Ask Wordie for an example
                    </button>
                  </div>
                ) : (
                  examples.map((example) => (
                    <article className="wvsr-detail-example-row" key={example.id}>
                      <strong>{example.sentenceEn}</strong>
                      <span>{example.translationTr}</span>
                    </article>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === "synonyms" ? (
              <div className="wvsr-detail-empty">
                <span className="wvsr-detail-empty__mark" aria-hidden="true">⌁</span>
                <strong>Similar words aren’t saved for this entry yet.</strong>
                <span>
                  Wordie can compare nearby words and explain the difference in meaning, tone, and
                  everyday usage without pretending they are exact synonyms.
                </span>
                <button
                  onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                  type="button"
                >
                  Compare with Wordie
                </button>
              </div>
            ) : null}

            {activeTab === "word-family" ? (
              <div className="wvsr-detail-family">
                {morphologyParts.length > 0 || inflectedForms.length > 0 ? (
                  <div className="wvsr-detail-family__heading">
                    <h2>Forms of {entry.word}</h2>
                    <p>Useful forms already stored with this word.</p>
                  </div>
                ) : null}

                {morphologyParts.length > 0 ? (
                  <div className="wvsr-detail-family__grid">
                    {morphologyParts.map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                {inflectedForms.length > 0 ? (
                  <div className="wvsr-detail-family__forms">
                    {inflectedForms.map((form) => (
                      <div className="wvsr-detail-family__form" key={`${form.form}-${form.type}`}>
                        <strong>{form.form}</strong>
                        <small>{formatInflectionType(form.type)}</small>
                      </div>
                    ))}
                  </div>
                ) : morphologyParts.length === 0 ? (
                  <div className="wvsr-detail-empty">
                    <strong>No extra word forms are saved yet.</strong>
                    <span>Wordie can help you explore common forms of this word in real sentences.</span>
                    <button
                      onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
                      type="button"
                    >
                      Explore forms with Wordie
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="wvsr-detail-actions">
            <button
              aria-pressed={favorite}
              className="wvsr-detail-save"
              onClick={onToggleFavorite}
              type="button"
            >
              <AppIcon name="bookmark" size={21} />
              <span>{favorite ? "Saved to Valley" : "Save to Valley"}</span>
            </button>
            <button
              className="wvsr-detail-practice"
              onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
              type="button"
            >
              <AppIcon name="book-open" size={21} />
              <span>Practice</span>
            </button>
          </div>

          {activeTab === "definition" ? (
            <section className="wvsr-detail-example-card" aria-label="Example sentence">
              <h2>Example Sentence</h2>
              {entry.examples[0] === undefined ? (
                <p className="wvsr-detail-example-card__empty">No example is available yet.</p>
              ) : (
                <>
                  <p>{entry.examples[0].sentenceEn}</p>
                  <span>{entry.examples[0].translationTr}</span>
                </>
              )}
            </section>
          ) : null}
        </section>
      </div>

      <button
        aria-controls="wvsr-detail-context-rail"
        aria-expanded={contextOpen}
        aria-label={contextOpen ? "Hide side panel" : "Show side panel"}
        className="wvsr-detail-context-toggle"
        onClick={() => setContextOpen((current) => !current)}
        title={contextOpen ? "Hide side panel" : "Show side panel"}
        type="button"
      >
        <RailChevron pointsRight={contextOpen} />
      </button>

      {contextOpen ? (
        <aside
          aria-label="Word activity and Wordie"
          className="wvsr-rail wvsr-detail-context-rail"
          id="wvsr-detail-context-rail"
        >
          <div className="wvsr-rail__paper" aria-hidden="true" />
          <DetailActivitySection kind="viewed" items={recentViewed} title="RECENTLY VIEWED" />
          <div className="wvsr-rail__divider" />
          <DetailActivitySection kind="added" items={recentAdditions} title="RECENT ADDITIONS" />

          <section className="wvsr-wordie-card" aria-label="Wordie vocabulary assistant">
            <header>
              <span className="wvsr-wordie-card__status" aria-hidden="true">✓</span>
              <h2>Wordie</h2>
              <img alt="" className="wvsr-wordie-card__sparkle" src={sparklePair} />
            </header>
            <p className="wvsr-wordie-card__subtitle">Your vocabulary companion</p>
            <p className="wvsr-wordie-card__copy">
              Want another explanation or a natural example for this word?
            </p>
            <img alt="" className="wvsr-wordie-card__mascot" src={wordieReading} />
            <button
              onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
              type="button"
            >
              <span>Ask Wordie</span>
              <span aria-hidden="true">→</span>
            </button>
          </section>
        </aside>
      ) : null}
    </article>
  );
}
