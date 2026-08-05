import type { FormEvent, RefObject } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "../../../app/router";
import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon, type AppIconName } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant";
import type { VocabularySearchState } from "../../search/state";
import {
  VocabularyInvalidSearchState,
  VocabularyNotFoundState,
  VocabularySearchResultsState,
  VocabularySearchingState
} from "../components";

export interface VocabularyActivityItem {
  readonly word: string;
  readonly normalizedWord: string;
  readonly occurredAt: string;
}

function formatRelativeTime(value: string): string {
  const occurredAt = new Date(value);
  const elapsedMs = Date.now() - occurredAt.getTime();

  if (Number.isNaN(elapsedMs) || elapsedMs < 0) {
    return "Recently";
  }

  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) {
    return "Just now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) {
    return "Yesterday";
  }
  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short"
  }).format(occurredAt);
}

function createRecentSearchSuggestions(
  query: string,
  recentSearches: readonly VocabularyActivityItem[],
  recentAdditions: readonly VocabularyActivityItem[]
): readonly VocabularyActivityItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("en");

  if (normalizedQuery.length === 0) {
    return [];
  }

  const seen = new Set<string>();

  return [...recentSearches, ...recentAdditions]
    .filter(
      (item) =>
        item.normalizedWord.includes(normalizedQuery) ||
        item.word.toLocaleLowerCase("en").includes(normalizedQuery)
    )
    .filter((item) => {
      if (seen.has(item.normalizedWord)) {
        return false;
      }

      seen.add(item.normalizedWord);
      return true;
    })
    .slice(0, 6);
}

interface ActivityCardProps {
  readonly title: string;
  readonly icon: AppIconName;
  readonly items: readonly VocabularyActivityItem[];
  readonly emptyMessage: string;
  readonly onOpenWord: (word: string) => void;
  readonly footer?: "library" | undefined;
}

function ActivityCard({ emptyMessage, footer, icon, items, onOpenWord, title }: ActivityCardProps) {
  const visibleItems = items.slice(0, 5);

  return (
    <section className="wv84-activity-card">
      <header className="wv84-activity-card__header">
        <AppIcon name={icon} size={24} />
        <h2>{title}</h2>
      </header>

      {visibleItems.length === 0 ? (
        <div className="wv84-activity-card__empty">
          <span aria-hidden="true" className="wv84-leaf-mark" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="wv84-activity-card__rows">
          {visibleItems.map((item) => (
            <button
              className="wv84-activity-row"
              key={`${title}-${item.normalizedWord}`}
              onClick={() => onOpenWord(item.normalizedWord)}
              type="button"
            >
              <AppIcon name="search" size={20} />
              <span className="wv84-activity-row__word">{item.word}</span>
              <span className="wv84-activity-row__time">{formatRelativeTime(item.occurredAt)}</span>
              <span aria-hidden="true" className="wv84-activity-row__chevron">
                ›
              </span>
            </button>
          ))}
        </div>
      )}

      {footer === "library" ? (
        <Link className="wv84-activity-card__view-all" to={ROUTE_PATHS.library}>
          <span>Open Library</span>
          <span aria-hidden="true">›</span>
        </Link>
      ) : (
        <p className="wv84-activity-card__footer-note">Stored locally on this device</p>
      )}
    </section>
  );
}

interface VocabularyLookupViewProps {
  readonly query: string;
  readonly state: Exclude<VocabularySearchState, { kind: "found" }>;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly recentSearches: readonly VocabularyActivityItem[];
  readonly recentAdditions: readonly VocabularyActivityItem[];
  readonly popularSearches: readonly string[];
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
  popularSearches,
  query,
  recentAdditions,
  recentSearches,
  searchInputRef,
  state
}: VocabularyLookupViewProps) {
  const isHomeState =
    state.kind === "initial" || state.kind === "typing" || state.kind === "not-found";
  const recentSearchSuggestions =
    state.kind === "typing"
      ? createRecentSearchSuggestions(query, recentSearches, recentAdditions)
      : [];

  return (
    <div className="route-page route-page--vocabulary wv84-search-home">
      <span className="visually-hidden">Your wordbook stays on this device.</span>
      <span className="visually-hidden">Recently viewed words</span>
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
            aria-label="Search vocabulary"
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
              {recentSearchSuggestions.map((item) => (
                <button
                  key={item.normalizedWord}
                  onClick={() => onSearch(item.normalizedWord)}
                  role="option"
                  type="button"
                >
                  <AppIcon name="book-open" size={16} />
                  <span>{item.word}</span>
                </button>
              ))}
            </div>
          ) : null}

          <Button
            aria-label="Search vocabulary"
            className="wv84-search-form__button"
            isLoading={state.kind === "searching"}
            size="large"
            type="submit"
            variant="primary"
          >
            Search
          </Button>
        </form>

        {popularSearches.length > 0 ? (
          <div className="wv84-popular-searches">
            <p>POPULAR SEARCHES</p>
            <div>
              {popularSearches.map((word) => (
                <button key={word} onClick={() => onSearch(word)} type="button">
                  <span aria-hidden="true" className="wv84-leaf-mark" />
                  <span>{word}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {state.kind === "not-found" ? (
        <div className="wv84-not-found">
          <VocabularyNotFoundState
            canCreateEntry={state.canCreateEntry}
            normalizedQuery={state.normalizedQuery}
            onEditSearch={onEditSearch}
            onOpenAssistant={() =>
              dispatchAssistantRequest({ kind: "open", word: state.normalizedQuery })
            }
            onSelectSuggestion={onSearch}
            suggestions={state.suggestions}
          />
        </div>
      ) : null}
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
            emptyMessage="Open a word to build your recent history."
            icon="clock"
            items={recentSearches}
            onOpenWord={onSearch}
            title="RECENTLY VIEWED"
          />
          <ActivityCard
            emptyMessage="Words you add locally will appear here."
            footer="library"
            icon="bookmark"
            items={recentAdditions}
            onOpenWord={onSearch}
            title="RECENT ADDITIONS"
          />
        </aside>
      ) : null}
    </div>
  );
}
