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
const LEAGUE_CHART_HOURS = [1, 6, 12, 24];
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
const CHART_LINE_RANGE = { label: "Ranks 1-4", min: 1, max: 4, cutoffRank: 3, challengerRank: 4 };
const CHART_LOOKBACK_HOURS = 1;
const CHART_PRIOR_PULL_TOLERANCE_MINUTES = 12;
const CHART_LARGE_GAP_BREAK_MINUTES = 25;
let chartDuckImagePromise = null;

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

      if (request.method === "POST" && url.pathname === "/admin/register-clan-command") {
        requireAdmin(request, env);
        return await registerClanCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-duck-command") {
        requireAdmin(request, env);
        return await registerDuckCommand(url, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/register-lg-command") {
        requireAdmin(request, env);
        return await registerLgCommand(url, env);
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

      if (request.method === "GET" && url.pathname === "/admin/lg-debug") {
        requireAdmin(request, env);
        return await lgDebug(url, env);
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
    if (parseLeagueChartCustomId(interaction.data?.custom_id)) {
      return interactionJson(handleLeagueChartComponent(interaction, env, ctx));
    }

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

  if (commandName === "clan" || commandName === "duck") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand !== "chart") {
      return interactionJson(messageResponse(`Use \`/${commandName} chart\`.`, true));
    }

    ctx.waitUntil(completeChartInteraction(interaction, env, commandName === "duck" ? "duck" : "clan"));

    return interactionJson({
      type: INTERACTION_RESPONSE_DEFERRED_CHANNEL_MESSAGE,
      data: {
        flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
      }
    });
  }

  if (commandName === "lg") {
    const subcommand = getSubcommandName(interaction);
    if (subcommand !== "info") {
      return interactionJson(messageResponse("Use `/lg info name:<league>`.", true));
    }

    const leagueName = getCommandOption(interaction, "name");
    if (!leagueName) {
      return interactionJson(messageResponse("Use `/lg info name:<league>`.", true));
    }

    ctx.waitUntil(completeLeagueInfoInteraction(interaction, env, leagueName));

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

async function completeLeagueInfoInteraction(interaction, env, leagueName, options = {}) {
  try {
    await editOriginalInteraction(interaction, await buildLeagueInfoMessage(leagueName, env, options));
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `League lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function buildLeagueInfoMessage(leagueName, env, options = {}) {
  const chartHours = leagueChartHours(options.chartHours);
  const payload = await fetchLeagueCurrentPayload(leagueName, env);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const members = rows
    .map(row => ({
      row,
      name: leagueMemberName(row),
      points: finiteNumber(row.total_points ?? row.points),
      gain1h: finiteNumber(row.gain_1h ?? row.hourly_points ?? row.one_hour_gain)
    }))
    .filter(item => item.points !== null)
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name)))
    .slice(0, 4);

  const leaguePoints = finiteNumber(payload.league_points)
    ?? members.reduce((sum, item) => sum + Math.max(0, item.points || 0), 0);
  const hourlyGain = rows
    .map(row => finiteNumber(row.gain_1h ?? row.hourly_points ?? row.one_hour_gain))
    .filter(value => value !== null)
    .reduce((sum, value) => sum + value, 0);

  const contributions = members.length
    ? members.map((item, index) => `#${index + 1} ${escapeDiscordMarkdown(item.name)} · ${shortNumber(item.points)} points · ${shortNumber(item.gain1h ?? 0)}/h`)
    : ["No member contributions found."];

  const displayLeagueName = String(payload.league_name || leagueName || "Unknown").trim() || "Unknown";
  const embed = {
    title: `League ${displayLeagueName}`,
    color: 0x58a6ff,
    description: [
      `Points: ${shortNumber(leaguePoints)} (${shortNumber(hourlyGain)}/h)`,
      `Global Rank: ${rank(payload.league_rank)}`,
      "",
      "---------------------------------",
      "",
      "Contributions",
      ...contributions
    ].join("\n")
  };

  const thumbnailUrl = leagueIconUrl(payload.league_icon);
  if (thumbnailUrl) {
    embed.thumbnail = { url: thumbnailUrl };
  }

  const message = {
    content: "",
    embeds: [embed],
    components: leagueChartComponents(displayLeagueName, chartHours),
    allowed_mentions: { parse: [] },
    flags: ephemeralResponses(env) ? MESSAGE_FLAG_EPHEMERAL : undefined
  };

  try {
    const historyPayload = await fetchLeagueHistoryPayload(displayLeagueName, env, chartHours);
    const chartBytes = await renderLeagueMemberGrowthChartPng(payload, historyPayload.rows || [], { hours: chartHours });
    if (chartBytes?.byteLength) {
      const filename = `league-${chartFilenamePart(displayLeagueName)}-${chartHours}h.png`;
      embed.image = { url: `attachment://${filename}` };
      message._file = { filename, contentType: "image/png", bytes: chartBytes };
    }
  } catch {
    // The command should still answer if the history chart cannot be rendered.
  }

  return message;
}

function handleLeagueChartComponent(interaction, env, ctx) {
  const state = parseLeagueChartCustomId(interaction.data?.custom_id);
  if (!state) {
    return messageResponse("That league chart control is no longer valid. Run `/lg info` again.", true);
  }

  ctx.waitUntil(completeLeagueInfoInteraction(interaction, env, state.leagueName, {
    chartHours: state.hours
  }));

  return { type: INTERACTION_RESPONSE_DEFERRED_MESSAGE_UPDATE };
}

async function fetchLeagueCurrentPayload(leagueName, env, options = {}) {
  const attempts = [];

  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/current", target.base);
    apiUrl.searchParams.set("league", leagueName);
    apiUrl.searchParams.set("rank_lookup", "false");
    apiUrl.searchParams.set("fresh", "1");

    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    attempts.push(result);

    if (result.response_ok && result.payload?.ok !== false && Array.isArray(result.payload?.rows) && result.payload.rows.length > 0) {
      return options.debug ? { payload: result.payload, attempts } : result.payload;
    }
  }

  const emptyOk = attempts.find(attempt => attempt.response_ok && attempt.payload?.ok !== false && attempt.row_count === 0);
  const last = attempts[attempts.length - 1] || {};
  const message = emptyOk
    ? `No stored league data found for ${leagueName}.`
    : last.message || `League API failed (${last.status || "unknown"}).`;
  const err = httpError(last.status || 502, message);
  err.attempts = attempts.map(attempt => leagueAttemptSummary(attempt));
  if (options.debug) {
    return { payload: null, attempts, error: err };
  }
  throw err;
}

function leagueChartHours(value) {
  const number = Number(value);
  return LEAGUE_CHART_HOURS.includes(number) ? number : 24;
}

function leagueChartComponents(leagueName, selectedHours) {
  const safeLeague = encodeURIComponent(String(leagueName || "").trim()).slice(0, 72);
  return [
    {
      type: COMPONENT_TYPE_ACTION_ROW,
      components: LEAGUE_CHART_HOURS.map(hours => ({
        type: COMPONENT_TYPE_BUTTON,
        style: hours === selectedHours ? BUTTON_STYLE_PRIMARY : BUTTON_STYLE_SECONDARY,
        label: `${hours}h`,
        custom_id: `lgchart:${hours}:${safeLeague}`
      }))
    }
  ];
}

function parseLeagueChartCustomId(value) {
  const text = String(value || "");
  const match = text.match(/^lgchart:(1|6|12|24):(.+)$/);
  if (!match) return null;

  return {
    hours: leagueChartHours(match[1]),
    leagueName: decodeURIComponent(match[2] || "").trim()
  };
}

async function fetchLeagueHistoryPayload(leagueName, env, hours = 24) {
  const historyHours = leagueChartHours(hours);
  for (const target of leagueApiTargets(env)) {
    const apiUrl = new URL("/api/leagues/history", target.base);
    apiUrl.searchParams.set("league", leagueName);
    apiUrl.searchParams.set("hours", String(Math.max(3, historyHours + 2)));
    apiUrl.searchParams.set("limit", "50000");

    const result = await fetchLeagueCurrentAttempt(target, apiUrl);
    if (result.response_ok && result.payload?.ok !== false && Array.isArray(result.payload?.rows)) {
      return result.payload;
    }
  }

  return { rows: [] };
}

async function renderLeagueMemberGrowthChartPng(payload, historyRows, options = {}) {
  const hours = leagueChartHours(options.hours);
  const fonts = await loadHistoryFonts();
  const width = 1600;
  const height = 720;
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 2);
  const color = chartColors();
  const members = leagueChartMembers(payload).slice(0, 4);
  const series = leagueMemberGrowthSeries(payload, historyRows, members, { hours });
  const displayLeagueName = String(payload?.league_name || "League").trim() || "League";

  chartPanel(canvas, 24, 24, width - 48, height - 48, color);
  canvas.drawFontText(fonts.bold, `League ${historyCardText(displayLeagueName, 44)}`, 58, 56, 34, color.white, 560);
  canvas.drawFontText(fonts.regular, `Hourly growth · last ${hours}h`, 60, 106, 18, color.muted, 520);

  const plot = { x: 104, y: 168, w: 1440, h: 424 };
  canvas.fillRect(plot.x, plot.y, plot.w, plot.h, color.inset);
  canvas.fillRect(plot.x, plot.y + plot.h, plot.w, 1, color.line);
  canvas.fillRect(plot.x, plot.y, 1, plot.h, color.line);

  const legend = series.slice(0, 4);
  legend.forEach((item, index) => {
    const x = 700 + index * 215;
    canvas.fillRect(x, 76, 34, 7, item.color);
    canvas.drawFontText(fonts.bold, historyCardText(item.name, 20), x + 46, 62, 17, item.color, 150);
    canvas.drawFontText(fonts.regular, `${shortNumber(Math.max(0, item.latestGain || 0))}/h`, x + 46, 91, 14, color.muted, 150);
  });

  if (!series.some(item => item.points.length >= 1)) {
    canvas.drawFontText(fonts.regular, "Not enough stored hourly history to chart this league yet.", plot.x + 28, plot.y + 48, 20, color.muted, plot.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const allPoints = series.flatMap(item => item.points);
  const minT = Math.min(...allPoints.map(point => point.t));
  const maxT = Math.max(...allPoints.map(point => point.t));
  const chartMinT = maxT - hours * 60 * 60 * 1000;
  const chartMaxT = maxT;
  const maxYValue = Math.max(1, ...allPoints.map(point => point.value));
  const yMin = 0;
  const yMax = maxYValue + Math.max(1, maxYValue * 0.14);
  const xFor = point => chartMaxT === chartMinT ? plot.x : plot.x + ((point.t - chartMinT) / (chartMaxT - chartMinT)) * plot.w;
  const yFor = point => yMax === yMin ? plot.y + plot.h / 2 : plot.y + (1 - ((point.value - yMin) / (yMax - yMin))) * plot.h;

  for (let i = 0; i <= 4; i += 1) {
    const yy = plot.y + (i / 4) * plot.h;
    const value = yMax - (i / 4) * (yMax - yMin);
    const label = shortNumber(value);
    const labelWidth = canvas.measureFontText(fonts.regular, label, 13);
    canvas.fillRect(plot.x, yy, plot.w, 1, color.grid);
    canvas.drawFontText(fonts.regular, label, Math.max(28, plot.x - labelWidth - 18), yy - 9, 14, color.muted, labelWidth + 8);
  }

  const xTickCount = hours <= 1 ? 2 : Math.min(12, hours);
  for (let i = 0; i <= xTickCount; i += 1) {
    const xx = plot.x + (i / xTickCount) * plot.w;
    const tickTime = chartMinT + (i / xTickCount) * (chartMaxT - chartMinT);
    const tickLabel = hours <= 1 ? chartTimeOfDayAxisLabel(tickTime) : chartHourAxisLabel(tickTime);
    const tickLabelWidth = canvas.measureFontText(fonts.regular, tickLabel, 13);
    const tickLabelX = i === 0
      ? plot.x
      : i === xTickCount
        ? plot.x + plot.w - tickLabelWidth
        : Math.max(plot.x, Math.min(plot.x + plot.w - tickLabelWidth, xx - tickLabelWidth / 2));
    canvas.fillRect(xx, plot.y, 1, plot.h, [25, 34, 45, 255]);
    canvas.drawFontText(fonts.regular, tickLabel, tickLabelX, plot.y + plot.h + 34, 13, color.muted, tickLabelWidth + 6);
  }

  series.forEach(item => {
    for (let index = 1; index < item.points.length; index += 1) {
      const previous = item.points[index - 1];
      const current = item.points[index];
      if (current.breakBefore) continue;
      chartDrawLine(canvas, xFor(previous), yFor(previous), xFor(current), yFor(previous), item.color, 3);
      chartDrawLine(canvas, xFor(current), yFor(previous), xFor(current), yFor(current), item.color, 3);
    }

    item.points.forEach(point => chartFillCircle(canvas, xFor(point), yFor(point), 3, item.color));
    const last = item.points[item.points.length - 1];
    if (last) chartFillCircle(canvas, xFor(last), yFor(last), 6, item.color);
  });

  canvas.drawFontText(fonts.regular, `Updated ${chartDate(payload?.snapshot_at || payload?.fetched_at || payload?.updated_at)}`, 58, height - 56, 16, color.muted, 620);

  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function leagueChartMembers(payload) {
  return (Array.isArray(payload?.rows) ? payload.rows : [])
    .map(row => ({
      row,
      id: String(row.user_id || row.UserID || "").trim(),
      name: leagueMemberName(row),
      points: finiteNumber(row.total_points ?? row.points),
      gain1h: finiteNumber(row.gain_1h ?? row.hourly_points ?? row.one_hour_gain)
    }))
    .filter(item => item.id && item.points !== null)
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name)));
}

function leagueMemberGrowthSeries(payload, historyRows, members, options = {}) {
  const hours = leagueChartHours(options.hours);
  const bucketMs = 60 * 60 * 1000;
  const windowMs = hours * 60 * 60 * 1000;
  const history = Array.isArray(historyRows) ? historyRows : [];
  const currentAt = leagueChartTime(payload?.snapshot_at || payload?.fetched_at || payload?.updated_at) || Date.now();
  const historyTimes = history.map(row => leagueChartTime(row.fetched_at || row.snapshot_at || row.created_at)).filter(Number.isFinite);
  const latest = Math.max(currentAt, ...historyTimes, Date.now() - bucketMs);
  const end = Math.ceil(latest / bucketMs) * bucketMs;
  const start = end - windowMs;
  const buckets = Array.from({ length: Math.floor(windowMs / bucketMs) + 1 }, (_, index) => start + index * bucketMs);
  const byUser = new Map();

  for (const row of history) {
    const id = String(row.user_id || row.UserID || "").trim();
    const time = leagueChartTime(row.fetched_at || row.snapshot_at || row.created_at);
    const points = finiteNumber(row.total_points ?? row.points);
    if (!id || !Number.isFinite(time) || points === null) continue;
    if (!byUser.has(id)) byUser.set(id, []);
    byUser.get(id).push({ time, points });
  }

  const colors = [
    [255, 123, 114, 255],
    [88, 166, 255, 255],
    [126, 231, 135, 255],
    [242, 204, 96, 255]
  ];

  return members.map((member, index) => {
    const samples = [...(byUser.get(member.id) || []), { time: currentAt, points: member.points }]
      .filter(sample => Number.isFinite(sample.time) && sample.points !== null)
      .sort((a, b) => a.time - b.time);
    const points = [];
    let sampleIndex = 0;
    let lastValue = null;
    let previousValue = null;
    let hasBaseline = false;
    let lastBucketWasGap = false;

    for (const bucketEnd of buckets) {
      while (sampleIndex < samples.length && samples[sampleIndex].time <= bucketEnd) {
        lastValue = samples[sampleIndex].points;
        sampleIndex += 1;
      }

      if (!hasBaseline) {
        if (lastValue !== null) {
          previousValue = lastValue;
          hasBaseline = true;
        }
        lastBucketWasGap = true;
        continue;
      }

      if (previousValue === null || lastValue === null) {
        lastBucketWasGap = true;
        continue;
      }

      const hourlyGain = Math.max(0, lastValue - previousValue);
      points.push({ t: bucketEnd, value: hourlyGain, breakBefore: lastBucketWasGap });
      previousValue = lastValue;
      lastBucketWasGap = false;
    }

    const latestGain = points[points.length - 1]?.value ?? Math.max(0, member.gain1h || 0);

    return {
      id: member.id,
      name: member.name,
      color: colors[index % colors.length],
      points,
      latestGain,
      gain: points.reduce((sum, point) => sum + Math.max(0, point.value || 0), 0)
    };
  });
}

function leagueChartTime(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function leagueApiTargets(env) {
  const defaultBase = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const bases = [...new Set([String(env.LEAGUE_API_BASE || "").trim(), defaultBase].filter(Boolean))]
    .map(base => base.replace(/\/$/, ""));
  const targets = [];

  if (hasLeagueApiServiceBinding(env)) {
    targets.push({
      source: "service_binding",
      base: "https://yamo-league-api-worker.service",
      binding: env.LEAGUE_API_WORKER
    });
  }

  for (const base of bases) {
    targets.push({
      source: base === defaultBase ? "default_public_url" : "configured_public_url",
      base,
      binding: null
    });
  }

  return targets;
}

async function fetchLeagueCurrentAttempt(target, apiUrl) {
  const init = {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-Discord-League-Worker"
    },
    cf: { cacheTtl: 0, cacheEverything: false }
  };
  const request = new Request(apiUrl.toString(), init);
  const response = target.binding
    ? await target.binding.fetch(request)
    : await fetch(request);
  const text = await response.text();
  const payload = parseJsonObject(text);

  return {
    source: target.source,
    api_url: apiUrl.toString(),
    status: response.status,
    response_ok: response.ok,
    payload,
    payload_ok: payload?.ok ?? null,
    message: payload?.message || (!response.ok ? truncateText(text, 180) : null),
    row_count: Array.isArray(payload?.rows) ? payload.rows.length : null,
    league_name: payload?.league_name || null,
    league_rank: payload?.league_rank ?? null
  };
}

function parseJsonObject(text) {
  try {
    const parsed = JSON.parse(text || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function truncateText(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}…` : text;
}

function leagueAttemptSummary(attempt) {
  return {
    source: attempt.source,
    api_url: attempt.api_url,
    status: attempt.status,
    response_ok: attempt.response_ok,
    payload_ok: attempt.payload_ok,
    message: attempt.message,
    row_count: attempt.row_count,
    league_name: attempt.league_name,
    league_rank: attempt.league_rank
  };
}

function leagueMemberName(row) {
  return row.display_name || row.username || `user_${row.user_id}`;
}

function leagueIconUrl(icon) {
  const text = String(icon || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;

  const assetMatch = text.match(/rbxassetid:\/\/(\d+)/i);
  const assetId = assetMatch ? assetMatch[1] : /^\d+$/.test(text) ? text : "";
  return assetId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(assetId)}` : "";
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
    await editOriginalInteraction(interaction, await renderHistoryMessage(history, {
      ownerId: state.ownerId,
      view: state.view,
      page: state.page,
      pageSize: historyPageSize(env),
      imageEnabled: historyImageResponses(env)
    }));
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `History lookup failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function completeChartInteraction(interaction, env, chartType) {
  try {
    const message = chartType === "duck"
      ? await buildDuckChartMessage(env)
      : await buildClanChartMessage(env);
    await editOriginalInteraction(interaction, message);
  } catch (err) {
    await editOriginalInteraction(interaction, {
      content: `Chart render failed: ${err?.message || String(err)}`,
      embeds: [],
      components: [],
      attachments: [],
      allowed_mentions: { parse: [] }
    }).catch(() => null);
  }
}

async function editOriginalInteraction(interaction, data) {
  const applicationId = String(interaction.application_id || "").trim();
  const token = String(interaction.token || "").trim();
  if (!applicationId || !token) throw httpError(500, "Discord interaction token is missing.");

  const endpoint = `${DISCORD_API_BASE}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(token)}/messages/@original`;
  const { _file, ...messageData } = data || {};
  const payload = stripUndefined(messageData);
  let body;
  let headers;

  if (_file?.bytes?.byteLength) {
    payload.attachments = [{ id: 0, filename: _file.filename }];
    const form = new FormData();
    form.append("payload_json", JSON.stringify(payload));
    form.append("files[0]", new Blob([_file.bytes], { type: _file.contentType || "image/png" }), _file.filename);
    body = form;
    headers = { Accept: "application/json" };
  } else {
    body = JSON.stringify(payload);
    headers = { "Content-Type": "application/json", Accept: "application/json" };
  }

  const res = await fetch(endpoint, { method: "PATCH", headers, body });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw httpError(502, payload.message || `Discord history response update failed (${res.status}).`);
  }
}

function interactionUserId(interaction) {
  return String(interaction?.member?.user?.id || interaction?.user?.id || "").trim();
}

function historyCustomId(ownerId, targetId, view, page, action = "open") {
  return ["history", ownerId, targetId, view, Math.max(0, Math.trunc(Number(page) || 0)), action].join("|");
}

function parseHistoryCustomId(value) {
  const parts = String(value || "").split("|");
  if (![5, 6].includes(parts.length) || parts[0] !== "history") return null;
  const ownerId = String(parts[1] || "");
  const targetId = String(parts[2] || "");
  const view = String(parts[3] || "").toLowerCase();
  const page = Math.max(0, Math.trunc(Number(parts[4]) || 0));
  const action = String(parts[5] || "open");
  if (!/^\d+$/.test(ownerId) || !/^\d+$/.test(targetId) || !HISTORY_VIEWS.includes(view) || !/^[a-z_]+$/.test(action)) return null;
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
      clan_name: latest.clan_name || scanClan,
      rank: finiteHistoryNumber(latest.rank),
      points: finiteHistoryNumber(latest.total_points ?? latest.points),
      battle_end_iso: battle.battle_end_iso || null,
      is_active: battle.is_active === true
    };
    })).filter(Boolean);

  const leaderboardRows = summarizeGlobalHistory(globalPayload);
  const clanMap = new Map();
  for (const row of liveClanRows) mergeClanHistoryRecord(clanMap, row);
  for (const row of staticClanHistoryRows(staticProfile, scanClan)) mergeClanHistoryRecord(clanMap, row);
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
  const avatarUrl = absoluteProfileAssetUrl(subject.avatarUrl, env)
    || absoluteProfileAssetUrl(staticProfile?.avatar_url, env);

  return {
    user_id: subject.userId,
    username: globalPayload?.row ? displayName(globalPayload.row) : staticProfile?.username || subject.username || `user_${subject.userId}`,
    avatar_url: avatarUrl || null,
    current_clan: globalPayload?.row?.source_clan || globalPayload?.row?.clan_name || null,
    clan_join_time: globalPayload?.row?.join_time || null,
    clan: [...clanMap.values()],
    league: leagueRows,
    league_unavailable: leagueHistory === null && leagueRows.length === 0,
    leaderboard: combinedLeaderboardRows
  };
}

function summarizeTrackedClanHistory(rows, battleRows) {
  const battles = new Map((Array.isArray(battleRows) ? battleRows : []).map(row => [
    historyRecordKey(row.battle || row.battle_key),
    {
      name: row.display_name || row.battle_display_name || row.battle || row.battle_key,
      battle_end_iso: row.battle_end_iso || null,
      is_active: row.is_active === true
    }
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
    ...battles.keys(),
    ...[...latestByBattle.keys()].filter(key => !battles.has(key))
  ];
  return orderedKeys.flatMap(key => {
    const row = latestByBattle.get(key);
    const battle = battles.get(key) || {};
    return row ? [{
      key,
      name: historyRecordName(battle.name || row.battle_key),
      source: "site",
      clan_name: row.clan_name || null,
      rank: finiteHistoryNumber(row.rank),
      points: finiteHistoryNumber(row.total_points ?? row.points),
      battle_end_iso: battle.battle_end_iso || null,
      is_active: battle.is_active === true
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
  const defaultBase = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const bases = [...new Set([String(env.LEAGUE_API_BASE || "").trim(), defaultBase].filter(Boolean))];
  const limits = [2000, 500];
  const binding = env.LEAGUE_API_WORKER;
  const targets = [];
  if (binding && typeof binding.fetch === "function") {
    targets.push({ type: "binding", base: defaultBase });
  }
  targets.push(...bases.map(base => ({ type: "public", base })));
  let emptyPayload = null;

  for (const target of targets) {
    for (const limit of limits) {
      let url;
      try {
        url = new URL("/api/leagues/profile", String(target.base || "").replace(/\/$/, ""));
      } catch {
        continue;
      }
      url.searchParams.set("user_id", String(userId));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("summary_limit", "100");
      const headers = { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" };
      const res = await (target.type === "binding"
        ? binding.fetch(new Request(url.toString(), { headers }))
        : fetch(url, {
            headers,
            cf: { cacheTtl: 0, cacheEverything: false }
          })
      ).catch(() => null);
      if (!res) continue;
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.ok === false) continue;
      const normalized = {
        ...payload,
        rows: leagueHistoryPayloadRows(payload)
      };
      if (normalized.rows.length) return normalized;
      emptyPayload ||= normalized;
    }
  }
  return emptyPayload;
}

function leagueHistoryPayloadRows(payload) {
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.league_summaries)) return payload.league_summaries;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchStaticHistoryProfile(userId, env) {
  const base = String(env.PROFILE_DATA_BASE || "https://c0ld-clan.com/Data/players").replace(/\/$/, "");
  const res = await fetch(`${base}/${encodeURIComponent(userId)}.json`, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-History-Worker" }
  });
  return res.ok ? res.json().catch(() => null) : null;
}

function staticClanHistoryRows(profile, defaultClan = null) {
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
        clan_name: row.clan_name || latest.clan_name || defaultClan,
        rank: finiteHistoryNumber(row.ending_rank ?? row.end_rank ?? row.last_rank ?? latest.rank),
        points: finiteHistoryNumber(row.ending_points ?? latest.points ?? latest.total_points)
      };
    })
    .filter(row => row.key && (row.rank !== null || row.points !== null));
}

function externalClanHistoryRows(rows, source) {
  return (Array.isArray(rows) ? rows : []).map(row => {
    const isCwBot = source === "cw_bot";
    const clanRank = finiteHistoryNumber(row.clan_rank ?? (!isCwBot ? row.final_rank : null));
    const totalClanMembers = finiteHistoryNumber(row.total_clan_members ?? (!isCwBot ? row.total_ranked : null));
    const globalRank = finiteHistoryNumber(row.global_rank ?? (isCwBot ? row.final_rank : null));
    const totalGlobalPlayers = finiteHistoryNumber(row.total_global_players ?? (isCwBot ? row.total_ranked : null));
    return {
      key: historyRecordKey(row.battle_key || row.battle_name),
      name: historyRecordName(row.battle_name || row.battle_key),
      source,
      clan_name: row.clan_name || null,
      rank: clanRank,
      total_ranked: totalClanMembers,
      global_rank: globalRank,
      total_global_players: totalGlobalPlayers,
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
      clan_name: row.source_clan || row.clan_name || null,
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
  return (Array.isArray(rows) ? rows : []).map(row => {
    const fallbackPeriod = [
      row.league_run_key,
      row.league_name,
      row.period_start_at || row.first_snapshot_at
    ].filter(Boolean).join(":");
    return {
      key: historyRecordKey(row.league_period_key || row.label_key || row.run_label || row.event_name || fallbackPeriod),
      name: historyRecordName(row.run_label || row.event_name || row.label || row.league_period_key || row.league_name || "League"),
      league_name: row.league_name || null,
      league_rank: finiteHistoryNumber(row.league_rank ?? row.final_league_rank ?? row.rank),
      player_rank: finiteHistoryNumber(row.player_league_rank ?? row.member_rank ?? row.final_rank ?? row.best_rank),
      points: finiteHistoryNumber(row.final_points ?? row.points ?? row.highest_points)
    };
  }).filter(row => row.key && (row.league_rank !== null || row.player_rank !== null || row.points !== null));
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
    clan_name: primary.clan_name || secondary.clan_name || null,
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

async function buildClanChartMessage(env) {
  const data = await loadClanChartData(env);
  const filename = `c0ld-clan-chart-${chartFilenamePart(data.current?.battle || "current")}.png`;
  const bytes = await renderClanLineChartPng(data);
  return {
    content: null,
    embeds: [{
      color: 0x58a6ff,
      image: { url: `attachment://${filename}` }
    }],
    allowed_mentions: { parse: [] },
    _file: { filename, contentType: "image/png", bytes }
  };
}

async function buildDuckChartMessage(env) {
  const data = await loadClanChartData(env, { history: false });
  const filename = `c0ld-duck-chart-${chartFilenamePart(data.current?.battle || "current")}.png`;
  const bytes = await renderDuckChartPng(data.current, env);
  return {
    content: null,
    embeds: [{
      color: 0xf2cc60,
      image: { url: `attachment://${filename}` }
    }],
    allowed_mentions: { parse: [] },
    _file: { filename, contentType: "image/png", bytes }
  };
}

async function loadClanChartData(env, options = {}) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const currentUrl = clanApiUrl(env, "/api/clans/current", apiBase);
  currentUrl.searchParams.set("fresh", "1");
  const currentResponse = await fetchClanApi(env, currentUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const current = await currentResponse.json().catch(() => ({}));
  if (!currentResponse.ok || current.ok === false) {
    throw httpError(currentResponse.status || 502, current.message || `Clan current API failed (${currentResponse.status}).`);
  }

  if (options.history === false) return { current, history: { rows: [] } };

  const historyUrl = clanApiUrl(env, "/api/clans/history", apiBase);
  historyUrl.searchParams.set("battle", current.battle || "current");
  historyUrl.searchParams.set("hours", String(chartHistoryHoursForBattle(current)));
  historyUrl.searchParams.set("rank_min", String(CHART_LINE_RANGE.min));
  historyUrl.searchParams.set("rank_max", String(CHART_LINE_RANGE.max));
  historyUrl.searchParams.set("bucket_minutes", "5");
  historyUrl.searchParams.set("include_baseline", "1");
  historyUrl.searchParams.set("limit", "50000");
  historyUrl.searchParams.set("order", "asc");
  const historyResponse = await fetchClanApi(env, historyUrl, {
    headers: { Accept: "application/json", "User-Agent": "c0ld-Discord-Chart-Worker" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  const history = await historyResponse.json().catch(() => ({ rows: [] }));

  return {
    current,
    history: historyResponse.ok && history.ok !== false ? history : { rows: [] }
  };
}

async function renderClanLineChartPng(data) {
  const fonts = await loadHistoryFonts();
  const width = 1200;
  const height = 675;
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 1);
  const color = chartColors();
  const rows = chartCurrentRows(data.current)
    .filter(row => row.rank >= CHART_LINE_RANGE.min && row.rank <= CHART_LINE_RANGE.max)
    .slice(0, CHART_LINE_RANGE.max - CHART_LINE_RANGE.min + 1);
  const series = rows
    .map((row, index) => chartBuildHourlyGainSeries(row, data.history, index, data.current))
    .filter(item => item.points.length >= 1);
  const title = `${data.current?.display_name || data.current?.battle || "Current Battle"} - Clan Line Chart`;
  const subtitle = `${CHART_LINE_RANGE.label} actual hourly gains`;

  chartPanel(canvas, 24, 24, width - 48, height - 48, color);
  canvas.drawFontText(fonts.bold, title, 52, 48, 28, color.white, 760);
  canvas.drawFontText(fonts.regular, subtitle, 54, 86, 15, color.muted, 760);
  canvas.drawFontText(fonts.regular, `Snapshot ${chartDate(data.current?.snapshot_at || data.current?.generated_at)}`, 930, 60, 13, color.muted, 220);

  const plot = { x: 76, y: 116, w: 968, h: 450 };
  canvas.fillRect(plot.x, plot.y, plot.w, plot.h, color.inset);
  canvas.fillRect(plot.x, plot.y + plot.h, plot.w, 1, color.line);
  canvas.fillRect(plot.x, plot.y, 1, plot.h, color.line);

  if (!series.length) {
    canvas.drawFontText(fonts.regular, "Not enough actual hourly gain data is available for Ranks 1-4 yet.", plot.x + 28, plot.y + 38, 18, color.muted, plot.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const allPoints = series.flatMap(item => item.points);
  const minT = Math.min(...allPoints.map(point => point.t));
  const maxT = Math.max(...allPoints.map(point => point.t));
  const minY = Math.min(...allPoints.map(point => point.pointsGained));
  const maxY = Math.max(...allPoints.map(point => point.pointsGained));
  const yPad = Math.max((maxY - minY) * 0.1, 1000);
  const yMin = Math.max(0, minY - yPad);
  const yMax = maxY + yPad;
  const xFor = point => maxT === minT ? plot.x : plot.x + ((point.t - minT) / (maxT - minT)) * plot.w;
  const yFor = point => yMax === yMin ? plot.y + plot.h / 2 : plot.y + (1 - ((point.pointsGained - yMin) / (yMax - yMin))) * plot.h;

  for (let i = 0; i <= 4; i += 1) {
    const yy = plot.y + (i / 4) * plot.h;
    const value = yMax - (i / 4) * (yMax - yMin);
    const label = shortNumber(value);
    const labelWidth = canvas.measureFontText(fonts.regular, label, 12);
    const labelX = Math.max(34, plot.x - 14 - labelWidth);
    canvas.fillRect(plot.x, yy, plot.w, 1, color.grid);
    chartDrawBackedText(canvas, fonts.regular, label, labelX, yy - 8, 12, color.muted, labelWidth + 2, color.panel);
  }

  [...series]
    .sort((a, b) => Number(a.isCutoffPair) - Number(b.isCutoffPair))
    .forEach(item => {
    for (let index = 1; index < item.points.length; index += 1) {
      if (item.points[index].breakBefore) continue;
      chartDrawLine(canvas, xFor(item.points[index - 1]), yFor(item.points[index - 1]), xFor(item.points[index]), yFor(item.points[index]), item.color, item.isCutoffPair ? 3 : 2);
    }
    const last = item.points[item.points.length - 1];
    chartFillCircle(canvas, xFor(last), yFor(last), item.isCutoffPair ? 5 : 4, item.color);
    chartDrawBackedText(
      canvas,
      fonts.bold,
      `#${item.rank} ${item.clan_name}`,
      Math.min(plot.x + plot.w - 130, xFor(last) + 8),
      Math.max(plot.y + 8, Math.min(plot.y + plot.h - 18, yFor(last) - 8)),
      12,
      item.color,
      122,
      [13, 19, 27, 255]
    );
  });

  chartDrawBackedText(canvas, fonts.regular, chartTimeLabel(minT), plot.x, plot.y + plot.h + 18, 12, color.muted, 160, color.panel);
  const lastLabel = chartTimeLabel(maxT);
  const lastLabelWidth = canvas.measureFontText(fonts.regular, lastLabel, 12);
  chartDrawBackedText(canvas, fonts.regular, lastLabel, plot.x + plot.w - lastLabelWidth, plot.y + plot.h + 18, 12, color.muted, 180, color.panel);

  const legendX = 1062;
  canvas.drawFontText(fonts.bold, CHART_LINE_RANGE.label, legendX, 126, 18, color.white, 110);
  series.forEach((item, index) => {
    const y = 158 + index * 58;
    const latest = item.points[item.points.length - 1];
    canvas.fillRect(legendX, y + 7, 20, 4, item.color);
    canvas.drawFontText(fonts.bold, `#${item.rank}`, legendX + 28, y, 12, item.color, 36);
    canvas.drawFontText(fonts.regular, item.clan_name, legendX + 64, y, 12, color.white, 88);
    canvas.drawFontText(fonts.regular, `${shortNumber(latest.pointsGained)}/hr`, legendX + 64, y + 15, 10, color.muted, 88);
    canvas.drawFontText(fonts.regular, shortNumber(item.current.points), legendX + 64, y + 30, 10, color.muted, 88);
  });

  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", 52, height - 42, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

async function renderDuckChartPng(current, env) {
  const fonts = await loadHistoryFonts();
  const duckImage = await loadChartDuckImage(env).catch(() => null);
  const width = 1200;
  const height = 675;
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 1);
  const color = chartColors();
  const rows = chartCurrentRows(current).filter(row => row.rank >= 1 && row.rank <= 10).slice(0, 10);
  const title = `${current?.display_name || current?.battle || "Current Battle"} - Duck Chart`;

  chartPanel(canvas, 24, 24, width - 48, height - 48, color);
  canvas.drawFontText(fonts.bold, title, 52, 48, 30, color.white, 720);
  canvas.drawFontText(fonts.regular, `Snapshot ${chartDate(current?.snapshot_at || current?.generated_at)}`, 54, 88, 15, color.muted, 420);

  const track = { x: 52, y: 126, w: 1096, h: 480 };
  canvas.fillRect(track.x, track.y, track.w, track.h, [10, 49, 74, 255]);
  for (let stripe = 0; stripe < track.w; stripe += 36) {
    canvas.fillRect(track.x + stripe, track.y + 58, 18, track.h - 58, stripe % 72 === 0 ? [25, 82, 113, 255] : [14, 61, 91, 255]);
  }
  canvas.fillRect(track.x, track.y, track.w, 58, [61, 127, 51, 255]);
  canvas.fillRect(track.x, track.y + 56, track.w, 4, [123, 79, 38, 255]);
  [132, 195, 262].forEach((x, index) => chartFillCircle(canvas, track.x + x, track.y + 28 + (index % 2) * 7, 22 + index * 2, [95, 189, 78, 255]));
  const finishX = track.x + track.w - 58;
  for (let y = track.y + 58; y < track.y + track.h; y += 20) {
    const odd = Math.floor((y - track.y) / 20) % 2;
    canvas.fillRect(finishX, y, 20, 20, odd ? color.black : color.white);
    canvas.fillRect(finishX + 20, y, 20, 20, odd ? color.white : color.black);
  }

  if (!rows.length) {
    canvas.drawFontText(fonts.regular, "No top 10 clan rows are available yet.", track.x + 28, track.y + 94, 18, color.muted, track.w - 56);
    return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
  }

  const points = rows.map(row => Number(row.points || 0));
  const minPoints = Math.min(...points);
  const maxPoints = Math.max(...points);
  const range = maxPoints - minPoints;
  const logos = await chartLoadClanLogos(rows, env);
  const scale = 1;
  const duckWidth = 148 * scale;
  const duckHeight = 134 * scale;
  const racers = rows.map((row, index) => {
    const progress = range > 0 ? (Number(row.points || 0) - minPoints) / range : 1 - index * 0.08;
    const laneLeft = 5 + Math.max(0, Math.min(1, progress)) * 88;
    const left = Math.min(track.x + laneLeft / 100 * track.w, track.x + track.w - duckWidth - 10);
    const x = left + duckWidth / 2;
    const y = track.y + track.h - 46 - duckHeight / 2;
    const next = rows[index + 1];
    const lead = next ? Number(row.points || 0) - Number(next.points || 0) : null;
    return {
      row,
      index,
      x,
      y,
      lead,
      labelLift: (index % 4) * 18,
      logo: logos.get(chartNormalize(row.clan_name)) || null
    };
  });

  racers.slice().reverse().forEach(racer => {
    chartDrawDuck(canvas, fonts, racer.row, racer.index, racer.x, racer.y, scale, color, {
      duckImage,
      logo: racer.logo,
      lead: racer.lead,
      labelLift: racer.labelLift
    });
  });

  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", 52, height - 42, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function chartBuildHourlyGainSeries(currentRow, history, index, context) {
  const key = chartNormalize(currentRow.clan_name);
  const rows = (history?.rows || [])
    .map(row => chartNormalizeClanRow(row, context))
    .filter(row => chartNormalize(row.clan_name) === key && row.points !== null && row.t)
    .sort((a, b) => a.t - b.t);
  const currentPoint = chartNormalizeClanRow(currentRow, context);
  if (currentPoint.t && currentPoint.points !== null && !rows.some(point => point.t === currentPoint.t)) rows.push(currentPoint);
  const points = chartBuildHourlyPoints(chartDedupePullRows(rows), currentRow);
  return {
    clan_name: currentRow.clan_name,
    rank: currentRow.rank,
    current: currentRow,
    color: chartClanColor(currentRow.clan_name, index),
    isCutoffPair: currentRow.rank === CHART_LINE_RANGE.cutoffRank || currentRow.rank === CHART_LINE_RANGE.challengerRank,
    points
  };
}

function chartDedupePullRows(rows) {
  const byTime = new Map();
  for (const row of rows || []) {
    if (!row?.t || row.points === null) continue;
    const existing = byTime.get(row.t);
    if (!existing || row.points >= existing.points) byTime.set(row.t, row);
  }
  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

function chartFindPriorHourPoint(rows, targetT) {
  const targetPrior = targetT - CHART_LOOKBACK_HOURS * 60 * 60 * 1000;
  const tolerance = CHART_PRIOR_PULL_TOLERANCE_MINUTES * 60 * 1000;
  let best = null;

  for (const row of rows || []) {
    const diff = Math.abs(row.t - targetPrior);
    if (diff > tolerance) continue;
    if (!best || diff < best.diff) best = { row, diff };
  }

  return best?.row || null;
}

function chartBuildHourlyPoints(rows, clanRow) {
  const points = [];
  for (const current of rows || []) {
    const prior = chartFindPriorHourPoint(rows, current.t);
    if (!prior) continue;

    const gain = current.points - prior.points;
    if (!Number.isFinite(gain) || gain < 0) continue;

    const previous = points[points.length - 1];
    const gapMinutes = previous ? (current.t - previous.t) / 60000 : 5;
    points.push({
      t: current.t,
      priorT: prior.t,
      pointsGained: gain,
      totalPoints: current.points,
      rank: current.rank ?? clanRow.rank,
      breakBefore: gapMinutes > CHART_LARGE_GAP_BREAK_MINUTES
    });
  }
  return points;
}

function chartHistoryHoursForBattle(current) {
  const start = Date.parse(String(current?.battle_start_iso || ""));
  const end =
    Date.parse(String(current?.snapshot_at || "")) ||
    Date.parse(String(current?.generated_at || "")) ||
    Date.now();

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const hours = Math.ceil((end - start) / (60 * 60 * 1000)) + 6;
    return Math.max(24, Math.min(336, hours));
  }

  return 168;
}

function chartBattleEndMs(context) {
  const ms = Date.parse(String(context?.battle_end_iso || context?.battle_ended_at || ""));
  return Number.isFinite(ms) ? ms : null;
}

function chartCurrentRows(payload) {
  return (payload?.rows || [])
    .map(row => chartNormalizeClanRow(row, payload))
    .filter(row => row.clan_name && row.rank !== null && row.points !== null)
    .sort((a, b) => a.rank - b.rank);
}

function chartNormalizeClanRow(row, context) {
  const explicitT = chartFinite(row.t);
  let t = explicitT === null
    ? Date.parse(String(row.fetched_at || row.snapshot_at || row.generated_at || "")) || Date.parse(String(row.last_updated || "")) || 0
    : explicitT;
  const endMs = chartBattleEndMs(context);
  if (endMs !== null && t > endMs) t = endMs;

  return {
    t,
    rank: chartFinite(row.rank) === null ? null : Math.round(Number(row.rank)),
    clan_name: String(row.clan_name || row.clan || row.name || row.tag || "").replace(/★/g, "").trim(),
    points: chartFinite(row.points ?? row.total_points),
    icon_url: row.icon_url || row.logo_url || row.image_url || null,
    icon_id: row.icon_id || row.logo_id || null
  };
}

async function loadChartDuckImage(env) {
  if (!chartDuckImagePromise) {
    const siteBase = String(env.SITE_BASE_URL || "https://c0ld-clan.com").replace(/\/$/, "");
    const duckUrl = `${siteBase}/assets/duck-race-duck.png`;
    chartDuckImagePromise = fetch(duckUrl, {
      headers: { Accept: "image/png,image/*;q=0.8", "User-Agent": "c0ld-Discord-Chart-Worker" },
      cf: { cacheTtl: 3600, cacheEverything: true }
    })
      .then(async response => response.ok ? decodeHistoryPng(new Uint8Array(await response.arrayBuffer())) : null)
      .catch(() => null);
  }
  return chartDuckImagePromise;
}

async function chartLoadClanLogos(rows, env) {
  const entries = await Promise.all((rows || []).map(async row => {
    const url = chartClanIconUrl(row, env);
    if (!url) return null;
    const image = await loadHistoryAvatar(url).catch(() => null);
    return image ? [chartNormalize(row.clan_name), image] : null;
  }));
  return new Map(entries.filter(Boolean));
}

function chartClanIconUrl(row, env) {
  const url = row?.icon_url || row?.logo_url || row?.image_url;
  if (url) return absoluteProfileAssetUrl(url, env);
  const iconId = String(row?.icon_id || row?.logo_id || "").trim();
  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null;
}

function chartFinite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function chartNormalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function chartClanColor(name, index = 0) {
  const specials = { c0ld: [255, 155, 150, 255], wmsy: [116, 217, 159, 255], nong: [246, 173, 85, 255] };
  const palette = [
    [88, 166, 255, 255], [210, 168, 255, 255], [121, 192, 255, 255], [255, 166, 87, 255], [165, 214, 255, 255],
    [255, 123, 114, 255], [63, 185, 80, 255], [242, 204, 96, 255], [219, 97, 162, 255], [86, 212, 221, 255]
  ];
  return specials[chartNormalize(name)] || palette[index % palette.length];
}

function chartColors() {
  return {
    panel: [22, 29, 39, 255],
    header: [25, 33, 44, 255],
    inset: [13, 19, 27, 255],
    line: [48, 60, 75, 255],
    grid: [35, 45, 58, 255],
    white: [239, 245, 252, 255],
    muted: [176, 188, 204, 255],
    red: [255, 100, 105, 255],
    blue: [88, 166, 255, 255],
    gold: [242, 204, 96, 255],
    black: [10, 12, 16, 255]
  };
}

function chartPanel(canvas, x, y, width, height, color) {
  canvas.fillRect(x, y, width, height, color.panel);
  canvas.fillRect(x, y, width, 1, color.line);
  canvas.fillRect(x, y + height - 1, width, 1, color.line);
  canvas.fillRect(x, y, 1, height, color.line);
  canvas.fillRect(x + width - 1, y, 1, height, color.line);
  canvas.fillRect(x, y, 6, height, color.red);
}

function chartDrawBackedText(canvas, font, value, x, y, size, rgba, maxWidth, background) {
  const fitted = canvas.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
  const textWidth = canvas.measureFontText(font, fitted, size);
  canvas.fillRect(x - 4, y - 3, textWidth + 8, Math.ceil(size * 1.7), background);
  canvas.drawFontText(font, fitted, x, y, size, rgba, maxWidth);
}

function chartDrawLine(canvas, x1, y1, x2, y2, rgba, width = 2) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
  for (let i = 0; i <= steps; i += 1) {
    const pct = i / steps;
    const x = x1 + (x2 - x1) * pct;
    const y = y1 + (y2 - y1) * pct;
    canvas.fillRect(x - width / 2, y - width / 2, width, width, rgba);
  }
}

function chartFillCircle(canvas, cx, cy, radius, rgba) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) canvas.fillRect(cx + x, cy + y, 1, 1, rgba);
    }
  }
}

function chartFillEllipse(canvas, cx, cy, rx, ry, rgba) {
  for (let y = -ry; y <= ry; y += 1) {
    for (let x = -rx; x <= rx; x += 1) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) canvas.fillRect(cx + x, cy + y, 1, 1, rgba);
    }
  }
}

function chartDrawDuck(canvas, fonts, row, index, x, y, scale, color, options = {}) {
  const duck = [255, 242, 0, 255];
  const outline = color.black;
  const red = [255, 45, 32, 255];
  const accent = chartClanColor(row.clan_name, index);
  const duckWidth = 148 * scale;
  const duckHeight = 134 * scale;
  const duckLeft = x - duckWidth / 2;
  const duckTop = y - duckHeight / 2;

  if (options.duckImage) {
    canvas.drawImageStretch(options.duckImage, duckLeft, duckTop, duckWidth, duckHeight);
  } else {
    const sx = value => x + value * scale;
    const sy = value => duckTop + 74 * scale + value * scale;
    chartFillEllipse(canvas, sx(0), sy(28), 54 * scale, 34 * scale, outline);
    chartFillEllipse(canvas, sx(0), sy(25), 48 * scale, 29 * scale, duck);
    chartFillCircle(canvas, sx(33), sy(-4), 31 * scale, outline);
    chartFillCircle(canvas, sx(33), sy(-4), 25 * scale, duck);
    chartFillEllipse(canvas, sx(70), sy(8), 24 * scale, 12 * scale, outline);
    chartFillEllipse(canvas, sx(72), sy(8), 18 * scale, 8 * scale, red);
    chartFillCircle(canvas, sx(43), sy(-13), 5 * scale, outline);
    canvas.fillRect(sx(-25), sy(16), 26 * scale, 26 * scale, outline);
    canvas.fillRect(sx(-22), sy(19), 20 * scale, 20 * scale, accent);
  }

  if (options.logo) {
    const logoSize = 34 * scale;
    const logoLeft = duckLeft + 44 * scale;
    const logoTop = duckTop + 74 * scale;
    canvas.fillRect(logoLeft - 1, logoTop - 1, logoSize + 2, logoSize + 2, [13, 17, 23, 255]);
    canvas.drawImageCover(options.logo, logoLeft, logoTop, logoSize, logoSize, false);
  }

  const labelText = `#${row.rank} ${row.clan_name}`;
  const labelWidth = Math.min(150, Math.max(126, canvas.measureFontText(fonts.bold, labelText, 13) + 14));
  const labelTop = duckTop - 50 * scale - (options.labelLift || 0);
  canvas.fillRect(x - labelWidth / 2, labelTop, labelWidth, 42, [13, 17, 23, 225]);
  canvas.fillRect(x - labelWidth / 2, labelTop, labelWidth, 1, color.line);
  const fittedLabel = canvas.fitFontText(fonts.bold, historyCardText(labelText, 10000), 13, labelWidth - 14);
  const labelTextWidth = canvas.measureFontText(fonts.bold, fittedLabel, 13);
  canvas.drawFontText(fonts.bold, fittedLabel, x - labelTextWidth / 2, labelTop + 7, 13, color.white, labelWidth - 14);
  const lead = options.lead;
  const stats = `${shortNumber(row.points)}${lead !== null && lead !== undefined ? ` - +${shortNumber(lead)}` : ""}`;
  const fittedStats = canvas.fitFontText(fonts.regular, historyCardText(stats, 10000), 11, labelWidth - 14);
  const statsWidth = canvas.measureFontText(fonts.regular, fittedStats, 11);
  canvas.drawFontText(fonts.regular, fittedStats, x - statsWidth / 2, labelTop + 25, 11, color.muted, labelWidth - 14);
}

function chartDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });
}

function chartShortDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { timeZone: "America/Guatemala", month: "short", day: "numeric" });
}

function chartTimeLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function chartHourAxisLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", hour: "numeric" });
}

function chartTimeOfDayAxisLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", { timeZone: "America/Guatemala", hour: "numeric", minute: "2-digit" });
}

function chartFilenamePart(value) {
  return String(value || "current").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "current";
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

async function renderHistoryMessage(history, options) {
  const view = HISTORY_VIEWS.includes(options.view) ? options.view : "clan";
  const rows = Array.isArray(history[view]) ? history[view] : [];
  const description = rows.length
    ? rows.map((row, index) => formatHistoryLine(row, view, index + 1)).join("\n")
    : view === "league" && history.league_unavailable
      ? "League history is temporarily unavailable. Try this section again shortly."
      : `No ${HISTORY_VIEW_LABELS[view].toLowerCase()} has been recorded for this player.`;
  const fallbackEmbed = {
    title: `${truncateHistoryText(history.username, 80)} — ${HISTORY_VIEW_LABELS[view]}`,
    color: view === "league" ? 0xf2cc60 : view === "leaderboard" ? 0x58a6ff : 0xff6b6b,
    description: truncateHistoryText(description, 4000)
  };
  if (history.avatar_url) fallbackEmbed.thumbnail = { url: history.avatar_url };
  const components = historyComponents({
    ownerId: options.ownerId,
    targetId: String(history.user_id),
    view,
    page: 0,
    totalPages: 1
  });

  if (options.imageEnabled !== false) {
    try {
      const filename = `c0ld-history-${history.user_id}-${view}.png`;
      const bytes = await renderHistoryCardPng(history, view);
      return {
        content: null,
        embeds: [{
          color: 0xff6469,
          image: { url: `attachment://${filename}` }
        }],
        components,
        allowed_mentions: { parse: [] },
        _file: { filename, contentType: "image/png", bytes }
      };
    } catch (err) {
      console.warn("history image rendering failed", err?.message || String(err));
    }
  }

  return {
    content: null,
    embeds: [fallbackEmbed],
    attachments: [],
    components,
    allowed_mentions: { parse: [] }
  };
}

function formatHistoryLine(row, view, number) {
  const name = escapeDiscordMarkdown(truncateHistoryText(row.name, 72));
  if (view === "league") {
    const league = escapeDiscordMarkdown(truncateHistoryText(row.league_name || "Unknown", 32));
    return `${number}. **${name}** — ${league} — League ${historyRank(row.league_rank)} — Player ${historyRank(row.player_rank)} — ${historyPoints(row.points)} pts`;
  }
  if (view === "clan") {
    const clan = escapeDiscordMarkdown(truncateHistoryText(row.clan_name || "Unknown", 16)).toUpperCase();
    return `${number}. **${name}** — ${clan} — Global ${historyRank(row.global_rank, row.total_global_players)} — ${historyPoints(row.points)} pts`;
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
        historyButton("Previous", historyCustomId(ownerId, targetId, view, page - 1, "previous"), BUTTON_STYLE_SECONDARY, page <= 0),
        historyButton(`Page ${page + 1}/${totalPages}`, historyCustomId(ownerId, targetId, view, page, "indicator"), BUTTON_STYLE_SECONDARY, true),
        historyButton("Next", historyCustomId(ownerId, targetId, view, page + 1, "next"), BUTTON_STYLE_SECONDARY, page >= totalPages - 1)
      ]
    });
  }

  rows.push({
    type: COMPONENT_TYPE_ACTION_ROW,
    components: HISTORY_VIEWS.map(candidate => historyButton(
      HISTORY_VIEW_LABELS[candidate],
      historyCustomId(ownerId, targetId, candidate, 0, `view_${candidate}`),
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

function historyImageResponses(env) {
  return !["0", "false", "no", "off"].includes(String(env.HISTORY_IMAGE_RESPONSES || "true").toLowerCase());
}

const HISTORY_FONT_5X7 = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31], J: [7, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31], "3": [30, 1, 1, 14, 1, 1, 30],
  "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 16, 30, 1, 1, 30],
  "6": [14, 16, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14], "9": [14, 17, 17, 15, 1, 1, 14],
  "-": [0, 0, 0, 31, 0, 0, 0], "_": [0, 0, 0, 0, 0, 0, 31],
  ".": [0, 0, 0, 0, 0, 12, 12], ",": [0, 0, 0, 0, 4, 4, 8],
  ":": [0, 4, 4, 0, 4, 4, 0], "/": [1, 2, 2, 4, 8, 8, 16],
  "#": [10, 31, 10, 10, 31, 10, 0], "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8], "'": [4, 4, 8, 0, 0, 0, 0],
  "?": [14, 17, 1, 2, 4, 0, 4], "!": [4, 4, 4, 4, 4, 0, 4],
  "&": [12, 18, 20, 8, 21, 18, 13], "+": [0, 4, 4, 31, 4, 4, 0],
  "|": [4, 4, 4, 4, 4, 4, 4], "=": [0, 31, 0, 31, 0, 0, 0],
  "@": [14, 17, 23, 21, 23, 16, 14], "%": [17, 2, 4, 8, 16, 17, 0],
  "*": [0, 21, 14, 31, 14, 21, 0]
};

const HISTORY_FONT_BASE_SIZE = 32;
const HISTORY_FONT_CELL_WIDTH = 42;
const HISTORY_FONT_CELL_HEIGHT = 46;
const HISTORY_FONT_GLYPH_COUNT = 95;
const HISTORY_FONT_ATLASES = {"regular":{"data":"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","advances":[9,9,13,19,17,26,26,7,10,10,13,22,7,13,7,12,17,17,17,17,17,17,17,17,17,17,7,7,22,22,22,14,31,21,18,20,22,16,16,22,23,9,11,19,15,29,24,24,18,24,19,17,17,22,20,30,19,18,18,10,12,10,22,13,9,16,19,15,19,17,10,19,18,8,8,16,8,28,18,19,19,19,11,14,11,18,15,23,15,15,14,10,8,10,22]},"bold":{"data":"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","advances":[9,10,16,19,18,28,27,9,12,12,15,23,9,13,9,14,18,18,18,18,18,18,18,18,18,18,9,9,23,23,23,14,31,23,21,20,24,17,17,23,25,10,14,21,16,31,25,24,20,24,21,18,19,23,21,32,21,19,19,12,14,12,23,13,10,17,20,15,20,17,12,20,19,9,9,18,9,29,19,20,20,20,13,14,12,19,17,26,18,17,15,12,10,12,23]}};
let historyFontPromise = null;

async function renderHistoryCardPng(history, view) {
  const [fonts, avatar] = await Promise.all([
    loadHistoryFonts(),
    loadHistoryAvatar(history.avatar_url).catch(() => null)
  ]);
  const selectedView = HISTORY_VIEWS.includes(view) ? view : "clan";
  const rows = Array.isArray(history[selectedView]) ? history[selectedView] : [];
  if (selectedView === "clan") return renderClanBattleLedgerPng(history, rows, fonts, avatar);
  const width = 760;
  const margin = 22;
  const gap = 14;
  const contentWidth = width - margin * 2;
  const columns = selectedView === "clan" || rows.length > 12 ? 2 : 1;
  const columnWidth = columns === 2 ? Math.floor((contentWidth - gap) / 2) : contentWidth;
  const rowHeight = 64;
  const headerHeight = 144;
  const sectionHeaderHeight = 48;
  const sectionGap = 18;
  const footerHeight = 58;
  const gridRows = Math.max(1, Math.ceil(rows.length / columns));
  const height = Math.max(410, headerHeight + sectionHeaderHeight + gridRows * rowHeight + sectionGap + footerHeight);
  const canvas = new HistoryPixelCanvas(width, height, [11, 16, 23, 255], 2);
  const color = {
    panel: [22, 29, 39, 255],
    panelAlt: [17, 24, 33, 255],
    header: [25, 33, 44, 255],
    line: [48, 60, 75, 255],
    white: [239, 245, 252, 255],
    muted: [176, 188, 204, 255],
    red: [255, 100, 105, 255],
    blue: [88, 166, 255, 255],
    gold: [242, 204, 96, 255],
    green: [104, 218, 159, 255],
    greenDark: [27, 66, 49, 255],
    goldDark: [67, 57, 28, 255],
    blueDark: [29, 53, 78, 255]
  };
  const accent = selectedView === "league" ? color.gold : selectedView === "leaderboard" ? color.blue : color.red;

  canvas.fillRect(0, 0, width, 6, accent);
  canvas.fillRect(0, 6, 220, 2, color.gold);
  canvas.fillRect(220, 6, 290, 2, color.red);
  canvas.fillRect(510, 6, width - 510, 2, color.blue);
  canvas.fillRect(margin, 26, contentWidth, 96, color.header);
  canvas.fillRect(margin, 26, 6, 96, accent);
  canvas.fillRect(43, 45, 58, 58, accent);
  if (avatar) canvas.drawImageCover(avatar, 47, 49, 50, 50, true);
  else canvas.drawFontText(fonts.bold, "C", 62, 55, 27, [12, 17, 24, 255], 30);
  canvas.drawFontText(fonts.bold, "PS99 Player History", 119, 35, 17, accent, 360);
  canvas.drawFontText(fonts.bold, `${historyCardText(history.username, 25)}'s ${HISTORY_VIEW_LABELS[selectedView]}`, 119, 59, 25, color.white, 390);
  canvas.drawFontText(fonts.regular, `${rows.length} recorded result${rows.length === 1 ? "" : "s"}`, 120, 96, 13, color.muted, 200);
  const highlight = historyViewHighlight(rows, selectedView);
  canvas.fillRect(520, 43, 194, 63, color.panelAlt);
  canvas.drawFontText(fonts.bold, highlight.label, 536, 50, 12, color.muted, 160);
  canvas.drawFontText(fonts.bold, highlight.value, 536, 70, selectedView === "league" ? 13 : 18, highlight.tone === "gold" ? color.gold : highlight.tone === "blue" ? color.blue : color.green, 165);

  let cursorY = headerHeight;
  drawHistorySectionHeader(canvas, fonts, HISTORY_VIEW_LABELS[selectedView], rows.length, margin, cursorY, contentWidth, accent, color);
  cursorY += sectionHeaderHeight;
  const visible = rows.length ? rows : [null];
  visible.forEach((row, index) => {
    const column = index % columns;
    const gridRow = Math.floor(index / columns);
    const x = margin + column * (columnWidth + gap);
    const y = cursorY + gridRow * rowHeight;
    canvas.fillRect(x, y, columnWidth, rowHeight, gridRow % 2 ? color.panel : color.panelAlt);
    if (row) drawCombinedHistoryRow(canvas, fonts, row, selectedView, x, y, columnWidth, color, accent);
    else canvas.drawFontText(
      fonts.regular,
      selectedView === "league" && history.league_unavailable
        ? "League data temporarily unavailable."
        : `No ${HISTORY_VIEW_LABELS[selectedView].toLowerCase()} recorded.`,
      x + 18,
      y + 18,
      15,
      color.muted,
      columnWidth - 36
    );
    canvas.fillRect(x + 16, y + rowHeight - 1, columnWidth - 32, 1, color.line);
  });
  if (columns === 2) {
    const separatorX = margin + columnWidth + Math.floor(gap / 2);
    canvas.fillRect(separatorX, cursorY + 8, 1, gridRows * rowHeight - 16, color.line);
  }

  canvas.fillRect(margin, height - footerHeight + 8, contentWidth, 1, color.line);
  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", 41, height - 35, 13, color.muted, 470);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

async function renderClanBattleLedgerPng(history, rows, fonts, avatar) {
  const width = 800;
  const margin = 24;
  const gap = 16;
  const contentWidth = width - margin * 2;
  const columns = rows.length > 10 ? 2 : 1;
  const columnWidth = columns === 2 ? Math.floor((contentWidth - gap) / 2) : contentWidth;
  const firstColumnCount = columns === 2 ? Math.ceil(rows.length / 2) : rows.length;
  const gridRows = Math.max(1, firstColumnCount);
  const rowHeight = 68;
  const headerTop = 24;
  const headerHeight = 96;
  const careerTop = 132;
  const careerHeight = 58;
  const rangeTop = 208;
  const rangeHeight = 30;
  const rowTop = rangeTop + rangeHeight;
  const footerHeight = 58;
  const height = Math.max(500, rowTop + gridRows * rowHeight + footerHeight);
  const canvas = new HistoryPixelCanvas(width, height, [10, 15, 22, 255], 2);
  const color = {
    panel: [22, 29, 39, 255],
    panelAlt: [17, 24, 33, 255],
    header: [25, 33, 44, 255],
    inset: [13, 19, 27, 255],
    line: [48, 60, 75, 255],
    white: [239, 245, 252, 255],
    muted: [176, 188, 204, 255],
    quiet: [113, 127, 145, 255],
    track: [35, 43, 54, 255],
    red: [255, 100, 105, 255],
    blue: [88, 166, 255, 255],
    gold: [242, 204, 96, 255],
    green: [104, 218, 159, 255]
  };
  const metrics = historyCareerMetrics(rows, history);

  canvas.fillRect(0, 0, width, 6, color.red);
  canvas.fillRect(margin, headerTop, contentWidth, headerHeight, color.header);
  canvas.fillRect(margin, headerTop, 5, headerHeight, color.red);
  canvas.fillRect(42, 41, 68, 68, color.red);
  if (avatar) canvas.drawImageCover(avatar, 46, 45, 60, 60, true);
  else canvas.drawFontText(fonts.bold, "C", 62, 51, 31, color.inset, 35);

  canvas.drawFontText(fonts.bold, historyCardText(history.username, 27), 128, 42, 29, color.white, 410);
  canvas.drawFontText(
    fonts.regular,
    `PLAYER ID ${historyCardText(history.user_id || "-", 20)}`,
    129,
    84,
    12,
    color.muted,
    270
  );
  canvas.fillRect(600, 40, 1, 64, color.line);
  canvas.drawFontText(fonts.bold, fullNumber(rows.length), 625, 42, 30, color.white, 70);
  canvas.drawFontText(fonts.bold, "RECORDED", 691, 48, 11, color.muted, 72);
  canvas.drawFontText(fonts.bold, "RESULTS", 691, 66, 11, color.muted, 72);
  canvas.drawFontText(fonts.regular, `${metrics.ranked.length} WITH GLOBAL RANK`, 625, 89, 10, color.quiet, 138);

  canvas.fillRect(margin, careerTop, contentWidth, careerHeight, color.panelAlt);
  drawHistoryMetric(canvas, fonts, "TOP PERFORMANCE", historyBestMetric(metrics.best), margin + 16, careerTop + 8, 180, historyPerformanceTone(metrics.best?.percent, color), color);
  canvas.fillRect(margin + 198, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "RECENT CB AVG", metrics.recentAverage === null ? "-" : historyTopLabel(metrics.recentAverage), margin + 216, careerTop + 8, 136, color.white, color);
  canvas.fillRect(margin + 366, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "TOTAL CLANS", fullNumber(metrics.clans.length), margin + 384, careerTop + 8, 112, color.white, color);
  canvas.fillRect(margin + 510, careerTop + 10, 1, careerHeight - 20, color.line);
  drawHistoryMetric(canvas, fonts, "CURRENT CLAN TENURE", historyCurrentClanTenure(metrics), margin + 528, careerTop + 8, 208, color.white, color);

  const columnRows = columns === 2
    ? [rows.slice(0, firstColumnCount), rows.slice(firstColumnCount)]
    : [rows];
  columnRows.forEach((entries, column) => {
    const x = margin + column * (columnWidth + gap);
    const start = column === 0 ? 1 : firstColumnCount + 1;
    const end = start + entries.length - 1;
    const rangeLabel = entries.length ? `RECORDS ${historyTwoDigit(start)}-${historyTwoDigit(end)}` : "RECORDS";
    canvas.drawFontText(fonts.bold, rangeLabel, x + 12, rangeTop + 5, 11, color.quiet, 150);
    canvas.drawFontText(fonts.regular, "FIELD OUTRANKED", x + columnWidth - 116, rangeTop + 7, 9, color.quiet, 104);
    canvas.fillRect(x, rangeTop + rangeHeight - 1, columnWidth, 1, color.line);

    if (!entries.length) {
      canvas.drawFontText(fonts.regular, "No clan battle records.", x + 18, rowTop + 18, 15, color.muted, columnWidth - 36);
      return;
    }

    entries.forEach((row, localIndex) => {
      const globalIndex = column === 0 ? localIndex : firstColumnCount + localIndex;
      const previous = globalIndex > 0 ? rows[globalIndex - 1] : null;
      const next = globalIndex + 1 < rows.length ? rows[globalIndex + 1] : null;
      drawClanLedgerRow(
        canvas,
        fonts,
        row,
        globalIndex,
        x,
        rowTop + localIndex * rowHeight,
        columnWidth,
        rowHeight,
        historySameClan(previous, row),
        historySameClan(row, next),
        color
      );
    });
  });

  if (columns === 2) {
    const separatorX = margin + columnWidth + Math.floor(gap / 2);
    canvas.fillRect(separatorX, rangeTop + 4, 1, gridRows * rowHeight + rangeHeight - 8, color.line);
  }
  canvas.fillRect(margin, height - footerHeight + 8, contentWidth, 1, color.line);
  canvas.drawFontText(fonts.regular, "Bot by Cinnamowopal", margin + 16, height - 35, 13, color.muted, 300);
  return encodeHistoryPng(canvas.width, canvas.height, canvas.pixels);
}

function drawHistoryMetric(canvas, fonts, label, value, x, y, width, valueColor, color) {
  canvas.drawFontText(fonts.bold, label, x, y, 10, color.quiet, width);
  canvas.drawFontText(fonts.bold, historyCardText(value, 40), x, y + 20, 14, valueColor, width);
}

function drawClanLedgerRow(canvas, fonts, row, index, x, y, width, height, joinsPrevious, joinsNext, color) {
  canvas.fillRect(x, y, width, height, index % 2 ? color.panel : color.panelAlt);
  canvas.fillRect(x + 16, y + height - 1, width - 32, 1, color.line);

  const centerY = y + Math.floor(height / 2);
  const railX = x + 8;
  canvas.fillRect(railX, joinsPrevious ? y : y + 10, 2, centerY - (joinsPrevious ? y : y + 10), color.line);
  canvas.fillRect(railX, centerY, 2, (joinsNext ? y + height : y + height - 10) - centerY, color.line);
  const startsStint = !joinsPrevious;
  canvas.fillRect(railX - (startsStint ? 2 : 1), centerY - (startsStint ? 2 : 1), startsStint ? 6 : 4, startsStint ? 6 : 4, startsStint ? color.red : color.quiet);

  canvas.drawFontText(fonts.regular, historyTwoDigit(index + 1), x + 19, y + 7, 9, color.quiet, 20);
  const clan = historyCardText(String(row.clan_name || "-").toUpperCase(), 8);
  canvas.drawFontText(fonts.bold, clan, x + 42, y + 22, 11, color.white, 43);
  canvas.fillRect(x + 93, y + 9, 1, height - 18, color.line);
  canvas.drawFontText(fonts.bold, historyCardText(row.name, 46), x + 106, y + 5, 15, color.white, width - 120);

  const percent = historyRowPercent(row);
  const performanceLabel = percent === null ? null : historyTopLabel(percent);
  const performanceWidth = 76;
  const rankDetail = historyLedgerRank(row.global_rank, row.total_global_players);
  const pointsDetail = historyLedgerPoints(row.points);
  const details = [];
  if (pointsDetail !== "-") details.push(`${pointsDetail} PTS`);
  if (rankDetail !== "-") details.push(rankDetail);
  const detail = details.length ? details.join("  |  ") : "NO RESULT RECORDED";
  canvas.drawFontText(fonts.regular, historyCardText(detail, 80), x + 106, y + 32, 11, color.muted, width - 106 - performanceWidth - 8);
  if (performanceLabel) {
    const tone = historyPerformanceTone(percent, color);
    canvas.drawFontText(fonts.bold, performanceLabel, x + width - performanceWidth, y + 32, 11, tone, performanceWidth - 10);
    drawHistoryFieldTape(canvas, x + 106, y + 56, width - 120, percent, tone, color);
  }
}

function drawHistoryFieldTape(canvas, x, y, width, percent, tone, color) {
  const segmentCount = 20;
  const gap = 2;
  const segmentWidth = (width - gap * (segmentCount - 1)) / segmentCount;
  const outranked = Math.max(0, Math.min(100, 100 - percent));
  const illuminated = outranked / 100 * segmentCount;
  for (let segment = 0; segment < segmentCount; segment++) {
    const segmentX = x + segment * (segmentWidth + gap);
    canvas.fillRect(segmentX, y, segmentWidth, 3, color.track);
    const fraction = Math.max(0, Math.min(1, illuminated - segment));
    if (fraction > 0) canvas.fillRect(segmentX, y, segmentWidth * fraction, 3, tone);
  }
}

function historyCareerMetrics(rows, history = {}) {
  const ranked = (rows || []).map(row => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    return rank && total ? { row, rank, total, percent: rank / total * 100 } : null;
  }).filter(Boolean);
  const recentRanked = ranked.filter(entry => !historyBattleIsActive(entry.row)).slice(0, 5);
  const recentAverage = recentRanked.length
    ? recentRanked.reduce((sum, entry) => sum + entry.percent, 0) / recentRanked.length
    : null;
  const best = ranked.reduce((current, entry) => {
    if (!current) return entry;
    if (entry.rank !== current.rank) return entry.rank < current.rank ? entry : current;
    return entry.percent < current.percent ? entry : current;
  }, null);
  const clans = [];
  const seen = new Set();
  const currentClanValue = history.current_clan || history.currentClan || null;
  const currentClan = historyCardText(String(currentClanValue || "").toUpperCase(), 12);
  if (currentClan && currentClan !== "UNKNOWN") {
    seen.add(currentClan);
    clans.push(currentClan);
  }
  for (const row of rows || []) {
    const clan = historyCardText(String(row.clan_name || "").toUpperCase(), 12);
    if (!clan || clan === "UNKNOWN" || seen.has(clan)) continue;
    seen.add(clan);
    clans.push(clan);
  }
  return {
    ranked,
    recentRanked,
    recentAverage,
    best,
    clans,
    currentClan: currentClan && currentClan !== "UNKNOWN" ? currentClan : null,
    clanJoinTime: history.clan_join_time || history.clanJoinTime || null
  };
}

function historyBestMetric(best) {
  return best ? `#${fullNumber(best.rank)} / ${historyTopLabel(best.percent)}` : "-";
}

function historyCurrentClanTenure(metrics, nowMs = Date.now()) {
  if (!metrics.currentClan) return "-";
  const joinMs = Date.parse(String(metrics.clanJoinTime || ""));
  if (!Number.isFinite(joinMs) || joinMs > nowMs) return `${metrics.currentClan} / UNKNOWN`;
  const days = Math.floor((nowMs - joinMs) / 86400000);
  if (days < 1) return `${metrics.currentClan} / <1 DAY`;
  return `${metrics.currentClan} / ${fullNumber(days)} DAY${days === 1 ? "" : "S"}`;
}

function historyBattleIsActive(row, nowMs = Date.now()) {
  if (row?.is_active === true || String(row?.is_active || "").toLowerCase() === "true") return true;
  const endMs = Date.parse(String(row?.battle_end_iso || row?.battle_ended_at || ""));
  return Number.isFinite(endMs) && endMs > nowMs;
}

function historyTwoDigit(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}

function historySameClan(left, right) {
  if (!left || !right) return false;
  return String(left.clan_name || "").trim().toUpperCase() === String(right.clan_name || "").trim().toUpperCase();
}

function historyRowPercent(row) {
  const rank = positiveInteger(row?.global_rank);
  const total = positiveInteger(row?.total_global_players);
  return rank && total ? rank / total * 100 : null;
}

function historyPerformanceTone(percent, color) {
  if (!Number.isFinite(percent)) return color.quiet || color.muted;
  if (percent <= 1) return color.gold;
  if (percent <= 5) return color.green;
  return color.blue;
}

function historyLedgerRank(value, total) {
  const rankValue = positiveInteger(value);
  if (!rankValue) return "-";
  const totalValue = positiveInteger(total);
  return `#${fullNumber(rankValue)}${totalValue ? ` / ${fullNumber(totalValue)}` : ""}`;
}

function historyLedgerPoints(value) {
  return finiteHistoryNumber(value) === null ? "-" : shortNumber(value);
}

function drawHistorySectionHeader(canvas, fonts, label, count, x, y, width, accent, color) {
  canvas.fillRect(x, y, width, 48, color.header);
  canvas.fillRect(x, y, 5, 48, accent);
  canvas.drawFontText(fonts.bold, label, x + 18, y + 8, 20, color.white, width - 125);
  canvas.drawFontText(fonts.regular, `${count} record${count === 1 ? "" : "s"}`, x + width - 94, y + 12, 12, color.muted, 84);
}

function drawCombinedHistoryRow(canvas, fonts, row, view, x, y, width, color, accent) {
  const performance = historyPerformanceBadge(row, view, color);
  const badgeWidth = performance ? 94 : 0;
  canvas.drawFontText(fonts.bold, historyCardText(row.name, 44), x + 17, y + 3, 18, color.white, width - 34 - badgeWidth);
  if (performance) {
    canvas.fillRect(x + width - 104, y + 7, 92, 22, performance.background);
    canvas.drawFontText(fonts.bold, performance.label, x + width - 97, y + 10, 11, performance.foreground, 80);
  }
  let details;
  if (view === "league") {
    details = `${row.league_name || "Unknown"}  |  League ${historyCardRank(row.league_rank)}  |  Player ${historyCardRank(row.player_rank)}  |  ${historyCardPoints(row.points)} pts`;
  } else if (view === "clan") {
    const clanName = historyCardText(String(row.clan_name || "Unknown").toUpperCase(), 8);
    canvas.fillRect(x + 17, y + 35, 3, 17, accent);
    canvas.drawFontText(fonts.bold, clanName, x + 29, y + 33, 12, color.white, 54);
    canvas.fillRect(x + 91, y + 35, 1, 17, color.line);
    details = `Global ${historyCardRank(row.global_rank, row.total_global_players)}  |  ${historyCardPoints(row.points)} pts`;
    canvas.drawFontText(fonts.regular, historyCardText(details, 100), x + 103, y + 33, 13, color.muted, width - 116);
    return;
  } else {
    details = `Global ${historyCardRank(row.global_rank, row.total_global_players)}  |  ${historyCardPoints(row.points)} pts`;
  }
  canvas.fillRect(x + 17, y + 42, 5, 5, accent);
  canvas.drawFontText(fonts.regular, historyCardText(details, 100), x + 30, y + 33, 13, color.muted, width - 43);
}

function historyPerformanceBadge(row, view, color) {
  if (view === "league") {
    const playerRank = positiveInteger(row.player_rank);
    return playerRank ? { label: `PLAYER #${fullNumber(playerRank)}`, foreground: color.gold, background: color.goldDark } : null;
  }
  const rankValue = positiveInteger(row.global_rank);
  const totalValue = positiveInteger(row.total_global_players);
  if (!rankValue || !totalValue) return null;
  const percent = rankValue / totalValue * 100;
  if (percent <= 1) return { label: historyTopLabel(percent), foreground: color.gold, background: color.goldDark };
  if (percent <= 5) return { label: historyTopLabel(percent), foreground: color.green, background: color.greenDark };
  return { label: historyTopLabel(percent), foreground: color.blue, background: color.blueDark };
}

function historyTopLabel(percent) {
  if (!Number.isFinite(percent)) return "N/A";
  const value = percent.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return `TOP ${value}%`;
}

function historyViewHighlight(rows, view) {
  if (view === "league") {
    const best = (rows || []).reduce((current, row) => {
      const playerRank = positiveInteger(row.player_rank);
      if (!playerRank || (current && current.playerRank <= playerRank)) return current;
      return { playerRank, leagueRank: positiveInteger(row.league_rank) };
    }, null);
    return best
      ? { label: "BEST LEAGUE FINISH", value: `Player #${fullNumber(best.playerRank)}${best.leagueRank ? `  |  League #${fullNumber(best.leagueRank)}` : ""}`, tone: "gold" }
      : { label: "LEAGUE PERFORMANCE", value: "No ranked result", tone: "gold" };
  }
  const best = bestGlobalPerformanceRows(rows);
  return best
    ? { label: "BEST GLOBAL FINISH", value: `${historyCardRank(best.rank)}  |  ${historyTopLabel(best.percent)}`, tone: best.percent <= 1 ? "gold" : "green" }
    : { label: "GLOBAL PERFORMANCE", value: "No global rank", tone: "blue" };
}

function bestGlobalPerformanceRows(rows) {
  return (rows || []).reduce((best, row) => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    if (!rank || !total) return best;
    const percent = rank / total * 100;
    return best && best.percent <= percent ? best : { rank, total, percent };
  }, null);
}

function bestHistoryGlobalPerformance(history) {
  const rows = [...(history.clan || []), ...(history.leaderboard || [])];
  return rows.reduce((best, row) => {
    const rank = positiveInteger(row.global_rank);
    const total = positiveInteger(row.total_global_players);
    if (!rank || !total) return best;
    const percent = rank / total * 100;
    if (best && best.percent <= percent) return best;
    return { rank, total, percent, tone: percent <= 1 ? "gold" : "green" };
  }, null);
}

function historyCardRank(value, total) {
  return positiveInteger(value) ? historyRank(value, total) : "N/A";
}

function historyCardPoints(value) {
  return finiteHistoryNumber(value) === null ? "N/A" : historyPoints(value);
}

function historyCardText(value, maxLength = 40) {
  const ascii = String(value ?? "-")
    .normalize("NFKD")
    .replace(/[\u2012-\u2015]/g, "-")
    .replace(/[^\x20-\x7e]/g, "?");
  return ascii.length > maxLength ? `${ascii.slice(0, Math.max(1, maxLength - 3))}...` : ascii;
}

async function loadHistoryFonts() {
  if (!historyFontPromise) {
    historyFontPromise = Promise.all(Object.entries(HISTORY_FONT_ATLASES).map(async ([name, face]) => {
      const packed = historyBase64Bytes(face.data);
      const alpha = new Uint8Array(await new Response(
        new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate"))
      ).arrayBuffer());
      const expected = HISTORY_FONT_CELL_WIDTH * HISTORY_FONT_CELL_HEIGHT * HISTORY_FONT_GLYPH_COUNT;
      if (alpha.length !== expected) throw new Error(`History font ${name} decoded to an unexpected size.`);
      return [name, { alpha, advances: face.advances }];
    })).then(entries => Object.fromEntries(entries));
  }
  return historyFontPromise;
}

function historyBase64Bytes(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function loadHistoryAvatar(url) {
  const value = String(url || "").trim();
  if (!/^https?:\/\//i.test(value)) return null;
  const response = await fetch(value, {
    headers: { Accept: "image/png,image/*;q=0.8", "User-Agent": "c0ld-Discord-History-Worker" },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) return null;
  return decodeHistoryPng(new Uint8Array(await response.arrayBuffer()));
}

async function decodeHistoryPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) return null;
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      width = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0);
      height = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") palette = data.slice();
    else if (type === "tRNS") transparency = data.slice();
    else if (type === "IDAT") idat.push(data.slice());
    else if (type === "IEND") break;
    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idat.length) return null;
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[colorType];
  if (!channels || (colorType === 3 && !palette)) return null;
  const compressed = concatHistoryBytes(...idat);
  const inflated = new Uint8Array(await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate"))
  ).arrayBuffer());
  const stride = width * channels;
  if (inflated.length < (stride + 1) * height) return null;
  const decoded = new Uint8Array(stride * height);
  let sourceOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[sourceOffset++];
    const rowOffset = y * stride;
    const previousOffset = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw = inflated[sourceOffset++];
      const left = x >= channels ? decoded[rowOffset + x - channels] : 0;
      const up = y > 0 ? decoded[previousOffset + x] : 0;
      const upLeft = y > 0 && x >= channels ? decoded[previousOffset + x - channels] : 0;
      let value = raw;
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += historyPaeth(left, up, upLeft);
      else if (filter !== 0) return null;
      decoded[rowOffset + x] = value & 255;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const source = pixel * channels;
    const target = pixel * 4;
    if (colorType === 6) {
      rgba.set(decoded.subarray(source, source + 4), target);
    } else if (colorType === 2) {
      rgba[target] = decoded[source];
      rgba[target + 1] = decoded[source + 1];
      rgba[target + 2] = decoded[source + 2];
      rgba[target + 3] = 255;
    } else if (colorType === 3) {
      const index = decoded[source];
      rgba[target] = palette[index * 3] || 0;
      rgba[target + 1] = palette[index * 3 + 1] || 0;
      rgba[target + 2] = palette[index * 3 + 2] || 0;
      rgba[target + 3] = transparency?.[index] ?? 255;
    } else {
      const gray = decoded[source];
      rgba[target] = gray;
      rgba[target + 1] = gray;
      rgba[target + 2] = gray;
      rgba[target + 3] = colorType === 4 ? decoded[source + 1] : 255;
    }
  }
  return { width, height, pixels: rgba };
}

function historyPaeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const diagonalDistance = Math.abs(estimate - upLeft);
  return leftDistance <= upDistance && leftDistance <= diagonalDistance ? left : upDistance <= diagonalDistance ? up : upLeft;
}

function historyBilinearAlpha(data, width, height, x, y, minX = 0, maxX = width - 1) {
  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedY = Math.max(0, Math.min(height - 1, y));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(maxX, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;
  const top = data[y0 * width + x0] * (1 - tx) + data[y0 * width + x1] * tx;
  const bottom = data[y1 * width + x0] * (1 - tx) + data[y1 * width + x1] * tx;
  return Math.round(top * (1 - ty) + bottom * ty);
}

function historyBilinearRgba(image, x, y) {
  const clampedX = Math.max(0, Math.min(image.width - 1, x));
  const clampedY = Math.max(0, Math.min(image.height - 1, y));
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(image.width - 1, x0 + 1);
  const y1 = Math.min(image.height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;
  const result = [0, 0, 0, 0];
  for (let channel = 0; channel < 4; channel++) {
    const top = image.pixels[(y0 * image.width + x0) * 4 + channel] * (1 - tx)
      + image.pixels[(y0 * image.width + x1) * 4 + channel] * tx;
    const bottom = image.pixels[(y1 * image.width + x0) * 4 + channel] * (1 - tx)
      + image.pixels[(y1 * image.width + x1) * 4 + channel] * tx;
    result[channel] = Math.round(top * (1 - ty) + bottom * ty);
  }
  return result;
}

class HistoryPixelCanvas {
  constructor(width, height, background, pixelRatio = 1) {
    this.pixelRatio = Math.max(1, Math.trunc(pixelRatio) || 1);
    this.width = width * this.pixelRatio;
    this.height = height * this.pixelRatio;
    this.pixels = new Uint8Array(this.width * this.height * 4);
    this.fillRect(0, 0, width, height, background);
  }

  fillRect(x, y, width, height, rgba) {
    const ratio = this.pixelRatio;
    const left = Math.max(0, Math.trunc(x * ratio));
    const top = Math.max(0, Math.trunc(y * ratio));
    const right = Math.min(this.width, Math.trunc((x + width) * ratio));
    const bottom = Math.min(this.height, Math.trunc((y + height) * ratio));
    for (let py = top; py < bottom; py++) {
      let offset = (py * this.width + left) * 4;
      for (let px = left; px < right; px++) {
        this.pixels[offset++] = rgba[0];
        this.pixels[offset++] = rgba[1];
        this.pixels[offset++] = rgba[2];
        this.pixels[offset++] = rgba[3] ?? 255;
      }
    }
  }

  drawImageStretch(image, x, y, width, height) {
    if (!image?.width || !image?.height || !image?.pixels) return;
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    width *= ratio;
    height *= ratio;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const sourceX = (px + 0.5) / width * image.width - 0.5;
        const sourceY = (py + 0.5) / height * image.height - 0.5;
        const sample = historyBilinearRgba(image, sourceX, sourceY);
        this.blendPixel(
          Math.trunc(x + px),
          Math.trunc(y + py),
          sample,
          255
        );
      }
    }
  }

  drawImageCover(image, x, y, width, height, circular = false) {
    if (!image?.width || !image?.height || !image?.pixels) return;
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    width *= ratio;
    height *= ratio;
    const targetRatio = width / height;
    const sourceRatio = image.width / image.height;
    const cropWidth = sourceRatio > targetRatio ? image.height * targetRatio : image.width;
    const cropHeight = sourceRatio > targetRatio ? image.height : image.width / targetRatio;
    const cropX = (image.width - cropWidth) / 2;
    const cropY = (image.height - cropHeight) / 2;
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        if (circular) {
          const dx = px + 0.5 - centerX;
          const dy = py + 0.5 - centerY;
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        const sourceX = cropX + (px + 0.5) / width * cropWidth - 0.5;
        const sourceY = cropY + (py + 0.5) / height * cropHeight - 0.5;
        const sample = historyBilinearRgba(image, sourceX, sourceY);
        this.blendPixel(
          Math.trunc(x + px),
          Math.trunc(y + py),
          sample,
          255
        );
      }
    }
  }

  drawFontText(font, value, x, y, size, rgba, maxWidth = Infinity) {
    const ratio = this.pixelRatio;
    x *= ratio;
    y *= ratio;
    size *= ratio;
    maxWidth = Number.isFinite(maxWidth) ? maxWidth * ratio : maxWidth;
    const text = this.fitFontText(font, historyCardText(value, 10000), size, maxWidth);
    const scale = size / HISTORY_FONT_BASE_SIZE;
    let cursor = Number(x);
    for (const character of text) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      this.drawFontGlyph(font, glyphIndex, cursor, y, scale, rgba);
      cursor += (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
    }
    return cursor;
  }

  fitFontText(font, value, size, maxWidth) {
    if (!Number.isFinite(maxWidth) || this.measureFontText(font, value, size) <= maxWidth) return value;
    const suffix = "...";
    const available = Math.max(0, maxWidth - this.measureFontText(font, suffix, size));
    let output = "";
    let width = 0;
    const scale = size / HISTORY_FONT_BASE_SIZE;
    for (const character of value) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      const advance = (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
      if (width + advance > available) break;
      output += character;
      width += advance;
    }
    return output + suffix;
  }

  measureFontText(font, value, size) {
    const scale = size / HISTORY_FONT_BASE_SIZE;
    let width = 0;
    for (const character of String(value || "")) {
      const code = character.charCodeAt(0);
      const glyphIndex = code >= 32 && code <= 126 ? code - 32 : 31;
      width += (font.advances[glyphIndex] || HISTORY_FONT_BASE_SIZE / 2) * scale;
    }
    return width;
  }

  drawFontGlyph(font, glyphIndex, x, y, scale, rgba) {
    const outputWidth = Math.ceil(HISTORY_FONT_CELL_WIDTH * scale);
    const outputHeight = Math.ceil(HISTORY_FONT_CELL_HEIGHT * scale);
    const atlasWidth = HISTORY_FONT_CELL_WIDTH * HISTORY_FONT_GLYPH_COUNT;
    const sourceLeft = glyphIndex * HISTORY_FONT_CELL_WIDTH;
    for (let py = 0; py < outputHeight; py++) {
      const sourceY = (py + 0.5) / scale - 0.5;
      for (let px = 0; px < outputWidth; px++) {
        const sourceX = (px + 0.5) / scale - 0.5;
        const coverage = historyBilinearAlpha(font.alpha, atlasWidth, HISTORY_FONT_CELL_HEIGHT, sourceLeft + sourceX, sourceY, sourceLeft, sourceLeft + HISTORY_FONT_CELL_WIDTH - 1);
        if (coverage) this.blendPixel(Math.round(x + px), Math.round(y + py), rgba, coverage);
      }
    }
  }

  blendPixel(x, y, rgba, coverage) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const offset = (y * this.width + x) * 4;
    const alpha = (coverage / 255) * ((rgba[3] ?? 255) / 255);
    const inverse = 1 - alpha;
    this.pixels[offset] = Math.round(rgba[0] * alpha + this.pixels[offset] * inverse);
    this.pixels[offset + 1] = Math.round(rgba[1] * alpha + this.pixels[offset + 1] * inverse);
    this.pixels[offset + 2] = Math.round(rgba[2] * alpha + this.pixels[offset + 2] * inverse);
    this.pixels[offset + 3] = 255;
  }
}

async function encodeHistoryPng(width, height, rgbaPixels) {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const destination = y * (stride + 1);
    raw[destination] = 0;
    raw.set(rgbaPixels.subarray(y * stride, (y + 1) * stride), destination + 1);
  }

  const compressed = new Uint8Array(await new Response(
    new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"))
  ).arrayBuffer());
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  return concatHistoryBytes(
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    historyPngChunk("IHDR", header),
    historyPngChunk("IDAT", compressed),
    historyPngChunk("IEND", new Uint8Array())
  );
}

function historyPngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, historyCrc32(concatHistoryBytes(typeBytes, data)));
  return output;
}

let historyCrcTable = null;
function historyCrc32(bytes) {
  if (!historyCrcTable) {
    historyCrcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      historyCrcTable[n] = value >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = historyCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concatHistoryBytes(...parts) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
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

async function registerClanCommand(url, env) {
  return registerCommand(url, env, clanCommandPayload());
}

async function registerDuckCommand(url, env) {
  return registerCommand(url, env, duckCommandPayload());
}

async function registerLgCommand(url, env) {
  return registerCommand(url, env, lgCommandPayload());
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
  const roblox = await fetchRobloxReleasedVersionForCommand(env).catch(err => ({
    version: "-",
    upload: "-",
    scanned: "-",
    error: err?.message || String(err)
  }));
  const robloxSuffix = roblox.error
    ? ` | Roblox Released: unavailable`
    : ` | Roblox Released: ${roblox.version} | Roblox Scan: ${roblox.scanned}`;

  return messageResponse(
    `Newest PS99 Version: ${version} | Release: ${release} | Last Scanned: ${lastScanned}${robloxSuffix}`
  );
}

async function fetchRobloxReleasedVersionForCommand(env) {
  const apiBase = String(env.CLAN_API_BASE || "https://c0ld-clan-api-worker.opal-dde.workers.dev").replace(/\/$/, "");
  const apiUrl = clanApiUrl(env, "/api/roblox/versions", apiBase);
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
    throw httpError(response.status || 502, payload.message || `Roblox version API failed (${response.status}).`);
  }

  const state = Array.isArray(payload.states) ? payload.states[0] : null;
  return {
    version: state?.current_version || payload.current_version || "-",
    upload: state?.client_version_upload || payload.client_version_upload || "-",
    scanned: formatPs99CommandDate(state?.last_checked_at || payload.newest_detected_at)
  };
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

async function lgDebug(url, env) {
  const leagueName = String(url.searchParams.get("league") || url.searchParams.get("name") || url.searchParams.get("q") || "").trim();
  if (!leagueName) {
    throw httpError(400, "Missing ?league=name.");
  }

  const result = await fetchLeagueCurrentPayload(leagueName, env, { debug: true });
  return json({
    ok: Boolean(result.payload),
    configured: {
      league_api_base: String(env.LEAGUE_API_BASE || "").trim() || "https://yamo-league-api-worker.opal-dde.workers.dev",
      service_binding_enabled: hasLeagueApiServiceBinding(env),
      target_count: leagueApiTargets(env).length
    },
    requested_league: leagueName,
    error: result.error?.message || null,
    attempts: result.attempts.map(attempt => leagueAttemptSummary(attempt)),
    league: result.payload ? {
      league_name: result.payload.league_name || null,
      league_points: result.payload.league_points ?? null,
      league_rank: result.payload.league_rank ?? null,
      league_icon: result.payload.league_icon || null,
      row_count: Array.isArray(result.payload.rows) ? result.payload.rows.length : 0,
      top_contributions: (result.payload.rows || []).slice(0, 4).map(row => ({
        rank: row.rank ?? null,
        username: row.username || row.display_name || null,
        user_id: row.user_id ?? null,
        points: row.total_points ?? row.points ?? null,
        gain_1h: row.gain_1h ?? null
      }))
    } : null
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

function leagueApiUrl(env, path, fallbackBase) {
  const base = hasLeagueApiServiceBinding(env)
    ? "https://yamo-league-api-worker.service"
    : fallbackBase;
  return new URL(path, base);
}

function hasLeagueApiServiceBinding(env) {
  return Boolean(env?.LEAGUE_API_WORKER && typeof env.LEAGUE_API_WORKER.fetch === "function");
}

async function fetchLeagueApi(env, url, init) {
  const request = new Request(url.toString(), init);
  if (hasLeagueApiServiceBinding(env)) {
    return env.LEAGUE_API_WORKER.fetch(request);
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

function clanCommandPayload() {
  return {
    name: "clan",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Clan leaderboard tools.",
    dm_permission: false,
    options: [
      {
        name: "chart",
        description: "Post the current clan line chart as a PNG.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      }
    ]
  };
}

function duckCommandPayload() {
  return {
    name: "duck",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "Duck chart tools.",
    dm_permission: false,
    options: [
      {
        name: "chart",
        description: "Post the current duck chart as a PNG.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND
      }
    ]
  };
}

function lgCommandPayload() {
  return {
    name: "lg",
    type: APPLICATION_COMMAND_CHAT_INPUT,
    description: "League lookup tools.",
    dm_permission: false,
    options: [
      {
        name: "info",
        description: "Show current league points, rank, and top contributions.",
        type: APPLICATION_COMMAND_OPTION_SUB_COMMAND,
        options: [
          {
            name: "name",
            description: "League name, for example dezzz",
            type: APPLICATION_COMMAND_OPTION_STRING,
            required: true
          }
        ]
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
  const targetName = String(name || "").toLowerCase();
  const stack = [...(interaction.data?.options || [])];

  while (stack.length) {
    const option = stack.shift();
    if (String(option?.name || "").toLowerCase() === targetName && option?.value !== undefined) {
      return String(option.value || "").trim();
    }

    if (Array.isArray(option?.options)) {
      stack.push(...option.options);
    }
  }

  return "";
}

function getSubcommandName(interaction) {
  const option = (interaction.data?.options || [])
    .find(item => Number(item?.type) === APPLICATION_COMMAND_OPTION_SUB_COMMAND);
  return String(option?.name || "").trim().toLowerCase();
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

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
