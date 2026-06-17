const CACHE_TABLE = "c0ld_live_clan_lookups";
const ROBLOX_BATCH_SIZE = 100;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      const clanName = String(url.searchParams.get("clan") || env.DEFAULT_CLAN_NAME || "c0ld").trim();

      if (!clanName) {
        return withCors(json({ ok: false, error: "Missing clan name." }, 400), request, env);
      }

      let payload;
      try {
        payload = await buildLiveClanPayload(clanName);
        await storeLookup(env, clanName, payload);
      } catch (err) {
        const cached = await readCachedLookup(env, clanName);
        if (!cached) throw err;
        payload = { ...cached, cached: true, cache_error: err?.message || String(err) };
      }

      return withCors(cacheJson({ ok: true, ...payload }, env), request, env);
    } catch (err) {
      return withCors(json({ ok: false, error: err?.message || String(err) }, err?.status || 500), request, env);
    }
  }
};

async function buildLiveClanPayload(clanName) {
  const [activeBattleResp, clanResp] = await Promise.all([
    fetchJson("https://ps99.biggamesapi.io/api/activeClanBattle"),
    fetchJson(`https://ps99.biggamesapi.io/api/clan/${encodeURIComponent(clanName)}`)
  ]);

  const activeBattle = activeBattleResp?.data || {};
  const clan = clanResp?.data || null;
  if (!clan) throw new Error(`Clan "${clanName}" was not found.`);

  const battle = getSpecificBattleData(clan, activeBattle);
  const rank = await findClanRank(clan.Name || clanName);
  const membersRaw = collectClanMembersWithOwner(clan);
  const userIds = collectClanUserIds(clan);
  const [users, avatars] = await Promise.all([
    fetchRobloxUsersByIds(userIds),
    fetchRobloxAvatars(userIds)
  ]);

  const members = membersRaw.map(member => {
    const userId = Number(member?.UserID || 0);
    const userKey = String(userId || "");
    const user = users.get(userKey) || { username: userKey, displayName: userKey };
    const points = Number(battle.pointMap[userKey] || 0);
    const joinDate = member?.JoinTime ? new Date(Number(member.JoinTime) * 1000) : null;

    return {
      rank: 0,
      username: user.username || userKey,
      displayName: user.displayName || user.username || userKey,
      userId,
      role: mapClanRole(member?.PermissionLevel, Number(clan?.Owner || 0), userId),
      points,
      joinDate: joinDate && !Number.isNaN(joinDate.getTime()) ? joinDate.toISOString() : null,
      avatarUrl: avatars.get(userKey) || ""
    };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return String(a.username || "").localeCompare(String(b.username || ""));
  }).map((row, index) => ({ ...row, rank: index + 1 }));

  const totalPoints = members.reduce((sum, row) => sum + Number(row.points || 0), 0);
  const pulledAt = new Date().toISOString();

  return {
    clan: {
      name: clan.Name || clanName,
      desc: clan.Desc || clan.Description || "",
      icon: String(clan.Icon || ""),
      icon_url: buildClanIconUrl(clan.Icon),
      owner: numberOrNull(clan.Owner),
      guildLevel: numberOrNull(clan.GuildLevel),
      countryCode: clan.CountryCode || "",
      memberCount: members.length
    },
    activeBattle: {
      id: activeBattle?._id || null,
      configName: activeBattle?.configName || battle.battleId || "Unknown",
      category: activeBattle?.category || null
    },
    battle: {
      battleId: battle.battleId,
      totalPoints
    },
    rank,
    members,
    pulledAt
  };
}

async function storeLookup(env, clanName, payload) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

  const now = new Date().toISOString();
  const body = [{
    normalized_clan_name: normalizeKey(clanName),
    clan_name: payload?.clan?.name || clanName,
    payload,
    pulled_at: payload?.pulledAt || now,
    updated_at: now
  }];

  const url = `${trimSlash(env.SUPABASE_URL)}/rest/v1/${CACHE_TABLE}?on_conflict=normalized_clan_name`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...supabaseHeaders(env),
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Supabase live lookup cache write failed (${res.status}): ${await res.text()}`);
  }
}

async function readCachedLookup(env, clanName) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;

  const url = new URL(`${trimSlash(env.SUPABASE_URL)}/rest/v1/${CACHE_TABLE}`);
  url.searchParams.set("select", "payload");
  url.searchParams.set("normalized_clan_name", `eq.${normalizeKey(clanName)}`);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: supabaseHeaders(env) });
  if (!res.ok) return null;

  const rows = await res.json();
  return rows?.[0]?.payload || null;
}

function getBattleAliases(activeBattle) {
  const base = [activeBattle?.configName, activeBattle?._id].filter(Boolean);
  const out = new Set();

  for (const item of base) {
    const value = String(item).trim();
    if (!value) continue;
    out.add(value);
    out.add(value.replace(/\s+/g, ""));
  }

  return [...out];
}

function getSpecificBattleData(clan, activeBattle) {
  const pointMap = {};
  const aliases = getBattleAliases(activeBattle);
  let battleNode = null;

  if (clan?.Battles && typeof clan.Battles === "object") {
    for (const alias of aliases) {
      if (clan.Battles[alias]) {
        battleNode = clan.Battles[alias];
        break;
      }
    }
  }

  if (!battleNode) {
    battleNode = findBattleByAliases(clan, aliases);
  }

  const rows = collectContributionRows(clan, battleNode);
  for (const row of rows) {
    const userId = String(firstDefined(row.UserID, row.UserId, row.user_id, row.userId, row.id) || "").trim();
    if (userId) {
      pointMap[userId] = Number(firstDefined(
        row.Points,
        row.points,
        row.TotalPoints,
        row.total_points,
        row.Score,
        row.score,
        row.Value,
        row.value
      ) || 0);
    }
  }

  return {
    pointMap,
    battleId:
      battleNode?.BattleID ||
      battleNode?._id ||
      battleNode?.Title ||
      battleNode?.Name ||
      battleNode?.configName ||
      activeBattle?.configName ||
      "Unknown"
  };
}

function collectContributionRows(clan, battleNode) {
  return firstArray(
    battleNode?.PointContributions,
    battleNode?.pointContributions,
    battleNode?.Contributions,
    battleNode?.contributions,
    battleNode?.Contribution,
    battleNode?.contribution,
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

function findBattleByAliases(obj, aliases) {
  if (!obj || typeof obj !== "object") return null;

  const normalizedAliases = aliases.map(normalizeBattleName).filter(Boolean);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];

    if (value && typeof value === "object") {
      const fields = [key, value.BattleID, value._id, value.Title, value.Name, value.configName];
      if (Array.isArray(value.PointContributions) && fields.some(field => normalizedAliases.includes(normalizeBattleName(field)))) {
        return value;
      }

      const found = findBattleByAliases(value, aliases);
      if (found) return found;
    }
  }

  return null;
}

async function findClanRank(clanName) {
  const target = normalizeKey(clanName);
  const pageSize = 100;
  const maxPages = 50;

  for (let page = 1; page <= maxPages; page++) {
    const json = await fetchJson(`https://ps99.biggamesapi.io/api/clans?page=${page}&pageSize=${pageSize}&sort=Points&sortOrder=desc`);
    const data = Array.isArray(json?.data) ? json.data : [];
    if (!data.length) break;

    for (let i = 0; i < data.length; i++) {
      const clan = data[i];
      if (normalizeKey(clan?.Name) === target) {
        return {
          rank: (page - 1) * pageSize + i + 1,
          scannedPages: page,
          scannedRows: (page - 1) * pageSize + data.length,
          points: Number(clan?.Points || 0)
        };
      }
    }

    if (data.length < pageSize) break;
  }

  return { rank: null, scannedPages: maxPages, scannedRows: maxPages * pageSize, points: null };
}

function collectClanUserIds(clan) {
  const members = Array.isArray(clan?.Members) ? clan.Members : [];
  const ids = new Set();

  for (const member of members) {
    const id = Number(member?.UserID || 0);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }

  const ownerId = Number(clan?.Owner || 0);
  if (Number.isFinite(ownerId) && ownerId > 0) ids.add(ownerId);

  return [...ids];
}

function collectClanMembersWithOwner(clan) {
  const members = Array.isArray(clan?.Members) ? clan.Members.slice() : [];
  const ownerId = Number(clan?.Owner || 0);
  if (ownerId > 0 && !members.some(member => Number(member?.UserID) === ownerId)) {
    members.unshift({ UserID: ownerId, PermissionLevel: 100, JoinTime: "" });
  }
  return members;
}

async function fetchRobloxUsersByIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).map(Number).filter(id => Number.isFinite(id) && id > 0))];
  const out = new Map();

  for (let i = 0; i < uniqueIds.length; i += ROBLOX_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + ROBLOX_BATCH_SIZE);
    const res = await fetch("https://users.roblox.com/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ userIds: batch, excludeBannedUsers: false })
    });

    if (!res.ok) continue;

    const json = await res.json();
    for (const item of Array.isArray(json?.data) ? json.data : []) {
      const id = Number(item?.id);
      if (!Number.isFinite(id)) continue;
      out.set(String(id), {
        username: item?.name || item?.username || String(id),
        displayName: item?.displayName || item?.name || String(id)
      });
    }
  }

  return out;
}

async function fetchRobloxAvatars(userIds) {
  const uniqueIds = [...new Set((userIds || []).map(Number).filter(id => Number.isFinite(id) && id > 0))];
  const out = new Map();

  for (let i = 0; i < uniqueIds.length; i += ROBLOX_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + ROBLOX_BATCH_SIZE);
    const url = "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
      `?userIds=${encodeURIComponent(batch.join(","))}` +
      "&size=150x150&format=Png&isCircular=false";
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) continue;

    const json = await res.json();
    for (const item of Array.isArray(json?.data) ? json.data : []) {
      const id = Number(item?.targetId);
      if (Number.isFinite(id) && item?.imageUrl && item?.state === "Completed") {
        out.set(String(id), String(item.imageUrl));
      }
    }
  }

  return out;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}: ${await res.text().catch(() => "")}`);
  return res.json();
}

function mapClanRole(permissionLevel, ownerId, userId) {
  if (Number(userId) === Number(ownerId)) return "Leader";
  const level = Number(permissionLevel);
  if (level === 100) return "Leader";
  if (level === 90) return "Officer";
  if (level === 50) return "Member";
  if (Number.isFinite(level) && level > 0) return `Unknown (${level})`;
  return "";
}

function buildClanIconUrl(iconValue) {
  const iconId = String(iconValue || "")
    .trim()
    .replace(/^rbxassetid:\/\//i, "")
    .replace(/^rbxasset:\/\//i, "")
    .trim();
  return iconId ? `https://ps99.biggamesapi.io/image/${encodeURIComponent(iconId)}` : null;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeBattleName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function supabaseHeaders(env) {
  return {
    "apikey": env.SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Accept": "application/json"
  };
}

function cacheJson(obj, env) {
  return json(obj, 200, {
    "Cache-Control": `public, max-age=${Number(env.PUBLIC_CACHE_SECONDS || 20)}`
  });
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.has(origin) ? origin : [...allowed][0] || "*";

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function allowedOrigins(env) {
  const origins = new Set(["https://oapl.github.io"]);
  for (const item of String(env.SITE_ORIGINS || "").split(",")) {
    const origin = item.trim().replace(/\/$/, "");
    if (origin) origins.add(origin);
  }
  return origins;
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
