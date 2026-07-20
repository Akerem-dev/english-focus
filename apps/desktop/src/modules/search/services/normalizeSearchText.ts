import { normalizeApostrophes } from "./normalizeApostrophes";
import { normalizeHyphens } from "./normalizeHyphens";

const COMBINING_MARKS = /\p{M}+/gu;
const NON_SEARCH_CHARACTERS = /[^a-z0-9]+/g;

export function normalizeSearchText(value: string): string {
  return normalizeHyphens(normalizeApostrophes(value.normalize("NFKC")))
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replaceAll("ı", "i")
    .replace(NON_SEARCH_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearchText(value: string): readonly string[] {
  const normalized = normalizeSearchText(value);
  return normalized.length === 0 ? Object.freeze([]) : Object.freeze(normalized.split(" "));
}
