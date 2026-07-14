export const REVIEW_STATUSES = ["imported", "validated", "reviewed"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
