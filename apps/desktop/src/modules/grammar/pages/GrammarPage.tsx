import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AppIcon } from "../../../design-system";

type GrammarTopic = Readonly<{
  title: string;
  formula: string;
  progress: number;
  featured?: boolean;
  lesson?: "present-perfect";
}>;

type GrammarShelf = Readonly<{
  level: string;
  title: string;
  description: string;
  topics: readonly GrammarTopic[];
}>;

const SHELVES: readonly GrammarShelf[] = Object.freeze([
  {
    level: "A1",
    title: "Grammar Foundation",
    description: "Build your core grammar skills.",
    topics: Object.freeze([
      { title: "Present Simple", formula: "S · V(s/es) · O", progress: 3, featured: true },
      { title: "Be: am / is / are", formula: "S · am / is / are · O", progress: 2 },
      { title: "There is / There are", formula: "There is / are · N", progress: 0 },
      { title: "Present Continuous", formula: "S · am/is/are · V-ing · O", progress: 1 },
      { title: "Can / Could", formula: "Ability & possibility", progress: 0 },
      { title: "Wh- Questions", formula: "Who, what, when, where", progress: 0 }
    ])
  },
  {
    level: "A2",
    title: "Building Confidence",
    description: "Expand your expression and connect ideas.",
    topics: Object.freeze([
      { title: "Past Simple", formula: "S · V-ed · O", progress: 1 },
      { title: "Used to", formula: "Past habits & states", progress: 0 },
      {
        title: "Present Perfect",
        formula: "have / has · past participle",
        progress: 0,
        lesson: "present-perfect"
      },
      { title: "Past Continuous", formula: "S · was / were · V-ing", progress: 0 },
      { title: "Going to", formula: "Plans & intentions", progress: 0 },
      { title: "Comparatives", formula: "-er / more ... than", progress: 0 }
    ])
  },
  {
    level: "B1",
    title: "Express Yourself",
    description: "Share opinions, make arguments, and tell stories.",
    topics: Object.freeze([
      { title: "Future Continuous", formula: "S · will be · V-ing · O", progress: 0 },
      { title: "Present Perfect Continuous", formula: "have been · V-ing", progress: 0 },
      { title: "Modal Perfects", formula: "must have, should have", progress: 0 },
      { title: "Relative Clauses", formula: "who, which, that", progress: 0 },
      { title: "Passive Voice", formula: "be + past participle", progress: 0 },
      { title: "Reported Speech", formula: "say / tell / ask", progress: 0 }
    ])
  }
]);

function LessonArtwork() {
  return (
    <div aria-hidden="true" className="grammar-artwork">
      <span className="grammar-artwork__mountain grammar-artwork__mountain--far" />
      <span className="grammar-artwork__mountain grammar-artwork__mountain--near" />
      <span className="grammar-artwork__bridge" />
      <span className="grammar-artwork__trees grammar-artwork__trees--left">▲ ▲</span>
      <span className="grammar-artwork__trees grammar-artwork__trees--right">▲ ▲ ▲</span>
    </div>
  );
}

function Hero({ onResume }: { readonly onResume: () => void }) {
  return (
    <section className="grammar-hero">
      <div className="grammar-hero__copy">
        <span className="grammar-hero__eyebrow">RECOMMENDED NEXT LESSON</span>
        <h1>Present Perfect</h1>
        <p>Focus on life experiences and results that continue to the present.</p>
        <div className="grammar-hero__actions">
          <button
            className="grammar-button grammar-button--outline"
            onClick={onResume}
            type="button"
          >
            Resume lesson <span aria-hidden="true">›</span>
          </button>
          <button className="grammar-link-button" type="button">
            <span aria-hidden="true">◉</span> Mark as complete
          </button>
        </div>
        <div className="grammar-hero__meta">
          <span>Level A2</span>
          <span>Grammar Foundation</span>
          <span>~15 min</span>
        </div>
      </div>
      <LessonArtwork />
    </section>
  );
}

function TopicCard({
  topic,
  onOpen
}: {
  readonly topic: GrammarTopic;
  readonly onOpen: () => void;
}) {
  const clickable = topic.lesson !== undefined;

  return (
    <button
      className="grammar-topic-card"
      data-featured={topic.featured || undefined}
      disabled={!clickable}
      onClick={onOpen}
      type="button"
    >
      <span className="grammar-topic-card__topline">
        <strong>{topic.title}</strong>
        <span aria-hidden="true" className="grammar-topic-card__status">
          {topic.featured ? "★" : "●"}
        </span>
      </span>
      <span className="grammar-topic-card__formula">{topic.formula}</span>
      <span className="grammar-topic-card__progress-row">
        <span className="grammar-topic-card__track">
          <span style={{ width: `${topic.progress * 20}%` }} />
        </span>
        <small>{topic.progress} / 5</small>
      </span>
    </button>
  );
}

function GrammarHome({ openLesson }: { readonly openLesson: () => void }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const shelves = useMemo(
    () =>
      normalizedQuery.length === 0
        ? SHELVES
        : SHELVES.map((shelf) => ({
            ...shelf,
            topics: shelf.topics.filter((topic) =>
              `${topic.title} ${topic.formula}`.toLowerCase().includes(normalizedQuery)
            )
          })).filter((shelf) => shelf.topics.length > 0),
    [normalizedQuery]
  );

  return (
    <div className="grammar-paper grammar-paper--home">
      <div className="grammar-breadcrumb">Grammar Home</div>
      <Hero onResume={openLesson} />

      <div className="grammar-filter-row">
        <label className="grammar-search-field">
          <AppIcon name="search" size={15} />
          <input
            aria-label="Search grammar topics"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search grammar topics..."
            value={query}
          />
        </label>
        <button className="grammar-filter-pill" type="button">
          All levels
        </button>
        <button className="grammar-filter-pill" type="button">
          All topics
        </button>
        <button className="grammar-filter-pill" type="button">
          All statuses
        </button>
        <button className="grammar-filter-pill grammar-filter-pill--push" type="button">
          Recommended
        </button>
      </div>

      <div className="grammar-shelves">
        {shelves.map((shelf) => (
          <section className="grammar-shelf" key={shelf.level}>
            <header className="grammar-shelf__header">
              <div>
                <h2>
                  {shelf.level} · {shelf.title}
                </h2>
                <p>{shelf.description}</p>
              </div>
              <button type="button">View all</button>
            </header>
            <div className="grammar-shelf__books">
              {shelf.topics.map((topic) => (
                <TopicCard
                  key={topic.title}
                  onOpen={topic.lesson === "present-perfect" ? openLesson : () => undefined}
                  topic={topic}
                />
              ))}
            </div>
            <div aria-hidden="true" className="grammar-shelf__wood" />
          </section>
        ))}
        <section className="grammar-shelf grammar-shelf--next">
          <header className="grammar-shelf__header">
            <div>
              <h2>B2+ · Refine &amp; Master</h2>
            </div>
          </header>
        </section>
      </div>
    </div>
  );
}

function StepBadge({ children }: { readonly children: string }) {
  return <span className="grammar-step-badge">{children}</span>;
}

function LessonCard({
  number,
  title,
  children,
  className = ""
}: {
  readonly number: string;
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <section className={`grammar-lesson-card ${className}`.trim()}>
      <header>
        <StepBadge>{number}</StepBadge>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function PresentPerfectLesson({ backHome }: { readonly backHome: () => void }) {
  const practiceRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];

  return (
    <div className="grammar-paper grammar-paper--lesson">
      <div className="grammar-breadcrumb grammar-breadcrumb--lesson">
        <button onClick={backHome} type="button">
          Grammar
        </button>
        <span>›</span>
        <span>Tenses &amp; Time</span>
        <span>›</span>
        <strong>Present Perfect</strong>
      </div>

      <section className="grammar-lesson-hero">
        <div className="grammar-lesson-hero__copy">
          <span className="grammar-hero__eyebrow">TENSES &amp; TIME</span>
          <h1>Present Perfect</h1>
          <p>Focus on life experiences and results that continue to the present.</p>
          <div className="grammar-hero__actions">
            <button
              className="grammar-button grammar-button--outline"
              onClick={() =>
                practiceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              type="button"
            >
              Resume lesson <span aria-hidden="true">›</span>
            </button>
            <button className="grammar-link-button" type="button">
              <span aria-hidden="true">◉</span> Mark as complete
            </button>
          </div>
          <div className="grammar-hero__meta">
            <span>Level A2</span>
            <span>Grammar Foundation</span>
            <span>~15 min</span>
          </div>
        </div>
        <LessonArtwork />
      </section>

      <div className="grammar-lesson-grid">
        <LessonCard number="1" title="Core Formula">
          <div className="grammar-formula-box">
            <span>have / has</span>
            <strong>+</strong>
            <span>past participle</span>
          </div>
          <h3>Examples</h3>
          <ul>
            <li>I have finished my homework.</li>
            <li>She has visited Paris.</li>
          </ul>
        </LessonCard>

        <LessonCard number="2" title="When to Use">
          <div className="grammar-use-list">
            <div>
              <span>✦</span>
              <p>
                <strong>Experiences in life</strong>
                <small>I have never been to Japan.</small>
              </p>
            </div>
            <div>
              <span>●</span>
              <p>
                <strong>Results that continue now</strong>
                <small>He has lost his keys.</small>
              </p>
            </div>
            <div>
              <span>◷</span>
              <p>
                <strong>Unspecified time before now</strong>
                <small>We have seen that movie.</small>
              </p>
            </div>
          </div>
        </LessonCard>

        <LessonCard number="3" title="Examples">
          <div className="grammar-use-list">
            <div>
              <span>◇</span>
              <p>
                <strong>Life experience</strong>
                <small>They have travelled to five countries.</small>
              </p>
            </div>
            <div>
              <span>↔</span>
              <p>
                <strong>Result now</strong>
                <small>The ground is wet. It has rained.</small>
              </p>
            </div>
            <div>
              <span>△</span>
              <p>
                <strong>Unspecified time</strong>
                <small>I’ve read this book three times.</small>
              </p>
            </div>
          </div>
        </LessonCard>

        <LessonCard
          className="grammar-lesson-card--comparison"
          number="4"
          title="Comparison with Past Simple"
        >
          <div className="grammar-comparison">
            <div>
              <span>PAST SIMPLE</span>
              <strong>Finished time in the past.</strong>
              <p>I visited Paris last summer.</p>
              <small>When? Last summer.</small>
            </div>
            <span className="grammar-comparison__vs">VS</span>
            <div>
              <span>PRESENT PERFECT</span>
              <strong>Time not finished or result now.</strong>
              <p>I have visited Paris.</p>
              <small>No specific time / It matters now.</small>
            </div>
          </div>
        </LessonCard>

        <LessonCard number="5" title="Common Mistake">
          <div className="grammar-mistake grammar-mistake--wrong">
            <span>×</span>
            <p>
              <strong>I have went to the store.</strong>
              <small>× Incorrect</small>
            </p>
          </div>
          <div className="grammar-mistake grammar-mistake--right">
            <span>✓</span>
            <p>
              <strong>I have gone to the store.</strong>
              <small>✓ Correct</small>
            </p>
          </div>
        </LessonCard>

        <LessonCard number="6" title="Signal Words">
          <div className="grammar-chip-list">
            {[
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
            ].map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </LessonCard>

        <div
          ref={(node) => {
            practiceRef.current = node;
          }}
        >
          <LessonCard number="7" title="Practice">
            <p className="grammar-card-intro">Try a quick check to see how well you understand.</p>
            <div className="grammar-practice-actions">
              <button type="button">
                <strong>Guided Practice</strong>
                <small>Step-by-step help</small>
              </button>
              <button type="button">
                <strong>Quick Quiz</strong>
                <small>5 short questions</small>
              </button>
              <button type="button">
                <strong>Challenge</strong>
                <small>Test your skills</small>
              </button>
            </div>
          </LessonCard>
        </div>

        <LessonCard className="grammar-lesson-card--rule" number="8" title="Quick Rule">
          <ul className="grammar-rule-list">
            <li>Use Present Perfect for experiences or results that connect to now.</li>
            <li>Use Past Simple for finished time in the past.</li>
          </ul>
        </LessonCard>
      </div>

      <div className="grammar-memory-strip">
        <span aria-hidden="true">▣</span>
        <p>Keep practicing a little each day. Small steps lead to big growth.</p>
      </div>
    </div>
  );
}

export function GrammarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLesson = searchParams.get("lesson") === "present-perfect";

  function openLesson() {
    setSearchParams({ lesson: "present-perfect" });
  }

  function backHome() {
    setSearchParams({});
  }

  return (
    <main className="grammar-experience" data-view={isLesson ? "lesson" : "home"}>
      {isLesson ? (
        <PresentPerfectLesson backHome={backHome} />
      ) : (
        <GrammarHome openLesson={openLesson} />
      )}
    </main>
  );
}
