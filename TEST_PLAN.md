# CP08-FIX01 test plan

Run the single PowerShell block supplied with this patch.

## Native checks

1. Open Settings.
2. Change Instruction detail level to Maximum, Detailed, and Balanced.
3. Change Target proficiency to C1, C2, A1, and back to B2.
4. Toggle every instruction switch off and on.
5. Navigate to Vocabulary and search `allocate`.
6. Open the AI instruction dialog.
7. Confirm its metadata reflects the last selected detail level and proficiency.
8. Close the dialog using Close, X, Escape, and backdrop.

## Expected

The application shell must remain visible throughout. `The application could not start.` must never appear.
