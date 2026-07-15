# CP09 Test Plan

## Automated tests — paste as one PowerShell block

```powershell
& {
    npm run check:environment
    if ($LASTEXITCODE -ne 0) { throw "Environment check failed" }

    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Typecheck failed" }

    npm run test --workspace=@platform/domain
    if ($LASTEXITCODE -ne 0) { throw "Domain tests failed" }

    npm run test --workspace=@platform/schemas
    if ($LASTEXITCODE -ne 0) { throw "Schema tests failed" }

    npm run test --workspace=@platform/testing
    if ($LASTEXITCODE -ne 0) { throw "Testing utilities failed" }

    npm run test --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Desktop tests failed" }

    npm run build --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Production build failed" }

    npm run check:forbidden
    if ($LASTEXITCODE -ne 0) { throw "Forbidden-pattern check failed" }

    Write-Host ""
    Write-Host "CP09 OTOMATIK TESTLERININ TAMAMI GECTI" -ForegroundColor Green
    Write-Host "Native JSON paste testi baslatiliyor..." -ForegroundColor Cyan

    npm run desktop
}
```

## Expected automated summary

- Domain: 2 passed
- Schemas: 14 passed, 2 skipped
- Testing utilities: 4 passed
- Desktop: 75 passed, 20 skipped
- Production build: passed
- Forbidden-pattern check: passed

## Native test

1. Search for `allocate` and open `Paste generated JSON`.
2. Confirm the dialog shows the expected word, local-processing note, character counter, and syntax-only stage note.
3. Paste `{"schemaVersion":"1.0.0","word":"allocate"}` and run `Check JSON syntax`.
4. Confirm `JSON syntax passed`, detected word `allocate`, and `Schema validation: Not checked yet`.
5. Clear the field and paste the same object inside a `json` Markdown fence; confirm the cleanup summary mentions the fence.
6. Clear and paste explanatory text before and after the object; confirm both wrappers are removed.
7. Paste `{"word":"allocate",}`; confirm a syntax error appears without closing the application.
8. Paste an object whose word is `different`; confirm the mismatch warning appears.
9. Confirm `Clear`, Cancel, X, Escape, and backdrop close behavior.
10. Confirm `Copy AI instruction`, Settings preferences, `maintain`, inflections, suggestions, invalid search, Library, and sticky detail navigation still work.
11. Reduce the window width and confirm the modal remains usable with no page-level horizontal overflow.
