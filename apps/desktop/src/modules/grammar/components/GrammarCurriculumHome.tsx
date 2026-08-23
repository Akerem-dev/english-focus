import { useMemo, useState } from "react";

import { AppIcon } from "../../../design-system";
import {
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson
} from "../knowledge/grammarKnowledgeIndex";

import "../../../styles/word-valley-grammar-curriculum.css";

interface GrammarCurriculumHomeProps {
  readonly lastLesson?: GrammarKnowledgeLesson;
  readonly onOpenLesson: (lesson: GrammarKnowledgeLesson) => void;
}

interface CurriculumLevel {
  readonly code: "A1" | "A2" | "B1" | "B2" | "C1";
  readonly eyebrow: string;
  readonly description: string;
  readonly lessonIds: readonly string[];
}

const CURRICULUM_LEVELS: readonly CurriculumLevel[] = Object.freeze([
  {
    code: "A1",
    eyebrow: "FOUNDATIONS",
    description: "Build the sentence basics.",
    lessonIds: Object.freeze([
      "present-simple-continuous",
      "articles",
      "demonstratives",
      "countability-quantifiers"
    ])
  },
  {
    code: "A2",
    eyebrow: "BUILDING BLOCKS",
    description: "Past, future, quantity, comparison.",
    lessonIds: Object.freeze([
      "past-narrative",
      "future-forms",
      "modal-verbs",
      "time-prepositions"
    ])
  },
  {
    code: "B1",
    eyebrow: "CONNECT IDEAS",
    description: "Tense choice, clauses, and conditions.",
    lessonIds: Object.freeze([
      "present-perfect",
      "conditionals",
      "relative-clauses",
      "gerunds-infinitives"
    ])
  },
  {
    code: "B2",
    eyebrow: "PRECISION",
    description: "Sequence, deduction, and precision.",
    lessonIds: Object.freeze([
      "present-perfect-continuous",
      "past-perfect-family",
      "active-passive",
      "reported-speech"
    ])
  },
  {
    code: "C1",
    eyebrow: "NATURAL CONTROL",
    description: "Emphasis, nuance, and advanced style.",
    lessonIds: Object.freeze([
      "emphasis-advanced",
      "dependent-prepositions",
      "causative-reporting-passive",
      "comparison"
    ])
  }
]);

const LESSON_BY_ID = new Map(GRAMMAR_KNOWLEDGE_LESSONS.map((lesson) => [lesson.id, lesson]));
const FIRST_LESSON = LESSON_BY_ID.get("present-simple-continuous");

function normalizeSearch(value: string): readonly string[] {
  return value.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
}

function searchText(lesson: GrammarKnowledgeLesson): string {
  return [
    lesson.title,
    lesson.category,
    lesson.level,
    lesson.description,
    ...lesson.keywords,
    ...lesson.coreTopics,
    ...lesson.subtopics.map((topic) => topic.title)
  ]
    .join(" ")
    .toLocaleLowerCase("en");
}

function levelLessons(level: CurriculumLevel): readonly GrammarKnowledgeLesson[] {
  return level.lessonIds
    .map((lessonId) => LESSON_BY_ID.get(lessonId))
    .filter((lesson): lesson is GrammarKnowledgeLesson => lesson !== undefined);
}

export function GrammarCurriculumHome({
  lastLesson,
  onOpenLesson
}: GrammarCurriculumHomeProps) {
  const [query, setQuery] = useState("");
  const tokens = useMemo(() => normalizeSearch(query), [query]);
  const searchResults = useMemo(() => {
    if (tokens.length === 0) return [];
    return GRAMMAR_KNOWLEDGE_LESSONS.filter((lesson) => {
      const haystack = searchText(lesson);
      return tokens.every((token) => haystack.includes(token));
    }).slice(0, 12);
  }, [tokens]);

  const heroLesson = lastLesson ?? FIRST_LESSON;
  const continuing = lastLesson !== undefined;

  return (
    <main className="wvg-curriculum" aria-labelledby="grammar-curriculum-title">
      <section className="wvg-curriculum__surface">
        <header className="wvg-curriculum__header">
          <div>
            <p className="wvg-curriculum__eyebrow">YOUR GRAMMAR PATH</p>
            <h1 id="grammar-curriculum-title">Learn grammar in the right order.</h1>
            <p className="wvg-curriculum__intro">
              Start with foundations, build control step by step, and always know what comes next.
            </p>
          </div>

          <label className="wvg-curriculum__search">
            <AppIcon name="search" size={17} />
            <input
              aria-label="Search grammar lessons"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search grammar lessons…"
              type="search"
              value={query}
            />
          </label>
        </header>

        {heroLesson === undefined ? null : (
          <section className="wvg-curriculum__hero" aria-label={continuing ? "Continue learning" : "Start here"}>
            <div>
              <p>{continuing ? "CONTINUE LEARNING" : "START HERE · A1 FOUNDATIONS"}</p>
              <h2>{heroLesson.title}</h2>
              <span>
                {continuing
                  ? `${heroLesson.level} · ${heroLesson.category}`
                  : "Begin with routines, facts, and actions happening around now."}
              </span>
            </div>
            <button onClick={() => onOpenLesson(heroLesson)} type="button">
              {continuing ? "Continue lesson" : "Begin first lesson"}
              <AppIcon name="chevron-right" size={17} />
            </button>
          </section>
        )}

        {tokens.length > 0 ? (
          <section className="wvg-curriculum__results" aria-labelledby="grammar-search-results-title">
            <div className="wvg-curriculum__section-heading">
              <div>
                <h2 id="grammar-search-results-title">Search results</h2>
                <p>
                  {searchResults.length === 0
                    ? `No lesson matched “${query.trim()}”.`
                    : `${searchResults.length} lesson${searchResults.length === 1 ? "" : "s"} matched “${query.trim()}”.`}
                </p>
              </div>
              <button onClick={() => setQuery("")} type="button">
                Back to learning path
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="wvg-curriculum__empty-search">
                <strong>Try a broader grammar word.</strong>
                <span>For example: tense, article, modal, conditional, or preposition.</span>
              </div>
            ) : (
              <div className="wvg-curriculum__result-grid">
                {searchResults.map((lesson) => (
                  <button key={lesson.id} onClick={() => onOpenLesson(lesson)} type="button">
                    <span>
                      <small>{lesson.category}</small>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.description}</p>
                    </span>
                    <b>{lesson.level}</b>
                    <AppIcon name="chevron-right" size={17} />
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="wvg-curriculum__path" aria-labelledby="grammar-path-title">
            <div className="wvg-curriculum__section-heading">
              <div>
                <h2 id="grammar-path-title">Your learning path</h2>
                <p>
                  Five levels, one clear sequence. You can open any lesson, but this is the recommended order.
                </p>
              </div>
              <span>EASIER&nbsp;&nbsp;→&nbsp;&nbsp;HARDER</span>
            </div>

            <div className="wvg-curriculum__levels">
              {CURRICULUM_LEVELS.map((level) => {
                const lessons = levelLessons(level);
                return (
                  <article className="wvg-curriculum__level" data-level={level.code} key={level.code}>
                    <div className="wvg-curriculum__level-meta">
                      <b>{level.code}</b>
                      <div>
                        <small>{level.eyebrow}</small>
                        <strong>{level.description}</strong>
                        <span>{lessons.length} featured lessons</span>
                      </div>
                    </div>

                    <div className="wvg-curriculum__lesson-grid">
                      {lessons.map((lesson) => (
                        <button key={lesson.id} onClick={() => onOpenLesson(lesson)} type="button">
                          <small>{lesson.category}</small>
                          <strong>{lesson.title}</strong>
                          <AppIcon name="chevron-right" size={15} />
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
