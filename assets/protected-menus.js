(function () {
  const TOKEN_KEY = "c0ld.discord.session";
  const GOLD = "#d29922";
  const GOLD_SOFT = "rgba(210,153,34,.14)";
  const AUTH_LINK = ["auth.html", "Auth"];

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
        ["c0ld-league-matches.html", "c0ld League Matches"],
        ["league.html", "League Tracker"],
        ["yamo1-9.html", "YAMO1-9"],
        ["layok.html", "Layok Redirect"],
        ["wmsy.html", "WMSY Redirect"]
      ]
    }
  ];

  function cleanUrlHash(paramsToRemove) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    for (const key of paramsToRemove) params.delete(key);
    const nextHash = params.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
    window.history.replaceState(null, "", url.toString());
  }

  function consumeCallbackToken() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const sessionToken = params.get("c0ld_token");
    const denied = params.get("c0ld_auth") === "denied";

    if (sessionToken) {
      sessionStorage.setItem(TOKEN_KEY, sessionToken);
      cleanUrlHash(["c0ld_token", "c0ld_page"]);
    } else if (denied) {
      cleanUrlHash(["c0ld_auth", "c0ld_page"]);
    }

    return { token: sessionToken, denied };
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

  function toolsMenu(root) {
    return [...root.querySelectorAll("details.lookup-menu")]
      .find(details => !details.classList.contains("c0ld-protected-menu")
        && details.querySelector("summary")?.textContent?.trim().toLowerCase() === "tools");
  }

  function ensureAuthLink(root) {
    const menu = toolsMenu(root);
    const list = menu?.querySelector(".lookup-menu-list");
    if (!list || list.querySelector('a[href="auth.html"]')) return;

    const klass = buttonClass(root);
    const link = document.createElement("a");
    link.className = `${klass} ${currentFile() === AUTH_LINK[0] ? "active" : ""}`.trim();
    link.href = AUTH_LINK[0];
    link.textContent = AUTH_LINK[1];
    list.appendChild(link);
  }

  function menuHasCurrentFile(menu) {
    const file = currentFile();
    return menu.items.some(([href]) => href.toLowerCase() === file);
  }

  function contextualMenus() {
    const officer = MENUS.find(menu => menu.id === "officer");
    const wip = MENUS.find(menu => menu.id === "wip");
    const archive = MENUS.find(menu => menu.id === "archive");

    if (wip && menuHasCurrentFile(wip)) return [officer, wip].filter(Boolean);
    if (officer && menuHasCurrentFile(officer)) return [officer];
    if (archive && menuHasCurrentFile(archive)) return [archive];
    return [];
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

  function renderMenus() {
    const root = navRoot();
    if (!root || root.dataset.protectedMenusLoading === "1") return;

    consumeCallbackToken();
    ensureAuthLink(root);
    root.querySelectorAll(".c0ld-protected-menu").forEach(menu => menu.remove());
    root.dataset.protectedMenusLoaded = "0";

    const visibleMenus = contextualMenus();
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

  window.C0LD_PROTECTED_MENUS = {
    render: renderMenus,
    menus: MENUS
  };
})();
