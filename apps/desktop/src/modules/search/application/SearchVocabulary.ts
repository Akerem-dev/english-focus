import type {
  VocabularyContentSource,
  VocabularyEntry,
  VocabularyUserMetadata
} from "@platform/domain";

import {
  createFuzzySuggestions,
  createVocabularySearchIndex,
  isDirectVocabularyWordQuery,
  normalizeSearchQuery,
  resolveInflectedForm,
  type SearchQueryValidationCode,
  type VocabularySearchField,
  type VocabularySearchIndex
} from "../services";

export type VocabularySearchMatchKind = "exact" | "alias" | "prefix" | "full-text";

export interface VocabularySearchMatch {
  readonly entry: VocabularyEntry;
  readonly matchKind: "prefix" | "full-text";
  readonly matchedField: VocabularySearchField;
  readonly matchedText: string;
}

export type SearchVocabularyResult =
  | {
      readonly kind: "found";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly entry: VocabularyEntry;
      readonly matchKind: "exact" | "alias";
      readonly matchedForm: string;
    }
  | {
      readonly kind: "matches";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly matches: readonly VocabularySearchMatch[];
    }
  | {
      readonly kind: "not-found";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly suggestions: readonly string[];
      readonly canCreateEntry: boolean;
    }
  | {
      readonly kind: "invalid";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly validationCode: SearchQueryValidationCode;
      readonly message: string;
    };

export class SearchVocabulary {
  private readonly searchIndex: VocabularySearchIndex;

  constructor(
    private readonly contentSource: VocabularyContentSource,
    metadata: readonly VocabularyUserMetadata[] = []
  ) {
    this.searchIndex = createVocabularySearchIndex(contentSource.listEntries(), metadata);
  }

  execute(query: string): SearchVocabularyResult {
    const normalizedQuery = normalizeSearchQuery(query);
    const directWordQuery = isDirectVocabularyWordQuery(query);

    if (!normalizedQuery.isValid) {
      return {
        kind: "invalid",
        query,
        normalizedQuery: normalizedQuery.normalized,
        validationCode: normalizedQuery.validationCode ?? "unsupported-characters",
        message: normalizedQuery.message ?? "Enter a valid local vocabulary search."
      };
    }

    if (directWordQuery) {
      const exactEntry = this.contentSource.getEntryByNormalizedWord(normalizedQuery.normalized);

      if (exactEntry !== undefined) {
        return {
          kind: "found",
          query,
          normalizedQuery: normalizedQuery.normalized,
          entry: exactEntry,
          matchKind: "exact",
          matchedForm: exactEntry.word
        };
      }

      const resolvedForm = resolveInflectedForm(
        this.contentSource.listEntries(),
        normalizedQuery.normalized
      );

      if (resolvedForm !== undefined) {
        return {
          kind: "found",
          query,
          normalizedQuery: normalizedQuery.normalized,
          entry: resolvedForm.entry,
          matchKind: "alias",
          matchedForm: resolvedForm.matchedForm
        };
      }
    }

    const matches = this.searchIndex.search(normalizedQuery.normalized);
    if (matches.length > 0) {
      return {
        kind: "matches",
        query,
        normalizedQuery: normalizedQuery.normalized,
        matches
      };
    }

    return {
      kind: "not-found",
      query,
      normalizedQuery: normalizedQuery.normalized,
      canCreateEntry: directWordQuery,
      suggestions: directWordQuery
        ? createFuzzySuggestions(normalizedQuery.normalized, this.contentSource.listEntries())
        : Object.freeze([])
    };
  }
}
