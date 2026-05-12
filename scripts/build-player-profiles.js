const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "AngelBattle2026";
const CURRENT_BATTLE_DISPLAY_NAME = process.env.CURRENT_BATTLE_DISPLAY_NAME || "Angel Battle 2026";
const CURRENT_BATTLE_END_ISO = process.env.CURRENT_BATTLE_END_ISO || null;

const CURRENT_NONG_TABLE =
  process.env.CURRENT_NONG_TABLE ||
  process.env.CURRENT_BATTLE_NONG_TABLE ||
  defaultNongTableFromBattleName(CURRENT_BATTLE_NAME);

const OUT_DIR = path.join(process.cwd(), "Data");
const PLAYERS_DIR = path.join(OUT_DIR, "players");
const MANUAL_BATTLES_FILE = path.join(OUT_DIR, "manual-battles.json");

const AVATAR_DIR = path.join(process.cwd(), "assets", "avatars");
const AVATAR_PUBLIC_PATH = "assets/avatars";

const PAGE_SIZE = 1000;
const ROBLOX_USERNAME_BATCH_SIZE = 100;
const ROBLOX_THUMB_BATCH_SIZE = 100;

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_KEY) throw new Error("Missing SUPABASE_SERVICE_KEY");

function defaultNongTableFromBattleName(battleName) {
  const clean = String(battleName || "")
    .replace(/Battle$/i, "")
    .replace(/Archive$/i, "")
    .replace(/[^a-zA-Z0-9_]/g, "");

  return `${clean}NONG`;
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

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

function slugFromUsername(username) {
  return String(username || "unknown")
    .replace(/[^0-9a-zA-Z_-]/g, "_")
    .slice(0, 120);
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

function safeIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function getCaseInsensitiveValue(row, candidates) {
  const keys = Object.keys(row || {});
  const lowerMap = new Map(keys.map(k => [String(k).toLowerCase(), k]));

  for (const candidate of candidates) {
    const actual = lowerMap.get(String(candidate).toLowerCase());
    if (actual !== undefined) {
      const value = row[actual];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
  }

  return null;
}

function getCaseInsensitiveColumnName(columns, candidates) {
  const lowerMap = new Map(columns.map(c => [String(c).toLowerCase(), c]));
  for (const candidate of candidates) {
    const actual = lowerMap.get(String(candidate).toLowerCase());
    if (actual !== undefined) return actual;
  }
  return null;
}

function cleanManualBattle(record) {
  return {
    battle: stringOrNull(record.battle || record.display_name),
    display_name: stringOrNull(record.display_name || record.battle),
    api_battle_key: stringOrNull(record.api_battle_key),
    nong_results_table: stringOrNull(record.nong_results_table || record.player_results_table),
    clan_results_table: stringOrNull(record.clan_results_table),
    first_snapshot: safeIso(record.first_snapshot),
    last_snapshot: safeIso(record.last_snapshot),
    total_snapshots: numberOrNull(record.total_snapshots),
    total_rows: numberOrNull(record.total_rows),
    unique_players: numberOrNull(record.unique_players),
    placement: record.placement ?? null,
    update_number: record.update_number ?? null,
    update_url: stringOrNull(record.update_url)
  };
}

function normalizeTableRow(row, battleConfig, tableName) {
  const fallbackTimestamp = battleConfig.last_snapshot || battleConfig.first_snapshot || null;

  const timestamp =
    getCaseInsensitiveValue(row, [
      "fetched_at",
      "created_at",
      "snapshot_at",
      "createdAt",
      "snapshotAt",
      "timestamp",
      "time",
      "date"
    ]) || fallbackTimestamp;

  const username = getCaseInsensitiveValue(row, [
    "username",
    "user_name",
    "member",
    "member_name",
    "player",
    "player_name",
    "name",
    "roblox_username"
  ]);

  const points = getCaseInsensitiveValue(row, [
    "total_points",
    "points",
    "score",
    "total",
    "value"
  ]);

  const userId = getCaseInsensitiveValue(row, [
    "user_id",
    "userid",
    "userId",
    "UserID",
    "roblox_user_id",
    "roblox_id",
    "robloxId"
  ]);

  const rank = getCaseInsensitiveValue(row, [
    "rank",
    "placement",
    "position"
  ]);

  const avatarUrl = getCaseInsensitiveValue(row, [
    "avatar_url",
    "avatarUrl"
  ]);

  const profileKey = getCaseInsensitiveValue(row, [
    "profile_key",
    "profileKey"
  ]);

  return {
    fetched_at: safeIso(timestamp) || new Date(0).toISOString(),
    rank: numberOrNull(rank),
    username: stringOrNull(username),
    total_points: numberOrNull(points) ?? 0,
    user_id: numberOrNull(userId),
    avatar_url: stringOrNull(avatarUrl),
    profile_key: stringOrNull(profileKey),
    _source_table: tableName,
    _battle: battleConfig.battle
  };
}

async function probeTableColumns(tableName) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase probe failed for ${tableName} (${res.status}): ${text}`);
  }

  const rows = await res.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { columns: [], sample: null };
  }

  return {
    columns: Object.keys(rows[0]),
    sample: rows[0]
  };
}

async function buildBattleConfigs() {
  const manualRaw = await readJsonArray(MANUAL_BATTLES_FILE);
  const manual = manualRaw.map(cleanManualBattle);

  const tableBacked = manual
    .filter(b => b.battle && b.display_name && b.nong_results_table)
    .map(b => ({
      ...b,
      table: b.nong_results_table
    }));

  const hasCurrent = tableBacked.some(b =>
    normalizeKey(b.battle) === normalizeKey(CURRENT_BATTLE_NAME) ||
    normalizeKey(b.api_battle_key) === normalizeKey(CURRENT_BATTLE_NAME) ||
    normalizeKey(b.table) === normalizeKey(CURRENT_NONG_TABLE)
  );

  if (!hasCurrent) {
    tableBacked.push({
      battle: CURRENT_BATTLE_NAME,
      display_name: CURRENT_BATTLE_DISPLAY_NAME,
      api_battle_key: CURRENT_BATTLE_NAME,
      nong_results_table: CURRENT_NONG_TABLE,
      clan_results_table: null,
      first_snapshot: null,
      last_snapshot: null,
      total_snapshots: null,
      total_rows: null,
      unique_players: null,
      placement: null,
      update_number: null,
      update_url: null,
      table: CURRENT_NONG_TABLE
    });
  }

  const deduped = new Map();
  for (const battle of tableBacked) {
    deduped.set(normalizeKey(battle.battle), battle);
  }

  const configs = [...deduped.values()];

  configs.sort((a, b) => {
    const aCurrent =
      normalizeKey(a.api_battle_key) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(a.battle) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(a.table) === normalizeKey(CURRENT_NONG_TABLE);

    const bCurrent =
      normalizeKey(b.api_battle_key) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(b.battle) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(b.table) === normalizeKey(CURRENT_NONG_TABLE);

    if (aCurrent && !bCurrent) return 1;
    if (!aCurrent && bCurrent) return -1;

    return String(a.display_name || a.battle).localeCompare(String(b.display_name || b.battle));
  });

  const currentProfileBattle =
    configs.find(b =>
      normalizeKey(b.api_battle_key) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(b.battle) === normalizeKey(CURRENT_BATTLE_NAME) ||
      normalizeKey(b.table) === normalizeKey(CURRENT_NONG_TABLE)
    ) || {
      battle: CURRENT_BATTLE_NAME,
      display_name: CURRENT_BATTLE_DISPLAY_NAME,
      api_battle_key: CURRENT_BATTLE_NAME,
      table: CURRENT_NONG_TABLE,
      nong_results_table: CURRENT_NONG_TABLE,
      clan_results_table: null
    };

  return { configs, currentProfileBattle };
}

async function fetchAllRows(tableName, battleConfig) {
  const probe = await probeTableColumns(tableName);
  const columns = probe.columns;

  const timestampColumn = getCaseInsensitiveColumnName(columns, [
    "fetched_at",
    "created_at",
    "snapshot_at",
    "createdAt",
    "snapshotAt",
    "timestamp",
    "time",
    "date"
  ]);

  const idColumn = getCaseInsensitiveColumnName(columns, ["id"]);
  const rankColumn = getCaseInsensitiveColumnName(columns, ["rank"]);

  const orderColumn = timestampColumn || idColumn || rankColumn || null;

  const rawRows = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}`);
    url.searchParams.set("select", "*");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    if (orderColumn) {
      url.searchParams.set("order", `${orderColumn}.asc`);
    }

    const res = await fetch(url.toString(), {
      headers: sbHeaders({ Prefer: "return=representation" })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase fetch failed for ${tableName} (${res.status}): ${text}`);
    }

    const rows = await res.json();
    rawRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const normalizedRows = rawRows
    .map(row => normalizeTableRow(row, battleConfig, tableName))
    .filter(row => row.username);

  normalizedRows.sort((a, b) => {
    const at = new Date(a.fetched_at).getTime();
    const bt = new Date(b.fetched_at).getTime();

    if (at !== bt) return at - bt;

    const ar = Number(a.rank || 999999);
    const br = Number(b.rank || 999999);
    if (ar !== br) return ar - br;

    const bp = Number(b.total_points || 0);
    const ap = Number(a.total_points || 0);
    if (bp !== ap) return bp - ap;

    return String(a.username || "").localeCompare(String(b.username || ""));
  });

  return normalizedRows;
}

async function fetchCurrentLeaderboard() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/leaderboard_snapshots`);
  url.searchParams.set("select", "fetched_at,rank,username,total_points,user_id");
  url.searchParams.set("order", "fetched_at.desc");
  url.searchParams.set("limit", "5000");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase fetch failed for leaderboard_snapshots (${res.status}): ${text}`);
  }

  const rows = await res.json();

  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }

  const latestTimestamp = rows[0].fetched_at;

  return rows
    .filter(row => row.fetched_at === latestTimestamp)
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));
}

async function resolveUserIdsByUsername(usernames) {
  const map = new Map();
  const unique = [...new Set(usernames.map(u => String(u || "").trim()).filter(Boolean))];

  for (const batch of chunkArray(unique, ROBLOX_USERNAME_BATCH_SIZE)) {
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
      const requestedUsername = String(item?.requestedUsername || item?.name || "").trim();
      const userId = Number(item?.id);

      if (requestedUsername && Number.isFinite(userId)) {
        map.set(normalizeName(requestedUsername), userId);
      }
    }

    await sleep(200);
  }

  return map;
}

async function fetchAvatarHeadshots(userIds) {
  const result = new Map();
  const ids = [...new Set(userIds.filter(Boolean).map(Number))];

  for (const batch of chunkArray(ids, ROBLOX_THUMB_BATCH_SIZE)) {
    const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    url.searchParams.set("userIds", batch.join(","));
    url.searchParams.set("size", "150x150");
    url.searchParams.set("format", "Png");
    url.searchParams.set("isCircular", "false");

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "NONG-Leaderboard-Profiles"
        }
      });

      if (!res.ok) {
        await sleep(200);
        continue;
      }

      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];

      for (const item of data) {
        const targetId = Number(item?.targetId);
        const imageUrl = String(item?.imageUrl || "").trim();
        const state = String(item?.state || "").trim();

        if (Number.isFinite(targetId) && imageUrl && state === "Completed") {
          result.set(targetId, imageUrl);
        }
      }
    } catch {
    }

    await sleep(200);
  }

  return result;
}

async function downloadAvatarToCache(userId, imageUrl) {
  if (!userId || !imageUrl) return null;

  await ensureDir(AVATAR_DIR);

  const fileName = `${userId}.png`;
  const filePath = path.join(AVATAR_DIR, fileName);
  const publicPath = `${AVATAR_PUBLIC_PATH}/${fileName}`;

  if (await fileExists(filePath)) {
    return publicPath;
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "NONG-Leaderboard-Avatar-Cache" }
    });

    if (!res.ok) return imageUrl;

    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length) return imageUrl;

    await fs.writeFile(filePath, bytes);
    return publicPath;
  } catch {
    return imageUrl;
  }
}

async function cacheAvatarMap(avatarMap) {
  await ensureDir(AVATAR_DIR);

  const cached = new Map();

  for (const [userId, imageUrl] of avatarMap.entries()) {
    const localPath = await downloadAvatarToCache(userId, imageUrl);
    cached.set(Number(userId), localPath || imageUrl);
    await sleep(50);
  }

  return cached;
}

function groupRowsByTimestamp(rows) {
  const map = new Map();

  for (const row of rows) {
    const ts = row.fetched_at;
    if (!map.has(ts)) map.set(ts, []);
    map.get(ts).push(row);
  }

  return map;
}

function getNearestSnapshotBatch(rows, targetMs, toleranceMin) {
  const byTimestamp = groupRowsByTimestamp(rows);
  let best = null;

  for (const [ts, batch] of byTimestamp.entries()) {
    const rowTime = new Date(ts).getTime();
    if (Number.isNaN(rowTime)) continue;

    const diff = Math.abs(rowTime - targetMs);

    if (!best || diff < best.diff) {
      best = { ts, batch, diff };
    }
  }

  if (!best) return [];

  const toleranceMs = toleranceMin * 60 * 1000;
  return best.diff <= toleranceMs ? best.batch : [];
}

function buildPointMap(rows) {
  return new Map(
    rows.map(row => [
      row._canonical_identity,
      Number(row.total_points || 0)
    ])
  );
}

function addGainFieldsToCurrent(currentRows, archiveRows) {
  if (!currentRows.length) return [];

  const currentTime = new Date(currentRows[0].fetched_at).getTime();

  if (Number.isNaN(currentTime)) {
    return currentRows.map(row => ({
      ...row,
      gain_5m: null,
      gain_1h: null,
      gain_12h: null,
      gain_24h: null
    }));
  }

  const gainWindows = [
    { key: "gain_5m", minutes: 5, toleranceMin: 4 },
    { key: "gain_1h", minutes: 60, toleranceMin: 10 },
    { key: "gain_12h", minutes: 720, toleranceMin: 25 },
    { key: "gain_24h", minutes: 1440, toleranceMin: 45 }
  ];

  const oldPointMaps = {};

  for (const win of gainWindows) {
    const targetMs = currentTime - win.minutes * 60 * 1000;
    const oldBatch = getNearestSnapshotBatch(archiveRows, targetMs, win.toleranceMin);
    oldPointMaps[win.key] = buildPointMap(oldBatch);
  }

  return currentRows.map(row => {
    const key = row._canonical_identity;
    const out = { ...row };

    for (const win of gainWindows) {
      const oldPoints = oldPointMaps[win.key].get(key);
      out[win.key] =
        oldPoints === undefined
          ? null
          : Number(row.total_points || 0) - oldPoints;
    }

    return out;
  });
}

function canonicalProfileKey(record) {
  if (record.user_id !== null && record.user_id !== undefined && record.user_id !== "") {
    return String(record.user_id);
  }

  return slugFromUsername(record.username);
}

function addAlias(aliasSet, value) {
  if (value === null || value === undefined || value === "") return;
  aliasSet.add(String(value));
}

function buildCanonicalPlayers(allRows) {
  const usernameToCanonical = new Map();
  const userIdToCanonical = new Map();
  const groups = new Map();

  for (const row of allRows) {
    const usernameNorm = normalizeName(row.username);
    const userIdStr =
      row.user_id !== null && row.user_id !== undefined && row.user_id !== ""
        ? String(row.user_id)
        : null;

    let canonical = null;

    if (userIdStr && userIdToCanonical.has(userIdStr)) {
      canonical = userIdToCanonical.get(userIdStr);
    } else if (usernameNorm && usernameToCanonical.has(usernameNorm)) {
      canonical = usernameToCanonical.get(usernameNorm);
    }

    if (!canonical) {
      canonical = canonicalProfileKey(row);
    }

    if (!groups.has(canonical)) {
      groups.set(canonical, {
        canonical_key: canonical,
        aliases: new Set([canonical]),
        rows: [],
        usernames: new Set(),
        latest_username: row.username || null,
        user_id: row.user_id ?? null,
        avatar_url: row.avatar_url || null
      });
    }

    const group = groups.get(canonical);
    group.rows.push(row);

    if (row.username) {
      group.usernames.add(row.username);
      group.latest_username = row.username;
      addAlias(group.aliases, slugFromUsername(row.username));
      if (usernameNorm) usernameToCanonical.set(usernameNorm, canonical);
    }

    if (userIdStr) {
      group.user_id = Number(userIdStr);
      addAlias(group.aliases, userIdStr);
      userIdToCanonical.set(userIdStr, canonical);
    }

    if (!group.avatar_url && row.avatar_url) {
      group.avatar_url = row.avatar_url;
    }

    if (!/^\d+$/.test(group.canonical_key) && userIdStr) {
      const oldKey = group.canonical_key;
      const newKey = userIdStr;

      if (oldKey !== newKey) {
        group.canonical_key = newKey;
        group.aliases.add(oldKey);
        groups.delete(oldKey);
        groups.set(newKey, group);

        for (const [k, v] of usernameToCanonical.entries()) {
          if (v === oldKey) usernameToCanonical.set(k, newKey);
        }

        for (const [k, v] of userIdToCanonical.entries()) {
          if (v === oldKey) userIdToCanonical.set(k, newKey);
        }

        canonical = newKey;
      }
    }
  }

  return [...groups.values()];
}

function buildBattleSummary(battleConfig, rows) {
  if (!rows.length) {
    return {
      battle: battleConfig.battle,
      display_name: battleConfig.display_name,
      first_snapshot: battleConfig.first_snapshot ?? null,
      last_snapshot: battleConfig.last_snapshot ?? null,
      total_snapshots: battleConfig.total_snapshots ?? 0,
      total_rows: battleConfig.total_rows ?? 0,
      unique_players: battleConfig.unique_players ?? 0,
      placement: battleConfig.placement ?? null,
      update_number: battleConfig.update_number ?? null,
      update_url: battleConfig.update_url ?? null,
      api_battle_key: battleConfig.api_battle_key ?? null,
      nong_results_table: battleConfig.nong_results_table ?? battleConfig.table ?? null,
      clan_results_table: battleConfig.clan_results_table ?? null
    };
  }

  const snapshotTimes = new Set(rows.map(r => r.fetched_at));
  const playerKeys = new Set(rows.map(r => r._canonical_identity));

  return {
    battle: battleConfig.battle,
    display_name: battleConfig.display_name,
    first_snapshot: safeIso(rows[0].fetched_at),
    last_snapshot: safeIso(rows[rows.length - 1].fetched_at),
    total_snapshots: snapshotTimes.size,
    total_rows: rows.length,
    unique_players: playerKeys.size,
    placement: battleConfig.placement ?? null,
    update_number: battleConfig.update_number ?? null,
    update_url: battleConfig.update_url ?? null,
    api_battle_key: battleConfig.api_battle_key ?? null,
    nong_results_table: battleConfig.nong_results_table ?? battleConfig.table ?? null,
    clan_results_table: battleConfig.clan_results_table ?? null
  };
}

function summarizePlayerBattle(battleConfig, allBattleRows, playerRows) {
  const sorted = [...playerRows].sort((a, b) => {
    const at = new Date(a.fetched_at).getTime();
    const bt = new Date(b.fetched_at).getTime();
    if (at !== bt) return at - bt;
    return Number(a.rank || 0) - Number(b.rank || 0);
  });

  const battleStart = allBattleRows.length ? safeIso(allBattleRows[0].fetched_at) : null;
  const battleEnd = allBattleRows.length ? safeIso(allBattleRows[allBattleRows.length - 1].fetched_at) : null;

  const nonZeroRows = sorted.filter(row => Number(row.total_points || 0) > 0);
  const firstActive = nonZeroRows[0] || sorted[0];

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const ranks = sorted.map(r => numberOrNull(r.rank)).filter(n => n !== null);
  const points = sorted.map(r => numberOrNull(r.total_points)).filter(n => n !== null);

  const startingPoints = numberOrNull(first.total_points);
  const endingPoints = numberOrNull(last.total_points);

  return {
    battle: battleConfig.battle,
    display_name: battleConfig.display_name,
    battle_first_snapshot: battleStart,
    battle_last_snapshot: battleEnd,
    first_seen: safeIso(first.fetched_at),
    first_active_date: firstActive ? safeIso(firstActive.fetched_at) : null,
    last_seen: safeIso(last.fetched_at),
    starting_rank: numberOrNull(first.rank),
    last_rank: numberOrNull(last.rank),
    end_rank: numberOrNull(last.rank),
    best_rank: ranks.length ? Math.min(...ranks) : null,
    worst_rank: ranks.length ? Math.max(...ranks) : null,
    starting_points: startingPoints,
    ending_points: endingPoints,
    max_points: points.length ? Math.max(...points) : null,
    gained_points:
      startingPoints !== null && endingPoints !== null
        ? endingPoints - startingPoints
        : null,
    snapshot_count: sorted.length,
    present_at_final_snapshot: true,
    note: null,
    series: sorted.map(row => ({
      t: safeIso(row.fetched_at),
      rank: numberOrNull(row.rank),
      points: numberOrNull(row.total_points)
    }))
  };
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(PLAYERS_DIR);

  const { configs, currentProfileBattle } = await buildBattleConfigs();

  const battleRowsMap = new Map();
  const battleSummaries = [];

  for (const battleConfig of configs) {
    const rows = await fetchAllRows(battleConfig.table, battleConfig);
    battleRowsMap.set(normalizeKey(battleConfig.battle), rows);
    battleSummaries.push(buildBattleSummary(battleConfig, rows));
  }

  const allArchiveRows = configs.flatMap(cfg => battleRowsMap.get(normalizeKey(cfg.battle)) || []);

  const missingUsernames = allArchiveRows
    .filter(row => !row.user_id && row.username)
    .map(row => row.username);

  const usernameToUserId = await resolveUserIdsByUsername(missingUsernames);

  for (const row of allArchiveRows) {
    if (!row.user_id && row.username) {
      const resolved = usernameToUserId.get(normalizeName(row.username));
      if (Number.isFinite(resolved)) {
        row.user_id = resolved;
      }
    }
  }

  const avatarUserIds = [...new Set(allArchiveRows.map(r => r.user_id).filter(Boolean))];
  const avatarUrlMap = await fetchAvatarHeadshots(avatarUserIds);
  const cachedAvatarMap = await cacheAvatarMap(avatarUrlMap);

  for (const row of allArchiveRows) {
    if (!row.avatar_url && row.user_id) {
      row.avatar_url = cachedAvatarMap.get(Number(row.user_id)) || null;
    }
  }

  const canonicalPlayers = buildCanonicalPlayers(allArchiveRows);

  const currentRowsRaw = await fetchCurrentLeaderboard();
  const currentRowsCanonical = currentRowsRaw.map(row => {
    const usernameNorm = normalizeName(row.username);
    let canonical = null;

    if (row.user_id !== null && row.user_id !== undefined && row.user_id !== "") {
      const match = canonicalPlayers.find(p => String(p.user_id || "") === String(row.user_id));
      if (match) canonical = match.canonical_key;
    }

    if (!canonical && usernameNorm) {
      const match = canonicalPlayers.find(p =>
        [...p.usernames].some(name => normalizeName(name) === usernameNorm)
      );
      if (match) canonical = match.canonical_key;
    }

    const avatarUrl =
      row.user_id ? cachedAvatarMap.get(Number(row.user_id)) || null : null;

    return {
      fetched_at: safeIso(row.fetched_at),
      rank: numberOrNull(row.rank),
      username: stringOrNull(row.username),
      total_points: numberOrNull(row.total_points),
      user_id: numberOrNull(row.user_id),
      avatar_url: avatarUrl,
      profile_key: canonical || canonicalProfileKey(row),
      _canonical_identity: canonical || canonicalProfileKey(row)
    };
  });

  const currentRowsWithGains = addGainFieldsToCurrent(currentRowsCanonical, allArchiveRows);

  const playerIndex = [];
  const playersJson = [];

  for (const group of canonicalPlayers) {
    const rows = group.rows.slice().sort((a, b) => {
      const at = new Date(a.fetched_at).getTime();
      const bt = new Date(b.fetched_at).getTime();
      if (at !== bt) return at - bt;
      return Number(a.rank || 0) - Number(b.rank || 0);
    });

    const latest = rows[rows.length - 1];
    const username = latest?.username || group.latest_username || "Unknown";
    const userId = group.user_id || null;
    const profileKey = group.canonical_key;

    const avatarUrl =
      group.avatar_url ||
      (userId ? cachedAvatarMap.get(Number(userId)) : null) ||
      null;

    const byBattle = new Map();

    for (const battleConfig of configs) {
      const battleKey = normalizeKey(battleConfig.battle);
      const allBattleRows = battleRowsMap.get(battleKey) || [];

      const playerRows = allBattleRows.filter(row => {
        if (userId && row.user_id && Number(row.user_id) === Number(userId)) return true;
        return normalizeName(row.username) === normalizeName(username);
      });

      if (!playerRows.length) continue;

      byBattle.set(
        battleKey,
        summarizePlayerBattle(battleConfig, allBattleRows, playerRows)
      );
    }

    const battles = [...byBattle.values()].sort((a, b) => {
      const at = new Date(a.battle_last_snapshot || a.last_seen || 0).getTime();
      const bt = new Date(b.battle_last_snapshot || b.last_seen || 0).getTime();
      return bt - at;
    });

    const latestBattle = battles[0] || null;

    const profile = {
      profile_key: profileKey,
      aliases: [...group.aliases].sort(),
      username,
      user_id: userId,
      avatar_url: avatarUrl,
      profile_url: userId ? `https://www.roblox.com/users/${userId}/profile` : null,
      total_battles: battles.length,
      latest_rank: latestBattle?.end_rank ?? latestBattle?.last_rank ?? null,
      latest_points: latestBattle?.ending_points ?? null,
      latest_seen: latestBattle?.last_seen ?? null,
      battles
    };

    const canonicalPath = path.join(PLAYERS_DIR, `${profileKey}.json`);
    await fs.writeFile(canonicalPath, JSON.stringify(profile, null, 2) + "\n", "utf8");

    for (const alias of group.aliases) {
      if (!alias || alias === profileKey) continue;
      const aliasPath = path.join(PLAYERS_DIR, `${alias}.json`);
      await fs.writeFile(aliasPath, JSON.stringify(profile, null, 2) + "\n", "utf8");
    }

    playerIndex.push({
      profile_key: profileKey,
      username,
      user_id: userId,
      avatar_url: avatarUrl
    });

    playersJson.push({
      profile_key: profileKey,
      username,
      user_id: userId,
      avatar_url: avatarUrl,
      total_battles: battles.length,
      latest_rank: profile.latest_rank,
      latest_points: profile.latest_points,
      latest_seen: profile.latest_seen
    });
  }

  const currentData = {
    generated_at: new Date().toISOString(),
    battle: currentProfileBattle.battle,
    display_name: currentProfileBattle.display_name,
    battle_end_iso: CURRENT_BATTLE_END_ISO,
    clan_name: CLAN_NAME,
    rows: currentRowsWithGains.map(row => ({
      fetched_at: row.fetched_at,
      rank: row.rank,
      username: row.username,
      total_points: row.total_points,
      user_id: row.user_id,
      profile_key: row.profile_key,
      avatar_url: row.avatar_url,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h
    }))
  };

  await fs.writeFile(path.join(OUT_DIR, "current.json"), JSON.stringify(currentData, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(OUT_DIR, "players.json"), JSON.stringify(playersJson, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(OUT_DIR, "player-index.json"), JSON.stringify(playerIndex, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(OUT_DIR, "battles.json"), JSON.stringify(battleSummaries, null, 2) + "\n", "utf8");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
