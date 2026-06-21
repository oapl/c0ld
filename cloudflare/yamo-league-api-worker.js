const SNAPSHOT_TABLE = "ps99_league_snapshots";
const CURRENT_TABLE = "ps99_league_current";
const DEFAULT_LEAGUE_NAME = "YAMO";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const ROBLOX_BATCH_SIZE = 100;
const TOP_PLAYERS_NAME = "GLOBAL_TOP_100_PLAYERS";
const TOP_PLAYERS_LIMIT = 100;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
      const url = new URL(request.url);
      let response;
      if (request.method === "GET" && url.pathname === "/api/health") response = json({ ok: true, service: "ps99-league-api", league_name: leagueName(env), league_names: leagueNames(env), snapshot_retention: "permanent", top_players: TOP_PLAYERS_NAME });
      else if (request.method === "GET" && url.pathname === "/api/leagues/current") response = await handleCurrent(request, env);
      else if (request.method === "GET" && url.pathname === "/api/leagues/history") response = await handleHistory(request, env);
      else if (request.method === "GET" && url.pathname === "/api/leagues/top-players") response = await handleTopPlayers(request, env);
      else if (request.method === "POST" && (url.pathname === "/api/leagues/ingest" || url.pathname === "/api/ingest")) { requireAdmin(request, env); response = await handleIngest(env, "manual", url.searchParams.get("league")); }
      else if (request.method === "POST" && url.pathname === "/api/leagues/top-players/ingest") { requireAdmin(request, env); response = await handleTopPlayersIngest(env, "manual"); }
      else response = json({ ok: false, message: "Not found" }, 404);
      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({ ok: false, message: err?.message || String(err) }, err?.status || 500), request, env);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (String(env.INGEST_LEAGUES || "true").toLowerCase() === "false") return;
      for (const league of leagueNames(env)) await handleIngest(env, "schedule", league);
      if (String(env.INGEST_TOP_PLAYERS || "true").toLowerCase() !== "false") await handleTopPlayersIngest(env, "schedule");
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
  const dbRows = rows.map(row => ({ snapshot_id: snapshotId, fetched_at: fetchedAt, source, league_name: summary.league_name, league_id: summary.league_id, league_level: summary.league_level, league_points: summary.league_points, league_icon: summary.league_icon, member_capacity: summary.member_capacity, rank: row.rank, user_id: row.user_id, display_name: row.display_name, points: row.points, last_contribution_at: row.last_contribution_at, permission_level: row.permission_level, role: row.role, join_time: row.join_time, raw_member: row.raw_member, raw_contribution: row.raw_contribution, raw_league: summary.raw_league }));
  if (dbRows.length) { await supabaseInsert(env, SNAPSHOT_TABLE, dbRows); await replaceCurrentRows(env, CURRENT_TABLE, { league_name: `eq.${summary.league_name}` }, dbRows.map(row => ({ ...row, updated_at: fetchedAt }))); }
  return json({ ok: true, league_name: summary.league_name, league_id: summary.league_id, snapshot_id: snapshotId, fetched_at: fetchedAt, rows_inserted: dbRows.length, snapshot_retention: "permanent" }, 202);
}

async function handleTopPlayersIngest(env, source) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const top = await fetchTopLeaguePlayers(env, TOP_PLAYERS_LIMIT);
  const snapshotId = `top_players:${fetchedAt}`;
  const dbRows = top.rows.map(row => ({ snapshot_id: snapshotId, fetched_at: fetchedAt, source: `${source}:top-players`, league_name: TOP_PLAYERS_NAME, league_id: row.source_league_id || null, league_level: row.source_league_level ?? null, league_points: row.source_league_points || 0, league_icon: row.source_league_icon || null, member_capacity: TOP_PLAYERS_LIMIT, rank: row.rank, user_id: row.user_id, display_name: row.display_name, points: row.points, last_contribution_at: row.last_contribution_at || null, permission_level: row.permission_level ?? null, role: row.source_league_name || "Top Player", join_time: row.join_time || null, raw_member: row.raw_member || {}, raw_contribution: row.raw_contribution || {}, raw_league: { source_league_name: row.source_league_name, source_league_rank: row.source_league_rank, source_league_points: row.source_league_points, source: top.source } }));
  if (dbRows.length) { await supabaseInsert(env, SNAPSHOT_TABLE, dbRows); await replaceCurrentRows(env, CURRENT_TABLE, { league_name: `eq.${TOP_PLAYERS_NAME}` }, dbRows.map(row => ({ ...row, updated_at: fetchedAt }))); }
  return json({ ok: true, league_name: TOP_PLAYERS_NAME, snapshot_id: snapshotId, fetched_at: fetchedAt, rows_inserted: dbRows.length, source: top.source }, 202);
}

async function handleCurrent(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const rows = await supabaseSelect(env, CURRENT_TABLE, { select: "snapshot_id,fetched_at,source,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time", league_name: `eq.${requested}`, order: "rank.asc", limit: "500" });
  const latest = latestMeta(rows);
  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_name: requested, rows: [] }, env);
  const [rowsWithGains, leagueRank] = await Promise.all([addGainFields(env, rows, latest), fetchLeagueRank(requested).catch(() => null)]);
  const ids = rowsWithGains.map(row => row.user_id);
  const usernameMap = await resolveRobloxUsernames(ids, env).catch(() => new Map());
  const avatarMap = await resolveRobloxAvatarHeadshots(ids, env).catch(() => new Map());
  return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: latest.fetched_at, league_name: latest.league_name, league_id: latest.league_id, league_level: latest.league_level, league_points: toNumber(latest.league_points) || 0, league_icon: latest.league_icon || null, member_capacity: latest.member_capacity ?? null, league_rank: leagueRank, source: "ps99-league-api-worker", snapshot_retention: "permanent", rows: rowsWithGains.map(row => publicRow(row, usernameMap, avatarMap)) }, env);
}

async function handleTopPlayers(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || TOP_PLAYERS_LIMIT), 1, 100);
  let rows = await supabaseSelect(env, CURRENT_TABLE, { select: "snapshot_id,fetched_at,source,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time,raw_league", league_name: `eq.${TOP_PLAYERS_NAME}`, order: "rank.asc", limit: String(limit) });
  if (!rows.length && String(env.TOP_PLAYERS_LIVE_FALLBACK || "true").toLowerCase() !== "false") {
    const live = await fetchTopLeaguePlayers(env, limit);
    rows = live.rows.map(row => ({ snapshot_id: "live", fetched_at: new Date().toISOString(), source: "live", league_name: TOP_PLAYERS_NAME, rank: row.rank, user_id: row.user_id, display_name: row.display_name, points: row.points, role: row.source_league_name, raw_league: { source_league_name: row.source_league_name, source_league_rank: row.source_league_rank, source_league_points: row.source_league_points } }));
  }
  const latest = latestMeta(rows);
  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_name: TOP_PLAYERS_NAME, rows: [] }, env);
  const rowsWithGains = await addGainFields(env, rows, { ...latest, league_name: TOP_PLAYERS_NAME });
  const ids = rowsWithGains.map(row => row.user_id);
  const usernameMap = await resolveRobloxUsernames(ids, env).catch(() => new Map());
  const avatarMap = await resolveRobloxAvatarHeadshots(ids, env).catch(() => new Map());
  const publicRows = rowsWithGains.map(row => {
    const out = publicRow(row, usernameMap, avatarMap);
    out.source_league_name = row.raw_league?.source_league_name || row.role || null;
    out.source_league_rank = toNumber(row.raw_league?.source_league_rank);
    out.source_league_points = toNumber(row.raw_league?.source_league_points);
    out.projected_gain_1h = projectGain1h(out);
    out.projected_points_1h = out.total_points + out.projected_gain_1h;
    return out;
  });
  publicRows.slice().sort((a, b) => b.projected_points_1h - a.projected_points_1h).forEach((row, index) => { row.projected_rank_1h = index + 1; });
  return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: latest.fetched_at, league_name: TOP_PLAYERS_NAME, source: "ps99-league-api-worker", projection: "projected_rank_1h uses current points plus the best available 1-hour-equivalent gain", rows: publicRows }, env);
}

async function handleHistory(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const userId = url.searchParams.get("user_id");
  const limit = clamp(Number(url.searchParams.get("limit") || 5000), 1, 50000);
  const hoursParam = url.searchParams.get("hours");
  const params = { select: "snapshot_id,fetched_at,league_name,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time", league_name: `eq.${requested}`, order: "fetched_at.desc,rank.asc", limit: String(limit) };
  if (hoursParam !== "all") { const hours = clamp(Number(hoursParam || 24), 1, 24 * 365 * 20); params.fetched_at = `gte.${new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()}`; }
  if (userId) params.user_id = `eq.${userId}`;
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, params);
  return cacheJson({ ok: true, generated_at: new Date().toISOString(), league_name: requested, hours: hoursParam || 24, rows }, env);
}

async function fetchLeagueApi(league) {
  const urls = [`https://ps99.biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`, `https://biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`];
  let lastError = null;
  for (const url of urls) {
    try { const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "c0ld-League-API-Worker" }, cf: { cacheTtl: 0, cacheEverything: false } }); const text = await res.text(); if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`); const data = JSON.parse(text); if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`); return data; } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games league API failed for ${league}: ${lastError?.message || "unknown error"}`);
}

async function fetchLeagueListApi() {
  const urls = [`https://ps99.biggamesapi.io/v1/leagues`, `https://biggamesapi.io/v1/leagues`];
  let lastError = null;
  for (const url of urls) {
    try { const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "c0ld-League-API-Worker" }, cf: { cacheTtl: 0, cacheEverything: false } }); const text = await res.text(); if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`); const data = JSON.parse(text); if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`); return data; } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games leagues API failed: ${lastError?.message || "unknown error"}`);
}

async function fetchLeagueRank(leagueNameValue) {
  const api = await fetchLeagueListApi();
  const leagues = extractLeagueObjects(api.data || api).map((item, i) => ({ item, i, name: lname(item), points: lpoints(item), explicitRank: toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position)) })).filter(x => x.name);
  leagues.sort((a, b) => (b.points - a.points) || (a.explicitRank || 999999) - (b.explicitRank || 999999) || a.name.localeCompare(b.name));
  const found = leagues.find(x => key(x.name) === key(leagueNameValue));
  if (!found) return null;
  return found.explicitRank && found.explicitRank > 0 ? found.explicitRank : leagues.indexOf(found) + 1;
}

async function fetchTopLeaguePlayers(env, limit) {
  const api = await fetchLeagueListApi();
  let leagues = extractLeagueObjects(api.data || api).map((item, index) => ({ item, index, name: lname(item), points: lpoints(item), explicitRank: toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position)) })).filter(x => x.name);
  leagues.sort((a, b) => (b.points - a.points) || (a.explicitRank || 999999) - (b.explicitRank || 999999) || a.name.localeCompare(b.name));
  leagues.forEach((x, i) => { x.rank = x.explicitRank && x.explicitRank > 0 ? x.explicitRank : i + 1; });
  let rows = rowsFromLeagueObjects(leagues);
  let source = "league-list";
  if (rows.length < limit && String(env.TOP_PLAYERS_FETCH_LEAGUE_DETAILS || "true").toLowerCase() !== "false") {
    const detailed = [];
    const maxLeagues = clamp(Number(env.TOP_PLAYERS_DETAIL_LEAGUE_LIMIT || 100), 1, 100);
    const concurrency = clamp(Number(env.TOP_PLAYERS_DETAIL_CONCURRENCY || 8), 1, 20);
    const candidates = leagues.slice(0, maxLeagues);
    let cursor = 0;
    const worker = async () => { while (cursor < candidates.length) { const item = candidates[cursor++]; try { const api = await fetchLeagueApi(item.name); const league = api.data || api; detailed.push({ ...item, item: league, points: lpoints(league) || item.points }); } catch {} } };
    await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
    rows = rowsFromLeagueObjects(detailed.length ? detailed : leagues);
    source = detailed.length ? "league-details" : source;
  }
  rows.sort((a, b) => (b.points - a.points) || String(a.display_name || "").localeCompare(String(b.display_name || "")));
  const deduped = [];
  const seen = new Set();
  for (const row of rows) { const id = String(row.user_id || ""); if (!id || seen.has(id)) continue; seen.add(id); deduped.push(row); if (deduped.length >= limit) break; }
  deduped.forEach((row, i) => { row.rank = i + 1; });
  return { source, rows: deduped };
}

function rowsFromLeagueObjects(leagues) {
  const rows = [];
  for (const league of leagues) {
    const summary = summarizeLeague(league.item, league.name);
    const members = normalizeLeagueRows(league.item);
    for (const row of members) {
      if (!row.user_id || !(toNumber(row.points) > 0)) continue;
      rows.push({ ...row, source_league_name: summary.league_name, source_league_id: summary.league_id, source_league_level: summary.league_level, source_league_points: summary.league_points, source_league_icon: summary.league_icon, source_league_rank: league.rank });
    }
  }
  return rows;
}

function extractLeagueObjects(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) { value.forEach(x => extractLeagueObjects(x, out)); return out; }
  const hasName = value.Name !== undefined || value.name !== undefined || value.LeagueName !== undefined || value.leagueName !== undefined;
  const hasPoints = value.Points !== undefined || value.points !== undefined || value.TotalPoints !== undefined || value.totalPoints !== undefined || value.Score !== undefined || value.score !== undefined;
  if (hasName && hasPoints) out.push(value);
  Object.values(value).forEach(x => extractLeagueObjects(x, out));
  return out;
}

function summarizeLeague(league, fallbackName) {
  const rawLeague = { Name: firstDefined(league.Name, league.name, league.LeagueName, league.leagueName, fallbackName), ID: firstDefined(league.ID, league.Id, league.id), Level: firstDefined(league.Level, league.level), Points: firstDefined(league.Points, league.points, league.TotalPoints, league.totalPoints), Icon: firstDefined(league.Icon, league.icon), MemberCapacity: firstDefined(league.MemberCapacity, league.memberCapacity), Created: firstDefined(league.Created, league.created), Owner: firstDefined(league.Owner, league.owner) };
  return { league_name: String(rawLeague.Name || fallbackName).trim() || fallbackName, league_id: stringOrNull(rawLeague.ID), league_level: toNumber(rawLeague.Level), league_points: toNumber(rawLeague.Points) || 0, league_icon: stringOrNull(rawLeague.Icon), member_capacity: toNumber(rawLeague.MemberCapacity), raw_league: rawLeague };
}

function normalizeLeagueRows(league) {
  const roster = new Map();
  const owner = firstDefined(league.Owner, league.owner);
  if (owner) { const ownerId = getUserId(owner); if (ownerId) roster.set(String(ownerId), { user_id: ownerId, display_name: getDisplayName(owner, ownerId), role: "Owner", permission_level: 100, join_time: null, raw_member: owner }); }
  for (const member of firstArray(league.Members, league.members)) { const userId = getUserId(member); if (!userId) continue; const existing = roster.get(String(userId)) || {}; const permission = toNumber(firstDefined(member.PermissionLevel, member.permissionLevel)); roster.set(String(userId), { ...existing, user_id: userId, display_name: getDisplayName(member, userId), role: existing.role === "Owner" ? "Owner" : roleFromPermission(permission), permission_level: permission, join_time: parseTimestamp(firstDefined(member.JoinTime, member.joinTime, member.Joined, member.joined)), raw_member: member }); }
  const contributions = new Map();
  for (const item of firstArray(league.PointContributions, league.pointContributions, league.Contributions, league.contributions, league.Players, league.players)) { const userId = getUserId(item); if (!userId) continue; contributions.set(String(userId), { display_name: getDisplayName(item, userId), points: toNumber(firstDefined(item.Points, item.points, item.TotalPoints, item.total_points, item.Score, item.score, item.Value, item.value)) || 0, last_contribution_at: parseTimestamp(firstDefined(item.Timestamp, item.timestamp, item.LastContribution, item.lastContribution, item.Updated, item.updated)), raw_contribution: item }); if (!roster.has(String(userId))) roster.set(String(userId), { user_id: userId, display_name: getDisplayName(item, userId), role: "Contributor", permission_level: null, join_time: null, raw_member: {} }); }
  const rows = Array.from(roster.values()).map(member => { const contribution = contributions.get(String(member.user_id)) || {}; return { ...member, display_name: contribution.display_name || member.display_name || `user_${member.user_id}`, points: toNumber(contribution.points) || 0, last_contribution_at: contribution.last_contribution_at || null, raw_contribution: contribution.raw_contribution || {} }; });
  rows.sort((a, b) => ((toNumber(b.points) || 0) - (toNumber(a.points) || 0)) || String(a.display_name || "").localeCompare(String(b.display_name || "")));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

async function resolveRobloxUsernames(userIds, env) {
  const shouldLookup = String(env.ROBLOX_USERNAME_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  for (const id of ids) result.set(id, `user_${id}`);
  if (!shouldLookup || !ids.length) return result;
  const lookupBatch = async batch => { try { const res = await fetch("https://users.roblox.com/v1/users", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "c0ld-League-API-Worker" }, body: JSON.stringify({ userIds: batch, excludeBannedUsers: false }) }); if (!res.ok) return; const data = await res.json(); for (const user of data.data || []) { const id = toNumber(user.id); if (id && user.name) result.set(id, String(user.name)); } } catch {} };
  await Promise.all(chunk(ids, ROBLOX_BATCH_SIZE).map(lookupBatch));
  return result;
}

async function resolveRobloxAvatarHeadshots(userIds, env) {
  const shouldLookup = String(env.ROBLOX_AVATAR_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  if (!shouldLookup || !ids.length) return result;
  for (const batch of chunk(ids, ROBLOX_BATCH_SIZE)) {
    const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    url.searchParams.set("userIds", batch.join(",")); url.searchParams.set("size", "150x150"); url.searchParams.set("format", "Png"); url.searchParams.set("isCircular", "false");
    try { const res = await fetch(url.toString(), { headers: { Accept: "application/json", "User-Agent": "c0ld-League-API-Worker" } }); if (!res.ok) continue; const data = await res.json(); for (const item of data.data || []) { const id = toNumber(item?.targetId); const imageUrl = String(item?.imageUrl || "").trim(); const state = String(item?.state || "").trim(); if (id && imageUrl && state === "Completed") result.set(id, imageUrl); } } catch {}
  }
  return result;
}

function publicRow(row, usernameMap, avatarMap) { const id = toNumber(row.user_id); const name = displayUsername(row, usernameMap); return { fetched_at: row.fetched_at, rank: toNumber(row.rank), user_id: id, username: name, display_name: name, avatar_url: avatarMap.get(String(id)) || null, total_points: toNumber(row.points) || 0, points: toNumber(row.points) || 0, last_contribution_at: row.last_contribution_at || null, permission_level: row.permission_level ?? null, role: row.role || "Member", join_time: row.join_time || null, gain_5m: row.gain_5m, gain_1h: row.gain_1h, gain_6h: row.gain_6h, gain_12h: row.gain_12h, gain_24h: row.gain_24h }; }
function projectGain1h(row) { const g1 = toNumber(row.gain_1h); if (g1 !== null) return g1; const g5 = toNumber(row.gain_5m); if (g5 !== null) return g5 * 12; const g6 = toNumber(row.gain_6h); if (g6 !== null) return g6 / 6; const g12 = toNumber(row.gain_12h); if (g12 !== null) return g12 / 12; const g24 = toNumber(row.gain_24h); if (g24 !== null) return g24 / 24; return 0; }
function isFallbackUsername(username, userId) { const text = String(username || "").trim(); const id = String(userId || "").trim(); return !text || (id && text === id) || /^user_\d+$/i.test(text); }
function displayUsername(row, usernameMap) { const id = toNumber(row.user_id); const existing = String(row.display_name || "").trim(); const resolved = id ? String(usernameMap.get(id) || "").trim() : ""; if (resolved && !isFallbackUsername(resolved, id)) return resolved; if (existing && !isFallbackUsername(existing, id)) return existing; return existing || (id ? `user_${id}` : ""); }

async function addGainFields(env, rows, latest) {
  if (!rows.length) return [];
  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) return rows.map(addNullGains);
  const windows = [{ key: "gain_5m", minutes: 5, tolerance: 4 }, { key: "gain_1h", minutes: 60, tolerance: 10 }, { key: "gain_6h", minutes: 360, tolerance: 20 }, { key: "gain_12h", minutes: 720, tolerance: 25 }, { key: "gain_24h", minutes: 1440, tolerance: 45 }];
  const maps = {}; for (const win of windows) maps[win.key] = await fetchClosestPointMap(env, latest.league_name, latestMs, win.minutes, win.tolerance);
  return rows.map(row => { const out = { ...row }; const currentPoints = toNumber(row.points) || 0; for (const win of windows) { const previous = maps[win.key].get(String(row.user_id)); out[win.key] = previous === undefined ? null : currentPoints - previous; } return out; });
}
function addNullGains(row) { return { ...row, gain_5m: null, gain_1h: null, gain_6h: null, gain_12h: null, gain_24h: null }; }
async function fetchClosestPointMap(env, league, latestMs, minutes, toleranceMinutes) { const targetMs = latestMs - minutes * 60 * 1000; const rows = await supabaseSelect(env, SNAPSHOT_TABLE, { select: "snapshot_id,fetched_at,user_id,points", league_name: `eq.${league}`, fetched_at: `gte.${new Date(targetMs - toleranceMinutes * 60 * 1000).toISOString()}`, fetched_at_lte: `lte.${new Date(targetMs + toleranceMinutes * 60 * 1000).toISOString()}`, order: "fetched_at.desc,rank.asc", limit: "5000" }, { paramRename: { fetched_at_lte: "fetched_at" } }); if (!rows.length) return new Map(); const snapshots = new Map(); for (const row of rows) { const id = String(row.snapshot_id || ""); if (!id) continue; if (!snapshots.has(id)) snapshots.set(id, { distance: Math.abs(new Date(row.fetched_at).getTime() - targetMs), points: new Map() }); snapshots.get(id).points.set(String(row.user_id), toNumber(row.points) || 0); } return (Array.from(snapshots.values()).sort((a, b) => a.distance - b.distance)[0]?.points) || new Map(); }

function latestMeta(rows) { if (!rows.length) return null; const row = rows.slice().sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0]; return { snapshot_id: row.snapshot_id, fetched_at: row.fetched_at, league_name: row.league_name, league_id: row.league_id, league_level: row.league_level, league_points: row.league_points, league_icon: row.league_icon, member_capacity: row.member_capacity }; }
async function replaceCurrentRows(env, table, filters, rows) { await supabaseDelete(env, table, filters); if (rows.length) await supabaseInsert(env, table, rows); }
async function supabaseSelect(env, table, params = {}, options = {}) { return supabaseFetch(env, table, { method: "GET", params, paramRename: options.paramRename }); }
async function supabaseInsert(env, table, rows) { if (!rows.length) return []; return supabaseFetch(env, table, { method: "POST", body: rows, headers: { Prefer: "return=minimal" } }); }
async function supabaseDelete(env, table, filters = {}) { return supabaseFetch(env, table, { method: "DELETE", params: filters, headers: { Prefer: "return=minimal" } }); }
async function supabaseFetch(env, table, options = {}) { requireSupabase(env); const base = String(env.SUPABASE_URL || "").replace(/\/+$/, ""); const url = new URL(`${base}/rest/v1/${table}`); const rename = options.paramRename || {}; for (const [key, value] of Object.entries(options.params || {})) if (value !== undefined && value !== null && value !== "") url.searchParams.append(rename[key] || key, String(value)); const res = await fetch(url.toString(), { method: options.method || "GET", headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) }, body: options.body ? JSON.stringify(options.body) : undefined }); const text = await res.text(); if (!res.ok) throw httpError(res.status, `Supabase ${options.method || "GET"} ${table} failed: ${text.slice(0, 1000)}`); return text ? JSON.parse(text) : []; }

function requireSupabase(env) { if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_KEY are required"); }
function requireAdmin(request, env) { const expected = String(env.INGEST_ADMIN_TOKEN || "").trim(); if (!expected) throw httpError(500, "INGEST_ADMIN_TOKEN is not configured"); const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim(); if (token !== expected) throw httpError(401, "Unauthorized"); }
function leagueName(env) { return String(env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME).trim() || DEFAULT_LEAGUE_NAME; }
function leagueNames(env) { const raw = String(env.LEAGUE_NAMES || env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME); const names = raw.split(",").map(item => item.trim()).filter(Boolean); return names.length ? [...new Set(names)] : [DEFAULT_LEAGUE_NAME]; }
function roleFromPermission(value) { const n = toNumber(value); if (n === 100) return "Owner"; if (n && n >= 90) return "Officer"; if (n && n >= 50) return "Staff"; return "Member"; }
function getUserId(item) { return toNumber(firstDefined(item?.UserID, item?.UserId, item?.userID, item?.userId, item?.user_id, item?.id, item?.ID)); }
function getDisplayName(item, fallbackId) { return String(firstDefined(item?.DisplayName, item?.displayName, item?.Username, item?.username, item?.Name, item?.name, fallbackId ? `user_${fallbackId}` : "") || "").trim(); }
function firstArray(...values) { for (const value of values) if (Array.isArray(value)) return value; return []; }
function firstDefined(...values) { for (const value of values) if (value !== undefined && value !== null && value !== "") return value; return null; }
function toNumber(value) { if (value === null || value === undefined || value === "") return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
function stringOrNull(value) { const text = String(value ?? "").trim(); return text || null; }
function parseTimestamp(value) { if (value === null || value === undefined || value === "") return null; if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim())) { const n = Number(value); if (!Number.isFinite(n) || n <= 0) return null; const ms = n > 1e12 ? n : n * 1000; const date = new Date(ms); return Number.isNaN(date.getTime()) ? null : date.toISOString(); } const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
function clamp(value, min, max) { const n = Number(value); if (!Number.isFinite(n)) return min; return Math.min(max, Math.max(min, n)); }
function key(v) { return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function lname(r) { return String(firstDefined(r.Name, r.name, r.LeagueName, r.leagueName, "") || "").trim(); }
function lpoints(r) { const n = Number(firstDefined(r.Points, r.points, r.TotalPoints, r.totalPoints, r.Score, r.score, 0)); return Number.isFinite(n) ? n : 0; }
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function json(payload, status = 200, headers = {}) { return new Response(JSON.stringify(payload, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } }); }
function cacheJson(payload, env) { const seconds = clamp(Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS), 0, 3600); return json(payload, 200, { "Cache-Control": seconds > 0 ? `public, max-age=${seconds}` : "no-store" }); }
function withCors(response, request, env) { const origin = request.headers.get("Origin") || ""; const allowed = allowedOrigins(env); const allowOrigin = !origin ? "*" : (allowed.has("*") || allowed.has(origin) ? origin : Array.from(allowed)[0] || "*"); const headers = new Headers(response.headers); headers.set("Access-Control-Allow-Origin", allowOrigin); headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization"); headers.set("Vary", "Origin"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
function allowedOrigins(env) { const raw = String(env.SITE_ORIGINS || "https://oapl.github.io,*"); return new Set(raw.split(",").map(item => item.trim()).filter(Boolean)); }
function httpError(status, message) { const err = new Error(message); err.status = status; return err; }
