const SNAPSHOT_TABLE = "ps99_league_snapshots";
const CURRENT_TABLE = "ps99_league_current";
const DEFAULT_LEAGUE_NAME = "YAMO";
const DEFAULT_LEAGUE_RUN_KEY = "active";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const DEFAULT_TOP_LEAGUES_MAX_STALE_MINUTES = 15;
const TOP_LEAGUES_NAME = "GLOBAL_TOP_1000_LEAGUES";
const ALL_TOP_LEAGUES_NAME = "GLOBAL_TOP_10000_LEAGUES";
const COLD_DISCOVERED_LEAGUES_NAME = "C0LD_DISCOVERED_LEAGUES";
const DEFAULT_TOP_LEAGUES_LIMIT = 1000;
const DEFAULT_ALL_TOP_LEAGUES_LIMIT = 10000;
const MAX_TOP_LEAGUES_LIMIT = 10000;
const DEFAULT_COLD_LEAGUES_BATCH_SIZE = 10;
const MAX_COLD_LEAGUES_BATCH_SIZE = 40;
const DEFAULT_TOP_LEAGUES_PAGE_DELAY_MS = 2500;
const DEFAULT_ALL_TOP_LEAGUES_PAGE_DELAY_MS = 2500;
const DEFAULT_ALL_TOP_LEAGUES_PAGE_SIZE = 10;
const DEFAULT_TRACKED_RANK_WINDOW_SIZE = 50;
const DEFAULT_TRACKED_RANK_WINDOW_PAGE_DELAY_MS = 2500;
const DEFAULT_TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS = 2500;
const DEFAULT_COLD_CLAN_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/current";
const DEFAULT_COLD_CLAN_CURRENT_TABLE = "c0ld_clan_current";
const ROBLOX_BATCH_SIZE = 100;
const INACTIVITY_ALERT_TABLE = "ps99_league_inactivity_alerts";
const INACTIVITY_ALERT_WINDOW_MINUTES = 5;
const FALSEY_ENV_VALUES = new Set(["false", "0", "no", "off"]);

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/health") {
        response = json({ ok: true, service: "ps99-league-api", league_name: leagueName(env), league_names: leagueNames(env), league_run_key: leagueRunKey(env), snapshot_retention: "permanent", top_leagues: TOP_LEAGUES_NAME, top_leagues_limit: topLeaguesLimit(env), top_leagues_page_delay_ms: topLeaguesPageDelayMs(env), all_top_leagues: ALL_TOP_LEAGUES_NAME, all_top_leagues_limit: allTopLeaguesLimit(env), all_top_leagues_page_size: allTopLeaguesPageSize(env), all_top_leagues_page_delay_ms: allTopLeaguesPageDelayMs(env) });
      } else if (request.method === "GET" && url.pathname === "/api/leagues/current") {
        response = await handleCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/history") {
        response = await handleHistory(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/top-leagues") {
        response = await handleTopLeagues(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/c0ld-overlap") {
        response = await handleC0ldLeagueOverlap(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/c0ld-discovered") {
        response = await handleC0ldDiscoveredLeagues(request, env);
      } else if (request.method === "POST" && (url.pathname === "/api/leagues/ingest" || url.pathname === "/api/ingest")) {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("league"), runKeyParam(url));
      } else if (request.method === "POST" && url.pathname === "/api/leagues/top-leagues/ingest") {
        requireAdmin(request, env);
        const ingestLimit = clamp(Number(url.searchParams.get("limit") || topLeaguesLimit(env)), 1, MAX_TOP_LEAGUES_LIMIT);
        const ingestListName = topLeagueListNameForLimit(ingestLimit, env);
        const requestedPageSize = url.searchParams.get("page_size") || url.searchParams.get("pageSize");
        const ingestPageSize = ingestListName === ALL_TOP_LEAGUES_NAME
          ? clamp(Number(requestedPageSize || DEFAULT_ALL_TOP_LEAGUES_PAGE_SIZE), 1, 100)
          : undefined;
        response = await handleTopLeaguesIngest(env, "manual", runKeyParam(url), {
          listName: ingestListName,
          limit: ingestLimit,
          pageDelayMs: ingestListName === ALL_TOP_LEAGUES_NAME ? allTopLeaguesPageDelayMs(env) : topLeaguesPageDelayMs(env),
          pageSize: ingestPageSize
        });
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({ ok: false, message: err?.message || String(err) }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (String(env.INGEST_LEAGUES || "true").toLowerCase() !== "false") {
        const leagues = leagueNames(env);
        const concurrency = clamp(Number(env.LEAGUE_INGEST_CONCURRENCY || env.INGEST_LEAGUES_CONCURRENCY || 4), 1, 8);
        const results = await mapLimit(leagues, concurrency, async league => {
          try {
            const response = await handleIngest(env, "schedule", league, leagueRunKey(env));
            const payload = await response.clone().json().catch(() => ({}));
            return { league, ok: response.ok, rows_inserted: payload.rows_inserted ?? null };
          } catch (err) {
            console.error(`scheduled league ingest failed for ${league}`, err?.message || String(err));
            return { league, ok: false, message: err?.message || String(err) };
          }
        });
        console.log("scheduled tracked league ingest complete", JSON.stringify(results));
      }
      if (String(env.INGEST_TOP_LEAGUES || "true").toLowerCase() !== "false") {
        await handleTopLeaguesIngest(env, "schedule", topLeaguesRunKey(env), {
          listName: TOP_LEAGUES_NAME,
          limit: scheduledTopLeaguesLimit(env),
          pageDelayMs: topLeaguesPageDelayMs(env)
        }).catch(err => console.error("scheduled top 1000 leagues ingest failed", err?.message || String(err)));
      }
      if (shouldRunTrackedRankWindowRefresh(env)) {
        await handleTrackedLeagueRankWindowRefresh(env, "schedule:rank-window", topLeaguesRunKey(env))
          .catch(err => console.error("scheduled tracked league rank-window refresh failed", err?.message || String(err)));
      }
    })().catch(err => console.error("scheduled tracked league ingest failed", err?.message || String(err))));
  }
};

async function handleIngest(env, source, requestedLeague, requestedRunKey) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const requested = String(requestedLeague || leagueName(env)).trim() || leagueName(env);
  const runKey = normalizeRunKey(requestedRunKey || leagueRunKey(env));
  const api = await fetchLeagueApi(requested);
  const league = api.data || api;
  const summary = summarizeLeague(league, requested);
  const memberRows = normalizeLeagueRows(league);
  const snapshotId = `league:${runKey}:${summary.league_name}:${fetchedAt}`;

  const dbRows = memberRows.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source,
    league_run_key: runKey,
    league_name: summary.league_name,
    league_id: summary.league_id,
    league_level: summary.league_level,
    league_points: summary.league_points,
    league_icon: summary.league_icon,
    member_capacity: summary.member_capacity,
    rank: row.rank,
    user_id: row.user_id,
    display_name: row.display_name,
    points: row.points,
    last_contribution_at: row.last_contribution_at,
    permission_level: row.permission_level,
    role: row.role,
    join_time: row.join_time,
    raw_member: row.raw_member,
    raw_contribution: row.raw_contribution,
    raw_league: summary.raw_league
  }));

  if (dbRows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
    await replaceCurrentRows(env, CURRENT_TABLE, { league_run_key: `eq.${runKey}`, league_name: `eq.${summary.league_name}` }, dbRows.map(row => ({ ...row, updated_at: fetchedAt })));
    await maybeSendInactivityAlerts(env, { runKey, leagueName: summary.league_name, fetchedAt, snapshotId, rows: dbRows }).catch(err => console.error("inactivity alerts failed", err?.message || String(err)));
  }

  return json({ ok: true, league_run_key: runKey, league_name: summary.league_name, league_id: summary.league_id, snapshot_id: snapshotId, fetched_at: fetchedAt, rows_inserted: dbRows.length, snapshot_retention: "permanent" }, 202);
}

async function handleTopLeaguesIngest(env, source, requestedRunKey, options = {}) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const runKey = normalizeRunKey(requestedRunKey || topLeaguesRunKey(env));
  const listName = options.listName || TOP_LEAGUES_NAME;
  const limit = clamp(Number(options.limit || (source === "schedule" ? scheduledTopLeaguesLimit(env) : topLeaguesLimit(env))), 1, MAX_TOP_LEAGUES_LIMIT);
  const top = await fetchTopLeagues(limit, { pageDelayMs: options.pageDelayMs ?? topLeaguesPageDelayMs(env), pageSize: options.pageSize });
  const snapshotPrefix = listName === ALL_TOP_LEAGUES_NAME ? "all_top_leagues" : "top_leagues";
  const snapshotId = `${snapshotPrefix}:${runKey}:${fetchedAt}`;

  const dbRows = top.rows.map(row => topLeagueDbRow(row, {
    snapshotId,
    fetchedAt,
    source: `${source}:top-leagues`,
    runKey,
    listName
  }));

  if (dbRows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
    await replaceCurrentRows(env, CURRENT_TABLE, { league_run_key: `eq.${runKey}`, league_name: `eq.${listName}` }, dbRows.map(row => ({ ...row, updated_at: fetchedAt })));
  }

  return json({ ok: true, league_run_key: runKey, league_name: listName, snapshot_id: snapshotId, fetched_at: fetchedAt, rows_inserted: dbRows.length, source: top.source, requested_limit: limit, page_size: top.page_size }, 202);
}

async function handleTrackedLeagueRankWindowRefresh(env, source, requestedRunKey) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const runKey = normalizeRunKey(requestedRunKey || topLeaguesRunKey(env));
  const trackedNames = leagueNames(env);
  const scheduledLimit = scheduledTopLeaguesLimit(env);
  const maxRank = allTopLeaguesLimit(env);
  const windowSize = trackedRankWindowSize(env);
  const pageDelayMs = trackedRankWindowPageDelayMs(env);
  const expansionPageDelayMs = trackedRankWindowExpansionPageDelayMs(env);
  const [topRows, seedRows] = await Promise.all([
    fetchStoredTopLeagueRowsByNames(env, runKey, TOP_LEAGUES_NAME, trackedNames, Math.max(trackedNames.length * 2, 50)),
    fetchStoredTopLeagueRowsByNames(env, runKey, ALL_TOP_LEAGUES_NAME, trackedNames, Math.max(trackedNames.length * 2, 50))
  ]);
  const topLookup = topLeagueLookup(topRows);
  const seedLookup = topLeagueLookup(seedRows);

  const targets = trackedNames.map(name => ({ requested_name: name, league_name: name, league_id: null }));

  const skippedTop = [];
  const queued = [];
  const missingSeed = [];
  const pageCache = new Map();
  const rowsByUserId = new Map();
  const pagePacing = {};
  const initialPages = new Set();

  for (const target of targets) {
    const topRow = topLeagueLookupRow(topLookup, target);
    const topRank = toNumber(topRow?.rank);
    if (topRank !== null && topRank <= scheduledLimit) {
      skippedTop.push({ league_name: target.league_name, rank: topRank });
      continue;
    }

    const seedRow = topLeagueLookupRow(seedLookup, target);
    const seedRank = toNumber(seedRow?.rank);
    if (seedRank === null) {
      missingSeed.push({ league_name: target.league_name, requested_name: target.requested_name, league_id: target.league_id });
      continue;
    }

    const pageList = pagesForRankWindow(seedRank, windowSize, maxRank);
    pageList.forEach(page => initialPages.add(page));
    queued.push({
      ...target,
      league_name: seedRow.display_name || seedRow.league_name || target.league_name,
      league_id: target.league_id || seedRow.league_id || null,
      seed_rank: seedRank,
      initial_pages: pageList,
      found_rank: null,
      found: false,
      expansions: []
    });
  }

  const pageNumbers = [...initialPages].sort((a, b) => a - b);
  await fetchTopLeaguePages(pageNumbers, { pageDelayMs, pageCache, rowsByUserId, pacing: pagePacing });

  for (const target of queued) {
    let found = findTopLeagueRowForTarget(rowsByUserId.values(), target);
    let currentWindow = windowSize;

    while (!found && currentWindow < maxRank) {
      const nextWindow = Math.min(maxRank, currentWindow * 2);
      const nextPages = pagesForExpandedRankWindow(target.seed_rank, currentWindow, nextWindow, maxRank)
        .filter(page => !pageCache.has(page));
      currentWindow = nextWindow;

      if (nextPages.length) {
        const fetchedPages = [];
        for (const page of nextPages) {
          await fetchTopLeaguePages([page], { pageDelayMs: expansionPageDelayMs, pageCache, rowsByUserId, pacing: pagePacing });
          fetchedPages.push(page);
          found = findTopLeagueRowForTarget(rowsByUserId.values(), target);
          if (found) break;
        }
        target.expansions.push({ window_size: currentWindow, pages: fetchedPages });
      }

      found = findTopLeagueRowForTarget(rowsByUserId.values(), target);
      if (!nextPages.length && currentWindow >= maxRank) break;
    }

    if (found) {
      target.found = true;
      target.found_rank = toNumber(found.rank);
      target.league_name = found.league_name || target.league_name;
      target.league_id = found.league_id || target.league_id;
    }
  }

  const rows = [...rowsByUserId.values()].sort((a, b) => (a.rank || 999999) - (b.rank || 999999));
  const snapshotId = `rank_windows:${runKey}:${fetchedAt}`;
  const dbRows = rows.map(row => topLeagueDbRow(row, {
    snapshotId,
    fetchedAt,
    source: `${source}:top-leagues`,
    runKey,
    listName: ALL_TOP_LEAGUES_NAME
  }));

  if (dbRows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
    await supabaseUpsert(env, CURRENT_TABLE, dbRows.map(row => ({ ...row, updated_at: fetchedAt })), "league_run_key,league_name,user_id");
  }

  return json({
    ok: true,
    league_run_key: runKey,
    league_name: ALL_TOP_LEAGUES_NAME,
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    mode: "tracked-rank-windows",
    tracked_count: targets.length,
    skipped_top_1000: skippedTop.length,
    queued_count: queued.length,
    found_count: queued.filter(row => row.found).length,
    requested_pages: pageNumbers,
    pages_fetched: pageCache.size,
    rows_inserted: dbRows.length,
    window_size: windowSize,
    page_delay_ms: pageDelayMs,
    expansion_page_delay_ms: expansionPageDelayMs,
    queued,
    missing_seed: missingSeed
  }, 202);
}

function topLeagueDbRow(row, context) {
  return {
    snapshot_id: context.snapshotId,
    fetched_at: context.fetchedAt,
    source: context.source,
    league_run_key: context.runKey,
    league_name: context.listName,
    league_id: row.league_id || null,
    league_level: row.league_level ?? null,
    league_points: row.points || 0,
    league_icon: row.league_icon || null,
    member_capacity: row.member_capacity ?? null,
    rank: row.rank,
    user_id: row.user_id,
    display_name: row.league_name,
    points: row.points,
    last_contribution_at: null,
    permission_level: null,
    role: "Top League",
    join_time: null,
    raw_member: { league_name: row.league_name, league_id: row.league_id, league_rank: row.rank },
    raw_contribution: {},
    raw_league: row.raw_league
  };
}

async function persistTopLeagueWindowRows(env, runKey, rows, options = {}) {
  if (!rows?.length) return;
  const fetchedAt = options.fetchedAt || new Date().toISOString();
  const listName = options.listName || ALL_TOP_LEAGUES_NAME;
  const snapshotId = `top_league_window:${runKey}:${listName}:${fetchedAt}`;
  const source = `${options.source || "live-window"}:top-leagues`;
  const dbRows = rows.map(row => topLeagueDbRow(row, {
    snapshotId,
    fetchedAt,
    source,
    runKey,
    listName
  }));

  await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
  await supabaseUpsert(env, CURRENT_TABLE, dbRows.map(row => ({ ...row, updated_at: fetchedAt })), "league_run_key,league_name,user_id");
}

async function persistDiscoveredC0ldLeagues(env, runKey, rows, options = {}) {
  if (!rows?.length) return 0;
  const fetchedAt = options.fetchedAt || new Date().toISOString();
  const snapshotId = `c0ld_discovered:${runKey}:${fetchedAt}`;
  const source = `${options.source || "overlap-matches"}:c0ld-discovered`;
  const dbRows = rows.map(row => discoveredC0ldLeagueDbRow(row, {
    snapshotId,
    fetchedAt,
    source,
    runKey
  }));

  await supabaseUpsert(env, SNAPSHOT_TABLE, dbRows, "league_run_key,snapshot_id,user_id");
  await supabaseUpsert(env, CURRENT_TABLE, dbRows.map(row => ({ ...row, updated_at: fetchedAt })), "league_run_key,league_name,user_id");
  return dbRows.length;
}

function discoveredC0ldLeagueDbRow(row, context) {
  const stable = row.league_id || row.league_name;
  const synthetic = stableLeagueUserId(stable);
  const matches = (row.matches || []).map(member => ({
    user_id: toNumber(member.user_id),
    username: member.username || null,
    display_name: member.display_name || member.username || null,
    clan_rank: toNumber(member.clan_rank),
    clan_points: toNumber(member.clan_points) || 0,
    league_rank: toNumber(member.league_rank),
    league_points: toNumber(member.league_points) || 0,
    league_role: member.league_role || null,
    last_contribution_at: member.last_contribution_at || null
  }));
  const rawLeague = {
    Name: row.league_name,
    ID: row.league_id,
    Icon: row.league_icon,
    Points: toNumber(row.total_points) || toNumber(row.points) || 0,
    league_rank: toNumber(row.rank),
    c0ld_member_count: toNumber(row.c0ld_member_count) || matches.length,
    c0ld_league_points: toNumber(row.c0ld_league_points) || matches.reduce((sum, member) => sum + (toNumber(member.league_points) || 0), 0),
    c0ld_matches: matches
  };

  return {
    snapshot_id: context.snapshotId,
    fetched_at: context.fetchedAt,
    source: context.source,
    league_run_key: context.runKey,
    league_name: COLD_DISCOVERED_LEAGUES_NAME,
    league_id: row.league_id || null,
    league_level: null,
    league_points: rawLeague.Points,
    league_icon: row.league_icon || null,
    member_capacity: null,
    rank: toNumber(row.rank) || 999999,
    user_id: synthetic,
    display_name: row.league_name,
    points: rawLeague.Points,
    last_contribution_at: null,
    permission_level: null,
    role: "Discovered c0ld League",
    join_time: null,
    raw_member: { league_name: row.league_name, league_id: row.league_id, league_rank: toNumber(row.rank), synthetic_user_id: synthetic },
    raw_contribution: {},
    raw_league: rawLeague
  };
}

async function handleCurrent(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const runKey = requestedRunKey(url, env);
  let rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${requested}`,
    order: "rank.asc",
    limit: "500"
  });
  if (!rows.length) {
    rows = await supabaseSelect(env, CURRENT_TABLE, {
      select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
      league_run_key: `eq.${runKey}`,
      league_name: `ilike.${requested}`,
      order: "rank.asc",
      limit: "500"
    });
  }

  const latest = latestMeta(rows);
  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_run_key: runKey, league_name: requested, rows: [] }, env);

  const [rowsWithGains, storedLeagueRank, liveLeagueRank] = await Promise.all([
    addGainFields(env, rows, latest),
    fetchStoredLeagueRank(env, runKey, requested, latest.league_id).catch(() => null),
    boolParam(url.searchParams.get("rank_lookup"), true) ? fetchLeagueRank(requested).catch(() => null) : Promise.resolve(null)
  ]);
  const ids = rowsWithGains.map(row => row.user_id);
  const usernameMap = await resolveRobloxUsernames(ids, env).catch(() => new Map());
  const avatarMap = await resolveRobloxAvatarHeadshots(ids, env).catch(() => new Map());

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    league_run_key: latest.league_run_key,
    league_name: latest.league_name,
    league_id: latest.league_id,
    league_level: latest.league_level,
    league_points: toNumber(latest.league_points) || 0,
    league_icon: latest.league_icon || null,
    member_capacity: latest.member_capacity ?? null,
    league_rank: storedLeagueRank ?? liveLeagueRank,
    source: "ps99-league-api-worker",
    snapshot_retention: "permanent",
    rows: rowsWithGains.map(row => publicMemberRow(row, usernameMap, avatarMap))
  }, env);
}

async function handleTopLeagues(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || topLeaguesLimit(env)), 1, MAX_TOP_LEAGUES_LIMIT);
  const runKey = requestedTopLeaguesRunKey(url, env);
  const listName = topLeagueListNameForLimit(limit, env);

  let rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${listName}`,
    order: "rank.asc",
    limit: String(limit)
  });

  let latest = latestMeta(rows);
  const requestLiveFallback = boolParam(url.searchParams.get("live"), false) || boolParam(url.searchParams.get("fallback_live"), false);
  const allowLiveFallback = allowTopLeaguesLiveFallback(env) || (requestLiveFallback && limit <= scheduledTopLeaguesLimit(env));
  if (allowLiveFallback && (!rows.length || rows.length < limit || isTopLeaguesStale(latest, env))) {
    const live = await fetchTopLeagues(limit);
    const now = new Date().toISOString();
    rows = live.rows.map(row => ({
      snapshot_id: "live",
      fetched_at: now,
      source: rows.length ? "live:stale-fallback" : "live",
      league_run_key: runKey,
      league_name: listName,
      league_id: row.league_id,
      league_level: row.league_level,
      league_points: row.points,
      league_icon: row.league_icon,
      member_capacity: row.member_capacity,
      rank: row.rank,
      user_id: row.user_id,
      display_name: row.league_name,
      points: row.points,
      raw_league: row.raw_league
    }));
    latest = latestMeta(rows);
  }

  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_run_key: runKey, league_name: listName, rows: [] }, env);

  const rowsWithGains = await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: listName });
  const publicRows = rowsWithGains.map(row => {
    const out = publicLeagueRow(row);
    out.projected_gain_1h = projectGain1h(out);
    out.projected_points_1h = out.total_points + out.projected_gain_1h;
    return out;
  });

  publicRows.slice()
    .sort((a, b) => b.projected_points_1h - a.projected_points_1h || a.rank - b.rank)
    .forEach((row, index) => { row.projected_rank_1h = index + 1; });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    league_run_key: latest.league_run_key,
    league_name: listName,
    source: "ps99-league-api-worker",
    projection: "Projected rank uses current league points plus best available one-hour-equivalent gain.",
    rows: publicRows
  }, env);
}

async function handleC0ldDiscoveredLeagues(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const runKey = requestedTopLeaguesRunKey(url, env);
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 5000);
  const rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${COLD_DISCOVERED_LEAGUES_NAME}`,
    order: "rank.asc",
    limit: String(limit)
  });

  const latest = latestMeta(rows);
  const rowsWithGains = latest ? await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: COLD_DISCOVERED_LEAGUES_NAME }) : rows.map(addNullGains);
  const publicRows = rowsWithGains.map(publicDiscoveredLeagueRow);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest?.fetched_at || null,
    league_run_key: runKey,
    league_name: COLD_DISCOVERED_LEAGUES_NAME,
    rows: publicRows
  }, env);
}

async function handleC0ldLeagueOverlap(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const clan = String(url.searchParams.get("clan") || "c0ld").trim() || "c0ld";
  const runKey = requestedTopLeaguesRunKey(url, env);
  const topLimit = clamp(Number(url.searchParams.get("top_limit") || env.COLD_LEAGUES_TOP_LIMIT || DEFAULT_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT);
  const offset = clamp(Number(url.searchParams.get("offset") || 0), 0, Math.max(0, topLimit - 1));
  const batchLimit = clamp(Number(url.searchParams.get("limit") || env.COLD_LEAGUES_BATCH_SIZE || DEFAULT_COLD_LEAGUES_BATCH_SIZE), 1, MAX_COLD_LEAGUES_BATCH_SIZE);
  const concurrency = clamp(Number(url.searchParams.get("concurrency") || env.COLD_LEAGUES_CONCURRENCY || 8), 1, 12);
  const liveScan = boolParam(url.searchParams.get("live"), boolEnv(env.COLD_LEAGUES_LIVE_SCAN, false));

  const preferLiveClan = boolParam(url.searchParams.get("live_clan"), liveScan || boolEnv(env.COLD_LEAGUES_LIVE_CLAN_CURRENT, false));
  const [clanCurrent, topContext] = await Promise.all([
    fetchClanCurrentForOverlap(env, clan, preferLiveClan),
    liveScan
      ? fetchLiveTopLeagueRowsWindowForOverlap(env, runKey, offset, batchLimit, topLimit)
      : fetchTopLeagueRowsForOverlap(env, runKey, topLimit)
  ]);

  const clanMembers = new Map();
  for (const member of clanCurrent.rows || []) {
    const userId = toNumber(member.user_id);
    if (!userId) continue;
    clanMembers.set(String(userId), {
      user_id: userId,
      username: String(firstDefined(member.username, member.display_name, `user_${userId}`) || `user_${userId}`),
      avatar_url: stringOrNull(member.avatar_url),
      clan_rank: toNumber(member.rank),
      clan_points: toNumber(firstDefined(member.total_points, member.points)) || 0
    });
  }
  for (const member of c0ldMemberOverrides(env)) {
    const userId = toNumber(firstDefined(member.user_id, member.userId, member.UserID, member.id));
    if (!userId) continue;
    const existing = clanMembers.get(String(userId)) || {};
    clanMembers.set(String(userId), {
      ...existing,
      user_id: userId,
      username: bestUsernameForOverlap(userId, member.username, member.display_name, existing.username),
      avatar_url: existing.avatar_url || stringOrNull(member.avatar_url),
      clan_rank: toNumber(firstDefined(existing.clan_rank, member.clan_rank, member.rank)),
      clan_points: toNumber(firstDefined(existing.clan_points, member.clan_points, member.total_points, member.points)) || 0
    });
  }

  const batch = liveScan ? topContext.rows : topContext.rows.slice(offset, offset + batchLimit);
  if (liveScan && batch.length) {
    await persistTopLeagueWindowRows(env, runKey, batch, {
      listName: topContext.list_name || topLeagueListNameForLimit(topLimit, env),
      fetchedAt: topContext.snapshot_at || new Date().toISOString(),
      source: "live:overlap-window"
    }).catch(err => console.warn("persist live overlap top league rows failed", err?.message || String(err)));
  }
  const scanned = await mapLimit(batch, concurrency, row => scanLeagueForClanMembers(env, row, clanMembers));
  const matchedRows = scanned
    .filter(row => row.matches.length)
    .sort((a, b) => (a.rank || 999999) - (b.rank || 999999) || b.c0ld_member_count - a.c0ld_member_count);
  const discoveredUpserted = matchedRows.length
    ? await persistDiscoveredC0ldLeagues(env, runKey, matchedRows, {
      fetchedAt: topContext.snapshot_at || new Date().toISOString(),
      source: liveScan ? "live:overlap-matches" : "stored:overlap-matches"
    }).catch(err => {
      console.warn("persist discovered c0ld leagues failed", err?.message || String(err));
      return 0;
    })
    : 0;

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    clan_name: clan,
    clan_source: clanCurrent.source || null,
    clan_snapshot_at: clanCurrent.snapshot_at || null,
    clan_member_count: clanMembers.size,
    league_run_key: runKey,
    top_leagues_snapshot_at: topContext.snapshot_at,
    top_leagues_source: topContext.source || "stored",
    top_leagues_total: liveScan ? topContext.total_available : topContext.rows.length,
    top_leagues_requested: topLimit,
    offset,
    limit: batchLimit,
    next_offset: liveScan
      ? (batch.length && offset + batch.length < topLimit ? offset + batch.length : null)
      : (offset + batchLimit < Math.min(topContext.rows.length, topLimit) ? offset + batchLimit : null),
    scanned_count: batch.length,
    matched_count: matchedRows.length,
    discovered_upserted: discoveredUpserted,
    scan_errors: scanned.filter(row => row.error).map(row => ({ league_name: row.league_name, rank: row.rank, message: row.error })).slice(0, 25),
    rows: matchedRows
  }, env);
}

async function handleHistory(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const runKey = requestedRunKey(url, env);
  const userId = url.searchParams.get("user_id");
  const limit = clamp(Number(url.searchParams.get("limit") || 5000), 1, 50000);
  const hoursParam = url.searchParams.get("hours");
  const params = {
    select: "snapshot_id,fetched_at,league_run_key,league_name,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${requested}`,
    order: "fetched_at.desc,rank.asc",
    limit: String(limit)
  };
  if (hoursParam !== "all") {
    const hours = clamp(Number(hoursParam || 24), 1, 24 * 365 * 20);
    params.fetched_at = `gte.${new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()}`;
  }
  if (userId) params.user_id = `eq.${userId}`;
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, params);
  return cacheJson({ ok: true, generated_at: new Date().toISOString(), league_run_key: runKey, league_name: requested, hours: hoursParam || 24, rows }, env);
}

async function fetchClanCurrentForOverlap(env, clan, preferLive = false) {
  if (preferLive) {
    const liveRows = await fetchLiveClanRosterForOverlap(env, clan).catch(err => {
      console.warn("live clan roster lookup failed", err?.message || String(err));
      return null;
    });
    if (liveRows?.rows?.length) return liveRows;
  }

  const dbRows = await fetchClanCurrentFromSupabase(env, clan).catch(() => null);
  if (dbRows && dbRows.rows.length) return dbRows;

  if (env.COLD_CLAN_API && typeof env.COLD_CLAN_API.fetch === "function") {
    const url = new URL("https://c0ld-clan-api-worker.local/api/current");
    url.searchParams.set("clan", clan);
    url.searchParams.set("v", Date.now());
    const res = await env.COLD_CLAN_API.fetch(new Request(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }
    }));
    return parseClanCurrentResponse(res, clan);
  }

  const base = String(env.COLD_CLAN_CURRENT_URL || env.CLAN_API_CURRENT_URL || DEFAULT_COLD_CLAN_CURRENT_URL).trim();
  const url = new URL(base);
  url.searchParams.set("clan", clan);
  url.searchParams.set("v", Date.now());
  const res = await fetch(url.toString(), { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 0, cacheEverything: false } });
  return parseClanCurrentResponse(res, clan);
}

async function fetchLiveClanRosterForOverlap(env, clan) {
  const api = await fetchClanApiForOverlap(clan);
  const data = api.data || api;
  const members = collectClanMembersWithOwnerForOverlap(data);
  const dbRows = await fetchClanCurrentFromSupabase(env, clan).catch(() => null);
  const dbById = new Map((dbRows?.rows || []).map(row => [String(row.user_id), row]));
  const usernameMap = await resolveRobloxUsernames(members.map(member => getUserId(member)), env).catch(() => new Map());
  const now = new Date().toISOString();
  const rows = [];

  for (const member of members) {
    const userId = getUserId(member);
    if (!userId) continue;
    const stored = dbById.get(String(userId)) || {};
    const username = bestUsernameForOverlap(
      userId,
      usernameMap.get(userId),
      stored.username,
      stored.display_name,
      getDisplayName(member, userId)
    );
    rows.push({
      fetched_at: now,
      rank: toNumber(stored.rank),
      username,
      display_name: username,
      user_id: userId,
      total_points: toNumber(firstDefined(stored.total_points, stored.points)) || 0,
      points: toNumber(firstDefined(stored.total_points, stored.points)) || 0,
      role: roleFromPermission(firstDefined(member.PermissionLevel, member.permissionLevel, member.permission_level))
    });
  }

  return {
    ok: true,
    generated_at: now,
    snapshot_at: now,
    clan_name: clan,
    battle: dbRows?.battle || null,
    display_name: dbRows?.display_name || null,
    battle_start_iso: dbRows?.battle_start_iso || null,
    battle_end_iso: dbRows?.battle_end_iso || null,
    source: "live-clan-api",
    rows
  };
}

async function fetchClanApiForOverlap(clan) {
  const urls = [
    `https://biggamesapi.io/api/clan/${encodeURIComponent(clan)}`,
    `https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(clan)}`
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 0, cacheEverything: false } });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      const data = JSON.parse(text);
      if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`);
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw httpError(502, `Big Games clan API failed for ${clan}: ${lastError?.message || "unknown error"}`);
}

function collectClanMembersWithOwnerForOverlap(clan) {
  const members = firstArray(clan?.Members, clan?.members).slice();
  const ownerId = toNumber(firstDefined(clan?.Owner, clan?.owner, clan?.OwnerUserID, clan?.ownerUserId));
  if (ownerId && !members.some(member => getUserId(member) === ownerId)) {
    members.unshift({ UserID: ownerId, PermissionLevel: 100, OwnerInjected: true });
  }
  return members;
}

async function parseClanCurrentResponse(res, clan) {
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Clan API failed for ${clan}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);
  if (data.ok === false) throw httpError(502, `Clan API failed for ${clan}: ${data.message || "unknown error"}`);
  return { ...data, rows: Array.isArray(data.rows) ? data.rows : [] };
}

async function fetchClanCurrentFromSupabase(env, clan) {
  if (String(env.COLD_CLAN_CURRENT_FROM_SUPABASE || "true").toLowerCase() === "false") return null;
  const table = String(env.COLD_CLAN_CURRENT_TABLE || DEFAULT_COLD_CLAN_CURRENT_TABLE).trim() || DEFAULT_COLD_CLAN_CURRENT_TABLE;
  const rows = await supabaseSelect(env, table, {
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,username,user_id,total_points",
    clan_name: `eq.${clan}`,
    order: "fetched_at.desc,rank.asc",
    limit: "250"
  });
  if (!rows.length) return null;

  const latest = rows[0];
  const latestRows = rows
    .filter(row => latest.snapshot_id ? row.snapshot_id === latest.snapshot_id : row.fetched_at === latest.fetched_at)
    .sort((a, b) => (toNumber(a.rank) || 999999) - (toNumber(b.rank) || 999999));

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at || null,
    clan_name: latest.clan_name || clan,
    battle: latest.battle_key || null,
    display_name: latest.battle_display_name || latest.battle_key || null,
    battle_start_iso: latest.battle_started_at || null,
    battle_end_iso: latest.battle_ended_at || null,
    source: "supabase:" + table,
    rows: latestRows.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      username: row.username || null,
      display_name: row.username || null,
      user_id: toNumber(row.user_id),
      total_points: toNumber(row.total_points) || 0,
      points: toNumber(row.total_points) || 0
    }))
  };
}

async function fetchTopLeagueRowsForOverlap(env, runKey, limit) {
  const listName = topLeagueListNameForLimit(limit, env);
  let rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${listName}`,
    order: "rank.asc",
    limit: String(limit)
  });

  let latest = latestMeta(rows);
  const allowLiveFallback = allowTopLeaguesLiveFallback(env);
  if (allowLiveFallback && (!rows.length || rows.length < limit || isTopLeaguesStale(latest, env))) {
    const live = await fetchTopLeagues(limit);
    const now = new Date().toISOString();
    rows = live.rows.map(row => ({
      snapshot_id: "live",
      fetched_at: now,
      source: "live:overlap",
      league_run_key: runKey,
      league_name: listName,
      league_id: row.league_id,
      league_level: row.league_level,
      league_points: row.points,
      league_icon: row.league_icon,
      member_capacity: row.member_capacity,
      rank: row.rank,
      user_id: row.user_id,
      display_name: row.league_name,
      points: row.points,
      raw_league: row.raw_league
    }));
    latest = latestMeta(rows);
  }

  const rowsWithGains = latest ? await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: listName }) : rows.map(addNullGains);
  return { snapshot_at: latest?.fetched_at || null, source: listName, rows: rowsWithGains };
}

async function fetchLiveTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit) {
  const pageSize = 100;
  const listName = topLeagueListNameForLimit(topLimit, env);
  const start = clamp(offset, 0, Math.max(0, topLimit - 1));
  const end = Math.min(topLimit, start + limit);
  const startPage = Math.floor(start / pageSize) + 1;
  const endPage = Math.ceil(end / pageSize);
  const now = new Date().toISOString();
  const rows = [];

  for (let page = startPage; page <= endPage; page += 1) {
    const api = await fetchLeagueListApi(page, pageSize);
    const pageRows = leagueListFromResponse(api);
    if (!pageRows.length) break;

    pageRows.forEach((item, index) => {
      const globalIndex = (page - 1) * pageSize + index;
      if (globalIndex < start || globalIndex >= end) return;

      const summary = summarizeLeague(item, lname(item) || `League ${globalIndex + 1}`);
      if (!summary.league_name) return;

      const explicitRank = toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position));
      const rank = explicitRank && explicitRank > 0 ? explicitRank : globalIndex + 1;
      const stable = summary.league_id || summary.league_name;

      rows.push(addNullGains({
        snapshot_id: "live-window",
        fetched_at: now,
        source: "live:overlap-window",
        league_run_key: runKey,
        league_name: listName,
        league_id: summary.league_id,
        league_level: summary.league_level,
        league_points: summary.league_points,
        league_icon: summary.league_icon,
        member_capacity: summary.member_capacity,
        rank,
        user_id: stableLeagueUserId(stable),
        display_name: summary.league_name,
        points: summary.league_points,
        raw_league: { ...summary.raw_league, league_rank: rank, synthetic_user_id: stableLeagueUserId(stable) }
      }));
    });

    if (pageRows.length < pageSize) break;
  }

  return {
    source: "live-window",
    list_name: listName,
    snapshot_at: now,
    total_available: rows.length < limit ? start + rows.length : topLimit,
    rows: rows.sort((a, b) => (a.rank || 999999) - (b.rank || 999999))
  };
}

async function scanLeagueForClanMembers(env, topRow, clanMembers) {
  const publicRow = publicLeagueRow(topRow);
  let leaguePayload = normalizeRawLeague(topRow.raw_league);
  let rosterSource = hasLeagueRoster(leaguePayload) ? "stored-top-row" : "live-detail";
  let error = null;

  if (rosterSource === "live-detail") {
    try {
      const api = await fetchLeagueApi(publicRow.league_name);
      leaguePayload = api.data || api;
    } catch (err) {
      error = err?.message || String(err);
      leaguePayload = {};
    }
  }

  const leagueMembers = normalizeLeagueRows(leaguePayload);
  const matches = leagueMembers
    .map(member => ({ member, clan: clanMembers.get(String(member.user_id)) }))
    .filter(item => item.clan)
    .map(item => ({
      user_id: item.clan.user_id,
      username: bestUsernameForOverlap(item.clan.user_id, item.clan.username, item.member.display_name, item.member.username),
      avatar_url: item.clan.avatar_url,
      clan_rank: item.clan.clan_rank,
      clan_points: item.clan.clan_points,
      league_rank: toNumber(item.member.rank),
      league_points: toNumber(item.member.points) || 0,
      league_role: item.member.role || "Member",
      last_contribution_at: item.member.last_contribution_at || null
    }))
    .sort((a, b) => (b.league_points - a.league_points) || (a.clan_rank || 999999) - (b.clan_rank || 999999));

  return {
    ...publicRow,
    c0ld_member_count: matches.length,
    c0ld_league_points: matches.reduce((sum, member) => sum + (toNumber(member.league_points) || 0), 0),
    roster_source: rosterSource,
    scanned_member_count: leagueMembers.length,
    matches,
    error
  };
}

async function fetchLeagueApi(league) {
  const urls = [`https://ps99.biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`, `https://biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 0, cacheEverything: false } });
      const data = await readJsonResponse(res, url);
      if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`);
      return data;
    } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games league API failed for ${league}: ${lastError?.message || "unknown error"}`);
}

async function fetchLeagueListApi(page = 1, pageSize = 100) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(Math.min(pageSize, 100)), sort: "Points", sortOrder: "desc" });
  const urls = [`https://ps99.biggamesapi.io/v1/leagues?${qs.toString()}`, `https://biggamesapi.io/v1/leagues?${qs.toString()}`];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 0, cacheEverything: false } });
      const data = await readJsonResponse(res, url);
      if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`);
      return data;
    } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games leagues API failed: ${lastError?.message || "unknown error"}`);
}

async function readJsonResponse(res, url) {
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);

  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  const trimmed = text.trim();
  if (!contentType.includes("json") && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error(`Expected JSON from ${url}, got ${contentType || "unknown content-type"}: ${trimmed.slice(0, 160).replace(/\s+/g, " ")}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}: ${err?.message || String(err)}; sample: ${trimmed.slice(0, 160).replace(/\s+/g, " ")}`);
  }
}

async function fetchStoredLeagueRank(env, runKey, leagueNameValue, leagueId = null) {
  const labels = [TOP_LEAGUES_NAME, ALL_TOP_LEAGUES_NAME];
  const name = String(leagueNameValue || "").trim();
  const id = String(leagueId || "").trim();

  for (const label of labels) {
    if (id) {
      const byId = await supabaseSelect(env, CURRENT_TABLE, {
        select: "rank,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        league_id: `eq.${id}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const rank = toNumber(byId[0]?.rank);
      if (rank !== null) return rank;
    }

    if (name) {
      const byName = await supabaseSelect(env, CURRENT_TABLE, {
        select: "rank,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        display_name: `eq.${name}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const exactRank = toNumber(byName[0]?.rank);
      if (exactRank !== null) return exactRank;

      const byLooseName = await supabaseSelect(env, CURRENT_TABLE, {
        select: "rank,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        display_name: `ilike.${name}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const looseRank = toNumber(byLooseName[0]?.rank);
      if (looseRank !== null) return looseRank;
    }
  }

  return null;
}

async function fetchStoredTopLeagueRowsByNames(env, runKey, listName, names, limit = 100) {
  const uniqueNames = [...new Set((names || []).map(name => String(name || "").trim()).filter(Boolean))];
  if (!uniqueNames.length) return [];

  const select = "rank,fetched_at,source,league_run_key,league_name,league_id,user_id,display_name,points";
  const filters = {
    select,
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${listName}`,
    or: `(${uniqueNames.map(name => `display_name.ilike.${postgrestFilterText(name)}`).join(",")})`,
    order: "rank.asc",
    limit: String(Math.max(limit, uniqueNames.length))
  };

  try {
    return dedupeStoredTopLeagueRows(await supabaseSelect(env, CURRENT_TABLE, filters));
  } catch (err) {
    console.warn("stored top league bulk lookup failed", err?.message || String(err));
  }

  const rows = [];
  for (const name of uniqueNames) {
    const found = await supabaseSelect(env, CURRENT_TABLE, {
      select,
      league_run_key: `eq.${runKey}`,
      league_name: `eq.${listName}`,
      display_name: `ilike.${name}`,
      order: "rank.asc",
      limit: "2"
    }).catch(() => []);
    rows.push(...found);
  }
  return dedupeStoredTopLeagueRows(rows);
}

function dedupeStoredTopLeagueRows(rows) {
  const out = new Map();
  for (const row of rows || []) {
    const id = String(row.league_id || row.user_id || row.display_name || "").trim();
    if (!id) continue;
    const existing = out.get(id);
    if (!existing || (toNumber(row.rank) || 999999) < (toNumber(existing.rank) || 999999)) out.set(id, row);
  }
  return [...out.values()];
}

function topLeagueLookup(rows) {
  const byId = new Map();
  const byName = new Map();
  for (const row of rows || []) {
    const id = String(row.league_id || "").trim();
    const nameKey = key(row.display_name || "");
    if (id && !byId.has(id)) byId.set(id, row);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, row);
  }
  return { byId, byName };
}

function topLeagueLookupRow(lookup, target) {
  const id = String(target?.league_id || "").trim();
  if (id && lookup.byId.has(id)) return lookup.byId.get(id);
  for (const name of [target?.league_name, target?.requested_name]) {
    const row = lookup.byName.get(key(name));
    if (row) return row;
  }
  return null;
}

function findTopLeagueRowForTarget(rows, target) {
  const list = Array.isArray(rows) ? rows : [...rows];
  const id = String(target?.league_id || "").trim();
  if (id) {
    const byId = list.find(row => String(row.league_id || "").trim() === id);
    if (byId) return byId;
  }
  const names = new Set([target?.league_name, target?.requested_name].map(name => key(name)).filter(Boolean));
  return list.find(row => names.has(key(row.league_name))) || null;
}

async function fetchLeagueRank(leagueNameValue) {
  const api = await fetchLeagueListApi(1, 100);
  const leagues = leagueListFromResponse(api).map((item, i) => ({
    item,
    i,
    name: lname(item),
    points: lpoints(item),
    explicitRank: toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position))
  })).filter(x => x.name);
  leagues.sort((a, b) => (b.points - a.points) || (a.explicitRank || 999999) - (b.explicitRank || 999999) || a.name.localeCompare(b.name));
  const found = leagues.find(x => key(x.name) === key(leagueNameValue));
  if (!found) return null;
  return found.explicitRank && found.explicitRank > 0 ? found.explicitRank : leagues.indexOf(found) + 1;
}

async function fetchTopLeaguePages(pageNumbers, options = {}) {
  const pageSize = 100;
  const pageCache = options.pageCache || new Map();
  const rowsByUserId = options.rowsByUserId || null;
  const pacing = options.pacing || {};
  const pageDelayMs = clamp(Number(options.pageDelayMs || 0), 0, 10000);
  const initialDelayMs = clamp(Number(options.initialDelayMs || 0), 0, 10000);
  const pages = [...new Set((pageNumbers || []).map(page => Math.max(1, Math.floor(Number(page) || 1))))].sort((a, b) => a - b);
  const hasNewPages = pages.some(page => !pageCache.has(page));
  const rows = [];
  let fetchedNew = 0;

  if (hasNewPages && initialDelayMs > 0) await sleep(initialDelayMs);

  for (const page of pages) {
    if (pageCache.has(page)) {
      rows.push(...pageCache.get(page));
      continue;
    }

    if ((fetchedNew > 0 || pacing.fetched) && pageDelayMs > 0) await sleep(pageDelayMs);
    const api = await fetchLeagueListApi(page, pageSize);
    pacing.fetched = true;
    const pageRows = leagueListFromResponse(api);
    const normalized = [];

    pageRows.forEach((item, index) => {
      const globalIndex = (page - 1) * pageSize + index;
      const summary = summarizeLeague(item, lname(item) || `League ${globalIndex + 1}`);
      if (!summary.league_name) return;
      const explicitRank = toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position));
      const rank = explicitRank && explicitRank > 0 ? explicitRank : globalIndex + 1;
      const stable = summary.league_id || summary.league_name;
      const synthetic = stableLeagueUserId(stable);
      normalized.push({
        rank,
        user_id: synthetic,
        league_name: summary.league_name,
        league_id: summary.league_id,
        league_level: summary.league_level,
        league_icon: summary.league_icon,
        member_capacity: summary.member_capacity,
        points: summary.league_points,
        raw_league: { ...summary.raw_league, league_rank: rank, synthetic_user_id: synthetic }
      });
    });

    pageCache.set(page, normalized);
    for (const row of normalized) rowsByUserId?.set(String(row.user_id), row);
    rows.push(...normalized);
    fetchedNew += 1;
    if (pageRows.length < pageSize) break;
  }

  return rows;
}

function pagesForRankWindow(rank, windowSize, maxRank) {
  const pageSize = 100;
  const center = clamp(Number(rank) || 1, 1, Math.max(1, Number(maxRank) || MAX_TOP_LEAGUES_LIMIT));
  const size = Math.max(0, Number(windowSize) || 0);
  const max = Math.max(1, Number(maxRank) || MAX_TOP_LEAGUES_LIMIT);
  const startRank = clamp(center - size, 1, max);
  const endRank = clamp(center + size, 1, max);
  const startPage = Math.floor((startRank - 1) / pageSize) + 1;
  const endPage = Math.floor((endRank - 1) / pageSize) + 1;
  const pages = [];
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  return pages;
}

function pagesForExpandedRankWindow(rank, previousWindowSize, nextWindowSize, maxRank) {
  const center = clamp(Number(rank) || 1, 1, Math.max(1, Number(maxRank) || MAX_TOP_LEAGUES_LIMIT));
  const previous = Math.max(0, Number(previousWindowSize) || 0);
  const next = Math.max(previous, Number(nextWindowSize) || previous);
  const max = Math.max(1, Number(maxRank) || MAX_TOP_LEAGUES_LIMIT);
  const lowerStart = clamp(center - next, 1, max);
  const lowerEnd = clamp(center - previous - 1, 1, max);
  const upperStart = clamp(center + previous + 1, 1, max);
  const upperEnd = clamp(center + next, 1, max);
  const lowerPages = lowerStart <= lowerEnd ? pagesForRankRange(lowerStart, lowerEnd).sort((a, b) => b - a) : [];
  const upperPages = upperStart <= upperEnd ? pagesForRankRange(upperStart, upperEnd).sort((a, b) => a - b) : [];
  const out = [];
  const seen = new Set();
  const maxLen = Math.max(lowerPages.length, upperPages.length);

  for (let i = 0; i < maxLen; i += 1) {
    for (const page of [lowerPages[i], upperPages[i]]) {
      if (!page || seen.has(page)) continue;
      seen.add(page);
      out.push(page);
    }
  }

  return out;
}

function pagesForRankRange(startRank, endRank) {
  const pageSize = 100;
  const startPage = Math.floor((Math.max(1, startRank) - 1) / pageSize) + 1;
  const endPage = Math.floor((Math.max(1, endRank) - 1) / pageSize) + 1;
  const pages = [];
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  return pages;
}

async function fetchTopLeagues(limit, options = {}) {
  const capped = clamp(Number(limit) || DEFAULT_TOP_LEAGUES_LIMIT, 1, MAX_TOP_LEAGUES_LIMIT);
  const pageDelayMs = clamp(Number(options.pageDelayMs || 0), 0, 5000);
  const pageSize = clamp(Number(options.pageSize || 100), 1, 100);
  const pages = Math.ceil(capped / pageSize);
  const seen = new Set();
  const leagues = [];

  for (let page = 1; page <= pages; page += 1) {
    if (page > 1 && pageDelayMs > 0) await sleep(pageDelayMs);
    const api = await fetchLeagueListApi(page, pageSize);
    const pageRows = leagueListFromResponse(api);
    if (!pageRows.length) break;

    pageRows.forEach((item, index) => {
      const summary = summarizeLeague(item, lname(item) || `League ${index + 1}`);
      const explicitRank = toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position));
      if (!summary.league_name) return;

      const stableKey = key(summary.league_id || summary.league_name);
      if (seen.has(stableKey)) return;
      seen.add(stableKey);
      leagues.push({ item, index: leagues.length, summary, explicitRank });
    });

    if (pageRows.length < pageSize || leagues.length >= capped) break;
  }

  leagues.sort((a, b) =>
    (b.summary.league_points - a.summary.league_points) ||
    (a.explicitRank || 999999) - (b.explicitRank || 999999) ||
    a.summary.league_name.localeCompare(b.summary.league_name)
  );

  const rows = leagues.slice(0, capped).map((x, index) => {
    const rank = x.explicitRank && x.explicitRank > 0 ? x.explicitRank : index + 1;
    const stable = x.summary.league_id || x.summary.league_name;
    const synthetic = stableLeagueUserId(stable);
    return {
      rank,
      user_id: synthetic,
      league_name: x.summary.league_name,
      league_id: x.summary.league_id,
      league_level: x.summary.league_level,
      league_icon: x.summary.league_icon,
      member_capacity: x.summary.member_capacity,
      points: x.summary.league_points,
      raw_league: { ...x.summary.raw_league, league_rank: rank, synthetic_user_id: synthetic }
    };
  });

  return { source: "league-list", rows, page_size: pageSize };
}

function leagueListFromResponse(api) {
  const root = api?.data || api;
  if (Array.isArray(root?.leagues)) return root.leagues;
  if (Array.isArray(root)) return root;
  return extractLeagueObjects(root);
}

function extractLeagueObjects(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) { value.forEach(x => extractLeagueObjects(x, out)); return out; }
  const hasName = value.Name !== undefined || value.name !== undefined || value.LeagueName !== undefined || value.leagueName !== undefined;
  const hasPoints = value.Points !== undefined || value.points !== undefined || value.TotalPoints !== undefined || value.totalPoints !== undefined || value.Score !== undefined || value.score !== undefined;
  if (hasName && hasPoints) out.push(value);
  Object.values(value).forEach(x => extractLeagueObjects(x, out));
  return out;
}

function summarizeLeague(league, fallbackName) {
  const rawLeague = {
    Name: firstDefined(league.Name, league.name, league.LeagueName, league.leagueName, fallbackName),
    ID: firstDefined(league.ID, league.Id, league.id),
    Level: firstDefined(league.Level, league.level),
    Points: firstDefined(league.Points, league.points, league.TotalPoints, league.totalPoints, league.Score, league.score),
    Icon: firstDefined(league.Icon, league.icon),
    MemberCapacity: firstDefined(league.MemberCapacity, league.memberCapacity),
    Created: firstDefined(league.Created, league.created),
    Owner: firstDefined(league.Owner, league.owner)
  };
  return {
    league_name: String(rawLeague.Name || fallbackName).trim() || fallbackName,
    league_id: stringOrNull(rawLeague.ID),
    league_level: toNumber(rawLeague.Level),
    league_points: toNumber(rawLeague.Points) || 0,
    league_icon: stringOrNull(rawLeague.Icon),
    member_capacity: toNumber(rawLeague.MemberCapacity),
    raw_league: rawLeague
  };
}

function normalizeLeagueRows(league) {
  const roster = new Map();
  const owner = firstDefined(league.Owner, league.owner);
  if (owner) {
    const ownerId = getUserId(owner);
    if (ownerId) roster.set(String(ownerId), { user_id: ownerId, display_name: getDisplayName(owner, ownerId), role: "Owner", permission_level: 100, join_time: null, raw_member: owner });
  }

  for (const member of firstArray(league.Members, league.members)) {
    const userId = getUserId(member);
    if (!userId) continue;
    const existing = roster.get(String(userId)) || {};
    const permission = toNumber(firstDefined(member.PermissionLevel, member.permissionLevel));
    roster.set(String(userId), { ...existing, user_id: userId, display_name: getDisplayName(member, userId), role: existing.role === "Owner" ? "Owner" : roleFromPermission(permission), permission_level: permission, join_time: parseTimestamp(firstDefined(member.JoinTime, member.joinTime, member.Joined, member.joined)), raw_member: member });
  }

  const contributions = new Map();
  for (const item of firstArray(league.PointContributions, league.pointContributions, league.Contributions, league.contributions, league.Players, league.players)) {
    const userId = getUserId(item);
    if (!userId) continue;
    contributions.set(String(userId), { display_name: getDisplayName(item, userId), points: toNumber(firstDefined(item.Points, item.points, item.TotalPoints, item.total_points, item.Score, item.score, item.Value, item.value)) || 0, last_contribution_at: parseTimestamp(firstDefined(item.Timestamp, item.timestamp, item.LastContribution, item.lastContribution, item.Updated, item.updated)), raw_contribution: item });
    if (!roster.has(String(userId))) roster.set(String(userId), { user_id: userId, display_name: getDisplayName(item, userId), role: "Contributor", permission_level: null, join_time: null, raw_member: {} });
  }

  const rows = Array.from(roster.values()).map(member => {
    const contribution = contributions.get(String(member.user_id)) || {};
    return { ...member, display_name: contribution.display_name || member.display_name || `user_${member.user_id}`, points: toNumber(contribution.points) || 0, last_contribution_at: contribution.last_contribution_at || null, raw_contribution: contribution.raw_contribution || {} };
  });
  rows.sort((a, b) => ((toNumber(b.points) || 0) - (toNumber(a.points) || 0)) || String(a.display_name || "").localeCompare(String(b.display_name || "")));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

async function resolveRobloxUsernames(userIds, env) {
  const shouldLookup = String(env.ROBLOX_USERNAME_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  for (const id of ids) result.set(id, `user_${id}`);
  if (!shouldLookup || !ids.length) return result;
  const lookupBatch = async batch => {
    try {
      const res = await fetch("https://users.roblox.com/v1/users", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "yamo-league-api-worker" }, body: JSON.stringify({ userIds: batch, excludeBannedUsers: false }) });
      if (!res.ok) return;
      const data = await res.json();
      for (const user of data.data || []) { const id = toNumber(user.id); if (id && user.name) result.set(id, String(user.name)); }
    } catch {}
  };
  await Promise.all(chunk(ids, ROBLOX_BATCH_SIZE).map(lookupBatch));
  return result;
}

async function resolveRobloxAvatarHeadshots(userIds, env) {
  const shouldLookup = String(env.ROBLOX_AVATAR_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  if (!shouldLookup || !ids.length) return result;
  for (const batch of chunk(ids, ROBLOX_BATCH_SIZE)) {
    const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    url.searchParams.set("userIds", batch.join(","));
    url.searchParams.set("size", "150x150");
    url.searchParams.set("format", "Png");
    url.searchParams.set("isCircular", "false");
    try {
      const res = await fetch(url.toString(), { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" } });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.data || []) { const id = toNumber(item?.targetId); const imageUrl = String(item?.imageUrl || "").trim(); const state = String(item?.state || "").trim(); if (id && imageUrl && state === "Completed") result.set(id, imageUrl); }
    } catch {}
  }
  return result;
}

function publicMemberRow(row, usernameMap, avatarMap) {
  const id = toNumber(row.user_id);
  const name = displayUsername(row, usernameMap);
  return { fetched_at: row.fetched_at, league_run_key: row.league_run_key, rank: toNumber(row.rank), user_id: id, username: name, display_name: name, avatar_url: avatarMap.get(String(id)) || null, total_points: toNumber(row.points) || 0, points: toNumber(row.points) || 0, last_contribution_at: row.last_contribution_at || null, permission_level: row.permission_level ?? null, role: row.role || "Member", join_time: row.join_time || null, gain_5m: row.gain_5m, gain_1h: row.gain_1h, gain_6h: row.gain_6h, gain_12h: row.gain_12h, gain_24h: row.gain_24h };
}

function publicLeagueRow(row) {
  const raw = row.raw_league || {};
  const name = String(firstDefined(raw.Name, raw.name, raw.LeagueName, raw.leagueName, row.display_name) || "").trim();
  return { fetched_at: row.fetched_at, league_run_key: row.league_run_key, rank: toNumber(row.rank), synthetic_id: toNumber(row.user_id), league_name: name, display_name: name, league_id: stringOrNull(firstDefined(raw.ID, raw.Id, raw.id, row.league_id)), league_icon: stringOrNull(firstDefined(raw.Icon, raw.icon, row.league_icon)), total_points: toNumber(row.points) || 0, points: toNumber(row.points) || 0, gain_5m: row.gain_5m, gain_1h: row.gain_1h, gain_6h: row.gain_6h, gain_12h: row.gain_12h, gain_24h: row.gain_24h };
}

function publicDiscoveredLeagueRow(row) {
  const raw = normalizeRawLeague(row.raw_league);
  const base = publicLeagueRow(row);
  const matches = firstArray(raw.c0ld_matches, raw.cold_matches).map(member => ({
    user_id: toNumber(member.user_id),
    username: member.username || member.display_name || null,
    display_name: member.display_name || member.username || null,
    clan_rank: toNumber(member.clan_rank),
    clan_points: toNumber(member.clan_points) || 0,
    league_rank: toNumber(member.league_rank),
    rank: toNumber(member.league_rank),
    league_points: toNumber(member.league_points) || 0,
    points: toNumber(member.league_points) || 0,
    league_role: member.league_role || null,
    last_contribution_at: member.last_contribution_at || null
  })).filter(member => member.user_id || member.username);

  return {
    ...base,
    c0ld_member_count: toNumber(raw.c0ld_member_count) || matches.length,
    c0ld_league_points: toNumber(raw.c0ld_league_points) || matches.reduce((sum, member) => sum + (toNumber(member.league_points) || 0), 0),
    matches
  };
}

function projectGain1h(row) {
  const g1 = toNumber(row.gain_1h); if (g1 !== null) return g1;
  const g5 = toNumber(row.gain_5m); if (g5 !== null) return g5 * 12;
  const g6 = toNumber(row.gain_6h); if (g6 !== null) return g6 / 6;
  const g12 = toNumber(row.gain_12h); if (g12 !== null) return g12 / 12;
  const g24 = toNumber(row.gain_24h); if (g24 !== null) return g24 / 24;
  return 0;
}

async function addGainFields(env, rows, latest) {
  if (!rows.length) return [];
  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) return rows.map(addNullGains);
  const windows = [{ key: "gain_5m", minutes: 5, tolerance: 4, fallback: 20 }, { key: "gain_1h", minutes: 60, tolerance: 10, fallback: 90 }, { key: "gain_6h", minutes: 360, tolerance: 20 }, { key: "gain_12h", minutes: 720, tolerance: 25 }, { key: "gain_24h", minutes: 1440, tolerance: 45 }];
  const maps = {};
  for (const win of windows) maps[win.key] = await fetchClosestPointMap(env, latest.league_run_key, latest.league_name, latestMs, win.minutes, win.tolerance, win.fallback);
  return rows.map(row => {
    const out = { ...row };
    const currentPoints = toNumber(row.points) || 0;
    for (const win of windows) {
      const previous = maps[win.key].get(String(row.user_id));
      out[win.key] = previous === undefined ? null : currentPoints - previous;
    }
    return out;
  });
}

function addNullGains(row) { return { ...row, gain_5m: null, gain_1h: null, gain_6h: null, gain_12h: null, gain_24h: null }; }

async function maybeSendInactivityAlerts(env, context) {
  if (String(env.INACTIVE_ALERTS_ENABLED || "true").toLowerCase() === "false") return;
  const webhook = inactivityWebhookUrl(env);
  if (!webhook || !context.rows?.length) return;

  const latestMs = new Date(context.fetchedAt).getTime();
  if (!Number.isFinite(latestMs)) return;
  const previousMap = await fetchClosestPointMap(env, context.runKey, context.leagueName, latestMs, INACTIVITY_ALERT_WINDOW_MINUTES, 4, 20);
  if (!previousMap.size) return;

  const candidateRows = context.rows
    .map(row => ({ row, previous: previousMap.get(String(row.user_id)) }))
    .filter(item => item.previous !== undefined);
  if (!candidateRows.length) return;

  const usernameMap = await resolveRobloxUsernames(candidateRows.map(item => item.row.user_id), env).catch(() => new Map());
  const discordMap = inactiveDiscordMap(env);
  const targetSet = inactiveTargetSet(env, discordMap);
  const requireMapping = String(env.INACTIVE_ALERT_REQUIRE_MAPPING || "true").toLowerCase() !== "false";
  const monitored = candidateRows
    .map(item => buildInactivityCandidate(item.row, item.previous, usernameMap, discordMap))
    .filter(item => isInactiveTarget(item, targetSet, requireMapping));
  if (!monitored.length) return;

  const stateMap = await fetchInactivityStates(env, context.runKey, context.leagueName, monitored.map(item => item.userId));
  const updates = [];

  for (const item of monitored) {
    const state = stateMap.get(String(item.userId));
    const gain = item.currentPoints - item.previousPoints;
    if (gain === 0) {
      if (state?.last_snapshot_id === context.snapshotId) continue;
      const previousCount = state?.alert_active ? toNumber(state.zero_count) || 0 : 0;
      const zeroCount = previousCount + 1;
      const inactiveMinutes = zeroCount * INACTIVITY_ALERT_WINDOW_MINUTES;
      const zeroSince = state?.alert_active && state.zero_since
        ? state.zero_since
        : new Date(latestMs - INACTIVITY_ALERT_WINDOW_MINUTES * 60 * 1000).toISOString();
      const message = inactivityAlertMessage(item, inactiveMinutes);
      const sent = await upsertDiscordInactivityMessage(env, state?.discord_message_id, message);
      updates.push({
        league_run_key: context.runKey,
        league_name: context.leagueName,
        user_id: item.userId,
        display_name: item.name,
        discord_mention: item.mention || null,
        zero_since: zeroSince,
        zero_count: zeroCount,
        last_points: item.currentPoints,
        last_gain_5m: gain,
        last_snapshot_id: context.snapshotId,
        last_snapshot_at: context.fetchedAt,
        last_alert_snapshot_id: context.snapshotId,
        discord_message_id: sent?.id || state?.discord_message_id || null,
        alert_active: true,
        updated_at: new Date().toISOString()
      });
    } else if (state?.alert_active || state) {
      updates.push({
        league_run_key: context.runKey,
        league_name: context.leagueName,
        user_id: item.userId,
        display_name: item.name,
        discord_mention: item.mention || state?.discord_mention || null,
        zero_since: null,
        zero_count: 0,
        last_points: item.currentPoints,
        last_gain_5m: gain,
        last_snapshot_id: context.snapshotId,
        last_snapshot_at: context.fetchedAt,
        last_alert_snapshot_id: state?.last_alert_snapshot_id || null,
        discord_message_id: state?.discord_message_id || null,
        alert_active: false,
        updated_at: new Date().toISOString()
      });
    }
  }

  if (updates.length) await supabaseUpsert(env, INACTIVITY_ALERT_TABLE, updates, "league_run_key,league_name,user_id");
}

function buildInactivityCandidate(row, previousPoints, usernameMap, discordMap) {
  const userId = toNumber(row.user_id);
  const resolved = userId ? String(usernameMap.get(userId) || "").trim() : "";
  const name = resolved || String(row.display_name || row.user_id || "").trim();
  const identity = inactiveDiscordIdentity(row, name, discordMap);
  return {
    userId,
    name: name || (userId ? `user_${userId}` : "Unknown"),
    currentPoints: toNumber(row.points) || 0,
    previousPoints: toNumber(previousPoints) || 0,
    mention: identity.mention,
    discordUserId: identity.userId,
    mapped: identity.mapped
  };
}

function inactiveTargetSet(env, discordMap) {
  const raw = String(env.INACTIVE_ALERT_TARGET_USERS || "").trim();
  if (!raw) return discordMap.size ? new Set(discordMap.keys()) : null;
  if (raw.toLowerCase() === "all" || raw === "*") return null;
  return new Set(raw.split(",").map(item => normalizeDiscordMapKey(item)).filter(Boolean));
}

function isInactiveTarget(item, targetSet, requireMapping) {
  if (!item.userId) return false;
  if (requireMapping && !item.mapped) return false;
  if (!targetSet) return true;
  return targetSet.has(normalizeDiscordMapKey(item.userId)) || targetSet.has(normalizeDiscordMapKey(item.name));
}

function inactiveDiscordIdentity(row, name, discordMap) {
  const candidates = [row.user_id, name, row.display_name].map(normalizeDiscordMapKey).filter(Boolean);
  for (const key of candidates) {
    if (!discordMap.has(key)) continue;
    const parsed = parseDiscordMention(discordMap.get(key));
    return { ...parsed, mapped: true };
  }
  return { mention: name, userId: null, mapped: false };
}

function inactiveDiscordMap(env) {
  const raw = String(env.INACTIVE_ALERT_DISCORD_USERS || env.INACTIVE_ALERT_USER_MAP || "").trim();
  const parsed = parseJsonObject(raw);
  const map = new Map();
  for (const [key, value] of Object.entries(parsed)) {
    const normalized = normalizeDiscordMapKey(key);
    if (normalized) map.set(normalized, String(value || "").trim());
  }
  return map;
}

function parseDiscordMention(value) {
  const text = String(value || "").trim();
  const match = text.match(/^<@!?(\d+)>$/) || text.match(/^(\d{15,25})$/);
  if (match) return { mention: `<@${match[1]}>`, userId: match[1] };
  return { mention: text, userId: null };
}

function inactivityAlertMessage(item, inactiveMinutes) {
  const who = item.mention || item.name;
  const nameSuffix = item.mention && item.name && item.mention !== item.name ? ` (${item.name})` : "";
  const content = inactiveMinutes <= INACTIVITY_ALERT_WINDOW_MINUTES
    ? `${who}${nameSuffix} gained 0 points in the last ${INACTIVITY_ALERT_WINDOW_MINUTES} minutes.`
    : `${who}${nameSuffix} has gained 0 points for ${inactiveMinutes} minutes.`;
  const allowed_mentions = item.discordUserId ? { parse: [], users: [item.discordUserId] } : { parse: [] };
  return { content, allowed_mentions };
}

async function upsertDiscordInactivityMessage(env, messageId, payload) {
  if (messageId && String(env.INACTIVE_ALERT_EDIT_MESSAGES || "true").toLowerCase() !== "false") {
    const edited = await sendDiscordWebhook(env, payload, messageId).catch(() => null);
    if (edited) return edited;
  }
  return sendDiscordWebhook(env, payload);
}

async function sendDiscordWebhook(env, payload, messageId = null) {
  const webhook = inactivityWebhookUrl(env);
  if (!webhook) return null;
  const url = new URL(webhook);
  url.search = "";
  if (messageId) {
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/messages/${encodeURIComponent(messageId)}`;
  } else {
    url.searchParams.set("wait", "true");
  }
  const res = await fetch(url.toString(), {
    method: messageId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Discord inactivity webhook failed: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function fetchInactivityStates(env, runKey, leagueName, userIds) {
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  if (!ids.length) return new Map();
  const rows = await supabaseSelect(env, INACTIVITY_ALERT_TABLE, {
    select: "league_run_key,league_name,user_id,display_name,discord_mention,zero_since,zero_count,last_points,last_gain_5m,last_snapshot_id,last_snapshot_at,last_alert_snapshot_id,discord_message_id,alert_active",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${leagueName}`,
    user_id: `in.(${ids.join(",")})`,
    limit: "500"
  });
  return new Map(rows.map(row => [String(row.user_id), row]));
}

async function fetchClosestPointMap(env, runKey, league, latestMs, minutes, toleranceMinutes, fallbackMinutes = 0) {
  const targetMs = latestMs - minutes * 60 * 1000;
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, { select: "snapshot_id,fetched_at,user_id,points", league_run_key: `eq.${runKey}`, league_name: `eq.${league}`, fetched_at: `gte.${new Date(targetMs - toleranceMinutes * 60 * 1000).toISOString()}`, fetched_at_lte: `lte.${new Date(targetMs + toleranceMinutes * 60 * 1000).toISOString()}`, order: "fetched_at.desc,rank.asc", limit: "5000" }, { paramRename: { fetched_at_lte: "fetched_at" } });
  if (rows.length) return closestSnapshotPointMap(rows, targetMs);
  if (!fallbackMinutes) return new Map();
  const fallbackRows = await supabaseSelect(env, SNAPSHOT_TABLE, { select: "snapshot_id,fetched_at,user_id,points", league_run_key: `eq.${runKey}`, league_name: `eq.${league}`, fetched_at: `gte.${new Date(targetMs - fallbackMinutes * 60 * 1000).toISOString()}`, fetched_at_lte: `lte.${new Date(targetMs).toISOString()}`, order: "fetched_at.desc,rank.asc", limit: "5000" }, { paramRename: { fetched_at_lte: "fetched_at" } });
  return fallbackRows.length ? closestSnapshotPointMap(fallbackRows, targetMs) : new Map();
}

function closestSnapshotPointMap(rows, targetMs) {
  const snapshots = new Map();
  for (const row of rows) {
    const id = String(row.snapshot_id || "");
    if (!id) continue;
    if (!snapshots.has(id)) snapshots.set(id, { distance: Math.abs(new Date(row.fetched_at).getTime() - targetMs), points: new Map() });
    snapshots.get(id).points.set(String(row.user_id), toNumber(row.points) || 0);
  }
  return (Array.from(snapshots.values()).sort((a, b) => a.distance - b.distance)[0]?.points) || new Map();
}

function latestMeta(rows) {
  if (!rows.length) return null;
  const row = rows.slice().sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0];
  return { snapshot_id: row.snapshot_id, fetched_at: row.fetched_at, league_run_key: row.league_run_key, league_name: row.league_name, league_id: row.league_id, league_level: row.league_level, league_points: row.league_points, league_icon: row.league_icon, member_capacity: row.member_capacity };
}

function isTopLeaguesStale(latest, env) {
  if (!latest?.fetched_at) return true;
  const maxMinutes = clamp(Number(env.TOP_LEAGUES_MAX_STALE_MINUTES || DEFAULT_TOP_LEAGUES_MAX_STALE_MINUTES), 1, 24 * 60 * 30);
  const fetchedMs = new Date(latest.fetched_at).getTime();
  return !Number.isFinite(fetchedMs) || Date.now() - fetchedMs > maxMinutes * 60 * 1000;
}

function normalizeRawLeague(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

function hasLeagueRoster(raw) {
  return Boolean(
    firstArray(raw.Members, raw.members).length ||
    firstArray(raw.PointContributions, raw.pointContributions, raw.Contributions, raw.contributions, raw.Players, raw.players).length
  );
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

async function replaceCurrentRows(env, table, filters, rows) { await supabaseDelete(env, table, filters); if (rows.length) await supabaseInsert(env, table, rows); }
async function supabaseSelect(env, table, params = {}, options = {}) { return supabaseFetch(env, table, { method: "GET", params, paramRename: options.paramRename }); }
async function supabaseInsert(env, table, rows) { if (!rows.length) return []; return supabaseFetch(env, table, { method: "POST", body: rows, headers: { Prefer: "return=minimal" } }); }
async function supabaseUpsert(env, table, rows, conflictColumns) { if (!rows.length) return []; return supabaseFetch(env, table, { method: "POST", params: { on_conflict: conflictColumns }, body: rows, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } }); }
async function supabaseDelete(env, table, filters = {}) { return supabaseFetch(env, table, { method: "DELETE", params: filters, headers: { Prefer: "return=minimal" } }); }

async function supabaseFetch(env, table, options = {}) {
  requireSupabase(env);
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const url = new URL(`${base}/rest/v1/${table}`);
  const rename = options.paramRename || {};
  for (const [key, value] of Object.entries(options.params || {})) if (value !== undefined && value !== null && value !== "") url.searchParams.append(rename[key] || key, String(value));
  const res = await fetch(url.toString(), { method: options.method || "GET", headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) }, body: options.body ? JSON.stringify(options.body) : undefined });
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Supabase ${options.method || "GET"} ${table} failed: ${text.slice(0, 1000)}`);
  return text ? JSON.parse(text) : [];
}

function stableLeagueUserId(value) { let h = 2166136261; const text = String(value || "unknown"); for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 9000000000000 + h; }
function requireSupabase(env) { if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_KEY are required"); }
function requireAdmin(request, env) { const expected = String(env.INGEST_ADMIN_TOKEN || "").trim(); if (!expected) throw httpError(500, "INGEST_ADMIN_TOKEN is not configured"); const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim(); if (token !== expected) throw httpError(401, "Unauthorized"); }
function leagueName(env) { return String(env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME).trim() || DEFAULT_LEAGUE_NAME; }
function leagueNames(env) { const raw = String(env.LEAGUE_NAMES || env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME); const names = raw.split(",").map(item => item.trim()).filter(Boolean); return names.length ? [...new Set(names)] : [DEFAULT_LEAGUE_NAME]; }
function normalizeRunKey(value) { return String(value || DEFAULT_LEAGUE_RUN_KEY).trim() || DEFAULT_LEAGUE_RUN_KEY; }
function leagueRunKey(env) { return normalizeRunKey(env.LEAGUE_RUN_KEY || env.LEAGUE_SEASON_KEY || DEFAULT_LEAGUE_RUN_KEY); }
function topLeaguesRunKey(env) { return normalizeRunKey(env.TOP_LEAGUES_RUN_KEY || env.LEAGUE_RUN_KEY || env.LEAGUE_SEASON_KEY || DEFAULT_LEAGUE_RUN_KEY); }
function topLeaguesLimit(env) { return clamp(Number(env.TOP_LEAGUES_LIMIT || DEFAULT_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT); }
function scheduledTopLeaguesLimit(env) { return clamp(Number(env.SCHEDULED_TOP_LEAGUES_LIMIT || env.TOP_LEAGUES_SCHEDULE_LIMIT || DEFAULT_TOP_LEAGUES_LIMIT), 1, DEFAULT_TOP_LEAGUES_LIMIT); }
function allTopLeaguesLimit(env) { return clamp(Number(env.ALL_TOP_LEAGUES_LIMIT || env.TOP_LEAGUES_ALL_LIMIT || DEFAULT_ALL_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT); }
function topLeagueListNameForLimit(limit, env) { return Number(limit) > scheduledTopLeaguesLimit(env) ? ALL_TOP_LEAGUES_NAME : TOP_LEAGUES_NAME; }
function topLeaguesPageDelayMs(env) { return clamp(Number(env.TOP_LEAGUES_PAGE_DELAY_MS || DEFAULT_TOP_LEAGUES_PAGE_DELAY_MS), 0, 5000); }
function allTopLeaguesPageDelayMs(env) { return clamp(Number(env.ALL_TOP_LEAGUES_PAGE_DELAY_MS || DEFAULT_ALL_TOP_LEAGUES_PAGE_DELAY_MS), 0, 5000); }
function allTopLeaguesPageSize(env) { return DEFAULT_ALL_TOP_LEAGUES_PAGE_SIZE; }
function trackedRankWindowSize(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_SIZE || DEFAULT_TRACKED_RANK_WINDOW_SIZE), 1, MAX_TOP_LEAGUES_LIMIT); }
function trackedRankWindowPageDelayMs(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_PAGE_DELAY_MS || DEFAULT_TRACKED_RANK_WINDOW_PAGE_DELAY_MS), 0, 10000); }
function trackedRankWindowExpansionPageDelayMs(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS || env.TRACKED_RANK_WINDOW_PAGE_DELAY_MS || DEFAULT_TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS), 0, 10000); }
function shouldRunTrackedRankWindowRefresh(env) { return boolEnv(env.INGEST_TRACKED_RANK_WINDOWS ?? env.INGEST_ALL_TOP_LEAGUES, true); }
function boolEnv(value, defaultValue = false) { if (value === undefined || value === null || value === "") return defaultValue; return !FALSEY_ENV_VALUES.has(String(value).trim().toLowerCase()); }
function boolParam(value, defaultValue = false) { return value === null || value === undefined || value === "" ? defaultValue : boolEnv(value, defaultValue); }
function allowTopLeaguesLiveFallback(env) { return !boolEnv(env.TOP_LEAGUES_STRICT_DB_ONLY, true) && boolEnv(env.TOP_LEAGUES_LIVE_FALLBACK, false); }
function runKeyParam(url) { return url.searchParams.get("run") || url.searchParams.get("league_run_key") || url.searchParams.get("season"); }
function requestedRunKey(url, env) { return normalizeRunKey(runKeyParam(url) || leagueRunKey(env)); }
function requestedTopLeaguesRunKey(url, env) { return normalizeRunKey(runKeyParam(url) || topLeaguesRunKey(env)); }
function inactivityWebhookUrl(env) { return String(env.INACTIVE_ALERT_WEBHOOK_URL || env.DISCORD_INACTIVE_ALERT_WEBHOOK_URL || "").trim(); }
function roleFromPermission(value) { const n = toNumber(value); if (n === 100) return "Owner"; if (n && n >= 90) return "Officer"; if (n && n >= 50) return "Staff"; return "Member"; }
function getUserId(item) { if (typeof item === "number") return item; return toNumber(firstDefined(item?.UserID, item?.UserId, item?.userID, item?.userId, item?.user_id, item?.id, item?.ID)); }
function getDisplayName(item, fallbackId) { if (typeof item === "number") return `user_${item}`; return String(firstDefined(item?.DisplayName, item?.displayName, item?.Username, item?.username, item?.Name, item?.name, fallbackId ? `user_${fallbackId}` : "") || "").trim(); }
function firstArray(...values) { for (const value of values) if (Array.isArray(value)) return value; return []; }
function firstDefined(...values) { for (const value of values) if (value !== undefined && value !== null && value !== "") return value; return null; }
function toNumber(value) { if (value === null || value === undefined || value === "") return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
function stringOrNull(value) { const text = String(value ?? "").trim(); return text || null; }
function postgrestFilterText(value) { return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`; }
function parseJsonObject(raw) { if (!raw) return {}; try { const parsed = JSON.parse(raw); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } }
function c0ldMemberOverrides(env) {
  const raw = String(env.COLD_MEMBER_OVERRIDES_JSON || env.COLD_LEAGUES_MEMBER_OVERRIDES_JSON || "").trim();
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === "object");
  if (!parsed || typeof parsed !== "object") return [];
  return Object.entries(parsed).map(([userId, value]) => {
    if (value && typeof value === "object") return { user_id: userId, ...value };
    return { user_id: userId, username: String(value || "").trim() };
  });
}
function normalizeDiscordMapKey(value) { return String(value ?? "").trim().toLowerCase().replace(/^<@!?(\d+)>$/, "$1"); }
function parseTimestamp(value) { if (value === null || value === undefined || value === "") return null; if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim())) { const n = Number(value); if (!Number.isFinite(n) || n <= 0) return null; const ms = n > 1e12 ? n : n * 1000; const date = new Date(ms); return Number.isNaN(date.getTime()) ? null : date.toISOString(); } const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
function clamp(value, min, max) { const n = Number(value); if (!Number.isFinite(n)) return min; return Math.min(max, Math.max(min, n)); }
function key(v) { return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function lname(r) { return String(firstDefined(r.Name, r.name, r.LeagueName, r.leagueName, "") || "").trim(); }
function lpoints(r) { const n = Number(firstDefined(r.Points, r.points, r.TotalPoints, r.totalPoints, r.Score, r.score, 0)); return Number.isFinite(n) ? n : 0; }
function isFallbackUsername(username, userId) { const text = String(username || "").trim(); const id = String(userId || "").trim(); return !text || (id && text === id) || /^user_\d+$/i.test(text); }
function bestUsernameForOverlap(userId, ...values) { const names = values.map(value => String(value || "").trim()).filter(Boolean); return names.find(name => !isFallbackUsername(name, userId)) || names[0] || `user_${userId}`; }
function displayUsername(row, usernameMap) { const id = toNumber(row.user_id); const existing = String(row.display_name || "").trim(); const resolved = id ? String(usernameMap.get(id) || "").trim() : ""; if (resolved && !isFallbackUsername(resolved, id)) return resolved; if (existing && !isFallbackUsername(existing, id)) return existing; return existing || (id ? `user_${id}` : ""); }
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function json(payload, status = 200, headers = {}) { return new Response(JSON.stringify(payload, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } }); }
function cacheJson(payload, env) { const seconds = clamp(Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS), 0, 3600); return json(payload, 200, { "Cache-Control": seconds > 0 ? `public, max-age=${seconds}` : "no-store" }); }
function withCors(response, request, env) { const origin = request.headers.get("Origin") || ""; const allowed = allowedOrigins(env); const allowOrigin = !origin ? "*" : (allowed.has("*") || allowed.has(origin) ? origin : Array.from(allowed)[0] || "*"); const headers = new Headers(response.headers); headers.set("Access-Control-Allow-Origin", allowOrigin); headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization"); headers.set("Vary", "Origin"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
function allowedOrigins(env) { const raw = String(env.SITE_ORIGINS || "https://oapl.github.io,*"); return new Set(raw.split(",").map(item => item.trim()).filter(Boolean)); }
function httpError(status, message) { const err = new Error(message); err.status = status; return err; }
