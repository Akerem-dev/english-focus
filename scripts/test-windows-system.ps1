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

if (-not $SkipBuild) {
    Write-Host "==> Build and verify fresh unsigned Windows installers" -ForegroundColor Cyan
    & npm run release:windows:unsigned
    if ($LASTEXITCODE -ne 0) {
        throw "Windows installer build failed with exit code $LASTEXITCODE."
    }
}

if ([string]::IsNullOrWhiteSpace($ArtifactsDirectory)) {
    $ArtifactsDirectory = Join-Path $root "release-artifacts\windows\1.0.0"
}
elseif (-not [System.IO.Path]::IsPathRooted($ArtifactsDirectory)) {
    $ArtifactsDirectory = Join-Path $root $ArtifactsDirectory
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
$dataBackupDirectory = Join-Path $runDirectory "preserved-user-data"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $screenshotDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $treeDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $dataBackupDirectory | Out-Null

$results = New-Object System.Collections.Generic.List[object]
$script:WinAppExecutable = $null
$script:CurrentFamily = "General"
$script:PreservedData = New-Object System.Collections.Generic.List[object]

function Add-TestResult {
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

    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "Gray" }
    }

    Write-Host "[$Status] $Name$(if ($Details) { " — $Details" } else { "" })" -ForegroundColor $color
}

function Invoke-TestCheck {
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
            $details = ($details -join [Environment]::NewLine)
        }
        else {
            $details = [string]$details
        }
        Add-TestResult -Name $Name -Status "PASS" -Details $details
        return $true
    }
    catch {
        Add-TestResult -Name $Name -Status "FAIL" -Details $_.Exception.Message
        if ($Fatal) {
            throw
        }
        return $false
    }
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$LogName
    )

    $logPath = Join-Path $logDirectory $LogName
    $output = & $FilePath @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output | Out-File -FilePath $logPath -Encoding utf8

    if ($exitCode -ne 0) {
        throw "$FilePath exited with code $exitCode. See $logPath"
    }

    return ($output -join [Environment]::NewLine)
}

function Resolve-WinAppExecutable {
    $command = Get-Command winapp -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }

    if ($SkipWinAppInstall) {
        throw "winapp CLI is not installed and -SkipWinAppInstall was supplied."
    }

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($null -eq $winget) {
        throw "winget is required to install Microsoft.WinAppCLI automatically."
    }

    Write-Host "==> Install Microsoft WinApp CLI" -ForegroundColor Cyan
    $process = Start-Process -FilePath $winget.Source -ArgumentList @(
        "install",
        "--id", "Microsoft.WinAppCLI",
        "--exact",
        "--silent",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--disable-interactivity"
    ) -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -ne 0) {
        throw "Microsoft.WinAppCLI installation failed with exit code $($process.ExitCode)."
    }

    $command = Get-Command winapp -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        return $command.Source
    }

    $searchRoots = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"),
        (Join-Path $env:ProgramFiles "WindowsApps")
    )

    foreach ($searchRoot in $searchRoots) {
        if (-not (Test-Path $searchRoot)) {
            continue
        }

        $candidate = Get-ChildItem -Path $searchRoot -Filter "winapp.exe" -File -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -ne $candidate) {
            return $candidate.FullName
        }
    }

    throw "Microsoft.WinAppCLI was installed but winapp.exe could not be located."
}

function Invoke-WinApp {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$LogName
    )

    if ([string]::IsNullOrWhiteSpace([string]$script:WinAppExecutable)) {
        throw "winapp CLI has not been resolved."
    }

    return Invoke-NativeCommand -FilePath $script:WinAppExecutable -Arguments $Arguments -LogName $LogName
}

function Get-NodeProperty {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Node,
        [Parameter(Mandatory = $true)]
        [string[]]$Names
    )

    foreach ($name in $Names) {
        $property = $Node.PSObject.Properties[$name]
        if ($null -ne $property) {
            return $property.Value
        }
    }

    return $null
}

function Add-FlattenedNode {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Node,
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[object]]$Target
    )

    $Target.Add($Node)
    $children = Get-NodeProperty -Node $Node -Names @("children", "Children")
    if ($null -eq $children) {
        return
    }

    foreach ($child in @($children)) {
        Add-FlattenedNode -Node $child -Target $Target
    }
}

function Get-UiNodes {
    param(
        [Parameter(Mandatory = $true)]
        [int]$ApplicationProcessId,
        [Parameter(Mandatory = $true)]
        [string]$FileName
    )

    $raw = Invoke-WinApp -Arguments @(
        "ui", "inspect",
        "-a", [string]$ApplicationProcessId,
        "--interactive",
        "--depth", "12",
        "--json"
    ) -LogName $FileName

    $raw | Out-File -FilePath (Join-Path $treeDirectory $FileName) -Encoding utf8
    $document = $raw | ConvertFrom-Json
    $nodes = New-Object System.Collections.Generic.List[object]
    $windows = Get-NodeProperty -Node $document -Names @("windows", "Windows")

    foreach ($window in @($windows)) {
        $elements = Get-NodeProperty -Node $window -Names @("elements", "Elements", "children", "Children")
        foreach ($element in @($elements)) {
            Add-FlattenedNode -Node $element -Target $nodes
        }
    }

    return ,$nodes
}

function Find-UiSelector {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[object]]$Nodes,
        [Parameter(Mandatory = $true)]
        [string]$NamePattern,
        [string]$TypePattern = ".*"
    )

    foreach ($node in $Nodes) {
        $name = [string](Get-NodeProperty -Node $node -Names @("name", "Name"))
        $type = [string](Get-NodeProperty -Node $node -Names @("controlType", "ControlType", "type", "Type"))
        if ($name -match $NamePattern -and $type -match $TypePattern) {
            $selector = Get-NodeProperty -Node $node -Names @("elementId", "ElementId", "id", "Id", "selector", "Selector")
            if (-not [string]::IsNullOrWhiteSpace([string]$selector)) {
                return [string]$selector
            }
            return $name
        }
    }

    throw "No UI element matched name '$NamePattern' and type '$TypePattern'."
}

function Assert-AccessibleInteractiveControls {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[object]]$Nodes
    )

    $missingNames = New-Object System.Collections.Generic.List[string]
    foreach ($node in $Nodes) {
        $focusable = Get-NodeProperty -Node $node -Names @(
            "isKeyboardFocusable",
            "IsKeyboardFocusable",
            "keyboardFocusable",
            "KeyboardFocusable"
        )
        $name = [string](Get-NodeProperty -Node $node -Names @("name", "Name"))
        $type = [string](Get-NodeProperty -Node $node -Names @("controlType", "ControlType", "type", "Type"))
        $selector = [string](Get-NodeProperty -Node $node -Names @("elementId", "ElementId", "id", "Id"))

        if ($focusable -eq $true -and [string]::IsNullOrWhiteSpace($name)) {
            $missingNames.Add("$type ($selector)")
        }
    }

    if ($missingNames.Count -gt 0) {
        throw "Keyboard-focusable controls without accessible names: $($missingNames -join ', ')"
    }

    return "$($Nodes.Count) interactive UI nodes inspected; no unnamed keyboard-focusable controls found."
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

function Wait-ForUninstallEntry {
    param(
        [bool]$ShouldExist,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $exists = (Get-UninstallEntries).Count -gt 0
        if ($exists -eq $ShouldExist) {
            return
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)

    throw "English Focus uninstall registry state did not become '$ShouldExist' within $TimeoutSeconds seconds."
}

function Get-ExecutableFromEntry {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Entry
    )

    $candidates = New-Object System.Collections.Generic.List[string]
    if (-not [string]::IsNullOrWhiteSpace([string]$Entry.DisplayIcon)) {
        $displayIcon = [string]$Entry.DisplayIcon
        if ($displayIcon -match '^"([^"]+)"') {
            $candidates.Add($Matches[1])
        }
        elseif ($displayIcon -match '^([^,]+)') {
            $candidates.Add($Matches[1].Trim('"'))
        }
    }

    if (-not [string]::IsNullOrWhiteSpace([string]$Entry.InstallLocation)) {
        $installLocation = [string]$Entry.InstallLocation
        $candidates.Add((Join-Path $installLocation "English Focus.exe"))
        $candidates.Add((Join-Path $installLocation "english-learning-platform.exe"))
        if (Test-Path $installLocation) {
            foreach ($file in @(Get-ChildItem -Path $installLocation -Filter "*.exe" -File -ErrorAction SilentlyContinue)) {
                if ($file.Name -notmatch "uninstall") {
                    $candidates.Add($file.FullName)
                }
            }
        }
    }

    $candidates.Add((Join-Path $env:LOCALAPPDATA "English Focus\English Focus.exe"))
    $candidates.Add((Join-Path $env:LOCALAPPDATA "English Focus\english-learning-platform.exe"))
    $candidates.Add((Join-Path $env:ProgramFiles "English Focus\English Focus.exe"))
    $candidates.Add((Join-Path $env:ProgramFiles "English Focus\english-learning-platform.exe"))

    foreach ($candidate in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            return (Resolve-Path $candidate).Path
        }
    }

    throw "The installed English Focus executable could not be found."
}

function Get-StartMenuShortcuts {
    $roots = @(
        (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"),
        (Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs")
    )

    $shortcuts = New-Object System.Collections.Generic.List[object]
    foreach ($shortcutRoot in $roots) {
        if (-not (Test-Path $shortcutRoot)) {
            continue
        }
        foreach ($shortcut in @(Get-ChildItem -Path $shortcutRoot -Filter "*.lnk" -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "*English Focus*" })) {
            $shortcuts.Add($shortcut)
        }
    }

    return $shortcuts
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
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList @(
            "/i", "`"$InstallerPath`"", "/qn", "/norestart"
        ) -Wait -PassThru
    }

    if ($process.ExitCode -notin @(0, 3010)) {
        throw "$Family installer exited with code $($process.ExitCode)."
    }

    Wait-ForUninstallEntry -ShouldExist $true
}

function Uninstall-EnglishFocus {
    $entries = Get-UninstallEntries
    foreach ($entry in $entries) {
        $uninstallString = [string]$entry.UninstallString
        $quietUninstallString = [string]$entry.QuietUninstallString
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
            $command = if (-not [string]::IsNullOrWhiteSpace($quietUninstallString)) {
                $quietUninstallString
            }
            else {
                $uninstallString
            }

            if ([string]::IsNullOrWhiteSpace($command)) {
                throw "English Focus has no usable uninstall command."
            }

            if ($command -match '^"([^"]+)"\s*(.*)$') {
                $executable = $Matches[1]
                $arguments = $Matches[2]
            }
            else {
                $parts = $command.Split(' ', 2)
                $executable = $parts[0]
                $arguments = if ($parts.Count -gt 1) { $parts[1] } else { "" }
            }

            if ($arguments -notmatch '(^|\s)/S($|\s)') {
                $arguments = "$arguments /S".Trim()
            }
            $process = Start-Process -FilePath $executable -ArgumentList $arguments -Wait -PassThru
        }

        if ($process.ExitCode -notin @(0, 1605, 1614, 3010)) {
            throw "English Focus uninstaller exited with code $($process.ExitCode)."
        }
    }

    Wait-ForUninstallEntry -ShouldExist $false
}

function Stop-EnglishFocusProcesses {
    Get-Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ProcessName -in @("english-learning-platform", "English Focus") -or
            $_.MainWindowTitle -eq "English Focus"
        } |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

function Wait-ForProcessExit {
    param(
        [Parameter(Mandatory = $true)]
        [int]$ApplicationProcessId,
        [int]$TimeoutSeconds = 15
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        if ($null -eq (Get-Process -Id $ApplicationProcessId -ErrorAction SilentlyContinue)) {
            return
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "Application process $ApplicationProcessId did not exit within $TimeoutSeconds seconds."
}

function Preserve-UserData {
    $dataPaths = @(
        (Join-Path $env:APPDATA "com.englishfocus.desktop"),
        (Join-Path $env:APPDATA "English Focus")
    )

    foreach ($dataPath in $dataPaths) {
        if (-not (Test-Path $dataPath)) {
            continue
        }

        $backupName = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($dataPath)).TrimEnd('=').Replace('/', '_').Replace('+', '-')
        $backupPath = Join-Path $dataBackupDirectory $backupName
        Copy-Item -Path $dataPath -Destination $backupPath -Recurse -Force
        Remove-Item -Path $dataPath -Recurse -Force
        $script:PreservedData.Add([pscustomobject]@{
            original = $dataPath
            backup = $backupPath
        })
    }
}

function Restore-UserData {
    $testDataPaths = @(
        (Join-Path $env:APPDATA "com.englishfocus.desktop"),
        (Join-Path $env:APPDATA "English Focus")
    )

    foreach ($dataPath in $testDataPaths) {
        if (Test-Path $dataPath) {
            Remove-Item -Path $dataPath -Recurse -Force
        }
    }

    foreach ($preserved in $script:PreservedData) {
        $parent = Split-Path -Parent $preserved.original
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
        Copy-Item -Path $preserved.backup -Destination $preserved.original -Recurse -Force
    }
}

function Test-ApplicationUi {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ApplicationPath,
        [Parameter(Mandatory = $true)]
        [string]$Family
    )

    $process = Start-Process -FilePath $ApplicationPath -PassThru
    try {
        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Search your local vocabulary",
            "-a", [string]$process.Id,
            "--timeout", "30000"
        ) -LogName "$Family-wait-initial.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Local runtime connected",
            "-a", [string]$process.Id,
            "--timeout", "30000"
        ) -LogName "$Family-runtime.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "screenshot",
            "-a", [string]$process.Id,
            "-o", (Join-Path $screenshotDirectory "$Family-01-vocabulary.png")
        ) -LogName "$Family-screenshot-vocabulary.log" | Out-Null

        $nodes = Get-UiNodes -ApplicationProcessId $process.Id -FileName "$Family-initial-ui.json"
        Assert-AccessibleInteractiveControls -Nodes $nodes | Out-Null

        $searchInput = Find-UiSelector -Nodes $nodes -NamePattern '^Search vocabulary$' -TypePattern 'Edit|TextBox|Document'
        $searchButton = Find-UiSelector -Nodes $nodes -NamePattern '^(Search|Search vocabulary)$' -TypePattern 'Button'

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

        Invoke-WinApp -Arguments @(
            "ui", "screenshot",
            "-a", [string]$process.Id,
            "-o", (Join-Path $screenshotDirectory "$Family-02-maintain.png")
        ) -LogName "$Family-screenshot-maintain.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "invoke", "Library",
            "-a", [string]$process.Id
        ) -LogName "$Family-open-library.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Library",
            "-a", [string]$process.Id,
            "--timeout", "10000"
        ) -LogName "$Family-wait-library.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "screenshot",
            "-a", [string]$process.Id,
            "-o", (Join-Path $screenshotDirectory "$Family-03-library.png")
        ) -LogName "$Family-screenshot-library.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "invoke", "Settings",
            "-a", [string]$process.Id
        ) -LogName "$Family-open-settings.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "wait-for", "Settings",
            "-a", [string]$process.Id,
            "--timeout", "10000"
        ) -LogName "$Family-wait-settings.log" | Out-Null

        Invoke-WinApp -Arguments @(
            "ui", "screenshot",
            "-a", [string]$process.Id,
            "-o", (Join-Path $screenshotDirectory "$Family-04-settings.png")
        ) -LogName "$Family-screenshot-settings.log" | Out-Null

        $windowOutput = Invoke-WinApp -Arguments @(
            "ui", "list-windows",
            "-a", [string]$process.Id,
            "--json"
        ) -LogName "$Family-windows.json"
        $windowOutput | Out-File -FilePath (Join-Path $treeDirectory "$Family-windows.json") -Encoding utf8
        if ($windowOutput -match '(?i)command prompt|powershell') {
            throw "A console window was associated with the English Focus process."
        }

        Invoke-WinApp -Arguments @(
            "ui", "send-keys", "alt+f4",
            "-a", [string]$process.Id
        ) -LogName "$Family-close.log" | Out-Null
        Wait-ForProcessExit -ApplicationProcessId $process.Id

        $reopened = Start-Process -FilePath $ApplicationPath -PassThru
        try {
            Invoke-WinApp -Arguments @(
                "ui", "wait-for", "maintain",
                "-a", [string]$reopened.Id,
                "--timeout", "30000"
            ) -LogName "$Family-persistence.log" | Out-Null

            Invoke-WinApp -Arguments @(
                "ui", "screenshot",
                "-a", [string]$reopened.Id,
                "-o", (Join-Path $screenshotDirectory "$Family-05-persistence.png")
            ) -LogName "$Family-screenshot-persistence.log" | Out-Null
        }
        finally {
            if ($null -ne (Get-Process -Id $reopened.Id -ErrorAction SilentlyContinue)) {
                Stop-Process -Id $reopened.Id -Force -ErrorAction SilentlyContinue
            }
        }

        $dataPath = Join-Path $env:APPDATA "com.englishfocus.desktop"
        if (-not (Test-Path $dataPath)) {
            throw "Expected Tauri application data directory was not created: $dataPath"
        }

        $databaseFiles = Get-ChildItem -Path $dataPath -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.Extension -in @(".db", ".sqlite", ".sqlite3") -and $_.Length -gt 0 }
        if (@($databaseFiles).Count -eq 0) {
            throw "No non-empty SQLite database file was found under $dataPath."
        }

        return "Installed binary launched through the native runtime; navigation, exact search, accessibility tree, no-console-window check, restart persistence, and SQLite creation passed."
    }
    finally {
        if ($null -ne (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-InstallerFamily {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("NSIS", "MSI")]
        [string]$Family,
        [Parameter(Mandatory = $true)]
        [string]$InstallerPath
    )

    $script:CurrentFamily = $Family
    Stop-EnglishFocusProcesses

    if ((Get-UninstallEntries).Count -gt 0) {
        Invoke-TestCheck -Name "Remove pre-existing English Focus installation" -Action {
            Uninstall-EnglishFocus
            "Previous installation removed before the isolated $Family test."
        } -Fatal | Out-Null
    }

    $installed = Invoke-TestCheck -Name "$Family clean installation" -Action {
        Install-EnglishFocus -Family $Family -InstallerPath $InstallerPath
        "$Family installer completed successfully."
    }

    if (-not $installed) {
        Add-TestResult -Name "$Family installed application checks" -Status "SKIP" -Details "Installation failed."
        return
    }

    try {
        $entries = Get-UninstallEntries
        Invoke-TestCheck -Name "$Family uninstall registration and version" -Action {
            if ($entries.Count -eq 0) {
                throw "No uninstall registration was found."
            }
            $entry = $entries | Select-Object -First 1
            if ([string]$entry.DisplayVersion -ne "1.0.0") {
                throw "Expected DisplayVersion 1.0.0, got '$($entry.DisplayVersion)'."
            }
            "DisplayName and DisplayVersion are registered correctly."
        } | Out-Null

        $applicationPath = $null
        Invoke-TestCheck -Name "$Family installed executable" -Action {
            $script:ResolvedApplicationPath = Get-ExecutableFromEntry -Entry ($entries | Select-Object -First 1)
            "Executable: $script:ResolvedApplicationPath"
        } -Fatal | Out-Null
        $applicationPath = [string]$script:ResolvedApplicationPath

        Invoke-TestCheck -Name "$Family Start menu shortcut" -Action {
            $shortcuts = Get-StartMenuShortcuts
            if ($shortcuts.Count -eq 0) {
                throw "No English Focus Start menu shortcut was found."
            }
            ($shortcuts | ForEach-Object { $_.FullName }) -join "; "
        } | Out-Null

        Invoke-TestCheck -Name "$Family native application acceptance" -Action {
            Test-ApplicationUi -ApplicationPath $applicationPath -Family $Family
        } | Out-Null
    }
    finally {
        Stop-EnglishFocusProcesses
        Invoke-TestCheck -Name "$Family uninstall lifecycle" -Action {
            Uninstall-EnglishFocus
            if (-not [string]::IsNullOrWhiteSpace([string]$applicationPath) -and (Test-Path $applicationPath)) {
                throw "Installed executable still exists after uninstall: $applicationPath"
            }
            if ((Get-StartMenuShortcuts).Count -gt 0) {
                throw "English Focus Start menu shortcut still exists after uninstall."
            }
            "$Family uninstall removed registry registration, executable, and Start menu shortcut."
        } | Out-Null
    }
}

function Write-TestReports {
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
    $lines.Add("## Deliberately manual release checks")
    $lines.Add("")
    $lines.Add("The automated run cannot honestly judge visual polish, listen to Narrator speech quality, establish SmartScreen reputation, or verify a production Authenticode certificate that was not supplied. Those checks remain explicit release evidence rather than being reported as automated passes.")
    $lines | Out-File -FilePath $markdownPath -Encoding utf8

    return [pscustomobject]@{
        Json = $jsonPath
        Markdown = $markdownPath
        Passed = $passed
        Failed = $failed
        Skipped = $skipped
    }
}

$nsisInstaller = Get-ChildItem -Path $ArtifactsDirectory -Filter "*-setup.exe" -File -ErrorAction SilentlyContinue |
    Select-Object -First 1
$msiInstaller = Get-ChildItem -Path $ArtifactsDirectory -Filter "*.msi" -File -ErrorAction SilentlyContinue |
    Select-Object -First 1
$manifestPath = Join-Path $ArtifactsDirectory "release-manifest.json"
$checksumsPath = Join-Path $ArtifactsDirectory "SHA256SUMS.txt"

try {
    $script:CurrentFamily = "Artifacts"
    Invoke-TestCheck -Name "Release artifact set" -Action {
        if ($null -eq $nsisInstaller) {
            throw "NSIS installer is missing from $ArtifactsDirectory."
        }
        if ($null -eq $msiInstaller) {
            throw "MSI installer is missing from $ArtifactsDirectory."
        }
        if (-not (Test-Path $manifestPath)) {
            throw "release-manifest.json is missing."
        }
        if (-not (Test-Path $checksumsPath)) {
            throw "SHA256SUMS.txt is missing."
        }
        "MSI, NSIS, manifest, and checksum files are present."
    } -Fatal | Out-Null

    Invoke-TestCheck -Name "Release manifest source and version" -Action {
        $manifestText = Get-Content -Path $manifestPath -Raw
        $commit = (git rev-parse HEAD).Trim()
        if ($manifestText -notmatch [regex]::Escape($commit)) {
            throw "release-manifest.json does not contain source commit $commit."
        }
        if ($manifestText -notmatch '"version"\s*:\s*"1\.0\.0"') {
            throw "release-manifest.json does not report version 1.0.0."
        }
        "Manifest matches version 1.0.0 and source commit $commit."
    } | Out-Null

    Invoke-TestCheck -Name "Installer SHA-256 integrity" -Action {
        $checksumText = Get-Content -Path $checksumsPath -Raw
        foreach ($installer in @($nsisInstaller, $msiInstaller)) {
            $hash = (Get-FileHash -Path $installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($checksumText.ToLowerInvariant() -notmatch [regex]::Escape($hash)) {
                throw "SHA256SUMS.txt does not contain the computed hash for $($installer.Name)."
            }
        }
        "Both installer hashes match SHA256SUMS.txt."
    } | Out-Null

    $script:CurrentFamily = "Prerequisites"
    Invoke-TestCheck -Name "Preserve existing user data" -Action {
        Preserve-UserData
        if ($script:PreservedData.Count -eq 0) {
            return "No existing English Focus user data was present."
        }
        return "$($script:PreservedData.Count) existing data directories were preserved for restoration."
    } -Fatal | Out-Null

    Invoke-TestCheck -Name "Microsoft WinApp CLI" -Action {
        $script:WinAppExecutable = Resolve-WinAppExecutable
        $version = Invoke-NativeCommand -FilePath $script:WinAppExecutable -Arguments @("--version") -LogName "winapp-version.log"
        "winapp: $version"
    } -Fatal | Out-Null

    if ($InstallerFamily -in @("Both", "NSIS")) {
        Test-InstallerFamily -Family "NSIS" -InstallerPath $nsisInstaller.FullName
    }
    if ($InstallerFamily -in @("Both", "MSI")) {
        Test-InstallerFamily -Family "MSI" -InstallerPath $msiInstaller.FullName
    }
}
finally {
    Stop-EnglishFocusProcesses
    if ((Get-UninstallEntries).Count -gt 0) {
        try {
            Uninstall-EnglishFocus
        }
        catch {
            Add-TestResult -Name "Final cleanup uninstall" -Status "FAIL" -Details $_.Exception.Message
        }
    }

    try {
        Restore-UserData
        $script:CurrentFamily = "Cleanup"
        Add-TestResult -Name "Restore preserved user data" -Status "PASS" -Details "Test data was removed and any pre-existing user data was restored."
    }
    catch {
        $script:CurrentFamily = "Cleanup"
        Add-TestResult -Name "Restore preserved user data" -Status "FAIL" -Details $_.Exception.Message
    }

    if (-not $LeaveUninstalled -and $null -ne $msiInstaller) {
        try {
            Install-EnglishFocus -Family "MSI" -InstallerPath $msiInstaller.FullName
            $script:CurrentFamily = "Cleanup"
            Add-TestResult -Name "Leave verified MSI installed" -Status "PASS" -Details "English Focus 1.0.0 was reinstalled after the isolated acceptance run."
        }
        catch {
            $script:CurrentFamily = "Cleanup"
            Add-TestResult -Name "Leave verified MSI installed" -Status "FAIL" -Details $_.Exception.Message
        }
    }
}

$report = Write-TestReports
Write-Host ""
Write-Host "WINDOWS SYSTEM ACCEPTANCE COMPLETE" -ForegroundColor Cyan
Write-Host "Passed: $($report.Passed)" -ForegroundColor Green
Write-Host "Failed: $($report.Failed)" -ForegroundColor $(if ($report.Failed -gt 0) { "Red" } else { "Green" })
Write-Host "Skipped: $($report.Skipped)" -ForegroundColor Yellow
Write-Host "Report: $($report.Markdown)"
Write-Host "Evidence: $runDirectory"

if ($report.Failed -gt 0) {
    exit 1
}

Write-Host "WINDOWS SYSTEM ACCEPTANCE PASSED" -ForegroundColor Green
