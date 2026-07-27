import { useEffect, type FormEvent, type RefObject } from "react";

import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon } from "../../../design-system";
import { dispatchAssistantRequest } from "../../assistant";
import type { VocabularySearchState } from "../../search/state";
import {
  VocabularyInvalidSearchState,
  VocabularyNotFoundState,
  VocabularySearchResultsState,
  VocabularySearchingState
} from "../components";

interface WordListCardProps {
  readonly title: string;
  readonly eyebrow: string;
  readonly words: readonly string[];
  readonly onOpenWord: (word: string) => void;
  readonly emptyMessage: string;
}

function WordListCard({ emptyMessage, eyebrow, onOpenWord, title, words }: WordListCardProps) {
  return (
    <section className="word-list-card">
      <header className="word-list-card__header">
        <h2>{title}</h2>
        <span>{eyebrow}</span>
      </header>
      <div className="word-list-card__rows">
        {words.length === 0 ? <p className="word-list-card__empty">{emptyMessage}</p> : null}
        {words.map((word) => (
          <button
            className="word-list-row"
            key={word}
            onClick={() => onOpenWord(word)}
            title={`Open ${word}`}
            type="button"
          >
            <span className="word-list-row__word">
              <AppIcon name="book-open" size={16} />
              {word}
            </span>
            <span className="word-list-row__meta">Open entry</span>
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
  const missingWord =
    state.kind === "not-found" && state.canCreateEntry ? state.normalizedQuery : undefined;
  const isHomeState = state.kind === "initial" || state.kind === "typing";

  useEffect(() => {
    if (missingWord === undefined) {
      return;
    }

    dispatchAssistantRequest({
      kind: "wake",
      word: missingWord
    });
  }, [missingWord]);

  return (
    <div
      className={`route-page route-page--vocabulary${isHomeState ? " route-page--vocabulary-home" : ""}`}
    >
      <section className="vocabulary-hero" aria-labelledby="vocabulary-heading">
        <h1 id="vocabulary-heading">Search</h1>
        <p className="vocabulary-hero__description">
          Find an English word, meaning, translation, tag, or note.
        </p>
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
            placeholder="Type a word, meaning, translation, tag, or note"
            value={query}
          />
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
        <p className="vocabulary-hero__hint">Your wordbook stays on this device.</p>
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
      {state.kind === "not-found" ? (
        <VocabularyNotFoundState
          canCreateEntry={state.canCreateEntry}
          normalizedQuery={state.normalizedQuery}
          onEditSearch={onEditSearch}
          onOpenAssistant={() => {
            dispatchAssistantRequest({
              kind: "open",
              word: state.normalizedQuery
            });
          }}
          onSelectSuggestion={onSearch}
          suggestions={state.suggestions}
        />
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
            emptyMessage="Words you open will appear here."
            eyebrow="Recent"
            onOpenWord={onSearch}
            title="Recent searches"
            words={recentWords}
          />
          <WordListCard
            emptyMessage="Words you add will appear here."
            eyebrow="Added"
            onOpenWord={onSearch}
            title="Recent additions"
            words={recentAdditions}
          />
        </div>
      ) : null}
    </div>
  );
}
