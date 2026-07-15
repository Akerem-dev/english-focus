# CP10 Test Plan

## Automatic test block

Run the complete PowerShell block supplied with the patch delivery. It stops at the first failure.

Expected results:

- Domain: 2 passed
- Schemas: 14 passed, 2 skipped
- Testing: 4 passed
- Desktop: 89 passed, 19 skipped
- Production build: passed
- Forbidden-pattern check: passed

## Native failure flow

1. Search for `allocate`.
2. Open **Paste generated JSON**.
3. Paste `{"schemaVersion":"1.0.0","word":"allocate"}`.
4. Check syntax.
5. Validate schema.
6. Confirm a scrollable issue list with readable paths.
7. Open the correction instruction.
8. Copy it and paste into Notepad.
9. Return to issues, then edit the JSON.

## Native success flow

Copy `apps/desktop/src/content/core/entries/maintain.entry.json` to the clipboard and paste it while the expected word is `allocate`.

- Syntax must pass.
- Schema must pass.
- The target-word mismatch may remain as a warning because semantic validation is CP11.
- Preview stays disabled.
- Nothing is saved to Library.
