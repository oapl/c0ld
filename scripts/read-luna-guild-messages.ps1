param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1502628142894809211",
  [string[]]$Channels = @("av", "ae", "commands", "c0ld"),
  [ValidateRange(1, 100)]
  [int]$Limit = 25,
  [string]$Before = "",
  [string]$Token = "",
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
$Before = $Before.Trim()
$Channels = @(
  $Channels |
    ForEach-Object { ([string]$_).Trim().TrimStart("#") } |
    Where-Object { $_ }
)

if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}
if ($GuildId -notmatch '^\d{17,20}$') {
  throw "GuildId must be a 17-20 digit Discord server ID."
}
if ($Before -and $Before -notmatch '^\d{17,20}$') {
  throw "Before must be a 17-20 digit Discord message ID."
}
if ($Channels.Count -eq 0) {
  throw "At least one channel name or ID is required."
}

$query = New-Object System.Collections.Generic.List[string]
$query.Add("guild_id=$([uri]::EscapeDataString($GuildId))")
$query.Add("channels=$([uri]::EscapeDataString(($Channels -join ',')))")
$query.Add("limit=$Limit")
if ($Before) {
  $query.Add("before=$([uri]::EscapeDataString($Before))")
}
if ($IncludeRaw) {
  $query.Add("include_raw=1")
}

$base = $WorkerUrl.TrimEnd("/")
$uri = "$base/admin/discord-guilds/messages?$($query -join '&')"
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
  throw "Luna message-history lookup failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 50
  exit 0
}

Write-Host ("{0} ({1})" -f $result.guild.name, $result.guild.id) -ForegroundColor Cyan
Write-Host ("Recent messages from {0} resolved channel(s), up to {1} per channel." -f [int]$result.channel_count, [int]$result.limit_per_channel)
Write-Host ("Server: {0}" -f $result.guild.server_url)

if (@($result.unresolved_channels).Count -gt 0) {
  Write-Warning ("No matching channel was found for: {0}" -f (@($result.unresolved_channels) -join ", "))
}

foreach ($channel in @($result.channels)) {
  Write-Host ""
  $category = if ($channel.category_name) { $channel.category_name } else { "Uncategorized" }
  Write-Host ("#{0} [{1}]" -f $channel.name, $category) -ForegroundColor Yellow
  Write-Host ("{0} | {1}" -f $channel.direct_url, $channel.type_name) -ForegroundColor DarkGray

  if (-not $channel.ok) {
    Write-Warning ("Discord returned HTTP {0}: {1}" -f $channel.status, $channel.error)
    continue
  }
  if (@($channel.messages).Count -eq 0) {
    Write-Host "No messages were returned." -ForegroundColor DarkGray
    continue
  }

  foreach ($message in @($channel.messages)) {
    $timestamp = "Unknown time"
    if ($message.timestamp) {
      try {
        $timestamp = ([datetimeoffset]::Parse([string]$message.timestamp)).ToLocalTime().ToString("yyyy-MM-dd h:mm:ss tt zzz")
      } catch {
        $timestamp = [string]$message.timestamp
      }
    }

    $authorName = [string]$message.author.username
    if ($message.author.global_name -and $message.author.global_name -ne $authorName) {
      $authorName = "{0} (@{1})" -f $message.author.global_name, $authorName
    }
    $authorFlags = New-Object System.Collections.Generic.List[string]
    if ($message.author.bot) { $authorFlags.Add("bot") }
    if ($message.webhook_id) { $authorFlags.Add("webhook") }
    $flagText = if ($authorFlags.Count -gt 0) { " [{0}]" -f ($authorFlags -join ", ") } else { "" }

    Write-Host ("[{0}] {1}{2}" -f $timestamp, $authorName, $flagText) -ForegroundColor Cyan
    if ($message.content) {
      Write-Host ([string]$message.content)
    }

    foreach ($embed in @($message.embeds)) {
      $embedHeading = if ($embed.title) { "Embed: {0}" -f $embed.title } else { "Embed" }
      Write-Host $embedHeading -ForegroundColor Magenta
      if ($embed.description) { Write-Host ([string]$embed.description) }
      foreach ($field in @($embed.fields)) {
        Write-Host ("  {0}: {1}" -f $field.name, $field.value)
      }
      if ($embed.url) { Write-Host ("  Link: {0}" -f $embed.url) -ForegroundColor DarkGray }
      if ($embed.image_url) { Write-Host ("  Image: {0}" -f $embed.image_url) -ForegroundColor DarkGray }
      if ($embed.thumbnail_url) { Write-Host ("  Thumbnail: {0}" -f $embed.thumbnail_url) -ForegroundColor DarkGray }
    }

    function Write-DiscordComponent {
      param([object]$Component, [string]$Indent = "")
      if ($Component.content) { Write-Host ("{0}{1}" -f $Indent, $Component.content) }
      if ($Component.label) { Write-Host ("{0}Button: {1}" -f $Indent, $Component.label) -ForegroundColor DarkGray }
      if ($Component.url) { Write-Host ("{0}Link: {1}" -f $Indent, $Component.url) -ForegroundColor DarkGray }
      if ($Component.media.url) { Write-Host ("{0}Media: {1}" -f $Indent, $Component.media.url) -ForegroundColor DarkGray }
      foreach ($item in @($Component.items)) {
        if ($item.description) { Write-Host ("{0}{1}" -f $Indent, $item.description) }
        if ($item.media.url) { Write-Host ("{0}Media: {1}" -f $Indent, $item.media.url) -ForegroundColor DarkGray }
      }
      if ($Component.accessory) { Write-DiscordComponent -Component $Component.accessory -Indent ("{0}  " -f $Indent) }
      foreach ($child in @($Component.components)) {
        Write-DiscordComponent -Component $child -Indent ("{0}  " -f $Indent)
      }
    }
    foreach ($component in @($message.components)) {
      Write-DiscordComponent -Component $component
    }

    foreach ($attachment in @($message.attachments)) {
      Write-Host ("Attachment: {0} - {1}" -f $attachment.filename, $attachment.url) -ForegroundColor DarkGray
    }

    if (@($message.reactions).Count -gt 0) {
      $reactionText = @($message.reactions | ForEach-Object {
        $emoji = if ($_.emoji_name) { $_.emoji_name } else { $_.emoji_id }
        "{0} x{1}" -f $emoji, $_.count
      }) -join ", "
      Write-Host ("Reactions: {0}" -f $reactionText) -ForegroundColor DarkGray
    }
    Write-Host ("Message: {0}" -f $message.direct_url) -ForegroundColor DarkGray
    Write-Host ("-" * 72) -ForegroundColor DarkGray
  }
}
