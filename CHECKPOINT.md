# CP11 — Semantic Validation & Quality Inspection

Status: **TESTING**

## Goal

Run target-aware, cross-field validation after the versioned Zod schema passes, then surface non-blocking quality warnings without saving anything.

## Added

- Target-word and normalized-word consistency checks
- External import provenance checks
- Morphology, alias, word-family, related-word, example, collocation, grammar, and timestamp consistency checks
- Bilingual optional-field pairing rules
- Non-blocking vocabulary quality inspection
- Dedicated content-validation result dialog
- Correction/improvement instruction support for semantic errors and quality warnings
- Manual schema-valid `allocate` fixture for Windows verification
- Regression tests for semantic, quality, UI, and correction flows

## Explicitly not included

- Human factual review of language claims
- Vocabulary preview approval
- Duplicate handling
- SQLite persistence
- Library insertion
- Validation-status mutation

## Lock condition

CP11 becomes locked only after all automatic tests, target-mismatch blocking, warning-only continuation, correction clipboard, and regression flows pass on Windows.
