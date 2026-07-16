# Edit these values, then run this script from PowerShell.
$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/"
$GuildId = "1457088639006670979"
$AdminToken = "v8iP++UjyNfw2YwapYWWToz1Gd626FqAKIjvmDJWuxjIR2VzwF6p8XgRjS9JU6Hk"

# Set this to $true only when you want a global Discord command instead of a
# guild command. Guild commands usually appear immediately while testing.
$RegisterGlobal = $false

$ErrorActionPreference = "Stop"

if ($WorkerUrl -match "YOUR-DISCORD-WORKER" -or [string]::IsNullOrWhiteSpace($WorkerUrl)) {
  throw "Set `$WorkerUrl to your Discord interaction Worker URL."
}

if ($AdminToken -eq "PASTE_REGISTER_ADMIN_TOKEN_HERE" -or [string]::IsNullOrWhiteSpace($AdminToken)) {
  throw "Set `$AdminToken to your REGISTER_ADMIN_TOKEN value."
}

if (-not $RegisterGlobal -and ($GuildId -eq "YOUR_GUILD_ID" -or [string]::IsNullOrWhiteSpace($GuildId))) {
  throw "Set `$GuildId, or set `$RegisterGlobal = `$true to register the global command."
}

$base = $WorkerUrl.TrimEnd("/")
$token = $AdminToken.Trim()
$headers = @{
  Authorization = "Bearer $token"
  "X-C0LD-Admin-Token" = $token
}

function New-QueryString {
  param([hashtable]$Values)

  $parts = @()
  foreach ($key in $Values.Keys) {
    $value = [string]$Values[$key]
    if ([string]::IsNullOrWhiteSpace($value)) { continue }

    $encodedKey = [uri]::EscapeDataString($key)
    $encodedValue = [uri]::EscapeDataString($value.Trim())
    $parts += "$encodedKey=$encodedValue"
  }

  if ($parts.Count -eq 0) { return "" }
  return "?" + ($parts -join "&")
}

function Invoke-C0ldDiscordAdmin {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [ValidateSet("GET", "POST")]
    [string]$Method = "GET"
  )

  $uri = "$base$Path"
  Write-Host "$Method $uri" -ForegroundColor Cyan

  try {
    Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  } catch {
    $statusCode = $null
    $body = [string]$_.ErrorDetails.Message
    try {
      $statusCode = [int]$_.Exception.Response.StatusCode
    } catch {
      $statusCode = $null
    }

    if ($statusCode -eq 401) {
      Write-Host ""
      Write-Host "401 Unauthorized. Check that AdminToken matches REGISTER_ADMIN_TOKEN on this Worker." -ForegroundColor Yellow
      Write-Host ""
    }

    if ($statusCode -eq 404 -or $body -match '"message"\s*:\s*"Not found"') {
      Write-Host ""
      Write-Host "404 Not Found from the Worker admin route." -ForegroundColor Yellow
      Write-Host "That means the live Discord Worker does not have /admin/register-rewards-command deployed yet." -ForegroundColor Yellow
      Write-Host "Deploy or paste the updated cloudflare/discord-search-interactions-worker.js first, then run this script again." -ForegroundColor Yellow
      Write-Host ""
    }

    throw
  }
}

Write-Host "Checking Worker health..." -ForegroundColor Green
Invoke-RestMethod -Uri "$base/" | ConvertTo-Json -Depth 8

$registerQuery = if ($RegisterGlobal) {
  ""
} else {
  New-QueryString @{ guild_id = $GuildId }
}

Write-Host "Registering /rewards..." -ForegroundColor Green
Invoke-C0ldDiscordAdmin -Method POST -Path "/admin/register-rewards-command$registerQuery" |
  ConvertTo-Json -Depth 10

$listQuery = if ($RegisterGlobal) {
  New-QueryString @{ scope = "global" }
} else {
  New-QueryString @{ scope = "guild"; guild_id = $GuildId }
}

Write-Host "Registered commands now visible to the Worker:" -ForegroundColor Green
Invoke-C0ldDiscordAdmin -Path "/admin/commands$listQuery" |
  ConvertTo-Json -Depth 10
