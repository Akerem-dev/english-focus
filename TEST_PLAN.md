# Test Plan — CP05B FIX01

Run every command from the project root. The commands are intentionally provided as one PowerShell block.

```powershell
npm run check:environment
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test --workspace=@platform/domain
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test --workspace=@platform/schemas
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test --workspace=@platform/testing
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test --workspace=@app/desktop
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build --workspace=@app/desktop
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

## Expected totals

- Domain: 1 passed
- Schemas: 11 passed, 2 skipped
- Testing builders: 3 passed
- Desktop: 19 passed, 26 skipped
- Production build: successful

No visual change is expected in the active Vocabulary, Library, or Settings routes.
