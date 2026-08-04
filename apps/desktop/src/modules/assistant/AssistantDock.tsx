import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  useAssistant,
  useInstructionPreferences,
  useToast,
  useVocabularyRepository
} from "../../app/providers";
import { buildVocabularyEntryPath, ROUTE_PATHS } from "../../app/router";
import { IconButton } from "../../components";
import { AppIcon } from "../../design-system";
import type { VocabularyPersistencePlan } from "../import-export/application";
import { inspectAssistantCandidate } from "./application";
import { ASSISTANT_REQUEST_EVENT, type AssistantRequestDetail } from "./assistantEvents";
import {
  AssistantLauncherMascot,
  AssistantPanelMascot,
  type AssistantMascotState
} from "./AssistantMascot";
import { createAssistantWordPreview, type AssistantWordPreviewModel } from "./AssistantWordPreview";

type AssistantSavePlan = Extract<VocabularyPersistencePlan, { readonly kind: "save" }>;
type QuickAction = "simple" | "examples" | "compare" | "breakdown" | "quiz";

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
  const simpleExplanation =
    preview?.translationsTr[0] ??
    (preview?.definitionEn === undefined ? assistantMessage : preview.definitionEn);
  const comparison =
    preview?.definitionEn ?? "Think about the word in the situation where you found it.";
  const keyIdea = preview?.exampleEn ?? "Use the word in a short sentence to make it memorable.";

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
      setQuestion(`Can you explain “${word}” in simpler words?`);
      setPreview(undefined);
      setSavePlan(undefined);
      setAssistantMessage("Please enter one English word or a short phrasal verb.");
      setMascotState("confused");
      inputRef.current?.focus();
      return;
    }

    requestSequence.current += 1;
    const sequence = requestSequence.current;
    setQuestion(`Can you explain “${word}” in simpler words?`);
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

  function applyQuickAction(action: QuickAction) {
    const word = preview?.word ?? "this word";
    const messages: Record<QuickAction, string> = {
      simple: `Here is the simplest useful meaning of “${word}”.`,
      examples: preview?.exampleEn ?? `Try using “${word}” in a short sentence of your own.`,
      compare: `Compare “${word}” with a word that feels similar, then notice the context.`,
      breakdown: `Break “${word}” into sound, meaning, and one memorable example.`,
      quiz: `Quick check: can you explain “${word}” without looking at the definition?`
    };
    setAssistantMessage(messages[action]);
  }

  return (
    <aside className="assistant-dock wv84-assistant" data-open={open || undefined}>
      {open ? (
        <>
          <section
            aria-label="Wordie word helper"
            className="assistant-panel wv84-assistant-panel"
            data-state={mascotState}
          >
            <header className="wv84-assistant-panel__header">
              <AssistantPanelMascot state={mascotState} />
              <div>
                <h2>Wordie AI</h2>
                <p>Your learning companion</p>
              </div>
              <IconButton
                className="wv84-assistant-panel__close"
                icon={<AppIcon name="close" size={18} />}
                label="Close Wordie"
                onClick={closeAssistant}
                size="small"
              />
            </header>

            <div className="wv84-assistant-panel__conversation">
              {question === undefined ? null : (
                <div className="wv84-user-message">
                  <span>YOU</span>
                  <p>{question}</p>
                </div>
              )}

              <article aria-live="polite" className="wv84-wordie-answer">
                <header>
                  <AssistantPanelMascot state={mascotState} />
                  <div>
                    <strong>Wordie AI</strong>
                    <span>{assistantMessage}</span>
                  </div>
                </header>
                <section>
                  <span aria-hidden="true" className="wv84-leaf-mark" />
                  <div>
                    <h3>In simple words</h3>
                    <p>{simpleExplanation}</p>
                  </div>
                </section>
                <section>
                  <span aria-hidden="true" className="wv84-leaf-mark" />
                  <div>
                    <h3>Think of it like</h3>
                    <p>{comparison}</p>
                  </div>
                </section>
                <section>
                  <span aria-hidden="true" className="wv84-leaf-mark" />
                  <div>
                    <h3>Key idea</h3>
                    <p>{keyIdea}</p>
                  </div>
                </section>

                {preview?.state === "ready" && savePlan !== undefined ? (
                  <button
                    className="wv84-answer-action"
                    disabled={isSaving}
                    onClick={() => void addPreviewToLibrary()}
                    type="button"
                  >
                    {isSaving ? "Saving…" : "Save to Library"}
                  </button>
                ) : null}
                {(preview?.state === "existing" || preview?.state === "saved") &&
                preview.complete ? (
                  <button
                    className="wv84-answer-action"
                    onClick={openExistingPreview}
                    type="button"
                  >
                    Open in Wordbook
                  </button>
                ) : null}
                {saveError === undefined ? null : <p className="wv84-answer-error">{saveError}</p>}
              </article>
            </div>

            <div className="wv84-quick-actions">
              <button onClick={() => applyQuickAction("simple")} type="button">
                <span aria-hidden="true" className="wv84-leaf-mark" />
                Explain simply
              </button>
              <button onClick={() => applyQuickAction("examples")} type="button">
                <AppIcon name="book-open" size={20} />
                More examples
              </button>
              <button onClick={() => applyQuickAction("compare")} type="button">
                <AppIcon name="star" size={20} />
                Compare words
              </button>
              <button onClick={() => applyQuickAction("breakdown")} type="button">
                <AppIcon name="edit" size={20} />
                Break it down
              </button>
              <button onClick={() => applyQuickAction("quiz")} type="button">
                <AppIcon name="bookmark" size={20} />
                Quiz me
              </button>
            </div>

            <form
              aria-busy={isBusy || undefined}
              className="wv84-assistant-composer"
              onSubmit={handleSubmit}
            >
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
                placeholder="Ask Wordie anything…"
                ref={inputRef}
                spellCheck="false"
                value={input}
              />
              <button
                aria-label="Send"
                disabled={input.trim().length === 0 || isBusy}
                type="submit"
              >
                <AppIcon name="chevron-right" size={24} />
              </button>
            </form>
          </section>

          <div aria-hidden="true" className="wv84-assistant__ready-mascot">
            <AssistantLauncherMascot awake />
          </div>
        </>
      ) : (
        <button
          aria-label="Open Wordie"
          className="assistant-launcher wv84-assistant-launcher"
          onClick={() => setOpen(true)}
          ref={launcherRef}
          title="Open Wordie"
          type="button"
        >
          <AssistantLauncherMascot awake={false} />
        </button>
      )}
    </aside>
  );
}
