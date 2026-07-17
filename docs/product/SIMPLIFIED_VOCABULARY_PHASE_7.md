# Simplified Vocabulary — Phase 7

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- Replaced the canonical vocabulary contract with the simplified learning model.
- Canonical entries now contain only identity, CEFR, part of speech, registers, meanings, pronunciation, word forms, concise bilingual usage guidance, three bilingual examples, optional etymology, provenance, and timestamps.
- Removed word family, collocations, related words, common mistakes, grammar-pattern collections, tense examples, sentence-form examples, preposition patterns, phrasal-verb sections, and idiom sections from the domain contract.
- Legacy V1 entries with ten examples remain readable. The compatibility reader keeps the first three examples and discards removed sections before canonical validation.
- Current saves, overrides, imports after normalization, packs, and exports write only the simplified canonical model.
- Added native compatibility for both old full V1 records and new simplified records without mutating existing SQLite rows during startup.
- Simplified duplicate comparison, duplicate merging, import preview, semantic validation, and quality inspection to use only retained fields.
- Simplified external-AI instruction preferences and removed obsolete word-family/common-mistake/example-count settings from new writes.
- Legacy settings remain readable and are normalized to the simplified settings model before use.
- Regenerated native JSON Schemas and updated the reviewed core fixture checksum.
- Removed obsolete domain type files and their public exports.
- Strengthened the Quality workflow so piped command failures are preserved and per-stage reports are uploaded.

## Compatibility boundary

- Old ten-example vocabulary JSON and SQLite content remain accepted at input boundaries.
- Removed legacy fields are ignored and are not written back by current versions.
- Existing learning/review metadata is still preserved internally because it belongs to a separate user-metadata migration boundary; it is not shown in the simplified UI.
- The bundled core record is still immutable. Editing it creates a local override.

## Verification

Local verification completed for structure, forbidden patterns, CSS tokens, dead code, formatting, lint, native-schema freshness, release metadata, core content, TypeScript, unit/component/integration tests, performance tests, production web build, and bundle budget.

The local container did not include Microsoft Edge, so Playwright browser execution and the Windows MSI/NSIS build are verified through CI rather than claimed from the Linux container.

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
