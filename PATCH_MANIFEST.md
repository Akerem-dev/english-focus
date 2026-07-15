# CP21 Patch Manifest

## Product behavior

- Adds a native SQLite `quick_check` health scan.
- Verifies required schema tables and database schema version.
- Checks foreign-key enforcement and WAL journaling.
- Scans stored vocabulary JSON, metadata tag JSON, settings JSON, and normalized-word identity consistency.
- Reports local vocabulary, metadata, settings, and retained-backup counts.
- Adds a copyable plain-text diagnostic summary with no vocabulary content.
- Adds explicit recovery recommendations.
- Adds non-destructive safe maintenance that:
  - reapplies current migrations,
  - re-enables recommended SQLite pragmas,
  - runs `PRAGMA optimize`,
  - reruns diagnostics.
- Safe maintenance never deletes or rewrites vocabulary, metadata, settings, or backups.

## New native commands

- `run_diagnostics`
- `run_safe_maintenance`

## Dependency impact

- No new npm dependency.
- No new Rust crate.
- No lockfile changes.
