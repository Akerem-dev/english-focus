# CP08-FIX01 — Instruction settings event snapshot

Status: TESTING

## Purpose

Prevent the application-wide error boundary from activating when the user changes provider-independent instruction preferences such as `Maximum`, `C1`, or any instruction switch.

## Root cause

The previous handlers referenced `event.currentTarget` from inside React state-updater callbacks. A React event's `currentTarget` is only guaranteed while the event handler itself is executing. When React evaluated the deferred updater, the event target was no longer reliable and the update threw during render.

## Fix

- Snapshot select values and switch states synchronously inside each event handler.
- Pass only immutable primitive values into deferred state updaters.
- Add regression tests for `Maximum`, `C1`, and switch changes.

## Acceptance

- Changing detail level does not crash the application.
- Changing target proficiency does not crash the application.
- Instruction switches do not crash the application.
- Preferences remain synchronized with the instruction dialog.
- Typecheck, desktop tests, production build, and forbidden-pattern check pass.
