import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import type { PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeContextBridgeProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onExit: () => void;
}

function replaceTarget(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "i");
  return pattern.test(sentence) ? sentence.replace(pattern, "______") : sentence + "  ______";
}

export function PracticeContextBridge({
  deck,
  entries,
  onExit
}: PracticeContextBridgeProps) {
  const [index, setIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);

  const entryByWord = useMemo(
    () => new Map(entries.map((entry) => [entry.normalizedWord, entry] as const)),
    [entries]
  );

  const signal = deck[index];
  const entry = signal === undefined ? undefined : entryByWord.get(signal.normalizedWord);

  const deckEntries = useMemo(
    () =>
      deck
        .map((item) => entryByWord.get(item.normalizedWord))
        .filter((item): item is VocabularyEntry => item !== undefined),
    [deck, entryByWord]
  );

  if (signal === undefined || entry === undefined) {
    return (
      <section className="wvp-mode-screen">
        <button className="wvp-back-button" onClick={onExit} type="button">
          ← Practice Home
        </button>
        <div className="wvp-mode-empty">
          <h1>Context Bridge needs a few words first.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const example =
    entry.examples[0]?.sentenceEn ?? "Choose the word that best fits this context.";
  const sentence = replaceTarget(example, entry.word);

  const decoys = deckEntries
    .filter((candidate) => candidate.normalizedWord !== entry.normalizedWord)
    .slice(0, 3);

  const options = [entry, ...decoys]
    .sort((left, right) => left.word.localeCompare(right.word))
    .slice(0, 4);

  const progress = Math.round(((index + 1) / deck.length) * 100);
  const complete = index >= deck.length - 1;
  const correct = selectedWord === entry.normalizedWord;

  function next() {
    if (!checked) return;

    if (complete) {
      onExit();
      return;
    }

    setIndex((current) => current + 1);
    setSelectedWord(undefined);
    setChecked(false);
  }

  return (
    <section className="wvp-mode-screen" aria-labelledby="context-bridge-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Context Bridge</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {deck.length}
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="context-bridge-title">Context Bridge</h1>
        <p>Meaning in motion · choose the word that carries the sentence across.</p>
      </div>

      <section className="wvp-mode-hero">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.contextBridge} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>CONTEXT BRIDGE · CLOZE</span>
          <h2>Cross by meaning, not translation.</h2>
          <p>Read the whole sentence first. Nearby words are designed to look tempting.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card wvp-context-card">
          <p className="wvp-card-eyebrow">
            SENTENCE {index + 1} · {entry.cefr}
          </p>
          <p className="wvp-context-card__prompt">
            Choose the word that makes the sentence natural.
          </p>

          <div className="wvp-context-sentence">{sentence}</div>

          <div className="wvp-context-options" role="radiogroup" aria-label="Context choices">
            {options.map((candidate) => {
              const selected = selectedWord === candidate.normalizedWord;
              const state =
                checked && candidate.normalizedWord === entry.normalizedWord
                  ? "correct"
                  : checked && selected
                    ? "incorrect"
                    : selected
                      ? "selected"
                      : undefined;

              return (
                <button
                  aria-checked={selected}
                  data-state={state}
                  key={candidate.normalizedWord}
                  onClick={() => !checked && setSelectedWord(candidate.normalizedWord)}
                  role="radio"
                  type="button"
                >
                  <strong>{candidate.word}</strong>
                  <small>{candidate.meanings[0]?.definitionEn ?? "Vocabulary meaning"}</small>
                </button>
              );
            })}
          </div>

          {checked ? (
            <p className="wvp-context-feedback" data-correct={correct || undefined}>
              {correct
                ? "Correct — the word fits both meaning and sentence pattern."
                : "The natural fit here is “" + entry.word + "”."}
            </p>
          ) : null}

          <footer className="wvp-mode-card__footer">
            <span className="wvp-mode-footnote">
              Wordie explains the nuance after you commit.
            </span>
            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish" : "Next sentence"}
                <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={selectedWord === undefined}
                onClick={() => setChecked(true)}
                type="button"
              >
                Check choice
                <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>Context clues</h2>
          <p>Use the sentence around the gap.</p>

          <div className="wvp-context-clues">
            <div>
              <span>PART OF SPEECH</span>
              <strong>{entry.meanings[0]?.partOfSpeech ?? "word"}</strong>
            </div>
            <div>
              <span>LEVEL</span>
              <strong>{entry.cefr}</strong>
            </div>
            <div>
              <span>MEANING</span>
              <strong>{entry.meanings[0]?.definitionEn ?? entry.word}</strong>
            </div>
          </div>

          <div className="wvp-compare-panel">
            <span>CLOSE PAIR TO WATCH</span>
            <strong>
              {entry.word}
              {decoys[0] === undefined ? "" : " ≠ " + decoys[0].word}
            </strong>
          </div>

          <div className="wvp-wordie-inline">
            Ask Wordie why the closest alternative does not fit.
          </div>
        </aside>
      </div>
    </section>
  );
}
