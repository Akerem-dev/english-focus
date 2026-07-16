param(
    [switch]$BuildInstallers,
    [switch]$SkipNativeLaunch
)

$ErrorActionPreference = "Stop"
$branch = git branch --show-current
if ($branch -ne "cp29/release-candidate-lock") {
    throw "Expected branch cp29/release-candidate-lock, current branch: $branch"
}

$commands = @(
    @{ Name = "Environment"; Command = { npm run check:environment } },
    @{ Name = "Native environment"; Command = { npm run check:native-environment } },
    @{ Name = "Release metadata"; Command = { node scripts/cp29/verify-release-metadata.mjs } },
    @{ Name = "Native assets"; Command = { node scripts/cp29/verify-native-assets.mjs } },
    @{ Name = "Stale checkpoints"; Command = { node scripts/cp29/verify-stale-checkpoints.mjs } },
    @{ Name = "Migration source"; Command = { node scripts/cp29/verify-migration-source.mjs } },
    @{ Name = "Release quality"; Command = {
        if ((npm run | Out-String) -match "quality:release") { npm run quality:release }
        else {
            npm run typecheck
            if ($LASTEXITCODE -ne 0) { return }
            npm run test --workspaces --if-present
            if ($LASTEXITCODE -ne 0) { return }
            npm run build --workspace=@app/desktop
        }
    } },
    @{ Name = "Rust tests"; Command = { cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets } }
)

foreach ($item in $commands) {
    Write-Host ""; Write-Host "CP29 — $($item.Name)" -ForegroundColor Cyan
    & $item.Command
    if ($LASTEXITCODE -ne 0) { throw "$($item.Name) failed" }
}

if ($BuildInstallers) {
    npm run release:windows
    if ($LASTEXITCODE -ne 0) { throw "Windows installer build failed" }
    npm run release:windows:verify
    if ($LASTEXITCODE -ne 0) { throw "Windows installer verification failed" }
}

if (-not $SkipNativeLaunch) {
    Write-Host ""; Write-Host "Launching the native release candidate..." -ForegroundColor Cyan
    npm run desktop
}

Write-Host ""; Write-Host "CP29 FULL REGRESSION PASSED" -ForegroundColor Green
