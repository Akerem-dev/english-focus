import { vocabularyEntrySchema } from "@platform/schemas";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import { compareDuplicateEntries, resolveDuplicateEntry } from "../../../src/modules/import-export";

function getComparison() {
  const imported = createValidVocabularyEntry({
    id: "user.maintain.cp13-resolution",
    etymology: undefined,
    source: { kind: "user", sourceId: "cp13-resolution" },
    generation: {
      method: "external-ai",
      generatedAt: "2026-07-15T00:00:00.000Z",
      validationStatus: "unvalidated",
      warnings: []
    },
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  });
  const result = compareDuplicateEntries(createCoreVocabularyContentSource(), imported);

  if (result.kind !== "duplicate") {
    throw new Error("Expected a duplicate fixture.");
  }

  return result.comparison;
}

describe("resolveDuplicateEntry", () => {
  it("records keep-existing without scheduling persistence", () => {
    const plan = resolveDuplicateEntry(getComparison(), "keep-existing");

    expect(plan.shouldPersist).toBe(false);
    expect(plan.persistenceMode).toBe("none");
    expect(plan.selectedEntry.source.kind).toBe("core");
    expect(plan.decision.preservesUserMetadata).toBe(true);
  });

  it("records replacement while preserving separate user metadata", () => {
    const plan = resolveDuplicateEntry(getComparison(), "replace-with-imported");

    expect(plan.shouldPersist).toBe(true);
    expect(plan.persistenceMode).toBe("replace");
    expect(plan.selectedEntry.source.kind).toBe("user");
    expect(plan.decision.choice).toBe("replace-with-imported");
  });

  it("preserves optional etymology without changing imported examples", () => {
    const comparison = getComparison();
    const plan = resolveDuplicateEntry(comparison, "merge-compatible-content");

    expect(plan.shouldPersist).toBe(true);
    expect(plan.persistenceMode).toBe("merge");
    expect(plan.selectedEntry.examples).toEqual(comparison.imported.entry.examples);
    expect(plan.selectedEntry.etymology).toEqual(comparison.existing.entry.etymology);
    expect(vocabularyEntrySchema.safeParse(plan.selectedEntry).success).toBe(true);
  });
});
