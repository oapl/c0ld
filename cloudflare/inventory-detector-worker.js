const SNAPSHOT_TABLE = "ps99_inventory_snapshots";
const ITEM_TABLE = "ps99_inventory_snapshot_items";
const DISCORD_POSTS_TABLE = "ps99_inventory_discord_posts";
const OAUTH_GRANTS_TABLE = "ps99_inventory_oauth_grants";
const OAUTH_STATES_TABLE = "ps99_inventory_oauth_states";
const HATCH_TRACKER_USERS_TABLE = "ps99_hatch_tracker_users";
const HATCH_ALERTS_TABLE = "ps99_hatch_alerts";
const HATCH_GUILD_CONFIG_TABLE = "ps99_hatch_tracker_guilds";
const BIG_GAMES_AUTHORIZE_URL = "https://db.biggames.io/oauth/authorize";
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
  BIG_GAMES_INVENTORY_SCOPE,
  BIG_GAMES_TRADE_SCOPE,
  BIG_GAMES_BOOTH_SCOPE,
  BIG_GAMES_MAIL_SCOPE
]);
const HATCH_SOURCE_ENDPOINTS = Object.freeze([
  { key: "trades", label: "trade", scope: BIG_GAMES_TRADE_SCOPE, envUrl: "BIG_GAMES_TRADES_URL", defaultUrl: BIG_GAMES_TRADES_URL },
  { key: "booth", label: "booth", scope: BIG_GAMES_BOOTH_SCOPE, envUrl: "BIG_GAMES_BOOTH_URL", defaultUrl: BIG_GAMES_BOOTH_URL },
  { key: "mail", label: "mail", scope: BIG_GAMES_MAIL_SCOPE, envUrl: "BIG_GAMES_MAIL_URL", defaultUrl: BIG_GAMES_MAIL_URL }
]);
const BIG_GAMES_GRANT_KEY = "big_games_inventory";
const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_COMPONENTS_V2_FLAG = 1 << 15;
const HATCH_ALERT_COLOR = 0xff9b96;
const HATCH_ALERT_FOOTER_TEXT = "Oapl's 3rd-Eye | Hatch Tracker";
const DEFAULT_LEAGUE_API_BASE = "https://yamo-league-api-worker.opal-dde.workers.dev";
const DEFAULT_TIME_ZONE = "America/Denver";
const DEFAULT_USER_ID = "109818";
const DEFAULT_USERNAME = "Cinnamowopal";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const DEFAULT_MIN_FETCH_INTERVAL_MINUTES = 55;
const DEFAULT_PET_CATALOG_CACHE_SECONDS = 3600;
const HATCH_SOURCE_WINDOW_PADDING_MINUTES = 10;
const HATCH_TRACKER_TIERS = ["huge", "titanic", "gargantuan"];
const HATCH_TIER_PRIORITY = { huge: 1, titanic: 2, gargantuan: 3 };
const INVENTORY_BUILD_ID = "inventory-htg-2026-07-27k";
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
            channel_configured: Boolean(hatchAlertChannelId(env) || hatchAlertWebhookUrl(env)),
            bot_configured: Boolean(String(env.DISCORD_BOT_TOKEN || "").trim()),
            webhook_configured: Boolean(hatchAlertWebhookUrl(env))
          }
        });
      } else if (request.method === "POST" && url.pathname === "/api/inventory/oauth/start") {
        response = await handleOAuthStart(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/oauth/callback") {
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
      } else if (request.method === "POST" && url.pathname === "/api/hatch/tracker") {
        requireAdmin(request, env);
        response = await handleHatchTrackerCommand(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/hatch/tracker/status") {
        requireAdmin(request, env);
        response = await handleHatchTrackerStatus(request, env);
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
      const users = await trackedInventoryUsers(env);
      const discordUsers = new Set(configuredUsers(env).map(user => String(user.user_id)));
      const results = await Promise.allSettled(users.map(async user => {
        if (!await inventoryScanIsDue(env, user, now, { synchronized: true })) return { skipped: true, user };
        const result = await ingestInventory(env, user, "schedule", isMountainMidnight(now, env));
        if (!result.skipped) {
          result.hatch_alert = await postHatchAlertIfNeeded(env, user, result.snapshot, { source: "schedule" })
            .catch(error => {
              console.warn("Scheduled hatch alert check failed", error?.message || error);
              return { posted: false, error: error?.message || String(error) };
            });
        }
        if (!result.skipped && shouldPostHourly(now, env) && discordUsers.has(String(user.user_id))) await postHourlyDiffIfNeeded(env, user);
        return result;
      }));
      for (const result of results) if (result.status === "rejected") console.warn("Scheduled inventory scan failed", result.reason?.message || result.reason);
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
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const selectedTier = normalizeHatchTierSelection(body.tier || "all");
  const enableAfterAuth = body.enable_after_auth === true;
  const targetAccount = await resolveHatchOAuthTargetAccount(firstString(body.roblox_user_id, body.user_id, body.account, body.username), env);
  const pending = await fetchPendingHatchTrackerByDiscordUser(env, discordUserId);
  const existingAccounts = (await fetchHatchTrackersByDiscordUser(env, discordUserId))
    .filter(row => row.roblox_user_id);
  const inheritedTiers = hatchTrackerUnionEnabledTiers(existingAccounts);
  const inheritEnabled = !enableAfterAuth && existingAccounts.some(row => row.enabled === true);
  const pendingTiers = enableAfterAuth
    ? mergeHatchTierSelection(hatchTrackerConfiguredTiers(pending), selectedTier)
    : pending
      ? hatchTrackerConfiguredTiers(pending)
      : inheritedTiers.length
        ? inheritedTiers
        : hatchTrackerConfiguredTiers(pending);

  await savePendingHatchTracker(env, {
    existing: pending,
    discordUserId,
    discordUsername,
    enabled: enableAfterAuth || pending?.enabled === true || inheritEnabled,
    tiers: pendingTiers
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
      target_roblox_user_id: targetAccount?.user_id || null,
      target_roblox_username: targetAccount?.username || null,
      enable_after_auth: enableAfterAuth,
      enabled_tiers: pendingTiers
    }
  }], "state_hash");

  const authorizeUrl = new URL(BIG_GAMES_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", oauthApp.clientId);
  authorizeUrl.searchParams.set("redirect_uri", oauthApp.redirectUri);
  authorizeUrl.searchParams.set("scope", bigGamesOAuthScopeString(env, "hatch_tracker"));
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  return json({
    ok: true,
    user_id: targetAccount?.user_id || null,
    username: targetAccount?.username || null,
    authorize_url: authorizeUrl.toString(),
    expires_at: expiresAt,
    tracker: await hatchTrackerStatus(env, discordUserId),
    message: "Open authorize_url and approve access within 10 minutes."
  });
}

async function handleOAuthCallback(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") || "");
  const state = String(url.searchParams.get("state") || "");
  if (!state) return oauthHtml(false, "The callback did not include an authorization state.");

  const stateHash = await sha256Base64Url(state);
  const states = await supabaseSelect(env, OAUTH_STATES_TABLE, {
    select: "state_hash,code_verifier_ciphertext,expires_at,used_at,target_roblox_user_id,target_roblox_username,return_url,force_ingest,metadata",
    state_hash: `eq.${stateHash}`,
    limit: "1"
  });
  const pending = states[0];
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
  if (isHatchTrackerOAuth && scopes.includes(BIG_GAMES_PROFILE_SCOPE)) {
    try {
      rawProfile = await fetchProfileWithAccessToken(env, token.access_token);
      profileAccount = authorizedInventoryAccount(rawProfile, token);
    } catch (error) {
      console.warn("Big Games profile identity lookup failed", error?.message || error);
    }
  }
  let targetUserId = invitedUserId || tokenAccount.user_id || profileAccount.user_id;
  if (invitedUserId && tokenAccount.user_id && tokenAccount.user_id !== invitedUserId) {
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
      username: tokenAccount.username || profileAccount.username || pending.target_roblox_username || null,
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
      username: tokenAccount.username || profileAccount.username || pending.target_roblox_username || null,
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
  const account = inventoryAccount.user_id
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
    await supabaseDelete(env, OAUTH_GRANTS_TABLE, { grant_key: `eq.${oauthGrantKey(targetUserId)}` });
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, invitedUserId
      ? `This invitation is for Roblox user ${invitedUserId}, but a different account approved it.`
      : "The approving Roblox identity did not match the inventory account returned by BIG Games.");
  }
  await saveOAuthGrant(env, {
    userId: targetUserId,
    username: account.username || tokenAccount.username || pending.target_roblox_username || null,
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
    username: account.username || tokenAccount.username || pending.target_roblox_username || null,
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
      const nextTiers = removeHatchTierSelection(hatchTrackerEnabledTiers(row), selectedTier);
      return updateHatchTrackerRow(env, row, {
        discord_username: discordUsername || row.discord_username || null,
        enabled: nextTiers.length > 0,
        disabled_at: nextTiers.length > 0 ? row.disabled_at || null : now,
        updated_at: now,
        metadata: hatchTrackerMetadataWithTiers(row.metadata, nextTiers)
      });
    }));

    return json({
      ok: true,
      action,
      tier: selectedTier,
      account: accountSelector,
      tracker: await hatchTrackerStatus(env, discordUserId),
      message: accountSelector === "all"
        ? `${hatchTierResponseLabel(selectedTier)} hatch alerts were disabled for your connected HTG accounts.`
        : `${hatchTierResponseLabel(selectedTier)} hatch alerts were disabled for ${hatchTrackerRowLabel(targets[0])}.`
    });
  }

  if (!connectedRows.length) {
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
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
        ? `${hatchTierResponseLabel(selectedTier)} hatch alerts are queued for ${accountLabel}. Approve that same linked Roblox account in Big Games.`
        : `${hatchTierResponseLabel(selectedTier)} hatch alerts are queued. Connect each Big Games linked Roblox account you want tracked.`
    });
  }

  if (!selectedRows.length) {
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
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
      message: `${hatchTierResponseLabel(selectedTier)} hatch alerts are queued for ${auth.username || auth.user_id || accountSelector}. Approve that same linked Roblox account in Big Games.`
    });
  }

  const accessResults = await Promise.all(selectedRows.map(async row => ({
    row,
    access: await oauthStatus(env, row.roblox_user_id, "hatch_tracker")
  })));

  await Promise.all(accessResults.map(({ row }) => {
    const nextTiers = mergeHatchTierSelection(hatchTrackerEnabledTiers(row), selectedTier);
    return updateHatchTrackerRow(env, row, {
      discord_username: discordUsername || row.discord_username || null,
      enabled: true,
      last_enabled_at: now,
      disabled_at: null,
      updated_at: now,
      metadata: hatchTrackerMetadataWithTiers(row.metadata, nextTiers)
    });
  }));

  const expiredRows = accessResults.filter(item => !item.access.connected).map(item => item.row);
  if (expiredRows.length) {
    const firstExpired = expiredRows[0];
    const auth = await createHatchOAuthStartForDiscord(env, {
      discord_user_id: discordUserId,
      discord_username: discordUsername,
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
        ? `${hatchTierResponseLabel(selectedTier)} hatch alerts are queued for ${hatchTrackerRowLabel(firstExpired)}, but Big Games authorization needs to be refreshed.`
        : `${hatchTierResponseLabel(selectedTier)} hatch alerts are queued for ${expiredRows.length} accounts. Refresh ${hatchTrackerRowLabel(firstExpired)} with this link, then run the command again for the next account.`
    });
  }

  return json({
    ok: true,
    action,
    tier: selectedTier,
    account: accountSelector,
    tracker: await hatchTrackerStatus(env, discordUserId),
    message: accountSelector === "all"
      ? `${hatchTierResponseLabel(selectedTier)} hatch alerts are enabled for ${selectedRows.length} connected HTG account${selectedRows.length === 1 ? "" : "s"}.`
      : `${hatchTierResponseLabel(selectedTier)} hatch alerts are enabled for ${hatchTrackerRowLabel(selectedRows[0])}.`
  });
}

async function handleHatchAlertCheck(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const user = requestUser(url);
  const latest = await getLatestSnapshot(env, user.user_id);
  if (!latest) return json({ ok: false, message: "No inventory snapshot exists for that user yet." }, 404);
  return json({
    ok: true,
    ...(await postHatchAlertIfNeeded(env, user, latest, {
      source: "manual",
      force: parseBool(url.searchParams.get("force")) === true
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
  if (!discordUserId) return;
  const pendingTracker = await fetchPendingHatchTrackerByDiscordUser(env, discordUserId);
  const existing = await fetchHatchTrackerByRobloxUser(env, details.userId, { includeDisabled: true });
  const metadataTiers = Array.isArray(metadata.enabled_tiers)
    ? metadata.enabled_tiers.map(normalizeHatchTierValue).filter(tier => tier && tier !== "all")
    : [];
  const tiers = metadataTiers.length
    ? metadataTiers
    : hatchTrackerConfiguredTiers(existing).length
      ? hatchTrackerConfiguredTiers(existing)
      : hatchTrackerConfiguredTiers(pendingTracker);
  const now = new Date().toISOString();
  const row = {
    tracker_key: hatchTrackerKey(discordUserId, details.userId),
    discord_user_id: discordUserId,
    discord_username: firstString(metadata.discord_username, existing?.discord_username) || null,
    roblox_user_id: Number(details.userId),
    roblox_username: firstString(details.username, existing?.roblox_username, details.userId) || null,
    enabled: existing?.enabled === true || pendingTracker?.enabled === true || metadata.enable_after_auth === true,
    authorized_at: details.authorizedAt.toISOString(),
    authorization_expires_at: details.expiresAt,
    disabled_at: existing?.enabled === true || pendingTracker?.enabled === true || metadata.enable_after_auth === true
      ? null
      : existing?.disabled_at || pendingTracker?.disabled_at || null,
    updated_at: now,
    metadata: hatchTrackerMetadataWithTiers(existing?.metadata || pendingTracker?.metadata, tiers)
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
      enabled: Boolean(row.enabled),
      enabled_tiers: hatchTrackerEnabledTiers(row),
      connected: Boolean(access.connected),
      authorization_missing: Boolean(access.authorization_missing),
      reauthorization_required: Boolean(access.reauthorization_required),
      missing_scopes: access.missing_scopes || [],
      authorization_message: access.message || null,
      authorized_at: row.authorized_at || access.authorized_at || null,
      authorization_expires_at: row.authorization_expires_at || access.expires_at || null,
      last_checked_at: row.last_checked_at || null,
      last_alert_at: row.last_alert_at || null
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

  return {
    discord_user_id: discordUserId,
    discord_username: primary?.discord_username || pending?.discord_username || null,
    roblox_user_id: primary?.roblox_user_id || null,
    roblox_username: primary?.roblox_username || null,
    enabled: accounts.some(account => account.enabled),
    enabled_tiers: [...enabledTierSet],
    connected: accounts.some(account => account.connected),
    authorized_at: primary?.authorized_at || null,
    authorization_expires_at: primary?.authorization_expires_at || null,
    last_checked_at: primary?.last_checked_at || null,
    last_alert_at: primary?.last_alert_at || null,
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

async function savePendingHatchTracker(env, { existing, discordUserId, discordUsername, enabled, tiers }) {
  const now = new Date().toISOString();
  const row = {
    tracker_key: existing?.tracker_key || hatchTrackerKey(discordUserId, null),
    discord_user_id: discordUserId,
    discord_username: discordUsername || existing?.discord_username || null,
    roblox_user_id: null,
    roblox_username: null,
    enabled: enabled === true,
    last_enabled_at: enabled === true ? now : existing?.last_enabled_at || null,
    disabled_at: enabled === true ? null : existing?.disabled_at || null,
    updated_at: now,
    metadata: hatchTrackerMetadataWithTiers(existing?.metadata, tiers)
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

function hatchTrackerEnabledTiers(row) {
  if (!row || row.enabled !== true) return [];
  return hatchTrackerConfiguredTiers(row);
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

function hatchTrackerMetadataWithTiers(metadata, tiers) {
  return {
    ...((metadata && typeof metadata === "object" && !Array.isArray(metadata)) ? metadata : {}),
    enabled_tiers: [...new Set(tiers || [])].filter(tier => HATCH_TRACKER_TIERS.includes(tier))
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
    const grant = await findOAuthGrant(env, userId, "grant_key,roblox_user_id,scope,authorized_at,expires_at,last_used_at");
    const missingScopes = grant ? missingOAuthScopes(env, purpose, grant.scope) : [];
    const expired = !!grant && new Date(grant.expires_at).getTime() <= Date.now();
    const connected = !!grant && !expired && !missingScopes.length;
    return {
      configured,
      connected,
      authorized_at: grant?.authorized_at || null,
      expires_at: grant?.expires_at || null,
      last_used_at: grant?.last_used_at || null,
      scope: grant?.scope || null,
      missing_scopes: missingScopes,
      authorization_missing: !grant,
      reauthorization_required: !!grant && (expired || missingScopes.length > 0)
    };
  } catch (error) {
    return { configured, connected: false, expires_at: null, storage_ready: false, message: error?.message || String(error) };
  }
}

async function getUsableOAuthGrant(env, userId, purpose = "inventory") {
  if (!supabaseUrl(env)) return null;
  let grant;
  try {
    grant = await findOAuthGrant(env, userId, "grant_key,roblox_user_id,access_token_ciphertext,token_type,scope,authorized_at,expires_at,last_used_at,metadata");
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

async function findOAuthGrant(env, userId, select) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;
  const keyed = await supabaseSelect(env, OAUTH_GRANTS_TABLE, {
    select,
    grant_key: `eq.${oauthGrantKey(normalizedUserId)}`,
    limit: "1"
  });
  if (keyed[0]) return keyed[0];
  const legacy = await supabaseSelect(env, OAUTH_GRANTS_TABLE, {
    select,
    roblox_user_id: `eq.${normalizedUserId}`,
    order: "updated_at.desc",
    limit: "1"
  });
  return legacy[0] || null;
}

function oauthGrantKey(userId) {
  return `${BIG_GAMES_GRANT_KEY}:${String(userId || "").trim()}`;
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
  const app = {
    purpose,
    clientId: String(env[names.clientId] || "").trim(),
    clientSecret: String(env[names.clientSecret] || "").trim(),
    redirectUri: String(env[names.redirectUri] || "").trim()
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

function bigGamesOAuthScopeString(env, purpose = "inventory") {
  return bigGamesOAuthScopes(env, purpose).join(" ");
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
    ? `HTG access is connected through ${formatDateTime(expiresAt)} and the baseline snapshot was saved. Luna will compare future snapshots and alert only on enabled Huge, Titanic, or Gargantuan gains that do not match trade, booth, or mail activity.`
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
    grant_key: oauthGrantKey(userId),
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
  const title = success ? "Inventory tracker connected" : "Connection failed";
  const safeMessage = escapeHtml(message);
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{margin:0;background:#0b1118;color:#edf4ff;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{width:min(560px,calc(100% - 48px));background:#151e29;border:1px solid #314052;border-left:5px solid ${color};border-radius:12px;padding:28px}h1{font-size:24px;margin:0 0 12px}p{color:#b8c5d6;line-height:1.5;margin:0}</style></head><body><main class="card"><h1>${title}</h1><p>${safeMessage}</p></main></body></html>`, { status: success ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
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

async function postHatchAlertIfNeeded(env, user, latestSnapshot, options = {}) {
  if (!latestSnapshot?.id) return { posted: false, reason: "No latest snapshot was provided." };
  const userId = String(user.user_id || latestSnapshot.roblox_user_id || "").trim();
  if (!userId) return { posted: false, reason: "No Roblox user_id was provided." };

  const tracker = await fetchHatchTrackerByRobloxUser(env, userId);
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
    return { posted: false, reason: "Need at least two snapshots before hatch alerts can compare inventory.", snapshot_id: latestSnapshot.id };
  }

  const diff = await buildDiffFromSnapshots(env, start, end);
  const enabledTiers = new Set(hatchTrackerEnabledTiers(tracker));
  const candidates = hatchAlertCandidates(diff.gained || [])
    .filter(row => enabledTiers.has(row.tier));
  const sourceFilter = await filterHatchSourceGains(env, userId, candidates, { start, end });
  const hatched = sourceFilter.rows;
  if (!hatched.length) {
    await markHatchSnapshotChecked(env, tracker, latestSnapshot.id);
    return {
      posted: false,
      reason: candidates.length && sourceFilter.suppressed.length
        ? "All enabled Huge, Titanic, or Gargantuan gains matched trade, booth, or mail activity."
        : "No enabled Huge, Titanic, or Gargantuan gains were detected.",
      snapshot_id: latestSnapshot.id,
      source_filter: compactHatchSourceFilterSummary(sourceFilter)
    };
  }

  const featured = pickFeaturedHatch(hatched);
  const payload = buildHatchAlertDiscordPayload(tracker, user, featured, hatched, { start, end });
  const discordResponse = await sendHatchAlert(env, payload);
  const now = new Date().toISOString();

  await supabaseInsert(env, HATCH_ALERTS_TABLE, [{
    tracker_id: tracker.id || null,
    discord_user_id: tracker.discord_user_id,
    roblox_user_id: Number(userId),
    roblox_username: firstString(user.username, tracker.roblox_username, latestSnapshot.roblox_username, userId),
    snapshot_start_id: start.id,
    snapshot_end_id: end.id,
    period_start: start.captured_at,
    period_end: end.captured_at,
    tier: featured.tier,
    item_key: featured.item_key,
    item_class: featured.item_class,
    item_id: featured.item_id,
    display_name: featured.display_name,
    variant: featured.variant,
    delta: featured.delta,
    rap: featured.rap || 0,
    icon: featured.icon || null,
    image_url: featured.image_url || null,
    all_gained: hatched.map(compactHatchCandidate),
    discord_response: discordResponse || {},
    created_at: now
  }], "minimal");

  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    last_checked_snapshot_id: latestSnapshot.id,
    last_checked_at: now,
    last_alert_snapshot_id: latestSnapshot.id,
    last_alert_at: now,
    updated_at: now
  });

  return {
    posted: true,
    tier: featured.tier,
    item: featured.display_name,
    delta: featured.delta,
    snapshot_id: latestSnapshot.id,
    source_filter: compactHatchSourceFilterSummary(sourceFilter)
  };
}

function hatchAlertCandidates(rows) {
  return (rows || [])
    .map(row => {
      const tier = hatchTier(row);
      return tier ? {
        ...row,
        tier,
        tier_priority: HATCH_TIER_PRIORITY[tier] || 0,
        image_url: inventoryImageUrl(row.icon)
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

async function filterHatchSourceGains(env, userId, rows, period) {
  const candidates = Array.isArray(rows) ? rows : [];
  const unchanged = {
    rows: candidates,
    suppressed: [],
    available: false,
    reason: null,
    source_item_count: 0,
    sources: []
  };
  if (!candidates.length) return { ...unchanged, available: true };
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

  const fetched = await Promise.all(HATCH_SOURCE_ENDPOINTS.map(async endpoint => {
    try {
      const payload = await fetchAccountSourceWithAccessToken(env, accessToken, endpoint);
      const items = hatchSourceItemsFromPayload(endpoint, payload, userId, period);
      return { ok: true, endpoint, items };
    } catch (error) {
      return { ok: false, endpoint, error: error?.message || String(error), items: [] };
    }
  }));

  const failed = fetched.filter(result => !result.ok);
  const sources = fetched.map(result => ({
    key: result.endpoint.key,
    ok: result.ok,
    item_count: result.items.length,
    ...(result.error ? { error: result.error } : {})
  }));
  if (failed.length) {
    return {
      ...unchanged,
      reason: `Source fetch failed for ${failed.map(result => result.endpoint.key).join(", ")}.`,
      sources
    };
  }

  const sourceItems = fetched.flatMap(result => result.items);
  const filtered = suppressHatchSourceMatches(candidates, sourceItems);
  return {
    rows: filtered.rows,
    suppressed: filtered.suppressed,
    available: true,
    reason: null,
    source_item_count: sourceItems.length,
    sources
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
  const entries = Array.isArray(payload?.data?.entries)
    ? payload.data.entries
    : Array.isArray(payload?.entries)
      ? payload.entries
      : [];
  const output = [];
  for (const entry of entries) {
    if (!hatchSourceEntryInWindow(entry, period)) continue;
    const items = hatchSourceReceivedItems(endpoint.key, entry, userId);
    for (const item of items) {
      const normalized = normalizeHatchSourceItem(item, endpoint, entry);
      if (normalized) output.push(normalized);
    }
  }
  return output;
}

function hatchSourceReceivedItems(sourceKey, entry, userId) {
  if (!entry || typeof entry !== "object") return [];
  if (sourceKey === "mail") {
    if (!isIncomingHatchMail(entry, userId)) return [];
    return entry.item ? [entry.item] : [];
  }
  return Array.isArray(entry.received) ? entry.received : [];
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
  const raw = entry?.timestamp ?? entry?.time ?? entry?.createdAt ?? entry?.created_at ?? entry?.date;
  if (raw === null || raw === undefined || raw === "") return 0;
  const number = Number(raw);
  if (Number.isFinite(number)) return number > 100000000000 ? number : number * 1000;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHatchSourceItem(item, endpoint, entry) {
  if (!item || typeof item !== "object") return null;
  const itemClass = firstString(item.class, item.category, item.collection, "Pet");
  const itemId = firstString(item.id, item.itemId, item.configName, item.name);
  const displayName = firstString(item.displayName, item.name, itemId, item.stackKey, "Unknown item");
  const variant = getVariant(item);
  const count = Math.max(0, Math.floor(Number(itemCount(item)) || 0));
  const raw = {
    ...item,
    class: itemClass,
    category: firstString(item.category, item.collection, itemClass),
    collection: firstString(item.collection, item.category, itemClass)
  };
  const row = {
    item_key: getItemKey(item, itemClass, itemId, variant),
    item_class: itemClass,
    item_category: raw.category || raw.collection || null,
    item_id: itemId,
    display_name: displayName,
    variant,
    delta: count || 1,
    rap: itemRap(item),
    icon: firstString(item.icon, item.goldenIcon),
    raw,
    source: endpoint.key,
    source_label: endpoint.label,
    source_timestamp: entry?.timestamp || null
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
    sources: filter.sources || []
  };
}

function buildHatchAlertDiscordPayload(tracker, user, featured, hatched, snapshots) {
  const discordUserId = String(tracker.discord_user_id || "").trim();
  const username = firstString(user.username, tracker.roblox_username, featured.roblox_username, user.user_id, "Someone");
  const displayItem = hatchDisplayItemName(featured);
  const tier = hatchTierLabel(featured.tier);
  const tierEmoji = featured.tier === "gargantuan" ? "💎" : featured.tier === "titanic" ? "🌌" : "✨";
  const imageUrl = featured.image_url || "";
  const rapLine = featured.rap > 0 ? shortInventoryNumber(featured.rap) : "Unknown";
  const extra = hatched.length > 1
    ? `\n-# Also detected: ${hatched.slice(1, 5).map(row => `${hatchTierLabel(row.tier)} ${hatchDisplayItemName(row)} x${shortInventoryNumber(row.delta)}`).join(", ")}`
    : "";
  const timestamp = snapshots?.end?.captured_at || new Date().toISOString();
  const unix = Math.floor(new Date(timestamp).getTime() / 1000);
  const templateContext = {
    username: escapeDiscordMarkdown(username),
    displayItem: escapeDiscordMarkdown(displayItem),
    tier,
    tierEmoji,
    rapLine,
    quantityText: Number(featured.delta) > 1 ? ` x${shortInventoryNumber(featured.delta)}` : "",
    extra
  };
  const alertText = hatchAlertTemplate(featured.tier, templateContext);

  return {
    username: "Oapl's 3rd-Eye",
    allowed_mentions: discordUserId ? { users: [discordUserId] } : { parse: [] },
    flags: DISCORD_COMPONENTS_V2_FLAG,
    components: [
      {
        type: 17,
        accent_color: HATCH_ALERT_COLOR,
        components: [
          { type: 10, content: `## HATCHING ALERTS ${discordUserId ? `||<@${discordUserId}>||` : ""}` },
          { type: 14, divider: true, spacing: 1 },
          imageUrl
            ? {
                type: 9,
                components: [{ type: 10, content: alertText }],
                accessory: {
                  type: 11,
                  media: { url: imageUrl },
                  description: `${tier} ${displayItem}`
                }
              }
            : { type: 10, content: alertText },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content: `-# **${HATCH_ALERT_FOOTER_TEXT}** · <t:${unix}:R>` }
        ]
      }
    ]
  };
}

function hatchAlertTemplate(tier, context) {
  if (tier === "gargantuan") return gargantuanHatchAlertTemplate(context);
  if (tier === "titanic") return titanicHatchAlertTemplate(context);
  return hugeHatchAlertTemplate(context);
}

function hugeHatchAlertTemplate(context) {
  return [
    ".⋆˚࿔𖥔 ݁ ˖𓂃.˖✧˖.𓂃˖ ࣪ ⊹✶°⋆.",
    `🙇‍♀️ **${context.username}** hatched ${context.tierEmoji} **${context.tier}** ${context.displayItem}${context.quantityText}`,
    `💎 **RAP:** ${context.rapLine}`,
    "┊         ┊       ┊   ┊    ┊        ┊",
    "┊         ┊       ┊   ┊   ˚★⋆｡˚  ⋆",
    "┊         ┊       ┊   ⋆",
    "┊         ┊       ★⋆",
    "┊ ◦",
    "★⋆      ┊ .  ˚",
    "           ˚★",
    context.extra
  ].filter(Boolean).join("\n");
}

function titanicHatchAlertTemplate(context) {
  return [
    "✦・ﾟ: *✧･ﾟ:* TITANIC HATCH *:･ﾟ✧*:･ﾟ✦",
    `🙇‍♀️ **${context.username}** hatched ${context.tierEmoji} **${context.tier}** ${context.displayItem}${context.quantityText}`,
    `💎 **RAP:** ${context.rapLine}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "˚₊‧꒰ა ☆ ໒꒱ ‧₊˚",
    context.extra
  ].filter(Boolean).join("\n");
}

function gargantuanHatchAlertTemplate(context) {
  return [
    "✧･ﾟ: *✧･ﾟ:* GARGANTUAN HATCH *:･ﾟ✧*:･ﾟ✧",
    `🙇‍♀️ **${context.username}** hatched ${context.tierEmoji} **${context.tier}** ${context.displayItem}${context.quantityText}`,
    `💎 **RAP:** ${context.rapLine}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆",
    context.extra
  ].filter(Boolean).join("\n");
}

async function sendHatchAlert(env, payload) {
  const assignedConfigs = await fetchEnabledHatchGuildConfigs(env).catch(() => []);
  const botToken = String(env.DISCORD_BOT_TOKEN || "").trim();
  if (assignedConfigs.length) {
    if (!botToken) {
      throw httpError(500, "HTG hatch-alert channels are assigned, but DISCORD_BOT_TOKEN is not set on the inventory Worker.");
    }
    const destinations = [];
    for (const config of assignedConfigs) {
      const channelId = String(config.channel_id || "").trim();
      if (!channelId) continue;
      const posted = await sendHatchAlertBotMessage(channelId, botToken, payload);
      destinations.push({
        guild_id: config.guild_id || null,
        channel_id: channelId,
        response: posted
      });
    }
    if (!destinations.length) throw httpError(500, "HTG hatch-alert assignments exist, but none contain a channel_id.");
    return { ok: true, mode: "assigned_channels", destinations };
  }

  const channelId = hatchAlertChannelId(env);
  if (channelId && botToken) {
    return sendHatchAlertBotMessage(channelId, botToken, payload);
  }

  const webhookUrl = hatchAlertWebhookUrl(env);
  if (!webhookUrl) throw httpError(500, "Set HATCH_ALERT_CHANNEL_ID + DISCORD_BOT_TOKEN or HATCH_ALERT_WEBHOOK_URL on the inventory Worker.");
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");
  return sendDiscordWebhook(url.toString(), payload);
}

async function sendHatchAlertBotMessage(channelId, botToken, payload) {
  const { username, ...botPayload } = payload;
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
  if (!res.ok) throw httpError(res.status, `Discord hatch alert bot post failed: ${text.slice(0, 500)}`);
  try { return text ? JSON.parse(text) : { ok: true }; } catch { return { ok: true, response: text }; }
}

async function markHatchSnapshotChecked(env, tracker, snapshotId) {
  await supabaseUpdate(env, HATCH_TRACKER_USERS_TABLE, hatchTrackerRowFilter(tracker), {
    last_checked_snapshot_id: snapshotId,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

function hatchDisplayItemName(row) {
  const raw = String(firstString(row.display_name, row.item_id, row.item_key, "pet")).trim();
  return raw.replace(/^(Huge|Titanic|Gargantuan|Garg)\s+/i, "").trim() || raw;
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
  if (!res.ok || payload.status === "error") throw httpError(502, `Big Games Player API inventory fetch failed: ${JSON.stringify(payload).slice(0, 300)}`);
  attachResponseHeaders(payload, res.headers);
  return payload;
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
  if (raw.source_fetched_at || raw.source_is_stale !== undefined || raw.inventory_available !== undefined) {
    return {
      fetched_at: raw.source_fetched_at || null,
      is_stale: raw.source_is_stale ?? null,
      available: raw.inventory_available ?? null
    };
  }
  const data = raw.data || raw;
  if (data?.fetchedAt || raw.refresh) {
    return {
      fetched_at: data?.fetchedAt || null,
      is_stale: data?.cached ?? null,
      available: true,
      cached: data?.cached ?? null,
      refresh: raw.refresh || null
    };
  }
  const view = data?.views?.inventory || data?.inventory || null;
  return {
    fetched_at: view?.fetchedAt || view?.fetched_at || null,
    is_stale: view?.isStale ?? view?.is_stale ?? null,
    available: view?.available ?? null
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
  const rows = await supabaseSelectAll(env, ITEM_TABLE, { snapshot_id: `eq.${snapshotId}`, order: "id.asc" }, 10000);
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
      for (const row of rows) {
        const name = normalizePetName(row?.configName || row?.configData?.name || row?.name);
        if (!name) continue;
        const power = extractCatalogPower(row);
        if (power) powers.set(name, power);
      }
      return { powers, source: "BIG Games Pets catalog", warning: null };
    })();
  }
  try {
    petCatalogCache = await petCatalogPromise;
    const seconds = clampNumber(env.PET_CATALOG_CACHE_SECONDS, DEFAULT_PET_CATALOG_CACHE_SECONDS, 60, 86400);
    petCatalogExpiresAt = Date.now() + seconds * 1000;
  } catch (error) {
    petCatalogCache = {
      powers: new Map(),
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
  const sources = [catalog?.source && catalog.source !== "unavailable" ? catalog.source : null, "PS99 decompile", overrides.size ? "override" : null].filter(Boolean);
  return { powers, source: sources.join(" + "), warning: catalog?.warning || null };
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
function configuredUsers(env) { try { const parsed = JSON.parse(env.INVENTORY_USERS_JSON || "[]"); if (Array.isArray(parsed) && parsed.length) return parsed.map(u => ({ user_id: String(u.user_id || u.id || DEFAULT_USER_ID), username: String(u.username || DEFAULT_USERNAME) })); } catch {} return [{ user_id: DEFAULT_USER_ID, username: DEFAULT_USERNAME }]; }
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
      users.set(userId, {
        user_id: userId,
        username: String(grant.metadata?.username || users.get(userId)?.username || userId).trim()
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
function timeZone(env) { return env.INVENTORY_TIME_ZONE || DEFAULT_TIME_ZONE; }
function inventoryMinFetchIntervalMinutes(env) { const value = Number(env.INVENTORY_MIN_FETCH_INTERVAL_MINUTES || DEFAULT_MIN_FETCH_INTERVAL_MINUTES); return Number.isFinite(value) ? Math.max(5, Math.min(1440, value)) : DEFAULT_MIN_FETCH_INTERVAL_MINUTES; }
async function inventoryScanIsDue(env, user, now = new Date(), options = {}) { requireSupabase(env); const latest = await getLatestSnapshot(env, String(user.user_id || DEFAULT_USER_ID)); if (!latest?.captured_at) return true; const latestTime = new Date(latest.captured_at).getTime(); if (options.synchronized && envBool(env.INVENTORY_SYNC_COHORT, true)) { if (now.getTime() - latestTime < 5 * 60000) return false; const intervalMs = 60 * 60000; const currentCohort = Math.floor(now.getTime() / intervalMs); const latestCohort = Math.floor(latestTime / intervalMs); return latest.source !== "schedule" || latestCohort < currentCohort; } return now.getTime() - latestTime >= inventoryMinFetchIntervalMinutes(env) * 60000; }
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
