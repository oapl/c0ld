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
const DISCORD_WEBHOOK     = process.env.DISCORD_WEBHOOK_URL   || "";
const DISCORD_MESSAGE_IDS = process.env.DISCORD_MESSAGE_IDS   || "";
const TOP_N               = parseInt(process.env.TOP_N || "10", 10);

const BIG_GAMES_API   = `https://biggamesapi.io/api/clan/${encodeURIComponent(CLAN_NAME)}`;
const TABLE           = "leaderboard_snapshots";
const ARCHIVE_TABLE   = "StarryBattleArchive";

// 60-min gain window configuration.
// GAIN_TARGET_MIN: target snapshot age in minutes (we want the snapshot from ~60 min ago).
// GAIN_WINDOW_MIN: ± tolerance in minutes; first try snapshots in [TARGET-WINDOW, TARGET+WINDOW].
// If none found in that tight window, fall back to the most recent snapshot older than
// (GAIN_TARGET_MIN - GAIN_WINDOW_MIN) minutes (preserves existing behaviour).
const GAIN_TARGET_MIN = 60;
const GAIN_WINDOW_MIN = 5;
// Delete snapshots older than this many hours to keep the table small.
const KEEP_HOURS      = 48;

// README markers
const README_PATH = "README.md";
const LB_START    = "<!-- START_LEADERBOARD -->";
const LB_END      = "<!-- END_LEADERBOARD -->";
const UPD_START   = "<!-- START_UPDATED -->";
const UPD_END     = "<!-- END_UPDATED -->";

// Resolves an array of Roblox UserIDs to a Map<id, username> in batches of 100.
// Falls back to "user_<UserID>" for any ID that can't be resolved.
async function resolveRobloxUsernames(userIds) {
  const ROBLOX_USERS_API = "https://users.roblox.com/v1/users";
  const BATCH_SIZE = 100;
  const result = new Map();

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(ROBLOX_USERS_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userIds: batch, excludeBannedUsers: false })
      });
      if (res.ok) {
        const json = await res.json();
        for (const user of (json.data ?? [])) {
          result.set(user.id, user.name);
        }
      } else {
        console.warn(`Roblox Users API error (${res.status}) for batch starting at index ${i} — falling back to user_<ID>`);
      }
    } catch (err) {
      console.warn(`Roblox Users API request failed for batch starting at index ${i}: ${err.message} — falling back to user_<ID>`);
    }
    // Apply fallback for any IDs not resolved in this batch
    for (const id of batch) {
      if (!result.has(id)) {
        result.set(id, `user_${id}`);
      }
    }
  }

  return result;
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

  if (members.length === 0) {
    console.warn("WARNING: 0 members found. Raw API response:");
    console.warn(JSON.stringify(json, null, 2));
    return { members: [], starryBattle: null };
  }

  // Build a Set of current member UserIDs for filtering contributions
  const memberIdSet = new Set(members.map(m => m.UserID));

  // Capture the raw StarryBattle object for archiving checks
  const starryBattle = json.data?.Battles?.StarryBattle ?? null;

  // Build UserID → Points map from StarryBattle contributions, restricted to current members
  const pointData = starryBattle?.PointContributions ?? [];
  const points = new Map(
    pointData
      .filter(d => memberIdSet.has(d.UserID))
      .map(d => [d.UserID, d.Points ?? 0])
  );

  // Resolve Roblox usernames for all member UserIDs
  const userIds = members.map(m => m.UserID);
  const usernameMap = await resolveRobloxUsernames(userIds);

  // Sort descending by points and assign ranks
  const ranked = members
    .map(m => ({
      user_id:      m.UserID,
      username:     usernameMap.get(m.UserID) ?? `user_${m.UserID}`,
      total_points: points.get(m.UserID) ?? 0
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((m, i) => ({
      rank:         i + 1,
      user_id:      m.user_id,
      username:     m.username,
      total_points: m.total_points
    }));

  return { members: ranked, starryBattle };
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

// Returns rows with fetched_at strictly between afterIso and beforeIso, newest-first (up to 500).
// Used for the tight ~60-min window query.
async function sbGetSnapshotsInWindow(afterIso, beforeIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  url.searchParams.append("fetched_at", `gt.${afterIso}`);
  url.searchParams.append("fetched_at", `lt.${beforeIso}`);
  url.searchParams.set("order", "fetched_at.desc");
  url.searchParams.set("limit", "500");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase window query failed (${res.status}): ${msg}`);
  }
  return res.json();
}

// ── StarryBattle archive helpers ──────────────────────────────────────────────

// Returns the battle_id of the most recently archived StarryBattle, or null if none.
async function sbGetLatestArchivedBattleId() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`);
  url.searchParams.set("select", "battle_id");
  url.searchParams.set("order",  "archived_at.desc");
  url.searchParams.set("limit",  "1");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase archive query failed (${res.status}): ${msg}`);
  }
  const rows = await res.json();
  return rows[0]?.battle_id ?? null;
}

// Inserts rows into StarryBattleArchive.
async function sbInsertArchive(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`, {
    method:  "POST",
    headers: sbHeaders({ Prefer: "return=minimal" }),
    body:    JSON.stringify(rows)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase archive insert failed (${res.status}): ${msg}`);
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

// Abbreviates large numbers with K / M / B / T suffixes (up to 2 decimal places,
// trailing zeros trimmed). Returns "N/A" for null/undefined.
// Examples: 1250 → "1.25K", 1_500_000 → "1.5M", 2_300_000_000 → "2.3B"
function fmtAbbrev(n) {
  if (n == null) return "N/A";
  const num = Number(n);
  const tiers = [
    { threshold: 1e12, suffix: "T" },
    { threshold: 1e9,  suffix: "B" },
    { threshold: 1e6,  suffix: "M" },
    { threshold: 1e3,  suffix: "K" }
  ];
  for (const { threshold, suffix } of tiers) {
    if (Math.abs(num) >= threshold) {
      const val = (num / threshold).toFixed(2).replace(/\.?0+$/, "");
      return `${val}${suffix}`;
    }
  }
  return String(num);
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
      `| ${escapePipe(r.rank)} | ${escapePipe(r.username)} | ${fmtAbbrev(r.total_points)} | ${fmtAbbrev(r.gain_60m)} |`
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

  const match = DISCORD_WEBHOOK.match(/webhooks\/(\d+)\/(.+)/);
  if (!match) {
    console.warn("Discord webhook URL is malformed — skipping.");
    return;
  }
  const [, webhookId, webhookToken] = match;

  const messageIds = DISCORD_MESSAGE_IDS.split(",").map(s => s.trim()).filter(Boolean);

  const PAGE_SIZE   = 25;
  const TOTAL_PAGES = 3;

  for (let p = 0; p < TOTAL_PAGES; p++) {
    const page = rows.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
    const messageId = messageIds[p];

    // Skip empty pages that have no existing message to update
    if (page.length === 0 && !messageId) continue;

    const memberCol = page.map(r => `**${r.rank}.** ${r.username}`).join("\n");
    // TODO: `:gold_star:` is a custom server emote — replace with `<:gold_star:EMOTE_ID>` for it to render in Discord.
    const ptsCol    = page.map(r => `:gold_star: ${fmtAbbrev(r.total_points)}`).join("\n");
    const gainCol   = page.map(r => fmtAbbrev(r.gain_60m)).join("\n");

    const embed = {
      title:  `🏆 ${CLAN_NAME} Clan Leaderboard (Page ${p + 1}/${TOTAL_PAGES})`,
      color:  0xf5a623, // gold
      fields: [
        { name: "Member",        value: memberCol || "—", inline: true },
        { name: "Total Points",  value: ptsCol    || "—", inline: true },
        { name: "60m Gain",      value: gainCol   || "—", inline: true }
      ],
      footer:    { text: `Updated ${updatedAt}` },
      timestamp: new Date().toISOString()
    };

    let res;

    if (messageId) {
      // Edit the existing message in-place
      res = await fetch(
        `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ embeds: [embed] })
        }
      );
      if (res.ok) {
        console.log(`Discord page ${p + 1} updated (message ${messageId}).`);
      } else {
        const msg = await res.text();
        console.warn(`Discord page ${p + 1} PATCH failed (${res.status}): ${msg}`);
      }
    } else {
      // Post a new message and log the returned ID so it can be saved as a secret
      res = await fetch(`${DISCORD_WEBHOOK}?wait=true`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ embeds: [embed] })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Discord page ${p + 1} posted. Message ID: ${data.id}`);
      } else {
        const msg = await res.text();
        console.warn(`Discord page ${p + 1} POST failed (${res.status}): ${msg}`);
      }
    }
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
  const { members, starryBattle } = await fetchClanMembers();
  console.log(`Fetched ${members.length} members.`);

  let withGains = members.map(m => ({ ...m, gain_60m: null }));

  if (SUPABASE_URL && SUPABASE_KEY) {
    // 1. Retrieve snapshot from ~60 min ago using a tight window [TARGET±WINDOW].
    //    Fall back to the most recent snapshot older than (TARGET - WINDOW) minutes.
    const olderBoundIso = new Date(now - (GAIN_TARGET_MIN + GAIN_WINDOW_MIN) * 60 * 1000).toISOString();
    const newerBoundIso = new Date(now - (GAIN_TARGET_MIN - GAIN_WINDOW_MIN) * 60 * 1000).toISOString();

    let oldRows = await sbGetSnapshotsInWindow(olderBoundIso, newerBoundIso);
    if (oldRows.length === 0) {
      // Fallback: any snapshot older than (TARGET - WINDOW) minutes
      oldRows = await sbGetOldSnapshots(newerBoundIso);
      if (oldRows.length > 0) {
        console.log("No snapshot in tight 60-min window; using nearest older snapshot for gain.");
      }
    }

    withGains = computeGains(members, oldRows);
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

    // 4. StarryBattle archive: snapshot final standings once per completed battle.
    await maybeArchiveStarryBattle(members, starryBattle, now, nowIso);
  } else {
    console.warn("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping DB operations. 60m gain will show as N/A.");
  }

  await updateReadme(withGains, updatedAt);
  await postDiscord(withGains, updatedAt);

  console.log("Done.");
}

// Archives final StarryBattle standings to StarryBattleArchive exactly once per
// completed battle. No-ops with a warning if the API does not expose end-time fields.
async function maybeArchiveStarryBattle(members, starryBattle, now, nowIso) {
  if (!starryBattle) {
    console.warn("StarryBattle data not present in API response — skipping archive step.");
    return;
  }

  // Defensively detect end-time field (API may use EndTime, FinishTime, etc.)
  const rawEndTime =
    starryBattle.EndTime   ??
    starryBattle.FinishTime ??
    starryBattle.end_time  ??
    null;

  if (rawEndTime == null) {
    console.warn("StarryBattle end-time field not found in API response — skipping archive step.");
    return;
  }

  const endTime = new Date(rawEndTime);
  if (isNaN(endTime.getTime())) {
    console.warn(`StarryBattle end-time "${rawEndTime}" could not be parsed — skipping archive step.`);
    return;
  }

  // Only archive if the battle has ended.
  if (now < endTime) {
    console.log("StarryBattle is still active — no archiving needed.");
    return;
  }

  // Derive a stable battle_id (prefer an API-provided ID, fall back to start-time epoch).
  const rawStartTime =
    starryBattle.StartTime ??
    starryBattle.start_time ??
    null;
  const startTime = rawStartTime ? new Date(rawStartTime) : null;
  const startEpoch = startTime && !isNaN(startTime.getTime()) ? startTime.getTime() : null;

  const battleId = String(
    starryBattle.Id ??
    starryBattle.BattleId ??
    starryBattle.battle_id ??
    startEpoch ??
    endTime.getTime()
  );

  // Check whether this battle has already been archived.
  let latestArchivedId;
  try {
    latestArchivedId = await sbGetLatestArchivedBattleId();
  } catch (err) {
    console.warn(`Could not query StarryBattleArchive — skipping archive step: ${err.message}`);
    return;
  }

  if (latestArchivedId === battleId) {
    console.log(`StarryBattle ${battleId} already archived — skipping.`);
    return;
  }

  // Insert final standings.
  const archiveRows = members.map(m => ({
    battle_id:         battleId,
    archived_at:       nowIso,
    battle_started_at: startTime && !isNaN(startTime.getTime()) ? startTime.toISOString() : null,
    battle_ended_at:   endTime.toISOString(),
    rank:              m.rank,
    user_id:           m.user_id ?? null,
    username:          m.username,
    total_points:      m.total_points
  }));

  try {
    await sbInsertArchive(archiveRows);
    console.log(`Archived ${archiveRows.length} rows to StarryBattleArchive for battle ${battleId}.`);
  } catch (err) {
    console.warn(`Failed to archive StarryBattle standings: ${err.message}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
