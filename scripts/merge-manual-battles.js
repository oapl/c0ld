// scripts/merge-manual-battles.js
// Merges Data/manual-battles.json into Data/battles.json.
//
// Rule:
//   Placement/rank is ALWAYS manual.
//   Generated battle summaries may provide dates/counts/unique player data,
//   but placement only comes from Data/manual-battles.json.
//
// Input:
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
    .toLowerCase();
}

function safeNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeStringOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function safeDateOrNull(value) {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
}

function cleanBattleRecord(record) {
  return {
    battle: safeStringOrNull(record.battle || record.display_name),
    display_name: safeStringOrNull(record.display_name || record.battle),
    first_snapshot: safeDateOrNull(record.first_snapshot),
    last_snapshot: safeDateOrNull(record.last_snapshot),
    total_snapshots: safeNumberOrNull(record.total_snapshots),
    total_rows: safeNumberOrNull(record.total_rows),
    unique_players: safeNumberOrNull(record.unique_players),
    placement: safeNumberOrNull(record.placement)
  };
}

function mergeBattleRecord(generated, manual) {
  return {
    battle: generated.battle || manual.battle,
    display_name: manual.display_name ?? generated.display_name,

    // Prefer generated dates/counts when they exist because they are based on real snapshots.
    // Manual values fill gaps for older battles.
    first_snapshot: generated.first_snapshot ?? manual.first_snapshot,
    last_snapshot: generated.last_snapshot ?? manual.last_snapshot,
    total_snapshots: generated.total_snapshots ?? manual.total_snapshots,
    total_rows: generated.total_rows ?? manual.total_rows,
    unique_players: generated.unique_players ?? manual.unique_players,

    // Placement is ALWAYS manual.
    placement: manual.placement ?? null
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

async function readJsonArray(filePath, fallback = []) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error(`${filePath} must contain a JSON array.`);
    }

    return parsed;
  } catch (err) {
    if (err.code === "ENOENT") {
      return fallback;
    }

    throw err;
  }
}

async function main() {
  const generatedRaw = await readJsonArray(GENERATED_FILE, []);
  const manualRaw = await readJsonArray(MANUAL_FILE, []);

  const generated = generatedRaw
    .map(cleanBattleRecord)
    .filter(record => record.battle && record.display_name);

  const manual = manualRaw
    .map(cleanBattleRecord)
    .filter(record => record.battle && record.display_name);

  const manualMap = new Map();
  const generatedMap = new Map();

  for (const record of manual) {
    manualMap.set(normalizeBattleKey(record.battle), record);
  }

  for (const record of generated) {
    generatedMap.set(normalizeBattleKey(record.battle), record);
  }

  const allKeys = new Set([
    ...manualMap.keys(),
    ...generatedMap.keys()
  ]);

  const merged = [];

  for (const key of allKeys) {
    const manualRecord = manualMap.get(key);
    const generatedRecord = generatedMap.get(key);

    if (manualRecord && generatedRecord) {
      merged.push(mergeBattleRecord(generatedRecord, manualRecord));
      continue;
    }

    if (manualRecord && !generatedRecord) {
      // Manual-only historical battle.
      merged.push({
        ...manualRecord,
        placement: manualRecord.placement ?? null
      });
      continue;
    }

    if (!manualRecord && generatedRecord) {
      // Generated battle with no manual placement yet.
      merged.push({
        ...generatedRecord,
        placement: null
      });
    }
  }

  merged.sort(sortBattles);

  await fs.writeFile(
    GENERATED_FILE,
    JSON.stringify(merged, null, 2) + "\n",
    "utf8"
  );

  console.log(`Manual battles loaded: ${manual.length}`);
  console.log(`Generated battles loaded: ${generated.length}`);
  console.log(`Final battles written: ${merged.length}`);
  console.log("Placement source: manual-battles.json only");
  console.log(`Updated ${GENERATED_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
