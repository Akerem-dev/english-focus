import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../src/content";
import {
  ValidatedVocabularyContentSource,
  createCoreVocabularyContentSource
} from "../../src/infrastructure/content";

describe("ValidatedVocabularyContentSource", () => {
  it("exposes the canonical entry through read-only lookup methods", () => {
    const source = createCoreVocabularyContentSource();

    expect(source.listEntries()).toHaveLength(100);
    expect(source.getEntryById("core.maintain.v1")).toStrictEqual(maintainVocabularyEntry);
    expect(source.getEntryByNormalizedWord("maintain")).toStrictEqual(maintainVocabularyEntry);
    expect(source.getEntryByNormalizedWord("reliable")?.word).toBe("reliable");
    expect(source.getEntryByNormalizedWord("unknown")).toBeUndefined();
  });

  it("freezes validated content deeply", () => {
    const source = createCoreVocabularyContentSource();
    const entry = source.getEntryByNormalizedWord("maintain");

    expect(Object.isFrozen(source.listEntries())).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry?.examples)).toBe(true);
    expect(Object.isFrozen(entry?.examples[0])).toBe(true);
  });

  it("rejects invalid or duplicate catalog entries before exposing them", () => {
    const invalidEntry = {
      ...structuredClone(maintainVocabularyEntry),
      examples: maintainVocabularyEntry.examples.slice(0, 9)
    };
    const duplicateWord = {
      ...structuredClone(maintainVocabularyEntry),
      id: "core.maintain.duplicate"
    };

    expect(() => new ValidatedVocabularyContentSource([invalidEntry])).toThrow(
      /Vocabulary content entry 1 is invalid/
    );
    expect(
      () => new ValidatedVocabularyContentSource([maintainVocabularyEntry, duplicateWord])
    ).toThrow(/Duplicate normalized vocabulary word 'maintain'/);
  });
});
