import type { VocabularyEntry } from "@platform/domain";

import { Section, TagChip } from "../../../components";
import { formatPartOfSpeech, formatRegister } from "../presenters/VocabularyEntryPresenter";

interface MeaningsSectionProps {
  readonly entry: VocabularyEntry;
}

export function MeaningsSection({ entry }: MeaningsSectionProps) {
  return (
    <Section
      className="vocabulary-section"
      description="Distinct senses are kept separate so Turkish translations remain precise."
      id="meanings"
      title="Meanings"
    >
      <ol className="meaning-list">
        {entry.meanings.map((meaning, index) => (
          <li className="meaning-item" key={meaning.id}>
            <div className="meaning-item__number" aria-hidden="true">
              {index + 1}
            </div>
            <div>
              <div className="meaning-item__meta">
                <strong>{formatPartOfSpeech(meaning.partOfSpeech)}</strong>
                {meaning.registers.map((register) => (
                  <TagChip key={register}>{formatRegister(register)}</TagChip>
                ))}
              </div>
              <p className="meaning-item__definition">{meaning.definitionEn}</p>
              <p className="meaning-item__translation">{meaning.translationsTr.join(" · ")}</p>
              {meaning.usageNoteTr === undefined ? null : (
                <p className="meaning-item__note">{meaning.usageNoteTr}</p>
              )}
              {meaning.usageNoteEn === undefined ? null : (
                <p className="meaning-item__note meaning-item__note--english">
                  {meaning.usageNoteEn}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
