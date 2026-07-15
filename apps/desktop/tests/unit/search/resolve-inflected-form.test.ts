import { describe, expect, it } from "vitest";

import { maintainVocabularyEntry } from "../../../src/content";
import { resolveInflectedForm } from "../../../src/modules/search";

describe("resolveInflectedForm", () => {
  it.each(["maintains", "maintained", "maintaining"])("resolves %s to maintain", (query) => {
    const result = resolveInflectedForm([maintainVocabularyEntry], query);

    expect(result?.entry.normalizedWord).toBe("maintain");
    expect(result?.matchedForm).toBe(query);
  });

  it("returns undefined for an unrelated valid word", () => {
    expect(resolveInflectedForm([maintainVocabularyEntry], "allocate")).toBeUndefined();
  });
});
