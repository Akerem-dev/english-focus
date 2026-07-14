import type { VocabularyEntry } from "../vocabulary";

/**
 * Read-only access to validated vocabulary content.
 *
 * Core content is intentionally separated from user-owned persistence. The source
 * exposes no mutation methods, so replacing or refreshing core entries cannot
 * overwrite favorites, notes, tags, or study state.
 */
export interface VocabularyContentSource {
  listEntries(): readonly VocabularyEntry[];
  getEntryById(entryId: string): VocabularyEntry | undefined;
  getEntryByNormalizedWord(normalizedWord: string): VocabularyEntry | undefined;
}
