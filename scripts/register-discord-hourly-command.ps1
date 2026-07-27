param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev/",
  [Parameter(Mandatory = $true)]
  [string]$Token,
  [string]$GuildId = "",
  [switch]$Global,
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

  Invoke-RestMethod -Method $Method -Uri "$base$Path" -Headers $headers
}

$query = if ($Global) {
  New-QueryString @{ scope = "global" }
} else {
  New-QueryString @{ guild_id = $GuildId }
}

Write-Host "Registering /hourly..." -ForegroundColor Green
Invoke-WorkerAdmin -Method POST -Path "/admin/register-hourly-command$query" |
  ConvertTo-Json -Depth 12

if (-not $SkipList) {
  $listQuery = if ($Global) {
    New-QueryString @{ scope = "global" }
  } else {
    New-QueryString @{ scope = "guild"; guild_id = $GuildId }
  }

  Write-Host "Commands after update..." -ForegroundColor Cyan
  Invoke-WorkerAdmin -Path "/admin/commands$listQuery" |
    ConvertTo-Json -Depth 12
}
