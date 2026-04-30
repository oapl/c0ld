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
//
// Optional env:
//   CLAN_NAME = NONG

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const CLAN_NAME = process.env.CLAN_NAME || "NONG";

const OUT_DIR = path.join(process.cwd(), "Data");
const PLAYERS_DIR = path.join(OUT_DIR, "players");

const AVATAR_DIR = path.join(process.cwd(), "assets", "avatars");
const AVATAR_PUBLIC_PATH = "assets/avatars";

const PAGE_SIZE = 1000;

const BATTLES = [
  {
    name: "Spring2026",
    table: "Spring2026Archive",
    displayName: "Spring 2026"
  },
  {
    name: "StarryBattle",
    table: "StarryBattleArchive",
    displayName: "Starry Battle"
  }
];

const CURRENT_BATTLE = {
  name: "StarryBattle",
  displayName: "Starry Battle",
  archiveTable: "StarryBattleArchive"
};

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

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 500)}`);
  }
}

async function fetchAllRows(table) {
  const all = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
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
    last_seen: safeIso(last.fetched_at),

    starting_rank: toNumber(first.rank),
    last_rank: toNumber(last.rank),
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

function extractClanArrays(value) {
  const arrays = [];

  function looksLikeClanObject(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;

    const hasName =
      obj.Name !== undefined ||
      obj.name !== undefined ||
      obj.ClanName !== undefined ||
      obj.clanName !== undefined ||
      obj.Tag !== undefined ||
      obj.tag !== undefined;

    const hasPoints =
      obj.Points !== undefined ||
      obj.points !== undefined ||
      obj.Score !== undefined ||
      obj.score !== undefined ||
      obj.Total !== undefined ||
      obj.total !== undefined ||
      obj.Value !== undefined ||
      obj.value !== undefined;

    return hasName && hasPoints;
  }

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      if (node.some(looksLikeClanObject)) {
        arrays.push(node);
      }

      for (const item of node) {
        walk(item);
      }

      return;
    }

    for (const child of Object.values(node)) {
      walk(child);
    }
  }

  walk(value);
  return arrays;
}

function getClanName(clan) {
  return String(
    clan?.Name ??
    clan?.name ??
    clan?.ClanName ??
    clan?.clanName ??
    clan?.Tag ??
    clan?.tag ??
    ""
  ).trim();
}

function getClanPoints(clan) {
  return Number(
    clan?.Points ??
    clan?.points ??
    clan?.Score ??
    clan?.score ??
    clan?.Total ??
    clan?.total ??
    clan?.Value ??
    clan?.value ??
    0
  );
}

function getClanExplicitRank(clan) {
  const value =
    clan?.Rank ??
    clan?.rank ??
    clan?.Place ??
    clan?.place ??
    clan?.Position ??
    clan?.position ??
    clan?.Index ??
    clan?.index;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchNongCurrentRank() {
  const target = String(CLAN_NAME || "NONG").trim().toLowerCase();
  const pageSize = 100;
  const maxPages = 100;

  const hosts = [
    "https://biggamesapi.io/api/clans",
    "https://ps99.biggamesapi.io/api/clans"
  ];

  for (const baseUrl of hosts) {
    console.log(`Fetching current clan rank for ${CLAN_NAME} from ${baseUrl}...`);

    for (let page = 1; page <= maxPages; page++) {
      const url = new URL(baseUrl);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      url.searchParams.set("sort", "Points");
      url.searchParams.set("sortOrder", "desc");

      try {
        const json = await fetchJson(url.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "NONG-Leaderboard-Rank"
          }
        });

        const clanArrays = extractClanArrays(json);
        const clans = clanArrays.length ? clanArrays[0] : [];

        if (!clans.length) {
          console.warn(`No clan array found on ${baseUrl} page ${page}.`);
          break;
        }

        const sorted = [...clans].sort((a, b) => getClanPoints(b) - getClanPoints(a));

        for (let i = 0; i < sorted.length; i++) {
          const clan = sorted[i];
          const name = getClanName(clan);

          if (name.toLowerCase() === target) {
            const explicitRank = getClanExplicitRank(clan);
            const calculatedRank = (page - 1) * pageSize + i + 1;
            const rank = explicitRank || calculatedRank;
            const points = getClanPoints(clan);

            console.log(`${CLAN_NAME} current rank found: #${rank} with ${points} points.`);

            return {
              rank,
              source: baseUrl,
              matched_name: name,
              points
            };
          }
        }

        console.log(`Checked ${baseUrl} page ${page}; ${CLAN_NAME} not found yet.`);

        if (sorted.length < pageSize) {
          break;
        }

        await sleep(150);
      } catch (err) {
        console.warn(`Clan rank lookup error from ${baseUrl} page ${page}: ${err.message}`);
        break;
      }
    }
  }

  console.warn(`${CLAN_NAME} was not found in the searched clan pages.`);

  return {
    rank: null,
    source: null,
    matched_name: null,
    points: null
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  await ensureDir(OUT_DIR);
  await ensureDir(AVATAR_DIR);
  await fs.rm(PLAYERS_DIR, { recursive: true, force: true });
  await ensureDir(PLAYERS_DIR);

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

  console.log(`Fetching current rank for ${CLAN_NAME}...`);
  const clanRank = await fetchNongCurrentRank();

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
      clan_rank: clanRank.rank,
      clan_rank_source: clanRank.source,
      clan_rank_matched_name: clanRank.matched_name,
      clan_rank_points: clanRank.points,
      projected_rank: null,
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
