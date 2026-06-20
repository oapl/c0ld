const SNAPSHOT_TABLE = "ps99_league_snapshots";
const CURRENT_TABLE = "ps99_league_current";
const DEFAULT_LEAGUE_NAME = "YAMO";
const DEFAULT_RETENTION_HOURS = 336;
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;

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
          service: "ps99-league-api",
          league_name: leagueName(env),
          league_names: leagueNames(env)
        });
      } else if (request.method === "GET" && url.pathname === "/api/leagues/current") {
        response = await handleCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/history") {
        response = await handleHistory(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/leagues/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("league"));
      } else if (request.method === "POST" && url.pathname === "/api/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("league"));
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({ ok: false, message: err?.message || String(err) }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (String(env.INGEST_LEAGUES || "true").toLowerCase() === "false") return;
      for (const league of leagueNames(env)) {
        await handleIngest(env, "schedule", league);
      }
    })());
  }
};

async function handleIngest(env, source, requestedLeague) {
  requireSupabase(env);

  const fetchedAt = new Date().toISOString();
  const requested = String(requestedLeague || leagueName(env)).trim() || leagueName(env);
  const api = await fetchLeagueApi(requested);
  const league = api.data || api;
  const summary = summarizeLeague(league, requested);
  const rows = normalizeLeagueRows(league);
  const snapshotId = `league:${summary.league_name}:${fetchedAt}`;

  const dbRows = rows.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source,
    league_name: summary.league_name,
    league_id: summary.league_id,
    league_level: summary.league_level,
    league_points: summary.league_points,
    league_icon: summary.league_icon,
    member_capacity: summary.member_capacity,
    rank: row.rank,
    user_id: row.user_id,
    display_name: row.display_name,
    points: row.points,
    last_contribution_at: row.last_contribution_at,
    permission_level: row.permission_level,
    role: row.role,
    join_time: row.join_time,
    raw_member: row.raw_member,
    raw_contribution: row.raw_contribution,
    raw_league: summary.raw_league
  }));

  if (dbRows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
    await replaceCurrentRows(env, CURRENT_TABLE, { league_name: `eq.${summary.league_name}` }, dbRows.map(row => ({
      ...row,
      updated_at: fetchedAt
    })));
  }

  await pruneOldRows(env, SNAPSHOT_TABLE, fetchedAt);

  return json({
    ok: true,
    league_name: summary.league_name,
    league_id: summary.league_id,
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    rows_inserted: dbRows.length
  }, 202);
}

async function handleCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
    league_name: `eq.${requested}`,
    order: "rank.asc",
    limit: "500"
  });

  const latest = latestMeta(rows);
  if (!latest) {
    return cacheJson({ generated_at: new Date().toISOString(), snapshot_at: null, league_name: requested, rows: [] }, env);
  }

  const rowsWithGains = await addGainFields(env, rows, latest);

  return cacheJson({
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    league_name: latest.league_name,
    league_id: latest.league_id,
    league_level: latest.league_level,
    league_points: toNumber(latest.league_points) || 0,
    league_icon: latest.league_icon || null,
    member_capacity: latest.member_capacity ?? null,
    source: "ps99-league-api-worker",
    rows: rowsWithGains.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      user_id: toNumber(row.user_id),
      display_name: row.display_name || `user_${row.user_id}`,
      avatar_url: null,
      total_points: toNumber(row.points) || 0,
      points: toNumber(row.points) || 0,
      last_contribution_at: row.last_contribution_at || null,
      permission_level: row.permission_level ?? null,
      role: row.role || "Member",
      join_time: row.join_time || null,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_6h: row.gain_6h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h
    }))
  }, env);
}

async function handleHistory(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const userId = url.searchParams.get("user_id");
  const hours = clamp(Number(url.searchParams.get("hours") || 24), 1, Number(env.RETENTION_HOURS || DEFAULT_RETENTION_HOURS));
  const limit = clamp(Number(url.searchParams.get("limit") || 5000), 1, 50000);
  const afterIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const params = {
    select: "snapshot_id,fetched_at,league_name,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
    league_name: `eq.${requested}`,
    fetched_at: `gte.${afterIso}`,
    order: "fetched_at.desc,rank.asc",
    limit: String(limit)
  };

  if (userId) params.user_id = `eq.${userId}`;

  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, params);
  return cacheJson({ generated_at: new Date().toISOString(), league_name: requested, hours, rows }, env);
}

async function fetchLeagueApi(league) {
  const urls = [
    `https://ps99.biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`,
    `https://biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`
  ];
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "c0ld-League-API-Worker" },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      const json = JSON.parse(text);
      if (json.status && json.status !== "ok") throw new Error(`API status ${json.status}`);
      return json;
    } catch (err) {
      lastError = err;
    }
  }

  throw httpError(502, `Big Games league API failed for ${league}: ${lastError?.message || "unknown error"}`);
}

function summarizeLeague(league, fallbackName) {
  const rawLeague = {
    Name: firstDefined(league.Name, league.name, fallbackName),
    ID: firstDefined(league.ID, league.Id, league.id),
    Level: firstDefined(league.Level, league.level),
    Points: firstDefined(league.Points, league.points),
    Icon: firstDefined(league.Icon, league.icon),
    MemberCapacity: firstDefined(league.MemberCapacity, league.memberCapacity),
    Created: firstDefined(league.Created, league.created),
    Owner: firstDefined(league.Owner, league.owner)
  };

  return {
    league_name: String(rawLeague.Name || fallbackName).trim() || fallbackName,
    league_id: stringOrNull(rawLeague.ID),
    league_level: toNumber(rawLeague.Level),
    league_points: toNumber(rawLeague.Points) || 0,
    league_icon: stringOrNull(rawLeague.Icon),
    member_capacity: toNumber(rawLeague.MemberCapacity),
    raw_league: rawLeague
  };
}

function normalizeLeagueRows(league) {
  const roster = new Map();
  const owner = firstDefined(league.Owner, league.owner);

  if (owner) {
    const ownerId = getUserId(owner);
    if (ownerId) {
      roster.set(String(ownerId), {
        user_id: ownerId,
        display_name: getDisplayName(owner, ownerId),
        role: "Owner",
        permission_level: 100,
        join_time: null,
        raw_member: owner
      });
    }
  }

  for (const member of firstArray(league.Members, league.members)) {
    const userId = getUserId(member);
    if (!userId) continue;
    const existing = roster.get(String(userId)) || {};
    const permission = toNumber(firstDefined(member.PermissionLevel, member.permissionLevel));
    roster.set(String(userId), {
      ...existing,
      user_id: userId,
      display_name: getDisplayName(member, userId),
      role: existing.role === "Owner" ? "Owner" : roleFromPermission(permission),
      permission_level: permission,
      join_time: parseTimestamp(firstDefined(member.JoinTime, member.joinTime, member.Joined, member.joined)),
      raw_member: member
    });
  }

  const contributions = new Map();
  for (const item of firstArray(league.PointContributions, league.pointContributions, league.Contributions, league.contributions)) {
    const userId = getUserId(item);
    if (!userId) continue;
    const points = toNumber(firstDefined(item.Points, item.points, item.TotalPoints, item.total_points, item.Score, item.score, item.Value, item.value)) || 0;
    contributions.set(String(userId), {
      display_name: getDisplayName(item, userId),
      points,
      last_contribution_at: parseTimestamp(firstDefined(item.Timestamp, item.timestamp, item.LastContribution, item.lastContribution, item.Updated, item.updated)),
      raw_contribution: item
    });
    if (!roster.has(String(userId))) {
      roster.set(String(userId), {
        user_id: userId,
        display_name: getDisplayName(item, userId),
        role: "Contributor",
        permission_level: null,
        join_time: null,
        raw_member: {}
      });
    }
  }

  const rows = Array.from(roster.values()).map(member => {
    const contribution = contributions.get(String(member.user_id)) || {};
    return {
      ...member,
      display_name: contribution.display_name || member.display_name || `user_${member.user_id}`,
      points: toNumber(contribution.points) || 0,
      last_contribution_at: contribution.last_contribution_at || null,
      raw_contribution: contribution.raw_contribution || {}
    };
  });

  rows.sort((a, b) => {
    const pointDiff = (toNumber(b.points) || 0) - (toNumber(a.points) || 0);
    if (pointDiff !== 0) return pointDiff;
    return String(a.display_name || "").localeCompare(String(b.display_name || ""));
  });

  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

async function addGainFields(env, rows, latest) {
  if (!rows.length) return [];
  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) return rows.map(addNullGains);

  const windows = [
    { key: "gain_5m", minutes: 5, tolerance: 4 },
    { key: "gain_1h", minutes: 60, tolerance: 10 },
    { key: "gain_6h", minutes: 360, tolerance: 20 },
    { key: "gain_12h", minutes: 720, tolerance: 25 },
    { key: "gain_24h", minutes: 1440, tolerance: 45 }
  ];

  const maps = {};
  for (const win of windows) {
    maps[win.key] = await fetchClosestPointMap(env, latest.league_name, latestMs, win.minutes, win.tolerance);
  }

  return rows.map(row => {
    const out = { ...row };
    const currentPoints = toNumber(row.points) || 0;
    for (const win of windows) {
      const previous = maps[win.key].get(String(row.user_id));
      out[win.key] = previous === undefined ? null : currentPoints - previous;
    }
    return out;
  });
}

function addNullGains(row) {
  return { ...row, gain_5m: null, gain_1h: null, gain_6h: null, gain_12h: null, gain_24h: null };
}

async function fetchClosestPointMap(env, league, latestMs, minutes, toleranceMinutes) {
  const targetMs = latestMs - minutes * 60 * 1000;
  const lowerIso = new Date(targetMs - toleranceMinutes * 60 * 1000).toISOString();
  const upperIso = new Date(targetMs + toleranceMinutes * 60 * 1000).toISOString();

  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,user_id,points",
    league_name: `eq.${league}`,
    fetched_at: `gte.${lowerIso}`,
    fetched_at_lte: `lte.${upperIso}`,
    order: "fetched_at.desc,rank.asc",
    limit: "5000"
  }, { paramRename: { fetched_at_lte: "fetched_at" } });

  if (!rows.length) return new Map();

  const snapshots = new Map();
  for (const row of rows) {
    const id = String(row.snapshot_id || "");
    if (!id) continue;
    if (!snapshots.has(id)) {
      snapshots.set(id, {
        distance: Math.abs(new Date(row.fetched_at).getTime() - targetMs),
        points: new Map()
      });
    }
    snapshots.get(id).points.set(String(row.user_id), toNumber(row.points) || 0);
  }

  const best = Array.from(snapshots.values()).sort((a, b) => a.distance - b.distance)[0];
  return best?.points || new Map();
}

function latestMeta(rows) {
  if (!rows.length) return null;
  const row = rows.slice().sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0];
  return {
    snapshot_id: row.snapshot_id,
    fetched_at: row.fetched_at,
    league_name: row.league_name,
    league_id: row.league_id,
    league_level: row.league_level,
    league_points: row.league_points,
    league_icon: row.league_icon,
    member_capacity: row.member_capacity
  };
}

async function replaceCurrentRows(env, table, filters, rows) {
  await supabaseDelete(env, table, filters);
  if (rows.length) await supabaseInsert(env, table, rows);
}

async function pruneOldRows(env, table, nowIso) {
  const retentionHours = clamp(Number(env.RETENTION_HOURS || DEFAULT_RETENTION_HOURS), 1, 24 * 365);
  const cutoff = new Date(new Date(nowIso).getTime() - retentionHours * 60 * 60 * 1000).toISOString();
  await supabaseDelete(env, table, { fetched_at: `lt.${cutoff}` });
}

async function supabaseSelect(env, table, params = {}, options = {}) {
  return supabaseFetch(env, table, { method: "GET", params, paramRename: options.paramRename });
}

async function supabaseInsert(env, table, rows) {
  if (!rows.length) return [];
  return supabaseFetch(env, table, { method: "POST", body: rows, headers: { Prefer: "return=minimal" } });
}

async function supabaseDelete(env, table, filters = {}) {
  return supabaseFetch(env, table, { method: "DELETE", params: filters, headers: { Prefer: "return=minimal" } });
}

async function supabaseFetch(env, table, options = {}) {
  requireSupabase(env);
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const url = new URL(`${base}/rest/v1/${table}`);
  const rename = options.paramRename || {};

  for (const [key, value] of Object.entries(options.params || {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.append(rename[key] || key, String(value));
  }

  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Supabase ${options.method || "GET"} ${table} failed: ${text.slice(0, 1000)}`);
  return text ? JSON.parse(text) : [];
}

function requireSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
}

function requireAdmin(request, env) {
  const expected = String(env.INGEST_ADMIN_TOKEN || "").trim();
  if (!expected) throw httpError(500, "INGEST_ADMIN_TOKEN is not configured");
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (token !== expected) throw httpError(401, "Unauthorized");
}

function leagueName(env) {
  return String(env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME).trim() || DEFAULT_LEAGUE_NAME;
}

function leagueNames(env) {
  const raw = String(env.LEAGUE_NAMES || env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME);
  const names = raw.split(",").map(item => item.trim()).filter(Boolean);
  return names.length ? [...new Set(names)] : [DEFAULT_LEAGUE_NAME];
}

function roleFromPermission(value) {
  const n = toNumber(value);
  if (n === 100) return "Owner";
  if (n && n >= 90) return "Officer";
  if (n && n >= 50) return "Staff";
  return "Member";
}

function getUserId(item) {
  return toNumber(firstDefined(item?.UserID, item?.UserId, item?.userID, item?.userId, item?.user_id, item?.id, item?.ID));
}

function getDisplayName(item, fallbackId) {
  return String(firstDefined(item?.DisplayName, item?.displayName, item?.Username, item?.username, item?.Name, item?.name, fallbackId ? `user_${fallbackId}` : "") || "").trim();
}

function firstArray(...values) {
  for (const value of values) if (Array.isArray(value)) return value;
  return [];
}

function firstDefined(...values) {
  for (const value of values) if (value !== undefined && value !== null && value !== "") return value;
  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function stringOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim())) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const ms = n > 1e12 ? n : n * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function cacheJson(payload, env) {
  const seconds = clamp(Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS), 0, 3600);
  return json(payload, 200, { "Cache-Control": seconds > 0 ? `public, max-age=${seconds}` : "no-store" });
}

function withCors(response, request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env);
  const allowOrigin = !origin ? "*" : (allowed.has("*") || allowed.has(origin) ? origin : Array.from(allowed)[0] || "*");
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function allowedOrigins(env) {
  const raw = String(env.SITE_ORIGINS || "https://oapl.github.io,*");
  return new Set(raw.split(",").map(item => item.trim()).filter(Boolean));
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
