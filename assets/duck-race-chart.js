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

  function loadExportImage(url) {
    return new Promise(resolve => {
      if (!url) {
        resolve(null);
        return;
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function drawTrackBackground(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, x, y, width, height, 8);
    ctx.clip();

    const water = ctx.createLinearGradient(0, y, 0, y + height);
    water.addColorStop(0, "#142434");
    water.addColorStop(.22, "#0f1b2a");
    water.addColorStop(.23, "#092237");
    water.addColorStop(1, "#0a314a");
    ctx.fillStyle = water;
    ctx.fillRect(x, y, width, height);

    for (let stripe = 0; stripe < width; stripe += 36) {
      ctx.fillStyle = stripe % 72 === 0 ? "rgba(107,205,255,.16)" : "rgba(107,205,255,.04)";
      ctx.fillRect(x + stripe, y + 58, 18, height - 58);
    }

    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let yy = y + 58; yy < y + height; yy += 54) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + width, yy);
      ctx.stroke();
    }

    ctx.fillStyle = "#3d7f33";
    ctx.fillRect(x, y, width, 58);
    ctx.fillStyle = "#5fbd4e";
    [
      [width * .12, 28, 22],
      [width * .17, 22, 27],
      [width * .23, 30, 23]
    ].forEach(([cx, cy, radius]) => {
      ctx.beginPath();
      ctx.arc(x + cx, y + cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#7b4f26";
    ctx.fillRect(x, y + 56, width, 4);

    const finishX = x + width - 38 - 20;
    for (let yy = y + 58; yy < y + height; yy += 20) {
      const odd = Math.floor((yy - y) / 20) % 2;
      ctx.fillStyle = odd ? "#111" : "#f5f5f5";
      ctx.fillRect(finishX, yy, 10, 20);
      ctx.fillStyle = odd ? "#f5f5f5" : "#111";
      ctx.fillRect(finishX + 10, yy, 10, 20);
    }

    ctx.restore();
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundedRect(ctx, x + .5, y + .5, width - 1, height - 1, 8);
    ctx.stroke();
  }

  function drawDuckFallback(ctx, left, top, scale, accent) {
    const centerX = left + 74 * scale;
    const centerY = top + 74 * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
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
  }

  function drawDuckLabel(ctx, racer, left, top, duckWidth) {
    const row = racer.row;
    const clan = row.clan_name || "Unknown";
    const name = `#${row.rank || racer.index + 1} ${clan}`;
    const centerX = left + duckWidth / 2;
    const labelTop = top - 50 - racer.labelLift;

    ctx.save();
    ctx.font = "800 13px Arial";
    ctx.textAlign = "center";
    const labelWidth = Math.min(150, Math.max(126, ctx.measureText(name).width + 14));
    ctx.fillStyle = "rgba(13,17,23,.78)";
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundedRect(ctx, centerX - labelWidth / 2, labelTop, labelWidth, 42, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e6edf3";
    ctx.fillText(name, centerX, labelTop + 17, labelWidth - 14);
    ctx.font = "11px Arial";
    ctx.fillStyle = "#8b949e";
    const stats = `${formatNumber(row.points)}${racer.lead !== null ? ` - +${formatNumber(racer.lead)}` : ""}`;
    ctx.fillText(stats, centerX, labelTop + 33, labelWidth - 14);
    ctx.restore();
  }

  async function renderDuckExportCanvas() {
    const track = document.getElementById("duck-race-track");
    const meta = document.getElementById("duck-race-meta");
    const trackRect = track?.getBoundingClientRect();
    const cssWidth = Math.max(720, Math.round(trackRect?.width || 1280));
    const trackHeight = Math.max(310, Math.round(trackRect?.height || 370));
    const metaText = String(meta?.textContent || `${selectedBattle()} - latest data`).trim();
    const metaHeight = metaText ? 20 : 0;
    const gap = metaText ? 10 : 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round((metaHeight + gap + trackHeight) * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rows = state.rows.length ? state.rows : [];

    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, 0, cssWidth, metaHeight + gap + trackHeight);

    if (metaText) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "13px Arial";
      ctx.fillText(metaText, 0, 14);
    }

    const trackX = 0;
    const trackY = metaHeight + gap;
    const trackW = cssWidth;
    const trackH = trackHeight;
    drawTrackBackground(ctx, trackX, trackY, trackW, trackH);

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

    const duckImage = await loadExportImage(DUCK_IMAGE_URL);
    const logoEntries = await Promise.all(rows.map(async row => {
      const logo = await loadExportImage(iconUrl(row));
      return [row, logo];
    }));
    const logos = new Map(logoEntries);
    const mobile = trackW <= 760;
    const duckWidth = mobile ? 126 : 148;
    const duckHeight = mobile ? 114 : 134;
    const duckBottom = mobile ? 44 : 46;
    const scale = duckWidth / 148;

    const racers = rows.map((row, index) => {
      const progress = range > 0 ? (Number(row.points || 0) - minPoints) / range : 1 - index * .08;
      const laneLeft = 5 + Math.max(0, Math.min(1, progress)) * 88;
      const racerLeft = Math.min(laneLeft / 100 * trackW, trackW - duckWidth - 10);
      const next = rows[index + 1];
      return {
        row,
        index,
        left: trackX + racerLeft,
        top: trackY + trackH - duckBottom - duckHeight,
        lead: next ? Number(row.points || 0) - Number(next.points || 0) : null,
        labelLift: (index % 4) * 18
      };
    });

    racers.slice().reverse().forEach(racer => {
      const row = racer.row;
      const logo = logos.get(row);
      const accent = clanColor(row.clan_name, racer.index);

      if (duckImage) ctx.drawImage(duckImage, racer.left, racer.top, duckWidth, duckHeight);
      else drawDuckFallback(ctx, racer.left, racer.top, scale, accent);

      if (logo) {
        const logoLeft = racer.left + 44 * scale;
        const logoTop = racer.top + 74 * scale;
        const logoSize = 34 * scale;
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(logoLeft - 1, logoTop - 1, logoSize + 2, logoSize + 2);
        ctx.drawImage(logo, logoLeft, logoTop, logoSize, logoSize);
      }

      drawDuckLabel(ctx, racer, racer.left, racer.top, duckWidth);
    });

    return canvas;
  }

  async function exportDuckPng() {
    if (!state.rows.length && !state.loading) await loadRace(true);
    const canvas = await renderDuckExportCanvas();
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
