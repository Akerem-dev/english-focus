import { vocabularyEntrySchema } from "@platform/schemas";
import { describe, expect, it } from "vitest";

import rawAllocateEntry from "../../../../testing/manual/cp11-allocate-valid-with-warnings.entry.json";
import {
  assessVocabularyQuality,
  validateVocabularySemantics
} from "../../src/modules/import-export";

describe("CP11 manual allocate fixture", () => {
  it("passes schema and semantic checks while demonstrating advisory quality warnings", () => {
    const entry = vocabularyEntrySchema.parse(rawAllocateEntry);
    const semantic = validateVocabularySemantics(entry, "allocate");
    const quality = assessVocabularyQuality(entry);

    expect(semantic.kind).toBe("success");
    expect(quality.kind).toBe("warnings");
    expect(quality.issues.length).toBeGreaterThan(0);
  });
});
