import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useGrammar } from "../../app/providers";
import { IconButton } from "../../components";
import { AppIcon, type AppIconName } from "../../design-system";
import {
  AssistantLauncherMascot,
  AssistantPanelMascot,
  type AssistantMascotState
} from "./AssistantMascot";

import "../../styles/word-valley-grammar-reference-rail.css";
import "../../styles/word-valley-grammar-v17-wordie.css";
import "../../styles/word-valley-grammar-v17-wordie-isolation.css";

interface GrammarStarter {
  readonly title: string;
  readonly description: string;
  readonly prompt: string;
  readonly icon: AppIconName;
}

function structuredLessonPrompt(topic: string): string {
  return [
    `${topic} için Word Valley öğretim şablonunda ayrıntılı bir grammar lesson note hazırla.`,
    "Şu 8 bölümü sırayla ve eksiksiz doldur:",
    "1) Meaning first: yapı hangi anlamı taşır ve öğrenci neyi fark etmeli?",
    "2) Core formula: positive, negative ve question formunu parçalarına ayır.",
    "3) When to use: temel kullanım durumlarını doğal örneklerle açıkla.",
    "4) Examples: en az 5 doğal İngilizce örnek, Türkçe karşılık ve neden bu yapının seçildiği.",
    "5) Compare & contrast: en çok karıştığı yapıyla karar kuralını göster.",
    "6) Common mistakes: wrong → correct → why formatında en az 3 hata.",
    "7) Clues: signal words/patterns ver ama bunların otomatik tense düğmesi olmadığını özellikle belirt.",
    "8) Quick rule: 3 ana kural, 3 tuzak ve tek cümlelik memory hook.",
    "Anlatım seviyesini konu seviyesine uygun tut; ezber yerine anlam ve karar mantığını öne çıkar."
  ].join("\n");
}

function buildStarters(
  focus: ReturnType<typeof useGrammar>["lessonFocus"]
): readonly GrammarStarter[] {
  if (focus === undefined) {
    return Object.freeze([
      {
        title: "Explain a rule",
        description: "Bir grammar kuralını sade mantıkla açıkla.",
        prompt: "Bir İngilizce grammar kuralını kısa Türkçe mantıkla açıklar mısın?",
        icon: "book-open" as const
      },
      {
        title: "Compare grammar points",
        description: "Karışan iki yapının farkını göster.",
        prompt:
          "Sık karıştırılan iki İngilizce grammar yapısını anlam ve kullanım üzerinden karşılaştır.",
        icon: "books" as const
      },
      {
        title: "Draft lesson template",
        description: "8 bölümlü Word Valley şablonunu hazırla.",
        prompt: structuredLessonPrompt("Seçeceğim grammar konusu"),
        icon: "book-open" as const
      },
      {
        title: "Quick grammar quiz",
        description: "Tek hızlı grammar sorusu çöz.",
        prompt: "Bana tek hızlı bir İngilizce grammar quiz sorusu hazırla.",
        icon: "star" as const
      }
    ]);
  }

  const compareTitle =
    focus.compareWith === undefined ? "Compare this topic" : `Compare with ${focus.compareWith}`;
  const comparePrompt =
    focus.compareWith === undefined
      ? `${focus.title} konusunu en çok karıştırılan benzer yapıyla anlam ve kullanım üzerinden karşılaştır.`
      : `${focus.title} ile ${focus.compareWith} arasındaki farkı anlam, zaman ve kullanım üzerinden göster.`;

  return Object.freeze([
    {
      title: "Explain this rule",
      description: "Kuralı daha basit ve Türkçe mantıkla anlat.",
      prompt: `${focus.title} kuralını kısa Türkçe mantıkla açıkla.`,
      icon: "book-open" as const
    },
    {
      title: compareTitle,
      description: "Benzer yapıyla farkını ve karar kuralını göster.",
      prompt: comparePrompt,
      icon: "books" as const
    },
    {
      title: "Draft lesson template",
      description: "Bu konu için 8 bölümlü detaylı Word Valley notu hazırla.",
      prompt: structuredLessonPrompt(focus.title),
      icon: "book-open" as const
    },
    {
      title: "Give another example",
      description: "Yeni ve doğal bir örnek ver, nedenini açıkla.",
      prompt: `${focus.title} için yeni ve doğal bir İngilizce örnek cümle ver ve neden bu yapının kullanıldığını kısaca açıkla.`,
      icon: "book-open" as const
    },
    {
      title: "Quiz me",
      description: "Bu konudan hızlı soru sor.",
      prompt: `${focus.title} konusunda tek hızlı quiz sorusu hazırla.`,
      icon: "star" as const
    },
    {
      title: "Why is this wrong?",
      description: "Hatanın nedenini ve doğru kararı açıkla.",
      prompt: `${focus.title} konusunda sık yapılan bir hatayı göster, doğru halini ver ve neden yanlış olduğunu açıkla.`,
      icon: "check" as const
    }
  ]);
}

export function GrammarAssistantDock() {
  const { lessonFocus } = useGrammar();
  return <GrammarAssistantSession key={lessonFocus?.id ?? "grammar-home"} />;
}

function GrammarAssistantSession() {
  const { answerGrammarQuestion, lessonFocus } = useGrammar();
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const minimizeTimerRef = useRef<number | undefined>(undefined);
  const requestSequence = useRef(0);

  const [open, setOpen] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState<string | undefined>();
  const [answerText, setAnswerText] = useState<string | undefined>();
  const [assistantMessage, setAssistantMessage] = useState(
    "Ask me a grammar question the way you’d ask a teacher."
  );
  const [mascotState, setMascotState] = useState<AssistantMascotState>("ready");
  const starters = useMemo(() => buildStarters(lessonFocus), [lessonFocus]);

  const isBusy = mascotState === "thinking";
  const isWelcome = question === undefined && answerText === undefined;

  const focusLauncher = useCallback(() => {
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  function openAssistant() {
    if (minimizeTimerRef.current !== undefined) {
      window.clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = undefined;
    }
    setIsMinimizing(false);
    setOpen(true);
  }

  const closeAssistant = useCallback(() => {
    if (minimizeTimerRef.current !== undefined) {
      window.clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = undefined;
    }
    requestSequence.current += 1;
    setIsMinimizing(false);
    setOpen(false);
    focusLauncher();
  }, [focusLauncher]);

  function minimizeAssistant() {
    if (isMinimizing) return;
    setIsMinimizing(true);
    minimizeTimerRef.current = window.setTimeout(() => {
      minimizeTimerRef.current = undefined;
      setOpen(false);
      setIsMinimizing(false);
      focusLauncher();
    }, 210);
  }

  useEffect(() => {
    return () => {
      if (minimizeTimerRef.current !== undefined) {
        window.clearTimeout(minimizeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAssistant();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAssistant, open]);

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

  const welcomeCopy =
    lessonFocus?.id === "present-perfect"
      ? "Bu konuyu çalışırken kural açıklaması, Present Perfect ile Past Simple karşılaştırması, yeni örnek, detaylı lesson template ya da kısa bir quiz isteyebilirsin."
      : lessonFocus === undefined
        ? "Bir grammar konusu seçebilir veya aklına takılan kuralı, karşılaştırmayı, örneği ya da Word Valley lesson template'ini doğrudan isteyebilirsin."
        : `${lessonFocus.title} çalışırken kuralı açıklamamı, benzer yapılarla karşılaştırmamı, detaylı lesson template hazırlamamı veya sana kısa bir quiz vermemi isteyebilirsin.`;

  return (
    <aside
      className="assistant-dock wv84-assistant wvg-wordie-dock"
      data-minimizing={isMinimizing || undefined}
      data-open={open || undefined}
    >
      {open ? (
        <section
          aria-label="Grammar helper"
          className="assistant-panel wv84-assistant-panel"
          data-state={mascotState}
          role="dialog"
        >
          <header className="wv84-assistant-panel__header">
            <AssistantPanelMascot state={mascotState} />
            <div>
              <h2>Wordie AI</h2>
              <p>Your grammar companion</p>
            </div>
            <div className="wvg-wordie-panel__controls">
              <button
                aria-label="Minimize Wordie"
                className="wvg-wordie-panel__minimize"
                onClick={minimizeAssistant}
                title="Minimize Wordie"
                type="button"
              >
                <span aria-hidden="true">−</span>
              </button>
              <IconButton
                className="wv84-assistant-panel__close"
                icon={<AppIcon name="close" size={18} />}
                label="Close Wordie"
                onClick={closeAssistant}
                size="small"
              />
            </div>
          </header>

          <div className="wv84-assistant-panel__conversation">
            {isWelcome ? (
              <article className="wv84-wordie-welcome">
                <h3>Welcome.</h3>
                <p>{welcomeCopy}</p>
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
              {starters.map((starter) => (
                <button
                  aria-label={starter.title}
                  key={starter.title}
                  onClick={() => focusStarter(starter.prompt)}
                  type="button"
                >
                  <span className="wv84-quick-actions__icon">
                    <AppIcon name={starter.icon} size={22} />
                  </span>
                  <span className="wv84-quick-actions__copy">
                    <strong>{starter.title}</strong>
                    <small>{starter.description}</small>
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
              maxLength={1200}
              onChange={(event) => {
                setInput(event.currentTarget.value);
                if (mascotState === "confused") setMascotState("ready");
              }}
              placeholder={
                lessonFocus === undefined
                  ? "Ask Wordie a grammar question..."
                  : "Ask about this grammar..."
              }
              ref={inputRef}
              spellCheck={false}
              value={input}
            />
            <button aria-label="Send" disabled={input.trim().length === 0 || isBusy} type="submit">
              <AppIcon name="chevron-right" size={22} />
            </button>
          </form>
        </section>
      ) : (
        <button
          aria-expanded={false}
          aria-label="Open Wordie"
          className="assistant-launcher wv84-assistant-launcher wvg-wordie-bubble"
          onClick={openAssistant}
          ref={launcherRef}
          title="Ask Wordie"
          type="button"
        >
          <AssistantLauncherMascot awake={false} />
          <span className="wvg-wordie-bubble__label">Wordie</span>
        </button>
      )}
    </aside>
  );
}
