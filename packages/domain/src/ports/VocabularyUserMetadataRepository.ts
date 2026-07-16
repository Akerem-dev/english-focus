import type {
  SaveVocabularyUserMetadataInput,
  VocabularyUserMetadata
} from "../library/VocabularyUserMetadata";

export interface VocabularyUserMetadataRepository {
  listMetadata(): Promise<readonly VocabularyUserMetadata[]>;
  getMetadataByNormalizedWord(normalizedWord: string): Promise<VocabularyUserMetadata | undefined>;
  saveMetadata(input: SaveVocabularyUserMetadataInput): Promise<VocabularyUserMetadata>;
  recordView(normalizedWord: string, viewedAt: string): Promise<VocabularyUserMetadata>;
}
