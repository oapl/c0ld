param(
  [Parameter(Mandatory = $true)]
  [string]$GuildId,
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$Token = "",
  [string]$ConfirmGuildId = ""
)

$ErrorActionPreference = "Stop"
$DefaultToken = ""

if (-not $Token) { $Token = $DefaultToken }
if (-not $Token) {
  $secure = Read-Host "REGISTER_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$Token = (($Token.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
$GuildId = (($GuildId.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
if (-not $Token) { throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters." }
if ($GuildId -notmatch '^\d{17,20}$') { throw "GuildId must be a 17-20 digit Discord server ID." }

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

try {
  $lookup = Invoke-RestMethod `
    -Method Get `
    -Uri "$base/admin/discord-guilds?guild_id=$GuildId" `
    -Headers $headers
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) { $details = $_.Exception.Message }
  throw "Unable to verify the target server: $details"
}

if ([int]$lookup.total -ne 1) { throw "Luna is not currently in guild $GuildId." }
$guild = $lookup.guilds[0]
Write-Host ""
Write-Host "Luna will leave this Discord server:" -ForegroundColor Yellow
Write-Host ("  Name: {0}" -f $guild.name)
Write-Host ("  Guild ID: {0}" -f $guild.id)
Write-Host ("  Members: {0}" -f $guild.approximate_member_count)
Write-Host ("  Description: {0}" -f $guild.description)
Write-Host ""

if (-not $ConfirmGuildId) { $ConfirmGuildId = Read-Host "Type the Guild ID exactly to confirm" }
if ($ConfirmGuildId.Trim() -ne $GuildId) { throw "Confirmation did not match. Luna was not removed." }

try {
  $result = Invoke-RestMethod `
    -Method Delete `
    -Uri "$base/admin/discord-guilds/leave?guild_id=$GuildId&confirm=$GuildId" `
    -Headers $headers
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) { $details = $_.Exception.Message }
  throw "Luna could not leave the server: $details"
}

$result | ConvertTo-Json -Depth 8
