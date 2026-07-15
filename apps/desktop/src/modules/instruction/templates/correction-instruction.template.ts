import type { CorrectionInstructionInput } from "@platform/domain";

export interface RenderCorrectionInstructionRequest {
  readonly input: CorrectionInstructionInput;
  readonly requiredJsonSchema: string;
}

export function renderCorrectionInstruction({
  input,
  requiredJsonSchema
}: RenderCorrectionInstructionRequest): string {
  const issueLines = input.issues
    .map(
      (issue, index) =>
        `${index + 1}. PATH: ${issue.pathText}\n   CODE: ${issue.code}\n   ERROR: ${issue.message}`
    )
    .join("\n");

  return [
    "ENGLISH FOCUS — VOCABULARY JSON CORRECTION INSTRUCTION",
    "",
    `TARGET WORD: ${input.targetWord}`,
    `VOCABULARY SCHEMA VERSION: ${input.vocabularySchemaVersion}`,
    `VALIDATION ERRORS: ${input.issues.length}`,
    "",
    "TASK",
    "Repair the original JSON so that it satisfies every validation error and the required JSON Schema below.",
    "Preserve accurate content that is already valid. Do not invent unsupported grammar, idioms, phrasal verbs, etymology, or usage claims.",
    "The final word and normalizedWord must represent the target word exactly.",
    "Return exactly one corrected JSON object and no Markdown fence, commentary, preface, or follow-up text.",
    "",
    "VALIDATION ERRORS TO FIX",
    issueLines,
    "",
    "ORIGINAL JSON",
    "<ORIGINAL_JSON>",
    input.originalJson,
    "</ORIGINAL_JSON>",
    "",
    "REQUIRED JSON SCHEMA",
    "<REQUIRED_JSON_SCHEMA>",
    requiredJsonSchema,
    "</REQUIRED_JSON_SCHEMA>",
    "",
    "FINAL OUTPUT RULE",
    "Output only the corrected JSON object."
  ].join("\n");
}
