# CP10 — Schema Validation & Correction Instruction

Status: **TESTING**

## Goal

Turn one safely parsed JSON object into a strict, local, versioned vocabulary-schema result without saving anything yet.

## Added

- Zod vocabulary schema validation use case
- Stable import-issue model with readable JSON paths
- Detailed validation result dialog
- Provider-independent correction instruction builder
- Correction instruction dialog and local clipboard flow
- Success and failure regression tests

## Explicitly not included

- Semantic validation
- Content quality inspection
- Preview approval
- Duplicate handling
- SQLite persistence
- Library insertion

## Lock condition

CP10 becomes locked only after automatic tests, schema-failure UI, correction clipboard flow, and schema-success UI all pass on Windows.
