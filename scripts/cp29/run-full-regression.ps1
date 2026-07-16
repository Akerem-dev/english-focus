param(
    [switch]$BuildInstallers,
    [switch]$SkipNativeLaunch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Cp29Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "CP29 - $Name" -ForegroundColor Cyan

    $global:LASTEXITCODE = 0
    & $Command
    $stepSucceeded = $?
    $stepExitCode = $LASTEXITCODE

    if (-not $stepSucceeded -or $stepExitCode -ne 0) {
        throw "$Name failed (exit code: $stepExitCode)"
    }
}

$branch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Current Git branch could not be read"
}
if ($branch -ne "cp29/release-candidate-lock") {
    throw "Expected branch cp29/release-candidate-lock, current branch: $branch"
}

Invoke-Cp29Step -Name "Environment" -Command {
    npm run check:environment
}

Invoke-Cp29Step -Name "Native environment" -Command {
    npm run check:native-environment
}

Invoke-Cp29Step -Name "Release metadata" -Command {
    node scripts/cp29/verify-release-metadata.mjs
}

Invoke-Cp29Step -Name "Native assets" -Command {
    node scripts/cp29/verify-native-assets.mjs
}

Invoke-Cp29Step -Name "Stale checkpoints" -Command {
    node scripts/cp29/verify-stale-checkpoints.mjs
}

Invoke-Cp29Step -Name "Migration source" -Command {
    node scripts/cp29/verify-migration-source.mjs
}

$npmScripts = npm run | Out-String
if ($LASTEXITCODE -ne 0) {
    throw "Available npm scripts could not be read"
}

if ($npmScripts -match "quality:release") {
    Invoke-Cp29Step -Name "Release quality" -Command {
        npm run quality:release
    }
}
else {
    Invoke-Cp29Step -Name "TypeScript" -Command {
        npm run typecheck
    }

    Invoke-Cp29Step -Name "Workspace tests" -Command {
        npm run test --workspaces --if-present
    }

    Invoke-Cp29Step -Name "Desktop production build" -Command {
        npm run build --workspace=@app/desktop
    }
}

Invoke-Cp29Step -Name "Rust tests" -Command {
    cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets
}

if ($BuildInstallers) {
    Invoke-Cp29Step -Name "Windows installers" -Command {
        npm run release:windows
    }

    Invoke-Cp29Step -Name "Windows artifact verification" -Command {
        npm run release:windows:verify
    }
}

if (-not $SkipNativeLaunch) {
    Invoke-Cp29Step -Name "Native release-candidate launch" -Command {
        npm run desktop
    }
}

Write-Host ""
Write-Host "CP29 FULL REGRESSION PASSED" -ForegroundColor Green
