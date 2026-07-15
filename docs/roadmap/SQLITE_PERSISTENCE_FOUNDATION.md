# CP14 — SQLite persistence and imported-entry retrieval

CP14 is the first checkpoint that writes vocabulary content to disk.

## Boundary

- React never opens SQLite directly.
- The frontend calls typed Tauri commands.
- Rust owns the SQLite connection and transactions.
- Core vocabulary remains immutable.
- New entries are stored in the `user` layer.
- Replacements of core entries are stored in the `override` layer.
- User metadata is initialized and preserved in a separate table.

## Save workflow

1. JSON syntax, schema, semantic, and quality checks pass.
2. The user reviews and approves the preview.
3. Duplicate resolution produces an explicit persistence plan.
4. A final save confirmation runs.
5. Rust writes the entry in a SQLite transaction.
6. The React repository provider updates the visible layered content source.
7. Search and the minimal Library persistence view can retrieve the saved entry.

## Restart proof

A successful CP14 test must close the application completely, reopen it, and find the saved word again. This proves that the value came from SQLite rather than React memory.

## Deferred

FTS5 ranking, full Library management, notes, tags, favorites, bulk actions, import history, backup, and restore remain later checkpoints.
