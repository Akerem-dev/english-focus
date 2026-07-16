param(
    [Parameter(Mandatory = $true)]
    [string]$SnapshotPath,

    [string]$AppDataPath = (Join-Path $env:APPDATA "com.englishfocus.desktop")
)

$ErrorActionPreference = "Stop"
$manifestPath = Join-Path $SnapshotPath "snapshot.json"
if (-not (Test-Path $manifestPath)) {
    throw "Snapshot manifest was not found: $manifestPath"
}
if (-not (Test-Path $AppDataPath)) {
    throw "Current app-data directory was not found: $AppDataPath"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$currentFiles = Get-ChildItem $AppDataPath -Recurse -File
$currentRelative = @{}
foreach ($file in $currentFiles) {
    $relative = $file.FullName.Substring($AppDataPath.Length).TrimStart('\')
    $currentRelative[$relative] = $file
}

$missing = @()
$empty = @()
foreach ($file in $manifest.files) {
    if (-not $currentRelative.ContainsKey($file.relativePath)) {
        $missing += $file.relativePath
        continue
    }
    if ($currentRelative[$file.relativePath].Length -eq 0) {
        $empty += $file.relativePath
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Missing files after upgrade:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    throw "Upgrade data preservation failed: $($missing.Count) baseline file(s) disappeared."
}
if ($empty.Count -gt 0) {
    Write-Host "Files became empty after upgrade:" -ForegroundColor Red
    $empty | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    throw "Upgrade data preservation failed: $($empty.Count) file(s) became empty."
}

Write-Host "Upgrade file-preservation comparison passed." -ForegroundColor Green
Write-Host "Baseline files still present: $($manifest.files.Count)" -ForegroundColor Cyan
Write-Host "Current files: $($currentFiles.Count)" -ForegroundColor Cyan
Write-Host "Note: SQLite content identity is confirmed by the in-app migration and marker checks in the CP29 checklist." -ForegroundColor Yellow
