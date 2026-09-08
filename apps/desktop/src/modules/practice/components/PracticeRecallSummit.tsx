import { useEffect, useMemo, useRef, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant/assistantEvents";
import type { PracticeSignal } from "../application/practiceEngine";
import type { PracticeSessionResult } from "../application/practiceSession";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeRecallSummitProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onComplete: (result: PracticeSessionResult) => void;
  readonly onExit: () => void;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function containsWord(sentence: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped + "\\b", "i").test(sentence);
}

export function PracticeRecallSummit({
  deck,
  entries,
  onComplete,
  onExit
}: PracticeRecallSummitProps) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const entryByWord = useMemo(
    () => new Map(entries.map((entry) => [entry.normalizedWord, entry] as const)),
    [entries]
  );

  const signal = deck[index];
  const entry = signal === undefined ? undefined : entryByWord.get(signal.normalizedWord);

  if (signal === undefined || entry === undefined) {
    return (
      <section className="wvp-mode-screen">
        <button className="wvp-back-button" onClick={onExit} type="button">
          ← Practice Home
        </button>
        <div className="wvp-mode-empty">
          <h1>Recall Summit needs a few words first.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const words = answer.trim().split(/\s+/u).filter(Boolean);
  const correct =
    normalize(answer).length > 0 && containsWord(answer, entry.word) && words.length >= 5;
  const progress = Math.round(((index + 1) / deck.length) * 100);
  const complete = index >= deck.length - 1;

  function finish(nextCorrectCount: number) {
    onComplete({
      mode: "Recall Summit",
      attempted: deck.length,
      correct: nextCorrectCount,
      durationSeconds: Math.max(
          1,
          Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000)
        ),
      completedAt: new Date().toISOString()
    });
  }

  function checkAnswer() {
    if (answer.trim().length === 0 || checked) return;

    setChecked(true);
    if (correct) {
      setCorrectCount((current) => current + 1);
    }
  }

  function next() {
    if (!checked) return;

    const nextCorrectCount = correctCount;

    if (complete) {
      finish(nextCorrectCount);
      return;
    }

    setIndex((current) => current + 1);
    setAnswer("");
    setChecked(false);
  }

  return (
    <section className="wvp-mode-screen" aria-labelledby="recall-summit-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Recall Summit</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {deck.length}
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="recall-summit-title">Recall Summit</h1>
        <p>Hard mode · no easy clues · prove you can produce the word yourself.</p>
      </div>

      <section className="wvp-mode-hero">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.recallSummit} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>RECALL SUMMIT · PRODUCTION</span>
          <h2>No options. No shortcuts.</h2>
          <p>Use the word naturally. Grammar and meaning both count.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card wvp-summit-card">
          <p className="wvp-card-eyebrow">CHALLENGE {index + 1} · FREE PRODUCTION</p>
          <h2 className="wvp-summit-card__prompt">
            Use “{entry.word}” in a natural English sentence.
          </h2>
          <p className="wvp-mode-card__meta">Make the meaning clear from context · {entry.cefr}</p>

          <textarea
            className="wvp-summit-input"
            disabled={checked}
            maxLength={180}
            onChange={(event) => setAnswer(event.currentTarget.value)}
            placeholder="Write your sentence here…"
            value={answer}
          />
          <span className="wvp-summit-counter">{answer.length} / 180</span>

          <div className="wvp-summit-chips">
            <span>No hints</span>
            <span>{entry.cefr} target</span>
            <span>Natural context</span>
          </div>

          {checked ? (
            <p className="wvp-context-feedback" data-correct={correct || undefined}>
              {correct
                ? "Strong production — the target word appears in a complete sentence."
                : "Use the exact target word in a fuller sentence before moving on."}
            </p>
          ) : null}

          <footer className="wvp-mode-card__footer">
            <button
              className="wvp-secondary-action"
              onClick={() =>
                dispatchAssistantRequest({
                  kind: "open",
                  word: entry.word
                })
              }
              type="button"
            >
              Ask Wordie
            </button>

            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish session" : "Next challenge"}
                <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={answer.trim().length === 0}
                onClick={checkAnswer}
                type="button"
              >
                Submit answer
                <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>Summit criteria</h2>
          <p>A strong answer shows more than recognition.</p>

          <div className="wvp-summit-criteria">
            {[
              ["Meaning is clear", true],
              ["Grammar is natural", words.length >= 5],
              ["Word form is present", containsWord(answer, entry.word)],
              ["Context is specific", words.length >= 7]
            ].map(([label, passed]) => (
              <div key={String(label)}>
                <span data-passed={checked && passed ? true : undefined}>
                  {checked && passed ? "✓" : "○"}
                </span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>

          <div className="wvp-compare-panel">
            <span>IF YOU MISS IT</span>
            <p>The word returns later in a lower-pressure format.</p>
          </div>

          <button
            className="wvp-wordie-inline wvp-wordie-inline--button"
            onClick={() =>
              dispatchAssistantRequest({
                kind: "open",
                word: entry.word
              })
            }
            type="button"
          >
            Wordie can explain feedback after submission.
          </button>
        </aside>
      </div>
    </section>
  );
}
