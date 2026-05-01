// scripts/build-clan-history.js
// Builds Data/clans-history.json from manually declared historical clan tables.
//
// Reads:
//   Data/manual-battles.json
//
// For each manual battle with:
//   clan_results_battle = website dropdown/URL key, ex: PoisonTurtleNONG
//   clan_results_table  = Supabase top-clans table, ex: PoisonTurtleClans
//
// Output:
//   Data/clans-history.json
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY

const fs = require("fs/promises");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const DATA_DIR = path.join(process.cwd(), "Data");
const MANUAL_BATTLES_FILE = path.join(DATA_DIR, "manual-battles.json");
const OUTPUT_FILE = path.join(DATA_DIR, "clans-history.json");

const PAGE_SIZE = 1000;

if (!SUPABASE_URL) {
  throw new Error("Missing required env var: SUPABASE_URL");
}

if (!SUPABASE_KEY) {
  throw new Error("Missing required env var: SUPABASE_SERVICE_KEY");
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

function dateOrNull(value) {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
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

async function supabaseSelectAll(tableName) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const url =
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}` +
      `?select=*` +
      `&order=rank.asc.nullslast`;

    const res = await fetch(url, {
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
      throw new Error(`Supabase query failed for ${tableName}: HTTP ${res.status} ${text}`);
    }

    const batch = await res.json();

    if (!Array.isArray(batch)) {
      throw new Error(`Supabase response for ${tableName} was not an array.`);
    }

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

function normalizeClanRow(row) {
  return {
    rank: numberOrNull(row.rank),
    clan: stringOrNull(row.clan || row.clan_name || row.name || row.tag),
    points: numberOrNull(row.points ?? row.total_points),
    created_at: dateOrNull(row.created_at || row.fetched_at || row.snapshot_at)
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

    if (ap !== bp) {
      return bp - ap;
    }

    return String(a.clan || "").localeCompare(String(b.clan || ""));
  });

  return rows;
}

async function main() {
  const manualBattles = await readJsonArray(MANUAL_BATTLES_FILE);

  const declared = manualBattles
    .filter(battle => battle.clan_results_battle && battle.clan_results_table)
    .map(battle => ({
      battle: String(battle.clan_results_battle),
      display_name: String(battle.display_name || battle.battle || battle.clan_results_battle),
      source_table: String(battle.clan_results_table),
      manual_battle: String(battle.battle || battle.display_name || battle.clan_results_battle)
    }));

  const deduped = new Map();

  for (const item of declared) {
    deduped.set(normalizeKey(item.battle), item);
  }

  const output = [];

  for (const item of deduped.values()) {
    console.log(`Reading historical clan table: ${item.source_table} -> ${item.battle}`);

    const rawRows = await supabaseSelectAll(item.source_table);

    const rows = sortRows(
      rawRows
        .map(normalizeClanRow)
        .filter(row => row.clan && row.points !== null)
    );

    output.push({
      battle: item.battle,
      display_name: item.display_name,
      source_table: item.source_table,
      generated_at: new Date().toISOString(),
      rows
    });

    console.log(`  rows: ${rows.length}`);
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
