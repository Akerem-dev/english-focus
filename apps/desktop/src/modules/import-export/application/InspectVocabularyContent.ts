import type { ImportIssue, VocabularyEntry } from "@platform/domain";

import { assessVocabularyQuality } from "./AssessVocabularyQuality";
import { validateVocabularySemantics } from "./ValidateVocabularySemantics";

export interface InspectVocabularyContentResult {
  readonly entry: VocabularyEntry;
  readonly semanticPassed: boolean;
  readonly blockingIssues: readonly ImportIssue[];
  readonly qualityWarnings: readonly ImportIssue[];
  readonly allIssues: readonly ImportIssue[];
  readonly canContinue: boolean;
}

/** Runs the two post-schema gates in deterministic order: semantics first, quality second. */
export function inspectVocabularyContent(
  entry: VocabularyEntry,
  expectedWord: string
): InspectVocabularyContentResult {
  const semantic = validateVocabularySemantics(entry, expectedWord);
  const quality = assessVocabularyQuality(entry);
  const blockingIssues = semantic.issues;
  const qualityWarnings = quality.issues;

  return Object.freeze({
    entry,
    semanticPassed: semantic.kind === "success",
    blockingIssues,
    qualityWarnings,
    allIssues: Object.freeze([...blockingIssues, ...qualityWarnings]),
    canContinue: semantic.kind === "success"
  });
}
