# User-friendly Settings — Phase 5

Status: implemented on `feat/user-friendly-settings-language`

## Scope

This final phase separates selective data removal from full application reset, removes preselected destructive choices, and completes the Settings simplification work.

## Completed

- Split selective data removal and full application reset into two independent dialogs.
- Selective removal now opens with every data group unselected.
- Removed typed confirmation from ordinary selective removal.
- Kept one explicit review checkbox before selected data can be removed.
- Kept the optional recovery-copy control only when the selected groups support it.
- Shows a direct warning when saved backups are selected for removal.
- Full reset no longer shows a selectable category grid.
- Full reset keeps saved backups and bundled vocabulary by default.
- Reserved the `RESET ENGLISH FOCUS` typed phrase for the full reset only.
- Removed the repeated My data heading inside the focused maintenance screen.
- Replaced data metric cards and status chips with a simple divider-based summary.
- Separated the full reset entry point from ordinary data management.
- Added component, unit, and browser coverage for the two distinct destructive flows.

## Design boundary

The screen uses one clear decision per flow, plain language, dividers, and progressive disclosure. It avoids preselected destructive actions, card stacks, dashboard metrics, status-chip decoration, and generic AI-generated admin-panel patterns.

## Safety boundary

- No SQLite schema changes.
- No reset repository changes.
- No backup format changes.
- No vocabulary migrations.
- Existing refresh, recovery-copy, activity, and toast behavior remains in use.
- Bundled vocabulary is always preserved.
- Saved backups remain outside the normal full reset.
