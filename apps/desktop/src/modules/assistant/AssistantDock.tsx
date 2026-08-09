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

interface AssistantPreparationIssue {
  readonly message: string;
  readonly suggestions: readonly string[];
}

const HEADWORD_PATTERN = /^[A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2}$/u;
const QUOTED_TERM_PATTERN = /["“”']([^"“”']{1,72})["“”']/u;

const QUICK_ACTION_STARTERS: Readonly<Record<QuickAction, string>> = Object.freeze({
  simple: "Explain ",
  examples: "Use in a sentence: ",
  compare: "Compare ",
  breakdown: "Break down ",
  quiz: "Quiz me on "
});

function supportsAssistant(pathname: string): boolean {
  return pathname === ROUTE_PATHS.vocabulary || pathname === ROUTE_PATHS.library;
}

function cleanHeadwordCandidate(value: string): string | undefined {
  const candidate = value
    .trim()
    .replace(/^["“”']+|["“”'?.!,;:]+$/gu, "")
    .replace(/\s+(?:please|pls)$/iu, "")
    .trim();
  return HEADWORD_PATTERN.test(candidate) ? candidate : undefined;
}

function detectQuickAction(prompt: string): QuickAction | undefined {
  const normalized = prompt.toLocaleLowerCase("en-US");

  if (/\b(compare|difference|similar|synonym|karşılaştır|fark)\b/u.test(normalized)) {
    return "compare";
  }
  if (/\b(break down|breakdown|pronounce|pronunciation|syllable|spell|parçala|telaffuz)\b/u.test(normalized)) {
    return "breakdown";
  }
  if (/\b(quiz|test me|question me|beni test|soru sor)\b/u.test(normalized)) {
    return "quiz";
  }
  if (/\b(example|examples|sentence|sentences|use in a sentence|örnek|cümle)\b/u.test(normalized)) {
    return "examples";
  }
  if (/\b(explain|define|definition|meaning|simpler|simple|ne demek|açıkla|anlamı)\b/u.test(normalized)) {
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
    /(?:can|could|would)\s+you\s+(?:please\s+)?(?:explain|define)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})(?:\s+in\s+(?:simple|simpler|plain)\s+(?:english|words))?[?.!]*$/iu,
    /(?:please\s+)?(?:explain|define)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})(?:\s+in\s+(?:simple|simpler|plain)\s+(?:english|words))?[?.!]*$/iu,
    /what\s+(?:does|is)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+(?:mean|meaning)[?.!]*$/iu,
    /(?:what\s+is\s+the\s+)?meaning\s+of\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})[?.!]*$/iu,
    /(?:give\s+me\s+)?examples?\s+(?:for|of|with)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})[?.!]*$/iu,
    /use\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+in\s+(?:a\s+)?sentence[?.!]*$/iu,
    /(?:break\s+down|quiz\s+me\s+on)\s+([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})[?.!]*$/iu,
    /([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+ne\s+demek[?.!]*$/iu,
    /([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+(?:kelimesini\s+)?açıkla[?.!]*$/iu,
    /([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})\s+(?:için\s+)?(?:örnek|örnekler|cümle|cümleler)(?:\s+ver)?[?.!]*$/iu,
    /(?:örnek|örnekler|cümle|cümleler)\s+(?:ver\s+)?(?:için\s+)?([A-Za-z]+(?:['’-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)*){0,2})[?.!]*$/iu
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
  const translation = preview?.translationsTr[0];

  switch (action) {
    case "simple":
      return preview === undefined
        ? "Choose a word and I’ll explain it without dictionary jargon."
        : `Here’s the clearest way to understand “${word}”.`;
    case "examples":
      return preview?.exampleEn === undefined
        ? `I don’t have a verified example for “${word}” yet.`
        : `Here’s “${word}” in a natural sentence.`;
    case "compare":
      return preview === undefined
        ? "Choose a word first, then I’ll help you compare it with nearby words."
        : `Start with the core meaning of “${word}”, then compare where nearby words sound natural.`;
    case "breakdown":
      return preview === undefined
        ? "Choose a word first and I’ll break it into useful learning details."
        : `Here’s “${word}” at a glance.`;
    case "quiz":
      return translation === undefined
        ? "Choose a word first and I’ll give you a quick recall question."
        : `Quick check: without looking above, what does “${word}” mean in Turkish, and can you use it in one English sentence?`;
  }
}

function userFacingPreparationIssue(cause: unknown): AssistantPreparationIssue {
  const message = cause instanceof Error ? cause.message : String(cause);

  if (message.includes("assistant_word_not_found|")) {
    const payload = message.split("assistant_word_not_found|")[1] ?? "";
    const [word = "this word", suggestions = ""] = payload.split("|");
    const alternatives = suggestions
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    return {
      message:
        alternatives.length > 0
          ? `I couldn’t verify “${word}”. Pick the intended word below or edit your spelling.`
          : `I couldn’t verify “${word}”. Check the spelling and try again.`,
      suggestions: alternatives
    };
  }

  if (message.includes("assistant_quota_exhausted") || message.includes("usage limit")) {
    return {
      message: "Wordie has reached today’s request limit. Please try again later.",
      suggestions: []
    };
  }

  if (message.includes("assistant_api_key_rejected")) {
    return {
      message: "Wordie needs a quick setup in Settings before it can help with new words.",
      suggestions: []
    };
  }

  if (message.includes("assistant_dictionary_unavailable")) {
    return {
      message: "Wordie can’t check that word right now. Please try again in a moment.",
      suggestions: []
    };
  }

  if (message.includes("timed out") || message.includes("could not be reached")) {
    return {
      message: "Wordie couldn’t connect. Check your internet connection and try again.",
      suggestions: []
    };
  }

  return {
    message: "I couldn’t prepare that word right now. Please try again.",
    suggestions: []
  };
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
  const [typoSuggestions, setTypoSuggestions] = useState<readonly string[]>([]);
  const [activeAction, setActiveAction] = useState<QuickAction | undefined>();

  const visible = supportsAssistant(location.pathname);
  const isPreparing = mascotState === "thinking" && !isSaving;
  const isBusy = isPreparing || isSaving;
  const isWelcome = question === undefined && preview === undefined;
  const meaningText = preview?.definitionEn ?? "A verified English definition isn’t available yet.";
  const translationText = preview?.translationsTr.join(", ");
  const learningMeta = [
    preview?.partOfSpeech,
    preview?.cefr === undefined ? undefined : `CEFR ${preview.cefr}`
  ].filter((value): value is string => value !== undefined && value.length > 0);

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
    function handleDetailRailToggle(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const toggle = target.closest(".wvsr-detail-context-toggle");
      if (!(toggle instanceof HTMLButtonElement)) {
        return;
      }

      if (toggle.getAttribute("aria-expanded") !== "true") {
        return;
      }

      requestSequence.current += 1;
      setOpen(false);
    }

    document.addEventListener("click", handleDetailRailToggle);
    return () => document.removeEventListener("click", handleDetailRailToggle);
  }, []);

  useEffect(() => {
    function handleAssistantRequest(event: Event) {
      const detail = (event as CustomEvent<AssistantRequestDetail>).detail;

      if (detail.word !== undefined) {
        setInput(detail.word);
        setQuestion(undefined);
        setPreview(undefined);
        setSavePlan(undefined);
        setSaveError(undefined);
        setTypoSuggestions([]);
        setActiveAction(undefined);
        setAssistantMessage(`Ask me what you want to know about “${detail.word}”.`);
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
      setTypoSuggestions([]);
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
        setTypoSuggestions([]);
        setMascotState("confused");
        return;
      }

      const review = inspectAssistantCandidate(preparation.value, word, contentSource);

      if (review.kind === "invalid") {
        setAssistantMessage(`I couldn’t prepare a reliable explanation for “${word}”. Please try again.`);
        setTypoSuggestions([]);
        setMascotState("confused");
        return;
      }

      if (review.kind === "existing") {
        const nextPreview = createAssistantWordPreview(word, review.entry, "existing");
        setPreview(nextPreview);
        setSavePlan(undefined);
        setTypoSuggestions([]);
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
      setTypoSuggestions([]);
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

      const issue = userFacingPreparationIssue(cause);
      setAssistantMessage(issue.message);
      setTypoSuggestions(issue.suggestions);
      setMascotState("confused");
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
    setTypoSuggestions([]);
    setActiveAction(requestedAction);
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
          ? "You can ask naturally — for example: “What does allocate mean?”, “Use wreck in a sentence”, or “glorious ne demek?”."
          : `Ask naturally about “${preview.word}” — explain it, use it in a sentence, break it down, or quiz yourself.`
      );
      setMascotState("ready");
      return;
    }

    requestSequence.current += 1;
    const sequence = requestSequence.current;
    setPreview(undefined);
    setSavePlan(undefined);
    setAssistantMessage(`Checking “${word}”…`);
    setMascotState("thinking");
    void prepareSubmittedWord(word, sequence, requestedAction);
  }

  function retrySuggestion(suggestion: string) {
    requestSequence.current += 1;
    const sequence = requestSequence.current;
    setQuestion(suggestion);
    setInput("");
    setPreview(undefined);
    setSavePlan(undefined);
    setSaveError(undefined);
    setTypoSuggestions([]);
    setActiveAction(undefined);
    setAssistantMessage(`Checking “${suggestion}”…`);
    setMascotState("thinking");
    void prepareSubmittedWord(suggestion, sequence);
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

  function focusStarter(starter: string) {
    setInput(starter);
    window.requestAnimationFrame(() => {
      const composer = inputRef.current;
      if (composer === null) {
        return;
      }
      composer.focus();
      composer.setSelectionRange(starter.length, starter.length);
    });
  }

  function applyQuickAction(action: QuickAction) {
    setActiveAction(action);

    if (preview === undefined) {
      focusStarter(QUICK_ACTION_STARTERS[action]);
      return;
    }

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
                    Ask me the way you’d ask a teacher. I can explain a word, put it in context,
                    catch likely spelling mistakes, and help you remember it.
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

                    {typoSuggestions.length === 0 ? null : (
                      <div className="wv84-wordie-typo" aria-label="Spelling suggestions">
                        <span>Did you mean</span>
                        <div>
                          {typoSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => retrySuggestion(suggestion)}
                              type="button"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {preview === undefined || activeAction === "quiz" ? null : (
                      <div className="wv84-wordie-answer__body">
                        <section className="wv84-wordie-answer__section">
                          <span aria-hidden="true" className="wv84-leaf-mark" />
                          <div>
                            <h3>Meaning</h3>
                            <p>{meaningText}</p>
                            {translationText === undefined || translationText.length === 0 ? null : (
                              <small className="wv84-wordie-answer__translation">
                                {translationText}
                              </small>
                            )}
                          </div>
                        </section>

                        {preview.exampleEn === undefined ? null : (
                          <section className="wv84-wordie-answer__section">
                            <span aria-hidden="true" className="wv84-leaf-mark" />
                            <div>
                              <h3>Natural example</h3>
                              <p>{preview.exampleEn}</p>
                              {preview.exampleTr === undefined ? null : (
                                <small className="wv84-wordie-answer__translation">
                                  {preview.exampleTr}
                                </small>
                              )}
                            </div>
                          </section>
                        )}

                        {learningMeta.length === 0 ? null : (
                          <div className="wv84-wordie-answer__meta">
                            {learningMeta.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        )}
                      </div>
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
                    <strong>Explain a word</strong>
                    <small>Ask naturally and get the core meaning first.</small>
                  </span>
                </button>
                <button onClick={() => applyQuickAction("examples")} type="button">
                  <span className="wv84-quick-actions__icon"><AppIcon name="book-open" size={22} /></span>
                  <span className="wv84-quick-actions__copy">
                    <strong>Explore in context</strong>
                    <small>See the word in a natural sentence.</small>
                  </span>
                </button>
                <button onClick={() => applyQuickAction("quiz")} type="button">
                  <span className="wv84-quick-actions__icon"><AppIcon name="star" size={22} /></span>
                  <span className="wv84-quick-actions__copy">
                    <strong>Quiz me</strong>
                    <small>Check recall without revealing the answer first.</small>
                  </span>
                </button>
              </div>
            ) : (
              <div className="wv84-quick-actions wv84-quick-actions--contextual">
                <button onClick={() => applyQuickAction("examples")} type="button">Use in a sentence</button>
                <button onClick={() => applyQuickAction("compare")} type="button">Compare a similar word</button>
                <button onClick={() => applyQuickAction("breakdown")} type="button">Break it down</button>
                <button onClick={() => applyQuickAction("quiz")} type="button">Quiz me on this</button>
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
                    setTypoSuggestions([]);
                  }
                }}
                placeholder="Ask Wordie anything about a word…"
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
