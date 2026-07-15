import type { VocabularyUserMetadata } from "@platform/domain";

export function toggleVocabularyFavorite(
  metadata: VocabularyUserMetadata,
  updatedAt: string
): VocabularyUserMetadata {
  return Object.freeze({
    ...metadata,
    favorite: !metadata.favorite,
    updatedAt
  });
}
