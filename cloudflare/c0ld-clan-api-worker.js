const SNAPSHOT_TABLE = "c0ld_clan_snapshots";
const SNAPSHOT_ARCHIVE_TABLE = "c0ld_clan_snapshots_archive";
const CURRENT_TABLE = "c0ld_clan_current";
const BATTLE_RUNS_TABLE = "c0ld_battle_runs";
const CLANS_SNAPSHOT_TABLE = "c0ld_clans_snapshots";
const CLANS_SNAPSHOT_ARCHIVE_TABLE = "c0ld_clans_snapshots_archive";
const CLANS_CURRENT_TABLE = "c0ld_clans_current";
const GLOBAL_RANK_RUNS_TABLE = "c0ld_global_rank_runs";
const GLOBAL_RANK_SHARDS_TABLE = "c0ld_global_rank_shards";
const GLOBAL_RANK_CANDIDATES_TABLE = "c0ld_global_rank_candidates";
const GLOBAL_RANK_CURRENT_TABLE = "c0ld_global_ranks_current";
const GLOBAL_RANK_HISTORY_TABLE = "c0ld_global_rank_history";
const CLANS_BATTLE_RUN_CLAN_NAME = "__clans__";
const DEFAULT_CLAN_NAME = "c0ld";
const DEFAULT_BATTLE_KEY = "auto";
const DEFAULT_HISTORY_MAX_HOURS = 100000;
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const ARCHIVE_PRUNE_BATCH_SIZE = 500;
const ARCHIVE_PRUNE_MAX_BATCHES = 10;
const ROBLOX_BATCH_SIZE = 100;
const CLANS_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLAN_SCAN_LIMIT = 500;
const DEFAULT_GLOBAL_RANK_CLAN_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLANS_PER_RUN = 25;
const DEFAULT_GLOBAL_RANK_SCHEDULE_MINUTES = 30;
const DEFAULT_GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES = 29;
const DEFAULT_GLOBAL_RANK_SHARD_COUNT = 1;
const DEFAULT_GLOBAL_RANK_SHARD_CONCURRENCY = 1;
const DEFAULT_GLOBAL_RANK_RETRY_ATTEMPTS = 6;
const DEFAULT_GLOBAL_RANK_RETRY_BASE_MS = 15000;
const DEFAULT_GLOBAL_RANK_CLAN_DELAY_MS = 1000;
const DEFAULT_GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE = 10;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/health") {
        const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
        const gate = battleIngestGate({
          activeBattleMeta,
          battleMeta: activeBattleMeta,
          battleKey: activeBattleMeta?.battleKey || battleKey(env),
          env,
          force: false
        });

        response = json({
          ok: true,
          service: "c0ld-clan-api",
          clan_name: clanName(env),
          clan_names: clanNames(env),
          configured_battle_key: battleKey(env),
          active_battle_key: activeBattleMeta?.battleKey || null,
          active_battle_display_name: activeBattleMeta?.displayName || null,
          active_battle_started_at: activeBattleMeta?.startedAt || null,
          active_battle_ended_at: activeBattleMeta?.endedAt || null,
          ingest_open: gate.allowed,
          ingest_skip_reason: gate.allowed ? null : gate.reason,
          global_rank_config: globalRankRuntimeConfig(env)
        });
      } else if (request.method === "GET" && url.pathname === "/api/current") {
        response = await handleCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/history") {
        response = await handleHistory(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/battles") {
        response = await handleBattles(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/current") {
        response = await handleClansCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/history") {
        response = await handleClansHistory(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/battles") {
        response = await handleClansBattles(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/top-clan-thresholds") {
        response = await handleTopClanThresholds(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/status") {
        response = await handleGlobalRankStatus(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/current") {
        response = await handleGlobalCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/leaderboard") {
        response = await handleGlobalLeaderboard(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/search") {
        response = await handleGlobalSearch(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("clan"), isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/clans/ingest") {
        requireAdmin(request, env);
        response = await handleClansIngest(env, "manual", isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/global/ingest") {
        requireAdmin(request, env);
        response = await handleGlobalRankIngest(env, "manual", url.searchParams.get("clan"), isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/scheduled/run") {
        requireAdmin(request, env);
        response = json({
          ok: true,
          results: await runScheduledIngests(env, isForceRequest(url))
        });
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      return withCors(json({
        ok: false,
        message: err?.message || String(err)
      }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    const scheduledAt = event?.scheduledTime ? new Date(event.scheduledTime) : null;
    ctx.waitUntil(runScheduledIngests(env, false, scheduledAt));
  }
};

async function runScheduledIngests(env, force = false, scheduledAt = null) {
  const jobs = clanNames(env).map(clan => ({
    label: `members:${clan}`,
    run: () => handleIngest(env, "schedule", clan, force)
  }));

  if (String(env.INGEST_CLANS_LEADERBOARD || "true").toLowerCase() !== "false") {
    jobs.push({
      label: "clans",
      run: () => handleClansIngest(env, "schedule", force)
    });
  }

  if (String(env.INGEST_GLOBAL_RANKS || "false").toLowerCase() === "true") {
    const globalClan = clanName(env);
    const hasRunningGlobalScan = await hasRunningGlobalRankRun(env, globalClan).catch(() => false);

    if (force || hasRunningGlobalScan || shouldRunGlobalRankSchedule(env, scheduledAt)) {
      jobs.push({
        label: "global-ranks",
        run: () => handleGlobalRankIngest(env, "schedule", globalClan, force)
      });
    }
  }

  const results = [];

  for (const job of jobs) {
    try {
      const response = await job.run();
      const payload = await responseJson(response);
      const result = {
        label: job.label,
        ok: response.ok,
        status: response.status,
        skipped: Boolean(payload?.skipped),
        reason: payload?.reason || null,
        battle_key: payload?.battle_key || null,
        rows_inserted: payload?.rows_inserted ?? null,
        status_text: payload?.status || null,
        shard_count: payload?.shard_count ?? null,
        shard_concurrency: payload?.shard_concurrency ?? null,
        clans_per_shard_run: payload?.clans_per_shard_run ?? null,
        clan_scan_limit: payload?.clan_scan_limit ?? null,
        scanned_count: payload?.scanned_count ?? null,
        scanned_clan_count: payload?.scanned_clan_count ?? null,
        processed_clans: payload?.processed_clans ?? null,
        next_clan_offset: payload?.next_clan_offset ?? null,
        candidate_player_count: payload?.candidate_player_count ?? null,
        total_global_players: payload?.total_global_players ?? null,
        message: payload?.message || null
      };
      results.push(result);
      console.log("scheduled ingest result", JSON.stringify(result));
    } catch (err) {
      const result = {
        label: job.label,
        ok: false,
        status: err?.status || 500,
        skipped: false,
        reason: "error",
        battle_key: null,
        rows_inserted: 0,
        message: err?.message || String(err)
      };
      results.push(result);
      console.error("scheduled ingest failed", JSON.stringify(result));
    }
  }

  return results;
}

async function responseJson(response) {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function handleIngest(env, source, requestedClan, force = false) {
  requireSupabase(env);

  const fetchedAt = new Date().toISOString();
  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeGate = battleIngestGate({
    activeBattleMeta,
    battleMeta: activeBattleMeta,
    battleKey: activeBattleMeta?.battleKey || configuredBattleKey,
    env,
    force
  });

  if (!activeGate.allowed) {
    return skippedIngestResponse({
      scope: "members",
      source,
      clan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey: activeBattleMeta?.battleKey || configuredBattleKey,
      battleMeta: activeBattleMeta,
      gate: activeGate
    });
  }

  const api = await fetchClanApi(clan);
  const battles = api.data?.Battles || {};
  const resolvedBattleKey = resolveBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
  const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;

  if (!battle) {
    const available = Object.keys(battles);
    throw httpError(
      502,
      `No battle data found for ${configuredBattleKey}. Available battles: ${available.join(", ") || "none"}`
    );
  }

  const members = normalizeMembers(api.data || {}, battle);
  const usernameMap = await resolveRobloxUsernames(members.map(row => row.user_id), env);
  const ranked = members
    .map(row => ({
      ...row,
      username: usernameMap.get(row.user_id) || `user_${row.user_id}`
    }))
    .sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return String(a.username).localeCompare(String(b.username));
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const battleMeta = mergeBattleMeta(
    extractBattleMeta(battle, resolvedBattleKey, env, {
      allowEnvDisplayName: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey),
      allowEnvTiming: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey)
    }),
    activeBattleMeta,
    resolvedBattleKey
  );
  const ingestGate = battleIngestGate({
    activeBattleMeta,
    battleMeta,
    battleKey: resolvedBattleKey,
    env,
    force
  });

  if (!ingestGate.allowed) {
    return skippedIngestResponse({
      scope: "members",
      source,
      clan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey,
      battleMeta,
      gate: ingestGate
    });
  }

  const snapshotId = `${clan}:${resolvedBattleKey}:${fetchedAt}`;
  const rows = ranked.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source,
    clan_name: clan,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    rank: row.rank,
    user_id: row.user_id,
    username: row.username,
    total_points: row.total_points,
    raw_member: row.raw_member,
    raw_contribution: row.raw_contribution
  }));

  if (rows.length) {
    await supabaseInsert(env, SNAPSHOT_TABLE, rows);
    await replaceCurrentRows(env, CURRENT_TABLE, {
      clan_name: `eq.${clan}`
    }, rows.map(row => ({
      ...row,
      updated_at: fetchedAt
    })));
  }

  await upsertBattleRun(env, {
    clan_name: clan,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    last_seen_at: fetchedAt,
    latest_snapshot_id: snapshotId,
    latest_snapshot_at: fetchedAt,
    is_active: !battleMeta.endedAt || new Date(battleMeta.endedAt).getTime() > Date.now(),
    updated_at: fetchedAt
  });

  await pruneOldSnapshots(env, clan);

  return json({
    ok: true,
    clan_name: clan,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    rows_inserted: rows.length
  }, 202);
}

async function handleCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const requestedBattle = url.searchParams.get("battle") || "";
  const explicitBattle =
    requestedBattle &&
    !["current", "auto"].includes(String(requestedBattle).toLowerCase());

  let latest = null;
  let rows = [];

  if (explicitBattle) {
    latest = await fetchLatestSnapshotMeta(env, clan, requestedBattle);
    if (latest) {
      rows = await fetchSnapshotRows(env, latest.snapshot_id);
    }
  } else {
    rows = await fetchCurrentRows(env, clan);
    latest = latestMetaFromRows(rows);
  }

  if (!latest) {
    return cacheJson({
      generated_at: new Date().toISOString(),
      snapshot_at: null,
      clan_name: clan,
      battle: explicitBattle ? requestedBattle : null,
      rows: []
    }, env);
  }

  const rowsWithGains = await addGainFields(env, rows, latest);
  const activeBattleMeta = !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  latest = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: !explicitBattle });
  const usernameMap = await resolveMissingUsernames(rowsWithGains, env);
  const avatarMap = await resolveRobloxAvatarHeadshots(
    rowsWithGains.map(row => row.user_id),
    env
  ).catch(() => new Map());
  const trackedClan = await fetchTrackedClanCurrent(env, clan).catch(() => null);

  return cacheJson({
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    clan_name: latest.clan_name,
    battle: latest.battle_key,
    display_name: cleanBattleDisplayName(latest.battle_key, latest.battle_display_name),
    battle_start_iso: latest.battle_started_at,
    battle_end_iso: latest.battle_ended_at,
    clan_rank: trackedClan?.rank ?? null,
    clan_points: trackedClan?.points ?? null,
    source: "c0ld-clan-api-worker",
    rows: rowsWithGains.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      username: displayUsername(row, usernameMap),
      user_id: toNumber(row.user_id),
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      total_points: toNumber(row.total_points) || 0,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h
    }))
  }, env);
}

async function handleGlobalCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000);

  const rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,updated_at",
    clan_name: `eq.${clan}`,
    order: "clan_rank.asc",
    limit: String(limit)
  });

  const run = await findLatestGlobalRankSearchRun(env, clan);
  const displayRows = run
    ? await overlayGlobalCurrentRowsFromCandidates(env, rows, run)
    : rows.map(row => ({
      ...row,
      global_rank: null,
      global_points: null,
      total_global_players: null,
      found: false,
      run_key: null
    }));

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    snapshot_at: run?.finished_at || run?.updated_at || displayRows[0]?.fetched_at || rows[0]?.fetched_at || null,
    run,
    rows: displayRows.map(row => normalizeGlobalCurrentOutput(row))
  }, env);
}

async function handleGlobalLeaderboard(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 1000);
  const run = await findLatestGlobalRankSearchRun(env, clan);

  if (!run?.run_key) {
    return cacheJson({
      ok: false,
      message: "No completed global rank scan is available yet.",
      clan_name: clan,
      rows: []
    }, env);
  }

  const rankedCandidates = await readGlobalRankLeaderboardCandidates(env, run.run_key, limit);
  const rows = rankedCandidates.slice(0, limit);
  const userIds = rows.map(row => toNumber(row.user_id)).filter(Boolean);
  const snapshotAt = run.finished_at || run.updated_at || run.started_at || rows[0]?.fetched_at || null;
  const totalGlobalPlayers =
    toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    await countGlobalRankCandidates(env, run.run_key);

  const [usernameMap, avatarMap, gainMaps] = await Promise.all([
    resolveRobloxUsernames(userIds, env).catch(() => new Map()),
    resolveRobloxAvatarHeadshots(userIds, env).catch(() => new Map()),
    buildGlobalLeaderboardGainMaps(env, {
      clan,
      battleKey: run.battle_key,
      snapshotAt,
      userIds
    }).catch(() => ({}))
  ]);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    clan_name: clan,
    snapshot_at: snapshotAt,
    run,
    total_global_players: totalGlobalPlayers,
    rows: rows.map(row => normalizeGlobalLeaderboardOutput(row, {
      run,
      usernameMap,
      avatarMap,
      gainMaps,
      totalGlobalPlayers
    }))
  }, env);
}

async function handleGlobalRankStatus(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const runKey = url.searchParams.get("run_key");
  const battle = url.searchParams.get("battle");
  const run = runKey
    ? await findGlobalRankRunByKey(env, runKey)
    : await findLatestGlobalRankRun(env, clan, battle);
  const shards = run?.run_key ? await fetchGlobalRankShards(env, run.run_key).catch(() => []) : [];
  const shardSummary = summarizeGlobalRankShards(shards);
  const resumable = run ? await isResumableGlobalRankRun(env, run, shards).catch(() => false) : false;
  const timing = summarizeGlobalRankTiming(run, shardSummary);

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    clan_name: clan,
    runtime_config: globalRankRuntimeConfig(env),
    run,
    resumable,
    timing,
    shard_summary: shardSummary,
    shards: shardSummary.rows
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function readGlobalRankLeaderboardCandidates(env, runKey, limit) {
  const desired = clamp(Number(limit || 500), 1, 1000);
  const readLimit = Math.min(globalRankCandidateReadLimit(env), Math.max(1000, desired * 4));
  const pageSize = 1000;
  const rows = [];
  let offset = 0;
  let ranked = [];

  while (offset < readLimit && ranked.length < desired) {
    const pageLimit = Math.min(pageSize, readLimit - offset);
    const page = await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      select: "user_id,points,source_clan,source_clan_rank,source_clan_points,battle_key,battle_display_name,fetched_at,raw_candidate,updated_at",
      run_key: `eq.${runKey}`,
      order: "points.desc,user_id.asc",
      limit: String(pageLimit),
      offset: String(offset)
    });

    rows.push(...page);
    ranked = dedupeGlobalCandidateRows(rows)
      .sort(sortGlobalCandidateRows)
      .map((row, index) => ({
        ...row,
        global_rank: index + 1
      }));

    if (page.length < pageLimit) break;
    offset += page.length;
  }

  return ranked;
}

async function buildGlobalLeaderboardGainMaps(env, { clan, battleKey, snapshotAt, userIds }) {
  const snapshotMs = new Date(snapshotAt || 0).getTime();
  if (!Number.isFinite(snapshotMs) || !userIds.length) return {};

  const runRows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "run_key,finished_at,updated_at,started_at,battle_key",
    clan_name: `eq.${clan}`,
    battle_key: battleKey ? `eq.${battleKey}` : undefined,
    status: "in.(ok,completed)",
    finished_at: `lt.${new Date(snapshotMs).toISOString()}`,
    order: "finished_at.desc",
    limit: "200"
  });

  const windows = [
    { key: "gain_5m", minutes: 5, toleranceMinutes: 10 },
    { key: "gain_1h", minutes: 60, toleranceMinutes: 30 },
    { key: "gain_12h", minutes: 12 * 60, toleranceMinutes: 90 },
    { key: "gain_24h", minutes: 24 * 60, toleranceMinutes: 120 }
  ];
  const selectedRuns = new Map();

  for (const window of windows) {
    const targetMs = snapshotMs - window.minutes * 60 * 1000;
    const toleranceMs = window.toleranceMinutes * 60 * 1000;
    let best = null;
    let bestDistance = Infinity;

    for (const row of runRows) {
      const rowMs = new Date(row.finished_at || row.updated_at || row.started_at || 0).getTime();
      if (!Number.isFinite(rowMs)) continue;

      const distance = Math.abs(rowMs - targetMs);
      if (distance <= toleranceMs && distance < bestDistance) {
        best = row;
        bestDistance = distance;
      }
    }

    if (best?.run_key) selectedRuns.set(window.key, best.run_key);
  }

  const entries = await Promise.all([...selectedRuns.entries()].map(async ([key, runKey]) => [
    key,
    await readGlobalRankCandidatePointsMap(env, runKey, userIds)
  ]));

  return Object.fromEntries(entries);
}

async function readGlobalRankCandidatePointsMap(env, runKey, userIds) {
  const map = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];

  for (const batch of chunkValues(ids, 100)) {
    const rows = await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      select: "user_id,points",
      run_key: `eq.${runKey}`,
      user_id: `in.(${batch.join(",")})`,
      order: "points.desc,user_id.asc",
      limit: String(batch.length * 5)
    });

    for (const row of rows) {
      const userId = toNumber(row.user_id);
      const points = toNumber(row.points);
      if (!userId || points === null) continue;

      const existing = map.get(userId);
      if (existing === undefined || points > existing) map.set(userId, points);
    }
  }

  return map;
}

function chunkValues(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

function normalizeGlobalLeaderboardOutput(row, {
  run,
  usernameMap,
  avatarMap,
  gainMaps,
  totalGlobalPlayers
}) {
  const userId = toNumber(row.user_id);
  const points = toNumber(row.points) || 0;
  const previous = key => {
    const map = gainMaps?.[key];
    if (!map || !userId || !map.has(userId)) return null;
    return points - (toNumber(map.get(userId)) || 0);
  };

  return {
    global_rank: toNumber(row.global_rank),
    clan: String(row.source_clan || "").trim(),
    source_clan: String(row.source_clan || "").trim(),
    user_id: userId,
    username: globalCandidateUsername(row, usernameMap),
    display_name: globalCandidateDisplayName(row),
    avatar_url: avatarMap.get(userId) || null,
    points,
    battle_key: row.battle_key || run?.battle_key || null,
    battle_display_name: cleanBattleDisplayName(
      row.battle_key || run?.battle_key,
      row.battle_display_name || run?.battle_display_name
    ),
    event_name: run?.event_name || row.battle_display_name || run?.battle_display_name || run?.battle_key || null,
    total_global_players: toNumber(totalGlobalPlayers),
    fetched_at: row.fetched_at || run?.finished_at || run?.updated_at || null,
    run_key: run?.run_key || null,
    gain_5m: previous("gain_5m"),
    gain_1h: previous("gain_1h"),
    gain_12h: previous("gain_12h"),
    gain_24h: previous("gain_24h")
  };
}

function globalCandidateUsername(row, usernameMap) {
  const userId = toNumber(row.user_id);
  const resolved = String(usernameMap.get(userId) || "").trim();
  if (resolved && !isFallbackUsername(resolved, userId)) return resolved;

  const raw = parseGlobalCandidateRaw(row.raw_candidate);
  const rawName = String(firstDefined(
    raw.member?.Username,
    raw.member?.username,
    raw.member?.Name,
    raw.member?.name,
    raw.member?.DisplayName,
    raw.member?.displayName,
    raw.contribution?.Username,
    raw.contribution?.username,
    raw.contribution?.Name,
    raw.contribution?.name
  ) || "").trim();

  if (rawName && !isFallbackUsername(rawName, userId)) return rawName;
  return userId ? `user_${userId}` : "";
}

function globalCandidateDisplayName(row) {
  const raw = parseGlobalCandidateRaw(row.raw_candidate);
  return String(firstDefined(
    raw.member?.DisplayName,
    raw.member?.displayName,
    raw.member?.Display,
    raw.member?.display,
    raw.contribution?.DisplayName,
    raw.contribution?.displayName
  ) || "").trim() || null;
}

function parseGlobalCandidateRaw(value) {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function overlayGlobalCurrentRowsFromCandidates(env, rows, run) {
  if (!run?.run_key || !Array.isArray(rows) || !rows.length) return rows;

  const alreadyCurrent = rows.every(row => row.run_key === run.run_key);
  if (alreadyCurrent) return rows;

  const rankedCandidates = await readGlobalRankRankedCandidates(env, run.run_key);
  if (!rankedCandidates.length) {
    return rows.map(row => ({
      ...row,
      global_rank: null,
      global_points: null,
      total_global_players: null,
      found: false,
      run_key: run.run_key
    }));
  }

  const totalGlobalPlayers =
    toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    rankedCandidates.length;
  const byUserId = new Map(rankedCandidates.map(row => [String(row.user_id), row]));

  return rows.map(row => {
    const match = byUserId.get(String(row.user_id));
    if (!match) {
      return {
        ...row,
        global_rank: null,
        global_points: null,
        total_global_players: totalGlobalPlayers,
        found: false,
        fetched_at: run.finished_at || run.updated_at || row.fetched_at || null,
        run_key: run.run_key,
        updated_at: run.updated_at || row.updated_at || null
      };
    }

    return {
      ...row,
      global_rank: toNumber(match.global_rank),
      global_points: toNumber(match.points),
      total_global_players: totalGlobalPlayers,
      found: true,
      fetched_at: run.finished_at || run.updated_at || match.fetched_at || row.fetched_at || null,
      run_key: run.run_key,
      updated_at: run.updated_at || row.updated_at || match.updated_at || null
    };
  });
}

async function handleGlobalSearch(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const query = String(url.searchParams.get("q") || url.searchParams.get("username") || "").trim();

  if (!query) {
    throw httpError(400, "Missing search query. Use ?q=username.");
  }

  const rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,updated_at",
    clan_name: `eq.${clan}`,
    order: "clan_rank.asc",
    limit: "1000"
  });

  const key = normalizeGlobalSearchKey(query);
  const found = rows.find(row => {
    const id = String(row.user_id || "").trim();
    return (
      id === query ||
      normalizeGlobalSearchKey(row.username) === key ||
      normalizeGlobalSearchKey(row.display_name) === key
    );
  });

  if (!found) {
    return cacheJson(await searchGlobalRankCandidates(env, clan, query), env);
  }

  const latestRun = await findLatestGlobalRankSearchRun(env, clan);
  const foundUsesLatestRun = Boolean(latestRun?.run_key && found.run_key === latestRun.run_key);

  if (!foundUsesLatestRun || !(toNumber(found.global_rank) > 0)) {
    const candidateResult = await searchGlobalRankCandidates(env, clan, query);
    if (candidateResult?.ok && candidateResult.row) {
      const run = candidateResult.run || null;
      return cacheJson({
        ...candidateResult,
        row: {
          ...candidateResult.row,
          clan_name: found.clan_name || clan,
          username: found.username || candidateResult.row.username,
          display_name: found.display_name || candidateResult.row.display_name,
          avatar_url: found.avatar_url || candidateResult.row.avatar_url,
          clan_rank: toNumber(found.clan_rank) || candidateResult.row.clan_rank,
          clan_points: toNumber(found.clan_points) || candidateResult.row.clan_points,
          clan_member_count: toNumber(run?.clan_member_count) || null,
          source_clan: found.clan_name || clan
        },
        run
      }, env);
    }

    return cacheJson(candidateResult, env);
  }

  const history = await supabaseSelect(env, GLOBAL_RANK_HISTORY_TABLE, {
    select: "run_key,fetched_at,event_name,global_rank,global_points,total_global_players,clan_rank,clan_points,found",
    clan_name: `eq.${clan}`,
    user_id: `eq.${found.user_id}`,
    order: "fetched_at.desc",
    limit: "24"
  });
  const runRows = found.run_key
    ? await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
      select: "*",
      run_key: `eq.${found.run_key}`,
      limit: "1"
    })
    : [];

  return cacheJson({
    ok: true,
    query,
    clan_name: clan,
    row: {
      ...normalizeGlobalCurrentOutput(found),
      clan_member_count: toNumber(runRows[0]?.clan_member_count) || null
    },
    run: runRows[0] || null,
    history: history.map(row => ({
      ...row,
      global_rank: toNumber(row.global_rank),
      global_points: toNumber(row.global_points),
      total_global_players: toNumber(row.total_global_players),
      clan_rank: toNumber(row.clan_rank),
      clan_points: toNumber(row.clan_points)
    }))
  }, env);
}

async function searchGlobalRankCandidates(env, clan, query) {
  const run = await findLatestGlobalRankSearchRun(env, clan);

  if (!run?.run_key) {
    return {
      ok: false,
      message: "No completed global rank scan is available yet.",
      query,
      clan_name: clan
    };
  }

  const lookup = await resolveGlobalSearchIdentity(query, env);
  if (!lookup.user_id) {
    return {
      ok: false,
      message: `No Roblox user matched "${query}".`,
      query,
      clan_name: clan,
      run
    };
  }

  const candidateRows = await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    select: "user_id,points,source_clan,source_clan_rank,source_clan_points,battle_key,battle_display_name,fetched_at,raw_candidate,updated_at",
    run_key: `eq.${run.run_key}`,
    user_id: `eq.${lookup.user_id}`,
    order: "points.desc,user_id.asc",
    limit: "10"
  });
  const candidate = dedupeGlobalCandidateRows(candidateRows).sort(sortGlobalCandidateRows)[0] || null;

  if (!candidate) {
    return {
      ok: false,
      message: `No global-rank row matched "${query}" in the latest Top ${toNumber(run.scan_limit) || 500} clan scan.`,
      query,
      clan_name: clan,
      run
    };
  }

  const points = toNumber(candidate.points) || 0;
  const userId = toNumber(candidate.user_id);
  const [higherCount, tiedBeforeCount, avatarMap] = await Promise.all([
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${run.run_key}`,
      points: `gt.${points}`
    }),
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${run.run_key}`,
      points: `eq.${points}`,
      user_id: `lt.${userId}`
    }),
    resolveRobloxAvatarHeadshots([userId], env).catch(() => new Map())
  ]);
  const total = toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    await countGlobalRankCandidates(env, run.run_key);

  const username = lookup.username || (await resolveRobloxUsernames([userId], env)
    .then(map => map.get(userId))
    .catch(() => `user_${userId}`));

  return {
    ok: true,
    query,
    clan_name: clan,
    run,
    row: normalizeGlobalCandidateSearchOutput(candidate, {
      run,
      globalRank: higherCount + tiedBeforeCount + 1,
      totalGlobalPlayers: total,
      username,
      displayName: lookup.display_name,
      avatarUrl: avatarMap.get(userId) || null
    }),
    history: []
  };
}

async function handleGlobalRankIngest(env, source, requestedClan, force = false) {
  if (globalRankShardCount(env) > 1) {
    return handleGlobalRankShardedIngest(env, source, requestedClan, force);
  }

  return handleGlobalRankLinearIngest(env, source, requestedClan, force);
}

async function handleGlobalRankLinearIngest(env, source, requestedClan, force = false) {
  requireSupabase(env);

  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const fetchedAt = new Date().toISOString();
  const clanScanLimit = globalRankClanScanLimit(env);
  const pageSize = globalRankClanPageSize(env);
  const clansPerRun = globalRankClansPerRun(env);
  const currentRows = await fetchCurrentRows(env, clan);

  if (!currentRows.length) {
    throw httpError(409, `No current ${clan} member rows found. Run /api/ingest first.`);
  }

  const latest = latestMetaFromRows(currentRows);
  const configuredBattleKey = latest?.battle_key || battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const eventName = globalRankEventName(env, latest);
  const battleDisplayName = cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name);
  const existingRunningRun = await findRunningGlobalRankRun(env, clan, latest?.battle_key).catch(() => null);
  const runningRun = force ? null : existingRunningRun;
  const runKey = runningRun?.run_key || `${clan}:global:${latest?.battle_key || "battle"}:${fetchedAt}`;
  const startedAt = runningRun?.started_at || fetchedAt;
  let nextClanOffset = force ? 0 : (toNumber(runningRun?.next_clan_offset) || 0);
  let scannedClanCount = force ? 0 : (
    toNumber(runningRun?.scanned_clan_count) ||
    toNumber(runningRun?.scanned_count) ||
    0
  );
  let candidatePlayerCount = force ? 0 : (toNumber(runningRun?.candidate_player_count) || 0);
  let cutoffPoints = null;
  let stopReason = null;

  const avatarMap = await resolveRobloxAvatarHeadshots(
    currentRows.map(row => row.user_id),
    env
  ).catch(() => new Map());
  const usernameMap = await resolveMissingUsernames(currentRows, env);
  const clanMembers = currentRows
    .map(row => ({
      clan_name: clan,
      user_id: toNumber(row.user_id),
      username: displayUsername(row, usernameMap) || `user_${row.user_id}`,
      display_name: null,
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      clan_rank: toNumber(row.rank),
      clan_points: toNumber(row.total_points) || 0,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      global_rank: null,
      global_points: null,
      total_global_players: null,
      found: false,
      fetched_at: fetchedAt,
      run_key: runKey,
      raw_global: {},
      updated_at: fetchedAt
    }))
    .filter(row => row.user_id);

  if (force && existingRunningRun?.run_key) {
    await supabaseDelete(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${existingRunningRun.run_key}`
    });
    await upsertGlobalRankRun(env, {
      run_key: existingRunningRun.run_key,
      clan_name: existingRunningRun.clan_name || clan,
      status: "superseded",
      finished_at: fetchedAt,
      stop_reason: "force_restart",
      updated_at: fetchedAt
    });
  }

  await upsertGlobalRankRun(env, {
    run_key: runKey,
    clan_name: clan,
    battle_key: latest?.battle_key || null,
    battle_display_name: battleDisplayName,
    event_name: eventName,
    started_at: startedAt,
    finished_at: null,
    status: "running",
    scan_limit: clanScanLimit,
    page_size: pageSize,
    scanned_count: scannedClanCount,
    scanned_clan_count: scannedClanCount,
    next_clan_offset: nextClanOffset,
    candidate_player_count: candidatePlayerCount,
    clan_member_count: clanMembers.length,
    found_member_count: 0,
    total_global_players: null,
    cutoff_points: cutoffPoints,
    stop_reason: null,
    scan_kind: "clan_contribution_scan",
    last_error: null,
    updated_at: fetchedAt
  });

  let processedClans = 0;
  let foundMemberCount = 0;

  try {
    while (processedClans < clansPerRun && nextClanOffset < clanScanLimit) {
      const pageNumber = Math.floor(nextClanOffset / pageSize) + 1;
      const pageIndex = nextClanOffset % pageSize;
      const pageRows = await fetchClanLeaderboardPage(env, {
        page: pageNumber,
        pageSize
      });

      if (!pageRows.length || pageIndex >= pageRows.length) {
        stopReason = "clan_leaderboard_exhausted";
        break;
      }

      for (let index = pageIndex; index < pageRows.length && processedClans < clansPerRun; index += 1) {
        if (nextClanOffset >= clanScanLimit) break;

        const clanRow = pageRows[index];
        const candidateRows = await collectGlobalRankCandidatesForClan(env, {
          runKey,
          clanRow,
          configuredBattleKey,
          activeBattleKey: activeBattleMeta?.battleKey || "",
          fetchedAt
        });

        if (candidateRows.length) {
          await supabaseUpsert(
            env,
            GLOBAL_RANK_CANDIDATES_TABLE,
            candidateRows,
            "run_key,source_clan,user_id"
          );
        }

        processedClans += 1;
        scannedClanCount += 1;
        nextClanOffset += 1;

        const delayMs = globalRankClanDelayMs(env);
        if (delayMs > 0 && processedClans < clansPerRun && nextClanOffset < clanScanLimit) {
          await sleep(delayMs);
        }
      }
    }

    candidatePlayerCount = await countGlobalRankUniqueCandidates(env, runKey);
    foundMemberCount = await countGlobalRankMatchedClanMembers(env, runKey, clanMembers);

    if (!stopReason && nextClanOffset >= clanScanLimit) {
      stopReason = "max_clan_scan_limit";
    }

    if (stopReason) {
      await validateGlobalRankRunCompleteness(env, {
        clan,
        clanMembers,
        clanScanLimit,
        candidatePlayerCount,
        foundMemberCount,
        shardSummary: {
          processedCount: scannedClanCount,
          stopReasons: [stopReason]
        }
      });
      const publishCurrent = await shouldPublishGlobalRankCurrent(env, {
        runKey,
        clan,
        startedAt
      });
      const finalized = await finalizeGlobalRankRun(env, {
        runKey,
        clan,
        clanMembers,
        latest,
        eventName,
        fetchedAt,
        candidatePlayerCount,
        publishCurrent
      });
      foundMemberCount = finalized.foundMemberCount;

      const finishedAt = new Date().toISOString();
      await upsertGlobalRankRun(env, {
        run_key: runKey,
        clan_name: clan,
        battle_key: latest?.battle_key || null,
        battle_display_name: battleDisplayName,
        event_name: eventName,
        started_at: startedAt,
        finished_at: finishedAt,
        status: "ok",
        scan_limit: clanScanLimit,
        page_size: pageSize,
        scanned_count: scannedClanCount,
        scanned_clan_count: scannedClanCount,
        next_clan_offset: nextClanOffset,
        candidate_player_count: candidatePlayerCount,
        clan_member_count: clanMembers.length,
        found_member_count: foundMemberCount,
        total_global_players: candidatePlayerCount,
        cutoff_points: cutoffPoints,
        stop_reason: stopReason,
        scan_kind: "clan_contribution_scan",
        last_error: null,
        updated_at: finishedAt
      });

      return json({
        ok: true,
        source,
        clan_name: clan,
        battle_key: latest?.battle_key || null,
        battle_display_name: battleDisplayName,
        event_name: eventName,
        run_key: runKey,
        fetched_at: fetchedAt,
        status: "ok",
        stop_reason: stopReason,
        clan_scan_limit: clanScanLimit,
        scanned_count: scannedClanCount,
        scanned_clan_count: scannedClanCount,
        processed_clans: processedClans,
        next_clan_offset: nextClanOffset,
        cutoff_points: cutoffPoints,
        candidate_player_count: candidatePlayerCount,
        clan_member_count: clanMembers.length,
        total_global_players: candidatePlayerCount,
        published_current: publishCurrent
      }, 202);
    }

    const updatedAt = new Date().toISOString();
    await upsertGlobalRankRun(env, {
      run_key: runKey,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      started_at: startedAt,
      finished_at: null,
      status: "running",
      scan_limit: clanScanLimit,
      page_size: pageSize,
      scanned_count: scannedClanCount,
      scanned_clan_count: scannedClanCount,
      next_clan_offset: nextClanOffset,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      found_member_count: 0,
      total_global_players: candidatePlayerCount,
      cutoff_points: cutoffPoints,
      stop_reason: null,
      scan_kind: "clan_contribution_scan",
      last_error: null,
      updated_at: updatedAt
    });

    return json({
      ok: true,
      source,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      run_key: runKey,
      fetched_at: fetchedAt,
      status: "running",
      clan_scan_limit: clanScanLimit,
      scanned_count: scannedClanCount,
      scanned_clan_count: scannedClanCount,
      processed_clans: processedClans,
      next_clan_offset: nextClanOffset,
      cutoff_points: cutoffPoints,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      total_global_players: candidatePlayerCount
    }, 202);
  } catch (err) {
    const failedAt = new Date().toISOString();
    await upsertGlobalRankRun(env, {
      run_key: runKey,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      started_at: startedAt,
      finished_at: failedAt,
      status: "failed",
      scan_limit: clanScanLimit,
      page_size: pageSize,
      scanned_count: scannedClanCount,
      scanned_clan_count: scannedClanCount,
      next_clan_offset: nextClanOffset,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      found_member_count: foundMemberCount,
      total_global_players: candidatePlayerCount,
      cutoff_points: cutoffPoints,
      stop_reason: "failed",
      scan_kind: "clan_contribution_scan",
      last_error: err?.message || String(err),
      updated_at: failedAt
    });
    throw err;
  }
}

async function handleGlobalRankShardedIngest(env, source, requestedClan, force = false) {
  requireSupabase(env);

  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const fetchedAt = new Date().toISOString();
  const clanScanLimit = globalRankClanScanLimit(env);
  const pageSize = globalRankClanPageSize(env);
  const shardCount = globalRankShardCount(env);
  const shardConcurrency = globalRankShardConcurrency(env, shardCount);
  const clansPerShardRun = globalRankClansPerShardRun(env, shardCount);
  const currentRows = await fetchCurrentRows(env, clan);

  if (!currentRows.length) {
    throw httpError(409, `No current ${clan} member rows found. Run /api/ingest first.`);
  }

  const latest = latestMetaFromRows(currentRows);
  const configuredBattleKey = latest?.battle_key || battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const eventName = globalRankEventName(env, latest);
  const battleDisplayName = cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name);
  const existingRunningRun = await findResumableGlobalRankRun(env, clan, latest?.battle_key).catch(() => null);
  const existingShards = existingRunningRun?.run_key
    ? await fetchGlobalRankShards(env, existingRunningRun.run_key).catch(() => [])
    : [];
  const compatibleRunningRun = existingRunningRun && globalRankRunMatchesRuntimeConfig({
    run: existingRunningRun,
    shards: existingShards,
    clanScanLimit,
    pageSize,
    shardCount
  });

  if (existingRunningRun && !compatibleRunningRun && !force) {
    await upsertGlobalRankRun(env, {
      run_key: existingRunningRun.run_key,
      clan_name: existingRunningRun.clan_name || clan,
      status: "superseded",
      finished_at: fetchedAt,
      stop_reason: "runtime_config_changed",
      updated_at: fetchedAt
    });
  }

  const runningRun = force ? null : (compatibleRunningRun ? existingRunningRun : null);
  const runKey = runningRun?.run_key || `${clan}:global:${latest?.battle_key || "battle"}:${fetchedAt}`;
  const startedAt = runningRun?.started_at || fetchedAt;

  const avatarMap = await resolveRobloxAvatarHeadshots(
    currentRows.map(row => row.user_id),
    env
  ).catch(() => new Map());
  const usernameMap = await resolveMissingUsernames(currentRows, env);
  const clanMembers = currentRows
    .map(row => ({
      clan_name: clan,
      user_id: toNumber(row.user_id),
      username: displayUsername(row, usernameMap) || `user_${row.user_id}`,
      display_name: null,
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      clan_rank: toNumber(row.rank),
      clan_points: toNumber(row.total_points) || 0,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      global_rank: null,
      global_points: null,
      total_global_players: null,
      found: false,
      fetched_at: fetchedAt,
      run_key: runKey,
      raw_global: {},
      updated_at: fetchedAt
    }))
    .filter(row => row.user_id);

  if (force && existingRunningRun?.run_key) {
    await upsertGlobalRankRun(env, {
      run_key: existingRunningRun.run_key,
      clan_name: existingRunningRun.clan_name || clan,
      status: "superseded",
      finished_at: fetchedAt,
      stop_reason: "force_restart",
      updated_at: fetchedAt
    });
  }

  await upsertGlobalRankRun(env, {
    run_key: runKey,
    clan_name: clan,
    battle_key: latest?.battle_key || null,
    battle_display_name: battleDisplayName,
    event_name: eventName,
    started_at: startedAt,
    finished_at: null,
    status: "running",
    scan_limit: clanScanLimit,
    page_size: pageSize,
    scanned_count: toNumber(runningRun?.scanned_count) || 0,
    scanned_clan_count: toNumber(runningRun?.scanned_clan_count) || 0,
    next_clan_offset: toNumber(runningRun?.next_clan_offset) || 0,
    candidate_player_count: toNumber(runningRun?.candidate_player_count) || 0,
    clan_member_count: clanMembers.length,
    found_member_count: 0,
    total_global_players: null,
    cutoff_points: null,
    stop_reason: null,
    scan_kind: "clan_contribution_sharded",
    last_error: null,
    updated_at: fetchedAt
  });

  await ensureGlobalRankShards(env, {
    runKey,
    shardCount,
    clanScanLimit,
    startedAt
  });

  let processedClans = 0;
  let foundMemberCount = 0;

  try {
    const shardsBefore = await fetchGlobalRankShards(env, runKey);
    const activeShards = shardsBefore
      .filter(shard => String(shard.status || "running") === "running")
      .sort((a, b) => toNumber(a.shard_index) - toNumber(b.shard_index))
      .slice(0, shardConcurrency);
    const leaderboardPageCache = new Map();

    const shardResults = await runLimited(activeShards, shardConcurrency, shard => processGlobalRankShard(env, {
      runKey,
      shard,
      pageSize,
      clansPerShardRun,
      configuredBattleKey,
      activeBattleKey: activeBattleMeta?.battleKey || "",
      fetchedAt,
      leaderboardPageCache
    }));

    processedClans = shardResults.reduce((total, result) => total + (toNumber(result.processed_clans) || 0), 0);

    const shardsAfter = await fetchGlobalRankShards(env, runKey);
    const shardSummary = summarizeGlobalRankShards(shardsAfter);
    const candidatePlayerCount = await countGlobalRankUniqueCandidates(env, runKey);
    foundMemberCount = await countGlobalRankMatchedClanMembers(env, runKey, clanMembers);
    const allDone = shardsAfter.length > 0 && shardsAfter.every(shard => String(shard.status || "") === "ok");
    const anyFailed = shardsAfter.some(shard => String(shard.status || "") === "failed");

    if (anyFailed) {
      throw httpError(502, "One or more global rank shards failed.");
    }

    if (allDone) {
      await validateGlobalRankRunCompleteness(env, {
        clan,
        clanMembers,
        clanScanLimit,
        candidatePlayerCount,
        foundMemberCount,
        shardSummary
      });
      const publishCurrent = await shouldPublishGlobalRankCurrent(env, {
        runKey,
        clan,
        startedAt
      });
      const finalized = await finalizeGlobalRankRun(env, {
        runKey,
        clan,
        clanMembers,
        latest,
        eventName,
        fetchedAt,
        candidatePlayerCount,
        publishCurrent
      });
      foundMemberCount = finalized.foundMemberCount;

      const finishedAt = new Date().toISOString();
      const stopReason = shardSummary.stopReasons.includes("clan_leaderboard_exhausted")
        ? "clan_leaderboard_exhausted"
        : "max_clan_scan_limit";
      await upsertGlobalRankRun(env, {
        run_key: runKey,
        clan_name: clan,
        battle_key: latest?.battle_key || null,
        battle_display_name: battleDisplayName,
        event_name: eventName,
        started_at: startedAt,
        finished_at: finishedAt,
        status: "ok",
        scan_limit: clanScanLimit,
        page_size: pageSize,
        scanned_count: shardSummary.processedCount,
        scanned_clan_count: shardSummary.processedCount,
        next_clan_offset: shardSummary.nextOffset,
        candidate_player_count: candidatePlayerCount,
        clan_member_count: clanMembers.length,
        found_member_count: foundMemberCount,
        total_global_players: candidatePlayerCount,
        cutoff_points: null,
        stop_reason: stopReason,
        scan_kind: "clan_contribution_sharded",
        last_error: null,
        updated_at: finishedAt
      });

      return json({
        ok: true,
        source,
        clan_name: clan,
        battle_key: latest?.battle_key || null,
        battle_display_name: battleDisplayName,
        event_name: eventName,
        run_key: runKey,
        fetched_at: fetchedAt,
        status: "ok",
        stop_reason: stopReason,
        shard_count: shardCount,
        shard_concurrency: shardConcurrency,
        clans_per_shard_run: clansPerShardRun,
        clan_scan_limit: clanScanLimit,
        scanned_count: shardSummary.processedCount,
        scanned_clan_count: shardSummary.processedCount,
        processed_clans: processedClans,
        next_clan_offset: shardSummary.nextOffset,
        candidate_player_count: candidatePlayerCount,
        clan_member_count: clanMembers.length,
        total_global_players: candidatePlayerCount,
        published_current: publishCurrent,
        shards: shardSummary.rows
      }, 202);
    }

    const updatedAt = new Date().toISOString();
    await upsertGlobalRankRun(env, {
      run_key: runKey,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      started_at: startedAt,
      finished_at: null,
      status: "running",
      scan_limit: clanScanLimit,
      page_size: pageSize,
      scanned_count: shardSummary.processedCount,
      scanned_clan_count: shardSummary.processedCount,
      next_clan_offset: shardSummary.nextOffset,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      found_member_count: foundMemberCount,
      total_global_players: candidatePlayerCount,
      cutoff_points: null,
      stop_reason: null,
      scan_kind: "clan_contribution_sharded",
      last_error: null,
      updated_at: updatedAt
    });

    return json({
      ok: true,
      source,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      run_key: runKey,
      fetched_at: fetchedAt,
      status: "running",
      shard_count: shardCount,
      shard_concurrency: shardConcurrency,
      clans_per_shard_run: clansPerShardRun,
      clan_scan_limit: clanScanLimit,
      scanned_count: shardSummary.processedCount,
      scanned_clan_count: shardSummary.processedCount,
      processed_clans: processedClans,
      next_clan_offset: shardSummary.nextOffset,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      total_global_players: candidatePlayerCount,
      shards: shardSummary.rows
    }, 202);
  } catch (err) {
    const failedAt = new Date().toISOString();
    const shards = await fetchGlobalRankShards(env, runKey).catch(() => []);
    const shardSummary = summarizeGlobalRankShards(shards);
    const candidatePlayerCount = await countGlobalRankUniqueCandidates(env, runKey).catch(() => 0);
    await upsertGlobalRankRun(env, {
      run_key: runKey,
      clan_name: clan,
      battle_key: latest?.battle_key || null,
      battle_display_name: battleDisplayName,
      event_name: eventName,
      started_at: startedAt,
      finished_at: failedAt,
      status: "failed",
      scan_limit: clanScanLimit,
      page_size: pageSize,
      scanned_count: shardSummary.processedCount,
      scanned_clan_count: shardSummary.processedCount,
      next_clan_offset: shardSummary.nextOffset,
      candidate_player_count: candidatePlayerCount,
      clan_member_count: clanMembers.length,
      found_member_count: foundMemberCount,
      total_global_players: candidatePlayerCount,
      cutoff_points: null,
      stop_reason: "failed",
      scan_kind: "clan_contribution_sharded",
      last_error: err?.message || String(err),
      updated_at: failedAt
    });
    throw err;
  }
}

async function handleHistory(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const battle = url.searchParams.get("battle") || battleKey(env);
  const userId = url.searchParams.get("user_id");
  const hours = historyHours(url, env, 24);
  const limit = clamp(Number(url.searchParams.get("limit") || 5000), 1, 50000);
  const afterIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const params = {
    select: "snapshot_id,fetched_at,clan_name,battle_key,rank,user_id,username,total_points",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    fetched_at: `gte.${afterIso}`,
    order: "fetched_at.desc,rank.asc",
    limit: String(limit)
  };

  if (userId) {
    params.user_id = `eq.${userId}`;
  }

  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, params);

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    battle,
    hours,
    rows
  }, env);
}

async function handleBattles(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const rows = await supabaseSelect(env, BATTLE_RUNS_TABLE, {
    select: "clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,first_seen_at,last_seen_at,latest_snapshot_id,latest_snapshot_at,is_active",
    clan_name: `eq.${clan}`,
    order: "latest_snapshot_at.desc",
    limit: String(limit)
  });
  const rowsWithCoverage = await addBattleRowCounts(env, rows, SNAPSHOT_TABLE, row => ({
    clan_name: `eq.${row.clan_name}`,
    battle_key: `eq.${row.battle_key}`
  }));

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    rows: rowsWithCoverage.map(row => ({
      battle: row.battle_key,
      display_name: cleanBattleDisplayName(row.battle_key, row.battle_display_name),
      battle_start_iso: row.battle_started_at || null,
      battle_end_iso: row.battle_ended_at || null,
      first_snapshot: row.first_seen_at || null,
      last_snapshot: row.latest_snapshot_at || row.last_seen_at || null,
      latest_snapshot_id: row.latest_snapshot_id || null,
      row_count: row.row_count,
      has_rows: row.row_count > 0,
      is_active: row.is_active,
      source: "api"
    }))
  }, env);
}

async function handleClansIngest(env, source, force = false) {
  requireSupabase(env);

  const fetchedAt = new Date().toISOString();
  const trackedClan = clanName(env);
  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeGate = battleIngestGate({
    activeBattleMeta,
    battleMeta: activeBattleMeta,
    battleKey: activeBattleMeta?.battleKey || configuredBattleKey,
    env,
    force
  });

  if (!activeGate.allowed) {
    return skippedIngestResponse({
      scope: "clans",
      source,
      clan: trackedClan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey: activeBattleMeta?.battleKey || configuredBattleKey,
      battleMeta: activeBattleMeta,
      gate: activeGate
    });
  }

  const api = await fetchClanApi(trackedClan);
  const battles = api.data?.Battles || {};
  const resolvedBattleKey = resolveBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
  const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;
  const battleMeta = mergeBattleMeta(
    extractBattleMeta(battle || {}, resolvedBattleKey, env, {
      allowEnvDisplayName: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey),
      allowEnvTiming: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey)
    }),
    activeBattleMeta,
    resolvedBattleKey
  );
  const ingestGate = battleIngestGate({
    activeBattleMeta,
    battleMeta,
    battleKey: resolvedBattleKey,
    env,
    force
  });

  if (!ingestGate.allowed) {
    return skippedIngestResponse({
      scope: "clans",
      source,
      clan: trackedClan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey,
      battleMeta,
      gate: ingestGate
    });
  }

  const clans = await fetchTopClans(env);
  const snapshotId = `clans:${resolvedBattleKey}:${fetchedAt}`;

  const rows = clans.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    rank: row.rank,
    clan_name: row.clan_name,
    points: row.points,
    icon_id: row.icon_id,
    icon_url: row.icon_url,
    raw_clan: row.raw_clan
  }));

  if (rows.length) {
    await supabaseInsert(env, CLANS_SNAPSHOT_TABLE, rows);
    await replaceCurrentRows(env, CLANS_CURRENT_TABLE, {
      snapshot_id: "not.is.null"
    }, rows.map(row => ({
      ...row,
      updated_at: fetchedAt
    })));
  }

  await pruneOldTableRows(env, CLANS_SNAPSHOT_TABLE, fetchedAt);
  await upsertBattleRun(env, {
    clan_name: CLANS_BATTLE_RUN_CLAN_NAME,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    last_seen_at: fetchedAt,
    latest_snapshot_id: snapshotId,
    latest_snapshot_at: fetchedAt,
    is_active: !battleMeta.endedAt || new Date(battleMeta.endedAt).getTime() > Date.now(),
    updated_at: fetchedAt
  });

  const tracked = rows.find(row => normalizeText(row.clan_name) === normalizeText(trackedClan));

  return json({
    ok: true,
    tracked_clan: trackedClan,
    tracked_rank: tracked?.rank ?? null,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    rows_inserted: rows.length
  }, 202);
}

async function handleClansCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const requestedBattle = url.searchParams.get("battle") || "";
  const explicitBattle =
    requestedBattle &&
    !["current", "auto"].includes(String(requestedBattle).toLowerCase());
  const limit = String(Number(env.CLAN_RANK_TOP_N || 100));

  let latest = null;
  let rows = [];

  if (explicitBattle) {
    latest = await fetchLatestClanSnapshotMeta(env, requestedBattle);
    if (latest) {
      rows = await fetchClanSnapshotRows(env, latest.snapshot_id, limit);
    }
  } else {
    rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, {
      select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,clan_name,points,icon_id,icon_url",
      order: "rank.asc",
      limit
    });
    latest = latestClanMetaFromRows(rows);
  }

  const activeBattleMeta = latest && !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  const latestWithActiveMeta = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: !explicitBattle });
  const rowsWithGains = latestWithActiveMeta ? await addClanGainFields(env, rows, latestWithActiveMeta) : rows;
  const rowsWithProjections = latestWithActiveMeta ? addClanProjectionFields(rowsWithGains, latestWithActiveMeta) : rowsWithGains;
  const trackedClan = clanName(env);
  const tracked = rowsWithProjections.find(row => normalizeText(row.clan_name) === normalizeText(trackedClan));

  return cacheJson({
    generated_at: new Date().toISOString(),
    snapshot_at: latestWithActiveMeta?.fetched_at || null,
    battle: latestWithActiveMeta?.battle_key || null,
    display_name: latestWithActiveMeta
      ? cleanBattleDisplayName(latestWithActiveMeta.battle_key, latestWithActiveMeta.battle_display_name)
      : null,
    battle_start_iso: latestWithActiveMeta?.battle_started_at || null,
    battle_end_iso: latestWithActiveMeta?.battle_ended_at || null,
    clan_name: trackedClan,
    clan_rank: tracked?.rank ?? null,
    clan_points: tracked?.points ?? null,
    projected_rank: tracked?.projected_rank ?? null,
    projected_points: tracked?.projected_points ?? null,
    projection_basis: tracked?.projection_basis ?? null,
    rows: rowsWithProjections.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      clan_name: row.clan_name,
      points: toNumber(row.points) || 0,
      icon_id: row.icon_id || null,
      icon_url: row.icon_url || null,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h,
      rate_per_hour: row.rate_per_hour,
      projected_points: row.projected_points,
      projected_rank: row.projected_rank,
      projection_basis: row.projection_basis
    }))
  }, env);
}

async function handleClansHistory(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const battle = url.searchParams.get("battle") || battleKey(env);
  const clan = url.searchParams.get("clan") || "";
  const hours = historyHours(url, env, 24);
  const limit = clamp(Number(url.searchParams.get("limit") || 5000), 1, 50000);
  const rankMinParam = boundedIntegerParam(url, "rank_min", 1, 500);
  const rankMaxParam = boundedIntegerParam(url, "rank_max", 1, 500);
  const afterIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const params = {
    select: "snapshot_id,fetched_at,battle_key,rank,clan_name,points,icon_id,icon_url",
    battle_key: `eq.${battle}`,
    fetched_at: `gte.${afterIso}`,
    order: "fetched_at.desc,rank.asc",
    limit: String(limit)
  };

  if (clan) {
    params.clan_name = `eq.${clan}`;
  }

  if (rankMinParam !== null || rankMaxParam !== null) {
    const rankMin = rankMinParam ?? 1;
    const rankMax = rankMaxParam ?? 500;
    params.rank = [
      `gte.${Math.min(rankMin, rankMax)}`,
      `lte.${Math.max(rankMin, rankMax)}`
    ];
  }

  const rows = (clan || params.rank)
    ? await supabaseSelectPaged(env, CLANS_SNAPSHOT_TABLE, params, limit)
    : await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, params);

  return cacheJson({
    generated_at: new Date().toISOString(),
    battle,
    clan_name: clan || null,
    hours,
    rank_min: rankMinParam,
    rank_max: rankMaxParam,
    rows
  }, env);
}

async function handleClansBattles(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const scanLimit = clamp(
    Number(url.searchParams.get("scan_limit") || env.CLAN_BATTLES_SCAN_LIMIT || 20000),
    1000,
    500000
  );

  const battleRuns = await supabaseSelect(env, BATTLE_RUNS_TABLE, {
    select: "battle_key,battle_display_name,battle_started_at,battle_ended_at,first_seen_at,last_seen_at,latest_snapshot_id,latest_snapshot_at,is_active",
    clan_name: `eq.${CLANS_BATTLE_RUN_CLAN_NAME}`,
    order: "latest_snapshot_at.desc",
    limit: String(limit)
  });

  const byBattle = new Map();

  for (const row of battleRuns) {
    const key = String(row.battle_key || "").trim();
    if (!key) continue;

    byBattle.set(key, {
      battle: key,
      display_name: cleanBattleDisplayName(key, row.battle_display_name),
      battle_start_iso: row.battle_started_at || null,
      battle_end_iso: row.battle_ended_at || null,
      first_snapshot: row.first_seen_at || null,
      last_snapshot: row.latest_snapshot_at || row.last_seen_at || null,
      latest_snapshot_id: row.latest_snapshot_id || null,
      snapshot_count: 0,
      is_active: row.is_active,
      source: "api"
    });
  }

  const rows = await fetchClansBattleListRows(env, scanLimit);

  for (const row of rows) {
    addClansBattleSummary(byBattle, row);
  }

  const summaries = [...byBattle.values()].sort((a, b) =>
    new Date(b.last_snapshot || 0) - new Date(a.last_snapshot || 0)
  );
  const rowsWithCoverage = await addBattleRowCounts(env, summaries, CLANS_SNAPSHOT_TABLE, row => ({
    battle_key: `eq.${row.battle}`
  }));

  return cacheJson({
    generated_at: new Date().toISOString(),
    rows: rowsWithCoverage.slice(0, limit)
  }, env);
}

async function handleTopClanThresholds(request, env) {
  const url = new URL(request.url);
  const top = clamp(Math.round(parseThresholdNumber(url.searchParams.get("top")) || 10), 1, 25);
  const highThreshold = parseThresholdNumber(
    firstDefined(url.searchParams.get("high"), url.searchParams.get("highThreshold"), "72.5M")
  );
  const lowThreshold = parseThresholdNumber(
    firstDefined(url.searchParams.get("low"), url.searchParams.get("lowThreshold"), "70M")
  );

  if (!Number.isFinite(highThreshold) || highThreshold <= 0) {
    throw httpError(400, "High threshold is invalid.");
  }

  if (!Number.isFinite(lowThreshold) || lowThreshold <= 0) {
    throw httpError(400, "Low threshold is invalid.");
  }

  if (lowThreshold >= highThreshold) {
    throw httpError(400, "Low threshold must be lower than high threshold.");
  }

  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const topClans = await fetchTopClans(env, top);
  const generatedAt = new Date().toISOString();
  const rows = [];
  let selectedBattleKey = activeBattleMeta?.battleKey || configuredBattleKey;
  let selectedBattleDisplayName = activeBattleMeta?.displayName || prettifyBattleKey(selectedBattleKey) || selectedBattleKey;

  for (const clan of topClans) {
    try {
      const api = await fetchClanApi(clan.clan_name);
      const data = api.data || {};
      const battles = data.Battles || data.battles || {};
      const resolvedBattleKey = resolveBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
      const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;

      if (!battle) {
        rows.push(topClanThresholdErrorRow(clan, "No matching battle data found."));
        continue;
      }

      const battleMeta = mergeBattleMeta(
        extractBattleMeta(battle, resolvedBattleKey, env, {
          allowEnvDisplayName: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey),
          allowEnvTiming: shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey)
        }),
        activeBattleMeta,
        resolvedBattleKey
      );
      const members = normalizeMembers(data, battle);
      const counts = countThresholdMembers(members, highThreshold, lowThreshold);

      selectedBattleKey = resolvedBattleKey || selectedBattleKey;
      selectedBattleDisplayName = battleMeta.displayName || selectedBattleDisplayName;

      rows.push({
        rank: clan.rank,
        clan_name: clan.clan_name,
        icon_id: clan.icon_id || null,
        icon_url: clan.icon_url || null,
        clan_points: clan.points,
        battle_points: counts.total_points,
        battle_key: resolvedBattleKey,
        battle_display_name: battleMeta.displayName,
        high_count: counts.high_count,
        low_count: counts.low_count,
        below_low_count: counts.below_low_count,
        member_count: counts.member_count,
        error: null
      });
    } catch (err) {
      rows.push(topClanThresholdErrorRow(clan, err?.message || String(err)));
    }
  }

  return cacheJson({
    ok: true,
    generated_at: generatedAt,
    top,
    highThreshold,
    lowThreshold,
    battle: selectedBattleKey,
    display_name: cleanBattleDisplayName(selectedBattleKey, selectedBattleDisplayName),
    activeBattle: {
      configName: cleanBattleDisplayName(selectedBattleKey, selectedBattleDisplayName),
      battleKey: selectedBattleKey
    },
    rows
  }, env);
}

function topClanThresholdErrorRow(clan, error) {
  return {
    rank: clan.rank,
    clan_name: clan.clan_name,
    icon_id: clan.icon_id || null,
    icon_url: clan.icon_url || null,
    clan_points: clan.points,
    battle_points: null,
    battle_key: null,
    battle_display_name: null,
    high_count: 0,
    low_count: 0,
    below_low_count: 0,
    member_count: 0,
    error
  };
}

function countThresholdMembers(members, highThreshold, lowThreshold) {
  const counts = {
    high_count: 0,
    low_count: 0,
    below_low_count: 0,
    member_count: members.length,
    total_points: 0
  };

  for (const member of members) {
    const points = toNumber(member.total_points) || 0;
    counts.total_points += points;

    if (points >= highThreshold) {
      counts.high_count += 1;
    } else if (points >= lowThreshold) {
      counts.low_count += 1;
    } else {
      counts.below_low_count += 1;
    }
  }

  return counts;
}

async function addBattleRowCounts(env, rows, tableName, filtersForRow) {
  const output = [];

  for (const row of rows) {
    let rowCount = Number(row.row_count);

    if (!Number.isFinite(rowCount)) {
      rowCount = await supabaseCount(env, tableName, filtersForRow(row)).catch(() => 0);
    }

    output.push({
      ...row,
      row_count: rowCount,
      has_rows: rowCount > 0
    });
  }

  return output;
}

async function fetchClansBattleListRows(env, scanLimit) {
  const pageSize = 1000;
  const rows = [];

  for (let offset = 0; offset < scanLimit; offset += pageSize) {
    const page = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, {
      select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at",
      order: "fetched_at.desc",
      limit: String(Math.min(pageSize, scanLimit - offset)),
      offset: String(offset)
    });

    rows.push(...page);

    if (page.length < pageSize) break;
  }

  return rows;
}

function addClansBattleSummary(byBattle, row) {
    const key = String(row.battle_key || "").trim();
    if (!key) return;

    const existing = byBattle.get(key);
    const fetchedMs = new Date(row.fetched_at || 0).getTime();

    if (!existing) {
      byBattle.set(key, {
        battle: key,
        display_name: cleanBattleDisplayName(key, row.battle_display_name),
        battle_start_iso: row.battle_started_at || null,
        battle_end_iso: row.battle_ended_at || null,
        first_snapshot: row.fetched_at || null,
        last_snapshot: row.fetched_at || null,
        latest_snapshot_id: row.snapshot_id || null,
        snapshot_count: 1,
        source: "api"
      });
      return;
    }

    existing.snapshot_count += 1;

    const firstMs = new Date(existing.first_snapshot || 0).getTime();
    const lastMs = new Date(existing.last_snapshot || 0).getTime();

    if (Number.isFinite(fetchedMs) && (!Number.isFinite(firstMs) || fetchedMs < firstMs)) {
      existing.first_snapshot = row.fetched_at || existing.first_snapshot;
    }

    if (Number.isFinite(fetchedMs) && (!Number.isFinite(lastMs) || fetchedMs > lastMs)) {
      existing.last_snapshot = row.fetched_at || existing.last_snapshot;
      existing.latest_snapshot_id = row.snapshot_id || existing.latest_snapshot_id;
      existing.display_name = cleanBattleDisplayName(key, row.battle_display_name) || existing.display_name;
      existing.battle_start_iso = row.battle_started_at || existing.battle_start_iso;
      existing.battle_end_iso = row.battle_ended_at || existing.battle_end_iso;
    }
}

async function fetchClanApi(clan) {
  const urls = [
    `https://biggamesapi.io/api/clan/${encodeURIComponent(clan)}`,
    `https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(clan)}`
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        }
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      }

      const json = JSON.parse(text);
      if (json.status && json.status !== "ok") {
        throw new Error(`API status ${json.status}`);
      }

      return json;
    } catch (err) {
      lastError = err;
    }
  }

  throw httpError(502, `Big Games clan API failed: ${lastError?.message || "unknown error"}`);
}

async function fetchActiveClanBattleMeta(env) {
  if (String(env.ACTIVE_BATTLE_LOOKUP || "true").toLowerCase() === "false") {
    return null;
  }

  const urls = [
    "https://ps99.biggamesapi.io/api/activeClanBattle",
    "https://biggamesapi.io/api/activeClanBattle"
  ];
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      }

      const json = JSON.parse(text);
      if (json.status && json.status !== "ok") {
        throw new Error(`API status ${json.status}`);
      }

      const data = json.data || json;
      const configData = data.configData || data.ConfigData || {};
      const merged = { ...data, ...configData, configData };
      const activeKey = String(firstDefined(
        data.configName,
        data.ConfigName,
        data.battleName,
        data.BattleName,
        data.name,
        data.Name,
        data.title,
        data.Title,
        configData.configName,
        configData.ConfigName,
        configData.BattleName,
        configData.battleName,
        configData.DisplayName,
        configData.displayName,
        configData.Title,
        configData.title,
        configData._id,
        data._id
      ) || "").trim();
      const meta = extractBattleMeta(merged, activeKey || battleKey(env), env, {
        allowEnvDisplayName: false,
        allowEnvTiming: false
      });

      return {
        battleKey: activeKey || meta.displayName || null,
        displayName: meta.displayName,
        startedAt: meta.startedAt,
        endedAt: meta.endedAt,
        raw: data
      };
    } catch (err) {
      lastError = err;
    }
  }

  if (String(env.REQUIRE_ACTIVE_BATTLE_LOOKUP || "").toLowerCase() === "true") {
    throw httpError(502, `Active clan battle API failed: ${lastError?.message || "unknown error"}`);
  }

  return null;
}

async function fetchTopClans(env, requestedTopN = null) {
  const topN = clamp(Number(requestedTopN || env.CLAN_RANK_TOP_N || 100), 1, 500);
  const maxPages = Math.ceil(topN / CLANS_PAGE_SIZE) + 2;
  const hosts = [
    "https://biggamesapi.io/api/clans",
    "https://ps99.biggamesapi.io/api/clans"
  ];
  let lastError = null;

  for (const host of hosts) {
    const collected = [];

    try {
      for (let page = 1; page <= maxPages; page += 1) {
        const url = new URL(host);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(CLANS_PAGE_SIZE));
        url.searchParams.set("sort", "Points");
        url.searchParams.set("sortOrder", "desc");

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "c0ld-Clans-API-Worker"
          }
        });

        const text = await res.text();
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
        }

        const json = JSON.parse(text);
        const arrays = extractClanArrays(json);
        const pageRows = arrays[0] || [];

        if (!pageRows.length) break;

        const normalized = pageRows
          .map((clan, index) => normalizeClanRankRow(clan, (page - 1) * CLANS_PAGE_SIZE + index + 1))
          .filter(row => row.clan_name && Number.isFinite(row.points));

        collected.push(...normalized);

        if (collected.length >= topN || pageRows.length < CLANS_PAGE_SIZE) break;
      }

      const deduped = dedupeClanRows(collected)
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          if (b.points !== a.points) return b.points - a.points;
          return a.clan_name.localeCompare(b.clan_name);
        })
        .slice(0, topN)
        .map((row, index) => ({
          ...row,
          rank: index + 1
        }));

      if (deduped.length) return deduped;
    } catch (err) {
      lastError = err;
    }
  }

  throw httpError(502, `Big Games clans API failed: ${lastError?.message || "unknown error"}`);
}

async function fetchClanLeaderboardPage(env, { page, pageSize, cache = null }) {
  const safePage = Math.max(1, Math.round(Number(page) || 1));
  const safePageSize = globalRankClanPageSize({ GLOBAL_RANK_CLAN_PAGE_SIZE: pageSize });
  const cacheKey = `${safePage}:${safePageSize}`;

  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const request = fetchClanLeaderboardPageUncached(env, {
    page: safePage,
    pageSize: safePageSize
  });

  if (cache) cache.set(cacheKey, request);

  try {
    return await request;
  } catch (err) {
    if (cache?.get(cacheKey) === request) cache.delete(cacheKey);
    throw err;
  }
}

async function fetchClanLeaderboardPageUncached(env, { page: safePage, pageSize: safePageSize }) {
  const hosts = [
    "https://biggamesapi.io/api/clans",
    "https://ps99.biggamesapi.io/api/clans"
  ];
  let lastError = null;

  for (const host of hosts) {
    try {
      const url = new URL(host);
      url.searchParams.set("page", String(safePage));
      url.searchParams.set("pageSize", String(safePageSize));
      url.searchParams.set("sort", "Points");
      url.searchParams.set("sortOrder", "desc");

      const payload = await fetchJsonWithRetry(url, `clans page ${safePage}`, {
        attempts: globalRankRetryAttempts(env),
        baseDelayMs: globalRankRetryBaseMs(env)
      });
      const arrays = extractClanArrays(payload);
      const rows = arrays[0] || [];

      return rows
        .map((clan, index) => normalizeClanRankRow(clan, (safePage - 1) * safePageSize + index + 1))
        .filter(row => row.clan_name && Number.isFinite(row.points))
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          if (b.points !== a.points) return b.points - a.points;
          return a.clan_name.localeCompare(b.clan_name);
        });
    } catch (err) {
      lastError = err;
    }
  }

  throw httpError(502, `Big Games clans page ${safePage} failed: ${lastError?.message || "unknown error"}`);
}

async function fetchClanRankRowAtOffset(env, offset, pageSize) {
  if (offset < 0) return null;

  const page = Math.floor(offset / pageSize) + 1;
  const pageIndex = offset % pageSize;
  const rows = await fetchClanLeaderboardPage(env, { page, pageSize });
  return rows[pageIndex] || null;
}

async function fetchClanApiWithRetry(env, clan) {
  let lastError = null;

  for (let attempt = 1; attempt <= globalRankRetryAttempts(env); attempt += 1) {
    try {
      return await fetchClanApi(clan);
    } catch (err) {
      lastError = err;
      if (attempt >= globalRankRetryAttempts(env)) break;

      const delay = Math.min(120000, attempt * attempt * globalRankRetryBaseMs(env));
      await sleep(delay);
    }
  }

  throw lastError || httpError(502, `Big Games clan API failed for ${clan}`);
}

async function collectGlobalRankCandidatesForClan(env, {
  runKey,
  clanRow,
  configuredBattleKey,
  activeBattleKey,
  fetchedAt
}) {
  const api = await fetchClanApiWithRetry(env, clanRow.clan_name);
  const data = api.data || {};
  const battles = data.Battles || data.battles || {};
  const resolvedBattleKey = resolveBattleKey(battles, configuredBattleKey, env, activeBattleKey);
  const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;

  if (!battle) {
    return [];
  }

  const battleMeta = extractBattleMeta(battle, resolvedBattleKey, env, {
    allowEnvDisplayName: false,
    allowEnvTiming: false
  });
  const rows = normalizeMembers(data, battle);
  const byUser = new Map();

  for (const row of rows) {
    const userId = toNumber(row.user_id);
    const points = toNumber(row.total_points);
    if (!userId || points === null || points < 0) continue;

    const existing = byUser.get(userId);
    if (existing && existing.points >= points) continue;

    byUser.set(userId, {
      run_key: runKey,
      user_id: userId,
      points,
      source_clan: clanRow.clan_name,
      source_clan_rank: toNumber(clanRow.rank),
      source_clan_points: toNumber(clanRow.points) || 0,
      battle_key: resolvedBattleKey || null,
      battle_display_name: cleanBattleDisplayName(resolvedBattleKey, battleMeta.displayName),
      fetched_at: fetchedAt,
      raw_candidate: {
        clan: clanRow.raw_clan || {},
        member: row.raw_member || {},
        contribution: row.raw_contribution || {}
      },
      updated_at: new Date().toISOString()
    });
  }

  return [...byUser.values()];
}

async function upsertGlobalRankCandidateRows(env, rows) {
  for (const batch of chunkValues(rows || [], 500)) {
    await supabaseUpsert(
      env,
      GLOBAL_RANK_CANDIDATES_TABLE,
      batch,
      "run_key,source_clan,user_id"
    );
  }
}

async function ensureGlobalRankShards(env, {
  runKey,
  shardCount,
  clanScanLimit,
  startedAt
}) {
  const existing = await fetchGlobalRankShards(env, runKey);
  if (existing.length) return existing;

  const rows = buildGlobalRankShardRows({
    runKey,
    shardCount,
    clanScanLimit,
    startedAt
  });

  if (rows.length) {
    await supabaseUpsert(env, GLOBAL_RANK_SHARDS_TABLE, rows, "run_key,shard_index");
  }

  return rows;
}

function buildGlobalRankShardRows({
  runKey,
  shardCount,
  clanScanLimit,
  startedAt
}) {
  const safeShardCount = Math.max(1, Math.min(shardCount, clanScanLimit));
  const shardSize = Math.ceil(clanScanLimit / safeShardCount);
  const rows = [];

  for (let shardIndex = 0; shardIndex < safeShardCount; shardIndex += 1) {
    const startOffset = shardIndex * shardSize;
    const endOffset = Math.min(clanScanLimit, startOffset + shardSize);
    if (startOffset >= endOffset) continue;

    rows.push({
      run_key: runKey,
      shard_index: shardIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      next_offset: startOffset,
      processed_count: 0,
      status: "running",
      started_at: startedAt,
      finished_at: null,
      stop_reason: null,
      last_error: null,
      updated_at: startedAt
    });
  }

  return rows;
}

function globalRankRunMatchesRuntimeConfig({ run, shards, clanScanLimit, pageSize, shardCount }) {
  if (!run?.run_key) return false;
  if ((toNumber(run.scan_limit) || clanScanLimit) !== clanScanLimit) return false;
  if ((toNumber(run.page_size) || pageSize) !== pageSize) return false;

  const expected = buildGlobalRankShardRows({
    runKey: run.run_key,
    shardCount,
    clanScanLimit,
    startedAt: run.started_at || new Date(0).toISOString()
  });
  const actual = (shards || []).slice().sort((a, b) => (
    (toNumber(a.shard_index) || 0) - (toNumber(b.shard_index) || 0)
  ));

  if (actual.length !== expected.length) return false;

  return expected.every((row, index) => {
    const shard = actual[index];
    return (
      toNumber(shard.shard_index) === row.shard_index &&
      toNumber(shard.start_offset) === row.start_offset &&
      toNumber(shard.end_offset) === row.end_offset
    );
  });
}

async function fetchGlobalRankShards(env, runKey) {
  return supabaseSelect(env, GLOBAL_RANK_SHARDS_TABLE, {
    select: "*",
    run_key: `eq.${runKey}`,
    order: "shard_index.asc"
  });
}

async function upsertGlobalRankShard(env, row) {
  await supabaseUpsert(env, GLOBAL_RANK_SHARDS_TABLE, [row], "run_key,shard_index");
}

function summarizeGlobalRankShards(shards) {
  const rows = (shards || [])
    .map(shard => {
      const startOffset = toNumber(shard.start_offset) || 0;
      const endOffset = toNumber(shard.end_offset) || startOffset;
      const nextOffset = clamp(toNumber(shard.next_offset) || startOffset, startOffset, endOffset);
      const processedCount = toNumber(shard.processed_count) || Math.max(0, nextOffset - startOffset);
      const startedAt = shard.started_at || null;
      const updatedAt = shard.updated_at || null;
      const finishedAt = shard.finished_at || null;
      const startedMs = isoToMs(startedAt);
      const updatedMs = isoToMs(updatedAt);
      const finishedMs = isoToMs(finishedAt);
      const effectiveEndMs = finishedMs || updatedMs;
      const activeSeconds = startedMs && effectiveEndMs
        ? Math.max(0, (effectiveEndMs - startedMs) / 1000)
        : null;
      const clansPerMinute = activeSeconds && activeSeconds > 0
        ? processedCount / (activeSeconds / 60)
        : null;

      return {
        shard_index: toNumber(shard.shard_index) || 0,
        start_offset: startOffset,
        end_offset: endOffset,
        next_offset: nextOffset,
        processed_count: processedCount,
        status: shard.status || "running",
        stop_reason: shard.stop_reason || null,
        started_at: startedAt,
        updated_at: updatedAt,
        finished_at: finishedAt,
        active_elapsed_seconds: activeSeconds === null ? null : Math.round(activeSeconds),
        clans_per_minute: clansPerMinute === null ? null : roundMetric(clansPerMinute, 2)
      };
    })
    .sort((a, b) => a.shard_index - b.shard_index);

  const processedCount = rows.reduce((total, row) => total + row.processed_count, 0);
  const runningRows = rows.filter(row => row.status === "running");
  const nextOffset = runningRows.length
    ? Math.min(...runningRows.map(row => row.next_offset))
    : rows.reduce((max, row) => Math.max(max, row.next_offset), 0);
  const stopReasons = [...new Set(rows.map(row => row.stop_reason).filter(Boolean))];

  return {
    rows,
    processedCount,
    nextOffset,
    stopReasons
  };
}

function summarizeGlobalRankTiming(run, shardSummary) {
  const now = new Date();
  const nowMs = now.getTime();
  const startedAt = run?.started_at || null;
  const updatedAt = run?.updated_at || null;
  const finishedAt = run?.finished_at || null;
  const startedMs = isoToMs(startedAt);
  const updatedMs = isoToMs(updatedAt);
  const finishedMs = isoToMs(finishedAt);
  const totalClans = toNumber(run?.scan_limit) ||
    (shardSummary?.rows || []).reduce((total, shard) => {
      return total + Math.max(0, (toNumber(shard.end_offset) || 0) - (toNumber(shard.start_offset) || 0));
    }, 0);
  const processedClans = toNumber(shardSummary?.processedCount) ||
    toNumber(run?.scanned_clan_count) ||
    toNumber(run?.scanned_count) ||
    0;
  const remainingClans = Math.max(0, totalClans - processedClans);
  const activeEndMs = finishedMs || updatedMs || nowMs;
  const activeElapsedSeconds = startedMs
    ? Math.max(0, (activeEndMs - startedMs) / 1000)
    : null;
  const wallElapsedSeconds = startedMs
    ? Math.max(0, (nowMs - startedMs) / 1000)
    : null;
  const durationSeconds = startedMs && finishedMs
    ? Math.max(0, (finishedMs - startedMs) / 1000)
    : null;
  const activeClansPerMinute = activeElapsedSeconds && activeElapsedSeconds > 0
    ? processedClans / (activeElapsedSeconds / 60)
    : null;
  const wallClansPerMinute = wallElapsedSeconds && wallElapsedSeconds > 0
    ? processedClans / (wallElapsedSeconds / 60)
    : null;
  const estimatedRemainingSeconds = activeClansPerMinute && activeClansPerMinute > 0
    ? remainingClans / (activeClansPerMinute / 60)
    : null;
  const estimatedFinishAt = estimatedRemainingSeconds === null
    ? null
    : new Date(nowMs + estimatedRemainingSeconds * 1000).toISOString();

  return {
    started_at: startedAt,
    updated_at: updatedAt,
    finished_at: finishedAt,
    now: now.toISOString(),
    status: run?.status || null,
    total_clans: totalClans,
    processed_clans: processedClans,
    remaining_clans: remainingClans,
    percent_complete: totalClans > 0 ? roundMetric((processedClans / totalClans) * 100, 2) : null,
    active_elapsed_seconds: activeElapsedSeconds === null ? null : Math.round(activeElapsedSeconds),
    wall_elapsed_seconds: wallElapsedSeconds === null ? null : Math.round(wallElapsedSeconds),
    duration_seconds: durationSeconds === null ? null : Math.round(durationSeconds),
    active_clans_per_minute: activeClansPerMinute === null ? null : roundMetric(activeClansPerMinute, 2),
    wall_clans_per_minute: wallClansPerMinute === null ? null : roundMetric(wallClansPerMinute, 2),
    estimated_remaining_seconds: estimatedRemainingSeconds === null ? null : Math.round(estimatedRemainingSeconds),
    estimated_finish_at: estimatedFinishAt
  };
}

function roundMetric(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function processGlobalRankShard(env, {
  runKey,
  shard,
  pageSize,
  clansPerShardRun,
  configuredBattleKey,
  activeBattleKey,
  fetchedAt,
  leaderboardPageCache = null
}) {
  const shardIndex = toNumber(shard.shard_index) || 0;
  const startOffset = toNumber(shard.start_offset) || 0;
  const endOffset = toNumber(shard.end_offset) || startOffset;
  let nextOffset = clamp(toNumber(shard.next_offset) || startOffset, startOffset, endOffset);
  let committedNextOffset = nextOffset;
  let processedClans = 0;
  let stopReason = null;
  const startedAt = shard.started_at || fetchedAt;
  const candidateClanBatchSize = globalRankCandidateClanBatchSize(env);
  let pendingCandidateRows = [];
  let pendingClanCount = 0;

  const flushPendingCandidates = async () => {
    if (pendingCandidateRows.length) {
      await upsertGlobalRankCandidateRows(env, pendingCandidateRows);
    }
    committedNextOffset = nextOffset;
    pendingCandidateRows = [];
    pendingClanCount = 0;
  };

  try {
    while (processedClans < clansPerShardRun && nextOffset < endOffset) {
      const pageNumber = Math.floor(nextOffset / pageSize) + 1;
      const pageIndex = nextOffset % pageSize;
      const pageRows = await fetchClanLeaderboardPage(env, {
        page: pageNumber,
        pageSize,
        cache: leaderboardPageCache
      });

      if (!pageRows.length || pageIndex >= pageRows.length) {
        stopReason = "clan_leaderboard_exhausted";
        break;
      }

      for (let index = pageIndex; index < pageRows.length && processedClans < clansPerShardRun; index += 1) {
        if (nextOffset >= endOffset) break;

        const clanRow = pageRows[index];
        const candidateRows = await collectGlobalRankCandidatesForClan(env, {
          runKey,
          clanRow,
          configuredBattleKey,
          activeBattleKey,
          fetchedAt
        });

        pendingCandidateRows.push(...candidateRows);

        processedClans += 1;
        pendingClanCount += 1;
        nextOffset += 1;

        if (pendingClanCount >= candidateClanBatchSize) {
          await flushPendingCandidates();
        }

        const delayMs = globalRankClanDelayMs(env);
        if (delayMs > 0 && processedClans < clansPerShardRun && nextOffset < endOffset) {
          await sleep(delayMs);
        }
      }
    }

    if (pendingClanCount) {
      await flushPendingCandidates();
    }

    if (!stopReason && nextOffset >= endOffset) {
      stopReason = "shard_complete";
    }

    const finished = Boolean(stopReason);
    const updatedAt = new Date().toISOString();
    const processedCount = Math.max(0, nextOffset - startOffset);
    await upsertGlobalRankShard(env, {
      run_key: runKey,
      shard_index: shardIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      next_offset: nextOffset,
      processed_count: processedCount,
      status: finished ? "ok" : "running",
      started_at: startedAt,
      finished_at: finished ? updatedAt : null,
      stop_reason: stopReason,
      last_error: null,
      updated_at: updatedAt
    });

    return {
      shard_index: shardIndex,
      processed_clans: processedClans,
      next_offset: nextOffset,
      status: finished ? "ok" : "running",
      stop_reason: stopReason
    };
  } catch (err) {
    const failedAt = new Date().toISOString();
    await upsertGlobalRankShard(env, {
      run_key: runKey,
      shard_index: shardIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      next_offset: committedNextOffset,
      processed_count: Math.max(0, committedNextOffset - startOffset),
      status: "failed",
      started_at: startedAt,
      finished_at: failedAt,
      stop_reason: "failed",
      last_error: err?.message || String(err),
      updated_at: failedAt
    });

    throw err;
  }
}

async function hasRunningGlobalRankRun(env, clan) {
  return Boolean(
    await findRunningGlobalRankRun(env, clan).catch(() => null) ||
    await findResumableGlobalRankRun(env, clan).catch(() => null)
  );
}

async function findRunningGlobalRankRun(env, clan, battleKeyValue) {
  const params = {
    select: "*",
    clan_name: `eq.${clan}`,
    status: "eq.running",
    order: "started_at.desc",
    limit: "1"
  };

  if (battleKeyValue) {
    params.battle_key = `eq.${battleKeyValue}`;
  }

  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, params);
  return rows[0] || null;
}

async function findResumableGlobalRankRun(env, clan, battleKeyValue) {
  const params = {
    select: "*",
    clan_name: `eq.${clan}`,
    scan_kind: "eq.clan_contribution_sharded",
    order: "started_at.desc",
    limit: "8"
  };

  if (battleKeyValue) {
    params.battle_key = `eq.${battleKeyValue}`;
  }

  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, params);

  for (const row of rows) {
    const status = String(row.status || "").toLowerCase();
    if (status === "failed" || status === "superseded") continue;

    if (status === "running") {
      return row;
    }

    if (await isResumableGlobalRankRun(env, row).catch(() => false)) {
      return row;
    }
  }

  return null;
}

async function findGlobalRankRunByKey(env, runKey) {
  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "*",
    run_key: `eq.${runKey}`,
    limit: "1"
  });

  return rows[0] || null;
}

async function findLatestGlobalRankRun(env, clan, battleKeyValue) {
  const params = {
    select: "*",
    clan_name: `eq.${clan}`,
    order: "started_at.desc",
    limit: "1"
  };

  if (battleKeyValue) {
    params.battle_key = `eq.${battleKeyValue}`;
  }

  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, params);
  return rows[0] || null;
}

async function isResumableGlobalRankRun(env, run, knownShards = null) {
  if (!run?.run_key) return false;

  const status = String(run.status || "").toLowerCase();
  if (status === "failed" || status === "superseded") return false;

  const shards = knownShards || await fetchGlobalRankShards(env, run.run_key);
  if (!shards.length) return false;

  for (const shard of shards) {
    const shardStatus = String(shard.status || "running").toLowerCase();
    const startOffset = toNumber(shard.start_offset) || 0;
    const endOffset = toNumber(shard.end_offset) || startOffset;
    const nextOffset = clamp(toNumber(shard.next_offset) || startOffset, startOffset, endOffset);
    const stopReason = String(shard.stop_reason || "").toLowerCase();

    if (shardStatus === "failed") return false;
    if (shardStatus === "running") return true;
    if (nextOffset < endOffset && stopReason !== "clan_leaderboard_exhausted") return true;
  }

  return false;
}

async function countGlobalRankCandidates(env, runKey) {
  return supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    run_key: `eq.${runKey}`
  });
}

async function countGlobalRankUniqueCandidates(env, runKey) {
  const rows = await supabaseSelectPaged(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    select: "user_id",
    run_key: `eq.${runKey}`,
    order: "user_id.asc"
  }, globalRankCandidateReadLimit(env));

  return new Set(rows.map(row => String(row.user_id || "").trim()).filter(Boolean)).size;
}

async function countGlobalRankMatchedClanMembers(env, runKey, clanMembers) {
  const memberIds = [...new Set((clanMembers || [])
    .map(row => toNumber(row.user_id))
    .filter(Boolean))];

  if (!memberIds.length) return 0;

  const rows = await supabaseSelectPaged(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    select: "user_id",
    run_key: `eq.${runKey}`,
    user_id: `in.(${memberIds.join(",")})`,
    order: "user_id.asc"
  }, memberIds.length * 10);

  return new Set(rows.map(row => String(row.user_id || "").trim()).filter(Boolean)).size;
}

async function readGlobalRankRankedCandidates(env, runKey) {
  const readLimit = globalRankCandidateReadLimit(env);
  const rows = await supabaseSelectPaged(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    select: "user_id,points,source_clan,source_clan_rank,source_clan_points,battle_key,battle_display_name,raw_candidate",
    run_key: `eq.${runKey}`,
    order: "points.desc,user_id.asc"
  }, readLimit);

  return dedupeGlobalCandidateRows(rows)
    .sort(sortGlobalCandidateRows)
    .map((row, index) => ({
      ...row,
      global_rank: index + 1
    }));
}

async function validateGlobalRankRunCompleteness(env, {
  clan,
  clanMembers,
  clanScanLimit,
  candidatePlayerCount,
  foundMemberCount,
  shardSummary
}) {
  const processedCount = toNumber(shardSummary?.processedCount) || 0;
  const exhausted = (shardSummary?.stopReasons || []).includes("clan_leaderboard_exhausted");

  if (!exhausted && processedCount < clanScanLimit) {
    throw httpError(502, `Global rank scan covered only ${processedCount} of ${clanScanLimit} ranked clans.`);
  }

  if (!(candidatePlayerCount > 0)) {
    throw httpError(502, "Global rank scan produced no candidate players.");
  }

  const previousRun = await findLatestGlobalRankSearchRun(env, clan).catch(() => null);
  const previousCandidateCount =
    toNumber(previousRun?.total_global_players) ||
    toNumber(previousRun?.candidate_player_count) ||
    0;
  const previousScanLimit = toNumber(previousRun?.scan_limit) || 0;

  if (
    previousCandidateCount > 0 &&
    previousScanLimit === clanScanLimit &&
    candidatePlayerCount < Math.floor(previousCandidateCount * 0.6)
  ) {
    throw httpError(
      502,
      `Global rank scan produced only ${candidatePlayerCount} unique players versus ${previousCandidateCount} in the previous complete Top ${clanScanLimit} scan.`
    );
  }

  const trackedClan = await fetchTrackedClanCurrent(env, clan).catch(() => null);
  const trackedRank = toNumber(trackedClan?.rank);
  const memberCount = (clanMembers || []).length;

  if (
    trackedRank !== null &&
    trackedRank <= clanScanLimit &&
    memberCount > 0 &&
    foundMemberCount < memberCount
  ) {
    throw httpError(
      502,
      `Global rank scan found only ${foundMemberCount} of ${memberCount} ${clan} members even though the clan is rank ${trackedRank} inside the scanned Top ${clanScanLimit}.`
    );
  }
}

async function shouldPublishGlobalRankCurrent(env, { runKey, clan, startedAt }) {
  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "run_key,started_at,status",
    clan_name: `eq.${clan}`,
    status: "not.in.(failed,superseded)",
    order: "started_at.desc",
    limit: "1"
  });
  const latest = rows[0] || null;

  if (!latest?.run_key) return true;
  if (latest.run_key === runKey) return true;

  const latestStartedMs = isoToMs(latest.started_at);
  const currentStartedMs = isoToMs(startedAt);
  return !latestStartedMs || !currentStartedMs || latestStartedMs <= currentStartedMs;
}

function dedupeGlobalCandidateRows(rows) {
  const byUser = new Map();

  for (const row of rows || []) {
    const userId = toNumber(row.user_id);
    const points = toNumber(row.points) || 0;
    if (!userId) continue;

    const existing = byUser.get(userId);
    if (
      !existing ||
      points > (toNumber(existing.points) || 0) ||
      (points === (toNumber(existing.points) || 0) && String(row.source_clan || "").localeCompare(String(existing.source_clan || "")) < 0)
    ) {
      byUser.set(userId, { ...row, user_id: userId, points });
    }
  }

  return [...byUser.values()];
}

function sortGlobalCandidateRows(a, b) {
  const ap = toNumber(a.points) || 0;
  const bp = toNumber(b.points) || 0;
  if (bp !== ap) return bp - ap;

  return (toNumber(a.user_id) || 0) - (toNumber(b.user_id) || 0);
}

async function finalizeGlobalRankRun(env, {
  runKey,
  clan,
  clanMembers,
  latest,
  eventName,
  fetchedAt,
  candidatePlayerCount,
  publishCurrent = true
}) {
  const topCandidates = await readGlobalRankRankedCandidates(env, runKey);
  const candidateById = new Map(topCandidates.map(row => [String(row.user_id), row]));
  const finalRows = clanMembers.map(member => {
    const match = candidateById.get(String(member.user_id));

    return {
      ...member,
      battle_key: latest?.battle_key || member.battle_key || null,
      battle_display_name: cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name) || member.battle_display_name || null,
      event_name: eventName,
      global_rank: match ? toNumber(match.global_rank) : null,
      global_points: match ? toNumber(match.points) : null,
      total_global_players: candidatePlayerCount,
      found: Boolean(match),
      fetched_at: fetchedAt,
      run_key: runKey,
      raw_global: match ? {
        source_clan: match.source_clan,
        source_clan_rank: match.source_clan_rank,
        source_clan_points: match.source_clan_points,
        candidate: match.raw_candidate || {}
      } : {
        reason: "not_found_in_scanned_clans"
      },
      updated_at: new Date().toISOString()
    };
  });

  if (publishCurrent) {
    await supabaseUpsert(env, GLOBAL_RANK_CURRENT_TABLE, finalRows, "clan_name,user_id");
  }
  await supabaseUpsert(env, GLOBAL_RANK_HISTORY_TABLE, finalRows.map(row => ({
    run_key: runKey,
    clan_name: row.clan_name,
    user_id: row.user_id,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    clan_rank: row.clan_rank,
    clan_points: row.clan_points,
    battle_key: row.battle_key,
    battle_display_name: row.battle_display_name,
    event_name: row.event_name,
    global_rank: row.global_rank,
    global_points: row.global_points,
    total_global_players: row.total_global_players,
    found: row.found,
    fetched_at: row.fetched_at,
    raw_global: row.raw_global
  })), "run_key,user_id");

  return {
    rows: finalRows,
    foundMemberCount: finalRows.filter(row => row.found).length
  };
}

function normalizeClanRankRow(clan, fallbackRank) {
  const clanName = String(firstDefined(
    clan.Name,
    clan.name,
    clan.ClanName,
    clan.clanName,
    clan.Tag,
    clan.tag
  ) || "").trim();

  const points = toNumber(firstDefined(
    clan.Points,
    clan.points,
    clan.Score,
    clan.score,
    clan.Total,
    clan.total,
    clan.Value,
    clan.value
  )) || 0;

  const rank = toNumber(firstDefined(
    clan.Rank,
    clan.rank,
    clan.Place,
    clan.place,
    clan.Position,
    clan.position
  )) || fallbackRank;

  const iconId = extractClanImageId(firstDefined(
    clan.Icon,
    clan.icon,
    clan.IconId,
    clan.iconId,
    clan.icon_id
  ));

  return {
    rank,
    clan_name: clanName,
    points,
    icon_id: iconId || null,
    icon_url: iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null,
    raw_clan: clan
  };
}

function dedupeClanRows(rows) {
  const seen = new Set();
  const out = [];

  for (const row of rows) {
    const key = normalizeText(row.clan_name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
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

function extractClanImageId(iconValue) {
  return String(iconValue || "")
    .trim()
    .replace(/^rbxassetid:\/\//i, "")
    .replace(/^rbxasset:\/\//i, "")
    .trim();
}

function normalizeMembers(clan, battle) {
  const members = collectClanMembersWithOwner(clan);
  const contributions = buildContributionMap(clan, battle);

  return members
    .map(member => {
      const userId = toNumber(firstDefined(
        member.UserID,
        member.UserId,
        member.user_id,
        member.userId
      ));

      if (!userId) return null;

      const contribution = contributions.get(userId) || { points: 0, raw: {} };

      return {
        user_id: userId,
        total_points: contribution.points,
        raw_member: member,
        raw_contribution: contribution.raw
      };
    })
    .filter(Boolean);
}

function collectClanMembersWithOwner(clan) {
  const members = Array.isArray(clan?.Members) ? clan.Members.slice() : [];
  const ownerId = toNumber(firstDefined(clan?.Owner, clan?.owner, clan?.OwnerUserID, clan?.ownerUserId));

  if (ownerId && !members.some(member => toNumber(firstDefined(
    member?.UserID,
    member?.UserId,
    member?.user_id,
    member?.userId
  )) === ownerId)) {
    members.unshift({
      UserID: ownerId,
      PermissionLevel: 100,
      JoinTime: "",
      OwnerInjected: true
    });
  }

  return members;
}

function buildContributionMap(clan, battle) {
  const contributions = new Map();

  for (const item of collectContributionRows(clan, battle)) {
    const userId = toNumber(firstDefined(
      item.UserID,
      item.UserId,
      item.user_id,
      item.userId,
      item.id
    ));

    if (!userId) continue;

    contributions.set(userId, {
      points: toNumber(firstDefined(
        item.Points,
        item.points,
        item.TotalPoints,
        item.total_points,
        item.Score,
        item.score,
        item.Value,
        item.value
      )) || 0,
      raw: item
    });
  }

  return contributions;
}

function collectContributionRows(clan, battle) {
  return firstArray(
    battle?.PointContributions,
    battle?.pointContributions,
    battle?.Contributions,
    battle?.contributions,
    battle?.Contribution,
    battle?.contribution,
    clan?.Contribution?.Battle,
    clan?.contribution?.battle,
    clan?.Contributions?.Battle,
    clan?.contributions?.battle
  );
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

async function resolveRobloxUsernames(userIds, env) {
  const shouldLookup = String(env.ROBLOX_USERNAME_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];

  for (const id of ids) {
    result.set(id, `user_${id}`);
  }

  if (!shouldLookup || !ids.length) {
    return result;
  }

  const lookupBatch = async batch => {
    try {
      const res = await fetch("https://users.roblox.com/v1/users", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        },
        body: JSON.stringify({
          userIds: batch,
          excludeBannedUsers: false
        })
      });

      if (!res.ok) return;

      const json = await res.json();
      for (const user of json.data || []) {
        const id = toNumber(user.id);
        if (id && user.name) {
          result.set(id, String(user.name));
        }
      }
    } catch {
      // Keep fallback user_ID labels if Roblox lookup is unavailable.
    }
  };

  const batches = [];
  for (let i = 0; i < ids.length; i += ROBLOX_BATCH_SIZE) {
    batches.push(lookupBatch(ids.slice(i, i + ROBLOX_BATCH_SIZE)));
  }

  await Promise.all(batches);
  return result;
}

async function resolveMissingUsernames(rows, env) {
  const ids = (rows || [])
    .filter(row => isFallbackUsername(row.username, row.user_id))
    .map(row => row.user_id);

  if (!ids.length) return new Map();
  return resolveRobloxUsernames(ids, env).catch(() => new Map());
}

function isFallbackUsername(username, userId) {
  const text = String(username || "").trim();
  const id = String(userId || "").trim();

  if (!text) return true;
  if (id && text === id) return true;
  return /^user_\d+$/i.test(text);
}

function displayUsername(row, usernameMap) {
  const id = toNumber(row.user_id);
  const existing = String(row.username || "").trim();
  const resolved = id ? String(usernameMap.get(id) || "").trim() : "";

  if (resolved && !isFallbackUsername(resolved, id)) return resolved;
  if (existing && !isFallbackUsername(existing, id)) return existing;
  return existing || (id ? `user_${id}` : "");
}

async function resolveRobloxAvatarHeadshots(userIds, env) {
  const shouldLookup = String(env.ROBLOX_AVATAR_LOOKUPS || "true").toLowerCase() !== "false";
  const result = new Map();
  const ids = [...new Set(userIds.map(Number).filter(Boolean))];

  if (!shouldLookup || !ids.length) {
    return result;
  }

  for (let i = 0; i < ids.length; i += ROBLOX_BATCH_SIZE) {
    const batch = ids.slice(i, i + ROBLOX_BATCH_SIZE);
    const url = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    url.searchParams.set("userIds", batch.join(","));
    url.searchParams.set("size", "150x150");
    url.searchParams.set("format", "Png");
    url.searchParams.set("isCircular", "false");

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        }
      });

      if (!res.ok) continue;

      const json = await res.json();
      for (const item of json.data || []) {
        const id = String(item?.targetId || "").trim();
        const imageUrl = String(item?.imageUrl || "").trim();
        const state = String(item?.state || "").trim();

        if (id && imageUrl && state === "Completed") {
          result.set(id, imageUrl);
        }
      }
    } catch {
      // Keep avatar_url null if Roblox thumbnail lookup is unavailable.
    }
  }

  return result;
}

async function addGainFields(env, rows, latest) {
  if (!rows.length) return [];

  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) {
    return rows.map(row => addNullGains(row));
  }

  const windows = [
    { key: "gain_5m", minutes: 5, tolerance: 4 },
    { key: "gain_1h", minutes: 60, tolerance: 10 },
    { key: "gain_6h", minutes: 6 * 60, tolerance: 20 },
    { key: "gain_12h", minutes: 12 * 60, tolerance: 25 },
    { key: "gain_24h", minutes: 24 * 60, tolerance: 45 }
  ];

  const maps = {};

  for (const window of windows) {
    const targetMs = latestMs - window.minutes * 60 * 1000;
    const oldRows = await fetchNearestSnapshotRows(env, latest, targetMs, window.tolerance);
    maps[window.key] = new Map(
      oldRows.map(row => [String(row.user_id), toNumber(row.total_points) || 0])
    );
  }

  return rows.map(row => {
    const key = String(row.user_id);
    const out = { ...row };

    for (const window of windows) {
      const oldPoints = maps[window.key].get(key);
      out[window.key] =
        oldPoints === undefined
          ? null
          : (toNumber(row.total_points) || 0) - oldPoints;
    }

    return out;
  });
}

async function addClanGainFields(env, rows, latest) {
  if (!rows.length) return [];

  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) {
    return rows.map(row => addNullGains(row));
  }

  const windows = [
    { key: "gain_5m", minutes: 5, tolerance: 4 },
    { key: "gain_1h", minutes: 60, tolerance: 10 },
    { key: "gain_12h", minutes: 12 * 60, tolerance: 25 },
    { key: "gain_24h", minutes: 24 * 60, tolerance: 45 }
  ];

  const maps = {};

  for (const window of windows) {
    const targetMs = latestMs - window.minutes * 60 * 1000;
    const oldRows = await fetchNearestClanSnapshotRows(env, latest, targetMs, window.tolerance);
    maps[window.key] = new Map(
      oldRows.map(row => [normalizeText(row.clan_name), toNumber(row.points) || 0])
    );
  }

  return rows.map(row => {
    const key = normalizeText(row.clan_name);
    const out = { ...row };

    for (const window of windows) {
      const oldPoints = maps[window.key].get(key);
      out[window.key] =
        oldPoints === undefined
          ? null
          : (toNumber(row.points) || 0) - oldPoints;
    }

    return out;
  });
}

function addClanProjectionFields(rows, latest) {
  if (!rows.length) return [];

  const battleEndMs = new Date(latest?.battle_ended_at || "").getTime();
  const remainingHours =
    Number.isFinite(battleEndMs)
      ? Math.max(0, (battleEndMs - Date.now()) / (60 * 60 * 1000))
      : null;

  const projectedRows = rows.map(row => {
    const rate = chooseClanProjectionRate(row);
    const points = toNumber(row.points) || 0;
    const projectedPoints =
      remainingHours === null
        ? null
        : Math.round(points + rate.rate_per_hour * remainingHours);

    return {
      ...row,
      rate_per_hour: rate.rate_per_hour,
      projection_basis: rate.basis,
      projected_points: projectedPoints,
      projected_rank: null
    };
  });

  if (remainingHours === null) {
    return projectedRows;
  }

  const sorted = projectedRows.slice().sort((a, b) => {
    const ap = toNumber(a.projected_points) ?? toNumber(a.points) ?? 0;
    const bp = toNumber(b.projected_points) ?? toNumber(b.points) ?? 0;
    if (bp !== ap) return bp - ap;

    const ar = toNumber(a.rank);
    const br = toNumber(b.rank);
    if (ar !== null && br !== null && ar !== br) return ar - br;

    return String(a.clan_name || "").localeCompare(String(b.clan_name || ""));
  });

  const projectedRanks = new Map();
  sorted.forEach((row, index) => {
    projectedRanks.set(normalizeText(row.clan_name), index + 1);
  });

  return projectedRows.map(row => ({
    ...row,
    projected_rank: projectedRanks.get(normalizeText(row.clan_name)) || null
  }));
}

function chooseClanProjectionRate(row) {
  const windows = [
    { key: "gain_1h", basis: "1h", hours: 1 },
    { key: "gain_12h", basis: "12h", hours: 12 },
    { key: "gain_24h", basis: "24h", hours: 24 },
    { key: "gain_5m", basis: "5m", hours: 5 / 60 }
  ];

  for (const window of windows) {
    const gain = toNumber(row[window.key]);
    if (gain === null) continue;

    return {
      basis: window.basis,
      rate_per_hour: gain / window.hours
    };
  }

  return {
    basis: "none",
    rate_per_hour: 0
  };
}

function addNullGains(row) {
  return {
    ...row,
    gain_5m: null,
    gain_1h: null,
    gain_6h: null,
    gain_12h: null,
    gain_24h: null
  };
}

async function fetchNearestSnapshotRows(env, latest, targetMs, toleranceMin) {
  const toleranceMs = toleranceMin * 60 * 1000;
  const afterIso = new Date(targetMs - toleranceMs).toISOString();
  const beforeIso = new Date(targetMs + toleranceMs).toISOString();
  const candidates = await supabaseSelect(env, SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,user_id,total_points",
    clan_name: `eq.${latest.clan_name}`,
    battle_key: `eq.${latest.battle_key}`,
    fetched_at: [`gte.${afterIso}`, `lte.${beforeIso}`],
    order: "fetched_at.desc",
    limit: "5000"
  });

  const groups = new Map();
  for (const row of candidates) {
    if (!groups.has(row.snapshot_id)) groups.set(row.snapshot_id, []);
    groups.get(row.snapshot_id).push(row);
  }

  let best = null;

  for (const [snapshotId, group] of groups.entries()) {
    const ms = new Date(group[0]?.fetched_at).getTime();
    if (!Number.isFinite(ms)) continue;
    const diff = Math.abs(ms - targetMs);

    if (!best || diff < best.diff) {
      best = { snapshotId, group, diff };
    }
  }

  return best ? best.group : [];
}

async function fetchNearestClanSnapshotRows(env, latest, targetMs, toleranceMin) {
  const toleranceMs = toleranceMin * 60 * 1000;
  const afterIso = new Date(targetMs - toleranceMs).toISOString();
  const beforeIso = new Date(targetMs + toleranceMs).toISOString();
  const candidates = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,clan_name,points",
    battle_key: `eq.${latest.battle_key}`,
    fetched_at: [`gte.${afterIso}`, `lte.${beforeIso}`],
    order: "fetched_at.desc",
    limit: "5000"
  });

  const groups = new Map();
  for (const row of candidates) {
    if (!groups.has(row.snapshot_id)) groups.set(row.snapshot_id, []);
    groups.get(row.snapshot_id).push(row);
  }

  let best = null;

  for (const [snapshotId, group] of groups.entries()) {
    const ms = new Date(group[0]?.fetched_at).getTime();
    if (!Number.isFinite(ms)) continue;
    const diff = Math.abs(ms - targetMs);

    if (!best || diff < best.diff) {
      best = { snapshotId, group, diff };
    }
  }

  return best ? best.group : [];
}

async function fetchLatestSnapshotMeta(env, clan, battle) {
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    order: "fetched_at.desc",
    limit: "1"
  });

  return rows[0] || null;
}

async function fetchCurrentRows(env, clan) {
  return supabaseSelect(env, CURRENT_TABLE, {
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,username,user_id,total_points",
    clan_name: `eq.${clan}`,
    order: "rank.asc",
    limit: "1000"
  });
}

function latestMetaFromRows(rows) {
  const first = rows?.[0];
  if (!first) return null;

  return {
    snapshot_id: first.snapshot_id,
    fetched_at: first.fetched_at,
    clan_name: first.clan_name,
    battle_key: first.battle_key,
    battle_display_name: first.battle_display_name,
    battle_started_at: first.battle_started_at,
    battle_ended_at: first.battle_ended_at
  };
}

function latestClanMetaFromRows(rows) {
  const first = rows?.[0];
  if (!first) return null;

  return {
    snapshot_id: first.snapshot_id,
    fetched_at: first.fetched_at,
    battle_key: first.battle_key,
    battle_display_name: first.battle_display_name,
    battle_started_at: first.battle_started_at,
    battle_ended_at: first.battle_ended_at
  };
}

async function fetchTrackedClanCurrent(env, clan) {
  const rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, {
    select: "rank,clan_name,points,fetched_at",
    clan_name: `eq.${clan}`,
    limit: "1"
  });

  return rows[0] || null;
}

async function fetchSnapshotRows(env, snapshotId) {
  return supabaseSelect(env, SNAPSHOT_TABLE, {
    select: "fetched_at,rank,username,user_id,total_points",
    snapshot_id: `eq.${snapshotId}`,
    order: "rank.asc",
    limit: "1000"
  });
}

async function fetchLatestClanSnapshotMeta(env, battle) {
  const rows = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at",
    battle_key: `eq.${battle}`,
    order: "fetched_at.desc",
    limit: "1"
  });

  return rows[0] || null;
}

async function fetchClanSnapshotRows(env, snapshotId, limit) {
  return supabaseSelect(env, CLANS_SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,clan_name,points,icon_id,icon_url",
    snapshot_id: `eq.${snapshotId}`,
    order: "rank.asc",
    limit: String(limit || 100)
  });
}

async function pruneOldSnapshots(env, clan) {
  const retentionHours = snapshotRetentionHours(env);
  if (!Number.isFinite(retentionHours) || retentionHours <= 0) return;

  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();
  await archiveThenPruneRows(env, SNAPSHOT_TABLE, SNAPSHOT_ARCHIVE_TABLE, {
    fetched_at: `lt.${cutoff}`,
    clan_name: `eq.${clan}`
  });
}

async function pruneOldTableRows(env, tableName) {
  const retentionHours = snapshotRetentionHours(env);
  if (!Number.isFinite(retentionHours) || retentionHours <= 0) return;

  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();

  if (tableName === CLANS_SNAPSHOT_TABLE) {
    await archiveThenPruneRows(env, CLANS_SNAPSHOT_TABLE, CLANS_SNAPSHOT_ARCHIVE_TABLE, {
      fetched_at: `lt.${cutoff}`
    });
    return;
  }

  throw httpError(500, `Pruning is not configured for ${tableName}`);
}

async function archiveThenPruneRows(env, sourceTable, archiveTable, filters) {
  for (let batch = 0; batch < ARCHIVE_PRUNE_MAX_BATCHES; batch += 1) {
    const rows = await supabaseSelect(env, sourceTable, {
      ...filters,
      select: "*",
      order: "id.asc",
      limit: String(ARCHIVE_PRUNE_BATCH_SIZE)
    });

    if (!rows.length) return;

    await supabaseUpsert(env, archiveTable, rows, "id");

    const ids = rows
      .map(row => row.id)
      .filter(id => id !== undefined && id !== null)
      .join(",");

    if (!ids) {
      throw httpError(500, `Archive prune for ${sourceTable} found rows without ids`);
    }

    await supabaseDelete(env, sourceTable, {
      id: `in.(${ids})`
    });

    if (rows.length < ARCHIVE_PRUNE_BATCH_SIZE) return;
  }
}

async function supabaseInsert(env, tableName, rows) {
  const res = await fetch(supabaseUrl(env, tableName).toString(), {
    method: "POST",
    headers: supabaseHeaders(env, {
      Prefer: "return=minimal"
    }),
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase insert failed for ${tableName} (${res.status}): ${text}`);
  }
}

async function supabaseUpsert(env, tableName, rows, onConflict) {
  const url = supabaseUrl(env, tableName);
  url.searchParams.set("on_conflict", onConflict);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: supabaseHeaders(env, {
      Prefer: "resolution=merge-duplicates,return=minimal"
    }),
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase upsert failed for ${tableName} (${res.status}): ${text}`);
  }
}

async function supabaseDelete(env, tableName, filters) {
  const url = supabaseUrl(env, tableName);

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: supabaseHeaders(env)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase delete failed for ${tableName} (${res.status}): ${text}`);
  }
}

async function replaceCurrentRows(env, tableName, filters, rows) {
  await supabaseDelete(env, tableName, filters);
  if (rows.length) {
    await supabaseInsert(env, tableName, rows);
  }
}

async function upsertBattleRun(env, row) {
  await supabaseUpsert(env, BATTLE_RUNS_TABLE, [row], "clan_name,battle_key");
}

async function upsertGlobalRankRun(env, row) {
  await supabaseUpsert(env, GLOBAL_RANK_RUNS_TABLE, [row], "run_key");
}

async function supabaseSelect(env, tableName, params) {
  const url = supabaseUrl(env, tableName);

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: supabaseHeaders(env, {
      Prefer: "return=representation"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase select failed for ${tableName} (${res.status}): ${text}`);
  }

  return res.json();
}

async function supabaseCount(env, tableName, params) {
  const url = supabaseUrl(env, tableName);
  url.searchParams.set("select", "id");
  url.searchParams.set("limit", "1");

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: supabaseHeaders(env, {
      Prefer: "count=exact",
      Range: "0-0"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase count failed for ${tableName} (${res.status}): ${text}`);
  }

  const contentRange = res.headers.get("content-range") || "";
  const match = contentRange.match(/\/(\d+|\*)$/);
  if (match && match[1] !== "*") {
    return Number(match[1]) || 0;
  }

  const rows = await res.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function supabaseSelectPaged(env, tableName, params, limit, pageSize = 1000) {
  const requested = clamp(Number(limit || 1000), 1, 2000000);
  const size = clamp(Number(pageSize || 1000), 1, 1000);
  const baseOffset = Number(params.offset || 0);
  const rows = [];

  while (rows.length < requested) {
    const pageLimit = Math.min(size, requested - rows.length);
    const page = await supabaseSelect(env, tableName, {
      ...params,
      limit: String(pageLimit),
      offset: String(baseOffset + rows.length)
    });

    rows.push(...page);
    if (page.length < pageLimit) break;
  }

  return rows;
}

function supabaseUrl(env, tableName) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  return new URL(`${base}/rest/v1/${encodeURIComponent(tableName)}`);
}

function supabaseHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function requireSupabase(env) {
  if (!env.SUPABASE_URL) {
    throw httpError(500, "Missing required Worker var: SUPABASE_URL");
  }

  if (!env.SUPABASE_SERVICE_KEY) {
    throw httpError(500, "Missing required Worker secret: SUPABASE_SERVICE_KEY");
  }
}

function requireAdmin(request, env) {
  if (!env.INGEST_ADMIN_TOKEN) {
    throw httpError(500, "Missing required Worker secret: INGEST_ADMIN_TOKEN");
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1] || request.headers.get("X-C0LD-Admin-Token") || "";

  if (token !== env.INGEST_ADMIN_TOKEN) {
    throw httpError(401, "Invalid or missing ingest token.");
  }
}

function isForceRequest(url) {
  return ["1", "true", "yes", "force"].includes(
    String(url.searchParams.get("force") || "").trim().toLowerCase()
  );
}

function battleIngestGate({ activeBattleMeta, battleMeta, battleKey, env, force = false }) {
  if (force) {
    return { allowed: true, reason: "forced" };
  }

  if (String(env.SKIP_ENDED_BATTLE_INGEST || "true").toLowerCase() === "false") {
    return { allowed: true, reason: "disabled" };
  }

  const meta = battleMeta || activeBattleMeta || {};
  const startedAt = meta.startedAt || activeBattleMeta?.startedAt || null;
  const endedAt = meta.endedAt || activeBattleMeta?.endedAt || null;
  const startMs = isoToMs(startedAt);
  const endMs = isoToMs(endedAt);
  const now = Date.now();

  if (Number.isFinite(endMs) && endMs <= now) {
    return {
      allowed: false,
      reason: "battle_ended",
      message: "Battle has ended; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt
    };
  }

  if (Number.isFinite(startMs) && startMs > now) {
    return {
      allowed: false,
      reason: "battle_not_started",
      message: "Battle has not started yet; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt
    };
  }

  return {
    allowed: true,
    reason: "battle_open",
    battle_key: battleKey || activeBattleMeta?.battleKey || null,
    battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
    battle_started_at: startedAt,
    battle_ended_at: endedAt
  };
}

function skippedIngestResponse({
  scope,
  source,
  clan,
  fetchedAt,
  configuredBattleKey,
  resolvedBattleKey,
  battleMeta,
  gate
}) {
  return json({
    ok: true,
    skipped: true,
    reason: gate.reason,
    message: gate.message || "Ingest skipped without writing snapshot rows.",
    scope,
    source,
    clan_name: clan,
    configured_battle_key: configuredBattleKey,
    battle_key: gate.battle_key || resolvedBattleKey || null,
    battle_display_name: gate.battle_display_name || battleMeta?.displayName || null,
    battle_started_at: gate.battle_started_at || battleMeta?.startedAt || null,
    battle_ended_at: gate.battle_ended_at || battleMeta?.endedAt || null,
    fetched_at: fetchedAt,
    rows_inserted: 0
  });
}

function resolveBattleKey(battles, configuredBattleKey, env = {}, activeBattleKey = "") {
  const autoDetect = String(env.AUTO_DETECT_BATTLE || "").toLowerCase() === "true" ||
    String(configuredBattleKey || "").toLowerCase() === "auto";
  const activeMatch = findBattleKey(battles, activeBattleKey);
  const configuredMatch = findBattleKey(battles, configuredBattleKey);

  if (autoDetect && activeMatch) {
    return activeMatch;
  }

  if (!autoDetect && configuredMatch) {
    return configuredMatch;
  }

  return chooseBattleKey(battles) || configuredMatch || configuredBattleKey;
}

function findBattleKey(battles, value) {
  const keys = Object.keys(battles || {});
  const target = normalizeText(value);
  if (!target) return "";

  if (battles?.[value]) {
    return value;
  }

  for (const key of keys) {
    if (normalizeText(key) === target || normalizeText(prettifyBattleKey(key)) === target) {
      return key;
    }
  }

  for (const key of keys) {
    const battle = battles[key] || {};
    const names = [
      getFirstValue(battle, [
        "ConfigName",
        "configName",
        "DisplayName",
        "displayName",
        "display_name",
        "BattleName",
        "battleName",
        "battle_name",
        "Name",
        "name",
        "Title",
        "title"
      ])
    ];

    if (names.some(name => normalizeText(name) === target)) {
      return key;
    }
  }

  return "";
}

function chooseBattleKey(battles) {
  const keys = Object.keys(battles || {});
  if (!keys.length) return "";

  const now = Date.now();
  const candidates = keys.map((key, index) => {
    const battle = battles[key] || {};
    const startMs = isoToMs(safeIso(getFirstValue(battle, [
      "StartedAt", "startedAt", "started_at", "StartTime", "startTime", "start_time", "Started", "started", "Start", "start"
    ])));
    const endMs = isoToMs(safeIso(getFirstValue(battle, [
      "EndedAt", "endedAt", "ended_at", "EndTime", "endTime", "end_time", "EndsAt", "endsAt", "ends_at", "End", "end"
    ])));
    const contributionCount = Array.isArray(battle.PointContributions) ? battle.PointContributions.length : 0;
    const isActive =
      (!Number.isFinite(startMs) || startMs <= now) &&
      (!Number.isFinite(endMs) || endMs >= now);

    return {
      key,
      index,
      isActive,
      contributionCount,
      endMs: Number.isFinite(endMs) ? endMs : 0,
      startMs: Number.isFinite(startMs) ? startMs : 0
    };
  });

  candidates.sort((a, b) => {
    if (Number(b.isActive) !== Number(a.isActive)) return Number(b.isActive) - Number(a.isActive);
    if (b.contributionCount !== a.contributionCount) return b.contributionCount - a.contributionCount;
    if (b.endMs !== a.endMs) return b.endMs - a.endMs;
    if (b.startMs !== a.startMs) return b.startMs - a.startMs;
    return a.index - b.index;
  });

  return candidates[0].key;
}

async function fetchJsonWithRetry(url, label, { attempts, baseDelayMs }) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      const text = await res.text();
      let payload = {};

      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { message: text || "Invalid JSON response" };
      }

      if (!res.ok || payload.ok === false || payload.status === "error") {
        const retryAfter = parseRetryAfterSeconds(res.headers.get("Retry-After"));
        const err = httpError(
          res.status || 502,
          payload.message || payload.error || `${label} failed with HTTP ${res.status}`
        );
        err.retryAfterMs = retryAfter ? retryAfter * 1000 : null;
        throw err;
      }

      return payload;
    } catch (err) {
      lastError = err;
      if (attempt >= attempts) break;

      const retryAfterMs = Number(err?.retryAfterMs);
      const delay = Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : Math.min(120000, attempt * attempt * baseDelayMs);
      await sleep(delay);
    }
  }

  throw lastError || httpError(502, `${label} failed`);
}

function parseRetryAfterSeconds(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) return Math.max(0, numeric);

  const ms = new Date(text).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 ? Math.ceil(ms / 1000) : null;
}

function parseLeaderboardNumber(value) {
  const direct = toNumber(value);
  if (direct !== null) return direct;

  const text = String(value || "").replace(/,/g, "").trim();
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*([KMBT])?/i);
  if (!match) return null;

  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;

  const multipliers = {
    "": 1,
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12
  };
  const multiplier = multipliers[String(match[2] || "").toUpperCase()] || 1;
  return Math.round(base * multiplier);
}

function normalizeGlobalCurrentOutput(row) {
  return {
    clan_name: row.clan_name,
    user_id: toNumber(row.user_id),
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    clan_rank: toNumber(row.clan_rank),
    clan_points: toNumber(row.clan_points) || 0,
    battle_key: row.battle_key,
    battle_display_name: row.battle_display_name,
    event_name: row.event_name,
    global_rank: toNumber(row.global_rank),
    global_points: toNumber(row.global_points),
    total_global_players: toNumber(row.total_global_players),
    found: Boolean(row.found),
    fetched_at: row.fetched_at,
    run_key: row.run_key,
    updated_at: row.updated_at
  };
}

function normalizeGlobalCandidateSearchOutput(row, {
  run,
  globalRank,
  totalGlobalPlayers,
  username,
  displayName,
  avatarUrl
}) {
  const userId = toNumber(row.user_id);
  const sourceClan = String(row.source_clan || "").trim();

  return {
    clan_name: sourceClan,
    user_id: userId,
    username: username || `user_${userId}`,
    display_name: displayName || username || `user_${userId}`,
    avatar_url: avatarUrl || null,
    clan_rank: toNumber(row.source_clan_rank),
    clan_points: toNumber(row.source_clan_points) || 0,
    battle_key: row.battle_key || run?.battle_key || null,
    battle_display_name: cleanBattleDisplayName(
      row.battle_key || run?.battle_key,
      row.battle_display_name || run?.battle_display_name
    ),
    event_name: run?.event_name || row.battle_display_name || run?.battle_display_name || run?.battle_key || null,
    global_rank: toNumber(globalRank),
    global_points: toNumber(row.points),
    total_global_players: toNumber(totalGlobalPlayers),
    found: true,
    fetched_at: row.fetched_at || run?.finished_at || run?.updated_at || null,
    run_key: run?.run_key || null,
    updated_at: row.updated_at || run?.updated_at || null,
    source_clan: sourceClan
  };
}

async function findLatestGlobalRankSearchRun(env, clan) {
  const completed = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "*",
    clan_name: `eq.${clan}`,
    status: "in.(ok,completed)",
    order: "started_at.desc",
    limit: "20"
  });

  const usableCompleted = completed.find(isUsableCompletedGlobalRankRun);
  if (usableCompleted) return usableCompleted;
  return null;
}

function isUsableCompletedGlobalRankRun(run) {
  if (!run?.run_key) return false;

  const candidateCount =
    toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    0;
  const scanLimit = toNumber(run.scan_limit) || 0;
  const scannedCount =
    toNumber(run.scanned_clan_count) ||
    toNumber(run.scanned_count) ||
    0;
  const stopReason = String(run.stop_reason || "").toLowerCase();
  const clanMemberCount = toNumber(run.clan_member_count) || 0;
  const foundMemberCount = toNumber(run.found_member_count) || 0;

  if (!(candidateCount > 0)) return false;
  if (scanLimit > 0 && scannedCount < scanLimit && stopReason !== "clan_leaderboard_exhausted") return false;
  if (clanMemberCount > 0 && foundMemberCount <= 0) return false;
  return true;
}

async function resolveGlobalSearchIdentity(query, env) {
  const text = String(query || "").trim();
  const directId = toNumber(text);

  if (directId) {
    const usernameMap = await resolveRobloxUsernames([directId], env).catch(() => new Map());
    return {
      user_id: directId,
      username: usernameMap.get(directId) || `user_${directId}`,
      display_name: null
    };
  }

  try {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "c0ld-Clan-API-Worker"
      },
      body: JSON.stringify({
        usernames: [text],
        excludeBannedUsers: false
      })
    });

    if (!res.ok) return { user_id: null, username: null, display_name: null };

    const payload = await res.json();
    const user = firstArray(payload?.data)[0] || null;
    const id = toNumber(user?.id);

    return {
      user_id: id,
      username: user?.name || text,
      display_name: user?.displayName || null
    };
  } catch {
    return { user_id: null, username: null, display_name: null };
  }
}

function globalRankEventName(env, latest) {
  return String(
    env.GLOBAL_RANK_EVENT_NAME ||
    cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name) ||
    latest?.battle_key ||
    battleDisplayName(env, battleKey(env))
  ).trim();
}

function globalRankClanScanLimit(env) {
  return clamp(
    Number(env.GLOBAL_RANK_CLAN_SCAN_LIMIT || DEFAULT_GLOBAL_RANK_CLAN_SCAN_LIMIT),
    1,
    20000
  );
}

function globalRankClanPageSize(env) {
  return clamp(
    Number(env.GLOBAL_RANK_CLAN_PAGE_SIZE || env.GLOBAL_RANK_PAGE_SIZE || DEFAULT_GLOBAL_RANK_CLAN_PAGE_SIZE),
    1,
    500
  );
}

function globalRankClansPerRun(env) {
  return clamp(
    Number(env.GLOBAL_RANK_CLANS_PER_RUN || DEFAULT_GLOBAL_RANK_CLANS_PER_RUN),
    1,
    500
  );
}

function globalRankShardCount(env) {
  return clamp(
    Number(env.GLOBAL_RANK_SHARD_COUNT || DEFAULT_GLOBAL_RANK_SHARD_COUNT),
    1,
    100
  );
}

function globalRankShardConcurrency(env, shardCount = globalRankShardCount(env)) {
  return clamp(
    Number(env.GLOBAL_RANK_SHARD_CONCURRENCY || DEFAULT_GLOBAL_RANK_SHARD_CONCURRENCY),
    1,
    Math.max(1, shardCount)
  );
}

function globalRankClansPerShardRun(env, shardCount = globalRankShardCount(env)) {
  if (env.GLOBAL_RANK_CLANS_PER_SHARD_RUN !== undefined && env.GLOBAL_RANK_CLANS_PER_SHARD_RUN !== "") {
    return clamp(Number(env.GLOBAL_RANK_CLANS_PER_SHARD_RUN), 1, 500);
  }

  return clamp(
    Math.ceil(globalRankClansPerRun(env) / Math.max(1, shardCount)),
    1,
    500
  );
}

function globalRankCandidateClanBatchSize(env) {
  return clamp(
    Number(env.GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE || DEFAULT_GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE),
    1,
    50
  );
}

function globalRankCandidateReadLimit(env) {
  return clamp(globalRankClanScanLimit(env) * 100, 1000, 2000000);
}

function globalRankRuntimeConfig(env) {
  const shardCount = globalRankShardCount(env);

  return {
    ingest_global_ranks: String(env.INGEST_GLOBAL_RANKS || "false").toLowerCase() === "true",
    scan_mode: shardCount > 1 ? "sharded" : "linear",
    shard_count: shardCount,
    shard_concurrency: globalRankShardConcurrency(env, shardCount),
    clans_per_shard_run: globalRankClansPerShardRun(env, shardCount),
    candidate_clan_batch_size: globalRankCandidateClanBatchSize(env),
    clan_scan_limit: globalRankClanScanLimit(env),
    clan_page_size: globalRankClanPageSize(env),
    clans_per_run: globalRankClansPerRun(env),
    clan_delay_ms: globalRankClanDelayMs(env),
    retry_attempts: globalRankRetryAttempts(env),
    retry_base_ms: globalRankRetryBaseMs(env),
    schedule_minutes: globalRankScheduleMinutes(env),
    schedule_offset_minutes: globalRankScheduleOffsetMinutes(env)
  };
}

function globalRankRetryAttempts(env) {
  return clamp(
    Number(env.GLOBAL_RANK_RETRY_ATTEMPTS || DEFAULT_GLOBAL_RANK_RETRY_ATTEMPTS),
    1,
    12
  );
}

function globalRankRetryBaseMs(env) {
  return clamp(
    Number(env.GLOBAL_RANK_RETRY_BASE_MS || DEFAULT_GLOBAL_RANK_RETRY_BASE_MS),
    1000,
    120000
  );
}

function globalRankClanDelayMs(env) {
  return clamp(
    Number(env.GLOBAL_RANK_CLAN_DELAY_MS || env.GLOBAL_RANK_SCAN_DELAY_MS || DEFAULT_GLOBAL_RANK_CLAN_DELAY_MS),
    0,
    120000
  );
}

function globalRankScheduleMinutes(env) {
  return clamp(
    Number(env.GLOBAL_RANK_SCHEDULE_MINUTES || DEFAULT_GLOBAL_RANK_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function globalRankScheduleOffsetMinutes(env) {
  const interval = globalRankScheduleMinutes(env);
  const offsetValue = env.GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES === undefined || env.GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES
    : env.GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function shouldRunGlobalRankSchedule(env, scheduledAt = null) {
  const interval = globalRankScheduleMinutes(env);
  const offset = globalRankScheduleOffsetMinutes(env);
  const now = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minuteInInterval = minuteOfDay % interval;
  const minutesUntilOffset = (offset - minuteInInterval + interval) % interval;

  return minutesUntilOffset < 5;
}

function normalizedScheduleOffset(value, interval) {
  const raw = Number(value || 0);
  if (!Number.isFinite(raw)) return 0;
  return ((Math.floor(raw) % interval) + interval) % interval;
}

async function runLimited(items, limit, worker) {
  const results = [];
  const safeLimit = Math.max(1, Math.round(Number(limit) || 1));
  let nextIndex = 0;

  async function runNext() {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= items.length) return;

    results[index] = await worker(items[index], index);
    await runNext();
  }

  const runners = [];
  for (let index = 0; index < Math.min(safeLimit, items.length); index += 1) {
    runners.push(runNext());
  }

  await Promise.all(runners);
  return results;
}

function normalizeGlobalSearchKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clanName(env) {
  return String(env.CLAN_NAME || DEFAULT_CLAN_NAME).trim() || DEFAULT_CLAN_NAME;
}

function clanNames(env) {
  const raw = String(env.CLAN_NAMES || clanName(env));
  const names = raw
    .split(",")
    .map(name => name.trim())
    .filter(Boolean);
  const unique = [];
  const seen = new Set();

  for (const name of names.length ? names : [clanName(env)]) {
    const key = normalizeText(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }

  return unique.length ? unique : [clanName(env)];
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function battleKey(env) {
  return String(env.CURRENT_BATTLE_NAME || DEFAULT_BATTLE_KEY).trim() || DEFAULT_BATTLE_KEY;
}

function battleDisplayName(env, fallback) {
  return String(env.CURRENT_BATTLE_DISPLAY_NAME || fallback || battleKey(env));
}

function shouldUseBattleMetaOverride(env, configuredBattleKey, resolvedBattleKey) {
  const configured = normalizeText(configuredBattleKey || battleKey(env));
  const resolved = normalizeText(resolvedBattleKey);
  if (!configured || configured === "auto") return false;

  return configured === resolved;
}

function activeBattleMatches(activeMeta, battleKeyValue, displayName) {
  if (!activeMeta) return false;

  const activeKeys = [
    activeMeta.battleKey,
    activeMeta.displayName
  ].map(normalizeText).filter(Boolean);
  const localKeys = [
    battleKeyValue,
    displayName
  ].map(normalizeText).filter(Boolean);

  return activeKeys.some(activeKey => localKeys.includes(activeKey));
}

function mergeBattleMeta(meta, activeMeta, battleKeyValue, options = {}) {
  if (!activeMeta) return meta;

  const canUseActive =
    options.allowMismatch ||
    activeBattleMatches(activeMeta, battleKeyValue, meta?.displayName);

  if (!canUseActive) return meta;

  return {
    ...meta,
    displayName: activeMeta.displayName || meta?.displayName,
    startedAt: meta?.startedAt || activeMeta.startedAt,
    endedAt: meta?.endedAt || activeMeta.endedAt
  };
}

function mergeLatestMeta(latest, activeMeta, options = {}) {
  if (!latest || !activeMeta) return latest;

  const canUseActive =
    options.allowMismatch ||
    activeBattleMatches(activeMeta, latest.battle_key, latest.battle_display_name);

  if (!canUseActive) return latest;

  return {
    ...latest,
    battle_display_name: activeMeta.displayName || latest.battle_display_name,
    battle_started_at: activeMeta.startedAt || latest.battle_started_at,
    battle_ended_at: activeMeta.endedAt || latest.battle_ended_at
  };
}

function cleanBattleDisplayName(key, displayName) {
  const raw = String(displayName || "").trim();
  const battleKeyValue = String(key || "").trim();

  if (
    battleKeyValue &&
    raw &&
    normalizeText(raw).includes("backrooms") &&
    !normalizeText(battleKeyValue).includes("backrooms")
  ) {
    return prettifyBattleKey(battleKeyValue) || battleKeyValue;
  }

  return raw || prettifyBattleKey(battleKeyValue) || battleKeyValue;
}

function extractBattleMeta(battle, resolvedBattleKey, env, options = {}) {
  const displayOverride = options.allowEnvDisplayName === false
    ? null
    : env.CURRENT_BATTLE_DISPLAY_NAME;
  const endOverride = options.allowEnvTiming === false
    ? null
    : env.CURRENT_BATTLE_END_ISO;
  const displayName = String(firstDefined(
    displayOverride,
    getFirstValue(battle, [
      "ConfigName",
      "configName",
      "DisplayName",
      "displayName",
      "display_name",
      "BattleName",
      "battleName",
      "battle_name",
      "Name",
      "name",
      "Title",
      "title"
    ]),
    prettifyBattleKey(resolvedBattleKey),
    resolvedBattleKey
  ));

  const startedAt = safeIso(getFirstValue(battle, [
    "StartedAt",
    "startedAt",
    "started_at",
    "StartTime",
    "startTime",
    "start_time",
    "Started",
    "started",
    "Start",
    "start",
    "BeginTime",
    "beginTime",
    "begin_time",
    "BeganAt",
    "beganAt",
    "began_at"
  ]));

  const endedAt = safeIso(firstDefined(
    endOverride,
    getFirstValue(battle, [
      "EndedAt",
      "endedAt",
      "ended_at",
      "EndTime",
      "endTime",
      "end_time",
      "EndsAt",
      "endsAt",
      "ends_at",
      "End",
      "end",
      "FinishTime",
      "finishTime",
      "finish_time",
      "FinishedAt",
      "finishedAt",
      "finished_at"
    ])
  ));

  return {
    displayName,
    startedAt,
    endedAt
  };
}

function getFirstValue(source, keys) {
  if (!source || typeof source !== "object") return null;

  const exact = new Map(Object.keys(source).map(key => [key, source[key]]));
  const lower = new Map(Object.keys(source).map(key => [key.toLowerCase(), source[key]]));
  const keySet = new Set(keys.map(key => String(key).toLowerCase()));

  for (const key of keys) {
    if (exact.has(key)) return exact.get(key);
    const value = lower.get(String(key).toLowerCase());
    if (value !== undefined && value !== null && value !== "") return value;
  }

  const visited = new Set();
  const stack = [{ value: source, depth: 0 }];

  while (stack.length) {
    const current = stack.pop();
    if (!current?.value || typeof current.value !== "object") continue;
    if (visited.has(current.value)) continue;
    visited.add(current.value);

    if (current.depth > 3 || Array.isArray(current.value)) continue;

    for (const [key, value] of Object.entries(current.value)) {
      if (keySet.has(key.toLowerCase()) && value !== undefined && value !== null && value !== "") {
        return value;
      }

      if (value && typeof value === "object") {
        stack.push({ value, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

function prettifyBattleKey(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d{4})$/, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseThresholdNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/,/g, "").replace(/\s+/g, "").toUpperCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([KMBT])?$/);
  if (!match) return null;

  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;

  const multipliers = {
    "": 1,
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12
  };

  const valueNumber = Math.round(base * (multipliers[match[2] || ""] || 1));
  return Number.isFinite(valueNumber) ? valueNumber : null;
}

function historyHours(url, env, defaultHours) {
  const requested = Number(url.searchParams.get("hours") || defaultHours);
  const maxHoursValue = Number(env.HISTORY_MAX_HOURS || DEFAULT_HISTORY_MAX_HOURS);
  const maxHours = Number.isFinite(maxHoursValue) && maxHoursValue > 0
    ? maxHoursValue
    : DEFAULT_HISTORY_MAX_HOURS;

  return clamp(requested, 1, maxHours);
}

function snapshotRetentionHours(env) {
  const raw = String(env.SNAPSHOT_RETENTION_HOURS || "").trim();
  if (!raw) return 0;

  if (["0", "false", "off", "none", "disabled"].includes(raw.toLowerCase())) {
    return 0;
  }

  const hours = Number(raw);
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function boundedIntegerParam(url, name, min, max) {
  const raw = url.searchParams.get(name);
  if (raw === null || raw === "") return null;

  const value = Math.round(Number(raw));
  if (!Number.isFinite(value)) return null;

  return clamp(value, min, max);
}

function safeIso(value) {
  if (!value) return null;
  let candidate = value;

  if (typeof value === "number" && Number.isFinite(value)) {
    candidate = value < 100000000000 ? value * 1000 : value;
  } else if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
    const numeric = Number(value.trim());
    candidate = numeric < 100000000000 ? numeric * 1000 : numeric;
  }

  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isoToMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function siteOrigins(env) {
  const origins = new Set(["https://oapl.github.io"]);
  for (const value of String(env.SITE_ORIGINS || "").split(",")) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      // Ignore malformed optional origins.
    }
  }
  return origins;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = siteOrigins(env);
  const allowOrigin = allowed.has(origin) ? origin : [...allowed][0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-C0LD-Admin-Token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function cacheJson(data, env) {
  const seconds = Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS);
  return json(data, 200, {
    "Cache-Control": `public, max-age=${Math.max(0, seconds)}`
  });
}
