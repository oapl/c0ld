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
        left: var(--lane-left);
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
        <div class="duck-race-empty">Click Duck Chart to load the race.</div>
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
      ? 0.12 + ((points - minPoints) / pointRange) * 0.78
      : 0.78 - (index * 0.035);
    const next = state.rows[index + 1];
    const lead = next ? points - Number(next.points || 0) : null;
    const logo = iconUrl(row);

    const laneLeft = 7 + Math.max(0.08, Math.min(0.92, progress)) * 82;
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
    const pointRange = Math.max(1, maxPoints - minPoints);

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

    panel.hidden = !visible;
    if (rewardBody) rewardBody.hidden = visible;
    if (button) {
      button.setAttribute("aria-pressed", String(visible));
      button.textContent = visible ? "Line Chart" : "Duck Chart";
    }

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

    const button = document.getElementById("reward-threshold-refresh");
    if (button) {
      button.textContent = "Duck Chart";
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
