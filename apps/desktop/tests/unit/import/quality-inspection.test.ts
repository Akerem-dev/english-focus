import type { VocabularyEntry } from "@platform/domain";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content/core";
import { assessVocabularyQuality } from "../../../src/modules/import-export";

function createSparseEntry(overrides: Partial<VocabularyEntry> = {}): VocabularyEntry {
  return createValidVocabularyEntry({
    wordFamily: [],
    etymology: undefined,
    grammar: {
      summaryEn: "Maintain is used as a verb.",
      summaryTr: "Maintain fiil olarak kullanılır.",
      patterns: [],
      tenseExamples: [],
      sentenceForms: [],
      prepositionPatterns: []
    },
    collocations: [],
    relatedWords: [],
    commonMistakes: [],
    examples: createValidVocabularyEntry().examples.map((example) => ({
      id: example.id,
      sentenceEn: example.sentenceEn,
      translationTr: example.translationTr,
      registers: example.registers
    })),
    ...overrides
  });
}

describe("assessVocabularyQuality", () => {
  it("keeps quality warnings non-blocking", () => {
    const result = assessVocabularyQuality(createSparseEntry());

    expect(result.kind).toBe("warnings");
    expect(result.issues.every((issue) => issue.severity === "warning")).toBe(true);
    expect(result.issues.every((issue) => issue.source === "quality")).toBe(true);
  });

  it("reports missing learning-support sections without requiring fabricated content", () => {
    const result = assessVocabularyQuality(createSparseEntry());
    const codes = result.issues.map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "single_meaning_only",
        "missing_etymology",
        "missing_word_family",
        "missing_grammar_patterns",
        "missing_tense_examples",
        "missing_sentence_forms",
        "limited_collocations",
        "limited_related_words",
        "missing_common_mistakes"
      ])
    );
  });

  it("reports missing primary-example annotations", () => {
    const result = assessVocabularyQuality(createSparseEntry());

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "examples_lack_grammar_labels",
        "examples_lack_target_forms",
        "examples_lack_context"
      ])
    );
  });

  it("surfaces generator warnings as local quality warnings", () => {
    const entry = createSparseEntry({
      generation: {
        method: "external-ai",
        generatedAt: "2026-01-01T00:00:00.000Z",
        validationStatus: "unvalidated",
        warnings: ["Etymology could not be verified."]
      }
    });
    const result = assessVocabularyQuality(entry);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "generator_warning",
          pathText: "generation.warnings[0]"
        })
      ])
    );
  });

  it("accepts the reviewed maintain entry as quality-complete", () => {
    const result = assessVocabularyQuality(maintainVocabularyEntry);

    expect(result.kind).toBe("clean");
    expect(result.issues).toEqual([]);
  });
});
