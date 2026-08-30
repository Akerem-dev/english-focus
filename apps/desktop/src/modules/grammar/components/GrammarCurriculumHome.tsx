import { useMemo, useState } from "react";

import { AppIcon } from "../../../design-system";
import {
  GRAMMAR_KNOWLEDGE_LESSONS,
  type GrammarKnowledgeLesson,
  type GrammarSubtopic
} from "../knowledge/grammarKnowledgeIndex";
import { getGrammarLessonArtwork } from "../knowledge/grammarLessonArtwork";
import type { GrammarTeachingSectionId } from "../knowledge/grammarTeachingContent";

import "../../../styles/word-valley-grammar-v13-home.css";
import "../../../styles/word-valley-grammar-v13-interactions.css";

export type GrammarProgressMap = Readonly<Record<string, number>>;

export interface GrammarLessonSelection extends GrammarKnowledgeLesson {
  readonly initialProgress: number;
  readonly initialSection?: GrammarTeachingSectionId;
  readonly shelfId: string;
  readonly shelfTitle: string;
  readonly sourceLessonId: string;
}

interface GrammarCurriculumHomeProps {
  readonly progress: GrammarProgressMap;
  readonly onOpenLesson: (lesson: GrammarLessonSelection) => void;
}

interface V13Book {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly progress: number;
  readonly sourceLessonId: string;
  readonly featured?: boolean;
  readonly recommended?: boolean;
}

interface V13Shelf {
  readonly id: string;
  readonly level: "A1" | "A2" | "B1";
  readonly title: string;
  readonly description: string;
  readonly books: readonly V13Book[];
}

type StatusFilter = "all" | "not-started" | "in-progress" | "complete";

const BOOKSHELVES: readonly V13Shelf[] = Object.freeze([
  {
    id: "a1",
    level: "A1",
    title: "A1 · Grammar Foundation",
    description: "Build your core grammar skills.",
    books: Object.freeze([
      {
        id: "present-simple",
        title: "Present Simple",
        subtitle: "S · V(s/es) · O",
        progress: 3,
        sourceLessonId: "present-simple-continuous",
        featured: true,
        recommended: true
      },
      {
        id: "be-am-is-are",
        title: "Be: am / is / are",
        subtitle: "S · am / is / are · O",
        progress: 2,
        sourceLessonId: "word-order-agreement"
      },
      {
        id: "there-is-there-are",
        title: "There is / There are",
        subtitle: "There is / are · N",
        progress: 0,
        sourceLessonId: "word-order-agreement"
      },
      {
        id: "present-continuous",
        title: "Present Continuous",
        subtitle: "S · am/is/are · V-ing · O",
        progress: 1,
        sourceLessonId: "present-simple-continuous"
      },
      {
        id: "can-could",
        title: "Can / Could",
        subtitle: "Ability & possibility",
        progress: 0,
        sourceLessonId: "modal-verbs"
      },
      {
        id: "wh-questions",
        title: "Wh- Questions",
        subtitle: "Who, what, when, where",
        progress: 0,
        sourceLessonId: "questions-auxiliaries"
      }
    ])
  },
  {
    id: "a2",
    level: "A2",
    title: "A2 · Building Confidence",
    description: "Expand your expression and connect ideas.",
    books: Object.freeze([
      {
        id: "past-simple",
        title: "Past Simple",
        subtitle: "S · V-ed · O",
        progress: 1,
        sourceLessonId: "past-narrative"
      },
      {
        id: "used-to",
        title: "Used to",
        subtitle: "Past habits & states",
        progress: 0,
        sourceLessonId: "used-to-family"
      },
      {
        id: "present-perfect",
        title: "Present Perfect",
        subtitle: "have / has · past participle",
        progress: 0,
        sourceLessonId: "present-perfect",
        recommended: true
      },
      {
        id: "past-continuous",
        title: "Past Continuous",
        subtitle: "S · was / were · V-ing",
        progress: 0,
        sourceLessonId: "past-narrative"
      },
      {
        id: "going-to",
        title: "Going to",
        subtitle: "Plans & intentions",
        progress: 0,
        sourceLessonId: "future-forms"
      },
      {
        id: "comparatives",
        title: "Comparatives",
        subtitle: "-er / more ... than",
        progress: 0,
        sourceLessonId: "comparison"
      }
    ])
  },
  {
    id: "b1",
    level: "B1",
    title: "B1 · Express Yourself",
    description: "Share opinions, make arguments, and tell stories.",
    books: Object.freeze([
      {
        id: "future-continuous",
        title: "Future Continuous",
        subtitle: "S · will be · V-ing · O",
        progress: 0,
        sourceLessonId: "future-forms"
      },
      {
        id: "present-perfect-continuous",
        title: "Present Perfect Continuous",
        subtitle: "have been · V-ing",
        progress: 0,
        sourceLessonId: "present-perfect-continuous"
      },
      {
        id: "modal-perfects",
        title: "Modal Perfects",
        subtitle: "must have, should have",
        progress: 0,
        sourceLessonId: "modal-verbs"
      },
      {
        id: "relative-clauses",
        title: "Relative Clauses",
        subtitle: "who, which, that",
        progress: 0,
        sourceLessonId: "relative-clauses"
      },
      {
        id: "passive-voice",
        title: "Passive Voice",
        subtitle: "be + past participle",
        progress: 0,
        sourceLessonId: "active-passive"
      },
      {
        id: "reported-speech",
        title: "Reported Speech",
        subtitle: "say / tell / ask",
        progress: 0,
        sourceLessonId: "reported-speech"
      }
    ])
  }
]);

const LESSON_BY_ID = new Map(GRAMMAR_KNOWLEDGE_LESSONS.map((lesson) => [lesson.id, lesson]));

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function getBookProgress(book: V13Book, progress: GrammarProgressMap): number {
  return clampProgress(progress[book.id] ?? book.progress);
}

function findRelevantSubtopics(
  lesson: GrammarKnowledgeLesson,
  book: V13Book
): readonly GrammarSubtopic[] {
  const title = normalize(book.title);
  const exact = lesson.subtopics.filter((subtopic) => normalize(subtopic.title) === title);
  if (exact.length > 0) return Object.freeze(exact);

  const titleWords = title.split(/\s+/).filter((word) => word.length >= 4);
  const related = lesson.subtopics.filter((subtopic) => {
    const candidate = normalize(subtopic.title);
    return titleWords.some((word) => candidate.includes(word));
  });

  return Object.freeze(related.slice(0, 4));
}

function buildLessonSelection(book: V13Book, shelf: V13Shelf): GrammarLessonSelection | undefined {
  const source = LESSON_BY_ID.get(book.sourceLessonId);
  if (source === undefined) return undefined;

  return Object.freeze({
    ...source,
    id: book.id,
    title: book.title,
    level: shelf.level,
    description: `${book.title} — ${book.subtitle}. Learn the meaning first, then choose and build the form accurately.`,
    keywords: Object.freeze([...source.keywords, book.title, book.subtitle]),
    coreTopics: Object.freeze([book.title]),
    subtopics: findRelevantSubtopics(source, book),
    initialProgress: book.progress,
    shelfId: shelf.id,
    shelfTitle: shelf.title,
    sourceLessonId: book.sourceLessonId
  });
}

function bookMatches(
  book: V13Book,
  lesson: GrammarLessonSelection | undefined,
  query: string
): boolean {
  if (query.length === 0) return true;
  const searchable = `${book.title} ${book.subtitle} ${lesson?.category ?? ""}`.toLocaleLowerCase(
    "en"
  );
  return searchable.includes(query);
}

function statusMatches(progress: number, status: StatusFilter): boolean {
  if (status === "not-started") return progress === 0;
  if (status === "in-progress") return progress > 0 && progress < 5;
  if (status === "complete") return progress === 5;
  return true;
}

function BookCard({
  book,
  progress,
  selection,
  onOpenLesson
}: {
  readonly book: V13Book;
  readonly progress: number;
  readonly selection: GrammarLessonSelection | undefined;
  readonly onOpenLesson: (lesson: GrammarLessonSelection) => void;
}) {
  const progressPercent = `${progress * 20}%`;

  return (
    <button
      aria-label={`${book.title}, ${progress} of 5 complete`}
      className="wvg-v13-book"
      data-featured={book.featured || undefined}
      data-status={progress === 5 ? "complete" : progress > 0 ? "in-progress" : "not-started"}
      disabled={selection === undefined}
      onClick={() => {
        if (selection !== undefined) onOpenLesson(selection);
      }}
      type="button"
    >
      <span aria-hidden="true" className="wvg-v13-book__spine" />
      <span className="wvg-v13-book__title">{book.title}</span>
      <span className="wvg-v13-book__subtitle">{book.subtitle}</span>
      <span aria-hidden="true" className="wvg-v13-book__status">
        {progress === 5 ? "✓" : book.featured ? "★" : "◉"}
      </span>
      <span aria-hidden="true" className="wvg-v13-book__track">
        <span style={{ width: progressPercent }} />
      </span>
      <span className="wvg-v13-book__count">{progress} / 5</span>
    </button>
  );
}

export function GrammarCurriculumHome({ onOpenLesson, progress }: GrammarCurriculumHomeProps) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [isolatedShelfId, setIsolatedShelfId] = useState<string | undefined>();
  const normalizedQuery = useMemo(() => normalize(query), [query]);
  const heroArtwork = getGrammarLessonArtwork("present-perfect");

  const allBooks = useMemo(
    () =>
      BOOKSHELVES.flatMap((shelf) =>
        shelf.books.map((book) => ({
          book,
          shelf,
          selection: buildLessonSelection(book, shelf)
        }))
      ),
    []
  );

  const topicOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allBooks
            .map(({ selection }) => selection?.category)
            .filter((category): category is string => category !== undefined)
        )
      ).sort((left, right) => left.localeCompare(right)),
    [allBooks]
  );

  const shelves = useMemo(
    () =>
      BOOKSHELVES.map((shelf) => ({
        ...shelf,
        books: shelf.books
          .map((book) => ({
            book,
            selection: buildLessonSelection(book, shelf),
            progress: getBookProgress(book, progress)
          }))
          .filter(({ book, selection, progress: bookProgress }) => {
            if (isolatedShelfId !== undefined && shelf.id !== isolatedShelfId) return false;
            if (levelFilter !== "all" && shelf.level !== levelFilter) return false;
            if (!bookMatches(book, selection, normalizedQuery)) return false;
            if (topicFilter !== "all" && selection?.category !== topicFilter) return false;
            if (!statusMatches(bookProgress, statusFilter)) return false;
            if (recommendedOnly && !book.recommended && !book.featured) return false;
            return true;
          })
      })).filter((shelf) => shelf.books.length > 0),
    [
      isolatedShelfId,
      levelFilter,
      normalizedQuery,
      progress,
      recommendedOnly,
      statusFilter,
      topicFilter
    ]
  );

  const presentPerfectShelf = BOOKSHELVES.find((shelf) => shelf.id === "a2");
  const presentPerfectBook = presentPerfectShelf?.books.find(
    (book) => book.id === "present-perfect"
  );
  const presentPerfectSelection =
    presentPerfectShelf !== undefined && presentPerfectBook !== undefined
      ? buildLessonSelection(presentPerfectBook, presentPerfectShelf)
      : undefined;
  const presentPerfectProgress =
    presentPerfectBook === undefined ? 0 : getBookProgress(presentPerfectBook, progress);

  function resetFilters() {
    setQuery("");
    setLevelFilter("all");
    setTopicFilter("all");
    setStatusFilter("all");
    setRecommendedOnly(false);
    setIsolatedShelfId(undefined);
  }

  function showShelf(shelfId: string) {
    if (isolatedShelfId === shelfId) {
      resetFilters();
      return;
    }

    setQuery("");
    setLevelFilter("all");
    setTopicFilter("all");
    setStatusFilter("all");
    setRecommendedOnly(false);
    setIsolatedShelfId(shelfId);
  }

  return (
    <main className="wvg-v13-home" aria-labelledby="grammar-home-title">
      <section className="wvg-v13-home__paper">
        <h1 className="wvg-v13-home__breadcrumb" id="grammar-home-title">
          Grammar Home
        </h1>

        <section className="wvg-v13-hero" aria-label="Recommended next lesson">
          <img
            alt=""
            aria-hidden="true"
            className="wvg-v13-hero__art"
            draggable={false}
            src={heroArtwork}
          />
          <span aria-hidden="true" className="wvg-v13-hero__wash" />
          <div className="wvg-v13-hero__content">
            <p className="wvg-v13-hero__eyebrow">RECOMMENDED NEXT LESSON</p>
            <h2>Present Perfect</h2>
            <p className="wvg-v13-hero__copy">
              Focus on life experiences and results that continue to the present.
            </p>
            <div className="wvg-v13-hero__actions">
              <button
                disabled={presentPerfectSelection === undefined}
                onClick={() => {
                  if (presentPerfectSelection !== undefined) onOpenLesson(presentPerfectSelection);
                }}
                type="button"
              >
                Resume lesson <span aria-hidden="true">›</span>
              </button>
              <button
                className="wvg-v13-hero__complete"
                disabled={presentPerfectSelection === undefined}
                onClick={() => {
                  if (presentPerfectSelection === undefined) return;
                  onOpenLesson(
                    Object.freeze({ ...presentPerfectSelection, initialSection: "practice" })
                  );
                }}
                type="button"
              >
                <span aria-hidden="true">{presentPerfectProgress === 5 ? "✓" : "◎"}</span>{" "}
                {presentPerfectProgress === 5
                  ? "Mastered · Review"
                  : `Practice · ${presentPerfectProgress}/5`}
              </button>
            </div>
            <p className="wvg-v13-hero__meta">
              Level A2&nbsp;&nbsp; • &nbsp;&nbsp;Grammar Foundation&nbsp;&nbsp; • &nbsp;&nbsp;~15
              min
            </p>
          </div>
        </section>

        <div className="wvg-v13-toolbar">
          <label className="wvg-v13-search">
            <AppIcon name="search" size={17} />
            <input
              aria-label="Search grammar topics"
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setIsolatedShelfId(undefined);
              }}
              placeholder="Search grammar topics..."
              type="search"
              value={query}
            />
          </label>

          <div className="wvg-v13-filters" aria-label="Grammar filters">
            <select
              aria-label="Filter by level"
              onChange={(event) => {
                setLevelFilter(event.currentTarget.value);
                setIsolatedShelfId(undefined);
              }}
              value={levelFilter}
            >
              <option value="all">All levels</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>

            <select
              aria-label="Filter by topic"
              onChange={(event) => {
                setTopicFilter(event.currentTarget.value);
                setIsolatedShelfId(undefined);
              }}
              value={topicFilter}
            >
              <option value="all">All topics</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              onChange={(event) => {
                setStatusFilter(event.currentTarget.value as StatusFilter);
                setIsolatedShelfId(undefined);
              }}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="complete">Complete</option>
            </select>

            <button
              aria-pressed={recommendedOnly}
              className="wvg-v13-filters__recommended"
              onClick={() => {
                setRecommendedOnly((current) => !current);
                setIsolatedShelfId(undefined);
              }}
              type="button"
            >
              Recommended
            </button>
          </div>
        </div>

        <div className="wvg-v13-shelves" aria-live="polite">
          {shelves.length === 0 ? (
            <div className="wvg-v13-empty">
              <strong>No grammar topics found.</strong>
              <button onClick={resetFilters} type="button">
                Clear filters
              </button>
            </div>
          ) : (
            shelves.map((shelf) => (
              <section className="wvg-v13-shelf" key={shelf.id}>
                <header className="wvg-v13-shelf__heading">
                  <div>
                    <h2>{shelf.title}</h2>
                    <p>{shelf.description}</p>
                  </div>
                  <button onClick={() => showShelf(shelf.id)} type="button">
                    {isolatedShelfId === shelf.id ? "Show all" : "View all"}
                  </button>
                </header>

                <div className="wvg-v13-shelf__books">
                  {shelf.books.map(({ book, progress: bookProgress, selection }) => (
                    <BookCard
                      book={book}
                      key={`${shelf.id}-${book.id}`}
                      onOpenLesson={onOpenLesson}
                      progress={bookProgress}
                      selection={selection}
                    />
                  ))}
                </div>
                <div aria-hidden="true" className="wvg-v13-shelf__wood" />
              </section>
            ))
          )}

          {normalizedQuery.length === 0 &&
          isolatedShelfId === undefined &&
          levelFilter === "all" ? (
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
