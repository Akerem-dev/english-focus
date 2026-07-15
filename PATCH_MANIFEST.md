# CP15 FIX01 Patch Manifest

## Import and preview fixes

- Removes default browser `<dd>` indentation from preview provenance values.
- Removes list indentation from Import Readiness and preview content lists.
- Left-aligns vocabulary preview statistics.
- Left-aligns Existing Entry and Imported Entry stat values in duplicate comparison.
- Removes the checkpoint-only Restart proof paragraph from the production save-success dialog.

## Library fixes

- Shows the Search library label so the search field aligns with all filters.
- Makes Clear selection a visible secondary button.
- Prevents toolbar text styling from recoloring button labels.
- Restores white text on Export selected JSON.
- Moves row checkboxes left to align with the Pick column.

## Files

- `apps/desktop/src/modules/import-export/overlays/VocabularyPersistenceDialog.tsx`
- `apps/desktop/src/modules/library/pages/LibraryPage.tsx`
- `apps/desktop/src/styles/json-import.css`
- `apps/desktop/src/styles/library.css`
- `apps/desktop/tests/components/import/VocabularyPersistenceDialog.test.tsx`
