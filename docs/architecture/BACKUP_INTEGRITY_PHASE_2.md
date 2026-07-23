# Backup integrity — Phase 2

This phase makes every backup that appears as available satisfy the same integrity checks required for restore.

## Guarantees

- Stored vocabulary entries, user metadata, and application settings are schema-validated before a backup file is created.
- A backup larger than 32 MB is rejected before a temporary or final file is written.
- Backup reads verify both filesystem metadata and the bytes actually read against the same 32 MB limit.
- Available-backup inventory includes only manifests with supported versions, valid counts, valid checksums, valid storage layers, and schema-valid records.
- Semantically invalid managed backup files remain on disk and appear in the unavailable-files list instead of silently disappearing.
- Automatic and pre-restore retention counts only integrity-checked backups and never deletes an invalid file as part of normal retention.
- Existing atomic temporary-write, durable sync, and rename behavior is preserved.

## Compatibility

- SHA-256 remains the checksum for newly created backups.
- Legacy FNV-1a checksums remain accepted during validation and restore.
- Database schema versions 2 and 3 remain supported by the backup reader.
- Public Tauri command payloads and TypeScript contracts are unchanged.

## Regression coverage

Native tests cover:

- schema-invalid stored vocabulary blocking backup creation;
- rejection of backups exceeding 32 MB before any file is created;
- exclusion of checksum-invalid manifests from the available list;
- retention limits that count only integrity-checked files;
- semantic-invalid manifests being treated as unavailable;
- current SHA-256 and legacy FNV-1a checksum behavior.
