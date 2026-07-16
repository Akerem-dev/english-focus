# English Focus 100-Entry Pilot Core Pack

## Purpose

CP28 installs the first versioned vocabulary collection bundled with English Focus. It validates the content pipeline before larger independently reviewed batches are produced after V1.

## Composition

- 100 immutable core entries.
- 1 deeply reviewed canonical entry: `maintain`.
- 99 pilot-validated A2–B2 entries covering common study, work, analysis, and communication vocabulary.
- 36 verbs, 32 nouns, and 32 adjectives.
- Exactly 10 bilingual primary examples per entry.
- Deterministic IDs, normalized words, source metadata, and content timestamps.

## Validation boundary

Every entry must pass:

1. strict vocabulary Zod schema validation;
2. normalized-word and identifier uniqueness checks;
3. cross-field semantic validation;
4. bilingual field and target-form consistency checks;
5. deterministic checksum and manifest checks;
6. production bundle budgets.

The 99 pilot entries intentionally remain `validated`, not `reviewed`. Their declared completeness boundary permits only these editorial warnings:

- one primary meaning;
- no etymology until a reliable source is reviewed;
- no word-family expansion yet;
- no related-word comparison yet.

No structural or semantic error is permitted.

## Separation from personal data

Core entries are read-only. SQLite continues to store user-created entries, overrides, favorites, tags, notes, learning status, review status, activity, and settings separately. Updating the bundled pack must not erase personal metadata.

## Files

- `pilot-core-v1.manifest.json` — version, counts, distributions, review sample, and checksums.
- `pilot-core-v1.batch-1.json` through `batch-4.json` — code-split content batches.
- `maintain.entry.json` — canonical reviewed fixture retained as the reference-quality entry.

## Scaling policy

This pilot is not the promised future 5,000-entry collection. Larger content batches begin after V1 is locked, using the same manifest, checksum, schema, semantic, and metadata-preservation boundaries.
