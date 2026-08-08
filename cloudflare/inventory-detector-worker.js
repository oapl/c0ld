const SNAPSHOT_TABLE = "ps99_inventory_snapshots";
const ITEM_TABLE = "ps99_inventory_snapshot_items";
const DISCORD_POSTS_TABLE = "ps99_inventory_discord_posts";
const OAUTH_GRANTS_TABLE = "ps99_inventory_oauth_grants";
const OAUTH_STATES_TABLE = "ps99_inventory_oauth_states";
const HATCH_TRACKER_USERS_TABLE = "ps99_hatch_tracker_users";
const HATCH_ALERTS_TABLE = "ps99_hatch_alerts";
const HATCH_GUILD_CONFIG_TABLE = "ps99_hatch_tracker_guilds";
const HTG_INVENTORY_STATE_TABLE = "ps99_htg_inventory_state";
const BIG_GAMES_AUTHORIZE_URL = "https://db.biggames.io/oauth/authorize";
const BIG_GAMES_OAUTH_CALLBACK_PATH = "/api/inventory/oauth/callback";
const BIG_GAMES_SHORT_OAUTH_CALLBACK_PATH = "/cb";
const BIG_GAMES_TOKEN_URL = "https://db.biggames.io/oauth/token";
const BIG_GAMES_INVENTORY_URL = "https://ps99.biggamesapi.io/v1/account/inventory";
const BIG_GAMES_PROFILE_URL = "https://ps99.biggamesapi.io/v1/account/profile";
const BIG_GAMES_TRADES_URL = "https://ps99.biggamesapi.io/v1/account/trades";
const BIG_GAMES_BOOTH_URL = "https://ps99.biggamesapi.io/v1/account/booth";
const BIG_GAMES_MAIL_URL = "https://ps99.biggamesapi.io/v1/account/mail";
const BIG_GAMES_PET_COLLECTION_URL = "https://ps99.biggamesapi.io/api/collection/Pets";
const BIG_GAMES_INVENTORY_SCOPE = "player-data:pet-simulator-99:inventory:read";
const BIG_GAMES_PROFILE_SCOPE = "player-data:pet-simulator-99:profile:read";
const BIG_GAMES_TRADE_SCOPE = "player-data:pet-simulator-99:trades:read";
const BIG_GAMES_BOOTH_SCOPE = "player-data:pet-simulator-99:booth:read";
const BIG_GAMES_MAIL_SCOPE = "player-data:pet-simulator-99:mail:read";
const BIG_GAMES_HATCH_TRACKER_SCOPES = Object.freeze([
  BIG_GAMES_PROFILE_SCOPE,
  BIG_GAMES_INVENTORY_SCOPE,
  BIG_GAMES_TRADE_SCOPE,
  BIG_GAMES_BOOTH_SCOPE,
  BIG_GAMES_MAIL_SCOPE
]);
const HATCH_OAUTH_STATE_BYTES = 16;
const HATCH_SOURCE_ENDPOINTS = Object.freeze([
  { key: "trades", label: "trade", scope: BIG_GAMES_TRADE_SCOPE, envUrl: "BIG_GAMES_TRADES_URL", defaultUrl: BIG_GAMES_TRADES_URL },
  { key: "booth", label: "booth", scope: BIG_GAMES_BOOTH_SCOPE, envUrl: "BIG_GAMES_BOOTH_URL", defaultUrl: BIG_GAMES_BOOTH_URL },
  { key: "mail", label: "mail", scope: BIG_GAMES_MAIL_SCOPE, envUrl: "BIG_GAMES_MAIL_URL", defaultUrl: BIG_GAMES_MAIL_URL }
]);
const BIG_GAMES_GRANT_KEY = "big_games_inventory";
const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_COMPONENTS_V2_FLAG = 1 << 15;
const LUNA_WEBHOOK_USERNAME = "Luna";
const LUNA_AVATAR_URL = "https://i.imgur.com/rVVo99A.png";
const HATCH_ALERT_THUMBNAIL_URL = "https://i.imgur.com/rVVo99A.png";
const DEFAULT_LEAGUE_API_BASE = "https://yamo-league-api-worker.opal-dde.workers.dev";
const DEFAULT_TIME_ZONE = "America/Denver";
const DEFAULT_USER_ID = "109818";
const DEFAULT_USERNAME = "Cinnamowopal";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const DEFAULT_MIN_FETCH_INTERVAL_MINUTES = 55;
const DEFAULT_PET_CATALOG_CACHE_SECONDS = 3600;
const HATCH_SOURCE_WINDOW_PADDING_MINUTES = 10;
const DEFAULT_HATCH_BASELINE_STABLE_COMPARISONS = 1;
const DEFAULT_HATCH_BACKFILL_MIN_ITEM_GROWTH = 25;
const DEFAULT_HATCH_BACKFILL_ITEM_GROWTH_RATIO = 0.05;
const DEFAULT_HATCH_BACKFILL_HTG_GAIN_COUNT = 2;
const DEFAULT_HATCH_BACKFILL_TOTAL_GAIN_COUNT = 20;
const DEFAULT_HATCH_HISTORICAL_ECHO_LOOKBACK_HOURS = 48;
// BIG Games gives each Roblox account its own shared refresh allowance. Standard
// accounts receive 48/day and VIP accounts receive 96/day. The allowance is
// shared with the BIG Games site, public-profile reads, and every third-party
// app, so unknown accounts must start from the conservative standard limit.
const DEFAULT_HTG_SCAN_INTERVAL_MINUTES = 15;
const MIN_HTG_FORCE_REFRESH_INTERVAL_MINUTES = 5;
const DEFAULT_HTG_REFRESH_QUOTA_LIMIT = 48;
const DEFAULT_HTG_REFRESH_QUOTA_RESERVE = 6;
const DEFAULT_HTG_FAILURE_RETRY_MINUTES = 15;
const DEFAULT_HTG_FAILURE_RETRY_MAX_MINUTES = 120;
const DEFAULT_HTG_REQUIRE_SOURCE_FILTER = true;
const DEFAULT_HTG_SOURCE_CONFIRMATION_OBSERVATIONS = 2;
const DEFAULT_HTG_SCAN_HISTORY_LIMIT = 96;
const DEFAULT_INVENTORY_SNAPSHOT_ITEM_READ_LIMIT = 50000;
const HATCH_TRACKER_TIERS = ["huge", "titanic", "gargantuan"];
const HATCH_TIER_PRIORITY = { huge: 1, titanic: 2, gargantuan: 3 };
// Every server destination must be explicitly re-enabled after the HTG
// server-scoping rollout.  Old subscriptions deliberately have no version,
// so they remain inert rather than continuing to post in a former server.
const HTG_SUBSCRIPTION_CONSENT_VERSION = 2;
const INVENTORY_BUILD_ID = "inventory-htg-v2-reliable-refresh-2026-08-07h";
const SNAPSHOT_PUBLIC_SELECT = "id,roblox_user_id,roblox_username,source,captured_at,local_day,is_boundary,boundary_label,item_count";
const VERIFIED_INVENTORY_SELECTION_METHODS = Object.freeze(["configured", "recognized_path", "verified_shape"]);
const FEATURED_EVENT_PETS = [
  { key: "elephant", name: "War Elephant" },
  { key: "jaguar", name: "Warrior Jaguar" },
  { key: "peacock", name: "Jewel Peacock" },
  { key: "genie", name: "Genie Fox" }
];
const EVENT_PET_NAMES = [
  "Caveman Bear", "Mammoth Elephant", "Bastet Cat", "Horus Falcon",
  "Triumphant Eagle", "Legionary Bear", "Fenrir Wolf", "Druid Owl",
  "Knight Corgi", "Crusader Dragon", "Temple Toucan", "Naga Cobra",
  "War Elephant", "Warrior Jaguar", "Steppe Wolf", "Samurai Kitsune",
  "Jewel Peacock", "Genie Fox"
];
const EVENT_PET_BASE_POWERS = Object.freeze({
  "Caveman Bear": 3,
  "Mammoth Elephant": 8,
  "Bastet Cat": 14,
  "Horus Falcon": 20,
  "Triumphant Eagle": 100,
  "Legionary Bear": 520,
  "Fenrir Wolf": 2700,
  "Druid Owl": 14000,
  "Knight Corgi": 90000,
  "Crusader Dragon": 600000,
  "Steppe Wolf": 4000000,
  "Samurai Kitsune": 32000000,
  "Temple Toucan": 400000000,
  "Naga Cobra": 5000000000,
  "War Elephant": 65000000000,
  "Warrior Jaguar": 850000000000,
  "Jewel Peacock": 11000000000000,
  "Genie Fox": 145000000000000
});
const PET_POWER_VARIANT_MULTIPLIERS = Object.freeze({
  Normal: 1,
  Golden: 2,
  Rainbow: 4,
  "Shiny Normal": 1.5,
  "Shiny Golden": 3,
  "Shiny Rainbow": 6
});

let petCatalogCache = null;
let petCatalogExpiresAt = 0;
let petCatalogPromise = null;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request, env);
      const url = new URL(request.url);
      let response;

      if (request.method === "GET" && url.pathname === "/api/inventory/health") {
        const oauth = await oauthStatus(env);
        const assignedHatchConfigs = await fetchEnabledHatchGuildConfigs(env).catch(() => []);
        const enabledHatchTrackers = await fetchEnabledHatchTrackers(env).catch(() => []);
        const assignedHatchChannelCount = assignedHatchConfigs.filter(config => String(config.channel_id || "").trim()).length;
        const hatchTrackerHealth = compactHatchTrackerHealth(enabledHatchTrackers, env);
        response = json({
          ok: true,
          service: "ps99-inventory-detector",
          build_id: INVENTORY_BUILD_ID,
          timezone: timeZone(env),
          min_fetch_interval_minutes: inventoryMinFetchIntervalMinutes(env),
          skip_duplicate_source: envBool(env.INVENTORY_SKIP_DUPLICATE_SOURCE, true),
          configured_inventory_items_path: String(env.BIG_GAMES_INVENTORY_ITEMS_PATH || "").trim() || null,
          heuristic_inventory_selection: envBool(env.INVENTORY_ALLOW_HEURISTIC_ITEMS, false),
          supabase_configured: !!(supabaseUrl(env) && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)),
          big_games_oauth_configured: bigGamesOAuthConfigured(env),
          big_games_oauth_connected: oauth.connected,
          big_games_oauth_expires_at: oauth.expires_at,
          hatch_tracker: {
            big_games_oauth_configured: hatchBigGamesOAuthConfigured(env),
            big_games_redirect_uri: bigGamesOAuthApp(env, "hatch_tracker", { allowMissing: true }).redirectUri || null,
            force_refresh_on_schedule: htgForceRefreshOnSchedule(env),
            scan_interval_minutes: htgScanIntervalMinutes(env),
            effective_minimum_interval_minutes: htgMinimumFullDayIntervalMinutes(env),
            refresh_quota_limit: htgRefreshQuotaLimit(env),
            refresh_quota_model: "per_account_dynamic_48_or_96_shared_with_big_games",
            refresh_quota_reserve: htgRefreshQuotaReserve(env),
            scheduled_refresh_budget: htgScheduledRefreshBudget(env),
            maximum_scheduled_refreshes_per_24h: Math.floor(1440 / htgMinimumFullDayIntervalMinutes(env)),
            quota_aware_scheduling: true,
            max_concurrent_scans: htgMaxConcurrentScans(env),
            shard_count: htgShardCount(env),
            current_shard: htgCurrentShard(env, new Date()),
            require_source_filter: htgRequireSourceFilter(env),
            source_filter_hold_minutes: htgSourceFilterHoldMinutes(env),
            stale_alert_window_minutes: htgStaleAlertWindowMinutes(env),
            baseline_protection_enabled: envBool(env.HATCH_BASELINE_PROTECTION_ENABLED, true),
            baseline_stable_comparisons: hatchBaselineStableComparisons(env),
            backfill_min_item_growth: hatchBackfillMinItemGrowth(env),
            backfill_item_growth_ratio: hatchBackfillItemGrowthRatio(env),
            backfill_htg_gain_count: hatchBackfillHtgGainCount(env),
            backfill_total_gain_count: hatchBackfillTotalGainCount(env),
            snapshot_item_read_limit: inventorySnapshotItemReadLimit(env),
            channel_configured: Boolean(assignedHatchChannelCount),
            assigned_channel_count: assignedHatchChannelCount,
            delivery_mode: "server_scoped_channels",
            enabled_tracker_count: hatchTrackerHealth.enabled_tracker_count,
            enabled_account_count: hatchTrackerHealth.enabled_account_count,
            shared_account_subscription_count: hatchTrackerHealth.shared_account_subscription_count,
            pending_gain_count: hatchTrackerHealth.pending_gain_count,
            overdue_tracker_count: hatchTrackerHealth.overdue_tracker_count,
            failed_tracker_count: hatchTrackerHealth.failed_tracker_count,
            failed_tracker_errors: hatchTrackerHealth.failed_tracker_errors,
            quota_paused_tracker_count: hatchTrackerHealth.quota_paused_tracker_count,
            oldest_last_checked_at: hatchTrackerHealth.oldest_last_checked_at,
            oldest_last_scan_attempt_at: hatchTrackerHealth.oldest_last_scan_attempt_at,
            observed_inventory_attempts_24h: hatchTrackerHealth.observed_inventory_attempts_24h,
            observed_forced_refresh_requests_24h: hatchTrackerHealth.observed_forced_refresh_requests_24h,
            observed_provider_refresh_units_24h: hatchTrackerHealth.observed_provider_refresh_units_24h,
            observed_source_verification_requests_24h: hatchTrackerHealth.observed_source_verification_requests_24h,
            observed_rate_limited_attempts_24h: hatchTrackerHealth.observed_rate_limited_attempts_24h,
            observed_alert_posts_24h: hatchTrackerHealth.observed_alert_posts_24h,
            bot_configured: Boolean(String(env.DISCORD_BOT_TOKEN || "").trim()),
            webhook_configured: Boolean(hatchAlertWebhookUrl(env))
          }
        });
      } else if (request.method === "POST" && url.pathname === "/api/inventory/oauth/start") {
        response = await handleOAuthStart(request, env);
      } else if (request.method === "GET" && (url.pathname === BIG_GAMES_OAUTH_CALLBACK_PATH || url.pathname === BIG_GAMES_SHORT_OAUTH_CALLBACK_PATH)) {
        response = await handleOAuthCallback(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/oauth/status") {
        response = await handleOAuthStatus(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/oauth/summary") {
        response = await handleOAuthSummary(env);
      } else if (request.method === "POST" && url.pathname === "/api/inventory/retry") {
        response = await handleInventoryRetry(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/inventory/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(request, env, "manual");
      } else if (request.method === "GET" && url.pathname === "/api/inventory/admin/source-debug") {
        requireAdmin(request, env);
        response = await handleInventorySourceDebug(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/inventory/post-hourly") {
        requireAdmin(request, env);
        response = await handlePostHourly(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/latest") {
        response = await handleLatest(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/diff") {
        response = await handleDiff(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/hourly") {
        response = await handleHourlySeries(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/hatch/oauth/start") {
        requireAdmin(request, env);
        response = await handleHatchOAuthStart(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/oauth/authorize") {
        response = await handleHatchOAuthAuthorizeRedirect(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/hatch/tracker") {
        requireAdmin(request, env);
        response = await handleHatchTrackerCommand(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/tracker/status") {
        requireAdmin(request, env);
        response = await handleHatchTrackerStatus(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/diagnostics") {
        requireAdmin(request, env);
        response = await handleHatchDiagnostics(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/diagnostics/htg-history") {
        requireAdmin(request, env);
        response = await handleHtgObservationHistory(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/diagnostics/summary") {
        requireAdmin(request, env);
        response = await handleHatchDiagnosticsSummary(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/guild-config") {
        requireAdmin(request, env);
        response = await handleHatchGuildConfigStatus(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/hatch/guild-config") {
        requireAdmin(request, env);
        response = await handleHatchGuildConfigCommand(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/hatch/alerts/check") {
        requireAdmin(request, env);
        response = await handleHatchAlertCheck(request, env);
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
      const now = new Date();
      const [users, trackers] = await Promise.all([
        trackedInventoryUsers(env),
        fetchEnabledHatchTrackers(env)
      ]);
      const authorizationExpiryResults = await mapSettledWithConcurrency(trackers, 8, tracker =>
        notifyHatchAuthorizationExpiryIfNeeded(env, tracker, now)
      );
      for (const result of authorizationExpiryResults) {
        if (result.status === "rejected") {
          console.warn("Scheduled HTG authorization-expiry notice failed", result.reason?.message || result.reason);
        }
      }
      const discordUsers = new Set(configuredUsers(env).map(user => String(user.user_id)));
      const hatchResults = await mapSettledWithConcurrency(trackers, htgMaxConcurrentScans(env), async tracker => {
        const user = hatchTrackerUser(tracker);
        // The expiry notifier above works only from the saved grant timestamp.
        // Do not turn the same expired grant into a failed inventory scan on every
        // later cron run: it cannot produce a fresh provider revision or an alert.
        if (hatchAuthorizationHasExpired(tracker, now)) {
          return {
            user,
            tracker_id: tracker.id || null,
            posted: false,
            skipped: true,
            reason: "Big Games authorization expired; waiting for the member to renew it."
          };
        }
        const schedule = htgV2ScheduleDecision(env, tracker, user.user_id, now, {
          cron: event?.cron
        });
        if (!schedule.due) return { user, tracker_id: tracker.id || null, posted: false, skipped: true, ...schedule };
        try {
          const result = await postHtgGainAlertIfNeeded(env, user, tracker, { source: "schedule", schedule });
          return { user, tracker_id: tracker.id || null, ...result };
        } catch (error) {
          await markHtgV2ScanFailed(env, tracker, error, new Date()).catch(markError => {
            console.warn("Could not persist scheduled HTG scan failure", markError?.message || markError);
          });
          throw error;
        }
      });
      for (const result of hatchResults) {
        if (result.status === "rejected") console.warn("Scheduled HTG gain alert check failed", result.reason?.message || result.reason);
      }

      const inventoryResults = await Promise.allSettled(users.map(async user => {
        const result = { user };
        if (user.inventory_enabled !== false && await inventoryScanIsDue(env, user, now, { synchronized: true })) {
          result.inventory = await ingestInventory(env, user, "schedule", isMountainMidnight(now, env), { force: false });
          if (!result.inventory.skipped && shouldPostHourly(now, env) && discordUsers.has(String(user.user_id))) {
            await postHourlyDiffIfNeeded(env, user);
          }
        } else {
          result.inventory = { skipped: true, reason: "Regular inventory snapshot is not due." };
        }

        return result;
      }));
      for (const result of inventoryResults) if (result.status === "rejected") console.warn("Scheduled inventory scan failed", result.reason?.message || result.reason);
    })());
  }
};

async function handleOAuthStart(request, env) {
  requireSupabase(env);
  requireBigGamesOAuth(env);
  const oauthApp = bigGamesOAuthApp(env, "inventory");

  const url = new URL(request.url);
  const selfAuthorization = envBool(url.searchParams.get("self"), false);
  const requestedUserId = selfAuthorization ? "" : String(url.searchParams.get("user_id") || configuredUsers(env)[0]?.user_id || "").trim();
  const configuredUser = requestedUserId ? configuredUsers(env).find(user => String(user.user_id) === requestedUserId) : null;
  const leagueMember = requestedUserId && !configuredUser && envBool(env.INVENTORY_LEAGUE_FEATURE, true) && envBool(env.INVENTORY_AUTO_DISCOVER_MEMBERS, true)
    ? await isCurrentLeagueMember(env, requestedUserId, url.searchParams.get("league"), url.searchParams.get("run"))
    : null;
  if (!selfAuthorization && !requestedUserId) throw httpError(400, "A Roblox user_id is required.");
  if (!selfAuthorization && !configuredUser && !leagueMember && !hasAdminAuthorization(request, env)) {
    throw httpError(403, "This Roblox account is not a current member of the selected tracked league.");
  }
  const targetUser = {
    user_id: requestedUserId || null,
    username: String(url.searchParams.get("username") || configuredUser?.username || leagueMember?.username || requestedUserId || "").trim() || null
  };
  const returnUrl = validatedOAuthReturnUrl(url.searchParams.get("return_url"), env);

  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  await supabaseUpsert(env, OAUTH_STATES_TABLE, [{
    state_hash: await sha256Base64Url(state),
    code_verifier_ciphertext: await sealSecret(verifier, oauthApp.clientSecret, "big-games-pkce-verifier"),
    expires_at: expiresAt,
    created_at: now.toISOString(),
    used_at: null,
    target_roblox_user_id: targetUser.user_id ? Number(targetUser.user_id) : null,
    target_roblox_username: targetUser.username,
    return_url: returnUrl || null,
    force_ingest: true
  }], "state_hash");

  const authorizeUrl = new URL(BIG_GAMES_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", oauthApp.clientId);
  authorizeUrl.searchParams.set("redirect_uri", oauthApp.redirectUri);
  authorizeUrl.searchParams.set("scope", bigGamesOAuthScopeString(env, "inventory"));
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  return json({
    ok: true,
    user_id: targetUser.user_id,
    username: targetUser.username,
    self_authorization: selfAuthorization,
    authorize_url: authorizeUrl.toString(),
    expires_at: expiresAt,
    message: "Open authorize_url and approve access within 10 minutes."
  });
}

async function handleHatchOAuthStart(request, env) {
  requireSupabase(env);
  requireHatchBigGamesOAuth(env);
  const oauthApp = bigGamesOAuthApp(env, "hatch_tracker");
  const body = await readJsonOptional(request);
  const discordUserId = requiredDiscordSnowflake(body.discord_user_id, "discord_user_id");
  const discordUsername = firstString(body.discord_username);
  // HTG permissions are intentionally scoped to the Discord server where they
  // were granted.  A direct-message setup has no safe destination, so reject it
  // instead of falling back to every configured HTG channel.
  const guildId = requiredDiscordSnowflake(body.guild_id, "guild_id");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const state = randomBase64Url(HATCH_OAUTH_STATE_BYTES);
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const selectedTier = normalizeHatchTierSelection(body.tier || "all");
  const enableAfterAuth = body.enable_after_auth === true;
  const targetAccount = await resolveHatchOAuthTargetAccount(firstString(body.roblox_user_id, body.user_id, body.account, body.username), env);
  const pending = await fetchPendingHatchTrackerByDiscordUser(env, discordUserId);
  const existingAccounts = (await fetchHatchTrackersByDiscordUser(env, discordUserId))
    .filter(row => row.roblox_user_id);
  const inheritedTiers = hatchTrackerUnionEnabledTiersForGuild(existingAccounts, guildId);
  const inheritEnabled = !enableAfterAuth && existingAccounts.some(row => hatchTrackerHasEnabledGuildSubscription(row, guildId));
  const pendingGuildTiers = hatchTrackerEnabledTiersForGuild(pending, guildId);
  const pendingTiers = enableAfterAuth
    ? mergeHatchTierSelection(pendingGuildTiers, selectedTier)
    : pendingGuildTiers.length
      ? pendingGuildTiers
      : inheritedTiers.length
        ? inheritedTiers
        : [...HATCH_TRACKER_TIERS];

  await savePendingHatchTracker(env, {
    existing: pending,
    discordUserId,
    discordUsername,
    enabled: enableAfterAuth || hatchTrackerHasEnabledGuildSubscription(pending, guildId) || inheritEnabled,
    tiers: pendingTiers,
    alertGuildId: guildId
  });

  await supabaseUpsert(env, OAUTH_STATES_TABLE, [{
    state_hash: await sha256Base64Url(state),
    code_verifier_ciphertext: await sealSecret(verifier, oauthApp.clientSecret, "big-games-pkce-verifier"),
    expires_at: expiresAt,
    created_at: now.toISOString(),
    used_at: null,
    target_roblox_user_id: targetAccount?.user_id ? Number(targetAccount.user_id) : null,
    target_roblox_username: targetAccount?.username || null,
    return_url: hatchOAuthReturnUrl(env) || null,
    force_ingest: true,
    metadata: {
      purpose: "hatch_tracker",
      oauth_app: "hatch_tracker",
      oauth_client_id: oauthApp.clientId,
      discord_user_id: discordUserId,
      discord_username: discordUsername || null,
      guild_id: guildId,
      target_roblox_user_id: targetAccount?.user_id || null,
      target_roblox_username: targetAccount?.username || null,
      enable_after_auth: enableAfterAuth,
      enabled_tiers: pendingTiers
    }
  }], "state_hash");

  const authorizeUrl = bigGamesAuthorizeUrl(env, oauthApp, "hatch_tracker", state, challenge);

  return json({
    ok: true,
    user_id: targetAccount?.user_id || null,
    username: targetAccount?.username || null,
    authorize_url: authorizeUrl,
    short_authorize_url: hatchOAuthShortAuthorizeUrl(env, state),
    expires_at: expiresAt,
    tracker: await hatchTrackerStatus(env, discordUserId),
    message: "Open authorize_url and approve access within 10 minutes."
  });
}

async function handleHatchOAuthAuthorizeRedirect(request, env) {
  requireSupabase(env);
  requireHatchBigGamesOAuth(env);
  const url = new URL(request.url);
  const state = String(url.searchParams.get("state") || "").trim();
  if (!state) return oauthHtml(false, "This authorization link is missing its state. Start /htg setup again.");

  const pending = await fetchPendingOAuthState(env, state);
  if (!pending || pending.used_at || new Date(pending.expires_at).getTime() <= Date.now()) {
    return oauthHtml(false, "This authorization link is invalid, expired, or was already used. Start /htg setup again.");
  }

  if (pendingOAuthPurpose(pending) !== "hatch_tracker") {
    return oauthHtml(false, "This authorization link is not for the HTG tracker. Start /htg setup again.");
  }

  const oauthApp = bigGamesOAuthAppForPendingState(env, pending);
  const verifier = await openSecret(pending.code_verifier_ciphertext, oauthApp.clientSecret, "big-games-pkce-verifier");
  const authorizeUrl = bigGamesAuthorizeUrl(env, oauthApp, "hatch_tracker", state, await sha256Base64Url(verifier));
  return Response.redirect(authorizeUrl, 302);
}

async function handleOAuthCallback(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") || "");
  const state = String(url.searchParams.get("state") || "");
  if (!state) return oauthHtml(false, "The callback did not include an authorization state.");

  const stateHash = await sha256Base64Url(state);
  const pending = await fetchPendingOAuthState(env, state);
  if (!pending || pending.used_at || new Date(pending.expires_at).getTime() <= Date.now()) {
    return oauthHtml(false, "This authorization link is invalid, expired, or was already used. Start again.");
  }
  const isHatchTrackerOAuth = pendingOAuthPurpose(pending) === "hatch_tracker";
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `Big Games authorization was denied: ${oauthError}`);
  }
  if (!code) return oauthCompletion(pending, false, "The callback did not include an authorization code.");

  const oauthApp = bigGamesOAuthAppForPendingState(env, pending);
  const verifier = await openSecret(pending.code_verifier_ciphertext, oauthApp.clientSecret, "big-games-pkce-verifier");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: oauthApp.redirectUri,
    code_verifier: verifier
  });
  const basic = btoa(`${oauthApp.clientId}:${oauthApp.clientSecret}`);
  const tokenResponse = await fetch(BIG_GAMES_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
  const tokenText = await tokenResponse.text();
  let token;
  try { token = JSON.parse(tokenText); } catch {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `Big Games returned a non-JSON token response (${tokenResponse.status}).`);
  }
  if (!tokenResponse.ok || !token.access_token) {
    const message = token?.error_description || token?.error?.message || token?.error || `HTTP ${tokenResponse.status}`;
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `Token exchange failed: ${message}`);
  }

  const scopes = String(token.scope || BIG_GAMES_INVENTORY_SCOPE).split(/\s+/).filter(Boolean);
  if (!scopes.includes(BIG_GAMES_INVENTORY_SCOPE)) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, "The approved token does not include Inventory access.");
  }

  const authorizedAt = new Date();
  const expiresIn = Math.max(60, Number(token.expires_in || 2592000));
  const expiresAt = new Date(authorizedAt.getTime() + expiresIn * 1000).toISOString();
  const tokenAccount = authorizedInventoryAccount(null, token);
  const invitedUserId = String(pending.target_roblox_user_id || "").trim();
  let rawProfile = null;
  let profileAccount = { user_id: "", username: "" };
  if (isHatchTrackerOAuth && !scopes.includes(BIG_GAMES_PROFILE_SCOPE)) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, "HTG authorization now requires Profile permission so Luna can verify the approving Roblox account. Start `/htg setup` again and approve the same linked Roblox account.");
  }
  if (isHatchTrackerOAuth) {
    try {
      rawProfile = await fetchProfileWithAccessToken(env, token.access_token);
      profileAccount = authorizedInventoryAccount(rawProfile, token);
    } catch (error) {
      console.warn("Big Games profile identity lookup failed", error?.message || error);
      await markOAuthStateUsed(env, stateHash);
      return oauthCompletion(pending, false, `HTG authorization could not verify the approving Roblox account: ${error?.message || error}. Start /htg setup again and approve the same linked Roblox account.`);
    }
    if (!profileAccount.user_id) {
      if (!invitedUserId) {
        await markOAuthStateUsed(env, stateHash);
        return oauthCompletion(pending, false, "Luna could not confirm which Roblox account approved this authorization. Start `/htg setup account:<roblox username>` so the approval can be tied to a specific account.");
      }
      console.warn("Big Games profile identity was unavailable; using account-bound HTG setup target", invitedUserId);
    }
  }
  let targetUserId = invitedUserId || profileAccount.user_id || tokenAccount.user_id;
  if (
    invitedUserId &&
    tokenAccount.user_id &&
    tokenAccount.user_id !== invitedUserId &&
    (!isHatchTrackerOAuth || profileAccount.user_id !== invitedUserId)
  ) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `This invitation is for Roblox user ${invitedUserId}, but a different account approved it.`);
  }
  if (invitedUserId && profileAccount.user_id && profileAccount.user_id !== invitedUserId) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `This invitation is for Roblox user ${invitedUserId}, but a different account approved it.`);
  }

  // Persist a valid grant before the initial inventory read. BIG Games records the
  // app as connected as soon as consent succeeds, and a transient read failure must
  // not discard that consent or make every later manual retry fall back to public data.
  if (targetUserId) {
    await saveOAuthGrant(env, {
      userId: targetUserId,
      username: profileAccount.username || tokenAccount.username || pending.target_roblox_username || null,
      token,
      scopes,
      authorizedAt,
      expiresAt,
      expiresIn,
      identityVerified: [tokenAccount.user_id, profileAccount.user_id].includes(targetUserId),
      purpose: isHatchTrackerOAuth ? "hatch_tracker" : "inventory"
    });
    await maybeUpsertHatchTrackerUserFromOAuth(env, pending, {
      userId: targetUserId,
      username: profileAccount.username || tokenAccount.username || pending.target_roblox_username || null,
      authorizedAt,
      expiresAt
    });
  }

  let rawInventory;
  let forcedRefresh = pending.force_ingest !== false;
  try {
    rawInventory = await fetchInventoryWithAccessToken(env, token.access_token, { forceRefresh: forcedRefresh });
  } catch (forcedError) {
    if (!forcedRefresh) {
      await markOAuthStateUsed(env, stateHash);
      return targetUserId
        ? oauthCompletion(pending, true, `${oauthConnectedPendingMessage(isHatchTrackerOAuth)}: ${forcedError?.message || forcedError}`, {
            oauth_result: "connected_pending",
            user_id: targetUserId,
            connected: "1",
            snapshot_ready: "0",
            snapshot_state: "missing"
          })
        : oauthCompletion(pending, false, `Authorization succeeded, but the approving Roblox account could not be identified because the first inventory read failed: ${forcedError?.message || forcedError}`);
    }
    try {
      rawInventory = await fetchInventoryWithAccessToken(env, token.access_token, { forceRefresh: false });
      forcedRefresh = false;
    } catch (fallbackError) {
      await markOAuthStateUsed(env, stateHash);
      return targetUserId
        ? oauthCompletion(pending, true, `${oauthConnectedPendingMessage(isHatchTrackerOAuth)}: ${fallbackError?.message || fallbackError}`, {
            oauth_result: "connected_pending",
            user_id: targetUserId,
            connected: "1",
            snapshot_ready: "0",
            snapshot_state: "missing"
          })
        : oauthCompletion(pending, false, `Authorization succeeded, but the approving Roblox account could not be identified because the first inventory read failed: ${fallbackError?.message || fallbackError}`);
    }
  }
  const inventoryAccount = authorizedInventoryAccount(rawInventory, token);
  const account = isHatchTrackerOAuth && profileAccount.user_id
    ? profileAccount
    : inventoryAccount.user_id
    ? inventoryAccount
    : profileAccount.user_id
      ? profileAccount
      : tokenAccount;
  if (!targetUserId) targetUserId = account.user_id;
  if (!targetUserId) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, isHatchTrackerOAuth
      ? "Authorization succeeded, but BIG Games did not identify the approving Roblox account. Use /htg enable account:<roblox username or id> so Luna can bind the approval to the selected alt."
      : "Authorization succeeded, but BIG Games did not identify the approving Roblox account.");
  }
  if (account.user_id && account.user_id !== targetUserId) {
    await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${oauthGrantKey(targetUserId, isHatchTrackerOAuth ? "hatch_tracker" : "inventory")}` });
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, invitedUserId
      ? `This invitation is for Roblox user ${invitedUserId}, but a different account approved it.`
      : "The approving Roblox identity did not match the inventory account returned by BIG Games.");
  }
  await saveOAuthGrant(env, {
    userId: targetUserId,
    username: account.username || profileAccount.username || tokenAccount.username || pending.target_roblox_username || null,
    token,
    scopes,
    authorizedAt,
    expiresAt,
    expiresIn,
    identityVerified: account.user_id === targetUserId,
    purpose: isHatchTrackerOAuth ? "hatch_tracker" : "inventory"
  });
  await maybeUpsertHatchTrackerUserFromOAuth(env, pending, {
    userId: targetUserId,
    username: account.username || profileAccount.username || tokenAccount.username || pending.target_roblox_username || null,
    authorizedAt,
    expiresAt
  });
  const user = {
    user_id: targetUserId,
    username: account.username || pending.target_roblox_username || targetUserId
  };
  let ingest;
  try {
    ingest = await ingestInventory(env, user, "oauth_callback", false, { force: true, rawInventory });
  } catch (error) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, true, `${oauthSnapshotPendingMessage(isHatchTrackerOAuth)}: ${error?.message || error}`, {
      oauth_result: "connected_pending",
      user_id: targetUserId,
      connected: "1",
      snapshot_ready: "0",
      snapshot_state: "missing"
    });
  }
  if (isHatchTrackerOAuth && ingest.snapshot?.id) {
    const oauthDiscordUserId = String(pending?.metadata?.discord_user_id || "").trim();
    const tracker = oauthDiscordUserId
      ? await fetchHatchTrackerByDiscordRobloxUser(env, oauthDiscordUserId, targetUserId, { includeDisabled: true }).catch(() => null)
      : null;
    if (tracker) {
      await markHatchSnapshotCheckedWithBaseline(env, tracker, ingest.snapshot, {
        next_armed: false,
        stable_comparisons: 0,
        reason: "HTG baseline reset after Big Games authorization.",
        risk: {
          reasons: ["authorization_baseline"],
          start_item_count: 0,
          end_item_count: Number(ingest.snapshot.item_count || 0),
          item_growth: 0,
          item_growth_ratio: 0,
          candidate_gain_count: 0,
          total_gain_count: 0
        }
      }).catch(error => console.warn("HTG authorization baseline reset failed", error?.message || error));
    }
  }
  await markOAuthStateUsed(env, stateHash);

  return oauthCompletion(pending, true, oauthConnectedReadyMessage(isHatchTrackerOAuth, expiresAt), {
    user_id: targetUserId,
    pulled: "1",
    forced: forcedRefresh ? "1" : "0",
    snapshot_ready: "1",
    snapshot_state: "ready",
    snapshot_at: ingest.snapshot?.captured_at || ""
  });
}

async function handleOAuthStatus(request, env) {
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || configuredUsers(env)[0]?.user_id || DEFAULT_USER_ID).trim();
  const access = await oauthStatus(env, userId);
  const readiness = access.connected
    ? await inventoryReadiness(env, userId)
    : {
        snapshot_ready: false,
        snapshot_state: "disconnected",
        snapshot_at: null,
        snapshot_source: null,
        hourly_ready: false,
        hourly_rows: 0,
        scheduled_snapshot_count: 0
      };
  return json({
    ok: true,
    user_id: userId,
    ...access,
    ...readiness,
    connection_state: !access.connected ? "disconnected" : readiness.snapshot_ready ? "ready" : "pending_snapshot"
  });
}

async function handleHatchTrackerStatus(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const discordUserId = requiredDiscordSnowflake(url.searchParams.get("discord_user_id"), "discord_user_id");
  return json({ ok: true, tracker: await hatchTrackerStatus(env, discordUserId) });
}

async function handleHatchGuildConfigStatus(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const guildId = requiredDiscordSnowflake(url.searchParams.get("guild_id"), "guild_id");
  return json({
    ok: true,
    config: await fetchHatchGuildConfig(env, guildId)
  });
}

async function handleHatchGuildConfigCommand(request, env) {
  requireSupabase(env);
  const body = await readJsonOptional(request);
  const guildId = requiredDiscordSnowflake(body.guild_id, "guild_id");
  const channelId = requiredDiscordSnowflake(body.channel_id, "channel_id");
  const assignedBy = firstString(body.assigned_by);
  const now = new Date().toISOString();
  const rows = await supabaseUpsert(env, HATCH_GUILD_CONFIG_TABLE, [{
    guild_id: guildId,
    channel_id: channelId,
    channel_type: Number.isFinite(Number(body.channel_type)) ? Number(body.channel_type) : null,
    assigned_by: assignedBy || null,
    enabled: body.enabled !== false,
    updated_at: now
  }], "guild_id");

  return json({
    ok: true,
    config: rows[0] || await fetchHatchGuildConfig(env, guildId)
  });
}

async function handleHatchTrackerCommand(request, env) {
  requireSupabase(env);
  requireHatchBigGamesOAuth(env);
  const body = await readJsonOptional(request);
  const discordUserId = requiredDiscordSnowflake(body.discord_user_id, "discord_user_id");
  const discordUsername = firstString(body.discord_username);
  const guildId = requiredDiscordSnowflake(body.guild_id, "guild_id");
  const action = String(body.action || "").trim().toLowerCase();
  const selectedTier = normalizeHatchTierSelection(body.tier || "all");
  const accountSelector = normalizeHatchAccountSelector(firstString(body.account, body.roblox_user_id, body.username));
  if (!["enable", "disable"].includes(action)) throw httpError(400, "action must be enable or disable.");

  const now = new Date().toISOString();
  const trackerRows = await fetchHatchTrackersByDiscordUser(env, discordUserId);
  const connectedRows = trackerRows.filter(row => row.roblox_user_id);
  const selectedRows = selectHatchTrackerRows(connectedRows, accountSelector);

  if (action === "disable") {
    const targets = selectedRows.length ? selectedRows : trackerRows.filter(row => !row.roblox_user_id && accountSelector === "all");
    if (!targets.length) {
      throw httpError(404, accountSelector === "all"
        ? "No connected HTG Roblox accounts are saved for your Discord account yet."
        : `No connected HTG Roblox account matched "${accountSelector}".`);
    }

    await Promise.all(targets.map(row => {
      const nextTiers = removeHatchTierSelection(hatchTrackerEnabledTiersForGuild(row, guildId), selectedTier);
      const metadata = hatchTrackerMetadataWithGuildSubscription(row.metadata, guildId, nextTiers, nextTiers.length > 0);
      const enabled = hatchTrackerHasEnabledGuildSubscription({ metadata });
      return updateHatchTrackerRow(env, row, {
        discord_username: discordUsername || row.discord_username || null,
        enabled,
        disabled_at: enabled ? row.disabled_at || null : now,
        updated_at: now,
        metadata
      });
    }));

    return json({
      ok: true,
      action,
      tier: selectedTier,
      account: accountSelector,
      tracker: await hatchTrackerStatus(env, discordUserId),
      message: accountSelector === "all"
        ? `${hatchTierResponseLabel(selectedTier)} HTG gain alerts were disabled for your connected HTG accounts.`
        : `${hatchTierResponseLabel(selectedTier)} HTG gain alerts were disabled for ${hatchTrackerRowLabel(targets[0])}.`
    });
  }

  if (!connectedRows.length) {
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      guild_id: guildId,
      tier: selectedTier,
      account: accountSelector === "all" ? null : accountSelector,
      enable_after_auth: true
    });
    const accountLabel = auth.username || auth.user_id || (accountSelector === "all" ? "" : accountSelector);
    return json({
      ok: true,
      action,
      tier: selectedTier,
      account: accountSelector,
      needs_auth: true,
      authorize_url: auth.authorize_url,
      expires_at: auth.expires_at,
      tracker: await hatchTrackerStatus(env, discordUserId),
      message: accountLabel
        ? `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are queued for ${accountLabel}. Approve that same linked Roblox account in Big Games.`
        : `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are queued. Connect each Big Games linked Roblox account you want tracked.`
    });
  }

  if (!selectedRows.length) {
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      guild_id: guildId,
      tier: selectedTier,
      account: accountSelector,
      enable_after_auth: true
    });
    return json({
      ok: true,
      action,
      tier: selectedTier,
      account: accountSelector,
      needs_auth: true,
      authorize_url: auth.authorize_url,
      expires_at: auth.expires_at,
      tracker: await hatchTrackerStatus(env, discordUserId),
      message: `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are queued for ${auth.username || auth.user_id || accountSelector}. Approve that same linked Roblox account in Big Games.`
    });
  }

  const accessResults = await Promise.all(selectedRows.map(async row => ({
    row,
    access: await oauthStatus(env, row.roblox_user_id, "hatch_tracker")
  })));

  await Promise.all(accessResults.map(async ({ row }) => {
    const wasEnabled = hatchTrackerHasEnabledGuildSubscription(row);
    const nextTiers = mergeHatchTierSelection(hatchTrackerEnabledTiersForGuild(row, guildId), selectedTier);
    const scopedMetadata = hatchTrackerMetadataWithGuildSubscription(row.metadata, guildId, nextTiers, true);
    const enabled = hatchTrackerHasEnabledGuildSubscription({ metadata: scopedMetadata });
    const latestSnapshot = !wasEnabled && row.roblox_user_id
      ? await getLatestSnapshot(env, row.roblox_user_id).catch(() => null)
      : null;
    const metadata = !wasEnabled
      ? hatchTrackerMetadataWithHtgV2Reset(hatchTrackerMetadataWithBaseline(scopedMetadata, {
          armed: false,
          snapshot_id: firstString(latestSnapshot?.id),
          captured_at: firstString(latestSnapshot?.captured_at),
          item_count: Number(latestSnapshot?.item_count || 0),
          stable_comparisons: 0,
          reset_reason: "HTG baseline reset after alerts were enabled.",
          risk_reasons: latestSnapshot?.id ? ["enabled_baseline"] : ["enabled_waiting_for_snapshot"],
          risk: {
            start_item_count: 0,
            end_item_count: Number(latestSnapshot?.item_count || 0),
            item_growth: 0,
            item_growth_ratio: 0,
            candidate_gain_count: 0,
            total_gain_count: 0
          }
        }), "HTG v2 baseline reset after alerts were enabled.")
      : scopedMetadata;
    return updateHatchTrackerRow(env, row, {
      discord_username: discordUsername || row.discord_username || null,
      enabled,
      last_enabled_at: now,
      disabled_at: null,
      updated_at: now,
      last_checked_snapshot_id: latestSnapshot?.id || row.last_checked_snapshot_id || null,
      last_checked_at: latestSnapshot?.id ? now : row.last_checked_at || null,
      metadata
    });
  }));

  const expiredRows = accessResults.filter(item => !item.access.connected).map(item => item.row);
  if (expiredRows.length) {
    const firstExpired = expiredRows[0];
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      guild_id: guildId,
      tier: selectedTier,
      account: firstExpired?.roblox_user_id || firstExpired?.roblox_username || null,
      enable_after_auth: true
    });
    return json({
      ok: true,
      action,
      tier: selectedTier,
      account: accountSelector,
      needs_auth: true,
      authorize_url: auth.authorize_url,
      expires_at: auth.expires_at,
      tracker: await hatchTrackerStatus(env, discordUserId),
      message: expiredRows.length === 1
        ? `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are queued for ${hatchTrackerRowLabel(firstExpired)}, but Big Games authorization needs to be refreshed.`
        : `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are queued for ${expiredRows.length} accounts. Refresh ${hatchTrackerRowLabel(firstExpired)} with this link, then run the command again for the next account.`
    });
  }

  return json({
    ok: true,
    action,
    tier: selectedTier,
    account: accountSelector,
    tracker: await hatchTrackerStatus(env, discordUserId),
    message: accountSelector === "all"
      ? `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are enabled for ${selectedRows.length} connected HTG account${selectedRows.length === 1 ? "" : "s"}.`
      : `${hatchTierResponseLabel(selectedTier)} HTG gain alerts are enabled for ${hatchTrackerRowLabel(selectedRows[0])}.`
  });
}

async function handleHatchAlertCheck(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = await resolveRequestUser(env, url);
  const tracker = await fetchHatchTrackerByRobloxUser(env, user.user_id);
  if (!tracker) return json({ ok: false, message: "HTG gain alerts are not enabled for that Roblox account." }, 404);
  try {
    return json({
      ok: true,
      ...(await postHtgGainAlertIfNeeded(env, user, tracker, {
        source: "manual",
        force: parseBool(url.searchParams.get("force")) === true
      }))
    });
  } catch (error) {
    const latestTracker = await fetchHatchTrackerByRobloxUser(env, user.user_id, { includeDisabled: true }).catch(() => null);
    await markHtgV2ScanFailed(env, latestTracker || tracker, error, new Date()).catch(() => {});
    throw error;
  }
}

async function handleHatchDiagnostics(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = await resolveRequestUser(env, url);
  const itemQuery = String(url.searchParams.get("item") || "Huge Turnip Hamster").trim();
  const snapshotLimit = Math.max(2, Math.min(30, Number(url.searchParams.get("limit") || 12)));
  const includeDiffs = parseBool(url.searchParams.get("include_diffs")) !== false;
  const tracker = await fetchHatchTrackerByRobloxUser(env, user.user_id, { includeDisabled: true });
  const trackerStatus = tracker?.discord_user_id ? await hatchTrackerStatus(env, tracker.discord_user_id) : null;
  const grantIdentity = await htgGrantIdentityDiagnostics(env, user.user_id).catch(error => ({ error: error?.message || String(error) }));
  const snapshots = sortAsc(await getUserSnapshots(env, user.user_id, snapshotLimit));
  const itemTimeline = [];
  const snapshotItems = new Map();

  for (const snapshot of snapshots) {
    const items = await getSnapshotItems(env, snapshot.id);
    snapshotItems.set(snapshot.id, items);
    const matches = items.filter(item => hatchDiagnosticItemMatches(item, itemQuery));
    itemTimeline.push({
      snapshot_id: snapshot.id,
      captured_at: snapshot.captured_at,
      source: snapshot.source,
      source_fetched_at: snapshot.raw?.source_fetched_at || null,
      inventory_selection_method: snapshot.raw?.inventory_selection_method || null,
      item_count: snapshot.item_count,
      matched_count: matches.reduce((total, item) => total + Number(item.count || 0), 0),
      matches: matches.slice(0, 12).map(compactInventoryItemForDiagnostics)
    });
  }

  const recentDiffs = [];
  if (includeDiffs) {
    for (let i = 1; i < snapshots.length; i++) {
      const start = snapshots[i - 1];
      const end = snapshots[i];
      const diff = buildDiff(snapshotItems.get(start.id), snapshotItems.get(end.id));
      const hatchCandidates = await hatchAlertCandidates(env, diff.gained || []);
      const queryCandidates = hatchCandidates.filter(item => hatchDiagnosticItemMatches(item, itemQuery));
      recentDiffs.push({
        period_start: start.captured_at,
        period_end: end.captured_at,
        snapshot_start_id: start.id,
        snapshot_end_id: end.id,
        hatch_candidate_count: hatchCandidates.length,
        matching_hatch_candidates: queryCandidates.map(compactHatchCandidate),
        top_hatch_candidates: hatchCandidates.slice(0, 10).map(compactHatchCandidate)
      });
    }
  }

  const alertRows = await supabaseSelectAll(env, HATCH_ALERTS_TABLE, {
    select: "id,tracker_id,discord_user_id,roblox_user_id,roblox_username,period_start,period_end,tier,display_name,variant,delta,rap,snapshot_start_id,snapshot_end_id,discord_response,all_gained,created_at",
    roblox_user_id: `eq.${user.user_id}`,
    order: "created_at.desc"
  }, 25).catch(error => [{ error: error?.message || String(error) }]);
  const htgStateRows = await fetchHtgInventoryStateRows(env, user.user_id).catch(error => [{ error: error?.message || String(error) }]);
  const guildConfigs = await fetchEnabledHatchGuildConfigs(env).catch(error => [{ error: error?.message || String(error) }]);
  const latest = snapshots[snapshots.length - 1] || null;
  const uncheckedLatest = !!tracker && !!latest && String(tracker.last_checked_snapshot_id || "") !== String(latest.id || "");

  return json({
    ok: true,
    user,
    item_query: itemQuery,
    tracker: tracker ? {
      id: tracker.id || null,
      discord_user_id: tracker.discord_user_id || null,
      discord_username: tracker.discord_username || null,
      roblox_user_id: tracker.roblox_user_id || null,
      roblox_username: tracker.roblox_username || null,
      enabled: Boolean(tracker.enabled),
      enabled_tiers: hatchTrackerEnabledTiers(tracker),
      authorized_at: tracker.authorized_at || null,
      authorization_expires_at: tracker.authorization_expires_at || null,
      last_checked_snapshot_id: tracker.last_checked_snapshot_id || null,
      last_checked_at: tracker.last_checked_at || null,
      last_alert_snapshot_id: tracker.last_alert_snapshot_id || null,
      last_alert_at: tracker.last_alert_at || null,
      last_scan_attempt_at: tracker?.metadata?.htg_v2?.last_attempt_at || null,
      last_scan_error_at: tracker?.metadata?.htg_v2?.last_error_at || null,
      last_scan_error: tracker?.metadata?.htg_v2?.last_error || null,
      last_scan_reason: tracker?.metadata?.htg_v2?.last_reason || null,
      last_source_fetched_at: tracker?.metadata?.htg_v2?.source?.fetched_at || null,
      last_source_is_stale: tracker?.metadata?.htg_v2?.source?.is_stale ?? null,
      refresh_quota: tracker?.metadata?.htg_v2?.refresh_quota || null,
      consecutive_scan_failures: Number(tracker?.metadata?.htg_v2?.consecutive_failures || 0),
      latest_snapshot_unchecked: uncheckedLatest,
      scheduler: htgV2ScheduleDecision(env, tracker, user.user_id, new Date(), { ignoreShard: true }),
      pending_gain: htgV2State(tracker).pending,
      active_scan: null,
      observed_usage_last_24h: htgRecentScanUsage(htgV2State(tracker).scan_history, new Date()),
      pull_ledger: htgV2State(tracker).scan_history,
      htg_v2: htgV2StateSummary(tracker)
    } : null,
    tracker_status: trackerStatus,
    grant_identity: grantIdentity,
    latest_snapshot: latest ? lightSnapshot(latest) : null,
    snapshot_count: snapshots.length,
    item_timeline: itemTimeline,
    recent_diffs: recentDiffs,
    htg_state_rows: htgStateRows.map(row => row.error ? row : compactHtgStateRow(row)),
    source_filter_config: {
      enabled: envBool(env.HATCH_SOURCE_FILTER_ENABLED, true),
      required: htgRequireSourceFilter(env),
      hold_minutes: htgSourceFilterHoldMinutes(env),
      confirmation_observations: 2,
      confirmation_policy: "one later fresh inventory revision",
      durable_pending: true
    },
    alert_rows: alertRows,
    enabled_guild_configs: guildConfigs.map(config => ({
      guild_id: config.guild_id || null,
      channel_id: config.channel_id || null,
      enabled: config.enabled ?? null,
      updated_at: config.updated_at || null,
      error: config.error || null
    }))
  });
}

async function createHatchOAuthStartForDiscord(env, identity) {
  const response = await handleHatchOAuthStart(new Request("https://inventory.local/api/hatch/oauth/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(identity || {})
  }), env);
  return response.json();
}

async function maybeUpsertHatchTrackerUserFromOAuth(env, pending, details) {
  const metadata = pending?.metadata && typeof pending.metadata === "object" ? pending.metadata : {};
  if (metadata.purpose !== "hatch_tracker") return;
  const discordUserId = String(metadata.discord_user_id || "").trim();
  const guildId = requiredDiscordSnowflake(metadata.guild_id, "guild_id");
  if (!discordUserId) return;
  const pendingTracker = await fetchPendingHatchTrackerByDiscordUser(env, discordUserId);
  const existing = await fetchHatchTrackerByDiscordRobloxUser(env, discordUserId, details.userId, { includeDisabled: true });
  const metadataTiers = Array.isArray(metadata.enabled_tiers)
    ? metadata.enabled_tiers.map(normalizeHatchTierValue).filter(tier => tier && tier !== "all")
    : [];
  const tiers = metadataTiers.length
    ? metadataTiers
    : hatchTrackerEnabledTiersForGuild(existing, guildId).length
      ? hatchTrackerEnabledTiersForGuild(existing, guildId)
      : hatchTrackerEnabledTiersForGuild(pendingTracker, guildId);
  const subscriptionEnabled = metadata.enable_after_auth === true
    || hatchTrackerHasEnabledGuildSubscription(existing, guildId)
    || hatchTrackerHasEnabledGuildSubscription(pendingTracker, guildId);
  const now = new Date().toISOString();
  const scopedMetadata = hatchTrackerMetadataWithGuildSubscription(
    existing?.metadata || pendingTracker?.metadata || metadata,
    guildId,
    tiers,
    subscriptionEnabled
  );
  const trackerEnabled = hatchTrackerHasEnabledGuildSubscription({ metadata: scopedMetadata });
  const row = {
    tracker_key: hatchTrackerKey(discordUserId, details.userId),
    discord_user_id: discordUserId,
    discord_username: firstString(metadata.discord_username, existing?.discord_username) || null,
    roblox_user_id: Number(details.userId),
    roblox_username: firstString(details.username, existing?.roblox_username, details.userId) || null,
    enabled: trackerEnabled,
    authorized_at: details.authorizedAt.toISOString(),
    authorization_expires_at: details.expiresAt,
    disabled_at: trackerEnabled ? null : existing?.disabled_at || pendingTracker?.disabled_at || null,
    updated_at: now,
    metadata: hatchTrackerMetadataWithHtgV2Reset(
      scopedMetadata,
      "HTG v2 baseline reset after Big Games authorization changed."
    )
  };

  if (existing?.id || existing?.tracker_key || existing?.roblox_user_id) {
    await updateHatchTrackerRow(env, existing, row);
  } else if (pendingTracker?.id || pendingTracker?.tracker_key || pendingTracker?.discord_user_id) {
    await updateHatchTrackerRow(env, pendingTracker, row);
  } else {
    await supabaseInsert(env, HATCH_TRACKER_USERS_TABLE, [row], "minimal");
  }

  if (existing && pendingTracker?.id && existing.id !== pendingTracker.id) {
    await supabaseDelete(env, HATCH_TRACKER_USERS_TABLE, { id: `eq.${pendingTracker.id}` }).catch(() => {});
  }
}

async function hatchTrackerStatus(env, discordUserId) {
  const rows = await fetchHatchTrackersByDiscordUser(env, discordUserId);
  const pending = rows.find(row => !row.roblox_user_id) || null;
  const accountRows = rows.filter(row => row.roblox_user_id);
  const accounts = await Promise.all(accountRows.map(async row => {
    const access = await oauthStatus(env, row.roblox_user_id, "hatch_tracker");
    return {
      id: row.id || null,
      discord_user_id: discordUserId,
      discord_username: row.discord_username || null,
      roblox_user_id: row.roblox_user_id || null,
      roblox_username: row.roblox_username || null,
      enabled: hatchTrackerHasEnabledGuildSubscription(row),
      enabled_tiers: hatchTrackerEnabledTiers(row),
      alert_guild_ids: hatchTrackerAlertGuildIds(row),
      guild_subscriptions: hatchTrackerGuildSubscriptions(row),
      connected: Boolean(access.connected),
      authorization_missing: Boolean(access.authorization_missing),
      reauthorization_required: Boolean(access.reauthorization_required),
      missing_scopes: access.missing_scopes || [],
      authorization_message: access.message || null,
      authorized_at: row.authorized_at || access.authorized_at || null,
      authorization_expires_at: row.authorization_expires_at || access.expires_at || null,
      last_checked_at: row.last_checked_at || null,
      last_alert_at: row.last_alert_at || null,
      last_scan_attempt_at: row?.metadata?.htg_v2?.last_attempt_at || null,
      last_scan_error_at: row?.metadata?.htg_v2?.last_error_at || null,
      last_scan_error: row?.metadata?.htg_v2?.last_error || null,
      consecutive_scan_failures: Number(row?.metadata?.htg_v2?.consecutive_failures || 0),
      htg_v2: htgV2StateSummary(row)
    };
  }));
  const primary = accounts.find(account => account.enabled && account.connected)
    || accounts.find(account => account.connected)
    || accounts[0]
    || null;
  const enabledTierSet = new Set();
  for (const account of accounts) {
    for (const tier of account.enabled_tiers || []) enabledTierSet.add(tier);
  }
  const alertGuildSet = new Set();
  for (const account of accounts) {
    for (const guildId of account.alert_guild_ids || []) alertGuildSet.add(guildId);
  }

  return {
    discord_user_id: discordUserId,
    discord_username: primary?.discord_username || pending?.discord_username || null,
    roblox_user_id: primary?.roblox_user_id || null,
    roblox_username: primary?.roblox_username || null,
    enabled: accounts.some(account => account.enabled),
    enabled_tiers: [...enabledTierSet],
    alert_guild_ids: [...alertGuildSet],
    connected: accounts.some(account => account.connected),
    authorized_at: primary?.authorized_at || null,
    authorization_expires_at: primary?.authorization_expires_at || null,
    last_checked_at: primary?.last_checked_at || null,
    last_alert_at: primary?.last_alert_at || null,
    last_scan_attempt_at: primary?.last_scan_attempt_at || null,
    last_scan_error_at: primary?.last_scan_error_at || null,
    last_scan_error: primary?.last_scan_error || null,
    consecutive_scan_failures: primary?.consecutive_scan_failures || 0,
    account_count: accounts.length,
    connected_account_count: accounts.filter(account => account.connected).length,
    enabled_account_count: accounts.filter(account => account.enabled).length,
    pending_auth: Boolean(pending),
    accounts
  };
}

async function fetchHatchTrackersByDiscordUser(env, discordUserId) {
  return supabaseSelect(env, HATCH_TRACKER_USERS_TABLE, {
    select: "*",
    discord_user_id: `eq.${discordUserId}`,
    order: "roblox_user_id.asc.nullsfirst,updated_at.desc",
    limit: "100"
  });
}

async function fetchPendingHatchTrackerByDiscordUser(env, discordUserId) {
  const rows = await supabaseSelect(env, HATCH_TRACKER_USERS_TABLE, {
    select: "*",
    discord_user_id: `eq.${discordUserId}`,
    roblox_user_id: "is.null",
    limit: "1"
  });
  return rows[0] || null;
}

async function fetchHatchTrackerByRobloxUser(env, userId, options = {}) {
  const rows = await supabaseSelect(env, HATCH_TRACKER_USERS_TABLE, {
    select: "*",
    roblox_user_id: `eq.${userId}`,
    ...(options.includeDisabled ? {} : { enabled: "eq.true" }),
    limit: "1"
  });
  return rows[0] || null;
}

async function fetchHatchTrackerByDiscordRobloxUser(env, discordUserId, userId, options = {}) {
  const rows = await supabaseSelect(env, HATCH_TRACKER_USERS_TABLE, {
    select: "*",
    discord_user_id: `eq.${discordUserId}`,
    roblox_user_id: `eq.${userId}`,
    ...(options.includeDisabled ? {} : { enabled: "eq.true" }),
    limit: "1"
  });
  return rows[0] || null;
}

async function fetchEnabledHatchTrackers(env) {
  requireSupabase(env);
  const rows = await supabaseSelectAll(env, HATCH_TRACKER_USERS_TABLE, {
    select: "*",
    enabled: "eq.true",
    roblox_user_id: "not.is.null",
    order: "last_checked_at.asc.nullsfirst,updated_at.asc"
  }, 10000);
  return rows.filter(row => hatchTrackerHasEnabledGuildSubscription(row));
}

function hatchTrackerUser(tracker) {
  const userId = String(tracker?.roblox_user_id || "").trim();
  return {
    user_id: userId,
    username: firstString(tracker?.roblox_username, userId),
    inventory_enabled: false,
    htg_oauth: true
  };
}

function compactHatchTrackerHealth(trackers, env, now = new Date()) {
  const rows = Array.isArray(trackers) ? trackers : [];
  const enabledAccountIds = new Set(rows
    .map(row => String(row?.roblox_user_id || "").trim())
    .filter(Boolean));
  const checkedTimes = rows
    .map(row => new Date(row?.metadata?.htg_v2?.last_checked_at || row?.last_checked_at || 0).getTime())
    .filter(value => Number.isFinite(value) && value > 0);
  const attemptTimes = rows
    .map(row => new Date(row?.metadata?.htg_v2?.last_attempt_at || 0).getTime())
    .filter(value => Number.isFinite(value) && value > 0);
  const recentUsage = rows.map(row => htgRecentScanUsage(htgV2State(row).scan_history, now));
  const failedTrackerErrors = new Map();
  for (const row of rows) {
    const error = firstString(row?.metadata?.htg_v2?.last_error);
    if (!error) continue;
    const category = htgScanErrorCategory(error);
    failedTrackerErrors.set(category, (failedTrackerErrors.get(category) || 0) + 1);
  }
  return {
    enabled_tracker_count: rows.length,
    enabled_account_count: enabledAccountIds.size,
    shared_account_subscription_count: Math.max(0, rows.length - enabledAccountIds.size),
    pending_gain_count: rows.filter(row => htgV2State(row).pending?.active === true).length,
    failed_tracker_count: rows.filter(row => firstString(row?.metadata?.htg_v2?.last_error)).length,
    failed_tracker_errors: Object.fromEntries([...failedTrackerErrors.entries()].sort((a, b) => b[1] - a[1])),
    overdue_tracker_count: rows.filter(row => {
      const checkedAt = new Date(row?.metadata?.htg_v2?.last_checked_at || row?.last_checked_at || 0).getTime();
      const overdueMs = Math.max(5, htgV2ScheduleDecision(env, row, row?.roblox_user_id, now, { ignoreShard: true }).interval_minutes || htgScanIntervalMinutes(env)) * 2 * 60000;
      return !Number.isFinite(checkedAt) || checkedAt <= 0 || now.getTime() - checkedAt > overdueMs;
    }).length,
    quota_paused_tracker_count: rows.filter(row => htgV2State(row).source?.refresh_fallback_used === true).length,
    oldest_last_checked_at: checkedTimes.length ? new Date(Math.min(...checkedTimes)).toISOString() : null,
    oldest_last_scan_attempt_at: attemptTimes.length ? new Date(Math.min(...attemptTimes)).toISOString() : null,
    observed_inventory_attempts_24h: recentUsage.reduce((sum, row) => sum + row.inventory_attempts, 0),
    observed_forced_refresh_requests_24h: recentUsage.reduce((sum, row) => sum + row.forced_refresh_requests, 0),
    observed_provider_refresh_units_24h: recentUsage.reduce((sum, row) => sum + row.provider_refresh_units, 0),
    observed_source_verification_requests_24h: recentUsage.reduce((sum, row) => sum + row.source_verification_requests, 0),
    observed_rate_limited_attempts_24h: recentUsage.reduce((sum, row) => sum + row.rate_limited_attempts, 0),
    observed_alert_posts_24h: recentUsage.reduce((sum, row) => sum + row.alert_posts, 0)
  };
}

// Read-only forensic history for HTG alert investigations. This deliberately
// reads saved Supabase snapshots only: it never calls BIG Games or consumes a
// provider refresh. "First observed" means first present in the retained
// snapshot window, not necessarily the moment the player acquired the pet.
async function handleHtgObservationHistory(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = await resolveRequestUser(env, url);
  const snapshotLimit = Math.max(2, Math.min(192, Number(url.searchParams.get("limit") || 96)));
  const snapshots = sortAsc(await getUserSnapshots(env, user.user_id, snapshotLimit));
  const snapshotItems = await getHtgItemsForSnapshots(env, snapshots.map(snapshot => snapshot.id));
  const history = buildHtgObservationHistory(snapshots, snapshotItems);
  const tracker = await fetchHatchTrackerByRobloxUser(env, user.user_id, { includeDisabled: true });

  return json({
    ok: true,
    read_only: true,
    user,
    history_window: {
      snapshots_considered: snapshots.length,
      earliest_snapshot_at: snapshots[0]?.captured_at || null,
      latest_snapshot_at: snapshots[snapshots.length - 1]?.captured_at || null,
      note: "First observed means first seen inside these retained saved snapshots. An item present in the first snapshot may have been acquired earlier."
    },
    tracker: tracker ? {
      enabled: tracker.enabled === true,
      last_checked_at: tracker.last_checked_at || null,
      last_alert_at: tracker.last_alert_at || null,
      last_scan_reason: tracker?.metadata?.htg_v2?.last_reason || null,
      pending_gain: htgV2State(tracker).pending || null,
      htg_v2: htgV2StateSummary(tracker)
    } : null,
    htg_items: history.items,
    observed_gains: history.gains,
    observation_gaps: history.gaps
  });
}

async function getHtgItemsForSnapshots(env, snapshotIds) {
  const ids = [...new Set((snapshotIds || []).map(value => String(value || "").trim()).filter(Boolean))];
  if (!ids.length) return [];

  // Keep URLs comfortably below normal proxy limits while querying only rows
  // that can plausibly be an HTG. The client-side hatchTier check below is the
  // final authority, so a false positive here is harmless.
  const chunks = [];
  for (let index = 0; index < ids.length; index += 48) chunks.push(ids.slice(index, index + 48));
  const resultSets = await Promise.all(chunks.map(async chunk => {
    const snapshotFilter = chunk.map(value => value.replace(/[^a-zA-Z0-9_-]/g, "")).filter(Boolean).join(",");
    if (!snapshotFilter) return [];
    return supabaseSelectAll(env, ITEM_TABLE, {
      // item_category is deliberately derived from raw below. Older deployed
      // inventory schemas never stored it as a physical database column.
      select: "snapshot_id,item_key,item_class,item_id,display_name,variant,count,rap,raw",
      snapshot_id: `in.(${snapshotFilter})`,
      or: "(display_name.ilike.*Huge*,display_name.ilike.*Titanic*,display_name.ilike.*Gargantuan*,item_id.ilike.*Huge*,item_id.ilike.*Titanic*,item_id.ilike.*Gargantuan*)",
      order: "snapshot_id.asc,id.asc"
    }, 10000);
  }));
  return resultSets.flat().map(normalizeStoredItem).filter(item => Boolean(hatchTier(item)));
}

function htgObservationItemKey(item) {
  const tier = hatchTier(item);
  const itemKey = String(item?.item_key || item?.item_id || item?.display_name || "unknown").trim().toLowerCase();
  const variant = String(item?.variant || "Normal").trim().toLowerCase();
  return `${tier}|${itemKey}|${variant}`;
}

function buildHtgObservationHistory(snapshots, rawItems) {
  const bySnapshot = new Map();
  for (const item of rawItems || []) {
    const snapshotId = String(item?.snapshot_id || "").trim();
    if (!snapshotId) continue;
    const key = htgObservationItemKey(item);
    const existing = bySnapshot.get(snapshotId) || new Map();
    const prior = existing.get(key);
    existing.set(key, {
      ...(prior || item),
      count: Math.max(0, Number(prior?.count || 0)) + Math.max(0, Number(item?.count || 0))
    });
    bySnapshot.set(snapshotId, existing);
  }

  const known = new Map();
  const gains = [];
  const gaps = [];
  let previous = new Map();

  for (let index = 0; index < (snapshots || []).length; index += 1) {
    const snapshot = snapshots[index];
    const current = bySnapshot.get(String(snapshot?.id || "")) || new Map();
    for (const [key, item] of current) {
      const before = Number(previous.get(key)?.count || 0);
      const after = Number(item?.count || 0);
      const record = known.get(key) || {
        key,
        tier: hatchTier(item),
        display_name: item.display_name || item.item_id || "Unknown HTG",
        variant: item.variant || "Normal",
        first_seen_at: snapshot.captured_at || null,
        first_seen_at_history_start: index === 0,
        max_count: after
      };
      record.last_seen_at = snapshot.captured_at || null;
      record.current_count = after;
      record.max_count = Math.max(Number(record.max_count || 0), after);
      known.set(key, record);

      if (index > 0 && after > before) {
        gains.push({
          observed_at: snapshot.captured_at || null,
          snapshot_id: snapshot.id || null,
          tier: record.tier,
          display_name: record.display_name,
          variant: record.variant,
          previous_count: before,
          current_count: after,
          delta: after - before,
          first_seen_in_saved_history: before === 0
        });
      }
    }
    for (const [key, prior] of previous) {
      if (!current.has(key)) {
        gaps.push({
          observed_at: snapshot.captured_at || null,
          snapshot_id: snapshot.id || null,
          tier: hatchTier(prior),
          display_name: prior.display_name || prior.item_id || "Unknown HTG",
          variant: prior.variant || "Normal",
          previous_count: Number(prior.count || 0),
          current_count: 0,
          kind: "no_longer_present"
        });
      }
    }
    previous = current;
  }

  const items = [...known.values()]
    .map(item => ({
      ...item,
      first_seen_status: item.first_seen_at_history_start
        ? "already_present_at_start_of_retained_history"
        : "first_observed_in_saved_history"
    }))
    .sort((a, b) =>
      (HATCH_TIER_PRIORITY[b.tier] || 0) - (HATCH_TIER_PRIORITY[a.tier] || 0) ||
      String(a.display_name).localeCompare(String(b.display_name)) ||
      String(a.variant).localeCompare(String(b.variant))
    );
  return { items, gains, gaps };
}

function htgScanErrorCategory(error) {
  const text = String(error || "").toLowerCase();
  if (/quota|rate.?limit|too many requests|429/.test(text)) return "provider_refresh_quota";
  if (/authoriz|oauth|token|grant/.test(text)) return "authorization";
  if (/permission|scope|forbidden|403/.test(text)) return "permission";
  if (/no verified owned|item array|inventory payload/.test(text)) return "inventory_shape";
  if (/discord|webhook|channel|missing access|unknown channel|50001|50013|10003/.test(text)) return "discord_delivery";
  if (/trade|booth|mail|source verification/.test(text)) return "source_verification";
  if (/supabase|postgres|postgrest|relation|database/.test(text)) return "database";
  if (/non-json|upstream|player api|fetch failed|502|1042/.test(text)) return "provider_upstream";
  return "other";
}

async function mapSettledWithConcurrency(values, concurrency, worker) {
  const rows = Array.isArray(values) ? values : [];
  const results = new Array(rows.length);
  const limit = Math.max(1, Math.min(rows.length || 1, Math.floor(Number(concurrency || 1))));
  let nextIndex = 0;

  await Promise.all(Array.from({ length: limit }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= rows.length) return;
      try {
        results[index] = { status: "fulfilled", value: await worker(rows[index], index) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }));
  return results;
}

function htgScanHistoryLimit(env) {
  const value = Number(env?.HTG_SCAN_HISTORY_LIMIT || DEFAULT_HTG_SCAN_HISTORY_LIMIT);
  return Number.isFinite(value) ? Math.max(24, Math.min(192, Math.floor(value))) : DEFAULT_HTG_SCAN_HISTORY_LIMIT;
}

function htgScanHistory(trackerOrMetadata) {
  const metadata = trackerOrMetadata?.metadata || trackerOrMetadata || {};
  // v2 is the authoritative HTG state. Retain the legacy fallback solely so
  // older diagnostic records remain readable during the rollout.
  const rows = metadata?.htg_v2?.scan_history || metadata?.htg_state?.scan_history;
  return Array.isArray(rows) ? rows.filter(row => row && typeof row === "object") : [];
}

function htgRecentScanUsage(history, now = new Date()) {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  const rows = (history || []).filter(row => {
    const time = new Date(row?.completed_at || row?.started_at || 0).getTime();
    return Number.isFinite(time) && time >= cutoff;
  });
  return {
    ledger_entries: rows.length,
    inventory_attempts: rows.filter(row => row.inventory_request_attempted === true).length,
    forced_refresh_requests: rows.filter(row => row.forced_refresh_requested === true).length,
    provider_refresh_units: rows.reduce((sum, row) => sum + Math.max(0, Number(row.provider_refresh_units_observed || 0)), 0),
    source_verification_requests: rows.reduce((sum, row) => sum + Math.max(0, Number(row.source_verification_requests || 0)), 0),
    rate_limited_attempts: rows.filter(row => row.error_category === "provider_refresh_quota" || row.quota_exhausted === true).length,
    alert_posts: rows.reduce((sum, row) => sum + Math.max(0, Number(row.alerts_posted || 0)), 0),
    failures: rows.filter(row => row.outcome === "failed").length
  };
}

function htgOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hatchTrackerMetadataWithScanOutcome(env, metadata, statePatch = {}, eventPatch = {}) {
  const base = plainObject(metadata);
  const state = plainObject(base.htg_state);
  const active = plainObject(state.active_scan);
  const refresh = plainObject(eventPatch.refresh);
  const completedAt = firstString(eventPatch.completed_at, new Date().toISOString());
  const beforeUsed = htgOptionalNumber(active.refresh_used_before);
  const afterUsed = htgOptionalNumber(refresh.used);
  const sameResetWindow = !active.refresh_resets_at_before
    || !refresh.resetsAt
    || String(active.refresh_resets_at_before) === String(refresh.resetsAt);
  const observedUnits = beforeUsed !== null && afterUsed !== null && afterUsed >= beforeUsed && sameResetWindow
    ? afterUsed - beforeUsed
    : null;
  const sources = Array.isArray(eventPatch.sources) ? eventPatch.sources : [];
  const event = {
    started_at: firstString(active.started_at, eventPatch.started_at, completedAt),
    completed_at: completedAt,
    trigger_source: firstString(active.trigger_source, eventPatch.trigger_source, "schedule"),
    outcome: firstString(eventPatch.outcome, "completed"),
    reason: firstString(eventPatch.reason) || null,
    error: firstString(eventPatch.error) || null,
    error_category: firstString(eventPatch.error_category) || null,
    inventory_request_attempted: eventPatch.inventory_request_attempted !== false,
    forced_refresh_requested: active.forced_refresh_requested === true || eventPatch.forced_refresh_requested === true,
    source_fetched_at: eventPatch.source_fetched_at || null,
    source_is_stale: eventPatch.source_is_stale ?? null,
    refresh_used_before: beforeUsed,
    refresh_used_after: afterUsed,
    refresh_limit: htgOptionalNumber(refresh.limit),
    refresh_resets_at: refresh.resetsAt || null,
    provider_refresh_units_observed: observedUnits,
    quota_exhausted: refresh.quotaExhausted === true,
    refresh_fallback_used: eventPatch.refresh_fallback_used === true,
    source_verification_requests: sources.length,
    source_verification_failures: sources.filter(row => row?.ok === false).length,
    candidate_count: Math.max(0, Number(eventPatch.candidate_count || 0)),
    alerts_posted: Math.max(0, Number(eventPatch.alerts_posted || 0))
  };
  const history = [event, ...htgScanHistory(base)].slice(0, htgScanHistoryLimit(env));
  return hatchTrackerMetadataWithHtgState(base, {
    ...(statePatch || {}),
    active_scan: null,
    scan_history: history,
    last_scan_outcome: event.outcome,
    last_scan_completed_at: completedAt
  });
}

async function markHtgScanFailed(env, tracker, error, attemptedAt = new Date()) {
  const attemptedIso = attemptedAt instanceof Date ? attemptedAt.toISOString() : new Date(attemptedAt).toISOString();
  const previousState = plainObject(tracker?.metadata?.htg_state);
  const errorText = String(error?.message || error || "Unknown HTG scan error").slice(0, 1000);
  const errorCategory = htgScanErrorCategory(errorText);
  const metadata = hatchTrackerMetadataWithScanOutcome(env, tracker?.metadata, {
    last_scan_attempt_at: attemptedIso,
    last_scan_error_at: attemptedIso,
    last_scan_error: errorText,
    consecutive_scan_failures: Math.max(0, Number(previousState.consecutive_scan_failures || 0)) + 1
  }, {
    completed_at: attemptedIso,
    outcome: "failed",
    error: errorText,
    error_category: errorCategory,
    inventory_request_attempted: errorCategory !== "authorization" && errorCategory !== "permission"
  });
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    metadata,
    updated_at: attemptedIso
  });
  return metadata;
}

async function markHtgScanStarted(env, tracker, attemptedAt = new Date(), schedule = {}) {
  const attemptedIso = attemptedAt instanceof Date ? attemptedAt.toISOString() : new Date(attemptedAt).toISOString();
  const quota = htgTrackerQuotaSchedule(tracker, new Date(attemptedIso), env);
  const metadata = hatchTrackerMetadataWithHtgState(tracker?.metadata, {
    last_scan_attempt_at: attemptedIso,
    last_scan_reason: firstString(schedule?.reason, "HTG inventory scan started."),
    active_scan_shard: Number.isFinite(Number(schedule?.current_shard)) ? Number(schedule.current_shard) : null,
    active_scan: {
      started_at: attemptedIso,
      trigger_source: firstString(schedule?.trigger_source, "schedule"),
      forced_refresh_requested: schedule?.force_refresh_requested === true,
      refresh_used_before: quota.used,
      refresh_limit_before: quota.limit,
      refresh_resets_at_before: quota.resets_at || null
    }
  });
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    metadata,
    updated_at: attemptedIso
  });
  return metadata;
}

async function savePendingHatchTracker(env, { existing, discordUserId, discordUsername, enabled, tiers, alertGuildId }) {
  const now = new Date().toISOString();
  const metadata = hatchTrackerMetadataWithGuildSubscription(
    existing?.metadata,
    alertGuildId,
    tiers,
    enabled === true
  );
  const trackerEnabled = hatchTrackerHasEnabledGuildSubscription({ metadata });
  const row = {
    tracker_key: existing?.tracker_key || hatchTrackerKey(discordUserId, null),
    discord_user_id: discordUserId,
    discord_username: discordUsername || existing?.discord_username || null,
    roblox_user_id: null,
    roblox_username: null,
    enabled: trackerEnabled,
    last_enabled_at: trackerEnabled ? now : existing?.last_enabled_at || null,
    disabled_at: trackerEnabled ? null : existing?.disabled_at || null,
    updated_at: now,
    metadata
  };

  if (existing?.id) {
    await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, { id: `eq.${existing.id}` }, row);
    return;
  }

  await supabaseInsert(env, HATCH_TRACKER_USERS_TABLE, [row], "minimal");
}

async function updateHatchTrackerRow(env, row, patch) {
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(row), patch);
}

function hatchTrackerRowFilter(row) {
  if (row?.id) return { id: `eq.${row.id}` };
  if (row?.tracker_key) return { tracker_key: `eq.${row.tracker_key}` };
  if (row?.roblox_user_id) return { roblox_user_id: `eq.${row.roblox_user_id}` };
  return { discord_user_id: `eq.${row?.discord_user_id || ""}` };
}

function hatchTrackerKey(discordUserId, robloxUserId) {
  const discord = String(discordUserId || "").trim();
  const roblox = String(robloxUserId || "").trim();
  return roblox ? `discord:${discord}:roblox:${roblox}` : `discord:${discord}:pending`;
}

async function fetchHatchGuildConfig(env, guildId) {
  const rows = await supabaseSelect(env, HATCH_GUILD_CONFIG_TABLE, {
    select: "*",
    guild_id: `eq.${guildId}`,
    limit: "1"
  });
  return rows[0] || null;
}

async function fetchEnabledHatchGuildConfigs(env) {
  return supabaseSelectAll(env, HATCH_GUILD_CONFIG_TABLE, {
    select: "*",
    enabled: "eq.true",
    order: "updated_at.desc"
  }, 250);
}

function normalizeHatchTierSelection(value) {
  const normalized = normalizeHatchTierValue(value || "all");
  if (!normalized || normalized === "all") return "all";
  if (HATCH_TRACKER_TIERS.includes(normalized)) return normalized;
  throw httpError(400, "tier must be huge, titanic, gargantuan, or all.");
}

function normalizeHatchAccountSelector(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(all|alts|accounts|everyone)$/i.test(raw)) return "all";
  return raw;
}

async function resolveHatchOAuthTargetAccount(value, env) {
  const raw = normalizeRobloxLookupInput(value);
  if (!raw || normalizeHatchAccountSelector(raw) === "all") return null;

  const forcedId = robloxIdLookupInput(raw);
  if (forcedId) return resolveRobloxUserIdAccount(forcedId);

  const exact = await resolveRobloxUsernameExact(raw).catch(error => {
    console.warn("Roblox exact username lookup failed", error?.message || error);
    return null;
  });
  if (exact?.user_id) return exact;

  if (/^\d+$/.test(raw)) return resolveRobloxUserIdAccount(raw);

  const local = await resolveKnownRobloxAccount(env, raw).catch(error => {
    if (error?.status && error.status < 500) throw error;
    console.warn("Local Roblox account lookup failed", error?.message || error);
    return null;
  });
  if (local?.user_id) return local;

  const searched = await searchRobloxAccounts(raw).catch(error => {
    console.warn("Roblox username search failed", error?.message || error);
    return [];
  });
  const picked = pickRobloxSearchAccount(raw, searched);
  if (picked.account?.user_id) return picked.account;
  if (picked.suggestions.length) {
    throw httpError(400, `Roblox account "${raw}" matched multiple users. Try one of these exact usernames: ${picked.suggestions.join(", ")}.`);
  }

  throw httpError(400, `Roblox account "${raw}" could not be resolved. Check the spelling and use their exact Roblox @username.`);
}

async function resolveRobloxUserIdAccount(userId) {
  const username = await fetchRobloxUsernameById(userId).catch(() => "");
  return {
    user_id: String(userId),
    username: username || String(userId)
  };
}

async function resolveRobloxUsernameExact(raw) {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "c0ld-Luna-HTG-Worker"
    },
    body: JSON.stringify({ usernames: [raw], excludeBannedUsers: false })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(res.status || 502, `Roblox username lookup failed (${res.status}).`);
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const row = rows.find(item => normalizeRobloxNameKey(item?.name) === normalizeRobloxNameKey(raw)) || rows[0];
  if (!row?.id) return null;
  return {
    user_id: String(row.id),
    username: firstString(row.name, row.requestedUsername, raw)
  };
}

async function searchRobloxAccounts(raw) {
  const url = new URL("https://users.roblox.com/v1/users/search");
  url.searchParams.set("keyword", raw);
  url.searchParams.set("limit", "10");
  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "user-agent": "c0ld-Luna-HTG-Worker"
    }
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(res.status || 502, `Roblox username search failed (${res.status}).`);
  return Array.isArray(payload.data) ? payload.data : [];
}

function pickRobloxSearchAccount(raw, rows) {
  const inputKey = normalizeRobloxNameKey(raw);
  const normalized = (rows || [])
    .map(row => ({
      user_id: String(row?.id || "").trim(),
      username: firstString(row?.name),
      display_name: firstString(row?.displayName)
    }))
    .filter(row => /^\d+$/.test(row.user_id) && row.username);

  const exactUsername = normalized.find(row => normalizeRobloxNameKey(row.username) === inputKey);
  if (exactUsername) return { account: { user_id: exactUsername.user_id, username: exactUsername.username }, suggestions: [] };

  const exactDisplay = uniqueAccounts(normalized.filter(row => normalizeRobloxNameKey(row.display_name) === inputKey));
  if (exactDisplay.length === 1) return { account: { user_id: exactDisplay[0].user_id, username: exactDisplay[0].username }, suggestions: [] };

  return {
    account: null,
    suggestions: uniqueAccounts(exactDisplay.length ? exactDisplay : normalized)
      .slice(0, 5)
      .map(row => `@${row.username}`)
  };
}

async function resolveKnownRobloxAccount(env, raw) {
  if (!supabaseUrl(env)) return null;
  const specs = [
    {
      table: HATCH_TRACKER_USERS_TABLE,
      select: "roblox_user_id,roblox_username,discord_username,updated_at",
      fields: ["roblox_username", "discord_username"],
      order: "updated_at.desc",
      idKey: "roblox_user_id",
      usernameKeys: ["roblox_username"]
    },
    {
      table: SNAPSHOT_TABLE,
      select: "roblox_user_id,roblox_username,captured_at",
      fields: ["roblox_username"],
      order: "captured_at.desc",
      idKey: "roblox_user_id",
      usernameKeys: ["roblox_username"]
    },
    {
      table: "c0ld_global_ranks_current",
      select: "user_id,username,display_name,updated_at",
      fields: ["username", "display_name"],
      order: "updated_at.desc",
      idKey: "user_id",
      usernameKeys: ["username", "display_name"]
    },
    {
      table: "c0ld_global_rank_history",
      select: "user_id,username,display_name,fetched_at",
      fields: ["username", "display_name"],
      order: "fetched_at.desc",
      idKey: "user_id",
      usernameKeys: ["username", "display_name"]
    },
    {
      table: "ps99_league_current",
      select: "user_id,display_name,updated_at",
      fields: ["display_name"],
      order: "updated_at.desc",
      idKey: "user_id",
      usernameKeys: ["display_name"]
    }
  ];

  const candidates = [];
  for (const spec of specs) {
    const rows = await queryKnownRobloxAccountTable(env, spec, raw);
    candidates.push(...rows.map(row => accountCandidateFromRow(row, spec)));
  }

  const inputKey = normalizeRobloxNameKey(raw);
  const exact = uniqueAccountSuggestions(candidates)
    .filter(row => /^\d+$/.test(row.user_id) && row.username && row.matchKeys.includes(inputKey));
  if (exact.length === 1) return { user_id: exact[0].user_id, username: exact[0].username };
  if (exact.length > 1) {
    throw httpError(400, `Roblox account "${raw}" matched multiple known users. Try one of these exact usernames: ${exact.slice(0, 5).map(row => `@${row.username}`).join(", ")}.`);
  }
  return null;
}

async function queryKnownRobloxAccountTable(env, spec, raw) {
  const safe = raw.replace(/[(),]/g, "").trim();
  if (!safe) return [];
  const params = {
    select: spec.select,
    limit: "10"
  };
  if (spec.order) params.order = spec.order;
  params.or = `(${spec.fields.map(field => `${field}.ilike.${safe}`).join(",")})`;
  try {
    return await supabaseSelect(env, spec.table, params);
  } catch (error) {
    if (/does not exist|schema cache|PGRST/i.test(error?.message || "")) return [];
    throw error;
  }
}

function accountCandidateFromRow(row, spec) {
  const username = firstString(...spec.usernameKeys.map(key => row?.[key]));
  return {
    user_id: String(row?.[spec.idKey] || "").trim(),
    username,
    matchKeys: spec.usernameKeys.map(key => normalizeRobloxNameKey(row?.[key])).filter(Boolean)
  };
}

function uniqueAccounts(rows) {
  const seen = new Set();
  const output = [];
  for (const row of rows || []) {
    const id = String(row?.user_id || "").trim();
    if (!/^\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    output.push(row);
  }
  return output;
}

function uniqueAccountSuggestions(rows) {
  const seen = new Set();
  const output = [];
  for (const row of uniqueAccounts(rows)) {
    const usernameKey = normalizeRobloxNameKey(row?.username);
    const key = usernameKey || String(row?.user_id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}

function normalizeRobloxLookupInput(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .trim();
}

function robloxIdLookupInput(value) {
  const match = String(value || "").trim().match(/^(?:id|user|userid|user_id):\s*(\d+)$/i);
  return match ? match[1] : "";
}

function normalizeRobloxNameKey(value) {
  return normalizeRobloxLookupInput(value).toLowerCase();
}

async function fetchRobloxUsernameById(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(userId)}`, {
    headers: { accept: "application/json", "user-agent": "c0ld-Luna-HTG-Worker" }
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.id) return "";
  return firstString(payload.name, payload.displayName);
}

function selectHatchTrackerRows(rows, selector) {
  const account = normalizeHatchAccountSelector(selector);
  const connectedRows = (rows || []).filter(row => row?.roblox_user_id);
  if (account === "all") return connectedRows;

  const key = normalizeHatchAccountKey(account);
  return connectedRows.filter(row =>
    String(row.roblox_user_id || "").trim() === account ||
    normalizeHatchAccountKey(row.roblox_username) === key ||
    normalizeHatchAccountKey(row.discord_username) === key
  );
}

function normalizeHatchAccountKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function hatchTrackerRowLabel(row) {
  const name = firstString(row?.roblox_username, row?.roblox_user_id, "that account");
  return row?.roblox_user_id ? `${name} (${row.roblox_user_id})` : name;
}

function hatchTrackerConfiguredTiers(row) {
  const configured = Array.isArray(row?.metadata?.enabled_tiers)
    ? row.metadata.enabled_tiers.map(normalizeHatchTierValue).filter(tier => tier && tier !== "all")
    : [];
  return configured.length ? [...new Set(configured)].filter(tier => HATCH_TRACKER_TIERS.includes(tier)) : [...HATCH_TRACKER_TIERS];
}

function hatchTrackerUnionEnabledTiers(rows) {
  const tiers = new Set();
  for (const row of rows || []) {
    for (const tier of hatchTrackerEnabledTiers(row)) tiers.add(tier);
  }
  return [...tiers];
}

function hatchTrackerUnionEnabledTiersForGuild(rows, guildId) {
  const tiers = new Set();
  for (const row of rows || []) {
    for (const tier of hatchTrackerEnabledTiersForGuild(row, guildId)) tiers.add(tier);
  }
  return [...tiers];
}

function hatchTrackerEnabledTiers(row) {
  return [...new Set(hatchTrackerGuildSubscriptions(row)
    .filter(subscription => subscription.enabled)
    .flatMap(subscription => subscription.tiers))];
}

function hatchTrackerEnabledTiersForGuild(row, guildId) {
  const subscription = hatchTrackerGuildSubscription(row, guildId);
  return subscription.enabled ? subscription.tiers : [];
}

function normalizeHatchTierValue(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized || normalized === "all") return normalized || "";
  if (normalized === "garg" || normalized === "gargantuan") return "gargantuan";
  return HATCH_TRACKER_TIERS.includes(normalized) ? normalized : "";
}

function mergeHatchTierSelection(currentTiers, selection) {
  if (selection === "all") return [...HATCH_TRACKER_TIERS];
  return [...new Set([...(currentTiers || []), selection])].filter(tier => HATCH_TRACKER_TIERS.includes(tier));
}

function removeHatchTierSelection(currentTiers, selection) {
  if (selection === "all") return [];
  const current = currentTiers?.length ? currentTiers : [];
  return current.filter(tier => tier !== selection);
}

function hatchTrackerMetadataWithTiers(metadata, tiers, options = {}) {
  const guildId = firstString(options.addAlertGuildId, ...(Array.isArray(options.alertGuildIds) ? options.alertGuildIds : []));
  if (!/^\d{10,24}$/.test(String(guildId || "").trim())) {
    return {
      ...plainObject(metadata),
      enabled_tiers: [...new Set(tiers || [])].filter(tier => HATCH_TRACKER_TIERS.includes(tier))
    };
  }
  return hatchTrackerMetadataWithGuildSubscription(metadata, guildId, tiers, true);
}

function hatchTrackerMetadataWithBaseline(metadata, baselinePatch) {
  const base = plainObject(metadata);
  const current = plainObject(base.hatch_baseline);
  const nextBaseline = {
    ...current,
    ...(baselinePatch || {}),
    updated_at: new Date().toISOString()
  };
  return { ...base, hatch_baseline: nextBaseline };
}

function hatchTrackerBaselineState(tracker) {
  const metadata = plainObject(tracker?.metadata);
  const baseline = plainObject(metadata.hatch_baseline);
  return {
    armed: baseline.armed === true,
    snapshot_id: firstString(baseline.snapshot_id),
    captured_at: firstString(baseline.captured_at),
    item_count: Number(baseline.item_count || 0),
    stable_comparisons: Math.max(0, Math.floor(Number(baseline.stable_comparisons || 0))),
    reset_reason: firstString(baseline.reset_reason),
    risk_reasons: Array.isArray(baseline.risk_reasons) ? baseline.risk_reasons : []
  };
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hatchTrackerGuildSubscriptions(value) {
  const metadata = value?.metadata && typeof value.metadata === "object" && !Array.isArray(value.metadata)
    ? value.metadata
    : value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  const rawSubscriptions = plainObject(metadata.guild_subscriptions);
  const deduped = new Map();
  for (const [rawGuildId, rawSubscription] of Object.entries(rawSubscriptions)) {
    const guildId = String(rawGuildId || "").trim();
    if (!/^\d{10,24}$/.test(guildId)) continue;
    const subscription = plainObject(rawSubscription);
    const tiers = [...new Set((Array.isArray(subscription.tiers) ? subscription.tiers : [])
      .map(normalizeHatchTierValue)
      .filter(tier => HATCH_TRACKER_TIERS.includes(tier)))];
    const consentVersion = Math.max(0, Math.floor(Number(subscription.consent_version || 0)));
    deduped.set(guildId, {
      guild_id: guildId,
      enabled: subscription.enabled === true
        && tiers.length > 0
        && consentVersion >= HTG_SUBSCRIPTION_CONSENT_VERSION,
      tiers,
      consent_version: consentVersion,
      updated_at: firstString(subscription.updated_at) || null
    });
  }
  return [...deduped.values()];
}

function hatchTrackerGuildSubscription(value, guildId) {
  const wanted = String(guildId || "").trim();
  return hatchTrackerGuildSubscriptions(value).find(subscription => subscription.guild_id === wanted)
    || { guild_id: wanted, enabled: false, tiers: [], updated_at: null };
}

function hatchTrackerHasEnabledGuildSubscription(value, guildId = null) {
  const wanted = guildId === null || guildId === undefined ? "" : String(guildId).trim();
  return hatchTrackerGuildSubscriptions(value).some(subscription =>
    subscription.enabled && (!wanted || subscription.guild_id === wanted)
  );
}

function hatchTrackerAlertGuildIds(value) {
  return hatchTrackerGuildSubscriptions(value)
    .filter(subscription => subscription.enabled)
    .map(subscription => subscription.guild_id);
}

function hatchAuthorizationExpiryNoticeState(value) {
  const metadata = plainObject(value?.metadata);
  const notice = plainObject(metadata.htg_authorization_expiry_notice);
  return {
    expires_at: firstString(notice.expires_at) || null,
    notified_guild_ids: [...new Set((Array.isArray(notice.notified_guild_ids) ? notice.notified_guild_ids : [])
      .map(guildId => String(guildId || "").trim())
      .filter(guildId => /^\d{10,24}$/.test(guildId)))],
    last_notified_at: firstString(notice.last_notified_at) || null
  };
}

function hatchAuthorizationHasExpired(tracker, now = new Date()) {
  const expiresAt = firstString(tracker?.authorization_expires_at);
  const expiresMs = new Date(expiresAt).getTime();
  return Boolean(expiresAt && Number.isFinite(expiresMs) && expiresMs <= now.getTime());
}

function hatchAuthorizationExpiryNoticeGuildIdsNeeded(tracker, now = new Date()) {
  if (!hatchAuthorizationHasExpired(tracker, now)) return [];
  const expiresAt = firstString(tracker?.authorization_expires_at);
  const notice = hatchAuthorizationExpiryNoticeState(tracker);
  const alreadyNotified = notice.expires_at === expiresAt ? new Set(notice.notified_guild_ids) : new Set();
  return hatchTrackerAlertGuildIds(tracker).filter(guildId => !alreadyNotified.has(guildId));
}

function hatchTrackerMetadataWithAuthorizationExpiryNotice(metadata, expiresAt, guildIds, notifiedAt = new Date().toISOString()) {
  const base = plainObject(metadata);
  const previous = hatchAuthorizationExpiryNoticeState({ metadata: base });
  const preserve = previous.expires_at === expiresAt ? previous.notified_guild_ids : [];
  const notifiedGuildIds = [...new Set([...preserve, ...(guildIds || [])]
    .map(guildId => String(guildId || "").trim())
    .filter(guildId => /^\d{10,24}$/.test(guildId)))];
  return {
    ...base,
    htg_authorization_expiry_notice: {
      expires_at: expiresAt,
      notified_guild_ids: notifiedGuildIds,
      last_notified_at: notifiedAt
    }
  };
}

function hatchTrackerGuildIdsForTier(value, tier) {
  const normalizedTier = normalizeHatchTierValue(tier);
  if (!normalizedTier) return [];
  return hatchTrackerGuildSubscriptions(value)
    .filter(subscription => subscription.enabled && subscription.tiers.includes(normalizedTier))
    .map(subscription => subscription.guild_id);
}

function hatchTrackerMetadataWithGuildSubscription(metadata, guildId, tiers, enabled) {
  const base = plainObject(metadata);
  const normalizedGuildId = String(guildId || "").trim();
  if (!/^\d{10,24}$/.test(normalizedGuildId)) {
    throw httpError(400, "guild_id must be a Discord server ID.");
  }
  const normalizedTiers = [...new Set((tiers || [])
    .map(normalizeHatchTierValue)
    .filter(tier => HATCH_TRACKER_TIERS.includes(tier)))];
  const existing = plainObject(base.guild_subscriptions);
  const existingSubscription = plainObject(existing[normalizedGuildId]);
  const subscriptions = {
    ...existing,
    [normalizedGuildId]: {
      enabled: enabled === true && normalizedTiers.length > 0,
      tiers: normalizedTiers,
      // Only an explicit /htg enable (or its OAuth completion) grants the
      // current server consent. Disabling preserves the recorded version.
      consent_version: enabled === true
        ? HTG_SUBSCRIPTION_CONSENT_VERSION
        : Math.max(0, Math.floor(Number(existingSubscription.consent_version || 0))),
      updated_at: new Date().toISOString()
    }
  };
  const activeSubscriptions = hatchTrackerGuildSubscriptions({ guild_subscriptions: subscriptions })
    .filter(subscription => subscription.enabled);
  return {
    ...base,
    guild_subscriptions: subscriptions,
    enabled_tiers: [...new Set(activeSubscriptions.flatMap(subscription => subscription.tiers))],
    // Kept only as an admin-visible compatibility summary. Delivery reads the
    // server-scoped subscriptions above, never this legacy aggregate field.
    alert_guild_ids: activeSubscriptions.map(subscription => subscription.guild_id)
  };
}

function hatchTierResponseLabel(selection) {
  return selection === "all" ? "All" : hatchTierLabel(selection);
}

async function handleInventoryRetry(request, env) {
  requireSupabase(env);
  if (!hasAdminAuthorization(request, env)) requireAllowedOrigin(request, env);

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || "").trim();
  if (!/^\d+$/.test(userId)) throw httpError(400, "A numeric Roblox user_id is required.");

  const grant = await getUsableOAuthGrant(env, userId);
  if (!grant) throw httpError(409, "Inventory authorization is not connected for this Roblox account.");

  const before = await inventoryReadiness(env, userId);
  if (before.snapshot_ready) {
    return json({
      ok: true,
      skipped: true,
      reason: "snapshot_already_exists",
      user_id: userId,
      ...before
    });
  }

  const grantDetails = await findOAuthGrant(env, userId, "metadata");
  const username = String(grantDetails?.metadata?.username || userId).trim();
  const ingest = await ingestInventory(env, { user_id: userId, username }, "oauth_retry", false, { force: false });
  const after = await inventoryReadiness(env, userId);
  if (!after.snapshot_ready) throw httpError(502, "The inventory pull completed, but no readable snapshot was created.");

  return json({
    ok: true,
    retried: true,
    user_id: userId,
    ingest,
    ...after
  });
}

async function inventoryReadiness(env, userId) {
  requireSupabase(env);
  const normalizedUserId = String(userId || "").trim();
  const latest = await getLatestSnapshot(env, normalizedUserId);
  if (!latest) {
    return {
      snapshot_ready: false,
      snapshot_state: "missing",
      snapshot_at: null,
      snapshot_source: null,
      hourly_ready: false,
      hourly_rows: 0,
      scheduled_snapshot_count: 0
    };
  }

  const snapshots = await getUserSnapshots(env, normalizedUserId, 500);
  const latestTime = new Date(latest.captured_at).getTime();
  const cutoff = latestTime - 25 * 3600000;
  const scheduled = sortAsc(snapshots).filter(snapshot =>
    snapshot.source === "schedule" &&
    new Date(snapshot.captured_at).getTime() >= cutoff
  );

  return {
    snapshot_ready: true,
    snapshot_state: "ready",
    snapshot_at: latest.captured_at || null,
    snapshot_source: latest.source || null,
    hourly_ready: scheduled.length >= 2,
    hourly_rows: Math.max(0, scheduled.length - 1),
    scheduled_snapshot_count: scheduled.length
  };
}

async function handleOAuthSummary(env) {
  requireSupabase(env);
  const rows = await supabaseSelectAll(env, OAUTH_GRANTS_TABLE, {
    select: "roblox_user_id,expires_at",
    roblox_user_id: "not.is.null",
    order: "authorized_at.desc"
  }, 10000);
  const now = Date.now();
  const active = new Set();
  const expired = new Set();
  for (const row of rows) {
    const userId = String(row.roblox_user_id || "").trim();
    if (!userId) continue;
    if (new Date(row.expires_at).getTime() > now) active.add(userId);
    else expired.add(userId);
  }
  for (const userId of active) expired.delete(userId);
  return json({
    ok: true,
    opted_in_players: active.size,
    expired_approvals: expired.size,
    counted_at: new Date(now).toISOString()
  });
}

async function oauthStatus(env, userId = configuredUsers(env)[0]?.user_id || DEFAULT_USER_ID, purpose = "inventory") {
  const configured = bigGamesOAuthConfiguredForPurpose(env, purpose);
  if (!supabaseUrl(env) || !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)) {
    return { configured, connected: false, expires_at: null, authorization_missing: true };
  }
  try {
    const verifyCredential = purpose === "hatch_tracker";
    const grant = await findOAuthGrant(
      env,
      userId,
      `grant_key,roblox_user_id,scope,authorized_at,expires_at,last_used_at${verifyCredential ? ",access_token_ciphertext,metadata" : ""}`,
      purpose
    );
    const missingScopes = grant ? missingOAuthScopes(env, purpose, grant.scope) : [];
    const expired = !!grant && new Date(grant.expires_at).getTime() <= Date.now();
    let credentialUsable = true;
    if (grant && !expired && !missingScopes.length && verifyCredential) {
      try {
        await openOAuthAccessToken(env, grant, purpose);
      } catch {
        credentialUsable = false;
      }
    }
    const connected = !!grant && !expired && !missingScopes.length && credentialUsable;
    return {
      configured,
      connected,
      authorized_at: grant?.authorized_at || null,
      expires_at: grant?.expires_at || null,
      last_used_at: grant?.last_used_at || null,
      scope: grant?.scope || null,
      missing_scopes: missingScopes,
      authorization_missing: !grant,
      reauthorization_required: !!grant && (expired || missingScopes.length > 0 || !credentialUsable),
      message: grant && !credentialUsable
        ? "Stored Big Games authorization could not be opened. Run /htg setup again for this account."
        : null
    };
  } catch (error) {
    return { configured, connected: false, expires_at: null, storage_ready: false, message: error?.message || String(error) };
  }
}

async function getUsableOAuthGrant(env, userId, purpose = "inventory") {
  if (!supabaseUrl(env)) return null;
  let grant;
  try {
    grant = await findOAuthGrant(env, userId, "grant_key,roblox_user_id,access_token_ciphertext,token_type,scope,authorized_at,expires_at,last_used_at,metadata", purpose);
  } catch (error) {
    if (/does not exist|schema cache|PGRST205/i.test(error?.message || "")) return null;
    throw error;
  }
  if (!grant) return null;
  if (!bigGamesOAuthConfiguredForPurpose(env, purpose) && !inventoryCredentialSecret(env, purpose)) return null;
  if (new Date(grant.expires_at).getTime() <= Date.now()) {
    throw httpError(401, `Big Games authorization expired for Roblox user ${userId}. Run the OAuth authorization flow again.`);
  }
  return grant;
}

async function findOAuthGrant(env, userId, select, purpose = "inventory") {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;
  // Keep the two OAuth applications separate. Previously both apps wrote to
  // `big_games_inventory:<userId>` even though their access tokens were
  // encrypted with different client secrets. A later website-inventory OAuth
  // approval could therefore silently replace a working HTG grant and leave
  // the scheduled tracker unable to open its stored token.
  const keyed = await supabaseSelect(env, OAUTH_GRANTS_TABLE, {
    select,
    grant_key: `eq.${oauthGrantKey(normalizedUserId, purpose)}`,
    limit: "1"
  });
  if (keyed[0]) return keyed[0];

  // Read legacy shared-key grants only when their saved purpose agrees with
  // the caller. This preserves existing HTG authorizations made before the
  // split, while ensuring a normal inventory grant cannot masquerade as an
  // HTG grant (or vice versa). New authorizations always use purpose keys.
  const legacyKey = await supabaseSelect(env, OAUTH_GRANTS_TABLE, {
    select: oauthGrantSelectIncludingMetadata(select),
    grant_key: `eq.${oauthGrantKey(normalizedUserId, "inventory")}`,
    limit: "1"
  });
  const legacy = legacyKey[0] || null;
  if (legacy && oauthGrantMatchesPurpose(legacy, purpose)) return legacy;

  // Very old rows may not have used a grant key at all. Retain inventory-only
  // compatibility for those records, but never guess that an unlabelled row
  // belongs to the HTG application.
  const legacyRows = await supabaseSelect(env, OAUTH_GRANTS_TABLE, {
    select: oauthGrantSelectIncludingMetadata(select),
    roblox_user_id: `eq.${normalizedUserId}`,
    order: "updated_at.desc",
    limit: "20"
  });
  return legacyRows.find(row => oauthGrantMatchesPurpose(row, purpose)) || null;
}

function oauthGrantSelectIncludingMetadata(select) {
  const fields = String(select || "*").split(",").map(field => field.trim()).filter(Boolean);
  if (!fields.includes("metadata") && !fields.includes("*")) fields.push("metadata");
  return fields.join(",");
}

function oauthGrantMatchesPurpose(grant, purpose = "inventory") {
  const saved = firstString(grant?.metadata?.oauth_app, grant?.metadata?.purpose);
  if (purpose === "hatch_tracker") return saved === "hatch_tracker";
  return !saved || saved === "inventory";
}

function oauthGrantKey(userId, purpose = "inventory") {
  const namespace = purpose === "hatch_tracker" ? "big_games_hatch_tracker" : BIG_GAMES_GRANT_KEY;
  return `${namespace}:${String(userId || "").trim()}`;
}

function bigGamesOAuthConfigured(env) {
  return bigGamesOAuthMissing(env, "inventory").length === 0;
}

function hatchBigGamesOAuthConfigured(env) {
  return bigGamesOAuthMissing(env, "hatch_tracker").length === 0;
}

function bigGamesOAuthConfiguredForPurpose(env, purpose = "inventory") {
  return purpose === "hatch_tracker" ? hatchBigGamesOAuthConfigured(env) : bigGamesOAuthConfigured(env);
}

function missingOAuthScopes(env, purpose = "inventory", scopeText = "") {
  const granted = oauthScopeSet(scopeText);
  return bigGamesOAuthScopes(env, purpose).filter(scope => !granted.has(scope));
}

function requireBigGamesOAuth(env) {
  const missing = bigGamesOAuthMissing(env, "inventory");
  if (missing.length) throw httpError(500, `Missing ${missing.join(", ")}.`);
}

function requireHatchBigGamesOAuth(env) {
  const missing = bigGamesOAuthMissing(env, "hatch_tracker");
  if (missing.length) throw httpError(500, `Missing ${missing.join(", ")} on the inventory Worker for HTG Big Games auth.`);
}

function bigGamesOAuthMissing(env, purpose = "inventory") {
  const app = bigGamesOAuthApp(env, purpose, { allowMissing: true });
  const names = bigGamesOAuthEnvNames(purpose);
  const missing = [];
  if (!app.clientId) missing.push(names.clientId);
  if (!app.clientSecret) missing.push(names.clientSecret);
  if (!app.redirectUri) missing.push(names.redirectUri);
  return missing;
}

function bigGamesOAuthAppForPendingState(env, pending) {
  const metadata = pending?.metadata && typeof pending.metadata === "object" ? pending.metadata : {};
  const purpose = metadata.purpose === "hatch_tracker" || metadata.oauth_app === "hatch_tracker"
    ? "hatch_tracker"
    : "inventory";
  return bigGamesOAuthApp(env, purpose);
}

function bigGamesOAuthApp(env, purpose = "inventory", options = {}) {
  const names = bigGamesOAuthEnvNames(purpose);
  const rawRedirectUri = String(env[names.redirectUri] || "").trim();
  const app = {
    purpose,
    clientId: String(env[names.clientId] || "").trim(),
    clientSecret: String(env[names.clientSecret] || "").trim(),
    redirectUri: normalizeBigGamesRedirectUri(rawRedirectUri, purpose)
  };
  if (!options.allowMissing) {
    const missing = [];
    if (!app.clientId) missing.push(names.clientId);
    if (!app.clientSecret) missing.push(names.clientSecret);
    if (!app.redirectUri) missing.push(names.redirectUri);
    if (missing.length) throw httpError(500, `Missing ${missing.join(", ")}.`);
  }
  return app;
}

function normalizeBigGamesRedirectUri(value, purpose = "inventory") {
  const text = String(value || "").trim();
  if (!text) return "";
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    return text;
  }
  if (parsed.pathname === "" || parsed.pathname === "/") {
    parsed.pathname = purpose === "hatch_tracker"
      ? BIG_GAMES_SHORT_OAUTH_CALLBACK_PATH
      : BIG_GAMES_OAUTH_CALLBACK_PATH;
  }
  parsed.hash = "";
  return parsed.toString();
}

function bigGamesOAuthScopeString(env, purpose = "inventory") {
  return bigGamesOAuthScopes(env, purpose).join(" ");
}

function bigGamesAuthorizeUrl(env, oauthApp, purpose, state, challenge) {
  const authorizeUrl = new URL(BIG_GAMES_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", oauthApp.clientId);
  authorizeUrl.searchParams.set("redirect_uri", oauthApp.redirectUri);
  authorizeUrl.searchParams.set("scope", bigGamesOAuthScopeString(env, purpose));
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  return authorizeUrl.toString();
}

async function fetchPendingOAuthState(env, state) {
  const stateHash = await sha256Base64Url(state);
  const states = await supabaseSelect(env, OAUTH_STATES_TABLE, {
    select: "state_hash,code_verifier_ciphertext,expires_at,used_at,target_roblox_user_id,target_roblox_username,return_url,force_ingest,metadata",
    state_hash: `eq.${stateHash}`,
    limit: "1"
  });
  return states[0] || null;
}

function hatchOAuthShortAuthorizeUrl(env, state) {
  const base = String(
    env.HATCH_OAUTH_PUBLIC_BASE ||
    env.INVENTORY_PUBLIC_BASE ||
    env.INVENTORY_PUBLIC_URL ||
    "https://inventory-detector-worker.opal-dde.workers.dev"
  ).trim().replace(/\/+$/, "");
  const url = new URL("/api/hatch/oauth/authorize", base);
  url.searchParams.set("state", state);
  return url.toString();
}

function bigGamesOAuthScopes(env, purpose = "inventory") {
  const configured = purpose === "hatch_tracker"
    ? firstString(env.HATCH_BIG_GAMES_SCOPES)
    : firstString(env.BIG_GAMES_SCOPES);
  const scopes = configured
    ? configured.split(/[,\s]+/).map(scope => scope.trim()).filter(Boolean)
    : purpose === "hatch_tracker"
      ? BIG_GAMES_HATCH_TRACKER_SCOPES
      : [BIG_GAMES_INVENTORY_SCOPE];
  const unique = [...new Set(scopes)];
  if (!unique.includes(BIG_GAMES_INVENTORY_SCOPE)) unique.unshift(BIG_GAMES_INVENTORY_SCOPE);
  if (purpose === "hatch_tracker" && !unique.includes(BIG_GAMES_PROFILE_SCOPE)) unique.unshift(BIG_GAMES_PROFILE_SCOPE);
  return unique;
}

function bigGamesOAuthEnvNames(purpose = "inventory") {
  if (purpose === "hatch_tracker") {
    return {
      clientId: "HATCH_BIG_GAMES_CLIENT_ID",
      clientSecret: "HATCH_BIG_GAMES_CLIENT_SECRET",
      redirectUri: "HATCH_BIG_GAMES_REDIRECT_URI"
    };
  }
  return {
    clientId: "BIG_GAMES_CLIENT_ID",
    clientSecret: "BIG_GAMES_CLIENT_SECRET",
    redirectUri: "BIG_GAMES_REDIRECT_URI"
  };
}

function inventoryCredentialSecret(env, purpose = "inventory") {
  return oauthCredentialSecrets(env, purpose)[0] || "";
}

function oauthCredentialSecrets(env, purpose = "inventory") {
  const stable = firstString(env.INVENTORY_TOKEN_ENCRYPTION_SECRET, env.BIG_GAMES_TOKEN_ENCRYPTION_SECRET);
  const inventorySecret = firstString(env.BIG_GAMES_CLIENT_SECRET);
  const hatchSecret = firstString(env.HATCH_BIG_GAMES_CLIENT_SECRET);
  const ordered = purpose === "hatch_tracker"
    ? [stable, hatchSecret, inventorySecret]
    : [stable, inventorySecret, hatchSecret];
  return [...new Set(ordered.map(secret => String(secret || "").trim()).filter(Boolean))];
}

async function openOAuthAccessToken(env, grant, purpose = "inventory") {
  const metadata = grant?.metadata && typeof grant.metadata === "object" ? grant.metadata : {};
  const storedPurpose = metadata.oauth_app === "hatch_tracker" || metadata.purpose === "hatch_tracker"
    ? "hatch_tracker"
    : purpose;
  const secrets = oauthCredentialSecrets(env, storedPurpose);
  let lastError = null;
  for (const secret of secrets) {
    try {
      return await openSecret(grant.access_token_ciphertext, secret, "big-games-access-token");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || httpError(500, "No OAuth credential encryption secret is configured.");
}

function bigGamesRedirectUri(env) {
  return String(env.BIG_GAMES_REDIRECT_URI || "").trim();
}

function hasAdminAuthorization(request, env) {
  const expected = String(env.INGEST_ADMIN_TOKEN || "");
  return !!expected && (request.headers.get("authorization") || "") === `Bearer ${expected}`;
}

function validatedOAuthReturnUrl(value, env) {
  const candidate = String(value || env.INVENTORY_OAUTH_RETURN_URL || "").trim();
  if (!candidate) return "";
  let parsed;
  try { parsed = new URL(candidate); } catch { throw httpError(400, "The OAuth return_url is invalid."); }
  const allowedOrigins = String(env.ALLOWED_ORIGIN || "https://c0ld-clan.com")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (!local && !allowedOrigins.includes("*") && !allowedOrigins.includes(parsed.origin)) {
    throw httpError(400, "The OAuth return_url origin is not allowed.");
  }
  return parsed.toString();
}

async function markOAuthStateUsed(env, stateHash) {
  await supabaseUpdate(env, OAUTH_STATES_TABLE, { state_hash: `eq.${stateHash}` }, { used_at: new Date().toISOString() });
}

function pendingOAuthPurpose(pending) {
  const metadata = pending?.metadata && typeof pending.metadata === "object" ? pending.metadata : {};
  return metadata.purpose === "hatch_tracker" || metadata.oauth_app === "hatch_tracker"
    ? "hatch_tracker"
    : "inventory";
}

function oauthConnectedPendingMessage(isHatchTrackerOAuth) {
  return isHatchTrackerOAuth
    ? "Inventory access is connected, but the first pull failed. Return to Discord and try `/htg accounts`, or wait for the next scheduled scan"
    : "Inventory access is connected, but the first pull failed. Retry from the league page or wait for the next scheduled scan";
}

function oauthSnapshotPendingMessage(isHatchTrackerOAuth) {
  return isHatchTrackerOAuth
    ? "Access is connected, but the first inventory snapshot could not be saved. Return to Discord and try `/htg accounts`, or wait for the next scheduled scan"
    : "Access is connected, but the first inventory snapshot could not be saved. Retry from the league page or wait for the next scheduled scan";
}

function oauthConnectedReadyMessage(isHatchTrackerOAuth, expiresAt) {
  return isHatchTrackerOAuth
    ? `Luna is connected through ${formatDateTime(expiresAt)}. You can close this tab and return to Discord.`
    : `Inventory access is connected through ${formatDateTime(expiresAt)} and the first snapshot was pulled. Hourly gains will appear after two scheduled scans.`;
}

function oauthCompletion(pending, success, message, params = {}) {
  if (pending?.return_url) {
    const target = new URL(pending.return_url);
    const oauthResult = String(params.oauth_result || (success ? "connected" : "error"));
    target.searchParams.set("inventory_oauth", oauthResult);
    target.searchParams.set("inventory_message", message);
    for (const [key, value] of Object.entries(params)) {
      if (key === "oauth_result" || value === undefined || value === null || value === "") continue;
      target.searchParams.set(key, String(value));
    }
    return Response.redirect(target.toString(), 303);
  }
  return oauthHtml(success, message);
}

async function saveOAuthGrant(env, { userId, username, token, scopes, authorizedAt, expiresAt, expiresIn, identityVerified, purpose = "inventory" }) {
  await supabaseUpsert(env, OAUTH_GRANTS_TABLE, [{
    grant_key: oauthGrantKey(userId, purpose),
    roblox_user_id: Number(userId),
    access_token_ciphertext: await sealSecret(token.access_token, inventoryCredentialSecret(env, purpose), "big-games-access-token"),
    token_type: token.token_type || "Bearer",
    scope: scopes.join(" "),
    authorized_at: authorizedAt.toISOString(),
    expires_at: expiresAt,
    last_used_at: null,
    metadata: {
      expires_in: expiresIn,
      username: username || null,
      identity_verified: !!identityVerified,
      oauth_app: purpose
    },
    updated_at: new Date().toISOString()
  }], "grant_key");
}

function authorizedInventoryAccount(raw, token = null) {
  const data = raw?.data || raw || {};
  const tokenClaims = decodeJwtPayload(token?.access_token);
  const candidates = [
    accountIdentityFromHeaders(raw?._headers || raw?.headers),
    data.account,
    raw?.account,
    data.currentAccount,
    raw?.currentAccount,
    data.authorizedAccount,
    raw?.authorizedAccount,
    data.selectedAccount,
    raw?.selectedAccount,
    data.user,
    raw?.user,
    data.player,
    raw?.player,
    data.robloxAccount,
    raw?.robloxAccount,
    data.roblox_account,
    raw?.roblox_account,
    data.profile,
    raw?.profile,
    data.views?.profile,
    data.views?.profile?.data,
    raw?.views?.profile,
    raw?.views?.profile?.data,
    data.refresh,
    raw?.refresh,
    token?.account,
    token?.user,
    token?.player,
    token?.robloxAccount,
    token?.roblox_account,
    token,
    tokenClaims
  ].filter(value => value && typeof value === "object");
  for (const account of candidates) {
    const identity = normalizeAuthorizedAccount(account);
    if (identity.user_id) return identity;
  }
  return {
    user_id: "",
    username: ""
  };
}

function normalizeAuthorizedAccount(account) {
  const roblox = account?.roblox || account?.robloxAccount || account?.roblox_account || {};
  const userId = firstString(
    account?.robloxUserId,
    account?.roblox_user_id,
    account?.robloxUserID,
    account?.robloxId,
    account?.roblox_id,
    account?.robloxUID,
    account?.roblox_uid,
    account?.playerRobloxUserId,
    account?.player_roblox_user_id,
    account?.selectedRobloxUserId,
    account?.selected_roblox_user_id,
    roblox.userId,
    roblox.user_id,
    roblox.userID,
    roblox.id,
    account?.userId,
    account?.user_id,
    account?.playerId,
    account?.player_id,
    account?.subject,
    account?.sub
  );
  if (!/^\d+$/.test(userId)) return { user_id: "", username: "" };
  return {
    user_id: userId,
    username: firstString(
      account?.robloxUsername,
      account?.roblox_username,
      account?.robloxName,
      account?.roblox_name,
      roblox.username,
      roblox.name,
      account?.username,
      account?.name,
      account?.displayName,
      account?.display_name
    )
  };
}

function accountIdentityFromHeaders(headers) {
  const userId = firstHeader(headers,
    "x-roblox-user-id",
    "x-roblox-userid",
    "x-bg-roblox-user-id",
    "x-biggames-roblox-user-id",
    "x-player-roblox-user-id",
    "x-account-roblox-user-id",
    "x-player-id",
    "x-user-id"
  );
  const username = firstHeader(headers,
    "x-roblox-username",
    "x-bg-roblox-username",
    "x-biggames-roblox-username",
    "x-player-username",
    "x-username"
  );
  return { user_id: userId, username };
}

function firstHeader(headers, ...names) {
  if (!headers) return "";
  for (const name of names) {
    if (typeof headers.get === "function") {
      const value = headers.get(name);
      if (value) return String(value).trim();
    }
    const lowerName = String(name).toLowerCase();
    const direct = headers[name] ?? headers[lowerName];
    if (direct) return String(direct).trim();
  }
  return "";
}

function decodeJwtPayload(accessToken) {
  try {
    const segment = String(accessToken || "").split(".")[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function oauthHtml(success, message) {
  const color = success ? "#55d98a" : "#ff6b72";
  const title = success ? "Luna connected" : "Connection failed";
  const safeMessage = escapeHtml(message);
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{margin:0;background:#0b1118;color:#edf4ff;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{width:min(560px,calc(100% - 48px));background:#151e29;border:1px solid #314052;border-left:5px solid ${color};border-radius:12px;padding:28px}h1{font-size:24px;margin:0 0 12px}p{color:#b8c5d6;line-height:1.5;margin:0}.hint{margin-top:14px;color:#7f8da3;font-size:14px}</style></head><body><main class="card"><h1>${title}</h1><p>${safeMessage}</p>${success ? '<p class="hint">Return to Discord to manage HTG alerts.</p>' : ""}</main></body></html>`, { status: success ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function formatDateTime(iso) {
  try { return new Date(iso).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC"; } catch { return iso; }
}

async function handleIngest(request, env, source) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const isBoundary = parseBool(url.searchParams.get("boundary")) ?? isMountainMidnight(new Date(), env);
  const result = await ingestInventory(env, user, source, isBoundary, { force: parseBool(url.searchParams.get("force")) === true });
  if (parseBool(url.searchParams.get("post_hourly"))) {
    result.discord = await postHourlyDiffIfNeeded(env, user, { force: true });
  }
  return json({ ok: true, ...result });
}

async function handleInventorySourceDebug(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const query = String(url.searchParams.get("q") || "Genie Fox").trim();
  const raw = await fetchInventory(env, user, {
    forceRefresh: parseBool(url.searchParams.get("force")) === true
  });
  const selection = selectOwnedInventoryItems(raw, env);
  const candidates = inventoryArrayCandidates(raw)
    .map(candidate => summarizeInventoryCandidate(candidate.path, candidate.items, query))
    .sort((a, b) => b.query_matches - a.query_matches || b.analysis.score - a.analysis.score || b.length - a.length)
    .slice(0, 40);

  return json({
    ok: true,
    user,
    query,
    source: inventorySourceMeta(raw),
    payload_shape: inventoryPayloadShape(raw),
    selected: summarizeInventoryCandidate(selection.path, selection.items, query, {
      method: selection.method,
      confidence: selection.confidence
    }),
    candidates
  });
}

async function handlePostHourly(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const result = await postHourlyDiffIfNeeded(env, user, { force: parseBool(url.searchParams.get("force")) });
  return json({ ok: true, ...result });
}

async function handleLatest(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const snapshot = await getLatestSnapshot(env, userId, { includeRaw: true });
  if (!snapshot) return json({ ok: false, message: "No verified owned inventory snapshots found." }, 404);
  const includeItems = parseBool(url.searchParams.get("include_items")) !== false;
  const items = includeItems ? await getSnapshotItems(env, snapshot.id) : undefined;
  const includeDamage = includeItems && parseBool(url.searchParams.get("include_damage")) === true;
  const damageSummary = includeDamage ? await buildInventoryDamageSummary(items, env) : undefined;
  return cacheJson({
    ok: true,
    snapshot: lightSnapshot(snapshot),
    source: inventorySourceMeta(snapshot.raw),
    ...(includeItems ? { items } : {}),
    ...(includeDamage ? { damage_summary: damageSummary } : {})
  }, env);
}

async function handleDiff(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const mode = String(url.searchParams.get("mode") || "daily").toLowerCase();
  const snapshots = await getUserSnapshots(env, userId, Number(url.searchParams.get("limit") || 500));
  if (!snapshots.length) return json({ ok: false, message: "No verified owned inventory snapshots found." }, 404);

  const picked = ["previous", "latest", "snapshot"].includes(mode)
    ? pickPreviousSnapshots(snapshots)
    : mode === "hour" || mode === "hourly" || url.searchParams.get("hours") === "1"
      ? pickLastHourSnapshots(snapshots)
      : pickDailyComparisonSnapshots(snapshots, url.searchParams.get("day"));

  const payload = await buildDiffPayload(env, userId, picked);
  if (!payload.ok) return json(payload, 404);
  return cacheJson(payload, env);
}

async function handleHourlySeries(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const hours = Math.max(1, Math.min(72, Number(url.searchParams.get("hours") || 24)));
  const synchronizedOnly = parseBool(url.searchParams.get("synchronized")) === true;
  const snapshots = await getUserSnapshots(env, userId, Math.max(500, hours * 20));
  if (!snapshots.length) return json({ ok: false, message: "No verified owned inventory snapshots found." }, 404);

  const sorted = sortAsc(snapshots);
  const latest = sorted[sorted.length - 1];
  const cutoff = new Date(new Date(latest.captured_at).getTime() - (hours + 1) * 3600000);
  const recent = sorted.filter(snapshot => new Date(snapshot.captured_at) >= cutoff);
  const comparisonSnapshots = synchronizedOnly ? recent.filter(snapshot => snapshot.source === "schedule") : recent;
  const itemCache = new Map();
  const itemsFor = async snapshot => {
    if (!itemCache.has(snapshot.id)) itemCache.set(snapshot.id, getSnapshotItems(env, snapshot.id));
    return itemCache.get(snapshot.id);
  };
  const rows = [];

  for (let i = 1; i < comparisonSnapshots.length; i++) {
    const start = comparisonSnapshots[i - 1];
    const end = comparisonSnapshots[i];
    const [startItems, endItems] = await Promise.all([itemsFor(start), itemsFor(end)]);
    const diff = buildDiff(startItems, endItems);
    rows.push({
      period_start: start.captured_at,
      period_end: end.captured_at,
      duration_minutes: Math.max(0, Math.round((new Date(end.captured_at) - new Date(start.captured_at)) / 60000)),
      start: lightSnapshot(start),
      end: lightSnapshot(end),
      totals: diff.totals,
      gained: diff.gained.slice(0, 250).map(compactDiffRow),
      top_gained: diff.gained.slice(0, 12).map(compactDiffRow)
    });
  }

  return cacheJson({ ok: true, user_id: userId, hours, synchronized_only: synchronizedOnly, rows }, env);
}

async function ingestInventory(env, user, source, isBoundary, options = {}) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const localDay = localDateString(new Date(fetchedAt), env);
  const userId = String(user.user_id || DEFAULT_USER_ID).trim();
  const username = String(user.username || userId).trim();

  const raw = options.rawInventory || await fetchInventory(env, { user_id: userId, username }, { forceRefresh: options.force === true });
  const inventorySelection = selectOwnedInventoryItems(raw, env);
  const rawItems = inventorySelection.items;
  const sourceMeta = inventorySourceMeta(raw);
  const verifiedUsername = firstString(sourceMeta?.verified_identity?.username);
  if (verifiedUsername) {
    // The ID has already been proven equal above. Prefer the live Roblox name
    // over a stale tracker label in state rows and Discord alerts.
    user = { ...user, username: verifiedUsername };
    tracker = { ...tracker, roblox_username: verifiedUsername };
  }
  if (envBool(env.INVENTORY_REJECT_EMPTY, true) && !rawItems.length) {
    console.warn("Big Games inventory payload did not contain a verified owned-item array.", inventoryPayloadShape(raw));
    throw httpError(502, "Big Games returned no verified owned-inventory item array; snapshot was rejected to prevent catalog totals from being stored as owned pets.");
  }

  if (!options.force && envBool(env.INVENTORY_SKIP_DUPLICATE_SOURCE, true) && sourceMeta.fetched_at) {
    const latest = await getLatestSnapshot(env, userId, { includeRaw: true });
    const previousSource = inventorySourceMeta(latest?.raw);
    if (previousSource.fetched_at && previousSource.fetched_at === sourceMeta.fetched_at) {
      return {
        skipped: true,
        reason: "Big Games inventory source has not changed since the previous snapshot.",
        source: sourceMeta,
        snapshot: lightSnapshot(latest)
      };
    }
  }

  const snapshotRows = await supabaseInsert(env, SNAPSHOT_TABLE, [{
    roblox_user_id: Number(userId),
    roblox_username: username,
    source,
    captured_at: fetchedAt,
    local_day: localDay,
    is_boundary: !!isBoundary,
    boundary_label: isBoundary ? `midnight_${timeZone(env)}` : null,
    item_count: rawItems.length,
    raw: inventorySnapshotMeta(raw, inventorySelection)
  }], "representation");

  const snapshot = snapshotRows[0];
  const itemRows = rawItems.map(item => normalizeItemRow(item, snapshot.id, userId, fetchedAt, localDay));

  for (const chunk of chunks(itemRows, 500)) {
    if (chunk.length) await supabaseInsert(env, ITEM_TABLE, chunk, "minimal");
  }

  return {
    skipped: false,
    snapshot: lightSnapshot(snapshot),
    source: sourceMeta,
    inventory_items_path: inventorySelection.path,
    inventory_selection_method: inventorySelection.method,
    raw_item_count: rawItems.length,
    item_count: itemRows.length
  };
}

async function postHourlyDiffIfNeeded(env, user, options = {}) {
  if (!env.DISCORD_WEBHOOK_URL) return { posted: false, reason: "DISCORD_WEBHOOK_URL is not configured" };
  const userId = String(user.user_id || DEFAULT_USER_ID).trim();
  const snapshots = await getUserSnapshots(env, userId, 500);
  const picked = pickLastHourSnapshots(snapshots);
  const payload = await buildDiffPayload(env, userId, picked);
  if (!payload.ok) return { posted: false, reason: payload.message || "No hourly diff available" };

  const postKey = hourlyPostKey(payload.end?.captured_at || new Date().toISOString(), env);
  if (!options.force) {
    const existing = await supabaseSelect(env, DISCORD_POSTS_TABLE, { roblox_user_id: `eq.${userId}`, post_key: `eq.${postKey}`, limit: "1" });
    if (existing.length) return { posted: false, reason: "Already posted", post_key: postKey };
  }

  const discordPayload = buildDiscordPayload(user, payload);
  const discordResponse = await sendDiscordWebhook(env.DISCORD_WEBHOOK_URL, discordPayload);
  await supabaseInsert(env, DISCORD_POSTS_TABLE, [{
    roblox_user_id: Number(userId),
    post_key: postKey,
    period_type: "hourly",
    period_start: payload.start.captured_at,
    period_end: payload.end.captured_at,
    snapshot_start_id: payload.start.id,
    snapshot_end_id: payload.end.id,
    discord_response: discordResponse || {}
  }], "minimal");

  return { posted: true, post_key: postKey, totals: payload.totals };
}

// HTG v2 deliberately has one authoritative state record: tracker.metadata.htg_v2.
// The old implementation evolved around a second compact-state table, a legacy
// baseline, and a separate pending-gain record. Those can disagree after an OAuth
// reconnect, a worker deployment, or a partial database write. v2 never reads or
// advances those legacy records. Its first fresh scan is a quiet baseline; every
// later alert is a verified positive inventory delta from that exact baseline.
async function postHtgGainAlertIfNeeded(env, user, tracker, options = {}) {
  const userId = String(user?.user_id || tracker?.roblox_user_id || "").trim();
  if (!userId) return { posted: false, reason: "No Roblox user_id was provided." };
  if (!tracker) return { posted: false, reason: "HTG gain alerts are not enabled for this Roblox account." };

  const now = new Date();
  const checkedAt = now.toISOString();
  const schedule = options.schedule || htgV2ScheduleDecision(env, tracker, userId, now, {
    ignoreShard: true,
    force: options.force === true
  });
  if (!schedule.due) return { posted: false, skipped: true, ...schedule, htg_v2: htgV2StateSummary(tracker) };

  let state = htgV2State(tracker);
  state = {
    ...state,
    last_attempt_at: checkedAt,
    last_error: null,
    last_error_at: null,
    last_outcome: "fetching",
    last_reason: `HTG v2 ${firstString(options.source, "schedule")} scan started.`
  };
  tracker = await saveHtgV2Tracker(env, tracker, state, { checkedAt });

  const forceRefreshRequested = htgForceRefreshOnSchedule(env);
  const raw = options.rawInventory || await fetchHtgInventory(env, {
    user_id: userId,
    username: user?.username || tracker.roblox_username || userId
  }, {
    forceRefresh: forceRefreshRequested,
    // A saved OAuth token is never trusted as an account label. The live Profile
    // response must match the tracker before its inventory can affect HTG state.
    verifyIdentity: true
  });
  const inventorySelection = selectOwnedInventoryItems(raw, env);
  const rawItems = inventorySelection.items;
  const source = inventorySourceMeta(raw);
  const verifiedUsername = firstString(source?.verified_identity?.username);
  if (verifiedUsername) {
    user = { ...user, username: verifiedUsername };
    tracker = { ...tracker, roblox_username: verifiedUsername };
  }
  if (envBool(env.INVENTORY_REJECT_EMPTY, true) && !rawItems.length) {
    throw httpError(502, "Big Games returned no verified owned-inventory item array; HTG v2 state was not advanced.");
  }

  const currentRows = normalizeHtgInventoryStateRows(rawItems, tracker, user, checkedAt, {
    source,
    inventory_selection_method: inventorySelection.method,
    inventory_items_path: inventorySelection.path
  });
  state = htgV2State(tracker);
  const baseline = htgV2Baseline(state);

  // A new design needs a clean, known starting point. This never emits an alert,
  // including after a reconnect or a deliberate reset, so existing possessions
  // cannot be mistaken for freshly hatched items.
  if (!baseline || state.reset_required === true) {
    const initialFreshness = htgV2FreshnessDecision(null, source);
    if (!initialFreshness.fresh) {
      const nextState = htgV2CompletedState(state, {
        checkedAt,
        source,
        baseline: null,
        outcome: "awaiting_fresh_baseline",
        reason: `HTG v2 has not saved a baseline yet: ${initialFreshness.reason}`,
        pending: null,
        force_refresh_requested: forceRefreshRequested
      });
      await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
      return {
        posted: false,
        skipped: true,
        reason: nextState.last_reason,
        freshness: initialFreshness,
        htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
        source
      };
    }
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline: htgV2BaselineFromRows(currentRows, checkedAt, source),
      outcome: "baseline_saved",
      reason: "HTG v2 clean baseline saved; the next fresh scan can verify new gains.",
      pending: null,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return {
      posted: false,
      reason: nextState.last_reason,
      htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
      source
    };
  }

  const freshness = htgV2FreshnessDecision(baseline, source);
  if (!freshness.fresh) {
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline,
      outcome: "awaiting_fresh_inventory",
      reason: freshness.reason,
      pending: state.pending,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return {
      posted: false,
      skipped: true,
      reason: freshness.reason,
      freshness,
      htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
      source
    };
  }

  const candidates = await buildHtgGainCandidates(env, currentRows, baseline.items, tracker);
  if (!candidates.length) {
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline: htgV2BaselineFromRows(currentRows, checkedAt, source),
      outcome: "no_gain",
      reason: "No enabled Huge, Titanic, or Gargantuan gain was observed in this fresh inventory revision.",
      pending: null,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return { posted: false, reason: nextState.last_reason, htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }), source };
  }

  const period = {
    start: { captured_at: baseline.captured_at },
    end: { captured_at: checkedAt }
  };
  const sourceFilter = await filterHatchSourceGains(env, userId, candidates, period);
  const sourceRequired = htgRequireSourceFilter(env);
  // A unique owner-log is direct evidence that the item first appeared on this
  // Roblox account. Do not make that strong signal wait on optional Trade,
  // Booth, and Mail permissions, which many otherwise-valid community grants
  // do not include. Unknown ownership still remains pending when source checks
  // are unavailable, so transfers cannot become hatch alerts by accident.
  const eligible = sourceFilter.available
    ? sourceFilter.rows
    : sourceRequired
      ? sourceFilter.rows
      : candidates;
  if (!sourceFilter.available && sourceRequired && !eligible.length) {
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline,
      outcome: "source_verification_pending",
      reason: firstString(sourceFilter.reason, "HTG source verification is temporarily unavailable; the clean baseline was preserved."),
      pending: htgV2PendingFromCandidates(state.pending, candidates, checkedAt, sourceFilter),
      source_filter: sourceFilter,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return {
      posted: false,
      pending: true,
      reason: nextState.last_reason,
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
      source
    };
  }

  if (!eligible.length) {
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline: htgV2BaselineFromRows(currentRows, checkedAt, source),
      outcome: "source_suppressed",
      reason: "All observed HTG gains were verified as trade, booth, mail, or prior-owner transfers.",
      pending: null,
      source_filter: sourceFilter,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return {
      posted: false,
      reason: nextState.last_reason,
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
      source
    };
  }

  // A unique first-owner log is already confirmation. Items without that log
  // still require one later fresh revision so a source-history delay cannot
  // turn a transfer into a hatch alert.
  const pending = htgV2PendingFromCandidates(state.pending, eligible, checkedAt, sourceFilter);
  if (htgV2CandidatesNeedConfirmation(eligible) && pending.observations < 2) {
    const nextState = htgV2CompletedState(state, {
      checkedAt,
      source,
      baseline,
      outcome: "confirmation_pending",
      reason: "HTG gain observed; waiting for one later fresh inventory revision before posting.",
      pending,
      source_filter: sourceFilter,
      force_refresh_requested: forceRefreshRequested
    });
    await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
    return {
      posted: false,
      pending: true,
      reason: nextState.last_reason,
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
      source
    };
  }

  const postedAlerts = await sendAndRecordHatchGainAlerts(env, tracker, user, eligible, period, {
    userId,
    createdAt: checkedAt
  });
  const nextState = htgV2CompletedState(state, {
    checkedAt,
    source,
    baseline: htgV2BaselineFromRows(currentRows, checkedAt, source),
    outcome: "alert_posted",
    reason: `Posted ${postedAlerts.length} verified HTG acquisition alert${postedAlerts.length === 1 ? "" : "s"}.`,
      pending: null,
      last_alert_at: checkedAt,
      alerts_posted: postedAlerts.length,
      source_filter: sourceFilter,
      force_refresh_requested: forceRefreshRequested
  });
  await saveHtgV2Tracker(env, tracker, nextState, { checkedAt, alert: postedAlerts.length > 0 });
  return {
    posted: postedAlerts.length > 0,
    alerts_posted: postedAlerts.length,
    items: postedAlerts.map(row => ({ tier: row.tier, item: row.display_name, variant: row.variant, delta: row.delta })),
    source_filter: compactHatchSourceFilterSummary(sourceFilter),
    htg_v2: htgV2StateSummary({ ...tracker, metadata: htgV2Metadata(tracker.metadata, nextState) }),
    source
  };
}

function htgV2State(tracker) {
  const raw = plainObject(tracker?.metadata?.htg_v2);
  const baseline = plainObject(raw.baseline);
  const pending = plainObject(raw.pending);
  return {
    version: 2,
    reset_required: raw.reset_required === true,
    // An empty array is a valid baseline: a player with no HTGs must still be
    // armed so their very first Huge can be detected on the next fresh scan.
    baseline: Array.isArray(baseline.items) && firstString(baseline.captured_at) ? {
      captured_at: firstString(baseline.captured_at),
      source_fetched_at: firstString(baseline.source_fetched_at) || null,
      items: baseline.items
    } : null,
    pending: pending.active === true && Array.isArray(pending.candidates) && pending.candidates.length ? {
      active: true,
      first_seen_at: firstString(pending.first_seen_at),
      last_seen_at: firstString(pending.last_seen_at),
      observations: Math.max(0, Number(pending.observations || 0)),
      signature: firstString(pending.signature),
      candidates: pending.candidates,
      source_filter: plainObject(pending.source_filter)
    } : null,
    last_attempt_at: firstString(raw.last_attempt_at) || null,
    last_checked_at: firstString(raw.last_checked_at) || null,
    last_completed_at: firstString(raw.last_completed_at) || null,
    last_alert_at: firstString(raw.last_alert_at) || null,
    last_error_at: firstString(raw.last_error_at) || null,
    last_error: firstString(raw.last_error) || null,
    consecutive_failures: Math.max(0, Number(raw.consecutive_failures || 0)),
    last_outcome: firstString(raw.last_outcome) || null,
    last_reason: firstString(raw.last_reason) || null,
    refresh_quota: plainObject(raw.refresh_quota),
    source: plainObject(raw.source),
    alerts_posted: Math.max(0, Number(raw.alerts_posted || 0)),
    scan_history: Array.isArray(raw.scan_history)
      ? raw.scan_history.filter(row => row && typeof row === "object").slice(0, DEFAULT_HTG_SCAN_HISTORY_LIMIT)
      : []
  };
}

function htgV2Baseline(state) {
  const baseline = plainObject(state?.baseline);
  return Array.isArray(baseline.items) && firstString(baseline.captured_at) ? baseline : null;
}

function htgV2Metadata(metadata, state) {
  const base = plainObject(metadata);
  return {
    ...base,
    htg_v2: {
      ...state,
      version: 2,
      updated_at: new Date().toISOString()
    }
  };
}

function hatchTrackerMetadataWithHtgV2Reset(metadata, reason) {
  const base = plainObject(metadata);
  return {
    ...base,
    htg_v2: {
      version: 2,
      reset_required: true,
      baseline: null,
      pending: null,
      last_reason: firstString(reason, "HTG v2 baseline reset requested."),
      updated_at: new Date().toISOString()
    }
  };
}

function htgV2BaselineFromRows(rows, checkedAt, source) {
  return {
    captured_at: checkedAt,
    source_fetched_at: firstString(source?.fetched_at) || null,
    items: (rows || []).map(htgV2StoredRow)
  };
}

function htgV2StoredRow(row) {
  return {
    roblox_user_id: Number(row?.roblox_user_id || 0) || null,
    roblox_username: firstString(row?.roblox_username) || null,
    item_match_key: firstString(row?.item_match_key),
    match_key: firstString(row?.match_key) || null,
    tier: firstString(row?.tier) || null,
    item_key: firstString(row?.item_key) || null,
    item_class: firstString(row?.item_class) || null,
    item_category: firstString(row?.item_category) || null,
    item_id: firstString(row?.item_id) || null,
    display_name: firstString(row?.display_name) || null,
    variant: firstString(row?.variant) || null,
    count: Math.max(0, Number(row?.count || 0)),
    rap: Math.max(0, Number(row?.rap || 0)),
    icon: firstString(row?.icon) || null,
    image_url: firstString(row?.image_url) || null,
    raw: row?.raw && typeof row.raw === "object" ? row.raw : {},
    metadata: plainObject(row?.metadata)
  };
}

function htgV2CompletedState(state, patch = {}) {
  const checkedAt = firstString(patch.checkedAt, new Date().toISOString());
  const refresh = plainObject(patch.source?.refresh);
  const completed = {
    ...state,
    version: 2,
    reset_required: false,
    baseline: patch.baseline || state.baseline || null,
    pending: patch.pending === undefined ? state.pending || null : patch.pending,
    last_checked_at: checkedAt,
    last_completed_at: checkedAt,
    last_error: null,
    last_error_at: null,
    consecutive_failures: 0,
    last_outcome: firstString(patch.outcome, "completed"),
    last_reason: firstString(patch.reason, "HTG v2 scan completed."),
    last_alert_at: firstString(patch.last_alert_at, state.last_alert_at) || null,
    alerts_posted: Math.max(0, Number(patch.alerts_posted || 0)),
    source: {
      fetched_at: firstString(patch.source?.fetched_at) || null,
      is_stale: patch.source?.is_stale ?? null,
      available: patch.source?.available ?? null,
      refresh_fallback_used: patch.source?.refresh_fallback?.used === true
    },
    refresh_quota: {
      used: Number(refresh.used || 0),
      limit: Number(refresh.limit || 0),
      consumed_this_call: htgProviderRefreshUnits(refresh),
      quota_exhausted: refresh.quotaExhausted === true,
      resets_at: refresh.resetsAt || null,
      next_refresh_eligible_at: refresh.nextRefreshEligibleAt || null,
      skipped: refresh.skipped === true
    }
  };
  return {
    ...completed,
    scan_history: htgV2AppendScanHistory(completed.scan_history, {
      completed_at: checkedAt,
      outcome: completed.last_outcome,
      inventory_request_attempted: true,
      source_fetched_at: completed.source.fetched_at,
      source_is_stale: completed.source.is_stale,
      refresh_fallback_used: completed.source.refresh_fallback_used,
      forced_refresh_requested: patch.force_refresh_requested === true,
      // BIG Games tells us whether this request actually spent refresh quota.
      // Do not infer a debit merely because the scheduled request asked for one.
      provider_refresh_units_observed: htgProviderRefreshUnits(refresh),
      source_verification_requests: Array.isArray(patch.source_filter?.sources) ? patch.source_filter.sources.length : 0,
      alerts_posted: completed.alerts_posted,
      reason: completed.last_reason
    })
  };
}

function htgProviderRefreshUnits(refresh) {
  const raw = refresh?.consumedThisCall ?? refresh?.consumed_this_call;
  if (raw === true) return 1;
  if (raw === false || raw === null || raw === undefined) return 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

function htgV2AppendScanHistory(history, event) {
  return [event, ...(Array.isArray(history) ? history : [])].slice(0, DEFAULT_HTG_SCAN_HISTORY_LIMIT);
}

function htgV2PendingFromCandidates(existing, candidates, checkedAt, sourceFilter) {
  const previous = plainObject(existing);
  const signature = htgPendingGainSignature(candidates);
  const continuing = previous.active === true && Array.isArray(previous.candidates) && previous.candidates.length
    && htgPendingGainContinues(previous, candidates);
  return {
    active: true,
    first_seen_at: continuing ? firstString(previous.first_seen_at, checkedAt) : checkedAt,
    last_seen_at: checkedAt,
    observations: continuing ? Math.max(1, Number(previous.observations || 1)) + 1 : 1,
    signature,
    candidates: (candidates || []).map(htgV2StoredRow).map(row => ({
      ...row,
      before: Math.max(0, Number((candidates.find(candidate => candidate.item_match_key === row.item_match_key) || {}).before || 0)),
      after: Math.max(0, Number((candidates.find(candidate => candidate.item_match_key === row.item_match_key) || {}).after || row.count || 0)),
      delta: Math.max(0, Number((candidates.find(candidate => candidate.item_match_key === row.item_match_key) || {}).delta || 0))
    })),
    source_filter: compactHatchSourceFilterSummary(sourceFilter)
  };
}

function htgV2CandidatesNeedConfirmation(candidates) {
  return (candidates || []).some(candidate => firstString(candidate?.hatch_verification) !== "first_owner_log");
}

function htgV2FreshnessDecision(baseline, source) {
  const currentFetchedAt = firstString(source?.fetched_at);
  const baselineFetchedAt = firstString(baseline?.source_fetched_at);
  if (source?.refresh_fallback?.used === true) {
    return { fresh: false, reason: "Big Games refresh quota returned a cached inventory revision; HTG baseline was preserved." };
  }
  if (source?.is_stale === true || source?.cached === true) {
    return { fresh: false, reason: "Big Games returned a stale inventory revision; HTG baseline was preserved." };
  }
  if (!currentFetchedAt) {
    return { fresh: false, reason: "Big Games did not provide a fresh inventory revision timestamp; HTG baseline was preserved." };
  }
  const baselineMs = new Date(baselineFetchedAt || 0).getTime();
  const currentMs = new Date(currentFetchedAt || 0).getTime();
  if (baselineMs > 0 && currentMs > 0 && currentMs <= baselineMs) {
    return { fresh: false, reason: "Big Games inventory revision has not advanced yet; HTG baseline was preserved.", source_fetched_at: currentFetchedAt };
  }
  return { fresh: true, source_fetched_at: currentFetchedAt || null };
}

function htgV2ScheduleDecision(env, tracker, userId, now = new Date(), options = {}) {
  const state = htgV2State(tracker);
  const quota = htgTrackerQuotaSchedule(tracker, now, env);
  const intervalMinutes = htgTrackerScanIntervalMinutes(env, tracker, now);
  const clock = htgClockSlot(env, now, userId);
  const shardCount = clock.minutes;
  const currentShard = now.getUTCMinutes() % shardCount;
  const userShard = clock.offset;
  if (quota.exhausted_until_reset) {
    return {
      due: false,
      reason: "BIG Games refresh quota is exhausted for this Roblox account; HTG is waiting for its reported reset instead of repeatedly reading a stale inventory.",
      interval_minutes: intervalMinutes,
      clock_slot_minutes: clock.minutes,
      next_clock_slot_at: clock.next_slot_at,
      shard_count: shardCount,
      current_shard: currentShard,
      user_shard: userShard,
      quota
    };
  }
  if (options.force === true) return { due: true, reason: "Manual HTG v2 check requested; account quota protection remains active.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
  const latestAttempt = new Date(state.last_attempt_at || 0).getTime();
  if (!latestAttempt) {
    if (!clock.is_slot) {
      return { due: false, reason: "HTG v2 account is waiting for its assigned scan slot.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
    }
    return { due: true, reason: "HTG v2 account has not been scanned yet and reached its assigned scan slot.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
  }
  const elapsedMs = now.getTime() - latestAttempt;
  if (elapsedMs < intervalMinutes * 60000 - 30000) {
    return { due: false, reason: "HTG v2 quota-safe interval has not elapsed.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, elapsed_seconds: Math.floor(elapsedMs / 1000), last_attempt_at: state.last_attempt_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
  }
  if (!clock.is_slot) {
    return { due: false, reason: "HTG v2 quota-safe interval elapsed; waiting for this account's assigned scan slot.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, elapsed_seconds: Math.floor(elapsedMs / 1000), last_attempt_at: state.last_attempt_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
  }
  return { due: true, reason: "HTG v2 quota-safe interval elapsed on this account's assigned scan slot.", interval_minutes: intervalMinutes, clock_slot_minutes: clock.minutes, next_clock_slot_at: clock.next_slot_at, elapsed_seconds: Math.floor(elapsedMs / 1000), last_attempt_at: state.last_attempt_at, shard_count: shardCount, current_shard: currentShard, user_shard: userShard, quota };
}

async function saveHtgV2Tracker(env, tracker, state, options = {}) {
  const checkedAt = firstString(options.checkedAt, new Date().toISOString());
  const metadata = htgV2Metadata(tracker?.metadata, state);
  const patch = { metadata, updated_at: checkedAt };
  if (state?.last_checked_at) patch.last_checked_at = state.last_checked_at;
  if (options.alert === true) patch.last_alert_at = state.last_alert_at || checkedAt;
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), patch);
  return { ...tracker, metadata, ...patch };
}

async function markHtgV2ScanFailed(env, tracker, error, attemptedAt = new Date()) {
  if (!tracker) return;
  const checkedAt = attemptedAt instanceof Date ? attemptedAt.toISOString() : new Date(attemptedAt).toISOString();
  const state = htgV2State(tracker);
  const errorText = String(error?.message || error || "Unknown HTG v2 scan error").slice(0, 1000);
  const nextState = {
    ...state,
    last_attempt_at: checkedAt,
    last_error_at: checkedAt,
    last_error: errorText,
    consecutive_failures: Math.max(0, Number(state.consecutive_failures || 0)) + 1,
    last_outcome: "failed",
    last_reason: errorText
  };
  nextState.scan_history = htgV2AppendScanHistory(state.scan_history, {
    completed_at: checkedAt,
    outcome: "failed",
    inventory_request_attempted: true,
    error_category: htgScanErrorCategory(errorText),
    alerts_posted: 0,
    reason: errorText
  });
  await saveHtgV2Tracker(env, tracker, nextState, { checkedAt });
}

function htgV2StateSummary(tracker) {
  const state = htgV2State(tracker);
  return {
    version: 2,
    baseline_captured_at: state.baseline?.captured_at || null,
    baseline_item_count: state.baseline?.items?.length || 0,
    pending: state.pending ? { observations: state.pending.observations, first_seen_at: state.pending.first_seen_at, candidate_count: state.pending.candidates.length } : null,
    last_attempt_at: state.last_attempt_at,
    last_checked_at: state.last_checked_at,
    last_outcome: state.last_outcome,
    last_error: state.last_error,
    consecutive_failures: state.consecutive_failures,
    refresh_quota: state.refresh_quota
  };
}

async function postHtgGainAlertIfNeededLegacy(env, user, tracker, options = {}) {
  const userId = String(user?.user_id || tracker?.roblox_user_id || "").trim();
  if (!userId) return { posted: false, reason: "No Roblox user_id was provided." };
  if (!tracker) return { posted: false, reason: "HTG gain alerts are not enabled for this Roblox account." };

  const now = new Date();
  // `force` forces alert evaluation, but it must not bypass the provider-refresh
  // budget. This keeps repeated diagnostics, deployments, and stale retries from
  // consuming the rolling daily allowance in a burst.
  const schedule = options.schedule || htgScheduleDecision(env, tracker, userId, now, {
    ignoreShard: true,
    force: options.force === true
  });
  if (!schedule.due) return { posted: false, skipped: true, ...schedule };

  const checkedAt = now.toISOString();
  const forceRefreshRequested = htgForceRefreshOnSchedule(env);
  const startedMetadata = await markHtgScanStarted(env, tracker, checkedAt, {
    ...schedule,
    trigger_source: firstString(options.source, "schedule"),
    force_refresh_requested: forceRefreshRequested
  });
  // Preserve the gate in later metadata writes made by pending/source-check
  // branches during this same scan.
  tracker = { ...tracker, metadata: startedMetadata };
  const raw = options.rawInventory || await fetchHtgInventory(env, { user_id: userId, username: user?.username || tracker.roblox_username || userId }, {
    forceRefresh: forceRefreshRequested,
    // Never let a token saved under one tracker silently read another Roblox
    // account. The live Profile identity is inexpensive to verify and is the
    // authoritative account label for an HTG scan.
    verifyIdentity: true
  });
  const inventorySelection = selectOwnedInventoryItems(raw, env);
  const rawItems = inventorySelection.items;
  const sourceMeta = inventorySourceMeta(raw);
  const verifiedUsername = firstString(sourceMeta?.verified_identity?.username);
  if (verifiedUsername) {
    // The verified ID already matches this tracker. Use the live account name
    // for compact state and alerts so a stale label cannot survive a rename.
    user = { ...user, username: verifiedUsername };
    tracker = { ...tracker, roblox_username: verifiedUsername };
  }
  if (envBool(env.INVENTORY_REJECT_EMPTY, true) && !rawItems.length) {
    console.warn("Big Games HTG inventory payload did not contain a verified owned-item array.", inventoryPayloadShape(raw));
    throw httpError(502, "Big Games returned no verified owned-inventory item array; HTG state was not advanced.");
  }

  const previousRows = await fetchHtgInventoryStateRows(env, userId);
  const currentRows = normalizeHtgInventoryStateRows(rawItems, tracker, user, checkedAt, {
    source: sourceMeta,
    inventory_selection_method: inventorySelection.method,
    inventory_items_path: inventorySelection.path
  });
  const sourceFreshness = htgInventorySourceFreshnessDecision(previousRows, sourceMeta);
  if (previousRows.length && !sourceFreshness.fresh) {
    const reason = sourceFreshness.quota_exhausted
      ? "Big Games refresh quota is exhausted; the cached HTG inventory was ignored and the comparison baseline was preserved."
      : "Big Games returned an unchanged or stale HTG inventory; the comparison baseline was preserved.";
    await markHtgSourceDeferred(env, tracker, {
      checkedAt,
      reason,
      outcome: sourceFreshness.quota_exhausted ? "quota_cached_revision" : "stale_cached_revision",
      source: sourceMeta,
      freshness: sourceFreshness,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(previousRows)
    });
    return {
      posted: false,
      skipped: true,
      reason,
      source_freshness: sourceFreshness,
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source: sourceMeta
    };
  }
  const state = hatchTrackerBaselineState(tracker);
  // Legacy tracker metadata can say a baseline exists even when the compact
  // state table is empty. Comparing against that empty table makes every item
  // in the current inventory look newly acquired, so require actual compact
  // rows before the tracker is allowed to emit gains.
  const hasCompactBaseline = previousRows.length > 0
    && !!firstString(tracker?.metadata?.htg_state?.last_checked_at);
  if (!state.armed || !hasCompactBaseline) {
    await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
      checkedAt,
      source: sourceMeta,
      inventorySelection
    });
    await markHtgGainStateChecked(env, tracker, {
      checkedAt,
      source: sourceMeta,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(currentRows),
      reason: "HTG compact inventory baseline was saved.",
      outcome: "baseline_saved"
    });
    return {
      posted: false,
      reason: "HTG compact inventory baseline was saved; future scans can alert on new HTG gains.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source: sourceMeta
    };
  }

  const candidates = await buildHtgGainCandidates(env, currentRows, previousRows, tracker);
  if (!candidates.length) {
    await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
      checkedAt,
      source: sourceMeta,
      inventorySelection
    });
    await markHtgGainStateChecked(env, tracker, {
      checkedAt,
      source: sourceMeta,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(currentRows),
      reason: "No enabled Huge, Titanic, or Gargantuan gains were detected.",
      outcome: "no_gain"
    });
    return {
      posted: false,
      reason: "No enabled Huge, Titanic, or Gargantuan gains were detected.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source: sourceMeta
    };
  }

  const period = htgGainSourceWindow(env, tracker, previousRows, checkedAt);
  const pendingBeforeScan = htgPendingGainState(tracker);
  const staleWindow = htgStaleAlertWindowDecision(env, period, checkedAt);
  // A long refresh gap is not proof that a real gain should be discarded. The
  // source filter can inspect the entire fresh-to-fresh window and distinguish
  // trades/mail/booth activity. Keep the legacy re-baseline behavior opt-in.
  if (!options.force && staleWindow.stale && !pendingBeforeScan.active && envBool(env.HTG_DROP_STALE_GAINS, false)) {
    await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
      checkedAt,
      source: sourceMeta,
      inventorySelection
    });
    await markHtgGainStateChecked(env, tracker, {
      checkedAt,
      source: sourceMeta,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(currentRows),
      reason: "HTG alert window was stale; compact state advanced without posting delayed alerts.",
      outcome: "stale_rebaseline",
      candidateCount: candidates.length
    });
    return {
      posted: false,
      skipped: true,
      reason: "HTG alert window was stale; compact state advanced without posting delayed alerts.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      stale_window: staleWindow,
      source: sourceMeta
    };
  }

  const sourceFilter = await filterHatchSourceGains(env, userId, candidates, period);
  if (!sourceFilter.available && htgRequireSourceFilter(env)) {
    const hold = htgSourceFilterHoldDecision(env, period, checkedAt);
    const pending = await saveHtgPendingGain(env, tracker, candidates, checkedAt, sourceFilter, { source: sourceMeta });
    return {
      posted: false,
      pending: true,
      reason: "HTG gain remains pending because trade, booth, or mail verification is unavailable; the baseline was preserved and the gain will be retried.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      source_filter_hold: hold,
      pending_gain: pending,
      source: sourceMeta
    };
  }

  // This is deliberately a hard safety boundary rather than a configurable
  // alert threshold. A missing, truncated, or incompatible baseline must never
  // turn an account's existing inventory into dozens of acquisition alerts.
  const bulkRisk = htgCompactBulkGainRisk(currentRows, previousRows, candidates);
  if (bulkRisk.risky) {
    await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
      checkedAt,
      source: sourceMeta,
      inventorySelection
    });
    await markHtgGainStateChecked(env, tracker, {
      checkedAt,
      source: sourceMeta,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(currentRows),
      reason: "HTG bulk-gain circuit breaker re-baselined the current inventory without posting.",
      outcome: "bulk_rebaseline",
      candidateCount: candidates.length
    });
    return {
      posted: false,
      skipped: true,
      reason: "HTG bulk-gain circuit breaker prevented an existing inventory from being posted as acquisitions.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      bulk_guard: bulkRisk,
      source: sourceMeta
    };
  }

  // Inventory refreshes can become visible before BIG Games publishes the
  // corresponding trade/booth/mail history row. Hold an otherwise-unmatched
  // gain for one additional scheduled observation so a just-completed transfer
  // cannot race the source history and masquerade as a hatch.
  const confirmationTarget = htgSourceConfirmationObservations(env);
  const samePendingGain = htgPendingGainContinues(pendingBeforeScan, candidates);
  const confirmationObservation = samePendingGain
    ? Math.max(1, Number(pendingBeforeScan.observations || 1)) + 1
    : 1;
  if (
    htgRequireSourceFilter(env) &&
    sourceFilter.available &&
    sourceFilter.unresolved.length &&
    confirmationObservation < confirmationTarget
  ) {
    const pending = await saveHtgPendingGain(env, tracker, candidates, checkedAt, sourceFilter, { source: sourceMeta });
    return {
      posted: false,
      pending: true,
      reason: "HTG gain is awaiting one confirmation scan so delayed trade, booth, or mail history can be matched before alerting.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      pending_gain: pending,
      source: sourceMeta
    };
  }

  const gainedHtg = sourceFilter.rows;
  if (!gainedHtg.length) {
    await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
      checkedAt,
      source: sourceMeta,
      inventorySelection
    });
    await markHtgGainStateChecked(env, tracker, {
      checkedAt,
      source: sourceMeta,
      rawItemCount: rawItems.length,
      htgItemCount: sumHtgStateCounts(currentRows),
      reason: "All enabled Huge, Titanic, or Gargantuan gains matched trade, booth, or mail activity.",
      outcome: "source_suppressed",
      sources: sourceFilter.sources,
      candidateCount: candidates.length
    });
    return {
      posted: false,
      reason: "All enabled Huge, Titanic, or Gargantuan gains matched trade, booth, or mail activity.",
      htg_state: compactHtgStateSummary(currentRows, previousRows),
      source_filter: compactHatchSourceFilterSummary(sourceFilter),
      source: sourceMeta
    };
  }

  const postedAlerts = await sendAndRecordHatchGainAlerts(env, tracker, user, gainedHtg, period, {
    userId,
    createdAt: checkedAt
  });

  await saveHtgInventoryState(env, tracker, user, currentRows, previousRows, {
    checkedAt,
    source: sourceMeta,
    inventorySelection
  });
  await markHtgGainStateChecked(env, tracker, {
    checkedAt,
    source: sourceMeta,
    rawItemCount: rawItems.length,
    htgItemCount: sumHtgStateCounts(currentRows),
    reason: "HTG gain alert posted.",
    outcome: "alert_posted",
    alert: true,
    alertsPosted: postedAlerts.length,
    sources: sourceFilter.sources,
    candidateCount: candidates.length
  });

  return {
    posted: true,
    alerts_posted: postedAlerts.length,
    items: postedAlerts.map(row => ({
      tier: row.tier,
      item: row.display_name,
      variant: row.variant,
      delta: row.delta
    })),
    htg_state: compactHtgStateSummary(currentRows, previousRows),
    source_filter: compactHatchSourceFilterSummary(sourceFilter),
    source: sourceMeta
  };
}

async function sendAndRecordHatchGainAlerts(env, tracker, user, gainedHtg, period, options = {}) {
  const userId = String(options.userId || user?.user_id || tracker?.roblox_user_id || "").trim();
  const createdAt = firstString(options.createdAt, new Date().toISOString());
  const posted = [];

  for (const gain of gainedHtg || []) {
    const payload = buildHatchAlertDiscordPayload(tracker, user, gain, [gain], period);
    const guildIds = hatchTrackerGuildIdsForTier(tracker, gain.tier);
    const discordResponse = await sendHatchAlert(env, payload, tracker, { guildIds });
    // The account may be tracked for future use but have no enabled subscription
    // in a server with an assigned alert channel.  Advance its state quietly;
    // otherwise a later assignment would replay an old acquisition.
    if (discordResponse?.skipped === true) continue;
    const row = {
      tracker_id: tracker.id || null,
      discord_user_id: tracker.discord_user_id,
      roblox_user_id: Number(userId),
      roblox_username: firstString(user.username, tracker.roblox_username, gain.roblox_username, userId),
      snapshot_start_id: options.snapshotStartId || null,
      snapshot_end_id: options.snapshotEndId || null,
      period_start: period.start.captured_at,
      period_end: period.end.captured_at,
      tier: gain.tier,
      item_key: gain.item_key,
      item_class: gain.item_class,
      item_id: gain.item_id,
      display_name: gain.display_name,
      variant: gain.variant,
      delta: gain.delta,
      rap: gain.rap || 0,
      icon: gain.icon || null,
      image_url: gain.image_url || null,
      all_gained: [compactHatchCandidate(gain)],
      discord_response: discordResponse || {},
      created_at: createdAt
    };
    await supabaseInsert(env, HATCH_ALERTS_TABLE, [row], "minimal");
    posted.push(row);
  }

  return posted;
}

async function postHatchAlertIfNeeded(env, user, latestSnapshot, options = {}) {
  if (!latestSnapshot?.id) return { posted: false, reason: "No latest snapshot was provided." };
  const userId = String(user.user_id || latestSnapshot.roblox_user_id || "").trim();
  if (!userId) return { posted: false, reason: "No Roblox user_id was provided." };

  const tracker = options.tracker || await fetchHatchTrackerByRobloxUser(env, userId);
  if (!tracker) return { posted: false, reason: "Hatch tracker is not enabled for this Roblox account." };
  if (!options.force && String(tracker.last_checked_snapshot_id || "") === String(latestSnapshot.id)) {
    return { posted: false, reason: "Snapshot was already checked.", snapshot_id: latestSnapshot.id };
  }

  const snapshots = sortAsc(await getUserSnapshots(env, userId, 10));
  const endIndex = snapshots.findIndex(snapshot => String(snapshot.id) === String(latestSnapshot.id));
  const end = endIndex >= 0 ? snapshots[endIndex] : snapshots[snapshots.length - 1];
  const start = endIndex > 0 ? snapshots[endIndex - 1] : snapshots[snapshots.length - 2];
  if (!start || !end || start.id === end.id) {
    await markHatchSnapshotChecked(env, tracker, latestSnapshot.id);
    return { posted: false, reason: "Need at least two snapshots before HTG gain alerts can compare inventory.", snapshot_id: latestSnapshot.id };
  }

  const diff = await buildDiffFromSnapshots(env, start, end);
  const enabledTiers = new Set(hatchTrackerEnabledTiers(tracker));
  const candidates = (await hatchAlertCandidates(env, diff.gained || []))
    .filter(row => enabledTiers.has(row.tier));
  const baselineDecision = hatchBaselineDecision(env, tracker, start, end, diff, candidates);
  if (baselineDecision.skip) {
    await markHatchSnapshotCheckedWithBaseline(env, tracker, end, baselineDecision);
    return {
      posted: false,
      reason: baselineDecision.reason,
      snapshot_id: end.id,
      baseline: {
        armed: baselineDecision.next_armed === true,
        stable_comparisons: baselineDecision.stable_comparisons,
        required_stable_comparisons: hatchBaselineStableComparisons(env),
        risk_reasons: baselineDecision.risk?.reasons || []
      }
    };
  }
  const historyFilter = await filterHatchHistoricalInventoryEchoes(env, userId, candidates, { start, end });
  if (!historyFilter.rows.length) {
    await markHatchSnapshotChecked(env, tracker, latestSnapshot.id);
    return {
      posted: false,
      reason: candidates.length && historyFilter.suppressed.length
        ? "All enabled Huge, Titanic, or Gargantuan gains were already present in recent inventory history."
        : "No enabled Huge, Titanic, or Gargantuan gains were detected.",
      snapshot_id: latestSnapshot.id,
      history_filter: compactHatchHistoryFilterSummary(historyFilter)
    };
  }
  const sourceFilter = await filterHatchSourceGains(env, userId, historyFilter.rows, { start, end });
  const gainedHtg = sourceFilter.rows;
  if (!gainedHtg.length) {
    await markHatchSnapshotChecked(env, tracker, latestSnapshot.id);
    return {
      posted: false,
      reason: candidates.length && sourceFilter.suppressed.length
        ? "All enabled Huge, Titanic, or Gargantuan gains matched trade, booth, or mail activity."
        : "No enabled Huge, Titanic, or Gargantuan gains were detected.",
      snapshot_id: latestSnapshot.id,
      history_filter: compactHatchHistoryFilterSummary(historyFilter),
      source_filter: compactHatchSourceFilterSummary(sourceFilter)
    };
  }

  const now = new Date().toISOString();
  const postedAlerts = await sendAndRecordHatchGainAlerts(env, tracker, {
    ...user,
    username: firstString(user.username, tracker.roblox_username, latestSnapshot.roblox_username, userId)
  }, gainedHtg, { start, end }, {
    userId,
    snapshotStartId: start.id,
    snapshotEndId: end.id,
    createdAt: now
  });

  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    last_checked_snapshot_id: latestSnapshot.id,
    last_checked_at: now,
    last_alert_snapshot_id: latestSnapshot.id,
    last_alert_at: now,
    updated_at: now
  });

  return {
    posted: true,
    alerts_posted: postedAlerts.length,
    items: postedAlerts.map(row => ({
      tier: row.tier,
      item: row.display_name,
      variant: row.variant,
      delta: row.delta
    })),
    snapshot_id: latestSnapshot.id,
    history_filter: compactHatchHistoryFilterSummary(historyFilter),
    source_filter: compactHatchSourceFilterSummary(sourceFilter)
  };
}

async function hatchAlertCandidates(env, rows) {
  const catalog = await getPetPowerCatalog(env).catch(() => ({ images: new Map() }));
  return (rows || [])
    .map(row => {
      const tier = hatchTier(row);
      return tier ? {
        ...row,
        tier,
        tier_priority: HATCH_TIER_PRIORITY[tier] || 0,
        image_url: hatchCandidateImageUrl(row, catalog.images)
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.tier_priority - a.tier_priority ||
      Number(b.rap || 0) - Number(a.rap || 0) ||
      Number(b.delta || 0) - Number(a.delta || 0) ||
      String(a.display_name || "").localeCompare(String(b.display_name || ""))
    );
}

function hatchCandidateImageUrl(row, catalogImages) {
  const raw = plainObject(row?.raw);
  const rawData = plainObject(raw.rawData);
  const configData = plainObject(raw.configData);
  const directValues = [
    row?.image_url,
    row?.imageUrl,
    row?.thumbnail_url,
    row?.thumbnailUrl,
    row?.thumbnail,
    row?.icon,
    raw.image_url,
    raw.imageUrl,
    raw.thumbnail_url,
    raw.thumbnailUrl,
    raw.thumbnail,
    raw.goldenThumbnail,
    raw.icon,
    raw.Icon,
    raw.goldenIcon,
    rawData.image_url,
    rawData.imageUrl,
    rawData.thumbnail_url,
    rawData.thumbnailUrl,
    rawData.thumbnail,
    rawData.goldenThumbnail,
    rawData.icon,
    rawData.Icon,
    configData.thumbnail,
    configData.goldenThumbnail
  ];
  for (const value of directValues) {
    const url = hatchRenderableDirectImageUrl(value);
    if (url) return url;
  }

  const catalogUrl = hatchCatalogImageUrl(row, catalogImages);
  return catalogUrl || HATCH_ALERT_THUMBNAIL_URL;
}

function hatchRenderableDirectImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return inventoryImageUrl(text);
  if (/^rbxassetid:\/\/\d+$/i.test(text) || /^\d{5,20}$/.test(text) || /[?&]id=\d{5,20}/i.test(text)) {
    return inventoryImageUrl(text);
  }
  return "";
}

function hatchCatalogImageUrl(row, catalogImages) {
  if (!(catalogImages instanceof Map) || !catalogImages.size) return "";
  const raw = plainObject(row?.raw);
  const rawData = plainObject(raw.rawData);
  const names = [
    row?.item_id,
    row?.display_name,
    raw.id,
    raw.itemId,
    raw.configName,
    raw.name,
    raw.displayName,
    rawData.id,
    rawData.configName,
    rawData.name
  ];
  for (const name of names) {
    const record = catalogImages.get(normalizePetName(name));
    if (!record) continue;
    const variant = normalizeVariantName(row?.variant || getVariant(raw));
    const rawImage = variant.includes("Golden")
      ? firstString(record.golden_thumbnail, record.thumbnail)
      : firstString(record.thumbnail, record.golden_thumbnail);
    const url = inventoryImageUrl(rawImage);
    if (url) return url;
  }
  return "";
}

function hatchTier(row) {
  if (!isPetInventoryRow(row)) return "";
  const name = normalizeHatchName(firstString(row.display_name, row.item_id, row.item_key));
  if (!name) return "";
  if (/\bgargantuan\b|\bgarg\b/.test(name)) return "gargantuan";
  if (/\btitanic\b/.test(name)) return "titanic";
  if (/\bhuge\b/.test(name)) return "huge";
  return "";
}

function isPetInventoryRow(row) {
  const raw = row?.raw && typeof row.raw === "object" ? row.raw : {};
  const values = [
    row?.item_class,
    row?.item_category,
    raw.class,
    raw.category,
    raw.collection,
    raw.type,
    raw.kind
  ].map(value => String(value || "").toLowerCase());
  const text = values.join(" ");
  if (/\b(enchant|potion|fruit|booth|hoverboard|ultimate|misc|currency|egg)\b/.test(text)) return false;
  if (values.some(value => value === "pet" || value === "pets" || value.includes("pet"))) return true;
  return /^(huge|titanic|gargantuan|garg)\b/i.test(firstString(row?.display_name, row?.item_id));
}

function normalizeHatchName(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickFeaturedHatch(rows) {
  return rows[0];
}

function compactHatchCandidate(row) {
  return {
    tier: row.tier,
    item_key: row.item_key,
    display_name: row.display_name,
    variant: row.variant,
    delta: row.delta,
    rap: row.rap || 0,
    image_url: row.image_url || null
  };
}

async function fetchHtgInventoryStateRows(env, userId) {
  return supabaseSelectAll(env, HTG_INVENTORY_STATE_TABLE, {
    select: "*",
    roblox_user_id: `eq.${String(userId || "").trim()}`,
    order: "item_match_key.asc"
  }, 10000);
}

function normalizeHtgInventoryStateRows(rawItems, tracker, user, checkedAt, context = {}) {
  const userId = String(user?.user_id || tracker?.roblox_user_id || "").trim();
  const username = firstString(user?.username, tracker?.roblox_username, userId);
  const rows = new Map();
  for (const item of rawItems || []) {
    const row = normalizeHtgInventoryStateItem(item, userId, username, checkedAt, context);
    if (!row) continue;
    const existing = rows.get(row.item_match_key);
    if (!existing) {
      rows.set(row.item_match_key, row);
      continue;
    }
    existing.count += row.count;
    existing.rap = Math.max(Number(existing.rap || 0), Number(row.rap || 0));
    existing.raw = row.raw || existing.raw;
    existing.metadata.stack_count = Number(existing.metadata.stack_count || 1) + 1;
  }
  return [...rows.values()].sort((a, b) =>
    (HATCH_TIER_PRIORITY[b.tier] || 0) - (HATCH_TIER_PRIORITY[a.tier] || 0)
    || String(a.display_name).localeCompare(String(b.display_name))
    || String(a.variant).localeCompare(String(b.variant))
  );
}

function normalizeHtgInventoryStateItem(item, userId, username, checkedAt, context = {}) {
  if (!item || typeof item !== "object") return null;
  if (!htgUniqueOwnershipAllowsUser(item, userId)) return null;
  const rawData = item.rawData && typeof item.rawData === "object" ? item.rawData : {};
  const itemClass = item.class || item.category || item.collection || item.type || "Pet";
  const itemId = item.id || item.itemId || item.configName || item.name || rawData.id || null;
  const displayName = item.displayName || item.display_name || item.name || itemId || item.stackKey || "Unknown item";
  const variant = getVariant(item);
  const count = Math.max(0, Number(htgItemCount(item) || 0));
  if (count <= 0) return null;
  const row = {
    roblox_user_id: Number(userId),
    roblox_username: username || null,
    item_key: getItemKey(item, itemClass, itemId, variant),
    item_class: itemClass,
    item_category: item.category || item.collection || itemClass || null,
    item_id: itemId,
    display_name: displayName,
    variant,
    count,
    rap: itemRap(item),
    icon: item.icon || item.goldenIcon || null,
    raw: item
  };
  const tier = hatchTier(row);
  if (!tier) return null;
  const sourceMatchKey = hatchSourceMatchKey(row) || row.item_key;
  return {
    ...row,
    tier,
    item_match_key: `${tier}|${sourceMatchKey}`,
    match_key: sourceMatchKey,
    image_url: null,
    last_seen_at: checkedAt,
    last_checked_at: checkedAt,
    metadata: {
      stack_count: 1,
      source_fetched_at: context.source?.fetched_at || null,
      source_is_stale: context.source?.is_stale ?? null,
      verified_roblox_user_id: context.source?.verified_identity?.user_id || null,
      verified_roblox_username: context.source?.verified_identity?.username || null,
      inventory_selection_method: context.inventory_selection_method || null,
      inventory_items_path: context.inventory_items_path || null
    }
  };
}

function htgUniqueOwnershipAllowsUser(item, userId) {
  const expected = String(userId || "").trim();
  if (!expected) return true;
  const ownership = htgUniqueOwnership(item);
  if (!ownership.hasOwnerLog || !ownership.userIds.length) return true;
  return ownership.userIds.includes(expected);
}

function htgUniqueOwnership(item) {
  const uniqueObjects = htgUniqueObjects(item);
  const userIds = new Set();
  let hasOwnerLog = false;

  for (const unique of uniqueObjects) {
    const log = Array.isArray(unique?._ol)
      ? unique._ol
      : Array.isArray(unique?.ol)
        ? unique.ol
        : null;
    if (!log?.length) continue;
    hasOwnerLog = true;
    for (const entry of log) {
      const userId = Array.isArray(entry)
        ? entry[0]
        : entry && typeof entry === "object"
          ? firstString(entry.user_id, entry.userId, entry.uid, entry.id)
          : null;
      const text = String(userId || "").trim();
      if (/^\d+$/.test(text)) userIds.add(text);
    }
  }

  return { hasOwnerLog, userIds: [...userIds] };
}

function htgUniqueObjects(item) {
  const rawData = item?.rawData && typeof item.rawData === "object" ? item.rawData : {};
  const stack = parseJsonObject(firstString(item?.stackKey, item?.stack_key));
  const candidates = [
    item?._uq,
    rawData?._uq,
    stack?._uq
  ];
  const output = [];
  const seen = new Set();
  for (const candidate of candidates) collect(candidate, "");
  return output;

  function collect(value, keyHint) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => collect(entry, `${keyHint}[${index}]`));
      return;
    }

    const hasOwnerLog = Array.isArray(value._ol) || Array.isArray(value.ol);
    const explicitId = firstString(value.uid, value._uid, value.id, value._id, value.uuid, value.serial);
    const children = Object.entries(value).filter(([, child]) => child && typeof child === "object");
    const looksLikeUniqueRecord = hasOwnerLog || explicitId || !children.length;
    if (!looksLikeUniqueRecord) {
      for (const [key, child] of children) collect(child, key);
      return;
    }

    const signature = explicitId
      ? `id:${explicitId}`
      : keyHint
        ? `key:${keyHint}:${stableJson(value)}`
        : `value:${stableJson(value)}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    output.push(value);
  }
}

function htgItemCount(item) {
  const stackCount = ownedQuantityValue(item);
  const uniqueCount = htgUniqueObjects(item).length;
  if (stackCount === null && uniqueCount === 0) return 1;
  return Math.max(Number(stackCount || 0), uniqueCount);
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function buildHtgGainCandidates(env, currentRows, previousRows, tracker) {
  const previous = new Map((previousRows || []).map(row => [row.item_match_key, Number(row.count || 0)]));
  const enabledTiers = new Set(hatchTrackerEnabledTiers(tracker));
  const gained = [];
  for (const row of currentRows || []) {
    if (!enabledTiers.has(row.tier)) continue;
    const before = Math.max(0, Number(previous.get(row.item_match_key) || 0));
    const after = Math.max(0, Number(row.count || 0));
    const delta = after - before;
    if (delta <= 0) continue;
    gained.push({ ...row, before, after, delta });
  }
  return hatchAlertCandidates(env, gained);
}

function htgCompactBulkGainRisk(currentRows, previousRows, candidates) {
  const current = Array.isArray(currentRows) ? currentRows : [];
  const previous = Array.isArray(previousRows) ? previousRows : [];
  const gained = Array.isArray(candidates) ? candidates : [];
  const currentTotal = sumHtgStateCounts(current);
  const candidateTotal = sumPositiveDelta(gained);
  const candidateDistinct = gained.length;
  const currentKeys = new Set(current.map(row => String(row?.item_match_key || "")).filter(Boolean));
  const previousKeys = new Set(previous.map(row => String(row?.item_match_key || "")).filter(Boolean));
  let overlappingKeys = 0;
  for (const key of currentKeys) {
    if (previousKeys.has(key)) overlappingKeys += 1;
  }
  const overlapRatio = currentKeys.size ? overlappingKeys / currentKeys.size : 1;
  const gainShare = currentTotal ? candidateTotal / currentTotal : 0;
  const allCurrentRowsAppearNew = currentKeys.size > 0
    && candidateDistinct >= currentKeys.size
    && overlappingKeys === 0;
  const reasons = [];

  if (!previous.length && current.length) reasons.push("missing_compact_baseline");
  if (allCurrentRowsAppearNew) reasons.push("zero_baseline_overlap");
  if (candidateDistinct >= 12) reasons.push("too_many_distinct_gains");
  if (candidateTotal >= 20 && gainShare >= 0.5) reasons.push("implausible_inventory_share");
  if (candidateDistinct >= 8 && overlapRatio < 0.25) reasons.push("low_baseline_overlap");

  return {
    risky: reasons.length > 0,
    reasons,
    previous_rows: previous.length,
    current_rows: current.length,
    candidate_rows: candidateDistinct,
    candidate_count: candidateTotal,
    current_count: currentTotal,
    overlapping_keys: overlappingKeys,
    overlap_ratio: Number(overlapRatio.toFixed(4)),
    gain_share: Number(gainShare.toFixed(4))
  };
}

async function saveHtgInventoryState(env, tracker, user, currentRows, previousRows, scan = {}) {
  const checkedAt = firstString(scan.checkedAt, new Date().toISOString());
  const currentKeys = new Set((currentRows || []).map(row => row.item_match_key));
  const missingIds = (previousRows || [])
    .filter(row => Number(row.count || 0) > 0 && !currentKeys.has(row.item_match_key) && row.id)
    .map(row => row.id);

  for (const ids of chunks(missingIds, 100)) {
    if (!ids.length) continue;
    await supabaseUpdate(env, HTG_INVENTORY_STATE_TABLE, { id: `in.(${ids.join(",")})` }, {
      count: 0,
      last_checked_at: checkedAt,
      updated_at: checkedAt,
      metadata: {
        source_fetched_at: scan.source?.fetched_at || null,
        source_is_stale: scan.source?.is_stale ?? null,
        inventory_selection_method: scan.inventorySelection?.method || null,
        inventory_items_path: scan.inventorySelection?.path || null,
        absent_in_latest_scan: true
      }
    });
  }

  const rows = (currentRows || []).map(row => ({
    tracker_id: tracker?.id || null,
    discord_user_id: tracker?.discord_user_id || null,
    roblox_user_id: Number(row.roblox_user_id || user?.user_id || tracker?.roblox_user_id),
    roblox_username: firstString(row.roblox_username, user?.username, tracker?.roblox_username) || null,
    item_match_key: row.item_match_key,
    tier: row.tier,
    item_key: row.item_key || null,
    item_class: row.item_class || null,
    item_id: row.item_id || null,
    display_name: row.display_name || null,
    variant: row.variant || null,
    count: Number(row.count || 0),
    rap: Number(row.rap || 0),
    icon: row.icon || null,
    image_url: row.image_url || null,
    raw: row.raw || {},
    metadata: row.metadata || {},
    last_seen_at: checkedAt,
    last_checked_at: checkedAt,
    updated_at: checkedAt
  }));
  await supabaseUpsert(env, HTG_INVENTORY_STATE_TABLE, rows, "roblox_user_id,item_match_key");
}

async function markHtgGainStateChecked(env, tracker, scan = {}) {
  const checkedAt = firstString(scan.checkedAt, new Date().toISOString());
  const refresh = plainObject(scan.source?.refresh);
  const metadataWithBaseline =
    hatchTrackerMetadataWithBaseline(tracker?.metadata, {
      armed: true,
      snapshot_id: firstString(tracker?.last_checked_snapshot_id),
      captured_at: checkedAt,
      item_count: Number(scan.rawItemCount || 0),
      stable_comparisons: hatchBaselineStableComparisons(env),
      reset_reason: firstString(scan.reason),
      risk_reasons: []
    });
  const metadata = hatchTrackerMetadataWithScanOutcome(
    env,
    metadataWithBaseline,
    {
      last_checked_at: checkedAt,
      last_scan_attempt_at: checkedAt,
      last_scan_error_at: null,
      last_scan_error: null,
      consecutive_scan_failures: 0,
      htg_item_count: Number(scan.htgItemCount || 0),
      raw_item_count: Number(scan.rawItemCount || 0),
      reason: firstString(scan.reason),
      source_fetched_at: scan.source?.fetched_at || null,
      source_is_stale: scan.source?.is_stale ?? null,
      refresh_quota: {
        used: Number(refresh.used || 0),
        limit: Number(refresh.limit || 0),
        quota_exhausted: refresh.quotaExhausted === true,
        resets_at: refresh.resetsAt || null,
        next_refresh_eligible_at: refresh.nextRefreshEligibleAt || null
      },
      pending_gain: null
    },
    {
      completed_at: checkedAt,
      outcome: firstString(scan.outcome, scan.alert ? "alert_posted" : "completed"),
      reason: firstString(scan.reason),
      source_fetched_at: scan.source?.fetched_at || null,
      source_is_stale: scan.source?.is_stale ?? null,
      refresh,
      refresh_fallback_used: scan.source?.refresh_fallback?.used === true,
      sources: scan.sources,
      candidate_count: scan.candidateCount,
      alerts_posted: scan.alertsPosted ?? (scan.alert ? 1 : 0)
    }
  );
  const patch = {
    metadata,
    last_checked_at: checkedAt,
    updated_at: checkedAt
  };
  if (scan.alert) {
    patch.last_alert_at = checkedAt;
  }
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), patch);
}

async function markHtgSourceDeferred(env, tracker, scan = {}) {
  const checkedAt = firstString(scan.checkedAt, new Date().toISOString());
  const refresh = plainObject(scan.source?.refresh);
  const metadata = hatchTrackerMetadataWithScanOutcome(env, tracker?.metadata, {
    last_checked_at: checkedAt,
    last_scan_attempt_at: checkedAt,
    last_scan_error_at: null,
    last_scan_error: null,
    consecutive_scan_failures: 0,
    htg_item_count: Number(scan.htgItemCount || 0),
    raw_item_count: Number(scan.rawItemCount || 0),
    reason: firstString(scan.reason),
    source_fetched_at: scan.source?.fetched_at || null,
    source_is_stale: scan.source?.is_stale ?? null,
    source_freshness: plainObject(scan.freshness),
    refresh_quota: {
      used: Number(refresh.used || 0),
      limit: Number(refresh.limit || 0),
      quota_exhausted: refresh.quotaExhausted === true,
      resets_at: refresh.resetsAt || null,
      next_refresh_eligible_at: refresh.nextRefreshEligibleAt || null
    }
    // Deliberately preserve pending_gain and the compact comparison rows.
  }, {
    completed_at: checkedAt,
    outcome: firstString(scan.outcome, "source_deferred"),
    reason: firstString(scan.reason),
    source_fetched_at: scan.source?.fetched_at || null,
    source_is_stale: scan.source?.is_stale ?? null,
    refresh,
    refresh_fallback_used: scan.source?.refresh_fallback?.used === true,
    candidate_count: scan.candidateCount
  });
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    metadata,
    last_checked_at: checkedAt,
    updated_at: checkedAt
  });
}

function hatchTrackerMetadataWithHtgState(metadata, statePatch) {
  const base = plainObject(metadata);
  return {
    ...base,
    htg_state: {
      ...plainObject(base.htg_state),
      ...(statePatch || {}),
      updated_at: new Date().toISOString()
    }
  };
}

function htgPendingGainState(tracker) {
  const pending = plainObject(tracker?.metadata?.htg_state?.pending_gain);
  const candidates = Array.isArray(pending.candidates) ? pending.candidates : [];
  return {
    active: pending.active === true && candidates.length > 0,
    signature: firstString(pending.signature),
    first_seen_at: firstString(pending.first_seen_at),
    last_seen_at: firstString(pending.last_seen_at),
    observations: Math.max(0, Number(pending.observations || 0)),
    candidates,
    source_filter: plainObject(pending.source_filter)
  };
}

function htgPendingGainSignature(candidates) {
  const rows = (candidates || [])
    .map(row => [
      firstString(row.item_match_key, hatchSourceMatchKey(row)),
      Math.max(0, Number(row.after || 0)),
      Math.max(0, Number(row.delta || 0))
    ])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify(rows);
}

function htgPendingGainContinues(existing, candidates) {
  if (!existing?.active) return false;
  if (existing.signature && existing.signature === htgPendingGainSignature(candidates)) return true;
  const current = new Map((candidates || []).map(row => [
    firstString(row.item_match_key, hatchSourceMatchKey(row)),
    Math.max(0, Number(row.after || 0))
  ]));
  const prior = Array.isArray(existing.candidates) ? existing.candidates : [];
  if (!prior.length) return false;
  // Additional copies or a second HTG acquired before the confirmation scan
  // must not reset confirmation forever. Every previously observed gain only
  // needs to remain present at an equal or higher owned count.
  return prior.every(row => {
    const key = firstString(row.item_match_key, hatchSourceMatchKey(row));
    return key && current.has(key) && Number(current.get(key)) >= Math.max(0, Number(row.after || 0));
  });
}

function compactHtgPendingCandidate(row) {
  return {
    item_match_key: firstString(row.item_match_key, hatchSourceMatchKey(row)),
    tier: row.tier || null,
    display_name: row.display_name || null,
    variant: row.variant || null,
    before: Math.max(0, Number(row.before || 0)),
    after: Math.max(0, Number(row.after || 0)),
    delta: Math.max(0, Number(row.delta || 0))
  };
}

async function saveHtgPendingGain(env, tracker, candidates, checkedAt, sourceFilter, scan = {}) {
  const existing = htgPendingGainState(tracker);
  const signature = htgPendingGainSignature(candidates);
  const sameObservation = htgPendingGainContinues(existing, candidates);
  const pending = {
    active: true,
    signature,
    first_seen_at: sameObservation ? existing.first_seen_at : checkedAt,
    last_seen_at: checkedAt,
    observations: sameObservation ? existing.observations + 1 : 1,
    candidates: (candidates || []).map(compactHtgPendingCandidate),
    source_filter: compactHatchSourceFilterSummary(sourceFilter)
  };
  const source = plainObject(scan.source);
  const metadata = hatchTrackerMetadataWithScanOutcome(env, tracker?.metadata, { pending_gain: pending }, {
    completed_at: checkedAt,
    outcome: sourceFilter?.available ? "pending_confirmation" : "pending_source_verification",
    reason: sourceFilter?.available
      ? "Gain is waiting for a confirmation observation."
      : firstString(sourceFilter?.reason, "Trade, booth, or mail verification is unavailable."),
    source_fetched_at: source.fetched_at || null,
    source_is_stale: source.is_stale ?? null,
    refresh: source.refresh,
    refresh_fallback_used: source.refresh_fallback?.used === true,
    sources: sourceFilter?.sources,
    candidate_count: (candidates || []).length
  });
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    metadata,
    updated_at: checkedAt
  });
  return pending;
}

function htgGainSourceWindow(env, tracker, previousRows, checkedAt) {
  const end = { captured_at: checkedAt };
  const latestPreviousCheck = (previousRows || [])
    .map(row => new Date(row.last_checked_at || row.updated_at || 0).getTime())
    .filter(time => Number.isFinite(time) && time > 0)
    .sort((a, b) => b - a)[0];
  const fallbackStart = new Date(new Date(checkedAt).getTime() - htgTrackerScanIntervalMinutes(env, tracker, new Date(checkedAt)) * 60000).toISOString();
  const latestFreshSource = latestHtgStateSourceFetchedAt(previousRows);
  const startAt = firstString(
    latestFreshSource,
    latestPreviousCheck ? new Date(latestPreviousCheck).toISOString() : "",
    tracker?.last_checked_at,
    tracker?.metadata?.hatch_baseline?.captured_at,
    fallbackStart
  );
  return { start: { captured_at: startAt }, end };
}

function latestHtgStateSourceFetchedAt(rows) {
  const times = (rows || [])
    .map(row => firstString(row?.metadata?.source_fetched_at))
    .map(value => ({ value, time: new Date(value || 0).getTime() }))
    .filter(row => row.value && Number.isFinite(row.time) && row.time > 0)
    .sort((a, b) => b.time - a.time);
  return times[0]?.value || "";
}

function htgInventorySourceFreshnessDecision(previousRows, source) {
  const currentFetchedAt = firstString(source?.fetched_at);
  const previousFetchedAt = latestHtgStateSourceFetchedAt(previousRows);
  const currentTime = new Date(currentFetchedAt || 0).getTime();
  const previousTime = new Date(previousFetchedAt || 0).getTime();
  const refresh = plainObject(source?.refresh);
  const quotaExhausted = refresh.quotaExhausted === true;

  if (!previousFetchedAt) {
    return {
      fresh: true,
      reason: "No prior source timestamp exists; this payload can establish the compact baseline.",
      current_fetched_at: currentFetchedAt || null,
      previous_fetched_at: null,
      source_is_stale: source?.is_stale ?? null,
      quota_exhausted: quotaExhausted
    };
  }

  const advanced = Number.isFinite(currentTime) && currentTime > 0
    && Number.isFinite(previousTime) && previousTime > 0
    && currentTime > previousTime;
  return {
    fresh: advanced,
    reason: advanced
      ? "Big Games returned a newer owned-inventory revision."
      : quotaExhausted
        ? "Big Games returned the previous cached revision because the daily refresh quota is exhausted."
        : "Big Games did not return a newer owned-inventory revision.",
    current_fetched_at: currentFetchedAt || null,
    previous_fetched_at: previousFetchedAt || null,
    source_is_stale: source?.is_stale ?? null,
    quota_exhausted: quotaExhausted,
    refresh_used: Number(refresh.used || 0),
    refresh_limit: Number(refresh.limit || 0),
    refresh_resets_at: refresh.resetsAt || null,
    next_refresh_eligible_at: refresh.nextRefreshEligibleAt || null
  };
}

function htgStaleAlertWindowMinutes(env) {
  const fallback = Math.max(30, htgScanIntervalMinutes(env) * 4);
  const value = Number(firstString(env.HTG_STALE_ALERT_WINDOW_MINUTES, env.HATCH_STALE_ALERT_WINDOW_MINUTES, fallback));
  return Number.isFinite(value) ? Math.max(htgScanIntervalMinutes(env), Math.min(1440, Math.floor(value))) : fallback;
}

function htgStaleAlertWindowDecision(env, period, checkedAt) {
  const windowMinutes = htgStaleAlertWindowMinutes(env);
  const startMs = new Date(period?.start?.captured_at || period?.start || 0).getTime();
  const endMs = new Date(checkedAt || period?.end?.captured_at || period?.end || Date.now()).getTime();
  const elapsedMs = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, endMs - startMs) : 0;
  return {
    stale: elapsedMs > windowMinutes * 60000,
    window_minutes: windowMinutes,
    elapsed_seconds: Math.floor(elapsedMs / 1000)
  };
}

function htgSourceFilterHoldMinutes(env) {
  const value = Number(env.HTG_SOURCE_FILTER_HOLD_MINUTES || env.HATCH_SOURCE_FILTER_HOLD_MINUTES || 20);
  return Number.isFinite(value) ? Math.max(5, Math.min(240, Math.floor(value))) : 20;
}

function htgSourceFilterHoldDecision(env, period, checkedAt) {
  const holdMinutes = htgSourceFilterHoldMinutes(env);
  const startMs = new Date(period?.start?.captured_at || period?.start || 0).getTime();
  const endMs = new Date(checkedAt || period?.end?.captured_at || period?.end || Date.now()).getTime();
  const elapsedMs = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, endMs - startMs) : 0;
  return {
    expired: elapsedMs >= holdMinutes * 60000,
    hold_minutes: holdMinutes,
    elapsed_seconds: Math.floor(elapsedMs / 1000)
  };
}

function compactHtgStateRow(row) {
  return {
    item_match_key: row.item_match_key || null,
    tier: row.tier || null,
    display_name: row.display_name || null,
    variant: row.variant || null,
    count: Number(row.count || 0),
    rap: Number(row.rap || 0),
    last_seen_at: row.last_seen_at || null,
    last_checked_at: row.last_checked_at || null,
    updated_at: row.updated_at || null,
    source_fetched_at: row?.metadata?.source_fetched_at || null,
    source_is_stale: row?.metadata?.source_is_stale ?? null
  };
}

function compactHtgStateSummary(currentRows, previousRows) {
  return {
    previous_rows: (previousRows || []).length,
    current_rows: (currentRows || []).length,
    current_count: sumHtgStateCounts(currentRows)
  };
}

function sumHtgStateCounts(rows) {
  return (rows || []).reduce((total, row) => total + Math.max(0, Number(row.count || 0)), 0);
}

async function filterHatchHistoricalInventoryEchoes(env, userId, rows, context = {}) {
  const candidates = Array.isArray(rows) ? rows : [];
  const lookbackHours = hatchHistoricalEchoLookbackHours(env);
  const unchanged = {
    rows: candidates,
    suppressed: [],
    adjusted: [],
    available: false,
    lookback_hours: lookbackHours,
    historical_snapshot_count: 0
  };
  if (!candidates.length || !envBool(env.HATCH_SUPPRESS_HISTORICAL_ECHOES, true)) return unchanged;

  const endTime = new Date(context?.end?.captured_at || 0).getTime();
  if (!Number.isFinite(endTime) || endTime <= 0) return unchanged;
  const cutoffMs = endTime - lookbackHours * 3600000;
  const snapshotLimit = Math.max(50, Math.min(300, Math.ceil(lookbackHours * 4)));
  const snapshots = sortAsc(await getUserSnapshots(env, userId, snapshotLimit))
    .filter(snapshot => {
      const time = new Date(snapshot?.captured_at || 0).getTime();
      return Number.isFinite(time)
        && time >= cutoffMs
        && time < endTime
        && String(snapshot?.id || "") !== String(context?.end?.id || "");
    });
  if (!snapshots.length) return unchanged;

  const maxPriorCountByKey = new Map();
  let checkedSnapshots = 0;
  for (const snapshot of snapshots) {
    const items = await getSnapshotItems(env, snapshot.id).catch(error => {
      console.warn("HTG historical echo snapshot read failed", snapshot.id, error?.message || error);
      return [];
    });
    if (!items.length) continue;
    checkedSnapshots += 1;
    for (const [key, count] of hatchMatchCounts(items).entries()) {
      maxPriorCountByKey.set(key, Math.max(Number(maxPriorCountByKey.get(key) || 0), count));
    }
  }
  if (!checkedSnapshots || !maxPriorCountByKey.size) return unchanged;

  const kept = [];
  const suppressed = [];
  const adjusted = [];
  for (const row of candidates) {
    const key = hatchSourceMatchKey(row);
    const delta = Math.max(0, Number(row.delta || 0));
    const endCount = Math.max(0, Number(row.after || 0));
    const historicalMax = Math.max(0, Number(maxPriorCountByKey.get(key) || 0));
    if (!key || delta <= 0 || historicalMax <= 0) {
      kept.push(row);
      continue;
    }

    const novelDelta = Math.max(0, endCount - historicalMax);
    if (novelDelta <= 0) {
      suppressed.push({ ...row, historical_max_count: historicalMax, historical_echo_suppressed_delta: delta });
      continue;
    }

    if (novelDelta < delta) {
      const adjustedRow = {
        ...row,
        before: Math.max(Number(row.before || 0), historicalMax),
        delta: novelDelta,
        historical_max_count: historicalMax,
        historical_echo_suppressed_delta: delta - novelDelta
      };
      kept.push(adjustedRow);
      adjusted.push(adjustedRow);
      continue;
    }

    kept.push(row);
  }

  return {
    rows: kept,
    suppressed,
    adjusted,
    available: true,
    lookback_hours: lookbackHours,
    historical_snapshot_count: checkedSnapshots
  };
}

function hatchMatchCounts(rows) {
  const counts = new Map();
  for (const row of rows || []) {
    const tier = hatchTier(row);
    if (!tier) continue;
    const key = hatchSourceMatchKey(row);
    if (!key) continue;
    counts.set(key, Number(counts.get(key) || 0) + Math.max(0, Number(row.count ?? row.after ?? row.delta ?? 0)));
  }
  return counts;
}

function compactHatchHistoryFilterSummary(filter) {
  return {
    available: filter?.available === true,
    lookback_hours: Number(filter?.lookback_hours || 0),
    historical_snapshot_count: Number(filter?.historical_snapshot_count || 0),
    suppressed_count: Array.isArray(filter?.suppressed) ? filter.suppressed.length : 0,
    adjusted_count: Array.isArray(filter?.adjusted) ? filter.adjusted.length : 0,
    suppressed: (filter?.suppressed || []).slice(0, 8).map(row => ({
      tier: row.tier,
      display_name: row.display_name,
      variant: row.variant,
      delta: row.delta,
      historical_max_count: row.historical_max_count,
      suppressed_delta: row.historical_echo_suppressed_delta
    }))
  };
}

function hatchBaselineDecision(env, tracker, start, end, diff, candidates) {
  if (!envBool(env.HATCH_BASELINE_PROTECTION_ENABLED, true)) {
    return { skip: false, state: hatchTrackerBaselineState(tracker), risk: null };
  }

  const state = hatchTrackerBaselineState(tracker);
  const risk = hatchSnapshotBackfillRisk(env, state, start, end, diff, candidates);
  const target = hatchBaselineStableComparisons(env);
  const hasBaseline = !!state.snapshot_id;

  if (!state.armed) {
    const stableComparisons = hasBaseline && !risk.risky
      ? Math.min(target, state.stable_comparisons + 1)
      : 0;
    const nextArmed = stableComparisons >= target;
    return {
      skip: true,
      next_armed: nextArmed,
      stable_comparisons: stableComparisons,
      reason: nextArmed
        ? "HTG baseline is armed; the next snapshot can alert."
        : risk.risky
          ? "HTG baseline reset because the inventory looked like a late Big Games backfill."
          : "HTG baseline is warming before alerts are allowed.",
      state,
      risk
    };
  }

  if (risk.risky) {
    return {
      skip: true,
      next_armed: false,
      stable_comparisons: 0,
      reason: "HTG alert suppressed because the inventory looked like a late Big Games backfill.",
      state,
      risk
    };
  }

  return { skip: false, next_armed: true, stable_comparisons: state.stable_comparisons || target, state, risk };
}

function hatchSnapshotBackfillRisk(env, state, start, end, diff, candidates) {
  const startCount = Math.max(0, Number(start?.item_count || 0));
  const endCount = Math.max(0, Number(end?.item_count || 0));
  const itemGrowth = Math.max(0, endCount - startCount);
  const itemGrowthRatio = startCount > 0 ? itemGrowth / startCount : itemGrowth > 0 ? 1 : 0;
  const candidateGainCount = sumPositiveDelta(candidates);
  const totalGainCount = sumPositiveDelta(diff?.gained || []);
  const reasons = [];

  if (
    !state.armed &&
    candidateGainCount > 0 &&
    itemGrowth >= hatchBackfillMinItemGrowth(env) &&
    itemGrowthRatio >= hatchBackfillItemGrowthRatio(env)
  ) {
    reasons.push("inventory_item_count_jump");
  }
  if (
    !state.armed &&
    candidateGainCount >= hatchBackfillHtgGainCount(env) &&
    itemGrowth >= Math.min(hatchBackfillMinItemGrowth(env), candidateGainCount)
  ) {
    reasons.push("bulk_htg_gain");
  }
  if (
    !state.armed &&
    candidateGainCount > 0 &&
    totalGainCount >= hatchBackfillTotalGainCount(env) &&
    itemGrowth >= hatchBackfillMinItemGrowth(env)
  ) {
    reasons.push("bulk_inventory_gain");
  }

  return {
    risky: reasons.length > 0,
    reasons,
    start_item_count: startCount,
    end_item_count: endCount,
    item_growth: itemGrowth,
    item_growth_ratio: itemGrowthRatio,
    candidate_gain_count: candidateGainCount,
    total_gain_count: totalGainCount
  };
}

function sumPositiveDelta(rows) {
  return (rows || []).reduce((total, row) => total + Math.max(0, Number(row?.delta || 0)), 0);
}

function hatchBaselineStableComparisons(env) {
  return Math.max(1, Math.floor(clampNumber(env.HATCH_BASELINE_STABLE_COMPARISONS, DEFAULT_HATCH_BASELINE_STABLE_COMPARISONS, 1, 12)));
}

function hatchBackfillMinItemGrowth(env) {
  return Math.max(0, Math.floor(clampNumber(env.HATCH_BACKFILL_MIN_ITEM_GROWTH, DEFAULT_HATCH_BACKFILL_MIN_ITEM_GROWTH, 0, 100000)));
}

function hatchBackfillItemGrowthRatio(env) {
  return clampNumber(env.HATCH_BACKFILL_ITEM_GROWTH_RATIO, DEFAULT_HATCH_BACKFILL_ITEM_GROWTH_RATIO, 0, 1);
}

function hatchBackfillHtgGainCount(env) {
  return Math.max(1, Math.floor(clampNumber(env.HATCH_BACKFILL_HTG_GAIN_COUNT, DEFAULT_HATCH_BACKFILL_HTG_GAIN_COUNT, 1, 1000)));
}

function hatchBackfillTotalGainCount(env) {
  return Math.max(1, Math.floor(clampNumber(env.HATCH_BACKFILL_TOTAL_GAIN_COUNT, DEFAULT_HATCH_BACKFILL_TOTAL_GAIN_COUNT, 1, 100000)));
}

function hatchHistoricalEchoLookbackHours(env) {
  return Math.max(1, Math.floor(clampNumber(env.HATCH_HISTORICAL_ECHO_LOOKBACK_HOURS, DEFAULT_HATCH_HISTORICAL_ECHO_LOOKBACK_HOURS, 1, 168)));
}

async function filterHatchSourceGains(env, userId, rows, period) {
  const candidates = Array.isArray(rows) ? rows : [];
  const ownership = partitionHatchCandidatesByOwnership(candidates, userId);
  const unchanged = {
    rows: ownership.firstOwner,
    suppressed: ownership.transferred,
    unresolved: ownership.unknown,
    available: false,
    reason: null,
    source_item_count: 0,
    sources: [],
    ownership: ownership.summary
  };
  if (!candidates.length || !ownership.unknown.length) return { ...unchanged, available: true };
  if (!envBool(env.HATCH_SOURCE_FILTER_ENABLED, true)) {
    return { ...unchanged, reason: "HATCH_SOURCE_FILTER_ENABLED is false." };
  }

  let grant;
  try {
    grant = await getUsableOAuthGrant(env, userId, "hatch_tracker");
  } catch (error) {
    return { ...unchanged, reason: error?.message || String(error) };
  }
  if (!grant) return { ...unchanged, reason: "No usable Big Games OAuth grant." };

  const scopes = oauthScopeSet(grant.scope);
  const missing = HATCH_SOURCE_ENDPOINTS
    .filter(endpoint => !scopes.has(endpoint.scope))
    .map(endpoint => endpoint.scope);
  if (missing.length) {
    return { ...unchanged, reason: `Grant is missing source scopes: ${missing.join(", ")}` };
  }

  let accessToken;
  try {
    accessToken = await openOAuthAccessToken(env, grant, "hatch_tracker");
  } catch (error) {
    return { ...unchanged, reason: `Could not open Big Games access token: ${error?.message || error}` };
  }
  if (String(grant.roblox_user_id || "").trim() !== String(userId || "").trim()) {
    return { ...unchanged, reason: "The saved Big Games grant does not match the tracked Roblox account." };
  }

  const fetched = await Promise.all(HATCH_SOURCE_ENDPOINTS.map(async endpoint => {
    try {
      const payload = await fetchAccountSourceWithAccessToken(env, accessToken, endpoint);
      const parsed = hatchSourceItemsFromPayload(endpoint, payload, userId, period);
      return { ok: parsed.recognized, endpoint, ...parsed, error: parsed.recognized ? null : parsed.reason };
    } catch (error) {
      return {
        ok: false,
        recognized: false,
        endpoint,
        error: error?.message || String(error),
        entries: [],
        items: [],
        entry_path: null,
        in_window_entry_count: 0,
        unrecognized_entry_count: 0
      };
    }
  }));

  const failed = fetched.filter(result => !result.ok);
  const sources = fetched.map(result => ({
    key: result.endpoint.key,
    ok: result.ok,
    recognized: result.recognized,
    entry_path: result.entry_path || null,
    entry_count: result.entries.length,
    in_window_entry_count: result.in_window_entry_count || 0,
    unrecognized_entry_count: result.unrecognized_entry_count || 0,
    item_count: result.items.length,
    ...(result.error ? { error: result.error } : {})
  }));
  if (failed.length) {
    return {
      ...unchanged,
      reason: `Source verification failed for ${failed.map(result => result.endpoint.key).join(", ")}.`,
      sources
    };
  }

  const sourceItems = fetched.flatMap(result => result.items);
  const filtered = suppressHatchSourceMatches(ownership.unknown, sourceItems);
  return {
    rows: [...ownership.firstOwner, ...filtered.rows],
    suppressed: [...ownership.transferred, ...filtered.suppressed],
    unresolved: filtered.rows,
    available: true,
    reason: null,
    source_item_count: sourceItems.length,
    sources,
    ownership: ownership.summary
  };
}

function partitionHatchCandidatesByOwnership(rows, userId) {
  const expectedUserId = String(userId || "").trim();
  const firstOwner = [];
  const transferred = [];
  const unknown = [];
  for (const row of rows || []) {
    const ownership = htgUniqueOwnership(row?.raw || row);
    const owners = ownership.userIds.map(value => String(value || "").trim()).filter(Boolean);
    if (!ownership.hasOwnerLog || !owners.length || !owners.includes(expectedUserId)) {
      unknown.push(row);
      continue;
    }
    if (owners.length === 1) {
      firstOwner.push({ ...row, hatch_verification: "first_owner_log" });
      continue;
    }
    transferred.push({
      ...row,
      hatch_verification: "prior_owner_log",
      source_matches: [{ source: "ownership_log", prior_owner_count: owners.length - 1 }]
    });
  }
  return {
    firstOwner,
    transferred,
    unknown,
    summary: {
      first_owner_count: firstOwner.length,
      prior_owner_count: transferred.length,
      unknown_count: unknown.length
    }
  };
}

async function fetchAccountSourceWithAccessToken(env, accessToken, endpoint) {
  const url = new URL(env[endpoint.envUrl] || endpoint.defaultUrl);
  const res = await fetch(url.toString(), {
    headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
    cf: { cacheTtl: 0 }
  });
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw httpError(502, `Big Games Player API returned non-JSON for ${endpoint.key}: ${text.slice(0, 160)}`); }
  if (res.status === 401) throw httpError(401, "Big Games authorization expired or was revoked. Run the OAuth authorization flow again.");
  if (res.status === 403) throw httpError(403, `Big Games token does not include the ${endpoint.label} permission. Re-authorize the app.`);
  if (!res.ok || payload.status === "error") throw httpError(502, `Big Games Player API ${endpoint.key} fetch failed: ${JSON.stringify(payload).slice(0, 300)}`);
  attachResponseHeaders(payload, res.headers);
  return payload;
}

function hatchSourceItemsFromPayload(endpoint, payload, userId, period) {
  const extracted = hatchSourceEntriesFromPayload(endpoint, payload);
  const entries = extracted.entries;
  const output = [];
  let inWindowEntryCount = 0;
  let unrecognizedEntryCount = 0;
  for (const entry of entries) {
    if (!hatchSourceEntryInWindow(entry, period)) continue;
    inWindowEntryCount += 1;
    const received = hatchSourceReceivedItems(endpoint.key, entry, userId);
    if (!received.recognized) {
      unrecognizedEntryCount += 1;
      continue;
    }
    for (const item of received.items) {
      const normalized = normalizeHatchSourceItem(item, endpoint, entry);
      if (normalized) output.push(normalized);
    }
  }
  const recognized = extracted.recognized && unrecognizedEntryCount === 0;
  return {
    recognized,
    reason: recognized
      ? null
      : !extracted.recognized
        ? `Big Games ${endpoint.key} payload did not contain a recognized history list.`
        : `${unrecognizedEntryCount} recent ${endpoint.key} record(s) used an unrecognized received-item shape.`,
    entries,
    items: output,
    entry_path: extracted.path,
    in_window_entry_count: inWindowEntryCount,
    unrecognized_entry_count: unrecognizedEntryCount
  };
}

function hatchSourceEntriesFromPayload(endpoint, payload) {
  const sourceKey = String(endpoint?.key || "").trim();
  const aliases = sourceKey === "trades"
    ? ["trades", "tradeHistory", "trade_history", "transactions"]
    : sourceKey === "booth"
      ? ["booth", "boothHistory", "booth_history", "purchases", "sales", "transactions"]
      : ["mail", "mailHistory", "mail_history", "messages", "transactions"];
  const candidates = [
    ["data", "entries"],
    ...aliases.map(key => ["data", key]),
    ["data", "history"],
    ["data", "records"],
    ["data", "results"],
    ["data", "items"],
    ["entries"],
    ...aliases.map(key => [key]),
    ["history"],
    ["records"],
    ["results"],
    ["items"],
    ["data"]
  ];
  for (const path of candidates) {
    let value = payload;
    for (const key of path) value = value && typeof value === "object" ? value[key] : undefined;
    if (Array.isArray(value)) return { recognized: true, entries: value, path: path.join(".") };
  }
  return { recognized: false, entries: [], path: null };
}

function hatchSourceReceivedItems(sourceKey, entry, userId) {
  if (!entry || typeof entry !== "object") return { recognized: false, items: [] };
  if (sourceKey === "mail") {
    if (!isIncomingHatchMail(entry, userId)) return { recognized: true, items: [] };
    const mailKeys = ["received", "receivedItems", "received_items", "itemsReceived", "items_received", "item", "items"];
    for (const key of mailKeys) {
      if (!Object.prototype.hasOwnProperty.call(entry, key)) continue;
      return { recognized: true, items: flattenHatchSourceItems(entry[key]) };
    }
    return { recognized: false, items: [] };
  }

  const receivedKeys = [
    "received", "receiving", "receive", "receivedItems", "received_items",
    "itemsReceived", "items_received", "gained", "incoming", "incomingItems", "incoming_items"
  ];
  for (const key of receivedKeys) {
    if (!Object.prototype.hasOwnProperty.call(entry, key)) continue;
    return { recognized: true, items: flattenHatchSourceItems(entry[key]) };
  }

  const receiverId = partyUserId(entry.receiver || entry.recipient || entry.buyer);
  if (receiverId) {
    if (receiverId !== String(userId || "").trim()) return { recognized: true, items: [] };
    const party = entry.receiver || entry.recipient || entry.buyer;
    const items = flattenHatchSourceItems(party?.received ?? party?.items ?? entry.items ?? entry.item);
    if (items.length || Object.prototype.hasOwnProperty.call(entry, "items") || Object.prototype.hasOwnProperty.call(entry, "item")) {
      return { recognized: true, items };
    }
  }
  return { recognized: false, items: [] };
}

function flattenHatchSourceItems(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(item => flattenHatchSourceItems(item, depth + 1));
  if (typeof value !== "object") return [];

  const object = value;
  if (hatchSourceLooksLikeItem(object)) return [object];
  const containerKeys = ["items", "pets", "inventory", "received", "data", "contents", "rewards"];
  const output = [];
  for (const key of containerKeys) {
    if (!Object.prototype.hasOwnProperty.call(object, key)) continue;
    output.push(...flattenHatchSourceItems(object[key], depth + 1));
  }
  if (output.length) return output;

  // Some save payloads key item stacks by an opaque UUID rather than placing
  // them in an `items` array. Only recurse into values that themselves look
  // like an item/container; party and timestamp metadata is therefore ignored.
  return Object.values(object).flatMap(item => {
    if (!item || typeof item !== "object") return [];
    return hatchSourceLooksLikeItem(item) || Array.isArray(item)
      ? flattenHatchSourceItems(item, depth + 1)
      : [];
  });
}

async function handleHatchDiagnosticsSummary(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const includeHistory = parseBool(url.searchParams.get("include_history")) !== false;
  const historyLimit = Math.max(1, Math.min(htgScanHistoryLimit(env), Number(url.searchParams.get("history_limit") || 24)));
  const now = new Date();
  const [trackers, guildConfigs] = await Promise.all([
    fetchEnabledHatchTrackers(env),
    fetchEnabledHatchGuildConfigs(env)
  ]);
  const guildConfigById = new Map(guildConfigs.map(config => [String(config?.guild_id || "").trim(), config]));
  const accounts = await Promise.all(trackers.map(async tracker => {
    const userId = String(tracker?.roblox_user_id || "").trim();
    const state = htgV2State(tracker);
    const completeHistory = state.scan_history;
    const history = completeHistory.slice(0, historyLimit);
    const recent = htgRecentScanUsage(completeHistory, now);
    const scheduler = htgV2ScheduleDecision(env, tracker, userId, now, { ignoreShard: true });
    const authorization = await oauthStatus(env, userId, "hatch_tracker");
    const subscriptions = hatchTrackerGuildSubscriptions(tracker).filter(subscription => subscription.enabled).map(subscription => {
      const guildConfig = guildConfigById.get(subscription.guild_id);
      return {
        guild_id: subscription.guild_id,
        tiers: subscription.tiers,
        channel_assigned: Boolean(String(guildConfig?.channel_id || "").trim()),
        channel_id: String(guildConfig?.channel_id || "").trim() || null
      };
    });
    return {
      roblox_user_id: userId || null,
      roblox_username: firstString(tracker?.roblox_username, userId) || null,
      enabled_tiers: hatchTrackerEnabledTiers(tracker),
      authorization: {
        connected: Boolean(authorization.connected),
        reauthorization_required: Boolean(authorization.reauthorization_required),
        authorization_expires_at: authorization.expires_at || null,
        missing_scopes: authorization.missing_scopes || [],
        message: authorization.message || null
      },
      delivery: {
        active_server_count: subscriptions.length,
        assigned_server_count: subscriptions.filter(subscription => subscription.channel_assigned).length,
        subscriptions
      },
      last_checked_at: state.last_checked_at || tracker?.last_checked_at || null,
      last_scan_attempt_at: state.last_attempt_at || null,
      last_alert_at: tracker?.last_alert_at || null,
      last_outcome: history[0] || state.last_outcome || null,
      last_scan_reason: state.last_reason || null,
      last_scan_error_at: state.last_error_at || null,
      last_scan_error: state.last_error || null,
      error_category: state.last_error ? htgScanErrorCategory(state.last_error) : null,
      consecutive_scan_failures: state.consecutive_failures,
      pending_gain: state.pending || { active: false, candidates: [] },
      active_scan: null,
      provider_refresh_quota: state.refresh_quota || null,
      scheduler,
      observed_usage_last_24h: recent,
      htg_v2: htgV2StateSummary(tracker),
      ...(includeHistory ? { pull_ledger: history } : {})
    };
  }));
  return json({
    ok: true,
    service: "ps99-inventory-detector",
    build_id: INVENTORY_BUILD_ID,
    generated_at: now.toISOString(),
    note: "This endpoint is read-only. It does not call BIG Games or consume a provider refresh.",
    health: compactHatchTrackerHealth(trackers, env, now),
    accounts
  });
}

function hatchSourceLooksLikeItem(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const nested = plainObject(value.item);
  const data = plainObject(value.data);
  return [value, nested, data].some(item => firstString(
    item.id,
    item.itemId,
    item.item_id,
    item.configName,
    item.config_name,
    item.displayName,
    item.display_name,
    item.stackKey,
    item.stack_key,
    item.name
  ));
}

function isIncomingHatchMail(entry, userId) {
  const normalizedUserId = String(userId || "").trim();
  const receiverId = partyUserId(entry.receiver);
  const senderId = partyUserId(entry.sender);
  if (receiverId) return receiverId === normalizedUserId;
  if (senderId) return senderId !== normalizedUserId;
  return true;
}

function partyUserId(party) {
  if (!party || typeof party !== "object") return "";
  return String(party.uid || party.userId || party.user_id || party.robloxUserId || party.roblox_user_id || "").trim();
}

function hatchSourceEntryInWindow(entry, period) {
  const timestamp = sourceEntryTimeMs(entry);
  if (!timestamp) return false;
  const start = new Date(period?.start?.captured_at || period?.start || 0).getTime();
  const end = new Date(period?.end?.captured_at || period?.end || Date.now()).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
  const padding = HATCH_SOURCE_WINDOW_PADDING_MINUTES * 60000;
  return timestamp >= start - padding && timestamp <= end + padding;
}

function sourceEntryTimeMs(entry) {
  const raw = entry?.timestamp ?? entry?.time ?? entry?.createdAt ?? entry?.created_at
    ?? entry?.updatedAt ?? entry?.updated_at ?? entry?.completedAt ?? entry?.completed_at
    ?? entry?.tradedAt ?? entry?.traded_at ?? entry?.claimedAt ?? entry?.claimed_at ?? entry?.date;
  if (raw === null || raw === undefined || raw === "") return 0;
  const number = Number(raw);
  if (Number.isFinite(number)) return number > 100000000000 ? number : number * 1000;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHatchSourceItem(item, endpoint, entry) {
  if (!item || typeof item !== "object") return null;
  const details = [plainObject(item.item), plainObject(item.data), plainObject(item.rawData)]
    .find(candidate => hatchSourceLooksLikeItem(candidate)) || {};
  const normalizedItem = {
    ...details,
    ...item,
    rawData: {
      ...plainObject(details.rawData),
      ...plainObject(item.rawData),
      ...plainObject(details.data)
    }
  };
  const itemClass = firstString(normalizedItem.class, normalizedItem.type, normalizedItem.category, normalizedItem.collection, "Pet");
  const itemId = firstString(
    normalizedItem.id,
    normalizedItem.itemId,
    normalizedItem.item_id,
    normalizedItem.configName,
    normalizedItem.config_name,
    normalizedItem.name
  );
  const displayName = firstString(
    normalizedItem.displayName,
    normalizedItem.display_name,
    normalizedItem.name,
    itemId,
    normalizedItem.stackKey,
    normalizedItem.stack_key,
    "Unknown item"
  );
  const variant = getVariant(normalizedItem);
  const count = Math.max(0, Math.floor(Number(itemCount(normalizedItem)) || 0));
  const raw = {
    ...normalizedItem,
    class: itemClass,
    category: firstString(normalizedItem.category, normalizedItem.collection, itemClass),
    collection: firstString(normalizedItem.collection, normalizedItem.category, itemClass)
  };
  const row = {
    item_key: getItemKey(normalizedItem, itemClass, itemId, variant),
    item_class: itemClass,
    item_category: raw.category || raw.collection || null,
    item_id: itemId,
    display_name: displayName,
    variant,
    delta: count || 1,
    rap: itemRap(normalizedItem),
    icon: firstString(normalizedItem.icon, normalizedItem.goldenIcon),
    raw,
    source: endpoint.key,
    source_label: endpoint.label,
    source_timestamp: firstString(
      entry?.timestamp,
      entry?.time,
      entry?.createdAt,
      entry?.created_at,
      entry?.completedAt,
      entry?.completed_at,
      entry?.tradedAt,
      entry?.traded_at
    ) || null
  };
  const tier = hatchTier(row);
  return tier ? { ...row, tier, match_key: hatchSourceMatchKey(row) } : null;
}

function suppressHatchSourceMatches(rows, sourceItems) {
  const pool = new Map();
  for (const item of sourceItems || []) {
    const key = hatchSourceMatchKey(item);
    if (!key) continue;
    const existing = pool.get(key) || { count: 0, sources: [] };
    existing.count += Math.max(0, Number(item.delta || 0));
    existing.sources.push({ source: item.source, timestamp: item.source_timestamp || null });
    pool.set(key, existing);
  }

  const kept = [];
  const suppressed = [];
  for (const row of rows || []) {
    const key = hatchSourceMatchKey(row);
    const available = pool.get(key);
    const delta = Math.max(0, Number(row.delta || 0));
    if (!key || !available || available.count <= 0 || delta <= 0) {
      kept.push(row);
      continue;
    }

    const amount = Math.min(delta, available.count);
    suppressed.push({ ...row, delta: amount, source_matches: available.sources.slice(0, 3) });
    available.count -= amount;
    if (delta > amount) kept.push({ ...row, delta: delta - amount, source_suppressed_delta: amount });
  }
  return { rows: kept, suppressed };
}

function hatchSourceMatchKey(row) {
  const baseName = hatchSourceBaseName(firstString(row?.display_name, row?.item_id, row?.item_key));
  if (!baseName) return "";
  return [
    baseName,
    normalizeVariantForMatch(row?.variant || getVariant(row?.raw || {}))
  ].join("|");
}

function hatchSourceBaseName(value) {
  return normalizeHatchName(value)
    .replace(/\b(shiny|rainbow|golden|regular|normal)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVariantForMatch(value) {
  const text = String(value || "Normal").trim().toLowerCase().replace(/\s+/g, " ");
  if (!text || text === "regular") return "normal";
  return text;
}

function oauthScopeSet(scope) {
  return new Set(String(scope || "").split(/[,\s]+/).map(value => value.trim()).filter(Boolean));
}

function compactHatchSourceFilterSummary(filter) {
  if (!filter) return null;
  return {
    available: !!filter.available,
    reason: filter.reason || null,
    source_item_count: filter.source_item_count || 0,
    suppressed_count: (filter.suppressed || []).length,
    unresolved_count: (filter.unresolved || []).length,
    ownership: filter.ownership || null,
    sources: filter.sources || []
  };
}

function buildHatchAlertDiscordPayload(tracker, user, featured, gainedHtg, snapshots) {
  {
    const alertDiscordUserId = String(tracker.discord_user_id || "").trim();
    const alertUsername = firstString(user.username, tracker.roblox_username, featured.roblox_username, user.user_id, "Someone");
    const alertDisplayItem = hatchFullDisplayItemName(featured);
    const alertTier = hatchTierLabel(featured.tier);
    const alertTheme = hatchAlertTheme(featured.tier);
    const alertImageUrl = featured.image_url || HATCH_ALERT_THUMBNAIL_URL;
    const alertRap = featured.rap > 0 ? shortInventoryNumber(featured.rap) : "Unknown";
    const alertExists = hatchExistsCount(featured);
    const alertQuantity = Number(featured.delta) > 1 ? ` x${shortInventoryNumber(featured.delta)}` : "";
    const alertPlayer = alertDiscordUserId
      ? `**Player:** **<@${alertDiscordUserId}>** (${escapeDiscordMarkdown(alertUsername)})`
      : `**Player:** **${escapeDiscordMarkdown(alertUsername)}**`;
    const alertAlsoAcquired = gainedHtg.length > 1
      ? `*Also acquired:* ${gainedHtg.slice(1, 5).map(row => {
          const quantity = Number(row.delta) > 1 ? ` x${shortInventoryNumber(row.delta)}` : "";
          return `${escapeDiscordMarkdown(hatchFullDisplayItemName(row))}${quantity}`;
        }).join(", ")}`
      : "";
    const alertLines = [
      `${alertTheme.icon} **${escapeDiscordMarkdown(alertUsername)} acquired a ${escapeDiscordMarkdown(alertDisplayItem)}${alertQuantity}** :sparkles:`,
      alertPlayer,
      `**RAP:** ${alertRap}`,
      `**Exists:** ${alertExists === null ? "Unknown" : shortInventoryNumber(alertExists)}`,
      "-# *Luna ignores HTGs from booth purchases, mail, or trades when their source history confirms it. :brain:*"
    ].filter(Boolean);
    const bodyComponents = [
      {
        type: 9,
        components: [
          {
            type: 10,
            content: alertLines.join("\n")
          }
        ],
        accessory: {
          type: 11,
          media: { url: alertImageUrl },
          description: `${alertTier} ${alertDisplayItem}`
        }
      }
    ];
    if (alertAlsoAcquired) {
      bodyComponents.push(
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: alertAlsoAcquired }
      );
    }

    return {
      username: LUNA_WEBHOOK_USERNAME,
      avatar_url: LUNA_AVATAR_URL,
      allowed_mentions: alertDiscordUserId ? { users: [alertDiscordUserId] } : { parse: [] },
      flags: DISCORD_COMPONENTS_V2_FLAG,
      components: [
        {
          type: 17,
          accent_color: alertTheme.accent,
          components: bodyComponents
        }
      ]
    };
  }

}

function hatchAlertTheme(tier) {
  const normalized = String(tier || "").toLowerCase();
  if (normalized === "gargantuan") {
    return { title: "Gargantuan Acquired", icon: ":gem:", accent: 0xffd44d };
  }
  if (normalized === "titanic") {
    return { title: "Titanic Acquired", icon: ":milky_way:", accent: 0xff5db8 };
  }
  return { title: "Huge Acquired", icon: ":sparkles:", accent: 0x34e1ef };
}

function buildHatchAuthorizationExpiredDiscordPayload(tracker) {
  const discordUserId = String(tracker?.discord_user_id || "").trim();
  const username = escapeDiscordMarkdown(firstString(tracker?.roblox_username, tracker?.roblox_user_id, "this Roblox account"));
  const player = discordUserId ? `<@${discordUserId}>` : `**${username}**`;
  return {
    username: LUNA_WEBHOOK_USERNAME,
    avatar_url: LUNA_AVATAR_URL,
    allowed_mentions: discordUserId ? { users: [discordUserId] } : { parse: [] },
    flags: DISCORD_COMPONENTS_V2_FLAG,
    components: [{
      type: 17,
      accent_color: 0xffc857,
      components: [{
        type: 10,
        content: [
          ":warning: **BIG Games inventory access expired**",
          `${player}, HTG alerts for **${username}** are paused until you renew inventory access.`,
          "Run `/htg enable tier:All` in this server to reconnect.",
          "-# BIG Games limits this authorization to 30 days, unfortunately."
        ].join("\n")
      }]
    }]
  };
}

// This is intentionally separate from the scan cadence. Checking a saved expiry
// timestamp consumes no BIG Games request and gives the member one clear notice
// at expiry, in every server where they explicitly enabled HTG alerts.
async function notifyHatchAuthorizationExpiryIfNeeded(env, tracker, now = new Date()) {
  const targetGuildIds = hatchAuthorizationExpiryNoticeGuildIdsNeeded(tracker, now);
  if (!targetGuildIds.length) return { notified: false, skipped: true, reason: "authorization_active_or_already_notified" };
  const expiry = firstString(tracker?.authorization_expires_at);
  const delivery = await sendHatchAlert(
    env,
    buildHatchAuthorizationExpiredDiscordPayload(tracker),
    tracker,
    { guildIds: targetGuildIds }
  );
  const deliveredGuildIds = (delivery.destinations || [])
    .map(destination => String(destination?.guild_id || "").trim())
    .filter(guildId => /^\d{10,24}$/.test(guildId));
  if (deliveredGuildIds.length) {
    await updateHatchTrackerRow(env, tracker, {
      metadata: hatchTrackerMetadataWithAuthorizationExpiryNotice(
        tracker.metadata,
        expiry,
        deliveredGuildIds,
        now.toISOString()
      ),
      updated_at: now.toISOString()
    });
  }
  return {
    notified: deliveredGuildIds.length > 0,
    expires_at: expiry,
    delivery
  };
}

async function sendHatchAlert(env, payload, tracker = null, options = {}) {
  const assignedConfigs = await fetchEnabledHatchGuildConfigs(env).catch(() => []);
  const botToken = String(env.DISCORD_BOT_TOKEN || "").trim();
  const subscribedGuildIds = [...new Set((Array.isArray(options.guildIds) ? options.guildIds : hatchTrackerAlertGuildIds(tracker))
    .map(value => String(value || "").trim())
    .filter(value => /^\d{10,24}$/.test(value)))];

  // HTG alerts never fall back to a global webhook or another server's channel.
  // A player must explicitly enable the tier in this server, and that server must
  // have explicitly assigned a channel with /htg assign.
  if (!subscribedGuildIds.length) {
    return {
      ok: true,
      skipped: true,
      reason: "no_server_scoped_htg_subscription",
      mode: "server_scoped_channels",
      destinations: []
    };
  }
  if (!botToken) {
    throw httpError(500, "HTG gain alerts have server subscriptions, but DISCORD_BOT_TOKEN is not set on the inventory Worker.");
  }

  const subscribed = new Set(subscribedGuildIds);
  const targetConfigs = assignedConfigs.filter(config => subscribed.has(String(config.guild_id || "").trim()));
  if (!targetConfigs.length) {
    return {
      ok: true,
      skipped: true,
      reason: "no_assigned_channel_in_subscribed_server",
      mode: "server_scoped_channels",
      requested_guild_ids: subscribedGuildIds,
      destinations: []
    };
  }

  {
    const destinations = [];
    const failures = [];
    for (const config of targetConfigs) {
      const channelId = String(config.channel_id || "").trim();
      if (!channelId) continue;
      try {
        const posted = await sendHatchAlertBotMessage(channelId, botToken, payload);
        destinations.push({
          guild_id: config.guild_id || null,
          channel_id: channelId,
          response: posted
        });
      } catch (error) {
        failures.push({
          guild_id: config.guild_id || null,
          channel_id: channelId,
          error: String(error?.message || error || "Discord post failed").slice(0, 500)
        });
      }
    }
    if (!destinations.length) {
      const detail = failures.length
        ? failures.map(row => `${row.guild_id || "unknown"}/${row.channel_id}: ${row.error}`).join(" | ")
        : "none of the assignments contain a channel_id";
      throw httpError(500, `HTG gain alert failed for every subscribed server channel: ${detail}`);
    }
    // A failure in one guild must not make a successful guild receive the same
    // acquisition again on the next scan. Report partial delivery, then allow
    // inventory state and the alert ledger to advance.
    return {
      ok: failures.length === 0,
      partial: failures.length > 0,
      mode: "server_scoped_channels",
      destinations,
      failures
    };
  }
}

// BIG Games' enriched inventory response supplies `exists` as the total
// in-game count for that exact item stack. Keep the lookup narrow so an
// owner's own `count` never accidentally appears as the global Exists value.
function hatchExistsCount(item) {
  const sources = [
    plainObject(item),
    plainObject(item?.raw),
    plainObject(item?.raw?.rawData),
    plainObject(item?.raw?.configData),
    plainObject(item?.rawData),
    plainObject(item?.configData)
  ];
  const keys = ["exists", "existCount", "existsCount", "globalCount", "exist_count", "global_count"];
  for (const source of sources) {
    for (const key of keys) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value >= 0) return Math.floor(value);
    }
  }
  return null;
}

async function sendHatchAlertBotMessage(channelId, botToken, payload) {
  const { username, avatar_url, ...botPayload } = payload;
  const res = await fetch(`${DISCORD_API_BASE}/channels/${encodeURIComponent(channelId)}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(botPayload)
  });
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Discord HTG gain alert bot post failed: ${text.slice(0, 500)}`);
  try { return text ? JSON.parse(text) : { ok: true }; } catch { return { ok: true, response: text }; }
}

async function markHatchSnapshotChecked(env, tracker, snapshotId) {
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    last_checked_snapshot_id: snapshotId,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

async function markHatchSnapshotCheckedWithBaseline(env, tracker, snapshot, decision) {
  const now = new Date().toISOString();
  const risk = decision?.risk || {};
  const metadata = hatchTrackerMetadataWithBaseline(tracker?.metadata, {
    armed: decision?.next_armed === true,
    snapshot_id: firstString(snapshot?.id),
    captured_at: firstString(snapshot?.captured_at),
    item_count: Number(snapshot?.item_count || 0),
    stable_comparisons: Math.max(0, Math.floor(Number(decision?.stable_comparisons || 0))),
    reset_reason: firstString(decision?.reason),
    risk_reasons: Array.isArray(risk.reasons) ? risk.reasons : [],
    risk: {
      start_item_count: Number(risk.start_item_count || 0),
      end_item_count: Number(risk.end_item_count || 0),
      item_growth: Number(risk.item_growth || 0),
      item_growth_ratio: Number(risk.item_growth_ratio || 0),
      candidate_gain_count: Number(risk.candidate_gain_count || 0),
      total_gain_count: Number(risk.total_gain_count || 0)
    }
  });
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    metadata,
    last_checked_snapshot_id: firstString(snapshot?.id),
    last_checked_at: now,
    updated_at: now
  });
}

function hatchDisplayItemName(row) {
  const raw = String(firstString(row.display_name, row.item_id, row.item_key, "pet")).trim();
  return raw.replace(/^(Huge|Titanic|Gargantuan|Garg)\s+/i, "").trim() || raw;
}

function hatchFullDisplayItemName(row) {
  const raw = String(firstString(row?.display_name, row?.item_id, row?.item_key, "pet")).trim();
  const baseName = /^(Huge|Titanic|Gargantuan|Garg)\s+/i.test(raw)
    ? raw.replace(/^Garg\s+/i, "Gargantuan ")
    : (() => {
        const tier = hatchTierTitle(row?.tier);
        const name = hatchDisplayItemName(row);
        return tier ? `${tier} ${name}` : name;
      })();
  const variant = hatchVariantDisplayPrefix(row);
  if (!variant || baseName.toLowerCase().startsWith(`${variant.toLowerCase()} `)) return baseName;
  return `${variant} ${baseName}`;
}

function hatchVariantDisplayPrefix(row) {
  const rawVariant = firstString(row?.variant, row?.raw ? getVariant(row.raw) : "");
  const variant = normalizeVariantName(rawVariant);
  if (!variant || variant === "Normal") return "";
  return variant.replace(/\s*Normal$/i, "").trim();
}

function hatchTierTitle(tier) {
  const normalized = String(tier || "").toLowerCase();
  if (normalized === "gargantuan") return "Gargantuan";
  if (normalized === "titanic") return "Titanic";
  if (normalized === "huge") return "Huge";
  return "";
}

function hatchTierLabel(tier) {
  const normalized = String(tier || "").toLowerCase();
  if (normalized === "gargantuan") return "GARGANTUAN";
  if (normalized === "titanic") return "TITANIC";
  return "HUGE";
}

function inventoryImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;
  const assetId = (
    text.match(/^rbxassetid:\/\/(\d+)$/i) ||
    text.match(/[?&]id=(\d{5,20})/i) ||
    text.match(/\/(\d{5,20})(?:\D|$)/)
  )?.[1];
  if (assetId) return `https://ps99.biggamesapi.io/image/${encodeURIComponent(assetId)}`;
  if (/^\d{5,20}$/.test(text)) return `https://ps99.biggamesapi.io/image/${encodeURIComponent(text)}`;
  return `https://ps99.biggamesapi.io/image/${encodeURIComponent(text)}`;
}

function hatchAlertChannelId(env) {
  return String(env.HATCH_ALERT_CHANNEL_ID || env.HATCHING_ALERTS_CHANNEL_ID || "").trim();
}

function hatchAlertWebhookUrl(env) {
  return String(env.HATCH_ALERT_WEBHOOK_URL || env.HATCHING_ALERTS_WEBHOOK_URL || "").trim();
}

function hatchOAuthReturnUrl(env) {
  return String(env.HATCH_TRACKER_RETURN_URL || "").trim();
}

function buildDiscordPayload(user, diffPayload) {
  const gained = diffPayload.gained || [];
  const lost = diffPayload.lost || [];
  const title = `${user.username || user.user_id || DEFAULT_USERNAME} hourly inventory gains`;
  const lines = [];
  lines.push(`Window: ${formatDiscordTime(diffPayload.start.captured_at)} → ${formatDiscordTime(diffPayload.end.captured_at)}`);
  lines.push(`Snapshots: ${diffPayload.start.item_count || "?"} → ${diffPayload.end.item_count || "?"} stacks`);
  lines.push("");
  if (gained.length) {
    lines.push("**Gained / increased**");
    for (const row of gained.slice(0, 18)) lines.push(`+${fmtNumber(row.delta)} ${row.display_name || row.item_id || row.item_key}`);
  } else {
    lines.push("**Gained / increased**");
    lines.push("No increases detected.");
  }
  if (lost.length) {
    lines.push("");
    lines.push("**Lost / decreased**");
    for (const row of lost.slice(0, 8)) lines.push(`${fmtNumber(row.delta)} ${row.display_name || row.item_id || row.item_key}`);
  }

  return {
    username: "PS99 Inventory Detector",
    embeds: [{
      title,
      description: lines.join("\n").slice(0, 4000),
      color: 0xff9b96,
      footer: { text: `Added: ${diffPayload.totals.added} • Removed: ${diffPayload.totals.removed} • Changed: ${diffPayload.totals.changed}` },
      timestamp: diffPayload.end.captured_at
    }]
  };
}

async function sendDiscordWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) throw httpError(res.status, `Discord webhook failed: ${text}`);
  try { return text ? JSON.parse(text) : { ok: true }; } catch { return { ok: true, response: text }; }
}

async function buildDiffPayload(env, userId, picked) {
  if (!picked.start || !picked.end || picked.start.id === picked.end.id) {
    const targetText = picked.target_at ? ` Need a snapshot at or before ${picked.target_at}.` : "";
    return { ok: false, message: `Not enough snapshots to compare yet.${targetText}`, mode: picked.mode || "unknown", end: lightSnapshot(picked.end || null), target_at: picked.target_at || null };
  }
  const diff = await buildDiffFromSnapshots(env, picked.start, picked.end);
  return {
    ok: true,
    user_id: userId,
    mode: picked.mode,
    start: lightSnapshot(picked.start),
    end: lightSnapshot(picked.end),
    totals: diff.totals,
    gained: diff.gained,
    lost: diff.lost,
    added: diff.added,
    removed: diff.removed,
    changed: diff.changed
  };
}

async function buildDiffFromSnapshots(env, start, end) {
  const [startItems, endItems] = await Promise.all([getSnapshotItems(env, start.id), getSnapshotItems(env, end.id)]);
  return buildDiff(startItems, endItems);
}

function pickLastHourSnapshots(snapshots) {
  const snaps = sortAsc(snapshots);
  const end = snaps[snaps.length - 1];
  if (!end) return { mode: "last_hour", start: null, end: null };
  const target = new Date(new Date(end.captured_at).getTime() - 3600000);
  const start = closestSnapshotAtOrBefore(snaps, target);
  if (!start) return { mode: "last_hour_waiting_for_baseline", start: null, end, target_at: target.toISOString() };
  return { mode: "last_hour_live", start, end, target_at: target.toISOString() };
}

function pickDailyComparisonSnapshots(descSnapshots, requestedDay) {
  const snaps = sortAsc(descSnapshots);
  if (!snaps.length) return {};
  if (requestedDay) {
    const start = snaps.find(s => s.local_day === requestedDay && s.is_boundary) || snaps.find(s => s.local_day === requestedDay);
    const nextDay = nextLocalDate(requestedDay);
    const end = snaps.find(s => s.local_day === nextDay && s.is_boundary) || [...snaps].reverse().find(s => s.local_day === requestedDay || s.local_day === nextDay);
    if (start && end && start.id !== end.id) return { start, end, mode: "requested_day" };
  }
  const boundaries = snaps.filter(s => s.is_boundary);
  if (boundaries.length >= 2) return { start: boundaries[boundaries.length - 2], end: boundaries[boundaries.length - 1], mode: "midnight_to_midnight" };
  const first = snaps[0];
  const latest = snaps[snaps.length - 1];
  if (first && latest && first.id !== latest.id) return { start: first, end: latest, mode: "first_pull_to_latest_pending_midnight" };
  return { start: null, end: latest, mode: "waiting_for_second_snapshot" };
}

function buildDiff(startItems, endItems) {
  const startMap = aggregateItems(startItems);
  const endMap = aggregateItems(endItems);
  const added = [];
  const removed = [];
  const changed = [];
  const gained = [];
  const lost = [];

  for (const [key, end] of endMap.entries()) {
    const start = startMap.get(key);
    const before = start ? Number(start.count || 0) : 0;
    const after = Number(end.count || 0);
    const delta = after - before;
    if (!start && after !== 0) {
      const row = diffRow(end, 0, after, delta);
      added.push(row);
      gained.push(row);
    } else if (delta !== 0) {
      const row = diffRow(end, before, after, delta);
      changed.push(row);
      if (delta > 0) gained.push(row);
      else lost.push(row);
    }
  }

  for (const [key, start] of startMap.entries()) {
    if (!endMap.has(key)) {
      const before = Number(start.count || 0);
      const row = diffRow(start, before, 0, -before);
      removed.push(row);
      lost.push(row);
    }
  }

  const sortFn = (a, b) => Math.abs(b.delta) - Math.abs(a.delta) || String(a.display_name).localeCompare(String(b.display_name));
  return {
    totals: { added: added.length, removed: removed.length, changed: changed.length, gained: gained.length, lost: lost.length },
    added: added.sort(sortFn), removed: removed.sort(sortFn), changed: changed.sort(sortFn), gained: gained.sort(sortFn), lost: lost.sort(sortFn)
  };
}

function aggregateItems(items) {
  const map = new Map();
  for (const item of items || []) {
    const source = item?.raw && typeof item.raw === "object" ? item.raw : item;
    const itemClass = item.item_class || source.class || source.category || source.type || null;
    const itemId = item.item_id || source.id || source.itemId || source.configName || source.name || null;
    const variant = getVariant(source);
    const key = getItemKey(source, itemClass, itemId, variant);
    const existing = map.get(key);
    if (!existing) map.set(key, { ...item, item_key: key, item_class: itemClass, item_id: itemId, variant });
    else {
      existing.count = Number(existing.count || 0) + Number(item.count || 0);
      existing.rap = Math.max(Number(existing.rap || 0), Number(item.rap || 0));
    }
  }
  return map;
}

function diffRow(item, before, after, delta) {
  const raw = item.raw || null;
  return { item_key: item.item_key, item_class: item.item_class, item_category: raw?.category || raw?.collection || null, item_id: item.item_id, display_name: item.display_name || item.item_id || item.item_key, variant: item.variant, before, after, delta, rap: Number(item.rap || 0), icon: raw?.icon || null, raw };
}

function compactDiffRow(row) {
  return { item_key: row.item_key, item_class: row.item_class, item_category: row.item_category, item_id: row.item_id, display_name: row.display_name, variant: row.variant, before: row.before, after: row.after, delta: row.delta, rap: row.rap, icon: row.icon };
}

async function fetchInventory(env, user, options = {}) {
  const userId = String(user?.user_id || DEFAULT_USER_ID).trim();
  const usernameOrId = String(user?.username || userId).trim();
  const grant = await getUsableOAuthGrant(env, userId);
  if (grant) return fetchAuthorizedInventory(env, grant, options);
  return fetchPublicInventory(usernameOrId);
}

async function fetchHtgInventory(env, user, options = {}) {
  const userId = String(user?.user_id || DEFAULT_USER_ID).trim();
  const grant = await getUsableOAuthGrant(env, userId, "hatch_tracker");
  if (!grant) throw httpError(401, `No usable HTG Big Games authorization exists for Roblox user ${userId}. Run /htg setup again.`);
  const missing = missingOAuthScopes(env, "hatch_tracker", grant.scope || "");
  if (missing.includes(BIG_GAMES_INVENTORY_SCOPE)) {
    throw httpError(403, `HTG Big Games authorization is missing inventory scope for Roblox user ${userId}. Run /htg setup again.`);
  }
  const savedUserId = String(grant?.roblox_user_id || "").trim();
  if (savedUserId !== userId) {
    await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }).catch(() => {});
    throw httpError(403, `HTG authorization mismatch: the saved grant belongs to Roblox user ${savedUserId || "unknown"}, not ${userId}.`);
  }
  const accessToken = await openOAuthAccessToken(env, grant, "hatch_tracker");
  let verifiedIdentity = null;
  if (options.verifyIdentity === true) {
    if (missing.includes(BIG_GAMES_PROFILE_SCOPE)) {
      throw httpError(403, `HTG Big Games authorization is missing Profile scope for Roblox user ${userId}. Run /htg setup account:<roblox username> again so Luna can verify which account owns the inventory.`);
    }
    verifiedIdentity = await verifyHtgGrantIdentity(env, grant, userId, accessToken);
  }
  let payload;
  try {
    payload = await fetchInventoryWithAccessToken(env, accessToken, options);
  } catch (error) {
    if (error?.status === 429 && options.forceRefresh) {
      try {
        payload = await fetchInventoryWithAccessToken(env, accessToken, { ...options, forceRefresh: false });
      } catch (fallbackError) {
        if (fallbackError?.status === 401 || fallbackError?.status === 403) {
          await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }).catch(() => {});
        }
        throw fallbackError;
      }
      attachHtgRefreshFallback(payload, {
        used: true,
        reason: "Forced refresh was rate limited; HTG inspected the latest cached inventory revision instead."
      });
    } else {
      if (error?.status === 401 || error?.status === 403) {
        await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }).catch(() => {});
      }
      throw error;
    }
  }
  try {
    await supabaseUpdate(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }, { last_used_at: new Date().toISOString() });
  } catch {}
  if (verifiedIdentity) attachHtgVerifiedIdentity(payload, verifiedIdentity);
  return payload;
}

function attachHtgVerifiedIdentity(payload, identity) {
  if (!payload || typeof payload !== "object") return;
  Object.defineProperty(payload, "_htg_verified_identity", {
    value: {
      user_id: String(identity?.user_id || "").trim() || null,
      username: firstString(identity?.username) || null
    },
    enumerable: false,
    configurable: true
  });
}

async function verifyHtgGrantIdentity(env, grant, expectedUserId, accessToken) {
  const normalizedExpected = String(expectedUserId || "").trim();
  if (!normalizedExpected) throw httpError(400, "Cannot verify HTG grant identity without a Roblox user_id.");
  const profile = await fetchProfileWithAccessToken(env, accessToken);
  const account = authorizedInventoryAccount(profile);
  if (!account.user_id) {
    const savedUserId = String(grant?.roblox_user_id || "").trim();
    if (savedUserId === normalizedExpected && grant?.metadata?.identity_verified === false) {
      return {
        user_id: normalizedExpected,
        username: firstString(grant?.metadata?.username, normalizedExpected),
        identity_unavailable: true
      };
    }
    throw httpError(403, `HTG Big Games authorization for Roblox user ${normalizedExpected} could not be verified from Profile data. Run /htg setup account:<roblox username> again.`);
  }
  if (String(account.user_id) !== normalizedExpected) {
    await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }).catch(() => {});
    throw httpError(403, `HTG Big Games authorization mismatch: saved for Roblox user ${normalizedExpected}, but Big Games says the token belongs to Roblox user ${account.user_id}${account.username ? ` (${account.username})` : ""}. Run /htg setup again for the correct account.`);
  }
  return account;
}

async function htgGrantIdentityDiagnostics(env, userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return { connected: false, reason: "No Roblox user_id was provided." };
  const grant = await getUsableOAuthGrant(env, normalizedUserId, "hatch_tracker");
  if (!grant) return { connected: false, reason: "No usable HTG Big Games authorization grant was found." };

  const missingScopes = missingOAuthScopes(env, "hatch_tracker", grant.scope || "");
  const result = {
    connected: true,
    grant_key: grant.grant_key || null,
    roblox_user_id: grant.roblox_user_id || null,
    scope: grant.scope || null,
    missing_scopes: missingScopes,
    authorized_at: grant.authorized_at || null,
    expires_at: grant.expires_at || null,
    identity_verified: grant.metadata?.identity_verified ?? null,
    metadata_username: grant.metadata?.username || null,
    profile: null
  };

  if (missingScopes.includes(BIG_GAMES_PROFILE_SCOPE)) {
    return {
      ...result,
      profile: {
        available: false,
        reason: "Grant is missing Profile scope; live account identity cannot be verified."
      }
    };
  }

  const accessToken = await openOAuthAccessToken(env, grant, "hatch_tracker");
  const profile = await fetchProfileWithAccessToken(env, accessToken);
  const account = authorizedInventoryAccount(profile);
  return {
    ...result,
    profile: {
      available: true,
      roblox_user_id: account.user_id || null,
      roblox_username: account.username || null,
      matches_expected_user: String(account.user_id || "") === normalizedUserId
    }
  };
}

function pickPreviousSnapshots(snapshots) {
  const snaps = sortAsc(snapshots);
  return {
    mode: "previous_snapshot",
    start: snaps[snaps.length - 2] || null,
    end: snaps[snaps.length - 1] || null
  };
}

async function fetchAuthorizedInventory(env, grant, options = {}) {
  const accessToken = await openOAuthAccessToken(env, grant, "inventory");
  let payload;
  try {
    payload = await fetchInventoryWithAccessToken(env, accessToken, options);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }).catch(() => {});
    }
    throw error;
  }
  try {
    await supabaseUpdate(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${grant.grant_key}` }, { last_used_at: new Date().toISOString() });
  } catch {}
  return payload;
}

async function fetchInventoryWithAccessToken(env, accessToken, options = {}) {
  const url = new URL(env.BIG_GAMES_INVENTORY_URL || BIG_GAMES_INVENTORY_URL);
  if (options.forceRefresh) url.searchParams.set("refresh", "true");
  const res = await fetch(url.toString(), {
    headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
    cf: { cacheTtl: 0 }
  });
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw httpError(502, `Big Games Player API returned non-JSON: ${text.slice(0, 160)}`); }
  if (res.status === 401) throw httpError(401, "Big Games authorization expired or was revoked. Run the OAuth authorization flow again.");
  if (res.status === 403) throw httpError(403, "Big Games token does not include the Inventory permission. Re-authorize the app.");
  if (res.status === 429) {
    throw httpError(429, `Big Games Player API refresh quota or rate limit was reached: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  if (!res.ok || payload.status === "error") {
    if (bigGamesInventoryPayloadIsRateLimited(payload)) {
      throw httpError(429, `Big Games Player API refresh quota or rate limit was reached: ${JSON.stringify(payload).slice(0, 300)}`);
    }
    throw httpError(502, `Big Games Player API inventory fetch failed: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  attachResponseHeaders(payload, res.headers);
  return payload;
}

function bigGamesInventoryPayloadIsRateLimited(payload) {
  const error = plainObject(payload?.error);
  const code = firstString(payload?.code, payload?.error_code, error.code, payload?.status_code).toLowerCase();
  const message = firstString(
    payload?.message,
    typeof payload?.error === "string" ? payload.error : "",
    error.message
  ).toLowerCase();
  return /^(?:429|rate[_-]?limit(?:ed)?|too_many_requests)$/.test(code)
    || /(?:rate.?limit|too many requests|quota (?:is )?exhausted|refresh quota (?:reached|exceeded))/.test(message);
}

function attachHtgRefreshFallback(payload, details) {
  if (!payload || typeof payload !== "object") return;
  Object.defineProperty(payload, "_htg_refresh_fallback", {
    value: details || { used: true },
    enumerable: false,
    configurable: true
  });
}

async function fetchProfileWithAccessToken(env, accessToken) {
  const url = new URL(env.BIG_GAMES_PROFILE_URL || BIG_GAMES_PROFILE_URL);
  const res = await fetch(url.toString(), {
    headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
    cf: { cacheTtl: 0 }
  });
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw httpError(502, `Big Games Player API returned non-JSON: ${text.slice(0, 160)}`); }
  if (res.status === 401) throw httpError(401, "Big Games authorization expired or was revoked. Run the OAuth authorization flow again.");
  if (res.status === 403) throw httpError(403, "Big Games token does not include the Profile permission. Re-authorize the app.");
  if (!res.ok || payload.status === "error") throw httpError(502, `Big Games Player API profile fetch failed: ${JSON.stringify(payload).slice(0, 300)}`);
  attachResponseHeaders(payload, res.headers);
  return payload;
}

function attachResponseHeaders(payload, headers) {
  if (!payload || typeof payload !== "object") return;
  const snapshot = {};
  try {
    headers.forEach((value, key) => {
      snapshot[String(key).toLowerCase()] = String(value);
    });
  } catch {}
  Object.defineProperty(payload, "_headers", {
    value: snapshot,
    enumerable: false,
    configurable: true
  });
}

async function fetchPublicInventory(usernameOrId) {
  const url = `https://ps99.biggamesapi.io/v1/players/${encodeURIComponent(usernameOrId)}?include=inventory,profile,extendedProfile`;
  const res = await fetch(url, { headers: { accept: "application/json" }, cf: { cacheTtl: 0 } });
  const text = await res.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw httpError(502, `Big Games returned non-JSON: ${text.slice(0, 160)}`); }
  if (!res.ok || payload.status === "error") throw httpError(502, `Big Games inventory fetch failed: ${JSON.stringify(payload).slice(0, 260)}`);
  return payload;
}

const INVENTORY_ITEM_PATHS = Object.freeze([
  "data.items",
  "data.views.inventory.data.items",
  "data.views.inventory.items",
  "views.inventory.data.items",
  "views.inventory.items",
  "data.account.inventory.items",
  "account.inventory.items",
  "data.inventory.data.items",
  "inventory.data.items",
  "data.inventory.items",
  "inventory.items"
]);

const TRUSTED_AUTH_INVENTORY_ITEM_PATHS = new Set(["data.items"]);
const CATALOG_PATH_PATTERN = /(^|\.)(collection|collections|catalog|index|directory|config|database|exist|exists)(\.|$)/i;
const CATALOG_ITEM_KEYS = Object.freeze(["collection", "collections", "exists", "goldenIcon", "rapApproximate", "existCount", "globalCount"]);

function selectOwnedInventoryItems(raw, env) {
  const data = raw?.data || raw;
  const view = data?.views?.inventory;
  if (view && view.available === false) return { items: [], path: null, method: "inventory_unavailable", confidence: 1 };

  const configuredPath = String(env.BIG_GAMES_INVENTORY_ITEMS_PATH || "").trim().replace(/^\$\.?/, "");
  if (configuredPath) {
    const configuredItems = valueAtPath(raw, configuredPath);
    if (!Array.isArray(configuredItems)) {
      throw httpError(502, `BIG_GAMES_INVENTORY_ITEMS_PATH does not point to an array: ${configuredPath}`);
    }
    const analysis = analyzeInventoryArray(configuredPath, configuredItems);
    const trustedPath = isTrustedAuthenticatedOwnedInventoryPath(raw, configuredPath, analysis);
    if (analysis.catalog_like && !trustedPath) {
      throw httpError(502, `BIG_GAMES_INVENTORY_ITEMS_PATH points to catalog/collection data, not owned inventory: ${configuredPath}`);
    }
    if (!analysis.owned_like && !trustedPath) {
      throw httpError(502, `BIG_GAMES_INVENTORY_ITEMS_PATH does not contain recognizable owned item stacks: ${configuredPath}`);
    }
    return { items: configuredItems, path: configuredPath, method: "configured", confidence: analysis.score };
  }

  for (const path of INVENTORY_ITEM_PATHS) {
    const items = valueAtPath(raw, path);
    if (!Array.isArray(items)) continue;
    const analysis = analyzeInventoryArray(path, items);
    if ((analysis.owned_like && !analysis.catalog_like) || isTrustedAuthenticatedOwnedInventoryPath(raw, path, analysis)) {
      return { items, path, method: "recognized_path", confidence: analysis.score };
    }
  }

  const candidates = inventoryArrayCandidates(raw)
    .map(candidate => ({ ...candidate, analysis: analyzeInventoryArray(candidate.path, candidate.items) }))
    .filter(candidate => candidate.analysis.owned_like && !candidate.analysis.catalog_like)
    .sort((a, b) => b.analysis.score - a.analysis.score || b.items.length - a.items.length);

  if (candidates.length && candidates[0].analysis.score >= 24) {
    const selected = candidates[0];
    return { items: selected.items, path: selected.path, method: "verified_shape", confidence: selected.analysis.score };
  }

  if (envBool(env.INVENTORY_ALLOW_HEURISTIC_ITEMS, false)) {
    const legacy = findBestItemArray(raw);
    if (legacy.items.length && !legacy.analysis.catalog_like) {
      return { items: legacy.items, path: legacy.path, method: "legacy_heuristic", confidence: legacy.analysis.score };
    }
  }

  return { items: [], path: null, method: "no_verified_owned_array", confidence: 0 };
}

function valueAtPath(value, path) {
  return String(path || "").split(".").filter(Boolean).reduce((current, key) => current == null ? undefined : current[key], value);
}

function inventoryArrayCandidates(raw) {
  const output = [];
  const seen = new Set();
  walk(raw, "", 0);
  return output;

  function walk(value, path, depth) {
    if (!value || typeof value !== "object" || depth > 9 || output.length >= 400) return;
    if (Array.isArray(value)) {
      if (!seen.has(value)) {
        seen.add(value);
        output.push({ path: path || "$", items: value });
      }
      for (let index = 0; index < Math.min(value.length, 2); index++) walk(value[index], `${path}.${index}`, depth + 1);
      return;
    }
    for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key, depth + 1);
  }
}

function analyzeInventoryArray(path, items) {
  if (!Array.isArray(items) || !items.length) {
    return { score: 0, owned_like: false, catalog_like: CATALOG_PATH_PATTERN.test(path), item_like_count: 0, catalog_signal_count: 0 };
  }

  const sample = items.filter(item => item && typeof item === "object" && !Array.isArray(item)).slice(0, 30);
  let score = /inventory|owned|items|stacks/i.test(path) ? 8 : 0;
  let itemLikeCount = 0;
  let quantityCount = 0;
  let stackCount = 0;
  let catalogSignalCount = 0;

  for (const item of sample) {
    const keys = new Set(Object.keys(item));
    const rawData = item.rawData && typeof item.rawData === "object" ? item.rawData : {};
    const hasIdentity = item.id != null || item.itemId != null || item.configName != null || item.name != null || rawData.id != null;
    const hasQuantity = ownedQuantityValue(item) != null;
    const hasStack = item.stackKey != null || item.stack_key != null || Object.keys(rawData).length > 0;
    const catalogSignals = CATALOG_ITEM_KEYS.reduce((total, key) => total + (keys.has(key) ? 1 : 0), 0);
    if (hasIdentity) itemLikeCount += 1;
    if (hasQuantity) quantityCount += 1;
    if (hasStack) stackCount += 1;
    if (catalogSignals >= 2) catalogSignalCount += 1;
  }

  score += itemLikeCount * 2 + quantityCount * 2 + stackCount;
  const catalogLike = CATALOG_PATH_PATTERN.test(path) || (sample.length > 0 && catalogSignalCount >= Math.max(1, Math.ceil(sample.length * 0.25)));
  if (catalogLike) score -= 100;
  const ownedLike = sample.length > 0
    && itemLikeCount >= Math.ceil(sample.length * 0.6)
    && quantityCount >= Math.ceil(sample.length * 0.5)
    && !catalogLike;
  return {
    score,
    owned_like: ownedLike,
    catalog_like: catalogLike,
    item_like_count: itemLikeCount,
    quantity_count: quantityCount,
    stack_count: stackCount,
    catalog_signal_count: catalogSignalCount,
    sample_size: sample.length
  };
}

function isTrustedAuthenticatedOwnedInventoryPath(raw, path, analysis) {
  if (!TRUSTED_AUTH_INVENTORY_ITEM_PATHS.has(String(path || ""))) return false;
  const data = raw?.data || {};
  const hasAuthenticatedInventoryEnvelope = Boolean(raw?.refresh || data?.fetchedAt || data?.cached !== undefined);
  if (!hasAuthenticatedInventoryEnvelope) return false;
  const sampleSize = Math.max(1, Number(analysis?.sample_size || 0));
  return Number(analysis?.item_like_count || 0) >= Math.ceil(sampleSize * 0.6)
    && Number(analysis?.quantity_count || 0) >= Math.ceil(sampleSize * 0.5)
    && Number(analysis?.stack_count || 0) >= Math.ceil(sampleSize * 0.5);
}

function summarizeInventoryCandidate(path, items, query, selection = null) {
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const matches = normalizedQuery
    ? safeItems.filter(item => inventoryItemName(item).toLowerCase() === normalizedQuery)
    : [];
  return {
    path: path || null,
    method: selection?.method || null,
    confidence: selection?.confidence ?? null,
    length: safeItems.length,
    analysis: analyzeInventoryArray(path || "", safeItems),
    query_matches: matches.length,
    query_quantity: matches.reduce((total, item) => total + itemCount(item), 0),
    query_samples: matches.slice(0, 10).map(compactInventoryItem)
  };
}

function inventoryItemName(item) {
  const rawData = item?.rawData && typeof item.rawData === "object" ? item.rawData : {};
  let stack = {};
  try { stack = JSON.parse(String(item?.stackKey || item?.stack_key || "{}")); } catch {}
  return String(
    item?.displayName
    || item?.display_name
    || item?.name
    || item?.id
    || item?.itemId
    || item?.configName
    || rawData.id
    || stack.id
    || ""
  ).trim();
}

function compactInventoryItem(item) {
  const keys = item && typeof item === "object" ? Object.keys(item) : [];
  return {
    name: inventoryItemName(item),
    quantity: itemCount(item),
    variant: getVariant(item),
    top_keys: keys.slice(0, 30),
    catalog_signals: CATALOG_ITEM_KEYS.filter(key => keys.includes(key))
  };
}

function compactInventoryItemForDiagnostics(item) {
  return {
    item_key: item?.item_key || null,
    item_class: item?.item_class || null,
    item_id: item?.item_id || null,
    display_name: item?.display_name || null,
    variant: item?.variant || null,
    count: Number(item?.count || 0),
    rap: Number(item?.rap || 0),
    tier: hatchTier(item) || null
  };
}

function hatchDiagnosticItemMatches(item, query) {
  const terms = String(query || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    item?.display_name,
    item?.item_id,
    item?.item_key,
    item?.variant,
    item?.raw?.displayName,
    item?.raw?.name,
    item?.raw?.id,
    item?.raw?.itemId,
    item?.raw?.configName,
    item?.raw?.stackKey,
    item?.raw?.stack_key,
    item?.raw?.rawData?.id
  ].map(value => String(value || "").toLowerCase()).join(" ");
  return terms.every(term => haystack.includes(term));
}

function inventoryPayloadShape(raw) {
  const data = raw?.data || raw;
  const arrays = [];
  collectArrayPaths(raw, "", arrays, 0);
  return {
    top_level_keys: raw && typeof raw === "object" ? Object.keys(raw).slice(0, 30) : [],
    data_keys: data && typeof data === "object" ? Object.keys(data).slice(0, 30) : [],
    recognized_inventory_available: data?.views?.inventory?.available ?? data?.inventory?.available ?? null,
    array_paths: arrays.slice(0, 30)
  };
}

function collectArrayPaths(value, path, output, depth) {
  if (!value || typeof value !== "object" || depth > 5 || output.length >= 30) return;
  if (Array.isArray(value)) {
    output.push({ path: path || "$", length: value.length });
    for (let index = 0; index < Math.min(value.length, 2); index++) {
      collectArrayPaths(value[index], `${path}[${index}]`, output, depth + 1);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    collectArrayPaths(child, path ? `${path}.${key}` : key, output, depth + 1);
    if (output.length >= 30) break;
  }
}

function inventorySourceMeta(raw) {
  if (!raw || typeof raw !== "object") return { fetched_at: null, is_stale: null, available: null };
  const verifiedIdentity = raw._htg_verified_identity || null;
  if (raw.source_fetched_at || raw.source_is_stale !== undefined || raw.inventory_available !== undefined) {
    return {
      fetched_at: raw.source_fetched_at || null,
      is_stale: raw.source_is_stale ?? null,
      available: raw.inventory_available ?? null,
      refresh: raw.refresh || null,
      refresh_fallback: raw._htg_refresh_fallback || null,
      verified_identity: verifiedIdentity
    };
  }
  const data = raw.data || raw;
  if (data?.fetchedAt || raw.refresh) {
    return {
      fetched_at: data?.fetchedAt || null,
      is_stale: data?.cached ?? null,
      available: true,
      cached: data?.cached ?? null,
      refresh: raw.refresh || null,
      refresh_fallback: raw._htg_refresh_fallback || null,
      verified_identity: verifiedIdentity
    };
  }
  const view = data?.views?.inventory || data?.inventory || null;
  return {
    fetched_at: view?.fetchedAt || view?.fetched_at || null,
    is_stale: view?.isStale ?? view?.is_stale ?? null,
    available: view?.available ?? null,
    refresh: raw.refresh || null,
    refresh_fallback: raw._htg_refresh_fallback || null,
    verified_identity: verifiedIdentity
  };
}

function inventorySnapshotMeta(raw, selection = null) {
  const data = raw?.data || raw || {};
  const account = data?.account || {};
  const source = inventorySourceMeta(raw);
  return {
    provider: raw?.refresh ? "big_games_oauth_player_api" : "big_games_public_player_api",
    source_fetched_at: source.fetched_at,
    source_is_stale: source.is_stale,
    inventory_available: source.available,
    inventory_items_path: selection?.path || null,
    inventory_selection_method: selection?.method || null,
    inventory_selection_confidence: selection?.confidence ?? null,
    refresh: source.refresh || null,
    account: {
      roblox_user_id: account.robloxUserId || account.roblox_user_id || null,
      username: account.username || null,
      display_name: account.displayName || account.display_name || null
    }
  };
}

function findBestItemArray(obj, path = "") {
  let best = { score: 0, items: [], path: null, analysis: { score: 0, catalog_like: false } };
  walk(obj, path);
  return best;
  function walk(value, p) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const analysis = analyzeInventoryArray(p, value);
      const score = analysis.score;
      if (score > best.score) best = { score, items: value, path: p || "$", analysis };
      for (let i = 0; i < Math.min(value.length, 3); i++) walk(value[i], `${p}.${i}`);
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(v, p ? `${p}.${k}` : k);
  }
}

function normalizeItemRow(item, snapshotId, userId, capturedAt, localDay) {
  const itemClass = item.class || item.category || item.type || null;
  const itemId = item.id || item.itemId || item.configName || item.name || null;
  const displayName = item.displayName || item.name || itemId || item.stackKey || "Unknown item";
  const variant = getVariant(item);
  const itemKey = getItemKey(item, itemClass, itemId, variant);
  return { snapshot_id: snapshotId, roblox_user_id: Number(userId), captured_at: capturedAt, local_day: localDay, item_key: itemKey, item_class: itemClass, item_id: itemId, display_name: displayName, variant, count: itemCount(item), rap: itemRap(item), raw: item };
}

function getItemKey(item, itemClass, itemId, variant) {
  const stackKey = stableStackKey(item?.stackKey || item?.stack_key);
  if (stackKey) return `${itemClass || "Unknown"}:${stackKey}`;
  const rawData = item?.rawData && typeof item.rawData === "object" ? item.rawData : {};
  const tier = rawData.tn ?? item?.tn ?? "";
  return `${itemClass || "Unknown"}:${itemId || "Unknown"}:${variant || "Normal"}:${tier}`;
}
function stableStackKey(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return text;
    for (const key of ["_am", "amount", "count", "quantity", "qty"]) delete parsed[key];
    return stableJson(parsed);
  } catch {
    return text.replace(/([,{]\s*"?_am"?\s*:\s*)-?\d+(\.\d+)?/i, "$10");
  }
}
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function ownedQuantityValue(item) {
  const rawData = item?.rawData && typeof item.rawData === "object" ? item.rawData : {};
  let stack = {};
  try { stack = JSON.parse(String(item?.stackKey || item?.stack_key || "{}")); } catch {}
  const candidates = [
    item?.ownedCount,
    item?.owned_count,
    rawData._am,
    rawData.amount,
    rawData.count,
    rawData.quantity,
    rawData.qty,
    stack._am,
    stack.amount,
    stack.count,
    stack.quantity,
    stack.qty,
    item?.amount,
    item?.quantity,
    item?.qty,
    item?.count
  ];
  for (const value of candidates) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return null;
}
function itemCount(item) {
  const count = ownedQuantityValue(item);
  return count === null ? 1 : count;
}
function itemRap(item) { for (const v of [item.rap, item.RAP, item.value, item.Value, item.recentAveragePrice, item.rawData?.rap]) { const n = Number(v); if (Number.isFinite(n) && n > 0) return n; } return 0; }
function getVariant(item) {
  const explicit = String(item?.variant || item?.Variant || "").trim();
  if (explicit) return explicit.replace(/^regular$/i, "Normal");
  let stack = {};
  try { stack = JSON.parse(String(item?.stackKey || item?.stack_key || "{}")); } catch {}
  const rawData = item?.rawData && typeof item.rawData === "object" ? item.rawData : {};
  const paint = Number(rawData.pt ?? stack.pt ?? item?.pt ?? 0);
  const shiny = [true, 1, "1", "true"].includes(rawData.sh ?? stack.sh ?? item?.sh ?? false);
  const base = paint === 2 ? "Rainbow" : paint === 1 ? "Golden" : "Normal";
  return shiny ? `Shiny ${base}` : base;
}

async function getUserSnapshots(env, userId, limit = 500) {
  return supabaseSelect(env, SNAPSHOT_TABLE, {
    select: SNAPSHOT_PUBLIC_SELECT,
    roblox_user_id: `eq.${userId}`,
    "raw->>inventory_selection_method": `in.(${VERIFIED_INVENTORY_SELECTION_METHODS.join(",")})`,
    order: "captured_at.desc",
    limit: String(limit)
  });
}
async function getLatestSnapshot(env, userId, options = {}) {
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
    select: options.includeRaw ? `${SNAPSHOT_PUBLIC_SELECT},raw` : SNAPSHOT_PUBLIC_SELECT,
    roblox_user_id: `eq.${userId}`,
    "raw->>inventory_selection_method": `in.(${VERIFIED_INVENTORY_SELECTION_METHODS.join(",")})`,
    order: "captured_at.desc",
    limit: "1"
  });
  return rows[0] || null;
}
async function getSnapshotItems(env, snapshotId) {
  const rows = await supabaseSelectAll(env, ITEM_TABLE, { snapshot_id: `eq.${snapshotId}`, order: "id.asc" }, inventorySnapshotItemReadLimit(env));
  return rows.map(normalizeStoredItem);
}
function normalizeStoredItem(item) {
  const source = item?.raw && typeof item.raw === "object" ? item.raw : item;
  const itemClass = item.item_class || source.class || source.category || source.type || null;
  const itemId = item.item_id || source.id || source.itemId || source.configName || source.name || null;
  const variant = getVariant(source);
  return {
    ...item,
    item_key: getItemKey(source, itemClass, itemId, variant),
    item_class: itemClass,
    item_category: source.category || source.collection || null,
    item_id: itemId,
    display_name: item.display_name || source.displayName || source.name || itemId,
    variant,
    icon: source.icon || null
  };
}

async function buildInventoryDamageSummary(items, env) {
  const eventNames = new Map(EVENT_PET_NAMES.map(name => [normalizePetName(name), name]));
  const featuredNames = new Map(FEATURED_EVENT_PETS.map(pet => [normalizePetName(pet.name), pet]));
  const categories = new Map([
    ["other", createDamageCategory("other", "Other")],
    ...FEATURED_EVENT_PETS.map(pet => [pet.key, createDamageCategory(pet.key, pet.name)])
  ]);

  let catalog = { powers: new Map(), source: "unavailable", warning: null };
  try {
    catalog = await getPetPowerCatalog(env);
  } catch (error) {
    catalog.warning = error?.message || String(error);
  }

  const unresolved = new Set();
  let usedItemPower = false;
  let usedOverride = false;
  let usedDecompile = false;
  let usedCatalog = false;
  let exact = true;

  for (const item of items || []) {
    const normalizedName = normalizePetName(item?.display_name || item?.item_id);
    if (!eventNames.has(normalizedName)) continue;

    const quantity = Math.max(0, Math.floor(Number(itemCount(item)) || 0));
    if (!quantity) continue;

    const categoryKey = featuredNames.get(normalizedName)?.key || "other";
    const category = categories.get(categoryKey);
    category.count += quantity;

    const resolved = resolveOwnedPetPower(item, normalizedName, catalog.powers);
    if (!resolved || !(resolved.power > 0)) {
      unresolved.add(eventNames.get(normalizedName));
      category.unresolved.add(eventNames.get(normalizedName));
      continue;
    }

    category.damage += resolved.power * quantity;
    category.resolved_count += quantity;
    exact = exact && resolved.exact;
    usedItemPower = usedItemPower || resolved.source === "inventory";
    usedOverride = usedOverride || resolved.source === "override";
    usedDecompile = usedDecompile || resolved.source === "PS99 decompile";
    usedCatalog = usedCatalog || resolved.source === "catalog";
  }

  const ordered = [categories.get("other"), ...FEATURED_EVENT_PETS.map(pet => categories.get(pet.key))];
  const totalCount = ordered.reduce((sum, category) => sum + category.count, 0);
  const totalDamage = ordered.reduce((sum, category) => sum + category.damage, 0);
  const resolvedCount = ordered.reduce((sum, category) => sum + category.resolved_count, 0);
  const complete = unresolved.size === 0;
  const available = totalDamage > 0;
  const source = [usedItemPower && "inventory", usedOverride && "override", usedDecompile && "PS99 decompile", usedCatalog && "BIG Games Pets catalog"].filter(Boolean).join(" + ") || catalog.source;
  const message = !available
    ? "Pet power could not be resolved for the listed event pets. Update the built-in event table or set EVENT_PET_POWER_JSON with verified values."
    : !complete
      ? `Damage percentages cover ${resolvedCount.toLocaleString("en-US")} of ${totalCount.toLocaleString("en-US")} listed event pets; unresolved pets are excluded.`
      : !exact
        ? "Damage percentages use base pet power for variants without a variant-specific power value."
        : null;

  return {
    available,
    complete,
    exact: available && complete && exact,
    source,
    total_count: totalCount,
    resolved_count: resolvedCount,
    total_damage: totalDamage,
    unresolved_pets: [...unresolved],
    warning: catalog.warning || null,
    message,
    categories: ordered.map(category => ({
      key: category.key,
      name: category.name,
      count: category.count,
      resolved_count: category.resolved_count,
      damage: category.damage,
      damage_percent: available ? (category.damage / totalDamage) * 100 : null,
      unresolved_pets: [...category.unresolved]
    }))
  };
}

function createDamageCategory(key, name) {
  return { key, name, count: 0, resolved_count: 0, damage: 0, unresolved: new Set() };
}

async function getPetPowerCatalog(env) {
  const overrides = parsePetPowerOverrides(env.EVENT_PET_POWER_JSON);
  const now = Date.now();
  if (petCatalogCache && now < petCatalogExpiresAt) return mergePetPowerCatalog(petCatalogCache, overrides);
  if (!petCatalogPromise) {
    petCatalogPromise = (async () => {
      const endpoint = String(env.BIG_GAMES_PET_COLLECTION_URL || BIG_GAMES_PET_COLLECTION_URL).trim();
      const response = await fetch(endpoint, { headers: { accept: "application/json" } });
      const text = await response.text();
      if (!response.ok) throw new Error(`BIG Games Pets catalog failed (${response.status}).`);
      const payload = text ? JSON.parse(text) : {};
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
      const powers = new Map();
      const images = new Map();
      for (const row of rows) {
        const name = normalizePetName(row?.configName || row?.configData?.name || row?.name);
        if (!name) continue;
        const power = extractCatalogPower(row);
        if (power) powers.set(name, power);
        const image = extractCatalogImage(row);
        if (image) images.set(name, image);
      }
      return { powers, images, source: "BIG Games Pets catalog", warning: null };
    })();
  }
  try {
    petCatalogCache = await petCatalogPromise;
    const seconds = clampNumber(env.PET_CATALOG_CACHE_SECONDS, DEFAULT_PET_CATALOG_CACHE_SECONDS, 60, 86400);
    petCatalogExpiresAt = Date.now() + seconds * 1000;
  } catch (error) {
    petCatalogCache = {
      powers: new Map(),
      images: new Map(),
      source: "unavailable",
      warning: error?.message || String(error)
    };
    petCatalogExpiresAt = Date.now() + 60 * 1000;
  } finally {
    petCatalogPromise = null;
  }
  return mergePetPowerCatalog(petCatalogCache, overrides);
}

function mergePetPowerCatalog(catalog, overrides) {
  const powers = builtInEventPetPowers();
  for (const [name, value] of catalog?.powers || []) powers.set(name, value);
  for (const [name, value] of overrides) powers.set(name, { ...value, source: "override" });
  const images = new Map(catalog?.images || []);
  const sources = [catalog?.source && catalog.source !== "unavailable" ? catalog.source : null, "PS99 decompile", overrides.size ? "override" : null].filter(Boolean);
  return { powers, images, source: sources.join(" + "), warning: catalog?.warning || null };
}

function builtInEventPetPowers() {
  const powers = new Map();
  for (const [name, base] of Object.entries(EVENT_PET_BASE_POWERS)) {
    const variants = {};
    for (const [variant, multiplier] of Object.entries(PET_POWER_VARIANT_MULTIPLIERS)) {
      variants[variant] = base * multiplier;
    }
    powers.set(normalizePetName(name), { base, variants, source: "PS99 decompile" });
  }
  return powers;
}

function parsePetPowerOverrides(raw) {
  const powers = new Map();
  if (!raw) return powers;
  try {
    const parsed = JSON.parse(String(raw));
    for (const [name, value] of Object.entries(parsed || {})) {
      const normalized = normalizePetName(name);
      const power = normalizePowerRecord(value, "override");
      if (normalized && power) powers.set(normalized, power);
    }
  } catch {}
  return powers;
}

function resolveOwnedPetPower(item, normalizedName, catalogPowers) {
  const direct = extractPowerValue(item);
  if (direct > 0) return { power: direct, exact: true, source: "inventory" };

  const catalog = catalogPowers.get(normalizedName);
  if (catalog) return selectVariantPower(catalog, item, catalog.source || "catalog");
  return null;
}

function extractCatalogPower(row) {
  const base = extractPowerValue(row?.configData) || extractPowerValue(row);
  const variants = {};
  for (const [label, aliases] of Object.entries({
    Normal: ["normalpower", "normaldamage", "normalstrength"],
    Golden: ["goldenpower", "goldendamage", "goldenstrength", "goldpower", "golddamage", "goldstrength"],
    Rainbow: ["rainbowpower", "rainbowdamage", "rainbowstrength"],
    "Shiny Normal": ["shinypower", "shinydamage", "shinystrength", "shinynormalpower", "shinynormaldamage", "shinynormalstrength"],
    "Shiny Golden": ["shinygoldenpower", "shinygoldendamage", "shinygoldenstrength"],
    "Shiny Rainbow": ["shinyrainbowpower", "shinyrainbowdamage", "shinyrainbowstrength"]
  })) {
    const value = findNumericField(row?.configData || row, new Set(aliases));
    if (value > 0) variants[label] = value;
  }
  return base > 0 || Object.keys(variants).length ? { base: base || null, variants, source: "catalog" } : null;
}

function extractCatalogImage(row) {
  const data = plainObject(row?.configData);
  const thumbnail = firstString(data.thumbnail, data.icon, row?.thumbnail, row?.icon);
  const goldenThumbnail = firstString(data.goldenThumbnail, data.goldenIcon, row?.goldenThumbnail, row?.goldenIcon);
  return thumbnail || goldenThumbnail
    ? { thumbnail, golden_thumbnail: goldenThumbnail }
    : null;
}

function normalizePowerRecord(value, source) {
  const scalar = Number(value);
  if (Number.isFinite(scalar) && scalar > 0) return { base: scalar, variants: {}, source };
  if (!value || typeof value !== "object") return null;
  const variants = {};
  let base = null;
  for (const [key, candidate] of Object.entries(value)) {
    const number = Number(candidate);
    if (!Number.isFinite(number) || number <= 0) continue;
    const normalizedKey = normalizeVariantName(key);
    if (normalizedKey === "Normal" || ["base", "power", "damage", "strength"].includes(String(key).toLowerCase())) base = number;
    else variants[normalizedKey] = number;
  }
  return base || Object.keys(variants).length ? { base, variants, source } : null;
}

function selectVariantPower(record, item, source) {
  const variant = normalizeVariantName(item?.variant || getVariant(item));
  const exact = Number(record?.variants?.[variant]);
  if (Number.isFinite(exact) && exact > 0) return { power: exact, exact: true, source };
  const base = Number(record?.base);
  if (Number.isFinite(base) && base > 0) return { power: base, exact: variant === "Normal", source };
  return null;
}

function extractPowerValue(value) {
  return findNumericField(value, new Set(["power", "basepower", "petpower", "damage", "basedamage", "petdamage", "strength", "basestrength", "petstrength"]));
}

function findNumericField(value, acceptedKeys, depth = 0) {
  if (!value || typeof value !== "object" || depth > 5) return 0;
  for (const [key, candidate] of Object.entries(value)) {
    const normalizedKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (acceptedKeys.has(normalizedKey)) {
      const number = Number(candidate);
      if (Number.isFinite(number) && number > 0) return number;
    }
  }
  for (const candidate of Object.values(value)) {
    const nested = findNumericField(candidate, acceptedKeys, depth + 1);
    if (nested > 0) return nested;
  }
  return 0;
}

function normalizePetName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeVariantName(value) {
  const normalized = String(value || "Normal").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("shiny") && normalized.includes("rainbow")) return "Shiny Rainbow";
  if (normalized.includes("shiny") && (normalized.includes("golden") || normalized.includes("gold"))) return "Shiny Golden";
  if (normalized.includes("shiny")) return "Shiny Normal";
  if (normalized.includes("rainbow")) return "Rainbow";
  if (normalized.includes("golden") || normalized.includes("gold")) return "Golden";
  return "Normal";
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
async function supabaseSelect(env, table, params) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { headers: supabaseHeaders(env) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("select", text)); return text ? JSON.parse(text) : []; }
async function supabaseSelectAll(env, table, params, maxRows = 10000) { const rows = []; const pageSize = 1000; for (let offset = 0; offset < maxRows; offset += pageSize) { const page = await supabaseSelect(env, table, { ...(params || {}), limit: String(Math.min(pageSize, maxRows - offset)), offset: String(offset) }); rows.push(...page); if (page.length < pageSize) break; } return rows; }
async function supabaseInsert(env, table, rows, prefer = "representation") { if (!rows.length) return []; const res = await fetch(`${supabaseUrl(env)}/rest/v1/${table}`, { method: "POST", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: `return=${prefer}` }, body: JSON.stringify(rows) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("insert", text)); return text ? JSON.parse(text) : []; }
async function supabaseUpsert(env, table, rows, conflict) { if (!rows.length) return []; const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); if (conflict) url.searchParams.set("on_conflict", conflict); const res = await fetch(url.toString(), { method: "POST", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(rows) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("upsert", text)); return text ? JSON.parse(text) : []; }
async function supabaseUpdate(env, table, filters, values) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(filters || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { method: "PATCH", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: "return=minimal" }, body: JSON.stringify(values) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("update", text)); return true; }
async function supabaseDelete(env, table, filters) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(filters || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { method: "DELETE", headers: { ...supabaseHeaders(env), prefer: "return=minimal" } }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("delete", text)); return true; }
function supabaseFailureMessage(operation, text) { const detail = String(text || "").trim(); if (/error\s*code:\s*1016/i.test(detail)) return `Supabase ${operation} failed because SUPABASE_URL does not resolve (Cloudflare 1016). Update the Worker variable to the current Supabase Data API project URL.`; return `Supabase ${operation} failed: ${detail}`; }
function supabaseHeaders(env) { const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY; return { apikey: key, authorization: `Bearer ${key}` }; }
function supabaseUrl(env) { return String(env.SUPABASE_URL || "").replace(/\/+$/, ""); }
function requireSupabase(env) { if (!supabaseUrl(env) || !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)) throw httpError(500, "Missing Supabase environment variables."); }
function requireAdmin(request, env) { const expected = env.INGEST_ADMIN_TOKEN; if (!expected) return; if ((request.headers.get("authorization") || "") !== `Bearer ${expected}`) throw httpError(401, "Unauthorized"); }
function requireAllowedOrigin(request, env) {
  const origin = String(request.headers.get("origin") || "").trim();
  const allowed = String(env.ALLOWED_ORIGIN || "https://c0ld-clan.com")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (!origin || (!allowed.includes("*") && !allowed.includes(origin))) {
    throw httpError(403, "This inventory retry origin is not allowed.");
  }
}
function configuredUsers(env) { try { const parsed = JSON.parse(env.INVENTORY_USERS_JSON || "[]"); if (Array.isArray(parsed) && parsed.length) return parsed.map(u => ({ user_id: String(u.user_id || u.id || DEFAULT_USER_ID), username: String(u.username || DEFAULT_USERNAME), inventory_enabled: true })); } catch {} return [{ user_id: DEFAULT_USER_ID, username: DEFAULT_USERNAME, inventory_enabled: true }]; }
async function trackedInventoryUsers(env) {
  const users = new Map(configuredUsers(env).map(user => [String(user.user_id), user]));
  if (!envBool(env.INVENTORY_LEAGUE_FEATURE, true) || !supabaseUrl(env)) return [...users.values()];
  try {
    const grants = await supabaseSelectAll(env, OAUTH_GRANTS_TABLE, {
      select: "roblox_user_id,expires_at,metadata",
      roblox_user_id: "not.is.null",
      expires_at: `gt.${new Date().toISOString()}`,
      order: "last_used_at.asc.nullsfirst"
    }, 10000);
    for (const grant of grants) {
      const userId = String(grant.roblox_user_id || "").trim();
      if (!userId) continue;
      const existing = users.get(userId) || {};
      const oauthApp = String(grant.metadata?.oauth_app || grant.metadata?.purpose || "inventory").trim();
      const htgOnly = oauthApp === "hatch_tracker";
      users.set(userId, {
        user_id: userId,
        username: String(grant.metadata?.username || existing.username || userId).trim(),
        inventory_enabled: existing.inventory_enabled === true || !htgOnly,
        htg_oauth: existing.htg_oauth === true || htgOnly
      });
    }
  } catch (error) {
    console.warn("Connected inventory accounts could not be added to this scan", error?.message || error);
  }
  return [...users.values()];
}
async function isCurrentLeagueMember(env, userId, leagueName, runKey) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedLeague = String(leagueName || "").trim();
  if (!normalizedUserId || !normalizedLeague) return null;
  const endpoint = new URL(`${String(env.LEAGUE_API_BASE || DEFAULT_LEAGUE_API_BASE).replace(/\/+$/, "")}/api/leagues/current`);
  endpoint.searchParams.set("league", normalizedLeague);
  if (runKey) endpoint.searchParams.set("run", String(runKey));
  endpoint.searchParams.set("rank_lookup", "false");
  endpoint.searchParams.set("v", String(Date.now()));
  try {
    const response = await fetch(endpoint.toString(), { headers: { accept: "application/json" }, cf: { cacheTtl: 0 } });
    if (!response.ok) return null;
    const payload = await response.json();
    const row = (payload.rows || []).find(member => String(member.user_id || "").trim() === normalizedUserId);
    if (!row) return null;
    return {
      user_id: normalizedUserId,
      username: String(row.username || row.display_name || normalizedUserId).trim(),
      league: String(payload.league_name || normalizedLeague).trim()
    };
  } catch {
    return null;
  }
}
function requestUser(url) { return { user_id: String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim(), username: String(url.searchParams.get("username") || DEFAULT_USERNAME).trim() }; }
async function resolveRequestUser(env, url) {
  const userId = String(url.searchParams.get("user_id") || "").trim();
  const username = String(url.searchParams.get("username") || url.searchParams.get("account") || url.searchParams.get("user") || "").trim();
  if (userId) {
    return {
      user_id: userId,
      username: username || await fetchRobloxUsernameById(userId).catch(() => "") || userId
    };
  }
  if (username) {
    const account = await resolveHatchOAuthTargetAccount(username, env);
    if (account?.user_id) {
      return {
        user_id: String(account.user_id),
        username: account.username || username
      };
    }
  }
  return requestUser(url);
}
function timeZone(env) { return env.INVENTORY_TIME_ZONE || DEFAULT_TIME_ZONE; }
function inventoryMinFetchIntervalMinutes(env) { const value = Number(env.INVENTORY_MIN_FETCH_INTERVAL_MINUTES || DEFAULT_MIN_FETCH_INTERVAL_MINUTES); return Number.isFinite(value) ? Math.max(5, Math.min(1440, value)) : DEFAULT_MIN_FETCH_INTERVAL_MINUTES; }
function htgForceRefreshOnSchedule(env) {
  // HTG compares inventory revisions, not cached account payloads. Routine
  // scans must therefore request a fresh revision at the quota-safe schedule.
  // The former HATCH_FORCE_REFRESH_ON_SCHEDULE=false default made the scanner
  // appear healthy while repeatedly reading the same inventory. Deliberately
  // ignore that legacy switch; the only opt-out is explicit and diagnostic-only.
  return !envBool(env.HTG_DISABLE_FORCED_REFRESH, false);
}
function htgClockSlotMinutes(env) {
  const value = Math.floor(Number(env.HTG_SCHEDULE_ALIGNMENT_MINUTES || 15));
  // A 15-minute grid gives predictable :00, :15, :30 and :45 scans. Only
  // divisors of an hour keep that promise across every hour boundary.
  return [1, 5, 10, 15, 20, 30, 60].includes(value) ? value : 15;
}
function htgClockSlot(env, now = new Date(), userId = "") {
  const minutes = htgClockSlotMinutes(env);
  const minute = now.getUTCMinutes();
  // Keep a stable per-account minute inside each aligned schedule window.
  // This prevents every connected account from hitting the same BIG Games app
  // key at :00/:15/:30/:45, which can exceed its per-key minute limit.
  const staggered = !envBool(env.HTG_DISABLE_SCHEDULE_STAGGER, false);
  const offset = staggered && userId ? htgUserShard(userId, minutes) : 0;
  const minuteInWindow = minute % minutes;
  const isSlot = minuteInWindow === offset;
  const next = new Date(now.getTime());
  next.setUTCSeconds(0, 0);
  let increment = (offset - minuteInWindow + minutes) % minutes;
  if (increment === 0) increment = minutes;
  next.setUTCMinutes(next.getUTCMinutes() + increment);
  return {
    minutes,
    staggered,
    offset,
    is_slot: isSlot,
    next_slot_at: next.toISOString()
  };
}
function htgScanIntervalMinutes(env) {
  const value = Number(env.HTG_SCAN_INTERVAL_MINUTES || env.HATCH_SCAN_INTERVAL_MINUTES || DEFAULT_HTG_SCAN_INTERVAL_MINUTES);
  const minimum = htgForceRefreshOnSchedule(env)
    ? MIN_HTG_FORCE_REFRESH_INTERVAL_MINUTES
    : 5;
  return Number.isFinite(value)
    ? Math.max(minimum, Math.min(1440, value))
    : Math.max(minimum, DEFAULT_HTG_SCAN_INTERVAL_MINUTES);
}
function htgRefreshQuotaLimit(env) {
  const value = Number(env.HTG_REFRESH_QUOTA_LIMIT || env.HATCH_REFRESH_QUOTA_LIMIT || DEFAULT_HTG_REFRESH_QUOTA_LIMIT);
  // This is only the provisional value before BIG Games reports a per-account
  // limit. A configured 96 must never make an unknown standard account run at
  // VIP cadence; the live 96 response is adopted by htgTrackerQuotaSchedule.
  return Number.isFinite(value)
    ? Math.max(1, Math.min(DEFAULT_HTG_REFRESH_QUOTA_LIMIT, Math.floor(value)))
    : DEFAULT_HTG_REFRESH_QUOTA_LIMIT;
}
function htgRefreshQuotaReserve(env) {
  const limit = htgRefreshQuotaLimit(env);
  const value = Number(env.HTG_REFRESH_QUOTA_RESERVE || env.HATCH_REFRESH_QUOTA_RESERVE || DEFAULT_HTG_REFRESH_QUOTA_RESERVE);
  return Number.isFinite(value) ? Math.max(0, Math.min(limit - 1, Math.floor(value))) : Math.min(DEFAULT_HTG_REFRESH_QUOTA_RESERVE, limit - 1);
}
function htgScheduledRefreshBudget(env, providerLimit = 0) {
  const limit = Math.max(1, Number(providerLimit || htgRefreshQuotaLimit(env)));
  return Math.max(1, Math.floor(limit) - Math.min(htgRefreshQuotaReserve(env), Math.floor(limit) - 1));
}
function htgMinimumFullDayIntervalMinutes(env, providerLimit = 0) {
  return Math.max(1, Math.ceil(1440 / htgScheduledRefreshBudget(env, providerLimit)));
}
function htgFailureRetryMinutes(env, tracker) {
  const failures = Math.max(0, Math.floor(Number(tracker?.metadata?.htg_state?.consecutive_scan_failures || 0)));
  if (!failures) return 0;
  const lastError = firstString(tracker?.metadata?.htg_state?.last_scan_error).toLowerCase();
  // This error came from the removed per-account server-binding design. Once
  // globally assigned HTG channels exist, retaining its exponential backoff can
  // leave otherwise healthy accounts (notably DietPizza) unscanned for hours.
  if (/needs? a server binding|server binding is required/.test(lastError)) return 0;
  const baseValue = Number(env.HTG_FAILURE_RETRY_MINUTES || env.HATCH_FAILURE_RETRY_MINUTES || DEFAULT_HTG_FAILURE_RETRY_MINUTES);
  const maxValue = Number(env.HTG_FAILURE_RETRY_MAX_MINUTES || env.HATCH_FAILURE_RETRY_MAX_MINUTES || DEFAULT_HTG_FAILURE_RETRY_MAX_MINUTES);
  const base = Number.isFinite(baseValue) ? Math.max(5, Math.min(1440, Math.floor(baseValue))) : DEFAULT_HTG_FAILURE_RETRY_MINUTES;
  const maximum = Number.isFinite(maxValue) ? Math.max(base, Math.min(1440, Math.floor(maxValue))) : DEFAULT_HTG_FAILURE_RETRY_MAX_MINUTES;
  return Math.min(maximum, base * (2 ** Math.min(8, failures - 1)));
}
function htgMaxConcurrentScans(env) {
  const value = Number(env.HTG_MAX_CONCURRENT_SCANS || 3);
  return Number.isFinite(value) ? Math.max(1, Math.min(10, Math.floor(value))) : 3;
}
function htgTrackerIsOverdue(env, tracker, now = new Date()) {
  const lastChecked = new Date(tracker?.last_checked_at || tracker?.metadata?.htg_state?.last_checked_at || 0).getTime();
  if (!Number.isFinite(lastChecked) || lastChecked <= 0) return true;
  return now.getTime() - lastChecked > htgTrackerScanIntervalMinutes(env, tracker, now) * 2 * 60000;
}
function htgShardCount(env) {
  const fallback = Math.max(htgScanIntervalMinutes(env), htgMinimumFullDayIntervalMinutes(env));
  const value = Number(env.HTG_SHARD_COUNT || env.HATCH_SHARD_COUNT || fallback);
  return Number.isFinite(value) ? Math.max(fallback, Math.min(1440, Math.floor(value))) : fallback;
}
function htgCurrentShard(env, now = new Date()) {
  const count = htgShardCount(env);
  return Math.floor(now.getTime() / 60000) % count;
}
function htgUserShard(userId, shardCount) {
  const count = Math.max(1, Number(shardCount || 1));
  const text = String(userId || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}
function htgCronSupportsMinuteSharding(cron) {
  const text = String(cron || "").trim().replace(/\s+/g, " ");
  if (!text) return true;
  const minute = text.split(" ")[0] || "";
  return minute === "*" || minute === "*/1" || minute === "0/1";
}
function htgScheduleDecision(env, tracker, userId, now = new Date(), options = {}) {
  const shardCount = htgShardCount(env);
  const currentShard = htgCurrentShard(env, now);
  const userShard = htgUserShard(userId, shardCount);
  const shardCompatible = htgCronSupportsMinuteSharding(options.cron);
  const quota = htgTrackerQuotaSchedule(tracker, now, env);
  if (quota.exhausted_until_reset) {
    return {
      due: false,
      reason: "HTG forced-refresh quota is exhausted; scans are paused until the provider reset instead of repeatedly reading cached inventory.",
      shard_count: shardCount,
      current_shard: currentShard,
      user_shard: userShard,
      cron: options.cron || null,
      quota
    };
  }
  if (options.force) {
    return {
      due: true,
      reason: "Manual HTG check bypassed the shard and interval gates; provider quota protection remains active.",
      shard_count: shardCount,
      current_shard: currentShard,
      user_shard: userShard,
      cron: options.cron || null,
      shard_ignored: true,
      quota
    };
  }

  const lastChecked = new Date(tracker?.last_checked_at || tracker?.metadata?.htg_state?.last_checked_at || 0).getTime();
  const lastAttempt = new Date(tracker?.metadata?.htg_state?.last_scan_attempt_at || 0).getTime();
  const latestGateTime = Math.max(
    Number.isFinite(lastChecked) && lastChecked > 0 ? lastChecked : 0,
    Number.isFinite(lastAttempt) && lastAttempt > 0 ? lastAttempt : 0
  );
  if (!latestGateTime) {
    if (!options.ignoreShard && shardCompatible && userShard !== currentShard) {
      return { due: false, reason: "HTG account is waiting for its initial baseline shard.", shard_count: shardCount, current_shard: currentShard, user_shard: userShard, cron: options.cron || null, quota };
    }
    return { due: true, reason: "HTG account has not been checked yet.", shard_count: shardCount, current_shard: currentShard, user_shard: userShard, cron: options.cron || null, shard_ignored: !shardCompatible && !options.ignoreShard, quota };
  }

  const intervalMinutes = htgTrackerScanIntervalMinutes(env, tracker, now);
  const failureRetryMinutes = htgFailureRetryMinutes(env, tracker);
  const gateMinutes = Math.max(intervalMinutes, failureRetryMinutes);
  const intervalMs = gateMinutes * 60000;
  const elapsedMs = now.getTime() - latestGateTime;
  if (elapsedMs < Math.max(0, intervalMs - 30000)) {
    return { due: false, reason: failureRetryMinutes > intervalMinutes ? "HTG failure backoff has not elapsed." : "HTG quota-safe scan interval has not elapsed.", shard_count: shardCount, current_shard: currentShard, user_shard: userShard, elapsed_seconds: Math.floor(elapsedMs / 1000), interval_minutes: intervalMinutes, failure_retry_minutes: failureRetryMinutes, gate_minutes: gateMinutes, last_scan_attempt_at: Number.isFinite(lastAttempt) && lastAttempt > 0 ? new Date(lastAttempt).toISOString() : null, cron: options.cron || null, shard_ignored: !shardCompatible && !options.ignoreShard, quota };
  }
  return { due: true, reason: "HTG quota-safe scan interval elapsed; established accounts do not wait for another shard cycle.", shard_count: shardCount, current_shard: currentShard, user_shard: userShard, elapsed_seconds: Math.floor(elapsedMs / 1000), interval_minutes: intervalMinutes, failure_retry_minutes: failureRetryMinutes, gate_minutes: gateMinutes, last_scan_attempt_at: Number.isFinite(lastAttempt) && lastAttempt > 0 ? new Date(lastAttempt).toISOString() : null, cron: options.cron || null, shard_ignored: options.ignoreShard === true || !shardCompatible || userShard !== currentShard, quota };
}

function htgTrackerScanIntervalMinutes(env, tracker, now = new Date()) {
  const configured = htgScanIntervalMinutes(env);
  const quota = htgTrackerQuotaSchedule(tracker, now, env);
  if (!quota.limit || quota.reset_has_passed) return Math.max(configured, quota.minimum_full_day_interval_minutes || htgMinimumFullDayIntervalMinutes(env));
  // Once the provider reports this account's live usage and reset time, pace
  // against what actually remains. Keeping the full-day minimum here wastes
  // quota after quiet periods and can delay a real hatch by an extra cycle.
  return Math.max(configured, quota.minimum_remaining_interval_minutes || 0);
}

function htgTrackerQuotaSchedule(tracker, now = new Date(), env = null) {
  // HTG v2 is authoritative. Keep the legacy state fallback only for old
  // tracker records still present in diagnostics.
  const stored = plainObject(tracker?.metadata?.htg_v2?.refresh_quota || tracker?.metadata?.htg_state?.refresh_quota);
  const used = Math.max(0, Number(stored.used || 0));
  const configuredLimit = env ? htgRefreshQuotaLimit(env) : DEFAULT_HTG_REFRESH_QUOTA_LIMIT;
  // A configured 96 was previously treated as universal. Do not let it make
  // an unseen standard account scan at VIP cadence; use 48 until the API has
  // reported this particular account's actual limit.
  const fallbackLimit = Math.min(configuredLimit, DEFAULT_HTG_REFRESH_QUOTA_LIMIT);
  const reportedLimit = Number(stored.limit || 0);
  const limit = Math.max(1, Number.isFinite(reportedLimit) && reportedLimit > 0 ? reportedLimit : fallbackLimit);
  const reserve = env ? htgRefreshQuotaReserve(env) : Math.min(DEFAULT_HTG_REFRESH_QUOTA_RESERVE, limit - 1);
  const scheduledBudget = Math.max(1, limit - reserve);
  const resetsAt = firstString(stored.resets_at);
  const resetMs = new Date(resetsAt || 0).getTime();
  const nowMs = now.getTime();
  const resetHasPassed = !Number.isFinite(resetMs) || resetMs <= nowMs;
  const remaining = Math.max(0, limit - used);
  const scheduledRemaining = Math.max(0, scheduledBudget - used);
  const minutesUntilReset = !resetHasPassed ? Math.max(1, Math.ceil((resetMs - nowMs) / 60000)) : 0;
  const minimumFullDayInterval = Math.max(1, Math.ceil(1440 / scheduledBudget));
  const minimumRemainingInterval = !resetHasPassed && scheduledRemaining > 0
    ? Math.max(1, Math.ceil(minutesUntilReset / scheduledRemaining))
    : 0;
  return {
    used,
    limit,
    reserve,
    scheduled_budget: scheduledBudget,
    remaining,
    scheduled_remaining: scheduledRemaining,
    resets_at: resetsAt || null,
    reset_has_passed: resetHasPassed,
    exhausted_until_reset: scheduledRemaining <= 0 && !resetHasPassed,
    minimum_full_day_interval_minutes: minimumFullDayInterval,
    minimum_remaining_interval_minutes: minimumRemainingInterval
  };
}
function htgRequireSourceFilter(env) {
  return envBool(firstString(env.HTG_REQUIRE_SOURCE_FILTER, env.HATCH_REQUIRE_SOURCE_FILTER), DEFAULT_HTG_REQUIRE_SOURCE_FILTER);
}
function htgSourceConfirmationObservations(env) {
  const value = Number(env.HTG_SOURCE_CONFIRMATION_OBSERVATIONS || DEFAULT_HTG_SOURCE_CONFIRMATION_OBSERVATIONS);
  return Number.isFinite(value) ? Math.max(1, Math.min(4, Math.floor(value))) : DEFAULT_HTG_SOURCE_CONFIRMATION_OBSERVATIONS;
}
function inventorySnapshotItemReadLimit(env) {
  const value = Number(env.INVENTORY_SNAPSHOT_ITEM_READ_LIMIT || DEFAULT_INVENTORY_SNAPSHOT_ITEM_READ_LIMIT);
  return Number.isFinite(value) ? Math.max(10000, Math.min(200000, Math.floor(value))) : DEFAULT_INVENTORY_SNAPSHOT_ITEM_READ_LIMIT;
}
async function inventoryScanIsDue(env, user, now = new Date(), options = {}) {
  requireSupabase(env);
  const latest = await getLatestSnapshot(env, String(user.user_id || DEFAULT_USER_ID));
  if (!latest?.captured_at) return true;

  const latestTime = new Date(latest.captured_at).getTime();
  const elapsedMs = now.getTime() - latestTime;
  const requestedInterval = Number(options.minIntervalMinutes);
  if (Number.isFinite(requestedInterval)) {
    return elapsedMs >= Math.max(5, Math.min(1440, requestedInterval)) * 60000;
  }

  if (options.synchronized && envBool(env.INVENTORY_SYNC_COHORT, true)) {
    if (elapsedMs < 5 * 60000) return false;
    const intervalMs = 60 * 60000;
    const currentCohort = Math.floor(now.getTime() / intervalMs);
    const latestCohort = Math.floor(latestTime / intervalMs);
    return latest.source !== "schedule" || latestCohort < currentCohort;
  }

  return elapsedMs >= inventoryMinFetchIntervalMinutes(env) * 60000;
}
function localDateString(date, env) { return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone(env), year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function localHourMinute(date, env) { const parts = new Intl.DateTimeFormat("en-US", { timeZone: timeZone(env), hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date); return { hour: Number(parts.find(p => p.type === "hour")?.value || 0), minute: Number(parts.find(p => p.type === "minute")?.value || 0) }; }
function isMountainMidnight(date, env) { const { hour, minute } = localHourMinute(date, env); return hour === 0 && minute <= 10; }
function shouldPostHourly(date, env) { const { minute } = localHourMinute(date, env); return minute < Number(env.DISCORD_POST_MINUTE_WINDOW || 10); }
function hourlyPostKey(iso, env) { const d = new Date(iso); const date = localDateString(d, env); const { hour } = localHourMinute(d, env); return `${date}T${String(hour).padStart(2, "0")}`; }
function nextLocalDate(yyyyMmDd) { const d = new Date(`${yyyyMmDd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function sortAsc(snaps) { return [...(snaps || [])].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at)); }
function closestSnapshotAtOrBefore(sortedAsc, targetDate) { let best = null; for (const snap of sortedAsc || []) { if (new Date(snap.captured_at) <= targetDate) best = snap; else break; } return best; }
function lightSnapshot(s) { if (!s) return null; return { id: s.id, roblox_user_id: s.roblox_user_id, roblox_username: s.roblox_username, captured_at: s.captured_at, local_day: s.local_day, is_boundary: s.is_boundary, item_count: s.item_count, source: s.source }; }
function chunks(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function parseBool(v) { if (v === null || v === undefined || v === "") return null; return ["1", "true", "yes", "y"].includes(String(v).toLowerCase()); }
function envBool(value, fallback = false) { const parsed = parseBool(value); return parsed === null ? fallback : parsed; }
function fmtNumber(n) { return Number(n || 0).toLocaleString("en-US"); }
function formatDiscordTime(iso) { return new Date(iso).toLocaleString("en-US", { timeZone: DEFAULT_TIME_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function firstString(...values) { for (const value of values) { const text = String(value ?? "").trim(); if (text) return text; } return ""; }
function requiredDiscordSnowflake(value, label) { const text = firstString(value); if (!/^\d{10,24}$/.test(text)) throw httpError(400, `A valid ${label || "Discord ID"} is required.`); return text; }
function optionalDiscordSnowflake(value, label) { const text = firstString(value); if (!text) return ""; if (!/^\d{10,24}$/.test(text)) throw httpError(400, `A valid ${label || "Discord ID"} is required.`); return text; }
function shortInventoryNumber(value) { const number = Number(value); if (!Number.isFinite(number)) return "-"; const abs = Math.abs(number); if (abs >= 1e12) return `${(number / 1e12).toFixed(2).replace(/\.?0+$/, "")}T`; if (abs >= 1e9) return `${(number / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`; if (abs >= 1e6) return `${(number / 1e6).toFixed(2).replace(/\.?0+$/, "")}M`; if (abs >= 1e3) return `${(number / 1e3).toFixed(2).replace(/\.?0+$/, "")}K`; return Math.round(number).toLocaleString("en-US"); }
function escapeDiscordMarkdown(value) { return String(value || "").replace(/([\\`*_~|])/g, "\\$1"); }
async function readJsonOptional(request) { const text = await request.text().catch(() => ""); if (!String(text || "").trim()) return {}; try { const parsed = JSON.parse(text); return parsed && typeof parsed === "object" ? parsed : {}; } catch { throw httpError(400, "Request body must be valid JSON."); } }
function randomBase64Url(byteLength) { const bytes = new Uint8Array(byteLength); crypto.getRandomValues(bytes); return bytesToBase64Url(bytes); }
async function sha256Base64Url(value) { return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value))))); }
async function secretKey(secret, context) { const material = new TextEncoder().encode(`${context}:${secret}`); const digest = await crypto.subtle.digest("SHA-256", material); return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]); }
async function sealSecret(value, secret, context) { const iv = new Uint8Array(12); crypto.getRandomValues(iv); const key = await secretKey(secret, context); const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(String(value)))); return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(encrypted)}`; }
async function openSecret(value, secret, context) { const parts = String(value || "").split("."); if (parts.length !== 3 || parts[0] !== "v1") throw httpError(500, "Stored OAuth credential has an invalid format."); const key = await secretKey(secret, context); try { const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(parts[1]) }, key, base64UrlToBytes(parts[2])); return new TextDecoder().decode(clear); } catch { throw httpError(500, "Stored OAuth credential could not be decrypted. Re-authorize the app after changing its client secret."); } }
function bytesToBase64Url(bytes) { let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function base64UrlToBytes(value) { const padded = String(value).replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(String(value).length / 4) * 4, "="); const binary = atob(padded); return Uint8Array.from(binary, char => char.charCodeAt(0)); }
function httpError(status, message) { const err = new Error(message); err.status = status; return err; }
function json(value, status = 200) { return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }
function cacheJson(value, env, status = 200) { const seconds = Number(env.PUBLIC_CACHE_SECONDS || DEFAULT_PUBLIC_CACHE_SECONDS); return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${seconds}` } }); }
function withCors(response, request, env) { const headers = new Headers(response.headers); headers.set("access-control-allow-origin", env.ALLOWED_ORIGIN || "*"); headers.set("access-control-allow-methods", "GET,POST,OPTIONS"); headers.set("access-control-allow-headers", "content-type, authorization"); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
