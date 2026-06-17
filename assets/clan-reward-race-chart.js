(() => {
  const CLANS_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  const CLANS_API_HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

  const RANGES = {
    "1-4": { label: "Ranks 1–4", min: 1, max: 4, note: "Top 1 / Top 3 cutoff view" },
    "5-11": { label: "Ranks 5–11", min: 5, max: 11, note: "Top 10 cutoff view" },
    "12-51": { label: "Ranks 12–51", min: 12, max: 51, note: "Top 50 cutoff view" }
  };

  const METRICS = {
    projected_12h: { label: "Projected Finish — 12h pace", shortLabel: "Projected 12h", mode: "projected", hours: 12 },
    projected_1h: { label: "Projected Finish — 1h pace", shortLabel: "Projected 1h", mode: "projected", hours: 1 },
    projected_24h: { label: "Projected Finish — 24h pace", shortLabel: "Projected 24h", mode: "projected", hours: 24 },
    gain_1h: { label: "1h Growth", shortLabel: "1h Growth", mode: "gain", hours: 1 },
    gain_12h: { label: "12h Growth", shortLabel: "12h Growth", mode: "gain", hours: 12 },
    gain_24h: { label: "24h Growth", shortLabel: "24h Growth", mode: "gain", hours: 24 },
    points: { label: "Current Points", shortLabel: "Points", mode: "points", hours: 0 }
  };

  const SPECIAL_COLORS = {
    c0ld: "#ff9b96",
    wmsy: "#74d99f",
    nong: "#f6ad55"
  };

  const PALETTE = [
    "#58a6ff", "#d2a8ff", "#79c0ff", "#ffa657", "#a5d6ff",
    "#ff7b72", "#3fb950", "#f2cc60", "#db61a2", "#56d4dd",
    "#c9d1d9", "#7ee787", "#ffdf5d", "#bc8cff", "#f778ba"
  ];

  let currentData = null;
  let historyData = null;
  let selectedRange = "1-4";
  let selectedMetric = "projected_12h";
  let chartBound = false;
  let refreshTimer = null;
  let drawTimer = null;

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isClansPage() {
    return currentPage() === "clans.html";
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function fmtShort(value) {
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

    return n.toLocaleString("en-US");
  }

  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function clanColor(name, index = 0) {
    const key = normalize(name);
    return SPECIAL_COLORS[key] || PALETTE[index % PALETTE.length];
  }

  function cleanClanName(value) {
    return String(value || "").replace(/★/g, "").trim();
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function ensureStyles() {
    if (document.getElementById("reward-race-chart-styles")) return;

    const style = document.createElement("style");
    style.id = "reward-race-chart-styles";
    style.textContent = `
      .reward-race-section {
        margin-bottom: 24px;
      }

      .reward-race-header-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .reward-race-subtitle {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }

      .reward-race-controls {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        align-items: center;
        width: 100%;
      }

      .reward-range-buttons,
      .reward-metric-controls {
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

      .reward-race-body {
        padding: 14px 16px 16px;
      }

      .reward-race-chart-shell {
        position: relative;
      }

      #reward-race-chart {
        width: 100%;
        height: 360px;
        display: block;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
        cursor: crosshair;
      }

      .reward-race-tooltip {
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

      .reward-race-tooltip strong {
        display: block;
        margin-bottom: 4px;
      }

      .reward-race-summary {
        margin-top: 10px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .reward-race-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        margin-top: 10px;
        color: var(--muted);
        font-size: 12px;
      }

      .reward-race-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .reward-race-legend-item::before {
        content: "";
        width: 11px;
        height: 3px;
        border-radius: 999px;
        background: currentColor;
      }

      @media (max-width: 700px) {
        #reward-race-chart {
          height: 280px;
        }

        .reward-race-controls,
        .reward-range-buttons,
        .reward-metric-controls,
        #reward-metric-select {
          width: 100%;
        }

        #reward-metric-select,
        #reward-race-refresh {
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

    let panel = document.getElementById("reward-race-section");
    if (panel) return panel;

    const main = document.querySelector("main");
    const leaderboardSection = document.querySelector("main > .section");
    if (!main || !leaderboardSection) return null;

    panel = document.createElement("section");
    panel.className = "section reward-race-section";
    panel.id = "reward-race-section";
    panel.innerHTML = `
      <div class="section-header">
        <div class="reward-race-header-main">
          <h2 class="section-title">Reward Threshold Pace</h2>
          <div class="reward-race-subtitle" id="reward-race-subtitle">
            Compare clan movement around the reward cutoffs. Top 500 gift tier is intentionally excluded.
          </div>
        </div>
        <div class="reward-race-controls">
          <div class="reward-range-buttons" id="reward-range-buttons">
            ${Object.entries(RANGES).map(([key, range]) => `
              <button type="button" class="reward-range-btn${key === selectedRange ? " active" : ""}" data-range="${key}" title="${range.note}">${range.label}</button>
            `).join("")}
          </div>
          <div class="reward-metric-controls">
            <select id="reward-metric-select" aria-label="Reward race metric">
              ${Object.entries(METRICS).map(([key, metric]) => `
                <option value="${key}"${key === selectedMetric ? " selected" : ""}>${metric.label}</option>
              `).join("")}
            </select>
            <button id="reward-race-refresh" type="button">Refresh Chart</button>
          </div>
        </div>
      </div>
      <div class="reward-race-body">
        <div class="reward-race-chart-shell">
          <canvas id="reward-race-chart"></canvas>
          <div class="reward-race-tooltip" id="reward-race-tooltip"></div>
        </div>
        <div class="reward-race-summary" id="reward-race-summary">Loading reward threshold chart...</div>
        <div class="reward-race-legend" id="reward-race-legend"></div>
      </div>
    `;

    main.insertBefore(panel, leaderboardSection);
    wirePanelControls(panel);
    return panel;
  }

  function wirePanelControls(panel) {
    panel.querySelectorAll(".reward-range-btn").forEach(button => {
      button.addEventListener("click", () => {
        selectedRange = button.dataset.range || selectedRange;
        panel.querySelectorAll(".reward-range-btn").forEach(item => item.classList.toggle("active", item === button));
        drawRewardRaceChart();
      });
    });

    const metricSelect = panel.querySelector("#reward-metric-select");
    metricSelect?.addEventListener("change", () => {
      selectedMetric = metricSelect.value || selectedMetric;
      drawRewardRaceChart();
    });

    panel.querySelector("#reward-race-refresh")?.addEventListener("click", () => loadRewardRaceData(true));
  }

  function normalizeCurrentRow(row) {
    return {
      fetched_at: row.fetched_at,
      rank: finiteNumber(row.rank),
      clan_name: cleanClanName(row.clan_name || row.clan || row.name || row.tag),
      points: finiteNumber(row.points ?? row.total_points),
      icon_url: row.icon_url || null
    };
  }

  function normalizeHistoryRow(row) {
    return {
      fetched_at: row.fetched_at,
      rank: finiteNumber(row.rank),
      clan_name: cleanClanName(row.clan_name || row.clan || row.name || row.tag),
      points: finiteNumber(row.points ?? row.total_points),
      icon_url: row.icon_url || null
    };
  }

  async function loadRewardRaceData(force = false) {
    if (!isClansPage()) return;

    ensurePanel();

    if (currentData && historyData && !force) {
      drawRewardRaceChart();
      return;
    }

    const summary = document.getElementById("reward-race-summary");
    if (summary) summary.textContent = "Loading reward threshold chart...";

    try {
      currentData = await fetchJson(CLANS_API_CURRENT_URL);
      const battle = currentData?.battle || "current";
      const historyUrl = `${CLANS_API_HISTORY_URL}?battle=${encodeURIComponent(battle)}&hours=336&limit=50000`;
      historyData = await fetchJson(historyUrl).catch(() => ({ rows: [] }));
      drawRewardRaceChart();
    } catch (err) {
      console.warn("Reward race chart failed", err);
      if (summary) summary.textContent = `Could not load reward threshold chart. ${err.message || err}`;
    }
  }

  function currentRowsInRange() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    return (currentData?.rows || [])
      .map(normalizeCurrentRow)
      .filter(row => row.clan_name && row.rank !== null && row.rank >= range.min && row.rank <= range.max)
      .sort((a, b) => a.rank - b.rank);
  }

  function groupedHistoryFor(clanName) {
    const key = normalize(clanName);
    const rows = (historyData?.rows || [])
      .map(normalizeHistoryRow)
      .filter(row => normalize(row.clan_name) === key && row.points !== null && row.fetched_at)
      .sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));

    const current = (currentData?.rows || []).map(normalizeCurrentRow).find(row => normalize(row.clan_name) === key);
    if (current?.fetched_at && current.points !== null && !rows.some(row => row.fetched_at === current.fetched_at)) {
      rows.push(current);
      rows.sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));
    }

    return rows;
  }

  function findWindowBase(rows, index, hours) {
    const target = new Date(rows[index].fetched_at).getTime() - hours * 60 * 60 * 1000;
    if (!Number.isFinite(target)) return null;

    let best = null;
    for (let i = index - 1; i >= 0; i -= 1) {
      const ms = new Date(rows[i].fetched_at).getTime();
      if (!Number.isFinite(ms)) continue;
      if (ms <= target) {
        best = rows[i];
        break;
      }
    }

    if (best) return best;

    // Fallback to the oldest available prior point. This keeps the early chart usable
    // when the requested 12h/24h window is not fully available in the API response.
    return rows[0] && index > 0 ? rows[0] : null;
  }

  function metricValue(rows, index, metricKey) {
    const metric = METRICS[metricKey] || METRICS.projected_12h;
    const row = rows[index];
    const points = finiteNumber(row.points);
    if (points === null) return null;

    if (metric.mode === "points") return points;

    const base = findWindowBase(rows, index, metric.hours);
    if (!base || finiteNumber(base.points) === null) return null;

    const gain = points - finiteNumber(base.points);

    if (metric.mode === "gain") return gain;

    if (metric.mode === "projected") {
      const endMs = new Date(currentData?.battle_end_iso || "").getTime();
      const rowMs = new Date(row.fetched_at).getTime();
      if (!Number.isFinite(endMs) || !Number.isFinite(rowMs)) return points;

      const actualHours = Math.max(0.01, (rowMs - new Date(base.fetched_at).getTime()) / (60 * 60 * 1000));
      const ratePerHour = gain / actualHours;
      const remainingHours = Math.max(0, (endMs - rowMs) / (60 * 60 * 1000));
      return Math.round(points + ratePerHour * remainingHours);
    }

    return points;
  }

  function buildSeries() {
    const selectedRows = currentRowsInRange();
    return selectedRows.map((currentRow, index) => {
      const historyRows = groupedHistoryFor(currentRow.clan_name);
      const points = historyRows.map((row, pointIndex) => {
        const t = new Date(row.fetched_at).getTime();
        const value = metricValue(historyRows, pointIndex, selectedMetric);
        return {
          t,
          rawT: row.fetched_at,
          value,
          points: row.points,
          rank: row.rank
        };
      }).filter(point => Number.isFinite(point.t) && point.value !== null && Number.isFinite(point.value));

      return {
        clan_name: currentRow.clan_name,
        rank: currentRow.rank,
        color: clanColor(currentRow.clan_name, index),
        points
      };
    }).filter(series => series.points.length >= 2);
  }

  function drawLine(ctx, points, x, y, color, width = 2) {
    if (!points.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(x(point), y(point));
      else ctx.lineTo(x(point), y(point));
    });
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(last), y(last), width > 1.5 ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRewardRaceChart() {
    const panel = ensurePanel();
    if (!panel || !currentData) return;

    const canvas = document.getElementById("reward-race-chart");
    const tooltip = document.getElementById("reward-race-tooltip");
    const summary = document.getElementById("reward-race-summary");
    const legend = document.getElementById("reward-race-legend");
    if (!canvas || !tooltip) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const seriesList = buildSeries();
    const metric = METRICS[selectedMetric] || METRICS.projected_12h;
    const range = RANGES[selectedRange] || RANGES["1-4"];

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!seriesList.length) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText("Not enough historical points are available for this range yet.", 16, 28);
      if (summary) summary.textContent = `${range.label}: not enough historical data for ${metric.shortLabel}.`;
      if (legend) legend.innerHTML = "";
      canvas._rewardRaceChart = null;
      return;
    }

    const allPoints = seriesList.flatMap(series => series.points);
    const minT = Math.min(...allPoints.map(point => point.t));
    const maxT = Math.max(...allPoints.map(point => point.t));
    const minY = Math.min(...allPoints.map(point => point.value));
    const maxY = Math.max(...allPoints.map(point => point.value));

    const padLeft = 66;
    const padRight = range.max - range.min > 12 ? 24 : 92;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;

    function x(point) {
      if (maxT === minT) return padLeft;
      return padLeft + ((point.t - minT) / (maxT - minT)) * width;
    }

    function y(point) {
      if (maxY === minY) return padTop + height / 2;
      return padTop + (1 - ((point.value - minY) / (maxY - minY))) * height;
    }

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
      const isCrowded = range.max - range.min > 12;
      drawLine(ctx, series.points, x, y, series.color, isCrowded ? 1.35 : 2.1);
    });

    const shouldLabelEnds = range.max - range.min <= 12;
    if (shouldLabelEnds) {
      ctx.save();
      ctx.font = "12px Arial";
      seriesList.forEach(series => {
        const last = series.points[series.points.length - 1];
        const yy = y(last);
        ctx.fillStyle = series.color;
        ctx.fillText(series.clan_name, x(last) + 7, Math.max(padTop + 10, Math.min(rect.height - padBottom - 3, yy + 4)));
      });
      ctx.restore();
    }

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);
    ctx.fillStyle = "#8b949e";
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), padLeft, rect.height - 12);
    const lastLabel = lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const lastWidth = ctx.measureText(lastLabel).width;
    ctx.fillText(lastLabel, rect.width - padRight - lastWidth, rect.height - 12);

    const latestOrder = seriesList
      .map(series => ({ ...series, latest: series.points[series.points.length - 1] }))
      .sort((a, b) => b.latest.value - a.latest.value);

    if (summary) {
      const leader = latestOrder[0];
      const second = latestOrder[1];
      const gapText = leader && second ? ` Gap to #2 in this band: ${fmtShort(leader.latest.value - second.latest.value)}.` : "";
      const coverageStart = fmtDateTime(new Date(minT).toISOString());
      summary.textContent = `${range.label} · ${metric.shortLabel}: ${leader?.clan_name || "—"} currently leads this selected view at ${fmtShort(leader?.latest?.value)}.${gapText} Chart coverage starts ${coverageStart}.`;
    }

    if (legend) {
      const maxLegend = range.max - range.min > 12 ? 18 : 40;
      legend.innerHTML = latestOrder.slice(0, maxLegend).map(series => `
        <span class="reward-race-legend-item" style="color:${series.color}">${series.clan_name}</span>
      `).join("") + (latestOrder.length > maxLegend ? `<span>+${latestOrder.length - maxLegend} more</span>` : "");
    }

    canvas._rewardRaceChart = { seriesList, x, y, padTop, padBottom, rect, metric, range };
    bindTooltip(canvas, tooltip);
  }

  function bindTooltip(canvas, tooltip) {
    if (chartBound) return;
    chartBound = true;

    function hideTooltip() {
      tooltip.style.display = "none";
    }

    function showTooltip(ev) {
      const chart = canvas._rewardRaceChart;
      if (!chart) return;

      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      let nearest = null;
      let nearestSeries = null;
      let nearestDist = Infinity;

      for (const series of chart.seriesList) {
        for (const point of series.points) {
          const dist = Math.abs(chart.x(point) - mx);
          if (dist < nearestDist) {
            nearest = point;
            nearestSeries = series;
            nearestDist = dist;
          }
        }
      }

      if (!nearest || !nearestSeries) return;

      drawRewardRaceChart();
      const fresh = canvas._rewardRaceChart;
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
        <strong style="color:${nearestSeries.color}">${nearestSeries.clan_name}</strong>
        <div>${fresh.metric.shortLabel}: ${fmtShort(nearest.value)}</div>
        <div>Points: ${fmtShort(nearest.points)}</div>
        <div>Rank: ${nearest.rank === null ? "—" : `#${nearest.rank}`}</div>
        <div>${fmtDateTime(nearest.rawT)}</div>
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

    canvas.addEventListener("mousemove", showTooltip);
    canvas.addEventListener("mouseleave", hideTooltip);
    canvas.addEventListener("touchstart", ev => ev.touches?.[0] && showTooltip(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchmove", ev => ev.touches?.[0] && showTooltip(ev.touches[0]), { passive: true });
    canvas.addEventListener("touchend", hideTooltip);
  }

  function scheduleInitialLoad() {
    if (!isClansPage()) return;
    ensurePanel();
    loadRewardRaceData(false);

    // The existing leaderboard refreshes itself. Re-draw shortly after it has likely
    // finished so this chart appears above it without waiting for a manual refresh.
    [500, 1500, 3500].forEach(delay => window.setTimeout(() => loadRewardRaceData(false), delay));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInitialLoad);
  } else {
    scheduleInitialLoad();
  }

  window.addEventListener("pageshow", scheduleInitialLoad);
  window.addEventListener("resize", () => {
    window.clearTimeout(drawTimer);
    drawTimer = window.setTimeout(drawRewardRaceChart, 120);
  });

  const observer = new MutationObserver(() => {
    if (!isClansPage()) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      ensurePanel();
      drawRewardRaceChart();
    }, 200);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
