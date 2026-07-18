import type { VocabularyEntry } from "@platform/domain";

interface VocabularyQuickSummaryProps {
  readonly entry: VocabularyEntry;
}

export function VocabularyQuickSummary({ entry }: VocabularyQuickSummaryProps) {
  return (
    <section className="vocabulary-summary" id="overview" aria-labelledby="summary-title">
      <div className="vocabulary-summary__copy">
        <p className="vocabulary-summary__label">Usage overview</p>
        <h2 id="summary-title">How “{entry.word}” is used</h2>
        <p>{entry.grammar.summaryTr}</p>
        <p className="vocabulary-summary__english">{entry.grammar.summaryEn}</p>
      </div>
    </section>
  );
}
