import { vocabularyEntrySchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import {
  coreVocabularyEntries,
  coreVocabularyManifest,
  pilotCoreVocabularyEntries
} from "../../src/content";
import {
  assessVocabularyQuality,
  validateVocabularySemantics
} from "../../src/modules/import-export";

const allowedWarningCodes = new Set(coreVocabularyManifest.qualityPolicy.allowedWarningCodes);

describe("100-entry pilot core vocabulary pack", () => {
  it("matches the versioned manifest and contains unique deterministic records", () => {
    expect(coreVocabularyEntries).toHaveLength(100);
    expect(pilotCoreVocabularyEntries).toHaveLength(99);
    expect(coreVocabularyManifest.entryCount).toBe(100);
    expect(new Set(coreVocabularyEntries.map((entry) => entry.id)).size).toBe(100);
    expect(new Set(coreVocabularyEntries.map((entry) => entry.normalizedWord)).size).toBe(100);
    expect(coreVocabularyEntries.map((entry) => entry.normalizedWord)).toEqual(
      coreVocabularyManifest.words
    );
  });

  it("passes the strict vocabulary schema and semantic consistency checks", () => {
    for (const entry of coreVocabularyEntries) {
      expect(vocabularyEntrySchema.parse(entry)).toEqual(entry);

      const result = validateVocabularySemantics(
        entry,
        entry.normalizedWord,
        "vocabulary-pack-transfer"
      );

      expect(result.kind, entry.normalizedWord).toBe("success");
    }
  });

  it("keeps pilot completeness warnings inside the declared editorial boundary", () => {
    for (const entry of pilotCoreVocabularyEntries) {
      const quality = assessVocabularyQuality(entry);
      const issues = quality.kind === "warnings" ? quality.issues : [];

      expect(issues.length, entry.normalizedWord).toBeLessThanOrEqual(
        coreVocabularyManifest.qualityPolicy.maxWarningsPerPilotEntry
      );
      expect(
        issues.every((issue) => allowedWarningCodes.has(issue.code)),
        entry.normalizedWord
      ).toBe(true);
    }
  });

  it("contains useful bilingual examples for the manual review sample", () => {
    for (const word of coreVocabularyManifest.qualityPolicy.manualSampleWords) {
      const entry = coreVocabularyEntries.find((candidate) => candidate.normalizedWord === word);

      expect(entry, word).toBeDefined();
      expect(entry?.examples).toHaveLength(10);
      expect(entry?.meanings[0]?.definitionEn.length).toBeGreaterThan(20);
      expect(entry?.meanings[0]?.translationsTr[0]?.length).toBeGreaterThan(2);
      expect(entry?.examples.every((example) => example.translationTr.length > 5)).toBe(true);
    }
  });
});
