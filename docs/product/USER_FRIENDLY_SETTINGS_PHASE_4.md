# User-friendly Settings — Phase 4

Status: implemented on `feat/user-friendly-settings-language`

## Scope

This phase turns App health from a technical diagnostics dashboard into a short user-facing check while keeping the existing diagnostic and repair behavior intact.

## Completed

- Replaced the large status card, four metric cards, six check cards, recommendation card, and permanent maintenance panel with one concise result.
- Added three plain-language facts: Your data, Backups, and Next step.
- Shows `Everything looks good`, `A small issue was found`, or `Your data needs attention` according to the existing report status.
- Shows the safe fix action only when a repairable issue exists.
- Shows backup recovery guidance only when an issue cannot be fixed automatically.
- Removed the permanent repair confirmation checkbox because the existing safe maintenance action does not delete user data.
- Moved counts, individual checks, raw details, app version, and report copying under `Check details`.
- Keeps technical errors behind `Technical details` while explaining the user impact first.
- Added a presentation helper so diagnostic decisions are testable without UI rendering.
- Added unit, component, and Playwright coverage for the simplified health flow.

## Design boundary

The health screen uses one result, three facts, progressive disclosure, and a single conditional action. It avoids dashboard metrics, nested cards, status-chip walls, database terminology, and decorative visuals that resemble generated admin panels.

## Compatibility

- No SQLite schema changes.
- No settings migrations.
- No diagnostic command changes.
- No safe-maintenance behavior changes.
- No backup-format changes.
- No vocabulary-data changes.

## Next phase

Phase 5 will separate selected-data removal from full app reset, remove default destructive selections, and finish the guarded My data experience.
