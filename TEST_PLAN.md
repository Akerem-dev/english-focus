# CP25 Test Plan

1. Run all automated workspace checks.
2. Confirm local counts match Library, metadata, activity, and backup state.
3. Verify final action stays disabled until category, acknowledgement, and phrase are valid.
4. Clear study details and confirm vocabulary remains.
5. Remove a user vocabulary entry and confirm bundled core vocabulary remains.
6. Remove an override and confirm the bundled core entry returns.
7. Reset settings and confirm defaults persist after restart.
8. Clear activity and confirm other local data remains.
9. Delete retained backups only after typing `DELETE BACKUPS`.
10. Run full reset with safety backup and confirm backups are preserved.
11. Restore the safety backup and confirm vocabulary, metadata, and settings return.
12. Verify dark theme, reduced motion, narrow-window layout, and no horizontal overflow.
