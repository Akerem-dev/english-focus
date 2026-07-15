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
        `${index + 1}. SOURCE: ${issue.source}\n   SEVERITY: ${issue.severity}\n   PATH: ${issue.pathText}\n   CODE: ${issue.code}\n   ISSUE: ${issue.message}`
    )
    .join("\n");

  return [
    "ENGLISH FOCUS — VOCABULARY JSON CORRECTION INSTRUCTION",
    "",
    `TARGET WORD: ${input.targetWord}`,
    `VOCABULARY SCHEMA VERSION: ${input.vocabularySchemaVersion}`,
    `VALIDATION ISSUES: ${input.issues.length}`,
    "",
    "TASK",
    "Repair or improve the original JSON so that it satisfies every blocking validation issue and addresses reliable quality warnings where appropriate.",
    "Preserve accurate content that is already valid. Do not invent unsupported grammar, idioms, phrasal verbs, etymology, word senses, or usage claims.",
    "The final word, normalizedWord, morphology, examples, source metadata, and generation metadata must represent the target word exactly.",
    "Warnings are advisory: leave a field empty or absent when no reliable content exists instead of fabricating material.",
    "Return exactly one corrected JSON object and no Markdown fence, commentary, preface, or follow-up text.",
    "",
    "VALIDATION ISSUES TO FIX OR REVIEW",
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
