import { useMemo, useRef, useState } from "react";

import valleyBackground from "../../../assets/background/home-background-static.png";
import { AppIcon } from "../../../design-system";

import "../../../styles/word-valley-grammar-phase1-home.css";

interface GrammarArea {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly level: string;
  readonly accent: "gold" | "forest";
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

export function GrammarPage() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleAreas = useMemo(() => {
    const tokens = normalizeSearch(query);
    if (tokens.length === 0) {
      return GRAMMAR_AREAS;
    }

    return GRAMMAR_AREAS.filter((area) => {
      const haystack = `${area.eyebrow} ${area.title} ${area.description} ${area.level}`.toLocaleLowerCase("en");
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query]);

  function focusPresentPerfect() {
    setQuery("present perfect");
    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }

  return (
    <div className="wvg-page">
      <div
        aria-hidden="true"
        className="wvg-scene"
        style={{ backgroundImage: `url("${valleyBackground}")` }}
      />
      <div aria-hidden="true" className="wvg-mist" />

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
          <button className="wvg-primary-button" onClick={focusPresentPerfect} type="button">
            Continue lesson
          </button>
        </section>

        <section className="wvg-browse" aria-labelledby="grammar-browse-title">
          <header className="wvg-browse__header">
            <div>
              <h2 id="grammar-browse-title">Browse grammar</h2>
              <p>Organized by the way English actually works.</p>
            </div>
            <span>ALL LEVELS&nbsp;&nbsp; A1 — C1</span>
          </header>

          {visibleAreas.length === 0 ? (
            <div className="wvg-empty-search" role="status">
              <strong>No matching grammar area</strong>
              <span>Try a broader word such as “tense”, “article”, or “preposition”.</span>
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
              <span key={spot}>{spot}</span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
