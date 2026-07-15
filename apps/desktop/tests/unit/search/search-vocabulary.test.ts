import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import { SearchVocabulary } from "../../../src/modules/search";

const searchVocabulary = new SearchVocabulary(createCoreVocabularyContentSource());

describe("SearchVocabulary", () => {
  it.each(["maintain", " Maintain ", "MAINTAIN"])("finds exact query %s", (query) => {
    const result = searchVocabulary.execute(query);

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entry.normalizedWord).toBe("maintain");
      expect(result.matchKind).toBe("exact");
    }
  });

  it.each(["maintains", "maintained", "maintaining"])("resolves inflected query %s", (query) => {
    const result = searchVocabulary.execute(query);

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entry.normalizedWord).toBe("maintain");
      expect(result.matchKind).toBe("alias");
      expect(result.matchedForm).toBe(query);
    }
  });

  it("returns not-found for a valid unknown word", () => {
    expect(searchVocabulary.execute("allocate")).toMatchObject({
      kind: "not-found",
      normalizedQuery: "allocate"
    });
  });

  it("suggests maintain for a close misspelling", () => {
    expect(searchVocabulary.execute("maintan")).toMatchObject({
      kind: "not-found",
      suggestions: ["maintain"]
    });
  });

  it.each(["", "two words", "maintain?"])("returns invalid for %s", (query) => {
    expect(searchVocabulary.execute(query).kind).toBe("invalid");
  });
});
