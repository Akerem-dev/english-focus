import { describe, expect, it } from "vitest";

import { normalizeSearchQuery } from "../../../src/modules/search";

describe("normalizeSearchQuery", () => {
  it.each([
    ["maintain", "maintain"],
    [" Maintain ", "maintain"],
    ["MAINTAIN", "maintain"],
    ["learner’s", "learner's"],
    ["well–being", "well-being"]
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeSearchQuery(input)).toMatchObject({
      isValid: true,
      normalized: expected
    });
  });

  it.each([
    ["", "empty"],
    ["two words", "multiple-words"],
    ["maintain?", "unsupported-characters"],
    ["123", "unsupported-characters"]
  ])("rejects %s with %s", (input, validationCode) => {
    expect(normalizeSearchQuery(input)).toMatchObject({
      isValid: false,
      validationCode
    });
  });
});
