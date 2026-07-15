# Checkpoint CP07 — Search Vertical Slice

Status: **TESTING**

## Completed by this patch

- deterministic local query normalization;
- exact normalized lookup;
- alias and inflected-form resolution;
- bounded fuzzy suggestions;
- typing, searching, found, not-found, invalid, and repository-error states;
- search-state UI integrated into the existing Vocabulary route;
- regression coverage for the approved search matrix.

## User validation required

Run the automated test block in `TEST_PLAN.md`, then verify the native search matrix.

## Lock condition

CP07 becomes `LOCKED` only after all automated checks pass and every listed native search input reaches the correct UI state.
