import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";

interface TenseExamplesSectionProps {
  readonly entry: VocabularyEntry;
}

export function TenseExamplesSection({ entry }: TenseExamplesSectionProps) {
  if (entry.grammar.tenseExamples.length === 0) {
    return null;
  }

  return (
    <Section className="vocabulary-section" title="Tense examples">
      <div className="structured-example-list">
        {entry.grammar.tenseExamples.map((example) => (
          <article key={`${example.tense}-${example.sentenceEn}`}>
            <StatusBadge tone="accent">{example.tense}</StatusBadge>
            <strong>{example.sentenceEn}</strong>
            <p>{example.translationTr}</p>
            {example.usageNoteTr === undefined ? null : <small>{example.usageNoteTr}</small>}
          </article>
        ))}
      </div>
    </Section>
  );
}
