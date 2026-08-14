param(
  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
  [string[]]$GuildIds = @(
    "1457088639006670979",
    "1418655634479644694"
  ),
  [string]$AuthorId = "1219229814150398003",
  [string]$Token = "",
  [int]$PageSize = 100,
  [int]$CommandWindowSeconds = 180,
  [int]$ScanDelayMilliseconds = 250,
  [int]$ImportDelayMilliseconds = 500,
  [string]$CheckpointRoot = "",
  [switch]$ScanOnly,
  [switch]$Reset,
  [switch]$IncludeArchivedThreads
)

$ErrorActionPreference = "Stop"

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

$normalizedGuildIds = @(
  $GuildIds |
    ForEach-Object { ([string]$_).Trim() } |
    Where-Object { $_ } |
    Select-Object -Unique
)

if (-not $normalizedGuildIds.Count) {
  throw "Provide at least one Discord guild ID."
}

foreach ($guildId in $normalizedGuildIds) {
  if ($guildId -notmatch "^\d+$") {
    throw "Guild ID '$guildId' is not a Discord snowflake."
  }
}

if ($AuthorId -notmatch "^\d+$") {
  throw "AuthorId must be a Discord snowflake."
}

$guildScript = Join-Path $PSScriptRoot "import-cwbot-guild-history.ps1"
if (-not (Test-Path -LiteralPath $guildScript)) {
  throw "Guild importer was not found: $guildScript"
}

if (-not $CheckpointRoot) {
  $CheckpointRoot = Join-Path ([IO.Path]::GetTempPath()) "c0ld-cwbot-multi-guild-history"
}
if (-not (Test-Path -LiteralPath $CheckpointRoot)) {
  New-Item -Path $CheckpointRoot -ItemType Directory -Force | Out-Null
}

Write-Host ("CW_Bot multi-guild history job: guilds={0} author={1}" -f $normalizedGuildIds.Count, $AuthorId)
Write-Host ("Checkpoint root: {0}" -f $CheckpointRoot)

$completed = 0
$failed = @()

foreach ($guildId in $normalizedGuildIds) {
  Write-Host ""
  Write-Host ("=== Guild {0} ({1}/{2}) ===" -f $guildId, ($completed + $failed.Count + 1), $normalizedGuildIds.Count)

  $arguments = @{
    WorkerUrl = $WorkerUrl
    GuildId = $guildId
    AuthorId = $AuthorId
    Token = $Token
    PageSize = $PageSize
    CommandWindowSeconds = $CommandWindowSeconds
    ScanDelayMilliseconds = $ScanDelayMilliseconds
    ImportDelayMilliseconds = $ImportDelayMilliseconds
    CheckpointDirectory = (Join-Path $CheckpointRoot $guildId)
  }
  if ($ScanOnly) {
    $arguments.ScanOnly = $true
  }
  if ($Reset) {
    $arguments.Reset = $true
  }
  if ($IncludeArchivedThreads) {
    $arguments.IncludeArchivedThreads = $true
  }

  try {
    & $guildScript @arguments
    $completed += 1
  } catch {
    $failed += [pscustomobject]@{
      GuildId = $guildId
      Error = $_.Exception.Message
    }
    Write-Warning ("Guild {0} failed: {1}" -f $guildId, $_.Exception.Message)
  }
}

Write-Host ""
Write-Host ("Multi-guild job finished: completed={0}, failed={1}, total={2}" -f $completed, $failed.Count, $normalizedGuildIds.Count)
if ($failed.Count) {
  $failed | Format-Table -AutoSize
  throw "One or more guild imports failed. Successful guild checkpoints were preserved; rerun the same command to resume."
}

if ($ScanOnly) {
  Write-Host "Review the per-channel checkpoint files, then rerun without -ScanOnly and -Reset to import the candidates."
}
