import type {
  StoredVocabularyEntry,
  VocabularyContentSource,
  VocabularyEntry
} from "@platform/domain";

/**
 * Presents stored user/override entries in front of immutable core content.
 * A stored normalized word shadows the core record without mutating the core pack.
 */
export class LayeredVocabularyContentSource implements VocabularyContentSource {
  private readonly entries: readonly VocabularyEntry[];
  private readonly byId: ReadonlyMap<string, VocabularyEntry>;
  private readonly byNormalizedWord: ReadonlyMap<string, VocabularyEntry>;

  constructor(
    coreSource: VocabularyContentSource,
    storedEntries: readonly StoredVocabularyEntry[]
  ) {
    const storedByWord = new Map(
      storedEntries.map((record) => [record.entry.normalizedWord, record.entry] as const)
    );
    const visibleCoreEntries = coreSource
      .listEntries()
      .filter((entry) => !storedByWord.has(entry.normalizedWord));
    const entries = [...storedEntries.map((record) => record.entry), ...visibleCoreEntries];

    this.entries = Object.freeze(entries);
    this.byId = new Map(entries.map((entry) => [entry.id, entry] as const));
    this.byNormalizedWord = new Map(entries.map((entry) => [entry.normalizedWord, entry] as const));
  }

  listEntries(): readonly VocabularyEntry[] {
    return this.entries;
  }

  getEntryById(entryId: string): VocabularyEntry | undefined {
    return this.byId.get(entryId);
  }

  getEntryByNormalizedWord(normalizedWord: string): VocabularyEntry | undefined {
    return this.byNormalizedWord.get(normalizedWord);
  }
}
