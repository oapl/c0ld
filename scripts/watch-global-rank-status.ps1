param(
  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
  [string]$Clan = "c0ld",
  [int]$IntervalSeconds = 30,
  [int]$MaxMinutes = 0,
  [string]$OutputPath = "global-rank-status-log.csv",
  [switch]$Once
)

$ErrorActionPreference = "Stop"

function Get-PropValue($Object, $Name, $Fallback = $null) {
  if ($null -eq $Object) {
    return $Fallback
  }

  $prop = $Object.PSObject.Properties[$Name]
  if ($null -eq $prop) {
    return $Fallback
  }

  if ($null -eq $prop.Value) {
    return $Fallback
  }

  return $prop.Value
}

$baseUrl = $WorkerUrl.TrimEnd("/")
$start = Get-Date

if (-not (Test-Path -LiteralPath $OutputPath)) {
  "timestamp,run_key,status,resumable,processed_clans,total_clans,remaining_clans,percent_complete,active_clans_per_minute,wall_clans_per_minute,estimated_finish_at,candidate_player_count,total_global_players,updated_at" |
    Set-Content -LiteralPath $OutputPath
}

while ($true) {
  $cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $uri = "$baseUrl/api/global/status?clan=$([uri]::EscapeDataString($Clan))&ts=$cacheBust"
  $status = Invoke-RestMethod -Method Get -Uri $uri
  $run = Get-PropValue $status "run"
  $timing = Get-PropValue $status "timing"
  $shardSummary = Get-PropValue $status "shard_summary"
  $processedClans = Get-PropValue $timing "processed_clans" $null
  if ($null -eq $processedClans) {
    $processedClans = Get-PropValue $shardSummary "processedCount" (Get-PropValue $run "scanned_clan_count" 0)
  }
  $totalClans = Get-PropValue $timing "total_clans" $null
  if ($null -eq $totalClans) {
    $totalClans = Get-PropValue $run "scan_limit" 0
  }
  $remainingClans = Get-PropValue $timing "remaining_clans" $null
  if ($null -eq $remainingClans) {
    $remainingClans = [Math]::Max(0, ([int]$totalClans) - ([int]$processedClans))
  }
  $percentComplete = Get-PropValue $timing "percent_complete" $null
  if ($null -eq $percentComplete -and [int]$totalClans -gt 0) {
    $percentComplete = [Math]::Round((([double]$processedClans) / ([double]$totalClans)) * 100, 2)
  }

  $row = [pscustomobject]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    run_key = Get-PropValue $run "run_key" ""
    status = Get-PropValue $run "status" ""
    resumable = Get-PropValue $status "resumable" ""
    processed_clans = $processedClans
    total_clans = $totalClans
    remaining_clans = $remainingClans
    percent_complete = $percentComplete
    active_clans_per_minute = Get-PropValue $timing "active_clans_per_minute" 0
    wall_clans_per_minute = Get-PropValue $timing "wall_clans_per_minute" 0
    estimated_finish_at = Get-PropValue $timing "estimated_finish_at" ""
    candidate_player_count = Get-PropValue $run "candidate_player_count" 0
    total_global_players = Get-PropValue $run "total_global_players" 0
    updated_at = Get-PropValue $run "updated_at" ""
  }

  $row | Export-Csv -LiteralPath $OutputPath -Append -NoTypeInformation

  Write-Host ("{0}% | {1}/{2} clans | {3} active clans/min | ETA {4} | status {5}" -f `
    $row.percent_complete,
    $row.processed_clans,
    $row.total_clans,
    $row.active_clans_per_minute,
    $row.estimated_finish_at,
    $row.status)

  if ($row.status -eq "ok" -or ([int]$row.total_clans -gt 0 -and [int]$row.remaining_clans -le 0)) {
    break
  }

  if ($Once) {
    break
  }

  if ($MaxMinutes -gt 0 -and ((Get-Date) - $start).TotalMinutes -ge $MaxMinutes) {
    break
  }

  Start-Sleep -Seconds ([Math]::Max(5, $IntervalSeconds))
}
