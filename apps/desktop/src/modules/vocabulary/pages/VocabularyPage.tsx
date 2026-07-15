import { useMemo, useRef, useState, type FormEvent } from "react";

import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon } from "../../../design-system";
import { createCoreVocabularyContentSource } from "../../../infrastructure/content";
import { AiInstructionDialog } from "../../instruction";
import { SearchVocabulary, type SearchVocabularyResult } from "../../search";
import {
  VocabularyFoundState,
  VocabularyInvalidSearchState,
  VocabularyNotFoundState,
  VocabularySearchingState
} from "../components";
import type { VocabularySearchState } from "../../search/state";

const RECENT_WORDS = ["maintain", "allocate", "vivid", "derive"] as const;
const RECENT_ADDITIONS = ["concise", "sustain", "infer", "pursue"] as const;

interface WordListCardProps {
  readonly title: string;
  readonly eyebrow: string;
  readonly words: readonly string[];
  readonly onOpenWord: (word: string) => void;
}

function WordListCard({ eyebrow, onOpenWord, title, words }: WordListCardProps) {
  return (
    <section className="word-list-card">
      <header className="word-list-card__header">
        <h2>{title}</h2>
        <span>{eyebrow}</span>
      </header>
      <div className="word-list-card__rows">
        {words.map((word) => {
          const isAvailable = word === "maintain";

          return (
            <button
              className="word-list-row"
              disabled={!isAvailable}
              key={word}
              onClick={() => {
                onOpenWord(word);
              }}
              title={isAvailable ? `Open ${word}` : `${word} arrives in the core-pack checkpoint`}
              type="button"
            >
              <span className="word-list-row__word">
                <AppIcon name="book-open" size={16} />
                {word}
              </span>
              <span className="word-list-row__meta">
                {isAvailable ? "Open reviewed entry" : "Planned entry"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function toPageState(result: SearchVocabularyResult): VocabularySearchState {
  switch (result.kind) {
    case "found":
      return {
        kind: "found",
        query: result.query,
        entry: result.entry,
        matchKind: result.matchKind,
        matchedForm: result.matchedForm
      };
    case "invalid":
      return {
        kind: "invalid",
        query: result.query,
        validationCode: result.validationCode,
        message: result.message
      };
    case "not-found":
      return {
        kind: "not-found",
        query: result.query,
        normalizedQuery: result.normalizedQuery,
        suggestions: result.suggestions
      };
  }
}

export function VocabularyPage() {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<VocabularySearchState>({ kind: "initial" });
  const [instructionWord, setInstructionWord] = useState<string | undefined>();
  const searchSequence = useRef(0);
  const searchVocabulary = useMemo(
    () => new SearchVocabulary(createCoreVocabularyContentSource()),
    []
  );

  function executeSearch(nextQuery: string) {
    const requestId = searchSequence.current + 1;
    searchSequence.current = requestId;
    setQuery(nextQuery);
    setSearchState({ kind: "searching", query: nextQuery });

    queueMicrotask(() => {
      if (searchSequence.current !== requestId) {
        return;
      }

      try {
        setSearchState(toPageState(searchVocabulary.execute(nextQuery)));
      } catch (error) {
        setSearchState({
          kind: "repository-error",
          query: nextQuery,
          message:
            error instanceof Error ? error.message : "The local vocabulary could not be searched."
        });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    executeSearch(query);
  }

  function returnToInitial() {
    searchSequence.current += 1;
    setQuery("");
    setSearchState({ kind: "initial" });
  }

  function editCurrentSearch() {
    searchSequence.current += 1;
    setSearchState(query.trim().length === 0 ? { kind: "initial" } : { kind: "typing", query });
  }

  if (searchState.kind === "found") {
    return <VocabularyFoundState entry={searchState.entry} onBack={returnToInitial} />;
  }

  return (
    <div className="route-page route-page--vocabulary">
      <section className="vocabulary-hero" aria-labelledby="vocabulary-heading">
        <p className="route-page__eyebrow">Local English vocabulary</p>
        <h1 id="vocabulary-heading">Look up an English word</h1>
        <p className="vocabulary-hero__description">
          Meaning, Turkish translation, grammar usage, word family, and carefully structured example
          sentences—all stored on this device.
        </p>
        <form className="vocabulary-search" onSubmit={handleSubmit}>
          <SearchInput
            aria-label="Search vocabulary"
            label="Search vocabulary"
            onChange={(event) => {
              const nextQuery = event.currentTarget.value;
              searchSequence.current += 1;
              setQuery(nextQuery);
              setSearchState(
                nextQuery.trim().length === 0
                  ? { kind: "initial" }
                  : { kind: "typing", query: nextQuery }
              );
            }}
            onClear={returnToInitial}
            placeholder="Type an English word"
            value={query}
          />
          <Button
            aria-label="Search word"
            className="vocabulary-search__button"
            isLoading={searchState.kind === "searching"}
            leadingIcon={<AppIcon name="search" size={18} />}
            size="large"
            type="submit"
            variant="primary"
          >
            Search
          </Button>
        </form>
        <p className="vocabulary-hero__hint">
          Exact, case-insensitive, alias, and inflected-form lookup runs entirely on this device.
        </p>
      </section>

      {searchState.kind === "searching" ? (
        <VocabularySearchingState query={searchState.query} />
      ) : null}

      {searchState.kind === "invalid" ? (
        <VocabularyInvalidSearchState
          message={searchState.message}
          onEditSearch={editCurrentSearch}
        />
      ) : null}

      {searchState.kind === "not-found" ? (
        <VocabularyNotFoundState
          normalizedQuery={searchState.normalizedQuery}
          onEditSearch={editCurrentSearch}
          onOpenInstruction={() => {
            setInstructionWord(searchState.normalizedQuery);
          }}
          onSelectSuggestion={executeSearch}
          suggestions={searchState.suggestions}
        />
      ) : null}

      {searchState.kind === "repository-error" ? (
        <ErrorState
          actions={
            <Button
              onClick={() => {
                executeSearch(searchState.query);
              }}
              variant="secondary"
            >
              Try again
            </Button>
          }
          description={searchState.message}
          title="Local vocabulary search failed"
        />
      ) : null}

      {instructionWord === undefined ? null : (
        <AiInstructionDialog
          onClose={() => {
            setInstructionWord(undefined);
          }}
          open
          targetWord={instructionWord}
        />
      )}

      {searchState.kind === "initial" || searchState.kind === "typing" ? (
        <div className="vocabulary-dashboard">
          <WordListCard
            eyebrow="Recent"
            onOpenWord={executeSearch}
            title="Recent searches"
            words={RECENT_WORDS}
          />
          <WordListCard
            eyebrow="Added locally"
            onOpenWord={executeSearch}
            title="Recent additions"
            words={RECENT_ADDITIONS}
          />
        </div>
      ) : null}
    </div>
  );
}
