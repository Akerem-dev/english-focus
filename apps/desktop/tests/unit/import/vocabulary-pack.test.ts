import type { VocabularyEntry } from "@platform/domain";
import { describe, expect, it } from "vitest";

import rawAllocateEntry from "../../../../../testing/manual/cp11-allocate-valid-with-warnings.entry.json";
import { maintainVocabularyEntry } from "../../../src/content";
import {
  exportVocabularyPack,
  parseVocabularyPackJson,
  VOCABULARY_PACK_KIND,
  VOCABULARY_PACK_VERSION
} from "../../../src/modules/import-export";

describe("vocabulary pack transfer", () => {
  it("exports a deterministic readable pack", () => {
    const exported = exportVocabularyPack(
      [rawAllocateEntry as VocabularyEntry, maintainVocabularyEntry],
      "2026-07-15T12:00:00.000Z"
    );
    const parsed = JSON.parse(exported.json) as {
      kind: string;
      packVersion: string;
      entryCount: number;
      entries: readonly { normalizedWord: string }[];
    };

    expect(exported.fileName).toBe("english-focus-vocabulary-pack-2026-07-15.json");
    expect(exported.entryCount).toBe(2);
    expect(parsed.kind).toBe(VOCABULARY_PACK_KIND);
    expect(parsed.packVersion).toBe(VOCABULARY_PACK_VERSION);
    expect(parsed.entryCount).toBe(2);
    expect(parsed.entries.map((entry) => entry.normalizedWord)).toEqual(["allocate", "maintain"]);
    expect(exported.json.endsWith("\n")).toBe(true);
  });


  it("accepts entries exported from the layered local library", () => {
    const reviewedAllocate = {
      ...(rawAllocateEntry as VocabularyEntry),
      generation: {
        ...(rawAllocateEntry as VocabularyEntry).generation,
        validationStatus: "reviewed" as const
      }
    };
    const exported = exportVocabularyPack(
      [reviewedAllocate, maintainVocabularyEntry],
      "2026-07-15T12:00:00.000Z"
    );

    const result = parseVocabularyPackJson(exported.json);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.analysis.validCount).toBe(2);
      expect(result.analysis.invalidCount).toBe(0);
      expect(result.analysis.entries.every((entry) => entry.status === "valid")).toBe(true);
    }
  });

  it("analyzes valid and repeated entries without throwing", () => {
    const pack = {
      kind: VOCABULARY_PACK_KIND,
      packVersion: VOCABULARY_PACK_VERSION,
      schemaVersion: "1.0.0",
      createdAt: "2026-07-15T12:00:00.000Z",
      entryCount: 2,
      entries: [rawAllocateEntry, rawAllocateEntry]
    };

    const result = parseVocabularyPackJson(JSON.stringify(pack));

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.analysis.validCount).toBe(1);
      expect(result.analysis.invalidCount).toBe(1);
      expect(result.analysis.entries[1]?.issues[0]?.code).toBe("duplicate_pack_entry");
    }
  });

  it("rejects a pack whose declared count does not match its contents", () => {
    const result = parseVocabularyPackJson(
      JSON.stringify({
        kind: VOCABULARY_PACK_KIND,
        packVersion: VOCABULARY_PACK_VERSION,
        schemaVersion: "1.0.0",
        createdAt: "2026-07-15T12:00:00.000Z",
        entryCount: 3,
        entries: [rawAllocateEntry]
      })
    );

    expect(result).toEqual({
      kind: "failure",
      message: "The pack declares 3 entries but contains 1."
    });
  });
});
