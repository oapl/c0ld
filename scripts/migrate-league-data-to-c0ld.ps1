param(
  [Parameter(Mandatory = $true)]
  [string] $SourceDbUrl,

  [Parameter(Mandatory = $true)]
  [string] $TargetDbUrl,

  [string] $DumpDir = ".tmp\league-data-dump",
  [int] $Jobs = 2,

  [string[]] $Tables = @(
    "public.ps99_league_snapshots",
    "public.ps99_league_current",
    "public.ps99_league_inactivity_alerts"
  ),

  [switch] $ReplaceExisting,
  [switch] $SkipSchemaSetup,
  [switch] $SkipDump,
  [switch] $SkipRestore
)

$ErrorActionPreference = "Stop"

function Require-Command($Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command '$Name' was not found. Install PostgreSQL command line tools, then reopen PowerShell."
  }
  return $cmd.Source
}

function Invoke-Checked($File, [string[]] $Args) {
  Write-Host ""
  Write-Host ">> $File $($Args -join ' ')" -ForegroundColor Cyan
  & $File @Args
  if ($LASTEXITCODE -ne 0) {
    throw "$File failed with exit code $LASTEXITCODE"
  }
}

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DumpPath = Join-Path $RepoRoot $DumpDir
$SchemaPath = Join-Path $RepoRoot "supabase\c0ld_league_tables_setup.sql"

$pgDump = Require-Command "pg_dump"
$pgRestore = Require-Command "pg_restore"
$psql = Require-Command "psql"

if (-not $SkipSchemaSetup) {
  if (-not (Test-Path $SchemaPath)) {
    throw "Schema setup file not found: $SchemaPath"
  }
  Invoke-Checked $psql @($TargetDbUrl, "-v", "ON_ERROR_STOP=1", "-f", $SchemaPath)
}

if (-not $SkipDump) {
  if (Test-Path $DumpPath) {
    $resolvedDump = Resolve-Path $DumpPath
    if (-not $resolvedDump.Path.StartsWith($RepoRoot.Path, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove dump path outside repo: $resolvedDump"
    }
    Remove-Item -LiteralPath $resolvedDump.Path -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $DumpPath | Out-Null

  $dumpArgs = @(
    "--dbname=$SourceDbUrl",
    "--format=directory",
    "--jobs=$Jobs",
    "--data-only",
    "--no-owner",
    "--no-privileges",
    "--verbose",
    "--file=$DumpPath"
  )
  foreach ($table in $Tables) {
    $dumpArgs += "--table=$table"
  }
  Invoke-Checked $pgDump $dumpArgs
}

if ($ReplaceExisting -and -not $SkipRestore) {
  $truncateSql = @"
truncate table
  public.ps99_league_inactivity_alerts,
  public.ps99_league_current,
  public.ps99_league_snapshots
restart identity;
"@
  Invoke-Checked $psql @($TargetDbUrl, "-v", "ON_ERROR_STOP=1", "-c", $truncateSql)
}

if (-not $SkipRestore) {
  Invoke-Checked $pgRestore @(
    "--dbname=$TargetDbUrl",
    "--format=directory",
    "--jobs=$Jobs",
    "--data-only",
    "--no-owner",
    "--no-privileges",
    "--verbose",
    $DumpPath
  )

  $postRestoreSql = @"
select setval(pg_get_serial_sequence('public.ps99_league_snapshots','id'), coalesce((select max(id) from public.ps99_league_snapshots), 1), (select count(*) > 0 from public.ps99_league_snapshots));
select setval(pg_get_serial_sequence('public.ps99_league_current','id'), coalesce((select max(id) from public.ps99_league_current), 1), (select count(*) > 0 from public.ps99_league_current));
analyze public.ps99_league_snapshots;
analyze public.ps99_league_current;
analyze public.ps99_league_inactivity_alerts;
select 'ps99_league_snapshots' as table_name, count(*) as rows from public.ps99_league_snapshots
union all
select 'ps99_league_current' as table_name, count(*) as rows from public.ps99_league_current
union all
select 'ps99_league_inactivity_alerts' as table_name, count(*) as rows from public.ps99_league_inactivity_alerts
order by table_name;
"@
  Invoke-Checked $psql @($TargetDbUrl, "-v", "ON_ERROR_STOP=1", "-c", $postRestoreSql)
}

Write-Host ""
Write-Host "League data migration finished." -ForegroundColor Green
