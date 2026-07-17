import { vocabularyEntrySchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../src/content";

describe("canonical maintain vocabulary entry", () => {
  it("satisfies the simplified versioned vocabulary schema", () => {
    expect(vocabularyEntrySchema.parse(maintainVocabularyEntry)).toEqual(maintainVocabularyEntry);
    expect(maintainVocabularyEntry.schemaVersion).toBe("1.0.0");
    expect(maintainVocabularyEntry.normalizedWord).toBe("maintain");
    expect(maintainVocabularyEntry.cefr).toBe("B2");
  });

  it("contains the required reviewed learning content", () => {
    expect(maintainVocabularyEntry.meanings.length).toBeGreaterThanOrEqual(4);
    expect(maintainVocabularyEntry.examples).toHaveLength(3);
    expect(
      maintainVocabularyEntry.examples.every((example) => example.translationTr.length > 0)
    ).toBe(true);
    expect(maintainVocabularyEntry.morphology.inflectedForms.map((form) => form.form)).toEqual(
      expect.arrayContaining(["maintains", "maintained", "maintaining"])
    );
    expect(maintainVocabularyEntry.grammar.summaryEn.length).toBeGreaterThan(20);
    expect(maintainVocabularyEntry.grammar.summaryTr.length).toBeGreaterThan(20);
    expect(maintainVocabularyEntry.pronunciations.length).toBeGreaterThan(0);
    expect(maintainVocabularyEntry.generation.validationStatus).toBe("reviewed");
  });

  it("contains no removed supporting-content properties", () => {
    expect(maintainVocabularyEntry).not.toHaveProperty("wordFamily");
    expect(maintainVocabularyEntry).not.toHaveProperty("collocations");
    expect(maintainVocabularyEntry).not.toHaveProperty("relatedWords");
    expect(maintainVocabularyEntry).not.toHaveProperty("commonMistakes");
    expect(maintainVocabularyEntry.grammar).toEqual({
      summaryEn: maintainVocabularyEntry.grammar.summaryEn,
      summaryTr: maintainVocabularyEntry.grammar.summaryTr
    });
  });
});
