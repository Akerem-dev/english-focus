# User-Friendly Settings — Phase 2

Status: implemented on `feat/user-friendly-settings-language`

## Scope

This phase simplifies the Settings surface hierarchy without changing behavior or stored data.

## Completed

- Removed the reusable panel-within-panel wrapper from General, Vocabulary content, and Data & backups.
- Rendered each selected category as one direct preference list inside a single primary surface.
- Kept only two top-level structures: category navigation and the selected category content.
- Moved About this app below the primary workspace and reduced its visual emphasis.
- Replaced boxed static values with plain aligned values.
- Replaced backup statistic cards with two calm inline facts.
- Removed the extra background block around backup status and actions.
- Flattened the Privacy & maintenance action list and reduced decorative icon treatments.
- Reduced border radius, shadow, background, and card repetition while preserving the English Focus editorial identity.
- Kept responsive behavior for narrow desktop windows.
- Added component coverage for the direct preference surface and flat backup summary.

## Design boundary

The screen uses typography, spacing, and dividers for hierarchy. It avoids stacked cards, floating dashboard blocks, decorative metrics, and excessive status surfaces.

## Compatibility

- No SQLite schema changes.
- No settings migrations.
- No backup format changes.
- No restore, delete, reset, diagnostics, or activity behavior changes.
- No vocabulary data changes.

## Next phase

Phase 3 will rebuild Backup and Recent activity as shorter, task-focused experiences with technical details hidden by default.
