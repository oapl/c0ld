(() => {
  const STYLE_ID = "header-logo-height-lock-styles";

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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  window.addEventListener("pageshow", install);
})();
