(function () {
  "use strict";

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const leaderboardPages = new Set(["index.html", "", "clans.html", "global-leaderboard.html"]);
  const c0ldLeaguePages = new Set(["c0ld-leagues.html", "c0ld-league-matches.html"]);

  function pageName(href) {
    try {
      return (new URL(href, window.location.href).pathname.split("/").pop() || "index.html").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function labeledNavAnchor(page, label) {
    return Array.from(document.querySelectorAll("a[href]")).find((link) =>
      pageName(link.href) === page && label.test(link.textContent || "")
    );
  }

  const c0ldLink = document.getElementById("tab-btn-leaderboard") || labeledNavAnchor("index.html", /c0ld leaderboard/i);
  const clansLink = labeledNavAnchor("clans.html", /clans leaderboard/i);
  const globalLink = labeledNavAnchor("global-leaderboard.html", /global leaderboard/i);
  if (!c0ldLink || !clansLink || !globalLink) return;

  const menu = c0ldLink.parentElement;
  if (!menu || clansLink.parentElement !== menu || globalLink.parentElement !== menu) return;

  const toolsMenu = Array.from(menu.children).find((node) =>
    node.tagName === "DETAILS" && /tools/i.test(node.querySelector("summary")?.textContent || "")
  );
  const inheritedClass = String(clansLink.className || globalLink.className || c0ldLink.className || "menu-btn")
    .split(/\s+/)
    .filter((name) => name && name !== "active")
    .join(" ");

  function makeLink(label, href, active) {
    const link = document.createElement("a");
    link.className = inheritedClass;
    link.href = href;
    link.textContent = label;
    if (active) link.classList.add("active");
    return link;
  }

  const leaderboardMenu = document.createElement("details");
  leaderboardMenu.className = "lookup-menu site-leaderboards-menu";

  const leaderboardSummary = document.createElement("summary");
  leaderboardSummary.className = `${inheritedClass} lookup-summary`.trim();
  leaderboardSummary.textContent = "Leaderboards";
  leaderboardSummary.setAttribute("aria-label", "Leaderboards");
  if (leaderboardPages.has(currentPage)) leaderboardSummary.classList.add("active");

  const leaderboardList = document.createElement("div");
  leaderboardList.className = "lookup-menu-list lookup-panel site-leaderboards-list";
  leaderboardList.append(
    makeLink("c0ld Leaderboard", "index.html", currentPage === "index.html" || currentPage === ""),
    makeLink("Clans Leaderboard", "clans.html", currentPage === "clans.html"),
    makeLink("Global Leaderboard", "global-leaderboard.html", currentPage === "global-leaderboard.html")
  );
  leaderboardMenu.append(leaderboardSummary, leaderboardList);

  const c0ldLeaguesLink = makeLink("c0ld Leagues", "c0ld-leagues.html", c0ldLeaguePages.has(currentPage));
  c0ldLeaguesLink.classList.add("site-c0ld-leagues-link");
  const soloLeaderboardLink = makeLink("Solo Leaderboard", "solo-leaderboard.html", currentPage === "solo-leaderboard.html");
  soloLeaderboardLink.classList.add("site-solo-leaderboard-link");
  const leagueLeaderboardLink = makeLink("League Leaderboard", "league-leaderboard.html", currentPage === "league-leaderboard.html");
  leagueLeaderboardLink.classList.add("site-league-leaderboard-link");

  menu.insertBefore(leaderboardMenu, c0ldLink);
  c0ldLink.remove();
  clansLink.remove();
  globalLink.remove();

  const insertionPoint = toolsMenu && toolsMenu.parentElement === menu ? toolsMenu : null;
  menu.insertBefore(c0ldLeaguesLink, insertionPoint);
  menu.insertBefore(soloLeaderboardLink, insertionPoint);
  menu.insertBefore(leagueLeaderboardLink, insertionPoint);

  const style = document.createElement("style");
  style.id = "site-navigation-style";
  style.textContent = `
    .menu,.menu-bar{align-items:center}
    .menu .lookup-menu,.menu-bar .lookup-menu{position:relative;display:inline-block}
    .menu .lookup-menu>summary,.menu-bar .lookup-menu>summary{
      display:inline-block;
      list-style:none!important;
      cursor:pointer;
      white-space:nowrap;
      padding:7px 12px;
      border:1px solid var(--border,#30363d);
      border-radius:5px;
      background:var(--panel-2,#0f141b);
      color:var(--text,#e6edf3);
      font-size:13px;
      line-height:normal;
      box-sizing:border-box;
    }
    .menu .lookup-menu>summary::marker,.menu-bar .lookup-menu>summary::marker{content:""}
    .menu .lookup-menu>summary::-webkit-details-marker,.menu-bar .lookup-menu>summary::-webkit-details-marker{display:none}
    .menu .lookup-menu>summary.active,.menu-bar .lookup-menu>summary.active,
    .menu>a.active,.menu-bar>a.active{
      border-color:var(--link,#ff9b96);
      color:var(--link,#ff9b96);
      background:rgba(248,81,73,.12)
    }
    .menu .lookup-menu-list,.menu-bar .lookup-menu-list{
      display:none;
      position:absolute;
      top:calc(100% + 6px);
      right:0;
      z-index:100;
      min-width:190px;
      padding:6px;
      border:1px solid var(--border,#30363d);
      border-radius:8px;
      background:var(--panel,#161b22);
      box-shadow:0 10px 24px rgba(0,0,0,.45)
    }
    .menu .lookup-menu[open]>.lookup-menu-list,.menu-bar .lookup-menu[open]>.lookup-menu-list{
      display:flex;
      flex-direction:column;
      gap:4px
    }
    .menu .lookup-menu-list>a,.menu-bar .lookup-menu-list>a{display:block;white-space:nowrap;text-align:left}
    .menu .site-leaderboards-list,.menu-bar .site-leaderboards-list{left:0;right:auto}
  `;
  document.head.appendChild(style);

  document.addEventListener("click", (event) => {
    if (!leaderboardMenu.contains(event.target)) leaderboardMenu.removeAttribute("open");
  });
})();
