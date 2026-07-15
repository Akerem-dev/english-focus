# CP23 Patch Manifest

## Product behavior

- Adds global success, information, warning, and error toast notifications.
- Limits the visible stack to four notifications and deduplicates repeated operation feedback.
- Adds accessible live regions, dismiss buttons, reduced-motion behavior, and responsive layout.
- Adds an undoable favorite toggle with a visible Undo action.
- Adds toast feedback for study-details saving, vocabulary persistence, exports, clipboard actions, and search failures.
- Standardizes common clipboard, SQLite, schema, and backup error messages.

## Safety

- Undo history is memory-only and is not written to SQLite.
- No API, network, or telemetry integration.
- Existing vocabulary, metadata, backup, and settings contracts remain unchanged.
