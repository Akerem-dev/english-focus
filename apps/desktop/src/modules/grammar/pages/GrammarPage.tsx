import { useMemo, useRef, useState } from "react";

import grammarBackground from "../../../assets/collections/collections-background.png";
import { AppIcon } from "../../../design-system";

import "../../../styles/word-valley-grammar-phase1-home.css";
import "../../../styles/word-valley-grammar-phase2-topic.css";

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

type GrammarView = "home" | "present-perfect";

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
  const [view, setView] = useState<GrammarView>("home");
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

  function openPresentPerfect() {
    setQuery("");
    setView("present-perfect");
  }

  function returnHome() {
    setQuery("");
    setView("home");
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
        <PresentPerfectRule onBack={returnHome} />
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
              <p>B1 · Tenses &amp; Time · Rule 2 of 4</p>
              <div aria-hidden="true" className="wvg-progress-track">
                <span />
              </div>
            </div>
            <button className="wvg-primary-button" onClick={openPresentPerfect} type="button">
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
                  <button
                    className="wvg-result-row"
                    key={lesson.title}
                    onClick={lesson.title === "Present Perfect" ? openPresentPerfect : () => searchFor(lesson.title)}
                    type="button"
                  >
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
      )}
    </div>
  );
}

interface PresentPerfectRuleProps {
  readonly onBack: () => void;
}

function PresentPerfectRule({ onBack }: PresentPerfectRuleProps) {
  return (
    <main className="wvg-topic" aria-labelledby="grammar-topic-title">
      <button className="wvg-topic__back" onClick={onBack} type="button">
        ← Grammar home
      </button>

      <section className="wvg-topic__paper">
        <header className="wvg-topic__hero">
          <div className="wvg-topic__intro">
            <p className="wvg-topic__eyebrow">TENSES &amp; TIME · B1</p>
            <h1 id="grammar-topic-title">Present Perfect</h1>
            <p>Connect past events to the present without anchoring them to a finished past time.</p>
          </div>

          <div className="wvg-topic__turkish">
            <span>TÜRKÇE</span>
            <p>Geçmişte gerçekleşen bir olayın sonucu, deneyimi veya süresi bugünle bağlantılıysa kullanılır.</p>
          </div>
        </header>

        <nav className="wvg-topic-tabs" aria-label="Present Perfect lesson sections">
          <button aria-current="page" className="is-active" type="button">Rule</button>
          <button disabled type="button">Examples</button>
          <button disabled type="button">Compare</button>
          <button disabled type="button">Practice</button>
        </nav>

        <div className="wvg-rule-layout">
          <article className="wvg-rule-main">
            <section className="wvg-pattern" aria-labelledby="present-perfect-pattern-title">
              <p>CORE PATTERN</p>
              <h2 id="present-perfect-pattern-title">have / has + past participle</h2>
              <div>
                <span>I have finished.</span>
                <span>She has arrived.</span>
                <span>They have never seen it.</span>
              </div>
            </section>

            <section className="wvg-rule-copy">
              <p className="wvg-rule-kicker">THE IDEA BEHIND THE FORM</p>
              <h2>Look backward from now.</h2>
              <p>
                The Present Perfect does not simply describe “the past”. It looks back from the present.
                The exact past time is not the focus; what matters is the experience, result, duration, or
                present relevance of the event.
              </p>
              <p className="wvg-rule-copy__tr">
                Türkçede tek bir zamanla birebir eşleşmez. Cümlenin anlamına göre “yaptım”, “yapmış bulunuyorum”
                veya “...den beri yapıyorum” gibi farklı biçimlerde karşılanabilir.
              </p>
            </section>

            <section className="wvg-rule-examples" aria-label="Present Perfect quick examples">
              <div>
                <strong>I’ve lost my keys.</strong>
                <span>Result now: I cannot open the door.</span>
              </div>
              <div>
                <strong>We’ve lived here for six years.</strong>
                <span>The situation began in the past and still continues.</span>
              </div>
              <div>
                <strong>Have you ever tried skiing?</strong>
                <span>Life experience; no finished past time is named.</span>
              </div>
            </section>
          </article>

          <aside className="wvg-rule-notes" aria-label="Present Perfect reference notes">
            <section>
              <p>USE IT WHEN</p>
              <ul>
                <li>a past result matters now</li>
                <li>an experience has no finished time</li>
                <li>a state continues until now</li>
                <li>the time period is still unfinished</li>
              </ul>
            </section>

            <section>
              <p>SIGNAL WORDS</p>
              <div className="wvg-signal-words">just · already · yet · ever · never · since · for · recently</div>
            </section>

            <section className="wvg-common-mistake">
              <p>COMMON MISTAKE</p>
              <del>I have seen him yesterday.</del>
              <strong>I saw him yesterday.</strong>
              <span>“Yesterday” names a finished past time, so Past Simple is the natural choice.</span>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
