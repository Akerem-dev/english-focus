import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content/core";
import { inspectAssistantCandidate } from "../../../src/modules/assistant/application";

function sourceWith(entries: readonly VocabularyEntry[]): VocabularyContentSource {
  return {
    listEntries: () => entries,
    getEntryById: (entryId) => entries.find((entry) => entry.id === entryId),
    getEntryByNormalizedWord: (normalizedWord) =>
      entries.find((entry) => entry.normalizedWord === normalizedWord)
  };
}

function cloneMaintainEntry(): unknown {
  return structuredClone(maintainVocabularyEntry);
}

describe("inspectAssistantCandidate", () => {
  it("accepts a valid new candidate and prepares a reviewed user-layer save", () => {
    const review = inspectAssistantCandidate(
      cloneMaintainEntry(),
      "maintain",
      sourceWith([])
    );

    expect(review.kind).toBe("ready");
    if (review.kind === "ready") {
      expect(review.entry.word).toBe("maintain");
      expect(review.plan.kind).toBe("save");
      expect(review.plan.layer).toBe("user");
      expect(review.plan.entry.generation.validationStatus).toBe("reviewed");
    }
  });

  it("returns the effective local entry instead of preparing an accidental replacement", () => {
    const review = inspectAssistantCandidate(
      cloneMaintainEntry(),
      "maintain",
      sourceWith([maintainVocabularyEntry])
    );

    expect(review.kind).toBe("existing");
    if (review.kind === "existing") {
      expect(review.entry).toBe(maintainVocabularyEntry);
    }
  });

  it("blocks malformed provider output before review or persistence", () => {
    const review = inspectAssistantCandidate(
      { word: "maintain" },
      "maintain",
      sourceWith([])
    );

    expect(review.kind).toBe("invalid");
    if (review.kind === "invalid") {
      expect(review.reason).toBe("structure");
      expect(review.issues.length).toBeGreaterThan(0);
    }
  });

  it("blocks a structurally valid entry when it represents the wrong word", () => {
    const review = inspectAssistantCandidate(
      cloneMaintainEntry(),
      "allocate",
      sourceWith([])
    );

    expect(review.kind).toBe("invalid");
    if (review.kind === "invalid") {
      expect(review.reason).toBe("content");
      expect(review.issues.length).toBeGreaterThan(0);
    }
  });
});
