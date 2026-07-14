import { describe, expect, it } from "vitest";

import {
  CEFR_LEVELS,
  LEARNING_STATUSES,
  PARTS_OF_SPEECH,
  REVIEW_STATUSES,
  VOCABULARY_SCHEMA_VERSION
} from "../src";

describe("vocabulary domain contract", () => {
  it("exposes stable version and enum values", () => {
    expect(VOCABULARY_SCHEMA_VERSION).toBe("1.0.0");
    expect(CEFR_LEVELS).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(PARTS_OF_SPEECH).toContain("phrasal-verb");
    expect(LEARNING_STATUSES).toEqual(["new", "learning", "known"]);
    expect(REVIEW_STATUSES).toEqual(["imported", "validated", "reviewed"]);
  });
});
