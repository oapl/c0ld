$ErrorActionPreference = "Stop"

# Paste the inventory-detector-worker INGEST_ADMIN_TOKEN value between these quotes.
$AdminToken = "PASTE_INGEST_ADMIN_TOKEN_HERE"

$Worker = "https://inventory-detector-worker.opal-dde.workers.dev"
$UserId = "463900811"
$Username = "AgentP_0928"

if ($AdminToken -eq "PASTE_INGEST_ADMIN_TOKEN_HERE" -or [string]::IsNullOrWhiteSpace($AdminToken)) {
    throw "Paste the Worker's INGEST_ADMIN_TOKEN into `$AdminToken first."
}

$Headers = @{ Authorization = "Bearer $AdminToken" }
$StatusUrl = "$Worker/api/inventory/oauth/status?user_id=$UserId&v=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
$Status = Invoke-RestMethod -Method Get -Uri $StatusUrl -Headers @{ "Cache-Control" = "no-cache" }

Write-Host "OAuth configured: $($Status.configured)"
Write-Host "Agent connected: $($Status.connected)"
Write-Host "Authorized at:   $($Status.authorized_at)"
Write-Host "Expires at:      $($Status.expires_at)"

if (-not $Status.connected) {
    throw "The Worker has no saved OAuth grant for AgentP_0928. Deploy the callback fix, then have Agent click Connect BIG Games Inventory and approve once more."
}

$PullUrl = "$Worker/api/inventory/ingest?user_id=$UserId&username=$([uri]::EscapeDataString($Username))&force=1"
Write-Host "Pulling Agent's private inventory now..."
$Result = Invoke-RestMethod -Method Post -Uri $PullUrl -Headers $Headers

Write-Host ""
Write-Host "Pull complete."
Write-Host "Snapshot:    $($Result.snapshot.captured_at)"
Write-Host "Items:       $($Result.snapshot.item_count)"
Write-Host "Fresh source: $(-not [bool]$Result.snapshot.is_stale)"
Write-Host "Source:      $($Result.snapshot.source)"

$Result | ConvertTo-Json -Depth 8
