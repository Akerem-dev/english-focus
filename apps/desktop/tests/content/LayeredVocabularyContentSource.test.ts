import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  createCoreVocabularyContentSource,
  LayeredVocabularyContentSource
} from "../../src/infrastructure/content";

describe("LayeredVocabularyContentSource", () => {
  it("adds user entries in front of immutable core content", () => {
    const allocate = createValidVocabularyEntry({
      id: "user.allocate.persistence-test",
      word: "allocate",
      normalizedWord: "allocate",
      source: { kind: "user" }
    });
    const source = new LayeredVocabularyContentSource(createCoreVocabularyContentSource(), [
      { entry: allocate, layer: "user" }
    ]);

    expect(source.getEntryByNormalizedWord("allocate")?.id).toBe(allocate.id);
    expect(source.getEntryByNormalizedWord("maintain")?.normalizedWord).toBe("maintain");
    const words = source.listEntries().map((entry) => entry.normalizedWord);
    expect(words).toHaveLength(101);
    expect(words[0]).toBe("allocate");
    expect(words).toContain("maintain");
    expect(words).toContain("reliable");
  });

  it("lets an override shadow the core entry without duplicating the normalized word", () => {
    const override = createValidVocabularyEntry({
      id: "override.maintain.persistence-test",
      word: "maintain",
      normalizedWord: "maintain",
      source: { kind: "override" }
    });
    const source = new LayeredVocabularyContentSource(createCoreVocabularyContentSource(), [
      { entry: override, layer: "override" }
    ]);

    expect(source.getEntryByNormalizedWord("maintain")?.id).toBe(override.id);
    expect(source.listEntries()).toHaveLength(100);
  });
});
