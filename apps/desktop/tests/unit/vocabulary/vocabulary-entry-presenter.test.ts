import { createValidVocabularyEntry } from "@platform/testing";
import { describe, expect, it } from "vitest";

import {
  formatInflectionType,
  formatPartOfSpeech,
  formatPlainLabel,
  presentVocabularyEntry
} from "../../../src/modules/vocabulary/presenters/VocabularyEntryPresenter";

describe("VocabularyEntryPresenter", () => {
  it("derives stable editorial labels from a vocabulary entry", () => {
    const entry = createValidVocabularyEntry();
    const presentation = presentVocabularyEntry(entry);

    expect(presentation.primaryTranslation).toBe(entry.meanings[0]?.translationsTr.join(", "));
    expect(presentation.partOfSpeechLabel).toBe("Verb");
    expect(presentation.sourceLabel).toBe(entry.source.sourceLabel);
    expect(presentation.reviewLabel).toBe("Validated");
  });

  it("formats enum and kebab-case values for human-readable UI", () => {
    expect(formatPartOfSpeech("phrasal-verb")).toBe("Phrasal verb");
    expect(formatInflectionType("past-participle")).toBe("Past participle");
    expect(formatPlainLabel("needs-review")).toBe("Needs Review");
  });
});
