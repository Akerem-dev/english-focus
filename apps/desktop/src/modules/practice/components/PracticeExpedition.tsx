import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import type { PracticeHomeStats, PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeExpeditionProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly stats: PracticeHomeStats;
  readonly onExit: () => void;
}

interface QuestionOption {
  readonly id: string;
  readonly text: string;
  readonly correct: boolean;
}

function definitionFor(entry: VocabularyEntry): string {
  return (
    entry.meanings[0]?.definitionEn ??
    entry.examples[0]?.sentenceEn ??
    `A vocabulary item related to “${entry.word}”.`
  );
}

function createQuestionOptions(
  current: VocabularyEntry,
  deckEntries: readonly VocabularyEntry[]
): readonly QuestionOption[] {
  const correctText = definitionFor(current);
  const decoys = deckEntries
    .filter((entry) => entry.normalizedWord !== current.normalizedWord)
    .map(definitionFor)
    .filter((definition) => definition !== correctText)
    .filter((definition, index, all) => all.indexOf(definition) === index)
    .slice(0, 3);

  const fallback = [
    "to protect something from physical damage",
    "to make something completely new",
    "to stop an activity for a short time"
  ];

  const distractors = [...decoys];
  for (const candidate of fallback) {
    if (distractors.length >= 3) break;
    if (candidate !== correctText && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }

  const options = [
    { id: "correct", text: correctText, correct: true },
    ...distractors.slice(0, 3).map((text, index) => ({
      id: `decoy-${index}`,
      text,
      correct: false
    }))
  ];

  const rotation = current.normalizedWord.length % options.length;
  return Object.freeze([...options.slice(rotation), ...options.slice(0, rotation)]);
}

function stageFor(index: number, total: number): { readonly label: string; readonly number: number } {
  const ratio = total <= 1 ? 0 : index / total;
  if (ratio < 0.25) return { label: "MEMORY GROVE", number: 1 };
  if (ratio < 0.5) return { label: "WORD FORGE", number: 2 };
  if (ratio < 0.75) return { label: "CONTEXT BRIDGE", number: 3 };
  return { label: "RECALL SUMMIT", number: 4 };
}

export function PracticeExpedition({ deck, entries, stats, onExit }: PracticeExpeditionProps) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const entryByWord = useMemo(
    () => new Map(entries.map((entry) => [entry.normalizedWord, entry] as const)),
    [entries]
  );
  const deckEntries = useMemo(
    () =>
      deck
        .map((signal) => entryByWord.get(signal.normalizedWord))
        .filter((entry): entry is VocabularyEntry => entry !== undefined),
    [deck, entryByWord]
  );

  const currentSignal = deck[index];
  const currentEntry =
    currentSignal === undefined ? undefined : entryByWord.get(currentSignal.normalizedWord);
  const stage = stageFor(index, Math.max(deck.length, 1));
  const options = useMemo(
    () => (currentEntry === undefined ? [] : createQuestionOptions(currentEntry, deckEntries)),
    [currentEntry, deckEntries]
  );

  if (currentEntry === undefined) {
    return (
      <section className="wvp-expedition-screen" aria-labelledby="expedition-empty-title">
        <header className="wvp-expedition-screen__topline">
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
        </header>
        <div className="wvp-expedition-empty">
          <h1 id="expedition-empty-title">Your trail needs more words.</h1>
          <p>Add or review vocabulary first, then return to Practice.</p>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const pronunciation = currentEntry.pronunciations[0]?.ipa;
  const partOfSpeech = currentEntry.meanings[0]?.partOfSpeech ?? currentEntry.partsOfSpeech[0];
  const progress = Math.min(100, Math.round(((index + 1) / deck.length) * 100));
  const selected = options.find((option) => option.id === selectedId);
  const complete = index >= deck.length - 1;

  function checkAnswer() {
    if (selected === undefined || checked) return;
    setChecked(true);
    if (selected.correct) {
      setCorrectCount((count) => count + 1);
    }
  }

  function nextQuestion() {
    if (!checked) return;

    if (complete) {
      onExit();
      return;
    }

    setIndex((current) => current + 1);
    setSelectedId(undefined);
    setChecked(false);
  }

  return (
    <section className="wvp-expedition-screen" aria-labelledby="expedition-title">
      <header className="wvp-expedition-screen__topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span aria-hidden="true">›</span>
          <span>Today's Expedition</span>
        </div>
        <button className="wvp-end-session" onClick={onExit} type="button">
          End session
        </button>
      </header>

      <div className="wvp-expedition-screen__heading">
        <h1 id="expedition-title">The Northern Trail</h1>
        <p>Adaptive mixed practice · {deck.length} words · about 5 min</p>
      </div>

      <section className="wvp-route-banner" aria-label="Expedition progress">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.northernTrail} />
        <div aria-hidden="true" className="wvp-route-banner__shade" />
        <div className="wvp-route-banner__copy">
          <p>
            STAGE {stage.number} OF 4 · {stage.label}
          </p>
          <strong>
            {index + 1} / {deck.length} words
          </strong>
        </div>
        <div className="wvp-route-banner__track" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="wvp-route-banner__stops" aria-hidden="true">
          {["Grove", "Forge", "Bridge", "Summit"].map((label, stopIndex) => (
            <span data-active={stopIndex < stage.number || undefined} key={label}>
              <i />
              <small>{label}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="wvp-expedition-layout">
        <section className="wvp-question-card" aria-labelledby="expedition-question-title">
          <p className="wvp-card-eyebrow">MEANING RECALL</p>
          <p className="wvp-question-card__prompt">Which meaning fits this word?</p>
          <h2 id="expedition-question-title">{currentEntry.word}</h2>
          <p className="wvp-question-card__meta">
            {pronunciation === undefined ? "" : `/${pronunciation.replace(/^\/+|\/+$/g, "")}/ · `}
            {partOfSpeech ?? "word"} · {currentEntry.cefr}
          </p>

          <div className="wvp-answer-list" role="radiogroup" aria-label="Meaning choices">
            {options.map((option, optionIndex) => {
              const selectedOption = selectedId === option.id;
              const state =
                checked && option.correct
                  ? "correct"
                  : checked && selectedOption && !option.correct
                    ? "incorrect"
                    : selectedOption
                      ? "selected"
                      : undefined;

              return (
                <button
                  aria-checked={selectedOption}
                  className="wvp-answer-option"
                  data-state={state}
                  key={option.id}
                  onClick={() => !checked && setSelectedId(option.id)}
                  role="radio"
                  type="button"
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <strong>{option.text}</strong>
                  {checked && option.correct ? <AppIcon name="check" size={17} /> : null}
                </button>
              );
            })}
          </div>

          <footer className="wvp-question-card__footer">
            <button
              className="wvp-secondary-action"
              disabled={checked}
              onClick={() => {
                const correct = options.find((option) => option.correct);
                setSelectedId(correct?.id);
              }}
              type="button"
            >
              I don't know
            </button>

            {checked ? (
              <button className="wvp-question-submit" onClick={nextQuestion} type="button">
                {complete ? "Finish expedition" : "Next word"}
                <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={selected === undefined}
                onClick={checkAnswer}
                type="button"
              >
                Check answer
                <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>

          {checked ? (
            <p className="wvp-question-feedback" data-correct={selected?.correct || undefined}>
              {selected?.correct
                ? "Correct — that meaning is secure enough to move forward."
                : `Not quite. The best fit is “${options.find((option) => option.correct)?.text ?? ""}”.`}
            </p>
          ) : null}
        </section>

        <aside className="wvp-session-deck" aria-label="Today's deck">
          <h2>Today's deck</h2>
          <p>Why these words are here</p>

          <div className="wvp-session-deck__signals">
            <div>
              <AppIcon name="clock" size={18} />
              <span>
                <strong>{stats.due} due</strong>
                <small>Ready for review</small>
              </span>
            </div>
            <div>
              <AppIcon name="warning" size={18} />
              <span>
                <strong>{stats.weak} weak</strong>
                <small>Recent misses</small>
              </span>
            </div>
            <div>
              <AppIcon name="bookmark" size={18} />
              <span>
                <strong>{stats.recent} recent</strong>
                <small>Recently discovered</small>
              </span>
            </div>
          </div>

          <div className="wvp-session-deck__score">
            <span>SESSION</span>
            <strong>{correctCount} correct</strong>
          </div>

          <div className="wvp-wordie-plan">
            <span>WORDIE'S PLAN</span>
            <p>
              Start with recognition, then raise the difficulty when your recall looks secure.
            </p>
          </div>
        </aside>
      </div>

      <p className="wvp-expedition-screen__tip">
        Tip: wrong answers return later in a different form — mistakes are part of the route.
      </p>
    </section>
  );
}
