export const VOCABULARY_ENTRY_SOURCE_KINDS = ["core", "user", "override"] as const;

export type VocabularyEntrySourceKind = (typeof VOCABULARY_ENTRY_SOURCE_KINDS)[number];

export interface VocabularyEntrySource {
  kind: VocabularyEntrySourceKind;
  sourceId?: string | undefined;
  sourceLabel?: string | undefined;
}
