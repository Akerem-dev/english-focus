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
      <section className="vocabulary-entry-editor__section vocabulary-entry-editor__section--examples">
        <header>
          <span>3</span>
          <div>
            <h3>Examples</h3>
            <p>Use natural sentences that make the word easy to remember.</p>
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
                rows={2}
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
                rows={2}
                value={example.translationTr}
              />
            </article>
          ))}
        </div>
      </section>

      <details className="vocabulary-entry-editor__advanced vocabulary-entry-editor__advanced--study">
        <summary>Extra study details</summary>
        <div className="vocabulary-entry-editor__advanced-body">
          <section className="vocabulary-entry-editor__section vocabulary-entry-editor__section--usage">
            <header>
              <span>4</span>
              <div>
                <h3>Usage notes</h3>
                <p>Add a short explanation only when it helps the learner understand the word.</p>
              </div>
            </header>
            <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
              <TextAreaField
                error={firstIssue(issues, "grammar.summaryTr")}
                label="Turkish note"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({
                    ...current,
                    grammar: {
                      ...current.grammar,
                      summaryTr: value
                    }
                  }));
                }}
                rows={4}
                value={draft.grammar.summaryTr}
              />
              <TextAreaField
                error={firstIssue(issues, "grammar.summaryEn")}
                label="English note"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({
                    ...current,
                    grammar: {
                      ...current.grammar,
                      summaryEn: value
                    }
                  }));
                }}
                rows={4}
                value={draft.grammar.summaryEn}
              />
            </div>
          </section>

          <section className="vocabulary-entry-editor__section vocabulary-entry-editor__section--origin">
            <header>
              <span>5</span>
              <div>
                <h3>Word origin</h3>
                <p>Optional. Add this only when the origin is useful for learning.</p>
              </div>
            </header>
            <label className="vocabulary-entry-editor__toggle">
              <input
                checked={draft.etymology !== undefined}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setDraft((current) => ({
                    ...current,
                    etymology: checked
                      ? (current.etymology ?? {
                          explanationEn: "",
                          explanationTr: "",
                          certainty: "medium"
                        })
                      : undefined
                  }));
                }}
                type="checkbox"
              />
              <span>Include word origin</span>
            </label>
            {draft.etymology === undefined ? null : (
              <div className="vocabulary-entry-editor__stack">
                <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--three">
                  <SelectField
                    label="Confidence"
                    onChange={(event) => {
                      const value = event.currentTarget.value as EtymologyCertainty;
                      setDraft((current) => ({
                        ...current,
                        etymology:
                          current.etymology === undefined
                            ? undefined
                            : {
                                ...current.etymology,
                                certainty: value
                              }
                      }));
                    }}
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
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setDraft((current) => ({
                        ...current,
                        etymology:
                          current.etymology === undefined
                            ? undefined
                            : {
                                ...current.etymology,
                                originLanguage: value
                              }
                      }));
                    }}
                    value={draft.etymology.originLanguage ?? ""}
                  />
                  <TextField
                    label="Original form"
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setDraft((current) => ({
                        ...current,
                        etymology:
                          current.etymology === undefined
                            ? undefined
                            : {
                                ...current.etymology,
                                originForm: value
                              }
                      }));
                    }}
                    value={draft.etymology.originForm ?? ""}
                  />
                </div>
                <div className="vocabulary-entry-editor__grid vocabulary-entry-editor__grid--two">
                  <TextAreaField
                    error={firstIssue(issues, "etymology.explanationTr")}
                    label="Turkish explanation"
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setDraft((current) => ({
                        ...current,
                        etymology:
                          current.etymology === undefined
                            ? undefined
                            : {
                                ...current.etymology,
                                explanationTr: value
                              }
                      }));
                    }}
                    rows={3}
                    value={draft.etymology.explanationTr}
                  />
                  <TextAreaField
                    error={firstIssue(issues, "etymology.explanationEn")}
                    label="English explanation"
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setDraft((current) => ({
                        ...current,
                        etymology:
                          current.etymology === undefined
                            ? undefined
                            : {
                                ...current.etymology,
                                explanationEn: value
                              }
                      }));
                    }}
                    rows={3}
                    value={draft.etymology.explanationEn}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </details>
    </>
  );
}
