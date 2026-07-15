# CP07 Test Plan

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
    if ($LASTEXITCODE -ne 0) { throw "Builder tests failed" }

    npm run test --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Desktop tests failed" }

    npm run build --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Production build failed" }

    npm run check:forbidden
    if ($LASTEXITCODE -ne 0) { throw "Forbidden-pattern check failed" }

    Write-Host ""
    Write-Host "CP07 OTOMATIK TESTLERININ TAMAMI GECTI" -ForegroundColor Green
    Write-Host "Native search testi baslatiliyor..." -ForegroundColor Cyan

    npm run desktop
}
```

## Native functional matrix

Run each input from a fresh Vocabulary search:

1. `maintain` → detail opens.
2. ` Maintain ` → detail opens.
3. `MAINTAIN` → detail opens.
4. `maintains` → `maintain` detail opens.
5. `maintained` → `maintain` detail opens.
6. `maintaining` → `maintain` detail opens.
7. `allocate` → valid not-found state.
8. `maintan` → not-found state with `maintain` suggestion; clicking it opens detail.
9. `maintain?` → invalid-search state.
10. `two words` → invalid-search state.
11. Blank search → invalid-search state.
12. Back to vocabulary → returns to the initial screen.

## Visual checks

- Search-state cards use the approved cream/burgundy system.
- Disabled future actions are visibly disabled.
- No horizontal overflow at narrow width.
- Search loading indicator does not move surrounding layout.
- Invalid and not-found states remain distinct.
- Detail sticky navigation from CP06 remains correct.
