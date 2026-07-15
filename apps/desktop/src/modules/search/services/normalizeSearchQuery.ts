import { normalizeApostrophes } from "./normalizeApostrophes";
import { normalizeHyphens } from "./normalizeHyphens";

const MAX_QUERY_LENGTH = 64;
const VALID_ENGLISH_WORD = /^[a-z]+(?:['-][a-z]+)*$/;

export type SearchQueryValidationCode =
  "empty" | "too-long" | "multiple-words" | "unsupported-characters";

export interface NormalizedSearchQuery {
  readonly raw: string;
  readonly normalized: string;
  readonly isValid: boolean;
  readonly validationCode?: SearchQueryValidationCode;
  readonly message?: string;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeSearchQuery(rawQuery: string): NormalizedSearchQuery {
  const compatibilityNormalized = rawQuery.normalize("NFKC");
  const punctuationNormalized = normalizeHyphens(normalizeApostrophes(compatibilityNormalized));
  const collapsed = collapseWhitespace(punctuationNormalized);
  const normalized = collapsed.toLocaleLowerCase("en-US");

  if (normalized.length === 0) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "empty",
      message: "Enter one English word to search your local vocabulary."
    };
  }

  if (normalized.length > MAX_QUERY_LENGTH) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "too-long",
      message: `Use a word shorter than ${MAX_QUERY_LENGTH + 1} characters.`
    };
  }

  if (normalized.includes(" ")) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "multiple-words",
      message: "Search for a single English word, not a phrase or sentence."
    };
  }

  if (!VALID_ENGLISH_WORD.test(normalized)) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "unsupported-characters",
      message: "Use English letters only. An internal apostrophe or hyphen is allowed."
    };
  }

  return {
    raw: rawQuery,
    normalized,
    isValid: true
  };
}
