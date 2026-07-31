param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$KmsGuildId = "1529193730022838392",
  [string]$TGuildId = "1457088639006670979",
  [string[]]$CleanupGuildIds = @("1457088639006670979", "1529193730022838392"),
  [int]$MaxAttempts = 8
)

$ErrorActionPreference = "Stop"

# Paste the discord-search-interactions-worker REGISTER_ADMIN_TOKEN here, or run the script and enter it when prompted.
$Token = "PASTE_REGISTER_ADMIN_TOKEN_HERE"

if ($Token -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE" -or [string]::IsNullOrWhiteSpace($Token)) {
  Write-Host "No token was found at the top of $PSCommandPath." -ForegroundColor Yellow
  Write-Host "Enter the REGISTER_ADMIN_TOKEN from discord-search-interactions-worker." -ForegroundColor Yellow
  $Token = Read-Host "REGISTER_ADMIN_TOKEN"
}

if ([string]::IsNullOrWhiteSpace($Token) -or $Token -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE") {
  throw "REGISTER_ADMIN_TOKEN is still empty or unchanged."
}

$base = $WorkerUrl.TrimEnd("/")
$tokenValue = $Token.Trim()
$headers = @{
  Authorization = "Bearer $tokenValue"
  "X-C0LD-Admin-Token" = $tokenValue
}

function Invoke-DiscordWorkerAdmin {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [ValidateSet("GET", "POST", "DELETE")]
    [string]$Method = "GET"
  )

  $uri = "$base$Path"
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt += 1) {
    try {
      return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
    } catch {
      $statusCode = $null
      $payload = $null
      try { $statusCode = [int]$_.Exception.Response.StatusCode } catch {}
      try { $payload = $_.ErrorDetails.Message | ConvertFrom-Json } catch {}

      $discordStatus = $null
      if ($null -ne $payload -and $null -ne $payload.status) {
        try { $discordStatus = [int]$payload.status } catch {}
      }

      $rateLimited = $statusCode -eq 429 -or $discordStatus -eq 429
      if ($rateLimited -and $attempt -lt $MaxAttempts) {
        $retryAfterSeconds = 2.0
        if ($null -ne $payload) {
          if ($null -ne $payload.details.retry_after) {
            $retryAfterSeconds = [double]$payload.details.retry_after
          } elseif ($null -ne $payload.retry_after) {
            $retryAfterSeconds = [double]$payload.retry_after
          }
        }

        $waitSeconds = [Math]::Round([Math]::Max(0.75, $retryAfterSeconds) + 0.5, 2)
        Write-Host "Discord rate limit reached. Waiting $waitSeconds seconds before retry $($attempt + 1)/$MaxAttempts..." -ForegroundColor Yellow
        Start-Sleep -Milliseconds ([Math]::Ceiling($waitSeconds * 1000))
        continue
      }

      throw
    }
  }

  throw "Worker request failed after $MaxAttempts attempts: $Method $uri"
}

function New-QueryString {
  param([hashtable]$Values)

  $parts = @()
  foreach ($key in $Values.Keys) {
    $value = [string]$Values[$key]
    if ([string]::IsNullOrWhiteSpace($value)) { continue }
    $parts += "$([uri]::EscapeDataString($key))=$([uri]::EscapeDataString($value.Trim()))"
  }

  if ($parts.Count -eq 0) { return "" }
  return "?" + ($parts -join "&")
}

$commandsToDelete = @(
  "search",
  "version",
  "ram",
  "rdp",
  "top",
  "rewards",
  "history",
  "clan",
  "cw",
  "league",
  "lb",
  "lg",
  "player",
  "server",
  "tracking",
  "luna",
  "add",
  "remove",
  "hourly",
  "htg",
  "offline",
  "kms",
  "t",
  "duck",
  "duplicate",
  "duplicatecheck"
)

$globalCommandsToRegister = @(
  "/admin/register-search-command",
  "/admin/register-version-command",
  "/admin/register-ram-command",
  "/admin/register-rdp-command",
  "/admin/register-top-command",
  "/admin/register-rewards-command",
  "/admin/register-history-command",
  "/admin/register-clan-command",
  "/admin/register-cw-command",
  "/admin/register-league-command",
  "/admin/register-lb-command",
  "/admin/register-lg-command",
  "/admin/register-player-command",
  "/admin/register-server-command",
  "/admin/register-luna-command",
  "/admin/register-add-command",
  "/admin/register-remove-command",
  "/admin/register-hourly-command",
  "/admin/register-htg-command",
  "/admin/register-offline-command"
)

Write-Host "Deleting existing managed global commands, including stale duplicates and /kms..." -ForegroundColor Cyan
foreach ($name in $commandsToDelete) {
  $query = New-QueryString @{ scope = "global"; name = $name }
  Write-Host "Deleting global /$name if present..." -ForegroundColor Cyan
  try {
    Invoke-DiscordWorkerAdmin -Method POST -Path "/admin/delete-command$query" | ConvertTo-Json -Depth 8
  } catch {
    Write-Host "Global delete for /$name failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
  Start-Sleep -Milliseconds 1200
}

Write-Host "Removing guild-specific duplicates from cleanup guilds..." -ForegroundColor Cyan
foreach ($guildId in $CleanupGuildIds) {
  if ([string]::IsNullOrWhiteSpace($guildId)) { continue }
  foreach ($name in $commandsToDelete) {
    $query = New-QueryString @{ scope = "guild"; guild_id = $guildId; name = $name }
    Write-Host "Deleting /$name from guild $guildId if present..." -ForegroundColor Cyan
    try {
      Invoke-DiscordWorkerAdmin -Method POST -Path "/admin/delete-command$query" | ConvertTo-Json -Depth 8
    } catch {
      Write-Host "Guild delete for /$name in $guildId failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 900
  }
}

Write-Host "Registering normal commands globally. /kms is intentionally excluded here." -ForegroundColor Cyan
foreach ($path in $globalCommandsToRegister) {
  $query = New-QueryString @{ scope = "global" }
  Write-Host "Registering global $path..." -ForegroundColor Cyan
  Invoke-DiscordWorkerAdmin -Method POST -Path "$path$query" | ConvertTo-Json -Depth 8
  Start-Sleep -Milliseconds 1400
}

if (-not [string]::IsNullOrWhiteSpace($KmsGuildId)) {
  Write-Host "Registering /kms only in guild $KmsGuildId..." -ForegroundColor Cyan
  $kmsQuery = New-QueryString @{ guild_id = $KmsGuildId }
  Invoke-DiscordWorkerAdmin -Method POST -Path "/admin/register-kms-command$kmsQuery" | ConvertTo-Json -Depth 8
  Start-Sleep -Milliseconds 1100
}

if (-not [string]::IsNullOrWhiteSpace($TGuildId)) {
  Write-Host "Registering guild-only /t in guild $TGuildId..." -ForegroundColor Cyan
  $tQuery = New-QueryString @{ guild_id = $TGuildId }
  Invoke-DiscordWorkerAdmin -Method POST -Path "/admin/register-t-command$tQuery" | ConvertTo-Json -Depth 8
  Start-Sleep -Milliseconds 1100
}

Write-Host "Current global commands:" -ForegroundColor Cyan
Invoke-DiscordWorkerAdmin -Path "/admin/commands?scope=global" |
  ConvertTo-Json -Depth 8

if (-not [string]::IsNullOrWhiteSpace($KmsGuildId)) {
  Write-Host "Current /kms guild command in ${KmsGuildId}:" -ForegroundColor Cyan
  $kmsListQuery = New-QueryString @{ scope = "guild"; guild_id = $KmsGuildId }
  Invoke-DiscordWorkerAdmin -Path "/admin/commands$kmsListQuery" |
    Select-Object -ExpandProperty results |
    ForEach-Object { $_.commands | Where-Object { $_.name -eq "kms" } } |
    ConvertTo-Json -Depth 8
}

if (-not [string]::IsNullOrWhiteSpace($TGuildId)) {
  Write-Host "Current /t guild command in ${TGuildId}:" -ForegroundColor Cyan
  $tListQuery = New-QueryString @{ scope = "guild"; guild_id = $TGuildId }
  Invoke-DiscordWorkerAdmin -Path "/admin/commands$tListQuery" |
    Select-Object -ExpandProperty results |
    ForEach-Object { $_.commands | Where-Object { $_.name -eq "t" } } |
    ConvertTo-Json -Depth 8
}

Write-Host "Done. Global command changes can take a while to appear in Discord. Use Ctrl+R to refresh the client." -ForegroundColor Yellow
