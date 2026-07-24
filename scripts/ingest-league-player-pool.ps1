param(
  [string]$WorkerUrl = "https://yamo-league-api-worker.opal-dde.workers.dev",
  [string]$Run = "tap-heroes-part-2",
  [int]$TopLeagues = 1000,
  [int]$BatchSize = 25,
  [int]$Concurrency = 4,
  [string]$Token = "",
  [int]$RetrySeconds = 15,
  [int]$MaxRetriesPerBatch = 8
)

# Optional: paste the yamo-league-api-worker INGEST_ADMIN_TOKEN between the quotes.
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

$Token = (($Token.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
if (-not $Token) {
  throw "INGEST_ADMIN_TOKEN is empty after removing whitespace and control characters."
}

if ($TopLeagues -lt 1 -or $TopLeagues -gt 10000) {
  throw "TopLeagues must be between 1 and 10000."
}

if ($BatchSize -lt 1 -or $BatchSize -gt 100) {
  throw "BatchSize must be between 1 and 100."
}

if ($Concurrency -lt 1 -or $Concurrency -gt 12) {
  throw "Concurrency must be between 1 and 12."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{ Authorization = "Bearer $Token" }
$scanId = "{0}-{1}-{2}" -f $Run, $TopLeagues, (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$offset = 0
$startedAt = Get-Date

function Get-RequestFailure {
  param([System.Management.Automation.ErrorRecord]$ErrorRecord)

  $statusCode = 0
  $details = [string]$ErrorRecord.ErrorDetails.Message
  $httpResponse = $ErrorRecord.Exception.Response

  if ($httpResponse) {
    try {
      $statusCode = [int]$httpResponse.StatusCode
    } catch {}

    if (-not $details) {
      try {
        if ($httpResponse.Content) {
          $details = $httpResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        } elseif ($httpResponse.GetResponseStream) {
          $stream = $httpResponse.GetResponseStream()
          $reader = [System.IO.StreamReader]::new($stream)
          try {
            $details = $reader.ReadToEnd()
          } finally {
            $reader.Dispose()
            $stream.Dispose()
          }
        }
      } catch {}
    }
  }

  if (-not $details) {
    $details = $ErrorRecord.Exception.Message
  }

  [pscustomobject]@{
    StatusCode = $statusCode
    Details = $details
  }
}

Write-Host ("Starting League player-pool scan: run={0} Top {1} leagues, batch={2}, concurrency={3}" -f `
  $Run, $TopLeagues, $BatchSize, $Concurrency)

while ($offset -lt $TopLeagues) {
  $remaining = $TopLeagues - $offset
  $currentBatchSize = [Math]::Min($BatchSize, $remaining)
  $isFinalBatch = ($offset + $currentBatchSize) -ge $TopLeagues
  $query = @(
    "run=$([Uri]::EscapeDataString($Run))",
    "scan_id=$([Uri]::EscapeDataString($scanId))",
    "top_limit=$TopLeagues",
    "offset=$offset",
    "limit=$currentBatchSize",
    "concurrency=$Concurrency",
    "reset=$(if ($offset -eq 0) { '1' } else { '0' })",
    "finalize=$(if ($isFinalBatch) { '1' } else { '0' })"
  )
  $uri = "$base/api/leagues/player-pool/ingest?$($query -join '&')"
  $response = $null

  for ($attempt = 1; $attempt -le $MaxRetriesPerBatch; $attempt += 1) {
    try {
      $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers
      if (-not $response.ok) {
        throw [System.Exception]::new([string]$response.message)
      }
      break
    } catch {
      $failure = Get-RequestFailure $_
      if ($failure.StatusCode -in @(400, 401, 403, 404, 409)) {
        throw "Worker rejected batch offset $offset (HTTP $($failure.StatusCode)): $($failure.Details)"
      }
      if ($attempt -ge $MaxRetriesPerBatch) {
        throw "Batch offset $offset failed after $MaxRetriesPerBatch attempts: $($failure.Details)"
      }
      Write-Warning ("Batch offset {0} failed on attempt {1}/{2}: {3}" -f `
        $offset, $attempt, $MaxRetriesPerBatch, $failure.Details)
      Start-Sleep -Seconds $RetrySeconds
    }
  }

  $elapsed = (Get-Date) - $startedAt
  $elapsedText = $elapsed.ToString("hh\:mm\:ss")
  Write-Host ("offset={0} source={1} scanned={2} players={3} next={4} finalized={5} elapsed={6}" -f `
    $offset,
    $response.manifest_source,
    $response.leagues_scanned,
    $response.players_seen,
    $response.next_offset,
    $response.finalized,
    $elapsedText)

  if ($response.finalized) {
    Write-Host ("Completed. Published {0} unique League players in snapshot {1}." -f `
      $response.total_players, $response.final_snapshot_id)
    break
  }

  if ($null -eq $response.next_offset) {
    throw "The Worker reached the final batch but did not finalize the player pool."
  }

  $offset = [int]$response.next_offset
}

Invoke-RestMethod -Method Get -Uri "$base/api/leagues/player-pool/status?run=$([Uri]::EscapeDataString($Run))" |
  Format-List
