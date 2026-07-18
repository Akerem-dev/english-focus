import { describe, expect, it } from "vitest";

import {
  buildVocabularyEntryPath,
  createVocabularyEntrySearchParams,
  getVocabularyRouteOrigin
} from "../../../src/app/router";

describe("vocabulary navigation", () => {
  it("builds a stable detail path for Library-origin navigation", () => {
    expect(buildVocabularyEntryPath("maintain", "library")).toBe("/?word=maintain&from=library");
  });

  it("builds a regular detail path without an origin marker", () => {
    expect(buildVocabularyEntryPath("mother-in-law")).toBe("/?word=mother-in-law");
  });

  it("reads only supported route origins", () => {
    expect(getVocabularyRouteOrigin(createVocabularyEntrySearchParams("maintain", "library"))).toBe(
      "library"
    );
    expect(getVocabularyRouteOrigin(new URLSearchParams("word=maintain&from=unknown"))).toBe(
      undefined
    );
  });
});
