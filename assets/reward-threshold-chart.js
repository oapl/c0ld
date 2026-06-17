(() => {
  const CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  const HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

  const RANGES = {
    "1-4": { label: "Ranks 1–4", cutoffRank: 3, challengerRank: 4 },
    "5-11": { label: "Ranks 5–11", cutoffRank: 10, challengerRank: 11 },
    "12-51": { label: "Ranks 12–51", cutoffRank: 50, challengerRank: 51 }
  };

  const PACES = {
    "1h": { label: "Project with 1h pace", short: "1h pace", hours: 1 },
    "12h": { label: "Project with 12h pace", short: "12h pace", hours: 12 },
    "24h": { label: "Project with 24h pace", short: "24h pace", hours: 24 },
    "none": { label: "Current gap only", short: "current gap", hours: 0 }
  };

  const SPECIAL_COLORS = {
    c0ld: "#ff9b96",
    wmsy: "#74d99f",
    nong: "#f6ad55"
  };

  const DEFAULT_COLORS = ["#58a6ff", "#d2a8ff", "#79c0ff", "#ffa657", "#a5d6ff"];

  let currentData = null;
  let historyData = null;
  let selectedRange = "1-4";
  let selectedPace = "12h";
  let loading = false;
  let chartBound = false;
  let resizeTimer = null;

  function isClansPage() {
    return (window.location.pathname.split("/").pop() || "index.html") === "clans.html";
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function cleanClanName(value) {
    return String(value || "").replace(/★/g, "").trim();
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function fmtShort(value) {
    const n = finite(value);
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

    return Math.round(n).toLocaleString("en-US");
  }

  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function clanColor(name, index = 0) {
    return SPECIAL_COLORS[normalize(name)] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function ensureStyles() {
    if (document.getElementById("reward-threshold-chart-styles")) return;

    const style = document.createElement("style");
    style.id = "reward-threshold-chart-styles";
    style.textContent = `
      .reward-threshold-section {
        margin-bottom: 24px;
      }

      .reward-threshold-section .section-header {
        justify-content: stretch;
      }

      .reward-threshold-controls {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        align-items: center;
        width: 100%;
      }

      .reward-threshold-ranges,
      .reward-threshold-metrics {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .reward-range-btn {
        white-space: nowrap;
      }

      .reward-range-btn.active {
        border-color: var(--link);
        color: var(--link);
        background: rgba(88, 166, 255, 0.10);
      }

      body[data-clan="wmsy"] .reward-range-btn.active {
        border-color: rgba(72, 187, 120, 0.78) !important;
        color: #74d99f !important;
        background: rgba(72, 187, 120, 0.14) !important;
      }

      .reward-threshold-body {
        padding: 14px 16px 16px;
      }

      .reward-threshold-chart-shell {
        position: relative;
      }

      #reward-threshold-chart {
        width: 100%;
        height: 330px;
        display: block;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
        cursor: crosshair;
      }

      .reward-threshold-tooltip {
        position: absolute;
        z-index: 10;
        display: none;
        pointer-events: none;
        min-width: 240px;
        max-width: 340px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: #0b0f14;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        color: var(--text);
        font-size: 13px;
        line-height: 1.45;
      }

      .reward-threshold-tooltip strong {
        display: block;
        margin-bottom: 4px;
      }

      .reward-threshold-summary {
        margin-top: 10px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .reward-threshold-summary strong {
        color: var(--text);
      }

      .reward-threshold-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        margin-top: 10px;
        color: var(--muted);
        font-size: 12px;
      }

      .reward-threshold-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .reward-threshold-legend-item::before {
        content: "";
        width: 11px;
        height: 3px;
        border-radius: 999px;
        background: currentColor;
      }

      .reward-threshold-legend-item.forecast::before {
        opacity: 0.75;
        background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px);
      }

      @media (max-width: 700px) {
        #reward-threshold-chart {
          height: 280px;
        }

        .reward-threshold-controls,
        .reward-threshold-ranges,
        .reward-threshold-metrics,
        #reward-threshold-pace {
          width: 100%;
        }

        #reward-threshold-pace,
        #reward-threshold-refresh {
          min-width: 0;
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensurePanel() {
    if (!isClansPage()) return null;

    ensureStyles();

    let panel = document.getElementById("reward-threshold-section");
    if (panel) return panel;

    const main = document.querySelector("main");
    const leaderboard = document.querySelector("main > .section");
    if (!main || !leaderboard) return null;

    panel = document.createElement("section");
    panel.className = "section reward-threshold-section";
    panel.id = "reward-threshold-section";
    panel.innerHTML = `
      <div class="section-header">
        <div class="reward-threshold-controls">
          <div class="reward-threshold-ranges">
            ${Object.entries(RANGES).map(([key, range]) => `
              <button type="button" class="reward-range-btn${key === selectedRange ? " active" : ""}" data-range="${key}">${range.label}</button>
            `).join("")}
          </div>
          <div class="reward-threshold-metrics">
            <select id="reward-threshold-pace" aria-label="Projection pace">
              ${Object.entries(PACES).map(([key, pace]) => `
                <option value="${key}"${key === selectedPace ? " selected" : ""}>${pace.label}</option>
              `).join("")}
            </select>
            <button id="reward-threshold-refresh" type="button">Refresh Chart</button>
          </div>
        </div>
      </div>
      <div class="reward-threshold-body">
        <div class="reward-threshold-chart-shell">
          <canvas id="reward-threshold-chart"></canvas>
          <div class="reward-threshold-tooltip" id="reward-threshold-tooltip"></div>
        </div>
        <div class="reward-threshold-summary" id="reward-threshold-summary">Loading cutoff risk...</div>
        <div class="reward-threshold-legend" id="reward-threshold-legend"></div>
      </div>
    `;

    main.insertBefore(panel, leaderboard);
    wireControls(panel);
    return panel;
  }

  function wireControls(panel) {
    panel.querySelectorAll(".reward-range-btn").forEach(button => {
      button.addEventListener("click", () => {
        selectedRange = button.dataset.range || selectedRange;
        panel.querySelectorAll(".reward-range-btn").forEach(item => item.classList.toggle("active", item === button));
        draw();
      });
    });

    panel.querySelector("#reward-threshold-pace")?.addEventListener("change", event => {
      selectedPace = event.target.value || selectedPace;
      draw();
    });

    panel.querySelector("#reward-threshold-refresh")?.addEventListener("click", () => loadData(true));
  }

  function normalizeCurrentRow(row) {
    return {
      fetched_at: row.fetched_at,
      rank: finite(row.rank),
      clan_name: cleanClanName(row.clan_name || row.clan || row.name || row.tag),
      points: finite(row.points ?? row.total_points),
      gain_1h: finite(row.gain_1h),
      gain_12h: finite(row.gain_12h),
      gain_24h: finite(row.gain_24h)
    };
  }

  function normalizeHistoryRow(row) {
    return {
      fetched_at: row.fetched_at,
      rank: finite(row.rank),
      clan_name: cleanClanName(row.clan_name || row.clan || row.name || row.tag),
      points: finite(row.points ?? row.total_points)
    };
  }

  async function loadData(force = false) {
    if (!isClansPage() || loading) return;
    ensurePanel();

    if (currentData && historyData && !force) {
      draw();
      return;
    }

    loading = true;
    const summary = document.getElementById("reward-threshold-summary");
    if (summary) summary.textContent = "Loading cutoff risk...";

    try {
      currentData = await fetchJson(CURRENT_URL);
      const battle = currentData?.battle || "current";
      historyData = await fetchJson(`${HISTORY_URL}?battle=${encodeURIComponent(battle)}&hours=336&limit=50000`).catch(() => ({ rows: [] }));
      draw();
    } catch (err) {
      console.warn("Cutoff risk chart failed", err);
      if (summary) summary.textContent = `Could not load cutoff risk chart. ${err.message || err}`;
    } finally {
      loading = false;
    }
  }

  function currentRows() {
    return (currentData?.rows || []).map(normalizeCurrentRow).filter(row => row.clan_name && row.rank !== null && row.points !== null);
  }

  function boundaryPair() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    const rows = currentRows();
    const holder = rows.find(row => row.rank === range.cutoffRank) || null;
    const challenger = rows.find(row => row.rank === range.challengerRank) || null;
    return { range, holder, challenger };
  }

  function historyForClan(clanName) {
    const key = normalize(clanName);
    const rows = (historyData?.rows || [])
      .map(normalizeHistoryRow)
      .filter(row => normalize(row.clan_name) === key && row.points !== null && row.fetched_at)
      .sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));

    const current = currentRows().find(row => normalize(row.clan_name) === key);
    if (current?.fetched_at && current.points !== null && !rows.some(row => row.fetched_at === current.fetched_at)) {
      rows.push({
        fetched_at: current.fetched_at,
        rank: current.rank,
        clan_name: current.clan_name,
        points: current.points
      });
      rows.sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));
    }

    return rows;
  }

  function findBase(rows, latest, hours) {
    if (!hours || !rows.length || !latest?.fetched_at) return null;

    const target = new Date(latest.fetched_at).getTime() - hours * 60 * 60 * 1000;
    if (!Number.isFinite(target)) return null;

    for (let i = rows.length - 2; i >= 0; i -= 1) {
      const ms = new Date(rows[i].fetched_at).getTime();
      if (Number.isFinite(ms) && ms <= target) return rows[i];
    }

    return rows.length > 1 ? rows[0] : null;
  }

  function rateFor(clanRow, rows, paceKey) {
    const pace = PACES[paceKey] || PACES["12h"];
    if (!pace.hours) return 0;

    const latest = rows[rows.length - 1] || null;
    const base = findBase(rows, latest, pace.hours);

    if (latest && base && finite(latest.points) !== null && finite(base.points) !== null) {
      const latestMs = new Date(latest.fetched_at).getTime();
      const baseMs = new Date(base.fetched_at).getTime();
      const hours = Math.max(0.01, (latestMs - baseMs) / (60 * 60 * 1000));
      return (latest.points - base.points) / hours;
    }

    const fallbackGain = clanRow?.[`gain_${paceKey}`];
    if (finite(fallbackGain) !== null) return fallbackGain / pace.hours;

    return 0;
  }

  function projectionPoint(clanRow, rows) {
    const pace = PACES[selectedPace] || PACES["12h"];
    const latest = rows[rows.length - 1] || null;
    if (!latest || selectedPace === "none") return null;

    const endMs = new Date(currentData?.battle_end_iso || "").getTime();
    const latestMs = new Date(latest.fetched_at).getTime();
    if (!Number.isFinite(endMs) || !Number.isFinite(latestMs) || endMs <= latestMs) return null;

    const rate = rateFor(clanRow, rows, selectedPace);
    const remainingHours = Math.max(0, (endMs - latestMs) / (60 * 60 * 1000));

    return {
      t: endMs,
      rawT: new Date(endMs).toISOString(),
      points: Math.max(0, latest.points + rate * remainingHours),
      rank: clanRow.rank,
      projected: true,
      rate
    };
  }

  function buildSeries() {
    const { holder, challenger } = boundaryPair();
    if (!holder || !challenger) return [];

    return [holder, challenger].map((row, index) => {
      const rows = historyForClan(row.clan_name).map(item => ({
        t: new Date(item.fetched_at).getTime(),
        rawT: item.fetched_at,
        points: item.points,
        rank: item.rank,
        projected: false
      })).filter(item => Number.isFinite(item.t) && item.points !== null);

      const forecast = projectionPoint(row, rows);

      return {
        clan_name: row.clan_name,
        rank: row.rank,
        color: clanColor(row.clan_name, index),
        current: row,
        solid: rows,
        forecast: forecast && rows.length ? [rows[rows.length - 1], forecast] : [],
        projectedEnd: forecast?.points ?? rows[rows.length - 1]?.points ?? row.points,
        rate: forecast?.rate ?? rateFor(row, rows, selectedPace)
      };
    }).filter(series => series.solid.length >= 1);
  }

  function drawLine(ctx, points, x, y, color, options = {}) {
    if (!points.length) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = options.width || 2;
    ctx.globalAlpha = options.alpha ?? 0.92;
    if (options.dash) ctx.setLineDash(options.dash);
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(x(point), y(point));
      else ctx.lineTo(x(point), y(point));
    });
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(last), y(last), options.radius || 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const panel = ensurePanel();
    if (!panel || !currentData) return;

    const canvas = document.getElementById("reward-threshold-chart");
    const tooltip = document.getElementById("reward-threshold-tooltip");
    const summary = document.getElementById("reward-threshold-summary");
    const legend = document.getElementById("reward-threshold-legend");
    if (!canvas || !tooltip) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const seriesList = buildSeries();
    const { range, holder, challenger } = boundaryPair();
    const pace = PACES[selectedPace] || PACES["12h"];

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!holder || !challenger || seriesList.length < 2) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText("Not enough current or historical data is available for this cutoff yet.", 16, 28);
      if (summary) summary.textContent = `${range.label}: not enough data for the cutoff pair.`;
      if (legend) legend.innerHTML = "";
      canvas._rewardThresholdChart = null;
      return;
    }

    const allPoints = seriesList.flatMap(series => [...series.solid, ...series.forecast]);
    const minT = Math.min(...allPoints.map(point => point.t));
    const maxT = Math.max(...allPoints.map(point => point.t));
    const minYRaw = Math.min(...allPoints.map(point => point.points));
    const maxYRaw = Math.max(...allPoints.map(point => point.points));
    const paddingY = Math.max((maxYRaw - minYRaw) * 0.12, 1_000_000);
    const minY = Math.max(0, minYRaw - paddingY);
    const maxY = maxYRaw + paddingY;

    const padLeft = 66;
    const padRight = 120;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;

    const x = point => maxT === minT ? padLeft : padLeft + ((point.t - minT) / (maxT - minT)) * width;
    const y = point => maxY === minY ? padTop + height / 2 : padTop + (1 - ((point.points - minY) / (maxY - minY))) * height;

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#8b949e";

    for (let i = 0; i <= 4; i += 1) {
      const pct = i / 4;
      const yy = padTop + pct * height;
      const value = maxY - pct * (maxY - minY);
      ctx.beginPath();
      ctx.moveTo(padLeft, yy);
      ctx.lineTo(rect.width - padRight, yy);
      ctx.stroke();
      ctx.fillText(fmtShort(value), 8, yy + 4);
    }

    seriesList.forEach(series => {
      drawLine(ctx, series.solid, x, y, series.color, { width: 2.35 });
      drawLine(ctx, series.forecast, x, y, series.color, { width: 2.1, dash: [7, 5], alpha: 0.72, radius: 3 });
    });

    ctx.save();
    ctx.font = "12px Arial";
    seriesList.forEach(series => {
      const last = (series.forecast.length ? series.forecast[series.forecast.length - 1] : series.solid[series.solid.length - 1]);
      ctx.fillStyle = series.color;
      ctx.fillText(`#${series.rank} ${series.clan_name}`, x(last) + 7, Math.max(padTop + 10, Math.min(rect.height - padBottom - 3, y(last) + 4)));
    });
    ctx.restore();

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);
    ctx.fillStyle = "#8b949e";
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), padLeft, rect.height - 12);
    const lastLabel = selectedPace === "none"
      ? lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "Battle End";
    ctx.fillText(lastLabel, rect.width - padRight - ctx.measureText(lastLabel).width, rect.height - 12);

    const holderSeries = seriesList.find(series => series.rank === range.cutoffRank) || seriesList[0];
    const challengerSeries = seriesList.find(series => series.rank === range.challengerRank) || seriesList[1];
    const currentGap = Math.max(0, holder.points - challenger.points + 1);
    const projectedGap = holderSeries.projectedEnd - challengerSeries.projectedEnd + 1;

    if (summary) {
      if (selectedPace === "none") {
        summary.innerHTML = `<strong>#${challenger.rank} ${escapeHtml(challenger.clan_name)}</strong> needs to make up <strong>${fmtShort(currentGap)}</strong> points to pass <strong>#${holder.rank} ${escapeHtml(holder.clan_name)}</strong>.`;
      } else if (projectedGap <= 0) {
        summary.innerHTML = `<strong>#${challenger.rank} ${escapeHtml(challenger.clan_name)}</strong> needs to make up <strong>${fmtShort(currentGap)}</strong> points to pass <strong>#${holder.rank} ${escapeHtml(holder.clan_name)}</strong>. Using the selected <strong>${pace.short}</strong>, ${escapeHtml(challenger.clan_name)} <strong>is projected to pass</strong> ${escapeHtml(holder.clan_name)} by about <strong>${fmtShort(Math.abs(projectedGap))}</strong> points before the battle ends.`;
      } else {
        summary.innerHTML = `<strong>#${challenger.rank} ${escapeHtml(challenger.clan_name)}</strong> needs to make up <strong>${fmtShort(currentGap)}</strong> points to pass <strong>#${holder.rank} ${escapeHtml(holder.clan_name)}</strong>. Using the selected <strong>${pace.short}</strong>, ${escapeHtml(challenger.clan_name)} <strong>is not projected to pass</strong> ${escapeHtml(holder.clan_name)} and finishes about <strong>${fmtShort(projectedGap)}</strong> points short.`;
      }
    }

    if (legend) {
      legend.innerHTML = seriesList.map(series => `
        <span class="reward-threshold-legend-item" style="color:${series.color}">#${series.rank} ${escapeHtml(series.clan_name)}</span>
        ${selectedPace === "none" ? "" : `<span class="reward-threshold-legend-item forecast" style="color:${series.color}">projected</span>`}
      `).join("");
    }

    canvas._rewardThresholdChart = { seriesList, x, y, padTop, padBottom, rect };
    bindTooltip(canvas, tooltip);
  }

  function bindTooltip(canvas, tooltip) {
    if (chartBound) return;
    chartBound = true;

    function hide() {
      tooltip.style.display = "none";
    }

    function move(ev) {
      const chart = canvas._rewardThresholdChart;
      if (!chart) return;

      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      let nearest = null;
      let nearestSeries = null;
      let nearestDist = Infinity;

      for (const series of chart.seriesList) {
        for (const point of [...series.solid, ...series.forecast]) {
          const dist = Math.abs(chart.x(point) - mx);
          if (dist < nearestDist) {
            nearest = point;
            nearestSeries = series;
            nearestDist = dist;
          }
        }
      }

      if (!nearest || !nearestSeries) return;

      draw();
      const fresh = canvas._rewardThresholdChart;
      const ctx = canvas.getContext("2d");
      const px = fresh.x(nearest);
      const py = fresh.y(nearest);

      ctx.save();
      ctx.strokeStyle = "rgba(139, 148, 158, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, fresh.padTop);
      ctx.lineTo(px, fresh.rect.height - fresh.padBottom);
      ctx.stroke();
      ctx.fillStyle = "#e6edf3";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      tooltip.innerHTML = `
        <strong style="color:${nearestSeries.color}">#${nearestSeries.rank} ${escapeHtml(nearestSeries.clan_name)}</strong>
        <div>${nearest.projected ? "Projected points" : "Points"}: ${fmtShort(nearest.points)}</div>
        <div>${nearest.projected ? "Projected to" : "Seen"}: ${fmtDateTime(nearest.rawT)}</div>
      `;

      tooltip.style.display = "block";
      const tip = tooltip.getBoundingClientRect();
      let left = ev.clientX - rect.left + 14;
      let top = ev.clientY - rect.top + 14;
      if (left + tip.width > rect.width) left = ev.clientX - rect.left - tip.width - 14;
      if (top + tip.height > rect.height) top = ev.clientY - rect.top - tip.height - 14;
      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    }

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", hide);
    canvas.addEventListener("touchstart", event => event.touches?.[0] && move(event.touches[0]), { passive: true });
    canvas.addEventListener("touchmove", event => event.touches?.[0] && move(event.touches[0]), { passive: true });
    canvas.addEventListener("touchend", hide);
  }

  function init() {
    if (!isClansPage()) return;
    ensurePanel();
    loadData(false);
    [750, 1800, 3600].forEach(delay => window.setTimeout(() => loadData(false), delay));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("pageshow", init);
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(draw, 120);
  });
})();
