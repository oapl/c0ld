// scripts/build-player-profiles.js
// Builds static JSON data for GitHub Pages from Supabase.
//
// Outputs:
//   Data/current.json
//   Data/players.json
//   Data/battles.json
//   Data/players/<user_id>.json
//   assets/avatars/<user_id>.png
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   CURRENT_BATTLE_END_ISO
//
// Optional env:
//   CLAN_NAME = NONG
//   CURRENT_BATTLE_NAME = StarryBattle
//   CURRENT_BATTLE_DISPLAY_NAME = Starry Battle
//   CURRENT_NONG_TABLE = StarryNONG
//
// Important:
//   CURRENT_BATTLE_NAME stays as the Big Games/API key, such as StarryBattle.
//   CURRENT_NONG_TABLE is the Supabase player/member history table, such as StarryNONG.
//
// Data/manual-battles.json supports:
//   battle              = internal/API/profile key
//   display_name        = pretty website label
//   nong_results_table  = exact Supabase NONG/player table
//   clan_results_table  = exact Supabase top-clans table

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "StarryBattle";
const CURRENT_BATTLE_DISPLAY_NAME = process.env.CURRENT_BATTLE_DISPLAY_NAME || "Starry Battle";
const CURRENT_BATTLE_END_ISO = process.env.CURRENT_BATTLE_END_ISO;

function defaultNongTableFromBattleName(battleName) {
  const clean = String(battleName || "")
    .replace(/Battle$/i, "")
    .replace(/Archive$/i, "")
    .replace(/[^a-zA-Z0-9_]/g, "");

  return `${clean}NONG`;
}

const CURRENT_NONG_TABLE =
  process.env.CURRENT_NONG_TABLE ||
  process.env.CURRENT_BATTLE_NONG_TABLE ||
  defaultNongTableFromBattleName(CURRENT_BATTLE_NAME);

if (!SUPABASE_URL) {
  throw new Error("Missing required env var: SUPABASE_URL");
}

if (!SUPABASE_KEY) {
  throw new Error("Missing required env var: SUPABASE_SERVICE_KEY");
}

if (!CURRENT_BATTLE_END_ISO) {
  throw new Error("Missing required env var: CURRENT_BATTLE_END_ISO");
}

const OUT_DIR = path.join(process.cwd(), "Data");
const PLAYERS_DIR = path.join(OUT_DIR, "players");
const MANUAL_BATTLES_FILE = path.join(OUT_DIR, "manual-battles.json");

const AVATAR_DIR = path.join(process.cwd(), "assets", "avatars");
const AVATAR_PUBLIC_PATH = "assets/avatars";

const PAGE_SIZE = 1000;

const CURRENT_BATTLE = {
  name: CURRENT_BATTLE_NAME,
  displayName: CURRENT_BATTLE_DISPLAY_NAME,
  archiveTable: CURRENT_NONG_TABLE
};

let BATTLES = [];

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    if (!Array.isArray(parsed)) {
      throw new Error(`${filePath} must contain a JSON array.`);
    }

    return parsed;
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeIso(value) {
  if (!value) return null;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function fmtSlug(value) {
  return String(value)
    .replace(/[^0-9a-zA-Z_-]/g, "_")
    .slice(0, 80);
}

function rowIdentity(row) {
  if (row.user_id) return `id:${row.user_id}`;
  return `name:${String(row.username || "").toLowerCase()}`;
}

function getNongResultsTable(record) {
  return (
    record.nong_results_table ||
    record.player_results_table ||
    record.clan_results_battle ||
    null
  );
}

async function buildBattleConfigs() {
  const manualBattles = await readJsonArray(MANUAL_BATTLES_FILE);
  const map = new Map();

  for (const record of manualBattles) {
    const battleName = record.battle || record.display_name;
    const displayName = record.display_name || record.battle;
    const tableName = getNongResultsTable(record);

    if (!battleName || !displayName || !tableName) {
      continue;
    }

    map.set(normalizeKey(battleName), {
      name: String(battleName),
      displayName: String(displayName),
      table: String(tableName)
    });
  }

  map.set(normalizeKey(CURRENT_BATTLE_NAME), {
    name: CURRENT_BATTLE_NAME,
    displayName: CURRENT_BATTLE_DISPLAY_NAME,
    table: CURRENT_NONG_TABLE
  });

  const configs = [...map.values()];

  configs.sort((a, b) => {
    const aIsCurrent = normalizeKey(a.name) === normalizeKey(CURRENT_BATTLE_NAME);
    const bIsCurrent = normalizeKey(b.name) === normalizeKey(CURRENT_BATTLE_NAME);

    if (aIsCurrent && !bIsCurrent) return 1;
    if (!aIsCurrent && bIsCurrent) return -1;

    return String(a.displayName || a.name).localeCompare(String(b.displayName || b.name));
  });

  console.log("Battle profile table configuration:");
  for (const config of configs) {
    console.log(`  ${config.name} (${config.displayName}) -> ${config.table}`);
  }

  return configs;
}

async function fetchAllRows(table) {
  const all = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`);
    url.searchParams.set("select", "fetched_at,rank,username,total_points,user_id");
    url.searchParams.set("order", "fetched_at.asc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url.toString(), {
      headers: sbHeaders({ Prefer: "return=representation" })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase fetch failed for ${table} (${res.status}): ${text}`);
    }

    const rows = await res.json();
    all.push(...rows);

    console.log(`${table}: fetched ${all.length} rows...`);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
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

  if (!rows.length) {
    return [];
  }

  const latestTimestamp = rows[0].fetched_at;

  return rows
    .filter(row => row.fetched_at === latestTimestamp)
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));
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
      best = {
        ts,
        batch,
        diff
      };
    }
  }

  if (!best) return [];

  const toleranceMs = toleranceMin * 60 * 1000;

  if (best.diff > toleranceMs) {
    return [];
  }

  return best.batch;
}

function buildPointMap(rows) {
  return new Map(
    rows.map(row => [
      rowIdentity(row),
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

    console.log(`${win.key}: found ${oldBatch.length} rows near ${win.minutes} minutes ago`);
  }

  return currentRows.map(row => {
    const key = rowIdentity(row);
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

async function fetchAvatarHeadshots(userIds) {
  const result = new Map();
  const ids = [...new Set(userIds.filter(Boolean).map(Number))];

  console.log(`Requesting Roblox avatar thumbnail URLs for ${ids.length} users...`);

  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);

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

      const text = await res.text();

      if (!res.ok) {
        console.warn(`Avatar thumbnail URL batch failed (${res.status}): ${text}`);
        continue;
      }

      const json = JSON.parse(text);

      for (const item of json.data || []) {
        if (item.targetId && item.imageUrl) {
          result.set(Number(item.targetId), item.imageUrl);
        }
      }
    } catch (err) {
      console.warn(`Avatar thumbnail URL batch error: ${err.message}`);
    }

    await sleep(300);
  }

  console.log(`Received ${result.size} Roblox avatar thumbnail URLs.`);
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
      headers: {
        "User-Agent": "NONG-Leaderboard-Avatar-Cache"
      }
    });

    if (!res.ok) {
      console.warn(`Avatar download failed for ${userId}: HTTP ${res.status}`);
      return imageUrl;
    }

    const bytes = Buffer.from(await res.arrayBuffer());

    if (!bytes.length) {
      console.warn(`Avatar download for ${userId} returned empty file.`);
      return imageUrl;
    }

    await fs.writeFile(filePath, bytes);

    console.log(`Cached avatar for ${userId}: ${publicPath}`);
    return publicPath;
  } catch (err) {
    console.warn(`Avatar cache error for ${userId}: ${err.message}`);
    return imageUrl;
  }
}

async function cacheAvatarMap(avatarMap) {
  await ensureDir(AVATAR_DIR);

  const cached = new Map();

  for (const [userId, imageUrl] of avatarMap.entries()) {
    const localPath = await downloadAvatarToCache(userId, imageUrl);
    cached.set(Number(userId), localPath || imageUrl);
    await sleep(100);
  }

  console.log(`Avatar cache complete. Cached/linked ${cached.size} avatars.`);
  return cached;
}

function buildBattleSummary(battleName, displayName, rows) {
  if (!rows.length) {
    return {
      battle: battleName,
      display_name: displayName,
      first_snapshot: null,
      last_snapshot: null,
      total_snapshots: 0,
      total_rows: 0,
      unique_players: 0,
      placement: null
    };
  }

  const snapshotTimes = new Set(rows.map(r => r.fetched_at));
  const playerKeys = new Set(
    rows.map(r => r.user_id ? `id:${r.user_id}` : `name:${String(r.username).toLowerCase()}`)
  );

  return {
    battle: battleName,
    display_name: displayName,
    first_snapshot: safeIso(rows[0].fetched_at),
    last_snapshot: safeIso(rows[rows.length - 1].fetched_at),
    total_snapshots: snapshotTimes.size,
    total_rows: rows.length,
    unique_players: playerKeys.size,
    placement: null
  };
}

function summarizePlayerBattle(battleName, displayName, allBattleRows, playerRows) {
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

  const startingPoints = toNumber(first.total_points);
  const endingPoints = toNumber(last.total_points);

  const ranks = sorted.map(r => toNumber(r.rank)).filter(n => n !== null);
  const points = sorted.map(r => toNumber(r.total_points)).filter(n => n !== null);

  const bestRank = ranks.length ? Math.min(...ranks) : null;
  const worstRank = ranks.length ? Math.max(...ranks) : null;
  const maxPoints = points.length ? Math.max(...points) : null;

  const battleEndTime = battleEnd ? new Date(battleEnd).getTime() : null;
  const playerLastSeenTime = last?.fetched_at ? new Date(last.fetched_at).getTime() : null;

  const missingAtEnd =
    battleEndTime !== null &&
    playerLastSeenTime !== null &&
    battleEndTime - playerLastSeenTime > 30 * 60 * 1000;

  const series = sorted.map(r => ({
    t: safeIso(r.fetched_at),
    rank: toNumber(r.rank),
    points: toNumber(r.total_points)
  }));

  return {
    battle: battleName,
    display_name: displayName,
    battle_first_snapshot: battleStart,
    battle_last_snapshot: battleEnd,

    first_seen: safeIso(first.fetched_at),
    first_active_date: firstActive ? safeIso(firstActive.fetched_at) : null,
    last_seen: safeIso(last.fetched_at),

    starting_rank: toNumber(first.rank),
    last_rank: toNumber(last.rank),
    end_rank: toNumber(last.rank),
    best_rank: bestRank,
    worst_rank: worstRank,

    starting_points: startingPoints,
    ending_points: endingPoints,
    max_points: maxPoints,
    gained_points:
      startingPoints !== null && endingPoints !== null
        ? endingPoints - startingPoints
        : null,

    snapshot_count: sorted.length,
    present_at_final_snapshot: !missingAtEnd,
    note: missingAtEnd ? "Last seen before final battle snapshot" : null,

    series
  };
}

async function fetchClanRankSnapshots() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/clan_rank_snapshots`);
  url.searchParams.set("select", "fetched_at,battle,rank,clan_name,points");
  url.searchParams.set("battle", `eq.${CURRENT_BATTLE.name}`);
  url.searchParams.set("order", "fetched_at.desc");
  url.searchParams.set("limit", "50000");

  const res = await fetch(url.toString(), {
    headers: sbHeaders()
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`Could not fetch clan_rank_snapshots (${res.status}): ${text}`);
    return [];
  }

  const rows = await res.json();

  console.log(`Fetched ${rows.length} clan rank snapshot rows.`);
  return rows;
}

function getLatestClanSnapshotRows(rows) {
  if (!rows.length) return [];

  const latestTime = rows
    .map(row => new Date(row.fetched_at).getTime())
    .filter(t => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];

  if (!latestTime) return [];

  return rows.filter(row => new Date(row.fetched_at).getTime() === latestTime);
}

function getNearestClanSnapshotRows(rows, targetMs, toleranceMin) {
  const byTimestamp = groupRowsByTimestamp(rows);

  let best = null;

  for (const [ts, batch] of byTimestamp.entries()) {
    const rowTime = new Date(ts).getTime();
    if (Number.isNaN(rowTime)) continue;

    const diff = Math.abs(rowTime - targetMs);

    if (!best || diff < best.diff) {
      best = {
        ts,
        batch,
        diff
      };
    }
  }

  if (!best) return [];

  const toleranceMs = toleranceMin * 60 * 1000;

  if (best.diff > toleranceMs) {
    return [];
  }

  return best.batch;
}

function clanKey(name) {
  return String(name || "").trim().toLowerCase();
}

function buildClanPointMap(rows) {
  return new Map(
    rows.map(row => [
      clanKey(row.clan_name),
      Number(row.points || 0)
    ])
  );
}

function chooseProjectionRate(clanName, currentPoints, currentTimeMs, snapshotRows) {
  const windows = [
    {
      basis: "12h",
      hours: 12,
      toleranceMin: 45
    },
    {
      basis: "1h",
      hours: 1,
      toleranceMin: 15
    },
    {
      basis: "24h",
      hours: 24,
      toleranceMin: 90
    }
  ];

  for (const win of windows) {
    const targetMs = currentTimeMs - win.hours * 60 * 60 * 1000;
    const oldRows = getNearestClanSnapshotRows(snapshotRows, targetMs, win.toleranceMin);
    const oldMap = buildClanPointMap(oldRows);
    const oldPoints = oldMap.get(clanKey(clanName));

    if (oldPoints === undefined) {
      continue;
    }

    const gain = Number(currentPoints || 0) - Number(oldPoints || 0);
    const ratePerHour = gain / win.hours;

    return {
      basis: win.basis,
      old_points: oldPoints,
      gain,
      rate_per_hour: ratePerHour
    };
  }

  return {
    basis: "none",
    old_points: null,
    gain: 0,
    rate_per_hour: 0
  };
}

function calculateClanProjection(snapshotRows) {
  const latestRows = getLatestClanSnapshotRows(snapshotRows);

  if (!latestRows.length) {
    return {
      clan_rank: null,
      clan_points: null,
      clan_rank_source: null,
      clan_rank_matched_name: null,
      projected_rank: null,
      projected_points: null,
      projection_basis: null,
      hours_remaining: null,
      clan_rank_snapshot_at: null
    };
  }

  const latestTimeMs = Math.max(
    ...latestRows
      .map(row => new Date(row.fetched_at).getTime())
      .filter(t => !Number.isNaN(t))
  );

  const battleEndMs = new Date(CURRENT_BATTLE_END_ISO).getTime();
  const hoursRemaining =
    Number.isNaN(battleEndMs) || Number.isNaN(latestTimeMs)
      ? 0
      : Math.max(0, (battleEndMs - latestTimeMs) / (60 * 60 * 1000));

  const projected = latestRows.map(row => {
    const rate = chooseProjectionRate(
      row.clan_name,
      Number(row.points || 0),
      latestTimeMs,
      snapshotRows
    );

    return {
      clan_name: row.clan_name,
      current_rank: Number(row.rank || 0) || null,
      current_points: Number(row.points || 0),
      rate_per_hour: rate.rate_per_hour,
      projection_basis: rate.basis,
      projected_points: Number(row.points || 0) + rate.rate_per_hour * hoursRemaining
    };
  });

  projected.sort((a, b) => {
    if (b.projected_points !== a.projected_points) return b.projected_points - a.projected_points;
    return a.clan_name.localeCompare(b.clan_name);
  });

  const target = clanKey(CLAN_NAME);
  const currentNong = latestRows.find(row => clanKey(row.clan_name) === target);
  const projectedIndex = projected.findIndex(row => clanKey(row.clan_name) === target);
  const projectedNong = projectedIndex >= 0 ? projected[projectedIndex] : null;

  return {
    clan_rank: currentNong ? Number(currentNong.rank || 0) || null : null,
    clan_points: currentNong ? Number(currentNong.points || 0) : null,
    clan_rank_source: "clan_rank_snapshots",
    clan_rank_matched_name: currentNong?.clan_name || null,
    projected_rank: projectedIndex >= 0 ? projectedIndex + 1 : null,
    projected_points: projectedNong ? Math.round(projectedNong.projected_points) : null,
    projection_basis: projectedNong?.projection_basis || null,
    hours_remaining: Number(hoursRemaining.toFixed(3)),
    clan_rank_snapshot_at: latestRows[0]?.fetched_at || null
  };
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(AVATAR_DIR);
  await fs.rm(PLAYERS_DIR, { recursive: true, force: true });
  await ensureDir(PLAYERS_DIR);

  BATTLES = await buildBattleConfigs();

  const battleRows = new Map();
  const battlesSummary = [];

  for (const battle of BATTLES) {
    console.log(`Loading ${battle.table}...`);
    const rows = await fetchAllRows(battle.table);

    rows.sort((a, b) => {
      const at = new Date(a.fetched_at).getTime();
      const bt = new Date(b.fetched_at).getTime();

      if (at !== bt) return at - bt;
      return Number(a.rank || 0) - Number(b.rank || 0);
    });

    battleRows.set(battle.name, {
      ...battle,
      rows
    });

    battlesSummary.push(buildBattleSummary(battle.name, battle.displayName, rows));
  }

  console.log("Loading current leaderboard...");
  const currentRowsRaw = await fetchCurrentLeaderboard();

  const currentArchiveRows = battleRows.get(CURRENT_BATTLE.name)?.rows || [];
  const currentRowsWithGains = addGainFieldsToCurrent(currentRowsRaw, currentArchiveRows);

  const playerMap = new Map();

  for (const battle of BATTLES) {
    const data = battleRows.get(battle.name);
    const rows = data.rows;

    for (const row of rows) {
      const userId = row.user_id ? Number(row.user_id) : null;
      const key = userId ? `id:${userId}` : `name:${String(row.username).toLowerCase()}`;

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          key,
          user_id: userId,
          username: row.username,
          usernames_seen: new Set(),
          battles_raw: new Map()
        });
      }

      const player = playerMap.get(key);
      player.usernames_seen.add(row.username);

      if (!player.battles_raw.has(battle.name)) {
        player.battles_raw.set(battle.name, []);
      }

      player.battles_raw.get(battle.name).push(row);
    }
  }

  const ids = [...playerMap.values()]
    .map(p => p.user_id)
    .filter(Boolean);

  console.log(`Fetching avatars for ${ids.length} users...`);
  const remoteAvatars = await fetchAvatarHeadshots(ids);
  const avatars = await cacheAvatarMap(remoteAvatars);

  const playerIndex = [];
  let written = 0;

  for (const player of playerMap.values()) {
    const battles = [];

    for (const battle of BATTLES) {
      const data = battleRows.get(battle.name);
      const playerRows = player.battles_raw.get(battle.name) || [];

      if (!playerRows.length) continue;

      battles.push(
        summarizePlayerBattle(
          battle.name,
          battle.displayName,
          data.rows,
          playerRows
        )
      );
    }

    const latestBattle = battles
      .slice()
      .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];

    const profile = {
      profile_key: player.user_id ? String(player.user_id) : fmtSlug(player.username),
      user_id: player.user_id,
      username: player.username,
      usernames_seen: [...player.usernames_seen].sort(),
      avatar_url: player.user_id ? avatars.get(player.user_id) || null : null,
      profile_url: player.user_id ? `https://www.roblox.com/users/${player.user_id}/profile` : null,

      total_battles: battles.length,
      latest_seen: latestBattle?.last_seen || null,
      latest_rank: latestBattle?.last_rank ?? null,
      latest_points: latestBattle?.ending_points ?? null,

      battles
    };

    const filename = `${profile.profile_key}.json`;

    await fs.writeFile(
      path.join(PLAYERS_DIR, filename),
      JSON.stringify(profile, null, 2),
      "utf8"
    );

    playerIndex.push({
      profile_key: profile.profile_key,
      user_id: profile.user_id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      total_battles: profile.total_battles,
      latest_seen: profile.latest_seen,
      latest_rank: profile.latest_rank,
      latest_points: profile.latest_points,
      file: `Data/players/${filename}`
    });

    written++;
  }

  playerIndex.sort((a, b) => {
    const ap = a.latest_points ?? -1;
    const bp = b.latest_points ?? -1;

    if (bp !== ap) return bp - ap;
    return String(a.username).localeCompare(String(b.username));
  });

  const playerIndexById = new Map();
  const playerIndexByName = new Map();

  for (const p of playerIndex) {
    if (p.user_id) playerIndexById.set(String(p.user_id), p);
    if (p.username) playerIndexByName.set(String(p.username).toLowerCase(), p);
  }

  const currentRows = currentRowsWithGains
    .map(row => {
      const match =
        (row.user_id ? playerIndexById.get(String(row.user_id)) : null) ||
        playerIndexByName.get(String(row.username || "").toLowerCase());

      return {
        ...row,
        profile_key: match?.profile_key || (row.user_id ? String(row.user_id) : fmtSlug(row.username)),
        avatar_url: match?.avatar_url || null
      };
    })
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));

  const clanSnapshotRows = await fetchClanRankSnapshots();
  const clanProjection = calculateClanProjection(clanSnapshotRows);

  console.log(`${CLAN_NAME} current rank from snapshots: ${clanProjection.clan_rank}`);
  console.log(`${CLAN_NAME} projected rank: ${clanProjection.projected_rank}`);
  console.log(`${CLAN_NAME} projection basis: ${clanProjection.projection_basis}`);

  await fs.writeFile(
    path.join(OUT_DIR, "players.json"),
    JSON.stringify(playerIndex, null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(OUT_DIR, "battles.json"),
    JSON.stringify(battlesSummary, null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(OUT_DIR, "current.json"),
    JSON.stringify({
      generated_at: new Date().toISOString(),
      battle: CURRENT_BATTLE.name,
      display_name: CURRENT_BATTLE.displayName,
      clan_name: CLAN_NAME,
      battle_end_iso: CURRENT_BATTLE_END_ISO,

      clan_rank: clanProjection.clan_rank,
      clan_points: clanProjection.clan_points,
      clan_rank_source: clanProjection.clan_rank_source,
      clan_rank_matched_name: clanProjection.clan_rank_matched_name,
      clan_rank_snapshot_at: clanProjection.clan_rank_snapshot_at,

      projected_rank: clanProjection.projected_rank,
      projected_points: clanProjection.projected_points,
      projection_basis: clanProjection.projection_basis,
      hours_remaining: clanProjection.hours_remaining,

      rows: currentRows
    }, null, 2),
    "utf8"
  );

  console.log(`Wrote ${written} player profiles.`);
  console.log("Wrote Data/players.json.");
  console.log("Wrote Data/battles.json.");
  console.log("Wrote Data/current.json.");
  console.log(`Avatar files are stored in: ${AVATAR_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
