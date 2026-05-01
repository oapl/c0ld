// scripts/build-player-profiles.js
// Builds static JSON data for GitHub Pages from Supabase.
//
// Outputs:
//   Data/current.json
//   Data/players.json
//   Data/battles.json
//   Data/players/<profile_key>.json
//   assets/avatars/<user_id>.png
//
// This script reads Data/manual-battles.json.
// For any battle with nong_results_table set, it pulls player rows from that Supabase table.
// Manual-only battles stay in manual-battles.json and are merged later by merge-manual-battles.js.

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "StarryBattle";
const CURRENT_BATTLE_DISPLAY_NAME = process.env.CURRENT_BATTLE_DISPLAY_NAME || "Starry Battle";
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

if (!SUPABASE_URL) throw new Error("Missing required env var: SUPABASE_URL");
if (!SUPABASE_KEY) throw new Error("Missing required env var: SUPABASE_SERVICE_KEY");

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

function profileKeyFromRow(row) {
  if (row.user_id !== null && row.user_id !== undefined && row.user_id !== "") {
    return String(row.user_id);
  }

  return String(row.username || "unknown")
    .replace(/[^0-9a-zA-Z_-]/g, "_")
    .slice(0, 80);
}

function rowIdentity(row) {
  if (row.user_id !== null && row.user_id !== undefined && row.user_id !== "") {
    return `id:${row.user_id}`;
  }

  return `name:${String(row.username || "").toLowerCase()}`;
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
    if (err.code === "ENOENT") return [];
    throw err;
  }
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

  console.log("Manual battles read:", manual.length);
  console.log("Table-backed battles found:", configs.length);
  console.log("Battle profile table configuration:");

  for (const b of configs) {
    console.log(`  ${b.battle} (${b.display_name}) -> ${b.table}`);
  }

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

  console.log("Current API battle key:", CURRENT_BATTLE_NAME);
  console.log("Current profile battle key:", currentProfileBattle.battle);
  console.log("Current NONG table:", currentProfileBattle.table);

  return {
    configs,
    currentProfileBattle
  };
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

  if (!rows.length) return [];

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

    await sleep(250);
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
    await sleep(75);
  }

  console.log(`Avatar cache complete. Cached/linked ${cached.size} avatars.`);
  return cached;
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
  const playerKeys = new Set(rows.map(rowIdentity));

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

  const series = sorted.map(row => ({
    t: safeIso(row.fetched_at),
    rank: numberOrNull(row.rank),
    points: numberOrNull(row.total_points)
  }));

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

    series
  };
}

async function fetchClanRankSnapshots() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/clan_rank_snapshots`);
  url.searchParams.set("select", "fetched_at,battle,rank,clan_name,points");
  url.searchParams.set("battle", `eq.${CURRENT_BATTLE_NAME}`);
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

function clanKey(name) {
  return String(name || "").trim().toLowerCase();
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

function buildClanPointMap(rows) {
  return new Map(
    rows.map(row => [
      clanKey(row.clan_name),
      Number(row.points || 0)
    ])
  );
}

function getNearestClanSnapshotRows(rows, targetMs, toleranceMin) {
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

function chooseProjectionRate(clanName, currentPoints, currentTimeMs, snapshotRows) {
  const windows = [
    { basis: "12h", hours: 12, toleranceMin: 45 },
    { basis: "1h", hours: 1, toleranceMin: 15 },
    { basis: "24h", hours: 24, toleranceMin: 90 }
  ];

  for (const win of windows) {
    const targetMs = currentTimeMs - win.hours * 60 * 60 * 1000;
    const oldRows = getNearestClanSnapshotRows(snapshotRows, targetMs, win.toleranceMin);
    const oldMap = buildClanPointMap(oldRows);
    const oldPoints = oldMap.get(clanKey(clanName));

    if (oldPoints === undefined) continue;

    const gain = Number(currentPoints || 0) - Number(oldPoints || 0);

    return {
      basis: win.basis,
      rate_per_hour: gain / win.hours
    };
  }

  return {
    basis: "none",
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

  const battleEndMs = CURRENT_BATTLE_END_ISO ? new Date(CURRENT_BATTLE_END_ISO).getTime() : NaN;

  const hoursRemaining =
    Number.isNaN(battleEndMs) || Number.isNaN(latestTimeMs)
      ? 0
      : Math.max(0, (battleEndMs - latestTimeMs) / (60 * 60 * 1000));

  const projected = latestRows.map(row => {
    const currentPoints = Number(row.points || 0);
    const rate = chooseProjectionRate(row.clan_name, currentPoints, latestTimeMs, snapshotRows);

    return {
      clan_name: row.clan_name,
      current_rank: Number(row.rank || 0) || null,
      current_points: currentPoints,
      projection_basis: rate.basis,
      projected_points: currentPoints + rate.rate_per_hour * hoursRemaining
    };
  });

  projected.sort((a, b) => {
    if (b.projected_points !== a.projected_points) return b.projected_points - a.projected_points;
    return String(a.clan_name).localeCompare(String(b.clan_name));
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

  const { configs, currentProfileBattle } = await buildBattleConfigs();

  const battleRows = new Map();
  const battlesSummary = [];

  for (const battle of configs) {
    console.log(`Loading ${battle.table}...`);
    const rows = await fetchAllRows(battle.table);

    rows.sort((a, b) => {
      const at = new Date(a.fetched_at).getTime();
      const bt = new Date(b.fetched_at).getTime();

      if (at !== bt) return at - bt;
      return Number(a.rank || 0) - Number(b.rank || 0);
    });

    battleRows.set(battle.battle, {
      config: battle,
      rows
    });

    battlesSummary.push(buildBattleSummary(battle, rows));
  }

  console.log("Loading current leaderboard...");
  const currentRowsRaw = await fetchCurrentLeaderboard();

  const currentArchiveRows = battleRows.get(currentProfileBattle.battle)?.rows || [];
  const currentRowsWithGains = addGainFieldsToCurrent(currentRowsRaw, currentArchiveRows);

  const playerMap = new Map();

  for (const battle of configs) {
    const data = battleRows.get(battle.battle);
    const rows = data?.rows || [];

    for (const row of rows) {
      const profileKey = profileKeyFromRow(row);

      if (!playerMap.has(profileKey)) {
        playerMap.set(profileKey, {
          profile_key: profileKey,
          user_id: row.user_id ? Number(row.user_id) : null,
          username: row.username,
          usernames_seen: new Set(),
          battles_raw: new Map()
        });
      }

      const player = playerMap.get(profileKey);

      if (row.username) {
        player.usernames_seen.add(row.username);
        player.username = row.username;
      }

      if (!player.battles_raw.has(battle.battle)) {
        player.battles_raw.set(battle.battle, []);
      }

      player.battles_raw.get(battle.battle).push(row);
    }
  }

  const ids = [...playerMap.values()]
    .map(player => player.user_id)
    .filter(Boolean);

  const avatarUrls = await fetchAvatarHeadshots(ids);
  const cachedAvatars = await cacheAvatarMap(avatarUrls);

  const playerIndex = [];

  for (const player of playerMap.values()) {
    const battles = [];

    for (const battle of configs) {
      const playerRows = player.battles_raw.get(battle.battle) || [];
      if (!playerRows.length) continue;

      const allBattleRows = battleRows.get(battle.battle)?.rows || [];

      battles.push(
        summarizePlayerBattle(
          battle,
          allBattleRows,
          playerRows
        )
      );
    }

    battles.sort((a, b) => {
      const at = new Date(a.battle_last_snapshot || a.last_seen || 0).getTime();
      const bt = new Date(b.battle_last_snapshot || b.last_seen || 0).getTime();
      return bt - at;
    });

    const latestBattle = battles[0] || null;

    const profile = {
      profile_key: player.profile_key,
      user_id: player.user_id,
      username: player.username,
      usernames_seen: [...player.usernames_seen].sort(),
      avatar_url: player.user_id ? cachedAvatars.get(player.user_id) || null : null,
      profile_url: player.user_id ? `https://www.roblox.com/users/${player.user_id}/profile` : null,

      total_battles: battles.length,
      latest_seen: latestBattle?.last_seen || null,
      latest_rank: latestBattle?.last_rank ?? null,
      latest_points: latestBattle?.ending_points ?? null,

      battles
    };

    const fileName = `${profile.profile_key}.json`;

    await fs.writeFile(
      path.join(PLAYERS_DIR, fileName),
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
      file: `Data/players/${fileName}`
    });
  }

  playerIndex.sort((a, b) => {
    const ap = a.latest_points ?? -1;
    const bp = b.latest_points ?? -1;

    if (bp !== ap) return bp - ap;
    return String(a.username || "").localeCompare(String(b.username || ""));
  });

  const playerById = new Map();
  const playerByName = new Map();

  for (const player of playerIndex) {
    if (player.user_id) playerById.set(String(player.user_id), player);
    if (player.username) playerByName.set(String(player.username).toLowerCase(), player);
  }

  const currentRows = currentRowsWithGains
    .map(row => {
      const match =
        (row.user_id ? playerById.get(String(row.user_id)) : null) ||
        playerByName.get(String(row.username || "").toLowerCase());

      return {
        ...row,
        profile_key: match?.profile_key || profileKeyFromRow(row),
        avatar_url: match?.avatar_url || null
      };
    })
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));

  const clanSnapshotRows = await fetchClanRankSnapshots();
  const clanProjection = calculateClanProjection(clanSnapshotRows);

  await fs.writeFile(
    path.join(OUT_DIR, "players.json"),
    JSON.stringify(playerIndex, null, 2) + "\n",
    "utf8"
  );

  await fs.writeFile(
    path.join(OUT_DIR, "battles.json"),
    JSON.stringify(battlesSummary, null, 2) + "\n",
    "utf8"
  );

  await fs.writeFile(
    path.join(OUT_DIR, "current.json"),
    JSON.stringify({
      generated_at: new Date().toISOString(),

      battle: currentProfileBattle.battle,
      api_battle_key: CURRENT_BATTLE_NAME,
      display_name: currentProfileBattle.display_name,

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
    }, null, 2) + "\n",
    "utf8"
  );

  console.log(`Wrote ${playerIndex.length} player profiles.`);
  console.log("Wrote Data/players.json.");
  console.log("Wrote Data/battles.json.");
  console.log("Wrote Data/current.json.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
