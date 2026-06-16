const SERVERS_TABLE = "c0ld_servers";
const SUBMISSIONS_TABLE = "c0ld_server_submissions";
const EVENTS_TABLE = "c0ld_server_events";
const C0LD_MEMBERS_TABLE = "c0ld_clan_current";
const WMSY_RUNS_TABLE = "wmsy_hourly_runs";
const WMSY_MEMBERS_TABLE = "wmsy_hourly_members";
const DEFAULT_MAX_PLAYERS = 10;

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
  const servers = rows.map(row => serializeServer(row, memberSets));

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    discord: {
      empty_emoji: ":mobile_phone_off:",
      default_max_players: DEFAULT_MAX_PLAYERS
    },
    rows: servers
  }, env);
}

async function handleSubmit(request, env) {
  requireSupabase(env);
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

  const players = Array.isArray(body.players) ? body.players : [];
  const playerCount = Number.isFinite(Number(body.player_count)) ? Number(body.player_count) : players.length;
  const memberSets = await fetchClanMemberSets(env);
  const annotated = annotatePlayers(players, memberSets);
  const clanCounts = countPlayerClans(annotated);
  const compromiseStatus = classifyServerStatus(playerCount, annotated, clanCounts);
  const now = new Date().toISOString();

  const rows = await supabasePatch(env, SERVERS_TABLE, { id: `eq.${server.id}` }, {
    player_count: playerCount,
    current_players: annotated,
    clan_counts: clanCounts,
    players_updated_at: now,
    compromise_status: compromiseStatus,
    updated_at: now
  });

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

function serializeServer(row, memberSets) {
  const players = annotatePlayers(jsonArray(row.current_players), memberSets);
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
    updated_at: row.updated_at || null
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
  return jsonArray(players).map(player => {
    const userId = String(player.user_id || player.userId || player.id || "").trim();
    let clan = "";

    if (userId && memberSets.c0ld.has(userId)) {
      clan = "C0LD";
    } else if (userId && memberSets.wmsy.has(userId)) {
      clan = "WMSY";
    }

    return {
      user_id: userId || null,
      username: String(player.username || player.name || player.displayName || userId || "Unknown"),
      display_name: String(player.display_name || player.displayName || ""),
      avatar_url: String(player.avatar_url || player.avatarUrl || ""),
      clan
    };
  });
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
  return Array.isArray(value) ? value : [];
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
