// ingest.js
// Fetches clan leaderboard from the Big Games API, stores a snapshot in
// Supabase, computes the 60-minute point gain for each member, updates
// README.md, and posts a Discord embed webhook message.
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

// Custom Discord emoji used in card "Points" line. Webhooks must use the
// full <:name:id> syntax — plain :shortcode: will not resolve. The numeric
// ID is what Discord uses to resolve the emoji; the name portion is just
// a label and can be renamed freely on the server without breaking this.
const RANK_STAR_EMOJI = "<:RankStar:1499100837006413937>";

// Embed accent color (gold).
const EMBED_COLOR = 0xf5a623;

// Raw GitHub URL of a 600×1 transparent PNG committed to this repo.
// Attaching this as embed.image forces Discord to render the embed at its
// maximum width (~600px), which widens the 3-column inline-field slots
// so cards have visibly more horizontal breathing room. Without it, the
// embed shrinks to fit text content and columns feel cramped.
const SPACER_IMAGE_URL_BASE =
  "https://raw.githubusercontent.com/OpalApocalypse/NONG_Leaderboard/main/assets/embed-spacer.png";

// Append ?v=<unix-seconds> so Discord re-fetches the image on each run instead
// of serving a cached version. Discord caches embed images aggressively by URL;
// without this, replacing the PNG never widens existing embeds.
// Computed once at script start so all 3 pages in a single run share the same URL.
const EMBED_SPACER_IMAGE_URL = `${SPACER_IMAGE_URL_BASE}?v=${Math.floor(Date.now() / 1000)}`;

// Discord embed update cadence.
// Change this constant (and the workflow cron) together when the cadence changes.
const UPDATE_INTERVAL_MIN = 5;

// 60-min gain window configuration.
// GAIN_TARGET_MIN: target snapshot age in minutes (we want the snapshot from ~60 min ago).
// GAIN_WINDOW_MIN: ± tolerance in minutes; first try snapshots in [TARGET-WINDOW, TARGET+WINDOW].
// If none found in that tight window, fall back to the most recent snapshot older than
// (GAIN_TARGET_MIN - GAIN_WINDOW_MIN) minutes (preserves existing behaviour).
const GAIN_TARGET_MIN = 60;
const GAIN_WINDOW_MIN = 5;
// Retain time-series rows in StarryBattleArchive for this many hours.
// 336 h = 14 days — the maximum length of any clan battle, so any battle
// started at the beginning of the window will still have full history.
// If future events exceed 14 days, increase this constant accordingly.
const KEEP_HOURS      = 336;

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

// Appends a batch of time-series rows to StarryBattleArchive.
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

// Upserts the current-state batch into leaderboard_snapshots (one row per
// member, replaced every run — the table never grows past clan size).
async function sbUpsertCurrent(rows) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  url.searchParams.set("on_conflict", "username");
  const res = await fetch(url.toString(), {
    method:  "POST",
    headers: sbHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body:    JSON.stringify(rows)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${msg}`);
  }
}

// Returns all rows with fetched_at < beforeIso, newest-first (up to 500 rows).
// The caller picks the most-recent distinct batch from this result set.
async function sbGetOldSnapshots(beforeIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`);
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
  const url = new URL(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`);
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

// Returns the rows of the single most-recent snapshot batch with
// fetched_at strictly less than the current run's fetched_at.
async function sbGetPreviousSnapshot(beforeIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`);
  url.searchParams.set("fetched_at", `lt.${beforeIso}`);
  url.searchParams.set("order",      "fetched_at.desc");
  url.searchParams.set("limit",      "200");

  const res = await fetch(url.toString(), {
    headers: sbHeaders({ Prefer: "return=representation" })
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Supabase previous-snapshot query failed (${res.status}): ${msg}`);
  }
  const rows = await res.json();
  if (!rows.length) return [];
  // Filter to only the most-recent distinct fetched_at in the result set
  const latestTs = rows[0].fetched_at;
  return rows.filter(r => r.fetched_at === latestTs);
}

// Returns rows with fetched_at strictly between afterIso and beforeIso, newest-first (up to 500).
// Used for the tight ~60-min window query.
async function sbGetSnapshotsInWindow(afterIso, beforeIso) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}`);
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

// ── Last-gain (previous snapshot delta) ──────────────────────────────────────
// Diffs current points against the immediately previous snapshot batch.
// Augments each member with a `last_gain` field (number or null for unknown).
function computeLastGain(current, prevRows) {
  if (!prevRows.length) {
    return current.map(m => ({ ...m, last_gain: null }));
  }
  // PostgREST returns BIGINT columns as strings in JSON; coerce to number.
  const prevByName = new Map(prevRows.map(r => [r.username, Number(r.total_points)]));
  return current.map(m => ({
    ...m,
    last_gain: prevByName.has(m.username)
      ? m.total_points - prevByName.get(m.username)
      : null
  }));
}

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

  // Discord embed hard cap: 25 fields per embed.
  // Header moves into embed.description on page 1 only (free, doesn't count against
  // the 25-field cap). A spacer field is prepended on page 1 to restore the blank
  // line gap between the header and the first card.
  //
  // Per-page card budgets to fit Discord's 25-field embed cap.
  //   Page 1: 1 spacer field + up to 24 cards = 25 fields
  //   Page 2:                   up to 25 cards = 25 fields
  //   Page 3:                   up to 25 cards = 25 fields  (footer is native, not a field)
  // Total capacity: 24 + 25 + 25 = 74 members across 3 pages.
  // If the clan grows past 74 members, bump the array (e.g. [24, 25, 25, 25, 25]
  // for 5 pages) — overflow is silently truncated until then.
  const PAGE_CARD_LIMITS = [24, 25, 25];
  const TOTAL_PAGES = PAGE_CARD_LIMITS.length;

  const now = new Date();
  const lastUpdateUnix = Math.floor(now.getTime() / 1000);
  const nextUpdateUnix = Math.ceil(now.getTime() / (UPDATE_INTERVAL_MIN * 60 * 1000))
    * (UPDATE_INTERVAL_MIN * 60 * 1000) / 1000;

  const totalCapacity = PAGE_CARD_LIMITS.reduce((a, b) => a + b, 0);
  if (rows.length > totalCapacity) {
    console.warn(
      `Warning: ${rows.length} members exceed page capacity (${totalCapacity}). ` +
      `Bump PAGE_CARD_LIMITS in ingest.js to avoid truncation.`
    );
  }

  let cursor = 0;
  for (let p = 0; p < TOTAL_PAGES; p++) {
    const limit = PAGE_CARD_LIMITS[p];
    const page  = rows.slice(cursor, cursor + limit);
    cursor += limit;
    const messageId = messageIds[p];

    // Skip empty pages that have no existing message to update
    if (page.length === 0 && !messageId) continue;

    const isFirstPage = p === 0;
    const isLastPage  = p === TOTAL_PAGES - 1;

    const cardFields = page.map(r => ({
      name: `${r.rank}. ${r.username}`,
      value:
        `${RANK_STAR_EMOJI} Points: **${fmtAbbrev(r.total_points)}**\n` +
        `> 1h Gain: **${r.gain_60m == null ? "N/A" : fmtAbbrev(r.gain_60m)}**\n` +
        `\u200b`, // trailing zero-width-space line: forces vertical gap between card rows
      // NOTE: Last Gain line intentionally omitted for now. To re-enable, insert
      // before the trailing \u200b line:
      //   `> Last Gain: ${r.last_gain == null ? "N/A" : (r.last_gain >= 0 ? "+" : "-") + fmtAbbrev(Math.abs(r.last_gain)) + " pts"}\n` +
      // The data is already computed and available on r.last_gain.
      inline: true
    }));

    // Spacer field: prepended on page 1 only to add a visible blank line between
    // the header (in embed.description) and the first card.
    const spacerField = {
      name: "\u200b",
      value: "\u200b",
      inline: false
    };

    const fields = [
      ...(isFirstPage ? [spacerField] : []),
      ...cardFields
    ];

    // Title: only on page 1.
    const title = isFirstPage ? "Starry Battle Rankings" : undefined;

    // Header description: only on page 1 — doesn't count against the 25-field cap.
    const description = isFirstPage
      ? `Last Update: <t:${lastUpdateUnix}:R>  🕒  Next Update: <t:${nextUpdateUnix}:R>`
      : undefined;

    // Precompute explicit UTC date/time string for the last-page footer so Discord
    // renders it as a fixed date (e.g. "04/29/2026 at 1:59 PM UTC") rather than
    // the auto-localized "Today at …" that embed.timestamp produces.
    const embedFooter = (() => {
      if (!isLastPage) return {};
      const d = new Date(lastUpdateUnix * 1000);
      const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd   = String(d.getUTCDate()).padStart(2, "0");
      const yyyy = d.getUTCFullYear();
      const hh12Raw = d.getUTCHours();
      const ampm  = hh12Raw >= 12 ? "PM" : "AM";
      const hh12  = ((hh12Raw + 11) % 12) + 1;
      const mins  = String(d.getUTCMinutes()).padStart(2, "0");
      const explicitDateTime = `${mm}/${dd}/${yyyy} at ${hh12}:${mins} ${ampm} UTC`;
      return { footer: { text: `Created by Cinnamowopal • Updated: ${explicitDateTime}` } };
    })();

    const embed = {
      color: EMBED_COLOR,
      image: { url: EMBED_SPACER_IMAGE_URL },
      fields,
      ...(title       ? { title }       : {}),
      ...(description ? { description } : {}),
      ...embedFooter
    };

    const payload = { embeds: [embed] };

    let res;

    if (messageId) {
      // Edit the existing message in-place
      res = await fetch(
        `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload)
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
        body:    JSON.stringify(payload)
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
  const { members } = await fetchClanMembers();
  console.log(`Fetched ${members.length} members.`);

  let withGains = members.map(m => ({ ...m, gain_60m: null, last_gain: null }));

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

    // 1b. Retrieve the immediately previous snapshot (~5 min ago) for Last Gain.
    const prevRows = await sbGetPreviousSnapshot(nowIso);
    withGains = computeLastGain(withGains, prevRows);
    console.log(`Found ${prevRows.length} previous-snapshot rows for last-gain calculation.`);

    // 2. Append current snapshot to the time-series archive
    const toInsert = members.map(m => ({
      fetched_at:   nowIso,
      rank:         m.rank,
      username:     m.username,
      total_points: m.total_points
    }));
    await sbInsertArchive(toInsert);
    console.log(`Inserted ${toInsert.length} rows into StarryBattleArchive.`);

    // 3. Upsert current state into leaderboard_snapshots (never grows past clan size)
    await sbUpsertCurrent(toInsert);
    console.log(`Upserted ${toInsert.length} rows into leaderboard_snapshots.`);

    // 4. Prune StarryBattleArchive rows older than KEEP_HOURS
    const pruneIso = new Date(now - KEEP_HOURS * 60 * 60 * 1000).toISOString();
    await sbDeleteOld(pruneIso);
    console.log("Old archive rows pruned.");
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
