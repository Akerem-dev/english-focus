import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import {
  compareDuplicateEntries,
  prepareVocabularyPersistence,
  resolveDuplicateEntry
} from "../../../src/modules/import-export/application";

function userEntry(word: string) {
  return createValidVocabularyEntry({
    id: `user.${word}.persistence-test`,
    word,
    normalizedWord: word,
    source: { kind: "user" },
    generation: {
      method: "external-ai",
      generatedAt: "2026-07-15T00:00:00.000Z",
      validationStatus: "unvalidated",
      warnings: []
    }
  });
}

describe("prepareVocabularyPersistence", () => {
  it("prepares a reviewed user-layer insert for a new word", () => {
    const result = compareDuplicateEntries(
      createCoreVocabularyContentSource(),
      userEntry("allocate")
    );
    const plan = prepareVocabularyPersistence(result, undefined, "2026-07-15T12:00:00.000Z");

    expect(plan.kind).toBe("save");
    if (plan.kind !== "save") {
      throw new Error("Expected save plan.");
    }
    expect(plan.layer).toBe("user");
    expect(plan.entry.source.kind).toBe("user");
    expect(plan.entry.generation.validationStatus).toBe("reviewed");
    expect(plan.entry.updatedAt).toBe("2026-07-15T12:00:00.000Z");
  });

  it("prepares an override when reviewed content replaces a core entry", () => {
    const result = compareDuplicateEntries(
      createCoreVocabularyContentSource(),
      userEntry("maintain")
    );
    if (result.kind !== "duplicate") {
      throw new Error("Expected duplicate result.");
    }
    const resolution = resolveDuplicateEntry(result.comparison, "replace-with-imported");
    const plan = prepareVocabularyPersistence(result, resolution, "2026-07-15T12:00:00.000Z");

    expect(plan.kind).toBe("save");
    if (plan.kind !== "save") {
      throw new Error("Expected save plan.");
    }
    expect(plan.layer).toBe("override");
    expect(plan.entry.source.kind).toBe("override");
  });

  it("records keep-existing as a no-write outcome", () => {
    const result = compareDuplicateEntries(
      createCoreVocabularyContentSource(),
      userEntry("maintain")
    );
    if (result.kind !== "duplicate") {
      throw new Error("Expected duplicate result.");
    }
    const resolution = resolveDuplicateEntry(result.comparison, "keep-existing");
    const plan = prepareVocabularyPersistence(result, resolution);

    expect(plan.kind).toBe("keep-existing");
    expect(plan.entry.normalizedWord).toBe("maintain");
  });
});
