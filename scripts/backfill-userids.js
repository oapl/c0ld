// backfill-userids.js
// One-time script to backfill user_id values in historical Supabase archive rows.
// Requires:
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

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function resolveUsernames(usernames) {
  const url = "https://users.roblox.com/v1/usernames/users";
  const result = new Map();

  for (let i = 0; i < usernames.length; i += 100) {
    const batch = usernames.slice(i, i + 100);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NONG-Leaderboard-Backfill"
      },
      body: JSON.stringify({
        usernames: batch,
        excludeBannedUsers: false
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Roblox username lookup failed (${res.status}): ${text}`);
    }

    const json = await res.json();

    for (const user of json.data || []) {
      result.set(user.requestedUsername.toLowerCase(), {
        requestedUsername: user.requestedUsername,
        id: user.id,
        name: user.name,
        displayName: user.displayName || null
      });
    }
  }

  return result;
}

async function updateArchiveUsername(tableName, username, userId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
  url.searchParams.set("username", `eq.${username}`);
  url.searchParams.set("user_id", "is.null");

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      user_id: userId
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update failed for ${tableName}/${username} (${res.status}): ${text}`);
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.");
  }

  console.log(`Resolving ${USERNAMES.length} Roblox usernames...`);
  const resolved = await resolveUsernames(USERNAMES);

  const unresolved = [];

  for (const username of USERNAMES) {
    const user = resolved.get(username.toLowerCase());

    if (!user) {
      unresolved.push(username);
      console.warn(`Could not resolve username: ${username}`);
      continue;
    }

    console.log(`${username} -> ${user.id} (${user.name})`);

    await updateArchiveUsername("Spring2026Archive", username, user.id);
    await updateArchiveUsername("StarryBattleArchive", username, user.id);
  }

  console.log("");
  console.log("Backfill complete.");

  if (unresolved.length) {
    console.log("");
    console.log("Unresolved usernames:");
    for (const name of unresolved) {
      console.log(`- ${name}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
