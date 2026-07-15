# CP14 FIX01 Test Plan

Run:

- `npm run test --workspace=@app/desktop -- VocabularyPersistenceDialog.test.tsx`
- `npm run build --workspace=@app/desktop`

Manual checks:

1. Open the JSON import dialog and confirm `Detected word` / `Schema validation` values are flush-left inside their cards.
2. Walk through a new-entry save flow and confirm the save dialog has proper card alignment, bold values, and label colons.
3. Walk through a duplicate-replace save flow and confirm the same modal styling appears there too.
4. Confirm no persistence behavior changed.
