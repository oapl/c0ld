# Paste the Luna Discord Worker's REGISTER_ADMIN_TOKEN below, then run this file.
$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/"
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

Write-Host "Registering /hourly globally..." -ForegroundColor Green
Invoke-RestMethod `
  -Method Post `
  -Uri "$base/admin/register-hourly-command?scope=global" `
  -Headers $headers |
  ConvertTo-Json -Depth 10

Write-Host "Global commands now registered:" -ForegroundColor Green
Invoke-RestMethod `
  -Uri "$base/admin/commands?scope=global" `
  -Headers $headers |
  ConvertTo-Json -Depth 10

