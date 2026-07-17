import type { CefrLevel, PartOfSpeech, Register, VocabularyEntry } from "@platform/domain";
import { CEFR_LEVELS, PARTS_OF_SPEECH, REGISTERS } from "@platform/domain";

import { SelectField, TextAreaField, TextField } from "../../../components";
import { formatPartOfSpeech, formatPlainLabel } from "../presenters/VocabularyEntryPresenter";
import {
  firstIssue,
  replaceAt,
  type VocabularyEditorSectionProps
} from "./VocabularyEntryEditorHelpers";

interface IdentitySectionsProps extends VocabularyEditorSectionProps {
  readonly original: VocabularyEntry;
}

export function VocabularyEntryEditorIdentitySections({
  draft,
  issues,
  original,
  setDraft
}: IdentitySectionsProps) {
  function updateMeaning(index: number, patch: Partial<VocabularyEntry["meanings"][number]>) {
    setDraft((current) => {
      const meaning = current.meanings[index];
      if (meaning === undefined) {
        return current;
      }

      const meanings = replaceAt(current.meanings, index, {
        ...meaning,
        ...patch
      });
      return {
        ...current,
        meanings,
        partsOfSpeech: [...new Set(meanings.map((item) => item.partOfSpeech))]
      };
    });
  }

  function toggleRegister(register: Register) {
    setDraft((current) => ({
      ...current,
      registers: current.registers.includes(register)
        ? current.registers.filter((value) => value !== register)
        : [...current.registers, register]
    }));
  }

  return (
    <>
      <section className="vocabulary-entry-editor__section">
        <header>
          <span>1</span>
          <div>
            <h3>Identity and level</h3>
            <p>The normalized identity is protected to prevent accidental duplicate records.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--three">
          <TextField
            data-autofocus="true"
            error={firstIssue(issues, "word")}
            helperText={`Identity remains “${original.normalizedWord}”.`}
            label="Word"
            maxLength={120}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                word: event.currentTarget.value
              }))
            }
            value={draft.word}
          />
          <SelectField
            error={firstIssue(issues, "cefr")}
            label="CEFR level"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                cefr: event.currentTarget.value as CefrLevel
              }))
            }
            value={draft.cefr}
          >
            {CEFR_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </SelectField>
          <SelectField
            label="Primary part of speech"
            onChange={(event) =>
              updateMeaning(0, {
                partOfSpeech: event.currentTarget.value as PartOfSpeech
              })
            }
            value={draft.meanings[0]?.partOfSpeech ?? "other"}
          >
            {PARTS_OF_SPEECH.map((partOfSpeech) => (
              <option key={partOfSpeech} value={partOfSpeech}>
                {formatPartOfSpeech(partOfSpeech)}
              </option>
            ))}
          </SelectField>
        </div>
        <fieldset className="vocabulary-entry-editor__choices">
          <legend>Registers</legend>
          <div>
            {REGISTERS.map((register) => (
              <label key={register}>
                <input
                  checked={draft.registers.includes(register)}
                  onChange={() => toggleRegister(register)}
                  type="checkbox"
                />
                <span>{formatPlainLabel(register)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="vocabulary-entry-editor__section">
        <header>
          <span>2</span>
          <div>
            <h3>Meanings and Turkish translations</h3>
            <p>Separate multiple Turkish translations with commas.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__stack">
          {draft.meanings.map((meaning, index) => (
            <article className="vocabulary-entry-editor__card" key={meaning.id}>
              <strong>Meaning {index + 1}</strong>
              <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                <SelectField
                  label="Part of speech"
                  onChange={(event) =>
                    updateMeaning(index, {
                      partOfSpeech: event.currentTarget.value as PartOfSpeech
                    })
                  }
                  value={meaning.partOfSpeech}
                >
                  {PARTS_OF_SPEECH.map((partOfSpeech) => (
                    <option key={partOfSpeech} value={partOfSpeech}>
                      {formatPartOfSpeech(partOfSpeech)}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  error={firstIssue(issues, `meanings[${index}].translationsTr`)}
                  label="Turkish translations"
                  onChange={(event) =>
                    updateMeaning(index, {
                      translationsTr: [event.currentTarget.value]
                    })
                  }
                  value={meaning.translationsTr.join(", ")}
                />
              </div>
              <TextAreaField
                error={firstIssue(issues, `meanings[${index}].definitionEn`)}
                label="English definition"
                onChange={(event) =>
                  updateMeaning(index, {
                    definitionEn: event.currentTarget.value
                  })
                }
                rows={3}
                value={meaning.definitionEn}
              />
              <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                <TextAreaField
                  label="Turkish usage note"
                  onChange={(event) =>
                    updateMeaning(index, {
                      usageNoteTr: event.currentTarget.value
                    })
                  }
                  rows={3}
                  value={meaning.usageNoteTr ?? ""}
                />
                <TextAreaField
                  label="English usage note"
                  onChange={(event) =>
                    updateMeaning(index, {
                      usageNoteEn: event.currentTarget.value
                    })
                  }
                  rows={3}
                  value={meaning.usageNoteEn ?? ""}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
