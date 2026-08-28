import { useEffect, useMemo, useState } from "react";

import { useGrammar } from "../../../app/providers";
import type { GrammarLessonSelection } from "./GrammarCurriculumHome";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

import "../../../styles/word-valley-grammar-v13-lesson.css";

interface CompiledGrammarLessonProps {
  readonly lesson: GrammarLessonSelection;
  readonly onBack: () => void;
  readonly onMarkComplete: () => void;
  readonly progress: number;
}

interface LoadedGrammarAnswer {
  readonly source: string;
  readonly answerText: string;
}

interface LoadedGrammarPoint {
  readonly key: string;
  readonly title: string;
  readonly answer?: LoadedGrammarAnswer;
  readonly status: "loading" | "ready" | "unavailable";
}

interface LoadedGrammarState {
  readonly requestKey: string;
  readonly points: readonly LoadedGrammarPoint[];
}

type PracticeMode = "guided" | "quiz" | "challenge";

const PRESENT_PERFECT_USES = Object.freeze([
  { mark: "✦", title: "Experiences in life", example: "I have never been to Japan." },
  { mark: "◉", title: "Results that continue now", example: "He has lost his keys." },
  { mark: "◷", title: "Unspecified time before now", example: "We have seen that movie." }
]);

const PRESENT_PERFECT_EXAMPLES = Object.freeze([
  { mark: "✧", title: "Life experience", example: "They have travelled to five countries." },
  { mark: "⌁", title: "Result now", example: "The ground is wet. It has rained." },
  { mark: "♙", title: "Unspecified time", example: "I’ve read this book three times." }
]);

const PRESENT_PERFECT_SIGNALS = Object.freeze([
  "already",
  "just",
  "yet",
  "ever",
  "never",
  "so far",
  "recently",
  "up to now",
  "since",
  "for"
]);

function splitParagraphs(answerText: string): readonly string[] {
  return answerText
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function compactText(value: string, maxLength = 150): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const shortened = normalized.slice(0, Math.max(0, maxLength - 1));
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 70 ? boundary : shortened.length).trim()}…`;
}

function pointSummary(point: LoadedGrammarPoint | undefined, fallback: string): string {
  const paragraph = point?.answer === undefined ? undefined : splitParagraphs(point.answer.answerText)[0];
  return paragraph === undefined ? fallback : compactText(paragraph);
}

function titleCaseCategory(value: string): string {
  return value.toLocaleUpperCase("en");
}

function lessonBand(lesson: GrammarLessonSelection): string {
  const [, band] = lesson.shelfTitle.split("·");
  return band?.trim() || "Grammar Foundation";
}

export function CompiledGrammarLesson({
  lesson,
  onBack,
  onMarkComplete,
  progress
}: CompiledGrammarLessonProps) {
  const { answerGrammarQuestion } = useGrammar();
  const artwork = getGrammarLessonArtwork(lesson.sourceLessonId);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("guided");
  const isPresentPerfect = lesson.id === "present-perfect";
  const isComplete = progress >= 5;

  const requests = useMemo(
    () =>
      isPresentPerfect
        ? []
        : [
            ...lesson.coreTopics.map((topic) => ({ key: `core:${topic}`, title: topic })),
            ...lesson.subtopics.map((subtopic) => ({ key: subtopic.cardId, title: subtopic.title }))
          ].filter(
            (request, index, all) => all.findIndex((candidate) => candidate.title === request.title) === index
          ),
    [isPresentPerfect, lesson]
  );

  const requestKey = useMemo(
    () => requests.map((request) => `${request.key}:${request.title}`).join("\u001f"),
    [requests]
  );
  const loadingPoints = useMemo<readonly LoadedGrammarPoint[]>(
    () => requests.map((request) => ({ ...request, status: "loading" as const })),
    [requests]
  );
  const [loadedState, setLoadedState] = useState<LoadedGrammarState>(() => ({
    requestKey,
    points: loadingPoints
  }));

  useEffect(() => {
    if (requests.length === 0) {
      setLoadedState({ requestKey, points: Object.freeze([]) });
      return;
    }

    let cancelled = false;

    void Promise.all(
      requests.map(async (request): Promise<LoadedGrammarPoint> => {
        try {
          const result = await answerGrammarQuestion(request.title);
          if (result.kind === "local") {
            return { ...request, answer: result.answer, status: "ready" };
          }
          return { ...request, status: "unavailable" };
        } catch {
          return { ...request, status: "unavailable" };
        }
      })
    ).then((loaded) => {
      if (!cancelled) setLoadedState({ requestKey, points: Object.freeze(loaded) });
    });

    return () => {
      cancelled = true;
    };
  }, [answerGrammarQuestion, requestKey, requests]);

  const points = loadedState.requestKey === requestKey ? loadedState.points : loadingPoints;
  const readyPoints = points.filter((point) => point.status === "ready" && point.answer !== undefined);
  const usablePoints = readyPoints.length > 0 ? readyPoints : points;

  const genericUses = Array.from({ length: 3 }, (_, index) => {
    const point = usablePoints[index];
    return {
      mark: index === 0 ? "✦" : index === 1 ? "◉" : "◷",
      title: point?.title ?? (index === 0 ? lesson.title : `Key point ${index + 1}`),
      example: pointSummary(point, lesson.description)
    };
  });

  const genericExamples = Array.from({ length: 3 }, (_, index) => {
    const point = usablePoints[index + 1] ?? usablePoints[index];
    return {
      mark: index === 0 ? "✧" : index === 1 ? "⌁" : "♙",
      title: point?.title ?? `Example ${index + 1}`,
      example: pointSummary(point, `Use ${lesson.title} in a natural sentence and check the meaning.`)
    };
  });

  const uses = isPresentPerfect ? PRESENT_PERFECT_USES : genericUses;
  const examples = isPresentPerfect ? PRESENT_PERFECT_EXAMPLES : genericExamples;
  const signals = isPresentPerfect
    ? PRESENT_PERFECT_SIGNALS
    : Array.from(new Set([...lesson.keywords, ...lesson.title.split(/\s+/)]))
        .map((word) => word.replace(/[&,]/g, "").trim())
        .filter((word) => word.length > 1)
        .slice(0, 10);

  function resumeLesson() {
    document.getElementById("grammar-overview-practice")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  return (
    <main className="wvg-v13-lesson" aria-labelledby="grammar-topic-title">
      <section className="wvg-v13-lesson__paper">
        <nav aria-label="Grammar breadcrumb" className="wvg-v13-lesson__breadcrumb">
          <button onClick={onBack} type="button">Grammar</button>
          <span aria-hidden="true">›</span>
          <span>{lesson.category}</span>
          <span aria-hidden="true">›</span>
          <strong>{lesson.title}</strong>
        </nav>

        <header className="wvg-v13-lesson__hero">
          <img alt="" aria-hidden="true" draggable={false} src={artwork} />
          <span aria-hidden="true" className="wvg-v13-lesson__hero-wash" />
          <div className="wvg-v13-lesson__hero-copy">
            <p>{titleCaseCategory(lesson.category)}</p>
            <h1 id="grammar-topic-title">{lesson.title}</h1>
            <div className="wvg-v13-lesson__intro">
              {isPresentPerfect
                ? "Focus on life experiences and results that continue to the present."
                : lesson.description}
            </div>
            <div className="wvg-v13-lesson__hero-actions">
              <button onClick={resumeLesson} type="button">
                Resume lesson <span aria-hidden="true">›</span>
              </button>
              <button aria-pressed={isComplete} onClick={onMarkComplete} type="button">
                <span aria-hidden="true">{isComplete ? "✓" : "◉"}</span>{" "}
                {isComplete ? "Completed" : "Mark as complete"}
              </button>
            </div>
            <small>
              Level {lesson.level}&nbsp;&nbsp; • &nbsp;&nbsp;{lessonBand(lesson)}&nbsp;&nbsp; • &nbsp;&nbsp;~15 min
            </small>
          </div>
        </header>

        <div className="wvg-v13-lesson__grid">
          <article className="wvg-v13-overview-card wvg-v13-overview-card--formula">
            <header><b>1</b><h2>Core Formula</h2></header>
            <div className="wvg-v13-formula">
              {isPresentPerfect ? "have / has    +    past participle" : lesson.title}
            </div>
            <strong>Examples</strong>
            {isPresentPerfect ? (
              <ul>
                <li>I have finished my homework.</li>
                <li>She has visited Paris.</li>
              </ul>
            ) : (
              <p>{pointSummary(usablePoints[0], lesson.description)}</p>
            )}
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--uses">
            <header><b>2</b><h2>When to Use</h2></header>
            <div className="wvg-v13-mini-list">
              {uses.map((item) => (
                <div key={`${item.title}-${item.example}`}>
                  <span aria-hidden="true">{item.mark}</span>
                  <p><strong>{item.title}</strong><small>{item.example}</small></p>
                </div>
              ))}
            </div>
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--examples">
            <header><b>3</b><h2>Examples</h2></header>
            <div className="wvg-v13-mini-list">
              {examples.map((item) => (
                <div key={`${item.title}-${item.example}`}>
                  <span aria-hidden="true">{item.mark}</span>
                  <p><strong>{item.title}</strong><small>{item.example}</small></p>
                </div>
              ))}
            </div>
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--comparison">
            <header><b>4</b><h2>{isPresentPerfect ? "Comparison with Past Simple" : "Meaning & Form"}</h2></header>
            <div className="wvg-v13-comparison">
              <section>
                <small>{isPresentPerfect ? "PAST SIMPLE" : "MEANING FIRST"}</small>
                <strong>{isPresentPerfect ? "Finished time in the past." : lesson.title}</strong>
                <p>{isPresentPerfect ? "I visited Paris last summer." : pointSummary(usablePoints[0], lesson.description)}</p>
                <em>{isPresentPerfect ? "When? Last summer." : "Choose the meaning before the form."}</em>
              </section>
              <span aria-hidden="true">VS</span>
              <section>
                <small>{isPresentPerfect ? "PRESENT PERFECT" : "FORM IN CONTEXT"}</small>
                <strong>{isPresentPerfect ? "Time not finished or result now." : "Build the form after the meaning is clear."}</strong>
                <p>{isPresentPerfect ? "I have visited Paris." : pointSummary(usablePoints[1], lesson.description)}</p>
                <em>{isPresentPerfect ? "No specific time / It matters now." : "Check word order and the surrounding context."}</em>
              </section>
            </div>
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--mistake">
            <header><b>5</b><h2>Common Mistake</h2></header>
            {isPresentPerfect ? (
              <>
                <div className="wvg-v13-mistake wvg-v13-mistake--wrong">
                  <b>×</b><p>I have went to the store.<small>× Incorrect</small></p>
                </div>
                <div className="wvg-v13-mistake wvg-v13-mistake--right">
                  <b>✓</b><p>I have gone to the store.<small>✓ Correct</small></p>
                </div>
              </>
            ) : (
              <>
                <div className="wvg-v13-mistake wvg-v13-mistake--wrong">
                  <b>×</b><p>Choosing the form before checking the meaning.<small>× Avoid</small></p>
                </div>
                <div className="wvg-v13-mistake wvg-v13-mistake--right">
                  <b>✓</b><p>{compactText(pointSummary(usablePoints[0], lesson.description), 78)}<small>✓ Check context</small></p>
                </div>
              </>
            )}
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--signals">
            <header><b>6</b><h2>Signal Words</h2></header>
            <div className="wvg-v13-signal-pills">
              {signals.map((signal) => <span key={signal}>{signal}</span>)}
            </div>
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--practice" id="grammar-overview-practice">
            <header><b>7</b><h2>Practice</h2></header>
            <p>Try a quick check to see how well you understand.</p>
            <div className="wvg-v13-practice-options">
              <button aria-pressed={practiceMode === "guided"} onClick={() => setPracticeMode("guided")} type="button">
                <strong>Guided Practice</strong><small>Step-by-step help</small>
              </button>
              <button aria-pressed={practiceMode === "quiz"} onClick={() => setPracticeMode("quiz")} type="button">
                <strong>Quick Quiz</strong><small>5 short questions</small>
              </button>
              <button aria-pressed={practiceMode === "challenge"} onClick={() => setPracticeMode("challenge")} type="button">
                <strong>Challenge</strong><small>Test your skills</small>
              </button>
            </div>
          </article>

          <article className="wvg-v13-overview-card wvg-v13-overview-card--quick-rule">
            <header><b>8</b><h2>Quick Rule</h2></header>
            <div className="wvg-v13-quick-rule">
              <span aria-hidden="true">☆</span>
              <div>
                <p>{isPresentPerfect ? "Use Present Perfect for experiences or results that connect to now." : compactText(pointSummary(usablePoints[0], lesson.description), 95)}</p>
                <p>{isPresentPerfect ? "Use Past Simple for finished time in the past." : "Meaning first; form second; then check the sentence in context."}</p>
              </div>
            </div>
          </article>
        </div>

        <aside className="wvg-v13-memory-strip">
          <span aria-hidden="true">▣</span>
          <p>Keep practicing a little each day. Small steps lead to big growth.</p>
        </aside>
      </section>
    </main>
  );
}
