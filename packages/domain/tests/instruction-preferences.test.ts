import { DEFAULT_INSTRUCTION_PREFERENCES, VOCABULARY_INSTRUCTION_TEMPLATE_VERSION } from "../src";
import { describe, expect, it } from "vitest";

describe("instruction preferences contract", () => {
  it("keeps the simplified external-AI workflow provider independent", () => {
    expect(DEFAULT_INSTRUCTION_PREFERENCES).toEqual({
      explanationLanguage: "tr",
      detailLevel: "detailed",
      targetProficiency: "B2",
      includeGrammarNotes: true,
      includeEtymology: true,
      includeUsageTips: true
    });
    expect(DEFAULT_INSTRUCTION_PREFERENCES).not.toHaveProperty("provider");
    expect(DEFAULT_INSTRUCTION_PREFERENCES).not.toHaveProperty("apiKey");
    expect(DEFAULT_INSTRUCTION_PREFERENCES).not.toHaveProperty("includeWordFamily");
    expect(DEFAULT_INSTRUCTION_PREFERENCES).not.toHaveProperty("includeCommonMistakes");
    expect(VOCABULARY_INSTRUCTION_TEMPLATE_VERSION).toBe("1.0.0");
  });
});
