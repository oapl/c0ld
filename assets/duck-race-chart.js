(function () {
  "use strict";

  if (!/\/clans\.html(?:$|[?#])/.test(window.location.pathname) && !/\/clans\/?$/.test(window.location.pathname)) {
    return;
  }

  const state = {
    initialized: false,
    visible: false,
    replaySequence: 0,
    retryTimer: 0
  };

  function selectedBattle() {
    return document.getElementById("battle-select")?.value || "current";
  }

  function recapUrl() {
    const params = new URLSearchParams({
      embed: "1",
      mode: "clans",
      battle: selectedBattle(),
      autoplay: "1",
      replay: String(++state.replaySequence)
    });
    return `duck-recap.html?${params.toString()}`;
  }

  function ensureStyles() {
    if (document.getElementById("duck-recap-view-styles")) return;

    const style = document.createElement("style");
    style.id = "duck-recap-view-styles";
    style.textContent = `
      .duck-view-button[aria-pressed="true"] {
        border-color: var(--link, #ff9b96);
        color: var(--link, #ff9b96);
        background: rgba(248, 81, 73, .12);
      }

      .duck-recap-section {
        overflow: hidden;
        padding: 0;
        background: var(--panel-2, #0f141b);
      }

      .duck-recap-frame {
        display: block;
        width: 100%;
        height: 622px;
        border: 0;
        background: #0d1117;
      }

      @media (max-width: 700px) {
        .reward-threshold-metrics .duck-view-button {
          width: auto;
          flex: 1 1 0;
        }

        .duck-recap-frame {
          height: 562px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureRecapPanel(rewardPanel) {
    let panel = document.getElementById("duck-recap-section");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "duck-recap-section";
    panel.className = "duck-recap-section";
    panel.hidden = true;
    panel.innerHTML = `
      <iframe
        id="duck-recap-frame"
        class="duck-recap-frame"
        title="Top 10 clan duck recap"
        loading="lazy"
      ></iframe>
    `;

    const chartBody = rewardPanel.querySelector(".reward-threshold-body");
    rewardPanel.insertBefore(panel, chartBody || null);
    return panel;
  }

  function ensureViewButtons(rewardPanel) {
    const controls = rewardPanel.querySelector(".reward-threshold-metrics");
    const normalButton = document.getElementById("reward-threshold-refresh");
    if (!controls || !normalButton) return null;

    normalButton.textContent = "Normal View";
    normalButton.classList.add("duck-view-button");
    normalButton.setAttribute("aria-pressed", "true");

    let recapButton = document.getElementById("duck-recap-view");
    if (!recapButton) {
      recapButton = document.createElement("button");
      recapButton.id = "duck-recap-view";
      recapButton.className = "duck-view-button";
      recapButton.type = "button";
      recapButton.textContent = "Duck Recap";
      recapButton.setAttribute("aria-pressed", "false");
      controls.appendChild(recapButton);
    }

    return { normalButton, recapButton };
  }

  function loadRecap() {
    const frame = document.getElementById("duck-recap-frame");
    if (frame) frame.src = recapUrl();
  }

  function setView(view, forceReplay = false) {
    const showRecap = view === "recap";
    const recapPanel = document.getElementById("duck-recap-section");
    const chartBody = document.querySelector("#reward-threshold-section .reward-threshold-body");
    const normalButton = document.getElementById("reward-threshold-refresh");
    const recapButton = document.getElementById("duck-recap-view");

    state.visible = showRecap;
    if (recapPanel) recapPanel.hidden = !showRecap;
    if (chartBody) chartBody.hidden = showRecap;

    normalButton?.setAttribute("aria-pressed", String(!showRecap));
    recapButton?.setAttribute("aria-pressed", String(showRecap));

    if (showRecap && (forceReplay || !document.getElementById("duck-recap-frame")?.src)) {
      loadRecap();
    }
  }

  function init() {
    if (state.initialized) return;

    const rewardPanel = document.getElementById("reward-threshold-section");
    if (!rewardPanel) {
      window.clearTimeout(state.retryTimer);
      state.retryTimer = window.setTimeout(init, 80);
      return;
    }

    ensureStyles();
    ensureRecapPanel(rewardPanel);
    const buttons = ensureViewButtons(rewardPanel);
    if (!buttons) return;

    state.initialized = true;
    buttons.normalButton.addEventListener("click", () => setView("normal"));
    buttons.recapButton.addEventListener("click", () => setView("recap", true));

    document.getElementById("battle-select")?.addEventListener("change", () => {
      if (state.visible) loadRecap();
    });

    setView("normal");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
