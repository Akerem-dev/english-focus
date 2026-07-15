import { DUPLICATE_RESOLUTION_CHOICES, type DuplicateDecision } from "@platform/domain";
import { describe, expect, it } from "vitest";

describe("DuplicateDecision", () => {
  it("keeps the three explicit strategies stable", () => {
    expect(DUPLICATE_RESOLUTION_CHOICES).toEqual([
      "keep-existing",
      "replace-with-imported",
      "merge-compatible-content"
    ]);

    const decision: DuplicateDecision = {
      normalizedWord: "maintain",
      existingEntryId: "core.maintain",
      importedEntryId: "user.maintain",
      choice: "replace-with-imported",
      preservesUserMetadata: true
    };

    expect(decision.preservesUserMetadata).toBe(true);
  });
});
