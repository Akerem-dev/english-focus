# CP25 Patch Manifest

## Scope

- Selective deletion for study metadata, user vocabulary, overrides, settings, activity, and backups.
- Full local reset preset that preserves bundled core vocabulary and retained backups.
- Exact SQLite and backup-file counts before deletion.
- Three-step confirmation: category selection, review acknowledgement, typed phrase.
- Optional safety backup before vocabulary, metadata, or settings deletion.
- One SQLite transaction for database categories.
- Provider refresh after successful deletion.
- Toast and privacy-safe activity feedback.

## Boundaries

- No new npm dependency.
- No new Rust crate.
- No database schema migration.
- No new route.
- Core vocabulary files are never deleted.
- Backup deletion is explicit and cannot be combined with safety-backup creation.
