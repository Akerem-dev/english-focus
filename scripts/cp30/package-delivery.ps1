param(
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$artifactRoot = ".\release-artifacts\windows\$Version"
$deliveryRoot = ".\delivery\English-Focus-$Version-Windows"
$zipPath = ".\delivery\English-Focus-$Version-Windows.zip"
$hashPath = ".\delivery\English-Focus-$Version-Windows.zip.sha256.txt"

if (-not (Test-Path $artifactRoot)) {
    throw "Artifact directory is missing: $artifactRoot"
}
if (-not (Test-Path ".\release\cp30\final-release-lock.json")) {
    throw "Final release lock is missing."
}

if (Test-Path $deliveryRoot) { Remove-Item -Recurse -Force $deliveryRoot }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
New-Item -ItemType Directory -Force -Path $deliveryRoot | Out-Null

Copy-Item "$artifactRoot\*" $deliveryRoot -Recurse -Force
Copy-Item ".\release\cp30\RELEASE_NOTES.md" $deliveryRoot -Force
Copy-Item ".\release\cp30\INSTALLATION.md" $deliveryRoot -Force
Copy-Item ".\release\cp30\final-release-lock.json" $deliveryRoot -Force

Compress-Archive -Path "$deliveryRoot\*" -DestinationPath $zipPath -CompressionLevel Optimal
$hash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $(Split-Path $zipPath -Leaf)" | Set-Content -Encoding ascii $hashPath

Write-Host ""
Write-Host "FINAL DELIVERY PACKAGE READY" -ForegroundColor Green
Write-Host $zipPath -ForegroundColor Cyan
Write-Host $hashPath -ForegroundColor Cyan
