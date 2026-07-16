import { describe, expect, it } from "vitest";

import {
  createVocabularyUserMetadata,
  parseVocabularyTags
} from "../../../src/modules/vocabulary/application";

const timestamp = "2026-07-15T00:00:00.000Z";

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

    expect(tags.map((tag) => tag.normalizedName)).toEqual(["ielts", "academic writing", "calisma"]);
  });
});
