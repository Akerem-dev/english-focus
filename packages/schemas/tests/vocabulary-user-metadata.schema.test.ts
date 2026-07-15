import type { VocabularyUserMetadata } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { vocabularyUserMetadataSchema } from "../src/vocabulary";

const timestamp = "2026-07-15T00:00:00.000Z";

function createMetadata(): VocabularyUserMetadata {
  return {
    normalizedWord: "maintain",
    favorite: true,
    tags: [
      {
        id: "tag-ielts",
        name: "IELTS",
        normalizedName: "ielts",
        createdAt: timestamp
      }
    ],
    note: "Use this verb in formal writing.",
    learningStatus: "learning",
    reviewStatus: "validated",
    lastViewedAt: timestamp,
    viewCount: 4,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

describe("vocabularyUserMetadataSchema", () => {
  it("accepts user-owned state stored separately from content", () => {
    expect(vocabularyUserMetadataSchema.safeParse(createMetadata()).success).toBe(true);
  });

  it("rejects invalid learning states and negative view counts", () => {
    const result = vocabularyUserMetadataSchema.safeParse({
      ...createMetadata(),
      learningStatus: "mastered",
      viewCount: -1
    });

    expect(result.success).toBe(false);
  });

  it("does not accept vocabulary content fields", () => {
    const result = vocabularyUserMetadataSchema.safeParse({
      ...createMetadata(),
      meanings: []
    });

    expect(result.success).toBe(false);
  });
});
