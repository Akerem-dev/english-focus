param(
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

if ($env:OS -ne "Windows_NT") {
    throw "Final release verification must run on Windows."
}

$gitStatus = git status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw "Git working-tree status could not be read."
}
if (-not [string]::IsNullOrWhiteSpace(($gitStatus -join "`n"))) {
    throw "Final verification requires a clean Git working tree."
}

Invoke-CheckedCommand -Label "Install locked dependencies" -Command {
    npm ci
}

if ($SkipInstaller) {
    Invoke-CheckedCommand -Label "Run complete JavaScript, TypeScript, browser, accessibility, and performance release gate" -Command {
        npm run quality:release
    }
}
else {
    Invoke-CheckedCommand -Label "Build and verify fresh unsigned Windows installers" -Command {
        npm run release:windows:unsigned
    }
}

Invoke-CheckedCommand -Label "Check Rust formatting" -Command {
    cargo fmt `
        --manifest-path apps/desktop/src-tauri/Cargo.toml `
        --all `
        -- `
        --check
}

Invoke-CheckedCommand -Label "Run all Rust targets and features" -Command {
    cargo test `
        --manifest-path apps/desktop/src-tauri/Cargo.toml `
        --all-targets `
        --all-features
}

Invoke-CheckedCommand -Label "Run Rust clippy with warnings denied" -Command {
    cargo clippy `
        --manifest-path apps/desktop/src-tauri/Cargo.toml `
        --all-targets `
        --all-features `
        -- `
        -D warnings
}

Invoke-CheckedCommand -Label "Check patch whitespace" -Command {
    git diff --check
}

$conflictMarkers = git grep -n -E "^(<<<<<<<|=======|>>>>>>>)" -- .
if ($LASTEXITCODE -eq 0) {
    Write-Host ($conflictMarkers -join "`n")
    throw "Conflict markers were found in tracked files."
}
if ($LASTEXITCODE -ne 1) {
    throw "Conflict-marker scan could not be completed."
}

$finalStatus = git status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw "Final Git status could not be read."
}
if (-not [string]::IsNullOrWhiteSpace(($finalStatus -join "`n"))) {
    throw "Verification changed tracked files; the working tree is no longer clean."
}

Write-Host ""
Write-Host "FINAL RELEASE VERIFICATION PASSED" -ForegroundColor Green
Write-Host "Automated V1 feature matrix: verified" -ForegroundColor Green
Write-Host "JavaScript/TypeScript/browser/native checks: passed" -ForegroundColor Green
if ($SkipInstaller) {
    Write-Host "Windows installer build: skipped by request" -ForegroundColor Yellow
}
else {
    Write-Host "Windows installers: rebuilt and verified as unsigned local rehearsal artifacts" -ForegroundColor Green
}
Write-Host "Manual OS checks remain in docs/release/WINDOWS_RELEASE_SMOKE_TEST.md." -ForegroundColor Yellow
