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

export type LibrarySearchPredicate = (
  record: LibraryRecord,
  metadata?: VocabularyUserMetadata
) => boolean;

interface CachedSearchDocument {
  readonly metadata: VocabularyUserMetadata | undefined;
  readonly text: string;
}

const WORD_COLLATOR = new Intl.Collator("en", {
  sensitivity: "base"
});
const SEARCH_DOCUMENTS = new WeakMap<VocabularyEntry, CachedSearchDocument>();

let cachedPredicateQuery: string | undefined;
let cachedPredicate: LibrarySearchPredicate | undefined;

function buildSearchableText(
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

function cachedSearchableText(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined
): string {
  const cached = SEARCH_DOCUMENTS.get(record.entry);
  if (cached !== undefined && cached.metadata === metadata) {
    return cached.text;
  }

  const text = buildSearchableText(record, metadata);
  SEARCH_DOCUMENTS.set(record.entry, Object.freeze({ metadata, text }));
  return text;
}

export function createLibrarySearchPredicate(query: string): LibrarySearchPredicate {
  const terms = tokenizeSearchText(query);

  if (terms.length === 0) {
    return (record, metadata) => {
      cachedSearchableText(record, metadata);
      return true;
    };
  }

  const [onlyTerm] = terms;

  return (record, metadata) => {
    if (
      terms.length === 1 &&
      onlyTerm !== undefined &&
      record.entry.normalizedWord.includes(onlyTerm)
    ) {
      return true;
    }

    const text = cachedSearchableText(record, metadata);
    return terms.every((term) => text.includes(term));
  };
}

function searchPredicate(query: string): LibrarySearchPredicate {
  if (query !== cachedPredicateQuery || cachedPredicate === undefined) {
    cachedPredicateQuery = query;
    cachedPredicate = createLibrarySearchPredicate(query);
  }

  return cachedPredicate;
}

export function matchesSearch(
  record: LibraryRecord,
  metadata: VocabularyUserMetadata | undefined,
  query: string
): boolean {
  return searchPredicate(query)(record, metadata);
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
