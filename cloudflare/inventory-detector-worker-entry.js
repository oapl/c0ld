import inventoryWorker from "./inventory-detector-worker.js";

const RETRY_PATH = "/api/inventory/retry";
const STATUS_PATH = "/api/inventory/oauth/status";
const CALLBACK_PATH = "/api/inventory/oauth/callback";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname === RETRY_PATH) {
      return corsJson(request, env, { ok: true }, 204);
    }

    if (request.method === "POST" && url.pathname === RETRY_PATH) {
      try {
        return await handleRetry(request, env, ctx);
      } catch (error) {
        return corsJson(request, env, {
          ok: false,
          message: error?.message || String(error)
        }, error?.status || 500);
      }
    }

    const response = await inventoryWorker.fetch(request, env, ctx);

    if (request.method === "GET" && url.pathname === CALLBACK_PATH) {
      return rewriteOAuthCallback(response);
    }

    if (request.method === "GET" && url.pathname === STATUS_PATH) {
      return enhanceOAuthStatus(request, env, ctx, response);
    }

    return response;
  },

  scheduled(event, env, ctx) {
    return inventoryWorker.scheduled(event, env, ctx);
  }
};

async function enhanceOAuthStatus(request, env, ctx, response) {
  const payload = await parseJsonResponse(response);
  if (!response.ok || !payload || payload.ok === false) return response;

  const userId = String(payload.user_id || new URL(request.url).searchParams.get("user_id") || "").trim();
  if (!payload.connected || !/^\d+$/.test(userId)) {
    return corsJson(request, env, {
      ...payload,
      snapshot_ready: false,
      snapshot_state: payload.connected ? "unknown" : "disconnected",
      hourly_ready: false,
      hourly_rows: 0
    }, response.status, response.headers);
  }

  const state = await inspectInventoryState(env, ctx, userId);
  return corsJson(request, env, {
    ...payload,
    ...state,
    connection_state: state.snapshot_ready ? "ready" : "pending_snapshot"
  }, response.status, response.headers);
}

async function handleRetry(request, env, ctx) {
  requireAllowedOrigin(request, env);

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || "").trim();
  if (!/^\d+$/.test(userId)) throw httpError(400, "A numeric Roblox user_id is required.");

  const statusResponse = await callCore(env, ctx, `/api/inventory/oauth/status?user_id=${encodeURIComponent(userId)}`);
  const status = await parseJsonResponse(statusResponse);
  if (!statusResponse.ok || !status || status.ok === false) {
    throw httpError(statusResponse.status || 502, status?.message || "Inventory access status could not be checked.");
  }
  if (!status.connected) throw httpError(409, "Inventory authorization is not connected for this Roblox account.");

  const before = await inspectInventoryState(env, ctx, userId);
  if (before.snapshot_ready) {
    return corsJson(request, env, {
      ok: true,
      skipped: true,
      reason: "snapshot_already_exists",
      user_id: userId,
      ...before
    });
  }

  const ingestUrl = new URL("https://inventory-detector.internal/api/inventory/ingest");
  ingestUrl.searchParams.set("user_id", userId);
  ingestUrl.searchParams.set("username", userId);
  const headers = new Headers({ accept: "application/json" });
  const adminToken = String(env.INGEST_ADMIN_TOKEN || "").trim();
  if (adminToken) headers.set("authorization", `Bearer ${adminToken}`);

  const ingestResponse = await inventoryWorker.fetch(new Request(ingestUrl.toString(), {
    method: "POST",
    headers
  }), env, ctx);
  const ingest = await parseJsonResponse(ingestResponse);
  if (!ingestResponse.ok || !ingest || ingest.ok === false) {
    throw httpError(ingestResponse.status || 502, ingest?.message || "The inventory retry failed.");
  }

  const after = await inspectInventoryState(env, ctx, userId);
  if (!after.snapshot_ready) {
    throw httpError(502, "The inventory pull completed, but no readable snapshot was created.");
  }

  return corsJson(request, env, {
    ok: true,
    retried: true,
    user_id: userId,
    ingest,
    ...after
  });
}

async function inspectInventoryState(env, ctx, userId) {
  const latestResponse = await callCore(env, ctx,
    `/api/inventory/latest?user_id=${encodeURIComponent(userId)}&include_items=0&v=${Date.now()}`);
  const latest = await parseJsonResponse(latestResponse);

  if (latestResponse.status === 404) {
    return {
      snapshot_ready: false,
      snapshot_state: "missing",
      snapshot_at: null,
      snapshot_source: null,
      hourly_ready: false,
      hourly_rows: 0
    };
  }

  if (!latestResponse.ok || !latest || latest.ok === false) {
    return {
      snapshot_ready: false,
      snapshot_state: "unknown",
      snapshot_at: null,
      snapshot_source: null,
      hourly_ready: false,
      hourly_rows: 0,
      snapshot_error: latest?.message || `Snapshot check failed (${latestResponse.status}).`
    };
  }

  const hourlyResponse = await callCore(env, ctx,
    `/api/inventory/hourly?user_id=${encodeURIComponent(userId)}&hours=24&synchronized=1&v=${Date.now()}`);
  const hourly = await parseJsonResponse(hourlyResponse);
  const rows = hourlyResponse.ok && hourly?.ok !== false && Array.isArray(hourly?.rows) ? hourly.rows.length : 0;

  return {
    snapshot_ready: true,
    snapshot_state: "ready",
    snapshot_at: latest.snapshot?.captured_at || null,
    snapshot_source: latest.snapshot?.source || null,
    hourly_ready: rows > 0,
    hourly_rows: rows,
    hourly_error: !hourlyResponse.ok && hourlyResponse.status !== 404
      ? hourly?.message || `Hourly history check failed (${hourlyResponse.status}).`
      : null
  };
}

async function callCore(env, ctx, path) {
  return inventoryWorker.fetch(new Request(`https://inventory-detector.internal${path}`, {
    headers: { accept: "application/json" }
  }), env, ctx);
}

function rewriteOAuthCallback(response) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("location");
  if (!location) return response;

  let target;
  try { target = new URL(location); } catch { return response; }
  if (target.searchParams.get("inventory_oauth") !== "connected") return response;

  const message = String(target.searchParams.get("inventory_message") || "");
  const snapshotReady = target.searchParams.get("pulled") === "1" || !!target.searchParams.get("snapshot_at");
  const pending = !snapshotReady && /first pull failed|snapshot could not be saved|use pull now|could not be read/i.test(message);

  target.searchParams.set("snapshot_ready", snapshotReady ? "1" : "0");
  target.searchParams.set("snapshot_state", snapshotReady ? "ready" : pending ? "pending" : "unknown");
  if (pending) target.searchParams.set("inventory_oauth", "connected_pending");

  const headers = new Headers(response.headers);
  headers.set("location", target.toString());
  headers.set("cache-control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function parseJsonResponse(response) {
  try { return await response.clone().json(); } catch { return null; }
}

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

function corsJson(request, env, value, status = 200, sourceHeaders = null) {
  const headers = new Headers(sourceHeaders || undefined);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("vary", "Origin");

  const origin = String(request.headers.get("origin") || "").trim();
  const allowed = String(env.ALLOWED_ORIGIN || "https://c0ld-clan.com")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (origin && (allowed.includes("*") || allowed.includes(origin))) {
    headers.set("access-control-allow-origin", allowed.includes("*") ? "*" : origin);
    headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
    headers.set("access-control-allow-headers", "content-type,authorization");
  }

  return new Response(status === 204 ? null : JSON.stringify(value, null, 2), { status, headers });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
