import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { exportVocabularyEntry } from "../../../src/modules/import-export";

describe("exportVocabularyEntry", () => {
  it("creates a deterministic readable single-entry JSON export", () => {
    const result = exportVocabularyEntry(maintainVocabularyEntry);

    expect(result.fileName).toBe("maintain.english-focus.vocabulary.json");
    expect(result.json.endsWith("\n")).toBe(true);
    expect(JSON.parse(result.json)).toMatchObject({
      schemaVersion: "1.0.0",
      word: "maintain",
      normalizedWord: "maintain"
    });
  });
});
