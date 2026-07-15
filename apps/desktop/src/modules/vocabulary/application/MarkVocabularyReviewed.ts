import type { ReviewStatus, VocabularyUserMetadata } from "@platform/domain";

export function updateVocabularyReviewStatus(
  metadata: VocabularyUserMetadata,
  reviewStatus: ReviewStatus,
  updatedAt: string
): VocabularyUserMetadata {
  return Object.freeze({ ...metadata, reviewStatus, updatedAt });
}
