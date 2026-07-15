import type { VocabularyContentSource, VocabularyEntry } from "@platform/domain";

import {
  createFuzzySuggestions,
  normalizeSearchQuery,
  resolveInflectedForm,
  type SearchQueryValidationCode
} from "../services";

export type VocabularySearchMatchKind = "exact" | "alias";

export type SearchVocabularyResult =
  | {
      readonly kind: "found";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly entry: VocabularyEntry;
      readonly matchKind: VocabularySearchMatchKind;
      readonly matchedForm: string;
    }
  | {
      readonly kind: "not-found";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly suggestions: readonly string[];
    }
  | {
      readonly kind: "invalid";
      readonly query: string;
      readonly normalizedQuery: string;
      readonly validationCode: SearchQueryValidationCode;
      readonly message: string;
    };

export class SearchVocabulary {
  constructor(private readonly contentSource: VocabularyContentSource) {}

  execute(query: string): SearchVocabularyResult {
    const normalizedQuery = normalizeSearchQuery(query);

    if (!normalizedQuery.isValid) {
      return {
        kind: "invalid",
        query,
        normalizedQuery: normalizedQuery.normalized,
        validationCode: normalizedQuery.validationCode ?? "unsupported-characters",
        message: normalizedQuery.message ?? "Enter a valid English word."
      };
    }

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

    return {
      kind: "not-found",
      query,
      normalizedQuery: normalizedQuery.normalized,
      suggestions: createFuzzySuggestions(
        normalizedQuery.normalized,
        this.contentSource.listEntries()
      )
    };
  }
}
