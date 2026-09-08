import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant/assistantEvents";
import type { PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticePhraseFallsProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onExit: () => void;
}

function phraseFromExample(entry: VocabularyEntry): string {
  const sentence = entry.examples[0]?.sentenceEn;
  if (sentence === undefined) return entry.word + " ______";

  const escaped = entry.word.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "i");
  return pattern.test(sentence) ? sentence.replace(pattern, "______") : "______ · " + sentence;
}

export function PracticePhraseFalls({ deck, entries, onExit }: PracticePhraseFallsProps) {
  const [index, setIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);

  const entryByWord = useMemo(
    () => new Map(entries.map((entry) => [entry.normalizedWord, entry] as const)),
    [entries]
  );

  const signal = deck[index];
  const entry = signal === undefined ? undefined : entryByWord.get(signal.normalizedWord);

  const alternatives = useMemo(
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
          <h1>Phrase Falls needs a few words first.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const decoys = alternatives
    .filter((candidate) => candidate.normalizedWord !== entry.normalizedWord)
    .slice(0, 3);

  const options = [entry, ...decoys]
    .sort((left, right) => left.word.localeCompare(right.word))
    .slice(0, 4);

  const phrase = phraseFromExample(entry);
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
    <section className="wvp-mode-screen" aria-labelledby="phrase-falls-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Phrase Falls</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {deck.length}
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="phrase-falls-title">Phrase Falls</h1>
        <p>Collocations & word partners · learn which words naturally belong together.</p>
      </div>

      <section className="wvp-mode-hero">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.phraseFalls} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>PHRASE FALLS · WORD PARTNERS</span>
          <h2>Find the words that flow together.</h2>
          <p>Build natural combinations instead of memorizing isolated translations.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card wvp-phrase-card">
          <p className="wvp-card-eyebrow">
            PHRASE {index + 1} · WORD PARTNER
          </p>
          <p className="wvp-context-card__prompt">
            Which word naturally completes this phrase or sentence?
          </p>

          <div className="wvp-phrase-stem">{phrase}</div>

          <div className="wvp-context-options" role="radiogroup" aria-label="Phrase choices">
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
                  <small>{candidate.meanings[0]?.definitionEn ?? "Word partner"}</small>
                </button>
              );
            })}
          </div>

          {checked ? (
            <p className="wvp-context-feedback" data-correct={correct || undefined}>
              {correct
                ? "Correct — this is the natural word in the original context."
                : "The natural partner here is “" + entry.word + "”."}
            </p>
          ) : null}

          <footer className="wvp-mode-card__footer">
            <span className="wvp-mode-footnote">
              Similar meanings can still form different natural phrases.
            </span>
            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish" : "Next phrase"}
                <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={selectedWord === undefined}
                onClick={() => setChecked(true)}
                type="button"
              >
                Check phrase
                <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>Word partners</h2>
          <p>Strong vocabulary includes combinations, not only meanings.</p>

          <div className="wvp-phrase-partners">
            <span>ORIGINAL CONTEXT</span>
            <strong>{entry.examples[0]?.sentenceEn ?? entry.word}</strong>
          </div>

          <div className="wvp-phrase-partners">
            <span>WORD TO ANCHOR</span>
            <strong>{entry.word}</strong>
          </div>

          <div className="wvp-compare-panel">
            <span>WATCH THE TRAP</span>
            <p>Meaning may fit, but a phrase can still sound unnatural.</p>
          </div>

          <button
            className="wvp-wordie-inline wvp-wordie-inline--button"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            Wordie can explain why two word combinations differ.
          </button>
        </aside>
      </div>
    </section>
  );
}
