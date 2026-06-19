$ErrorActionPreference = "Stop"

$SourceMsi = "\\lfmctr.local\SYSVOL\lfmctr.local\scripts\endpoint.msi"
$WorkDir   = "$env:ProgramData\LFMCTR\EndpointUpdate"
$LocalMsi  = "$WorkDir\endpoint.msi"
$LogFile   = "$WorkDir\EndpointUpdate.log"
$MsiLog    = "$WorkDir\EndpointInstall.log"
$RegPath   = "HKLM:\SOFTWARE\UniFi Identity Standard"

New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null

function Write-Log {
    param([string]$Message)
    "$(Get-Date -Format s) $Message" | Out-File -FilePath $LogFile -Append -Encoding utf8
}

function Get-MsiVersion {
    param([string]$Path)

    $Installer = New-Object -ComObject WindowsInstaller.Installer
    $Database = $Installer.OpenDatabase($Path, 0)
    $View = $Database.OpenView("SELECT Value FROM Property WHERE Property = 'ProductVersion'")
    $View.Execute()
    $Record = $View.Fetch()

    if ($Record) {
        return [version]$Record.StringData(1)
    }

    return $null
}

function Get-InstalledUniFiVersion {
    $UninstallPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $App = Get-ItemProperty $UninstallPaths -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -match "UniFi Endpoint|UniFi Identity|Identity Endpoint|Identity Standard" } |
        Select-Object -First 1

    if ($App.DisplayVersion) {
        try {
            return [version]$App.DisplayVersion
        } catch {
            Write-Log "Installed version could not be parsed: $($App.DisplayVersion)"
        }
    }

    return $null
}

Write-Log "Starting UniFi Endpoint update check."

if (-not (Test-Path $SourceMsi)) {
    Write-Log "Source MSI not found: $SourceMsi"
    exit 0
}

Copy-Item -Path $SourceMsi -Destination $LocalMsi -Force
Write-Log "Copied MSI from SYSVOL to $LocalMsi."

$SourceVersion = Get-MsiVersion -Path $LocalMsi
$InstalledVersion = Get-InstalledUniFiVersion

Write-Log "Source MSI version: $SourceVersion"
Write-Log "Installed version: $InstalledVersion"

if ($InstalledVersion -and $SourceVersion -and $InstalledVersion -ge $SourceVersion) {
    Write-Log "Installed version is current. No update needed."
} else {
    $Arguments = @(
        "/i `"$LocalMsi`"",
        "/qn",
        "/norestart",
        "CHECK_UPDATE=0",
        "ENFORCE_CONFIG_CHECK_UPDATE=1",
        "/L*v `"$MsiLog`""
    ) -join " "

    Write-Log "Running msiexec."
    $Process = Start-Process -FilePath "msiexec.exe" -ArgumentList $Arguments -Wait -PassThru
    Write-Log "msiexec exit code: $($Process.ExitCode)"

    if ($Process.ExitCode -notin @(0, 3010)) {
        exit $Process.ExitCode
    }
}

New-Item -Path $RegPath -Force | Out-Null
New-ItemProperty -Path $RegPath -Name "CheckUpdate" -Value "0" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $RegPath -Name "EnforceConfigCheckUpdate" -Value "1" -PropertyType String -Force | Out-Null

Write-Log "Finished UniFi Endpoint update check."
exit 0
