import type { VocabularyEntry } from "@platform/domain";

import { Section } from "../../../components";

interface GrammarSectionProps {
  readonly entry: VocabularyEntry;
}

export function GrammarSection({ entry }: GrammarSectionProps) {
  return (
    <Section
      className="vocabulary-section"
      description="Only naturally applicable structures from the validated entry are shown."
      id="grammar"
      title="Grammar patterns"
    >
      <div className="grammar-pattern-list">
        {entry.grammar.patterns.map((pattern) => (
          <article className="grammar-pattern" key={pattern.pattern}>
            <h3>{pattern.pattern}</h3>
            <p>{pattern.explanationTr}</p>
            <p className="grammar-pattern__english">{pattern.explanationEn}</p>
            <div className="bilingual-example-list">
              {pattern.examples.map((example) => (
                <blockquote key={example.sentenceEn}>
                  <strong>{example.sentenceEn}</strong>
                  <span>{example.translationTr}</span>
                </blockquote>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
