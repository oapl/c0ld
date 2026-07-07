param(
  # Optional: paste your Cloudflare Worker INGEST_ADMIN_TOKEN between the quotes.
  # Leaving this blank will make the script prompt for it when you run the file.
  [string]$AdminToken = "v8iP++UjyNfw2YwapYWWToz1Gd626FqAKIjvmDJWuxjIR2VzwF6p8XgRjS9JU6Hk",
  [string]$WorkerUrl = "https://yamo-league-api-worker.opal-dde.workers.dev",
  [string]$Run = "active",
  [string]$Token = "",
  [string[]]$Leagues = @(
    "NDCT", "YAMO", "GOATS", "SNCLS", "VPPPP", "brrbr", "3v4", "SMSW", "nfz", "GOLD",
    "ECTA", "JIME", "COLD", "2w4g", "zee1", "PERC", "ENRQE", "letto", "vexly", "Bol1i",
    "CLOW", "puhhh", "grndd", "KARAX", "4ff", "RAZ0", "tre5", "Phuny", "FYNE", "yuurr",
    "zee2"
  )
)

if (-not $Token -and $AdminToken) {
  $Token = $AdminToken
}

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{ Authorization = "Bearer $Token" }
$results = foreach ($league in $Leagues) {
  $encodedLeague = [uri]::EscapeDataString($league)
  $encodedRun = [uri]::EscapeDataString($Run)
  $uri = "$base/api/leagues/ingest?league=$encodedLeague&run=$encodedRun"
  try {
    $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers
    [pscustomobject]@{
      League = $league
      Ok = $response.ok
      StoredName = $response.league_name
      RowsInserted = $response.rows_inserted
      SnapshotAt = $response.fetched_at
      Error = $null
    }
  } catch {
    [pscustomobject]@{
      League = $league
      Ok = $false
      StoredName = $null
      RowsInserted = $null
      SnapshotAt = $null
      Error = $_.Exception.Message
    }
  }
}

$results | Format-Table -AutoSize
