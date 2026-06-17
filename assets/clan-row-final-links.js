(() => {
  let applyTimer = null;
  let isApplying = false;

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isClansPage() {
    return currentPage() === "clans.html";
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function slugify(value) {
    const slug = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "clan";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clanPageHref(clanName) {
    const name = String(clanName || "").trim();
    const suffix = normalize(name) === "wmsy" ? "?clan=WMSY" : "";
    return `clans/${slugify(name)}/${suffix}`;
  }

  function ensureStyle() {
    if (document.getElementById("clan-row-final-link-styles")) return;

    const style = document.createElement("style");
    style.id = "clan-row-final-link-styles";
    style.textContent = `
      #clans-tbody td.clan {
        cursor: pointer !important;
      }

      #clans-tbody a.clan-final-link {
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        color: inherit !important;
        text-decoration: none !important;
        cursor: pointer !important;
        max-width: 100% !important;
      }

      #clans-tbody a.clan-final-link:hover .clan-name,
      #clans-tbody a.clan-final-link:focus .clan-name {
        text-decoration: underline !important;
      }

      #clans-tbody a.clan-final-link:focus-visible {
        outline: 2px solid var(--link, #58a6ff) !important;
        outline-offset: 3px !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function extractClanName(td) {
    return String(
      td.querySelector(".clan-name")?.textContent ||
      td.textContent ||
      ""
    ).trim();
  }

  function normalizeClanCell(td) {
    const clanName = extractClanName(td);
    if (!clanName) return;

    const href = clanPageHref(clanName);
    const existing = td.querySelector("a.clan-final-link");

    if (existing) {
      if (existing.getAttribute("href") !== href) existing.href = href;
      return;
    }

    const icon = td.querySelector(".clan-icon");
    const iconHtml = icon ? icon.outerHTML : "";
    const escapedName = escapeHtml(clanName);

    td.innerHTML = `
      <a class="clan-final-link" href="${href}" title="Open ${escapedName} clan profile">
        ${iconHtml}
        <span class="clan-name">${escapedName}</span>
      </a>
    `;
  }

  function applyClanRowLinks() {
    if (!isClansPage() || isApplying) return;

    isApplying = true;
    ensureStyle();

    document.querySelectorAll("#clans-tbody td.clan").forEach(normalizeClanCell);

    window.setTimeout(() => {
      isApplying = false;
    }, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyClanRowLinks);
  } else {
    applyClanRowLinks();
  }

  window.addEventListener("pageshow", applyClanRowLinks);

  const observer = new MutationObserver(() => {
    if (isApplying) return;
    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(applyClanRowLinks, 75);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
