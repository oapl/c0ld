const SNAPSHOT_TABLE = "ps99_inventory_snapshots";
const ITEM_TABLE = "ps99_inventory_snapshot_items";
const DISCORD_POSTS_TABLE = "ps99_inventory_discord_posts";
const OAUTH_GRANTS_TABLE = "ps99_inventory_oauth_grants";
const OAUTH_STATES_TABLE = "ps99_inventory_oauth_states";
const BIG_GAMES_AUTHORIZE_URL = "https://db.biggames.io/oauth/authorize";
const BIG_GAMES_TOKEN_URL = "https://db.biggames.io/oauth/token";
const BIG_GAMES_INVENTORY_URL = "https://ps99.biggamesapi.io/v1/account/inventory";
const BIG_GAMES_INVENTORY_SCOPE = "player-data:pet-simulator-99:inventory:read";
const BIG_GAMES_GRANT_KEY = "big_games_inventory";
const DEFAULT_TIME_ZONE = "America/Denver";
const DEFAULT_USER_ID = "109818";
const DEFAULT_USERNAME = "Cinnamowopal";
const DEFAULT_PUBLIC_CACHE_SECONDS = 5;
const DEFAULT_MIN_FETCH_INTERVAL_MINUTES = 55;
const SNAPSHOT_PUBLIC_SELECT = "id,roblox_user_id,roblox_username,source,captured_at,local_day,is_boundary,boundary_label,item_count";

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
          timezone: timeZone(env),
          min_fetch_interval_minutes: inventoryMinFetchIntervalMinutes(env),
          skip_duplicate_source: envBool(env.INVENTORY_SKIP_DUPLICATE_SOURCE, true),
          supabase_configured: !!(supabaseUrl(env) && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)),
          big_games_oauth_configured: bigGamesOAuthConfigured(env),
          big_games_oauth_connected: oauth.connected,
          big_games_oauth_expires_at: oauth.expires_at
        });
      } else if (request.method === "POST" && url.pathname === "/api/inventory/oauth/start") {
        response = await handleOAuthStart(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/oauth/callback") {
        response = await handleOAuthCallback(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/oauth/status") {
        response = await handleOAuthStatus(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/inventory/ingest") {
        requireAdmin(request, env);
        response = await handleIngest(request, env, "manual");
      } else if (request.method === "POST" && url.pathname === "/api/inventory/post-hourly") {
        requireAdmin(request, env);
        response = await handlePostHourly(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/latest") {
        response = await handleLatest(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/diff") {
        response = await handleDiff(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/inventory/hourly") {
        response = await handleHourlySeries(request, env);
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
      for (const user of configuredUsers(env)) {
        if (!await inventoryScanIsDue(env, user, now)) continue;
        const result = await ingestInventory(env, user, "schedule", isMountainMidnight(now, env));
        if (!result.skipped && shouldPostHourly(now, env)) await postHourlyDiffIfNeeded(env, user);
      }
    })());
  }
};

async function handleOAuthStart(request, env) {
  requireSupabase(env);
  requireBigGamesOAuth(env);

  const url = new URL(request.url);
  const requestedUserId = String(url.searchParams.get("user_id") || configuredUsers(env)[0]?.user_id || "").trim();
  const configuredUser = configuredUsers(env).find(user => String(user.user_id) === requestedUserId);
  if (!requestedUserId) throw httpError(400, "A Roblox user_id is required.");
  if (!configuredUser && !hasAdminAuthorization(request, env)) {
    throw httpError(403, "This Roblox account is not enabled for inventory tracking.");
  }
  const targetUser = {
    user_id: requestedUserId,
    username: String(url.searchParams.get("username") || configuredUser?.username || requestedUserId).trim()
  };
  const returnUrl = validatedOAuthReturnUrl(url.searchParams.get("return_url"), env);

  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  await supabaseUpsert(env, OAUTH_STATES_TABLE, [{
    state_hash: await sha256Base64Url(state),
    code_verifier_ciphertext: await sealSecret(verifier, env.BIG_GAMES_CLIENT_SECRET, "big-games-pkce-verifier"),
    expires_at: expiresAt,
    created_at: now.toISOString(),
    used_at: null,
    target_roblox_user_id: Number(targetUser.user_id),
    target_roblox_username: targetUser.username,
    return_url: returnUrl || null,
    force_ingest: true
  }], "state_hash");

  const authorizeUrl = new URL(BIG_GAMES_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", String(env.BIG_GAMES_CLIENT_ID));
  authorizeUrl.searchParams.set("redirect_uri", bigGamesRedirectUri(env));
  authorizeUrl.searchParams.set("scope", BIG_GAMES_INVENTORY_SCOPE);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  return json({
    ok: true,
    user_id: targetUser.user_id,
    username: targetUser.username,
    authorize_url: authorizeUrl.toString(),
    expires_at: expiresAt,
    message: "Open authorize_url and approve access within 10 minutes."
  });
}

async function handleOAuthCallback(request, env) {
  requireSupabase(env);
  requireBigGamesOAuth(env);
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") || "");
  const state = String(url.searchParams.get("state") || "");
  if (!state) return oauthHtml(false, "The callback did not include an authorization state.");

  const stateHash = await sha256Base64Url(state);
  const states = await supabaseSelect(env, OAUTH_STATES_TABLE, {
    select: "state_hash,code_verifier_ciphertext,expires_at,used_at,target_roblox_user_id,target_roblox_username,return_url,force_ingest",
    state_hash: `eq.${stateHash}`,
    limit: "1"
  });
  const pending = states[0];
  if (!pending || pending.used_at || new Date(pending.expires_at).getTime() <= Date.now()) {
    return oauthHtml(false, "This authorization link is invalid, expired, or was already used. Start again.");
  }
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `Big Games authorization was denied: ${oauthError}`);
  }
  if (!code) return oauthCompletion(pending, false, "The callback did not include an authorization code.");

  const verifier = await openSecret(pending.code_verifier_ciphertext, env.BIG_GAMES_CLIENT_SECRET, "big-games-pkce-verifier");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: bigGamesRedirectUri(env),
    code_verifier: verifier
  });
  const basic = btoa(`${env.BIG_GAMES_CLIENT_ID}:${env.BIG_GAMES_CLIENT_SECRET}`);
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

  let rawInventory;
  let forcedRefresh = pending.force_ingest !== false;
  try {
    rawInventory = await fetchInventoryWithAccessToken(env, token.access_token, { forceRefresh: forcedRefresh });
  } catch (forcedError) {
    if (!forcedRefresh) {
      await markOAuthStateUsed(env, stateHash);
      return oauthCompletion(pending, false, `Inventory access was approved, but the first pull failed: ${forcedError?.message || forcedError}`);
    }
    try {
      rawInventory = await fetchInventoryWithAccessToken(env, token.access_token, { forceRefresh: false });
      forcedRefresh = false;
    } catch (fallbackError) {
      await markOAuthStateUsed(env, stateHash);
      return oauthCompletion(pending, false, `Inventory access was approved, but the first pull failed: ${fallbackError?.message || fallbackError}`);
    }
  }
  const account = authorizedInventoryAccount(rawInventory);
  const targetUserId = String(pending.target_roblox_user_id || "").trim();
  if (!account.user_id) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, "BIG Games did not identify the Roblox account attached to this approval.");
  }
  if (targetUserId && account.user_id !== targetUserId) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `This invitation is for Roblox user ${targetUserId}, but a different account approved it.`);
  }

  const authorizedAt = new Date();
  const expiresIn = Math.max(60, Number(token.expires_in || 2592000));
  const expiresAt = new Date(authorizedAt.getTime() + expiresIn * 1000).toISOString();
  await supabaseUpsert(env, OAUTH_GRANTS_TABLE, [{
    grant_key: oauthGrantKey(account.user_id),
    roblox_user_id: Number(account.user_id),
    access_token_ciphertext: await sealSecret(token.access_token, env.BIG_GAMES_CLIENT_SECRET, "big-games-access-token"),
    token_type: token.token_type || "Bearer",
    scope: scopes.join(" "),
    authorized_at: authorizedAt.toISOString(),
    expires_at: expiresAt,
    last_used_at: null,
    metadata: { expires_in: expiresIn, username: account.username || pending.target_roblox_username || null },
    updated_at: authorizedAt.toISOString()
  }], "grant_key");
  const user = {
    user_id: account.user_id,
    username: account.username || pending.target_roblox_username || account.user_id
  };
  let ingest;
  try {
    ingest = await ingestInventory(env, user, "oauth_callback", false, { force: true, rawInventory });
  } catch (error) {
    await markOAuthStateUsed(env, stateHash);
    return oauthCompletion(pending, false, `Access is connected, but the first inventory snapshot could not be saved: ${error?.message || error}`, { user_id: account.user_id });
  }
  await markOAuthStateUsed(env, stateHash);

  return oauthCompletion(pending, true, `Inventory access is connected through ${formatDateTime(expiresAt)} and the first snapshot was pulled.`, {
    user_id: account.user_id,
    pulled: "1",
    forced: forcedRefresh ? "1" : "0",
    snapshot_at: ingest.snapshot?.captured_at || ""
  });
}

async function handleOAuthStatus(request, env) {
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || configuredUsers(env)[0]?.user_id || DEFAULT_USER_ID).trim();
  return json({ ok: true, user_id: userId, ...(await oauthStatus(env, userId)) });
}

async function oauthStatus(env, userId = configuredUsers(env)[0]?.user_id || DEFAULT_USER_ID) {
  const configured = bigGamesOAuthConfigured(env);
  if (!configured || !supabaseUrl(env) || !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)) {
    return { configured, connected: false, expires_at: null };
  }
  try {
    const grant = await findOAuthGrant(env, userId, "grant_key,roblox_user_id,scope,authorized_at,expires_at,last_used_at");
    const connected = !!grant && new Date(grant.expires_at).getTime() > Date.now();
    return {
      configured,
      connected,
      authorized_at: grant?.authorized_at || null,
      expires_at: grant?.expires_at || null,
      last_used_at: grant?.last_used_at || null,
      scope: grant?.scope || null,
      reauthorization_required: !!grant && !connected
    };
  } catch (error) {
    return { configured, connected: false, expires_at: null, storage_ready: false, message: error?.message || String(error) };
  }
}

async function getUsableOAuthGrant(env, userId) {
  if (!bigGamesOAuthConfigured(env) || !supabaseUrl(env)) return null;
  let grant;
  try {
    grant = await findOAuthGrant(env, userId, "grant_key,roblox_user_id,access_token_ciphertext,token_type,scope,authorized_at,expires_at,last_used_at");
  } catch (error) {
    if (/does not exist|schema cache|PGRST205/i.test(error?.message || "")) return null;
    throw error;
  }
  if (!grant) return null;
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
  return !!(env.BIG_GAMES_CLIENT_ID && env.BIG_GAMES_CLIENT_SECRET && bigGamesRedirectUri(env));
}

function requireBigGamesOAuth(env) {
  if (!bigGamesOAuthConfigured(env)) throw httpError(500, "Missing BIG_GAMES_CLIENT_ID, BIG_GAMES_CLIENT_SECRET, or BIG_GAMES_REDIRECT_URI.");
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

function oauthCompletion(pending, success, message, params = {}) {
  if (pending?.return_url) {
    const target = new URL(pending.return_url);
    target.searchParams.set("inventory_oauth", success ? "connected" : "error");
    target.searchParams.set("inventory_message", message);
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") target.searchParams.set(key, String(value));
    return Response.redirect(target.toString(), 303);
  }
  return oauthHtml(success, message);
}

function authorizedInventoryAccount(raw) {
  const data = raw?.data || raw || {};
  const account = data.account || {};
  return {
    user_id: String(account.robloxUserId || account.roblox_user_id || account.userId || account.user_id || "").trim(),
    username: String(account.username || account.name || "").trim()
  };
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
  if (!snapshot) return json({ ok: false, message: "No inventory snapshots found." }, 404);
  const includeItems = parseBool(url.searchParams.get("include_items")) !== false;
  const items = includeItems ? await getSnapshotItems(env, snapshot.id) : undefined;
  return cacheJson({ ok: true, snapshot: lightSnapshot(snapshot), source: inventorySourceMeta(snapshot.raw), ...(includeItems ? { items } : {}) }, env);
}

async function handleDiff(request, env) {
  requireSupabase(env);
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim();
  const mode = String(url.searchParams.get("mode") || "daily").toLowerCase();
  const snapshots = await getUserSnapshots(env, userId, Number(url.searchParams.get("limit") || 500));
  if (!snapshots.length) return json({ ok: false, message: "No inventory snapshots found." }, 404);

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
  const snapshots = await getUserSnapshots(env, userId, Math.max(500, hours * 20));
  if (!snapshots.length) return json({ ok: false, message: "No inventory snapshots found." }, 404);

  const sorted = sortAsc(snapshots);
  const latest = sorted[sorted.length - 1];
  const cutoff = new Date(new Date(latest.captured_at).getTime() - (hours + 1) * 3600000);
  const recent = sorted.filter(snapshot => new Date(snapshot.captured_at) >= cutoff);
  const itemCache = new Map();
  const itemsFor = async snapshot => {
    if (!itemCache.has(snapshot.id)) itemCache.set(snapshot.id, getSnapshotItems(env, snapshot.id));
    return itemCache.get(snapshot.id);
  };
  const rows = [];

  for (let i = 1; i < recent.length; i++) {
    const start = recent[i - 1];
    const end = recent[i];
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

  return cacheJson({ ok: true, user_id: userId, hours, rows }, env);
}

async function ingestInventory(env, user, source, isBoundary, options = {}) {
  requireSupabase(env);
  const fetchedAt = new Date().toISOString();
  const localDay = localDateString(new Date(fetchedAt), env);
  const userId = String(user.user_id || DEFAULT_USER_ID).trim();
  const username = String(user.username || userId).trim();

  const raw = options.rawInventory || await fetchInventory(env, { user_id: userId, username }, { forceRefresh: options.force === true });
  const rawItems = extractInventoryItems(raw);
  const sourceMeta = inventorySourceMeta(raw);
  if (envBool(env.INVENTORY_REJECT_EMPTY, true) && !rawItems.length) {
    throw httpError(502, "Big Games returned an empty inventory; snapshot was rejected to prevent a false inventory wipe.");
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
    raw: inventorySnapshotMeta(raw)
  }], "representation");

  const snapshot = snapshotRows[0];
  const itemRows = rawItems.map(item => normalizeItemRow(item, snapshot.id, userId, fetchedAt, localDay));

  for (const chunk of chunks(itemRows, 500)) {
    if (chunk.length) await supabaseInsert(env, ITEM_TABLE, chunk, "minimal");
  }

  return { skipped: false, snapshot: lightSnapshot(snapshot), source: sourceMeta, raw_item_count: rawItems.length, item_count: itemRows.length };
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
  const accessToken = await openSecret(grant.access_token_ciphertext, env.BIG_GAMES_CLIENT_SECRET, "big-games-access-token");
  const payload = await fetchInventoryWithAccessToken(env, accessToken, options);
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
  return payload;
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

function extractInventoryItems(raw) {
  const data = raw?.data || raw;
  const view = data?.views?.inventory;
  if (view && view.available === false) return [];
  const candidates = [view?.data?.items, data?.inventory?.items, data?.items, raw?.items];
  for (const arr of candidates) if (Array.isArray(arr)) return arr;
  return findBestItemArray(raw);
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

function inventorySnapshotMeta(raw) {
  const data = raw?.data || raw || {};
  const account = data?.account || {};
  const source = inventorySourceMeta(raw);
  return {
    provider: raw?.refresh ? "big_games_oauth_player_api" : "big_games_public_player_api",
    source_fetched_at: source.fetched_at,
    source_is_stale: source.is_stale,
    inventory_available: source.available,
    refresh: source.refresh || null,
    account: {
      roblox_user_id: account.robloxUserId || account.roblox_user_id || null,
      username: account.username || null,
      display_name: account.displayName || account.display_name || null
    }
  };
}

function findBestItemArray(obj, path = "") {
  let best = { score: 0, arr: [] };
  walk(obj, path);
  return best.arr;
  function walk(value, p) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      const score = scoreArray(p, value);
      if (score > best.score) best = { score, arr: value };
      for (let i = 0; i < Math.min(value.length, 3); i++) walk(value[i], `${p}.${i}`);
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(v, p ? `${p}.${k}` : k);
  }
}

function scoreArray(path, arr) {
  if (!Array.isArray(arr) || !arr.length || typeof arr[0] !== "object") return 0;
  let score = /inventory|items/i.test(path) ? 20 : 0;
  for (const item of arr.slice(0, 15)) {
    const keys = Object.keys(item || {}).map(k => k.toLowerCase());
    if (keys.includes("id")) score += 4;
    if (keys.includes("class")) score += 5;
    if (keys.includes("count") || keys.includes("amount") || keys.includes("quantity")) score += 3;
    if (keys.includes("stackkey") || keys.includes("stack_key")) score += 2;
  }
  return score;
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
function itemCount(item) { const n = Number(item.count ?? item.amount ?? item.quantity ?? item.qty ?? 1); return Number.isFinite(n) ? n : 1; }
function itemRap(item) { for (const v of [item.rap, item.RAP, item.value, item.Value, item.recentAveragePrice, item.rawData?.rap]) { const n = Number(v); if (Number.isFinite(n) && n > 0) return n; } return 0; }
function getVariant(item) {
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
    order: "captured_at.desc",
    limit: String(limit)
  });
}
async function getLatestSnapshot(env, userId, options = {}) {
  const rows = await supabaseSelect(env, SNAPSHOT_TABLE, {
    select: options.includeRaw ? `${SNAPSHOT_PUBLIC_SELECT},raw` : SNAPSHOT_PUBLIC_SELECT,
    roblox_user_id: `eq.${userId}`,
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
async function supabaseSelect(env, table, params) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { headers: supabaseHeaders(env) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("select", text)); return text ? JSON.parse(text) : []; }
async function supabaseSelectAll(env, table, params, maxRows = 10000) { const rows = []; const pageSize = 1000; for (let offset = 0; offset < maxRows; offset += pageSize) { const page = await supabaseSelect(env, table, { ...(params || {}), limit: String(Math.min(pageSize, maxRows - offset)), offset: String(offset) }); rows.push(...page); if (page.length < pageSize) break; } return rows; }
async function supabaseInsert(env, table, rows, prefer = "representation") { if (!rows.length) return []; const res = await fetch(`${supabaseUrl(env)}/rest/v1/${table}`, { method: "POST", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: `return=${prefer}` }, body: JSON.stringify(rows) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("insert", text)); return text ? JSON.parse(text) : []; }
async function supabaseUpsert(env, table, rows, conflict) { if (!rows.length) return []; const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); if (conflict) url.searchParams.set("on_conflict", conflict); const res = await fetch(url.toString(), { method: "POST", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(rows) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("upsert", text)); return text ? JSON.parse(text) : []; }
async function supabaseUpdate(env, table, filters, values) { const url = new URL(`${supabaseUrl(env)}/rest/v1/${table}`); Object.entries(filters || {}).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url.toString(), { method: "PATCH", headers: { ...supabaseHeaders(env), "content-type": "application/json", prefer: "return=minimal" }, body: JSON.stringify(values) }); const text = await res.text(); if (!res.ok) throw httpError(res.status, supabaseFailureMessage("update", text)); return true; }
function supabaseFailureMessage(operation, text) { const detail = String(text || "").trim(); if (/error\s*code:\s*1016/i.test(detail)) return `Supabase ${operation} failed because SUPABASE_URL does not resolve (Cloudflare 1016). Update the Worker variable to the current Supabase Data API project URL.`; return `Supabase ${operation} failed: ${detail}`; }
function supabaseHeaders(env) { const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY; return { apikey: key, authorization: `Bearer ${key}` }; }
function supabaseUrl(env) { return String(env.SUPABASE_URL || "").replace(/\/+$/, ""); }
function requireSupabase(env) { if (!supabaseUrl(env) || !(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY)) throw httpError(500, "Missing Supabase environment variables."); }
function requireAdmin(request, env) { const expected = env.INGEST_ADMIN_TOKEN; if (!expected) return; if ((request.headers.get("authorization") || "") !== `Bearer ${expected}`) throw httpError(401, "Unauthorized"); }
function configuredUsers(env) { try { const parsed = JSON.parse(env.INVENTORY_USERS_JSON || "[]"); if (Array.isArray(parsed) && parsed.length) return parsed.map(u => ({ user_id: String(u.user_id || u.id || DEFAULT_USER_ID), username: String(u.username || DEFAULT_USERNAME) })); } catch {} return [{ user_id: DEFAULT_USER_ID, username: DEFAULT_USERNAME }]; }
function requestUser(url) { return { user_id: String(url.searchParams.get("user_id") || DEFAULT_USER_ID).trim(), username: String(url.searchParams.get("username") || DEFAULT_USERNAME).trim() }; }
function timeZone(env) { return env.INVENTORY_TIME_ZONE || DEFAULT_TIME_ZONE; }
function inventoryMinFetchIntervalMinutes(env) { const value = Number(env.INVENTORY_MIN_FETCH_INTERVAL_MINUTES || DEFAULT_MIN_FETCH_INTERVAL_MINUTES); return Number.isFinite(value) ? Math.max(5, Math.min(1440, value)) : DEFAULT_MIN_FETCH_INTERVAL_MINUTES; }
async function inventoryScanIsDue(env, user, now = new Date()) { requireSupabase(env); const latest = await getLatestSnapshot(env, String(user.user_id || DEFAULT_USER_ID)); if (!latest?.captured_at) return true; return now.getTime() - new Date(latest.captured_at).getTime() >= inventoryMinFetchIntervalMinutes(env) * 60000; }
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
