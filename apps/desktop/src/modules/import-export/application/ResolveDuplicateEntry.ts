import type {
  DuplicateDecision,
  DuplicateResolutionChoice,
  VocabularyEntry
} from "@platform/domain";

import type { DuplicateComparison } from "./CompareDuplicateEntries";

export interface DuplicateResolutionPlan {
  readonly decision: DuplicateDecision;
  readonly selectedEntry: VocabularyEntry;
  readonly shouldPersist: boolean;
  readonly persistenceMode: "none" | "replace" | "merge";
  readonly summary: string;
}

function uniqueStrings<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze(Array.from(new Set(values)));
}

function preferImported<T>(imported: readonly T[], existing: readonly T[]): readonly T[] {
  return imported.length > 0 ? imported : existing;
}

/**
 * Safe duplicate merge policy:
 * - imported meanings, morphology and exactly-ten examples remain authoritative;
 * - optional supporting sections fall back to the existing entry only when omitted;
 * - aliases/registers/parts of speech are combined without duplicates;
 * - provenance remains the reviewed user import;
 * - user metadata is not part of vocabulary content and is preserved separately.
 */
function mergeCompatibleContent(
  existing: VocabularyEntry,
  imported: VocabularyEntry
): VocabularyEntry {
  return Object.freeze({
    ...imported,
    aliases: uniqueStrings([...existing.aliases, ...imported.aliases]),
    registers: uniqueStrings([...existing.registers, ...imported.registers]),
    partsOfSpeech: uniqueStrings([...existing.partsOfSpeech, ...imported.partsOfSpeech]),
    wordFamily: preferImported(imported.wordFamily, existing.wordFamily),
    ...(imported.etymology === undefined && existing.etymology !== undefined
      ? { etymology: existing.etymology }
      : {}),
    grammar: Object.freeze({
      ...imported.grammar,
      patterns: preferImported(imported.grammar.patterns, existing.grammar.patterns),
      tenseExamples: preferImported(imported.grammar.tenseExamples, existing.grammar.tenseExamples),
      sentenceForms: preferImported(imported.grammar.sentenceForms, existing.grammar.sentenceForms),
      prepositionPatterns: preferImported(
        imported.grammar.prepositionPatterns,
        existing.grammar.prepositionPatterns
      )
    }),
    collocations: preferImported(imported.collocations, existing.collocations),
    phrasalVerbs: preferImported(imported.phrasalVerbs, existing.phrasalVerbs),
    idioms: preferImported(imported.idioms, existing.idioms),
    relatedWords: preferImported(imported.relatedWords, existing.relatedWords),
    commonMistakes: preferImported(imported.commonMistakes, existing.commonMistakes)
  });
}

export function resolveDuplicateEntry(
  comparison: DuplicateComparison,
  choice: DuplicateResolutionChoice
): DuplicateResolutionPlan {
  const decision: DuplicateDecision = Object.freeze({
    normalizedWord: comparison.normalizedWord,
    existingEntryId: comparison.existing.entry.id,
    importedEntryId: comparison.imported.entry.id,
    choice,
    preservesUserMetadata: true
  });

  switch (choice) {
    case "keep-existing":
      return Object.freeze({
        decision,
        selectedEntry: comparison.existing.entry,
        shouldPersist: false,
        persistenceMode: "none" as const,
        summary: "The existing vocabulary content will remain unchanged."
      });
    case "replace-with-imported":
      return Object.freeze({
        decision,
        selectedEntry: comparison.imported.entry,
        shouldPersist: true,
        persistenceMode: "replace" as const,
        summary:
          "The reviewed imported content will replace the current content while separate user metadata remains preserved."
      });
    case "merge-compatible-content":
      return Object.freeze({
        decision,
        selectedEntry: mergeCompatibleContent(comparison.existing.entry, comparison.imported.entry),
        shouldPersist: true,
        persistenceMode: "merge" as const,
        summary:
          "Imported meanings and examples stay authoritative; missing optional supporting sections are filled from the existing entry."
      });
  }
}
