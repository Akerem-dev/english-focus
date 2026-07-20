export { createFuzzySuggestions } from "./createFuzzySuggestions";
export { createVocabularySearchIndex } from "./createVocabularySearchIndex";
export type {
  IndexedVocabularySearchMatch,
  IndexedVocabularySearchMatchKind,
  VocabularySearchField,
  VocabularySearchIndex
} from "./createVocabularySearchIndex";
export {
  isDirectVocabularyWordQuery,
  normalizeSearchQuery
} from "./normalizeSearchQuery";
export type { SearchQueryValidationCode } from "./normalizeSearchQuery";
export { normalizeSearchText, tokenizeSearchText } from "./normalizeSearchText";
export { resolveInflectedForm } from "./resolveInflectedForm";
