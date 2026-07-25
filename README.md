<p align="center">
  <img src="apps/desktop/src-tauri/icons/128x128.png" width="96" alt="English Focus application icon" />
</p>

<h1 align="center">English Focus</h1>

<p align="center">
  <strong>A private, local-first vocabulary workspace for Windows.</strong>
</p>

<p align="center">
  <a href="https://github.com/Akerem-dev/english-focus/actions/workflows/quality.yml">
    <img src="https://github.com/Akerem-dev/english-focus/actions/workflows/quality.yml/badge.svg" alt="Quality workflow status" />
  </a>
</p>

English Focus is a Windows desktop application for searching, studying, importing, organizing, and backing up English vocabulary. It is designed around one rule: vocabulary and personal learning data should remain under the user's control.

The application does not require an account, cloud service, API key, telemetry provider, or embedded AI provider. External AI tools are optional and remain outside the application; English Focus can only prepare provider-independent instructions for the user to copy manually.

## Highlights

### Focused vocabulary workflow

- Exact, alias, inflection, prefix, full-text, and fuzzy-assisted local search
- Detailed vocabulary entries with examples, usage guidance, and learning metadata
- Favorites, tags, notes, review state, and learning state
- Separate bundled core content, user entries, overrides, and personal metadata

### Safe content import

- Single-entry and vocabulary-pack import/export
- Local JSON parsing with version detection and schema migration
- Schema validation, semantic validation, quality warnings, and preview
- Duplicate comparison and explicit persistence decisions
- Transaction-safe writes with no imported HTML rendering

### Local data protection

- SQLite-backed local persistence
- Manual and scheduled backups with retention controls
- Backup validation before restore
- Recovery-aware restore behavior for damaged current data
- Diagnostics and guarded data reset workflows

### Desktop experience

- Keyboard navigation and command bar
- Accessible dialogs and focus management
- Reduced-motion support
- Responsive layouts for narrower desktop windows
- MSI and NSIS Windows installers

## Privacy and security

English Focus is local-first. Vocabulary entries, notes, tags, settings, activity records, and backups stay on the device unless the user explicitly exports or copies them.

The desktop shell uses a restrictive Content Security Policy, disables camera, microphone, and geolocation access, and exposes only the minimal default Tauri capability to the main window. Imported content is treated as untrusted input and passes through size, schema, semantic, and persistence checks before it can be stored.

See [SECURITY.md](SECURITY.md) for the security model and reporting process.

## Architecture

The codebase follows a layered, ports-and-adapters structure:

```text
UI -> application use cases -> domain ports <- infrastructure adapters
```

Imported content follows an explicit pipeline:

```text
clipboard/file
  -> raw text
  -> cleanup
  -> JSON parse
  -> version detection
  -> migration
  -> schema validation
  -> semantic validation
  -> preview
  -> transaction
```

Search follows a staged local resolution flow:

```text
query
  -> normalization
  -> exact lookup
  -> alias/inflection lookup
  -> prefix/full-text lookup
  -> fuzzy suggestions
```

More detail is available in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## Technology

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Desktop shell | Tauri 2                               |
| Frontend      | React, TypeScript, Vite               |
| Native layer  | Rust                                  |
| Persistence   | SQLite                                |
| Validation    | Zod and generated native JSON Schemas |
| Testing       | Vitest, Playwright, Rust tests        |
| Packaging     | WiX MSI and NSIS                      |

## Getting started

### Requirements

- Windows 10 or Windows 11
- Node.js 22.12 or newer
- npm 10 or newer
- Stable Rust toolchain
- Windows prerequisites required by Tauri

### Development

```powershell
npm ci
npm run desktop
```

The frontend development server and Tauri desktop shell will start together.

## Validation

Run the complete release gate:

```powershell
npm run quality:release
```

Run the native checks:

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

The release gate covers repository structure, migrations, forbidden patterns, design tokens, dead code, formatting, linting, generated native schemas, release metadata, core content, type checks, unit and integration tests, performance budgets, the production build, Playwright flows, and bundle budgets.

## Windows installers

Create an unsigned installer for local testing:

```powershell
npm run release:windows:unsigned
```

Unsigned artifacts are local rehearsal builds and should not be published. A stable public release requires Authenticode signing through the environment described in [docs/release/WINDOWS_INSTALLERS.md](docs/release/WINDOWS_INSTALLERS.md).

Generated MSI and NSIS installers are collected under:

```text
release-artifacts/windows/<version>/
```

The release script removes stale installers and stale release executables before every package build so that artifacts are always produced from the current source.

## Project structure

```text
apps/desktop/                React and Tauri desktop application
packages/domain/             Domain models, ports, and policies
packages/schemas/            Shared validation schemas and migrations
packages/testing/            Shared testing utilities
scripts/                     Quality, release, and verification tooling
docs/                        Product, architecture, and release documentation
testing/performance/         Large-data performance budgets
```

## Current scope

Version 1.0.0 ships with a deliberately small editorial core catalog. The application is structured to grow through validated vocabulary packs, user-created entries, and non-destructive overrides without mixing personal metadata into bundled content.

## Documentation

- [Product specification](docs/FINAL_PRODUCT_SPEC.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Windows installer requirements](docs/release/WINDOWS_INSTALLERS.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
