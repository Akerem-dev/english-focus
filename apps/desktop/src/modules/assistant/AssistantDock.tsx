import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  useAssistant,
  useInstructionPreferences,
  useToast,
  useVocabularyRepository
} from "../../app/providers";
import { buildVocabularyEntryPath, ROUTE_PATHS } from "../../app/router";
import { Button, IconButton } from "../../components";
import { AppIcon } from "../../design-system";
import type { VocabularyPersistencePlan } from "../import-export/application";
import { inspectAssistantCandidate } from "./application";
import { ASSISTANT_REQUEST_EVENT, type AssistantRequestDetail } from "./assistantEvents";
import launcherFrame from "./assets/launcher/assistant-launcher-frame.png";
import {
  AssistantLauncherMascot,
  AssistantPanelMascot,
  type AssistantMascotState
} from "./AssistantMascot";
import {
  AssistantWordPreview,
  createAssistantWordPreview,
  type AssistantWordPreviewModel
} from "./AssistantWordPreview";

type AssistantSavePlan = Extract<VocabularyPersistencePlan, { readonly kind: "save" }>;

type AssistantMessage = Readonly<{
  id: number;
  author: "assistant" | "user";
  text: string;
}>;

type PreparationErrorPresentation = Readonly<{
  message: string;
  needsConnectionSettings: boolean;
}>;

const INITIAL_MESSAGES: readonly AssistantMessage[] = Object.freeze([
  {
    id: 1,
    author: "assistant",
    text: "Type one English word. I will prepare it for review before anything is saved."
  }
]);

const STATUS_BY_STATE: Readonly<Record<AssistantMascotState, string>> = Object.freeze({
  ready: "Add a word to your library",
  thinking: "Preparing a reliable entry",
  success: "Saved to your library",
  confused: "This needs your attention",
  sleeping: "Resting nearby"
});

const HEADWORD_PATTERN = /^[A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2}$/u;

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

function isPlausibleHeadword(value: string): boolean {
  return HEADWORD_PATTERN.test(value);
}

function appendReply(
  current: readonly AssistantMessage[],
  id: number,
  text: string
): readonly AssistantMessage[] {
  return Object.freeze([
    ...current.slice(-2),
    {
      id,
      author: "assistant" as const,
      text
    }
  ]);
}

function userFacingSaveError(cause: unknown): string {
  if (cause instanceof Error && cause.message.includes("desktop app")) {
    return "Open the English Focus desktop app to save this word.";
  }

  return "This word could not be saved. Please try again.";
}

function userFacingPreparationError(cause: unknown): PreparationErrorPresentation {
  const message = cause instanceof Error ? cause.message : String(cause);

  if (message.includes("assistant_quota_exhausted") || message.includes("usage limit")) {
    return {
      message: "The daily Gemini limit has been reached. Try again after the quota resets.",
      needsConnectionSettings: false
    };
  }

  if (message.includes("assistant_api_key_rejected") || message.includes("API key was rejected")) {
    return {
      message: "The saved API key was not accepted. Replace it in Settings.",
      needsConnectionSettings: true
    };
  }

  if (message.includes("could not be reached") || message.includes("timed out")) {
    return {
      message: "The word helper could not reach Gemini. Check your connection and try again.",
      needsConnectionSettings: false
    };
  }

  if (message.includes("assistant_request_rejected")) {
    return {
      message: "Gemini could not accept this word request. Please try again.",
      needsConnectionSettings: false
    };
  }

  if (message.includes("assistant_generation_invalid")) {
    return {
      message: "The prepared entry did not pass English Focus checks. Please try again.",
      needsConnectionSettings: false
    };
  }

  if (message.includes("assistant_provider_error")) {
    return {
      message: "Gemini is unavailable right now. Please try again shortly.",
      needsConnectionSettings: false
    };
  }

  return {
    message: "I could not prepare a reliable entry for this word. Please try again.",
    needsConnectionSettings: false
  };
}

export function AssistantDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connection, prepareWord } = useAssistant();
  const { preferences } = useInstructionPreferences();
  const { contentSource, saveEntry } = useVocabularyRepository();
  const { showToast } = useToast();
  const titleId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const attentionTimerRef = useRef<number | undefined>(undefined);
  const preparationSequenceRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [input, setInput] = useState("");
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");
  const [messages, setMessages] = useState<readonly AssistantMessage[]>(INITIAL_MESSAGES);
  const [preview, setPreview] = useState<AssistantWordPreviewModel | undefined>();
  const [savePlan, setSavePlan] = useState<AssistantSavePlan | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [needsConnectionSettings, setNeedsConnectionSettings] = useState(false);
  const visible = supportsAssistant(location.pathname);
  const isPreparing = mascotState === "thinking" && !isSaving;
  const isBusy = isPreparing || isSaving;
  const launcherState = attention ? "awake" : "sleeping";
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.author === "assistant")?.text;

  useEffect(() => {
    if (visible) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setOpen(false);
      setAttention(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [visible]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setAttention(false);
      inputRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const viewport = messagesRef.current;
      if (viewport !== null) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages, open, preview]);

  useEffect(() => {
    function handleAssistantRequest(event: Event) {
      const detail = (event as CustomEvent<AssistantRequestDetail>).detail;

      if (detail.word !== undefined) {
        setInput(detail.word);
        setPreview(undefined);
        setSavePlan(undefined);
        setSaveError(undefined);
        setNeedsConnectionSettings(false);
        setMessages(INITIAL_MESSAGES);
      }

      preparationSequenceRef.current += 1;
      setMascotState("ready");
      setAttention(false);
      window.clearTimeout(attentionTimerRef.current);

      window.requestAnimationFrame(() => {
        setAttention(true);
      });

      attentionTimerRef.current = window.setTimeout(() => {
        setAttention(false);
      }, 1100);

      if (detail.kind === "open") {
        setOpen(true);
      }
    }

    window.addEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);

    return () => {
      window.removeEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);
      window.clearTimeout(attentionTimerRef.current);
      preparationSequenceRef.current += 1;
    };
  }, []);

  if (!visible) {
    return null;
  }

  function clearReview() {
    setPreview(undefined);
    setSavePlan(undefined);
    setSaveError(undefined);
    setIsSaving(false);
  }

  function closeAssistant() {
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function openAssistant() {
    setMascotState("ready");
    setOpen(true);
  }

  function focusWordInput() {
    preparationSequenceRef.current += 1;
    clearReview();
    setInput("");
    setNeedsConnectionSettings(false);
    setMessages(INITIAL_MESSAGES);
    openAssistant();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function editPreviewWord() {
    if (preview === undefined) {
      return;
    }

    preparationSequenceRef.current += 1;
    setInput(preview.word);
    clearReview();
    setNeedsConnectionSettings(false);
    setMessages(INITIAL_MESSAGES);
    setMascotState("ready");
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function openExistingPreview() {
    if (preview?.complete !== true) {
      return;
    }

    navigate(buildVocabularyEntryPath(preview.normalizedWord));
    setOpen(false);
  }

  function restoreWordForRetry(word: string) {
    setInput(word);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  async function finishPreparation(
    word: string,
    messageId: number,
    sequence: number
  ): Promise<void> {
    const normalizedWord = word.toLocaleLowerCase("en-US");
    const existingEntry = contentSource.getEntryByNormalizedWord(normalizedWord);

    if (existingEntry !== undefined) {
      if (sequence !== preparationSequenceRef.current) {
        return;
      }

      const nextPreview = createAssistantWordPreview(word, existingEntry, "existing");
      setPreview(nextPreview);
      setNeedsConnectionSettings(false);
      setMessages((current) =>
        appendReply(
          current,
          messageId + 1,
          `I found “${nextPreview.word}” in your local vocabulary.`
        )
      );
      setMascotState("ready");
      return;
    }

    try {
      const preparation = await prepareWord(word, preferences);

      if (sequence !== preparationSequenceRef.current) {
        return;
      }

      if (preparation.kind === "provider-unavailable") {
        const text =
          preparation.reason === "desktop-required"
            ? "Open the English Focus desktop app to prepare missing words. Browser preview can still open local entries."
            : "Save a Gemini API key in Settings before preparing a missing word.";
        setPreview(undefined);
        setSavePlan(undefined);
        setNeedsConnectionSettings(preparation.reason === "not-configured");
        setMascotState("confused");
        setMessages((current) => appendReply(current, messageId + 1, text));
        restoreWordForRetry(word);
        return;
      }

      const review = inspectAssistantCandidate(preparation.value, word, contentSource);

      if (review.kind === "invalid") {
        setPreview(undefined);
        setSavePlan(undefined);
        setNeedsConnectionSettings(false);
        setMascotState("confused");
        setMessages((current) =>
          appendReply(
            current,
            messageId + 1,
            `The entry prepared for “${word}” did not pass the app checks. Please try again.`
          )
        );
        restoreWordForRetry(word);
        return;
      }

      if (review.kind === "existing") {
        const nextPreview = createAssistantWordPreview(word, review.entry, "existing");
        setPreview(nextPreview);
        setSavePlan(undefined);
        setNeedsConnectionSettings(false);
        setMessages((current) =>
          appendReply(current, messageId + 1, `“${nextPreview.word}” is already available locally.`)
        );
        setMascotState("ready");
        return;
      }

      const nextPreview = createAssistantWordPreview(word, review.entry, "ready");
      setPreview(nextPreview);
      setSavePlan(review.plan);
      setNeedsConnectionSettings(false);
      setMessages((current) =>
        appendReply(
          current,
          messageId + 1,
          `“${nextPreview.word}” is ready. Check it before adding it.`
        )
      );
      setMascotState("ready");
    } catch (cause) {
      if (sequence !== preparationSequenceRef.current) {
        return;
      }

      const presentation = userFacingPreparationError(cause);
      setPreview(undefined);
      setSavePlan(undefined);
      setNeedsConnectionSettings(presentation.needsConnectionSettings);
      setMascotState("confused");
      setMessages((current) => appendReply(current, messageId + 1, presentation.message));
      restoreWordForRetry(word);
      showToast({
        title: "Word not prepared",
        message: presentation.message,
        tone: "error",
        durationMs: 8_000,
        dedupeKey: "assistant-vocabulary-generation"
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = input.trim();

    if (word.length === 0) {
      inputRef.current?.focus();
      return;
    }

    const messageId = Date.now();

    if (!isPlausibleHeadword(word)) {
      clearReview();
      setNeedsConnectionSettings(false);
      setMascotState("confused");
      setMessages([
        {
          id: messageId,
          author: "assistant",
          text: "Please enter one English word or a short phrasal verb."
        }
      ]);
      inputRef.current?.focus();
      return;
    }

    preparationSequenceRef.current += 1;
    const sequence = preparationSequenceRef.current;
    clearReview();
    setNeedsConnectionSettings(false);
    setMascotState("thinking");
    setMessages([{ id: messageId, author: "user", text: word }]);
    setInput("");
    void finishPreparation(word, messageId, sequence);
  }

  async function addPreviewToLibrary(): Promise<void> {
    if (savePlan === undefined || preview?.state !== "ready") {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    setMascotState("thinking");

    try {
      const record = await saveEntry({
        entry: savePlan.entry,
        layer: savePlan.layer
      });
      const savedPreview = createAssistantWordPreview(record.entry.word, record.entry, "saved");
      setPreview(savedPreview);
      setSavePlan(undefined);
      setMascotState("success");
      setMessages((current) =>
        appendReply(current, Date.now(), `I added “${record.entry.word}” to your library.`)
      );
      showToast({
        title: "Word added",
        message: `“${record.entry.word}” is now in your local library.`,
        tone: "success",
        dedupeKey: "assistant-vocabulary-save"
      });
    } catch (cause) {
      const message = userFacingSaveError(cause);
      setSaveError(message);
      setMascotState("confused");
      showToast({
        title: "Word not saved",
        message,
        tone: "error",
        durationMs: 8_000,
        dedupeKey: "assistant-vocabulary-save"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <aside className="assistant-dock" data-open={open || undefined}>
      {open ? (
        <section
          aria-describedby={statusId}
          aria-labelledby={titleId}
          aria-modal="false"
          className="assistant-panel"
          data-state={mascotState}
          role="dialog"
        >
          <header className="assistant-panel__header">
            <AssistantPanelMascot state={mascotState} />
            <div className="assistant-panel__heading">
              <h2 id={titleId}>Word helper</h2>
              <p aria-atomic="true" aria-live="polite" id={statusId}>
                {STATUS_BY_STATE[mascotState]}
              </p>
            </div>
            <IconButton
              className="assistant-panel__close"
              icon={<AppIcon name="close" size={18} />}
              label="Close word helper"
              onClick={closeAssistant}
              size="small"
            />
          </header>

          <p aria-atomic="true" aria-live="polite" className="visually-hidden" role="status">
            {latestAssistantMessage ?? STATUS_BY_STATE[mascotState]}
          </p>

          <div
            aria-busy={isBusy || undefined}
            className="assistant-messages"
            data-has-preview={preview !== undefined || undefined}
            ref={messagesRef}
          >
            {messages.map((message) => (
              <div className="assistant-message" data-author={message.author} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
            {preview === undefined ? null : (
              <AssistantWordPreview
                isSaving={isSaving}
                onAdd={savePlan === undefined ? undefined : () => void addPreviewToLibrary()}
                onEdit={editPreviewWord}
                onOpenExisting={openExistingPreview}
                preview={preview}
                saveError={saveError}
              />
            )}
          </div>

          {preview === undefined ? (
            <div className="assistant-shortcuts" aria-label="Word helper suggestions">
              <button disabled={isBusy} onClick={focusWordInput} type="button">
                <AppIcon name="book-open" size={18} />
                <span>Prepare another word</span>
              </button>
              {!connection.configured || needsConnectionSettings ? (
                <button
                  disabled={isBusy}
                  onClick={() => {
                    navigate(ROUTE_PATHS.settings);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <AppIcon name="settings" size={18} />
                  <span>Open connection settings</span>
                </button>
              ) : (
                <button
                  disabled={isBusy}
                  onClick={() => {
                    navigate(ROUTE_PATHS.library);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <AppIcon name="books" size={18} />
                  <span>Open recent words</span>
                </button>
              )}
            </div>
          ) : null}

          <form aria-busy={isBusy || undefined} className="assistant-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="assistant-word-input">
              English word
            </label>
            <input
              autoComplete="off"
              disabled={isBusy}
              id="assistant-word-input"
              maxLength={80}
              onChange={(event) => {
                setInput(event.currentTarget.value);
                if (mascotState === "confused") {
                  setMascotState("ready");
                  setSaveError(undefined);
                  setNeedsConnectionSettings(false);
                }
              }}
              placeholder="Type an English word"
              ref={inputRef}
              spellCheck="false"
              value={input}
            />
            <Button
              disabled={input.trim().length === 0 || isBusy}
              isLoading={isPreparing}
              size="small"
              type="submit"
              variant="primary"
            >
              Prepare
            </Button>
          </form>
        </section>
      ) : (
        <button
          aria-label="Open word helper"
          className="assistant-launcher"
          data-attention={attention || undefined}
          data-state={launcherState}
          onClick={openAssistant}
          ref={launcherRef}
          title="Open word helper"
          type="button"
        >
          <span aria-hidden="true" className="assistant-launcher__glow" />
          <img alt="" className="assistant-launcher__frame" src={launcherFrame} />
          <AssistantLauncherMascot awake={attention} />
        </button>
      )}
    </aside>
  );
}
