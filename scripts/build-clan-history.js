// scripts/build-clan-history.js
// Builds Data/clans-history.json from battle-specific historical clan tables.
//
// Supports both:
//   - newer tables with fetched_at
//   - older legacy tables with created_at / snapshot_at / no timestamp
//
// Reads:
//   Data/manual-battles.json
//
// Uses:
//   battle
//   display_name
//   clan_results_table
//
// Output:
//   Data/clans-history.json

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const DATA_DIR = path.join(process.cwd(), "Data");
const MANUAL_BATTLES_FILE = path.join(DATA_DIR, "manual-battles.json");
const OUTPUT_FILE = path.join(DATA_DIR, "clans-history.json");

const PAGE_SIZE = 1000;

if (!SUPABASE_URL) throw new Error("Missing required env var: SUPABASE_URL");
if (!SUPABASE_KEY) throw new Error("Missing required env var: SUPABASE_SERVICE_KEY");

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function clanKey(name) {
  return normalizeKey(name);
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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return null;
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

      if (res.status === 404 || text.includes("PGRST205")) {
        console.warn(`Skipping missing historical clan table: ${tableName}`);
        return null;
      }

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

function normalizeClanRow(row) {
  return {
    fetched_at: dateOrNull(
      firstNonEmpty(
        row.fetched_at,
        row.created_at,
        row.snapshot_at,
        row.updated_at,
        row.inserted_at
      )
    ),
    rank: numberOrNull(row.rank),
    clan_name: stringOrNull(
      firstNonEmpty(row.clan_name, row.clan, row.name, row.tag)
    ),
    points: numberOrNull(firstNonEmpty(row.points, row.total_points))
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

        const ap = Number(a.points || 0);
        const bp = Number(b.points || 0);
        if (ap !== bp) return bp - ap;

        return String(a.clan_name || "").localeCompare(String(b.clan_name || ""));
      });
  }

  const latestMs = Math.max(
    ...timestamped
      .map(row => new Date(row.fetched_at).getTime())
      .filter(ms => !Number.isNaN(ms))
  );

  if (!Number.isFinite(latestMs)) return [];

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
      clanKey(row.clan_name),
      Number(row.points || 0)
    ])
  );
}

function getGain(currentRow, allRows, latestMs, hours, toleranceMin) {
  if (!Number.isFinite(latestMs)) return null;

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

function sortRows(rows) {
  rows.sort((a, b) => {
    const ar = Number(a.rank);
    const br = Number(b.rank);

    if (Number.isFinite(ar) && Number.isFinite(br) && ar !== br) {
      return ar - br;
    }

    const ap = Number(a.points || 0);
    const bp = Number(b.points || 0);

    if (ap !== bp) return bp - ap;

    return String(a.clan_name || "").localeCompare(String(b.clan_name || ""));
  });

  return rows;
}

function calculateBattleRows(snapshotRows) {
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

  const projectedRows = latestRows.map(row => {
    const rate = hasHistoricalTimestamps
      ? chooseProjectionRate(row, snapshotRows, latestMs)
      : { basis: "none", gain: 0, rate_per_hour: 0 };

    return {
      rank: numberOrNull(row.rank),
      clan_name: row.clan_name,
      points: numberOrNull(row.points),
      gain_5m: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 5 / 60, 4) : null,
      gain_1h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 1, 15) : null,
      gain_12h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 12, 45) : null,
      gain_24h: hasHistoricalTimestamps ? getGain(row, snapshotRows, latestMs, 24, 90) : null,
      projection_basis: rate.basis,
      rate_per_hour: rate.rate_per_hour,
      projected_points: Math.round(Number(row.points || 0))
    };
  });

  const projectedSorted = [...projectedRows].sort((a, b) => {
    const ap = Number(a.projected_points || 0);
    const bp = Number(b.projected_points || 0);

    if (bp !== ap) return bp - ap;
    return String(a.clan_name || "").localeCompare(String(b.clan_name || ""));
  });

  const projectedRankMap = new Map();
  projectedSorted.forEach((row, index) => {
    projectedRankMap.set(clanKey(row.clan_name), index + 1);
  });

  const rows = sortRows(
    projectedRows.map(row => ({
      ...row,
      projected_rank: projectedRankMap.get(clanKey(row.clan_name)) || null
    }))
  );

  return {
    snapshot_at: latestRows[0]?.fetched_at || null,
    rows
  };
}

async function main() {
  const manualBattles = await readJsonArray(MANUAL_BATTLES_FILE);

  const declared = manualBattles
    .filter(battle => battle.battle && battle.display_name && battle.clan_results_table)
    .map(battle => ({
      battle: String(battle.battle),
      display_name: String(battle.display_name),
      source_table: String(battle.clan_results_table)
    }));

  const deduped = new Map();
  for (const item of declared) {
    deduped.set(normalizeKey(item.battle), item);
  }

  const output = [];

  for (const item of deduped.values()) {
    console.log(`Reading historical clan table: ${item.source_table} -> ${item.battle}`);

    const rawRows = await supabaseSelectAll(item.source_table);

    if (rawRows === null) {
      continue;
    }

    const normalizedRows = rawRows
      .map(normalizeClanRow)
      .filter(row => row.clan_name && row.points !== null);

    const calculated = calculateBattleRows(normalizedRows);

    output.push({
      battle: item.battle,
      display_name: item.display_name,
      source_table: item.source_table,
      generated_at: new Date().toISOString(),
      snapshot_at: calculated.snapshot_at,
      rows: calculated.rows
    });

    console.log(`  latest rows: ${calculated.rows.length}`);
  }

  output.sort((a, b) => {
    return String(a.display_name || a.battle || "").localeCompare(
      String(b.display_name || b.battle || "")
    );
  });

  await fs.mkdir(DATA_DIR, { recursive: true });

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log(`Historical clan battles written: ${output.length}`);
  console.log(`Updated ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
