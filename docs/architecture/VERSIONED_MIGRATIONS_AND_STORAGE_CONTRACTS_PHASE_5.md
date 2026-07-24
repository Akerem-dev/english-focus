# Versioned migrations and storage contracts — Phase 5

## Goal

Keep the native SQLite version chain, its checked-in SQL references, and every structured storage response aligned across Rust and TypeScript boundaries.

## Migration sources

The native runner remains the executable migration authority. The matching SQL files are now complete, versioned references rather than future placeholders:

- `0000_schema_metadata.sql`
- `0001_initial.sql`
- `0002_activity_settings.sql`
- `0003_user_metadata.sql`

`npm run check:migrations` extracts the SQL embedded by the native runner and compares it with these files after normalizing layout whitespace. It also rejects unexpected or placeholder-only SQL files. The check runs in both normal and release quality gates.

## Storage response contracts

Structured Tauri responses for vocabulary entries, vocabulary metadata, and application settings now pass through dedicated contract commands before reaching the TypeScript application.

- Stored vocabulary entries validate their payload and storage layer.
- Metadata responses use the generated vocabulary-metadata schema.
- Settings responses use the generated application-settings schema.
- Lists validate every returned record.
- Optional single-record reads validate the value when present.
- Save responses remain strict and cannot return undeclared data silently.

Primitive commands such as clear or delete operations keep their existing direct boundary because they return only a number or no structured payload.

## Safety

The change does not rewrite existing databases, change schema version 3, or introduce a destructive migration. Existing version-upgrade tests remain the authority for fresh, legacy, incompatible, and future-version databases.
