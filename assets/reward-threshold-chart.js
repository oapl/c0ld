(() => {
  const CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  const HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

  const RANGES = {
    "1-4": { label: "Ranks 1–4", min: 1, max: 4, note: "Top 1 / Top 3 cutoff view" },
    "5-11": { label: "Ranks 5–11", min: 5, max: 11, note: "Top 10 cutoff view" },
    "12-51": { label: "Ranks 12–51", min: 12, max: 51, note: "Top 50 cutoff view" }
  };

  const METRICS = {
    projected_12h: { label: "Projected Finish — 12h pace", short: "Projected 12h", mode: "projected", hours: 12 },
    projected_1h: { label: "Projected Finish — 1h pace", short: "Projected 1h", mode: "projected", hours: 1 },
    projected_24h: { label: "Projected Finish — 24h pace", short: "Projected 24h", mode: "projected", hours: 24 },
    gain_1h: { label: "1h Growth", short: "1h Growth", mode: "gain", hours: 1 },
    gain_12h: { label: "12h Growth", short: "12h Growth", mode: "gain", hours: 12 },
    gain_24h: { label: "24h Growth", short: "24h Growth", mode: "gain", hours: 24 },
    points: { label: "Current Points", short: "Points", mode: "points", hours: 0 }
  };

  const SPECIAL_COLORS = { c0ld: "#ff9b96", wmsy: "#74d99f", nong: "#f6ad55" };
  const PALETTE = ["#58a6ff", "#d2a8ff", "#79c0ff", "#ffa657", "#a5d6ff", "#ff7b72", "#3fb950", "#f2cc60", "#db61a2", "#56d4dd", "#c9d1d9", "#7ee787", "#ffdf5d", "#bc8cff", "#f778ba"];

  let currentData = null;
  let historyData = null;
  let selectedRange = "1-4";
  let selectedMetric = "projected_12h";
  let chartBound = false;
  let loading = false;
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
    const tiers = [{ value: 1e12, suffix: "T" }, { value: 1e9, suffix: "B" }, { value: 1e6, suffix: "M" }, { value: 1e3, suffix: "K" }];
    for (const tier of tiers) {
      if (Math.abs(n) >= tier.value) return (n / tier.value).toFixed(2).replace(/\.?0+$/, "") + tier.suffix;
    }
    return n.toLocaleString("en-US");
  }

  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function colorFor(name, index) {
    return SPECIAL_COLORS[normalize(name)] || PALETTE[index % PALETTE.length];
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
      .reward-threshold-section { margin-bottom: 24px; }
      .reward-threshold-head { display:flex; flex-direction:column; gap:4px; }
      .reward-threshold-subtitle { color: var(--muted); font-size: 13px; line-height: 1.35; }
      .reward-threshold-controls { display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; align-items:center; width:100%; }
      .reward-threshold-ranges, .reward-threshold-metrics { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
      .reward-range-btn { white-space:nowrap; }
      .reward-range-btn.active { border-color:var(--link); color:var(--link); background:rgba(88,166,255,0.10); }
      body[data-clan="wmsy"] .reward-range-btn.active { border-color:rgba(72,187,120,0.78)!important; color:#74d99f!important; background:rgba(72,187,120,0.14)!important; }
      .reward-threshold-body { padding:14px 16px 16px; }
      .reward-threshold-chart-shell { position:relative; }
      #reward-threshold-chart { width:100%; height:360px; display:block; border:1px solid var(--border); border-radius:8px; background:var(--panel-2); cursor:crosshair; }
      .reward-threshold-tooltip { position:absolute; z-index:10; display:none; pointer-events:none; min-width:240px; max-width:340px; padding:10px 12px; border:1px solid var(--border); border-radius:8px; background:#0b0f14; box-shadow:0 8px 24px rgba(0,0,0,.35); color:var(--text); font-size:13px; line-height:1.45; }
      .reward-threshold-tooltip strong { display:block; margin-bottom:4px; }
      .reward-threshold-summary { margin-top:10px; color:var(--muted); font-size:13px; line-height:1.45; }
      .reward-threshold-legend { display:flex; flex-wrap:wrap; gap:8px 12px; margin-top:10px; color:var(--muted); font-size:12px; }
      .reward-threshold-legend-item { display:inline-flex; align-items:center; gap:5px; }
      .reward-threshold-legend-item::before { content:""; width:11px; height:3px; border-radius:999px; background:currentColor; }
      @media (max-width:700px) { #reward-threshold-chart { height:280px; } .reward-threshold-controls, .reward-threshold-ranges, .reward-threshold-metrics, #reward-threshold-metric { width:100%; } #reward-threshold-metric, #reward-threshold-refresh { min-width:0; width:100%; } }
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
        <div class="reward-threshold-head">
          <h2 class="section-title">Reward Threshold Pace</h2>
          <div class="reward-threshold-subtitle">Compare movement around reward cutoffs. The Top 500 gift tier is excluded because it is not useful for race analysis.</div>
        </div>
        <div class="reward-threshold-controls">
          <div class="reward-threshold-ranges">
            ${Object.entries(RANGES).map(([key, range]) => `<button type="button" class="reward-range-btn${key === selectedRange ? " active" : ""}" data-range="${key}" title="${range.note}">${range.label}</button>`).join("")}
          </div>
          <div class="reward-threshold-metrics">
            <select id="reward-threshold-metric" aria-label="Reward threshold metric">
              ${Object.entries(METRICS).map(([key, metric]) => `<option value="${key}"${key === selectedMetric ? " selected" : ""}>${metric.label}</option>`).join("")}
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
        <div class="reward-threshold-summary" id="reward-threshold-summary">Loading reward threshold chart...</div>
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
    panel.querySelector("#reward-threshold-metric")?.addEventListener("change", event => {
      selectedMetric = event.target.value || selectedMetric;
      draw();
    });
    panel.querySelector("#reward-threshold-refresh")?.addEventListener("click", () => loadData(true));
  }

  function normalizeCurrentRow(row) {
    return {
      fetched_at: row.fetched_at,
      rank: finite(row.rank),
      clan_name: cleanClanName(row.clan_name || row.clan || row.name || row.tag),
      points: finite(row.points ?? row.total_points)
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
    if (summary) summary.textContent = "Loading reward threshold chart...";

    try {
      currentData = await fetchJson(CURRENT_URL);
      const battle = currentData?.battle || "current";
      historyData = await fetchJson(`${HISTORY_URL}?battle=${encodeURIComponent(battle)}&hours=336&limit=50000`).catch(() => ({ rows: [] }));
      draw();
    } catch (err) {
      console.warn("Reward threshold chart failed", err);
      if (summary) summary.textContent = `Could not load reward threshold chart. ${err.message || err}`;
    } finally {
      loading = false;
    }
  }

  function rowsInRange() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    return (currentData?.rows || [])
      .map(normalizeCurrentRow)
      .filter(row => row.clan_name && row.rank !== null && row.rank >= range.min && row.rank <= range.max)
      .sort((a, b) => a.rank - b.rank);
  }

  function historyForClan(clanName) {
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

  function findBase(rows, index, hours) {
    const target = new Date(rows[index].fetched_at).getTime() - hours * 60 * 60 * 1000;
    if (!Number.isFinite(target)) return null;
    for (let i = index - 1; i >= 0; i -= 1) {
      const ms = new Date(rows[i].fetched_at).getTime();
      if (Number.isFinite(ms) && ms <= target) return rows[i];
    }
    return rows[0] && index > 0 ? rows[0] : null;
  }

  function valueFor(rows, index, metricKey) {
    const metric = METRICS[metricKey] || METRICS.projected_12h;
    const row = rows[index];
    const points = finite(row.points);
    if (points === null) return null;
    if (metric.mode === "points") return points;
    const base = findBase(rows, index, metric.hours);
    if (!base || finite(base.points) === null) return null;
    const gain = points - finite(base.points);
    if (metric.mode === "gain") return gain;

    const endMs = new Date(currentData?.battle_end_iso || "").getTime();
    const rowMs = new Date(row.fetched_at).getTime();
    const baseMs = new Date(base.fetched_at).getTime();
    if (!Number.isFinite(endMs) || !Number.isFinite(rowMs) || !Number.isFinite(baseMs)) return points;
    const actualHours = Math.max(0.01, (rowMs - baseMs) / (60 * 60 * 1000));
    const remainingHours = Math.max(0, (endMs - rowMs) / (60 * 60 * 1000));
    return Math.round(points + (gain / actualHours) * remainingHours);
  }

  function buildSeries() {
    return rowsInRange().map((row, index) => {
      const rows = historyForClan(row.clan_name);
      const points = rows.map((historyRow, pointIndex) => {
        const t = new Date(historyRow.fetched_at).getTime();
        const value = valueFor(rows, pointIndex, selectedMetric);
        return { t, rawT: historyRow.fetched_at, value, points: historyRow.points, rank: historyRow.rank };
      }).filter(point => Number.isFinite(point.t) && point.value !== null && Number.isFinite(point.value));
      return { clan_name: row.clan_name, rank: row.rank, color: colorFor(row.clan_name, index), points };
    }).filter(series => series.points.length >= 2);
  }

  function drawLine(ctx, points, x, y, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    points.forEach((point, index) => index === 0 ? ctx.moveTo(x(point), y(point)) : ctx.lineTo(x(point), y(point)));
    ctx.stroke();
    const last = points[points.length - 1];
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(last), y(last), width > 1.5 ? 3.5 : 2.5, 0, Math.PI * 2);
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
      if (summary) summary.textContent = `${range.label}: not enough historical data for ${metric.short}.`;
      if (legend) legend.innerHTML = "";
      canvas._rewardThresholdChart = null;
      return;
    }

    const allPoints = seriesList.flatMap(series => series.points);
    const minT = Math.min(...allPoints.map(point => point.t));
    const maxT = Math.max(...allPoints.map(point => point.t));
    const minY = Math.min(...allPoints.map(point => point.value));
    const maxY = Math.max(...allPoints.map(point => point.value));
    const crowded = range.max - range.min > 12;
    const padLeft = 66;
    const padRight = crowded ? 24 : 92;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;

    const x = point => maxT === minT ? padLeft : padLeft + ((point.t - minT) / (maxT - minT)) * width;
    const y = point => maxY === minY ? padTop + height / 2 : padTop + (1 - ((point.value - minY) / (maxY - minY))) * height;

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

    seriesList.forEach(series => drawLine(ctx, series.points, x, y, series.color, crowded ? 1.35 : 2.1));

    if (!crowded) {
      ctx.save();
      ctx.font = "12px Arial";
      seriesList.forEach(series => {
        const last = series.points[series.points.length - 1];
        ctx.fillStyle = series.color;
        ctx.fillText(series.clan_name, x(last) + 7, Math.max(padTop + 10, Math.min(rect.height - padBottom - 3, y(last) + 4)));
      });
      ctx.restore();
    }

    const firstDate = new Date(minT);
    const lastDate = new Date(maxT);
    ctx.fillStyle = "#8b949e";
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }), padLeft, rect.height - 12);
    const lastLabel = lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    ctx.fillText(lastLabel, rect.width - padRight - ctx.measureText(lastLabel).width, rect.height - 12);

    const latestOrder = seriesList
      .map(series => ({ ...series, latest: series.points[series.points.length - 1] }))
      .sort((a, b) => b.latest.value - a.latest.value);

    if (summary) {
      const leader = latestOrder[0];
      const second = latestOrder[1];
      const gapText = leader && second ? ` Gap to #2 in this band: ${fmtShort(leader.latest.value - second.latest.value)}.` : "";
      summary.textContent = `${range.label} · ${metric.short}: ${leader?.clan_name || "—"} leads this selected view at ${fmtShort(leader?.latest?.value)}.${gapText} Coverage starts ${fmtDateTime(new Date(minT).toISOString())}.`;
    }

    if (legend) {
      const maxLegend = crowded ? 18 : 40;
      legend.innerHTML = latestOrder.slice(0, maxLegend).map(series => `<span class="reward-threshold-legend-item" style="color:${series.color}">${series.clan_name}</span>`).join("") + (latestOrder.length > maxLegend ? `<span>+${latestOrder.length - maxLegend} more</span>` : "");
    }

    canvas._rewardThresholdChart = { seriesList, x, y, padTop, padBottom, rect, metric };
    bindTooltip(canvas, tooltip);
  }

  function bindTooltip(canvas, tooltip) {
    if (chartBound) return;
    chartBound = true;

    function hide() { tooltip.style.display = "none"; }

    function move(ev) {
      const chart = canvas._rewardThresholdChart;
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

      tooltip.innerHTML = `<strong style="color:${nearestSeries.color}">${nearestSeries.clan_name}</strong><div>${fresh.metric.short}: ${fmtShort(nearest.value)}</div><div>Points: ${fmtShort(nearest.points)}</div><div>Rank: ${nearest.rank === null ? "—" : `#${nearest.rank}`}</div><div>${fmtDateTime(nearest.rawT)}</div>`;
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.addEventListener("pageshow", init);
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(draw, 120);
  });
})();
