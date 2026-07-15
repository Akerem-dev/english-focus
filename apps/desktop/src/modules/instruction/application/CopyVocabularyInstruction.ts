import type { Clipboard, InstructionPreferences, InstructionTemplate } from "@platform/domain";

import { BuildVocabularyInstruction } from "./BuildVocabularyInstruction";

export interface CopyVocabularyInstructionRequest {
  readonly targetWord: string;
  readonly preferences: InstructionPreferences;
}

export class CopyVocabularyInstruction {
  constructor(
    private readonly clipboard: Clipboard,
    private readonly builder = new BuildVocabularyInstruction()
  ) {}

  async execute(request: CopyVocabularyInstructionRequest): Promise<InstructionTemplate> {
    const instruction = this.builder.execute(request);
    await this.clipboard.writeText(instruction.text);
    return instruction;
  }
}
