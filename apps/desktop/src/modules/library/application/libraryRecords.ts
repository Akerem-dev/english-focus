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

export interface PreparedLibraryRecord extends LibraryRecord {
  readonly metadata: VocabularyUserMetadata | undefined;
  readonly searchText: string;
}

export type LibrarySearchPredicate = (
  record: LibraryRecord,
  metadata?: VocabularyUserMetadata
) => boolean;

const WORD_COLLATOR = new Intl.Collator("en", {
  sensitivity: "base"
});

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
      ...record.entry.morphology.inflectedForms.flatMap((form) => [form.form, form.normalizedForm]),
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

function isPreparedLibraryRecord(record: LibraryRecord): record is PreparedLibraryRecord {
  return "searchText" in record;
}

export function prepareLibraryRecord(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined
): PreparedLibraryRecord {
  return Object.freeze({
    ...record,
    metadata,
    searchText: searchableText(record, metadata)
  });
}

export function createLibrarySearchPredicate(query: string): LibrarySearchPredicate {
  const terms = tokenizeSearchText(query);
  if (terms.length === 0) return () => true;

  const [onlyTerm] = terms;

  return (record, metadata) => {
    if (
      terms.length === 1 &&
      onlyTerm !== undefined &&
      record.entry.normalizedWord.includes(onlyTerm)
    ) {
      return true;
    }

    const text = isPreparedLibraryRecord(record)
      ? record.searchText
      : searchableText(record, metadata);
    return terms.every((term) => text.includes(term));
  };
}

export function matchesSearch(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined,
  query: string
): boolean {
  return createLibrarySearchPredicate(query)(record, metadata);
}

export function compareRecords(
  left: LibraryRecord,
  right: LibraryRecord,
  sort: LibrarySort
): number {
  switch (sort) {
    case "word-asc":
      return WORD_COLLATOR.compare(left.entry.word, right.entry.word);
    case "word-desc":
      return WORD_COLLATOR.compare(right.entry.word, left.entry.word);
    case "updated-desc":
    default:
      return right.entry.updatedAt.localeCompare(left.entry.updatedAt);
  }
}
