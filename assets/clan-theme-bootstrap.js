(() => {
  const STORAGE_KEY = "c0ld:site-clan-mode";
  const WMSY_MASCOT = "assets/mascots/wmsy-frog.png";

  function normalizeClanKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function requestedClanKey() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normalizeClanKey(params.get("clan"));

    if (fromUrl) {
      const selected = fromUrl === "wmsy" ? "wmsy" : "c0ld";
      try {
        window.localStorage.setItem(STORAGE_KEY, selected);
      } catch {
      }
      return selected;
    }

    try {
      return normalizeClanKey(window.localStorage.getItem(STORAGE_KEY)) === "wmsy"
        ? "wmsy"
        : "c0ld";
    } catch {
      return "c0ld";
    }
  }

  const clanKey = requestedClanKey();
  document.documentElement.dataset.clan = clanKey;

  if (clanKey !== "wmsy") return;

  const style = document.createElement("style");
  style.id = "clan-theme-bootstrap-styles";
  style.textContent = `
    html[data-clan="wmsy"] {
      --link: #74d99f !important;
      --accent: #74d99f !important;
    }

    html[data-clan="wmsy"] .menu-btn.active,
    html[data-clan="wmsy"] .menu-bar .menu-btn.active,
    html[data-clan="wmsy"] .tab-btn.active,
    html[data-clan="wmsy"] button.active,
    html[data-clan="wmsy"] [data-tab].active,
    html[data-clan="wmsy"] .lookup-summary.active,
    html[data-clan="wmsy"] header .c0ld-primary-nav > .site-nav-control.active,
    html[data-clan="wmsy"] header .c0ld-primary-nav > .site-nav-menu > .site-nav-control.active,
    html[data-clan="wmsy"] header .site-nav-panel > .site-nav-link.active {
      border-color: rgba(72, 187, 120, 0.78) !important;
      color: #74d99f !important;
      background: rgba(72, 187, 120, 0.14) !important;
    }
  `;
  document.head.appendChild(style);

  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "image";
  preload.href = WMSY_MASCOT;
  document.head.appendChild(preload);

  function applyWmsyMascot() {
    const logo = document.querySelector(
      "#site-mascot, header .site-logo, header .brand-img, header img.logo"
    );
    if (!logo) return false;

    logo.src = WMSY_MASCOT;
    logo.alt = "WMSY";
    return true;
  }

  if (!applyWmsyMascot()) {
    const observer = new MutationObserver(() => {
      if (applyWmsyMascot()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("DOMContentLoaded", () => observer.disconnect(), { once: true });
  }
})();
