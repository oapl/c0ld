param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$GuildId = "",
  [string]$CleanupGuildId = "",
  [switch]$Global
)

$ErrorActionPreference = "Stop"

$base = $WorkerUrl.TrimEnd("/")
$Token = $Token.Trim()
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

$query = if ($Global -or [string]::IsNullOrWhiteSpace($GuildId)) {
  "?scope=global"
} else {
  "?scope=guild&guild_id=$([uri]::EscapeDataString($GuildId.Trim()))"
}

# A global command can be hidden by an older guild-scoped /offline command.
# This removes only that stale command from the chosen guild; it does not
# touch any saved offline watches, channels, or settings.
if (($Global -or [string]::IsNullOrWhiteSpace($GuildId)) -and -not [string]::IsNullOrWhiteSpace($CleanupGuildId)) {
  $query += "&cleanup_guild_id=$([uri]::EscapeDataString($CleanupGuildId.Trim()))"
}

Write-Host "Registering /offline..." -ForegroundColor Cyan
$result = Invoke-RestMethod -Method Post -Uri "$base/admin/register-offline-command$query" -Headers $headers
$result | ConvertTo-Json -Depth 12

if (-not $result.ok) {
  throw "Discord did not confirm the /offline registration."
}

Write-Host "Done. Discord may take a few minutes to refresh a global command." -ForegroundColor Green
