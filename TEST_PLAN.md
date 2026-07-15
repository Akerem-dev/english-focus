# CP11 Test Plan

## Automatic verification

Run the complete PowerShell block supplied with the patch delivery. It stops at the first failing command.

Expected results after this patch:

- Environment check: passed
- TypeScript strict: passed
- Domain package: passed
- Schema package: passed
- Testing utilities: passed
- Desktop tests: 106 passed, 17 skipped
- Production build: passed
- Forbidden-pattern check: passed

## Blocking semantic flow

1. Search `allocate`.
2. Paste the reviewed `maintain.entry.json` fixture.
3. Pass syntax and schema checks.
4. Run content checks.
5. Confirm target mismatch and external-import provenance errors block continuation.
6. Open and copy the correction instruction.

## Warning-only flow

1. Copy `testing/manual/cp11-allocate-valid-with-warnings.entry.json` to the clipboard.
2. Paste it for the expected word `allocate`.
3. Pass syntax, schema, and semantic checks.
4. Confirm quality warnings are shown as non-blocking.
5. Confirm Preview remains disabled because preview is CP12.

## Regression

- Search normalization and inflections
- AI instruction preferences and clipboard
- JSON cleanup and syntax errors
- Schema failure and correction flow
- Three routes and sticky vocabulary navigation
