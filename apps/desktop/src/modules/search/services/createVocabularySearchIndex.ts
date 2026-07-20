import type { VocabularyEntry, VocabularyUserMetadata } from "@platform/domain";

import { normalizeSearchText, tokenizeSearchText } from "./normalizeSearchText";

export type VocabularySearchField =
  | "word"
  | "alias"
  | "inflection"
  | "translation"
  | "definition"
  | "tag"
  | "note";

export type IndexedVocabularySearchMatchKind = "prefix" | "full-text";

export interface IndexedVocabularySearchMatch {
  readonly entry: VocabularyEntry;
  readonly matchKind: IndexedVocabularySearchMatchKind;
  readonly matchedField: VocabularySearchField;
  readonly matchedText: string;
}

interface IndexedFieldValue {
  readonly field: VocabularySearchField;
  readonly original: string;
  readonly normalized: string;
  readonly tokens: readonly string[];
}

interface IndexedVocabularyEntry {
  readonly entry: VocabularyEntry;
  readonly fields: readonly IndexedFieldValue[];
  readonly combinedText: string;
}

interface RankedSearchMatch extends IndexedVocabularySearchMatch {
  readonly score: number;
}

const RESULT_LIMIT = 12;
const FIELD_WEIGHT: Readonly<Record<VocabularySearchField, number>> = Object.freeze({
  word: 700,
  alias: 650,
  inflection: 600,
  translation: 500,
  tag: 450,
  definition: 350,
  note: 300
});

function uniqueNonEmpty(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))]
  );
}

function fieldValues(
  entry: VocabularyEntry,
  metadata: VocabularyUserMetadata | undefined
): Readonly<Record<VocabularySearchField, readonly string[]>> {
  return Object.freeze({
    word: uniqueNonEmpty([entry.word, entry.normalizedWord]),
    alias: uniqueNonEmpty(entry.aliases),
    inflection: uniqueNonEmpty(
      entry.morphology.inflectedForms.flatMap((form) => [form.form, form.normalizedForm])
    ),
    translation: uniqueNonEmpty(
      entry.meanings.flatMap((meaning) => meaning.translationsTr)
    ),
    definition: uniqueNonEmpty(entry.meanings.map((meaning) => meaning.definitionEn)),
    tag: uniqueNonEmpty(metadata?.tags.flatMap((tag) => [tag.name, tag.normalizedName]) ?? []),
    note: uniqueNonEmpty(metadata?.note === undefined ? [] : [metadata.note])
  });
}

function buildIndexedFields(
  entry: VocabularyEntry,
  metadata: VocabularyUserMetadata | undefined
): readonly IndexedFieldValue[] {
  const values = fieldValues(entry, metadata);
  const fields: IndexedFieldValue[] = [];

  for (const field of Object.keys(values) as VocabularySearchField[]) {
    for (const original of values[field]) {
      const normalized = normalizeSearchText(original);
      if (normalized.length === 0) {
        continue;
      }
      fields.push(
        Object.freeze({
          field,
          original,
          normalized,
          tokens: tokenizeSearchText(original)
        })
      );
    }
  }

  return Object.freeze(fields);
}

function createDocument(
  entry: VocabularyEntry,
  metadata: VocabularyUserMetadata | undefined
): IndexedVocabularyEntry {
  const fields = buildIndexedFields(entry, metadata);
  return Object.freeze({
    entry,
    fields,
    combinedText: fields.map((field) => field.normalized).join(" ")
  });
}

function summarizeMatchedText(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length <= 120 ? collapsed : `${collapsed.slice(0, 117).trimEnd()}…`;
}

function compareRankedMatches(left: RankedSearchMatch, right: RankedSearchMatch): number {
  return (
    right.score -
      left.score ||
    left.entry.word.localeCompare(right.entry.word, "en", { sensitivity: "base" })
  );
}

function withoutScore(match: RankedSearchMatch): IndexedVocabularySearchMatch {
  return Object.freeze({
    entry: match.entry,
    matchKind: match.matchKind,
    matchedField: match.matchedField,
    matchedText: match.matchedText
  });
}

function prefixMatch(
  document: IndexedVocabularyEntry,
  queryTerm: string
): RankedSearchMatch | undefined {
  let bestField: IndexedFieldValue | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const field of document.fields) {
    const matchingTokens = field.tokens.filter((token) => token.startsWith(queryTerm));
    if (matchingTokens.length === 0) {
      continue;
    }

    const exactTokenBonus = matchingTokens.some((token) => token === queryTerm) ? 60 : 0;
    const valuePrefixBonus = field.normalized.startsWith(queryTerm) ? 30 : 0;
    const shortestToken = Math.min(...matchingTokens.map((token) => token.length));
    const proximityBonus = Math.max(0, 20 - (shortestToken - queryTerm.length));
    const score = FIELD_WEIGHT[field.field] + exactTokenBonus + valuePrefixBonus + proximityBonus;

    if (score > bestScore) {
      bestScore = score;
      bestField = field;
    }
  }

  if (bestField === undefined) {
    return undefined;
  }

  return Object.freeze({
    entry: document.entry,
    matchKind: "prefix",
    matchedField: bestField.field,
    matchedText: summarizeMatchedText(bestField.original),
    score: bestScore
  });
}

function fieldMatchesTerm(field: IndexedFieldValue, term: string): boolean {
  return field.tokens.some((token) => token === term || token.startsWith(term));
}

function fullTextMatch(
  document: IndexedVocabularyEntry,
  normalizedQuery: string,
  queryTerms: readonly string[]
): RankedSearchMatch | undefined {
  if (!queryTerms.every((term) => document.fields.some((field) => fieldMatchesTerm(field, term)))) {
    return undefined;
  }

  let bestField: IndexedFieldValue | undefined;
  let bestFieldScore = Number.NEGATIVE_INFINITY;

  for (const field of document.fields) {
    const matchedTermCount = queryTerms.filter((term) => fieldMatchesTerm(field, term)).length;
    if (matchedTermCount === 0) {
      continue;
    }

    const phraseBonus = field.normalized.includes(normalizedQuery) ? 180 : 0;
    const score = FIELD_WEIGHT[field.field] + matchedTermCount * 40 + phraseBonus;
    if (score > bestFieldScore) {
      bestField = field;
      bestFieldScore = score;
    }
  }

  if (bestField === undefined) {
    return undefined;
  }

  const combinedPhraseBonus = document.combinedText.includes(normalizedQuery) ? 100 : 0;
  return Object.freeze({
    entry: document.entry,
    matchKind: "full-text",
    matchedField: bestField.field,
    matchedText: summarizeMatchedText(bestField.original),
    score: bestFieldScore + combinedPhraseBonus
  });
}

export interface VocabularySearchIndex {
  search(query: string): readonly IndexedVocabularySearchMatch[];
}

export function createVocabularySearchIndex(
  entries: readonly VocabularyEntry[],
  metadata: readonly VocabularyUserMetadata[] = []
): VocabularySearchIndex {
  const metadataByWord = new Map(
    metadata.map((record) => [record.normalizedWord, record] as const)
  );
  const documents = Object.freeze(
    entries.map((entry) => createDocument(entry, metadataByWord.get(entry.normalizedWord)))
  );

  return Object.freeze({
    search(query: string): readonly IndexedVocabularySearchMatch[] {
      const normalizedQuery = normalizeSearchText(query);
      const queryTerms = tokenizeSearchText(query);
      if (normalizedQuery.length === 0 || queryTerms.length === 0) {
        return Object.freeze([]);
      }

      const [queryTerm] = queryTerms;
      if (queryTerms.length === 1 && queryTerm !== undefined) {
        const prefixMatches = documents
          .map((document) => prefixMatch(document, queryTerm))
          .filter((match): match is RankedSearchMatch => match !== undefined)
          .sort(compareRankedMatches)
          .slice(0, RESULT_LIMIT);
        if (prefixMatches.length > 0) {
          return Object.freeze(prefixMatches.map(withoutScore));
        }
      }

      const fullTextMatches = documents
        .map((document) => fullTextMatch(document, normalizedQuery, queryTerms))
        .filter((match): match is RankedSearchMatch => match !== undefined)
        .sort(compareRankedMatches)
        .slice(0, RESULT_LIMIT);

      return Object.freeze(fullTextMatches.map(withoutScore));
    }
  });
}
