(function () {
  "use strict";

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const leaderboardPages = new Set(["index.html", "", "clans.html", "global-leaderboard.html"]);
  const leaguePages = new Set(["c0ld-leagues.html", "c0ld-league-matches.html", "league.html", "league-profile.html"]);

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

  const c0ldLeaguesLink = makeLink("c0ld Leagues", "c0ld-leagues.html", leaguePages.has(currentPage));
  c0ldLeaguesLink.classList.add("site-c0ld-leagues-link");
  const topLeaguesLink = makeLink("Top Leagues", "top-leagues.html", currentPage === "top-leagues.html");
  topLeaguesLink.classList.add("site-top-leagues-link");

  menu.insertBefore(leaderboardMenu, c0ldLink);
  c0ldLink.remove();
  clansLink.remove();
  globalLink.remove();

  const insertionPoint = toolsMenu && toolsMenu.parentElement === menu ? toolsMenu : null;
  menu.insertBefore(c0ldLeaguesLink, insertionPoint);
  menu.insertBefore(topLeaguesLink, insertionPoint);

  const style = document.createElement("style");
  style.id = "site-navigation-style";
  style.textContent = `
    .site-leaderboards-menu{position:relative;display:inline-block}
    .site-leaderboards-menu>summary{list-style:none;cursor:pointer;white-space:nowrap}
    .site-leaderboards-menu>summary::-webkit-details-marker{display:none}
    .site-leaderboards-list{display:none;position:absolute;top:calc(100% + 6px);left:0;right:auto;z-index:100;min-width:190px;padding:6px;border:1px solid var(--border,#30363d);border-radius:8px;background:var(--panel,#161b22);box-shadow:0 10px 24px rgba(0,0,0,.45)}
    .site-leaderboards-menu[open]>.site-leaderboards-list{display:flex;flex-direction:column;gap:4px}
    .site-leaderboards-list>a{display:block;white-space:nowrap;text-align:left}
  `;
  document.head.appendChild(style);

  document.addEventListener("click", (event) => {
    if (!leaderboardMenu.contains(event.target)) leaderboardMenu.removeAttribute("open");
  });
})();
