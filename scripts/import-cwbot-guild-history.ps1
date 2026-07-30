param(
  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
  [string]$GuildId = "1457088639006670979",
  [string]$AuthorId = "1219229814150398003",
  [string]$Token = "",
  [int]$PageSize = 100,
  [int]$CommandWindowSeconds = 180,
  [int]$ScanDelayMilliseconds = 250,
  [int]$ImportDelayMilliseconds = 500,
  [string]$CheckpointDirectory = "",
  [switch]$ScanOnly,
  [switch]$Reset,
  [switch]$IncludeArchivedThreads
)

# Optional: paste the c0ld-clan-api-worker INGEST_ADMIN_TOKEN between the quotes.
$DefaultToken = ""

if (-not $Token) {
  $Token = $DefaultToken
}

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$Token = (($Token.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
if (-not $Token) {
  throw "INGEST_ADMIN_TOKEN is empty after removing whitespace and control characters."
}

if ($GuildId -notmatch "^\d+$") {
  throw "GuildId must be a Discord snowflake."
}

if ($AuthorId -notmatch "^\d+$") {
  throw "AuthorId must be a Discord snowflake."
}

if (-not $CheckpointDirectory) {
  $CheckpointDirectory = Join-Path ([IO.Path]::GetTempPath()) "c0ld-cwbot-guild-history-$GuildId"
}

if (-not (Test-Path -LiteralPath $CheckpointDirectory)) {
  New-Item -Path $CheckpointDirectory -ItemType Directory -Force | Out-Null
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}
$channelScript = Join-Path $PSScriptRoot "import-cwbot-channel-history.ps1"

if (-not (Test-Path -LiteralPath $channelScript)) {
  throw "Channel importer was not found: $channelScript"
}

try {
  $discovery = Invoke-RestMethod `
    -Method Post `
    -Uri "$base/api/external-history/cwbot/guild-channels" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body (@{ guild_id = $GuildId } | ConvertTo-Json)
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) {
    $details = $_.Exception.Message
  }
  throw "Guild channel discovery failed: $details"
}

$channelMap = @{}
foreach ($channel in @($discovery.channels)) {
  if ($channel.channel_id) {
    $channelMap[[string]$channel.channel_id] = $channel
  }
}

if ($IncludeArchivedThreads) {
  $archiveFailures = 0
  foreach ($parent in @($discovery.archive_parent_channels)) {
    $before = ""
    do {
      $archiveBody = @{
        guild_id = $GuildId
        parent_channel_id = [string]$parent.channel_id
      }
      if ($before) {
        $archiveBody.before = $before
      }

      try {
        $archivePage = Invoke-RestMethod `
          -Method Post `
          -Uri "$base/api/external-history/cwbot/archived-threads" `
          -Headers $headers `
          -ContentType "application/json" `
          -Body ($archiveBody | ConvertTo-Json)
      } catch {
        $archiveFailures += 1
        if ($archiveFailures -le 5) {
          Write-Warning ("Could not enumerate archived threads under #{0}: {1}" -f `
            $parent.channel_name,
            $_.Exception.Message)
        } elseif ($archiveFailures -eq 6) {
          Write-Warning "Additional archived-thread permission failures will be summarized instead of printed individually."
        }
        break
      }

      foreach ($thread in @($archivePage.channels)) {
        if ($thread.channel_id) {
          $channelMap[[string]$thread.channel_id] = $thread
        }
      }
      $before = [string]$archivePage.next_before

      if ([bool]$archivePage.has_more -and $ScanDelayMilliseconds -gt 0) {
        Start-Sleep -Milliseconds $ScanDelayMilliseconds
      }
    } while ([bool]$archivePage.has_more -and $before)
  }

  if ($archiveFailures -gt 0) {
    Write-Warning ("Archived-thread discovery was denied under {0} parent channel(s). Normal channels and readable active threads will still be scanned." -f $archiveFailures)
  }
} else {
  Write-Host "Archived-thread discovery: skipped (add -IncludeArchivedThreads for a separate archive pass)."
}

$channels = @($channelMap.Values | Sort-Object `
  @{ Expression = { [bool]$_.is_thread } }, `
  @{ Expression = { [int]$_.position } }, `
  @{ Expression = { [string]$_.channel_name } })

if (-not $channels.Count) {
  throw "Discord returned no readable message channels or public archived threads for guild $GuildId."
}

Write-Host ("CW_Bot guild history job: guild={0} channels={1} author={2}" -f `
  $GuildId,
  $channels.Count,
  $AuthorId)
Write-Host ("Checkpoint directory: {0}" -f $CheckpointDirectory)

if ([bool]$discovery.channel_allowlist_active) {
  throw "CW_BOT_IMPORT_CHANNEL_IDS is configured on c0ld-clan-api-worker. Remove that variable before running a server-wide scan; use CW_BOT_IMPORT_GUILD_IDS to restrict the allowed Discord server."
}

$completed = 0
$failed = 0

foreach ($channel in $channels) {
  $channelId = [string]$channel.channel_id
  $channelName = [string]$channel.channel_name
  $checkpoint = Join-Path $CheckpointDirectory "$channelId.json"
  Write-Host ""
  Write-Host ("[{0}/{1}] #{2} ({3})" -f ($completed + $failed + 1), $channels.Count, $channelName, $channelId)

  $arguments = @{
    WorkerUrl = $WorkerUrl
    ChannelId = $channelId
    AuthorId = $AuthorId
    Token = $Token
    PageSize = $PageSize
    CommandWindowSeconds = $CommandWindowSeconds
    ScanDelayMilliseconds = $ScanDelayMilliseconds
    ImportDelayMilliseconds = $ImportDelayMilliseconds
    CheckpointPath = $checkpoint
  }
  if ($ScanOnly) {
    $arguments.ScanOnly = $true
  }
  if ($Reset) {
    $arguments.Reset = $true
  }

  try {
    & $channelScript @arguments
    $completed += 1
  } catch {
    $failed += 1
    Write-Warning ("Skipped #{0} ({1}): {2}" -f $channelName, $channelId, $_.Exception.Message)
  }
}

Write-Host ""
Write-Host ("Guild scan finished: completed={0}, failed/skipped={1}, total={2}" -f `
  $completed,
  $failed,
  $channels.Count)

if ($ScanOnly) {
  Write-Host "Review the per-channel checkpoint files, then rerun without -ScanOnly to import the candidates."
}
