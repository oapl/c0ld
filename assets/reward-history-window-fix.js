(() => {
  const HISTORY_PATH = "/api/clans/history";
  const ABSOLUTE_HISTORY_MARKER = "c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";
  const originalFetch = window.fetch.bind(window);

  function shouldPatch(url) {
    return url.pathname === HISTORY_PATH || url.href.includes(ABSOLUTE_HISTORY_MARKER);
  }

  function paddedHours(hours) {
    if (!Number.isFinite(hours)) return hours;
    if (hours <= 1) return 2;
    if (hours <= 12) return 13;
    if (hours <= 24) return 25;
    return hours;
  }

  window.fetch = function patchedRewardHistoryFetch(input, init) {
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
      console.warn("Reward history window patch skipped", err);
    }

    return originalFetch(input, init);
  };

  // reward-threshold-chart.js may start its first request before this patch has loaded.
  // Force one reload after the patch is installed so the chart gets the older baseline
  // row it needs for true interval gains.
  window.setTimeout(() => {
    const refresh = document.getElementById("reward-threshold-refresh");
    if (refresh) refresh.click();
  }, 900);
})();
