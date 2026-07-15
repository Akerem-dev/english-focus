# CP16 Patch Manifest

## Included

- Active Import button in the persistent top bar.
- Local `.json` file picker with extension, character-limit, syntax, and detected-word gates.
- File contents are handed to the existing validated import wizard without uploading anything.
- File name is shown inside the import workflow.
- Successful imported entries can deep-link to Vocabulary detail.
- Vocabulary detail includes direct `Export JSON`.
- Export filenames are deterministic and human-readable.

## Excluded

- Multi-entry packs.
- Pack progress and cancellation.
- Import history.
- Backup and restore.

## Dependencies

No new npm or Rust dependency.
