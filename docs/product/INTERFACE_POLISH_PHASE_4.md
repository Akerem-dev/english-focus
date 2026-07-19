# Interface polish and friendly errors — Phase 4

Status: implemented on `feat/interface-polish-and-friendly-errors`

## Scope

This final phase fixes desktop compatibility for nullable backup and activity fields and removes raw validation language from the everyday Settings experience.

## Completed

- Treats a desktop `safetyBackup: null` result as no recovery copy instead of a validation failure.
- Treats older activity records with `target: null` as activity without a target.
- Added schema coverage for both nullable desktop payloads.
- Replaced the Activity validation dump with a calm explanation and one retry action.
- Removed raw schema paths, expected/received values, and implementation terminology from the Activity screen.
- Replaced My data raw errors with separate user-facing messages for summary refresh and removal failures.
- Added a retry action to My data without exposing the underlying parser message.
- Keeps saved words, notes, settings, and backups explicitly identified as unaffected when a read fails.
- Preserved existing reset, recovery-copy, refresh, and toast behavior.
- Removed the temporary formatting diagnostics workflow after the repository formatter was applied.
- Verified the final branch head with the repository Quality workflow.

## Design boundary

Errors describe what happened, what remains safe, and what the user can do next. The interface does not expose Zod paths, JSON payloads, database field names, raw runtime messages, developer diagnostics, decorative error cards, or generic AI-generated support copy.

## Safety boundary

- No SQLite schema changes.
- No backup format changes.
- No activity storage migration.
- No reset repository changes.
- No vocabulary data changes.
- Nullable compatibility is normalized at the validation boundary.
