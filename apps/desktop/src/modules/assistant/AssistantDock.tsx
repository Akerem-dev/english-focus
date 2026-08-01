import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import launcherFrame from "../../assets/assistant/assistant-launcher-closed.png";
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

const HEADWORD_PATTERN = /^[A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2}$/u;

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

function userFacingPreparationError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause);

  if (message.includes("assistant_word_not_found|")) {
    const payload = message.split("assistant_word_not_found|")[1] ?? "";
    const [word = "this word", suggestions = ""] = payload.split("|");
    const alternatives = suggestions
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    return alternatives.length > 0
      ? `I could not verify “${word}”. Did you mean ${alternatives.map((item) => `“${item}”`).join(", ")}?`
      : `I could not verify “${word}” as a standard English headword.`;
  }

  if (message.includes("assistant_quota_exhausted") || message.includes("usage limit")) {
    return "The daily Gemini limit has been reached. Please try again after it resets.";
  }

  if (message.includes("assistant_api_key_rejected")) {
    return "The saved Gemini API key was rejected. Replace it in Settings.";
  }

  if (message.includes("assistant_dictionary_unavailable")) {
    return "The dictionary check is unavailable right now. No AI entry was generated.";
  }

  if (message.includes("timed out") || message.includes("could not be reached")) {
    return "The word helper could not reach Gemini. Check your connection and try again.";
  }

  return "I could not prepare a reliable entry for this word. Please try again.";
}

export function AssistantDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prepareWord } = useAssistant();
  const { preferences } = useInstructionPreferences();
  const { contentSource, saveEntry } = useVocabularyRepository();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const requestSequence = useRef(0);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState<string | undefined>();
  const [assistantMessage, setAssistantMessage] = useState(
    "Type one English word. I will prepare its Turkish meaning and an example."
  );
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");
  const [preview, setPreview] = useState<AssistantWordPreviewModel | undefined>();
  const [savePlan, setSavePlan] = useState<AssistantSavePlan | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const visible = supportsAssistant(location.pathname);
  const isPreparing = mascotState === "thinking" && !isSaving;
  const isBusy = isPreparing || isSaving;

  useEffect(() => {
    if (visible) {
      return;
    }

    setOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpen(false);
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    function handleAssistantRequest(event: Event) {
      const detail = (event as CustomEvent<AssistantRequestDetail>).detail;

      if (detail.word !== undefined) {
        setInput(detail.word);
        setQuestion(undefined);
        setPreview(undefined);
        setSavePlan(undefined);
        setSaveError(undefined);
        setAssistantMessage(
          `“${detail.word}” is ready in the input. Press the arrow to prepare it.`
        );
      }

      setMascotState("ready");
      if (detail.kind === "open") {
        setOpen(true);
      }
    }

    window.addEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);
    return () => window.removeEventListener(ASSISTANT_REQUEST_EVENT, handleAssistantRequest);
  }, []);

  if (!visible) {
    return null;
  }

  function closeAssistant() {
    requestSequence.current += 1;
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function resetForAnotherWord() {
    requestSequence.current += 1;
    setInput("");
    setQuestion(undefined);
    setPreview(undefined);
    setSavePlan(undefined);
    setSaveError(undefined);
    setAssistantMessage("Type one English word. I will prepare its Turkish meaning and an example.");
    setMascotState("ready");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function prepareSubmittedWord(word: string, sequence: number): Promise<void> {
    const normalizedWord = word.toLocaleLowerCase("en-US");
    const existing = contentSource.getEntryByNormalizedWord(normalizedWord);

    if (existing !== undefined) {
      if (requestSequence.current !== sequence) {
        return;
      }

      setPreview(createAssistantWordPreview(word, existing, "existing"));
      setSavePlan(undefined);
      setAssistantMessage(`I found “${existing.word}” in your local library.`);
      setMascotState("ready");
      return;
    }

    try {
      const preparation = await prepareWord(word, preferences);

      if (requestSequence.current !== sequence) {
        return;
      }

      if (preparation.kind === "provider-unavailable") {
        const text =
          preparation.reason === "desktop-required"
            ? "Open the desktop app to prepare a missing word."
            : "Save a Gemini API key in Settings before preparing a missing word.";
        setAssistantMessage(text);
        setMascotState("confused");
        return;
      }

      const review = inspectAssistantCandidate(preparation.value, word, contentSource);

      if (review.kind === "invalid") {
        setAssistantMessage(`The entry prepared for “${word}” did not pass the app checks.`);
        setMascotState("confused");
        return;
      }

      if (review.kind === "existing") {
        setPreview(createAssistantWordPreview(word, review.entry, "existing"));
        setSavePlan(undefined);
        setAssistantMessage(`“${review.entry.word}” is already available locally.`);
        setMascotState("ready");
        return;
      }

      setPreview(createAssistantWordPreview(word, review.entry, "ready"));
      setSavePlan(review.plan);
      setAssistantMessage(`“${review.entry.word}” is ready to review.`);
      setMascotState("ready");
    } catch (cause) {
      if (requestSequence.current !== sequence) {
        return;
      }

      const message = userFacingPreparationError(cause);
      setAssistantMessage(message);
      setMascotState("confused");
      showToast({
        title: "Word not prepared",
        message,
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

    if (!HEADWORD_PATTERN.test(word)) {
      setQuestion(`What does “${word}” mean?`);
      setPreview(undefined);
      setSavePlan(undefined);
      setAssistantMessage("Please enter one English word or a short phrasal verb.");
      setMascotState("confused");
      inputRef.current?.focus();
      return;
    }

    requestSequence.current += 1;
    const sequence = requestSequence.current;
    setQuestion(`What does “${word}” mean?`);
    setPreview(undefined);
    setSavePlan(undefined);
    setSaveError(undefined);
    setAssistantMessage("Preparing a reliable entry…");
    setMascotState("thinking");
    setInput("");
    void prepareSubmittedWord(word, sequence);
  }

  async function addPreviewToLibrary(): Promise<void> {
    if (savePlan === undefined || preview?.state !== "ready") {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    setMascotState("thinking");

    try {
      const record = await saveEntry({ entry: savePlan.entry, layer: savePlan.layer });
      setPreview(createAssistantWordPreview(record.entry.word, record.entry, "saved"));
      setSavePlan(undefined);
      setAssistantMessage(`I added “${record.entry.word}” to your library.`);
      setMascotState("success");
      showToast({
        title: "Word added",
        message: `“${record.entry.word}” is now in your local library.`,
        tone: "success",
        dedupeKey: "assistant-vocabulary-save"
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "This word could not be saved.";
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

  function openExistingPreview() {
    if (preview?.complete !== true) {
      return;
    }

    navigate(buildVocabularyEntryPath(preview.normalizedWord));
    setOpen(false);
  }

  return (
    <aside className="assistant-dock" data-open={open || undefined}>
      {open ? (
        <section aria-label="Wordie word helper" className="assistant-panel" data-state={mascotState}>
          <header className="assistant-panel__header">
            <AssistantPanelMascot state={mascotState} />
            <div className="assistant-panel__heading">
              <h2>WORDIE</h2>
              <p aria-live="polite">{assistantMessage}</p>
            </div>
            <IconButton
              className="assistant-panel__close"
              icon={<AppIcon name="close" size={18} />}
              label="Close Wordie"
              onClick={closeAssistant}
              size="small"
            />
          </header>

          <div className="assistant-messages" data-has-preview={preview !== undefined || undefined}>
            {question === undefined ? null : (
              <div className="assistant-message" data-author="user">
                <p>{question}</p>
              </div>
            )}

            {preview === undefined ? (
              <div className="assistant-message" data-author="assistant">
                <p>{assistantMessage}</p>
              </div>
            ) : (
              <AssistantWordPreview
                isSaving={isSaving}
                onAdd={savePlan === undefined ? undefined : () => void addPreviewToLibrary()}
                onEdit={resetForAnotherWord}
                onOpenExisting={openExistingPreview}
                preview={preview}
                saveError={saveError}
              />
            )}
          </div>

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
                }
              }}
              placeholder="Ask about a word…"
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
              Send
            </Button>
          </form>
        </section>
      ) : (
        <button
          aria-label="Open Wordie"
          className="assistant-launcher"
          onClick={() => setOpen(true)}
          ref={launcherRef}
          title="Open Wordie"
          type="button"
        >
          <span aria-hidden="true" className="assistant-launcher__glow" />
          <img alt="" className="assistant-launcher__frame" src={launcherFrame} />
          <AssistantLauncherMascot awake={false} />
          <span aria-hidden="true" className="assistant-launcher__prompt">
            Need help with a word?
          </span>
        </button>
      )}
    </aside>
  );
}
