import { useRef, useState, type FormEvent } from "react";

import { useGrammar } from "../../app/providers";
import { IconButton } from "../../components";
import { AppIcon } from "../../design-system";
import {
  AssistantLauncherMascot,
  AssistantPanelMascot,
  type AssistantMascotState
} from "./AssistantMascot";

import "../../styles/word-valley-grammar-reference-rail.css";

const STARTERS = Object.freeze([
  "Present Perfect kuralını kısa Türkçe mantıkla açıkla.",
  "Present Perfect ile Past Simple arasındaki farkı anlam, zaman ve kullanım üzerinden göster.",
  "Present Perfect konusunda tek hızlı quiz sorusu hazırla."
]);

const STARTER_TITLES = Object.freeze([
  "Explain this rule",
  "Compare with Past Simple",
  "Quiz this grammar"
]);

const STARTER_DESCRIPTIONS = Object.freeze([
  "Kuralı kısa Türkçe mantıkla açıkla.",
  "Anlam, zaman ve kullanım farkını göster.",
  "Bu konudan tek hızlı soru çöz."
]);

export function GrammarAssistantDock() {
  const { answerGrammarQuestion } = useGrammar();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const requestSequence = useRef(0);

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState<string | undefined>();
  const [answerText, setAnswerText] = useState<string | undefined>();
  const [assistantMessage, setAssistantMessage] = useState(
    "Ask me a grammar question the way you’d ask a teacher."
  );
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");

  const isBusy = mascotState === "thinking";
  const isWelcome = question === undefined && answerText === undefined;

  function openAssistant() {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeAssistant() {
    requestSequence.current += 1;
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function focusStarter(starter: string) {
    setInput(starter);
    window.requestAnimationFrame(() => {
      const composer = inputRef.current;
      if (composer === null) return;
      composer.focus();
      composer.setSelectionRange(starter.length, starter.length);
    });
  }

  async function submitGrammarQuestion(prompt: string): Promise<void> {
    requestSequence.current += 1;
    const sequence = requestSequence.current;

    setQuestion(prompt);
    setAnswerText(undefined);
    setAssistantMessage("Let me work through that…");
    setMascotState("thinking");

    try {
      const result = await answerGrammarQuestion(prompt);
      if (requestSequence.current !== sequence) return;

      if (result.kind === "local") {
        setAnswerText(result.answer.answerText);
        setAssistantMessage(`Here’s the clearest rule for ${result.answer.topicName}.`);
        setMascotState("ready");
        return;
      }

      if (result.kind === "desktop-required") {
        setAssistantMessage("This grammar answer is available in the Word Valley desktop app.");
        setMascotState("confused");
        return;
      }

      setAssistantMessage(
        "I’m not confident enough to answer that precisely. Try asking about the rule, a comparison, or an example."
      );
      setMascotState("confused");
    } catch {
      if (requestSequence.current !== sequence) return;
      setAssistantMessage("I couldn’t answer that just now. Please try again.");
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

    setInput("");
    void submitGrammarQuestion(prompt);
  }

  return (
    <aside className="assistant-dock wv84-assistant" data-open={open || undefined}>
      {open ? (
        <>
          <section
            aria-label="Grammar helper"
            className="assistant-panel wv84-assistant-panel"
            data-state={mascotState}
            role="dialog"
          >
            <header className="wv84-assistant-panel__header">
              <AssistantPanelMascot state={mascotState} />
              <div>
                <h2>Wordie</h2>
                <p>Your grammar companion</p>
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
                    Bu konuyu çalışırken kuralı açıklamamı, Present Perfect ile Past Simple’ı
                    karşılaştırmamı veya sana kısa bir quiz hazırlamamı isteyebilirsin.
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

                    {answerText === undefined ? null : (
                      <div className="wv84-wordie-answer__body">
                        <section className="wv84-wordie-answer__section">
                          <span aria-hidden="true" className="wv84-leaf-mark" />
                          <div>
                            <h3>Explanation</h3>
                            {answerText
                              .split("\n")
                              .filter((paragraph) => paragraph.trim().length > 0)
                              .map((paragraph, index) => (
                                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                              ))}
                          </div>
                        </section>
                      </div>
                    )}
                  </article>
                </>
              )}
            </div>

            {isWelcome ? (
              <div className="wv84-quick-actions wv84-quick-actions--welcome">
                <span className="wv84-quick-actions__label">TRY ASKING ME</span>
                {STARTERS.map((starter, index) => (
                  <button key={starter} onClick={() => focusStarter(starter)} type="button">
                    <span className="wv84-quick-actions__icon">
                      <AppIcon
                        name={index === 0 ? "book-open" : index === 1 ? "books" : "star"}
                        size={22}
                      />
                    </span>
                    <span className="wv84-quick-actions__copy">
                      <strong>{STARTER_TITLES[index]}</strong>
                      <small>{STARTER_DESCRIPTIONS[index]}</small>
                    </span>
                    <AppIcon className="wv84-quick-actions__arrow" name="chevron-right" size={18} />
                  </button>
                ))}
              </div>
            ) : null}

            <form
              aria-busy={isBusy || undefined}
              className="wv84-assistant-composer"
              onSubmit={handleSubmit}
            >
              <label className="visually-hidden" htmlFor="grammar-assistant-input">
                Ask Wordie a grammar question
              </label>
              <input
                autoComplete="off"
                disabled={isBusy}
                id="grammar-assistant-input"
                maxLength={500}
                onChange={(event) => {
                  setInput(event.currentTarget.value);
                  if (mascotState === "confused") setMascotState("ready");
                }}
                placeholder="Ask about this grammar…"
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
          onClick={openAssistant}
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
