const fs = require("fs/promises");

const SOURCE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1JIhSVcbfgEFlz7L20qkQ1QiY95Y0ZZsl8DJmbuB7GJw/gviz/tq?tqx=out:csv&sheet=c0ld%20Leaderboard";

const README_PATH = "README.md";
const START_MARKER = "<!-- START_LEADERBOARD -->";
const END_MARKER = "<!-- END_LEADERBOARD -->";
const UPDATED_START = "<!-- START_UPDATED -->";
const UPDATED_END = "<!-- END_UPDATED -->";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(value);
        value = "";
      } else if (ch === "\n") {
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      } else if (ch === "\r") {
        // ignore CR
      } else {
        value += ch;
      }
    }
  }

  row.push(value);
  rows.push(row);
  return rows.filter(r => r.some(cell => String(cell).trim() !== ""));
}

function escapePipe(s) {
  return String(s ?? "").replace(/\|/g, "\\|").trim();
}

function findHeaderIndex(headers, target) {
  const normalized = headers.map(h => String(h).trim().toLowerCase());
  return normalized.indexOf(target.trim().toLowerCase());
}

async function main() {
  const res = await fetch(SOURCE_CSV_URL, {
    headers: { "User-Agent": "c0ld-Leaderboard-README-Updater" }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }

  const csvText = await res.text();
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    throw new Error("CSV did not contain enough rows.");
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const rankIdx = findHeaderIndex(headers, "RANK");
  const nameIdx = findHeaderIndex(headers, "USERNAME");
  const pointsIdx = findHeaderIndex(headers, "TOTAL POINTS");
  const gain60Idx = findHeaderIndex(headers, "60 MINUTES");

  if ([rankIdx, nameIdx, pointsIdx, gain60Idx].some(i => i === -1)) {
    throw new Error(
      `Could not find required headers. Found headers: ${headers.join(" | ")}`
    );
  }

  const top10 = dataRows
    .filter(r => String(r[nameIdx] || "").trim() !== "")
    .slice(0, 10)
    .map(r => ({
      rank: escapePipe(r[rankIdx]),
      name: escapePipe(r[nameIdx]),
      points: escapePipe(r[pointsIdx]),
      gain60: escapePipe(r[gain60Idx])
    }));

  const lines = [];
  lines.push("| Rank | Member | Total Points | 60m Gain |");
  lines.push("|---:|---|---:|---:|");

  for (const row of top10) {
    lines.push(`| ${row.rank} | ${row.name} | ${row.points} | ${row.gain60} |`);
  }

  const leaderboardBlock = lines.join("\n");
  const updatedBlock = new Date().toISOString().replace("T", " ").replace("Z", " UTC");

  let readme = await fs.readFile(README_PATH, "utf8");

  const leaderboardRegex = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
    "m"
  );
  const updatedRegex = new RegExp(
    `${UPDATED_START}[\\s\\S]*?${UPDATED_END}`,
    "m"
  );

  readme = readme.replace(
    leaderboardRegex,
    `${START_MARKER}\n${leaderboardBlock}\n${END_MARKER}`
  );

  readme = readme.replace(
    updatedRegex,
    `${UPDATED_START}\n${updatedBlock}\n${UPDATED_END}`
  );

  await fs.writeFile(README_PATH, readme, "utf8");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
