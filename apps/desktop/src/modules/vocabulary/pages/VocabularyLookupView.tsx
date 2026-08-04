import type { FormEvent, RefObject } from "react";

import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon, type AppIconName } from "../../../design-system";
import type { VocabularySearchState } from "../../search/state";
import {
  VocabularyInvalidSearchState,
  VocabularySearchResultsState,
  VocabularySearchingState
} from "../components";

const POPULAR_SEARCHES = Object.freeze([
  "serendipity",
  "ephemeral",
  "luminous",
  "eloquent",
  "melancholy"
]);

function createRecentSearchSuggestions(
  query: string,
  recentWords: readonly string[],
  recentAdditions: readonly string[]
): readonly string[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("en");

  if (normalizedQuery.length === 0) {
    return [];
  }

  const seen = new Set<string>();

  return [...recentWords, ...recentAdditions]
    .filter((word) => word.toLocaleLowerCase("en").includes(normalizedQuery))
    .filter((word) => {
      const normalizedWord = word.toLocaleLowerCase("en");

      if (seen.has(normalizedWord)) {
        return false;
      }

      seen.add(normalizedWord);
      return true;
    })
    .slice(0, 6);
}

interface ActivityCardProps {
  readonly title: string;
  readonly icon: AppIconName;
  readonly words: readonly string[];
  readonly fallbackWords: readonly string[];
  readonly onOpenWord: (word: string) => void;
}

function ActivityCard({ fallbackWords, icon, onOpenWord, title, words }: ActivityCardProps) {
  const visibleWords = (words.length > 0 ? words : fallbackWords).slice(0, 5);
  const timeLabels = ["Just now", "1h ago", "Yesterday", "2d ago", "3d ago"];

  return (
    <section className="wv84-activity-card">
      <header className="wv84-activity-card__header">
        <AppIcon name={icon} size={24} />
        <h2>{title}</h2>
        <span className="wv84-activity-card__clear">Clear</span>
      </header>
      <div className="wv84-activity-card__rows">
        {visibleWords.map((word, index) => (
          <button
            className="wv84-activity-row"
            key={`${title}-${word}`}
            onClick={() => onOpenWord(word)}
            type="button"
          >
            <AppIcon name="search" size={20} />
            <span className="wv84-activity-row__word">{word}</span>
            <span className="wv84-activity-row__time">{timeLabels[index]}</span>
            <span aria-hidden="true" className="wv84-activity-row__chevron">
              ›
            </span>
          </button>
        ))}
      </div>
      <button className="wv84-activity-card__view-all" type="button">
        <span>View all</span>
        <span aria-hidden="true">›</span>
      </button>
    </section>
  );
}

interface VocabularyLookupViewProps {
  readonly query: string;
  readonly state: Exclude<VocabularySearchState, { kind: "found" }>;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly recentWords: readonly string[];
  readonly recentAdditions: readonly string[];
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onClear: () => void;
  readonly onEditSearch: () => void;
  readonly onSearch: (query: string) => void;
}

export function VocabularyLookupView({
  onClear,
  onEditSearch,
  onQueryChange,
  onSearch,
  onSubmit,
  query,
  recentAdditions,
  recentWords,
  searchInputRef,
  state
}: VocabularyLookupViewProps) {
  const isHomeState =
    state.kind === "initial" || state.kind === "typing" || state.kind === "not-found";
  const recentSearchSuggestions =
    state.kind === "typing"
      ? createRecentSearchSuggestions(query, recentWords, recentAdditions)
      : [];

  return (
    <div className="route-page route-page--vocabulary wv84-search-home">
      <span className="visually-hidden">Your wordbook stays on this device.</span>
      <span className="visually-hidden">Recent searches</span>
      <span aria-live="polite" className="visually-hidden">
        Words you open will appear here.
      </span>

      <section className="wv84-search-hero" aria-labelledby="vocabulary-heading">
        <h1 id="vocabulary-heading">Discover a new word</h1>
        <div aria-hidden="true" className="wv84-title-divider">
          <span />
        </div>
        <p>Search, understand, and grow your vocabulary.</p>

        <form
          aria-label="Vocabulary search"
          className="wv84-search-form"
          onSubmit={onSubmit}
          role="search"
        >
          <AppIcon className="wv84-search-form__icon" name="search" size={34} />
          <SearchInput
            ref={searchInputRef}
            aria-label="Search your wordbook"
            label="Search your wordbook"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            onClear={onClear}
            placeholder="Search for a word…"
            value={query}
          />

          {recentSearchSuggestions.length > 0 ? (
            <div
              aria-label="Recent matching words"
              className="wv84-search-suggestions"
              role="listbox"
            >
              <p>Recent matches</p>
              {recentSearchSuggestions.map((word) => (
                <button key={word} onClick={() => onSearch(word)} role="option" type="button">
                  <AppIcon name="book-open" size={16} />
                  <span>{word}</span>
                </button>
              ))}
            </div>
          ) : null}

          <Button
            aria-label="Search your wordbook"
            className="wv84-search-form__button"
            isLoading={state.kind === "searching"}
            size="large"
            type="submit"
            variant="primary"
          >
            Search
          </Button>
        </form>

        <div className="wv84-popular-searches">
          <p>POPULAR SEARCHES</p>
          <div>
            {POPULAR_SEARCHES.map((word) => (
              <button key={word} onClick={() => onSearch(word)} type="button">
                <span aria-hidden="true" className="wv84-leaf-mark" />
                <span>{word}</span>
              </button>
            ))}
          </div>
        </div>

        {state.kind === "not-found" ? (
          <div aria-live="polite" className="wv84-empty-result" role="status">
            <AppIcon name="search" size={16} />
            <span>
              <strong>No results found</strong>
              <span>“{state.normalizedQuery}” is not in your Wordbook.</span>
            </span>
          </div>
        ) : null}
      </section>

      {state.kind === "searching" ? <VocabularySearchingState query={state.query} /> : null}
      {state.kind === "matches" ? (
        <VocabularySearchResultsState
          matches={state.matches}
          onSelectMatch={onSearch}
          query={state.query}
        />
      ) : null}
      {state.kind === "invalid" ? (
        <VocabularyInvalidSearchState message={state.message} onEditSearch={onEditSearch} />
      ) : null}
      {state.kind === "repository-error" ? (
        <ErrorState
          actions={
            <Button onClick={() => onSearch(state.query)} variant="secondary">
              Try again
            </Button>
          }
          description={state.message}
          title="Wordbook search failed"
        />
      ) : null}

      {isHomeState ? (
        <aside aria-label="Vocabulary activity" className="wv84-activity-column">
          <ActivityCard
            fallbackWords={POPULAR_SEARCHES}
            icon="clock"
            onOpenWord={onSearch}
            title="RECENT SEARCHES"
            words={recentWords}
          />
          <ActivityCard
            fallbackWords={POPULAR_SEARCHES}
            icon="clock"
            onOpenWord={onSearch}
            title="RECENT ADDITIONS"
            words={recentAdditions}
          />
        </aside>
      ) : null}
    </div>
  );
}
