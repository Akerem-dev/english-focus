# CP17 FIX01 Test Plan

Automated:

- typecheck desktop workspace
- full desktop test suite
- desktop production build
- forbidden-pattern check

Manual:

1. Export the full library pack.
2. Import that exported pack again.
3. Expect every exported entry to be structurally/semantically ready for transfer.
4. With `Keep existing entries`, expect all existing items to be skipped rather than invalid.
5. Import `testing/manual/cp17-mixed-vocabulary-pack.json`.
6. Expect exactly one valid and one invalid entry.
