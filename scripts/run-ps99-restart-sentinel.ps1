[CmdletBinding()]
param(
    [string]$ApiBase = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
    [string]$ProbeToken = $env:PS99_RESTART_PROBE_TOKEN,
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[A-Za-z0-9._:-]+$")]
    [string]$ProbeId,
    [ValidatePattern("^[A-Za-z0-9._:-]+$")]
    [string]$MachineId = $env:COMPUTERNAME,
    [string]$RobloxLogPath,
    [int]$RobloxProcessId = 0,
    [int]$HeartbeatSeconds = 30,
    [long]$UniverseId = 3317771874,
    [long]$PlaceId = 8737899170,
    [Nullable[int]]$PlaceVersion,
    [switch]$EnableVersionOcr,
    [string]$TesseractPath,
    [switch]$Once
)

$ErrorActionPreference = "Stop"
$ReporterVersion = "1.0.0"

if ([string]::IsNullOrWhiteSpace($ProbeToken)) {
    throw "Set PS99_RESTART_PROBE_TOKEN or pass -ProbeToken."
}

if ([string]::IsNullOrWhiteSpace($MachineId)) {
    throw "MachineId cannot be empty."
}

$HeartbeatSeconds = [Math]::Max(15, $HeartbeatSeconds)
$ApiBase = $ApiBase.TrimEnd("/")
$ProbeEndpoint = "$ApiBase/api/ps99/restart-probes"
$RobloxLogsDirectory = Join-Path $env:LOCALAPPDATA "Roblox\logs"

function Get-LatestRobloxLog {
    if ($script:RobloxLogPath) {
        if (-not (Test-Path -LiteralPath $script:RobloxLogPath)) {
            throw "Roblox log not found: $script:RobloxLogPath"
        }
        return (Resolve-Path -LiteralPath $script:RobloxLogPath).Path
    }

    $latest = Get-ChildItem -LiteralPath $script:RobloxLogsDirectory -Filter "*Player*.log" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw "No Roblox Player log was found in $script:RobloxLogsDirectory."
    }

    return $latest.FullName
}

function Get-FileSha256 {
    param([Parameter(Mandatory = $true)][string]$Value)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

function Get-RobloxSessionFromLog {
    param([Parameter(Mandatory = $true)][string]$Path)

    # A tail is enough: Roblox logs a new GameId/serverId pair on each join or
    # teleport. Scanning oldest-to-newest lets the last completed pair win.
    $lines = @(Get-Content -LiteralPath $Path -Tail 16000 -ErrorAction Stop)
    $pendingGameId = $null
    $pendingGameIdLine = -100000
    $current = $null
    $lastPlaceId = $null
    $lastUserId = $null

    for ($index = 0; $index -lt $lines.Count; $index++) {
        $line = [string]$lines[$index]

        $gameIdMatch = [regex]::Match(
            $line,
            '(?i)(?:%22|")GameId(?:%22|")\s*(?:%3[aA]|:)\s*(?:%22|")(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
        )
        if ($gameIdMatch.Success) {
            $pendingGameId = $gameIdMatch.Groups["id"].Value.ToLowerInvariant()
            $pendingGameIdLine = $index
        }

        $placeMatch = [regex]::Match($line, '(?i)(?:placeId|PlaceId)(?:%22|")?\s*(?:%3[aA]|:|=)\s*(?:%22|")?(?<id>\d+)')
        if ($placeMatch.Success) {
            $lastPlaceId = [long]$placeMatch.Groups["id"].Value
        }

        $userMatch = [regex]::Match($line, '(?i)(?:userId|UserId)(?:%22|")?\s*(?:%3[aA]|:|=)\s*(?:%22|")?(?<id>\d+)')
        if ($userMatch.Success) {
            $lastUserId = [long]$userMatch.Groups["id"].Value
        }

        $serverMatch = [regex]::Match($line, '(?i)serverId:\s*(?<server>[0-9a-f:.]+)\|(?<port>\d+)')
        if ($serverMatch.Success) {
            $networkKey = "network:{0}|{1}" -f $serverMatch.Groups["server"].Value.ToLowerInvariant(), $serverMatch.Groups["port"].Value
            $hasNearbyGameId = $pendingGameId -and (($index - $pendingGameIdLine) -le 1200)
            $current = [pscustomobject]@{
                JobId = if ($hasNearbyGameId) { $pendingGameId } else { $networkKey }
                JobIdSource = if ($hasNearbyGameId) { "roblox_game_id" } else { "network_session" }
                PlaceId = $lastPlaceId
                UserId = $lastUserId
            }
            $pendingGameId = $null
            $pendingGameIdLine = -100000
        }
    }

    # Some teleport log segments contain GameId but omit a later serverId line.
    if (-not $current -and $pendingGameId) {
        $current = [pscustomobject]@{
            JobId = $pendingGameId
            JobIdSource = "roblox_game_id"
            PlaceId = $lastPlaceId
            UserId = $lastUserId
        }
    }

    return $current
}

function Find-Tesseract {
    if ($script:TesseractPath) {
        if (Test-Path -LiteralPath $script:TesseractPath) {
            return (Resolve-Path -LiteralPath $script:TesseractPath).Path
        }
        throw "Tesseract was not found at $script:TesseractPath."
    }

    $command = Get-Command tesseract.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $common = "C:\Program Files\Tesseract-OCR\tesseract.exe"
    if (Test-Path -LiteralPath $common) { return $common }
    return $null
}

function Get-PlaceVersionFromScreen {
    if (-not $script:EnableVersionOcr) { return $null }

    $tesseract = Find-Tesseract
    if (-not $tesseract) {
        Write-Warning "Tesseract is not installed; place-version OCR is disabled for this observation."
        return $null
    }

    if (-not ("RestartSentinel.NativeMethods" -as [type])) {
        Add-Type -AssemblyName System.Drawing
        Add-Type @"
using System;
using System.Runtime.InteropServices;
namespace RestartSentinel {
  public static class NativeMethods {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X, Y; }
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);
  }
}
"@
    }

    $process = if ($script:RobloxProcessId -gt 0) {
        Get-Process -Id $script:RobloxProcessId -ErrorAction SilentlyContinue
    }
    else {
        Get-Process -Name "RobloxPlayerBeta" -ErrorAction SilentlyContinue |
            Where-Object { $_.MainWindowHandle -ne 0 } |
            Select-Object -First 1
    }
    if (-not $process -or $process.MainWindowHandle -eq 0) { return $null }

    $rect = New-Object RestartSentinel.NativeMethods+RECT
    if (-not [RestartSentinel.NativeMethods]::GetClientRect($process.MainWindowHandle, [ref]$rect)) {
        return $null
    }
    $origin = New-Object RestartSentinel.NativeMethods+POINT
    if (-not [RestartSentinel.NativeMethods]::ClientToScreen($process.MainWindowHandle, [ref]$origin)) {
        return $null
    }

    $width = [Math]::Max(1, $rect.Right - $rect.Left)
    $height = [Math]::Max(1, $rect.Bottom - $rect.Top)
    $cropHeight = [Math]::Min(80, $height)
    $bitmap = New-Object System.Drawing.Bitmap($width, $cropHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $imagePath = Join-Path $env:TEMP ("ps99-version-{0}.png" -f [guid]::NewGuid())
    $outputBase = [System.IO.Path]::ChangeExtension($imagePath, $null)

    try {
        $graphics.CopyFromScreen(
            $origin.X,
            $origin.Y + $height - $cropHeight,
            0,
            0,
            $bitmap.Size
        )
        $bitmap.Save($imagePath, [System.Drawing.Imaging.ImageFormat]::Png)
        & $tesseract $imagePath $outputBase --psm 7 2>$null | Out-Null
        $textPath = "$outputBase.txt"
        if (-not (Test-Path -LiteralPath $textPath)) { return $null }
        $ocrText = Get-Content -LiteralPath $textPath -Raw
        $match = [regex]::Match($ocrText, '(?i)Place\s*Version\s*[:#]?\s*(?<version>\d{2,})')
        if ($match.Success) { return [int]$match.Groups["version"].Value }
        return $null
    }
    finally {
        $graphics.Dispose()
        $bitmap.Dispose()
        Remove-Item -LiteralPath $imagePath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath "$outputBase.txt" -Force -ErrorAction SilentlyContinue
    }
}

function Test-RobloxProcessRunning {
    if ($script:RobloxProcessId -le 0) { return $true }
    return $null -ne (Get-Process -Id $script:RobloxProcessId -ErrorAction SilentlyContinue)
}

function Send-SentinelObservation {
    $logPath = Get-LatestRobloxLog
    $session = Get-RobloxSessionFromLog -Path $logPath
    $processRunning = Test-RobloxProcessRunning
    $state = if (-not $processRunning) {
        "disconnected"
    }
    elseif ($session -and $session.JobId) {
        "connected"
    }
    else {
        "unknown"
    }

    $observedVersion = if ($null -ne $script:PlaceVersion) {
        [int]$script:PlaceVersion
    }
    else {
        Get-PlaceVersionFromScreen
    }
    $effectivePlaceId = if ($session -and $session.PlaceId) {
        [long]$session.PlaceId
    }
    else {
        $script:PlaceId
    }

    $payload = [ordered]@{
        probe_id = $script:ProbeId
        machine_id = $script:MachineId
        roblox_user_id = if ($session) { $session.UserId } else { $null }
        universe_id = $script:UniverseId
        place_id = $effectivePlaceId
        job_id = if ($session) { $session.JobId } else { $null }
        job_id_source = if ($session) { $session.JobIdSource } else { "unavailable" }
        place_version = $observedVersion
        state = $state
        observed_at = [DateTime]::UtcNow.ToString("o")
        reporter_version = $script:ReporterVersion
        process_id = if ($script:RobloxProcessId -gt 0) { $script:RobloxProcessId } else { $null }
        log_path_hash = Get-FileSha256 -Value $logPath
    }

    $headers = @{
        Authorization = "Bearer $script:ProbeToken"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod `
        -Method Post `
        -Uri $script:ProbeEndpoint `
        -Headers $headers `
        -Body ($payload | ConvertTo-Json -Depth 6 -Compress)

    $jobLabel = if ($session -and $session.JobId) {
        $session.JobId.Substring(0, [Math]::Min(18, $session.JobId.Length))
    }
    else {
        "-"
    }
    $decision = if ($response.evaluation) { $response.evaluation.decision } else { "accepted" }
    Write-Host ("[{0}] {1}: {2} | {3} | {4}" -f (Get-Date -Format "HH:mm:ss"), $script:ProbeId, $state, $jobLabel, $decision)

    if ($response.restart_detected) {
        Write-Host "CONFIRMED RESTART: $($response.event_id)" -ForegroundColor Green
    }
}

Write-Host "PS99 restart sentinel '$ProbeId' is reporting every $HeartbeatSeconds seconds."
Write-Host "Endpoint: $ProbeEndpoint"
Write-Host "Press Ctrl+C to stop."

do {
    try {
        Send-SentinelObservation
    }
    catch {
        Write-Warning ("Sentinel report failed: {0}" -f $_.Exception.Message)
    }

    if (-not $Once) {
        Start-Sleep -Seconds $HeartbeatSeconds
    }
} while (-not $Once)
