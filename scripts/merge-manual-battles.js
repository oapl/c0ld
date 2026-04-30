// scripts/merge-manual-battles.js
// Merges Data/manual-battles.json into Data/battles.json.
//
// Source of truth rules:
//   - placement is ALWAYS manual
//   - update_number is ALWAYS manual
//   - update_url is ALWAYS manual
//   - generated data may fill only snapshot/count fields
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

function normalizeBattleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

    // Manual-only fields.
    placement: numberOrNull(record.placement),
    update_number: numberOrNull(record.update_number),
    update_url: stringOrNull(record.update_url)
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

    // Do NOT read placement/update fields from generated records.
  };
}

function mergeRecord(manual, generated) {
  return {
    battle: manual?.battle || generated?.battle || null,
    display_name: manual?.display_name || generated?.display_name || null,

    // Prefer manual dates if present. Generated fills gaps only.
    first_snapshot: manual?.first_snapshot ?? generated?.first_snapshot ?? null,
    last_snapshot: manual?.last_snapshot ?? generated?.last_snapshot ?? null,

    // Prefer manual counts if present. Generated fills gaps only.
    total_snapshots: manual?.total_snapshots ?? generated?.total_snapshots ?? null,
    total_rows: manual?.total_rows ?? generated?.total_rows ?? null,
    unique_players: manual?.unique_players ?? generated?.unique_players ?? null,

    // Always manual. Never generated.
    placement: manual?.placement ?? null,
    update_number: manual?.update_number ?? null,
    update_url: manual?.update_url ?? null
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

  const generatedRecords = generatedRaw
    .map(cleanGeneratedRecord)
    .filter(record => record.battle && record.display_name);

  const manualRecords = manualRaw
    .map(cleanManualRecord)
    .filter(record => record.battle && record.display_name);

  const generatedMap = new Map();
  const manualMap = new Map();

  for (const record of generatedRecords) {
    generatedMap.set(normalizeBattleKey(record.battle), record);
  }

  for (const record of manualRecords) {
    manualMap.set(normalizeBattleKey(record.battle), record);
  }

  const allKeys = new Set([
    ...generatedMap.keys(),
    ...manualMap.keys()
  ]);

  const merged = [];

  for (const key of allKeys) {
    const generated = generatedMap.get(key) || null;
    const manual = manualMap.get(key) || null;

    merged.push(mergeRecord(manual, generated));
  }

  const finalRecords = merged
    .filter(record => record.battle && record.display_name)
    .sort(sortBattles);

  await fs.writeFile(
    GENERATED_FILE,
    JSON.stringify(finalRecords, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated battles read: ${generatedRecords.length}`);
  console.log(`Manual battles read: ${manualRecords.length}`);
  console.log(`Final battles written: ${finalRecords.length}`);
  console.log("Manual-only fields preserved:");
  console.log("  - placement");
  console.log("  - update_number");
  console.log("  - update_url");
  console.log(`Updated ${GENERATED_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
