import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";

type DuplicateComparisonFieldId =
  | "cefr"
  | "meanings"
  | "examples"
  | "pronunciations"
  | "wordForms"
  | "usage"
  | "etymology"
  | "source";

interface DuplicateComparisonField {
  readonly id: DuplicateComparisonFieldId;
  readonly label: string;
  readonly existingValue: string;
  readonly importedValue: string;
  readonly status: "same" | "different";
}

interface DuplicateEntrySummary {
  readonly entry: VocabularyEntry;
  readonly layer: "core" | "user" | "override";
  readonly primaryTranslation: string;
  readonly meanings: number;
  readonly examples: number;
  readonly pronunciations: number;
  readonly wordForms: number;
  readonly usage: string;
  readonly etymology: "Included" | "Not included";
}

export interface DuplicateComparison {
  readonly normalizedWord: string;
  readonly existing: DuplicateEntrySummary;
  readonly imported: DuplicateEntrySummary;
  readonly fields: readonly DuplicateComparisonField[];
  readonly differingFieldCount: number;
  readonly contentAppearsIdentical: boolean;
  readonly recommendation: "keep-existing" | "replace-with-imported" | "merge-compatible-content";
}

export type DuplicateCheckResult =
  | {
      readonly kind: "new-entry";
      readonly imported: DuplicateEntrySummary;
    }
  | {
      readonly kind: "duplicate";
      readonly comparison: DuplicateComparison;
    };

function primaryTranslation(entry: VocabularyEntry): string {
  return Array.from(new Set(entry.meanings.flatMap((meaning) => meaning.translationsTr)))
    .slice(0, 4)
    .join(", ");
}

function summarize(entry: VocabularyEntry): DuplicateEntrySummary {
  return Object.freeze({
    entry,
    layer: entry.source.kind,
    primaryTranslation: primaryTranslation(entry),
    meanings: entry.meanings.length,
    examples: entry.examples.length,
    pronunciations: entry.pronunciations.length,
    wordForms: entry.morphology.inflectedForms.length,
    usage: `${entry.grammar.summaryEn.length + entry.grammar.summaryTr.length} characters`,
    etymology: entry.etymology === undefined ? "Not included" : "Included"
  });
}

function field(
  id: DuplicateComparisonFieldId,
  label: string,
  existingValue: string | number,
  importedValue: string | number
): DuplicateComparisonField {
  const existingText = String(existingValue);
  const importedText = String(importedValue);

  return Object.freeze({
    id,
    label,
    existingValue: existingText,
    importedValue: importedText,
    status: existingText === importedText ? "same" : "different"
  });
}

function contentScore(summary: DuplicateEntrySummary): number {
  return (
    summary.meanings * 4 +
    summary.examples * 2 +
    summary.pronunciations +
    summary.wordForms +
    (summary.etymology === "Included" ? 1 : 0)
  );
}

function comparableContent(entry: VocabularyEntry): unknown {
  return {
    word: entry.word,
    normalizedWord: entry.normalizedWord,
    aliases: entry.aliases,
    pronunciations: entry.pronunciations,
    cefr: entry.cefr,
    registers: entry.registers,
    partsOfSpeech: entry.partsOfSpeech,
    meanings: entry.meanings,
    morphology: entry.morphology,
    etymology: entry.etymology,
    grammar: entry.grammar,
    examples: entry.examples
  };
}

/** Checks the effective local content source for a normalized-word collision. */
export function compareDuplicateEntries(
  contentSource: VocabularyContentSource,
  importedEntry: VocabularyEntry
): DuplicateCheckResult {
  const imported = summarize(importedEntry);
  const existingEntry = contentSource.getEntryByNormalizedWord(importedEntry.normalizedWord);

  if (existingEntry === undefined) {
    return Object.freeze({ kind: "new-entry" as const, imported });
  }

  const existing = summarize(existingEntry);
  const fields = Object.freeze([
    field("cefr", "CEFR", existing.entry.cefr, imported.entry.cefr),
    field("meanings", "Meanings", existing.meanings, imported.meanings),
    field("examples", "Primary examples", existing.examples, imported.examples),
    field("pronunciations", "Pronunciations", existing.pronunciations, imported.pronunciations),
    field("wordForms", "Word forms", existing.wordForms, imported.wordForms),
    field("usage", "Usage overview", existing.usage, imported.usage),
    field("etymology", "Etymology", existing.etymology, imported.etymology),
    field("source", "Content layer", existing.layer, imported.layer)
  ]);
  const differingFieldCount = fields.filter((item) => item.status === "different").length;
  const contentAppearsIdentical =
    JSON.stringify(comparableContent(existing.entry)) ===
    JSON.stringify(comparableContent(imported.entry));

  const recommendation = contentAppearsIdentical
    ? "keep-existing"
    : contentScore(imported) > contentScore(existing)
      ? "replace-with-imported"
      : "merge-compatible-content";

  return Object.freeze({
    kind: "duplicate" as const,
    comparison: Object.freeze({
      normalizedWord: importedEntry.normalizedWord,
      existing,
      imported,
      fields,
      differingFieldCount,
      contentAppearsIdentical,
      recommendation
    })
  });
}
