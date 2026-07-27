const DEFAULT_CLAN_NAME = "WMSY";
const DEFAULT_RUNS_TABLE = "wmsy_hourly_runs";
const DEFAULT_MEMBERS_TABLE = "wmsy_hourly_members";
const ROBLOX_BATCH_SIZE = 100;
const ROBLOX_LOOKUP_RETRIES = 4;

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = (url.pathname || "/").replace(/\/+$/, "") || "/";
      const mode = String(url.searchParams.get("mode") || "").trim().toLowerCase();

      if (path === "/post" || mode === "post-image") {
        const result = await generateAndPostWmsyBoard(env);
        return json({ ok: true, mode: "post-image", ...result }, 200, corsHeaders);
      }

      if (path === "/image" || mode === "image") {
        const board = await buildWmsyBoardData(env);
        const html = buildWmsyBoardHtml(board);
        const pngBytes = await renderHtmlToPng({
          accountId: String(env.CF_ACCOUNT_ID || "").trim(),
          apiToken: String(env.CF_API_TOKEN || "").trim(),
          html
        });

        return new Response(pngBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png"
          }
        });
      }

      if (path === "/debug" || mode === "debug" || mode === "json") {
        const board = await buildWmsyBoardData(env);
        return json({ ok: true, board }, 200, corsHeaders);
      }

      const board = await buildWmsyBoardData(env);
      const html = buildWmsyBoardHtml(board);

      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    } catch (err) {
      return json(
        {
          ok: false,
          error: err?.message || String(err)
        },
        500,
        corsHeaders
      );
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(generateAndPostWmsyBoard(env));
  }
};

async function generateAndPostWmsyBoard(env) {
  const webhookUrl = String(env.DISCORD_WEBHOOK_URL || "").trim();
  const accountId = String(env.CF_ACCOUNT_ID || "").trim();
  const apiToken = String(env.CF_API_TOKEN || "").trim();

  if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL.");
  if (!accountId) throw new Error("Missing CF_ACCOUNT_ID.");
  if (!apiToken) throw new Error("Missing CF_API_TOKEN.");

  const board = await buildWmsyBoardData(env);
  const runId = await createHourlyRunInSupabase(env, board);

  const html = buildWmsyBoardHtml(board);
  const pngBytes = await renderHtmlToPng({
    accountId,
    apiToken,
    html
  });

  const discordResult = await postDiscordWebhookFile(webhookUrl, pngBytes, {
    filename: `${slugify(board?.clan?.name || configuredClanName(env))}-hourly-${Date.now()}.png`
  });

  await updateHourlyRunDiscordMeta(env, runId, {
    messageId: discordResult?.id || null,
    channelId: discordResult?.channel_id || null
  });

  return {
    posted: true,
    supabase_run_id: runId,
    discord_message_id: discordResult?.id || null,
    discord_channel_id: discordResult?.channel_id || null,
    board
  };
}

async function buildWmsyBoardData(env) {
  const configuredClan = configuredClanName(env);
  const activeBattleResp = await fetchJson("https://ps99.biggamesapi.io/api/activeClanBattle");
  const clanResp = await fetchJson(`https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(configuredClan)}`);

  const activeBattle = activeBattleResp?.data || {};
  const clan = clanResp?.data || null;

  if (!clan) {
    throw new Error(`Clan "${configuredClan}" was not found.`);
  }

  const battleInfo = getSpecificBattleData(clan, activeBattle);
  const rankInfo = await findClanRank(clan.Name || configuredClan);

  const previousSnapshot = await getPreviousHourlySnapshotFromSupabase(env, {
    clanName: clan.Name || configuredClan,
    battleName: activeBattle?.configName || "Unknown"
  });

  const userIds = collectClanUserIds(clan);
  const [userMap, avatarMap] = await Promise.all([
    fetchRobloxUsersByIds(userIds),
    fetchRobloxAvatars(userIds)
  ]);

  const members = buildHourlyMemberRows({
    clan,
    battleInfo,
    userMap,
    avatarMap,
    previousSnapshot
  });

  const hourlyPoints = members.reduce((sum, row) => sum + Number(row.hourly_gain || 0), 0);
  const activeCount = members.filter((row) => Number(row.hourly_gain || 0) > 0).length;
  const zeroCount = members.length - activeCount;

  return {
    clan: {
      name: clan.Name || configuredClan,
      icon: String(clan.Icon || ""),
      icon_url: buildClanIconUrl(clan.Icon) || String(env.CLAN_ICON_URL || env.WMSY_ICON_URL || "").trim() || null,
      owner: numberOrNull(clan.Owner),
      guildLevel: numberOrNull(clan.GuildLevel),
      countryCode: clan.CountryCode || ""
    },
    activeBattle: {
      id: activeBattle?._id || null,
      configName: activeBattle?.configName || "Unknown",
      category: activeBattle?.category || null
    },
    rank: {
      rank: rankInfo?.rank || null,
      points: rankInfo?.points || null
    },
    summary: {
      players: members.length,
      active: activeCount,
      zero: zeroCount,
      hourlyPoints,
      usernameLookupMisses: members.filter(row => row.used_id_fallback).length,
      previousUsernameFallbacks: members.filter(row => row.used_previous_username).length
    },
    members,
    previous_run_id: previousSnapshot?.runId || null,
    pulledAt: new Date().toISOString()
  };
}

function buildHourlyMemberRows({ clan, battleInfo, userMap, avatarMap, previousSnapshot }) {
  const members = collectClanMembersWithOwner(clan);
  const ownerId = Number(clan?.Owner || 0);
  const previousMap = previousSnapshot?.byUser || new Map();
  const hasBaseline = previousMap.size > 0;

  const rows = members.map((member) => {
    const userId = Number(member?.UserID || 0);
    const userKey = String(userId || "");
    const currentPoints = Number(battleInfo?.pointMap?.[String(userId)] || 0);
    const previousUser = previousMap.get(userKey) || null;
    const previousPoints = Number(previousUser?.current_points || 0);
    const hourlyGain = hasBaseline ? Math.max(0, currentPoints - previousPoints) : 0;

    const resolvedUser = userMap.get(userKey);
    const previousUsername = cleanUsername(previousUser?.username || "");
    const previousDisplayName = cleanUsername(previousUser?.display_name || previousUsername);
    const hasPreviousUsername = previousUsername && previousUsername !== userKey;
    const usedPreviousUsername = !resolvedUser && hasPreviousUsername;
    const usedIdFallback = !resolvedUser && !hasPreviousUsername;

    const userInfo = resolvedUser || {
      username: hasPreviousUsername ? previousUsername : userKey,
      displayName: hasPreviousUsername ? previousDisplayName : userKey
    };

    const joinDate = member?.JoinTime
      ? new Date(Number(member.JoinTime) * 1000)
      : null;

    return {
      member_rank: null,
      user_id: userId || null,
      username: userInfo.username || String(userId || ""),
      display_name: userInfo.displayName || userInfo.username || String(userId || ""),
      avatar_url: avatarMap.get(userKey) || previousUser?.avatar_url || null,
      role: mapClanRole(member?.PermissionLevel, ownerId, userId),
      join_date: joinDate && !Number.isNaN(joinDate.getTime()) ? joinDate.toISOString() : null,
      current_points: currentPoints,
      hourly_gain: hourlyGain,
      used_previous_username: usedPreviousUsername,
      used_id_fallback: usedIdFallback
    };
  });

  rows.sort((a, b) => {
    const gainDiff = Number(b.hourly_gain || 0) - Number(a.hourly_gain || 0);
    if (gainDiff !== 0) return gainDiff;

    const currentDiff = Number(b.current_points || 0) - Number(a.current_points || 0);
    if (currentDiff !== 0) return currentDiff;

    return String(a.username || "").localeCompare(String(b.username || ""));
  });

  rows.forEach((row, index) => {
    row.member_rank = index + 1;
  });

  return rows;
}

function buildWmsyBoardHtml(board) {
  const clanName = escapeHtml(board?.clan?.name || DEFAULT_CLAN_NAME);
  const clanTag = escapeHtml(`[${board?.clan?.name || DEFAULT_CLAN_NAME}]`);
  const clanIcon = escapeHtml(board?.clan?.icon_url || "");
  const clanRank = board?.rank?.rank ? `#${board.rank.rank}` : "—";
  const hourlyPoints = formatCompactLower(board?.summary?.hourlyPoints || 0);
  const players = String(board?.summary?.players || 0);
  const active = String(board?.summary?.active || 0);
  const zero = String(board?.summary?.zero || 0);
  const updatedText = formatDateTime(board?.pulledAt || new Date().toISOString());
  const maxGain = Math.max(...(board?.members || []).map((m) => Number(m.hourly_gain || 0)), 1);

  const col1 = (board?.members || []).slice(0, 25);
  const col2 = (board?.members || []).slice(25, 50);
  const col3 = (board?.members || []).slice(50, 75);

  const renderColumn = (rows) => {
    return rows.map((row) => {
      const rank = String(row.member_rank || "").padStart(2, "0");
      const gain = Number(row.hourly_gain || 0);
      const gainLabel = gain > 0 ? formatCompactLower(gain) : "0";
      const pct = gain > 0 ? Math.max(6, Math.min(100, (gain / maxGain) * 100)) : 0;
      const rowTone = gain > 0 ? wmsyScoreColor(gain, maxGain) : "#8a95ad";

      return `
        <div class="member-row ${gain > 0 ? "active-row" : "zero-row"}" style="--row-tone:${rowTone};--row-bar-width:${pct}%">
          <div class="member-rank">${rank}</div>

          <div class="member-name ${gain > 0 ? "active-name" : "zero-name"}" title="${escapeHtml(row.username || "")}">
            ${escapeHtml(row.username || "")}
          </div>

          <div class="member-bar">
            <div class="bar-track">
              <div class="bar-fill ${gain > 0 ? "bar-active" : "bar-zero"}"></div>
            </div>
          </div>

          <div class="member-gain ${gain > 0 ? "gain-active" : "gain-zero"}">${escapeHtml(gainLabel)}</div>
        </div>
      `;
    }).join("");
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${clanName} Hourly Board</title>
  <style>
    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 1600px;
      height: 900px;
      font-family: Arial, Helvetica, sans-serif;
      color: #fff;
      background:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(180deg, #07090d 0%, #05070b 55%, #04060a 100%);
      background-size: 40px 40px, 40px 40px, 100% 100%;
      overflow: hidden;
    }

    .wrap {
      width: 1600px;
      height: 900px;
      padding: 24px 32px;
    }

    .board {
      width: 100%;
      height: 100%;
      border-radius: 30px;
      padding: 20px 22px 16px;
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(110, 128, 168, 0.24);
      background:
        radial-gradient(circle at top center, rgba(34, 44, 70, 0.18), transparent 38%),
        linear-gradient(180deg, rgba(16, 19, 28, 0.985), rgba(10, 13, 20, 0.99));
      box-shadow: 0 18px 60px rgba(0,0,0,0.35);
      overflow: hidden;
    }

    .rainbow {
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        #6a7dff 0%,
        #42c6ff 18%,
        #54db7a 36%,
        #f0d44d 56%,
        #ff9f1c 76%,
        #ff4d6d 100%
      );
      margin-bottom: 18px;
      flex: 0 0 auto;
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 22px;
      margin-bottom: 16px;
      min-height: 128px;
      flex: 0 0 auto;
    }

    .top-left {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    .icon-wrap {
      width: 122px;
      height: 122px;
      border-radius: 50%;
      padding: 5px;
      background: linear-gradient(180deg, #7ec850, #f9bb28, #f65d44);
      box-shadow: 0 0 0 4px rgba(126, 200, 80, 0.14);
      flex: 0 0 auto;
    }

    .icon-wrap img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      background: rgba(255,255,255,0.08);
    }

    .clan-area {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .tag {
      font-size: 56px;
      font-weight: 900;
      letter-spacing: 0.5px;
      background: linear-gradient(90deg, #44d1ff, #54db7a 35%, #f59f1b 70%, #ff5e58 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1;
      white-space: nowrap;
    }

    .stat-chip {
      min-width: 140px;
      padding: 11px 16px;
      border-radius: 18px;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.10);
    }

    .stat-chip.rank {
      border-color: rgba(246, 190, 66, 0.42);
    }

    .stat-chip.hourly {
      border-color: rgba(80, 178, 255, 0.42);
    }

    .stat-label {
      font-size: 16px;
      color: rgba(255,255,255,0.70);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 900;
      color: #ffd44d;
      line-height: 1.1;
    }

    .stat-chip.hourly .stat-value {
      color: #64c7ff;
    }

    .top-right {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex: 0 0 auto;
    }

    .summary-box {
      width: 154px;
      padding: 14px 16px;
      border-radius: 22px;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.12);
      position: relative;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
    }

    .summary-box.players { border-color: rgba(106,125,255,0.52); }
    .summary-box.active { border-color: rgba(84,219,122,0.42); }
    .summary-box.zero { border-color: rgba(255,77,109,0.42); }

    .summary-label {
      font-size: 17px;
      color: rgba(255,255,255,0.72);
      margin-bottom: 6px;
    }

    .summary-value {
      font-size: 54px;
      font-weight: 900;
      line-height: 1;
      color: #fff;
    }

    .summary-pill {
      position: absolute;
      right: 14px;
      top: 22px;
      width: 14px;
      height: 44px;
      border-radius: 999px;
      background: #6a7dff;
    }

    .summary-box.active .summary-pill { background: #52d273; }
    .summary-box.zero .summary-pill { background: #ff5a5a; }

    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      flex: 1 1 auto;
      min-height: 0;
      padding-bottom: 20px;
    }

    .column {
      height: 100%;
      min-height: 0;
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(19, 23, 33, 0.88), rgba(11, 14, 22, 0.92));
      border: 1px solid rgba(120, 138, 178, 0.20);
      padding: 12px 14px 10px;
      overflow: hidden;
    }

    .member-row {
      display: grid;
      grid-template-columns: 46px 1fr 78px 64px;
      gap: 10px;
      align-items: center;
      height: 22px;
      margin-bottom: 1px;
      border-radius: 9px;
      padding: 0 8px;
    }

    .member-row:nth-child(odd) {
      background: rgba(255,255,255,0.03);
    }

    .member-rank {
      font-size: 16px;
      font-weight: 900;
      text-align: left;
      color: var(--row-tone, #9ba7c3);
    }

    .member-name {
      font-size: 16px;
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .active-name { color: #e6edf9; }
    .zero-name { color: #8a95ad; }

    .member-bar {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bar-track {
      width: 74px;
      height: 9px;
      background: rgba(255,255,255,0.10);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      width: var(--row-bar-width, 0%);
      border-radius: 999px;
    }

    .bar-active { background: var(--row-tone, #52d273); }
    .bar-zero { background: #4b556e; }

    .member-gain {
      font-size: 16px;
      font-weight: 900;
      text-align: right;
    }

    .gain-active { color: var(--row-tone, #52d273); }
    .gain-zero { color: #9ba7c3; }

    .updated-footer {
      position: absolute;
      right: 22px;
      bottom: 12px;
      font-size: 13px;
      color: rgba(255,255,255,0.38);
      font-weight: 500;
      letter-spacing: 0.2px;
      text-align: right;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="board">
      <div class="rainbow"></div>

      <div class="top">
        <div class="top-left">
          <div class="icon-wrap">
            <img src="${clanIcon}" alt="">
          </div>

          <div class="clan-area">
            <div class="tag">${clanTag}</div>

            <div class="stat-chip rank">
              <div class="stat-label">Clan Rank</div>
              <div class="stat-value">${escapeHtml(clanRank)}</div>
            </div>

            <div class="stat-chip hourly">
              <div class="stat-label">Hourly Points</div>
              <div class="stat-value">${escapeHtml(hourlyPoints)}</div>
            </div>
          </div>
        </div>

        <div class="top-right">
          <div class="summary-box players">
            <div class="summary-label">Players</div>
            <div class="summary-value">${escapeHtml(players)}</div>
            <div class="summary-pill"></div>
          </div>

          <div class="summary-box active">
            <div class="summary-label">Active</div>
            <div class="summary-value">${escapeHtml(active)}</div>
            <div class="summary-pill"></div>
          </div>

          <div class="summary-box zero">
            <div class="summary-label">Zero</div>
            <div class="summary-value">${escapeHtml(zero)}</div>
            <div class="summary-pill"></div>
          </div>
        </div>
      </div>

      <div class="columns">
        <div class="column">${renderColumn(col1)}</div>
        <div class="column">${renderColumn(col2)}</div>
        <div class="column">${renderColumn(col3)}</div>
      </div>

      <div class="updated-footer">Updated ${escapeHtml(updatedText)}</div>
    </div>
  </div>
</body>
</html>`;
}

function wmsyScoreColor(value, maxValue) {
  const score = Number(value) || 0;
  const max = Math.max(1, Number(maxValue) || 0);
  if (score <= 0) return "#8a95ad";

  const fraction = clamp01(Math.pow(score / max, 1.35));
  return mixColorStops(fraction, [
    "#ff4d5d",
    "#f28b2f",
    "#f4d957",
    "#52d273"
  ]);
}

function mixColorStops(fraction, stops) {
  const t = clamp01(fraction);
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  return mixHexColor(stops[index], stops[index + 1], scaled - index);
}

function mixHexColor(left, right, fraction) {
  const a = hexToRgb(left);
  const b = hexToRgb(right);
  const t = clamp01(fraction);
  const rgb = a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(value) {
  const hex = String(value || "").replace(/^#/, "");
  return [
    Number.parseInt(hex.slice(0, 2), 16) || 0,
    Number.parseInt(hex.slice(2, 4), 16) || 0,
    Number.parseInt(hex.slice(4, 6), 16) || 0
  ];
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

async function renderHtmlToPng({ accountId, apiToken, html }) {
  if (!accountId) throw new Error("Missing CF_ACCOUNT_ID.");
  if (!apiToken) throw new Error("Missing CF_API_TOKEN.");

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        html,
        screenshotOptions: {
          fullPage: true
        },
        viewport: {
          width: 1600,
          height: 900
        }
      })
    });

    if (response.ok) {
      return await response.arrayBuffer();
    }

    const text = await response.text();
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfterSeconds = Number(retryAfterHeader || 0);

    const isRetryable429 = response.status === 429;
    const isBusy500 = response.status === 500 && text.includes("Browser is too busy");

    if ((isRetryable429 || isBusy500) && attempt < maxAttempts) {
      const delayMs = retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : attempt * 4000;

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    throw new Error(`Cloudflare screenshot failed (${response.status}): ${text}`);
  }

  throw new Error("Cloudflare screenshot failed after multiple retry attempts.");
}

async function postDiscordWebhookFile(webhookUrl, pngBytes, { filename, content = "" }) {
  const separator = webhookUrl.includes("?") ? "&" : "?";
  const url = `${webhookUrl}${separator}wait=true`;

  const payload = {
    allowed_mentions: { parse: [] }
  };

  if (content && String(content).trim()) {
    payload.content = String(content);
  }

  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));
  form.append("files[0]", new Blob([pngBytes], { type: "image/png" }), filename);

  const res = await fetch(url, {
    method: "POST",
    body: form
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Discord image webhook failed (${res.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function createHourlyRunInSupabase(env, board) {
  const supabaseUrl = String(env.SUPABASE_URL || env.SUPA_URL || "").trim();
  const serviceKey = String(env.SUPABASE_SERVICE_KEY || "").trim();
  const runsTable = runsTableName(env);
  const membersTable = membersTableName(env);

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL/SUPA_URL or SUPABASE_SERVICE_KEY.");
  }

  const runInsert = {
    clan_name: board?.clan?.name || configuredClanName(env),
    battle_name: board?.activeBattle?.configName || "Unknown",
    clan_rank: numberOrNull(board?.rank?.rank),
    generated_at: board?.pulledAt || new Date().toISOString(),
    hourly_points: Number(board?.summary?.hourlyPoints || 0),
    player_count: Number(board?.summary?.players || 0),
    active_count: Number(board?.summary?.active || 0),
    zero_count: Number(board?.summary?.zero || 0)
  };

  const runResp = await fetch(`${supabaseUrl}/rest/v1/${runsTable}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(runInsert)
  });

  if (!runResp.ok) {
    throw new Error(`Supabase ${runsTable} insert failed (${runResp.status}): ${await runResp.text()}`);
  }

  const runRows = await runResp.json();
  const runId = runRows?.[0]?.id;

  if (!runId) {
    throw new Error("Supabase did not return a run id.");
  }

  const memberRows = (board?.members || []).map((row) => ({
    run_id: runId,
    member_rank: Number(row.member_rank || 0),
    user_id: Number(row.user_id || 0),
    username: row.username || "",
    display_name: row.display_name || row.username || "",
    avatar_url: row.avatar_url || null,
    role: row.role || "",
    join_date: row.join_date || null,
    current_points: Number(row.current_points || 0),
    hourly_gain: Number(row.hourly_gain || 0)
  }));

  const memberResp = await fetch(`${supabaseUrl}/rest/v1/${membersTable}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`
    },
    body: JSON.stringify(memberRows)
  });

  if (!memberResp.ok) {
    await tryDeleteSupabaseRun(supabaseUrl, serviceKey, runId, runsTable);
    throw new Error(`Supabase ${membersTable} insert failed (${memberResp.status}): ${await memberResp.text()}`);
  }

  return runId;
}

async function getPreviousHourlySnapshotFromSupabase(env, { clanName, battleName }) {
  const supabaseUrl = String(env.SUPABASE_URL || env.SUPA_URL || "").trim();
  const serviceKey = String(env.SUPABASE_SERVICE_KEY || "").trim();
  const runsTable = runsTableName(env);
  const membersTable = membersTableName(env);

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  const runUrl = new URL(`${supabaseUrl}/rest/v1/${runsTable}`);
  runUrl.searchParams.set("select", "id,generated_at");
  runUrl.searchParams.set("clan_name", `eq.${clanName}`);
  runUrl.searchParams.set("battle_name", `eq.${battleName}`);
  runUrl.searchParams.set("order", "generated_at.desc");
  runUrl.searchParams.set("limit", "1");

  const runResp = await fetch(runUrl.toString(), {
    method: "GET",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Accept": "application/json"
    }
  });

  if (!runResp.ok) {
    throw new Error(`Supabase ${runsTable} lookup failed (${runResp.status}): ${await runResp.text()}`);
  }

  const runs = await runResp.json();
  const run = runs?.[0];

  if (!run?.id) {
    return null;
  }

  const membersUrl = new URL(`${supabaseUrl}/rest/v1/${membersTable}`);
  membersUrl.searchParams.set("select", "user_id,current_points,username,display_name,avatar_url");
  membersUrl.searchParams.set("run_id", `eq.${run.id}`);
  membersUrl.searchParams.set("order", "member_rank.asc");

  const membersResp = await fetch(membersUrl.toString(), {
    method: "GET",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Accept": "application/json"
    }
  });

  if (!membersResp.ok) {
    throw new Error(`Supabase ${membersTable} lookup failed (${membersResp.status}): ${await membersResp.text()}`);
  }

  const rows = await membersResp.json();
  const byUser = new Map();

  for (const row of rows || []) {
    byUser.set(String(row.user_id || ""), {
      current_points: Number(row.current_points || 0),
      username: cleanUsername(row.username || ""),
      display_name: cleanUsername(row.display_name || row.username || ""),
      avatar_url: String(row.avatar_url || "").trim() || null
    });
  }

  return {
    runId: run.id,
    generatedAt: run.generated_at || null,
    byUser
  };
}

async function updateHourlyRunDiscordMeta(env, runId, { messageId = null, channelId = null } = {}) {
  const supabaseUrl = String(env.SUPABASE_URL || env.SUPA_URL || "").trim();
  const serviceKey = String(env.SUPABASE_SERVICE_KEY || "").trim();
  const runsTable = runsTableName(env);

  if (!supabaseUrl || !serviceKey || !runId) {
    return;
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/${runsTable}?id=eq.${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      image_message_id: messageId,
      image_channel_id: channelId
    })
  });

  if (!resp.ok) {
    throw new Error(`Supabase ${runsTable} update failed (${resp.status}): ${await resp.text()}`);
  }
}

async function tryDeleteSupabaseRun(supabaseUrl, serviceKey, runId, table = DEFAULT_RUNS_TABLE) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${runId}`, {
      method: "DELETE",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`
      }
    });
  } catch {}
}

function configuredClanName(env) {
  return String(env.CLAN_NAME || DEFAULT_CLAN_NAME).trim() || DEFAULT_CLAN_NAME;
}

function runsTableName(env) {
  return String(env.RUNS_TABLE || DEFAULT_RUNS_TABLE).trim() || DEFAULT_RUNS_TABLE;
}

function membersTableName(env) {
  return String(env.MEMBERS_TABLE || DEFAULT_MEMBERS_TABLE).trim() || DEFAULT_MEMBERS_TABLE;
}

function slugify(value) {
  return String(value || DEFAULT_CLAN_NAME)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "clan";
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function fetchJson(url) {
  const res = await fetchWithRetry(url, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  }, { label: url });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}) for ${url}: ${text}`);
  }

  return await res.json();
}

async function fetchWithRetry(url, options = {}, { attempts = 4, baseDelayMs = 700, label = url } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.ok || !isRetryableStatus(res.status) || attempt === attempts) {
        return res;
      }

      await delay(retryDelayMs(res, attempt, baseDelayMs));
    } catch (err) {
      lastError = err;

      if (attempt === attempts) {
        throw err;
      }

      await delay(attempt * baseDelayMs);
    }
  }

  throw lastError || new Error(`Fetch failed for ${label}`);
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function retryDelayMs(res, attempt, baseDelayMs) {
  const retryAfter = Number(res.headers.get("Retry-After") || 0);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  return attempt * baseDelayMs;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function stripZeros(value) {
  return String(value).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatCompactLower(value) {
  const n = Number(value || 0);
  const abs = Math.abs(n);

  if (abs >= 1e12) return stripZeros((n / 1e12).toFixed(2)) + "t";
  if (abs >= 1e9) return stripZeros((n / 1e9).toFixed(2)) + "b";
  if (abs >= 1e6) return stripZeros((n / 1e6).toFixed(2)) + "m";
  if (abs >= 1e3) return stripZeros((n / 1e3).toFixed(2)) + "k";
  return String(Math.round(n));
}

function formatDateTime(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanUsername(value) {
  return String(value || "").trim();
}

function buildClanIconUrl(iconValue) {
  const iconId = String(iconValue || "")
    .trim()
    .replace(/^rbxassetid:\/\//i, "")
    .replace(/^rbxasset:\/\//i, "")
    .trim();

  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeBattleName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function collectClanUserIds(clan) {
  const members = Array.isArray(clan?.Members) ? clan.Members.slice() : [];
  const ownerId = Number(clan?.Owner || 0);
  const ids = new Set();

  for (const member of members) {
    const id = Number(member?.UserID || 0);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }

  if (Number.isFinite(ownerId) && ownerId > 0) {
    ids.add(ownerId);
  }

  return [...ids];
}

function collectClanMembersWithOwner(clan) {
  const members = Array.isArray(clan?.Members) ? clan.Members.slice() : [];
  const ownerId = Number(clan?.Owner || 0);

  if (ownerId > 0 && !members.some((m) => Number(m?.UserID) === ownerId)) {
    members.unshift({
      UserID: ownerId,
      PermissionLevel: 100,
      JoinTime: ""
    });
  }

  return members;
}

function mapClanRole(permissionLevel, ownerId, userId) {
  if (Number(userId) === Number(ownerId)) return "Leader";

  const level = Number(permissionLevel);
  if (level === 90) return "Officer";
  if (level === 50) return "Member";
  if (level === 100) return "Leader";
  if (!Number.isNaN(level) && level > 0) return `Unknown (${level})`;

  return "";
}

function getBattleAliases(activeBattle) {
  const base = [activeBattle?.configName, activeBattle?._id].filter(Boolean);
  const out = new Set();

  for (const item of base) {
    const value = String(item).trim();
    if (!value) continue;
    out.add(value);
    out.add(value.replace(/\s+/g, ""));
  }

  return [...out];
}

function battleNodeMatchesAliases(node, aliases) {
  if (!node || typeof node !== "object") return false;

  const normalizedAliases = aliases.map(normalizeBattleName).filter(Boolean);
  const fields = [node.BattleID, node._id, node.Title, node.Name, node.configName];

  return fields.some((field) => normalizedAliases.includes(normalizeBattleName(field)));
}

function findBattleByAliases(obj, aliases) {
  if (!obj || typeof obj !== "object") return null;

  if (battleNodeMatchesAliases(obj, aliases)) {
    return obj;
  }

  const normalizedAliases = aliases.map(normalizeBattleName).filter(Boolean);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];

    if (value && typeof value === "object") {
      if (Array.isArray(value.PointContributions) && normalizedAliases.includes(normalizeBattleName(key))) {
        return value;
      }

      const found = findBattleByAliases(value, aliases);
      if (found) return found;
    }
  }

  return null;
}

function getSpecificBattleData(clan, activeBattle) {
  const pointMap = {};
  const aliases = getBattleAliases(activeBattle);
  let battleNode = null;

  if (clan && clan.Battles && typeof clan.Battles === "object") {
    for (const alias of aliases) {
      if (clan.Battles[alias]) {
        battleNode = clan.Battles[alias];
        break;
      }
    }
  }

  if (!battleNode) {
    battleNode = findBattleByAliases(clan, aliases);
  }

  if (!battleNode) {
    return {
      pointMap,
      battleId: activeBattle?.configName || "Unknown"
    };
  }

  const rows = Array.isArray(battleNode.PointContributions) ? battleNode.PointContributions : [];

  for (const row of rows) {
    const userId = String(row.UserID || "").trim();
    const points = Number(row.Points || 0);
    if (userId) pointMap[userId] = points;
  }

  return {
    pointMap,
    battleId:
      battleNode.BattleID ||
      battleNode._id ||
      battleNode.Title ||
      battleNode.Name ||
      battleNode.configName ||
      activeBattle?.configName ||
      "Unknown"
  };
}

async function findClanRank(clanName) {
  const target = normalizeKey(clanName);
  const pageSize = 100;
  const maxPages = 50;

  for (let page = 1; page <= maxPages; page++) {
    const json = await fetchJson(
      `https://ps99.biggamesapi.io/api/clans?page=${page}&pageSize=${pageSize}&sort=Points&sortOrder=desc`
    );

    const data = Array.isArray(json?.data) ? json.data : [];
    if (!data.length) break;

    for (let i = 0; i < data.length; i++) {
      const clan = data[i];
      if (normalizeKey(clan?.Name) === target) {
        return {
          rank: (page - 1) * pageSize + i + 1,
          scannedPages: page,
          scannedRows: (page - 1) * pageSize + data.length,
          points: Number(clan?.Points || 0)
        };
      }
    }

    if (data.length < pageSize) break;
  }

  return {
    rank: null,
    scannedPages: maxPages,
    scannedRows: maxPages * pageSize,
    points: null
  };
}

async function fetchRobloxUsersByIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))];
  if (!uniqueIds.length) return new Map();

  const out = new Map();

  for (let i = 0; i < uniqueIds.length; i += ROBLOX_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + ROBLOX_BATCH_SIZE);

    try {
      const res = await fetchWithRetry("https://users.roblox.com/v1/users", {
        method: "POST",
        headers: robloxJsonHeaders(),
        body: JSON.stringify({
          userIds: batch,
          excludeBannedUsers: false
        })
      }, {
        attempts: ROBLOX_LOOKUP_RETRIES,
        label: "Roblox users batch lookup"
      });

      if (!res.ok) {
        console.warn(`Roblox users batch lookup failed (${res.status}): ${await res.text().catch(() => "")}`);
      } else {
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        for (const item of data) {
          upsertRobloxUser(out, item);
        }
      }
    } catch (err) {
      console.warn(`Roblox users batch lookup threw: ${err?.message || String(err)}`);
    }
  }

  const missingIds = uniqueIds.filter(id => !out.has(String(id)));

  for (const id of missingIds) {
    const user = await fetchSingleRobloxUser(id);
    if (user) {
      upsertRobloxUser(out, user);
    }
  }

  return out;
}

async function fetchRobloxAvatars(userIds) {
  const uniqueIds = [...new Set((userIds || []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0))];
  if (!uniqueIds.length) return new Map();

  const out = new Map();

  for (let i = 0; i < uniqueIds.length; i += ROBLOX_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + ROBLOX_BATCH_SIZE);

    const url =
      "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
      `?userIds=${encodeURIComponent(batch.join(","))}` +
      "&size=150x150&format=Png&isCircular=false";

    let res;
    try {
      res = await fetchWithRetry(url, {
        headers: {
          Accept: "application/json"
        }
      }, {
        attempts: ROBLOX_LOOKUP_RETRIES,
        label: "Roblox avatar lookup"
      });
    } catch (err) {
      console.warn(`Roblox avatar lookup threw: ${err?.message || String(err)}`);
      continue;
    }

    if (!res.ok) {
      console.warn(`Roblox avatar lookup failed (${res.status}): ${await res.text().catch(() => "")}`);
      continue;
    }

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    for (const item of data) {
      const id = Number(item?.targetId);
      const imageUrl = String(item?.imageUrl || "").trim();
      const state = String(item?.state || "").trim();

      if (Number.isFinite(id) && imageUrl && state === "Completed") {
        out.set(String(id), imageUrl);
      }
    }
  }

  return out;
}

async function fetchSingleRobloxUser(userId) {
  try {
    const res = await fetchWithRetry(`https://users.roblox.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: {
        Accept: "application/json"
      }
    }, {
      attempts: 3,
      label: `Roblox user ${userId}`
    });

    if (!res.ok) {
      console.warn(`Roblox single-user lookup failed for ${userId} (${res.status}): ${await res.text().catch(() => "")}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`Roblox single-user lookup threw for ${userId}: ${err?.message || String(err)}`);
    return null;
  }
}

function robloxJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
}

function upsertRobloxUser(out, item) {
  const id = Number(item?.id);
  if (!Number.isFinite(id) || id <= 0) return;

  const username = cleanUsername(item?.name || item?.username || "");
  const displayName = cleanUsername(item?.displayName || username);

  if (!username) return;

  out.set(String(id), {
    username,
    displayName: displayName || username
  });
}
