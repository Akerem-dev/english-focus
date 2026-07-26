# Testing and final verification

English Focus uses layered verification rather than one test type pretending to cover the entire desktop application.

## Automated V1 feature coverage

The machine-readable matrix in [`testing/feature-coverage.json`](../testing/feature-coverage.json) maps every declared V1 capability to executable evidence in the repository.

The matrix covers:

- vocabulary search, inflections, detail navigation, and direct editing
- the missing-word instruction and JSON correction flow
- favorites, tags, personal notes, view metadata, and activity recording
- Library filtering, sorting, entry navigation, selection, and bulk export
- single-entry and vocabulary-pack import/export
- duplicate comparison and replacement decisions
- Settings navigation and preference persistence
- backup inventory, validation, restore, recovery, and retention
- diagnostics, safe maintenance, selective removal, and guarded reset
- command bar, keyboard navigation, route-aware shortcuts, and undo
- accessibility semantics, focus behavior, responsive desktop layouts, and reduced motion
- versioned SQLite migrations and TypeScript–Rust contracts
- bundled core-content validation
- Windows release configuration and artifact checks
- search, Library, and import performance budgets

`npm run check:feature-coverage` fails when a required capability loses its mapped test evidence, when a referenced file disappears, or when the expected test marker is removed. GitHub runs this check as part of the normal Quality workflow.

## Complete automated release gate

Run the full cross-workspace gate:

```powershell
npm run quality:release
```

This runs structure, migration, forbidden-pattern, CSS-token, dead-code, feature-coverage, formatting, lint, generated native-schema, release-metadata, core-content, TypeScript, unit, component, integration, accessibility, performance, production-build, Playwright, and bundle-budget checks.

Run the native Rust gate:

```powershell
cargo fmt `
  --manifest-path apps/desktop/src-tauri/Cargo.toml `
  --all `
  -- `
  --check

cargo test `
  --manifest-path apps/desktop/src-tauri/Cargo.toml `
  --all-targets `
  --all-features

cargo clippy `
  --manifest-path apps/desktop/src-tauri/Cargo.toml `
  --all-targets `
  --all-features `
  -- `
  -D warnings
```

The GitHub Quality workflow enforces the application gate, Microsoft Edge Playwright flows, Rust formatting, Clippy, and native tests on pull requests and `main` pushes.

## One-command Windows final verification

From a clean branch on Windows:

```powershell
npm run verify:final
```

The command installs the locked dependencies, runs the complete release gate, removes stale release outputs, builds fresh unsigned MSI and NSIS installers, verifies the collected artifacts, runs every Rust target and feature, denies clippy warnings, scans for conflict markers, and confirms that tracked files remain clean.

Unsigned installers produced by this command are local rehearsal artifacts. They must not be published as a stable release.

To run the same code checks without rebuilding installers:

```powershell
npm run verify:final -- -SkipInstaller
```

## Automated Windows system acceptance

Run the installed MSI and NSIS packages through the native Windows acceptance runner:

```powershell
npm run test:windows:system
```

This test preserves existing English Focus user data, builds and verifies fresh installers, installs both package families, drives the installed Tauri application through Windows UI Automation, verifies the local Rust runtime and SQLite persistence, captures screenshots and accessibility trees, uninstalls each package, restores user data, and writes a machine-readable report.

The full behavior and command options are documented in [`release/WINDOWS_SYSTEM_ACCEPTANCE.md`](release/WINDOWS_SYSTEM_ACCEPTANCE.md). GitHub runs the same process in the `Windows System Acceptance` workflow and uploads reports, logs, UI trees, and screenshots on success or failure.

## Remaining human Windows checks

The detailed release record is maintained in [`release/WINDOWS_RELEASE_SMOKE_TEST.md`](release/WINDOWS_RELEASE_SMOKE_TEST.md). Most installer and native-runtime checks are automated, but the following cannot be claimed honestly from code alone:

1. Judge visual polish and subjective layout quality.
2. Listen to actual Narrator speech and assess whether the reading experience is understandable.
3. Confirm behavior on physical monitors and hardware combinations not represented by the automated runner.
4. Establish SmartScreen reputation.
5. Verify production Authenticode signing when no real signing certificate is supplied.
6. Test upgrade compatibility when no previous stable installer exists.

These checks remain explicit release evidence instead of being reported as automated passes.

## Release decision rule

A release is considered technically ready only when:

- the automated feature matrix is current;
- `npm run verify:final` passes on Windows;
- the Windows system acceptance report passes for MSI and NSIS;
- the remaining human release evidence is recorded where applicable;
- the Git working tree is clean; and
- the README describes only behavior supported by the code, tests, and release configuration.
