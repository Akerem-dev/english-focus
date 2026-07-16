import type { VocabularyEntry } from "../vocabulary/VocabularyEntry";

export type VocabularyStorageLayer = "user" | "override";

export interface StoredVocabularyEntry {
  readonly entry: VocabularyEntry;
  readonly layer: VocabularyStorageLayer;
}

export interface SaveVocabularyEntryInput {
  readonly entry: VocabularyEntry;
  readonly layer: VocabularyStorageLayer;
}

/**
 * Persistence boundary for user-owned vocabulary content.
 * Core vocabulary stays immutable and is layered with these stored records by the application.
 */
export interface VocabularyRepository {
  listEntries(): Promise<readonly StoredVocabularyEntry[]>;
  getEntryByNormalizedWord(normalizedWord: string): Promise<StoredVocabularyEntry | undefined>;
  saveEntry(input: SaveVocabularyEntryInput): Promise<StoredVocabularyEntry>;
  saveEntries(
    inputs: readonly SaveVocabularyEntryInput[]
  ): Promise<readonly StoredVocabularyEntry[]>;
}
