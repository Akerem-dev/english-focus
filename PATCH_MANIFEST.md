# Patch manifest

## Scope

- Lazy-loads Vocabulary, Library and Settings route implementations.
- Lazy-loads import workflows only when the user opens them.
- Adds accessible route loading and route failure boundaries.
- Moves keyboard focus to the main landmark after route changes.
- Updates the document title for each primary route.
- Replaces the plain fatal startup message with local recovery actions and a privacy-safe error reference.
- Adds Vite vendor splitting and a deterministic production bundle budget check.
- Adds release-hardening and shell-accessibility tests.

## Explicit non-goals

- No SQLite migration.
- No vocabulary or metadata mutation.
- No new npm dependency or Rust crate.
- No new application route.
- No telemetry or network reporting.
