import type { VocabularyEntry } from "@platform/domain";

import { Section, StatusBadge } from "../../../components";
import { formatSentenceForm } from "../presenters/VocabularyEntryPresenter";

interface SentenceFormsSectionProps {
  readonly entry: VocabularyEntry;
}

export function SentenceFormsSection({ entry }: SentenceFormsSectionProps) {
  if (entry.grammar.sentenceForms.length === 0) {
    return null;
  }

  return (
    <Section className="vocabulary-section" title="Sentence forms">
      <div className="structured-example-list structured-example-list--compact">
        {entry.grammar.sentenceForms.map((example) => (
          <article key={`${example.form}-${example.sentenceEn}`}>
            <StatusBadge>{formatSentenceForm(example.form)}</StatusBadge>
            <strong>{example.sentenceEn}</strong>
            <p>{example.translationTr}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
