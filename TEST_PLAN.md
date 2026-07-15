# CP24 Test Plan

## Automated gate

Run the complete PowerShell block supplied with the patch. All TypeScript, domain, schema, testing, desktop, production-build, and forbidden-pattern checks must pass before CP24 is locked.

## Native functional checks

1. Open `maintain`; Settings → Privacy & activity should show `Viewed vocabulary entry` and target `maintain`.
2. Trigger favorite, study-details save, vocabulary export, Library copy/export, settings change, backup creation, and diagnostics.
3. Verify new activity appears without reloading Settings.
4. Test all area filters.
5. Confirm the timeline contains no personal note text, definitions, examples, JSON, filenames, or paths.
6. Close and reopen English Focus; retained activity must survive.
7. Clear history:
   - clear button disabled before confirmation;
   - confirmation enables it;
   - vocabulary, metadata, settings, and backups remain unchanged.
8. Backup exclusion:
   - create activity and a backup;
   - clear activity;
   - restore that backup;
   - old activity must not return; only the new restore action may be recorded.
9. Existing schema-2 backups must still validate.
10. Run Diagnostics; schema version should be `3` and `activity_log` should not be reported missing.

## Visual checks

- Diagnostics and Privacy & activity panels span the Settings grid.
- Filter, privacy note, activity cards, and clear boundary align correctly.
- Long labels and targets wrap without horizontal scrolling.
- Dark theme and reduced motion remain correct.
- At narrow widths, toolbar and clear controls stack vertically.
