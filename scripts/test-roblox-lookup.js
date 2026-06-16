const usernames = [
  "Cinnamowopal",
  "EyeRockett",
  "Bol1is",
  "PossiblyLlama"
];

async function main() {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "c0ld-Leaderboard-Test"
    },
    body: JSON.stringify({
      usernames,
      excludeBannedUsers: false
    })
  });

  console.log("Status:", res.status, res.statusText);

  const text = await res.text();
  console.log("Raw response:");
  console.log(text);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
