(() => {
  "use strict";

  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const HISTORY_BUCKET_MS = 15 * 60 * 1000;
  const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
  const SERIES_COLORS = ["#ff8b86", "#58a6ff", "#7ee787", "#f2cc60", "#bc8cff", "#79c0ff"];
  const params = new URLSearchParams(location.search);
  const runKey = String(params.get("run") || "").trim();
  const panels = new Map();
  let requestVersion = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function shortNumber(value) {
    const number = numberOrNull(value);
    if (number === null) return "—";
    const absolute = Math.abs(number);
    if (absolute >= 1e12) return `${(number / 1e12).toFixed(2).replace(/\.00$/, "")}T`;
    if (absolute >= 1e9) return `${(number / 1e9).toFixed(2).replace(/\.00$/, "")}B`;
    if (absolute >= 1e6) return `${(number / 1e6).toFixed(2).replace(/\.00$/, "")}M`;
    if (absolute >= 1e3) return `${(number / 1e3).toFixed(2).replace(/\.00$/, "")}K`;
    return number.toLocaleString("en-US");
  }

  function signedNumber(value) {
    const number = numberOrNull(value);
    if (number === null) return "—";
    return `${number > 0 ? "+" : ""}${shortNumber(number)}`;
  }

  function deltaHtml(value) {
    const number = numberOrNull(value);
    if (number === null) return '<span class="unknown">—</span>';
    if (number > 0) return `<span class="positive">+${escapeHtml(shortNumber(number))}</span>`;
    if (number < 0) return `<span class="negative">${escapeHtml(shortNumber(number))}</span>`;
    return '<span class="zero">0</span>';
  }

  function fallbackName(value, userId) {
    const text = String(value || "").trim();
    const id = String(userId || "").trim();
    return !text || (id && text === id) || /^user[ _-]?\d+$/i.test(text);
  }

  function memberName(row) {
    const id = String(row?.user_id || "").trim();
    for (const value of [row?.username, row?.display_name]) {
      if (!fallbackName(value, id)) return String(value).trim();
    }
    return id ? `User ${id}` : "Unknown player";
  }

  function initials(value) {
    return String(value || "?").trim().slice(0, 2).toUpperCase();
  }

  function iconUrl(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;
    const asset = text.match(/rbxassetid:\/\/(\d+)/i);
    if (asset) return `https://ps99.biggamesapi.io/image/${encodeURIComponent(asset[1])}`;
    if (/^\d+$/.test(text)) return `https://ps99.biggamesapi.io/image/${encodeURIComponent(text)}`;
    return "";
  }

  function avatarHtml(row) {
    const name = memberName(row);
    const url = String(row?.avatar_url || "").trim();
    if (url) return `<img class="avatar" src="${escapeHtml(url)}" alt="">`;
    return `<span class="avatar">${escapeHtml(initials(name))}</span>`;
  }

  function withQuery(url) {
    if (runKey) url.searchParams.set("run", runKey);
    url.searchParams.set("v", String(Date.now()));
    return url;
  }

  async function getJson(url) {
    const response = await fetch(withQuery(url), { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  }

  async function fetchLeague(name) {
    const currentUrl = new URL(`${API}/api/leagues/current`);
    currentUrl.searchParams.set("league", name);
    const historyUrl = new URL(`${API}/api/leagues/history`);
    historyUrl.searchParams.set("league", name);
    historyUrl.searchParams.set("hours", "24");
    historyUrl.searchParams.set("limit", "50000");
    const [current, history] = await Promise.all([getJson(currentUrl), getJson(historyUrl)]);
    let historyRows = Array.isArray(history.rows) ? history.rows : [];
    const currentRows = Array.isArray(current.rows) ? current.rows : [];
    const snapshotTime = new Date(current.snapshot_at || 0).getTime();
    const snapshotAge = Date.now() - snapshotTime;
    if (!historyRows.length && currentRows.length && Number.isFinite(snapshotTime) && snapshotTime > 0 && snapshotAge > HISTORY_WINDOW_MS) {
      const archiveUrl = new URL(`${API}/api/leagues/history`);
      archiveUrl.searchParams.set("league", name);
      archiveUrl.searchParams.set("hours", "all");
      archiveUrl.searchParams.set("limit", "50000");
      const archive = await getJson(archiveUrl);
      historyRows = Array.isArray(archive.rows) ? archive.rows : [];
    }
    return { current, historyRows };
  }

  function panelFor(side) {
    if (panels.has(side)) return panels.get(side);
    const root = document.querySelector(`[data-side="${side}"]`);
    const panel = {
      root,
      title: root.querySelector('[data-role="title"]'),
      summary: root.querySelector('[data-role="summary"]'),
      icon: root.querySelector('[data-role="icon"]'),
      profile: root.querySelector('[data-role="profile"]'),
      body: root.querySelector('[data-role="body"]'),
      chart: null
    };
    panels.set(side, panel);
    return panel;
  }

  function setPanelState(side, name, state, message) {
    const panel = panelFor(side);
    panel.title.textContent = name || (side === "left" ? "Left League" : "Right League");
    panel.summary.textContent = state === "loading" ? "Loading current roster and history..." : "";
    panel.icon.hidden = true;
    panel.icon.removeAttribute("src");
    panel.profile.hidden = true;
    panel.body.innerHTML = `<div class="compare-${state}">${escapeHtml(message)}</div>`;
    panel.chart = null;
  }

  function growthSeries(rows, historyRows) {
    const historyTimes = historyRows
      .map(row => new Date(row.fetched_at || row.snapshot_at || 0).getTime())
      .filter(Number.isFinite);
    const currentTimes = rows
      .map(row => new Date(row.fetched_at || row.snapshot_at || 0).getTime())
      .filter(Number.isFinite);
    const observedTimes = [...historyTimes, ...currentTimes];
    const latest = observedTimes.length ? Math.max(...observedTimes) : Date.now() - HISTORY_BUCKET_MS;
    const end = Math.ceil(latest / HISTORY_BUCKET_MS) * HISTORY_BUCKET_MS;
    const start = end - HISTORY_WINDOW_MS;
    const buckets = Array.from({ length: 97 }, (_, index) => start + index * HISTORY_BUCKET_MS);
    const samplesByUser = new Map();

    for (const row of historyRows) {
      const id = String(row.user_id ?? "");
      const time = new Date(row.fetched_at || row.snapshot_at || 0).getTime();
      const points = numberOrNull(row.points ?? row.total_points);
      if (!id || !Number.isFinite(time) || time < start - HISTORY_BUCKET_MS || time > end || points === null) continue;
      if (!samplesByUser.has(id)) samplesByUser.set(id, []);
      samplesByUser.get(id).push({ time, points });
    }

    const series = rows.map((member, index) => {
      const id = String(member.user_id ?? "");
      const samples = (samplesByUser.get(id) || []).sort((a, b) => a.time - b.time);
      const values = new Array(buckets.length).fill(null);
      let sampleIndex = 0;
      let lastValue = null;
      for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
        const bucketEnd = buckets[bucketIndex] + HISTORY_BUCKET_MS;
        while (sampleIndex < samples.length && samples[sampleIndex].time < bucketEnd) {
          lastValue = samples[sampleIndex].points;
          sampleIndex += 1;
        }
        values[bucketIndex] = lastValue;
      }
      return {
        id,
        name: memberName(member),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        hidden: member.points_redacted === true,
        values: member.points_redacted === true ? values.map(() => null) : values
      };
    });

    return { buckets, series };
  }

  function renderPanel(side, requestedName, payload) {
    const panel = panelFor(side);
    const current = payload.current || {};
    const rows = Array.isArray(current.rows) ? current.rows.slice() : [];
    const leagueName = String(current.league_name || requestedName).trim() || requestedName;
    rows.sort((a, b) => (numberOrNull(a.rank) ?? 9999) - (numberOrNull(b.rank) ?? 9999));

    panel.title.textContent = `${leagueName} Member Progress`;
    panel.summary.textContent = current.snapshot_at
      ? `Updated ${new Date(current.snapshot_at).toLocaleString()}`
      : "No current snapshot";
    panel.profile.href = `league.html?league=${encodeURIComponent(leagueName)}${runKey ? `&run=${encodeURIComponent(runKey)}` : ""}`;
    panel.profile.hidden = false;

    const icon = iconUrl(current.league_icon);
    panel.icon.hidden = !icon;
    if (icon) {
      panel.icon.src = icon;
      panel.icon.alt = `${leagueName} icon`;
    }

    if (!rows.length) {
      panel.body.innerHTML = '<div class="compare-empty">No stored member data was found for this league in the current League.</div>';
      panel.chart = null;
      return;
    }

    const chart = growthSeries(rows, payload.historyRows);
    panel.body.innerHTML = `
      <div class="compare-growth">
        <div class="compare-growth-head">
          <div><strong>24-Hour Member Growth</strong><span>Points at 15-minute intervals</span></div>
          <span>${rows.length} member${rows.length === 1 ? "" : "s"}</span>
        </div>
        <div class="compare-growth-legend"></div>
        <div class="compare-chart-shell">
          <canvas aria-label="${escapeHtml(leagueName)} member point growth over the last 24 hours"></canvas>
          <div class="compare-tooltip" role="status"></div>
        </div>
      </div>
      <div class="compare-roster">
        <table>
          <thead><tr><th>Rank</th><th>Player</th><th class="numeric">Points</th><th class="numeric">5m</th><th class="numeric">1h</th><th class="numeric">6h</th><th class="numeric">12h</th><th class="numeric">24h</th></tr></thead>
          <tbody>${rows.map(row => {
            const name = memberName(row);
            const href = `league-profile.html?league=${encodeURIComponent(leagueName)}&id=${encodeURIComponent(row.user_id || "")}${runKey ? `&run=${encodeURIComponent(runKey)}` : ""}`;
            return `<tr>
              <td class="rank">#${escapeHtml(row.rank ?? "—")}</td>
              <td><a class="player-cell" href="${href}">${avatarHtml(row)}<span><span class="compare-player-name">${escapeHtml(name)}</span><span class="meta">${escapeHtml(row.user_id || "")}</span></span></a></td>
              <td class="numeric" title="${escapeHtml(numberOrNull(row.total_points) === null ? "" : Number(row.total_points).toLocaleString("en-US"))}">${escapeHtml(shortNumber(row.total_points))}</td>
              <td class="numeric">${deltaHtml(row.gain_5m)}</td>
              <td class="numeric">${deltaHtml(row.gain_1h)}</td>
              <td class="numeric">${deltaHtml(row.gain_6h)}</td>
              <td class="numeric">${deltaHtml(row.gain_12h)}</td>
              <td class="numeric">${deltaHtml(row.gain_24h)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>`;

    panel.chart = chart;
    renderLegend(panel);
    requestAnimationFrame(() => drawChart(panel));
  }

  function renderLegend(panel) {
    const legend = panel.root.querySelector(".compare-growth-legend");
    if (!legend || !panel.chart) return;
    legend.innerHTML = panel.chart.series.map(series => {
      const known = series.values.filter(value => value !== null);
      const gain = known.length > 1 ? known[known.length - 1] - known[0] : null;
      return `<span class="compare-legend-item" style="--series-color:${series.color}"><span class="compare-legend-dot"></span><span>${escapeHtml(series.name)}</span><strong>${escapeHtml(series.hidden ? "Hidden" : signedNumber(gain))}</strong></span>`;
    }).join("");
  }

  function timeLabel(value) {
    return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function drawChart(panel) {
    const canvas = panel.root.querySelector("canvas");
    const tooltip = panel.root.querySelector(".compare-tooltip");
    if (!canvas || !tooltip || !panel.chart) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const visible = panel.chart.series.filter(series => !series.hidden && series.values.some(value => value !== null));
    const values = visible.flatMap(series => series.values.filter(value => value !== null));
    if (!values.length) {
      context.fillStyle = "#8b949e";
      context.font = "12px Arial";
      context.fillText("Not enough stored history to chart yet.", 14, 26);
      canvas._compareChart = null;
      return;
    }

    const padLeft = 58;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 32;
    const width = Math.max(1, rect.width - padLeft - padRight);
    const height = Math.max(1, rect.height - padTop - padBottom);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = Math.max(1, rawMax - rawMin);
    const padding = Math.max(1, range * 0.08);
    const min = Math.max(0, rawMin - padding);
    const max = rawMax + padding;
    const xFor = index => padLeft + (index / (panel.chart.buckets.length - 1)) * width;
    const yFor = value => padTop + (1 - (value - min) / Math.max(1, max - min)) * height;

    context.font = "10px Arial";
    context.lineWidth = 1;
    context.strokeStyle = "#30363d";
    context.fillStyle = "#8b949e";
    for (let index = 0; index <= 4; index += 1) {
      const y = padTop + index * height / 4;
      const value = max - index * (max - min) / 4;
      context.beginPath();
      context.moveTo(padLeft, y);
      context.lineTo(rect.width - padRight, y);
      context.stroke();
      context.fillText(shortNumber(value), 7, y + 4);
    }
    for (let index = 0; index <= 6; index += 1) {
      const bucketIndex = Math.round(index * (panel.chart.buckets.length - 1) / 6);
      const x = xFor(bucketIndex);
      const label = timeLabel(panel.chart.buckets[bucketIndex]);
      context.beginPath();
      context.moveTo(x, padTop);
      context.lineTo(x, rect.height - padBottom);
      context.stroke();
      const labelWidth = context.measureText(label).width;
      context.fillText(label, Math.max(padLeft, Math.min(rect.width - padRight - labelWidth, x - labelWidth / 2)), rect.height - 10);
    }

    for (const series of visible) {
      context.strokeStyle = series.color;
      context.lineWidth = 2;
      context.beginPath();
      let started = false;
      let previous = null;
      series.values.forEach((value, index) => {
        if (value === null) {
          started = false;
          previous = null;
          return;
        }
        const x = xFor(index);
        if (!started) {
          context.moveTo(x, yFor(value));
          started = true;
        } else {
          context.lineTo(x, yFor(previous));
          if (value !== previous) context.lineTo(x, yFor(value));
        }
        previous = value;
      });
      context.stroke();
    }

    canvas._compareChart = { ...panel.chart, visible, xFor, padLeft, padRight, padTop, padBottom };
    bindTooltip(canvas, tooltip, panel);
  }

  function bindTooltip(canvas, tooltip, panel) {
    if (canvas.dataset.tooltipBound) return;
    canvas.dataset.tooltipBound = "1";
    const hide = () => { tooltip.style.display = "none"; };
    const move = event => {
      const chart = canvas._compareChart;
      if (!chart) return;
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const index = Math.max(0, Math.min(chart.buckets.length - 1, Math.round(((localX - chart.padLeft) / Math.max(1, rect.width - chart.padLeft - chart.padRight)) * (chart.buckets.length - 1))));
      tooltip.innerHTML = `<div class="compare-tooltip-time">${escapeHtml(new Date(chart.buckets[index]).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }))}</div>${chart.series.map(series => {
        const value = series.values[index];
        const previous = index > 0 ? series.values[index - 1] : null;
        const change = value !== null && previous !== null ? value - previous : null;
        const detail = series.hidden ? "Hidden" : value === null ? "—" : `${Number(value).toLocaleString("en-US")}${change === null ? "" : ` (${signedNumber(change)})`}`;
        return `<div class="compare-tooltip-row" style="--series-color:${series.color}"><span>${escapeHtml(series.name)}</span><strong>${escapeHtml(detail)}</strong></div>`;
      }).join("")}`;
      tooltip.style.display = "block";
      const x = chart.xFor(index);
      tooltip.style.left = `${Math.max(6, Math.min(rect.width - tooltip.offsetWidth - 6, x + 10))}px`;
      tooltip.style.top = `${Math.max(6, Math.min(rect.height - tooltip.offsetHeight - 6, event.clientY - rect.top - tooltip.offsetHeight / 2))}px`;
    };
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", hide);
    canvas.addEventListener("touchstart", event => event.touches?.[0] && move(event.touches[0]), { passive: true });
    canvas.addEventListener("touchmove", event => event.touches?.[0] && move(event.touches[0]), { passive: true });
    canvas.addEventListener("touchend", hide);
    panel.root.addEventListener("mouseleave", hide);
  }

  async function loadSide(side, leagueName, version) {
    if (!leagueName) {
      setPanelState(side, "", "empty", "No league selected.");
      return;
    }
    setPanelState(side, leagueName, "loading", `Loading ${leagueName}...`);
    try {
      const payload = await fetchLeague(leagueName);
      if (version !== requestVersion) return;
      renderPanel(side, leagueName, payload);
    } catch (error) {
      if (version !== requestVersion) return;
      setPanelState(side, leagueName, "error", error?.message || String(error));
    }
  }

  async function compare() {
    const left = document.getElementById("left-league").value.trim();
    const right = document.getElementById("right-league").value.trim();
    const submit = document.getElementById("compare-submit");
    if (!left && !right) {
      document.getElementById("left-league").focus();
      return;
    }
    const version = ++requestVersion;
    const nextUrl = new URL(location.href);
    if (left) nextUrl.searchParams.set("left", left); else nextUrl.searchParams.delete("left");
    if (right) nextUrl.searchParams.set("right", right); else nextUrl.searchParams.delete("right");
    history.replaceState(null, "", nextUrl);
    submit.disabled = true;
    submit.textContent = "Loading...";
    await Promise.all([loadSide("left", left, version), loadSide("right", right, version)]);
    if (version === requestVersion) {
      submit.disabled = false;
      submit.textContent = "Search";
    }
  }

  document.getElementById("compare-form").addEventListener("submit", event => {
    event.preventDefault();
    compare();
  });

  const leftInitial = String(params.get("left") || "").trim();
  const rightInitial = String(params.get("right") || "").trim();
  document.getElementById("left-league").value = leftInitial;
  document.getElementById("right-league").value = rightInitial;
  document.getElementById("compare-run-label").textContent = runKey || "Current League";
  if (leftInitial || rightInitial) compare();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => panels.forEach(panel => panel.chart && drawChart(panel)), 100);
  });
})();
