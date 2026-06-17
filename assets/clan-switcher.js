(() => {
  const CLANS = {
    c0ld: {
      key: "c0ld",
      label: "c0ld",
      mascot: "assets/c0ld-kitsune-logo.gif",
      switchHome: "index.html?clan=WMSY"
    },
    wmsy: {
      key: "wmsy",
      label: "WMSY",
      mascot: "assets/mascots/wmsy-frog.png",
      switchHome: "index.html"
    }
  };

  const MEMBER_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/current";
  const MEMBER_API_HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/history";
  const CLANS_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";

  const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" rx="16" fill="#21262d"/>
        <circle cx="75" cy="58" r="26" fill="#6e7681"/>
        <path d="M36 123c8-20 24-32 39-32s31 12 39 32" fill="#6e7681"/>
      </svg>
    `);

  let wmsyRows = [];
  let wmsyData = null;
  let wmsySortKey = "rank";
  let wmsySortAsc = true;
  let wmsySearch = "";
  let wmsyLoading = false;
  let wmsyRendering = false;
  let clansCurrentPromise = null;
  let profileChartPromise = null;
  let profileChartDataKey = "";
  let applyTimer = null;
  let resizeWired = false;

  const profileChartState = {
    points: true,
    rank: false
  };

  function normalizeClanKey(value) {
    return String(value || "c0ld").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function currentClan() {
    const params = new URLSearchParams(window.location.search);
    return normalizeClanKey(params.get("clan")) === "wmsy" ? CLANS.wmsy : CLANS.c0ld;
  }

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isWmsy() {
    return currentClan().key === "wmsy";
  }

  function isIndexPage() {
    const page = currentPage();
    return page === "" || page === "index.html";
  }

  function isClansPage() {
    return currentPage() === "clans.html";
  }

  function isClanLookupPage() {
    return currentPage() === "live-clan.html";
  }

  function isProfilePage() {
    return currentPage() === "profile.html";
  }

  function splitUrl(url) {
    const raw = String(url || "").trim();
    const [pathAndQuery, hash = ""] = raw.split("#");
    const [path = "", query = ""] = pathAndQuery.split("?");
    return { path, query, hash: hash ? `#${hash}` : "" };
  }

  function isLocalHtmlLink(href) {
    if (!href) return false;
    const value = String(href).trim();
    if (!value || value.startsWith("#")) return false;
    if (/^(https?:|mailto:|tel:)/i.test(value)) return false;
    return /(^|\/)[^/?#]+\.html(?:[?#].*)?$/.test(value) || value === "index.html" || value.startsWith("index.html?");
  }

  function withClanParam(href, clan) {
    if (!isLocalHtmlLink(href)) return href;

    const parts = splitUrl(href);
    let page = parts.path.split("/").pop() || "index.html";

    if (page === "wmsy.html") page = "index.html";

    const params = new URLSearchParams(parts.query);

    if (clan.key === "wmsy") {
      params.set("clan", clan.label);
    } else {
      params.delete("clan");
    }

    const query = params.toString();
    return `${page}${query ? `?${query}` : ""}${parts.hash}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function fmtNum(value) {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "—";
    return Number(value).toLocaleString("en-US");
  }

  function fmtShortNum(value) {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "—";

    const num = Number(value);
    const tiers = [
      { value: 1e12, suffix: "T" },
      { value: 1e9, suffix: "B" },
      { value: 1e6, suffix: "M" },
      { value: 1e3, suffix: "K" }
    ];

    for (const tier of tiers) {
      if (Math.abs(num) >= tier.value) {
        return (num / tier.value).toFixed(2).replace(/\.?0+$/, "") + tier.suffix;
      }
    }

    return String(num);
  }

  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function formatRank(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? `#${n}` : "—";
  }

  function profileUrl(row) {
    const id = String(row.profile_key || row.user_id || row.username || "").trim();
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("clan", "WMSY");
    return `profile.html?${params.toString()}`;
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function getClansCurrent() {
    if (!clansCurrentPromise) {
      clansCurrentPromise = fetchJson(CLANS_API_CURRENT_URL).catch(err => {
        clansCurrentPromise = null;
        throw err;
      });
    }

    return clansCurrentPromise;
  }

  function ensureStyle(id, css) {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  function removeStyle(id) {
    const style = document.getElementById(id);
    if (style) style.remove();
  }

  function applyWmsyTheme() {
    if (!isWmsy()) {
      removeStyle("wmsy-page-theme-styles");
      return;
    }

    ensureStyle("wmsy-page-theme-styles", `
      :root {
        --link: #74d99f !important;
        --accent: #74d99f !important;
      }

      a:not(.menu-btn):not(.site-logo-link),
      .player-name,
      .value,
      .rank,
      .num,
      .projected {
        text-shadow: none;
      }

      .menu-btn.active,
      .menu-bar .menu-btn.active,
      .tab-btn.active,
      button.active,
      [data-tab].active {
        border-color: rgba(72, 187, 120, 0.78) !important;
        color: #74d99f !important;
        background: rgba(72, 187, 120, 0.14) !important;
      }

      .menu-btn:hover,
      .menu-bar .menu-btn:hover,
      .tab-btn:hover,
      button:hover,
      select:hover,
      select:focus,
      input:focus,
      textarea:focus {
        border-color: rgba(72, 187, 120, 0.78) !important;
        color: #74d99f !important;
      }

      .menu-btn.active:hover,
      .menu-bar .menu-btn.active:hover,
      .tab-btn.active:hover,
      button.active:hover,
      [data-tab].active:hover {
        background: rgba(72, 187, 120, 0.22) !important;
      }

      .menu-btn:focus-visible,
      .tab-btn:focus-visible,
      button:focus-visible,
      select:focus-visible,
      input:focus-visible,
      textarea:focus-visible {
        outline: 2px solid rgba(72, 187, 120, 0.58) !important;
        outline-offset: 2px;
      }
    `);
  }

  function applyProfileRedScheme() {
    if (!isProfilePage() || isWmsy() || document.getElementById("clan-profile-red-scheme")) return;

    ensureStyle("clan-profile-red-scheme", `
      :root { --link: #ff9b96 !important; }
      .menu-btn.active {
        border-color: #ff9b96 !important;
        color: #ff9b96 !important;
        background: rgba(248, 81, 73, 0.12) !important;
      }
      .menu-btn:hover,
      select:hover,
      select:focus {
        border-color: #ff9b96 !important;
        color: #ff9b96 !important;
      }
    `);
  }

  function applyClanHighlightStyles() {
    ensureStyle("clan-row-highlight-styles", `
      .wmsy-row {
        background: rgba(72, 187, 120, 0.14) !important;
      }
      .wmsy-row:hover {
        background: rgba(72, 187, 120, 0.22) !important;
      }
      .wmsy-row td {
        border-top: 1px solid rgba(72, 187, 120, 0.48) !important;
        border-bottom: 1px solid rgba(72, 187, 120, 0.48) !important;
      }
      .wmsy-row td.rank,
      .wmsy-row td.projected,
      .wmsy-row .clan-name {
        color: #74d99f !important;
        font-weight: 700 !important;
      }

      .nong-row {
        background: rgba(251, 146, 60, 0.14) !important;
      }
      .nong-row:hover {
        background: rgba(251, 146, 60, 0.22) !important;
      }
      .nong-row td {
        border-top: 1px solid rgba(251, 146, 60, 0.50) !important;
        border-bottom: 1px solid rgba(251, 146, 60, 0.50) !important;
      }
      .nong-row td.rank,
      .nong-row td.projected,
      .nong-row .clan-name {
        color: #f6ad55 !important;
        font-weight: 700 !important;
      }
    `);
  }

  function highlightTrackedClanRows() {
    if (!isClansPage()) return;

    applyClanHighlightStyles();

    document.querySelectorAll("#clans-tbody tr").forEach(row => {
      const nameEl = row.querySelector(".clan-name");
      const clanName = normalizeText(nameEl ? nameEl.textContent : row.children[1]?.textContent || "");

      if (clanName === "wmsy") {
        row.classList.add("wmsy-row");
      }

      if (clanName === "nong") {
        row.classList.add("nong-row");
      }
    });
  }

  function sortWmsyRows(rows) {
    const list = rows.slice();
    list.sort((a, b) => {
      const av = a[wmsySortKey];
      const bv = b[wmsySortKey];
      const an = Number(av);
      const bn = Number(bv);
      const result = !Number.isNaN(an) && !Number.isNaN(bn)
        ? an - bn
        : String(av || "").localeCompare(String(bv || ""));
      return wmsySortAsc ? result : -result;
    });
    return list;
  }

  function visibleWmsyRows() {
    let rows = wmsyRows.slice();
    const q = wmsySearch.trim().toLowerCase();

    if (q) {
      rows = rows.filter(row =>
        String(row.username || "").toLowerCase().includes(q) ||
        String(row.user_id || "").includes(q)
      );
    }

    return sortWmsyRows(rows);
  }

  function renderWmsyLeaderboard() {
    if (!isWmsy() || !isIndexPage()) return;

    const tbody = document.getElementById("leaderboard-body");
    if (!tbody) return;

    const rows = visibleWmsyRows();
    wmsyRendering = true;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#8b949e;">No WMSY players found.</td></tr>`;
      window.setTimeout(() => { wmsyRendering = false; }, 0);
      return;
    }

    tbody.innerHTML = rows.map(row => {
      const avatar = escapeHtml(row.avatar_url || DEFAULT_AVATAR_SVG);
      const fallback = escapeHtml(DEFAULT_AVATAR_SVG);

      return `
        <tr>
          <td class="rank">#${escapeHtml(row.rank ?? "—")}</td>
          <td>
            <a class="player-cell" href="${escapeHtml(profileUrl(row))}">
              <img class="avatar" src="${avatar}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">
              <div><div class="player-name">${escapeHtml(row.username || "Unknown")}</div></div>
            </a>
          </td>
          <td class="num" title="${fmtNum(row.total_points)}">${fmtShortNum(row.total_points)}</td>
          <td class="num" title="${fmtNum(row.gain_5m)}">${fmtShortNum(row.gain_5m)}</td>
          <td class="num" title="${fmtNum(row.gain_1h)}">${fmtShortNum(row.gain_1h)}</td>
          <td class="num" title="${fmtNum(row.gain_12h)}">${fmtShortNum(row.gain_12h)}</td>
          <td class="num" title="${fmtNum(row.gain_24h)}">${fmtShortNum(row.gain_24h)}</td>
        </tr>
      `;
    }).join("");

    window.setTimeout(() => { wmsyRendering = false; }, 0);
  }

  async function loadWmsyLeaderboard() {
    if (!isWmsy() || !isIndexPage() || wmsyLoading) return;

    wmsyLoading = true;
    try {
      wmsyData = await fetchJson(`${MEMBER_API_CURRENT_URL}?clan=WMSY`);
      wmsyRows = Array.isArray(wmsyData?.rows) ? wmsyData.rows.slice() : [];
      renderWmsyLeaderboard();
      applyTrackedClanCards();
    } catch (err) {
      console.warn("WMSY leaderboard refresh failed", err);
    } finally {
      wmsyLoading = false;
    }
  }

  function updateRankCardLabels(clan) {
    const trackedLabel = document.getElementById("tracked-rank-label");
    if (trackedLabel) trackedLabel.textContent = `${clan.label} Current Rank`;

    document.querySelectorAll(".card .label").forEach(label => {
      const text = String(label.textContent || "").trim();
      if (/^(c0ld|WMSY)\s+Current Rank$/i.test(text)) {
        label.textContent = `${clan.label} Current Rank`;
      }
    });

    const title = document.getElementById("leaderboard-title");
    if (title) title.textContent = `${clan.label} Leaderboard`;
  }

  async function applyTrackedClanCards() {
    const clan = currentClan();
    const rankEl = document.getElementById("c0ld-rank-value") || document.getElementById("c0ld-current-rank");
    const projectionEl = document.getElementById("projected-rank-value") || document.getElementById("c0ld-projected-rank");
    const dbUpdate = document.getElementById("db-update-value") || document.getElementById("last-db-update");

    updateRankCardLabels(clan);

    if (clan.key !== "wmsy") return;

    let rank = wmsyData?.clan_rank ?? null;
    let projectedRank = wmsyData?.projected_rank ?? null;

    try {
      const data = await getClansCurrent();
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const row = rows.find(item => normalizeText(item.clan_name) === "wmsy");
      if (row) {
        rank = row.rank ?? rank;
        projectedRank = row.projected_rank ?? projectedRank ?? row.rank;
      }
      if (dbUpdate && data?.snapshot_at) dbUpdate.textContent = fmtDateTime(data.snapshot_at);
    } catch (err) {
      console.warn("Clan rank/projection refresh failed", err);
    }

    if (rankEl) rankEl.textContent = formatRank(rank);
    if (projectionEl) projectionEl.textContent = formatRank(projectedRank);
  }

  function getLookupClanName() {
    const cardText = String(document.getElementById("card-clan")?.textContent || "").trim();
    if (cardText && cardText !== "—") return cardText;

    const inputText = String(document.getElementById("clan-input")?.value || "").trim();
    return inputText && inputText !== "—" ? inputText : "";
  }

  function arrangeClanLookupCards() {
    if (!isClanLookupPage()) return;

    const membersCard = document.getElementById("card-members")?.closest(".card");
    const projectedCard = document.getElementById("card-owner")?.closest(".card");
    const levelCard = document.getElementById("card-level")?.closest(".card");
    const pulledCard = document.getElementById("card-pulled")?.closest(".card");
    const parent = membersCard?.parentElement;

    if (!parent || !membersCard || !projectedCard || !levelCard) return;

    parent.insertBefore(levelCard, membersCard.nextSibling);
    parent.insertBefore(projectedCard, levelCard.nextSibling);

    if (pulledCard) {
      parent.appendChild(pulledCard);
    }
  }

  async function applyClanLookupProjectedRank() {
    if (!isClanLookupPage()) return;

    arrangeClanLookupCards();

    const valueEl = document.getElementById("card-owner");
    if (!valueEl) return;

    const label = valueEl.closest(".card")?.querySelector(".label");
    if (label) label.textContent = "Projected Rank";

    const clanName = getLookupClanName();
    const clanKey = normalizeText(clanName);

    if (!clanKey) {
      valueEl.textContent = "—";
      return;
    }

    try {
      const data = await getClansCurrent();
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const row = rows.find(item => normalizeText(item.clan_name) === clanKey);
      const projected = row?.projected_rank ?? row?.projectedRank ?? row?.projected ?? row?.rank;

      valueEl.textContent = row ? formatRank(projected) : "200+";
    } catch (err) {
      console.warn("Clan lookup projected rank refresh failed", err);
      valueEl.textContent = "200+";
    }
  }

  function getProfileId() {
    return new URLSearchParams(window.location.search).get("id") || "";
  }

  function normalizeProfileKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "");
  }

  function findCurrentRow(current, id) {
    const raw = String(id || "").trim();
    const normalized = normalizeProfileKey(raw);

    return (current.rows || []).find(row =>
      String(row.user_id || "") === raw ||
      normalizeProfileKey(row.profile_key) === normalized ||
      normalizeProfileKey(row.username) === normalized
    ) || null;
  }

  function getRowPoints(row) {
    return row.total_points ?? row.points ?? 0;
  }

  function battleIdentity(battle) {
    return normalizeText(battle?.battle || battle?.display_name || battle?.name || battle?.battle_name || "");
  }

  function selectedBattleIdentity() {
    const select = document.getElementById("battle-select");
    const selectedText = select?.selectedOptions?.[0]?.textContent || "";
    return normalizeText(selectedText);
  }

  function summarizeLiveProfileForChart(current, history, id) {
    const currentRow = findCurrentRow(current, id);
    const userId = currentRow?.user_id || (/^\d+$/.test(String(id)) ? String(id) : null);
    const rows = Array.isArray(history?.rows) ? history.rows.slice() : [];

    if (!rows.length && currentRow) {
      rows.push({
        fetched_at: currentRow.fetched_at || current.snapshot_at || current.generated_at,
        rank: currentRow.rank,
        username: currentRow.username,
        user_id: currentRow.user_id,
        total_points: currentRow.total_points ?? currentRow.points ?? 0
      });
    }

    rows.sort((a, b) => new Date(a.fetched_at || 0) - new Date(b.fetched_at || 0));

    const battle = {
      battle: current.battle || "current",
      display_name: current.display_name || current.battle || "Current Clan Battle",
      series: rows.map(row => ({
        t: row.fetched_at,
        rank: row.rank ?? null,
        points: Number(getRowPoints(row) || 0)
      })).filter(point => point.t)
    };

    return {
      user_id: userId,
      battles: [battle]
    };
  }

  async function loadLiveProfileForChart(id, clan) {
    const current = await fetchJson(`${MEMBER_API_CURRENT_URL}?clan=${encodeURIComponent(clan.label)}`);
    const currentRow = findCurrentRow(current, id);
    const userId = currentRow?.user_id || (/^\d+$/.test(String(id)) ? String(id) : "");

    if (!userId) {
      return summarizeLiveProfileForChart(current, { rows: [] }, id);
    }

    const historyUrl =
      `${MEMBER_API_HISTORY_URL}?clan=${encodeURIComponent(clan.label)}` +
      `&user_id=${encodeURIComponent(String(userId))}` +
      `${current.battle ? `&battle=${encodeURIComponent(current.battle)}` : ""}` +
      "&hours=336&limit=50000";

    try {
      const history = await fetchJson(historyUrl);
      return summarizeLiveProfileForChart(current, history, userId);
    } catch {
      return summarizeLiveProfileForChart(current, { rows: [] }, userId || id);
    }
  }

  async function loadStaticProfileForChart(id) {
    const res = await fetch(`Data/players/${encodeURIComponent(id)}.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadProfileForChart() {
    const id = getProfileId();
    const clan = currentClan();
    const key = `${clan.key}:${id}`;

    if (!id) return null;

    if (profileChartPromise && profileChartDataKey === key) {
      return profileChartPromise;
    }

    profileChartDataKey = key;
    profileChartPromise = (async () => {
      const liveProfile = await loadLiveProfileForChart(id, clan).catch(() => null);
      const staticProfile = clan.key === "c0ld" ? await loadStaticProfileForChart(id).catch(() => null) : null;
      const battles = [];
      const seen = new Set();

      for (const battle of [...(liveProfile?.battles || []), ...(staticProfile?.battles || [])]) {
        const key = battleIdentity(battle) || `battle-${battles.length}`;
        if (!seen.has(key)) {
          seen.add(key);
          battles.push(battle);
        }
      }

      return { battles };
    })();

    return profileChartPromise;
  }

  function chartSeriesFromBattle(battle) {
    return (battle?.series || [])
      .map(item => ({
        t: new Date(item.t).getTime(),
        rawT: item.t,
        points: finiteNumber(item.points),
        rank: finiteNumber(item.rank)
      }))
      .filter(item => !Number.isNaN(item.t) && (item.points !== null || item.rank !== null));
  }

  function activeProfileBattle(profile) {
    const target = selectedBattleIdentity();
    const battles = Array.isArray(profile?.battles) ? profile.battles : [];

    if (!target) return battles[0] || null;

    return battles.find(battle => battleIdentity(battle) === target) || battles[0] || null;
  }

  function scaleY(value, min, max, top, height, mode) {
    if (max === min) return top + height / 2;
    const pct = (value - min) / (max - min);
    return mode === "rank" ? top + pct * height : top + (1 - pct) * height;
  }

  function drawSeries(ctx, points, x, y, color) {
    if (!points.length) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(x(point), y(point));
      else ctx.lineTo(x(point), y(point));
    });

    ctx.stroke();

    const last = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(last), y(last), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEnhancedProfileChart(canvas, tooltip, battle) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const series = chartSeriesFromBattle(battle);
    const showPoints = profileChartState.points;
    const showRank = profileChartState.rank;
    const pointsSeries = showPoints ? series.filter(item => item.points !== null) : [];
    const rankSeries = showRank ? series.filter(item => item.rank !== null) : [];
    const visibleSeries = [...pointsSeries, ...rankSeries];

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (visibleSeries.length < 2) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText("Not enough points to chart.", 16, 28);
      return;
    }

    const padLeft = 58;
    const padRight = 18;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;
    const minT = Math.min(...visibleSeries.map(point => point.t));
    const maxT = Math.max(...visibleSeries.map(point => point.t));
    const pointValues = pointsSeries.map(point => point.points).filter(Number.isFinite);
    const rankValues = rankSeries.map(point => point.rank).filter(Number.isFinite);
    const minPoints = pointValues.length ? Math.min(...pointValues) : 0;
    const maxPoints = pointValues.length ? Math.max(...pointValues) : 0;
    const minRank = rankValues.length ? Math.min(...rankValues) : 0;
    const maxRank = rankValues.length ? Math.max(...rankValues) : 0;

    function x(point) {
      if (maxT === minT) return padLeft;
      return padLeft + ((point.t - minT) / (maxT - minT)) * width;
    }

    function yPoints(point) {
      return scaleY(point.points, minPoints, maxPoints, padTop, height, "points");
    }

    function yRank(point) {
      return scaleY(point.rank, minRank, maxRank, padTop, height, "rank");
    }

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#8b949e";

    const gridValues = pointValues.length ? { min: minPoints, max: maxPoints, type: "points" } : { min: minRank, max: maxRank, type: "rank" };

    for (let i = 0; i <= 4; i++) {
      const pct = i / 4;
      const yy = padTop + pct * height;
      const value = gridValues.type === "rank"
        ? gridValues.min + pct * (gridValues.max - gridValues.min)
        : gridValues.max - pct * (gridValues.max - gridValues.min);

      ctx.beginPath();
      ctx.moveTo(padLeft, yy);
      ctx.lineTo(rect.width - padRight, yy);
      ctx.stroke();
      ctx.fillText(gridValues.type === "rank" ? `#${Math.round(value)}` : fmtShortNum(value), 8, yy + 4);
    }

    drawSeries(ctx, pointsSeries, x, yPoints, isWmsy() ? "#74d99f" : "#58a6ff");
    drawSeries(ctx, rankSeries, x, yRank, "#f6ad55");

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);
    ctx.fillStyle = "#8b949e";
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), padLeft, rect.height - 12);
    const lastLabel = lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const lastWidth = ctx.measureText(lastLabel).width;
    ctx.fillText(lastLabel, rect.width - padRight - lastWidth, rect.height - 12);

    canvas._profileChart = {
      series,
      x,
      yPoints,
      yRank,
      padTop,
      padBottom,
      width,
      height,
      rect,
      battle,
      showPoints,
      showRank
    };
  }

  function bindEnhancedChartHover(canvas, tooltip) {
    if (canvas.dataset.profileHoverBound === "1") return;
    canvas.dataset.profileHoverBound = "1";

    function hideTooltip() {
      if (tooltip) tooltip.style.display = "none";
    }

    function handleMove(ev) {
      const chart = canvas._profileChart;
      if (!chart || !chart.series?.length || !tooltip) return;

      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      let nearest = chart.series[0];
      let nearestDist = Math.abs(chart.x(nearest) - mx);

      for (const point of chart.series) {
        const dist = Math.abs(chart.x(point) - mx);
        if (dist < nearestDist) {
          nearest = point;
          nearestDist = dist;
        }
      }

      drawEnhancedProfileChart(canvas, tooltip, chart.battle);

      const ctx = canvas.getContext("2d");
      const px = chart.x(nearest);
      const py = chart.showPoints && nearest.points !== null ? chart.yPoints(nearest) : chart.yRank(nearest);

      ctx.save();
      ctx.strokeStyle = "rgba(116, 217, 159, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, chart.padTop);
      ctx.lineTo(px, chart.rect.height - chart.padBottom);
      ctx.stroke();
      ctx.fillStyle = "#e6edf3";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      tooltip.innerHTML = `
        <strong>${fmtDateTime(nearest.rawT)}</strong>
        <div>Points: ${nearest.points === null ? "—" : fmtNum(nearest.points)}</div>
        <div>Rank: ${nearest.rank === null ? "—" : formatRank(nearest.rank)}</div>
      `;

      tooltip.style.display = "block";

      const tooltipRect = tooltip.getBoundingClientRect();
      let left = ev.clientX - rect.left + 14;
      let top = ev.clientY - rect.top + 14;

      if (left + tooltipRect.width > rect.width) left = ev.clientX - rect.left - tooltipRect.width - 14;
      if (top + tooltipRect.height > rect.height) top = ev.clientY - rect.top - tooltipRect.height - 14;

      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", hideTooltip);
    canvas.addEventListener("touchstart", ev => ev.touches?.[0] && handleMove(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchmove", ev => ev.touches?.[0] && handleMove(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchend", hideTooltip);
  }

  async function redrawEnhancedProfileChart() {
    if (!isProfilePage()) return;

    const canvas = document.querySelector(".chart-box[data-profile-chart-enhanced='1']");
    const tooltip = document.querySelector(".chart-wrap .tooltip");
    if (!canvas || !tooltip) return;

    const profile = await loadProfileForChart().catch(() => null);
    const battle = activeProfileBattle(profile);
    if (!battle) return;

    drawEnhancedProfileChart(canvas, tooltip, battle);
    bindEnhancedChartHover(canvas, tooltip);
  }

  function applyProfileChartToggles() {
    if (!isProfilePage()) return;

    const wrap = document.querySelector(".chart-wrap");
    const canvas = wrap?.querySelector(".chart-box");
    if (!wrap || !canvas) return;

    ensureStyle("profile-chart-toggle-styles", `
      .chart-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin: 8px 0 10px;
        color: var(--muted);
        font-size: 13px;
      }

      .chart-controls label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
      }

      .chart-controls input {
        accent-color: var(--link);
      }

      .chart-legend-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .chart-legend-pill::before {
        content: "";
        width: 10px;
        height: 3px;
        border-radius: 999px;
        background: currentColor;
      }

      .chart-legend-points {
        color: ${isWmsy() ? "#74d99f" : "#58a6ff"};
      }

      .chart-legend-rank {
        color: #f6ad55;
      }
    `);

    if (!wrap.querySelector(".chart-controls")) {
      const controls = document.createElement("div");
      controls.className = "chart-controls";
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", "Progression series");
      controls.innerHTML = `
        <label><input id="chart-points-toggle" type="checkbox" ${profileChartState.points ? "checked" : ""}> <span class="chart-legend-pill chart-legend-points">Points</span></label>
        <label><input id="chart-rank-toggle" type="checkbox" ${profileChartState.rank ? "checked" : ""}> <span class="chart-legend-pill chart-legend-rank">Rank</span></label>
      `;

      const title = wrap.querySelector(".chart-title");
      if (title) {
        title.textContent = "Progression";
        title.insertAdjacentElement("afterend", controls);
      } else {
        wrap.insertBefore(controls, canvas);
      }
    }

    let enhancedCanvas = canvas;
    if (canvas.dataset.profileChartEnhanced !== "1") {
      enhancedCanvas = canvas.cloneNode(false);
      enhancedCanvas.className = canvas.className;
      enhancedCanvas.dataset.profileChartEnhanced = "1";
      canvas.replaceWith(enhancedCanvas);
    }

    const pointsToggle = wrap.querySelector("#chart-points-toggle");
    const rankToggle = wrap.querySelector("#chart-rank-toggle");

    function handleToggle() {
      if (!pointsToggle.checked && !rankToggle.checked) {
        this.checked = true;
      }

      profileChartState.points = pointsToggle.checked;
      profileChartState.rank = rankToggle.checked;
      redrawEnhancedProfileChart();
    }

    if (pointsToggle && pointsToggle.dataset.bound !== "1") {
      pointsToggle.dataset.bound = "1";
      pointsToggle.addEventListener("change", handleToggle);
    }

    if (rankToggle && rankToggle.dataset.bound !== "1") {
      rankToggle.dataset.bound = "1";
      rankToggle.addEventListener("change", handleToggle);
    }

    redrawEnhancedProfileChart();

    if (!resizeWired) {
      resizeWired = true;
      window.addEventListener("resize", () => {
        window.clearTimeout(applyTimer);
        applyTimer = window.setTimeout(redrawEnhancedProfileChart, 100);
      });
    }
  }

  function wireWmsyControls() {
    if (!isWmsy() || !isIndexPage() || document.body.dataset.wmsyControlsWired === "1") return;
    document.body.dataset.wmsyControlsWired = "1";

    const search = document.getElementById("search");
    if (search) {
      search.addEventListener("input", () => {
        wmsySearch = search.value || "";
        window.setTimeout(renderWmsyLeaderboard, 0);
      });
    }

    const refresh = document.getElementById("refresh");
    if (refresh) {
      refresh.addEventListener("click", () => {
        wmsyRows = [];
        wmsyData = null;
        loadWmsyLeaderboard();
      });
    }

    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (wmsySortKey === key) {
          wmsySortAsc = !wmsySortAsc;
        } else {
          wmsySortKey = key;
          wmsySortAsc = key === "username";
        }
        window.setTimeout(renderWmsyLeaderboard, 0);
      });
    });
  }

  function applyChrome() {
    const clan = currentClan();

    applyWmsyTheme();
    applyProfileRedScheme();

    const logo = document.querySelector("#site-mascot, .site-logo");
    if (logo) {
      logo.src = clan.mascot;
      logo.alt = clan.label;
    }

    const logoLink = document.querySelector("#clan-mascot-link, .site-logo-link");
    if (logoLink) {
      logoLink.href = clan.switchHome;
      logoLink.setAttribute("aria-label", `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`);
      logoLink.title = `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`;
    }

    document.querySelectorAll(".menu-bar a, [data-clan-link]").forEach(link => {
      const href = link.getAttribute("href") || "";
      link.href = withClanParam(href, clan);

      const text = String(link.textContent || "").trim();
      if (/^(c0ld|WMSY)\s+Leaderboard$/i.test(text)) {
        link.textContent = `${clan.label} Leaderboard`;
      }
    });
  }

  function applyAll() {
    applyChrome();
    applyTrackedClanCards();
    applyClanLookupProjectedRank();
    highlightTrackedClanRows();
    wireWmsyControls();
    loadWmsyLeaderboard();
    renderWmsyLeaderboard();
    applyProfileChartToggles();
  }

  function scheduleApply() {
    applyAll();
    [250, 1000, 2500, 5000].forEach(delay => window.setTimeout(applyAll, delay));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleApply);
  } else {
    scheduleApply();
  }

  window.addEventListener("pageshow", scheduleApply);

  const observer = new MutationObserver(mutations => {
    if (wmsyRendering) return;

    const touchedWmsyTable = isWmsy() && isIndexPage() && mutations.some(mutation => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return Boolean(target?.closest?.("#leaderboard-body"));
    });

    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(() => {
      applyChrome();
      applyTrackedClanCards();
      applyClanLookupProjectedRank();
      highlightTrackedClanRows();
      applyWmsyTheme();
      applyProfileChartToggles();

      if (touchedWmsyTable) {
        renderWmsyLeaderboard();
      }
    }, 100);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
