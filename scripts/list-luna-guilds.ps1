param(
  [string]$WorkerUrl = "https://discord-search-interactions-worker.opal-dde.workers.dev",
  [string]$Token = "",
  [switch]$AsJson
)

$ErrorActionPreference = "Stop"

# Optional: paste the Discord Worker's REGISTER_ADMIN_TOKEN between the quotes.
$DefaultToken = ""

if (-not $Token) {
  $Token = $DefaultToken
}

if (-not $Token) {
  $secure = Read-Host "REGISTER_ADMIN_TOKEN" -AsSecureString
  $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$Token = (($Token.ToCharArray() | Where-Object { -not [char]::IsControl($_) }) -join "").Trim()
if (-not $Token) {
  throw "REGISTER_ADMIN_TOKEN is empty after removing whitespace and control characters."
}

$base = $WorkerUrl.TrimEnd("/")
$headers = @{
  Authorization = "Bearer $Token"
  "X-C0LD-Admin-Token" = $Token
}

try {
  $result = Invoke-RestMethod `
    -Method Get `
    -Uri "$base/admin/discord-guilds" `
    -Headers $headers
} catch {
  $details = [string]$_.ErrorDetails.Message
  if (-not $details) {
    $details = $_.Exception.Message
  }
  throw "Luna guild lookup failed: $details"
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 8
  exit 0
}

Write-Host ("Luna can currently see {0} Discord server(s)." -f [int]$result.total)
$result.guilds |
  Select-Object `
    @{ Name = "Server"; Expression = { $_.name } }, `
    @{ Name = "GuildId"; Expression = { $_.id } }, `
    @{ Name = "Members"; Expression = { $_.approximate_member_count } }, `
    @{ Name = "Online"; Expression = { $_.approximate_presence_count } } |
  Format-Table -AutoSize
