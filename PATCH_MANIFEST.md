# Patch Manifest — CP06A FIX01

## Modified

- `apps/desktop/src/styles/vocabulary-detail.css`
  - Sticky section navigation now uses `top: 0` because `.app-content` is the actual scroll container and already begins below the persistent top bar.
  - Replaces translucent blurred background with an opaque application background.
  - Adds low elevation and isolation for clean content separation.
  - Adjusts section `scroll-margin-top` to the navigation's real height.

## Added

- `apps/desktop/tests/design-system/VocabularyDetailStickyNav.test.ts`
  - Prevents the false top-bar offset from returning.
  - Verifies the opaque surface, elevation, and anchor clearance contract.

## Dependencies

No dependency or lockfile changes.

## Deletions

None.
