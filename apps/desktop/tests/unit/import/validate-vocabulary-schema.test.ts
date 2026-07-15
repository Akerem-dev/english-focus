import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content/core";
import { validateVocabularySchema } from "../../../src/modules/import-export";

function cloneEntry(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(maintainVocabularyEntry)) as Record<string, unknown>;
}

describe("validateVocabularySchema", () => {
  it("accepts and freezes a complete vocabulary entry", () => {
    const result = validateVocabularySchema(cloneEntry());

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.entry.word).toBe("maintain");
      expect(result.entry.examples).toHaveLength(10);
      expect(Object.isFrozen(result.entry)).toBe(true);
      expect(Object.isFrozen(result.entry.examples)).toBe(true);
    }
  });

  it("maps missing required fields to stable UI paths", () => {
    const result = validateVocabularySchema({ schemaVersion: "1.0.0", word: "allocate" });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.issues.some((issue) => issue.pathText === "id")).toBe(true);
      expect(result.issues.some((issue) => issue.pathText === "normalizedWord")).toBe(true);
      expect(result.issues.every((issue) => issue.source === "schema")).toBe(true);
    }
  });

  it("reports the exactly-ten-examples contract", () => {
    const entry = cloneEntry();
    entry.examples = [];
    const result = validateVocabularySchema(entry);

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            pathText: "examples",
            severity: "error"
          })
        ])
      );
    }
  });

  it("reports nested array paths with indexes", () => {
    const entry = cloneEntry();
    const meanings = entry.meanings as Record<string, unknown>[];
    delete meanings[0]?.definitionEn;
    const result = validateVocabularySchema(entry);

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.issues.some((issue) => issue.pathText === "meanings[0].definitionEn")).toBe(
        true
      );
    }
  });

  it("rejects unknown top-level properties because the contract is strict", () => {
    const entry = cloneEntry();
    entry.unexpectedProviderField = "not allowed";
    const result = validateVocabularySchema(entry);

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
    }
  });
});
