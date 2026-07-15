# CP11 Validation

Validated on the reconstructed CP10 baseline:

- TypeScript strict workspace check: PASS
- Domain tests: 2 PASS
- Schema tests: 14 PASS / 2 SKIPPED
- Testing utility tests: 4 PASS
- Desktop tests: 106 PASS / 17 SKIPPED
- Production build: PASS
- Forbidden API/registry pattern check: PASS
- Changed-file ESLint: PASS
- Changed-file Prettier: PASS
- Manual `allocate` fixture: schema PASS / semantic PASS / quality WARNINGS

The validation container exposes an internal npm registry through its environment, so the project environment checker cannot report the public registry there. The patch itself does not include a lockfile or internal registry reference; the user's Windows baseline already verifies the public npm registry.
