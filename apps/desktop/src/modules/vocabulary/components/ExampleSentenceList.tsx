import type { VocabularyEntry } from "@platform/domain";

import { Section } from "../../../components";
import { ExampleSentenceRow } from "./ExampleSentenceRow";

const DEFAULT_VISIBLE_EXAMPLE_COUNT = 3;

interface ExampleSentenceListProps {
  readonly entry: VocabularyEntry;
  readonly limit?: number;
}

export function ExampleSentenceList({
  entry,
  limit = DEFAULT_VISIBLE_EXAMPLE_COUNT
}: ExampleSentenceListProps) {
  const visibleExamples = entry.examples.slice(0, Math.min(limit, DEFAULT_VISIBLE_EXAMPLE_COUNT));

  return (
    <Section
      className="vocabulary-section"
      description="Practical English examples with Turkish translations."
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
