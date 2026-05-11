const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const DATA_DIR = path.join(process.cwd(), "Data");
const MANUAL_BATTLES_FILE = path.join(DATA_DIR, "manual-battles.json");
const PLAYER_INDEX_FILE = path.join(DATA_DIR, "player-index.json");
const OUTPUT_FILE = path.join(DATA_DIR, "nong-history.json");
const AVATAR_DIR = path.join(process.cwd(), "assets", "avatars");
const AVATAR_PUBLIC_PATH = "assets/avatars";

const PAGE_SIZE = 1000;
const ROBLOX_USERNAME_BATCH_SIZE = 100;
const ROBLOX_THUMB_BATCH_SIZE = 100;

if (!SUPABASE_URL) throw new Error("Missing required env var: SUPABASE_URL");
if (!SUPABASE_KEY) throw new Error("Missing required env var: SUPABASE_SERVICE_KEY");

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function stringOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function dateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function buildPlayerMaps(playerIndex) {
  const byUserId = new Map();
  const byProfileKey = new Map();
  const byUsername = new Map();

  for (const p of playerIndex || []) {
    const userId = String(p.user_id || "").trim();
    const profileKey = String(p.profile_key || "").trim();
    const usernameKey = normalizeName(p.username);

    if (userId) byUserId.set(userId, p);
    if (profileKey) byProfileKey.set(profileKey, p);
    if (usernameKey) byUsername.set(usernameKey, p);
  }

  return { byUserId, byProfileKey, byUsername };
}

async function supabaseSelectAll(tableName) {
  const rows = [];
  let from = 0;
  let orderClause = "fetched_at.desc";

  while (true) {
    const to = from + PAGE_SIZE - 1;

    let url =
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}` +
      `?select=*` +
      `&order=${encodeURIComponent(orderClause)}`;

    let res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${to}`,
        Prefer: "count=exact"
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");

      const missingFetchedAt =
        res.status === 400 &&
        text.toLowerCase().includes("fetched_at") &&
        text.toLowerCase().includes("does not exist");

      if (missingFetchedAt && orderClause === "fetched_at.desc") {
        orderClause = "rank.asc.nullslast";

        url =
          `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}` +
          `?select=*` +
          `&order=${encodeURIComponent(orderClause)}`;

        res = await fetch(url, {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Range: `${from}-${to}`,
            Prefer: "count=exact"
          }
        });

        if (!res.ok) {
          const retryText = await res.text().catch(() => "");
          throw new Error(`Supabase query failed for ${tableName}: HTTP ${res.status} ${retryText}`);
        }
      } else {
        throw new Error(`Supabase query failed for ${tableName}: HTTP ${res.status} ${text}`);
      }
    }

    const batch = await res.json();
    if (!Array.isArray(batch)) {
      throw new Error(`Supabase response for ${tableName} was not an array.`);
    }

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function normalizePlayerRow(row) {
  return {
    fetched_at: dateOrNull(
      row.fetched_at || row.created_at || row.snapshot_at || row.updated_at || row.inserted_at
    ),
    rank: numberOrNull(row.rank),
    username: stringOrNull(row.username || row.user || row.name),
    total_points: numberOrNull(row.total_points ?? row.points),
    user_id: numberOrNull(row.user_id),
    avatar_url: stringOrNull(row.avatar_url),
    profile_key: stringOrNull(row.profile_key)
  };
}

function groupRowsByTimestamp(rows) {
  const map = new Map();

  for (const row of rows) {
    const ts = row.fetched_at || "__no_timestamp__";
    if (!map.has(ts)) map.set(ts, []);
    map.get(ts).push(row);
  }

  return map;
}

function getLatestSnapshotRows(rows) {
  if (!rows.length) return [];

  const timestamped = rows.filter(row => row.fetched_at);

  if (!timestamped.length) {
    return rows
      .slice()
      .sort((a, b) => {
        const ar = Number(a.rank ?? 999999);
        const br = Number(b.rank ?? 999999);
        if (ar !== br) return ar - br;

        const ap = Number(a.total_points || 0);
        const bp = Number(b.total_points || 0);
        if (ap !== bp) return bp - ap;

        return String(a.username || "").localeCompare(String(b.username || ""));
      });
  }

  const latestMs = Math.max(
    ...timestamped
      .map(row => new Date(row.fetched_at).getTime())
      .filter(ms => !Number.isNaN(ms))
  );

  return timestamped
    .filter(row => new Date(row.fetched_at).getTime() === latestMs)
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));
}

function getNearestSnapshotRows(rows, targetMs, toleranceMin) {
  const grouped = groupRowsByTimestamp(rows);
  let best = null;

  for (const [ts, batch] of grouped.entries()) {
    if (ts === "__no_timestamp__") continue;

    const ms = new Date(ts).getTime();
    if (Number.isNaN(ms)) continue;

    const diff = Math.abs(ms - targetMs);
    if (!best || diff < best.diff) {
      best = { ts, batch, diff };
    }
  }

  if (!best) return [];

  const toleranceMs = toleranceMin * 60 * 1000;
  if (best.diff > toleranceMs) return [];

  return best.batch;
}

function buildPointMap(rows) {
  return new Map(
    rows.map(row => [
      normalizeName(row.username),
      Number(row.total_points || 0)
    ])
  );
}

function getGain(currentRow, allRows, latestMs, hours, toleranceMin) {
  if (!Number.isFinite(latestMs)) return null;

  const targetMs = latestMs - hours * 60 * 60 * 1000;
  const oldRows = getNearestSnapshotRows(allRows, targetMs, toleranceMin);
  const oldMap = buildPointMap(oldRows);
  const oldPoints = oldMap.get(normalizeName(currentRow.username));

  if (oldPoints === undefined) return null;

  return Number(currentRow.total_points || 0) - oldPoints;
}

async function resolveUserIdsByUsername(usernames) {
  const map = new Map();
  const uniqueNames = [...new Set((usernames || []).map(v => String(v || "").trim()).filter(Boolean))];

  for (const batch of chunkArray(uniqueNames, ROBLOX_USERNAME_BATCH_SIZE)) {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "NONG-Leaderboard-Username-Resolver"
      },
      body: JSON.stringify({
        usernames: batch,
        excludeBannedUsers: false
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Roblox username lookup failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    for (const item of data) {
      const requestedName = String(item?.requestedUsername || item?.name || "").trim();
      const resolvedId = Number(item?.id);
      if (requestedName && Number.isFinite(resolvedId)) {
        map.set(normalizeName(requestedName), resolvedId);
      }
    }
  }

  return map;
}

async function fetchRobloxHeadshots(userIds) {
  const map = new Map();
  const uniqueIds = [...new Set((userIds || []).map(v => String(v || "").trim()).filter(Boolean))];

  for (const batch of chunkArray(uniqueIds, ROBLOX_THUMB_BATCH_SIZE)) {
    const url =
      "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
      `?userIds=${encodeURIComponent(batch.join(","))}` +
      "&size=150x150&format=Png&isCircular=false";

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NONG-Leaderboard-Avatar-Enrichment"
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Roblox thumbnail lookup failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    for (const item of data) {
      const id = String(item?.targetId || "").trim();
      const imageUrl = String(item?.imageUrl || "").trim();
      const state = String(item?.state || "").trim();

      if (id && imageUrl && state === "Completed") {
        map.set(id, imageUrl);
      }
    }
  }

  return map;
}

async function downloadAvatarToCache(cacheKey, imageUrl) {
  if (!cacheKey || !imageUrl) return null;

  await ensureDir(AVATAR_DIR);

  const fileName = `${cacheKey}.png`;
  const filePath = path.join(AVATAR_DIR, fileName);
  const publicPath = `${AVATAR_PUBLIC_PATH}/${fileName}`;

  if (await fileExists(filePath)) return publicPath;

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "NONG-Leaderboard-History-Avatar-Cache"
      }
    });

    if (!res.ok) {
      console.warn(`Historical avatar download failed for ${cacheKey}: HTTP ${res.status}`);
      return imageUrl;
    }

    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length) return imageUrl;

    await fs.writeFile(filePath, bytes);
    return publicPath;
  } catch (err) {
    console.warn(`Historical avatar cache error for ${cacheKey}: ${err.message}`);
    return imageUrl;
  }
}

async function cacheAvatarRows(rows) {
  for (const row of rows) {
    const cacheKey = String(row.profile_key || row.user_id || row.username || "").trim();
    if (!cacheKey || !row.avatar_url) continue;
    row.avatar_url = await downloadAvatarToCache(cacheKey, row.avatar_url);
  }
}

async function enrichRowsWithRobloxIdentity(rows, playerMaps) {
  const missingUsernameLookups = rows
    .filter(row => !row.user_id && row.username)
    .map(row => row.username);

  const usernameToUserId = await resolveUserIdsByUsername(missingUsernameLookups);

  for (const row of rows) {
    if (!row.user_id && row.username) {
      const resolvedId = usernameToUserId.get(normalizeName(row.username));
      if (Number.isFinite(resolvedId)) {
        row.user_id = resolvedId;
      }
    }
  }

  const userIdsToThumb = rows
    .map(row => String(row.user_id || "").trim())
    .filter(Boolean);

  const thumbMap = await fetchRobloxHeadshots(userIdsToThumb);

  for (const row of rows) {
    const userId = String(row.user_id || "").trim();
    const usernameKey = normalizeName(row.username);

    let match = null;

    if (userId && playerMaps.byUserId.has(userId)) {
      match = playerMaps.byUserId.get(userId);
    }

    if (!match && row.profile_key && playerMaps.byProfileKey.has(String(row.profile_key))) {
      match = playerMaps.byProfileKey.get(String(row.profile_key));
    }

    if (!match && usernameKey && playerMaps.byUsername.has(usernameKey)) {
      match = playerMaps.byUsername.get(usernameKey);
    }

    row.profile_key = String(match?.profile_key || row.profile_key || row.user_id || row.username || "").trim();
    row.avatar_url = row.avatar_url || match?.avatar_url || (userId ? thumbMap.get(userId) || null : null);
  }

  await cacheAvatarRows(rows);
  return rows;
}

async function calculateBattleRows(snapshotRows, playerMaps) {
  const latestRows = getLatestSnapshotRows(snapshotRows);

  if (!latestRows.length) {
    return {
      snapshot_at: null,
      rows: []
    };
  }

  const latestMs = Math.max(
    ...latestRows
      .map(row => row.fetched_at ? new Date(row.fetched_at).getTime() : NaN)
      .filter(ms => !Number.isNaN(ms))
  );

  const hasHistoricalTimestamps = Number.isFinite(latestMs);
  await enrichRowsWithRobloxIdentity(latestRows, playerMaps);

  const rows = latestRows.map(row => ({
    rank: numberOrNull(row.rank),
    username: row.username,
    total_points: numberOrNull(row.total_points),
    user_id: numberOrNull(row.user_id),
    profile_key: row.profile_key || row.user_id || row.username,
    avatar_url: row.avatar_url || null,
    fetched_at: row.fetched_at,
    gain_5m: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 5 / 60, 4) : null,
    gain_1h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 1, 15) : null,
    gain_12h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 12, 45) : null,
    gain_24h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 24, 90) : null
  })).sort((a, b) => {
    const ar = Number(a.rank ?? 999999);
    const br = Number(b.rank ?? 999999);
    if (ar !== br) return ar - br;

    return Number(b.total_points || 0) - Number(a.total_points || 0);
  });

  return {
    snapshot_at: latestRows[0]?.fetched_at || null,
    rows
  };
}

async function main() {
  const manualBattles = await readJsonArray(MANUAL_BATTLES_FILE);
  const playerIndex = await readJsonArray(PLAYER_INDEX_FILE);
  const playerMaps = buildPlayerMaps(playerIndex);

  const declared = manualBattles
    .filter(battle => battle.battle && battle.display_name && battle.nong_results_table)
    .map(battle => ({
      battle: String(battle.battle),
      display_name: String(battle.display_name),
      source_table: String(battle.nong_results_table),
      placement: battle.placement ?? null,
      first_snapshot: battle.first_snapshot ?? null,
      last_snapshot: battle.last_snapshot ?? null,
      update_number: battle.update_number ?? null,
      update_url: battle.update_url ?? null,
      nong_results_table: String(battle.nong_results_table)
    }));

  const deduped = new Map();
  for (const item of declared) deduped.set(normalizeKey(item.battle), item);

  const output = [];

  for (const item of deduped.values()) {
    console.log(`Reading historical NONG table: ${item.source_table} -> ${item.battle}`);

    const rawRows = await supabaseSelectAll(item.source_table);
    const normalizedRows = rawRows
      .map(normalizePlayerRow)
      .filter(row => row.username && row.total_points !== null);

    const calculated = await calculateBattleRows(normalizedRows, playerMaps);

    output.push({
      battle: item.battle,
      display_name: item.display_name,
      source_table: item.source_table,
      nong_results_table: item.nong_results_table,
      placement: item.placement,
      first_snapshot: item.first_snapshot,
      last_snapshot: item.last_snapshot,
      update_number: item.update_number,
      update_url: item.update_url,
      generated_at: new Date().toISOString(),
      snapshot_at: calculated.snapshot_at,
      rows: calculated.rows
    });

    console.log(`  latest rows: ${calculated.rows.length}`);
  }

  output.sort((a, b) => {
    const au = Number(a.update_number);
    const bu = Number(b.update_number);
    if (Number.isFinite(au) && Number.isFinite(bu) && au !== bu) return bu - au;
    if (Number.isFinite(au) && !Number.isFinite(bu)) return -1;
    if (!Number.isFinite(au) && Number.isFinite(bu)) return 1;

    const ad = new Date(a.last_snapshot || a.snapshot_at || 0).getTime() || 0;
    const bd = new Date(b.last_snapshot || b.snapshot_at || 0).getTime() || 0;
    return bd - ad;
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`Historical NONG battles written: ${output.length}`);
  console.log(`Updated ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
