(() => {
  const CLANS_API_CURRENT_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/current";
  let timer = null;
  let currentPromise = null;

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function isClansPage() {
    return currentPage() === "clans.html";
  }

  function isClanLookupPage() {
    return currentPage() === "live-clan.html";
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

  function clanPageHref(clanName) {
    const name = String(clanName || "").trim();
    const suffix = normalize(name) === "wmsy" ? "?clan=WMSY" : "";
    return `clans/${slugify(name)}/${suffix}`;
  }

  async function getCurrentClans() {
    if (!currentPromise) {
      currentPromise = fetch(`${CLANS_API_CURRENT_URL}?v=${Date.now()}`, { cache: "no-store" })
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
        .catch(err => {
          currentPromise = null;
          throw err;
        });
    }
    return currentPromise;
  }

  function ensureStyle() {
    if (document.getElementById("clan-page-link-overrides")) return;
    const style = document.createElement("style");
    style.id = "clan-page-link-overrides";
    style.textContent = `
      #clans-tbody a.clan-profile-link,
      .lookup-clan-profile-link {
        color: inherit !important;
        text-decoration: none !important;
      }

      #clans-tbody a.clan-profile-link:hover .clan-name,
      .lookup-clan-profile-link:hover {
        text-decoration: underline !important;
      }

      #clans-tbody .clan-cell {
        cursor: pointer;
      }

      #card-clan .lookup-clan-profile-link,
      #clan-title .lookup-clan-profile-link {
        color: inherit !important;
        font-weight: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  function linkClansTable() {
    if (!isClansPage()) return;
    ensureStyle();

    document.querySelectorAll("#clans-tbody .clan-cell").forEach(cell => {
      const name = cell.querySelector(".clan-name")?.textContent?.trim();
      if (!name) return;

      let link = cell.closest("a.clan-profile-link");
      if (!link) {
        link = document.createElement("a");
        link.className = "clan-profile-link";
        cell.parentNode.insertBefore(link, cell);
        link.appendChild(cell);
      }

      link.href = clanPageHref(name);
      link.title = `Open ${name} clan profile`;
    });
  }

  function wrapLookupText(el, clanName) {
    if (!el || !clanName || clanName === "—" || clanName === "No clan loaded") return;

    const existing = el.querySelector("a.lookup-clan-profile-link");
    if (existing && normalize(existing.textContent) === normalize(clanName)) {
      existing.href = clanPageHref(clanName);
      return;
    }

    el.innerHTML = `<a class="lookup-clan-profile-link" href="${clanPageHref(clanName)}" title="Open ${clanName} clan profile"></a>`;
    el.querySelector("a").textContent = clanName;
  }

  async function improveLookupHeaderIcon(clanName) {
    const icon = document.getElementById("clan-icon");
    if (!icon || !clanName || clanName === "—") return;

    try {
      const data = await getCurrentClans();
      const row = (data.rows || []).find(item => normalize(item.clan_name) === normalize(clanName));
      if (row?.icon_url && icon.src !== row.icon_url) {
        icon.src = row.icon_url;
      }
    } catch {
      // Keep the lookup worker icon or fallback if the top-200 API is unavailable.
    }
  }

  function linkLookupResult() {
    if (!isClanLookupPage()) return;
    ensureStyle();

    const card = document.getElementById("card-clan");
    const title = document.getElementById("clan-title");
    const clanName = String(card?.textContent || title?.textContent || "").trim();

    if (!clanName || clanName === "—" || clanName === "No clan loaded") return;

    wrapLookupText(card, clanName);
    wrapLookupText(title, clanName);
    improveLookupHeaderIcon(clanName);
  }

  function apply() {
    linkClansTable();
    linkLookupResult();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }

  window.addEventListener("pageshow", apply);

  const observer = new MutationObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(apply, 100);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
