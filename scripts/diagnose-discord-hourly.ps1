param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [string]$AdminToken = "",
  [string]$ChannelId = "",
  [switch]$ForceRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AdminToken)) {
  throw "Pass -AdminToken with the Luna Discord Worker's REGISTER_ADMIN_TOKEN."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($AdminToken.Trim())"
  "X-C0LD-Admin-Token" = $AdminToken.Trim()
}

Write-Host "Hourly status..." -ForegroundColor Cyan
$status = Invoke-RestMethod `
  -Method Get `
  -Uri "$base/admin/hourly/status" `
  -Headers $headers

if ([string]::IsNullOrWhiteSpace($ChannelId)) {
  $status | ConvertTo-Json -Depth 16
  return
}

$assignment = @($status.assignments | Where-Object { [string]$_.channel_id -eq $ChannelId })
if ($assignment.Count -eq 0) {
  Write-Warning "No hourly assignment found for channel/thread $ChannelId."
  Write-Host "Configured assignments:" -ForegroundColor Yellow
  $status.assignments |
    Select-Object guild_id, channel_id, channel_type_name, target_type, target_name, due, last_posted_at, last_error |
    Format-Table -AutoSize
  return
}

Write-Host "Matched assignment:" -ForegroundColor Green
$assignment |
  Select-Object guild_id, channel_id, channel_type_name, target_type, target_name, due, last_posted_at, next_due_at, last_message_id, last_error |
  ConvertTo-Json -Depth 12

if ($ForceRun) {
  Write-Host "Forcing this hourly assignment now..." -ForegroundColor Green
  Invoke-RestMethod `
    -Method Post `
    -Uri "$base/admin/hourly/run-one?force=1&channel_id=$([uri]::EscapeDataString($ChannelId))" `
    -Headers $headers |
    ConvertTo-Json -Depth 16
}
