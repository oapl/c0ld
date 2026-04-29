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

// Custom Discord emoji used in card "Points" line.
const RANK_STAR_EMOJI = "<:RankStar:1499100837006413937>";

// Embed accent color (gold).
const EMBED_COLOR = 0xf5a623;

// Raw GitHub URL of a 600×1 transparent PNG committed to this repo.
const SPACER_IMAGE_URL_BASE =
  "https://raw.githubusercontent.com/OpalApocalypse/NONG_Leaderboard/main/assets/embed-spacer.png";

// Append ?v=<unix-seconds> for Discord cache busting.
const EMBED_SPACER_IMAGE_URL = `${SPACER_IMAGE_URL_BASE}?v=${Math.floor(Date.now() / 1000)}`;

// Discord embed update cadence
const UPDATE_INTERVAL_MIN = 5;
const UPDATE_INTERVAL_MS  = UPDATE_INTERVAL_MIN * 60 * 1000;

// 60-min gain window configuration.
const GAIN_TARGET_MIN = 60;
const GAIN_WINDOW_MIN = 5;
const KEEP_HOURS      = 336;

// README markers
const README_PATH = "README.md";
const LB_START    = "<!-- START_LEADERBOARD -->";
const LB_END      = "<!-- END_LEADERBOARD -->";
const UPD_START   = "<!-- START_UPDATED -->";
const UPD_END     = "<!-- END_UPDATED -->";

// Resolves an array of Roblox UserIDs to a Map<id, username> in batches of 100.
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

  const memberIdSet = new Set(members.map(m => m.UserID));
  const starryBattle = json.data?.Battles?.StarryBattle ?? null;
  const pointData = starryBattle?.PointContributions ?? [];
  const points = new Map(
    pointData
      .filter(d => memberIdSet.has(d.UserID))
      .map(d => [d.UserID, d.Points ?? 0])
  );

  const userIds = members.map(m => m.UserID);
  const usernameMap = await resolveRobloxUsernames(userIds);

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
    console.warn(`Supabase cleanup warning (${res.status}): ${msg}`);
  }
}

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
  const latestTs = rows[0].fetched_at;
  return rows.filter(r => r.fetched_at === latestTs);
}

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
  const latestOldTs = oldRows[0].fetched_at;
  const oldBatch    = oldRows.filter(r => r.fetched_at === latestOldTs);
  const oldByName   = new Map(oldBatch.map(r => [r.username, Number(r.total_points)]));
  return current.map(m => ({
    ...m,
    gain_60m: oldByName.has(m.username)
      ? m.total_points - oldByName.get(m.username)
      : null
  }));
}

// ── Last-gain (previous snapshot delta) ──────────────────────────────────────
function computeLastGain(current, prevRows) {
  if (!prevRows.length) {
    return current.map(m => ({ ...m, last_gain: null }));
  }
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
  const PAGE_CARD_LIMITS = [24, 25, 25];
  const TOTAL_PAGES = PAGE_CARD_LIMITS.length;

  const nowUnix = Math.floor(Date.now() / 1000);
  const SCRIPT_INTERVAL_SECONDS = UPDATE_INTERVAL_MS / 1000;
  const nextUpdateUnix = nowUnix + SCRIPT_INTERVAL_SECONDS;
  const delta = nextUpdateUnix - nowUnix;

  let nextUpdateStr;
  if (delta > 0) {
    nextUpdateStr = `<t:${nextUpdateUnix}:R>`;
  } else {
    nextUpdateStr = "Refreshing…";
  }

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

    if (page.length === 0 && !messageId) continue;

    const isFirstPage = p === 0;
    const isLastPage  = p === TOTAL_PAGES - 1;

    const cardFields = page.map(r => ({
      name: `${r.rank}. ${r.username}`,
      value:
        `${RANK_STAR_EMOJI} Points: **${fmtAbbrev(r.total_points)}**\n` +
        `> 1h Gain: **${r.gain_60m == null ? "N/A" : fmtAbbrev(r.gain_60m)}**\n` +
        `\u200b`,
      inline: true
    }));

    const spacerField = {
      name: "\u200b",
      value: "\u200b",
      inline: false
    };

    const fields = [
      ...(isFirstPage ? [spacerField] : []),
      ...cardFields
    ];

    const title = isFirstPage ? "Starry Battle Rankings" : undefined;

    // -- THIS IS THE UPDATED PART --
    const description = isFirstPage
      ? `Last Update: <t:${nowUnix}:R>  🕒  Next Update: ${nextUpdateStr}`
      : undefined;
    // -----------------------------

    const embedFooter = (() => {
      if (!isLastPage) return {};
      const d = new Date(nowUnix * 1000);
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
  const pad = n => String(n).padStart(2, "0");
  const updatedAt =
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ` +
    `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;

  console.log(`Fetching clan data for "${CLAN_NAME}"…`);
  const { members } = await fetchClanMembers();
  console.log(`Fetched ${members.length} members.`);

  let withGains = members.map(m => ({ ...m, gain_60m: null, last_gain: null }));

  if (SUPABASE_URL && SUPABASE_KEY) {
    const olderBoundIso = new Date(now - (GAIN_TARGET_MIN + GAIN_WINDOW_MIN) * 60 * 1000).toISOString();
    const newerBoundIso = new Date(now - (GAIN_TARGET_MIN - GAIN_WINDOW_MIN) * 60 * 1000).toISOString();

    let oldRows = await sbGetSnapshotsInWindow(olderBoundIso, newerBoundIso);
    if (oldRows.length === 0) {
      oldRows = await sbGetOldSnapshots(newerBoundIso);
      if (oldRows.length > 0) {
        console.log("No snapshot in tight 60-min window; using nearest older snapshot for gain.");
      }
    }

    withGains = computeGains(members, oldRows);
    console.log(`Found ${oldRows.length} historical rows for gain calculation.`);

    const prevRows = await sbGetPreviousSnapshot(nowIso);
    withGains = computeLastGain(withGains, prevRows);
    console.log(`Found ${prevRows.length} previous-snapshot rows for last-gain calculation.`);

    const toInsert = members.map(m => ({
      fetched_at:   nowIso,
      rank:         m.rank,
      username:     m.username,
      total_points: m.total_points
    }));
    await sbInsertArchive(toInsert);
    console.log(`Inserted ${toInsert.length} rows into StarryBattleArchive.`);

    await sbUpsertCurrent(toInsert);
    console.log(`Upserted ${toInsert.length} rows into leaderboard_snapshots.`);

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
