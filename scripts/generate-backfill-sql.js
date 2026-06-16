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

async function main() {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "c0ld-Leaderboard-SQL-Generator"
    },
    body: JSON.stringify({
      usernames: USERNAMES,
      excludeBannedUsers: false
    })
  });

  console.log("Status:", res.status, res.statusText);

  const text = await res.text();

  if (!res.ok) {
    console.log(text);
    process.exit(1);
  }

  const json = JSON.parse(text);
  const resolved = json.data || [];

  const resolvedNames = new Set(
    resolved.map(u => String(u.requestedUsername || u.name || "").toLowerCase())
  );

  const unresolved = USERNAMES.filter(name => !resolvedNames.has(name.toLowerCase()));

  console.log("");
  console.log("-- Copy everything from here into Supabase SQL Editor:");
  console.log("");

  console.log('update "Spring2026Archive" a');
  console.log("set user_id = v.user_id");
  console.log("from (");
  console.log("  values");

  const values = resolved.map((u, index) => {
    const requested = String(u.requestedUsername || u.name).replace(/'/g, "''");
    const comma = index === resolved.length - 1 ? "" : ",";
    return `    ('${requested}', ${u.id}::bigint)${comma}`;
  });

  console.log(values.join("\n"));

  console.log(") as v(username, user_id)");
  console.log("where a.user_id is null");
  console.log("  and lower(trim(a.username)) = lower(trim(v.username));");

  console.log("");
  console.log("-- Resolved:");
  for (const u of resolved) {
    console.log(`-- ${u.requestedUsername || u.name} = ${u.id} (${u.name})`);
  }

  if (unresolved.length) {
    console.log("");
    console.log("-- Unresolved:");
    for (const name of unresolved) {
      console.log(`-- ${name}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
