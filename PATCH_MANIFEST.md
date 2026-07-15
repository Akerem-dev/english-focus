# Patch manifest — CP08-FIX01

## Modified

- `apps/desktop/src/modules/settings/components/InstructionSettingsSection.tsx`
  - Uses event-safe instruction preference handlers.

## Added

- `apps/desktop/src/modules/settings/components/instructionSettingsHandlers.ts`
  - Snapshots DOM values before deferred React state updates.
- `apps/desktop/tests/components/settings/InstructionSettingsHandlers.test.ts`
  - Guards Maximum, C1, and switch changes against event-lifetime regressions.

## Dependencies

No dependency or lockfile changes.

## Deletions

None.
