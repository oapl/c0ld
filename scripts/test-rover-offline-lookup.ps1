param(
  [Parameter(Mandatory = $true)]
  [string]$GuildId,

  [Parameter(Mandatory = $true, ParameterSetName = "Username")]
  [string]$Username,

  [Parameter(Mandatory = $true, ParameterSetName = "RobloxUserId")]
  [string]$RobloxUserId,

  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev"
)

$ErrorActionPreference = "Stop"

$SecureAdminToken = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
$AdminToken = [System.Net.NetworkCredential]::new("", $SecureAdminToken).Password
if ([string]::IsNullOrWhiteSpace($AdminToken)) {
  throw "An admin token is required."
}

$payload = @{ guild_id = $GuildId }
if ($PSCmdlet.ParameterSetName -eq "Username") {
  $payload.username = $Username
} else {
  $payload.roblox_user_id = $RobloxUserId
}

Write-Host "Checking the exact RoVer mapping used for offline mentions. This does not post an alert or request BIG Games data..."
$result = Invoke-RestMethod `
  -Method Post `
  -Uri ("{0}/api/offline/rover/lookup" -f $WorkerUrl.TrimEnd('/')) `
  -Headers @{ Authorization = "Bearer $AdminToken" } `
  -ContentType "application/json" `
  -Body ($payload | ConvertTo-Json -Compress)

$result | ConvertTo-Json -Depth 8

if (-not $result.ok) {
  Write-Host "`nNo usable RoVer mapping was returned. Inspect rover.http_status and rover.error above." -ForegroundColor Yellow
}
