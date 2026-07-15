export const DUPLICATE_RESOLUTION_CHOICES = [
  "keep-existing",
  "replace-with-imported",
  "merge-compatible-content"
] as const;

export type DuplicateResolutionChoice = (typeof DUPLICATE_RESOLUTION_CHOICES)[number];

/**
 * User-approved decision recorded before persistence.
 * User-owned metadata is always preserved separately from vocabulary content.
 */
export interface DuplicateDecision {
  readonly normalizedWord: string;
  readonly existingEntryId: string;
  readonly importedEntryId: string;
  readonly choice: DuplicateResolutionChoice;
  readonly preservesUserMetadata: true;
}
