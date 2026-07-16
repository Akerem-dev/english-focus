# CP29 Test Plan

1. Run full regression with installer generation.
2. Move the developer's current app-data aside with `begin-isolated-rehearsal.ps1`.
3. Prepare a real legacy 0.8.0 build from the CP27 installer tag in an isolated Git worktree.
4. Install legacy NSIS and create marker vocabulary, metadata, settings and backup.
5. Capture app-data snapshot.
6. Install current 0.9.0 NSIS over legacy version.
7. Verify marker state, legacy backup, diagnostics and file preservation.
8. Repeat upgrade with MSI.
9. Verify reinstall, uninstall-data preservation and downgrade blocking.
10. Restore the developer's original app-data.
11. Complete the release-candidate checklist.
12. Commit the final tested code, build installers, then create and verify the RC lock.
