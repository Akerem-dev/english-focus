import { useId, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { useAssistant } from "../../app/providers";
import { Button, IconButton } from "../../components";
import { AppIcon } from "../../design-system";

type AssistantWordPreviewState = "waiting" | "existing" | "ready" | "saved";
type PronunciationStatus = "idle" | "playing" | "error";

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
    ...(partOfSpeech === undefined ? {} : { partOfSpeech: formatPartOfSpeech(partOfSpeech) }),
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
  waiting: "Preparing preview",
  existing: "Already in your Wordbook",
  ready: "Ready for your Wordbook",
  saved: "Added to your Wordbook"
});

const FOOTER_BY_STATE: Readonly<Record<AssistantWordPreviewState, string>> = Object.freeze({
  waiting: "Nothing has been saved yet.",
  existing: "This word is already available in your Wordbook.",
  ready: "Review the details, then add the word to your Wordbook.",
  saved: "Saved to your local Wordbook."
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
  const { pronounceWord } = useAssistant();
  const titleId = useId();
  const statusId = useId();
  const [pronunciation, setPronunciation] = useState<{
    readonly word: string;
    readonly status: PronunciationStatus;
  }>({ word: "", status: "idle" });
  const pronunciationStatus =
    pronunciation.word === preview.normalizedWord ? pronunciation.status : "idle";
  const metadata = [preview.partOfSpeech, preview.cefr].filter(
    (value): value is string => value !== undefined
  );
  const canOpen =
    (preview.state === "existing" || preview.state === "saved") && onOpenExisting !== undefined;
  const canAdd = preview.state === "ready" && onAdd !== undefined;
  const pronunciationLabel =
    pronunciationStatus === "playing"
      ? `Playing ${preview.word}`
      : pronunciationStatus === "error"
        ? `Pronunciation unavailable for ${preview.word}`
        : `Pronounce ${preview.word}`;

  async function handlePronunciation(): Promise<void> {
    setPronunciation({ word: preview.normalizedWord, status: "playing" });

    try {
      await pronounceWord(preview.word);
      setPronunciation({ word: preview.normalizedWord, status: "idle" });
    } catch {
      setPronunciation({ word: preview.normalizedWord, status: "error" });
    }
  }

  return (
    <article
      aria-busy={isSaving || undefined}
      aria-describedby={statusId}
      aria-labelledby={titleId}
      className="assistant-preview"
      data-complete={preview.complete || undefined}
      data-state={preview.state}
    >
      <header className="assistant-preview__header">
        <div>
          <p className="assistant-preview__eyebrow">{EYEBROW_BY_STATE[preview.state]}</p>
          <div className="assistant-preview__title-row">
            <h3 id={titleId}>{preview.word}</h3>
            {preview.complete ? (
              <IconButton
                className="assistant-preview__pronunciation"
                data-error={pronunciationStatus === "error" || undefined}
                data-playing={pronunciationStatus === "playing" || undefined}
                disabled={pronunciationStatus === "playing"}
                icon={<AppIcon name="volume" size={16} />}
                label={pronunciationLabel}
                onClick={() => void handlePronunciation()}
                size="small"
                variant="quiet"
              />
            ) : null}
          </div>
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
        <div className="assistant-preview__status" id={statusId}>
          <p>{FOOTER_BY_STATE[preview.state]}</p>
          {pronunciationStatus === "error" ? (
            <p data-error="true" role="alert">
              Pronunciation is unavailable on this device.
            </p>
          ) : null}
          {saveError === undefined ? null : (
            <p data-error="true" role="alert">
              {saveError}
            </p>
          )}
        </div>
        <div className="assistant-preview__actions">
          {preview.state === "saved" ? null : (
            <Button disabled={isSaving} onClick={onEdit} size="small" variant="ghost">
              Change word
            </Button>
          )}
          {canOpen ? (
            <Button disabled={isSaving} onClick={onOpenExisting} size="small" variant="secondary">
              Open in Wordbook
            </Button>
          ) : null}
          {canAdd ? (
            <Button
              disabled={isSaving}
              isLoading={isSaving}
              onClick={onAdd}
              size="small"
              variant="primary"
            >
              Add to Wordbook
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
