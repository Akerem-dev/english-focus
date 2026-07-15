import type { InstructionPreferences, InstructionTemplate } from "@platform/domain";

import { InstructionTemplateRenderer, validateInstructionPreferences } from "../services";

const NORMALIZED_ENGLISH_WORD = /^[a-z]+(?:['-][a-z]+)*$/;

export interface BuildVocabularyInstructionRequest {
  readonly targetWord: string;
  readonly preferences: InstructionPreferences;
}

export class BuildVocabularyInstruction {
  constructor(private readonly renderer = new InstructionTemplateRenderer()) {}

  execute({ targetWord, preferences }: BuildVocabularyInstructionRequest): InstructionTemplate {
    const normalizedTarget = targetWord.normalize("NFKC").trim().toLocaleLowerCase("en-US");

    if (!NORMALIZED_ENGLISH_WORD.test(normalizedTarget)) {
      throw new Error("A normalized single English word is required to build an instruction.");
    }

    return this.renderer.renderVocabularyInstruction({
      targetWord: normalizedTarget,
      preferences: validateInstructionPreferences(preferences)
    });
  }
}
