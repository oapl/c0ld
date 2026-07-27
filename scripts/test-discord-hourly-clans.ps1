# Paste the Luna Discord Worker's REGISTER_ADMIN_TOKEN below, then run this file.
# This forces all currently assigned /hourly boards to post immediately.
$WorkerUrl = "https://c0ld-discord-search.opal-dde.workers.dev/"
$AdminToken = "PASTE_REGISTER_ADMIN_TOKEN_HERE"

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AdminToken) -or $AdminToken -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE") {
  throw "Paste the Luna Discord Worker's REGISTER_ADMIN_TOKEN into `$AdminToken."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($AdminToken.Trim())"
  "X-C0LD-Admin-Token" = $AdminToken.Trim()
}

Write-Host "Hourly status before forced run..." -ForegroundColor Cyan
Invoke-RestMethod `
  -Method Get `
  -Uri "$base/admin/hourly/status" `
  -Headers $headers |
  ConvertTo-Json -Depth 12

Write-Host "Forcing all configured hourly boards..." -ForegroundColor Green
Invoke-RestMethod `
  -Method Post `
  -Uri "$base/admin/hourly/run?force=1" `
  -Headers $headers |
  ConvertTo-Json -Depth 12

Write-Host "Hourly status after forced run..." -ForegroundColor Cyan
Invoke-RestMethod `
  -Method Get `
  -Uri "$base/admin/hourly/status" `
  -Headers $headers |
  ConvertTo-Json -Depth 12
