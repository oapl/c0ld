(() => {
  const STYLE_ID = "header-logo-height-lock-styles";
  const TOP_LEAGUES_HREF = "top-leagues.html";
  const TOP_LEAGUES_TEXT = "Top 100 Leagues";

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function install() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        header .header-inner {
          min-height: 78px !important;
          align-items: center !important;
          justify-content: center !important;
        }

        header .site-logo-link {
          width: 96px !important;
          height: 72px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 96px !important;
          line-height: 0 !important;
        }

        header .site-logo {
          width: auto !important;
          height: 68px !important;
          max-width: 96px !important;
          max-height: 68px !important;
          object-fit: contain !important;
          display: block !important;
        }

        header .menu-bar,
        header .menu {
          margin-top: 9px !important;
        }
      `;
      document.head.appendChild(style);
    }

    ensureTopLeaguesMenuLink();
  }

  function findMenu() {
    return document.querySelector("header .menu-bar") || document.querySelector("header .menu") || document.querySelector(".menu-bar") || document.querySelector(".menu");
  }

  function hasTopLeaguesLink(menu) {
    return Boolean(menu?.querySelector(`a[href=\"${TOP_LEAGUES_HREF}\"]`));
  }

  function menuButtonClass(menu) {
    const existing = menu?.querySelector("a.menu-btn");
    return existing ? "menu-btn" : "";
  }

  function ensureTopLeaguesMenuLink() {
    const menu = findMenu();
    if (!menu || hasTopLeaguesLink(menu)) return;

    const link = document.createElement("a");
    link.href = TOP_LEAGUES_HREF;
    link.textContent = TOP_LEAGUES_TEXT;

    const className = menuButtonClass(menu);
    if (className) link.className = className;
    if (currentPage() === TOP_LEAGUES_HREF) link.classList.add("active");

    const yamoLink = menu.querySelector('a[href="yamo.html"]');
    const clansLink = menu.querySelector('a[href="clans.html"]');

    if (yamoLink) yamoLink.insertAdjacentElement("afterend", link);
    else if (clansLink) clansLink.insertAdjacentElement("beforebegin", link);
    else menu.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  window.addEventListener("pageshow", install);
})();
