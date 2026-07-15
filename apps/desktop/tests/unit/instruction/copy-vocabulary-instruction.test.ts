import { DEFAULT_INSTRUCTION_PREFERENCES, type Clipboard } from "@platform/domain";
import { describe, expect, it } from "vitest";

import { CopyVocabularyInstruction } from "../../../src/modules/instruction";

class RecordingClipboard implements Clipboard {
  text = "";

  async writeText(text: string): Promise<void> {
    this.text = text;
  }
}

describe("CopyVocabularyInstruction", () => {
  it("copies the exact deterministic instruction through the clipboard port", async () => {
    const clipboard = new RecordingClipboard();
    const useCase = new CopyVocabularyInstruction(clipboard);

    const instruction = await useCase.execute({
      targetWord: "allocate",
      preferences: DEFAULT_INSTRUCTION_PREFERENCES
    });

    expect(clipboard.text).toBe(instruction.text);
    expect(clipboard.text).toContain("TARGET WORD: allocate");
  });
});
