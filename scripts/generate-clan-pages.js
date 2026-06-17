const fs = require("fs");
const path = require("path");

const siteDir = process.argv[2] || "_site";
const dataPath = path.join(siteDir, "Data", "clans-current.json");
const templatePath = path.join(siteDir, "clan-profile.html");
const outputRoot = path.join(siteDir, "clans");

function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "clan";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  if (!fs.existsSync(dataPath)) {
    console.log(`No clans-current data found at ${dataPath}; skipping clan page generation.`);
    return;
  }

  if (!fs.existsSync(templatePath)) {
    console.log(`No clan-profile template found at ${templatePath}; skipping clan page generation.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const template = fs.readFileSync(templatePath, "utf8");
  const usedSlugs = new Set();
  let count = 0;

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const row of rows) {
    const clanName = String(row.clan_name || "").trim();
    if (!clanName) continue;

    let slug = slugify(clanName);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${row.rank || count + 1}`;
    }
    usedSlugs.add(slug);

    let html = template;
    html = html.replace("<head>", "<head>\n  <base href=\"../../\">");
    html = html.replace("<title>Clan Profile</title>", `<title>${escapeHtml(clanName)} - Clan Profile</title>`);
    html = html.replace(
      /function viewedClanName\(\)\s*\{[\s\S]*?\n\s*\}/,
      `function viewedClanName() {\n      return ${JSON.stringify(clanName)};\n    }`
    );

    const dir = path.join(outputRoot, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    count += 1;
  }

  const manifest = rows
    .map(row => ({
      clan_name: row.clan_name,
      rank: row.rank,
      slug: slugify(row.clan_name)
    }))
    .filter(row => row.clan_name && row.slug);

  fs.writeFileSync(
    path.join(siteDir, "Data", "clan-pages.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), rows: manifest }, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated ${count} individual clan profile pages in ${outputRoot}.`);
}

main();
