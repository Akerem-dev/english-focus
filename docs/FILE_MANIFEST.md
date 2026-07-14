# File Manifest

## App
Composition, startup, routing, global layout, command bar, errors, shortcuts, and diagnostics.

## Modules
- Vocabulary: search, found/not-found, detail, examples, grammar, edit, review.
- Library: list, filters, sorting, selection, preview, bulk actions.
- Settings: general, content, instruction, data, appearance, diagnostics.
- Import/export: paste, validation, preview, duplicates, pack import, exports.
- Instruction: primary instruction and correction instruction builders.
- Search: normalization, inflection lookup, fuzzy suggestions, history, FTS.
- Backup: create, restore, retention, automatic local backups.

## Packages
- Domain: framework-free entities, value objects, ports, and use cases.
- Schemas: versioned runtime validation and migrations.
- Shared: small cross-cutting primitives.
- Testing: builders, fakes, fixtures, and helpers.

## Infrastructure
SQLite, FTS5, filesystem, clipboard, backup storage, Tauri commands, logging, platform TTS, and settings persistence.
