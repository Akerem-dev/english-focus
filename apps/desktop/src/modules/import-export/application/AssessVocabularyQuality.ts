import type { ImportIssue, VocabularyEntry } from "@platform/domain";

import { VocabularyQualityInspector } from "../services";

export type AssessVocabularyQualityResult =
  | {
      readonly kind: "clean";
      readonly issues: readonly [];
    }
  | {
      readonly kind: "warnings";
      readonly issues: readonly ImportIssue[];
    };

const defaultInspector = new VocabularyQualityInspector();

/** Produces non-blocking review warnings after structural and semantic validation. */
export function assessVocabularyQuality(
  entry: VocabularyEntry,
  inspector: VocabularyQualityInspector = defaultInspector
): AssessVocabularyQualityResult {
  const issues = inspector.inspect(entry);

  return issues.length === 0
    ? Object.freeze({ kind: "clean", issues: [] as const })
    : Object.freeze({ kind: "warnings", issues });
}
