import type { ImportIssue, VocabularyContentSource, VocabularyEntry } from "@platform/domain";

import {
  compareDuplicateEntries,
  inspectVocabularyContent,
  prepareVocabularyPersistence,
  validateVocabularySchema,
  type VocabularyPersistencePlan
} from "../../import-export/application";

type AssistantCandidateReview =
  | {
      readonly kind: "ready";
      readonly entry: VocabularyEntry;
      readonly plan: Extract<VocabularyPersistencePlan, { readonly kind: "save" }>;
      readonly warnings: readonly ImportIssue[];
    }
  | {
      readonly kind: "existing";
      readonly entry: VocabularyEntry;
    }
  | {
      readonly kind: "invalid";
      readonly reason: "structure" | "content";
      readonly issues: readonly ImportIssue[];
    };

/**
 * Applies the same schema, semantic, quality, duplicate, and persistence gates used by
 * the advanced import flow without exposing those implementation details in the helper UI.
 */
export function inspectAssistantCandidate(
  value: unknown,
  expectedWord: string,
  contentSource: VocabularyContentSource
): AssistantCandidateReview {
  const schemaResult = validateVocabularySchema(value);

  if (schemaResult.kind === "failure") {
    return Object.freeze({
      kind: "invalid" as const,
      reason: "structure" as const,
      issues: schemaResult.issues
    });
  }

  const contentResult = inspectVocabularyContent(schemaResult.entry, expectedWord);

  if (!contentResult.canContinue) {
    return Object.freeze({
      kind: "invalid" as const,
      reason: "content" as const,
      issues: contentResult.blockingIssues
    });
  }

  const duplicateResult = compareDuplicateEntries(contentSource, contentResult.entry);

  if (duplicateResult.kind === "duplicate") {
    return Object.freeze({
      kind: "existing" as const,
      entry: duplicateResult.comparison.existing.entry
    });
  }

  const plan = prepareVocabularyPersistence(duplicateResult, undefined);

  if (plan.kind !== "save") {
    throw new Error("A new assistant candidate must produce a local save plan.");
  }

  return Object.freeze({
    kind: "ready" as const,
    entry: contentResult.entry,
    plan,
    warnings: contentResult.qualityWarnings
  });
}
