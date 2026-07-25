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

`npm run check:feature-coverage` fails when a required capability loses its mapped test evidence, when a referenced file disappears, or when the expected test marker is removed.

## Complete automated release gate

Run the full cross-workspace gate:

```powershell
npm run quality:release
```

This runs structure, migration, forbidden-pattern, CSS-token, dead-code, formatting, lint, generated native-schema, release-metadata, core-content, TypeScript, unit, component, integration, accessibility, performance, production-build, Playwright, and bundle-budget checks.

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

## Manual Windows checks

The following checks cannot be represented honestly by browser mocks or unit tests alone:

1. Install or upgrade the generated setup on Windows, launch from the Start menu, confirm that no Command Prompt window appears, and uninstall cleanly.
2. Exercise real Windows open/save dialogs and the system clipboard.
3. Verify focus order and announcements with a real Windows screen reader.
4. Observe automatic backup timing and retention across application restarts.
5. Build and verify a signed installer in the production Authenticode environment.

These checks remain explicit in the feature matrix instead of being reported as automated coverage.

## Release decision rule

A release is considered technically ready only when:

- the automated feature matrix is current;
- `npm run verify:final` passes on Windows;
- the manual Windows checks relevant to the release have been completed;
- the Git working tree is clean; and
- the README describes only behavior supported by the code, tests, and release configuration.
