import type { VocabularyEntry } from "@platform/domain";

import { Section } from "../../../components";

interface CollocationsSectionProps {
  readonly entry: VocabularyEntry;
}

export function CollocationsSection({ entry }: CollocationsSectionProps) {
  return (
    <Section className="vocabulary-section" id="collocations" title="Collocations">
      <div className="collocation-list">
        {entry.collocations.map((collocation) => (
          <article key={collocation.phrase}>
            <h3>{collocation.phrase}</h3>
            <p>{collocation.translationTr}</p>
            {collocation.exampleEn === undefined ? null : (
              <blockquote>
                <strong>{collocation.exampleEn}</strong>
                <span>{collocation.exampleTr}</span>
              </blockquote>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
