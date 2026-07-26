# Windows system acceptance

English Focus has a separate Windows-only acceptance runner for checks that cannot be represented by browser preview tests alone.

## Run locally

From the repository root on Windows:

```powershell
npm run test:windows:system
```

The command builds fresh unsigned MSI and NSIS installers, installs Microsoft WinApp CLI when necessary, preserves existing English Focus user data, and then tests both installer families in isolation.

By default, the runner reinstalls the verified MSI after cleanup. Use the following in disposable environments or CI:

```powershell
npm run test:windows:system -- -LeaveUninstalled
```

To reuse existing release artifacts:

```powershell
npm run test:windows:system -- -SkipBuild
```

## Automated checks

For both NSIS and MSI, the runner verifies:

- release manifest, source commit, version, and SHA-256 checksums
- silent clean installation and uninstall registration
- installed application version and executable discovery
- Start menu shortcut creation
- launch of the installed native Tauri binary
- connection to the real local Rust runtime and SQLite database
- Vocabulary, Library, and Settings navigation
- an exact search for the bundled `maintain` entry
- Windows UI Automation accessibility-tree inspection
- absence of an associated Command Prompt or PowerShell window
- close and reopen behavior
- persistence of the recent search through the SQLite-backed native runtime
- complete uninstall cleanup of registration, executable, and shortcuts
- restoration of any user data that existed before the isolated run

Every run writes JSON and Markdown reports, command logs, UI Automation trees, and screenshots under:

```text
test-results/windows-system/<timestamp>/
```

The `Windows System Acceptance` GitHub workflow runs the same test on a Windows runner and uploads the evidence as an artifact even when a check fails.

## Tests that remain human release evidence

Automation must not claim to have performed perceptual or trust checks it cannot observe honestly. The following still require release evidence from a person or a configured production service:

- visual polish and subjective layout quality
- actual Narrator speech clarity and reading experience
- physical-monitor behavior across real DPI and hardware combinations
- SmartScreen reputation
- production Authenticode signing when no signing certificate is supplied
- upgrade compatibility when no previous stable installer is available

The detailed manual record remains in [`WINDOWS_RELEASE_SMOKE_TEST.md`](WINDOWS_RELEASE_SMOKE_TEST.md).
