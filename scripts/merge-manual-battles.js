// scripts/merge-manual-battles.js
// Merges Data/manual-battles.json into Data/battles.json.
//
// Source of truth rules:
//   - placement is ALWAYS manual
//   - update_number is ALWAYS manual
//   - update_url is ALWAYS manual
//   - clan_results_battle is ALWAYS manual
//   - clan_results_table is ALWAYS manual
//   - manual display_name wins when present
//   - manual dates/counts win when present, otherwise generated fills gaps
//   - duplicate battle rows are collapsed into one row
//
// Inputs:
//   Data/battles.json
//   Data/manual-battles.json
//
// Output:
//   Data/battles.json

const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "Data");
const GENERATED_FILE = path.join(DATA_DIR, "battles.json");
const MANUAL_FILE = path.join(DATA_DIR, "manual-battles.json");

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

function cleanManualRecord(record) {
  const battle = stringOrNull(record.battle || record.display_name);
  const displayName = stringOrNull(record.display_name || record.battle);

  return {
    battle,
    display_name: displayName,

    first_snapshot: dateOrNull(record.first_snapshot),
    last_snapshot: dateOrNull(record.last_snapshot),

    total_snapshots: numberOrNull(record.total_snapshots),
    total_rows: numberOrNull(record.total_rows),
    unique_players: numberOrNull(record.unique_players),

    placement: numberOrNull(record.placement),
    update_number: numberOrNull(record.update_number),
    update_url: stringOrNull(record.update_url),

    clan_results_battle: stringOrNull(record.clan_results_battle),
    clan_results_table: stringOrNull(record.clan_results_table)
  };
}

function cleanGeneratedRecord(record) {
  const battle = stringOrNull(record.battle || record.display_name);
  const displayName = stringOrNull(record.display_name || record.battle);

  return {
    battle,
    display_name: displayName,

    first_snapshot: dateOrNull(record.first_snapshot),
    last_snapshot: dateOrNull(record.last_snapshot),

    total_snapshots: numberOrNull(record.total_snapshots),
    total_rows: numberOrNull(record.total_rows),
    unique_players: numberOrNull(record.unique_players)
  };
}

function preferBetterGenerated(existing, incoming) {
  if (!existing) return incoming;

  return {
    battle: existing.battle || incoming.battle,
    display_name: existing.display_name || incoming.display_name,

    first_snapshot: existing.first_snapshot ?? incoming.first_snapshot,
    last_snapshot: existing.last_snapshot ?? incoming.last_snapshot,

    total_snapshots: existing.total_snapshots ?? incoming.total_snapshots,
    total_rows: existing.total_rows ?? incoming.total_rows,
    unique_players: existing.unique_players ?? incoming.unique_players
  };
}

function preferBetterManual(existing, incoming) {
  if (!existing) return incoming;

  return {
    battle: incoming.battle || existing.battle,
    display_name: incoming.display_name || existing.display_name,

    first_snapshot: incoming.first_snapshot ?? existing.first_snapshot,
    last_snapshot: incoming.last_snapshot ?? existing.last_snapshot,

    total_snapshots: incoming.total_snapshots ?? existing.total_snapshots,
    total_rows: incoming.total_rows ?? existing.total_rows,
    unique_players: incoming.unique_players ?? existing.unique_players,

    placement: incoming.placement ?? existing.placement ?? null,
    update_number: incoming.update_number ?? existing.update_number ?? null,
    update_url: incoming.update_url ?? existing.update_url ?? null,

    clan_results_battle: incoming.clan_results_battle ?? existing.clan_results_battle ?? null,
    clan_results_table: incoming.clan_results_table ?? existing.clan_results_table ?? null
  };
}

function mergeRecord(manual, generated) {
  return {
    battle: manual?.battle || generated?.battle || null,
    display_name: manual?.display_name || generated?.display_name || null,

    first_snapshot: manual?.first_snapshot ?? generated?.first_snapshot ?? null,
    last_snapshot: manual?.last_snapshot ?? generated?.last_snapshot ?? null,

    total_snapshots: manual?.total_snapshots ?? generated?.total_snapshots ?? null,
    total_rows: manual?.total_rows ?? generated?.total_rows ?? null,
    unique_players: manual?.unique_players ?? generated?.unique_players ?? null,

    placement: manual?.placement ?? null,
    update_number: manual?.update_number ?? null,
    update_url: manual?.update_url ?? null,

    clan_results_battle: manual?.clan_results_battle ?? null,
    clan_results_table: manual?.clan_results_table ?? null
  };
}

function sortBattles(a, b) {
  const ad = a.last_snapshot ? new Date(a.last_snapshot).getTime() : 0;
  const bd = b.last_snapshot ? new Date(b.last_snapshot).getTime() : 0;

  if (ad !== bd) return bd - ad;

  return String(a.display_name || a.battle || "").localeCompare(
    String(b.display_name || b.battle || "")
  );
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

async function main() {
  const generatedRaw = await readJsonArray(GENERATED_FILE);
  const manualRaw = await readJsonArray(MANUAL_FILE);

  const generatedMap = new Map();
  const manualMap = new Map();

  for (const raw of generatedRaw) {
    const record = cleanGeneratedRecord(raw);
    if (!record.battle || !record.display_name) continue;

    const key = normalizeKey(record.battle);
    generatedMap.set(key, preferBetterGenerated(generatedMap.get(key), record));
  }

  for (const raw of manualRaw) {
    const record = cleanManualRecord(raw);
    if (!record.battle || !record.display_name) continue;

    const key = normalizeKey(record.battle);
    manualMap.set(key, preferBetterManual(manualMap.get(key), record));
  }

  const allKeys = new Set([
    ...generatedMap.keys(),
    ...manualMap.keys()
  ]);

  const finalRecords = [];

  for (const key of allKeys) {
    const generated = generatedMap.get(key) || null;
    const manual = manualMap.get(key) || null;

    const merged = mergeRecord(manual, generated);

    if (merged.battle && merged.display_name) {
      finalRecords.push(merged);
    }
  }

  finalRecords.sort(sortBattles);

  await fs.writeFile(
    GENERATED_FILE,
    JSON.stringify(finalRecords, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated raw battles read: ${generatedRaw.length}`);
  console.log(`Manual raw battles read: ${manualRaw.length}`);
  console.log(`Generated unique battles: ${generatedMap.size}`);
  console.log(`Manual unique battles: ${manualMap.size}`);
  console.log(`Final battles written: ${finalRecords.length}`);
  console.log("Manual-only fields preserved:");
  console.log("  - placement");
  console.log("  - update_number");
  console.log("  - update_url");
  console.log("  - clan_results_battle");
  console.log("  - clan_results_table");
  console.log(`Updated ${GENERATED_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
