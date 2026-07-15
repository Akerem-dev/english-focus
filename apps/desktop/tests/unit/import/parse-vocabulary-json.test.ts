import { describe, expect, it } from "vitest";

import { parseVocabularyJson } from "../../../src/modules/import-export";

describe("parseVocabularyJson", () => {
  it("parses a top-level object and exposes a word hint", () => {
    const result = parseVocabularyJson('{"schemaVersion":"1.0.0","word":"allocate","examples":[]}');

    expect(result).toMatchObject({
      kind: "success",
      parsed: {
        detectedWord: "allocate",
        topLevelKeys: ["schemaVersion", "word", "examples"]
      }
    });
  });

  it("recovers from smart double quotes used as JSON delimiters", () => {
    const result = parseVocabularyJson("{“schemaVersion”:“1.0.0”,“word”:“allocate”}");

    expect(result).toMatchObject({
      kind: "success",
      parsed: {
        detectedWord: "allocate",
        transformations: ["normalized-smart-quotes"]
      }
    });
  });

  it("reports invalid JSON without throwing", () => {
    const result = parseVocabularyJson('{"word":"allocate",}');

    expect(result).toMatchObject({
      kind: "failure",
      code: "invalid-json"
    });
  });

  it("does not claim schema validation", () => {
    const result = parseVocabularyJson('{"word":"allocate"}');

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.parsed.value).toEqual({ word: "allocate" });
      expect(Object.isFrozen(result.parsed.value)).toBe(true);
    }
  });
  it("repairs mojibake in parsed string values and normalizes the retained JSON", () => {
    const result = parseVocabularyJson(
      JSON.stringify({
        schemaVersion: "1.0.0",
        word: "allocate",
        meanings: [{ translationsTr: ["tahsis etmek", "ayÄ±rmak"] }],
        grammar: { summaryTr: "hedef kiÅŸi veya amaÃ§" }
      })
    );

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.parsed.transformations).toContain("repaired-mojibake-text");
      expect(result.parsed.value).toMatchObject({
        meanings: [{ translationsTr: ["tahsis etmek", "ayırmak"] }],
        grammar: { summaryTr: "hedef kişi veya amaç" }
      });
      expect(result.parsed.cleanedText).toContain("ayırmak");
      expect(result.parsed.cleanedText).not.toContain("ayÄ±rmak");
    }
  });
});
