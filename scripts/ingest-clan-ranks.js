// scripts/ingest-clan-ranks.js
// Fetches top clan rankings from BIG Games PS99 API and stores them in Supabase.
//
// Output table:
//   public.clan_rank_snapshots
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//
// Optional env:
//   CLAN_NAME = NONG
//   CURRENT_BATTLE_NAME = StarryBattle
//   CLAN_RANK_TOP_N = 100

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const CLAN_NAME = process.env.CLAN_NAME || "NONG";
const CURRENT_BATTLE_NAME = process.env.CURRENT_BATTLE_NAME || "StarryBattle";
const TOP_N = Number(process.env.CLAN_RANK_TOP_N || 100);

const PAGE_SIZE = 100;
const MAX_PAGES = Math.ceil(TOP_N / PAGE_SIZE) + 2;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 500)}`);
  }
}

function getClanName(clan) {
  return String(
    clan?.Name ??
    clan?.name ??
    clan?.ClanName ??
    clan?.clanName ??
    clan?.Tag ??
    clan?.tag ??
    ""
  ).trim();
}

function getClanPoints(clan) {
  const value =
    clan?.Points ??
    clan?.points ??
    clan?.Score ??
    clan?.score ??
    clan?.Total ??
    clan?.total ??
    clan?.Value ??
    clan?.value ??
    0;

  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getExplicitRank(clan) {
  const value =
    clan?.Rank ??
    clan?.rank ??
    clan?.Place ??
    clan?.place ??
    clan?.Position ??
    clan?.position ??
    clan?.Index ??
    clan?.index;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function looksLikeClanObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;

  const hasName =
    obj.Name !== undefined ||
    obj.name !== undefined ||
    obj.ClanName !== undefined ||
    obj.clanName !== undefined ||
    obj.Tag !== undefined ||
    obj.tag !== undefined;

  const hasPoints =
    obj.Points !== undefined ||
    obj.points !== undefined ||
    obj.Score !== undefined ||
    obj.score !== undefined ||
    obj.Total !== undefined ||
    obj.total !== undefined ||
    obj.Value !== undefined ||
    obj.value !== undefined;

  return hasName && hasPoints;
}

function extractClanArrays(value) {
  const arrays = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      if (node.some(looksLikeClanObject)) {
        arrays.push(node);
      }

      for (const item of node) {
        walk(item);
      }

      return;
    }

    for (const child of Object.values(node)) {
      walk(child);
    }
  }

  walk(value);
  return arrays;
}

async function fetchClanPageFromHost(baseUrl, page) {
  const url = new URL(baseUrl);

  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("sort", "Points");
  url.searchParams.set("sortOrder", "desc");

  const json = await fetchJson(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "NONG-Leaderboard-Clan-Rank-Ingest"
    }
  });

  const clanArrays = extractClanArrays(json);

  if (!clanArrays.length) {
    return [];
  }

  return clanArrays[0];
}

async function fetchTopClans() {
  const hosts = [
    "https://biggamesapi.io/api/clans",
    "https://ps99.biggamesapi.io/api/clans"
  ];

  let lastError = null;

  for (const host of hosts) {
    const collected = [];

    console.log(`Fetching top clans from ${host}...`);

    try {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const pageRows = await fetchClanPageFromHost(host, page);

        if (!pageRows.length) {
          console.log(`No clans returned on page ${page}. Stopping.`);
          break;
        }

        const normalized = pageRows
          .map((clan, index) => {
            const name = getClanName(clan);
            const points = getClanPoints(clan);
            const explicitRank = getExplicitRank(clan);
            const calculatedRank = (page - 1) * PAGE_SIZE + index + 1;

            return {
              rank: explicitRank || calculatedRank,
              clan_name: name,
              points
            };
          })
          .filter(row => row.clan_name && Number.isFinite(row.points));

        collected.push(...normalized);

        console.log(`Fetched page ${page}. Total clans collected: ${collected.length}`);

        if (collected.length >= TOP_N || pageRows.length < PAGE_SIZE) {
          break;
        }

        await sleep(150);
      }

      const deduped = [];
      const seen = new Set();

      for (const row of collected) {
        const key = row.clan_name.toLowerCase();

        if (seen.has(key)) continue;
        seen.add(key);

        deduped.push(row);
      }

      deduped.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.clan_name.localeCompare(b.clan_name);
      });

      const finalRows = deduped.slice(0, TOP_N).map((row, index) => ({
        ...row,
        rank: index + 1
      }));

      if (finalRows.length) {
        console.log(`Using ${finalRows.length} clans from ${host}.`);
        return finalRows;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Failed to fetch clans from ${host}: ${err.message}`);
    }
  }

  throw lastError || new Error("No clan ranking data could be fetched.");
}

async function insertClanSnapshots(rows) {
  if (!rows.length) {
    console.log("No clan rows to insert.");
    return;
  }

  const fetchedAt = new Date().toISOString();

  const payload = rows.map(row => ({
    fetched_at: fetchedAt,
    battle: CURRENT_BATTLE_NAME,
    rank: row.rank,
    clan_name: row.clan_name,
    points: row.points
  }));

  const url = `${SUPABASE_URL}/rest/v1/clan_rank_snapshots`;

  const res = await fetch(url, {
    method: "POST",
    headers: sbHeaders({
      Prefer: "resolution=ignore-duplicates"
    }),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${text}`);
  }

  const nong = payload.find(row => row.clan_name.toLowerCase() === CLAN_NAME.toLowerCase());

  console.log(`Inserted ${payload.length} clan rank snapshot rows.`);
  console.log(`Snapshot time: ${fetchedAt}`);
  console.log(`Battle: ${CURRENT_BATTLE_NAME}`);

  if (nong) {
    console.log(`${CLAN_NAME} current rank in inserted snapshot: #${nong.rank} with ${nong.points} points.`);
  } else {
    console.log(`${CLAN_NAME} was not found in the top ${payload.length} clans inserted.`);
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  console.log(`CLAN_NAME=${CLAN_NAME}`);
  console.log(`CURRENT_BATTLE_NAME=${CURRENT_BATTLE_NAME}`);
  console.log(`CLAN_RANK_TOP_N=${TOP_N}`);

  const clans = await fetchTopClans();

  await insertClanSnapshots(clans);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
