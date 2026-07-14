const DISCORD_API_BASE = "https://discord.com/api/v10";
const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
const INTERACTION_RESPONSE_PONG = 1;
const INTERACTION_RESPONSE_CHANNEL_MESSAGE = 4;
const APPLICATION_COMMAND_CHAT_INPUT = 1;
const APPLICATION_COMMAND_OPTION_STRING = 3;
const MESSAGE_FLAG_EPHEMERAL = 1 << 6;

export default {
  async fetch(request, env) {
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
        return await handleInteraction(request, env);
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

async function handleInteraction(request, env) {
  const body = await request.text();
  const verified = await verifyDiscordRequest(request, env, body);

  if (!verified) {
    return new Response("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body || "{}");

  if (interaction.type === INTERACTION_TYPE_PING) {
    return interactionJson({ type: INTERACTION_RESPONSE_PONG });
  }

  if (interaction.type !== INTERACTION_TYPE_APPLICATION_COMMAND) {
    return interactionJson(messageResponse("Unsupported interaction type."));
  }

  const commandName = String(interaction.data?.name || "").toLowerCase();
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
      "Refreshed every hour"
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

async function registerSearchCommand(url, env) {
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
    body: JSON.stringify(searchCommandPayload())
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    return json({
      ok: false,
      status: res.status,
      message: discordApiErrorMessage(res.status, payload.message || "Discord command registration failed."),
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
