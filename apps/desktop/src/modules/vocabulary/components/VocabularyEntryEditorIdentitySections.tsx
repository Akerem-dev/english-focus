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
            <h3>Word details</h3>
            <p>Keep the word, level, and word type up to date.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--three">
          <TextField
            data-autofocus="true"
            error={firstIssue(issues, "word")}
            helperText={`Current word: “${original.word}”.`}
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
            label="Level"
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
            label="Word type"
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

        <details className="vocabulary-entry-editor__advanced-inline">
          <summary>Style and usage labels</summary>
          <div className="vocabulary-entry-editor__advanced-body">
            <fieldset className="vocabulary-entry-editor__choices">
              <legend>Where this word is commonly used</legend>
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
          </div>
        </details>
      </section>

      <section className="vocabulary-entry-editor__section">
        <header>
          <span>2</span>
          <div>
            <h3>Meaning</h3>
            <p>Edit the English meaning and Turkish equivalent.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__stack">
          {draft.meanings.map((meaning, index) => (
            <article className="vocabulary-entry-editor__card" key={meaning.id}>
              <strong>{draft.meanings.length > 1 ? `Meaning ${index + 1}` : "Main meaning"}</strong>
              <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                <SelectField
                  label="Word type"
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
                  label="Turkish meaning"
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
                label="English meaning"
                onChange={(event) =>
                  updateMeaning(index, {
                    definitionEn: event.currentTarget.value
                  })
                }
                rows={3}
                value={meaning.definitionEn}
              />

              <details className="vocabulary-entry-editor__advanced-inline">
                <summary>Extra notes for this meaning</summary>
                <div className="vocabulary-entry-editor__advanced-body">
                  <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                    <TextAreaField
                      label="Turkish note"
                      onChange={(event) =>
                        updateMeaning(index, {
                          usageNoteTr: event.currentTarget.value
                        })
                      }
                      rows={3}
                      value={meaning.usageNoteTr ?? ""}
                    />
                    <TextAreaField
                      label="English note"
                      onChange={(event) =>
                        updateMeaning(index, {
                          usageNoteEn: event.currentTarget.value
                        })
                      }
                      rows={3}
                      value={meaning.usageNoteEn ?? ""}
                    />
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
