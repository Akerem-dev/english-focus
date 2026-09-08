import { useState, type SyntheticEvent } from "react";

import valleyBackground from "../../../assets/background/home-background-static.png";
import { AppIcon, type AppIconName } from "../../../design-system";
import type { PracticeFocus } from "../application/practiceEngine";
import type { PracticeSessionResult } from "../application/practiceSession";
import { PracticeContextBridge } from "../components/PracticeContextBridge";
import { PracticeExpedition } from "../components/PracticeExpedition";
import { PracticeMistakeMine } from "../components/PracticeMistakeMine";
import { PracticePhraseFalls } from "../components/PracticePhraseFalls";
import { PracticeRecallSummit } from "../components/PracticeRecallSummit";
import { PracticeSessionSummary } from "../components/PracticeSessionSummary";
import { PracticeMemoryGrove } from "../components/PracticeMemoryGrove";
import { PracticeWordForge } from "../components/PracticeWordForge";
import { usePracticeHomeModel } from "../hooks/usePracticeHomeModel";
import { PRACTICE_ARTWORK } from "../practiceAssets";

import "../../../styles/word-valley-practice.css";

type PracticeDuration = 5 | 10 | 15;

interface TrainingGround {
  readonly id:
    | "memory-grove"
    | "word-forge"
    | "context-bridge"
    | "phrase-falls"
    | "mistake-mine"
    | "recall-summit";
  readonly title: string;
  readonly subtitle: string;
  readonly icon: AppIconName;
  readonly artwork: string;
}

const TRAINING_GROUNDS: readonly TrainingGround[] = Object.freeze([
  {
    id: "memory-grove",
    title: "Memory Grove",
    subtitle: "Meaning & recognition",
    icon: "bookmark",
    artwork: PRACTICE_ARTWORK.memoryGrove
  },
  {
    id: "word-forge",
    title: "Word Forge",
    subtitle: "Type the word from memory",
    icon: "edit",
    artwork: PRACTICE_ARTWORK.wordForge
  },
  {
    id: "context-bridge",
    title: "Context Bridge",
    subtitle: "Choose the right word in context",
    icon: "books",
    artwork: PRACTICE_ARTWORK.contextBridge
  },
  {
    id: "phrase-falls",
    title: "Phrase Falls",
    subtitle: "Collocations & word partners",
    icon: "book-open",
    artwork: PRACTICE_ARTWORK.phraseFalls
  },
  {
    id: "mistake-mine",
    title: "Mistake Mine",
    subtitle: "Repair recent mistakes",
    icon: "warning",
    artwork: PRACTICE_ARTWORK.mistakeMine
  },
  {
    id: "recall-summit",
    title: "Recall Summit",
    subtitle: "Hard mode · no easy clues",
    icon: "star",
    artwork: PRACTICE_ARTWORK.recallSummit
  }
]);

const FOCUS_OPTIONS: readonly { readonly id: PracticeFocus; readonly label: string }[] =
  Object.freeze([
    { id: "weak", label: "Weak words" },
    { id: "favorites", label: "Favorites" },
    { id: "recent", label: "Recently added" },
    { id: "collection", label: "Collection" },
    { id: "tag", label: "Tag" }
  ]);

export function PracticePage() {
  const [focus, setFocus] = useState<PracticeFocus>("weak");
  const [scope, setScope] = useState("all");
  const [duration, setDuration] = useState<PracticeDuration>(5);
  const [announcement, setAnnouncement] = useState("");
  const [view, setView] = useState<
    | "home"
    | "expedition"
    | "memory-grove"
    | "word-forge"
    | "context-bridge"
    | "phrase-falls"
    | "mistake-mine"
    | "recall-summit"
    | "summary"
  >("home");
  const { deck, entries, loading, signals, stats } = usePracticeHomeModel(focus, duration);
  const [sessionResult, setSessionResult] = useState<PracticeSessionResult | undefined>();

  function openTrainingGround(ground: TrainingGround) {
    setView(ground.id);
  }

  function finishSession(result: PracticeSessionResult) {
    setSessionResult(result);
    setView("summary");
  }

  function handleArtworkError(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (!image.src.endsWith(PRACTICE_ARTWORK.northernTrail)) {
      image.src = PRACTICE_ARTWORK.northernTrail;
    }
  }

  function cycleDuration() {
    setDuration((current) => (current === 5 ? 10 : current === 10 ? 15 : 5));
  }

  function trainingMeta(ground: TrainingGround): string {
    switch (ground.id) {
      case "memory-grove":
        return `${Math.max(stats.weak, Math.min(deck.length, 8))} words`;
      case "word-forge":
        return `${stats.due} due`;
      case "context-bridge":
        return `${Math.max(0, Math.min(signals.length, 10))} words`;
      case "phrase-falls":
        return `${Math.max(0, Math.min(signals.length, 7))} phrases`;
      case "mistake-mine":
        return `${stats.weak} review`;
      case "recall-summit":
        return stats.weak > 0 ? "Recommended" : "Ready";
    }
  }

  const expeditionWordCount = deck.length;
  const expeditionLabel = loading
    ? "Preparing your review deck…"
    : `${expeditionWordCount} words chosen for review today`;

  if (view !== "home") {
    let practiceView;

    if (view === "expedition") {
      practiceView = (
        <PracticeExpedition
          deck={deck}
          entries={entries}
          onComplete={finishSession}
          onExit={() => setView("home")}
          stats={stats}
        />
      );
    } else if (view === "memory-grove") {
      practiceView = (
        <PracticeMemoryGrove deck={deck} entries={entries} onExit={() => setView("home")} />
      );
    } else if (view === "word-forge") {
      practiceView = (
        <PracticeWordForge deck={deck} entries={entries} onExit={() => setView("home")} />
      );
    } else if (view === "context-bridge") {
      practiceView = (
        <PracticeContextBridge deck={deck} entries={entries} onExit={() => setView("home")} />
      );
    } else if (view === "phrase-falls") {
      practiceView = (
        <PracticePhraseFalls deck={deck} entries={entries} onExit={() => setView("home")} />
      );
    } else if (view === "mistake-mine") {
      practiceView = (
        <PracticeMistakeMine entries={entries} onExit={() => setView("home")} signals={signals} />
      );
    } else if (view === "recall-summit") {
      practiceView = (
        <PracticeRecallSummit
          deck={deck}
          entries={entries}
          onComplete={finishSession}
          onExit={() => setView("home")}
        />
      );
    } else {
      practiceView =
        sessionResult === undefined ? null : (
          <PracticeSessionSummary
            onHome={() => setView("home")}
            onReviewWeak={() => {
              setFocus("weak");
              setView("mistake-mine");
            }}
            result={sessionResult}
            signals={signals}
            stats={stats}
          />
        );
    }

    return (
      <div className="wvp-page">
        <div
          aria-hidden="true"
          className="wvp-page__scene"
          style={{ backgroundImage: `url("${valleyBackground}")` }}
        />
        <div aria-hidden="true" className="wvp-page__mist" />
        <main aria-label="Practice session" className="wvp-shell">
          {practiceView}
        </main>
      </div>
    );
  }

  return (
    <div className="wvp-page">
      <div
        aria-hidden="true"
        className="wvp-page__scene"
        style={{ backgroundImage: `url("${valleyBackground}")` }}
      />
      <div aria-hidden="true" className="wvp-page__mist" />

      <main aria-label="Practice" className="wvp-shell">
        <section className="wvp-home" aria-labelledby="practice-title">
          <header className="wvp-home__header">
            <div className="wvp-home__heading">
              <p className="wvp-eyebrow">PRACTICE · WORD VALLEY EXPEDITIONS</p>
              <h1 id="practice-title">Strengthen what you know.</h1>
              <p>
                Short, adaptive sessions built from your words, weak spots, and recent mistakes.
              </p>
            </div>

            <div className="wvp-home__controls">
              <label className="wvp-control wvp-control--scope">
                <AppIcon name="book-open" size={18} />
                <select
                  aria-label="Practice word scope"
                  onChange={(event) => {
                    const nextScope = event.currentTarget.value;
                    setScope(nextScope);
                    if (
                      nextScope === "weak" ||
                      nextScope === "favorites" ||
                      nextScope === "recent"
                    ) {
                      setFocus(nextScope);
                    }
                  }}
                  value={scope}
                >
                  <option value="all">All Words</option>
                  <option value="weak">Weak words</option>
                  <option value="favorites">Favorites</option>
                  <option value="recent">Recently added</option>
                </select>
                <AppIcon className="wvp-control__chevron" name="chevron-down" size={15} />
              </label>

              <button
                aria-label="Change session duration"
                className="wvp-control wvp-control--duration"
                onClick={cycleDuration}
                type="button"
              >
                <AppIcon name="clock" size={18} />
                <span>{duration} min</span>
              </button>
            </div>
          </header>

          <section className="wvp-expedition-card" aria-label="Today's expedition">
            <img
              alt=""
              className="wvp-expedition-card__art"
              draggable={false}
              src={PRACTICE_ARTWORK.northernTrail}
            />
            <div aria-hidden="true" className="wvp-expedition-card__wash" />

            <div className="wvp-expedition-card__copy">
              <p>TODAY'S EXPEDITION</p>
              <h2>The Northern Trail</h2>
              <strong>{expeditionLabel}</strong>

              <div className="wvp-expedition-card__chips" aria-label="Today's review mix">
                <span>
                  <AppIcon name="clock" size={15} />
                  {stats.due} due
                </span>
                <span>
                  <AppIcon name="warning" size={15} />
                  {stats.weak} weak
                </span>
                <span>
                  <AppIcon name="bookmark" size={15} />
                  {stats.recent} recent
                </span>
              </div>

              <button
                className="wvp-primary-action"
                disabled={loading || expeditionWordCount === 0}
                onClick={() => {
                  if (expeditionWordCount === 0) {
                    setAnnouncement("Add or review vocabulary before starting an expedition.");
                    return;
                  }
                  setAnnouncement(`The Northern Trail selected with ${expeditionWordCount} words.`);
                  setView("expedition");
                }}
                type="button"
              >
                Begin expedition
                <AppIcon name="arrow-right" size={17} />
              </button>
            </div>

            <div className="wvp-expedition-route" aria-label="Expedition route">
              {["Grove", "Forge", "Bridge", "Summit"].map((label, index) => (
                <div
                  className="wvp-expedition-route__stop"
                  data-active={index === 0 || undefined}
                  key={label}
                >
                  <i aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="wvp-section-heading">
            <h2>Choose your training ground</h2>
            <p>Different paths. A stronger you.</p>
          </div>

          <section className="wvp-training-grid" aria-label="Training grounds">
            {TRAINING_GROUNDS.map((ground) => (
              <button
                className="wvp-training-card"
                key={ground.id}
                onClick={() => openTrainingGround(ground)}
                type="button"
              >
                <img alt="" draggable={false} onError={handleArtworkError} src={ground.artwork} />
                <span className="wvp-training-card__body">
                  <span className="wvp-training-card__title">
                    <AppIcon name={ground.icon} size={20} />
                    <strong>{ground.title}</strong>
                  </span>
                  <small>{ground.subtitle}</small>
                  <span className="wvp-training-card__meta">{trainingMeta(ground)}</span>
                  <AppIcon className="wvp-training-card__arrow" name="arrow-right" size={17} />
                </span>
              </button>
            ))}
          </section>

          <div className="wvp-home__bottom">
            <section className="wvp-focus-panel" aria-labelledby="focus-practice-title">
              <div className="wvp-panel-heading">
                <AppIcon name="edit" size={19} />
                <div>
                  <h2 id="focus-practice-title">Focus practice</h2>
                  <p>Choose a set of words to practice.</p>
                </div>
              </div>

              <div className="wvp-focus-pills" role="group" aria-label="Focus practice filter">
                {FOCUS_OPTIONS.map((option) => (
                  <button
                    aria-pressed={focus === option.id}
                    key={option.id}
                    onClick={() => setFocus(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="wvp-week-panel" aria-labelledby="week-title">
              <header>
                <div>
                  <AppIcon name="books" size={19} />
                  <h2 id="week-title">This week</h2>
                </div>
                <p>Your progress at a glance.</p>
              </header>

              <div className="wvp-week-stats">
                <div>
                  <strong>{Math.max(0, stats.total - stats.weak)}</strong>
                  <span>strengthened</span>
                </div>
                <div>
                  <strong>
                    {signals.filter((item) => item.learningStatus === "known").length}
                  </strong>
                  <span>moved to strong recall</span>
                </div>
                <div>
                  <strong>{stats.weak}</strong>
                  <span>need attention</span>
                </div>
              </div>
            </section>
          </div>

          <p aria-live="polite" className="wvp-sr-status">
            {announcement}
          </p>
        </section>
      </main>
    </div>
  );
}
