(() => {
  const CLANS = {
    c0ld: {
      key: "c0ld",
      label: "c0ld",
      mascot: "assets/c0ld-kitsune-logo.gif",
      switchHome: "index.html?clan=WMSY"
    },
    wmsy: {
      key: "wmsy",
      label: "WMSY",
      mascot: "assets/mascots/wmsy-frog.png",
      switchHome: "index.html"
    }
  };

  const MEMBER_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/current";
  const CLANS_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";

  const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" rx="16" fill="#21262d"/>
        <circle cx="75" cy="58" r="26" fill="#6e7681"/>
        <path d="M36 123c8-20 24-32 39-32s31 12 39 32" fill="#6e7681"/>
      </svg>
    `);

  let wmsyRows = [];
  let wmsyData = null;
  let wmsySortKey = "rank";
  let wmsySortAsc = true;
  let wmsySearch = "";
  let wmsyLoading = false;
  let clansCurrentPromise = null;
  let applyTimer = null;

  function normalizeClanKey(value) {
    return String(value || "c0ld").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function currentClan() {
    const params = new URLSearchParams(window.location.search);
    return normalizeClanKey(params.get("clan")) === "wmsy" ? CLANS.wmsy : CLANS.c0ld;
  }

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isWmsy() {
    return currentClan().key === "wmsy";
  }

  function isIndexPage() {
    const page = currentPage();
    return page === "" || page === "index.html";
  }

  function isProfilePage() {
    return currentPage() === "profile.html";
  }

  function splitUrl(url) {
    const raw = String(url || "").trim();
    const [pathAndQuery, hash = ""] = raw.split("#");
    const [path = "", query = ""] = pathAndQuery.split("?");
    return { path, query, hash: hash ? `#${hash}` : "" };
  }

  function isLocalHtmlLink(href) {
    if (!href) return false;
    const value = String(href).trim();
    if (!value || value.startsWith("#")) return false;
    if (/^(https?:|mailto:|tel:)/i.test(value)) return false;
    return /(^|\/)[^/?#]+\.html(?:[?#].*)?$/.test(value) || value === "index.html" || value.startsWith("index.html?");
  }

  function withClanParam(href, clan) {
    if (!isLocalHtmlLink(href)) return href;

    const parts = splitUrl(href);
    let page = parts.path.split("/").pop() || "index.html";

    if (page === "wmsy.html") {
      page = "index.html";
    }

    const params = new URLSearchParams(parts.query);

    if (clan.key === "wmsy") {
      params.set("clan", clan.label);
    } else {
      params.delete("clan");
    }

    const query = params.toString();
    return `${page}${query ? `?${query}` : ""}${parts.hash}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function fmtNum(n) {
    if (n === null || n === undefined || n === "" || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString("en-US");
  }

  function fmtShortNum(n) {
    if (n === null || n === undefined || n === "" || Number.isNaN(Number(n))) return "—";

    const num = Number(n);
    const tiers = [
      { value: 1e12, suffix: "T" },
      { value: 1e9, suffix: "B" },
      { value: 1e6, suffix: "M" },
      { value: 1e3, suffix: "K" }
    ];

    for (const tier of tiers) {
      if (Math.abs(num) >= tier.value) {
        return (num / tier.value).toFixed(2).replace(/\.?0+$/, "") + tier.suffix;
      }
    }

    return String(num);
  }

  function fmtDateTime(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function formatRank(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? `#${n}` : "—";
  }

  function profileUrl(row) {
    const id = String(row.profile_key || row.user_id || row.username || "").trim();
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("clan", "WMSY");
    return `profile.html?${params.toString()}`;
  }

  async function fetchJson(url) {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function getClansCurrent() {
    if (!clansCurrentPromise) {
      clansCurrentPromise = fetchJson(CLANS_API_CURRENT_URL).catch(err => {
        clansCurrentPromise = null;
        throw err;
      });
    }
    return clansCurrentPromise;
  }

  function sortRows(rows) {
    const list = rows.slice();
    list.sort((a, b) => {
      const av = a[wmsySortKey];
      const bv = b[wmsySortKey];
      const an = Number(av);
      const bn = Number(bv);
      let result;

      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        result = an - bn;
      } else {
        result = String(av || "").localeCompare(String(bv || ""));
      }

      return wmsySortAsc ? result : -result;
    });
    return list;
  }

  function visibleWmsyRows() {
    let rows = wmsyRows.slice();
    const q = wmsySearch.trim().toLowerCase();

    if (q) {
      rows = rows.filter(row =>
        String(row.username || "").toLowerCase().includes(q) ||
        String(row.user_id || "").includes(q)
      );
    }

    return sortRows(rows);
  }

  function renderWmsyLeaderboard() {
    if (!isWmsy() || !isIndexPage()) return;

    const tbody = document.getElementById("leaderboard-body");
    if (!tbody) return;

    const rows = visibleWmsyRows();

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#8b949e;">No WMSY players found.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(row => {
      const avatar = escapeHtml(row.avatar_url || DEFAULT_AVATAR_SVG);
      const fallback = escapeHtml(DEFAULT_AVATAR_SVG);

      return `
        <tr>
          <td class="rank">#${escapeHtml(row.rank ?? "—")}</td>
          <td>
            <a class="player-cell" href="${escapeHtml(profileUrl(row))}">
              <img class="avatar" src="${avatar}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">
              <div><div class="player-name">${escapeHtml(row.username || "Unknown")}</div></div>
            </a>
          </td>
          <td class="num" title="${fmtNum(row.total_points)}">${fmtShortNum(row.total_points)}</td>
          <td class="num" title="${fmtNum(row.gain_5m)}">${fmtShortNum(row.gain_5m)}</td>
          <td class="num" title="${fmtNum(row.gain_1h)}">${fmtShortNum(row.gain_1h)}</td>
          <td class="num" title="${fmtNum(row.gain_12h)}">${fmtShortNum(row.gain_12h)}</td>
          <td class="num" title="${fmtNum(row.gain_24h)}">${fmtShortNum(row.gain_24h)}</td>
        </tr>
      `;
    }).join("");
  }

  async function loadWmsyLeaderboard() {
    if (!isWmsy() || !isIndexPage() || wmsyLoading) return;

    wmsyLoading = true;
    try {
      wmsyData = await fetchJson(`${MEMBER_API_CURRENT_URL}?clan=WMSY`);
      wmsyRows = Array.isArray(wmsyData?.rows) ? wmsyData.rows.slice() : [];
      renderWmsyLeaderboard();
      applyTrackedClanCards();
    } catch (err) {
      console.warn("WMSY leaderboard refresh failed", err);
    } finally {
      wmsyLoading = false;
    }
  }

  async function applyTrackedClanCards() {
    const clan = currentClan();
    const rankEl = document.getElementById("c0ld-rank-value");
    const projectionEl = document.getElementById("projected-rank-value");
    const rankLabel = document.getElementById("tracked-rank-label");
    const title = document.getElementById("leaderboard-title");
    const dbUpdate = document.getElementById("db-update-value");

    if (rankLabel) rankLabel.textContent = `${clan.label} Current Rank`;
    if (title) title.textContent = `${clan.label} Leaderboard`;

    if (clan.key !== "wmsy") return;

    let rank = wmsyData?.clan_rank ?? null;
    let projectedRank = wmsyData?.projected_rank ?? null;

    try {
      const data = await getClansCurrent();
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const row = rows.find(item => normalizeText(item.clan_name) === "wmsy");
      if (row) {
        rank = row.rank ?? rank;
        projectedRank = row.projected_rank ?? projectedRank ?? row.rank;
      }
    } catch (err) {
      console.warn("Clan rank/projection refresh failed", err);
    }

    if (rankEl) rankEl.textContent = formatRank(rank);
    if (projectionEl) projectionEl.textContent = formatRank(projectedRank);
    if (dbUpdate && wmsyData?.snapshot_at) dbUpdate.textContent = fmtDateTime(wmsyData.snapshot_at);
  }

  function applyProfileRedScheme() {
    if (!isProfilePage() || document.getElementById("clan-profile-red-scheme")) return;

    const style = document.createElement("style");
    style.id = "clan-profile-red-scheme";
    style.textContent = `
      :root { --link: #ff9b96 !important; }
      .menu-btn.active {
        border-color: #ff9b96 !important;
        color: #ff9b96 !important;
        background: rgba(248, 81, 73, 0.12) !important;
      }
      .menu-btn:hover,
      select:hover,
      select:focus {
        border-color: #ff9b96 !important;
        color: #ff9b96 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function wireWmsyControls() {
    if (!isWmsy() || !isIndexPage() || document.body.dataset.wmsyControlsWired === "1") return;
    document.body.dataset.wmsyControlsWired = "1";

    const search = document.getElementById("search");
    if (search) {
      search.addEventListener("input", () => {
        wmsySearch = search.value || "";
        window.setTimeout(renderWmsyLeaderboard, 0);
      });
    }

    const refresh = document.getElementById("refresh");
    if (refresh) {
      refresh.addEventListener("click", () => {
        wmsyRows = [];
        wmsyData = null;
        loadWmsyLeaderboard();
      });
    }

    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (wmsySortKey === key) {
          wmsySortAsc = !wmsySortAsc;
        } else {
          wmsySortKey = key;
          wmsySortAsc = key === "username";
        }
        window.setTimeout(renderWmsyLeaderboard, 0);
      });
    });
  }

  function applyClanSwitcher() {
    const clan = currentClan();

    applyProfileRedScheme();

    const logo = document.querySelector("#site-mascot, .site-logo");
    if (logo) {
      logo.src = clan.mascot;
      logo.alt = clan.label;
    }

    const logoLink = document.querySelector("#clan-mascot-link, .site-logo-link");
    if (logoLink) {
      logoLink.href = clan.switchHome;
      logoLink.setAttribute("aria-label", `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`);
      logoLink.title = `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`;
    }

    document.querySelectorAll(".menu-bar a, [data-clan-link]").forEach(link => {
      const href = link.getAttribute("href") || "";
      link.href = withClanParam(href, clan);

      const text = String(link.textContent || "").trim();
      if (/^(c0ld|WMSY)\s+Leaderboard$/i.test(text)) {
        link.textContent = `${clan.label} Leaderboard`;
      }
    });

    applyTrackedClanCards();
    wireWmsyControls();
    loadWmsyLeaderboard();
    renderWmsyLeaderboard();
  }

  function scheduleApply() {
    applyClanSwitcher();
    [250, 1000, 2500, 5000].forEach(delay => window.setTimeout(applyClanSwitcher, delay));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleApply);
  } else {
    scheduleApply();
  }

  window.addEventListener("pageshow", scheduleApply);

  const observer = new MutationObserver(() => {
    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(() => {
      renderWmsyLeaderboard();
      applyTrackedClanCards();
    }, 100);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
