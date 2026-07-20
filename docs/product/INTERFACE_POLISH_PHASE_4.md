# Interface polish and friendly errors — Final scope

Status: implemented on `feat/interface-polish-and-friendly-errors`

## Scope

This final scope keeps the requested interface cleanup, Library alignment, and friendly error handling. The experimental moving letter-and-book background and its Animation switch were removed before merge at the user's request.

## Completed

- Removed technical implementation labels from Vocabulary and Personal details.
- Repositioned application identity, version, and local storage information beneath About this app.
- Corrected Library word, book-icon, and Level-column alignment.
- Replaced the Library CEFR chip treatment with restrained typographic level text.
- Treats a desktop `safetyBackup: null` result as no recovery copy instead of a validation failure.
- Treats older activity records with `target: null` as activity without a target.
- Added schema coverage for both nullable desktop payloads.
- Replaced the Activity validation dump with a calm explanation and one retry action.
- Removed raw schema paths, expected/received values, and implementation terminology from the Activity screen.
- Replaced My data raw errors with separate user-facing messages for summary refresh and removal failures.
- Added a retry action to My data without exposing the underlying parser message.
- Preserved existing reset, recovery-copy, refresh, and toast behavior.
- Removed all Library atmosphere markup, animation styles, local preference handling, and motion controls.
- Verified the final branch head with the repository Quality workflow.

## Design boundary

The interface uses typography, alignment, spacing, restrained borders, and plain recovery language. It does not use ornamental chips, moving background decoration, random particles, gradients, glow effects, developer labels, technical error dumps, generic AI-generated support copy, or vibecode dashboard styling.

## Safety boundary

- No SQLite schema changes.
- No backup format changes.
- No activity storage migration.
- No reset repository changes.
- No vocabulary data changes.
- Nullable compatibility is normalized at the validation boundary.
