import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { vocabularyPackSchema } from "../src";

function createPack(entries = [createValidVocabularyEntry()]) {
  return {
    kind: "english-focus-vocabulary-pack",
    packVersion: "1.0.0",
    schemaVersion: "1.0.0",
    createdAt: "2026-07-16T12:00:00.000Z",
    entryCount: entries.length,
    entries
  };
}

describe("vocabularyPackSchema", () => {
  it("accepts a versioned pack whose count matches its entries", () => {
    expect(vocabularyPackSchema.safeParse(createPack()).success).toBe(true);
  });

  it("rejects count mismatches and duplicate normalized words", () => {
    const entry = createValidVocabularyEntry();
    const result = vocabularyPackSchema.safeParse({
      ...createPack([entry, entry]),
      entryCount: 1
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining(["entryCount", "entries.1.normalizedWord"])
      );
    }
  });
});
