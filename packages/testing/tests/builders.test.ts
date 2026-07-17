import { vocabularyEntrySchema, vocabularyUserMetadataSchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import {
  VocabularyEntryBuilder,
  VocabularyUserMetadataBuilder,
  createValidVocabularyEntry
} from "../src";

describe("test data builders", () => {
  it("builds fresh schema-valid vocabulary entries", () => {
    const first = createValidVocabularyEntry();
    const second = createValidVocabularyEntry();

    expect(vocabularyEntrySchema.parse(first)).toEqual(first);
    expect(first).not.toBe(second);
    expect(first.examples).not.toBe(second.examples);
    expect(first.examples).toHaveLength(3);
  });

  it("supports deliberate entry overrides without weakening the default contract", () => {
    const entry = new VocabularyEntryBuilder()
      .withWord("preserve")
      .with({ id: "test.preserve.v1", cefr: "C1" })
      .build();

    expect(entry.word).toBe("preserve");
    expect(entry.normalizedWord).toBe("preserve");
    expect(entry.cefr).toBe("C1");
    expect(vocabularyEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("builds user metadata independently from vocabulary content", () => {
    const metadata = new VocabularyUserMetadataBuilder()
      .with({
        favorite: true,
        tags: [
          {
            id: "tag.ielts",
            name: "IELTS",
            normalizedName: "ielts",
            createdAt: "2026-01-01T00:00:00.000Z"
          }
        ],
        note: "Review this usage."
      })
      .build();

    expect(vocabularyUserMetadataSchema.parse(metadata)).toEqual(metadata);
    expect(metadata.favorite).toBe(true);
    expect(metadata.tags.map((tag) => tag.name)).toEqual(["IELTS"]);
  });
});
