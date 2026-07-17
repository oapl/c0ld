(function () {
  const DEFAULT_AUTH_BASE = "https://c0ldauth.opal-dde.workers.dev";

  function ensureAccessScript() {
    if (window.C0LD_AUTH) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src$="assets/protected-access.js"],script[src$="protected-access.js"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "assets/protected-access.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function buttonClass() {
    if (document.querySelector(".menu .btn,.menu-bar .btn")) return "btn";
    return "menu-btn";
  }

  function makePanel(title, status) {
    const klass = buttonClass();
    const panel = document.createElement("section");
    panel.id = "c0ld-auth-panel";
    panel.className = "panel auth-panel c0ld-auth-panel";
    panel.innerHTML = `
      <h2 class="panel-title">${title}</h2>
      <p id="c0ld-auth-status" class="muted">${status}</p>
      <div class="auth-actions">
        <a id="c0ld-discord-login" class="${klass} auth-button" href="#">Sign in with Discord</a>
        <button id="c0ld-discord-logout" type="button">Clear Session</button>
        <span id="c0ld-discord-user" class="muted"></span>
      </div>
    `;
    return panel;
  }

  function ensureStyles() {
    if (document.getElementById("c0ld-protected-page-style")) return;
    const style = document.createElement("style");
    style.id = "c0ld-protected-page-style";
    style.textContent = `
      .c0ld-auth-panel{max-width:900px;margin:22px auto;padding:18px;background:var(--panel,#161b22);border:1px solid var(--border,#30363d);border-radius:10px;color:var(--text,#e6edf3)}
      .c0ld-auth-panel .panel-title{margin:0 0 8px;font-size:18px}
      .c0ld-auth-panel .muted{color:var(--muted,#8b949e)}
      .c0ld-auth-panel .auth-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}
      .c0ld-auth-panel button,.c0ld-auth-panel .auth-button{border:1px solid var(--border,#30363d);border-radius:6px;background:var(--panel-2,#0f141b);color:var(--text,#e6edf3);padding:10px 12px;font-size:14px;line-height:1;cursor:pointer;text-decoration:none}
      .c0ld-auth-panel button:hover,.c0ld-auth-panel .auth-button:hover{border-color:var(--link,#ff9b96);color:var(--link,#ff9b96);background:var(--hover,#1f2630)}
    `;
    document.head.appendChild(style);
  }

  async function requirePage(options = {}) {
    const page = options.page || document.body?.dataset.protectedPage || location.pathname.split("/").pop().replace(/\.html$/i, "");
    const title = options.title || "Discord Access Required";
    const status = options.status || "Checking Discord access...";
    const apiBase = options.apiBase || window.C0LD_AUTH_BASE || DEFAULT_AUTH_BASE;
    const content = document.querySelector(options.contentSelector || "main");

    if (!content) throw new Error("Protected page content container was not found.");

    await ensureAccessScript();
    ensureStyles();

    const contentId = content.id || "c0ld-protected-content";
    content.id = contentId;
    content.hidden = true;

    let panel = document.getElementById("c0ld-auth-panel");
    if (!panel) {
      panel = makePanel(title, status);
      content.parentNode.insertBefore(panel, content);
    }

    const auth = await window.C0LD_AUTH.requireAccess({
      apiBase,
      page,
      panelId: "c0ld-auth-panel",
      contentId,
      statusId: "c0ld-auth-status",
      loginId: "c0ld-discord-login",
      logoutId: "c0ld-discord-logout",
      userId: "c0ld-discord-user"
    });

    if (!auth.allowed) throw Object.assign(new Error(auth.reason || "Access denied"), { auth });
    return auth;
  }

  window.C0LD_PROTECTED = {
    requirePage
  };
})();
