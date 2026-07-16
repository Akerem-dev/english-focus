$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($env:OS -ne "Windows_NT") {
    throw "Windows installers must be built on Windows."
}

npm run check:environment
if ($LASTEXITCODE -ne 0) { throw "Environment check failed." }

npm run check:native-environment
if ($LASTEXITCODE -ne 0) { throw "Native Windows environment check failed." }

npm run quality:release
if ($LASTEXITCODE -ne 0) { throw "Release quality checks failed." }

npm run tauri --workspace=@app/desktop -- build --bundles msi,nsis --ci --no-sign
if ($LASTEXITCODE -ne 0) { throw "Tauri Windows installer build failed." }

node scripts/check-release-artifacts.mjs --collect
if ($LASTEXITCODE -ne 0) { throw "Built installer verification failed." }

Write-Host ""
Write-Host "WINDOWS INSTALLERS BUILT AND VERIFIED" -ForegroundColor Green
Write-Host "Artifacts: release-artifacts\windows\0.9.0" -ForegroundColor Cyan
Write-Host "CP27 installers are intentionally unsigned release candidates." -ForegroundColor Yellow
