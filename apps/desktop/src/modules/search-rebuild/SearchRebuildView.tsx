import {
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject
} from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "../../app/router";
import wordieReading from "../../assets/wordie/wordie-cutout-reading.png";
import sparklePair from "../../assets/decorative/accent-sparkle-pair.png";
import { AppIcon } from "../../design-system";
import { dispatchAssistantRequest } from "../assistant";
import type { VocabularySearchState } from "../search/state";

import "./search-rebuild.css";

export interface SearchRebuildActivityItem {
  readonly word: string;
  readonly normalizedWord: string;
  readonly occurredAt: string;
}

export interface SearchRebuildSuggestion {
  readonly word: string;
  readonly normalizedWord: string;
  readonly definitionEn?: string | undefined;
  readonly matchKind?: "exact" | "alias" | "prefix" | "full-text" | "recent" | undefined;
}

interface SearchRebuildViewProps {
  readonly query: string;
  readonly state: Exclude<VocabularySearchState, { kind: "found" }>;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly recentSearches: readonly SearchRebuildActivityItem[];
  readonly recentAdditions: readonly SearchRebuildActivityItem[];
  readonly popularSearches: readonly string[];
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onClear: () => void;
  readonly onEditSearch: () => void;
  readonly onSearch: (query: string) => void;
}

function formatRelativeTime(value: string): string {
  const occurredAt = new Date(value);
  const elapsedMs = Date.now() - occurredAt.getTime();

  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return "Recently";
  }

  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(occurredAt);
}

interface ActivityListProps {
  readonly title: string;
  readonly items: readonly SearchRebuildActivityItem[];
  readonly kind: "viewed" | "added";
  readonly onSearch: (query: string) => void;
}

function ActivityList({ items, kind, onSearch, title }: ActivityListProps) {
  return (
    <section className="wvsr-activity" aria-label={title}>
      <header className="wvsr-activity__header">
        <span className="wvsr-activity__header-icon" aria-hidden="true">
          <AppIcon name={kind === "viewed" ? "search" : "bookmark"} size={22} />
        </span>
        <h2>{title}</h2>
        <Link className="wvsr-activity__view-all" to={ROUTE_PATHS.library}>
          View all
        </Link>
      </header>

      <div className="wvsr-activity__rows">
        {items.slice(0, 5).map((item) => (
          <button
            className="wvsr-activity__row"
            key={`${kind}-${item.normalizedWord}`}
            onClick={() => onSearch(item.normalizedWord)}
            type="button"
          >
            <span className="wvsr-activity__row-icon" aria-hidden="true">
              <AppIcon name={kind === "viewed" ? "bookmark" : "book-open"} size={18} />
            </span>
            <span className="wvsr-activity__word">{item.word}</span>
            <span className="wvsr-activity__time">{formatRelativeTime(item.occurredAt)}</span>
          </button>
        ))}

        {items.length === 0 ? (
          <p className="wvsr-activity__empty">
            {kind === "viewed" ? "Words you open will appear here." : "Saved words will appear here."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

interface SearchNoticeProps {
  readonly state: Exclude<VocabularySearchState, { kind: "found" }>;
  readonly onEditSearch: () => void;
  readonly onSearch: (query: string) => void;
}

function SearchNotice({ onEditSearch, onSearch, state }: SearchNoticeProps) {
  if (state.kind === "searching") {
    return (
      <div className="wvsr-notice wvsr-notice--quiet" role="status">
        <span className="wvsr-spinner" aria-hidden="true" />
        <div>
          <strong>Searching your Wordbook…</strong>
          <span>Looking through your words and related forms.</span>
        </div>
      </div>
    );
  }

  if (state.kind === "invalid") {
    return (
      <div className="wvsr-notice wvsr-notice--warning" role="alert">
        <span className="wvsr-notice__symbol" aria-hidden="true">!</span>
        <div>
          <strong>That search needs a small correction.</strong>
          <span>{state.message}</span>
        </div>
        <button onClick={onEditSearch} type="button">Edit search</button>
      </div>
    );
  }

  if (state.kind === "not-found") {
    return (
      <div className="wvsr-notice wvsr-notice--warning" role="status">
        <span className="wvsr-notice__symbol" aria-hidden="true">?</span>
        <div>
          <strong>No match for “{state.query}”.</strong>
          <span>
            {state.suggestions.length > 0
              ? "Try a similar word or ask Wordie for help."
              : "Check the spelling or ask Wordie for help."}
          </span>
          {state.suggestions.length > 0 ? (
            <div className="wvsr-notice__suggestions">
              {state.suggestions.slice(0, 4).map((suggestion) => (
                <button key={suggestion} onClick={() => onSearch(suggestion)} type="button">
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          className="wvsr-notice__wordie"
          onClick={() => dispatchAssistantRequest({ kind: "open", word: state.query })}
          type="button"
        >
          Ask Wordie
        </button>
      </div>
    );
  }

  if (state.kind === "repository-error") {
    return (
      <div className="wvsr-notice wvsr-notice--error" role="alert">
        <span className="wvsr-notice__symbol" aria-hidden="true">!</span>
        <div>
          <strong>Search is unavailable right now.</strong>
          <span>Please try again in a moment.</span>
        </div>
        <button onClick={() => onSearch(state.query)} type="button">Try again</button>
      </div>
    );
  }

  return null;
}

export function SearchRebuildView({
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
}: SearchRebuildViewProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [popularOffset, setPopularOffset] = useState(0);
  const suggestions = useMemo<readonly SearchRebuildSuggestion[]>(() => {
    const trimmed = query.trim().toLocaleLowerCase("en");
    if (trimmed.length === 0) {
      return [];
    }

    if (state.kind === "matches") {
      const seen = new Set<string>();
      return state.matches
        .filter((match) => {
          if (seen.has(match.entry.normalizedWord)) {
            return false;
          }
          seen.add(match.entry.normalizedWord);
          return true;
        })
        .slice(0, 6)
        .map((match) => ({
          word: match.entry.word,
          normalizedWord: match.entry.normalizedWord,
          definitionEn: match.entry.meanings[0]?.definitionEn,
          matchKind: match.matchKind
        }));
    }

    if (state.kind !== "typing") {
      return [];
    }

    const seen = new Set<string>();
    return [...recentSearches, ...recentAdditions]
      .filter(
        (item) =>
          item.normalizedWord.includes(trimmed) ||
          item.word.toLocaleLowerCase("en").includes(trimmed)
      )
      .filter((item) => {
        if (seen.has(item.normalizedWord)) {
          return false;
        }
        seen.add(item.normalizedWord);
        return true;
      })
      .slice(0, 6)
      .map((item) => ({
        word: item.word,
        normalizedWord: item.normalizedWord,
        definitionEn: recentAdditions.some(
          (addition) => addition.normalizedWord === item.normalizedWord
        )
          ? "Saved in your Wordbook."
          : "Recently viewed in Word Valley.",
        matchKind: "recent" as const
      }));
  }, [query, recentAdditions, recentSearches, state]);

  const starterSearches = useMemo(() => {
    const seen = new Set<string>();
    const candidates = [
      ...popularSearches,
      ...recentAdditions.map((item) => item.word),
      ...recentSearches.map((item) => item.word)
    ];

    return candidates.filter((word) => {
      const normalized = word.trim().toLocaleLowerCase("en");
      if (normalized.length === 0 || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }, [popularSearches, recentAdditions, recentSearches]);

  const visiblePopularSearches = useMemo(() => {
    if (starterSearches.length <= 5) {
      return starterSearches.slice(0, 5);
    }

    return Array.from({ length: 5 }, (_, index) => {
      const item = starterSearches[(popularOffset + index) % starterSearches.length];
      return item;
    }).filter((item): item is string => item !== undefined);
  }, [popularOffset, starterSearches]);

  const showSuggestionPanel =
    (state.kind === "typing" || state.kind === "matches") && suggestions.length > 0;

  function handleQueryChange(value: string) {
    setSelectedSuggestion(-1);
    onQueryChange(value);
  }

  function handleClear() {
    setSelectedSuggestion(-1);
    onClear();
  }

  function handleSearch(value: string) {
    setSelectedSuggestion(-1);
    onSearch(value);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestionPanel) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestion((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestion((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSelectedSuggestion(-1);
      return;
    }

    if (event.key === "Enter" && selectedSuggestion >= 0) {
      const selected = suggestions[selectedSuggestion];
      if (selected !== undefined) {
        event.preventDefault();
        handleSearch(selected.normalizedWord);
      }
    }
  }

  return (
    <div className="wvsr-root" data-search-ui="rebuild-v1">
      <section className="wvsr-scene" aria-labelledby="wvsr-heading">
        <div className="wvsr-scene__wash" aria-hidden="true" />

        <div className="wvsr-hero">
          <h1 id="wvsr-heading">Discover a new word.</h1>
          <div className="wvsr-hero__ornament" aria-hidden="true">
            <span />
            <b>❦</b>
            <span />
          </div>
          <p>Search, understand, and grow your vocabulary.</p>

          <form className="wvsr-search" onSubmit={onSubmit} role="search" aria-label="Vocabulary search">
            <span className="wvsr-search__icon" aria-hidden="true">
              <AppIcon name="search" size={28} />
            </span>

            <input
              aria-activedescendant={
                selectedSuggestion >= 0 ? `wvsr-suggestion-${selectedSuggestion}` : undefined
              }
              aria-autocomplete="list"
              aria-controls={showSuggestionPanel ? "wvsr-suggestions" : undefined}
              aria-expanded={showSuggestionPanel}
              aria-label="Search vocabulary"
              autoComplete="off"
              className="wvsr-search__input"
              onChange={(event) => handleQueryChange(event.currentTarget.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for a word..."
              ref={searchInputRef}
              spellCheck={false}
              value={query}
            />

            {query.length > 0 ? (
              <button
                aria-label="Clear search"
                className="wvsr-search__clear"
                onClick={handleClear}
                type="button"
              >
                ×
              </button>
            ) : null}

            <button className="wvsr-search__submit" type="submit">
              <AppIcon name="search" size={16} />
              <span>Search</span>
            </button>

            {showSuggestionPanel ? (
              <div
                className="wvsr-suggestions"
                id="wvsr-suggestions"
                role="listbox"
                aria-label="Best matches"
              >
                <p className="wvsr-suggestions__label">BEST MATCHES</p>
                <div className="wvsr-suggestions__list">
                  {suggestions.map((suggestion, index) => (
                    <button
                      aria-selected={selectedSuggestion === index}
                      className="wvsr-suggestion"
                      id={`wvsr-suggestion-${index}`}
                      key={`${suggestion.normalizedWord}-${suggestion.matchKind ?? "match"}`}
                      onClick={() => handleSearch(suggestion.normalizedWord)}
                      role="option"
                      type="button"
                    >
                      <span className="wvsr-suggestion__leaf" aria-hidden="true">⌁</span>
                      <strong>{suggestion.word}</strong>
                      <span>{suggestion.definitionEn ?? "Open this word to see its definition."}</span>
                      <b aria-hidden="true">→</b>
                    </button>
                  ))}
                </div>
                <button
                  className="wvsr-suggestions__all"
                  onClick={() => handleSearch(query)}
                  type="button"
                >
                  <span>View all results for “{query.trim()}”</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : null}
          </form>

          <div className="wvsr-popular" aria-label="Suggested searches">
            <span>TRY SEARCHING</span>
            <div className="wvsr-popular__chips">
              {visiblePopularSearches.map((word) => (
                <button key={word} onClick={() => handleSearch(word)} type="button">
                  {word}
                </button>
              ))}
              {starterSearches.length > 0 ? (
                <button
                  aria-label="Refresh suggested searches"
                  className="wvsr-popular__refresh"
                  onClick={() =>
                    setPopularOffset((current) => (current + 1) % starterSearches.length)
                  }
                  type="button"
                >
                  ↻
                </button>
              ) : null}
            </div>
          </div>

          <SearchNotice onEditSearch={onEditSearch} onSearch={handleSearch} state={state} />
        </div>

        <blockquote className="wvsr-quote">
          <p>The limits of my language<br />are the limits of my world.</p>
          <cite>— Ludwig Wittgenstein</cite>
        </blockquote>

        <div className="wvsr-language" aria-label="Current language">
          <span aria-hidden="true">◎</span>
          <span>English</span>
          <span aria-hidden="true">⌄</span>
        </div>
      </section>

      <aside className="wvsr-rail" aria-label="Word activity">
        <div className="wvsr-rail__paper" aria-hidden="true" />
        <ActivityList
          kind="viewed"
          items={recentSearches}
          onSearch={handleSearch}
          title="RECENTLY VIEWED"
        />
        <div className="wvsr-rail__divider" />
        <ActivityList
          kind="added"
          items={recentAdditions}
          onSearch={handleSearch}
          title="RECENT ADDITIONS"
        />

        <section className="wvsr-wordie-card" aria-label="Wordie vocabulary assistant">
          <header>
            <span className="wvsr-wordie-card__status" aria-hidden="true">✓</span>
            <h2>Wordie</h2>
            <img alt="" className="wvsr-wordie-card__sparkle" src={sparklePair} />
          </header>
          <p className="wvsr-wordie-card__subtitle">Your vocabulary companion</p>
          <p className="wvsr-wordie-card__copy">
            Need help finding the right word or understanding its nuance?
          </p>
          <img alt="" className="wvsr-wordie-card__mascot" src={wordieReading} />
          <button
            onClick={() => dispatchAssistantRequest({ kind: "open" })}
            type="button"
          >
            <span>Ask Wordie</span>
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </aside>
    </div>
  );
}
