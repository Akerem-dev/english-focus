# CP09 — JSON Paste and Parse Foundation

## Objective

Accept one vocabulary JSON object as pasted text, remove common AI wrappers locally, enforce a conservative input-size boundary, and report JSON syntax results without claiming schema validity or saving data.

## Implemented pipeline

1. reject text above 524,288 characters;
2. remove a UTF byte-order marker when present;
3. normalize CRLF/CR line endings;
4. trim outer whitespace;
5. remove a complete Markdown code fence;
6. extract the first balanced JSON object while respecting escaped quotes and braces inside strings;
7. parse the object with `JSON.parse`;
8. retry with smart double-quote normalization only when the original syntax parse fails;
9. require a top-level object;
10. expose detected top-level keys and an optional `word` hint.

## UI contract

The not-found state activates `Paste generated JSON`. The dialog:

- keeps all processing local;
- shows the expected word and safety limit;
- offers a large monospace paste field and character counter;
- reports cleanup transformations;
- reports syntax success or a user-facing parse error;
- warns when the detected word differs from the requested word;
- explicitly marks schema validation as not yet performed;
- does not save, import, or mutate vocabulary content.

## Deferred to CP10+

- Zod vocabulary-entry validation;
- semantic validation and quality inspection;
- correction-instruction generation;
- preview and duplicate resolution;
- SQLite persistence;
- file and vocabulary-pack import.
