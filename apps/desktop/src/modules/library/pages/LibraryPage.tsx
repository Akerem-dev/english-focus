import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { CefrLevel } from "@platform/domain";

import {
  APP_COMMAND_EVENT,
  dispatchAppCommand,
  type AppCommandEventDetail
} from "../../../app/command-bar";
import {
  useFileTransfer,
  useToast,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import { ROUTE_PATHS } from "../../../app/router";
import { Button, CefrBadge, EmptyState, SearchInput, SelectField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { exportVocabularyPack } from "../../import-export";
import {
  compareRecords,
  matchesSearch,
  type LibraryRecord,
  type LibrarySort
} from "../application/libraryRecords";

type LibraryCefrFilter = "all" | CefrLevel;
type LibraryFavoriteFilter = "all" | "favorites";

const ALPHABET = Object.freeze([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
] as const);

type LibraryLetterFilter = "all" | (typeof ALPHABET)[number];

function primaryTranslation(translations: readonly string[]): string {
  return translations.slice(0, 3).join(", ");
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { contentSource, error, status, storedEntries } = useVocabularyRepository();
  const { getMetadata } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const [searchQuery, setSearchQuery] = useState("");
  const [cefrFilter, setCefrFilter] = useState<LibraryCefrFilter>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<LibraryFavoriteFilter>("all");
  const [letterFilter, setLetterFilter] = useState<LibraryLetterFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<LibrarySort>("word-asc");
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const libraryEntries = useMemo<readonly LibraryRecord[]>(() => {
    const storedByWord = new Map(
      storedEntries.map((record) => [record.entry.normalizedWord, record] as const)
    );

    return Object.freeze(
      contentSource.listEntries().map<LibraryRecord>((entry) => ({
        entry,
        layer: storedByWord.get(entry.normalizedWord)?.layer ?? "core"
      }))
    );
  }, [contentSource, storedEntries]);
  const availableLetters = useMemo(
    () =>
      new Set(libraryEntries.map((record) => record.entry.normalizedWord.charAt(0).toUpperCase())),
    [libraryEntries]
  );

  const filteredEntries = useMemo(() => {
    return [...libraryEntries]
      .filter((record) =>
        letterFilter === "all"
          ? true
          : record.entry.normalizedWord.toUpperCase().startsWith(letterFilter)
      )
      .filter((record) => (cefrFilter === "all" ? true : record.entry.cefr === cefrFilter))
      .filter((record) =>
        favoriteFilter === "all"
          ? true
          : getMetadata(record.entry.normalizedWord)?.favorite === true
      )
      .filter((record) =>
        matchesSearch(record, getMetadata(record.entry.normalizedWord), searchQuery)
      )
      .sort((left, right) => compareRecords(left, right, sort));
  }, [cefrFilter, favoriteFilter, getMetadata, letterFilter, libraryEntries, searchQuery, sort]);

  const selectedEntries = useMemo(
    () => filteredEntries.filter((record) => selectedWords.includes(record.entry.normalizedWord)),
    [filteredEntries, selectedWords]
  );

  const activeFilterCount = [cefrFilter, favoriteFilter, sort === "word-asc" ? "all" : sort].filter(
    (value) => value !== "all"
  ).length;

  function toggleSelection(normalizedWord: string) {
    setSelectedWords((current) =>
      current.includes(normalizedWord)
        ? current.filter((value) => value !== normalizedWord)
        : [...current, normalizedWord]
    );
  }

  function openEntry(normalizedWord: string) {
    navigate(`${ROUTE_PATHS.vocabulary}?word=${encodeURIComponent(normalizedWord)}`);
  }

  async function exportLibraryPack() {
    if (libraryEntries.length === 0) {
      return;
    }

    const pack = exportVocabularyPack(libraryEntries.map((record) => record.entry));
    try {
      await exporter.saveText(pack.fileName, pack.json, "application/json");
      showToast({
        title: "Library pack exported",
        message: `${libraryEntries.length} entr${libraryEntries.length === 1 ? "y" : "ies"} exported locally.`,
        tone: "success",
        dedupeKey: "library-export"
      });
    } catch (cause) {
      showToast({
        title: "Library pack could not be exported",
        message: cause instanceof Error ? cause.message : "The local file could not be created.",
        tone: "error",
        dedupeKey: "library-export"
      });
    }
  }

  async function exportSelectedEntries() {
    if (selectedEntries.length === 0) {
      return;
    }

    const pack = exportVocabularyPack(selectedEntries.map((record) => record.entry));
    const fileName = pack.fileName.replace(
      "vocabulary-pack",
      `vocabulary-pack-selected-${selectedEntries.length}`
    );

    try {
      await exporter.saveText(fileName, pack.json, "application/json");
      showToast({
        title: "Selected pack exported",
        message: `${selectedEntries.length} selected entr${selectedEntries.length === 1 ? "y" : "ies"} exported locally.`,
        tone: "success",
        dedupeKey: "library-export"
      });
    } catch (cause) {
      showToast({
        title: "Selected pack could not be exported",
        message: cause instanceof Error ? cause.message : "The local file could not be created.",
        tone: "error",
        dedupeKey: "library-export"
      });
    }
  }

  const handleAppCommand = useEffectEvent((event: Event) => {
    const { action } = (event as CustomEvent<AppCommandEventDetail>).detail;

    if (action === "focus-search") {
      searchInputRef.current?.focus();
      return;
    }

    if (action === "export-current") {
      if (selectedEntries.length > 0) {
        void exportSelectedEntries();
      } else {
        void exportLibraryPack();
      }
    }
  });

  useEffect(() => {
    window.addEventListener(APP_COMMAND_EVENT, handleAppCommand);

    return () => {
      window.removeEventListener(APP_COMMAND_EVENT, handleAppCommand);
    };
  }, []);

  return (
    <div className="route-page route-page--library">
      <header className="route-page__header library-page-header">
        <div>
          <p className="route-page__eyebrow">Local collection</p>
          <h1>Library</h1>
        </div>
        <div className="library-header-tools">
          <span aria-live="polite" className="library-entry-count">
            <strong>{filteredEntries.length}</strong>
            <span>{filteredEntries.length === 1 ? "entry" : "entries"}</span>
          </span>
          <div className="library-header-actions">
            <Button
              disabled={selectedEntries.length === 0}
              onClick={() => {
                void exportSelectedEntries();
              }}
              size="small"
              variant="primary"
            >
              Export selected
              {selectedEntries.length > 0 ? ` (${selectedEntries.length})` : ""}
            </Button>
            <Button
              disabled={libraryEntries.length === 0}
              leadingIcon={<AppIcon name="download" size={17} />}
              onClick={() => {
                void exportLibraryPack();
              }}
              size="small"
              variant="secondary"
            >
              Export library
            </Button>
          </div>
        </div>
      </header>

      {status === "error" ? (
        <section className="library-persistence-error" role="alert">
          <strong>Local vocabulary could not be loaded.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {libraryEntries.length === 0 ? (
        <EmptyState
          actions={
            <>
              <Button onClick={() => navigate(ROUTE_PATHS.vocabulary)} variant="primary">
                Search a word
              </Button>
              <Button onClick={() => dispatchAppCommand("open-import")} variant="secondary">
                Import JSON
              </Button>
            </>
          }
          className="library-empty-state"
          description={
            status === "loading"
              ? "Loading vocabulary saved on this device."
              : "Search for a word or import a structured vocabulary JSON entry to begin building your local collection."
          }
          icon={<AppIcon name="books" size={38} />}
          title={status === "loading" ? "Loading your library" : "Your library is empty"}
        />
      ) : (
        <div className="library-workspace">
          <nav aria-label="Browse library by first letter" className="library-alphabet">
            <button
              aria-pressed={letterFilter === "all"}
              className="library-alphabet__all"
              data-active={letterFilter === "all" || undefined}
              onClick={() => {
                setLetterFilter("all");
              }}
              type="button"
            >
              All
            </button>
            <div className="library-alphabet__letters">
              {ALPHABET.map((letter) => (
                <button
                  aria-label={`Show words starting with ${letter}`}
                  aria-pressed={letterFilter === letter}
                  className="library-alphabet__letter"
                  data-active={letterFilter === letter || undefined}
                  disabled={!availableLetters.has(letter)}
                  key={letter}
                  onClick={() => {
                    setLetterFilter(letter);
                  }}
                  type="button"
                >
                  {letter}
                </button>
              ))}
            </div>
          </nav>

          <div className="library-search-toolbar">
            <SearchInput
              fieldClassName="library-search-field"
              label="Search library"
              onChange={(event) => {
                setSearchQuery(event.currentTarget.value);
              }}
              onClear={() => {
                setSearchQuery("");
              }}
              placeholder="Search word, translation, example, tag, or note"
              ref={searchInputRef}
              value={searchQuery}
            />
            <Button
              aria-controls="library-filter-strip"
              aria-expanded={filtersOpen}
              onClick={() => {
                setFiltersOpen((current) => !current);
              }}
              trailingIcon={<AppIcon name="chevron-down" size={16} />}
              variant="secondary"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>

          <div
            aria-label="Library filters"
            className="library-filter-strip"
            hidden={!filtersOpen}
            id="library-filter-strip"
            role="group"
          >
            <div className="library-controls-grid">
              <SelectField
                fieldClassName="library-control-field"
                label="Filter by CEFR"
                onChange={(event) => {
                  setCefrFilter(event.currentTarget.value as LibraryCefrFilter);
                }}
                value={cefrFilter}
              >
                <option value="all">All CEFR levels</option>
                {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </SelectField>
              <SelectField
                fieldClassName="library-control-field"
                label="Favorites"
                onChange={(event) => {
                  setFavoriteFilter(event.currentTarget.value as LibraryFavoriteFilter);
                }}
                value={favoriteFilter}
              >
                <option value="all">All entries</option>
                <option value="favorites">Favorites only</option>
              </SelectField>
              <SelectField
                fieldClassName="library-control-field"
                label="Sort results"
                onChange={(event) => {
                  setSort(event.currentTarget.value as LibrarySort);
                }}
                value={sort}
              >
                <option value="word-asc">Word A → Z</option>
                <option value="word-desc">Word Z → A</option>
                <option value="updated-desc">Newest updated first</option>
              </SelectField>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <section className="library-panel library-panel--empty">
              <EmptyState
                description="No entry matches the current search and filters. Clear one or more controls to widen the result set."
                icon={<AppIcon name="search" size={34} />}
                title="No library entries match"
              />
            </section>
          ) : (
            <section
              className="library-panel library-panel--results"
              aria-labelledby="library-results-title"
            >
              <header className="library-panel__header">
                <div>
                  <p className="route-page__eyebrow">Results</p>
                  <h2 id="library-results-title">Vocabulary</h2>
                </div>
                <span className="library-panel__result-count">
                  {filteredEntries.length} visible
                </span>
              </header>

              <div className="library-table" role="table" aria-label="Saved vocabulary list">
                <div className="library-table__header" role="rowgroup">
                  <div className="library-table__row library-table__row--header" role="row">
                    <span role="columnheader">Pick</span>
                    <span role="columnheader">Word</span>
                    <span role="columnheader">Translation</span>
                    <span className="library-table__level-heading" role="columnheader">
                      Level
                    </span>
                  </div>
                </div>
                <div className="library-table__body" role="rowgroup">
                  {filteredEntries.map((record) => {
                    const isSelected = selectedWords.includes(record.entry.normalizedWord);

                    return (
                      <div
                        className="library-table__row library-table__row--entry"
                        key={record.entry.normalizedWord}
                        role="row"
                      >
                        <span
                          className="library-table__cell library-table__cell--checkbox"
                          role="cell"
                        >
                          <label className="library-selection">
                            <input
                              aria-label={`Select ${record.entry.word}`}
                              checked={isSelected}
                              className="library-selection__input"
                              onChange={() => {
                                toggleSelection(record.entry.normalizedWord);
                              }}
                              type="checkbox"
                            />
                            <span className="library-selection__control" aria-hidden="true">
                              <AppIcon name="check" size={14} />
                            </span>
                          </label>
                        </span>
                        <span className="library-table__cell" role="cell">
                          <button
                            aria-label={`Open ${record.entry.word} details`}
                            className="library-word-link"
                            onClick={() => {
                              openEntry(record.entry.normalizedWord);
                            }}
                            type="button"
                          >
                            <span>
                              <strong>{record.entry.word}</strong>
                              <small>{record.entry.partsOfSpeech.join(" · ")}</small>
                            </span>
                            <AppIcon name="book-open" size={16} />
                          </button>
                        </span>
                        <span
                          className="library-table__cell library-table__translation"
                          role="cell"
                        >
                          {primaryTranslation(
                            record.entry.meanings.flatMap((meaning) => meaning.translationsTr)
                          )}
                        </span>
                        <span className="library-table__level" role="cell">
                          <CefrBadge level={record.entry.cefr} showPrefix={false} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
