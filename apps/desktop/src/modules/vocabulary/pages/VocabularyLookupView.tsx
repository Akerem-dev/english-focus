import type { FormEvent, RefObject } from "react";

import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon } from "../../../design-system";
import { AiInstructionDialog } from "../../instruction";
import { PasteGeneratedJsonDialog } from "../../import-export";
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
  readonly instructionWord?: string | undefined;
  readonly importWord?: string | undefined;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onClear: () => void;
  readonly onEditSearch: () => void;
  readonly onSearch: (query: string) => void;
  readonly onOpenInstruction: (word: string) => void;
  readonly onCloseInstruction: () => void;
  readonly onOpenImport: (word: string) => void;
  readonly onCloseImport: () => void;
}

export function VocabularyLookupView({
  importWord,
  instructionWord,
  onClear,
  onCloseImport,
  onCloseInstruction,
  onEditSearch,
  onOpenImport,
  onOpenInstruction,
  onQueryChange,
  onSearch,
  onSubmit,
  query,
  recentAdditions,
  recentWords,
  searchInputRef,
  state
}: VocabularyLookupViewProps) {
  return (
    <div className="route-page route-page--vocabulary">
      <section className="vocabulary-hero" aria-labelledby="vocabulary-heading">
        <p className="route-page__eyebrow">Local English vocabulary</p>
        <h1 id="vocabulary-heading">Search your local vocabulary</h1>
        <p className="vocabulary-hero__description">
          Open an exact English word or search Turkish translations, English definitions, word
          forms, personal tags, and notes—all stored on this device.
        </p>
        <form
          aria-label="Vocabulary search"
          className="vocabulary-search"
          onSubmit={onSubmit}
          role="search"
        >
          <SearchInput
            ref={searchInputRef}
            aria-label="Search vocabulary"
            label="Search vocabulary"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            onClear={onClear}
            placeholder="Word, translation, definition, tag, or note"
            value={query}
          />
          <Button
            aria-label="Search vocabulary"
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
        <p className="vocabulary-hero__hint">
          Exact words open immediately. Prefix and full-text matching runs entirely on this device.
        </p>
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
          onOpenInstruction={() => onOpenInstruction(state.normalizedQuery)}
          onOpenPasteGeneratedJson={() => onOpenImport(state.normalizedQuery)}
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
          title="Local vocabulary search failed"
        />
      ) : null}

      {instructionWord === undefined ? null : (
        <AiInstructionDialog onClose={onCloseInstruction} open targetWord={instructionWord} />
      )}
      {importWord === undefined ? null : (
        <PasteGeneratedJsonDialog
          expectedWord={importWord}
          onClose={onCloseImport}
          onOpenSavedEntry={onSearch}
          open
        />
      )}

      {state.kind === "initial" || state.kind === "typing" ? (
        <div className="vocabulary-dashboard">
          <WordListCard
            emptyMessage="Words you open will appear here."
            eyebrow="Recent"
            onOpenWord={onSearch}
            title="Recent searches"
            words={recentWords}
          />
          <WordListCard
            emptyMessage="Imported and user-created entries will appear here."
            eyebrow="Added locally"
            onOpenWord={onSearch}
            title="Recent additions"
            words={recentAdditions}
          />
        </div>
      ) : null}
    </div>
  );
}
