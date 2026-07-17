import { vocabularyEntryInputSchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import rawAllocateEntry from "../../../../testing/manual/cp11-allocate-valid-with-warnings.entry.json";
import {
  assessVocabularyQuality,
  validateVocabularySemantics
} from "../../src/modules/import-export";

describe("CP11 manual allocate fixture", () => {
  it("passes compatibility parsing and semantic checks while demonstrating advisory warnings", () => {
    const entry = vocabularyEntryInputSchema.parse(rawAllocateEntry);
    const semantic = validateVocabularySemantics(entry, "allocate");
    const quality = assessVocabularyQuality(entry);

    expect(entry.examples).toHaveLength(3);
    expect(semantic.kind).toBe("success");
    expect(quality.kind).toBe("warnings");
    expect(quality.issues.length).toBeGreaterThan(0);
  });
});
