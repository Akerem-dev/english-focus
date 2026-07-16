import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { Button, EmptyState, SearchInput, SelectField } from "../../../components";
import { AppIcon } from "../../../design-system";
import { exportVocabularyPack } from "../../import-export";
import type { LearningStatus } from "@platform/domain";
import {
  compareRecords,
  matchesSearch,
  type LibraryLayer,
  type LibraryRecord,
  type LibrarySort
} from "../application/libraryRecords";

type LibraryLayerFilter = "all" | LibraryLayer;
type LibraryCefrFilter = "all" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type LibraryLearningFilter = "all" | LearningStatus;
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

function formatUpdatedDate(isoDate: string): string {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return parsed.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { contentSource, error, status, storedEntries } = useVocabularyRepository();
  const { getMetadata } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<LibraryLayerFilter>("all");
  const [cefrFilter, setCefrFilter] = useState<LibraryCefrFilter>("all");
  const [learningFilter, setLearningFilter] = useState<LibraryLearningFilter>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<LibraryFavoriteFilter>("all");
  const [letterFilter, setLetterFilter] = useState<LibraryLetterFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<LibrarySort>("updated-desc");
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([]);
  const [previewWord, setPreviewWord] = useState<string | undefined>();
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
      .filter((record) => (layerFilter === "all" ? true : record.layer === layerFilter))
      .filter((record) => (cefrFilter === "all" ? true : record.entry.cefr === cefrFilter))
      .filter((record) => {
        const entryMetadata = getMetadata(record.entry.normalizedWord);
        return learningFilter === "all" ? true : entryMetadata?.learningStatus === learningFilter;
      })
      .filter((record) =>
        favoriteFilter === "all"
          ? true
          : getMetadata(record.entry.normalizedWord)?.favorite === true
      )
      .filter((record) =>
        matchesSearch(record, getMetadata(record.entry.normalizedWord), searchQuery)
      )
      .sort((left, right) => compareRecords(left, right, sort));
  }, [
    cefrFilter,
    favoriteFilter,
    getMetadata,
    layerFilter,
    letterFilter,
    learningFilter,
    searchQuery,
    sort,
    libraryEntries
  ]);

  const selectedEntries = useMemo(
    () => filteredEntries.filter((record) => selectedWords.includes(record.entry.normalizedWord)),
    [filteredEntries, selectedWords]
  );

  const previewEntry = useMemo(
    () =>
      filteredEntries.find((record) => record.entry.normalizedWord === previewWord) ??
      filteredEntries[0],
    [filteredEntries, previewWord]
  );

  const activeFilterCount = [
    layerFilter,
    cefrFilter,
    learningFilter,
    favoriteFilter,
    sort === "updated-desc" ? "all" : sort
  ].filter((value) => value !== "all").length;

  function toggleSelection(normalizedWord: string) {
    setSelectedWords((current) =>
      current.includes(normalizedWord)
        ? current.filter((value) => value !== normalizedWord)
        : [...current, normalizedWord]
    );
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
      <header className="route-page__header">
        <div>
          <p className="route-page__eyebrow">Local collection</p>
          <h1>Library</h1>
          <p>Search, organize, review, and export vocabulary entries stored on this device.</p>
        </div>
        <span
          aria-live="polite"
          className="library-entry-count"
          data-volume={
            filteredEntries.length >= 100 ? "high" : filteredEntries.length >= 20 ? "medium" : "low"
          }
        >
          <strong>{filteredEntries.length}</strong>
          <span>{filteredEntries.length === 1 ? "entry" : "entries"}</span>
        </span>
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
          <section
            className="library-panel library-panel--controls"
            aria-labelledby="library-controls-title"
          >
            <header className="library-panel__header">
              <div>
                <p className="route-page__eyebrow">Collection tools</p>
                <h2 id="library-controls-title">Search and manage vocabulary</h2>
              </div>
              <div className="library-panel__header-actions">
                <Button
                  disabled={selectedEntries.length === 0}
                  onClick={() => {
                    void exportSelectedEntries();
                  }}
                  size="small"
                  variant="primary"
                >
                  Export selected pack
                </Button>
                <Button
                  leadingIcon={<AppIcon name="download" size={17} />}
                  onClick={() => {
                    void exportLibraryPack();
                  }}
                  size="small"
                  variant="secondary"
                >
                  Export library pack
                </Button>
              </div>
            </header>

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

            <div className="library-search-row">
              <SearchInput
                fieldClassName="library-control-field"
                hideLabel={false}
                label="Search library"
                onChange={(event) => {
                  setSearchQuery(event.currentTarget.value);
                }}
                onClear={() => {
                  setSearchQuery("");
                }}
                placeholder="Search word, translation, grammar, or example"
                ref={searchInputRef}
                value={searchQuery}
              />
              <Button
                aria-controls="library-filter-panel"
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
              className="library-filter-panel"
              hidden={!filtersOpen}
              id="library-filter-panel"
              role="group"
            >
              <div className="library-controls-grid">
                <SelectField
                  fieldClassName="library-control-field"
                  label="Filter by layer"
                  onChange={(event) => {
                    setLayerFilter(event.currentTarget.value as LibraryLayerFilter);
                  }}
                  value={layerFilter}
                >
                  <option value="all">All layers</option>
                  <option value="core">Core entries</option>
                  <option value="user">User entries</option>
                  <option value="override">User overrides</option>
                </SelectField>
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
                  label="Learning status"
                  onChange={(event) => {
                    setLearningFilter(event.currentTarget.value as LibraryLearningFilter);
                  }}
                  value={learningFilter}
                >
                  <option value="all">All learning states</option>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="known">Known</option>
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
                  <option value="updated-desc">Newest updated first</option>
                  <option value="word-asc">Word A → Z</option>
                  <option value="word-desc">Word Z → A</option>
                </SelectField>
              </div>
            </div>
          </section>

          {filteredEntries.length === 0 ? (
            <section className="library-panel library-panel--empty">
              <EmptyState
                description="No saved entry matches the current search and filter combination. Clear one or more controls to widen the result set."
                icon={<AppIcon name="search" size={34} />}
                title="No library entries match"
              />
            </section>
          ) : (
            <div className="library-content-grid">
              <section className="library-panel" aria-labelledby="library-results-title">
                <header className="library-panel__header">
                  <div>
                    <p className="route-page__eyebrow">Results</p>
                    <h2 id="library-results-title">Saved vocabulary list</h2>
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
                      <span role="columnheader">Level</span>
                    </div>
                  </div>
                  <div className="library-table__body" role="rowgroup">
                    {filteredEntries.map((record) => {
                      const isSelected = selectedWords.includes(record.entry.normalizedWord);
                      const isPreviewed =
                        previewEntry?.entry.normalizedWord === record.entry.normalizedWord;

                      return (
                        <div
                          aria-selected={isPreviewed}
                          className="library-table__row library-table__row--entry"
                          data-active={isPreviewed || undefined}
                          key={record.entry.normalizedWord}
                          onClick={() => {
                            setPreviewWord(record.entry.normalizedWord);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setPreviewWord(record.entry.normalizedWord);
                            }
                          }}
                          role="row"
                          tabIndex={0}
                        >
                          <span
                            className="library-table__cell library-table__cell--checkbox"
                            role="cell"
                          >
                            <input
                              aria-label={`Select ${record.entry.word}`}
                              checked={isSelected}
                              onChange={(event) => {
                                event.stopPropagation();
                                toggleSelection(record.entry.normalizedWord);
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                              type="checkbox"
                            />
                          </span>
                          <span className="library-table__cell" role="cell">
                            <strong>{record.entry.word}</strong>
                            <small>{record.entry.partsOfSpeech.join(" · ")}</small>
                          </span>
                          <span className="library-table__cell" role="cell">
                            {primaryTranslation(
                              record.entry.meanings.flatMap((meaning) => meaning.translationsTr)
                            )}
                          </span>
                          <span className="library-table__level" role="cell">
                            {record.entry.cefr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <aside
                className="library-panel library-panel--preview"
                aria-labelledby="library-preview-title"
              >
                {previewEntry === undefined ? null : (
                  <>
                    <header className="library-panel__header">
                      <div>
                        <p className="route-page__eyebrow">Preview</p>
                        <h2 id="library-preview-title">{previewEntry.entry.word}</h2>
                      </div>
                      <span className="library-preview__level">{previewEntry.entry.cefr}</span>
                    </header>

                    <p className="library-preview__translation">
                      {primaryTranslation(
                        previewEntry.entry.meanings.flatMap((meaning) => meaning.translationsTr)
                      )}
                    </p>

                    <dl className="library-preview__facts">
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatUpdatedDate(previewEntry.entry.updatedAt)}</dd>
                      </div>
                      <div>
                        <dt>Examples</dt>
                        <dd>{previewEntry.entry.examples.length}</dd>
                      </div>
                      <div>
                        <dt>Grammar patterns</dt>
                        <dd>{previewEntry.entry.grammar.patterns.length}</dd>
                      </div>
                      <div>
                        <dt>Collocations</dt>
                        <dd>{previewEntry.entry.collocations.length}</dd>
                      </div>
                    </dl>

                    {getMetadata(previewEntry.entry.normalizedWord) === undefined ? null : (
                      <section className="library-preview__section library-preview__section--personal">
                        <h3>Personal study details</h3>
                        {getMetadata(previewEntry.entry.normalizedWord)?.tags.length ===
                        0 ? null : (
                          <p className="library-preview__tags">
                            {getMetadata(previewEntry.entry.normalizedWord)
                              ?.tags.map((tag) => tag.name)
                              .join(" · ")}
                          </p>
                        )}
                        <p>
                          {getMetadata(previewEntry.entry.normalizedWord)?.note ||
                            "No personal note has been added."}
                        </p>
                        <small>
                          Viewed {getMetadata(previewEntry.entry.normalizedWord)?.viewCount ?? 0}{" "}
                          times
                        </small>
                      </section>
                    )}

                    <section className="library-preview__section">
                      <h3>Primary meaning</h3>
                      <p>
                        {previewEntry.entry.meanings[0]?.definitionEn ?? "No meaning provided."}
                      </p>
                    </section>

                    <section className="library-preview__section">
                      <h3>Example sentence</h3>
                      <p>{previewEntry.entry.examples[0]?.sentenceEn ?? "No example provided."}</p>
                      <small>{previewEntry.entry.examples[0]?.translationTr ?? ""}</small>
                    </section>
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
