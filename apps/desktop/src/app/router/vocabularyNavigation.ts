import { ROUTE_PATHS } from "./routeIds";

export type VocabularyRouteOrigin = "library";

const WORD_PARAM = "word";
const ORIGIN_PARAM = "from";

export function createVocabularyEntrySearchParams(
  normalizedWord: string,
  origin?: VocabularyRouteOrigin
): URLSearchParams {
  const params = new URLSearchParams({ [WORD_PARAM]: normalizedWord });

  if (origin !== undefined) {
    params.set(ORIGIN_PARAM, origin);
  }

  return params;
}

export function buildVocabularyEntryPath(
  normalizedWord: string,
  origin?: VocabularyRouteOrigin
): string {
  return `${ROUTE_PATHS.vocabulary}?${createVocabularyEntrySearchParams(
    normalizedWord,
    origin
  ).toString()}`;
}

export function getVocabularyRouteOrigin(
  searchParams: URLSearchParams
): VocabularyRouteOrigin | undefined {
  return searchParams.get(ORIGIN_PARAM) === "library" ? "library" : undefined;
}
