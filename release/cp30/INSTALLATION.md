# Installing English Focus 1.0.0 on Windows

## Recommended installer

Use the NSIS `.exe` installer for a normal current-user installation. The MSI package is also provided for Windows Installer-based deployment.

Do not install both package types simultaneously. Remove one package type before testing the other.

## Existing users

Installing 1.0.0 over the tested 0.9.0 build should preserve local vocabulary, study metadata, settings, activity history and retained backups.

## Unsigned build warning

When the installer is unsigned, Windows may show `Unknown publisher` or `Windows protected your PC`. Verify the SHA-256 value against the supplied checksum and final release lock before continuing.

## Local data

Uninstalling the application is designed to preserve app-data so a later reinstall can recover the local library. Use the application's explicit Local data reset controls when permanent removal is intended.
