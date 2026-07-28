param(
  [string]$WorkerUrl = "https://inventory-detector-worker.opal-dde.workers.dev",
  [string]$UserId = "109818",
  [string]$Username = "Cinnamowopal",
  [string]$Item = "Huge Turnip Hamster",
  [int]$Limit = 12,
  [string]$Token = "",
  [switch]$ForceAlertCheck
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

if (-not $Token) {
  throw "INGEST_ADMIN_TOKEN is required."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{ Authorization = "Bearer $Token"; Accept = "application/json" }
$cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Host "Checking inventory Worker health..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Method Get -Uri "$base/api/inventory/health?v=$cacheBust" -Headers @{ Accept = "application/json" }
$health | ConvertTo-Json -Depth 8

Write-Host ""
Write-Host "Running HTG diagnostics for $Username ($UserId): $Item" -ForegroundColor Cyan
$diagnosticsUrl = "$base/api/hatch/diagnostics?user_id=$([Uri]::EscapeDataString($UserId))&username=$([Uri]::EscapeDataString($Username))&item=$([Uri]::EscapeDataString($Item))&limit=$Limit&v=$cacheBust"
$diagnostics = Invoke-RestMethod -Method Get -Uri $diagnosticsUrl -Headers $headers
$diagnostics | ConvertTo-Json -Depth 16

if ($ForceAlertCheck) {
  Write-Host ""
  Write-Host "Forcing latest-snapshot HTG alert check..." -ForegroundColor Yellow
  $checkUrl = "$base/api/hatch/alerts/check?user_id=$([Uri]::EscapeDataString($UserId))&username=$([Uri]::EscapeDataString($Username))&force=true&v=$cacheBust"
  $check = Invoke-RestMethod -Method Post -Uri $checkUrl -Headers $headers
  $check | ConvertTo-Json -Depth 16
}
