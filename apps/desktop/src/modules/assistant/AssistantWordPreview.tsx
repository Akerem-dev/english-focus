import type { VocabularyEntry } from "@platform/domain";

import { Button } from "../../components";

export type AssistantWordPreviewState = "waiting" | "existing" | "ready" | "saved";

export interface AssistantWordPreviewModel {
  readonly word: string;
  readonly normalizedWord: string;
  readonly partOfSpeech?: string | undefined;
  readonly cefr?: string | undefined;
  readonly translationsTr: readonly string[];
  readonly definitionEn?: string | undefined;
  readonly exampleEn?: string | undefined;
  readonly exampleTr?: string | undefined;
  readonly state: AssistantWordPreviewState;
  readonly complete: boolean;
}

function formatPartOfSpeech(value: string): string {
  const normalized = value.replaceAll("-", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function createAssistantWordPreview(
  word: string,
  entry?: VocabularyEntry,
  state: AssistantWordPreviewState = entry === undefined ? "waiting" : "existing"
): AssistantWordPreviewModel {
  if (entry === undefined) {
    return {
      word,
      normalizedWord: word.trim().toLocaleLowerCase("en-US"),
      translationsTr: Object.freeze([]),
      state: "waiting",
      complete: false
    };
  }

  const primaryMeaning = entry.meanings[0];
  const primaryExample = entry.examples[0];
  const partOfSpeech = primaryMeaning?.partOfSpeech ?? entry.partsOfSpeech[0];

  return {
    word: entry.word,
    normalizedWord: entry.normalizedWord,
    ...(partOfSpeech === undefined
      ? {}
      : { partOfSpeech: formatPartOfSpeech(partOfSpeech) }),
    cefr: entry.cefr,
    translationsTr: Object.freeze([...(primaryMeaning?.translationsTr ?? [])]),
    ...(primaryMeaning?.definitionEn === undefined
      ? {}
      : { definitionEn: primaryMeaning.definitionEn }),
    ...(primaryExample?.sentenceEn === undefined ? {} : { exampleEn: primaryExample.sentenceEn }),
    ...(primaryExample?.translationTr === undefined
      ? {}
      : { exampleTr: primaryExample.translationTr }),
    state,
    complete: true
  };
}

const EYEBROW_BY_STATE: Readonly<Record<AssistantWordPreviewState, string>> = Object.freeze({
  waiting: "Review",
  existing: "Local entry",
  ready: "Ready to add",
  saved: "Added"
});

const FOOTER_BY_STATE: Readonly<Record<AssistantWordPreviewState, string>> = Object.freeze({
  waiting: "Nothing has been saved.",
  existing: "Already available locally.",
  ready: "Review the details, then add the word.",
  saved: "Saved to your local library."
});

interface AssistantWordPreviewProps {
  readonly preview: AssistantWordPreviewModel;
  readonly onEdit: () => void;
  readonly onAdd?: (() => void) | undefined;
  readonly onOpenExisting?: (() => void) | undefined;
  readonly isSaving?: boolean | undefined;
  readonly saveError?: string | undefined;
}

export function AssistantWordPreview({
  isSaving = false,
  onAdd,
  onEdit,
  onOpenExisting,
  preview,
  saveError
}: AssistantWordPreviewProps) {
  const metadata = [preview.partOfSpeech, preview.cefr].filter(
    (value): value is string => value !== undefined
  );
  const canOpen =
    (preview.state === "existing" || preview.state === "saved") &&
    onOpenExisting !== undefined;
  const canAdd = preview.state === "ready" && onAdd !== undefined;

  return (
    <article
      className="assistant-preview"
      data-complete={preview.complete || undefined}
      data-state={preview.state}
    >
      <header className="assistant-preview__header">
        <div>
          <p className="assistant-preview__eyebrow">{EYEBROW_BY_STATE[preview.state]}</p>
          <h3>{preview.word}</h3>
        </div>
        {metadata.length === 0 ? null : (
          <p className="assistant-preview__metadata">{metadata.join(" · ")}</p>
        )}
      </header>

      <div className="assistant-preview__content">
        <section>
          <h4>Turkish meaning</h4>
          <p data-empty={preview.translationsTr.length === 0 || undefined}>
            {preview.translationsTr.length > 0
              ? preview.translationsTr.join(", ")
              : "The Turkish meaning will appear here before this word can be added."}
          </p>
        </section>

        <section>
          <h4>English definition</h4>
          <p data-empty={preview.definitionEn === undefined || undefined}>
            {preview.definitionEn ??
              "A clear English definition will appear here before you review the word."}
          </p>
        </section>

        <section>
          <h4>Example</h4>
          <p data-empty={preview.exampleEn === undefined || undefined}>
            {preview.exampleEn ?? "A natural English example will appear here."}
          </p>
          {preview.exampleTr === undefined ? null : (
            <p className="assistant-preview__translation">{preview.exampleTr}</p>
          )}
        </section>
      </div>

      <footer className="assistant-preview__footer">
        <div className="assistant-preview__status">
          <p>{FOOTER_BY_STATE[preview.state]}</p>
          {saveError === undefined ? null : <p data-error="true">{saveError}</p>}
        </div>
        <div className="assistant-preview__actions">
          {preview.state === "saved" ? null : (
            <Button disabled={isSaving} onClick={onEdit} size="small" variant="ghost">
              Change word
            </Button>
          )}
          {canOpen ? (
            <Button onClick={onOpenExisting} size="small" variant="secondary">
              View word
            </Button>
          ) : null}
          {canAdd ? (
            <Button isLoading={isSaving} onClick={onAdd} size="small" variant="primary">
              Add to Library
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
