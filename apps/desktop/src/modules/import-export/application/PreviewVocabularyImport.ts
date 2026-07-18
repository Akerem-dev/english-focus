import type { ImportIssue, VocabularyEntry } from "@platform/domain";

interface VocabularyImportPreviewCounts {
  readonly meanings: number;
  readonly pronunciations: number;
  readonly examples: number;
  readonly wordForms: number;
}

interface VocabularyImportPreviewChecklistItem {
  readonly id: "identity" | "schema" | "semantics" | "examples" | "provenance";
  readonly label: string;
  readonly detail: string;
}

export interface VocabularyImportPreview {
  readonly entry: VocabularyEntry;
  readonly expectedWord: string;
  readonly primaryTranslation: string;
  readonly counts: VocabularyImportPreviewCounts;
  readonly qualityWarnings: readonly ImportIssue[];
  readonly checklist: readonly VocabularyImportPreviewChecklistItem[];
}

function freezeList<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

/** Builds the final read-only review model after schema and semantic validation. */
export function previewVocabularyImport(
  entry: VocabularyEntry,
  expectedWord: string,
  qualityWarnings: readonly ImportIssue[]
): VocabularyImportPreview {
  const primaryTranslation = Array.from(
    new Set(entry.meanings.flatMap((meaning) => meaning.translationsTr))
  )
    .slice(0, 4)
    .join(", ");

  const counts: VocabularyImportPreviewCounts = Object.freeze({
    meanings: entry.meanings.length,
    pronunciations: entry.pronunciations.length,
    examples: entry.examples.length,
    wordForms: entry.morphology.inflectedForms.length
  });

  const checklist: readonly VocabularyImportPreviewChecklistItem[] = freezeList([
    Object.freeze({
      id: "identity" as const,
      label: "Requested word matches",
      detail: `The reviewed entry represents “${expectedWord}”.`
    }),
    Object.freeze({
      id: "schema" as const,
      label: "Versioned structure passed",
      detail: `Schema ${entry.schemaVersion} accepted every required field and nested value.`
    }),
    Object.freeze({
      id: "semantics" as const,
      label: "Content relationships passed",
      detail:
        "Word identity, morphology, bilingual fields, examples, and timestamps are consistent."
    }),
    Object.freeze({
      id: "examples" as const,
      label: "Three primary examples",
      detail: `${entry.examples.length} English examples include Turkish translations.`
    }),
    Object.freeze({
      id: "provenance" as const,
      label: "User import provenance",
      detail: "The entry remains unvalidated user content until explicit review and later saving."
    })
  ]);

  return Object.freeze({
    entry,
    expectedWord,
    primaryTranslation,
    counts,
    qualityWarnings: freezeList(qualityWarnings),
    checklist
  });
}
