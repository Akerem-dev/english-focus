import type { VocabularyEntry } from "@platform/domain";

import { Section } from "../../../components";
import { formatInflectionType } from "../presenters/VocabularyEntryPresenter";

interface MorphologySectionProps {
  readonly entry: VocabularyEntry;
}

export function MorphologySection({ entry }: MorphologySectionProps) {
  return (
    <Section className="vocabulary-section" title="Word forms">
      <dl className="word-form-list">
        {entry.morphology.inflectedForms.map((form) => (
          <div key={`${form.type}-${form.form}`}>
            <dt>{formatInflectionType(form.type)}</dt>
            <dd>{form.form}</dd>
          </div>
        ))}
      </dl>
      {entry.morphology.notesTr === undefined ? null : (
        <p className="section-note">{entry.morphology.notesTr}</p>
      )}
    </Section>
  );
}
