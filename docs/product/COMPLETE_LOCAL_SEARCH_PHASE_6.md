# Complete local search — Phase 6

Status: implemented on `feat/complete-local-search`.

## Scope

This phase completes the search order already documented by the product architecture. Exact and
inflected English-word lookup remain unchanged, while prefix and full-text results now cover the
complete local vocabulary surface.

## Search index

- Builds one immutable in-memory index from the active layered vocabulary and user-owned metadata.
- Rebuilds automatically when local vocabulary or metadata changes.
- Keeps exact word and alias resolution ahead of approximate matches.
- Returns at most 12 deterministically ranked matches.
- Ranks word, alias, and inflection prefixes ahead of translations, tags, definitions, and notes.
- Shows the strongest matched field and a restrained local preview for each result.

## Searchable content

- word and normalized word;
- aliases and morphology inflections;
- Turkish translations;
- English definitions;
- personal tags;
- personal notes.

## Query compatibility

- Accepts a single English word, a Turkish search term, or a short multi-word phrase.
- Normalizes compatibility punctuation, whitespace, case, and Turkish diacritics.
- Treats `sürdürmek` and `surdurmek` as equivalent search input.
- Keeps fuzzy spelling suggestions limited to single English-word searches.

## Interface behavior

- Exact and alias matches continue to open the vocabulary entry immediately.
- Prefix and full-text matches remain on the search page until the user chooses an entry.
- Result rows show the word, first Turkish translation, CEFR level, match source, and local preview.
- The result surface uses typography, dividers, and restrained spacing rather than chips or dashboard
  decoration.

## Coverage

- Query normalization tests for phrases and Turkish text.
- Prefix, translation, definition, tag, note, and fuzzy-priority tests.
- Component coverage for the ranked result surface.
- Library search coverage using the same accent-insensitive token normalization.

## Safety boundary

- No SQLite schema or backup-format changes.
- No vocabulary or metadata records are rewritten for indexing.
- Notes and tags remain local and are used only to build the in-memory index.
- Search results never include undeclared metadata fields.
