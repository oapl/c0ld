// backfill-userids.js
// One-time historical user_id backfill for Spring2026Archive / StarryBattleArchive.
// Tries multiple Roblox username resolution methods before giving up.
//
// Required env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const USERNAMES = [
  "FORTINITEEEORLABUBAG",
  "EyeRockett",
  "PossiblyLlama",
  "ThisMiyo",
  "Bol1is",
  "Cinnamowopal",
  "mybanana366",
  "viancia51911",
  "Darwinaknox2",
  "TheMostMiyo",
  "Warmogs",
  "EpicRider6729",
  "McPay2WinFace",
  "MemeePlays",
  "corrosion_alt2",
  "xDonkyKxng",
  "therealyojisopi1",
  "olikim",
  "Ronin_1150",
  "Ewan_314",
  "WhichMiyo",
  "TheOtherMiyo",
  "SloLol4",
  "SainttCoco",
  "donnylolz",
  "Darwinaknox3"
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let lastText = "";

  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(url, options);
    const text = await res.text();

    if (res.ok) {
      return { res, text };
    }

    lastText = text;

    if (res.status === 429 || res.status >= 500) {
      const waitMs = 1000 * i * i;
      console.warn(`Retryable HTTP ${res.status}. Waiting ${waitMs}ms. URL: ${url}`);
      await sleep(waitMs);
      continue;
    }

    return { res, text };
  }

  throw new Error(`Failed after ${attempts} attempts. Last response: ${lastText}`);
}

async function resolveBulkUsernames(usernames) {
  const out = new Map();
  const url = "https://users.roblox.com/v1/usernames/users";

  for (let i = 0; i < usernames.length; i += 100) {
    const batch = usernames.slice(i, i + 100);

    const { res, text } = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "NONG-Leaderboard-Backfill"
      },
      body: JSON.stringify({
        usernames: batch,
        excludeBannedUsers: false
      })
    });

    if (!res.ok) {
      console.warn(`Bulk lookup failed (${res.status}): ${text}`);
      continue;
    }

    const json = JSON.parse(text);

    for (const user of json.data || []) {
      const key = String(user.requestedUsername || user.name || "").toLowerCase();
      if (!key) continue;

      out.set(key, {
        id: Number(user.id),
        username: user.name || user.requestedUsername,
        displayName: user.displayName || null,
        method: "bulk"
      });
    }

    await sleep(500);
  }

  return out;
}

async function resolveByProfileRedirect(username) {
  const url = `https://www.roblox.com/users/profile?username=${encodeURIComponent(username)}`;

  try {
    const { res } = await fetchWithRetry(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "NONG-Leaderboard-Backfill"
      }
    });

    if (!res.ok) return null;

    const finalUrl = res.url || "";
    const match = finalUrl.match(/\/users\/(\d+)\//i);

    if (!match) return null;

    return {
      id: Number(match[1]),
      username,
      displayName: null,
      method: "profile_redirect"
    };
  } catch (err) {
    console.warn(`Profile redirect lookup failed for ${username}: ${err.message}`);
    return null;
  }
}

async function resolveByLegacyApi(username) {
  const url = `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`;

  try {
    const { res, text } = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "NONG-Leaderboard-Backfill"
      }
    });

    if (!res.ok) return null;

    const json = JSON.parse(text);
    const id = Number(json.Id || json.id);

    if (!id) return null;

    return {
      id,
      username: json.Username || json.username || username,
      displayName: null,
      method: "legacy"
    };
  } catch (err) {
    console.warn(`Legacy lookup failed for ${username}: ${err.message}`);
    return null;
  }
}

async function resolveAll(usernames) {
  const resolved = await resolveBulkUsernames(usernames);

  for (const username of usernames) {
    const key = username.toLowerCase();

    if (resolved.has(key)) {
      continue;
    }

    console.log(`Bulk did not resolve ${username}. Trying profile redirect...`);
    let found = await resolveByProfileRedirect(username);

    if (!found) {
      console.log(`Profile redirect did not resolve ${username}. Trying legacy API...`);
      found = await resolveByLegacyApi(username);
    }

    if (found && found.id) {
      resolved.set(key, found);
      console.log(`${username} -> ${found.id} via ${found.method}`);
    } else {
      console.warn(`UNRESOLVED: ${username}`);
    }

    await sleep(750);
  }

  return resolved;
}

async function updateArchiveUsername(tableName, username, userId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);

  url.searchParams.set("username", `eq.${username}`);
  url.searchParams.set("user_id", "is.null");

  const { res, text } = await fetchWithRetry(url.toString(), {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: userId
    })
  });

  if (!res.ok) {
    throw new Error(`Supabase update failed for ${tableName}/${username} (${res.status}): ${text}`);
  }

  const rows = JSON.parse(text || "[]");
  console.log(`Updated ${rows.length} rows in ${tableName} for ${username}.`);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  console.log(`Resolving ${USERNAMES.length} usernames...`);
  const resolved = await resolveAll(USERNAMES);

  const unresolved = [];

  for (const username of USERNAMES) {
    const user = resolved.get(username.toLowerCase());

    if (!user || !user.id) {
      unresolved.push(username);
      continue;
    }

    console.log(`Applying ${username} -> ${user.id} (${user.method})`);

    await updateArchiveUsername("Spring2026Archive", username, user.id);
    await updateArchiveUsername("StarryBattleArchive", username, user.id);
  }

  console.log("");
  console.log("Done.");

  if (unresolved.length) {
    console.log("");
    console.log("Still unresolved:");
    for (const name of unresolved) {
      console.log(`- ${name}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
