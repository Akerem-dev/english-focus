import type {
  VocabularyEntry,
  VocabularyStorageLayer,
  VocabularyUserMetadata
} from "@platform/domain";

import { normalizeSearchText, tokenizeSearchText } from "../../search/services";

export type LibrarySort = "updated-desc" | "word-asc" | "word-desc";
type LibraryLayer = "core" | VocabularyStorageLayer;

export interface LibraryRecord {
  readonly entry: VocabularyEntry;
  readonly layer: LibraryLayer;
}

function searchableText(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined
): string {
  return normalizeSearchText(
    [
      record.entry.word,
      record.entry.normalizedWord,
      record.entry.cefr,
      ...record.entry.aliases,
      ...record.entry.morphology.inflectedForms.flatMap((form) => [
        form.form,
        form.normalizedForm
      ]),
      ...record.entry.partsOfSpeech,
      ...record.entry.registers,
      ...record.entry.meanings.flatMap((meaning) => [
        meaning.definitionEn,
        ...meaning.translationsTr
      ]),
      ...record.entry.examples.flatMap((example) => [example.sentenceEn, example.translationTr]),
      metadata?.note ?? "",
      ...(metadata?.tags.flatMap((tag) => [tag.name, tag.normalizedName]) ?? [])
    ].join(" ")
  );
}

export function matchesSearch(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined,
  query: string
): boolean {
  const terms = tokenizeSearchText(query);
  if (terms.length === 0) return true;
  const text = searchableText(record, metadata);
  return terms.every((term) => text.includes(term));
}

export function compareRecords(
  left: LibraryRecord,
  right: LibraryRecord,
  sort: LibrarySort
): number {
  switch (sort) {
    case "word-asc":
      return left.entry.word.localeCompare(right.entry.word, "en", {
        sensitivity: "base"
      });
    case "word-desc":
      return right.entry.word.localeCompare(left.entry.word, "en", {
        sensitivity: "base"
      });
    case "updated-desc":
    default:
      return right.entry.updatedAt.localeCompare(left.entry.updatedAt);
  }
}
