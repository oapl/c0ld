param(
  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
  [string]$ChannelId = "1489032381481619550",
  [string]$AuthorId = "1219229814150398003",
  [string]$Token = "",
  [int]$PageSize = 100,
  [int]$CommandWindowSeconds = 180,
  [int]$ScanDelayMilliseconds = 250,
  [int]$ImportDelayMilliseconds = 500,
  [string]$CheckpointPath = "",
  [switch]$ScanOnly,
  [switch]$Reset
)

# Optional: paste the c0ld-clan-api-worker INGEST_ADMIN_TOKEN between the quotes.
# Passing -Token is preferred when you do not want to save it in this file.
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

if ($PageSize -lt 1 -or $PageSize -gt 100) {
  throw "PageSize must be between 1 and 100."
}

if ($CommandWindowSeconds -lt 30 -or $CommandWindowSeconds -gt 900) {
  throw "CommandWindowSeconds must be between 30 and 900."
}

if ($ChannelId -notmatch "^\d+$") {
  throw "ChannelId must be a Discord snowflake."
}

if ($AuthorId -notmatch "^\d+$") {
  throw "AuthorId must be a Discord snowflake."
}

if (-not $CheckpointPath) {
  $CheckpointPath = Join-Path ([IO.Path]::GetTempPath()) "c0ld-cwbot-channel-history-$ChannelId.json"
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

function Get-RequestFailure {
  param([System.Management.Automation.ErrorRecord]$ErrorRecord)

  $statusCode = 0
  $details = [string]$ErrorRecord.ErrorDetails.Message
  $httpResponse = $ErrorRecord.Exception.Response

  if ($httpResponse) {
    try {
      $statusCode = [int]$httpResponse.StatusCode
    } catch {}

    if (-not $details) {
      try {
        if ($httpResponse.Content) {
          $details = $httpResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        } elseif ($httpResponse.GetResponseStream) {
          $stream = $httpResponse.GetResponseStream()
          $reader = [System.IO.StreamReader]::new($stream)
          try {
            $details = $reader.ReadToEnd()
          } finally {
            $reader.Dispose()
            $stream.Dispose()
          }
        }
      } catch {}
    }
  }

  if (-not $details) {
    $details = $ErrorRecord.Exception.Message
  }

  [pscustomobject]@{
    StatusCode = $statusCode
    Details = $details
  }
}

function New-ImportState {
  [ordered]@{
    version = 1
    channel_id = $ChannelId
    author_id = $AuthorId
    before_message_id = $null
    pending_bot_messages = @()
    scan_complete = $false
    pages_scanned = 0
    messages_scanned = 0
    cw_bot_messages = 0
    cw_bot_images = 0
    direct_history_signals = 0
    command_pairs = 0
    cw_bot_non_history = 0
    candidates = @()
    ignored_posts = @()
    imported_message_ids = @()
    rejected_message_ids = @()
    failures = @()
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Save-ImportState {
  param(
    [System.Collections.IDictionary]$State,
    [hashtable]$CandidateMap,
    [hashtable]$IgnoredMap
  )

  $State.candidates = @($CandidateMap.Values | Sort-Object {
    [System.Numerics.BigInteger]::Parse([string]$_.message_id)
  })
  $State.ignored_posts = @($IgnoredMap.Values | Sort-Object {
    [System.Numerics.BigInteger]::Parse([string]$_.message_id)
  })
  $State.updated_at = (Get-Date).ToUniversalTime().ToString("o")
  $json = $State | ConvertTo-Json -Depth 12
  $temporaryPath = "$CheckpointPath.tmp"
  Set-Content -LiteralPath $temporaryPath -Value $json -Encoding UTF8
  Move-Item -LiteralPath $temporaryPath -Destination $CheckpointPath -Force
}

function ConvertTo-StateHashtable {
  param($InputObject)

  $state = New-ImportState
  foreach ($property in $InputObject.PSObject.Properties) {
    $state[$property.Name] = $property.Value
  }
  return $state
}

if ($Reset -and (Test-Path -LiteralPath $CheckpointPath)) {
  Remove-Item -LiteralPath $CheckpointPath -Force
}

$state = New-ImportState
if (Test-Path -LiteralPath $CheckpointPath) {
  $saved = Get-Content -LiteralPath $CheckpointPath -Raw | ConvertFrom-Json
  if ([string]$saved.channel_id -ne $ChannelId -or [string]$saved.author_id -ne $AuthorId) {
    throw "Checkpoint belongs to a different channel or author. Use -Reset or another -CheckpointPath."
  }
  $state = ConvertTo-StateHashtable $saved
}

$candidateMap = @{}
foreach ($candidate in @($state.candidates)) {
  if ($candidate.message_id) {
    $candidateMap[[string]$candidate.message_id] = $candidate
  }
}

$ignoredMap = @{}
foreach ($ignored in @($state.ignored_posts)) {
  if ($ignored.message_id) {
    $ignoredMap[[string]$ignored.message_id] = $ignored
  }
}

Write-Host ("CW_Bot channel history job: channel={0} author={1}" -f $ChannelId, $AuthorId)
Write-Host ("Checkpoint: {0}" -f $CheckpointPath)

while (-not [bool]$state.scan_complete) {
  $requestBody = @{
    channel_id = $ChannelId
    author_id = $AuthorId
    limit = $PageSize
    command_window_seconds = $CommandWindowSeconds
    pending_bot_messages = @($state.pending_bot_messages)
  }
  if ($state.before_message_id) {
    $requestBody.before_message_id = [string]$state.before_message_id
  }

  try {
    $response = Invoke-RestMethod `
      -Method Post `
      -Uri "$base/api/external-history/cwbot/channel-scan" `
      -Headers $headers `
      -ContentType "application/json" `
      -Body ($requestBody | ConvertTo-Json -Depth 10)
  } catch {
    $failure = Get-RequestFailure $_
    throw "Channel scan failed (HTTP $($failure.StatusCode)): $($failure.Details)"
  }

  foreach ($candidate in @($response.candidates)) {
    if ($candidate.message_id) {
      $candidateMap[[string]$candidate.message_id] = $candidate
    }
  }
  foreach ($ignored in @($response.ignored)) {
    if ($ignored.message_id) {
      $ignoredMap[[string]$ignored.message_id] = $ignored
    }
  }

  $state.before_message_id = $response.next_before_message_id
  $state.pending_bot_messages = @($response.pending_bot_messages)
  $state.scan_complete = [bool]$response.done
  $state.pages_scanned = [int]$state.pages_scanned + 1
  $state.messages_scanned = [int]$state.messages_scanned + [int]$response.stats.messages_scanned
  $state.cw_bot_messages = [int]$state.cw_bot_messages + [int]$response.stats.cw_bot_messages
  $state.cw_bot_images = [int]$state.cw_bot_images + [int]$response.stats.cw_bot_images
  $state.direct_history_signals = [int]$state.direct_history_signals + [int]$response.stats.direct_history_signals
  $state.command_pairs = [int]$state.command_pairs + [int]$response.stats.command_pairs
  $state.cw_bot_non_history = [int]$state.cw_bot_non_history + [int]$response.stats.cw_bot_non_history

  Save-ImportState -State $state -CandidateMap $candidateMap -IgnoredMap $ignoredMap
  Write-Host ("scan page={0} messages={1} bot={2} candidates={3} next_before={4}" -f `
    $state.pages_scanned,
    $response.stats.messages_scanned,
    $response.stats.cw_bot_messages,
    $candidateMap.Count,
    $state.before_message_id)

  if (-not $state.scan_complete -and $ScanDelayMilliseconds -gt 0) {
    Start-Sleep -Milliseconds $ScanDelayMilliseconds
  }
}

Write-Host ""
Write-Host ("Scan complete: {0} messages, {1} CW_Bot messages, {2} history candidates, {3} classified non-history." -f `
  $state.messages_scanned,
  $state.cw_bot_messages,
  $candidateMap.Count,
  $ignoredMap.Count)

if ($ScanOnly) {
  Write-Host "ScanOnly was selected. Review the checkpoint manifest, then rerun without -ScanOnly to import it."
  return
}

$importedIds = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($messageId in @($state.imported_message_ids)) {
  [void]$importedIds.Add([string]$messageId)
}

$rejectedIds = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($messageId in @($state.rejected_message_ids)) {
  [void]$rejectedIds.Add([string]$messageId)
}

$orderedCandidates = @($candidateMap.Values | Sort-Object {
  [System.Numerics.BigInteger]::Parse([string]$_.message_id)
})
$importedThisRun = 0
$rejectedThisRun = 0

foreach ($candidate in $orderedCandidates) {
  $messageId = [string]$candidate.message_id
  if ($importedIds.Contains($messageId) -or $rejectedIds.Contains($messageId)) {
    continue
  }

  $importBody = @{
    message_url = [string]$candidate.message_url
    query = [string]$candidate.command_query
    prefer_earliest_message = $true
  }

  $success = $false
  for ($attempt = 1; $attempt -le 4; $attempt += 1) {
    try {
      $result = Invoke-RestMethod `
        -Method Post `
        -Uri "$base/api/external-history/cwbot/import" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body ($importBody | ConvertTo-Json -Depth 5)

      [void]$importedIds.Add($messageId)
      $state.imported_message_ids = @($importedIds)
      $importedThisRun += 1
      $success = $true
      Write-Host ("imported message={0} user={1} rows={2} backfilled={3} skipped={4}" -f `
        $messageId,
        $result.user_id,
        $result.imported_count,
        $result.backfilled_count,
        $result.skipped_count)
      break
    } catch {
      $failure = Get-RequestFailure $_

      if ($failure.StatusCode -eq 422) {
        [void]$rejectedIds.Add($messageId)
        $state.rejected_message_ids = @($rejectedIds)
        $rejectedThisRun += 1
        $success = $true
        Write-Warning ("Rejected non-history candidate {0}: {1}" -f $messageId, $failure.Details)
        break
      }

      if ($failure.StatusCode -in @(400, 401, 403, 404, 409)) {
        throw "Import rejected for message $messageId (HTTP $($failure.StatusCode)): $($failure.Details)"
      }

      if ($attempt -eq 4) {
        $state.failures = @($state.failures) + @([pscustomobject]@{
          message_id = $messageId
          status = $failure.StatusCode
          details = $failure.Details
          failed_at = (Get-Date).ToUniversalTime().ToString("o")
        })
        Write-Warning ("Import failed after 4 attempts for message {0}: {1}" -f $messageId, $failure.Details)
      } else {
        Start-Sleep -Seconds ([Math]::Min(15, $attempt * 3))
      }
    }
  }

  Save-ImportState -State $state -CandidateMap $candidateMap -IgnoredMap $ignoredMap
  if ($success -and $ImportDelayMilliseconds -gt 0) {
    Start-Sleep -Milliseconds $ImportDelayMilliseconds
  }
}

Write-Host ""
Write-Host ("Finished: imported this run={0}, rejected as non-history={1}, total imported={2}, failures={3}" -f `
  $importedThisRun,
  $rejectedThisRun,
  $importedIds.Count,
  @($state.failures).Count)
