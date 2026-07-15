import { describe, expect, it } from "vitest";

import { createCoreVocabularyContentSource } from "../../../src/infrastructure/content";
import { GetVocabularyEntry } from "../../../src/modules/vocabulary/application/GetVocabularyEntry";

describe("GetVocabularyEntry", () => {
  it("returns the exact reviewed core entry without mutating the source", () => {
    const useCase = new GetVocabularyEntry(createCoreVocabularyContentSource());
    const entry = useCase.execute({ normalizedWord: "maintain" });

    expect(entry?.id).toBe("core.maintain.v1");
    expect(entry?.examples).toHaveLength(10);
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it("returns undefined for unavailable exact words", () => {
    const useCase = new GetVocabularyEntry(createCoreVocabularyContentSource());

    expect(useCase.execute({ normalizedWord: "unknown" })).toBeUndefined();
  });
});
