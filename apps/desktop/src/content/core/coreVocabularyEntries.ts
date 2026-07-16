import type { VocabularyEntry } from "@platform/domain";

import { maintainVocabularyEntry } from "./entries";

/**
 * Immutable editorially reviewed catalog bundled with English Focus V1.
 * User entries, overrides, notes, tags, and learning metadata remain separate in SQLite.
 */
export const coreVocabularyEntries: readonly VocabularyEntry[] = Object.freeze([
  maintainVocabularyEntry
]);
