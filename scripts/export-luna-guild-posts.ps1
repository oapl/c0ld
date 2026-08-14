param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1502628142894809211",
  [string]$OutputDirectory = "",
  [ValidateRange(1, 100)]
  [int]$PageSize = 100,
  [ValidateRange(0, 10000)]
  [int]$DelayMilliseconds = 250,
  [string]$Token = "",
  [switch]$SkipPrivateThreads,
  [switch]$DownloadMedia
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
if (-not $OutputDirectory) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputDirectory = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Luna-Discord-Exports\$GuildId-$stamp"
}
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)

New-Item -Path $OutputDirectory -ItemType Directory -Force | Out-Null

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

function Invoke-LunaGet {
  param([Parameter(Mandatory = $true)][string]$Uri)

  for ($attempt = 1; $attempt -le 8; $attempt += 1) {
    try {
      return Invoke-RestMethod -Method Get -Uri $Uri -Headers $headers
    } catch {
      $status = 0
      try { $status = [int]$_.Exception.Response.StatusCode } catch { }
      $retryable = $status -eq 429 -or $status -ge 500 -or $status -eq 0
      if (-not $retryable -or $attempt -eq 8) {
        throw
      }
      $delay = [Math]::Min(30000, 1000 * [Math]::Pow(2, $attempt - 1))
      Write-Warning ("Request failed with HTTP {0}; retrying in {1:N0}ms ({2}/8)." -f $status, $delay, $attempt)
      Start-Sleep -Milliseconds $delay
    }
  }
}

function Write-JsonFile {
  param([Parameter(Mandatory = $true)]$Value, [Parameter(Mandatory = $true)][string]$Path)
  $Value | ConvertTo-Json -Depth 100 | Out-File -LiteralPath $Path -Encoding utf8
}

function Safe-Name {
  param([string]$Value)
  $safe = [string]$Value
  foreach ($character in [IO.Path]::GetInvalidFileNameChars()) {
    $safe = $safe.Replace([string]$character, "_")
  }
  $safe = $safe.Trim().TrimEnd(".")
  if (-not $safe) { return "unnamed" }
  if ($safe.Length -gt 80) { return $safe.Substring(0, 80) }
  return $safe
}

function Add-Target {
  param([hashtable]$Map, $Channel, [string]$Kind)
  $id = [string]$Channel.id
  if (-not $id) { return }
  if (-not $Map.ContainsKey($id)) {
    $Map[$id] = [pscustomobject]@{
      id = $id
      name = [string]$Channel.name
      type = [int]$Channel.type
      type_name = [string]$Channel.type_name
      kind = $Kind
      parent_id = [string]$Channel.parent_id
      parent_name = [string]$Channel.parent_name
      category_name = [string]$Channel.category_name
      direct_url = [string]$Channel.direct_url
    }
  }
}

function Get-MediaUrls {
  param($Message)
  $values = New-Object System.Collections.Generic.List[object]
  foreach ($attachment in @($Message.attachments)) {
    if ($attachment.url) {
      $values.Add([pscustomobject]@{ Url = [string]$attachment.url; Name = [string]$attachment.filename })
    }
  }
  foreach ($embed in @($Message.embeds)) {
    foreach ($property in @("image_url", "thumbnail_url", "video_url")) {
      $url = [string]$embed.$property
      if ($url) { $values.Add([pscustomobject]@{ Url = $url; Name = "$property" }) }
    }
  }
  return @($values)
}

function Save-PageMedia {
  param($Messages, [string]$TargetDirectory)
  $mediaDirectory = Join-Path $TargetDirectory "media"
  foreach ($message in @($Messages)) {
    $ordinal = 0
    foreach ($media in @(Get-MediaUrls -Message $message)) {
      $ordinal += 1
      try {
        New-Item -Path $mediaDirectory -ItemType Directory -Force | Out-Null
        $extension = [IO.Path]::GetExtension(([uri]$media.Url).AbsolutePath)
        if (-not $extension -or $extension.Length -gt 10) { $extension = ".bin" }
        $name = Safe-Name -Value ([IO.Path]::GetFileNameWithoutExtension($media.Name))
        $path = Join-Path $mediaDirectory ("{0}-{1:D2}-{2}{3}" -f $message.id, $ordinal, $name, $extension)
        if (Test-Path -LiteralPath $path) { continue }
        Invoke-WebRequest -Uri $media.Url -OutFile $path -UseBasicParsing
      } catch {
        Write-Warning ("Could not download media for message {0}: {1}" -f $message.id, $_.Exception.Message)
      }
    }
  }
}

Write-Host "Discovering every readable channel and thread in guild $GuildId..." -ForegroundColor Cyan
$channelsUri = "$base/admin/discord-guilds/channels?guild_id=$GuildId&include_raw=1&include_non_text=1"
$channelsResult = Invoke-LunaGet -Uri $channelsUri
Write-JsonFile -Value $channelsResult -Path (Join-Path $OutputDirectory "guild-channels.json")

$targetMap = @{}
$parentChannels = @($channelsResult.channels | Where-Object { [int]$_.type -in @(0, 5, 15, 16) })
foreach ($channel in @($channelsResult.channels | Where-Object { [int]$_.type -in @(0, 2, 5, 13) })) {
  Add-Target -Map $targetMap -Channel $channel -Kind "guild_channel"
}

$activeUri = "$base/admin/discord-guilds/threads?guild_id=$GuildId&include_archived=0&include_raw=1"
$activeResult = Invoke-LunaGet -Uri $activeUri
Write-JsonFile -Value $activeResult -Path (Join-Path $OutputDirectory "active-threads.json")
foreach ($thread in @($activeResult.threads)) {
  Add-Target -Map $targetMap -Channel $thread -Kind "active_thread"
}

$archiveErrors = New-Object System.Collections.Generic.List[object]
foreach ($parent in $parentChannels) {
  $parentArchiveScopes = @("public")
  if (-not $SkipPrivateThreads -and [int]$parent.type -eq 0) {
    $parentArchiveScopes += "private"
  }
  foreach ($scope in $parentArchiveScopes) {
    $before = ""
    $page = 0
    do {
      $query = "guild_id=$GuildId&parent_channel_id=$($parent.id)&scope=$scope&limit=100&include_raw=1"
      if ($before) { $query += "&before=$([uri]::EscapeDataString($before))" }
      try {
        $result = Invoke-LunaGet -Uri "$base/admin/discord-guilds/archived-threads?$query"
      } catch {
        $details = [string]$_.ErrorDetails.Message
        if (-not $details) { $details = $_.Exception.Message }
        $archiveErrors.Add([pscustomobject]@{
          parent_id = [string]$parent.id
          parent_name = [string]$parent.name
          scope = $scope
          error = $details
        })
        Write-Warning ("Archived {0} threads under #{1} could not be listed: {2}" -f $scope, $parent.name, $details)
        break
      }
      $page += 1
      foreach ($thread in @($result.threads)) {
        Add-Target -Map $targetMap -Channel $thread -Kind "archived_$scope`_thread"
      }
      $before = [string]$result.next_before
      if ($DelayMilliseconds -gt 0 -and [bool]$result.has_more) {
        Start-Sleep -Milliseconds $DelayMilliseconds
      }
    } while ([bool]$result.has_more -and $before)
  }
}

$targets = @($targetMap.Values | Sort-Object kind, category_name, parent_name, name, id)
Write-JsonFile -Value @{
  guild = $channelsResult.guild
  discovered_at = [datetimeoffset]::UtcNow.ToString("o")
  target_count = $targets.Count
  archive_errors = @($archiveErrors)
  targets = $targets
} -Path (Join-Path $OutputDirectory "discovery-manifest.json")

Write-Host ("Discovered {0} message-bearing channel/thread target(s)." -f $targets.Count) -ForegroundColor Cyan
$summary = New-Object System.Collections.Generic.List[object]
$targetNumber = 0
foreach ($target in $targets) {
  $targetNumber += 1
  $folderName = "{0}-{1}" -f $target.id, (Safe-Name -Value $target.name)
  $targetDirectory = Join-Path $OutputDirectory $folderName
  $pagesDirectory = Join-Path $targetDirectory "pages"
  New-Item -Path $pagesDirectory -ItemType Directory -Force | Out-Null
  Write-JsonFile -Value $target -Path (Join-Path $targetDirectory "target.json")

  $checkpointPath = Join-Path $targetDirectory "checkpoint.json"
  $checkpoint = $null
  if (Test-Path -LiteralPath $checkpointPath) {
    $checkpoint = Get-Content -LiteralPath $checkpointPath -Raw | ConvertFrom-Json
  }
  if ($checkpoint -and [bool]$checkpoint.complete) {
    Write-Host ("[{0}/{1}] #{2}: already complete ({3} posts)." -f $targetNumber, $targets.Count, $target.name, $checkpoint.message_count)
    $summary.Add($checkpoint)
    continue
  }

  $before = if ($checkpoint) { [string]$checkpoint.next_before } else { "" }
  $page = if ($checkpoint) { [int]$checkpoint.page_count } else { 0 }
  $messageCount = if ($checkpoint) { [int64]$checkpoint.message_count } else { 0 }
  $complete = $false
  $errorMessage = $null
  Write-Host ("[{0}/{1}] Exporting {2} #{3}..." -f $targetNumber, $targets.Count, $target.kind, $target.name) -ForegroundColor Yellow

  while (-not $complete) {
    $query = "guild_id=$GuildId&channel_id=$($target.id)&limit=$PageSize&include_raw=1"
    if ($before) { $query += "&before=$before" }
    try {
      $result = Invoke-LunaGet -Uri "$base/admin/discord-guilds/channel-messages?$query"
    } catch {
      $errorMessage = [string]$_.ErrorDetails.Message
      if (-not $errorMessage) { $errorMessage = $_.Exception.Message }
      Write-Warning ("Could not export #{0}: {1}" -f $target.name, $errorMessage)
      break
    }

    $page += 1
    $pagePath = Join-Path $pagesDirectory ("page-{0:D6}.json" -f $page)
    Write-JsonFile -Value $result -Path $pagePath
    $messageCount += [int]$result.count
    if ($DownloadMedia -and [int]$result.count -gt 0) {
      Save-PageMedia -Messages $result.messages -TargetDirectory $targetDirectory
    }
    $before = [string]$result.next_before
    $complete = -not [bool]$result.has_more -or -not $before

    $checkpoint = [pscustomobject]@{
      id = [string]$target.id
      name = [string]$target.name
      kind = [string]$target.kind
      page_count = $page
      message_count = $messageCount
      next_before = if ($complete) { $null } else { $before }
      complete = $complete
      error = $null
      updated_at = [datetimeoffset]::UtcNow.ToString("o")
    }
    Write-JsonFile -Value $checkpoint -Path $checkpointPath
    Write-Host ("  page={0} posts={1} total={2}" -f $page, [int]$result.count, $messageCount)
    if (-not $complete -and $DelayMilliseconds -gt 0) {
      Start-Sleep -Milliseconds $DelayMilliseconds
    }
  }

  if ($errorMessage) {
    $checkpoint = [pscustomobject]@{
      id = [string]$target.id
      name = [string]$target.name
      kind = [string]$target.kind
      page_count = $page
      message_count = $messageCount
      next_before = if ($before) { $before } else { $null }
      complete = $false
      error = $errorMessage
      updated_at = [datetimeoffset]::UtcNow.ToString("o")
    }
    Write-JsonFile -Value $checkpoint -Path $checkpointPath
  }
  $summary.Add($checkpoint)
}

$completeTargets = @($summary | Where-Object { $_.complete }).Count
$failedTargets = @($summary | Where-Object { -not $_.complete }).Count
$totalMessages = [int64](($summary | Measure-Object -Property message_count -Sum).Sum)
$manifest = [pscustomobject]@{
  ok = $failedTargets -eq 0 -and $archiveErrors.Count -eq 0
  partial = $failedTargets -gt 0 -or $archiveErrors.Count -gt 0
  guild = $channelsResult.guild
  exported_at = [datetimeoffset]::UtcNow.ToString("o")
  output_directory = $OutputDirectory
  target_count = $targets.Count
  complete_targets = $completeTargets
  failed_targets = $failedTargets
  total_messages = $totalMessages
  media_downloaded = [bool]$DownloadMedia
  archive_errors = @($archiveErrors)
  targets = @($summary)
}
Write-JsonFile -Value $manifest -Path (Join-Path $OutputDirectory "manifest.json")

Write-Host ""
Write-Host ("Export finished: {0:N0} posts across {1}/{2} completed targets." -f $totalMessages, $completeTargets, $targets.Count) -ForegroundColor Green
Write-Host ("Archive: {0}" -f $OutputDirectory) -ForegroundColor Cyan
if ($manifest.partial) {
  Write-Warning "The manifest marks this export partial. Review archive_errors and incomplete targets, then rerun the same command and OutputDirectory to resume."
}
