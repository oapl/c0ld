const fs = require("fs");

async function main() {
  const res = await fetch("YOUR_JSON_ENDPOINT_HERE");
  const data = await res.json();

  const lines = [];
  lines.push("| Rank | Member | Points | 60m |");
  lines.push("|---|---|---:|---:|");

  for (const row of data.members.slice(0, 10)) {
    lines.push(`| ${row.rank} | ${row.name} | ${row.points.toLocaleString()} | ${row.gain60.toLocaleString()} |`);
  }

  const block = lines.join("\n");
  const readme = fs.readFileSync("README.md", "utf8");

  const updated = readme.replace(
    /<!-- START_LEADERBOARD -->[\s\S]*<!-- END_LEADERBOARD -->/,
    `<!-- START_LEADERBOARD -->\n${block}\n<!-- END_LEADERBOARD -->`
  );

  fs.writeFileSync("README.md", updated);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
