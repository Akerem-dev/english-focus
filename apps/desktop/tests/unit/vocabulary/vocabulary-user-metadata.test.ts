import { describe, expect, it } from "vitest";

import {
  createVocabularyUserMetadata,
  parseVocabularyTags,
  toggleVocabularyFavorite,
  updateVocabularyLearningStatus,
  updateVocabularyUserNote
} from "../../../src/modules/vocabulary/application";

const timestamp = "2026-07-15T00:00:00.000Z";
const later = "2026-07-15T01:00:00.000Z";

describe("vocabulary user metadata operations", () => {
  it("creates a local-only default metadata record", () => {
    const metadata = createVocabularyUserMetadata("maintain", timestamp);

    expect(metadata.normalizedWord).toBe("maintain");
    expect(metadata.favorite).toBe(false);
    expect(metadata.learningStatus).toBe("new");
    expect(metadata.reviewStatus).toBe("reviewed");
  });

  it("normalizes and deduplicates comma-separated tags", () => {
    const tags = parseVocabularyTags("IELTS, Academic Writing, ielts, Çalışma", timestamp);

    expect(tags.map((tag) => tag.normalizedName)).toEqual([
      "ielts",
      "academic writing",
      "calisma"
    ]);
  });

  it("updates favorite, learning status, and note without replacing content", () => {
    const initial = createVocabularyUserMetadata("maintain", timestamp);
    const favorite = toggleVocabularyFavorite(initial, later);
    const learning = updateVocabularyLearningStatus(favorite, "learning", later);
    const noted = updateVocabularyUserNote(learning, "Use with standards and conditions.", later);

    expect(noted.favorite).toBe(true);
    expect(noted.learningStatus).toBe("learning");
    expect(noted.note).toContain("standards");
    expect(noted.normalizedWord).toBe("maintain");
  });

  it("rejects notes above the local safety limit", () => {
    const initial = createVocabularyUserMetadata("maintain", timestamp);
    expect(() => updateVocabularyUserNote(initial, "x".repeat(5_001), later)).toThrow(
      "5,000"
    );
  });
});
