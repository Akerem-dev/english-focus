param(
    [ValidateSet("Both", "NSIS", "MSI")]
    [string]$InstallerFamily = "Both",
    [switch]$SkipBuild,
    [switch]$SkipWinAppInstall,
    [switch]$LeaveUninstalled,
    [string]$ArtifactsDirectory = "",
    [string]$OutputDirectory = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($env:OS -ne "Windows_NT") {
    throw "Windows system acceptance tests must run on Windows."
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $root "test-results\windows-system"
}
elseif (-not [System.IO.Path]::IsPathRooted($OutputDirectory)) {
    $OutputDirectory = Join-Path $root $OutputDirectory
}

$runDirectory = Join-Path $OutputDirectory (Get-Date -Format "yyyyMMdd-HHmmss")
$logDirectory = Join-Path $runDirectory "logs"
$screenshotDirectory = Join-Path $runDirectory "screenshots"
$treeDirectory = Join-Path $runDirectory "ui-tree"
$preservedDirectory = Join-Path $runDirectory "preserved-user-data"

foreach ($directory in @($runDirectory, $logDirectory, $screenshotDirectory, $treeDirectory, $preservedDirectory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

$results = New-Object System.Collections.Generic.List[object]
$preservedData = New-Object System.Collections.Generic.List[object]
$script:CurrentFamily = "General"
$script:WinApp = $null

function Add-Result {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [ValidateSet("PASS", "FAIL", "SKIP", "INFO")]
        [string]$Status,
        [string]$Details = ""
    )

    $results.Add([pscustomobject]@{
        family = $script:CurrentFamily
        name = $Name
        status = $Status
        details = $Details
        timestamp = (Get-Date).ToString("o")
    })

    $suffix = ""
    if (-not [string]::IsNullOrWhiteSpace($Details)) {
        $suffix = " - $Details"
    }

    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "Gray" }
    }

    Write-Host "[$Status] $Name$suffix" -ForegroundColor $color
}

function Invoke-Check {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action,
        [switch]$Fatal
    )

    try {
        $details = & $Action
        if ($null -eq $details) {
            $details = ""
        }
        elseif ($details -is [array]) {
            $details = $details -join [Environment]::NewLine
        }
        else {
            $details = [string]$details
        }

        Add-Result -Name $Name -Status "PASS" -Details $details
        return $true
    }
    catch {
        Add-Result -Name $Name -Status "FAIL" -Details $_.Exception.Message
        if ($Fatal) {
            throw
        }
        return $false
    }
}

function Invoke-CommandLogged {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$LogName,
        [switch]$AllowFailure
    )

    $logPath = Join-Path $logDirectory $LogName
    $output = & $Executable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output | Out-File -FilePath $logPath -Encoding utf8

    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "$Executable exited with code $exitCode. See $logPath"
    }

    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = $output -join [Environment]::NewLine
        LogPath = $logPath
    }
}

function Resolve-WinApp {
    $command = Get-Command winapp -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }

    if ($SkipWinAppInstall) {
        throw "winapp CLI is missing and -SkipWinAppInstall was supplied."
    }

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($null -eq $winget) {
        throw "winget is required to install Microsoft.winappcli."
    }

    $arguments = @(
        "install",
        "--id", "Microsoft.winappcli",
        "--exact",
        "--source", "winget",
        "--silent",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--disable-interactivity"
    )
    $process = Start-Process -FilePath $winget.Source -ArgumentList $arguments -Wait -PassThru -NoNewWindow
    if ($process.ExitCode -ne 0) {
        throw "Microsoft.winappcli installation failed with exit code $($process.ExitCode)."
    }

    $command = Get-Command winapp -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }

    $roots = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"),
        (Join-Path $env:ProgramFiles "WindowsApps")
    )
    foreach ($searchRoot in $roots) {
        if (-not (Test-Path $searchRoot)) {
            continue
        }
        $candidate = Get-ChildItem -Path $searchRoot -Filter "winapp.exe" -File -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -ne $candidate) {
            return $candidate.FullName
        }
    }

    throw "Microsoft.winappcli was installed, but winapp.exe could not be located."
}

function Invoke-WinApp {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$LogName,
        [switch]$AllowFailure
    )

    if ([string]::IsNullOrWhiteSpace([string]$script:WinApp)) {
        throw "winapp CLI is not initialized."
    }

    return Invoke-CommandLogged -Executable $script:WinApp -Arguments $Arguments -LogName $LogName -AllowFailure:$AllowFailure
}

function Get-UninstallEntries {
    $registryPaths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $entries = New-Object System.Collections.Generic.List[object]
    foreach ($registryPath in $registryPaths) {
        $items = Get-ItemProperty -Path $registryPath -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -eq "English Focus" }
        foreach ($item in @($items)) {
            $entries.Add($item)
        }
    }
    return $entries
}

function Wait-UninstallState {
    param(
        [Parameter(Mandatory = $true)]
        [bool]$ShouldExist,
        [int]$TimeoutSeconds = 45
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $exists = (Get-UninstallEntries).Count -gt 0
        if ($exists -eq $ShouldExist) {
            return
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)

    throw "English Focus uninstall state did not become '$ShouldExist' in time."
}

function Install-EnglishFocus {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("NSIS", "MSI")]
        [string]$Family,
        [Parameter(Mandatory = $true)]
        [string]$InstallerPath
    )

    if ($Family -eq "NSIS") {
        $process = Start-Process -FilePath $InstallerPath -ArgumentList "/S" -Wait -PassThru
    }
    else {
        $arguments = @("/i", $InstallerPath, "/qn", "/norestart")
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $arguments -Wait -PassThru
    }

    if ($process.ExitCode -notin @(0, 3010)) {
        throw "$Family installer exited with code $($process.ExitCode)."
    }
    Wait-UninstallState -ShouldExist $true
}

function Uninstall-EnglishFocus {
    $entries = Get-UninstallEntries
    foreach ($entry in $entries) {
        $uninstallString = [string]$entry.UninstallString
        $quietString = [string]$entry.QuietUninstallString
        $productCode = [string]$entry.PSChildName

        if ($entry.WindowsInstaller -eq 1 -or $uninstallString -match "MsiExec") {
            if ($productCode -notmatch '^\{[0-9A-Fa-f-]+\}$' -and $uninstallString -match '(\{[0-9A-Fa-f-]+\})') {
                $productCode = $Matches[1]
            }
            $process = Start-Process -FilePath "msiexec.exe" -ArgumentList @(
                "/x", $productCode, "/qn", "/norestart"
            ) -Wait -PassThru
        }
        else {
            $command = $quietString
            if ([string]::IsNullOrWhiteSpace($command)) {
                $command = $uninstallString
            }
            if ([string]::IsNullOrWhiteSpace($command)) {
                throw "No NSIS uninstall command was registered."
            }

            $executable = ""
            $arguments = ""
            if ($command -match '^"([^"]+)"\s*(.*)$') {
                $executable = $Matches[1]
                $arguments = $Matches[2]
            }
            else {
                $parts = $command.Split(' ', 2)
                $executable = $parts[0]
                if ($parts.Count -gt 1) {
                    $arguments = $parts[1]
                }
            }
            if ($arguments -notmatch '(^|\s)/S($|\s)') {
                $arguments = "$arguments /S".Trim()
            }
            $process = Start-Process -FilePath $executable -ArgumentList $arguments -Wait -PassThru
        }

        if ($process.ExitCode -notin @(0, 1605, 1614, 3010)) {
            throw "Uninstaller exited with code $($process.ExitCode)."
        }
    }
    Wait-UninstallState -ShouldExist $false
}

function Get-InstalledExecutable {
    param([Parameter(Mandatory = $true)][object]$Entry)

    $candidates = New-Object System.Collections.Generic.List[string]
    if (-not [string]::IsNullOrWhiteSpace([string]$Entry.DisplayIcon)) {
        $icon = [string]$Entry.DisplayIcon
        if ($icon -match '^"([^"]+)"') {
            $candidates.Add($Matches[1])
        }
        else {
            $candidates.Add(($icon -split ',')[0].Trim('"'))
        }
    }
    if (-not [string]::IsNullOrWhiteSpace([string]$Entry.InstallLocation)) {
        $location = [string]$Entry.InstallLocation
        foreach ($file in @(Get-ChildItem -Path $location -Filter "*.exe" -File -ErrorAction SilentlyContinue)) {
            if ($file.Name -notmatch "uninstall") {
                $candidates.Add($file.FullName)
            }
        }
    }

    foreach ($candidate in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            return (Resolve-Path $candidate).Path
        }
    }
    throw "Installed English Focus executable could not be found."
}

function Get-StartMenuShortcuts {
    $roots = @(
        (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"),
        (Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs")
    )
    $found = New-Object System.Collections.Generic.List[object]
    foreach ($menuRoot in $roots) {
        if (-not (Test-Path $menuRoot)) {
            continue
        }
        foreach ($shortcut in @(Get-ChildItem -Path $menuRoot -Filter "*.lnk" -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*English Focus*" })) {
            $found.Add($shortcut)
        }
    }
    return $found
}

function Get-PeSubsystem {
    param([Parameter(Mandatory = $true)][string]$ExecutablePath)

    $stream = [System.IO.File]::OpenRead($ExecutablePath)
    $reader = New-Object System.IO.BinaryReader($stream)
    try {
        $stream.Position = 0x3C
        $peOffset = $reader.ReadInt32()
        $stream.Position = $peOffset + 24
        $magic = $reader.ReadUInt16()
        if ($magic -notin @(0x10B, 0x20B)) {
            throw "Unsupported PE optional-header magic: $magic"
        }
        $stream.Position = $peOffset + 24 + 68
        return $reader.ReadUInt16()
    }
    finally {
        $reader.Dispose()
        $stream.Dispose()
    }
}

function Get-JsonObjects {
    param([Parameter(Mandatory = $true)][object]$Value)

    $items = New-Object System.Collections.Generic.List[object]
    function Visit-Value {
        param([object]$Current)
        if ($null -eq $Current) {
            return
        }
        if ($Current -is [string] -or $Current.GetType().IsPrimitive) {
            return
        }
        $items.Add($Current)
        if ($Current -is [System.Collections.IEnumerable] -and $Current -isnot [pscustomobject]) {
            foreach ($child in $Current) {
                Visit-Value -Current $child
            }
            return
        }
        foreach ($property in $Current.PSObject.Properties) {
            Visit-Value -Current $property.Value
        }
    }
    Visit-Value -Current $Value
    return $items
}

function Get-PropertyValue {
    param(
        [Parameter(Mandatory = $true)][object]$Object,
        [Parameter(Mandatory = $true)][string[]]$Names
    )
    foreach ($name in $Names) {
        $property = $Object.PSObject.Properties[$name]
        if ($null -ne $property) {
            return $property.Value
        }
    }
    return $null
}

function Find-UiElementId {
    param(
        [Parameter(Mandatory = $true)][int]$ProcessId,
        [Parameter(Mandatory = $true)][string]$SearchText,
        [Parameter(Mandatory = $true)][string]$ControlTypePattern,
        [Parameter(Mandatory = $true)][string]$LogPrefix
    )

    $search = Invoke-WinApp -Arguments @(
        "ui", "search", $SearchText,
        "-a", [string]$ProcessId,
        "--json"
    ) -LogName "$LogPrefix-search.json" -AllowFailure
    if ($search.ExitCode -ne 0) {
        throw "No UI element matched '$SearchText'. See $($search.LogPath)"
    }

    $document = $search.Output | ConvertFrom-Json
    foreach ($item in @(Get-JsonObjects -Value $document)) {
        $name = [string](Get-PropertyValue -Object $item -Names @("name", "Name"))
        $type = [string](Get-PropertyValue -Object $item -Names @("controlType", "ControlType", "type", "Type"))
        $id = [string](Get-PropertyValue -Object $item -Names @("elementId", "ElementId", "id", "Id", "slug", "Slug"))
        if ($name -eq $SearchText -and $type -match $ControlTypePattern -and -not [string]::IsNullOrWhiteSpace($id)) {
            return $id
        }
    }
    throw "A matching '$SearchText' control was found, but its stable element id was unavailable."
}

function Stop-EnglishFocusProcesses {
    Get-Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ProcessName -eq "english-learning-platform" -or
            $_.MainWindowTitle -eq "English Focus"
        } |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

function Wait-ProcessExit {
    param([Parameter(Mandatory = $true)][int]$ProcessId)
    $deadline = (Get-Date).AddSeconds(20)
    do {
        if ($null -eq (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
            return
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)
    throw "English Focus process $ProcessId did not exit in time."
}

function Preserve-UserData {
    $paths = @(
        (Join-Path $env:APPDATA "com.englishfocus.desktop"),
        (Join-Path $env:APPDATA "English Focus")
    )
    foreach ($path in $paths) {
        if (-not (Test-Path $path)) {
            continue
        }
        $name = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($path)).TrimEnd('=').Replace('/', '_').Replace('+', '-')
        $backup = Join-Path $preservedDirectory $name
        Copy-Item -Path $path -Destination $backup -Recurse -Force
        Remove-Item -Path $path -Recurse -Force
        $preservedData.Add([pscustomobject]@{ Original = $path; Backup = $backup })
    }
}

function Restore-UserData {
    $testPaths = @(
        (Join-Path $env:APPDATA "com.englishfocus.desktop"),
        (Join-Path $env:APPDATA "English Focus")
    )
    foreach ($path in $testPaths) {
        if (Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force
        }
    }
    foreach ($record in $preservedData) {
        Copy-Item -Path $record.Backup -Destination $record.Original -Recurse -Force
    }
}

function Test-NativeApplication {
    param(
        [Parameter(Mandatory = $true)][string]$ExecutablePath,
        [Parameter(Mandatory = $true)][string]$Family
    )

    $subsystem = Get-PeSubsystem -ExecutablePath $ExecutablePath
    if ($subsystem -ne 2) {
        throw "Installed executable uses PE subsystem $subsystem instead of Windows GUI subsystem 2."
    }

    $process = Start-Process -FilePath $ExecutablePath -PassThru
    try {
        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Search your local vocabulary",
            "-a", [string]$process.Id,
            "--timeout", "30000"
        ) -LogName "$Family-wait-home.log" | Out-Null
        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Local runtime connected",
            "-a", [string]$process.Id,
            "--timeout", "30000"
        ) -LogName "$Family-wait-runtime.log" | Out-Null
        Invoke-WinApp -Arguments @(
            "ui", "screenshot",
            "-a", [string]$process.Id,
            "--output", (Join-Path $screenshotDirectory "$Family-vocabulary.png")
        ) -LogName "$Family-screenshot-home.log" | Out-Null

        $tree = Invoke-WinApp -Arguments @(
            "ui", "inspect",
            "-a", [string]$process.Id,
            "--interactive",
            "--depth", "12",
            "--json"
        ) -LogName "$Family-ui-tree.json"
        $tree.Output | Out-File -FilePath (Join-Path $treeDirectory "$Family-ui-tree.json") -Encoding utf8

        $document = $tree.Output | ConvertFrom-Json
        $unnamed = New-Object System.Collections.Generic.List[string]
        foreach ($item in @(Get-JsonObjects -Value $document)) {
            $focusable = Get-PropertyValue -Object $item -Names @("isKeyboardFocusable", "IsKeyboardFocusable")
            $name = [string](Get-PropertyValue -Object $item -Names @("name", "Name"))
            $type = [string](Get-PropertyValue -Object $item -Names @("controlType", "ControlType", "type", "Type"))
            if ($focusable -eq $true -and [string]::IsNullOrWhiteSpace($name)) {
                $unnamed.Add($type)
            }
        }
        if ($unnamed.Count -gt 0) {
            throw "Focusable controls without accessible names: $($unnamed -join ', ')"
        }

        $searchInput = Find-UiElementId -ProcessId $process.Id -SearchText "Search vocabulary" -ControlTypePattern "Edit|TextBox" -LogPrefix "$Family-search-input"
        $searchButton = Find-UiElementId -ProcessId $process.Id -SearchText "Search vocabulary" -ControlTypePattern "Button" -LogPrefix "$Family-search-button"
        Invoke-WinApp -Arguments @(
            "ui", "set-value", $searchInput, "maintain",
            "-a", [string]$process.Id
        ) -LogName "$Family-set-search.log" | Out-Null
        Invoke-WinApp -Arguments @(
            "ui", "invoke", $searchButton,
            "-a", [string]$process.Id
        ) -LogName "$Family-submit-search.log" | Out-Null
        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "maintain",
            "-a", [string]$process.Id,
            "--timeout", "10000"
        ) -LogName "$Family-wait-maintain.log" | Out-Null

        Invoke-WinApp -Arguments @("ui", "invoke", "Library", "-a", [string]$process.Id) -LogName "$Family-open-library.log" | Out-Null
        Invoke-WinApp -Arguments @("ui", "wait-for", "Library", "-a", [string]$process.Id, "--timeout", "10000") -LogName "$Family-wait-library.log" | Out-Null
        Invoke-WinApp -Arguments @("ui", "screenshot", "-a", [string]$process.Id, "--output", (Join-Path $screenshotDirectory "$Family-library.png")) -LogName "$Family-screenshot-library.log" | Out-Null

        Invoke-WinApp -Arguments @("ui", "invoke", "Settings", "-a", [string]$process.Id) -LogName "$Family-open-settings.log" | Out-Null
        Invoke-WinApp -Arguments @("ui", "wait-for", "Settings", "-a", [string]$process.Id, "--timeout", "10000") -LogName "$Family-wait-settings.log" | Out-Null
        Invoke-WinApp -Arguments @("ui", "screenshot", "-a", [string]$process.Id, "--output", (Join-Path $screenshotDirectory "$Family-settings.png")) -LogName "$Family-screenshot-settings.log" | Out-Null

        [void]$process.CloseMainWindow()
        Wait-ProcessExit -ProcessId $process.Id

        $reopened = Start-Process -FilePath $ExecutablePath -PassThru
        try {
            Invoke-WinApp -Arguments @(
                "ui", "wait-for", "maintain",
                "-a", [string]$reopened.Id,
                "--timeout", "30000"
            ) -LogName "$Family-reopen-persistence.log" | Out-Null
        }
        finally {
            if ($null -ne (Get-Process -Id $reopened.Id -ErrorAction SilentlyContinue)) {
                Stop-Process -Id $reopened.Id -Force -ErrorAction SilentlyContinue
            }
        }

        $dataPath = Join-Path $env:APPDATA "com.englishfocus.desktop"
        $databasePath = Join-Path $dataPath "english-focus.sqlite3"
        if (-not (Test-Path $databasePath)) {
            throw "Expected SQLite database was not created: $databasePath"
        }
        if ((Get-Item $databasePath).Length -le 0) {
            throw "SQLite database exists but is empty."
        }

        return "PE GUI subsystem, real Rust runtime, UI Automation tree, exact search, navigation, restart persistence, screenshots, and SQLite creation passed."
    }
    finally {
        if ($null -ne (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-InstallerFamily {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("NSIS", "MSI")][string]$Family,
        [Parameter(Mandatory = $true)][string]$InstallerPath
    )

    $script:CurrentFamily = $Family
    Stop-EnglishFocusProcesses
    if ((Get-UninstallEntries).Count -gt 0) {
        Uninstall-EnglishFocus
    }

    $installed = Invoke-Check -Name "$Family clean installation" -Action {
        Install-EnglishFocus -Family $Family -InstallerPath $InstallerPath
        "$Family installer completed successfully."
    }
    if (-not $installed) {
        Add-Result -Name "$Family native checks" -Status "SKIP" -Details "Installation did not complete."
        return
    }

    $executablePath = ""
    try {
        $entries = Get-UninstallEntries
        Invoke-Check -Name "$Family registration and version" -Action {
            if ($entries.Count -eq 0) {
                throw "No uninstall registration was found."
            }
            $entry = $entries | Select-Object -First 1
            if ([string]$entry.DisplayVersion -ne "1.0.0") {
                throw "Expected version 1.0.0, got '$($entry.DisplayVersion)'."
            }
            "English Focus 1.0.0 is registered."
        } | Out-Null

        Invoke-Check -Name "$Family executable discovery" -Action {
            $script:ResolvedExecutable = Get-InstalledExecutable -Entry ($entries | Select-Object -First 1)
            $script:ResolvedExecutable
        } -Fatal | Out-Null
        $executablePath = [string]$script:ResolvedExecutable

        Invoke-Check -Name "$Family Start menu shortcut" -Action {
            $shortcuts = Get-StartMenuShortcuts
            if ($shortcuts.Count -eq 0) {
                throw "English Focus Start menu shortcut is missing."
            }
            $shortcuts[0].FullName
        } | Out-Null

        Invoke-Check -Name "$Family native application acceptance" -Action {
            Test-NativeApplication -ExecutablePath $executablePath -Family $Family
        } | Out-Null
    }
    finally {
        Stop-EnglishFocusProcesses
        Invoke-Check -Name "$Family uninstall cleanup" -Action {
            Uninstall-EnglishFocus
            if (-not [string]::IsNullOrWhiteSpace($executablePath) -and (Test-Path $executablePath)) {
                throw "Installed executable remains after uninstall: $executablePath"
            }
            if ((Get-StartMenuShortcuts).Count -gt 0) {
                throw "Start menu shortcut remains after uninstall."
            }
            "Registration, executable, and shortcuts were removed."
        } | Out-Null
    }
}

function Write-Reports {
    $jsonPath = Join-Path $runDirectory "windows-system-report.json"
    $markdownPath = Join-Path $runDirectory "windows-system-report.md"
    $results | ConvertTo-Json -Depth 8 | Out-File -FilePath $jsonPath -Encoding utf8

    $passed = @($results | Where-Object { $_.status -eq "PASS" }).Count
    $failed = @($results | Where-Object { $_.status -eq "FAIL" }).Count
    $skipped = @($results | Where-Object { $_.status -eq "SKIP" }).Count

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# English Focus Windows System Acceptance")
    $lines.Add("")
    $lines.Add("- Source commit: $((git rev-parse HEAD).Trim())")
    $lines.Add("- Generated: $(Get-Date -Format o)")
    $lines.Add("- Passed: **$passed**")
    $lines.Add("- Failed: **$failed**")
    $lines.Add("- Skipped: **$skipped**")
    $lines.Add("")
    $lines.Add("| Installer | Check | Result | Details |")
    $lines.Add("| --- | --- | --- | --- |")
    foreach ($result in $results) {
        $details = ([string]$result.details).Replace("|", "\|").Replace("`r", " ").Replace("`n", " ")
        $lines.Add("| $($result.family) | $($result.name) | $($result.status) | $details |")
    }
    $lines.Add("")
    $lines.Add("## Deliberately manual release evidence")
    $lines.Add("")
    $lines.Add("Code cannot honestly judge subjective visual polish, listen to Narrator speech quality, establish SmartScreen reputation, or verify a production certificate that was not supplied.")
    $lines | Out-File -FilePath $markdownPath -Encoding utf8

    return [pscustomobject]@{ Passed = $passed; Failed = $failed; Skipped = $skipped; Markdown = $markdownPath }
}

try {
    if (-not $SkipBuild) {
        $script:CurrentFamily = "Build"
        Invoke-Check -Name "Fresh unsigned MSI and NSIS build" -Action {
            $result = Invoke-CommandLogged -Executable "npm" -Arguments @("run", "release:windows:unsigned") -LogName "release-build.log"
            $result.Output | Select-Object -Last 1
        } -Fatal | Out-Null
    }

    if ([string]::IsNullOrWhiteSpace($ArtifactsDirectory)) {
        $ArtifactsDirectory = Join-Path $root "release-artifacts\windows\1.0.0"
    }
    elseif (-not [System.IO.Path]::IsPathRooted($ArtifactsDirectory)) {
        $ArtifactsDirectory = Join-Path $root $ArtifactsDirectory
    }

    $nsis = Get-ChildItem -Path $ArtifactsDirectory -Filter "*-setup.exe" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    $msi = Get-ChildItem -Path $ArtifactsDirectory -Filter "*.msi" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    $manifestPath = Join-Path $ArtifactsDirectory "release-manifest.json"
    $checksumPath = Join-Path $ArtifactsDirectory "SHA256SUMS.txt"

    $script:CurrentFamily = "Artifacts"
    Invoke-Check -Name "Artifact inventory" -Action {
        if ($null -eq $nsis -or $null -eq $msi -or -not (Test-Path $manifestPath) -or -not (Test-Path $checksumPath)) {
            throw "MSI, NSIS, release-manifest.json, or SHA256SUMS.txt is missing."
        }
        "Complete artifact set found."
    } -Fatal | Out-Null

    Invoke-Check -Name "Manifest version and source commit" -Action {
        $manifest = Get-Content -Path $manifestPath -Raw
        $commit = (git rev-parse HEAD).Trim()
        if ($manifest -notmatch [regex]::Escape($commit)) {
            throw "Manifest does not contain source commit $commit."
        }
        if ($manifest -notmatch '"version"\s*:\s*"1\.0\.0"') {
            throw "Manifest does not report version 1.0.0."
        }
        "Manifest matches version 1.0.0 and commit $commit."
    } | Out-Null

    Invoke-Check -Name "Installer SHA-256 checksums" -Action {
        $checksums = (Get-Content -Path $checksumPath -Raw).ToLowerInvariant()
        foreach ($installer in @($nsis, $msi)) {
            $hash = (Get-FileHash -Path $installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($checksums -notmatch [regex]::Escape($hash)) {
                throw "Checksum mismatch for $($installer.Name)."
            }
        }
        "Both hashes match SHA256SUMS.txt."
    } | Out-Null

    $script:CurrentFamily = "Prerequisites"
    Invoke-Check -Name "Preserve existing user data" -Action {
        Preserve-UserData
        "$($preservedData.Count) existing data directories preserved."
    } -Fatal | Out-Null

    Invoke-Check -Name "Microsoft winapp CLI" -Action {
        $script:WinApp = Resolve-WinApp
        $help = Invoke-CommandLogged -Executable $script:WinApp -Arguments @("--help") -LogName "winapp-help.log"
        if ($help.Output -notmatch "winapp") {
            throw "winapp CLI help output was unexpected."
        }
        $script:WinApp
    } -Fatal | Out-Null

    if ($InstallerFamily -in @("Both", "NSIS")) {
        Test-InstallerFamily -Family "NSIS" -InstallerPath $nsis.FullName
    }
    if ($InstallerFamily -in @("Both", "MSI")) {
        Test-InstallerFamily -Family "MSI" -InstallerPath $msi.FullName
    }
}
finally {
    Stop-EnglishFocusProcesses
    if ((Get-UninstallEntries).Count -gt 0) {
        try {
            Uninstall-EnglishFocus
        }
        catch {
            $script:CurrentFamily = "Cleanup"
            Add-Result -Name "Final uninstall cleanup" -Status "FAIL" -Details $_.Exception.Message
        }
    }

    try {
        Restore-UserData
        $script:CurrentFamily = "Cleanup"
        Add-Result -Name "Restore preserved user data" -Status "PASS" -Details "Test data removed and original data restored."
    }
    catch {
        $script:CurrentFamily = "Cleanup"
        Add-Result -Name "Restore preserved user data" -Status "FAIL" -Details $_.Exception.Message
    }

    if (-not $LeaveUninstalled -and $null -ne $msi) {
        try {
            Install-EnglishFocus -Family "MSI" -InstallerPath $msi.FullName
            $script:CurrentFamily = "Cleanup"
            Add-Result -Name "Leave verified MSI installed" -Status "PASS" -Details "English Focus 1.0.0 reinstalled after acceptance."
        }
        catch {
            $script:CurrentFamily = "Cleanup"
            Add-Result -Name "Leave verified MSI installed" -Status "FAIL" -Details $_.Exception.Message
        }
    }
}

$report = Write-Reports
Write-Host ""
Write-Host "WINDOWS SYSTEM ACCEPTANCE COMPLETE" -ForegroundColor Cyan
Write-Host "Passed: $($report.Passed)"
Write-Host "Failed: $($report.Failed)"
Write-Host "Skipped: $($report.Skipped)"
Write-Host "Report: $($report.Markdown)"
Write-Host "Evidence: $runDirectory"

if ($report.Failed -gt 0) {
    exit 1
}

Write-Host "WINDOWS SYSTEM ACCEPTANCE PASSED" -ForegroundColor Green
