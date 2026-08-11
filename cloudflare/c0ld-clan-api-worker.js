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
const CW_BOT_HISTORY_TABLE = "c0ld_cwbot_history_imports";
const CLAN_ACTIVITY_ROSTER_TABLE = "c0ld_clan_activity_roster_snapshots";
const CLAN_ACTIVITY_CURRENT_TABLE = "c0ld_clan_activity_current";
const CLAN_ACTIVITY_EVENTS_TABLE = "c0ld_clan_activity_events";
const CLAN_ACTIVITY_SUMMARY_TABLE = "c0ld_clan_activity_summary";
const LEAGUE_SNAPSHOT_TABLE = "ps99_league_snapshots";
const LEAGUE_CURRENT_TABLE = "ps99_league_current";
const PS99_PLACES_TABLE = "c0ld_ps99_places";
const PS99_VERSION_EVENTS_TABLE = "c0ld_ps99_version_events";
const PS99_RESTART_STATE_TABLE = "c0ld_ps99_restart_state";
const PS99_RESTART_EVENTS_TABLE = "c0ld_ps99_restart_events";
const PS99_RESTART_PROBE_OBSERVATIONS_TABLE = "c0ld_ps99_restart_probe_observations";
const PS99_RESTART_PROBE_STATE_TABLE = "c0ld_ps99_restart_probe_state";
const PS99_CCU_SAMPLES_TABLE = "c0ld_ps99_ccu_samples";
const PS99_RESTART_OBSERVATIONS_TABLE = "c0ld_ps99_restart_observations";
const PS99_RESTART_CANDIDATES_TABLE = "c0ld_ps99_restart_candidates";
const PS99_RESTART_CANDIDATE_TIMELINE_TABLE = "c0ld_ps99_restart_candidate_timeline";
const PS99_RESTART_ANALYTICS_STATE_TABLE = "c0ld_ps99_restart_analytics_state";
const ROBLOX_RELEASE_STATE_TABLE = "c0ld_roblox_release_state";
const ROBLOX_RELEASE_EVENTS_TABLE = "c0ld_roblox_release_events";
const ROBLOX_FFLAG_STATE_TABLE = "c0ld_roblox_fflag_state";
const ROBLOX_FFLAG_EVENTS_TABLE = "c0ld_roblox_fflag_events";
const PS99_DEV_BLOG_STATE_TABLE = "c0ld_ps99_dev_blog_state";
const PS99_DEV_BLOG_EVENTS_TABLE = "c0ld_ps99_dev_blog_events";
const REWARD_CUTOFF_ALERT_STATE_TABLE = "c0ld_reward_cutoff_alert_state";
const DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE = "discord_hourly_clan_assignments";
const DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE = "discord_clan_log_assignments";
const DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE = "discord_clan_tracker_assignments";
const DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE = "discord_clan_compare_assignments";
const DISCORD_OFFLINE_PING_GUILDS_TABLE = "discord_offline_ping_guilds";
const DISCORD_OFFLINE_PING_CLANS_TABLE = "discord_offline_ping_clans";
const DISCORD_OFFLINE_PING_LEAGUES_TABLE = "discord_offline_ping_leagues";
const DISCORD_OFFLINE_PING_USERS_TABLE = "discord_offline_ping_users";
const DISCORD_OFFLINE_PING_ALERT_STATE_TABLE = "discord_offline_ping_alert_state";
const DISCORD_ROVER_MEMBER_LINKS_TABLE = "discord_rover_member_links";
const DISCORD_HOURLY_CLAN_ASSIGNMENT_COLUMNS = "assignment_key,channel_id,guild_id,channel_type,clan_name,assigned_by,enabled,alert_user_id,alert_set_by,alert_updated_at,last_posted_at,last_message_id,last_snapshot_at,last_error,created_at,updated_at";
const DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS = "assignment_key,channel_id,guild_id,channel_type,clan_name,clan_key,assigned_by,enabled,last_event_id,last_event_at,last_error,created_at,updated_at";
const DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS = "assignment_key,channel_id,guild_id,channel_type,clan_name,clan_key,assigned_by,enabled,message_id,last_updated_at,last_error,created_at,updated_at";
const DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS = "assignment_key,channel_id,guild_id,channel_type,clan_name,clan_key,assigned_by,enabled,message_id,last_updated_at,last_error,created_at,updated_at";
const DISCORD_API_BASE = "https://discord.com/api/v10";
const DEFAULT_CW_BOT_USER_ID = "1219229814150398003";
const DEFAULT_BIG_BOT_USER_ID = "920446937986129960";
const CLANS_BATTLE_RUN_CLAN_NAME = "__clans__";
const DEFAULT_CLAN_NAME = "c0ld";
const DEFAULT_BATTLE_KEY = "auto";
const DEFAULT_HISTORY_MAX_HOURS = 100000;
const DEFAULT_PUBLIC_CACHE_SECONDS = 30;
const DEFAULT_DERIVED_SNAPSHOT_CACHE_SECONDS = 3600;
const ARCHIVE_PRUNE_BATCH_SIZE = 500;
const ARCHIVE_PRUNE_MAX_BATCHES = 10;
const ROBLOX_BATCH_SIZE = 100;
const CLANS_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLAN_SCAN_LIMIT = 500;
const DEFAULT_GLOBAL_RANK_CLAN_PAGE_SIZE = 100;
const DEFAULT_GLOBAL_RANK_CLANS_PER_RUN = 25;
// Search responses are served from the completed global-rank pool. A full scan
// is deliberately scheduled on the 00/20/40-minute cadence so `/search` has a
// clear, predictable twenty-minute freshness contract.
const DEFAULT_GLOBAL_RANK_SCHEDULE_MINUTES = 20;
const DEFAULT_GLOBAL_RANK_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_PLAYER_REWARD_CUTOFF_RANKS = [3, 10, 100, 250, 500, 1000, 10000];
const DEFAULT_CLAN_REWARD_CUTOFF_RANKS = [1, 3, 10, 30, 50, 250, 500];
const DEFAULT_CLAN_REWARD_CATEGORIES = [
  { label: "#1", best: 1, worst: 1, rank: 1 },
  { label: "#2-3", best: 2, worst: 3, rank: 3 },
  { label: "#4-10", best: 4, worst: 10, rank: 10 },
  { label: "#11-50", best: 11, worst: 50, rank: 50 },
  { label: "#51-250", best: 51, worst: 250, rank: 250 },
  { label: "Top 30", best: 1, worst: 30, rank: 30 },
  { label: "Top 50", best: 1, worst: 50, rank: 50 },
  { label: "Top 500", best: 1, worst: 500, rank: 500 }
];
const DEFAULT_LEAGUE_REWARD_CUTOFF_RANKS = [1, 3, 15, 50, 100, 250, 2000];
const DEFAULT_REWARD_CUTOFF_SCHEDULE_MINUTES = 5;
const DEFAULT_REWARD_CUTOFF_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_LEAGUE_API_BASE = "https://yamo-league-api-worker.opal-dde.workers.dev";
const DEFAULT_ROBLOX_STATUS_API_URL = "https://api.status.io/1.0/status/59db90dbcdeb2f04dadcf16d";
const DISCORD_ALERT_COLOR = 0x3498db;
const DISCORD_ALERT_THUMBNAIL_URL = "https://static.wikia.nocookie.net/pet-simulator/images/3/3e/PS99_Genie_Fox.png/revision/latest/scale-to-width/360?cb=20260718171435";
const DISCORD_ALERT_FOOTER_TEXT = "🧞‍♀️ Luna Pet Sim 99 Bot 🏳️‍🌈 ∙ by Cinnamowopal | Last Updated:";
const DEFAULT_DETECTOR_ALERT_ROLE_ID = "1529578783131177131";
const DISCORD_COMPONENTS_V2_FLAG = 1 << 15;
const LEGACY_PLAYER_REWARD_CUTOFF_RANKS = "3,100,1000,1050,1150,6150,30000";
const LEGACY_CLAN_REWARD_CUTOFF_RANKS = "3,10,50,100,500";
const DEFAULT_GLOBAL_RANK_SHARD_COUNT = 1;
const DEFAULT_GLOBAL_RANK_SHARD_CONCURRENCY = 1;
const DEFAULT_GLOBAL_RANK_RETRY_ATTEMPTS = 6;
const DEFAULT_GLOBAL_RANK_RETRY_BASE_MS = 15000;
const DEFAULT_GLOBAL_RANK_RETENTION_DELETE_RUNS_PER_PASS = 3;
const LEAGUE_MILESTONE_LIST_TOP_LIMIT_DEFAULT = 1000;
const DEFAULT_GLOBAL_RANK_CLAN_DELAY_MS = 1000;
const DEFAULT_GLOBAL_RANK_CANDIDATE_CLAN_BATCH_SIZE = 10;
const DEFAULT_CLAN_ACTIVITY_TOP_N = 100;
// Clan logs need a fresh roster quickly enough to be useful in Discord.  The
// Worker cron is already allowed to wake every minute; this controls the
// roster cadence, not the cron itself.
const DEFAULT_CLAN_ACTIVITY_SCHEDULE_MINUTES = 5;
const DEFAULT_CLAN_ACTIVITY_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_CLAN_ACTIVITY_CLAN_DELAY_MS = 250;
const DEFAULT_CLAN_ACTIVITY_CONCURRENCY = 8;
const DEFAULT_CLAN_ACTIVITY_MIN_SNAPSHOT_INTERVAL_MINUTES = 5;
const DEFAULT_OFFLINE_ALERT_MINUTES = 30;
const DEFAULT_OFFLINE_POST_RATE_MINUTES = 30;
const DEFAULT_OFFLINE_ALERT_SCHEDULE_MINUTES = 5;
const DEFAULT_OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_OFFLINE_LOOKBACK_BUFFER_MINUTES = 30;
const DEFAULT_MEMBER_SNAPSHOT_MIN_INTERVAL_MINUTES = 5;
const DEFAULT_CLANS_SNAPSHOT_MIN_INTERVAL_MINUTES = 5;
const DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCHEDULE_MINUTES = 15;
const DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCAN_LIMIT = 50;
const DEFAULT_BATTLE_FINAL_PULL_GRACE_MINUTES = 0;
const TOP_CLAN_REBIRTH_POINTS = 120;
const DEFAULT_PS99_UNIVERSE_ID = 3317771874;
const DEFAULT_PS99_ROOT_PLACE_ID = 8737899170;
const DEFAULT_PS99_VERSION_SCHEDULE_MINUTES = 5;
const DEFAULT_PS99_VERSION_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_PS99_VERSION_HISTORY_LIMIT = 100;
const DEFAULT_ROBLOX_RELEASE_BINARY_TYPE = "WindowsPlayer";
const DEFAULT_ROBLOX_RELEASE_CHANNEL = "live";
const DEFAULT_ROBLOX_RELEASE_SCHEDULE_MINUTES = 5;
const DEFAULT_ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES = 0;
const DEFAULT_ROBLOX_RELEASE_HISTORY_LIMIT = 100;
const DEFAULT_ROBLOX_FFLAG_SCHEDULE_MINUTES = 15;
const DEFAULT_PS99_DEV_BLOG_SCHEDULE_MINUTES = 1;
const DEFAULT_ROBLOX_FFLAGS_SOURCE_URL = "https://clientsettings.roblox.com/v2/settings/application/PCDesktopClient/channel/live";
const DEFAULT_PS99_DEV_BLOG_FEED_URL = "https://www.biggames.io/post";
const DEFAULT_PS99_RESTART_SAMPLE_SIZE = 10;
const DEFAULT_PS99_RESTART_BATCH_SIZE = 100;
const DEFAULT_PS99_RESTART_PAGE_COUNT = 5;
const DEFAULT_PS99_RESTART_CONFIRMATIONS = 2;
const DEFAULT_PS99_RESTART_COOLDOWN_MINUTES = 10;
const DEFAULT_PS99_RESTART_HISTORY_LIMIT = 100;
const DEFAULT_PS99_RESTART_PROBE_QUORUM = 3;
const DEFAULT_PS99_RESTART_PROBE_SAME_VERSION_QUORUM = 4;
const DEFAULT_PS99_RESTART_PROBE_MACHINE_QUORUM = 2;
const DEFAULT_PS99_RESTART_PROBE_WINDOW_SECONDS = 600;
const DEFAULT_PS99_RESTART_PROBE_STALE_SECONDS = 120;
const DEFAULT_PS99_RESTART_PROBE_HISTORY_SECONDS = 1800;
const DEFAULT_PS99_RESTART_INTEL_PRE_MINUTES = 15;
const DEFAULT_PS99_RESTART_INTEL_POST_MINUTES = 15;
const DEFAULT_PS99_RESTART_INTEL_MERGE_MINUTES = 90;
const DEFAULT_PS99_RESTART_INTEL_CCU_DROP_3M_PERCENT = 5;
const DEFAULT_PS99_RESTART_INTEL_CCU_DROP_10M_PERCENT = 8;
const DEFAULT_PS99_RESTART_INTEL_TURNOVER_PERCENT = 50;
const DEFAULT_PS99_RESTART_INTEL_MIN_PUBLIC_SERVERS = 20;
const DEFAULT_PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES = 60;
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
          collection_phase: gate.collection_phase || (gate.allowed ? "active_event" : "closed"),
          in_grace_period: gate.in_grace_period === true,
          battle_data_cutoff: {
            source: "active_battle_ended_at",
            final_pull_grace_minutes: battleFinalPullGraceMinutes(env),
            cutoff_at: gate.battle_cutoff_at || activeBattleMeta?.endedAt || null,
            hard_stop_at: gate.hard_stop_at || null,
            bundle_guard: true,
            global_rank_guard: true,
            scheduled_timestamp_snapshots: true
          },
          snapshot_write_guards: battleSnapshotRuntimeConfig(env),
          global_rank_config: globalRankRuntimeConfig(env),
          clan_activity_config: clanActivityRuntimeConfig(env),
          hourly_assignment_clan_config: hourlyAssignmentClanRuntimeConfig(env),
          offline_ping_config: offlinePingRuntimeConfig(env),
          ps99_version_config: ps99VersionRuntimeConfig(env),
          roblox_release_config: robloxReleaseRuntimeConfig(env),
          ps99_restart_config: ps99RestartRuntimeConfig(env),
          ps99_alert_config: ps99AlertRuntimeConfig(env)
        });
      } else if (request.method === "GET" && url.pathname === "/api/big-games/health") {
        response = await handleBigGamesApiHealth(env);
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
      } else if (request.method === "GET" && url.pathname === "/api/clans/compare") {
        response = await handleClansCompare(request, env);
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
      } else if (request.method === "GET" && (
        url.pathname === "/api/persistent-posts/status"
        || url.pathname === "/api/reward-cutoffs/status"
      )) {
        requireAdmin(request, env);
        response = json(await persistentDiscordPostStatus(env), 200, {
          "Cache-Control": "no-store"
        });
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/discord/hourly-assignments"
      ) {
        requireAdmin(request, env);
        response = await handleDiscordHourlyClanAssignments(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/discord/clan-log-assignments"
      ) {
        requireAdmin(request, env);
        response = await handleDiscordClanLogAssignments(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/discord/clan-tracker-assignments"
      ) {
        requireAdmin(request, env);
        response = await handleDiscordClanTrackerAssignments(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/discord/clan-compare-assignments"
      ) {
        requireAdmin(request, env);
        response = await handleDiscordClanCompareAssignments(request, env);
      } else if (
        ["GET", "POST", "PATCH"].includes(request.method)
        && url.pathname === "/api/offline/config"
      ) {
        requireAdmin(request, env);
        response = await handleOfflinePingConfig(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/offline/clans"
      ) {
        requireAdmin(request, env);
        response = await handleOfflinePingClans(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/offline/leagues"
      ) {
        requireAdmin(request, env);
        response = await handleOfflinePingLeagues(request, env);
      } else if (
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
        && url.pathname === "/api/offline/users"
      ) {
        requireAdmin(request, env);
        response = await handleOfflinePingUsers(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/offline/status") {
        requireAdmin(request, env);
        response = await handleOfflinePingStatus(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/offline/rover/lookup") {
        requireAdmin(request, env);
        response = await handleOfflineRoVerLookup(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/offline/bloxlink/lookup") {
        requireAdmin(request, env);
        response = await handleOfflineBloxlinkLookup(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/global/search") {
        response = await handleGlobalSearch(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/external-history/cwbot/missing") {
        response = await handleMissingCwBotImports(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/external-history") {
        response = await handleExternalHistory(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/cwbot/import") {
        response = await handleCwBotHistoryImport(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/cwbot/guild-channels") {
        response = await handleCwBotHistoryGuildChannels(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/cwbot/archived-threads") {
        response = await handleCwBotHistoryArchivedThreads(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/external-history/cwbot/channel-scan") {
        response = await handleCwBotHistoryChannelScan(request, env);
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
      } else if (request.method === "GET" && url.pathname === "/api/roblox/versions") {
        response = await handleRobloxReleasedVersions(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/roblox/fflags") {
        response = await handleRobloxFflags(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/dev-blogs") {
        response = await handlePs99DevBlogs(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restarts") {
        response = await handlePs99Restarts(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restart-intelligence/candidates") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceCandidates(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restart-intelligence/report") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceReport(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-intelligence/review") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceReview(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-intelligence/refresh-message") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceRefreshMessage(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-intelligence/refresh-all") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceRefreshAll(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restart-intelligence/analytics") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceAnalytics(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-intelligence/analytics/refresh") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceAnalyticsRefresh(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-intelligence/resolve-pending") {
        requireAdmin(request, env);
        response = await handlePs99RestartIntelligenceResolvePending(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/ps99/restart-probes") {
        requireAdmin(request, env);
        response = await handlePs99RestartProbeStatus(env);
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
      } else if (request.method === "POST" && url.pathname === "/api/offline/check") {
        requireAdmin(request, env);
        const offlineCheckOptions = {
          force: isForceRequest(url),
          guildId: url.searchParams.get("guild_id") || "",
          sourceMode: normalizeOfflineWatchSourceMode(url.searchParams.get("source_mode") || url.searchParams.get("source"))
        };

        // A Discord interaction must be acknowledged promptly.  A full offline
        // scan can include multiple roster reads, identity lookups, and Discord
        // deliveries, so let an explicit async request return immediately while
        // the same scan continues through the Worker execution context.
        if (isTruthyParam(url, "async") && typeof ctx?.waitUntil === "function") {
          ctx.waitUntil(
            handleOfflinePingCheck(env, "manual", offlineCheckOptions).catch((err) => {
              console.error("Queued offline ping check failed", err);
            })
          );
          response = noStoreJson({
            ok: true,
            accepted: true,
            guild_id: offlineCheckOptions.guildId || null,
            queued_at: new Date().toISOString()
          }, 202);
        } else {
          response = await handleOfflinePingCheck(env, "manual", offlineCheckOptions);
        }
      } else if (request.method === "POST" && url.pathname === "/api/offline/test-post") {
        requireAdmin(request, env);
        response = await handleOfflinePingTestPost(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/versions/ingest") {
        requireAdmin(request, env);
        response = await handlePs99VersionIngest(env, "manual", {
          force: isForceRequest(url)
        });
      } else if (request.method === "POST" && url.pathname === "/api/roblox/versions/ingest") {
        requireAdmin(request, env);
        response = await handleRobloxReleasedVersionIngest(env, "manual", {
          force: isForceRequest(url)
        });
      } else if (request.method === "POST" && url.pathname === "/api/roblox/fflags/ingest") {
        requireAdmin(request, env);
        response = await handleRobloxFflagIngest(env, "manual", { force: isForceRequest(url) });
      } else if (request.method === "POST" && url.pathname === "/api/ps99/dev-blogs/ingest") {
        requireAdmin(request, env);
        response = await handlePs99DevBlogIngest(env, "manual", { force: isForceRequest(url) });
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restarts/ingest") {
        requireAdmin(request, env);
        response = await handlePs99RestartIngest(env, "manual");
      } else if (request.method === "POST" && url.pathname === "/api/ps99/restart-probes") {
        requirePs99RestartProbe(request, env);
        response = await handlePs99RestartProbeIngest(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/ps99/alerts/test") {
        requireAdmin(request, env);
        response = await handlePs99AlertTest(env, url);
      } else if (request.method === "POST" && (
        url.pathname === "/api/persistent-posts/post"
        || url.pathname === "/api/reward-cutoffs/post"
      )) {
        requireAdmin(request, env);
        response = json(await postPersistentDiscordMessages(env, {
          force: isForceRequest(url),
          type: url.searchParams.get("type")
        }), 200, {
          "Cache-Control": "no-store"
        });
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
        message: err?.message || String(err),
        details: err?.details || undefined
      }, err?.status || 500), request, env);
    }
  },

  async scheduled(event, env, ctx) {
    const scheduledAt = event?.scheduledTime ? new Date(event.scheduledTime) : null;
    const standaloneJobs = [];

    if (ps99RestartEnabled(env)) {
      standaloneJobs.push(runScheduledStandaloneJob("ps99-restarts", () => handlePs99RestartIngest(env, "schedule")));
    }

    if (isPs99RestartCron(event?.cron)) {
      if (String(env.INGEST_PS99_VERSION_HISTORY || "false").toLowerCase() === "true" && shouldRunPs99VersionSchedule(env, scheduledAt)) {
        standaloneJobs.push(runScheduledStandaloneJob("ps99-versions", () => handlePs99VersionIngest(env, "schedule", { force: false })));
      }
      if (String(env.INGEST_ROBLOX_RELEASE_VERSION_HISTORY || "false").toLowerCase() === "true" && shouldRunRobloxReleaseSchedule(env, scheduledAt)) {
        standaloneJobs.push(runScheduledStandaloneJob("roblox-release-version", () => handleRobloxReleasedVersionIngest(env, "schedule", { force: false })));
      }
      if (String(env.INGEST_ROBLOX_FFLAGS || "false").toLowerCase() === "true" && shouldRunRobloxFflagSchedule(env, scheduledAt)) {
        standaloneJobs.push(runScheduledStandaloneJob("roblox-fflags", () => handleRobloxFflagIngest(env, "schedule", { force: false })));
      }
      if (String(env.INGEST_PS99_DEV_BLOGS || "false").toLowerCase() === "true" && shouldRunPs99DevBlogSchedule(env, scheduledAt)) {
        standaloneJobs.push(runScheduledStandaloneJob("ps99-dev-blogs", () => handlePs99DevBlogIngest(env, "schedule", { force: false })));
      }
      if (shouldRefreshPs99RestartAnalytics(env, scheduledAt)) {
        standaloneJobs.push(runScheduledStandaloneJob(
          "ps99-restart-analytics",
          () => refreshPs99RestartAnalyticsDashboard(env, { reason: "schedule" })
        ));
      }
      // The production Worker uses the every-minute cron for both restart
      // observation and the normal clan/global schedules. Do not return here:
      // doing so turns the per-minute restart cron into a restart-only lane
      // and silently starves all member, clan, global-rank, and Discord data
      // refreshes. The individual jobs below retain their own cadence guards.
    }

    const mainJobs = runScheduledIngests(env, false, scheduledAt);
    ctx.waitUntil(standaloneJobs.length ? Promise.allSettled([...standaloneJobs, mainJobs]) : mainJobs);
  }
};

async function handleBigGamesApiHealth(env) {
  const checkedAt = new Date().toISOString();
  const origins = await Promise.all([
    probeBigGamesApiOrigin("https://biggamesapi.io", env),
    probeBigGamesApiOrigin("https://ps99.biggamesapi.io", env)
  ]);
  const healthy = origins.filter(origin => origin.ok);
  const ok = healthy.length > 0;

  return noStoreJson({
    ok,
    service: "big-games-api",
    status: !ok ? "unavailable" : healthy.length === origins.length ? "operational" : "degraded",
    checked_at: checkedAt,
    healthy_origins: healthy.length,
    total_origins: origins.length,
    origins
  }, ok ? 200 : 503);
}

async function probeBigGamesApiOrigin(origin, env) {
  const startedAt = Date.now();
  const timeoutMs = clamp(Number(env.BIG_GAMES_HEALTH_TIMEOUT_MS || 5000), 1000, 15000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL("/api/clans", origin);
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("sort", "Points");
  url.searchParams.set("sortOrder", "desc");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "c0ld-Big-Games-Health"
      },
      signal: controller.signal,
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch {
      // The response body is intentionally summarized below.
    }
    const rows = payload ? (extractClanArrays(payload)[0] || []) : [];
    const apiStatusOk = !payload?.status || String(payload.status).toLowerCase() === "ok";
    const ok = response.ok && apiStatusOk && rows.length > 0;

    return {
      origin,
      ok,
      http_status: response.status,
      latency_ms: Date.now() - startedAt,
      sample_clan: rows[0] ? normalizeClanRankRow(rows[0], 1).clan_name || null : null,
      error: ok
        ? null
        : !response.ok
          ? `HTTP ${response.status}`
          : !payload
            ? "Response was not valid JSON."
            : !apiStatusOk
              ? `API status ${payload.status}`
              : "No clan leaderboard rows were returned."
    };
  } catch (error) {
    return {
      origin,
      ok: false,
      http_status: null,
      latency_ms: Date.now() - startedAt,
      sample_clan: null,
      error: error?.name === "AbortError"
        ? `Timed out after ${timeoutMs}ms.`
        : String(error?.message || error || "Unknown Big Games API error").slice(0, 300)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isPs99RestartCron(value) {
  const cron = String(value || "").trim().replace(/\s+/g, " ");
  return PS99_RESTART_CRONS.has(cron);
}

async function runScheduledStandaloneJob(label, run) {
  try {
    const response = await run();
    const payload = await responseJson(response);
    const result = {
      label,
      ok: response.ok,
      status: response.status,
      skipped: Boolean(payload?.skipped),
      reason: payload?.reason || null,
      ps99_places_checked: payload?.places_checked ?? null,
      ps99_events_inserted: payload?.version_events_inserted ?? null,
      ps99_newest_version: payload?.newest_version ?? null,
      restart_detected: payload?.restart_detected ?? null,
      restart_suppressed: payload?.restart_suppressed ?? null,
      checked_at: payload?.checked_at || null,
      webhook_alert: payload?.webhook_alert || null,
      message: payload?.message || null
    };
    console.log("scheduled standalone result", JSON.stringify(result));
    return result;
  } catch (err) {
    const result = {
      label,
      ok: false,
      status: err?.status || 500,
      skipped: false,
      reason: "error",
      message: err?.message || String(err)
    };
    console.error("scheduled standalone failed", JSON.stringify(result));
    return result;
  }
}

async function runScheduledIngests(env, force = false, scheduledAt = null, options = {}) {
  const runOptions = normalizeIngestRunOptions({ scheduledAt });
  const results = [];
  let runBattleDataJobs = true;

  if (!force) {
    const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
    const configuredBattleKey = activeBattleMeta?.battleKey || battleKey(env);
    const scheduleBattleMeta = mergeBattleMeta(
      extractBattleMeta({}, configuredBattleKey, env, {
        allowEnvDisplayName: false,
        allowEnvTiming: true
      }),
      activeBattleMeta,
      configuredBattleKey,
      { allowMismatch: true }
    );
    const scheduleGate = battleIngestGate({
      activeBattleMeta,
      battleMeta: scheduleBattleMeta,
      battleKey: configuredBattleKey,
      env,
      force,
      scheduledAt: runOptions.scheduledAt,
      now: runOptions.now
    });

    if (!scheduleGate.allowed) {
      runBattleDataJobs = false;
      results.push(scheduledBattleDataSkippedResult(scheduleGate, runOptions.fetchedAt));
    } else {
      runOptions.activeBattleMeta = activeBattleMeta;
    }
  }

  const jobRunOptions = {
    scheduledAt: runOptions.scheduledAt,
    activeBattleMeta: runOptions.activeBattleMeta || null
  };
  const jobs = [];

  if (runBattleDataJobs) {
    // A Discord /clan tracker assignment is also an opt-in to the normal
    // member-snapshot collector.  This keeps the tracker, its deltas, and
    // its five-minute refresh on the same data source without requiring a
    // separate CLAN_NAMES environment-variable edit for every new clan.
    const configuredClans = await fetchTrackerAssignmentClanNames(env, clanNames(env));
    jobs.push(...configuredClans.map(clan => ({
      label: `members:${clan}`,
      run: () => handleIngest(env, "schedule", clan, force, jobRunOptions)
    })));

    if (force || (hourlyAssignmentClanIngestEnabled(env) && shouldRunHourlyAssignmentClanSchedule(env, scheduledAt))) {
      const assignedHourlyClans = await fetchHourlyAssignmentClanNames(env, configuredClans).catch(err => {
        console.warn("scheduled hourly assignment clan lookup failed", err?.message || String(err));
        return [];
      });
      jobs.push(...assignedHourlyClans.map(clan => ({
        label: `hourly-members:${clan}`,
        run: () => handleIngest(env, "schedule", clan, force, jobRunOptions)
      })));
    }

    if (String(env.INGEST_CLANS_LEADERBOARD || "true").toLowerCase() !== "false") {
      jobs.push({
        label: "clans",
        run: () => handleClansIngest(env, "schedule", force, jobRunOptions)
      });
    }

    if (String(env.INGEST_GLOBAL_RANKS || "false").toLowerCase() === "true") {
      const globalClan = clanName(env);
      const hasRunningGlobalScan = await hasRunningGlobalRankRun(env, globalClan).catch(() => false);

      if (force || hasRunningGlobalScan || shouldRunGlobalRankSchedule(env, scheduledAt)) {
        jobs.push({
          label: "global-ranks",
          run: () => handleGlobalRankIngest(env, "schedule", globalClan, force, jobRunOptions)
        });
      }
    }

    if (String(env.INGEST_CLAN_ACTIVITY || "false").toLowerCase() === "true") {
      if (force || shouldRunClanActivitySchedule(env, scheduledAt)) {
        jobs.push({
          label: "clan-activity",
          run: () => handleClanActivityIngest(env, "schedule", {
            force,
            bypassRecentGuard: options.bypassActivityRecentGuard === true,
            ...jobRunOptions
          })
        });
      }
    }

  }

  if (offlinePingEnabled(env) && (force || shouldRunOfflinePingSchedule(env, scheduledAt))) {
    jobs.push({
      label: "offline-pings",
      run: () => handleOfflinePingCheck(env, "schedule", {
        force,
        // A registered offline clan/member watch is a user choice, not a
        // side effect of the current event type.  Let its own source setting
        // decide whether clan and/or League rows are used.
        skipClanWatches: false,
        ...jobRunOptions
      })
    });
  }

  if (String(env.INGEST_PS99_VERSION_HISTORY || "false").toLowerCase() === "true") {
    if (force || shouldRunPs99VersionSchedule(env, scheduledAt)) {
      jobs.push({
        label: "ps99-versions",
        run: () => handlePs99VersionIngest(env, "schedule", { force })
      });
    }
  }

  if (String(env.INGEST_ROBLOX_RELEASE_VERSION_HISTORY || "false").toLowerCase() === "true") {
    if (force || shouldRunRobloxReleaseSchedule(env, scheduledAt)) {
      jobs.push({
        label: "roblox-release-version",
        run: () => handleRobloxReleasedVersionIngest(env, "schedule", { force })
      });
    }
  }

  if (String(env.INGEST_ROBLOX_FFLAGS || "false").toLowerCase() === "true" && (force || shouldRunRobloxFflagSchedule(env, scheduledAt))) {
    jobs.push({ label: "roblox-fflags", run: () => handleRobloxFflagIngest(env, "schedule", { force }) });
  }

  if (String(env.INGEST_PS99_DEV_BLOGS || "false").toLowerCase() === "true" && (force || shouldRunPs99DevBlogSchedule(env, scheduledAt))) {
    jobs.push({ label: "ps99-dev-blogs", run: () => handlePs99DevBlogIngest(env, "schedule", { force }) });
  }

  if (persistentDiscordPostsEnabled(env) && (force || shouldRunRewardCutoffSchedule(env, scheduledAt))) {
    jobs.push({
      label: "persistent-discord-posts",
      run: async () => json(await postPersistentDiscordMessages(env, { force }), 200, { "Cache-Control": "no-store" })
    });
  }

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
        offline_alerts_posted: payload?.alerts_posted ?? null,
        offline_candidates: payload?.offline_candidates ?? null,
        offline_guilds_checked: payload?.guilds_checked ?? null,
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

function normalizeIngestRunOptions(options = {}) {
  const scheduledAt = options?.scheduledAt instanceof Date && !Number.isNaN(options.scheduledAt.getTime())
    ? options.scheduledAt
    : null;
  const fetchedAtDate = options?.fetchedAt instanceof Date && !Number.isNaN(options.fetchedAt.getTime())
    ? options.fetchedAt
    : scheduledAt || new Date();
  const now = options?.now instanceof Date && !Number.isNaN(options.now.getTime())
    ? options.now
    : new Date();

  return {
    ...options,
    scheduledAt,
    fetchedAt: fetchedAtDate.toISOString(),
    now
  };
}

function scheduledBattleDataSkippedResult(gate, fetchedAt) {
  return {
    label: "battle-data",
    ok: true,
    status: 202,
    skipped: true,
    reason: gate.reason,
    battle_key: gate.battle_key || null,
    rows_inserted: 0,
    status_text: null,
    shard_count: null,
    shard_concurrency: null,
    clans_per_shard_run: null,
    clan_scan_limit: null,
    scanned_count: null,
    scanned_clan_count: null,
    processed_clans: null,
    next_clan_offset: null,
    candidate_player_count: null,
    total_global_players: null,
    clans_fetched: null,
    clan_activity_concurrency: null,
    roster_rows_inserted: null,
    events_inserted: null,
    summary_rows_inserted: null,
    ps99_places_checked: null,
    ps99_events_inserted: null,
    ps99_newest_version: null,
    webhook_alert: null,
    scan_error_count: null,
    message: gate.message || "Battle data scheduled pulls skipped without queuing member, clans, global-rank, or activity jobs.",
    fetched_at: fetchedAt,
    battle_cutoff_at: gate.battle_cutoff_at || null,
    hard_stop_at: gate.hard_stop_at || null
  };
}

async function responseJson(response) {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function fetchHourlyAssignmentClanNames(env, configuredClans = []) {
  const configured = new Set((configuredClans || []).map(clan => normalizeText(clan)).filter(Boolean));
  const rows = await supabaseSelect(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, {
    select: "clan_name,enabled,updated_at",
    enabled: "eq.true",
    order: "updated_at.desc",
    limit: String(hourlyAssignmentClanScanLimit(env))
  });
  const seen = new Set(configured);
  const clans = [];

  for (const row of rows) {
    const raw = String(row?.clan_name || "").trim();
    if (!raw || raw.toLowerCase().startsWith("user:") || raw.toLowerCase().startsWith("league:")) continue;

    const key = normalizeText(raw);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    clans.push(raw);
  }

  return clans;
}

async function fetchTrackerAssignmentClanNames(env, configuredClans = []) {
  const clans = [...(configuredClans || [])];
  const seen = new Set(clans.map(clan => normalizeText(clan)).filter(Boolean));

  try {
    const rows = await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
      select: "clan_name,enabled,updated_at",
      enabled: "eq.true",
      order: "updated_at.asc",
      limit: "1000"
    });

    for (const row of rows) {
      const raw = String(row?.clan_name || "").trim();
      const lower = raw.toLowerCase();
      if (!raw || lower.startsWith("user:") || lower.startsWith("league:")) continue;

      const key = normalizeText(raw);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      clans.push(raw);
    }
  } catch (error) {
    // A temporary Discord-tracker table failure must not stop the static
    // CLAN_NAMES collector from running.
    console.warn("scheduled clan tracker assignment lookup failed", error?.message || String(error));
  }

  return clans;
}

async function handleDiscordHourlyClanAssignments(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const params = {
      select: DISCORD_HOURLY_CLAN_ASSIGNMENT_COLUMNS,
      order: "created_at.asc",
      limit: String(clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000))
    };
    const guildId = String(url.searchParams.get("guild_id") || "").trim();
    const channelId = String(url.searchParams.get("channel_id") || "").trim();
    const assignmentKey = String(url.searchParams.get("assignment_key") || "").trim();
    const enabled = String(url.searchParams.get("enabled") || "").trim().toLowerCase();
    if (guildId) params.guild_id = `eq.${guildId}`;
    if (channelId) params.channel_id = `eq.${channelId}`;
    if (assignmentKey) params.assignment_key = `eq.${assignmentKey}`;
    if (["1", "true", "yes"].includes(enabled)) params.enabled = "eq.true";
    if (["0", "false", "no"].includes(enabled)) params.enabled = "eq.false";

    return noStoreJson({
      ok: true,
      assignments: await supabaseSelect(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, params)
    });
  }

  const body = await request.json().catch(() => ({}));
  const channelId = String(body.channel_id || "").trim();
  if (!/^\d{5,30}$/.test(channelId)) {
    throw httpError(400, "A valid Discord channel or thread ID is required.");
  }

  if (request.method === "DELETE") {
    const assignmentKey = String(body.assignment_key || "").trim();
    const filters = assignmentKey
      ? { assignment_key: `eq.${assignmentKey}` }
      : { channel_id: `eq.${channelId}` };
    const assignments = await supabaseSelect(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, {
      select: DISCORD_HOURLY_CLAN_ASSIGNMENT_COLUMNS,
      ...filters,
      order: "created_at.asc",
      limit: "100"
    });

    await supabaseDelete(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, filters);

    return noStoreJson({
      ok: true,
      channel_id: channelId,
      assignment_key: assignmentKey || null,
      removed: assignments.length > 0,
      removed_count: assignments.length,
      assignment: assignments[0] || null,
      assignments
    });
  }

  if (request.method === "POST") {
    const guildId = String(body.guild_id || "").trim();
    const clanNameValue = String(body.clan_name || "").trim();
    if (!/^\d{5,30}$/.test(guildId)) {
      throw httpError(400, "A valid Discord guild ID is required.");
    }
    if (!clanNameValue || clanNameValue.length > 100) {
      throw httpError(400, "A clan name between 1 and 100 characters is required.");
    }

    const now = new Date().toISOString();
    const assignmentKey = discordHourlyAssignmentKey(channelId, clanNameValue);
    if (!assignmentKey) {
      throw httpError(400, "A valid hourly assignment target is required.");
    }

    await supabaseUpsert(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, [{
      assignment_key: assignmentKey,
      channel_id: channelId,
      guild_id: guildId,
      channel_type: toNumber(body.channel_type),
      clan_name: clanNameValue,
      assigned_by: stringOrNull(body.assigned_by),
      enabled: body.enabled !== false,
      updated_at: now
    }], "assignment_key");

    const assignments = await supabaseSelect(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, {
      select: DISCORD_HOURLY_CLAN_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${assignmentKey}`,
      limit: "1"
    });

    return noStoreJson({
      ok: true,
      assignment: assignments[0] || null
    });
  }

  const patch = {
    updated_at: new Date().toISOString()
  };
  const assignmentKey = String(body.assignment_key || "").trim();
  const filters = assignmentKey
    ? { assignment_key: `eq.${assignmentKey}` }
    : { channel_id: `eq.${channelId}` };
  const selectFilters = assignmentKey
    ? { assignment_key: `eq.${assignmentKey}` }
    : { channel_id: `eq.${channelId}` };
  const claimDueBefore = String(body.claim_due_before || "").trim();
  const claimToken = String(body.claim_token || "").trim();
  if (claimDueBefore) {
    if (!assignmentKey) {
      throw httpError(400, "An assignment_key is required to claim an hourly assignment.");
    }
    const claimDueBeforeMs = Date.parse(claimDueBefore);
    if (!Number.isFinite(claimDueBeforeMs)) {
      throw httpError(400, "claim_due_before must be a valid ISO timestamp.");
    }
    filters.or = `(last_posted_at.is.null,last_posted_at.lt.${new Date(claimDueBeforeMs).toISOString()})`;
  }
  if (claimToken && claimToken.length > 200) {
    throw httpError(400, "claim_token is too long.");
  }
  for (const key of [
    "enabled",
    "alert_user_id",
    "alert_set_by",
    "alert_updated_at",
    "last_posted_at",
    "last_message_id",
    "last_snapshot_at",
    "last_error"
  ]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = body[key] === "" ? null : body[key];
    }
  }

  if (patch.alert_user_id && !/^\d{5,30}$/.test(String(patch.alert_user_id))) {
    throw httpError(400, "A valid Discord alert user ID is required.");
  }
  if (patch.alert_set_by && !/^\d{5,30}$/.test(String(patch.alert_set_by))) {
    throw httpError(400, "A valid Discord alert setter ID is required.");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "alert_user_id") && patch.alert_user_id) {
    patch.alert_updated_at = patch.alert_updated_at || patch.updated_at;
  }

  await supabasePatch(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, filters, patch);

  const assignments = await supabaseSelect(env, DISCORD_HOURLY_CLAN_ASSIGNMENTS_TABLE, {
    select: DISCORD_HOURLY_CLAN_ASSIGNMENT_COLUMNS,
    ...selectFilters,
    order: "created_at.asc",
    limit: assignmentKey ? "1" : "100"
  });
  const claimMarker = claimToken ? `posting:${claimToken}` : "";
  const claimAcquired = claimMarker
    ? assignments.some(assignment => String(assignment.last_error || "") === claimMarker)
    : null;

  return noStoreJson({
    ok: true,
    channel_id: channelId,
    assignment_key: assignmentKey || null,
    updated: claimMarker ? claimAcquired : assignments.length > 0,
    updated_count: assignments.length,
    ...(claimMarker ? { claim_acquired: claimAcquired } : {}),
    assignment: assignments[0] || null,
    assignments
  });
}

async function handleIngest(env, source, requestedClan, force = false, options = {}) {
  requireSupabase(env);

  const runOptions = normalizeIngestRunOptions(options);
  const fetchedAt = runOptions.fetchedAt;
  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = runOptions.activeBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeGate = battleIngestGate({
    activeBattleMeta,
    battleMeta: activeBattleMeta,
    battleKey: activeBattleMeta?.battleKey || configuredBattleKey,
    env,
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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

  let recentGuardBattleKey = activeBattleMeta?.battleKey || null;
  if (recentGuardBattleKey) {
    const recentGate = await memberSnapshotRecentGate(env, clan, recentGuardBattleKey, fetchedAt, force);
    if (!recentGate.allowed) {
      return skippedIngestResponse({
        scope: "members",
        source,
        clan,
        fetchedAt,
        configuredBattleKey,
        resolvedBattleKey: recentGuardBattleKey,
        battleMeta: activeBattleMeta,
        gate: recentGate
      });
    }
  }

  const api = await fetchClanApi(clan);
  const battles = api.data?.Battles || {};
  const resolvedBattleKey = resolveAuthoritativeBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
  const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;

  if (!battle) {
    const available = Object.keys(battles);
    throw httpError(
      409,
      `The active battle ${activeBattleMeta?.battleKey || configuredBattleKey} is not available in ${clan}'s Battles data yet. Available battles: ${available.join(", ") || "none"}`
    );
  }

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
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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

  if (normalizeText(recentGuardBattleKey) !== normalizeText(resolvedBattleKey)) {
    const recentGate = await memberSnapshotRecentGate(env, clan, resolvedBattleKey, fetchedAt, force);
    if (!recentGate.allowed) {
      return skippedIngestResponse({
        scope: "members",
        source,
        clan,
        fetchedAt,
        configuredBattleKey,
        resolvedBattleKey,
        battleMeta,
        gate: recentGate
      });
    }
    recentGuardBattleKey = resolvedBattleKey;
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

  const snapshotId = `${clan}:${resolvedBattleKey}:${fetchedAt}`;
  const storedSource = battleCollectionSource(source, ingestGate);
  const publishCurrent = isSnapshotAtOrBeforeEventEnd(fetchedAt, battleMeta.endedAt);
  const rows = ranked.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source: storedSource,
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
    if (publishCurrent) {
      const previousGainState = await fetchCurrentMemberGainState(env, clan);
      const currentRows = rows.map(row => ({
        ...row,
        ...nextMemberGainState(row, previousGainState.get(String(row.user_id)), fetchedAt),
        updated_at: fetchedAt
      }));

      await replaceCurrentRows(env, CURRENT_TABLE, {
        clan_name: `eq.${clan}`
      }, currentRows);
    }
  }

  const existingBattleRun = publishCurrent
    ? null
    : await fetchBattleRun(env, clan, resolvedBattleKey).catch(() => null);
  await upsertBattleRun(env, {
    clan_name: clan,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    last_seen_at: fetchedAt,
    latest_snapshot_id: publishCurrent ? snapshotId : existingBattleRun?.latest_snapshot_id || null,
    latest_snapshot_at: publishCurrent ? fetchedAt : existingBattleRun?.latest_snapshot_at || null,
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
    source: storedSource,
    collection_phase: ingestGate.collection_phase || "active_event",
    in_grace_period: ingestGate.in_grace_period === true,
    published_current: publishCurrent,
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
  const downtimeParam = String(url.searchParams.get("downtime") || "").toLowerCase();
  const includeDowntime = ["1", "true", "yes", "y"].includes(downtimeParam);
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
    if (latest && !isSnapshotAtOrBeforeEventEnd(latest.fetched_at, latest.battle_ended_at)) {
      const canonicalLatest = await fetchLatestSnapshotMeta(env, clan, latest.battle_key);
      if (canonicalLatest) {
        latest = canonicalLatest;
        rows = await fetchSnapshotRows(env, canonicalLatest.snapshot_id);
      }
    }
  }

  if (!latest) {
    return noStoreJson({
      generated_at: new Date().toISOString(),
      snapshot_at: null,
      clan_name: clan,
      battle: explicitBattle ? requestedBattle : null,
      rows: []
    });
  }

  const rowsWithGains = await addGainFields(env, rows, latest);
  let downtimeError = null;
  let rowsWithDowntime = rowsWithGains.map(row => ({
    ...row,
    last_gain_at: null,
    downtime_minutes: null
  }));
  if (includeDowntime) {
    try {
      rowsWithDowntime = await addDowntimeFields(env, rowsWithGains, latest);
    } catch (err) {
      downtimeError = String(err?.message || err || "Unknown downtime enrichment error").slice(0, 500);
    }
  }
  const activeBattleMeta = !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  const currentBattleMismatch = Boolean(
    !explicitBattle &&
    latest?.battle_key &&
    activeBattleMeta?.battleKey &&
    normalizeText(latest.battle_key) !== normalizeText(activeBattleMeta.battleKey)
  );

  if (currentBattleMismatch) {
    return noStoreJson({
      generated_at: new Date().toISOString(),
      snapshot_at: null,
      clan_name: clan,
      battle: activeBattleMeta.battleKey,
      display_name: cleanBattleDisplayName(
        activeBattleMeta.battleKey,
        activeBattleMeta.displayName
      ),
      battle_start_iso: activeBattleMeta.startedAt || null,
      battle_end_iso: activeBattleMeta.endedAt || null,
      clan_rank: null,
      clan_points: null,
      source: "c0ld-clan-api-worker",
      downtime_included: includeDowntime,
      avatars_included: includeAvatars,
      waiting_for_first_snapshot: true,
      stale_battle_key: latest.battle_key,
      rows: []
    });
  }

  latest = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: false });
  const usernameMap = await resolveMissingUsernames(rowsWithDowntime, env);
  const avatarMap = includeAvatars
    ? await resolveRobloxAvatarHeadshots(
      rowsWithDowntime.map(row => row.user_id),
      env
    ).catch(() => new Map())
    : new Map();
  const trackedClan = await fetchTrackedClanCurrent(env, clan).catch(() => null);

  return noStoreJson({
    generated_at: new Date().toISOString(),
    snapshot_at: latest.fetched_at,
    clan_name: latest.clan_name,
    battle: latest.battle_key,
    display_name: cleanBattleDisplayName(latest.battle_key, latest.battle_display_name),
    battle_start_iso: latest.battle_started_at,
    battle_end_iso: latest.battle_ended_at,
    clan_rank: trackedClan?.rank ?? null,
    clan_points: trackedClan?.points ?? null,
    icon_id: trackedClan?.icon_id || null,
    icon_url: trackedClan?.icon_url || null,
    source: "c0ld-clan-api-worker",
    downtime_included: includeDowntime,
    downtime_error: downtimeError,
    avatars_included: includeAvatars,
    rows: rowsWithDowntime.map(row => ({
      fetched_at: row.fetched_at,
      rank: toNumber(row.rank),
      username: displayUsername(row, usernameMap),
      user_id: toNumber(row.user_id),
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      join_time: memberJoinIso(row),
      permission_level: memberPermissionLevel(row.raw_member || {}),
      role: memberRole(row.raw_member || {}, memberPermissionLevel(row.raw_member || {})),
      total_points: toNumber(row.total_points) || 0,
      last_gain_at: row.last_gain_at || null,
      downtime_minutes: row.downtime_minutes,
      gain_5m: row.gain_5m,
      gain_1h: row.gain_1h,
      gain_12h: row.gain_12h,
      gain_24h: row.gain_24h
    }))
  });
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
  const candidateGroups = result.award_candidates && typeof result.award_candidates === "object"
    ? result.award_candidates
    : {};
  const candidateAwards = Object.values(candidateGroups)
    .flatMap(rows => Array.isArray(rows) ? rows : []);
  const userIds = [...Object.values(awards), ...candidateAwards]
    .map(award => toNumber(award?.user_id))
    .filter(Boolean);
  const avatarMap = await resolveRobloxAvatarHeadshots(userIds, env).catch(() => new Map());
  const enrichAward = award => award && typeof award === "object"
    ? {
        ...award,
        avatar_url: avatarMap.get(String(award.user_id)) || award.avatar_url || null
      }
    : null;
  const enrichedAwards = Object.fromEntries(Object.entries(awards).map(([key, award]) => [key, enrichAward(award)]));
  const enrichedCandidateGroups = Object.fromEntries(Object.entries(candidateGroups).map(([key, rows]) => [
    key,
    Array.isArray(rows) ? rows.map(enrichAward).filter(Boolean) : []
  ]));

  return cacheJson({
    ...result,
    generated_at: new Date().toISOString(),
    source: "postgres_award_summary",
    awards: enrichedAwards,
    award_candidates: enrichedCandidateGroups
  }, env, 60);
}

async function handleGlobalCurrent(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000);

  let rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,raw_global,updated_at",
    clan_name: `eq.${clan}`,
    order: "clan_rank.asc",
    limit: String(limit)
  });

  const runClan = normalizeText(clan) === normalizeText(clanName(env))
    ? clan
    : clanName(env);
  const run = await findLatestGlobalRankSearchRun(env, runClan);
  if (!rows.length && run?.run_key && normalizeText(clan) !== normalizeText(runClan)) {
    const memberRows = await fetchCurrentRows(env, clan).catch(() => []);
    if (memberRows.length) {
      const rankedCandidates = await readGlobalRankRankedCandidates(env, run.run_key);
      const candidateById = new Map(rankedCandidates.map(row => [String(row.user_id), row]));
      rows = buildGlobalRankCurrentRows({
        members: memberRows,
        candidateById,
        clan,
        latest: latestMetaFromRows(memberRows),
        eventName: run.event_name || run.battle_display_name || null,
        fetchedAt: run.finished_at || run.updated_at || new Date().toISOString(),
        candidatePlayerCount:
          toNumber(run.total_global_players) ||
          toNumber(run.candidate_player_count) ||
          rankedCandidates.length,
        runKey: run.run_key
      });
    }
  }
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
  const url = new URL(request.url);
  const sourceMode = await globalLeaderboardSourceMode(url, env);
  if (sourceMode === "leagues") {
    return handleLeagueGlobalLeaderboard(url, env);
  }

  requireSupabase(env);

  const clan = url.searchParams.get("clan") || clanName(env);
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 1000);
  const includeAvatars = ["1", "true", "yes"].includes(String(url.searchParams.get("avatars") || "").toLowerCase());
  const includeGains = !["0", "false", "no"].includes(String(url.searchParams.get("gains") || "true").toLowerCase());
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeBattleKey = String(activeBattleMeta?.battleKey || "").trim();
  const run = await findLatestGlobalRankSearchRun(env, clan, activeBattleKey || null);

  if (!run?.run_key) {
    return cacheJson({
      ok: true,
      source_mode: "clans",
      source_label: "Clan Battle",
      generated_at: new Date().toISOString(),
      clan_name: clan,
      snapshot_at: null,
      waiting_for_first_scan: Boolean(activeBattleKey),
      run: activeBattleKey ? {
        run_key: null,
        event_name: cleanBattleDisplayName(activeBattleKey, activeBattleMeta?.displayName),
        battle_display_name: cleanBattleDisplayName(activeBattleKey, activeBattleMeta?.displayName),
        battle_key: activeBattleKey,
        source_mode: "clans",
        started_at: activeBattleMeta?.startedAt || null,
        finished_at: null,
        status: "waiting"
      } : null,
      total_global_players: 0,
      gains_included: includeGains,
      avatars_included: includeAvatars,
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
    source_mode: "clans",
    source_label: "Clan Battle",
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

async function globalLeaderboardSourceMode(url, env) {
  const requested = String(
    url.searchParams.get("source") ||
    env.GLOBAL_LEADERBOARD_SOURCE ||
    "auto"
  ).trim().toLowerCase();
  if (["league", "leagues"].includes(requested)) return "leagues";
  if (["clan", "clans", "battle", "clan-battle"].includes(requested)) return "clans";

  const activeBattle = await fetchActiveClanBattleMeta(env).catch(() => null);
  if (!activeBattle) return "leagues";

  const now = Date.now();
  const startsAt = new Date(activeBattle.startedAt || 0).getTime();
  const endsAt = new Date(activeBattle.endedAt || 0).getTime();
  const hasStarted = !Number.isFinite(startsAt) || startsAt <= 0 || startsAt <= now;
  const hasNotEnded = !Number.isFinite(endsAt) || endsAt <= 0 || endsAt > now;
  return hasStarted && hasNotEnded ? "clans" : "leagues";
}

async function handleLeagueGlobalLeaderboard(url, env) {
  const limit = clamp(Number(url.searchParams.get("limit") || 500), 1, 500);
  const includeAvatars = ["1", "true", "yes"].includes(String(url.searchParams.get("avatars") || "").toLowerCase());
  const payload = await fetchLeagueSoloLeaderboard(env, limit);
  const sourceRows = Array.isArray(payload.rows) ? payload.rows.slice(0, limit) : [];
  const avatarMap = includeAvatars
    ? await resolveRobloxAvatarHeadshots(sourceRows.map(row => row.user_id), env).catch(() => new Map())
    : new Map();
  const snapshotAt = safeIso(
    payload.snapshot_at ||
    sourceRows[0]?.fetched_at ||
    payload.generated_at
  ) || new Date().toISOString();
  const leagueLabel = String(
    payload.league_run_label ||
    payload.league_run_key ||
    "Current League"
  ).trim();
  const topAvailable = Math.max(toNumber(payload.top_available) || 0, sourceRows.length);
  const rows = sourceRows.map((row, index) => ({
    source_mode: "leagues",
    global_rank: toNumber(row.rank) || index + 1,
    projected_rank: null,
    projected_rank_1h: null,
    projected_points_1h: null,
    projection_basis: null,
    clan: String(row.league_name || "").trim() || "Unlisted",
    source_clan: String(row.league_name || "").trim() || "Unlisted",
    user_id: toNumber(row.user_id),
    username: String(row.username || row.display_name || `user_${row.user_id}`).trim(),
    display_name: String(row.display_name || row.username || `user_${row.user_id}`).trim(),
    avatar_url: avatarMap.get(String(row.user_id)) || null,
    points: toNumber(row.points ?? row.total_points) || 0,
    gain_5m: null,
    gain_1h: null,
    gain_12h: null,
    gain_24h: null,
    total_global_players: topAvailable,
    fetched_at: safeIso(row.fetched_at) || snapshotAt
  }));
  const run = {
    run_key: `league:${payload.league_run_key || "current"}:${snapshotAt}`,
    event_name: leagueLabel,
    battle_display_name: leagueLabel,
    battle_key: payload.league_run_key || null,
    source_mode: "leagues",
    started_at: null,
    finished_at: snapshotAt
  };

  return cacheJson({
    ok: true,
    source_mode: "leagues",
    source_label: "Leagues",
    source: payload.source || "big-games-public-league-players",
    generated_at: new Date().toISOString(),
    snapshot_at: snapshotAt,
    run,
    total_global_players: topAvailable,
    pool_is_partial: true,
    pool_description: "The BIG Games public League player endpoint currently exposes the live Top 500.",
    gains_included: false,
    avatars_included: includeAvatars,
    rows
  }, env, publicCacheSeconds(env, "GLOBAL_LEADERBOARD_FAST"));
}

async function fetchLeagueSoloLeaderboard(env, limit = 500, query = "") {
  const externalBase = String(env.LEAGUE_API_BASE || DEFAULT_LEAGUE_API_BASE).replace(/\/$/, "");
  const searchQuery = String(query || "").trim();
  const searchSuffix = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
  const attempts = [];
  if (env.LEAGUE_API_WORKER && typeof env.LEAGUE_API_WORKER.fetch === "function") {
    attempts.push({
      name: "service binding",
      url: `https://league-api-worker.service/api/leagues/solo-leaderboard?limit=${limit}${searchSuffix}`,
      fetcher: request => env.LEAGUE_API_WORKER.fetch(request)
    });
  }
  attempts.push({
    name: "public endpoint",
    url: `${externalBase}/api/leagues/solo-leaderboard?limit=${limit}${searchSuffix}`,
    fetcher: request => fetch(request)
  });

  let lastFailure = null;
  for (const attempt of attempts) {
    try {
      const response = await attempt.fetcher(new Request(attempt.url, {
        headers: { Accept: "application/json" }
      }));
      const text = await response.text();
      const parsed = parseJsonObject(text) || {};
      if (response.ok && parsed.ok !== false && Array.isArray(parsed.rows)) return parsed;
      lastFailure = `${attempt.name} returned ${response.status}: ${parsed.message || text.slice(0, 300)}`;
    } catch (error) {
      lastFailure = `${attempt.name} failed: ${error?.message || String(error)}`;
    }
  }
  throw httpError(502, `League player leaderboard API failed: ${lastFailure || "no endpoint was available"}`);
}

function normalizeLeagueMilestoneRanks(ranks) {
  return [...new Set(
    (Array.isArray(ranks) ? ranks : [])
      .map(rank => toNumber(rank))
      .filter(rank => Number.isFinite(rank) && rank >= 1)
      .map(rank => Math.round(rank))
  )].sort((a, b) => a - b);
}

function parseLeagueMilestoneListScope(value) {
  const requested = String(value || "").trim().toLowerCase();
  if (!requested) return null;
  if (["all", "10k", "10000", "top10000", "global_top_10000_leagues"].includes(requested)) return "all";
  if (["top", "1k", "1000", "top1000", "global_top_1000_leagues"].includes(requested)) return "top";
  return null;
}

function leagueMilestoneTopListLimit(env) {
  const configured = Number(
    env.LEAGUE_TOP_MILESTONE_LIST_LIMIT ||
    env.TOP_LEAGUES_LIMIT ||
    env.TOP_LEAGUES_SCHEDULE_LIMIT ||
    env.SCHEDULED_TOP_LEAGUES_LIMIT ||
    LEAGUE_MILESTONE_LIST_TOP_LIMIT_DEFAULT
  );
  return clamp(Number.isFinite(configured) ? configured : LEAGUE_MILESTONE_LIST_TOP_LIMIT_DEFAULT, 1, 100000);
}

async function fetchLeagueMilestonesForRanks(env, ranks, listScope = null) {
  const requested = normalizeLeagueMilestoneRanks(ranks);
  const list = parseLeagueMilestoneListScope(listScope);
  const rankList = requested.join(",");
  const externalBase = String(env.LEAGUE_API_BASE || DEFAULT_LEAGUE_API_BASE).replace(/\/$/, "");
  const hasBinding = env.LEAGUE_API_WORKER && typeof env.LEAGUE_API_WORKER.fetch === "function";
  const attempts = [];

  if (hasBinding) {
    attempts.push({
      name: "service binding",
      base: "https://league-api-worker.service",
      fetcher: request => env.LEAGUE_API_WORKER.fetch(request)
    });
  }
  attempts.push({ name: "public endpoint", base: externalBase, fetcher: request => fetch(request) });

  let payload = null;
  let lastFailure = null;
  for (const attempt of attempts) {
    const url = new URL(`${attempt.base}/api/leagues/milestones`);
    if (rankList) url.searchParams.set("ranks", rankList);
    if (list) url.searchParams.set("list", list);
    try {
      const response = await attempt.fetcher(new Request(url.toString()));
      const text = await response.text();
      const parsed = parseJsonObject(text) || {};
      if (response.ok && parsed.ok !== false) {
        payload = parsed;
        break;
      }
      lastFailure = `${attempt.name} returned ${response.status}: ${parsed.message || text.slice(0, 300)}`;
    } catch (error) {
      lastFailure = `${attempt.name} failed: ${error?.message || String(error)}`;
    }
  }

  if (!payload) {
    throw httpError(502, `League milestones API failed: ${lastFailure || "no endpoint was available"}`);
  }

  return {
    payload,
    ranks: requested
  };
}

async function fetchLeagueMilestonesCombined(env, ranks) {
  const requested = normalizeLeagueMilestoneRanks(ranks);
  const splitLimit = leagueMilestoneTopListLimit(env);
  const topRanks = requested.filter(rank => rank <= splitLimit);
  const allRanks = requested.filter(rank => rank > splitLimit);

  const [topResult, allResult] = await Promise.all([
    topRanks.length ? fetchLeagueMilestonesForRanks(env, topRanks, "top") : Promise.resolve(null),
    allRanks.length ? fetchLeagueMilestonesForRanks(env, allRanks, "all") : Promise.resolve(null)
  ]);

  const byRank = new Map();
  const ingestRows = (result) => {
    if (!result?.payload?.rows) return;
    for (const row of result.payload.rows) {
      const rank = toNumber(row.rank);
      if (!rank) continue;
      const existing = byRank.get(rank);
      if (!existing || new Date(row.fetched_at || 0) > new Date(existing.fetched_at || 0)) {
        byRank.set(rank, row);
      }
    }
  };

  ingestRows(topResult);
  ingestRows(allResult);

  const candidatePayloads = [topResult?.payload, allResult?.payload].filter(Boolean);
  const source = candidatePayloads
    .map(item => ({
      payload: item,
      ts: Date.parse(item.snapshot_at || item.generated_at || 0)
    }))
    .sort((a, b) => b.ts - a.ts)[0];
  const latestPayload = source?.payload || {};
  const snapshotAt = source?.ts ? new Date(source.ts).toISOString() : null;

  const rows = requested
    .map(rank => byRank.get(rank))
    .filter(Boolean);

  return {
    payload: {
      ok: true,
      generated_at: latestPayload.generated_at || new Date().toISOString(),
      snapshot_at: snapshotAt,
      league_run_key: latestPayload.league_run_key || null,
      league_run_label: latestPayload.league_run_label || latestPayload.league_run_key || null,
      league_end_at: latestPayload.league_end_at || latestPayload.league_run_end_at || null,
      total_players: latestPayload.total_players || null,
      top_available: latestPayload.top_available || null,
      rows
    },
    ranks: requested
  };
}

async function fetchLeagueMilestones(env, ranks, options = {}) {
  const requested = normalizeLeagueMilestoneRanks(ranks);
  const listScope = parseLeagueMilestoneListScope(options?.list || options?.scope);
  return listScope ? fetchLeagueMilestonesForRanks(env, requested, listScope) : fetchLeagueMilestonesCombined(env, requested);
}

async function fetchLeaguePlayerMilestones(env, ranks) {
  const requested = normalizeLeagueMilestoneRanks(ranks);
  const rankList = requested.join(",");
  const externalBase = String(env.LEAGUE_API_BASE || DEFAULT_LEAGUE_API_BASE).replace(/\/$/, "");
  const attempts = [];

  if (env.LEAGUE_API_WORKER && typeof env.LEAGUE_API_WORKER.fetch === "function") {
    attempts.push({
      name: "service binding",
      base: "https://league-api-worker.service",
      fetcher: request => env.LEAGUE_API_WORKER.fetch(request)
    });
  }
  attempts.push({
    name: "public endpoint",
    base: externalBase,
    fetcher: request => fetch(request)
  });

  let lastFailure = null;
  for (const attempt of attempts) {
    const url = new URL(`${attempt.base}/api/leagues/player-milestones`);
    if (rankList) url.searchParams.set("ranks", rankList);
    try {
      const response = await attempt.fetcher(new Request(url.toString(), {
        headers: { Accept: "application/json" }
      }));
      const text = await response.text();
      const payload = parseJsonObject(text) || {};
      if (response.ok && payload.ok !== false && Array.isArray(payload.rows)) {
        return { payload, ranks: requested };
      }
      lastFailure = `${attempt.name} returned ${response.status}: ${payload.message || text.slice(0, 300)}`;
    } catch (error) {
      lastFailure = `${attempt.name} failed: ${error?.message || String(error)}`;
    }
  }

  throw httpError(502, `League player milestones API failed: ${lastFailure || "no endpoint was available"}`);
}

async function handleRewardCutoffs(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const rawType = String(url.searchParams.get("type") || "players").trim().toLowerCase();
  const type = rawType.startsWith("clan") ? "clans" : "players";

  if (type === "clans") {
    const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
    const rewardCategories = clanRewardCategoriesFromBattleMeta(activeBattleMeta);
    const ranks = rewardCategories.length
      ? clanRewardRanksFromCategories(rewardCategories)
      : rewardCutoffRanks(url, env, type);
    return cacheJson(await buildClanRewardCutoffs(url, env, ranks, {
      activeBattleMeta,
      battleKey: activeBattleMeta?.battleKey || null,
      rewardCategories
    }), env, publicCacheSeconds(env, "CLANS_CURRENT"));
  }

  const ranks = rewardCutoffRanks(url, env, type);
  return cacheJson(await buildPlayerRewardCutoffs(url, env, ranks), env, publicCacheSeconds(env, "GLOBAL_LEADERBOARD_FAST"));
}

async function buildPlayerRewardCutoffs(url, env, ranks, options = {}) {
  const clan = url.searchParams.get("clan") || clanName(env);
  const activeBattleKey = String(options.battleKey || "").trim();
  const run = await findLatestGlobalRankSearchRun(env, clan, activeBattleKey || null);

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
    pool_source: "clans",
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

async function buildClanRewardCutoffs(url, env, ranks, options = {}) {
  const requestedBattle = url.searchParams.get("battle") || "";
  const explicitBattle =
    requestedBattle &&
    !["current", "auto"].includes(String(requestedBattle).toLowerCase());
  const maxRank = Math.max(...ranks);
  const requestedEventMode = ["clans", "leagues"].includes(String(options.eventMode || "").trim().toLowerCase())
    ? String(options.eventMode).trim().toLowerCase()
    : null;
  const suppliedActiveBattleMeta = options.activeBattleMeta || null;
  const rewardCategories = Array.isArray(options.rewardCategories) && options.rewardCategories.length
    ? options.rewardCategories
    : clanRewardCategoriesFromBattleMeta(suppliedActiveBattleMeta);
  const expectedBattleKey = String(
    options.battleKey ||
    suppliedActiveBattleMeta?.battleKey ||
    ""
  ).trim();

  let latest = null;
  let rows = [];

  if (explicitBattle) {
    latest = await fetchLatestClanSnapshotMeta(env, requestedBattle);
    if (latest) rows = await fetchClanSnapshotRows(env, latest.snapshot_id, maxRank);
  } else if (requestedEventMode !== "leagues") {
    const currentQuery = {
      select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,clan_name,points,icon_id,icon_url",
      order: "rank.asc",
      limit: String(maxRank)
    };
    if (expectedBattleKey) currentQuery.battle_key = `eq.${expectedBattleKey}`;
    rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, currentQuery);
    latest = latestClanMetaFromRows(rows);
  }

  const activeBattleMeta = !explicitBattle
    ? (suppliedActiveBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null))
    : null;
  const activeMetaAsLatest = activeBattleMeta ? {
    snapshot_id: null,
    fetched_at: null,
    battle_key: activeBattleMeta.battleKey || expectedBattleKey || null,
    battle_display_name: activeBattleMeta.displayName || null,
    battle_started_at: activeBattleMeta.startedAt || null,
    battle_ended_at: activeBattleMeta.endedAt || null
  } : null;
  const latestWithActiveMeta = latest
    ? mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: false })
    : activeMetaAsLatest;
  const latestClanBattleRun = !explicitBattle && !requestedEventMode
    ? await fetchLatestBattleRun(env, CLANS_BATTLE_RUN_CLAN_NAME).catch(() => null)
    : null;
  const activeClanBattle = (() => {
    if (requestedEventMode) return requestedEventMode === "clans";

    const runActive = parseBooleanish(latestClanBattleRun?.is_active);
    if (runActive !== null) return runActive;

    const battleEndedAt = safeIso(latestWithActiveMeta?.battle_ended_at);
    if (battleEndedAt) {
      const endedMs = new Date(battleEndedAt).getTime();
      if (Number.isFinite(endedMs)) {
        return endedMs > Date.now();
      }
    }

    return null;
  })();
  const byRank = new Map(rows.map(row => [toNumber(row.rank), row]));
  const liveCutoffs = !explicitBattle && activeClanBattle
    ? await fetchLiveClanRewardCutoffRows(env, ranks).catch(() => new Map())
    : new Map();

  for (const [rankValue, row] of liveCutoffs.entries()) {
    // Active reward cutoffs must reflect the live leaderboard. Stored snapshot
    // rows remain a fallback only when the live API cannot return a rank.
    if (row) byRank.set(rankValue, row);
  }
  const liveSnapshotAt = [...liveCutoffs.values()]
    .map(row => safeIso(row?.fetched_at))
    .filter(Boolean)
    .sort()
    .pop() || null;
  const availableRankMax = Math.max(
    rows.reduce((max, row) => Math.max(max, toNumber(row.rank) || 0), 0),
    ...[...liveCutoffs.values()].map(row => toNumber(row?.rank) || 0)
  );

  return {
    ok: true,
    type: "clans",
    generated_at: new Date().toISOString(),
    snapshot_at: liveSnapshotAt || latestWithActiveMeta?.fetched_at || null,
    battle: latestWithActiveMeta?.battle_key || null,
    display_name: latestWithActiveMeta
      ? cleanBattleDisplayName(latestWithActiveMeta.battle_key, latestWithActiveMeta.battle_display_name)
      : null,
    battle_start_iso: latestWithActiveMeta?.battle_started_at || null,
    battle_end_iso: latestWithActiveMeta?.battle_ended_at || null,
    battle_is_active: activeClanBattle,
    total_ranked: rows.length,
    available_rank_max: availableRankMax,
    ranks,
    reward_categories: rewardCategories.length ? rewardCategories : DEFAULT_CLAN_REWARD_CATEGORIES,
    cutoffs: ranks.map(rankValue => clanRewardCutoffRow(rankValue, byRank.get(rankValue)))
  };
}

function clanRewardCategoriesFromBattleMeta(activeBattleMeta) {
  const raw = activeBattleMeta?.raw || {};
  const configData = raw.configData || raw.ConfigData || {};
  const placementRewards = firstDefined(
    getFirstValue(configData, [
      "PlacementRewards",
      "placementRewards",
      "placement_rewards"
    ]),
    getFirstValue(raw, [
      "PlacementRewards",
      "placementRewards",
      "placement_rewards"
    ])
  );
  if (!Array.isArray(placementRewards) || !placementRewards.length) return [];

  const grouped = new Map();
  for (const reward of placementRewards) {
    const best = toNumber(getFirstValue(reward, ["Best", "best"]));
    const worst = toNumber(getFirstValue(reward, ["Worst", "worst"]));
    if (!(best >= 1) || !(worst >= best)) continue;

    const key = `${best}:${worst}`;
    const existing = grouped.get(key) || {
      label: clanRewardPlacementLabel(best, worst),
      best,
      worst,
      rank: worst,
      rewards: []
    };
    const item = firstDefined(reward.Item, reward.item);
    if (item) existing.rewards.push(item);
    grouped.set(key, existing);
  }

  return [...grouped.values()].sort((a, b) => {
    const aTop = a.best === 1 && a.worst > 1;
    const bTop = b.best === 1 && b.worst > 1;
    if (aTop !== bTop) return aTop ? 1 : -1;
    if (a.best !== b.best) return a.best - b.best;
    return a.worst - b.worst;
  });
}

function clanRewardPlacementLabel(best, worst) {
  if (best === 1 && worst === 1) return "#1";
  if (best === 1) return `Top ${Number(worst).toLocaleString("en-US")}`;
  return `#${Number(best).toLocaleString("en-US")}-${Number(worst).toLocaleString("en-US")}`;
}

function clanRewardRanksFromCategories(categories) {
  return [...new Set((categories || [])
    .map(category => toNumber(category?.rank ?? category?.worst))
    .filter(rank => Number.isFinite(rank) && rank >= 1))]
    .sort((a, b) => a - b);
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
  const isLegacy = isClans
    ? normalizedRaw === LEGACY_CLAN_REWARD_CUTOFF_RANKS
    : normalizedRaw === LEGACY_PLAYER_REWARD_CUTOFF_RANKS;
  const ranks = parsed.length && !isLegacy
    ? parsed
    : fallback;

  return [...new Set(ranks)]
    .sort((a, b) => a - b)
    .slice(0, 20);
}

const PERSISTENT_DISCORD_TARGETS = {
  cutoffs: {
    feed: "reward_cutoffs",
    stateKey: "main",
    channelVariable: "REWARD_CUTOFFS_CHANNEL_ID"
  },
  roblox_status: {
    feed: "roblox_status",
    stateKey: "roblox_status",
    channelVariable: "ROBLOX_STATUS_CHANNEL_ID"
  },
  versions: {
    feed: "versions_status",
    stateKey: "versions",
    channelVariable: "VERSIONS_CHANNEL_ID"
  }
};

function persistentDiscordTargetTypes(type = null) {
  const aliases = {
    cutoff: "cutoffs",
    rewards: "cutoffs",
    "roblox-status": "roblox_status",
    roblox: "roblox_status",
    version: "versions"
  };
  const requested = String(type || "all").trim().toLowerCase();
  const normalized = aliases[requested] || requested;
  if (!normalized || normalized === "all") return Object.keys(PERSISTENT_DISCORD_TARGETS);
  if (!PERSISTENT_DISCORD_TARGETS[normalized]) {
    throw httpError(400, "Persistent post type must be cutoffs, roblox-status, versions, or all.");
  }
  return [normalized];
}

function persistentDiscordDeliveryConfig(env, type) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  if (!target) return { configured: false, valid: false, reason: "unknown_target" };
  const feedConfig = discordFeedConfig(env, target.feed);
  const rawChannelId = String(env[target.channelVariable] || "").trim();
  const channelId = /^\d{5,30}$/.test(rawChannelId) ? rawChannelId : "";
  const botToken = String(env.DISCORD_BOT_TOKEN || "").trim();

  if (rawChannelId) {
    return {
      configured: true,
      valid: Boolean(channelId && botToken),
      reason: !channelId ? "invalid_channel_id" : (!botToken ? "discord_bot_token_missing" : null),
      transport: "bot",
      channel_id: channelId,
      role_id: feedConfig.role_id,
      webhook_url: ""
    };
  }

  return {
    configured: feedConfig.configured,
    valid: Boolean(feedConfig.webhook_url),
    reason: feedConfig.configured && !feedConfig.webhook_url ? "invalid_webhook_url" : null,
    transport: feedConfig.configured ? "webhook" : null,
    channel_id: "",
    role_id: feedConfig.role_id,
    webhook_url: feedConfig.webhook_url
  };
}

async function postPersistentDiscordMessage(env, type, payload) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  const config = persistentDiscordDeliveryConfig(env, type);
  return config.transport === "bot"
    ? postDiscordBotChannelMessage(env, target.feed, config.channel_id, payload, config.role_id)
    : postDiscordFeedAlert(env, target.feed, payload);
}

async function updatePersistentDiscordMessage(env, type, messageId, payload) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  const config = persistentDiscordDeliveryConfig(env, type);
  return config.transport === "bot"
    ? updateDiscordBotChannelMessage(env, target.feed, config.channel_id, messageId, payload, config.role_id)
    : updateDiscordFeedMessage(env, target.feed, messageId, payload);
}

async function inspectPersistentDiscordMessage(env, type, messageId) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  const config = persistentDiscordDeliveryConfig(env, type);
  return config.transport === "bot"
    ? inspectDiscordBotChannelMessage(env, config.channel_id, messageId)
    : inspectDiscordFeedMessage(env, target.feed, messageId);
}

async function deletePersistentDiscordMessage(env, type, messageId) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  const config = persistentDiscordDeliveryConfig(env, type);
  return config.transport === "bot"
    ? deleteDiscordBotChannelMessage(env, config.channel_id, messageId)
    : deleteDiscordFeedMessage(env, target.feed, messageId);
}

async function postPersistentDiscordMessages(env, { force = false, type = null } = {}) {
  requireSupabase(env);
  const types = persistentDiscordTargetTypes(type);
  const entries = await Promise.all(types.map(async targetType => {
    try {
      return [targetType, await postPersistentDiscordTarget(env, targetType, { force })];
    } catch (error) {
      return [targetType, {
        ok: false,
        type: targetType,
        posted: false,
        reason: "persistent_post_failed",
        error: String(error?.message || error).slice(0, 1000)
      }];
    }
  }));
  return {
    ok: entries.every(([, result]) => result.ok),
    generated_at: new Date().toISOString(),
    types,
    results: Object.fromEntries(entries)
  };
}

async function buildPersistentDiscordTarget(env, type) {
  if (type === "cutoffs") {
    const dashboard = await buildRewardCutoffDashboard(env);
    return {
      payload: rewardCutoffDiscordPayload(dashboard),
      digestSource: dashboard,
      snapshotAt: latestRewardCutoffSnapshot(dashboard) || dashboard.generated_at
    };
  }
  if (type === "roblox_status") return buildRobloxStatusPersistentPost(env);
  if (type === "versions") return buildVersionsPersistentPost(env);
  throw httpError(400, `Unsupported persistent Discord target: ${type}`);
}

async function postPersistentDiscordTarget(env, type, { force = false } = {}) {
  const target = PERSISTENT_DISCORD_TARGETS[type];
  const config = persistentDiscordDeliveryConfig(env, type);
  if (!config.configured || !config.valid) {
    return {
      ok: false,
      type,
      configured: config.configured,
      posted: false,
      reason: config.reason || "channel_or_webhook_not_configured"
    };
  }

  const built = await buildPersistentDiscordTarget(env, type);
  const usesComponentsV2 = isDiscordComponentsV2Payload(built.payload);
  const digest = await sha256Hex(stableJsonStringify({
    discord_layout_version: usesComponentsV2 ? 2 : 1,
    data: built.digestSource
  }));
  const stateRows = await supabaseSelect(env, REWARD_CUTOFF_ALERT_STATE_TABLE, {
    select: "state_key,last_digest,last_message_id,last_posted_at,last_snapshot_at,updated_at",
    state_key: `eq.${target.stateKey}`,
    limit: "1"
  });
  const state = stateRows[0] || null;

  let storedMessageMissing = false;
  let existing = null;
  if (usesComponentsV2 && state?.last_message_id) {
    existing = await inspectPersistentDiscordMessage(env, type, state.last_message_id);
    if (existing.exists && !((toNumber(existing.flags) || 0) & DISCORD_COMPONENTS_V2_FLAG)) {
      const removed = await deletePersistentDiscordMessage(env, type, state.last_message_id);
      if (!removed.deleted) {
        return {
          ok: false,
          type,
          configured: true,
          posted: false,
          reason: removed.reason || "legacy_message_recreation_failed",
          error: removed.error || null,
          message_id: state.last_message_id
        };
      }
      storedMessageMissing = true;
    } else if (existing.reason === "message_not_found") {
      storedMessageMissing = true;
    }
  }
  if (!force && !storedMessageMissing && state?.last_digest === digest && state?.last_message_id) {
    existing = existing || await inspectPersistentDiscordMessage(env, type, state.last_message_id);
    if (existing.exists) {
      return {
        ok: true,
        type,
        configured: true,
        posted: false,
        updated: false,
        skipped: true,
        reason: "unchanged",
        message_id: state.last_message_id,
        message_exists: true,
        digest
      };
    }
    if (existing.reason !== "message_not_found") {
      return {
        ok: false,
        type,
        configured: true,
        posted: false,
        updated: false,
        skipped: true,
        reason: existing.reason || "message_verification_failed",
        message_id: state.last_message_id,
        message_exists: null,
        error: existing.error || null,
        digest
      };
    }
    storedMessageMissing = true;
  }

  let alert = null;
  if (state?.last_message_id && !storedMessageMissing) {
    alert = await updatePersistentDiscordMessage(env, type, state.last_message_id, built.payload);
  }
  if (!alert || alert.reason === "message_not_found") {
    alert = await postPersistentDiscordMessage(env, type, built.payload);
  }
  if (!alert.posted) return { ok: false, type, ...alert };

  const now = new Date().toISOString();
  const snapshotAt = safeIso(built.snapshotAt) || now;
  await supabaseUpsert(env, REWARD_CUTOFF_ALERT_STATE_TABLE, [{
    state_key: target.stateKey,
    last_digest: digest,
    last_message_id: alert.message_id || state?.last_message_id || null,
    last_posted_at: now,
    last_snapshot_at: snapshotAt,
    updated_at: now
  }], "state_key");

  return {
    ok: true,
    type,
    configured: true,
    posted: true,
    updated: Boolean(alert.updated),
    created: !alert.updated,
    message_id: alert.message_id || state?.last_message_id || null,
    snapshot_at: snapshotAt,
    digest
  };
}

async function persistentDiscordPostStatus(env) {
  requireSupabase(env);
  const entries = await Promise.all(Object.entries(PERSISTENT_DISCORD_TARGETS).map(async ([type, target]) => {
    const config = persistentDiscordDeliveryConfig(env, type);
    const stateRows = await supabaseSelect(env, REWARD_CUTOFF_ALERT_STATE_TABLE, {
      select: "state_key,last_digest,last_message_id,last_posted_at,last_snapshot_at,updated_at",
      state_key: `eq.${target.stateKey}`,
      limit: "1"
    });
    const state = stateRows[0] || null;
    const message = state?.last_message_id && config.valid
      ? await inspectPersistentDiscordMessage(env, type, state.last_message_id)
      : null;
    return [type, {
      configured: config.configured,
      valid: config.valid,
      transport: config.transport,
      channel_id: config.channel_id || null,
      webhook_valid: Boolean(config.webhook_url),
      role_id_configured: Boolean(config.role_id),
      state,
      message
    }];
  }));

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    configured: entries.every(([, target]) => target.configured && target.valid),
    schedule_minutes: rewardCutoffScheduleMinutes(env),
    schedule_offset_minutes: rewardCutoffScheduleOffsetMinutes(env),
    targets: Object.fromEntries(entries)
  };
}

async function buildRobloxStatusPersistentPost(env) {
  const checkedAt = new Date().toISOString();
  const sourceUrl = stringOrNull(env.ROBLOX_STATUS_API_URL) || DEFAULT_ROBLOX_STATUS_API_URL;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "c0ld-clan-status-monitor/1.0"
    }
  });
  const text = await response.text();
  const parsed = parseJsonObject(text) || {};
  if (!response.ok) {
    throw httpError(502, `Roblox status API returned ${response.status}: ${text.slice(0, 500)}`);
  }

  const result = parsed.result || parsed;
  const overall = result.status_overall || {};
  const groups = (Array.isArray(result.status) ? result.status : []).map(group => ({
    name: stringOrNull(group?.name) || "Unknown",
    status: stringOrNull(group?.status) || "Unknown",
    status_code: toNumber(group?.status_code),
    updated: safeIso(group?.updated),
    services: (Array.isArray(group?.containers) ? group.containers : []).map(service => ({
      name: stringOrNull(service?.name) || "Unknown",
      status: stringOrNull(service?.status) || "Unknown",
      status_code: toNumber(service?.status_code),
      updated: safeIso(service?.updated)
    }))
  }));
  const incidents = (Array.isArray(result.incidents) ? result.incidents : []).map(incident => ({
    id: stringOrNull(incident?.id || incident?._id),
    name: stringOrNull(incident?.name) || "Active incident",
    status: stringOrNull(incident?.status) || "Active"
  }));
  const activeMaintenance = Array.isArray(result.maintenance?.active) ? result.maintenance.active : [];
  const statusCode = toNumber(overall.status_code) ?? Math.max(100, ...groups.map(group => group.status_code || 100));
  const overallStatusRaw = stringOrNull(overall.status) || (statusCode <= 100 ? "Operational" : "Service issue");
  const overallStatus = robloxStatusDisplayLabel(overallStatusRaw);
  const statusEmoji = statusCode <= 100 ? "🟢" : statusCode <= 300 ? "🟡" : "🔴";
  const affected = [];
  for (const group of groups) {
    for (const service of group.services) {
      if ((service.status_code ?? 100) > 100 || !/^operational$/i.test(service.status)) {
        affected.push(`${group.name} / ${service.name}: ${service.status}`);
      }
    }
  }
  const checkedUnix = Math.floor(new Date(checkedAt).getTime() / 1000);
  const officialUpdated = safeIso(overall.updated) || groups.map(group => group.updated).filter(Boolean).sort().pop() || null;
  const summary = [
    `${statusEmoji} **${overallStatus}**`,
    `Last Updated: <t:${checkedUnix}:R>`
  ].join("\n");
  const details = [
    ...(affected.length
      ? ["**Affected services**", ...affected.slice(0, 20).map(value => `• ${value}`)]
      : groups.map(group => `**${group.name}:** ${robloxStatusDisplayLabel(group.status)}`)),
    ...(incidents.length
      ? ["", "**Active incidents**", ...incidents.slice(0, 10).map(incident => `• ${incident.name} — ${incident.status}`)]
      : []),
    ...(activeMaintenance.length
      ? ["", `**Active maintenance:** ${activeMaintenance.length}`]
      : []),
    "",
    "[Official Roblox Status](https://status.roblox.com/)"
  ].join("\n");

  const digestSource = {
    checked_at: checkedAt,
    official_updated_at: officialUpdated,
    overall_status: overallStatus,
    status_code: statusCode,
    groups,
    incidents,
    active_maintenance_count: activeMaintenance.length
  };
  return {
    payload: persistentDiscordComponentPayload("🌐 ROBLOX Status", [details], checkedAt, {
      headerSummary: summary,
      headerSpacerLines: 1
    }),
    digestSource,
    snapshotAt: checkedAt
  };
}

function robloxStatusDisplayLabel(value) {
  const label = String(value || "").trim();
  return /^operational$/i.test(label) ? "Online" : (label || "Unknown");
}

async function buildVersionsPersistentPost(env) {
  const [places, releaseStates, devBlogEvents, versionEvents] = await Promise.all([
    supabaseSelect(env, PS99_PLACES_TABLE, {
      select: "place_id,place_name,root_place,latest_version,latest_published_at,latest_checked_at,updated_at",
      is_active: "eq.true",
      order: "root_place.desc,place_name.asc",
      limit: "100"
    }),
    supabaseSelect(env, ROBLOX_RELEASE_STATE_TABLE, {
      select: "channel,binary_type,current_version,client_version_upload,bootstrapper_version,last_checked_at,updated_at",
      channel: `eq.${robloxReleaseChannel(env)}`,
      binary_type: `eq.${robloxReleaseBinaryType(env)}`,
      limit: "1"
    }),
    supabaseSelect(env, PS99_DEV_BLOG_EVENTS_TABLE, {
      select: "event_id,post_id,title,url,published_at,detected_at,created_at",
      order: "detected_at.desc,id.desc",
      limit: "1"
    }).catch(() => []),
    supabaseSelect(env, PS99_VERSION_EVENTS_TABLE, {
      select: "place_id,place_name,previous_version,current_version,current_published_at,detected_at,created_at",
      order: "detected_at.desc",
      limit: "5000"
    }).catch(() => [])
  ]);
  const release = releaseStates[0] || null;
  const latestDevBlog = devBlogEvents[0] || null;
  const normalizedPlaces = places
    .map(place => ({
      place_id: toNumber(place.place_id),
      place_name: stringOrNull(place.place_name) || `Place ${place.place_id}`,
      root_place: Boolean(place.root_place),
      version: toNumber(place.latest_version),
      published_at: safeIso(place.latest_published_at),
      checked_at: safeIso(place.latest_checked_at || place.updated_at)
    }))
    .filter(place => !isHiddenPersistentVersionPlace(place))
    .map(place => ({
      ...place,
      update_reference: persistentVersionUpdateReference(place, versionEvents, latestDevBlog)
    }))
    .sort(comparePersistentVersionPlaces);
  const checkedAt = [
    safeIso(release?.last_checked_at || release?.updated_at),
    ...normalizedPlaces.map(place => place.checked_at)
  ].filter(Boolean).sort().pop() || new Date().toISOString();
  const checkedUnix = Math.floor(new Date(checkedAt).getTime() / 1000);
  const placeLines = normalizedPlaces.length
    ? normalizedPlaces.flatMap((place, index) => {
      const published = place.published_at
        ? ` — <t:${Math.floor(new Date(place.published_at).getTime() / 1000)}:R>`
        : "";
      const lines = [
        `**${escapeDiscordMarkdown(persistentVersionPlaceName(place))}:** ${place.version ?? "Unknown"}${published}`,
        ...(place.update_reference
          ? [`-# *Updated ${place.update_reference.count.toLocaleString("en-US")} ${place.update_reference.count === 1 ? "time" : "times"} since launch version ${place.update_reference.launch_version.toLocaleString("en-US")}*`]
          : [])
      ];
      if (index < normalizedPlaces.length - 1) lines.push("");
      return lines;
    })
    : ["No tracked PS99 place versions are stored yet."];
  const ps99Section = [
    "## Pet Simulator 99",
    ...placeLines
  ].join("\n");
  const robloxSection = [
    "## ROBLOX",
    `Client version: **${escapeDiscordMarkdown(release?.current_version || "Unknown")}**`
  ].join("\n");

  return {
    payload: persistentDiscordComponentPayload("📥 Versions", [
      ps99Section,
      robloxSection
    ], checkedAt, {
      headerSummary: `Last Updated: <t:${checkedUnix}:R>`,
      headerSpacerLines: 2
    }),
    digestSource: {
      checked_at: checkedAt,
      places: normalizedPlaces,
      latest_dev_blog: latestDevBlog ? {
        post_id: latestDevBlog.post_id,
        title: latestDevBlog.title,
        url: latestDevBlog.url,
        published_at: safeIso(latestDevBlog.published_at || latestDevBlog.detected_at)
      } : null,
      roblox_release: release ? {
        channel: release.channel,
        binary_type: release.binary_type,
        current_version: release.current_version,
        client_version_upload: release.client_version_upload,
        bootstrapper_version: release.bootstrapper_version,
        checked_at: safeIso(release.last_checked_at || release.updated_at)
      } : null
    },
    snapshotAt: checkedAt
  };
}

function persistentVersionUpdateReference(place, versionEvents, latestDevBlog) {
  const currentVersion = toNumber(place?.version);
  const placeId = toNumber(place?.place_id);
  // BIG Games exposes many blog dates at midnight rather than at the actual
  // launch time. The alert detection timestamp is the reliable launch anchor.
  const blogTime = isoToMs(latestDevBlog?.detected_at || latestDevBlog?.published_at || latestDevBlog?.created_at);
  if (!currentVersion || !placeId || blogTime === null) return null;

  const candidates = (Array.isArray(versionEvents) ? versionEvents : [])
    .filter(event => toNumber(event?.place_id) === placeId)
    .map(event => ({
      version: toNumber(event?.current_version),
      time: isoToMs(event?.current_published_at || event?.detected_at || event?.created_at)
    }))
    .filter(event => event.version && event.time !== null && Math.abs(event.time - blogTime) <= 24 * 60 * 60 * 1000)
    .sort((a, b) => Math.abs(a.time - blogTime) - Math.abs(b.time - blogTime) || a.time - b.time);
  const launchVersion = candidates[0]?.version || null;
  if (!launchVersion || launchVersion > currentVersion) return null;
  return {
    launch_version: launchVersion,
    count: Math.max(0, Math.round(currentVersion - launchVersion)),
    dev_blog_post_id: latestDevBlog?.post_id || null,
    dev_blog_title: latestDevBlog?.title || null,
    dev_blog_url: latestDevBlog?.url || null,
    dev_blog_published_at: safeIso(latestDevBlog?.published_at || latestDevBlog?.detected_at)
  };
}

function isHiddenPersistentVersionPlace(place) {
  const name = normalizeText(place?.place_name);
  return name === "holding" || name === "petsimulatortesting";
}

function persistentVersionPlaceName(place) {
  if (place?.root_place || toNumber(place?.place_id) === 8737899170) {
    return String(place?.place_name || "Pet Simulator 99").trim();
  }
  const name = normalizeText(place?.place_name);
  if (name === "petsimulator99farming") return "Farm World";
  if (name === "petsimulator99fishing") return "Fishing World";
  return String(place?.place_name || `Place ${place?.place_id || ""}`).trim();
}

function persistentVersionPlaceOrder(place) {
  if (place?.root_place || toNumber(place?.place_id) === 8737899170) return 0;
  const name = normalizeText(place?.place_name);
  if (name === "techworld") return 10;
  if (name === "voidworld") return 20;
  if (name === "fantasyworld") return 30;
  if (name === "petsimulator99farming") return 40;
  if (name === "petsimulator99fishing") return 50;
  if (name === "tradingplaza") return 60;
  if (name === "protradingplaza") return 70;
  return 100;
}

function persistentVersionPlaceGroup(place) {
  const order = persistentVersionPlaceOrder(place);
  if (order === 0) return 0;
  if (order <= 30) return 1;
  if (order <= 50) return 2;
  if (order <= 70) return 3;
  return 4;
}

function comparePersistentVersionPlaces(a, b) {
  const order = persistentVersionPlaceOrder(a) - persistentVersionPlaceOrder(b);
  if (order) return order;
  return String(a?.place_name || "").localeCompare(String(b?.place_name || ""));
}

async function buildRewardCutoffDashboard(env) {
  const baseUrl = "https://c0ld-clan-api-worker.service/api/reward-cutoffs";
  const playerUrl = new URL(baseUrl);
  playerUrl.searchParams.set("type", "players");
  const clanUrl = new URL(baseUrl);
  clanUrl.searchParams.set("type", "clans");
  const playerRanks = rewardCutoffRanks(playerUrl, env, "players");
  const leagueRanks = leagueRewardCutoffRanks(env);
  const eventMode = await globalLeaderboardSourceMode(playerUrl, env);
  const activeBattleMeta = eventMode === "clans"
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  const clanRewardCategories = clanRewardCategoriesFromBattleMeta(activeBattleMeta);
  const clanRanks = clanRewardCategories.length
    ? clanRewardRanksFromCategories(clanRewardCategories)
    : rewardCutoffRanks(clanUrl, env, "clans");
  const activeBattleKey = String(activeBattleMeta?.battleKey || "").trim();

  let players = {
    ok: true,
    type: "players",
    pool_source: "clans",
    ranks: playerRanks,
    cutoffs: []
  };
  let clans = {
    ok: true,
    type: "clans",
    battle_is_active: false,
    ranks: clanRanks,
    reward_categories: clanRewardCategories.length
      ? clanRewardCategories
      : DEFAULT_CLAN_REWARD_CATEGORIES,
    cutoffs: []
  };
  let leagues = {
    ok: true,
    type: "leagues",
    ranks: leagueRanks,
    cutoffs: []
  };
  let leaguePlayers = {
    ok: true,
    type: "players",
    pool_source: "leagues",
    ranks: leagueRanks,
    cutoffs: []
  };

  if (eventMode === "clans") {
    [players, clans] = await Promise.all([
      buildPlayerRewardCutoffs(playerUrl, env, playerRanks, {
        battleKey: activeBattleKey
      }),
      buildClanRewardCutoffs(clanUrl, env, clanRanks, {
        eventMode,
        activeBattleMeta,
        battleKey: activeBattleKey,
        rewardCategories: clanRewardCategories
      })
    ]);
  } else {
    [leagues, leaguePlayers] = await Promise.all([
      buildLeagueRewardCutoffs(env, leagueRanks),
      buildLeaguePlayerRewardCutoffs(env, leagueRanks).catch(error => ({
        ok: false,
        type: "players",
        pool_source: "leagues",
        message: error?.message || String(error),
        ranks: leagueRanks,
        cutoffs: []
      }))
    ]);
  }

  return {
    generated_at: new Date().toISOString(),
    event_mode: eventMode,
    active_battle: activeBattleMeta,
    players,
    clans,
    leagues,
    league_players: leaguePlayers
  };
}

async function buildLeaguePlayerRewardCutoffs(env, ranks) {
  const { payload } = await fetchLeaguePlayerMilestones(env, ranks);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const byRank = new Map(rows.map(row => [toNumber(row.rank), row]));
  const requested = [...new Set((Array.isArray(ranks) ? ranks : []).map(toNumber).filter(value => Number.isFinite(value) && value >= 1))].sort((a, b) => a - b);
  const maxRequested = requested.length ? Math.max(...requested) : 0;
  const maxAvailable = rows.reduce((max, row) => Math.max(max, toNumber(row.rank) || 0), 0);
  const snapshotAt = safeIso(
    payload.snapshot_at ||
    rows[0]?.fetched_at ||
    payload.generated_at
  );

  return {
    ok: true,
    type: "players",
    pool_source: "leagues",
    pool_is_partial: payload.pool_is_partial === true
      || (maxRequested > 0 ? (maxRequested > maxAvailable || rows.some(row => row?.available === false)) : true),
    generated_at: payload.generated_at || new Date().toISOString(),
    snapshot_at: snapshotAt,
    league_run_key: payload.league_run_key || null,
    league_run_label: payload.league_run_label || payload.league_run_key || null,
    source: payload.source || null,
    direct_authoritative_limit: toNumber(payload.direct_authoritative_limit) || null,
    direct_top_available: toNumber(payload.direct_top_available) || null,
    pool_completed: payload.pool_completed === true,
    pool_scan_id: payload.pool_scan_id || null,
    top_leagues_requested: toNumber(payload.top_leagues_requested) || null,
    top_leagues_scanned: toNumber(payload.top_leagues_scanned) || null,
    tracked_top_league_rank_max: toNumber(payload.tracked_top_league_rank_max) || null,
    tracked_top_league_snapshot_at: safeIso(payload.tracked_top_league_snapshot_at),
    simulated_player_count: toNumber(payload.simulated_player_count) || null,
    total_global_players: toNumber(payload.total_players) || toNumber(payload.top_available) || null,
    ranks,
    cutoffs: ranks.map(rankValue => {
      const row = byRank.get(toNumber(rankValue));
      return {
        rank: rankValue,
        points: row && row.available !== false ? toNumber(row.points ?? row.total_points) : null,
        available: Boolean(row && row.available !== false)
      };
    })
  };
}

async function buildLeagueRewardCutoffs(env, ranks) {
  const { payload } = await fetchLeagueMilestones(env, ranks);
  const byRank = new Map((Array.isArray(payload.rows) ? payload.rows : []).map(row => [toNumber(row.rank), row]));

  return {
    ok: true,
    type: "leagues",
    generated_at: payload.generated_at || new Date().toISOString(),
    snapshot_at: payload.snapshot_at || null,
    league_run_key: payload.league_run_key || null,
    league_run_label: payload.league_run_label || payload.league_run_key || null,
    league_end_at: safeIso(payload.league_end_at || payload.league_run_end_at),
    ranks,
    cutoffs: ranks.map(rankValue => {
      const row = byRank.get(rankValue);
      return {
        rank: rankValue,
        label: leagueRewardRangeLabel(rankValue),
        points: row && row.available !== false ? toNumber(row.points) : null,
        available: Boolean(row && row.available !== false)
      };
    })
  };
}

function leagueRewardCutoffRanks(env) {
  const parsed = String(env.LEAGUE_REWARD_CUTOFF_RANKS || "")
    .split(/[,\s]+/)
    .map(value => Math.round(Number(value)))
    .filter(value => Number.isFinite(value) && value >= 1 && value <= 100000);
  return [...new Set(parsed.length ? parsed : DEFAULT_LEAGUE_REWARD_CUTOFF_RANKS)]
    .sort((a, b) => a - b)
    .slice(0, 20);
}

function rewardCutoffDiscordPayload(dashboard) {
  const eventMode = dashboard.event_mode === "clans" ? "clans" : "leagues";
  const players = dashboard.players || {};
  const leaguePlayers = dashboard.league_players || {};
  const clans = dashboard.clans || {};
  const leagues = dashboard.leagues || {};
  const clanCutoffRows = Array.isArray(clans.cutoffs) ? clans.cutoffs : [];
  const clanCutoffRanks = Array.isArray(clans.ranks) ? clans.ranks : [];
  const clanRewardCategories = Array.isArray(clans.reward_categories) && clans.reward_categories.length
    ? clans.reward_categories
    : DEFAULT_CLAN_REWARD_CATEGORIES;
  const leagueCutoffRows = Array.isArray(leagues.cutoffs) ? leagues.cutoffs : [];
  const leagueCutoffRanks = Array.isArray(leagues.ranks) ? leagues.ranks : [];
  const clanHasActiveBattle = eventMode === "clans" && rewardCutoffClanActive(clans);
  const leagueHasActiveEvent = eventMode === "leagues" && rewardCutoffLeagueActive(leagues);
  const clanLines = clanHasActiveBattle
    ? rewardCutoffCategoryLines(clanCutoffRows, clanRewardCategories)
    : rewardCutoffCategoryBlankLines(clanRewardCategories, clanCutoffRanks, clanRewardRangeLabel);
  const leagueLines = leagueHasActiveEvent
    ? rewardCutoffLines(leagueCutoffRows, leagueRewardRangeLabel)
    : rewardCutoffBlankLines(leagueCutoffRanks, leagueRewardRangeLabel);
  const globalSource = eventMode === "clans" ? players : leaguePlayers;
  const eventName = eventMode === "clans"
    ? (
      clans.display_name ||
      players.display_name ||
      clans.battle ||
      players.battle ||
      "Current Clan Battle"
    )
    : (
      leagueHasActiveEvent
        ? (
          leagues.league_run_label ||
          leaguePlayers.league_run_label ||
          leagues.league_run_key ||
          leaguePlayers.league_run_key ||
          "Current League"
        )
        : "Global Leaderboard"
    );
  const snapshotAt = [
    globalSource.snapshot_at,
    eventMode === "clans" ? clans.snapshot_at : leagues.snapshot_at
  ]
    .map(safeIso)
    .filter(Boolean)
    .sort()
    .pop()
    || dashboard.generated_at
    || new Date().toISOString();
  const unix = Math.floor(new Date(snapshotAt).getTime() / 1000);
  const eventTiming = eventMode === "clans"
    ? safeIso(clans.battle_end_iso || clans.battle_ended_at)
    : (leagueHasActiveEvent ? safeIso(leagues.league_end_at || leagues.league_run_end_at) : null);
  const eventTimingLine = eventTiming
    ? `Ends <t:${Math.floor(new Date(eventTiming).getTime() / 1000)}:R>`
    : null;
  const globalLines = rewardCutoffLines(globalSource.cutoffs, playerRewardRangeLabel);
  globalLines.push("-# Global ranks are estimations by pulling the top 10k leagues/clans. Not 100% accurate, but close.");

  const headerSummary = [
      `**${eventName}**`,
      eventTimingLine,
      `Last Updated: <t:${unix}:R>`
    ].filter(Boolean).join("\n");

  return persistentDiscordComponentPayload("🏅 Reward Cutoffs", [
    [`## Global Leaderboard (${eventMode === "clans" ? "Clan Battle" : "Leagues"})`, ...globalLines].join("\n"),
    ["## Clan Rewards", ...clanLines].join("\n"),
    ["## League Rewards", ...leagueLines].join("\n")
  ], snapshotAt, { headerSummary });
}

function persistentDiscordComponentPayload(title, sections, timestamp, options = {}) {
  const iso = safeIso(timestamp) || new Date().toISOString();
  const unix = Math.floor(new Date(iso).getTime() / 1000);
  const headerComponents = [{
    type: 10,
    content: `## ${String(title || "Automated Update").slice(0, 200)}`
  }];
  const headerSpacerLines = clamp(Number(options.headerSpacerLines) || 0, 0, 2);
  if (headerSpacerLines) {
    headerComponents.push({
      type: 10,
      content: Array.from({ length: headerSpacerLines }, () => "\u200B").join("\n")
    });
  }
  const headerSummary = String(options.headerSummary || "").trim();
  if (headerSummary.trim()) {
    headerComponents.push({
      type: 10,
      content: headerSummary.slice(0, 4000)
    });
  }
  const body = [{
    type: 9,
    components: headerComponents,
    accessory: {
      type: 11,
      media: { url: DISCORD_ALERT_THUMBNAIL_URL },
      description: "PS99 Genie Fox"
    }
  }, discordSeparatorComponent()];

  const normalizedSections = (Array.isArray(sections) ? sections : [sections])
    .map(section => String(section || "").trim())
    .filter(Boolean);
  normalizedSections.forEach((section, index) => {
    if (index > 0) body.push(discordSeparatorComponent());
    body.push({ type: 10, content: section.slice(0, 4000) });
  });
  const mediaUrl = safeHttpUrl(options.mediaUrl);
  if (mediaUrl) {
    body.push(
      discordSeparatorComponent(),
      {
        type: 12,
        items: [{
          media: { url: mediaUrl },
          description: String(options.mediaDescription || "PS99 update preview").slice(0, 1024)
        }]
      }
    );
  }
  body.push(
    discordSeparatorComponent(),
    {
      type: 10,
      content: `-# **${DISCORD_ALERT_FOOTER_TEXT} Today at <t:${unix}:t>**`
    }
  );

  return {
    flags: DISCORD_COMPONENTS_V2_FLAG,
    components: [{
      type: 17,
      accent_color: DISCORD_ALERT_COLOR,
      components: body
    }]
  };
}

function discordSeparatorComponent() {
  return { type: 14, divider: true, spacing: 1 };
}

function rewardCutoffLines(cutoffs, labeler) {
  const rows = Array.isArray(cutoffs) ? cutoffs : [];
  return rows.length
    ? rows.map(row => `**${labeler(toNumber(row.rank) || 0)}:** ${formatRewardCutoffPoints(row.points)}`)
    : ["No cutoff data available."];
}

function rewardCutoffBlankLines(ranks, labeler) {
  const values = Array.isArray(ranks) ? ranks : [];
  return values.length
    ? values.map(rank => `**${labeler(toNumber(rank) || 0)}:** —`)
    : ["No active clan battle currently."];
}

function rewardCutoffClanActive(clans) {
  const battleEndedAt = safeIso(clans?.battle_end_iso || clans?.battleEndedAt || clans?.battle_ended_at);
  if (battleEndedAt) {
    const endedMs = new Date(battleEndedAt).getTime();
    if (Number.isFinite(endedMs)) {
      return endedMs > Date.now();
    }
  }

  const active = parseBooleanish(clans?.battle_is_active);
  if (active !== null) {
    return active;
  }

  return false;
}

function rewardCutoffCategoryLines(cutoffs, categories) {
  const byRank = new Map((Array.isArray(cutoffs) ? cutoffs : [])
    .map(row => [toNumber(row?.rank), row]));
  const values = Array.isArray(categories) ? categories : [];
  if (!values.length) return ["No cutoff data available."];

  return values.map(category => {
    const rank = toNumber(category?.rank ?? category?.worst);
    const row = byRank.get(rank);
    const label = category?.label || playerRewardRangeLabel(rank);
    return `**${label}:** ${formatRewardCutoffPoints(row?.points)}`;
  });
}

function rewardCutoffCategoryBlankLines(categories, fallbackRanks = [], fallbackLabeler = playerRewardRangeLabel) {
  const values = Array.isArray(categories) ? categories : [];
  if (!values.length) return rewardCutoffBlankLines(fallbackRanks, fallbackLabeler);
  return values.map(category => `**${category?.label || fallbackLabeler(category?.rank)}:** —`);
}

function rewardCutoffLeagueActive(leagues) {
  const leagueEndedAt = safeIso(leagues?.league_end_at || leagues?.league_run_end_at);
  if (leagueEndedAt) {
    const endedMs = new Date(leagueEndedAt).getTime();
    if (Number.isFinite(endedMs)) {
      return endedMs > Date.now();
    }
  }

  const active = parseBooleanish(leagues?.league_is_active ?? leagues?.is_active);
  if (active !== null) return active;

  return Boolean(
    (leagues?.league_run_key || leagues?.league_run_label) &&
    (Array.isArray(leagues?.cutoffs) ? leagues.cutoffs : [])
      .some(row => row?.points !== null && row?.points !== undefined)
  );
}

async function fetchLatestBattleRun(env, clan) {
  const rows = await supabaseSelect(env, BATTLE_RUNS_TABLE, {
    select: "clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,first_seen_at,last_seen_at,latest_snapshot_id,latest_snapshot_at,is_active,updated_at",
    clan_name: `eq.${clan}`,
    order: "latest_snapshot_at.desc",
    limit: "1"
  });

  return rows[0] || null;
}

function playerRewardRangeLabel(rank) {
  return `Top ${Number(rank || 0).toLocaleString("en-US")}`;
}

function clanRewardRangeLabel(rank) {
  const labels = {
    1: "#1",
    3: "#2-3",
    10: "#4-10",
    30: "Top 30",
    50: "#11-50",
    250: "#51-250",
    500: "Top 500"
  };
  return labels[rank] || `Top ${Number(rank || 0).toLocaleString("en-US")}`;
}

function leagueRewardRangeLabel(rank) {
  const labels = {
    1: "#1",
    3: "#2-3",
    15: "#4-15",
    50: "#16-50",
    100: "#51-100",
    250: "#101-250",
    2000: "#251-2,000"
  };
  return labels[rank] || `Top ${Number(rank || 0).toLocaleString("en-US")}`;
}

function formatRewardCutoffPoints(value) {
  const points = toNumber(value);
  return points === null ? "—" : `${Math.round(points).toLocaleString("en-US")} pts`;
}

function latestRewardCutoffSnapshot(dashboard) {
  return [
    dashboard.players?.snapshot_at,
    dashboard.league_players?.snapshot_at,
    dashboard.clans?.snapshot_at,
    dashboard.leagues?.snapshot_at
  ]
    .map(safeIso)
    .filter(Boolean)
    .sort()
    .pop() || null;
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
      return rank !== null && rank >= 1;
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
    raw.username,
    raw.user_name,
    raw.name,
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
    raw.display_name,
    raw.displayName,
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

function globalCandidateJoinIso(value) {
  const raw = parseGlobalCandidateRaw(value?.raw_candidate ?? value);
  const rawMember = parseJsonObject(raw.member) || {};
  return memberJoinIso({
    join_time: firstDefined(raw.join_time, raw.joinTime),
    joined_at: firstDefined(raw.joined_at, raw.joinedAt),
    raw_member: rawMember
  });
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
      raw_global: {
        source_clan: match.source_clan,
        source_clan_rank: match.source_clan_rank,
        source_clan_points: match.source_clan_points,
        candidate: match.raw_candidate || {}
      },
      updated_at: run.updated_at || row.updated_at || match.updated_at || null
    };
  });
}

async function handleGlobalSearch(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = url.searchParams.get("clan") || clanName(env);
  const query = String(url.searchParams.get("q") || url.searchParams.get("username") || "").trim();
  const historyHoursValue = globalSearchHistoryHours(env, url.searchParams.get("history_hours") || url.searchParams.get("hours"));
  const historyLimit = globalSearchHistoryLimit(env, url.searchParams.get("history_limit"));

  if (!query) {
    throw httpError(400, "Missing search query. Use ?q=username.");
  }

  if (String(url.searchParams.get("scope") || "").trim().toLowerCase() === "pool") {
    return handleGlobalLeaderboardPoolSearch(url, env, clan, query);
  }

  const rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,raw_global,updated_at",
    clan_name: `eq.${clan}`,
    order: "clan_rank.asc",
    limit: "1000"
  });

  const key = normalizeGlobalSearchKey(query);
  let found = findGlobalCurrentSearchMatch(rows, query, key);

  if (!found) {
    found = await findTrackedGlobalCurrentSearchMatch(env, clan, query, key);
  }

  if (!found) {
    return cacheJson(await searchGlobalRankCandidates(env, globalRankRunClanForTrackedMember(env, clan), query, null, {
      historyHours: historyHoursValue,
      historyLimit
    }), env);
  }

  const foundClan = String(found.clan_name || clan).trim() || clan;
  const runClan = globalRankRunClanForTrackedMember(env, foundClan);
  const latestRun = await findLatestGlobalRankSearchRun(env, runClan);
  const foundUsesLatestRun = Boolean(latestRun?.run_key && found.run_key === latestRun.run_key);
  const foundSourceClan = globalCurrentSourceClan(found);
  const foundSourceClanMismatch = Boolean(
    foundSourceClan &&
    normalizeText(foundSourceClan) !== normalizeText(foundClan)
  );

  if (!foundUsesLatestRun || foundSourceClanMismatch || !(toNumber(found.global_rank) > 0)) {
    const candidateResult = await searchGlobalRankCandidates(env, runClan, query, null, {
      historyHours: historyHoursValue,
      historyLimit
    });
    if (candidateResult?.ok && candidateResult.row) {
      const run = candidateResult.run || null;
      const candidateClan = String(
        candidateResult.row.source_clan ||
        candidateResult.row.clan_name ||
        ""
      ).trim();
      const sameTrackedClan = Boolean(
        candidateClan &&
        normalizeText(candidateClan) === normalizeText(foundClan)
      );
      const displayClan = candidateClan || foundClan;
      return cacheJson({
        ...candidateResult,
        clan_name: displayClan,
        row: {
          ...candidateResult.row,
          clan_name: displayClan,
          username: candidateResult.row.username || found.username,
          display_name: candidateResult.row.display_name || found.display_name,
          avatar_url: candidateResult.row.avatar_url || found.avatar_url,
          clan_rank: sameTrackedClan
            ? (toNumber(found.clan_rank) || candidateResult.row.clan_rank)
            : candidateResult.row.clan_rank,
          clan_points: sameTrackedClan
            ? (toNumber(found.clan_points) || candidateResult.row.clan_points)
            : candidateResult.row.clan_points,
          member_rank: sameTrackedClan
            ? (toNumber(found.clan_rank) || candidateResult.row.member_rank)
            : candidateResult.row.member_rank,
          member_points: sameTrackedClan
            ? (toNumber(found.clan_points) || candidateResult.row.member_points)
            : candidateResult.row.member_points,
          clan_member_count: sameTrackedClan ? (toNumber(run?.clan_member_count) || null) : null,
          source_clan: displayClan
        },
        run
      }, env);
    }

    return cacheJson(candidateResult, env);
  }

  const history = await supabaseSelect(env, GLOBAL_RANK_HISTORY_TABLE, {
    select: "run_key,fetched_at,event_name,battle_key,battle_display_name,global_rank,global_points,total_global_players,clan_rank,clan_points,found",
    clan_name: `eq.${foundClan}`,
    user_id: `eq.${found.user_id}`,
    fetched_at: `gte.${globalSearchHistorySinceIso(found.fetched_at || found.updated_at || Date.now(), historyHoursValue)}`,
    order: "fetched_at.desc",
    limit: String(historyLimit)
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
    clan_name: foundClan,
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

function findGlobalCurrentSearchMatch(rows, query, key) {
  const text = String(query || "").trim();
  return (rows || []).find(row => {
    const id = String(row.user_id || "").trim();
    return (
      id === text ||
      normalizeGlobalSearchKey(row.username) === key ||
      normalizeGlobalSearchKey(row.display_name) === key
    );
  }) || null;
}

function globalCurrentSourceClan(row) {
  const rawGlobal = parseJsonObject(row?.raw_global) || {};
  return String(rawGlobal.source_clan || "").trim();
}

async function findTrackedGlobalCurrentSearchMatch(env, requestedClan, query, key) {
  const requestedKey = normalizeText(requestedClan);
  const alternateClans = clanNames(env)
    .filter(name => normalizeText(name) && normalizeText(name) !== requestedKey);

  if (!alternateClans.length) return null;

  const rows = await supabaseSelect(env, GLOBAL_RANK_CURRENT_TABLE, {
    select: "clan_name,user_id,username,display_name,avatar_url,clan_rank,clan_points,battle_key,battle_display_name,event_name,global_rank,global_points,total_global_players,found,fetched_at,run_key,raw_global,updated_at",
    clan_name: postgrestInFilter(alternateClans),
    order: "clan_name.asc,clan_rank.asc",
    limit: String(Math.min(10000, alternateClans.length * 1000))
  }).catch(() => []);

  return findGlobalCurrentSearchMatch(rows, query, key);
}

function globalRankRunClanForTrackedMember(env, clan) {
  const primaryClan = clanName(env);
  return normalizeText(clan) === normalizeText(primaryClan)
    ? (String(clan || "").trim() || primaryClan)
    : primaryClan;
}

async function handleGlobalLeaderboardPoolSearch(url, env, clan, query) {
  const sourceMode = await globalLeaderboardSourceMode(url, env);

  if (sourceMode === "leagues") {
    const payload = await fetchLeagueSoloLeaderboard(env, 500, query);
    const sourceRows = Array.isArray(payload.rows) ? payload.rows : [];
    const totalGlobalPlayers = Math.max(toNumber(payload.top_available) || 0, sourceRows.length) || null;
    const avatarMap = await resolveRobloxAvatarHeadshots(
      sourceRows.map(row => row.user_id),
      env
    ).catch(() => new Map());
    const rows = sourceRows.map((row, index) => ({
      source_mode: "leagues",
      global_rank: toNumber(row.rank),
      global_rank_estimated: row.rank_is_estimated === true,
      projected_rank: null,
      projected_rank_1h: null,
      projected_points_1h: null,
      projection_basis: null,
      clan: String(row.league_name || "").trim() || "Unlisted",
      source_clan: String(row.league_name || "").trim() || "Unlisted",
      user_id: toNumber(row.user_id),
      username: String(row.username || row.display_name || `user_${row.user_id}`).trim(),
      display_name: String(row.display_name || row.username || `user_${row.user_id}`).trim(),
      avatar_url: avatarMap.get(String(row.user_id)) || null,
      points: toNumber(row.points ?? row.total_points) || 0,
      gain_5m: null,
      gain_1h: null,
      gain_12h: null,
      gain_24h: null,
      total_global_players: totalGlobalPlayers,
      fetched_at: safeIso(row.fetched_at || payload.snapshot_at || payload.generated_at)
    }));

    return cacheJson({
      ok: rows.length > 0,
      message: rows.length
        ? null
        : `No League player matched "${query}".`,
      query,
      source_mode: "leagues",
      source_label: "Leagues",
      search_scope: payload.search_scope || "top-500-plus-direct-player-plus-stored-league-rosters",
      total_global_players: totalGlobalPlayers,
      pool_completed: payload.pool_completed === true,
      rank_is_exact: rows.every(row => toNumber(row.global_rank) !== null && row.global_rank_estimated !== true),
      rank_is_estimated: rows.some(row => toNumber(row.global_rank) !== null && row.global_rank_estimated === true),
      rows,
      row: rows[0] || null
    }, env, 30);
  }

  const historyHoursValue = globalSearchHistoryHours(env, url.searchParams.get("history_hours") || url.searchParams.get("hours"));
  const historyLimit = globalSearchHistoryLimit(env, url.searchParams.get("history_limit"));
  const activeBattleMeta = await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeBattleKey = String(activeBattleMeta?.battleKey || "").trim();
  const result = await searchGlobalRankCandidates(env, clan, query, activeBattleKey || null, {
    historyHours: historyHoursValue,
    historyLimit
  });

  if (!result?.ok || !result.row) {
    return cacheJson({
      ...result,
      source_mode: "clans",
      source_label: "Clan Battle",
      rows: [],
      row: null
    }, env, 30);
  }

  const row = {
    global_rank: toNumber(result.row.global_rank),
    projected_rank: null,
    projected_rank_1h: null,
    projected_points_1h: null,
    projection_basis: null,
    clan: String(result.row.source_clan || result.row.clan_name || "").trim() || "Unlisted",
    source_clan: String(result.row.source_clan || result.row.clan_name || "").trim() || "Unlisted",
    user_id: toNumber(result.row.user_id),
    username: result.row.username,
    display_name: result.row.display_name,
    avatar_url: result.row.avatar_url || null,
    points: toNumber(result.row.global_points ?? result.row.member_points) || 0,
    gain_5m: toNumber(result.row.gain_5m),
    gain_1h: toNumber(result.row.gain_1h),
    gain_12h: toNumber(result.row.gain_12h),
    gain_24h: toNumber(result.row.gain_24h),
    fetched_at: result.row.fetched_at || result.run?.finished_at || result.run?.updated_at || null
  };

  return cacheJson({
    ...result,
    source_mode: "clans",
    source_label: "Clan Battle",
    total_global_players: toNumber(result.row.total_global_players) || null,
    rank_is_exact: toNumber(row.global_rank) !== null,
    rows: [row],
    row
  }, env, 30);
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

  const rows = await selectExternalHistoryRows(env, source, {
    select: "source,user_id,username,battle_key,battle_name,clan_name,final_rank,total_ranked,clan_rank,total_clan_members,global_rank,total_global_players,final_points,final_snapshot_at,status,is_manual_import,import_batch_id,imported_from,discord_message_url,image_url,created_at,updated_at,reviewed_at,reviewed_by",
    user_id: `eq.${userId}`,
    status: status === "all" ? undefined : `eq.${status || "approved"}`,
    order: "final_snapshot_at.desc.nullslast,created_at.desc",
    limit: String(limit)
  });

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    user_id: userId,
    source,
    storage_table: source === "cw_bot" ? CW_BOT_HISTORY_TABLE : EXTERNAL_PLAYER_HISTORY_TABLE,
    status,
    rows: sortExternalHistoryRows(rows).slice(0, limit).map(normalizeExternalHistoryOutput)
  }, env, 30);
}

async function handleMissingCwBotImports(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const clan = String(url.searchParams.get("clan") || clanName(env)).trim() || clanName(env);
  const requestedBattle = String(url.searchParams.get("battle") || battleKey(env)).trim();
  const includeAllRows = isTruthyParam(url, "include_all");

  if (!requestedBattle || normalizeText(requestedBattle) === "auto") {
    throw httpError(400, "Missing battle. Pass ?battle=BattleKey.");
  }

  const [battleRun, rosterResult] = await Promise.all([
    fetchBattleRun(env, clan, requestedBattle).catch(() => null),
    fetchFinalClanRosterForBattle(env, clan, requestedBattle)
  ]);
  const roster = rosterResult.rows;
  const userIds = roster.map(row => toNumber(row.user_id)).filter(Boolean);
  const cwRows = await fetchCwBotRowsForUsers(env, userIds);
  const cwRowsByUser = new Map();

  for (const row of cwRows) {
    const userId = toNumber(row.user_id);
    if (!userId) continue;
    if (!cwRowsByUser.has(userId)) cwRowsByUser.set(userId, []);
    cwRowsByUser.get(userId).push(row);
  }

  const finalMembers = roster.map(row => {
    const userId = toNumber(row.user_id);
    const importRows = sortExternalHistoryRows(cwRowsByUser.get(userId) || []);
    const bestImport = importRows[0] || null;

    return {
      user_id: userId,
      username: row.username || null,
      rank: toNumber(row.rank),
      total_points: toNumber(row.total_points),
      snapshot_id: row.snapshot_id || null,
      fetched_at: row.fetched_at || null,
      has_cw_bot_import: Boolean(bestImport),
      has_cw_bot_history: Boolean(bestImport),
      cw_bot_status: bestImport?.status || null,
      cw_bot_rows: importRows.length,
      cw_bot_history_rows: importRows.length,
      cw_bot_import: bestImport ? normalizeExternalHistoryOutput(bestImport) : null
    };
  }).sort((a, b) => (toNumber(a.rank) || Number.MAX_SAFE_INTEGER) - (toNumber(b.rank) || Number.MAX_SAFE_INTEGER));
  const missingRows = finalMembers.filter(row => !row.has_cw_bot_history);
  const statusCounts = finalMembers.reduce((counts, row) => {
    const key = row.cw_bot_status || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    clan_name: clan,
    battle_key: requestedBattle,
    battle_display_name: battleRun?.battle_display_name || requestedBattle,
    final_snapshot_id: rosterResult.snapshot_id || null,
    final_snapshot_at: rosterResult.fetched_at || null,
    final_snapshot_source: rosterResult.table || null,
    final_member_count: finalMembers.length,
    imported_count: finalMembers.length - missingRows.length,
    missing_count: missingRows.length,
    status_counts: statusCounts,
    rows: includeAllRows ? finalMembers : missingRows
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
  let userId = toNumber(body.user_id || body.roblox_user_id);
  const username = stringOrNull(body.username || body.display_name || body.query);
  const messageUrl = String(body.message_url || body.discord_message_url || "").trim();
  const preferEarliestMessage = body.prefer_earliest_message === true
    || String(body.prefer_earliest_message || "").toLowerCase() === "true";

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

  const parsedUserId = toNumber(parsed.player_id);
  if (userId && parsedUserId && userId !== parsedUserId) {
    throw httpError(409, `CW_Bot image belongs to Roblox user ID ${parsedUserId}, not ${userId}.`);
  }

  userId = userId || parsedUserId;
  if (!userId) {
    const identityQuery = parsed.player_name || username;
    const identity = identityQuery
      ? await resolveGlobalSearchIdentity(identityQuery, env).catch(() => null)
      : null;
    userId = toNumber(identity?.user_id);
  }

  if (!userId) {
    throw httpError(422, "CW_Bot history was recognized, but its Roblox user ID could not be resolved.");
  }

  const preventOverwrite = historyImportFlag(env, "CW_BOT_IMPORT_PREVENT_OVERWRITE", null, "true");
  const [trackedKeys, existingRowsByKey] = await Promise.all([
    trackedHistoryBattleKeySet(env, userId),
    preventOverwrite ? externalHistoryBattleRowMap(env, userId, "cw_bot") : Promise.resolve(new Map())
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
  const backfills = [];
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

    const finalRank = toNumber(parsedRow.final_rank ?? parsedRow.global_rank ?? parsedRow.g_rank ?? parsedRow.rank);
    const totalRanked = toNumber(parsedRow.total_ranked ?? parsedRow.total_global_players ?? parsedRow.total);
    const clanRank = toNumber(parsedRow.clan_rank ?? parsedRow.member_rank ?? parsedRow.final_clan_rank);
    const totalClanMembers = toNumber(parsedRow.total_clan_members ?? parsedRow.total_members);
    const globalRank = toNumber(parsedRow.global_rank ?? parsedRow.g_rank ?? parsedRow.final_global_rank ?? parsedRow.final_rank ?? parsedRow.rank);
    const totalGlobalPlayers = toNumber(parsedRow.total_global_players ?? parsedRow.global_total ?? parsedRow.total_ranked ?? parsedRow.total);
    const finalPoints = parseCwBotNumber(parsedRow.final_points ?? parsedRow.points);

    if (finalRank === null && clanRank === null && globalRank === null && finalPoints === null) {
      skipped.push({ reason: "missing_rank_and_points", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    const row = {
      source: "cw_bot",
      user_id: userId,
      username: stringOrNull(parsed.player_name || username),
      battle_key: battleKeyValue,
      battle_name: battleName,
      clan_name: stringOrNull(parsedRow.clan_name || parsedRow.clan),
      final_rank: finalRank,
      total_ranked: totalRanked,
      clan_rank: clanRank,
      total_clan_members: totalClanMembers,
      global_rank: globalRank,
      total_global_players: totalGlobalPlayers,
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
        already_tracked: trackedKeys.has(battleKeyValue),
        parsed_row: parsedRow
      },
      raw_fingerprint: `${rawFingerprintBase}:${battleKeyValue}`,
      updated_at: importedAt
    };

    if (preventOverwrite) {
      const existingRow = existingRowsByKey.get(battleKeyValue);
      if (existingRow) {
        const patch = externalHistoryBackfillPatch(existingRow, row, {
          preferEarliestMessage
        });
        if (patch) {
          backfills.push({ existing: existingRow, patch });
        } else {
          skipped.push({ reason: "already_imported_complete", battle_name: battleName, battle_key: battleKeyValue });
        }
        queuedKeys.add(battleKeyValue);
        continue;
      }
    }

    rows.push(row);
    queuedKeys.add(battleKeyValue);
  }

  if (rows.length) {
    await supabaseUpsertChunked(env, CW_BOT_HISTORY_TABLE, rows, "user_id,battle_key", 100);
  }

  const backfilledRows = [];
  for (const item of backfills) {
    await supabasePatch(env, CW_BOT_HISTORY_TABLE, {
      user_id: `eq.${userId}`,
      battle_key: `eq.${item.existing.battle_key}`
    }, item.patch);
    backfilledRows.push({ ...item.existing, ...item.patch });
  }

  return json({
    ok: true,
    user_id: userId,
    source: "cw_bot",
    storage_table: CW_BOT_HISTORY_TABLE,
    discord_message_url: canonicalDiscordMessageUrl(messageRef),
    prevent_overwrite: preventOverwrite,
    prefer_earliest_message: preferEarliestMessage,
    parsed_count: parsed.rows.length,
    status: importStatus,
    imported_count: rows.length,
    backfilled_count: backfilledRows.length,
    skipped_count: skipped.length,
    rows: rows.concat(backfilledRows).map(normalizeExternalHistoryOutput),
    skipped
  });
}

async function handleCwBotHistoryChannelScan(request, env) {
  if (String(env.CW_BOT_IMPORT_ENABLED || "false").toLowerCase() !== "true") {
    throw httpError(403, "CW_Bot imports are not enabled. Set CW_BOT_IMPORT_ENABLED=true on the Worker.");
  }

  requireAdmin(request, env);
  const body = await readJsonRequest(request);
  const channelId = String(body.channel_id || "").trim();
  const beforeMessageId = String(body.before_message_id || "").trim();
  const requestedAuthorId = String(body.author_id || env.CW_BOT_USER_ID || DEFAULT_CW_BOT_USER_ID).trim();
  const expectedAuthorId = String(env.CW_BOT_USER_ID || DEFAULT_CW_BOT_USER_ID).trim();
  const limit = clamp(Math.trunc(toNumber(body.limit) || 100), 1, 100);
  const commandWindowSeconds = clamp(Math.trunc(toNumber(body.command_window_seconds) || 180), 30, 900);

  if (!channelId) throw httpError(400, "Missing channel_id.");
  if (!/^\d+$/.test(channelId)) throw httpError(400, "channel_id must be a Discord snowflake.");
  if (beforeMessageId && !/^\d+$/.test(beforeMessageId)) {
    throw httpError(400, "before_message_id must be a Discord snowflake.");
  }
  if (requestedAuthorId !== expectedAuthorId) {
    throw httpError(400, `author_id must match configured CW_Bot ID ${expectedAuthorId}.`);
  }

  const channel = await fetchDiscordChannel(env, channelId);
  const guildId = String(channel?.guild_id || body.guild_id || "").trim();
  if (!guildId) throw httpError(400, "The supplied channel is not a Discord server channel.");

  validateCwBotImportTarget({
    guildId,
    channelId,
    messageId: beforeMessageId || "0"
  }, env);

  const messages = await fetchDiscordChannelMessages(env, channelId, {
    beforeMessageId,
    limit
  });
  const orderedMessages = messages.slice().sort((left, right) =>
    compareDiscordSnowflakes(right?.id, left?.id)
  );
  const pending = normalizeCwBotPendingMessages(body.pending_bot_messages, {
    guildId,
    channelId,
    authorId: expectedAuthorId
  });
  const waiting = pending.slice();
  const candidatesById = new Map();
  const ignored = [];
  const stats = {
    messages_scanned: orderedMessages.length,
    cw_bot_messages: 0,
    cw_bot_images: 0,
    direct_history_signals: 0,
    command_pairs: 0,
    cw_bot_non_history: 0
  };

  for (const message of orderedMessages) {
    const authorId = String(message?.author?.id || "");

    if (authorId === expectedAuthorId) {
      stats.cw_bot_messages += 1;
      const text = discordMessageText(message);
      const imageUrl = firstDiscordMessageImageUrl(message);
      const directHistory = isDirectCwBotHistoryMessage(text);

      if (imageUrl) stats.cw_bot_images += 1;

      if (directHistory) {
        stats.direct_history_signals += 1;
        candidatesById.set(String(message.id), cwBotHistoryScanCandidate(message, {
          guildId,
          channelId,
          imageUrl,
          reason: "history_marker"
        }));
        continue;
      }

      if (imageUrl) {
        waiting.push(cwBotPendingMessage(message, {
          guildId,
          channelId,
          imageUrl
        }));
      } else {
        stats.cw_bot_non_history += 1;
        ignored.push(cwBotIgnoredScanMessage(message, {
          guildId,
          channelId,
          reason: "no_history_marker_or_image"
        }));
      }
      continue;
    }

    const command = parseCwBotHistoryCommand(message?.content);
    if (!command) continue;

    const matchIndex = nearestPendingCwBotMessageIndex(waiting, message?.timestamp, commandWindowSeconds);
    if (matchIndex < 0) continue;

    const matched = waiting.splice(matchIndex, 1)[0];
    stats.command_pairs += 1;
    candidatesById.set(String(matched.message_id), {
      ...matched,
      command_query: command.query,
      command_message_id: String(message.id || ""),
      command_timestamp: safeIso(message.timestamp),
      reason: "paired_history_command",
      message_url: canonicalDiscordMessageUrl({
        guildId: matched.guild_id,
        channelId: matched.channel_id,
        messageId: matched.message_id
      })
    });
  }

  const oldestTimestamp = orderedMessages.length
    ? safeIso(orderedMessages[orderedMessages.length - 1]?.timestamp)
    : null;
  const unresolved = waiting.filter(item => {
    if (!oldestTimestamp) return true;
    const ageSeconds = (Date.parse(item.timestamp) - Date.parse(oldestTimestamp)) / 1000;
    return Number.isFinite(ageSeconds) && ageSeconds <= commandWindowSeconds;
  }).slice(-25);
  const unresolvedIds = new Set(unresolved.map(item => String(item.message_id)));
  const expired = waiting.filter(item => !unresolvedIds.has(String(item.message_id)));
  stats.cw_bot_non_history += expired.length;
  ignored.push(...expired.map(item => ({
    ...item,
    reason: "unpaired_image",
    message_url: canonicalDiscordMessageUrl({
      guildId: item.guild_id,
      channelId: item.channel_id,
      messageId: item.message_id
    })
  })));

  const nextBeforeMessageId = orderedMessages.length
    ? String(orderedMessages[orderedMessages.length - 1]?.id || "")
    : beforeMessageId || null;
  const candidates = [...candidatesById.values()].sort((left, right) =>
    compareDiscordSnowflakes(left.message_id, right.message_id)
  );

  return json({
    ok: true,
    guild_id: guildId,
    channel_id: channelId,
    author_id: expectedAuthorId,
    before_message_id: beforeMessageId || null,
    next_before_message_id: nextBeforeMessageId || null,
    page_limit: limit,
    done: orderedMessages.length < limit,
    command_window_seconds: commandWindowSeconds,
    stats,
    candidate_count: candidates.length,
    candidates,
    ignored_count: ignored.length,
    ignored,
    pending_bot_messages: unresolved
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function handleCwBotHistoryGuildChannels(request, env) {
  if (String(env.CW_BOT_IMPORT_ENABLED || "false").toLowerCase() !== "true") {
    throw httpError(403, "CW_Bot imports are not enabled. Set CW_BOT_IMPORT_ENABLED=true on the Worker.");
  }

  requireAdmin(request, env);
  const body = await readJsonRequest(request);
  const guildId = String(body.guild_id || "").trim();

  if (!guildId) throw httpError(400, "Missing guild_id.");
  if (!/^\d+$/.test(guildId)) throw httpError(400, "guild_id must be a Discord snowflake.");
  validateCwBotImportGuild(guildId, env);

  const [guildChannels, activeThreadPayload] = await Promise.all([
    fetchDiscordGuildChannels(env, guildId),
    fetchDiscordActiveGuildThreads(env, guildId).catch(() => ({ threads: [] }))
  ]);
  const channelAllowlist = csvSet(env.CW_BOT_IMPORT_CHANNEL_IDS);
  const messageChannelTypes = new Set([0, 5, 10, 11, 12]);
  const archiveParentTypes = new Set([0, 5, 15, 16]);
  const channelsById = new Map();
  const archiveParentChannels = [];

  for (const channel of Array.isArray(guildChannels) ? guildChannels : []) {
    const channelId = String(channel?.id || "").trim();
    const channelType = toNumber(channel?.type);
    if (!channelId || !archiveParentTypes.has(channelType)) continue;
    if (channelAllowlist.size && !channelAllowlist.has(channelId)) continue;
    archiveParentChannels.push({
      channel_id: channelId,
      channel_name: String(channel?.name || channelId),
      channel_type: channelType,
      position: toNumber(channel?.position) || 0
    });
  }

  for (const channel of [
    ...(Array.isArray(guildChannels) ? guildChannels : []),
    ...(Array.isArray(activeThreadPayload?.threads) ? activeThreadPayload.threads : [])
  ]) {
    const channelId = String(channel?.id || "").trim();
    const channelType = toNumber(channel?.type);
    if (!channelId || !messageChannelTypes.has(channelType)) continue;
    if (channelAllowlist.size && !channelAllowlist.has(channelId)) continue;

    channelsById.set(channelId, {
      channel_id: channelId,
      channel_name: String(channel?.name || channelId),
      channel_type: channelType,
      parent_id: stringOrNull(channel?.parent_id),
      position: toNumber(channel?.position) || 0,
      is_thread: [10, 11, 12].includes(channelType)
    });
  }

  const channels = [...channelsById.values()].sort((left, right) =>
    Number(left.is_thread) - Number(right.is_thread)
    || left.position - right.position
    || left.channel_name.localeCompare(right.channel_name)
    || compareDiscordSnowflakes(left.channel_id, right.channel_id)
  );

  return json({
    ok: true,
    guild_id: guildId,
    channel_allowlist_active: channelAllowlist.size > 0,
    channel_count: channels.length,
    channels,
    archive_parent_channels: archiveParentChannels
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function handleCwBotHistoryArchivedThreads(request, env) {
  if (String(env.CW_BOT_IMPORT_ENABLED || "false").toLowerCase() !== "true") {
    throw httpError(403, "CW-Bot imports are not enabled. Set CW_BOT_IMPORT_ENABLED=true on the Worker.");
  }

  requireAdmin(request, env);
  const body = await readJsonRequest(request);
  const guildId = String(body.guild_id || "").trim();
  const parentChannelId = String(body.parent_channel_id || "").trim();
  const before = String(body.before || "").trim();

  if (!/^\d+$/.test(guildId)) throw httpError(400, "guild_id must be a Discord snowflake.");
  if (!/^\d+$/.test(parentChannelId)) {
    throw httpError(400, "parent_channel_id must be a Discord snowflake.");
  }
  validateCwBotImportGuild(guildId, env);

  const channelAllowlist = csvSet(env.CW_BOT_IMPORT_CHANNEL_IDS);
  if (channelAllowlist.size && !channelAllowlist.has(parentChannelId)) {
    throw httpError(403, "That Discord channel is not allowed for CW-Bot imports.");
  }

  const parent = await fetchDiscordChannel(env, parentChannelId);
  if (String(parent?.guild_id || "") !== guildId) {
    throw httpError(400, "The supplied parent channel does not belong to that Discord server.");
  }

  const payload = await fetchDiscordPublicArchivedThreads(env, parentChannelId, {
    before,
    limit: 100
  });
  const channels = (Array.isArray(payload?.threads) ? payload.threads : []).map(channel => ({
    channel_id: String(channel?.id || ""),
    channel_name: String(channel?.name || channel?.id || "archived-thread"),
    channel_type: toNumber(channel?.type),
    parent_id: String(channel?.parent_id || parentChannelId),
    position: 0,
    is_thread: true,
    is_archived: true,
    archive_timestamp: safeIso(channel?.thread_metadata?.archive_timestamp) || null
  })).filter(channel => /^\d+$/.test(channel.channel_id));
  const nextBefore = channels.length
    ? channels[channels.length - 1].archive_timestamp
    : null;

  return json({
    ok: true,
    guild_id: guildId,
    parent_channel_id: parentChannelId,
    has_more: Boolean(payload?.has_more && nextBefore),
    next_before: nextBefore,
    channel_count: channels.length,
    channels
  }, 200, {
    "Cache-Control": "no-store"
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
  const [trackedKeys, existingRowsByKey] = await Promise.all([
    trackedHistoryBattleKeySet(env, userId),
    preventOverwrite ? externalHistoryBattleRowMap(env, userId, "big_bot") : Promise.resolve(new Map())
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
  const backfills = [];
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

    const finalRank = toNumber(parsedRow.final_rank ?? parsedRow.clan_rank ?? parsedRow.member_rank ?? parsedRow.rank);
    const clanRank = toNumber(parsedRow.clan_rank ?? parsedRow.member_rank ?? parsedRow.final_rank ?? parsedRow.rank);
    const globalRank = toNumber(parsedRow.global_rank ?? parsedRow.g_rank ?? parsedRow.final_global_rank);
    const totalGlobalPlayers = toNumber(parsedRow.total_global_players ?? parsedRow.global_total);
    const finalPoints = parseCwBotNumber(parsedRow.final_points ?? parsedRow.points);

    if (finalRank === null && clanRank === null && globalRank === null && finalPoints === null) {
      skipped.push({ reason: "missing_rank_and_points", battle_name: battleName, battle_key: battleKeyValue });
      continue;
    }

    const row = {
      source: "big_bot",
      user_id: userId,
      username: stringOrNull(parsed.player_name || username),
      battle_key: battleKeyValue,
      battle_name: battleName,
      clan_name: stringOrNull(parsedRow.clan_name || parsedRow.clan || parsed.current_clan),
      final_rank: finalRank,
      total_ranked: null,
      clan_rank: clanRank,
      total_clan_members: null,
      global_rank: globalRank,
      total_global_players: totalGlobalPlayers,
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
        already_tracked: trackedKeys.has(battleKeyValue),
        parsed_row: parsedRow
      },
      raw_fingerprint: `${rawFingerprintBase}:${battleKeyValue}`,
      updated_at: importedAt
    };

    if (preventOverwrite) {
      const existingRow = existingRowsByKey.get(battleKeyValue);
      if (existingRow) {
        const patch = externalHistoryBackfillPatch(existingRow, row);
        if (patch) {
          backfills.push({ existing: existingRow, patch });
        } else {
          skipped.push({ reason: "already_imported_complete", battle_name: battleName, battle_key: battleKeyValue });
        }
        queuedKeys.add(battleKeyValue);
        continue;
      }
    }

    rows.push(row);
    queuedKeys.add(battleKeyValue);
  }

  if (rows.length) {
    await supabaseUpsertChunked(env, EXTERNAL_PLAYER_HISTORY_TABLE, rows, "source,user_id,battle_key", 100);
  }

  const backfilledRows = [];
  for (const item of backfills) {
    await supabasePatch(env, EXTERNAL_PLAYER_HISTORY_TABLE, {
      source: `eq.${item.existing.source || "big_bot"}`,
      user_id: `eq.${userId}`,
      battle_key: `eq.${item.existing.battle_key}`
    }, item.patch);
    backfilledRows.push({ ...item.existing, ...item.patch });
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
    backfilled_count: backfilledRows.length,
    skipped_count: skipped.length,
    rows: rows.concat(backfilledRows).map(normalizeExternalHistoryOutput),
    skipped
  });
}

async function searchGlobalRankCandidates(env, clan, query, battleKeyValue = null, options = {}) {
  const run = await findLatestGlobalRankSearchRun(env, clan, battleKeyValue);

  if (!run?.run_key) {
    return {
      ok: false,
      message: "No completed global rank scan is available yet.",
      query,
      clan_name: clan
    };
  }

  const lookup = await resolveGlobalSearchIdentity(query, env, {
    clan,
    runKey: run.run_key
  });
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
      message: `No player matched "${query}" in the latest scanned global pool.`,
      query,
      clan_name: clan,
      resolved_user: lookup,
      run
    };
  }

  const userId = toNumber(candidate.user_id);
  const snapshotAt = candidate.fetched_at || run.finished_at || run.updated_at || run.started_at || null;
  const [globalRank, memberRank, avatarMap, gainMaps] = await Promise.all([
    resolveGlobalCandidateRank(env, run.run_key, candidate),
    resolveGlobalCandidateMemberRank(env, run.run_key, candidate),
    resolveRobloxAvatarHeadshots([userId], env).catch(() => new Map()),
    buildGlobalLeaderboardGainMaps(env, {
      clan,
      battleKey: run.battle_key,
      snapshotAt,
      userIds: [userId]
    }).catch(() => ({}))
  ]);
  const total = toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    await countGlobalRankCandidates(env, run.run_key);

  const username = lookup.username || (await resolveRobloxUsernames([userId], env)
    .then(map => map.get(userId))
    .catch(() => `user_${userId}`));

  const row = normalizeGlobalCandidateSearchOutput(candidate, {
    run,
    globalRank,
    memberRank,
    totalGlobalPlayers: total,
    username,
    displayName: lookup.display_name,
    avatarUrl: avatarMap.get(String(userId)) || avatarMap.get(userId) || null,
    gainMaps
  });
  const leaderboardName = globalRankLeaderboardLabel(env, run);
  row.leaderboard_name = leaderboardName;
  row.event_name = leaderboardName;
  const history = await searchGlobalRankCandidateHistory(env, clan, userId, row, {
    historyHours: options.historyHours,
    historyLimit: options.historyLimit,
    anchor: row.fetched_at || run.finished_at || run.updated_at || run.started_at || Date.now()
  });

  return {
    ok: true,
    query,
    clan_name: clan,
    run: { ...run, leaderboard_name: leaderboardName, event_name: leaderboardName },
    row,
    history
  };
}

async function searchGlobalRankCandidateHistory(env, clan, userId, currentRow = null, options = {}) {
  const limit = globalRankCandidateHistoryLimit(env, options.historyLimit);
  const hours = globalSearchHistoryHours(env, options.historyHours);
  const sinceIso = globalSearchHistorySinceIso(
    options.anchor || currentRow?.fetched_at || currentRow?.updated_at || Date.now(),
    hours
  );
  const runs = (await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
    select: "run_key,battle_key,battle_display_name,event_name,finished_at,updated_at,started_at,total_global_players,candidate_player_count,scan_limit,scanned_count,scanned_clan_count,clan_member_count,found_member_count,stop_reason,status",
    clan_name: `eq.${clan}`,
    status: "in.(ok,completed)",
    finished_at: `gte.${sinceIso}`,
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
      fetched_at: `gte.${sinceIso}`,
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

      return {
        ...row,
        global_rank: await resolveGlobalCandidateRank(env, row.run_key, {
          user_id: userIdValue,
          points
        })
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

async function resolveGlobalCandidateRank(env, runKey, row) {
  const points = toNumber(row?.points);
  const userId = toNumber(row?.user_id);
  if (!runKey || points === null || !userId) return null;

  const cacheMeta = {
    clan_name: "global-rank",
    battle_key: String(runKey),
    snapshot_id: `${runKey}:${userId}:${points}`
  };
  const cached = await readDerivedSnapshotCache(env, "global-candidate-rank-v1", cacheMeta);
  const cachedRank = toNumber(cached?.rank);
  if (cachedRank !== null) return cachedRank;

  const [higherCount, tiedBeforeCount] = await Promise.all([
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${runKey}`,
      points: `gt.${points}`
    }),
    supabaseCount(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      run_key: `eq.${runKey}`,
      points: `eq.${points}`,
      user_id: `lt.${userId}`
    })
  ]);
  const rank = higherCount + tiedBeforeCount + 1;

  await writeDerivedSnapshotCache(env, "global-candidate-rank-v1", cacheMeta, { rank });
  return rank;
}

async function resolveGlobalCandidateMemberRank(env, runKey, row) {
  const points = toNumber(row?.points);
  const userId = toNumber(row?.user_id);
  const sourceClan = String(row?.source_clan || "").trim();
  if (!runKey || points === null || !userId || !sourceClan) return null;

  const cacheMeta = {
    clan_name: sourceClan,
    battle_key: String(runKey),
    snapshot_id: `${runKey}:${sourceClan}:${userId}:${points}`
  };
  const cached = await readDerivedSnapshotCache(env, "global-candidate-member-rank-v1", cacheMeta);
  const cachedRank = toNumber(cached?.rank);
  if (cachedRank !== null) return cachedRank;

  const [higherCount, tiedBeforeCount] = await Promise.all([
    countHigherSourceClanMembers(env, runKey, row),
    countTiedBeforeSourceClanMembers(env, runKey, row)
  ]);
  const rank = higherCount + tiedBeforeCount + 1;

  await writeDerivedSnapshotCache(env, "global-candidate-member-rank-v1", cacheMeta, { rank });
  return rank;
}

async function handleGlobalRankIngest(env, source, requestedClan, force = false, options = {}) {
  if (globalRankShardCount(env) > 1) {
    return handleGlobalRankShardedIngest(env, source, requestedClan, force, options);
  }

  return handleGlobalRankLinearIngest(env, source, requestedClan, force, options);
}

async function handleGlobalRankLinearIngest(env, source, requestedClan, force = false, options = {}) {
  requireSupabase(env);

  const runOptions = normalizeIngestRunOptions(options);
  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const fetchedAt = runOptions.fetchedAt;
  const clanScanLimit = globalRankClanScanLimit(env);
  const pageSize = globalRankClanPageSize(env);
  const clansPerRun = globalRankClansPerRun(env);
  const currentRows = await fetchCurrentRows(env, clan);

  if (!currentRows.length) {
    throw httpError(409, `No current ${clan} member rows found. Run /api/ingest first.`);
  }

  const latest = latestMetaFromRows(currentRows);
  const configuredBattleKey = latest?.battle_key || battleKey(env);
  const activeBattleMeta = runOptions.activeBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null);
  const eventName = globalRankEventName(env, latest);
  const battleDisplayName = cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name);
  const battleMeta = mergeBattleMeta({
    displayName: battleDisplayName,
    startedAt: latest?.battle_started_at || null,
    endedAt: latest?.battle_ended_at || null
  }, activeBattleMeta, latest?.battle_key, { allowMismatch: true });
  const ingestGate = battleIngestGate({
    activeBattleMeta,
    battleMeta,
    battleKey: latest?.battle_key || configuredBattleKey,
    env,
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
  });

  if (!ingestGate.allowed) {
    return skippedIngestResponse({
      scope: "global-ranks",
      source,
      clan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey: latest?.battle_key || configuredBattleKey,
      battleMeta,
      gate: ingestGate
    });
  }

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
      assertBattleIngestStillOpen({
        activeBattleMeta,
        battleMeta,
        battleKey: latest?.battle_key || configuredBattleKey,
        env,
        force,
        scheduledAt: runOptions.scheduledAt
      });

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
        assertBattleIngestStillOpen({
          activeBattleMeta,
          battleMeta,
          battleKey: latest?.battle_key || configuredBattleKey,
          env,
          force,
          scheduledAt: runOptions.scheduledAt
        });

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
      const publishCurrent = isSnapshotAtOrBeforeEventEnd(startedAt, battleMeta.endedAt) &&
        await shouldPublishGlobalRankCurrent(env, {
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

async function handleGlobalRankShardedIngest(env, source, requestedClan, force = false, options = {}) {
  requireSupabase(env);

  const runOptions = normalizeIngestRunOptions(options);
  const clan = String(requestedClan || clanName(env)).trim() || clanName(env);
  const fetchedAt = runOptions.fetchedAt;
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
  const activeBattleMeta = runOptions.activeBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null);
  const eventName = globalRankEventName(env, latest);
  const battleDisplayName = cleanBattleDisplayName(latest?.battle_key, latest?.battle_display_name);
  const battleMeta = mergeBattleMeta({
    displayName: battleDisplayName,
    startedAt: latest?.battle_started_at || null,
    endedAt: latest?.battle_ended_at || null
  }, activeBattleMeta, latest?.battle_key, { allowMismatch: true });
  const ingestGate = battleIngestGate({
    activeBattleMeta,
    battleMeta,
    battleKey: latest?.battle_key || configuredBattleKey,
    env,
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
  });

  if (!ingestGate.allowed) {
    return skippedIngestResponse({
      scope: "global-ranks",
      source,
      clan,
      fetchedAt,
      configuredBattleKey,
      resolvedBattleKey: latest?.battle_key || configuredBattleKey,
      battleMeta,
      gate: ingestGate
    });
  }

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
      leaderboardPageCache,
      ingestGateContext: {
        activeBattleMeta,
        battleMeta,
        battleKey: latest?.battle_key || configuredBattleKey,
        env,
        force,
        scheduledAt: runOptions.scheduledAt
      }
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
      const publishCurrent = isSnapshotAtOrBeforeEventEnd(startedAt, battleMeta.endedAt) &&
        await shouldPublishGlobalRankCurrent(env, {
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
  const allClans = ["1", "true", "yes"].includes(String(url.searchParams.get("all_clans") || "").toLowerCase());
  const clan = allClans ? null : (url.searchParams.get("clan") || clanName(env));
  const allBattles = ["1", "true", "yes"].includes(String(url.searchParams.get("all_battles") || "").toLowerCase());
  const includeArchive = !["0", "false", "no", "off"].includes(String(url.searchParams.get("include_archive") || "true").toLowerCase());
  const battle = allBattles ? null : (url.searchParams.get("battle") || battleKey(env));
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
    fetched_at: `gte.${afterIso}`,
    order: `fetched_at.${orderDir},rank.asc`,
    limit: String(limit),
    offset: String(offset)
  };

  if (clan) {
    params.clan_name = `eq.${clan}`;
  }

  if (userId) {
    params.user_id = `eq.${userId}`;
  }
  if (battle) {
    params.battle_key = `eq.${battle}`;
  }

  let rows;
  let archiveRows = [];
  if (includeArchive) {
    const baseParams = { ...params, offset: "0", limit: String(limit + offset) };
    const [liveRows, archived] = await Promise.all([
      supabaseSelectPaged(env, SNAPSHOT_TABLE, baseParams, limit + offset, 1000),
      supabaseSelectPaged(env, SNAPSHOT_ARCHIVE_TABLE, baseParams, limit + offset, 1000).catch(err => {
        const message = String(err?.message || "");
        if (message.includes(SNAPSHOT_ARCHIVE_TABLE) || message.includes("404") || message.includes("42P01")) return [];
        throw err;
      })
    ]);
    archiveRows = archived;
    rows = [...liveRows, ...archiveRows]
      .sort((a, b) => compareHistorySnapshotRows(a, b, orderDir))
      .slice(offset, offset + limit);
  } else {
    rows = await supabaseSelectPaged(env, SNAPSHOT_TABLE, params, limit, 1000);
  }

  return cacheJson({
    generated_at: new Date().toISOString(),
    clan_name: clan,
    all_clans: allClans,
    battle,
    all_battles: allBattles,
    include_archive: includeArchive,
    archive_row_count: archiveRows.length,
    hours,
    limit,
    offset,
    has_more: rows.length === limit,
    rows
  }, env);
}

function compareHistorySnapshotRows(a, b, orderDir = "desc") {
  const aMs = Date.parse(a?.fetched_at || "") || 0;
  const bMs = Date.parse(b?.fetched_at || "") || 0;
  if (aMs !== bMs) return orderDir === "asc" ? aMs - bMs : bMs - aMs;
  const aRank = toNumber(a?.rank) ?? Number.MAX_SAFE_INTEGER;
  const bRank = toNumber(b?.rank) ?? Number.MAX_SAFE_INTEGER;
  if (aRank !== bRank) return aRank - bRank;
  return (toNumber(a?.user_id) ?? 0) - (toNumber(b?.user_id) ?? 0);
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

async function handleClansIngest(env, source, force = false, options = {}) {
  requireSupabase(env);

  const runOptions = normalizeIngestRunOptions(options);
  const fetchedAt = runOptions.fetchedAt;
  const trackedClan = clanName(env);
  const configuredBattleKey = battleKey(env);
  const activeBattleMeta = runOptions.activeBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeGate = battleIngestGate({
    activeBattleMeta,
    battleMeta: activeBattleMeta,
    battleKey: activeBattleMeta?.battleKey || configuredBattleKey,
    env,
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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

  let recentGuardBattleKey = activeBattleMeta?.battleKey || null;
  if (recentGuardBattleKey) {
    const recentGate = await clansSnapshotRecentGate(env, recentGuardBattleKey, fetchedAt, force);
    if (!recentGate.allowed) {
      return skippedIngestResponse({
        scope: "clans",
        source,
        clan: trackedClan,
        fetchedAt,
        configuredBattleKey,
        resolvedBattleKey: recentGuardBattleKey,
        battleMeta: activeBattleMeta,
        gate: recentGate
      });
    }
  }

  const api = await fetchClanApi(trackedClan);
  const battles = api.data?.Battles || {};
  const resolvedBattleKey = resolveAuthoritativeBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
  const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;

  if (!battle) {
    const available = Object.keys(battles);
    throw httpError(
      409,
      `The active battle ${activeBattleMeta?.battleKey || configuredBattleKey} is not available in ${trackedClan}'s Battles data yet. Available battles: ${available.join(", ") || "none"}`
    );
  }

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
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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

  if (normalizeText(recentGuardBattleKey) !== normalizeText(resolvedBattleKey)) {
    const recentGate = await clansSnapshotRecentGate(env, resolvedBattleKey, fetchedAt, force);
    if (!recentGate.allowed) {
      return skippedIngestResponse({
        scope: "clans",
        source,
        clan: trackedClan,
        fetchedAt,
        configuredBattleKey,
        resolvedBattleKey,
        battleMeta,
        gate: recentGate
      });
    }
    recentGuardBattleKey = resolvedBattleKey;
  }

  const clans = await fetchTopClans(env);
  const snapshotId = `clans:${resolvedBattleKey}:${fetchedAt}`;
  const storedSource = battleCollectionSource(source, ingestGate);

  const rows = clans.map(row => ({
    snapshot_id: snapshotId,
    fetched_at: fetchedAt,
    source: storedSource,
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
  const publishCurrent = isSnapshotAtOrBeforeEventEnd(fetchedAt, battleMeta.endedAt);

  if (rows.length) {
    await supabaseInsert(env, CLANS_SNAPSHOT_TABLE, rows);
    if (publishCurrent) {
      await replaceCurrentRows(env, CLANS_CURRENT_TABLE, {
        snapshot_id: "not.is.null"
      }, rows.map(row => ({
        ...row,
        updated_at: fetchedAt
      })));
    }
  }

  await pruneOldTableRows(env, CLANS_SNAPSHOT_TABLE, fetchedAt);
  const existingBattleRun = publishCurrent
    ? null
    : await fetchBattleRun(env, CLANS_BATTLE_RUN_CLAN_NAME, resolvedBattleKey).catch(() => null);
  await upsertBattleRun(env, {
    clan_name: CLANS_BATTLE_RUN_CLAN_NAME,
    battle_key: resolvedBattleKey,
    battle_display_name: battleMeta.displayName,
    battle_started_at: battleMeta.startedAt,
    battle_ended_at: battleMeta.endedAt,
    last_seen_at: fetchedAt,
    latest_snapshot_id: publishCurrent ? snapshotId : existingBattleRun?.latest_snapshot_id || null,
    latest_snapshot_at: publishCurrent ? fetchedAt : existingBattleRun?.latest_snapshot_at || null,
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
    source: storedSource,
    collection_phase: ingestGate.collection_phase || "active_event",
    in_grace_period: ingestGate.in_grace_period === true,
    published_current: publishCurrent,
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
  const limit = String(clamp(Number(url.searchParams.get("limit") || env.CLAN_RANK_TOP_N || 100), 1, 500));

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
    if (latest && !isSnapshotAtOrBeforeEventEnd(latest.fetched_at, latest.battle_ended_at)) {
      const canonicalLatest = await fetchLatestClanSnapshotMeta(env, latest.battle_key);
      if (canonicalLatest) {
        latest = canonicalLatest;
        rows = await fetchClanSnapshotRows(env, canonicalLatest.snapshot_id, limit);
      }
    }
  }

  const activeBattleMeta = latest && !explicitBattle
    ? await fetchActiveClanBattleMeta(env).catch(() => null)
    : null;
  const currentBattleMismatch = Boolean(
    !explicitBattle &&
    latest?.battle_key &&
    activeBattleMeta?.battleKey &&
    normalizeText(latest.battle_key) !== normalizeText(activeBattleMeta.battleKey)
  );

  if (currentBattleMismatch) {
    return noStoreJson({
      generated_at: new Date().toISOString(),
      snapshot_at: null,
      battle: activeBattleMeta.battleKey,
      display_name: cleanBattleDisplayName(
        activeBattleMeta.battleKey,
        activeBattleMeta.displayName
      ),
      battle_start_iso: activeBattleMeta.startedAt || null,
      battle_end_iso: activeBattleMeta.endedAt || null,
      clan_name: clanName(env),
      clan_rank: null,
      clan_points: null,
      projected_rank: null,
      projected_points: null,
      projection_basis: null,
      waiting_for_first_snapshot: true,
      stale_battle_key: latest.battle_key,
      rows: []
    });
  }

  const latestWithActiveMeta = mergeLatestMeta(latest, activeBattleMeta, { allowMismatch: false });
  const rowsWithGains = latestWithActiveMeta ? await addClanGainFields(env, rows, latestWithActiveMeta) : rows;
  const rowsWithProjections = latestWithActiveMeta ? addClanProjectionFields(rowsWithGains, latestWithActiveMeta) : rowsWithGains;
  const trackedClan = clanName(env);
  const tracked = rowsWithProjections.find(row => normalizeText(row.clan_name) === normalizeText(trackedClan));

  return noStoreJson({
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
      battle_key: row.battle_key || latestWithActiveMeta?.battle_key || null,
      battle_display_name: row.battle_display_name || latestWithActiveMeta?.battle_display_name || null,
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
  });
}

async function handleClansCompare(request, env) {
  const url = new URL(request.url);
  const clan = String(url.searchParams.get("clan") || "").trim();
  if (!clan) throw httpError(400, "Missing required clan.");

  const currentUrl = new URL(request.url);
  currentUrl.pathname = "/api/clans/current";
  currentUrl.searchParams.set("limit", String(clamp(Number(url.searchParams.get("limit") || 500), 3, 500)));
  currentUrl.searchParams.delete("clan");
  const currentResponse = await handleClansCurrent(new Request(currentUrl.toString(), {
    method: "GET",
    headers: { Accept: "application/json" }
  }), env);
  const current = await currentResponse.json().catch(() => ({}));
  if (!currentResponse.ok) {
    throw httpError(currentResponse.status || 502, current.message || "Clan leaderboard lookup failed.");
  }

  return noStoreJson(buildClanComparisonPayload(current, clan));
}

function buildClanComparisonPayload(current, requestedClan, now = Date.now()) {
  const rows = (Array.isArray(current?.rows) ? current.rows : [])
    .map(normalizeClanCompareRow)
    .filter(row => row.clan_name && row.rank)
    .sort((a, b) => a.rank - b.rank || b.points - a.points);
  const clanKey = normalizeText(requestedClan);
  const clan = rows.find(row => normalizeText(row.clan_name) === clanKey) || null;

  if (!clan) {
    throw httpError(
      404,
      `Clan ${requestedClan} was not found in the latest ${rows.length || "stored"} leaderboard rows.`
    );
  }

  const above = rows
    .filter(row => row.rank < clan.rank)
    .sort((a, b) => b.rank - a.rank)[0] || null;
  const below = rows
    .filter(row => row.rank > clan.rank)
    .sort((a, b) => a.rank - b.rank)[0] || null;
  const snapshotAt = current?.snapshot_at || clan.fetched_at || current?.generated_at || new Date(now).toISOString();
  const battleEndAt = current?.battle_end_iso || null;
  const snapshotMs = new Date(snapshotAt || 0).getTime();
  const nowMs = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const battleEndMs = new Date(battleEndAt || 0).getTime();
  const battleRemainingHours = Number.isFinite(battleEndMs) && battleEndMs > 0
    ? Math.max(0, (battleEndMs - (Number.isFinite(snapshotMs) ? snapshotMs : nowMs)) / 3600000)
    : null;

  return {
    ok: true,
    generated_at: new Date(nowMs).toISOString(),
    snapshot_at: snapshotAt,
    data_age_minutes: Number.isFinite(snapshotMs)
      ? Math.max(0, Math.round((nowMs - snapshotMs) / 60000))
      : null,
    battle: current?.battle || clan.battle_key || null,
    display_name: current?.display_name || clan.battle_display_name || current?.battle || null,
    battle_start_iso: current?.battle_start_iso || null,
    battle_end_iso: battleEndAt,
    battle_remaining_hours: battleRemainingHours,
    available_rank_min: rows[0]?.rank || null,
    available_rank_max: rows[rows.length - 1]?.rank || null,
    above,
    clan,
    below,
    race_to_above: above ? clanComparisonRace(clan, above, snapshotAt, battleEndAt) : null,
    threat_from_below: below ? clanComparisonRace(below, clan, snapshotAt, battleEndAt) : null
  };
}

function normalizeClanCompareRow(row) {
  const rate = toNumber(row?.rate_per_hour);
  const derivedRate = rate === null ? chooseClanProjectionRate(row || {}) : null;
  return {
    rank: toNumber(row?.rank),
    clan_name: String(row?.clan_name || "").trim(),
    points: toNumber(row?.points) || 0,
    icon_id: row?.icon_id || null,
    icon_url: row?.icon_url || null,
    fetched_at: row?.fetched_at || null,
    battle_key: row?.battle_key || null,
    battle_display_name: row?.battle_display_name || null,
    gain_5m: toNumber(row?.gain_5m),
    gain_1h: toNumber(row?.gain_1h),
    gain_12h: toNumber(row?.gain_12h),
    gain_24h: toNumber(row?.gain_24h),
    rate_per_hour: Math.max(0, rate ?? derivedRate?.rate_per_hour ?? 0),
    rate_basis: row?.projection_basis || derivedRate?.basis || "none",
    projected_points: toNumber(row?.projected_points),
    projected_rank: toNumber(row?.projected_rank)
  };
}

function clanComparisonRace(pursuer, target, snapshotAt, battleEndAt) {
  const gapPoints = Math.max(0, (toNumber(target?.points) || 0) - (toNumber(pursuer?.points) || 0));
  const pointsNeeded = gapPoints + 1;
  const pursuerRate = Math.max(0, toNumber(pursuer?.rate_per_hour) || 0);
  const targetRate = Math.max(0, toNumber(target?.rate_per_hour) || 0);
  const closingRate = pursuerRate - targetRate;
  const passHours = closingRate > 0 ? pointsNeeded / closingRate : null;
  const snapshotMs = new Date(snapshotAt || 0).getTime();
  const battleEndMs = new Date(battleEndAt || 0).getTime();
  const passAtMs = passHours !== null && Number.isFinite(snapshotMs)
    ? snapshotMs + passHours * 3600000
    : null;
  const remainingHours = Number.isFinite(snapshotMs) && Number.isFinite(battleEndMs) && battleEndMs > snapshotMs
    ? (battleEndMs - snapshotMs) / 3600000
    : null;
  const minimumRateByEnd = remainingHours > 0
    ? targetRate + pointsNeeded / remainingHours
    : null;
  const pursuerProjected = toNumber(pursuer?.projected_points) ?? (
    remainingHours === null ? null : Math.round((toNumber(pursuer?.points) || 0) + pursuerRate * remainingHours)
  );
  const targetProjected = toNumber(target?.projected_points) ?? (
    remainingHours === null ? null : Math.round((toNumber(target?.points) || 0) + targetRate * remainingHours)
  );

  return {
    pursuer: pursuer?.clan_name || null,
    target: target?.clan_name || null,
    gap_points: gapPoints,
    points_needed_to_pass: pointsNeeded,
    pursuer_rate_per_hour: pursuerRate,
    target_rate_per_hour: targetRate,
    closing_rate_per_hour: closingRate,
    status: closingRate > 0
      ? "catching"
      : closingRate < 0
        ? "falling_behind"
        : "holding",
    hours_to_pass: passHours,
    estimated_pass_at: passAtMs === null ? null : new Date(passAtMs).toISOString(),
    passes_before_event_end: passAtMs === null || !Number.isFinite(battleEndMs) || battleEndMs <= 0
      ? null
      : passAtMs <= battleEndMs,
    minimum_rate_to_pass_by_end: minimumRateByEnd,
    additional_rate_needed_by_end: minimumRateByEnd === null
      ? null
      : Math.max(0, minimumRateByEnd - pursuerRate),
    projected_margin_at_end: pursuerProjected === null || targetProjected === null
      ? null
      : pursuerProjected - targetProjected
  };
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
  const includeLegacyScan = isTruthyParam(url, "include_legacy");
  const includeCounts = isTruthyParam(url, "include_counts");
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
      snapshot_count: null,
      row_count: null,
      has_rows: Boolean(row.latest_snapshot_id),
      is_active: row.is_active,
      source: "battle_runs"
    });
  }

  // Battle-run metadata is maintained during ingest. Raw history scans are
  // reserved for legacy recovery or an empty metadata table.
  if (includeLegacyScan || byBattle.size === 0) {
    const rows = await fetchClansBattleListRows(env, scanLimit);
    for (const row of rows) {
      addClansBattleSummary(byBattle, row);
    }
  }

  const summaries = [...byBattle.values()].sort((a, b) =>
    new Date(b.last_snapshot || 0) - new Date(a.last_snapshot || 0)
  );
  const rowsWithCoverage = includeCounts
    ? await addBattleRowCounts(env, summaries, CLANS_SNAPSHOT_TABLE, row => ({
      battle_key: `eq.${row.battle}`
    }))
    : await addBattleRowPresence(env, summaries, CLANS_SNAPSHOT_TABLE, row => (
      row.latest_snapshot_id
        ? { snapshot_id: `eq.${row.latest_snapshot_id}` }
        : { battle_key: `eq.${row.battle}` }
    ));

  return cacheJson({
    generated_at: new Date().toISOString(),
    metadata_source: includeLegacyScan || battleRuns.length === 0
      ? "battle_runs_and_legacy_scan"
      : "battle_runs",
    exact_counts_included: includeCounts,
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
      const resolvedBattleKey = resolveAuthoritativeBattleKey(battles, configuredBattleKey, env, activeBattleMeta?.battleKey);
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
  const runOptions = normalizeIngestRunOptions(typeof options === "object" ? options : {});
  const fetchedAt = runOptions.fetchedAt;
  const configuredBattleKey = battleKey(env);
  const trackedClan = clanName(env);
  const activeBattleMeta = runOptions.activeBattleMeta || await fetchActiveClanBattleMeta(env).catch(() => null);
  const activeGate = battleIngestGate({
    activeBattleMeta,
    battleMeta: activeBattleMeta,
    battleKey: activeBattleMeta?.battleKey || configuredBattleKey,
    env,
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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
    force,
    scheduledAt: runOptions.scheduledAt,
    now: runOptions.now
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
  // An assigned Discord clan log must not silently stop working merely
  // because that clan falls outside the generic top-clan activity window.
  // Top clans remain the normal scan set; enabled log assignments are merged
  // in as explicit targets.
  const assignedLogClans = await fetchEnabledClanActivityLogTargets(env).catch(() => []);
  const scanClans = buildClanActivityScanTargets(topClans, assignedLogClans);
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

  await runLimited(scanClans.map((clanRow, index) => ({ clanRow, index })), concurrency, async ({ clanRow, index }) => {
    if (delayMs > 0) {
      await sleep((index % concurrency) * delayMs);
    }

    try {
      assertBattleIngestStillOpen({
        activeBattleMeta,
        battleMeta,
        battleKey: resolvedBattleKey,
        env,
        force,
        scheduledAt: runOptions.scheduledAt
      });

      const api = await fetchClanApiWithRetry(env, clanRow.clan_name);
      const data = api.data || {};
      const battles = data.Battles || data.battles || {};
      const battle = resolvedBattleKey ? battles[resolvedBattleKey] : null;
      const scannedClanRow = resolveClanActivityScanClanRow(clanRow, data, battle);
      const members = battle ? normalizeMembers(data, battle) : [];
      const usernameMap = await resolveRobloxUsernames(members.map(member => member.user_id), env)
        .catch(() => new Map());
      const clanKey = normalizeText(scannedClanRow.clan_name);
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
          clanRow: scannedClanRow,
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
        clanRow: scannedClanRow,
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
        clan_name: scannedClanRow.clan_name,
        clan_key: clanKey,
        clan_rank: scannedClanRow.rank,
        previous_clan_rank: toNumber(previousSummary?.clan_rank),
        clan_points: scannedClanRow.points,
        icon_id: scannedClanRow.icon_id || null,
        icon_url: scannedClanRow.icon_url || null,
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
        raw_clan: scannedClanRow.raw_clan || {}
      });
    } catch (err) {
      if (err?.battleIngestClosed) throw err;

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
    // The global-rank pool is already collected for the public leaderboard.
    // Reuse that snapshot for joins rather than making a separate crawl.
    await attachClanActivityJoinGlobalRanks(env, eventRows, resolvedBattleKey).catch(err => {
      console.warn("Unable to attach global ranks to clan activity joins", err);
    });
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
    clans_requested: scanClans.length,
    top_clans_requested: topClans.length,
    assigned_log_clans_included: assignedLogClans.length,
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

function discordClanLogAssignmentKey(guildId, channelId, clanName) {
  const guild = String(guildId || "").trim();
  const channel = String(channelId || "").trim();
  const clan = normalizeText(clanName);
  return guild && channel && clan ? `${guild}:${channel}:clan-log:${clan}` : "";
}

async function fetchEnabledClanActivityLogTargets(env) {
  const rows = await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
    select: "clan_name,clan_key",
    enabled: "eq.true",
    order: "updated_at.desc",
    limit: "1000"
  });
  const targets = new Map();
  for (const row of rows || []) {
    const name = String(row?.clan_name || "").trim();
    const key = normalizeText(row?.clan_key || name);
    if (name && key && !targets.has(key)) targets.set(key, name);
  }
  return [...targets.values()];
}

function buildClanActivityScanTargets(topClans, assignedLogClans) {
  const targets = new Map();
  for (const clanRow of topClans || []) {
    const key = normalizeText(clanRow?.clan_name);
    if (key) targets.set(key, clanRow);
  }
  for (const clanName of assignedLogClans || []) {
    const name = String(clanName || "").trim();
    const key = normalizeText(name);
    if (!name || !key || targets.has(key)) continue;
    targets.set(key, {
      clan_name: name,
      rank: null,
      points: 0,
      icon_id: null,
      icon_url: null,
      raw_clan: {},
      activity_direct_log_target: true
    });
  }
  return [...targets.values()];
}

function resolveClanActivityScanClanRow(clanRow, clanData, battle) {
  if (!clanRow?.activity_direct_log_target) return clanRow;
  const apiRank = toNumber(firstDefined(
    battle?.Rank,
    battle?.rank,
    battle?.ClanRank,
    battle?.clanRank,
    clanData?.Rank,
    clanData?.rank,
    clanData?.ClanRank,
    clanData?.clanRank
  ));
  const apiPoints = toNumber(firstDefined(
    battle?.Points,
    battle?.points,
    battle?.Score,
    battle?.score,
    clanData?.Points,
    clanData?.points,
    clanData?.Score,
    clanData?.score
  ));
  return {
    ...clanRow,
    rank: apiRank ?? toNumber(clanRow.rank),
    points: apiPoints ?? toNumber(clanRow.points) ?? 0,
    raw_clan: clanData || clanRow.raw_clan || {}
  };
}

async function handleDiscordClanLogAssignments(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const params = {
      select: DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS,
      order: "created_at.asc",
      limit: String(clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000))
    };
    const guildId = String(url.searchParams.get("guild_id") || "").trim();
    const channelId = String(url.searchParams.get("channel_id") || "").trim();
    const clanKey = normalizeText(url.searchParams.get("clan") || "");
    const assignmentKey = String(url.searchParams.get("assignment_key") || "").trim();
    const enabled = String(url.searchParams.get("enabled") || "").trim().toLowerCase();
    if (guildId) params.guild_id = `eq.${guildId}`;
    if (channelId) params.channel_id = `eq.${channelId}`;
    if (clanKey) params.clan_key = `eq.${clanKey}`;
    if (assignmentKey) params.assignment_key = `eq.${assignmentKey}`;
    if (["1", "true", "yes"].includes(enabled)) params.enabled = "eq.true";
    if (["0", "false", "no"].includes(enabled)) params.enabled = "eq.false";

    return noStoreJson({
      ok: true,
      assignments: await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, params)
    });
  }

  const body = await request.json().catch(() => ({}));
  const assignmentKey = String(body.assignment_key || "").trim();

  if (request.method === "DELETE") {
    if (assignmentKey) {
      const assignments = await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
        select: DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS,
        assignment_key: `eq.${assignmentKey}`,
        limit: "1"
      });
      await supabaseDelete(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
        assignment_key: `eq.${assignmentKey}`
      });
      return noStoreJson({
        ok: true,
        removed: assignments.length > 0,
        removed_count: assignments.length,
        assignment: assignments[0] || null
      });
    }

    const guildId = String(body.guild_id || "").trim();
    const clanName = String(body.clan_name || "").trim();
    const clanKey = normalizeText(clanName);
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "A valid Discord guild ID is required.");
    if (!clanKey) throw httpError(400, "A clan name is required.");

    const filters = {
      guild_id: `eq.${guildId}`,
      clan_key: `eq.${clanKey}`
    };
    const assignments = await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS,
      ...filters,
      limit: "1000"
    });
    if (assignments.length) {
      await supabaseDelete(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, filters);
    }
    return noStoreJson({
      ok: true,
      removed: assignments.length > 0,
      removed_count: assignments.length,
      assignments
    });
  }

  if (request.method === "POST") {
    const guildId = String(body.guild_id || "").trim();
    const channelId = String(body.channel_id || "").trim();
    const clanName = String(body.clan_name || "").trim();
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "A valid Discord guild ID is required.");
    if (!/^\d{5,30}$/.test(channelId)) throw httpError(400, "A valid Discord channel or thread ID is required.");
    if (!clanName || clanName.length > 100) throw httpError(400, "A clan name between 1 and 100 characters is required.");

    const key = discordClanLogAssignmentKey(guildId, channelId, clanName);
    await supabaseUpsert(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, [{
      assignment_key: key,
      guild_id: guildId,
      channel_id: channelId,
      channel_type: toNumber(body.channel_type),
      clan_name: clanName,
      clan_key: normalizeText(clanName),
      assigned_by: stringOrNull(body.assigned_by),
      enabled: body.enabled !== false,
      last_event_id: stringOrNull(body.last_event_id),
      last_event_at: stringOrNull(body.last_event_at),
      last_error: null,
      updated_at: new Date().toISOString()
    }], "assignment_key");

    const rows = await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${key}`,
      limit: "1"
    });
    return noStoreJson({ ok: true, assignment: rows[0] || null });
  }

  if (!assignmentKey) throw httpError(400, "assignment_key is required.");
  const patch = { updated_at: new Date().toISOString() };
  for (const key of ["enabled", "last_event_id", "last_event_at", "last_error"]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key] === "" ? null : body[key];
  }
  await supabasePatch(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
    assignment_key: `eq.${assignmentKey}`
  }, patch);
  const rows = await supabaseSelect(env, DISCORD_CLAN_LOG_ASSIGNMENTS_TABLE, {
    select: DISCORD_CLAN_LOG_ASSIGNMENT_COLUMNS,
    assignment_key: `eq.${assignmentKey}`,
    limit: "1"
  });
  return noStoreJson({ ok: true, updated: rows.length > 0, assignment: rows[0] || null });
}

function discordClanTrackerAssignmentKey(guildId, channelId, clanName) {
  const guild = String(guildId || "").trim();
  const channel = String(channelId || "").trim();
  const clan = normalizeText(clanName);
  return guild && channel && clan ? `${guild}:${channel}:clan-tracker:${clan}` : "";
}

async function handleDiscordClanTrackerAssignments(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const params = {
      select: DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS,
      order: "created_at.asc",
      limit: String(clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000))
    };
    const guildId = String(url.searchParams.get("guild_id") || "").trim();
    const channelId = String(url.searchParams.get("channel_id") || "").trim();
    const clanKey = normalizeText(url.searchParams.get("clan") || "");
    const assignmentKey = String(url.searchParams.get("assignment_key") || "").trim();
    const enabled = String(url.searchParams.get("enabled") || "").trim().toLowerCase();
    if (guildId) params.guild_id = `eq.${guildId}`;
    if (channelId) params.channel_id = `eq.${channelId}`;
    if (clanKey) params.clan_key = `eq.${clanKey}`;
    if (assignmentKey) params.assignment_key = `eq.${assignmentKey}`;
    if (["1", "true", "yes"].includes(enabled)) params.enabled = "eq.true";
    if (["0", "false", "no"].includes(enabled)) params.enabled = "eq.false";
    return noStoreJson({
      ok: true,
      assignments: await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, params)
    });
  }

  const body = await request.json().catch(() => ({}));
  const assignmentKey = String(body.assignment_key || "").trim();

  if (request.method === "DELETE") {
    if (!assignmentKey) throw httpError(400, "assignment_key is required.");
    const assignments = await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${assignmentKey}`,
      limit: "1"
    });
    await supabaseDelete(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
      assignment_key: `eq.${assignmentKey}`
    });
    return noStoreJson({ ok: true, removed: assignments.length > 0, assignment: assignments[0] || null });
  }

  if (request.method === "POST") {
    const guildId = String(body.guild_id || "").trim();
    const channelId = String(body.channel_id || "").trim();
    const clanName = String(body.clan_name || "").trim();
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "A valid Discord guild ID is required.");
    if (!/^\d{5,30}$/.test(channelId)) throw httpError(400, "A valid Discord channel or thread ID is required.");
    if (!clanName || clanName.length > 100) throw httpError(400, "A clan name between 1 and 100 characters is required.");

    const key = discordClanTrackerAssignmentKey(guildId, channelId, clanName);
    const existing = await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${key}`,
      limit: "1"
    });
    const prior = existing[0] || null;
    await supabaseUpsert(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, [{
      assignment_key: key,
      guild_id: guildId,
      channel_id: channelId,
      channel_type: toNumber(body.channel_type),
      clan_name: clanName,
      clan_key: normalizeText(clanName),
      assigned_by: stringOrNull(body.assigned_by),
      enabled: body.enabled !== false,
      // Re-assigning the same tracker should keep editing the existing post,
      // not leave an old persistent card behind in the channel.
      message_id: stringOrNull(body.message_id) || prior?.message_id || null,
      last_updated_at: stringOrNull(body.last_updated_at) || prior?.last_updated_at || null,
      last_error: null,
      updated_at: new Date().toISOString()
    }], "assignment_key");
    const rows = await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${key}`,
      limit: "1"
    });
    return noStoreJson({ ok: true, assignment: rows[0] || null });
  }

  if (!assignmentKey) throw httpError(400, "assignment_key is required.");
  const patch = { updated_at: new Date().toISOString() };
  for (const key of ["enabled", "message_id", "last_updated_at", "last_error"]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key] === "" ? null : body[key];
  }
  await supabasePatch(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
    assignment_key: `eq.${assignmentKey}`
  }, patch);
  const rows = await supabaseSelect(env, DISCORD_CLAN_TRACKER_ASSIGNMENTS_TABLE, {
    select: DISCORD_CLAN_TRACKER_ASSIGNMENT_COLUMNS,
    assignment_key: `eq.${assignmentKey}`,
    limit: "1"
  });
  return noStoreJson({ ok: true, updated: rows.length > 0, assignment: rows[0] || null });
}

function discordClanCompareAssignmentKey(guildId, channelId, clanName) {
  const guild = String(guildId || "").trim();
  const channel = String(channelId || "").trim();
  const clan = normalizeText(clanName);
  return guild && channel && clan ? `${guild}:${channel}:clan-compare:${clan}` : "";
}

async function handleDiscordClanCompareAssignments(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);

  if (request.method === "GET") {
    const params = {
      select: DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS,
      order: "created_at.asc",
      limit: String(clamp(Number(url.searchParams.get("limit") || 1000), 1, 1000))
    };
    const guildId = String(url.searchParams.get("guild_id") || "").trim();
    const channelId = String(url.searchParams.get("channel_id") || "").trim();
    const clanKey = normalizeText(url.searchParams.get("clan") || "");
    const assignmentKey = String(url.searchParams.get("assignment_key") || "").trim();
    const enabled = String(url.searchParams.get("enabled") || "").trim().toLowerCase();
    if (guildId) params.guild_id = `eq.${guildId}`;
    if (channelId) params.channel_id = `eq.${channelId}`;
    if (clanKey) params.clan_key = `eq.${clanKey}`;
    if (assignmentKey) params.assignment_key = `eq.${assignmentKey}`;
    if (["1", "true", "yes"].includes(enabled)) params.enabled = "eq.true";
    if (["0", "false", "no"].includes(enabled)) params.enabled = "eq.false";
    return noStoreJson({
      ok: true,
      assignments: await supabaseSelect(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, params)
    });
  }

  const body = await request.json().catch(() => ({}));
  const assignmentKey = String(body.assignment_key || "").trim();

  if (request.method === "DELETE") {
    if (!assignmentKey) throw httpError(400, "assignment_key is required.");
    const assignments = await supabaseSelect(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${assignmentKey}`,
      limit: "1"
    });
    await supabaseDelete(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
      assignment_key: `eq.${assignmentKey}`
    });
    return noStoreJson({ ok: true, removed: assignments.length > 0, assignment: assignments[0] || null });
  }

  if (request.method === "POST") {
    const guildId = String(body.guild_id || "").trim();
    const channelId = String(body.channel_id || "").trim();
    const clanNameValue = String(body.clan_name || "").trim();
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "A valid Discord guild ID is required.");
    if (!/^\d{5,30}$/.test(channelId)) throw httpError(400, "A valid Discord channel or thread ID is required.");
    if (!clanNameValue || clanNameValue.length > 100) throw httpError(400, "A clan name between 1 and 100 characters is required.");

    const key = discordClanCompareAssignmentKey(guildId, channelId, clanNameValue);
    const existing = await supabaseSelect(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${key}`,
      limit: "1"
    });
    const prior = existing[0] || null;
    await supabaseUpsert(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, [{
      assignment_key: key,
      guild_id: guildId,
      channel_id: channelId,
      channel_type: toNumber(body.channel_type),
      clan_name: clanNameValue,
      clan_key: normalizeText(clanNameValue),
      assigned_by: stringOrNull(body.assigned_by),
      enabled: body.enabled !== false,
      message_id: stringOrNull(body.message_id) || prior?.message_id || null,
      last_updated_at: stringOrNull(body.last_updated_at) || prior?.last_updated_at || null,
      last_error: null,
      updated_at: new Date().toISOString()
    }], "assignment_key");
    const rows = await supabaseSelect(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
      select: DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS,
      assignment_key: `eq.${key}`,
      limit: "1"
    });
    return noStoreJson({ ok: true, assignment: rows[0] || null });
  }

  if (!assignmentKey) throw httpError(400, "assignment_key is required.");
  const patch = { updated_at: new Date().toISOString() };
  for (const key of ["enabled", "message_id", "last_updated_at", "last_error"]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key] === "" ? null : body[key];
  }
  await supabasePatch(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
    assignment_key: `eq.${assignmentKey}`
  }, patch);
  const rows = await supabaseSelect(env, DISCORD_CLAN_COMPARE_ASSIGNMENTS_TABLE, {
    select: DISCORD_CLAN_COMPARE_ASSIGNMENT_COLUMNS,
    assignment_key: `eq.${assignmentKey}`,
    limit: "1"
  });
  return noStoreJson({ ok: true, updated: rows.length > 0, assignment: rows[0] || null });
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
    "diamond_donation",
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

async function handleOfflinePingConfig(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const guildId = String(url.searchParams.get("guild_id") || "").trim();

  if (request.method === "GET") {
    const params = {
      select: "*",
      order: "updated_at.desc",
      limit: String(clamp(Number(url.searchParams.get("limit") || 100), 1, 1000))
    };
    if (guildId) params.guild_id = `eq.${guildId}`;
    const configs = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, params);
    return noStoreJson({
      ok: true,
      generated_at: new Date().toISOString(),
      configs: configs.map(normalizeOfflinePingConfigOutput)
    });
  }

  const body = await request.json().catch(() => ({}));
  const requestedGuildId = String(body.guild_id || guildId || "").trim();
  if (!/^\d{5,30}$/.test(requestedGuildId)) throw httpError(400, "Missing or invalid guild_id.");
  const rawDestinationScope = body.destination_scope ?? body.channel_scope ?? body.scope;
  const destinationScope = normalizeOfflinePingDestinationScope(rawDestinationScope);
  if (rawDestinationScope !== undefined && !destinationScope) {
    throw httpError(400, "Invalid offline destination scope. Use clan, league, or users.");
  }

  const patch = {
    guild_id: requestedGuildId,
    updated_at: new Date().toISOString()
  };
  if (destinationScope && body.channel_id !== undefined) {
    if (destinationScope === "clan") patch.clan_channel_id = stringOrNull(body.channel_id);
    if (destinationScope === "league") patch.league_channel_id = stringOrNull(body.channel_id);
    if (destinationScope === "users") patch.users_channel_id = stringOrNull(body.channel_id);
  } else if (body.channel_id !== undefined) {
    patch.channel_id = stringOrNull(body.channel_id);
    patch.clan_channel_id = stringOrNull(body.channel_id);
    patch.league_channel_id = stringOrNull(body.channel_id);
    patch.users_channel_id = stringOrNull(body.channel_id);
  }
  if (destinationScope && body.channel_type !== undefined) {
    if (destinationScope === "clan") patch.clan_channel_type = toNumber(body.channel_type);
    if (destinationScope === "league") patch.league_channel_type = toNumber(body.channel_type);
    if (destinationScope === "users") patch.users_channel_type = toNumber(body.channel_type);
  } else if (body.channel_type !== undefined) {
    patch.channel_type = toNumber(body.channel_type);
    patch.clan_channel_type = toNumber(body.channel_type);
    patch.league_channel_type = toNumber(body.channel_type);
    patch.users_channel_type = toNumber(body.channel_type);
  }
  if (body.minutes_threshold !== undefined || body.minutes !== undefined) {
    patch.minutes_threshold = clamp(Number(body.minutes_threshold ?? body.minutes), 1, 1440);
  }
  if (body.post_rate_minutes !== undefined || body.post_rate !== undefined) {
    patch.post_rate_minutes = clamp(Number(body.post_rate_minutes ?? body.post_rate), 1, 1440);
  }
  if (body.enabled !== undefined) patch.enabled = parseBooleanish(body.enabled) !== false;
  if (body.clan_watches_enabled !== undefined || body.clans_enabled !== undefined) {
    patch.clan_watches_enabled = parseBooleanish(body.clan_watches_enabled ?? body.clans_enabled) !== false;
  }
  if (body.league_watches_enabled !== undefined || body.leagues_enabled !== undefined) {
    patch.league_watches_enabled = parseBooleanish(body.league_watches_enabled ?? body.leagues_enabled) !== false;
  }
  if (body.user_watches_enabled !== undefined || body.users_enabled !== undefined) {
    patch.user_watches_enabled = parseBooleanish(body.user_watches_enabled ?? body.users_enabled) !== false;
  }
  if (body.assigned_by !== undefined) patch.assigned_by = stringOrNull(body.assigned_by);
  if (body.updated_by !== undefined) patch.updated_by = stringOrNull(body.updated_by);
  if (request.method === "POST") patch.created_at = patch.updated_at;

  const alertStateResetRequested = patch.minutes_threshold !== undefined || patch.enabled === false;

  await supabaseUpsert(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, [patch], "guild_id");
  if (alertStateResetRequested) {
    await resetOfflinePingAlertStateForGuild(env, requestedGuildId);
  }
  const rows = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, {
    select: "*",
    guild_id: `eq.${requestedGuildId}`,
    limit: "1"
  });

  return noStoreJson({
    ok: true,
    config: normalizeOfflinePingConfigOutput(rows[0] || patch),
    alert_state_reset: alertStateResetRequested
  });
}

async function handleOfflinePingClans(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const guildId = String(url.searchParams.get("guild_id") || "").trim();

  if (request.method === "GET") {
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "Missing or invalid guild_id.");
    const rows = await supabaseSelect(env, DISCORD_OFFLINE_PING_CLANS_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "clan_name.asc",
      limit: "1000"
    });
    return noStoreJson({
      ok: true,
      guild_id: guildId,
      clans: rows.map(normalizeOfflinePingClanOutput)
    });
  }

  const body = await request.json().catch(() => ({}));
  const requestedGuildId = String(body.guild_id || guildId || "").trim();
  if (!/^\d{5,30}$/.test(requestedGuildId)) throw httpError(400, "Missing or invalid guild_id.");

  if (request.method === "DELETE") {
    const clanName = String(body.clan_name || body.name || body.clan || "").trim();
    const clanKey = normalizeText(clanName);
    if (!clanKey) throw httpError(400, "Add a clan name to remove.");

    const existing = await supabaseSelect(env, DISCORD_OFFLINE_PING_CLANS_TABLE, {
      select: "*",
      guild_id: `eq.${requestedGuildId}`,
      clan_key: `eq.${clanKey}`,
      limit: "1"
    });

    await supabaseDelete(env, DISCORD_OFFLINE_PING_CLANS_TABLE, {
      guild_id: `eq.${requestedGuildId}`,
      clan_key: `eq.${clanKey}`
    });
    await deleteOfflinePingClanAlertState(env, requestedGuildId, clanKey);

    return noStoreJson({
      ok: true,
      guild_id: requestedGuildId,
      clan_name: clanName,
      removed: Boolean(existing[0]),
      clan: existing[0] ? normalizeOfflinePingClanOutput(existing[0]) : null
    });
  }

  const clanNamesValue = Array.isArray(body.clans)
    ? body.clans
    : [body.clan_name || body.name || body.clan];
  const now = new Date().toISOString();
  const rows = clanNamesValue
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .map(clan => ({
      guild_id: requestedGuildId,
      clan_name: clan,
      clan_key: normalizeText(clan),
      enabled: body.enabled === undefined ? true : parseBooleanish(body.enabled) !== false,
      created_by: stringOrNull(body.created_by || body.updated_by),
      created_at: now,
      updated_at: now
    }))
    .filter(row => row.clan_key);

  if (!rows.length) throw httpError(400, "Add at least one clan name.");

  await ensureOfflineGuildConfig(env, requestedGuildId, body);
  await supabaseUpsertChunked(env, DISCORD_OFFLINE_PING_CLANS_TABLE, rows, "guild_id,clan_key", 500);

  return noStoreJson({
    ok: true,
    guild_id: requestedGuildId,
    clans: rows.map(normalizeOfflinePingClanOutput)
  });
}

async function handleOfflinePingLeagues(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const guildId = String(url.searchParams.get("guild_id") || "").trim();

  if (request.method === "GET") {
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "Missing or invalid guild_id.");
    const rows = await supabaseSelect(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "league_name.asc",
      limit: "1000"
    });
    return noStoreJson({
      ok: true,
      guild_id: guildId,
      leagues: rows.map(normalizeOfflinePingLeagueOutput)
    });
  }

  const body = await request.json().catch(() => ({}));
  const requestedGuildId = String(body.guild_id || guildId || "").trim();
  if (!/^\d{5,30}$/.test(requestedGuildId)) throw httpError(400, "Missing or invalid guild_id.");

  if (request.method === "DELETE") {
    const leagueName = String(body.league_name || body.name || body.league || "").trim();
    const leagueKey = normalizeText(leagueName);
    if (!leagueKey) throw httpError(400, "Add a league name to remove.");

    const existing = await supabaseSelect(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, {
      select: "*",
      guild_id: `eq.${requestedGuildId}`,
      league_key: `eq.${leagueKey}`,
      limit: "1"
    });

    await supabaseDelete(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, {
      guild_id: `eq.${requestedGuildId}`,
      league_key: `eq.${leagueKey}`
    });
    await deleteOfflinePingLeagueAlertState(env, requestedGuildId, leagueKey);

    return noStoreJson({
      ok: true,
      guild_id: requestedGuildId,
      league_name: leagueName,
      removed: Boolean(existing[0]),
      league: existing[0] ? normalizeOfflinePingLeagueOutput(existing[0]) : null
    });
  }

  const leagueNamesValue = Array.isArray(body.leagues)
    ? body.leagues
    : [body.league_name || body.name || body.league];
  const now = new Date().toISOString();
  const rows = leagueNamesValue
    .map(value => String(value || "").trim())
    .filter(Boolean)
    .map(league => ({
      guild_id: requestedGuildId,
      league_name: league,
      league_key: normalizeText(league),
      enabled: body.enabled === undefined ? true : parseBooleanish(body.enabled) !== false,
      created_by: stringOrNull(body.created_by || body.updated_by),
      created_at: now,
      updated_at: now
    }))
    .filter(row => row.league_key);

  if (!rows.length) throw httpError(400, "Add at least one league name.");

  await ensureOfflineGuildConfig(env, requestedGuildId, body);
  await supabaseUpsertChunked(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, rows, "guild_id,league_key", 500);

  return noStoreJson({
    ok: true,
    guild_id: requestedGuildId,
    leagues: rows.map(normalizeOfflinePingLeagueOutput)
  });
}

async function handleOfflinePingUsers(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const guildId = String(url.searchParams.get("guild_id") || "").trim();

  if (request.method === "GET") {
    if (!/^\d{5,30}$/.test(guildId)) throw httpError(400, "Missing or invalid guild_id.");
    const rows = await supabaseSelect(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "roblox_username.asc",
      limit: "1000"
    });
    return noStoreJson({
      ok: true,
      guild_id: guildId,
      users: rows.map(normalizeOfflinePingUserOutput)
    });
  }

  const body = await request.json().catch(() => ({}));
  const requestedGuildId = String(body.guild_id || guildId || "").trim();
  if (!/^\d{5,30}$/.test(requestedGuildId)) throw httpError(400, "Missing or invalid guild_id.");

  if (request.method === "DELETE") {
    const targets = normalizeOfflinePingUserDeleteTargets(body);
    if (!targets.length) throw httpError(400, "Add at least one username or user ID to remove.");

    const removed = [];
    const warnings = [];
    for (const target of targets) {
      const rows = await findOfflinePingUserRowsForDelete(env, requestedGuildId, target);
      if (!rows.length) {
        warnings.push(`No offline assignment found for ${target.label}.`);
        continue;
      }

      for (const row of rows) {
        const usernameKey = String(row.roblox_username_key || "").trim();
        if (!usernameKey) continue;

        await supabaseDelete(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
          guild_id: `eq.${requestedGuildId}`,
          roblox_username_key: `eq.${usernameKey}`
        });
        await deleteOfflinePingUserAlertState(env, requestedGuildId, row);
        removed.push(row);
      }
    }

    return noStoreJson({
      ok: true,
      guild_id: requestedGuildId,
      removed_count: removed.length,
      removed_users: removed.map(normalizeOfflinePingUserOutput),
      warnings
    });
  }

  const entries = Array.isArray(body.users) && body.users.length
    ? body.users
    : [{
      username: body.username || body.roblox_username,
      discord_user_id: body.discord_user_id,
      discord_label: body.discord_label,
      clan_name: body.clan_name || body.clan || body.league_name || body.league,
      source_mode: body.source_mode || body.source,
      delivery_scope: body.delivery_scope || body.delivery || body.scope,
      channel_id: body.channel_id || body.channel,
      channel_type: body.channel_type
    }];
  const now = new Date().toISOString();
  const rows = [];
  const warnings = [];

  for (const entry of entries) {
    const usernameInput = String(entry?.username || entry?.roblox_username || "").trim();
    if (!usernameInput) continue;

    const identity = await resolveGlobalSearchIdentity(usernameInput, env).catch(() => ({
      user_id: null,
      username: null,
      display_name: null
    }));
    const robloxUsername = String(identity.username || usernameInput).trim();
    const robloxKey = normalizeText(robloxUsername || usernameInput);
    const discordUserId = parseDiscordUserId(entry?.discord_user_id || entry?.discord || entry?.mention);
    const clanNameValue = stringOrNull(entry?.clan_name || entry?.clan || entry?.league_name || entry?.league);
    const sourceMode = normalizeOfflineWatchSourceMode(entry?.source_mode || entry?.source || body.source_mode || body.source) || "auto";
    const deliveryScope = normalizeOfflinePingDeliveryScope(entry?.delivery_scope || entry?.delivery || body.delivery_scope || body.delivery) || "users";
    const channelId = stringOrNull(entry?.channel_id || entry?.channel || body.channel_id || body.channel);
    const channelType = toNumber(entry?.channel_type ?? body.channel_type);

    if (!identity.user_id) {
      warnings.push(`Roblox user ${usernameInput} was saved by name only; Luna could not resolve the numeric ID yet.`);
    }
    if (!discordUserId && (entry?.discord_user_id || entry?.discord || entry?.mention)) {
      warnings.push(`Discord user ${entry.discord_user_id || entry.discord || entry.mention} for ${usernameInput} was not a numeric ID or mention.`);
    }
    if (channelId && !/^\d{5,30}$/.test(channelId)) {
      throw httpError(400, `Discord channel for ${usernameInput} is not a valid channel ID.`);
    }

    rows.push({
      guild_id: requestedGuildId,
      clan_name: clanNameValue,
      clan_key: clanNameValue ? normalizeText(clanNameValue) : null,
      roblox_user_id: toNumber(identity.user_id),
      roblox_username: robloxUsername || usernameInput,
      roblox_username_key: robloxKey || normalizeText(usernameInput),
      source_mode: sourceMode,
      delivery_scope: deliveryScope,
      discord_user_id: discordUserId || null,
      discord_label: stringOrNull(entry?.discord_label || entry?.discord || entry?.mention),
      channel_id: channelId || null,
      channel_type: channelId ? channelType : null,
      enabled: entry?.enabled === undefined ? true : parseBooleanish(entry.enabled) !== false,
      created_by: stringOrNull(body.created_by || entry?.created_by),
      created_at: now,
      updated_at: now
    });
  }

  if (!rows.length) throw httpError(400, "Add at least one username.");

  // Adding a watch never changes the server's source modes. `/offline mode`
  // is the sole control for clan, League, and direct-user alert activity.
  await ensureOfflineGuildConfig(env, requestedGuildId, body);
  await supabaseUpsertChunked(env, DISCORD_OFFLINE_PING_USERS_TABLE, rows, "guild_id,roblox_username_key", 500);

  return noStoreJson({
    ok: true,
    guild_id: requestedGuildId,
    users: rows.map(normalizeOfflinePingUserOutput),
    warnings
  });
}

function normalizeOfflinePingUserDeleteTargets(body) {
  const rawEntries = Array.isArray(body.users) && body.users.length
    ? body.users
    : [body.username || body.roblox_username || body.user_id || body.roblox_user_id];
  const targets = [];
  const seen = new Set();

  for (const entry of rawEntries) {
    const username = String(
      typeof entry === "object"
        ? (entry.username || entry.roblox_username || entry.name || "")
        : entry || ""
    ).trim();
    const explicitUserId = toNumber(
      typeof entry === "object"
        ? (entry.user_id || entry.roblox_user_id)
        : (/^\d+$/.test(username) ? username : null)
    );
    const usernameKey = normalizeText(username);
    const key = explicitUserId ? `id:${explicitUserId}` : `name:${usernameKey}`;
    if ((!explicitUserId && !usernameKey) || seen.has(key)) continue;
    seen.add(key);
    targets.push({
      user_id: explicitUserId,
      username,
      username_key: usernameKey,
      label: explicitUserId ? String(explicitUserId) : username
    });
  }

  return targets;
}

async function findOfflinePingUserRowsForDelete(env, guildId, target) {
  if (target.user_id) {
    const rows = await supabaseSelect(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      roblox_user_id: `eq.${target.user_id}`,
      limit: "50"
    });
    if (rows.length) return rows;
  }

  const keys = uniqueValues([target.username_key, normalizeText(target.username)]);
  if (!keys.length) return [];

  return supabaseSelect(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
    select: "*",
    guild_id: `eq.${guildId}`,
    roblox_username_key: keys.length === 1 ? `eq.${keys[0]}` : postgrestInFilter(keys),
    limit: "50"
  });
}

async function deleteOfflinePingUserAlertState(env, guildId, row) {
  const subjectKeys = uniqueValues([
    row.roblox_user_id ? `id:${row.roblox_user_id}` : "",
    row.roblox_username_key ? `name:${row.roblox_username_key}` : "",
    row.roblox_username ? `name:${normalizeText(row.roblox_username)}` : ""
  ]);

  for (const subjectKey of subjectKeys) {
    await supabaseDelete(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
      guild_id: `eq.${guildId}`,
      scope: "eq.user",
      subject_key: `eq.${subjectKey}`
    });
  }
}

async function deleteOfflinePingClanAlertState(env, guildId, clanKey) {
  const guildIdText = String(guildId || "").trim();
  const key = normalizeText(clanKey);
  if (!/^\d{5,30}$/.test(guildIdText) || !key) return;

  await supabaseDelete(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
    guild_id: `eq.${guildIdText}`,
    scope: "eq.clan",
    subject_key: `eq.${key}`
  });
}

async function deleteOfflinePingLeagueAlertState(env, guildId, leagueKey) {
  const guildIdText = String(guildId || "").trim();
  const key = normalizeText(leagueKey);
  if (!/^\d{5,30}$/.test(guildIdText) || !key) return;

  await supabaseDelete(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
    guild_id: `eq.${guildIdText}`,
    scope: "eq.league",
    subject_key: `eq.${key}`
  });
}

async function resetOfflinePingAlertStateForGuild(env, guildId) {
  const guildIdText = String(guildId || "").trim();
  if (!/^\d{5,30}$/.test(guildIdText)) return;

  await supabaseDelete(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
    guild_id: `eq.${guildIdText}`
  });
}

async function handleOfflinePingStatus(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const guildId = String(url.searchParams.get("guild_id") || "").trim();
  const configParams = {
    select: "*",
    order: "updated_at.desc",
    limit: "1000"
  };
  if (guildId) configParams.guild_id = `eq.${guildId}`;

  const configs = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, configParams);
  const statusRows = [];
  for (const config of configs) {
    const [clans, leagues, users, states] = await Promise.all([
      supabaseSelect(env, DISCORD_OFFLINE_PING_CLANS_TABLE, {
        select: "*",
        guild_id: `eq.${config.guild_id}`,
        order: "clan_name.asc",
        limit: "1000"
      }).catch(() => []),
      supabaseSelect(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, {
        select: "*",
        guild_id: `eq.${config.guild_id}`,
        order: "league_name.asc",
        limit: "1000"
      }).catch(() => []),
      supabaseSelect(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
        select: "*",
        guild_id: `eq.${config.guild_id}`,
        order: "roblox_username.asc",
        limit: "1000"
      }).catch(() => []),
      supabaseSelect(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
        select: "*",
        guild_id: `eq.${config.guild_id}`,
        order: "updated_at.desc",
        limit: "1000"
      }).catch(() => [])
    ]);
    statusRows.push({
      config: normalizeOfflinePingConfigOutput(config),
      clans: clans.map(normalizeOfflinePingClanOutput),
      leagues: leagues.map(normalizeOfflinePingLeagueOutput),
      users: users.map(normalizeOfflinePingUserOutput),
      active_alerts: states.filter(row => row.alert_active === true).length,
      latest_states: states.slice(0, 25)
    });
  }

  return noStoreJson({
    ok: true,
    generated_at: new Date().toISOString(),
    runtime: offlinePingRuntimeConfig(env),
    guilds: statusRows
  });
}

async function handleOfflinePingCheck(env, source, options = {}) {
  requireSupabase(env);

  const nowIso = new Date().toISOString();
  const requestedGuildId = String(options.guildId || "").trim();
  const configParams = {
    select: "*",
    enabled: "eq.true",
    order: "updated_at.asc",
    limit: "1000"
  };
  if (requestedGuildId) configParams.guild_id = `eq.${requestedGuildId}`;

  const configs = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, configParams);
  const results = [];

  for (const config of configs) {
    results.push(await runOfflinePingGuildCheck(env, config, nowIso, options).catch(async err => {
      const message = String(err?.message || err || "Offline ping check failed.").slice(0, 1000);
      await supabaseUpsert(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, [{
        guild_id: config.guild_id,
        last_checked_at: nowIso,
        last_error: message,
        updated_at: nowIso
      }], "guild_id").catch(() => null);
      return {
        ok: false,
        guild_id: config.guild_id,
        channel_id: config.channel_id || config.clan_channel_id || config.league_channel_id || config.users_channel_id || null,
        message
      };
    }));
  }

  return json({
    ok: results.every(result => result.ok),
    source,
    checked_at: nowIso,
    runtime: offlinePingRuntimeConfig(env),
    guilds_checked: configs.length,
    offline_candidates: results.reduce((sum, result) => sum + (toNumber(result.offline_candidates) || 0), 0),
    alerts_posted: results.reduce((sum, result) => sum + (toNumber(result.alerts_posted) || 0), 0),
    results
  }, 202, {
    "Cache-Control": "no-store"
  });
}

async function handleOfflinePingTestPost(request, env) {
  const body = await request.json().catch(() => ({}));
  const checkedAt = new Date().toISOString();
  const thresholdMinutes = clamp(Number(body.minutes_threshold || body.minutes || offlineDefaultMinutes(env)), 1, 1440);
  const postRateMinutes = clamp(Number(body.post_rate_minutes || body.post_rate || offlineDefaultPostRateMinutes(env)), 1, 1440);
  const clanName = String(body.clan_name || body.clan || "c0ld").trim() || "c0ld";
  const leagueName = String(body.league_name || body.league || "dezzz").trim() || "dezzz";
  const username = String(body.username || "Cinnamowopal").trim() || "Cinnamowopal";
  const destinationScope = normalizeOfflinePingDestinationScope(body.destination_scope || body.channel_scope || body.scope);
  const sampleAlerts = [
    {
      scope: "user",
      watch: {
        roblox_username: username,
        discord_user_id: parseDiscordUserId(body.discord_user_id || body.discord || "")
      },
      status: {
        username,
        clan_name: clanName,
        offline_minutes: thresholdMinutes + 17,
        points: 109818,
        gain_1h: 0
      }
    },
    {
      scope: "clan",
      watch: { clan_name: clanName },
      status: {
        username: "BEARDED_DRAGONGUY",
        clan_name: clanName,
        offline_minutes: thresholdMinutes + 41,
        points: 9316,
        gain_1h: 0
      }
    },
    {
      scope: "league",
      watch: { league_name: leagueName },
      status: {
        username: "MercilessBanditTaken",
        clan_name: leagueName,
        offline_minutes: thresholdMinutes + 29,
        points: 204,
        gain_1h: 0
      }
    }
  ];
  const previewAlerts = destinationScope
    ? sampleAlerts.filter(alert => (
        destinationScope === "users" ? alert.scope === "user" : alert.scope === destinationScope
      ))
    : sampleAlerts;
  const messageBody = offlinePingAlertMessageBody(previewAlerts, checkedAt, {
    thresholdMinutes,
    postRateMinutes,
    mentionDirectUsers: parseBooleanish(body.mention_users) === true
  });

  const webhookUrl = validatedDiscordWebhookUrl(String(body.webhook_url || "").trim());
  if (webhookUrl) {
    const result = await postDiscordWebhookMessage(webhookUrl, messageBody);
    if (!result.ok) throw httpError(502, result.error || "Discord webhook test post failed.");
    return noStoreJson({
      ok: true,
      transport: "webhook",
      message_id: stringOrNull(result.body?.id),
      channel_id: stringOrNull(result.body?.channel_id) || null
    });
  }

  let channelId = String(body.channel_id || "").trim();
  const guildId = String(body.guild_id || "").trim();
  if (!channelId && guildId) {
    const configs = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, {
      select: "guild_id,channel_id,clan_channel_id,league_channel_id,users_channel_id",
      guild_id: `eq.${guildId}`,
      limit: "1"
    }).catch(() => []);
    channelId = offlinePingDestinationChannelId(configs[0] || {}, destinationScope || "clan");
  }
  if (!/^\d{5,30}$/.test(channelId)) {
    throw httpError(400, "Provide webhook_url, channel_id, or a guild_id with /offline assign already configured.");
  }

  const result = await discordBotChannelMessageRequest(env, {
    method: "POST",
    channelId,
    body: messageBody
  });
  if (!result.ok) throw httpError(502, result.error || "Discord channel test post failed.");
  return noStoreJson({
    ok: true,
    transport: "bot",
    message_id: stringOrNull(result.body?.id),
    channel_id: stringOrNull(result.body?.channel_id) || channelId
  });
}

async function runOfflinePingGuildCheck(env, config, checkedAt, options = {}) {
  const thresholdMinutes = clamp(Number(config.minutes_threshold || offlineDefaultMinutes(env)), 1, 1440);
  const postRateMinutes = clamp(Number(config.post_rate_minutes || offlineDefaultPostRateMinutes(env)), 1, 1440);
  // Keep enough history to calculate a real one-hour delta even when the
  // newest League snapshot arrives several minutes behind the cron check.
  const lookbackMinutes = Math.max(90, thresholdMinutes + offlineLookbackBufferMinutes(env));
  const guildId = String(config.guild_id || "");
  const requestedSourceMode = normalizeOfflineWatchSourceMode(options.sourceMode);
  const clansEnabled = config.clan_watches_enabled !== false;
  const leaguesEnabled = config.league_watches_enabled !== false;
  const usersEnabled = config.user_watches_enabled !== false;
  const includeClanWatches = clansEnabled && requestedSourceMode !== "league" && options.skipClanWatches !== true;
  const includeLeagueWatches = leaguesEnabled && requestedSourceMode !== "clan";
  const [registeredClanWatches, leagueWatches, userWatchesRaw, states] = await Promise.all([
    includeClanWatches ? supabaseSelect(env, DISCORD_OFFLINE_PING_CLANS_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "clan_name.asc",
      limit: "1000"
    }).catch(() => []) : Promise.resolve([]),
    includeLeagueWatches ? supabaseSelect(env, DISCORD_OFFLINE_PING_LEAGUES_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "league_name.asc",
      limit: "1000"
    }).catch(() => []) : Promise.resolve([]),
    supabaseSelect(env, DISCORD_OFFLINE_PING_USERS_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      order: "roblox_username.asc",
      limit: "1000"
    }).catch(() => []),
    supabaseSelect(env, DISCORD_OFFLINE_PING_ALERT_STATE_TABLE, {
      select: "*",
      guild_id: `eq.${guildId}`,
      limit: "5000"
    }).catch(() => [])
  ]);
  // Early versions stored `enabled` as NULL. NULL meant active in the UI,
  // but the scheduled check queried only `enabled = true`, silently dropping
  // those saved watches. Only an explicit false disables a saved row.
  const activeRegisteredClanWatches = registeredClanWatches.filter(watch => watch?.enabled !== false);
  const activeLeagueWatches = leagueWatches.filter(watch => watch?.enabled !== false);
  const activeUserWatches = userWatchesRaw.filter(watch => watch?.enabled !== false);
  const clanMemberWatches = clansEnabled
    ? activeUserWatches.filter(watch => normalizeOfflinePingDeliveryScope(watch?.delivery_scope) === "clan")
    : [];
  const clanMemberWatchesByClan = groupRowsBy(
    clanMemberWatches.filter(watch => normalizeText(watch?.clan_name)),
    watch => normalizeText(watch.clan_name)
  );
  const registeredClanKeys = new Set();
  const clanWatches = includeClanWatches
    ? activeRegisteredClanWatches.map(watch => {
      const clanKey = normalizeText(watch.clan_name || watch.clan_key);
      registeredClanKeys.add(clanKey);
      return {
        ...watch,
        _member_mappings: clanMemberWatchesByClan.get(clanKey) || [],
        _member_only: false
      };
    })
    : [];
  // `/offline members` can be used before `/offline clan`.  It must still
  // create one clan-formatted alert stream, but only for the explicitly
  // mapped members rather than every player in that clan.
  if (includeClanWatches) {
    for (const [clanKey, mappings] of clanMemberWatchesByClan.entries()) {
      if (registeredClanKeys.has(clanKey)) continue;
      clanWatches.push({
        clan_name: mappings[0]?.clan_name || clanKey,
        clan_key: clanKey,
        enabled: true,
        _member_mappings: mappings,
        _member_only: true
      });
    }
  }
  const userWatches = activeUserWatches.filter(watch => {
    // `/offline members` routes through the clan board, so it remains active
    // when direct-user watches are disabled.  This is what makes a
    // clans-only setup possible without losing the explicit member pings.
    const deliveryScope = normalizeOfflinePingDeliveryScope(watch?.delivery_scope) || "users";
    if (deliveryScope === "clan") return false;
    if (!usersEnabled) return false;
    // Direct-user mode is independent: it only looks up the explicitly
    // saved people. Turning clan or League boards off must not suppress a
    // direct-user alert just because their score happens to come from one of
    // those sources.
    return true;
  });
  const stateByKey = new Map(states.map(row => [offlineStateMapKey(row), row]));
  const clanBundleCache = new Map();
  const leagueBundleCache = new Map();
  const stateUpdates = [];
  const dueAlerts = [];
  const checkedRows = [];

  const getClanBundle = async (clanNameValue, bundleOptions = {}) => {
    // Direct-user watches are independent of the clan-board mode. They may
    // still need one clan lookup to find that specific user's current score.
    if (!includeClanWatches && bundleOptions.allowDirectLookup !== true) return null;
    const clanKey = normalizeText(clanNameValue);
    if (!clanKey) return null;
    if (!clanBundleCache.has(clanKey)) {
      clanBundleCache.set(clanKey, fetchOfflineClanBundle(env, clanNameValue, lookbackMinutes));
    }
    return clanBundleCache.get(clanKey);
  };

  const getLeagueBundle = async (leagueNameValue, bundleOptions = {}) => {
    // Same principle as clan lookups: disabling the League board must not
    // disable a saved direct-user watch whose current row is in a League.
    if (!includeLeagueWatches && bundleOptions.allowDirectLookup !== true) return null;
    const leagueKey = normalizeText(leagueNameValue);
    if (!leagueKey) return null;
    if (!leagueBundleCache.has(leagueKey)) {
      leagueBundleCache.set(leagueKey, fetchOfflineLeagueBundle(env, leagueNameValue, lookbackMinutes));
    }
    return leagueBundleCache.get(leagueKey);
  };

  for (const watch of userWatches) {
    const status = await findOfflineMemberStatusForWatch(env, watch, getClanBundle, clanBundleCache, getLeagueBundle, leagueBundleCache, lookbackMinutes, {
      includeClan: true,
      includeLeague: true,
      allowDirectLookup: true
    });
    const subjectKey = offlineUserSubjectKey(watch);
    const trackedKey = status?.user_key || subjectKey;
    const stateKey = offlineStateMapKey({
      guild_id: guildId,
      scope: "user",
      subject_key: subjectKey,
      tracked_user_key: trackedKey
    });
    if (!status) {
      stateUpdates.push(offlineStateWithDeliveryState(offlineStateRow({
        guildId,
        scope: "user",
        subjectKey,
        trackedUserKey: trackedKey,
        watch,
        status: null,
        alertActive: false,
        checkedAt,
        lastError: "No current clan or league row found for this Roblox user."
      }), stateByKey.get(stateKey)));
      continue;
    }

    const offline = status.offline_minutes >= thresholdMinutes;
    checkedRows.push(status);
    const update = offlineStateRow({
      guildId,
      scope: "user",
      subjectKey,
      trackedUserKey: trackedKey,
      watch,
      status,
      alertActive: offline,
      checkedAt
    });
    const existingState = stateByKey.get(stateKey);
    if (offline && offlineAlertDue(existingState, postRateMinutes, checkedAt)) {
      dueAlerts.push({
        scope: "user",
        delivery_scope: normalizeOfflinePingDeliveryScope(watch.delivery_scope) || "users",
        watch,
        status,
        stateKey,
        stateRow: update
      });
    } else {
      stateUpdates.push(offlineStateWithDeliveryState(update, existingState));
    }
  }

  for (const watch of clanWatches) {
    const bundle = await getClanBundle(watch.clan_name);
    const subjectKey = normalizeText(watch.clan_name || watch.clan_key);
    if (!bundle) continue;

    for (const status of bundle.statuses) {
      const memberMapping = offlineMemberMappingForStatus(watch._member_mappings, status);
      if (watch._member_only === true && !memberMapping) continue;
      const alertWatch = memberMapping ? { ...watch, ...memberMapping } : watch;
      // Reuse the member's original user-state key when one exists. This
      // retains its alert cooldown while changing delivery to the clan post.
      const alertScope = memberMapping ? "user" : "clan";
      const alertSubjectKey = memberMapping ? offlineUserSubjectKey(memberMapping) : subjectKey;
      const trackedKey = status.user_key;
      const stateKey = offlineStateMapKey({
        guild_id: guildId,
        scope: alertScope,
        subject_key: alertSubjectKey,
        tracked_user_key: trackedKey
      });
      const offline = status.offline_minutes >= thresholdMinutes;
      checkedRows.push(status);
      const update = offlineStateRow({
        guildId,
        scope: alertScope,
        subjectKey: alertSubjectKey,
        trackedUserKey: trackedKey,
        watch: alertWatch,
        status,
        alertActive: offline,
        checkedAt
      });

      const existingState = stateByKey.get(stateKey);
      if (offline && offlineAlertDue(existingState, postRateMinutes, checkedAt)) {
        dueAlerts.push({
          scope: alertScope,
          delivery_scope: memberMapping ? "clan" : undefined,
          watch: alertWatch,
          status,
          stateKey,
          stateRow: update
        });
      } else {
        stateUpdates.push(offlineStateWithDeliveryState(update, existingState));
      }
    }
  }

  for (const watch of activeLeagueWatches) {
    const bundle = await getLeagueBundle(watch.league_name);
    const subjectKey = normalizeText(watch.league_name || watch.league_key);
    if (!bundle) continue;

    for (const status of bundle.statuses) {
      const trackedKey = status.user_key;
      const stateKey = offlineStateMapKey({
        guild_id: guildId,
        scope: "league",
        subject_key: subjectKey,
        tracked_user_key: trackedKey
      });
      const offline = status.offline_minutes >= thresholdMinutes;
      checkedRows.push(status);
      const update = offlineStateRow({
        guildId,
        scope: "league",
        subjectKey,
        trackedUserKey: trackedKey,
        watch,
        status,
        alertActive: offline,
        checkedAt
      });

      const existingState = stateByKey.get(stateKey);
      if (offline && offlineAlertDue(existingState, postRateMinutes, checkedAt)) {
        dueAlerts.push({
          scope: "league",
          watch,
          status,
          stateKey,
          stateRow: update
        });
      } else {
        stateUpdates.push(offlineStateWithDeliveryState(update, existingState));
      }
    }
  }

  const postResults = [];
  const skippedAlerts = [];
  const cooldownAlerts = [];
  if (dueAlerts.length) {
    // Direct-user and Clan-watch rows can omit a manual Discord account.
    // Resolve only members whose alert is actually due, then cache each
    // result per Discord server. League watches stay non-pinging because
    // they can represent an arbitrary roster outside the configured clan.
    const deliveryAlerts = await resolveOfflineAlertDiscordMentions(env, guildId, dueAlerts);

    for (const group of splitOfflinePingAlertsByDestination(config, deliveryAlerts)) {
      if (!group.channel_id) {
        skippedAlerts.push(...group.alerts);
        continue;
      }

      const channelStateKey = offlineDestinationStateMapKey(guildId, group.channel_id, group.destination_key);
      const channelState = stateByKey.get(channelStateKey);
      if (!offlinePostRateDue(channelState, postRateMinutes, checkedAt)) {
        cooldownAlerts.push(...group.alerts);
        group.alerts.forEach(alert => stateUpdates.push(
          offlineStateWithDeliveryState(alert.stateRow, stateByKey.get(alert.stateKey))
        ));
        stateUpdates.push(offlineDestinationStateRow({
          guildId,
          channelId: group.channel_id,
          destinationKey: group.destination_key,
          checkedAt,
          lastAlertAt: channelState?.last_alert_at || null,
          lastMessageId: channelState?.last_alert_message_id || null,
          lastError: "Offline alert channel post-rate cooldown is active."
        }));
        continue;
      }

      try {
        const postResult = await postOfflinePingAlerts(env, config, group.alerts, checkedAt, {
          thresholdMinutes,
          postRateMinutes,
          destinationScope: group.scope,
          channelId: group.channel_id
        });
        postResults.push(postResult);
        const messageId = stringOrNull(postResult?.message_id);
        for (const alert of group.alerts) {
          stateUpdates.push({
            ...alert.stateRow,
            last_alert_at: checkedAt,
            last_alert_message_id: messageId,
            last_error: null
          });
        }
        stateUpdates.push(offlineDestinationStateRow({
          guildId,
          channelId: group.channel_id,
          destinationKey: group.destination_key,
          checkedAt,
          lastAlertAt: checkedAt,
          lastMessageId: messageId,
          lastError: null
        }));
      } catch (err) {
        const message = String(err?.message || err || "Discord offline ping post failed.").slice(0, 1000);
        postResults.push({
          posted: false,
          channel_id: group.channel_id,
          error: message
        });
        for (const alert of group.alerts) {
          stateUpdates.push({
            ...alert.stateRow,
            last_alert_at: checkedAt,
            last_alert_message_id: null,
            last_error: message
          });
        }
        stateUpdates.push(offlineDestinationStateRow({
          guildId,
          channelId: group.channel_id,
          destinationKey: group.destination_key,
          checkedAt,
          lastAlertAt: checkedAt,
          lastMessageId: null,
          lastError: message
        }));
      }
    }
    skippedAlerts.forEach(alert => stateUpdates.push({
      ...alert.stateRow,
      last_alert_at: checkedAt,
      last_alert_message_id: null,
      last_error: "No assigned offline alert channel for this alert type."
    }));
  }

  const posted = postResults.reduce((count, result) => (
    count + (result?.posted ? Math.max(1, Number(result.message_count) || 1) : 0)
  ), 0);
  const missingDestinationMessage = skippedAlerts.length
    ? `${skippedAlerts.length} offline alert${skippedAlerts.length === 1 ? "" : "s"} skipped because that alert type has no assigned channel.`
    : null;

  if (stateUpdates.length) {
    await supabaseUpsertChunked(
      env,
      DISCORD_OFFLINE_PING_ALERT_STATE_TABLE,
      stateUpdates,
      "guild_id,scope,subject_key,tracked_user_key",
      500
    );
  }

  await supabaseUpsert(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, [{
    guild_id: guildId,
    last_checked_at: checkedAt,
    last_posted_at: posted ? checkedAt : config.last_posted_at || null,
    last_error: missingDestinationMessage,
    updated_at: checkedAt
  }], "guild_id");

  return {
    ok: true,
    guild_id: guildId,
    channel_id: config.channel_id || null,
    clan_channel_id: offlinePingDestinationChannelId(config, "clan") || null,
    league_channel_id: offlinePingDestinationChannelId(config, "league") || null,
    users_channel_id: offlinePingDestinationChannelId(config, "users") || null,
    threshold_minutes: thresholdMinutes,
    post_rate_minutes: postRateMinutes,
    clan_watches_enabled: clansEnabled,
    league_watches_enabled: leaguesEnabled,
    user_watches_enabled: usersEnabled,
    clan_watches: clanWatches.length,
    league_watches: leagueWatches.length,
    user_watches: userWatches.length,
    checked_users: uniqueValues(checkedRows.map(row => row.user_key)).length,
    offline_candidates: dueAlerts.length,
    alerts_posted: posted,
    alerts_skipped_no_channel: skippedAlerts.length,
    alerts_skipped_channel_cooldown: cooldownAlerts.length,
    message_ids: postResults.flatMap(result => result?.message_ids || [result?.message_id]).filter(Boolean)
  };
}

// Admin-only diagnostic for verifying the exact RoVer mapping that the
// offline-alert job will use. This deliberately makes one RoVer request and
// does not create an offline alert or touch BIG Games data.
async function handleOfflineRoVerLookup(request, env) {
  requireSupabase(env);
  const body = await request.json().catch(() => ({}));
  const guildId = String(body.guild_id || body.guild || "").trim();
  if (!/^\d{5,30}$/.test(guildId)) {
    throw httpError(400, "Provide the Discord server ID as guild_id.");
  }

  const username = String(body.username || body.roblox_username || "").trim();
  let robloxUserId = toNumber(body.roblox_user_id || body.user_id);
  let resolvedUsername = username || null;
  if (!robloxUserId && username) {
    const identity = await resolveGlobalSearchIdentity(username, env).catch(() => null);
    robloxUserId = toNumber(identity?.user_id);
    resolvedUsername = String(identity?.username || username).trim() || null;
  }
  if (!robloxUserId) {
    throw httpError(400, "Provide username or roblox_user_id.");
  }

  const probe = await fetchRoVerDiscordUserLink(env, guildId, robloxUserId);
  await cacheOfflineDiscordUserLink(env, guildId, robloxUserId, probe, "rover").catch(err => {
    console.warn("RoVer diagnostic cache write failed", String(err?.message || err || "unknown error"));
  });

  return noStoreJson({
    ok: probe.lookup_state === "matched",
    guild_id: guildId,
    roblox_user_id: robloxUserId,
    roblox_username: resolvedUsername,
    rover: {
      configured: Boolean(roverApiKey(env)),
      endpoint: probe.endpoint,
      http_status: probe.http_status,
      lookup_state: probe.lookup_state,
      discord_user_id: probe.discord_user_id,
      response_keys: probe.response_keys,
      response_message: probe.response_message || null,
      error: probe.error
    },
    checked_at: new Date().toISOString()
  });
}

// Admin-only diagnostic for Bloxlink. Bloxlink Server API keys are bound to a
// Discord server, so this verifies the same guild-specific key the offline job
// will use without posting an alert or requesting BIG Games data.
async function handleOfflineBloxlinkLookup(request, env) {
  requireSupabase(env);
  const body = await request.json().catch(() => ({}));
  const guildId = String(body.guild_id || body.guild || "").trim();
  if (!/^\d{5,30}$/.test(guildId)) {
    throw httpError(400, "Provide the Discord server ID as guild_id.");
  }

  const username = String(body.username || body.roblox_username || "").trim();
  let robloxUserId = toNumber(body.roblox_user_id || body.user_id);
  let resolvedUsername = username || null;
  if (!robloxUserId && username) {
    const identity = await resolveGlobalSearchIdentity(username, env).catch(() => null);
    robloxUserId = toNumber(identity?.user_id);
    resolvedUsername = String(identity?.username || username).trim() || null;
  }
  if (!robloxUserId) {
    throw httpError(400, "Provide username or roblox_user_id.");
  }

  const probe = await fetchBloxlinkDiscordUserLink(env, guildId, robloxUserId);

  return noStoreJson({
    ok: probe.lookup_state === "matched",
    guild_id: guildId,
    roblox_user_id: robloxUserId,
    roblox_username: resolvedUsername,
    bloxlink: {
      configured: Boolean(bloxlinkGuildApiKey(env, guildId)),
      endpoint: probe.endpoint,
      http_status: probe.http_status,
      lookup_state: probe.lookup_state,
      discord_user_id: probe.discord_user_id,
      response_keys: probe.response_keys,
      response_message: probe.response_message || null,
      error: probe.error
    },
    checked_at: new Date().toISOString()
  });
}

async function fetchOfflineClanBundle(env, clanNameValue, lookbackMinutes) {
  const clanNameText = String(clanNameValue || "").trim();
  const clanKey = normalizeText(clanNameText);
  if (!clanKey) return null;

  const sinceIso = new Date(Date.now() - clamp(Number(lookbackMinutes || 60), 1, 1440 * 14) * 60 * 1000).toISOString();
  const [activityRows, memberRows] = await Promise.all([
    supabaseSelect(env, CLAN_ACTIVITY_CURRENT_TABLE, {
      select: "battle_key,battle_display_name,clan_name,clan_key,clan_rank,member_rank,user_id,username,points,fetched_at,updated_at",
      clan_key: `eq.${clanKey}`,
      order: "fetched_at.desc,member_rank.asc",
      limit: "150"
    }).catch(() => []),
    supabaseSelect(env, CURRENT_TABLE, {
      select: "battle_key,battle_display_name,clan_name,rank,user_id,username,total_points,fetched_at,updated_at",
      clan_name: `ilike.${clanNameText}`,
      order: "fetched_at.desc,rank.asc",
      limit: "150"
    }).catch(() => [])
  ]);
  const normalizedCurrent = mergeOfflineCurrentRows([
    ...activityRows.map(row => normalizeOfflineMemberRow(row, "activity_current")),
    ...memberRows.map(row => normalizeOfflineMemberRow(row, "member_current"))
  ]);
  const battle = newestOfflineBattleKey(normalizedCurrent);
  const displayName = normalizedCurrent.find(row => row.battle_key === battle)?.battle_display_name || battle;

  if (!battle) {
    return {
      clan_name: clanNameText,
      clan_key: clanKey,
      battle_key: null,
      battle_display_name: null,
      statuses: []
    };
  }

  const [activityHistory, memberHistory] = await Promise.all([
    supabaseSelectPaged(env, CLAN_ACTIVITY_ROSTER_TABLE, {
      select: "fetched_at,battle_key,clan_name,clan_key,member_rank,user_id,username,points",
      battle_key: `eq.${battle}`,
      clan_key: `eq.${clanKey}`,
      fetched_at: `gte.${sinceIso}`,
      order: "fetched_at.asc,user_id.asc"
    }, 30000, 1000).catch(() => []),
    supabaseSelectPaged(env, SNAPSHOT_TABLE, {
      select: "fetched_at,battle_key,clan_name,rank,user_id,username,total_points",
      battle_key: `eq.${battle}`,
      clan_name: `ilike.${clanNameText}`,
      fetched_at: `gte.${sinceIso}`,
      order: "fetched_at.asc,user_id.asc"
    }, 30000, 1000).catch(() => [])
  ]);
  const historyRows = [
    ...activityHistory.map(row => normalizeOfflineMemberRow(row, "activity_history")),
    ...memberHistory.map(row => normalizeOfflineMemberRow(row, "member_history"))
  ].filter(row => row.battle_key === battle);

  return {
    clan_name: normalizedCurrent[0]?.clan_name || clanNameText,
    clan_key: clanKey,
    battle_key: battle,
    battle_display_name: cleanBattleDisplayName(battle, displayName),
    statuses: computeOfflineMemberStatuses(normalizedCurrent.filter(row => row.battle_key === battle), historyRows)
  };
}

async function fetchOfflineLeagueBundle(env, leagueNameValue, lookbackMinutes) {
  const leagueNameText = String(leagueNameValue || "").trim();
  const leagueKey = normalizeText(leagueNameText);
  if (!leagueKey) return null;

  const lookbackMs = clamp(Number(lookbackMinutes || 60), 1, 1440 * 14) * 60 * 1000;
  let sinceIso = new Date(Date.now() - lookbackMs).toISOString();
  let currentRows = await supabaseSelect(env, LEAGUE_CURRENT_TABLE, {
    select: "league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time,fetched_at,updated_at",
    league_name: `eq.${leagueNameText}`,
    order: "fetched_at.desc,rank.asc",
    limit: "500"
  }).catch(() => []);
  if (!currentRows.length) {
    currentRows = await supabaseSelect(env, LEAGUE_CURRENT_TABLE, {
      select: "league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time,fetched_at,updated_at",
      league_name: `ilike.${leagueNameText}`,
      order: "fetched_at.desc,rank.asc",
      limit: "500"
    }).catch(() => []);
  }
  if (!currentRows.length) {
    currentRows = await fetchOfflineLeagueLatestSnapshotRows(env, leagueNameText);
  }

  const fallbackUserIds = currentRows
    .map(row => ({ id: toNumber(row.user_id), name: String(row.display_name || "").trim() }))
    .filter(row => row.id && isFallbackUsername(row.name, row.id))
    .map(row => row.id);
  if (fallbackUserIds.length) {
    const resolvedUsernames = await resolveRobloxUsernames(fallbackUserIds, env).catch(() => new Map());
    currentRows = currentRows.map(row => {
      const userId = toNumber(row.user_id);
      const resolved = userId ? String(resolvedUsernames.get(userId) || "").trim() : "";
      return resolved && !isFallbackUsername(resolved, userId)
        ? { ...row, display_name: resolved }
        : row;
    });
  }

  const normalizedCurrent = mergeOfflineCurrentRows(currentRows.map(row => normalizeOfflineMemberRow(row, "league_current")));
  const runKey = newestOfflineBattleKey(normalizedCurrent);
  const latestCurrentMs = Math.max(0, ...normalizedCurrent.map(row => isoToMs(row.snapshot_at) || 0));
  if (latestCurrentMs > 0) {
    sinceIso = new Date(latestCurrentMs - lookbackMs).toISOString();
  }

  if (!runKey) {
    return {
      league_name: leagueNameText,
      league_key: leagueKey,
      battle_key: null,
      battle_display_name: null,
      statuses: []
    };
  }

  const historyRows = await supabaseSelectPaged(env, LEAGUE_SNAPSHOT_TABLE, {
    select: "fetched_at,league_run_key,league_name,rank,user_id,display_name,points,last_contribution_at",
    league_run_key: `eq.${runKey}`,
    league_name: `ilike.${leagueNameText}`,
    fetched_at: `gte.${sinceIso}`,
    order: "fetched_at.asc,user_id.asc"
  }, 30000, 1000).catch(() => []);
  const normalizedHistory = historyRows
    .map(row => normalizeOfflineMemberRow(row, "league_history"))
    .filter(row => row.battle_key === runKey);
  const latest = normalizedCurrent.find(row => row.battle_key === runKey) || normalizedCurrent[0] || null;

  return {
    league_name: latest?.clan_name || leagueNameText,
    league_key: leagueKey,
    battle_key: runKey,
    battle_display_name: runKey,
    statuses: computeOfflineMemberStatuses(normalizedCurrent.filter(row => row.battle_key === runKey), normalizedHistory)
  };
}

async function fetchOfflineLeagueLatestSnapshotRows(env, leagueNameText) {
  const select = "snapshot_id,fetched_at,league_run_key,league_name,league_id,league_level,league_points,league_icon,member_capacity,rank,user_id,display_name,points,last_contribution_at,permission_level,role,join_time";
  let metaRows = await supabaseSelect(env, LEAGUE_SNAPSHOT_TABLE, {
    select: "snapshot_id,fetched_at,league_run_key,league_name",
    league_name: `eq.${leagueNameText}`,
    order: "fetched_at.desc",
    limit: "1"
  }).catch(() => []);
  if (!metaRows.length) {
    metaRows = await supabaseSelect(env, LEAGUE_SNAPSHOT_TABLE, {
      select: "snapshot_id,fetched_at,league_run_key,league_name",
      league_name: `ilike.${leagueNameText}`,
      order: "fetched_at.desc",
      limit: "1"
    }).catch(() => []);
  }

  const snapshotId = String(metaRows[0]?.snapshot_id || "").trim();
  if (!snapshotId) return [];

  return supabaseSelect(env, LEAGUE_SNAPSHOT_TABLE, {
    select,
    snapshot_id: `eq.${snapshotId}`,
    order: "rank.asc",
    limit: "500"
  }).catch(() => []);
}

async function findOfflineMemberStatusForWatch(env, watch, getClanBundle, clanBundleCache, getLeagueBundle, leagueBundleCache, lookbackMinutes, options = {}) {
  const userId = toNumber(watch.roblox_user_id);
  const usernameKey = normalizeText(watch.roblox_username);
  const sourceMode = normalizeOfflineWatchSourceMode(watch.source_mode);
  const knownGroup = String(watch.clan_name || "").trim();
  const includeClan = options.includeClan !== false;
  const includeLeague = options.includeLeague !== false;
  const bundleOptions = options.allowDirectLookup === true ? { allowDirectLookup: true } : undefined;

  if (knownGroup && sourceMode === "league" && includeLeague) {
    const bundle = await getLeagueBundle(knownGroup, bundleOptions);
    return findOfflineStatusInBundle(bundle, userId, usernameKey);
  }
  if (knownGroup && sourceMode === "clan" && includeClan) {
    const bundle = await getClanBundle(knownGroup, bundleOptions);
    return findOfflineStatusInBundle(bundle, userId, usernameKey);
  }
  if (knownGroup) {
    if (includeClan) {
      const clanBundle = await getClanBundle(knownGroup, bundleOptions);
      const found = findOfflineStatusInBundle(clanBundle, userId, usernameKey);
      if (found) return found;
    }
    if (includeLeague) {
      const leagueBundle = await getLeagueBundle(knownGroup, bundleOptions);
      const found = findOfflineStatusInBundle(leagueBundle, userId, usernameKey);
      if (found) return found;
    }
  }

  for (const bundlePromise of clanBundleCache.values()) {
    if (!includeClan) break;
    const bundle = await bundlePromise;
    const found = findOfflineStatusInBundle(bundle, userId, usernameKey);
    if (found) return found;
  }

  for (const bundlePromise of leagueBundleCache.values()) {
    if (!includeLeague) break;
    const bundle = await bundlePromise;
    const found = findOfflineStatusInBundle(bundle, userId, usernameKey);
    if (found) return found;
  }

  const currentRows = await fetchOfflineCurrentRowsForUser(env, watch, { includeClan, includeLeague });
  for (const current of currentRows) {
    const bundle = current.source_mode === "league"
      ? await getLeagueBundle(current.clan_name, bundleOptions)
      : await getClanBundle(current.clan_name, bundleOptions);
    const found = findOfflineStatusInBundle(bundle, userId, usernameKey);
    if (found) return found;
  }

  return null;
}

async function fetchOfflineCurrentRowsForUser(env, watch, options = {}) {
  const userId = toNumber(watch.roblox_user_id);
  const username = String(watch.roblox_username || "").trim();
  const filters = userId
    ? { user_id: `eq.${userId}` }
    : { display_name: `ilike.${username}` };
  const clanFilters = userId
    ? { user_id: `eq.${userId}` }
    : { username: `ilike.${username}` };
  const includeClan = options.includeClan !== false;
  const includeLeague = options.includeLeague !== false;
  const [activityRows, memberRows, leagueRows] = await Promise.all([
    includeClan ? supabaseSelect(env, CLAN_ACTIVITY_CURRENT_TABLE, {
      select: "battle_key,battle_display_name,clan_name,clan_key,member_rank,user_id,username,points,fetched_at,updated_at",
      ...clanFilters,
      order: "fetched_at.desc",
      limit: "10"
    }).catch(() => []) : Promise.resolve([]),
    includeClan ? supabaseSelect(env, CURRENT_TABLE, {
      select: "battle_key,battle_display_name,clan_name,rank,user_id,username,total_points,fetched_at,updated_at",
      ...clanFilters,
      order: "fetched_at.desc",
      limit: "10"
    }).catch(() => []) : Promise.resolve([]),
    includeLeague ? supabaseSelect(env, LEAGUE_CURRENT_TABLE, {
      select: "league_run_key,league_name,rank,user_id,display_name,points,last_contribution_at,fetched_at,updated_at",
      ...filters,
      order: "fetched_at.desc",
      limit: "10"
    }).catch(() => []) : Promise.resolve([])
  ]);

  return mergeOfflineCurrentRows([
    ...activityRows.map(row => normalizeOfflineMemberRow(row, "activity_current")),
    ...memberRows.map(row => normalizeOfflineMemberRow(row, "member_current")),
    ...leagueRows.map(row => normalizeOfflineMemberRow(row, "league_current"))
  ]);
}

function computeOfflineMemberStatuses(currentRows, historyRows) {
  const historyByUser = groupRowsBy(historyRows, row => row.user_key);
  const statuses = [];

  for (const current of currentRows) {
    if (!current.user_key) continue;
    const timeline = [...(historyByUser.get(current.user_key) || [])];
    if (!timeline.some(row => row.snapshot_at === current.snapshot_at && row.points === current.points)) {
      timeline.push(current);
    }
    timeline.sort((a, b) => (isoToMs(a.snapshot_at) || 0) - (isoToMs(b.snapshot_at) || 0));

    const latestMs = isoToMs(current.snapshot_at) || Date.now();
    let lastGainAt = null;
    let previousPoints = null;
    let pointsOneHourAgo = null;
    const hourAgoMs = latestMs - 60 * 60 * 1000;

    for (const row of timeline) {
      const rowMs = isoToMs(row.snapshot_at);
      if (rowMs !== null && rowMs <= hourAgoMs) pointsOneHourAgo = row.points;
      if (previousPoints !== null && row.points > previousPoints) {
        lastGainAt = row.snapshot_at;
      }
      previousPoints = row.points;
    }

    if (pointsOneHourAgo === null && timeline.length) pointsOneHourAgo = timeline[0].points;
    const earliestAt = timeline[0]?.snapshot_at || current.snapshot_at;
    const offlineSince = lastGainAt || earliestAt || current.snapshot_at;
    const offlineSinceMs = isoToMs(offlineSince) || latestMs;
    const offlineMinutes = Math.max(0, Math.floor((latestMs - offlineSinceMs) / 60000));

    statuses.push({
      ...current,
      last_gain_at: lastGainAt,
      offline_since: offlineSince,
      offline_minutes: offlineMinutes,
      gain_1h: Math.max(0, current.points - (pointsOneHourAgo ?? current.points)),
      sample_count: timeline.length
    });
  }

  return statuses.sort((a, b) => b.offline_minutes - a.offline_minutes || b.points - a.points);
}

async function postOfflinePingAlerts(env, config, alerts, checkedAt, options = {}) {
  const destinationScope = normalizeOfflinePingDestinationScope(options.destinationScope) || "clan";
  const channelId = String(options.channelId || offlinePingDestinationChannelId(config, destinationScope)).trim();
  // Discord components have a practical content limit.  Preserve every
  // qualified member instead of truncating the end of a large clan alert.
  const chunks = chunkOfflinePingAlerts(alerts, 12);
  const messageIds = [];
  for (const chunk of chunks) {
    const body = offlinePingAlertMessageBody(chunk, checkedAt, {
      thresholdMinutes: options.thresholdMinutes || config.minutes_threshold || offlineDefaultMinutes(env),
      postRateMinutes: options.postRateMinutes || config.post_rate_minutes || offlineDefaultPostRateMinutes(env),
      mentionMappedUsers: destinationScope === "users" || destinationScope === "clan"
    });
    const result = await discordBotChannelMessageRequest(env, {
      method: "POST",
      channelId,
      body
    });
    if (!result.ok) {
      throw httpError(502, result.error || "Discord offline ping post failed.");
    }
    if (stringOrNull(result.body?.id)) messageIds.push(stringOrNull(result.body.id));
  }
  return {
    posted: true,
    message_id: messageIds[0] || null,
    message_ids: messageIds,
    message_count: chunks.length,
    channel_id: channelId
  };
}

function splitOfflinePingAlertsByDestination(config, alerts) {
  const groupsByKey = new Map();

  for (const alert of alerts) {
    const scope = offlineAlertDeliveryScope(alert);
    const channelId = scope === "users"
      ? offlineUserWatchChannelId(alert?.watch) || offlinePingDestinationChannelId(config, "users")
      : scope === "league"
        ? offlinePingDestinationChannelId(config, "league")
        : offlinePingDestinationChannelId(config, "clan");
    // A clan has its own message stream and cooldown.  Direct watches retain
    // the existing shared channel batching behavior.
    const destinationKey = scope === "clan"
      ? normalizeText(alert?.status?.clan_name || alert?.watch?.clan_name || "unassigned")
      : "";
    const key = `${scope}|${channelId || ""}|${destinationKey}`;
    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        scope,
        channel_id: channelId || "",
        destination_key: destinationKey,
        alerts: []
      });
    }
    groupsByKey.get(key).alerts.push(alert);
  }

  return [...groupsByKey.values()].filter(group => group.alerts.length);
}

function offlineAlertDeliveryScope(alert) {
  if (alert?.scope === "league") return "league";
  if (alert?.scope === "clan") return "clan";
  return normalizeOfflinePingDeliveryScope(alert?.delivery_scope || alert?.watch?.delivery_scope) || "users";
}

function chunkOfflinePingAlerts(alerts, maxPerPost = 12) {
  const size = clamp(Number(maxPerPost) || 12, 1, 25);
  const chunks = [];
  for (let index = 0; index < alerts.length; index += size) {
    chunks.push(alerts.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function normalizeOfflinePingDestinationScope(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["clan", "clans", "clan-wide", "clan_wide"].includes(text)) return "clan";
  if (["league", "leagues", "league-wide", "league_wide"].includes(text)) return "league";
  if (["user", "users", "direct", "direct-users", "direct_users"].includes(text)) return "users";
  return "";
}

function normalizeOfflinePingDeliveryScope(value) {
  const scope = normalizeOfflinePingDestinationScope(value);
  return scope === "clan" || scope === "users" ? scope : "";
}

function normalizeOfflineWatchSourceMode(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || ["auto", "any", "all"].includes(text)) return "auto";
  if (["clan", "clans", "battle", "battles"].includes(text)) return "clan";
  if (["league", "leagues"].includes(text)) return "league";
  return "";
}

function offlineMemberMappingForStatus(mappings, status) {
  if (!Array.isArray(mappings) || !mappings.length || !status) return null;
  const userId = String(toNumber(status.user_id) || "").trim();
  const usernameKey = normalizeText(status.username || status.user_key);
  return mappings.find(mapping => {
    const mappedUserId = String(toNumber(mapping?.roblox_user_id) || "").trim();
    if (userId && mappedUserId && userId === mappedUserId) return true;
    const mappedNameKey = normalizeText(mapping?.roblox_username || mapping?.roblox_username_key);
    return Boolean(usernameKey && mappedNameKey && usernameKey === mappedNameKey);
  }) || null;
}

function offlinePingDestinationChannelId(config, scope) {
  const normalizedScope = normalizeOfflinePingDestinationScope(scope) || "clan";
  const scopedChannel = normalizedScope === "users"
    ? config?.users_channel_id
    : normalizedScope === "league"
      ? config?.league_channel_id
      : config?.clan_channel_id;
  return String(scopedChannel || config?.channel_id || "").trim();
}

function offlineUserWatchChannelId(watch) {
  const channelId = String(watch?.channel_id || "").trim();
  return /^\d{5,30}$/.test(channelId) ? channelId : "";
}

function hasOfflinePingDestination(config) {
  return /^\d{5,30}$/.test(offlinePingDestinationChannelId(config, "clan"))
    || /^\d{5,30}$/.test(offlinePingDestinationChannelId(config, "league"))
    || /^\d{5,30}$/.test(offlinePingDestinationChannelId(config, "users"));
}

function roverApiKey(env) {
  return String(env.ROVER_API_KEY || "").trim();
}

function roverRegistryApiBase(env) {
  return String(env.ROVER_REGISTRY_API_BASE || "https://registry.rover.link/api")
    .trim()
    .replace(/\/$/, "");
}

function bloxlinkApiBase(env) {
  return String(env.BLOXLINK_API_BASE || "https://api.blox.link/v4/public")
    .trim()
    .replace(/\/$/, "");
}

// Bloxlink issues keys per Discord server. A JSON map keeps a multi-server
// Luna deployment safe without accidentally using one server's key elsewhere.
function bloxlinkGuildApiKey(env, guildId) {
  const fallback = String(env.BLOXLINK_API_KEY || "").trim();
  const raw = String(env.BLOXLINK_GUILD_API_KEYS_JSON || "").trim();
  if (!raw) return fallback;
  try {
    const keys = JSON.parse(raw);
    if (keys && typeof keys === "object" && !Array.isArray(keys)) {
      return String(keys[String(guildId)] || keys.default || fallback).trim();
    }
  } catch (err) {
    console.warn("BLOXLINK_GUILD_API_KEYS_JSON is not valid JSON", String(err?.message || err || "unknown error"));
  }
  return fallback;
}

function roverPositiveCacheMinutes(env) {
  return clamp(Number(env.ROVER_CACHE_MINUTES || 720), 15, 10080);
}

function roverNegativeCacheMinutes(env) {
  return clamp(Number(env.ROVER_NEGATIVE_CACHE_MINUTES || 30), 5, 1440);
}

function roverErrorCacheMinutes(env) {
  return clamp(Number(env.ROVER_ERROR_CACHE_MINUTES || 5), 1, 60);
}

function roverCacheIsFresh(row, nowMs = Date.now()) {
  const expiresAt = Date.parse(String(row?.expires_at || ""));
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

function roverDiscordIdsFromValue(value, depth = 0) {
  // RoVer has returned discordUsers as both an array and an ID-keyed object.
  // Keep this traversal scoped to that field so it cannot mistake the response's
  // guildId or robloxId for a Discord user ID.
  if (value == null || depth > 6) return [];
  if (typeof value === "string" || typeof value === "number") {
    const discordUserId = parseDiscordUserId(value);
    return discordUserId ? [discordUserId] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => roverDiscordIdsFromValue(item, depth + 1));
  }
  if (typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const keyUserId = parseDiscordUserId(key);
    // Do not traverse known non-Discord identifiers when RoVer nests metadata
    // alongside the matching Discord-user object.
    const skipValue = /^(?:guild_?id|roblox_?id)$/i.test(key);
    return [
      ...(keyUserId ? [keyUserId] : []),
      ...(skipValue ? [] : roverDiscordIdsFromValue(nestedValue, depth + 1))
    ];
  });
}

function roverDiscordUserIdFromPayload(payload) {
  const nested = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const roverUsers = [
    ...(Array.isArray(payload?.discordUsers) ? payload.discordUsers : [payload?.discordUsers]),
    ...(Array.isArray(nested?.discordUsers) ? nested.discordUsers : [nested?.discordUsers])
  ].filter(Boolean);
  const candidates = [
    payload?.discordId,
    payload?.discord_id,
    payload?.discordIds,
    ...(Array.isArray(payload?.discordIDs) ? payload.discordIDs : []),
    ...(Array.isArray(payload?.discord_ids) ? payload.discord_ids : []),
    ...(Array.isArray(payload?.discordIds) ? payload.discordIds : []),
    nested?.discordId,
    nested?.discord_id,
    nested?.discordIds,
    ...(Array.isArray(nested?.discordIDs) ? nested.discordIDs : []),
    ...(Array.isArray(nested?.discord_ids) ? nested.discord_ids : []),
    ...(Array.isArray(nested?.discordIds) ? nested.discordIds : []),
    ...roverUsers.flatMap(user => roverDiscordIdsFromValue(user))
  ];
  return candidates.map(parseDiscordUserId).find(Boolean) || null;
}

function bloxlinkDiscordUserIdFromPayload(payload) {
  const nested = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const candidates = [
    payload?.discordID,
    payload?.discordId,
    payload?.discord_id,
    ...(Array.isArray(payload?.discordIDs) ? payload.discordIDs : []),
    ...(Array.isArray(payload?.discordIds) ? payload.discordIds : []),
    ...(Array.isArray(payload?.discord_ids) ? payload.discord_ids : []),
    nested?.discordID,
    nested?.discordId,
    nested?.discord_id,
    ...(Array.isArray(nested?.discordIDs) ? nested.discordIDs : []),
    ...(Array.isArray(nested?.discordIds) ? nested.discordIds : []),
    ...(Array.isArray(nested?.discord_ids) ? nested.discord_ids : [])
  ];
  return candidates.map(parseDiscordUserId).find(Boolean) || null;
}

async function fetchRoVerDiscordUserLink(env, guildId, robloxUserId) {
  const apiKey = roverApiKey(env);
  const safeGuildId = String(guildId || "").trim();
  const safeRobloxUserId = toNumber(robloxUserId);
  const endpoint = safeGuildId && safeRobloxUserId
    ? `${roverRegistryApiBase(env)}/guilds/${encodeURIComponent(safeGuildId)}/roblox-to-discord/${encodeURIComponent(safeRobloxUserId)}`
    : null;
  if (!apiKey) {
    return {
      endpoint,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: "ROVER_API_KEY is not configured."
    };
  }
  if (!endpoint) {
    return {
      endpoint: null,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: "A valid Discord server ID and Roblox user ID are required."
    };
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "Luna-PS99-Bot/1.0"
      }
    });
    const rawBody = await response.text().catch(() => "");
    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      // Preserve the HTTP status/body below if RoVer returns a non-JSON error page.
      payload = {};
    }
    const responseKeys = payload && typeof payload === "object" && !Array.isArray(payload)
      ? Object.keys(payload).slice(0, 25)
      : [];
    const responseMessage = String(payload?.message || payload?.error || "").trim().slice(0, 300) || null;
    const discordUserId = response.ok ? roverDiscordUserIdFromPayload(payload) : null;

    if (response.ok && discordUserId) {
      return {
        endpoint,
        http_status: response.status,
        lookup_state: "matched",
        discord_user_id: discordUserId,
        response_keys: responseKeys,
        response_message: responseMessage,
        error: null
      };
    }
    if (response.status === 404) {
      return {
        endpoint,
        http_status: response.status,
        lookup_state: "not_found",
        discord_user_id: null,
        response_keys: responseKeys,
        response_message: responseMessage,
        error: null
      };
    }
    return {
      endpoint,
      http_status: response.status,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: responseKeys,
      response_message: responseMessage,
      error: response.ok
        ? "RoVer returned a successful response without a supported Discord-user-ID field."
        : `RoVer returned HTTP ${response.status}${rawBody ? `: ${rawBody.slice(0, 300)}` : ""}`
    };
  } catch (err) {
    return {
      endpoint,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: `RoVer lookup failed: ${String(err?.message || err || "unknown error").slice(0, 500)}`
    };
  }
}

async function fetchBloxlinkDiscordUserLink(env, guildId, robloxUserId) {
  const safeGuildId = String(guildId || "").trim();
  const safeRobloxUserId = toNumber(robloxUserId);
  const apiKey = bloxlinkGuildApiKey(env, safeGuildId);
  const endpoint = safeGuildId && safeRobloxUserId
    ? `${bloxlinkApiBase(env)}/guilds/${encodeURIComponent(safeGuildId)}/roblox-to-discord/${encodeURIComponent(safeRobloxUserId)}`
    : null;
  if (!apiKey) {
    return {
      endpoint,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: "No Bloxlink API key is configured for this Discord server."
    };
  }
  if (!endpoint) {
    return {
      endpoint: null,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: "A valid Discord server ID and Roblox user ID are required."
    };
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: apiKey,
        "User-Agent": "Luna-PS99-Bot/1.0"
      }
    });
    const rawBody = await response.text().catch(() => "");
    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = {};
    }
    const responseKeys = payload && typeof payload === "object" && !Array.isArray(payload)
      ? Object.keys(payload).slice(0, 25)
      : [];
    const responseMessage = String(payload?.message || payload?.error || "").trim().slice(0, 300) || null;
    const discordUserId = response.ok ? bloxlinkDiscordUserIdFromPayload(payload) : null;
    if (response.ok && discordUserId) {
      return { endpoint, http_status: response.status, lookup_state: "matched", discord_user_id: discordUserId, response_keys: responseKeys, response_message: responseMessage, error: null };
    }
    if (response.status === 404) {
      return { endpoint, http_status: response.status, lookup_state: "not_found", discord_user_id: null, response_keys: responseKeys, response_message: responseMessage, error: null };
    }
    return {
      endpoint,
      http_status: response.status,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: responseKeys,
      response_message: responseMessage,
      error: response.ok
        ? "Bloxlink returned a successful response without a supported Discord-user-ID field."
        : `Bloxlink returned HTTP ${response.status}${rawBody ? `: ${rawBody.slice(0, 300)}` : ""}`
    };
  } catch (err) {
    return {
      endpoint,
      http_status: null,
      lookup_state: "error",
      discord_user_id: null,
      response_keys: [],
      error: `Bloxlink lookup failed: ${String(err?.message || err || "unknown error").slice(0, 500)}`
    };
  }
}

function offlineLookupStateBase(value) {
  const state = String(value || "").trim().toLowerCase();
  if (state.startsWith("matched")) return "matched";
  if (state.startsWith("not_found")) return "not_found";
  return "error";
}

function offlineLookupProviderLabel(value) {
  return String(value || "").toLowerCase().includes("bloxlink") ? "Bloxlink" : "RoVer";
}

async function cacheOfflineDiscordUserLink(env, guildId, robloxUserId, probe, provider = "rover") {
  const nowMs = Date.now();
  const baseState = offlineLookupStateBase(probe?.lookup_state);
  const cacheMinutes = baseState === "matched"
    ? roverPositiveCacheMinutes(env)
    : baseState === "not_found"
      ? roverNegativeCacheMinutes(env)
      : roverErrorCacheMinutes(env);
  const now = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + cacheMinutes * 60 * 1000).toISOString();
  await supabaseUpsert(env, DISCORD_ROVER_MEMBER_LINKS_TABLE, [{
    guild_id: String(guildId),
    roblox_user_id: toNumber(robloxUserId),
    discord_user_id: probe?.discord_user_id || null,
    lookup_state: `${baseState}_${String(provider || "rover").toLowerCase()}`,
    last_error: probe?.error || null,
    last_checked_at: now,
    expires_at: expiresAt,
    updated_at: now
  }], "guild_id,roblox_user_id");
}

async function resolveOfflineDiscordUserLink(env, guildId, robloxUserId) {
  const safeGuildId = String(guildId || "").trim();
  const safeRobloxUserId = toNumber(robloxUserId);
  if (!/^\d{5,30}$/.test(safeGuildId) || !safeRobloxUserId) return null;
  const hasRoVer = Boolean(roverApiKey(env));
  const hasBloxlink = Boolean(bloxlinkGuildApiKey(env, safeGuildId));
  if (!hasRoVer && !hasBloxlink) return null;

  const nowMs = Date.now();
  const cached = await supabaseSelect(env, DISCORD_ROVER_MEMBER_LINKS_TABLE, {
    select: "discord_user_id,lookup_state,expires_at",
    guild_id: `eq.${safeGuildId}`,
    roblox_user_id: `eq.${safeRobloxUserId}`,
    limit: "1"
  }).catch(() => []);
  const cachedRow = cached[0] || null;
  if (roverCacheIsFresh(cachedRow, nowMs)) {
    const discordUserId = parseDiscordUserId(cachedRow.discord_user_id);
    if (offlineLookupStateBase(cachedRow.lookup_state) === "matched" && discordUserId) {
      return { discord_user_id: discordUserId, provider: offlineLookupProviderLabel(cachedRow.lookup_state) };
    }
    // A negative Bloxlink result is the final fallback. Legacy/older RoVer
    // cache entries are deliberately allowed through so Bloxlink can fill
    // existing servers immediately after this feature is deployed.
    if (String(cachedRow.lookup_state || "").toLowerCase().includes("bloxlink")) return null;
  }

  let lastProbe = null;
  let lastProvider = "rover";
  if (hasRoVer) {
    const probe = await fetchRoVerDiscordUserLink(env, safeGuildId, safeRobloxUserId);
    if (probe.lookup_state === "matched" && parseDiscordUserId(probe.discord_user_id)) {
      await cacheOfflineDiscordUserLink(env, safeGuildId, safeRobloxUserId, probe, "rover").catch(err => {
        console.warn("RoVer cache write failed", String(err?.message || err || "unknown error"));
      });
      return { discord_user_id: parseDiscordUserId(probe.discord_user_id), provider: "RoVer" };
    }
    lastProbe = probe;
  }
  if (hasBloxlink) {
    const probe = await fetchBloxlinkDiscordUserLink(env, safeGuildId, safeRobloxUserId);
    lastProbe = probe;
    lastProvider = "bloxlink";
    if (probe.lookup_state === "matched" && parseDiscordUserId(probe.discord_user_id)) {
      await cacheOfflineDiscordUserLink(env, safeGuildId, safeRobloxUserId, probe, "bloxlink").catch(err => {
        console.warn("Bloxlink cache write failed", String(err?.message || err || "unknown error"));
      });
      return { discord_user_id: parseDiscordUserId(probe.discord_user_id), provider: "Bloxlink" };
    }
  }
  if (lastProbe) {
    await cacheOfflineDiscordUserLink(env, safeGuildId, safeRobloxUserId, lastProbe, lastProvider).catch(err => {
      console.warn("Offline member-link cache write failed", String(err?.message || err || "unknown error"));
    });
  }

  return null;
}

async function resolveOfflineAlertDiscordMentions(env, guildId, alerts) {
  if ((!roverApiKey(env) && !bloxlinkGuildApiKey(env, guildId)) || !Array.isArray(alerts) || !alerts.length) return alerts;

  const lookupByRobloxUserId = new Map();
  return runLimited(alerts, 4, async alert => {
    // Clan watches are the explicit opt-in for a clan-wide ping board. League
    // rosters stay unmentioned: one League can contain unrelated players.
    if (!['user', 'clan'].includes(alert?.scope) || parseDiscordUserId(alert?.watch?.discord_user_id)) return alert;

    const robloxUserId = toNumber(alert?.status?.user_id || alert?.watch?.roblox_user_id);
    if (!robloxUserId) return alert;
    const lookupKey = String(robloxUserId);
    if (!lookupByRobloxUserId.has(lookupKey)) {
      lookupByRobloxUserId.set(lookupKey, resolveOfflineDiscordUserLink(env, guildId, robloxUserId).catch(() => null));
    }
    const resolved = await lookupByRobloxUserId.get(lookupKey);
    if (!resolved?.discord_user_id) return alert;

    return {
      ...alert,
      watch: {
        ...(alert.watch || {}),
        discord_user_id: resolved.discord_user_id,
        discord_label: resolved.provider
      }
    };
  });
}

function offlinePingAlertMessageBody(alerts, checkedAt, options = {}) {
  const threshold = options.thresholdMinutes || DEFAULT_OFFLINE_ALERT_MINUTES;
  const postRate = options.postRateMinutes || DEFAULT_OFFLINE_POST_RATE_MINUTES;
  const directAlerts = alerts.filter(alert => offlineAlertDeliveryScope(alert) === "users");
  const clanAlerts = alerts.filter(alert => offlineAlertDeliveryScope(alert) === "clan");
  const leagueAlerts = alerts.filter(alert => alert.scope === "league");
  const sections = [];

  if (directAlerts.length) {
    sections.push([
      "## Direct User Watches",
      ...directAlerts.map(alert => offlineAlertLine(alert, options.mentionMappedUsers === true)),
      directAlerts.length > 15 ? `-# ...and ${directAlerts.length - 15} more direct user watch${directAlerts.length - 15 === 1 ? "" : "es"}.` : ""
    ].filter(Boolean).join("\n"));
  }

  if (clanAlerts.length) {
    const byClan = groupRowsBy(clanAlerts, alert => normalizeText(alert.status.clan_name || alert.watch.clan_name));
    const lines = [];
    for (const [clanKey, rows] of byClan.entries()) {
      const clanNameValue = rows[0]?.status?.clan_name || rows[0]?.watch?.clan_name || clanKey;
      lines.push(`### ${escapeDiscordMarkdown(clanNameValue)}`);
      rows.forEach(alert => lines.push(offlineAlertLine(alert, options.mentionMappedUsers === true, { includeClan: false })));
    }
    sections.push(["## Clan Watches", ...lines].join("\n").slice(0, 4000));
  }

  if (leagueAlerts.length) {
    const byLeague = groupRowsBy(leagueAlerts, alert => normalizeText(alert.status.clan_name || alert.watch.league_name));
    const lines = [];
    for (const [leagueKey, rows] of byLeague.entries()) {
      const leagueNameValue = rows[0]?.status?.clan_name || rows[0]?.watch?.league_name || leagueKey;
      lines.push(`### ${escapeDiscordMarkdown(leagueNameValue)}`);
      rows.forEach(alert => lines.push(offlineAlertLine(alert, false, { includeClan: false })));
    }
    sections.push(["## League Watches", ...lines].join("\n").slice(0, 4000));
  }

  const mentionIds = uniqueValues([...directAlerts, ...clanAlerts]
    .map(alert => parseDiscordUserId(alert.watch?.discord_user_id))
    .filter(Boolean));
  const payload = persistentDiscordComponentPayload("⏰ Offline Pings", sections, checkedAt, {
    headerSummary: [
      `**Threshold:** ${threshold}m with no point gain`,
      `**Post Rate:** ${postRate}m`,
      `Last Checked: ${discordTimestamp(checkedAt, "R")}`
    ].join("\n")
  });
  return {
    ...payload,
    allowed_mentions: {
      parse: [],
      users: options.mentionMappedUsers === true ? mentionIds : []
    }
  };
}

function offlineAlertLine(alert, includeMention, options = {}) {
  const status = alert.status || {};
  const watch = alert.watch || {};
  const mentionId = parseDiscordUserId(watch.discord_user_id);
  const mention = includeMention && mentionId ? `<@${mentionId}> ` : "";
  const name = escapeDiscordMarkdown(status.username || watch.roblox_username || "Unknown");
  const clan = escapeDiscordMarkdown(status.clan_name || watch.clan_name || "");
  const clanPart = options.includeClan === false || !clan ? "" : ` · ${clan}`;
  const points = Math.max(0, Math.round(toNumber(status.points) || 0)).toLocaleString("en-US");
  const oneHour = Math.max(0, Math.round(toNumber(status.gain_1h) || 0)).toLocaleString("en-US");
  return `- ${mention}**${name}**${clanPart} · ${formatOfflineMinutes(status.offline_minutes)} no gain · ${points} pts · +${oneHour}/1h`;
}

function offlineStateRow({
  guildId,
  scope,
  subjectKey,
  trackedUserKey,
  watch,
  status,
  alertActive,
  checkedAt,
  lastError = null
}) {
  return {
    guild_id: guildId,
    scope,
    subject_key: subjectKey,
    tracked_user_key: trackedUserKey,
    clan_name: status?.clan_name || watch?.clan_name || null,
    clan_key: normalizeText(status?.clan_name || watch?.clan_name),
    user_id: toNumber(status?.user_id || watch?.roblox_user_id),
    username: status?.username || watch?.roblox_username || null,
    discord_user_id: parseDiscordUserId(watch?.discord_user_id),
    last_points: toNumber(status?.points),
    last_snapshot_at: status?.snapshot_at || null,
    last_gain_at: status?.last_gain_at || null,
    offline_since: status?.offline_since || null,
    offline_minutes: toNumber(status?.offline_minutes),
    alert_active: alertActive === true,
    last_error: lastError,
    updated_at: checkedAt,
    created_at: checkedAt
  };
}

function offlineStateWithDeliveryState(row, existingState) {
  if (row?.alert_active === true) {
    return {
      ...row,
      last_alert_at: row.last_alert_at || existingState?.last_alert_at || null,
      last_alert_message_id: row.last_alert_message_id || existingState?.last_alert_message_id || null
    };
  }

  return {
    ...row,
    last_alert_at: null,
    last_alert_message_id: null
  };
}

function normalizeOfflineMemberRow(row, source) {
  const userId = toNumber(row.user_id);
  const sourceMode = String(source || "").startsWith("league") ? "league" : "clan";
  const username = String(row.username || row.display_name || (userId ? `user_${userId}` : "")).trim();
  const userKey = userId ? `id:${userId}` : `name:${normalizeText(username)}`;
  const groupName = sourceMode === "league"
    ? (row.league_name || row.clan_name || "")
    : (row.clan_name || row.league_name || "");
  return {
    source,
    source_mode: sourceMode,
    battle_key: row.battle_key || row.league_run_key || null,
    battle_display_name: sourceMode === "league"
      ? String(row.league_run_key || row.battle_display_name || "").trim()
      : cleanBattleDisplayName(row.battle_key, row.battle_display_name),
    clan_name: groupName,
    clan_key: normalizeText(row.clan_key || row.league_key || groupName),
    rank: toNumber(row.member_rank ?? row.rank),
    user_id: userId,
    username,
    user_key: userKey,
    username_key: normalizeText(username),
    points: Math.max(0, toNumber(row.points ?? row.total_points) || 0),
    snapshot_at: safeIso(row.fetched_at || row.updated_at) || new Date().toISOString()
  };
}

function mergeOfflineCurrentRows(rows) {
  const byUser = new Map();
  for (const row of rows.filter(row => row.user_key && row.clan_key)) {
    const existing = byUser.get(row.user_key);
    if (!existing || (isoToMs(row.snapshot_at) || 0) > (isoToMs(existing.snapshot_at) || 0)) {
      byUser.set(row.user_key, row);
    }
  }
  return [...byUser.values()];
}

function newestOfflineBattleKey(rows) {
  const latest = [...rows].sort((a, b) => (isoToMs(b.snapshot_at) || 0) - (isoToMs(a.snapshot_at) || 0))[0];
  return latest?.battle_key || null;
}

function findOfflineStatusInBundle(bundle, userId, usernameKey) {
  if (!bundle?.statuses?.length) return null;
  return bundle.statuses.find(status => (
    (userId && toNumber(status.user_id) === userId) ||
    (usernameKey && status.username_key === usernameKey)
  )) || null;
}

function offlineAlertDue(state, postRateMinutes, checkedAt) {
  if (!state?.alert_active) return true;
  return offlinePostRateDue(state, postRateMinutes, checkedAt);
}

function offlinePostRateDue(state, postRateMinutes, checkedAt) {
  const lastAlertMs = isoToMs(state?.last_alert_at);
  const checkedMs = isoToMs(checkedAt) || Date.now();
  if (!lastAlertMs) return true;
  return checkedMs - lastAlertMs >= clamp(Number(postRateMinutes || DEFAULT_OFFLINE_POST_RATE_MINUTES), 1, 1440) * 60 * 1000;
}

function offlineDestinationStateMapKey(guildId, channelId, destinationKey = "") {
  return offlineStateMapKey({
    guild_id: guildId,
    scope: "clan",
    subject_key: offlineDestinationSubjectKey(channelId, destinationKey),
    tracked_user_key: "__channel__"
  });
}

function offlineDestinationSubjectKey(channelId, destinationKey = "") {
  const scope = normalizeText(destinationKey);
  return `channel:${String(channelId || "").trim()}${scope ? `|group:${scope}` : ""}`;
}

function offlineDestinationStateRow({
  guildId,
  channelId,
  destinationKey = "",
  checkedAt,
  lastAlertAt = null,
  lastMessageId = null,
  lastError = null
}) {
  return {
    guild_id: guildId,
    scope: "clan",
    subject_key: offlineDestinationSubjectKey(channelId, destinationKey),
    tracked_user_key: "__channel__",
    clan_name: null,
    clan_key: null,
    user_id: null,
    username: null,
    discord_user_id: null,
    last_points: null,
    last_snapshot_at: null,
    last_gain_at: null,
    offline_since: null,
    offline_minutes: null,
    alert_active: false,
    last_alert_at: lastAlertAt,
    last_alert_message_id: lastMessageId,
    last_error: lastError,
    updated_at: checkedAt,
    created_at: checkedAt
  };
}

function offlineStateMapKey(row) {
  return [
    row.guild_id,
    row.scope,
    row.subject_key,
    row.tracked_user_key
  ].map(value => String(value || "")).join("|");
}

function offlineUserSubjectKey(watch) {
  return watch.roblox_user_id ? `id:${watch.roblox_user_id}` : `name:${normalizeText(watch.roblox_username)}`;
}

function normalizeOfflinePingConfigOutput(row) {
  return {
    guild_id: String(row.guild_id || ""),
    channel_id: row.channel_id || null,
    channel_type: toNumber(row.channel_type),
    clan_channel_id: row.clan_channel_id || row.channel_id || null,
    clan_channel_type: toNumber(row.clan_channel_type ?? row.channel_type),
    league_channel_id: row.league_channel_id || row.channel_id || null,
    league_channel_type: toNumber(row.league_channel_type ?? row.channel_type),
    users_channel_id: row.users_channel_id || row.channel_id || null,
    users_channel_type: toNumber(row.users_channel_type ?? row.channel_type),
    minutes_threshold: toNumber(row.minutes_threshold) || DEFAULT_OFFLINE_ALERT_MINUTES,
    post_rate_minutes: toNumber(row.post_rate_minutes) || DEFAULT_OFFLINE_POST_RATE_MINUTES,
    enabled: row.enabled !== false,
    clan_watches_enabled: row.clan_watches_enabled !== false,
    league_watches_enabled: row.league_watches_enabled !== false,
    user_watches_enabled: row.user_watches_enabled !== false,
    assigned_by: row.assigned_by || null,
    updated_by: row.updated_by || null,
    last_checked_at: row.last_checked_at || null,
    last_posted_at: row.last_posted_at || null,
    last_error: row.last_error || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeOfflinePingClanOutput(row) {
  return {
    guild_id: String(row.guild_id || ""),
    clan_name: row.clan_name || "",
    clan_key: row.clan_key || normalizeText(row.clan_name),
    enabled: row.enabled !== false,
    created_by: row.created_by || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeOfflinePingLeagueOutput(row) {
  return {
    guild_id: String(row.guild_id || ""),
    league_name: row.league_name || "",
    league_key: row.league_key || normalizeText(row.league_name),
    enabled: row.enabled !== false,
    created_by: row.created_by || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeOfflinePingUserOutput(row) {
  return {
    guild_id: String(row.guild_id || ""),
    clan_name: row.clan_name || null,
    clan_key: row.clan_key || null,
    roblox_user_id: toNumber(row.roblox_user_id),
    roblox_username: row.roblox_username || "",
    roblox_username_key: row.roblox_username_key || normalizeText(row.roblox_username),
    source_mode: normalizeOfflineWatchSourceMode(row.source_mode) || "auto",
    delivery_scope: normalizeOfflinePingDeliveryScope(row.delivery_scope) || "users",
    discord_user_id: parseDiscordUserId(row.discord_user_id),
    discord_label: row.discord_label || null,
    channel_id: row.channel_id || null,
    channel_type: toNumber(row.channel_type),
    enabled: row.enabled !== false,
    created_by: row.created_by || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

async function ensureOfflineGuildConfig(env, guildId, body = {}) {
  const existing = await supabaseSelect(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, {
    select: "guild_id",
    guild_id: `eq.${guildId}`,
    limit: "1"
  }).catch(() => []);
  // `/offline mode` is the only source-mode control. Adding a watch or
  // assigning a destination may update metadata, but never turns a source on.
  if (existing.length) {
    const patch = {
      guild_id: guildId,
      updated_at: new Date().toISOString()
    };
    if (body.enabled !== undefined) patch.enabled = parseBooleanish(body.enabled) !== false;
    if (body.clan_watches_enabled !== undefined || body.clans_enabled !== undefined) {
      patch.clan_watches_enabled = parseBooleanish(body.clan_watches_enabled ?? body.clans_enabled) !== false;
    }
    if (body.league_watches_enabled !== undefined || body.leagues_enabled !== undefined) {
      patch.league_watches_enabled = parseBooleanish(body.league_watches_enabled ?? body.leagues_enabled) !== false;
    }
    if (body.user_watches_enabled !== undefined || body.users_enabled !== undefined) {
      patch.user_watches_enabled = parseBooleanish(body.user_watches_enabled ?? body.users_enabled) !== false;
    }
    if (body.updated_by !== undefined || body.created_by !== undefined) {
      patch.updated_by = stringOrNull(body.updated_by || body.created_by);
    }
    if (Object.keys(patch).length > 2) {
      await supabaseUpsert(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, [patch], "guild_id");
    }
    return;
  }

  const now = new Date().toISOString();
  await supabaseUpsert(env, DISCORD_OFFLINE_PING_GUILDS_TABLE, [{
    guild_id: guildId,
    minutes_threshold: clamp(Number(body.minutes_threshold || body.minutes || offlineDefaultMinutes(env)), 1, 1440),
    post_rate_minutes: clamp(Number(body.post_rate_minutes || body.post_rate || offlineDefaultPostRateMinutes(env)), 1, 1440),
    enabled: true,
    clan_watches_enabled: true,
    league_watches_enabled: true,
    user_watches_enabled: true,
    updated_by: stringOrNull(body.updated_by || body.created_by),
    created_at: now,
    updated_at: now
  }], "guild_id");
}

function parseDiscordUserId(value) {
  const text = String(value || "").trim();
  const mention = text.match(/^<@!?(\d{5,30})>$/);
  if (mention) return mention[1];
  return /^\d{5,30}$/.test(text) ? text : null;
}

function formatOfflineMinutes(value) {
  let minutes = Math.max(0, Math.floor(toNumber(value) || 0));
  const days = Math.floor(minutes / 1440);
  minutes -= days * 1440;
  const hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    minutes || (!days && !hours) ? `${minutes}m` : ""
  ].filter(Boolean).join(" ");
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
  let webhookAlert = emptyDiscordFeedResult(env, "ps99_updates", "no_version_change");

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
      : emptyDiscordFeedResult(env, "ps99_updates", "initial_version_baseline");
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

async function handleRobloxReleasedVersions(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || DEFAULT_ROBLOX_RELEASE_HISTORY_LIMIT), 1, 500);
  const channel = stringOrNull(url.searchParams.get("channel")) || robloxReleaseChannel(env);
  const binaryType = stringOrNull(url.searchParams.get("binary_type") || url.searchParams.get("binary")) || robloxReleaseBinaryType(env);
  const stateParams = {
    select: "channel,binary_type,current_version,client_version_upload,bootstrapper_version,next_client_version,next_client_version_upload,last_checked_at,updated_at",
    order: "channel.asc,binary_type.asc",
    limit: "100"
  };
  if (channel) stateParams.channel = `eq.${channel}`;
  if (binaryType) stateParams.binary_type = `eq.${binaryType}`;

  const eventParams = {
    select: "event_id,channel,binary_type,previous_version,current_version,previous_client_version_upload,current_client_version_upload,detected_at,source,created_at",
    order: "detected_at.desc,id.desc",
    limit: String(limit)
  };
  if (channel) eventParams.channel = `eq.${channel}`;
  if (binaryType) eventParams.binary_type = `eq.${binaryType}`;

  const [states, events] = await Promise.all([
    supabaseSelect(env, ROBLOX_RELEASE_STATE_TABLE, stateParams),
    supabaseSelect(env, ROBLOX_RELEASE_EVENTS_TABLE, eventParams)
  ]);
  const newestState = [...states].sort((a, b) => isoToMs(b.last_checked_at || b.updated_at) - isoToMs(a.last_checked_at || a.updated_at))[0] || null;
  const newestEvent = events[0] || null;

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    channel,
    binary_type: binaryType,
    current_version: newestState?.current_version || newestEvent?.current_version || null,
    client_version_upload: newestState?.client_version_upload || newestEvent?.current_client_version_upload || null,
    newest_detected_at: newestEvent?.detected_at || newestState?.last_checked_at || null,
    states: states.map(normalizeRobloxReleaseStateOutput),
    events: events.map(normalizeRobloxReleaseEventOutput)
  }, env, publicCacheSeconds(env, "ROBLOX_RELEASE_VERSION_HISTORY"));
}

async function handleRobloxReleasedVersionIngest(env, source, options = {}) {
  requireSupabase(env);

  const fetchedAt = new Date().toISOString();
  const channel = robloxReleaseChannel(env);
  const binaryType = robloxReleaseBinaryType(env);
  const existing = (await supabaseSelect(env, ROBLOX_RELEASE_STATE_TABLE, {
    select: "channel,binary_type,current_version,client_version_upload,bootstrapper_version,next_client_version,next_client_version_upload,last_checked_at,raw_version",
    channel: `eq.${channel}`,
    binary_type: `eq.${binaryType}`,
    limit: "1"
  }))[0] || null;

  const latest = await fetchRobloxReleasedVersion(env, binaryType, channel);
  const currentVersion = stringOrNull(latest.version);
  const clientVersionUpload = stringOrNull(latest.clientVersionUpload);
  const previousVersion = stringOrNull(existing?.current_version);
  const previousUpload = stringOrNull(existing?.client_version_upload);
  const changed = currentVersion !== previousVersion || clientVersionUpload !== previousUpload;

  const stateRow = {
    channel,
    binary_type: binaryType,
    current_version: currentVersion,
    client_version_upload: clientVersionUpload,
    bootstrapper_version: stringOrNull(latest.bootstrapperVersion),
    next_client_version: stringOrNull(latest.nextClientVersion),
    next_client_version_upload: stringOrNull(latest.nextClientVersionUpload),
    last_checked_at: fetchedAt,
    raw_version: latest.rawVersion || {},
    updated_at: fetchedAt
  };

  await supabaseUpsert(env, ROBLOX_RELEASE_STATE_TABLE, [stateRow], "channel,binary_type");

  let eventInserted = false;
  let webhookAlert = emptyDiscordFeedResult(env, "roblox_updates", "no_version_change");
  if (changed && (currentVersion || clientVersionUpload)) {
    const eventKey = `${currentVersion || "unknown"}:${clientVersionUpload || "unknown"}`.replace(/[^a-zA-Z0-9_.:-]/g, "_");
    await supabaseUpsert(env, ROBLOX_RELEASE_EVENTS_TABLE, [{
      event_id: `roblox:${channel}:${binaryType}:${eventKey}`,
      channel,
      binary_type: binaryType,
      previous_version: previousVersion,
      current_version: currentVersion,
      previous_client_version_upload: previousUpload,
      current_client_version_upload: clientVersionUpload,
      detected_at: fetchedAt,
      source,
      raw_version: latest.rawVersion || {}
    }], "event_id");
    eventInserted = true;
    webhookAlert = existing
      ? await postRobloxReleaseAlert(env, {
        channel,
        binary_type: binaryType,
        previous_version: previousVersion,
        current_version: currentVersion,
        previous_client_version_upload: previousUpload,
        current_client_version_upload: clientVersionUpload,
        detected_at: fetchedAt
      })
      : emptyDiscordFeedResult(env, "roblox_updates", "initial_version_baseline");
  }

  return json({
    ok: true,
    source,
    channel,
    binary_type: binaryType,
    fetched_at: fetchedAt,
    current_version: currentVersion,
    client_version_upload: clientVersionUpload,
    version_event_inserted: eventInserted,
    previous_version: previousVersion,
    previous_client_version_upload: previousUpload,
    webhook_alert: webhookAlert
  }, 202);
}

async function fetchRobloxReleasedVersion(env, binaryType, channel) {
  const primary = new URL(`https://clientsettings.roblox.com/v2/client-version/${encodeURIComponent(binaryType)}/channel/${encodeURIComponent(channel)}`);
  const fallback = new URL(`https://clientsettings.roblox.com/v2/client-version/${encodeURIComponent(binaryType)}`);
  let payload;
  try {
    payload = await fetchJsonWithRetry(primary, "Roblox released client version", {
      attempts: robloxReleaseFetchAttempts(env),
      baseDelayMs: 1000
    });
  } catch (err) {
    payload = await fetchJsonWithRetry(fallback, "Roblox released client version fallback", {
      attempts: robloxReleaseFetchAttempts(env),
      baseDelayMs: 1000
    });
  }

  return {
    version: firstDefined(payload.version, payload.clientVersion, payload.client_version),
    clientVersionUpload: firstDefined(payload.clientVersionUpload, payload.client_version_upload, payload.clientVersionUploadUrl),
    bootstrapperVersion: firstDefined(payload.bootstrapperVersion, payload.bootstrapper_version),
    nextClientVersion: firstDefined(payload.nextClientVersion, payload.next_client_version),
    nextClientVersionUpload: firstDefined(payload.nextClientVersionUpload, payload.next_client_version_upload),
    rawVersion: payload || {}
  };
}

function normalizeRobloxReleaseStateOutput(row) {
  return {
    channel: row.channel || null,
    binary_type: row.binary_type || null,
    current_version: row.current_version || null,
    client_version_upload: row.client_version_upload || null,
    bootstrapper_version: row.bootstrapper_version || null,
    next_client_version: row.next_client_version || null,
    next_client_version_upload: row.next_client_version_upload || null,
    last_checked_at: row.last_checked_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeRobloxReleaseEventOutput(row) {
  return {
    event_id: row.event_id || null,
    channel: row.channel || null,
    binary_type: row.binary_type || null,
    previous_version: row.previous_version || null,
    current_version: row.current_version || null,
    previous_client_version_upload: row.previous_client_version_upload || null,
    current_client_version_upload: row.current_client_version_upload || null,
    detected_at: row.detected_at || null,
    source: row.source || null,
    created_at: row.created_at || null
  };
}

async function handleRobloxFflags(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const [states, events] = await Promise.all([
    supabaseSelect(env, ROBLOX_FFLAG_STATE_TABLE, {
      select: "scope_key,source_url,settings_hash,setting_count,checked_at,updated_at",
      order: "checked_at.desc",
      limit: "20"
    }),
    supabaseSelect(env, ROBLOX_FFLAG_EVENTS_TABLE, {
      select: "event_id,scope_key,source_url,previous_hash,current_hash,added_keys,removed_keys,changed_keys,detected_at,source,created_at",
      order: "detected_at.desc,id.desc",
      limit: String(limit)
    })
  ]);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    note: "Tracks public Roblox client settings, not private Pet Simulator 99 server flags.",
    states,
    events
  }, env, publicCacheSeconds(env, "ROBLOX_FFLAGS"));
}

async function handleRobloxFflagIngest(env, source, options = {}) {
  requireSupabase(env);

  const checkedAt = new Date().toISOString();
  const sourceUrl = robloxFflagsSourceUrl(env);
  const scopeKey = stringOrNull(env.ROBLOX_FFLAGS_SCOPE_KEY) || "pc-live";
  const existing = (await supabaseSelect(env, ROBLOX_FFLAG_STATE_TABLE, {
    select: "scope_key,source_url,settings_hash,settings,setting_count,checked_at",
    scope_key: `eq.${scopeKey}`,
    limit: "1"
  }))[0] || null;
  const payload = await fetchJsonWithRetry(sourceUrl, "Roblox public client settings", {
    attempts: 3,
    baseDelayMs: 1000
  });
  const settings = normalizeRobloxFflagSettings(payload);
  const flatSettings = flattenJsonObject(settings);
  const settingsHash = await sha256Hex(stableJsonStringify(settings));
  const previousSettings = parseJsonObject(existing?.settings) || {};
  const diff = diffFlatSettings(flattenJsonObject(previousSettings), flatSettings);
  const changed = Boolean(existing?.settings_hash) && existing.settings_hash !== settingsHash;
  let eventInserted = false;
  let webhookAlert = emptyDiscordFeedResult(env, "ps99_fflags", "no_settings_change");

  if (changed) {
    const eventRow = {
      event_id: `roblox-fflags:${scopeKey}:${settingsHash}`,
      scope_key: scopeKey,
      source_url: sourceUrl,
      previous_hash: existing.settings_hash,
      current_hash: settingsHash,
      added_keys: diff.added,
      removed_keys: diff.removed,
      changed_keys: diff.changed,
      detected_at: checkedAt,
      source,
      raw_settings: settings
    };
    await supabaseUpsert(env, ROBLOX_FFLAG_EVENTS_TABLE, [eventRow], "event_id");
    eventInserted = true;
    webhookAlert = await postRobloxFflagAlert(env, eventRow);
  } else if (!existing) {
    webhookAlert = emptyDiscordFeedResult(env, "ps99_fflags", "initial_settings_baseline");
  }

  await supabaseUpsert(env, ROBLOX_FFLAG_STATE_TABLE, [{
    scope_key: scopeKey,
    source_url: sourceUrl,
    settings_hash: settingsHash,
    settings,
    setting_count: Object.keys(flatSettings).length,
    checked_at: checkedAt,
    updated_at: checkedAt
  }], "scope_key");

  return json({
    ok: true,
    source,
    scope_key: scopeKey,
    source_url: sourceUrl,
    checked_at: checkedAt,
    setting_count: Object.keys(flatSettings).length,
    changed,
    event_inserted: eventInserted,
    diff_counts: {
      added: diff.added.length,
      removed: diff.removed.length,
      changed: diff.changed.length
    },
    webhook_alert: webhookAlert,
    note: "Public Roblox client settings only; private PS99 server flags are not exposed here."
  }, 202);
}

async function handlePs99DevBlogs(request, env) {
  requireSupabase(env);

  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const [state, events] = await Promise.all([
    supabaseSelect(env, PS99_DEV_BLOG_STATE_TABLE, {
      select: "feed_key,feed_url,latest_post_id,latest_post_url,checked_at,updated_at",
      feed_key: "eq.ps99",
      limit: "1"
    }),
    supabaseSelect(env, PS99_DEV_BLOG_EVENTS_TABLE, {
      select: "event_id,post_id,title,url,excerpt,image_url,published_at,detected_at,source,created_at",
      order: "detected_at.desc,id.desc",
      limit: String(limit)
    })
  ]);

  return cacheJson({
    ok: true,
    generated_at: new Date().toISOString(),
    source: "Official BIG Games posts",
    state: state[0] || null,
    events
  }, env, publicCacheSeconds(env, "PS99_DEV_BLOGS"));
}

async function handlePs99DevBlogIngest(env, source, options = {}) {
  requireSupabase(env);

  const checkedAt = new Date().toISOString();
  const feedUrl = ps99DevBlogFeedUrl(env);
  const existing = (await supabaseSelect(env, PS99_DEV_BLOG_STATE_TABLE, {
    select: "feed_key,latest_post_id,latest_post_url,checked_at",
    feed_key: "eq.ps99",
    limit: "1"
  }))[0] || null;
  const listingHtml = await fetchTextWithRetry(feedUrl, "BIG Games dev blog listing");
  const postUrls = extractPs99DevBlogUrls(listingHtml, feedUrl).slice(0, 20);
  if (!postUrls.length) throw httpError(502, "No PS99 update posts were found in the BIG Games listing.");
  const previousPostId = stringOrNull(existing?.latest_post_id);
  const postRefs = postUrls.map(url => ({ post_id: ps99DevBlogPostIdFromUrl(url), url }));
  const latestRef = postRefs[0];
  const latestHtml = await fetchTextWithRetry(latestRef.url, "BIG Games dev blog post");
  const latestPost = parsePs99DevBlogPost(latestHtml, latestRef.url);
  let newPosts = [];
  let webhookResults = [];

  if (previousPostId) {
    const previousIndex = postRefs.findIndex(post => post.post_id === previousPostId);
    const newRefs = (previousIndex >= 0 ? postRefs.slice(0, previousIndex) : postRefs.slice(0, 1)).reverse();
    for (const postRef of newRefs) {
      if (postRef.url === latestPost.url) {
        newPosts.push(latestPost);
        continue;
      }
      const html = await fetchTextWithRetry(postRef.url, "BIG Games dev blog post");
      newPosts.push(parsePs99DevBlogPost(html, postRef.url));
    }
    for (const post of newPosts) {
      await supabaseUpsert(env, PS99_DEV_BLOG_EVENTS_TABLE, [{
        event_id: `ps99-dev-blog:${post.post_id}`,
        post_id: post.post_id,
        title: post.title,
        url: post.url,
        excerpt: post.excerpt,
        image_url: post.image_url,
        published_at: post.published_at,
        detected_at: checkedAt,
        source,
        raw_post: post.raw_post
      }], "event_id");
      webhookResults.push(await postPs99DevBlogAlert(env, post));
    }
  }

  await supabaseUpsert(env, PS99_DEV_BLOG_STATE_TABLE, [{
    feed_key: "ps99",
    feed_url: feedUrl,
    latest_post_id: latestPost.post_id,
    latest_post_url: latestPost.url,
    checked_at: checkedAt,
    updated_at: checkedAt
  }], "feed_key");

  return json({
    ok: true,
    source,
    feed_url: feedUrl,
    checked_at: checkedAt,
    latest_post: latestPost,
    new_post_count: newPosts.length,
    baseline_created: !existing,
    webhook_alerts: webhookResults
  }, 202);
}

function ps99DevBlogPostIdFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || url.pathname;
  } catch {
    return String(value || "").split(/[?#]/, 1)[0].split("/").filter(Boolean).pop() || String(value || "");
  }
}

function normalizeRobloxFflagSettings(payload) {
  const candidate = firstDefined(payload?.applicationSettings, payload?.settings, payload);
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
}

function stableJsonStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableJsonStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function flattenJsonObject(value, prefix = "", output = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of Object.keys(value).sort()) {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenJsonObject(value[key], path, output);
    }
  } else {
    output[prefix || "value"] = value;
  }
  return output;
}

function diffFlatSettings(previous, current) {
  const previousKeys = new Set(Object.keys(previous));
  const currentKeys = new Set(Object.keys(current));
  return {
    added: [...currentKeys].filter(key => !previousKeys.has(key)).sort(),
    removed: [...previousKeys].filter(key => !currentKeys.has(key)).sort(),
    changed: [...currentKeys].filter(key => previousKeys.has(key) && stableJsonStringify(previous[key]) !== stableJsonStringify(current[key])).sort()
  };
}

async function fetchTextWithRetry(url, label, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(String(url), {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "c0ld-Clan-API-Worker"
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      const text = await response.text();
      if (!response.ok) throw httpError(response.status, `${label} returned HTTP ${response.status}`);
      return text;
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await sleep(attempt * 1000);
    }
  }
  throw lastError || httpError(502, `${label} failed`);
}

function extractPs99DevBlogUrls(html, baseUrl) {
  const urls = [];
  const seen = new Set();
  const pattern = /href=["']([^"']*\/post\/pet-simulator-99-update-[^"'#?]+)["']/gi;
  let match;
  while ((match = pattern.exec(String(html || "")))) {
    try {
      const url = new URL(decodeHtmlEntities(match[1]), baseUrl).toString();
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    } catch {}
  }
  return urls;
}

function parsePs99DevBlogPost(html, url) {
  const meta = name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i")
    ];
    for (const pattern of patterns) {
      const match = String(html || "").match(pattern);
      if (match) return decodeHtmlEntities(match[1]).trim();
    }
    return null;
  };
  const postUrl = meta("og:url") || url;
  const postId = new URL(postUrl).pathname.split("/").filter(Boolean).pop() || postUrl;
  return {
    post_id: postId,
    title: meta("og:title") || meta("twitter:title") || postId.replace(/-/g, " "),
    url: postUrl,
    excerpt: meta("og:description") || meta("description"),
    image_url: meta("og:image") || meta("twitter:image"),
    published_at: safeIso(meta("article:published_time")),
    raw_post: { source_url: url }
  };
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
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
  const [states, events, testAlerts, probeStates] = await Promise.all([
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
    }),
    supabaseSelect(env, PS99_RESTART_PROBE_STATE_TABLE, {
      select: "last_event_id,last_confirmed_at,cooldown_until,last_evaluation,updated_at",
      place_id: `eq.${placeId}`,
      limit: "1"
    }).catch(() => [])
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
    sentinel: normalizePs99RestartProbePublicState(probeStates[0]),
    latest_restart: events[0] ? normalizePs99RestartEventOutput(events[0]) : null,
    latest_test_alert: latestTestAlert,
    events: events.map(normalizePs99RestartEventOutput)
  }, env, publicCacheSeconds(env, "PS99_RESTART"));
}

function normalizePs99RestartProbePublicState(row) {
  if (!row) return null;
  const evaluation = parseJsonObject(row.last_evaluation) || {};
  return {
    last_event_id: row.last_event_id || null,
    last_confirmed_at: safeIso(row.last_confirmed_at),
    cooldown_until: safeIso(row.cooldown_until),
    updated_at: safeIso(row.updated_at),
    evaluation: {
      evaluated_at: safeIso(evaluation.evaluated_at),
      decision: evaluation.decision || null,
      active_probe_count: toNumber(evaluation.active_probe_count) || 0,
      changed_probe_count: toNumber(evaluation.changed_probe_count) || 0,
      machine_count: toNumber(evaluation.machine_count) || 0,
      probe_quorum: toNumber(evaluation.probe_quorum),
      same_version_quorum: toNumber(evaluation.same_version_quorum),
      machine_quorum: toNumber(evaluation.machine_quorum),
      current_place_version: toNumber(evaluation.current_place_version),
      would_confirm: Boolean(evaluation.would_confirm),
      in_cooldown: Boolean(evaluation.in_cooldown)
    }
  };
}

async function handlePs99RestartProbeIngest(request, env) {
  requireSupabase(env);

  if (!ps99RestartSentinelEnabled(env)) {
    throw httpError(409, "PS99 restart sentinel confirmation is disabled.");
  }

  const body = await readJsonRequest(request);
  const inputs = Array.isArray(body?.observations) ? body.observations : [body];
  if (!inputs.length || inputs.length > 25) {
    throw httpError(400, "Send between 1 and 25 restart-probe observations.");
  }

  const receivedAt = new Date().toISOString();
  const observations = [];
  for (const input of inputs) {
    observations.push(await normalizePs99RestartProbeObservationInput(input, env, receivedAt));
  }

  await supabaseUpsert(
    env,
    PS99_RESTART_PROBE_OBSERVATIONS_TABLE,
    observations,
    "observation_id"
  );

  const result = await evaluatePs99RestartProbeQuorum(env, receivedAt, {
    allowConfirmation: true
  });

  let intelligence = null;
  if (ps99RestartIntelligenceEnabled(env)) {
    intelligence = await capturePs99RestartSentinelEvidence(env, receivedAt, result.evaluation, observations)
      .catch(error => ({ ok: false, error: String(error?.message || error).slice(0, 1000) }));
  }

  return json({
    ok: true,
    accepted: observations.length,
    received_at: receivedAt,
    observations: observations.map(normalizePs99RestartProbeObservationOutput),
    evaluation: result.evaluation,
    restart_detected: result.restartDetected,
    event_id: result.event?.event_id || null,
    webhook_alert: result.webhookAlert,
    restart_intelligence: intelligence
  }, 202, {
    "Cache-Control": "no-store"
  });
}

async function handlePs99RestartProbeStatus(env) {
  requireSupabase(env);

  const evaluatedAt = new Date().toISOString();
  const result = await evaluatePs99RestartProbeQuorum(env, evaluatedAt, {
    allowConfirmation: false
  });

  return json({
    ok: true,
    generated_at: evaluatedAt,
    detector: ps99RestartRuntimeConfig(env),
    evaluation: result.evaluation
  }, 200, {
    "Cache-Control": "no-store"
  });
}

async function normalizePs99RestartProbeObservationInput(input, env, receivedAt) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw httpError(400, "Each restart-probe observation must be a JSON object.");
  }

  const probeId = validatedPs99RestartProbeIdentifier(input.probe_id, "probe_id");
  const machineId = validatedPs99RestartProbeIdentifier(input.machine_id, "machine_id");
  const state = String(input.state || "connected").trim().toLowerCase();
  if (!["connected", "teleporting", "disconnected", "unknown"].includes(state)) {
    throw httpError(400, "state must be connected, teleporting, disconnected, or unknown.");
  }

  const placeId = Math.round(toNumber(input.place_id) || ps99RootPlaceId(env));
  if (placeId !== ps99RootPlaceId(env)) {
    throw httpError(400, `Sentinels must remain in the configured root place (${ps99RootPlaceId(env)}).`);
  }

  const universeId = Math.round(toNumber(input.universe_id) || ps99UniverseId(env));
  if (universeId !== ps99UniverseId(env)) {
    throw httpError(400, `Unexpected universe_id; expected ${ps99UniverseId(env)}.`);
  }

  const observedAt = safeIso(input.observed_at) || receivedAt;
  const observedMs = isoToMs(observedAt);
  const receivedMs = isoToMs(receivedAt);
  if (observedMs === null || observedMs < receivedMs - 60 * 60000 || observedMs > receivedMs + 2 * 60000) {
    throw httpError(400, "observed_at must be within the last hour and no more than two minutes in the future.");
  }

  const jobId = stringOrNull(input.job_id || input.server_id || input.server_key);
  if (jobId && (jobId.length > 160 || !/^[A-Za-z0-9._:|/-]+$/.test(jobId))) {
    throw httpError(400, "job_id contains unsupported characters or is too long.");
  }
  if (state === "connected" && !jobId) {
    throw httpError(400, "A connected observation requires job_id.");
  }

  const placeVersionValue = toNumber(input.place_version);
  const placeVersion = placeVersionValue === null
    ? null
    : Math.max(0, Math.round(placeVersionValue));
  const robloxUserIdValue = toNumber(input.roblox_user_id);
  const robloxUserId = robloxUserIdValue === null
    ? null
    : Math.max(1, Math.round(robloxUserIdValue));
  const jobIdSource = String(input.job_id_source || "roblox_game_id").trim().toLowerCase().slice(0, 40);
  const reporterVersion = String(input.reporter_version || "").trim().slice(0, 40) || null;
  const observationId = `ps99-probe:${await sha256Hex(stableJsonStringify({
    probe_id: probeId,
    observed_at: observedAt,
    place_id: placeId,
    job_id: jobId,
    state
  }))}`;

  return {
    observation_id: observationId,
    probe_id: probeId,
    machine_id: machineId,
    roblox_user_id: robloxUserId,
    universe_id: universeId,
    place_id: placeId,
    job_id: jobId,
    job_id_source: jobIdSource,
    place_version: placeVersion,
    state,
    observed_at: observedAt,
    received_at: receivedAt,
    reporter_version: reporterVersion,
    raw_observation: {
      process_id: toNumber(input.process_id),
      log_path_hash: stringOrNull(input.log_path_hash),
      roblox_client_version: stringOrNull(input.roblox_client_version),
      note: stringOrNull(input.note)
    }
  };
}

function validatedPs99RestartProbeIdentifier(value, fieldName) {
  const text = String(value || "").trim();
  if (!text || text.length > 80 || !/^[A-Za-z0-9._:-]+$/.test(text)) {
    throw httpError(400, `${fieldName} is required and may contain letters, numbers, dots, colons, underscores, and hyphens.`);
  }
  return text;
}

async function evaluatePs99RestartProbeQuorum(env, evaluatedAt, options = {}) {
  const placeId = ps99RootPlaceId(env);
  const evaluatedMs = isoToMs(evaluatedAt) || Date.now();
  const historyStart = new Date(
    evaluatedMs - ps99RestartProbeHistorySeconds(env) * 1000
  ).toISOString();
  const [rows, stateRows, publicStateRows, versionContext] = await Promise.all([
    supabaseSelect(env, PS99_RESTART_PROBE_OBSERVATIONS_TABLE, {
      select: "observation_id,probe_id,machine_id,roblox_user_id,universe_id,place_id,job_id,job_id_source,place_version,state,observed_at,received_at,reporter_version,raw_observation",
      place_id: `eq.${placeId}`,
      observed_at: `gte.${historyStart}`,
      order: "observed_at.asc,received_at.asc",
      limit: "2000"
    }),
    supabaseSelect(env, PS99_RESTART_PROBE_STATE_TABLE, {
      select: "place_id,universe_id,last_event_id,last_transition_digest,last_confirmed_at,cooldown_until,last_evaluation,updated_at",
      place_id: `eq.${placeId}`,
      limit: "1"
    }),
    supabaseSelect(env, PS99_RESTART_STATE_TABLE, {
      select: "status,last_batch_size,tracked_present,last_checked_at,raw_snapshot",
      place_id: `eq.${placeId}`,
      limit: "1"
    }).catch(() => []),
    fetchPs99RestartVersionContext(env, placeId)
  ]);

  const previousState = stateRows[0] || {};
  const publicState = publicStateRows[0] || {};
  const evidence = summarizePs99RestartProbeEvidence(
    rows,
    evaluatedAt,
    versionContext,
    env
  );
  const publicSnapshot = parseJsonObject(publicState.raw_snapshot) || {};
  const publicScanSupport = {
    role: "supporting_only",
    status: publicState.status || null,
    last_checked_at: safeIso(publicState.last_checked_at),
    tracked_present: toNumber(publicState.tracked_present),
    observed_servers: toNumber(publicState.last_batch_size),
    pages_fetched: toNumber(publicSnapshot.pages_fetched)
  };
  const cooldownMs = isoToMs(previousState.cooldown_until);
  const inCooldown = cooldownMs !== null && cooldownMs > evaluatedMs;
  const evaluation = {
    evaluated_at: evaluatedAt,
    confirmation_mode: ps99RestartConfirmationMode(env),
    sentinel_enabled: ps99RestartSentinelEnabled(env),
    probe_quorum: ps99RestartProbeQuorum(env),
    same_version_quorum: ps99RestartProbeSameVersionQuorum(env),
    machine_quorum: ps99RestartProbeMachineQuorum(env),
    transition_window_seconds: ps99RestartProbeWindowSeconds(env),
    stale_after_seconds: ps99RestartProbeStaleSeconds(env),
    active_probe_count: evidence.activeProbes.length,
    changed_probe_count: evidence.transitions.length,
    machine_count: evidence.machineCount,
    distinct_previous_jobs: evidence.distinctPreviousJobs,
    distinct_current_jobs: evidence.distinctCurrentJobs,
    version_observed_count: evidence.versionObservedCount,
    version_aligned_count: evidence.versionAlignedCount,
    version_conflict_count: evidence.versionConflictCount,
    version_change_evidence: evidence.versionChangeEvidence,
    same_version_restart: evidence.sameVersionRestart,
    current_place_version: toNumber(versionContext.currentVersion),
    version_event_detected_at: safeIso(versionContext.detectedAt),
    candidate_started_at: evidence.candidateStartedAt,
    transition_span_seconds: evidence.transitionSpanSeconds,
    would_confirm: evidence.confirmed,
    in_cooldown: inCooldown,
    cooldown_until: safeIso(previousState.cooldown_until),
    latest_probes: evidence.activeProbes,
    transitions: evidence.transitions,
    public_server_scan: publicScanSupport,
    decision: evidence.confirmed
      ? (inCooldown ? "confirmed_but_in_cooldown" : "confirmed")
      : evidence.decision
  };

  let event = null;
  let restartDetected = false;
  let webhookAlert = emptyDiscordFeedResult(env, "ps99_restarts", "sentinel_quorum_not_met");
  const allowConfirmation = options.allowConfirmation === true;

  if (allowConfirmation && evidence.confirmed && !inCooldown) {
    const candidateStart = evidence.candidateStartedAt || evaluatedAt;
    const candidateStartMs = isoToMs(candidateStart) || evaluatedMs;
    const candidateMinute = new Date(Math.floor(candidateStartMs / 60000) * 60000).toISOString();
    const eventId = `ps99-restart:sentinel:${placeId}:${candidateMinute}`;
    const transitionDigest = await sha256Hex(stableJsonStringify(
      evidence.transitions.map(row => ({
        probe_id: row.probe_id,
        previous_job_id: row.previous_job_id,
        current_job_id: row.current_job_id,
        transitioned_at: row.transitioned_at
      }))
    ));
    const cooldownUntil = new Date(
      evaluatedMs + ps99RestartCooldownMinutes(env) * 60000
    ).toISOString();
    const previousRestartAt = safeIso(previousState.last_confirmed_at);
    const ccuAtRestart = await fetchPs99CcuAtOrBefore(env, candidateStart, 10 * 60000)
      .catch(() => null);
    const tenMinutesBefore = new Date(candidateStartMs - 10 * 60000).toISOString();
    const priorCcuSample = await fetchPs99CcuAtOrBefore(env, tenMinutesBefore, 5 * 60000)
      .catch(() => null);
    const previousVersions = evidence.transitions
      .map(row => toNumber(row.previous_place_version))
      .filter(value => value !== null);
    const previousVersion = previousVersions.length
      ? modeNumber(previousVersions)
      : toNumber(versionContext.previousVersion);
    const currentVersion = toNumber(versionContext.currentVersion)
      ?? modeNumber(evidence.transitions
        .map(row => toNumber(row.current_place_version))
        .filter(value => value !== null));

    event = {
      event_id: eventId,
      universe_id: ps99UniverseId(env),
      place_id: placeId,
      place_name: versionContext.placeName || "Pet Simulator 99",
      candidate_started_at: candidateStart,
      detected_at: evaluatedAt,
      cooldown_until: cooldownUntil,
      previous_place_version: previousVersion,
      current_place_version: currentVersion,
      version_correlated: evidence.versionChangeEvidence,
      confidence: "confirmed",
      previous_servers: evidence.transitions.map(row => ({
        probe_id: row.probe_id,
        machine_id: row.machine_id,
        server_id: row.previous_job_id,
        observed_place_version: row.previous_place_version,
        last_seen_at: row.previous_observed_at
      })),
      replacement_servers: evidence.transitions.map(row => ({
        probe_id: row.probe_id,
        machine_id: row.machine_id,
        server_id: row.current_job_id,
        observed_place_version: row.current_place_version,
        first_seen_at: row.transitioned_at
      })),
      reason: evidence.reason,
      source: "sentinel",
      details: {
        confirmation_method: "sentinel_quorum",
        probe_quorum: evidence.requiredQuorum,
        probes_changed: evidence.transitions.length,
        active_probes: evidence.activeProbes.length,
        independent_machines: evidence.machineCount,
        distinct_previous_jobs: evidence.distinctPreviousJobs,
        distinct_current_jobs: evidence.distinctCurrentJobs,
        transition_window_seconds: ps99RestartProbeWindowSeconds(env),
        transition_span_seconds: evidence.transitionSpanSeconds,
        version_observed_count: evidence.versionObservedCount,
        version_aligned_count: evidence.versionAlignedCount,
        version_conflict_count: evidence.versionConflictCount,
        same_version_restart: evidence.sameVersionRestart,
        version_event_detected_at: versionContext.detectedAt || null,
        previous_restart_detected_at: previousRestartAt,
        restart_place_version: currentVersion,
        ccu_at_restart: toNumber(ccuAtRestart?.ccu),
        ccu_at_restart_sampled_at: safeIso(ccuAtRestart?.sampled_at),
        ccu_10_minutes_before: toNumber(priorCcuSample?.ccu),
        ccu_10_minutes_before_sampled_at: safeIso(priorCcuSample?.sampled_at),
        ccu_10_minutes_before_target_at: tenMinutesBefore,
        public_server_scan: publicScanSupport,
        sentinels: evidence.transitions
      }
    };

    const inserted = await supabaseInsertIgnoreReturning(
      env,
      PS99_RESTART_EVENTS_TABLE,
      [event],
      "event_id"
    );
    restartDetected = inserted.length > 0;
    if (restartDetected) {
      webhookAlert = await postPs99RestartAlert(env, event);
    } else {
      webhookAlert = emptyDiscordFeedResult(env, "ps99_restarts", "restart_event_already_recorded");
    }

    await supabaseUpsert(env, PS99_RESTART_PROBE_STATE_TABLE, [{
      place_id: placeId,
      universe_id: ps99UniverseId(env),
      last_event_id: eventId,
      last_transition_digest: transitionDigest,
      last_confirmed_at: restartDetected ? evaluatedAt : (previousRestartAt || evaluatedAt),
      cooldown_until: cooldownUntil,
      last_evaluation: {
        ...evaluation,
        decision: restartDetected ? "confirmed_and_alerted" : "duplicate_event_suppressed"
      },
      updated_at: evaluatedAt
    }], "place_id");
  } else if (allowConfirmation) {
    await supabaseUpsert(env, PS99_RESTART_PROBE_STATE_TABLE, [{
      place_id: placeId,
      universe_id: ps99UniverseId(env),
      last_event_id: previousState.last_event_id || null,
      last_transition_digest: previousState.last_transition_digest || null,
      last_confirmed_at: safeIso(previousState.last_confirmed_at),
      cooldown_until: inCooldown ? safeIso(previousState.cooldown_until) : null,
      last_evaluation: evaluation,
      updated_at: evaluatedAt
    }], "place_id");
  }

  return {
    evaluation,
    event,
    restartDetected,
    webhookAlert
  };
}

function summarizePs99RestartProbeEvidence(rows, evaluatedAt, versionContext, env) {
  const evaluatedMs = isoToMs(evaluatedAt) || Date.now();
  const staleMs = ps99RestartProbeStaleSeconds(env) * 1000;
  const windowMs = ps99RestartProbeWindowSeconds(env) * 1000;
  const grouped = new Map();

  for (const raw of rows || []) {
    const row = normalizePs99RestartProbeObservationOutput(raw);
    if (!row.probe_id || row.place_id !== ps99RootPlaceId(env)) continue;
    if (!grouped.has(row.probe_id)) grouped.set(row.probe_id, []);
    grouped.get(row.probe_id).push(row);
  }

  const activeProbes = [];
  const transitions = [];
  for (const [probeId, probeRows] of grouped.entries()) {
    probeRows.sort((a, b) => (isoToMs(a.observed_at) || 0) - (isoToMs(b.observed_at) || 0));
    const latestObservation = probeRows[probeRows.length - 1];
    const latestMs = isoToMs(latestObservation?.observed_at);
    const connectedRows = probeRows.filter(row => row.state === "connected" && row.job_id);
    const latestConnected = connectedRows[connectedRows.length - 1];
    const active = Boolean(
      latestObservation
      && latestConnected
      && latestObservation.state === "connected"
      && latestObservation.job_id === latestConnected.job_id
      && latestMs !== null
      && evaluatedMs - latestMs >= -2 * 60000
      && evaluatedMs - latestMs <= staleMs
    );

    if (!active) continue;
    activeProbes.push({
      probe_id: probeId,
      machine_id: latestConnected.machine_id,
      roblox_user_id: latestConnected.roblox_user_id,
      job_id: latestConnected.job_id,
      job_id_source: latestConnected.job_id_source,
      place_version: latestConnected.place_version,
      observed_at: latestConnected.observed_at,
      age_seconds: Math.max(0, Math.round((evaluatedMs - latestMs) / 1000))
    });

    let previousIndex = -1;
    for (let index = connectedRows.length - 2; index >= 0; index -= 1) {
      if (connectedRows[index].job_id !== latestConnected.job_id) {
        previousIndex = index;
        break;
      }
    }
    if (previousIndex < 0) continue;

    const previous = connectedRows[previousIndex];
    const firstCurrent = connectedRows[previousIndex + 1];
    const previousMs = isoToMs(previous.observed_at);
    const transitionMs = isoToMs(firstCurrent.observed_at);
    const transitionGapMs = previousMs === null || transitionMs === null
      ? Number.POSITIVE_INFINITY
      : transitionMs - previousMs;
    const transitionAgeMs = transitionMs === null
      ? Number.POSITIVE_INFINITY
      : evaluatedMs - transitionMs;
    if (
      transitionGapMs < 0
      || transitionGapMs > Math.max(staleMs * 2, 180000)
      || transitionAgeMs < -2 * 60000
      || transitionAgeMs > windowMs
    ) {
      continue;
    }

    transitions.push({
      probe_id: probeId,
      machine_id: latestConnected.machine_id,
      roblox_user_id: latestConnected.roblox_user_id,
      previous_job_id: previous.job_id,
      current_job_id: latestConnected.job_id,
      job_id_source: latestConnected.job_id_source,
      previous_place_version: previous.place_version,
      current_place_version: latestConnected.place_version,
      previous_observed_at: previous.observed_at,
      transitioned_at: firstCurrent.observed_at,
      last_observed_at: latestConnected.observed_at,
      transition_gap_seconds: Math.max(0, Math.round(transitionGapMs / 1000))
    });
  }

  transitions.sort((a, b) => (isoToMs(a.transitioned_at) || 0) - (isoToMs(b.transitioned_at) || 0));
  const transitionTimes = transitions
    .map(row => isoToMs(row.transitioned_at))
    .filter(value => value !== null);
  const candidateStartedAt = transitionTimes.length
    ? new Date(Math.min(...transitionTimes)).toISOString()
    : null;
  const transitionSpanSeconds = transitionTimes.length > 1
    ? Math.round((Math.max(...transitionTimes) - Math.min(...transitionTimes)) / 1000)
    : 0;
  const machineCount = new Set(transitions.map(row => row.machine_id).filter(Boolean)).size;
  const distinctPreviousJobs = new Set(transitions.map(row => row.previous_job_id).filter(Boolean)).size;
  const distinctCurrentJobs = new Set(transitions.map(row => row.current_job_id).filter(Boolean)).size;
  const currentVersion = toNumber(versionContext.currentVersion);
  const versionsObserved = transitions
    .map(row => toNumber(row.current_place_version))
    .filter(value => value !== null);
  const versionObservedCount = versionsObserved.length;
  const versionAlignedCount = currentVersion === null
    ? versionObservedCount
    : versionsObserved.filter(value => value === currentVersion).length;
  const versionConflictCount = currentVersion === null
    ? 0
    : versionsObserved.filter(value => value !== currentVersion).length;
  const probeVersionChanged = transitions.some(row => (
    toNumber(row.previous_place_version) !== null
    && toNumber(row.current_place_version) !== null
    && toNumber(row.previous_place_version) !== toNumber(row.current_place_version)
  ));
  const versionEventMs = isoToMs(versionContext.detectedAt);
  const recentVersionEvent = versionEventMs !== null
    && evaluatedMs - versionEventMs >= 0
    && evaluatedMs - versionEventMs <= 30 * 60000;
  const versionChangeEvidence = probeVersionChanged || recentVersionEvent;
  const probeQuorum = ps99RestartProbeQuorum(env);
  const sameVersionQuorum = ps99RestartProbeSameVersionQuorum(env);
  const machineQuorum = ps99RestartProbeMachineQuorum(env);
  const enoughDistinctServers = distinctPreviousJobs >= 2 && distinctCurrentJobs >= 2;
  const versionsAgree = versionConflictCount === 0;
  const standardConfirmed = transitions.length >= probeQuorum
    && machineCount >= machineQuorum
    && enoughDistinctServers
    && versionsAgree
    && versionChangeEvidence;
  const sameVersionConfirmed = transitions.length >= sameVersionQuorum
    && machineCount >= machineQuorum
    && enoughDistinctServers
    && versionsAgree
    && !versionChangeEvidence;
  const confirmed = standardConfirmed || sameVersionConfirmed;
  const requiredQuorum = versionChangeEvidence ? probeQuorum : sameVersionQuorum;
  let decision = "waiting_for_probe_transitions";
  if (transitions.length >= requiredQuorum && machineCount < machineQuorum) {
    decision = "waiting_for_independent_machines";
  } else if (transitions.length >= requiredQuorum && !enoughDistinctServers) {
    decision = "waiting_for_distinct_server_sessions";
  } else if (versionConflictCount > 0) {
    decision = "version_conflict";
  } else if (transitions.length > 0 && transitions.length < requiredQuorum) {
    decision = "waiting_for_quorum";
  }
  const reason = versionChangeEvidence
    ? `${transitions.length} live sentinel clients across ${machineCount} machines changed server sessions within ${transitionSpanSeconds} seconds and aligned with the current PS99 place version.`
    : `${transitions.length} live sentinel clients across ${machineCount} machines changed server sessions within ${transitionSpanSeconds} seconds at the same place version; the stronger same-version quorum was met.`;

  return {
    activeProbes,
    transitions,
    machineCount,
    distinctPreviousJobs,
    distinctCurrentJobs,
    versionObservedCount,
    versionAlignedCount,
    versionConflictCount,
    versionChangeEvidence,
    sameVersionRestart: sameVersionConfirmed,
    candidateStartedAt,
    transitionSpanSeconds,
    requiredQuorum,
    confirmed,
    decision,
    reason
  };
}

function normalizePs99RestartProbeObservationOutput(row) {
  return {
    observation_id: row.observation_id || null,
    probe_id: row.probe_id || null,
    machine_id: row.machine_id || null,
    roblox_user_id: toNumber(row.roblox_user_id),
    universe_id: toNumber(row.universe_id),
    place_id: toNumber(row.place_id),
    job_id: row.job_id || null,
    job_id_source: row.job_id_source || null,
    place_version: toNumber(row.place_version),
    state: row.state || "unknown",
    observed_at: safeIso(row.observed_at),
    received_at: safeIso(row.received_at),
    reporter_version: row.reporter_version || null
  };
}

function modeNumber(values) {
  const counts = new Map();
  for (const value of values || []) {
    const numeric = toNumber(value);
    if (numeric === null) continue;
    counts.set(numeric, (counts.get(numeric) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;
}


function ps99RestartIntelligenceEnabled(env) {
  return String(env.PS99_RESTART_INTELLIGENCE_ENABLED || "true").toLowerCase() !== "false";
}

function ps99RestartIntelligenceRuntimeConfig(env) {
  return {
    enabled: ps99RestartIntelligenceEnabled(env),
    review_webhook_configured: Boolean(String(env.DISCORD_REVIEW_INTERNAL_TOKEN || "").trim() && (env.DISCORD_INTERACTIONS_WORKER || String(env.DISCORD_INTERACTIONS_BASE || env.DISCORD_WORKER_BASE || "").trim())),
    pre_minutes: clamp(Number(env.PS99_RESTART_INTEL_PRE_MINUTES || DEFAULT_PS99_RESTART_INTEL_PRE_MINUTES), 5, 60),
    post_minutes: clamp(Number(env.PS99_RESTART_INTEL_POST_MINUTES || DEFAULT_PS99_RESTART_INTEL_POST_MINUTES), 5, 60),
    merge_minutes: clamp(Number(env.PS99_RESTART_INTEL_MERGE_MINUTES || DEFAULT_PS99_RESTART_INTEL_MERGE_MINUTES), 15, 180),
    ccu_drop_3m_percent: clamp(Number(env.PS99_RESTART_INTEL_CCU_DROP_3M_PERCENT || DEFAULT_PS99_RESTART_INTEL_CCU_DROP_3M_PERCENT), 1, 50),
    ccu_drop_10m_percent: clamp(Number(env.PS99_RESTART_INTEL_CCU_DROP_10M_PERCENT || DEFAULT_PS99_RESTART_INTEL_CCU_DROP_10M_PERCENT), 1, 50),
    turnover_percent: clamp(Number(env.PS99_RESTART_INTEL_TURNOVER_PERCENT || DEFAULT_PS99_RESTART_INTEL_TURNOVER_PERCENT), 50, 100),
    min_public_servers: clamp(Number(env.PS99_RESTART_INTEL_MIN_PUBLIC_SERVERS || DEFAULT_PS99_RESTART_INTEL_MIN_PUBLIC_SERVERS), 5, 1000),
    require_corroboration: String(env.PS99_RESTART_INTEL_REQUIRE_CORROBORATION || "true").toLowerCase() !== "false"
  };
}

function ps99RestartRecentVersionWindowMinutes(env) {
  return clamp(
    Number(env.PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES || DEFAULT_PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES),
    5,
    180
  );
}

function buildPs99PublicServerVersionCohort(servers, recentRows, observedAt, currentVersion, versionContext = {}) {
  const currentVersionNumber = toNumber(currentVersion);
  const priorById = new Map();
  const orderedRows = [...(recentRows || [])].reverse();

  for (const row of orderedRows) {
    const raw = parseJsonObject(row.raw_observation);
    const priorServers = Array.isArray(raw?.servers) ? raw.servers : [];
    for (const priorServer of priorServers) {
      const serverId = stringOrNull(priorServer?.server_id || priorServer?.id);
      if (!serverId) continue;

      const previous = priorById.get(serverId) || {};
      const firstSeenAt = safeIso(previous.first_seen_at) ||
        safeIso(priorServer.first_seen_at) ||
        safeIso(row.observed_at);
      const firstSeenVersion = toNumber(previous.first_seen_place_version) ??
        toNumber(priorServer.first_seen_place_version) ??
        toNumber(priorServer.observed_place_version) ??
        toNumber(priorServer.current_scan_place_version) ??
        toNumber(row.place_version);

      priorById.set(serverId, {
        ...previous,
        server_id: serverId,
        first_seen_at: firstSeenAt,
        first_seen_place_version: firstSeenVersion,
        last_seen_at: safeIso(priorServer.last_seen_at) || safeIso(row.observed_at),
        last_scan_place_version: toNumber(priorServer.current_scan_place_version) ?? toNumber(row.place_version)
      });
    }
  }

  const annotatedServers = (servers || []).map(server => {
    const serverId = stringOrNull(server?.server_id || server?.id);
    const prior = priorById.get(serverId) || {};
    const firstSeenVersion = toNumber(prior.first_seen_place_version) ?? currentVersionNumber;
    const cohort = firstSeenVersion === null || currentVersionNumber === null
      ? "unknown"
      : firstSeenVersion < currentVersionNumber
        ? "old"
        : firstSeenVersion === currentVersionNumber
          ? "current"
          : "newer";

    return {
      ...server,
      server_id: serverId,
      first_seen_at: safeIso(prior.first_seen_at) || observedAt,
      last_seen_at: observedAt,
      first_seen_place_version: firstSeenVersion,
      observed_place_version: firstSeenVersion,
      current_scan_place_version: currentVersionNumber,
      version_cohort: cohort
    };
  }).filter(server => server.server_id);

  const currentOldIds = new Set(
    annotatedServers
      .filter(server => (
        currentVersionNumber !== null &&
        toNumber(server.first_seen_place_version) !== null &&
        toNumber(server.first_seen_place_version) < currentVersionNumber
      ))
      .map(server => server.server_id)
  );
  const currentVersionIds = new Set(
    annotatedServers
      .filter(server => (
        currentVersionNumber !== null &&
        toNumber(server.first_seen_place_version) === currentVersionNumber
      ))
      .map(server => server.server_id)
  );

  const recentOldIds = new Set();
  const latestPreviousOldIds = new Set();
  const latestPreviousCurrentIds = new Set();
  const latestPreviousRaw = parseJsonObject((recentRows || [])[0]?.raw_observation);
  const latestPreviousSummary = parseJsonObject(latestPreviousRaw?.public_server_version_cohort);
  const latestPreviousServers = Array.isArray(latestPreviousRaw?.servers) ? latestPreviousRaw.servers : [];

  for (const [serverId, prior] of priorById.entries()) {
    const priorVersion = toNumber(prior.first_seen_place_version);
    if (currentVersionNumber !== null && priorVersion !== null && priorVersion < currentVersionNumber) {
      recentOldIds.add(serverId);
    }
  }

  for (const priorServer of latestPreviousServers) {
    const serverId = stringOrNull(priorServer?.server_id || priorServer?.id);
    const priorVersion = toNumber(priorServer?.first_seen_place_version) ??
      toNumber(priorServer?.observed_place_version);
    if (!serverId || currentVersionNumber === null || priorVersion === null) continue;
    if (priorVersion < currentVersionNumber) latestPreviousOldIds.add(serverId);
    if (priorVersion === currentVersionNumber) latestPreviousCurrentIds.add(serverId);
  }

  const carriedOldReferenceCount = Math.max(0, toNumber(latestPreviousSummary?.old_cohort_recent_count) || 0);
  const oldReferenceCount = Math.max(recentOldIds.size, latestPreviousOldIds.size, carriedOldReferenceCount);
  const oldDrainPercent = oldReferenceCount
    ? roundMetric(Math.max(0, Math.min(100, ((oldReferenceCount - currentOldIds.size) / oldReferenceCount) * 100)), 2)
    : null;
  const currentVersionNewDelta = currentVersionIds.size - latestPreviousCurrentIds.size;
  const oldVersionsRemaining = [...new Set(
    annotatedServers
      .map(server => toNumber(server.first_seen_place_version))
      .filter(version => currentVersionNumber !== null && version !== null && version < currentVersionNumber)
  )].sort((a, b) => a - b);
  const oldVersionsRecent = [...new Set(
    [
      ...[...priorById.values()].map(server => toNumber(server.first_seen_place_version)),
      ...(Array.isArray(latestPreviousSummary?.old_cohort_versions_recent)
        ? latestPreviousSummary.old_cohort_versions_recent.map(toNumber)
        : [])
    ]
      .filter(version => currentVersionNumber !== null && version !== null && version < currentVersionNumber)
  )].sort((a, b) => a - b);

  return {
    servers: annotatedServers,
    summary: {
      current_place_version: currentVersionNumber,
      previous_place_version: toNumber(versionContext?.previousVersion),
      version_event_detected_at: safeIso(versionContext?.detectedAt),
      observed_server_count: annotatedServers.length,
      old_cohort_recent_count: oldReferenceCount,
      old_cohort_previous_count: latestPreviousOldIds.size,
      old_cohort_remaining_count: currentOldIds.size,
      old_cohort_absent: Boolean(currentVersionNumber !== null && oldReferenceCount > 0 && currentOldIds.size === 0),
      old_cohort_drain_percent: oldDrainPercent,
      old_cohort_versions_recent: oldVersionsRecent,
      old_cohort_versions_remaining: oldVersionsRemaining,
      current_version_new_count: currentVersionIds.size,
      current_version_new_delta: currentVersionNewDelta,
      current_version_new_percent: annotatedServers.length
        ? roundMetric((currentVersionIds.size / annotatedServers.length) * 100, 2)
        : null
    }
  };
}

async function capturePs99RestartIntelligenceObservation(env, context) {
  const config = ps99RestartIntelligenceRuntimeConfig(env);
  const observedAt = safeIso(context.checkedAt) || new Date().toISOString();
  const servers = Array.isArray(context.serverObservation?.servers) ? context.serverObservation.servers : [];
  const previousRows = await supabaseSelect(env, PS99_RESTART_OBSERVATIONS_TABLE, {
    select: "observation_id,observed_at,ccu,place_version,public_server_ids,public_server_count,sentinel_summary,raw_observation",
    place_id: `eq.${context.placeId}`,
    observed_at: `lt.${observedAt}`,
    order: "observed_at.desc",
    limit: "12"
  }).catch(() => []);
  const publicVersionCohort = buildPs99PublicServerVersionCohort(
    servers,
    previousRows,
    observedAt,
    context.currentVersion,
    context.versionContext
  );
  const cohortServers = publicVersionCohort.servers;
  const serverIds = cohortServers.map(row => String(row.server_id || "")).filter(Boolean);
  const previous = previousRows[0] || null;
  const previousIds = new Set(parseJsonArray(previous?.public_server_ids).map(String));
  const currentIds = new Set(serverIds);
  const disappeared = [...previousIds].filter(id => !currentIds.has(id));
  const appeared = [...currentIds].filter(id => !previousIds.has(id));
  const denominator = Math.max(1, Math.min(previousIds.size || currentIds.size, currentIds.size || previousIds.size));
  const turnoverPercent = previous && previousIds.size && currentIds.size
    ? Math.round((disappeared.length / denominator) * 10000) / 100
    : null;
  const latestProbeState = await supabaseSelect(env, PS99_RESTART_PROBE_STATE_TABLE, {
    select: "last_evaluation,updated_at",
    place_id: `eq.${context.placeId}`,
    limit: "1"
  }).catch(() => []);
  const sentinelSummary = parseJsonObject(latestProbeState[0]?.last_evaluation) || {};
  const observationId = `ps99-intel:${context.placeId}:${observedAt}`;
  const row = {
    observation_id: observationId,
    universe_id: context.universeId,
    place_id: context.placeId,
    observed_at: observedAt,
    source: context.source || "schedule",
    ccu: toNumber(context.ccuSample?.ccu),
    place_version: toNumber(context.currentVersion),
    public_server_count: serverIds.length,
    public_server_ids: serverIds,
    public_disappeared_count: disappeared.length,
    public_appeared_count: appeared.length,
    public_turnover_percent: turnoverPercent,
    detector_status: context.detectorStatus || null,
    sentinel_summary: sentinelSummary,
    api_metrics: {
      pages_requested: toNumber(context.serverObservation?.scan?.pages_requested),
      pages_fetched: toNumber(context.serverObservation?.scan?.pages_fetched),
      page_size: toNumber(context.serverObservation?.scan?.page_size),
      exhausted: context.serverObservation?.scan?.exhausted ?? null,
      public_server_version_cohort: publicVersionCohort.summary,
      ccu_error: context.ccuError || null
    },
    raw_observation: {
      servers: cohortServers,
      public_server_version_cohort: publicVersionCohort.summary,
      tracked_servers: context.trackedServers || [],
      candidate_servers: context.candidateServers || [],
      version_context: context.versionContext || {},
      suppressed_restart: context.suppressedRestart || null,
      confirmed_event: context.eventRow || null
    }
  };
  await supabaseUpsert(env, PS99_RESTART_OBSERVATIONS_TABLE, [row], "observation_id");

  const triggers = await buildPs99RestartIntelligenceTriggers(env, row, previousRows);
  const existingCandidate = await activePs99RestartCandidate(env, context.placeId);
  const gate = ps99RestartCandidateOpeningDecision(config, row, previousRows, triggers);
  const candidate = existingCandidate
    ? (triggers.length
        ? await openOrMergePs99RestartCandidate(env, row, triggers)
        : existingCandidate)
    : (gate.open
        ? await openOrMergePs99RestartCandidate(env, row, triggers)
        : null);

  if (!existingCandidate && triggers.length && !gate.open) {
    await appendPs99RestartSuppressedTriggerTimeline(env, row, triggers, gate);
  }

  if (candidate) {
    await appendPs99RestartCandidateTimeline(env, candidate.candidate_id, observedAt, "observation", {
      ccu: row.ccu,
      place_version: row.place_version,
      public_server_count: row.public_server_count,
      public_turnover_percent: row.public_turnover_percent,
      triggers
    });
  }
  const finalized = await finalizeDuePs99RestartCandidates(env, observedAt);
  return {
    ok: true,
    observation_id: observationId,
    triggers,
    opening_gate: gate,
    candidate_id: candidate?.candidate_id || null,
    finalized_candidates: finalized
  };
}

async function buildPs99RestartIntelligenceTriggers(env, row, recentRows) {
  const config = ps99RestartIntelligenceRuntimeConfig(env);
  const triggers = [];
  const nowMs = isoToMs(row.observed_at) || Date.now();
  const previous = recentRows[0] || null;
  if (previous && toNumber(previous.place_version) !== null && toNumber(row.place_version) !== null && toNumber(previous.place_version) !== toNumber(row.place_version)) {
    triggers.push({ type: "version_changed", severity: "high", previous: toNumber(previous.place_version), current: toNumber(row.place_version) });
  }
  const ccuNow = toNumber(row.ccu);
  for (const window of [
    { minutes: 3, threshold: config.ccu_drop_3m_percent, type: "ccu_drop_3m" },
    { minutes: 10, threshold: config.ccu_drop_10m_percent, type: "ccu_drop_10m" }
  ]) {
    const targetMs = nowMs - window.minutes * 60000;
    const baseline = [...recentRows].sort((a, b) => Math.abs((isoToMs(a.observed_at) || 0) - targetMs) - Math.abs((isoToMs(b.observed_at) || 0) - targetMs))[0];
    const before = toNumber(baseline?.ccu);
    if (ccuNow !== null && before && before > ccuNow) {
      const drop = Math.round(((before - ccuNow) / before) * 10000) / 100;
      if (drop >= window.threshold) triggers.push({ type: window.type, severity: "medium", percent: drop, before, current: ccuNow });
    }
  }
  if (toNumber(row.public_server_count) >= config.min_public_servers && toNumber(row.public_turnover_percent) >= config.turnover_percent) {
    triggers.push({ type: "public_turnover", severity: "medium", percent: toNumber(row.public_turnover_percent), observed_servers: toNumber(row.public_server_count) });
  }
  const publicVersionCohort = parseJsonObject(row.raw_observation)?.public_server_version_cohort ||
    parseJsonObject(row.api_metrics)?.public_server_version_cohort ||
    {};
  const oldCohortRecentCount = Math.max(0, toNumber(publicVersionCohort.old_cohort_recent_count) || 0);
  const oldCohortRemainingCount = Math.max(0, toNumber(publicVersionCohort.old_cohort_remaining_count) || 0);
  const oldCohortDrainPercent = Math.max(0, toNumber(publicVersionCohort.old_cohort_drain_percent) || 0);
  const currentVersionNewCount = Math.max(0, toNumber(publicVersionCohort.current_version_new_count) || 0);
  const currentVersionNewDelta = toNumber(publicVersionCohort.current_version_new_delta) || 0;
  const cohortHasEnoughSample = oldCohortRecentCount >= config.min_public_servers;
  const cohortDrained = publicVersionCohort.old_cohort_absent === true ||
    (oldCohortRecentCount > 0 && oldCohortDrainPercent >= 75);
  if (cohortHasEnoughSample && cohortDrained) {
    triggers.push({
      type: "public_version_cohort_drain",
      severity: publicVersionCohort.old_cohort_absent === true ? "high" : "medium",
      previous: toNumber(publicVersionCohort.previous_place_version),
      current: toNumber(publicVersionCohort.current_place_version),
      old_recent: oldCohortRecentCount,
      old_remaining: oldCohortRemainingCount,
      old_drain_percent: oldCohortDrainPercent,
      new_version_servers: currentVersionNewCount,
      new_version_delta: currentVersionNewDelta
    });
  }
  const sentinel = parseJsonObject(row.sentinel_summary) || row.sentinel_summary || {};
  const changed = toNumber(sentinel.changed_probe_count) || 0;
  if (changed >= 1) triggers.push({ type: "sentinel_transition", severity: changed >= 2 ? "high" : "medium", changed_probes: changed, machines: toNumber(sentinel.machine_count) || 0 });
  if (sentinel.decision === "version_conflict") triggers.push({ type: "sentinel_version_conflict", severity: "medium" });
  return triggers;
}


function ps99RestartCandidateOpeningDecision(config, row, recentRows, triggers) {
  if (!Array.isArray(triggers) || !triggers.length) {
    return {
      open: false,
      reason: "no_trigger",
      strong_trigger_types: [],
      turnover_consecutive_count: 0
    };
  }

  const strongTypes = new Set([
    "version_changed",
    "ccu_drop_3m",
    "ccu_drop_10m",
    "public_version_cohort_drain",
    "sentinel_transition",
    "sentinel_version_conflict"
  ]);
  const strongTriggers = triggers.filter(trigger => strongTypes.has(String(trigger?.type || "")));

  if (strongTriggers.length) {
    return {
      open: true,
      reason: "corroborating_signal",
      strong_trigger_types: strongTriggers.map(trigger => trigger.type),
      turnover_consecutive_count: 0
    };
  }

  return {
    open: false,
    reason: triggers.some(trigger => trigger?.type === "public_turnover")
      ? "public_turnover_supporting_only"
      : "no_corroborating_signal",
    strong_trigger_types: [],
    turnover_percent: toNumber(row.public_turnover_percent) || 0,
    turnover_threshold: config.turnover_percent,
    turnover_consecutive_count: 0,
    turnover_consecutive_required: 0
  };
}

async function appendPs99RestartSuppressedTriggerTimeline(env, observation, triggers, gate) {
  // Suppressed evidence is retained on the observation itself. This log entry
  // makes the gate decision visible without creating a review candidate.
  console.log("PS99 restart candidate opening suppressed", {
    observation_id: observation.observation_id,
    place_id: observation.place_id,
    observed_at: observation.observed_at,
    triggers,
    gate
  });
}

async function activePs99RestartCandidate(env, placeId) {
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "*",
    place_id: `eq.${placeId}`,
    status: "in.(collecting,ready_for_review,needs_more_evidence)",
    archived_at: "is.null",
    order: "opened_at.desc",
    limit: "1"
  }).catch(() => []);
  return rows[0] || null;
}

async function openOrMergePs99RestartCandidate(env, observation, triggers) {
  const config = ps99RestartIntelligenceRuntimeConfig(env);
  const nowMs = isoToMs(observation.observed_at) || Date.now();
  const mergeAfter = new Date(nowMs - config.merge_minutes * 60000).toISOString();
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "*",
    place_id: `eq.${observation.place_id}`,
    opened_at: `gte.${mergeAfter}`,
    status: "in.(collecting,ready_for_review,needs_more_evidence)",
    order: "opened_at.desc",
    limit: "1"
  }).catch(() => []);
  const existing = rows[0] || null;
  if (existing) {
    const mergedTriggers = mergeRestartIntelTriggers(parseJsonArray(existing.triggers), triggers);

    // The evidence window is fixed when the candidate opens. Repeated sampled
    // turnover observations may add evidence, but they cannot postpone review
    // indefinitely by continuously extending finalize_at.
    const finalizeAt = safeIso(existing.finalize_at) ||
      new Date((isoToMs(existing.opened_at) || nowMs) + config.post_minutes * 60000).toISOString();

    await supabasePatch(env, PS99_RESTART_CANDIDATES_TABLE, { candidate_id: `eq.${existing.candidate_id}` }, {
      triggers: mergedTriggers,
      last_trigger_at: observation.observed_at,
      finalize_at: finalizeAt,
      post_window_end: safeIso(existing.post_window_end) || finalizeAt,
      updated_at: observation.observed_at
    });
    await appendPs99RestartCandidateTimeline(env, existing.candidate_id, observation.observed_at, "trigger", {
      triggers,
      finalize_at_unchanged: true
    });
    return {
      ...existing,
      triggers: mergedTriggers,
      finalize_at: finalizeAt,
      post_window_end: safeIso(existing.post_window_end) || finalizeAt
    };
  }

  const candidateBucket = new Date(Math.floor(nowMs / 60000) * 60000).toISOString();
  const candidateId = `ps99-candidate:${observation.place_id}:${candidateBucket}`;
  const finalizeAt = new Date(nowMs + config.post_minutes * 60000).toISOString();
  const candidate = {
    candidate_id: candidateId,
    universe_id: observation.universe_id,
    place_id: observation.place_id,
    status: "collecting",
    opened_at: observation.observed_at,
    first_trigger_at: observation.observed_at,
    last_trigger_at: observation.observed_at,
    finalize_at: finalizeAt,
    pre_window_start: new Date(nowMs - config.pre_minutes * 60000).toISOString(),
    post_window_end: finalizeAt,
    triggers,
    summary: {},
    discord_message_id: null,
    review_status: "unreviewed",
    updated_at: observation.observed_at
  };
  await supabaseUpsert(env, PS99_RESTART_CANDIDATES_TABLE, [candidate], "candidate_id");
  await appendPs99RestartCandidateTimeline(env, candidateId, observation.observed_at, "candidate_opened", { triggers });
  const discord = await postPs99RestartCandidateReviewMessage(
    env,
    candidate,
    null,
    false
  ).catch(error => {
    console.error(
      "restart candidate Discord creation failed",
      candidate.candidate_id,
      error?.message || String(error)
    );

    return {
      posted: false,
      error: error?.message || String(error)
    };
  });
  if (discord?.message_id) {
    await supabasePatch(env, PS99_RESTART_CANDIDATES_TABLE, { candidate_id: `eq.${candidateId}` }, {
      discord_message_id: discord.message_id,
      discord_channel_id: discord.channel_id || null,
      updated_at: observation.observed_at
    });
    candidate.discord_message_id = discord.message_id;
  }
  return candidate;
}

function mergeRestartIntelTriggers(existing, incoming) {
  const map = new Map();
  for (const trigger of [...(existing || []), ...(incoming || [])]) {
    const key = String(trigger?.type || "unknown");
    const prior = map.get(key);
    if (
      !prior ||
      (toNumber(trigger?.percent) || 0) > (toNumber(prior?.percent) || 0) ||
      (toNumber(trigger?.changed_probes) || 0) > (toNumber(prior?.changed_probes) || 0) ||
      (toNumber(trigger?.old_drain_percent) || 0) > (toNumber(prior?.old_drain_percent) || 0) ||
      (toNumber(trigger?.new_version_delta) || 0) > (toNumber(prior?.new_version_delta) || 0)
    ) map.set(key, trigger);
  }
  return [...map.values()];
}

async function appendPs99RestartCandidateTimeline(env, candidateId, occurredAt, eventType, details) {
  const timelineId = `ps99-timeline:${await sha256Hex(`${candidateId}|${occurredAt}|${eventType}|${stableJsonStringify(details || {})}`)}`;
  await supabaseUpsert(env, PS99_RESTART_CANDIDATE_TIMELINE_TABLE, [{
    timeline_id: timelineId,
    candidate_id: candidateId,
    occurred_at: occurredAt,
    event_type: eventType,
    details: details || {}
  }], "timeline_id");
}

async function capturePs99RestartSentinelEvidence(env, observedAt, evaluation, observations) {
  const candidate = await activePs99RestartCandidate(env, ps99RootPlaceId(env));
  const changed = toNumber(evaluation?.changed_probe_count) || 0;
  const shouldOpen = changed > 0 || evaluation?.decision === "version_conflict" || evaluation?.would_confirm;
  let target = candidate;
  if (!target && shouldOpen) {
    const syntheticObservation = {
      observation_id: `ps99-intel-sentinel:${observedAt}`,
      universe_id: ps99UniverseId(env),
      place_id: ps99RootPlaceId(env),
      observed_at: observedAt,
      ccu: null,
      place_version: toNumber(evaluation?.current_place_version),
      public_server_count: 0,
      public_server_ids: [],
      sentinel_summary: evaluation || {}
    };
    target = await openOrMergePs99RestartCandidate(env, syntheticObservation, [{
      type: "sentinel_transition",
      severity: changed >= 2 ? "high" : "medium",
      changed_probes: changed,
      machines: toNumber(evaluation?.machine_count) || 0,
      decision: evaluation?.decision || null
    }]);
  }
  if (target) {
    await appendPs99RestartCandidateTimeline(env, target.candidate_id, observedAt, "sentinel_evidence", {
      evaluation,
      observations: (observations || []).map(normalizePs99RestartProbeObservationOutput)
    });
  }
  return { ok: true, candidate_id: target?.candidate_id || null, changed_probe_count: changed };
}

async function finalizeDuePs99RestartCandidates(env, nowAt) {
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "*",
    status: "eq.collecting",
    finalize_at: `lte.${nowAt}`,
    order: "finalize_at.asc",
    limit: "20"
  }).catch(() => []);
  const finalized = [];
  for (const candidate of rows) {
    const summary = await summarizePs99RestartCandidate(env, candidate);
    const report = await buildPs99RestartCandidateTextReport(env, candidate, summary);
    await supabasePatch(env, PS99_RESTART_CANDIDATES_TABLE, { candidate_id: `eq.${candidate.candidate_id}` }, {
      status: "ready_for_review",
      summary,
      report_text: report,
      finalized_at: nowAt,
      updated_at: nowAt
    });
    await appendPs99RestartCandidateTimeline(env, candidate.candidate_id, nowAt, "ready_for_review", { summary });
    const updated = { ...candidate, status: "ready_for_review", summary, report_text: report, finalized_at: nowAt };
    const discord = await postPs99RestartCandidateReviewMessage(
      env,
      updated,
      report,
      true
    ).catch(error => {
      console.warn(
        "restart candidate Discord finalization failed",
        candidate.candidate_id,
        error?.message || String(error)
      );

      return {
        posted: false,
        error: error?.message || String(error)
      };
    });

    if (discord?.message_id) {
      await supabasePatch(
        env,
        PS99_RESTART_CANDIDATES_TABLE,
        { candidate_id: `eq.${candidate.candidate_id}` },
        {
          discord_message_id: discord.message_id,
          discord_channel_id: discord.channel_id || null,
          updated_at: nowAt
        }
      );
    }

    finalized.push(candidate.candidate_id);
  }

  if (finalized.length) {
    await refreshPs99RestartAnalyticsDashboard(env, {
      reason: "candidate_finalized",
      changed_candidate_ids: finalized
    }).catch(error => console.warn(
      "restart analytics refresh after finalization failed",
      error?.message || String(error)
    ));
  }

  return finalized;
}

async function summarizePs99RestartCandidate(env, candidate) {
  const openedMs = isoToMs(candidate.opened_at || candidate.first_trigger_at || candidate.pre_window_start) || Date.now();
  const recentVersionWindowMinutes = ps99RestartRecentVersionWindowMinutes(env);
  const recentVersionStart = new Date(openedMs - recentVersionWindowMinutes * 60000).toISOString();
  const recentVersionEnd = safeIso(candidate.post_window_end || candidate.finalized_at || candidate.updated_at || candidate.opened_at) ||
    new Date(openedMs).toISOString();
  const [observations, recentVersionEvents] = await Promise.all([
    supabaseSelect(env, PS99_RESTART_OBSERVATIONS_TABLE, {
      select: "observation_id,observed_at,ccu,place_version,public_server_count,public_disappeared_count,public_appeared_count,public_turnover_percent,detector_status,sentinel_summary,api_metrics,raw_observation",
      place_id: `eq.${candidate.place_id}`,
      observed_at: [`gte.${candidate.pre_window_start}`, `lte.${candidate.post_window_end}`],
      order: "observed_at.asc",
      limit: "500"
    }),
    supabaseSelect(env, PS99_VERSION_EVENTS_TABLE, {
      select: "event_id,place_id,place_name,previous_version,current_version,detected_at,current_published_at",
      universe_id: `eq.${toNumber(candidate.universe_id) || ps99UniverseId(env)}`,
      detected_at: [`gte.${recentVersionStart}`, `lte.${recentVersionEnd}`],
      order: "detected_at.desc",
      limit: "25"
    }).catch(() => [])
  ]);
  const ccus = observations.map(row => toNumber(row.ccu)).filter(value => value !== null);
  const firstCcu = ccus[0] ?? null;
  const minCcu = ccus.length ? Math.min(...ccus) : null;
  const lastCcu = ccus.length ? ccus[ccus.length - 1] : null;
  const maxCcuDropPercent = firstCcu && minCcu !== null && minCcu < firstCcu ? Math.round(((firstCcu - minCcu) / firstCcu) * 10000) / 100 : 0;
  const versions = [...new Set(observations.map(row => toNumber(row.place_version)).filter(value => value !== null))];
  const latestRecentVersionEvent = recentVersionEvents[0] || null;
  const latestRecentVersionMs = isoToMs(latestRecentVersionEvent?.detected_at || latestRecentVersionEvent?.current_published_at);
  const recentVersionAgeMinutes = latestRecentVersionMs === null
    ? null
    : Math.max(0, Math.round((openedMs - latestRecentVersionMs) / 60000));
  const maxTurnover = observations.reduce((max, row) => Math.max(max, toNumber(row.public_turnover_percent) || 0), 0);
  const maxSentinelChanged = observations.reduce((max, row) => Math.max(max, toNumber((parseJsonObject(row.sentinel_summary) || {}).changed_probe_count) || 0), 0);
  const maxMachines = observations.reduce((max, row) => Math.max(max, toNumber((parseJsonObject(row.sentinel_summary) || {}).machine_count) || 0), 0);
  const cohortSummaries = observations
    .map(row => parseJsonObject(row.raw_observation)?.public_server_version_cohort || parseJsonObject(row.api_metrics)?.public_server_version_cohort)
    .filter(item => item && typeof item === "object");
  const latestCohortSummary = cohortSummaries[cohortSummaries.length - 1] || null;
  const maxOldCohortDrain = cohortSummaries.reduce(
    (max, item) => Math.max(max, toNumber(item.max_old_cohort_drain_percent) || toNumber(item.old_cohort_drain_percent) || 0),
    0
  );
  const maxNewVersionDelta = cohortSummaries.reduce(
    (max, item) => Math.max(max, toNumber(item.current_version_new_delta) || 0),
    0
  );
  const oldCohortAbsent = cohortSummaries.some(item => item.old_cohort_absent === true);
  return {
    observation_count: observations.length,
    ccu_before: firstCcu,
    ccu_minimum: minCcu,
    ccu_after: lastCcu,
    maximum_ccu_drop_percent: maxCcuDropPercent,
    version_before: versions[0] ?? null,
    version_after: versions.length ? versions[versions.length - 1] : null,
    version_changed: versions.length > 1,
    recent_version_changed: Boolean(recentVersionEvents.length),
    recent_version_window_minutes: recentVersionWindowMinutes,
    recent_version_latest_at: safeIso(latestRecentVersionEvent?.detected_at || latestRecentVersionEvent?.current_published_at),
    recent_version_age_minutes: recentVersionAgeMinutes,
    recent_version_place_count: new Set(recentVersionEvents.map(row => toNumber(row.place_id)).filter(value => value !== null)).size,
    recent_version_events: recentVersionEvents.slice(0, 10).map(row => ({
      place_id: toNumber(row.place_id),
      place_name: row.place_name || null,
      previous_version: toNumber(row.previous_version),
      current_version: toNumber(row.current_version),
      detected_at: safeIso(row.detected_at),
      current_published_at: safeIso(row.current_published_at)
    })),
    public_version_cohort: latestCohortSummary ? {
      current_place_version: toNumber(latestCohortSummary.current_place_version),
      previous_place_version: toNumber(latestCohortSummary.previous_place_version),
      version_event_detected_at: safeIso(latestCohortSummary.version_event_detected_at),
      old_cohort_absent: oldCohortAbsent,
      old_cohort_recent_count: toNumber(latestCohortSummary.old_cohort_recent_count),
      old_cohort_previous_count: toNumber(latestCohortSummary.old_cohort_previous_count),
      old_cohort_remaining_count: toNumber(latestCohortSummary.old_cohort_remaining_count),
      old_cohort_drain_percent: toNumber(latestCohortSummary.old_cohort_drain_percent),
      max_old_cohort_drain_percent: maxOldCohortDrain,
      old_cohort_versions_recent: Array.isArray(latestCohortSummary.old_cohort_versions_recent) ? latestCohortSummary.old_cohort_versions_recent : [],
      old_cohort_versions_remaining: Array.isArray(latestCohortSummary.old_cohort_versions_remaining) ? latestCohortSummary.old_cohort_versions_remaining : [],
      current_version_new_count: toNumber(latestCohortSummary.current_version_new_count),
      current_version_new_delta: toNumber(latestCohortSummary.current_version_new_delta),
      current_version_new_percent: toNumber(latestCohortSummary.current_version_new_percent),
      max_current_version_new_delta: maxNewVersionDelta
    } : null,
    maximum_public_turnover_percent: Math.round(maxTurnover * 100) / 100,
    maximum_sentinel_changes: maxSentinelChanged,
    maximum_independent_machines: maxMachines,
    triggers: parseJsonArray(candidate.triggers)
  };
}

async function buildPs99RestartCandidateTextReport(env, candidate, summary = null) {
  const finalSummary = summary || await summarizePs99RestartCandidate(env, candidate);
  const [observations, timeline] = await Promise.all([
    supabaseSelect(env, PS99_RESTART_OBSERVATIONS_TABLE, {
      select: "observed_at,ccu,place_version,public_server_count,public_disappeared_count,public_appeared_count,public_turnover_percent,detector_status,sentinel_summary,api_metrics,raw_observation",
      place_id: `eq.${candidate.place_id}`,
      observed_at: [`gte.${candidate.pre_window_start}`, `lte.${candidate.post_window_end}`],
      order: "observed_at.asc",
      limit: "500"
    }),
    supabaseSelect(env, PS99_RESTART_CANDIDATE_TIMELINE_TABLE, {
      select: "occurred_at,event_type,details",
      candidate_id: `eq.${candidate.candidate_id}`,
      order: "occurred_at.asc",
      limit: "1000"
    })
  ]);
  const lines = [
    "PS99 RESTART INTELLIGENCE REPORT",
    "================================",
    `Candidate ID: ${candidate.candidate_id}`,
    `Status: ${candidate.status || "collecting"}`,
    `Review status: ${candidate.review_status || "unreviewed"}`,
    `Opened: ${candidate.opened_at}`,
    `Evidence window: ${candidate.pre_window_start} through ${candidate.post_window_end}`,
    `Finalized: ${candidate.finalized_at || "Not finalized"}`,
    "",
    "TRIGGERS",
    "--------",
    ...parseJsonArray(candidate.triggers).map(trigger => `- ${trigger.type}: ${stableJsonStringify(trigger)}`),
    "",
    "SUMMARY",
    "-------",
    `Observations: ${finalSummary.observation_count ?? observations.length}`,
    `CCU before / minimum / after: ${finalSummary.ccu_before ?? "Unknown"} / ${finalSummary.ccu_minimum ?? "Unknown"} / ${finalSummary.ccu_after ?? "Unknown"}`,
    `Maximum CCU drop: ${finalSummary.maximum_ccu_drop_percent ?? 0}%`,
    `Version before / after: ${finalSummary.version_before ?? "Unknown"} / ${finalSummary.version_after ?? "Unknown"}`,
    `Recent version change: ${finalSummary.recent_version_changed ? `${finalSummary.recent_version_latest_at || "Yes"} within ${finalSummary.recent_version_window_minutes || 60} minutes` : "No"}`,
    `Pattern: ${ps99RestartPatternLabel(finalSummary)}`,
    `Old-version public cohort: ${stripPs99RestartEvidenceIcon(ps99RestartPublicCohortAssessmentLine(ps99RestartConfidenceAssessment(finalSummary)))}`,
    `Maximum public turnover: ${finalSummary.maximum_public_turnover_percent ?? 0}%`,
    `Maximum sentinel changes: ${finalSummary.maximum_sentinel_changes ?? 0}`,
    `Maximum independent machines: ${finalSummary.maximum_independent_machines ?? 0}`,
    `Automated confidence: ${ps99RestartConfidenceAssessment(finalSummary).score}% (${ps99RestartConfidenceAssessment(finalSummary).label})`,
    "",
    "AUTOMATED EVIDENCE ASSESSMENT",
    "-----------------------------",
    ...ps99RestartEvidenceAssessmentLines(finalSummary).slice(1).map(line => line.replace(/\*\*/g, "")),
    "",
    "MINUTE-BY-MINUTE OBSERVATIONS",
    "-----------------------------"
  ];
  for (const row of observations) {
    const sentinel = parseJsonObject(row.sentinel_summary) || {};
    lines.push([
      row.observed_at,
      `CCU=${toNumber(row.ccu) ?? "Unknown"}`,
      `Version=${toNumber(row.place_version) ?? "Unknown"}`,
      `PublicServers=${toNumber(row.public_server_count) ?? 0}`,
      `Disappeared=${toNumber(row.public_disappeared_count) ?? 0}`,
      `Appeared=${toNumber(row.public_appeared_count) ?? 0}`,
      `Turnover=${toNumber(row.public_turnover_percent) ?? 0}%`,
      `OldCohortRemaining=${toNumber((parseJsonObject(row.raw_observation)?.public_server_version_cohort || {}).old_cohort_remaining_count) ?? "Unknown"}`,
      `OldCohortDrain=${toNumber((parseJsonObject(row.raw_observation)?.public_server_version_cohort || {}).old_cohort_drain_percent) ?? "Unknown"}%`,
      `NewVersionServers=${toNumber((parseJsonObject(row.raw_observation)?.public_server_version_cohort || {}).current_version_new_count) ?? "Unknown"}`,
      `SentinelChanged=${toNumber(sentinel.changed_probe_count) ?? 0}`,
      `Machines=${toNumber(sentinel.machine_count) ?? 0}`,
      `Decision=${sentinel.decision || "none"}`,
      `Detector=${row.detector_status || "unknown"}`
    ].join(" | "));
  }
  lines.push("", "EVENT TIMELINE", "--------------");
  for (const event of timeline) lines.push(`${event.occurred_at} | ${event.event_type} | ${stableJsonStringify(event.details || {})}`);
  lines.push("", "RAW EVIDENCE", "------------");
  for (const row of observations) lines.push(`${row.observed_at}\n${JSON.stringify(row.raw_observation || {}, null, 2)}\n`);
  return lines.join("\n").slice(0, 7_500_000);
}


function ps99RestartFormatNumber(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

function ps99RestartConfidenceAssessment(summary) {
  const safe = summary && typeof summary === "object" ? summary : {};
  const versionBefore = toNumber(safe.version_before);
  const versionAfter = toNumber(safe.version_after);
  const versionChanged = Boolean(
    safe.version_changed ||
    (versionBefore !== null && versionAfter !== null && versionBefore !== versionAfter)
  );
  const recentVersionChanged = Boolean(versionChanged || safe.recent_version_changed);
  const recentVersionWindowMinutes = toNumber(safe.recent_version_window_minutes) ||
    DEFAULT_PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES;
  const recentVersionAgeMinutes = toNumber(safe.recent_version_age_minutes);
  const recentVersionPlaceCount = Math.max(0, toNumber(safe.recent_version_place_count) || 0);
  const publicVersionCohort = parseJsonObject(safe.public_version_cohort) || {};
  const oldCohortAbsent = publicVersionCohort.old_cohort_absent === true;
  const oldCohortDrainPercent = Math.max(
    0,
    toNumber(publicVersionCohort.max_old_cohort_drain_percent) ||
      toNumber(publicVersionCohort.old_cohort_drain_percent) ||
      0
  );
  const oldCohortRecentCount = Math.max(0, toNumber(publicVersionCohort.old_cohort_recent_count) || 0);
  const oldCohortRemainingCount = Math.max(0, toNumber(publicVersionCohort.old_cohort_remaining_count) || 0);
  const newVersionServerCount = Math.max(0, toNumber(publicVersionCohort.current_version_new_count) || 0);
  const newVersionServerDelta = toNumber(publicVersionCohort.max_current_version_new_delta) ??
    toNumber(publicVersionCohort.current_version_new_delta);
  const ccuDrop = Math.max(0, toNumber(safe.maximum_ccu_drop_percent) || 0);
  const turnover = Math.max(0, toNumber(safe.maximum_public_turnover_percent) || 0);
  const sentinelChanges = Math.max(0, toNumber(safe.maximum_sentinel_changes) || 0);
  const machines = Math.max(0, toNumber(safe.maximum_independent_machines) || 0);

  let score = 0;
  if (versionChanged) score += 50;
  else if (recentVersionChanged) score += 28;
  if (recentVersionChanged && oldCohortAbsent) score += 22;
  else if (recentVersionChanged && oldCohortDrainPercent >= 75) score += 14;
  if (ccuDrop >= 35) score += 30;
  else if (ccuDrop >= 20) score += 24;
  else if (ccuDrop >= 10) score += 14;
  else if (ccuDrop >= 5) score += 7;

  if (machines >= 3) score += 25;
  else if (machines >= 2) score += 18;
  else if (machines >= 1) score += 9;

  if (sentinelChanges >= 4) score += 20;
  else if (sentinelChanges >= 2) score += 13;
  else if (sentinelChanges >= 1) score += 6;

  // Public server turnover is supporting evidence only. The Roblox public
  // server list rotates heavily enough that turnover alone is not reliable.
  const hasPrimarySignal = versionChanged ||
    recentVersionChanged ||
    ccuDrop >= 5 ||
    machines > 0 ||
    sentinelChanges > 0;
  if (hasPrimarySignal) {
    if (turnover >= 85) score += 15;
    else if (turnover >= 70) score += 11;
    else if (turnover >= 50) score += 7;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80
    ? "Very High"
    : score >= 60
      ? "High"
      : score >= 40
        ? "Moderate"
        : score >= 20
          ? "Low"
          : "Very Low";

  return {
    score,
    label,
    versionChanged,
    recentVersionChanged,
    recentVersionWindowMinutes,
    recentVersionAgeMinutes,
    recentVersionPlaceCount,
    oldCohortAbsent,
    oldCohortDrainPercent,
    oldCohortRecentCount,
    oldCohortRemainingCount,
    newVersionServerCount,
    newVersionServerDelta,
    ccuDrop,
    turnover,
    sentinelChanges,
    machines
  };
}

function ps99RestartVersionWindowLabel(minutes) {
  const value = Math.max(1, Math.round(Number(minutes) || DEFAULT_PS99_RESTART_RECENT_VERSION_WINDOW_MINUTES));
  if (value >= 60 && value % 60 === 0) return `${value / 60}h`;
  return `${value}m`;
}

function ps99RestartRecentVersionAssessmentLine(assessment) {
  if (assessment.versionChanged) {
    return "✅ Place version changed during this evidence window";
  }

  const windowLabel = ps99RestartVersionWindowLabel(assessment.recentVersionWindowMinutes);
  if (assessment.recentVersionChanged) {
    const age = assessment.recentVersionAgeMinutes;
    const ageText = age === null
      ? `within ${windowLabel}`
      : age <= 0
        ? "during/after this candidate opened"
        : `${age}m before this candidate opened`;
    const placeText = assessment.recentVersionPlaceCount > 1
      ? ` across ${assessment.recentVersionPlaceCount} places`
      : "";
    return `✅ Place version changed recently (${ageText}${placeText})`;
  }

  return `❌ No recent place-version change within ${windowLabel}`;
}

function ps99RestartPublicCohortAssessmentLine(assessment) {
  if (!assessment.oldCohortRecentCount) {
    return "⚪ Old-version public cohort: no previous old-version public server cohort sampled";
  }

  const base = `old cohort remaining ${assessment.oldCohortRemainingCount}/${assessment.oldCohortRecentCount}, drained ${ps99RestartFormatNumber(assessment.oldCohortDrainPercent)}%`;
  const newText = assessment.newVersionServerDelta !== null && assessment.newVersionServerDelta !== undefined
    ? `; new-version public IDs ${assessment.newVersionServerCount} (${assessment.newVersionServerDelta >= 0 ? "+" : ""}${assessment.newVersionServerDelta})`
    : `; new-version public IDs ${assessment.newVersionServerCount}`;

  if (assessment.oldCohortAbsent) {
    return `✅ Old-version public cohort cleared: ${base}${newText}`;
  }
  if (assessment.oldCohortDrainPercent >= 75) {
    return `⚠️ Old-version public cohort mostly drained: ${base}${newText}`;
  }
  return `❌ Old-version public cohort still present: ${base}${newText}`;
}

function stripPs99RestartEvidenceIcon(value) {
  return String(value || "").replace(/^(?:✅|❌|⚠️|⚪)\s*/, "");
}

function ps99RestartPatternLabel(summary) {
  const assessment = ps99RestartConfidenceAssessment(summary);
  if (assessment.versionChanged && assessment.ccuDrop >= 20) {
    return "Global restart candidate";
  }
  if (assessment.recentVersionChanged && assessment.oldCohortAbsent) {
    return "Likely version-rollout server migration";
  }
  if (assessment.recentVersionChanged && assessment.oldCohortDrainPercent >= 75) {
    return "Possible version-rollout server migration";
  }
  if (assessment.recentVersionChanged && !assessment.versionChanged && assessment.ccuDrop >= 10) {
    return "Possible version-rollout server migration";
  }
  if (assessment.ccuDrop >= 10) {
    return "Uncorroborated CCU dip";
  }
  if (assessment.turnover >= 50) {
    return "Turnover-only public-server churn";
  }
  return "Low-signal candidate";
}

function ps99RestartEvidenceAssessmentLines(summary) {
  const assessment = ps99RestartConfidenceAssessment(summary);
  return [
    "## Evidence Assessment",
    `**Automated Confidence:** ${assessment.score}% — ${assessment.label}`,
    ps99RestartRecentVersionAssessmentLine(assessment),
    ps99RestartPublicCohortAssessmentLine(assessment),
    `${assessment.ccuDrop >= 10 ? "✅" : "❌"} ${assessment.ccuDrop >= 10 ? `Material CCU drop: ${ps99RestartFormatNumber(assessment.ccuDrop)}%` : `No material CCU drop: ${ps99RestartFormatNumber(assessment.ccuDrop)}%`}`,
    `${assessment.sentinelChanges > 0 ? "✅" : "❌"} ${assessment.sentinelChanges > 0 ? `Sentinel transitions: ${assessment.sentinelChanges}` : "No sentinel transitions"}`,
    `${assessment.machines > 0 ? "✅" : "❌"} ${assessment.machines > 0 ? `Independent machines: ${assessment.machines}` : "No independent-machine confirmation"}`,
    `⚠️ Public-server turnover: ${ps99RestartFormatNumber(assessment.turnover)}% — supporting evidence only; ignored alone`
  ];
}

function isPs99RestartFinalReviewStatus(status) {
  return ["confirmed_restart", "not_a_restart", "unsure", "version_migration"].includes(
    String(status || "").trim().toLowerCase()
  );
}

function ps99RestartCandidateDiscordTitle(candidate, finalized) {
  const reviewStatus = String(candidate?.review_status || "unreviewed").trim().toLowerCase();
  const reviewed = isPs99RestartFinalReviewStatus(reviewStatus);

  if (reviewed) {
    return `${restartIntelReviewStatusEmoji(reviewStatus)} PS99 Restart Candidate — ${restartIntelReviewStatusLabel(reviewStatus)}`;
  }
  if (reviewStatus === "needs_more_evidence") {
    return "🔵 PS99 Restart Candidate — Needs More Evidence";
  }
  if (finalized) {
    return "🟠 PS99 Restart Candidate — Ready for Review";
  }
  return "🟡 PS99 Restart Candidate — Collecting";
}

function ps99RestartCandidateDiscordPayload(candidate, summary, finalized) {
  const reviewStatus = String(candidate.review_status || "unreviewed").trim().toLowerCase();
  const reviewed = isPs99RestartFinalReviewStatus(reviewStatus);
  const needsMoreEvidence = reviewStatus === "needs_more_evidence";
  const status = reviewed
    ? restartIntelReviewStatusLabel(reviewStatus)
    : needsMoreEvidence
      ? "Needs More Evidence"
      : finalized
        ? "Ready for Review"
        : "Collecting Evidence";
  const title = ps99RestartCandidateDiscordTitle(candidate, finalized);
  const triggerLines = parseJsonArray(candidate.triggers).map(trigger => `• **${escapeDiscordMarkdown(trigger.type)}:** ${escapeDiscordMarkdown(restartIntelTriggerDescription(trigger))}`);
  const sections = [
    [
      `**Candidate:** \`${escapeDiscordMarkdown(candidate.candidate_id)}\``,
      `**Status:** ${status}`,
      `**Opened:** ${discordTimestamp(candidate.opened_at, "F") || candidate.opened_at}`,
      `**Evidence Window Ends:** ${discordTimestamp(candidate.post_window_end, "R") || candidate.post_window_end}`
    ].join("\n"),
    ["## Triggers", ...(triggerLines.length ? triggerLines : ["No triggers stored."])].join("\n")
  ];
  if (summary) sections.push([
    "## Evidence Summary",
    `**Pattern:** ${ps99RestartPatternLabel(summary)}`,
    `**CCU:** ${ps99AlertCcu(summary.ccu_before)} → ${ps99AlertCcu(summary.ccu_minimum)} → ${ps99AlertCcu(summary.ccu_after)}`,
    `**Maximum CCU Drop:** ${toNumber(summary.maximum_ccu_drop_percent) || 0}%`,
    `**Public Turnover:** ${toNumber(summary.maximum_public_turnover_percent) || 0}%`,
    `**Sentinels Changed:** ${toNumber(summary.maximum_sentinel_changes) || 0}`,
    `**Independent Machines:** ${toNumber(summary.maximum_independent_machines) || 0}`,
    `**Version:** ${summary.version_before ?? "Unknown"} → ${summary.version_after ?? "Unknown"}`,
    `**Old-Version Public Cohort:** ${stripPs99RestartEvidenceIcon(ps99RestartPublicCohortAssessmentLine(ps99RestartConfidenceAssessment(summary)))}`,
    "",
    ...ps99RestartEvidenceAssessmentLines(summary),
    "",
    reviewed
      ? "Human classification is complete. Download Evidence remains available for audit."
      : needsMoreEvidence
        ? "Additional evidence was requested. Classify the candidate again when sufficient evidence is available."
        : finalized
          ? "Use the buttons below to classify this candidate. Download Evidence contains the complete observation window."
          : "Evidence collection is active. Classification buttons appear when the candidate is ready for review."
  ].join("\n"));
  if (reviewed || needsMoreEvidence) {
    sections.push([
      "## Human Review",
      `**Decision:** ${restartIntelReviewStatusLabel(reviewStatus)}`,
      `**Reviewed By:** ${escapeDiscordMarkdown(candidate.reviewed_by || "Unknown")}`,
      `**Reviewed At:** ${discordTimestamp(candidate.reviewed_at, "F") || candidate.reviewed_at || "Unknown"}`,
      candidate.review_notes ? `**Notes:** ${escapeDiscordMarkdown(candidate.review_notes)}` : null
    ].filter(Boolean).join("\n"));
  }

  const payload = persistentDiscordComponentPayload(title, sections, candidate.updated_at || candidate.opened_at, {
    headerSummary: reviewed
      ? "Human review is complete."
      : needsMoreEvidence
        ? "Additional evidence was requested; no public restart alert has been sent."
        : finalized
          ? "Hidden review candidate; no public restart alert has been sent."
          : "Evidence collection is active."
  });

  if (finalized || reviewed || needsMoreEvidence) {
    payload.components.push(...ps99RestartReviewDiscordComponents(candidate));
  }

  return payload;
}

function restartIntelReviewStatusLabel(status) {
  if (status === "confirmed_restart") return "Confirmed Restart";
  if (status === "not_a_restart") return "Not a Restart";
  if (status === "unsure") return "Unsure";
  if (status === "version_migration") return "Version Migration";
  if (status === "needs_more_evidence") return "Needs More Evidence";
  return "Ready for Review";
}

function restartIntelReviewStatusEmoji(status) {
  if (status === "confirmed_restart") return "🟢";
  if (status === "not_a_restart") return "🔴";
  if (status === "unsure") return "⚪";
  if (status === "version_migration") return "🟣";
  if (status === "needs_more_evidence") return "🔵";
  return "🟠";
}

function ps99RestartReviewCustomId(action, candidateId) {
  return `ps99r|${action}|${String(candidateId || "")}`.slice(0, 100);
}

function ps99RestartReviewDiscordComponents(candidate) {
  const reviewStatus = String(candidate.review_status || "unreviewed").trim().toLowerCase();
  const finalDecision = isPs99RestartFinalReviewStatus(reviewStatus);
  const disabled = finalDecision;
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: "Confirm Restart",
          custom_id: ps99RestartReviewCustomId("confirmed_restart", candidate.candidate_id),
          disabled
        },
        {
          type: 2,
          style: 4,
          label: "Not a Restart",
          custom_id: ps99RestartReviewCustomId("not_a_restart", candidate.candidate_id),
          disabled
        },
        {
          type: 2,
          style: 2,
          label: "Unsure",
          custom_id: ps99RestartReviewCustomId("unsure", candidate.candidate_id),
          disabled
        },
        {
          type: 2,
          style: 1,
          label: "Version Migration",
          custom_id: ps99RestartReviewCustomId("version_migration", candidate.candidate_id),
          disabled
        },
        {
          type: 2,
          style: 1,
          label: "Needs More Evidence",
          custom_id: ps99RestartReviewCustomId("needs_more_evidence", candidate.candidate_id),
          disabled
        }
      ]
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: "Download Evidence",
          custom_id: ps99RestartReviewCustomId("report", candidate.candidate_id),
          disabled: false
        }
      ]
    }
  ];
}

function restartIntelTriggerDescription(trigger) {
  if (trigger.type === "version_changed") return `${trigger.previous} → ${trigger.current}`;
  if (trigger.type.startsWith("ccu_drop")) return `${trigger.percent}% (${trigger.before} → ${trigger.current})`;
  if (trigger.type === "public_turnover") return `${trigger.percent}% across ${trigger.observed_servers} observed servers`;
  if (trigger.type === "public_version_cohort_drain") {
    const oldText = `${trigger.old_remaining ?? "?"}/${trigger.old_recent ?? "?"} old-cohort public servers remain`;
    const drainText = `${trigger.old_drain_percent ?? 0}% drained`;
    const delta = trigger.new_version_delta === null || trigger.new_version_delta === undefined
      ? ""
      : ` (${trigger.new_version_delta >= 0 ? "+" : ""}${trigger.new_version_delta})`;
    return `${trigger.previous ?? "old"} → ${trigger.current ?? "current"}; ${oldText}; ${drainText}; new-version public IDs ${trigger.new_version_servers ?? "?"}${delta}`;
  }
  if (trigger.type === "sentinel_transition") return `${trigger.changed_probes || 0} probes across ${trigger.machines || 0} machines`;
  return stableJsonStringify(trigger);
}

async function postPs99RestartCandidateReviewMessage(env, candidate, reportText = null, finalized = false) {
  const internalToken = String(env.DISCORD_REVIEW_INTERNAL_TOKEN || "").trim();
  if (!internalToken) {
    return {
      configured: false,
      posted: false,
      reason: "discord_review_internal_token_not_configured"
    };
  }

  const channelId = String(
    candidate.discord_channel_id ||
    env.PS99_RESTART_REVIEW_CHANNEL_ID ||
    env.PS99_RESTART_ANALYTICS_CHANNEL_ID ||
    ""
  ).trim();
  if (!channelId) {
    return {
      configured: false,
      posted: false,
      reason: "restart_review_channel_not_configured"
    };
  }

  const summary = candidate.summary && typeof candidate.summary === "object"
    ? candidate.summary
    : parseJsonObject(candidate.summary);
  const payload = ps99RestartCandidateDiscordPayload(candidate, summary, finalized);
  const existingMessageId = String(candidate.discord_message_id || "").trim();

  const base = env.DISCORD_INTERACTIONS_WORKER &&
      typeof env.DISCORD_INTERACTIONS_WORKER.fetch === "function"
    ? "https://c0ld-discord-interactions-worker.service"
    : String(
        env.DISCORD_INTERACTIONS_BASE ||
        env.DISCORD_WORKER_BASE ||
        ""
      ).trim().replace(/\/$/, "");

  if (!base) {
    return {
      configured: false,
      posted: false,
      reason: "discord_interactions_base_not_configured"
    };
  }

  const url = new URL("/internal/ps99/restart-review-message", base);
  const requestBody = {
    candidate_id: candidate.candidate_id,
    channel_id: channelId,
    message_id: existingMessageId || null,
    finalized: Boolean(finalized),
    payload,
    report_text: reportText || null
  };

  const request = new Request(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${internalToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "c0ld-Clan-API-Restart-Review"
    },
    body: JSON.stringify(requestBody)
  });

  const response = env.DISCORD_INTERACTIONS_WORKER &&
      typeof env.DISCORD_INTERACTIONS_WORKER.fetch === "function"
    ? await env.DISCORD_INTERACTIONS_WORKER.fetch(request)
    : await fetch(request);

  const text = await response.text();
  const responseBody = parseJsonObject(text) || {};

  if (!response.ok || responseBody.ok === false) {
    const error = httpError(
      502,
      responseBody.message ||
      `Discord interactions Worker returned ${response.status}: ${text}`
    );
    error.details = {
      internal_worker_status: response.status,
      internal_worker_response: responseBody,
      candidate_id: candidate.candidate_id || null,
      channel_id: channelId,
      existing_message_id: existingMessageId || null
    };
    throw error;
  }

  return {
    configured: true,
    posted: true,
    updated: Boolean(responseBody.updated),
    created_new: Boolean(responseBody.created_new),
    replaced_webhook_message: Boolean(responseBody.replaced_webhook_message),
    message_id: stringOrNull(responseBody.message_id),
    channel_id: stringOrNull(responseBody.channel_id) || channelId
  };
}

async function handlePs99RestartIntelligenceCandidates(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 100), 1, 500);
  const status = String(url.searchParams.get("status") || "").trim();
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "candidate_id,universe_id,place_id,status,opened_at,first_trigger_at,last_trigger_at,finalize_at,pre_window_start,post_window_end,finalized_at,triggers,summary,discord_channel_id,discord_message_id,review_status,reviewed_at,reviewed_by,review_notes,external_evidence,updated_at",
    status: status ? `eq.${status}` : undefined,
    order: "opened_at.desc",
    limit: String(limit)
  });
  return json({ ok: true, generated_at: new Date().toISOString(), rows }, 200, { "Cache-Control": "no-store" });
}

async function handlePs99RestartIntelligenceReport(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const candidateId = String(url.searchParams.get("candidate_id") || "").trim();
  if (!candidateId) throw httpError(400, "Missing candidate_id.");
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, { select: "*", candidate_id: `eq.${candidateId}`, limit: "1" });
  const candidate = rows[0];
  if (!candidate) throw httpError(404, "Restart candidate not found.");
  const report = candidate.report_text || await buildPs99RestartCandidateTextReport(env, candidate);
  return new Response(report, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${candidateId.replace(/[^A-Za-z0-9._-]+/g, "_")}.txt"`,
      "Cache-Control": "no-store"
    }
  });
}


async function handlePs99RestartIntelligenceRefreshMessage(request, env) {
  requireSupabase(env);
  const body = await readJsonRequest(request);
  const candidateId = String(body.candidate_id || "").trim();
  const attachReport = body.attach_report !== false;
  const debugPayload = body.debug_payload === true;
  if (!candidateId) throw httpError(400, "Missing candidate_id.");

  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "*",
    candidate_id: `eq.${candidateId}`,
    limit: "1"
  });
  const candidate = rows[0];
  if (!candidate) throw httpError(404, "Restart candidate not found.");

  const finalized = String(candidate.status || "").toLowerCase() !== "collecting";
  const reportText = attachReport
    ? (candidate.report_text || await buildPs99RestartCandidateTextReport(env, candidate))
    : null;

  const discord = await postPs99RestartCandidateReviewMessage(
    env,
    candidate,
    reportText,
    finalized
  );

  if (discord?.message_id && (
    discord.message_id !== candidate.discord_message_id ||
    (discord.channel_id && discord.channel_id !== candidate.discord_channel_id)
  )) {
    await supabasePatch(
      env,
      PS99_RESTART_CANDIDATES_TABLE,
      { candidate_id: `eq.${candidateId}` },
      {
        discord_message_id: discord.message_id,
        discord_channel_id: discord.channel_id || candidate.discord_channel_id || null,
        updated_at: new Date().toISOString()
      }
    );
  }

  return json({
    ok: true,
    candidate_id: candidateId,
    database_status: candidate.status || null,
    review_status: candidate.review_status || null,
    finalized,
    attached_report: Boolean(reportText),
    rendered_title: ps99RestartCandidateDiscordTitle(candidate, finalized),
    automated_confidence: ps99RestartConfidenceAssessment(
      candidate.summary && typeof candidate.summary === "object"
        ? candidate.summary
        : parseJsonObject(candidate.summary)
    ),
    rendered_top_level_component_types: ps99RestartCandidateDiscordPayload(
      candidate,
      candidate.summary && typeof candidate.summary === "object"
        ? candidate.summary
        : parseJsonObject(candidate.summary),
      finalized
    ).components.map(component => component.type),
    rendered_payload: debugPayload
      ? ps99RestartCandidateDiscordPayload(
          candidate,
          candidate.summary && typeof candidate.summary === "object"
            ? candidate.summary
            : parseJsonObject(candidate.summary),
          finalized
        )
      : undefined,
    discord
  }, 200, { "Cache-Control": "no-store" });
}

async function handlePs99RestartIntelligenceRefreshAll(request, env) {
  requireSupabase(env);
  const body = await readJsonRequest(request);
  const limit = clamp(Number(body.limit || 100), 1, 500);
  const includeWithoutMessage = body.include_without_message === true;
  const attachReport = body.attach_report === true;
  const status = String(body.status || "").trim().toLowerCase();
  const pendingOnly = body.pending_only === true;
  const forcedChannelId = String(body.channel_id || body.discord_channel_id || "").trim();
  const allowPartialSuccess = body.allow_partial_success === true;
  const refreshSummary = body.refresh_summary === true;

  if (status && !["collecting", "ready_for_review", "needs_more_evidence", "reviewed"].includes(status)) {
    throw httpError(400, "status must be collecting, ready_for_review, needs_more_evidence, or reviewed.");
  }

  const query = {
    select: "*",
    order: "opened_at.desc",
    limit: String(limit)
  };
  if (status) query.status = `eq.${status}`;
  if (pendingOnly) {
    query.archived_at = "is.null";
    query.review_status = "in.(unreviewed,needs_more_evidence)";
  }

  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, query);

  const candidates = rows.filter(candidate =>
    includeWithoutMessage || String(candidate.discord_message_id || "").trim()
  );
  const results = [];

  for (const candidate of candidates) {
    try {
      let candidateForPost = candidate;
      if (refreshSummary) {
        const summary = await summarizePs99RestartCandidate(env, candidate);
        const refreshedAt = new Date().toISOString();
        await supabasePatch(
          env,
          PS99_RESTART_CANDIDATES_TABLE,
          { candidate_id: `eq.${candidate.candidate_id}` },
          {
            summary,
            updated_at: refreshedAt
          }
        );
        candidateForPost = {
          ...candidate,
          summary,
          updated_at: refreshedAt
        };
      }

      const finalized = String(candidate.status || "").toLowerCase() !== "collecting";
      const reportText = attachReport
        ? (candidateForPost.report_text || await buildPs99RestartCandidateTextReport(env, candidateForPost))
        : null;
      const discord = await postPs99RestartCandidateReviewMessage(
        env,
        forcedChannelId
          ? { ...candidateForPost, discord_channel_id: forcedChannelId }
          : candidateForPost,
        reportText,
        finalized
      );

      if (discord?.message_id && (
        discord.message_id !== candidate.discord_message_id ||
        (discord.channel_id && discord.channel_id !== candidate.discord_channel_id)
      )) {
        await supabasePatch(
          env,
          PS99_RESTART_CANDIDATES_TABLE,
          { candidate_id: `eq.${candidate.candidate_id}` },
          {
            discord_message_id: discord.message_id,
            discord_channel_id: discord.channel_id || candidate.discord_channel_id || null,
            updated_at: new Date().toISOString()
          }
        );
      }

      results.push({
        candidate_id: candidate.candidate_id,
        ok: true,
        discord
      });
    } catch (error) {
      results.push({
        candidate_id: candidate.candidate_id,
        ok: false,
        message: error?.message || String(error)
      });
    }
  }

  const allSucceeded = results.every(result => result.ok);
  const anySucceeded = results.some(result => result.ok);
  const ok = allSucceeded || (allowPartialSuccess && anySucceeded);

  return json({
    ok,
    requested_limit: limit,
    processed: results.length,
    succeeded: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    filters: {
      status: status || null,
      pending_only: pendingOnly,
      channel_id: forcedChannelId || null,
      allow_partial_success: allowPartialSuccess,
      refresh_summary: refreshSummary
    },
    results
  }, ok ? 200 : 207, { "Cache-Control": "no-store" });
}

async function handlePs99RestartIntelligenceReview(request, env) {
  requireSupabase(env);
  const body = await readJsonRequest(request);
  const candidateId = String(body.candidate_id || "").trim();
  const reviewStatus = String(body.status || body.review_status || "").trim().toLowerCase();
  const allowed = new Set(["confirmed_restart", "not_a_restart", "unsure", "version_migration", "needs_more_evidence"]);
  if (!candidateId) throw httpError(400, "Missing candidate_id.");
  if (!allowed.has(reviewStatus)) throw httpError(400, "status must be confirmed_restart, not_a_restart, unsure, version_migration, or needs_more_evidence.");
  const rows = await supabaseSelect(env, PS99_RESTART_CANDIDATES_TABLE, { select: "*", candidate_id: `eq.${candidateId}`, limit: "1" });
  const candidate = rows[0];
  if (!candidate) throw httpError(404, "Restart candidate not found.");
  const reviewedAt = new Date().toISOString();
  const reviewer = String(body.reviewed_by || "admin_api").slice(0, 200);
  const status = reviewStatus === "needs_more_evidence" ? "needs_more_evidence" : "reviewed";
  const patch = {
    status,
    review_status: reviewStatus,
    reviewed_at: reviewedAt,
    reviewed_by: reviewer,
    review_notes: String(body.notes || "").slice(0, 10000) || null,
    external_evidence: Array.isArray(body.external_evidence) ? body.external_evidence.slice(0, 50) : [],
    updated_at: reviewedAt
  };
  await supabasePatch(env, PS99_RESTART_CANDIDATES_TABLE, { candidate_id: `eq.${candidateId}` }, patch);
  await appendPs99RestartCandidateTimeline(env, candidateId, reviewedAt, "human_review", patch);

  const updatedCandidate = {
    ...candidate,
    ...patch,
    review_status: reviewStatus
  };

  const discord = await postPs99RestartCandidateReviewMessage(
    env,
    updatedCandidate,
    null,
    true
  ).catch(error => {
    console.warn(
      "restart candidate Discord review update failed",
      candidateId,
      error?.message || String(error)
    );
    return {
      posted: false,
      error: error?.message || String(error)
    };
  });

  const analytics = await refreshPs99RestartAnalyticsDashboard(env, {
    reason: "human_review",
    changed_candidate_ids: [candidateId]
  }).catch(error => ({
    ok: false,
    message: error?.message || String(error)
  }));

  return json({
    ok: true,
    candidate_id: candidateId,
    ...patch,
    discord,
    analytics
  }, 200, { "Cache-Control": "no-store" });
}


function shouldRefreshPs99RestartAnalytics(env, scheduledAt) {
  const enabled = String(env.PS99_RESTART_ANALYTICS_ENABLED || "true").toLowerCase() !== "false";
  if (!enabled) return false;
  const interval = clamp(Number(env.PS99_RESTART_ANALYTICS_REFRESH_MINUTES || 5), 1, 60);
  const date = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  return date.getUTCMinutes() % interval === 0;
}

function ps99RestartAnalyticsChannelId(env) {
  return String(
    env.PS99_RESTART_ANALYTICS_CHANNEL_ID ||
    env.PS99_RESTART_REVIEW_CHANNEL_ID ||
    ""
  ).trim();
}

function ps99RestartAnalyticsReviewClass(candidate) {
  if (candidate?.archived_at) return "archived";
  const review = String(candidate?.review_status || "unreviewed").trim().toLowerCase();
  if (review === "confirmed_restart") return "confirmed";
  if (review === "not_a_restart") return "rejected";
  if (review === "unsure") return "unsure";
  if (review === "version_migration") return "version_migration";
  if (review === "needs_more_evidence") return "needs_more_evidence";
  return "unreviewed";
}

function ps99RestartAnalyticsTriggerTypes(candidate) {
  const triggers = Array.isArray(candidate?.triggers)
    ? candidate.triggers
    : parseJsonArray(candidate?.triggers);
  return [...new Set(
    triggers
      .map(trigger => String(trigger?.type || "").trim())
      .filter(Boolean)
  )].sort();
}

function ps99RestartAnalyticsPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function ps99RestartAnalyticsAverage(values) {
  const usable = values.filter(value => Number.isFinite(value));
  if (!usable.length) return null;
  return Math.round((usable.reduce((sum, value) => sum + value, 0) / usable.length) * 10) / 10;
}

function ps99RestartAnalyticsConfidence(candidate) {
  const summary = candidate?.summary && typeof candidate.summary === "object"
    ? candidate.summary
    : parseJsonObject(candidate?.summary);
  return ps99RestartConfidenceAssessment(summary).score;
}

function ps99RestartAnalyticsDateMs(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function buildPs99RestartHistoricalAnalytics(candidates, generatedAt = new Date().toISOString()) {
  const nowMs = ps99RestartAnalyticsDateMs(generatedAt) || Date.now();
  const sevenDaysAgo = nowMs - 7 * 86400000;
  const thirtyDaysAgo = nowMs - 30 * 86400000;

  const normalized = candidates.map(candidate => {
    const classification = ps99RestartAnalyticsReviewClass(candidate);
    const confidence = ps99RestartAnalyticsConfidence(candidate);
    const openedMs = ps99RestartAnalyticsDateMs(candidate.opened_at);
    const readyMs = ps99RestartAnalyticsDateMs(candidate.finalized_at);
    const reviewedMs = ps99RestartAnalyticsDateMs(candidate.reviewed_at);
    const triggerTypes = ps99RestartAnalyticsTriggerTypes(candidate);
    return {
      candidate,
      candidateId: String(candidate?.candidate_id || ""),
      status: String(candidate?.status || ""),
      classification,
      confidence,
      openedMs,
      readyMs,
      reviewedMs,
      triggerTypes,
      triggerCombination: triggerTypes.length ? triggerTypes.join(" + ") : "no_trigger_metadata"
    };
  });

  const reviewed = normalized.filter(row =>
    ["confirmed", "rejected", "unsure", "version_migration"].includes(row.classification)
  );
  const confirmed = normalized.filter(row => row.classification === "confirmed");
  const rejected = normalized.filter(row => row.classification === "rejected");
  const unsure = normalized.filter(row => row.classification === "unsure");
  const versionMigrations = normalized.filter(row => row.classification === "version_migration");
  const needsMore = normalized.filter(row => row.classification === "needs_more_evidence");
  const archived = normalized.filter(row => row.classification === "archived");
  const pending = normalized.filter(row => row.classification === "unreviewed");

  const recentSummary = sinceMs => {
    const rows = normalized.filter(row =>
      row.classification !== "archived" &&
      row.openedMs >= sinceMs
    );
    return {
      candidates: rows.length,
      confirmed: rows.filter(row => row.classification === "confirmed").length,
      rejected: rows.filter(row => row.classification === "rejected").length,
      unsure: rows.filter(row => row.classification === "unsure").length,
      version_migrations: rows.filter(row => row.classification === "version_migration").length,
      pending: rows.filter(row => ["unreviewed", "needs_more_evidence"].includes(row.classification)).length
    };
  };

  const confidenceBands = [
    [0, 19],
    [20, 39],
    [40, 59],
    [60, 79],
    [80, 100]
  ].map(([minimum, maximum]) => {
    const rows = reviewed.filter(row => row.confidence >= minimum && row.confidence <= maximum);
    const bandConfirmed = rows.filter(row => row.classification === "confirmed").length;
    return {
      band: `${minimum}-${maximum}`,
      minimum,
      maximum,
      candidates: rows.length,
      confirmed: bandConfirmed,
      rejected: rows.filter(row => row.classification === "rejected").length,
      unsure: rows.filter(row => row.classification === "unsure").length,
      version_migrations: rows.filter(row => row.classification === "version_migration").length,
      actual_confirmation_rate: ps99RestartAnalyticsPercent(bandConfirmed, rows.length)
    };
  });

  const triggerMap = new Map();
  for (const row of reviewed) {
    for (const type of row.triggerTypes) {
      const item = triggerMap.get(type) || { trigger: type, candidates: 0, confirmed: 0, rejected: 0, unsure: 0, version_migration: 0 };
      item.candidates += 1;
      item[row.classification] += 1;
      triggerMap.set(type, item);
    }
  }
  const triggerPerformance = [...triggerMap.values()]
    .map(item => ({
      ...item,
      confirmation_rate: ps99RestartAnalyticsPercent(item.confirmed, item.candidates)
    }))
    .sort((a, b) => b.candidates - a.candidates || b.confirmation_rate - a.confirmation_rate);

  const combinationMap = new Map();
  for (const row of reviewed) {
    const item = combinationMap.get(row.triggerCombination) || {
      combination: row.triggerCombination,
      candidates: 0,
      confirmed: 0,
      rejected: 0,
      unsure: 0,
      version_migration: 0
    };
    item.candidates += 1;
    item[row.classification] += 1;
    combinationMap.set(row.triggerCombination, item);
  }
  const triggerCombinations = [...combinationMap.values()]
    .map(item => ({
      ...item,
      confirmation_rate: ps99RestartAnalyticsPercent(item.confirmed, item.candidates)
    }))
    .sort((a, b) => b.candidates - a.candidates || b.confirmation_rate - a.confirmation_rate);

  const monthlyMap = new Map();
  for (const row of normalized) {
    if (!row.openedMs) continue;
    const date = new Date(row.openedMs);
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const item = monthlyMap.get(month) || { month, candidates: 0, confirmed: 0, rejected: 0, unsure: 0, version_migrations: 0 };
    item.candidates += 1;
    if (row.classification === "confirmed") item.confirmed += 1;
    if (row.classification === "rejected") item.rejected += 1;
    if (row.classification === "unsure") item.unsure += 1;
    if (row.classification === "version_migration") item.version_migrations += 1;
    monthlyMap.set(month, item);
  }
  const monthlyTrend = [...monthlyMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const reviewLatenciesMinutes = reviewed
    .map(row => {
      const start = row.readyMs || row.openedMs;
      return start && row.reviewedMs && row.reviewedMs >= start
        ? (row.reviewedMs - start) / 60000
        : null;
    })
    .filter(value => value !== null);

  const recommendations = [];
  for (const item of triggerPerformance) {
    if (item.candidates < 10) continue;
    if (item.trigger === "public_turnover" && item.confirmation_rate < 20) {
      recommendations.push({
        signal: item.trigger,
        sample_count: item.candidates,
        observed_confirmation_rate: item.confirmation_rate,
        recommendation: "Keep turnover weak and require corroboration."
      });
    } else if (item.confirmation_rate >= 85) {
      recommendations.push({
        signal: item.trigger,
        sample_count: item.candidates,
        observed_confirmation_rate: item.confirmation_rate,
        recommendation: "Strong signal; consider a modest weight increase after manual review."
      });
    } else if (item.confirmation_rate <= 25) {
      recommendations.push({
        signal: item.trigger,
        sample_count: item.candidates,
        observed_confirmation_rate: item.confirmation_rate,
        recommendation: "Weak signal; consider reducing its score contribution."
      });
    }
  }

  return {
    generated_at: generatedAt,
    lifetime: {
      candidates: normalized.length,
      reviewed: reviewed.length,
      confirmed: confirmed.length,
      rejected: rejected.length,
      unsure: unsure.length,
      version_migrations: versionMigrations.length,
      needs_more_evidence: needsMore.length,
      archived: archived.length,
      pending_review: pending.length,
      confirmation_rate: ps99RestartAnalyticsPercent(confirmed.length, reviewed.length),
      rejection_rate: ps99RestartAnalyticsPercent(rejected.length, reviewed.length)
    },
    confidence: {
      average_all: ps99RestartAnalyticsAverage(
        normalized
          .filter(row => row.classification !== "archived")
          .map(row => row.confidence)
      ),
      average_confirmed: ps99RestartAnalyticsAverage(confirmed.map(row => row.confidence)),
      average_rejected: ps99RestartAnalyticsAverage(rejected.map(row => row.confidence)),
      average_unsure: ps99RestartAnalyticsAverage(unsure.map(row => row.confidence)),
      average_version_migration: ps99RestartAnalyticsAverage(versionMigrations.map(row => row.confidence))
    },
    recent: {
      last_7_days: recentSummary(sevenDaysAgo),
      last_30_days: recentSummary(thirtyDaysAgo)
    },
    calibration: confidenceBands,
    trigger_performance: triggerPerformance,
    trigger_combinations: triggerCombinations,
    monthly_trend: monthlyTrend,
    operations: {
      average_review_latency_minutes: ps99RestartAnalyticsAverage(reviewLatenciesMinutes),
      reviews_last_24_hours: reviewed.filter(row => row.reviewedMs >= nowMs - 86400000).length,
      pending_reviews: pending.length,
      needs_more_evidence: needsMore.length,
      last_candidate_opened_at: normalized
        .map(row => row.openedMs)
        .filter(Boolean)
        .sort((a, b) => b - a)[0]
          ? new Date(normalized.map(row => row.openedMs).filter(Boolean).sort((a, b) => b - a)[0]).toISOString()
          : null,
      oldest_pending_opened_at: pending
        .map(row => row.openedMs)
        .filter(Boolean)
        .sort((a, b) => a - b)[0]
          ? new Date(pending.map(row => row.openedMs).filter(Boolean).sort((a, b) => a - b)[0]).toISOString()
          : null
    },
    confidence_distribution: confidenceBands.map(row => ({
      band: row.band,
      candidates: normalized.filter(item =>
        item.classification !== "archived" &&
        item.confidence >= row.minimum &&
        item.confidence <= row.maximum
      ).length
    })),
    priority_review_queue: pending
      .filter(row => !(
        row.status === "ready_for_review" &&
        row.confidence <= 19 &&
        row.triggerTypes.length === 1 &&
        row.triggerTypes[0] === "public_turnover"
      ))
      .slice()
      .sort((a, b) => {
        const aStrong = a.triggerTypes.some(type =>
          ["version_changed", "ccu_drop_3m", "ccu_drop_10m", "sentinel_transition", "sentinel_version_conflict"].includes(type)
        ) ? 1 : 0;
        const bStrong = b.triggerTypes.some(type =>
          ["version_changed", "ccu_drop_3m", "ccu_drop_10m", "sentinel_transition", "sentinel_version_conflict"].includes(type)
        ) ? 1 : 0;
        return bStrong - aStrong || b.confidence - a.confidence || a.openedMs - b.openedMs;
      })
      .slice(0, 6)
      .map(row => ({
        candidate_id: row.candidateId,
        status: row.status,
        opened_at: row.openedMs ? new Date(row.openedMs).toISOString() : null,
        confidence: row.confidence,
        trigger_types: row.triggerTypes,
        priority: row.triggerTypes.includes("version_changed") || row.confidence >= 50
          ? "high"
          : row.confidence >= 20 || row.triggerTypes.some(type => type.startsWith("ccu_drop"))
            ? "medium"
            : "low"
      })),
    maintenance_queue: pending
      .filter(row =>
        row.status === "ready_for_review" &&
        row.confidence <= 19 &&
        row.triggerTypes.length === 1 &&
        row.triggerTypes[0] === "public_turnover"
      )
      .slice()
      .sort((a, b) => a.openedMs - b.openedMs)
      .map(row => ({
        candidate_id: row.candidateId,
        status: row.status,
        opened_at: row.openedMs ? new Date(row.openedMs).toISOString() : null,
        confidence: row.confidence,
        trigger_types: row.triggerTypes,
        recommendation: "archive_low_turnover"
      })),
    legacy_duplicate_groups: (() => {
      const rows = pending
        .slice()
        .sort((a, b) => a.openedMs - b.openedMs);
      const groups = [];
      let current = [];
      for (const row of rows) {
        if (!current.length || row.openedMs - current[current.length - 1].openedMs <= 5000) {
          current.push(row);
        } else {
          if (current.length > 1) groups.push(current);
          current = [row];
        }
      }
      if (current.length > 1) groups.push(current);
      return groups.map(group => ({
        candidate_ids: group.map(row => row.candidateId),
        opened_at: group[0].openedMs ? new Date(group[0].openedMs).toISOString() : null,
        span_seconds: Math.round((group[group.length - 1].openedMs - group[0].openedMs) / 1000),
        count: group.length
      }));
    })(),
    pending_queue: pending
      .slice()
      .sort((a, b) => a.openedMs - b.openedMs)
      .slice(0, 6)
      .map(row => ({
        candidate_id: row.candidateId,
        status: row.status,
        opened_at: row.openedMs ? new Date(row.openedMs).toISOString() : null,
        confidence: row.confidence,
        trigger_types: row.triggerTypes
      })),
    review_agreement: confidenceBands
      .filter(row => row.candidates > 0)
      .map(row => ({
        band: row.band,
        reviewed: row.candidates,
        confirmed: row.confirmed,
        rejected: row.rejected,
        unsure: row.unsure,
        version_migrations: row.version_migrations,
        confirmation_rate: row.actual_confirmation_rate
      })),
    recommendations
  };
}

function ps99RestartAnalyticsMetric(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${value}${suffix}`;
}

const PS99_RESTART_ANALYTICS_TRIGGER_LABELS = {
  ccu_drop_3m: "3-Minute CCU Drop",
  ccu_drop_10m: "10-Minute CCU Drop",
  public_turnover: "Public Server Turnover",
  public_version_cohort_drain: "Old-Version Public Server Drain",
  sentinel_transition: "Sentinel Server Transition",
  sentinel_version_conflict: "Sentinel Version Conflict",
  version_changed: "Place Version Changed",
  no_trigger_metadata: "No Trigger Metadata"
};

function ps99RestartAnalyticsTriggerLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Unknown Signal";
  return raw
    .split(/\s+\+\s+/)
    .map(part => {
      const key = part.trim();
      return PS99_RESTART_ANALYTICS_TRIGGER_LABELS[key] ||
        key
          .replaceAll("_", " ")
          .replace(/\bccu\b/gi, "CCU")
          .replace(/\b\w/g, character => character.toUpperCase());
    })
    .join(" + ");
}

function ps99RestartAnalyticsHealthIndicator(value, warningAt, criticalAt, lowerIsBetter = true) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "⚪";
  if (lowerIsBetter) {
    if (numeric >= criticalAt) return "🔴";
    if (numeric >= warningAt) return "🟡";
    return "🟢";
  }
  if (numeric <= criticalAt) return "🔴";
  if (numeric <= warningAt) return "🟡";
  return "🟢";
}

function ps99RestartAnalyticsAgeMinutes(isoValue, nowMs = Date.now()) {
  const timestamp = ps99RestartAnalyticsDateMs(isoValue);
  if (!timestamp) return null;
  return Math.max(0, Math.round((nowMs - timestamp) / 60000));
}

function ps99RestartAnalyticsHumanDuration(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(Number(minutes))) return "—";
  const total = Math.max(0, Math.round(Number(minutes)));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  if (hours < 24) return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;
  return leftoverHours ? `${days}d ${leftoverHours}h` : `${days}d`;
}

function ps99RestartAnalyticsBar(count, maximum, width = 10) {
  if (!maximum || count <= 0) return "░".repeat(width);
  const filled = Math.max(1, Math.min(width, Math.round((count / maximum) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function ps99RestartAnalyticsConfidenceLabel(score) {
  const value = Number(score) || 0;
  if (value >= 80) return "Very High";
  if (value >= 60) return "High";
  if (value >= 40) return "Moderate";
  if (value >= 20) return "Low";
  return "Very Low";
}

function ps99RestartAnalyticsPriorityIcon(priority, status) {
  if (String(status) === "collecting") return "🔵";
  if (priority === "high") return "🔴";
  if (priority === "medium") return "🟡";
  return "⚪";
}

function ps99RestartAnalyticsCandidateTime(isoValue) {
  const ms = ps99RestartAnalyticsDateMs(isoValue);
  if (!ms) return "Unknown";
  return new Date(ms).toISOString().slice(11, 16) + " UTC";
}

function ps99RestartAnalyticsDashboardPayload(analytics) {
  const lifetime = analytics.lifetime;
  const confidence = analytics.confidence;
  const recent7 = analytics.recent.last_7_days;
  const recent30 = analytics.recent.last_30_days;
  const operations = analytics.operations || {};
  const nowMs = ps99RestartAnalyticsDateMs(analytics.generated_at) || Date.now();
  const priorityQueue = analytics.priority_review_queue || [];
  const maintenanceQueue = analytics.maintenance_queue || [];
  const duplicateGroups = analytics.legacy_duplicate_groups || [];

  const pendingIndicator = ps99RestartAnalyticsHealthIndicator(
    operations.pending_reviews,
    3,
    8,
    true
  );
  const latencyIndicator = ps99RestartAnalyticsHealthIndicator(
    operations.average_review_latency_minutes,
    30,
    120,
    true
  );
  const needsEvidenceIndicator = ps99RestartAnalyticsHealthIndicator(
    operations.needs_more_evidence,
    2,
    5,
    true
  );

  const lastCandidateAge = ps99RestartAnalyticsAgeMinutes(
    operations.last_candidate_opened_at,
    nowMs
  );
  const oldestPendingAge = ps99RestartAnalyticsAgeMinutes(
    operations.oldest_pending_opened_at,
    nowMs
  );

  const operatorSummary = priorityQueue.length && maintenanceQueue.length
    ? `${priorityQueue.length} candidate(s) require review. ${maintenanceQueue.length} low-confidence turnover-only candidate(s) are recommended for archival.`
    : priorityQueue.length
      ? `${priorityQueue.length} candidate(s) require review. No routine archival cleanup is currently recommended.`
      : maintenanceQueue.length
        ? `No substantive candidates require review. ${maintenanceQueue.length} maintenance candidate(s) are recommended for archival.`
        : "No pending restart candidates require action.";

  const priorityLines = priorityQueue.map((item, index) => {
    const age = ps99RestartAnalyticsAgeMinutes(item.opened_at, nowMs);
    const triggers = item.trigger_types.length
      ? item.trigger_types.map(ps99RestartAnalyticsTriggerLabel).join(", ")
      : "No trigger metadata";
    const icon = ps99RestartAnalyticsPriorityIcon(item.priority, item.status);
    const statusLabel = item.status === "collecting" ? "Collecting" : "Ready for Review";
    return [
      `${icon} **${index + 1}. ${ps99RestartAnalyticsCandidateTime(item.opened_at)} — ${statusLabel}**`,
      `${ps99RestartAnalyticsConfidenceLabel(item.confidence)} (${item.confidence}%) • ${ps99RestartAnalyticsHumanDuration(age)} old`,
      `Signals: ${triggers}`
    ].join("\n");
  });

  const maintenanceLines = maintenanceQueue.slice(0, 8).map((item, index) => {
    const age = ps99RestartAnalyticsAgeMinutes(item.opened_at, nowMs);
    return [
      `⚪ **${index + 1}. ${ps99RestartAnalyticsCandidateTime(item.opened_at)}**`,
      `Very Low (${item.confidence}%) • ${ps99RestartAnalyticsHumanDuration(age)} old • Public Turnover only`
    ].join("\n");
  });

  const duplicateLines = duplicateGroups.length
    ? duplicateGroups.slice(0, 5).map(group =>
        `• ${group.count} candidates opened within ${group.span_seconds}s at ${ps99RestartAnalyticsCandidateTime(group.opened_at)}`
      )
    : ["No obvious same-event legacy duplicates remain in the pending queue."];

  const populatedDistribution = (analytics.confidence_distribution || [])
    .filter(row => row.candidates > 0);
  const maxDistribution = Math.max(0, ...populatedDistribution.map(row => row.candidates || 0));
  const distributionLines = populatedDistribution.map(row =>
    `\`${row.band.padEnd(6)}\` ${ps99RestartAnalyticsBar(row.candidates, maxDistribution)} ${row.candidates}`
  );

  const populatedCalibration = (analytics.calibration || []).filter(row => row.candidates > 0);
  const calibrationLines = populatedCalibration.map(row =>
    `**${row.band}:** ${row.candidates} reviewed • ${row.confirmed} confirmed • ${row.version_migrations || 0} migrations • ${ps99RestartAnalyticsMetric(row.actual_confirmation_rate, "%")} actual`
  );
  const agreementLines = (analytics.review_agreement || []).map(row =>
    `**${row.band}:** ${row.confirmed} confirmed • ${row.rejected} rejected • ${row.version_migrations || 0} migrations • ${row.unsure} unsure`
  );

  const meaningfulSignals = [...(analytics.trigger_performance || [])]
    .filter(row => row.candidates >= 10)
    .sort((a, b) => b.confirmation_rate - a.confirmation_rate || b.candidates - a.candidates);
  const largestSignalSample = [...(analytics.trigger_performance || [])]
    .sort((a, b) => b.candidates - a.candidates)[0] || null;
  const signalLines = meaningfulSignals.length
    ? meaningfulSignals.slice(0, 6).map((row, index) =>
        `${index < 3 ? ["🥇", "🥈", "🥉"][index] : "•"} **${ps99RestartAnalyticsTriggerLabel(row.trigger)}:** ${row.confirmation_rate}% confirmed (${row.candidates})`
      )
    : [
        "Signal rankings require at least 10 reviewed cases per signal.",
        largestSignalSample
          ? `Largest current sample: **${ps99RestartAnalyticsTriggerLabel(largestSignalSample.trigger)} (${largestSignalSample.candidates})**`
          : "No reviewed signal data yet."
      ];

  const meaningfulCombinations = (analytics.trigger_combinations || [])
    .filter(row => row.candidates >= 5)
    .slice(0, 5);
  const combinationLines = meaningfulCombinations.length
    ? meaningfulCombinations.map(row =>
        `**${ps99RestartAnalyticsTriggerLabel(row.combination)}:** ${row.candidates} reviewed • ${ps99RestartAnalyticsMetric(row.confirmation_rate, "%")} confirmed`
      )
    : ["Trigger-combination rankings require at least 5 reviewed cases."];

  const monthLines = (analytics.monthly_trend || []).map(row =>
    `**${row.month}:** ${row.candidates} candidates • ${row.confirmed} confirmed • ${row.rejected} rejected • ${row.version_migrations || 0} migrations`
  );
  const recommendationLines = analytics.recommendations.length
    ? analytics.recommendations.slice(0, 5).map(item =>
        `**${ps99RestartAnalyticsTriggerLabel(item.signal)} (${item.sample_count}):** ${item.observed_confirmation_rate}% confirmed — ${item.recommendation}`
      )
    : ["No detector-weight recommendation has reached the minimum 10-case sample size."];

  const sections = [
    [
      "# 📊 PS99 Restart Intelligence — Operations Console",
      `**Operator Summary:** ${operatorSummary}`,
      "",
      `**Last Updated:** ${analytics.generated_at}`
    ].join("\n"),

    [
      "## Current Operations",
      `${pendingIndicator} **Pending Reviews:** ${operations.pending_reviews}`,
      `${needsEvidenceIndicator} **Needs More Evidence:** ${operations.needs_more_evidence}`,
      `${latencyIndicator} **Average Review Latency:** ${ps99RestartAnalyticsHumanDuration(operations.average_review_latency_minutes)}`,
      `🕒 **Newest Candidate:** ${lastCandidateAge === null ? "—" : `${ps99RestartAnalyticsHumanDuration(lastCandidateAge)} ago`}`,
      `⏳ **Oldest Pending:** ${oldestPendingAge === null ? "—" : ps99RestartAnalyticsHumanDuration(oldestPendingAge)}`,
      `**Reviews in Last 24 Hours:** ${operations.reviews_last_24_hours}`
    ].join("\n"),

    [
      `## Priority Review Queue (${priorityQueue.length})`,
      ...(priorityLines.length ? priorityLines : ["No substantive candidates currently require review."])
    ].join("\n\n"),

    [
      `## Maintenance Recommendations (${maintenanceQueue.length})`,
      ...(maintenanceLines.length
        ? [
            "Recommended policy: archive Ready-for-Review candidates with confidence ≤19% and Public Turnover as their only signal.",
            "",
            ...maintenanceLines
          ]
        : ["No candidates currently meet the routine archival policy."])
    ].join("\n\n"),

    [
      "## Legacy Duplicate Check",
      ...duplicateLines,
      ...(duplicateGroups.length
        ? ["These are informational. The archival preview remains the safe cleanup mechanism."]
        : [])
    ].join("\n"),

    [
      "## Candidate Workflow",
      `**Opened:** ${lifetime.candidates}`,
      `**Reviewed:** ${lifetime.reviewed}`,
      `**Confirmed:** ${lifetime.confirmed}`,
      `**Rejected:** ${lifetime.rejected}`,
      `**Version Migrations:** ${lifetime.version_migrations || 0}`,
      `**Unsure:** ${lifetime.unsure}`,
      `**Archived:** ${lifetime.archived || 0}`,
      `**Pending:** ${lifetime.pending_review}`,
      `**Reviewed Coverage:** ${ps99RestartAnalyticsMetric(ps99RestartAnalyticsPercent(lifetime.reviewed, lifetime.candidates), "%")}`
    ].join("\n"),

    [
      "## Detector Confidence",
      `**Average — All Active:** ${ps99RestartAnalyticsMetric(confidence.average_all, "%")}`,
      `**Average — Confirmed:** ${ps99RestartAnalyticsMetric(confidence.average_confirmed, "%")}`,
      ...(confidence.average_rejected !== null
        ? [`**Average — Rejected:** ${ps99RestartAnalyticsMetric(confidence.average_rejected, "%")}`]
        : []),
      ...(confidence.average_unsure !== null
        ? [`**Average — Unsure:** ${ps99RestartAnalyticsMetric(confidence.average_unsure, "%")}`]
        : []),
      ...(confidence.average_version_migration !== null
        ? [`**Average — Version Migration:** ${ps99RestartAnalyticsMetric(confidence.average_version_migration, "%")}`]
        : []),
      "",
      "**Current Distribution**",
      ...(distributionLines.length ? distributionLines : ["No confidence data yet."])
    ].join("\n"),

    [
      "## Recent Activity",
      `**Last 7 Days:** ${recent7.candidates} candidates • ${recent7.confirmed} confirmed • ${recent7.rejected} rejected • ${recent7.version_migrations || 0} migrations • ${recent7.pending} pending`,
      `**Last 30 Days:** ${recent30.candidates} candidates • ${recent30.confirmed} confirmed • ${recent30.rejected} rejected • ${recent30.version_migrations || 0} migrations • ${recent30.pending} pending`
    ].join("\n"),

    ...(calibrationLines.length
      ? [[
          "## Confidence Calibration",
          ...calibrationLines,
          "",
          "**Review Agreement**",
          ...agreementLines
        ].join("\n")]
      : []),

    ["## Signal Performance", ...signalLines].join("\n"),
    ["## Trigger Combinations", ...combinationLines].join("\n"),
    ...(monthLines.length ? [["## Historical Trend", ...monthLines].join("\n")] : []),
    ["## Calibration Recommendations", ...recommendationLines].join("\n")
  ];

  return {
    flags: 32768,
    allowed_mentions: { parse: [] },
    components: [
      {
        type: 17,
        accent_color: 3447003,
        components: sections.flatMap((content, index) => [
          ...(index ? [{ type: 14 }] : []),
          { type: 10, content }
        ])
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 2,
            label: `Preview / Archive Recommended (${maintenanceQueue.length})`,
            custom_id: "ps99a|archive_low_turnover|prompt",
            disabled: maintenanceQueue.length === 0
          },
          {
            type: 2,
            style: 1,
            label: "Post Review Cards",
            custom_id: "ps99a|post_review_cards|run",
            disabled: priorityQueue.length === 0
          },
          {
            type: 2,
            style: 2,
            label: "Refresh Dashboard",
            custom_id: "ps99a|refresh|run"
          }
        ]
      }
    ]
  };
}

async function loadPs99RestartAnalyticsCandidates(env) {
  return await supabaseSelectPaged(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "candidate_id,status,opened_at,finalized_at,review_status,reviewed_at,triggers,summary,archived_at,archived_by,archive_reason"
  }, 10000, 1000);
}

async function readPs99RestartAnalyticsState(env) {
  const rows = await supabaseSelect(env, PS99_RESTART_ANALYTICS_STATE_TABLE, {
    select: "*",
    dashboard_key: "eq.main",
    limit: "1"
  }).catch(() => []);
  return rows[0] || null;
}

async function postPs99RestartAnalyticsDashboard(env, analytics, state) {
  const channelId = ps99RestartAnalyticsChannelId(env);
  if (!channelId) {
    return {
      configured: false,
      posted: false,
      reason: "missing_analytics_channel"
    };
  }

  const internalToken = String(env.DISCORD_REVIEW_INTERNAL_TOKEN || "").trim();
  if (!internalToken) throw httpError(500, "Missing DISCORD_REVIEW_INTERNAL_TOKEN.");

  const target = String(env.DISCORD_INTERACTIONS_WORKER_URL || "").trim() ||
    "https://c0ld-discord-interactions-worker.opal-dde.workers.dev";
  const request = new Request(`${target.replace(/\/+$/, "")}/internal/ps99/restart-review-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${internalToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "c0ld-Clan-API-Restart-Analytics"
    },
    body: JSON.stringify({
      channel_id: channelId,
      message_id: String(state?.discord_message_id || "").trim() || null,
      candidate_id: "ps99-restart-analytics-dashboard",
      payload: ps99RestartAnalyticsDashboardPayload(analytics)
    })
  });

  const response = env.DISCORD_INTERACTIONS_WORKER &&
      typeof env.DISCORD_INTERACTIONS_WORKER.fetch === "function"
    ? await env.DISCORD_INTERACTIONS_WORKER.fetch(request)
    : await fetch(request);

  const text = await response.text();
  const body = parseJsonObject(text) || {};
  if (!response.ok || body.ok === false) {
    const error = httpError(502, body.message || `Analytics Discord post failed: ${response.status} ${text}`);
    error.details = body;
    throw error;
  }

  return {
    configured: true,
    posted: true,
    updated: Boolean(body.updated),
    created_new: Boolean(body.created_new),
    replaced_webhook_message: Boolean(body.replaced_webhook_message),
    message_id: stringOrNull(body.message_id),
    channel_id: stringOrNull(body.channel_id) || channelId
  };
}

async function refreshPs99RestartAnalyticsDashboard(env, options = {}) {
  requireSupabase(env);
  const candidates = await loadPs99RestartAnalyticsCandidates(env);
  const analytics = buildPs99RestartHistoricalAnalytics(candidates);
  const state = await readPs99RestartAnalyticsState(env);
  const discord = await postPs99RestartAnalyticsDashboard(env, analytics, state);

  const now = new Date().toISOString();
  const nextState = {
    dashboard_key: "main",
    discord_channel_id: discord.channel_id || state?.discord_channel_id || ps99RestartAnalyticsChannelId(env) || null,
    discord_message_id: discord.message_id || state?.discord_message_id || null,
    analytics,
    candidate_count: analytics.lifetime.candidates,
    reviewed_count: analytics.lifetime.reviewed,
    last_refresh_reason: String(options.reason || "manual").slice(0, 100),
    last_refreshed_at: now,
    updated_at: now
  };
  await supabaseUpsert(env, PS99_RESTART_ANALYTICS_STATE_TABLE, [nextState], "dashboard_key");

  return {
    ok: true,
    analytics,
    discord,
    state: {
      dashboard_key: "main",
      discord_channel_id: nextState.discord_channel_id,
      discord_message_id: nextState.discord_message_id,
      last_refresh_reason: nextState.last_refresh_reason,
      last_refreshed_at: nextState.last_refreshed_at
    }
  };
}

async function handlePs99RestartIntelligenceAnalytics(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const live = String(url.searchParams.get("live") || "false").toLowerCase() === "true";
  if (live) {
    const candidates = await loadPs99RestartAnalyticsCandidates(env);
    return json({
      ok: true,
      source: "live",
      analytics: buildPs99RestartHistoricalAnalytics(candidates)
    }, 200, { "Cache-Control": "no-store" });
  }

  const state = await readPs99RestartAnalyticsState(env);
  if (!state) {
    return json({
      ok: true,
      source: "empty",
      analytics: null,
      message: "Analytics dashboard has not been initialized. POST the refresh endpoint."
    }, 200, { "Cache-Control": "no-store" });
  }

  return json({
    ok: true,
    source: "stored",
    analytics: state.analytics && typeof state.analytics === "object"
      ? state.analytics
      : parseJsonObject(state.analytics),
    state
  }, 200, { "Cache-Control": "no-store" });
}

async function handlePs99RestartIntelligenceAnalyticsRefresh(request, env) {
  const body = await readJsonRequest(request).catch(() => ({}));
  return json(
    await refreshPs99RestartAnalyticsDashboard(env, {
      reason: String(body.reason || "manual_api")
    }),
    200,
    { "Cache-Control": "no-store" }
  );
}


function ps99RestartResolutionCandidateMatches(candidate, mode, options = {}) {
  if (candidate?.archived_at) return false;
  const summary = candidate?.summary && typeof candidate.summary === "object"
    ? candidate.summary
    : parseJsonObject(candidate?.summary);
  const confidence = ps99RestartConfidenceAssessment(summary).score;
  const triggerTypes = ps99RestartAnalyticsTriggerTypes(candidate);
  const status = String(candidate?.status || "").toLowerCase();
  const reviewStatus = String(candidate?.review_status || "unreviewed").toLowerCase();

  if (!["collecting", "ready_for_review", "needs_more_evidence"].includes(status)) return false;
  if (!["unreviewed", "needs_more_evidence", ""].includes(reviewStatus)) return false;

  if (mode === "archive_low_turnover") {
    return status === "ready_for_review" &&
      confidence <= Number(options.confidence_max ?? 19) &&
      triggerTypes.length === 1 &&
      triggerTypes[0] === "public_turnover";
  }

  if (mode === "candidate_ids") {
    const ids = new Set((options.candidate_ids || []).map(String));
    return ids.has(String(candidate?.candidate_id || ""));
  }

  return false;
}

async function resolvePs99RestartPendingCandidates(env, options = {}) {
  requireSupabase(env);
  const mode = String(options.mode || "archive_low_turnover").trim().toLowerCase();
  const dryRun = options.dry_run !== false;
  const reviewedBy = String(options.reviewed_by || "pending_resolution").slice(0, 200);
  const notes = String(
    options.notes ||
    (mode === "archive_low_turnover"
      ? "Archived by low-confidence turnover-only cleanup policy."
      : "Resolved through pending-candidate maintenance.")
  ).slice(0, 10000);

  if (!["archive_low_turnover", "candidate_ids"].includes(mode)) {
    throw httpError(400, "mode must be archive_low_turnover or candidate_ids.");
  }

  const requestedResolution = String(options.resolution || "archived").trim().toLowerCase();
  const allowedResolutions = new Set([
    "archived",
    "confirmed_restart",
    "not_a_restart",
    "unsure",
    "version_migration",
    "needs_more_evidence"
  ]);
  if (!allowedResolutions.has(requestedResolution)) {
    throw httpError(400, "resolution must be archived, confirmed_restart, not_a_restart, unsure, version_migration, or needs_more_evidence.");
  }

  const candidates = await supabaseSelectPaged(env, PS99_RESTART_CANDIDATES_TABLE, {
    select: "*",
    status: "in.(collecting,ready_for_review,needs_more_evidence)",
    order: "opened_at.asc"
  }, 1000, 500);

  const matches = candidates.filter(candidate =>
    ps99RestartResolutionCandidateMatches(candidate, mode, options)
  );

  const preview = matches.map(candidate => {
    const summary = candidate?.summary && typeof candidate.summary === "object"
      ? candidate.summary
      : parseJsonObject(candidate?.summary);
    return {
      candidate_id: candidate.candidate_id,
      opened_at: candidate.opened_at,
      status: candidate.status,
      confidence: ps99RestartConfidenceAssessment(summary).score,
      trigger_types: ps99RestartAnalyticsTriggerTypes(candidate)
    };
  });

  if (dryRun) {
    return {
      ok: true,
      dry_run: true,
      mode,
      resolution: requestedResolution,
      matched_count: preview.length,
      candidates: preview
    };
  }

  const resolvedAt = new Date().toISOString();
  const results = [];

  for (const candidate of matches) {
    let patch;
    let timelineEvent;

    if (requestedResolution === "archived") {
      patch = {
        archived_at: resolvedAt,
        archived_by: reviewedBy,
        archive_reason: notes,
        updated_at: resolvedAt
      };
      timelineEvent = "candidate_archived";
    } else {
      const finalStatus = requestedResolution === "needs_more_evidence"
        ? "needs_more_evidence"
        : "reviewed";
      patch = {
        status: finalStatus,
        review_status: requestedResolution,
        reviewed_at: resolvedAt,
        reviewed_by: reviewedBy,
        review_notes: notes,
        updated_at: resolvedAt
      };
      timelineEvent = "human_review";
    }

    await supabasePatch(
      env,
      PS99_RESTART_CANDIDATES_TABLE,
      { candidate_id: `eq.${candidate.candidate_id}` },
      patch
    );
    await appendPs99RestartCandidateTimeline(
      env,
      candidate.candidate_id,
      resolvedAt,
      timelineEvent,
      patch
    );

    let discord = { posted: false, reason: "archived_candidate_hidden" };
    if (requestedResolution !== "archived") {
      const updatedCandidate = { ...candidate, ...patch };
      discord = await postPs99RestartCandidateReviewMessage(
        env,
        updatedCandidate,
        null,
        true
      ).catch(error => ({
        posted: false,
        error: error?.message || String(error)
      }));
    }

    results.push({
      candidate_id: candidate.candidate_id,
      resolution: requestedResolution,
      archived_at: requestedResolution === "archived" ? resolvedAt : null,
      discord
    });
  }

  const analytics = await refreshPs99RestartAnalyticsDashboard(env, {
    reason: "pending_resolution",
    changed_candidate_ids: matches.map(candidate => candidate.candidate_id)
  });

  return {
    ok: true,
    dry_run: false,
    mode,
    resolution: requestedResolution,
    resolved_count: results.length,
    results,
    analytics
  };
}

async function handlePs99RestartIntelligenceResolvePending(request, env) {
  const body = await readJsonRequest(request);
  return json(
    await resolvePs99RestartPendingCandidates(env, body),
    200,
    { "Cache-Control": "no-store" }
  );
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
  const allowApiOnlyConfirmation = ps99RestartConfirmationMode(env) === "legacy";
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
  let webhookAlert = emptyDiscordFeedResult(env, "ps99_restarts", "no_restart_detected");

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

        if (!allowApiOnlyConfirmation || (requireVersionCorrelation && !versionCorrelated)) {
          suppressedRestart = {
            reason: allowApiOnlyConfirmation
              ? "candidate_turnover_without_version_correlation"
              : "public_server_turnover_is_supporting_evidence_only",
            candidate_started_at: candidateStart,
            confirmation_scans: candidateConfirmations,
            observed_servers: batch.length,
            observed_pages: serverScan.pages_fetched,
            previous_place_version: baselinePlaceVersion,
            current_place_version: currentVersion,
            version_event_detected_at: versionContext.detectedAt || null
          };
          detectorNote = allowApiOnlyConfirmation
            ? "Suppressed possible restart because public server turnover did not correlate with a PS99 place version change."
            : "Public server turnover was recorded as supporting evidence only. A sentinel quorum is required for a restart alert.";
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

  let intelligence = null;
  if (ps99RestartIntelligenceEnabled(env)) {
    intelligence = await capturePs99RestartIntelligenceObservation(env, {
      checkedAt,
      source,
      placeId,
      universeId,
      currentVersion,
      versionContext,
      ccuSample,
      ccuError,
      serverObservation,
      trackedServers,
      candidateServers,
      detectorStatus: status,
      suppressedRestart,
      eventRow
    }).catch(error => ({
      ok: false,
      error: String(error?.message || error).slice(0, 1000)
    }));
  }
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
    webhook_alert: webhookAlert,
    restart_intelligence: intelligence
  }, 202);
}

async function handlePs99AlertTest(env, url) {
  const requestedFeed = String(url.searchParams.get("feed") || "").trim().toLowerCase();
  if (requestedFeed) {
    const aliases = {
      "roblox-updates": "roblox_updates",
      "ps99-updates": "ps99_updates",
      "pet-sim-updates": "ps99_updates",
      "ps99-fflags": "ps99_fflags",
      "pet-sim-fflags-update": "ps99_fflags",
      "ps99-restarts": "ps99_restarts",
      "pet-sim-restarts": "ps99_restarts",
      "ps99-dev-blogs": "ps99_dev_blogs",
      "dev-blogs": "ps99_dev_blogs"
    };
    const feed = aliases[requestedFeed] || requestedFeed.replaceAll("-", "_");
    const supported = ["roblox_updates", "ps99_updates", "ps99_fflags", "ps99_restarts", "ps99_dev_blogs"];
    if (feed !== "all" && !supported.includes(feed)) {
      throw httpError(400, `Use ?feed=${supported.join(", ")}, or all.`);
    }

    const testedAt = new Date().toISOString();
    const feeds = feed === "all" ? supported : [feed];
    const results = {};
    for (const currentFeed of feeds) {
      if (currentFeed === "roblox_updates") {
        results[currentFeed] = await postRobloxReleaseAlert(env, {
          previous_version: "version-test-before",
          current_version: "version-test-after",
          channel: "live",
          binary_type: "WindowsPlayer",
          detected_at: testedAt
        });
      } else if (currentFeed === "ps99_updates") {
        results[currentFeed] = await postPs99VersionAlert(env, [{
          place_id: ps99RootPlaceId(env),
          place_name: "Pet Simulator 99",
          previous_version: 1000,
          current_version: 1001,
          current_published_at: testedAt,
          detected_at: testedAt
        }], testedAt, { test: true });
      } else if (currentFeed === "ps99_fflags") {
        results[currentFeed] = await postRobloxFflagAlert(env, {
          added_keys: ["FFlagC0ldAlertTest"],
          removed_keys: [],
          changed_keys: ["DFIntC0ldAlertTest"],
          detected_at: testedAt
        });
      } else if (currentFeed === "ps99_restarts") {
        results[currentFeed] = await postPs99RestartAlert(env, {
          place_id: ps99RootPlaceId(env),
          place_name: "Pet Simulator 99",
          current_place_version: 1001,
          detected_at: testedAt,
          details: {}
        }, { test: true });
      } else if (currentFeed === "ps99_dev_blogs") {
        results[currentFeed] = await postPs99DevBlogAlert(env, {
          title: "[TEST] Pet Simulator 99 Dev Blog",
          url: ps99DevBlogFeedUrl(env),
          excerpt: "This is a webhook test. No new dev blog was detected.",
          published_at: testedAt
        });
      }
    }

    const ok = Object.values(results).every(result => result?.posted === true);
    return json({
      ok,
      test: true,
      feed,
      tested_at: testedAt,
      alert_config: ps99AlertRuntimeConfig(env),
      results
    }, ok ? 200 : 502);
  }

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
  const sections = events.slice(0, 20).map(event => {
    const placeName = escapeDiscordMarkdown(event.place_name || `Place ${event.place_id}`);
    const previousVersion = ps99AlertVersion(event.previous_version);
    const currentVersion = ps99AlertVersion(event.current_version);
    const published = discordTimestamp(event.current_published_at, "R") || "Unknown";
    return `### ${placeName}\n**Version:** \`${previousVersion}\`  ➜  \`${currentVersion}\`\n**Published:** ${published}`;
  });
  const extraCount = Math.max(0, events.length - 20);
  if (extraCount) sections.push(`*...and ${extraCount} more place update${extraCount === 1 ? "" : "s"}.*`);
  const alertAt = safeIso(detectedAt) || new Date().toISOString();
  const alertUnix = Math.floor(new Date(alertAt).getTime() / 1000);
  const title = `${options.test ? "[TEST] " : ""}📥 Pet Simulator 99 Update`;

  return postDiscordFeedAlert(env, "ps99_updates", {
    ...persistentDiscordComponentPayload(title, sections, alertAt, {
      headerSummary: `${events.length} place update${events.length === 1 ? "" : "s"} detected\nLast Updated: <t:${alertUnix}:R>`
    })
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
  const confidence = escapeDiscordMarkdown(event?.confidence || details?.confidence || "Unrated");
  const sentinelConfirmed = details.confirmation_method === "sentinel_quorum";
  const title = `${options.test ? "[TEST] " : ""}🚨 Pet Simulator 99 Restart`;
  const summary = [
    `**Detected ${relativeTime}**`,
    sentinelConfirmed
      ? "Confidence: **CONFIRMED — live sentinel quorum**"
      : `Confidence: **${confidence}**`
  ].join("\n");
  const restartDetails = [
    `**Time Since Last Restart:** ${ps99AlertElapsed(previousRestartAt, detectedAt)}`,
    `**Place Version at Restart:** ${ps99AlertVersion(restartVersion)}`,
    `**Current Place Version:** ${ps99AlertVersion(currentVersion)}`,
    `**CCU at Restart:** ${ps99AlertCcu(details.ccu_at_restart)}`,
    `**CCU 10 Minutes Before:** ${ps99AlertCcu(details.ccu_10_minutes_before)}`,
    sentinelConfirmed ? "" : null,
    sentinelConfirmed ? "### Confirmation Evidence" : null,
    sentinelConfirmed
      ? `**Sentinels Changed:** ${toNumber(details.probes_changed) || 0}/${toNumber(details.probe_quorum) || 0}`
      : null,
    sentinelConfirmed
      ? `**Independent Machines:** ${toNumber(details.independent_machines) || 0}`
      : null,
    sentinelConfirmed
      ? `**Distinct Old → New Servers:** ${toNumber(details.distinct_previous_jobs) || 0} → ${toNumber(details.distinct_current_jobs) || 0}`
      : null,
    sentinelConfirmed
      ? `**Transition Window:** ${ps99AlertSeconds(details.transition_span_seconds)}`
      : null,
    sentinelConfirmed
      ? `**Version Check:** ${toNumber(details.version_conflict_count) > 0
        ? "Conflict detected"
        : (details.same_version_restart ? "Stronger same-version quorum passed" : "Aligned with the PS99 update")}`
      : null,
    sentinelConfirmed
      ? "-# Roblox's public server list was used only as supporting evidence."
      : null
  ].filter(value => value !== null).join("\n");

  return postDiscordFeedAlert(env, "ps99_restarts", {
    ...persistentDiscordComponentPayload(title, [restartDetails], detectedAt, {
      headerSummary: summary
    })
  });
}

async function postRobloxReleaseAlert(env, event) {
  const previousVersion = escapeDiscordMarkdown(event.previous_version || event.previous_client_version_upload || "Unknown");
  const currentVersion = escapeDiscordMarkdown(event.current_version || event.current_client_version_upload || "Unknown");
  const detectedAt = safeIso(event.detected_at) || new Date().toISOString();
  const detectedUnix = Math.floor(new Date(detectedAt).getTime() / 1000);
  return postDiscordFeedAlert(env, "roblox_updates", {
    ...persistentDiscordComponentPayload("🌐 ROBLOX Client Update", [
      `### Windows Client\n**Version:** \`${previousVersion}\`  ➜  \`${currentVersion}\``
    ], detectedAt, {
      headerSummary: `Last Updated: <t:${detectedUnix}:R>`
    })
  });
}

async function postRobloxFflagAlert(env, event) {
  const added = Array.isArray(event.added_keys) ? event.added_keys : [];
  const removed = Array.isArray(event.removed_keys) ? event.removed_keys : [];
  const changed = Array.isArray(event.changed_keys) ? event.changed_keys : [];
  const keyLines = [
    ...added.map(key => `+ ${key}`),
    ...removed.map(key => `- ${key}`),
    ...changed.map(key => `~ ${key}`)
  ].slice(0, 18);
  const total = added.length + removed.length + changed.length;
  const remainder = Math.max(0, total - keyLines.length);
  const detectedAt = safeIso(event.detected_at) || new Date().toISOString();
  const detectedUnix = Math.floor(new Date(detectedAt).getTime() / 1000);
  const sections = [
    [
      `**Added:** ${added.length}  **Removed:** ${removed.length}  **Changed:** ${changed.length}`,
      keyLines.length ? `\`\`\`diff\n${keyLines.join("\n")}\n\`\`\`` : "",
      remainder ? `*...and ${remainder} more changed setting${remainder === 1 ? "" : "s"}.*` : ""
    ].filter(Boolean).join("\n"),
    "-# Public Roblox client settings only; these are not private PS99 server flags."
  ];
  return postDiscordFeedAlert(env, "ps99_fflags", {
    ...persistentDiscordComponentPayload("🚩 Pet Simulator 99 FFlag Change", sections, detectedAt, {
      headerSummary: `Last Updated: <t:${detectedUnix}:R>`
    })
  });
}

async function postPs99DevBlogAlert(env, post) {
  const publishedAt = safeIso(post.published_at) || new Date().toISOString();
  const publishedUnix = Math.floor(new Date(publishedAt).getTime() / 1000);
  const rawPostTitle = String(post.title || "New Pet Simulator 99 post");
  const postUrl = safeHttpUrl(post.url);
  const linkedTitle = postUrl
    ? `[${escapeDiscordLinkLabel(rawPostTitle)}](${postUrl})`
    : escapeDiscordMarkdown(rawPostTitle);
  const excerpt = String(post.excerpt || "A new official BIG Games Pet Simulator 99 post is available.").slice(0, 3000);
  return postDiscordFeedAlert(env, "ps99_dev_blogs", {
    ...persistentDiscordComponentPayload("📰 Pet Simulator 99 Dev Blog", [
      `### ${linkedTitle}\n${excerpt}\n\n**Published:** <t:${publishedUnix}:R>\n-# Official BIG Games post`
    ], publishedAt, {
      headerSummary: `Last Updated: <t:${publishedUnix}:R>`,
      mediaUrl: post.image_url,
      mediaDescription: `${rawPostTitle} preview image`
    })
  });
}

function escapeDiscordLinkLabel(value) {
  return String(value || "").replace(/([\\[\]])/g, "\\$1");
}

async function postPs99DiscordAlert(env, payload) {
  return postDiscordFeedAlert(env, "ps99_updates", payload);
}

async function postDiscordBotChannelMessage(env, feed, channelId, payload, roleId = "") {
  const body = discordFeedMessageBody(feed, payload, roleId);
  const result = await discordBotChannelMessageRequest(env, {
    method: "POST",
    channelId,
    body
  });
  if (!result.ok) {
    return {
      configured: true,
      posted: false,
      feed,
      reason: result.reason,
      error: result.error
    };
  }
  return {
    configured: true,
    posted: true,
    feed,
    transport: "bot",
    role_mentioned: Boolean(roleId),
    message_id: stringOrNull(result.body?.id),
    channel_id: stringOrNull(result.body?.channel_id) || channelId
  };
}

async function updateDiscordBotChannelMessage(env, feed, channelId, messageId, payload, roleId = "") {
  const body = discordFeedMessageBody(feed, payload, roleId);
  const result = await discordBotChannelMessageRequest(env, {
    method: "PATCH",
    channelId,
    messageId,
    body
  });
  if (!result.ok) {
    return {
      configured: true,
      posted: false,
      updated: false,
      feed,
      reason: result.reason,
      error: result.error
    };
  }
  return {
    configured: true,
    posted: true,
    updated: true,
    feed,
    transport: "bot",
    role_mentioned: Boolean(roleId),
    message_id: stringOrNull(result.body?.id) || String(messageId),
    channel_id: stringOrNull(result.body?.channel_id) || channelId
  };
}

async function inspectDiscordBotChannelMessage(env, channelId, messageId) {
  const result = await discordBotChannelMessageRequest(env, {
    method: "GET",
    channelId,
    messageId
  });
  if (!result.ok) {
    return {
      exists: result.reason === "message_not_found" ? false : null,
      reason: result.reason,
      message_id: String(messageId),
      error: result.error
    };
  }
  return {
    exists: true,
    reason: "found",
    message_id: stringOrNull(result.body?.id) || String(messageId),
    channel_id: stringOrNull(result.body?.channel_id) || channelId,
    flags: toNumber(result.body?.flags) || 0,
    edited_timestamp: safeIso(result.body?.edited_timestamp),
    timestamp: safeIso(result.body?.timestamp)
  };
}

async function deleteDiscordBotChannelMessage(env, channelId, messageId) {
  const result = await discordBotChannelMessageRequest(env, {
    method: "DELETE",
    channelId,
    messageId
  });
  return result.ok
    ? { deleted: true, reason: "deleted", message_id: String(messageId) }
    : {
      deleted: result.reason === "message_not_found",
      reason: result.reason,
      message_id: String(messageId),
      error: result.error
    };
}

async function discordBotChannelMessageRequest(env, { method, channelId, messageId = null, body = null }) {
  const botToken = String(env.DISCORD_BOT_TOKEN || "").trim();
  if (!botToken) return { ok: false, reason: "discord_bot_token_missing", error: "DISCORD_BOT_TOKEN is not configured." };
  if (!/^\d{5,30}$/.test(String(channelId || ""))) {
    return { ok: false, reason: "invalid_channel_id", error: "The Discord channel ID is invalid." };
  }

  const suffix = messageId ? `/messages/${encodeURIComponent(messageId)}` : "/messages";
  const url = `${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}${suffix}`;
  let lastError = "Discord bot message request failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const headers = { Authorization: `Bot ${botToken}` };
      if (body !== null) headers["Content-Type"] = "application/json";
      const response = await fetch(url, {
        method,
        headers,
        body: body === null ? undefined : JSON.stringify(body)
      });
      const responseText = await response.text();
      const responseBody = parseJsonObject(responseText) || {};
      if (response.ok) return { ok: true, status: response.status, body: responseBody };
      if (response.status === 404) {
        return { ok: false, status: 404, reason: "message_not_found", error: responseText.slice(0, 500) };
      }

      lastError = `Discord bot API returned HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`;
      if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
        const retrySeconds = toNumber(responseBody.retry_after);
        await sleep(response.status === 429 && retrySeconds !== null
          ? clamp(retrySeconds * 1000, 500, 15000)
          : attempt * 1000);
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
    ok: false,
    reason: "discord_bot_request_failed",
    error: lastError.slice(0, 500)
  };
}

async function postDiscordFeedAlert(env, feed, payload) {
  const config = discordFeedConfig(env, feed);
  if (!config.configured) return emptyDiscordFeedResult(env, feed, "webhook_not_configured");
  if (!config.webhook_url) return emptyDiscordFeedResult(env, feed, "invalid_webhook_url");

  const roleId = config.role_id;
  const body = discordFeedMessageBody(feed, payload, roleId);
  const webhookUrl = new URL(config.webhook_url);
  webhookUrl.searchParams.set("wait", "true");
  if (isDiscordComponentsV2Payload(body)) {
    webhookUrl.searchParams.set("with_components", "true");
  }
  let lastError = "Discord webhook request failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(webhookUrl.toString(), {
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
          feed,
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
    feed,
    role_mentioned: false,
    reason: "webhook_request_failed",
    error: lastError.slice(0, 500)
  };
}

async function postDiscordWebhookMessage(webhookUrlValue, body) {
  const webhookUrl = new URL(webhookUrlValue);
  webhookUrl.searchParams.set("wait", "true");
  if (isDiscordComponentsV2Payload(body)) {
    webhookUrl.searchParams.set("with_components", "true");
  }
  let lastError = "Discord webhook request failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(webhookUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      const responseBody = parseJsonObject(responseText) || {};

      if (response.ok) {
        return { ok: true, status: response.status, body: responseBody };
      }

      lastError = `Discord webhook returned HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`;
      if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
        const retrySeconds = toNumber(responseBody.retry_after);
        await sleep(response.status === 429 && retrySeconds !== null
          ? clamp(retrySeconds * 1000, 500, 15000)
          : attempt * 1000);
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
    ok: false,
    reason: "webhook_request_failed",
    error: lastError.slice(0, 500)
  };
}

async function updateDiscordFeedMessage(env, feed, messageId, payload) {
  const config = discordFeedConfig(env, feed);
  if (!config.configured) return emptyDiscordFeedResult(env, feed, "webhook_not_configured");
  if (!config.webhook_url) return emptyDiscordFeedResult(env, feed, "invalid_webhook_url");
  const webhookUrl = new URL(config.webhook_url);
  webhookUrl.search = "";
  webhookUrl.pathname = `${webhookUrl.pathname.replace(/\/$/, "")}/messages/${encodeURIComponent(messageId)}`;
  webhookUrl.searchParams.set("wait", "true");
  const body = discordFeedMessageBody(feed, payload, config.role_id);
  if (isDiscordComponentsV2Payload(body)) {
    webhookUrl.searchParams.set("with_components", "true");
  }
  let lastError = "Discord webhook message update failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(webhookUrl.toString(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      const responseBody = parseJsonObject(responseText) || {};
      if (response.ok) {
        return {
          configured: true,
          posted: true,
          updated: true,
          feed,
          role_mentioned: Boolean(config.role_id),
          message_id: stringOrNull(responseBody.id) || String(messageId)
        };
      }
      if (response.status === 404) {
        return {
          configured: true,
          posted: false,
          updated: false,
          feed,
          reason: "message_not_found"
        };
      }
      lastError = `Discord webhook update returned HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`;
      if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
        const retrySeconds = toNumber(responseBody.retry_after);
        await sleep(response.status === 429 && retrySeconds !== null
          ? clamp(retrySeconds * 1000, 500, 15000)
          : attempt * 1000);
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
    updated: false,
    feed,
    reason: "webhook_update_failed",
    error: lastError.slice(0, 500)
  };
}

async function inspectDiscordFeedMessage(env, feed, messageId) {
  const config = discordFeedConfig(env, feed);
  if (!config.configured) return { exists: null, reason: "webhook_not_configured" };
  if (!config.webhook_url) return { exists: null, reason: "invalid_webhook_url" };
  const messageUrl = discordFeedMessageUrl(config.webhook_url, messageId);
  let lastError = "Discord webhook message lookup failed.";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(messageUrl, { method: "GET" });
      const responseText = await response.text();
      const responseBody = parseJsonObject(responseText) || {};
      if (response.ok) {
        return {
          exists: true,
          reason: "found",
          message_id: stringOrNull(responseBody.id) || String(messageId),
          channel_id: stringOrNull(responseBody.channel_id),
          flags: toNumber(responseBody.flags) || 0,
          edited_timestamp: safeIso(responseBody.edited_timestamp),
          timestamp: safeIso(responseBody.timestamp)
        };
      }
      if (response.status === 404) {
        return { exists: false, reason: "message_not_found", message_id: String(messageId) };
      }
      lastError = `Discord webhook lookup returned HTTP ${response.status}${responseText ? `: ${responseText.slice(0, 300)}` : ""}`;
      if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
        const retrySeconds = toNumber(responseBody.retry_after);
        await sleep(response.status === 429 && retrySeconds !== null
          ? clamp(retrySeconds * 1000, 500, 15000)
          : attempt * 1000);
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
    exists: null,
    reason: "message_lookup_failed",
    message_id: String(messageId),
    error: lastError.slice(0, 500)
  };
}

async function deleteDiscordFeedMessage(env, feed, messageId) {
  const config = discordFeedConfig(env, feed);
  if (!config.configured) return { deleted: false, reason: "webhook_not_configured" };
  if (!config.webhook_url) return { deleted: false, reason: "invalid_webhook_url" };
  const messageUrl = discordFeedMessageUrl(config.webhook_url, messageId);
  try {
    const response = await fetch(messageUrl, { method: "DELETE" });
    if (response.ok || response.status === 404) {
      return {
        deleted: true,
        reason: response.status === 404 ? "message_not_found" : "deleted",
        message_id: String(messageId)
      };
    }
    const text = await response.text();
    return {
      deleted: false,
      reason: "webhook_delete_failed",
      message_id: String(messageId),
      error: `Discord webhook delete returned HTTP ${response.status}${text ? `: ${text.slice(0, 300)}` : ""}`
    };
  } catch (error) {
    return {
      deleted: false,
      reason: "webhook_delete_failed",
      message_id: String(messageId),
      error: String(error?.message || error).slice(0, 500)
    };
  }
}

function discordFeedMessageUrl(webhookUrl, messageId) {
  const url = new URL(webhookUrl);
  url.search = "";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/messages/${encodeURIComponent(messageId)}`;
  return url.toString();
}

function discordFeedMessageBody(feed, payload, roleId) {
  const styledPayload = styleDiscordFeedAlert(feed, payload);
  if (isDiscordComponentsV2Payload(styledPayload)) {
    const components = [...styledPayload.components];
    if (roleId) components.unshift({ type: 10, content: `<@&${roleId}>` });
    return {
      ...styledPayload,
      components,
      allowed_mentions: {
        parse: [],
        roles: roleId ? [roleId] : []
      }
    };
  }
  return {
    ...styledPayload,
    content: roleId ? `<@&${roleId}>` : (styledPayload.content ?? null),
    allowed_mentions: {
      parse: [],
      roles: roleId ? [roleId] : []
    }
  };
}

function styleDiscordFeedAlert(feed, payload = {}) {
  if (isDiscordComponentsV2Payload(payload)) {
    return { ...payload };
  }
  const alertTitles = {
    roblox_updates: "🌐 ROBLOX Client Update",
    ps99_updates: "📥 Pet Simulator 99 Update",
    ps99_fflags: "🚩 Pet Simulator 99 FFlag Change",
    ps99_restarts: "🚨 Pet Simulator 99 Restart",
    ps99_dev_blogs: "📰 Pet Simulator 99 Dev Blog",
    reward_cutoffs: "🏅 Reward Cutoffs",
    roblox_status: "🌐 ROBLOX Status",
    versions_status: "📥 Versions"
  };
  const embeds = Array.isArray(payload.embeds) ? payload.embeds : [];
  if (!embeds.length) return { ...payload };

  const firstEmbed = embeds[0] || {};
  const rawTitle = String(firstEmbed.title || "").trim();
  const isTest = /^\[TEST\]/i.test(rawTitle);
  const cleanTitle = rawTitle.replace(/^\[TEST\]\s*/i, "").trim();
  const titleDetail = feed === "ps99_dev_blogs" && cleanTitle ? ` | ${cleanTitle}` : "";
  const title = `${isTest ? "[TEST] " : ""}${alertTitles[feed] || cleanTitle || "Automated Alert"}${titleDetail}`;
  const timestamp = safeIso(firstEmbed.timestamp) || new Date().toISOString();
  const unix = Math.floor(new Date(timestamp).getTime() / 1000);
  const sections = [];

  embeds.forEach(embed => {
    const description = cleanLegacyDiscordAlertText(embed?.description);
    if (description) sections.push(description);
    (Array.isArray(embed?.fields) ? embed.fields : []).forEach(field => {
      const name = String(field?.name || "").trim();
      const value = String(field?.value || "").trim();
      if (name || value) sections.push([name ? `### ${name}` : "", value].filter(Boolean).join("\n"));
    });
  });

  const { embeds: discardedEmbeds, content: discardedContent, flags: discardedFlags, components: discardedComponents, ...rest } = payload;
  return {
    ...rest,
    ...persistentDiscordComponentPayload(title, sections, timestamp, {
      headerSummary: `Last Updated: <t:${unix}:R>`
    })
  };
}

function cleanLegacyDiscordAlertText(value) {
  return String(value || "")
    .replace(/^\s*~~[━─—-]{3,}~~\s*$/gmu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function isDiscordComponentsV2Payload(payload) {
  return Boolean((toNumber(payload?.flags) || 0) & DISCORD_COMPONENTS_V2_FLAG) &&
    Array.isArray(payload?.components);
}

function ps99AlertRuntimeConfig(env) {
  return {
    feeds: Object.fromEntries([
      "roblox_updates",
      "ps99_updates",
      "ps99_fflags",
      "ps99_restarts",
      "ps99_dev_blogs",
      "reward_cutoffs",
      "roblox_status",
      "versions_status"
    ].map(feed => {
      const config = discordFeedConfig(env, feed);
      return [feed, {
        webhook_configured: config.configured,
        webhook_valid: Boolean(config.webhook_url),
        role_id_configured: Boolean(config.role_id),
        legacy_fallback: config.legacy_fallback
      }];
    })),
    reward_cutoff_schedule: {
      minutes: rewardCutoffScheduleMinutes(env),
      offset_minutes: rewardCutoffScheduleOffsetMinutes(env)
    }
  };
}

function emptyDiscordFeedResult(env, feed, reason) {
  const config = discordFeedConfig(env, feed);
  return {
    feed,
    configured: config.configured,
    posted: false,
    reason,
    legacy_fallback: config.legacy_fallback
  };
}

function discordFeedConfig(env, feed) {
  const legacyWebhook = String(env.PS99_ALERT_WEBHOOK_URL || "").trim();
  const legacyRole = String(env.PS99_ALERT_ROLE_ID || "").trim();
  const definitions = {
    roblox_updates: [env.ROBLOX_UPDATES_WEBHOOK_URL, env.ROBLOX_UPDATES_ROLE_ID || DEFAULT_DETECTOR_ALERT_ROLE_ID],
    ps99_updates: [env.PS99_UPDATES_WEBHOOK_URL || legacyWebhook, env.PS99_UPDATES_ROLE_ID || legacyRole],
    ps99_fflags: [env.PS99_FFLAGS_WEBHOOK_URL, env.PS99_FFLAGS_ROLE_ID],
    ps99_restarts: [env.PS99_RESTARTS_WEBHOOK_URL || legacyWebhook, env.PS99_RESTARTS_ROLE_ID || legacyRole || DEFAULT_DETECTOR_ALERT_ROLE_ID],
    ps99_dev_blogs: [env.PS99_DEV_BLOG_WEBHOOK_URL, env.PS99_DEV_BLOG_ROLE_ID],
    reward_cutoffs: [env.REWARD_CUTOFFS_WEBHOOK_URL, env.REWARD_CUTOFFS_ROLE_ID],
    roblox_status: [env.ROBLOX_STATUS_WEBHOOK_URL, env.ROBLOX_STATUS_ROLE_ID],
    versions_status: [env.VERSIONS_WEBHOOK_URL, env.VERSIONS_ROLE_ID]
  };
  const definition = definitions[feed] || [null, null];
  const rawWebhook = String(definition[0] || "").trim();
  const rawRole = String(definition[1] || "").trim();
  const legacyFallback = Boolean(legacyWebhook && (
    (feed === "ps99_updates" && !String(env.PS99_UPDATES_WEBHOOK_URL || "").trim())
    || (feed === "ps99_restarts" && !String(env.PS99_RESTARTS_WEBHOOK_URL || "").trim())
  ));
  return {
    feed,
    configured: Boolean(rawWebhook),
    webhook_url: validatedDiscordWebhookUrl(rawWebhook),
    role_id: /^\d{5,30}$/.test(rawRole) ? rawRole : "",
    legacy_fallback: legacyFallback
  };
}

function validatedDiscordWebhookUrl(raw) {
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

function ps99AlertSeconds(value) {
  const seconds = Math.max(0, Math.round(toNumber(value) || 0));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
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

async function memberSnapshotRecentGate(env, clan, battleKeyValue, fetchedAt, force = false) {
  const minMinutes = memberSnapshotMinIntervalMinutes(env);
  if (force) return { allowed: true, reason: "recent_guard_bypassed" };
  if (minMinutes <= 0) return { allowed: true, reason: "recent_guard_disabled" };

  const latest = await fetchLatestSnapshotMeta(env, clan, battleKeyValue).catch(() => null);
  return snapshotRecentGateResult({
    scope: "member snapshot",
    battleKeyValue,
    fetchedAt,
    latest,
    minMinutes
  });
}

async function clansSnapshotRecentGate(env, battleKeyValue, fetchedAt, force = false) {
  const minMinutes = clansSnapshotMinIntervalMinutes(env);
  if (force) return { allowed: true, reason: "recent_guard_bypassed" };
  if (minMinutes <= 0) return { allowed: true, reason: "recent_guard_disabled" };

  const latest = await fetchLatestClanSnapshotMeta(env, battleKeyValue).catch(() => null);
  return snapshotRecentGateResult({
    scope: "top clans snapshot",
    battleKeyValue,
    fetchedAt,
    latest,
    minMinutes
  });
}

function snapshotRecentGateResult({
  scope,
  battleKeyValue,
  fetchedAt,
  latest,
  minMinutes
}) {
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
    message: `${scope} ingest skipped because the latest snapshot is ${ageMinutes.toFixed(1)} minutes old. Minimum interval is ${minMinutes} minutes.`,
    battle_key: battleKeyValue,
    latest_snapshot_id: latest.snapshot_id || null,
    latest_snapshot_at: latest.fetched_at || null,
    min_snapshot_interval_minutes: minMinutes,
    next_allowed_at: nextAllowedAt
  };
}

async function fetchClanActivityCurrentRows(env, battleKeyValue) {
  return supabaseSelectPaged(env, CLAN_ACTIVITY_CURRENT_TABLE, {
    // Diamond donations live in the nested raw member/contribution payloads.
    // Include them in the previous-state lookup so a cumulative delta can be
    // turned into a real activity event.
    select: "battle_key,clan_name,clan_key,clan_rank,user_id,username,display_name,role,permission_level,join_time,points,kick_available,member_count,member_capacity,raw_member,raw_contribution",
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

function clanActivityDiamondDonationObservation(row) {
  // BIG Games has used more than one spelling/nesting shape for this value.
  // Inspect only fields whose key/path explicitly says both "diamond" and
  // "donation" (or contribution), which prevents normal clan points from
  // being mistaken for diamonds.  The largest matching cumulative value is
  // the one we compare between snapshots.
  const best = { total: null, path: null };
  const visited = new Set();
  const sources = [
    ["member", row?.raw_member],
    ["contribution", row?.raw_contribution]
  ];

  const hasDonationMeaning = pieces => {
    const joined = pieces.join("_").toLowerCase().replace(/[^a-z0-9]/g, "");
    return joined.includes("diamond")
      && (joined.includes("donat") || joined.includes("contribut"));
  };

  const visit = (value, path = [], depth = 0) => {
    if (depth > 6 || value === null || value === undefined) return;
    if (typeof value === "number" || typeof value === "string") {
      const numeric = toNumber(value);
      if (numeric !== null && numeric >= 0 && hasDonationMeaning(path)) {
        if (best.total === null || numeric > best.total) {
          best.total = numeric;
          best.path = path.join(".");
        }
      }
      return;
    }
    if (typeof value !== "object" || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, String(index)], depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      visit(child, [...path, key], depth + 1);
    }
  };

  for (const [label, value] of sources) visit(value, [label]);
  return best;
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

      const previousDonation = clanActivityDiamondDonationObservation(previous);
      const currentDonation = clanActivityDiamondDonationObservation(current);
      if (
        previousDonation.total !== null
        && currentDonation.total !== null
        && currentDonation.total > previousDonation.total
      ) {
        const amount = currentDonation.total - previousDonation.total;
        events.push(clanActivityEvent({
          fetchedAt,
          source,
          battleKey,
          battleMeta,
          clanRow,
          eventType: "diamond_donation",
          userRow: current,
          previousValue: String(previousDonation.total),
          currentValue: String(currentDonation.total),
          details: {
            diamond_donation_amount: amount,
            diamond_donation_total: currentDonation.total,
            previous_diamond_donation_total: previousDonation.total,
            diamond_donation_source: currentDonation.path || previousDonation.path || null
          }
        }));
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
  const memberDetails = userRow ? {
    member_count: toNumber(userRow.member_count),
    member_capacity: toNumber(userRow.member_capacity),
    member_points: toNumber(userRow.points),
    join_time: userRow.join_time || null
  } : {};

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
      ...memberDetails,
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

async function addBattleRowPresence(env, rows, tableName, filtersForRow) {
  return Promise.all(rows.map(async row => {
    const matches = await supabaseSelect(env, tableName, {
      select: "id",
      ...filtersForRow(row),
      limit: "1"
    }).catch(() => []);

    return {
      ...row,
      has_rows: matches.length > 0
    };
  }));
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
        join_time: memberJoinIso(row),
        username: stringOrNull(firstDefined(
          row.raw_member?.Username,
          row.raw_member?.username,
          row.raw_member?.Name,
          row.raw_member?.name,
          row.raw_contribution?.Username,
          row.raw_contribution?.username,
          row.raw_contribution?.Name,
          row.raw_contribution?.name
        )),
        display_name: stringOrNull(firstDefined(
          row.raw_member?.DisplayName,
          row.raw_member?.displayName,
          row.raw_member?.Display,
          row.raw_member?.display,
          row.raw_contribution?.DisplayName,
          row.raw_contribution?.displayName
        )),
        source_clan_leaderboard_rank: toNumber(clanRow.rank),
        source_clan_leaderboard_points: toNumber(clanRow.points) || 0
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
  leaderboardPageCache = null,
  ingestGateContext = null
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
      if (ingestGateContext) assertBattleIngestStillOpen(ingestGateContext);

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
        if (ingestGateContext) assertBattleIngestStillOpen(ingestGateContext);

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

async function attachClanActivityJoinGlobalRanks(env, eventRows, battleKeyValue = null) {
  const joins = (eventRows || []).filter(event =>
    String(event?.event_type || "").toLowerCase() === "member_joined" &&
    /^\d+$/.test(String(event?.user_id || ""))
  );
  if (!joins.length) return eventRows;

  const run = await findLatestGlobalRankSearchRun(env, clanName(env), battleKeyValue).catch(() => null);
  if (!run?.run_key) return eventRows;

  const rankedCandidates = await readGlobalRankRankedCandidates(env, run.run_key);
  if (!rankedCandidates.length) return eventRows;

  const candidateByUserId = new Map(rankedCandidates.map(row => [String(row.user_id), row]));
  const totalPlayers = toNumber(run.total_global_players) ||
    toNumber(run.candidate_player_count) ||
    rankedCandidates.length;

  for (const event of joins) {
    const candidate = candidateByUserId.get(String(event.user_id));
    if (!candidate?.global_rank) continue;
    event.details = {
      ...(event.details && typeof event.details === "object" ? event.details : {}),
      global_rank: candidate.global_rank,
      global_rank_total: totalPlayers,
      global_rank_points: toNumber(candidate.points),
      global_rank_snapshot_at: run.finished_at || run.updated_at || null
    };
  }
  return eventRows;
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
  if (String(env.GLOBAL_RANK_RETENTION_ENABLED || "false").toLowerCase() !== "true") {
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

  const battleEndByKey = new Map();
  await Promise.all([...groups.keys()].map(async battleKeyValue => {
    const run = await fetchBattleRun(env, clan, battleKeyValue).catch(() => null);
    battleEndByKey.set(battleKeyValue, isoToMs(run?.battle_ended_at));
  }));

  const deleteRows = new Map();
  for (const [battleKeyValue, group] of groups.entries()) {
    const sorted = group
      .slice()
      .sort((a, b) => globalRankRunSortTime(b) - globalRankRunSortTime(a));
    const isCurrentBattle = currentBattleKey && battleKeyValue === String(currentBattleKey);
    const isEndedGroup = !isCurrentBattle || currentBattleEnded;
    const battleEndMs = battleEndByKey.get(battleKeyValue) ||
      (isCurrentBattle ? isoToMs(currentBattleEndedAt) : null);
    const keepFinal = isEndedGroup
      ? (
        sorted.find(row =>
          ["ok", "completed"].includes(String(row.status || "").toLowerCase()) &&
          (!battleEndMs || globalRankRunSnapshotTime(row) <= battleEndMs)
        ) ||
        (!battleEndMs ? sorted[0] : null) ||
        null
      )
      : null;

    for (const row of sorted) {
      const runKey = String(row.run_key || "").trim();
      if (!runKey) continue;
      if (runKey === currentRunKey && (!isEndedGroup || runKey === String(keepFinal?.run_key || ""))) continue;
      if (keepFinal?.run_key && runKey === String(keepFinal.run_key)) continue;

      const runMs = globalRankRunSortTime(row);
      if (isEndedGroup || (runMs && runMs < cutoffMs)) {
        deleteRows.set(runKey, { run_key: runKey, run_ms: runMs });
      }
    }
  }

  const eligibleRows = [...deleteRows.values()]
    .sort((a, b) => a.run_ms - b.run_ms);
  const selectedKeys = eligibleRows
    .slice(0, globalRankRetentionDeleteRunsPerPass(env))
    .map(row => row.run_key);
  const deletedRuns = await deleteGlobalRankRunData(env, selectedKeys);
  return {
    deleted_runs: deletedRuns,
    eligible_runs: eligibleRows.length,
    remaining_runs: Math.max(0, eligibleRows.length - deletedRuns),
    retention_hours: retentionHours,
    mode: currentBattleEnded ? "final-snapshot" : "rolling"
  };
}

function globalRankRunSortTime(row) {
  return isoToMs(row?.finished_at) || isoToMs(row?.updated_at) || isoToMs(row?.started_at) || 0;
}

function globalRankRunSnapshotTime(row) {
  return isoToMs(row?.started_at) || isoToMs(row?.updated_at) || isoToMs(row?.finished_at) || 0;
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
  const finalRows = buildGlobalRankCurrentRows({
    members: clanMembers,
    candidateById,
    clan,
    latest,
    eventName,
    fetchedAt,
    candidatePlayerCount,
    runKey
  });
  const secondaryClanRows = (await runLimited(
    clanNames(env).filter(name => normalizeText(name) !== normalizeText(clan)),
    3,
    async trackedClan => {
      const members = await fetchCurrentRows(env, trackedClan).catch(() => []);
      return buildGlobalRankCurrentRows({
        members,
        candidateById,
        clan: trackedClan,
        latest: latestMetaFromRows(members) || latest,
        eventName,
        fetchedAt,
        candidatePlayerCount,
        runKey
      });
    }
  )).flat();
  const publishedRows = [...finalRows, ...secondaryClanRows];
  const historyRows = dedupeGlobalRankHistoryRows(publishedRows);

  if (publishCurrent) {
    await supabaseUpsert(env, GLOBAL_RANK_CURRENT_TABLE, publishedRows, "clan_name,user_id");
    await deleteStaleGlobalRankCurrentRows(env, publishedRows, runKey);
  }
  await supabaseUpsert(env, GLOBAL_RANK_HISTORY_TABLE, historyRows.map(row => ({
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
  })), "run_key,clan_name,user_id");

  return {
    rows: finalRows,
    foundMemberCount: finalRows.filter(row => row.found).length,
    publishedCurrent: publishCurrent
  };
}

async function deleteStaleGlobalRankCurrentRows(env, rows, runKey) {
  const normalizedRunKey = String(runKey || "").trim();
  if (!normalizedRunKey) return;

  const clans = [];
  const seen = new Set();
  for (const row of rows || []) {
    const clan = String(row.clan_name || "").trim();
    const key = normalizeText(clan);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    clans.push(clan);
  }

  for (const clan of clans) {
    try {
      await supabaseDelete(env, GLOBAL_RANK_CURRENT_TABLE, {
        clan_name: `eq.${clan}`,
        run_key: `neq.${normalizedRunKey}`
      });
    } catch (err) {
      console.warn("Global rank current stale-row cleanup failed", {
        clan,
        run_key: normalizedRunKey,
        error: err?.message || String(err)
      });
    }
  }
}

function dedupeGlobalRankHistoryRows(rows) {
  const seen = new Set();
  const output = [];

  for (const row of rows || []) {
    const userId = toNumber(row.user_id);
    const clanKey = normalizeText(row.clan_name);
    if (!userId || !clanKey) continue;

    const key = `${clanKey}:${userId}`;
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(row);
  }

  return output;
}

function buildGlobalRankCurrentRows({
  members,
  candidateById,
  clan,
  latest,
  eventName,
  fetchedAt,
  candidatePlayerCount,
  runKey
}) {
  return (members || []).map(member => {
    const userId = toNumber(member.user_id);
    const match = candidateById.get(String(userId));

    return {
      clan_name: String(member.clan_name || clan || "").trim(),
      user_id: userId,
      username: String(member.username || `user_${userId}`).trim(),
      display_name: member.display_name || null,
      avatar_url: member.avatar_url || null,
      clan_rank: toNumber(member.clan_rank ?? member.rank),
      clan_points: toNumber(member.clan_points ?? member.total_points) || 0,
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

  const cached = await readDerivedSnapshotCache(env, "member-gains-v2", latest);
  if (Array.isArray(cached?.rows)) return cached.rows;

  const latestMs = new Date(latest.fetched_at).getTime();
  if (!Number.isFinite(latestMs)) {
    return rows.map(row => addNullGains(row));
  }

  const windows = [
    { key: "gain_5m", minutes: 5, tolerance: 4 },
    { key: "gain_1h", minutes: 60, tolerance: 35 },
    { key: "gain_6h", minutes: 6 * 60, tolerance: 20 },
    { key: "gain_12h", minutes: 12 * 60, tolerance: 25 },
    { key: "gain_24h", minutes: 24 * 60, tolerance: 45 }
  ];

  const maps = {};
  let fallbackHourly = null;

  for (const window of windows) {
    const targetMs = latestMs - window.minutes * 60 * 1000;
    const oldRows = await fetchNearestSnapshotRows(env, latest, targetMs, window.tolerance);
    maps[window.key] = new Map(
      oldRows.map(row => [String(row.user_id), toNumber(row.total_points) || 0])
    );
  }

  if (!maps.gain_1h?.size) {
    const fallbackRows = await fetchFallbackHourlySnapshotRows(env, latest, latestMs);
    const fallbackMs = new Date(fallbackRows[0]?.fetched_at || 0).getTime();
    const elapsedHours = Number.isFinite(fallbackMs) && fallbackMs > 0
      ? (latestMs - fallbackMs) / (60 * 60 * 1000)
      : 0;
    if (elapsedHours > 0) {
      fallbackHourly = {
        elapsedHours,
        points: new Map(fallbackRows.map(row => [String(row.user_id), toNumber(row.total_points) || 0]))
      };
    }
  }

  const output = rows.map(row => {
    const key = String(row.user_id);
    const out = { ...row };
    const currentPoints = toNumber(row.total_points) || 0;

    for (const window of windows) {
      const oldPoints = maps[window.key].get(key);
      if (oldPoints !== undefined) {
        out[window.key] = Math.max(0, currentPoints - oldPoints);
        continue;
      }

      if (window.key === "gain_1h" && fallbackHourly?.points?.has(key)) {
        out[window.key] = Math.max(
          0,
          Math.round((currentPoints - fallbackHourly.points.get(key)) / fallbackHourly.elapsedHours)
        );
        continue;
      }

      out[window.key] = null;
    }

    return out;
  });

  await writeDerivedSnapshotCache(env, "member-gains-v2", latest, { rows: output });
  return output;
}

async function addDowntimeFields(env, rows, latest) {
  if (!rows.length) return [];

  if (rows.every(hasIncrementalDowntimeState)) {
    return rows.map(row => addIncrementalDowntime(row, latest));
  }

  const cached = await readDerivedSnapshotCache(env, "member-downtime-v2", latest);
  if (Array.isArray(cached?.rows)) return cached.rows;

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

  const output = rows.map(row => {
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

  await writeDerivedSnapshotCache(env, "member-downtime-v2", latest, { rows: output });
  return output;
}

async function addClanGainFields(env, rows, latest) {
  if (!rows.length) return [];

  const cached = await readDerivedSnapshotCache(env, "clan-gains-v2", latest);
  if (Array.isArray(cached?.rows)) return cached.rows;

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

  const output = rows.map(row => {
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

  await writeDerivedSnapshotCache(env, "clan-gains-v2", latest, { rows: output });
  return output;
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

async function fetchFallbackHourlySnapshotRows(env, latest, latestMs) {
  const minAgeMs = 45 * 60 * 1000;
  const maxAgeMs = 4 * 60 * 60 * 1000;
  const afterIso = new Date(latestMs - maxAgeMs).toISOString();
  const beforeIso = new Date(latestMs - minAgeMs).toISOString();
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
    const ms = new Date(group[0]?.fetched_at || 0).getTime();
    if (!Number.isFinite(ms) || ms <= 0 || ms >= latestMs) continue;
    if (!best || ms > best.ms) best = { snapshotId, group, ms };
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
  const battleRun = await fetchBattleRun(env, clan, battle).catch(() => null);
  const params = {
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    order: "fetched_at.desc",
    limit: "1"
  };
  if (battleRun?.battle_ended_at) params.fetched_at = `lte.${battleRun.battle_ended_at}`;
  let rows = await supabaseSelect(env, SNAPSHOT_TABLE, params);
  if (!rows.length) {
    rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
      ...params,
      clan_name: `ilike.${clan}`
    });
  }

  if (
    rows[0]?.battle_ended_at &&
    !isSnapshotAtOrBeforeEventEnd(rows[0].fetched_at, rows[0].battle_ended_at)
  ) {
    rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
      ...params,
      fetched_at: `lte.${rows[0].battle_ended_at}`
    });
  }

  return rows[0] || null;
}

async function fetchCurrentRows(env, clan) {
  const params = {
    select: "snapshot_id,fetched_at,clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,rank,username,user_id,total_points,last_gain_at,downtime_tracking_started_at,raw_member",
    clan_name: `eq.${clan}`,
    order: "rank.asc",
    limit: "1000"
  };
  let rows = await supabaseSelect(env, CURRENT_TABLE, params);
  if (!rows.length) {
    rows = await supabaseSelect(env, CURRENT_TABLE, {
      ...params,
      clan_name: `ilike.${clan}`
    });
  }
  return rows;
}

async function fetchCurrentMemberGainState(env, clan) {
  const rows = await supabaseSelect(env, CURRENT_TABLE, {
    select: "fetched_at,battle_key,user_id,total_points,last_gain_at,downtime_tracking_started_at",
    clan_name: `eq.${clan}`,
    limit: "1000"
  });

  return new Map(rows.map(row => [String(row.user_id), row]));
}

function nextMemberGainState(row, previous, fetchedAt) {
  const sameBattle = Boolean(
    previous &&
    normalizeText(previous.battle_key) === normalizeText(row.battle_key)
  );

  if (!sameBattle) {
    return {
      last_gain_at: null,
      downtime_tracking_started_at: fetchedAt
    };
  }

  const currentPoints = toNumber(row.total_points) || 0;
  const previousPoints = toNumber(previous.total_points) || 0;
  const trackingStartedAt =
    previous.downtime_tracking_started_at ||
    previous.fetched_at ||
    fetchedAt;

  return {
    last_gain_at:
      currentPoints > previousPoints
        ? fetchedAt
        : previous.last_gain_at || null,
    downtime_tracking_started_at: trackingStartedAt
  };
}

function hasIncrementalDowntimeState(row) {
  return Boolean(row?.last_gain_at || row?.downtime_tracking_started_at);
}

function addIncrementalDowntime(row, latest) {
  const latestMs = new Date(latest?.fetched_at || row?.fetched_at || "").getTime();
  const anchor = row.last_gain_at || row.downtime_tracking_started_at;
  const anchorMs = new Date(anchor || "").getTime();

  return {
    ...row,
    last_gain_at: row.last_gain_at || null,
    downtime_minutes:
      Number.isFinite(latestMs) && Number.isFinite(anchorMs)
        ? Math.max(0, Math.floor((latestMs - anchorMs) / 60000))
        : null
  };
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
  const params = {
    select: "rank,clan_name,points,fetched_at,icon_id,icon_url",
    clan_name: `eq.${clan}`,
    limit: "1"
  };
  let rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, params);
  if (!rows.length) {
    rows = await supabaseSelect(env, CLANS_CURRENT_TABLE, {
      ...params,
      clan_name: `ilike.${clan}`
    });
  }

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
  const battleRun = await fetchBattleRun(env, CLANS_BATTLE_RUN_CLAN_NAME, battle).catch(() => null);
  const params = {
    select: "snapshot_id,fetched_at,battle_key,battle_display_name,battle_started_at,battle_ended_at",
    battle_key: `eq.${battle}`,
    order: "fetched_at.desc",
    limit: "1"
  };
  if (battleRun?.battle_ended_at) params.fetched_at = `lte.${battleRun.battle_ended_at}`;
  let rows = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, params);

  if (
    rows[0]?.battle_ended_at &&
    !isSnapshotAtOrBeforeEventEnd(rows[0].fetched_at, rows[0].battle_ended_at)
  ) {
    rows = await supabaseSelect(env, CLANS_SNAPSHOT_TABLE, {
      ...params,
      fetched_at: `lte.${rows[0].battle_ended_at}`
    });
  }

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
  validateCwBotImportGuild(ref.guildId, env);
  const channelIds = csvSet(env.CW_BOT_IMPORT_CHANNEL_IDS);

  if (channelIds.size && !channelIds.has(String(ref.channelId))) {
    throw httpError(403, "That Discord channel is not allowed for CW_Bot imports.");
  }
}

function validateCwBotImportGuild(guildId, env) {
  const guildIds = csvSet(env.CW_BOT_IMPORT_GUILD_IDS);
  if (guildIds.size && !guildIds.has(String(guildId))) {
    throw httpError(403, "That Discord server is not allowed for CW_Bot imports.");
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

function compareDiscordSnowflakes(left, right) {
  const leftText = String(left || "0");
  const rightText = String(right || "0");

  try {
    const leftValue = BigInt(leftText);
    const rightValue = BigInt(rightText);
    return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
  } catch {
    return leftText.localeCompare(rightText);
  }
}

function parseCwBotHistoryCommand(value) {
  const text = String(value || "").trim();
  const match = text.match(/^!history(?:\s+([A-Za-z0-9_]{1,40}|\d+))?\s*$/i);
  if (!match) return null;

  return {
    query: String(match[1] || "").trim() || null
  };
}

function isDirectCwBotHistoryMessage(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (/\bplayer\s+history\b|\bhistory\s+for\s+[A-Za-z0-9_]+|\b\d+\s+battles?\b/i.test(value)) {
    return true;
  }
  return parseCwBotHistoryText(value).rows.length > 0;
}

function cwBotPendingMessage(message, context = {}) {
  return {
    guild_id: String(context.guildId || ""),
    channel_id: String(context.channelId || ""),
    message_id: String(message?.id || ""),
    timestamp: safeIso(message?.timestamp) || null,
    image_url: String(context.imageUrl || firstDiscordMessageImageUrl(message) || "") || null
  };
}

function cwBotHistoryScanCandidate(message, context = {}) {
  const pending = cwBotPendingMessage(message, context);
  return {
    ...pending,
    command_query: null,
    command_message_id: null,
    command_timestamp: null,
    reason: String(context.reason || "history_marker"),
    message_url: canonicalDiscordMessageUrl({
      guildId: pending.guild_id,
      channelId: pending.channel_id,
      messageId: pending.message_id
    })
  };
}

function cwBotIgnoredScanMessage(message, context = {}) {
  const guildId = String(context.guildId || "");
  const channelId = String(context.channelId || "");
  const messageId = String(message?.id || "");

  return {
    guild_id: guildId,
    channel_id: channelId,
    message_id: messageId,
    timestamp: safeIso(message?.timestamp) || null,
    reason: String(context.reason || "not_history"),
    message_url: canonicalDiscordMessageUrl({
      guildId,
      channelId,
      messageId
    })
  };
}

function normalizeCwBotPendingMessages(values, context = {}) {
  if (!Array.isArray(values)) return [];

  return values.slice(-25).map(value => ({
    guild_id: String(value?.guild_id || context.guildId || ""),
    channel_id: String(value?.channel_id || context.channelId || ""),
    message_id: String(value?.message_id || ""),
    timestamp: safeIso(value?.timestamp) || null,
    image_url: String(value?.image_url || "") || null
  })).filter(value =>
    /^\d+$/.test(value.message_id)
    && value.guild_id === String(context.guildId || "")
    && value.channel_id === String(context.channelId || "")
    && value.timestamp
  );
}

function nearestPendingCwBotMessageIndex(waiting, commandTimestamp, windowSeconds) {
  const commandMs = Date.parse(commandTimestamp || "");
  if (!Number.isFinite(commandMs)) return -1;

  let bestIndex = -1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 0; index < waiting.length; index += 1) {
    const responseMs = Date.parse(waiting[index]?.timestamp || "");
    const difference = (responseMs - commandMs) / 1000;
    if (!Number.isFinite(difference) || difference < 0 || difference > windowSeconds) continue;

    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return bestIndex;
}

async function fetchDiscordBotJson(env, path, label) {
  if (!env.DISCORD_BOT_TOKEN) {
    throw httpError(500, "Missing required Worker secret: DISCORD_BOT_TOKEN");
  }

  let lastStatus = 0;
  let lastText = "";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const res = await fetch(`${DISCORD_API_BASE}${path}`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        Accept: "application/json"
      }
    });
    const text = await res.text();
    lastStatus = res.status;
    lastText = text;

    if (res.ok) return text ? JSON.parse(text) : {};

    if (res.status !== 429 || attempt === 4) break;

    let retryAfterMs = 1000;
    try {
      const payload = JSON.parse(text);
      retryAfterMs = Math.ceil(Number(payload?.retry_after || 1) * 1000);
    } catch {}
    await sleep(clamp(retryAfterMs, 250, 15000));
  }

  const status = [401, 403, 404, 429].includes(lastStatus) ? lastStatus : 502;
  throw httpError(status, `${label} failed (${lastStatus}): ${lastText.slice(0, 500)}`);
}

async function fetchDiscordChannel(env, channelId) {
  return fetchDiscordBotJson(
    env,
    `/channels/${encodeURIComponent(channelId)}`,
    "Discord channel fetch"
  );
}

async function fetchDiscordGuildChannels(env, guildId) {
  const payload = await fetchDiscordBotJson(
    env,
    `/guilds/${encodeURIComponent(guildId)}/channels`,
    "Discord guild channel fetch"
  );
  return Array.isArray(payload) ? payload : [];
}

async function fetchDiscordActiveGuildThreads(env, guildId) {
  return fetchDiscordBotJson(
    env,
    `/guilds/${encodeURIComponent(guildId)}/threads/active`,
    "Discord active thread fetch"
  );
}

async function fetchDiscordPublicArchivedThreads(env, channelId, options = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(clamp(Math.trunc(toNumber(options.limit) || 100), 1, 100)));
  if (options.before) params.set("before", String(options.before));

  return fetchDiscordBotJson(
    env,
    `/channels/${encodeURIComponent(channelId)}/threads/archived/public?${params.toString()}`,
    "Discord archived thread fetch"
  );
}

async function fetchDiscordChannelMessages(env, channelId, options = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(clamp(Math.trunc(toNumber(options.limit) || 100), 1, 100)));
  if (options.beforeMessageId) params.set("before", String(options.beforeMessageId));

  const payload = await fetchDiscordBotJson(
    env,
    `/channels/${encodeURIComponent(channelId)}/messages?${params.toString()}`,
    "Discord channel history fetch"
  );
  return Array.isArray(payload) ? payload : [];
}

async function fetchDiscordMessage(env, channelId, messageId) {
  return fetchDiscordBotJson(
    env,
    `/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`,
    "Discord message fetch"
  );
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
    "{\"player_name\":string|null,\"player_id\":string|null,\"rows\":[{\"battle_name\":string,\"clan_name\":string|null,\"clan_rank\":number|null,\"total_clan_members\":number|null,\"global_rank\":number|null,\"total_global_players\":number|null,\"final_rank\":number|null,\"total_ranked\":number|null,\"final_points\":number|null}]}",
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
      global_rank: rankInfo.rank,
      total_global_players: rankInfo.total,
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
    final_rank: toNumber(row.final_rank ?? row.global_rank ?? row.g_rank ?? row.rank),
    total_ranked: toNumber(row.total_ranked ?? row.total_global_players ?? row.total ?? row.total_players),
    clan_rank: toNumber(row.clan_rank ?? row.member_rank ?? row.final_clan_rank),
    total_clan_members: toNumber(row.total_clan_members ?? row.total_members),
    global_rank: toNumber(row.global_rank ?? row.g_rank ?? row.final_global_rank ?? row.final_rank ?? row.rank),
    total_global_players: toNumber(row.total_global_players ?? row.global_total ?? row.total_ranked ?? row.total ?? row.total_players),
    final_points: parseCwBotNumber(row.final_points ?? row.points),
    final_snapshot_at: row.final_snapshot_at || row.date || null
  })).filter(row => cleanExternalBattleName(row.battle_name) && (
    row.final_rank !== null ||
    row.clan_rank !== null ||
    row.global_rank !== null ||
    row.final_points !== null
  ));

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

async function selectExternalHistoryRows(env, source, params = {}) {
  const normalizedSource = String(source || "").trim().toLowerCase();
  const query = {
    ...params,
    source: normalizedSource ? `eq.${normalizedSource}` : params.source
  };

  if (normalizedSource !== "cw_bot") {
    return selectExternalHistoryTableRows(env, EXTERNAL_PLAYER_HISTORY_TABLE, query).catch(err => {
      if (String(err?.message || "").includes(EXTERNAL_PLAYER_HISTORY_TABLE)) return [];
      throw err;
    });
  }

  const [dedicatedRows, legacyRows] = await Promise.all([
    selectExternalHistoryTableRows(env, CW_BOT_HISTORY_TABLE, query).catch(err => {
      if (String(err?.message || "").includes(CW_BOT_HISTORY_TABLE)) return [];
      throw err;
    }),
    // Keep a read-only legacy fallback during deployment so a row written by
    // the previous Worker between the SQL migration and Worker deployment is
    // not stranded. New CW-Bot writes always use CW_BOT_HISTORY_TABLE.
    selectExternalHistoryTableRows(env, EXTERNAL_PLAYER_HISTORY_TABLE, query).catch(err => {
      if (String(err?.message || "").includes(EXTERNAL_PLAYER_HISTORY_TABLE)) return [];
      throw err;
    })
  ]);

  return mergeExternalHistoryStorageRows(dedicatedRows, legacyRows);
}

function selectExternalHistoryTableRows(env, table, params) {
  const limit = clamp(Number(params?.limit || 1000), 1, 5000);
  return limit > 1000
    ? supabaseSelectPaged(env, table, params, limit, 1000)
    : supabaseSelect(env, table, params);
}

function mergeExternalHistoryStorageRows(preferredRows, fallbackRows) {
  const rowsByKey = new Map();

  for (const row of fallbackRows || []) {
    rowsByKey.set(externalHistoryStorageKey(row), row);
  }

  for (const row of preferredRows || []) {
    const key = externalHistoryStorageKey(row);
    const fallback = rowsByKey.get(key);
    rowsByKey.set(key, fallback ? mergeExternalHistoryStoredRow(row, fallback) : row);
  }

  return [...rowsByKey.values()];
}

function externalHistoryStorageKey(row) {
  return [
    String(row?.source || "cw_bot").toLowerCase(),
    String(toNumber(row?.user_id) || ""),
    externalBattleKey(row?.battle_key || row?.battle_name)
  ].join(":");
}

function mergeExternalHistoryStoredRow(primary, fallback) {
  const merged = { ...fallback, ...primary };

  for (const field of [...EXTERNAL_HISTORY_DATA_FIELDS, ...EXTERNAL_HISTORY_METADATA_FIELDS]) {
    if (isBlankExternalHistoryValue(primary?.[field]) && !isBlankExternalHistoryValue(fallback?.[field])) {
      merged[field] = fallback[field];
    }
  }

  return merged;
}

async function externalHistoryBattleRowMap(env, userId, source = "") {
  const params = {
    select: [
      "source",
      "user_id",
      "username",
      "battle_key",
      "battle_name",
      "clan_name",
      "final_rank",
      "total_ranked",
      "clan_rank",
      "total_clan_members",
      "global_rank",
      "total_global_players",
      "final_points",
      "final_snapshot_at",
      "status",
      "is_manual_import",
      "import_batch_id",
      "imported_from",
      "discord_guild_id",
      "discord_channel_id",
      "discord_message_id",
      "discord_message_url",
      "image_url",
      "raw_text",
      "raw_payload",
      "raw_fingerprint",
      "created_at",
      "updated_at",
      "reviewed_at",
      "reviewed_by"
    ].join(","),
    user_id: `eq.${userId}`,
    status: "neq.rejected",
    limit: "2000"
  };

  const rows = source === "cw_bot"
    ? await selectExternalHistoryTableRows(env, CW_BOT_HISTORY_TABLE, {
        ...params,
        source: "eq.cw_bot"
      }).catch(err => {
        if (String(err?.message || "").includes(CW_BOT_HISTORY_TABLE)) return [];
        throw err;
      })
    : await selectExternalHistoryRows(env, source, params);
  const map = new Map();

  for (const row of rows) {
    const key = externalBattleKey(row.battle_key || row.battle_name);
    if (key && !map.has(key)) map.set(key, row);
  }

  return map;
}

const EXTERNAL_HISTORY_DATA_FIELDS = [
  "username",
  "battle_name",
  "clan_name",
  "final_rank",
  "total_ranked",
  "clan_rank",
  "total_clan_members",
  "global_rank",
  "total_global_players",
  "final_points",
  "final_snapshot_at"
];

const EXTERNAL_HISTORY_METADATA_FIELDS = [
  "import_batch_id",
  "imported_from",
  "discord_guild_id",
  "discord_channel_id",
  "discord_message_id",
  "discord_message_url",
  "image_url",
  "raw_text",
  "raw_payload",
  "raw_fingerprint"
];

function isBlankExternalHistoryValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function externalHistoryBackfillPatch(existing, incoming, options = {}) {
  const patch = {};
  let hasDataBackfill = false;
  const preferEarliestMessage = options.preferEarliestMessage === true;
  const incomingMessageId = String(incoming?.discord_message_id || "");
  const existingMessageId = String(existing?.discord_message_id || "");
  const incomingIsEarlier = preferEarliestMessage
    && /^\d+$/.test(incomingMessageId)
    && /^\d+$/.test(existingMessageId)
    && compareDiscordSnowflakes(incomingMessageId, existingMessageId) < 0;

  for (const field of EXTERNAL_HISTORY_DATA_FIELDS) {
    if (incomingIsEarlier && !isBlankExternalHistoryValue(incoming?.[field])) {
      patch[field] = incoming[field];
      hasDataBackfill = true;
    } else if (
      isBlankExternalHistoryValue(existing?.[field]) &&
      !isBlankExternalHistoryValue(incoming?.[field])
    ) {
      patch[field] = incoming[field];
      hasDataBackfill = true;
    }
  }

  for (const field of EXTERNAL_HISTORY_METADATA_FIELDS) {
    if (incomingIsEarlier && !isBlankExternalHistoryValue(incoming?.[field])) {
      patch[field] = incoming[field];
    } else if (
      isBlankExternalHistoryValue(existing?.[field]) &&
      !isBlankExternalHistoryValue(incoming?.[field])
    ) {
      patch[field] = incoming[field];
    }
  }

  if (!hasDataBackfill && !incomingIsEarlier) return null;

  patch.updated_at = incoming.updated_at || new Date().toISOString();
  return patch;
}

function postgrestNumberInFilter(values) {
  const ids = [...new Set((values || [])
    .map(value => toNumber(value))
    .filter(value => value !== null)
    .map(value => String(Math.trunc(value))))];

  return `in.(${ids.join(",")})`;
}

async function fetchBattleRun(env, clan, battle) {
  const rows = await supabaseSelect(env, BATTLE_RUNS_TABLE, {
    select: "clan_name,battle_key,battle_display_name,battle_started_at,battle_ended_at,first_seen_at,last_seen_at,latest_snapshot_id,latest_snapshot_at,is_active,updated_at",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    limit: "1"
  });

  return rows[0] || null;
}

async function fetchLatestRosterMarkerFromTable(env, table, clan, battle) {
  const rows = await supabaseSelect(env, table, {
    select: "snapshot_id,fetched_at,clan_name,battle_key",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    order: "fetched_at.desc,snapshot_id.desc",
    limit: "1"
  }).catch(err => {
    if (table === SNAPSHOT_ARCHIVE_TABLE && String(err?.message || "").includes(table)) return [];
    throw err;
  });

  return rows[0] ? { ...rows[0], table } : null;
}

async function fetchFinalClanRosterForBattle(env, clan, battle) {
  const markers = (await Promise.all([
    fetchLatestRosterMarkerFromTable(env, SNAPSHOT_TABLE, clan, battle),
    fetchLatestRosterMarkerFromTable(env, SNAPSHOT_ARCHIVE_TABLE, clan, battle)
  ])).filter(Boolean);
  const marker = markers.sort((a, b) => isoToMs(b.fetched_at) - isoToMs(a.fetched_at))[0] || null;

  if (!marker) {
    throw httpError(404, `No final roster snapshot found for ${clan} / ${battle}.`);
  }

  const params = {
    select: "snapshot_id,fetched_at,clan_name,battle_key,rank,user_id,username,total_points",
    clan_name: `eq.${clan}`,
    battle_key: `eq.${battle}`,
    order: "rank.asc,user_id.asc",
    limit: "1000"
  };

  if (marker.snapshot_id) {
    params.snapshot_id = `eq.${marker.snapshot_id}`;
  } else {
    params.fetched_at = `eq.${marker.fetched_at}`;
  }

  const rows = await supabaseSelectPaged(env, marker.table, params, 1000, 1000);

  return {
    table: marker.table,
    snapshot_id: marker.snapshot_id || null,
    fetched_at: marker.fetched_at || null,
    rows
  };
}

async function fetchCwBotRowsForUsers(env, userIds) {
  const ids = [...new Set((userIds || []).map(toNumber).filter(Boolean))];
  const rows = [];

  for (const chunk of chunkValues(ids, 200)) {
    const query = {
      select: "source,user_id,username,battle_key,battle_name,clan_name,final_rank,total_ranked,clan_rank,total_clan_members,global_rank,total_global_players,final_points,final_snapshot_at,status,is_manual_import,import_batch_id,imported_from,discord_message_url,image_url,created_at,updated_at,reviewed_at,reviewed_by",
      user_id: postgrestNumberInFilter(chunk),
      status: "neq.rejected",
      order: "final_snapshot_at.desc.nullslast,updated_at.desc.nullslast,created_at.desc",
      limit: String(Math.min(5000, Math.max(1000, chunk.length * 50)))
    };
    const chunkRows = await selectExternalHistoryRows(env, "cw_bot", query);
    rows.push(...chunkRows);
  }

  return sortExternalHistoryRows(mergeExternalHistoryStorageRows(rows, []));
}

function externalHistoryStatusPriority(status) {
  const key = String(status || "").toLowerCase();
  if (key === "approved") return 4;
  if (key === "pending") return 3;
  if (key === "duplicate") return 2;
  if (key === "ignored") return 1;
  return 0;
}

function sortExternalHistoryRows(rows) {
  return [...(rows || [])].sort((a, b) => {
    const priority = externalHistoryStatusPriority(b.status) - externalHistoryStatusPriority(a.status);
    if (priority) return priority;

    return isoToMs(b.final_snapshot_at || b.updated_at || b.created_at) - isoToMs(a.final_snapshot_at || a.updated_at || a.created_at);
  });
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
    clan_rank: toNumber(row.clan_rank),
    total_clan_members: toNumber(row.total_clan_members),
    global_rank: toNumber(row.global_rank),
    total_global_players: toNumber(row.total_global_players),
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

async function supabaseInsertIgnoreReturning(env, tableName, rows, onConflict) {
  const url = supabaseUrl(env, tableName);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: supabaseHeaders(env, {
      Prefer: "resolution=ignore-duplicates,return=representation"
    }),
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase insert failed for ${tableName} (${res.status}): ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : [];
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

async function supabasePatch(env, tableName, filters, patch) {
  const url = supabaseUrl(env, tableName);

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: supabaseHeaders(env, {
      Prefer: "return=minimal"
    }),
    body: JSON.stringify(patch)
  });

  if (!res.ok) {
    const text = await res.text();
    throw httpError(502, `Supabase patch failed for ${tableName} (${res.status}): ${text}`);
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

function requirePs99RestartProbe(request, env) {
  if (!env.PS99_RESTART_PROBE_TOKEN) {
    throw httpError(500, "Missing required Worker secret: PS99_RESTART_PROBE_TOKEN");
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]
    || request.headers.get("X-PS99-Restart-Probe-Token")
    || "";
  const accepted = token === env.PS99_RESTART_PROBE_TOKEN
    || (env.INGEST_ADMIN_TOKEN && token === env.INGEST_ADMIN_TOKEN);

  if (!accepted) {
    throw httpError(401, "Invalid or missing restart-probe token.");
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

function battleIngestGate({
  activeBattleMeta,
  battleMeta,
  battleKey,
  env,
  force = false,
  scheduledAt = null,
  now = null
}) {
  if (force) {
    return { allowed: true, reason: "forced", collection_phase: "forced", in_grace_period: false };
  }

  if (String(env.SKIP_ENDED_BATTLE_INGEST || "true").toLowerCase() === "false") {
    return { allowed: true, reason: "disabled", collection_phase: "unrestricted", in_grace_period: false };
  }

  const meta = battleMeta || activeBattleMeta || {};
  const startedAt = meta.startedAt || activeBattleMeta?.startedAt || null;
  const endedAt = meta.endedAt || activeBattleMeta?.endedAt || null;
  const startMs = isoToMs(startedAt);
  const cutoff = effectiveBattleIngestCutoff(env, endedAt);
  const endMs = cutoff.ms;
  const nowMs = now instanceof Date && !Number.isNaN(now.getTime())
    ? now.getTime()
    : Date.now();
  const scheduledMs = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt.getTime()
    : null;
  const graceMinutes = battleFinalPullGraceMinutes(env);
  const hardStopMs = Number.isFinite(endMs)
    ? endMs + graceMinutes * 60 * 1000
    : NaN;

  const scheduledStopMs = Number.isFinite(hardStopMs) ? hardStopMs : endMs;

  if (Number.isFinite(scheduledStopMs) && scheduledMs !== null && scheduledMs > scheduledStopMs) {
    return {
      allowed: false,
      reason: "battle_final_pull_passed",
      collection_phase: "closed",
      in_grace_period: false,
      message: "Scheduled battle data pull is after the configured final pull time; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt,
      battle_cutoff_at: cutoff.iso,
      hard_stop_at: Number.isFinite(hardStopMs) ? new Date(hardStopMs).toISOString() : null
    };
  }

  if (Number.isFinite(hardStopMs) && nowMs >= hardStopMs) {
    return {
      allowed: false,
      reason: "battle_final_pull_hard_stop",
      collection_phase: "closed",
      in_grace_period: false,
      message: "Battle data pull hard stop has passed; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt,
      battle_cutoff_at: cutoff.iso,
      hard_stop_at: new Date(hardStopMs).toISOString()
    };
  }

  if (Number.isFinite(endMs) && scheduledMs === null && nowMs > endMs) {
    return {
      allowed: false,
      reason: "battle_ended",
      collection_phase: "closed",
      in_grace_period: false,
      message: "Battle has ended; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt,
      battle_cutoff_at: cutoff.iso,
      hard_stop_at: Number.isFinite(hardStopMs) ? new Date(hardStopMs).toISOString() : null
    };
  }

  if (Number.isFinite(startMs) && startMs > nowMs) {
    return {
      allowed: false,
      reason: "battle_not_started",
      collection_phase: "not_started",
      in_grace_period: false,
      message: "Battle has not started yet; ingest skipped without writing snapshot rows.",
      battle_key: battleKey || activeBattleMeta?.battleKey || null,
      battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
      battle_started_at: startedAt,
      battle_ended_at: endedAt
    };
  }

  const collectionTimeMs = Math.max(nowMs, scheduledMs ?? nowMs);
  const inGracePeriod = Number.isFinite(endMs) && collectionTimeMs > endMs;

  return {
    allowed: true,
    reason: inGracePeriod ? "battle_grace_period" : "battle_open",
    collection_phase: inGracePeriod ? "grace_period" : "active_event",
    in_grace_period: inGracePeriod,
    battle_key: battleKey || activeBattleMeta?.battleKey || null,
    battle_display_name: meta.displayName || activeBattleMeta?.displayName || null,
    battle_started_at: startedAt,
    battle_ended_at: endedAt,
    battle_cutoff_at: cutoff.iso,
    hard_stop_at: Number.isFinite(hardStopMs) ? new Date(hardStopMs).toISOString() : null
  };
}

function assertBattleIngestStillOpen({
  activeBattleMeta,
  battleMeta,
  battleKey,
  env,
  force = false,
  scheduledAt = null
}) {
  const gate = battleIngestGate({
    activeBattleMeta,
    battleMeta,
    battleKey,
    env,
    force,
    scheduledAt,
    now: new Date()
  });

  if (!gate.allowed) {
    const err = httpError(409, gate.message || "Battle data pull cutoff has passed.");
    err.battleIngestClosed = true;
    err.reason = gate.reason;
    err.battle_cutoff_at = gate.battle_cutoff_at || null;
    err.hard_stop_at = gate.hard_stop_at || null;
    throw err;
  }

  return gate;
}

function effectiveBattleIngestCutoff(env, endedAt) {
  const baseMs = isoToMs(endedAt);

  return {
    ms: baseMs,
    iso: Number.isFinite(baseMs) ? new Date(baseMs).toISOString() : null
  };
}

function battleFinalPullGraceMinutes(env) {
  return clamp(
    Number(env.BATTLE_INGEST_FINAL_PULL_GRACE_MINUTES || DEFAULT_BATTLE_FINAL_PULL_GRACE_MINUTES),
    0,
    60
  );
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
    collection_phase: gate.collection_phase || "closed",
    in_grace_period: gate.in_grace_period === true,
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
    battle_cutoff_at: gate.battle_cutoff_at || null,
    hard_stop_at: gate.hard_stop_at || null,
    fetched_at: fetchedAt,
    rows_inserted: 0
  });
}

function resolveAuthoritativeBattleKey(battles, configuredBattleKey, env = {}, activeBattleKey = "") {
  const configured = String(configuredBattleKey || "").trim();
  const configuredNormalized = normalizeText(configured);
  const autoDetect =
    String(env.AUTO_DETECT_BATTLE || "").toLowerCase() === "true" ||
    configuredNormalized === "auto" ||
    configuredNormalized === "current";
  const explicitlyForced = Boolean(configured && !autoDetect);

  if (explicitlyForced) {
    return resolveBattleKey(battles, configured, env, "");
  }

  if (activeBattleKey) {
    return findBattleKey(battles, activeBattleKey) || "";
  }

  return resolveBattleKey(battles, configuredBattleKey, env, "");
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
    join_time: globalCandidateJoinIso(rawGlobal.candidate),
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
  avatarUrl,
  gainMaps = {}
}) {
  const userId = toNumber(row.user_id);
  const sourceClan = String(row.source_clan || "").trim();
  const points = toNumber(row.points) || 0;
  const previous = key => {
    const map = gainMaps?.[key];
    if (!map || !userId || !map.has(userId)) return null;
    return points - (toNumber(map.get(userId)) || 0);
  };

  return {
    clan_name: sourceClan,
    user_id: userId,
    username: username || `user_${userId}`,
    display_name: displayName || username || `user_${userId}`,
    avatar_url: avatarUrl || null,
    clan_rank: toNumber(memberRank),
    clan_points: points,
    member_rank: toNumber(memberRank),
    member_points: points,
    join_time: globalCandidateJoinIso(row.raw_candidate),
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
    global_points: points,
    total_global_players: toNumber(totalGlobalPlayers),
    found: true,
    fetched_at: row.fetched_at || run?.finished_at || run?.updated_at || null,
    run_key: run?.run_key || null,
    updated_at: row.updated_at || run?.updated_at || null,
    source_clan: sourceClan,
    gain_5m: previous("gain_5m"),
    gain_1h: previous("gain_1h"),
    gain_12h: previous("gain_12h"),
    gain_24h: previous("gain_24h")
  };
}

async function findLatestGlobalRankSearchRun(env, clan, battleKeyValue = null) {
  const requestedBattle = String(battleKeyValue || "").trim();
  const battleRun = requestedBattle
    ? await fetchBattleRun(env, clan, requestedBattle).catch(() => null)
    : await fetchLatestBattleRun(env, clan).catch(() => null);
  const resolvedBattle = requestedBattle || String(battleRun?.battle_key || "").trim();
  const params = {
    select: "*",
    clan_name: `eq.${clan}`,
    status: "in.(ok,completed)",
    order: "started_at.desc",
    limit: "20"
  };
  if (resolvedBattle) params.battle_key = `eq.${resolvedBattle}`;
  if (battleRun?.battle_ended_at) params.started_at = `lte.${battleRun.battle_ended_at}`;

  const completed = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, params);

  const usableCompleted = completed.find(isUsableCompletedGlobalRankRun);
  if (usableCompleted) return usableCompleted;
  if (!requestedBattle) {
    const fallbackCompleted = await supabaseSelect(env, GLOBAL_RANK_RUNS_TABLE, {
      select: "*",
      clan_name: `eq.${clan}`,
      status: "in.(ok,completed)",
      order: "started_at.desc",
      limit: "50"
    });
    const usableFallback = fallbackCompleted.find(isUsableCompletedGlobalRankRun);
    if (usableFallback) return usableFallback;
  }
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

async function resolveGlobalSearchIdentity(query, env, options = {}) {
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

    if (res.ok) {
      const payload = await res.json();
      const user = firstArray(payload?.data)[0] || null;
      const id = toNumber(user?.id);

      if (id) {
        const identity = {
          user_id: id,
          username: user?.name || text,
          display_name: user?.displayName || null
        };
        await cacheGlobalSearchIdentity(env, identity).catch(() => {});
        return identity;
      }
    }
  } catch {
    // Fall through to local stored-data lookup below.
  }

  const stored = await resolveGlobalSearchIdentityFromStoredData(text, env, options).catch(() => null);
  return stored || { user_id: null, username: null, display_name: null };
}

async function resolveGlobalSearchIdentityFromStoredData(query, env, options = {}) {
  const text = String(query || "").trim();
  const key = normalizeGlobalSearchKey(text);
  if (!key) return null;

  const cacheIdentity = await findStoredGlobalSearchIdentity(env, USER_LOOKUP_CACHE_TABLE, text, key, {
    select: "user_id,username,display_name,avatar_url,updated_at",
    order: "updated_at.desc"
  });
  if (cacheIdentity) return cacheIdentity;

  const currentFilters = {};
  const clan = String(options.clan || "").trim();
  if (clan) currentFilters.clan_name = `eq.${clan}`;

  const currentIdentity = await findStoredGlobalSearchIdentity(env, GLOBAL_RANK_CURRENT_TABLE, text, key, {
    select: "user_id,username,display_name,avatar_url,clan_name,updated_at",
    order: "updated_at.desc",
    filters: currentFilters
  });
  if (currentIdentity) return currentIdentity;

  const historyIdentity = await findStoredGlobalSearchIdentity(env, GLOBAL_RANK_HISTORY_TABLE, text, key, {
    select: "user_id,username,display_name,avatar_url,clan_name,fetched_at",
    order: "fetched_at.desc",
    filters: currentFilters
  });
  if (historyIdentity) return historyIdentity;

  const candidateIdentity = await findGlobalCandidateIdentityByRawName(env, options.runKey, key);
  if (candidateIdentity) return candidateIdentity;

  return null;
}

async function findStoredGlobalSearchIdentity(env, tableName, query, queryKey, options = {}) {
  const filters = options.filters || {};
  const baseParams = {
    select: options.select || "user_id,username,display_name,avatar_url",
    ...filters,
    order: options.order || "updated_at.desc",
    limit: "10"
  };

  const checks = [
    { username: `ilike.${query}` },
    { display_name: `ilike.${query}` }
  ];

  for (const check of checks) {
    const rows = await supabaseSelect(env, tableName, {
      ...baseParams,
      ...check
    }).catch(() => []);
    const identity = pickGlobalSearchIdentityFromRows(rows, queryKey);
    if (identity) {
      await cacheGlobalSearchIdentity(env, identity).catch(() => {});
      return identity;
    }
  }

  return null;
}

function pickGlobalSearchIdentityFromRows(rows, queryKey) {
  for (const row of rows || []) {
    const userId = toNumber(row.user_id);
    if (!userId) continue;

    const username = stringOrNull(row.username);
    const displayName = stringOrNull(row.display_name);
    const usernameMatches = username && normalizeGlobalSearchKey(username) === queryKey;
    const displayMatches = displayName && normalizeGlobalSearchKey(displayName) === queryKey;

    if (usernameMatches || displayMatches) {
      return {
        user_id: userId,
        username: username || displayName || `user_${userId}`,
        display_name: displayName || null,
        avatar_url: stringOrNull(row.avatar_url)
      };
    }
  }

  return null;
}

async function findGlobalCandidateIdentityByRawName(env, runKey, queryKey) {
  const run = String(runKey || "").trim();
  if (!run || !queryKey) return null;

  const maxRows = clamp(Number(env.GLOBAL_RANK_NAME_SCAN_LIMIT || 50000), 1000, 200000);
  const pageSize = 1000;
  let offset = 0;

  while (offset < maxRows) {
    const pageLimit = Math.min(pageSize, maxRows - offset);
    const rows = await supabaseSelect(env, GLOBAL_RANK_CANDIDATES_TABLE, {
      select: "user_id,points,source_clan,raw_candidate,fetched_at,updated_at",
      run_key: `eq.${run}`,
      order: "points.desc,user_id.asc",
      limit: String(pageLimit),
      offset: String(offset)
    });

    for (const row of rows || []) {
      const userId = toNumber(row.user_id);
      if (!userId) continue;

      const rawUsername = globalCandidateRawUsername(row);
      const displayName = globalCandidateDisplayName(row);
      const usernameMatches = rawUsername && normalizeGlobalSearchKey(rawUsername) === queryKey;
      const displayMatches = displayName && normalizeGlobalSearchKey(displayName) === queryKey;

      if (usernameMatches || displayMatches) {
        const identity = {
          user_id: userId,
          username: rawUsername || displayName || `user_${userId}`,
          display_name: displayName || null,
          avatar_url: null
        };
        await cacheGlobalSearchIdentity(env, identity).catch(() => {});
        return identity;
      }
    }

    if (!Array.isArray(rows) || rows.length < pageLimit) break;
    offset += rows.length;
  }

  return null;
}

async function cacheGlobalSearchIdentity(env, identity) {
  const userId = toNumber(identity?.user_id);
  const username = stringOrNull(identity?.username);
  if (!userId || !username || isFallbackUsername(username, userId)) return;

  await upsertUserLookupCache(env, [{
    user_id: userId,
    username,
    display_name: stringOrNull(identity?.display_name),
    avatar_url: stringOrNull(identity?.avatar_url),
    updated_at: new Date().toISOString()
  }]);
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

function globalSearchHistoryHours(env, requestedHours = null) {
  return clamp(Number(requestedHours || env.GLOBAL_SEARCH_HISTORY_HOURS || 24), 1, 24 * 14);
}

function globalSearchHistoryLimit(env, requestedLimit = null) {
  return clamp(Number(requestedLimit || env.GLOBAL_SEARCH_HISTORY_LIMIT || 300), 24, 1000);
}

function globalSearchHistorySinceIso(anchorValue, hours) {
  const anchorMs = isoToMs(anchorValue) || Date.now();
  const safeHours = clamp(Number(hours || 24), 1, 24 * 14);
  return new Date(anchorMs - safeHours * 60 * 60 * 1000).toISOString();
}

function globalRankCandidateHistoryLimit(env, requestedLimit = null) {
  return clamp(Number(requestedLimit || env.GLOBAL_RANK_CANDIDATE_HISTORY_LIMIT || env.GLOBAL_SEARCH_HISTORY_LIMIT || 300), 1, 1000);
}

function globalRankRetentionHours(env) {
  return clamp(Number(env.GLOBAL_RANK_RETENTION_HOURS || 24), 0, 24 * 365 * 10);
}

function globalRankRetentionRunLimit(env) {
  return clamp(Number(env.GLOBAL_RANK_RETENTION_RUN_LIMIT || 2000), 100, 10000);
}

function globalRankRetentionDeleteRunsPerPass(env) {
  return clamp(
    Number(
      env.GLOBAL_RANK_RETENTION_DELETE_RUNS_PER_PASS ||
      DEFAULT_GLOBAL_RANK_RETENTION_DELETE_RUNS_PER_PASS
    ),
    1,
    25
  );
}

function battleSnapshotRuntimeConfig(env) {
  return {
    member_snapshot_min_interval_minutes: memberSnapshotMinIntervalMinutes(env),
    clans_snapshot_min_interval_minutes: clansSnapshotMinIntervalMinutes(env),
    force_bypasses_recent_guard: true
  };
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
    retention_enabled: String(env.GLOBAL_RANK_RETENTION_ENABLED || "false").toLowerCase() === "true",
    retention_hours: globalRankRetentionHours(env),
    retention_delete_runs_per_pass: globalRankRetentionDeleteRunsPerPass(env)
  };
}

function battleCollectionSource(source, gate) {
  const clean = String(source || "unknown").trim() || "unknown";
  if (gate?.in_grace_period !== true) return clean;
  return clean.endsWith(":grace_period") ? clean : `${clean}:grace_period`;
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

  // Match the configured minute precisely. A five-minute window can create
  // duplicate runs from an every-minute cron, which muddles diagnostics and
  // competes with the actual alert work.
  return minutesUntilOffset === 0;
}

function hourlyAssignmentClanIngestEnabled(env) {
  return String(env.INGEST_HOURLY_ASSIGNMENT_CLANS || "true").toLowerCase() !== "false";
}

function hourlyAssignmentClanScheduleMinutes(env) {
  return clamp(
    Number(env.HOURLY_ASSIGNMENT_CLAN_SCHEDULE_MINUTES || DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function hourlyAssignmentClanScheduleOffsetMinutes(env) {
  const interval = hourlyAssignmentClanScheduleMinutes(env);
  const offsetValue = env.HOURLY_ASSIGNMENT_CLAN_SCHEDULE_OFFSET_MINUTES === undefined || env.HOURLY_ASSIGNMENT_CLAN_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCHEDULE_OFFSET_MINUTES
    : env.HOURLY_ASSIGNMENT_CLAN_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function shouldRunHourlyAssignmentClanSchedule(env, scheduledAt = null) {
  return shouldRunMinuteSchedule(
    hourlyAssignmentClanScheduleMinutes(env),
    hourlyAssignmentClanScheduleOffsetMinutes(env),
    scheduledAt
  );
}

function hourlyAssignmentClanScanLimit(env) {
  return clamp(
    Number(env.HOURLY_ASSIGNMENT_CLAN_SCAN_LIMIT || DEFAULT_HOURLY_ASSIGNMENT_CLAN_SCAN_LIMIT),
    1,
    500
  );
}

function hourlyAssignmentClanRuntimeConfig(env) {
  return {
    enabled: hourlyAssignmentClanIngestEnabled(env),
    schedule_minutes: hourlyAssignmentClanScheduleMinutes(env),
    schedule_offset_minutes: hourlyAssignmentClanScheduleOffsetMinutes(env),
    scan_limit: hourlyAssignmentClanScanLimit(env)
  };
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

function memberSnapshotMinIntervalMinutes(env) {
  return clamp(
    Number(
      env.MEMBER_SNAPSHOT_MIN_INTERVAL_MINUTES ||
      env.CLAN_MEMBER_MIN_SNAPSHOT_INTERVAL_MINUTES ||
      env.BATTLE_MEMBER_MIN_SNAPSHOT_INTERVAL_MINUTES ||
      DEFAULT_MEMBER_SNAPSHOT_MIN_INTERVAL_MINUTES
    ),
    0,
    1440
  );
}

function clansSnapshotMinIntervalMinutes(env) {
  return clamp(
    Number(
      env.CLANS_SNAPSHOT_MIN_INTERVAL_MINUTES ||
      env.CLANS_LEADERBOARD_MIN_SNAPSHOT_INTERVAL_MINUTES ||
      DEFAULT_CLANS_SNAPSHOT_MIN_INTERVAL_MINUTES
    ),
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

  // Only the exact configured minute should start an activity crawl.  A
  // five-minute "window" turns a five-minute cadence into a run on every
  // minute, and two matching Cloudflare cron entries can then race each other
  // before the snapshot guard is written.
  return minutesUntilOffset === 0;
}

function offlinePingRuntimeConfig(env) {
  return {
    ingest_offline_alerts: offlinePingEnabled(env),
    default_minutes_threshold: offlineDefaultMinutes(env),
    default_post_rate_minutes: offlineDefaultPostRateMinutes(env),
    lookback_buffer_minutes: offlineLookbackBufferMinutes(env),
    schedule_minutes: offlinePingScheduleMinutes(env),
    schedule_offset_minutes: offlinePingScheduleOffsetMinutes(env),
    metric: "no_point_gain"
  };
}

function offlinePingEnabled(env) {
  // Treat either legacy flag as an enable switch. Using `a || b` here caused
  // an explicitly-set `INGEST_OFFLINE_ALERTS=false` to mask a valid legacy
  // `OFFLINE_PING_ENABLED=true` value.
  return [env.INGEST_OFFLINE_ALERTS, env.OFFLINE_PING_ENABLED]
    .some(value => String(value || "").trim().toLowerCase() === "true");
}

function offlineDefaultMinutes(env) {
  return clamp(Number(env.OFFLINE_DEFAULT_MINUTES || DEFAULT_OFFLINE_ALERT_MINUTES), 1, 1440);
}

function offlineDefaultPostRateMinutes(env) {
  return clamp(Number(env.OFFLINE_DEFAULT_POST_RATE_MINUTES || DEFAULT_OFFLINE_POST_RATE_MINUTES), 1, 1440);
}

function offlineLookbackBufferMinutes(env) {
  return clamp(Number(env.OFFLINE_LOOKBACK_BUFFER_MINUTES || DEFAULT_OFFLINE_LOOKBACK_BUFFER_MINUTES), 0, 1440);
}

function offlinePingScheduleMinutes(env) {
  return clamp(Number(env.OFFLINE_ALERT_SCHEDULE_MINUTES || DEFAULT_OFFLINE_ALERT_SCHEDULE_MINUTES), 5, 1440);
}

function offlinePingScheduleOffsetMinutes(env) {
  const interval = offlinePingScheduleMinutes(env);
  const offsetValue = env.OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES === undefined || env.OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES
    : env.OFFLINE_ALERT_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function shouldRunOfflinePingSchedule(env, scheduledAt = null) {
  const interval = offlinePingScheduleMinutes(env);
  const offset = offlinePingScheduleOffsetMinutes(env);
  const now = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minuteInInterval = minuteOfDay % interval;
  const minutesUntilOffset = (offset - minuteInInterval + interval) % interval;

  // The worker may be invoked every minute. Run only on the configured minute
  // so the same saved watch list is not evaluated several times per interval.
  return minutesUntilOffset === 0;
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

function robloxReleaseRuntimeConfig(env) {
  return {
    ingest_roblox_release_version_history: String(env.INGEST_ROBLOX_RELEASE_VERSION_HISTORY || "false").toLowerCase() === "true",
    binary_type: robloxReleaseBinaryType(env),
    channel: robloxReleaseChannel(env),
    schedule_minutes: robloxReleaseScheduleMinutes(env),
    schedule_offset_minutes: robloxReleaseScheduleOffsetMinutes(env),
    source: "clientsettings.roblox.com/v2/client-version"
  };
}

function ps99RestartRuntimeConfig(env) {
  return {
    ingest_ps99_restarts: ps99RestartEnabled(env),
    confirmation_mode: ps99RestartConfirmationMode(env),
    universe_id: ps99UniverseId(env),
    place_id: ps99RootPlaceId(env),
    schedule_minutes: 1,
    batch_size: ps99RestartBatchSize(env),
    page_count: ps99RestartPageCount(env),
    sample_size: ps99RestartSampleSize(env),
    confirmation_scans: ps99RestartConfirmations(env),
    cooldown_minutes: ps99RestartCooldownMinutes(env),
    require_version_correlation: ps99RestartRequireVersionCorrelation(env),
    sentinel: {
      enabled: ps99RestartSentinelEnabled(env),
      probe_quorum: ps99RestartProbeQuorum(env),
      same_version_quorum: ps99RestartProbeSameVersionQuorum(env),
      machine_quorum: ps99RestartProbeMachineQuorum(env),
      transition_window_seconds: ps99RestartProbeWindowSeconds(env),
      stale_after_seconds: ps99RestartProbeStaleSeconds(env)
    },
    ccu_monitoring: true,
    ccu_source: "Roblox universe playing count",
    ccu_used_for_detection: false,
    server_age_available: false,
    version_correlation: true,
    observed_version_diversity: true,
    public_server_scan_role: ps99RestartConfirmationMode(env) === "legacy"
      ? "legacy_confirmation"
      : "supporting_evidence_only",
    intelligence: ps99RestartIntelligenceRuntimeConfig(env)
  };
}

function ps99RestartEnabled(env) {
  return String(env.INGEST_PS99_RESTARTS || "false").toLowerCase() === "true";
}

function ps99RestartConfirmationMode(env) {
  const value = String(env.PS99_RESTART_CONFIRMATION_MODE || "sentinel").trim().toLowerCase();
  return value === "legacy" ? "legacy" : "sentinel";
}

function ps99RestartSentinelEnabled(env) {
  return Boolean(env.PS99_RESTART_PROBE_TOKEN)
    && String(env.PS99_RESTART_SENTINEL_ENABLED || "true").toLowerCase() !== "false";
}

function ps99RestartProbeQuorum(env) {
  return clamp(
    Number(env.PS99_RESTART_PROBE_QUORUM || DEFAULT_PS99_RESTART_PROBE_QUORUM),
    2,
    20
  );
}

function ps99RestartProbeSameVersionQuorum(env) {
  return clamp(
    Number(env.PS99_RESTART_PROBE_SAME_VERSION_QUORUM || DEFAULT_PS99_RESTART_PROBE_SAME_VERSION_QUORUM),
    ps99RestartProbeQuorum(env),
    20
  );
}

function ps99RestartProbeMachineQuorum(env) {
  return clamp(
    Number(env.PS99_RESTART_PROBE_MACHINE_QUORUM || DEFAULT_PS99_RESTART_PROBE_MACHINE_QUORUM),
    1,
    ps99RestartProbeSameVersionQuorum(env)
  );
}

function ps99RestartProbeWindowSeconds(env) {
  return clamp(
    Number(env.PS99_RESTART_PROBE_WINDOW_SECONDS || DEFAULT_PS99_RESTART_PROBE_WINDOW_SECONDS),
    60,
    1800
  );
}

function ps99RestartProbeStaleSeconds(env) {
  return clamp(
    Number(env.PS99_RESTART_PROBE_STALE_SECONDS || DEFAULT_PS99_RESTART_PROBE_STALE_SECONDS),
    30,
    600
  );
}

function ps99RestartProbeHistorySeconds(env) {
  const minimum = ps99RestartProbeWindowSeconds(env) + ps99RestartProbeStaleSeconds(env) * 2;
  return clamp(
    Number(env.PS99_RESTART_PROBE_HISTORY_SECONDS || DEFAULT_PS99_RESTART_PROBE_HISTORY_SECONDS),
    minimum,
    7200
  );
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

function robloxReleaseBinaryType(env) {
  return stringOrNull(env.ROBLOX_RELEASE_BINARY_TYPE) || DEFAULT_ROBLOX_RELEASE_BINARY_TYPE;
}

function robloxReleaseChannel(env) {
  return stringOrNull(env.ROBLOX_RELEASE_CHANNEL) || DEFAULT_ROBLOX_RELEASE_CHANNEL;
}

function robloxReleaseFetchAttempts(env) {
  return clamp(Number(env.ROBLOX_RELEASE_FETCH_ATTEMPTS || 3), 1, 6);
}

function robloxReleaseScheduleMinutes(env) {
  return clamp(
    Number(env.ROBLOX_RELEASE_SCHEDULE_MINUTES || DEFAULT_ROBLOX_RELEASE_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function robloxReleaseScheduleOffsetMinutes(env) {
  const interval = robloxReleaseScheduleMinutes(env);
  const offsetValue = env.ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES === undefined || env.ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES === ""
    ? DEFAULT_ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES
    : env.ROBLOX_RELEASE_SCHEDULE_OFFSET_MINUTES;

  return normalizedScheduleOffset(offsetValue, interval);
}

function shouldRunRobloxReleaseSchedule(env, scheduledAt = null) {
  const interval = robloxReleaseScheduleMinutes(env);
  const offset = robloxReleaseScheduleOffsetMinutes(env);
  const now = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minuteInInterval = minuteOfDay % interval;
  const minutesUntilOffset = (offset - minuteInInterval + interval) % interval;

  return minutesUntilOffset === 0;
}

function robloxFflagsSourceUrl(env) {
  return stringOrNull(env.ROBLOX_FFLAGS_SOURCE_URL) || DEFAULT_ROBLOX_FFLAGS_SOURCE_URL;
}

function robloxFflagScheduleMinutes(env) {
  return clamp(
    Number(env.ROBLOX_FFLAG_SCHEDULE_MINUTES || DEFAULT_ROBLOX_FFLAG_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function robloxFflagScheduleOffsetMinutes(env) {
  return normalizedScheduleOffset(env.ROBLOX_FFLAG_SCHEDULE_OFFSET_MINUTES || 0, robloxFflagScheduleMinutes(env));
}

function shouldRunRobloxFflagSchedule(env, scheduledAt = null) {
  return shouldRunMinuteSchedule(
    robloxFflagScheduleMinutes(env),
    robloxFflagScheduleOffsetMinutes(env),
    scheduledAt
  );
}

function ps99DevBlogFeedUrl(env) {
  return stringOrNull(env.PS99_DEV_BLOG_FEED_URL) || DEFAULT_PS99_DEV_BLOG_FEED_URL;
}

function ps99DevBlogScheduleMinutes(env) {
  return clamp(
    Number(env.PS99_DEV_BLOG_SCHEDULE_MINUTES || DEFAULT_PS99_DEV_BLOG_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function ps99DevBlogScheduleOffsetMinutes(env) {
  return normalizedScheduleOffset(env.PS99_DEV_BLOG_SCHEDULE_OFFSET_MINUTES || 0, ps99DevBlogScheduleMinutes(env));
}

function shouldRunPs99DevBlogSchedule(env, scheduledAt = null) {
  return shouldRunMinuteSchedule(
    ps99DevBlogScheduleMinutes(env),
    ps99DevBlogScheduleOffsetMinutes(env),
    scheduledAt
  );
}

function persistentDiscordPostsEnabled(env) {
  return Object.keys(PERSISTENT_DISCORD_TARGETS)
    .some(type => persistentDiscordDeliveryConfig(env, type).configured);
}

function rewardCutoffScheduleMinutes(env) {
  return clamp(
    Number(env.REWARD_CUTOFFS_SCHEDULE_MINUTES || DEFAULT_REWARD_CUTOFF_SCHEDULE_MINUTES),
    5,
    1440
  );
}

function rewardCutoffScheduleOffsetMinutes(env) {
  const interval = rewardCutoffScheduleMinutes(env);
  const value = env.REWARD_CUTOFFS_SCHEDULE_OFFSET_MINUTES === undefined
    ? DEFAULT_REWARD_CUTOFF_SCHEDULE_OFFSET_MINUTES
    : env.REWARD_CUTOFFS_SCHEDULE_OFFSET_MINUTES;
  return normalizedScheduleOffset(value, interval);
}

function shouldRunRewardCutoffSchedule(env, scheduledAt = null) {
  return shouldRunMinuteSchedule(
    rewardCutoffScheduleMinutes(env),
    rewardCutoffScheduleOffsetMinutes(env),
    scheduledAt
  );
}

function shouldRunMinuteSchedule(interval, offset, scheduledAt = null) {
  const now = scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())
    ? scheduledAt
    : new Date();
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minuteInInterval = minuteOfDay % interval;
  const minutesUntilOffset = (offset - minuteInInterval + interval) % interval;
  return minutesUntilOffset === 0;
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

  return minutesUntilOffset === 0;
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
  const includeWmsy = String(env.WMSY_MODE_ENABLED ?? "true").trim().toLowerCase() !== "false";
  if (includeWmsy) names.push("WMSY");
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

function discordHourlyAssignmentKey(channelId, storedTarget) {
  const channel = String(channelId || "").trim();
  const raw = String(storedTarget || "").trim();
  if (!channel || !raw) return "";

  const lower = raw.toLowerCase();
  const isUser = lower.startsWith("user:");
  const isLeague = lower.startsWith("league:");
  const target = isUser
    ? raw.slice("user:".length).trim()
    : isLeague
      ? raw.slice("league:".length).trim()
      : raw;
  const key = normalizeText(target);
  if (!key) return "";

  return `${channel}:${isUser ? "user" : isLeague ? "league" : "clan"}:${key}`;
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

function groupRowsBy(rows, getKey) {
  const grouped = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = String(getKey(row) || "");
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function uniqueValues(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(value => String(value || "").trim())
    .filter(Boolean))];
}

function stringOrNull(value) {
  const text = String(value || "").trim();
  return text || null;
}

function parseBooleanish(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off", "n"].includes(normalized)) return false;

  return null;
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

function isSnapshotAtOrBeforeEventEnd(snapshotAt, eventEndAt) {
  const eventEndMs = isoToMs(eventEndAt);
  if (!eventEndMs) return true;
  const snapshotMs = isoToMs(snapshotAt);
  return Boolean(snapshotMs && snapshotMs <= eventEndMs);
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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

function derivedSnapshotCacheSeconds(env) {
  return clamp(
    Number(env?.DERIVED_SNAPSHOT_CACHE_SECONDS || DEFAULT_DERIVED_SNAPSHOT_CACHE_SECONDS),
    0,
    86400
  );
}

function derivedSnapshotCacheKey(kind, latest) {
  const identity = [
    String(kind || "derived"),
    String(latest?.clan_name || CLANS_BATTLE_RUN_CLAN_NAME),
    String(latest?.battle_key || "unknown"),
    String(latest?.snapshot_id || latest?.fetched_at || "unknown")
  ].map(value => encodeURIComponent(value)).join("/");

  return new Request(`https://c0ld-derived-cache.internal/v2/${identity}`, {
    method: "GET"
  });
}

async function readDerivedSnapshotCache(env, kind, latest) {
  if (derivedSnapshotCacheSeconds(env) <= 0) return null;
  if (typeof caches === "undefined" || !caches?.default) return null;

  try {
    const response = await caches.default.match(derivedSnapshotCacheKey(kind, latest));
    return response?.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function writeDerivedSnapshotCache(env, kind, latest, data) {
  const seconds = derivedSnapshotCacheSeconds(env);
  if (seconds <= 0) return;
  if (typeof caches === "undefined" || !caches?.default) return;

  try {
    await caches.default.put(
      derivedSnapshotCacheKey(kind, latest),
      json(data, 200, {
        "Cache-Control": `public, max-age=${seconds}`
      })
    );
  } catch {
    // Cache availability must never block a live API response.
  }
}

function cacheJson(data, env, secondsOverride = null) {
  const seconds = secondsOverride === null || secondsOverride === undefined
    ? publicCacheSeconds(env)
    : clamp(Number(secondsOverride), 0, 3600);
  return json(data, 200, {
    "Cache-Control": `public, max-age=${Math.max(0, seconds)}, stale-while-revalidate=300`
  });
}

function noStoreJson(data, status = 200) {
  return json(data, status, {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Expires": "0"
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

  // These endpoints change immediately after an ingest. Never read or write
  // them through the Worker cache, otherwise an old empty rollover response
  // can overwrite a newly ingested leaderboard in the browser.
  if (
    url.pathname === "/api/current" ||
    url.pathname === "/api/clans/current"
  ) {
    return false;
  }

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
