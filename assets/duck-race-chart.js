(function () {
  "use strict";

  if (!/\/clans\.html(?:$|[?#])/.test(window.location.pathname) && !/\/clans\/?$/.test(window.location.pathname)) {
    return;
  }

  const API = "https://c0ld-clan-api-worker.opal-dde.workers.dev";
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
        margin-bottom: 24px;
        overflow: hidden;
      }

      .duck-race-meta {
        color: var(--muted, #8b949e);
        font-size: 13px;
      }

      .duck-race-track {
        position: relative;
        min-height: 690px;
        overflow: hidden;
        border-top: 1px solid var(--border, #30363d);
        background:
          linear-gradient(180deg, rgba(70, 190, 255, .15), rgba(70, 190, 255, 0) 36%),
          repeating-linear-gradient(180deg, rgba(255, 255, 255, .04) 0 1px, transparent 1px 67px),
          linear-gradient(180deg, #142434 0%, #0f1b2a 22%, #092237 23%, #0a314a 100%);
      }

      .duck-race-track::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 72px;
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
        top: 72px;
        right: 54px;
        bottom: 0;
        width: 18px;
        background:
          linear-gradient(45deg, #f5f5f5 25%, transparent 25% 75%, #f5f5f5 75%),
          linear-gradient(45deg, #111 25%, transparent 25% 75%, #111 75%);
        background-size: 18px 18px;
        background-position: 0 0, 9px 9px;
        border-left: 1px solid rgba(255, 255, 255, .35);
        border-right: 1px solid rgba(255, 255, 255, .35);
        opacity: .9;
      }

      .duck-lane {
        position: relative;
        height: 67px;
        margin-top: 1px;
      }

      .duck-lane:first-child {
        margin-top: 80px;
      }

      .duck-waterline {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 2px;
        height: 16px;
        background: repeating-linear-gradient(90deg, rgba(107, 205, 255, .18) 0 18px, rgba(107, 205, 255, .04) 18px 36px);
        opacity: .75;
      }

      .duck-racer {
        --lane-left: 10%;
        --duck-width: 104px;
        position: absolute;
        left: 2%;
        top: 7px;
        width: var(--duck-width);
        height: 54px;
        transition: left 900ms cubic-bezier(.2, .75, .2, 1);
        z-index: 1;
      }

      .duck-race-section.is-ready .duck-racer {
        left: var(--lane-left);
      }

      .duck-svg {
        display: block;
        width: 104px;
        height: 54px;
        filter: drop-shadow(0 2px 0 rgba(0, 0, 0, .65));
      }

      .duck-logo {
        position: absolute;
        left: 29px;
        top: 27px;
        width: 23px;
        height: 23px;
        border-radius: 5px;
        object-fit: cover;
        background: #0d1117;
        border: 1px solid rgba(0, 0, 0, .6);
      }

      .duck-racer-label {
        position: absolute;
        left: 106px;
        top: 9px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 170px;
        padding: 5px 7px;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 7px;
        background: rgba(13, 17, 23, .78);
        box-shadow: 0 2px 8px rgba(0, 0, 0, .28);
      }

      .duck-racer-name {
        color: var(--text, #e6edf3);
        font-weight: 800;
        line-height: 1.1;
      }

      .duck-racer-stats {
        color: var(--muted, #8b949e);
        font-size: 12px;
        line-height: 1.2;
      }

      .duck-race-empty {
        position: relative;
        z-index: 1;
        padding: 28px;
        color: var(--muted, #8b949e);
      }

      @media (max-width: 760px) {
        .duck-race-track { min-height: 800px; }
        .duck-lane { height: 72px; }
        .duck-racer-label {
          left: 58px;
          top: 39px;
          min-width: 135px;
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

  function duckSvg() {
    return `
      <svg class="duck-svg" viewBox="0 0 130 68" aria-hidden="true">
        <path d="M9 46c3-17 21-27 40-22 8-17 35-15 41 2 8 0 17 3 22 10l14 1-13 10c-5 13-23 19-45 18H28C15 65 6 58 9 46z" fill="#f2cd24" stroke="#1b1b1b" stroke-width="4" stroke-linejoin="round"/>
        <path d="M33 44c11 7 27 8 43 2l-4 16H34c-8 0-15-3-19-8 6-7 12-10 18-10z" fill="#fff" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round"/>
        <path d="M45 20c-4-11 2-18 13-19 9-1 15 4 18 11-9-4-18-2-31 8z" fill="#4fa94c" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="78" cy="18" r="10" fill="#fff" stroke="#1b1b1b" stroke-width="3"/>
        <circle cx="82" cy="18" r="4" fill="#1b1b1b"/>
        <path d="M91 26l29 3-25 11c-4-4-5-8-4-14z" fill="#ff7a20" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function ensurePanel() {
    let panel = document.getElementById("duck-race-section");
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = "duck-race-section";
    panel.className = "section duck-race-section";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Top 10 Duck Chart</h2>
        <div id="duck-race-meta" class="duck-race-meta">Waiting for the race.</div>
      </div>
      <div id="duck-race-track" class="duck-race-track">
        <div class="duck-race-empty">Click Duck Chart to load the race.</div>
      </div>
    `;

    const rewardPanel = document.getElementById("reward-threshold-section");
    const firstSection = document.querySelector("main > .section");
    const main = document.querySelector("main");
    if (rewardPanel && rewardPanel.parentNode) {
      rewardPanel.parentNode.insertBefore(panel, rewardPanel);
    } else if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(panel, firstSection);
    } else if (main) {
      main.appendChild(panel);
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

    const laneLeft = 2 + Math.max(0.08, Math.min(0.92, progress)) * 78;

    return `
      <div class="duck-lane">
        <div class="duck-waterline"></div>
        <div class="duck-racer" style="--lane-left:${laneLeft.toFixed(2)}%">
          ${duckSvg()}
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
    const reward = document.getElementById("reward-threshold-section");
    const button = document.getElementById("refresh-btn");

    panel.hidden = !visible;
    if (reward) reward.hidden = visible;
    if (button) button.setAttribute("aria-pressed", String(visible));

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

    const button = document.getElementById("refresh-btn");
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
