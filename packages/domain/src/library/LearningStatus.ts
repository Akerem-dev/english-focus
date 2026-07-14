export const LEARNING_STATUSES = ["new", "learning", "known"] as const;

export type LearningStatus = (typeof LEARNING_STATUSES)[number];
