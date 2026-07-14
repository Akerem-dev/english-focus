# CP04B FIX01 test plan

## Apply

Copy the patch contents into the project root and replace matching files.
Do not run `npm install`. Do not delete `node_modules`, `package-lock.json`, or the Rust `target` directory.

## Automated checks

```powershell
npm run typecheck
npm run test --workspace=@app/desktop
npm run build --workspace=@app/desktop
```

Expected: 9 tests passed, 26 skipped, no failures, build successful.

## Native regression

```powershell
npm run desktop
```

Verify:

1. Search input displays exactly one clear X button.
2. Clicking the clear button empties the input.
3. `Tag name` and `CEFR level` controls align along the same top edge.
4. Selecting A2, B1, B2, or C1 updates the badge in Vocabulary metadata immediately.
5. The switch, keyboard focus, native connection badge, and narrow-window behavior still work.

Stop the process with `Ctrl + C` after the test.
