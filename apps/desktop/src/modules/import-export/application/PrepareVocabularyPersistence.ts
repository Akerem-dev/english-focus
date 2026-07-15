import type {
  StoredVocabularyEntry,
  VocabularyEntry,
  VocabularyStorageLayer
} from "@platform/domain";

import type { DuplicateCheckResult } from "./CompareDuplicateEntries";
import type { DuplicateResolutionPlan } from "./ResolveDuplicateEntry";

export type VocabularyPersistencePlan =
  | {
      readonly kind: "save";
      readonly entry: VocabularyEntry;
      readonly layer: VocabularyStorageLayer;
      readonly actionLabel: "Add new entry" | "Replace existing entry" | "Save merged entry";
      readonly summary: string;
    }
  | {
      readonly kind: "keep-existing";
      readonly entry: VocabularyEntry;
      readonly summary: string;
    };

export type VocabularyPersistenceOutcome =
  | { readonly kind: "saved"; readonly record: StoredVocabularyEntry }
  | { readonly kind: "kept-existing"; readonly entry: VocabularyEntry };

function prepareReviewedEntry(
  entry: VocabularyEntry,
  layer: VocabularyStorageLayer,
  now: string
): VocabularyEntry {
  return Object.freeze({
    ...entry,
    source: Object.freeze({ ...entry.source, kind: layer }),
    generation: Object.freeze({
      ...entry.generation,
      validationStatus: "reviewed" as const
    }),
    updatedAt: now
  });
}

export function prepareVocabularyPersistence(
  duplicateResult: DuplicateCheckResult,
  resolution: DuplicateResolutionPlan | undefined,
  now = new Date().toISOString()
): VocabularyPersistencePlan {
  if (duplicateResult.kind === "new-entry") {
    return Object.freeze({
      kind: "save" as const,
      entry: prepareReviewedEntry(duplicateResult.imported.entry, "user", now),
      layer: "user" as const,
      actionLabel: "Add new entry" as const,
      summary: "The reviewed entry will be added to the local user vocabulary layer."
    });
  }

  if (resolution === undefined) {
    throw new Error("Choose a duplicate resolution before continuing to local saving.");
  }

  if (!resolution.shouldPersist) {
    return Object.freeze({
      kind: "keep-existing" as const,
      entry: resolution.selectedEntry,
      summary: resolution.summary
    });
  }

  const layer: VocabularyStorageLayer =
    duplicateResult.comparison.existing.layer === "core"
      ? "override"
      : duplicateResult.comparison.existing.layer;

  return Object.freeze({
    kind: "save" as const,
    entry: prepareReviewedEntry(resolution.selectedEntry, layer, now),
    layer,
    actionLabel:
      resolution.persistenceMode === "merge" ? "Save merged entry" : "Replace existing entry",
    summary: resolution.summary
  });
}
