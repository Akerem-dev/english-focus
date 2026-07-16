param(
    [switch]$BuildInstallers,
    [switch]$SkipNativeEnvironment
)

$ErrorActionPreference = "Stop"

function Invoke-NativeStep {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host ""
    Write-Host "[CP30] $Title" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed with exit code $LASTEXITCODE"
    }
}

$branch = (& git branch --show-current).Trim()
if ($branch -ne "cp30/v1-final-release") {
    throw "Expected branch cp30/v1-final-release, current branch: $branch"
}

Invoke-NativeStep "Environment check" { npm run check:environment }
if (-not $SkipNativeEnvironment) {
    Invoke-NativeStep "Native environment check" { npm run check:native-environment }
}
Invoke-NativeStep "Final release metadata" { node .\scripts\cp30\verify-final-release.mjs }

$package = Get-Content .\package.json -Raw | ConvertFrom-Json
if ($null -ne $package.scripts.'quality:release') {
    Invoke-NativeStep "Release quality suite" { npm run quality:release }
}
else {
    Invoke-NativeStep "TypeScript strict" { npm run typecheck }
    Invoke-NativeStep "Domain tests" { npm run test --workspace=@platform/domain }
    Invoke-NativeStep "Schema tests" { npm run test --workspace=@platform/schemas }
    Invoke-NativeStep "Testing utilities" { npm run test --workspace=@platform/testing }
    Invoke-NativeStep "Desktop tests" { npm run test --workspace=@app/desktop }
    Invoke-NativeStep "Production build" { npm run build --workspace=@app/desktop }
    if ($null -ne $package.scripts.'check:bundle') {
        Invoke-NativeStep "Bundle budget" { npm run check:bundle }
    }
    if ($null -ne $package.scripts.'check:forbidden') {
        Invoke-NativeStep "Forbidden patterns" { npm run check:forbidden }
    }
}

Invoke-NativeStep "Rust tests" { cargo test --manifest-path .\apps\desktop\src-tauri\Cargo.toml }

if ($BuildInstallers) {
    Invoke-NativeStep "Windows NSIS and MSI installers" { npm run release:windows }
    Invoke-NativeStep "Windows artifact verification" { npm run release:windows:verify }

    $artifactPath = ".\release-artifacts\windows\1.0.0"
    if (-not (Test-Path $artifactPath)) {
        throw "Final artifact directory is missing: $artifactPath"
    }
    if ((Get-ChildItem $artifactPath -Filter *.exe -File).Count -lt 1) {
        throw "Final NSIS installer is missing."
    }
    if ((Get-ChildItem $artifactPath -Filter *.msi -File).Count -lt 1) {
        throw "Final MSI installer is missing."
    }
}

Write-Host ""
Write-Host "CP30 FINAL RELEASE GATE PASSED" -ForegroundColor Green
