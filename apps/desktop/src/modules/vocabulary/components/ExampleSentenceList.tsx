import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { ExampleSentenceRow } from "./ExampleSentenceRow";

interface ExampleSentenceListProps {
  readonly entry: VocabularyEntry;
  readonly limit?: 5 | 10;
}

export function ExampleSentenceList({ entry, limit = 10 }: ExampleSentenceListProps) {
  const visibleExamples = entry.examples.slice(0, limit);
  const statusLabel =
    visibleExamples.length === entry.examples.length
      ? `Exactly ${entry.examples.length}`
      : `Showing ${visibleExamples.length} of ${entry.examples.length}`;

  return (
    <Section
      actions={<StatusBadge tone="success">{statusLabel}</StatusBadge>}
      className="vocabulary-section"
      description="Primary English examples with Turkish translations and grammar labels."
      id="examples"
      title="Example sentences"
    >
      <ol className="example-sentence-list">
        {visibleExamples.map((example, index) => (
          <ExampleSentenceRow example={example} index={index} key={example.id} />
        ))}
      </ol>
    </Section>
  );
}
