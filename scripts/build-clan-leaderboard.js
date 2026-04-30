// scripts/build-clan-leaderboard.js
// Builds static clan leaderboard JSON for GitHub Pages from Supabase.
//
// Input table:
//   public.clan_rank_snapshots
//
// Outputs:
//   Data/clans-current.json
//   Data/current.json gets patched with the same clan/projection values
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//
// Optional env:
//   CLAN_NAME = NONG
//   CURRENT_BATTLE_NAME = StarryBattle
//   CURRENT_BATTLE_DISPLAY_NAME = Starry Battle
//   CURRENT_BATTLE_END_ISO = 2026-05-03T18:00:00Z

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "StarryBattle";
const CURRENT_BATTLE_DISPLAY_NAME = process.env.CURRENT_BATTLE_DISPLAY_NAME || "Starry Battle";
const CURRENT_BATTLE_END_ISO = process.env.CURRENT_BATTLE_END_ISO || "2026-05-03T18:00:00Z";

const OUT_DIR = path.join(process.cwd(), "Data");
const CLANS_CURRENT_FILE = path.join(OUT_DIR, "clans-current.json");
const CURRENT_FILE = path.join(OUT_DIR, "current.json");

const PAGE_SIZE = 1000;

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function clanKey(name) {
  return String(name || "").trim().toLowerCase();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

function getLatestSnapshotRows(rows) {
  if (!rows.length) return [];

  const latestMs = Math.max(
    ...rows
      .map(row => new Date(row.fetched_at).getTime())
      .filter(ms => !Number.isNaN(ms))
  );

  if (!Number.isFinite(latestMs)) return [];

  return rows
    .filter(row => new Date(row.fetched_at).getTime() === latestMs)
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));
}

function getNearestSnapshotRows(rows, targetMs, toleranceMin) {
  const grouped = groupRowsByTimestamp(rows);
  let best = null;

  for (const [ts, batch] of grouped.entries()) {
    const ms = new Date(ts).getTime();
    if (Number.isNaN(ms)) continue;

    const diff = Math.abs(ms - targetMs);

    if (!best || diff < best.diff) {
      best = { ts, batch, diff };
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
      clanKey(row.clan_name),
      Number(row.points || 0)
    ])
  );
}

function getGain(currentRow, allRows, latestMs, hours, toleranceMin) {
  const targetMs = latestMs - hours * 60 * 60 * 1000;
  const oldRows = getNearestSnapshotRows(allRows, targetMs, toleranceMin);
  const oldMap = buildPointMap(oldRows);
  const oldPoints = oldMap.get(clanKey(currentRow.clan_name));

  if (oldPoints === undefined) return null;

  return Number(currentRow.points || 0) - oldPoints;
}

function chooseProjectionRate(currentRow, allRows, latestMs) {
  const windows = [
    { basis: "12h", hours: 12, toleranceMin: 45 },
    { basis: "1h", hours: 1, toleranceMin: 15 },
    { basis: "24h", hours: 24, toleranceMin: 90 }
  ];

  for (const win of windows) {
    const gain = getGain(currentRow, allRows, latestMs, win.hours, win.toleranceMin);

    if (gain === null) continue;

    return {
      basis: win.basis,
      gain,
      rate_per_hour: gain / win.hours
    };
  }

  return {
    basis: "none",
    gain: 0,
    rate_per_hour: 0
  };
}

async function fetchClanRankSnapshots() {
  const all = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/clan_rank_snapshots`);
    url.searchParams.set("select", "fetched_at,battle,rank,clan_name,points");
    url.searchParams.set("battle", `eq.${CURRENT_BATTLE_NAME}`);
    url.searchParams.set("order", "fetched_at.desc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url.toString(), {
      headers: sbHeaders()
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase fetch failed for clan_rank_snapshots (${res.status}): ${text}`);
    }

    const rows = await res.json();
    all.push(...rows);

    console.log(`clan_rank_snapshots: fetched ${all.length} rows...`);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function calculateRows(snapshotRows) {
  const latestRows = getLatestSnapshotRows(snapshotRows);

  if (!latestRows.length) {
    return {
      latestRows: [],
      rows: [],
      nong: null,
      generatedFromSnapshot: null,
      hoursRemaining: null
    };
  }

  const latestMs = Math.max(
    ...latestRows
      .map(row => new Date(row.fetched_at).getTime())
      .filter(ms => !Number.isNaN(ms))
  );

  const battleEndMs = new Date(CURRENT_BATTLE_END_ISO).getTime();

  const hoursRemaining =
    Number.isNaN(battleEndMs) || Number.isNaN(latestMs)
      ? 0
      : Math.max(0, (battleEndMs - latestMs) / (60 * 60 * 1000));

  const projectedRows = latestRows.map(row => {
    const rate = chooseProjectionRate(row, snapshotRows, latestMs);
    const points = Number(row.points || 0);
    const projectedPoints = points + rate.rate_per_hour * hoursRemaining;

    return {
      rank: toNumber(row.rank),
      clan_name: row.clan_name,
      points,
      gain_5m: getGain(row, snapshotRows, latestMs, 5 / 60, 4),
      gain_1h: getGain(row, snapshotRows, latestMs, 1, 15),
      gain_12h: getGain(row, snapshotRows, latestMs, 12, 45),
      gain_24h: getGain(row, snapshotRows, latestMs, 24, 90),
      rate_per_hour: rate.rate_per_hour,
      projection_basis: rate.basis,
      projected_points: Math.round(projectedPoints),
      fetched_at: row.fetched_at
    };
  });

  const projectedSorted = [...projectedRows].sort((a, b) => {
    if (b.projected_points !== a.projected_points) {
      return b.projected_points - a.projected_points;
    }

    return String(a.clan_name).localeCompare(String(b.clan_name));
  });

  const projectedRankMap = new Map();

  projectedSorted.forEach((row, index) => {
    projectedRankMap.set(clanKey(row.clan_name), index + 1);
  });

  const finalRows = projectedRows
    .map(row => ({
      ...row,
      projected_rank: projectedRankMap.get(clanKey(row.clan_name)) || null
    }))
    .sort((a, b) => Number(a.rank || 999999) - Number(b.rank || 999999));

  const nong = finalRows.find(row => clanKey(row.clan_name) === clanKey(CLAN_NAME)) || null;

  return {
    latestRows,
    rows: finalRows,
    nong,
    generatedFromSnapshot: safeIso(latestRows[0]?.fetched_at),
    hoursRemaining: Number(hoursRemaining.toFixed(3))
  };
}

async function patchCurrentJson(clanOutput) {
  let current = {};

  try {
    const raw = await fs.readFile(CURRENT_FILE, "utf8");
    current = JSON.parse(raw);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }

    current = {};
  }

  const patched = {
    ...current,

    clan_name: clanOutput.clan_name,
    battle: clanOutput.battle,
    display_name: clanOutput.display_name,
    battle_end_iso: clanOutput.battle_end_iso,

    clan_rank: clanOutput.clan_rank,
    clan_points: clanOutput.clan_points,
    clan_rank_source: "clans-current.json",
    clan_rank_matched_name: clanOutput.clan_name,
    clan_rank_snapshot_at: clanOutput.snapshot_at,

    projected_rank: clanOutput.projected_rank,
    projected_points: clanOutput.projected_points,
    projection_basis: clanOutput.projection_basis,
    hours_remaining: clanOutput.hours_remaining
  };

  await fs.writeFile(
    CURRENT_FILE,
    JSON.stringify(patched, null, 2) + "\n",
    "utf8"
  );

  console.log("Patched Data/current.json with clan projection source of truth.");
  console.log(`Data/current.json projected rank: ${patched.projected_rank}`);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const snapshotRows = await fetchClanRankSnapshots();
  const calculated = calculateRows(snapshotRows);

  const output = {
    generated_at: new Date().toISOString(),
    snapshot_at: calculated.generatedFromSnapshot,
    battle: CURRENT_BATTLE_NAME,
    display_name: CURRENT_BATTLE_DISPLAY_NAME,
    battle_end_iso: CURRENT_BATTLE_END_ISO,
    clan_name: CLAN_NAME,

    clan_rank: calculated.nong?.rank ?? null,
    clan_points: calculated.nong?.points ?? null,
    projected_rank: calculated.nong?.projected_rank ?? null,
    projected_points: calculated.nong?.projected_points ?? null,
    projection_basis: calculated.nong?.projection_basis ?? null,
    hours_remaining: calculated.hoursRemaining,

    rows: calculated.rows
  };

  await fs.writeFile(
    CLANS_CURRENT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  await patchCurrentJson(output);

  console.log("Wrote Data/clans-current.json.");
  console.log(`Clan rows written: ${calculated.rows.length}`);
  console.log(`${CLAN_NAME} current rank: ${output.clan_rank}`);
  console.log(`${CLAN_NAME} projected rank: ${output.projected_rank}`);
  console.log(`${CLAN_NAME} projection basis: ${output.projection_basis}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
