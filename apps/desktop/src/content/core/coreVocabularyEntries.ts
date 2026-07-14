import type { VocabularyEntry } from "@platform/domain";

import { maintainVocabularyEntry } from "./entries";

/**
 * Small deterministic catalog for the current checkpoint.
 * The same boundary will later load the versioned 5,000-entry core pack.
 */
export const coreVocabularyEntries: readonly VocabularyEntry[] = Object.freeze([
  maintainVocabularyEntry
]);
