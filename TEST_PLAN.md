# CP20 Test Plan

## Automated

- environment check
- TypeScript strict typecheck
- domain, schema, testing, and desktop tests
- production frontend build
- forbidden-pattern scan

## Native manual

1. Create a manual backup.
2. Confirm it appears in Manage backups.
3. Validate it and confirm integrity passes.
4. Change one piece of study metadata and one setting.
5. Restore the earlier backup.
6. Confirm vocabulary, metadata, and settings return to the backed-up state.
7. Confirm a pre-restore safety backup appears.
8. Restart the application and confirm restored state persists.
9. Delete a selected backup only after the deletion checkbox is enabled.
