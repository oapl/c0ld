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

  [switch]$SkipDelete,

  [switch]$SkipDebug,

  [switch]$SkipList
)

$ErrorActionPreference = "Stop"

$base = $WorkerUrl.TrimEnd("/")
$Token = $Token.Trim()
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
    [string]$Method = "GET"
  )

  $uri = "$base$Path"
  try {
    Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  } catch {
    $statusCode = $null
    try {
      $statusCode = [int]$_.Exception.Response.StatusCode
    } catch {
      $statusCode = $null
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

Write-Host "Checking Worker..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/" | Format-List

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
  Write-Host "Registering /search, /version, /clan, and /duck..." -ForegroundColor Cyan
  $registerPaths = @(
    "/admin/register-search-command",
    "/admin/register-version-command",
    "/admin/register-clan-command",
    "/admin/register-duck-command"
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
  }
}

if (-not $SkipList) {
  Write-Host "Commands after changes..." -ForegroundColor Cyan
  $query = New-QueryString @{ scope = $Scope; guild_id = $GuildId }
  Invoke-C0ldDiscordWorker -Path "/admin/commands$query" |
    ConvertTo-Json -Depth 8
}
