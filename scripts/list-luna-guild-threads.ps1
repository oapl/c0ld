param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1502628142894809211",
  [ValidateRange(1, 100)]
  [int]$ArchivePagesPerChannel = 1,
  [ValidateRange(2, 100)]
  [int]$ArchivePageSize = 100,
  [string]$Token = "",
  [switch]$ActiveOnly,
  [switch]$IncludePrivate,
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
if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}
if ($GuildId -notmatch '^\d{17,20}$') {
  throw "GuildId must be a 17-20 digit Discord server ID."
}

$query = New-Object System.Collections.Generic.List[string]
$query.Add("guild_id=$([uri]::EscapeDataString($GuildId))")
$query.Add("include_archived=$(if ($ActiveOnly) { 0 } else { 1 })")
$query.Add("include_private=$(if ($IncludePrivate) { 1 } else { 0 })")
$query.Add("archive_pages_per_channel=$ArchivePagesPerChannel")
$query.Add("archive_page_size=$ArchivePageSize")
if ($IncludeRaw) {
  $query.Add("include_raw=1")
}

$base = $WorkerUrl.TrimEnd("/")
$uri = "$base/admin/discord-guilds/threads?$($query -join '&')"
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
  throw "Luna thread inventory failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 50
  exit 0
}

Write-Host ("{0} ({1})" -f $result.guild.name, $result.guild.id) -ForegroundColor Cyan
Write-Host ("Found {0} active and {1} archived thread(s) across {2} thread-capable parent channel(s)." -f [int]$result.active_count, [int]$result.archived_count, @($result.thread_capable_channels).Count)
Write-Host ("Server: {0}" -f $result.guild.server_url)

@($result.threads) |
  Select-Object `
    @{ Name = "State"; Expression = { if ($_.active) { "Active" } else { "Archived" } } }, `
    @{ Name = "Category"; Expression = { if ($_.category_name) { $_.category_name } else { "Uncategorized" } } }, `
    @{ Name = "Parent"; Expression = { if ($_.parent_name) { "#{0}" -f $_.parent_name } else { "Unknown" } } }, `
    @{ Name = "Thread"; Expression = { $_.name } }, `
    @{ Name = "Type"; Expression = { $_.type_name } }, `
    @{ Name = "Messages"; Expression = { if ($null -ne $_.total_message_sent) { $_.total_message_sent } else { $_.message_count } } }, `
    @{ Name = "Members"; Expression = { $_.member_count } }, `
    @{ Name = "ArchivedAt"; Expression = {
      if (-not $_.archive_timestamp) { return $null }
      try { ([datetimeoffset]::Parse([string]$_.archive_timestamp)).ToLocalTime().ToString("yyyy-MM-dd h:mm tt") } catch { $_.archive_timestamp }
    } }, `
    @{ Name = "Locked"; Expression = { $_.locked } }, `
    @{ Name = "URL"; Expression = { $_.direct_url } } |
  Format-Table -AutoSize -Wrap

if (@($result.errors).Count -gt 0) {
  Write-Host ""
  Write-Warning ("Discord denied or failed {0} archive scan(s). The thread list above is partial." -f @($result.errors).Count)
  @($result.errors) |
    Select-Object `
      @{ Name = "Parent"; Expression = { "#{0}" -f $_.parent_name } }, `
      @{ Name = "Scope"; Expression = { $_.scope } }, `
      @{ Name = "Status"; Expression = { $_.status } }, `
      @{ Name = "Error"; Expression = { $_.error } } |
    Format-Table -AutoSize -Wrap
}

$truncatedScans = @($result.archive_scans | Where-Object { $_.truncated })
if ($truncatedScans.Count -gt 0) {
  Write-Warning ("{0} archive scan(s) reached ArchivePagesPerChannel={1}; rerun with a larger value or inspect -AsJson for continuation cursors." -f $truncatedScans.Count, $ArchivePagesPerChannel)
}
