(function () {
  "use strict";

  const CLAN_MODE_STORAGE_KEY = "c0ld:site-clan-mode";
  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const clanPages = new Set(["index.html", "clans.html", "global-leaderboard.html"]);
  const leaguePages = new Set([
    "c0ld-leagues.html",
    "c0ld-league-matches.html",
    "solo-leaderboard.html",
    "league-leaderboard.html",
    "compare-leagues.html",
    "top-leagues.html",
    "league.html",
    "league-profile.html",
    "league-inv-test.html",
    "yamo1-9.html"
  ]);
  const toolLinks = [
    ["top-clan-filter.html", "Top Clan Filter"],
    ["clans-activity.html", "Clans Activity"],
    ["activity-feed.html", "Activity Feed"],
    ["ps99-version-history.html", "PS99 Versions"],
    ["roblox-version-history.html", "Roblox Versions"],
    ["ps99-restart-tracker.html", "PS99 Restarts"],
    ["duck-recap.html", "Duck Recap"],
    ["live-clan.html", "Clan Lookup"],
    ["player-lookup.html", "Player Lookup"]
  ];
  const toolPages = new Set([
    ...toolLinks.map(([href]) => href),
    "auth.html",
    "loadout-optimizer.html",
    "award-candidates.html",
    "cw-import-gaps.html",
    "clan-activity-detail.html",
    "top-clan-filter-detail.html",
    "macros.html"
  ]);

  function navRoot() {
    return document.querySelector("header .menu-bar")
      || document.querySelector("header .menu")
      || document.querySelector("header nav");
  }

  function inheritedButtonClass(root) {
    if (root.querySelector(".menu-btn")) return "menu-btn";
    if (root.querySelector(".btn")) return "btn";
    return "menu-btn";
  }

  function currentClanMode() {
    const params = new URLSearchParams(window.location.search);
    const requested = String(params.get("clan") || "").trim().toLowerCase();
    if (requested === "wmsy") return "WMSY";
    if (params.has("clan")) return "c0ld";

    try {
      return String(window.localStorage.getItem(CLAN_MODE_STORAGE_KEY) || "").trim().toLowerCase() === "wmsy"
        ? "WMSY"
        : "c0ld";
    } catch {
      return "c0ld";
    }
  }

  function withClanMode(href) {
    const url = new URL(href, window.location.href);
    url.searchParams.set("clan", currentClanMode());
    return `${url.pathname.split("/").pop() || "index.html"}${url.search}${url.hash}`;
  }

  function makeLink(label, href, active, className) {
    const link = document.createElement("a");
    link.className = `${className} site-nav-control site-nav-link${active ? " active" : ""}`;
    link.href = withClanMode(href);
    link.textContent = label;
    if (href === "index.html") link.id = "tab-btn-leaderboard";
    if (href === "global-leaderboard.html") link.id = "global-nav-label";
    if (active) link.setAttribute("aria-current", "page");
    return link;
  }

  function makeMenu(label, links, active, className, extraClass) {
    const menu = document.createElement("details");
    menu.className = `lookup-menu site-nav-menu ${extraClass}`;

    const summary = document.createElement("summary");
    summary.className = `${className} lookup-summary site-nav-control${active ? " active" : ""}`;
    summary.textContent = label;
    summary.setAttribute("aria-label", `${label} menu`);

    const list = document.createElement("div");
    list.className = "lookup-menu-list lookup-panel site-nav-panel";
    links.forEach(([href, linkLabel]) => {
      list.appendChild(makeLink(linkLabel, href, currentPage === href, className));
    });

    menu.append(summary, list);
    return menu;
  }

  function installStyles() {
    if (document.getElementById("site-navigation-style")) return;
    const style = document.createElement("style");
    style.id = "site-navigation-style";
    style.textContent = `
      header{
        background:var(--panel,#161b22);
        border-bottom:1px solid var(--border,#30363d);
        padding:12px 22px 10px;
      }
      header .header-inner,
      header .logo-wrap{
        display:flex;
        justify-content:center;
        align-items:center;
        width:100%;
      }
      header .site-logo,
      header .brand-img{
        display:block;
        width:72px;
        max-width:72px;
        height:auto;
        max-height:72px;
        object-fit:contain;
        border-radius:10px;
        margin:0 auto;
      }
      header .c0ld-primary-nav{
        display:flex!important;
        justify-content:center;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
        width:100%;
        margin:9px auto 0;
      }
      header .c0ld-primary-nav>.site-nav-control,
      header .c0ld-primary-nav>.site-nav-menu>.site-nav-control{
        display:inline-flex!important;
        align-items:center;
        justify-content:center;
        min-height:32px;
        margin:0!important;
        padding:7px 12px!important;
        border:1px solid var(--border,#30363d)!important;
        border-radius:6px!important;
        background:var(--panel-2,#0d1117)!important;
        color:var(--text,#e6edf3)!important;
        font-family:Arial,Helvetica,sans-serif!important;
        font-size:13px!important;
        font-weight:400!important;
        line-height:16px!important;
        text-decoration:none!important;
        white-space:nowrap;
        box-sizing:border-box;
        cursor:pointer;
      }
      header .c0ld-primary-nav>.site-nav-control:hover,
      header .c0ld-primary-nav>.site-nav-menu>.site-nav-control:hover{
        border-color:var(--link,#ff9b96)!important;
        background:var(--hover,#1f2630)!important;
      }
      header .c0ld-primary-nav>.site-nav-control.active,
      header .c0ld-primary-nav>.site-nav-menu>.site-nav-control.active{
        border-color:var(--link,#ff9b96)!important;
        color:var(--link,#ff9b96)!important;
        background:rgba(248,81,73,.12)!important;
      }
      header .site-nav-menu{
        position:relative;
        display:inline-block;
        margin:0!important;
      }
      header .site-nav-menu>summary{
        list-style:none!important;
      }
      header .site-nav-menu>summary::marker{
        content:"";
      }
      header .site-nav-menu>summary::-webkit-details-marker{
        display:none;
      }
      header .site-nav-menu>summary::after{
        content:"";
        width:0;
        height:0;
        margin-left:7px;
        border-left:4px solid transparent;
        border-right:4px solid transparent;
        border-top:5px solid currentColor;
        opacity:.75;
        transition:transform .15s ease;
      }
      header .site-nav-menu[open]>summary::after{
        transform:rotate(180deg);
      }
      header .site-nav-panel{
        display:none!important;
        position:absolute!important;
        top:calc(100% + 7px)!important;
        left:0!important;
        right:auto!important;
        z-index:1000!important;
        min-width:205px!important;
        margin:0!important;
        padding:6px!important;
        border:1px solid var(--border,#30363d)!important;
        border-radius:8px!important;
        background:var(--panel,#161b22)!important;
        box-shadow:0 12px 28px rgba(0,0,0,.48)!important;
      }
      header .site-nav-menu[open]>.site-nav-panel{
        display:flex!important;
        flex-direction:column!important;
        gap:4px!important;
      }
      header .site-nav-panel>.site-nav-link{
        display:flex!important;
        justify-content:flex-start!important;
        width:100%!important;
        min-height:32px!important;
        margin:0!important;
        padding:7px 10px!important;
        border:1px solid transparent!important;
        border-radius:5px!important;
        background:transparent!important;
        color:var(--text,#e6edf3)!important;
        font-family:Arial,Helvetica,sans-serif!important;
        font-size:13px!important;
        line-height:16px!important;
        text-align:left!important;
        text-decoration:none!important;
        white-space:nowrap;
      }
      header .site-nav-panel>.site-nav-link:hover{
        border-color:var(--border,#30363d)!important;
        background:var(--hover,#1f2630)!important;
      }
      header .site-nav-panel>.site-nav-link.active{
        border-color:rgba(255,155,150,.5)!important;
        color:var(--link,#ff9b96)!important;
        background:rgba(248,81,73,.12)!important;
      }
      @media(max-width:720px){
        header{padding:10px 12px 9px}
        header .site-logo,
        header .brand-img{width:64px;max-width:64px;max-height:64px}
        header .c0ld-primary-nav{gap:6px;margin-top:8px}
        header .c0ld-primary-nav>.site-nav-control,
        header .c0ld-primary-nav>.site-nav-menu>.site-nav-control{
          min-height:30px;
          padding:6px 9px!important;
          font-size:12px!important;
        }
        header .site-nav-tools>.site-nav-panel{
          left:auto!important;
          right:0!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderNavigation() {
    const root = navRoot();
    if (!root) return;

    installStyles();
    const className = inheritedButtonClass(root);
    const clanMode = currentClanMode();
    const clanLinks = [
      ["index.html", `${clanMode} Leaderboard`],
      ["clans.html", "Clans Leaderboard"],
      ["global-leaderboard.html", "Global Leaderboard"]
    ];
    const leagueLinks = [
      ["c0ld-leagues.html", "c0ld Leagues"],
      ["solo-leaderboard.html", "Solo Leaderboard"],
      ["league-leaderboard.html", "League Leaderboard"],
      ["compare-leagues.html", "Compare Leagues"]
    ];

    root.classList.add("c0ld-primary-nav");
    root.replaceChildren(
      ...clanLinks.map(([href, label]) => makeLink(label, href, currentPage === href, className)),
      makeMenu("Leagues", leagueLinks, leaguePages.has(currentPage), className, "site-nav-leagues"),
      makeMenu("Tools", toolLinks, toolPages.has(currentPage), className, "site-nav-tools")
    );

    const menus = Array.from(root.querySelectorAll(".site-nav-menu"));
    menus.forEach((menu) => {
      menu.addEventListener("toggle", () => {
        if (!menu.open) return;
        menus.forEach((other) => {
          if (other !== menu) other.removeAttribute("open");
        });
      });
    });

    root.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) {
        menus.forEach((menu) => menu.removeAttribute("open"));
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) {
        menus.forEach((menu) => menu.removeAttribute("open"));
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const openMenu = menus.find((menu) => menu.open);
      if (!openMenu) return;
      openMenu.removeAttribute("open");
      openMenu.querySelector("summary")?.focus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderNavigation, { once: true });
  } else {
    renderNavigation();
  }
})();
