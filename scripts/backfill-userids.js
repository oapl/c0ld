const usernames = [
  "Cinnamowopal",
  "EyeRockett",
  "PossiblyLlama",
  "Bol1is"
];

async function main() {
  console.log("Testing Roblox username lookup...");

  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "NONG-Leaderboard-Test"
    },
    body: JSON.stringify({
      usernames,
      excludeBannedUsers: false
    })
  });

  console.log("HTTP status:", res.status, res.statusText);

  const text = await res.text();
  console.log("Raw response:");
  console.log(text);

  if (!res.ok) {
    process.exit(1);
  }

  const json = JSON.parse(text);

  console.log("");
  console.log("Parsed data:");
  for (const user of json.data || []) {
    console.log(JSON.stringify(user, null, 2));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
