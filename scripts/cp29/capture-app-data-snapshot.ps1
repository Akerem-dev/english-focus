param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$AppDataPath = (Join-Path $env:APPDATA "com.englishfocus.desktop"),

    [string]$Label = "snapshot"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $AppDataPath)) {
    throw "English Focus app-data directory was not found: $AppDataPath"
}

New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
$copyPath = Join-Path $OutputPath "app-data"
if (Test-Path $copyPath) {
    Remove-Item -Recurse -Force $copyPath
}
Copy-Item -Recurse -Force $AppDataPath $copyPath

$files = Get-ChildItem $AppDataPath -Recurse -File | ForEach-Object {
    [ordered]@{
        relativePath = $_.FullName.Substring($AppDataPath.Length).TrimStart('\')
        sizeBytes = $_.Length
        sha256 = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$manifest = [ordered]@{
    kind = "english-focus-cp29-app-data-snapshot"
    version = 1
    label = $Label
    capturedAt = (Get-Date).ToUniversalTime().ToString("o")
    sourcePath = $AppDataPath
    files = @($files)
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $OutputPath "snapshot.json")
Write-Host "Snapshot captured: $OutputPath" -ForegroundColor Green
Write-Host "Files: $($files.Count)" -ForegroundColor Cyan
