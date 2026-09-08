import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant/assistantEvents";
import type { PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeWordForgeProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onExit: () => void;
}

function promptFor(entry: VocabularyEntry): string {
  return entry.meanings[0]?.translationsTr[0] ?? entry.meanings[0]?.definitionEn ?? entry.word;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function PracticeWordForge({ deck, entries, onExit }: PracticeWordForgeProps) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [checked, setChecked] = useState(false);

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
          <h1>Word Forge needs a few words first.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const progress = Math.round(((index + 1) / deck.length) * 100);
  const complete = index >= deck.length - 1;
  const correct = normalize(answer) === normalize(entry.word);
  const revealed = hintUsed ? entry.word.slice(0, 1) : "";
  const heat = Math.max(
    28,
    Math.min(92, 42 + signal.viewCount * 7 + (signal.learningStatus === "known" ? 24 : 0))
  );

  function next() {
    if (!checked) return;
    if (complete) {
      onExit();
      return;
    }
    setIndex((current) => current + 1);
    setAnswer("");
    setHintUsed(false);
    setChecked(false);
  }

  return (
    <section className="wvp-mode-screen" aria-labelledby="word-forge-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Word Forge</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {deck.length}
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="word-forge-title">Word Forge</h1>
        <p>Active recall · turn meaning into a word without multiple choice.</p>
      </div>

      <section className="wvp-mode-hero wvp-mode-hero--forge">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.wordForge} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>WORD FORGE · ACTIVE RECALL</span>
          <h2>Shape the word from memory.</h2>
          <p>No answer choices. Pull the English word out of memory, then check the form.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: `${progress}%` }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card wvp-forge-card">
          <p className="wvp-card-eyebrow">WORD {index + 1} · ENGLISH FROM TURKISH</p>
          <h2 className="wvp-forge-card__meaning">{promptFor(entry)}</h2>
          <p className="wvp-mode-card__meta">
            {entry.meanings[0]?.partOfSpeech ?? "word"} · {entry.cefr}
          </p>

          <label className="wvp-forge-input-label" htmlFor="word-forge-answer">
            Type the English word
          </label>
          <div
            className="wvp-forge-input-wrap"
            data-state={checked ? (correct ? "correct" : "incorrect") : undefined}
          >
            <input
              autoComplete="off"
              disabled={checked}
              id="word-forge-answer"
              onChange={(event) => setAnswer(event.currentTarget.value)}
              placeholder={revealed === "" ? "Type from memory…" : `${revealed}…`}
              spellCheck={false}
              value={answer}
            />
            {checked && correct ? <AppIcon name="check" size={20} /> : null}
          </div>

          <div className="wvp-letter-slots" aria-hidden="true">
            {entry.word.split("").map((letter, letterIndex) => (
              <span key={`${letter}-${letterIndex}`}>
                {hintUsed && letterIndex === 0 ? letter : "·"}
              </span>
            ))}
          </div>

          {checked ? (
            <p className="wvp-forge-feedback" data-correct={correct || undefined}>
              {correct ? "Correct — clean active recall." : `The word was “${entry.word}”.`}
            </p>
          ) : null}

          <footer className="wvp-mode-card__footer">
            <button
              className="wvp-secondary-action"
              disabled={checked || hintUsed}
              onClick={() => setHintUsed(true)}
              type="button"
            >
              Reveal first letter
            </button>
            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish" : "Next word"} <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={answer.trim().length === 0}
                onClick={() => setChecked(true)}
                type="button"
              >
                Check word <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>Forge notes</h2>
          <p className="wvp-side-kicker">FORM TO REMEMBER</p>
          <strong className="wvp-forge-form">{entry.word}</strong>

          <div className="wvp-forge-rules">
            <h3>What counts as strong recall?</h3>
            <p>
              <AppIcon name="check" size={14} />
              Correct without a hint
            </p>
            <p>
              <AppIcon name="check" size={14} />
              Spelling is exact
            </p>
            <p>
              <AppIcon name="check" size={14} />
              Response is reasonably quick
            </p>
          </div>

          <div className="wvp-forge-heat">
            <span>FORGE HEAT</span>
            <div>
              <i style={{ width: `${heat}%` }} />
            </div>
          </div>

          <button
            className="wvp-wordie-inline wvp-wordie-inline--button"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            Ask Wordie about spelling or word form.
          </button>
        </aside>
      </div>
    </section>
  );
}
