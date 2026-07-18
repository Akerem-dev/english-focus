# Simplified Vocabulary — Phase 7

Status: completed on `feat/simplified-vocabulary-experience`

## Completed

- Replaced the canonical vocabulary contract with the simplified learning model.
- Canonical entries now contain only identity, CEFR, part of speech, registers, meanings, pronunciation, word forms, concise bilingual usage guidance, three bilingual examples, optional etymology, provenance, and timestamps.
- Removed word family, collocations, related words, common mistakes, grammar-pattern collections, tense examples, sentence-form examples, preposition patterns, phrasal-verb sections, and idiom sections from the domain contract.
- Legacy V1 entries with ten examples remain readable. The compatibility reader keeps the first three examples and discards removed sections before canonical validation.
- Current saves, overrides, imports after normalization, packs, and exports write only the simplified canonical model.
- Added native compatibility for both old full V1 records and new simplified records without mutating existing SQLite rows during startup.
- Simplified duplicate comparison, duplicate merging, import preview, semantic validation, and quality inspection to use only retained fields.
- Simplified external-AI instruction preferences and removed obsolete word-family, common-mistake, and example-count settings from new writes.
- Legacy settings remain readable and are normalized to the simplified settings model before use.
- Regenerated native JSON Schemas and updated the reviewed core fixture checksum.
- Removed obsolete domain type files and their public exports.
- Updated stale browser tests to match the simplified Library and advanced JSON-import labels.
- Fixed the custom Library checkbox so native browser automation and keyboard interaction can reliably toggle selection.

## Compatibility boundary

- Old ten-example vocabulary JSON and SQLite content remain accepted at input boundaries.
- Removed legacy fields are ignored and are not written back by current versions.
- Existing learning and review metadata is still preserved internally because it belongs to a separate user-metadata migration boundary; it is not shown in the simplified UI.
- The bundled core record is still immutable. Editing it creates a local override.

## Verification

The repository Quality workflow completed successfully with repository-structure, forbidden-pattern, CSS-token, dead-code, formatting, lint, TypeScript, unit/component/integration test, and production-build checks.

Windows CI also completed successfully with native-schema freshness, release metadata, reviewed core content, performance tests, Microsoft Edge Playwright tests, bundle-budget verification, unsigned MSI and NSIS builds, installer verification, and installer artifact upload.

The generated unsigned Windows installer artifact is retained by GitHub Actions for fourteen days from the successful verification run.

## Deleted files

- `packages/domain/src/vocabulary/Collocation.ts`
- `packages/domain/src/vocabulary/CommonMistake.ts`
- `packages/domain/src/vocabulary/GrammarPattern.ts`
- `packages/domain/src/vocabulary/Idiom.ts`
- `packages/domain/src/vocabulary/PhrasalVerb.ts`
- `packages/domain/src/vocabulary/PrepositionPattern.ts`
- `packages/domain/src/vocabulary/RelatedWord.ts`
- `packages/domain/src/vocabulary/SentenceFormExample.ts`
- `packages/domain/src/vocabulary/TenseExample.ts`
- `packages/domain/src/vocabulary/WordFamilyItem.ts`

## Manual actions

Git users do not delete files manually; `git pull` applies the deletions. ZIP users must delete the files listed above after replacing the included files.
