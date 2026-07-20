import type { VocabularyContentSource } from "@platform/domain";
import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import { SearchVocabulary } from "../../apps/desktop/src/modules/search";

function createCatalog(size: number): VocabularyContentSource {
  const entries = Array.from({ length: size }, (_, index) => {
    let remaining = index;
    let suffix = "";
    for (let position = 0; position < 4; position += 1) {
      suffix = `${String.fromCharCode(97 + (remaining % 26))}${suffix}`;
      remaining = Math.floor(remaining / 26);
    }
    const word = `word${suffix}`;
    return createValidVocabularyEntry({ id: `perf.${word}`, word, normalizedWord: word });
  });
  const byWord = new Map(entries.map((entry) => [entry.normalizedWord, entry] as const));
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  return {
    listEntries: () => entries,
    getEntryById: (id: string) => byId.get(id),
    getEntryByNormalizedWord: (word: string) => byWord.get(word)
  };
}

describe("10,000-entry vocabulary search", () => {
  it("resolves exact entries within the interactive-search budget", () => {
    const catalog = createCatalog(10_000);
    const search = new SearchVocabulary(catalog);
    const searchVocabularySamples = catalog
      .listEntries()
      .slice(-100)
      .map((entry) => entry.normalizedWord);
    const startedAt = performance.now();

    for (const entry of searchVocabularySamples) {
      expect(search.execute(entry).kind).toBe("found");
    }

    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  it("returns ranked prefix matches within the local-search budget", () => {
    const search = new SearchVocabulary(createCatalog(10_000));
    const startedAt = performance.now();

    const result = search.execute("wordaa");

    expect(result.kind).toBe("matches");
    expect(performance.now() - startedAt).toBeLessThan(250);
  });
});
