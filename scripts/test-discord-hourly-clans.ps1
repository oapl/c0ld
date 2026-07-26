# Paste the Luna Discord Worker's REGISTER_ADMIN_TOKEN below, then run this file.
# This forces all currently assigned /hourly boards to post immediately.
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

Invoke-RestMethod `
  -Method Post `
  -Uri "$base/admin/hourly/run?force=1" `
  -Headers $headers |
  ConvertTo-Json -Depth 12

