param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [Parameter(Mandatory = $true)]
  [string]$Token
)

$ErrorActionPreference = "Stop"
$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $($Token.Trim())"
  "X-C0LD-Admin-Token" = $Token.Trim()
}

Write-Host "Registering /clan globally, including /clan log and /clan tracker, for every server Luna is installed in..." -ForegroundColor Green
$result = Invoke-RestMethod -Method Post -Uri "$base/admin/register-clan-command?scope=global" -Headers $headers
$result | ConvertTo-Json -Depth 12

Write-Host "Discord can take up to an hour to refresh global command menus. Use /clan tracker assign clan:<name> channel:<channel> for a persistent board, /clan tracker remove clan:<name> to remove that board from this server, and /clan log remove clan:<name> to stop future activity posts in this server." -ForegroundColor Green
