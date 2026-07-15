import type { ImportIssue } from "@platform/domain";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { previewVocabularyImport } from "../../../src/modules/import-export";

const warning: ImportIssue = {
  source: "quality",
  severity: "warning",
  code: "missing_etymology",
  path: ["etymology"],
  pathText: "etymology",
  message: "No reliable etymology is included."
};

function createUserEntry() {
  return createValidVocabularyEntry({
    source: {
      kind: "user",
      sourceId: "cp12-test",
      sourceLabel: "CP12 preview fixture"
    },
    generation: {
      method: "external-ai",
      generatedAt: "2026-01-01T00:00:00.000Z",
      validationStatus: "unvalidated",
      generatorLabel: "Manual CP12 fixture",
      warnings: []
    }
  });
}

describe("previewVocabularyImport", () => {
  it("creates an immutable final review model without saving the entry", () => {
    const entry = createUserEntry();
    const preview = previewVocabularyImport(entry, "maintain", [warning]);

    expect(preview.entry).toBe(entry);
    expect(preview.expectedWord).toBe("maintain");
    expect(preview.primaryTranslation).toBe("sürdürmek, korumak");
    expect(preview.counts.examples).toBe(10);
    expect(preview.counts.meanings).toBe(1);
    expect(preview.qualityWarnings).toEqual([warning]);
    expect(preview.checklist).toHaveLength(5);
    expect(preview.checklist.map((item) => item.id)).toEqual([
      "identity",
      "schema",
      "semantics",
      "examples",
      "provenance"
    ]);
    expect(Object.isFrozen(preview)).toBe(true);
    expect(Object.isFrozen(preview.counts)).toBe(true);
    expect(Object.isFrozen(preview.qualityWarnings)).toBe(true);
  });

  it("summarizes optional supporting content without inventing missing sections", () => {
    const entry = createUserEntry();
    const preview = previewVocabularyImport(entry, "maintain", []);

    expect(preview.counts.grammarPatterns).toBe(0);
    expect(preview.counts.tenseExamples).toBe(0);
    expect(preview.counts.sentenceForms).toBe(0);
    expect(preview.counts.prepositionPatterns).toBe(0);
    expect(preview.counts.collocations).toBe(0);
    expect(preview.counts.wordFamily).toBe(1);
    expect(preview.counts.relatedWords).toBe(0);
    expect(preview.counts.commonMistakes).toBe(0);
  });
});
