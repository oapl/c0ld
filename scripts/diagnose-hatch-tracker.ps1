param(
  [string]$WorkerUrl = "https://inventory-detector-worker.opal-dde.workers.dev",
  [string]$UserId = "",
  [string]$Username = "Cinnamowopal",
  [string]$Item = "Huge Turnip Hamster",
  [int]$Limit = 12,
  [string]$Token = "",
  [switch]$Summary,
  [switch]$FullJson,
  [switch]$ForceAlertCheck
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

if (-not $Token) {
  throw "INGEST_ADMIN_TOKEN is required."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{ Authorization = "Bearer $Token"; Accept = "application/json" }
$cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

function Get-ShortDiagnosticError {
  param([object]$Value)
  $text = ([string]$Value -replace "\s+", " ").Trim()
  if ($text.Length -le 58) { return $text }
  return $text.Substring(0, 55) + "..."
}

Write-Host "Checking inventory Worker health..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Method Get -Uri "$base/api/inventory/health?v=$cacheBust" -Headers @{ Accept = "application/json" }
$health | ConvertTo-Json -Depth 8

if ($Summary) {
  Write-Host ""
  Write-Host "Reading the HTG account/pull summary (this does not consume a BIG Games refresh)..." -ForegroundColor Cyan
  $summaryUrl = "$base/api/hatch/diagnostics/summary?history_limit=24&v=$cacheBust"
  $summaryResponse = Invoke-RestMethod -Method Get -Uri $summaryUrl -Headers $headers
  Write-Host ("Build: {0} | Accounts: {1} | Failed: {2} | Overdue: {3}" -f `
    $summaryResponse.build_id,
    $summaryResponse.health.enabled_tracker_count,
    $summaryResponse.health.failed_tracker_count,
    $summaryResponse.health.overdue_tracker_count)
  Write-Host ("Observed in ledger (24h): inventory attempts {0}, provider refresh units {1}, source checks {2}, rate-limited {3}, alerts {4}" -f `
    $summaryResponse.health.observed_inventory_attempts_24h,
    $summaryResponse.health.observed_provider_refresh_units_24h,
    $summaryResponse.health.observed_source_verification_requests_24h,
    $summaryResponse.health.observed_rate_limited_attempts_24h,
    $summaryResponse.health.observed_alert_posts_24h)
  Write-Host ""

  $accountRows = $summaryResponse.accounts | ForEach-Object {
    [PSCustomObject]@{
      Account = $_.roblox_username
      LastCheck = $_.last_checked_at
      Outcome = $_.last_outcome.outcome
      Pulls24h = $_.observed_usage_last_24h.provider_refresh_units
      Attempts24h = $_.observed_usage_last_24h.inventory_attempts
      Auth = if ($_.authorization.connected) { "ready" } elseif ($_.authorization.reauthorization_required) { "re-auth" } else { "not ready" }
      Delivery = "{0}/{1}" -f $_.delivery.assigned_server_count, $_.delivery.active_server_count
      Failures = $_.consecutive_scan_failures
      Due = $_.scheduler.due
      Pending = $_.pending_gain.active
      Error = Get-ShortDiagnosticError $_.last_scan_error
    }
  }
  $accountRows | Format-Table Account, Auth, Delivery, LastCheck, Outcome, Pulls24h, Attempts24h, Failures, Due, Pending, Error -AutoSize

  $failedAccounts = @($summaryResponse.accounts | Where-Object { $_.last_scan_error })
  if ($failedAccounts.Count) {
    Write-Host ""
    Write-Host "Current account errors:" -ForegroundColor Yellow
    foreach ($account in $failedAccounts) {
      Write-Host ("- {0}: {1}" -f $account.roblox_username, (([string]$account.last_scan_error -replace "\s+", " ").Trim()))
    }
  }

  $notReadyAccounts = @($summaryResponse.accounts | Where-Object { -not $_.authorization.connected -or $_.delivery.assigned_server_count -lt $_.delivery.active_server_count })
  if ($notReadyAccounts.Count) {
    Write-Host ""
    Write-Host "Accounts that cannot currently deliver alerts:" -ForegroundColor Yellow
    foreach ($account in $notReadyAccounts) {
      $issues = [System.Collections.Generic.List[string]]::new()
      if (-not $account.authorization.connected) {
        $issues.Add($(if ($account.authorization.reauthorization_required) { "Big Games re-authorization required" } else { "Big Games authorization unavailable" }))
      }
      if ($account.delivery.assigned_server_count -lt $account.delivery.active_server_count) {
        $issues.Add(("channel assigned for {0}/{1} opted-in server(s)" -f $account.delivery.assigned_server_count, $account.delivery.active_server_count))
      }
      Write-Host ("- {0}: {1}" -f $account.roblox_username, ($issues -join "; "))
    }
  }

  if ($FullJson) {
    Write-Host ""
    $summaryResponse | ConvertTo-Json -Depth 16
  }
  return
}

Write-Host ""
Write-Host "Running HTG diagnostics for $Username$(if ($UserId) { " ($UserId)" }): $Item" -ForegroundColor Cyan
$diagnosticQuery = [System.Collections.Generic.List[string]]::new()
if ($UserId) { $diagnosticQuery.Add("user_id=$([Uri]::EscapeDataString($UserId))") }
if ($Username) { $diagnosticQuery.Add("username=$([Uri]::EscapeDataString($Username))") }
$diagnosticQuery.Add("item=$([Uri]::EscapeDataString($Item))")
$diagnosticQuery.Add("limit=$Limit")
$diagnosticQuery.Add("v=$cacheBust")
$diagnosticsUrl = "$base/api/hatch/diagnostics?$($diagnosticQuery -join '&')"
$diagnostics = Invoke-RestMethod -Method Get -Uri $diagnosticsUrl -Headers $headers
$diagnostics | ConvertTo-Json -Depth 16

if ($ForceAlertCheck) {
  Write-Host ""
  Write-Host "Forcing latest-snapshot HTG alert check..." -ForegroundColor Yellow
  $checkQuery = [System.Collections.Generic.List[string]]::new()
  if ($UserId) { $checkQuery.Add("user_id=$([Uri]::EscapeDataString($UserId))") }
  if ($Username) { $checkQuery.Add("username=$([Uri]::EscapeDataString($Username))") }
  $checkQuery.Add("force=true")
  $checkQuery.Add("v=$cacheBust")
  $checkUrl = "$base/api/hatch/alerts/check?$($checkQuery -join '&')"
  $check = Invoke-RestMethod -Method Post -Uri $checkUrl -Headers $headers
  $check | ConvertTo-Json -Depth 16
}
