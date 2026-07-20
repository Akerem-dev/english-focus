import type { VocabularyEntry } from "@platform/domain";

import type { VocabularySearchMatch, VocabularySearchMatchKind } from "../application";
import type { SearchQueryValidationCode } from "../services";

export type VocabularySearchState =
  | { readonly kind: "initial" }
  | { readonly kind: "typing"; readonly query: string }
  | { readonly kind: "searching"; readonly query: string }
  | {
      readonly kind: "found";
      readonly query: string;
      readonly entry: VocabularyEntry;
      readonly matchKind: Extract<VocabularySearchMatchKind, "exact" | "alias">;
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
      readonly validationCode: SearchQueryValidationCode;
      readonly message: string;
    }
  | {
      readonly kind: "repository-error";
      readonly query: string;
      readonly message: string;
    };
