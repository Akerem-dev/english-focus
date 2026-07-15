# CP06A FIX01 Test Plan

Apply this patch over the current CP06A project. Do not run `npm install` and do not delete `node_modules`, `package-lock.json`, or `src-tauri/target`.

## Automated test block

```powershell
& {
    npm run check:environment
    if ($LASTEXITCODE -ne 0) { throw "Environment check failed" }

    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Typecheck failed" }

    npm run test --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Desktop tests failed" }

    npm run build --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Production build failed" }

    Write-Host ""
    Write-Host "CP06A FIX01 OTOMATIK TESTLERININ TAMAMI GECTI" -ForegroundColor Green
    npm run desktop
}
```

Expected desktop result: 27 passed, 26 skipped, 0 failed.

## Native visual test

1. Open `maintain` detail.
2. Scroll until the section navigation becomes sticky.
3. The bar must sit directly below the application top bar, without a large empty vertical gap.
4. Text and cards behind it must not bleed through.
5. Click `Meanings`, `Grammar`, `Examples`, and `Etymology`.
6. Each section heading must stop below the sticky section navigation rather than hiding behind it.
7. No horizontal scrollbar should appear at the tested desktop width.
