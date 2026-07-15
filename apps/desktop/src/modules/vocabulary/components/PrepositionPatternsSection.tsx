import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";

interface PrepositionPatternsSectionProps {
  readonly entry: VocabularyEntry;
}

export function PrepositionPatternsSection({ entry }: PrepositionPatternsSectionProps) {
  if (entry.grammar.prepositionPatterns.length === 0) {
    return null;
  }

  return (
    <Section className="vocabulary-section" title="Preposition patterns">
      <div className="preposition-pattern-list">
        {entry.grammar.prepositionPatterns.map((pattern) => (
          <article key={pattern.pattern}>
            <StatusBadge tone="accent">{pattern.preposition}</StatusBadge>
            <div>
              <h3>{pattern.pattern}</h3>
              <p>{pattern.explanationTr}</p>
              <blockquote>
                <strong>{pattern.examples[0]?.sentenceEn}</strong>
                <span>{pattern.examples[0]?.translationTr}</span>
              </blockquote>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
