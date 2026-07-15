import type { VocabularyUserMetadata } from "@platform/domain";

export function updateVocabularyUserNote(
  metadata: VocabularyUserMetadata,
  note: string,
  updatedAt: string
): VocabularyUserMetadata {
  if (note.length > 5_000) {
    throw new Error("The personal note cannot exceed 5,000 characters.");
  }

  return Object.freeze({ ...metadata, note, updatedAt });
}
