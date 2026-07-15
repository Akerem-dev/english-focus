import type { LearningStatus } from "./LearningStatus";
import type { ReviewStatus } from "./ReviewStatus";
import type { Tag } from "./Tag";

/** User-owned state stored separately from replaceable vocabulary content. */
export interface VocabularyUserMetadata {
  normalizedWord: string;
  favorite: boolean;
  tags: readonly Tag[];
  note: string;
  learningStatus: LearningStatus;
  reviewStatus: ReviewStatus;
  lastViewedAt?: string | undefined;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveVocabularyUserMetadataInput {
  normalizedWord: string;
  favorite: boolean;
  tags: readonly Tag[];
  note: string;
  learningStatus: LearningStatus;
  reviewStatus: ReviewStatus;
  lastViewedAt?: string | undefined;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
