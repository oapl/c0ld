const SNAPSHOT_TABLE = "c0ld_clan_snapshots";
const CURRENT_TABLE = "c0ld_clan_current";
const BATTLE_RUNS_TABLE = "c0ld_battle_runs";
const CLANS_SNAPSHOT_TABLE = "c0ld_clans_snapshots";
const CLANS_CURRENT_TABLE = "c0ld_clans_current";
const CLANS_BATTLE_RUN_CLAN_NAME = "__clans__";
const DEFAULT_CLAN_NAME = "c0ld";
const DEFAULT_BATTLE_KEY = "auto";
const DEFAULT_RETENTION_HOURS = 336;
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const ROBLOX_BATCH_SIZE = 100;
const CLANS_PAGE_SIZE = 100;

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
          ingest_skip_reason: gate.allowed ? null : gate.reason
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
      } else if (request.method === "POST" && url.pathname === "/api/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(env, "manual", url.searchParams.get("clan"), isForceRequest(url));
      } else if (request.method === "POST" && url.pathname === "/api/clans/ingest") {
        requireAdmin(request, env);
        response = await handleClansIngest(env, "manual", isForceRequest(url));
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
    ctx.waitUntil(runScheduledIngests(env));
  }
};

async function runScheduledIngests(env, force = false) {
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

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    rows: rows.map(row => ({
      battle: row.battle_key,
      display_name: cleanBattleDisplayName(row.battle_key, row.battle_display_name),
      battle_start_iso: row.battle_started_at || null,
      battle_end_iso: row.battle_ended_at || null,
      first_snapshot: row.first_seen_at || null,
      last_snapshot: row.latest_snapshot_at || row.last_seen_at || null,
      latest_snapshot_id: row.latest_snapshot_id || null,
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

  const rows = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, params);

  return cacheJson({
    generated_at: new Date().toISOString(),
    battle,
    clan_name: clan || null,
    hours,
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

  return cacheJson({
    generated_at: new Date().toISOString(),
    rows: [...byBattle.values()].sort((a, b) =>
      new Date(b.last_snapshot || 0) - new Date(a.last_snapshot || 0)
    ).slice(0, limit)
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
  const retentionHours = Number(env.RETENTION_HOURS || DEFAULT_RETENTION_HOURS);
  if (!Number.isFinite(retentionHours) || retentionHours <= 0) return;

  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();
  const url = supabaseUrl(env, SNAPSHOT_TABLE);
  url.searchParams.set("fetched_at", `lt.${cutoff}`);
  url.searchParams.set("clan_name", `eq.${clan}`);

  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: supabaseHeaders(env)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase prune failed (${res.status}): ${text}`);
  }
}

async function pruneOldTableRows(env, tableName) {
  const retentionHours = Number(env.RETENTION_HOURS || DEFAULT_RETENTION_HOURS);
  if (!Number.isFinite(retentionHours) || retentionHours <= 0) return;

  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();
  await supabaseDelete(env, tableName, {
    fetched_at: `lt.${cutoff}`
  });
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
  const retentionHours = Number(env.RETENTION_HOURS || DEFAULT_RETENTION_HOURS);
  const maxHours = Number.isFinite(retentionHours) && retentionHours > 0
    ? retentionHours
    : 100000;

  return clamp(requested, 1, maxHours);
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
