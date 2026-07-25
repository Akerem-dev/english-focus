# English Focus

English Focus is a private, local-first Windows desktop application for searching, organizing, editing, importing, reviewing, and backing up English vocabulary.

The application is built with React, TypeScript, Tauri, Rust, and SQLite. Vocabulary, personal notes, tags, favorites, learning state, settings, activity records, and backups remain on the user’s device. English Focus does not require a cloud account, API key, external AI provider, or permanent internet connection.

## Highlights

- Fast local vocabulary search with detailed entries
- Personal notes, tags, favorites, review state, and learning state
- Separate core vocabulary, user-created entries, and local overrides
- Direct editing of locally stored vocabulary
- Library filtering, sorting, and keyboard-friendly navigation
- Single-entry and vocabulary-pack import/export
- JSON schema validation, semantic checks, preview, and duplicate resolution
- Local backup, restore, retention, diagnostics, and guarded data reset
- Provider-independent explanation instructions that can be copied for use outside the app
- MSI and NSIS Windows installers

## Privacy and security model

English Focus is designed around local ownership of study data.

- Application data is stored locally in SQLite.
- No cloud account or remote synchronization service is required.
- No API keys or AI credentials are stored by the application.
- Content Security Policy rules restrict application resources and IPC connections.
- Camera, microphone, and geolocation access are disabled through Permissions Policy.
- Imported vocabulary and backup files are validated before persistence or restore.
- Backup restore, deletion, and data-reset operations use explicit validation and guarded flows.
- Release builds are detached from the Windows console.
- Release metadata, migration sources, native schemas, bundle size, formatting, linting, tests, and native Rust checks are enforced by the release gate.

This repository has no known open security issue at the time of writing. That statement is not a guarantee that the software is vulnerability-free; dependency advisories and platform updates should continue to be reviewed before public distribution.

## Main screens

### Vocabulary

Search for a word, inspect its entry, edit local content, manage personal metadata, and export individual vocabulary records.

### Library

Browse the local collection, filter and sort entries, and open a word directly in the Vocabulary view. The projection path is performance-tested with a 10,000-entry local collection.

### Settings

Manage explanation preferences, activity, local data, backups, restore operations, diagnostics, and guarded reset controls.

## Technology

| Layer | Technology |
| --- | --- |
| Desktop shell | Tauri 2 |
| Frontend | React 19, TypeScript, Vite |
| Native backend | Rust |
| Local storage | SQLite |
| Validation | Zod and generated native JSON schemas |
| Testing | Vitest, Playwright, Rust tests |
| Packaging | MSI and NSIS |

## Requirements

- Windows 10 or Windows 11
- Node.js 22.12 or newer
- npm 10 or newer
- Stable Rust toolchain
- Windows build prerequisites required by Tauri

## Development

Install dependencies:

```powershell
npm ci
```

Start the desktop application in development mode:

```powershell
npm run desktop
```

Build the frontend workspaces:

```powershell
npm run build
```

## Quality checks

Run the standard quality gate:

```powershell
npm run quality
```

Run the complete release gate:

```powershell
npm run quality:release
```

The release gate includes:

- repository structure checks
- migration-chain verification
- forbidden-pattern checks
- CSS token validation
- dead-code analysis
- formatting and linting
- TypeScript type checking
- native schema drift checks
- release metadata checks
- core vocabulary validation
- unit, component, integration, accessibility, and performance tests
- production build
- Playwright end-to-end tests
- bundle-budget verification

Run native Rust checks:

```powershell
cargo fmt \
  --manifest-path apps/desktop/src-tauri/Cargo.toml \
  --all \
  -- \
  --check

cargo test \
  --manifest-path apps/desktop/src-tauri/Cargo.toml \
  --all-targets \
  --all-features

cargo clippy \
  --manifest-path apps/desktop/src-tauri/Cargo.toml \
  --all-targets \
  --all-features \
  -- \
  -D warnings
```

## Windows installers

Create unsigned installers for local testing:

```powershell
npm run release:windows:unsigned
```

Unsigned installers are local rehearsal artifacts and should not be published as stable releases.

Create a signed release after configuring the project’s Windows signing environment:

```powershell
npm run release:windows
```

The release script removes stale bundle outputs and old collected Windows artifacts before creating and verifying the new MSI and NSIS installers.

Generated local artifacts are collected under:

```text
release-artifacts/windows/<version>/
```

Detailed installer and signing requirements are documented in [`docs/release/WINDOWS_INSTALLERS.md`](docs/release/WINDOWS_INSTALLERS.md).

## Project structure

```text
apps/desktop/                 React and Tauri desktop application
apps/desktop/src-tauri/       Rust backend, SQLite, commands, migrations, and bundling
packages/domain/              Shared domain models and contracts
packages/schemas/             Runtime validation schemas
packages/testing/             Shared testing utilities
scripts/                      Quality, schema, migration, and release automation
testing/                      Cross-workspace E2E and performance tests
docs/                         Product, architecture, content, and release documentation
```

## Data and backups

English Focus keeps vocabulary and study metadata locally. Backup files contain versioned data and checksums, and restore operations validate supported formats before replacing stored data.

Before testing destructive data-management features, create a fresh backup from the Settings screen.

## Status

Current application version: **1.0.0**

The current release baseline includes hardened backup and restore behavior, versioned SQLite migrations, shared TypeScript–Rust storage contracts, diagnostic integrity checks, Windows installer verification, and large-library performance coverage.
