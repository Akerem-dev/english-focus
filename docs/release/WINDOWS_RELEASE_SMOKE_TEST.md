# Windows Release Smoke Test

Use this protocol on the final MSI and NSIS artifacts before publishing a stable English Focus release. Automated checks remain mandatory, but they do not replace installation, persistence, accessibility, and operating-system verification on a real Windows machine.

## Test record

Record the following before testing:

| Field             | Value      |
| ----------------- | ---------- |
| App version       |            |
| Source commit     |            |
| Installer type    | MSI / NSIS |
| Installer SHA-256 |            |
| Windows version   |            |
| Display scale     |            |
| Tester            |            |
| Date              |            |

A release passes only when every required item below passes or has an explicitly accepted release note.

## 1. Artifact integrity

- [ ] `release-manifest.json` reports the expected version and source commit.
- [ ] `SHA256SUMS.txt` contains both installer files.
- [ ] Recomputed SHA-256 values match the published values.
- [ ] The MSI and NSIS filenames contain the expected version.
- [ ] Authenticode verification succeeds for a publishable release.
- [ ] No stale installer or executable from an older build is present in the artifact directory.

## 2. Clean installation

Run this section once with the MSI and once with the NSIS installer.

- [ ] Installation completes without an unexpected error.
- [ ] NSIS uses current-user installation and does not request administrator access unexpectedly.
- [ ] The installed application has the correct name, icon, publisher, and version.
- [ ] English Focus opens from the Start menu.
- [ ] No Command Prompt or PowerShell window appears behind the application.
- [ ] The main window opens centered at a usable size.
- [ ] The application does not require an account, API key, or internet connection.
- [ ] Vocabulary, Library, and Settings routes open without console-like error output.

## 3. Local persistence

- [ ] Import or create one valid vocabulary entry.
- [ ] Add a note, tag, and favorite state.
- [ ] Change one application setting.
- [ ] Close the application completely.
- [ ] Reopen English Focus from the Start menu.
- [ ] The vocabulary entry, metadata, and setting remain unchanged.
- [ ] Repeated open and close cycles do not create duplicate records.

## 4. Search and library workflow

- [ ] Exact search opens the expected entry.
- [ ] Alias, inflection, prefix, and fuzzy-assisted paths behave as documented where applicable.
- [ ] Library search matches words, translations, examples, tags, and notes.
- [ ] CEFR, favorites, alphabet, and sort controls update the result set correctly.
- [ ] Selecting a checkbox does not open the vocabulary entry.
- [ ] Opening a word from Library shows its detail state.
- [ ] Keyboard focus remains visible throughout the workflow.

## 5. Import and export round trip

- [ ] Export a selected vocabulary pack.
- [ ] Export the full local library when it is within the documented transfer limits.
- [ ] Import each exported file into a clean local data state.
- [ ] Entry counts and vocabulary content match the export.
- [ ] Invalid JSON is rejected without changing stored data.
- [ ] A pack above 500 entries is rejected before an unusable export file is written.
- [ ] A file above the transfer-size limit is rejected with a clear message.
- [ ] Duplicate handling follows the selected skip or replace strategy.

## 6. Backup and restore

- [ ] Create a manual backup.
- [ ] Confirm the backup appears in the inventory with the expected counts.
- [ ] Modify or delete a test entry after creating the backup.
- [ ] Validate and restore the backup.
- [ ] The restored entry, metadata, and settings match the backup state.
- [ ] A pre-restore safety backup is created when current data is valid.
- [ ] A damaged or checksum-mismatched backup is rejected.
- [ ] Restore failure does not partially replace the current database.
- [ ] Backup retention does not remove valid manual backups unexpectedly.

## 7. Failure handling

- [ ] Attempt an export to a read-only or unavailable location; the application reports failure without crashing.
- [ ] Attempt to import an unsupported file type; no data is written.
- [ ] Run diagnostics with normal local data; no raw SQLite or filesystem details are exposed.
- [ ] Temporarily make the backup directory unavailable and verify diagnostics report an incomplete check rather than a healthy result.
- [ ] Reset and other destructive actions require explicit confirmation.
- [ ] Cancelling a destructive dialog leaves data unchanged.

## 8. Accessibility and display

Run the application at 100%, 125%, and 150% Windows display scaling.

- [ ] Text, controls, dialogs, and tables remain readable without clipping.
- [ ] The application is usable with `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape` only.
- [ ] Dialog focus is trapped while open and returns to the invoking control after close.
- [ ] Checkboxes, buttons, fields, and status messages have meaningful accessible names.
- [ ] Focus indicators remain visible against every surface.
- [ ] Reduced-motion preference removes non-essential movement.
- [ ] Long words, translations, notes, and error messages wrap without breaking the layout.

## 9. Upgrade and uninstall

When a previous stable installer is available:

- [ ] Install the previous version and create local test data.
- [ ] Install the new version over it using the same installer family.
- [ ] Upgrade completes without allowing an unintended downgrade.
- [ ] Existing data remains available after the upgrade.
- [ ] The application reports the new version.

For uninstall:

- [ ] Uninstall completes without an error.
- [ ] Start-menu shortcuts and installed binaries are removed.
- [ ] Record whether local application data is retained or removed; the observed behavior must match release documentation.

## 10. Final acceptance

- [ ] `npm run quality:release` passed for the tested source commit.
- [ ] The MSI smoke test passed.
- [ ] The NSIS smoke test passed.
- [ ] All accepted exceptions are documented in release notes.
- [ ] Screenshots used in the README were captured from this verified build.
- [ ] The installer hashes in the release match the tested artifacts.

## Evidence

Keep the completed checklist, screenshots of failures, installer hashes, and the tested `release-manifest.json` with the release record. Never include private certificates, signing keys, personal paths, or user vocabulary data in public evidence.
