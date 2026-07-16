# English Focus

English Focus is a local-first Windows desktop vocabulary application built with React, TypeScript, Tauri, Rust, and SQLite. Vocabulary and personal study metadata remain on the device. The application contains no AI provider, API key, chat interface, or cloud account.

## Primary screens

1. Vocabulary
2. Library
3. Settings

Search and vocabulary detail are states of the Vocabulary screen.

## Capabilities

- Local vocabulary search and detailed editorial entries
- Separate core entries, user entries, overrides, and personal metadata
- Provider-independent AI instructions copied for use outside the application
- Local JSON parsing, schema validation, semantic review, preview, and duplicate resolution
- Single-entry and vocabulary-pack import/export
- Favorites, tags, notes, review state, and learning state
- Local backup, restore, retention, diagnostics, and guarded data reset
- Keyboard navigation, command bar, reduced motion, and narrow-window support

## Development

Requirements: Node.js 22.12+, npm 10+, the stable Rust toolchain, and the Windows prerequisites required by Tauri.

```powershell
npm install
npm run desktop
```

Run the complete release gate:

```powershell
npm run quality:release
```

Run native checks from `apps/desktop/src-tauri`:

```powershell
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets --all-features
```

Product and architecture requirements live under `docs/`. Windows installer requirements are documented in `docs/release/WINDOWS_INSTALLERS.md`.
