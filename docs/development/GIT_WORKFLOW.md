# Git and GitHub workflow

## Repository

- GitHub owner: `Akerem-dev`
- Repository: `english-focus`
- Default branch: `main`

## Change policy

1. Keep each change coherent and avoid unrelated rewrites.
2. Run `npm run quality:release` before merging product changes.
3. Run Rust formatting, Clippy with warnings denied, and native tests for Tauri changes.
4. Commit only after every applicable quality gate passes.
5. Never commit generated folders, databases, backups, logs, secrets, or local environment files.

## Commit convention

- `chore:` repository or tooling maintenance
- `feat:` user-visible capability
- `fix:` defect correction
- `refactor:` internal restructuring without behavior change
- `test:` test-only work
- `docs:` documentation-only work
- `style:` visual/CSS work without behavior change

## Branch policy

Use one short-lived branch per coherent change, merge it into `main` after review, and tag only tested releases.

Examples: `feature/library-export`, `fix/backup-validation`, `chore/release-tooling`.

## Never commit

- `node_modules/` or Rust `target/`
- `.env` files other than `.env.example`
- SQLite databases and journal files
- generated backups, exports, installers, logs, test reports, or local caches
- API keys, signing keys, or provider credentials
