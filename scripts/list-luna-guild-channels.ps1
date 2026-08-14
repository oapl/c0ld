param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1502628142894809211",
  [string]$Token = "",
  [switch]$IncludeNonText,
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
$GuildId = $GuildId.Trim()
if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}
if ($GuildId -notmatch '^\d{17,20}$') {
  throw "GuildId must be a 17-20 digit Discord server ID."
}

$query = New-Object System.Collections.Generic.List[string]
$query.Add("guild_id=$([uri]::EscapeDataString($GuildId))")
if ($IncludeNonText) {
  $query.Add("include_non_text=1")
}
if ($IncludeRaw) {
  $query.Add("include_raw=1")
}

$base = $WorkerUrl.TrimEnd("/")
$uri = "$base/admin/discord-guilds/channels?$($query -join '&')"
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

try {
  $result = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) {
    $details = $_.Exception.Message
  }
  throw "Luna channel lookup failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 30
  exit 0
}

Write-Host ("{0} ({1})" -f $result.guild.name, $result.guild.id) -ForegroundColor Cyan
Write-Host ("Luna can retrieve {0} matching channel(s)." -f [int]$result.total)
Write-Host ("Server: {0}" -f $result.guild.server_url)

$visibleChannels = @($result.channels | Where-Object { $_.luna_permissions.view_channel })
$hiddenChannels = @($result.channels | Where-Object { -not $_.luna_permissions.view_channel })

$visibleChannels |
  Select-Object `
    @{ Name = "Category"; Expression = { if ($_.category_name) { $_.category_name } else { "Uncategorized" } } }, `
    @{ Name = "Channel"; Expression = { "#{0}" -f $_.name } }, `
    @{ Name = "Type"; Expression = { $_.type_name } }, `
    @{ Name = "ChannelId"; Expression = { $_.id } }, `
    @{ Name = "Send"; Expression = { $_.luna_permissions.send_messages } }, `
    @{ Name = "History"; Expression = { $_.luna_permissions.read_message_history } }, `
    @{ Name = "Topic"; Expression = { $_.topic } }, `
    @{ Name = "URL"; Expression = { $_.direct_url } } |
  Format-Table -AutoSize -Wrap

if ($hiddenChannels.Count -gt 0) {
  Write-Host ""
  Write-Warning ("Discord returned {0} matching channel(s) that Luna cannot view through its own effective permissions." -f $hiddenChannels.Count)
  $hiddenChannels |
    Select-Object `
      @{ Name = "Category"; Expression = { if ($_.category_name) { $_.category_name } else { "Uncategorized" } } }, `
      @{ Name = "Channel"; Expression = { "#{0}" -f $_.name } }, `
      @{ Name = "Type"; Expression = { $_.type_name } }, `
      @{ Name = "ChannelId"; Expression = { $_.id } } |
    Format-Table -AutoSize
}
