param(
  [Parameter(Mandatory = $true)]
  [string]$WorkerUrl,

  [string]$GuildId = "",

  [Parameter(Mandatory = $true)]
  [string]$Token,

  [string[]]$DeleteCommands = @("machine", "stock", "vend"),

  [ValidateSet("both", "guild", "global")]
  [string]$Scope = "both",

  [switch]$SkipRegister,

  [switch]$RegisterGlobal,

  [switch]$TrackerOnly,

  [switch]$SkipDelete,

  [switch]$SkipDebug,

  [switch]$SkipList
)

$ErrorActionPreference = "Stop"

$base = $WorkerUrl.TrimEnd("/")
$Token = $Token.Trim()
$adminBase = $base
if ($adminBase -match "(?i)/discord/interactions$") {
  $adminBase = $adminBase -replace "(?i)/discord/interactions$", ""
}
$adminBase = $adminBase.TrimEnd("/")

# Keep a best-effort health probe target.
$healthProbes = @("$adminBase/")
if ($adminBase -ne $base) {
  $healthProbes += "$base/"
}

$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

function New-QueryString {
  param(
    [hashtable]$Values
  )

  $parts = @()
  foreach ($key in $Values.Keys) {
    $value = [string]$Values[$key]
    if ($value.Trim() -eq "") { continue }
    $encodedKey = [uri]::EscapeDataString($key)
    $encodedValue = [uri]::EscapeDataString($value.Trim())
    $parts += "$encodedKey=$encodedValue"
  }

  if ($parts.Count -eq 0) { return "" }
  return "?" + ($parts -join "&")
}

function Invoke-C0ldDiscordWorker {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [ValidateSet("GET", "POST", "DELETE")]
    [string]$Method = "GET",

    [int]$MaxAttempts = 6
  )

  $uri = "$adminBase$Path"
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt += 1) {
    try {
      return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
    } catch {
      $requestError = $_
      $statusCode = $null
      $errorPayload = $null
      try {
        $statusCode = [int]$requestError.Exception.Response.StatusCode
      } catch {
        $statusCode = $null
      }
      try {
        $errorPayload = $requestError.ErrorDetails.Message | ConvertFrom-Json
      } catch {
        $errorPayload = $null
      }

      $discordStatusCode = $null
      if ($null -ne $errorPayload -and $null -ne $errorPayload.status) {
        try {
          $discordStatusCode = [int]$errorPayload.status
        } catch {
          $discordStatusCode = $null
        }
      }
      $rateLimited = $statusCode -eq 429 -or $discordStatusCode -eq 429

      if ($rateLimited -and $attempt -lt $MaxAttempts) {
        $retryAfterSeconds = 2.0
        if ($null -ne $errorPayload) {
          if ($null -ne $errorPayload.details.retry_after) {
            $retryAfterSeconds = [double]$errorPayload.details.retry_after
          } elseif ($null -ne $errorPayload.retry_after) {
            $retryAfterSeconds = [double]$errorPayload.retry_after
          }
        }

        $waitMilliseconds = [Math]::Ceiling(([Math]::Max(0.5, $retryAfterSeconds) + 0.35) * 1000)
        Write-Host "Discord rate limit reached. Retrying in $([Math]::Round($waitMilliseconds / 1000, 2)) seconds (attempt $attempt/$MaxAttempts)..." -ForegroundColor Yellow
        Start-Sleep -Milliseconds $waitMilliseconds
        continue
      }

      if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "401 Unauthorized from Worker admin route." -ForegroundColor Yellow
        Write-Host "The route exists, but the token sent here does not match REGISTER_ADMIN_TOKEN or INGEST_ADMIN_TOKEN on that Worker." -ForegroundColor Yellow
        Write-Host "Check that the secret is set on this exact Worker and that Cloudflare saved/deployed the updated variable." -ForegroundColor Yellow
        Write-Host ""
      }

      throw
    }
  }

  throw "Worker request still failed after $MaxAttempts attempts: $Method $uri"
}

Write-Host "Checking Worker..." -ForegroundColor Cyan
$workerCheckOk = $false
foreach ($probe in $healthProbes) {
  try {
    $result = Invoke-RestMethod -Uri $probe
    Write-Host "Worker check (via $probe):" -ForegroundColor Green
    $result | Format-List
    $workerCheckOk = $true
    break
  } catch {
    if ($_ -notmatch '"ok":false') {
      # ignore and try fallback in case of endpoint-specific 404
    }
  }
}

if (-not $workerCheckOk) {
  throw "Worker check failed for $WorkerUrl. Try using the worker root URL (no /discord/interactions) or verify the service deployment is active."
}

if (-not $SkipDebug) {
  Write-Host "Checking Discord token/app/guild access..." -ForegroundColor Cyan
  $query = New-QueryString @{ guild_id = $GuildId }
  Invoke-C0ldDiscordWorker -Path "/admin/discord-debug$query" |
    ConvertTo-Json -Depth 8
}

if (-not $SkipList) {
  Write-Host "Commands before changes..." -ForegroundColor Cyan
  $query = New-QueryString @{ scope = $Scope; guild_id = $GuildId }
  Invoke-C0ldDiscordWorker -Path "/admin/commands$query" |
    ConvertTo-Json -Depth 8
}

if (-not $SkipDelete) {
  foreach ($commandName in $DeleteCommands) {
    Write-Host "Deleting /$commandName if it exists..." -ForegroundColor Cyan
    $query = New-QueryString @{ scope = $Scope; guild_id = $GuildId; name = $commandName }
    Invoke-C0ldDiscordWorker -Method POST -Path "/admin/delete-command$query" |
      ConvertTo-Json -Depth 8
  }
}

if (-not $SkipRegister) {
  Write-Host "Registering /search, /version, /clan, and /lg..." -ForegroundColor Cyan
  $registerPaths = @(
    "/admin/register-search-command",
    "/admin/register-version-command",
    "/admin/register-clan-command",
    "/admin/register-lg-command"
  )
  foreach ($path in $registerPaths) {
    $registerPath = if ($RegisterGlobal) {
      $path
    } else {
      $query = New-QueryString @{ guild_id = $GuildId }
      "$path$query"
    }
    Invoke-C0ldDiscordWorker -Method POST -Path $registerPath |
      ConvertTo-Json -Depth 8
    Start-Sleep -Milliseconds 600
  }
}

if (-not $SkipList) {
  Write-Host "Commands after changes..." -ForegroundColor Cyan
  $query = New-QueryString @{ scope = $Scope; guild_id = $GuildId }
  Invoke-C0ldDiscordWorker -Path "/admin/commands$query" |
    ConvertTo-Json -Depth 8
}
