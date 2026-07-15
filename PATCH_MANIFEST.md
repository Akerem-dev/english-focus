# CP07 Search Vertical Slice — Patch Manifest

## Purpose

Complete Phase 5 of the master roadmap as one cohesive, testable local search vertical slice.

## Source changes

### Search application and services

- `apps/desktop/src/modules/search/application/SearchVocabulary.ts`
- `apps/desktop/src/modules/search/application/index.ts`
- `apps/desktop/src/modules/search/components/SearchSuggestions.tsx`
- `apps/desktop/src/modules/search/components/index.ts`
- `apps/desktop/src/modules/search/index.ts`
- `apps/desktop/src/modules/search/services/createFuzzySuggestions.ts`
- `apps/desktop/src/modules/search/services/index.ts`
- `apps/desktop/src/modules/search/services/normalizeApostrophes.ts`
- `apps/desktop/src/modules/search/services/normalizeHyphens.ts`
- `apps/desktop/src/modules/search/services/normalizeSearchQuery.ts`
- `apps/desktop/src/modules/search/services/resolveInflectedForm.ts`
- `apps/desktop/src/modules/search/state/index.ts`
- `apps/desktop/src/modules/search/state/searchState.ts`

### Vocabulary UI integration

- `apps/desktop/src/modules/vocabulary/components/VocabularyInvalidSearchState.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularyNotFoundState.tsx`
- `apps/desktop/src/modules/vocabulary/components/VocabularySearchingState.tsx`
- `apps/desktop/src/modules/vocabulary/pages/VocabularyPage.tsx`
- `apps/desktop/src/styles/route-pages.css`

### Tests

- `apps/desktop/tests/components/vocabulary/VocabularyPage.test.tsx`
- `apps/desktop/tests/unit/search/normalize-search-query.test.ts`
- `apps/desktop/tests/unit/search/resolve-inflected-form.test.ts`
- `apps/desktop/tests/unit/search/search-vocabulary.test.ts`

### Documentation

- `docs/roadmap/SEARCH_VERTICAL_SLICE.md`
- root checkpoint documents.

## Dependency changes

None.

## Deleted files

None.
