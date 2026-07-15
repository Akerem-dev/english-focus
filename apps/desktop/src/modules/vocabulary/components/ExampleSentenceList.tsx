import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { ExampleSentenceRow } from "./ExampleSentenceRow";

interface ExampleSentenceListProps {
  readonly entry: VocabularyEntry;
}

export function ExampleSentenceList({ entry }: ExampleSentenceListProps) {
  return (
    <Section
      actions={<StatusBadge tone="success">Exactly {entry.examples.length}</StatusBadge>}
      className="vocabulary-section"
      description="Primary English examples with Turkish translations and grammar labels."
      id="examples"
      title="Example sentences"
    >
      <ol className="example-sentence-list">
        {entry.examples.map((example, index) => (
          <ExampleSentenceRow example={example} index={index} key={example.id} />
        ))}
      </ol>
    </Section>
  );
}
