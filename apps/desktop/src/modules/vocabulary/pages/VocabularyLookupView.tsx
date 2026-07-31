import { useEffect, useState, type FormEvent, type RefObject } from "react";

import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon, type AppIconName } from "../../../design-system";
import type { VocabularySearchState } from "../../search/state";
import {
  VocabularyInvalidSearchState,
  VocabularySearchResultsState,
  VocabularySearchingState
} from "../components";

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

type WordValleyTheme = "day" | "night";

function readTheme(): WordValleyTheme {
  if (typeof document === "undefined") {
    return "day";
  }

  return document.documentElement.dataset.theme === "dark" ? "night" : "day";
}

interface WordListCardProps {
  readonly title: string;
  readonly icon: AppIconName;
  readonly panel: "recent-searches" | "recent-viewed";
  readonly words: readonly string[];
  readonly onOpenWord: (word: string) => void;
  readonly emptyMessage: string;
}

function WordListCard({
  emptyMessage,
  icon,
  onOpenWord,
  panel,
  title,
  words
}: WordListCardProps) {
  const visibleWords = words.slice(0, 4);

  return (
    <section className="word-list-card" data-panel={panel}>
      <header className="word-list-card__header">
        <AppIcon name={icon} size={24} />
        <h2>{title}</h2>
      </header>
      <div className="word-list-card__rows">
        {visibleWords.length === 0 ? (
          <p className="word-list-card__empty">{emptyMessage}</p>
        ) : null}
        {visibleWords.map((word) => (
          <button
            className="word-list-row"
            key={word}
            onClick={() => onOpenWord(word)}
            title={`Open ${word}`}
            type="button"
          >
            <span className="word-list-row__word">{word}</span>
            <AppIcon className="word-list-row__chevron" name="chevron-right" size={18} />
          </button>
        ))}
      </div>
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
  const [theme, setTheme] = useState<WordValleyTheme>(readTheme);

  useEffect(() => {
    function syncTheme() {
      setTheme(readTheme());
    }

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  function chooseTheme(nextTheme: WordValleyTheme) {
    document.documentElement.dataset.theme = nextTheme === "night" ? "dark" : "light";
    window.localStorage.setItem("english-focus:theme", nextTheme === "night" ? "dark" : "light");
    setTheme(nextTheme);
  }

  return (
    <div
      className={`route-page route-page--vocabulary${isHomeState ? " route-page--vocabulary-home" : ""}`}
    >
      <div aria-label="Theme" className="word-valley-theme-control" role="group">
        <span aria-hidden="true" className="word-valley-theme-control__lantern" />
        <button
          aria-label="Use day theme"
          aria-pressed={theme === "day"}
          className="word-valley-theme-control__option"
          data-theme-option="day"
          onClick={() => chooseTheme("day")}
          type="button"
        >
          <AppIcon name="sun" size={24} />
        </button>
        <button
          aria-label="Use night theme"
          aria-pressed={theme === "night"}
          className="word-valley-theme-control__option"
          data-theme-option="night"
          onClick={() => chooseTheme("night")}
          type="button"
        >
          <AppIcon name="moon" size={24} />
        </button>
      </div>

      <section className="vocabulary-hero" aria-labelledby="vocabulary-heading">
        <div aria-hidden="true" className="vocabulary-hero__ornament" />
        <h1 id="vocabulary-heading">WORD VALLEY</h1>
        <p className="vocabulary-hero__description">Let’s explore a new word.</p>
        <form
          aria-label="Wordbook search"
          className="vocabulary-search"
          onSubmit={onSubmit}
          role="search"
        >
          <SearchInput
            ref={searchInputRef}
            aria-label="Search your wordbook"
            label="Search your wordbook"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            onClear={onClear}
            placeholder="Discover a word…"
            value={query}
          />

          {recentSearchSuggestions.length > 0 ? (
            <div
              aria-label="Recent matching words"
              className="wordbook-search-suggestions"
              role="listbox"
            >
              <p className="wordbook-search-suggestions__title">Recent matches</p>

              {recentSearchSuggestions.map((word) => (
                <button
                  className="wordbook-search-suggestion"
                  key={word}
                  onClick={() => onSearch(word)}
                  role="option"
                  type="button"
                >
                  <AppIcon name="book-open" size={15} />
                  <span className="wordbook-search-suggestion__word">{word}</span>
                </button>
              ))}
            </div>
          ) : null}

          <Button
            aria-label="Search your wordbook"
            className="vocabulary-search__button"
            isLoading={state.kind === "searching"}
            leadingIcon={<AppIcon name="search" size={18} />}
            size="large"
            type="submit"
            variant="primary"
          >
            Search
          </Button>
        </form>

        {state.kind === "not-found" ? (
          <div aria-live="polite" className="wordbook-search-empty-result" role="status">
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
        <div className="vocabulary-dashboard">
          <WordListCard
            emptyMessage="Words you search will appear here."
            icon="clock"
            onOpenWord={onSearch}
            panel="recent-searches"
            title="Recent Searches"
            words={recentWords}
          />
          <WordListCard
            emptyMessage="Words you view will appear here."
            icon="eye"
            onOpenWord={onSearch}
            panel="recent-viewed"
            title="Recently Viewed"
            words={recentAdditions}
          />
        </div>
      ) : null}
    </div>
  );
}
