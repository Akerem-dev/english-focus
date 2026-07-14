# CP05A Test Plan

## Preconditions

- Current branch: `cp05/vocabulary-contract`
- CP04C is committed and merged into local `main`.
- Existing `node_modules`, `package-lock.json`, and Rust `target` remain untouched.

## Commands

```powershell
npm run check:environment
npm run typecheck
npm run test --workspace=@platform/domain
npm run test --workspace=@platform/schemas
npm run test --workspace=@app/desktop
npm run build --workspace=@app/desktop
```

## Expected results

### Domain

- 1 test file passed
- 1 test passed

### Schemas

- 3 test files passed
- 2 future test files skipped
- 11 tests passed
- 2 tests skipped

### Desktop regression

- 5 test files passed
- 26 future test files skipped
- 13 tests passed
- 26 tests skipped

### Build

- Vite production build completes successfully.

## Optional native regression

`npm run desktop` may be used to confirm that the CP04C shell still opens. No visual or functional difference is expected from CP05A.

## Failure reporting

Send the full output beginning at the first command that reports `FAIL`, `error TS`, or a failed test assertion. Do not continue to CP05B until CP05A is green.
