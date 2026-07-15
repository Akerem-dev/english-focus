# CHECKPOINT — CP24 Local Activity & Privacy

Status after overlay: `READY_FOR_USER_TEST`

## Result

English Focus keeps a bounded, privacy-safe local timeline of important actions without adding a fourth route.

The timeline stores only:

- activity id;
- activity kind;
- application area;
- short safe label;
- optional normalized vocabulary word;
- timestamp.

It never stores personal notes, definitions, examples, pasted JSON, generated instructions, filenames, file paths, or backup contents.

## Database

- SQLite schema version: `3`
- New table: `activity_log`
- Database retention: newest 250 records
- Settings view: newest 100 records
- Activity is intentionally excluded from vocabulary exports and local backup payloads.
- New backups identify schema `3`; legacy schema `2` backups remain accepted.

## Next checkpoint

CP25 — Selective local-data deletion, privacy controls, and destructive-action safeguards.
