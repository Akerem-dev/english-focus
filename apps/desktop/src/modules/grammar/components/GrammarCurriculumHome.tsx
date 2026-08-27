import { useMemo, useState } from "react";

import { AppIcon } from "../../../design-system";
import {
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson
} from "../knowledge/grammarKnowledgeIndex";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";

import "../../../styles/word-valley-grammar-v13-home.css";

interface GrammarCurriculumHomeProps {
  readonly lastLesson: GrammarKnowledgeLesson | undefined;
  readonly onOpenLesson: (lesson: GrammarKnowledgeLesson) => void;
}

interface V13Book {
  readonly title: string;
  readonly subtitle: string;
  readonly progress: number;
  readonly lessonId: string;
  readonly featured?: boolean;
}

interface V13Shelf {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly books: readonly V13Book[];
}

const BOOKSHELVES: readonly V13Shelf[] = Object.freeze([
  {
    id: "a1",
    title: "A1 · Grammar Foundation",
    description: "Build your core grammar skills.",
    books: Object.freeze([
      {
        title: "Present Simple",
        subtitle: "S · V(s/es) · O",
        progress: 3,
        lessonId: "present-simple-continuous",
        featured: true
      },
      {
        title: "Be: am / is / are",
        subtitle: "S · am / is / are · O",
        progress: 2,
        lessonId: "word-order-agreement"
      },
      {
        title: "There is / There are",
        subtitle: "There is / are · N",
        progress: 0,
        lessonId: "word-order-agreement"
      },
      {
        title: "Present Continuous",
        subtitle: "S · am/is/are · V-ing · O",
        progress: 1,
        lessonId: "present-simple-continuous"
      },
      {
        title: "Can / Could",
        subtitle: "Ability & possibility",
        progress: 0,
        lessonId: "modal-verbs"
      },
      {
        title: "Wh- Questions",
        subtitle: "Who, what, when, where",
        progress: 0,
        lessonId: "questions-auxiliaries"
      }
    ])
  },
  {
    id: "a2",
    title: "A2 · Building Confidence",
    description: "Expand your expression and connect ideas.",
    books: Object.freeze([
      {
        title: "Past Simple",
        subtitle: "S · V-ed · O",
        progress: 1,
        lessonId: "past-narrative"
      },
      {
        title: "Used to",
        subtitle: "Past habits & states",
        progress: 0,
        lessonId: "used-to-family"
      },
      {
        title: "Present Perfect",
        subtitle: "have / has · past participle",
        progress: 0,
        lessonId: "present-perfect"
      },
      {
        title: "Past Continuous",
        subtitle: "S · was / were · V-ing",
        progress: 0,
        lessonId: "past-narrative"
      },
      {
        title: "Going to",
        subtitle: "Plans & intentions",
        progress: 0,
        lessonId: "future-forms"
      },
      {
        title: "Comparatives",
        subtitle: "-er / more ... than",
        progress: 0,
        lessonId: "comparison"
      }
    ])
  },
  {
    id: "b1",
    title: "B1 · Express Yourself",
    description: "Share opinions, make arguments, and tell stories.",
    books: Object.freeze([
      {
        title: "Future Continuous",
        subtitle: "S · will be · V-ing · O",
        progress: 0,
        lessonId: "future-forms"
      },
      {
        title: "Present Perfect Continuous",
        subtitle: "have been · V-ing",
        progress: 0,
        lessonId: "present-perfect-continuous"
      },
      {
        title: "Modal Perfects",
        subtitle: "must have, should have",
        progress: 0,
        lessonId: "modal-verbs"
      },
      {
        title: "Relative Clauses",
        subtitle: "who, which, that",
        progress: 0,
        lessonId: "relative-clauses"
      },
      {
        title: "Passive Voice",
        subtitle: "be + past participle",
        progress: 0,
        lessonId: "active-passive"
      },
      {
        title: "Reported Speech",
        subtitle: "say / tell / ask",
        progress: 0,
        lessonId: "reported-speech"
      }
    ])
  }
]);

const LESSON_BY_ID = new Map(GRAMMAR_KNOWLEDGE_LESSONS.map((lesson) => [lesson.id, lesson]));
const PRESENT_PERFECT = LESSON_BY_ID.get("present-perfect");

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function bookMatches(book: V13Book, query: string): boolean {
  if (query.length === 0) return true;
  return `${book.title} ${book.subtitle}`.toLocaleLowerCase("en").includes(query);
}

function BookCard({ book, onOpenLesson }: { readonly book: V13Book; readonly onOpenLesson: (lesson: GrammarKnowledgeLesson) => void }) {
  const lesson = LESSON_BY_ID.get(book.lessonId);
  const progressPercent = `${Math.max(0, Math.min(5, book.progress)) * 20}%`;

  return (
    <button
      className="wvg-v13-book"
      data-featured={book.featured || undefined}
      disabled={lesson === undefined}
      onClick={() => {
        if (lesson !== undefined) onOpenLesson(lesson);
      }}
      type="button"
    >
      <span aria-hidden="true" className="wvg-v13-book__spine" />
      <span className="wvg-v13-book__title">{book.title}</span>
      <span className="wvg-v13-book__subtitle">{book.subtitle}</span>
      <span aria-hidden="true" className="wvg-v13-book__status">
        {book.featured ? "★" : "◉"}
      </span>
      <span aria-hidden="true" className="wvg-v13-book__track">
        <span style={{ width: progressPercent }} />
      </span>
      <span className="wvg-v13-book__count">{book.progress} / 5</span>
    </button>
  );
}

export function GrammarCurriculumHome({ lastLesson: _lastLesson, onOpenLesson }: GrammarCurriculumHomeProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = useMemo(() => normalize(query), [query]);
  const heroArtwork = getGrammarLessonArtwork("present-perfect");

  const shelves = useMemo(
    () =>
      BOOKSHELVES.map((shelf) => ({
        ...shelf,
        books: shelf.books.filter((book) => bookMatches(book, normalizedQuery))
      })).filter((shelf) => normalizedQuery.length === 0 || shelf.books.length > 0),
    [normalizedQuery]
  );

  function openPresentPerfect() {
    if (PRESENT_PERFECT !== undefined) onOpenLesson(PRESENT_PERFECT);
  }

  return (
    <main className="wvg-v13-home" aria-labelledby="grammar-home-title">
      <section className="wvg-v13-home__paper">
        <h1 className="wvg-v13-home__breadcrumb" id="grammar-home-title">
          Grammar Home
        </h1>

        <section className="wvg-v13-hero" aria-label="Recommended next lesson">
          <img alt="" aria-hidden="true" className="wvg-v13-hero__art" draggable={false} src={heroArtwork} />
          <span aria-hidden="true" className="wvg-v13-hero__wash" />
          <div className="wvg-v13-hero__content">
            <p className="wvg-v13-hero__eyebrow">RECOMMENDED NEXT LESSON</p>
            <h2>Present Perfect</h2>
            <p className="wvg-v13-hero__copy">
              Focus on life experiences and results that continue to the present.
            </p>
            <div className="wvg-v13-hero__actions">
              <button onClick={openPresentPerfect} type="button">
                Resume lesson <span aria-hidden="true">›</span>
              </button>
              <button className="wvg-v13-hero__complete" type="button">
                <span aria-hidden="true">◉</span> Mark as complete
              </button>
            </div>
            <p className="wvg-v13-hero__meta">Level A2&nbsp;&nbsp; • &nbsp;&nbsp;Grammar Foundation&nbsp;&nbsp; • &nbsp;&nbsp;~15 min</p>
          </div>
        </section>

        <div className="wvg-v13-toolbar">
          <label className="wvg-v13-search">
            <AppIcon name="search" size={17} />
            <input
              aria-label="Search grammar topics"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search grammar topics..."
              type="search"
              value={query}
            />
          </label>

          <div className="wvg-v13-filters" aria-label="Grammar filters">
            <button type="button">All levels</button>
            <button type="button">All topics</button>
            <button type="button">All statuses</button>
            <button className="wvg-v13-filters__recommended" type="button">Recommended</button>
          </div>
        </div>

        <div className="wvg-v13-shelves" aria-live="polite">
          {shelves.length === 0 ? (
            <div className="wvg-v13-empty">
              <strong>No grammar topics found.</strong>
              <button onClick={() => setQuery("")} type="button">Clear search</button>
            </div>
          ) : (
            shelves.map((shelf) => (
              <section className="wvg-v13-shelf" key={shelf.id}>
                <header className="wvg-v13-shelf__heading">
                  <div>
                    <h2>{shelf.title}</h2>
                    <p>{shelf.description}</p>
                  </div>
                  <button type="button">View all</button>
                </header>

                <div className="wvg-v13-shelf__books">
                  {shelf.books.map((book) => (
                    <BookCard book={book} key={`${shelf.id}-${book.title}`} onOpenLesson={onOpenLesson} />
                  ))}
                </div>
                <div aria-hidden="true" className="wvg-v13-shelf__wood" />
              </section>
            ))
          )}

          {normalizedQuery.length === 0 ? (
            <section className="wvg-v13-shelf wvg-v13-shelf--preview" aria-label="B2 and above">
              <header className="wvg-v13-shelf__heading">
                <div>
                  <h2>B2+ · Refine &amp; Master</h2>
                </div>
              </header>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
