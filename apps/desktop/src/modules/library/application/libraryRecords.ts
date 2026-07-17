import type {
  VocabularyEntry,
  VocabularyStorageLayer,
  VocabularyUserMetadata
} from "@platform/domain";

export type LibrarySort = "updated-desc" | "word-asc" | "word-desc";
export type LibraryLayer = "core" | VocabularyStorageLayer;

export interface LibraryRecord {
  readonly entry: VocabularyEntry;
  readonly layer: LibraryLayer;
}

function searchableText(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined
): string {
  return [
    record.entry.word,
    record.entry.normalizedWord,
    record.entry.cefr,
    ...record.entry.aliases,
    ...record.entry.partsOfSpeech,
    ...record.entry.registers,
    ...record.entry.meanings.flatMap((meaning) => [
      meaning.definitionEn,
      ...meaning.translationsTr
    ]),
    ...record.entry.examples.flatMap((example) => [example.sentenceEn, example.translationTr]),
    metadata?.note ?? "",
    ...(metadata?.tags.map((tag) => tag.name) ?? [])
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function matchesSearch(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined,
  query: string
): boolean {
  if (query.trim().length === 0) return true;
  return searchableText(record, metadata).includes(query.trim().toLocaleLowerCase("en-US"));
}

export function compareRecords(
  left: LibraryRecord,
  right: LibraryRecord,
  sort: LibrarySort
): number {
  switch (sort) {
    case "word-asc":
      return left.entry.word.localeCompare(right.entry.word, "en", { sensitivity: "base" });
    case "word-desc":
      return right.entry.word.localeCompare(left.entry.word, "en", { sensitivity: "base" });
    case "updated-desc":
    default:
      return right.entry.updatedAt.localeCompare(left.entry.updatedAt);
  }
}
