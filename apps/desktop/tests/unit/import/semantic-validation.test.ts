import type { VocabularyEntry } from "@platform/domain";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { validateVocabularySemantics } from "../../../src/modules/import-export";

function createExternalEntry(overrides: Partial<VocabularyEntry> = {}): VocabularyEntry {
  return createValidVocabularyEntry({
    source: {
      kind: "user",
      sourceId: "manual-test",
      sourceLabel: "External AI import"
    },
    generation: {
      method: "external-ai",
      generatedAt: "2026-01-01T00:00:00.000Z",
      validationStatus: "unvalidated",
      generatorLabel: "External AI",
      warnings: []
    },
    ...overrides
  });
}

describe("validateVocabularySemantics", () => {
  it("accepts a target-aligned external AI entry", () => {
    const result = validateVocabularySemantics(createExternalEntry(), "maintain");

    expect(result.kind).toBe("success");
    expect(result.issues).toEqual([]);
  });

  it("blocks a target-word mismatch", () => {
    const result = validateVocabularySemantics(createExternalEntry(), "allocate");

    expect(result.kind).toBe("failure");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "target_word_mismatch", pathText: "normalizedWord" })
      ])
    );
  });

  it("requires external import provenance and an unvalidated status", () => {
    const result = validateVocabularySemantics(
      createExternalEntry({
        source: { kind: "core" },
        generation: {
          method: "core-pack",
          generatedAt: "2026-01-01T00:00:00.000Z",
          validationStatus: "reviewed",
          warnings: []
        }
      }),
      "maintain"
    );

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "external_import_source_kind",
        "external_import_generation_method",
        "premature_validation_status"
      ])
    );
  });

  it("detects normalized word and morphology inconsistencies", () => {
    const result = validateVocabularySemantics(
      createExternalEntry({
        word: "Maintenance",
        normalizedWord: "maintain",
        morphology: {
          baseForm: "maintenance",
          inflectedForms: []
        }
      }),
      "maintain"
    );

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["word_normalization_mismatch", "base_form_mismatch"])
    );
  });

  it("detects duplicate aliases and an alias that repeats the base word", () => {
    const result = validateVocabularySemantics(
      createExternalEntry({ aliases: ["maintain", "maintained", "Maintained"] }),
      "maintain"
    );

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["alias_matches_base_word", "duplicate_alias"])
    );
  });

  it("requires bilingual optional fields to be paired", () => {
    const entry = createExternalEntry();
    const result = validateVocabularySemantics(
      {
        ...entry,
        meanings: [
          {
            ...entry.meanings[0]!,
            usageNoteEn: "Used with standards.",
            usageNoteTr: undefined
          }
        ],
        collocations: [
          {
            phrase: "maintain standards",
            translationTr: "standartları korumak",
            registers: ["neutral"],
            exampleEn: "Teams maintain standards."
          }
        ]
      },
      "maintain"
    );

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unpaired_meaning_usage_note", "unpaired_collocation_example"])
    );
  });

  it("blocks primary examples that omit the target and duplicate another example", () => {
    const entry = createExternalEntry();
    const examples = entry.examples.map((example) => ({ ...example }));
    examples[0] = {
      ...examples[0]!,
      sentenceEn: "The team follows standard number one."
    };
    examples[1] = {
      ...examples[1]!,
      sentenceEn: examples[2]!.sentenceEn
    };

    const result = validateVocabularySemantics({ ...entry, examples }, "maintain");

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["primary_example_missing_target", "duplicate_primary_example"])
    );
  });

  it("blocks self-references, inconsistent timestamps, and identical mistake forms", () => {
    const result = validateVocabularySemantics(
      createExternalEntry({
        wordFamily: [
          {
            word: "maintain",
            normalizedWord: "maintain",
            partOfSpeech: "verb",
            relation: "root"
          }
        ],
        relatedWords: [
          {
            word: "maintain",
            normalizedWord: "maintain",
            relationship: "related"
          }
        ],
        commonMistakes: [
          {
            incorrect: "maintain standards",
            correct: "Maintain standards",
            explanationEn: "Capitalization alone is not a meaningful learner correction here.",
            explanationTr:
              "Yalnızca büyük harf farkı burada anlamlı bir öğrenci düzeltmesi değildir."
          }
        ],
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z"
      }),
      "maintain"
    );

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "word_family_self_reference",
        "related_word_self_reference",
        "identical_mistake_forms",
        "timestamp_order"
      ])
    );
  });
  it("keeps external-AI provenance strict but relaxes transfer-only provenance for packs", () => {
    const transferredEntry = {
      ...createExternalEntry(),
      source: {
        ...createExternalEntry().source,
        kind: "core" as const
      },
      generation: {
        ...createExternalEntry().generation,
        method: "manual" as const,
        validationStatus: "reviewed" as const
      }
    };

    const externalResult = validateVocabularySemantics(transferredEntry, "maintain");
    const packResult = validateVocabularySemantics(
      transferredEntry,
      "maintain",
      "vocabulary-pack-transfer"
    );

    expect(externalResult.kind).toBe("failure");
    expect(packResult.kind).toBe("success");
  });

});
