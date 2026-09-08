import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant/assistantEvents";
import type { PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeMistakeMineProps {
  readonly signals: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onExit: () => void;
}

function definition(entry: VocabularyEntry): string {
  return entry.meanings[0]?.definitionEn ?? entry.word;
}

export function PracticeMistakeMine({ signals, entries, onExit }: PracticeMistakeMineProps) {
  const [index, setIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);

  const entryByWord = useMemo(
    () => new Map(entries.map((entry) => [entry.normalizedWord, entry] as const)),
    [entries]
  );

  const weakSignals = useMemo(() => {
    const weak = signals.filter((signal) => signal.weak);
    return weak.length > 0 ? weak : signals.slice(0, 3);
  }, [signals]);

  const signal = weakSignals[index];
  const entry = signal === undefined ? undefined : entryByWord.get(signal.normalizedWord);

  const contrast = useMemo(() => {
    if (entry === undefined) return undefined;

    return entries.find(
      (candidate) =>
        candidate.normalizedWord !== entry.normalizedWord &&
        candidate.meanings[0]?.partOfSpeech === entry.meanings[0]?.partOfSpeech
    );
  }, [entries, entry]);

  if (signal === undefined || entry === undefined) {
    return (
      <section className="wvp-mode-screen">
        <button className="wvp-back-button" onClick={onExit} type="button">
          ← Practice Home
        </button>
        <div className="wvp-mode-empty">
          <h1>No mistakes need repair yet.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const options = contrast === undefined ? [entry] : [entry, contrast];
  const progress = Math.round(((index + 1) / weakSignals.length) * 100);
  const complete = index >= weakSignals.length - 1;
  const correct = selectedWord === entry.normalizedWord;
  const retrySentence =
    entry.examples[0]?.sentenceEn ?? "Choose the word that best matches: " + definition(entry);

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
    <section className="wvp-mode-screen" aria-labelledby="mistake-mine-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Mistake Mine</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {weakSignals.length} repairs
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="mistake-mine-title">Mistake Mine</h1>
        <p>Repair weak spots · turn confusion into a stronger distinction.</p>
      </div>

      <section className="wvp-mode-hero wvp-mode-hero--mine">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.mistakeMine} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>MISTAKE MINE · TARGETED REPAIR</span>
          <h2>Dig into the exact confusion.</h2>
          <p>The weak word returns in a new context after the explanation.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card wvp-mistake-card">
          <p className="wvp-card-eyebrow">WEAK SPOT · SEMANTIC REPAIR</p>

          <div className="wvp-mistake-signal">
            <span>NEEDS ATTENTION</span>
            <strong>{entry.word}</strong>
            <small>
              {signal.learningStatus} · viewed {signal.viewCount} times
            </small>
          </div>

          <h3>Why it may be tricky</h3>

          <div className="wvp-mistake-explanation">
            <div>
              <strong>{entry.word}</strong>
              <span>{definition(entry)}</span>
            </div>
            {contrast === undefined ? null : (
              <div>
                <strong>{contrast.word}</strong>
                <span>{definition(contrast)}</span>
              </div>
            )}
          </div>

          <p className="wvp-card-eyebrow wvp-mistake-retry-label">TRY A NEW CONTEXT</p>
          <div className="wvp-mistake-retry">{retrySentence}</div>

          <div className="wvp-mistake-options">
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
                  data-state={state}
                  key={candidate.normalizedWord}
                  onClick={() => !checked && setSelectedWord(candidate.normalizedWord)}
                  type="button"
                >
                  {candidate.word}
                </button>
              );
            })}
          </div>

          {checked ? (
            <p className="wvp-context-feedback" data-correct={correct || undefined}>
              {correct ? "Repair complete." : "Use “" + entry.word + "” for this context."}
            </p>
          ) : null}

          <footer className="wvp-mode-card__footer">
            <span className="wvp-mode-footnote">No penalty — just a better next question.</span>
            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish" : "Next repair"}
                <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={selectedWord === undefined}
                onClick={() => setChecked(true)}
                type="button"
              >
                Check repair
                <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>Mistake fingerprint</h2>

          <div className="wvp-mistake-fingerprint">
            <span>TYPE</span>
            <strong>Meaning / recall weakness</strong>
            <span>PATTERN</span>
            <strong>
              {entry.word}
              {contrast === undefined ? "" : " ↔ " + contrast.word}
            </strong>
            <small>Built from your current learning metadata.</small>
          </div>

          <div className="wvp-repair-steps">
            <h3>What happens next</h3>
            <p>
              <b>1</b>Explain the distinction
            </p>
            <p>
              <b>2</b>Retry in a new context
            </p>
            <p>
              <b>3</b>Return later if still weak
            </p>
          </div>

          <button
            className="wvp-wordie-inline wvp-wordie-inline--button"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            Wordie can explain the exact distinction without penalizing the session.
          </button>
        </aside>
      </div>
    </section>
  );
}
