# Checkpoint CP09 — JSON Paste and Parse Foundation

## Status

TESTING

## Locked baseline

- CP01 — public npm installation
- CP02 — browser runtime
- CP03 — native Tauri runtime
- CP04 — design system and three-route application shell
- CP05 — vocabulary contract, schemas, fixture, and content source
- CP06 — read-only vocabulary detail experience
- CP07 — local search vertical slice
- CP08 — external-AI instruction and clipboard bridge

## Objective

Turn the not-found flow into a safe local JSON paste experience that cleans common wrappers and verifies JSON syntax without importing data prematurely.

## Included

- active `Paste generated JSON` action;
- accessible JSON paste dialog;
- 524,288-character safety limit;
- BOM, whitespace, line-ending, Markdown-fence, and surrounding-text cleanup;
- balanced first-object extraction;
- smart double-quote fallback;
- safe top-level-object parsing;
- detected-word and mismatch reporting;
- cleanup summary and syntax-result UI;
- regression tests for the cleaner, parser, dialog, and vocabulary not-found state.

## Explicitly not included

- vocabulary Zod schema validation;
- semantic or quality validation;
- correction instructions;
- vocabulary preview;
- duplicate resolution;
- file import, pack import, or persistence.

## Exit criteria

CP09 locks after all automated checks pass and the user verifies valid, fenced, wrapped, malformed, mismatched, clear, and close flows in the native window.
