import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import { compareDuplicateEntries } from "../../../src/modules/import-export";

function createUserMaintain() {
  return createValidVocabularyEntry({
    id: "user.maintain.cp13-test",
    source: {
      kind: "user",
      sourceId: "cp13-test",
      sourceLabel: "CP13 test import"
    },
    generation: {
      method: "external-ai",
      generatedAt: "2026-07-15T00:00:00.000Z",
      validationStatus: "unvalidated",
      generatorLabel: "CP13 test fixture",
      warnings: []
    },
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  });
}

describe("compareDuplicateEntries", () => {
  it("returns a new-entry result when the normalized word is absent", () => {
    const entry = createValidVocabularyEntry({
      id: "user.allocate.cp13-test",
      word: "allocate",
      normalizedWord: "allocate",
      morphology: { baseForm: "allocate", inflectedForms: [] },
      aliases: [],
      examples: createValidVocabularyEntry().examples.map((example, index) => ({
        ...example,
        id: `allocate-example-${index + 1}`,
        sentenceEn: `They allocate the available budget in example ${index + 1}.`,
        targetForm: "allocate the budget"
      })),
      source: { kind: "user" },
      generation: {
        method: "external-ai",
        generatedAt: "2026-07-15T00:00:00.000Z",
        validationStatus: "unvalidated",
        warnings: []
      }
    });

    expect(compareDuplicateEntries(createCoreVocabularyContentSource(), entry)).toMatchObject({
      kind: "new-entry",
      imported: {
        entry: { normalizedWord: "allocate" }
      }
    });
  });

  it("builds an immutable side-by-side comparison for a duplicate", () => {
    const result = compareDuplicateEntries(
      createCoreVocabularyContentSource(),
      createUserMaintain()
    );

    expect(result.kind).toBe("duplicate");
    if (result.kind === "duplicate") {
      expect(result.comparison.normalizedWord).toBe("maintain");
      expect(result.comparison.existing.layer).toBe("core");
      expect(result.comparison.imported.layer).toBe("user");
      expect(result.comparison.fields.map((item) => item.id)).toEqual([
        "cefr",
        "meanings",
        "examples",
        "pronunciations",
        "wordForms",
        "usage",
        "etymology",
        "source"
      ]);
      expect(result.comparison.differingFieldCount).toBeGreaterThan(0);
      expect(Object.isFrozen(result.comparison)).toBe(true);
      expect(Object.isFrozen(result.comparison.fields)).toBe(true);
    }
  });
});
