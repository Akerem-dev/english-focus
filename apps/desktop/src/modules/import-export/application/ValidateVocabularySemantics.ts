import type { ImportIssue, VocabularyEntry } from "@platform/domain";

import { VocabularySemanticValidator } from "../services";

export type ValidateVocabularySemanticsResult =
  | {
      readonly kind: "success";
      readonly entry: VocabularyEntry;
      readonly issues: readonly [];
    }
  | {
      readonly kind: "failure";
      readonly entry: VocabularyEntry;
      readonly issues: readonly ImportIssue[];
    };

const defaultValidator = new VocabularySemanticValidator();

/** Runs target-aware cross-field checks after the versioned Zod schema has passed. */
export function validateVocabularySemantics(
  entry: VocabularyEntry,
  expectedWord: string,
  validator: VocabularySemanticValidator = defaultValidator
): ValidateVocabularySemanticsResult {
  const issues = validator.validate(entry, expectedWord);

  if (issues.length === 0) {
    return Object.freeze({ kind: "success", entry, issues: [] as const });
  }

  return Object.freeze({ kind: "failure", entry, issues });
}
