const DISCORD_API_BASE = "https://discord.com/api/v10";
const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
const INTERACTION_TYPE_MESSAGE_COMPONENT = 3;
const INTERACTION_RESPONSE_PONG = 1;
const INTERACTION_RESPONSE_CHANNEL_MESSAGE = 4;
const INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE = 5;
const INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE = 6;
const APPLICATION_COMMAND_CHAT_INPUT = 1;
const APPLICATION_COMMAND_OPTION_SUB_COMMAND = 1;
const APPLICATION_COMMAND_OPTION_STRING = 3;
const MESSAGE_FLAG_EPHEMERAL = 1 << 6;
const COMPONENT_TYPE_ACTION_ROW = 1;
const COMPONENT_TYPE_BUTTON = 2;
const BUTTON_STYLE_PRIMARY = 1;
const BUTTON_STYLE_SECONDARY = 2;
const HISTORY_VIEWS = ["clan", "league", "leaderboard"];
const HISTORY_VIEW_LABELS = {
  clan: "Clan History",
  league: "League History",
  leaderboard: "Leaderboard History"
};
const DEFAULT_HISTORY_PAGE_SIZE = 10;
const DEFAULT_CLAN_REWARD_CUTOFF_RANKS = [1, 3, 10, 30, 50, 250, 500];
const LEGACY_CLAN_REWARD_CUTOFF_RANKS = "3,10,50,100,500";
const CLAN_REWARD_CATEGORIES = [
  { label: "#1", rank: 1 },
  { label: "#2-3", rank: 3 },
  { label: "#4-10", rank: 10 },
  { label: "#11-50", rank: 50 },
  { label: "#51-250", rank: 250 },
  { label: "Top 30", rank: 30 },
  { label: "Top 50", rank: 50 },
  { label: "Top 500", rank: 500 }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return json({
          ok: true,
          service: "c0ld-discord-search",
          interactions_endpoint: "/discord/interactions"
        });
      }

      if (request.method === "POST" && url.pathname === "/admin/register-search-command") {
        requireAdmin(request, env);
        return await registerSearchCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-version-command") {
        requireAdmin(request, env);
        return await registerVersionCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-rewards-command") {
        requireAdmin(request, env);
        return await registerRewardsCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-history-command") {
        requireAdmin(request, env);
        return await registerHistoryCommand(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/commands") {
        requireAdmin(request, env);
        return await listCommands(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/discord-debug") {
        requireAdmin(request, env);
        return await discordDebug(url, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/search-debug") {
        requireAdmin(request, env);
        return await searchDebug(url, env);
      }

      if ((request.method === "POST" || request.method === "DELETE") && url.pathname === "/admin/delete-command") {
        requireAdmin(request, env);
        return await deleteCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/discord/interactions") {
        return await handleInteraction(request, env, ctx);
      }

      return json({ ok: false, message: "Not found" }, 404);
    } catch (err) {
      return json({
        ok: false,
        message: err?.message || String(err)
      }, err?.status || 500);
    }
  }
};

async function handleInteraction(request, env, ctx) {
  const body = await request.text();
  const verified = await verifyDiscordRequest(request, env, body);

  if (!verified) {
    return new Response("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body || "{}");

  if (interaction.type === INTERACTION_TYPE_PING) {
    return interactionJson({ type: INTERACTION_RESPONSE_PONG });
  }

  if (interaction.type === INTERACTION_TYPE_MESSAGE_COMPONENT) {
    return interactionJson(handleHistoryComponent(interaction, env, ctx));
  }

  if (interaction.type !== INTERACTION_TYPE_APPLICATION_COMMAND) {
    return interactionJson(messageResponse("Unsupported interaction type."));
  }

  const commandName = String(interaction.data?.name || "").toLowerCase();
  if (commandName === "version") {
    try {
      return interactionJson(await buildVersionResponse(env));
    } catch (err) {
      return interactionJson(messageResponse(
        `Version lookup failed: ${err?.message || String(err)}`,
        true
      ));
    }
  }

  if (commandName === "rewards") {
    try {
      return interactionJson(await buildRewardsResponse(interaction, env));
    } catch (err) {
      return interactionJson(messageResponse(
        `Rewards lookup failed: ${err?.message || String(err)}`,
        true
      ));
    }
  }

  if (commandName === "history") {
    if (!memberHasAllowedRole(interaction, env)) {
      return interactionJson(messageResponse("You do not have access to use `/history`.", true));
    }

    const username = getCommandOption(interaction, "username");
    if (!username) {
      return interactionJson(messageResponse("Use `/history username:<roblox username>`.", true));
    }

    ctx.waitUntil(completeHistoryInteraction(interaction, env, {
      query: username,
      view: "clan",
      page: 0,
      ownerId: interactionUserId(interaction)
    }));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName !== "search") {
    return interactionJson(messageResponse(`Unknown command: ${commandName || "none"}`));
  }

  if (!memberHasAllowedRole(interaction, env)) {
    return interactionJson(messageResponse("You do not have access to use `/search`.", true));
  }

  const username = getCommandOption(interaction, "username");
  if (!username) {
    return interactionJson(messageResponse("Use `/search username:<roblox username>`.", true));
  }

  try {
    return interactionJson(await buildSearchResponse(username, env));
  } catch (err) {
    return interactionJson(messageResponse(
      `Search failed: ${err?.message || String(err)}`,
      true
    ));
  }
}

async function buildSearchResponse(query, env) {
  const { payload, status, ok, configured } = await fetchGlobalSearchPayload(query, env);
  const scanClan = configured?.scan_clan || String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";

  if (!ok || payload.ok === false || !payload.row) {
    return messageResponse(
      payload.message || `No global-rank result found for ${query}. ${status ? `(API ${status})` : ""}`.trim(),
      true
    );
  }

  const row = payload.row;
  const resultClan = String(row.source_clan || row.clan_name || scanClan).trim();
  const primaryClanName = String(scanClan).toLowerCase();
  const isPrimaryClanMember = String(resultClan || "").toLowerCase() === primaryClanName;
  const clanRankText = formatClanRank(row, payload.run);
  const clanRankLine = isPrimaryClanMember
    ? `🔰 Rank in ${resultClan.toUpperCase()}: **${clanRankText}**`
    : row.clan_rank
      ? `🔰 Clan Leaderboard Rank: **${rank(row.clan_rank)}**`
      : null;
  const embed = {
    title: "Global Search Results",
    color: 0x58a6ff,
    description: [
      `🧑 Name: **${displayName(row)}**`,
      `🏰 Clan: **${resultClan.toUpperCase()}**`,
      clanRankLine,
      "",
      `🎉 Event: **${row.event_name || row.battle_display_name || row.battle_key || "Current Event"}**`,
      `🌟 Stars: **${shortNumber(row.global_points ?? row.clan_points)}** ⭐`,
      `🏆 Global Rank: **${rank(row.global_rank)}${row.total_global_players ? ` of ${shortNumber(row.total_global_players)}` : ""}**`,
      betterThanLine(row),
      "",
      `Last Update: ${discordTime(row.fetched_at)}`,
      "Updates every 30 minutes"
    ].filter(line => line !== null).join("\n")
  };

  if (row.avatar_url) {
    embed.thumbnail = { url: row.avatar_url };
  }

  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: {
      embeds: [embed],
      flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
    }
  };
}

function handleHistoryComponent(interaction, env, ctx) {
  const state = parseHistoryCustomId(interaction.data?.custom_id);
  if (!state) {
    return messageResponse("That history control is no longer valid. Run `/history` again.", true);
  }

  const userId = interactionUserId(interaction);
  if (!userId || userId !== state.ownerId) {
    return messageResponse("Only the person who ran `/history` can use these controls.", true);
  }

  if (!memberHasAllowedRole(interaction, env)) {
    return messageResponse("You do not have access to use `/history`.", true);
  }

  ctx.waitUntil(completeHistoryInteraction(interaction, env, {
    query: state.targetId,
    targetId: state.targetId,
    ownerId: state.ownerId,
    view: state.view,
    page: state.page
  }));

  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function completeHistoryInteraction(interaction, env, state) {
  try {
    const history = await loadHistoryCommandData(state.query, env);
    await editOriginalInteraction(interaction, renderHistoryMessage(history, {
      ownerId: state.ownerId,
      view: state.view,
      page: state.page,
      pageSize: historyPageSize(env)
    }));
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `History lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function editOriginalInteraction(interaction, data) {
  const applicationId = String(interaction.application_id || "").trim();
  const token = String(interaction.token || "").trim();
  if (!applicationId || !token) throw httpError(500, "Discord interaction token is missing.");

  const endpoint = `${DISCORD_API_BASE}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(token)}/messages/@original`;
  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(stripUndefined(data))
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw httpError(502, payload.message || `Discord history response update failed (${res.status}).`);
  }
}

function interactionUserId(interaction) {
  return String(interaction?.member?.user?.id || interaction?.user?.id || "").trim();
}

function historyCustomId(ownerId, targetId, view, page) {
  return ["history", ownerId, targetId, view, Math.max(0, Math.trunc(Number(page) || 0))].join("|");
}

function parseHistoryCustomId(value) {
  const parts = String(value || "").split("|");
  if (parts.length !== 5 || parts[0] !== "history") return null;
  const ownerId = String(parts[1] || "");
  const targetId = String(parts[2] || "");
  const view = String(parts[3] || "").toLowerCase();
  const page = Math.max(0, Math.trunc(Number(parts[4]) || 0));
  if (!/^\d+$/.test(ownerId) || !/^\d+$/.test(targetId) || !HISTORY_VIEWS.includes(view)) return null;
  return { ownerId, targetId, view, page };
}

async function loadHistoryCommandData(query, env) {
  let search = await fetchGlobalSearchPayload(query, env);
  let globalPayload = search.payload?.row ? search.payload : null;
  let subject = globalPayload?.row ? {
    userId: positiveInteger(globalPayload.row.user_id),
    username: displayName(globalPayload.row),
    avatarUrl: globalPayload.row.avatar_url || null
  } : null;

  if (!subject?.userId) {
    subject = await resolveRobloxHistorySubject(query);
  }

  if (!subject?.userId) {
    throw httpError(404, `No Roblox user found for ${query}.`);
  }

  if (!globalPayload?.row || Number(globalPayload.row.user_id) !== Number(subject.userId)) {
    search = await fetchGlobalSearchPayload(String(subject.userId), env);
    globalPayload = search.payload?.row ? search.payload : null;
  }

  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const [battleList, trackedHistory, cwHistory, bigHistory, leagueHistory, staticProfile] = await Promise.all([
    fetchClanHistoryJson(env, "/api/battles", { clan: scanClan, limit: 60 }),
    fetchClanHistoryJson(env, "/api/history", {
      clan: scanClan,
      user_id: subject.userId,
      all_battles: true,
      hours: 100000,
      limit: 50000,
      order: "asc"
    }),
    fetchClanHistoryJson(env, "/api/external-history", { user_id: subject.userId, source: "cw_bot", limit: 300 }),
    fetchClanHistoryJson(env, "/api/external-history", { user_id: subject.userId, source: "big_bot", limit: 300 }),
    fetchLeagueHistoryJson(subject.userId, env),
    fetchStaticHistoryProfile(subject.userId, env)
  ]);

  const battleRows = (Array.isArray(battleList?.rows) ? battleList.rows : [])
    .filter(row => !isLegacyHistoryBattle(row, false));
  const liveClanRows = trackedHistory?.all_battles === true
    ? summarizeTrackedClanHistory(trackedHistory.rows, battleRows)
    : (await historyMapLimit(battleRows, 5, async battle => {
    const battleKey = String(battle.battle || battle.battle_key || "").trim();
    if (!battleKey) return null;
    const payload = await fetchClanHistoryJson(env, "/api/history", {
      clan: scanClan,
      user_id: subject.userId,
      battle: battleKey,
      hours: 100000,
      limit: 50000,
      order: "asc"
    });
    const rows = Array.isArray(payload?.rows) ? payload.rows.slice() : [];
    if (!rows.length) return null;
    rows.sort((a, b) => Date.parse(a.fetched_at || 0) - Date.parse(b.fetched_at || 0));
    const latest = rows[rows.length - 1] || {};
    return {
      key: historyRecordKey(battleKey),
      name: historyRecordName(battle.display_name || battle.battle_display_name || battleKey),
      source: "site",
      rank: finiteHistoryNumber(latest.rank),
      points: finiteHistoryNumber(latest.total_points ?? latest.points)
    };
    })).filter(Boolean);

  const leaderboardRows = summarizeGlobalHistory(globalPayload);
  const clanMap = new Map();
  for (const row of liveClanRows) mergeClanHistoryRecord(clanMap, row);
  for (const row of staticClanHistoryRows(staticProfile)) mergeClanHistoryRecord(clanMap, row);
  for (const row of leaderboardRows) {
    mergeClanHistoryRecord(clanMap, {
      ...row,
      source: "site",
      rank: finiteHistoryNumber(globalPayload?.row?.member_rank ?? globalPayload?.row?.clan_rank)
    });
  }
  for (const row of externalClanHistoryRows(bigHistory?.rows, "big_bot")) mergeClanHistoryRecord(clanMap, row);
  for (const row of externalClanHistoryRows(cwHistory?.rows, "cw_bot")) mergeClanHistoryRecord(clanMap, row);

  const leagueRows = mergeHistorySummaryRows(
    normalizeLeagueHistoryRows(leagueHistory?.rows),
    normalizeLeagueHistoryRows(staticProfile?.league_summaries)
  );
  const combinedLeaderboardRows = mergeHistorySummaryRows(
    leaderboardRows,
    normalizeLeaderboardHistoryRows(staticProfile?.leaderboard_summaries)
  );
  const avatarUrl = subject.avatarUrl || absoluteProfileAssetUrl(staticProfile?.avatar_url, env);

  return {
    user_id: subject.userId,
    username: globalPayload?.row ? displayName(globalPayload.row) : staticProfile?.username || subject.username || `user_${subject.userId}`,
    avatar_url: avatarUrl || null,
    clan: [...clanMap.values()],
    league: leagueRows,
    leaderboard: combinedLeaderboardRows
  };
}

function summarizeTrackedClanHistory(rows, battleRows) {
  const battleNames = new Map((Array.isArray(battleRows) ? battleRows : []).map(row => [
    historyRecordKey(row.battle || row.battle_key),
    row.display_name || row.battle_display_name || row.battle || row.battle_key
  ]));
  const latestByBattle = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const key = historyRecordKey(row.battle_key);
    if (!key) continue;
    const existing = latestByBattle.get(key);
    if (!existing || Date.parse(row.fetched_at || 0) >= Date.parse(existing.fetched_at || 0)) {
      latestByBattle.set(key, row);
    }
  }

  const orderedKeys = [
    ...battleNames.keys(),
    ...[...latestByBattle.keys()].filter(key => !battleNames.has(key))
  ];
  return orderedKeys.flatMap(key => {
    const row = latestByBattle.get(key);
    return row ? [{
      key,
      name: historyRecordName(battleNames.get(key) || row.battle_key),
      source: "site",
      rank: finiteHistoryNumber(row.rank),
      points: finiteHistoryNumber(row.total_points ?? row.points)
    }] : [];
  });
}

async function resolveRobloxHistorySubject(query) {
  const raw = String(query || "").trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const res = await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(raw)}`, {
      headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" }
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.id) return { userId: positiveInteger(raw), username: `user_${raw}`, avatarUrl: null };
    return { userId: positiveInteger(payload.id), username: payload.name || `user_${payload.id}`, avatarUrl: null };
  }

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-History-Worker"
    },
    body: JSON.stringify({ usernames: [raw], excludeBannedUsers: false })
  });
  const payload = await res.json().catch(() => ({}));
  const row = Array.isArray(payload.data) ? payload.data[0] : null;
  return row?.id ? { userId: positiveInteger(row.id), username: row.name || raw, avatarUrl: null } : null;
}

async function fetchClanHistoryJson(env, path, params = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const url = clanApiUrl(env, path, apiBase);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetchClanApi(env, url, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));
  return res.ok && payload.ok !== false ? payload : null;
}

async function fetchLeagueHistoryJson(userId, env) {
  const base = String(env.LEAGUE_API_BASE || "https://yamo-league-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const url = new URL("/api/leagues/profile", base);
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("limit", "2000");
  url.searchParams.set("summary_limit", "100");
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" } });
  const payload = await res.json().catch(() => ({}));
  return res.ok && payload.ok !== false ? payload : null;
}

async function fetchStaticHistoryProfile(userId, env) {
  const base = String(env.PROFILE_DATA_BASE || "https://c0ld-clan.com/Data/players").replace(/\/$/, "");
  const res = await fetch(`${base}/${encodeURIComponent(userId)}.json`, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" }
  });
  return res.ok ? res.json().catch(() => null) : null;
}

function staticClanHistoryRows(profile) {
  return (Array.isArray(profile?.battles) ? profile.battles : [])
    .filter(row => !isLegacyHistoryBattle(row, true))
    .map(row => {
      const series = Array.isArray(row.series) ? row.series : [];
      const latest = series[series.length - 1] || {};
      const name = row.display_name || row.battle_display_name || row.battle || row.battle_key;
      return {
        key: historyRecordKey(row.battle || row.battle_key || name),
        name: historyRecordName(name),
        source: "site",
        rank: finiteHistoryNumber(row.ending_rank ?? row.end_rank ?? row.last_rank ?? latest.rank),
        points: finiteHistoryNumber(row.ending_points ?? latest.points ?? latest.total_points)
      };
    })
    .filter(row => row.key && (row.rank !== null || row.points !== null));
}

function externalClanHistoryRows(rows, source) {
  return (Array.isArray(rows) ? rows : []).map(row => {
    const isCwBot = source === "cw_bot";
    return {
      key: historyRecordKey(row.battle_key || row.battle_name),
      name: historyRecordName(row.battle_name || row.battle_key),
      source,
      rank: isCwBot ? null : finiteHistoryNumber(row.final_rank),
      total_ranked: isCwBot ? null : finiteHistoryNumber(row.total_ranked),
      global_rank: isCwBot ? finiteHistoryNumber(row.final_rank) : null,
      total_global_players: isCwBot ? finiteHistoryNumber(row.total_ranked) : null,
      points: finiteHistoryNumber(row.final_points)
    };
  }).filter(row => row.key && (row.rank !== null || row.global_rank !== null || row.points !== null));
}

function summarizeGlobalHistory(payload) {
  if (!payload?.row) return [];
  const current = payload.row;
  const rows = [...(Array.isArray(payload.history) ? payload.history : []), current];
  const groups = new Map();

  for (const row of rows) {
    const name = historyRecordName(
      row.leaderboard_name || row.event_name || row.battle_display_name || row.battle_key || "Global Leaderboard"
    );
    const key = historyRecordKey(row.battle_key || name);
    if (!key) continue;
    const candidate = {
      key,
      name,
      global_rank: finiteHistoryNumber(row.global_rank),
      total_global_players: finiteHistoryNumber(row.total_global_players),
      points: finiteHistoryNumber(row.global_points ?? row.points ?? row.clan_points),
      fetched_at: row.fetched_at || row.updated_at || null
    };
    const existing = groups.get(key);
    if (!existing || Date.parse(candidate.fetched_at || 0) >= Date.parse(existing.fetched_at || 0)) {
      groups.set(key, candidate);
    }
  }

  return [...groups.values()].filter(row => row.global_rank !== null || row.points !== null);
}

function normalizeLeagueHistoryRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    key: historyRecordKey(row.league_period_key || row.label_key || row.run_label || row.event_name),
    name: historyRecordName(row.run_label || row.event_name || row.league_period_key || "League"),
    league_name: row.league_name || null,
    league_rank: finiteHistoryNumber(row.league_rank ?? row.final_league_rank ?? row.rank),
    player_rank: finiteHistoryNumber(row.player_league_rank ?? row.member_rank ?? row.final_rank),
    points: finiteHistoryNumber(row.final_points)
  })).filter(row => row.key && (row.league_rank !== null || row.player_rank !== null || row.points !== null));
}

function normalizeLeaderboardHistoryRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    key: historyRecordKey(row.battle_key || row.leaderboard_name || row.event_name || row.label),
    name: historyRecordName(row.leaderboard_name || row.event_name || row.label || row.battle_key || "Global Leaderboard"),
    global_rank: finiteHistoryNumber(row.global_rank ?? row.final_rank),
    total_global_players: finiteHistoryNumber(row.total_global_players ?? row.total_ranked),
    points: finiteHistoryNumber(row.global_points ?? row.final_points)
  })).filter(row => row.key && (row.global_rank !== null || row.points !== null));
}

function mergeHistorySummaryRows(primaryRows, secondaryRows) {
  const map = new Map();
  for (const row of [...(primaryRows || []), ...(secondaryRows || [])]) {
    const key = row.key || historyRecordKey(row.name);
    if (!key) continue;
    const existing = map.get(key);
    map.set(key, existing ? fillHistoryRecord(existing, row) : row);
  }
  return [...map.values()];
}

function mergeClanHistoryRecord(map, row) {
  if (!row?.key) return;
  const existing = map.get(row.key);
  if (!existing) {
    map.set(row.key, row);
    return;
  }

  const rowWins = historySourcePriority(row.source) > historySourcePriority(existing.source);
  const primary = rowWins ? row : existing;
  const secondary = rowWins ? existing : row;
  map.set(row.key, fillHistoryRecord(primary, secondary));
}

function fillHistoryRecord(primary, secondary) {
  return {
    ...secondary,
    ...primary,
    rank: finiteHistoryNumber(primary.rank) ?? finiteHistoryNumber(secondary.rank),
    total_ranked: finiteHistoryNumber(primary.total_ranked) ?? finiteHistoryNumber(secondary.total_ranked),
    global_rank: finiteHistoryNumber(primary.global_rank) ?? finiteHistoryNumber(secondary.global_rank),
    total_global_players: finiteHistoryNumber(primary.total_global_players) ?? finiteHistoryNumber(secondary.total_global_players),
    league_rank: finiteHistoryNumber(primary.league_rank) ?? finiteHistoryNumber(secondary.league_rank),
    player_rank: finiteHistoryNumber(primary.player_rank) ?? finiteHistoryNumber(secondary.player_rank),
    points: finiteHistoryNumber(primary.points) ?? finiteHistoryNumber(secondary.points)
  };
}

function historySourcePriority(source) {
  if (source === "site") return 3;
  if (source === "big_bot") return 2;
  return 1;
}

function historyRecordKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function historyRecordName(value) {
  const text = String(value || "").trim();
  if (!text) return "Unknown";
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/(\D)(20\d{2})$/i, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function isLegacyHistoryBattle(row, staticOnly) {
  const keys = [row?.battle, row?.battle_key, row?.display_name, row?.battle_display_name]
    .map(historyRecordKey);
  const alwaysLegacy = new Set(["safetybattle", "poisonturtlebattle", "abstractbattle", "abstractc0ld", "spring2026"]);
  const staticLegacy = new Set(["angelbattle2026", "angelbattle2026c0ld", "angelbattle2026clans", "starrybattle", "starryc0ld", "starryclans"]);
  return keys.some(key => alwaysLegacy.has(key) || (staticOnly && staticLegacy.has(key)));
}

async function historyMapLimit(items, limit, mapper) {
  const list = Array.from(items || []);
  const results = new Array(list.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, limit), list.length) }, async () => {
    while (next < list.length) {
      const index = next++;
      results[index] = await mapper(list[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function finiteHistoryNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function absoluteProfileAssetUrl(value, env) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const siteBase = String(env.SITE_BASE_URL || "https://c0ld-clan.com").replace(/\/$/, "");
  return `${siteBase}/${raw.replace(/^\/+/, "")}`;
}

function renderHistoryMessage(history, options) {
  const view = HISTORY_VIEWS.includes(options.view) ? options.view : "clan";
  const rows = Array.isArray(history[view]) ? history[view] : [];
  const pageSize = options.pageSize;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(0, Math.trunc(Number(options.page) || 0)), totalPages - 1);
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const description = pageRows.length
    ? pageRows.map((row, index) => formatHistoryLine(row, view, page * pageSize + index + 1)).join("\n")
    : `No ${HISTORY_VIEW_LABELS[view].toLowerCase()} has been recorded for this player.`;
  const embed = {
    title: `${truncateHistoryText(history.username, 80)} — ${HISTORY_VIEW_LABELS[view]}`,
    color: view === "league" ? 0xf2cc60 : view === "leaderboard" ? 0x58a6ff : 0xff6b6b,
    description,
    footer: { text: `Page ${page + 1}/${totalPages} • ${rows.length} record${rows.length === 1 ? "" : "s"}` }
  };
  if (history.avatar_url) embed.thumbnail = { url: history.avatar_url };

  return {
    content: null,
    embeds: [embed],
    components: historyComponents({
      ownerId: options.ownerId,
      targetId: String(history.user_id),
      view,
      page,
      totalPages
    }),
    allowed_mentions: { parse: [] }
  };
}

function formatHistoryLine(row, view, number) {
  const name = escapeDiscordMarkdown(truncateHistoryText(row.name, 72));
  if (view === "league") {
    return `${number}. **${name}** — League ${historyRank(row.league_rank)} — Player ${historyRank(row.player_rank)} — ${historyPoints(row.points)} pts`;
  }
  return `${number}. **${name}** — Global ${historyRank(row.global_rank, row.total_global_players)} — ${historyPoints(row.points)} pts`;
}

function historyRank(value, total) {
  const rankValue = positiveInteger(value);
  if (!rankValue) return "—";
  const totalValue = positiveInteger(total);
  return `#${fullNumber(rankValue)}${totalValue ? `/${shortNumber(totalValue)}` : ""}`;
}

function historyPoints(value) {
  return finiteHistoryNumber(value) === null ? "—" : shortNumber(value);
}

function historyComponents({ ownerId, targetId, view, page, totalPages }) {
  const rows = [];
  if (totalPages > 1) {
    rows.push({
      type: COMPONENT_TYPE_ACTION_ROW,
      components: [
        historyButton("Previous", historyCustomId(ownerId, targetId, view, page - 1), BUTTON_STYLE_SECONDARY, page <= 0),
        historyButton(`Page ${page + 1}/${totalPages}`, historyCustomId(ownerId, targetId, view, page), BUTTON_STYLE_SECONDARY, true),
        historyButton("Next", historyCustomId(ownerId, targetId, view, page + 1), BUTTON_STYLE_SECONDARY, page >= totalPages - 1)
      ]
    });
  }

  rows.push({
    type: COMPONENT_TYPE_ACTION_ROW,
    components: HISTORY_VIEWS.map(candidate => historyButton(
      HISTORY_VIEW_LABELS[candidate],
      historyCustomId(ownerId, targetId, candidate, 0),
      candidate === view ? BUTTON_STYLE_PRIMARY : BUTTON_STYLE_SECONDARY,
      false
    ))
  });
  return rows;
}

function historyButton(label, customId, style, disabled) {
  return {
    type: COMPONENT_TYPE_BUTTON,
    style,
    label,
    custom_id: customId,
    disabled: Boolean(disabled)
  };
}

function historyPageSize(env) {
  const value = Math.round(Number(env.HISTORY_PAGE_SIZE || DEFAULT_HISTORY_PAGE_SIZE));
  return Number.isFinite(value) ? Math.min(15, Math.max(5, value)) : DEFAULT_HISTORY_PAGE_SIZE;
}

function escapeDiscordMarkdown(value) {
  return String(value || "").replace(/([\\`*_{}\[\]()<>#+\-.!|~>])/g, "\\$1");
}

function truncateHistoryText(value, length) {
  const text = String(value || "Unknown").trim() || "Unknown";
  return text.length > length ? `${text.slice(0, Math.max(1, length - 1))}…` : text;
}

async function registerSearchCommand(url, env) {
  return registerCommand(url, env, searchCommandPayload());
}

async function registerVersionCommand(url, env) {
  return registerCommand(url, env, versionCommandPayload());
}

async function registerRewardsCommand(url, env) {
  return registerCommand(url, env, rewardsCommandPayload());
}

async function registerHistoryCommand(url, env) {
  return registerCommand(url, env, historyCommandPayload());
}

async function registerCommand(url, env, commandPayload) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const botToken = requiredEnv(env, "DISCORD_BOT_TOKEN");
  const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
  const endpoint = guildId
    ? `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/guilds/${encodeURIComponent(guildId)}/commands`
    : `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/commands`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(commandPayload)
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    return json({
      ok: false,
      status: res.status,
      message: discordApiErrorMessage(res.status, payload.message || `Discord /${commandPayload.name} registration failed.`),
      details: payload
    }, 502);
  }

  return json({
    ok: true,
    scope: guildId ? "guild" : "global",
    guild_id: guildId || null,
    command: payload
  });
}

async function buildVersionResponse(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/ps99/versions", apiBase);
  apiUrl.searchParams.set("limit", "1");
  apiUrl.searchParams.set("fresh", "1");

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Version-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `PS99 version API failed (${response.status}).`);
  }

  const places = Array.isArray(payload.places) ? payload.places : [];
  const rootPlaceId = String(payload.root_place_id || "");
  const rootPlace = places.find(place => Boolean(place.root_place))
    || places.find(place => String(place.place_id || "") === rootPlaceId)
    || places[0]
    || null;
  const lastScannedAt = places.reduce((latest, place) => {
    const value = String(place?.latest_checked_at || "");
    const time = Date.parse(value);
    return Number.isFinite(time) && time > latest.time ? { time, value } : latest;
  }, { time: 0, value: "" }).value;
  const version = plainInteger(rootPlace?.latest_version ?? payload.newest_version);
  const release = formatPs99CommandDate(rootPlace?.latest_published_at);
  const lastScanned = formatPs99CommandDate(lastScannedAt || rootPlace?.latest_checked_at);

  return messageResponse(
    `Newest PS99 Version: ${version} | Release: ${release} | Last Scanned: ${lastScanned}`
  );
}

async function buildRewardsResponse(interaction, env) {
  const type = rewardCommandType(interaction);
  const payload = await fetchRewardCutoffsPayload(type, env);

  if (!payload.ok) {
    return messageResponse(payload.message || "No reward cutoff data is available yet.", true);
  }

  const embed = {
    title: type === "clans" ? "Clan Reward Cutoffs" : "Player Reward Cutoffs",
    color: type === "clans" ? 0xf2cc60 : 0x58a6ff,
    description: rewardCutoffDescription(payload, type, env)
  };

  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: {
      embeds: [embed]
    }
  };
}

async function fetchRewardCutoffsPayload(type, env) {
  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/reward-cutoffs", apiBase);
  apiUrl.searchParams.set("type", type);

  if (type === "players") {
    apiUrl.searchParams.set("clan", scanClan);
  }

  const ranks = configuredRewardRanks(type, env);
  if (ranks.length) {
    apiUrl.searchParams.set("ranks", ranks.join(","));
  }

  const response = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Rewards-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw httpError(response.status || 502, payload.message || `Reward cutoff API failed (${response.status}).`);
  }

  return payload;
}

function rewardCutoffDescription(payload, type, env) {
  const titleParts = [
    rewardLeaderboardTitle(payload, type, env)
  ];

  if (payload.snapshot_at) {
    titleParts.push(`updated ${discordTime(payload.snapshot_at)}`);
  }

  const lines = [
    `**${titleParts.filter(Boolean).join(" | ")}**`,
    ""
  ];

  for (const line of rewardCutoffLines(payload, type)) {
    lines.push(line);
  }

  const unavailable = (payload.cutoffs || []).some(cutoff => cutoff.points === null || cutoff.points === undefined);
  if (unavailable && payload.available_rank_max) {
    lines.push("");
    lines.push(`Only Top ${fullNumber(payload.available_rank_max)} is available from the latest stored scan.`);
  }

  return lines.join("\n");
}

function rewardCutoffLines(payload, type) {
  if (type !== "clans") {
    return (payload.cutoffs || []).map(cutoff => rewardCutoffLine(cutoff));
  }

  const byRank = new Map((payload.cutoffs || []).map(cutoff => [Number(cutoff.rank), cutoff]));
  return CLAN_REWARD_CATEGORIES.map(category => rewardCutoffLine({
    ...(byRank.get(category.rank) || {}),
    rank: category.rank,
    label: category.label
  }));
}

function rewardCutoffLine(cutoff) {
  const label = cutoff.label || `Top ${fullNumber(cutoff.rank)}`;
  if (cutoff.points === null || cutoff.points === undefined) {
    return `**${label}:** not recorded yet`;
  }

  return `**${label}:** ${fullNumber(cutoff.points)} pts`;
}

function rewardLeaderboardTitle(payload, type, env) {
  if (type === "players") {
    const customLabel = String(env.PLAYER_REWARD_LEADERBOARD_LABEL || "").trim();
    if (customLabel) return customLabel;

    const updateLabel = String(env.PS99_UPDATE_LABEL || "").trim();
    if (updateLabel) {
      return /leaderboard/i.test(updateLabel) ? updateLabel : `${updateLabel} Leaderboard`;
    }

    const updateNumber = String(env.PS99_UPDATE_NUMBER || "").trim();
    if (updateNumber) return `Update ${updateNumber} Leaderboard`;

    return "Player Leaderboard";
  }

  return payload.event_name || payload.display_name || payload.battle || "Clan Leaderboard";
}

function rewardCommandType(interaction) {
  const option = (interaction.data?.options || [])[0] || null;
  const name = String(option?.name || "").toLowerCase();
  return name === "clans" ? "clans" : "players";
}

function configuredRewardRanks(type, env) {
  const raw = String(type === "clans" ? env.CLAN_REWARD_CUTOFF_RANKS || "" : env.PLAYER_REWARD_CUTOFF_RANKS || "");
  const maxRank = type === "clans" ? 10000 : 100000;
  const parsed = raw
    .split(/[,\s]+/)
    .map(value => Math.round(Number(value)))
    .filter(value => Number.isFinite(value) && value >= 1 && value <= maxRank);

  if (type === "clans") {
    const normalizedRaw = [...new Set(parsed)].sort((a, b) => a - b).join(",");
    if (!raw.trim() || normalizedRaw === LEGACY_CLAN_REWARD_CUTOFF_RANKS) {
      return DEFAULT_CLAN_REWARD_CUTOFF_RANKS;
    }
  } else if (!raw.trim()) {
    return [];
  }

  return [...new Set(parsed)]
    .sort((a, b) => a - b)
    .slice(0, 20);
}

async function listCommands(url, env) {
  const scope = String(url.searchParams.get("scope") || "both").toLowerCase();
  const results = [];

  if (scope === "both" || scope === "guild") {
    const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
    if (guildId) {
      results.push({
        scope: "guild",
        guild_id: guildId,
        commands: await fetchCommands(env, guildId)
      });
    }
  }

  if (scope === "both" || scope === "global") {
    results.push({
      scope: "global",
      guild_id: null,
      commands: await fetchCommands(env, null)
    });
  }

  return json({ ok: true, results });
}

async function deleteCommand(url, env) {
  const id = String(url.searchParams.get("id") || "").trim();
  const name = String(url.searchParams.get("name") || "").trim().toLowerCase();
  const scope = String(url.searchParams.get("scope") || "both").toLowerCase();
  const targets = [];

  if (!id && !name) {
    throw httpError(400, "Provide ?id=COMMAND_ID or ?name=COMMAND_NAME.");
  }

  if (scope === "both" || scope === "guild") {
    const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
    if (guildId) targets.push({ scope: "guild", guildId });
  }

  if (scope === "both" || scope === "global") {
    targets.push({ scope: "global", guildId: null });
  }

  const deleted = [];
  for (const target of targets) {
    const commands = id
      ? [{ id, name: name || null }]
      : (await fetchCommands(env, target.guildId)).filter(command => String(command.name || "").toLowerCase() === name);

    for (const command of commands) {
      await deleteCommandById(env, target.guildId, command.id);
      deleted.push({
        scope: target.scope,
        guild_id: target.guildId,
        id: command.id,
        name: command.name
      });
    }
  }

  return json({ ok: true, deleted });
}

async function discordDebug(url, env) {
  const configuredApplicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const guildId = String(url.searchParams.get("guild_id") || env.DISCORD_GUILD_ID || "").trim();
  const [botUser, botApplication, guildCheck] = await Promise.all([
    fetchDiscordDebugEndpoint(env, "/users/@me"),
    fetchDiscordDebugEndpoint(env, "/oauth2/applications/@me"),
    guildId ? fetchDiscordDebugEndpoint(env, `/guilds/${encodeURIComponent(guildId)}`) : Promise.resolve(null)
  ]);

  const tokenApplicationId = String(botApplication?.payload?.id || "");
  return json({
    ok: true,
    configured_application_id: configuredApplicationId,
    token_application_id: tokenApplicationId || null,
    application_id_matches_token: Boolean(tokenApplicationId) && tokenApplicationId === configuredApplicationId,
    guild_id: guildId || null,
    guild_access_ok: guildCheck ? guildCheck.ok : null,
    bot_user: botUser.ok ? {
      id: botUser.payload.id,
      username: botUser.payload.username,
      global_name: botUser.payload.global_name || null
    } : null,
    application: botApplication.ok ? {
      id: botApplication.payload.id,
      name: botApplication.payload.name,
      bot_public: botApplication.payload.bot_public ?? null,
      bot_require_code_grant: botApplication.payload.bot_require_code_grant ?? null
    } : null,
    checks: {
      bot_token: summarizeDiscordDebugResult(botUser),
      application: summarizeDiscordDebugResult(botApplication),
      guild: guildCheck ? summarizeDiscordDebugResult(guildCheck) : null
    }
  });
}

async function searchDebug(url, env) {
  const query = String(url.searchParams.get("q") || url.searchParams.get("username") || "").trim();
  if (!query) {
    throw httpError(400, "Missing ?q=username.");
  }

  const result = await fetchGlobalSearchPayload(query, env);
  return json({
    ok: result.ok && result.payload.ok !== false && Boolean(result.payload.row),
    configured: result.configured,
    api_status: result.status,
    api_ok: result.apiOk,
    payload_ok: result.payload.ok ?? null,
    payload_message: result.payload.message || null,
    fallback_used: result.fallbackUsed,
    fallback_status: result.fallbackStatus,
    row_found: Boolean(result.payload.row),
    row: result.payload.row || null
  });
}

async function fetchGlobalSearchPayload(query, env) {
  const scanClan = String(env.GLOBAL_SCAN_CLAN || env.CLAN_NAME || "c0ld").trim() || "c0ld";
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/global/search", apiBase);
  apiUrl.searchParams.set("clan", scanClan);
  apiUrl.searchParams.set("q", query);

  const res = await fetchClanApi(env, apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Search-Worker-Debug"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));

  if (res.ok && payload.ok !== false && payload.row) {
    return {
      ok: true,
      apiOk: true,
      status: res.status,
      payload,
      fallbackUsed: false,
      fallbackStatus: null,
      configured: {
        scan_clan: scanClan,
        clan_api_base: apiBase,
        service_binding_enabled: hasClanApiServiceBinding(env),
        api_url: apiUrl.toString()
      }
    };
  }

  const fallback = await fetchGlobalCurrentFallback(env, apiBase, scanClan, query);
  if (fallback.payload.row) {
    return {
      ok: true,
      apiOk: res.ok,
      status: res.status,
      payload: fallback.payload,
      fallbackUsed: true,
      fallbackStatus: fallback.status,
      configured: {
        scan_clan: scanClan,
        clan_api_base: apiBase,
        service_binding_enabled: hasClanApiServiceBinding(env),
        api_url: apiUrl.toString()
      }
    };
  }

  return {
    ok: false,
    apiOk: res.ok,
    status: res.status,
    payload: payload.ok === false || payload.message ? payload : fallback.payload,
    fallbackUsed: fallback.used,
    fallbackStatus: fallback.status,
    configured: {
      scan_clan: scanClan,
      clan_api_base: apiBase,
      service_binding_enabled: hasClanApiServiceBinding(env),
      api_url: apiUrl.toString()
    }
  };
}

async function fetchGlobalCurrentFallback(env, apiBase, scanClan, query) {
  const currentUrl = clanApiUrl(env, "/api/global/current", apiBase);
  currentUrl.searchParams.set("clan", scanClan);
  currentUrl.searchParams.set("limit", "1000");

  const res = await fetchClanApi(env, currentUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-Search-Worker-Fallback"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok || !Array.isArray(payload.rows)) {
    return {
      used: true,
      status: res.status,
      payload: {
        ok: false,
        message: `Global search endpoint failed and current fallback failed (${res.status}).`
      }
    };
  }

  const searchKey = normalizeSearchKey(query);
  const row = payload.rows.find(item => {
    const userId = String(item.user_id || "").trim();
    return (
      userId === String(query).trim() ||
      normalizeSearchKey(item.username) === searchKey ||
      normalizeSearchKey(item.display_name) === searchKey
    );
  }) || null;

  return {
    used: true,
    status: res.status,
    payload: row ? {
      ok: true,
      query,
      clan_name: scanClan,
      row,
      history: []
    } : {
      ok: false,
      query,
      clan_name: scanClan,
      message: `No current global-rank row matched "${query}".`
    }
  };
}

function normalizeSearchKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function clanApiUrl(env, path, fallbackBase) {
  const base = hasClanApiServiceBinding(env)
    ? "https://c0ld-clan-api-worker.service"
    : fallbackBase;
  return new URL(path, base);
}

function hasClanApiServiceBinding(env) {
  return Boolean(env?.CLAN_API_WORKER && typeof env.CLAN_API_WORKER.fetch === "function");
}

async function fetchClanApi(env, url, init) {
  const request = new Request(url.toString(), init);
  if (hasClanApiServiceBinding(env)) {
    return env.CLAN_API_WORKER.fetch(request);
  }
  return fetch(request);
}

async function fetchDiscordDebugEndpoint(env, path) {
  const res = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: discordBotHeaders(env)
  });
  const payload = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    payload
  };
}

function summarizeDiscordDebugResult(result) {
  if (!result) return null;
  if (result.ok) return { ok: true, status: result.status };
  return {
    ok: false,
    status: result.status,
    code: result.payload?.code ?? null,
    message: result.payload?.message || "Discord API request failed."
  };
}

async function fetchCommands(env, guildId) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const endpoint = discordCommandsEndpoint(applicationId, guildId);
  const res = await fetch(endpoint, {
    headers: discordBotHeaders(env)
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw httpError(502, discordApiErrorMessage(res.status, payload.message || `Discord command list failed (${res.status}).`));
  }

  return payload;
}

async function deleteCommandById(env, guildId, commandId) {
  const applicationId = requiredEnv(env, "DISCORD_APPLICATION_ID");
  const endpoint = `${discordCommandsEndpoint(applicationId, guildId)}/${encodeURIComponent(commandId)}`;
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: discordBotHeaders(env)
  });

  if (!res.ok && res.status !== 404) {
    const payload = await res.json().catch(() => ({}));
    throw httpError(502, discordApiErrorMessage(res.status, payload.message || `Discord command delete failed (${res.status}).`));
  }
}

function discordApiErrorMessage(status, message) {
  if (status === 401) {
    return "Discord API rejected DISCORD_BOT_TOKEN. Set the raw Bot token from Discord Developer Portal > Bot on this Worker; do not include the word Bot.";
  }

  if (status === 403) {
    return "Discord API rejected access. Confirm DISCORD_APPLICATION_ID belongs to the same app as DISCORD_BOT_TOKEN and the bot is installed in the guild.";
  }

  return message;
}

function discordCommandsEndpoint(applicationId, guildId) {
  return guildId
    ? `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/guilds/${encodeURIComponent(guildId)}/commands`
    : `${DISCORD_API_BASE}/applications/${encodeURIComponent(applicationId)}/commands`;
}

function discordBotHeaders(env, extra = {}) {
  return {
    Authorization: `Bot ${requiredEnv(env, "DISCORD_BOT_TOKEN")}`,
    Accept: "application/json",
    ...extra
  };
}

function searchCommandPayload() {
  return {
    name: "search",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Search stored global rank data by Roblox username.",
    dm_permission: false,
    options: [
      {
        name: "username",
        description: "Roblox username or user ID",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true
      }
    ]
  };
}

function versionCommandPayload() {
  return {
    name: "version",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show the newest PS99 version and last scan time.",
    dm_permission: false
  };
}

function rewardsCommandPayload() {
  return {
    name: "rewards",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show current reward point cutoffs.",
    dm_permission: false,
    options: [
      {
        name: "players",
        description: "Show player reward cutoff points from the global leaderboard.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      },
      {
        name: "clans",
        description: "Show clan reward cutoff points from the clan leaderboard.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      }
    ]
  };
}

function historyCommandPayload() {
  return {
    name: "history",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Show a Roblox player's recorded battle history.",
    dm_permission: false,
    options: [
      {
        name: "username",
        description: "Roblox username or user ID",
        type: APPLICATION_COMMAND_OPTION_STRING,
        required: true
      }
    ]
  };
}

function plainInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.trunc(number)) : "-";
}

function formatPs99CommandDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.month}/${values.day}/${values.year} ${values.hour}:${values.minute}${String(values.dayPeriod || "").toUpperCase()}`;
}

function memberHasAllowedRole(interaction, env) {
  const allowedRoleIds = parseCsv(env.DISCORD_ALLOWED_ROLE_IDS);
  if (!allowedRoleIds.length) return true;

  const memberRoles = Array.isArray(interaction?.member?.roles)
    ? interaction.member.roles.map(role => String(role))
    : [];

  return memberRoles.some(roleId => allowedRoleIds.includes(roleId));
}

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

async function verifyDiscordRequest(request, env, body) {
  const publicKey = String(env.DISCORD_PUBLIC_KEY || "").trim();
  const signature = String(request.headers.get("X-Signature-Ed25519") || "").trim();
  const timestamp = String(request.headers.get("X-Signature-Timestamp") || "").trim();

  if (!publicKey || !signature || !timestamp) return false;

  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);
  const message = new TextEncoder().encode(timestamp + body);
  const algorithms = [
    { name: "Ed25519" },
    { name: "NODE-ED25519", namedCurve: "NODE-ED25519" }
  ];

  for (const algorithm of algorithms) {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        publicKeyBytes,
        algorithm,
        false,
        ["verify"]
      );
      const valid = await crypto.subtle.verify(algorithm, key, signatureBytes, message);
      if (valid) return true;
    } catch {
      // Try the next supported Ed25519 flavor.
    }
  }

  return false;
}

function getCommandOption(interaction, name) {
  const option = (interaction.data?.options || [])
    .find(item => String(item?.name || "").toLowerCase() === name);
  return String(option?.value || "").trim();
}

function messageResponse(content, forceEphemeral = false) {
  return {
    type: INTERACTION_RESPONSE_CHANNEL_MESSAGE,
    data: {
      content,
      flags: forceEphemeral ? MESSAGE_FLAG_EPHEMERAL : undefined
    }
  };
}

function displayName(row) {
  return row.display_name || row.username || `user_${row.user_id}`;
}

function rank(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `#${n.toLocaleString("en-US")}` : "Unranked";
}

function formatClanRank(row, run) {
  const rankValue = positiveInteger(row.clan_rank);
  if (!rankValue) return "Unranked";

  const memberCount = positiveInteger(
    row.clan_member_count ||
    row.total_clan_members ||
    run?.clan_member_count
  );

  return memberCount
    ? `${rankValue.toLocaleString("en-US")}/${memberCount.toLocaleString("en-US")}`
    : rank(rankValue);
}

function positiveInteger(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function shortNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  const tiers = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"]
  ];

  for (const [size, suffix] of tiers) {
    if (Math.abs(n) >= size) {
      return `${(n / size).toFixed(2).replace(/\.?0+$/, "")}${suffix}`;
    }
  }

  return n.toLocaleString("en-US");
}

function fullNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "-";
}

function betterThanLine(row) {
  const rankValue = Number(row.global_rank);
  const total = Number(row.total_global_players);

  if (!Number.isFinite(rankValue) || rankValue <= 0 || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  const betterThan = Math.max(0, total - rankValue) / total * 100;
  const better = Math.max(0, rankValue - 1) / total * 100;
  return `💠 Better than **${betterThan.toFixed(2)}%** of players; **${better.toFixed(2)}%** are better`;
}

function discordTime(value) {
  const ms = new Date(value || 0).getTime();
  if (!Number.isFinite(ms)) return "Unknown";
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

function ephemeralResponses(env) {
  return String(env.DISCORD_EPHEMERAL_RESPONSES || "false").toLowerCase() === "true";
}

function requireAdmin(request, env) {
  const expectedTokens = [
    env.REGISTER_ADMIN_TOKEN,
    env.INGEST_ADMIN_TOKEN
  ]
    .map(value => String(value || "").trim())
    .filter(Boolean);

  if (!expectedTokens.length) {
    throw httpError(500, "Missing REGISTER_ADMIN_TOKEN.");
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = String(match?.[1] || request.headers.get("X-C0LD-Admin-Token") || "").trim();

  if (!expectedTokens.includes(token)) {
    throw httpError(401, "Unauthorized.");
  }
}

function requiredEnv(env, name) {
  const value = String(env[name] || "").trim();
  if (!value) {
    throw httpError(500, `Missing ${name}.`);
  }
  return value;
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2 !== 0) {
    throw httpError(400, "Invalid hex value.");
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function interactionJson(data) {
  return json(data, 200);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(stripUndefined(data)), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }

  return value;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
