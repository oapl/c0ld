$ErrorActionPreference = "Stop"

# Paste the same value stored in the clan Worker's INGEST_ADMIN_TOKEN secret.
# Do not commit this file while a real token is present.
$AdminToken = "PASTE_INGEST_ADMIN_TOKEN_HERE"
$WorkerBase = "https://c0ld-clan-api-worker.opal-dde.workers.dev"

if ($AdminToken -eq "PASTE_INGEST_ADMIN_TOKEN_HERE" -or [string]::IsNullOrWhiteSpace($AdminToken)) {
    throw "Paste your INGEST_ADMIN_TOKEN into `$AdminToken at the top of this script first."
}

$headers = @{ Authorization = "Bearer $AdminToken" }

Write-Host "Checking the live cutoff sources..." -ForegroundColor Cyan
$players = Invoke-RestMethod -Method Get -Uri "$WorkerBase/api/reward-cutoffs?type=players"
$clans = Invoke-RestMethod -Method Get -Uri "$WorkerBase/api/reward-cutoffs?type=clans"
$leaguePlayers = Invoke-RestMethod -Method Get -Uri "https://yamo-league-api-worker.opal-dde.workers.dev/api/leagues/player-milestones?ranks=3,100,1000,1050,1150,6150,30000"
$leagues = Invoke-RestMethod -Method Get -Uri "https://yamo-league-api-worker.opal-dde.workers.dev/api/leagues/milestones?ranks=1,3,15,50,100,250,2000"

if (-not $players.ok) { throw "Player cutoff data is unavailable: $($players.message)" }
if (-not $clans.ok) { throw "Clan cutoff data is unavailable: $($clans.message)" }
if (-not $leaguePlayers.ok) { throw "League player cutoff data is unavailable: $($leaguePlayers.message)" }
if (-not $leagues.ok) { throw "League cutoff data is unavailable: $($leagues.message)" }

Write-Host "League player pool: $($leaguePlayers.total_players) players." -ForegroundColor Green
Write-Host "Player, clan, league-player, and league cutoff data are available." -ForegroundColor Green
Write-Host "Creating or force-refreshing the three persistent Discord posts..." -ForegroundColor Cyan

$result = Invoke-RestMethod `
    -Method Post `
    -Uri "$WorkerBase/api/persistent-posts/post?force=1" `
    -Headers $headers

if (-not $result.ok) {
    $result | ConvertTo-Json -Depth 10
    throw "At least one persistent Discord update failed. Review the response above."
}

$status = Invoke-RestMethod `
    -Method Get `
    -Uri "$WorkerBase/api/persistent-posts/status" `
    -Headers $headers

Write-Host "All three persistent Discord posts are active." -ForegroundColor Green
$labels = @{
    cutoffs = "Combined reward cutoffs"
    roblox_status = "Roblox Status"
    versions = "Versions"
}
foreach ($type in @("cutoffs", "roblox_status", "versions")) {
    $target = $status.targets.$type
    Write-Host ""
    Write-Host "$($labels[$type]) channel" -ForegroundColor Cyan
    Write-Host "  Channel ID: $($target.channel_id)"
    Write-Host "  Message ID: $($target.state.last_message_id)"
    Write-Host "  Last posted: $($target.state.last_posted_at)"
    Write-Host "  Discord message exists: $($target.message.exists)"
}
Write-Host "Automatic refresh: every $($status.schedule_minutes) minutes at offset $($status.schedule_offset_minutes)"
