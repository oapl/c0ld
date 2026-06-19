(() => {
  const CONFIG_URL = "Data/announcement.json";
  const BANNER_ID = "site-announcement-banner";
  const STYLE_ID = "site-announcement-styles";

  function isEnabled(value) {
    return value === true || String(value || "").toLowerCase() === "true";
  }

  function safeText(value) {
    return String(value ?? "").trim();
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID} {
        max-width: 1200px;
        margin: 8px auto 0;
        padding: 5px 0 7px;
        min-height: 22px;
        line-height: 14px;
        font-size: 12px;
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--muted, #8b949e);
        border-top: 1px solid var(--border, #30363d);
        border-bottom: 1px solid var(--border, #30363d);
      }
      #${BANNER_ID}.announcement-info { color: var(--muted, #8b949e); }
      #${BANNER_ID}.announcement-warning { color: #f2cc60; }
      #${BANNER_ID}.announcement-danger { color: #ff9b96; }
      #${BANNER_ID} a {
        color: inherit;
        text-decoration: none;
      }
      #${BANNER_ID} a:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }

  function findMenuBar() {
    return document.querySelector("header .menu-bar") || document.querySelector(".menu-bar");
  }

  function removeBanner() {
    document.getElementById(BANNER_ID)?.remove();
  }

  function renderBanner(config) {
    const message = safeText(config?.message || config?.text || config?.announcement);
    if (!isEnabled(config?.enabled) || !message) {
      removeBanner();
      return;
    }

    const menuBar = findMenuBar();
    if (!menuBar) return;

    addStyles();
    removeBanner();

    const banner = document.createElement("div");
    const level = safeText(config?.level || config?.type || "info").toLowerCase();
    banner.id = BANNER_ID;
    banner.className = `announcement-${["info", "warning", "danger"].includes(level) ? level : "info"}`;

    const href = safeText(config?.href || config?.url || config?.link);
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = message;
      a.title = message;
      const target = safeText(config?.target || "_self");
      a.target = target;
      if (target === "_blank") a.rel = "noopener noreferrer";
      banner.appendChild(a);
    } else {
      banner.textContent = message;
      banner.title = message;
    }

    menuBar.insertAdjacentElement("afterend", banner);
  }

  async function loadAnnouncement() {
    try {
      const res = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) {
        removeBanner();
        return;
      }
      const config = await res.json();
      renderBanner(config);
    } catch (err) {
      removeBanner();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAnnouncement);
  } else {
    loadAnnouncement();
  }

  window.addEventListener("pageshow", loadAnnouncement);
})();
