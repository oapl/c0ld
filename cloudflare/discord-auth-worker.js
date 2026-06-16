const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_ROLES = ["1489032328855556096", "1501632370082840576"];
const DEFAULT_PAGE_ACCESS = {
  servers: { mode: "any", roles: DEFAULT_ROLES },
  macros: { mode: "any", roles: DEFAULT_ROLES }
};

const FALLBACK_SERVERS = {
  generated_at: null,
  discord: {
    empty_emoji: ":mobile_phone_off:",
    default_max_players: 10
  },
  rows: [
    {
      rank: 1,
      id: "sample-na-full",
      location: "NA",
      link: "https://www.roblox.com/share?code=SERVER_SAMPLE_1&type=Server",
      players: 10,
      max_players: 10,
      updated_at: null,
      video_url: "https://example.com/pathing-video.mp4",
      players_list: []
    },
    {
      rank: 2,
      id: "sample-eu-partial",
      location: "EU",
      link: "https://www.roblox.com/share?code=SERVER_SAMPLE_2&type=Server",
      players: 4,
      max_players: 10,
      updated_at: null,
      video_url: "",
      players_list: []
    },
    {
      rank: 3,
      id: "sample-empty",
      location: "NA",
      link: "https://www.roblox.com/share?code=SERVER_SAMPLE_3&type=Server",
      players: 0,
      max_players: 10,
      updated_at: null,
      video_url: "",
      players_list: []
    }
  ]
};

const FALLBACK_MACROS = {
  generated_at: null,
  rows: [
    {
      id: "sample-macro-1",
      title: "Example Macro",
      description: "Placeholder macro entry. Replace this from your private macro data source.",
      link: "https://example.com/macro-download",
      video_url: "https://example.com/macro-demo.mp4",
      updated_at: null
    }
  ]
};

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      }

      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/auth/discord/login") {
        return handleDiscordLogin(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/discord/callback") {
        return handleDiscordCallback(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/session") {
        return handleSession(request, env);
      }

      if (url.pathname === "/protected/servers") {
        return handleProtectedServers(request, env);
      }

      if (url.pathname === "/protected/macros") {
        return handleProtectedMacros(request, env);
      }

      return json({ ok: false, message: "Not found" }, 404, request, env);
    } catch (err) {
      return json({ ok: false, message: err?.message || String(err) }, 500, request, env);
    }
  }
};

async function handleDiscordLogin(request, env) {
  requireEnv(env, ["DISCORD_CLIENT_ID", "DISCORD_REDIRECT_URI", "DISCORD_GUILD_ID", "SESSION_SECRET"]);

  const url = new URL(request.url);
  const page = normalizePage(url.searchParams.get("page"));
  const returnTo = safeReturnTo(url.searchParams.get("return_to"), page, env);
  const now = nowSeconds();
  const state = await signToken({
    type: "state",
    page,
    return_to: returnTo,
    iat: now,
    exp: now + 10 * 60
  }, env.SESSION_SECRET);

  const discordUrl = new URL("https://discord.com/oauth2/authorize");
  discordUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  discordUrl.searchParams.set("redirect_uri", env.DISCORD_REDIRECT_URI);
  discordUrl.searchParams.set("response_type", "code");
  discordUrl.searchParams.set("scope", "identify guilds.members.read");
  discordUrl.searchParams.set("state", state);

  return Response.redirect(discordUrl.toString(), 302);
}

async function handleDiscordCallback(request, env) {
  requireEnv(env, [
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
    "DISCORD_GUILD_ID",
    "SESSION_SECRET"
  ]);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");

  if (!code || !stateToken) {
    return redirectWithAuthResult(defaultReturnTo("servers", env), { c0ld_auth: "denied" });
  }

  const state = await verifyToken(stateToken, env.SESSION_SECRET);
  if (!state || state.type !== "state" || state.exp < nowSeconds()) {
    return redirectWithAuthResult(defaultReturnTo("servers", env), { c0ld_auth: "denied" });
  }

  const tokenPayload = await exchangeDiscordCode(code, env);
  const accessToken = tokenPayload.access_token;
  const user = await discordGet("/users/@me", `Bearer ${accessToken}`);
  const member = await discordGet(`/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`, `Bearer ${accessToken}`);
  const roles = Array.isArray(member.roles) ? member.roles : [];
  const rule = getAccessRule(env, state.page);
  const allowed = hasRoleAccess(roles, rule);

  if (!allowed) {
    return redirectWithAuthResult(state.return_to, {
      c0ld_auth: "denied",
      c0ld_page: state.page
    });
  }

  const now = nowSeconds();
  const ttl = Number(env.SESSION_TTL_SECONDS || 12 * 60 * 60);
  const session = await signToken({
    type: "session",
    sub: user.id,
    username: user.username,
    global_name: user.global_name || "",
    avatar: user.avatar || "",
    guild_id: env.DISCORD_GUILD_ID,
    roles,
    iat: now,
    exp: now + ttl
  }, env.SESSION_SECRET);

  return redirectWithAuthResult(state.return_to, {
    c0ld_token: session,
    c0ld_page: state.page
  });
}

async function handleSession(request, env) {
  const page = normalizePage(new URL(request.url).searchParams.get("page"));
  const auth = await authorizeRequest(request, env, page);

  if (!auth.allowed) {
    return json({
      allowed: false,
      reason: auth.reason,
      message: auth.message || "Access denied"
    }, auth.status || 403, request, env);
  }

  return json({
    allowed: true,
    page,
    mode: auth.rule.mode,
    required_roles: auth.rule.roles,
    user: auth.user
  }, 200, request, env);
}

async function handleProtectedServers(request, env) {
  const auth = await authorizeRequest(request, env, "servers");
  if (!auth.allowed) return json({ ok: false, message: "Forbidden" }, auth.status || 403, request, env);

  if (request.method === "GET") {
    const data = await readJsonSource(env.SERVERS_DATA_URL, FALLBACK_SERVERS);
    return json(data, 200, request, env);
  }

  if (request.method === "POST") {
    const submission = await readServerSubmission(request);
    submission.submitted_by = auth.user.id;
    submission.submitted_by_name = auth.user.global_name || auth.user.username || auth.user.id;
    submission.submitted_at = new Date().toISOString();

    if (env.SERVER_SUBMISSION_WEBHOOK_URL) {
      await postServerSubmissionWebhook(env.SERVER_SUBMISSION_WEBHOOK_URL, submission);
    }

    return json({
      ok: true,
      message: env.SERVER_SUBMISSION_WEBHOOK_URL
        ? "Submission sent for review."
        : "Submission accepted by auth backend. Configure SERVER_SUBMISSION_WEBHOOK_URL or storage to route it for approval."
    }, 202, request, env);
  }

  return json({ ok: false, message: "Method not allowed" }, 405, request, env);
}

async function handleProtectedMacros(request, env) {
  const auth = await authorizeRequest(request, env, "macros");
  if (!auth.allowed) return json({ ok: false, message: "Forbidden" }, auth.status || 403, request, env);

  if (request.method !== "GET") {
    return json({ ok: false, message: "Method not allowed" }, 405, request, env);
  }

  const data = await readJsonSource(env.MACROS_DATA_URL, FALLBACK_MACROS);
  return json(data, 200, request, env);
}

async function authorizeRequest(request, env, page) {
  requireEnv(env, ["DISCORD_GUILD_ID", "SESSION_SECRET"]);

  const rule = getAccessRule(env, page);
  if (rule.mode === "none") {
    return {
      allowed: true,
      status: 200,
      reason: "public",
      rule,
      roles: [],
      user: {
        id: "public",
        username: "public",
        global_name: "Public",
        avatar: ""
      }
    };
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { allowed: false, status: 401, reason: "missing_token", message: "Missing Discord session." };
  }

  const session = await verifyToken(match[1], env.SESSION_SECRET);
  if (!session || session.type !== "session" || session.exp < nowSeconds()) {
    return { allowed: false, status: 401, reason: "invalid_token", message: "Discord session expired." };
  }

  let roles = Array.isArray(session.roles) ? session.roles : [];
  if (env.DISCORD_BOT_TOKEN) {
    roles = await fetchCurrentMemberRoles(env, session.sub);
  }

  const allowed = hasRoleAccess(roles, rule);

  return {
    allowed,
    status: allowed ? 200 : 403,
    reason: allowed ? "allowed" : "missing_role",
    rule,
    roles,
    user: {
      id: session.sub,
      username: session.username,
      global_name: session.global_name,
      avatar: session.avatar
    }
  };
}

async function fetchCurrentMemberRoles(env, userId) {
  const member = await discordGet(`/guilds/${env.DISCORD_GUILD_ID}/members/${userId}`, `Bot ${env.DISCORD_BOT_TOKEN}`);
  return Array.isArray(member.roles) ? member.roles : [];
}

async function exchangeDiscordCode(code, env) {
  const body = new URLSearchParams();
  body.set("client_id", env.DISCORD_CLIENT_ID);
  body.set("client_secret", env.DISCORD_CLIENT_SECRET);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", env.DISCORD_REDIRECT_URI);

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed: HTTP ${res.status}`);
  }

  return res.json();
}

async function discordGet(path, authorization) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: authorization }
  });

  if (!res.ok) {
    throw new Error(`Discord request failed: ${path} HTTP ${res.status}`);
  }

  return res.json();
}

async function readJsonSource(sourceUrl, fallback) {
  if (!sourceUrl) return fallback;

  const res = await fetch(sourceUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Protected data source failed: HTTP ${res.status}`);
  }

  return res.json();
}

async function readServerSubmission(request) {
  const form = await request.formData();
  const file = form.get("video_file");
  const hasFile = file && typeof file === "object" && Number(file.size || 0) > 0;

  return {
    location: String(form.get("location") || ""),
    server_link: String(form.get("server_link") || ""),
    pathing_video: String(form.get("pathing_video") || ""),
    video_file: hasFile ? file : null,
    video_file_name: hasFile ? String(file.name || "pathing-video.mp4") : "",
    video_file_size: hasFile ? Number(file.size || 0) : 0
  };
}

async function postServerSubmissionWebhook(webhookUrl, submission) {
  const embed = {
    title: "Server submission",
    fields: [
      { name: "Location", value: submission.location || "Unknown", inline: true },
      { name: "Server Link", value: submission.server_link || "Missing", inline: false },
      { name: "Pathing Video URL", value: submission.pathing_video || "None", inline: false },
      { name: "Submitted By", value: `${submission.submitted_by_name} (${submission.submitted_by})`, inline: false }
    ],
    timestamp: submission.submitted_at
  };

  if (submission.video_file) {
    const data = new FormData();
    data.append("payload_json", JSON.stringify({ embeds: [embed] }));
    data.append("files[0]", submission.video_file, submission.video_file_name || "pathing-video.mp4");
    await fetch(webhookUrl, { method: "POST", body: data });
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
}

function getAccessRule(env, page) {
  const config = getPageAccess(env);
  const rule = config[page] || { mode: "none", roles: [] };
  const mode = String(rule.mode || "none").toLowerCase();
  const roles = Array.isArray(rule.roles) ? rule.roles.map(String) : [];
  return { mode, roles };
}

function getPageAccess(env) {
  if (!env.PAGE_ACCESS_JSON) return DEFAULT_PAGE_ACCESS;

  try {
    return JSON.parse(env.PAGE_ACCESS_JSON);
  } catch {
    return DEFAULT_PAGE_ACCESS;
  }
}

function hasRoleAccess(userRoles, rule) {
  if (rule.mode === "none") return true;
  if (!rule.roles.length) return false;

  const userSet = new Set((userRoles || []).map(String));

  if (rule.mode === "all") {
    return rule.roles.every(role => userSet.has(role));
  }

  return rule.roles.some(role => userSet.has(role));
}

function normalizePage(value) {
  const page = String(value || "servers").toLowerCase();
  return page === "macros" ? "macros" : "servers";
}

function defaultReturnTo(page, env) {
  const base = String(env.SITE_BASE_URL || "https://oapl.github.io/c0ld").replace(/\/$/, "");
  return `${base}/${page === "macros" ? "macros.html" : "servers.html"}`;
}

function safeReturnTo(value, page, env) {
  const fallback = defaultReturnTo(page, env);
  if (!value) return fallback;

  try {
    const target = new URL(value);
    const allowedOrigins = siteOrigins(env);
    if (allowedOrigins.has(target.origin)) return target.toString();
  } catch {
    return fallback;
  }

  return fallback;
}

function siteOrigins(env) {
  const values = [
    env.SITE_BASE_URL || "https://oapl.github.io/c0ld",
    ...(String(env.SITE_ORIGINS || "").split(","))
  ].filter(Boolean);
  return new Set(values.map(value => new URL(value.trim()).origin));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = siteOrigins(env);
  const allowOrigin = allowedOrigins.has(origin) ? origin : [...allowedOrigins][0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env)
    }
  });
}

function redirectWithAuthResult(returnTo, fragmentValues) {
  const url = new URL(returnTo);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));

  for (const [key, value] of Object.entries(fragmentValues)) {
    fragment.set(key, value);
  }

  url.hash = fragment.toString();
  return Response.redirect(url.toString(), 302);
}

function requireEnv(env, keys) {
  const missing = keys.filter(key => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required Worker env var(s): ${missing.join(", ")}`);
  }
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function signToken(payload, secret) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmac(body, secret);
  return `${body}.${signature}`;
}

async function verifyToken(token, secret) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;

  const expected = await hmac(body, secret);
  if (signature !== expected) return null;

  try {
    return JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(sig));
}

function base64UrlEncode(value) {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
