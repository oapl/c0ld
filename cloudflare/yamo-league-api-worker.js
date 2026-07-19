const SNAPSHOT_TABLE = "ps99_league_snapshots";
const CURRENT_TABLE = "ps99_league_current";
const DEFAULT_LEAGUE_NAME = "YAMO";
const DEFAULT_LEAGUE_RUN_KEY = "tap-heroes-part-2";
const DEFAULT_LEAGUE_RUN_LABEL = "Tap Heroes Part 2";
const DEFAULT_LEAGUE_BASELINE_RUN_KEY = "active";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const TOP_LEAGUES_NAME = "GLOBAL_TOP_1000_LEAGUES";
const ALL_TOP_LEAGUES_NAME = "GLOBAL_TOP_10000_LEAGUES";
const COLD_DISCOVERED_LEAGUES_NAME = "C0LD_DISCOVERED_LEAGUES";
const DEFAULT_TOP_LEAGUES_LIMIT = 1000;
const DEFAULT_ALL_TOP_LEAGUES_LIMIT = 10000;
const MAX_TOP_LEAGUES_LIMIT = 10000;
const DEFAULT_COLD_LEAGUES_BATCH_SIZE = 10;
const MAX_COLD_LEAGUES_BATCH_SIZE = 40;
const DEFAULT_TOP_LEAGUES_PAGE_DELAY_MS = 2500;
const DEFAULT_TOP_LEAGUES_PAGE_SIZE = 100;
const DEFAULT_ALL_TOP_LEAGUES_PAGE_DELAY_MS = 2500;
const DEFAULT_ALL_TOP_LEAGUES_PAGE_SIZE = 10;
const DEFAULT_TRACKED_RANK_WINDOW_SIZE = 50;
const DEFAULT_TRACKED_RANK_WINDOW_PAGE_DELAY_MS = 2500;
const DEFAULT_TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS = 2500;
const DEFAULT_COLD_CLAN_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/current";
const DEFAULT_COLD_CLAN_CURRENT_TABLE = "c0ld_clan_current";
const ROBLOX_BATCH_SIZE = 100;
const USER_LOOKUP_CACHE_TABLE = "c0ld_user_lookup_cache";
const INACTIVITY_ALERT_TABLE = "ps99_league_inactivity_alerts";
const INACTIVITY_ALERT_WINDOW_MINUTES = 5;
const FALSEY_ENV_VALUES = new Set(["false", "0", "no", "off"]);
const DEFAULT_LEAGUE_POINTS_BLACKLIST_JSON = '{"leagues":[],"players":["Younes89755","1856284829"]}';
const DEFAULT_LEAGUE_MILESTONE_RANKS = [1, 3, 15, 50, 100, 250, 2000];
let publicVisibilityCacheRaw = null;
let publicVisibilityCacheValue = null;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/health") {
        response = json({ ok: true, service: "ps99-league-api", league_collection_enabled: leagueCollectionEnabled(env), league_name: leagueName(env), league_names: leagueNames(env), c0ld_league_names: c0ldLeagueNames(env), alt_league_names: altLeagueNames(env), league_run_key: leagueRunKey(env), league_run_label: leagueRunLabel(env, leagueRunKey(env)), league_baseline_run_key: leagueBaselineRunKey(env, leagueRunKey(env)), league_points_are_run_only: shouldNormalizeLeagueRunPoints(env, leagueRunKey(env)), snapshot_retention: "permanent", tracked_league_ingest_mode: "bulk", scheduled_rank_windows: leagueCollectionEnabled(env) && shouldRunTrackedRankWindowRefresh(env), top_leagues: TOP_LEAGUES_NAME, top_leagues_limit: topLeaguesLimit(env), top_leagues_page_size: topLeaguesPageSize(env), top_leagues_page_delay_ms: topLeaguesPageDelayMs(env), all_top_leagues: ALL_TOP_LEAGUES_NAME, all_top_leagues_limit: allTopLeaguesLimit(env), all_top_leagues_page_size: allTopLeaguesPageSize(env), all_top_leagues_page_delay_ms: allTopLeaguesPageDelayMs(env) });
      } else if (request.method === "GET" && url.pathname === "/api/leagues/current") {
        response = await handleCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/history") {
        response = await handleHistory(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/profile") {
        response = await handleProfile(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/top-leagues") {
        response = await handleTopLeagues(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/solo-leaderboard") {
        response = await handleSoloLeaderboard(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/player-location") {
        response = await handleLeaguePlayerLocation(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/milestones") {
        response = await handleLeagueMilestones(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/top-leagues/window") {
        requireLeagueCollectionEnabled(env);
        response = await handleTopLeaguesWindowIngest(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/c0ld-overlap") {
        requireLeagueCollectionEnabled(env);
        response = await handleC0ldLeagueOverlap(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/leagues/c0ld-discovered") {
        response = await handleC0ldDiscoveredLeagues(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/leagues/ingest-all") {
        requireAdmin(request, env);
        requireLeagueCollectionEnabled(env);
        response = await handleTrackedLeaguesIngest(env, "manual", runKeyParam(url));
      } else if (request.method === "POST" && (url.pathname === "/api/leagues/ingest" || url.pathname === "/api/ingest")) {
        requireAdmin(request, env);
        requireLeagueCollectionEnabled(env);
        response = await handleIngest(env, "manual", url.searchParams.get("league"), runKeyParam(url));
      } else if (request.method === "POST" && url.pathname === "/api/leagues/top-leagues/ingest") {
        requireAdmin(request, env);
        requireLeagueCollectionEnabled(env);
        const ingestLimit = clamp(Number(url.searchParams.get("limit") || topLeaguesLimit(env)), 1, MAX_TOP_LEAGUES_LIMIT);
        const ingestListName = topLeagueListNameForLimit(ingestLimit, env);
        const requestedPageSize = url.searchParams.get("page_size") || url.searchParams.get("pageSize");
        const defaultPageSize = ingestListName === ALL_TOP_LEAGUES_NAME ? allTopLeaguesPageSize(env) : topLeaguesPageSize(env);
        const ingestPageSize = clamp(Number(requestedPageSize || defaultPageSize), 1, 100);
        response = await handleTopLeaguesIngest(env, "manual", runKeyParam(url), {
          listName: ingestListName,
          limit: ingestLimit,
          pageDelayMs: ingestListName === ALL_TOP_LEAGUES_NAME ? allTopLeaguesPageDelayMs(env) : topLeaguesPageDelayMs(env),
          pageSize: ingestPageSize
        });
      } else if (request.method === "POST" && url.pathname === "/api/leagues/rank-windows/refresh") {
        requireAdmin(request, env);
        requireLeagueCollectionEnabled(env);
        response = await handleTrackedLeagueRankWindowRefresh(env, "manual:rank-window", runKeyParam(url));
      } else if (request.method === "POST" && url.pathname === "/api/leagues/run/reset") {
        requireAdmin(request, env);
        response = await handleLeagueRunReset(env, runKeyParam(url));
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({ ok: false, message: err?.message || String(err) }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    if (!leagueCollectionEnabled(env)) {
      console.log("scheduled league collection skipped: LEAGUE_COLLECTION_ENABLED is false");
      return;
    }
    ctx.waitUntil((async () => {
      if (String(env.INGEST_TOP_LEAGUES || "true").toLowerCase() !== "false") {
        await handleTopLeaguesIngest(env, "schedule", topLeaguesRunKey(env), {
          listName: TOP_LEAGUES_NAME,
          limit: scheduledTopLeaguesLimit(env),
          pageSize: topLeaguesPageSize(env),
          pageDelayMs: topLeaguesPageDelayMs(env),
          allowApiFallback: false
        }).catch(err => console.error("scheduled top 1000 leagues ingest failed", err?.message || String(err)));
      }
      if (String(env.INGEST_LEAGUES || "true").toLowerCase() !== "false") {
        await handleTrackedLeaguesIngest(env, "schedule", leagueRunKey(env), { allowApiFallback: false })
          .then(response => response.clone().json().catch(() => ({})))
          .then(payload => console.log("scheduled tracked league ingest complete", JSON.stringify(payload)))
          .catch(err => console.error("scheduled tracked league ingest failed", err?.message || String(err)));
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
  let summary = summarizeLeague(league, requested);
  let memberRows = normalizeLeagueRows(league);
  ({ summary, memberRows } = await normalizeTrackedLeagueForRun(env, runKey, summary, memberRows));
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

async function handleTrackedLeaguesIngest(env, source, requestedRunKey, options = {}) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const runKey = normalizeRunKey(requestedRunKey || leagueRunKey(env));
  const names = leagueNames(env);
  const concurrency = clamp(Number(env.LEAGUE_INGEST_CONCURRENCY || env.INGEST_LEAGUES_CONCURRENCY || 8), 1, 12);
  const results = await mapLimit(names, concurrency, async requested => {
    try {
      const api = await fetchLeagueApi(requested, { allowFallback: options.allowApiFallback !== false });
      const league = api.data || api;
      let summary = summarizeLeague(league, requested);
      let memberRows = normalizeLeagueRows(league);
      ({ summary, memberRows } = await normalizeTrackedLeagueForRun(env, runKey, summary, memberRows));
      const snapshotId = `league:${runKey}:${summary.league_name}:${fetchedAt}`;
      const rows = memberRows.map(row => ({
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
      return { requested, ok: true, league_name: summary.league_name, league_id: summary.league_id, rows_inserted: rows.length, rows };
    } catch (err) {
      return { requested, ok: false, message: err?.message || String(err), rows: [] };
    }
  });

  const dbRows = results.flatMap(result => result.rows || []);
  const leagueNamesWritten = [...new Set(results.filter(result => result.ok).map(result => result.league_name).filter(Boolean))];

  if (dbRows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, dbRows);
    await supabaseUpsert(env, CURRENT_TABLE, dbRows.map(row => ({ ...row, updated_at: fetchedAt })), "league_run_key,league_name,user_id");
    await deleteStaleCurrentLeagueRows(env, runKey, leagueNamesWritten, fetchedAt);
  }

  return json({
    ok: results.every(result => result.ok),
    league_run_key: runKey,
    fetched_at: fetchedAt,
    source,
    requested_count: names.length,
    leagues_written: leagueNamesWritten.length,
    rows_inserted: dbRows.length,
    failed_count: results.filter(result => !result.ok).length,
    results: results.map(({ rows, ...result }) => result)
  }, 202);
}

async function handleTopLeaguesIngest(env, source, requestedRunKey, options = {}) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const runKey = normalizeRunKey(requestedRunKey || topLeaguesRunKey(env));
  const listName = options.listName || TOP_LEAGUES_NAME;
  const limit = clamp(Number(options.limit || (source === "schedule" ? scheduledTopLeaguesLimit(env) : topLeaguesLimit(env))), 1, MAX_TOP_LEAGUES_LIMIT);
  const top = await fetchTopLeagues(limit, { pageDelayMs: options.pageDelayMs ?? topLeaguesPageDelayMs(env), pageSize: options.pageSize, allowApiFallback: options.allowApiFallback !== false });
  const snapshotPrefix = listName === ALL_TOP_LEAGUES_NAME ? "all_top_leagues" : "top_leagues";
  const snapshotId = `${snapshotPrefix}:${runKey}:${fetchedAt}`;
  const normalizedTopRows = await normalizeTopLeagueRowsForRun(env, runKey, listName, top.rows, { recomputeRanks: true });

  const dbRows = normalizedTopRows.map(row => topLeagueDbRow(row, {
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

async function handleTopLeaguesWindowIngest(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const runKey = requestedTopLeaguesRunKey(url, env);
  const topLimit = clamp(Number(url.searchParams.get("top_limit") || env.COLD_LEAGUES_TOP_LIMIT || DEFAULT_ALL_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT);
  const offset = clamp(Number(url.searchParams.get("offset") || 0), 0, Math.max(0, topLimit - 1));
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 100);
  const topContext = await fetchLiveTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit);
  const rowsToPersist = topContext.persist_rows || topContext.rows || [];
  const listName = topContext.list_name || topLeagueListNameForLimit(topLimit, env);
  const responseRows = await normalizeTopLeagueRowsForRun(env, runKey, listName, topContext.rows || [], { recomputeRanks: false });

  if (rowsToPersist.length) {
    await persistTopLeagueWindowRows(env, runKey, rowsToPersist, {
      listName,
      fetchedAt: topContext.snapshot_at || new Date().toISOString(),
      source: "live:rank-baseline-window"
    });
  }

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    league_run_key: runKey,
    league_name: listName,
    league_run_label: leagueRunLabel(env, runKey),
    snapshot_at: topContext.snapshot_at,
    offset,
    limit,
    top_leagues_requested: topLimit,
    rows_inserted: rowsToPersist.length,
    rows: responseRows.map(publicLeagueRow).filter(row => !isLeaguePubliclyHidden(env, row.league_name)),
    next_offset: offset + limit < topLimit ? offset + limit : null
  }, env);
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
    const topRank = visibleLeagueRank(topRow?.rank);
    if (topRank !== null && topRank <= scheduledLimit) {
      skippedTop.push({ league_name: target.league_name, rank: topRank });
      continue;
    }

    const seedRow = topLeagueLookupRow(seedLookup, target);
    const seedRank = visibleLeagueRank(seedRow?.rank);
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
  const normalizedRows = await normalizeTopLeagueRowsForRun(env, runKey, ALL_TOP_LEAGUES_NAME, rows, { recomputeRanks: false });
  const dbRows = normalizedRows.map(row => topLeagueDbRow(row, {
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
  const normalizedRows = await normalizeTopLeagueRowsForRun(env, runKey, listName, rows, { recomputeRanks: false });
  const dbRows = normalizedRows.map(row => topLeagueDbRow(row, {
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
  if (isLeaguePubliclyHidden(env, requested)) {
    return cacheJson(hiddenLeaguePayload(env, runKey, requested), env);
  }
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
  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_run_key: runKey, league_run_label: leagueRunLabel(env, runKey), league_name: requested, rows: [] }, env);

  const [rowsWithGains, storedLeagueRank, liveLeagueRank] = await Promise.all([
    addGainFields(env, rows, latest),
    fetchStoredLeagueRank(env, runKey, requested, latest.league_id).catch(() => null),
    boolParam(url.searchParams.get("rank_lookup"), true) && !shouldNormalizeLeagueRunPoints(env, runKey)
      ? fetchLeagueRank(requested).catch(() => null)
      : Promise.resolve(null)
  ]);
  const ids = rowsWithGains.map(row => row.user_id);
  const usernameMap = await resolveRobloxUsernames(ids, env).catch(() => new Map());
  const avatarMap = await resolveRobloxAvatarHeadshots(ids, env).catch(() => new Map());

  const publicRows = rowsWithGains
    .map(row => publicMemberRow(row, usernameMap, avatarMap))
    .map(row => redactPublicMemberPoints(env, row));

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    league_run_key: latest.league_run_key,
    league_run_label: leagueRunLabel(env, latest.league_run_key),
    baseline_run_key: leagueBaselineRunKey(env, latest.league_run_key) || null,
    points_are_run_only: shouldNormalizeLeagueRunPoints(env, latest.league_run_key),
    league_name: latest.league_name,
    league_id: latest.league_id,
    league_level: latest.league_level,
    league_points: toNumber(latest.league_points) || 0,
    league_icon: latest.league_icon || null,
    member_capacity: latest.member_capacity ?? null,
    league_rank: storedLeagueRank ?? liveLeagueRank,
    source: "ps99-league-api-worker",
    snapshot_retention: "permanent",
    rows: publicRows
  }, env);
}

async function handleTopLeagues(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || topLeaguesLimit(env)), 1, MAX_TOP_LEAGUES_LIMIT);
  const offset = clamp(Number(url.searchParams.get("offset") || 0), 0, MAX_TOP_LEAGUES_LIMIT - 1);
  const runKey = requestedTopLeaguesRunKey(url, env);
  const listName = requestedTopLeagueListName(url, limit, env);
  const rows = await fetchStoredTopLeagueRows(env, runKey, listName, limit, offset);

  let latest = latestMeta(rows);

  if (!latest) return cacheJson({ ok: true, generated_at: new Date().toISOString(), snapshot_at: null, league_run_key: runKey, league_run_label: leagueRunLabel(env, runKey), league_name: listName, rows: [] }, env);

  const rowsWithGains = await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: listName });
  const publicRows = rowsWithGains.map(row => {
    const out = publicLeagueRow(row);
    out.projected_gain_1h = projectGain1h(out);
    out.projected_points_1h = out.total_points + out.projected_gain_1h;
    return out;
  });

  publicRows.filter(row => row.total_points > 0 || row.projected_points_1h > 0)
    .sort((a, b) => b.projected_points_1h - a.projected_points_1h || a.rank - b.rank)
    .forEach((row, index) => { row.projected_rank_1h = index + 1; });
  publicRows.filter(row => row.total_points <= 0 && row.projected_points_1h <= 0)
    .forEach(row => { row.projected_rank_1h = null; });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    league_run_key: latest.league_run_key,
    league_run_label: leagueRunLabel(env, latest.league_run_key),
    baseline_run_key: leagueBaselineRunKey(env, latest.league_run_key) || null,
    points_are_run_only: shouldNormalizeLeagueRunPoints(env, latest.league_run_key),
    league_name: listName,
    offset,
    source: "ps99-league-api-worker",
    projection: "Projected rank uses current league points plus best available one-hour-equivalent gain.",
    rows: publicRows.filter(row => !isLeaguePubliclyHidden(env, row.league_name))
  }, env);
}

async function handleSoloLeaderboard(request, env) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get("q") || url.searchParams.get("search") || "").trim();
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 500);
  const runKey = requestedRunKey(url, env);
  const api = await fetchLeaguePlayersApi();
  const livePlayers = leaguePlayersFromResponse(api)
    .map(normalizeSoloLeaguePlayer)
    .filter(row => row.user_id && row.league_name && !isLeaguePubliclyHidden(env, row.league_name))
    .sort((a, b) => b.points - a.points || a.user_id - b.user_id);

  livePlayers.forEach((row, index) => { row.rank = index + 1; });
  const rowsByUser = new Map(livePlayers.map(row => [String(row.user_id), row]));

  if (query) {
    const storedRows = await fetchStoredSoloSearchRows(env, runKey).catch(err => {
      console.warn("expanded solo leaderboard search unavailable", err?.message || String(err));
      return [];
    });
    for (const row of storedRows) {
      const id = String(row.user_id || "");
      if (!id || rowsByUser.has(id) || isLeaguePubliclyHidden(env, row.league_name)) continue;
      rowsByUser.set(id, {
        rank: null,
        user_id: toNumber(row.user_id),
        username: String(row.display_name || "").trim(),
        display_name: String(row.display_name || "").trim(),
        league_name: String(row.league_name || "").trim(),
        league_id: stringOrNull(row.league_id),
        league_icon: stringOrNull(row.league_icon),
        points: toNumber(row.points) || 0,
        total_points: toNumber(row.points) || 0,
        fetched_at: row.fetched_at || row.updated_at || null,
        source: "stored-tracked-league"
      });
    }
    const directUserId = await resolveRobloxUserIdForSearch(query).catch(() => null);
    if (directUserId && !rowsByUser.has(String(directUserId))) {
      const directApi = await fetchLeaguePlayerApi(directUserId).catch(() => null);
      const directRow = directApi ? normalizeSoloLeaguePlayer(leaguePlayerFromResponse(directApi)) : null;
      if (directRow?.user_id && directRow.league_name && !isLeaguePubliclyHidden(env, directRow.league_name)) {
        rowsByUser.set(String(directRow.user_id), { ...directRow, rank: null, source: "big-games-direct-player" });
      }
    }
  }

  const allRows = [...rowsByUser.values()];
  const usernameMap = await resolveRobloxUsernames(allRows.map(row => row.user_id), env).catch(() => new Map());
  const normalizedRows = allRows.map(row => {
    const resolved = String(usernameMap.get(toNumber(row.user_id)) || "").trim();
    const existing = String(row.username || row.display_name || "").trim();
    const username = resolved && !isFallbackUsername(resolved, row.user_id)
      ? resolved
      : (existing && !isFallbackUsername(existing, row.user_id) ? existing : `user_${row.user_id}`);
    return redactPublicMemberPoints(env, { ...row, username, display_name: username });
  });

  const needle = query.toLowerCase();
  const visibleRows = (query
    ? normalizedRows.filter(row => [row.username, row.display_name, row.user_id, row.league_name, row.league_id]
      .some(value => String(value || "").toLowerCase().includes(needle)))
    : normalizedRows.slice(0, limit))
    .sort((a, b) => {
      const aRank = toNumber(a.rank), bRank = toNumber(b.rank);
      if (aRank !== null && bRank !== null) return aRank - bRank;
      if (aRank !== null) return -1;
      if (bRank !== null) return 1;
      return (toNumber(b.points) || 0) - (toNumber(a.points) || 0) || String(a.username || "").localeCompare(String(b.username || ""));
    });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    league_run_key: runKey,
    league_run_label: leagueRunLabel(env, runKey),
    source: "big-games-public-league-players",
    query: query || null,
    top_limit: limit,
    top_available: livePlayers.length,
    search_scope: query ? "top-500-plus-direct-player-plus-stored-league-rosters" : "top-500",
    rows: visibleRows
  }, env);
}

async function handleLeaguePlayerLocation(request, env) {
  const url = new URL(request.url);
  const userId = toNumber(url.searchParams.get("user_id"));
  if (!userId) throw httpError(400, "A Roblox user_id is required.");
  const runKey = requestedRunKey(url, env);
  let rows = [];
  try {
    rows = await supabaseSelect(env, CURRENT_TABLE, {
      select: "fetched_at,updated_at,league_run_key,league_name,league_id,league_icon,user_id,display_name,points",
      league_run_key: `eq.${runKey}`,
      user_id: `eq.${userId}`,
      order: "updated_at.desc",
      limit: "25"
    });
  } catch (err) {
    console.warn("stored league player location unavailable", err?.message || String(err));
  }
  const stored = rows.find(row => !isAggregateLeagueListName(row.league_name) && !isLeaguePubliclyHidden(env, row.league_name));
  if (stored) {
    return cacheJson({ ok: true, found: true, user_id: userId, league_run_key: runKey, league_name: stored.league_name, league_id: stored.league_id || null, source: "stored-current-roster" }, env);
  }

  const directApi = await fetchLeaguePlayerApi(userId).catch(() => null);
  const live = directApi ? normalizeSoloLeaguePlayer(leaguePlayerFromResponse(directApi)) : null;
  return cacheJson(live?.user_id && live.league_name && !isLeaguePubliclyHidden(env, live.league_name)
    ? { ok: true, found: true, user_id: userId, league_run_key: runKey, league_name: live.league_name, league_id: live.league_id || null, source: "big-games-direct-player" }
    : { ok: true, found: false, user_id: userId, league_run_key: runKey, league_name: null, source: "not-in-stored-rosters-or-current-league-player-api" }, env);
}

async function fetchStoredSoloSearchRows(env, runKey) {
  requireSupabase(env);
  const rows = [];
  const excluded = [TOP_LEAGUES_NAME, ALL_TOP_LEAGUES_NAME, COLD_DISCOVERED_LEAGUES_NAME].map(postgrestFilterText).join(",");
  for (let offset = 0; offset < 10000; offset += 1000) {
    const page = await supabaseSelect(env, CURRENT_TABLE, {
      select: "fetched_at,updated_at,league_run_key,league_name,league_id,league_icon,user_id,display_name,points",
      league_run_key: `eq.${runKey}`,
      league_name: `not.in.(${excluded})`,
      order: "points.desc",
      limit: "1000",
      offset: String(offset)
    });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  const byUser = new Map();
  for (const row of rows) {
    const id = String(row.user_id || "");
    const existing = byUser.get(id);
    if (!existing || new Date(row.updated_at || row.fetched_at || 0) > new Date(existing.updated_at || existing.fetched_at || 0)) byUser.set(id, row);
  }
  return [...byUser.values()];
}

async function handleLeagueMilestones(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const runKey = requestedTopLeaguesRunKey(url, env);
  const requestedRanks = String(url.searchParams.get("ranks") || "")
    .split(",")
    .map(toNumber)
    .filter(rank => Number.isInteger(rank) && rank > 0 && rank <= MAX_TOP_LEAGUES_LIMIT);
  const ranks = [...new Set(requestedRanks.length ? requestedRanks : DEFAULT_LEAGUE_MILESTONE_RANKS)].sort((a, b) => a - b);
  const rankFilter = `in.(${ranks.join(",")})`;
  const select = "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league";
  const readList = listName => supabaseSelect(env, CURRENT_TABLE, {
    select,
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${listName}`,
    rank: rankFilter,
    order: "rank.asc",
    limit: String(ranks.length * 2)
  });

  const [allRows, topRows] = await Promise.all([
    readList(ALL_TOP_LEAGUES_NAME),
    ranks.some(rank => rank <= DEFAULT_TOP_LEAGUES_LIMIT) ? readList(TOP_LEAGUES_NAME) : Promise.resolve([])
  ]);
  const byRank = new Map();
  for (const row of [...allRows, ...topRows]) {
    const rank = toNumber(row.rank);
    if (!rank) continue;
    const existing = byRank.get(rank);
    if (!existing || new Date(row.fetched_at || 0) > new Date(existing.fetched_at || 0)) byRank.set(rank, row);
  }
  const snapshotAt = [...allRows, ...topRows]
    .map(row => row.fetched_at)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: snapshotAt,
    league_run_key: runKey,
    rows: ranks.map(rank => {
      const row = byRank.get(rank);
      const hidden = row && isLeaguePubliclyHidden(env, row.display_name);
      return {
        rank,
        available: Boolean(row && !hidden),
        points: row && !hidden ? (toNumber(row.points) || 0) : null
      };
    })
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
  const publicRows = await enrichDiscoveredLeaguesWithTopRows(env, runKey, rowsWithGains.map(publicDiscoveredLeagueRow)).catch(err => {
    console.warn("c0ld discovered top league enrichment failed", err?.message || String(err));
    return rowsWithGains.map(publicDiscoveredLeagueRow);
  });
  const visibleRows = filterPublicOverlapRows(env, publicRows);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: latest?.fetched_at || null,
    league_run_key: runKey,
    league_name: COLD_DISCOVERED_LEAGUES_NAME,
    rows: visibleRows
  }, env);
}

async function enrichDiscoveredLeaguesWithTopRows(env, runKey, rows) {
  if (!rows.length) return rows;
  const topRows = await fetchStoredTopLeagueRowsByNames(
    env,
    runKey,
    ALL_TOP_LEAGUES_NAME,
    rows.map(row => row.league_name),
    Math.max(rows.length * 3, 100)
  );
  const latest = latestMeta(topRows);
  const topRowsWithGains = latest ? await addGainFields(env, topRows, { ...latest, league_run_key: runKey, league_name: ALL_TOP_LEAGUES_NAME }) : topRows.map(addNullGains);
  const lookup = topLeagueLookup(topRowsWithGains);

  return rows.map(row => {
    const topRow = topLeagueLookupRow(lookup, { league_name: row.league_name, league_id: row.league_id });
    if (!topRow) return row;
    const top = publicLeagueRow(topRow);
    return {
      ...row,
      fetched_at: top.fetched_at || row.fetched_at,
      rank: top.rank ?? row.rank,
      previous_rank_5m: top.previous_rank_5m ?? row.previous_rank_5m,
      rank_move_5m: top.rank_move_5m ?? row.rank_move_5m,
      league_icon: row.league_icon || top.league_icon,
      total_points: top.total_points ?? row.total_points,
      points: top.points ?? row.points,
      gain_5m: top.gain_5m ?? row.gain_5m,
      gain_1h: top.gain_1h ?? row.gain_1h,
      gain_6h: top.gain_6h ?? row.gain_6h,
      gain_12h: top.gain_12h ?? row.gain_12h,
      gain_24h: top.gain_24h ?? row.gain_24h
    };
  });
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
      ? fetchTopLeagueRowsWindowForOverlap(env, runKey, offset, batchLimit, topLimit)
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

  const rawBatch = liveScan ? topContext.rows : topContext.rows.slice(offset, offset + batchLimit);
  const topListName = topContext.list_name || topLeagueListNameForLimit(topLimit, env);
  const batch = await normalizeTopLeagueRowsForRun(env, runKey, topListName, rawBatch, { recomputeRanks: false });
  const persistRows = liveScan ? (topContext.persist_rows || (topContext.source === "live-window" ? batch : [])) : [];
  if (persistRows.length) {
    await persistTopLeagueWindowRows(env, runKey, persistRows, {
      listName: topContext.list_name || topLeagueListNameForLimit(topLimit, env),
      fetchedAt: topContext.snapshot_at || new Date().toISOString(),
      source: "live:overlap-window"
    }).catch(err => console.warn("persist live overlap top league rows failed", err?.message || String(err)));
  }
  const scanned = await mapLimit(batch, concurrency, row => scanLeagueForClanMembers(env, runKey, row, clanMembers));
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
  const visibleMatchedRows = filterPublicOverlapRows(env, matchedRows);

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
    matched_count: visibleMatchedRows.length,
    discovered_upserted: discoveredUpserted,
    scan_errors: scanned.filter(row => row.error && !isLeaguePubliclyHidden(env, row.league_name)).map(row => ({ league_name: row.league_name, rank: row.rank, message: row.error })).slice(0, 25),
    rows: visibleMatchedRows
  }, env);
}

async function handleHistory(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const requested = String(url.searchParams.get("league") || leagueName(env)).trim() || leagueName(env);
  const runKey = requestedRunKey(url, env);
  if (isLeaguePubliclyHidden(env, requested)) {
    return cacheJson({ ok: true, generated_at: new Date().toISOString(), league_run_key: runKey, league_name: requested, hours: url.searchParams.get("hours") || 24, rows: [], public_visibility: "hidden" }, env);
  }
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
  let visibleRows;
  if (isAggregateLeagueListName(requested)) {
    visibleRows = rows.filter(row => !isLeaguePubliclyHidden(env, row.display_name));
  } else {
    const ids = [...new Set(rows.map(row => toNumber(row.user_id)).filter(Boolean))];
    const usernameMap = ids.length ? await resolveRobloxUsernames(ids, env).catch(() => new Map()) : new Map();
    visibleRows = rows.map(row => {
      const username = displayUsername(row, usernameMap);
      return redactPublicMemberPoints(env, { ...row, username, display_name: username }, username);
    });
  }
  return cacheJson({ ok: true, generated_at: new Date().toISOString(), league_run_key: runKey, league_name: requested, hours: hoursParam || 24, rows: visibleRows }, env);
}

async function handleProfile(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = toNumber(url.searchParams.get("user_id") || url.searchParams.get("id"));
  if (!userId) throw httpError(400, "Missing numeric user_id.");

  const rawRun = runKeyParam(url);
  const requestedLeague = String(url.searchParams.get("league") || "").trim();
  const limit = clamp(Number(url.searchParams.get("limit") || env.LEAGUE_PROFILE_ROW_LIMIT || 20000), 1, 50000);
  const summaryLimit = clamp(Number(url.searchParams.get("summary_limit") || env.LEAGUE_PROFILE_SUMMARY_LIMIT || 200), 1, 500);
  const params = {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time",
    user_id: `eq.${userId}`,
    order: "fetched_at.desc,snapshot_id.desc,rank.asc"
  };

  if (rawRun && String(rawRun).toLowerCase() !== "all") params.league_run_key = `eq.${normalizeRunKey(rawRun)}`;
  if (requestedLeague) params.league_name = `eq.${requestedLeague}`;

  const rows = await fetchLeagueProfileRows(env, params, limit);
  const usernameMap = await resolveRobloxUsernames([userId], env).catch(() => new Map());
  const resolvedUsername = usernameMap.get(userId) || null;
  const visibleRows = rows.filter(row => !isLeaguePubliclyHidden(env, row.league_name));
  const rawSummaries = await addLeaguePlacementFieldsToSummaries(env, summarizeLeagueProfileRows(visibleRows, env)
    .sort((a, b) => new Date(b.final_snapshot_at || 0) - new Date(a.final_snapshot_at || 0) || (a.final_rank || 999999) - (b.final_rank || 999999))
    .slice(0, summaryLimit));
  const summaries = rawSummaries.map(row => redactLeagueProfileSummary(env, row, resolvedUsername));
  const latest = summaries[0] || null;

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    user_id: userId,
    username: latest?.display_name || null,
    profile_url: `https://www.roblox.com/users/${userId}/profile`,
    rows_scanned: visibleRows.length,
    rows: summaries
  }, env);
}

async function fetchLeagueProfileRows(env, params, limit) {
  const rows = [];
  const pageSize = 1000;

  for (let offset = 0; offset < limit; offset += pageSize) {
    const requested = Math.min(pageSize, limit - offset);
    const page = await supabaseSelect(env, SNAPSHOT_TABLE, {
      ...params,
      limit: String(requested),
      offset: String(offset)
    });
    rows.push(...page);
    if (page.length < requested) break;
  }

  return rows;
}

function summarizeLeagueProfileRows(rows, env) {
  const groups = new Map();
  const gapMs = leagueProfilePeriodGapHours(env) * 60 * 60 * 1000;

  for (const row of rows || []) {
    const keyParts = [
      String(row.league_run_key || DEFAULT_LEAGUE_RUN_KEY).trim(),
      String(row.league_id || "").trim(),
      String(row.league_name || "").trim()
    ];
    const key = keyParts.join("\u0000");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const summaries = [];

  for (const groupRows of groups.values()) {
    const ordered = groupRows
      .slice()
      .filter(row => row?.fetched_at)
      .sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));
    let periodRows = [];

    for (const row of ordered) {
      const previous = periodRows[periodRows.length - 1];
      const previousMs = new Date(previous?.fetched_at || 0).getTime();
      const currentMs = new Date(row.fetched_at || 0).getTime();
      const startsNewPeriod =
        periodRows.length &&
        gapMs > 0 &&
        Number.isFinite(previousMs) &&
        Number.isFinite(currentMs) &&
        currentMs - previousMs > gapMs;

      if (startsNewPeriod) {
        const summary = summarizeLeagueProfileGroup(periodRows, env);
        if (summary) summaries.push(summary);
        periodRows = [];
      }

      periodRows.push(row);
    }

    const summary = summarizeLeagueProfileGroup(periodRows, env);
    if (summary) summaries.push(summary);
  }

  return summaries;
}

function summarizeLeagueProfileGroup(rows, env) {
  const ordered = rows
    .slice()
    .filter(row => row?.fetched_at)
    .sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));
  if (!ordered.length) return null;

  const first = ordered[0];
  const latest = ordered[ordered.length - 1];
  const ranks = ordered.map(row => toNumber(row.rank)).filter(Number.isFinite);
  const points = ordered.map(row => toNumber(row.points)).filter(Number.isFinite);

  const runKey = latest.league_run_key || first.league_run_key || DEFAULT_LEAGUE_RUN_KEY;
  const periodKey = leagueProfilePeriodKey(runKey, latest.league_name || first.league_name, first.fetched_at);
  const runLabel = leagueProfilePeriodLabel(env, periodKey, runKey, latest.fetched_at);

  return {
    league_run_key: runKey,
    league_period_key: periodKey,
    label_key: periodKey,
    run_label: runLabel,
    event_name: runLabel,
    league_name: latest.league_name || first.league_name || null,
    league_id: latest.league_id || first.league_id || null,
    league_level: toNumber(latest.league_level ?? first.league_level),
    league_points: toNumber(latest.league_points ?? first.league_points) || 0,
    league_icon: latest.league_icon || first.league_icon || null,
    member_capacity: toNumber(latest.member_capacity ?? first.member_capacity),
    user_id: toNumber(latest.user_id ?? first.user_id),
    display_name: latest.display_name || first.display_name || null,
    final_rank: toNumber(latest.rank),
    best_rank: ranks.length ? Math.min(...ranks) : null,
    final_points: toNumber(latest.points) || 0,
    highest_points: points.length ? Math.max(...points) : 0,
    first_snapshot_at: first.fetched_at || null,
    final_snapshot_at: latest.fetched_at || null,
    period_start_at: first.fetched_at || null,
    period_end_at: latest.fetched_at || null,
    period_gap_hours: leagueProfilePeriodGapHours(env),
    snapshot_count: ordered.length,
    last_contribution_at: latest.last_contribution_at || null,
    permission_level: latest.permission_level ?? null,
    role: latest.role || null,
    join_time: latest.join_time || null,
    source: latest.source || first.source || null
  };
}

async function addLeaguePlacementFieldsToSummaries(env, summaries) {
  if (!summaries?.length) return [];

  return Promise.all(summaries.map(async summary => {
    const historicalLeaguePlacement = await fetchStoredLeagueRankForProfileSummary(env, summary).catch(() => null);
    const currentLeaguePlacement = historicalLeaguePlacement === null && isRecentProfilePeriod(env, summary.final_snapshot_at)
      ? await fetchStoredLeagueRank(
        env,
        summary.league_run_key,
        summary.league_name,
        summary.league_id
      ).catch(() => null)
      : null;
    const leaguePlacement = historicalLeaguePlacement ?? currentLeaguePlacement;
    const playerLeagueRank = toNumber(summary.final_rank);

    return {
      ...summary,
      rank: leaguePlacement,
      league_rank: leaguePlacement,
      final_league_rank: leaguePlacement,
      player_league_rank: playerLeagueRank,
      member_rank: playerLeagueRank
    };
  }));
}

async function fetchStoredLeagueRankForProfileSummary(env, summary) {
  const runKey = normalizeRunKey(summary?.league_run_key || DEFAULT_LEAGUE_RUN_KEY);
  const leagueNameValue = String(summary?.league_name || "").trim();
  const leagueId = String(summary?.league_id || "").trim();
  const finalAt = summary?.final_snapshot_at || summary?.period_end_at || null;
  if (!leagueNameValue && !leagueId) return null;

  const finalMs = new Date(finalAt || 0).getTime();
  if (!Number.isFinite(finalMs)) return null;

  const labels = [TOP_LEAGUES_NAME, ALL_TOP_LEAGUES_NAME];
  const lookup = async (timeFilters, order, options = {}) => {
    for (const label of labels) {
      if (leagueId) {
        const byId = await supabaseSelect(env, SNAPSHOT_TABLE, {
          select: "rank,fetched_at,display_name,league_id",
          league_run_key: `eq.${runKey}`,
          league_name: `eq.${label}`,
          league_id: `eq.${leagueId}`,
          ...timeFilters,
          order,
          limit: "1"
        }, options);
        const rank = toNumber(byId[0]?.rank);
        if (rank !== null) return rank;
      }

      if (leagueNameValue) {
        const byName = await supabaseSelect(env, SNAPSHOT_TABLE, {
          select: "rank,fetched_at,display_name,league_id",
          league_run_key: `eq.${runKey}`,
          league_name: `eq.${label}`,
          display_name: `eq.${leagueNameValue}`,
          ...timeFilters,
          order,
          limit: "1"
        }, options);
        const rank = toNumber(byName[0]?.rank);
        if (rank !== null) return rank;
      }
    }

    return null;
  };

  const beforeRank = await lookup(
    { fetched_at: `lte.${new Date(finalMs).toISOString()}` },
    "fetched_at.desc,rank.asc"
  );
  if (beforeRank !== null) return beforeRank;

  const afterCutoff = new Date(finalMs + leagueProfilePeriodGapHours(env) * 60 * 60 * 1000).toISOString();
  return lookup(
    {
      fetched_at: `gte.${new Date(finalMs).toISOString()}`,
      fetched_at_lte: `lte.${afterCutoff}`
    },
    "fetched_at.asc,rank.asc",
    { paramRename: { fetched_at_lte: "fetched_at" } }
  );
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
  const rows = await fetchStoredTopLeagueRows(env, runKey, listName, limit);

  let latest = latestMeta(rows);

  const rowsWithGains = latest ? await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: listName }) : rows.map(addNullGains);
  return { snapshot_at: latest?.fetched_at || null, source: listName, rows: rowsWithGains };
}

async function fetchStoredTopLeagueRows(env, runKey, listName, limit, offset = 0) {
  const select = "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league";
  const rows = [];
  let fetched = 0;
  const pageSize = 1000;
  const rawLimit = Math.min(MAX_TOP_LEAGUES_LIMIT - offset, limit + Math.min(500, limit));

  while (fetched < rawLimit) {
    const take = Math.min(pageSize, rawLimit - fetched);
    const page = await supabaseSelect(env, CURRENT_TABLE, {
      select,
      league_run_key: `eq.${runKey}`,
      league_name: `eq.${listName}`,
      order: "rank.asc",
      limit: String(take),
      offset: String(offset + fetched)
    });
    rows.push(...page);
    if (page.length < take) break;
    fetched += page.length;
  }

  return dedupeStoredTopLeagueRows(rows)
    .sort((a, b) => (toNumber(a.rank) || 999999) - (toNumber(b.rank) || 999999))
    .slice(0, limit);
}

async function fetchTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit) {
  const stored = await fetchStoredTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit).catch(err => {
    console.warn("stored top league overlap window lookup failed", err?.message || String(err));
    return null;
  });
  const expected = Math.max(0, Math.min(limit, topLimit - offset));
  if (stored?.rows?.length >= expected && isFreshStoredTopLeagueWindow(stored.snapshot_at, env)) return stored;
  return fetchLiveTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit);
}

async function fetchStoredTopLeagueRowsWindowForOverlap(env, runKey, offset, limit, topLimit) {
  const listName = topLeagueListNameForLimit(topLimit, env);
  const startRank = offset + 1;
  const endRank = Math.min(topLimit, offset + limit);
  if (startRank > endRank) {
    return { source: "stored-window", list_name: listName, snapshot_at: null, total_available: offset, rows: [] };
  }

  const rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,source,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,raw_league",
    league_run_key: `eq.${runKey}`,
    league_name: `eq.${listName}`,
    rank_gte: `gte.${startRank}`,
    rank_lte: `lte.${endRank}`,
    order: "rank.asc",
    limit: String(limit)
  }, { paramRename: { rank_gte: "rank", rank_lte: "rank" } });

  const latest = latestMeta(rows);
  const rowsWithGains = latest ? await addGainFields(env, rows, { ...latest, league_run_key: runKey, league_name: listName }) : rows.map(addNullGains);
  return {
    source: "stored-window",
    list_name: listName,
    snapshot_at: latest?.fetched_at || null,
    total_available: offset + rowsWithGains.length,
    rows: rowsWithGains.sort((a, b) => (a.rank || 999999) - (b.rank || 999999))
  };
}

function isFreshStoredTopLeagueWindow(snapshotAt, env) {
  const maxSeconds = clamp(Number(env.COLD_LEAGUES_STORED_WINDOW_MAX_AGE_SECONDS || 600), 0, 60 * 60);
  if (maxSeconds <= 0) return true;
  const fetchedMs = new Date(snapshotAt || 0).getTime();
  return Number.isFinite(fetchedMs) && Date.now() - fetchedMs <= maxSeconds * 1000;
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
  const persistRows = [];

  for (let page = startPage; page <= endPage; page += 1) {
    const api = await fetchLeagueListApi(page, pageSize);
    const pageRows = leagueListFromResponse(api);
    if (!pageRows.length) break;

    pageRows.forEach((item, index) => {
      const globalIndex = (page - 1) * pageSize + index;
      if (globalIndex >= topLimit) return;

      const summary = summarizeLeague(item, lname(item) || `League ${globalIndex + 1}`);
      if (!summary.league_name) return;

      const explicitRank = toNumber(firstDefined(item.Rank, item.rank, item.Place, item.place, item.Position, item.position));
      const rank = explicitRank && explicitRank > 0 ? explicitRank : globalIndex + 1;
      const stable = summary.league_id || summary.league_name;

      const dbRow = addNullGains({
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
      });
      persistRows.push(dbRow);
      if (globalIndex >= start && globalIndex < end) rows.push(dbRow);
    });

    if (pageRows.length < pageSize) break;
  }

  return {
    source: "live-window",
    list_name: listName,
    snapshot_at: now,
    total_available: rows.length < limit ? start + rows.length : topLimit,
    rows: rows.sort((a, b) => (a.rank || 999999) - (b.rank || 999999)),
    persist_rows: persistRows.sort((a, b) => (a.rank || 999999) - (b.rank || 999999))
  };
}

async function scanLeagueForClanMembers(env, runKey, topRow, clanMembers) {
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

  let leagueSummary = summarizeLeague(leaguePayload, publicRow.league_name);
  let leagueMembers = normalizeLeagueRows(leaguePayload);
  ({ summary: leagueSummary, memberRows: leagueMembers } = await normalizeTrackedLeagueForRun(env, runKey, leagueSummary, leagueMembers));
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
    total_points: leagueSummary.league_points,
    points: leagueSummary.league_points,
    c0ld_member_count: matches.length,
    c0ld_league_points: matches.reduce((sum, member) => sum + (toNumber(member.league_points) || 0), 0),
    roster_source: rosterSource,
    scanned_member_count: leagueMembers.length,
    matches,
    error
  };
}

async function fetchLeagueApi(league, options = {}) {
  const primary = `https://ps99.biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`;
  const urls = options.allowFallback === false ? [primary] : [primary, `https://biggamesapi.io/v1/leagues/${encodeURIComponent(league)}`];
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

async function fetchLeagueListApi(page = 1, pageSize = 100, options = {}) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(Math.min(pageSize, 100)), sort: "Points", sortOrder: "desc" });
  const primary = `https://ps99.biggamesapi.io/v1/leagues?${qs.toString()}`;
  const urls = options.allowFallback === false ? [primary] : [primary, `https://biggamesapi.io/v1/leagues?${qs.toString()}`];
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

async function fetchLeaguePlayersApi(options = {}) {
  const primary = "https://ps99.biggamesapi.io/v1/leagues/players";
  const urls = options.allowFallback === false ? [primary] : [primary, "https://biggamesapi.io/v1/leagues/players"];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 30, cacheEverything: true } });
      const data = await readJsonResponse(res, url);
      if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`);
      return data;
    } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games league players API failed: ${lastError?.message || "unknown error"}`);
}

async function fetchLeaguePlayerApi(userId, options = {}) {
  const id = toNumber(userId);
  if (!id) throw httpError(400, "A Roblox user_id is required.");
  const primary = `https://ps99.biggamesapi.io/v1/leagues/players/${id}`;
  const urls = options.allowFallback === false ? [primary] : [primary, `https://biggamesapi.io/v1/leagues/players/${id}`];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "yamo-league-api-worker" }, cf: { cacheTtl: 30, cacheEverything: true } });
      const data = await readJsonResponse(res, url);
      if (data.status && data.status !== "ok") throw new Error(`API status ${data.status}`);
      return data;
    } catch (err) { lastError = err; }
  }
  throw httpError(502, `Big Games league player API failed for ${id}: ${lastError?.message || "unknown error"}`);
}

function leaguePlayersFromResponse(api) {
  const root = api?.data || api || {};
  return firstArray(root.players, root.Players, root.rows, root.Rows);
}

function leaguePlayerFromResponse(api) {
  const root = api?.data || api || {};
  return root.player || root.Player || root;
}

function normalizeSoloLeaguePlayer(item, index = 0) {
  const league = item?.League || item?.league || {};
  const userId = getUserId(item);
  const existingName = getDisplayName(item, userId);
  return {
    rank: index + 1,
    user_id: userId,
    username: existingName,
    display_name: existingName,
    league_name: String(firstDefined(league.Name, league.name, item?.LeagueName, item?.leagueName) || "").trim(),
    league_id: stringOrNull(firstDefined(league.ID, league.Id, league.id, item?.LeagueID, item?.leagueId)),
    league_icon: stringOrNull(firstDefined(league.Icon, league.icon)),
    points: toNumber(firstDefined(item?.Points, item?.points, item?.TotalPoints, item?.totalPoints)) || 0,
    total_points: toNumber(firstDefined(item?.Points, item?.points, item?.TotalPoints, item?.totalPoints)) || 0,
    fetched_at: parseTimestamp(firstDefined(item?.Timestamp, item?.timestamp)) || new Date().toISOString(),
    source: "live-top-500"
  };
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
        select: "rank,points,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        league_id: `eq.${id}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const rank = (toNumber(byId[0]?.points) || 0) > 0 ? visibleLeagueRank(byId[0]?.rank) : null;
      if (rank !== null) return rank;
    }

    if (name) {
      const byName = await supabaseSelect(env, CURRENT_TABLE, {
        select: "rank,points,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        display_name: `eq.${name}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const exactRank = (toNumber(byName[0]?.points) || 0) > 0 ? visibleLeagueRank(byName[0]?.rank) : null;
      if (exactRank !== null) return exactRank;

      const byLooseName = await supabaseSelect(env, CURRENT_TABLE, {
        select: "rank,points,fetched_at,display_name,league_id",
        league_run_key: `eq.${runKey}`,
        league_name: `eq.${label}`,
        display_name: `ilike.${name}`,
        order: "fetched_at.desc",
        limit: "1"
      });
      const looseRank = (toNumber(byLooseName[0]?.points) || 0) > 0 ? visibleLeagueRank(byLooseName[0]?.rank) : null;
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
    const rowTime = new Date(row.fetched_at || 0).getTime();
    const existingTime = new Date(existing?.fetched_at || 0).getTime();
    const isNewer = Number.isFinite(rowTime) && (!Number.isFinite(existingTime) || rowTime > existingTime);
    const isSameTimeBetterRank = rowTime === existingTime && (toNumber(row.rank) || 999999) < (toNumber(existing.rank) || 999999);
    if (!existing || isNewer || isSameTimeBetterRank) out.set(id, row);
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
  const allowFallback = options.allowApiFallback !== false;
  const pages = Math.ceil(capped / pageSize);
  const seen = new Set();
  const leagues = [];

  for (let page = 1; page <= pages; page += 1) {
    if (page > 1 && pageDelayMs > 0) await sleep(pageDelayMs);
    const api = await fetchLeagueListApi(page, pageSize, { allowFallback });
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

async function resolveRobloxUserIdForSearch(value) {
  const query = String(value || "").trim();
  if (!query) return null;
  if (/^\d+$/.test(query)) return toNumber(query);
  if (!/^[A-Za-z0-9_]{3,20}$/.test(query)) return null;
  const response = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "yamo-league-api-worker" },
    body: JSON.stringify({ usernames: [query], excludeBannedUsers: false })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const exact = firstArray(data?.data).find(user => String(user?.requestedUsername || user?.name || "").toLowerCase() === query.toLowerCase());
  return toNumber(exact?.id);
}

async function resolveRobloxUsernames(userIds, env) {
  const shouldLookup = String(env.ROBLOX_USERNAME_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];
  for (const id of ids) result.set(id, `user_${id}`);
  if (!shouldLookup || !ids.length) return result;
  const cacheHours = clamp(Number(env.ROBLOX_USERNAME_CACHE_HOURS || 168), 1, 24 * 365);
  const staleBefore = Date.now() - cacheHours * 3600000;
  const freshCachedIds = new Set();
  try {
    for (const batch of chunk(ids, 250)) {
      const cached = await supabaseSelect(env, USER_LOOKUP_CACHE_TABLE, { select: "user_id,username,updated_at", user_id: `in.(${batch.join(",")})`, limit: String(batch.length) });
      for (const row of cached) {
        const id = toNumber(row.user_id), username = String(row.username || "").trim();
        if (!id || isFallbackUsername(username, id)) continue;
        result.set(id, username);
        if (new Date(row.updated_at || 0).getTime() >= staleBefore) freshCachedIds.add(id);
      }
    }
  } catch {}

  const lookupBatch = async batch => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const res = await fetch("https://users.roblox.com/v1/users", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "yamo-league-api-worker" }, body: JSON.stringify({ userIds: batch, excludeBannedUsers: false }) });
        if (!res.ok) {
          if (attempt < 3 && (res.status === 429 || res.status >= 500)) { const retryAfter = Number(res.headers.get("retry-after") || 0); await sleep(Math.max(retryAfter * 1000, 250 * attempt)); continue; }
          return;
        }
        const data = await res.json(), cacheRows = [];
        for (const user of data.data || []) {
          const id = toNumber(user.id);
          if (!id || !user.name) continue;
          const username = String(user.name);
          result.set(id, username);
          cacheRows.push({ user_id: id, username, display_name: user.displayName || null, updated_at: new Date().toISOString() });
        }
        if (cacheRows.length) await supabaseUpsert(env, USER_LOOKUP_CACHE_TABLE, cacheRows, "user_id").catch(() => {});
        return;
      } catch {
        if (attempt < 3) await sleep(250 * attempt);
      }
    }
  };
  const needsLookup = ids.filter(id => !freshCachedIds.has(id));
  for (const batch of chunk(needsLookup, ROBLOX_BATCH_SIZE)) await lookupBatch(batch);
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
  return { fetched_at: row.fetched_at, league_run_key: row.league_run_key, rank: toNumber(row.rank), previous_rank_5m: row.previous_rank_5m, rank_move_5m: row.rank_move_5m, user_id: id, username: name, display_name: name, avatar_url: avatarMap.get(id) || avatarMap.get(String(id)) || null, total_points: toNumber(row.points) || 0, points: toNumber(row.points) || 0, last_contribution_at: row.last_contribution_at || null, permission_level: row.permission_level ?? null, role: row.role || "Member", join_time: row.join_time || null, gain_5m: row.gain_5m, gain_1h: row.gain_1h, gain_6h: row.gain_6h, gain_12h: row.gain_12h, gain_24h: row.gain_24h };
}

function visibleLeagueRank(value) {
  const rank = toNumber(value);
  return rank !== null && rank > 0 && rank <= MAX_TOP_LEAGUES_LIMIT ? rank : null;
}

function publicLeagueRow(row) {
  const raw = row.raw_league || {};
  const name = String(firstDefined(raw.Name, raw.name, raw.LeagueName, raw.leagueName, row.display_name) || "").trim();
  const points = toNumber(row.points) || 0;
  const rank = points > 0 ? visibleLeagueRank(row.rank) : null;
  const previousRank = points > 0 ? visibleLeagueRank(row.previous_rank_5m) : null;
  return { fetched_at: row.fetched_at, league_run_key: row.league_run_key, rank, previous_rank_5m: previousRank, rank_move_5m: rank && previousRank ? previousRank - rank : null, synthetic_id: toNumber(row.user_id), league_name: name, display_name: name, league_id: stringOrNull(firstDefined(raw.ID, raw.Id, raw.id, row.league_id)), league_icon: stringOrNull(firstDefined(raw.Icon, raw.icon, row.league_icon)), total_points: points, points, gain_5m: row.gain_5m, gain_1h: row.gain_1h, gain_6h: row.gain_6h, gain_12h: row.gain_12h, gain_24h: row.gain_24h };
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
  const rankMap5m = await fetchClosestRankMap(env, latest.league_run_key, latest.league_name, latestMs, 5, 4, 20);
  return rows.map(row => {
    const out = { ...row };
    const currentPoints = toNumber(row.points) || 0;
    for (const win of windows) {
      const previous = maps[win.key].get(String(row.user_id));
      out[win.key] = previous === undefined ? null : currentPoints - previous;
    }
    const currentRank = toNumber(row.rank);
    const previousRank = rankMap5m.get(String(row.user_id));
    out.previous_rank_5m = previousRank === undefined ? null : previousRank;
    out.rank_move_5m = previousRank === undefined || currentRank === null ? null : previousRank - currentRank;
    return out;
  });
}

function addNullGains(row) { return { ...row, gain_5m: null, gain_1h: null, gain_6h: null, gain_12h: null, gain_24h: null, previous_rank_5m: null, rank_move_5m: null }; }

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

async function fetchClosestRankMap(env, runKey, league, latestMs, minutes, toleranceMinutes, fallbackMinutes = 0) {
  const targetMs = latestMs - minutes * 60 * 1000;
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, { select: "snapshot_id,fetched_at,user_id,rank", league_run_key: `eq.${runKey}`, league_name: `eq.${league}`, fetched_at: `gte.${new Date(targetMs - toleranceMinutes * 60 * 1000).toISOString()}`, fetched_at_lte: `lte.${new Date(targetMs + toleranceMinutes * 60 * 1000).toISOString()}`, order: "fetched_at.desc,rank.asc", limit: "5000" }, { paramRename: { fetched_at_lte: "fetched_at" } });
  if (rows.length) return closestSnapshotRankMap(rows, targetMs);
  if (!fallbackMinutes) return new Map();
  const fallbackRows = await supabaseSelect(env, SNAPSHOT_TABLE, { select: "snapshot_id,fetched_at,user_id,rank", league_run_key: `eq.${runKey}`, league_name: `eq.${league}`, fetched_at: `gte.${new Date(targetMs - fallbackMinutes * 60 * 1000).toISOString()}`, fetched_at_lte: `lte.${new Date(targetMs).toISOString()}`, order: "fetched_at.desc,rank.asc", limit: "5000" }, { paramRename: { fetched_at_lte: "fetched_at" } });
  return fallbackRows.length ? closestSnapshotRankMap(fallbackRows, targetMs) : new Map();
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

function closestSnapshotRankMap(rows, targetMs) {
  const snapshots = new Map();
  for (const row of rows) {
    const id = String(row.snapshot_id || "");
    if (!id) continue;
    if (!snapshots.has(id)) snapshots.set(id, { distance: Math.abs(new Date(row.fetched_at).getTime() - targetMs), ranks: new Map() });
    const rank = toNumber(row.rank);
    if (rank !== null) snapshots.get(id).ranks.set(String(row.user_id), rank);
  }
  return (Array.from(snapshots.values()).sort((a, b) => a.distance - b.distance)[0]?.ranks) || new Map();
}

function latestMeta(rows) {
  if (!rows.length) return null;
  const row = rows.slice().sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0];
  return { snapshot_id: row.snapshot_id, fetched_at: row.fetched_at, league_run_key: row.league_run_key, league_name: row.league_name, league_id: row.league_id, league_level: row.league_level, league_points: row.league_points, league_icon: row.league_icon, member_capacity: row.member_capacity };
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
async function deleteStaleCurrentLeagueRows(env, runKey, names, fetchedAt) {
  const uniqueNames = [...new Set((names || []).map(name => String(name || "").trim()).filter(Boolean))];
  if (!uniqueNames.length) return [];
  return supabaseDelete(env, CURRENT_TABLE, {
    league_run_key: `eq.${runKey}`,
    league_name: `in.(${uniqueNames.map(postgrestFilterText).join(",")})`,
    updated_at: `lt.${fetchedAt}`
  });
}
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

async function handleLeagueRunReset(env, requestedRunKey) {
  requireSupabase(env);
  const runKey = normalizeRunKey(requestedRunKey || leagueRunKey(env));
  const baselineRunKey = leagueBaselineRunKey(env, runKey);
  if (!runKey || runKey === baselineRunKey || runKey.toLowerCase() === "active") {
    throw httpError(400, "Refusing to reset the baseline or legacy active league run.");
  }

  await supabaseDelete(env, CURRENT_TABLE, { league_run_key: `eq.${runKey}` });
  await supabaseDelete(env, SNAPSHOT_TABLE, { league_run_key: `eq.${runKey}` });
  await supabaseDelete(env, INACTIVITY_ALERT_TABLE, { league_run_key: `eq.${runKey}` }).catch(err => {
    console.warn("league inactivity reset skipped", err?.message || String(err));
  });

  return json({
    ok: true,
    league_run_key: runKey,
    league_run_label: leagueRunLabel(env, runKey),
    baseline_run_key: baselineRunKey || null,
    message: "League run rows cleared. The next ingest will store run-only points."
  }, 200);
}

function leagueBaselineRunKey(env, runKey) {
  const current = normalizeRunKey(runKey || leagueRunKey(env));
  const configured = String(env.LEAGUE_BASELINE_RUN_KEY || env.LEAGUE_PREVIOUS_RUN_KEY || DEFAULT_LEAGUE_BASELINE_RUN_KEY).trim();
  if (!configured) return "";
  const baseline = normalizeRunKey(configured);
  return baseline === current ? "" : baseline;
}

function shouldNormalizeLeagueRunPoints(env, runKey) {
  const enabled = !FALSEY_ENV_VALUES.has(String(env.LEAGUE_NORMALIZE_POINTS_FROM_BASELINE || "true").trim().toLowerCase());
  return enabled && Boolean(leagueBaselineRunKey(env, runKey));
}

function runOnlyPointState(currentValue, baselineValue, resetPreviouslyDetected = false) {
  const current = Math.max(0, toNumber(currentValue) || 0);
  const baseline = toNumber(baselineValue);
  if (baseline === null || baseline < 0) return { points: current, resetDetected: Boolean(resetPreviouslyDetected) };
  const resetDetected = Boolean(resetPreviouslyDetected) || current < baseline;
  return { points: resetDetected ? current : Math.max(0, current - baseline), resetDetected };
}

function withRunOnlyPointFields(value, points, runKey, resetDetected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value || {};
  const out = { ...value };
  for (const field of ["Points", "points", "TotalPoints", "totalPoints", "total_points", "Score", "score", "Value", "value"]) {
    if (Object.prototype.hasOwnProperty.call(out, field)) out[field] = points;
  }
  out._run_points_normalized = true;
  out._run_key = runKey;
  out._run_baseline_reset_detected = Boolean(resetDetected);
  return out;
}

function runPointMetadata(value, runKey) {
  const raw = normalizeRawLeague(value);
  return {
    normalized: raw._run_points_normalized === true && String(raw._run_key || "") === String(runKey || ""),
    resetDetected: raw._run_baseline_reset_detected === true
  };
}

async function normalizeTrackedLeagueForRun(env, runKey, summary, memberRows) {
  if (!shouldNormalizeLeagueRunPoints(env, runKey)) return { summary, memberRows };
  const baselineRunKey = leagueBaselineRunKey(env, runKey);
  const select = "fetched_at,league_run_key,league_name,league_points,user_id,points";
  let baselineRows = await supabaseSelect(env, CURRENT_TABLE, {
    select,
    league_run_key: `eq.${baselineRunKey}`,
    league_name: `eq.${summary.league_name}`,
    order: "rank.asc",
    limit: "500"
  });
  if (!baselineRows.length) {
    baselineRows = await supabaseSelect(env, CURRENT_TABLE, {
      select,
      league_run_key: `eq.${baselineRunKey}`,
      league_name: `ilike.${summary.league_name}`,
      order: "rank.asc",
      limit: "500"
    });
  }
  if (!baselineRows.length) return { summary, memberRows };

  const currentRunRows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "fetched_at,league_run_key,league_name,user_id,raw_contribution,raw_league",
    league_run_key: `eq.${runKey}`,
    league_name: `ilike.${summary.league_name}`,
    order: "rank.asc",
    limit: "500"
  }).catch(() => []);

  const baselineByUser = new Map(baselineRows.map(row => [String(row.user_id), toNumber(row.points) || 0]));
  const currentMetadataByUser = new Map(currentRunRows.map(row => [String(row.user_id), runPointMetadata(row.raw_contribution, runKey)]));
  const baselineLeaguePoints = toNumber(latestMeta(baselineRows)?.league_points);
  const priorLeagueMetadata = runPointMetadata(latestMeta(currentRunRows)?.raw_league || currentRunRows[0]?.raw_league, runKey);
  const leagueState = runOnlyPointState(summary.league_points, baselineLeaguePoints, priorLeagueMetadata.resetDetected);
  const normalizedSummary = {
    ...summary,
    league_points: leagueState.points,
    raw_league: withRunOnlyPointFields(summary.raw_league, leagueState.points, runKey, leagueState.resetDetected)
  };
  const normalizedRows = memberRows.map(row => {
    const priorMetadata = currentMetadataByUser.get(String(row.user_id));
    const state = runOnlyPointState(row.points, baselineByUser.get(String(row.user_id)), priorMetadata?.resetDetected);
    return {
      ...row,
      points: state.points,
      raw_member: withRunOnlyPointFields(row.raw_member, state.points, runKey, state.resetDetected),
      raw_contribution: withRunOnlyPointFields(row.raw_contribution, state.points, runKey, state.resetDetected)
    };
  });
  normalizedRows.sort((a, b) => (b.points - a.points) || String(a.display_name || "").localeCompare(String(b.display_name || "")));
  normalizedRows.forEach((row, index) => { row.rank = index + 1; });
  return { summary: normalizedSummary, memberRows: normalizedRows };
}

async function normalizeTopLeagueRowsForRun(env, runKey, listName, rows, options = {}) {
  if (!rows?.length || !shouldNormalizeLeagueRunPoints(env, runKey)) return rows || [];
  if (rows.every(row => runPointMetadata(row.raw_league, runKey).normalized)) return rows;
  const baselineRunKey = leagueBaselineRunKey(env, runKey);
  const names = rows.map(row => row.league_name).filter(Boolean);
  const fetchComparableRows = targetRunKey => rows.length > 250
    ? fetchStoredTopLeagueRows(env, targetRunKey, listName, Math.min(MAX_TOP_LEAGUES_LIMIT, Math.max(rows.length, 1000)))
    : fetchStoredTopLeagueRowsByNames(env, targetRunKey, listName, names, Math.max(rows.length * 2, 100));
  const [baselineRows, currentRunRows] = await Promise.all([
    fetchComparableRows(baselineRunKey),
    fetchComparableRows(runKey).catch(() => [])
  ]);
  const baselineByIdentity = new Map();
  for (const row of baselineRows) {
    for (const identity of [row.league_id, row.user_id, row.display_name]) {
      const normalized = key(identity);
      if (normalized) baselineByIdentity.set(normalized, toNumber(row.points) || 0);
    }
  }
  const currentMetadataByIdentity = new Map();
  for (const row of currentRunRows) {
    const metadata = runPointMetadata(row.raw_league, runKey);
    for (const identity of [row.league_id, row.user_id, row.display_name]) {
      const normalized = key(identity);
      if (normalized) currentMetadataByIdentity.set(normalized, metadata);
    }
  }

  const normalizedRows = rows.map(row => {
    const identities = [row.league_id, row.user_id, row.league_name].map(key).filter(Boolean);
    const baseline = identities.map(identity => baselineByIdentity.get(identity)).find(value => value !== undefined);
    const priorMetadata = identities.map(identity => currentMetadataByIdentity.get(identity)).find(Boolean);
    const state = runOnlyPointState(row.points, baseline, priorMetadata?.resetDetected);
    return { ...row, points: state.points, raw_league: withRunOnlyPointFields(row.raw_league, state.points, runKey, state.resetDetected) };
  });

  if (options.recomputeRanks !== false) {
    normalizedRows.sort((a, b) => (b.points - a.points) || String(a.league_name || "").localeCompare(String(b.league_name || "")));
    let rankedCount = 0;
    let unrankedCount = 0;
    for (const row of normalizedRows) {
      if (row.points > 0) row.rank = ++rankedCount;
      else row.rank = MAX_TOP_LEAGUES_LIMIT + (++unrankedCount);
    }
  }
  return normalizedRows;
}

function stableLeagueUserId(value) { let h = 2166136261; const text = String(value || "unknown"); for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 9000000000000 + h; }
function requireSupabase(env) { if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_KEY are required"); }
function requireAdmin(request, env) { const expected = String(env.INGEST_ADMIN_TOKEN || "").trim(); if (!expected) throw httpError(500, "INGEST_ADMIN_TOKEN is not configured"); const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim(); if (token !== expected) throw httpError(401, "Unauthorized"); }
function leagueCollectionEnabled(env) { return String(env.LEAGUE_COLLECTION_ENABLED || "false").trim().toLowerCase() === "true"; }
function requireLeagueCollectionEnabled(env) { if (!leagueCollectionEnabled(env)) throw httpError(409, "League collection is disabled. Set LEAGUE_COLLECTION_ENABLED=true to activate it."); }
function leagueName(env) { return String(env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME).trim() || DEFAULT_LEAGUE_NAME; }
function csvLeagueNames(value) { return String(value || "").split(",").map(item => item.trim()).filter(Boolean); }
function c0ldLeagueNames(env) { return [...new Set(csvLeagueNames(env.COLD_LEAGUE_NAMES))]; }
function altLeagueNames(env) { return [...new Set(csvLeagueNames(env.ALT_LEAGUE_NAMES))]; }
function leagueNames(env) {
  const legacy = csvLeagueNames(env.LEAGUE_NAMES || env.LEAGUE_NAME || DEFAULT_LEAGUE_NAME);
  const names = [...legacy, ...c0ldLeagueNames(env), ...altLeagueNames(env)];
  return names.length ? [...new Set(names)] : [DEFAULT_LEAGUE_NAME];
}
function normalizeRunKey(value) { return String(value || DEFAULT_LEAGUE_RUN_KEY).trim() || DEFAULT_LEAGUE_RUN_KEY; }
function leagueRunKey(env) {
  const configured = normalizeRunKey(env.LEAGUE_RUN_KEY || env.LEAGUE_SEASON_KEY || DEFAULT_LEAGUE_RUN_KEY);
  return configured.toLowerCase() === "active" ? DEFAULT_LEAGUE_RUN_KEY : configured;
}
function leagueProfilePeriodGapHours(env) { return clamp(Number(env.LEAGUE_PROFILE_PERIOD_GAP_HOURS || 36), 1, 24 * 30); }
function leagueProfilePeriodKey(runKey, leagueNameValue, firstSnapshotAt) {
  const date = new Date(firstSnapshotAt || 0);
  const dateKey = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 10);
  const leagueKey = key(leagueNameValue) || "league";
  return `${normalizeRunKey(runKey)}:${leagueKey}:${dateKey}`;
}
function isRecentProfilePeriod(env, finalSnapshotAt) {
  const finalMs = new Date(finalSnapshotAt || 0).getTime();
  if (!Number.isFinite(finalMs)) return false;
  return Date.now() - finalMs <= leagueProfilePeriodGapHours(env) * 60 * 60 * 1000;
}
function leagueProfilePeriodLabel(env, periodKey, runKey, finalSnapshotAt) {
  const key = normalizeRunKey(runKey || leagueRunKey(env));
  const labels = parseJsonObject(env.LEAGUE_RUN_LABELS_JSON || env.LEAGUE_EVENT_LABELS_JSON);
  const period = String(periodKey || "").trim();

  for (const candidate of leagueProfilePeriodLabelCandidates(period, key)) {
    const mapped = String(labels[candidate] || labels[candidate.toLowerCase()] || "").trim();
    if (mapped) return mapped;
  }

  const runMapped = String(labels[key] || labels[key.toLowerCase()] || labels.default || "").trim();
  if (runMapped && (key !== DEFAULT_LEAGUE_RUN_KEY || isRecentProfilePeriod(env, finalSnapshotAt))) return runMapped;

  if (key === leagueRunKey(env) && isRecentProfilePeriod(env, finalSnapshotAt)) {
    const currentLabel = leagueRunLabel(env, key);
    if (currentLabel) return currentLabel;
  }

  return period || (key && key !== DEFAULT_LEAGUE_RUN_KEY ? key : "");
}
function leagueProfilePeriodLabelCandidates(periodKey, runKey) {
  const period = String(periodKey || "").trim();
  const key = normalizeRunKey(runKey || DEFAULT_LEAGUE_RUN_KEY);
  const candidates = [];
  if (period) candidates.push(period);

  const parts = period.split(":");
  const dateKey = parts.length >= 3 ? parts[parts.length - 1] : "";
  if (dateKey) {
    candidates.push(`${key}:*:${dateKey}`);
    candidates.push(`*:*:${dateKey}`);
    candidates.push(`date:${dateKey}`);
    candidates.push(dateKey);
  }

  return [...new Set(candidates.filter(Boolean))];
}
function leagueRunLabel(env, runKey) {
  const key = normalizeRunKey(runKey || leagueRunKey(env));
  const labels = parseJsonObject(env.LEAGUE_RUN_LABELS_JSON || env.LEAGUE_EVENT_LABELS_JSON);
  const mapped = String(labels[key] || labels[key.toLowerCase()] || labels.default || "").trim();
  if (mapped) return mapped;

  const currentKey = leagueRunKey(env);
  if (key === currentKey) {
    const explicit = String(env.LEAGUE_RUN_LABEL || env.LEAGUE_EVENT_LABEL || "").trim();
    if (explicit) return explicit;

    const updateTheme = String(env.PS99_UPDATE_THEME || env.PS99_UPDATE_NAME || "").trim();
    if (updateTheme) return updateTheme;

    const updateLabel = String(env.PS99_UPDATE_LABEL || "").trim();
    if (updateLabel) return updateLabel;

    const updateNumber = String(env.PS99_UPDATE_NUMBER || "").trim();
    if (updateNumber) return `Update ${updateNumber}`;
  }

  if (key === DEFAULT_LEAGUE_RUN_KEY) return DEFAULT_LEAGUE_RUN_LABEL;
  return key || "";
}
function topLeaguesRunKey(env) {
  const configured = normalizeRunKey(env.TOP_LEAGUES_RUN_KEY || env.LEAGUE_RUN_KEY || env.LEAGUE_SEASON_KEY || DEFAULT_LEAGUE_RUN_KEY);
  return configured.toLowerCase() === "active" ? DEFAULT_LEAGUE_RUN_KEY : configured;
}
function topLeaguesLimit(env) { return clamp(Number(env.TOP_LEAGUES_LIMIT || DEFAULT_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT); }
function scheduledTopLeaguesLimit(env) { return clamp(Number(env.SCHEDULED_TOP_LEAGUES_LIMIT || env.TOP_LEAGUES_SCHEDULE_LIMIT || DEFAULT_TOP_LEAGUES_LIMIT), 1, DEFAULT_TOP_LEAGUES_LIMIT); }
function allTopLeaguesLimit(env) { return clamp(Number(env.ALL_TOP_LEAGUES_LIMIT || env.TOP_LEAGUES_ALL_LIMIT || DEFAULT_ALL_TOP_LEAGUES_LIMIT), 1, MAX_TOP_LEAGUES_LIMIT); }
function topLeagueListNameForLimit(limit, env) { return Number(limit) > scheduledTopLeaguesLimit(env) ? ALL_TOP_LEAGUES_NAME : TOP_LEAGUES_NAME; }
function requestedTopLeagueListName(url, limit, env) {
  const requested = String(url.searchParams.get("list") || url.searchParams.get("scope") || "").trim().toLowerCase();
  if (["all", "10k", "10000", "top10000", "global_top_10000_leagues"].includes(requested)) return ALL_TOP_LEAGUES_NAME;
  if (["top", "1k", "1000", "top1000", "global_top_1000_leagues"].includes(requested)) return TOP_LEAGUES_NAME;
  return topLeagueListNameForLimit(limit, env);
}
function topLeaguesPageSize(env) { return clamp(Number(env.TOP_LEAGUES_PAGE_SIZE || DEFAULT_TOP_LEAGUES_PAGE_SIZE), 1, 100); }
function topLeaguesPageDelayMs(env) { return clamp(Number(env.TOP_LEAGUES_PAGE_DELAY_MS || DEFAULT_TOP_LEAGUES_PAGE_DELAY_MS), 0, 5000); }
function allTopLeaguesPageDelayMs(env) { return clamp(Number(env.ALL_TOP_LEAGUES_PAGE_DELAY_MS || DEFAULT_ALL_TOP_LEAGUES_PAGE_DELAY_MS), 0, 5000); }
function allTopLeaguesPageSize(env) { return DEFAULT_ALL_TOP_LEAGUES_PAGE_SIZE; }
function trackedRankWindowSize(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_SIZE || DEFAULT_TRACKED_RANK_WINDOW_SIZE), 1, MAX_TOP_LEAGUES_LIMIT); }
function trackedRankWindowPageDelayMs(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_PAGE_DELAY_MS || DEFAULT_TRACKED_RANK_WINDOW_PAGE_DELAY_MS), 0, 10000); }
function trackedRankWindowExpansionPageDelayMs(env) { return clamp(Number(env.TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS || env.TRACKED_RANK_WINDOW_PAGE_DELAY_MS || DEFAULT_TRACKED_RANK_WINDOW_EXPANSION_PAGE_DELAY_MS), 0, 10000); }
function shouldRunTrackedRankWindowRefresh(env) { return boolEnv(env.INGEST_TRACKED_RANK_WINDOWS, true); }
function boolEnv(value, defaultValue = false) { if (value === undefined || value === null || value === "") return defaultValue; return !FALSEY_ENV_VALUES.has(String(value).trim().toLowerCase()); }
function boolParam(value, defaultValue = false) { return value === null || value === undefined || value === "" ? defaultValue : boolEnv(value, defaultValue); }
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
function visibilityValues(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return String(value).split(",").map(item => item.trim()).filter(Boolean);
}
function visibilityTokenSet(value) { return new Set(visibilityValues(value).map(key).filter(Boolean)); }
function publicVisibilityConfig(env) {
  const raw = String(env.LEAGUE_POINTS_BLACKLIST_JSON || env.LEAGUE_PUBLIC_BLACKLIST_JSON || env.LEAGUE_VISIBILITY_BLACKLIST_JSON || DEFAULT_LEAGUE_POINTS_BLACKLIST_JSON).trim();
  if (raw === publicVisibilityCacheRaw && publicVisibilityCacheValue) return publicVisibilityCacheValue;
  const parsed = parseJsonObject(raw);
  const leagues = visibilityTokenSet(parsed.leagues || parsed.hidden_leagues || parsed.hiddenLeagues);
  const players = new Set();
  const configuredPlayers = parsed.players || parsed.hidden_players || parsed.hiddenPlayers || {};
  if (Array.isArray(configuredPlayers) || typeof configuredPlayers === "string") {
    for (const identity of visibilityTokenSet(configuredPlayers)) players.add(identity);
  } else if (configuredPlayers && typeof configuredPlayers === "object") {
    // Legacy per-league maps are intentionally flattened. Player point
    // redaction follows the player into every league.
    for (const values of Object.values(configuredPlayers)) {
      for (const identity of visibilityTokenSet(values)) players.add(identity);
    }
  }
  publicVisibilityCacheRaw = raw;
  publicVisibilityCacheValue = { leagues, players };
  return publicVisibilityCacheValue;
}
function isLeaguePubliclyHidden(env, leagueNameValue) {
  const leagueKey = key(leagueNameValue);
  return Boolean(leagueKey && publicVisibilityConfig(env).leagues.has(leagueKey));
}
function isLeaguePlayerPointsRedacted(env, row, aliases = []) {
  const config = publicVisibilityConfig(env);
  if (!config.players.size) return false;
  const extra = Array.isArray(aliases) ? aliases : [aliases];
  const identities = [
    row?.user_id, row?.userId, row?.UserID, row?.id,
    row?.username, row?.display_name, row?.DisplayName, row?.name,
    ...extra
  ].map(key).filter(Boolean);
  return identities.some(identity => config.players.has(identity));
}
function redactPublicMemberPoints(env, row, aliases = []) {
  if (!isLeaguePlayerPointsRedacted(env, row, aliases)) return row;
  const {
    total_points, points, clan_points, league_points,
    gain_5m, gain_1h, gain_6h, gain_12h, gain_24h,
    ...visible
  } = row;
  return {
    ...visible,
    points_redacted: true
  };
}
function redactLeagueProfileSummary(env, row, aliases = []) {
  if (!isLeaguePlayerPointsRedacted(env, row, aliases)) return row;
  const { final_points, highest_points, ...visible } = row;
  return { ...visible, points_redacted: true };
}
function isAggregateLeagueListName(value) {
  const normalized = key(value);
  return [TOP_LEAGUES_NAME, ALL_TOP_LEAGUES_NAME, COLD_DISCOVERED_LEAGUES_NAME].some(name => key(name) === normalized);
}
function filterPublicOverlapRows(env, rows) {
  return (rows || []).map(row => {
    if (isLeaguePubliclyHidden(env, row?.league_name || row?.display_name)) return null;
    if (!Array.isArray(row?.matches)) return row;
    const matches = row.matches.map(member => redactPublicMemberPoints(env, member));
    if (!matches.length) return null;
    return {
      ...row,
      matches,
      c0ld_member_count: matches.length,
      c0ld_league_points: matches.reduce((sum, member) => sum + (toNumber(member.league_points ?? member.points) || 0), 0)
    };
  }).filter(Boolean);
}
function hiddenLeaguePayload(env, runKey, leagueNameValue) {
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    snapshot_at: null,
    league_run_key: runKey,
    league_run_label: leagueRunLabel(env, runKey),
    league_name: leagueNameValue,
    public_visibility: "hidden",
    rows: []
  };
}
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
function isFallbackUsername(username, userId) { const text = String(username || "").trim(); const id = String(userId || "").trim(); return !text || (id && text === id) || /^user[ _-]?\d+$/i.test(text); }
function bestUsernameForOverlap(userId, ...values) { const names = values.map(value => String(value || "").trim()).filter(Boolean); return names.find(name => !isFallbackUsername(name, userId)) || names[0] || `user_${userId}`; }
function displayUsername(row, usernameMap) { const id = toNumber(row.user_id); const existing = String(row.display_name || "").trim(); const resolved = id ? String(usernameMap.get(id) || "").trim() : ""; if (resolved && !isFallbackUsername(resolved, id)) return resolved; if (existing && !isFallbackUsername(existing, id)) return existing; return existing || (id ? `user_${id}` : ""); }
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function json(payload, status = 200, headers = {}) { return new Response(JSON.stringify(payload, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } }); }
function cacheJson(payload, env) { const seconds = clamp(Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS), 0, 3600); return json(payload, 200, { "Cache-Control": seconds > 0 ? `public, max-age=${seconds}` : "no-store" }); }
function withCors(response, request, env) { const origin = request.headers.get("Origin") || ""; const allowed = allowedOrigins(env); const allowOrigin = !origin ? "*" : (allowed.has("*") || allowed.has(origin) ? origin : Array.from(allowed)[0] || "*"); const headers = new Headers(response.headers); headers.set("Access-Control-Allow-Origin", allowOrigin); headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization"); headers.set("Vary", "Origin"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
function allowedOrigins(env) { const raw = String(env.SITE_ORIGINS || "https://oapl.github.io,*"); return new Set(raw.split(",").map(item => item.trim()).filter(Boolean)); }
function httpError(status, message) { const err = new Error(message); err.status = status; return err; }
