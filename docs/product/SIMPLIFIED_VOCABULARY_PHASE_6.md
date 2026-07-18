# Simplified Vocabulary — Phase 6

Status: implemented on `feat/simplified-vocabulary-experience`

## Completed

- The full English Focus logo and brand name now navigate to Vocabulary home.
- Clicking the brand while a vocabulary detail is open resets the detail state and returns to the lookup home.
- The command bar's `Open Vocabulary` action performs the same reliable home reset.
- Library entry links now use a stable vocabulary detail URL with a `from=library` origin marker.
- Vocabulary detail URLs retain the selected word instead of immediately clearing the query string.
- Reloading a vocabulary detail URL reopens the same entry.
- Detail pages opened from Library show `Back to Library` and return to Library.
- Detail pages opened from search show `Back to vocabulary` and return to the lookup home.
- Successful searches and saved edits keep the current detail URL synchronized.
- Shared route construction and origin parsing helpers prevent navigation behavior from diverging between Library and Vocabulary.
- Navigation and brand-link tests were added.

## Compatibility

No vocabulary JSON, SQLite schema, metadata, or existing local entries are changed in this phase.

## Manual actions

No files need to be deleted manually in this phase.
