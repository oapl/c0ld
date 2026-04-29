// ingest.js
// Fetches clan leaderboard from the Big Games API, stores a snapshot in
// Supabase, computes the 60-minute point gain for each member, updates
// README.md, and posts a Discord webhook embed.
//
// Required env vars (add as GitHub Actions secrets):
//   SUPABASE_URL          – e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  – service-role key (has full DB access)
//   DISCORD_WEBHOOK_URL   – Discord incoming-webhook URL
//
// Optional env vars (have sensible defaults):
//   CLAN_NAME   – default "NONG"
//   TOP_N       – number of members to show, default 10

const fs = require("fs/promises");

// ── Config ────────────────────────────────────────────────────────────────────
const CLAN_NAME       = process.env.CLAN_NAME            || "NONG";
const SUPABASE_URL    = (process.env.SUPABASE_URL        || "").replace(/\/$/, "");
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL  || "";
const TOP_N           = parseInt(process.env.TOP_N || "10", 10);

const BIG_GAMES_API   = `https://biggamesapi.io/api/clan/${encodeURIComponent(CLAN_NAME)}`;
const TABLE           = "leaderboard_snapshots";

// Fetch a batch older than this many minutes to compute the 60-min gain.
// With a 15-min schedule the snapshot closest to 60 min ago will be the one
// taken ~60 min back, sitting just past the 45-min cutoff.
const GAIN_CUTOFF_MIN = 45;
// Delete snapshots older than this many hours to keep the table small.
const KEEP_HOURS      = 48;

// README markers
const README_PATH = "README.md";
const LB_START    = "<!-- START_LEADERBOARD -->";
const LB_END      = "<!-- END_LEADERBOARD -->";
const UPD_START   = "<!-- START_UPDATED -->";
const UPD_END     = "<!-- END_UPDATED -->";

// Returns the contribution/points value for a member, handling both field names
// the Big Games API has used across different game versions.
function getMemberPoints(m) {
  return m.ContributionPoints ?? m.Points ?? 0;
}

// ── Big Games API ─────────────────────────────────────────────────────────────
async function fetchClanMembers() {
  const res = await fetch(BIG_GAMES_API, {
    headers: { "User-Agent": "NONG-Leaderboard-Ingest" }
  });
  if (!res.ok) {
    throw new Error(`Big Games API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.status !== "ok") {
    throw new Error(`Big Games API returned status: ${json.status}`);
  }

  const members = json.data?.Members ?? [];
  const filtered = [...members].filter(m => m.UserName);

  if (filtered.length === 0) {
    // Log the raw response so we can diagnose why no members were returned
    // (e.g. wrong clan name, changed API structure, clan has no members).
    console.warn("WARNING: 0 members found. Raw API response:");
    console.warn(JSON.stringify(json, null, 2));
  }

  // Sort descending by contribution points and assign ranks
  return filtered
    .sort((a, b) => getMemberPoints(b) - getMemberPoints(a))
    .map((m, i) => ({
      rank:         i + 1,
      username:     m.UserName,
      total_points: getMemberPoints(m)
    }));
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────
function sbHeaders(extra = {}) {
  return {
    apikey:        SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function sbInsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method:  "POST",
    headers: sbHeaders({ Prefer: "return=minimal" }),
    body:    JSON.stringify(rows)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${msg}`);
  }
}

// Returns all rows with fetched_at < beforeIso, newest-first (up to 500 rows).
// The caller picks the most-recent distinct batch from this result set.
async function sbGetOldSnapshots(beforeIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  url.searchParams.set("fetched_at", `lt.${beforeIso}`);
  url.searchParams.set("order",      "fetched_at.desc");
  url.searchParams.set("limit",      "500");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${msg}`);
  }
  return res.json();
}

async function sbDeleteOld(olderThanIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  url.searchParams.set("fetched_at", `lt.${olderThanIso}`);
  const res = await fetch(url.toString(), {
    method:  "DELETE",
    headers: sbHeaders()
  });
  if (!res.ok) {
    const msg = await res.text();
    // Non-fatal: log a warning and continue
    console.warn(`Supabase cleanup warning (${res.status}): ${msg}`);
  }
}

// ── 60-min gain ───────────────────────────────────────────────────────────────
function computeGains(current, oldRows) {
  if (!oldRows.length) {
    return current.map(m => ({ ...m, gain_60m: null }));
  }

  // The rows are sorted newest-first; take the most-recent batch (same fetched_at)
  const latestOldTs = oldRows[0].fetched_at;
  const oldBatch    = oldRows.filter(r => r.fetched_at === latestOldTs);
  // PostgREST returns BIGINT columns as strings in JSON; coerce to number.
  const oldByName   = new Map(oldBatch.map(r => [r.username, Number(r.total_points)]));

  return current.map(m => ({
    ...m,
    gain_60m: oldByName.has(m.username)
      ? m.total_points - oldByName.get(m.username)
      : null
  }));
}

// ── Formatting helpers ────────────────────────────────────────────────────────
function fmtNum(n) {
  return n != null ? Number(n).toLocaleString("en-US") : "N/A";
}

function escapePipe(s) {
  // Escape backslashes first, then pipes, so the resulting markdown is valid.
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|").trim();
}

// ── README update ─────────────────────────────────────────────────────────────
async function updateReadme(rows, updatedAt) {
  const lines = [
    "| Rank | Member | Total Points | 60m Gain |",
    "|---:|---|---:|---:|",
    ...rows.slice(0, TOP_N).map(r =>
      `| ${escapePipe(r.rank)} | ${escapePipe(r.username)} | ${fmtNum(r.total_points)} | ${fmtNum(r.gain_60m)} |`
    )
  ];

  let readme = await fs.readFile(README_PATH, "utf8");

  readme = readme.replace(
    new RegExp(`${LB_START}[\\s\\S]*?${LB_END}`, "m"),
    `${LB_START}\n${lines.join("\n")}\n${LB_END}`
  );
  readme = readme.replace(
    new RegExp(`${UPD_START}[\\s\\S]*?${UPD_END}`, "m"),
    `${UPD_START}\n${updatedAt}\n${UPD_END}`
  );

  await fs.writeFile(README_PATH, readme, "utf8");
  console.log("README updated.");
}

// ── Discord webhook ───────────────────────────────────────────────────────────
async function postDiscord(rows, updatedAt) {
  if (!DISCORD_WEBHOOK) return;

  const top = rows.slice(0, TOP_N);

  // Build three inline columns that line up in the embed
  const memberCol = top.map(r => `**${r.rank}.** ${r.username}`).join("\n");
  const ptsCol    = top.map(r => fmtNum(r.total_points)).join("\n");
  const gainCol   = top.map(r => fmtNum(r.gain_60m)).join("\n");

  const embed = {
    title:  `🏆 ${CLAN_NAME} Clan Leaderboard`,
    color:  0xf5a623, // gold
    fields: [
      { name: "Member",        value: memberCol, inline: true },
      { name: "Total Points",  value: ptsCol,    inline: true },
      { name: "60m Gain",      value: gainCol,   inline: true }
    ],
    footer:    { text: `Updated ${updatedAt}` },
    timestamp: new Date().toISOString()
  };

  const res = await fetch(DISCORD_WEBHOOK, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ embeds: [embed] })
  });
  if (!res.ok) {
    const msg = await res.text();
    console.warn(`Discord webhook failed (${res.status}): ${msg}`);
  } else {
    console.log("Discord webhook posted.");
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const now      = new Date();
  const nowIso   = now.toISOString();
  // Format as "YYYY-MM-DD HH:MM:SS UTC" using explicit UTC component accessors.
  const pad = n => String(n).padStart(2, "0");
  const updatedAt =
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ` +
    `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;

  console.log(`Fetching clan data for "${CLAN_NAME}"…`);
  const members = await fetchClanMembers();
  console.log(`Fetched ${members.length} members.`);

  let withGains = members.map(m => ({ ...m, gain_60m: null }));

  if (SUPABASE_URL && SUPABASE_KEY) {
    // 1. Retrieve snapshot from ~60 min ago (anything older than 45 min)
    const cutoffIso = new Date(now - GAIN_CUTOFF_MIN * 60 * 1000).toISOString();
    const oldRows   = await sbGetOldSnapshots(cutoffIso);
    withGains       = computeGains(members, oldRows);
    console.log(`Found ${oldRows.length} historical rows for gain calculation.`);

    // 2. Insert current snapshot
    const toInsert = members.map(m => ({
      fetched_at:   nowIso,
      rank:         m.rank,
      username:     m.username,
      total_points: m.total_points
    }));
    await sbInsert(toInsert);
    console.log(`Inserted ${toInsert.length} rows into Supabase.`);

    // 3. Prune old data
    const pruneIso = new Date(now - KEEP_HOURS * 60 * 60 * 1000).toISOString();
    await sbDeleteOld(pruneIso);
    console.log("Old snapshots pruned.");
  } else {
    console.warn("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping DB operations. 60m gain will show as N/A.");
  }

  await updateReadme(withGains, updatedAt);
  await postDiscord(withGains, updatedAt);

  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
