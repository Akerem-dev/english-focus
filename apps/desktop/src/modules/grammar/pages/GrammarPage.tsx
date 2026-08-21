import { useMemo, useRef, useState } from "react";

import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";
import { CompiledGrammarLesson } from "../components/CompiledGrammarLesson";
import { PresentPerfectReferenceLesson } from "../components/PresentPerfectReferenceLesson";
import {
  GRAMMAR_KNOWLEDGE_AREAS,
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson
} from "../knowledge/grammarKnowledgeIndex";

import "../../../styles/word-valley-grammar-phase1-home.css";
import "../../../styles/word-valley-grammar-phase2-topic.css";
import "../../../styles/word-valley-grammar-reference-final.css";
import "../../../styles/word-valley-grammar-shell-final.css";

type GrammarView = "home" | "present-perfect" | "compiled-lesson";

const TROUBLE_SPOTS = Object.freeze([
  "for vs since",
  "in · on · at",
  "used to vs be used to",
  "much vs many"
]);

function normalizeSearch(value: string): string[] {
  return value.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
}

function includesEveryToken(haystack: string, tokens: readonly string[]): boolean {
  const normalized = haystack.toLocaleLowerCase("en");
  return tokens.every((token) => normalized.includes(token));
}

function lessonSearchText(lesson: (typeof GRAMMAR_KNOWLEDGE_LESSONS)[number]): string {
  const subtopicTitles = lesson.subtopics.map((subtopic) => subtopic.title).join(" ");
  return `${lesson.title} ${lesson.category} ${lesson.level} ${lesson.description} ${lesson.keywords.join(" ")} ${lesson.coreTopics.join(" ")} ${subtopicTitles}`;
}

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<GrammarView>("home");
  const [selectedLesson, setSelectedLesson] = useState<GrammarKnowledgeLesson | undefined>();
  const searchRef = useRef<HTMLInputElement>(null);
  const tokens = useMemo(() => normalizeSearch(query), [query]);
  const searching = tokens.length > 0;

  const visibleAreas = useMemo(() => {
    if (!searching) return GRAMMAR_KNOWLEDGE_AREAS;
    return GRAMMAR_KNOWLEDGE_AREAS.filter((area) =>
      includesEveryToken(`${area.eyebrow} ${area.title} ${area.description} ${area.level}`, tokens)
    );
  }, [searching, tokens]);

  const visibleLessons = useMemo(() => {
    if (!searching) return [];
    return GRAMMAR_KNOWLEDGE_LESSONS.filter((lesson) =>
      includesEveryToken(lessonSearchText(lesson), tokens)
    );
  }, [searching, tokens]);

  function searchFor(value: string) {
    setQuery(value);
    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }

  function openPresentPerfect() {
    setQuery("");
    setSelectedLesson(undefined);
    setView("present-perfect");
  }

  function openLesson(lesson: GrammarKnowledgeLesson) {
    if (lesson.id === "present-perfect") {
      openPresentPerfect();
      return;
    }

    setQuery("");
    setSelectedLesson(lesson);
    setView("compiled-lesson");
  }

  function returnHome() {
    setQuery("");
    setSelectedLesson(undefined);
    setView("home");
  }

  function activateArea(title: string) {
    searchFor(title);
  }

  const resultCount = visibleLessons.length + visibleAreas.length;

  return (
    <div className="wvg-page">
      <div
        aria-hidden="true"
        className="wvg-scene"
        style={{ backgroundImage: `url("${grammarBackground}")` }}
      />
      <div aria-hidden="true" className="wvg-scene-veil" />

      {view === "present-perfect" ? (
        <PresentPerfectReferenceLesson onBack={returnHome} />
      ) : view === "compiled-lesson" && selectedLesson !== undefined ? (
        <CompiledGrammarLesson lesson={selectedLesson} onBack={returnHome} />
      ) : (
        <main className="wvg-home" aria-labelledby="grammar-home-title">
          <header className="wvg-home__header">
            <div className="wvg-home__intro">
              <p className="wvg-eyebrow">YOUR GRAMMAR STUDIO</p>
              <h1 id="grammar-home-title">English Grammar</h1>
              <p>Understand the patterns behind natural English — one clear lesson at a time.</p>
            </div>

            <label className="wvg-search">
              <AppIcon name="search" size={17} />
              <input
                aria-label="Search grammar topics"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search grammar topics…"
                ref={searchRef}
                type="search"
                value={query}
              />
            </label>
          </header>

          <section aria-label="Continue learning" className="wvg-continue">
            <div className="wvg-continue__copy">
              <p className="wvg-section-label">CONTINUE LEARNING</p>
              <h2>Present Perfect</h2>
              <p>B1 · Tenses &amp; Time</p>
              <div aria-hidden="true" className="wvg-progress-track">
                <span />
              </div>
            </div>
            <button className="wvg-primary-button" onClick={openPresentPerfect} type="button">
              Continue lesson
            </button>
          </section>

          <section
            className={`wvg-browse${searching ? " wvg-browse--searching" : ""}`}
            aria-labelledby="grammar-browse-title"
          >
            <header className="wvg-browse__header">
              <div>
                <h2 id="grammar-browse-title">{searching ? "Search results" : "Browse grammar"}</h2>
                <p>
                  {searching
                    ? `${resultCount} ${resultCount === 1 ? "result" : "results"} for “${query.trim()}”.`
                    : "Organized by the way English actually works."}
                </p>
              </div>
              <span>{searching ? "GRAMMAR INDEX" : "ALL LEVELS  A1 — C1"}</span>
            </header>

            {searching ? (
              <div className="wvg-search-results" role="status">
                {visibleLessons.map((lesson) => (
                  <button
                    className="wvg-result-row"
                    data-implemented="true"
                    key={lesson.id}
                    onClick={() => openLesson(lesson)}
                    type="button"
                  >
                    <span className="wvg-result-row__copy">
                      <strong>{lesson.title}</strong>
                      <small>{lesson.description}</small>
                    </span>
                    <span className="wvg-result-row__meta">
                      <small>
                        {lesson.level} · {lesson.category}
                      </small>
                      <b aria-hidden="true">→</b>
                    </span>
                  </button>
                ))}

                {visibleAreas.map((area) => (
                  <button
                    className="wvg-result-row wvg-result-row--area"
                    key={area.id}
                    onClick={() => searchFor(area.title)}
                    type="button"
                  >
                    <span className="wvg-result-row__copy">
                      <strong>{area.title}</strong>
                      <small>{area.description}</small>
                    </span>
                    <span className="wvg-result-row__meta">
                      <small>{area.level} · Grammar area</small>
                      <b aria-hidden="true">→</b>
                    </span>
                  </button>
                ))}

                {resultCount === 0 ? (
                  <div className="wvg-empty-search">
                    <strong>No matching grammar topic</strong>
                    <span>Try a broader word such as “tense”, “article”, or “preposition”.</span>
                    <button onClick={() => setQuery("")} type="button">
                      Browse all grammar
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="wvg-area-grid">
                {visibleAreas.map((area) => (
                  <article
                    className="wvg-area"
                    data-accent={area.accent}
                    key={area.id}
                    onClick={() => activateArea(area.title)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        activateArea(area.title);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <i aria-hidden="true" />
                    <p>{area.eyebrow}</p>
                    <h3>{area.title}</h3>
                    <span>{area.description}</span>
                    <small>{area.level}</small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-label="Common trouble spots" className="wvg-trouble-spots">
            <strong>COMMON TROUBLE SPOTS</strong>
            <div>
              {TROUBLE_SPOTS.map((spot) => (
                <button
                  key={spot}
                  onClick={() => searchFor(spot.replace(/\s*·\s*/g, " "))}
                  type="button"
                >
                  {spot}
                </button>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
