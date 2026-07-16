import { useEffect, useEffectEvent, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { APP_COMMAND_EVENT, type AppCommandEventDetail } from "../../../app/command-bar";
import {
  useToast,
  useFileTransfer,
  useUndo,
  useActivity,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import { Button, ErrorState, SearchInput } from "../../../components";
import { AppIcon } from "../../../design-system";
import { AiInstructionDialog } from "../../instruction";
import { PasteGeneratedJsonDialog, exportVocabularyEntry } from "../../import-export";
import { SearchVocabulary, type SearchVocabularyResult } from "../../search";
import {
  VocabularyFoundState,
  VocabularyInvalidSearchState,
  VocabularyMetadataDialog,
  VocabularyNotFoundState,
  VocabularySearchingState
} from "../components";
import { createVocabularyUserMetadata } from "../application";
import type { VocabularySearchState } from "../../search/state";

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
        {words.map((word) => {
          return (
            <button
              className="word-list-row"
              key={word}
              onClick={() => {
                onOpenWord(word);
              }}
              title={`Open ${word}`}
              type="button"
            >
              <span className="word-list-row__word">
                <AppIcon name="book-open" size={16} />
                {word}
              </span>
              <span className="word-list-row__meta">Open entry</span>
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
  const { contentSource, storedEntries } = useVocabularyRepository();
  const { activity } = useActivity();
  const { getMetadata, recordView, saveMetadata, status: metadataStatus } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const { runUndoableAction } = useUndo();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<VocabularySearchState>({ kind: "initial" });
  const [instructionWord, setInstructionWord] = useState<string | undefined>();
  const [pasteJsonWord, setPasteJsonWord] = useState<string | undefined>();
  const [metadataWord, setMetadataWord] = useState<string | undefined>();
  const searchSequence = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deepLinkHandled = useRef<string | undefined>(undefined);
  const searchVocabulary = useMemo(() => new SearchVocabulary(contentSource), [contentSource]);
  const recentWords = useMemo(() => {
    const seen = new Set<string>();
    return activity
      .filter((record) => record.kind === "vocabulary-viewed" && record.target !== undefined)
      .map((record) => record.target as string)
      .filter((word) => contentSource.getEntryByNormalizedWord(word) !== undefined)
      .filter((word) => {
        if (seen.has(word)) {
          return false;
        }
        seen.add(word);
        return true;
      })
      .slice(0, 4);
  }, [activity, contentSource]);
  const recentAdditions = useMemo(
    () =>
      [...storedEntries]
        .sort((left, right) => right.entry.createdAt.localeCompare(left.entry.createdAt))
        .slice(0, 4)
        .map((record) => record.entry.normalizedWord),
    [storedEntries]
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
        const result = searchVocabulary.execute(nextQuery);
        setSearchState(toPageState(result));
        if (result.kind === "found") {
          void recordView(result.entry.normalizedWord);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The local vocabulary could not be searched.";
        setSearchState({ kind: "repository-error", query: nextQuery, message });
        showToast({
          title: "Vocabulary search failed",
          message,
          tone: "error",
          dedupeKey: "vocabulary-search-error"
        });
      }
    });
  }

  const executeRouteSearch = useEffectEvent(executeSearch);

  useEffect(() => {
    const routeWord = searchParams.get("word")?.trim();

    if (
      routeWord === undefined ||
      routeWord.length === 0 ||
      deepLinkHandled.current === routeWord
    ) {
      return;
    }

    deepLinkHandled.current = routeWord;
    executeRouteSearch(routeWord);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

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

  async function exportCurrentEntry() {
    if (searchState.kind !== "found") {
      return;
    }

    const exported = exportVocabularyEntry(searchState.entry);
    try {
      await exporter.saveText(exported.fileName, exported.json, "application/json");
      showToast({
        title: "Vocabulary JSON exported",
        message: `${exported.fileName} was created locally.`,
        tone: "success",
        dedupeKey: "vocabulary-export"
      });
    } catch (cause) {
      showToast({
        title: "Vocabulary JSON could not be exported",
        message: cause instanceof Error ? cause.message : "The local file could not be created.",
        tone: "error",
        dedupeKey: "vocabulary-export"
      });
    }
  }

  async function toggleCurrentFavorite() {
    if (searchState.kind !== "found" || metadataStatus === "saving") {
      return;
    }

    const now = new Date().toISOString();
    const current =
      getMetadata(searchState.entry.normalizedWord) ??
      createVocabularyUserMetadata(searchState.entry.normalizedWord, now);

    const nextFavorite = !current.favorite;
    const nextMetadata = {
      ...current,
      favorite: nextFavorite,
      updatedAt: now
    };

    try {
      await runUndoableAction({
        perform: () => saveMetadata(nextMetadata),
        undo: async () => {
          await saveMetadata({
            ...current,
            updatedAt: new Date().toISOString()
          });
        },
        successTitle: nextFavorite ? "Added to favorites" : "Removed from favorites",
        successMessage: `“${searchState.entry.word}” study metadata was updated locally.`,
        undoSuccessTitle: "Favorite change undone",
        undoSuccessMessage: `“${searchState.entry.word}” returned to its previous favorite state.`,
        failureTitle: "Favorite could not be updated",
        undoFailureTitle: "Favorite change could not be undone"
      });
    } catch {
      // The undo provider already presented a standardized user-facing error toast.
    }
  }

  const handleAppCommand = useEffectEvent((event: Event) => {
    const { action } = (event as CustomEvent<AppCommandEventDetail>).detail;

    switch (action) {
      case "focus-search":
        if (searchState.kind === "found") {
          returnToInitial();
        }

        window.requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
        return;
      case "export-current":
        void exportCurrentEntry();
        return;
      case "save-current":
        void toggleCurrentFavorite();
        return;
      case "edit-study-details":
        if (searchState.kind === "found") {
          setMetadataWord(searchState.entry.normalizedWord);
        }
        return;
      case "open-import":
        return;
    }
  });

  useEffect(() => {
    window.addEventListener(APP_COMMAND_EVENT, handleAppCommand);

    return () => {
      window.removeEventListener(APP_COMMAND_EVENT, handleAppCommand);
    };
  }, []);

  if (searchState.kind === "found") {
    const entryMetadata = getMetadata(searchState.entry.normalizedWord);

    return (
      <>
        <VocabularyFoundState
          entry={searchState.entry}
          metadata={entryMetadata}
          onBack={returnToInitial}
          onEditMetadata={() => {
            setMetadataWord(searchState.entry.normalizedWord);
          }}
          onExport={() => {
            void exportCurrentEntry();
          }}
          onImportReplacement={() => {
            setPasteJsonWord(searchState.entry.normalizedWord);
          }}
        />
        {metadataWord === undefined ? null : (
          <VocabularyMetadataDialog
            entry={searchState.entry}
            metadata={entryMetadata}
            onClose={() => {
              setMetadataWord(undefined);
            }}
            onSave={async (input) => {
              await saveMetadata(input);
              setMetadataWord(undefined);
              showToast({
                title: "Study details saved",
                message: `Personal metadata for “${searchState.entry.word}” is stored locally.`,
                tone: "success",
                dedupeKey: "study-details-saved"
              });
            }}
            open
            saving={metadataStatus === "saving"}
          />
        )}
        {pasteJsonWord === undefined ? null : (
          <PasteGeneratedJsonDialog
            expectedWord={pasteJsonWord}
            onClose={() => {
              setPasteJsonWord(undefined);
            }}
            onOpenSavedEntry={(word) => {
              setPasteJsonWord(undefined);
              executeSearch(word);
            }}
            open
          />
        )}
      </>
    );
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
        <form
          aria-label="Vocabulary search"
          className="vocabulary-search"
          onSubmit={handleSubmit}
          role="search"
        >
          <SearchInput
            ref={searchInputRef}
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
          onOpenPasteGeneratedJson={() => {
            setPasteJsonWord(searchState.normalizedQuery);
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

      {pasteJsonWord === undefined ? null : (
        <PasteGeneratedJsonDialog
          expectedWord={pasteJsonWord}
          onClose={() => {
            setPasteJsonWord(undefined);
          }}
          onOpenSavedEntry={(word) => {
            setPasteJsonWord(undefined);
            executeSearch(word);
          }}
          open
        />
      )}

      {searchState.kind === "initial" || searchState.kind === "typing" ? (
        <div className="vocabulary-dashboard">
          <WordListCard
            emptyMessage="Words you open will appear here."
            eyebrow="Recent"
            onOpenWord={executeSearch}
            title="Recent searches"
            words={recentWords}
          />
          <WordListCard
            emptyMessage="Imported and user-created entries will appear here."
            eyebrow="Added locally"
            onOpenWord={executeSearch}
            title="Recent additions"
            words={recentAdditions}
          />
        </div>
      ) : null}
    </div>
  );
}
