import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  APP_COMMAND_EVENT,
  type AppCommandEventDetail
} from "../../../app/command-bar";
import {
  useFileTransfer,
  useToast,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import { buildVocabularyEntryPath, ROUTE_PATHS } from "../../../app/router";
import { CefrBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { exportVocabularyPack } from "../../import-export";
import {
  matchesSearch,
  type LibraryRecord
} from "../application/libraryRecords";

type CollectionTone = "gold" | "sage" | "pine" | "rose" | "blue" | "sand";
type CollectionSort = "recent" | "name" | "size";
type WordSort = "word" | "level";

type ModalState =
  | { readonly type: "new" }
  | { readonly type: "edit" }
  | { readonly type: "add" }
  | { readonly type: "move" }
  | { readonly type: "delete" }
  | null;

interface CollectionModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tone: CollectionTone;
  readonly wordIds: readonly string[];
}

interface CollectionPreset {
  readonly title: string;
  readonly description: string;
  readonly tone: CollectionTone;
}

const COLLECTION_PRESETS: readonly CollectionPreset[] = Object.freeze([
  {
    title: "IELTS Vocabulary",
    description: "High-value words for reading, writing, speaking, and listening.",
    tone: "gold"
  },
  {
    title: "Academic Writing",
    description: "Formal vocabulary for essays, reports, and academic arguments.",
    tone: "sage"
  },
  {
    title: "Work & Business",
    description: "Useful language for meetings, projects, and professional communication.",
    tone: "pine"
  },
  {
    title: "Daily Communication",
    description: "Natural everyday vocabulary worth keeping close at hand.",
    tone: "rose"
  },
  {
    title: "Study & Review",
    description: "Words you want to revisit during focused study sessions.",
    tone: "blue"
  },
  {
    title: "Useful Expressions",
    description: "Memorable words and expressions collected for real-world use.",
    tone: "sand"
  }
]);

const COLLECTION_TONES: readonly CollectionTone[] = Object.freeze([
  "gold",
  "sage",
  "pine",
  "rose",
  "blue",
  "sand"
]);

function primaryTranslation(record: LibraryRecord): string {
  const values = record.entry.meanings.flatMap((meaning) => meaning.translationsTr);
  return values.slice(0, 3).join(", ") || "Translation not saved";
}

function primaryDefinition(record: LibraryRecord): string {
  return record.entry.meanings[0]?.definition ?? "Definition not saved for this word yet.";
}

function createSeedCollections(records: readonly LibraryRecord[]): CollectionModel[] {
  if (records.length === 0) {
    return [];
  }

  const wordIds = records.map((record) => record.entry.normalizedWord);

  return COLLECTION_PRESETS.map((preset, collectionIndex) => {
    const selected = wordIds.filter((_, wordIndex) => {
      const primaryBucket = wordIndex % COLLECTION_PRESETS.length === collectionIndex;
      const secondaryBucket = (wordIndex + collectionIndex * 2) % 5 === 0;
      return primaryBucket || secondaryBucket;
    });

    return {
      id: `collection-${collectionIndex + 1}`,
      ...preset,
      wordIds: selected.length > 0 ? selected : wordIds.slice(0, Math.min(6, wordIds.length))
    };
  });
}

function sortCollections(
  collections: readonly CollectionModel[],
  sort: CollectionSort
): CollectionModel[] {
  const result = [...collections];

  if (sort === "name") {
    return result.sort((left, right) => left.title.localeCompare(right.title));
  }

  if (sort === "size") {
    return result.sort((left, right) => right.wordIds.length - left.wordIds.length);
  }

  return result;
}

function toneLabel(tone: CollectionTone): string {
  switch (tone) {
    case "gold":
      return "Golden ochre";
    case "sage":
      return "Soft sage";
    case "pine":
      return "Deep pine";
    case "rose":
      return "Dusty rose";
    case "blue":
      return "Mist blue";
    case "sand":
      return "Warm sand";
  }
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { contentSource, error, status, storedEntries } = useVocabularyRepository();
  const { getMetadata } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const seededCollectionsRef = useRef(false);

  const [collections, setCollections] = useState<readonly CollectionModel[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>();
  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("recent");
  const [wordQuery, setWordQuery] = useState("");
  const [wordSort, setWordSort] = useState<WordSort>("word");
  const [expandedWord, setExpandedWord] = useState<string>();
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalQuery, setModalQuery] = useState("");
  const [modalWordSelection, setModalWordSelection] = useState<readonly string[]>([]);
  const [moveTargetId, setMoveTargetId] = useState<string>();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftTone, setDraftTone] = useState<CollectionTone>("gold");

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

  const recordByWord = useMemo(
    () => new Map(libraryEntries.map((record) => [record.entry.normalizedWord, record] as const)),
    [libraryEntries]
  );

  useEffect(() => {
    if (seededCollectionsRef.current || libraryEntries.length === 0) {
      return;
    }

    setCollections(createSeedCollections(libraryEntries));
    seededCollectionsRef.current = true;
  }, [libraryEntries]);

  const activeCollection = useMemo(
    () => collections.find((collection) => collection.id === activeCollectionId),
    [activeCollectionId, collections]
  );

  const visibleCollections = useMemo(() => {
    const normalizedQuery = collectionQuery.trim().toLocaleLowerCase();
    const matching = normalizedQuery
      ? collections.filter((collection) =>
          `${collection.title} ${collection.description}`.toLocaleLowerCase().includes(normalizedQuery)
        )
      : collections;

    return sortCollections(matching, collectionSort);
  }, [collectionQuery, collectionSort, collections]);

  const activeEntries = useMemo(() => {
    if (activeCollection === undefined) {
      return [];
    }

    const records = activeCollection.wordIds
      .map((wordId) => recordByWord.get(wordId))
      .filter((record): record is LibraryRecord => record !== undefined)
      .filter((record) => matchesSearch(record, getMetadata(record.entry.normalizedWord), wordQuery));

    if (wordSort === "level") {
      return [...records].sort((left, right) => left.entry.cefr.localeCompare(right.entry.cefr));
    }

    return [...records].sort((left, right) => left.entry.word.localeCompare(right.entry.word));
  }, [activeCollection, getMetadata, recordByWord, wordQuery, wordSort]);

  const selectedEntries = useMemo(
    () =>
      selectedWords
        .map((wordId) => recordByWord.get(wordId))
        .filter((record): record is LibraryRecord => record !== undefined),
    [recordByWord, selectedWords]
  );

  const addableEntries = useMemo(() => {
    const activeWords = new Set(activeCollection?.wordIds ?? []);
    const normalizedQuery = modalQuery.trim();

    return libraryEntries.filter(
      (record) =>
        !activeWords.has(record.entry.normalizedWord) &&
        matchesSearch(record, getMetadata(record.entry.normalizedWord), normalizedQuery)
    );
  }, [activeCollection, getMetadata, libraryEntries, modalQuery]);

  async function exportLibraryPack() {
    if (libraryEntries.length === 0) {
      return;
    }

    try {
      const pack = exportVocabularyPack(libraryEntries.map((record) => record.entry));
      await exporter.saveText(pack.fileName, pack.json, "application/json");
      showToast({
        title: "Collections exported",
        message: `${libraryEntries.length} vocabulary entries were exported locally.`,
        tone: "success",
        dedupeKey: "library-export"
      });
    } catch (cause) {
      showToast({
        title: "Collections could not be exported",
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

    try {
      const pack = exportVocabularyPack(selectedEntries.map((record) => record.entry));
      const fileName = pack.fileName.replace(
        "vocabulary-pack",
        `vocabulary-pack-selected-${selectedEntries.length}`
      );
      await exporter.saveText(fileName, pack.json, "application/json");
      showToast({
        title: "Selected words exported",
        message: `${selectedEntries.length} selected word${selectedEntries.length === 1 ? "" : "s"} exported locally.`,
        tone: "success",
        dedupeKey: "library-export-selected"
      });
    } catch (cause) {
      showToast({
        title: "Selected words could not be exported",
        message: cause instanceof Error ? cause.message : "The local file could not be created.",
        tone: "error",
        dedupeKey: "library-export-selected"
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

  useEffect(() => {
    if (modal === null) {
      return;
    }

    setModalQuery("");
    setModalWordSelection([]);
    setMoveTargetId(undefined);

    if (modal.type === "new") {
      setDraftTitle("");
      setDraftDescription("");
      setDraftTone("gold");
      return;
    }

    if (modal.type === "edit" && activeCollection !== undefined) {
      setDraftTitle(activeCollection.title);
      setDraftDescription(activeCollection.description);
      setDraftTone(activeCollection.tone);
    }
  }, [activeCollection, modal]);

  function openCollection(collectionId: string) {
    setActiveCollectionId(collectionId);
    setWordQuery("");
    setSelectedWords([]);
    setExpandedWord(undefined);
  }

  function closeCollection() {
    setActiveCollectionId(undefined);
    setWordQuery("");
    setSelectedWords([]);
    setExpandedWord(undefined);
  }

  function toggleSelectedWord(wordId: string) {
    setSelectedWords((current) =>
      current.includes(wordId)
        ? current.filter((currentId) => currentId !== wordId)
        : [...current, wordId]
    );
  }

  function toggleModalWord(wordId: string) {
    setModalWordSelection((current) =>
      current.includes(wordId)
        ? current.filter((currentId) => currentId !== wordId)
        : [...current, wordId]
    );
  }

  function createCollection() {
    const title = draftTitle.trim();
    if (title.length === 0) {
      return;
    }

    const collection: CollectionModel = {
      id: `custom-${Date.now()}`,
      title,
      description: draftDescription.trim() || "A focused collection for words you want to revisit.",
      tone: draftTone,
      wordIds: []
    };

    setCollections((current) => [collection, ...current]);
    setModal(null);
    openCollection(collection.id);
  }

  function saveCollectionChanges() {
    if (activeCollection === undefined || draftTitle.trim().length === 0) {
      return;
    }

    setCollections((current) =>
      current.map((collection) =>
        collection.id === activeCollection.id
          ? {
              ...collection,
              title: draftTitle.trim(),
              description:
                draftDescription.trim() || "A focused collection for words you want to revisit.",
              tone: draftTone
            }
          : collection
      )
    );
    setModal(null);
  }

  function addWordsToCollection() {
    if (activeCollection === undefined || modalWordSelection.length === 0) {
      return;
    }

    setCollections((current) =>
      current.map((collection) =>
        collection.id === activeCollection.id
          ? {
              ...collection,
              wordIds: Array.from(new Set([...collection.wordIds, ...modalWordSelection]))
            }
          : collection
      )
    );
    setModal(null);
    showToast({
      title: "Words added",
      message: `${modalWordSelection.length} word${modalWordSelection.length === 1 ? "" : "s"} added to ${activeCollection.title}.`,
      tone: "success",
      dedupeKey: "collection-add-words"
    });
  }

  function removeWordFromCollection(wordId: string) {
    if (activeCollection === undefined) {
      return;
    }

    setCollections((current) =>
      current.map((collection) =>
        collection.id === activeCollection.id
          ? { ...collection, wordIds: collection.wordIds.filter((id) => id !== wordId) }
          : collection
      )
    );
    setSelectedWords((current) => current.filter((id) => id !== wordId));
    if (expandedWord === wordId) {
      setExpandedWord(undefined);
    }
  }

  function moveSelectedWords() {
    if (
      activeCollection === undefined ||
      moveTargetId === undefined ||
      selectedWords.length === 0 ||
      moveTargetId === activeCollection.id
    ) {
      return;
    }

    setCollections((current) =>
      current.map((collection) => {
        if (collection.id === activeCollection.id) {
          return {
            ...collection,
            wordIds: collection.wordIds.filter((wordId) => !selectedWords.includes(wordId))
          };
        }

        if (collection.id === moveTargetId) {
          return {
            ...collection,
            wordIds: Array.from(new Set([...collection.wordIds, ...selectedWords]))
          };
        }

        return collection;
      })
    );
    setSelectedWords([]);
    setExpandedWord(undefined);
    setModal(null);
  }

  function deleteActiveCollection() {
    if (activeCollection === undefined) {
      return;
    }

    setCollections((current) => current.filter((collection) => collection.id !== activeCollection.id));
    setModal(null);
    closeCollection();
  }

  function practiceWord(word: string) {
    showToast({
      title: `${word} is ready for practice`,
      message: "The dedicated Practice workspace is the next Word Valley section to be connected.",
      tone: "success",
      dedupeKey: `practice-${word}`
    });
  }

  const collectionModal = (() => {
    if (modal === null) {
      return null;
    }

    if (modal.type === "new" || modal.type === "edit") {
      const editing = modal.type === "edit";
      return (
        <div className="wv-collections-modal-layer" role="presentation">
          <button
            aria-label="Close collection editor"
            className="wv-collections-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="collection-editor-title"
            aria-modal="true"
            className="wv-collections-modal wv-collections-modal--editor"
            role="dialog"
          >
            <header className="wv-collections-modal__header">
              <div>
                <p className="wv-collections-kicker">{editing ? "COLLECTION DETAILS" : "NEW STUDY PATH"}</p>
                <h2 id="collection-editor-title">{editing ? "Edit collection" : "New collection"}</h2>
                <p>
                  {editing
                    ? "Keep the name, description, and visual marker up to date."
                    : "Create a focused place for words you want to learn together."}
                </p>
              </div>
              <button
                aria-label="Close"
                className="wv-collections-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="wv-collections-modal__body">
              <label className="wv-collections-field">
                <span>COLLECTION TITLE</span>
                <input
                  autoFocus
                  onChange={(event) => setDraftTitle(event.currentTarget.value)}
                  placeholder="e.g. Academic Writing"
                  value={draftTitle}
                />
              </label>
              <label className="wv-collections-field">
                <span>DESCRIPTION</span>
                <textarea
                  onChange={(event) => setDraftDescription(event.currentTarget.value)}
                  placeholder="What belongs in this collection?"
                  rows={3}
                  value={draftDescription}
                />
              </label>

              <fieldset className="wv-collections-tone-fieldset">
                <legend>COLOR MARKER</legend>
                <div className="wv-collections-tone-options">
                  {COLLECTION_TONES.map((tone) => (
                    <button
                      aria-label={toneLabel(tone)}
                      aria-pressed={draftTone === tone}
                      className="wv-collections-tone"
                      data-tone={tone}
                      key={tone}
                      onClick={() => setDraftTone(tone)}
                      type="button"
                    >
                      <span />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <footer className="wv-collections-modal__footer">
              {editing ? (
                <button
                  className="wv-collections-text-button wv-collections-text-button--danger"
                  onClick={() => setModal({ type: "delete" })}
                  type="button"
                >
                  Delete collection
                </button>
              ) : (
                <span />
              )}
              <div className="wv-collections-modal__footer-actions">
                <button
                  className="wv-collections-button wv-collections-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wv-collections-button wv-collections-button--primary"
                  disabled={draftTitle.trim().length === 0}
                  onClick={editing ? saveCollectionChanges : createCollection}
                  type="button"
                >
                  <span aria-hidden="true">✓</span>
                  {editing ? "Save changes" : "Create collection"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      );
    }

    if (modal.type === "add") {
      return (
        <div className="wv-collections-modal-layer" role="presentation">
          <button
            aria-label="Close add words dialog"
            className="wv-collections-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="add-words-title"
            aria-modal="true"
            className="wv-collections-modal wv-collections-modal--words"
            role="dialog"
          >
            <header className="wv-collections-modal__header">
              <div>
                <p className="wv-collections-kicker">BUILD THIS COLLECTION</p>
                <h2 id="add-words-title">Add words</h2>
                <p>Choose saved words to add to {activeCollection?.title ?? "this collection"}.</p>
              </div>
              <button
                aria-label="Close"
                className="wv-collections-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="wv-collections-modal__body">
              <label className="wv-collections-search wv-collections-search--modal">
                <AppIcon name="search" size={19} />
                <input
                  autoFocus
                  onChange={(event) => setModalQuery(event.currentTarget.value)}
                  placeholder="Search saved words…"
                  value={modalQuery}
                />
              </label>
              <div className="wv-collections-pick-list">
                {addableEntries.length === 0 ? (
                  <div className="wv-collections-inline-empty">
                    <strong>No more matching words</strong>
                    <span>Try another search or return to the collection.</span>
                  </div>
                ) : (
                  addableEntries.map((record) => {
                    const checked = modalWordSelection.includes(record.entry.normalizedWord);
                    return (
                      <label className="wv-collections-pick-row" key={record.entry.normalizedWord}>
                        <input
                          checked={checked}
                          onChange={() => toggleModalWord(record.entry.normalizedWord)}
                          type="checkbox"
                        />
                        <span className="wv-collections-checkbox" aria-hidden="true">
                          <AppIcon name="check" size={13} />
                        </span>
                        <span className="wv-collections-pick-row__word">
                          <strong>{record.entry.word}</strong>
                          <small>{primaryTranslation(record)}</small>
                        </span>
                        <CefrBadge level={record.entry.cefr} showPrefix={false} />
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <footer className="wv-collections-modal__footer">
              <span className="wv-collections-selection-copy">
                {modalWordSelection.length} selected
              </span>
              <div className="wv-collections-modal__footer-actions">
                <button
                  className="wv-collections-button wv-collections-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wv-collections-button wv-collections-button--primary"
                  disabled={modalWordSelection.length === 0}
                  onClick={addWordsToCollection}
                  type="button"
                >
                  Add selected
                </button>
              </div>
            </footer>
          </section>
        </div>
      );
    }

    if (modal.type === "move") {
      const availableTargets = collections.filter(
        (collection) => collection.id !== activeCollection?.id
      );
      return (
        <div className="wv-collections-modal-layer" role="presentation">
          <button
            aria-label="Close move words dialog"
            className="wv-collections-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="move-words-title"
            aria-modal="true"
            className="wv-collections-modal wv-collections-modal--move"
            role="dialog"
          >
            <header className="wv-collections-modal__header">
              <div>
                <p className="wv-collections-kicker">ORGANIZE YOUR VALLEY</p>
                <h2 id="move-words-title">Move words</h2>
                <p>Choose where the {selectedWords.length} selected words should go.</p>
              </div>
              <button
                aria-label="Close"
                className="wv-collections-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="wv-collections-modal__body">
              <div className="wv-collections-move-list">
                {availableTargets.map((collection) => (
                  <label
                    className="wv-collections-move-option"
                    data-selected={moveTargetId === collection.id || undefined}
                    key={collection.id}
                  >
                    <input
                      checked={moveTargetId === collection.id}
                      name="move-target"
                      onChange={() => setMoveTargetId(collection.id)}
                      type="radio"
                    />
                    <span className="wv-collections-card-marker" data-tone={collection.tone} />
                    <span>
                      <strong>{collection.title}</strong>
                      <small>{collection.wordIds.length} words</small>
                    </span>
                    <span className="wv-collections-radio-indicator" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </div>
            <footer className="wv-collections-modal__footer">
              <span />
              <div className="wv-collections-modal__footer-actions">
                <button
                  className="wv-collections-button wv-collections-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wv-collections-button wv-collections-button--primary"
                  disabled={moveTargetId === undefined}
                  onClick={moveSelectedWords}
                  type="button"
                >
                  Move words
                </button>
              </div>
            </footer>
          </section>
        </div>
      );
    }

    return (
      <div className="wv-collections-modal-layer" role="presentation">
        <button
          aria-label="Close delete confirmation"
          className="wv-collections-modal-backdrop"
          onClick={() => setModal(null)}
          type="button"
        />
        <section
          aria-labelledby="delete-collection-title"
          aria-modal="true"
          className="wv-collections-modal wv-collections-modal--confirm"
          role="alertdialog"
        >
          <div className="wv-collections-danger-mark" aria-hidden="true">!</div>
          <h2 id="delete-collection-title">Delete “{activeCollection?.title}”?</h2>
          <p>
            The collection will be removed, but the vocabulary entries themselves will stay in your Wordbook.
          </p>
          <div className="wv-collections-confirm-actions">
            <button
              className="wv-collections-button wv-collections-button--secondary"
              onClick={() => setModal({ type: "edit" })}
              type="button"
            >
              Keep collection
            </button>
            <button
              className="wv-collections-button wv-collections-button--danger"
              onClick={deleteActiveCollection}
              type="button"
            >
              Delete collection
            </button>
          </div>
        </section>
      </div>
    );
  })();

  if (status === "error") {
    return (
      <div className="route-page route-page--library wv-collections-page">
        <section className="wv-collections-status-card" role="alert">
          <div className="wv-collections-danger-mark" aria-hidden="true">!</div>
          <h1>Collections could not be displayed.</h1>
          <p>{error ?? "Your local vocabulary data could not be loaded."}</p>
        </section>
      </div>
    );
  }

  if (activeCollection !== undefined) {
    return (
      <div className="route-page route-page--library wv-collections-page">
        <main className="wv-collections-surface wv-collections-surface--detail">
          <header className="wv-collections-detail-header">
            <button className="wv-collections-back" onClick={closeCollection} type="button">
              <span aria-hidden="true">←</span>
              Back to collections
            </button>
            <div className="wv-collections-detail-title-row">
              <div>
                <p className="wv-collections-kicker">COLLECTION</p>
                <h1>{activeCollection.title}</h1>
                <p>{activeCollection.description}</p>
              </div>
              <div className="wv-collections-detail-actions">
                <button
                  className="wv-collections-button wv-collections-button--secondary"
                  onClick={() => setModal({ type: "edit" })}
                  type="button"
                >
                  Edit collection
                </button>
                <button
                  className="wv-collections-button wv-collections-button--primary"
                  onClick={() => setModal({ type: "add" })}
                  type="button"
                >
                  <span aria-hidden="true">+</span>
                  Add words
                </button>
              </div>
            </div>
            <div className="wv-collections-detail-meta">
              <span className="wv-collections-card-marker" data-tone={activeCollection.tone} />
              <strong>{activeCollection.wordIds.length}</strong>
              <span>{activeCollection.wordIds.length === 1 ? "word" : "words"}</span>
              <span aria-hidden="true">·</span>
              <span>Saved locally</span>
            </div>
          </header>

          <div className="wv-collections-toolbar wv-collections-toolbar--detail">
            <label className="wv-collections-search">
              <AppIcon name="search" size={20} />
              <input
                onChange={(event) => setWordQuery(event.currentTarget.value)}
                placeholder="Search this collection…"
                ref={searchInputRef}
                value={wordQuery}
              />
            </label>
            <label className="wv-collections-select">
              <span className="visually-hidden">Sort words</span>
              <select
                onChange={(event) => setWordSort(event.currentTarget.value as WordSort)}
                value={wordSort}
              >
                <option value="word">Word A–Z</option>
                <option value="level">CEFR level</option>
              </select>
              <AppIcon name="chevron-down" size={16} />
            </label>
          </div>

          {selectedWords.length > 0 ? (
            <div className="wv-collections-selection-bar">
              <span>
                <strong>{selectedWords.length}</strong> selected
              </span>
              <div>
                <button
                  className="wv-collections-text-button"
                  onClick={() => setSelectedWords([])}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="wv-collections-button wv-collections-button--secondary wv-collections-button--compact"
                  onClick={() => setModal({ type: "move" })}
                  type="button"
                >
                  Move words
                </button>
                <button
                  className="wv-collections-button wv-collections-button--primary wv-collections-button--compact"
                  onClick={() => {
                    void exportSelectedEntries();
                  }}
                  type="button"
                >
                  Export selected
                </button>
              </div>
            </div>
          ) : null}

          <section className="wv-collections-word-list" aria-label={`${activeCollection.title} words`}>
            <div className="wv-collections-word-list__heading" aria-hidden="true">
              <span />
              <span>WORD</span>
              <span>MEANING</span>
              <span>LEVEL</span>
              <span>ADDED</span>
              <span />
            </div>

            {activeEntries.length === 0 ? (
              <div className="wv-collections-inline-empty wv-collections-inline-empty--large">
                <span className="wv-collections-empty-icon" aria-hidden="true">
                  <AppIcon name="bookmark" size={28} />
                </span>
                <strong>{activeCollection.wordIds.length === 0 ? "No words here yet" : "No matching words"}</strong>
                <span>
                  {activeCollection.wordIds.length === 0
                    ? "Add saved words to start building this collection."
                    : "Try a different search inside this collection."}
                </span>
                {activeCollection.wordIds.length === 0 ? (
                  <button
                    className="wv-collections-button wv-collections-button--primary"
                    onClick={() => setModal({ type: "add" })}
                    type="button"
                  >
                    Add your first words
                  </button>
                ) : null}
              </div>
            ) : (
              activeEntries.map((record) => {
                const wordId = record.entry.normalizedWord;
                const selected = selectedWords.includes(wordId);
                const expanded = expandedWord === wordId;
                return (
                  <article
                    className="wv-collections-word-row"
                    data-expanded={expanded || undefined}
                    data-selected={selected || undefined}
                    key={wordId}
                  >
                    <div className="wv-collections-word-row__main">
                      <label className="wv-collections-checkbox-label">
                        <input
                          aria-label={`Select ${record.entry.word}`}
                          checked={selected}
                          onChange={() => toggleSelectedWord(wordId)}
                          type="checkbox"
                        />
                        <span className="wv-collections-checkbox" aria-hidden="true">
                          <AppIcon name="check" size={13} />
                        </span>
                      </label>

                      <button
                        aria-expanded={expanded}
                        className="wv-collections-word-cell wv-collections-word-cell--word"
                        onClick={() => setExpandedWord(expanded ? undefined : wordId)}
                        type="button"
                      >
                        <strong>{record.entry.word}</strong>
                        <small>{record.entry.partsOfSpeech.join(" · ") || "vocabulary"}</small>
                      </button>

                      <button
                        aria-expanded={expanded}
                        className="wv-collections-word-cell wv-collections-word-cell--meaning"
                        onClick={() => setExpandedWord(expanded ? undefined : wordId)}
                        type="button"
                      >
                        {primaryTranslation(record)}
                      </button>

                      <span className="wv-collections-level">
                        <CefrBadge level={record.entry.cefr} showPrefix={false} />
                      </span>
                      <span className="wv-collections-added">Saved</span>
                      <button
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${record.entry.word}`}
                        className="wv-collections-icon-button wv-collections-icon-button--row"
                        onClick={() => setExpandedWord(expanded ? undefined : wordId)}
                        type="button"
                      >
                        {expanded ? "⌃" : "⌄"}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="wv-collections-word-row__expanded">
                        <div className="wv-collections-definition-block">
                          <span>DEFINITION</span>
                          <p>{primaryDefinition(record)}</p>
                        </div>
                        <div className="wv-collections-definition-block">
                          <span>TÜRKÇE ANLAMI</span>
                          <p>{primaryTranslation(record)}</p>
                        </div>
                        <div className="wv-collections-word-actions">
                          <button
                            className="wv-collections-button wv-collections-button--secondary wv-collections-button--compact"
                            onClick={() => navigate(buildVocabularyEntryPath(wordId, "library"))}
                            type="button"
                          >
                            <AppIcon name="book-open" size={16} />
                            Open word
                          </button>
                          <button
                            className="wv-collections-button wv-collections-button--secondary wv-collections-button--compact"
                            onClick={() => removeWordFromCollection(wordId)}
                            type="button"
                          >
                            Remove
                          </button>
                          <button
                            className="wv-collections-button wv-collections-button--secondary wv-collections-button--compact"
                            onClick={() => {
                              setSelectedWords([wordId]);
                              setModal({ type: "move" });
                            }}
                            type="button"
                          >
                            Move to…
                          </button>
                          <button
                            className="wv-collections-button wv-collections-button--secondary wv-collections-button--compact"
                            onClick={() => practiceWord(record.entry.word)}
                            type="button"
                          >
                            Practice word
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        </main>
        {collectionModal}
      </div>
    );
  }

  return (
    <div className="route-page route-page--library wv-collections-page">
      <main className="wv-collections-surface wv-collections-surface--overview">
        <header className="wv-collections-overview-header">
          <div>
            <p className="wv-collections-kicker">YOUR WORD VALLEY</p>
            <h1>Your Collections</h1>
            <p>Group saved words into focused study paths, then return to them whenever you want.</p>
          </div>
          <button
            className="wv-collections-button wv-collections-button--primary"
            onClick={() => setModal({ type: "new" })}
            type="button"
          >
            <span aria-hidden="true">+</span>
            New collection
          </button>
        </header>

        <div className="wv-collections-toolbar">
          <label className="wv-collections-search">
            <AppIcon name="search" size={20} />
            <input
              onChange={(event) => setCollectionQuery(event.currentTarget.value)}
              placeholder="Search collections…"
              ref={searchInputRef}
              value={collectionQuery}
            />
          </label>
          <label className="wv-collections-select">
            <span className="visually-hidden">Sort collections</span>
            <select
              onChange={(event) => setCollectionSort(event.currentTarget.value as CollectionSort)}
              value={collectionSort}
            >
              <option value="recent">Recently studied</option>
              <option value="name">Name A–Z</option>
              <option value="size">Most words</option>
            </select>
            <AppIcon name="chevron-down" size={16} />
          </label>
        </div>

        {status === "loading" && collections.length === 0 ? (
          <section className="wv-collections-empty-state" aria-live="polite">
            <span className="wv-collections-empty-icon" aria-hidden="true">
              <AppIcon name="bookmark" size={28} />
            </span>
            <h2>Loading your collections</h2>
            <p>Gathering the vocabulary saved on this device.</p>
          </section>
        ) : collections.length === 0 ? (
          <section className="wv-collections-empty-state">
            <span className="wv-collections-empty-icon" aria-hidden="true">
              <AppIcon name="bookmark" size={28} />
            </span>
            <h2>Start your first collection</h2>
            <p>Group words by goal, topic, exam, or anything else that helps you remember them.</p>
            <div className="wv-collections-empty-actions">
              <button
                className="wv-collections-button wv-collections-button--primary"
                onClick={() => setModal({ type: "new" })}
                type="button"
              >
                Create a collection
              </button>
              <button
                className="wv-collections-button wv-collections-button--secondary"
                onClick={() => navigate(ROUTE_PATHS.vocabulary)}
                type="button"
              >
                Search a word
              </button>
            </div>
          </section>
        ) : visibleCollections.length === 0 ? (
          <section className="wv-collections-empty-state">
            <span className="wv-collections-empty-icon" aria-hidden="true">
              <AppIcon name="search" size={27} />
            </span>
            <h2>No collection matches</h2>
            <p>Try another search or clear the current query.</p>
            <button
              className="wv-collections-button wv-collections-button--secondary"
              onClick={() => setCollectionQuery("")}
              type="button"
            >
              Clear search
            </button>
          </section>
        ) : (
          <section className="wv-collections-card-grid" aria-label="Your collections">
            {visibleCollections.map((collection) => (
              <article className="wv-collections-card" data-tone={collection.tone} key={collection.id}>
                <button
                  aria-label={`Edit ${collection.title}`}
                  className="wv-collections-icon-button wv-collections-card__menu"
                  onClick={() => {
                    setActiveCollectionId(collection.id);
                    setModal({ type: "edit" });
                  }}
                  type="button"
                >
                  ⋯
                </button>
                <button
                  className="wv-collections-card__open"
                  onClick={() => openCollection(collection.id)}
                  type="button"
                >
                  <span className="wv-collections-card__icon" aria-hidden="true">
                    <AppIcon name="bookmark" size={20} />
                  </span>
                  <span className="wv-collections-card__copy">
                    <strong>{collection.title}</strong>
                    <small>{collection.description}</small>
                  </span>
                  <span className="wv-collections-card__rule" aria-hidden="true" />
                  <span className="wv-collections-card__meta">
                    <span>{collection.wordIds.length} words</span>
                    <span>Saved locally</span>
                  </span>
                  <span className="wv-collections-card__chip">Study collection</span>
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
      {collectionModal}
    </div>
  );
}
