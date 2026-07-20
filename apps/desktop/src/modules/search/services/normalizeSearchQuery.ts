import { normalizeApostrophes } from "./normalizeApostrophes";
import { normalizeHyphens } from "./normalizeHyphens";

const MAX_QUERY_LENGTH = 96;
const VALID_LOCAL_SEARCH = /^[a-z0-9]+(?:[ '-][a-z0-9]+)*$/;
const DIRECT_ENGLISH_WORD = /^[a-z]+(?:['-][a-z]+)*$/;
const COMBINING_MARKS = /\p{M}+/gu;

export type SearchQueryValidationCode = "empty" | "too-long" | "unsupported-characters";

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

function foldSearchCharacters(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replaceAll("ı", "i")
    .normalize("NFC");
}

export function isDirectVocabularyWordQuery(value: string): boolean {
  const normalized = normalizeHyphens(normalizeApostrophes(value.normalize("NFKC")))
    .trim()
    .toLocaleLowerCase("en-US");
  return DIRECT_ENGLISH_WORD.test(normalized);
}

export function normalizeSearchQuery(rawQuery: string): NormalizedSearchQuery {
  const compatibilityNormalized = rawQuery.normalize("NFKC");
  const punctuationNormalized = normalizeHyphens(normalizeApostrophes(compatibilityNormalized));
  const collapsed = collapseWhitespace(punctuationNormalized);
  const normalized = foldSearchCharacters(collapsed);

  if (normalized.length === 0) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "empty",
      message: "Enter a word or a short phrase to search your local vocabulary."
    };
  }

  if (normalized.length > MAX_QUERY_LENGTH) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "too-long",
      message: `Keep the search shorter than ${MAX_QUERY_LENGTH + 1} characters.`
    };
  }

  if (!VALID_LOCAL_SEARCH.test(normalized)) {
    return {
      raw: rawQuery,
      normalized,
      isValid: false,
      validationCode: "unsupported-characters",
      message: "Use letters, numbers, spaces, apostrophes, or hyphens only."
    };
  }

  return {
    raw: rawQuery,
    normalized,
    isValid: true
  };
}
