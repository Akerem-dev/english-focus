import { vocabularyEntrySchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import { coreVocabularyEntries, coreVocabularyManifest } from "../../src/content";
import {
  assessVocabularyQuality,
  validateVocabularySemantics
} from "../../src/modules/import-export";

describe("editorially reviewed core vocabulary", () => {
  it("matches the versioned manifest and contains unique deterministic records", () => {
    expect(coreVocabularyEntries).toHaveLength(1);
    expect(coreVocabularyManifest.entryCount).toBe(1);
    expect(coreVocabularyManifest.status).toBe("editorial-reviewed");
    expect(new Set(coreVocabularyEntries.map((entry) => entry.id)).size).toBe(1);
    expect(new Set(coreVocabularyEntries.map((entry) => entry.normalizedWord)).size).toBe(1);
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

  it("does not publish completeness warnings as reviewed content", () => {
    for (const entry of coreVocabularyEntries) {
      expect(assessVocabularyQuality(entry).kind, entry.normalizedWord).toBe("clean");
    }
  });

  it("contains useful bilingual examples for the manual review sample", () => {
    for (const word of coreVocabularyManifest.qualityPolicy.manualSampleWords) {
      const entry = coreVocabularyEntries.find((candidate) => candidate.normalizedWord === word);

      expect(entry, word).toBeDefined();
      expect(entry?.examples).toHaveLength(3);
      expect(entry?.meanings[0]?.definitionEn.length).toBeGreaterThan(20);
      expect(entry?.meanings[0]?.translationsTr[0]?.length).toBeGreaterThan(2);
      expect(entry?.examples.every((example) => example.translationTr.length > 5)).toBe(true);
    }
  });
});
