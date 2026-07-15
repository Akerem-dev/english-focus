import type { VocabularyEntry } from "@platform/domain";

interface VocabularyQuickSummaryProps {
  readonly entry: VocabularyEntry;
}

export function VocabularyQuickSummary({ entry }: VocabularyQuickSummaryProps) {
  return (
    <section className="vocabulary-summary" id="overview" aria-labelledby="summary-title">
      <div className="vocabulary-summary__copy">
        <p className="vocabulary-summary__label">Grammar overview</p>
        <h2 id="summary-title">How “{entry.word}” works</h2>
        <p>{entry.grammar.summaryTr}</p>
        <p className="vocabulary-summary__english">{entry.grammar.summaryEn}</p>
      </div>
      <dl className="vocabulary-summary__stats">
        <div>
          <dt>Meanings</dt>
          <dd>{entry.meanings.length}</dd>
        </div>
        <div>
          <dt>Examples</dt>
          <dd>{entry.examples.length}</dd>
        </div>
        <div>
          <dt>Patterns</dt>
          <dd>{entry.grammar.patterns.length}</dd>
        </div>
        <div>
          <dt>Collocations</dt>
          <dd>{entry.collocations.length}</dd>
        </div>
      </dl>
    </section>
  );
}
