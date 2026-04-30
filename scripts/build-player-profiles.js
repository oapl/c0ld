// scripts/build-player-profiles.js
// Builds static JSON player profile data for GitHub Pages.
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//
// Outputs:
//   Data/players.json
//   Data/battles.json
//   Data/players/<user_id>.json

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const OUT_DIR = path.join(process.cwd(), "Data");
const PLAYERS_DIR = path.join(OUT_DIR, "players");

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

const PAGE_SIZE = 1000;

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

function toNumber(value) {
  if (value === null || value === undefined) return null;
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

async function fetchAvatarHeadshots(userIds) {
  const result = new Map();
  const ids = [...new Set(userIds.filter(Boolean).map(Number))];

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
          "Accept": "application/json",
          "User-Agent": "NONG-Leaderboard-Profiles"
        }
      });

      const text = await res.text();

      if (!res.ok) {
        console.warn(`Avatar batch failed (${res.status}): ${text}`);
        continue;
      }

      const json = JSON.parse(text);

      for (const item of json.data || []) {
        if (item.targetId && item.imageUrl) {
          result.set(Number(item.targetId), item.imageUrl);
        }
      }
    } catch (err) {
      console.warn(`Avatar batch error: ${err.message}`);
    }

    await sleep(300);
  }

  return result;
}

function buildBattleSummary(battleName, displayName, rows) {
  if (!rows.length) {
    return {
      battle: battleName,
      display_name: displayName,
      first_snapshot: null,
      last_snapshot: null,
      total_snapshots: 0,
      unique_players: 0
    };
  }

  const snapshotTimes = new Set(rows.map(r => r.fetched_at));
  const playerKeys = new Set(rows.map(r => r.user_id ? `id:${r.user_id}` : `name:${r.username}`));

  return {
    battle: battleName,
    display_name: displayName,
    first_snapshot: safeIso(rows[0].fetched_at),
    last_snapshot: safeIso(rows[rows.length - 1].fetched_at),
    total_snapshots: snapshotTimes.size,
    total_rows: rows.length,
    unique_players: playerKeys.size
  };
}

function summarizePlayerBattle(battleName, displayName, allBattleRows, playerRows) {
  const sorted = [...playerRows].sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));

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

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  await fs.mkdir(PLAYERS_DIR, { recursive: true });

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
  const avatars = await fetchAvatarHeadshots(ids);

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

  console.log(`Wrote ${written} player profiles.`);
  console.log(`Wrote Data/players.json.`);
  console.log(`Wrote Data/battles.json.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
