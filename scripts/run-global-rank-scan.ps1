param(
  [string]$WorkerUrl = "https://c0ld-clan-api-worker.opal-dde.workers.dev",
  [string]$Clan = "c0ld",
  [string]$Token = "",
  [switch]$Force,
  [int]$SleepSeconds = 3,
  [int]$MaxCalls = 200
)

# Optional: paste your c0ld-clan-api-worker INGEST_ADMIN_TOKEN between the quotes.
# Passing -Token is preferred when you do not want to save it in this file.
$DefaultToken = ""

if (-not $Token) {
  $Token = $DefaultToken
}

if (-not $Token) {
  $secure = Read-Host "INGEST_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{ Authorization = "Bearer $Token" }
$forceNextCall = [bool]$Force

function First-Value {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [object[]]$Values
  )

  foreach ($value in $Values) {
    if ($null -ne $value -and "$value" -ne "") {
      return $value
    }
  }

  return $null
}

for ($call = 1; $call -le $MaxCalls; $call += 1) {
  $query = @()
  if ($Clan) {
    $query += "clan=$([Uri]::EscapeDataString($Clan))"
  }
  if ($forceNextCall) {
    $query += "force=1"
  }

  $uri = "$base/api/global/ingest"
  if ($query.Count) {
    $uri = "$uri`?$($query -join '&')"
  }

  $result = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers
  $scanned = [int](First-Value $result.scanned_clan_count $result.scanned_count 0)
  $limit = [int](First-Value $result.clan_scan_limit 0)
  $candidates = [int](First-Value $result.candidate_player_count 0)
  $status = [string]$result.status
  $stopReason = [string]$result.stop_reason

  Write-Host ("[{0}] status={1} scanned={2}/{3} candidates={4} next_offset={5} stop={6}" -f `
    $call, $status, $scanned, $limit, $candidates, $result.next_clan_offset, $stopReason)

  if ($status -eq "ok" -or $status -eq "completed" -or $stopReason) {
    $result
    break
  }

  $forceNextCall = $false
  Start-Sleep -Seconds $SleepSeconds
}
