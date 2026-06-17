(() => {
  const CLANS = {
    c0ld: {
      key: "c0ld",
      label: "c0ld",
      mascot: "assets/c0ld-kitsune-logo.gif",
      home: "index.html",
      switchHome: "index.html?clan=WMSY"
    },
    wmsy: {
      key: "wmsy",
      label: "WMSY",
      mascot: "assets/mascots/wmsy-frog.png",
      home: "index.html?clan=WMSY",
      switchHome: "index.html"
    }
  };

  function normalizeClanKey(value) {
    return String(value || "c0ld")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function currentClan() {
    const params = new URLSearchParams(window.location.search);
    return normalizeClanKey(params.get("clan")) === "wmsy" ? CLANS.wmsy : CLANS.c0ld;
  }

  function splitUrl(url) {
    const raw = String(url || "").trim();
    const [pathAndQuery, hash = ""] = raw.split("#");
    const [path = "", query = ""] = pathAndQuery.split("?");
    return { path, query, hash: hash ? `#${hash}` : "" };
  }

  function isLocalHtmlLink(href) {
    if (!href) return false;
    const value = String(href).trim();
    if (!value || value.startsWith("#")) return false;
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(value)) return false;
    return /(^|\/)[^/?#]+\.html(?:[?#].*)?$/.test(value) || value === "index.html" || value.startsWith("index.html?");
  }

  function withClanParam(href, clan) {
    if (!isLocalHtmlLink(href)) return href;

    const parts = splitUrl(href);
    let page = parts.path.split("/").pop() || "index.html";

    if (page === "wmsy.html") {
      page = "index.html";
    }

    const params = new URLSearchParams(parts.query);

    if (clan.key === "wmsy") {
      params.set("clan", clan.label);
    } else {
      params.delete("clan");
    }

    const query = params.toString();
    return `${page}${query ? `?${query}` : ""}${parts.hash}`;
  }

  function applyClanSwitcher() {
    const clan = currentClan();

    const logo = document.querySelector("#site-mascot, .site-logo");
    if (logo) {
      logo.src = clan.mascot;
      logo.alt = clan.label;
    }

    const logoLink = document.querySelector("#clan-mascot-link, .site-logo-link");
    if (logoLink) {
      logoLink.href = clan.switchHome;
      logoLink.setAttribute("aria-label", `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`);
      logoLink.title = `Switch to ${clan.key === "wmsy" ? "c0ld" : "WMSY"} leaderboard`;
    }

    document.querySelectorAll(".menu-bar a, [data-clan-link]").forEach(link => {
      const href = link.getAttribute("href") || "";
      link.href = withClanParam(href, clan);

      const text = String(link.textContent || "").trim();
      if (/^(c0ld|WMSY)\s+Leaderboard$/i.test(text)) {
        link.textContent = `${clan.label} Leaderboard`;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyClanSwitcher);
  } else {
    applyClanSwitcher();
  }

  window.addEventListener("pageshow", applyClanSwitcher);
})();
