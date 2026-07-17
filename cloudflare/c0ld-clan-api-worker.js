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
const USER_LOOKUP_CACHE_TABLE = "c0ld_user_lookup_cache";
const EXTERNAL_PLAYER_HISTORY_TABLE = "c0ld_external_player_history";
const CLAN_ACTIVITY_ROSTER_TABLE = "c0ld_clan_activity_roster_snapshots";
const CLAN_ACTIVITY_CURRENT_TABLE = "c0ld_clan_activity_current";
const CLAN_ACTIVITY_EVENTS_TABLE = "c0ld_clan_activity_events";
const CLAN_ACTIVITY_SUMMARY_TABLE = "c0ld_clan_activity_summary";
const PS99_PLACES_TABLE = "c0ld_ps99_places";
const PS99_VERSION_EVENTS_TABLE = "c0ld_ps99_version_events";
const PS99_RESTART_STATE_TABLE = "c0ld_ps99_restart_state";
const PS99_RESTART_EVENTS_TABLE = "c0ld_ps99_restart_events";
const PS99_CCU_SAMPLES_TABLE = "c0ld_ps99_ccu_samples";
const DISCORD_API_BASE = "https://discord.com/api/v10";
const DEFAULT_CW_BOT_USER_ID = "1219229814150398003";
const DEFAULT_BIG_BOT_USER_ID = "920446937986129960";
const CLANS_BATTLE_RUN_CLAN_NAME = "__clans__";
const DEFAULT_CLAN_NAME = "c0ld";
const DEFAULT_BATTLE_KEY = "auto";
const DEFAULT_HISTORY_MAX_HOURS = 100000;
const DEFAULT_PUBLIC_CACHE_SECONDS = 30;
const ARCHIVE_PRUNE_BATCH_SIZE = 500;
const ARCHIVE_PRUNE_MAX_BATCHES = 10;
const ROBLOX_BATCH_SIZE = 100;
const CLANS_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLAN_SCAN_LIMIT = 500;
const DEFAULT_GLOBAL_RANK_CLAN_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLANS_PER_RUN = 25;
const DEFAULT_GLOBAL_RANK_SCHEDULE_MINUTES = 30;
const DEFAULT_GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES = 29;
const DEFAULT_PLAYER_REWARD_CUTOFF_RANKS = [3, 100, 1000, 1050, 1150, 6150, 30000];
const DEFAULT_CLAN_REWARD_CUTOFF_RANKS = [1, 3, 10, 30, 50, 250, 500];
const LEGACY_CLAN_REWARD_CUTOFF_RANKS = "3,10,50,100,500";
const DEFAULT_GLOBAL_RANK_SHARD_COUNT = 1;
const DEFAULT_GLOBAL_RANK_SHARD_CONCURRENCY = 1;
const DEFAULT_GLOBAL_RANK_RETRY_ATTEMPTS = 6;
const DEFAULT_GLOBAL_RANK_RETRY_BASE_MS = 15000;
const DEFAULT_GLOBAL_RANK_CLAN_DELAY_MS = 1000;
const DEFAULT_GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE = 10;
const DEFAULT_CLAN_ACTIVITY_TOP_N = 100;
const DEFAULT_CLAN_ACTIVITY_SCHEDULE_MINUTES = 30;
const DEFAULT_CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_CLAN_ACTIVITY_CLAN_DELAY_MS = 250;
const DEFAULT_CLAN_ACTIVITY_CONCURRENCY = 8;
const DEFAULT_CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES = 25;
const TOP_CLAN_REBIRTH_POINTS = 120;
const DEFAULT_PS99_UNIVERSE_ID = 3317771874;
const DEFAULT_PS99_ROOT_PLACE_ID = 8737899170;
const DEFAULT_PS99_VERSION_SCHEDULE_MINUTES = 5;
const DEFAULT_PS99_VERSION_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_PS99_VERSION_HISTORY_LIMIT = 100;
const DEFAULT_PS99_RESTART_SAMPLE_SIZE = 10;
const DEFAULT_PS99_RESTART_BATCH_SIZE = 100;
const DEFAULT_PS99_RESTART_PAGE_COUNT = 5;
const DEFAULT_PS99_RESTART_CONFIRMATIONS = 2;
const DEFAULT_PS99_RESTART_COOLDOWN_MINUTES = 10;
const DEFAULT_PS99_RESTART_HISTORY_LIMIT = 100;
const PS99_RESTART_CRONS = new Set([
  "* * * * *",
  "*/1 * * * *"
]);
const PS99_VERSION_SEED_HINTS = Object.freeze({
  8737899170: 27147,
  13764885284: 30,
  15502339080: 989,
  15588442388: 920,
  16498369169: 1007,
  17503543197: 885,
  95635359880599: 370,
  119454325063278: 353,
  140403681187145: 393
});

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      let response;
      const cachedResponse = await readPublicGetCache(request, env);
      if (cachedResponse) {
        return withCors(cachedResponse, request, env);
      }

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
          global_rank_config: globalRankRuntimeConfig(env),
          clan_activity_config: clanActivityRuntimeConfig(env),
          ps99_version_config: ps99VersionRuntimeConfig(env),
          ps99_restart_config: ps99RestartRuntimeConfig(env),
          ps99_alert_config: ps99AlertRuntimeConfig(env)
        });
      } else if (request.method === "GET" && url.pathname === "/api/current") {
        response = await handleCurrent(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/home/awards") {
        response = await handleHomeAwards(request, env);
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
      } else if (request.method === "GET" && url.pathname === "/api/reward-cutoffs") {
        response = await handleRewardCutoffs(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/search") {
        response = await handleGlobalSearch(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/external-history") {
        response = await handleExternalHistory(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/cwbot/import") {
        response = await handleCwBotHistoryImport(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/bigbot/import") {
        response = await handleBigBotHistoryImport(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/activity/summary") {
        response = await handleClanActivitySummary(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/activity/status") {
        response = await handleClanActivityStatus(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/activity/detail") {
        response = await handleClanActivityDetail(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/clans/activity/feed") {
        response = await handleClanActivityFeed(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/versions") {
        response = await handlePs99Versions(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restarts") {
        response = await handlePs99Restarts(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/ccu") {
        response = await handlePs99Ccu(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("clan"), isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/clans/ingest") {
        requireAdmin(request, env);
        response = await handleClansIngest(env, "manual", isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/global/ingest") {
        requireAdmin(request, env);
        response = await handleGlobalRankIngest(env, "manual", url.searchParams.get("clan"), isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/clans/activity/ingest") {
        requireAdmin(request, env);
        response = await handleClanActivityIngest(env, "manual", {
          force: isForceRequest(url),
          bypassRecentGuard: isTruthyParam(url, "bypass_recent")
        });
      } else if (request.method === "POST" && url.pathname === "/api/ps99/versions/ingest") {
        requireAdmin(request, env);
        response = await handlePs99VersionIngest(env, "manual", {
          force: isForceRequest(url)
        });
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restarts/ingest") {
        requireAdmin(request, env);
        response = await handlePs99RestartIngest(env, "manual");
      } else if (request.method === "POST" && url.pathname === "/api/ps99/alerts/test") {
        requireAdmin(request, env);
        response = await handlePs99AlertTest(env, url);
      } else if (request.method === "POST" && url.pathname === "/api/scheduled/run") {
        requireAdmin(request, env);
        response = json({
          ok: true,
          results: await runScheduledIngests(env, isForceRequest(url), null, {
            bypassActivityRecentGuard: isTruthyParam(url, "bypass_recent")
          })
        });
      } else {
        response = json({ ok: false, message: "Not found" }, 404);
      }

      await writePublicGetCache(request, response, env, ctx);
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
    if (isPs99RestartCron(event?.cron)) {
      if (ps99RestartEnabled(env)) {
        ctx.waitUntil(handlePs99RestartIngest(env, "schedule"));
      }
      return;
    }

    ctx.waitUntil(runScheduledIngests(env, false, scheduledAt));
  }
};

function isPs99RestartCron(value) {
  const cron = String(value || "").trim().replace(/\s+/g, " ");
  return PS99_RESTART_CRONS.has(cron);
}

async function runScheduledIngests(env, force = false, scheduledAt = null, options = {}) {
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

  if (String(env.INGEST_CLAN_ACTIVITY || "false").toLowerCase() === "true") {
    if (force || shouldRunClanActivitySchedule(env, scheduledAt)) {
      jobs.push({
        label: "clan-activity",
        run: () => handleClanActivityIngest(env, "schedule", {
          force,
          bypassRecentGuard: options.bypassActivityRecentGuard === true
        })
      });
    }
  }

  if (String(env.INGEST_PS99_VERSION_HISTORY || "false").toLowerCase() === "true") {
    if (force || shouldRunPs99VersionSchedule(env, scheduledAt)) {
      jobs.push({
        label: "ps99-versions",
        run: () => handlePs99VersionIngest(env, "schedule", { force })
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
        clans_fetched: payload?.clans_fetched ?? null,
        clan_activity_concurrency: payload?.clan_activity_concurrency ?? null,
        roster_rows_inserted: payload?.roster_rows_inserted ?? null,
        events_inserted: payload?.events_inserted ?? null,
        summary_rows_inserted: payload?.summary_rows_inserted ?? null,
        ps99_places_checked: payload?.places_checked ?? null,
        ps99_events_inserted: payload?.version_events_inserted ?? null,
        ps99_newest_version: payload?.newest_version ?? null,
        webhook_alert: payload?.webhook_alert || null,
        scan_error_count: Array.isArray(payload?.scan_errors) ? payload.scan_errors.length : null,
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
  const includeAvatars = !["0", "false", "no"].includes(String(url.searchParams.get("avatars") || "true").toLowerCase());
  const includeDowntime = !["0", "false", "no"].includes(String(url.searchParams.get("downtime") || "true").toLowerCase());
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
  const rowsWithDowntime = includeDowntime
    ? await addDowntimeFields(env, rowsWithGains, latest).catch(() => rowsWithGains.map(row => ({
      ...row,
      last_gain_at: null,
      downtime_minutes: null
    })))
    : rowsWithGains.map(row => ({
      ...row,
      last_gain_at: null,
      downtime_minutes: null
    }));
  const activeBattleMeta = !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  latest = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: !explicitBattle });
  const usernameMap = await resolveMissingUsernames(rowsWithDowntime, env);
  const avatarMap = includeAvatars
    ? await resolveRobloxAvatarHeadshots(
      rowsWithDowntime.map(row => row.user_id),
      env
    ).catch(() => new Map())
    : new Map();
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
    downtime_included: includeDowntime,
    avatars_included: includeAvatars,
    rows: rowsWithDowntime.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      username: displayUsername(row, usernameMap),
      user_id: toNumber(row.user_id),
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      join_time: memberJoinIso(row),
      total_points: toNumber(row.total_points) || 0,
      last_gain_at: row.last_gain_at || null,
      downtime_minutes: row.downtime_minutes,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h
    }))
  }, env, publicCacheSeconds(env, "CURRENT"));
}

async function handleHomeAwards(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const requestedBattle = String(url.searchParams.get("battle") || "").trim();
  const resultRaw = await supabaseRpc(env, "get_c0ld_home_awards", {
    p_clan_name: clan,
    p_battle_key: requestedBattle || null
  });
  const result = Array.isArray(resultRaw) ? resultRaw[0] : resultRaw;

  if (!result || typeof result !== "object") {
    throw httpError(502, "The home awards summary returned an invalid response.");
  }

  const awards = result.awards && typeof result.awards === "object" ? result.awards : {};
  const userIds = Object.values(awards)
    .map(award => toNumber(award?.user_id))
    .filter(Boolean);
  const avatarMap = await resolveRobloxAvatarHeadshots(userIds, env).catch(() => new Map());
  const enrichedAwards = Object.fromEntries(Object.entries(awards).map(([key, award]) => [
    key,
    award && typeof award === "object"
      ? {
          ...award,
          avatar_url: avatarMap.get(String(award.user_id)) || null
        }
      : null
  ]));

  return cacheJson({
    ...result,
    generated_at: new Date().toISOString(),
    source: "postgres_award_summary",
    awards: enrichedAwards
  }, env, 60);
}

async function handleGlobalCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000);

  const rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,raw_global,updated_at",
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
  }, env, publicCacheSeconds(env, "GLOBAL_CURRENT"));
}

async function handleGlobalLeaderboard(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 1000);
  const includeAvatars = ["1", "true", "yes"].includes(String(url.searchParams.get("avatars") || "").toLowerCase());
  const includeGains = !["0", "false", "no"].includes(String(url.searchParams.get("gains") || "true").toLowerCase());
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
  const userIdsNeedingLookup = rows
    .filter(row => !globalCandidateRawUsername(row))
    .map(row => toNumber(row.user_id))
    .filter(Boolean);
  const avatarUserIds = includeAvatars
    ? rows.map(row => toNumber(row.user_id)).filter(Boolean)
    : [];
  const snapshotAt = run.finished_at || run.updated_at || run.started_at || rows[0]?.fetched_at || null;
  const totalGlobalPlayers =
    toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    await countGlobalRankCandidates(env, run.run_key);

  const [usernameMap, avatarMap, gainMaps] = await Promise.all([
    resolveRobloxUsernames(userIdsNeedingLookup, env).catch(() => new Map()),
    includeAvatars ? resolveRobloxAvatarHeadshots(avatarUserIds, env).catch(() => new Map()) : new Map(),
    includeGains ? buildGlobalLeaderboardGainMaps(env, {
      clan,
      battleKey: run.battle_key,
      snapshotAt,
      userIds
    }).catch(() => ({})) : {}
  ]);

  const outputRows = rows.map(row => normalizeGlobalLeaderboardOutput(row, {
    run,
    usernameMap,
    avatarMap,
    gainMaps,
    totalGlobalPlayers
  }));

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    clan_name: clan,
    snapshot_at: snapshotAt,
    run,
    total_global_players: totalGlobalPlayers,
    gains_included: includeGains,
    avatars_included: includeAvatars,
    rows: includeGains ? addGlobalLeaderboardProjectionFields(outputRows) : outputRows
  }, env, publicCacheSeconds(env, includeGains ? "GLOBAL_LEADERBOARD" : "GLOBAL_LEADERBOARD_FAST"));
}

async function handleRewardCutoffs(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const rawType = String(url.searchParams.get("type") || "players").trim().toLowerCase();
  const type = rawType.startsWith("clan") ? "clans" : "players";
  const ranks = rewardCutoffRanks(url, env, type);

  if (type === "clans") {
    return cacheJson(await buildClanRewardCutoffs(url, env, ranks), env, publicCacheSeconds(env, "CLANS_CURRENT"));
  }

  return cacheJson(await buildPlayerRewardCutoffs(url, env, ranks), env, publicCacheSeconds(env, "GLOBAL_LEADERBOARD_FAST"));
}

async function buildPlayerRewardCutoffs(url, env, ranks) {
  const clan = url.searchParams.get("clan") || clanName(env);
  const run = await findLatestGlobalRankSearchRun(env, clan);

  if (!run?.run_key) {
    return {
      ok: false,
      type: "players",
      message: "No completed global rank scan is available yet.",
      clan_name: clan,
      ranks,
      cutoffs: []
    };
  }

  const byRank = await readGlobalRankRewardCutoffRows(env, run.run_key, ranks);
  const totalGlobalPlayers =
    toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    0;
  const snapshotAt = run.finished_at || run.updated_at || run.started_at || null;

  return {
    ok: true,
    type: "players",
    generated_at: new Date().toISOString(),
    clan_name: clan,
    snapshot_at: snapshotAt,
    battle: run.battle_key || null,
    display_name: cleanBattleDisplayName(run.battle_key, run.battle_display_name),
    event_name: run.event_name || run.battle_display_name || run.battle_key || null,
    total_ranked: totalGlobalPlayers,
    available_rank_max: totalGlobalPlayers || Math.max(...[...byRank.values()].map(row => toNumber(row?.global_rank) || 0), 0),
    ranks,
    cutoffs: ranks.map(rankValue => playerRewardCutoffRow(rankValue, byRank.get(rankValue), run, totalGlobalPlayers))
  };
}

async function readGlobalRankRewardCutoffRows(env, runKey, ranks) {
  const entries = await Promise.all([...new Set(ranks)].map(async rankValue => {
    const rows = await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      select: "user_id,points,source_clan,source_clan_rank,source_clan_points,battle_key,battle_display_name,fetched_at,raw_candidate,updated_at",
      run_key: `eq.${runKey}`,
      order: "points.desc,user_id.asc",
      limit: "1",
      offset: String(Math.max(0, rankValue - 1))
    });

    return [rankValue, rows[0] ? { ...rows[0], global_rank: rankValue } : null];
  }));

  return new Map(entries);
}

function playerRewardCutoffRow(rankValue, row, run, totalGlobalPlayers) {
  if (!row) {
    return {
      rank: rankValue,
      label: `Top ${rankValue.toLocaleString("en-US")}`,
      points: null,
      holder: null
    };
  }

  const userId = toNumber(row.user_id);
  const username = globalCandidateUsername(row, new Map());
  return {
    rank: rankValue,
    label: `Top ${rankValue.toLocaleString("en-US")}`,
    points: toNumber(row.points) || 0,
    holder: {
      user_id: userId,
      username,
      display_name: globalCandidateDisplayName(row) || username || (userId ? `user_${userId}` : null),
      source_clan: String(row.source_clan || "").trim() || null,
      source_clan_rank: toNumber(row.source_clan_rank),
      source_clan_points: toNumber(row.source_clan_points)
    },
    battle_key: row.battle_key || run?.battle_key || null,
    battle_display_name: cleanBattleDisplayName(row.battle_key || run?.battle_key, row.battle_display_name || run?.battle_display_name),
    total_ranked: toNumber(totalGlobalPlayers),
    fetched_at: row.fetched_at || run?.finished_at || run?.updated_at || null
  };
}

async function buildClanRewardCutoffs(url, env, ranks) {
  const requestedBattle = url.searchParams.get("battle") || "";
  const explicitBattle =
    requestedBattle &&
    !["current", "auto"].includes(String(requestedBattle).toLowerCase());
  const maxRank = Math.max(...ranks);

  let latest = null;
  let rows = [];

  if (explicitBattle) {
    latest = await fetchLatestClanSnapshotMeta(env, requestedBattle);
    if (latest) rows = await fetchClanSnapshotRows(env, latest.snapshot_id, maxRank);
  } else {
    rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, {
      select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,clan_name,points,icon_id,icon_url",
      order: "rank.asc",
      limit: String(maxRank)
    });
    latest = latestClanMetaFromRows(rows);
  }

  const activeBattleMeta = latest && !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  const latestWithActiveMeta = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: !explicitBattle });
  const byRank = new Map(rows.map(row => [toNumber(row.rank), row]));
  const liveCutoffs = !explicitBattle
    ? await fetchLiveClanRewardCutoffRows(env, ranks.filter(rankValue => !byRank.has(rankValue))).catch(() => new Map())
    : new Map();

  for (const [rankValue, row] of liveCutoffs.entries()) {
    if (row && !byRank.has(rankValue)) byRank.set(rankValue, row);
  }
  const availableRankMax = Math.max(
    rows.reduce((max, row) => Math.max(max, toNumber(row.rank) || 0), 0),
    ...[...liveCutoffs.values()].map(row => toNumber(row?.rank) || 0)
  );

  return {
    ok: true,
    type: "clans",
    generated_at: new Date().toISOString(),
    snapshot_at: latestWithActiveMeta?.fetched_at || null,
    battle: latestWithActiveMeta?.battle_key || null,
    display_name: latestWithActiveMeta
      ? cleanBattleDisplayName(latestWithActiveMeta.battle_key, latestWithActiveMeta.battle_display_name)
      : null,
    battle_start_iso: latestWithActiveMeta?.battle_started_at || null,
    battle_end_iso: latestWithActiveMeta?.battle_ended_at || null,
    total_ranked: rows.length,
    available_rank_max: availableRankMax,
    ranks,
    cutoffs: ranks.map(rankValue => clanRewardCutoffRow(rankValue, byRank.get(rankValue)))
  };
}

async function fetchLiveClanRewardCutoffRows(env, ranks) {
  const uniqueRanks = [...new Set((ranks || []).map(value => Math.round(Number(value))).filter(value => Number.isFinite(value) && value > 0))];
  if (!uniqueRanks.length) return new Map();

  const pageSize = globalRankClanPageSize(env);
  const cache = new Map();
  const entries = await Promise.all(uniqueRanks.map(async rankValue => {
    const row = await fetchClanRankRowAtOffset(env, rankValue - 1, pageSize, cache);
    return [rankValue, row ? { ...row, fetched_at: new Date().toISOString(), source: "live_clan_leaderboard" } : null];
  }));

  return new Map(entries);
}

function clanRewardCutoffRow(rankValue, row) {
  if (!row) {
    return {
      rank: rankValue,
      label: `Top ${rankValue.toLocaleString("en-US")}`,
      points: null,
      holder: null
    };
  }

  return {
    rank: rankValue,
    label: `Top ${rankValue.toLocaleString("en-US")}`,
    points: toNumber(row.points) || 0,
    holder: {
      clan_name: row.clan_name || null,
      icon_id: row.icon_id || null,
      icon_url: row.icon_url || null
    },
    fetched_at: row.fetched_at || null
  };
}

function rewardCutoffRanks(url, env, type) {
  const isClans = type === "clans";
  const raw = String(
    url.searchParams.get("ranks") ||
    (isClans ? env.CLAN_REWARD_CUTOFF_RANKS : env.PLAYER_REWARD_CUTOFF_RANKS) ||
    ""
  );
  const fallback = isClans ? DEFAULT_CLAN_REWARD_CUTOFF_RANKS : DEFAULT_PLAYER_REWARD_CUTOFF_RANKS;
  const maxRank = isClans ? 10000 : 100000;
  const parsed = raw
    .split(/[,\s]+/)
    .map(value => Math.round(Number(value)))
    .filter(value => Number.isFinite(value) && value >= 1 && value <= maxRank);
  const normalizedRaw = [...new Set(parsed)].sort((a, b) => a - b).join(",");
  const ranks = parsed.length && (!isClans || normalizedRaw !== LEGACY_CLAN_REWARD_CUTOFF_RANKS)
    ? parsed
    : fallback;

  return [...new Set(ranks)]
    .sort((a, b) => a - b)
    .slice(0, 20);
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

function postgrestInFilter(values) {
  const quoted = (values || [])
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .map(value => `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`);

  return `in.(${quoted.join(",")})`;
}

function robloxLookupConcurrency(env) {
  return clamp(Number(env.ROBLOX_LOOKUP_CONCURRENCY || 2), 1, 5);
}

function robloxLookupRetryAttempts(env) {
  return clamp(Number(env.ROBLOX_LOOKUP_RETRIES || 3), 1, 6);
}

function robloxLookupRetryBaseMs(env) {
  return clamp(Number(env.ROBLOX_LOOKUP_RETRY_BASE_MS || 750), 100, 10000);
}

function shouldRetryRobloxResponse(response) {
  return response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
}

function retryAfterMs(response, fallbackMs) {
  const raw = response.headers.get("Retry-After");
  if (!raw) return fallbackMs;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = new Date(raw).getTime();
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : fallbackMs;
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
    avatar_url: avatarMap.get(String(userId)) || null,
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

function addGlobalLeaderboardProjectionFields(rows) {
  const topRows = (rows || [])
    .map((row, index) => ({ row, index }))
    .filter(item => {
      const rank = toNumber(item.row.global_rank);
      return rank !== null && rank >= 1 && rank <= 100;
    });

  if (!topRows.length) return rows;

  const projectedRows = topRows.map(item => {
    const rate = chooseGlobalLeaderboardProjectionRate(item.row);

    const points = toNumber(item.row.points) || 0;
    return {
      ...item,
      projected: {
        projected_gain_1h: Math.round(rate.rate_per_hour),
        projected_points_1h: Math.round(points + rate.rate_per_hour),
        projection_basis: rate.basis,
        projected_rank: null,
        projected_rank_1h: null
      }
    };
  });

  const rankable = projectedRows
    .filter(item => item.projected)
    .sort((a, b) => {
      const ap = toNumber(a.projected.projected_points_1h) ?? toNumber(a.row.points) ?? 0;
      const bp = toNumber(b.projected.projected_points_1h) ?? toNumber(b.row.points) ?? 0;
      if (bp !== ap) return bp - ap;

      const ar = toNumber(a.row.global_rank);
      const br = toNumber(b.row.global_rank);
      if (ar !== null && br !== null && ar !== br) return ar - br;

      return (toNumber(a.row.user_id) || 0) - (toNumber(b.row.user_id) || 0);
    });

  const projectedByIndex = new Map();
  rankable.forEach((item, index) => {
    projectedByIndex.set(item.index, {
      ...item.projected,
      projected_rank: index + 1,
      projected_rank_1h: index + 1
    });
  });

  return rows.map((row, index) => {
    const projected = projectedByIndex.get(index);
    if (!projected) {
      return {
        ...row,
        projected_rank: null,
        projected_rank_1h: null,
        projected_points_1h: null,
        projected_gain_1h: null,
        projection_basis: null
      };
    }

    return { ...row, ...projected };
  });
}

function chooseGlobalLeaderboardProjectionRate(row) {
  const windows = [
    { key: "gain_1h", basis: "1h", hours: 1 },
    { key: "gain_5m", basis: "5m", hours: 5 / 60 },
    { key: "gain_12h", basis: "12h", hours: 12 },
    { key: "gain_24h", basis: "24h", hours: 24 }
  ];

  for (const window of windows) {
    const gain = toNumber(row[window.key]);
    if (gain === null) continue;

    return {
      basis: window.basis,
      rate_per_hour: gain / window.hours
    };
  }

  return { basis: "current", rate_per_hour: 0 };
}

function globalCandidateUsername(row, usernameMap) {
  const userId = toNumber(row.user_id);
  const resolved = String(usernameMap.get(userId) || "").trim();
  if (resolved && !isFallbackUsername(resolved, userId)) return resolved;

  const rawName = globalCandidateRawUsername(row);
  if (rawName) return rawName;
  return userId ? `user_${userId}` : "";
}

function globalCandidateRawUsername(row) {
  const userId = toNumber(row?.user_id);
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

  return rawName && !isFallbackUsername(rawName, userId) ? rawName : "";
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

function candidateMemberRankFromRaw(row) {
  const raw = parseGlobalCandidateRaw(row?.raw_candidate);
  return toNumber(firstDefined(
    raw.member_rank,
    raw.memberRank,
    raw.member?.member_rank,
    raw.member?.memberRank,
    raw.member?.Rank,
    raw.member?.rank,
    raw.contribution?.member_rank,
    raw.contribution?.memberRank,
    raw.contribution?.Rank,
    raw.contribution?.rank,
    raw.contribution?.Position,
    raw.contribution?.position
  ));
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
          member_rank: toNumber(found.clan_rank) || candidateResult.row.member_rank,
          member_points: toNumber(found.clan_points) || candidateResult.row.member_points,
          clan_member_count: toNumber(run?.clan_member_count) || null,
          source_clan: found.clan_name || clan
        },
        run
      }, env);
    }

    return cacheJson(candidateResult, env);
  }

  const history = await supabaseSelect(env, GLOBAL_RANK_HISTORY_TABLE, {
    select: "run_key,fetched_at,event_name,battle_key,battle_display_name,global_rank,global_points,total_global_players,clan_rank,clan_points,found",
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

  const run = runRows[0] || null;
  const historyRunKeys = [...new Set(history.map(row => String(row.run_key || "").trim()).filter(Boolean))];
  const historyRuns = historyRunKeys.length
    ? await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
      select: "run_key,battle_key,battle_display_name,event_name,total_global_players,candidate_player_count,finished_at,updated_at,started_at",
      run_key: historyRunKeys.length === 1 ? `eq.${historyRunKeys[0]}` : postgrestInFilter(historyRunKeys),
      limit: String(historyRunKeys.length)
    })
    : [];
  const historyRunMap = new Map(historyRuns.map(row => [String(row.run_key), row]));
  const leaderboardName = globalRankLeaderboardLabel(env, run || found);

  return cacheJson({
    ok: true,
    query,
    clan_name: clan,
    row: {
      ...normalizeGlobalCurrentOutput(found),
      leaderboard_name: leaderboardName,
      event_name: leaderboardName,
      clan_member_count: toNumber(run?.clan_member_count) || null
    },
    run: run ? { ...run, leaderboard_name: leaderboardName, event_name: leaderboardName } : null,
    history: history.map(row => {
      const rowRun = historyRunMap.get(String(row.run_key || "")) || (String(row.run_key || "") === String(run?.run_key || "") ? run : null);
      const rowLeaderboardName = globalRankLeaderboardLabel(env, rowRun || row);

      return {
        ...row,
        leaderboard_name: rowLeaderboardName,
        event_name: rowLeaderboardName,
        global_rank: toNumber(row.global_rank),
        global_points: toNumber(row.global_points),
        total_global_players: toNumber(row.total_global_players),
        clan_rank: toNumber(row.clan_rank),
        clan_points: toNumber(row.clan_points)
      };
    })
  }, env);
}

async function handleExternalHistory(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const userId = toNumber(url.searchParams.get("user_id"));
  const source = String(url.searchParams.get("source") || "cw_bot").trim() || "cw_bot";
  const status = String(url.searchParams.get("status") || "approved").trim().toLowerCase();
  const limit = clamp(Number(url.searchParams.get("limit") || 200), 1, 500);

  if (!userId) {
    throw httpError(400, "Missing user_id.");
  }

  if (status !== "approved") {
    requireAdmin(request, env);
  }

  const rows = await supabaseSelect(env, EXTERNAL_PLAYER_HISTORY_TABLE, {
    select: "source,user_id,username,battle_key,battle_name,clan_name,final_rank,total_ranked,final_points,final_snapshot_at,status,is_manual_import,import_batch_id,imported_from,discord_message_url,image_url,created_at,updated_at,reviewed_at,reviewed_by",
    source: `eq.${source}`,
    user_id: `eq.${userId}`,
    status: status === "all" ? undefined : `eq.${status || "approved"}`,
    order: "final_snapshot_at.desc.nullslast,created_at.desc",
    limit: String(limit)
  }).catch(err => {
    if (String(err?.message || "").includes("c0ld_external_player_history")) return [];
    throw err;
  });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    user_id: userId,
    source,
    status,
    rows: rows.map(normalizeExternalHistoryOutput)
  }, env, 30);
}

async function handleCwBotHistoryImport(request, env) {
  requireSupabase(env);

  if (String(env.CW_BOT_IMPORT_ENABLED || "false").toLowerCase() !== "true") {
    throw httpError(403, "CW_Bot imports are not enabled. Set CW_BOT_IMPORT_ENABLED=true on the Worker.");
  }

  if (String(env.CW_BOT_IMPORT_REQUIRE_ADMIN || "false").toLowerCase() === "true") {
    requireAdmin(request, env);
  }

  const body = await readJsonRequest(request);
  const userId = toNumber(body.user_id || body.roblox_user_id);
  const username = stringOrNull(body.username || body.display_name || body.query);
  const messageUrl = String(body.message_url || body.discord_message_url || "").trim();

  if (!userId) throw httpError(400, "Missing user_id.");
  if (!messageUrl) throw httpError(400, "Missing message_url.");

  const messageRef = parseDiscordMessageLink(messageUrl);
  validateCwBotImportTarget(messageRef, env);

  const message = await fetchDiscordMessage(env, messageRef.channelId, messageRef.messageId);
  const expectedBotId = String(env.CW_BOT_USER_ID || DEFAULT_CW_BOT_USER_ID);
  const authorId = String(message?.author?.id || "");

  if (authorId !== expectedBotId) {
    throw httpError(400, `Discord message author ${authorId || "unknown"} is not CW_Bot (${expectedBotId}).`);
  }

  const messageText = discordMessageText(message);
  const imageUrl = firstDiscordMessageImageUrl(message);
  let parseSource = "discord_message";
  let parsed = parseCwBotHistoryText(messageText);
  let ocrText = "";

  if (!parsed.rows.length && imageUrl) {
    ocrText = await ocrCwBotHistoryImage(env, imageUrl, { userId, username }).catch(err => {
      if (err?.status) throw err;
      throw httpError(502, `CW_Bot OCR failed: ${err?.message || String(err)}`);
    });

    if (ocrText) {
      parseSource = "discord_image_ocr";
      parsed = parseCwBotHistoryText(ocrText);
    }
  }

  if (!parsed.rows.length) {
    return json({
      ok: false,
      message: imageUrl && !env.OPENAI_API_KEY
        ? "CW_Bot message looks image-only. Set OPENAI_API_KEY and CW_BOT_OCR_MODEL to enable image OCR."
        : "No CW_Bot history rows could be parsed from that message.",
      user_id: userId,
      discord_message_url: canonicalDiscordMessageUrl(messageRef),
      image_url: imageUrl || null,
      raw_text_preview: messageText.slice(0, 1000)
    }, 422);
  }

  const preventOverwrite = historyImportFlag(env, "CW_BOT_IMPORT_PREVENT_OVERWRITE", null, "true");
  const [trackedKeys, existingKeys] = await Promise.all([
    trackedHistoryBattleKeySet(env, userId),
    preventOverwrite ? externalHistoryBattleKeySet(env, userId) : Promise.resolve(new Set())
  ]);
  const importedAt = new Date().toISOString();
  const importStatus = String(env.CW_BOT_IMPORT_AUTO_APPROVE || "false").toLowerCase() === "true"
    ? "approved"
    : "pending";
  const rawFingerprintBase = await sha256Hex([
    "cw_bot",
    userId,
    messageRef.guildId,
    messageRef.channelId,
    messageRef.messageId,
    messageText,
    ocrText
  ].join("\n"));
  const rows = [];
  const skipped = [];
  const queuedKeys = new Set();

  for (const parsedRow of parsed.rows) {
    const battleName = cleanExternalBattleName(parsedRow.battle_name || parsedRow.battle || parsedRow.label);
    const battleKeyValue = externalBattleKey(battleName);

    if (!battleName || !battleKeyValue) {
      skipped.push({ reason: "missing_battle", row: parsedRow });
      continue;
    }

    if (queuedKeys.has(battleKeyValue)) {
      skipped.push({ reason: "duplicate_in_message", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    if (trackedKeys.has(battleKeyValue)) {
      skipped.push({ reason: "already_tracked", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    if (preventOverwrite && existingKeys.has(battleKeyValue)) {
      skipped.push({ reason: "already_imported", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    const finalRank = toNumber(parsedRow.final_rank ?? parsedRow.rank);
    const totalRanked = toNumber(parsedRow.total_ranked ?? parsedRow.total);
    const finalPoints = parseCwBotNumber(parsedRow.final_points ?? parsedRow.points);

    if (finalRank === null && finalPoints === null) {
      skipped.push({ reason: "missing_rank_and_points", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    rows.push({
      source: "cw_bot",
      user_id: userId,
      username: stringOrNull(parsed.player_name || username),
      battle_key: battleKeyValue,
      battle_name: battleName,
      clan_name: stringOrNull(parsedRow.clan_name || parsedRow.clan),
      final_rank: finalRank,
      total_ranked: totalRanked,
      final_points: finalPoints,
      final_snapshot_at: safeIso(parsedRow.final_snapshot_at || parsedRow.date) || safeIso(message.timestamp) || importedAt,
      status: importStatus,
      is_manual_import: true,
      import_batch_id: rawFingerprintBase,
      imported_from: parseSource,
      discord_guild_id: messageRef.guildId,
      discord_channel_id: messageRef.channelId,
      discord_message_id: messageRef.messageId,
      discord_message_url: canonicalDiscordMessageUrl(messageRef),
      image_url: imageUrl || null,
      raw_text: (ocrText || messageText || "").slice(0, 20000),
      raw_payload: {
        parser: parseSource,
        discord_author_id: authorId,
        discord_message_id: messageRef.messageId,
        parsed_row: parsedRow
      },
      raw_fingerprint: `${rawFingerprintBase}:${battleKeyValue}`,
      updated_at: importedAt
    });
    queuedKeys.add(battleKeyValue);
  }

  if (rows.length) {
    await supabaseUpsertChunked(env, EXTERNAL_PLAYER_HISTORY_TABLE, rows, "source,user_id,battle_key", 100);
  }

  return json({
    ok: true,
    user_id: userId,
    source: "cw_bot",
    discord_message_url: canonicalDiscordMessageUrl(messageRef),
    prevent_overwrite: preventOverwrite,
    parsed_count: parsed.rows.length,
    status: importStatus,
    imported_count: rows.length,
    skipped_count: skipped.length,
    rows: rows.map(normalizeExternalHistoryOutput),
    skipped
  });
}

async function handleBigBotHistoryImport(request, env) {
  requireSupabase(env);

  if (!historyImportFlag(env, "BIG_BOT_IMPORT_ENABLED", "CW_BOT_IMPORT_ENABLED")) {
    throw httpError(403, "Big Bot imports are not enabled. Set BIG_BOT_IMPORT_ENABLED=true on the Worker.");
  }

  if (historyImportFlag(env, "BIG_BOT_IMPORT_REQUIRE_ADMIN", "CW_BOT_IMPORT_REQUIRE_ADMIN")) {
    requireAdmin(request, env);
  }

  const body = await readJsonRequest(request);
  const userId = toNumber(body.user_id || body.roblox_user_id);
  const username = stringOrNull(body.username || body.display_name || body.query);
  const messageUrl = String(body.message_url || body.discord_message_url || "").trim();

  if (!userId) throw httpError(400, "Missing user_id.");
  if (!messageUrl) throw httpError(400, "Missing message_url.");

  const messageRef = parseDiscordMessageLink(messageUrl);
  validateBigBotImportTarget(messageRef, env);

  const message = await fetchDiscordMessage(env, messageRef.channelId, messageRef.messageId);
  const expectedBotId = String(env.BIG_BOT_USER_ID || DEFAULT_BIG_BOT_USER_ID);
  const authorId = String(message?.author?.id || "");

  if (authorId !== expectedBotId) {
    throw httpError(400, `Discord message author ${authorId || "unknown"} is not Big Bot (${expectedBotId}).`);
  }

  const messageText = discordMessageText(message);
  const parsed = parseBigBotHistoryText(messageText);

  if (!parsed.rows.length) {
    return json({
      ok: false,
      message: "No Big Bot clan battle history rows could be parsed from that message.",
      user_id: userId,
      discord_message_url: canonicalDiscordMessageUrl(messageRef),
      raw_text_preview: messageText.slice(0, 1000)
    }, 422);
  }

  if (parsed.player_name && username && normalizeText(parsed.player_name) !== normalizeText(username)) {
    throw httpError(400, `That Big Bot history belongs to ${parsed.player_name}, not ${username}.`);
  }

  const preventOverwrite = historyImportFlag(env, "BIG_BOT_IMPORT_PREVENT_OVERWRITE", null, "true");
  const [trackedKeys, existingKeys] = await Promise.all([
    trackedHistoryBattleKeySet(env, userId),
    preventOverwrite ? externalHistoryBattleKeySet(env, userId) : Promise.resolve(new Set())
  ]);
  const importedAt = new Date().toISOString();
  const importStatus = historyImportFlag(env, "BIG_BOT_IMPORT_AUTO_APPROVE", "CW_BOT_IMPORT_AUTO_APPROVE")
    ? "approved"
    : "pending";
  const rawFingerprintBase = await sha256Hex([
    "big_bot",
    userId,
    messageRef.guildId,
    messageRef.channelId,
    messageRef.messageId,
    messageText
  ].join("\n"));
  const rows = [];
  const skipped = [];
  const queuedKeys = new Set();

  for (const parsedRow of parsed.rows) {
    const battleName = cleanExternalBattleName(parsedRow.battle_name || parsedRow.battle || parsedRow.label);
    const battleKeyValue = externalBattleKey(battleName);

    if (!battleName || !battleKeyValue) {
      skipped.push({ reason: "missing_battle", row: parsedRow });
      continue;
    }

    if (queuedKeys.has(battleKeyValue)) {
      skipped.push({ reason: "duplicate_in_message", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    if (trackedKeys.has(battleKeyValue)) {
      skipped.push({ reason: "already_tracked", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    if (preventOverwrite && existingKeys.has(battleKeyValue)) {
      skipped.push({ reason: "already_imported", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    const finalRank = toNumber(parsedRow.final_rank ?? parsedRow.rank);
    const finalPoints = parseCwBotNumber(parsedRow.final_points ?? parsedRow.points);

    if (finalRank === null && finalPoints === null) {
      skipped.push({ reason: "missing_rank_and_points", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    rows.push({
      source: "big_bot",
      user_id: userId,
      username: stringOrNull(parsed.player_name || username),
      battle_key: battleKeyValue,
      battle_name: battleName,
      clan_name: stringOrNull(parsedRow.clan_name || parsedRow.clan || parsed.current_clan),
      final_rank: finalRank,
      total_ranked: null,
      final_points: finalPoints,
      final_snapshot_at: safeIso(message.edited_timestamp || message.timestamp) || importedAt,
      status: importStatus,
      is_manual_import: true,
      import_batch_id: rawFingerprintBase,
      imported_from: "discord_message_text",
      discord_guild_id: messageRef.guildId,
      discord_channel_id: messageRef.channelId,
      discord_message_id: messageRef.messageId,
      discord_message_url: canonicalDiscordMessageUrl(messageRef),
      image_url: null,
      raw_text: messageText.slice(0, 20000),
      raw_payload: {
        parser: "big_bot_text",
        discord_author_id: authorId,
        discord_message_id: messageRef.messageId,
        page: parsed.page,
        pages: parsed.pages,
        parsed_row: parsedRow
      },
      raw_fingerprint: `${rawFingerprintBase}:${battleKeyValue}`,
      updated_at: importedAt
    });
    queuedKeys.add(battleKeyValue);
  }

  if (rows.length) {
    await supabaseUpsertChunked(env, EXTERNAL_PLAYER_HISTORY_TABLE, rows, "source,user_id,battle_key", 100);
  }

  return json({
    ok: true,
    user_id: userId,
    source: "big_bot",
    player_name: parsed.player_name || username || null,
    page: parsed.page,
    pages: parsed.pages,
    discord_message_url: canonicalDiscordMessageUrl(messageRef),
    prevent_overwrite: preventOverwrite,
    parsed_count: parsed.rows.length,
    status: importStatus,
    imported_count: rows.length,
    skipped_count: skipped.length,
    rows: rows.map(normalizeExternalHistoryOutput),
    skipped
  });
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
  const [higherCount, tiedBeforeCount, memberHigherCount, memberTiedBeforeCount, avatarMap] = await Promise.all([
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${run.run_key}`,
      points: `gt.${points}`
    }),
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${run.run_key}`,
      points: `eq.${points}`,
      user_id: `lt.${userId}`
    }),
    countHigherSourceClanMembers(env, run.run_key, candidate),
    countTiedBeforeSourceClanMembers(env, run.run_key, candidate),
    resolveRobloxAvatarHeadshots([userId], env).catch(() => new Map())
  ]);
  const total = toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    await countGlobalRankCandidates(env, run.run_key);

  const username = lookup.username || (await resolveRobloxUsernames([userId], env)
    .then(map => map.get(userId))
    .catch(() => `user_${userId}`));

  const row = normalizeGlobalCandidateSearchOutput(candidate, {
    run,
    globalRank: higherCount + tiedBeforeCount + 1,
    memberRank: memberHigherCount + memberTiedBeforeCount + 1,
    totalGlobalPlayers: total,
    username,
    displayName: lookup.display_name,
    avatarUrl: avatarMap.get(userId) || null
  });
  const leaderboardName = globalRankLeaderboardLabel(env, run);
  row.leaderboard_name = leaderboardName;
  row.event_name = leaderboardName;
  const history = await searchGlobalRankCandidateHistory(env, clan, userId, row);

  return {
    ok: true,
    query,
    clan_name: clan,
    run: { ...run, leaderboard_name: leaderboardName, event_name: leaderboardName },
    row,
    history
  };
}

async function searchGlobalRankCandidateHistory(env, clan, userId, currentRow = null) {
  const limit = globalRankCandidateHistoryLimit(env);
  const runs = (await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "run_key,battle_key,battle_display_name,event_name,finished_at,updated_at,started_at,total_global_players,candidate_player_count,scan_limit,scanned_count,scanned_clan_count,clan_member_count,found_member_count,stop_reason,status",
    clan_name: `eq.${clan}`,
    status: "in.(ok,completed)",
    order: "finished_at.desc",
    limit: String(limit + 12)
  }))
    .filter(isUsableCompletedGlobalRankRun)
    .slice(0, limit);

  if (!runs.length) return [];

  const rows = [];
  for (const runChunk of chunkValues(runs.map(run => run.run_key).filter(Boolean), 25)) {
    if (!runChunk.length) continue;

    rows.push(...await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      select: "run_key,user_id,points,source_clan,source_clan_rank,source_clan_points,battle_key,battle_display_name,fetched_at,raw_candidate,updated_at",
      run_key: runChunk.length === 1 ? `eq.${runChunk[0]}` : postgrestInFilter(runChunk),
      user_id: `eq.${userId}`,
      order: "fetched_at.desc,points.desc,user_id.asc",
      limit: String(runChunk.length * 10)
    }));
  }

  const byRun = new Map();
  for (const row of rows) {
    const runKey = String(row.run_key || "").trim();
    if (!runKey) continue;

    const normalized = {
      ...row,
      user_id: toNumber(row.user_id),
      points: toNumber(row.points) || 0
    };
    const existing = byRun.get(runKey);
    if (!existing || sortGlobalCandidateRows(normalized, existing) < 0) {
      byRun.set(runKey, normalized);
    }
  }

  const currentRunKey = String(currentRow?.run_key || "").trim();
  const summaries = runs
    .map(run => {
      const candidate = byRun.get(run.run_key);
      if (!candidate) return null;

      const isCurrent = currentRunKey && currentRunKey === run.run_key;
      const memberRank = isCurrent
        ? toNumber(currentRow.member_rank)
        : candidateMemberRankFromRaw(candidate);
      const totalGlobalPlayers = toNumber(run.total_global_players) ||
        toNumber(run.candidate_player_count) ||
        toNumber(currentRow?.total_global_players);
      const leaderboardName = globalRankLeaderboardLabel(env, run);

      return {
        run_key: run.run_key,
        user_id: toNumber(candidate.user_id),
        fetched_at: candidate.fetched_at || run.finished_at || run.updated_at || run.started_at || null,
        event_name: leaderboardName,
        leaderboard_name: leaderboardName,
        battle_key: candidate.battle_key || run.battle_key || null,
        battle_display_name: cleanBattleDisplayName(
          candidate.battle_key || run.battle_key,
          candidate.battle_display_name || run.battle_display_name
        ),
        source_clan: candidate.source_clan || null,
        source_clan_rank: toNumber(candidate.source_clan_rank),
        source_clan_points: toNumber(candidate.source_clan_points) || 0,
        source_clan_leaderboard_rank: toNumber(candidate.source_clan_rank),
        source_clan_leaderboard_points: toNumber(candidate.source_clan_points) || 0,
        member_rank: memberRank,
        member_points: toNumber(candidate.points),
        clan_rank: memberRank,
        clan_points: toNumber(candidate.points),
        global_rank: isCurrent ? toNumber(currentRow.global_rank) : null,
        global_points: toNumber(candidate.points),
        total_global_players: totalGlobalPlayers,
        found: true
      };
    })
    .filter(Boolean);

  const withGlobalRanks = [];
  for (const batch of chunkValues(summaries, 6)) {
    withGlobalRanks.push(...await Promise.all(batch.map(async row => {
      if (toNumber(row.global_rank) !== null) return row;

      const points = toNumber(row.global_points);
      const userIdValue = toNumber(row.user_id);
      if (!row.run_key || points === null || !userIdValue) return row;

      const [higherCount, tiedBeforeCount] = await Promise.all([
        supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
          run_key: `eq.${row.run_key}`,
          points: `gt.${points}`
        }),
        supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
          run_key: `eq.${row.run_key}`,
          points: `eq.${points}`,
          user_id: `lt.${userIdValue}`
        })
      ]);

      return {
        ...row,
        global_rank: higherCount + tiedBeforeCount + 1
      };
    })));
  }

  return withGlobalRanks
    .map(({ user_id, ...row }) => row)
    .sort((a, b) => new Date(b.fetched_at || 0) - new Date(a.fetched_at || 0));
}

async function countHigherSourceClanMembers(env, runKey, row) {
  const points = toNumber(row?.points);
  const sourceClan = String(row?.source_clan || "").trim();
  if (!runKey || points === null || !sourceClan) return 0;

  return supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    run_key: `eq.${runKey}`,
    source_clan: `eq.${sourceClan}`,
    points: `gt.${points}`
  });
}

async function countTiedBeforeSourceClanMembers(env, runKey, row) {
  const points = toNumber(row?.points);
  const userId = toNumber(row?.user_id);
  const sourceClan = String(row?.source_clan || "").trim();
  if (!runKey || points === null || !userId || !sourceClan) return 0;

  return supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    run_key: `eq.${runKey}`,
    source_clan: `eq.${sourceClan}`,
    points: `eq.${points}`,
    user_id: `lt.${userId}`
  });
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
      const retentionCleanup = await cleanupGlobalRankRetention(env, {
        clan,
        currentRunKey: runKey,
        currentBattleKey: latest?.battle_key || null,
        currentBattleEndedAt: latest?.battle_ended_at || null
      }).catch(err => {
        console.warn("global rank retention cleanup failed", err?.message || String(err));
        return null;
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
        published_current: publishCurrent,
        retention_cleanup: retentionCleanup
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
      const retentionCleanup = await cleanupGlobalRankRetention(env, {
        clan,
        currentRunKey: runKey,
        currentBattleKey: latest?.battle_key || null,
        currentBattleEndedAt: latest?.battle_ended_at || null
      }).catch(err => {
        console.warn("global rank retention cleanup failed", err?.message || String(err));
        return null;
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
        retention_cleanup: retentionCleanup,
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
  const offset = clamp(Number(url.searchParams.get("offset") || 0), 0, 10000000);
  const afterIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const orderDir = String(url.searchParams.get("order_dir") || url.searchParams.get("order") || "desc").toLowerCase() === "asc"
    ? "asc"
    : "desc";

  const params = {
    select: "snapshot_id,fetched_at,clan_name,battle_key,rank,user_id,username,total_points",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    fetched_at: `gte.${afterIso}`,
    order: `fetched_at.${orderDir},rank.asc`,
    limit: String(limit),
    offset: String(offset)
  };

  if (userId) {
    params.user_id = `eq.${userId}`;
  }

  const rows = await supabaseSelectPaged(env, SNAPSHOT_TABLE, params, limit, 1000);

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    battle,
    hours,
    limit,
    offset,
    has_more: rows.length === limit,
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
  }, env, publicCacheSeconds(env, "CLANS_CURRENT"));
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
  const orderDir = String(url.searchParams.get("order_dir") || url.searchParams.get("order") || "desc").toLowerCase() === "asc"
    ? "asc"
    : "desc";

  const params = {
    select: "snapshot_id,fetched_at,battle_key,rank,clan_name,points,icon_id,icon_url",
    battle_key: `eq.${battle}`,
    fetched_at: `gte.${afterIso}`,
    order: `fetched_at.${orderDir},rank.asc`,
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
  const detailClan = String(url.searchParams.get("clan") || "").trim();
  const detailClanKey = normalizeText(detailClan);
  const includeMembers = ["1", "true", "yes", "y"].includes(
    String(url.searchParams.get("include_members") || url.searchParams.get("members") || "").trim().toLowerCase()
  );
  const filter1Threshold = parseRebirthThreshold(
    firstDefined(url.searchParams.get("filter1"), url.searchParams.get("high"), url.searchParams.get("highThreshold"), "100")
  );
  const filter2Threshold = parseRebirthThreshold(
    firstDefined(url.searchParams.get("filter2"), url.searchParams.get("mid"), "90")
  );
  const filter3Threshold = parseRebirthThreshold(
    firstDefined(url.searchParams.get("filter3"), url.searchParams.get("low"), url.searchParams.get("lowThreshold"), "75")
  );

  if (!Number.isFinite(filter1Threshold) || filter1Threshold <= 0) {
    throw httpError(400, "Filter 1 is invalid.");
  }

  if (!Number.isFinite(filter2Threshold) || filter2Threshold <= 0) {
    throw httpError(400, "Filter 2 is invalid.");
  }

  if (!Number.isFinite(filter3Threshold) || filter3Threshold <= 0) {
    throw httpError(400, "Filter 3 is invalid.");
  }

  if (!(filter1Threshold > filter2Threshold && filter2Threshold > filter3Threshold)) {
    throw httpError(400, "Filters must be ordered from highest to lowest.");
  }

  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  let topClans = await fetchTopClans(env, top);
  if (detailClanKey) {
    topClans = topClans.filter(clan => normalizeText(clan.clan_name) === detailClanKey);
  }
  const generatedAt = new Date().toISOString();
  const rows = [];
  let selectedBattleKey = activeBattleMeta?.battleKey || configuredBattleKey;
  let selectedBattleDisplayName = activeBattleMeta?.displayName || prettifyBattleKey(selectedBattleKey) || selectedBattleKey;
  const previousActivity = await fetchPreviousTopClanMemberPoints(env, {
    battleKey: selectedBattleKey,
    referenceIso: generatedAt,
    clanNames: topClans.map(clan => clan.clan_name)
  }).catch(err => ({
    run: null,
    pointsByMember: new Map(),
    error: err?.message || String(err)
  }));

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
      const usernameMap = includeMembers
        ? await resolveRobloxUsernames(members.map(member => member.user_id), env).catch(() => new Map())
        : new Map();
      const counts = countThresholdMembers(
        members,
        filter1Threshold,
        filter2Threshold,
        filter3Threshold,
        {
          referenceIso: generatedAt,
          clanName: clan.clan_name,
          previousPoints: previousActivity.pointsByMember,
          includeMembers,
          usernameMap
        }
      );

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
        active_count: counts.active_count,
        hatching_count: counts.hatching_count,
        filter1_count: counts.filter1_count,
        filter2_count: counts.filter2_count,
        filter3_count: counts.filter3_count,
        under_filter3_count: counts.under_filter3_count,
        high_count: counts.high_count,
        low_count: counts.low_count,
        below_low_count: counts.below_low_count,
        member_count: counts.member_count,
        members: includeMembers ? counts.members : undefined,
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
    clan: detailClan || null,
    include_members: includeMembers,
    filter1Threshold,
    filter2Threshold,
    filter3Threshold,
    rebirthDivisor: TOP_CLAN_REBIRTH_POINTS,
    battle: selectedBattleKey,
    display_name: cleanBattleDisplayName(selectedBattleKey, selectedBattleDisplayName),
    activeBattle: {
      configName: cleanBattleDisplayName(selectedBattleKey, selectedBattleDisplayName),
      battleKey: selectedBattleKey
    },
    activity: {
      source: previousActivity.run ? "global_rank_candidates" : "fallback",
      baseline_run_key: previousActivity.run?.run_key || null,
      baseline_finished_at: previousActivity.run?.finished_at || previousActivity.run?.updated_at || null,
      baseline_member_count: previousActivity.pointsByMember?.size || 0,
      matched_clans: previousActivity.matchedClans || 0,
      error: previousActivity.error || null
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
    active_count: 0,
    hatching_count: 0,
    filter1_count: 0,
    filter2_count: 0,
    filter3_count: 0,
    under_filter3_count: 0,
    high_count: 0,
    low_count: 0,
    below_low_count: 0,
    member_count: 0,
    error
  };
}

function countThresholdMembers(members, filter1Threshold, filter2Threshold, filter3Threshold, options = {}) {
  const referenceMs = isoToMs(options.referenceIso) || Date.now();
  const activeAfterMs = referenceMs - 60 * 60 * 1000;
  const clanKey = normalizeText(options.clanName);
  const previousPoints = options.previousPoints || new Map();
  const includeMembers = options.includeMembers === true;
  const usernameMap = options.usernameMap || new Map();
  const counts = {
    active_count: 0,
    hatching_count: 0,
    filter1_count: 0,
    filter2_count: 0,
    filter3_count: 0,
    under_filter3_count: 0,
    high_count: 0,
    low_count: 0,
    below_low_count: 0,
    member_count: members.length,
    total_points: 0,
    members: includeMembers ? {
      active: [],
      hatching: [],
      filter1: [],
      filter2: [],
      filter3: [],
      under_filter3: []
    } : undefined
  };

  for (const member of members) {
    const points = toNumber(member.total_points) || 0;
    const rebirths = points / TOP_CLAN_REBIRTH_POINTS;
    const previous = previousPoints.get(topClanMemberPointKey(clanKey, member.user_id));
    const contributionMs = contributionTimestampMs(member);
    const detail = includeMembers ? topClanThresholdMemberDetail(member, points, rebirths, usernameMap) : null;
    counts.total_points += points;

    if (previous !== undefined) {
      if (points > previous) {
        counts.active_count += 1;
        if (includeMembers) counts.members.active.push(detail);
      } else {
        counts.hatching_count += 1;
        if (includeMembers) counts.members.hatching.push(detail);
      }
    } else if (points > 0 && contributionMs && contributionMs >= activeAfterMs) {
      counts.active_count += 1;
      if (includeMembers) counts.members.active.push(detail);
    } else {
      counts.hatching_count += 1;
      if (includeMembers) counts.members.hatching.push(detail);
    }

    if (rebirths >= filter1Threshold) {
      counts.filter1_count += 1;
      if (includeMembers) counts.members.filter1.push(detail);
    } else if (rebirths >= filter2Threshold) {
      counts.filter2_count += 1;
      if (includeMembers) counts.members.filter2.push(detail);
    } else if (rebirths >= filter3Threshold) {
      counts.filter3_count += 1;
      if (includeMembers) counts.members.filter3.push(detail);
    } else {
      counts.under_filter3_count += 1;
      if (includeMembers) counts.members.under_filter3.push(detail);
    }
  }

  counts.high_count = counts.filter2_count;
  counts.low_count = counts.filter3_count;
  counts.below_low_count = counts.under_filter3_count;
  if (includeMembers) {
    for (const bucket of Object.values(counts.members)) {
      bucket.sort((a, b) =>
        (toNumber(b.points) || 0) - (toNumber(a.points) || 0) ||
        String(a.username || "").localeCompare(String(b.username || ""))
      );
    }
  }

  return counts;
}

function topClanThresholdMemberDetail(member, points, rebirths, usernameMap) {
  const rawMember = member?.raw_member || {};
  const rawContribution = member?.raw_contribution || {};
  const userId = toNumber(member?.user_id);
  const username = displayUsername({
    user_id: userId,
    username: firstDefined(
      rawContribution.Username,
      rawContribution.username,
      rawContribution.Name,
      rawContribution.name,
      rawMember.Username,
      rawMember.username,
      rawMember.Name,
      rawMember.name
    )
  }, usernameMap);

  return {
    user_id: userId,
    username: username || (userId ? `user_${userId}` : ""),
    display_name: stringOrNull(firstDefined(
      rawContribution.DisplayName,
      rawContribution.displayName,
      rawContribution.display_name,
      rawMember.DisplayName,
      rawMember.displayName,
      rawMember.display_name
    )),
    points,
    rebirths: Number.isFinite(rebirths) ? rebirths : 0
  };
}

async function fetchPreviousTopClanMemberPoints(env, { battleKey, referenceIso, clanNames }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { run: null, pointsByMember: new Map(), error: "Supabase is not configured." };
  }

  const referenceMs = isoToMs(referenceIso) || Date.now();
  const targetMs = referenceMs - 60 * 60 * 1000;
  const run = await findClosestGlobalRankRun(env, {
    battleKey,
    targetMs,
    referenceMs,
    toleranceMinutes: 45
  });

  if (!run?.run_key) {
    return { run: null, pointsByMember: new Map(), error: "No one-hour global scan baseline found." };
  }

  const pointsByMember = new Map();
  const wantedClans = new Set((clanNames || [])
    .map(name => normalizeText(name))
    .filter(Boolean));
  const matchedClans = new Set();

  const rows = await supabaseSelectPaged(env, GLOBAL_RANK_CANDIDATES_TABLE, {
    select: "user_id,points,source_clan",
    run_key: `eq.${run.run_key}`,
    order: "source_clan.asc,user_id.asc"
  }, globalRankCandidateReadLimit(env));

  for (const row of rows) {
    const clanKey = normalizeText(row.source_clan);
    if (!clanKey || (wantedClans.size && !wantedClans.has(clanKey))) continue;

    const userId = toNumber(row.user_id);
    const points = toNumber(row.points);
    if (!userId || points === null) continue;

    matchedClans.add(clanKey);

    const key = topClanMemberPointKey(clanKey, userId);
    const existing = pointsByMember.get(key);
    if (existing === undefined || points > existing) pointsByMember.set(key, points);
  }

  return { run, pointsByMember, matchedClans: matchedClans.size, error: null };
}

async function findClosestGlobalRankRun(env, { battleKey, targetMs, referenceMs, toleranceMinutes }) {
  const params = {
    select: "run_key,finished_at,updated_at,started_at,battle_key,status",
    status: "in.(ok,completed)",
    finished_at: `lt.${new Date(referenceMs).toISOString()}`,
    order: "finished_at.desc",
    limit: "200"
  };

  const normalizedBattle = normalizeText(battleKey);
  if (normalizedBattle && normalizedBattle !== "auto") {
    params.battle_key = `eq.${battleKey}`;
  }

  const runs = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, params);
  const toleranceMs = toleranceMinutes * 60 * 1000;
  let best = null;
  let bestDistance = Infinity;

  for (const row of runs) {
    const rowMs = isoToMs(row.finished_at || row.updated_at || row.started_at);
    if (!rowMs) continue;

    const distance = Math.abs(rowMs - targetMs);
    if (distance <= toleranceMs && distance < bestDistance) {
      best = row;
      bestDistance = distance;
    }
  }

  return best;
}

function topClanMemberPointKey(clanKey, userId) {
  return `${clanKey}:${String(userId || "").trim()}`;
}

function memberJoinIso(member) {
  const rawMember = member?.raw_member || {};
  return safeIso(firstDefined(
    member?.join_time,
    member?.joined_at,
    rawMember.JoinTime,
    rawMember.joinTime,
    rawMember.join_time,
    rawMember.JoinedAt,
    rawMember.joinedAt,
    rawMember.joined_at,
    rawMember.Joined,
    rawMember.joined
  ));
}

function contributionTimestampMs(member) {
  const raw = member?.raw_contribution || {};
  const rawMember = member?.raw_member || {};
  const candidate = firstDefined(
    raw.LastContributionAt,
    raw.lastContributionAt,
    raw.LastContribution,
    raw.lastContribution,
    raw.LastContributedAt,
    raw.lastContributedAt,
    raw.Timestamp,
    raw.timestamp,
    raw.UpdatedAt,
    raw.updatedAt,
    raw.Updated,
    raw.updated,
    rawMember.LastContributionAt,
    rawMember.lastContributionAt,
    rawMember.LastContribution,
    rawMember.lastContribution,
    rawMember.LastContributedAt,
    rawMember.lastContributedAt,
    rawMember.Timestamp,
    rawMember.timestamp,
    rawMember.UpdatedAt,
    rawMember.updatedAt,
    rawMember.Updated,
    rawMember.updated
  );
  const iso = safeIso(candidate);
  return iso ? isoToMs(iso) : null;
}

async function handleClanActivityIngest(env, source, options = {}) {
  requireSupabase(env);

  const force = typeof options === "boolean" ? options : options.force === true;
  const bypassRecentGuard = typeof options === "object" && options.bypassRecentGuard === true;
  const fetchedAt = new Date().toISOString();
  const configuredBattleKey = battleKey(env);
  const trackedClan = clanName(env);
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
      scope: "clan-activity",
      source,
      clan: trackedClan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey: activeBattleMeta?.battleKey || configuredBattleKey,
      battleMeta: activeBattleMeta,
      gate: activeGate
    });
  }

  const trackedApi = await fetchClanApiWithRetry(env, trackedClan);
  const trackedBattles = trackedApi.data?.Battles || trackedApi.data?.battles || {};
  const resolvedBattleKey = resolveBattleKey(
    trackedBattles,
    configuredBattleKey,
    env,
    activeBattleMeta?.battleKey
  );
  const trackedBattle = resolvedBattleKey ? trackedBattles[resolvedBattleKey] : null;
  const battleMeta = mergeBattleMeta(
    extractBattleMeta(trackedBattle || {}, resolvedBattleKey, env, {
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
      scope: "clan-activity",
      source,
      clan: trackedClan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey,
      battleMeta,
      gate: ingestGate
    });
  }

  const recentSnapshotGate = await clanActivityRecentSnapshotGate(env, resolvedBattleKey, fetchedAt, bypassRecentGuard);
  if (!recentSnapshotGate.allowed) {
    return skippedIngestResponse({
      scope: "clan-activity",
      source,
      clan: trackedClan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey,
      battleMeta,
      gate: recentSnapshotGate
    });
  }

  const topN = clanActivityTopN(env);
  const topClans = await fetchTopClans(env, topN);
  const previousRows = await fetchClanActivityCurrentRows(env, resolvedBattleKey).catch(() => []);
  const previousSummaries = await fetchClanActivitySummaryRows(env, resolvedBattleKey).catch(() => []);
  const previousByClanUser = new Map(previousRows.map(row => [clanActivityMemberKey(row.clan_name, row.user_id), row]));
  const previousByClan = groupRowsByNormalizedClan(previousRows);
  const previousSummaryByClan = new Map(previousSummaries.map(row => [normalizeText(row.clan_name), row]));
  const snapshotId = `clan-activity:${resolvedBattleKey}:${fetchedAt}`;
  const delayMs = clanActivityClanDelayMs(env);
  const concurrency = clanActivityConcurrency(env);
  const rosterRows = [];
  const summaryRows = [];
  const eventRows = [];
  const scanErrors = [];
  let fetchedClans = 0;

  await runLimited(topClans.map((clanRow, index) => ({ clanRow, index })), concurrency, async ({ clanRow, index }) => {
    if (delayMs > 0) {
      await sleep((index % concurrency) * delayMs);
    }

    try {
      const api = await fetchClanApiWithRetry(env, clanRow.clan_name);
      const data = api.data || {};
      const battles = data.Battles || data.battles || {};
      const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;
      const members = battle ? normalizeMembers(data, battle) : [];
      const usernameMap = await resolveRobloxUsernames(members.map(member => member.user_id), env)
        .catch(() => new Map());
      const clanKey = normalizeText(clanRow.clan_name);
      const previousClanRows = previousByClan.get(clanKey) || [];
      const previousClanByUser = new Map(previousClanRows.map(row => [String(row.user_id), row]));
      const currentByUser = new Map();
      const kickAvailable = extractKickAvailable(data);
      const rawMemberCount = members.length;

      fetchedClans += 1;

      for (const [memberIndex, member] of members.entries()) {
        const row = clanActivityRosterRow({
          snapshotId,
          fetchedAt,
          source,
          battleKey: resolvedBattleKey,
          battleMeta,
          clanRow,
          clanData: data,
          member,
          memberRank: memberIndex + 1,
          usernameMap,
          kickAvailable,
          memberCount: rawMemberCount
        });

        const memberKey = String(row.user_id);
        const existing = currentByUser.get(memberKey);
        if (existing) {
          const existingPoints = toNumber(existing.points) || 0;
          const rowPoints = toNumber(row.points) || 0;
          const existingRank = toNumber(existing.member_rank) || Number.MAX_SAFE_INTEGER;
          const rowRank = toNumber(row.member_rank) || Number.MAX_SAFE_INTEGER;
          if (existingPoints > rowPoints || (existingPoints === rowPoints && existingRank <= rowRank)) {
            continue;
          }
        }

        currentByUser.set(memberKey, row);
      }

      const currentClanRows = [...currentByUser.values()]
        .sort((a, b) => (toNumber(a.member_rank) || Number.MAX_SAFE_INTEGER) - (toNumber(b.member_rank) || Number.MAX_SAFE_INTEGER));
      const memberCount = currentClanRows.length;

      for (const row of currentClanRows) {
        row.member_count = memberCount;
        rosterRows.push(row);
      }

      const previousSummary = previousSummaryByClan.get(clanKey);
      const firstSeen = previousSummary?.first_seen_at || fetchedAt;
      const startingMembers = toNumber(previousSummary?.starting_members) ?? (
        previousClanRows.length ? previousClanRows.length : memberCount
      );
      const increments = clanActivityIncrements({
        clanRow,
        currentByUser,
        previousClanByUser,
        previousSummary,
        fetchedAt,
        battleKey: resolvedBattleKey,
        battleMeta,
        source,
        kickAvailable
      });

      eventRows.push(...increments.events);

      summaryRows.push({
        battle_key: resolvedBattleKey,
        battle_display_name: battleMeta.displayName,
        battle_started_at: battleMeta.startedAt,
        battle_ended_at: battleMeta.endedAt,
        clan_name: clanRow.clan_name,
        clan_key: clanKey,
        clan_rank: clanRow.rank,
        previous_clan_rank: toNumber(previousSummary?.clan_rank),
        clan_points: clanRow.points,
        icon_id: clanRow.icon_id || null,
        icon_url: clanRow.icon_url || null,
        kick_available: kickAvailable,
        starting_members: startingMembers,
        current_members: memberCount,
        new_members: (toNumber(previousSummary?.new_members) || 0) + increments.newMembers,
        lost_members: (toNumber(previousSummary?.lost_members) || 0) + increments.lostMembers,
        promotions: (toNumber(previousSummary?.promotions) || 0) + increments.promotions,
        demotions: (toNumber(previousSummary?.demotions) || 0) + increments.demotions,
        rank_changes: (toNumber(previousSummary?.rank_changes) || 0) + increments.rankChanges,
        first_seen_at: firstSeen,
        last_seen_at: fetchedAt,
        latest_snapshot_id: snapshotId,
        updated_at: fetchedAt,
        raw_clan: clanRow.raw_clan || {}
      });
    } catch (err) {
      scanErrors.push({
        clan_name: clanRow.clan_name,
        rank: clanRow.rank,
        message: err?.message || String(err)
      });
    }
  });

  if (!rosterRows.length && scanErrors.length) {
    throw httpError(502, `Clan activity scan failed before collecting any roster rows: ${scanErrors[0].message}`);
  }

  await supabaseInsertChunked(env, CLAN_ACTIVITY_ROSTER_TABLE, rosterRows, 500);
  const currentRows = rosterRows.map(row => ({
    ...row,
    updated_at: fetchedAt
  }));
  await supabaseDelete(env, CLAN_ACTIVITY_CURRENT_TABLE, {
    battle_key: `eq.${resolvedBattleKey}`
  });
  await supabaseInsertChunked(env, CLAN_ACTIVITY_CURRENT_TABLE, currentRows, 500);

  if (eventRows.length) {
    await supabaseUpsertChunked(env, CLAN_ACTIVITY_EVENTS_TABLE, eventRows, "event_id", 500);
  }

  await supabaseUpsertChunked(
    env,
    CLAN_ACTIVITY_SUMMARY_TABLE,
    summaryRows,
    "battle_key,clan_key",
    500
  );

  return json({
    ok: true,
    source,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    clans_requested: topClans.length,
    clans_fetched: fetchedClans,
    clan_activity_concurrency: concurrency,
    roster_rows_inserted: rosterRows.length,
    events_inserted: eventRows.length,
    summary_rows_inserted: summaryRows.length,
    scan_errors: scanErrors.slice(0, 25)
  }, 202);
}

async function handleClanActivitySummary(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const requestedBattle = url.searchParams.get("battle") || "";
  const battle = await resolveActivityBattleKey(env, requestedBattle);
  const [summaryRows, eventRows] = await Promise.all([
    supabaseSelect(env, CLAN_ACTIVITY_SUMMARY_TABLE, {
      select: "battle_key,battle_display_name,battle_started_at,battle_ended_at,clan_name,clan_rank,previous_clan_rank,clan_points,icon_id,icon_url,kick_available,starting_members,current_members,new_members,lost_members,promotions,demotions,rank_changes,first_seen_at,last_seen_at,latest_snapshot_id,updated_at",
      battle_key: `eq.${battle}`,
      order: "last_seen_at.desc,clan_rank.asc",
      limit: "500"
    }),
    supabaseSelectPaged(env, CLAN_ACTIVITY_EVENTS_TABLE, {
      select: "event_id,event_at,event_type,clan_name,clan_key,user_id,previous_value,current_value,previous_rank,current_rank",
      battle_key: `eq.${battle}`,
      order: "event_id.asc"
    }, 25000, 1000).catch(() => [])
  ]);
  const latestSnapshotId = summaryRows[0]?.latest_snapshot_id || null;
  const currentRows = (latestSnapshotId
    ? summaryRows.filter(row => row.latest_snapshot_id === latestSnapshotId)
    : summaryRows)
    .sort((a, b) => (toNumber(a.clan_rank) || Number.MAX_SAFE_INTEGER) - (toNumber(b.clan_rank) || Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
  const eventCounters = clanActivityEventCounters(eventRows);
  const rows = currentRows.map(row => {
    const normalized = normalizeClanActivitySummaryOutput(row);
    const recovered = eventCounters.get(normalizeText(row.clan_key || row.clan_name));
    if (!recovered) return normalized;

    return {
      ...normalized,
      new_members: Math.max(normalized.new_members, recovered.newMembers),
      lost_members: Math.max(normalized.lost_members, recovered.lostMembers),
      promotions: Math.max(normalized.promotions, recovered.promotions),
      demotions: Math.max(normalized.demotions, recovered.demotions),
      rank_changes: Math.max(normalized.rank_changes, recovered.rankChanges)
    };
  });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    battle,
    display_name: cleanBattleDisplayName(battle, currentRows[0]?.battle_display_name),
    snapshot_at: rows[0]?.last_seen_at || null,
    rows
  }, env);
}

async function handleClanActivityStatus(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const requestedBattle = url.searchParams.get("battle") || "";
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const battle = await resolveActivityBattleKey(env, requestedBattle).catch(() => activeBattleMeta?.battleKey || battleKey(env));
  const config = clanActivityRuntimeConfig(env);
  const requestedScheduledAt = url.searchParams.get("scheduled_at")
    ? new Date(url.searchParams.get("scheduled_at"))
    : null;
  const scheduledAt = requestedScheduledAt instanceof Date && !Number.isNaN(requestedScheduledAt.getTime())
    ? requestedScheduledAt
    : new Date();

  const [summaryRows, latestRosterRows, latestEvents, rosterCount, currentCount, eventCount] = await Promise.all([
    supabaseSelect(env, CLAN_ACTIVITY_SUMMARY_TABLE, {
      select: "battle_key,battle_display_name,clan_name,clan_rank,starting_members,current_members,new_members,lost_members,promotions,demotions,rank_changes,last_seen_at,latest_snapshot_id,updated_at",
      battle_key: `eq.${battle}`,
      order: "clan_rank.asc",
      limit: "500"
    }).catch(err => ({ __error: err?.message || String(err) })),
    supabaseSelect(env, CLAN_ACTIVITY_ROSTER_TABLE, {
      select: "snapshot_id,fetched_at,source,battle_key,clan_name,clan_rank",
      battle_key: `eq.${battle}`,
      order: "fetched_at.desc",
      limit: "5"
    }).catch(err => ({ __error: err?.message || String(err) })),
    supabaseSelect(env, CLAN_ACTIVITY_EVENTS_TABLE, {
      select: "event_id,event_at,event_type,clan_name,username,user_id,previous_rank,current_rank",
      battle_key: `eq.${battle}`,
      order: "event_at.desc",
      limit: "10"
    }).catch(err => ({ __error: err?.message || String(err) })),
    supabaseCount(env, CLAN_ACTIVITY_ROSTER_TABLE, { battle_key: `eq.${battle}` }).catch(() => null),
    supabaseCount(env, CLAN_ACTIVITY_CURRENT_TABLE, { battle_key: `eq.${battle}` }).catch(() => null),
    supabaseCount(env, CLAN_ACTIVITY_EVENTS_TABLE, { battle_key: `eq.${battle}` }, "event_id").catch(() => null)
  ]);

  const summaryError = summaryRows?.__error || null;
  const rosterError = latestRosterRows?.__error || null;
  const eventError = latestEvents?.__error || null;
  const summaries = Array.isArray(summaryRows) ? summaryRows : [];
  const rosters = Array.isArray(latestRosterRows) ? latestRosterRows : [];
  const events = Array.isArray(latestEvents) ? latestEvents : [];
  const latestSnapshotId = summaries[0]?.latest_snapshot_id || rosters[0]?.snapshot_id || null;

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    battle,
    active_battle_key: activeBattleMeta?.battleKey || null,
    active_battle_display_name: activeBattleMeta?.displayName || null,
    config,
    would_run_now: config.ingest_clan_activity && shouldRunClanActivitySchedule(env, scheduledAt),
    scheduled_probe_at: scheduledAt.toISOString(),
    row_counts: {
      summary_clans: summaries.length,
      roster_rows: rosterCount,
      current_rows: currentCount,
      events: eventCount
    },
    latest_snapshot_id: latestSnapshotId,
    latest_snapshot_at: summaries[0]?.last_seen_at || rosters[0]?.fetched_at || null,
    latest_events: events,
    errors: {
      summary: summaryError,
      roster: rosterError,
      events: eventError
    }
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function handleClanActivityDetail(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = String(url.searchParams.get("clan") || "").trim();
  if (!clan) throw httpError(400, "Missing required clan.");

  const requestedBattle = url.searchParams.get("battle") || "";
  const limit = clamp(Number(url.searchParams.get("limit") || 250), 1, 1000);
  const battle = await resolveActivityBattleKey(env, requestedBattle);
  const summaryRows = await supabaseSelect(env, CLAN_ACTIVITY_SUMMARY_TABLE, {
    select: "*",
    battle_key: `eq.${battle}`,
    clan_key: `eq.${normalizeText(clan)}`,
    limit: "1"
  });
  const rosterRows = await supabaseSelect(env, CLAN_ACTIVITY_CURRENT_TABLE, {
    select: "user_id,username,display_name,avatar_url,role,permission_level,join_time,points,member_rank,fetched_at",
    battle_key: `eq.${battle}`,
    clan_key: `eq.${normalizeText(clan)}`,
    order: "points.desc,username.asc",
    limit: "100"
  });
  const eventRows = await supabaseSelect(env, CLAN_ACTIVITY_EVENTS_TABLE, {
    select: "*",
    battle_key: `eq.${battle}`,
    clan_key: `eq.${normalizeText(clan)}`,
    order: "event_at.desc,created_at.desc",
    limit: String(limit)
  });

  const clanEventTypes = new Set([
    "member_joined",
    "member_left",
    "member_kicked",
    "member_promoted",
    "member_demoted",
    "kick_available",
    "kick_used",
    "kick_available_changed"
  ]);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    battle,
    display_name: cleanBattleDisplayName(battle, summaryRows[0]?.battle_display_name),
    clan_name: summaryRows[0]?.clan_name || clan,
    summary: summaryRows[0] ? normalizeClanActivitySummaryOutput(summaryRows[0]) : null,
    roster: rosterRows.map(normalizeClanActivityRosterOutput),
    clan_events: eventRows.filter(row => clanEventTypes.has(row.event_type)).map(normalizeClanActivityEventOutput),
    rank_events: eventRows.filter(row => row.event_type === "rank_up" || row.event_type === "rank_down").map(normalizeClanActivityEventOutput)
  }, env);
}

async function handleClanActivityFeed(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const requestedBattle = url.searchParams.get("battle") || "";
  const limit = clamp(Number(url.searchParams.get("limit") || 200), 1, 1000);
  const battle = await resolveActivityBattleKey(env, requestedBattle);
  const rows = await supabaseSelect(env, CLAN_ACTIVITY_EVENTS_TABLE, {
    select: "*",
    battle_key: `eq.${battle}`,
    order: "event_at.desc,created_at.desc",
    limit: String(limit)
  });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    battle,
    display_name: cleanBattleDisplayName(battle, rows[0]?.battle_display_name),
    clan_events: rows
      .filter(row => row.event_type !== "rank_up" && row.event_type !== "rank_down")
      .map(normalizeClanActivityEventOutput),
    rank_events: rows
      .filter(row => row.event_type === "rank_up" || row.event_type === "rank_down")
      .map(normalizeClanActivityEventOutput)
  }, env);
}

async function handlePs99Versions(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || DEFAULT_PS99_VERSION_HISTORY_LIMIT), 1, 500);
  const places = await supabaseSelect(env, PS99_PLACES_TABLE, {
    select: "universe_id,place_id,place_name,root_place,is_active,latest_version,latest_published_at,latest_checked_at,updated_at",
    is_active: "eq.true",
    order: "root_place.desc,place_name.asc",
    limit: "500"
  });
  const events = await supabaseSelect(env, PS99_VERSION_EVENTS_TABLE, {
    select: "event_id,universe_id,place_id,place_name,previous_version,current_version,previous_published_at,current_published_at,detected_at,source,created_at",
    order: "detected_at.desc,id.desc",
    limit: String(limit)
  });
  const newestPlace = [...places].sort((a, b) => {
    const versionDelta = (toNumber(b.latest_version) || 0) - (toNumber(a.latest_version) || 0);
    if (versionDelta) return versionDelta;
    return isoToMs(b.latest_checked_at) - isoToMs(a.latest_checked_at);
  })[0] || null;
  const newestEvent = events[0] || null;

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    universe_id: ps99UniverseId(env),
    root_place_id: ps99RootPlaceId(env),
    newest_version: toNumber(newestEvent?.current_version) ?? toNumber(newestPlace?.latest_version),
    newest_place_name: newestEvent?.place_name || newestPlace?.place_name || null,
    newest_detected_at: newestEvent?.detected_at || newestPlace?.latest_checked_at || null,
    places: places.map(normalizePs99PlaceOutput),
    events: events.map(normalizePs99VersionEventOutput)
  }, env, publicCacheSeconds(env, "PS99_VERSION_HISTORY"));
}

async function handlePs99VersionIngest(env, source, options = {}) {
  requireSupabase(env);

  const fetchedAt = new Date().toISOString();
  const universeId = ps99UniverseId(env);
  const refreshPlaces = String(env.PS99_REFRESH_PLACE_LIST || "true").toLowerCase() !== "false";
  const scanErrors = [];
  let fetchedPlaces = [];

  if (refreshPlaces) {
    try {
      fetchedPlaces = await fetchPs99UniversePlaces(env);
      if (fetchedPlaces.length) {
        await supabaseUpsert(env, PS99_PLACES_TABLE, fetchedPlaces.map(place => ({
          universe_id: universeId,
          place_id: place.placeId,
          place_name: place.placeName,
          root_place: place.rootPlace,
          is_active: true,
          raw_place: place.rawPlace,
          updated_at: fetchedAt
        })), "place_id");
      }
    } catch (err) {
      scanErrors.push({
        scope: "place_list",
        message: err?.message || String(err)
      });
    }
  }

  const existingPlaces = await fetchPs99WatchedPlaces(env, fetchedAt);
  const places = existingPlaces.length ? existingPlaces : fetchedPlaces.map(place => ({
    universe_id: universeId,
    place_id: place.placeId,
    place_name: place.placeName,
    root_place: place.rootPlace,
    latest_version: null,
    latest_published_at: null
  }));
  const placeRows = [];
  const eventRows = [];
  let webhookAlert = { configured: Boolean(ps99AlertWebhookRaw(env)), posted: false, reason: "no_version_change" };

  for (const place of places) {
    const placeId = toNumber(place.place_id || place.placeId);
    if (!placeId) continue;

    try {
      const previousVersion = toNumber(place.latest_version);
      const previousPublishedAt = safeIso(place.latest_published_at);
      const version = await fetchPs99LatestPlaceVersion(
        env,
        placeId,
        previousVersion ?? ps99VersionSeedHint(placeId),
        previousPublishedAt
      );
      const latestVersion = toNumber(version.version);
      const latestPublishedAt = safeIso(version.publishedAt);
      const placeName = stringOrNull(place.place_name || place.placeName) || `Place ${placeId}`;

      placeRows.push({
        universe_id: universeId,
        place_id: placeId,
        place_name: placeName,
        root_place: Boolean(place.root_place || place.rootPlace || placeId === ps99RootPlaceId(env)),
        is_active: true,
        latest_version: latestVersion,
        latest_published_at: latestPublishedAt,
        latest_checked_at: fetchedAt,
        raw_place: parseJsonObject(place.raw_place) || place.rawPlace || {},
        raw_version: version.rawVersion || {},
        updated_at: fetchedAt
      });

      if (latestVersion !== null && latestVersion !== previousVersion) {
        eventRows.push({
          event_id: `ps99:${placeId}:${latestVersion}`,
          universe_id: universeId,
          place_id: placeId,
          place_name: placeName,
          previous_version: previousVersion,
          current_version: latestVersion,
          previous_published_at: previousPublishedAt,
          current_published_at: latestPublishedAt,
          detected_at: fetchedAt,
          source,
          raw_version: version.rawVersion || {}
        });
      }
    } catch (err) {
      scanErrors.push({
        scope: "place_version",
        place_id: placeId,
        place_name: place.place_name || place.placeName || null,
        message: err?.message || String(err)
      });
    }

    const delayMs = ps99VersionPlaceDelayMs(env);
    if (delayMs > 0) await sleep(delayMs);
  }

  if (placeRows.length) {
    await supabaseUpsert(env, PS99_PLACES_TABLE, placeRows, "place_id");
  }

  if (eventRows.length) {
    await supabaseUpsert(env, PS99_VERSION_EVENTS_TABLE, eventRows, "event_id");
    const alertRows = eventRows.filter(row => (toNumber(row.previous_version) || 0) > 0);
    webhookAlert = alertRows.length
      ? await postPs99VersionAlert(env, alertRows, fetchedAt)
      : { configured: Boolean(ps99AlertWebhookRaw(env)), posted: false, reason: "initial_version_baseline" };
  }

  const newest = [...placeRows].sort((a, b) => (toNumber(b.latest_version) || 0) - (toNumber(a.latest_version) || 0))[0] || null;

  return json({
    ok: true,
    source,
    universe_id: universeId,
    root_place_id: ps99RootPlaceId(env),
    fetched_at: fetchedAt,
    places_discovered: fetchedPlaces.length,
    places_checked: placeRows.length,
    version_events_inserted: eventRows.length,
    newest_place_name: newest?.place_name || null,
    newest_version: newest?.latest_version ?? null,
    webhook_alert: webhookAlert,
    scan_errors: scanErrors.slice(0, 25)
  }, 202);
}

async function fetchPs99WatchedPlaces(env, fetchedAt) {
  let rows = await supabaseSelect(env, PS99_PLACES_TABLE, {
    select: "universe_id,place_id,place_name,root_place,is_active,latest_version,latest_published_at,raw_place",
    is_active: "eq.true",
    order: "root_place.desc,place_name.asc",
    limit: "500"
  });

  if (rows.length) return rows;

  const rootPlace = {
    universe_id: ps99UniverseId(env),
    place_id: ps99RootPlaceId(env),
    place_name: "Pet Simulator 99",
    root_place: true,
    is_active: true,
    latest_checked_at: fetchedAt,
    updated_at: fetchedAt,
    raw_place: {}
  };
  await supabaseUpsert(env, PS99_PLACES_TABLE, [rootPlace], "place_id");
  rows = await supabaseSelect(env, PS99_PLACES_TABLE, {
    select: "universe_id,place_id,place_name,root_place,is_active,latest_version,latest_published_at,raw_place",
    is_active: "eq.true",
    order: "root_place.desc,place_name.asc",
    limit: "500"
  });

  return rows;
}

async function fetchPs99UniversePlaces(env) {
  const url = new URL(`https://develop.roblox.com/v1/universes/${ps99UniverseId(env)}/places`);
  url.searchParams.set("sortOrder", "Asc");
  url.searchParams.set("limit", "100");
  const payload = await fetchJsonWithRetry(url, "Roblox universe places", {
    attempts: 3,
    baseDelayMs: 1000
  });
  const rows = extractRobloxArray(payload);
  const places = rows
    .map(row => normalizePs99UniversePlace(row, env))
    .filter(row => row.placeId);
  const rootPlaceId = ps99RootPlaceId(env);

  if (!places.some(place => place.placeId === rootPlaceId)) {
    places.unshift({
      placeId: rootPlaceId,
      placeName: "Pet Simulator 99",
      rootPlace: true,
      rawPlace: {}
    });
  }

  return places;
}

async function fetchPs99LatestPlaceVersion(env, placeId, knownVersion = null, knownPublishedAt = null) {
  const probe = await findLatestPs99PlaceVersion(placeId, knownVersion);
  let publishedAt = safeIso(knownPublishedAt);
  let assetDetails = null;

  if (probe.version !== toNumber(knownVersion) || !publishedAt) {
    const detailsUrl = new URL(`https://economy.roblox.com/v2/assets/${placeId}/details`);
    assetDetails = await fetchJsonWithRetry(detailsUrl, "Roblox place details", {
      attempts: 3,
      baseDelayMs: 1000
    });
    publishedAt = safeIso(firstDefined(assetDetails.Updated, assetDetails.updated));
  }

  return {
    version: probe.version,
    publishedAt,
    rawVersion: {
      source: "asset_delivery_boundary",
      versionNumber: probe.version,
      probeCount: probe.probeCount,
      publishedAtSource: "economy_asset_updated",
      assetUpdated: publishedAt,
      ...(assetDetails && typeof assetDetails === "object" ? {
        assetName: stringOrNull(firstDefined(assetDetails.Name, assetDetails.name))
      } : {})
    }
  };
}

async function findLatestPs99PlaceVersion(placeId, knownVersion = null) {
  let probeCount = 0;
  const exists = async version => {
    probeCount += 1;
    return probePs99PlaceVersion(placeId, version);
  };
  const known = Math.max(0, Math.floor(toNumber(knownVersion) || 0));
  let low = known;
  let high;

  if (known > 0) {
    high = known + 1;
    if (!await exists(high)) {
      return { version: known, probeCount };
    }
    low = high;
    high = known + 2;
  } else {
    if (!await exists(1)) {
      return { version: null, probeCount };
    }
    low = 1;
    high = 2;
  }

  while (await exists(high)) {
    low = high;
    const distance = Math.max(1, high - known);
    high = known + distance * 2;

    if (!Number.isSafeInteger(high) || high > 1_000_000_000) {
      throw httpError(502, `Roblox place ${placeId} version search exceeded the safety limit`);
    }
  }

  while (low + 1 < high) {
    const midpoint = Math.floor((low + high) / 2);
    if (await exists(midpoint)) low = midpoint;
    else high = midpoint;
  }

  return { version: low, probeCount };
}

async function probePs99PlaceVersion(placeId, version) {
  const url = new URL("https://assetdelivery.roblox.com/v1/asset/");
  url.searchParams.set("id", String(placeId));
  url.searchParams.set("version", String(version));
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url.toString(), {
        redirect: "manual",
        headers: {
          Accept: "application/json",
          "User-Agent": "c0ld-Clan-API-Worker"
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      const text = await res.text();
      const message = robloxAssetDeliveryMessage(text).toLowerCase();

      if (res.status === 404 || message.includes("not found")) return false;
      if (res.status === 409 || message.includes("not authorized")) return true;
      if (res.status >= 200 && res.status < 400) return true;

      const retryAfter = parseRetryAfterSeconds(res.headers.get("Retry-After"));
      const err = httpError(
        res.status || 502,
        message || `Roblox asset version probe failed with HTTP ${res.status}`
      );
      err.retryAfterMs = retryAfter ? retryAfter * 1000 : null;
      throw err;
    } catch (err) {
      lastError = err;
      if (attempt >= 3) break;

      const retryAfterMs = Number(err?.retryAfterMs);
      const delay = Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : attempt * attempt * 1000;
      await sleep(delay);
    }
  }

  throw lastError || httpError(502, `Roblox place ${placeId} version probe failed`);
}

function robloxAssetDeliveryMessage(text) {
  try {
    const payload = text ? JSON.parse(text) : {};
    return String(firstDefined(
      payload.message,
      payload.error,
      payload.errors?.[0]?.message,
      payload.errors?.[0]?.Message
    ) || "");
  } catch {
    return String(text || "").slice(0, 500);
  }
}

function ps99VersionSeedHint(placeId) {
  return toNumber(PS99_VERSION_SEED_HINTS[Math.round(toNumber(placeId) || 0)]);
}

function normalizePs99UniversePlace(row, env) {
  const placeId = Math.round(toNumber(firstDefined(
    row.id,
    row.placeId,
    row.place_id,
    row.PlaceId
  )) || 0);
  const placeName = stringOrNull(firstDefined(row.name, row.placeName, row.Name)) || `Place ${placeId}`;
  const rawRoot = firstDefined(row.isRootPlace, row.rootPlace, row.root_place);

  return {
    placeId,
    placeName,
    rootPlace: rawRoot === true || String(rawRoot || "").toLowerCase() === "true" || placeId === ps99RootPlaceId(env),
    rawPlace: row && typeof row === "object" ? row : {}
  };
}

function extractRobloxArray(payload) {
  if (Array.isArray(payload)) return payload;

  for (const key of ["data", "versions", "history", "placeVersions", "items"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function normalizePs99PlaceOutput(row) {
  return {
    universe_id: toNumber(row.universe_id),
    place_id: toNumber(row.place_id),
    place_name: row.place_name || null,
    root_place: Boolean(row.root_place),
    latest_version: toNumber(row.latest_version),
    latest_published_at: row.latest_published_at || null,
    latest_checked_at: row.latest_checked_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizePs99VersionEventOutput(row) {
  return {
    event_id: row.event_id || null,
    universe_id: toNumber(row.universe_id),
    place_id: toNumber(row.place_id),
    place_name: row.place_name || null,
    previous_version: toNumber(row.previous_version),
    current_version: toNumber(row.current_version),
    previous_published_at: row.previous_published_at || null,
    current_published_at: row.current_published_at || null,
    detected_at: row.detected_at || null,
    source: row.source || null
  };
}

async function handlePs99Restarts(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(
    Number(url.searchParams.get("limit") || DEFAULT_PS99_RESTART_HISTORY_LIMIT),
    1,
    500
  );
  const placeId = ps99RootPlaceId(env);
  const [states, events, testAlerts] = await Promise.all([
    supabaseSelect(env, PS99_RESTART_STATE_TABLE, {
      select: "place_id,universe_id,place_name,status,tracked_servers,candidate_servers,baseline_sampled_at,baseline_place_version,candidate_started_at,candidate_confirmations,candidate_place_version,last_batch_size,tracked_present,last_checked_at,last_restart_detected_at,cooldown_until,last_error,raw_snapshot,updated_at",
      place_id: `eq.${placeId}`,
      limit: "1"
    }),
    supabaseSelect(env, PS99_RESTART_EVENTS_TABLE, {
      select: "event_id,universe_id,place_id,place_name,candidate_started_at,detected_at,cooldown_until,previous_place_version,current_place_version,version_correlated,confidence,previous_servers,replacement_servers,reason,source,details,created_at",
      place_id: `eq.${placeId}`,
      source: "neq.test",
      order: "detected_at.desc,id.desc",
      limit: String(limit)
    }),
    supabaseSelect(env, PS99_RESTART_EVENTS_TABLE, {
      select: "details",
      place_id: `eq.${placeId}`,
      source: "eq.test",
      order: "detected_at.desc,id.desc",
      limit: "1"
    })
  ]);
  const state = states[0] ? normalizePs99RestartStateOutput(states[0]) : null;
  const latestTestAlert = normalizePs99RestartTestSignal(testAlerts[0]?.details);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    universe_id: ps99UniverseId(env),
    place_id: placeId,
    place_name: state?.place_name || "Pet Simulator 99",
    detector: ps99RestartRuntimeConfig(env),
    state,
    latest_restart: events[0] ? normalizePs99RestartEventOutput(events[0]) : null,
    latest_test_alert: latestTestAlert,
    events: events.map(normalizePs99RestartEventOutput)
  }, env, publicCacheSeconds(env, "PS99_RESTART"));
}

async function handlePs99Ccu(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 180), 1, 1000);
  const rows = await supabaseSelect(env, PS99_CCU_SAMPLES_TABLE, {
    select: "sample_id,universe_id,place_id,ccu,sampled_at,source,created_at",
    universe_id: `eq.${ps99UniverseId(env)}`,
    order: "sampled_at.desc",
    limit: String(limit)
  });
  const samples = rows.map(normalizePs99CcuSampleOutput);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    universe_id: ps99UniverseId(env),
    place_id: ps99RootPlaceId(env),
    source: "Roblox universe playing count",
    latest: samples[0] || null,
    samples
  }, env, 60);
}

async function handlePs99RestartIngest(env, source) {
  requireSupabase(env);

  const checkedAt = new Date().toISOString();
  const checkedMs = isoToMs(checkedAt);
  const placeId = ps99RootPlaceId(env);
  const universeId = ps99UniverseId(env);
  const sampleSize = ps99RestartSampleSize(env);
  const batchSize = ps99RestartBatchSize(env);
  const pageCount = ps99RestartPageCount(env);
  const confirmationsRequired = ps99RestartConfirmations(env);
  const cooldownMinutes = ps99RestartCooldownMinutes(env);
  const requireVersionCorrelation = ps99RestartRequireVersionCorrelation(env);
  const [serverObservation, stateRows, versionContext, ccuObservation] = await Promise.all([
    fetchPs99PublicServerBatch(placeId, batchSize, pageCount),
    supabaseSelect(env, PS99_RESTART_STATE_TABLE, {
      select: "place_id,universe_id,place_name,status,tracked_servers,candidate_servers,baseline_sampled_at,baseline_place_version,candidate_started_at,candidate_confirmations,candidate_place_version,last_batch_size,tracked_present,last_checked_at,last_restart_detected_at,cooldown_until,last_error,raw_snapshot",
      place_id: `eq.${placeId}`,
      limit: "1"
    }),
    fetchPs99RestartVersionContext(env, placeId),
    fetchPs99CcuSample(env, checkedAt, source).catch(err => ({
      sample: null,
      error: err?.message || String(err)
    }))
  ]);
  const batch = serverObservation.servers;
  const serverScan = serverObservation.scan;
  const ccuSample = ccuObservation?.sample || null;
  let ccuError = ccuObservation?.error || null;
  if (ccuSample) {
    try {
      await supabaseUpsert(env, PS99_CCU_SAMPLES_TABLE, [ccuSample], "sample_id");
    } catch (err) {
      ccuError = err?.message || String(err);
    }
  }
  const currentVersion = toNumber(versionContext.currentVersion);
  const currentById = new Map(batch.map(server => [server.server_id, server]));
  const previous = stateRows[0] || {};
  const previousStatus = String(previous.status || "initializing");
  const previousTrackedPresent = Math.round(toNumber(previous.tracked_present) || 0);
  let status = previousStatus === "insufficient" ? "monitoring" : previousStatus;
  let trackedServers = refreshPs99ObservedServers(parseJsonArray(previous.tracked_servers), currentById, checkedAt);
  let candidateServers = refreshPs99ObservedServers(parseJsonArray(previous.candidate_servers), currentById, checkedAt);
  let baselineSampledAt = safeIso(previous.baseline_sampled_at);
  let baselinePlaceVersion = toNumber(previous.baseline_place_version);
  let candidateStartedAt = safeIso(previous.candidate_started_at);
  let candidateConfirmations = Math.round(toNumber(previous.candidate_confirmations) || 0);
  let candidatePlaceVersion = toNumber(previous.candidate_place_version);
  const previousRestartDetectedAt = safeIso(previous.last_restart_detected_at);
  let lastRestartDetectedAt = previousRestartDetectedAt;
  let cooldownUntil = safeIso(previous.cooldown_until);
  let eventRow = null;
  let suppressedRestart = null;
  let detectorNote = null;
  let webhookAlert = { configured: Boolean(ps99AlertWebhookRaw(env)), posted: false, reason: "no_restart_detected" };

  if (batch.length < sampleSize) {
    status = "insufficient";
  } else if (trackedServers.length !== sampleSize) {
    // A detector-size change invalidates the old reference/candidate set. Rebuild
    // it immediately so a partial baseline can never satisfy the new threshold.
    trackedServers = samplePs99RestartServers(batch, sampleSize, checkedAt, currentVersion);
    candidateServers = [];
    status = "monitoring";
    baselineSampledAt = checkedAt;
    baselinePlaceVersion = currentVersion;
    candidateStartedAt = null;
    candidateConfirmations = 0;
    candidatePlaceVersion = null;
    cooldownUntil = null;
  } else if (status === "cooldown" && isoToMs(cooldownUntil) > checkedMs) {
    // Keep observing the replacement sample, but suppress new alerts during stabilization.
  } else if (status === "cooldown") {
    trackedServers = samplePs99RestartServers(batch, sampleSize, checkedAt, currentVersion);
    candidateServers = [];
    status = "monitoring";
    baselineSampledAt = checkedAt;
    baselinePlaceVersion = currentVersion;
    candidateStartedAt = null;
    candidateConfirmations = 0;
    candidatePlaceVersion = null;
    cooldownUntil = null;
  } else if (status === "candidate") {
    const trackedPresent = trackedServers.filter(server => server.present).length;
    const candidatePresent = candidateServers.filter(server => server.present).length;

    if (trackedPresent > 0) {
      trackedServers = refillPs99RestartSample(
        trackedServers,
        batch,
        sampleSize,
        checkedAt,
        currentVersion
      );
      candidateServers = [];
      status = "monitoring";
      baselineSampledAt = checkedAt;
      baselinePlaceVersion = currentVersion;
      candidateStartedAt = null;
      candidateConfirmations = 0;
      candidatePlaceVersion = null;
    } else if (
      candidateServers.length === sampleSize
      && candidatePresent === sampleSize
      && checkedMs - isoToMs(candidateStartedAt) >= 45000
    ) {
      candidateConfirmations += 1;

      if (candidateConfirmations >= confirmationsRequired) {
        const restartDetectedAt = checkedAt;
        const candidateStart = candidateStartedAt || checkedAt;
        const recentVersionEventMs = isoToMs(versionContext.detectedAt);
        const versionCorrelated = Boolean(
          (baselinePlaceVersion !== null && currentVersion !== null && baselinePlaceVersion !== currentVersion)
          || (recentVersionEventMs && checkedMs - recentVersionEventMs >= 0 && checkedMs - recentVersionEventMs <= 30 * 60000)
        );

        if (requireVersionCorrelation && !versionCorrelated) {
          suppressedRestart = {
            reason: "candidate_turnover_without_version_correlation",
            candidate_started_at: candidateStart,
            confirmation_scans: candidateConfirmations,
            observed_servers: batch.length,
            observed_pages: serverScan.pages_fetched,
            previous_place_version: baselinePlaceVersion,
            current_place_version: currentVersion,
            version_event_detected_at: versionContext.detectedAt || null
          };
          detectorNote = "Suppressed possible restart because public server turnover did not correlate with a PS99 place version change.";
          trackedServers = candidateServers.length === sampleSize
            ? candidateServers
            : samplePs99RestartServers(batch, sampleSize, checkedAt, currentVersion);
          candidateServers = [];
          status = "monitoring";
          baselineSampledAt = checkedAt;
          baselinePlaceVersion = currentVersion;
          candidateStartedAt = null;
          candidateConfirmations = 0;
          candidatePlaceVersion = null;
          cooldownUntil = null;
        } else {
          cooldownUntil = new Date(checkedMs + cooldownMinutes * 60000).toISOString();
          eventRow = {
            event_id: `ps99-restart:${placeId}:${candidateStart}`,
            universe_id: universeId,
            place_id: placeId,
            place_name: versionContext.placeName || "Pet Simulator 99",
            candidate_started_at: candidateStart,
            detected_at: restartDetectedAt,
            cooldown_until: cooldownUntil,
            previous_place_version: versionCorrelated
              ? (toNumber(versionContext.previousVersion) ?? baselinePlaceVersion)
              : baselinePlaceVersion,
            current_place_version: currentVersion,
            version_correlated: versionCorrelated,
            confidence: versionCorrelated ? "high" : "confirmed",
            previous_servers: trackedServers,
            replacement_servers: candidateServers,
            reason: `All ${sampleSize} tracked server IDs disappeared together and ${sampleSize} replacements persisted across ${confirmationsRequired} one-minute scans.`,
            source,
            details: {
              batch_size: batch.length,
              observed_pages: serverScan.pages_fetched,
              sample_size: sampleSize,
              confirmation_scans: candidateConfirmations,
              version_event_detected_at: versionContext.detectedAt || null,
              previous_restart_detected_at: previousRestartDetectedAt,
              restart_place_version: candidatePlaceVersion ?? currentVersion,
              server_age_available: false
            }
          };
          trackedServers = candidateServers;
          candidateServers = [];
          status = "cooldown";
          baselineSampledAt = candidateStart;
          baselinePlaceVersion = currentVersion;
          candidateStartedAt = null;
          candidateConfirmations = 0;
          candidatePlaceVersion = null;
          lastRestartDetectedAt = restartDetectedAt;
        }
      }
    } else {
      candidateServers = samplePs99RestartServers(batch, sampleSize, checkedAt, currentVersion);
      candidateStartedAt = checkedAt;
      candidateConfirmations = 1;
      candidatePlaceVersion = currentVersion;
    }
  } else {
    const trackedPresent = trackedServers.filter(server => server.present).length;

    if (trackedPresent === 0 && previousTrackedPresent === sampleSize) {
      candidateServers = samplePs99RestartServers(batch, sampleSize, checkedAt, currentVersion);
      status = "candidate";
      candidateStartedAt = checkedAt;
      candidateConfirmations = 1;
      candidatePlaceVersion = currentVersion;
    } else {
      trackedServers = refillPs99RestartSample(
        trackedServers,
        batch,
        sampleSize,
        checkedAt,
        currentVersion
      );
      candidateServers = [];
      status = "monitoring";
      candidateStartedAt = null;
      candidateConfirmations = 0;
      candidatePlaceVersion = null;
    }
  }

  const trackedPresent = trackedServers.filter(server => server.present).length;
  if (eventRow) {
    const tenMinutesBefore = new Date(checkedMs - 10 * 60000).toISOString();
    const priorCcuSample = await fetchPs99CcuAtOrBefore(env, tenMinutesBefore, 3 * 60000)
      .catch(err => {
        ccuError = ccuError || err?.message || String(err);
        return null;
      });
    eventRow.details = {
      ...eventRow.details,
      ccu_at_restart: toNumber(ccuSample?.ccu),
      ccu_at_restart_sampled_at: safeIso(ccuSample?.sampled_at),
      ccu_10_minutes_before: toNumber(priorCcuSample?.ccu),
      ccu_10_minutes_before_sampled_at: safeIso(priorCcuSample?.sampled_at),
      ccu_10_minutes_before_target_at: tenMinutesBefore,
      ccu_sampling_error: ccuError
    };
  }
  const stateRow = {
    place_id: placeId,
    universe_id: universeId,
    place_name: versionContext.placeName || "Pet Simulator 99",
    status,
    tracked_servers: trackedServers,
    candidate_servers: candidateServers,
    baseline_sampled_at: baselineSampledAt,
    baseline_place_version: baselinePlaceVersion,
    candidate_started_at: candidateStartedAt,
    candidate_confirmations: candidateConfirmations,
    candidate_place_version: candidatePlaceVersion,
    last_batch_size: batch.length,
    tracked_present: trackedPresent,
    last_checked_at: checkedAt,
    last_restart_detected_at: lastRestartDetectedAt,
    cooldown_until: cooldownUntil,
    last_error: detectorNote,
    raw_snapshot: {
      fetched_at: checkedAt,
      sort_order: "Desc",
      pages_requested: serverScan.pages_requested,
      pages_fetched: serverScan.pages_fetched,
      page_size: serverScan.page_size,
      total_observed: serverScan.total_observed,
      exhausted: serverScan.exhausted,
      ccu: toNumber(ccuSample?.ccu),
      ccu_sampled_at: safeIso(ccuSample?.sampled_at),
      ccu_error: ccuError,
      server_ids: batch.map(server => server.server_id),
      suppressed_restart: suppressedRestart
    },
    updated_at: checkedAt
  };

  await supabaseUpsert(env, PS99_RESTART_STATE_TABLE, [stateRow], "place_id");
  if (eventRow) {
    await supabaseUpsert(env, PS99_RESTART_EVENTS_TABLE, [eventRow], "event_id");
    webhookAlert = await postPs99RestartAlert(env, eventRow);
  }

  return json({
    ok: true,
    source,
    checked_at: checkedAt,
    status,
    place_id: placeId,
    place_version: currentVersion,
    batch_size: batch.length,
    tracked_present: trackedPresent,
    candidate_confirmations: candidateConfirmations,
    restart_detected: Boolean(eventRow),
    restart_suppressed: Boolean(suppressedRestart),
    cooldown_until: cooldownUntil,
    server_scan: serverScan,
    ccu_sample: ccuSample ? normalizePs99CcuSampleOutput(ccuSample) : null,
    ccu_error: ccuError,
    webhook_alert: webhookAlert
  }, 202);
}

async function handlePs99AlertTest(env, url) {
  requireSupabase(env);

  const type = String(url.searchParams.get("type") || "both").trim().toLowerCase();
  if (!["version", "restart", "both"].includes(type)) {
    throw httpError(400, "Use ?type=version, ?type=restart, or ?type=both.");
  }

  const testedAt = new Date().toISOString();
  const placeId = ps99RootPlaceId(env);
  const [places, versionEvents] = await Promise.all([
    supabaseSelect(env, PS99_PLACES_TABLE, {
      select: "place_id,place_name,latest_version,latest_published_at,latest_checked_at",
      place_id: `eq.${placeId}`,
      limit: "1"
    }),
    supabaseSelect(env, PS99_VERSION_EVENTS_TABLE, {
      select: "place_name,previous_version,current_version,current_published_at,detected_at",
      place_id: `eq.${placeId}`,
      order: "detected_at.desc,id.desc",
      limit: "1"
    })
  ]);
  const place = places[0] || {};
  const latestVersionEvent = versionEvents[0] || {};
  const currentVersion = toNumber(place.latest_version) ?? toNumber(latestVersionEvent.current_version);
  const publishedAt = safeIso(place.latest_published_at)
    || safeIso(latestVersionEvent.current_published_at);
  const placeName = stringOrNull(place.place_name)
    || stringOrNull(latestVersionEvent.place_name)
    || "Pet Simulator 99";
  const results = {};
  let restartTestSignal = null;

  if (type === "version" || type === "both") {
    if (currentVersion === null) {
      throw httpError(409, "No stored PS99 root-place version is available yet. Run the version ingest first.");
    }

    results.version = await postPs99VersionAlert(env, [{
      place_id: placeId,
      place_name: placeName,
      previous_version: Math.max(0, Math.trunc(currentVersion) - 1),
      current_version: currentVersion,
      current_published_at: publishedAt,
      detected_at: testedAt
    }], testedAt, { test: true });
  }

  if (type === "restart" || type === "both") {
    const tenMinutesBefore = new Date((isoToMs(testedAt) || Date.now()) - 10 * 60000).toISOString();
    const [testCcuObservation, priorCcuSample, previousRestarts] = await Promise.all([
      fetchPs99CcuSample(env, testedAt, "test").catch(() => ({ sample: null, error: null })),
      fetchPs99CcuAtOrBefore(env, tenMinutesBefore, 3 * 60000).catch(() => null),
      supabaseSelect(env, PS99_RESTART_EVENTS_TABLE, {
        select: "detected_at",
        place_id: `eq.${placeId}`,
        source: "neq.test",
        order: "detected_at.desc,id.desc",
        limit: "1"
      }).catch(() => [])
    ]);
    results.restart = await postPs99RestartAlert(env, {
      place_id: placeId,
      place_name: placeName,
      current_place_version: currentVersion,
      version_correlated: currentVersion !== null,
      detected_at: testedAt,
      reason: "Test alert only. No server restart was detected.",
      details: {
        previous_restart_detected_at: safeIso(previousRestarts[0]?.detected_at),
        restart_place_version: currentVersion,
        ccu_at_restart: toNumber(testCcuObservation?.sample?.ccu),
        ccu_at_restart_sampled_at: safeIso(testCcuObservation?.sample?.sampled_at),
        ccu_10_minutes_before: toNumber(priorCcuSample?.ccu),
        ccu_10_minutes_before_sampled_at: safeIso(priorCcuSample?.sampled_at)
      }
    }, { test: true });
    restartTestSignal = await publishPs99RestartTestSignal(env, {
      placeId,
      placeName,
      testedAt,
      currentVersion
    });
  }

  const requestedResults = Object.values(results);
  const ok = requestedResults.length > 0 && requestedResults.every(result => result?.posted === true);
  return json({
    ok,
    test: true,
    type,
    tested_at: testedAt,
    restart_test_signal: restartTestSignal,
    alert_config: ps99AlertRuntimeConfig(env),
    results
  }, ok ? 200 : 502);
}

async function publishPs99RestartTestSignal(env, { placeId, placeName, testedAt, currentVersion }) {
  const testedMs = isoToMs(testedAt) || Date.now();
  const signal = {
    signal_id: `ps99-restart-test:${new Date(testedMs).toISOString()}`,
    test: true,
    triggered_at: new Date(testedMs).toISOString(),
    expires_at: new Date(testedMs + 5 * 60000).toISOString()
  };

  await supabaseUpsert(env, PS99_RESTART_EVENTS_TABLE, [{
    event_id: `ps99-restart-test:${placeId}`,
    universe_id: ps99UniverseId(env),
    place_id: placeId,
    place_name: placeName || "Pet Simulator 99",
    candidate_started_at: signal.triggered_at,
    detected_at: signal.triggered_at,
    cooldown_until: signal.expires_at,
    previous_place_version: currentVersion,
    current_place_version: currentVersion,
    version_correlated: currentVersion !== null,
    confidence: "confirmed",
    previous_servers: [],
    replacement_servers: [],
    reason: "End-to-end restart alert test signal.",
    source: "test",
    details: signal
  }], "event_id");

  return signal;
}

async function postPs99VersionAlert(env, events, detectedAt, options = {}) {
  const separator = "~~━━━━━━━━━━━~~";
  const sections = events.slice(0, 20).map(event => {
    const placeName = escapeDiscordMarkdown(event.place_name || `Place ${event.place_id}`);
    const previousVersion = ps99AlertVersion(event.previous_version);
    const currentVersion = ps99AlertVersion(event.current_version);
    const published = discordTimestamp(event.current_published_at, "R") || "Unknown";
    return `**${placeName}**\nVersion: \`${previousVersion}\`  ➜  \`${currentVersion}\`\nPublished: ${published}`;
  });
  const extraCount = Math.max(0, events.length - 20);
  if (extraCount) sections.push(`*...and ${extraCount} more place update${extraCount === 1 ? "" : "s"}.*`);
  const description = `${separator}\n\n${sections.join(`\n\n${separator}\n\n`)}\n\n${separator}`;

  return postPs99DiscordAlert(env, {
    content: null,
    username: "PS99 Alert Bot",
    attachments: [],
    embeds: [{
      title: options.test ? "[TEST] PS99 UPDATE DETECTED" : "PS99 UPDATE DETECTED",
      description: description.slice(0, 4096),
      color: 0xff0000,
      footer: {
        text: "Auditing Accuracy • it's fucking CAINOVER"
      },
      thumbnail: {
        url: "https://i.imgur.com/aCHMjbP.png"
      }
    }]
  });
}

async function postPs99RestartAlert(env, event, options = {}) {
  const details = event?.details && typeof event.details === "object"
    ? event.details
    : (parseJsonObject(event?.details) || {});
  const detectedAt = safeIso(event.detected_at) || new Date().toISOString();
  const detectedMs = isoToMs(detectedAt) || Date.now();
  const detectedMinute = new Date(Math.floor(detectedMs / 60000) * 60000).toISOString();
  const relativeTime = discordTimestamp(detectedMinute, "R") || "Unknown";
  const previousRestartAt = safeIso(details.previous_restart_detected_at);
  const restartVersion = details.restart_place_version ?? event.current_place_version;
  const currentVersion = event.current_place_version;
  const description = [
    "~~━━━━━━━━━━━~~",
    `**${relativeTime}**`,
    `Time Since Last Restart: ${ps99AlertElapsed(previousRestartAt, detectedAt)}`,
    `Place Version @ restart: ${ps99AlertVersion(restartVersion)}`,
    `Place Version Now: ${ps99AlertVersion(currentVersion)}`,
    `CCU at restart: ${ps99AlertCcu(details.ccu_at_restart)}`,
    `CCU (10 min before restart): ${ps99AlertCcu(details.ccu_10_minutes_before)}`
  ].join("\n");

  return postPs99DiscordAlert(env, {
    content: null,
    username: "PS99 Alert Bot",
    attachments: [],
    embeds: [{
      title: options.test ? "[TEST] PS99 SERVER RESTART DETECTED" : "PS99 SERVER RESTART DETECTED",
      description: description.slice(0, 4096),
      color: 0xff0000,
      footer: {
        text: "Auditing Accuracy • it's fucking CAINOVER"
      },
      thumbnail: {
        url: "https://i.imgur.com/aCHMjbP.png"
      }
    }]
  });
}

async function postPs99DiscordAlert(env, payload) {
  const configured = Boolean(ps99AlertWebhookRaw(env));
  const webhookUrl = ps99AlertWebhookUrl(env);
  if (!configured) return { configured: false, posted: false, reason: "webhook_not_configured" };
  if (!webhookUrl) return { configured: true, posted: false, reason: "invalid_webhook_url" };

  const roleId = ps99AlertRoleId(env);
  const body = {
    ...payload,
    content: roleId ? `<@&${roleId}>` : (payload.content ?? null),
    allowed_mentions: {
      parse: [],
      roles: roleId ? [roleId] : []
    }
  };
  let lastError = "Discord webhook request failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      const responseBody = parseJsonObject(responseText) || {};

      if (response.ok) {
        return {
          configured: true,
          posted: true,
          role_mentioned: Boolean(roleId),
          message_id: stringOrNull(responseBody.id)
        };
      }

      lastError = `Discord webhook returned HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`;
      if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
        const retrySeconds = toNumber(responseBody.retry_after);
        const retryMs = response.status === 429 && retrySeconds !== null
          ? clamp(retrySeconds * 1000, 500, 15000)
          : attempt * 1000;
        await sleep(retryMs);
        continue;
      }

      break;
    } catch (err) {
      lastError = err?.message || String(err);
      if (attempt < 3) {
        await sleep(attempt * 1000);
        continue;
      }
    }
  }

  return {
    configured: true,
    posted: false,
    role_mentioned: false,
    reason: "webhook_request_failed",
    error: lastError.slice(0, 500)
  };
}

function ps99AlertRuntimeConfig(env) {
  const rawWebhook = ps99AlertWebhookRaw(env);
  return {
    webhook_configured: Boolean(rawWebhook),
    webhook_valid: Boolean(ps99AlertWebhookUrl(env)),
    role_id_configured: Boolean(ps99AlertRoleId(env))
  };
}

function ps99AlertWebhookRaw(env) {
  return String(env.PS99_ALERT_WEBHOOK_URL || "").trim();
}

function ps99AlertWebhookUrl(env) {
  const raw = ps99AlertWebhookRaw(env);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const isDiscordHost = host === "discord.com"
      || host.endsWith(".discord.com")
      || host === "discordapp.com"
      || host.endsWith(".discordapp.com");
    const isWebhookPath = /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[^/]+\/?$/.test(url.pathname);
    if (url.protocol !== "https:" || !isDiscordHost || !isWebhookPath) return "";

    url.searchParams.set("wait", "true");
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function ps99AlertRoleId(env) {
  const value = String(env.PS99_ALERT_ROLE_ID || "").trim();
  return /^\d{5,30}$/.test(value) ? value : "";
}

function ps99AlertVersion(value) {
  const version = toNumber(value);
  return version === null ? "Unknown" : String(Math.trunc(version));
}

function ps99AlertCcu(value) {
  const ccu = toNumber(value);
  if (ccu === null) return "Unknown";
  if (ccu >= 1000000) return `${(ccu / 1000000).toFixed(ccu >= 10000000 ? 1 : 2).replace(/\.0+$/, "")}m`;
  if (ccu >= 1000) return `${(ccu / 1000).toFixed(ccu >= 100000 ? 1 : 2).replace(/\.0+$/, "")}k`;
  return String(Math.max(0, Math.round(ccu)));
}

function ps99AlertElapsed(previousAt, currentAt) {
  const previousMs = isoToMs(previousAt);
  const currentMs = isoToMs(currentAt);
  if (previousMs === null || currentMs === null || currentMs <= previousMs) {
    return "No prior confirmed restart";
  }

  let minutes = Math.max(0, Math.floor((currentMs - previousMs) / 60000));
  if (minutes < 1) return "<1m";
  const days = Math.floor(minutes / 1440);
  minutes -= days * 1440;
  const hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : ""
  ].filter(Boolean).join(" ");
}

function discordTimestamp(value, style = "R") {
  const ms = isoToMs(value);
  return ms === null ? "" : `<t:${Math.floor(ms / 1000)}:${style}>`;
}

function escapeDiscordMarkdown(value) {
  return String(value || "").replace(/([\\`*_{}\[\]()<>#+\-.!|~])/g, "\\$1");
}

async function fetchPs99CcuSample(env, sampledAt, source) {
  const universeId = ps99UniverseId(env);
  const placeId = ps99RootPlaceId(env);
  const url = new URL("https://games.roblox.com/v1/games");
  url.searchParams.set("universeIds", String(universeId));
  const payload = await fetchJsonWithRetry(url, "Roblox PS99 universe CCU", {
    attempts: 3,
    baseDelayMs: 750
  });
  const game = extractRobloxArray(payload)
    .find(row => toNumber(row?.id) === universeId) || null;
  const ccu = toNumber(game?.playing);
  if (ccu === null) throw httpError(502, "Roblox PS99 universe response did not include a playing count.");

  const sampledMs = isoToMs(sampledAt) || Date.now();
  const sampledMinute = new Date(Math.floor(sampledMs / 60000) * 60000).toISOString();
  return {
    sample: {
      sample_id: `ps99-ccu:${universeId}:${sampledMinute}`,
      universe_id: universeId,
      place_id: placeId,
      ccu: Math.max(0, Math.round(ccu)),
      sampled_at: sampledMinute,
      source,
      raw_game: {
        id: toNumber(game?.id),
        root_place_id: toNumber(game?.rootPlaceId),
        name: stringOrNull(game?.name),
        playing: Math.max(0, Math.round(ccu)),
        updated_at: safeIso(game?.updated)
      }
    },
    error: null
  };
}

async function fetchPs99CcuAtOrBefore(env, targetAt, maxAgeMs = 3 * 60000) {
  const targetIso = safeIso(targetAt);
  const targetMs = isoToMs(targetIso);
  if (!targetIso || targetMs === null) return null;

  const rows = await supabaseSelect(env, PS99_CCU_SAMPLES_TABLE, {
    select: "sample_id,universe_id,place_id,ccu,sampled_at,source,created_at",
    universe_id: `eq.${ps99UniverseId(env)}`,
    sampled_at: `lte.${targetIso}`,
    order: "sampled_at.desc",
    limit: "1"
  });
  const sample = rows[0] || null;
  const sampleMs = isoToMs(sample?.sampled_at);
  if (!sample || sampleMs === null || targetMs - sampleMs < 0 || targetMs - sampleMs > maxAgeMs) {
    return null;
  }

  return sample;
}

async function fetchPs99PublicServerBatch(placeId, batchSize, pageCount = 1) {
  const safePageCount = clamp(Number(pageCount || 1), 1, 10);
  const seen = new Map();
  let cursor = "";
  let pagesFetched = 0;
  let exhausted = false;

  for (let page = 1; page <= safePageCount; page += 1) {
    const url = new URL(`https://games.roblox.com/v1/games/${placeId}/servers/Public`);
    url.searchParams.set("sortOrder", "Desc");
    url.searchParams.set("excludeFullGames", "false");
    url.searchParams.set("limit", String(batchSize));
    if (cursor) url.searchParams.set("cursor", cursor);

    const payload = await fetchJsonWithRetry(url, `Roblox public servers page ${page}`, {
      attempts: 3,
      baseDelayMs: 1000
    });

    pagesFetched += 1;
    for (const server of extractRobloxArray(payload).map(normalizePs99PublicServer)) {
      if (server.server_id && !seen.has(server.server_id)) {
        seen.set(server.server_id, server);
      }
    }

    cursor = robloxNextPageCursor(payload);
    if (!cursor) {
      exhausted = true;
      break;
    }
  }

  const servers = [...seen.values()];
  return {
    servers,
    scan: {
      pages_requested: safePageCount,
      pages_fetched: pagesFetched,
      page_size: batchSize,
      total_observed: servers.length,
      exhausted
    }
  };
}

function robloxNextPageCursor(payload) {
  return String(
    payload?.nextPageCursor ||
    payload?.next_page_cursor ||
    payload?.nextCursor ||
    payload?.next_cursor ||
    ""
  ).trim();
}

async function fetchPs99RestartVersionContext(env, placeId) {
  const [places, events] = await Promise.all([
    supabaseSelect(env, PS99_PLACES_TABLE, {
      select: "place_name,latest_version,latest_checked_at",
      place_id: `eq.${placeId}`,
      limit: "1"
    }),
    supabaseSelect(env, PS99_VERSION_EVENTS_TABLE, {
      select: "previous_version,current_version,detected_at",
      place_id: `eq.${placeId}`,
      order: "detected_at.desc,id.desc",
      limit: "1"
    })
  ]);
  const place = places[0] || {};
  const event = events[0] || {};

  return {
    placeName: stringOrNull(place.place_name),
    currentVersion: toNumber(place.latest_version) ?? toNumber(event.current_version),
    previousVersion: toNumber(event.previous_version),
    detectedAt: safeIso(event.detected_at)
  };
}

function normalizePs99PublicServer(row) {
  return {
    server_id: stringOrNull(row?.id),
    playing: Math.max(0, Math.round(toNumber(row?.playing) || 0)),
    max_players: Math.max(0, Math.round(toNumber(row?.maxPlayers) || 0)),
    ping: toNumber(row?.ping),
    fps: toNumber(row?.fps)
  };
}

function normalizePs99RestartSampleServer(server, observedAt, placeVersion) {
  return {
    ...server,
    first_seen_at: safeIso(server.first_seen_at) || observedAt,
    last_seen_at: observedAt,
    observed_place_version: toNumber(server.observed_place_version) ?? toNumber(placeVersion),
    present: true
  };
}

function comparePs99RestartServerQuality(a, b) {
  const ap = toNumber(a.playing) || 0;
  const bp = toNumber(b.playing) || 0;
  if (bp !== ap) return bp - ap;

  const af = toNumber(a.fps);
  const bf = toNumber(b.fps);
  if ((bf ?? -1) !== (af ?? -1)) return (bf ?? -1) - (af ?? -1);

  const ag = toNumber(a.ping);
  const bg = toNumber(b.ping);
  if ((ag ?? Number.MAX_SAFE_INTEGER) !== (bg ?? Number.MAX_SAFE_INTEGER)) {
    return (ag ?? Number.MAX_SAFE_INTEGER) - (bg ?? Number.MAX_SAFE_INTEGER);
  }

  return String(a.server_id || "").localeCompare(String(b.server_id || ""));
}

function ps99RestartVersionKey(server) {
  const version = toNumber(server?.observed_place_version);
  return version === null ? "unknown" : String(version);
}

function selectPs99RestartServersDiverse(candidates, count, existingVersions = new Set()) {
  const wanted = Math.max(0, Math.round(Number(count) || 0));
  if (!wanted) return [];

  const byVersion = new Map();
  for (const server of candidates || []) {
    if (!server?.server_id) continue;

    const key = ps99RestartVersionKey(server);
    if (!byVersion.has(key)) byVersion.set(key, []);
    byVersion.get(key).push(server);
  }

  for (const rows of byVersion.values()) {
    rows.sort(comparePs99RestartServerQuality);
  }

  const selected = [];
  const selectedIds = new Set();
  const versions = [...byVersion.keys()]
    .sort((a, b) => {
      const aExisting = existingVersions.has(a) ? 1 : 0;
      const bExisting = existingVersions.has(b) ? 1 : 0;
      if (aExisting !== bExisting) return aExisting - bExisting;
      return a.localeCompare(b, undefined, { numeric: true });
    });

  for (const key of versions) {
    if (selected.length >= wanted) break;
    const row = byVersion.get(key)?.find(server => !selectedIds.has(server.server_id));
    if (!row) continue;
    selected.push(row);
    selectedIds.add(row.server_id);
  }

  const remaining = [...byVersion.values()]
    .flat()
    .filter(server => !selectedIds.has(server.server_id))
    .sort(comparePs99RestartServerQuality);

  for (const row of remaining) {
    if (selected.length >= wanted) break;
    selected.push(row);
    selectedIds.add(row.server_id);
  }

  return selected;
}

function samplePs99RestartServers(batch, count, observedAt, placeVersion, excludedIds = new Set()) {
  const pool = batch
    .filter(server => server?.server_id && !excludedIds.has(server.server_id))
    .map(server => normalizePs99RestartSampleServer(server, observedAt, placeVersion));

  return selectPs99RestartServersDiverse(pool, count);
}

function refreshPs99ObservedServers(servers, currentById, checkedAt) {
  return servers
    .map(server => {
      const serverId = stringOrNull(server?.server_id || server?.id);
      if (!serverId) return null;
      const current = currentById.get(serverId);

      return {
        server_id: serverId,
        playing: current ? current.playing : Math.max(0, Math.round(toNumber(server.playing) || 0)),
        max_players: current ? current.max_players : Math.max(0, Math.round(toNumber(server.max_players) || 0)),
        ping: current ? current.ping : toNumber(server.ping),
        fps: current ? current.fps : toNumber(server.fps),
        first_seen_at: safeIso(server.first_seen_at) || checkedAt,
        last_seen_at: current ? checkedAt : safeIso(server.last_seen_at),
        observed_place_version: toNumber(server.observed_place_version),
        present: Boolean(current)
      };
    })
    .filter(Boolean);
}

function refillPs99RestartSample(trackedServers, batch, sampleSize, checkedAt, placeVersion) {
  let survivors = trackedServers.filter(server => server.present);
  if (survivors.length > sampleSize) {
    survivors = selectPs99RestartServersDiverse(survivors, sampleSize);
  }

  const excluded = new Set(survivors.map(server => server.server_id));
  const replacementPool = batch
    .filter(server => server?.server_id && !excluded.has(server.server_id))
    .map(server => normalizePs99RestartSampleServer(server, checkedAt, placeVersion));
  const currentVersionKey = toNumber(placeVersion) === null ? null : String(toNumber(placeVersion));

  if (
    survivors.length >= sampleSize &&
    currentVersionKey &&
    !survivors.some(server => ps99RestartVersionKey(server) === currentVersionKey) &&
    replacementPool.length
  ) {
    const replaceIndex = ps99RestartVersionDiversityReplacementIndex(survivors);
    if (replaceIndex >= 0) {
      const currentVersionReplacement = replacementPool
        .filter(server => ps99RestartVersionKey(server) === currentVersionKey)
        .sort(comparePs99RestartServerQuality)[0] || replacementPool.sort(comparePs99RestartServerQuality)[0];

      if (currentVersionReplacement) {
        survivors = survivors.slice();
        survivors[replaceIndex] = currentVersionReplacement;
      }
    }
  }

  const survivorVersions = new Set(survivors.map(ps99RestartVersionKey));
  const replacements = survivors.length < sampleSize
    ? selectPs99RestartServersDiverse(replacementPool, sampleSize - survivors.length, survivorVersions)
    : [];

  return [...survivors, ...replacements];
}

function ps99RestartVersionDiversityReplacementIndex(servers) {
  const groups = new Map();
  servers.forEach((server, index) => {
    const key = ps99RestartVersionKey(server);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ server, index });
  });

  const duplicateGroups = [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .sort((a, b) => {
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return b[0].localeCompare(a[0], undefined, { numeric: true });
    });

  if (!duplicateGroups.length) return -1;

  return duplicateGroups[0][1]
    .slice()
    .sort((a, b) => comparePs99RestartServerQuality(b.server, a.server))[0]
    .index;
}

function normalizePs99RestartStateOutput(row) {
  const rawSnapshot = parseJsonObject(row.raw_snapshot) || {};
  return {
    place_id: toNumber(row.place_id),
    universe_id: toNumber(row.universe_id),
    place_name: row.place_name || null,
    status: row.status || "initializing",
    tracked_servers: parseJsonArray(row.tracked_servers),
    candidate_servers: parseJsonArray(row.candidate_servers),
    baseline_sampled_at: row.baseline_sampled_at || null,
    baseline_place_version: toNumber(row.baseline_place_version),
    candidate_started_at: row.candidate_started_at || null,
    candidate_confirmations: toNumber(row.candidate_confirmations) || 0,
    candidate_place_version: toNumber(row.candidate_place_version),
    last_batch_size: toNumber(row.last_batch_size) || 0,
    tracked_present: toNumber(row.tracked_present) || 0,
    last_checked_at: row.last_checked_at || null,
    last_restart_detected_at: row.last_restart_detected_at || null,
    cooldown_until: row.cooldown_until || null,
    last_error: row.last_error || null,
    server_scan: {
      pages_requested: toNumber(rawSnapshot.pages_requested),
      pages_fetched: toNumber(rawSnapshot.pages_fetched),
      page_size: toNumber(rawSnapshot.page_size),
      total_observed: toNumber(rawSnapshot.total_observed) || (Array.isArray(rawSnapshot.server_ids) ? rawSnapshot.server_ids.length : toNumber(row.last_batch_size) || 0),
      exhausted: rawSnapshot.exhausted ?? null
    },
    suppressed_restart: parseJsonObject(rawSnapshot.suppressed_restart) || rawSnapshot.suppressed_restart || null,
    updated_at: row.updated_at || null
  };
}

function normalizePs99RestartTestSignal(value) {
  const signal = parseJsonObject(value);
  const signalId = stringOrNull(signal?.signal_id);
  const triggeredAt = safeIso(signal?.triggered_at);
  const expiresAt = safeIso(signal?.expires_at);
  const expiresMs = isoToMs(expiresAt);
  if (!signalId || !triggeredAt || expiresMs === null || expiresMs <= Date.now()) return null;

  return {
    signal_id: signalId,
    test: true,
    triggered_at: triggeredAt,
    expires_at: expiresAt
  };
}

function normalizePs99RestartEventOutput(row) {
  return {
    event_id: row.event_id || null,
    universe_id: toNumber(row.universe_id),
    place_id: toNumber(row.place_id),
    place_name: row.place_name || null,
    candidate_started_at: row.candidate_started_at || null,
    detected_at: row.detected_at || null,
    cooldown_until: row.cooldown_until || null,
    previous_place_version: toNumber(row.previous_place_version),
    current_place_version: toNumber(row.current_place_version),
    version_correlated: Boolean(row.version_correlated),
    confidence: row.confidence || "confirmed",
    previous_servers: parseJsonArray(row.previous_servers),
    replacement_servers: parseJsonArray(row.replacement_servers),
    reason: row.reason || null,
    source: row.source || null,
    details: parseJsonObject(row.details) || {}
  };
}

function normalizePs99CcuSampleOutput(row) {
  return {
    sample_id: row.sample_id || null,
    universe_id: toNumber(row.universe_id),
    place_id: toNumber(row.place_id),
    ccu: toNumber(row.ccu),
    sampled_at: row.sampled_at || null,
    source: row.source || null,
    created_at: row.created_at || null
  };
}

async function resolveActivityBattleKey(env, requestedBattle) {
  const requested = String(requestedBattle || "").trim();
  if (requested && !["current", "auto"].includes(requested.toLowerCase())) return requested;

  const rows = await supabaseSelect(env, CLAN_ACTIVITY_SUMMARY_TABLE, {
    select: "battle_key,last_seen_at",
    order: "last_seen_at.desc",
    limit: "1"
  });

  if (rows[0]?.battle_key) return rows[0].battle_key;

  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  return activeBattleMeta?.battleKey || battleKey(env);
}

async function clanActivityRecentSnapshotGate(env, battleKeyValue, fetchedAt, bypassRecentGuard = false) {
  const minMinutes = clanActivityMinSnapshotIntervalMinutes(env);
  if (bypassRecentGuard) return { allowed: true, reason: "recent_guard_bypassed" };
  if (minMinutes <= 0) return { allowed: true, reason: "recent_guard_disabled" };

  const rows = await supabaseSelect(env, CLAN_ACTIVITY_ROSTER_TABLE, {
    select: "snapshot_id,fetched_at",
    battle_key: `eq.${battleKeyValue}`,
    order: "fetched_at.desc",
    limit: "1"
  });
  const latest = rows[0] || null;
  const latestMs = isoToMs(latest?.fetched_at);
  const nowMs = isoToMs(fetchedAt) || Date.now();
  if (!latest || !latestMs || nowMs < latestMs) {
    return { allowed: true, reason: "no_recent_snapshot" };
  }

  const minMs = minMinutes * 60 * 1000;
  const ageMs = nowMs - latestMs;
  if (ageMs >= minMs) {
    return { allowed: true, reason: "recent_snapshot_old_enough" };
  }

  const ageMinutes = Math.max(0, ageMs / 60000);
  const nextAllowedAt = new Date(latestMs + minMs).toISOString();
  return {
    allowed: false,
    reason: "recent_snapshot",
    message: `Clan activity ingest skipped because the latest snapshot is ${ageMinutes.toFixed(1)} minutes old. Minimum interval is ${minMinutes} minutes.`,
    battle_key: battleKeyValue,
    latest_snapshot_id: latest.snapshot_id || null,
    latest_snapshot_at: latest.fetched_at || null,
    min_snapshot_interval_minutes: minMinutes,
    next_allowed_at: nextAllowedAt
  };
}

async function fetchClanActivityCurrentRows(env, battleKeyValue) {
  return supabaseSelectPaged(env, CLAN_ACTIVITY_CURRENT_TABLE, {
    select: "battle_key,clan_name,clan_key,clan_rank,user_id,username,display_name,role,permission_level,join_time,points,kick_available,member_count",
    battle_key: `eq.${battleKeyValue}`,
    order: "clan_key.asc,user_id.asc"
  }, 20000);
}

async function fetchClanActivitySummaryRows(env, battleKeyValue) {
  return supabaseSelect(env, CLAN_ACTIVITY_SUMMARY_TABLE, {
    select: "*",
    battle_key: `eq.${battleKeyValue}`,
    order: "clan_rank.asc",
    limit: "500"
  });
}

function clanActivityRosterRow({
  snapshotId,
  fetchedAt,
  source,
  battleKey,
  battleMeta,
  clanRow,
  clanData,
  member,
  memberRank,
  usernameMap,
  kickAvailable,
  memberCount
}) {
  const rawMember = member.raw_member || {};
  const rawContribution = member.raw_contribution || {};
  const userId = toNumber(member.user_id);
  const username = displayUsername({
    user_id: userId,
    username: firstDefined(
      rawContribution.Username,
      rawContribution.username,
      rawContribution.Name,
      rawContribution.name,
      rawMember.Username,
      rawMember.username,
      rawMember.Name,
      rawMember.name
    )
  }, usernameMap);
  const permissionLevel = memberPermissionLevel(rawMember);
  const role = memberRole(rawMember, permissionLevel);

  return {
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source,
    battle_key: battleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    clan_rank: clanRow.rank,
    clan_name: clanRow.clan_name,
    clan_key: normalizeText(clanRow.clan_name),
    clan_id: stringOrNull(firstDefined(clanData.ID, clanData.Id, clanData.id, clanData._id)),
    clan_points: clanRow.points,
    icon_id: clanRow.icon_id || null,
    icon_url: clanRow.icon_url || null,
    kick_available: kickAvailable,
    member_count: memberCount,
    member_capacity: toNumber(firstDefined(clanData.MemberCapacity, clanData.memberCapacity, clanData.Capacity, clanData.capacity)),
    member_rank: memberRank,
    user_id: userId,
    username: username || (userId ? `user_${userId}` : ""),
    display_name: stringOrNull(firstDefined(
      rawContribution.DisplayName,
      rawContribution.displayName,
      rawContribution.display_name,
      rawMember.DisplayName,
      rawMember.displayName,
      rawMember.display_name
    )),
    avatar_url: null,
    role,
    permission_level: permissionLevel,
    join_time: memberJoinIso(member),
    points: toNumber(member.total_points) || 0,
    raw_member: rawMember,
    raw_contribution: rawContribution,
    raw_clan: clanRow.raw_clan || {}
  };
}

function clanActivityIncrements({
  clanRow,
  currentByUser,
  previousClanByUser,
  previousSummary,
  fetchedAt,
  battleKey,
  battleMeta,
  source,
  kickAvailable
}) {
  const events = [];
  const clanKey = normalizeText(clanRow.clan_name);
  const hadPreviousRoster = previousClanByUser.size > 0;
  let newMembers = 0;
  let lostMembers = 0;
  let promotions = 0;
  let demotions = 0;
  let rankChanges = 0;
  const previousKickAvailable = previousSummary && typeof previousSummary.kick_available === "boolean"
    ? Boolean(previousSummary.kick_available)
    : null;
  const currentKickAvailable = typeof kickAvailable === "boolean" ? Boolean(kickAvailable) : null;
  const kickUsedThisSnapshot = previousKickAvailable === true && currentKickAvailable === false;

  if (hadPreviousRoster) {
    for (const [userId, current] of currentByUser.entries()) {
      const previous = previousClanByUser.get(userId);
      if (!previous) {
        newMembers += 1;
        events.push(clanActivityEvent({
          eventAt: current.join_time || fetchedAt,
          fetchedAt,
          source,
          battleKey,
          battleMeta,
          clanRow,
          eventType: "member_joined",
          userRow: current,
          previousValue: null,
          currentValue: "joined"
        }));
        continue;
      }

      const change = memberRoleChange(previous, current);
      if (change > 0) {
        promotions += 1;
        events.push(clanActivityEvent({
          fetchedAt,
          source,
          battleKey,
          battleMeta,
          clanRow,
          eventType: "member_promoted",
          userRow: current,
          previousValue: previous.role,
          currentValue: current.role,
          previousPermissionLevel: previous.permission_level,
          currentPermissionLevel: current.permission_level
        }));
      } else if (change < 0) {
        demotions += 1;
        events.push(clanActivityEvent({
          fetchedAt,
          source,
          battleKey,
          battleMeta,
          clanRow,
          eventType: "member_demoted",
          userRow: current,
          previousValue: previous.role,
          currentValue: current.role,
          previousPermissionLevel: previous.permission_level,
          currentPermissionLevel: current.permission_level
        }));
      }
    }

    const lostRows = [];
    for (const [userId, previous] of previousClanByUser.entries()) {
      if (currentByUser.has(userId)) continue;
      lostRows.push(previous);
    }

    const inferSingleKick = kickUsedThisSnapshot && lostRows.length === 1;
    for (const previous of lostRows) {
      const eventType = inferSingleKick ? "member_kicked" : "member_left";

      lostMembers += 1;
      events.push(clanActivityEvent({
        fetchedAt,
        source,
        battleKey,
        battleMeta,
        clanRow,
        eventType,
        userRow: previous,
        previousValue: "present",
        currentValue: inferSingleKick ? "kicked" : "left",
        details: inferSingleKick ? {
          inference: "single_lost_member_and_kick_cooldown_started",
          previous_kick_available: previousKickAvailable,
          current_kick_available: currentKickAvailable
        } : {
          inference: "no_single_kick_cooldown_match",
          previous_kick_available: previousKickAvailable,
          current_kick_available: currentKickAvailable
        }
      }));
    }
  }

  const previousRank = toNumber(previousSummary?.clan_rank);
  if (previousRank && previousRank !== clanRow.rank) {
    rankChanges += 1;
    events.push(clanActivityEvent({
      fetchedAt,
      source,
      battleKey,
      battleMeta,
      clanRow,
      eventType: clanRow.rank < previousRank ? "rank_up" : "rank_down",
      previousRank,
      currentRank: clanRow.rank,
      previousValue: `#${previousRank}`,
      currentValue: `#${clanRow.rank}`
    }));
  }

  if (previousKickAvailable !== null && currentKickAvailable !== null) {
    if (previousKickAvailable !== currentKickAvailable) {
      events.push(clanActivityEvent({
        fetchedAt,
        source,
        battleKey,
        battleMeta,
        clanRow,
        eventType: previousKickAvailable && !currentKickAvailable ? "kick_used" : "kick_available",
        previousValue: previousKickAvailable ? "yes" : "no",
        currentValue: currentKickAvailable ? "yes" : "no"
      }));
    }
  }

  return {
    newMembers,
    lostMembers,
    promotions,
    demotions,
    rankChanges,
    events: events.map(event => ({
      ...event,
      event_id: clanActivityEventId(event)
    }))
  };
}

function clanActivityEvent({
  eventAt = null,
  fetchedAt,
  source,
  battleKey,
  battleMeta,
  clanRow,
  eventType,
  userRow = null,
  previousValue = null,
  currentValue = null,
  previousRank = null,
  currentRank = null,
  previousPermissionLevel = null,
  currentPermissionLevel = null,
  details = null
}) {
  return {
    event_id: "",
    event_at: eventAt || fetchedAt,
    detected_at: fetchedAt,
    source,
    battle_key: battleKey,
    battle_display_name: battleMeta.displayName,
    clan_name: clanRow.clan_name,
    clan_key: normalizeText(clanRow.clan_name),
    clan_rank: clanRow.rank,
    event_type: eventType,
    user_id: userRow?.user_id || null,
    username: userRow?.username || null,
    display_name: userRow?.display_name || null,
    previous_value: previousValue,
    current_value: currentValue,
    previous_rank: previousRank,
    current_rank: currentRank,
    previous_member_role: eventType === "member_promoted" || eventType === "member_demoted" ? previousValue : null,
    current_member_role: eventType === "member_promoted" || eventType === "member_demoted" ? currentValue : null,
    previous_permission_level: previousPermissionLevel,
    current_permission_level: currentPermissionLevel,
    details: {
      clan_points: clanRow.points,
      ...(details && typeof details === "object" ? details : {})
    }
  };
}

function clanActivityEventId(event) {
  return [
    event.battle_key,
    event.clan_key,
    event.event_type,
    event.user_id || "clan",
    event.previous_value || event.previous_rank || "",
    event.current_value || event.current_rank || "",
    event.event_at
  ].map(value => encodeURIComponent(String(value))).join(":");
}

function memberRoleChange(previous, current) {
  const previousPermission = toNumber(previous.permission_level);
  const currentPermission = toNumber(current.permission_level);

  if (previousPermission !== null && currentPermission !== null && previousPermission !== currentPermission) {
    return currentPermission - previousPermission;
  }

  const previousScore = memberRoleScore(previous.role);
  const currentScore = memberRoleScore(current.role);
  return currentScore - previousScore;
}

function memberPermissionLevel(rawMember) {
  return toNumber(firstDefined(
    rawMember.PermissionLevel,
    rawMember.permissionLevel,
    rawMember.permission_level,
    rawMember.Permissions,
    rawMember.permissions
  ));
}

function memberRole(rawMember, permissionLevel) {
  const explicit = stringOrNull(firstDefined(
    rawMember.Role,
    rawMember.role,
    rawMember.RankName,
    rawMember.rankName,
    rawMember.Title,
    rawMember.title
  ));

  if (explicit) return explicit;
  if (permissionLevel >= 100) return "Owner";
  if (permissionLevel >= 90) return "Leader";
  if (permissionLevel >= 50) return "Officer";
  if (permissionLevel >= 1) return "Member";
  return null;
}

function memberRoleScore(role) {
  const text = normalizeText(role);
  if (!text) return 0;
  if (text.includes("owner")) return 100;
  if (text.includes("leader")) return 90;
  if (text.includes("officer")) return 50;
  if (text.includes("admin")) return 50;
  if (text.includes("member")) return 1;
  return 0;
}

function extractKickAvailable(value) {
  const direct = findKickValue(value);
  if (direct === null || direct === undefined) return null;
  if (typeof direct === "boolean") return direct;
  const n = toNumber(direct);
  if (n !== null) return n > 0;
  const text = String(direct || "").trim().toLowerCase();
  if (["yes", "true", "available", "ready"].includes(text)) return true;
  if (["no", "false", "unavailable", "used", "none"].includes(text)) return false;
  return null;
}

function findKickValue(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 4) return null;

  for (const [key, item] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const isKickKey = lower.includes("kick");
    const isStateKey =
      lower.includes("available") ||
      lower.includes("ready") ||
      lower.includes("remaining") ||
      lower.includes("left") ||
      lower.includes("count") ||
      lower.includes("can") ||
      lower === "kicks";

    if (isKickKey && isStateKey && (typeof item !== "object" || item === null)) {
      return item;
    }
  }

  for (const item of Object.values(value)) {
    if (item && typeof item === "object") {
      const found = findKickValue(item, depth + 1);
      if (found !== null && found !== undefined) return found;
    }
  }

  return null;
}

function groupRowsByNormalizedClan(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = normalizeText(row.clan_name);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function clanActivityMemberKey(clan, userId) {
  return `${normalizeText(clan)}:${String(userId || "").trim()}`;
}

function normalizeClanActivitySummaryOutput(row) {
  return {
    battle_key: row.battle_key,
    battle_display_name: cleanBattleDisplayName(row.battle_key, row.battle_display_name),
    battle_started_at: row.battle_started_at || null,
    battle_ended_at: row.battle_ended_at || null,
    clan_name: row.clan_name,
    rank: toNumber(row.clan_rank),
    previous_rank: toNumber(row.previous_clan_rank),
    points: toNumber(row.clan_points) || 0,
    icon_id: row.icon_id || null,
    icon_url: row.icon_url || null,
    kick_available: row.kick_available,
    starting_members: toNumber(row.starting_members) || 0,
    current_members: toNumber(row.current_members) || 0,
    new_members: toNumber(row.new_members) || 0,
    lost_members: toNumber(row.lost_members) || 0,
    promotions: toNumber(row.promotions) || 0,
    demotions: toNumber(row.demotions) || 0,
    rank_changes: toNumber(row.rank_changes) || 0,
    first_seen_at: row.first_seen_at || null,
    last_seen_at: row.last_seen_at || null,
    latest_snapshot_id: row.latest_snapshot_id || null,
    updated_at: row.updated_at || null
  };
}

function clanActivityEventCounters(rows) {
  const counters = new Map();

  for (const row of rows || []) {
    const clanKey = normalizeText(row.clan_key || row.clan_name);
    if (!clanKey) continue;

    if (!counters.has(clanKey)) {
      counters.set(clanKey, {
        newMembers: 0,
        lostMembers: 0,
        promotions: 0,
        demotions: 0,
        rankChanges: 0
      });
    }

    const counter = counters.get(clanKey);
    if (row.event_type === "member_joined") counter.newMembers += 1;
    if (row.event_type === "member_left" || row.event_type === "member_kicked") counter.lostMembers += 1;
    if (row.event_type === "member_promoted") counter.promotions += 1;
    if (row.event_type === "member_demoted") counter.demotions += 1;
    if (row.event_type === "rank_up" || row.event_type === "rank_down") counter.rankChanges += 1;
  }

  return counters;
}

function normalizeClanActivityRosterOutput(row) {
  return {
    user_id: toNumber(row.user_id),
    username: row.username,
    display_name: row.display_name || null,
    avatar_url: row.avatar_url || null,
    role: row.role || null,
    permission_level: toNumber(row.permission_level),
    join_time: row.join_time || null,
    points: toNumber(row.points) || 0,
    member_rank: toNumber(row.member_rank),
    fetched_at: row.fetched_at || null
  };
}

function normalizeClanActivityEventOutput(row) {
  return {
    event_id: row.event_id,
    event_at: row.event_at,
    detected_at: row.detected_at,
    event_type: row.event_type,
    clan_name: row.clan_name,
    clan_rank: toNumber(row.clan_rank),
    user_id: toNumber(row.user_id),
    username: row.username || null,
    display_name: row.display_name || null,
    previous_value: row.previous_value || null,
    current_value: row.current_value || null,
    previous_rank: toNumber(row.previous_rank),
    current_rank: toNumber(row.current_rank),
    previous_member_role: row.previous_member_role || null,
    current_member_role: row.current_member_role || null,
    previous_permission_level: toNumber(row.previous_permission_level),
    current_permission_level: toNumber(row.current_permission_level),
    details: row.details || {}
  };
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
      const createdAt = safeIso(firstDefined(
        data.dateCreated,
        data.createdAt,
        data.created_at,
        configData.dateCreated,
        configData.createdAt,
        configData.created_at
      ));
      const startedMs = new Date(meta.startedAt || 0).getTime();
      const createdMs = new Date(createdAt || 0).getTime();
      const startPredatesRecordByOverADay =
        Number.isFinite(startedMs) &&
        Number.isFinite(createdMs) &&
        createdMs - startedMs > 24 * 60 * 60 * 1000;

      return {
        battleKey: activeKey || meta.displayName || null,
        displayName: meta.displayName,
        // BIG Games occasionally publishes a stale StartTime from the preceding update.
        // The API record creation time is the safer boundary when that happens.
        startedAt: startPredatesRecordByOverADay ? createdAt : (meta.startedAt || createdAt),
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

async function fetchClanRankRowAtOffset(env, offset, pageSize, cache = null) {
  if (offset < 0) return null;

  const page = Math.floor(offset / pageSize) + 1;
  const pageIndex = offset % pageSize;
  const rows = await fetchClanLeaderboardPage(env, { page, pageSize, cache });
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
  const rows = normalizeMembers(data, battle)
    .slice()
    .sort((a, b) => {
      const ap = toNumber(a.total_points) || 0;
      const bp = toNumber(b.total_points) || 0;
      if (bp !== ap) return bp - ap;
      return (toNumber(a.user_id) || 0) - (toNumber(b.user_id) || 0);
    })
    .map((row, index) => ({
      ...row,
      member_rank: index + 1
    }));
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
        member_rank: row.member_rank,
        member_points: points,
        source_clan_leaderboard_rank: toNumber(clanRow.rank),
        source_clan_leaderboard_points: toNumber(clanRow.points) || 0,
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

async function cleanupGlobalRankRetention(env, {
  clan,
  currentRunKey,
  currentBattleKey,
  currentBattleEndedAt
}) {
  if (String(env.GLOBAL_RANK_RETENTION_ENABLED || "true").toLowerCase() === "false") {
    return { deleted_runs: 0, disabled: true };
  }

  const retentionHours = globalRankRetentionHours(env);
  if (!(retentionHours > 0)) return { deleted_runs: 0, retention_hours: retentionHours };

  const rows = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "run_key,battle_key,status,started_at,finished_at,updated_at",
    clan_name: `eq.${clan}`,
    status: "neq.running",
    order: "started_at.desc",
    limit: String(globalRankRetentionRunLimit(env))
  });
  const cutoffMs = Date.now() - retentionHours * 60 * 60 * 1000;
  const currentBattleEnded = currentBattleEndedAt && isoToMs(currentBattleEndedAt) && isoToMs(currentBattleEndedAt) <= Date.now();
  const groups = new Map();

  for (const row of rows) {
    const key = String(row.battle_key || "unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const deleteKeys = new Set();
  for (const [battleKeyValue, group] of groups.entries()) {
    const sorted = group
      .slice()
      .sort((a, b) => globalRankRunSortTime(b) - globalRankRunSortTime(a));
    const isCurrentBattle = currentBattleKey && battleKeyValue === String(currentBattleKey);
    const isEndedGroup = !isCurrentBattle || currentBattleEnded;
    const keepFinal = isEndedGroup ? (sorted.find(row => String(row.status || "").toLowerCase() === "ok") || sorted[0] || null) : null;

    for (const row of sorted) {
      const runKey = String(row.run_key || "").trim();
      if (!runKey) continue;
      if (runKey === currentRunKey) continue;
      if (keepFinal?.run_key && runKey === String(keepFinal.run_key)) continue;

      const runMs = globalRankRunSortTime(row);
      if (isEndedGroup || (runMs && runMs < cutoffMs)) {
        deleteKeys.add(runKey);
      }
    }
  }

  const deletedRuns = await deleteGlobalRankRunData(env, [...deleteKeys]);
  return {
    deleted_runs: deletedRuns,
    retention_hours: retentionHours,
    mode: currentBattleEnded ? "final-snapshot" : "rolling"
  };
}

function globalRankRunSortTime(row) {
  return isoToMs(row?.finished_at) || isoToMs(row?.updated_at) || isoToMs(row?.started_at) || 0;
}

async function deleteGlobalRankRunData(env, runKeys) {
  const keys = [...new Set((runKeys || []).map(key => String(key || "").trim()).filter(Boolean))];
  if (!keys.length) return 0;

  for (const chunk of chunkValues(keys, 50)) {
    const filter = postgrestInFilter(chunk);
    await supabaseDelete(env, GLOBAL_RANK_CANDIDATES_TABLE, { run_key: filter });
    await supabaseDelete(env, GLOBAL_RANK_HISTORY_TABLE, { run_key: filter });
    await supabaseDelete(env, GLOBAL_RANK_SHARDS_TABLE, { run_key: filter });
    await supabaseDelete(env, GLOBAL_RANK_RUNS_TABLE, { run_key: filter });
  }

  return keys.length;
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

  const cached = await readUserLookupCache(env, ids).catch(() => new Map());
  for (const [id, cachedRow] of cached.entries()) {
    if (cachedRow.username && !isFallbackUsername(cachedRow.username, id)) {
      result.set(id, cachedRow.username);
    }
  }

  const lookupBatch = async batch => {
    const attempts = robloxLookupRetryAttempts(env);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
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

      if (!res.ok) {
        if (attempt < attempts && shouldRetryRobloxResponse(res)) {
          await sleep(retryAfterMs(res, robloxLookupRetryBaseMs(env) * attempt));
          continue;
        }

        return;
      }

      const json = await res.json();
      const cacheRows = [];
      for (const user of json.data || []) {
        const id = toNumber(user.id);
        if (id && user.name) {
          const username = String(user.name);
          result.set(id, username);
          cacheRows.push({
            user_id: id,
            username,
            display_name: user.displayName || null,
            updated_at: new Date().toISOString()
          });
        }
      }

      if (cacheRows.length) {
        await upsertUserLookupCache(env, cacheRows).catch(() => {});
      }

      return;
    }
  };

  const unresolvedBeforeLookup = ids.filter(id => isFallbackUsername(result.get(id), id));
  const batches = chunkValues(unresolvedBeforeLookup, ROBLOX_BATCH_SIZE);
  await runLimited(batches, robloxLookupConcurrency(env), async batch => {
    try {
      await lookupBatch(batch);
    } catch {
      // Keep fallback user_ID labels if Roblox lookup is unavailable.
    }
  });

  const unresolved = ids.filter(id => isFallbackUsername(result.get(id), id));
  if (unresolved.length) {
    const repairBatchSize = clamp(Number(env.ROBLOX_LOOKUP_REPAIR_BATCH_SIZE || 25), 1, ROBLOX_BATCH_SIZE);
    const repairDelayMs = clamp(Number(env.ROBLOX_LOOKUP_REPAIR_DELAY_MS || 350), 0, 10000);

    for (const batch of chunkValues(unresolved, repairBatchSize)) {
      if (repairDelayMs > 0) await sleep(repairDelayMs);

      try {
        await lookupBatch(batch);
      } catch {
        // Keep fallback user_ID labels if the repair pass also fails.
      }
    }
  }

  return result;
}

async function readUserLookupCache(env, userIds) {
  const result = new Map();
  const ids = [...new Set((userIds || []).map(Number).filter(Boolean))];

  for (const batch of chunkValues(ids, 250)) {
    const rows = await supabaseSelect(env, USER_LOOKUP_CACHE_TABLE, {
      select: "user_id,username,display_name,avatar_url,updated_at",
      user_id: `in.(${batch.join(",")})`,
      limit: String(batch.length)
    });

    for (const row of rows) {
      const id = toNumber(row.user_id);
      if (id) result.set(id, row);
    }
  }

  return result;
}

async function upsertUserLookupCache(env, rows) {
  const cleanRows = (rows || [])
    .map(row => ({
      user_id: toNumber(row.user_id),
      username: stringOrNull(row.username),
      display_name: stringOrNull(row.display_name),
      avatar_url: stringOrNull(row.avatar_url),
      updated_at: row.updated_at || new Date().toISOString()
    }))
    .filter(row => row.user_id && row.username && !isFallbackUsername(row.username, row.user_id));

  if (cleanRows.length) {
    await supabaseUpsertChunked(env, USER_LOOKUP_CACHE_TABLE, cleanRows, "user_id", 500);
  }
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

async function addDowntimeFields(env, rows, latest) {
  if (!rows.length) return [];

  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) {
    return rows.map(row => ({
      ...row,
      last_gain_at: null,
      downtime_minutes: null
    }));
  }

  const userIds = [...new Set(rows.map(row => toNumber(row.user_id)).filter(Boolean))];
  if (!userIds.length) {
    return rows.map(row => ({
      ...row,
      last_gain_at: null,
      downtime_minutes: null
    }));
  }

  const sinceIso = latest.battle_started_at || new Date(latestMs - 14 * 24 * 60 * 60 * 1000).toISOString();
  const historyRows = [];

  for (const batch of chunkValues(userIds, 100)) {
    const batchRows = await supabaseSelectPaged(env, SNAPSHOT_TABLE, {
      select: "fetched_at,user_id,total_points",
      clan_name: `eq.${latest.clan_name}`,
      battle_key: `eq.${latest.battle_key}`,
      user_id: `in.(${batch.join(",")})`,
      fetched_at: [`gte.${sinceIso}`, `lte.${latest.fetched_at}`],
      order: "user_id.asc,fetched_at.asc"
    }, 200000);

    historyRows.push(...batchRows);
  }

  const stateByUser = new Map();

  for (const row of historyRows) {
    const userId = toNumber(row.user_id);
    const points = toNumber(row.total_points);
    const at = row.fetched_at;
    const atMs = new Date(at).getTime();
    if (!userId || points === null || !Number.isFinite(atMs)) continue;

    const state = stateByUser.get(userId) || {
      first_seen_at: at,
      latest_seen_at: at,
      previous_points: null,
      last_gain_at: null
    };

    if (!state.first_seen_at) state.first_seen_at = at;
    state.latest_seen_at = at;

    if (state.previous_points !== null && points > state.previous_points) {
      state.last_gain_at = at;
    }

    state.previous_points = points;
    stateByUser.set(userId, state);
  }

  return rows.map(row => {
    const userId = toNumber(row.user_id);
    const state = stateByUser.get(userId);
    const lastGainAt = state?.last_gain_at || null;
    const fallbackAt = state?.first_seen_at || row.fetched_at || latest.fetched_at;
    const anchorMs = new Date(lastGainAt || fallbackAt).getTime();
    const downtimeMinutes = Number.isFinite(anchorMs)
      ? Math.max(0, Math.floor((latestMs - anchorMs) / 60000))
      : null;

    return {
      ...row,
      last_gain_at: lastGainAt,
      downtime_minutes: downtimeMinutes
    };
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
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,username,user_id,total_points,raw_member",
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
    select: "fetched_at,rank,username,user_id,total_points,raw_member",
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

async function readJsonRequest(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    throw httpError(400, "Request body must be valid JSON.");
  }
}

function parseDiscordMessageLink(value) {
  const text = String(value || "").trim();
  const match = text.match(/discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/i);

  if (!match) {
    throw httpError(400, "Paste a Discord message link like https://discord.com/channels/{guild}/{channel}/{message}.");
  }

  if (match[1] === "@me") {
    throw httpError(400, "History imports must come from a server channel message, not a DM.");
  }

  return {
    guildId: match[1],
    channelId: match[2],
    messageId: match[3]
  };
}

function canonicalDiscordMessageUrl(ref) {
  return `https://discord.com/channels/${encodeURIComponent(ref.guildId)}/${encodeURIComponent(ref.channelId)}/${encodeURIComponent(ref.messageId)}`;
}

function csvSet(value) {
  return new Set(String(value || "").split(",").map(item => item.trim()).filter(Boolean));
}

function historyImportValue(env, name, fallbackName, defaultValue = "") {
  const value = env?.[name];
  if (value !== undefined && value !== null && String(value).trim() !== "") return value;

  const fallback = fallbackName ? env?.[fallbackName] : undefined;
  if (fallback !== undefined && fallback !== null && String(fallback).trim() !== "") return fallback;
  return defaultValue;
}

function historyImportFlag(env, name, fallbackName, defaultValue = "false") {
  return String(historyImportValue(env, name, fallbackName, defaultValue)).toLowerCase() === "true";
}

function validateCwBotImportTarget(ref, env) {
  const guildIds = csvSet(env.CW_BOT_IMPORT_GUILD_IDS);
  const channelIds = csvSet(env.CW_BOT_IMPORT_CHANNEL_IDS);

  if (guildIds.size && !guildIds.has(String(ref.guildId))) {
    throw httpError(403, "That Discord server is not allowed for CW_Bot imports.");
  }

  if (channelIds.size && !channelIds.has(String(ref.channelId))) {
    throw httpError(403, "That Discord channel is not allowed for CW_Bot imports.");
  }
}

function validateBigBotImportTarget(ref, env) {
  const guildIds = csvSet(historyImportValue(env, "BIG_BOT_IMPORT_GUILD_IDS", "CW_BOT_IMPORT_GUILD_IDS"));
  const channelIds = csvSet(historyImportValue(env, "BIG_BOT_IMPORT_CHANNEL_IDS", "CW_BOT_IMPORT_CHANNEL_IDS"));

  if (guildIds.size && !guildIds.has(String(ref.guildId))) {
    throw httpError(403, "That Discord server is not allowed for Big Bot imports.");
  }

  if (channelIds.size && !channelIds.has(String(ref.channelId))) {
    throw httpError(403, "That Discord channel is not allowed for Big Bot imports.");
  }
}

async function fetchDiscordMessage(env, channelId, messageId) {
  if (!env.DISCORD_BOT_TOKEN) {
    throw httpError(500, "Missing required Worker secret: DISCORD_BOT_TOKEN");
  }

  const res = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      Accept: "application/json"
    }
  });

  const text = await res.text();

  if (!res.ok) {
    throw httpError(res.status === 403 ? 403 : 502, `Discord message fetch failed (${res.status}): ${text.slice(0, 500)}`);
  }

  return text ? JSON.parse(text) : {};
}

function discordMessageText(message) {
  const parts = [];
  if (message?.content) parts.push(message.content);

  for (const embed of message?.embeds || []) {
    for (const value of [
      embed.author?.name,
      embed.title,
      embed.description,
      embed.footer?.text
    ]) {
      if (value) parts.push(value);
    }

    for (const field of embed.fields || []) {
      if (field.name) parts.push(field.name);
      if (field.value) parts.push(field.value);
    }
  }

  for (const attachment of message?.attachments || []) {
    if (attachment.description) parts.push(attachment.description);
    if (attachment.filename) parts.push(attachment.filename);
  }

  return parts.join("\n").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function firstDiscordMessageImageUrl(message) {
  for (const attachment of message?.attachments || []) {
    const type = String(attachment.content_type || "").toLowerCase();
    const url = String(attachment.url || attachment.proxy_url || "").trim();
    const name = String(attachment.filename || "").toLowerCase();

    if (url && (type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name) || /\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(url))) {
      return url;
    }
  }

  for (const embed of message?.embeds || []) {
    const url = String(embed.image?.url || embed.thumbnail?.url || "").trim();
    if (url) return url;
  }

  return "";
}

async function ocrCwBotHistoryImage(env, imageUrl, context = {}) {
  if (!env.OPENAI_API_KEY) return "";

  const model = String(env.CW_BOT_OCR_MODEL || env.OPENAI_OCR_MODEL || "gpt-5.6").trim();
  const prompt = [
    "Read this CW_Bot PS99 player history image.",
    "Return only JSON with this shape:",
    "{\"player_name\":string|null,\"player_id\":string|null,\"rows\":[{\"battle_name\":string,\"clan_name\":string|null,\"final_rank\":number|null,\"total_ranked\":number|null,\"final_points\":number|null}]}",
    "Use null for unreadable values. Convert k/m/b/t point suffixes to full numbers.",
    context.userId ? `Expected Roblox user ID: ${context.userId}.` : "",
    context.username ? `Expected username: ${context.username}.` : ""
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1600
    })
  });

  const text = await res.text();
  if (!res.ok) {
    throw httpError(502, `OpenAI OCR request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const payload = text ? JSON.parse(text) : {};
  return String(payload?.choices?.[0]?.message?.content || "").trim();
}

function parseCwBotHistoryText(text) {
  const raw = String(text || "").trim();
  if (!raw) return { rows: [] };

  const jsonRows = parseCwBotJsonRows(raw);
  if (jsonRows.rows.length) return jsonRows;

  const lines = raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const playerName = firstDefined(
    raw.match(/history\s+for\s+([A-Za-z0-9_]+)/i)?.[1],
    raw.match(/name:\s*([A-Za-z0-9_]+)/i)?.[1]
  ) || null;
  const playerId = raw.match(/player\s*id:?\s*(\d+)/i)?.[1] || null;
  const battleIndexes = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (isCwBotBattleLine(lines[index])) battleIndexes.push(index);
  }

  const rows = [];

  for (let i = 0; i < battleIndexes.length; i += 1) {
    const start = battleIndexes[i];
    const end = battleIndexes[i + 1] || Math.min(lines.length, start + 14);
    const segment = lines.slice(start, end);
    const battleName = cleanExternalBattleName(segment[0]);
    const clanName = findCwBotClanName(segment);
    const rankInfo = findCwBotRankInfo(segment);
    const points = findCwBotPoints(segment);

    if (!battleName || (rankInfo.rank === null && points === null)) continue;

    rows.push({
      battle_name: battleName,
      clan_name: clanName,
      final_rank: rankInfo.rank,
      total_ranked: rankInfo.total,
      final_points: points
    });
  }

  return { player_name: playerName, player_id: playerId, rows };
}

function parseBigBotHistoryText(text) {
  const raw = String(text || "").trim();
  if (!raw) return { rows: [], page: null, pages: null };

  const lines = raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map(stripDiscordHistoryMarkdown)
    .filter(Boolean);
  const playerLine = lines.find(line => /['’]s\s+Battle\s+History\b/i.test(line)) || "";
  const playerName = playerLine.match(/^(.+?)['’]s\s+Battle\s+History\b/i)?.[1]?.trim() || null;
  const currentClan = lines
    .map(line => line.match(/^Current\s+Clan\s*:\s*\[([^\]]+)\]/i)?.[1]?.trim())
    .find(Boolean) || null;
  const pageMatch = raw.match(/\(\s*Page\s+(\d+)\s+of\s+(\d+)\s*\)/i);
  const page = pageMatch ? toNumber(pageMatch[1]) : 1;
  const pages = pageMatch ? toNumber(pageMatch[2]) : 1;
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const battleMatch = lines[index].match(/^(.+?)\s*\|\s*\[([^\]]+)\]\s*\(\s*#\s*([\d,]+)\s*\)\s*$/i);
    if (!battleMatch) continue;

    const battleName = cleanExternalBattleName(battleMatch[1]);
    const clanName = String(battleMatch[2] || "").trim() || currentClan;
    const finalRank = toNumber(String(battleMatch[3] || "").replace(/,/g, ""));
    let contributionText = "";

    for (let next = index + 1; next < Math.min(lines.length, index + 4); next += 1) {
      if (/^(.+?)\s*\|\s*\[([^\]]+)\]\s*\(\s*#\s*[\d,]+\s*\)\s*$/i.test(lines[next])) break;
      const contributionMatch = lines[next].match(/^Contributions?\s*:\s*(.+)$/i);
      if (contributionMatch) {
        contributionText = contributionMatch[1].trim();
        break;
      }
    }

    const hasUnknownValue = /\?/.test(contributionText);
    const hasRange = /\s[-–—]\s/.test(contributionText);
    const contributionNumber = contributionText.match(/[\d,.]+\s*[kmbt]?/i)?.[0] || "";
    const finalPoints = !hasUnknownValue && !hasRange
      ? parseCwBotNumber(contributionNumber)
      : null;

    if (!battleName || (finalRank === null && finalPoints === null)) continue;

    rows.push({
      battle_name: battleName,
      clan_name: clanName,
      final_rank: finalRank,
      total_ranked: null,
      final_points: finalPoints,
      contribution_text: contributionText || null
    });
  }

  return {
    player_name: playerName,
    current_clan: currentClan,
    page,
    pages,
    rows
  };
}

function stripDiscordHistoryMarkdown(value) {
  return String(value || "")
    .replace(/<a?:[A-Za-z0-9_]+:\d+>/g, " ")
    .replace(/[*_~`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCwBotJsonRows(raw) {
  const parsed = parseJsonObject(raw) || parseJsonObject(extractJsonObjectText(raw));
  if (!parsed) return { rows: [] };

  const sourceRows = Array.isArray(parsed.rows)
    ? parsed.rows
    : Array.isArray(parsed.history)
      ? parsed.history
      : Array.isArray(parsed.battles)
        ? parsed.battles
        : [];

  const rows = sourceRows.map(row => ({
    battle_name: row.battle_name || row.battle || row.name || row.title || row.event,
    clan_name: row.clan_name || row.clan || row.guild,
    final_rank: toNumber(row.final_rank ?? row.rank),
    total_ranked: toNumber(row.total_ranked ?? row.total ?? row.total_players),
    final_points: parseCwBotNumber(row.final_points ?? row.points),
    final_snapshot_at: row.final_snapshot_at || row.date || null
  })).filter(row => cleanExternalBattleName(row.battle_name) && (row.final_rank !== null || row.final_points !== null));

  return {
    player_name: parsed.player_name || parsed.username || parsed.name || null,
    player_id: parsed.player_id || parsed.user_id || null,
    rows
  };
}

function extractJsonObjectText(value) {
  const text = String(value || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) return fenced.trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : "";
}

function isCwBotBattleLine(value) {
  const text = String(value || "").trim();
  const key = normalizeText(text);
  if (!key || key.length < 5) return false;
  if (/history|playerid|betterthan|points|rank|clan|name/i.test(text)) return false;
  return /battle/i.test(text) || /(christmas|turkey|spring|soccer|backrooms|angel|starry|lucky|trickortreat|blockparty|tower|basketball|balloon|poison|pixel|athena)/i.test(key);
}

function findCwBotClanName(segment) {
  const stop = new Set(["points", "rank", "better than", "better", "than"]);

  for (const line of segment.slice(1, 5)) {
    const normalized = line.trim().toLowerCase();
    if (!normalized || stop.has(normalized)) continue;
    if (/\d/.test(line)) continue;
    if (line.length > 18) continue;
    return line;
  }

  return null;
}

function findCwBotRankInfo(segment) {
  const joined = segment.join(" ");
  const match = joined.match(/#?\s*([\d,]+)\s*\/\s*#?\s*([\d,]+)/);
  if (match) {
    return {
      rank: toNumber(match[1].replace(/,/g, "")),
      total: toNumber(match[2].replace(/,/g, ""))
    };
  }

  for (let i = 0; i < segment.length; i += 1) {
    if (!/^rank$/i.test(segment[i])) continue;
    const previous = segment[i - 1] || "";
    const single = previous.match(/#?\s*([\d,]+)/);
    if (single) {
      return {
        rank: toNumber(single[1].replace(/,/g, "")),
        total: null
      };
    }
  }

  return { rank: null, total: null };
}

function findCwBotPoints(segment) {
  const joined = segment.join(" ");
  const direct = joined.match(/([\d,.]+)\s*([kmbt])?\s*(?:points|pts)\b/i);
  if (direct) return parseCwBotNumber(`${direct[1]}${direct[2] || ""}`);

  for (let i = 0; i < segment.length; i += 1) {
    if (!/^points?$/i.test(segment[i])) continue;
    const previous = segment[i - 1] || "";
    const value = parseCwBotNumber(previous);
    if (value !== null) return value;
  }

  return null;
}

function parseCwBotNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : null;

  const raw = String(value || "").trim();
  if (!raw) return null;

  const parsed = parseThresholdNumber(raw);
  if (parsed !== null) return parsed;

  const cleaned = raw.replace(/,/g, "").match(/[\d.]+/);
  if (!cleaned) return null;

  const n = Number(cleaned[0]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function cleanExternalBattleName(value) {
  let text = String(value || "").trim();
  if (!text) return "";

  text = text
    .replace(/^\s*(?:c0ld|cold|wmsy|nogn|nong|dola)\s*[-:|]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function externalBattleKey(value) {
  return normalizeText(cleanExternalBattleName(value));
}

async function trackedHistoryBattleKeySet(env, userId) {
  const keys = new Set();

  for (const table of [SNAPSHOT_TABLE, SNAPSHOT_ARCHIVE_TABLE]) {
    const rows = await supabaseSelect(env, table, {
      select: "battle_key,battle_display_name",
      user_id: `eq.${userId}`,
      order: "fetched_at.desc",
      limit: "50000"
    }).catch(err => {
      if (table === SNAPSHOT_ARCHIVE_TABLE && String(err?.message || "").includes(table)) return [];
      throw err;
    });

    for (const row of rows) {
      for (const value of [row.battle_key, row.battle_display_name]) {
        const key = externalBattleKey(value);
        if (key) keys.add(key);
      }
    }
  }

  return keys;
}

async function externalHistoryBattleKeySet(env, userId, source = "") {
  const params = {
    select: "battle_key",
    user_id: `eq.${userId}`,
    status: "neq.rejected",
    limit: "1000"
  };

  if (source) params.source = `eq.${source}`;

  const rows = await supabaseSelect(env, EXTERNAL_PLAYER_HISTORY_TABLE, params).catch(err => {
    if (String(err?.message || "").includes(EXTERNAL_PLAYER_HISTORY_TABLE)) return [];
    throw err;
  });

  return new Set(rows.map(row => externalBattleKey(row.battle_key)).filter(Boolean));
}

function normalizeExternalHistoryOutput(row) {
  return {
    source: row.source || "cw_bot",
    user_id: toNumber(row.user_id),
    username: row.username || null,
    battle_key: row.battle_key || externalBattleKey(row.battle_name),
    battle_name: row.battle_name || row.battle_key || null,
    clan_name: row.clan_name || null,
    final_rank: toNumber(row.final_rank),
    total_ranked: toNumber(row.total_ranked),
    final_points: toNumber(row.final_points),
    final_snapshot_at: row.final_snapshot_at || null,
    status: row.status || null,
    is_manual_import: row.is_manual_import === true,
    import_batch_id: row.import_batch_id || null,
    imported_from: row.imported_from || null,
    discord_message_url: row.discord_message_url || null,
    image_url: row.image_url || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    reviewed_at: row.reviewed_at || null,
    reviewed_by: row.reviewed_by || null
  };
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
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

async function supabaseInsertChunked(env, tableName, rows, size = 500) {
  const chunks = chunkValues(rows || [], clamp(Number(size || 500), 1, 1000));

  for (const chunk of chunks) {
    if (chunk.length) await supabaseInsert(env, tableName, chunk);
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

async function supabaseUpsertChunked(env, tableName, rows, onConflict, size = 500) {
  const chunks = chunkValues(rows || [], clamp(Number(size || 500), 1, 1000));

  for (const chunk of chunks) {
    if (chunk.length) await supabaseUpsert(env, tableName, chunk, onConflict);
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

async function supabaseRpc(env, functionName, payload = {}) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const url = `${base}/rest/v1/rpc/${encodeURIComponent(functionName)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: supabaseHeaders(env, {
      Prefer: "return=representation"
    }),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase RPC failed for ${functionName} (${res.status}): ${text}`);
  }

  return res.json();
}

async function supabaseCount(env, tableName, params, countColumn = "id") {
  const url = supabaseUrl(env, tableName);
  url.searchParams.set("select", countColumn);
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

function isTruthyParam(url, name) {
  return ["1", "true", "yes", "on"].includes(
    String(url.searchParams.get(name) || "").trim().toLowerCase()
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
    latest_snapshot_id: gate.latest_snapshot_id || null,
    latest_snapshot_at: gate.latest_snapshot_at || null,
    min_snapshot_interval_minutes: gate.min_snapshot_interval_minutes || null,
    next_allowed_at: gate.next_allowed_at || null,
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
  const rawGlobal = parseJsonObject(row.raw_global) || {};
  const sourceClanRank = toNumber(rawGlobal.source_clan_rank);
  const sourceClanPoints = toNumber(rawGlobal.source_clan_points);

  return {
    clan_name: row.clan_name,
    user_id: toNumber(row.user_id),
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    clan_rank: toNumber(row.clan_rank),
    clan_points: toNumber(row.clan_points) || 0,
    member_rank: toNumber(row.clan_rank),
    member_points: toNumber(row.clan_points) || 0,
    source_clan: row.clan_name,
    source_clan_rank: sourceClanRank,
    source_clan_points: sourceClanPoints,
    source_clan_leaderboard_rank: sourceClanRank,
    source_clan_leaderboard_points: sourceClanPoints,
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
  memberRank,
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
    clan_rank: toNumber(memberRank),
    clan_points: toNumber(row.points) || 0,
    member_rank: toNumber(memberRank),
    member_points: toNumber(row.points) || 0,
    source_clan_rank: toNumber(row.source_clan_rank),
    source_clan_points: toNumber(row.source_clan_points) || 0,
    source_clan_leaderboard_rank: toNumber(row.source_clan_rank),
    source_clan_leaderboard_points: toNumber(row.source_clan_points) || 0,
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
  return globalRankLeaderboardLabel(env, latest);
}

function globalRankLeaderboardLabel(env, latest) {
  const stored = String(latest?.leaderboard_name || latest?.event_name || "").trim();
  if (stored) return stored;

  const explicit = String(env.GLOBAL_RANK_LEADERBOARD_LABEL || env.PLAYER_REWARD_LEADERBOARD_LABEL || "").trim();
  if (explicit) return explicit;

  const updateLabel = String(env.PS99_UPDATE_LABEL || "").trim();
  if (updateLabel) {
    return /\bleaderboard\b/i.test(updateLabel) ? updateLabel : `${updateLabel} Leaderboard`;
  }

  const updateNumber = String(env.PS99_UPDATE_NUMBER || "").trim();
  if (updateNumber) return `Update ${updateNumber} Leaderboard`;

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

function globalRankCandidateHistoryLimit(env) {
  return clamp(Number(env.GLOBAL_RANK_CANDIDATE_HISTORY_LIMIT || 48), 1, 96);
}

function globalRankRetentionHours(env) {
  return clamp(Number(env.GLOBAL_RANK_RETENTION_HOURS || 24), 0, 24 * 365 * 10);
}

function globalRankRetentionRunLimit(env) {
  return clamp(Number(env.GLOBAL_RANK_RETENTION_RUN_LIMIT || 2000), 100, 10000);
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
    schedule_offset_minutes: globalRankScheduleOffsetMinutes(env),
    retention_hours: globalRankRetentionHours(env)
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

function clanActivityRuntimeConfig(env) {
  return {
    ingest_clan_activity: String(env.INGEST_CLAN_ACTIVITY || "false").toLowerCase() === "true",
    top_n: clanActivityTopN(env),
    concurrency: clanActivityConcurrency(env),
    clan_delay_ms: clanActivityClanDelayMs(env),
    schedule_minutes: clanActivityScheduleMinutes(env),
    schedule_offset_minutes: clanActivityScheduleOffsetMinutes(env),
    min_snapshot_interval_minutes: clanActivityMinSnapshotIntervalMinutes(env)
  };
}

function clanActivityTopN(env) {
  return clamp(
    Number(env.CLAN_ACTIVITY_TOP_N || DEFAULT_CLAN_ACTIVITY_TOP_N),
    1,
    500
  );
}

function clanActivityClanDelayMs(env) {
  return clamp(
    Number(env.CLAN_ACTIVITY_CLAN_DELAY_MS || DEFAULT_CLAN_ACTIVITY_CLAN_DELAY_MS),
    0,
    120000
  );
}

function clanActivityConcurrency(env) {
  return clamp(
    Number(env.CLAN_ACTIVITY_CONCURRENCY || DEFAULT_CLAN_ACTIVITY_CONCURRENCY),
    1,
    25
  );
}

function clanActivityScheduleMinutes(env) {
  return clamp(
    Number(env.CLAN_ACTIVITY_SCHEDULE_MINUTES || DEFAULT_CLAN_ACTIVITY_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function clanActivityScheduleOffsetMinutes(env) {
  const interval = clanActivityScheduleMinutes(env);
  const offsetValue = env.CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES === undefined || env.CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES
    : env.CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function clanActivityMinSnapshotIntervalMinutes(env) {
  return clamp(
    Number(env.CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES || DEFAULT_CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES),
    0,
    1440
  );
}

function shouldRunClanActivitySchedule(env, scheduledAt = null) {
  const interval = clanActivityScheduleMinutes(env);
  const offset = clanActivityScheduleOffsetMinutes(env);
  const now = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minuteInInterval = minuteOfDay % interval;
  const minutesUntilOffset = (offset - minuteInInterval + interval) % interval;

  return minutesUntilOffset < 5;
}

function ps99VersionRuntimeConfig(env) {
  return {
    ingest_ps99_version_history: String(env.INGEST_PS99_VERSION_HISTORY || "false").toLowerCase() === "true",
    universe_id: ps99UniverseId(env),
    root_place_id: ps99RootPlaceId(env),
    refresh_place_list: String(env.PS99_REFRESH_PLACE_LIST || "true").toLowerCase() !== "false",
    schedule_minutes: ps99VersionScheduleMinutes(env),
    schedule_offset_minutes: ps99VersionScheduleOffsetMinutes(env),
    place_delay_ms: ps99VersionPlaceDelayMs(env),
    version_probe_mode: "asset_delivery_boundary"
  };
}

function ps99RestartRuntimeConfig(env) {
  return {
    ingest_ps99_restarts: ps99RestartEnabled(env),
    universe_id: ps99UniverseId(env),
    place_id: ps99RootPlaceId(env),
    schedule_minutes: 1,
    batch_size: ps99RestartBatchSize(env),
    page_count: ps99RestartPageCount(env),
    sample_size: ps99RestartSampleSize(env),
    confirmation_scans: ps99RestartConfirmations(env),
    cooldown_minutes: ps99RestartCooldownMinutes(env),
    require_version_correlation: ps99RestartRequireVersionCorrelation(env),
    ccu_monitoring: true,
    ccu_source: "Roblox universe playing count",
    ccu_used_for_detection: false,
    server_age_available: false,
    version_correlation: true,
    observed_version_diversity: true
  };
}

function ps99RestartEnabled(env) {
  return String(env.INGEST_PS99_RESTARTS || "false").toLowerCase() === "true";
}

function ps99RestartSampleSize(env) {
  return clamp(
    Number(env.PS99_RESTART_SAMPLE_SIZE || DEFAULT_PS99_RESTART_SAMPLE_SIZE),
    3,
    10
  );
}

function ps99RestartBatchSize(env) {
  const requested = clamp(
    Number(env.PS99_RESTART_BATCH_SIZE || DEFAULT_PS99_RESTART_BATCH_SIZE),
    10,
    100
  );

  if (requested <= 10) return 10;
  if (requested <= 25) return 25;
  if (requested <= 50) return 50;
  return 100;
}

function ps99RestartPageCount(env) {
  return clamp(
    Number(env.PS99_RESTART_PAGE_COUNT || DEFAULT_PS99_RESTART_PAGE_COUNT),
    1,
    10
  );
}

function ps99RestartConfirmations(env) {
  return clamp(
    Number(env.PS99_RESTART_CONFIRMATIONS || DEFAULT_PS99_RESTART_CONFIRMATIONS),
    2,
    5
  );
}

function ps99RestartRequireVersionCorrelation(env) {
  return String(env.PS99_RESTART_REQUIRE_VERSION_CORRELATION || "true").toLowerCase() !== "false";
}

function ps99RestartCooldownMinutes(env) {
  return clamp(
    Number(env.PS99_RESTART_COOLDOWN_MINUTES || DEFAULT_PS99_RESTART_COOLDOWN_MINUTES),
    1,
    60
  );
}

function ps99UniverseId(env) {
  return Math.round(toNumber(env.PS99_UNIVERSE_ID) || DEFAULT_PS99_UNIVERSE_ID);
}

function ps99RootPlaceId(env) {
  return Math.round(toNumber(env.PS99_ROOT_PLACE_ID) || DEFAULT_PS99_ROOT_PLACE_ID);
}

function ps99VersionScheduleMinutes(env) {
  return clamp(
    Number(env.PS99_VERSION_SCHEDULE_MINUTES || DEFAULT_PS99_VERSION_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function ps99VersionScheduleOffsetMinutes(env) {
  const interval = ps99VersionScheduleMinutes(env);
  const offsetValue = env.PS99_VERSION_SCHEDULE_OFFSET_MINUTES === undefined || env.PS99_VERSION_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_PS99_VERSION_SCHEDULE_OFFSET_MINUTES
    : env.PS99_VERSION_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function ps99VersionPlaceDelayMs(env) {
  return clamp(
    Number(env.PS99_VERSION_PLACE_DELAY_MS || 0),
    0,
    120000
  );
}

function shouldRunPs99VersionSchedule(env, scheduledAt = null) {
  const interval = ps99VersionScheduleMinutes(env);
  const offset = ps99VersionScheduleOffsetMinutes(env);
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

function parseJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stringOrNull(value) {
  const text = String(value || "").trim();
  return text || null;
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

function parseRebirthThreshold(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/,/g, "").replace(/\s+/g, "").replace(/\+$/, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
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
  const origins = new Set([
    "https://oapl.github.io",
    "https://c0ld-clan.com",
    "https://www.c0ld-clan.com"
  ]);
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

function publicCacheSeconds(env, key = "") {
  const normalizedKey = String(key || "").trim().toUpperCase();
  const value =
    (normalizedKey && env?.[`${normalizedKey}_CACHE_SECONDS`]) ||
    env?.PUBLIC_CACHE_SECONDS ||
    DEFAULT_PUBLIC_CACHE_SECONDS;
  return clamp(Number(value), 0, 3600);
}

function cacheJson(data, env, secondsOverride = null) {
  const seconds = secondsOverride === null || secondsOverride === undefined
    ? publicCacheSeconds(env)
    : clamp(Number(secondsOverride), 0, 3600);
  return json(data, 200, {
    "Cache-Control": `public, max-age=${Math.max(0, seconds)}, stale-while-revalidate=300`
  });
}

function shouldBypassPublicGetCache(url, request) {
  const cacheControl = request.headers.get("Cache-Control") || "";
  if (/\bno-cache\b|\bno-store\b/i.test(cacheControl)) return true;

  for (const key of ["force", "fresh", "nocache", "no_cache", "_", "v"]) {
    if (url.searchParams.has(key)) return true;
  }

  return false;
}

function publicGetCacheKey(request) {
  const url = new URL(request.url);
  return new Request(url.toString(), { method: "GET" });
}

function isPublicGetCacheEligible(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return false;
  return !shouldBypassPublicGetCache(url, request);
}

async function readPublicGetCache(request, env) {
  if (!isPublicGetCacheEligible(request)) return null;
  if (typeof caches === "undefined" || !caches?.default) return null;
  return caches.default.match(publicGetCacheKey(request));
}

async function writePublicGetCache(request, response, env, ctx) {
  if (!isPublicGetCacheEligible(request)) return;
  if (!response?.ok) return;
  if (typeof caches === "undefined" || !caches?.default) return;

  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAgeMatch = cacheControl.match(/\bmax-age=(\d+)\b/i);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
  if (!/\bpublic\b/i.test(cacheControl) || /\bno-store\b/i.test(cacheControl) || maxAge <= 0) return;

  const put = caches.default.put(publicGetCacheKey(request), response.clone());
  if (ctx?.waitUntil) {
    ctx.waitUntil(put);
  } else {
    await put;
  }
}
