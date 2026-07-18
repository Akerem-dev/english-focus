# User-Friendly Settings — Phase 1

Status: implemented on `feat/user-friendly-settings-language`

## Scope

This phase rewrites technical Settings language into plain, user-facing copy without changing application behavior or stored data.

## Completed

- Renamed retained backups to saved backups and safety backups to recovery copies.
- Replaced validation, checksum, schema, metadata, and explicit-confirmation language in the primary backup flow.
- Reworded activity privacy, compatibility, empty-state, and clearing messages.
- Renamed System diagnostics to App health in the user interface.
- Added user-facing names and summaries for diagnostic checks while preserving the technical report data underneath.
- Renamed Local data to My data and replaced internal storage terms with familiar descriptions.
- Simplified removal and reset guidance without weakening existing confirmations.
- Updated component and Playwright expectations for the new copy.

## Compatibility

- No SQLite schema changes.
- No settings migrations.
- No backup-format changes.
- No changes to restore, delete, reset, or diagnostic behavior.
- No vocabulary-data changes.

## Next phase

Phase 2 will simplify the visual hierarchy by removing unnecessary nested panels, status badges, and repeated framed surfaces.
