import { LoadingSkeleton } from "../../../components";

export interface VocabularySearchingStateProps {
  readonly query: string;
}

export function VocabularySearchingState({ query }: VocabularySearchingStateProps) {
  return (
    <section
      className="vocabulary-result-state vocabulary-result-state--searching"
      aria-live="polite"
    >
      <div>
        <p className="route-page__eyebrow">Searching local vocabulary</p>
        <h2>Looking for “{query.trim()}”</h2>
        <p>Checking exact entries, normalized forms, aliases, and inflections.</p>
      </div>
      <LoadingSkeleton
        className="vocabulary-search-skeleton"
        label="Searching vocabulary"
        lines={3}
      />
    </section>
  );
}
