import type { VocabularyEntry } from "@platform/domain";

export interface VocabularyEntryExport {
  readonly fileName: string;
  readonly json: string;
}

export function exportVocabularyEntry(entry: VocabularyEntry): VocabularyEntryExport {
  return {
    fileName: `${entry.normalizedWord}.english-focus.vocabulary.json`,
    json: `${JSON.stringify(entry, null, 2)}\n`
  };
}
