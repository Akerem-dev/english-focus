import { vocabularyEntrySchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../src/content";

describe("canonical maintain vocabulary entry", () => {
  it("satisfies the complete versioned vocabulary schema", () => {
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
    expect(maintainVocabularyEntry.grammar.patterns.length).toBeGreaterThan(0);
    expect(maintainVocabularyEntry.grammar.prepositionPatterns.length).toBeGreaterThan(0);
    expect(maintainVocabularyEntry.collocations.length).toBeGreaterThan(0);
    expect(maintainVocabularyEntry.commonMistakes.length).toBeGreaterThan(0);
    expect(maintainVocabularyEntry.generation.validationStatus).toBe("reviewed");
  });

  it("does not fabricate phrasal verbs or idioms for maintain", () => {
    expect(maintainVocabularyEntry.phrasalVerbs).toEqual([]);
    expect(maintainVocabularyEntry.idioms).toEqual([]);
  });
});
