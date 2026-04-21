# NONG_ Clan Leaderboard

A live, browser-hosted leaderboard dashboard for the **NONG_** Pet Simulator 99 clan.  
Data is pulled directly from Google Sheets via the public gviz API — no server required.

---

## 🚀 Live Site

Once GitHub Pages is enabled the dashboard is available at:  
**`https://OpalApocalypse.github.io/NONG-_Leaderboard/`**

---

## ⚙️ Configuration

Open `index.html` and edit the `CONFIG` block near the top of the `<script>` section:

```js
const CONFIG = {
  // ID of your front-facing Google Sheet (from the URL)
  SHEET_ID: "1JIhSVcbfgEFlz7L20qkQ1QiY95Y0ZZsl8DJmbuB7GJw",

  // Historical battle tabs — add one entry per Clan Battle tab in your sheet.
  // Find a tab's gid in the browser URL after clicking it: ?gid=XXXXXXXXX
  TABS: [
    { label: "Current Battle", gid: 0       },
    { label: "Battle 12",      gid: 123456789 },
    { label: "Battle 11",      gid: 987654321 },
  ],

  // Optional: URL of a published Apps Script web app.
  // If set this overrides the gviz approach. Leave "" to use gviz.
  APPSCRIPT_URL: "",

  CLAN_NAME:     "NONG_",
  CLAN_SUBTITLE: "Pet Simulator 99 · Clan Leaderboard",
};
```

### Making the sheet public

For the gviz API to work the Google Sheet must be shared publicly:

1. Open the sheet → **Share** → **Anyone with the link** → **Viewer**
2. Click **Done**

That's it — no API key needed.

### Using an Apps Script web app (optional)

If you prefer to serve data from an Apps Script endpoint instead of directly
from the sheet, deploy your script as a **Web App** (Execute as: Me, Access:
Anyone) and paste the URL into `APPSCRIPT_URL`.  
Your script should return JSON in this shape:

```json
{
  "columns": ["Rank", "Member", "Diamonds"],
  "rows": [
    [1, "Alice", 1250000],
    [2, "Bob",    980000]
  ]
}
```

---

## 📋 Features

| Feature | Status |
|---------|--------|
| Sortable leaderboard table | ✅ |
| Live search / filter | ✅ |
| Summary stat cards (members, total, top, avg) | ✅ |
| Historical battle tab selector | ✅ |
| Auto-detects rank / name / diamond columns | ✅ |
| Responsive (mobile-friendly) | ✅ |
| No build step — pure HTML/JS | ✅ |
| GitHub Pages auto-deploy on push | ✅ |

---

## 🛠 Enabling GitHub Pages

1. In the repo go to **Settings → Pages**
2. Under **Source** select **GitHub Actions**
3. Push a commit to `main` — the workflow deploys automatically

The deployment URL will appear in the **Actions** tab after the first run.