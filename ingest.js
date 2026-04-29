// ingest.js
// Fetches clan leaderboard from the Big Games API, stores a snapshot in
// Supabase, computes the 60-minute point gain for each member, updates
// README.md, and posts a Discord bot message with Components V2.
//
// Required env vars (add as GitHub Actions secrets):
//   SUPABASE_URL          – e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  – service-role key (has full DB access)
//   DISCORD_BOT_TOKEN     – Bot token from Discord Developer Portal (no `Bot ` prefix)
//   DISCORD_CHANNEL_ID    – Channel snowflake ID to post into
//
// Optional env vars (have sensible defaults):
//   CLAN_NAME   – default "NONG"
//   TOP_N       – number of members to show, default 10

const fs = require("fs/promises");

// ── Config ────────────────────────────────────────────────────────────────────
const CLAN_NAME       = process.env.CLAN_NAME            || "NONG";
const SUPABASE_URL    = (process.env.SUPABASE_URL        || "").replace(/\/$/, "");
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || "";
const DISCORD_BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN  || "";
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || "";
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

// No cache-bust query string: some Discord media-proxy paths reject query strings
// on image.url and can trigger a 50006 "empty message" validator failure.
// If image-cache invalidation is needed in future, use a URL fragment (#v=<unix>)
// instead — fragments are not sent to the server.
const EMBED_SPACER_IMAGE_URL = SPACER_IMAGE_URL_BASE;

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

// ── Discord (bot REST API) ──────────────────────────────────────────────────
//
// Posts/edits up to 3 messages in a fixed channel using the bot REST endpoint
// with Components V2 (`flags: 1 << 15`) so we can render wide COLD-style
// Container components (no 600 px embed width cap).
//
// IMPORTANT: V2 ONLY works on the bot endpoint
// (`POST /channels/{id}/messages` with `Authorization: Bot <token>`).
// V2 is silently rejected by webhook execute (`POST /webhooks/{id}/{token}`),
// which returns `50006 Cannot send an empty message`. Three previous attempts
// (PRs #15, #25, plus one earlier) tried V2 over the webhook and all failed —
// do not retry that path.
//
// Required env vars:
//   DISCORD_BOT_TOKEN  – Bot token from https://discord.com/developers (no `Bot ` prefix)
//   DISCORD_CHANNEL_ID – Channel snowflake to post into
//   DISCORD_MESSAGE_IDS – comma-separated message IDs to PATCH (one per page);
//                        empty = first run, will POST and log new IDs to copy in
async function postDiscord(rows, updatedAt) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
    console.warn("DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID not set — skipping Discord post.");
    return;
  }

  const messageIds = DISCORD_MESSAGE_IDS.split(",").map(s => s.trim()).filter(Boolean);

  // Page card budgets (3 cards per row, COLD-style 3-wide grid).
  // V2 has no 25-field cap so we can fit more per page than the legacy embed.
  // Keeping 3 pages × ~25 cards for visual parity with the legacy layout.
  const PAGE_CARD_LIMITS = [25, 25, 25];
  const TOTAL_PAGES = PAGE_CARD_LIMITS.length;

  const now = new Date();
  const lastUpdateUnix = Math.floor(now.getTime() / 1000);
  const nextUpdateUnix = Math.ceil(now.getTime() / (UPDATE_INTERVAL_MIN * 60 * 1000))
    * (UPDATE_INTERVAL_MIN * 60 * 1000) / 1000;

  // Footer explicit date: MM/DD/YYYY at H:MM AM/PM UTC
  const pad2 = n => String(n).padStart(2, "0");
  const utcMonth   = pad2(now.getUTCMonth() + 1);
  const utcDay     = pad2(now.getUTCDate());
  const utcYear    = now.getUTCFullYear();
  const utcHours   = now.getUTCHours();
  const utcMinutes = pad2(now.getUTCMinutes());
  const ampm       = utcHours >= 12 ? "PM" : "AM";
  const hours12    = utcHours % 12 || 12;
  const footerDateStr = `${utcMonth}/${utcDay}/${utcYear} at ${hours12}:${utcMinutes} ${ampm} UTC`;

  const totalCapacity = PAGE_CARD_LIMITS.reduce((a, b) => a + b, 0);
  if (rows.length > totalCapacity) {
    console.warn(
      `Warning: ${rows.length} members exceed page capacity (${totalCapacity}). ` +
      `Bump PAGE_CARD_LIMITS in ingest.js to avoid truncation.`
    );
  }

  const IS_COMPONENTS_V2 = 1 << 15;
  const CONTAINER_TYPE   = 17;
  const TEXT_DISPLAY     = 10;
  const SEPARATOR        = 14;

  // Gold accent color (decimal); same value as legacy EMBED_COLOR (0xf5a623).
  const ACCENT_COLOR = EMBED_COLOR;

  let cursor = 0;
  for (let p = 0; p < TOTAL_PAGES; p++) {
    const limit = PAGE_CARD_LIMITS[p];
    const page  = rows.slice(cursor, cursor + limit);
    cursor += limit;
    const messageId = messageIds[p];
    if (page.length === 0 && !messageId) continue;

    const isFirstPage = p === 0;
    const isLastPage  = p === TOTAL_PAGES - 1;

    // Build TextDisplay components: one per row of 3 cards.
    // Each row pivots 3 members into a single TextDisplay using the same
    // 3-column markdown trick the previous V2 attempt used (PR #25):
    //
    //   **1. Name** │ **2. Name** │ **3. Name**
    //   ⭐ Pts: **5.5K**  1h: **89**  │  ⭐ Pts: **5.4K**  1h: **89**  │  ⭐ Pts: **5.3K**  1h: **89**
    //
    // Use the existing RANK_STAR_EMOJI constant.
    const rowChunks = [];
    for (let i = 0; i < page.length; i += 3) {
      const trio = page.slice(i, i + 3);
      const headerLine = trio
        .map(r => `**${r.rank}. ${r.username}**`)
        .join("  │  ");
      const dataLine = trio
        .map(r => {
          const gain = r.gain_60m == null ? "N/A" : fmtAbbrev(r.gain_60m);
          return `${RANK_STAR_EMOJI} Pts: **${fmtAbbrev(r.total_points)}**  1h: **${gain}**`;
        })
        .join("  │  ");
      rowChunks.push(`${headerLine}\n${dataLine}`);
    }
    const cardsContent = rowChunks.join("\n\n");

    const containerChildren = [];

    if (isFirstPage) {
      containerChildren.push({
        type: TEXT_DISPLAY,
        content: "# Starry Battle Rankings"
      });
      containerChildren.push({
        type: TEXT_DISPLAY,
        content: `Last Update: <t:${lastUpdateUnix}:R>  🕒  Next Update: <t:${nextUpdateUnix}:R>`
      });
      containerChildren.push({ type: SEPARATOR });
    }

    if (cardsContent) {
      containerChildren.push({
        type: TEXT_DISPLAY,
        content: cardsContent
      });
    }

    if (isLastPage) {
      containerChildren.push({ type: SEPARATOR });
      containerChildren.push({
        type: TEXT_DISPLAY,
        content: `-# Created by Cinnamowopal • Updated: ${footerDateStr}`
      });
    }

    const payload = {
      flags: IS_COMPONENTS_V2,
      components: [
        {
          type: CONTAINER_TYPE,
          accent_color: ACCENT_COLOR,
          components: containerChildren
        }
      ]
    };

    const baseUrl = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`;
    const headers = {
      "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type":  "application/json",
      "User-Agent":    "NONG-Leaderboard-Bot (https://github.com/OpalApocalypse/NONG_Leaderboard, 1.0)"
    };

    let res;
    if (messageId) {
      res = await fetch(`${baseUrl}/${messageId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`Discord page ${p + 1} updated (message ${messageId}).`);
      } else {
        const msg = await res.text();
        const payloadPreview = JSON.stringify(payload, null, 2).slice(0, 3000);
        console.warn(`Discord page ${p + 1} PATCH failed (${res.status}): ${msg}`);
        console.warn(`Payload sent:\n${payloadPreview}`);
      }
    } else {
      res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Discord page ${p + 1} posted. Message ID: ${data.id}`);
      } else {
        const msg = await res.text();
        const payloadPreview = JSON.stringify(payload, null, 2).slice(0, 3000);
        console.warn(`Discord page ${p + 1} POST failed (${res.status}): ${msg}`);
        console.warn(`Payload sent:\n${payloadPreview}`);
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
