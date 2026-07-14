# Patch Manifest — CP05A

## Patch type

Domain and schema foundation. No UI, npm dependency, lockfile, database, or Rust changes.

## Added

- CEFR, inflection, schema-version, and vocabulary enum contracts
- concrete vocabulary content interfaces
- separate user metadata interfaces
- strict Zod component and entry schemas
- user metadata schema
- JSON Schema export
- schema-version detection
- domain and schema tests
- vocabulary contract documentation

## Replaced skeleton stubs

- `packages/domain/src/vocabulary/*`
- learning/review/tag/user-metadata boundaries in `packages/domain/src/library`
- vocabulary schemas in `packages/schemas/src/vocabulary`
- current schema-version detection boundaries
- vocabulary entry, metadata, and schema-version tests

## Not included

- `package.json`
- `package-lock.json`
- npm dependencies
- React page changes
- Tauri or Rust changes
- SQLite changes
- production vocabulary fixture content
