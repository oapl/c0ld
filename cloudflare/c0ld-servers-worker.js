const SERVERS_TABLE = "c0ld_servers";
const SUBMISSIONS_TABLE = "c0ld_server_submissions";
const EVENTS_TABLE = "c0ld_server_events";
const C0LD_MEMBERS_TABLE = "c0ld_clan_current";
const WMSY_RUNS_TABLE = "wmsy_hourly_runs";
const WMSY_MEMBERS_TABLE = "wmsy_hourly_members";
const DEFAULT_MAX_PLAYERS = 10;
const ROBLOX_BATCH_SIZE = 100;
const DEFAULT_STATUS_SERVER_NUMBER = 20;
const DISCORD_STATUS_EVENT_TYPE = "server_status_discord_message";
const DISCORD_STATUS_COLOR = 0xff9b96;
const TRACKER_GUILDS_TABLE = "discord_server_tracker_guilds";
const TRACKER_SERVERS_TABLE = "discord_server_tracker_servers";
const TRACKER_OBSERVATIONS_TABLE = "discord_server_tracker_observations";
const DEFAULT_TRACKER_PLACE_ID = 8737899170;
const DEFAULT_TRACKER_REFRESH_MINUTES = 10;
const TRACKER_DISCORD_COLOR = 0x3498db;
const TRACKER_DISCORD_COMPONENTS_V2_FLAG = 1 << 15;
const TRACKER_DISCORD_THUMBNAIL_URL = "https://static.wikia.nocookie.net/pet-simulator/images/3/3e/PS99_Genie_Fox.png/revision/latest/scale-to-width/360?cb=20260718171435";
const TRACKER_DISCORD_FOOTER_TEXT = "🧞‍♀️ Luna Pet Sim 99 Bot 🏳️‍🌈 ∙ by Cinnamowopal | Last Updated:";

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/health") {
        response = json({
          ok: true,
          service: "c0ld-servers",
          private_server_tracker: {
            roblox_auth_configured: Boolean(String(env.ROBLOX_SECURITY_COOKIE || "").trim()),
            discord_bot_configured: Boolean(String(env.DISCORD_BOT_TOKEN || "").trim()),
            scheduler_enabled: trackerSchedulerEnabled(env)
          }
        });
      } else if (request.method === "GET" && url.pathname === "/api/servers") {
        response = await handleServers(env);
      } else if (request.method === "GET" && url.pathname === "/api/servers/submission-status") {
        response = handleSubmissionStatus(env);
      } else if (request.method === "POST" && url.pathname === "/api/servers/submit") {
        response = await handleSubmit(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/admin/submissions") {
        requireAdmin(request, env);
        response = await handleAdminSubmissions(request, env);
      } else if (request.method === "POST" && /^\/api\/admin\/submissions\/[^/]+\/approve$/.test(url.pathname)) {
        requireAdmin(request, env);
        response = await handleApproveSubmission(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      } else if (request.method === "POST" && /^\/api\/admin\/submissions\/[^/]+\/decline$/.test(url.pathname)) {
        requireAdmin(request, env);
        response = await handleDeclineSubmission(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      } else if (request.method === "POST" && /^\/api\/admin\/servers\/[^/]+\/players$/.test(url.pathname)) {
        requireAdmin(request, env);
        response = await handleReportPlayers(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      } else if (request.method === "POST" && /^\/api\/admin\/servers\/[^/]+\/discord-status$/.test(url.pathname)) {
        requireAdmin(request, env);
        response = await handlePublishServerStatus(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      } else if (request.method === "POST" && url.pathname === "/api/admin/discord/server-status") {
        requireAdmin(request, env);
        response = await handlePublishServerStatus(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/tracker/server/add") {
        requireAdmin(request, env);
        response = await handleTrackerServerAdd(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/tracker/server/remove") {
        requireAdmin(request, env);
        response = await handleTrackerServerRemove(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/tracker/server/list") {
        requireAdmin(request, env);
        response = await handleTrackerServerList(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/tracker/server/who") {
        requireAdmin(request, env);
        response = await handleTrackerServerWho(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/tracker/tracking") {
        requireAdmin(request, env);
        response = await handleTrackerToggle(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/tracker/refresh") {
        requireAdmin(request, env);
        response = await handleTrackerRefresh(request, env);
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({
        ok: false,
        message: err?.message || String(err)
      }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      Promise.allSettled([
        publishScheduledServerStatus(env),
        refreshEnabledGuildTrackers(env)
      ]).then(results => {
        if (results[0].status === "rejected") {
          console.error("Discord server status publish failed", results[0].reason);
        }
        if (results[1].status === "rejected") {
          console.error("Private server tracker refresh failed", results[1].reason);
        }
      })
    );
  }
};

async function handleTrackerServerAdd(request, env) {
  requireSupabase(env);
  const body = await readJsonOptional(request);
  const guildId = trackerGuildId(body.guild_id);
  const channelId = trackerChannelId(body.channel_id, false);
  const serverLink = firstString(body.server_link, body.link);
  const placeId = trackerPlaceId(body.place_id, DEFAULT_TRACKER_PLACE_ID);
  const actorId = firstString(body.actor_id, body.user_id);

  if (!serverLink) throw httpError(400, "A Roblox private-server link is required.");

  const reference = parsePrivateServerReference(serverLink);
  if (!reference.code && !reference.vipServerId) {
    throw httpError(400, "Could not read a private-server share code, access code, or vipServerId from that value.");
  }

  const guild = await ensureTrackerGuild(env, {
    guild_id: guildId,
    channel_id: channelId,
    default_place_id: placeId,
    created_by_discord_id: actorId
  });
  let authorized = [];
  let collectionError = "";
  try {
    authorized = await fetchRobloxPrivateServers(env, placeId);
  } catch (err) {
    collectionError = err?.message || String(err);
  }
  const matches = authorized.filter(row => privateServerMatchesReference(row, reference));

  if (matches.length > 1) {
    throw httpError(409, "That link matched more than one authorized private server. Use a link containing its exact access code.");
  }

  const remote = matches[0] || null;
  const vipServerId = remote ? robloxVipServerId(remote) : "";
  const resolved = Boolean(remote && vipServerId);
  const visibleVipServerIds = [
    ...new Set(authorized.map(row => robloxVipServerId(row)).filter(Boolean))
  ];
  const resolutionError = resolved
    ? ""
    : collectionError
      ? "Awaiting observer access; the latest Roblox collection was unavailable."
      : `Awaiting observer access. The account currently sees ${authorized.length} other private servers for this place.`;
  const existing = await findTrackerServerByStableReference(env, guildId, placeId, reference, vipServerId);
  const existingBaseline = jsonArray(existing?.resolution_baseline_vip_server_ids)
    .map(normalizePrivateServerIdentifier)
    .filter(Boolean);
  const now = new Date().toISOString();
  const serverValues = {
    guild_id: guildId,
    place_id: placeId,
    vip_server_id: vipServerId || existing?.vip_server_id || null,
    access_code: firstString(remote?.accessCode, remote?.access_code, reference.accessCode, existing?.access_code) || null,
    share_code: firstString(reference.shareCode, remote?.shareCode, remote?.share_code, existing?.share_code, reference.code) || null,
    server_link: serverLink,
    server_name: firstString(remote?.name, remote?.serverName, existing?.server_name) || null,
    owner_user_id: trackerOptionalInteger(remote?.owner?.id, remote?.ownerId, remote?.owner_user_id, existing?.owner_user_id),
    owner_username: firstString(remote?.owner?.name, remote?.owner?.username, remote?.ownerName, existing?.owner_username) || null,
    resolution_status: resolved ? "resolved" : "pending",
    resolution_error: resolutionError || null,
    last_resolution_at: now,
    resolution_baseline_vip_server_ids: resolved
      ? []
      : existing?.resolution_baseline_ready
        ? existingBaseline
        : visibleVipServerIds,
    resolution_baseline_ready: resolved ||
      Boolean(existing?.resolution_baseline_ready) ||
      !collectionError,
    is_active: true,
    created_by_discord_id: actorId,
    updated_at: now
  };

  let tracked;
  if (existing) {
    const rows = await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${existing.id}` }, serverValues);
    tracked = rows?.[0] || { ...existing, ...serverValues };
  } else {
    const serverNumber = await nextTrackerServerNumber(env, guildId);
    const rows = await supabaseInsert(env, TRACKER_SERVERS_TABLE, [{
      ...serverValues,
      server_number: serverNumber
    }]);
    tracked = rows?.[0];
  }

  if (resolved) {
    const memberSets = await fetchClanMemberSets(env);
    const observation = await buildTrackerObservation(tracked, remote, memberSets, env, now);
    await supabaseInsert(env, TRACKER_OBSERVATIONS_TABLE, [observation]);
  }
  await markTrackerGuildRefresh(env, guild, now, collectionError);
  const state = await loadTrackerState(env, guildId);
  const published = await publishTrackerMessage(env, state).catch(err => ({
    ok: false,
    message: err?.message || String(err)
  }));

  return json({
    ok: true,
    action: existing ? "updated" : "added",
    resolved,
    resolution_message: resolved
      ? "Matched to the stable Roblox vipServerId."
      : "Saved immediately. The tracker will resolve it automatically after the central observer account can access the server.",
    observer_username: firstString(env.ROBLOX_OBSERVER_USERNAME) || null,
    server: serializeTrackedServer(state.servers.find(row => row.id === tracked.id) || tracked),
    persistent_message: published
  });
}

async function handleTrackerServerRemove(request, env) {
  requireSupabase(env);
  const body = await readJsonOptional(request);
  const guildId = trackerGuildId(body.guild_id);
  const reference = firstString(body.server, body.server_id, body.server_number);
  if (!reference) throw httpError(400, "Provide a server such as S1.");

  const server = await findTrackedServer(env, guildId, reference, false);
  if (!server) throw httpError(404, `No tracked server matched ${reference}.`);

  const rows = await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${server.id}` }, {
    is_active: false,
    updated_at: new Date().toISOString()
  });
  const state = await loadTrackerState(env, guildId);
  const published = await publishTrackerMessage(env, state).catch(err => ({
    ok: false,
    message: err?.message || String(err)
  }));

  return json({
    ok: true,
    action: "removed",
    server: serializeTrackedServer(rows?.[0] || server),
    persistent_message: published
  });
}

async function handleTrackerServerList(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const guildId = trackerGuildId(url.searchParams.get("guild_id"));
  const state = await loadTrackerState(env, guildId);
  return json(serializeTrackerState(state));
}

async function handleTrackerServerWho(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const guildId = trackerGuildId(url.searchParams.get("guild_id"));
  const reference = firstString(url.searchParams.get("server"), url.searchParams.get("server_id"));
  if (!reference) throw httpError(400, "Provide ?server=S1.");

  const state = await loadTrackerState(env, guildId);
  const server = findTrackedServerInState(state.servers, reference);
  if (!server) throw httpError(404, `No active tracked server matched ${reference}.`);

  return json({
    ok: true,
    guild: serializeTrackerGuild(state.guild),
    server: serializeTrackedServer(server),
    players: jsonArray(server.effective_observation?.players)
  });
}

async function handleTrackerToggle(request, env) {
  requireSupabase(env);
  const body = await readJsonOptional(request);
  const guildId = trackerGuildId(body.guild_id);
  const channelId = trackerChannelId(body.channel_id, true);
  const enabled = Boolean(body.enabled);
  const guild = await ensureTrackerGuild(env, {
    guild_id: guildId,
    channel_id: channelId,
    tracking_enabled: enabled,
    default_place_id: trackerPlaceId(body.place_id, DEFAULT_TRACKER_PLACE_ID),
    created_by_discord_id: firstString(body.actor_id, body.user_id)
  });

  let result;
  if (enabled) {
    result = await collectTrackerGuild(env, guild, { source: "command" });
  } else {
    const state = await loadTrackerState(env, guildId);
    result = {
      ok: true,
      state: serializeTrackerState(state),
      persistent_message: await publishTrackerMessage(env, state).catch(err => ({
        ok: false,
        message: err?.message || String(err)
      }))
    };
  }

  return json({
    ok: true,
    tracking_enabled: enabled,
    ...result
  });
}

async function handleTrackerRefresh(request, env) {
  requireSupabase(env);
  const body = await readJsonOptional(request);
  const url = new URL(request.url);
  const guildId = trackerGuildId(firstString(body.guild_id, url.searchParams.get("guild_id")));
  const guild = await fetchTrackerGuild(env, guildId);
  if (!guild) throw httpError(404, "Tracker configuration was not found for that guild.");
  return json(await collectTrackerGuild(env, guild, { source: "manual" }));
}

async function refreshEnabledGuildTrackers(env) {
  if (!trackerSchedulerEnabled(env)) {
    return { ok: true, skipped: true, message: "SERVER_TRACKER_ENABLED is not true." };
  }

  requireSupabase(env);
  const guilds = await supabaseSelect(env, TRACKER_GUILDS_TABLE, {
    select: "*",
    tracking_enabled: "eq.true",
    order: "guild_id.asc",
    limit: "1000"
  });
  const dueGuilds = guilds.filter(trackerGuildIsDue);
  if (!dueGuilds.length) {
    return { ok: true, refreshed: 0, message: "No tracker guilds are due." };
  }

  const placeIds = new Set();
  const serversByGuild = new Map();
  for (const guild of dueGuilds) {
    const servers = await fetchTrackerServers(env, guild.guild_id);
    serversByGuild.set(guild.guild_id, servers);
    for (const server of servers) placeIds.add(String(server.place_id));
  }

  const authorizedByPlace = new Map();
  for (const placeId of placeIds) {
    try {
      authorizedByPlace.set(placeId, {
        rows: await fetchRobloxPrivateServers(env, placeId),
        error: null
      });
    } catch (err) {
      authorizedByPlace.set(placeId, {
        rows: [],
        error: err?.message || String(err)
      });
    }
  }

  const results = [];
  for (const guild of dueGuilds) {
    try {
      results.push(await collectTrackerGuild(env, guild, {
        source: "schedule",
        servers: serversByGuild.get(guild.guild_id) || [],
        authorizedByPlace
      }));
    } catch (err) {
      results.push({
        ok: false,
        guild_id: guild.guild_id,
        message: err?.message || String(err)
      });
    }
  }

  return {
    ok: results.every(result => result.ok !== false),
    refreshed: results.length,
    results
  };
}

async function collectTrackerGuild(env, guild, options = {}) {
  const now = new Date().toISOString();
  const servers = options.servers || await fetchTrackerServers(env, guild.guild_id);
  const memberSets = await fetchClanMemberSets(env);
  const authorizedByPlace = options.authorizedByPlace || new Map();
  const errors = [];
  const observations = [];
  let pendingCount = 0;
  const claimedVipServerIds = new Set(
    servers.map(server => normalizePrivateServerIdentifier(server.vip_server_id)).filter(Boolean)
  );

  for (const placeId of new Set(servers.map(server => String(server.place_id)))) {
    if (!authorizedByPlace.has(placeId)) {
      try {
        authorizedByPlace.set(placeId, {
          rows: await fetchRobloxPrivateServers(env, placeId),
          error: null
        });
      } catch (err) {
        authorizedByPlace.set(placeId, {
          rows: [],
          error: err?.message || String(err)
        });
      }
    }
  }

  for (const server of servers) {
    const placeResult = authorizedByPlace.get(String(server.place_id)) || {
      rows: [],
      error: "No Roblox collection result was available."
    };
    const vipServerId = firstString(server.vip_server_id);
    const storedReference = {
      code: normalizePrivateServerIdentifier(firstString(server.share_code, server.access_code)),
      shareCode: normalizePrivateServerIdentifier(server.share_code),
      accessCode: normalizePrivateServerIdentifier(server.access_code),
      vipServerId: normalizePrivateServerIdentifier(vipServerId)
    };
    let remote = vipServerId
      ? placeResult.rows.find(row => robloxVipServerId(row) === vipServerId)
      : placeResult.rows.find(row => privateServerMatchesReference(row, storedReference));
    let pendingResolutionError = "";

    if (
      !remote &&
      !vipServerId &&
      !placeResult.error &&
      server.resolution_baseline_ready
    ) {
      const baselineVipServerIds = new Set(
        jsonArray(server.resolution_baseline_vip_server_ids)
          .map(normalizePrivateServerIdentifier)
          .filter(Boolean)
      );
      const newlyVisible = placeResult.rows.filter(row => {
        const candidateVipServerId = robloxVipServerId(row);
        return candidateVipServerId &&
          !baselineVipServerIds.has(candidateVipServerId) &&
          !claimedVipServerIds.has(candidateVipServerId);
      });

      if (newlyVisible.length === 1) {
        remote = newlyVisible[0];
      } else if (newlyVisible.length > 1) {
        pendingResolutionError =
          "Multiple new private servers became visible to the observer account. Approve pending servers one at a time so each link can be matched safely.";
      }
    }

    if (remote) {
      const resolvedVipServerId = robloxVipServerId(remote);
      if (!resolvedVipServerId) {
        pendingCount += 1;
        await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${server.id}` }, {
          resolution_status: "pending",
          resolution_error: "Roblox returned a matching record without a vipServerId.",
          last_resolution_at: now,
          updated_at: now
        });
        continue;
      }

      const serverUpdate = {
        vip_server_id: resolvedVipServerId,
        access_code: firstString(remote.accessCode, remote.access_code, server.access_code) || null,
        server_name: firstString(remote.name, remote.serverName, server.server_name) || null,
        owner_user_id: trackerOptionalInteger(remote.owner?.id, remote.ownerId, remote.owner_user_id, server.owner_user_id),
        owner_username: firstString(remote.owner?.name, remote.owner?.username, remote.ownerName, server.owner_username) || null,
        resolution_status: "resolved",
        resolution_error: null,
        last_resolution_at: now,
        resolution_baseline_vip_server_ids: [],
        resolution_baseline_ready: true,
        updated_at: now
      };
      if (!vipServerId || server.resolution_status !== "resolved") {
        await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${server.id}` }, serverUpdate);
      }
      claimedVipServerIds.add(resolvedVipServerId);
      observations.push(await buildTrackerObservation({ ...server, ...serverUpdate }, remote, memberSets, env, now));
      continue;
    }

    if (!vipServerId) {
      pendingCount += 1;
      if (!placeResult.error && !server.resolution_baseline_ready) {
        const baselineVipServerIds = [
          ...new Set(placeResult.rows.map(row => robloxVipServerId(row)).filter(Boolean))
        ];
        await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${server.id}` }, {
          resolution_status: "pending",
          resolution_error:
            "Observer baseline captured. Grant the observer account access to this private server after this refresh.",
          resolution_baseline_vip_server_ids: baselineVipServerIds,
          resolution_baseline_ready: true,
          last_resolution_at: now,
          updated_at: now
        });
        continue;
      }
      const message = placeResult.error
        ? "Awaiting observer access; the latest Roblox collection was unavailable."
        : pendingResolutionError ||
          "Awaiting observer access. Grant the central observer Roblox account access to this private server.";
      await supabasePatch(env, TRACKER_SERVERS_TABLE, { id: `eq.${server.id}` }, {
        resolution_status: "pending",
        resolution_error: message,
        last_resolution_at: now,
        updated_at: now
      });
      if (placeResult.error) errors.push(`S${server.server_number}: ${placeResult.error}`);
      continue;
    }

    const message = placeResult.error ||
      `vipServerId ${vipServerId} was not returned by the authorized private-server endpoint.`;
    errors.push(`S${server.server_number}: ${message}`);
    observations.push(buildUnavailableTrackerObservation(server, message, now));
  }

  if (observations.length) {
    await supabaseInsert(env, TRACKER_OBSERVATIONS_TABLE, observations);
  }

  const errorMessage = errors.join(" | ").slice(0, 4000);
  await markTrackerGuildRefresh(env, guild, now, errorMessage);
  const state = await loadTrackerState(env, guild.guild_id);
  const published = await publishTrackerMessage(env, state).catch(err => ({
    ok: false,
    message: err?.message || String(err)
  }));

  return {
    ok: !errors.length,
    guild_id: guild.guild_id,
    source: options.source || "manual",
    observed_at: now,
    tracked_server_count: servers.length,
    unavailable_count: errors.length,
    pending_resolution_count: pendingCount,
    state: serializeTrackerState(state),
    persistent_message: published
  };
}

async function fetchRobloxPrivateServers(env, placeId) {
  const cookieValue = firstString(env.ROBLOX_SECURITY_COOKIE, env.ROBLOSECURITY);
  if (!cookieValue) {
    throw httpError(500, "Missing ROBLOX_SECURITY_COOKIE on the c0ld servers Worker.");
  }

  const cookie = /^\.ROBLOSECURITY=/i.test(cookieValue)
    ? cookieValue
    : `.ROBLOSECURITY=${cookieValue}`;
  const rows = [];
  let cursor = "";

  for (let page = 0; page < 100; page += 1) {
    const url = new URL(`https://games.roblox.com/v1/games/${encodeURIComponent(placeId)}/private-servers`);
    url.searchParams.set("cursor", cursor);
    url.searchParams.set("sortOrder", "Desc");
    url.searchParams.set("excludeFullGames", "false");

    const res = await fetchWithRetry(url.toString(), {
      headers: {
        Accept: "application/json",
        Cookie: cookie,
        "User-Agent": "c0ld-Private-Server-Tracker/1.0"
      }
    }, 4);

    if (res.status === 401 || res.status === 403) {
      throw httpError(502, "Roblox rejected ROBLOX_SECURITY_COOKIE. Rotate the Worker secret and confirm the observer account can access these private servers.");
    }
    if (!res.ok) {
      throw httpError(502, `Roblox private-server collection failed (${res.status}): ${truncateText(await res.text(), 400)}`);
    }

    const payload = await res.json().catch(() => ({}));
    rows.push(...(Array.isArray(payload.data) ? payload.data : []));
    cursor = firstString(payload.nextPageCursor);
    if (!cursor) break;
  }

  return rows;
}

async function fetchWithRetry(url, init, attempts) {
  let lastResponse;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResponse = await fetch(url, init);
    if (lastResponse.ok || ![429, 500, 502, 503, 504].includes(lastResponse.status) || attempt === attempts) {
      return lastResponse;
    }

    const retryAfter = Number(lastResponse.headers.get("Retry-After"));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30000)
      : Math.min(1000 * (2 ** (attempt - 1)), 10000);
    await sleep(delayMs);
  }
  return lastResponse;
}

async function buildTrackerObservation(server, remote, memberSets, env, observedAt) {
  const players = await enrichPlayers(annotatePlayers(normalizeRobloxServerPlayers(remote.players), memberSets), env);
  const playing = trackerOptionalInteger(remote.playing, players.length);
  const maxPlayers = trackerOptionalInteger(remote.maxPlayers, remote.max_players);
  const status = !remote.id || !playing
    ? "offline"
    : maxPlayers && playing >= maxPlayers
      ? "full"
      : "online";

  return {
    tracked_server_id: server.id,
    guild_id: server.guild_id,
    place_id: Number(server.place_id),
    vip_server_id: String(server.vip_server_id),
    job_id: firstString(remote.id),
    playing: playing ?? 0,
    max_players: maxPlayers,
    players,
    player_tokens: Array.isArray(remote.playerTokens) ? remote.playerTokens : [],
    clan_counts: countPlayerClans(players),
    fps: trackerOptionalNumber(remote.fps),
    ping: trackerOptionalNumber(remote.ping),
    status,
    collection_error: null,
    observed_at: observedAt,
    raw_payload: remote
  };
}

function buildUnavailableTrackerObservation(server, message, observedAt) {
  return {
    tracked_server_id: server.id,
    guild_id: server.guild_id,
    place_id: Number(server.place_id),
    vip_server_id: String(server.vip_server_id),
    job_id: null,
    playing: null,
    max_players: null,
    players: [],
    player_tokens: [],
    clan_counts: {},
    fps: null,
    ping: null,
    status: "unavailable",
    collection_error: truncateText(message, 1000),
    observed_at: observedAt,
    raw_payload: null
  };
}

function normalizeRobloxServerPlayers(value) {
  return (Array.isArray(value) ? value : []).map((player, index) => ({
    user_id: firstString(player.id, player.userId, player.user_id),
    username: firstString(player.name, player.username),
    display_name: firstString(player.displayName, player.display_name),
    avatar_url: firstString(player.avatarUrl, player.avatar_url),
    slot: index + 1
  }));
}

async function ensureTrackerGuild(env, values) {
  const existing = await fetchTrackerGuild(env, values.guild_id);
  const now = new Date().toISOString();
  const row = {
    guild_id: values.guild_id,
    channel_id: firstString(values.channel_id, existing?.channel_id) || null,
    tracking_enabled: values.tracking_enabled === undefined
      ? Boolean(existing?.tracking_enabled)
      : Boolean(values.tracking_enabled),
    default_place_id: trackerPlaceId(values.default_place_id, existing?.default_place_id || DEFAULT_TRACKER_PLACE_ID),
    refresh_minutes: trackerRefreshMinutes(values.refresh_minutes, existing?.refresh_minutes),
    created_by_discord_id: firstString(existing?.created_by_discord_id, values.created_by_discord_id) || null,
    updated_at: now
  };
  const rows = await supabaseUpsert(env, TRACKER_GUILDS_TABLE, [row], "guild_id");
  return rows?.[0] || { ...existing, ...row };
}

async function fetchTrackerGuild(env, guildId) {
  return fetchSingle(env, TRACKER_GUILDS_TABLE, {
    select: "*",
    guild_id: `eq.${guildId}`
  });
}

async function fetchTrackerServers(env, guildId, activeOnly = true) {
  const params = {
    select: "*",
    guild_id: `eq.${guildId}`,
    order: "server_number.asc",
    limit: "1000"
  };
  if (activeOnly) params.is_active = "eq.true";
  return supabaseSelect(env, TRACKER_SERVERS_TABLE, params);
}

async function nextTrackerServerNumber(env, guildId) {
  const rows = await supabaseSelect(env, TRACKER_SERVERS_TABLE, {
    select: "server_number",
    guild_id: `eq.${guildId}`,
    order: "server_number.desc",
    limit: "1"
  });
  return Number(rows?.[0]?.server_number || 0) + 1;
}

async function findTrackedServer(env, guildId, reference, activeOnly = true) {
  const servers = await fetchTrackerServers(env, guildId, activeOnly);
  return findTrackedServerInState(servers, reference);
}

async function findTrackerServerByStableReference(env, guildId, placeId, reference, vipServerId) {
  const servers = await fetchTrackerServers(env, guildId, false);
  const normalizedVipServerId = normalizePrivateServerIdentifier(vipServerId);
  const referenceIdentifiers = new Set([
    reference.code,
    reference.shareCode,
    reference.accessCode,
    reference.vipServerId
  ].map(normalizePrivateServerIdentifier).filter(Boolean));

  return servers.find(server => {
    if (Number(server.place_id) !== Number(placeId)) return false;
    if (
      normalizedVipServerId &&
      normalizePrivateServerIdentifier(server.vip_server_id) === normalizedVipServerId
    ) {
      return true;
    }

    return [server.share_code, server.access_code]
      .map(normalizePrivateServerIdentifier)
      .filter(Boolean)
      .some(identifier => referenceIdentifiers.has(identifier));
  }) || null;
}

function findTrackedServerInState(servers, reference) {
  const raw = String(reference || "").trim();
  const serverNumberMatch = raw.match(/^s(?:erver\s*)?(\d+)$/i) || raw.match(/^(\d+)$/);
  if (serverNumberMatch) {
    const number = Number(serverNumberMatch[1]);
    const numbered = servers.find(server => Number(server.server_number) === number);
    if (numbered) return numbered;
  }
  return servers.find(server => String(server.vip_server_id) === raw) || null;
}

async function loadTrackerState(env, guildId) {
  const guild = await fetchTrackerGuild(env, guildId);
  if (!guild) {
    return {
      guild: {
        guild_id: guildId,
        tracking_enabled: false,
        refresh_minutes: DEFAULT_TRACKER_REFRESH_MINUTES
      },
      servers: []
    };
  }

  const servers = await fetchTrackerServers(env, guildId);
  const observationLimit = String(Math.min(5000, Math.max(200, servers.length * 8)));
  const observations = servers.length
    ? await supabaseSelect(env, TRACKER_OBSERVATIONS_TABLE, {
        select: "id,tracked_server_id,job_id,playing,max_players,players,player_tokens,clan_counts,fps,ping,status,collection_error,observed_at",
        guild_id: `eq.${guildId}`,
        order: "observed_at.desc",
        limit: observationLimit
      })
    : [];
  const successfulObservations = servers.length
    ? await supabaseSelect(env, TRACKER_OBSERVATIONS_TABLE, {
        select: "id,tracked_server_id,job_id,playing,max_players,players,player_tokens,clan_counts,fps,ping,status,collection_error,observed_at",
        guild_id: `eq.${guildId}`,
        status: "neq.unavailable",
        order: "observed_at.desc",
        limit: observationLimit
      })
    : [];
  const latest = new Map();
  const lastGood = new Map();

  for (const observation of observations) {
    const key = String(observation.tracked_server_id);
    if (!latest.has(key)) latest.set(key, observation);
  }
  for (const observation of successfulObservations) {
    const key = String(observation.tracked_server_id);
    if (!lastGood.has(key)) lastGood.set(key, observation);
  }

  return {
    guild,
    servers: servers.map(server => {
      const key = String(server.id);
      const current = latest.get(key) || null;
      const good = lastGood.get(key) || null;
      return {
        ...server,
        latest_observation: current,
        effective_observation: current?.status === "unavailable" ? good : current,
        last_good_observation: good
      };
    })
  };
}

async function markTrackerGuildRefresh(env, guild, observedAt, errorMessage) {
  await supabasePatch(env, TRACKER_GUILDS_TABLE, { guild_id: `eq.${guild.guild_id}` }, {
    last_refresh_at: observedAt,
    last_success_at: errorMessage ? guild.last_success_at || null : observedAt,
    last_error: errorMessage || null,
    updated_at: observedAt
  });
}

function serializeTrackerState(state) {
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    guild: serializeTrackerGuild(state.guild),
    servers: state.servers.map(serializeTrackedServer)
  };
}

function serializeTrackerGuild(guild) {
  return {
    guild_id: guild?.guild_id || null,
    channel_id: guild?.channel_id || null,
    message_id: guild?.message_id || null,
    tracking_enabled: Boolean(guild?.tracking_enabled),
    default_place_id: Number(guild?.default_place_id || DEFAULT_TRACKER_PLACE_ID),
    refresh_minutes: Number(guild?.refresh_minutes || DEFAULT_TRACKER_REFRESH_MINUTES),
    last_refresh_at: guild?.last_refresh_at || null,
    last_success_at: guild?.last_success_at || null,
    last_error: guild?.last_error || null
  };
}

function serializeTrackedServer(server) {
  const latest = server.latest_observation || null;
  const effective = server.effective_observation || latest;
  const pendingResolution = server.resolution_status === "pending" || !firstString(server.vip_server_id);
  return {
    id: server.id,
    label: `S${server.server_number}`,
    server_number: Number(server.server_number),
    place_id: Number(server.place_id),
    vip_server_id: firstString(server.vip_server_id) || null,
    server_link: server.server_link,
    server_name: server.server_name || null,
    owner_user_id: server.owner_user_id || null,
    owner_username: server.owner_username || null,
    is_active: Boolean(server.is_active),
    resolution_status: pendingResolution ? "pending" : "resolved",
    resolution_error: server.resolution_error || null,
    status: pendingResolution ? "pending" : latest?.status || "unavailable",
    stale: pendingResolution || latest?.status === "unavailable",
    job_id: effective?.job_id || null,
    playing: effective?.playing ?? null,
    max_players: effective?.max_players ?? null,
    players: jsonArray(effective?.players),
    clan_counts: effective?.clan_counts || {},
    fps: effective?.fps ?? null,
    ping: effective?.ping ?? null,
    observed_at: latest?.observed_at || null,
    last_known_at: effective?.observed_at || null,
    collection_error: latest?.collection_error || server.resolution_error || null
  };
}

async function publishTrackerMessage(env, state) {
  const guild = state.guild || {};
  if (!guild.channel_id) {
    return { ok: true, skipped: true, message: "No tracker channel is configured." };
  }

  const payload = buildTrackerDiscordPayload(state);
  const result = await upsertDiscordBotMessage(env, guild.channel_id, guild.message_id, payload);

  if (result.message_id && result.message_id !== guild.message_id) {
    await supabasePatch(env, TRACKER_GUILDS_TABLE, { guild_id: `eq.${guild.guild_id}` }, {
      message_id: result.message_id,
      updated_at: new Date().toISOString()
    });
  }

  return {
    ok: true,
    action: result.action,
    message_id: result.message_id
  };
}

function buildTrackerDiscordPayload(state) {
  const guild = state.guild || {};
  const rows = (state.servers || []).map(server => serializeTrackedServer(server));
  const timestamp = guild.last_refresh_at || new Date().toISOString();
  const parsedTimestamp = Date.parse(timestamp);
  const unix = Number.isFinite(parsedTimestamp)
    ? Math.floor(parsedTimestamp / 1000)
    : Math.floor(Date.now() / 1000);
  const refreshMinutes = Number(guild.refresh_minutes || DEFAULT_TRACKER_REFRESH_MINUTES);
  const trackingEnabled = Boolean(guild.tracking_enabled);

  const serverBlocks = rows.map(row => {
    const counts = row.clan_counts || {};
    const statusIcon = trackerMonitorStatusIcon(row.status);
    const statusLabel = trackerMonitorStatusLabel(row.status);
    const population = trackerMonitorPopulation(row);
    const nameLine = row.server_name
      ? `
-# ${trackerEscapeDiscord(row.server_name)}`
      : '';
    const clanLine = row.status === 'pending'
      ? ''
      : `
**Clans:** C0LD ${Number(counts.C0LD || 0)} · WMSY ${Number(counts.WMSY || 0)} · Other ${Number(counts.other || 0)}`;
    const latencyLine = row.status === 'pending' || row.status === 'offline'
      ? ''
      : `
**Ping:** ${trackerMonitorMetric(row.ping, 'ms')} · **FPS:** ${trackerMonitorMetric(row.fps, '')}`;
    const staleLine = row.stale && row.status !== 'pending'
      ? `
-# Last successful observation: ${trackerDiscordTimestamp(row.last_known_at || row.observed_at)}`
      : '';
    const collectionError = firstString(row.collection_error, row.resolution_error);
    const errorLine = row.status === 'pending' && collectionError
      ? `
-# ${trackerEscapeDiscord(collectionError)}`
      : '';
    const joinLine = row.server_link
      ? `
[Join Server](${row.server_link})`
      : '';
    const label = trackerEscapeDiscord(row.label || `S${row.server_number || '?'}`);

    return [
      `### ${statusIcon} ${label} · ${statusLabel}`,
      `**Players:** ${population}${nameLine}${clanLine}${latencyLine}${staleLine}${errorLine}${joinLine}`
    ].join('
');
  });

  const serverSection = !trackingEnabled
    ? 'Tracking is disabled for this Discord server.'
    : serverBlocks.length
      ? serverBlocks.join('

')
      : 'No private servers are currently tracked. Use `/server add` to add one.';

  const summary = trackerMonitorSummary(rows);
  const healthLine = guild.last_error
    ? `-# ⚠️ Latest refresh issue: ${trackerEscapeDiscord(guild.last_error)}`
    : '';

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
              '## 🖥️ Private Server Monitor',
              `${trackingEnabled ? '🟢' : '🔴'} **Tracking ${trackingEnabled ? 'Enabled' : 'Disabled'}**`,
              `Last Updated: <t:${unix}:R>`,
              trackingEnabled
                ? `Refreshes every ${refreshMinutes} minutes`
                : 'Automatic refresh is disabled',
              healthLine
            ].filter(Boolean).join('
')
          }],
          accessory: {
            type: 11,
            media: { url: TRACKER_DISCORD_THUMBNAIL_URL },
            description: 'PS99 Genie Fox'
          }
        },
        trackerDiscordSeparator(),
        {
          type: 10,
          content: [
            '## Summary',
            `**Online:** ${summary.online} · **Full:** ${summary.full} · **Offline:** ${summary.offline}`,
            `**Pending:** ${summary.pending} · **Unavailable:** ${summary.unavailable}`,
            `**Players:** ${summary.players}/${summary.capacity}`
          ].join('
')
        },
        trackerDiscordSeparator(),
        {
          type: 10,
          content: `## Private Servers
${serverSection}`.slice(0, 4000)
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
  if (status === 'pending') return '🟡';
  if (status === 'online') return '🟢';
  if (status === 'full') return '🟣';
  if (status === 'offline') return '🔴';
  return '🟠';
}

function trackerMonitorStatusLabel(status) {
  if (status === 'pending') return 'Awaiting Observer Access';
  if (status === 'online') return 'Online';
  if (status === 'full') return 'Full';
  if (status === 'offline') return 'Offline';
  return 'Unavailable';
}

function trackerMonitorPopulation(row) {
  if (row.status === 'pending') return 'Awaiting observer access';
  const playing = Number(row.playing);
  const maxPlayers = Number(row.max_players);
  if (!Number.isFinite(playing)) return 'Unknown';
  return `${playing}/${Number.isFinite(maxPlayers) && maxPlayers > 0 ? maxPlayers : '?'}`;
}

function trackerMonitorMetric(value, suffix) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Unknown';
  const rounded = Math.round(number * 10) / 10;
  return `${rounded}${suffix}`;
}

function trackerDiscordTimestamp(value) {
  const ms = Date.parse(value || '');
  if (!Number.isFinite(ms)) return 'Unknown';
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

function trackerEscapeDiscord(value) {
  return String(value || '')
    .replace(/([\`*_{}\[\]()<>#+\-.!|~>])/g, '\$1')
    .slice(0, 500);
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


function trackerDiscordSeparator() {
  return {
    type: 14,
    divider: true,
    spacing: 1
  };
}

async function deleteDiscordBotMessageBestEffort(token, channelId, messageId) {
  try {
    await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${token}`,
          Accept: "application/json"
        }
      }
    );
  } catch {}
}

async function upsertDiscordBotMessage(env, channelId, messageId, payload) {
  const token = firstString(env.DISCORD_BOT_TOKEN);
  if (!token) throw httpError(500, "Missing DISCORD_BOT_TOKEN on the c0ld servers Worker.");
  const headers = {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };

  if (messageId) {
    const update = await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload)
      }
    );
    if (update.ok) {
      const message = await update.json().catch(() => ({ id: messageId }));
      return { action: "updated", message_id: firstString(message.id, messageId), message };
    }
    if (update.status === 400) {
      await deleteDiscordBotMessageBestEffort(token, channelId, messageId);
    } else if (![403, 404].includes(update.status)) {
      throw httpError(502, `Discord tracker message update failed (${update.status}): ${truncateText(await update.text(), 400)}`);
    }
  }

  const create = await fetch(
    `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    }
  );
  if (!create.ok) {
    throw httpError(502, `Discord tracker message create failed (${create.status}): ${truncateText(await create.text(), 400)}`);
  }
  const message = await create.json();
  return { action: "created", message_id: firstString(message.id), message };
}

function parsePrivateServerReference(value) {
  const raw = String(value || "").trim();
  let code = "";
  let vipServerId = "";
  let accessCode = "";
  let shareCode = "";

  try {
    const url = new URL(raw);
    shareCode = firstString(url.searchParams.get("code"));
    accessCode = firstString(
      url.searchParams.get("privateServerLinkCode"),
      url.searchParams.get("accessCode")
    );
    vipServerId = firstString(url.searchParams.get("vipServerId"));
    code = firstString(shareCode, accessCode, vipServerId);
  } catch {}

  if (!code && /^[a-z0-9_-]{6,}$/i.test(raw)) code = raw;
  if (!vipServerId && /^\d+$/.test(raw)) vipServerId = raw;

  return {
    raw,
    code: normalizePrivateServerIdentifier(code),
    shareCode: normalizePrivateServerIdentifier(shareCode),
    accessCode: normalizePrivateServerIdentifier(accessCode),
    vipServerId: normalizePrivateServerIdentifier(vipServerId)
  };
}

function privateServerMatchesReference(server, reference) {
  const identifiers = robloxPrivateServerIdentifiers(server);
  if (reference.vipServerId && identifiers.has(reference.vipServerId)) return true;
  return Boolean(reference.code && identifiers.has(reference.code));
}

function robloxPrivateServerIdentifiers(server) {
  return new Set([
    server.vipServerId,
    server.vip_server_id,
    server.accessCode,
    server.access_code,
    server.privateServerLinkCode,
    server.private_server_link_code,
    server.shareCode,
    server.share_code,
    server.linkCode
  ].map(normalizePrivateServerIdentifier).filter(Boolean));
}

function robloxVipServerId(server) {
  return normalizePrivateServerIdentifier(firstString(server.vipServerId, server.vip_server_id));
}

function normalizePrivateServerIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function trackerGuildId(value) {
  const guildId = String(value || "").trim();
  if (!/^\d{10,24}$/.test(guildId)) throw httpError(400, "A valid Discord guild_id is required.");
  return guildId;
}

function trackerChannelId(value, required) {
  const channelId = String(value || "").trim();
  if (!channelId && !required) return "";
  if (!/^\d{10,24}$/.test(channelId)) throw httpError(400, "A valid Discord channel_id is required.");
  return channelId;
}

function trackerPlaceId(value, fallback) {
  const placeId = Math.trunc(Number(value || fallback || DEFAULT_TRACKER_PLACE_ID));
  if (!Number.isSafeInteger(placeId) || placeId <= 0) throw httpError(400, "A valid Roblox place_id is required.");
  return placeId;
}

function trackerRefreshMinutes(value, fallback) {
  const number = Math.round(Number(value || fallback || DEFAULT_TRACKER_REFRESH_MINUTES));
  return clamp(Number.isFinite(number) ? number : DEFAULT_TRACKER_REFRESH_MINUTES, 1, 60);
}

function trackerOptionalInteger(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Math.trunc(Number(value));
    if (Number.isSafeInteger(number)) return number;
  }
  return null;
}

function trackerOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function trackerSchedulerEnabled(env) {
  return String(env.SERVER_TRACKER_ENABLED || "").toLowerCase() === "true";
}

function trackerGuildIsDue(guild) {
  const last = Date.parse(guild.last_refresh_at || "");
  if (!Number.isFinite(last)) return true;
  const refreshMs = trackerRefreshMinutes(guild.refresh_minutes) * 60 * 1000;
  return Date.now() - last >= refreshMs - 5000;
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

async function handleServers(env) {
  requireSupabase(env);
  const rows = await supabaseSelect(env, SERVERS_TABLE, {
    select: "id,server_number,share_code,server_link,location,player_count,max_players,current_players,clan_counts,players_updated_at,compromise_status,pathing_video_url,updated_at,is_active",
    is_active: "eq.true",
    order: "server_number.asc"
  });

  const memberSets = await fetchClanMemberSets(env);
  const servers = await Promise.all(rows.map(row => serializeServer(row, memberSets, env)));

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    discord: {
      empty_emoji: ":mobile_phone_off:",
      default_max_players: DEFAULT_MAX_PLAYERS
    },
    submissions: getSubmissionStatus(env),
    rows: servers
  }, env);
}

async function handleSubmit(request, env) {
  requireSupabase(env);
  const submissionStatus = getSubmissionStatus(env);
  if (!submissionStatus.accepting) {
    throw httpError(403, submissionStatus.message);
  }

  const user = await authorizeSubmission(request, env);
  const form = await request.formData();
  const serverLink = String(form.get("server_link") || "").trim();
  const location = normalizeLocation(form.get("location"));
  const pathingVideo = String(form.get("pathing_video") || "").trim();
  const videoFile = form.get("video_file");
  const hasFile = videoFile && typeof videoFile === "object" && Number(videoFile.size || 0) > 0;

  if (!serverLink) throw httpError(400, "Server Link is required.");

  const normalized = normalizeServerLink(serverLink);
  if (!normalized.key) throw httpError(400, "Could not read the Roblox server share code from that link.");

  const matched = await findServerByKey(env, normalized.key);
  const webhookVideoUrl = env.SERVER_SUBMISSION_WEBHOOK_URL
    ? await postSubmissionWebhook(env.SERVER_SUBMISSION_WEBHOOK_URL, {
      location,
      server_link: serverLink,
      pathing_video: pathingVideo,
      submitted_by_name: user.global_name || user.username || user.id,
      submitted_by: user.id,
      video_file: hasFile ? videoFile : null
    })
    : "";

  const uploadedVideoUrl = webhookVideoUrl || "";
  const submissionRows = await supabaseInsert(env, SUBMISSIONS_TABLE, [{
    submitted_by_discord_id: user.id,
    submitted_by_name: user.global_name || user.username || user.id,
    location,
    server_link: serverLink,
    share_code: normalized.shareCode || normalized.key,
    normalized_link: normalized.key,
    pathing_video_url: pathingVideo,
    uploaded_video_url: uploadedVideoUrl,
    uploaded_video_name: hasFile ? String(videoFile.name || "") : "",
    uploaded_video_size: hasFile ? Number(videoFile.size || 0) : 0,
    matched_server_id: matched?.id || null,
    matched_server_number: matched?.server_number || null,
    raw_payload: {
      submitted_via: "servers.html",
      had_file: Boolean(hasFile)
    }
  }]);

  return json({
    ok: true,
    message: matched
      ? `Submission saved for review and matched to Server ${matched.server_number}.`
      : "Submission saved for review. It will be assigned the next server ID if approved.",
    submission_id: submissionRows?.[0]?.id || null,
    matched_server_number: matched?.server_number || null
  }, 202);
}

function handleSubmissionStatus(env) {
  return cacheJson(getSubmissionStatus(env), env);
}

function getSubmissionStatus(env) {
  const accepting =
    String(env.SERVER_SUBMISSIONS_OPEN || "").toLowerCase() === "true" ||
    String(env.ALLOW_SERVER_SUBMISSIONS || "").toLowerCase() === "true";

  return {
    ok: true,
    accepting,
    disabled: !accepting,
    message: String(
      env.SERVER_SUBMISSIONS_MESSAGE ||
      (accepting ? "Server submissions are open." : "Server submissions are currently closed.")
    )
  };
}

async function handleAdminSubmissions(request, env) {
  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "pending").trim().toLowerCase();
  const rows = await supabaseSelect(env, SUBMISSIONS_TABLE, {
    select: "*",
    status: `eq.${status}`,
    order: "submitted_at.desc",
    limit: String(clamp(Number(url.searchParams.get("limit") || 100), 1, 500))
  });

  return json({ ok: true, rows });
}

async function handleApproveSubmission(request, env, submissionId) {
  const body = await readJsonOptional(request);
  const reviewer = String(body.reviewed_by || "admin").trim() || "admin";
  const note = String(body.review_note || "").trim();
  const submission = await fetchSingle(env, SUBMISSIONS_TABLE, { id: `eq.${submissionId}` });

  if (!submission) throw httpError(404, "Submission not found.");
  if (submission.status === "approved") {
    return json({ ok: true, message: "Submission already approved.", submission });
  }

  let server = submission.matched_server_id
    ? await fetchSingle(env, SERVERS_TABLE, { id: `eq.${submission.matched_server_id}` })
    : null;

  if (!server) {
    server = await findServerByKey(env, submission.normalized_link || submission.share_code);
  }

  const now = new Date().toISOString();
  const videoUrl = String(submission.uploaded_video_url || submission.pathing_video_url || "").trim();
  let serverRow;

  if (server) {
    const patchRows = await supabasePatch(env, SERVERS_TABLE, { id: `eq.${server.id}` }, {
      location: submission.location || server.location || "",
      pathing_video_url: videoUrl || server.pathing_video_url || "",
      last_submission_id: submission.id,
      approved_by: reviewer,
      approved_at: now,
      updated_at: now,
      is_active: true
    });
    serverRow = patchRows?.[0] || { ...server, server_number: server.server_number };
  } else {
    const nextNumber = await nextServerNumber(env);
    const inserted = await supabaseInsert(env, SERVERS_TABLE, [{
      server_number: nextNumber,
      share_code: submission.share_code,
      normalized_link: submission.normalized_link,
      server_link: submission.server_link,
      location: submission.location || "",
      pathing_video_url: videoUrl,
      last_submission_id: submission.id,
      approved_by: reviewer,
      approved_at: now,
      updated_at: now
    }]);
    serverRow = inserted?.[0];
  }

  await supabasePatch(env, SUBMISSIONS_TABLE, { id: `eq.${submission.id}` }, {
    status: "approved",
    matched_server_id: serverRow?.id || server?.id || null,
    matched_server_number: serverRow?.server_number || server?.server_number || null,
    reviewed_by: reviewer,
    reviewed_at: now,
    review_note: note
  });

  await insertEvent(env, {
    event_type: "server_submission_approved",
    severity: "info",
    server_id: serverRow?.id || server?.id || null,
    submission_id: submission.id,
    details: {
      server_number: serverRow?.server_number || server?.server_number || null,
      reviewer
    }
  });

  return json({
    ok: true,
    message: `Submission approved for Server ${serverRow?.server_number || server?.server_number}.`,
    server: serverRow
  });
}

async function handleDeclineSubmission(request, env, submissionId) {
  const body = await readJsonOptional(request);
  const now = new Date().toISOString();
  const rows = await supabasePatch(env, SUBMISSIONS_TABLE, { id: `eq.${submissionId}` }, {
    status: "declined",
    reviewed_by: String(body.reviewed_by || "admin"),
    reviewed_at: now,
    review_note: String(body.review_note || "")
  });

  if (!rows.length) throw httpError(404, "Submission not found.");

  await insertEvent(env, {
    event_type: "server_submission_declined",
    severity: "info",
    submission_id: submissionId,
    details: { reviewed_by: String(body.reviewed_by || "admin") }
  });

  return json({ ok: true, rows });
}

async function handleReportPlayers(request, env, serverNumberOrId) {
  const body = await request.json();
  const server = await findServerByNumberOrId(env, serverNumberOrId);
  if (!server) throw httpError(404, "Server not found.");

  const players = jsonArray(body);
  const playerCount = firstNumber(
    body.player_count,
    body.players_current,
    body.current_player_count,
    body.member_count,
    body.members_count,
    Array.isArray(body.players) ? null : body.players
  ) ?? players.length;
  const maxPlayers = firstNumber(body.max_players, body.players_max, body.capacity, body.player_capacity);
  const memberSets = await fetchClanMemberSets(env);
  const annotated = await enrichPlayers(annotatePlayers(players, memberSets), env);
  const clanCounts = countPlayerClans(annotated);
  const compromiseStatus = classifyServerStatus(playerCount, annotated, clanCounts);
  const now = new Date().toISOString();

  const patch = {
    player_count: playerCount,
    current_players: annotated,
    clan_counts: clanCounts,
    players_updated_at: now,
    compromise_status: compromiseStatus,
    updated_at: now
  };

  if (maxPlayers !== null) {
    patch.max_players = maxPlayers;
  }

  const rows = await supabasePatch(env, SERVERS_TABLE, { id: `eq.${server.id}` }, patch);

  if (compromiseStatus === "possible_compromise") {
    await insertEvent(env, {
      event_type: "possible_compromised_server",
      severity: "warning",
      server_id: server.id,
      details: {
        server_number: server.server_number,
        player_count: playerCount,
        clan_counts: clanCounts,
        players: annotated
      }
    });
  }

  return json({ ok: true, server: rows?.[0] || null });
}

async function handlePublishServerStatus(request, env, serverNumberOrId = "") {
  const body = await readJsonOptional(request);
  const url = new URL(request.url);
  const target = firstString(
    serverNumberOrId,
    body.server_number,
    body.server,
    url.searchParams.get("server"),
    env.SERVER_STATUS_SERVER_NUMBER,
    DEFAULT_STATUS_SERVER_NUMBER
  );
  const result = await publishServerStatusToDiscord(env, target, "manual");

  return json({ ok: true, ...result });
}

async function publishScheduledServerStatus(env) {
  if (String(env.SERVER_STATUS_DISCORD_ENABLED || "").toLowerCase() !== "true") {
    return { ok: true, skipped: true, message: "SERVER_STATUS_DISCORD_ENABLED is not true." };
  }

  const delaySeconds = clamp(firstNumber(env.SERVER_STATUS_DISCORD_DELAY_SECONDS, 30) ?? 30, 0, 120);
  if (delaySeconds > 0) {
    await sleep(delaySeconds * 1000);
  }

  const target = firstString(env.SERVER_STATUS_SERVER_NUMBER, DEFAULT_STATUS_SERVER_NUMBER);
  return await publishServerStatusToDiscord(env, target, "schedule");
}

async function publishServerStatusToDiscord(env, serverNumberOrId, source) {
  requireSupabase(env);
  const webhookUrl = firstString(env.SERVER_STATUS_WEBHOOK_URL, env.SERVER_SUBMISSION_WEBHOOK_URL);
  if (!webhookUrl) {
    throw httpError(500, "Set SERVER_STATUS_WEBHOOK_URL or SERVER_SUBMISSION_WEBHOOK_URL.");
  }

  const row = await findServerByNumberOrId(env, serverNumberOrId);
  if (!row) throw httpError(404, "Server not found.");

  const memberSets = await fetchClanMemberSets(env);
  const server = await serializeServer(row, memberSets, env);
  const payload = buildDiscordServerStatusPayload(server, source);
  const stored = await fetchDiscordStatusRecord(env, row.id);
  const result = await upsertDiscordWebhookMessage(webhookUrl, stored?.message_id, payload);

  await saveDiscordStatusRecord(env, server, stored?.row || null, result, source, webhookUrl);

  return {
    action: result.action,
    message_id: result.message_id,
    message_url: discordMessageUrl(result.message),
    server: {
      id: server.id,
      server_number: server.server_number,
      players: server.players,
      max_players: server.max_players,
      updated_at: server.updated_at
    }
  };
}

function buildDiscordServerStatusPayload(server, source) {
  const playerCount = serverPlayerCount(server);
  const maxPlayers = Number(server.max_players || DEFAULT_MAX_PLAYERS);
  const location = firstString(server.location, "Unknown");
  const counts = server.clan_counts || {};
  const updated = firstString(server.updated_at, server.players_updated_at);
  const playersValue = Number.isFinite(playerCount)
    ? `${playerCount}/${maxPlayers || DEFAULT_MAX_PLAYERS}`
    : `Unknown/${maxPlayers || DEFAULT_MAX_PLAYERS}`;
  const playerLines = truncateDiscordField(discordPlayerLines(server));

  return {
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `Server ${server.server_number} Status`,
      description: server.link ? `[Open Server](${server.link})` : "",
      color: DISCORD_STATUS_COLOR,
      fields: [
        { name: "Status", value: discordServerStatusLabel(server), inline: true },
        { name: "Players", value: playersValue, inline: true },
        { name: "Location", value: location, inline: true },
        {
          name: "Clan Counts",
          value: `C0LD: ${Number(counts.C0LD || 0)} | WMSY: ${Number(counts.WMSY || 0)} | Other: ${Number(counts.other || 0)}`,
          inline: false
        },
        { name: "Updated", value: discordTimestamp(updated), inline: true },
        { name: "Published", value: discordTimestamp(new Date().toISOString()), inline: true },
        { name: "Players In Server", value: playerLines, inline: false }
      ],
      footer: {
        text: source === "schedule" ? "Auto-updated from Supabase" : "Manual test update"
      },
      timestamp: new Date().toISOString()
    }]
  };
}

function discordServerStatusLabel(server) {
  const playerCount = serverPlayerCount(server);
  const maxPlayers = Number(server.max_players || DEFAULT_MAX_PLAYERS);
  if (Number.isFinite(playerCount) && playerCount <= 0) return "Offline";
  if (Number.isFinite(playerCount) && maxPlayers > 0 && playerCount >= maxPlayers) return "Full";

  switch (server.compromise_status) {
    case "trusted":
      return "Trusted";
    case "mixed":
      return "Mixed";
    case "possible_compromise":
      return "Review";
    case "empty":
      return "Offline";
    default:
      return "Offline";
  }
}

function discordPlayerLines(server) {
  const players = jsonArray(server.players_list)
    .slice()
    .sort((a, b) => Number(a.slot || 0) - Number(b.slot || 0));
  const playerCount = serverPlayerCount(server);
  const total = Math.max(Number.isFinite(playerCount) ? playerCount : 0, players.length);
  if (!total) return "No players reported.";

  const lines = [];
  for (let i = 0; i < total; i += 1) {
    const player = players[i];
    lines.push(player ? discordPlayerLine(player, i + 1) : `${i + 1}. Unknown Player ${i + 1} - Unknown`);
  }
  return lines.join("\n");
}

function discordPlayerLine(player, position) {
  const userId = firstString(player.user_id);
  const username = firstString(player.username, player.display_name, userId ? `user_${userId}` : `Unknown Player ${position}`);
  const profileUrl = firstString(player.profile_url, userId ? `https://www.roblox.com/users/${userId}/profile` : "");
  const clan = firstString(player.clan, "Unknown");
  const name = escapeDiscordLinkText(username);
  const detail = userId ? `ID ${userId} - ${clan}` : clan;

  if (profileUrl) {
    return `${position}. [${name}](${profileUrl}) - ${detail}`;
  }
  return `${position}. ${name} - ${detail}`;
}

function serverPlayerCount(server) {
  if (server.players !== undefined && server.players !== null && server.players !== "") {
    const count = Number(server.players);
    if (Number.isFinite(count)) return count;
  }
  const players = jsonArray(server.players_list);
  return players.length ? players.length : null;
}

async function fetchDiscordStatusRecord(env, serverId) {
  const rows = await supabaseSelect(env, EVENTS_TABLE, {
    select: "id,details",
    event_type: `eq.${DISCORD_STATUS_EVENT_TYPE}`,
    server_id: `eq.${serverId}`,
    order: "created_at.desc",
    limit: "1"
  });
  const row = rows?.[0] || null;
  return row ? { row, message_id: firstString(row.details?.message_id) } : null;
}

async function saveDiscordStatusRecord(env, server, existingRow, result, source, webhookUrl) {
  const now = new Date().toISOString();
  const message = result.message || {};
  const details = {
    ...(existingRow?.details && typeof existingRow.details === "object" ? existingRow.details : {}),
    message_id: firstString(result.message_id, message.id),
    channel_id: firstString(message.channel_id, existingRow?.details?.channel_id),
    guild_id: firstString(message.guild_id, existingRow?.details?.guild_id),
    webhook_id: firstString(message.webhook_id, parseDiscordWebhookId(webhookUrl), existingRow?.details?.webhook_id),
    message_url: firstString(discordMessageUrl(message), existingRow?.details?.message_url),
    server_number: server.server_number,
    last_action: result.action,
    last_source: source,
    last_published_at: now
  };

  if (!details.message_id) {
    throw new Error("Discord webhook response did not include a message id.");
  }

  if (existingRow?.id) {
    await supabasePatch(env, EVENTS_TABLE, { id: `eq.${existingRow.id}` }, { details });
  } else {
    await supabaseInsert(env, EVENTS_TABLE, [{
      event_type: DISCORD_STATUS_EVENT_TYPE,
      severity: "info",
      server_id: server.db_id,
      details
    }]);
  }
}

async function upsertDiscordWebhookMessage(webhookUrl, messageId, payload) {
  if (messageId) {
    const response = await fetch(discordWebhookMessageUrl(webhookUrl, messageId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const message = await response.json().catch(() => ({ id: messageId }));
      return { action: "updated", message_id: firstString(message?.id, messageId), message };
    }

    if (![401, 403, 404].includes(response.status)) {
      throw new Error(`Discord webhook update failed (${response.status}): ${await response.text()}`);
    }
  }

  const response = await fetch(discordWebhookUrlWithWait(webhookUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord webhook create failed (${response.status}): ${await response.text()}`);
  }

  const message = await response.json();
  return { action: "created", message_id: firstString(message?.id), message };
}

function discordWebhookUrlWithWait(webhookUrl) {
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");
  return url.toString();
}

function discordWebhookMessageUrl(webhookUrl, messageId) {
  const url = new URL(webhookUrl);
  url.search = "";
  url.hash = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/messages/${encodeURIComponent(messageId)}`;
  return url.toString();
}

function discordMessageUrl(message) {
  if (!message?.id || !message?.channel_id || !message?.guild_id) return "";
  return `https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.id}`;
}

function parseDiscordWebhookId(webhookUrl) {
  try {
    const parts = new URL(webhookUrl).pathname.split("/").filter(Boolean);
    const index = parts.indexOf("webhooks");
    return index >= 0 ? parts[index + 1] || "" : "";
  } catch {
    return "";
  }
}

function discordTimestamp(value, style = "R") {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return "Unknown";
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

function truncateDiscordField(value, maxLength = 1024) {
  const text = firstString(value, "None");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 16).trimEnd()}\n... truncated`;
}

function escapeDiscordLinkText(value) {
  return firstString(value).replace(/[\\[\]]/g, "\\$&").slice(0, 80);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function serializeServer(row, memberSets, env) {
  const players = await enrichPlayers(annotatePlayers(jsonArray(row.current_players), memberSets), env);
  const clanCounts = row.clan_counts && Object.keys(row.clan_counts || {}).length
    ? row.clan_counts
    : countPlayerClans(players);

  return {
    id: `server-${row.server_number}`,
    db_id: row.id,
    rank: Number(row.server_number),
    server_number: Number(row.server_number),
    share_code: row.share_code,
    location: row.location || "",
    link: row.server_link,
    players: row.player_count,
    max_players: row.max_players || DEFAULT_MAX_PLAYERS,
    players_updated_at: row.players_updated_at || null,
    players_list: players,
    clan_counts: clanCounts,
    compromise_status: row.compromise_status || classifyServerStatus(row.player_count, players, clanCounts),
    video_url: row.pathing_video_url || "",
    updated_at: row.players_updated_at || row.updated_at || null
  };
}

async function fetchClanMemberSets(env) {
  const c0ld = new Map();
  const wmsy = new Map();

  try {
    const rows = await supabaseSelect(env, C0LD_MEMBERS_TABLE, {
      select: "user_id,username",
      limit: "500"
    });
    for (const row of rows) {
      if (row.user_id) c0ld.set(String(row.user_id), row.username || "");
    }
  } catch {}

  try {
    const runs = await supabaseSelect(env, WMSY_RUNS_TABLE, {
      select: "id",
      clan_name: "eq.WMSY",
      order: "generated_at.desc",
      limit: "1"
    });
    const runId = runs?.[0]?.id;
    if (runId) {
      const rows = await supabaseSelect(env, WMSY_MEMBERS_TABLE, {
        select: "user_id,username",
        run_id: `eq.${runId}`,
        limit: "500"
      });
      for (const row of rows) {
        if (row.user_id) wmsy.set(String(row.user_id), row.username || "");
      }
    }
  } catch {}

  return { c0ld, wmsy };
}

function annotatePlayers(players, memberSets) {
  return jsonArray(players).map((player, index) => {
    const profileUrl = normalizeProfileUrl(firstString(
      player.profile_url,
      player.profileUrl,
      player.profile,
      player.profile_link,
      player.profileLink,
      player.href,
      player.url
    ));
    const userId = String(firstString(
      player.user_id,
      player.userId,
      player.roblox_user_id,
      player.robloxUserId,
      player.id,
      extractRobloxUserId(profileUrl),
      extractRobloxUserId(player.href),
      extractRobloxUserId(player.url)
    )).trim();
    let clan = "";

    if (userId && memberSets.c0ld.has(userId)) {
      clan = "C0LD";
    } else if (userId && memberSets.wmsy.has(userId)) {
      clan = "WMSY";
    }

    const submittedClan = firstString(player.clan).toUpperCase();
    const normalizedClan =
      submittedClan === "C0LD" || submittedClan === "WMSY"
        ? submittedClan
        : firstString(player.clan);

    return {
      user_id: userId || null,
      username: firstString(player.username, player.name, player.userName, player.displayName, userId ? `user_${userId}` : ""),
      display_name: firstString(player.display_name, player.displayName, player.name_display),
      avatar_url: normalizeUrl(firstString(
        player.avatar_url,
        player.avatarUrl,
        player.thumbnail_url,
        player.thumbnailUrl,
        player.image_url,
        player.imageUrl,
        player.src,
        player.avatar,
        player.thumbnail
      )),
      profile_url: profileUrl || (userId ? `https://www.roblox.com/users/${userId}/profile` : ""),
      clan: clan || normalizedClan,
      slot: Number.isFinite(Number(player.slot)) ? Number(player.slot) : index + 1,
      visible: player.visible === undefined ? true : Boolean(player.visible)
    };
  });
}

async function enrichPlayers(players, env) {
  if (String(env.ROBLOX_PLAYER_LOOKUPS || "true").toLowerCase() === "false") {
    return players;
  }

  const ids = [...new Set(players.map(player => Number(player.user_id)).filter(Boolean))];
  if (!ids.length) return players;

  const names = await resolveRobloxUsers(ids).catch(() => new Map());
  const avatars = await resolveRobloxHeadshots(
    ids.filter(id => {
      const row = players.find(player => Number(player.user_id) === id);
      return row && !row.avatar_url;
    })
  ).catch(() => new Map());

  return players.map(player => {
    const id = Number(player.user_id);
    const user = names.get(id);
    const username = isFallbackUsername(player.username, id)
      ? (user?.username || player.username)
      : player.username;

    return {
      ...player,
      username,
      display_name: player.display_name || user?.display_name || "",
      avatar_url: player.avatar_url || avatars.get(id) || ""
    };
  });
}

async function resolveRobloxUsers(userIds) {
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];

  for (let i = 0; i < ids.length; i += ROBLOX_BATCH_SIZE) {
    const batch = ids.slice(i, i + ROBLOX_BATCH_SIZE);
    const res = await fetch("https://users.roblox.com/v1/users", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "c0ld-Servers-Worker"
      },
      body: JSON.stringify({
        userIds: batch,
        excludeBannedUsers: false
      })
    });

    if (!res.ok) continue;
    const json = await res.json();
    for (const user of json.data || []) {
      const id = Number(user.id);
      if (!Number.isFinite(id)) continue;
      result.set(id, {
        username: String(user.name || ""),
        display_name: String(user.displayName || "")
      });
    }
  }

  return result;
}

async function resolveRobloxHeadshots(userIds) {
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];

  for (let i = 0; i < ids.length; i += ROBLOX_BATCH_SIZE) {
    const batch = ids.slice(i, i + ROBLOX_BATCH_SIZE);
    if (!batch.length) continue;

    const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    url.searchParams.set("userIds", batch.join(","));
    url.searchParams.set("size", "150x150");
    url.searchParams.set("format", "Png");
    url.searchParams.set("isCircular", "false");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "c0ld-Servers-Worker"
      }
    });

    if (!res.ok) continue;
    const json = await res.json();
    for (const item of json.data || []) {
      const id = Number(item.targetId);
      const imageUrl = String(item.imageUrl || "").trim();
      if (Number.isFinite(id) && imageUrl && item.state === "Completed") {
        result.set(id, imageUrl);
      }
    }
  }

  return result;
}

function isFallbackUsername(username, userId) {
  const text = String(username || "").trim();
  const id = String(userId || "").trim();
  if (!text) return true;
  if (id && (text === id || text === `user_${id}`)) return true;
  return /^unknown(?:\s+player)?$/i.test(text);
}

function countPlayerClans(players) {
  const counts = { C0LD: 0, WMSY: 0, other: 0 };
  for (const player of players) {
    if (player.clan === "C0LD") counts.C0LD += 1;
    else if (player.clan === "WMSY") counts.WMSY += 1;
    else counts.other += 1;
  }
  return counts;
}

function classifyServerStatus(playerCount, players, clanCounts) {
  const count = Number(playerCount);
  if (Number.isFinite(count) && count === 0) return "empty";
  if (!players.length) return "unknown";
  if ((clanCounts.C0LD + clanCounts.WMSY) === 0 && count > 0) return "possible_compromise";
  if (clanCounts.other > 0) return "mixed";
  return "trusted";
}

async function findServerByKey(env, key) {
  if (!key) return null;
  return await fetchSingle(env, SERVERS_TABLE, {
    select: "*",
    or: `(share_code.eq.${escapePostgrestValue(key)},normalized_link.eq.${escapePostgrestValue(key)})`
  });
}

async function findServerByNumberOrId(env, value) {
  const raw = String(value || "").replace(/^server-/i, "").trim();
  const field = /^\d+$/.test(raw) ? "server_number" : "id";
  return await fetchSingle(env, SERVERS_TABLE, {
    select: "*",
    [field]: `eq.${raw}`
  });
}

async function nextServerNumber(env) {
  const rows = await supabaseSelect(env, SERVERS_TABLE, {
    select: "server_number",
    order: "server_number.desc",
    limit: "1"
  });
  return Number(rows?.[0]?.server_number || 0) + 1;
}

function normalizeServerLink(value) {
  const raw = String(value || "").trim();
  let shareCode = "";

  try {
    const url = new URL(raw);
    shareCode = String(url.searchParams.get("code") || "").trim().toLowerCase();
  } catch {}

  if (!shareCode && /^[a-f0-9]{16,}$/i.test(raw)) {
    shareCode = raw.toLowerCase();
  }

  const key = shareCode || raw
    .replace(/#.*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  return { key, shareCode };
}

function normalizeLocation(value) {
  const raw = String(value || "").trim();
  const map = {
    NA: "NA",
    NORTH_AMERICA: "NA",
    "NORTH AMERICA": "NA",
    EU: "EU",
    EUROPE: "EU",
    AS: "AS",
    ASIA: "AS",
    SA: "SA",
    "SOUTH AMERICA": "SA",
    OC: "OC",
    OCEANIA: "OC",
    AF: "AF",
    AFRICA: "AF"
  };
  return map[raw.toUpperCase()] || raw.toUpperCase();
}

function firstString(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function firstNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizeUrl(value) {
  const raw = firstString(value);
  if (!raw) return "";

  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
}

function normalizeProfileUrl(value) {
  const raw = firstString(value);
  const userId = extractRobloxUserId(raw);
  if (userId) return `https://www.roblox.com/users/${userId}/profile`;
  return normalizeUrl(raw);
}

function extractRobloxUserId(value) {
  const text = firstString(value);
  if (!text) return "";

  const match = text.match(/(?:roblox\.com\/users\/|\/users\/)(\d+)(?:\/profile)?/i);
  if (match) return match[1];

  if (/^\d{4,}$/.test(text)) return text;
  return "";
}

async function postSubmissionWebhook(webhookUrl, submission) {
  const url = webhookUrl.includes("?") ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;
  const embed = {
    title: "Server submission",
    fields: [
      { name: "Location", value: submission.location || "Unknown", inline: true },
      { name: "Server Link", value: submission.server_link || "Missing", inline: false },
      { name: "Pathing Video URL", value: submission.pathing_video || "None", inline: false },
      { name: "Submitted By", value: `${submission.submitted_by_name} (${submission.submitted_by})`, inline: false }
    ],
    timestamp: new Date().toISOString()
  };

  let response;
  if (submission.video_file) {
    const data = new FormData();
    data.append("payload_json", JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }));
    data.append("files[0]", submission.video_file, submission.video_file.name || "pathing-video.mp4");
    response = await fetch(url, { method: "POST", body: data });
  } else {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } })
    });
  }

  if (!response.ok) return "";

  const payload = await response.json().catch(() => null);
  return payload?.attachments?.[0]?.url || "";
}

async function authorizeSubmission(request, env) {
  if (String(env.ALLOW_PUBLIC_SUBMISSIONS || "").toLowerCase() === "true") {
    return { id: "public", username: "public", global_name: "Public" };
  }

  if (!env.SESSION_SECRET) {
    throw httpError(500, "Set SESSION_SECRET on this Worker to accept Discord-verified submissions.");
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw httpError(401, "Missing Discord session.");

  const session = await verifyToken(match[1], env.SESSION_SECRET);
  if (!session || session.type !== "session" || session.exp < nowSeconds()) {
    throw httpError(401, "Discord session expired.");
  }

  return {
    id: session.sub,
    username: session.username,
    global_name: session.global_name
  };
}

function requireAdmin(request, env) {
  const expected = String(env.SERVERS_ADMIN_TOKEN || "").trim();
  if (!expected) throw httpError(500, "Missing SERVERS_ADMIN_TOKEN.");

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== expected) throw httpError(401, "Invalid admin token.");
}

function requireSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw httpError(500, "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }
}

async function supabaseSelect(env, table, params = {}) {
  const url = supabaseUrl(env, table, params);
  const res = await fetch(url, { headers: supabaseHeaders(env) });
  if (!res.ok) throw new Error(`Supabase select failed for ${table} (${res.status}): ${await res.text()}`);
  return res.json();
}

async function fetchSingle(env, table, params = {}) {
  const rows = await supabaseSelect(env, table, { ...params, limit: "1" });
  return rows?.[0] || null;
}

async function supabaseInsert(env, table, rows) {
  const res = await fetch(`${trimSlash(env.SUPABASE_URL)}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`Supabase insert failed for ${table} (${res.status}): ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(env, table, rows, onConflict) {
  const url = new URL(`${trimSlash(env.SUPABASE_URL)}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...supabaseHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`Supabase upsert failed for ${table} (${res.status}): ${await res.text()}`);
  return res.json();
}

async function supabasePatch(env, table, filters, body) {
  const res = await fetch(supabaseUrl(env, table, filters), {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Supabase patch failed for ${table} (${res.status}): ${await res.text()}`);
  return res.json();
}

async function insertEvent(env, row) {
  try {
    await supabaseInsert(env, EVENTS_TABLE, [row]);
  } catch {}
}

function supabaseUrl(env, table, params = {}) {
  const url = new URL(`${trimSlash(env.SUPABASE_URL)}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function supabaseHeaders(env) {
  return {
    "apikey": env.SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Accept": "application/json"
  };
}

async function readJsonOptional(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function jsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["players", "current_players", "players_list", "members", "player_list"]) {
    if (Array.isArray(value[key])) return value[key];
  }

  return [];
}

function cacheJson(obj, env) {
  return json(obj, 200, {
    "Cache-Control": `public, max-age=${Number(env.PUBLIC_CACHE_SECONDS || 20)}`
  });
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.has(origin) ? origin : [...allowed][0] || "*";

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function allowedOrigins(env) {
  const origins = new Set(["https://oapl.github.io"]);
  for (const item of String(env.SITE_ORIGINS || "").split(",")) {
    const origin = item.trim().replace(/\/$/, "");
    if (origin) origins.add(origin);
  }
  return origins;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function escapePostgrestValue(value) {
  return String(value || "").replace(/[",()]/g, "");
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function verifyToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;

  const [payloadPart, signaturePart] = parts;
  const expected = await hmacSha256(payloadPart, secret);
  if (!timingSafeEqual(signaturePart, expected)) return null;

  try {
    return JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return null;
  }
}

async function hmacSha256(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;

  let out = 0;
  for (let i = 0; i < left.length; i++) {
    out |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return out === 0;
}

function base64UrlDecode(value) {
  const base64 = String(value).replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
