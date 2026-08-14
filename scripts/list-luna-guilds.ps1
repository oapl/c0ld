param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$Token = "",
  [string]$GuildId = "",
  [switch]$Detailed,
  [switch]$IncludeRaw,
  [switch]$AsJson
)

$ErrorActionPreference = "Stop"

# Optional: paste the Discord Worker's REGISTER_ADMIN_TOKEN between the quotes.
$DefaultToken = ""

if (-not $Token) {
  $Token = $DefaultToken
}

if (-not $Token) {
  $secure = Read-Host "REGISTER_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$Token = (($Token.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

try {
  $query = New-Object System.Collections.Generic.List[string]
  if ($GuildId) {
    $query.Add("guild_id=$([uri]::EscapeDataString($GuildId.Trim()))")
  }
  if ($IncludeRaw) {
    $query.Add("include_raw=1")
  }
  $uri = "$base/admin/discord-guilds"
  if ($query.Count -gt 0) {
    $uri = "$uri`?$($query -join '&')"
  }
  $result = Invoke-RestMethod `
    -Method Get `
    -Uri $uri `
    -Headers $headers
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) {
    $details = $_.Exception.Message
  }
  throw "Luna guild lookup failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 20
  exit 0
}

Write-Host ("Luna can currently see {0} Discord server(s)." -f [int]$result.total)
if ($Detailed) {
  foreach ($guild in $result.guilds) {
    Write-Host ""
    Write-Host ("{0} ({1})" -f $guild.name, $guild.id) -ForegroundColor Cyan
    $guild | Select-Object `
      name, id, description, created_at, server_url, invite_url, invite_source, owner_id, `
      approximate_member_count, approximate_presence_count, premium_tier, premium_subscription_count, `
      preferred_locale, verification_level, max_members, features, icon_url, banner_url, splash_url, `
      discovery_splash_url, widget_enabled, widget_channel_id, system_channel_id, rules_channel_id, `
      public_updates_channel_id, safety_alerts_channel_id, bot_permissions, details_available, details_error |
      Format-List
  }
  exit 0
}

$result.guilds |
  Select-Object `
    @{ Name = "Server"; Expression = { $_.name } }, `
    @{ Name = "GuildId"; Expression = { $_.id } }, `
    @{ Name = "Members"; Expression = { $_.approximate_member_count } }, `
    @{ Name = "Online"; Expression = { $_.approximate_presence_count } }, `
    @{ Name = "Boosts"; Expression = { $_.premium_subscription_count } }, `
    @{ Name = "Description"; Expression = { $_.description } }, `
    @{ Name = "Invite"; Expression = { $_.invite_url } }, `
    @{ Name = "ServerUrl"; Expression = { $_.server_url } } |
  Format-Table -AutoSize
