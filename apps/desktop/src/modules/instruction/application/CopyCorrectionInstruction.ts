import type { Clipboard, ImportIssue } from "@platform/domain";

import {
  BuildCorrectionInstruction,
  type CorrectionInstructionTemplate
} from "./BuildCorrectionInstruction";

export interface CopyCorrectionInstructionRequest {
  readonly targetWord: string;
  readonly originalJson: string;
  readonly issues: readonly ImportIssue[];
}

export class CopyCorrectionInstruction {
  constructor(
    private readonly clipboard: Clipboard,
    private readonly builder = new BuildCorrectionInstruction()
  ) {}

  async execute(request: CopyCorrectionInstructionRequest): Promise<CorrectionInstructionTemplate> {
    const instruction = this.builder.execute(request);
    await this.clipboard.writeText(instruction.text);
    return instruction;
  }
}
