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
const QUOTED_TERM_PATTERN = /["“”']([^"“”']{1,72})["“”']/u;

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

function cleanHeadwordCandidate(value: string): string | undefined {
  const candidate = value
    .trim()
    .replace(/^["“”']+|["“”'?.!,;:]+$/gu, "")
    .trim();
  return HEADWORD_PATTERN.test(candidate) ? candidate : undefined;
}

function detectQuickAction(prompt: string): QuickAction | undefined {
  const normalized = prompt.toLocaleLowerCase("en-US");

  if (/\b(compare|difference|similar|synonym|karşılaştır|fark)\b/u.test(normalized)) {
    return "compare";
  }
  if (/\b(break down|breakdown|pronounce|syllable|spell|parçala|telaffuz)\b/u.test(normalized)) {
    return "breakdown";
  }
  if (/\b(quiz|test me|question me|beni test|soru sor)\b/u.test(normalized)) {
    return "quiz";
  }
  if (/\b(example|examples|sentence|sentences|örnek|cümle)\b/u.test(normalized)) {
    return "examples";
  }
  if (/\b(explain|define|meaning|simpler|simple|ne demek|açıkla|anlamı)\b/u.test(normalized)) {
    return "simple";
  }

  return undefined;
}

function extractHeadword(prompt: string): string | undefined {
  const quoted = prompt.match(QUOTED_TERM_PATTERN)?.[1];
  if (quoted !== undefined) {
    const candidate = cleanHeadwordCandidate(quoted);
    if (candidate !== undefined) {
      return candidate;
    }
  }

  const direct = cleanHeadwordCandidate(prompt);
  if (direct !== undefined) {
    return direct;
  }

  const patterns = [
    /(?:can you\s+)?(?:explain|define)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})(?:\s+in\s+(?:simple|simpler)\s+words)?[?.!]*$/iu,
    /what does\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+mean[?.!]*$/iu,
    /(?:meaning of|examples?\s+(?:for|of|with)|compare|break down|quiz me on)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})[?.!]*$/iu,
    /([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+ne demek[?.!]*$/iu,
    /([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+(?:kelimesini\s+)?açıkla[?.!]*$/iu
  ];

  for (const pattern of patterns) {
    const candidate = prompt.match(pattern)?.[1];
    if (candidate !== undefined) {
      const cleaned = cleanHeadwordCandidate(candidate);
      if (cleaned !== undefined) {
        return cleaned;
      }
    }
  }

  return undefined;
}

function quickActionMessage(
  action: QuickAction,
  preview: AssistantWordPreviewModel | undefined
): string {
  const word = preview?.word ?? "this word";
  const definition = preview?.definitionEn;
  const translation = preview?.translationsTr[0];

  switch (action) {
    case "simple":
      if (translation !== undefined && definition !== undefined) {
        return `“${word}” means “${translation}”. In simple English: ${definition}`;
      }
      return definition ?? "Choose a word first and I’ll explain it in plain language.";
    case "examples":
      if (preview?.exampleEn !== undefined) {
        return preview.exampleTr === undefined
          ? `Example: ${preview.exampleEn}`
          : `Example: ${preview.exampleEn} — ${preview.exampleTr}`;
      }
      return `I don’t have an example for “${word}” yet. Choose a word and I’ll help you explore its usage.`;
    case "compare":
      return definition === undefined
        ? "Choose a word first, then I’ll help you compare it with similar words."
        : `“${word}” means ${definition} Compare it with a nearby word by noticing where each one sounds natural.`;
    case "breakdown": {
      const details = [
        preview?.partOfSpeech,
        preview?.cefr === undefined ? undefined : `CEFR ${preview.cefr}`
      ]
        .filter((value): value is string => value !== undefined)
        .join(" · ");
      return details.length === 0
        ? "Choose a word first and I’ll break it into meaning, form, and a memory cue."
        : `“${word}” — ${details}. Connect its meaning to the example sentence, then say the word once from memory.`;
    }
    case "quiz":
      return translation === undefined
        ? "Choose a word first and I’ll give you a quick recall question."
        : `Quick check: without looking above, what does “${word}” mean in Turkish, and can you use it in one English sentence?`;
  }
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
      ? `I couldn’t find “${word}”. Did you mean ${alternatives.map((item) => `“${item}”`).join(", ")}?`
      : `I couldn’t find “${word}”. Check the spelling and try again.`;
  }

  if (message.includes("assistant_quota_exhausted") || message.includes("usage limit")) {
    return "Wordie has reached today’s request limit. Please try again later.";
  }

  if (message.includes("assistant_api_key_rejected")) {
    return "Wordie needs a quick setup in Settings before it can help with new words.";
  }

  if (message.includes("assistant_dictionary_unavailable")) {
    return "Wordie can’t check that word right now. Please try again in a moment.";
  }

  if (message.includes("timed out") || message.includes("could not be reached")) {
    return "Wordie couldn’t connect. Check your internet connection and try again.";
  }

  return "I couldn’t prepare that word right now. Please try again.";
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
    "Tell me a word you’d like to understand better."
  );
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");
  const [preview, setPreview] = useState<AssistantWordPreviewModel | undefined>();
  const [savePlan, setSavePlan] = useState<AssistantSavePlan | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const visible = supportsAssistant(location.pathname);
  const isPreparing = mascotState === "thinking" && !isSaving;
  const isBusy = isPreparing || isSaving;
  const isWelcome = question === undefined && preview === undefined;
  const simpleExplanation =
    preview?.translationsTr[0] ??
    (preview?.definitionEn === undefined ? assistantMessage : preview.definitionEn);
  const comparison =
    preview?.definitionEn ?? "Think about the word in the situation where you found it.";
  const keyIdea = preview?.exampleEn ?? "Use the word in a short sentence to make it memorable.";

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
        setAssistantMessage(`“${detail.word}” is ready. Press the arrow when you’re ready.`);
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

  async function prepareSubmittedWord(
    word: string,
    sequence: number,
    requestedAction?: QuickAction
  ): Promise<void> {
    const normalizedWord = word.toLocaleLowerCase("en-US");
    const existing = contentSource.getEntryByNormalizedWord(normalizedWord);

    if (existing !== undefined) {
      if (requestSequence.current !== sequence) {
        return;
      }

      const nextPreview = createAssistantWordPreview(word, existing, "existing");
      setPreview(nextPreview);
      setSavePlan(undefined);
      setAssistantMessage(
        requestedAction === undefined
          ? `I found “${existing.word}” in your Wordbook.`
          : quickActionMessage(requestedAction, nextPreview)
      );
      setMascotState("ready");
      return;
    }

    try {
      const preparation = await prepareWord(word, preferences);

      if (requestSequence.current !== sequence) {
        return;
      }

      if (preparation.kind === "provider-unavailable") {
        setAssistantMessage(
          preparation.reason === "desktop-required"
            ? "Open Word Valley on desktop to explore a new word with Wordie."
            : "Finish Wordie setup in Settings to explore words that aren’t in your Wordbook yet."
        );
        setMascotState("confused");
        return;
      }

      const review = inspectAssistantCandidate(preparation.value, word, contentSource);

      if (review.kind === "invalid") {
        setAssistantMessage(`I couldn’t prepare a reliable explanation for “${word}”. Please try again.`);
        setMascotState("confused");
        return;
      }

      if (review.kind === "existing") {
        const nextPreview = createAssistantWordPreview(word, review.entry, "existing");
        setPreview(nextPreview);
        setSavePlan(undefined);
        setAssistantMessage(
          requestedAction === undefined
            ? `“${review.entry.word}” is already in your Wordbook.`
            : quickActionMessage(requestedAction, nextPreview)
        );
        setMascotState("ready");
        return;
      }

      const nextPreview = createAssistantWordPreview(word, review.entry, "ready");
      setPreview(nextPreview);
      setSavePlan(review.plan);
      setAssistantMessage(
        requestedAction === undefined
          ? `“${review.entry.word}” is ready to explore.`
          : quickActionMessage(requestedAction, nextPreview)
      );
      setMascotState("ready");
    } catch (cause) {
      if (requestSequence.current !== sequence) {
        return;
      }

      const message = userFacingPreparationError(cause);
      setAssistantMessage(message);
      setMascotState("confused");
      showToast({
        title: "Wordie needs another try",
        message,
        tone: "error",
        durationMs: 8_000,
        dedupeKey: "assistant-vocabulary-generation"
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();

    if (prompt.length === 0) {
      inputRef.current?.focus();
      return;
    }

    const requestedAction = detectQuickAction(prompt);
    const word = extractHeadword(prompt);
    setQuestion(prompt);
    setSaveError(undefined);
    setInput("");

    if (word === undefined) {
      setSavePlan(undefined);
      if (requestedAction !== undefined && preview !== undefined) {
        setAssistantMessage(quickActionMessage(requestedAction, preview));
        setMascotState("ready");
        return;
      }

      setAssistantMessage(
        preview === undefined
          ? "Try a word on its own, or ask something like “Explain allocate” or “Examples for spreadsheet”."
          : `Ask about “${preview.word}” with “explain simply”, “more examples”, “compare”, “break it down”, or “quiz me”.`
      );
      setMascotState("ready");
      return;
    }

    requestSequence.current += 1;
    const sequence = requestSequence.current;
    setPreview(undefined);
    setSavePlan(undefined);
    setAssistantMessage("Looking up the word…");
    setMascotState("thinking");
    void prepareSubmittedWord(word, sequence, requestedAction);
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
      setAssistantMessage(`I added “${record.entry.word}” to your Valley.`);
      setMascotState("success");
      showToast({
        title: "Added to your Valley",
        message: `“${record.entry.word}” is ready in your Wordbook.`,
        tone: "success",
        dedupeKey: "assistant-vocabulary-save"
      });
    } catch {
      const message = "That word couldn’t be saved. Please try again.";
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
    setAssistantMessage(quickActionMessage(action, preview));
  }

  return (
    <aside className="assistant-dock wv84-assistant" data-open={open || undefined}>
      {open ? (
        <>
          <section
            aria-label="Word helper"
            className="assistant-panel wv84-assistant-panel"
            data-state={mascotState}
            role="dialog"
          >
            <header className="wv84-assistant-panel__header">
              <AssistantPanelMascot state={mascotState} />
              <div>
                <h2>Wordie AI</h2>
                <p>Your vocabulary companion</p>
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
              {isWelcome ? (
                <article className="wv84-wordie-welcome">
                  <h3>Welcome.</h3>
                  <p>
                    I’m Wordie, your vocabulary companion. I can help you understand meanings,
                    see words in context, and remember what you learn.
                  </p>
                </article>
              ) : (
                <>
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
                        <strong>Wordie</strong>
                        <span>{assistantMessage}</span>
                      </div>
                    </header>

                    {preview === undefined ? null : (
                      <>
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
                      </>
                    )}

                    {preview?.state === "ready" && savePlan !== undefined ? (
                      <button
                        className="wv84-answer-action"
                        disabled={isSaving}
                        onClick={() => void addPreviewToLibrary()}
                        type="button"
                      >
                        {isSaving ? "Saving…" : "Save to Valley"}
                      </button>
                    ) : null}
                    {(preview?.state === "existing" || preview?.state === "saved") &&
                    preview.complete ? (
                      <button
                        className="wv84-answer-action"
                        onClick={openExistingPreview}
                        type="button"
                      >
                        Open word
                      </button>
                    ) : null}
                    {saveError === undefined ? null : <p className="wv84-answer-error">{saveError}</p>}
                  </article>
                </>
              )}
            </div>

            {isWelcome ? (
              <div className="wv84-quick-actions wv84-quick-actions--welcome">
                <span className="wv84-quick-actions__label">TRY ASKING ME</span>
                <button onClick={() => applyQuickAction("simple")} type="button">
                  <span className="wv84-quick-actions__icon"><AppIcon name="search" size={22} /></span>
                  <span className="wv84-quick-actions__copy">
                    <strong>Explain simply</strong>
                    <small>Break down a meaning in clear, simple terms.</small>
                  </span>
                </button>
                <button onClick={() => applyQuickAction("examples")} type="button">
                  <span className="wv84-quick-actions__icon"><AppIcon name="book-open" size={22} /></span>
                  <span className="wv84-quick-actions__copy">
                    <strong>Give examples</strong>
                    <small>See how a word is used in natural sentences.</small>
                  </span>
                </button>
                <button onClick={() => applyQuickAction("quiz")} type="button">
                  <span className="wv84-quick-actions__icon"><AppIcon name="star" size={22} /></span>
                  <span className="wv84-quick-actions__copy">
                    <strong>Quiz me</strong>
                    <small>Check your understanding with a quick question.</small>
                  </span>
                </button>
              </div>
            ) : (
              <div className="wv84-quick-actions">
                <button onClick={() => applyQuickAction("simple")} type="button">Explain simply</button>
                <button onClick={() => applyQuickAction("examples")} type="button">More examples</button>
                <button onClick={() => applyQuickAction("compare")} type="button">Compare words</button>
                <button onClick={() => applyQuickAction("breakdown")} type="button">Break it down</button>
                <button onClick={() => applyQuickAction("quiz")} type="button">Quiz me</button>
              </div>
            )}

            <form
              aria-busy={isBusy || undefined}
              className="wv84-assistant-composer"
              onSubmit={handleSubmit}
            >
              <label className="visually-hidden" htmlFor="assistant-word-input">
                Ask Wordie
              </label>
              <input
                autoComplete="off"
                disabled={isBusy}
                id="assistant-word-input"
                maxLength={120}
                onChange={(event) => {
                  setInput(event.currentTarget.value);
                  if (mascotState === "confused") {
                    setMascotState("ready");
                    setSaveError(undefined);
                  }
                }}
                placeholder="Ask about a word…"
                ref={inputRef}
                spellCheck={false}
                value={input}
              />
              <button
                aria-label="Send"
                disabled={input.trim().length === 0 || isBusy}
                type="submit"
              >
                <AppIcon name="chevron-right" size={22} />
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