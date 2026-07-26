import type { VocabularyEntry } from "@platform/domain";

import { Button } from "../../components";

export interface AssistantWordPreviewModel {
  readonly word: string;
  readonly normalizedWord: string;
  readonly partOfSpeech?: string | undefined;
  readonly cefr?: string | undefined;
  readonly translationsTr: readonly string[];
  readonly definitionEn?: string | undefined;
  readonly exampleEn?: string | undefined;
  readonly exampleTr?: string | undefined;
  readonly complete: boolean;
}

function formatPartOfSpeech(value: string): string {
  const normalized = value.replaceAll("-", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function createAssistantWordPreview(
  word: string,
  entry?: VocabularyEntry
): AssistantWordPreviewModel {
  if (entry === undefined) {
    return {
      word,
      normalizedWord: word.trim().toLocaleLowerCase("en-US"),
      translationsTr: Object.freeze([]),
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
    complete: true
  };
}

interface AssistantWordPreviewProps {
  readonly preview: AssistantWordPreviewModel;
  readonly onEdit: () => void;
  readonly onOpenExisting?: (() => void) | undefined;
}

export function AssistantWordPreview({
  onEdit,
  onOpenExisting,
  preview
}: AssistantWordPreviewProps) {
  const metadata = [preview.partOfSpeech, preview.cefr].filter(
    (value): value is string => value !== undefined
  );

  return (
    <article className="assistant-preview" data-complete={preview.complete || undefined}>
      <header className="assistant-preview__header">
        <div>
          <p className="assistant-preview__eyebrow">
            {preview.complete ? "Local entry" : "Review"}
          </p>
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
        <p>{preview.complete ? "Already available locally." : "Nothing has been saved."}</p>
        <div className="assistant-preview__actions">
          <Button onClick={onEdit} size="small" variant="ghost">
            Change word
          </Button>
          {preview.complete && onOpenExisting !== undefined ? (
            <Button onClick={onOpenExisting} size="small" variant="secondary">
              View word
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
