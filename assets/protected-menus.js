(function () {
  const AUTH_BASE = window.C0LD_AUTH_BASE || "https://c0ldauth.opal-dde.workers.dev";
  const TOKEN_KEY = "c0ld.discord.session";
  const GOLD = "#d29922";
  const GOLD_SOFT = "rgba(210,153,34,.14)";

  const MENUS = [
    {
      id: "officer",
      page: "officer-tools",
      label: "Officer Tools",
      items: [
        ["cw-import-gaps.html", "CW History Gaps"],
        ["award-candidates.html", "Award Candidates"]
      ]
    },
    {
      id: "wip",
      page: "wip-tools",
      label: "WIP",
      items: [
        ["activity.html", "Activity"],
        ["officers.html", "Officers"],
        ["application-review.html", "Application Review"],
        ["cinnamowopal.html", "Cinnamowopal"],
        ["home-draft.html", "Home Draft"],
        ["servers.html", "Servers"],
        ["macros.html", "Macros"]
      ]
    },
    {
      id: "archive",
      page: "archive-tools",
      label: "Archive",
      items: [
        ["server.html", "Server Detail"],
        ["players.html", "Legacy Players"],
        ["clan-filter.html", "Legacy Clan Filter"],
        ["c0ld-leagues.html", "c0ld Leagues"],
        ["c0ld-league-matches.html", "c0ld League Matches"],
        ["top-leagues.html", "Top Leagues"],
        ["league.html", "League Tracker"],
        ["league-profile.html", "League Profile"],
        ["yamo1-9.html", "YAMO1-9"],
        ["layok.html", "Layok Redirect"],
        ["wmsy.html", "WMSY Redirect"]
      ]
    }
  ];

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function currentFile() {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase();
  }

  function navRoot() {
    return document.querySelector(".menu-bar") || document.querySelector(".menu") || document.querySelector("nav");
  }

  function buttonClass(root) {
    if (root?.querySelector(".btn")) return "btn";
    return "menu-btn";
  }

  async function isAllowed(page) {
    const authToken = token();
    if (!authToken) return false;
    try {
      const url = new URL("/auth/session", AUTH_BASE);
      url.searchParams.set("page", page);
      const response = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const payload = await response.json().catch(() => ({}));
      return response.ok && payload.allowed === true;
    } catch {
      return false;
    }
  }

  function ensureStyles() {
    if (document.getElementById("c0ld-protected-menu-style")) return;
    const style = document.createElement("style");
    style.id = "c0ld-protected-menu-style";
    style.textContent = `
      .c0ld-protected-menu>.lookup-summary,
      .c0ld-protected-menu>.menu-btn,
      .c0ld-protected-menu>.btn{border-color:${GOLD}!important;color:${GOLD}!important;background:${GOLD_SOFT}!important}
      .c0ld-protected-menu>.lookup-summary:hover,
      .c0ld-protected-menu>.menu-btn:hover,
      .c0ld-protected-menu>.btn:hover{border-color:${GOLD}!important;color:${GOLD}!important;background:rgba(210,153,34,.22)!important}
      .c0ld-protected-menu .lookup-menu-list{border-color:rgba(210,153,34,.48)!important}
      .c0ld-protected-menu .menu-btn.active,
      .c0ld-protected-menu .btn.active{border-color:${GOLD}!important;color:${GOLD}!important;background:${GOLD_SOFT}!important}
    `;
    document.head.appendChild(style);
  }

  function menuHtml(menu, klass) {
    const active = menu.items.some(([href]) => href.toLowerCase() === currentFile());
    return `
      <details class="lookup-menu c0ld-protected-menu c0ld-${menu.id}-menu">
        <summary class="${klass} lookup-summary ${active ? "active" : ""}">${menu.label}</summary>
        <div class="lookup-menu-list">
          ${menu.items.map(([href, label]) => `<a class="${klass} ${href.toLowerCase() === currentFile() ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </div>
      </details>
    `;
  }

  async function renderMenus() {
    const root = navRoot();
    if (!root || root.dataset.protectedMenusLoaded === "1") return;
    if (!token()) return;

    const allowed = await Promise.all(MENUS.map(menu => isAllowed(menu.page)));
    const visibleMenus = MENUS.filter((_, index) => allowed[index]);
    if (!visibleMenus.length) return;

    ensureStyles();
    const klass = buttonClass(root);
    root.insertAdjacentHTML("beforeend", visibleMenus.map(menu => menuHtml(menu, klass)).join(""));
    root.dataset.protectedMenusLoaded = "1";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMenus);
  } else {
    renderMenus();
  }
})();
