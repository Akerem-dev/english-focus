import {
  VOCABULARY_SCHEMA_VERSION,
  type CorrectionInstructionInput,
  type ImportIssue
} from "@platform/domain";
import { vocabularyEntryJsonSchema } from "@platform/schemas";

import { renderCorrectionInstruction } from "../templates";

const NORMALIZED_ENGLISH_WORD = /^[a-z]+(?:['-][a-z]+)*$/;
export const CORRECTION_INSTRUCTION_TEMPLATE_VERSION = "1.0.0" as const;

export interface BuildCorrectionInstructionRequest {
  readonly targetWord: string;
  readonly originalJson: string;
  readonly issues: readonly ImportIssue[];
}

export interface CorrectionInstructionTemplate {
  readonly templateId: "english-focus-vocabulary-correction";
  readonly templateVersion: typeof CORRECTION_INSTRUCTION_TEMPLATE_VERSION;
  readonly targetWord: string;
  readonly vocabularySchemaVersion: typeof VOCABULARY_SCHEMA_VERSION;
  readonly issueCount: number;
  readonly text: string;
}

export class BuildCorrectionInstruction {
  execute({
    issues,
    originalJson,
    targetWord
  }: BuildCorrectionInstructionRequest): CorrectionInstructionTemplate {
    const normalizedTarget = targetWord.normalize("NFKC").trim().toLocaleLowerCase("en-US");

    if (!NORMALIZED_ENGLISH_WORD.test(normalizedTarget)) {
      throw new Error("A normalized single English word is required for correction.");
    }

    if (originalJson.trim().length === 0) {
      throw new Error("The original JSON is required for correction.");
    }

    if (issues.length === 0) {
      throw new Error("At least one validation issue is required for correction.");
    }

    const input: CorrectionInstructionInput = Object.freeze({
      targetWord: normalizedTarget,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
      originalJson,
      issues: Object.freeze([...issues])
    });
    const text = renderCorrectionInstruction({
      input,
      requiredJsonSchema: JSON.stringify(vocabularyEntryJsonSchema, null, 2)
    });

    return Object.freeze({
      templateId: "english-focus-vocabulary-correction",
      templateVersion: CORRECTION_INSTRUCTION_TEMPLATE_VERSION,
      targetWord: normalizedTarget,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
      issueCount: issues.length,
      text
    });
  }
}
