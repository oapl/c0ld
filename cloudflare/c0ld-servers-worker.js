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

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/health") {
        response = json({ ok: true, service: "c0ld-servers" });
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
      publishScheduledServerStatus(env).catch(err => {
        console.error("Discord server status publish failed", err);
      })
    );
  }
};

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
