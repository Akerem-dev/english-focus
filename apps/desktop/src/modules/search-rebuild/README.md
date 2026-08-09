# Search Rebuild presentation module

This directory owns only the Word Valley Search presentation layer.

It deliberately does **not** reimplement search, persistence, routing, activity logging, metadata,
or assistant generation. Those stay in the existing application/domain/infrastructure modules:

- `modules/search/application/SearchVocabulary.ts`
- `modules/search/services/*`
- `modules/search/state/*`
- `modules/vocabulary/pages/VocabularyPage.tsx`
- `modules/vocabulary/pages/VocabularyFoundRoute.tsx`
- `modules/assistant/*`

The vocabulary route keeps its existing controller contract and renders this module through thin
adapters. All CSS is directly imported and namespaced with `wvsr-` so legacy `wv84-*` presentation
rules are not a dependency of the rebuild.
