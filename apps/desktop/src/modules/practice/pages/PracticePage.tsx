import { useState, type SyntheticEvent } from "react";

import valleyBackground from "../../../assets/background/home-background-static.png";
import { AppIcon, type AppIconName } from "../../../design-system";
import { PRACTICE_ARTWORK } from "../practiceAssets";

import "../../../styles/word-valley-practice.css";

type PracticeFocus = "weak" | "favorites" | "recent" | "collection" | "tag";

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
  readonly meta: string;
  readonly icon: AppIconName;
  readonly artwork: string;
}

const TRAINING_GROUNDS: readonly TrainingGround[] = Object.freeze([
  {
    id: "memory-grove",
    title: "Memory Grove",
    subtitle: "Meaning & recognition",
    meta: "8 words",
    icon: "bookmark",
    artwork: PRACTICE_ARTWORK.memoryGrove
  },
  {
    id: "word-forge",
    title: "Word Forge",
    subtitle: "Type the word from memory",
    meta: "6 due",
    icon: "edit",
    artwork: PRACTICE_ARTWORK.wordForge
  },
  {
    id: "context-bridge",
    title: "Context Bridge",
    subtitle: "Choose the right word in context",
    meta: "10 words",
    icon: "books",
    artwork: PRACTICE_ARTWORK.contextBridge
  },
  {
    id: "phrase-falls",
    title: "Phrase Falls",
    subtitle: "Collocations & word partners",
    meta: "7 phrases",
    icon: "book-open",
    artwork: PRACTICE_ARTWORK.phraseFalls
  },
  {
    id: "mistake-mine",
    title: "Mistake Mine",
    subtitle: "Repair recent mistakes",
    meta: "3 review",
    icon: "warning",
    artwork: PRACTICE_ARTWORK.mistakeMine
  },
  {
    id: "recall-summit",
    title: "Recall Summit",
    subtitle: "Hard mode · no easy clues",
    meta: "Recommended",
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

/**
 * Stage 2 keeps the Figma-authored Practice Home isolated from the later quiz engine.
 * That gives us a pixel-stable home while Stage 3+ can evolve session logic behind it.
 */
export function PracticePage() {
  const [focus, setFocus] = useState<PracticeFocus>("weak");
  const [scope, setScope] = useState("all");
  const [duration, setDuration] = useState(5);
  const [announcement, setAnnouncement] = useState("");

  function announceTrainingGround(ground: TrainingGround) {
    setAnnouncement(
      `${ground.title} selected. Its interactive session opens in the next Practice stage.`
    );
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
                  onChange={(event) => setScope(event.currentTarget.value)}
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
              <strong>12 words chosen for review today</strong>

              <div className="wvp-expedition-card__chips" aria-label="Today's review mix">
                <span>
                  <AppIcon name="clock" size={15} />
                  5 due
                </span>
                <span>
                  <AppIcon name="warning" size={15} />
                  3 weak
                </span>
                <span>
                  <AppIcon name="bookmark" size={15} />
                  4 recent
                </span>
              </div>

              <button
                className="wvp-primary-action"
                onClick={() => setAnnouncement("The Northern Trail expedition selected.")}
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
                onClick={() => announceTrainingGround(ground)}
                type="button"
              >
                <img
                  alt=""
                  draggable={false}
                  onError={handleArtworkError}
                  src={ground.artwork}
                />
                <span className="wvp-training-card__body">
                  <span className="wvp-training-card__title">
                    <AppIcon name={ground.icon} size={20} />
                    <strong>{ground.title}</strong>
                  </span>
                  <small>{ground.subtitle}</small>
                  <span className="wvp-training-card__meta">{ground.meta}</span>
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
                  <strong>18</strong>
                  <span>strengthened</span>
                </div>
                <div>
                  <strong>6</strong>
                  <span>moved to strong recall</span>
                </div>
                <div>
                  <strong>3</strong>
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
