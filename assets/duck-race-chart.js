(function () {
  "use strict";

  if (!/\/clans\.html(?:$|[?#])/.test(window.location.pathname) && !/\/clans\/?$/.test(window.location.pathname)) {
    return;
  }

  const API = "https://c0ld-clan-api-worker.opal-dde.workers.dev";
  const DUCK_IMAGE_URL = "assets/duck-race-duck.png";
  const UPDATE_MS = 5 * 60 * 1000;
  const state = {
    visible: false,
    loading: false,
    rows: [],
    timer: null,
    lastBattle: "current"
  };

  function css() {
    const style = document.createElement("style");
    style.textContent = `
      .duck-chart-button[aria-pressed="true"] {
        border-color: var(--link, #ff9b96);
        color: var(--link, #ff9b96);
        background: rgba(248, 81, 73, .12);
      }

      #duck-recap-link[hidden] {
        display: none !important;
      }

      .duck-race-section {
        overflow: hidden;
        padding: 14px 16px 16px;
      }

      .duck-race-meta {
        color: var(--muted, #8b949e);
        font-size: 13px;
        margin-bottom: 10px;
      }

      .duck-race-track {
        position: relative;
        height: 370px;
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--border, #30363d);
        border-radius: 8px;
        background:
          linear-gradient(180deg, rgba(70, 190, 255, .15), rgba(70, 190, 255, 0) 36%),
          repeating-linear-gradient(90deg, rgba(107, 205, 255, .16) 0 18px, rgba(107, 205, 255, .04) 18px 36px),
          repeating-linear-gradient(180deg, rgba(255, 255, 255, .035) 0 1px, transparent 1px 54px),
          linear-gradient(180deg, #142434 0%, #0f1b2a 22%, #092237 23%, #0a314a 100%);
      }

      .duck-race-track::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 58px;
        background:
          radial-gradient(circle at 12% 46%, #5fbd4e 0 22px, transparent 23px),
          radial-gradient(circle at 17% 38%, #5fbd4e 0 27px, transparent 28px),
          radial-gradient(circle at 23% 48%, #5fbd4e 0 23px, transparent 24px),
          linear-gradient(#52a245, #3d7f33);
        border-bottom: 4px solid #7b4f26;
      }

      .duck-race-track::after {
        content: "";
        position: absolute;
        top: 58px;
        right: 38px;
        bottom: 0;
        width: 20px;
        background:
          conic-gradient(#f5f5f5 25%, #111 0 50%, #f5f5f5 0 75%, #111 0);
        background-size: 20px 20px;
        border-left: 1px solid rgba(255, 255, 255, .35);
        border-right: 1px solid rgba(255, 255, 255, .35);
        opacity: .95;
      }

      .duck-lane {
        position: absolute;
        inset: 0;
        height: auto;
        margin: 0;
        pointer-events: none;
      }

      .duck-lane:first-child {
        margin-top: 0;
      }

      .duck-waterline {
        display: none;
      }

      .duck-racer {
        --lane-left: 10%;
        --duck-width: 148px;
        --label-lift: 0px;
        position: absolute;
        left: 2%;
        top: auto;
        bottom: 46px;
        width: var(--duck-width);
        height: 134px;
        pointer-events: auto;
        transition: left 900ms cubic-bezier(.2, .75, .2, 1);
        z-index: 1;
      }

      .duck-race-section.is-ready .duck-racer {
        left: min(var(--lane-left), calc(100% - var(--duck-width) - 10px));
      }

      .duck-image {
        display: block;
        width: 148px;
        height: 134px;
        object-fit: contain;
        filter: drop-shadow(0 2px 0 rgba(0, 0, 0, .65));
      }

      .duck-logo {
        position: absolute;
        left: 44px;
        top: 74px;
        width: 34px;
        height: 34px;
        border-radius: 7px;
        object-fit: cover;
        background: #0d1117;
        border: 1px solid rgba(0, 0, 0, .6);
      }

      .duck-racer-label {
        position: absolute;
        left: 50%;
        top: calc(-50px - var(--label-lift));
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 126px;
        max-width: 150px;
        padding: 5px 7px;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 7px;
        background: rgba(13, 17, 23, .78);
        box-shadow: 0 2px 8px rgba(0, 0, 0, .28);
        text-align: center;
      }

      .duck-racer-name {
        color: var(--text, #e6edf3);
        font-weight: 800;
        line-height: 1.1;
        font-size: 13px;
        white-space: nowrap;
      }

      .duck-racer-stats {
        color: var(--muted, #8b949e);
        font-size: 11px;
        line-height: 1.2;
        white-space: nowrap;
      }

      .duck-race-empty {
        position: relative;
        z-index: 1;
        padding: 28px;
        color: var(--muted, #8b949e);
      }

      @media (max-width: 760px) {
        .duck-race-section { padding: 14px 12px 14px; }
        .duck-race-track { height: 310px; }
        .duck-racer {
          --duck-width: 126px;
          bottom: 44px;
          height: 114px;
        }
        .duck-image {
          width: 126px;
          height: 114px;
        }
        .duck-logo {
          left: 37px;
          top: 63px;
          width: 29px;
          height: 29px;
        }
        .duck-racer-label {
          min-width: 112px;
          max-width: 124px;
          font-size: 12px;
        }
        .duck-racer-stats { font-size: 11px; }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    const abs = Math.abs(number);
    if (abs >= 1e12) return `${(number / 1e12).toFixed(2).replace(/\.00$/, "")}T`;
    if (abs >= 1e9) return `${(number / 1e9).toFixed(2).replace(/\.00$/, "")}B`;
    if (abs >= 1e6) return `${(number / 1e6).toFixed(2).replace(/\.00$/, "")}M`;
    if (abs >= 1e3) return `${(number / 1e3).toFixed(2).replace(/\.00$/, "")}K`;
    return number.toLocaleString("en-US");
  }

  function selectedBattle() {
    return document.getElementById("battle-select")?.value || "current";
  }

  function exportFilename(prefix) {
    const battle = String(state.lastBattle || selectedBattle() || "current")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "current";
    return `${prefix}-${battle}.png`;
  }

  function clanColor(name, index) {
    const key = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key === "c0ld") return "#ff9b96";
    if (key === "wmsy") return "#74d99f";
    if (key === "nong") return "#f6ad55";
    const colors = ["#58a6ff", "#d2a8ff", "#79c0ff", "#ffa657", "#a5d6ff", "#ff7b72", "#3fb950", "#f2cc60", "#db61a2", "#56d4dd"];
    return colors[index % colors.length];
  }

  function iconUrl(row) {
    if (row.icon_url) return row.icon_url;
    if (row.icon_id) return `https://ps99.biggamesapi.io/image/${encodeURIComponent(row.icon_id)}`;
    return "";
  }

  function duckImage() {
    return `<img class="duck-image" src="${DUCK_IMAGE_URL}" alt="">`;
  }

  function ensurePanel() {
    let panel = document.getElementById("duck-race-section");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "duck-race-section";
    panel.className = "duck-race-section";
    panel.hidden = true;
    panel.innerHTML = `
      <div id="duck-race-meta" class="duck-race-meta">Waiting for the race.</div>
      <div id="duck-race-track" class="duck-race-track">
        <div class="duck-race-empty">Click Merc Mode to load the race.</div>
      </div>
    `;

    const rewardPanel = document.getElementById("reward-threshold-section");
    const rewardBody = rewardPanel?.querySelector(".reward-threshold-body");
    if (rewardPanel && rewardBody) {
      rewardPanel.insertBefore(panel, rewardBody);
    } else {
      const firstSection = document.querySelector("main > .section");
      const main = document.querySelector("main");
      panel.classList.add("section");
      if (firstSection && firstSection.parentNode) {
        firstSection.parentNode.insertBefore(panel, firstSection);
      } else if (main) {
        main.appendChild(panel);
      }
    }
    return panel;
  }

  function ensureDuckRecapLink() {
    let link = document.getElementById("duck-recap-link");
    if (link) return link;

    const controls = document.querySelector("#reward-threshold-section .reward-threshold-metrics");
    const lineButton = document.getElementById("reward-threshold-refresh");
    if (!controls || !lineButton) return null;

    link = document.createElement("button");
    link.id = "duck-recap-link";
    link.type = "button";
    link.textContent = "Duck Recap";
    link.hidden = true;
    link.addEventListener("click", () => {
      const battle = selectedBattle();
      const query = battle && battle !== "current" ? `?mode=clans&battle=${encodeURIComponent(battle)}` : "?mode=clans";
      window.location.href = `duck-recap.html${query}`;
    });

    lineButton.insertAdjacentElement("afterend", link);
    return link;
  }

  function raceUrl(forceFresh) {
    const battle = selectedBattle();
    const url = new URL(`${API}/api/clans/current`);
    if (battle && battle !== "current") url.searchParams.set("battle", battle);
    if (forceFresh) url.searchParams.set("fresh", Date.now());
    return url.toString();
  }

  async function fetchRace(forceFresh) {
    const response = await fetch(raceUrl(forceFresh), { cache: forceFresh ? "reload" : "default" });
    if (!response.ok) {
      throw new Error(`Duck chart failed to load. HTTP ${response.status}`);
    }
    return response.json();
  }

  function makeLane(row, index, minPoints, pointRange) {
    const points = Number(row.points || 0);
    const progress = pointRange > 0
      ? (points - minPoints) / pointRange
      : 1 - (index * 0.08);
    const next = state.rows[index + 1];
    const lead = next ? points - Number(next.points || 0) : null;
    const logo = iconUrl(row);

    const laneLeft = 5 + Math.max(0, Math.min(1, progress)) * 88;
    const labelLift = (index % 4) * 18;
    const zIndex = 40 - index;

    return `
      <div class="duck-lane">
        <div class="duck-waterline"></div>
        <div class="duck-racer" style="--lane-left:${laneLeft.toFixed(2)}%;--label-lift:${labelLift}px;z-index:${zIndex}">
          ${duckImage()}
          ${logo ? `<img class="duck-logo" src="${escapeHtml(logo)}" alt="">` : ""}
          <div class="duck-racer-label">
            <div class="duck-racer-name">#${escapeHtml(row.rank || index + 1)} ${escapeHtml(row.clan_name || "Unknown")}</div>
            <div class="duck-racer-stats">${escapeHtml(formatNumber(points))}${lead !== null ? ` - +${escapeHtml(formatNumber(lead))}` : ""}</div>
          </div>
        </div>
      </div>
    `;
  }

  function render(payload) {
    const panel = ensurePanel();
    const track = document.getElementById("duck-race-track");
    const meta = document.getElementById("duck-race-meta");
    const allRows = Array.isArray(payload?.rows) ? payload.rows : [];

    state.rows = allRows
      .filter(row => Number.isFinite(Number(row.rank)) && Number(row.rank) <= 10)
      .sort((a, b) => Number(a.rank) - Number(b.rank))
      .slice(0, 10);

    if (!state.rows.length) {
      track.innerHTML = `<div class="duck-race-empty">No top 10 clan rows found for this battle.</div>`;
      meta.textContent = "No racers loaded.";
      return;
    }

    const points = state.rows.map(row => Number(row.points || 0));
    const maxPoints = Math.max(...points);
    const minPoints = Math.min(...points);
    const pointRange = maxPoints - minPoints;

    panel.classList.remove("is-ready");
    track.innerHTML = state.rows.map((row, index) => makeLane(row, index, minPoints, pointRange)).join("");
    requestAnimationFrame(() => panel.classList.add("is-ready"));

    const stamp = payload?.snapshot_at || payload?.generated_at;
    const date = stamp ? new Date(stamp) : null;
    const label = payload?.display_name || payload?.battle || selectedBattle();
    meta.textContent = `${label} - ${stamp && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "latest data"}`;
  }

  async function loadRace(forceFresh = false) {
    if (state.loading) return;
    state.loading = true;
    ensurePanel();
    document.getElementById("duck-race-meta").textContent = "Loading ducks...";

    try {
      const payload = await fetchRace(forceFresh);
      render(payload);
    } catch (error) {
      console.error(error);
      document.getElementById("duck-race-track").innerHTML = `<div class="duck-race-empty">${escapeHtml(error.message)}</div>`;
      document.getElementById("duck-race-meta").textContent = "Duck chart failed.";
    } finally {
      state.loading = false;
    }
  }

  function setVisible(visible) {
    state.visible = visible;
    const panel = ensurePanel();
    const rewardBody = document.querySelector("#reward-threshold-section .reward-threshold-body");
    const button = document.getElementById("reward-threshold-refresh");
    const recapLink = ensureDuckRecapLink();

    panel.hidden = !visible;
    if (rewardBody) rewardBody.hidden = visible;
    if (button) {
      button.setAttribute("aria-pressed", String(visible));
      button.textContent = visible ? "Line View" : "Merc Mode";
    }
    if (recapLink) recapLink.hidden = !visible;

    if (visible) {
      loadRace(true);
      if (!state.timer) {
        state.timer = setInterval(() => {
          if (state.visible) loadRace(false);
        }, UPDATE_MS);
      }
    }
  }

  function init() {
    css();
    ensurePanel();
    ensureDuckRecapLink();

    const button = document.getElementById("reward-threshold-refresh");
    if (button) {
      button.textContent = "Merc Mode";
      button.classList.add("duck-chart-button");
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => setVisible(!state.visible));
    }

    document.getElementById("battle-select")?.addEventListener("change", () => {
      const battle = selectedBattle();
      if (battle !== state.lastBattle) {
        state.lastBattle = battle;
        if (state.visible) loadRace(true);
      }
    });
  }

  function drawExportDuck(ctx, row, index, x, y, scale) {
    const clan = row.clan_name || "Unknown";
    const accent = clanColor(clan, index);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#030303";
    ctx.fillStyle = "#fff200";
    ctx.beginPath();
    ctx.ellipse(0, 30, 55, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(35, -2, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff2d20";
    ctx.beginPath();
    ctx.moveTo(63, 0);
    ctx.quadraticCurveTo(92, -2, 78, 18);
    ctx.quadraticCurveTo(70, 30, 54, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#030303";
    ctx.beginPath();
    ctx.arc(46, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-23, 20, 28, 28);
    ctx.strokeRect(-23, 20, 28, 28);
    ctx.restore();

    ctx.save();
    ctx.font = "700 18px Arial";
    ctx.textAlign = "center";
    const name = `#${row.rank || index + 1} ${clan}`;
    const labelWidth = Math.min(190, Math.max(112, ctx.measureText(name).width + 22));
    ctx.fillStyle = "rgba(13,17,23,.86)";
    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - labelWidth / 2, y - 74, labelWidth, 44, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e6edf3";
    ctx.fillText(name, x, y - 55, labelWidth - 12);
    ctx.font = "13px Arial";
    ctx.fillStyle = "#8b949e";
    const next = state.rows[index + 1];
    const points = Number(row.points || 0);
    const lead = next ? points - Number(next.points || 0) : null;
    ctx.fillText(`${formatNumber(points)}${lead !== null ? ` - +${formatNumber(lead)}` : ""}`, x, y - 38, labelWidth - 12);
    ctx.restore();
  }

  function renderDuckExportCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    const rows = state.rows.length ? state.rows : [];

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#161b22";
    ctx.fillRect(28, 28, canvas.width - 56, canvas.height - 56);
    ctx.strokeStyle = "#30363d";
    ctx.strokeRect(28.5, 28.5, canvas.width - 57, canvas.height - 57);

    ctx.fillStyle = "#e6edf3";
    ctx.font = "700 30px Arial";
    ctx.fillText("c0ld Clan Duck Chart", 52, 76);
    ctx.fillStyle = "#8b949e";
    ctx.font = "15px Arial";
    ctx.fillText(`${selectedBattle()} - latest top 10`, 52, 102);

    const trackX = 52;
    const trackY = 130;
    const trackW = canvas.width - 104;
    const trackH = canvas.height - 178;

    const water = ctx.createLinearGradient(0, trackY, 0, trackY + trackH);
    water.addColorStop(0, "#142434");
    water.addColorStop(.23, "#092237");
    water.addColorStop(1, "#0a314a");
    ctx.fillStyle = water;
    ctx.fillRect(trackX, trackY, trackW, trackH);

    ctx.fillStyle = "#3d7f33";
    ctx.fillRect(trackX, trackY, trackW, 58);
    ctx.fillStyle = "#5fbd4e";
    [140, 205, 282].forEach((cx, i) => {
      ctx.beginPath();
      ctx.arc(trackX + cx, trackY + 28 + (i % 2) * 6, 22 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#7b4f26";
    ctx.fillRect(trackX, trackY + 56, trackW, 4);

    for (let x = trackX; x < trackX + trackW; x += 36) {
      ctx.fillStyle = x / 36 % 2 < 1 ? "rgba(107,205,255,.14)" : "rgba(107,205,255,.04)";
      ctx.fillRect(x, trackY + 60, 18, trackH - 60);
    }

    const finishX = trackX + trackW - 58;
    for (let y = trackY + 60; y < trackY + trackH; y += 20) {
      ctx.fillStyle = (Math.floor((y - trackY) / 20) % 2) ? "#111" : "#f5f5f5";
      ctx.fillRect(finishX, y, 20, 20);
      ctx.fillStyle = (Math.floor((y - trackY) / 20) % 2) ? "#f5f5f5" : "#111";
      ctx.fillRect(finishX + 20, y, 20, 20);
    }

    if (!rows.length) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "18px Arial";
      ctx.fillText("No duck rows loaded yet.", trackX + 28, trackY + 96);
      return canvas;
    }

    const points = rows.map(row => Number(row.points || 0));
    const minPoints = Math.min(...points);
    const maxPoints = Math.max(...points);
    const range = maxPoints - minPoints;
    rows.forEach((row, index) => {
      const progress = range > 0 ? (Number(row.points || 0) - minPoints) / range : 1 - index * .08;
      const x = trackX + 92 + Math.max(0, Math.min(1, progress)) * (trackW - 180);
      const y = trackY + 206 + (index % 4) * 82 + Math.floor(index / 4) * 24;
      drawExportDuck(ctx, row, index, x, y, rows.length > 7 ? .78 : .9);
    });

    return canvas;
  }

  async function exportDuckPng() {
    if (!state.rows.length && !state.loading) await loadRace(true);
    const canvas = renderDuckExportCanvas();
    const save = blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFilename("c0ld-duck-chart");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (canvas.toBlob) canvas.toBlob(save, "image/png");
    else fetch(canvas.toDataURL("image/png")).then(response => response.blob()).then(save);
  }

  window.C0LD_DUCK_RACE = {
    get visible() {
      return state.visible;
    },
    exportPng: exportDuckPng
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
