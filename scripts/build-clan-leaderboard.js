const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "AngelBattle2026";
const CURRENT_BATTLE_DISPLAY_NAME = process.env.CURRENT_BATTLE_DISPLAY_NAME || "Angel Battle 2026";
const CURRENT_BATTLE_END_ISO = process.env.CURRENT_BATTLE_END_ISO || "";
const CURRENT_BATTLE_HISTORY_TABLE = process.env.CURRENT_BATTLE_HISTORY_TABLE || "";

const OUT_DIR = path.join(process.cwd(), "Data");
const DATA_DIR = path.join(process.cwd(), "Data");
const MANUAL_BATTLES_FILE = path.join(DATA_DIR, "manual-battles.json");
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

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function clanKey(name) {
  return normalizeKey(name);
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

function extractClanImageId(iconValue) {
  return String(iconValue || "")
    .trim()
    .replace(/^rbxassetid:\/\//i, "")
    .replace(/^rbxasset:\/\//i, "")
    .trim();
}

function buildClanIconUrl(iconId) {
  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null;
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

async function resolveBattleMeta() {
  const manualBattles = await readJsonArray(MANUAL_BATTLES_FILE);
  const targetKey = normalizeKey(CURRENT_BATTLE_NAME);

  const match = manualBattles.find(item => {
    return [
      item?.battle,
      item?.api_battle_key,
      item?.display_name
    ].some(value => normalizeKey(value) === targetKey);
  });

  return {
    battle: match?.battle || CURRENT_BATTLE_NAME,
    display_name: match?.display_name || CURRENT_BATTLE_DISPLAY_NAME,
    battle_end_iso: CURRENT_BATTLE_END_ISO || null,
    clan_results_table:
      CURRENT_BATTLE_HISTORY_TABLE ||
      match?.clan_results_table ||
      `${CURRENT_BATTLE_NAME}Clans`
  };
}

async function supabaseSelectAll(tableName, queryParams = {}) {
  const all = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}`);
    url.searchParams.set("select", "*");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      headers: sbHeaders()
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase fetch failed for ${tableName} (${res.status}): ${text}`);
    }

    const rows = await res.json();
    all.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function groupRowsByTimestamp(rows) {
  const map = new Map();

  for (const row of rows) {
    const ts = row.fetched_at;
    if (!ts) continue;
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
  if (best.diff > toleranceMs) return [];

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

async function fetchClanIconMap(clanNames) {
  const map = new Map();
  const unique = [...new Set(clanNames.filter(Boolean))];

  for (const clanName of unique) {
    try {
      const res = await fetch(`https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(clanName)}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "NONG-Leaderboard-Clan-Icons"
        }
      });

      if (!res.ok) {
        map.set(clanKey(clanName), { icon_id: null, icon_url: null });
        continue;
      }

      const json = await res.json();
      const iconId = extractClanImageId(json?.data?.Icon || json?.data?.icon);
      map.set(clanKey(clanName), {
        icon_id: iconId || null,
        icon_url: buildClanIconUrl(iconId)
      });
    } catch {
      map.set(clanKey(clanName), { icon_id: null, icon_url: null });
    }
  }

  return map;
}

function calculateRows(snapshotRows, battleEndIso, iconMap) {
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

  const battleEndMs = new Date(battleEndIso || "").getTime();

  const hoursRemaining =
    Number.isNaN(battleEndMs) || Number.isNaN(latestMs)
      ? 0
      : Math.max(0, (battleEndMs - latestMs) / (60 * 60 * 1000));

  const projectedRows = latestRows.map(row => {
    const rate = chooseProjectionRate(row, snapshotRows, latestMs);
    const points = Number(row.points || 0);
    const projectedPoints = points + rate.rate_per_hour * hoursRemaining;
    const icon = iconMap.get(clanKey(row.clan_name)) || { icon_id: null, icon_url: null };

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
      projected_rank: null,
      fetched_at: row.fetched_at,
      icon_id: icon.icon_id,
      icon_url: icon.icon_url
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
    if (err.code !== "ENOENT") throw err;
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
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const meta = await resolveBattleMeta();

  const historyRows = await supabaseSelectAll(meta.clan_results_table, {
    order: "fetched_at.desc"
  });

  const latestRows = getLatestSnapshotRows(historyRows);
  const iconMap = await fetchClanIconMap(latestRows.map(row => row.clan_name));
  const calculated = calculateRows(historyRows, meta.battle_end_iso, iconMap);

  const output = {
    generated_at: new Date().toISOString(),
    snapshot_at: calculated.generatedFromSnapshot,
    battle: meta.battle,
    display_name: meta.display_name,
    battle_end_iso: meta.battle_end_iso,
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
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
