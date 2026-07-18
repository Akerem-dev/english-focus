import { createValidVocabularyEntry, createVocabularyUserMetadataBuilder } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  compareRecords,
  matchesSearch,
  type LibraryRecord
} from "../../../src/modules/library/application/libraryRecords";

function record(word: string, updatedAt: string): LibraryRecord {
  const base = createValidVocabularyEntry();
  return {
    layer: "user",
    entry: {
      ...base,
      id: `entry-${word}`,
      word,
      normalizedWord: word,
      updatedAt
    }
  };
}

describe("Library filtering and sorting", () => {
  it("searches visible content together with user-owned notes and tags", () => {
    const item = record("allocate", "2026-07-16T10:00:00.000Z");
    const metadata = createVocabularyUserMetadataBuilder()
      .with({
        normalizedWord: "allocate",
        note: "IELTS essay",
        learningStatus: "known",
        reviewStatus: "reviewed"
      })
      .build();

    expect(matchesSearch(item, metadata, "ielts")).toBe(true);
    expect(matchesSearch(item, metadata, "known")).toBe(false);
    expect(matchesSearch(item, metadata, "reviewed")).toBe(false);
    expect(matchesSearch(item, metadata, "missing phrase")).toBe(false);
  });

  it("supports alphabetical and last-updated ordering", () => {
    const alpha = record("alpha", "2026-07-15T10:00:00.000Z");
    const beta = record("beta", "2026-07-16T10:00:00.000Z");

    expect([beta, alpha].sort((a, b) => compareRecords(a, b, "word-asc"))).toEqual([alpha, beta]);
    expect([alpha, beta].sort((a, b) => compareRecords(a, b, "updated-desc"))).toEqual([
      beta,
      alpha
    ]);
  });
});
