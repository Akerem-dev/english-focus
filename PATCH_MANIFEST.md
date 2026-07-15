# CP20 Patch Manifest

## Product behavior

- Manual backup creation from Settings → Data.
- Daily/weekly automatic backup check at application startup.
- Retained backup browser with counts, size, reason, and timestamp.
- Local integrity validation before restore.
- Explicit destructive restore confirmation.
- Automatic pre-restore safety backup.
- Transactional replacement of vocabulary entries, study metadata, and settings.
- Manual backup deletion with a separate confirmation.
- Retention: newest 7 automatic backups and newest 5 pre-restore backups; manual backups are protected.

## Storage format

- `kind`: `english-focus-backup`
- `backupVersion`: `1.0.0`
- `databaseSchemaVersion`: `2`
- checksum: FNV-1a 64-bit over the serialized backup data

## Dependencies

- No new npm dependency.
- No new Rust crate.
- No package-lock change.
