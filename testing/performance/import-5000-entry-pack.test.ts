import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  parseVocabularyPackJson,
  VOCABULARY_PACK_KIND,
  VOCABULARY_PACK_VERSION
} from "../../apps/desktop/src/modules/import-export";

describe("oversized vocabulary-pack protection", () => {
  it("rejects 5,000 entries before per-entry semantic processing", () => {
    const entry = createValidVocabularyEntry();
    const input = JSON.stringify({
      kind: VOCABULARY_PACK_KIND,
      packVersion: VOCABULARY_PACK_VERSION,
      schemaVersion: "1.0.0",
      createdAt: "2026-07-16T12:00:00.000Z",
      entryCount: 5_000,
      entries: Array.from({ length: 5_000 }, () => entry)
    });
    const startedAt = performance.now();
    const result = parseVocabularyPackJson(input);

    expect(result).toMatchObject({ kind: "failure" });
    expect(result.kind === "failure" ? result.message : "").toContain("safety limit");
    expect(performance.now() - startedAt).toBeLessThan(250);
  });
});
