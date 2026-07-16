import type { VocabularyEntry } from "@platform/domain";

import { maintainVocabularyEntry } from "./entries";
import { pilotCoreVocabularyEntries } from "./pilotCoreVocabularyEntries";

/**
 * Immutable 100-entry pilot catalog bundled with English Focus V1.
 * User entries, overrides, notes, tags, and learning metadata remain separate in SQLite.
 */
export const coreVocabularyEntries: readonly VocabularyEntry[] = Object.freeze(
  [maintainVocabularyEntry, ...pilotCoreVocabularyEntries].sort((left, right) =>
    left.normalizedWord.localeCompare(right.normalizedWord, "en", { sensitivity: "base" })
  )
);
