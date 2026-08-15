import { useMemo, useRef, useState } from "react";

import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";

import "../../../styles/word-valley-grammar-phase1-home.css";

interface GrammarArea {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
  readonly accent: "gold" | "forest";
}

interface GrammarLesson {
  readonly title: string;
  readonly category: string;
  readonly level: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

const GRAMMAR_AREAS: readonly GrammarArea[] = Object.freeze([
  {
    eyebrow: "TENSES & TIME",
    title: "Tenses & Time",
    description: "Present, past, perfect forms, aspect, and time reference.",
    level: "A1–C1",
    accent: "gold"
  },
  {
    eyebrow: "NOUN SYSTEM",
    title: "Nouns & Articles",
    description: "Articles, countability, determiners, pronouns, and possession.",
    level: "A1–C1",
    accent: "forest"
  },
  {
    eyebrow: "VERB SYSTEM",
    title: "Modals & Verb Patterns",
    description: "Ability, obligation, advice, infinitives, gerunds, and verb patterns.",
    level: "A2–C1",
    accent: "gold"
  },
  {
    eyebrow: "SENTENCE LOGIC",
    title: "Clauses & Conditionals",
    description: "Conditionals, relative clauses, reported speech, and linking ideas.",
    level: "A2–C1",
    accent: "forest"
  },
  {
    eyebrow: "RELATIONSHIPS",
    title: "Prepositions & Linkers",
    description: "Time, place, movement, dependent prepositions, and connectors.",
    level: "A1–C1",
    accent: "gold"
  },
  {
    eyebrow: "DESCRIPTION",
    title: "Adjectives & Adverbs",
    description: "Comparison, degree, order, modifiers, and natural emphasis.",
    level: "A1–C1",
    accent: "forest"
  }
]);

const GRAMMAR_LESSONS: readonly GrammarLesson[] = Object.freeze([
  {
    title: "Present Perfect",
    category: "Tenses & Time",
    level: "B1",
    description: "Connect a past event, result, duration, or life experience to the present.",
    keywords: ["present", "perfect", "have", "has", "since", "for"]
  },
  {
    title: "Present Perfect Continuous",
    category: "Tenses & Time",
    level: "B1–B2",
    description: "Focus on an activity continuing, or recently continuing, up to now.",
    keywords: ["present", "perfect", "continuous", "have been", "has been"]
  },
  {
    title: "Past Perfect",
    category: "Tenses & Time",
    level: "B2",
    description: "Place one past event before another past reference point.",
    keywords: ["past", "perfect", "had", "before"]
  },
  {
    title: "Perfect Infinitive",
    category: "Modals & Verb Patterns",
    level: "C1",
    description: "Use “to have + past participle” to look back from another viewpoint.",
    keywords: ["perfect", "infinitive", "to have", "participle"]
  },
  {
    title: "Articles: a, an, the",
    category: "Nouns & Articles",
    level: "A1–B2",
    description: "Choose articles by reference, specificity, countability, and shared knowledge.",
    keywords: ["article", "articles", "a", "an", "the", "noun"]
  },
  {
    title: "Prepositions of time: in, on, at",
    category: "Prepositions & Linkers",
    level: "A1–A2",
    description: "Choose the natural preposition for clock times, days, dates, months, and periods.",
    keywords: ["preposition", "prepositions", "in", "on", "at", "time"]
  }
]);

const TROUBLE_SPOTS = Object.freeze([
  "for vs since",
  "in · on · at",
  "used to vs be used to",
  "much vs many"
]);

function normalizeSearch(value: string): string[] {
  return value
    .trim()
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean);
}

function includesEveryToken(haystack: string, tokens: readonly string[]): boolean {
  const normalized = haystack.toLocaleLowerCase("en");
  return tokens.every((token) => normalized.includes(token));
}

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const tokens = useMemo(() => normalizeSearch(query), [query]);
  const searching = tokens.length > 0;

  const visibleAreas = useMemo(() => {
    if (!searching) {
      return GRAMMAR_AREAS;
    }

    return GRAMMAR_AREAS.filter((area) =>
      includesEveryToken(`${area.eyebrow} ${area.title} ${area.description} ${area.level}`, tokens)
    );
  }, [searching, tokens]);

  const visibleLessons = useMemo(() => {
    if (!searching) {
      return [];
    }

    return GRAMMAR_LESSONS.filter((lesson) =>
      includesEveryToken(
        `${lesson.title} ${lesson.category} ${lesson.level} ${lesson.description} ${lesson.keywords.join(" ")}`,
        tokens
      )
    );
  }, [searching, tokens]);

  function searchFor(value: string) {
    setQuery(value);
    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
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
            <p>B1 · Tenses &amp; Time · Rule 2 of 4</p>
            <div aria-hidden="true" className="wvg-progress-track">
              <span />
            </div>
          </div>
          <button className="wvg-primary-button" onClick={() => searchFor("present perfect")} type="button">
            Continue lesson
          </button>
        </section>

        <section className={`wvg-browse${searching ? " wvg-browse--searching" : ""}`} aria-labelledby="grammar-browse-title">
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
                <button className="wvg-result-row" key={lesson.title} onClick={() => searchFor(lesson.title)} type="button">
                  <span className="wvg-result-row__copy">
                    <strong>{lesson.title}</strong>
                    <small>{lesson.description}</small>
                  </span>
                  <span className="wvg-result-row__meta">
                    <small>{lesson.level} · {lesson.category}</small>
                    <b aria-hidden="true">→</b>
                  </span>
                </button>
              ))}

              {visibleAreas.map((area) => (
                <button className="wvg-result-row wvg-result-row--area" key={area.title} onClick={() => searchFor(area.title)} type="button">
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
                  <button onClick={() => setQuery("")} type="button">Browse all grammar</button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="wvg-area-grid">
              {visibleAreas.map((area) => (
                <article className="wvg-area" data-accent={area.accent} key={area.title}>
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
              <button key={spot} onClick={() => searchFor(spot.replace(" · ", " "))} type="button">
                {spot}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
