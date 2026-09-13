import { useMemo, useState } from "react";
import type { VocabularyEntry } from "@platform/domain";

import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant/assistantEvents";
import type { PracticeSignal } from "../application/practiceEngine";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeMemoryGroveProps {
  readonly deck: readonly PracticeSignal[];
  readonly entries: readonly VocabularyEntry[];
  readonly onExit: () => void;
}

function translationFor(entry: VocabularyEntry): string {
  return entry.meanings[0]?.translationsTr[0] ?? entry.meanings[0]?.definitionEn ?? entry.word;
}

function createChoices(
  current: VocabularyEntry,
  deckEntries: readonly VocabularyEntry[]
): readonly { readonly id: string; readonly text: string; readonly correct: boolean }[] {
  const correct = translationFor(current);
  const decoys = deckEntries
    .filter((entry) => entry.normalizedWord !== current.normalizedWord)
    .map(translationFor)
    .filter((value) => value !== correct)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 3);

  const fallback = [
    "bir şeyi korumak",
    "bir şeyi yeniden yapmak",
    "bir şeyi geçici olarak durdurmak"
  ];
  for (const value of fallback) {
    if (decoys.length >= 3) break;
    if (value !== correct && !decoys.includes(value)) decoys.push(value);
  }

  const choices = [
    { id: "correct", text: correct, correct: true },
    ...decoys.slice(0, 3).map((text, index) => ({
      id: `decoy-${index}`,
      text,
      correct: false
    }))
  ];

  const offset = current.normalizedWord.length % choices.length;
  return Object.freeze([...choices.slice(offset), ...choices.slice(0, offset)]);
}

export function PracticeMemoryGrove({ deck, entries, onExit }: PracticeMemoryGroveProps) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);

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

  const signal = deck[index];
  const entry = signal === undefined ? undefined : entryByWord.get(signal.normalizedWord);
  const choices = useMemo(
    () => (entry === undefined ? [] : createChoices(entry, deckEntries)),
    [deckEntries, entry]
  );

  if (signal === undefined || entry === undefined) {
    return (
      <section className="wvp-mode-screen">
        <button className="wvp-back-button" onClick={onExit} type="button">
          ← Practice Home
        </button>
        <div className="wvp-mode-empty">
          <h1>Memory Grove needs a few words first.</h1>
          <button className="wvp-primary-action" onClick={onExit} type="button">
            Return to Practice
          </button>
        </div>
      </section>
    );
  }

  const selected = choices.find((choice) => choice.id === selectedId);
  const progress = Math.round(((index + 1) / deck.length) * 100);
  const complete = index >= deck.length - 1;
  const pronunciation = entry.pronunciations[0]?.ipa;
  const meaningScore =
    signal.learningStatus === "known" ? 88 : signal.learningStatus === "learning" ? 64 : 42;
  const speedScore = Math.min(90, 42 + signal.viewCount * 8);
  const confidenceScore = signal.favorite ? 72 : signal.weak ? 48 : 60;

  function next() {
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
    <section className="wvp-mode-screen" aria-labelledby="memory-grove-title">
      <header className="wvp-mode-topline">
        <div>
          <button className="wvp-back-button" onClick={onExit} type="button">
            ← Practice Home
          </button>
          <span>›</span>
          <span>Memory Grove</span>
        </div>
        <span className="wvp-mode-progress-badge">
          {index + 1} of {deck.length} words
        </span>
      </header>

      <div className="wvp-mode-heading">
        <h1 id="memory-grove-title">Memory Grove</h1>
        <p>Meaning & recognition · build a reliable first connection.</p>
      </div>

      <section className="wvp-mode-hero">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.memoryGrove} />
        <div className="wvp-mode-hero__shade" />
        <div className="wvp-mode-hero__copy">
          <span>MEMORY GROVE · RECOGNITION</span>
          <h2>See the word. Reach for the meaning.</h2>
          <p>Choose before opening a clue. Fast guesses are less useful than a real attempt.</p>
        </div>
        <div className="wvp-mode-hero__track">
          <i style={{ width: `${progress}%` }} />
        </div>
      </section>

      <div className="wvp-mode-layout">
        <section className="wvp-mode-card">
          <p className="wvp-card-eyebrow">
            WORD {index + 1} · {entry.cefr}
          </p>
          <h2 className="wvp-mode-card__word">{entry.word}</h2>
          <p className="wvp-mode-card__meta">
            {entry.meanings[0]?.partOfSpeech ?? entry.partsOfSpeech[0] ?? "word"}
            {pronunciation === undefined ? "" : ` · /${pronunciation.replace(/^\/+|\/+$/g, "")}/`}
          </p>
          <h3>Which meaning is closest?</h3>

          <div className="wvp-memory-choices" role="radiogroup" aria-label="Meaning choices">
            {choices.map((choice, choiceIndex) => {
              const isSelected = choice.id === selectedId;
              const state =
                checked && choice.correct
                  ? "correct"
                  : checked && isSelected
                    ? "incorrect"
                    : isSelected
                      ? "selected"
                      : undefined;
              return (
                <button
                  aria-checked={isSelected}
                  data-state={state}
                  key={choice.id}
                  onClick={() => !checked && setSelectedId(choice.id)}
                  role="radio"
                  type="button"
                >
                  <span>{String.fromCharCode(65 + choiceIndex)}</span>
                  <strong>{choice.text}</strong>
                  {checked && choice.correct ? <AppIcon name="check" size={16} /> : null}
                </button>
              );
            })}
          </div>

          <footer className="wvp-mode-card__footer">
            <button
              className="wvp-secondary-action"
              disabled={checked}
              onClick={() => setSelectedId(choices.find((choice) => choice.correct)?.id)}
              type="button"
            >
              Memory seed
            </button>
            {checked ? (
              <button className="wvp-question-submit" onClick={next} type="button">
                {complete ? "Finish" : "Next word"} <AppIcon name="arrow-right" size={16} />
              </button>
            ) : (
              <button
                className="wvp-question-submit"
                disabled={selected === undefined}
                onClick={() => setChecked(true)}
                type="button"
              >
                Check answer <AppIcon name="arrow-right" size={16} />
              </button>
            )}
          </footer>
        </section>

        <aside className="wvp-mode-side">
          <h2>What grows here</h2>
          <p>This mode strengthens the first layer of a word.</p>

          <div className="wvp-mastery-bars">
            {[
              ["Meaning recognition", meaningScore, meaningScore >= 80 ? "Strong" : "Growing"],
              ["Speed", speedScore, speedScore >= 70 ? "Steady" : "Growing"],
              ["Confidence", confidenceScore, confidenceScore >= 70 ? "Strong" : "Growing"]
            ].map(([label, score, state]) => (
              <div key={String(label)}>
                <header>
                  <strong>{label}</strong>
                  <span>{state}</span>
                </header>
                <div>
                  <i style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="wvp-mode-side__note">
            A word that keeps returning here will graduate to Word Forge.
          </p>
          <button
            className="wvp-wordie-inline wvp-wordie-inline--button"
            onClick={() => dispatchAssistantRequest({ kind: "open", word: entry.word })}
            type="button"
          >
            Wordie can explain close meanings.
          </button>
        </aside>
      </div>
    </section>
  );
}
