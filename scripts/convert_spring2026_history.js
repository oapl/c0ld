/**
 * convert_spring2026_history.js
 *
 * One-shot conversion: reads Data/NONG PS99 CB-DB - PS99 History_Spring2026.tsv
 * and writes Data/spring2026_archive_import.csv, ready to import into the
 * Supabase Spring2026Archive table (fetched_at, rank, username, total_points).
 *
 * Usage:
 *   node scripts/convert_spring2026_history.js
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ── Paths ─────────────────────────────────────────────────────────────────────
const REPO_ROOT = path.resolve(__dirname, "..");
const TSV_PATH  = path.join(REPO_ROOT, "Data", "NONG PS99 CB-DB - PS99 History_Spring2026.tsv");
const CSV_PATH  = path.join(REPO_ROOT, "Data", "spring2026_archive_import.csv");

// ── Timestamp parser ──────────────────────────────────────────────────────────
/**
 * Parses a timestamp string of the form "M/D/YYYY H:MM:SS AM/PM" (UTC) into
 * an ISO-8601 UTC string like "YYYY-MM-DDTHH:MM:SSZ".
 */
function parseSnapshotTime(raw) {
  // e.g. "4/25/2026 1:09:36 PM"
  const m = raw.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i
  );
  if (!m) throw new Error(`Cannot parse SnapshotTime: "${raw}"`);

  let [, mon, day, year, hr, min, sec, ampm] = m;
  hr  = parseInt(hr,  10);
  min = parseInt(min, 10);
  sec = parseInt(sec, 10);

  // 12-hour → 24-hour conversion
  if (ampm.toUpperCase() === "AM") {
    if (hr === 12) hr = 0;          // 12:xx AM → 00:xx
  } else {
    if (hr !== 12) hr += 12;        // 1–11 PM  → 13–23
  }

  // Zero-pad each component
  const pad = n => String(n).padStart(2, "0");
  return `${year}-${pad(mon)}-${pad(day)}T${pad(hr)}:${pad(min)}:${pad(sec)}Z`;
}

// ── CSV field quoting ─────────────────────────────────────────────────────────
/**
 * Wraps a field in double-quotes only when required by RFC 4180
 * (contains comma, double-quote, or newline). Escapes embedded quotes by
 * doubling them.
 */
function csvField(value) {
  const s = String(value);
  if (/[,"\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const raw   = fs.readFileSync(TSV_PATH, "utf8");
  // Normalise line endings: strip \r, split on \n
  const lines = raw.replace(/\r/g, "").split("\n");

  const csvRows = ["fetched_at,rank,username,total_points"];
  let snapshotCount = 0;
  let rowsWritten   = 0;

  let fetchedAt = null;   // current snapshot's ISO timestamp
  let inData    = false;  // true once we've passed the column-header row

  for (const line of lines) {
    const fields = line.split("\t");

    // ── Snapshot header line ─────────────────────────────────────────────────
    if (fields[0] === "SnapshotTime") {
      // fields[1] is the raw timestamp value
      fetchedAt = parseSnapshotTime(fields[1]);
      snapshotCount++;
      inData = false;  // next line will be the column-header row; skip it
      continue;
    }

    // ── Column-header row (immediately after SnapshotTime) ───────────────────
    if (!inData && fetchedAt !== null && fields[0] === "Rank") {
      inData = true;  // start reading data rows after this
      continue;
    }

    // ── Data rows ────────────────────────────────────────────────────────────
    if (inData && fetchedAt !== null) {
      const rankRaw     = fields[0] ? fields[0].trim() : "";
      const rank        = parseInt(rankRaw, 10);

      // Padding / blank rows have a non-integer (empty) rank cell → skip
      if (!rankRaw || isNaN(rank) || rank <= 0) continue;

      const username = fields[3] ? fields[3].trim() : "";
      // Skip rows without a username
      if (!username) continue;

      // Strip commas from the points field; blank → 0
      const pointsRaw   = fields[5] ? fields[5].trim() : "";
      const totalPoints = pointsRaw ? parseInt(pointsRaw.replace(/,/g, ""), 10) : 0;

      csvRows.push(
        `${fetchedAt},${rank},${csvField(username)},${totalPoints}`
      );
      rowsWritten++;
    }
  }

  fs.writeFileSync(CSV_PATH, csvRows.join("\n") + "\n", "utf8");

  console.log(`${snapshotCount} snapshots, ${rowsWritten} rows written`);
  console.log(`Output: ${CSV_PATH}`);
}

main();
