# Patch Manifest — CP09 JSON Paste and Parse Foundation

## Patch type

Incremental overlay patch for the approved CP08 project state.

## Application and services

- completes pasted-text cleaning;
- completes Markdown fence removal;
- completes balanced JSON object extraction;
- completes smart quote normalization fallback;
- completes safe syntax parsing and user-facing parse errors;
- exports the real import/export application and service boundaries.

## UI

- implements `PasteGeneratedJsonDialog`;
- activates `Paste generated JSON` from the vocabulary not-found state;
- wires the dialog into `VocabularyPage` without creating another primary route;
- adds responsive JSON paste, result, warning, and counter styling.

## Tests

- replaces the skipped pasted-JSON cleaner test;
- replaces the skipped paste-dialog test;
- adds parser tests;
- updates vocabulary not-found regression coverage.

## Dependency impact

- no new npm package;
- no `package.json` change;
- no `package-lock.json` supplied;
- no Rust or Tauri dependency change.
