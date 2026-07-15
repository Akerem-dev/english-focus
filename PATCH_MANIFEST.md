# CP14 FIX01 Patch Manifest

## Fixes

- Adds missing visual styles for the persistence confirmation modal.
- Converts the persistence summary into consistently aligned metadata cards.
- Restores stronger label/value hierarchy in the save modal.
- Adds explicit trailing colons to save-summary labels.
- Removes default browser `<dd>` indentation from the JSON syntax-passed panel.
- Keeps CP14 SQLite persistence behavior unchanged.

## Files

- `apps/desktop/src/modules/import-export/overlays/VocabularyPersistenceDialog.tsx`
- `apps/desktop/src/styles/json-import.css`
- `apps/desktop/tests/components/import/VocabularyPersistenceDialog.test.tsx`
