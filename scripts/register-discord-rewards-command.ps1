param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$GuildId = "",
  [switch]$Global,
  [switch]$KeepLegacyRewards,
  [switch]$KeepLegacyCharts,
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
  param([hashtable]$Values)

  $parts = @()
  foreach ($key in $Values.Keys) {
    $value = [string]$Values[$key]
    if ($value.Trim() -eq "") { continue }
    $parts += "$([uri]::EscapeDataString($key))=$([uri]::EscapeDataString($value.Trim()))"
  }

  if ($parts.Count -eq 0) { return "" }
  return "?" + ($parts -join "&")
}

function Invoke-WorkerAdmin {
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

    if ($statusCode -eq 404 -or $body -match '"message"\s*:\s*"Not found"') {
      Write-Host ""
      Write-Host "404 Not Found from the Worker admin route." -ForegroundColor Yellow
      Write-Host "Deploy or paste the updated cloudflare/discord-search-interactions-worker.js to the Discord interactions Worker first." -ForegroundColor Yellow
      Write-Host "Also check that -WorkerUrl points to the Discord interactions Worker, not the clan API or another Worker." -ForegroundColor Yellow
      Write-Host ""
    }

    throw
  }
}

$useGlobal = $Global -or [string]::IsNullOrWhiteSpace($GuildId)

$query = if ($useGlobal) {
  New-QueryString @{ scope = "global" }
} else {
  New-QueryString @{ scope = "guild"; guild_id = $GuildId }
}

Write-Host "Registering reward commands: /clan rewards and /league rewards..." -ForegroundColor Green
$registration = Invoke-WorkerAdmin -Method POST -Path "/admin/register-rewards-command$query"
$registration | ConvertTo-Json -Depth 12

if (-not $registration.ok -or -not $registration.username_option_registered) {
  throw "Discord did not return the optional username field for both /clan rewards and /league rewards. Deploy the current Discord Worker and run this script again."
}

Write-Host "Verified: both reward subcommands now contain the optional username input." -ForegroundColor Green
if (@($registration.removed_guild_duplicates).Count -gt 0) {
  $removedNames = @($registration.removed_guild_duplicates | ForEach-Object { "/$($_.name)" }) -join ", "
  Write-Host "Removed shadowing guild command copies: $removedNames" -ForegroundColor Green
}

if (-not $KeepLegacyRewards) {
  $deleteQuery = if ($useGlobal) {
    New-QueryString @{ scope = "global"; name = "rewards" }
  } else {
    New-QueryString @{ scope = "guild"; guild_id = $GuildId; name = "rewards" }
  }

  Write-Host "Removing legacy /rewards command in the same scope..." -ForegroundColor Yellow
  Invoke-WorkerAdmin -Method POST -Path "/admin/delete-command$deleteQuery" |
    ConvertTo-Json -Depth 12
}

if (-not $KeepLegacyCharts) {
  $deleteDuckQuery = if ($useGlobal) {
    New-QueryString @{ scope = "global"; name = "duck" }
  } else {
    New-QueryString @{ scope = "guild"; guild_id = $GuildId; name = "duck" }
  }

  Write-Host "Removing legacy /duck chart command in the same scope..." -ForegroundColor Yellow
  Invoke-WorkerAdmin -Method POST -Path "/admin/delete-command$deleteDuckQuery" |
    ConvertTo-Json -Depth 12
}

if (-not $SkipList) {
  $listQuery = if ($useGlobal) {
    New-QueryString @{ scope = "global" }
  } else {
    New-QueryString @{ scope = "guild"; guild_id = $GuildId }
  }

  Write-Host "Commands after update..." -ForegroundColor Cyan
  Invoke-WorkerAdmin -Path "/admin/commands$listQuery" |
    ConvertTo-Json -Depth 12
}
