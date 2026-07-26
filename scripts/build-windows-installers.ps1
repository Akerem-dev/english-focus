param(
    [switch]$AllowUnsigned,
    [switch]$QualityAlreadyVerified
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($env:OS -ne "Windows_NT") {
    throw "Windows installers must be built on Windows."
}

$config = Get-Content "apps/desktop/src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
$version = [string]$config.version
$certificateThumbprint = [string]$env:EF_WINDOWS_CERTIFICATE_THUMBPRINT
$signCommand = [string]$env:EF_WINDOWS_SIGN_COMMAND
$timestampUrl = [string]$env:EF_WINDOWS_TIMESTAMP_URL
$digestAlgorithm = if ([string]::IsNullOrWhiteSpace($env:EF_WINDOWS_DIGEST_ALGORITHM)) {
    "sha256"
}
else {
    [string]$env:EF_WINDOWS_DIGEST_ALGORITHM
}

if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Tauri application version is missing."
}

if (-not [string]::IsNullOrWhiteSpace($certificateThumbprint) -and -not [string]::IsNullOrWhiteSpace($signCommand)) {
    throw "Configure either EF_WINDOWS_CERTIFICATE_THUMBPRINT or EF_WINDOWS_SIGN_COMMAND, not both."
}

$signedBuild = -not [string]::IsNullOrWhiteSpace($certificateThumbprint) -or -not [string]::IsNullOrWhiteSpace($signCommand)
if (-not $signedBuild -and -not $AllowUnsigned) {
    throw "Stable Windows releases require EF_WINDOWS_CERTIFICATE_THUMBPRINT or EF_WINDOWS_SIGN_COMMAND. Use release:windows:unsigned only for a local rehearsal."
}

if ($QualityAlreadyVerified) {
    if (-not $AllowUnsigned) {
        throw "QualityAlreadyVerified is restricted to unsigned CI system-acceptance builds. Stable signed releases must run the quality gate in this process."
    }
    if ($env:CI -ne "true" -or $env:EF_QUALITY_GATE_VERIFIED -ne "true") {
        throw "QualityAlreadyVerified requires CI=true and EF_QUALITY_GATE_VERIFIED=true."
    }
}

if (-not $AllowUnsigned) {
    $gitStatus = git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw "Git working-tree status could not be read." }
    if (-not [string]::IsNullOrWhiteSpace(($gitStatus -join "`n"))) {
        throw "Stable signed releases require a clean Git working tree so artifact provenance is reproducible."
    }
}

if (-not [string]::IsNullOrWhiteSpace($certificateThumbprint) -and [string]::IsNullOrWhiteSpace($timestampUrl)) {
    throw "EF_WINDOWS_TIMESTAMP_URL is required when signing with a certificate thumbprint."
}

npm run check:environment
if ($LASTEXITCODE -ne 0) { throw "Environment check failed." }

npm run check:native-environment
if ($LASTEXITCODE -ne 0) { throw "Native Windows environment check failed." }

if ($QualityAlreadyVerified) {
    Write-Host "Release quality gate: reused from the verified CI Quality workflow for this commit." -ForegroundColor Cyan
}
else {
    npm run quality:release
    if ($LASTEXITCODE -ne 0) { throw "Release quality checks failed." }
}

if ([string]::IsNullOrWhiteSpace($env:CARGO_TARGET_DIR)) {
    $targetRoot = Join-Path $root "apps\desktop\src-tauri\target"
}
elseif ([System.IO.Path]::IsPathRooted($env:CARGO_TARGET_DIR)) {
    $targetRoot = $env:CARGO_TARGET_DIR
}
else {
    $targetRoot = Join-Path $root $env:CARGO_TARGET_DIR
}

$releaseRoot = Join-Path $targetRoot "release"
$bundleRoot = Join-Path $releaseRoot "bundle"
if (Test-Path -LiteralPath $bundleRoot) {
    Remove-Item -LiteralPath $bundleRoot -Recurse -Force
}

foreach ($staleReleaseFile in @("english-learning-platform.exe", "english-learning-platform.pdb")) {
    $staleReleasePath = Join-Path $releaseRoot $staleReleaseFile
    if (Test-Path -LiteralPath $staleReleasePath) {
        Remove-Item -LiteralPath $staleReleasePath -Force
    }
}

$artifactRoot = Join-Path $root "release-artifacts\windows"
if (Test-Path -LiteralPath $artifactRoot) {
    Get-ChildItem -LiteralPath $artifactRoot -Force | Remove-Item -Recurse -Force
}

$artifactOutput = Join-Path $artifactRoot $version

$tauriArguments = @("run", "tauri", "--workspace=@app/desktop", "--", "build", "--bundles", "msi,nsis", "--ci")
$signingConfigPath = $null

try {
    if ($signedBuild) {
        $windowsSigning = @{
            digestAlgorithm = $digestAlgorithm
        }
        if (-not [string]::IsNullOrWhiteSpace($certificateThumbprint)) {
            $windowsSigning.certificateThumbprint = $certificateThumbprint
            $windowsSigning.timestampUrl = $timestampUrl
        }
        else {
            $windowsSigning.signCommand = $signCommand
        }

        $signingConfigPath = Join-Path ([System.IO.Path]::GetTempPath()) "english-focus-tauri-signing-$PID.json"
        @{
            bundle = @{
                windows = $windowsSigning
            }
        } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $signingConfigPath -Encoding utf8NoBOM
        $tauriArguments += @("--config", $signingConfigPath)
    }
    else {
        $tauriArguments += "--no-sign"
    }

    & npm @tauriArguments
    if ($LASTEXITCODE -ne 0) { throw "Tauri Windows installer build failed." }
}
finally {
    if ($null -ne $signingConfigPath -and (Test-Path -LiteralPath $signingConfigPath)) {
        Remove-Item -LiteralPath $signingConfigPath -Force
    }
}

node scripts/check-release-artifacts.mjs --collect
if ($LASTEXITCODE -ne 0) { throw "Built installer verification failed." }

$verificationArguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/verify-windows-installers.ps1")
if (-not $signedBuild) {
    $verificationArguments += "-AllowUnsigned"
}
& powershell @verificationArguments
if ($LASTEXITCODE -ne 0) { throw "Windows signature verification failed." }

Write-Host ""
Write-Host "WINDOWS INSTALLERS BUILT AND VERIFIED" -ForegroundColor Green
Write-Host "Artifacts: release-artifacts\windows\$version" -ForegroundColor Cyan
if ($signedBuild) {
    Write-Host "Authenticode: valid signature required and verified" -ForegroundColor Green
}
else {
    Write-Host "Authenticode: unsigned local rehearsal; do not publish these artifacts" -ForegroundColor Yellow
}
