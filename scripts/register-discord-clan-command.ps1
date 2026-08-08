param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$GuildId = "",
  [switch]$Global
)

$ErrorActionPreference = "Stop"
$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($Token.Trim())"
  "X-C0LD-Admin-Token" = $Token.Trim()
}

if ($GuildId.Trim()) {
  $query = "?scope=guild&guild_id=$([uri]::EscapeDataString($GuildId.Trim()))"
} else {
  # Global is the intended default. Pass -GuildId only for an immediate, server-specific test registration.
  $query = "?scope=global"
}

Write-Host "Registering /clan globally, including /clan log..." -ForegroundColor Green
$result = Invoke-RestMethod -Method Post -Uri "$base/admin/register-clan-command$query" -Headers $headers
$result | ConvertTo-Json -Depth 12

Write-Host "Discord may take up to an hour to refresh global commands. Use /clan log clan:<name>, or /clan log clan:<name> assign:<channel>." -ForegroundColor Green
