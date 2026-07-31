# Paste the Luna Discord Worker's REGISTER_ADMIN_TOKEN below, or pass -AdminToken.
# Use this when an hourly board starts posting to the wrong channel/thread.
param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [string]$AdminToken = "PASTE_REGISTER_ADMIN_TOKEN_HERE",
  [string]$ChannelId = "1529540232083542226",
  [switch]$Remove,
  [switch]$ForceRun,
  [switch]$ShowAll
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AdminToken) -or $AdminToken -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE") {
  $secure = Read-Host "REGISTER_ADMIN_TOKEN" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $AdminToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if ([string]::IsNullOrWhiteSpace($AdminToken)) {
  throw "Admin token is empty."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($AdminToken.Trim())"
  "X-C0LD-Admin-Token" = $AdminToken.Trim()
}

function Invoke-HourlyAdmin {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("GET", "POST")]
    [string]$Method,
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  try {
    Invoke-RestMethod -Method $Method -Uri "$base$Path" -Headers $headers
  } catch {
    $body = $_.ErrorDetails.Message
    if ($body) {
      throw "$Method $Path failed: $body"
    }
    throw
  }
}

Write-Host "Reading saved hourly assignments..." -ForegroundColor Cyan
$status = Invoke-HourlyAdmin -Method GET -Path "/admin/hourly/status"
$assignments = @($status.assignments)

if ($ShowAll) {
  $assignments |
    Select-Object guild_id, channel_id, channel_type_name, clan_name, enabled, due, last_posted_at, last_error |
    Format-Table -AutoSize
}

$target = @($assignments | Where-Object { [string]$_.channel_id -eq $ChannelId })
if ($target.Count -eq 0) {
  Write-Warning "No saved hourly assignment currently uses channel/thread ID $ChannelId."
  Write-Host "Run with -ShowAll to see every saved destination." -ForegroundColor Yellow
} else {
  Write-Host "Matched saved assignment:" -ForegroundColor Green
  $target |
    Select-Object guild_id, channel_id, channel_type_name, clan_name, enabled, due, last_posted_at, last_message_id, last_error |
    ConvertTo-Json -Depth 8
}

if ($Remove) {
  Write-Host "Removing assignment for $ChannelId..." -ForegroundColor Yellow
  Invoke-HourlyAdmin -Method POST -Path "/admin/hourly/remove-assignment?channel_id=$([uri]::EscapeDataString($ChannelId))" |
    ConvertTo-Json -Depth 8

  Write-Host ""
  Write-Host "After removing it, run /hourly clan, /hourly user, or /hourly league inside the intended Discord thread and leave the optional channel blank." -ForegroundColor Cyan
}

if ($ForceRun) {
  Write-Host "Force-posting only assignment $ChannelId..." -ForegroundColor Green
  Invoke-HourlyAdmin -Method POST -Path "/admin/hourly/run-one?force=1&channel_id=$([uri]::EscapeDataString($ChannelId))" |
    ConvertTo-Json -Depth 8
}
