param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1502628142894809211",
  [ValidateRange(1, 100000)]
  [int]$MaxMembers = 10000,
  [ValidateRange(1, 1000)]
  [int]$PageSize = 1000,
  [string]$Query = "",
  [string]$After = "",
  [string]$Token = "",
  [switch]$IncludeBots,
  [switch]$IncludeRaw,
  [switch]$AsJson
)

$ErrorActionPreference = "Stop"
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
$Query = $Query.Trim()
$After = $After.Trim()
if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}
if ($GuildId -notmatch '^\d{17,20}$') {
  throw "GuildId must be a 17-20 digit Discord server ID."
}
if ($After -and $After -notmatch '^\d{17,20}$') {
  throw "After must be a 17-20 digit Discord user ID."
}

$queryParts = New-Object System.Collections.Generic.List[string]
$queryParts.Add("guild_id=$([uri]::EscapeDataString($GuildId))")
$queryParts.Add("max_members=$MaxMembers")
$queryParts.Add("page_size=$PageSize")
if ($Query) {
  $queryParts.Add("query=$([uri]::EscapeDataString($Query))")
}
if ($After) {
  $queryParts.Add("after=$([uri]::EscapeDataString($After))")
}
if ($IncludeRaw) {
  $queryParts.Add("include_raw=1")
}

$base = $WorkerUrl.TrimEnd("/")
$uri = "$base/admin/discord-guilds/members?$($queryParts -join '&')"
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
  throw "Luna member-roster lookup failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 50
  exit 0
}

Write-Host ("{0} ({1})" -f $result.guild.name, $result.guild.id) -ForegroundColor Cyan
Write-Host ("Fetched {0} member(s) across {1} Discord page(s); {2} matched." -f [int]$result.fetched, [int]$result.pages, [int]$result.matched)
Write-Host ("Server: {0}" -f $result.guild.server_url)
if ($result.truncated) {
  Write-Warning ("The result reached MaxMembers={0}. Resume with -After '{1}'." -f $MaxMembers, $result.next_after)
}

$members = @($result.members)
if (-not $IncludeBots) {
  $members = @($members | Where-Object { -not $_.bot })
}
Write-Host ("Displaying {0} {1}." -f $members.Count, $(if ($IncludeBots) { "members including bots" } else { "human members" }))

$members |
  Select-Object `
    @{ Name = "DisplayName"; Expression = { $_.display_name } }, `
    @{ Name = "Username"; Expression = { $_.username } }, `
    @{ Name = "UserId"; Expression = { $_.id } }, `
    @{ Name = "Nickname"; Expression = { $_.nickname } }, `
    @{ Name = "Bot"; Expression = { $_.bot } }, `
    @{ Name = "Joined"; Expression = {
      if (-not $_.joined_at) { return $null }
      try { ([datetimeoffset]::Parse([string]$_.joined_at)).ToLocalTime().ToString("yyyy-MM-dd h:mm tt") } catch { $_.joined_at }
    } }, `
    @{ Name = "HighestRole"; Expression = { $_.highest_role.name } }, `
    @{ Name = "Roles"; Expression = { (@($_.roles | ForEach-Object { $_.name }) -join ", ") } } |
  Format-Table -AutoSize -Wrap

