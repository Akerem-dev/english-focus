$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($env:OS -ne "Windows_NT") {
    throw "Authenticode verification must run on Windows."
}

node scripts/check-release-artifacts.mjs --collect
if ($LASTEXITCODE -ne 0) { throw "Artifact structure and checksum verification failed." }

$config = Get-Content "apps/desktop/src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
$version = [string]$config.version
$directory = Join-Path $root "release-artifacts/windows/$version"
$installers = Get-ChildItem $directory -File | Where-Object { $_.Extension -in @(".msi", ".exe") }
$requireSignature = $env:REQUIRE_WINDOWS_SIGNATURE -eq "1"

if ($installers.Count -lt 2) {
    throw "Expected MSI and NSIS installers in $directory."
}

foreach ($installer in $installers) {
    $signature = Get-AuthenticodeSignature -FilePath $installer.FullName
    Write-Host ""
    Write-Host $installer.Name -ForegroundColor Cyan
    Write-Host "  Size: $([Math]::Round($installer.Length / 1MB, 2)) MiB"
    Write-Host "  Signature: $($signature.Status)"
    if ($requireSignature -and $signature.Status -ne "Valid") {
        throw "A valid signature is required but $($installer.Name) is $($signature.Status)."
    }
}

if (-not $requireSignature) {
    Write-Host ""
    Write-Host "Unsigned Windows release artifact verification passed for English Focus $version." -ForegroundColor Yellow
}
