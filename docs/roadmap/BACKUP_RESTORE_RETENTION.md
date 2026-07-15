# Backup, Restore, and Retention

CP20 stores versioned JSON backups under the English Focus application-data directory. The format is independent of the live SQLite file so restore validation can inspect content before a transaction begins.

Restore order:

1. Read the selected retained backup.
2. Validate file identity, versions, counts, required fields, and checksum.
3. Create a pre-restore safety backup from the current database.
4. Replace entries, metadata, and settings inside one SQLite transaction.
5. Refresh all React persistence providers.

Retention never deletes manual backups automatically.
