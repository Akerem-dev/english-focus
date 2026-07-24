import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  compareRecords,
  matchesSearch,
  type LibraryRecord
} from "../../apps/desktop/src/modules/library/application/libraryRecords";

describe("10,000-entry Library projection", () => {
  it("filters and sorts a prepared local collection inside the UI budget", () => {
    const records: LibraryRecord[] = Array.from({ length: 10_000 }, (_, index) => {
      const word = `term${index.toString().padStart(5, "0")}`;
      return {
        layer: "user",
        entry: createValidVocabularyEntry({
          id: `perf.${word}`,
          word,
          normalizedWord: word,
          updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()
        })
      };
    });

    // The Library prepares normalized search documents while the initial unfiltered
    // collection is projected. The interaction budget below measures the subsequent
    // query/filter/sort work that runs when the user types.
    records.forEach((record) => matchesSearch(record, undefined, ""));

    const startedAt = performance.now();
    const visible = records
      .filter((record) => matchesSearch(record, undefined, "term099"))
      .sort((left, right) => compareRecords(left, right, "word-desc"));
    const elapsed = performance.now() - startedAt;

    expect(visible).toHaveLength(100);
    expect(visible[0]?.entry.normalizedWord).toBe("term09999");
    expect(elapsed).toBeLessThan(300);
  });
});
