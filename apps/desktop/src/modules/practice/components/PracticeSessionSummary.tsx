import type { PracticeHomeStats, PracticeSignal } from "../application/practiceEngine";
import type { PracticeSessionResult } from "../application/practiceSession";
import { PRACTICE_ARTWORK } from "../practiceAssets";

interface PracticeSessionSummaryProps {
  readonly result: PracticeSessionResult;
  readonly signals: readonly PracticeSignal[];
  readonly stats: PracticeHomeStats;
  readonly onHome: () => void;
  readonly onReviewWeak: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes + ":" + remainder.toString().padStart(2, "0");
}

export function PracticeSessionSummary({
  result,
  signals,
  stats,
  onHome,
  onReviewWeak
}: PracticeSessionSummaryProps) {
  const weakWords = signals.filter((signal) => signal.weak).slice(0, 2);
  const accuracy =
    result.attempted === 0 ? 0 : Math.round((result.correct / result.attempted) * 100);

  const mastery = [
    ["Meaning recognition", Math.max(42, accuracy), accuracy >= 80 ? "Strong" : "Growing"],
    [
      "Active recall",
      Math.max(35, Math.min(94, accuracy - 8 + stats.due)),
      accuracy >= 75 ? "Steady" : "Growing"
    ],
    ["Spelling", Math.max(38, Math.min(92, accuracy - 2)), accuracy >= 78 ? "Steady" : "Growing"],
    [
      "Context use",
      Math.max(40, Math.min(95, accuracy + 4)),
      accuracy >= 78 ? "Strong" : "Growing"
    ],
    [
      "Word partnerships",
      Math.max(36, Math.min(90, accuracy - 5 + stats.recent)),
      accuracy >= 80 ? "Strong" : "Growing"
    ]
  ] as const;

  return (
    <section className="wvp-summary" aria-labelledby="practice-summary-title">
      <header className="wvp-summary__heading">
        <p>PRACTICE · SESSION COMPLETE</p>
        <h1 id="practice-summary-title">
          {result.mode === "Northern Trail"
            ? "The Northern Trail is complete."
            : result.mode + " is complete."}
        </h1>
        <span>
          You strengthened {result.correct} {result.correct === 1 ? "word" : "words"}. {stats.weak}{" "}
          still need attention.
        </span>
      </header>

      <section className="wvp-summary-hero">
        <img alt="" draggable={false} src={PRACTICE_ARTWORK.recallSummit} />
        <div className="wvp-summary-hero__shade" />
        <div className="wvp-summary-hero__copy">
          <span>SESSION COMPLETE</span>
          <div>
            <strong>{result.correct}</strong>
            <p>words strengthened</p>
          </div>
          <small>{stats.weak} need another pass</small>
        </div>

        <div className="wvp-summary-route" aria-hidden="true">
          {["Grove", "Forge", "Bridge", "Summit"].map((label) => (
            <span key={label}>
              <i>✓</i>
              <small>{label}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="wvp-summary-grid">
        <section className="wvp-summary-mastery">
          <h2>Your mastery profile</h2>
          <p>Different kinds of knowing grow at different speeds.</p>

          <div className="wvp-summary-bars">
            {mastery.map(([label, score, state]) => (
              <div key={label}>
                <strong>{label}</strong>
                <div>
                  <i style={{ width: score + "%" }} />
                </div>
                <span>{state}</span>
              </div>
            ))}
          </div>

          <div className="wvp-summary-insight">
            Best today: {accuracy >= 80 ? "meaning recognition" : "steady practice"} · Next focus:{" "}
            {stats.weak > 0 ? "weak words" : "active recall"}
          </div>
        </section>

        <aside className="wvp-summary-next">
          <h2>What comes next</h2>
          <p>Only the words that still need evidence return soon.</p>

          <div className="wvp-summary-weak">
            <span>{weakWords.length} WORDS TO WATCH</span>
            {weakWords.length === 0 ? (
              <strong>No weak words in the current deck.</strong>
            ) : (
              weakWords.map((word) => (
                <div key={word.normalizedWord}>
                  <strong>{word.word}</strong>
                  <small>{word.due ? "due for review" : "active recall"}</small>
                </div>
              ))
            )}
          </div>

          <div className="wvp-summary-wordie">
            <strong>Wordie noticed</strong>
            <p>
              {accuracy >= 80
                ? "Your recall was strong. Keep spacing these words out."
                : "Recognition is growing, but a few words need another lower-pressure pass."}
            </p>
          </div>

          <div className="wvp-summary-actions">
            <button disabled={stats.weak === 0} onClick={onReviewWeak} type="button">
              Review weak words
            </button>
            <button onClick={onHome} type="button">
              Return to Practice
            </button>
          </div>
        </aside>
      </div>

      <footer className="wvp-summary-stats">
        <div>
          <strong>{result.attempted}</strong>
          <span>attempted</span>
        </div>
        <div>
          <strong>{result.correct}</strong>
          <span>strengthened</span>
        </div>
        <div>
          <strong>{Math.max(0, result.attempted - result.correct)}</strong>
          <span>need attention</span>
        </div>
        <div>
          <strong>{formatDuration(result.durationSeconds)}</strong>
          <span>session time</span>
        </div>
      </footer>
    </section>
  );
}
