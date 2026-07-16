param(
    [string]$AppDataPath = (Join-Path $env:APPDATA "com.englishfocus.desktop"),
    [string]$ArchiveRoot = ".cp29-rehearsal\original-user-data"
)

$ErrorActionPreference = "Stop"

if (Test-Path $ArchiveRoot) {
    throw "Archive path already exists: $ArchiveRoot. Restore or rename it before beginning another rehearsal."
}

New-Item -ItemType Directory -Force -Path (Split-Path $ArchiveRoot -Parent) | Out-Null

if (Test-Path $AppDataPath) {
    Move-Item -Force $AppDataPath $ArchiveRoot
    Write-Host "Current English Focus app-data moved safely to: $ArchiveRoot" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Force -Path $ArchiveRoot | Out-Null
    Set-Content -Encoding utf8 (Join-Path $ArchiveRoot ".cp29-no-original-data") "No original app-data directory existed."
    Write-Host "No existing English Focus app-data was found; an empty restore marker was created." -ForegroundColor Yellow
}

Write-Host "The installer rehearsal may now use a clean app-data directory." -ForegroundColor Cyan
Write-Host "After CP29 testing, run restore-original-app-data.ps1 before returning to normal development." -ForegroundColor Yellow
