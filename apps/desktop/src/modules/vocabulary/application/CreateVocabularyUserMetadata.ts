import type { VocabularyUserMetadata } from "@platform/domain";

export function createVocabularyUserMetadata(
  normalizedWord: string,
  timestamp: string
): VocabularyUserMetadata {
  return Object.freeze({
    normalizedWord,
    favorite: false,
    tags: Object.freeze([]),
    note: "",
    learningStatus: "new",
    reviewStatus: "reviewed",
    viewCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}
