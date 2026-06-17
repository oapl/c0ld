const fs = require("fs");
const path = require("path");

const siteDir = process.argv[2] || "_site";
const dataPath = path.join(siteDir, "Data", "clans-current.json");
const templatePath = path.join(siteDir, "clan-profile.html");
const outputRoot = path.join(siteDir, "clans");
const liveClansUrl = process.env.CLANS_CURRENT_URL || "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";

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

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readLocalData() {
  if (!fs.existsSync(dataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (err) {
    console.warn(`Could not read local clans-current data: ${err.message}`);
    return null;
  }
}

async function readLiveData() {
  try {
    const url = `${liveClansUrl}${liveClansUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const rows = Array.isArray(data.rows) ? data.rows : [];
    console.log(`Loaded ${rows.length} clan rows from live API.`);
    return data;
  } catch (err) {
    console.warn(`Could not load live clans-current data: ${err.message}`);
    return null;
  }
}

function mergeRows(primaryRows, fallbackRows) {
  const rows = [];
  const seen = new Set();

  for (const row of [...primaryRows, ...fallbackRows]) {
    const clanName = String(row?.clan_name || row?.clan || row?.name || row?.tag || "").trim();
    if (!clanName) continue;

    const key = `${normalize(clanName)}:${String(row.icon_id || row.icon_url || "").trim()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    rows.push({
      ...row,
      clan_name: clanName
    });
  }

  rows.sort((a, b) => {
    const ar = Number(a.rank);
    const br = Number(b.rank);
    if (Number.isFinite(ar) && Number.isFinite(br) && ar !== br) return ar - br;
    return Number(b.points || b.total_points || 0) - Number(a.points || a.total_points || 0);
  });

  return rows;
}

async function main() {
  if (!fs.existsSync(templatePath)) {
    console.log(`No clan-profile template found at ${templatePath}; skipping clan page generation.`);
    return;
  }

  const localData = readLocalData();
  const liveData = await readLiveData();
  const primaryData = liveData || localData || {};
  const primaryRows = Array.isArray(primaryData.rows) ? primaryData.rows : [];
  const fallbackRows = Array.isArray(localData?.rows) ? localData.rows : [];
  const rows = mergeRows(primaryRows, fallbackRows);
  const template = fs.readFileSync(templatePath, "utf8");
  const usedSlugs = new Set();
  const manifest = [];
  let count = 0;

  if (!rows.length) {
    console.log("No clan rows available; skipping clan page generation.");
    return;
  }

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

    if (!html.includes("assets/profile-stat-cleanup.js")) {
      html = html.replace("</body>", "  <script src=\"assets/profile-stat-cleanup.js\"></script>\n</body>");
    }

    const dir = path.join(outputRoot, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");

    manifest.push({
      clan_name: clanName,
      rank: row.rank,
      slug,
      path: `clans/${slug}/`
    });

    count += 1;
  }

  const dataDir = path.join(siteDir, "Data");
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "clan-pages.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), rows: manifest }, null, 2) + "\n",
    "utf8"
  );

  if (liveData?.rows?.length && liveData.rows.length > fallbackRows.length) {
    fs.writeFileSync(
      dataPath,
      JSON.stringify({ ...liveData, rows }, null, 2) + "\n",
      "utf8"
    );
    console.log(`Updated ${dataPath} from live API with ${rows.length} merged rows.`);
  }

  console.log(`Generated ${count} individual clan profile pages in ${outputRoot}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
