(() => {
  const MEMBER_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/current";
  const MEMBER_API_HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/history";

  const COLORS = {
    c0ld: "#ff9b96",
    wmsy: "#74d99f",
    nong: "#f6ad55",
    default: "#58a6ff",
    rank: "#8b949e"
  };

  const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" rx="16" fill="#21262d"/>
        <circle cx="75" cy="58" r="26" fill="#6e7681"/>
        <path d="M36 123c8-20 24-32 39-32s31 12 39 32" fill="#6e7681"/>
      </svg>
    `);

  let profilePromise = null;
  let profileKey = "";
  let redrawTimer = null;
  let resizeBound = false;
  let selfDrawing = false;

  const chartState = {
    points: true,
    rank: false
  };

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isProfilePage() {
    return currentPage() === "profile.html";
  }

  function isClansPage() {
    return currentPage() === "clans.html";
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function currentClanKey() {
    const params = new URLSearchParams(window.location.search);
    return normalize(params.get("clan")) === "wmsy" ? "wmsy" : "c0ld";
  }

  function clanColor(name, fallback = COLORS.default) {
    return COLORS[normalize(name)] || fallback;
  }

  function viewedPlayerColor() {
    const key = currentClanKey();
    return key === "wmsy" ? COLORS.wmsy : COLORS.c0ld;
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
    const n = finiteNumber(value);
    return n === null ? "—" : n.toLocaleString("en-US");
  }

  function fmtShortNum(value) {
    const n = finiteNumber(value);
    if (n === null) return "—";

    const tiers = [
      { value: 1e12, suffix: "T" },
      { value: 1e9, suffix: "B" },
      { value: 1e6, suffix: "M" },
      { value: 1e3, suffix: "K" }
    ];

    for (const tier of tiers) {
      if (Math.abs(n) >= tier.value) {
        return (n / tier.value).toFixed(2).replace(/\.?0+$/, "") + tier.suffix;
      }
    }

    return String(n);
  }

  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function fmtRank(value) {
    const n = finiteNumber(value);
    return n === null ? "—" : `#${n.toLocaleString("en-US")}`;
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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
    return normalize(battle?.battle || battle?.display_name || battle?.name || battle?.battle_name || "");
  }

  function selectedBattleIdentity() {
    const select = document.getElementById("battle-select");
    const selectedText = select?.selectedOptions?.[0]?.textContent || "";
    return normalize(selectedText);
  }

  function summarizeLiveProfile(current, history, id) {
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

    return {
      user_id: userId,
      battles: [{
        battle: current.battle || "current",
        display_name: current.display_name || current.battle || "Current Clan Battle",
        series: rows.map(row => ({
          t: row.fetched_at,
          rank: row.rank ?? null,
          points: Number(getRowPoints(row) || 0)
        })).filter(point => point.t)
      }]
    };
  }

  async function loadLiveProfile(id, clanLabel) {
    const current = await fetchJson(`${MEMBER_API_CURRENT_URL}?clan=${encodeURIComponent(clanLabel)}`);
    const currentRow = findCurrentRow(current, id);
    const userId = currentRow?.user_id || (/^\d+$/.test(String(id)) ? String(id) : "");

    if (!userId) return summarizeLiveProfile(current, { rows: [] }, id);

    const historyUrl =
      `${MEMBER_API_HISTORY_URL}?clan=${encodeURIComponent(clanLabel)}` +
      `&user_id=${encodeURIComponent(String(userId))}` +
      `${current.battle ? `&battle=${encodeURIComponent(current.battle)}` : ""}` +
      "&hours=336&limit=50000";

    try {
      const history = await fetchJson(historyUrl);
      return summarizeLiveProfile(current, history, userId);
    } catch {
      return summarizeLiveProfile(current, { rows: [] }, userId || id);
    }
  }

  async function loadStaticProfile(id) {
    const res = await fetch(`Data/players/${encodeURIComponent(id)}.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadProfileForChart() {
    const id = getProfileId();
    const mode = currentClanKey();
    const key = `${mode}:${id}`;

    if (!id) return null;

    if (profilePromise && profileKey === key) return profilePromise;

    profileKey = key;
    profilePromise = (async () => {
      const label = mode === "wmsy" ? "WMSY" : "c0ld";
      const liveProfile = await loadLiveProfile(id, label).catch(() => null);
      const staticProfile = mode === "c0ld" ? await loadStaticProfile(id).catch(() => null) : null;
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

    return profilePromise;
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

  function activeBattle(profile) {
    const target = selectedBattleIdentity();
    const battles = Array.isArray(profile?.battles) ? profile.battles : [];
    return battles.find(battle => battleIdentity(battle) === target) || battles[0] || null;
  }

  function yScale(value, min, max, top, height, mode) {
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
    points.forEach((point, index) => index === 0 ? ctx.moveTo(x(point), y(point)) : ctx.lineTo(x(point), y(point)));
    ctx.stroke();
    const last = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(last), y(last), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawProfileChart(canvas, tooltip, battle) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const series = chartSeriesFromBattle(battle);
    const pointsSeries = chartState.points ? series.filter(item => item.points !== null) : [];
    const rankSeries = chartState.rank ? series.filter(item => item.rank !== null) : [];
    const visible = [...pointsSeries, ...rankSeries];

    selfDrawing = true;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (visible.length < 2) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText("Not enough points to chart.", 16, 28);
      canvas._siteChart = { series, battle };
      window.setTimeout(() => { selfDrawing = false; }, 0);
      return;
    }

    const padLeft = 58;
    const padRight = 18;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;
    const minT = Math.min(...visible.map(point => point.t));
    const maxT = Math.max(...visible.map(point => point.t));
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
      return yScale(point.points, minPoints, maxPoints, padTop, height, "points");
    }

    function yRank(point) {
      return yScale(point.rank, minRank, maxRank, padTop, height, "rank");
    }

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#8b949e";

    const grid = pointValues.length ? { min: minPoints, max: maxPoints, type: "points" } : { min: minRank, max: maxRank, type: "rank" };
    for (let i = 0; i <= 4; i++) {
      const pct = i / 4;
      const yy = padTop + pct * height;
      const value = grid.type === "rank"
        ? grid.min + pct * (grid.max - grid.min)
        : grid.max - pct * (grid.max - grid.min);
      ctx.beginPath();
      ctx.moveTo(padLeft, yy);
      ctx.lineTo(rect.width - padRight, yy);
      ctx.stroke();
      ctx.fillText(grid.type === "rank" ? `#${Math.round(value)}` : fmtShortNum(value), 8, yy + 4);
    }

    drawSeries(ctx, pointsSeries, x, yPoints, viewedPlayerColor());
    drawSeries(ctx, rankSeries, x, yRank, COLORS.rank);

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);
    ctx.fillStyle = "#8b949e";
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), padLeft, rect.height - 12);
    const lastLabel = lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const lastWidth = ctx.measureText(lastLabel).width;
    ctx.fillText(lastLabel, rect.width - padRight - lastWidth, rect.height - 12);

    canvas._siteChart = { series, x, yPoints, yRank, padTop, padBottom, rect, battle, showPoints: chartState.points, showRank: chartState.rank };
    window.setTimeout(() => { selfDrawing = false; }, 0);
  }

  function bindHover(canvas, tooltip) {
    if (canvas.dataset.siteHoverBound === "1") return;
    canvas.dataset.siteHoverBound = "1";

    function hide() {
      if (tooltip) tooltip.style.display = "none";
    }

    function move(ev) {
      const chart = canvas._siteChart;
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

      drawProfileChart(canvas, tooltip, chart.battle);
      const ctx = canvas.getContext("2d");
      const px = chart.x(nearest);
      const py = chart.showPoints && nearest.points !== null ? chart.yPoints(nearest) : chart.yRank(nearest);
      ctx.save();
      ctx.strokeStyle = "rgba(139, 148, 158, 0.55)";
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
        <div>Rank: ${nearest.rank === null ? "—" : fmtRank(nearest.rank)}</div>
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

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", hide);
    canvas.addEventListener("touchstart", ev => ev.touches?.[0] && move(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchmove", ev => ev.touches?.[0] && move(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchend", hide);
  }

  async function redrawProfileChart() {
    if (!isProfilePage()) return;
    const canvas = document.querySelector(".chart-box[data-site-chart='1']");
    const tooltip = document.querySelector(".chart-wrap .tooltip");
    if (!canvas || !tooltip) return;
    const profile = await loadProfileForChart().catch(() => null);
    const battle = activeBattle(profile);
    if (!battle) return;
    drawProfileChart(canvas, tooltip, battle);
    bindHover(canvas, tooltip);
  }

  function applyProfileChartTheme() {
    if (!isProfilePage()) return;
    const wrap = document.querySelector(".chart-wrap");
    const canvas = wrap?.querySelector(".chart-box");
    if (!wrap || !canvas) return;

    const pointsColor = viewedPlayerColor();
    ensureStyle("site-profile-chart-theme", `
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
      .chart-controls input { accent-color: var(--link); }
      .chart-legend-pill { display: inline-flex; align-items: center; gap: 5px; }
      .chart-legend-pill::before {
        content: "";
        width: 10px;
        height: 3px;
        border-radius: 999px;
        background: currentColor;
      }
      .chart-legend-points { color: ${pointsColor} !important; }
      .chart-legend-rank { color: ${COLORS.rank} !important; }
    `);

    const title = wrap.querySelector(".chart-title");
    if (title) title.textContent = "Progression";

    let controls = wrap.querySelector(".chart-controls");
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "chart-controls";
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", "Progression series");
      controls.innerHTML = `
        <label><input id="chart-points-toggle" type="checkbox" checked> <span class="chart-legend-pill chart-legend-points">Points</span></label>
        <label><input id="chart-rank-toggle" type="checkbox"> <span class="chart-legend-pill chart-legend-rank">Rank</span></label>
      `;
      if (title) title.insertAdjacentElement("afterend", controls);
      else wrap.insertBefore(controls, canvas);
    }

    const pointsToggle = controls.querySelector("#chart-points-toggle");
    const rankToggle = controls.querySelector("#chart-rank-toggle");

    if (pointsToggle) pointsToggle.checked = chartState.points;
    if (rankToggle) rankToggle.checked = chartState.rank;

    function handleToggle() {
      if (!pointsToggle.checked && !rankToggle.checked) this.checked = true;
      chartState.points = pointsToggle.checked;
      chartState.rank = rankToggle.checked;
      redrawProfileChart();
    }

    if (pointsToggle && pointsToggle.dataset.siteBound !== "1") {
      pointsToggle.dataset.siteBound = "1";
      pointsToggle.addEventListener("change", handleToggle);
    }

    if (rankToggle && rankToggle.dataset.siteBound !== "1") {
      rankToggle.dataset.siteBound = "1";
      rankToggle.addEventListener("change", handleToggle);
    }

    let themedCanvas = canvas;
    if (canvas.dataset.siteChart !== "1") {
      themedCanvas = canvas.cloneNode(false);
      themedCanvas.className = canvas.className;
      themedCanvas.dataset.siteChart = "1";
      canvas.replaceWith(themedCanvas);
    }

    redrawProfileChart();

    if (!resizeBound) {
      resizeBound = true;
      window.addEventListener("resize", () => {
        window.clearTimeout(redrawTimer);
        redrawTimer = window.setTimeout(redrawProfileChart, 100);
      });
    }
  }

  function clanProfileUrl(clanName) {
    const name = String(clanName || "").trim();
    const key = normalize(name);
    const params = new URLSearchParams();
    params.set("name", name);
    if (key === "wmsy") params.set("clan", "WMSY");
    return `clan-profile.html?${params.toString()}`;
  }

  function linkClanRows() {
    if (!isClansPage()) return;

    const style = `
      #clans-tbody a.clan-profile-link {
        color: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        max-width: 100%;
      }
      #clans-tbody a.clan-profile-link:hover .clan-name {
        text-decoration: underline;
      }
    `;
    ensureStyle("clan-profile-link-styles", style);

    document.querySelectorAll("#clans-tbody .clan-cell").forEach(cell => {
      if (cell.closest("a.clan-profile-link") || cell.dataset.clanProfileLinked === "1") return;
      const name = cell.querySelector(".clan-name")?.textContent?.trim();
      if (!name) return;

      const link = document.createElement("a");
      link.className = "clan-profile-link";
      link.href = clanProfileUrl(name);
      link.title = `Open ${name} clan profile`;
      cell.parentNode.insertBefore(link, cell);
      link.appendChild(cell);
      cell.dataset.clanProfileLinked = "1";
    });
  }

  function applyAll() {
    applyProfileChartTheme();
    linkClanRows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAll);
  } else {
    applyAll();
  }

  window.addEventListener("pageshow", applyAll);

  const observer = new MutationObserver(() => {
    if (selfDrawing) return;
    window.clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(applyAll, 120);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
