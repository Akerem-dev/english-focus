import { DEFAULT_INSTRUCTION_PREFERENCES } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { BuildVocabularyInstruction } from "../../../src/modules/instruction";

describe("BuildVocabularyInstruction", () => {
  it("builds a deterministic schema-versioned instruction", () => {
    const builder = new BuildVocabularyInstruction();
    const first = builder.execute({
      targetWord: "allocate",
      preferences: DEFAULT_INSTRUCTION_PREFERENCES
    });
    const second = builder.execute({
      targetWord: "allocate",
      preferences: DEFAULT_INSTRUCTION_PREFERENCES
    });

    expect(first).toEqual(second);
    expect(first.targetWord).toBe("allocate");
    expect(first.vocabularySchemaVersion).toBe("1.0.0");
    expect(first.text).toContain("TARGET WORD: allocate");
    expect(first.text).toContain("PRIMARY EXAMPLE SENTENCES: exactly 10");
    expect(first.text).toContain("Return exactly one JSON object and nothing else.");
    expect(first.text).toContain("REQUIRED JSON SCHEMA");
    expect(first.text).toContain("generation.method to 'external-ai'");
    expect(first.text).toContain("source.kind to 'user'");
    expect(first.text).toContain('"examples"');
  });

  it("contains no provider, model, endpoint, or credential selection", () => {
    const text = new BuildVocabularyInstruction()
      .execute({
        targetWord: "allocate",
        preferences: DEFAULT_INSTRUCTION_PREFERENCES
      })
      .text.toLocaleLowerCase("en-US");

    expect(text).not.toContain("openai");
    expect(text).not.toContain("anthropic");
    expect(text).not.toContain("gemini");
    expect(text).not.toContain("api key");
    expect(text).not.toContain("localhost");
  });

  it("normalizes the target word and rejects invalid phrases", () => {
    const builder = new BuildVocabularyInstruction();
    const instruction = builder.execute({
      targetWord: " Allocate ",
      preferences: DEFAULT_INSTRUCTION_PREFERENCES
    });

    expect(instruction.targetWord).toBe("allocate");
    expect(() =>
      builder.execute({
        targetWord: "two words",
        preferences: DEFAULT_INSTRUCTION_PREFERENCES
      })
    ).toThrow(/single English word/u);
  });
});
