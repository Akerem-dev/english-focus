# English Learning Platform — Final V1 Skeleton

This repository is the complete intended file and module skeleton for the approved final V1.

The product is a fully local personal English vocabulary library. Users search local entries. When a word is missing, the app generates a copyable instruction for the user's preferred external AI. The user pastes the generated JSON back into the app, which parses, validates, previews, resolves duplicates, and stores the entry locally.

## Three primary screens

1. Vocabulary
2. Library
3. Settings

Search and vocabulary detail are states of the Vocabulary screen.

## Included boundaries

- Application shell and routing
- Vocabulary search and detail states
- Library management
- Settings
- Instruction builder
- Clipboard and JSON paste flow
- Parse, schema, semantic, and quality validation
- Correction instruction generation
- Preview and duplicate comparison
- SQLite repositories and FTS search
- Core entries, user entries, overrides, and user metadata
- Tags, favorites, notes, review status, and learning status
- Single-entry and vocabulary-pack import/export
- Backup, restore, and schema migrations
- Command bar, keyboard shortcuts, history, undo, and diagnostics
- Unit, integration, component, accessibility, migration, performance, and E2E test locations
- Tauri desktop shell and platform boundaries

## Intentionally pending

Production business logic and final visual components are not implemented. Placeholder files define ownership and intended architecture without adding fake demo behavior.

Start with:

- `docs/FINAL_PRODUCT_SPEC.md`
- `docs/FILE_MANIFEST.md`
- `docs/IMPLEMENTATION_ORDER.md`
- `PROJECT_TREE.txt`
