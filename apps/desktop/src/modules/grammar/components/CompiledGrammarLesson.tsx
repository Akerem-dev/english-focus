import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useGrammar } from "../../../app/providers";
import type { GrammarLessonSelection } from "./GrammarCurriculumHome";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

import "../../../styles/word-valley-grammar-v13-lesson.css";
import "../../../styles/word-valley-grammar-v14-section-navigation.css";

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

type OverviewSectionId =
  | "formula"
  | "uses"
  | "examples"
  | "comparison"
  | "mistake"
  | "signals"
  | "practice"
  | "quick-rule";

interface OverviewSectionDefinition {
  readonly id: OverviewSectionId;
  readonly number: number;
  readonly title: string;
}

const EMPTY_LOADED_POINTS: readonly LoadedGrammarPoint[] = Object.freeze([]);

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
  const paragraph =
    point?.answer === undefined ? undefined : splitParagraphs(point.answer.answerText)[0];
  return paragraph === undefined ? fallback : compactText(paragraph);
}

function titleCaseCategory(value: string): string {
  return value.toLocaleUpperCase("en");
}

function lessonBand(lesson: GrammarLessonSelection): string {
  const [, band] = lesson.shelfTitle.split("·");
  return band?.trim() || "Grammar Foundation";
}

function sectionDefinitions(isPresentPerfect: boolean): readonly OverviewSectionDefinition[] {
  return Object.freeze([
    { id: "formula", number: 1, title: "Core Formula" },
    { id: "uses", number: 2, title: "When to Use" },
    { id: "examples", number: 3, title: "Examples" },
    {
      id: "comparison",
      number: 4,
      title: isPresentPerfect ? "Comparison with Past Simple" : "Meaning & Form"
    },
    { id: "mistake", number: 5, title: "Common Mistake" },
    { id: "signals", number: 6, title: "Signal Words" },
    { id: "practice", number: 7, title: "Practice" },
    { id: "quick-rule", number: 8, title: "Quick Rule" }
  ]);
}

interface SectionCardProps {
  readonly className: string;
  readonly id: OverviewSectionId;
  readonly number: number;
  readonly onOpen: (sectionId: OverviewSectionId) => void;
  readonly title: string;
  readonly children: ReactNode;
}

function SectionCard({ className, id, number, onOpen, title, children }: SectionCardProps) {
  return (
    <article className={`wvg-v13-overview-card wvg-v14-section-card ${className}`}>
      <button
        aria-label={`Open ${title} section`}
        className="wvg-v14-section-card__hitbox"
        onClick={() => onOpen(id)}
        type="button"
      />
      <header>
        <b>{number}</b>
        <h2>{title}</h2>
        <span className="wvg-v14-section-card__cta" aria-hidden="true">
          Open <b>›</b>
        </span>
      </header>
      {children}
    </article>
  );
}

export function CompiledGrammarLesson({
  lesson,
  onBack,
  onMarkComplete,
  progress
}: CompiledGrammarLessonProps) {
  const { answerGrammarQuestion } = useGrammar();
  const artwork = getGrammarLessonArtwork(lesson.sourceLessonId);
  const [selectedSection, setSelectedSection] = useState<OverviewSectionId>();
  const isPresentPerfect = lesson.id === "present-perfect";
  const isComplete = progress >= 5;
  const sections = useMemo(() => sectionDefinitions(isPresentPerfect), [isPresentPerfect]);

  const requests = useMemo(
    () =>
      isPresentPerfect
        ? []
        : [
            ...lesson.coreTopics.map((topic) => ({ key: `core:${topic}`, title: topic })),
            ...lesson.subtopics.map((subtopic) => ({ key: subtopic.cardId, title: subtopic.title }))
          ].filter(
            (request, index, all) =>
              all.findIndex((candidate) => candidate.title === request.title) === index
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
    if (requests.length === 0) return;

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

  const points =
    requests.length === 0
      ? EMPTY_LOADED_POINTS
      : loadedState.requestKey === requestKey
        ? loadedState.points
        : loadingPoints;
  const readyPoints = points.filter(
    (point) => point.status === "ready" && point.answer !== undefined
  );
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
      example: pointSummary(
        point,
        `Use ${lesson.title} in a natural sentence and check the meaning.`
      )
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

  function openSection(sectionId: OverviewSectionId) {
    setSelectedSection(sectionId);
  }

  function resumeLesson() {
    setSelectedSection("formula");
  }

  function renderComparison() {
    return (
      <div className="wvg-v13-comparison">
        <section>
          <small>{isPresentPerfect ? "PAST SIMPLE" : "MEANING FIRST"}</small>
          <strong>{isPresentPerfect ? "Finished time in the past." : lesson.title}</strong>
          <p>
            {isPresentPerfect
              ? "I visited Paris last summer."
              : pointSummary(usablePoints[0], lesson.description)}
          </p>
          <em>{isPresentPerfect ? "When? Last summer." : "Choose the meaning before the form."}</em>
        </section>
        <span aria-hidden="true">VS</span>
        <section>
          <small>{isPresentPerfect ? "PRESENT PERFECT" : "FORM IN CONTEXT"}</small>
          <strong>
            {isPresentPerfect
              ? "Time not finished or result now."
              : "Build the form after the meaning is clear."}
          </strong>
          <p>
            {isPresentPerfect
              ? "I have visited Paris."
              : pointSummary(usablePoints[1], lesson.description)}
          </p>
          <em>
            {isPresentPerfect
              ? "No specific time / It matters now."
              : "Check word order and the surrounding context."}
          </em>
        </section>
      </div>
    );
  }

  function renderMistake() {
    return isPresentPerfect ? (
      <>
        <div className="wvg-v13-mistake wvg-v13-mistake--wrong">
          <b>×</b>
          <p>
            I have went to the store.<small>× Incorrect</small>
          </p>
        </div>
        <div className="wvg-v13-mistake wvg-v13-mistake--right">
          <b>✓</b>
          <p>
            I have gone to the store.<small>✓ Correct</small>
          </p>
        </div>
      </>
    ) : (
      <>
        <div className="wvg-v13-mistake wvg-v13-mistake--wrong">
          <b>×</b>
          <p>
            Choosing the form before checking the meaning.<small>× Avoid</small>
          </p>
        </div>
        <div className="wvg-v13-mistake wvg-v13-mistake--right">
          <b>✓</b>
          <p>
            {compactText(pointSummary(usablePoints[0], lesson.description), 78)}
            <small>✓ Check context</small>
          </p>
        </div>
      </>
    );
  }

  function renderSectionDetail(sectionId: OverviewSectionId) {
    const sectionIndex = sections.findIndex((section) => section.id === sectionId);
    const section = sections[sectionIndex];
    const previous = sectionIndex > 0 ? sections[sectionIndex - 1] : undefined;
    const next = sectionIndex < sections.length - 1 ? sections[sectionIndex + 1] : undefined;

    return (
      <main
        className="wvg-v13-lesson wvg-v14-section-detail"
        aria-labelledby="grammar-section-title"
      >
        <section className="wvg-v13-lesson__paper wvg-v14-section-detail__paper">
          <nav aria-label="Grammar section breadcrumb" className="wvg-v13-lesson__breadcrumb">
            <button onClick={() => setSelectedSection(undefined)} type="button">
              ← Lesson overview
            </button>
            <span aria-hidden="true">›</span>
            <span>{lesson.title}</span>
            <span aria-hidden="true">›</span>
            <strong>{section.title}</strong>
          </nav>

          <header className="wvg-v14-section-detail__hero">
            <img alt="" aria-hidden="true" draggable={false} src={artwork} />
            <span aria-hidden="true" />
            <div>
              <p>
                SECTION {section.number} OF {sections.length}
              </p>
              <h1 id="grammar-section-title">{section.title}</h1>
              <small>{lesson.title}</small>
            </div>
          </header>

          <div className="wvg-v14-section-detail__layout">
            <aside className="wvg-v14-section-map" aria-label="Lesson sections">
              <p>LESSON MAP</p>
              {sections.map((item) => (
                <button
                  aria-current={item.id === sectionId ? "step" : undefined}
                  key={item.id}
                  onClick={() => setSelectedSection(item.id)}
                  type="button"
                >
                  <span>{item.number}</span>
                  {item.title}
                </button>
              ))}
            </aside>

            <article className="wvg-v14-section-content">
              {sectionId === "formula" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">BUILD THE FORM</p>
                  <h2>The structure at a glance</h2>
                  <div className="wvg-v13-formula wvg-v14-section-formula">
                    {isPresentPerfect ? "have / has + past participle" : lesson.title}
                  </div>
                  <p>{pointSummary(usablePoints[0], lesson.description)}</p>
                  {isPresentPerfect && (
                    <ul>
                      <li>I have finished my homework.</li>
                      <li>She has visited Paris.</li>
                    </ul>
                  )}
                </>
              )}

              {sectionId === "uses" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">CHOOSE THE RIGHT CONTEXT</p>
                  <h2>When this grammar belongs in a sentence</h2>
                  <div className="wvg-v13-mini-list wvg-v14-section-mini-list">
                    {uses.map((item) => (
                      <div key={`${item.title}-${item.example}`}>
                        <span aria-hidden="true">{item.mark}</span>
                        <p>
                          <strong>{item.title}</strong>
                          <small>{item.example}</small>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {sectionId === "examples" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">SEE IT IN CONTEXT</p>
                  <h2>Natural examples</h2>
                  <div className="wvg-v13-mini-list wvg-v14-section-mini-list">
                    {examples.map((item) => (
                      <div key={`${item.title}-${item.example}`}>
                        <span aria-hidden="true">{item.mark}</span>
                        <p>
                          <strong>{item.title}</strong>
                          <small>{item.example}</small>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {sectionId === "comparison" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">MAKE THE CONTRAST CLEAR</p>
                  <h2>{section.title}</h2>
                  <div className="wvg-v14-section-comparison">{renderComparison()}</div>
                </>
              )}

              {sectionId === "mistake" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">SPOT THE ERROR</p>
                  <h2>What learners often get wrong</h2>
                  <div className="wvg-v14-section-mistakes">{renderMistake()}</div>
                </>
              )}

              {sectionId === "signals" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">NOTICE THE CLUES</p>
                  <h2>Words that often signal this structure</h2>
                  <div className="wvg-v13-signal-pills wvg-v14-section-signals">
                    {signals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                  <p>
                    Signal words are clues, not automatic rules. Check the meaning and time context
                    before choosing the form.
                  </p>
                </>
              )}

              {sectionId === "practice" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">APPLY WHAT YOU LEARNED</p>
                  <h2>Three ways to practise</h2>
                  <p>
                    This lesson will use three practice modes. Their full question flows are the
                    next implementation stage; this screen now acts as the single honest entry
                    point.
                  </p>
                  <div className="wvg-v14-practice-mode-list">
                    <div>
                      <strong>Guided Practice</strong>
                      <small>Step-by-step help and explanations.</small>
                    </div>
                    <div>
                      <strong>Quick Quiz</strong>
                      <small>Five short checks for fast recall.</small>
                    </div>
                    <div>
                      <strong>Challenge</strong>
                      <small>Harder production and error-correction tasks.</small>
                    </div>
                  </div>
                </>
              )}

              {sectionId === "quick-rule" && (
                <>
                  <p className="wvg-v14-section-content__eyebrow">LEAVE WITH ONE RULE</p>
                  <h2>Quick Rule</h2>
                  <div className="wvg-v13-quick-rule wvg-v14-section-quick-rule">
                    <span aria-hidden="true">☆</span>
                    <div>
                      <p>
                        {isPresentPerfect
                          ? "Use Present Perfect for experiences or results that connect to now."
                          : compactText(pointSummary(usablePoints[0], lesson.description), 140)}
                      </p>
                      <p>
                        {isPresentPerfect
                          ? "Use Past Simple for finished time in the past."
                          : "Meaning first; form second; then check the sentence in context."}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </article>
          </div>

          <footer className="wvg-v14-section-detail__footer">
            <button
              disabled={previous === undefined}
              onClick={() => previous !== undefined && setSelectedSection(previous.id)}
              type="button"
            >
              {previous === undefined ? "Start of lesson" : `← ${previous.title}`}
            </button>
            <button onClick={() => setSelectedSection(undefined)} type="button">
              Lesson overview
            </button>
            <button
              disabled={next === undefined}
              onClick={() => next !== undefined && setSelectedSection(next.id)}
              type="button"
            >
              {next === undefined ? "End of lesson" : `${next.title} →`}
            </button>
          </footer>
        </section>
      </main>
    );
  }

  if (selectedSection !== undefined) {
    return renderSectionDetail(selectedSection);
  }

  return (
    <main className="wvg-v13-lesson" aria-labelledby="grammar-topic-title">
      <section className="wvg-v13-lesson__paper">
        <nav aria-label="Grammar breadcrumb" className="wvg-v13-lesson__breadcrumb">
          <button onClick={onBack} type="button">
            ← Grammar
          </button>
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
                Start lesson <span aria-hidden="true">›</span>
              </button>
              <button aria-pressed={isComplete} onClick={onMarkComplete} type="button">
                <span aria-hidden="true">{isComplete ? "✓" : "◉"}</span>{" "}
                {isComplete ? "Completed" : "Mark as complete"}
              </button>
            </div>
            <small>
              Level {lesson.level}&nbsp;&nbsp; • &nbsp;&nbsp;{lessonBand(lesson)}&nbsp;&nbsp; •
              &nbsp;&nbsp;~15 min
            </small>
          </div>
        </header>

        <div className="wvg-v14-overview-guide">
          <div>
            <strong>Lesson map</strong>
            <span>
              Choose a section to study. These cards are short previews, not the full lesson.
            </span>
          </div>
          <small>1 → 8 recommended order</small>
        </div>

        <div className="wvg-v13-lesson__grid">
          <SectionCard
            className="wvg-v13-overview-card--formula"
            id="formula"
            number={1}
            onOpen={openSection}
            title="Core Formula"
          >
            <div className="wvg-v13-formula">
              {isPresentPerfect ? "have / has + past participle" : lesson.title}
            </div>
            <p>{pointSummary(usablePoints[0], lesson.description)}</p>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--uses"
            id="uses"
            number={2}
            onOpen={openSection}
            title="When to Use"
          >
            <div className="wvg-v13-mini-list wvg-v14-preview-list">
              {uses.slice(0, 2).map((item) => (
                <div key={`${item.title}-${item.example}`}>
                  <span aria-hidden="true">{item.mark}</span>
                  <p>
                    <strong>{item.title}</strong>
                    <small>{item.example}</small>
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--examples"
            id="examples"
            number={3}
            onOpen={openSection}
            title="Examples"
          >
            <div className="wvg-v13-mini-list wvg-v14-preview-list">
              {examples.slice(0, 2).map((item) => (
                <div key={`${item.title}-${item.example}`}>
                  <span aria-hidden="true">{item.mark}</span>
                  <p>
                    <strong>{item.title}</strong>
                    <small>{item.example}</small>
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--comparison"
            id="comparison"
            number={4}
            onOpen={openSection}
            title={isPresentPerfect ? "Comparison with Past Simple" : "Meaning & Form"}
          >
            <div className="wvg-v14-comparison-preview">
              <span>{isPresentPerfect ? "Past Simple: finished past time" : "Meaning first"}</span>
              <b>VS</b>
              <span>
                {isPresentPerfect ? "Present Perfect: connected to now" : "Form in context"}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--mistake"
            id="mistake"
            number={5}
            onOpen={openSection}
            title="Common Mistake"
          >
            <div className="wvg-v14-mistake-preview">
              <span>× {isPresentPerfect ? "I have went..." : "Form before meaning"}</span>
              <span>✓ {isPresentPerfect ? "I have gone..." : "Check the context first"}</span>
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--signals"
            id="signals"
            number={6}
            onOpen={openSection}
            title="Signal Words"
          >
            <div className="wvg-v13-signal-pills">
              {signals.slice(0, 6).map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--practice"
            id="practice"
            number={7}
            onOpen={openSection}
            title="Practice"
          >
            <p>Three practice modes will live inside this section.</p>
            <div className="wvg-v14-practice-preview">
              <span>Guided</span>
              <span>5-question Quiz</span>
              <span>Challenge</span>
            </div>
          </SectionCard>

          <SectionCard
            className="wvg-v13-overview-card--quick-rule"
            id="quick-rule"
            number={8}
            onOpen={openSection}
            title="Quick Rule"
          >
            <div className="wvg-v13-quick-rule">
              <span aria-hidden="true">☆</span>
              <div>
                <p>
                  {isPresentPerfect
                    ? "Use Present Perfect when the past still connects to now."
                    : compactText(pointSummary(usablePoints[0], lesson.description), 95)}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="wvg-v13-memory-strip">
          <span aria-hidden="true">▣</span>
          <p>Keep practicing a little each day. Small steps lead to big growth.</p>
        </aside>
      </section>
    </main>
  );
}
