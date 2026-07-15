# CP20 — Backup Creation, Restore Validation, and Retention

Status: TESTING

CP20 introduces retained local backups that contain user vocabulary entries, separate study metadata, and persistent application settings.

## Safety rules

- Backups remain inside the local application-data directory.
- Every restore validates backup kind, versions, counts, required fields, and an FNV-1a checksum.
- A pre-restore safety backup is created before any database mutation.
- Restore runs in one SQLite transaction.
- Manual backups are never removed by automatic retention.
