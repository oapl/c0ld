(function () {
  const TOKEN_KEY = "c0ld.discord.session";

  function cleanUrlHash(paramsToRemove) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));

    for (const key of paramsToRemove) {
      params.delete(key);
    }

    const nextHash = params.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
    window.history.replaceState(null, "", url.toString());
  }

  function consumeCallbackToken() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("c0ld_token");
    const denied = params.get("c0ld_auth") === "denied";

    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      cleanUrlHash(["c0ld_token", "c0ld_page"]);
    } else if (denied) {
      cleanUrlHash(["c0ld_auth", "c0ld_page"]);
    }

    return { token, denied };
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function isConfigured(apiBase) {
    return Boolean(apiBase) && !apiBase.includes("YOUR-SUBDOMAIN") && /^https:\/\//i.test(apiBase);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHidden(id, hidden) {
    const el = document.getElementById(id);
    if (el) el.hidden = hidden;
  }

  function buildLoginUrl(apiBase, page) {
    const url = new URL("/auth/discord/login", apiBase);
    url.searchParams.set("page", page);
    url.searchParams.set("return_to", window.location.href.split("#")[0]);
    return url.toString();
  }

  async function authedFetch(apiBase, path, options = {}) {
    const token = getToken();
    const url = path.startsWith("http") ? path : new URL(path, apiBase).toString();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
      cache: "no-store"
    });
  }

  async function requireAccess(config) {
    const {
      apiBase,
      page,
      panelId,
      contentId,
      statusId,
      loginId,
      logoutId,
      userId
    } = config;

    const callback = consumeCallbackToken();
    setHidden(contentId, true);
    setHidden(panelId, false);

    const login = document.getElementById(loginId);
    const logout = document.getElementById(logoutId);

    if (logout) {
      logout.addEventListener("click", () => {
        clearToken();
        window.location.reload();
      });
    }

    if (!isConfigured(apiBase)) {
      setText(statusId, "Discord access is not configured yet. Set PROTECTED_API_BASE to your deployed auth Worker URL.");
      if (login) {
        login.href = "#";
        login.setAttribute("aria-disabled", "true");
      }
      return { allowed: false, reason: "not_configured" };
    }

    if (login) {
      login.href = buildLoginUrl(apiBase, page);
      login.removeAttribute("aria-disabled");
    }

    if (callback.denied) {
      setText(statusId, "Your Discord account does not have a required C0LD role for this page.");
      return { allowed: false, reason: "denied" };
    }

    const token = getToken();
    if (!token) {
      setText(statusId, "Sign in with Discord to verify your C0LD role before this page loads.");
      return { allowed: false, reason: "missing_token" };
    }

    try {
      const res = await authedFetch(apiBase, `/auth/session?page=${encodeURIComponent(page)}`);
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.allowed) {
        clearToken();
        setText(statusId, payload.message || "Your Discord session could not access this page.");
        return { allowed: false, reason: payload.reason || "forbidden" };
      }

      const userLabel = payload.user?.global_name || payload.user?.username || payload.user?.id || "Verified";
      setText(userId, `Signed in as ${userLabel}`);
      setHidden(panelId, true);
      setHidden(contentId, false);
      return { allowed: true, session: payload };
    } catch (err) {
      setText(statusId, "Could not reach the Discord access backend.");
      return { allowed: false, reason: "network_error", error: err };
    }
  }

  window.C0LD_AUTH = {
    clearToken,
    fetch: authedFetch,
    getToken,
    requireAccess
  };
})();
