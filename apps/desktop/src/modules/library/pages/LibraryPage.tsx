import { useEffect, useMemo, useState } from "react";

import { useVocabularyMetadata, useVocabularyRepository } from "../../../app/providers";
import { Button, EmptyState, SearchInput, SelectField, StatusBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { exportVocabularyPack } from "../../import-export";
import type {
  LearningStatus,
  StoredVocabularyEntry,
  VocabularyStorageLayer,
  VocabularyUserMetadata
} from "@platform/domain";

type LibrarySort = "updated-desc" | "word-asc" | "word-desc";
type LibraryLayerFilter = "all" | VocabularyStorageLayer;
type LibraryCefrFilter = "all" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type LibraryLearningFilter = "all" | LearningStatus;
type LibraryFavoriteFilter = "all" | "favorites";

function primaryTranslation(translations: readonly string[]): string {
  return translations.slice(0, 3).join(", ");
}

function describeLayer(layer: VocabularyStorageLayer): string {
  return layer === "override" ? "User override" : "User entry";
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

function labelStatus(value: string): string {
  return value.charAt(0).toLocaleUpperCase("en-US") + value.slice(1);
}

function searchableText(
  record: StoredVocabularyEntry,
  metadata: VocabularyUserMetadata | undefined
): string {
  return [
    record.entry.word,
    record.entry.normalizedWord,
    record.entry.cefr,
    ...record.entry.aliases,
    ...record.entry.partsOfSpeech,
    ...record.entry.registers,
    ...record.entry.meanings.flatMap((meaning) => [
      meaning.definitionEn,
      ...meaning.translationsTr
    ]),
    ...record.entry.examples.flatMap((example) => [example.sentenceEn, example.translationTr]),
    metadata?.note ?? "",
    ...(metadata?.tags.map((tag) => tag.name) ?? []),
    metadata?.learningStatus ?? "",
    metadata?.reviewStatus ?? ""
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

function matchesSearch(
  record: StoredVocabularyEntry,
  metadata: VocabularyUserMetadata | undefined,
  query: string
): boolean {
  if (query.trim().length === 0) {
    return true;
  }

  return searchableText(record, metadata).includes(query.trim().toLocaleLowerCase("en-US"));
}

function compareRecords(
  left: StoredVocabularyEntry,
  right: StoredVocabularyEntry,
  sort: LibrarySort
) {
  switch (sort) {
    case "word-asc":
      return left.entry.word.localeCompare(right.entry.word, "en", { sensitivity: "base" });
    case "word-desc":
      return right.entry.word.localeCompare(left.entry.word, "en", { sensitivity: "base" });
    case "updated-desc":
    default:
      return right.entry.updatedAt.localeCompare(left.entry.updatedAt);
  }
}

export function LibraryPage() {
  const { error, status, storedEntries } = useVocabularyRepository();
  const { getMetadata, metadata } = useVocabularyMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<LibraryLayerFilter>("all");
  const [cefrFilter, setCefrFilter] = useState<LibraryCefrFilter>("all");
  const [learningFilter, setLearningFilter] = useState<LibraryLearningFilter>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<LibraryFavoriteFilter>("all");
  const [sort, setSort] = useState<LibrarySort>("updated-desc");
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([]);
  const [previewWord, setPreviewWord] = useState<string | undefined>();
  const [clipboardNotice, setClipboardNotice] = useState<string | undefined>();

  const filteredEntries = useMemo(() => {
    return [...storedEntries]
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
    learningFilter,
    metadata,
    searchQuery,
    sort,
    storedEntries
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

  const storedUserCount = storedEntries.filter((record) => record.layer === "user").length;
  const storedOverrideCount = storedEntries.filter((record) => record.layer === "override").length;
  const favoriteCount = metadata.filter((record) => record.favorite).length;

  useEffect(() => {
    setSelectedWords((current) =>
      current.filter((normalizedWord) =>
        storedEntries.some((record) => record.entry.normalizedWord === normalizedWord)
      )
    );
  }, [storedEntries]);

  useEffect(() => {
    if (previewEntry !== undefined && previewWord !== previewEntry.entry.normalizedWord) {
      setPreviewWord(previewEntry.entry.normalizedWord);
      return;
    }

    if (previewEntry === undefined) {
      setPreviewWord(undefined);
    }
  }, [previewEntry, previewWord]);

  function toggleSelection(normalizedWord: string) {
    setSelectedWords((current) =>
      current.includes(normalizedWord)
        ? current.filter((value) => value !== normalizedWord)
        : [...current, normalizedWord]
    );
  }

  function selectVisibleEntries() {
    setSelectedWords(filteredEntries.map((record) => record.entry.normalizedWord));
  }

  function clearSelection() {
    setSelectedWords([]);
  }

  async function copySelectedWords() {
    if (selectedEntries.length === 0) {
      return;
    }

    const payload = selectedEntries.map((record) => record.entry.word).join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      setClipboardNotice(
        `${selectedEntries.length} word${selectedEntries.length === 1 ? "" : "s"} copied.`
      );
    } catch {
      setClipboardNotice("Clipboard access was blocked.");
    }
  }

  function exportLibraryPack() {
    if (storedEntries.length === 0) {
      return;
    }

    const pack = exportVocabularyPack(storedEntries.map((record) => record.entry));
    const blob = new Blob([pack.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pack.fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSelectedEntries() {
    if (selectedEntries.length === 0) {
      return;
    }

    const pack = exportVocabularyPack(selectedEntries.map((record) => record.entry));
    const blob = new Blob([pack.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pack.fileName.replace(
      "vocabulary-pack",
      `vocabulary-pack-selected-${selectedEntries.length}`
    );
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="route-page route-page--library">
      <header className="route-page__header">
        <div>
          <p className="route-page__eyebrow">Local collection</p>
          <h1>Library</h1>
          <p>Search, organize, review, and export vocabulary entries stored on this device.</p>
        </div>
        <span className="route-page__count">
          {storedEntries.length} {storedEntries.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      {status === "error" ? (
        <section className="library-persistence-error" role="alert">
          <strong>Local vocabulary could not be loaded.</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {storedEntries.length === 0 ? (
        <EmptyState
          actions={
            <>
              <Button disabled variant="primary">
                Search a word
              </Button>
              <Button disabled variant="secondary">
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
                <p className="route-page__eyebrow">CP15 workspace</p>
                <h2 id="library-controls-title">Search and manage saved vocabulary</h2>
              </div>
              <div className="library-panel__header-actions">
                <StatusBadge tone="success">SQLite-backed library</StatusBadge>
                <Button
                  leadingIcon={<AppIcon name="download" size={17} />}
                  onClick={exportLibraryPack}
                  size="small"
                  variant="secondary"
                >
                  Export library pack
                </Button>
              </div>
            </header>

            <div className="library-summary-grid">
              <article className="library-summary-card">
                <span>Visible entries</span>
                <strong>{filteredEntries.length}</strong>
                <small>after search, filters, and sorting</small>
              </article>
              <article className="library-summary-card">
                <span>User entries</span>
                <strong>{storedUserCount}</strong>
                <small>new words saved on this device</small>
              </article>
              <article className="library-summary-card">
                <span>User overrides</span>
                <strong>{storedOverrideCount}</strong>
                <small>reviewed replacements layered over core</small>
              </article>
              <article className="library-summary-card">
                <span>Favorites</span>
                <strong>{favoriteCount}</strong>
                <small>personal favorites stored separately</small>
              </article>
              <article className="library-summary-card">
                <span>Selected</span>
                <strong>{selectedEntries.length}</strong>
                <small>available for export or copy</small>
              </article>
            </div>

            <div className="library-controls-grid">
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
                value={searchQuery}
              />
              <SelectField
                fieldClassName="library-control-field"
                label="Filter by layer"
                onChange={(event) => {
                  setLayerFilter(event.currentTarget.value as LibraryLayerFilter);
                }}
                value={layerFilter}
              >
                <option value="all">All layers</option>
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

            <div className="library-selection-toolbar" aria-live="polite">
              <div className="library-selection-toolbar__summary">
                <strong>{selectedEntries.length}</strong>
                <span>
                  selected · {filteredEntries.length} visible · {storedEntries.length} total
                </span>
              </div>
              <div className="library-selection-toolbar__actions">
                <Button onClick={selectVisibleEntries} variant="secondary">
                  Select visible
                </Button>
                <Button
                  disabled={selectedEntries.length === 0}
                  onClick={clearSelection}
                  variant="secondary"
                >
                  Clear selection
                </Button>
                <Button
                  disabled={selectedEntries.length === 0}
                  onClick={() => {
                    void copySelectedWords();
                  }}
                  variant="secondary"
                >
                  Copy words
                </Button>
                <Button
                  disabled={selectedEntries.length === 0}
                  onClick={exportSelectedEntries}
                  variant="primary"
                >
                  Export selected pack
                </Button>
              </div>
            </div>

            {clipboardNotice === undefined ? null : (
              <p className="library-selection-toolbar__notice">{clipboardNotice}</p>
            )}
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
                  <StatusBadge>{filteredEntries.length} visible</StatusBadge>
                </header>

                <div className="library-table" role="table" aria-label="Saved vocabulary list">
                  <div className="library-table__header" role="rowgroup">
                    <div className="library-table__row library-table__row--header" role="row">
                      <span role="columnheader">Pick</span>
                      <span role="columnheader">Word</span>
                      <span role="columnheader">Translation</span>
                      <span role="columnheader">Metadata</span>
                    </div>
                  </div>
                  <div className="library-table__body" role="rowgroup">
                    {filteredEntries.map((record) => {
                      const entryMetadata = getMetadata(record.entry.normalizedWord);
                      const isSelected = selectedWords.includes(record.entry.normalizedWord);
                      const isPreviewed =
                        previewEntry?.entry.normalizedWord === record.entry.normalizedWord;

                      return (
                        <button
                          className="library-table__row library-table__row--entry"
                          data-active={isPreviewed || undefined}
                          key={record.entry.normalizedWord}
                          onClick={() => {
                            setPreviewWord(record.entry.normalizedWord);
                          }}
                          role="row"
                          type="button"
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
                          <span className="library-table__cell" role="cell">
                            <span className="library-table__badges">
                              <StatusBadge tone="accent">{record.entry.cefr}</StatusBadge>
                              <StatusBadge>{describeLayer(record.layer)}</StatusBadge>
                              <StatusBadge tone="success">
                                {record.entry.examples.length} examples
                              </StatusBadge>
                              {entryMetadata?.favorite === true ? (
                                <StatusBadge tone="accent">Favorite</StatusBadge>
                              ) : null}
                              {entryMetadata === undefined ? null : (
                                <StatusBadge>
                                  {labelStatus(entryMetadata.learningStatus)}
                                </StatusBadge>
                              )}
                            </span>
                            <small>Updated {formatUpdatedDate(record.entry.updatedAt)}</small>
                          </span>
                        </button>
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
                      <StatusBadge tone="accent">{previewEntry.entry.cefr}</StatusBadge>
                    </header>

                    <p className="library-preview__translation">
                      {primaryTranslation(
                        previewEntry.entry.meanings.flatMap((meaning) => meaning.translationsTr)
                      )}
                    </p>

                    <div className="library-preview__badges">
                      <StatusBadge>{describeLayer(previewEntry.layer)}</StatusBadge>
                      <StatusBadge tone="success">Reviewed import</StatusBadge>
                      {getMetadata(previewEntry.entry.normalizedWord)?.favorite === true ? (
                        <StatusBadge tone="accent">Favorite</StatusBadge>
                      ) : null}
                      {getMetadata(previewEntry.entry.normalizedWord) === undefined ? null : (
                        <>
                          <StatusBadge>
                            {labelStatus(
                              getMetadata(previewEntry.entry.normalizedWord)?.learningStatus ??
                                "new"
                            )}
                          </StatusBadge>
                          <StatusBadge>
                            {labelStatus(
                              getMetadata(previewEntry.entry.normalizedWord)?.reviewStatus ??
                                "reviewed"
                            )}
                          </StatusBadge>
                        </>
                      )}
                    </div>

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
                          <div className="library-preview__tag-list">
                            {getMetadata(previewEntry.entry.normalizedWord)?.tags.map((tag) => (
                              <StatusBadge key={tag.id}>{tag.name}</StatusBadge>
                            ))}
                          </div>
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
