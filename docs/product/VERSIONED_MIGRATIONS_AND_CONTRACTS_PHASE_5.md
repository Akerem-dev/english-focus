# Versioned migrations and native contracts — Phase 5

Status: implemented on `fix/versioned-migrations-contracts`.

## Scope

This phase replaces the single schema bootstrap with explicit SQLite migrations and makes the main Tauri response contracts verifiable from the shared TypeScript schemas.

## Versioned database migrations

- Reads the stored `database_schema_version` before changing application tables.
- Infers the latest complete legacy schema only when an older database has no version record.
- Applies versions 1, 2, and 3 in order.
- Runs each migration in its own transaction.
- Verifies required tables, columns, and indexes before recording a migration as complete.
- Rejects database versions newer than the current application build.
- Reapplies the current idempotent schema only after the version chain has completed, allowing safe maintenance to recreate missing indexes or tables without deleting content.
- Includes upgrade tests for fresh, versioned, and unversioned databases, plus incompatible and future-version protection.

## Shared native contracts

The existing Zod schemas now generate native JSON Schema contracts for:

- activity records;
- backup descriptors, validation results, restore results, and unavailable backup files;
- diagnostic reports, maintenance results, and diagnostic scan coverage;
- local-data snapshots and reset results.

The registered Tauri commands validate these responses before they cross the desktop bridge. Existing Rust request validation remains in place.

## Compatibility boundary

Nullable values emitted by Rust remain nullable in the generated native contracts. Application-facing schemas normalize only the established optional fields:

- activity `target`;
- backup-validation `descriptor`;
- local-reset `safetyBackup`.

No other malformed or undeclared data is accepted silently.

## Shared fixtures

A single fixture collection is checked by both TypeScript and Rust tests. It covers every generated contract, nullable compatibility values, and rejection of undeclared private fields.

## Quality gate

The normal pull-request Quality workflow now checks that generated native schemas are current before TypeScript compilation and tests. The existing Windows native-test job continues to compile the Tauri crate and run Rust tests.

## Safety boundary

- No vocabulary or study data is rewritten during application startup.
- Migration versions are recorded only after structural verification succeeds.
- Unsupported future databases are never downgraded automatically.
- Backup format version remains `1.0.0` and existing schema versions 2 and 3 remain readable.
