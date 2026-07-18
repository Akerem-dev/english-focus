import type { InflectionType, PronunciationVariant, VocabularyEntry } from "@platform/domain";
import { INFLECTION_TYPES, PRONUNCIATION_VARIANTS } from "@platform/domain";

import { SelectField, TextField } from "../../../components";
import {
  formatInflectionType,
  formatPronunciationVariant
} from "../presenters/VocabularyEntryPresenter";
import {
  firstIssue,
  replaceAt,
  type VocabularyEditorSectionProps
} from "./VocabularyEntryEditorHelpers";

export function VocabularyEntryEditorLanguageSections({
  draft,
  issues,
  setDraft
}: VocabularyEditorSectionProps) {
  function updatePronunciation(
    index: number,
    patch: Partial<VocabularyEntry["pronunciations"][number]>
  ) {
    setDraft((current) => {
      const pronunciation = current.pronunciations[index];
      return pronunciation === undefined
        ? current
        : {
            ...current,
            pronunciations: replaceAt(current.pronunciations, index, {
              ...pronunciation,
              ...patch
            })
          };
    });
  }

  function updateForm(
    index: number,
    patch: Partial<VocabularyEntry["morphology"]["inflectedForms"][number]>
  ) {
    setDraft((current) => {
      const form = current.morphology.inflectedForms[index];
      return form === undefined
        ? current
        : {
            ...current,
            morphology: {
              ...current.morphology,
              inflectedForms: replaceAt(current.morphology.inflectedForms, index, {
                ...form,
                ...patch
              })
            }
          };
    });
  }

  return (
    <>
      <section className="vocabulary-entry-editor__section">
        <header>
          <span>3</span>
          <div>
            <h3>Pronunciation</h3>
            <p>Edit every available pronunciation variant.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__stack">
          {draft.pronunciations.map((pronunciation, index) => (
            <article
              className="vocabulary-entry-editor__card"
              key={`${index}-${pronunciation.variant}`}
            >
              <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                <TextField
                  error={firstIssue(issues, `pronunciations[${index}].ipa`)}
                  label="IPA"
                  onChange={(event) =>
                    updatePronunciation(index, {
                      ipa: event.currentTarget.value
                    })
                  }
                  value={pronunciation.ipa}
                />
                <SelectField
                  label="Variant"
                  onChange={(event) =>
                    updatePronunciation(index, {
                      variant: event.currentTarget.value as PronunciationVariant
                    })
                  }
                  value={pronunciation.variant}
                >
                  {PRONUNCIATION_VARIANTS.map((variant) => (
                    <option key={variant} value={variant}>
                      {formatPronunciationVariant(variant)}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label="Syllable breakdown"
                  onChange={(event) =>
                    updatePronunciation(index, {
                      syllableBreakdown: event.currentTarget.value
                    })
                  }
                  value={pronunciation.syllableBreakdown ?? ""}
                />
                <TextField
                  label="Stress note"
                  onChange={(event) =>
                    updatePronunciation(index, {
                      stress: event.currentTarget.value
                    })
                  }
                  value={pronunciation.stress ?? ""}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="vocabulary-entry-editor__section">
        <header>
          <span>4</span>
          <div>
            <h3>Word forms</h3>
            <p>Forms remain available to local inflected-form search.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
          <TextField
            error={firstIssue(issues, "morphology.baseForm")}
            label="Base form"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                morphology: {
                  ...current.morphology,
                  baseForm: event.currentTarget.value
                }
              }))
            }
            value={draft.morphology.baseForm}
          />
          <TextField
            label="Root"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                morphology: {
                  ...current.morphology,
                  root: event.currentTarget.value
                }
              }))
            }
            value={draft.morphology.root ?? ""}
          />
        </div>
        <div className="vocabulary-entry-editor__stack">
          {draft.morphology.inflectedForms.map((form, index) => (
            <article className="vocabulary-entry-editor__inline-card" key={`${index}-${form.type}`}>
              <SelectField
                label={`Form ${index + 1} type`}
                onChange={(event) =>
                  updateForm(index, {
                    type: event.currentTarget.value as InflectionType
                  })
                }
                value={form.type}
              >
                {INFLECTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatInflectionType(type)}
                  </option>
                ))}
              </SelectField>
              <TextField
                error={firstIssue(issues, `morphology.inflectedForms[${index}].form`)}
                label={`Form ${index + 1}`}
                onChange={(event) =>
                  updateForm(index, {
                    form: event.currentTarget.value,
                    normalizedForm: event.currentTarget.value
                  })
                }
                value={form.form}
              />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
