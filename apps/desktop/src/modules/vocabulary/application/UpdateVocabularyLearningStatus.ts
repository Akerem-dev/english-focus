import type { LearningStatus, VocabularyUserMetadata } from "@platform/domain";

export function updateVocabularyLearningStatus(
  metadata: VocabularyUserMetadata,
  learningStatus: LearningStatus,
  updatedAt: string
): VocabularyUserMetadata {
  return Object.freeze({ ...metadata, learningStatus, updatedAt });
}
