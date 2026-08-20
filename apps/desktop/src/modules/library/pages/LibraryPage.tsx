import { useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from "react";

import { APP_COMMAND_EVENT, type AppCommandEventDetail } from "../../../app/command-bar";
import {
  type PersistedCollection,
  useCollectionsRepository,
  useFileTransfer,
  useToast,
  useVocabularyMetadata,
  useVocabularyRepository
} from "../../../app/providers";
import valleyBackground from "../../../assets/background/home-background-static.png";
import { CefrBadge } from "../../../components";
import { AppIcon } from "../../../design-system";
import { exportVocabularyPack } from "../../import-export";
import { matchesSearch, type LibraryRecord } from "../application/libraryRecords";

type CollectionTone = "gold" | "sage" | "pine" | "rose" | "blue" | "sand";
type CollectionSort = "recent" | "name" | "size";
type WordSort = "word" | "level";
type CoverPreset = "ridge" | "lake" | "cottage" | "meadow" | "forest" | "sunrise";

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
  readonly coverPreset: CoverPreset;
  readonly coverImage?: string | undefined;
  readonly wordIds: readonly string[];
}

interface CollectionPreset {
  readonly title: string;
  readonly description: string;
  readonly tone: CollectionTone;
  readonly coverPreset: CoverPreset;
}

const COLLECTION_TONES: readonly CollectionTone[] = Object.freeze([
  "gold",
  "sage",
  "pine",
  "rose",
  "blue",
  "sand"
]);

const COVER_PRESETS: readonly CoverPreset[] = Object.freeze([
  "ridge",
  "lake",
  "cottage",
  "meadow",
  "forest",
  "sunrise"
]);

const COLLECTION_PRESETS: readonly CollectionPreset[] = Object.freeze([
  {
    title: "IELTS Vocabulary",
    description: "High-value words for reading, writing, speaking, and listening.",
    tone: "gold",
    coverPreset: "ridge"
  },
  {
    title: "Academic Writing",
    description: "Formal vocabulary for essays, reports, and academic arguments.",
    tone: "sage",
    coverPreset: "lake"
  },
  {
    title: "Work & Business",
    description: "Useful language for meetings, projects, and professional communication.",
    tone: "pine",
    coverPreset: "cottage"
  },
  {
    title: "Daily Communication",
    description: "Natural everyday vocabulary worth keeping close at hand.",
    tone: "rose",
    coverPreset: "meadow"
  },
  {
    title: "Study & Review",
    description: "Words you want to revisit during focused study sessions.",
    tone: "blue",
    coverPreset: "forest"
  },
  {
    title: "Useful Expressions",
    description: "Memorable words and expressions collected for real-world use.",
    tone: "sand",
    coverPreset: "sunrise"
  }
]);

const COVER_OPTIONS: readonly {
  readonly id: CoverPreset;
  readonly label: string;
  readonly tone: CollectionTone;
}[] = Object.freeze([
  { id: "ridge", label: "Mountain ridge", tone: "gold" },
  { id: "lake", label: "Lakeside", tone: "blue" },
  { id: "cottage", label: "Valley cottage", tone: "pine" },
  { id: "meadow", label: "Wild meadow", tone: "rose" },
  { id: "forest", label: "Forest path", tone: "sage" },
  { id: "sunrise", label: "Morning light", tone: "sand" }
]);

const SORT_LABELS: Readonly<Record<CollectionSort, string>> = Object.freeze({
  recent: "Recently studied",
  name: "Name A–Z",
  size: "Most words"
});

function primaryTranslation(record: LibraryRecord): string {
  const values = record.entry.meanings.flatMap((meaning) => meaning.translationsTr);
  return values.slice(0, 3).join(", ") || "Meaning coming soon";
}

function primaryDefinition(record: LibraryRecord): string {
  return (
    record.entry.meanings[0]?.definitionEn ??
    "This word is ready for a definition when you revisit it."
  );
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

function restoreCollections(
  storedCollections: readonly PersistedCollection[],
  recordByWord: ReadonlyMap<string, LibraryRecord>
): CollectionModel[] {
  const seenIds = new Set<string>();

  return storedCollections.flatMap((stored) => {
    const id = stored.id.trim();
    const title = stored.title.trim();
    if (id.length === 0 || title.length === 0 || seenIds.has(id)) {
      return [];
    }
    seenIds.add(id);

    const tone = COLLECTION_TONES.includes(stored.tone as CollectionTone)
      ? (stored.tone as CollectionTone)
      : "gold";
    const coverPreset = COVER_PRESETS.includes(stored.coverPreset as CoverPreset)
      ? (stored.coverPreset as CoverPreset)
      : "ridge";
    const wordIds = Array.from(
      new Set(stored.wordIds.filter((wordId) => recordByWord.has(wordId)))
    );

    return [
      {
        id,
        title,
        description: stored.description,
        tone,
        coverPreset,
        ...(stored.coverImage === undefined ? {} : { coverImage: stored.coverImage }),
        wordIds
      }
    ];
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

function collectionCoverStyle(coverImage: string | undefined): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(8,47,41,.03), rgba(8,47,41,.28)), url("${coverImage ?? valleyBackground}")`
  };
}

export function LibraryPage() {
  const { contentSource, error, status, storedEntries } = useVocabularyRepository();
  const { getMetadata } = useVocabularyMetadata();
  const { showToast } = useToast();
  const { exporter } = useFileTransfer();
  const collectionsRepository = useCollectionsRepository();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const persistenceEnabledRef = useRef(false);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const [collections, setCollections] = useState<readonly CollectionModel[]>([]);
  const [collectionsReady, setCollectionsReady] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string>();
  const [viewingWordId, setViewingWordId] = useState<string>();
  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [wordQuery, setWordQuery] = useState("");
  const [wordSort, setWordSort] = useState<WordSort>("word");
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([]);
  const [rowMenuWord, setRowMenuWord] = useState<string>();
  const [modal, setModal] = useState<ModalState>(null);
  const [modalQuery, setModalQuery] = useState("");
  const [modalWordSelection, setModalWordSelection] = useState<readonly string[]>([]);
  const [moveTargetId, setMoveTargetId] = useState<string>();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftTone, setDraftTone] = useState<CollectionTone>("gold");
  const [draftCoverPreset, setDraftCoverPreset] = useState<CoverPreset>("ridge");
  const [draftCoverImage, setDraftCoverImage] = useState<string>();

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
    if (collectionsReady || libraryEntries.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const storedState = await collectionsRepository.getState();
        const nextCollections =
          storedState === undefined
            ? createSeedCollections(libraryEntries)
            : restoreCollections(storedState.collections, recordByWord);

        if (cancelled) {
          return;
        }

        persistenceEnabledRef.current = true;
        setCollections(nextCollections);
        setCollectionsReady(true);
      } catch (cause) {
        if (cancelled) {
          return;
        }

        persistenceEnabledRef.current = false;
        setCollections(createSeedCollections(libraryEntries));
        setCollectionsReady(true);
        showToast({
          title: "Saved collections couldn’t be loaded",
          message:
            cause instanceof Error
              ? cause.message
              : "Collections are available for this session, but changes will not be saved until storage is available.",
          tone: "error",
          dedupeKey: "collections-persistence-load"
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collectionsReady, collectionsRepository, libraryEntries, recordByWord, showToast]);

  useEffect(() => {
    if (!collectionsReady || !persistenceEnabledRef.current) {
      return;
    }

    const snapshot = {
      version: 1 as const,
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        tone: collection.tone,
        coverPreset: collection.coverPreset,
        ...(collection.coverImage === undefined ? {} : { coverImage: collection.coverImage }),
        wordIds: [...collection.wordIds]
      }))
    };

    persistQueueRef.current = persistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await collectionsRepository.saveState(snapshot);
      })
      .catch((cause) => {
        showToast({
          title: "Collections couldn’t be saved",
          message:
            cause instanceof Error
              ? cause.message
              : "Your latest collection changes may be lost when the app closes.",
          tone: "error",
          dedupeKey: "collections-persistence-save"
        });
      });
  }, [collections, collectionsReady, collectionsRepository, showToast]);

  const activeCollection = useMemo(
    () => collections.find((collection) => collection.id === activeCollectionId),
    [activeCollectionId, collections]
  );

  const viewingRecord = useMemo(
    () => (viewingWordId === undefined ? undefined : recordByWord.get(viewingWordId)),
    [recordByWord, viewingWordId]
  );

  const visibleCollections = useMemo(() => {
    const normalizedQuery = collectionQuery.trim().toLocaleLowerCase();
    const matching = normalizedQuery
      ? collections.filter((collection) =>
          `${collection.title} ${collection.description}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)
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
      .filter((record) =>
        matchesSearch(record, getMetadata(record.entry.normalizedWord), wordQuery)
      );

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
        title: "Your words are ready",
        message: `${libraryEntries.length} words were exported.`,
        tone: "success",
        dedupeKey: "library-export"
      });
    } catch (cause) {
      showToast({
        title: "Export didn’t work",
        message: cause instanceof Error ? cause.message : "Please try again.",
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
        title: "Selected words are ready",
        message: `${selectedEntries.length} word${selectedEntries.length === 1 ? "" : "s"} exported.`,
        tone: "success",
        dedupeKey: "library-export-selected"
      });
    } catch (cause) {
      showToast({
        title: "Export didn’t work",
        message: cause instanceof Error ? cause.message : "Please try again.",
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

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setModalQuery("");
      setModalWordSelection([]);
      setMoveTargetId(undefined);

      if (modal.type === "new") {
        setDraftTitle("");
        setDraftDescription("");
        setDraftTone("gold");
        setDraftCoverPreset("ridge");
        setDraftCoverImage(undefined);
        return;
      }

      if (modal.type === "edit" && activeCollection !== undefined) {
        setDraftTitle(activeCollection.title);
        setDraftDescription(activeCollection.description);
        setDraftTone(activeCollection.tone);
        setDraftCoverPreset(activeCollection.coverPreset);
        setDraftCoverImage(activeCollection.coverImage);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeCollection, modal]);

  function openCollection(collectionId: string) {
    setActiveCollectionId(collectionId);
    setViewingWordId(undefined);
    setWordQuery("");
    setSelectedWords([]);
    setRowMenuWord(undefined);
  }

  function closeCollection() {
    setActiveCollectionId(undefined);
    setViewingWordId(undefined);
    setWordQuery("");
    setSelectedWords([]);
    setRowMenuWord(undefined);
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

  function selectCover(preset: CoverPreset) {
    const option = COVER_OPTIONS.find((candidate) => candidate.id === preset);
    setDraftCoverPreset(preset);
    setDraftTone(option?.tone ?? "gold");
    setDraftCoverImage(undefined);
  }

  function handleCoverUpload(file: File | undefined) {
    if (file === undefined) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast({
        title: "Choose an image",
        message: "PNG, JPG, WEBP, or another image format works best.",
        tone: "error"
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast({
        title: "That image is a little large",
        message: "Choose an image under 4 MB for a smoother collection cover.",
        tone: "info"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftCoverImage(reader.result);
        showToast({
          title: "Cover added",
          message: "Your image is ready to use.",
          tone: "success",
          dedupeKey: "collection-cover"
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function createCollection() {
    const title = draftTitle.trim();
    if (title.length === 0) {
      return;
    }

    const collection: CollectionModel = {
      id: `custom-${Date.now()}`,
      title,
      description:
        draftDescription.trim() || "A collection for words you want to remember together.",
      tone: draftTone,
      coverPreset: draftCoverPreset,
      coverImage: draftCoverImage,
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
                draftDescription.trim() || "A collection for words you want to remember together.",
              tone: draftTone,
              coverPreset: draftCoverPreset,
              coverImage: draftCoverImage
            }
          : collection
      )
    );
    setModal(null);
    showToast({
      title: "Collection updated",
      message: `${draftTitle.trim()} is ready.`,
      tone: "success",
      dedupeKey: "collection-edit"
    });
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
      message: `${modalWordSelection.length} word${modalWordSelection.length === 1 ? "" : "s"} joined ${activeCollection.title}.`,
      tone: "success",
      dedupeKey: "collection-add-words"
    });
  }

  function removeWordFromCollection(wordId: string) {
    if (activeCollection === undefined) {
      return;
    }

    const collectionId = activeCollection.id;
    const collectionTitle = activeCollection.title;
    const originalIndex = activeCollection.wordIds.indexOf(wordId);
    const wordLabel = recordByWord.get(wordId)?.entry.word ?? wordId;

    setCollections((current) =>
      current.map((collection) =>
        collection.id === collectionId
          ? { ...collection, wordIds: collection.wordIds.filter((id) => id !== wordId) }
          : collection
      )
    );
    setSelectedWords((current) => current.filter((id) => id !== wordId));
    setRowMenuWord(undefined);
    if (viewingWordId === wordId) {
      setViewingWordId(undefined);
    }

    showToast({
      title: `Removed “${wordLabel}”`,
      message: `Removed from ${collectionTitle}.`,
      tone: "info",
      durationMs: 8_000,
      dedupeKey: `collection-remove-${wordId}`,
      action: {
        label: "Undo",
        onAction: () => {
          setCollections((current) =>
            current.map((collection) => {
              if (collection.id !== collectionId || collection.wordIds.includes(wordId)) {
                return collection;
              }
              const restored = [...collection.wordIds];
              restored.splice(Math.max(0, Math.min(originalIndex, restored.length)), 0, wordId);
              return { ...collection, wordIds: restored };
            })
          );
        }
      }
    });
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

    const target = collections.find((collection) => collection.id === moveTargetId);
    const movedCount = selectedWords.length;

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
    setViewingWordId(undefined);
    setRowMenuWord(undefined);
    setModal(null);
    showToast({
      title: "Words moved",
      message: `${movedCount} word${movedCount === 1 ? "" : "s"} moved to ${target?.title ?? "the collection"}.`,
      tone: "success",
      dedupeKey: "collection-move"
    });
  }

  function deleteActiveCollection() {
    if (activeCollection === undefined) {
      return;
    }

    const title = activeCollection.title;
    setCollections((current) =>
      current.filter((collection) => collection.id !== activeCollection.id)
    );
    setModal(null);
    closeCollection();
    showToast({
      title: "Collection deleted",
      message: `${title} was removed. Your words are still available elsewhere.`,
      tone: "info",
      dedupeKey: "collection-delete"
    });
  }

  const collectionModal = (() => {
    if (modal === null) {
      return null;
    }

    if (modal.type === "new" || modal.type === "edit") {
      const editing = modal.type === "edit";
      return (
        <div className="wvc-modal-layer" role="presentation">
          <button
            aria-label="Close collection editor"
            className="wvc-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="collection-editor-title"
            aria-modal="true"
            className="wvc-modal wvc-modal--editor"
            role="dialog"
          >
            <header className="wvc-modal__header">
              <div>
                <p className="wvc-eyebrow">{editing ? "MAKE IT YOURS" : "A NEW PLACE TO GROW"}</p>
                <h2 id="collection-editor-title">
                  {editing ? "Edit collection" : "New collection"}
                </h2>
                <p>
                  {editing
                    ? "Refresh the cover, name, or description."
                    : "Give this collection a look and a purpose of its own."}
                </p>
              </div>
              <button
                aria-label="Close"
                className="wvc-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="wvc-modal__body wvc-editor-grid">
              <div className="wvc-cover-studio">
                <div
                  className="wvc-cover-preview"
                  data-cover={draftCoverPreset}
                  style={collectionCoverStyle(draftCoverImage)}
                >
                  <div>
                    <span>{draftTitle.trim() || "Your collection"}</span>
                    <small>
                      {draftDescription.trim() || "A place for words worth remembering."}
                    </small>
                  </div>
                </div>
                <div className="wvc-cover-studio__heading">
                  <span>Choose a Valley view</span>
                  <button
                    className="wvc-text-link"
                    onClick={() => coverInputRef.current?.click()}
                    type="button"
                  >
                    <AppIcon name="image" size={15} /> Upload image
                  </button>
                </div>
                <div className="wvc-cover-gallery">
                  {COVER_OPTIONS.map((option) => (
                    <button
                      aria-label={option.label}
                      aria-pressed={draftCoverImage === undefined && draftCoverPreset === option.id}
                      className="wvc-cover-choice"
                      data-cover={option.id}
                      key={option.id}
                      onClick={() => selectCover(option.id)}
                      style={collectionCoverStyle(undefined)}
                      type="button"
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  accept="image/*"
                  className="visually-hidden"
                  onChange={(event) => handleCoverUpload(event.currentTarget.files?.[0])}
                  ref={coverInputRef}
                  type="file"
                />
              </div>

              <div className="wvc-editor-fields">
                <label className="wvc-field">
                  <span>Collection name</span>
                  <input
                    autoFocus
                    onChange={(event) => setDraftTitle(event.currentTarget.value)}
                    placeholder="e.g. Academic Writing"
                    value={draftTitle}
                  />
                </label>
                <label className="wvc-field">
                  <span>Short description</span>
                  <textarea
                    onChange={(event) => setDraftDescription(event.currentTarget.value)}
                    placeholder="What do you want to remember here?"
                    rows={5}
                    value={draftDescription}
                  />
                </label>
                <p className="wvc-editor-note">
                  Tip: a clear name and a memorable cover make collections easier to find later.
                </p>
              </div>
            </div>

            <footer className="wvc-modal__footer">
              {editing ? (
                <button
                  className="wvc-danger-link"
                  onClick={() => setModal({ type: "delete" })}
                  type="button"
                >
                  Delete collection
                </button>
              ) : (
                <span />
              )}
              <div>
                <button
                  className="wvc-button wvc-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wvc-button wvc-button--primary"
                  disabled={draftTitle.trim().length === 0}
                  onClick={editing ? saveCollectionChanges : createCollection}
                  type="button"
                >
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
        <div className="wvc-modal-layer" role="presentation">
          <button
            aria-label="Close add words dialog"
            className="wvc-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="add-words-title"
            aria-modal="true"
            className="wvc-modal wvc-modal--words"
            role="dialog"
          >
            <header className="wvc-modal__header">
              <div>
                <p className="wvc-eyebrow">GROW THIS COLLECTION</p>
                <h2 id="add-words-title">Add words</h2>
                <p>Pick words you already know you want together.</p>
              </div>
              <button
                aria-label="Close"
                className="wvc-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="wvc-modal__body">
              <label className="wvc-search wvc-search--modal">
                <AppIcon name="search" size={18} />
                <input
                  autoFocus
                  onChange={(event) => setModalQuery(event.currentTarget.value)}
                  placeholder="Find a word…"
                  value={modalQuery}
                />
              </label>
              <div className="wvc-pick-list">
                {addableEntries.length === 0 ? (
                  <div className="wvc-inline-empty">
                    <strong>No matching words</strong>
                    <span>Try another search.</span>
                  </div>
                ) : (
                  addableEntries.map((record) => {
                    const checked = modalWordSelection.includes(record.entry.normalizedWord);
                    return (
                      <label className="wvc-pick-row" key={record.entry.normalizedWord}>
                        <input
                          checked={checked}
                          onChange={() => toggleModalWord(record.entry.normalizedWord)}
                          type="checkbox"
                        />
                        <span className="wvc-checkbox" aria-hidden="true">
                          <AppIcon name="check" size={13} />
                        </span>
                        <span>
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
            <footer className="wvc-modal__footer">
              <span className="wvc-selection-copy">{modalWordSelection.length} selected</span>
              <div>
                <button
                  className="wvc-button wvc-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wvc-button wvc-button--primary"
                  disabled={modalWordSelection.length === 0}
                  onClick={addWordsToCollection}
                  type="button"
                >
                  Add words
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
        <div className="wvc-modal-layer" role="presentation">
          <button
            aria-label="Close move words dialog"
            className="wvc-modal-backdrop"
            onClick={() => setModal(null)}
            type="button"
          />
          <section
            aria-labelledby="move-words-title"
            aria-modal="true"
            className="wvc-modal wvc-modal--move"
            role="dialog"
          >
            <header className="wvc-modal__header">
              <div>
                <p className="wvc-eyebrow">A NEW HOME</p>
                <h2 id="move-words-title">Move {selectedWords.length === 1 ? "word" : "words"}</h2>
                <p>Choose the collection that fits best.</p>
              </div>
              <button
                aria-label="Close"
                className="wvc-icon-button"
                onClick={() => setModal(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="wvc-modal__body">
              <div className="wvc-move-list">
                {availableTargets.map((collection) => (
                  <label
                    className="wvc-move-option"
                    data-selected={moveTargetId === collection.id || undefined}
                    key={collection.id}
                  >
                    <input
                      checked={moveTargetId === collection.id}
                      name="move-target"
                      onChange={() => setMoveTargetId(collection.id)}
                      type="radio"
                    />
                    <span
                      className="wvc-move-option__cover"
                      data-cover={collection.coverPreset}
                      style={collectionCoverStyle(collection.coverImage)}
                    />
                    <span>
                      <strong>{collection.title}</strong>
                      <small>{collection.wordIds.length} words</small>
                    </span>
                    <span className="wvc-radio" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </div>
            <footer className="wvc-modal__footer">
              <span />
              <div>
                <button
                  className="wvc-button wvc-button--secondary"
                  onClick={() => setModal(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="wvc-button wvc-button--primary"
                  disabled={moveTargetId === undefined}
                  onClick={moveSelectedWords}
                  type="button"
                >
                  Move here
                </button>
              </div>
            </footer>
          </section>
        </div>
      );
    }

    return (
      <div className="wvc-modal-layer" role="presentation">
        <button
          aria-label="Close delete confirmation"
          className="wvc-modal-backdrop"
          onClick={() => setModal(null)}
          type="button"
        />
        <section
          aria-labelledby="delete-collection-title"
          aria-modal="true"
          className="wvc-modal wvc-modal--confirm"
          role="alertdialog"
        >
          <div className="wvc-danger-mark" aria-hidden="true">
            !
          </div>
          <h2 id="delete-collection-title">Delete “{activeCollection?.title}”?</h2>
          <p>The collection will disappear, but its words will remain in Word Valley.</p>
          <div>
            <button
              className="wvc-button wvc-button--secondary"
              onClick={() => setModal({ type: "edit" })}
              type="button"
            >
              Keep collection
            </button>
            <button
              className="wvc-button wvc-button--danger"
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
      <div className="wvc-page">
        <div className="wvc-scene" style={{ backgroundImage: `url("${valleyBackground}")` }} />
        <section className="wvc-status" role="alert">
          <div className="wvc-danger-mark">!</div>
          <h1>Collections couldn’t open</h1>
          <p>{error ?? "Please try again in a moment."}</p>
        </section>
      </div>
    );
  }

  if (activeCollection !== undefined && viewingRecord !== undefined) {
    const entry = viewingRecord.entry;
    const pronunciation = entry.pronunciations[0]?.ipa;
    const example = entry.examples[0];
    return (
      <div className="wvc-page wvc-page--word">
        <div className="wvc-scene" style={{ backgroundImage: `url("${valleyBackground}")` }} />
        <div className="wvc-mist" />
        <main className="wvc-shell wvc-shell--word">
          <button className="wvc-back" onClick={() => setViewingWordId(undefined)} type="button">
            ← {activeCollection.title}
          </button>
          <section className="wvc-word-detail">
            <header className="wvc-word-hero">
              <div>
                <p className="wvc-eyebrow">IN {activeCollection.title.toUpperCase()}</p>
                <h1>{entry.word}</h1>
                <div className="wvc-word-meta">
                  {pronunciation ? <span>{pronunciation}</span> : null}
                  <CefrBadge level={entry.cefr} showPrefix={false} />
                  {entry.partsOfSpeech[0] ? <span>{entry.partsOfSpeech[0]}</span> : null}
                </div>
              </div>
              <button
                className="wvc-button wvc-button--secondary"
                onClick={() => removeWordFromCollection(entry.normalizedWord)}
                type="button"
              >
                Remove from collection
              </button>
            </header>
            <div className="wvc-word-grid">
              <article className="wvc-word-panel wvc-word-panel--definition">
                <span className="wvc-section-label">MEANING</span>
                <h2>{primaryDefinition(viewingRecord)}</h2>
                <p className="wvc-translation">{primaryTranslation(viewingRecord)}</p>
              </article>
              <article className="wvc-word-panel">
                <span className="wvc-section-label">NATURAL EXAMPLE</span>
                {example ? (
                  <>
                    <blockquote>“{example.sentenceEn}”</blockquote>
                    <p>{example.translationTr}</p>
                  </>
                ) : (
                  <p>Open this word again after adding an example you want to remember.</p>
                )}
              </article>
              <article className="wvc-word-panel wvc-word-panel--note">
                <span className="wvc-section-label">WHY IT’S HERE</span>
                <p>
                  Keep this word in {activeCollection.title} when it belongs to the idea, topic, or
                  goal you’re studying.
                </p>
                <div className="wvc-word-actions">
                  <button
                    className="wvc-soft-action"
                    onClick={() => {
                      setSelectedWords([entry.normalizedWord]);
                      setModal({ type: "move" });
                    }}
                    type="button"
                  >
                    <AppIcon name="arrow-right" size={16} /> Move to another collection
                  </button>
                  <button
                    className="wvc-soft-action"
                    onClick={() =>
                      showToast({
                        title: `Practice ${entry.word}`,
                        message: "This word will be ready when the Practice space opens.",
                        tone: "info",
                        dedupeKey: `practice-${entry.normalizedWord}`
                      })
                    }
                    type="button"
                  >
                    <AppIcon name="edit" size={16} /> Practice this word
                  </button>
                </div>
              </article>
            </div>
          </section>
        </main>
        {collectionModal}
      </div>
    );
  }

  if (activeCollection !== undefined) {
    return (
      <div className="wvc-page wvc-page--detail">
        <div className="wvc-scene" style={{ backgroundImage: `url("${valleyBackground}")` }} />
        <div className="wvc-mist" />
        <main className="wvc-shell wvc-shell--detail">
          <button className="wvc-back" onClick={closeCollection} type="button">
            ← Back to collections
          </button>
          <section className="wvc-collection-hero">
            <div
              className="wvc-collection-hero__cover"
              data-cover={activeCollection.coverPreset}
              style={collectionCoverStyle(activeCollection.coverImage)}
            />
            <div className="wvc-collection-hero__copy">
              <p className="wvc-eyebrow">YOUR COLLECTION</p>
              <h1>{activeCollection.title}</h1>
              <p>{activeCollection.description}</p>
              <span>{activeCollection.wordIds.length} words</span>
            </div>
            <div className="wvc-collection-hero__actions">
              <button
                className="wvc-button wvc-button--secondary"
                onClick={() => setModal({ type: "edit" })}
                type="button"
              >
                Edit
              </button>
              <button
                className="wvc-button wvc-button--primary"
                onClick={() => setModal({ type: "add" })}
                type="button"
              >
                <span>+</span> Add words
              </button>
            </div>
          </section>

          <div className="wvc-toolbar">
            <label className="wvc-search">
              <AppIcon name="search" size={19} />
              <input
                aria-label="Search words in collection"
                onChange={(event) => setWordQuery(event.currentTarget.value)}
                placeholder="Find a word in this collection…"
                ref={searchInputRef}
                value={wordQuery}
              />
            </label>
            <div className="wvc-segmented" role="group" aria-label="Sort words">
              <button
                aria-pressed={wordSort === "word"}
                onClick={() => setWordSort("word")}
                type="button"
              >
                A–Z
              </button>
              <button
                aria-pressed={wordSort === "level"}
                onClick={() => setWordSort("level")}
                type="button"
              >
                Level
              </button>
            </div>
          </div>

          {selectedWords.length > 0 ? (
            <div className="wvc-selection-bar">
              <span>
                <strong>{selectedWords.length}</strong> selected
              </span>
              <div>
                <button
                  className="wvc-text-link"
                  onClick={() => setSelectedWords([])}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="wvc-button wvc-button--secondary wvc-button--compact"
                  onClick={() => setModal({ type: "move" })}
                  type="button"
                >
                  Move
                </button>
                <button
                  className="wvc-button wvc-button--primary wvc-button--compact"
                  onClick={() => {
                    void exportSelectedEntries();
                  }}
                  type="button"
                >
                  Export
                </button>
              </div>
            </div>
          ) : null}

          <section className="wvc-word-list" aria-label={`${activeCollection.title} words`}>
            <div className="wvc-word-list__head">
              <span />
              <span>WORD</span>
              <span>MEANING</span>
              <span>LEVEL</span>
              <span />
            </div>
            {activeEntries.length === 0 ? (
              <div className="wvc-inline-empty wvc-inline-empty--large">
                <span className="wvc-empty-icon">
                  <AppIcon name="bookmark" size={26} />
                </span>
                <strong>
                  {activeCollection.wordIds.length === 0
                    ? "This collection is waiting for its first word"
                    : "No words match that search"}
                </strong>
                <p>
                  {activeCollection.wordIds.length === 0
                    ? "Add a few words and make this collection yours."
                    : "Try a different search."}
                </p>
                {activeCollection.wordIds.length === 0 ? (
                  <button
                    className="wvc-button wvc-button--primary"
                    onClick={() => setModal({ type: "add" })}
                    type="button"
                  >
                    Add words
                  </button>
                ) : null}
              </div>
            ) : (
              activeEntries.map((record) => {
                const wordId = record.entry.normalizedWord;
                const selected = selectedWords.includes(wordId);
                return (
                  <article
                    className="wvc-word-row"
                    data-selected={selected || undefined}
                    key={wordId}
                  >
                    <label className="wvc-checkbox-label">
                      <input
                        aria-label={`Select ${record.entry.word}`}
                        checked={selected}
                        onChange={() => toggleSelectedWord(wordId)}
                        type="checkbox"
                      />
                      <span className="wvc-checkbox">
                        <AppIcon name="check" size={13} />
                      </span>
                    </label>
                    <button
                      className="wvc-word-open"
                      onClick={() => setViewingWordId(wordId)}
                      type="button"
                    >
                      <strong>{record.entry.word}</strong>
                      <small>{record.entry.partsOfSpeech[0] ?? "word"}</small>
                    </button>
                    <button
                      className="wvc-word-meaning"
                      onClick={() => setViewingWordId(wordId)}
                      type="button"
                    >
                      {primaryTranslation(record)}
                    </button>
                    <CefrBadge level={record.entry.cefr} showPrefix={false} />
                    <div className="wvc-row-menu-wrap">
                      <button
                        aria-expanded={rowMenuWord === wordId}
                        aria-label={`More actions for ${record.entry.word}`}
                        className="wvc-icon-button wvc-icon-button--row"
                        onClick={() =>
                          setRowMenuWord((current) => (current === wordId ? undefined : wordId))
                        }
                        type="button"
                      >
                        ⋯
                      </button>
                      {rowMenuWord === wordId ? (
                        <div className="wvc-row-menu">
                          <button
                            onClick={() => {
                              setViewingWordId(wordId);
                              setRowMenuWord(undefined);
                            }}
                            type="button"
                          >
                            <AppIcon name="book-open" size={15} /> View word
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWords([wordId]);
                              setRowMenuWord(undefined);
                              setModal({ type: "move" });
                            }}
                            type="button"
                          >
                            <AppIcon name="arrow-right" size={15} /> Move to…
                          </button>
                          <button
                            className="wvc-row-menu__danger"
                            onClick={() => removeWordFromCollection(wordId)}
                            type="button"
                          >
                            Remove from collection
                          </button>
                        </div>
                      ) : null}
                    </div>
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
    <div className="wvc-page wvc-page--overview">
      <div className="wvc-scene" style={{ backgroundImage: `url("${valleyBackground}")` }} />
      <div className="wvc-mist" />
      <main className="wvc-shell wvc-shell--overview">
        <header className="wvc-overview-header">
          <div>
            <p className="wvc-eyebrow">YOUR WORD VALLEY</p>
            <h1>Your Collections</h1>
            <p>Create memorable places for the words you want to learn together.</p>
          </div>
          <button
            className="wvc-button wvc-button--primary"
            onClick={() => setModal({ type: "new" })}
            type="button"
          >
            <span>+</span> New collection
          </button>
        </header>

        <div className="wvc-toolbar wvc-toolbar--overview">
          <label className="wvc-search">
            <AppIcon name="search" size={19} />
            <input
              aria-label="Search collections"
              onChange={(event) => setCollectionQuery(event.currentTarget.value)}
              placeholder="Search collections…"
              ref={searchInputRef}
              value={collectionQuery}
            />
          </label>
          <div className="wvc-sort-wrap">
            <button
              aria-expanded={sortOpen}
              className="wvc-sort-button"
              onClick={() => setSortOpen((current) => !current)}
              type="button"
            >
              <span>{SORT_LABELS[collectionSort]}</span>
              <AppIcon name="chevron-down" size={15} />
            </button>
            {sortOpen ? (
              <div className="wvc-sort-menu">
                {(Object.keys(SORT_LABELS) as CollectionSort[]).map((sort) => (
                  <button
                    aria-checked={collectionSort === sort}
                    key={sort}
                    onClick={() => {
                      setCollectionSort(sort);
                      setSortOpen(false);
                    }}
                    role="menuitemradio"
                    type="button"
                  >
                    <span>{SORT_LABELS[sort]}</span>
                    {collectionSort === sort ? <AppIcon name="check" size={15} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {!collectionsReady || (status === "loading" && collections.length === 0) ? (
          <section className="wvc-empty">
            <span className="wvc-empty-icon">
              <AppIcon name="bookmark" size={28} />
            </span>
            <h2>Gathering your collections…</h2>
          </section>
        ) : collections.length === 0 ? (
          <section className="wvc-empty">
            <span className="wvc-empty-icon">
              <AppIcon name="bookmark" size={28} />
            </span>
            <h2>Make your first collection</h2>
            <p>Choose a cover, give it a name, and start gathering words.</p>
            <button
              className="wvc-button wvc-button--primary"
              onClick={() => setModal({ type: "new" })}
              type="button"
            >
              Create collection
            </button>
          </section>
        ) : visibleCollections.length === 0 ? (
          <section className="wvc-search-empty">
            <span className="wvc-empty-icon">
              <AppIcon name="search" size={25} />
            </span>
            <div>
              <h2>No collections found</h2>
              <p>Try another name or clear your search.</p>
            </div>
            <button className="wvc-text-link" onClick={() => setCollectionQuery("")} type="button">
              Clear search
            </button>
          </section>
        ) : (
          <section className="wvc-card-grid" aria-label="Your collections">
            {visibleCollections.map((collection) => (
              <article className="wvc-card" data-tone={collection.tone} key={collection.id}>
                <button
                  aria-label={`Edit ${collection.title}`}
                  className="wvc-card__menu wvc-icon-button"
                  onClick={() => {
                    setActiveCollectionId(collection.id);
                    setModal({ type: "edit" });
                  }}
                  type="button"
                >
                  ⋯
                </button>
                <button
                  className="wvc-card__open"
                  onClick={() => openCollection(collection.id)}
                  type="button"
                >
                  <span
                    className="wvc-card__cover"
                    data-cover={collection.coverPreset}
                    style={collectionCoverStyle(collection.coverImage)}
                  >
                    <span>{collection.wordIds.length} words</span>
                  </span>
                  <span className="wvc-card__body">
                    <strong>{collection.title}</strong>
                    <small>{collection.description}</small>
                    <span className="wvc-card__footer">
                      <span>Explore collection</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </span>
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
