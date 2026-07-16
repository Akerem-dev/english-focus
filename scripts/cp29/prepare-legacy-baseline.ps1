param(
    [string]$BaseRef = "cp27-windows-installer-release",
    [string]$LegacyVersion = "0.8.0",
    [string]$WorktreePath = ".cp29-worktrees\legacy-$LegacyVersion"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path ".").Path
$absoluteWorktree = Join-Path $root $WorktreePath

if (Test-Path $absoluteWorktree) {
    git worktree remove --force $absoluteWorktree
}

git worktree add --detach $absoluteWorktree $BaseRef
if ($LASTEXITCODE -ne 0) { throw "Legacy worktree could not be created from $BaseRef" }

Push-Location $absoluteWorktree
try {
    npm version $LegacyVersion --workspaces --include-workspace-root --no-git-tag-version
    if ($LASTEXITCODE -ne 0) { throw "Legacy npm versions could not be synchronized" }

    $cargoPath = ".\apps\desktop\src-tauri\Cargo.toml"
    $cargo = Get-Content $cargoPath -Raw
    $cargo = [regex]::Replace($cargo, '(?m)^version\s*=\s*"[^"]+"', "version = `"$LegacyVersion`"", 1)
    Set-Content -Encoding utf8 $cargoPath $cargo

    $tauriPath = ".\apps\desktop\src-tauri\tauri.conf.json"
    $tauri = Get-Content $tauriPath -Raw | ConvertFrom-Json
    $tauri.version = $LegacyVersion
    $tauri | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $tauriPath

    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Legacy worktree dependencies could not be installed" }

    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Legacy TypeScript validation failed" }

    npm run build --workspace=@app/desktop
    if ($LASTEXITCODE -ne 0) { throw "Legacy frontend production build failed" }

    npm run tauri --workspace=@app/desktop -- build --bundles nsis,msi
    if ($LASTEXITCODE -ne 0) { throw "Legacy Windows installer build failed" }

    Write-Host "Legacy installer worktree prepared at: $absoluteWorktree" -ForegroundColor Green
    Write-Host "Legacy version: $LegacyVersion" -ForegroundColor Cyan
    Write-Host "NSIS: $absoluteWorktree\apps\desktop\src-tauri\target\release\bundle\nsis" -ForegroundColor Cyan
    Write-Host "MSI:  $absoluteWorktree\apps\desktop\src-tauri\target\release\bundle\msi" -ForegroundColor Cyan
}
finally {
    Pop-Location
}
