(() => {
  function mark() {
    document.querySelectorAll(".chart-box[data-site-chart='1']").forEach(canvas => {
      canvas.dataset.profileChartEnhanced = "1";
      canvas.dataset.profileHoverBound = "1";
    });
  }

  function installRewardHistoryPadding() {
    if (window.__rewardHistoryPaddingInstalled) return;
    window.__rewardHistoryPaddingInstalled = true;

    const originalFetch = window.fetch.bind(window);
    const historyMarker = "c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

    function shouldPatch(url) {
      return url.pathname === "/api/clans/history" || url.href.includes(historyMarker);
    }

    function paddedHours(hours) {
      if (!Number.isFinite(hours)) return hours;
      if (hours <= 1) return 2;
      if (hours <= 12) return 13;
      if (hours <= 24) return 25;
      return hours;
    }

    window.fetch = function patchedFetch(input, init) {
      try {
        const rawUrl = typeof input === "string" ? input : input?.url;
        if (rawUrl) {
          const url = new URL(rawUrl, window.location.href);
          if (shouldPatch(url)) {
            const requestedHours = Number(url.searchParams.get("hours"));
            const nextHours = paddedHours(requestedHours);
            if (Number.isFinite(nextHours) && nextHours !== requestedHours) {
              url.searchParams.set("hours", String(nextHours));
              url.searchParams.set("chart_window_hours", String(requestedHours));
              url.searchParams.set("include_baseline", "1");
              if (typeof input === "string") return originalFetch(url.toString(), init);
              return originalFetch(new Request(url.toString(), input), init);
            }
          }
        }
      } catch (err) {
        console.warn("Reward history padding skipped", err);
      }

      return originalFetch(input, init);
    };
  }

  installRewardHistoryPadding();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mark);
  } else {
    mark();
  }

  window.addEventListener("pageshow", mark);

  const observer = new MutationObserver(mark);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();