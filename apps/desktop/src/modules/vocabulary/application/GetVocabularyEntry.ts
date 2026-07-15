import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";

export interface GetVocabularyEntryRequest {
  readonly normalizedWord: string;
}

/**
 * Read-only vocabulary lookup use case.
 * Query normalization and alias resolution intentionally arrive in the search checkpoint.
 */
export class GetVocabularyEntry {
  constructor(private readonly contentSource: VocabularyContentSource) {}

  execute({ normalizedWord }: GetVocabularyEntryRequest): VocabularyEntry | undefined {
    return this.contentSource.getEntryByNormalizedWord(normalizedWord);
  }
}
