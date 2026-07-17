import type { Dispatch, SetStateAction } from "react";
import type { VocabularyEntry } from "@platform/domain";

import type { VocabularyEntryEditIssue } from "../application";

export interface VocabularyEditorSectionProps {
  readonly draft: VocabularyEntry;
  readonly issues: readonly VocabularyEntryEditIssue[];
  readonly setDraft: Dispatch<SetStateAction<VocabularyEntry>>;
}

export function replaceAt<T>(
  values: readonly T[],
  index: number,
  nextValue: T,
): readonly T[] {
  return values.map((value, valueIndex) =>
    valueIndex === index ? nextValue : value,
  );
}

export function firstIssue(
  issues: readonly VocabularyEntryEditIssue[],
  prefix: string,
): string | undefined {
  return issues.find(
    (issue) =>
      issue.path === prefix ||
      issue.path.startsWith(`${prefix}.`) ||
      issue.path.startsWith(`${prefix}[`),
  )?.message;
}
