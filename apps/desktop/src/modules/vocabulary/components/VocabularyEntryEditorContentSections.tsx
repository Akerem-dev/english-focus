import type { EtymologyCertainty, VocabularyEntry } from "@platform/domain";
import { ETYMOLOGY_CERTAINTY_LEVELS } from "@platform/domain";

import { SelectField, TextAreaField, TextField } from "../../../components";
import { formatPlainLabel } from "../presenters/VocabularyEntryPresenter";
import {
  firstIssue,
  replaceAt,
  type VocabularyEditorSectionProps
} from "./VocabularyEntryEditorHelpers";

export function VocabularyEntryEditorContentSections({
  draft,
  issues,
  setDraft
}: VocabularyEditorSectionProps) {
  function updateExample(index: number, patch: Partial<VocabularyEntry["examples"][number]>) {
    setDraft((current) => {
      const example = current.examples[index];
      return example === undefined
        ? current
        : {
            ...current,
            examples: replaceAt(current.examples, index, {
              ...example,
              ...patch
            })
          };
    });
  }

  return (
    <>
      <section className="vocabulary-entry-editor__section">
        <header>
          <span>5</span>
          <div>
            <h3>Short usage explanation</h3>
            <p>This overview appears near the top of the detail screen.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
          <TextAreaField
            error={firstIssue(issues, "grammar.summaryTr")}
            label="Turkish usage explanation"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                grammar: {
                  ...current.grammar,
                  summaryTr: event.currentTarget.value
                }
              }))
            }
            rows={5}
            value={draft.grammar.summaryTr}
          />
          <TextAreaField
            error={firstIssue(issues, "grammar.summaryEn")}
            label="English usage explanation"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                grammar: {
                  ...current.grammar,
                  summaryEn: event.currentTarget.value
                }
              }))
            }
            rows={5}
            value={draft.grammar.summaryEn}
          />
        </div>
      </section>

      <section className="vocabulary-entry-editor__section">
        <header>
          <span>6</span>
          <div>
            <h3>Three example sentences</h3>
            <p>Every example requires an accurate Turkish translation.</p>
          </div>
        </header>
        <div className="vocabulary-entry-editor__stack">
          {draft.examples.map((example, index) => (
            <article className="vocabulary-entry-editor__card" key={example.id}>
              <strong>Example {index + 1}</strong>
              <TextAreaField
                error={firstIssue(issues, `examples[${index}].sentenceEn`)}
                label="English sentence"
                onChange={(event) =>
                  updateExample(index, {
                    sentenceEn: event.currentTarget.value
                  })
                }
                rows={3}
                value={example.sentenceEn}
              />
              <TextAreaField
                error={firstIssue(issues, `examples[${index}].translationTr`)}
                label="Turkish translation"
                onChange={(event) =>
                  updateExample(index, {
                    translationTr: event.currentTarget.value
                  })
                }
                rows={3}
                value={example.translationTr}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="vocabulary-entry-editor__section">
        <header>
          <span>7</span>
          <div>
            <h3>Optional etymology</h3>
            <p>Disable this section when a reliable origin is not available.</p>
          </div>
        </header>
        <label className="vocabulary-entry-editor__toggle">
          <input
            checked={draft.etymology !== undefined}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                etymology: event.currentTarget.checked
                  ? (current.etymology ?? {
                      explanationEn: "",
                      explanationTr: "",
                      certainty: "medium"
                    })
                  : undefined
              }))
            }
            type="checkbox"
          />
          <span>Include etymology</span>
        </label>
        {draft.etymology === undefined ? null : (
          <div className="vocabulary-entry-editor__stack">
            <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--three">
              <SelectField
                label="Certainty"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    etymology:
                      current.etymology === undefined
                        ? undefined
                        : {
                            ...current.etymology,
                            certainty: event.currentTarget.value as EtymologyCertainty
                          }
                  }))
                }
                value={draft.etymology.certainty}
              >
                {ETYMOLOGY_CERTAINTY_LEVELS.map((certainty) => (
                  <option key={certainty} value={certainty}>
                    {formatPlainLabel(certainty)}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Origin language"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    etymology:
                      current.etymology === undefined
                        ? undefined
                        : {
                            ...current.etymology,
                            originLanguage: event.currentTarget.value
                          }
                  }))
                }
                value={draft.etymology.originLanguage ?? ""}
              />
              <TextField
                label="Origin form"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    etymology:
                      current.etymology === undefined
                        ? undefined
                        : {
                            ...current.etymology,
                            originForm: event.currentTarget.value
                          }
                  }))
                }
                value={draft.etymology.originForm ?? ""}
              />
            </div>
            <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
              <TextAreaField
                error={firstIssue(issues, "etymology.explanationTr")}
                label="Turkish etymology"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    etymology:
                      current.etymology === undefined
                        ? undefined
                        : {
                            ...current.etymology,
                            explanationTr: event.currentTarget.value
                          }
                  }))
                }
                rows={4}
                value={draft.etymology.explanationTr}
              />
              <TextAreaField
                error={firstIssue(issues, "etymology.explanationEn")}
                label="English etymology"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    etymology:
                      current.etymology === undefined
                        ? undefined
                        : {
                            ...current.etymology,
                            explanationEn: event.currentTarget.value
                          }
                  }))
                }
                rows={4}
                value={draft.etymology.explanationEn}
              />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
