param(
    [string]$AppDataPath = (Join-Path $env:APPDATA "com.englishfocus.desktop"),
    [string]$ArchiveRoot = ".cp29-rehearsal\original-user-data",
    [string]$RehearsalArchive = ".cp29-rehearsal\completed-rehearsal-data"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $ArchiveRoot)) {
    throw "Original app-data archive was not found: $ArchiveRoot"
}

if (Test-Path $AppDataPath) {
    if (Test-Path $RehearsalArchive) {
        Remove-Item -Recurse -Force $RehearsalArchive
    }
    New-Item -ItemType Directory -Force -Path (Split-Path $RehearsalArchive -Parent) | Out-Null
    Move-Item -Force $AppDataPath $RehearsalArchive
    Write-Host "Rehearsal app-data archived at: $RehearsalArchive" -ForegroundColor Cyan
}

$emptyMarker = Join-Path $ArchiveRoot ".cp29-no-original-data"
if (Test-Path $emptyMarker) {
    Remove-Item -Recurse -Force $ArchiveRoot
    Write-Host "There was no original app-data to restore." -ForegroundColor Yellow
} else {
    Move-Item -Force $ArchiveRoot $AppDataPath
    Write-Host "Original English Focus app-data restored to: $AppDataPath" -ForegroundColor Green
}
