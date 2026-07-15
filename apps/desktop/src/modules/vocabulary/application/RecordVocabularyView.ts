import type { VocabularyUserMetadata } from "@platform/domain";

export function recordVocabularyView(
  metadata: VocabularyUserMetadata,
  viewedAt: string
): VocabularyUserMetadata {
  return Object.freeze({
    ...metadata,
    lastViewedAt: viewedAt,
    viewCount: metadata.viewCount + 1,
    updatedAt: viewedAt
  });
}
