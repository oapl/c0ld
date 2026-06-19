(() => {
  const CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  const HISTORY_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

  const RANGES = {
    "1-4": { label: "Ranks 1–4", min: 1, max: 4, cutoffRank: 3, challengerRank: 4 },
    "5-11": { label: "Ranks 5–11", min: 5, max: 11, cutoffRank: 10, challengerRank: 11 },
    "12-51": { label: "Ranks 12–51", min: 12, max: 51, cutoffRank: 50, challengerRank: 51 }
  };

  const WINDOWS = {
    "1h": { label: "1 Hour — 5m avg gains", short: "1Hr", hours: 1, bucketMinutes: 5, gainKey: "gain_1h" },
    "12h": { label: "12 Hours — 30m avg gains", short: "12Hr", hours: 12, bucketMinutes: 30, gainKey: "gain_12h" },
    "24h": { label: "24 Hours — hourly avg gains", short: "24Hr", hours: 24, bucketMinutes: 60, gainKey: "gain_24h" }
  };

  const SPECIAL_COLORS = { c0ld: "#ff9b96", wmsy: "#74d99f", nong: "#f6ad55" };
  const DEFAULT_COLORS = [
    "#58a6ff", "#d2a8ff", "#79c0ff", "#ffa657", "#a5d6ff",
    "#ff7b72", "#3fb950", "#f2cc60", "#db61a2", "#56d4dd",
    "#c9d1d9", "#7ee787", "#ffdf5d", "#bc8cff", "#f778ba",
    "#91d7e3", "#f0a6ca", "#b5cea8", "#d7ba7d", "#9cdcfe"
  ];

  let currentData = null;
  let historyData = null;
  let historyKey = "";
  let selectedRange = "1-4";
  let selectedWindow = "12h";
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

  function fmtDuration(hours) {
    if (!Number.isFinite(hours) || hours < 0) return "—";

    const totalMinutes = Math.max(1, Math.round(hours * 60));
    const days = Math.floor(totalMinutes / 1440);
    const rem = totalMinutes % 1440;
    const hrs = Math.floor(rem / 60);
    const mins = rem % 60;
    const parts = [];

    if (days) parts.push(`${days}d`);
    if (hrs) parts.push(`${hrs}h`);
    if (mins || !parts.length) parts.push(`${mins}m`);

    return parts.join(" ");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clanColor(name, index = 0) {
    return SPECIAL_COLORS[normalize(name)] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  }

  function selectedBattleValue() {
    const select = document.getElementById("battle-select");
    const params = new URLSearchParams(window.location.search);
    return String(select?.value || params.get("battle") || "current").trim() || "current";
  }

  function withBattle(url, battle) {
    if (!battle || ["current", "auto"].includes(String(battle).toLowerCase())) return url;
    return `${url}${url.includes("?") ? "&" : "?"}battle=${encodeURIComponent(battle)}`;
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function ensureStyles() {
    if (document.getElementById("reward-threshold-chart-styles")) return;

    const style = document.createElement("style");
    style.id = "reward-threshold-chart-styles";
    style.textContent = `
      .reward-threshold-section { margin-bottom: 24px; }
      .reward-threshold-section .section-header { justify-content: stretch; }
      .reward-threshold-controls { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: center; width: 100%; }
      .reward-threshold-ranges, .reward-threshold-metrics { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .reward-range-btn { white-space: nowrap; }
      .reward-range-btn.active { border-color: var(--link); color: var(--link); background: rgba(88, 166, 255, 0.10); }
      body[data-clan="wmsy"] .reward-range-btn.active { border-color: rgba(72, 187, 120, 0.78) !important; color: #74d99f !important; background: rgba(72, 187, 120, 0.14) !important; }
      .reward-threshold-body { padding: 14px 16px 16px; }
      .reward-threshold-chart-shell { position: relative; }
      #reward-threshold-chart { width: 100%; height: 370px; display: block; border: 1px solid var(--border); border-radius: 8px; background: var(--panel-2); cursor: crosshair; }
      .reward-threshold-tooltip { position: absolute; z-index: 10; display: none; pointer-events: none; min-width: 300px; max-width: 560px; max-height: 440px; overflow: auto; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: #0b0f14; box-shadow: 0 8px 24px rgba(0,0,0,.35); color: var(--text); font-size: 13px; line-height: 1.45; }
      .reward-threshold-tooltip strong { display: block; margin-bottom: 5px; }
      .reward-threshold-tooltip .tooltip-row { white-space: nowrap; margin-top: 3px; }
      .reward-threshold-summary { margin-top: 10px; color: var(--muted); font-size: 13px; line-height: 1.45; }
      .reward-threshold-summary strong { color: var(--text); }
      .reward-threshold-legend { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-top: 10px; color: var(--muted); font-size: 12px; }
      .reward-threshold-legend-item { display: inline-flex; align-items: center; gap: 5px; }
      .reward-threshold-legend-item::before { content: ""; width: 11px; height: 3px; border-radius: 999px; background: currentColor; }
      @media (max-width: 700px) {
        #reward-threshold-chart { height: 310px; }
        .reward-threshold-controls, .reward-threshold-ranges, .reward-threshold-metrics, #reward-threshold-window { width: 100%; }
        #reward-threshold-window, #reward-threshold-refresh { min-width: 0; width: 100%; }
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
              <button type="button" class="reward-range-btn${key === selectedRange ? " active" : ""}" data-range="${key}">
                ${range.label}
              </button>
            `).join("")}
          </div>
          <div class="reward-threshold-metrics">
            <select id="reward-threshold-window" aria-label="Growth interval window">
              ${Object.entries(WINDOWS).map(([key, option]) => `
                <option value="${key}"${key === selectedWindow ? " selected" : ""}>${option.label}</option>
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
        panel.querySelectorAll(".reward-range-btn").forEach(item => {
          item.classList.toggle("active", item === button);
        });
        loadData(true);
      });
    });

    panel.querySelector("#reward-threshold-window")?.addEventListener("change", event => {
      selectedWindow = event.target.value || selectedWindow;
      loadData(true);
    });

    panel.querySelector("#reward-threshold-refresh")?.addEventListener("click", () => {
      loadData(true);
    });

    document.getElementById("battle-select")?.addEventListener("change", () => {
      loadData(true);
    });
  }

  function normalizeCurrentRow(row) {
    return {
      fetched_at: row.fetched_at || currentData?.snapshot_at || currentData?.generated_at,
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

  function currentRows() {
    return (currentData?.rows || [])
      .map(normalizeCurrentRow)
      .filter(row => row.clan_name && row.rank !== null && row.points !== null)
      .sort((a, b) => a.rank - b.rank);
  }

  function selectedRows() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    return currentRows().filter(row => row.rank >= range.min && row.rank <= range.max);
  }

  function boundaryPair() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    const rows = currentRows();

    return {
      range,
      holder: rows.find(row => row.rank === range.cutoffRank) || null,
      challenger: rows.find(row => row.rank === range.challengerRank) || null
    };
  }

  function historyForClan(clanName) {
    const key = normalize(clanName);
    const rows = (historyData?.rows || [])
      .map(normalizeHistoryRow)
      .filter(row => normalize(row.clan_name) === key && row.points !== null && row.fetched_at)
      .sort((a, b) => new Date(a.fetched_at) - new Date(b.fetched_at));

    const current = currentRows().find(row => normalize(row.clan_name) === key);

    if (current && current.fetched_at && !rows.some(row => row.fetched_at === current.fetched_at)) {
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

  function dedupePullRows(rows) {
    const byTime = new Map();

    for (const row of rows) {
      const ms = new Date(row.fetched_at || "").getTime();
      const points = finite(row.points);

      if (!Number.isFinite(ms) || points === null) continue;

      const existing = byTime.get(ms);
      if (!existing || points >= existing.points) {
        byTime.set(ms, { ...row, ms, points });
      }
    }

    return [...byTime.values()].sort((a, b) => a.ms - b.ms);
  }

  function latestTimestamp() {
    const times = selectedRows()
      .flatMap(row => historyForClan(row.clan_name))
      .map(row => new Date(row.fetched_at || "").getTime())
      .filter(Number.isFinite);

    return times.length ? Math.max(...times) : Date.now();
  }

  function fallbackStartPoint(clanRow, windowConfig, endMs) {
    const gainValue = finite(clanRow?.[windowConfig.gainKey]);
    const currentPoints = finite(clanRow.points);

    if (gainValue === null || currentPoints === null) return null;

    return {
      fetched_at: new Date(endMs - windowConfig.hours * 60 * 60 * 1000).toISOString(),
      rank: clanRow.rank,
      clan_name: clanRow.clan_name,
      points: Math.max(0, currentPoints - gainValue),
      synthetic: true
    };
  }

  function rowsForWindow(rows, clanRow, windowConfig, endMs) {
    const output = rows.slice();

    const startPoint = fallbackStartPoint(clanRow, windowConfig, endMs);
    if (startPoint) output.unshift(startPoint);

    if (finite(clanRow.points) !== null && clanRow.fetched_at) {
      output.push({
        fetched_at: clanRow.fetched_at,
        rank: clanRow.rank,
        clan_name: clanRow.clan_name,
        points: clanRow.points
      });
    }

    return dedupePullRows(output);
  }

  function buildAveragedPullPoints(rows, windowConfig, endMs, clanRow) {
    const cleanRows = rowsForWindow(rows, clanRow, windowConfig, endMs);
    const points = [];
    const bucketMs = windowConfig.bucketMinutes * 60 * 1000;

    for (let i = 1; i < cleanRows.length; i += 1) {
      const prev = cleanRows[i - 1];
      const curr = cleanRows[i];

      const gapMs = Math.max(1, curr.ms - prev.ms);
      const rawGain = Math.max(0, curr.points - prev.points);

      // This is the important part:
      // A missing 2-hour gap does NOT become one giant spike.
      // It is split into estimated average chunks based on the selected interval.
      const estimatedSteps = Math.max(1, Math.round(gapMs / bucketMs));
      const averagedGain = rawGain / estimatedSteps;

      for (let step = 1; step <= estimatedSteps; step += 1) {
        const pct = step / estimatedSteps;
        const estimatedMs = prev.ms + gapMs * pct;
        const estimatedTotal = prev.points + rawGain * pct;

        points.push({
          pullIndex: points.length,
          rawT: new Date(estimatedMs).toISOString(),
          previousT: new Date(prev.ms).toISOString(),
          pointsGained: averagedGain,
          rawPointsGained: averagedGain,
          totalPoints: estimatedTotal,
          rank: curr.rank ?? clanRow.rank,
          gapMinutes: gapMs / 60000,
          averagedSteps: estimatedSteps,
          estimated: estimatedSteps > 1
        });
      }
    }

    return points;
  }

  function buildSeries() {
    const range = RANGES[selectedRange] || RANGES["1-4"];
    const windowConfig = WINDOWS[selectedWindow] || WINDOWS["12h"];
    const endMs = latestTimestamp();

    return selectedRows().map((row, index) => {
      const points = buildAveragedPullPoints(
        historyForClan(row.clan_name),
        windowConfig,
        endMs,
        row
      );

      return {
        clan_name: row.clan_name,
        rank: row.rank,
        color: clanColor(row.clan_name, index),
        current: row,
        points,
        totalWindowGain: points.reduce((sum, point) => sum + (finite(point.rawPointsGained) || 0), 0),
        isCutoffPair: row.rank === range.cutoffRank || row.rank === range.challengerRank
      };
    }).filter(series => series.points.length >= 1);
  }

  async function loadData(force = false) {
    if (!isClansPage() || loading) return;

    ensurePanel();

    const range = RANGES[selectedRange] || RANGES["1-4"];
    const windowConfig = WINDOWS[selectedWindow] || WINDOWS["12h"];
    const selectedBattle = selectedBattleValue();
    const currentUrl = withBattle(CURRENT_URL, selectedBattle);
    const key = `${selectedRange}:${selectedWindow}:${selectedBattle}`;

    if (currentData && historyData && historyKey === key && !force) {
      draw();
      return;
    }

    loading = true;

    const summary = document.getElementById("reward-threshold-summary");
    if (summary) summary.textContent = "Loading cutoff risk...";

    try {
      currentData = await fetchJson(currentUrl);

      const battle = currentData?.battle || selectedBattle || "current";

      // Do NOT use the selected chart window as the query window.
      // We need enough history to survive deleted final-hour gaps.
      const historyHours = historyHoursForBattle();

      const historyUrl =
        `${HISTORY_URL}?battle=${encodeURIComponent(battle)}` +
        `&hours=${historyHours}` +
        `&rank_min=${range.min}` +
        `&rank_max=${range.max}` +
        `&bucket_minutes=${windowConfig.bucketMinutes}` +
        `&include_baseline=1` +
        `&limit=50000`;

      historyData = await fetchJson(historyUrl).catch(() => ({ rows: [] }));
      historyKey = key;
      draw();
    } catch (err) {
      console.warn("Cutoff risk chart failed", err);
      if (summary) summary.textContent = `Could not load cutoff risk chart. ${err.message || err}`;
    } finally {
      loading = false;
    }
  }

  function historyHoursForBattle() {
    const start = new Date(currentData?.battle_start_iso || "").getTime();
    const end =
      new Date(currentData?.snapshot_at || "").getTime() ||
      new Date(currentData?.generated_at || "").getTime() ||
      Date.now();

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      const hours = Math.ceil((end - start) / (60 * 60 * 1000)) + 6;
      return Math.max(24, Math.min(336, hours));
    }

    return 168;
  }

  function drawLine(ctx, points, x, y, color, options = {}) {
    if (!points.length) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = options.width || 2;
    ctx.globalAlpha = options.alpha ?? 0.86;
    ctx.beginPath();

    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(x(point), y(point));
      else ctx.lineTo(x(point), y(point));
    });

    ctx.stroke();

    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(x(point), y(point), options.radius || 2.8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.restore();
  }

  function cutoffSummary(seriesList, summary, holder, challenger, range, windowConfig) {
    if (!summary) return;

    const holderSeries = seriesList.find(series => series.rank === range.cutoffRank) || null;
    const challengerSeries = seriesList.find(series => series.rank === range.challengerRank) || null;

    if (!holder || !challenger || !holderSeries || !challengerSeries) {
      summary.textContent = `${range.label}: not enough data for the cutoff pair.`;
      return;
    }

    const pointsToGain = Math.max(0, holder.points - challenger.points + 1);
    const holderRate = holderSeries.totalWindowGain / windowConfig.hours;
    const challengerRate = challengerSeries.totalWindowGain / windowConfig.hours;
    const closeRate = challengerRate - holderRate;

    const endMs = new Date(currentData?.battle_end_iso || "").getTime();
    const nowMs = latestTimestamp();
    const remainingHours = Number.isFinite(endMs)
      ? Math.max(0, (endMs - nowMs) / (60 * 60 * 1000))
      : 0;

    const hoursToPass = closeRate > 0 ? pointsToGain / closeRate : Infinity;
    const projectedToPass = closeRate > 0 && remainingHours > 0 && hoursToPass <= remainingHours;
    const timeText = projectedToPass
      ? ` Time to pass: <strong>${escapeHtml(fmtDuration(hoursToPass))}</strong>.`
      : "";

    summary.innerHTML =
      `<strong>#${challenger.rank} ${escapeHtml(challenger.clan_name)}</strong> ` +
      `needs to gain <strong>${fmtShort(pointsToGain)}</strong> points to pass ` +
      `<strong>${escapeHtml(holder.clan_name)}</strong>. ` +
      `At the <strong>${windowConfig.short}</strong> rate, ` +
      `${escapeHtml(challenger.clan_name)} ` +
      `<strong>${projectedToPass ? "is" : "is not"} projected to pass</strong> ` +
      `${escapeHtml(holder.clan_name)}.${timeText}`;
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
    const windowConfig = WINDOWS[selectedWindow] || WINDOWS["12h"];

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!seriesList.length) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText("Not enough data-pull history is available for this range yet.", 16, 28);
      if (summary) summary.textContent = `${range.label}: not enough data-pull history for this window.`;
      if (legend) legend.innerHTML = "";
      canvas._rewardThresholdChart = null;
      return;
    }

    const allPoints = seriesList.flatMap(series => series.points);
    const minYRaw = Math.min(...allPoints.map(point => point.pointsGained));
    const maxYRaw = Math.max(...allPoints.map(point => point.pointsGained));
    const paddingY = Math.max((maxYRaw - minYRaw) * 0.10, 100_000);
    const minY = Math.max(0, minYRaw - paddingY);
    const maxY = maxYRaw + paddingY;

    const maxPulls = Math.max(...seriesList.map(series => series.points.length));
    const crowded = seriesList.length > 12;

    const padLeft = 66;
    const padRight = crowded ? 26 : 116;
    const padTop = 18;
    const padBottom = 34;
    const width = rect.width - padLeft - padRight;
    const height = rect.height - padTop - padBottom;

    const x = point =>
      maxPulls <= 1
        ? padLeft
        : padLeft + (point.pullIndex / (maxPulls - 1)) * width;

    const y = point =>
      maxY === minY
        ? padTop + height / 2
        : padTop + (1 - ((point.pointsGained - minY) / (maxY - minY))) * height;

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

    [...seriesList]
      .sort((a, b) => Number(a.isCutoffPair) - Number(b.isCutoffPair))
      .forEach(series => {
        drawLine(ctx, series.points, x, y, series.color, {
          width: series.isCutoffPair ? 2.7 : (crowded ? 1.1 : 1.8),
          alpha: series.isCutoffPair ? 0.96 : (crowded ? 0.50 : 0.74),
          radius: series.isCutoffPair ? 3.4 : 2.4
        });
      });

    if (!crowded) {
      ctx.save();
      ctx.font = "12px Arial";

      seriesList.forEach(series => {
        const last = series.points[series.points.length - 1];
        ctx.fillStyle = series.color;
        ctx.fillText(
          `#${series.rank} ${series.clan_name}`,
          x(last) + 7,
          Math.max(padTop + 10, Math.min(rect.height - padBottom - 3, y(last) + 4))
        );
      });

      ctx.restore();
    }

    ctx.fillStyle = "#8b949e";
    ctx.fillText("Data pulls + averaged gaps", padLeft, rect.height - 12);

    const lastLabel = `${maxPulls} plotted intervals`;
    ctx.fillText(
      lastLabel,
      rect.width - padRight - ctx.measureText(lastLabel).width,
      rect.height - 12
    );

    cutoffSummary(seriesList, summary, holder, challenger, range, windowConfig);

    if (legend) {
      const cutoffItems = seriesList.filter(series => series.isCutoffPair);
      const otherItems = seriesList.filter(series => !series.isCutoffPair);
      const legendItems = [...cutoffItems, ...otherItems];

      legend.innerHTML =
        legendItems.map(series =>
          `<span class="reward-threshold-legend-item" style="color:${series.color}">#${series.rank} ${escapeHtml(series.clan_name)}</span>`
        ).join("") +
        `<span>${maxPulls} plotted intervals · gaps averaged to ${windowConfig.bucketMinutes}m</span>`;
    }

    canvas._rewardThresholdChart = {
      seriesList,
      x,
      y,
      padTop,
      padBottom,
      rect,
      windowConfig,
      maxPulls
    };

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

      let nearestPoint = null;
      let nearestDist = Infinity;

      for (const series of chart.seriesList) {
        for (const point of series.points) {
          const dist = Math.abs(chart.x(point) - mx);
          if (dist < nearestDist) {
            nearestPoint = point;
            nearestDist = dist;
          }
        }
      }

      if (!nearestPoint) return;

      draw();

      const fresh = canvas._rewardThresholdChart;
      const ctx = canvas.getContext("2d");
      const px = fresh.x(nearestPoint);

      ctx.save();
      ctx.strokeStyle = "rgba(139, 148, 158, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, fresh.padTop);
      ctx.lineTo(px, fresh.rect.height - fresh.padBottom);
      ctx.stroke();
      ctx.restore();

      const samePullRows = fresh.seriesList
        .map(series => ({
          series,
          point: series.points.find(point => point.pullIndex === nearestPoint.pullIndex)
        }))
        .filter(item => item.point)
        .sort((a, b) => a.series.rank - b.series.rank);

      tooltip.innerHTML =
        `<strong>${escapeHtml(fmtDateTime(nearestPoint.rawT))}</strong>` +
        samePullRows.map(({ series, point }) => {
          const note = point.estimated
            ? ` avg over ${Math.round(point.gapMinutes)}m gap`
            : "";

          return `<div class="tooltip-row" style="color:${series.color}">` +
            `${escapeHtml(series.clan_name)} Total Points: ${fmtShort(point.totalPoints)} / ` +
            `Points Gained: ${fmtShort(point.pointsGained)}${note}` +
            `</div>`;
        }).join("");

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

    [750, 1800, 3600].forEach(delay => {
      window.setTimeout(() => loadData(false), delay);
    });
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
