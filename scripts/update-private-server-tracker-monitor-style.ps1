param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

$workerPath = Join-Path $RepoRoot "cloudflare\c0ld-servers-worker.js"
if (-not (Test-Path $workerPath)) {
  throw "Worker not found: $workerPath"
}

$source = Get-Content -Raw -LiteralPath $workerPath

$replacement = @'
function buildTrackerDiscordPayload(state) {
  const guild = state.guild || {};
  const rows = state.servers.map(server => serializeTrackedServer(server));
  const timestamp = guild.last_refresh_at || new Date().toISOString();
  const unix = Math.floor(new Date(timestamp).getTime() / 1000);
  const refreshMinutes = Number(guild.refresh_minutes || DEFAULT_TRACKER_REFRESH_MINUTES);
  const trackingEnabled = Boolean(guild.tracking_enabled);

  const serverBlocks = rows.map(row => {
    const counts = row.clan_counts || {};
    const statusIcon = trackerMonitorStatusIcon(row.status);
    const statusLabel = trackerMonitorStatusLabel(row.status);
    const population = trackerMonitorPopulation(row);
    const staleLine = row.stale && row.status !== "pending"
      ? `\n-# Last successful observation: ${trackerDiscordTimestamp(row.last_known_at || row.observed_at)}`
      : "";
    const clanLine = row.status === "pending"
      ? ""
      : `\n**Clans:** C0LD ${Number(counts.C0LD || 0)} · WMSY ${Number(counts.WMSY || 0)} · Other ${Number(counts.other || 0)}`;
    const latencyLine = row.status === "pending" || row.status === "offline"
      ? ""
      : `\n**Ping:** ${trackerMonitorMetric(row.ping, "ms")} · **FPS:** ${trackerMonitorMetric(row.fps, "")}`;
    const nameLine = row.server_name
      ? `\n-# ${trackerEscapeDiscord(row.server_name)}`
      : "";
    const joinLine = row.server_link
      ? `\n[Join Server](${row.server_link})`
      : "";
    const errorLine = row.status === "pending" && row.collection_error
      ? `\n-# ${trackerEscapeDiscord(row.collection_error)}`
      : "";

    return [
      `### ${statusIcon} ${row.label} · ${statusLabel}`,
      `**Players:** ${population}${nameLine}${clanLine}${latencyLine}${staleLine}${errorLine}${joinLine}`
    ].join("\n");
  });

  const serverSection = !trackingEnabled
    ? "Tracking is disabled for this Discord server."
    : serverBlocks.length
      ? serverBlocks.join("\n\n")
      : "No private servers are currently tracked. Use `/server add` to add one.";

  const summary = trackerMonitorSummary(rows);
  const healthLine = guild.last_error
    ? `\n-# ⚠️ Latest refresh issue: ${trackerEscapeDiscord(guild.last_error)}`
    : "";

  return {
    flags: TRACKER_DISCORD_COMPONENTS_V2_FLAG,
    allowed_mentions: { parse: [] },
    components: [{
      type: 17,
      accent_color: TRACKER_DISCORD_COLOR,
      components: [
        {
          type: 9,
          components: [{
            type: 10,
            content: [
              "## 🖥️ Private Server Monitor",
              `${trackingEnabled ? "🟢" : "🔴"} **Tracking ${trackingEnabled ? "Enabled" : "Disabled"}**`,
              `Last Updated: <t:${unix}:R>`,
              trackingEnabled ? `Refreshes every ${refreshMinutes} minutes` : "Automatic refresh is disabled",
              healthLine
            ].filter(Boolean).join("\n")
          }],
          accessory: {
            type: 11,
            media: { url: TRACKER_DISCORD_THUMBNAIL_URL },
            description: "PS99 Genie Fox"
          }
        },
        trackerDiscordSeparator(),
        {
          type: 10,
          content: [
            "## Summary",
            `**Online:** ${summary.online} · **Full:** ${summary.full} · **Offline:** ${summary.offline}`,
            `**Pending:** ${summary.pending} · **Unavailable:** ${summary.unavailable}`,
            `**Players:** ${summary.players}/${summary.capacity}`
          ].join("\n")
        },
        trackerDiscordSeparator(),
        {
          type: 10,
          content: `## Private Servers\n${serverSection}`.slice(0, 4000)
        },
        trackerDiscordSeparator(),
        {
          type: 10,
          content: `-# **${TRACKER_DISCORD_FOOTER_TEXT} <t:${unix}:f>**`
        }
      ]
    }]
  };
}

function trackerMonitorStatusIcon(status) {
  if (status === "pending") return "🟡";
  if (status === "online") return "🟢";
  if (status === "full") return "🟣";
  if (status === "offline") return "🔴";
  return "🟠";
}

function trackerMonitorStatusLabel(status) {
  if (status === "pending") return "Awaiting Observer Access";
  if (status === "online") return "Online";
  if (status === "full") return "Full";
  if (status === "offline") return "Offline";
  return "Unavailable";
}

function trackerMonitorPopulation(row) {
  if (row.status === "pending") return "Awaiting observer access";
  const playing = Number(row.playing);
  const maxPlayers = Number(row.max_players);
  if (!Number.isFinite(playing)) return "Unknown";
  return `${playing}/${Number.isFinite(maxPlayers) && maxPlayers > 0 ? maxPlayers : "?"}`;
}

function trackerMonitorMetric(value, suffix) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Unknown";
  const rounded = Math.round(number * 10) / 10;
  return `${rounded}${suffix}`;
}

function trackerDiscordTimestamp(value) {
  const ms = Date.parse(value || "");
  if (!Number.isFinite(ms)) return "Unknown";
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

function trackerEscapeDiscord(value) {
  return String(value || "").replace(/([\\`*_{}\[\]()<>#+\-.!|~>])/g, "\\$1").slice(0, 500);
}

function trackerMonitorSummary(rows) {
  const summary = {
    online: 0,
    full: 0,
    offline: 0,
    pending: 0,
    unavailable: 0,
    players: 0,
    capacity: 0
  };

  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(summary, row.status)) {
      summary[row.status] += 1;
    } else {
      summary.unavailable += 1;
    }

    const playing = Number(row.playing);
    const maxPlayers = Number(row.max_players);
    if (Number.isFinite(playing)) summary.players += Math.max(0, playing);
    if (Number.isFinite(maxPlayers)) summary.capacity += Math.max(0, maxPlayers);
  }

  return summary;
}
'@

$pattern = '(?s)function buildTrackerDiscordPayload\(state\) \{.*?\n\}\n\nfunction trackerDiscordSeparator\(\) \{'
if (-not [regex]::IsMatch($source, $pattern)) {
  throw "Could not locate buildTrackerDiscordPayload(state) followed by trackerDiscordSeparator(). The worker structure may have changed."
}

$updated = [regex]::Replace(
  $source,
  $pattern,
  ($replacement + "`r`n`r`nfunction trackerDiscordSeparator() {")
)

if ($updated -eq $source) {
  throw "No changes were made."
}

if ($WhatIf) {
  Write-Host "WhatIf: would update $workerPath"
  exit 0
}

$backupPath = "$workerPath.bak"
Copy-Item -LiteralPath $workerPath -Destination $backupPath -Force
Set-Content -LiteralPath $workerPath -Value $updated -Encoding UTF8

Write-Host "Updated: $workerPath"
Write-Host "Backup:  $backupPath"
Write-Host "Next: deploy c0ld-servers-worker using your normal Wrangler workflow."
