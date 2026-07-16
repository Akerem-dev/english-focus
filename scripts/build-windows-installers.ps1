$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($env:OS -ne "Windows_NT") {
    throw "Windows installers must be built on Windows."
}

$config = Get-Content "apps/desktop/src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
$version = [string]$config.version

if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Tauri application version is missing."
}

npm run check:environment
if ($LASTEXITCODE -ne 0) { throw "Environment check failed." }

npm run check:native-environment
if ($LASTEXITCODE -ne 0) { throw "Native Windows environment check failed." }

npm run quality:release
if ($LASTEXITCODE -ne 0) { throw "Release quality checks failed." }

if ([string]::IsNullOrWhiteSpace($env:CARGO_TARGET_DIR)) {
    $targetRoot = Join-Path $root "apps\desktop\src-tauri\target"
}
elseif ([System.IO.Path]::IsPathRooted($env:CARGO_TARGET_DIR)) {
    $targetRoot = $env:CARGO_TARGET_DIR
}
else {
    $targetRoot = Join-Path $root $env:CARGO_TARGET_DIR
}

$bundleRoot = Join-Path $targetRoot "release\bundle"
foreach ($bundleType in @("msi", "nsis")) {
    $bundleDirectory = Join-Path $bundleRoot $bundleType
    if (Test-Path $bundleDirectory) {
        Remove-Item -Recurse -Force $bundleDirectory
    }
}

$artifactOutput = Join-Path $root "release-artifacts\windows\$version"
if (Test-Path $artifactOutput) {
    Remove-Item -Recurse -Force $artifactOutput
}

npm run tauri --workspace=@app/desktop -- build --bundles msi,nsis --ci --no-sign
if ($LASTEXITCODE -ne 0) { throw "Tauri Windows installer build failed." }

node scripts/check-release-artifacts.mjs --collect
if ($LASTEXITCODE -ne 0) { throw "Built installer verification failed." }

Write-Host ""
Write-Host "WINDOWS INSTALLERS BUILT AND VERIFIED" -ForegroundColor Green
Write-Host "Artifacts: release-artifacts\windows\$version" -ForegroundColor Cyan
Write-Host "Installers are intentionally unsigned unless a signing certificate is supplied outside the repository." -ForegroundColor Yellow
