# Patch manifest — CP04B FIX01

## Modified files

- `apps/desktop/src/styles/primitives.css`
  - Hides WebView2's browser-native search cancel decoration.
  - Prevents form-field grid content from stretching vertically.
- `apps/desktop/src/app/runtime/RuntimeBaseline.tsx`
  - Makes the CEFR selector controlled.
  - Updates the CEFR metadata badge from the selected value.
- `apps/desktop/tests/runtime/RuntimeBaseline.test.tsx`
  - Verifies the initial controlled CEFR metadata output.

## Added dependencies

None.

## Lockfile changes

None.
