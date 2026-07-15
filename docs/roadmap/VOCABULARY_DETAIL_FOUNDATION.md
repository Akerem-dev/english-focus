# CP06A — Read-only Vocabulary Detail Foundation

## Objective

Render the canonical reviewed `maintain` entry through the production Vocabulary route without
introducing persistence, user metadata mutation, fuzzy search, alias resolution, or import logic.

## Vertical slice

1. The Vocabulary route creates a validated read-only core content source.
2. The `GetVocabularyEntry` application use case performs an exact normalized-word lookup.
3. Searching for `maintain`, or selecting it from Recent searches, opens the found state.
4. Every visible section renders from the schema-valid entry rather than duplicated UI constants.
5. Back to vocabulary restores the initial route state.

## Rendered contract

- Word header, CEFR, parts of speech, registers, source, and review status
- UK and US pronunciation
- Four meanings and precise Turkish translations
- Morphology and inflected forms
- Word family
- Grammar summary and four validated patterns
- Tense examples, sentence forms, and preposition patterns
- Six collocations
- Five related words with Turkish distinctions
- Four common mistakes
- Exactly ten primary bilingual examples
- Reviewed etymology

Empty phrasal-verb and idiom arrays do not create empty interface sections.

## Deliberate boundaries

- Only exact `maintain` lookup is enabled.
- Unknown words do not yet enter not-found state.
- Alias and inflection resolution arrive in the search checkpoint.
- Favorite, copy, review, notes, tags, TTS, and persistence remain disabled until their own phases.
- No fourth primary route is introduced.
