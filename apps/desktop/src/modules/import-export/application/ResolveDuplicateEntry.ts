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

/**
 * Imported meanings, usage, morphology, and examples remain authoritative. Search aliases,
 * registers, and parts of speech are combined; a missing optional etymology may fall back to the
 * existing entry. User metadata remains outside vocabulary content and is preserved separately.
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
    ...(imported.etymology === undefined && existing.etymology !== undefined
      ? { etymology: existing.etymology }
      : {})
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
          "Imported meanings, usage, forms, and examples stay authoritative; compatible identity labels and optional etymology are preserved."
      });
  }
}
