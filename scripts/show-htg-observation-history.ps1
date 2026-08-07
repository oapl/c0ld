param(
  [string]$WorkerUrl = "https://inventory-detector-worker.opal-dde.workers.dev",
  [string]$Username = "",
  [string]$UserId = "",
  [ValidateRange(2, 192)]
  [int]$Limit = 96,
  [string]$Token = "",
  [switch]$FullJson
)

$ErrorActionPreference = "Stop"

if (-not $Username -and -not $UserId) {
  $target = Read-Host "Roblox username or user ID"
  if ($target -match '^\d+$') { $UserId = $target } else { $Username = $target }
}
if (-not $Username -and -not $UserId) { throw "Provide -Username or -UserId." }

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}
if (-not $Token) { throw "INGEST_ADMIN_TOKEN is required." }

$query = [System.Collections.Generic.List[string]]::new()
if ($Username) { $query.Add("username=$([Uri]::EscapeDataString($Username))") }
if ($UserId) { $query.Add("user_id=$([Uri]::EscapeDataString($UserId))") }
$query.Add("limit=$Limit")
$query.Add("v=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())")

$uri = "{0}/api/hatch/diagnostics/htg-history?{1}" -f $WorkerUrl.TrimEnd('/'), ($query -join '&')
$headers = @{ Authorization = "Bearer $Token"; Accept = "application/json" }

Write-Host "Reading saved HTG observation history. This does not trigger a BIG Games inventory pull..." -ForegroundColor Cyan
$result = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers

Write-Host ""
Write-Host ("{0} ({1})" -f $result.user.username, $result.user.user_id) -ForegroundColor Cyan
Write-Host ("Saved-window snapshots: {0} | {1} to {2}" -f `
  $result.history_window.snapshots_considered, $result.history_window.earliest_snapshot_at, $result.history_window.latest_snapshot_at)

if ($result.tracker) {
  Write-Host ("Tracker: enabled={0} | last checked={1} | last alert={2}" -f `
    $result.tracker.enabled, $result.tracker.last_checked_at, $result.tracker.last_alert_at)
  if ($result.tracker.pending_gain.active) {
    Write-Host "A gain is currently pending confirmation:" -ForegroundColor Yellow
    $result.tracker.pending_gain | ConvertTo-Json -Depth 8
  }
}

Write-Host ""
if (-not @($result.htg_items).Count) {
  Write-Host "No Huge, Titanic, or Gargantuan items were found in the saved snapshot window." -ForegroundColor Yellow
} else {
  Write-Host "HTGs currently/previously observed:" -ForegroundColor Green
  $result.htg_items | Select-Object tier, display_name, variant, current_count, max_count, first_seen_at, first_seen_status, last_seen_at |
    Format-Table -AutoSize
}

Write-Host ""
if (-not @($result.observed_gains).Count) {
  Write-Host "No count increases were observed between the saved snapshots." -ForegroundColor Yellow
} else {
  Write-Host "Observed HTG count increases:" -ForegroundColor Green
  $result.observed_gains | Select-Object observed_at, tier, display_name, variant, previous_count, current_count, delta, first_seen_in_saved_history |
    Format-Table -AutoSize
}

if (@($result.observation_gaps).Count) {
  Write-Host ""
  Write-Host "HTGs that later disappeared from a saved snapshot:" -ForegroundColor Yellow
  $result.observation_gaps | Select-Object observed_at, tier, display_name, variant, previous_count, current_count |
    Format-Table -AutoSize
}

Write-Host ""
Write-Host "Important: 'first observed' is the first saved snapshot in this history window, not proof of the exact acquisition time." -ForegroundColor DarkYellow

if ($FullJson) {
  Write-Host ""
  $result | ConvertTo-Json -Depth 20
}
