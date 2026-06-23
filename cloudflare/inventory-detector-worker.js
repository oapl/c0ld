const SNAPSHOT_TABLE = "ps99_inventory_snapshots";
const ITEM_TABLE = "ps99_inventory_snapshot_items";
const DISCORD_POSTS_TABLE = "ps99_inventory_discord_posts";
const DEFAULT_TIME_ZONE = "America/Denver";
const DEFAULT_USER_ID = "109818";
const DEFAULT_USERNAME = "Cinnamowopal";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/inventory/health") {
        response = json({ ok: true, service: "ps99-inventory-detector", timezone: timeZone(env) });
      } else if (request.method === "POST" && url.pathname === "/api/inventory/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(request, env, "manual");
      } else if (request.method === "POST" && url.pathname === "/api/inventory/post-hourly") {
        requireAdmin(request, env);
        response = await handlePostHourly(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/latest") {
        response = await handleLatest(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/diff") {
        response = await handleDiff(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/hourly") {
        response = await handleHourlySeries(request, env);
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
      for (const user of configuredUsers(env)) {
        await ingestInventory(env, user, "schedule", isMountainMidnight(new Date(), env));
        if (shouldPostHourly(new Date(), env)) await postHourlyDiffIfNeeded(env, user);
      }
    })());
  }
};

async function handleIngest(request, env, source) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const isBoundary = parseBool(url.searchParams.get("boundary")) ?? isMountainMidnight(new Date(), env);
  const result = await ingestInventory(env, user, source, isBoundary);
  if (parseBool(url.searchParams.get("post_hourly"))) {
    result.discord = await postHourlyDiffIfNeeded(env, user, { force: true });
  }
  return json({ ok: true, ...result });
}

async function handlePostHourly(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const result = await postHourlyDiffIfNeeded(env, user, { force: parseBool(url.searchParams.get("force")) });
  return json({ ok: true, ...result });
}

async function handleLatest(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const snapshot = await getLatestSnapshot(env, userId);
  if (!snapshot) return json({ ok: false, message: "No inventory snapshots found." }, 404);
  const items = await getSnapshotItems(env, snapshot.id);
  return cacheJson({ ok: true, snapshot, items }, env);
}

async function handleDiff(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const mode = String(url.searchParams.get("mode") || "daily").toLowerCase();
  const snapshots = await getUserSnapshots(env, userId, Number(url.searchParams.get("limit") || 500));
  if (!snapshots.length) return json({ ok: false, message: "No inventory snapshots found." }, 404);

  const picked = mode === "hour" || mode === "hourly" || url.searchParams.get("hours") === "1"
    ? pickLastHourSnapshots(snapshots)
    : pickDailyComparisonSnapshots(snapshots, url.searchParams.get("day"));

  const payload = await buildDiffPayload(env, userId, picked);
  if (!payload.ok) return json(payload, 404);
  return cacheJson(payload, env);
}

async function handleHourlySeries(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const hours = Math.max(1, Math.min(72, Number(url.searchParams.get("hours") || 24)));
  const snapshots = await getUserSnapshots(env, userId, Math.max(500, hours * 20));
  if (!snapshots.length) return json({ ok: false, message: "No inventory snapshots found." }, 404);

  const sorted = sortAsc(snapshots);
  const latest = sorted[sorted.length - 1];
  const latestDate = new Date(latest.captured_at);
  const rows = [];

  for (let i = hours; i >= 1; i--) {
    const endTarget = new Date(latestDate.getTime() - (i - 1) * 3600000);
    const startTarget = new Date(endTarget.getTime() - 3600000);
    const start = closestSnapshotAtOrBefore(sorted, startTarget);
    const end = closestSnapshotAtOrBefore(sorted, endTarget);
    if (!start || !end || start.id === end.id) continue;
    const diff = await buildDiffFromSnapshots(env, start, end);
    rows.push({
      period_start: startTarget.toISOString(),
      period_end: endTarget.toISOString(),
      start: lightSnapshot(start),
      end: lightSnapshot(end),
      totals: diff.totals,
      top_gained: diff.gained.slice(0, 12),
      top_lost: diff.lost.slice(0, 12)
    });
  }

  return cacheJson({ ok: true, user_id: userId, hours, rows }, env);
}

async function ingestInventory(env, user, source, isBoundary) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const localDay = localDateString(new Date(fetchedAt), env);
  const userId = String(user.user_id || DEFAULT_USER_ID).trim();
  const username = String(user.username || userId).trim();

  const raw = await fetchPublicInventory(username || userId);
  const rawItems = extractInventoryItems(raw);
  const snapshotRows = await supabaseInsert(env, SNAPSHOT_TABLE, [{
    roblox_user_id: Number(userId),
    roblox_username: username,
    source,
    captured_at: fetchedAt,
    local_day: localDay,
    is_boundary: !!isBoundary,
    boundary_label: isBoundary ? `midnight_${timeZone(env)}` : null,
    item_count: rawItems.length,
    raw
  }], "representation");

  const snapshot = snapshotRows[0];
  const itemRows = rawItems.map(item => normalizeItemRow(item, snapshot.id, userId, fetchedAt, localDay));

  for (const chunk of chunks(itemRows, 500)) {
    if (chunk.length) await supabaseInsert(env, ITEM_TABLE, chunk, "minimal");
  }

  return { snapshot: lightSnapshot(snapshot), raw_item_count: rawItems.length, item_count: itemRows.length };
}

async function postHourlyDiffIfNeeded(env, user, options = {}) {
  if (!env.DISCORD_WEBHOOK_URL) return { posted: false, reason: "DISCORD_WEBHOOK_URL is not configured" };
  const userId = String(user.user_id || DEFAULT_USER_ID).trim();
  const snapshots = await getUserSnapshots(env, userId, 500);
  const picked = pickLastHourSnapshots(snapshots);
  const payload = await buildDiffPayload(env, userId, picked);
  if (!payload.ok) return { posted: false, reason: payload.message || "No hourly diff available" };

  const postKey = hourlyPostKey(payload.end?.captured_at || new Date().toISOString(), env);
  if (!options.force) {
    const existing = await supabaseSelect(env, DISCORD_POSTS_TABLE, { roblox_user_id: `eq.${userId}`, post_key: `eq.${postKey}`, limit: "1" });
    if (existing.length) return { posted: false, reason: "Already posted", post_key: postKey };
  }

  const discordPayload = buildDiscordPayload(user, payload);
  const discordResponse = await sendDiscordWebhook(env.DISCORD_WEBHOOK_URL, discordPayload);
  await supabaseInsert(env, DISCORD_POSTS_TABLE, [{
    roblox_user_id: Number(userId),
    post_key: postKey,
    period_type: "hourly",
    period_start: payload.start.captured_at,
    period_end: payload.end.captured_at,
    snapshot_start_id: payload.start.id,
    snapshot_end_id: payload.end.id,
    discord_response: discordResponse || {}
  }], "minimal");

  return { posted: true, post_key: postKey, totals: payload.totals };
}

function buildDiscordPayload(user, diffPayload) {
  const gained = diffPayload.gained || [];
  const lost = diffPayload.lost || [];
  const title = `${user.username || user.user_id || DEFAULT_USERNAME} hourly inventory gains`;
  const lines = [];
  lines.push(`Window: ${formatDiscordTime(diffPayload.start.captured_at)} → ${formatDiscordTime(diffPayload.end.captured_at)}`);
  lines.push(`Snapshots: ${diffPayload.start.item_count || "?"} → ${diffPayload.end.item_count || "?"} stacks`);
  lines.push("");
  if (gained.length) {
    lines.push("**Gained / increased**");
    for (const row of gained.slice(0, 18)) lines.push(`+${fmtNumber(row.delta)} ${row.display_name || row.item_id || row.item_key}`);
  } else {
    lines.push("**Gained / increased**");
    lines.push("No increases detected.");
  }
  if (lost.length) {
    lines.push("");
    lines.push("**Lost / decreased**");
    for (const row of lost.slice(0, 8)) lines.push(`${fmtNumber(row.delta)} ${row.display_name || row.item_id || row.item_key}`);
  }

  return {
    username: "PS99 Inventory Detector",
    embeds: [{
      title,
      description: lines.join("\n").slice(0, 4000),
      color: 0xff9b96,
      footer: { text: `Added: ${diffPayload.totals.added} • Removed: ${diffPayload.totals.removed} • Changed: ${diffPayload.totals.changed}` },
      timestamp: diffPayload.end.captured_at
    }]
  };
}

async function sendDiscordWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Discord webhook failed: ${text}`);
  try { return text ? JSON.parse(text) : { ok: true }; } catch { return { ok: true, response: text }; }
}

async function buildDiffPayload(env, userId, picked) {
  if (!picked.start || !picked.end || picked.start.id === picked.end.id) {
    const targetText = picked.target_at ? ` Need a snapshot at or before ${picked.target_at}.` : "";
    return { ok: false, message: `Not enough snapshots to compare yet.${targetText}`, mode: picked.mode || "unknown", end: lightSnapshot(picked.end || null), target_at: picked.target_at || null };
  }
  const diff = await buildDiffFromSnapshots(env, picked.start, picked.end);
  return {
    ok: true,
    user_id: userId,
    mode: picked.mode,
    start: lightSnapshot(picked.start),
    end: lightSnapshot(picked.end),
    totals: diff.totals,
    gained: diff.gained,
    lost: diff.lost,
    added: diff.added,
    removed: diff.removed,
    changed: diff.changed
  };
}

async function buildDiffFromSnapshots(env, start, end) {
  const [startItems, endItems] = await Promise.all([getSnapshotItems(env, start.id), getSnapshotItems(env, end.id)]);
  return buildDiff(startItems, endItems);
}

function pickLastHourSnapshots(snapshots) {
  const snaps = sortAsc(snapshots);
  const end = snaps[snaps.length - 1];
  if (!end) return { mode: "last_hour", start: null, end: null };
  const target = new Date(new Date(end.captured_at).getTime() - 3600000);
  const start = closestSnapshotAtOrBefore(snaps, target);
  if (!start) return { mode: "last_hour_waiting_for_baseline", start: null, end, target_at: target.toISOString() };
  return { mode: "last_hour_live", start, end, target_at: target.toISOString() };
}

function pickDailyComparisonSnapshots(descSnapshots, requestedDay) {
  const snaps = sortAsc(descSnapshots);
  if (!snaps.length) return {};
  if (requestedDay) {
    const start = snaps.find(s => s.local_day === requestedDay && s.is_boundary) || snaps.find(s => s.local_day === requestedDay);
    const nextDay = nextLocalDate(requestedDay);
    const end = snaps.find(s => s.local_day === nextDay && s.is_boundary) || [...snaps].reverse().find(s => s.local_day === requestedDay || s.local_day === nextDay);
    if (start && end && start.id !== end.id) return { start, end, mode: "requested_day" };
  }
  const boundaries = snaps.filter(s => s.is_boundary);
  if (boundaries.length >= 2) return { start: boundaries[boundaries.length - 2], end: boundaries[boundaries.length - 1], mode: "midnight_to_midnight" };
  const first = snaps[0];
  const latest = snaps[snaps.length - 1];
  if (first && latest && first.id !== latest.id) return { start: first, end: latest, mode: "first_pull_to_latest_pending_midnight" };
  return { start: null, end: latest, mode: "waiting_for_second_snapshot" };
}

function buildDiff(startItems, endItems) {
  const startMap = aggregateItems(startItems);
  const endMap = aggregateItems(endItems);
  const added = [];
  const removed = [];
  const changed = [];
  const gained = [];
  const lost = [];

  for (const [key, end] of endMap.entries()) {
    const start = startMap.get(key);
    const before = start ? Number(start.count || 0) : 0;
    const after = Number(end.count || 0);
    const delta = after - before;
    if (!start && after !== 0) {
      const row = diffRow(end, 0, after, delta);
      added.push(row);
      gained.push(row);
    } else if (delta !== 0) {
      const row = diffRow(end, before, after, delta);
      changed.push(row);
      if (delta > 0) gained.push(row);
      else lost.push(row);
    }
  }

  for (const [key, start] of startMap.entries()) {
    if (!endMap.has(key)) {
      const before = Number(start.count || 0);
      const row = diffRow(start, before, 0, -before);
      removed.push(row);
      lost.push(row);
    }
  }

  const sortFn = (a, b) => Math.abs(b.delta) - Math.abs(a.delta) || String(a.display_name).localeCompare(String(b.display_name));
  return {
    totals: { added: added.length, removed: removed.length, changed: changed.length, gained: gained.length, lost: lost.length },
    added: added.sort(sortFn), removed: removed.sort(sortFn), changed: changed.sort(sortFn), gained: gained.sort(sortFn), lost: lost.sort(sortFn)
  };
}

function aggregateItems(items) {
  const map = new Map();
  for (const item of items || []) {
    const key = item.item_key || item.item_hash || `${item.item_class || ""}:${item.item_id || ""}:${item.variant || ""}`;
    const existing = map.get(key);
    if (!existing) map.set(key, { ...item });
    else {
      existing.count = Number(existing.count || 0) + Number(item.count || 0);
      existing.rap = Math.max(Number(existing.rap || 0), Number(item.rap || 0));
    }
  }
  return map;
}

function diffRow(item, before, after, delta) {
  return { item_key: item.item_key, item_class: item.item_class, item_id: item.item_id, display_name: item.display_name || item.item_id || item.item_key, variant: item.variant, before, after, delta, rap: Number(item.rap || 0), raw: item.raw || null };
}

async function fetchPublicInventory(usernameOrId) {
  const url = `https://ps99.biggamesapi.io/v1/players/${encodeURIComponent(usernameOrId)}?include=inventory,profile,extendedProfile`;
  const res = await fetch(url, { headers: { accept: "application/json" }, cf: { cacheTtl: 0 } });
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw httpError(502, `Big Games returned non-JSON: ${text.slice(0, 160)}`); }
  if (!res.ok || payload.status === "error") throw httpError(502, `Big Games inventory fetch failed: ${JSON.stringify(payload).slice(0, 260)}`);
  return payload;
}

function extractInventoryItems(raw) {
  const data = raw?.data || raw;
  const view = data?.views?.inventory;
  if (view && view.available === false) return [];
  const candidates = [view?.data?.items, data?.inventory?.items, data?.items, raw?.items];
  for (const arr of candidates) if (Array.isArray(arr)) return arr;
  return findBestItemArray(raw);
}

function findBestItemArray(obj, path = "") {
  let best = { score: 0, arr: [] };
  walk(obj, path);
  return best.arr;
  function walk(value, p) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const score = scoreArray(p, value);
      if (score > best.score) best = { score, arr: value };
      for (let i = 0; i < Math.min(value.length, 3); i++) walk(value[i], `${p}.${i}`);
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(v, p ? `${p}.${k}` : k);
  }
}

function scoreArray(path, arr) {
  if (!Array.isArray(arr) || !arr.length || typeof arr[0] !== "object") return 0;
  let score = /inventory|items/i.test(path) ? 20 : 0;
  for (const item of arr.slice(0, 15)) {
    const keys = Object.keys(item || {}).map(k => k.toLowerCase());
    if (keys.includes("id")) score += 4;
    if (keys.includes("class")) score += 5;
    if (keys.includes("count") || keys.includes("amount") || keys.includes("quantity")) score += 3;
    if (keys.includes("stackkey") || keys.includes("stack_key")) score += 2;
  }
  return score;
}

function normalizeItemRow(item, snapshotId, userId, capturedAt, localDay) {
  const itemClass = item.class || item.category || item.type || null;
  const itemId = item.id || item.itemId || item.configName || item.name || null;
  const displayName = item.displayName || item.name || itemId || item.stackKey || "Unknown item";
  const variant = getVariant(item);
  const itemKey = getItemKey(item, itemClass, itemId, variant);
  return { snapshot_id: snapshotId, roblox_user_id: Number(userId), captured_at: capturedAt, local_day: localDay, item_key: itemKey, item_class: itemClass, item_id: itemId, display_name: displayName, variant, count: itemCount(item), rap: itemRap(item), raw: item };
}

function getItemKey(item, itemClass, itemId, variant) { return String(item.stackKey || item.stack_key || item.uid || `${itemClass || ""}:${itemId || ""}:${variant || ""}`).trim(); }
function itemCount(item) { const n = Number(item.count ?? item.amount ?? item.quantity ?? item.qty ?? 1); return Number.isFinite(n) ? n : 1; }
function itemRap(item) { for (const v of [item.rap, item.RAP, item.value, item.Value, item.recentAveragePrice, item.rawData?.rap]) { const n = Number(v); if (Number.isFinite(n) && n > 0) return n; } return 0; }
function getVariant(item) { const raw = JSON.stringify(item).toLowerCase(); const parts = []; if (raw.includes("rainbow")) parts.push("Rainbow"); else if (raw.includes("golden") || raw.includes('"pt":1')) parts.push("Golden"); if (raw.includes("shiny") || raw.includes('"sh":true')) parts.push("Shiny"); return parts.join(" ") || "Normal"; }

async function getUserSnapshots(env, userId, limit = 500) { return supabaseSelect(env, SNAPSHOT_TABLE, { roblox_user_id: `eq.${userId}`, order: "captured_at.desc", limit: String(limit) }); }
async function getLatestSnapshot(env, userId) { const rows = await getUserSnapshots(env, userId, 1); return rows[0] || null; }
async function getSnapshotItems(env, snapshotId) { return supabaseSelect(env, ITEM_TABLE, { snapshot_id: `eq.${snapshotId}`, limit: "10000" }); }
async function supabaseSelect(env, table, params) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { headers: supabaseHeaders(env) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, `Supabase select failed: ${text}`); return text ? JSON.parse(text) : []; }
async function supabaseInsert(env, table, rows, prefer = "representation") { if (!rows.length) return []; const res = await fetch(`${supabaseUrl(env)}/rest/v1/${table}`, { method: "POST", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: `return=${prefer}` }, body: JSON.stringify(rows) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, `Supabase insert failed: ${text}`); return text ? JSON.parse(text) : []; }
function supabaseHeaders(env) { const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY; return { apikey: key, authorization: `Bearer ${key}` }; }
function supabaseUrl(env) { return String(env.SUPABASE_URL || "").replace(/\/+$/, ""); }
function requireSupabase(env) { if (!supabaseUrl(env) || !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)) throw httpError(500, "Missing Supabase environment variables."); }
function requireAdmin(request, env) { const expected = env.INGEST_ADMIN_TOKEN; if (!expected) return; if ((request.headers.get("authorization") || "") !== `Bearer ${expected}`) throw httpError(401, "Unauthorized"); }
function configuredUsers(env) { try { const parsed = JSON.parse(env.INVENTORY_USERS_JSON || "[]"); if (Array.isArray(parsed) && parsed.length) return parsed.map(u => ({ user_id: String(u.user_id || u.id || DEFAULT_USER_ID), username: String(u.username || DEFAULT_USERNAME) })); } catch {} return [{ user_id: DEFAULT_USER_ID, username: DEFAULT_USERNAME }]; }
function requestUser(url) { return { user_id: String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim(), username: String(url.searchParams.get("username") || DEFAULT_USERNAME).trim() }; }
function timeZone(env) { return env.INVENTORY_TIME_ZONE || DEFAULT_TIME_ZONE; }
function localDateString(date, env) { return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone(env), year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function localHourMinute(date, env) { const parts = new Intl.DateTimeFormat("en-US", { timeZone: timeZone(env), hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date); return { hour: Number(parts.find(p => p.type === "hour")?.value || 0), minute: Number(parts.find(p => p.type === "minute")?.value || 0) }; }
function isMountainMidnight(date, env) { const { hour, minute } = localHourMinute(date, env); return hour === 0 && minute <= 10; }
function shouldPostHourly(date, env) { const { minute } = localHourMinute(date, env); return minute < Number(env.DISCORD_POST_MINUTE_WINDOW || 10); }
function hourlyPostKey(iso, env) { const d = new Date(iso); const date = localDateString(d, env); const { hour } = localHourMinute(d, env); return `${date}T${String(hour).padStart(2, "0")}`; }
function nextLocalDate(yyyyMmDd) { const d = new Date(`${yyyyMmDd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function sortAsc(snaps) { return [...(snaps || [])].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at)); }
function closestSnapshotAtOrBefore(sortedAsc, targetDate) { let best = null; for (const snap of sortedAsc || []) { if (new Date(snap.captured_at) <= targetDate) best = snap; else break; } return best; }
function lightSnapshot(s) { if (!s) return null; return { id: s.id, roblox_user_id: s.roblox_user_id, roblox_username: s.roblox_username, captured_at: s.captured_at, local_day: s.local_day, is_boundary: s.is_boundary, item_count: s.item_count, source: s.source }; }
function chunks(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function parseBool(v) { if (v === null || v === undefined || v === "") return null; return ["1", "true", "yes", "y"].includes(String(v).toLowerCase()); }
function fmtNumber(n) { return Number(n || 0).toLocaleString("en-US"); }
function formatDiscordTime(iso) { return new Date(iso).toLocaleString("en-US", { timeZone: DEFAULT_TIME_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function httpError(status, message) { const err = new Error(message); err.status = status; return err; }
function json(value, status = 200) { return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }
function cacheJson(value, env, status = 200) { const seconds = Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS); return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${seconds}` } }); }
function withCors(response, request, env) { const headers = new Headers(response.headers); headers.set("access-control-allow-origin", env.ALLOWED_ORIGIN || "*"); headers.set("access-control-allow-methods", "GET,POST,OPTIONS"); headers.set("access-control-allow-headers", "content-type, authorization"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
