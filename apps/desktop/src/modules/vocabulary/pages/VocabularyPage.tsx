import { useEffect, useEffectEvent, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { APP_COMMAND_EVENT, type AppCommandEventDetail } from "../../../app/command-bar";
import {
  useActivity,
  useFileTransfer,
  useToast,
  useUndo,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import {
  createVocabularyEntrySearchParams,
  getVocabularyRouteOrigin,
  ROUTE_PATHS
} from "../../../app/router";
import { exportVocabularyEntry } from "../../import-export";
import { SearchVocabulary, type SearchVocabularyResult } from "../../search";
import type { VocabularySearchState } from "../../search/state";
import { createVocabularyUserMetadata, resolveVocabularyEditLayer } from "../application";
import { VocabularyFoundRoute } from "./VocabularyFoundRoute";
import { VocabularyLookupView } from "./VocabularyLookupView";

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

interface ExecuteSearchOptions {
  readonly syncRoute?: boolean;
}

export function VocabularyPage() {
  const navigate = useNavigate();
  const { contentSource, saveEntry, storedEntries } = useVocabularyRepository();
  const { activity } = useActivity();
  const { getMetadata, recordView, saveMetadata, status: metadataStatus } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const { runUndoableAction } = useUndo();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeOrigin = getVocabularyRouteOrigin(searchParams);
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<VocabularySearchState>({
    kind: "initial"
  });
  const [instructionWord, setInstructionWord] = useState<string | undefined>();
  const [pasteJsonWord, setPasteJsonWord] = useState<string | undefined>();
  const [metadataWord, setMetadataWord] = useState<string | undefined>();
  const [entryEditorOpen, setEntryEditorOpen] = useState(false);
  const [entrySaving, setEntrySaving] = useState(false);
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

  function executeSearch(nextQuery: string, options: ExecuteSearchOptions = {}) {
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

          if (options.syncRoute !== false) {
            deepLinkHandled.current = result.entry.normalizedWord;
            setSearchParams(
              createVocabularyEntrySearchParams(result.entry.normalizedWord, routeOrigin),
              { replace: true }
            );
          }
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

  const executeRouteSearch = useEffectEvent((word: string) => {
    executeSearch(word, { syncRoute: false });
  });

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
  }, [searchParams]);

  function returnToInitial() {
    searchSequence.current += 1;
    deepLinkHandled.current = undefined;
    setEntryEditorOpen(false);
    setInstructionWord(undefined);
    setMetadataWord(undefined);
    setPasteJsonWord(undefined);
    setQuery("");
    setSearchState({ kind: "initial" });
    setSearchParams({}, { replace: true });
  }

  function handleBack() {
    if (routeOrigin === "library") {
      navigate(ROUTE_PATHS.library, { replace: true });
      return;
    }

    returnToInitial();
  }

  function editCurrentSearch() {
    searchSequence.current += 1;
    deepLinkHandled.current = undefined;
    setSearchParams({}, { replace: true });
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

    try {
      await runUndoableAction({
        perform: async () => {
          await saveMetadata({ ...current, favorite: nextFavorite, updatedAt: now });
        },
        undo: async () => {
          await saveMetadata({ ...current, updatedAt: new Date().toISOString() });
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
      case "open-vocabulary-home":
        returnToInitial();
        return;
      case "focus-search":
        if (searchState.kind === "found") {
          returnToInitial();
        }
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
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
    return () => window.removeEventListener(APP_COMMAND_EVENT, handleAppCommand);
  }, []);

  if (searchState.kind === "found") {
    const entryMetadata = getMetadata(searchState.entry.normalizedWord);
    const editLayer = resolveVocabularyEditLayer(searchState.entry.normalizedWord, storedEntries);

    return (
      <VocabularyFoundRoute
        backLabel={routeOrigin === "library" ? "Back to Library" : "Back to vocabulary"}
        editLayer={editLayer}
        editorOpen={entryEditorOpen}
        editorSaving={entrySaving}
        importWord={pasteJsonWord}
        metadata={entryMetadata}
        metadataOpen={metadataWord !== undefined}
        metadataSaving={metadataStatus === "saving"}
        onBack={handleBack}
        onCloseEditor={() => setEntryEditorOpen(false)}
        onCloseImport={() => setPasteJsonWord(undefined)}
        onCloseMetadata={() => setMetadataWord(undefined)}
        onExport={() => void exportCurrentEntry()}
        onOpenEditor={() => setEntryEditorOpen(true)}
        onOpenImport={() => setPasteJsonWord(searchState.entry.normalizedWord)}
        onOpenMetadata={() => setMetadataWord(searchState.entry.normalizedWord)}
        onOpenSavedEntry={(word) => {
          setPasteJsonWord(undefined);
          executeSearch(word);
        }}
        onSaveEntry={async (input) => {
          setEntrySaving(true);
          try {
            const saved = await saveEntry(input);
            deepLinkHandled.current = saved.entry.normalizedWord;
            setSearchParams(
              createVocabularyEntrySearchParams(saved.entry.normalizedWord, routeOrigin),
              { replace: true }
            );
            setSearchState((current) =>
              current.kind === "found"
                ? {
                    ...current,
                    query: saved.entry.word,
                    entry: saved.entry,
                    matchKind: "exact",
                    matchedForm: saved.entry.word
                  }
                : current
            );
            showToast({
              title: "Vocabulary entry saved",
              message:
                input.layer === "override"
                  ? `A local override for “${saved.entry.word}” now appears in the app.`
                  : `“${saved.entry.word}” was updated in local SQLite storage.`,
              tone: "success",
              dedupeKey: "vocabulary-entry-saved"
            });
            return saved;
          } finally {
            setEntrySaving(false);
          }
        }}
        onSaveMetadata={async (input) => {
          await saveMetadata(input);
          setMetadataWord(undefined);
          showToast({
            title: "Personal details saved",
            message: `Personal metadata for “${searchState.entry.word}” is stored locally.`,
            tone: "success",
            dedupeKey: "study-details-saved"
          });
        }}
        state={searchState}
      />
    );
  }

  return (
    <VocabularyLookupView
      importWord={pasteJsonWord}
      instructionWord={instructionWord}
      onClear={returnToInitial}
      onCloseImport={() => setPasteJsonWord(undefined)}
      onCloseInstruction={() => setInstructionWord(undefined)}
      onEditSearch={editCurrentSearch}
      onOpenImport={setPasteJsonWord}
      onOpenInstruction={setInstructionWord}
      onQueryChange={(nextQuery) => {
        searchSequence.current += 1;
        deepLinkHandled.current = undefined;
        setSearchParams({}, { replace: true });
        setQuery(nextQuery);
        setSearchState(
          nextQuery.trim().length === 0 ? { kind: "initial" } : { kind: "typing", query: nextQuery }
        );
      }}
      onSearch={(word) => {
        setPasteJsonWord(undefined);
        executeSearch(word);
      }}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        executeSearch(query);
      }}
      query={query}
      recentAdditions={recentAdditions}
      recentWords={recentWords}
      searchInputRef={searchInputRef}
      state={searchState}
    />
  );
}
