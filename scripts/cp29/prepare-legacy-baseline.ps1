param(
    [string]$BaseRef = "cp27-windows-installer-release",
    [string]$LegacyVersion = "0.8.0",
    [string]$WorktreePath = ".cp29-worktrees\legacy-$LegacyVersion"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([Parameter(Mandatory = $true)][string]$Message)

    if ($LASTEXITCODE -ne 0) {
        throw "$Message (exit code: $LASTEXITCODE)"
    }
}

function Write-Utf8WithoutBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $absolutePath = [System.IO.Path]::GetFullPath($Path)
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($absolutePath, $Content, $encoding)
}

$root = (Resolve-Path ".").Path
$absoluteWorktree = Join-Path $root $WorktreePath

if (Test-Path $absoluteWorktree) {
    git worktree remove --force $absoluteWorktree
    if ($LASTEXITCODE -ne 0 -and (Test-Path $absoluteWorktree)) {
        Remove-Item -Recurse -Force $absoluteWorktree
    }
}

git worktree prune
Assert-LastExitCode "Stale Git worktree records could not be pruned"

git worktree add --detach $absoluteWorktree $BaseRef
Assert-LastExitCode "Legacy worktree could not be created from $BaseRef"

Push-Location $absoluteWorktree
try {
    npm version $LegacyVersion --workspaces --include-workspace-root --no-git-tag-version
    Assert-LastExitCode "Legacy npm versions could not be synchronized"

    $cargoPath = ".\apps\desktop\src-tauri\Cargo.toml"
    $cargo = Get-Content $cargoPath -Raw
    $cargo = [regex]::Replace(
        $cargo,
        '(?m)^version\s*=\s*"[^"]+"',
        "version = `"$LegacyVersion`"",
        1
    )
    Write-Utf8WithoutBom -Path $cargoPath -Content $cargo

    $tauriPath = ".\apps\desktop\src-tauri\tauri.conf.json"
    $tauri = Get-Content $tauriPath -Raw | ConvertFrom-Json
    $tauri.version = $LegacyVersion
    $tauriJson = ($tauri | ConvertTo-Json -Depth 100) + [Environment]::NewLine
    Write-Utf8WithoutBom -Path $tauriPath -Content $tauriJson

    $tauriBytes = [System.IO.File]::ReadAllBytes([System.IO.Path]::GetFullPath($tauriPath))
    if (
        $tauriBytes.Length -ge 3 -and
        $tauriBytes[0] -eq 0xEF -and
        $tauriBytes[1] -eq 0xBB -and
        $tauriBytes[2] -eq 0xBF
    ) {
        throw "Legacy tauri.conf.json unexpectedly contains a UTF-8 BOM"
    }

    Get-Content $tauriPath -Raw | ConvertFrom-Json | Out-Null

    npm ci
    Assert-LastExitCode "Legacy worktree dependencies could not be installed"

    npm run typecheck
    Assert-LastExitCode "Legacy TypeScript validation failed"

    npm run build --workspace=@app/desktop
    Assert-LastExitCode "Legacy frontend production build failed"

    npm run tauri --workspace=@app/desktop -- build --bundles nsis,msi
    Assert-LastExitCode "Legacy Windows installer build failed"

    Write-Host "Legacy installer worktree prepared at: $absoluteWorktree" -ForegroundColor Green
    Write-Host "Legacy version: $LegacyVersion" -ForegroundColor Cyan
    Write-Host "NSIS: $absoluteWorktree\apps\desktop\src-tauri\target\release\bundle\nsis" -ForegroundColor Cyan
    Write-Host "MSI:  $absoluteWorktree\apps\desktop\src-tauri\target\release\bundle\msi" -ForegroundColor Cyan
}
finally {
    Pop-Location
}
