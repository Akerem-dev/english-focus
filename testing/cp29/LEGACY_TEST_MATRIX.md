# CP29 Legacy Data Matrix

The migration rehearsal must use real data produced by older application builds rather than invented current-schema JSON.

| Case | Source build | Required marker data | Expected after 0.9.0 upgrade |
|---|---|---|---|
| Fresh | none | none | current schema, bundled content available |
| Legacy SQLite | temporary 0.8.0 worktree | imported user word, core override, study metadata, settings | all preserved and migrated |
| Legacy backup | temporary 0.8.0 worktree | manual backup | validates and restores in 0.9.0 |
| Schema 2 backup | retained CP20/CP21 backup | vocabulary, metadata, settings | validates; activity absence accepted |
| Schema 3 backup | retained CP24+ backup | vocabulary, metadata, settings | validates and restores |
| Installer upgrade | 0.8.0 → 0.9.0 | CP29 marker note/tag/favorite | markers and backups preserved |
