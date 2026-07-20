import type { VocabularySearchMatch } from "../../search/application";
import type { VocabularySearchField } from "../../search/services";
import { AppIcon } from "../../../design-system";

const FIELD_LABELS: Readonly<Record<VocabularySearchField, string>> = Object.freeze({
  word: "Word",
  alias: "Alias",
  inflection: "Word form",
  translation: "Turkish translation",
  definition: "English definition",
  tag: "Personal tag",
  note: "Personal note"
});

export interface VocabularySearchResultsStateProps {
  readonly query: string;
  readonly matches: readonly VocabularySearchMatch[];
  readonly onSelectMatch: (normalizedWord: string) => void;
}

function primaryTranslation(match: VocabularySearchMatch): string {
  return match.entry.meanings[0]?.translationsTr[0] ?? "No Turkish translation";
}

export function VocabularySearchResultsState({
  matches,
  onSelectMatch,
  query
}: VocabularySearchResultsStateProps) {
  return (
    <section className="vocabulary-search-results" aria-labelledby="vocabulary-search-results-title">
      <header className="vocabulary-search-results__header">
        <div>
          <p className="route-page__eyebrow">Local matches</p>
          <h2 id="vocabulary-search-results-title">
            {matches.length} {matches.length === 1 ? "match" : "matches"} for “{query.trim()}”
          </h2>
        </div>
        <p>Choose an entry to open its complete vocabulary details.</p>
      </header>

      <div className="vocabulary-search-results__list">
        {matches.map((match) => (
          <button
            className="vocabulary-search-result"
            key={match.entry.id}
            onClick={() => onSelectMatch(match.entry.normalizedWord)}
            type="button"
          >
            <span className="vocabulary-search-result__identity">
              <span className="vocabulary-search-result__word">{match.entry.word}</span>
              <span className="vocabulary-search-result__translation">
                {primaryTranslation(match)}
              </span>
            </span>
            <span className="vocabulary-search-result__reason">
              <span>
                {FIELD_LABELS[match.matchedField]} · {match.matchKind === "prefix" ? "prefix" : "full text"}
              </span>
              <small>{match.matchedText}</small>
            </span>
            <span className="vocabulary-search-result__level">{match.entry.cefr}</span>
            <AppIcon name="chevron-right" size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}
