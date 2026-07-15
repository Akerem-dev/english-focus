import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";

export type DuplicateComparisonFieldId =
  | "cefr"
  | "meanings"
  | "examples"
  | "grammarPatterns"
  | "collocations"
  | "wordFamily"
  | "relatedWords"
  | "commonMistakes"
  | "source";

export interface DuplicateComparisonField {
  readonly id: DuplicateComparisonFieldId;
  readonly label: string;
  readonly existingValue: string;
  readonly importedValue: string;
  readonly status: "same" | "different";
}

export interface DuplicateEntrySummary {
  readonly entry: VocabularyEntry;
  readonly layer: "core" | "user" | "override";
  readonly primaryTranslation: string;
  readonly meanings: number;
  readonly examples: number;
  readonly grammarPatterns: number;
  readonly collocations: number;
  readonly wordFamily: number;
  readonly relatedWords: number;
  readonly commonMistakes: number;
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
    grammarPatterns: entry.grammar.patterns.length,
    collocations: entry.collocations.length,
    wordFamily: entry.wordFamily.length,
    relatedWords: entry.relatedWords.length,
    commonMistakes: entry.commonMistakes.length
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

function supportingContentScore(summary: DuplicateEntrySummary): number {
  return (
    summary.meanings * 4 +
    summary.grammarPatterns * 3 +
    summary.collocations * 2 +
    summary.wordFamily * 2 +
    summary.relatedWords +
    summary.commonMistakes
  );
}

/**
 * Checks the immutable local content source for a normalized-word collision.
 * User repositories join this boundary later without changing the comparison model.
 */
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
    field(
      "grammarPatterns",
      "Grammar patterns",
      existing.grammarPatterns,
      imported.grammarPatterns
    ),
    field("collocations", "Collocations", existing.collocations, imported.collocations),
    field("wordFamily", "Word family", existing.wordFamily, imported.wordFamily),
    field("relatedWords", "Related words", existing.relatedWords, imported.relatedWords),
    field("commonMistakes", "Common mistakes", existing.commonMistakes, imported.commonMistakes),
    field("source", "Content layer", existing.layer, imported.layer)
  ]);
  const differingFieldCount = fields.filter((item) => item.status === "different").length;
  const contentAppearsIdentical =
    JSON.stringify({
      word: existing.entry.word,
      normalizedWord: existing.entry.normalizedWord,
      aliases: existing.entry.aliases,
      pronunciations: existing.entry.pronunciations,
      cefr: existing.entry.cefr,
      registers: existing.entry.registers,
      partsOfSpeech: existing.entry.partsOfSpeech,
      meanings: existing.entry.meanings,
      morphology: existing.entry.morphology,
      wordFamily: existing.entry.wordFamily,
      etymology: existing.entry.etymology,
      grammar: existing.entry.grammar,
      collocations: existing.entry.collocations,
      phrasalVerbs: existing.entry.phrasalVerbs,
      idioms: existing.entry.idioms,
      relatedWords: existing.entry.relatedWords,
      commonMistakes: existing.entry.commonMistakes,
      examples: existing.entry.examples
    }) ===
    JSON.stringify({
      word: imported.entry.word,
      normalizedWord: imported.entry.normalizedWord,
      aliases: imported.entry.aliases,
      pronunciations: imported.entry.pronunciations,
      cefr: imported.entry.cefr,
      registers: imported.entry.registers,
      partsOfSpeech: imported.entry.partsOfSpeech,
      meanings: imported.entry.meanings,
      morphology: imported.entry.morphology,
      wordFamily: imported.entry.wordFamily,
      etymology: imported.entry.etymology,
      grammar: imported.entry.grammar,
      collocations: imported.entry.collocations,
      phrasalVerbs: imported.entry.phrasalVerbs,
      idioms: imported.entry.idioms,
      relatedWords: imported.entry.relatedWords,
      commonMistakes: imported.entry.commonMistakes,
      examples: imported.entry.examples
    });

  const recommendation = contentAppearsIdentical
    ? "keep-existing"
    : supportingContentScore(imported) > supportingContentScore(existing)
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
