param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$GuildId = "1457088639006670979",
  [string]$Token = "",
  [string]$ExpectedBuildId = "discord-clan-tracker-four-post-roster-2026-08-21"
)

$ErrorActionPreference = "Stop"
$base = $WorkerUrl.TrimEnd("/")

$liveWorker = Invoke-RestMethod -Method Get -Uri "$base/"
$liveBuildId = [string]$liveWorker.build_id
if ($liveBuildId -ne $ExpectedBuildId) {
  throw "The live Discord Worker is build '$liveBuildId', but this registration requires '$ExpectedBuildId'. Deploy the updated Worker first, verify the build ID, and then run this script again."
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  $secureToken = Read-Host "REGISTER_ADMIN_TOKEN" -AsSecureString
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  try {
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  }
}

$Token = $Token.Trim()
if ([string]::IsNullOrWhiteSpace($Token)) {
  throw "REGISTER_ADMIN_TOKEN is required."
}

$encodedGuildId = [uri]::EscapeDataString($GuildId.Trim())
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

Write-Host "Synchronizing the global Discord commands and removing stale guild copies..." -ForegroundColor Cyan
$result = Invoke-RestMethod `
  -Method Post `
  -Uri "$base/admin/sync-global-commands?guild_id=$encodedGuildId" `
  -Headers $headers

if (-not $result.ok) {
  throw "Discord did not confirm the global command synchronization."
}

$globalHtg = @($result.global_commands | Where-Object {
  ([string]$_.name).Trim().ToLowerInvariant() -eq "htg"
})
$preservedGuildHtg = @($result.preserved_guild_commands | Where-Object {
  ([string]$_.name).Trim().ToLowerInvariant() -eq "htg"
})
$globalApi = @($result.global_commands | Where-Object {
  ([string]$_.name).Trim().ToLowerInvariant() -eq "api"
})
$preservedGuildApi = @($result.preserved_guild_commands | Where-Object {
  ([string]$_.name).Trim().ToLowerInvariant() -eq "api"
})

if ($globalHtg.Count -ne 1) {
  throw "Expected exactly one global /htg command after synchronization; Discord returned $($globalHtg.Count)."
}
if ($preservedGuildHtg.Count -ne 0) {
  throw "A guild-scoped /htg command still exists after synchronization."
}
if ($globalApi.Count -ne 1) {
  throw "Expected exactly one global /api command after synchronization; Discord returned $($globalApi.Count)."
}
if ($preservedGuildApi.Count -ne 0) {
  throw "A guild-scoped /api command still exists after synchronization."
}

$removedNames = @($result.deleted_guild_commands | ForEach-Object { "/$($_.name)" })
if ($removedNames.Count -gt 0) {
  Write-Host "Removed stale guild command copies: $($removedNames -join ', ')" -ForegroundColor Green
}

Write-Host "Confirmed: exactly one global /htg command and no guild-scoped /htg duplicate." -ForegroundColor Green
Write-Host "Confirmed: exactly one global /api command and no guild-scoped /api duplicate." -ForegroundColor Green
Write-Host "Discord clients may take a few minutes to refresh global command labels." -ForegroundColor Yellow
