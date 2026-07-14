import type { VocabularyEntry } from "@platform/domain";

import { VocabularyEntryBuilder } from "../builders/VocabularyEntryBuilder";

/** Creates a fresh valid entry so tests never share mutable fixture state. */
export function createValidVocabularyEntry(
  overrides: Partial<VocabularyEntry> = {}
): VocabularyEntry {
  return new VocabularyEntryBuilder().with(overrides).build();
}

export const validVocabularyEntry: VocabularyEntry = createValidVocabularyEntry();
