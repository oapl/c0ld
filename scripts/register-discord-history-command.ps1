# Edit these values, then run this script from PowerShell.
$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/"
$GuildId = "YOUR_GUILD_ID"
$AdminToken = "PASTE_REGISTER_ADMIN_TOKEN_HERE"

# Guild commands appear almost immediately while testing. Set this to $true
# later if you want to register /history globally instead.
$RegisterGlobal = $false
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($WorkerUrl)) {
  throw "Set `$WorkerUrl to the Discord interactions Worker URL."
}

if ([string]::IsNullOrWhiteSpace($AdminToken) -or $AdminToken -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE") {
  throw "Paste the Worker's REGISTER_ADMIN_TOKEN into `$AdminToken."
}

if (-not $RegisterGlobal -and ([string]::IsNullOrWhiteSpace($GuildId) -or $GuildId -eq "YOUR_GUILD_ID")) {
  throw "Set `$GuildId, or set `$RegisterGlobal to `$true."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($AdminToken.Trim())"
}
$query = if ($RegisterGlobal) { "" } else { "?guild_id=$([uri]::EscapeDataString($GuildId.Trim()))" }

Write-Host "Registering /history..." -ForegroundColor Green
Invoke-RestMethod `
  -Method Post `
  -Uri "$base/admin/register-history-command$query" `
  -Headers $headers |
  ConvertTo-Json -Depth 10

$listQuery = if ($RegisterGlobal) {
  "?scope=global"
} else {
  "?scope=guild&guild_id=$([uri]::EscapeDataString($GuildId.Trim()))"
}

Write-Host "Registered commands:" -ForegroundColor Green
Invoke-RestMethod `
  -Uri "$base/admin/commands$listQuery" `
  -Headers $headers |
  ConvertTo-Json -Depth 10
