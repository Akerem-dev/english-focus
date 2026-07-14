import type { VocabularyEntry } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { vocabularyEntryJsonSchema, vocabularyEntrySchema } from "../src/vocabulary";

function createValidEntry(): VocabularyEntry {
  const timestamp = "2026-07-15T00:00:00.000Z";

  return {
    schemaVersion: "1.0.0",
    id: "word-maintain",
    word: "maintain",
    normalizedWord: "maintain",
    aliases: [],
    pronunciations: [{ ipa: "/meɪnˈteɪn/", variant: "general" }],
    cefr: "B1",
    registers: ["neutral"],
    partsOfSpeech: ["verb"],
    meanings: [
      {
        id: "meaning-1",
        partOfSpeech: "verb",
        definitionEn: "To make something continue at the same level or standard.",
        translationsTr: ["sürdürmek", "korumak"],
        registers: ["neutral"]
      }
    ],
    morphology: {
      baseForm: "maintain",
      inflectedForms: [
        { form: "maintains", normalizedForm: "maintains", type: "third-person-singular" },
        { form: "maintained", normalizedForm: "maintained", type: "past" },
        { form: "maintaining", normalizedForm: "maintaining", type: "present-participle" }
      ]
    },
    wordFamily: [],
    grammar: {
      summaryEn: "A transitive verb commonly followed by a noun phrase.",
      summaryTr: "Genellikle bir isim öbeğiyle kullanılan geçişli bir fiildir.",
      patterns: [],
      tenseExamples: [],
      sentenceForms: [],
      prepositionPatterns: []
    },
    collocations: [],
    phrasalVerbs: [],
    idioms: [],
    relatedWords: [],
    commonMistakes: [],
    examples: Array.from({ length: 10 }, (_, index) => ({
      id: `example-${index + 1}`,
      sentenceEn: `They maintain the system carefully in example ${index + 1}.`,
      translationTr: `Sistemi ${index + 1}. örnekte dikkatlice sürdürüyorlar.`,
      registers: ["neutral"] as const,
      grammarLabel: "present simple",
      targetForm: "maintain"
    })),
    source: { kind: "user", sourceLabel: "External AI paste" },
    generation: {
      method: "external-ai",
      generatedAt: timestamp,
      validationStatus: "schema-valid",
      warnings: []
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

describe("vocabularyEntrySchema", () => {
  it("accepts a complete V1 entry with exactly ten primary examples", () => {
    const result = vocabularyEntrySchema.safeParse(createValidEntry());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examples).toHaveLength(10);
      expect(result.data.grammar.patterns).toEqual([]);
    }
  });

  it("rejects entries that do not contain exactly ten primary examples", () => {
    const entry = createValidEntry();
    const result = vocabularyEntrySchema.safeParse({
      ...entry,
      examples: entry.examples.slice(0, 9)
    });

    expect(result.success).toBe(false);
  });

  it("rejects undeclared meaning parts of speech", () => {
    const entry = createValidEntry();
    const result = vocabularyEntrySchema.safeParse({
      ...entry,
      meanings: [{ ...entry.meanings[0], partOfSpeech: "noun" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "partsOfSpeech")).toBe(true);
    }
  });

  it("rejects duplicate primary example identifiers", () => {
    const entry = createValidEntry();
    const result = vocabularyEntrySchema.safeParse({
      ...entry,
      examples: entry.examples.map((example, index) =>
        index === 1 ? { ...example, id: "example-1" } : example
      )
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown top-level properties", () => {
    const result = vocabularyEntrySchema.safeParse({
      ...createValidEntry(),
      apiProvider: "not-allowed"
    });

    expect(result.success).toBe(false);
  });

  it("exports a reusable JSON Schema representation", () => {
    expect(vocabularyEntryJsonSchema).toMatchObject({
      type: "object",
      additionalProperties: false
    });
    expect(vocabularyEntryJsonSchema.properties).toHaveProperty("schemaVersion");
    expect(vocabularyEntryJsonSchema.properties).toHaveProperty("examples");
  });
});
