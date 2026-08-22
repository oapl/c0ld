[CmdletBinding()]
param(
  [string]$RosterPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "Data\c0ld-battle-rosters.txt"),
  [string]$BotToken = "",
  [switch]$Apply,
  [switch]$PlanOnly,
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
$GuildId = "1457088639006670979"
$DiscordApiBase = "https://discord.com/api/v10"

# These mappings are intentionally explicit. Backrooms earned the Daydream
# participation role, and Soccer earned the Thunderstorm participation role.
$BattleRoles = [ordered]@{
  "Abstract Battle"    = [ordered]@{ RoleId = "1502766588250820731"; RoleName = "Abstract Battle" }
  "Starry Battle"      = [ordered]@{ RoleId = "1500141659449589830"; RoleName = "Starry Battle" }
  "Angel Battle 2026"  = [ordered]@{ RoleId = "1504867128631759038"; RoleName = "Angel Battle" }
  "Backrooms 2026"     = [ordered]@{ RoleId = "1517565278685368440"; RoleName = "Daydream Battle" }
  "Soccer Battle 2026" = [ordered]@{ RoleId = "1522642293817999420"; RoleName = "Thunderstorm Battle" }
  "Lunar Battle 2026"  = [ordered]@{ RoleId = "1527709947842793724"; RoleName = "Lunar Battle" }
  "Gummy Battle 2026"  = [ordered]@{ RoleId = "1532784432896020661"; RoleName = "Gummy Battle" }
  "Ninja Battle 2026"  = [ordered]@{ RoleId = "1537954331196784700"; RoleName = "Ninja Battle" }
}
$ParticipationRole = [ordered]@{
  RoleId = "1489032341593522358"
  RoleName = "Battle participation divider"
}
$ScythRoleMirror = [ordered]@{
  SourceDiscordUserId = "1191280147588993039"
  TargetDiscordUserId = "1450138909919940745"
  TargetDiscordUsername = "scytheekiii"
}

function ConvertFrom-SecureToken {
  param([Security.SecureString]$SecureToken)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Read-RosterPlan {
  param([string]$Path)

  $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
  $lines = @(Get-Content -LiteralPath $resolvedPath)
  $rosters = [ordered]@{}
  $identityRows = @{}
  $uncertainPlayers = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  $currentBattle = $null
  $inIdentitySection = $false

  foreach ($line in $lines) {
    if ($line -match '^\s*===\s*(.+?)\s*===\s*$') {
      $heading = $Matches[1].Trim()
      if ($heading -eq "Unique Players Across All Battles") {
        $currentBattle = $null
        $inIdentitySection = $true
        continue
      }

      $inIdentitySection = $false
      $currentBattle = $heading
      if ($BattleRoles.Contains($currentBattle)) {
        $rosters[$currentBattle] = [Collections.Generic.List[string]]::new()
      }
      continue
    }

    if ($currentBattle -and $BattleRoles.Contains($currentBattle) -and $line -match '^\s*\d+\.\s+(\S+)') {
      $rosters[$currentBattle].Add($Matches[1].Trim())
      continue
    }

    if (-not $inIdentitySection -or $line -notmatch '^\s*\d+\.\s+(\S+)') {
      continue
    }

    $player = $Matches[1].Trim()
    if ($line -match 'User ID:\s*(\d{17,20})') {
      $discordUserId = $Matches[1]
      if ($line -match '\(I think\?\)') {
        [void]$uncertainPlayers.Add($player)
        continue
      }

      $discordUsername = $null
      if ($line -match '^\s*\d+\.\s+\S+\s+@([^\s]+)\s+User ID:') {
        $discordUsername = $Matches[1]
      }
      $identityRows[$player] = [pscustomobject][ordered]@{
        RobloxUsername = $player
        DiscordUsername = $discordUsername
        DiscordUserId = $discordUserId
      }
    }
  }

  $missingSections = @($BattleRoles.Keys | Where-Object { -not $rosters.Contains($_) })
  if ($missingSections.Count -gt 0) {
    throw "Roster file is missing required section(s): $($missingSections -join ', ')"
  }

  $assignments = [ordered]@{}
  $battleSummaries = [Collections.Generic.List[object]]::new()
  $unresolved = [Collections.Generic.List[object]]::new()

  foreach ($battleName in $BattleRoles.Keys) {
    $role = $BattleRoles[$battleName]
    $resolvedEntries = 0
    $uniqueDiscordIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)

    foreach ($player in $rosters[$battleName]) {
      if (-not $identityRows.ContainsKey($player)) {
        $reason = if ($uncertainPlayers.Contains($player)) { "uncertain_discord_user_id" } else { "missing_discord_user_id" }
        $unresolved.Add([pscustomobject][ordered]@{ Battle = $battleName; RobloxUsername = $player; Reason = $reason })
        continue
      }

      $identity = $identityRows[$player]
      $resolvedEntries++
      [void]$uniqueDiscordIds.Add($identity.DiscordUserId)
      $assignmentKey = "$($role.RoleId):$($identity.DiscordUserId)"
      if (-not $assignments.Contains($assignmentKey)) {
        $assignments[$assignmentKey] = [pscustomobject][ordered]@{
          Battle = $battleName
          RoleId = $role.RoleId
          ExpectedRoleName = $role.RoleName
          DiscordUserId = $identity.DiscordUserId
          DiscordUsernameFromRoster = $identity.DiscordUsername
          RobloxUsernames = [Collections.Generic.List[string]]::new()
        }
      }
      $assignments[$assignmentKey].RobloxUsernames.Add($player)
    }

    $battleSummaries.Add([pscustomobject][ordered]@{
      Battle = $battleName
      RoleId = $role.RoleId
      ExpectedRoleName = $role.RoleName
      RosterEntries = $rosters[$battleName].Count
      ResolvedRosterEntries = $resolvedEntries
      UniqueDiscordUsers = $uniqueDiscordIds.Count
      UnresolvedRosterEntries = $rosters[$battleName].Count - $resolvedEntries
    })
  }

  # Every confirmed Discord account represented by at least one battle roster
  # receives the participation divider. Unknown identities remain unresolved
  # and are never guessed.
  $participantsByDiscordId = @{}
  foreach ($assignment in @($assignments.Values)) {
    $userId = [string]$assignment.DiscordUserId
    if (-not $participantsByDiscordId.ContainsKey($userId)) {
      $participantsByDiscordId[$userId] = [pscustomobject][ordered]@{
        DiscordUsernameFromRoster = $assignment.DiscordUsernameFromRoster
        RobloxUsernames = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
      }
    }
    foreach ($robloxUsername in $assignment.RobloxUsernames) {
      [void]$participantsByDiscordId[$userId].RobloxUsernames.Add($robloxUsername)
    }
  }

  foreach ($userId in $participantsByDiscordId.Keys) {
    $participant = $participantsByDiscordId[$userId]
    $assignmentKey = "$($ParticipationRole.RoleId):$userId"
    $robloxUsernames = [Collections.Generic.List[string]]::new()
    foreach ($robloxUsername in @($participant.RobloxUsernames | Sort-Object)) {
      $robloxUsernames.Add($robloxUsername)
    }
    $assignments[$assignmentKey] = [pscustomobject][ordered]@{
      Battle = "Any listed c0ld battle"
      RoleId = $ParticipationRole.RoleId
      ExpectedRoleName = $ParticipationRole.RoleName
      DiscordUserId = $userId
      DiscordUsernameFromRoster = $participant.DiscordUsernameFromRoster
      RobloxUsernames = $robloxUsernames
    }
  }

  # Keep the original Scyth account intact. Mirror every role earned by that
  # account in this plan (including the divider) onto the additional account.
  $scythSourceAssignments = @($assignments.Values | Where-Object {
    [string]$_.DiscordUserId -eq $ScythRoleMirror.SourceDiscordUserId
  })
  if ($scythSourceAssignments.Count -eq 0) {
    throw "The roster did not resolve Scyth's source Discord account $($ScythRoleMirror.SourceDiscordUserId)."
  }
  foreach ($sourceAssignment in $scythSourceAssignments) {
    $assignmentKey = "$($sourceAssignment.RoleId):$($ScythRoleMirror.TargetDiscordUserId)"
    $robloxUsernames = [Collections.Generic.List[string]]::new()
    foreach ($robloxUsername in $sourceAssignment.RobloxUsernames) {
      $robloxUsernames.Add($robloxUsername)
    }
    $assignments[$assignmentKey] = [pscustomobject][ordered]@{
      Battle = "$($sourceAssignment.Battle) (Scyth mirror)"
      RoleId = $sourceAssignment.RoleId
      ExpectedRoleName = $sourceAssignment.ExpectedRoleName
      DiscordUserId = $ScythRoleMirror.TargetDiscordUserId
      DiscordUsernameFromRoster = $ScythRoleMirror.TargetDiscordUsername
      RobloxUsernames = $robloxUsernames
    }
  }

  return [ordered]@{
    RosterPath = $resolvedPath
    GuildId = $GuildId
    BattleSummaries = @($battleSummaries)
    Assignments = @($assignments.Values)
    Unresolved = @($unresolved)
  }
}

function Invoke-DiscordApi {
  param(
    [ValidateSet("GET", "PUT")][string]$Method,
    [string]$Path,
    [hashtable]$Headers,
    [switch]$AllowNotFound
  )

  $uri = "$DiscordApiBase$Path"
  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      return Invoke-RestMethod -Method $Method -Uri $uri -Headers $Headers
    } catch {
      $statusCode = [int]$_.Exception.Response.StatusCode
      if ($AllowNotFound -and $statusCode -eq 404) {
        return $null
      }
      if ($statusCode -ne 429 -or $attempt -eq 5) {
        $details = [string]$_.ErrorDetails.Message
        if (-not $details) { $details = $_.Exception.Message }
        throw "Discord $Method $Path failed (HTTP $statusCode): $details"
      }

      $retryAfter = 1.0
      try {
        $rateLimit = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($rateLimit.retry_after) { $retryAfter = [double]$rateLimit.retry_after }
      } catch {}
      Start-Sleep -Milliseconds ([Math]::Ceiling(($retryAfter + 0.25) * 1000))
    }
  }
}

function Write-PlanSummary {
  param($Plan)

  Write-Host "Add-only c0ld battle-role plan" -ForegroundColor Cyan
  Write-Host "Guild: $($Plan.GuildId)"
  Write-Host "Roster: $($Plan.RosterPath)"
  $Plan.BattleSummaries | Format-Table Battle, ExpectedRoleName, RosterEntries, ResolvedRosterEntries, UniqueDiscordUsers, UnresolvedRosterEntries -AutoSize
  Write-Host "Deduplicated user/role checks: $($Plan.Assignments.Count)"
  $dividerChecks = @($Plan.Assignments | Where-Object { $_.RoleId -eq $ParticipationRole.RoleId })
  $scythChecks = @($Plan.Assignments | Where-Object { $_.DiscordUserId -eq $ScythRoleMirror.TargetDiscordUserId })
  Write-Host "Confirmed participants receiving divider checks: $($dividerChecks.Count)"
  Write-Host "Scyth mirror-account role checks: $($scythChecks.Count)"
  Write-Host "Unresolved roster entries: $($Plan.Unresolved.Count)"
  if ($Plan.Unresolved.Count -gt 0) {
    $Plan.Unresolved | Format-Table Battle, RobloxUsername, Reason -AutoSize
  }
}

$plan = Read-RosterPlan -Path $RosterPath
Write-PlanSummary -Plan $plan
if ($PlanOnly) {
  exit 0
}

if ([string]::IsNullOrWhiteSpace($BotToken)) {
  $secureToken = Read-Host "Luna DISCORD_BOT_TOKEN" -AsSecureString
  $BotToken = ConvertFrom-SecureToken -SecureToken $secureToken
}
$BotToken = $BotToken.Trim()
if ([string]::IsNullOrWhiteSpace($BotToken)) {
  throw "Luna DISCORD_BOT_TOKEN is required for the live Discord audit."
}

$headers = @{
  Authorization = "Bot $BotToken"
  "User-Agent" = "DiscordBot (https://c0ld.ps99.bot, 1.0)"
}
$guild = Invoke-DiscordApi -Method GET -Path "/guilds/$GuildId" -Headers $headers
if ([string]$guild.id -ne $GuildId) {
  throw "Discord returned an unexpected guild. No role changes were attempted."
}
Write-Host "Connected to guild '$($guild.name)' ($GuildId)." -ForegroundColor Green

$guildRolesResponse = Invoke-DiscordApi -Method GET -Path "/guilds/$GuildId/roles" -Headers $headers
# Invoke-RestMethod intentionally preserves a top-level JSON array as one
# pipeline object. Explicitly send it through the pipeline here so each Discord
# role becomes an individual object before we build the ID lookup.
$guildRoles = @($guildRolesResponse | ForEach-Object { $_ })
$rolesById = @{}
foreach ($role in $guildRoles) {
  $roleId = [string]$role.id
  if ($roleId -match '^\d{17,20}$') {
    $rolesById[$roleId] = $role
  }
}
Write-Host "Discord returned $($rolesById.Count) guild roles." -ForegroundColor Cyan
$requiredRoles = @($BattleRoles.Values) + @($ParticipationRole)
foreach ($roleConfig in $requiredRoles) {
  if (-not $rolesById.ContainsKey($roleConfig.RoleId)) {
    throw "Discord's guild-role response did not contain role $($roleConfig.RoleId) ($($roleConfig.RoleName)). Parsed $($rolesById.Count) role IDs. No role changes were attempted."
  }
  Write-Host "Verified role: $($rolesById[$roleConfig.RoleId].name) [$($roleConfig.RoleId)]"
}

$memberCache = @{}
$notInGuild = [Collections.Generic.List[object]]::new()
$alreadyAssigned = [Collections.Generic.List[object]]::new()
$missingRoles = [Collections.Generic.List[object]]::new()

foreach ($assignment in $plan.Assignments) {
  $userId = [string]$assignment.DiscordUserId
  if (-not $memberCache.ContainsKey($userId)) {
    $memberCache[$userId] = Invoke-DiscordApi -Method GET -Path "/guilds/$GuildId/members/$userId" -Headers $headers -AllowNotFound
  }
  $member = $memberCache[$userId]
  if ($null -eq $member) {
    $notInGuild.Add($assignment)
    continue
  }

  if (@($member.roles) -contains $assignment.RoleId) {
    $alreadyAssigned.Add($assignment)
  } else {
    $missingRoles.Add($assignment)
  }
}

Write-Host "Live audit complete: $($alreadyAssigned.Count) already assigned; $($missingRoles.Count) missing; $($notInGuild.Count) mapped users not in guild." -ForegroundColor Cyan
if (-not $Apply) {
  Write-Host "Audit-only mode: no roles were changed. Re-run with -Apply to add only the missing roles." -ForegroundColor Yellow
}

$added = [Collections.Generic.List[object]]::new()
$failed = [Collections.Generic.List[object]]::new()
if ($Apply) {
  $auditReason = [uri]::EscapeDataString("Approved c0ld clan-battle participation roster verification (add-only)")
  $writeHeaders = @{}
  foreach ($key in $headers.Keys) { $writeHeaders[$key] = $headers[$key] }
  $writeHeaders["X-Audit-Log-Reason"] = $auditReason

  foreach ($assignment in $missingRoles) {
    try {
      Invoke-DiscordApi -Method PUT -Path "/guilds/$GuildId/members/$($assignment.DiscordUserId)/roles/$($assignment.RoleId)" -Headers $writeHeaders | Out-Null
      $verifiedMember = Invoke-DiscordApi -Method GET -Path "/guilds/$GuildId/members/$($assignment.DiscordUserId)" -Headers $headers
      if (@($verifiedMember.roles) -notcontains $assignment.RoleId) {
        throw "Discord accepted the request but the role was absent during read-back verification."
      }
      $added.Add($assignment)
      $memberCache[[string]$assignment.DiscordUserId] = $verifiedMember
      Write-Host "Added $($rolesById[$assignment.RoleId].name) to user $($assignment.DiscordUserId)." -ForegroundColor Green
    } catch {
      $failed.Add([pscustomobject][ordered]@{ Assignment = $assignment; Error = $_.Exception.Message })
      Write-Warning "Failed to add role $($assignment.RoleId) to user $($assignment.DiscordUserId): $($_.Exception.Message)"
    }
  }
}

$report = [ordered]@{
  GeneratedAt = [DateTimeOffset]::UtcNow.ToString("o")
  Mode = if ($Apply) { "apply_add_only" } else { "audit_only" }
  Guild = [ordered]@{ Id = $GuildId; Name = [string]$guild.name }
  RosterPath = $plan.RosterPath
  BattleSummaries = $plan.BattleSummaries
  Counts = [ordered]@{
    DeduplicatedChecks = $plan.Assignments.Count
    AlreadyAssigned = $alreadyAssigned.Count
    MissingBeforeApply = $missingRoles.Count
    AddedAndVerified = $added.Count
    FailedAdds = $failed.Count
    MappedUsersNotInGuild = $notInGuild.Count
    UnresolvedRosterEntries = $plan.Unresolved.Count
  }
  AlreadyAssigned = @($alreadyAssigned)
  MissingBeforeApply = @($missingRoles)
  AddedAndVerified = @($added)
  FailedAdds = @($failed)
  MappedUsersNotInGuild = @($notInGuild)
  UnresolvedRosterEntries = $plan.Unresolved
}

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
  $stamp = [DateTimeOffset]::Now.ToString("yyyyMMdd-HHmmss")
  $ReportPath = Join-Path (Split-Path -Parent $PSScriptRoot) "Data\c0ld-battle-role-audit-$stamp.json"
}
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReportPath -Encoding utf8
Write-Host "Audit report: $((Resolve-Path -LiteralPath $ReportPath).Path)" -ForegroundColor Cyan

if ($failed.Count -gt 0) {
  throw "$($failed.Count) add-only role assignment(s) failed. Review the audit report."
}

if ($Apply) {
  Write-Host "Completed: $($added.Count) missing roles added and verified; no roles removed." -ForegroundColor Green
}
