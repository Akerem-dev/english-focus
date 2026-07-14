# CP05B FIX01 — Restore CP04B Runtime Baseline

## Status

TESTING

## Purpose

Restore the CP04B accessible-component checkpoint implementation that was accidentally overwritten by the older CP03 runtime screen during manual file relocation.

## Scope

- Replaces only `apps/desktop/src/app/runtime/RuntimeBaseline.tsx`.
- Does not change the active CP04C application shell.
- Does not change vocabulary schemas, fixture data, content sources, Tauri, or dependencies.

## Expected result

- The stale `RuntimeBaseline.test.tsx` regression contract passes again.
- Desktop test total returns to 19 passed / 26 skipped.
- TypeScript and production build continue to pass.
