(() => {
  const CLANS = {
    c0ld: {
      key: "c0ld",
      label: "c0ld",
      mascot: "assets/c0ld-kitsune-logo.gif",
      home: "index.html",
      switchHome: "index.html?clan=WMSY"
    },
    wmsy: {
      key: "wmsy",
      label: "WMSY",
      mascot: "assets/mascots/wmsy-frog.png",
      home: "index.html?clan=WMSY",
      switchHome: "index.html"
    }
  };

  const CLANS_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  let clansCurrentPromise = null;
  let cardRefreshTimer = null;

  function normalizeClanKey(value) {
    return String(value || "c0ld").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function currentClan() {
    const params = new URLSearchParams(window.location.search);
    return normalizeClanKey(params.get("clan")) === "wmsy" ? CLANS.wmsy : CLANS.c0ld;
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

  function formatRank(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? `#${n}` : "—";
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function isProfilePage() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    return page === "profile.html";
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

  function getClansCurrent() {
    if (!clansCurrentPromise) {
      clansCurrentPromise = fetch(`${CLANS_API_CURRENT_URL}?v=${Date.now()}`, { cache: "no-store" })
        .then(res => {
          if (!res.ok) throw new Error(`Could not load clans current. HTTP ${res.status}`);
          return res.json();
        })
        .catch(err => {
          clansCurrentPromise = null;
          throw err;
        });
    }

    return clansCurrentPromise;
  }

  async function applyTrackedClanCards() {
    const rankEl = document.getElementById("c0ld-rank-value");
    const projectionEl = document.getElementById("projected-rank-value");
    const rankLabel = document.getElementById("tracked-rank-label");

    if (!rankEl && !projectionEl && !rankLabel) return;

    const clan = currentClan();

    if (rankLabel) {
      rankLabel.textContent = `${clan.label} Current Rank`;
    }

    try {
      const data = await getClansCurrent();
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const row = rows.find(item => normalizeText(item.clan_name) === normalizeText(clan.label));

      if (!row) return;

      if (rankEl) rankEl.textContent = formatRank(row.rank);
      if (projectionEl) projectionEl.textContent = formatRank(row.projected_rank ?? row.rank);
    } catch (err) {
      console.warn("Clan rank/projection refresh failed", err);
    }
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
  }

  function scheduleApply() {
    applyClanSwitcher();

    [250, 1000, 2500, 5000].forEach(delay => {
      window.setTimeout(applyClanSwitcher, delay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleApply);
  } else {
    scheduleApply();
  }

  window.addEventListener("pageshow", scheduleApply);

  const observer = new MutationObserver(() => {
    window.clearTimeout(cardRefreshTimer);
    cardRefreshTimer = window.setTimeout(applyTrackedClanCards, 100);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
