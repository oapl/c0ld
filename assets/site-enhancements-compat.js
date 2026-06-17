(() => {
  function mark() {
    document.querySelectorAll(".chart-box[data-site-chart='1']").forEach(canvas => {
      canvas.dataset.profileChartEnhanced = "1";
      canvas.dataset.profileHoverBound = "1";
    });
  }

  function installRewardHistoryRequestPatch() {
    if (window.__rewardHistoryRequestPatchInstalled) return;
    window.__rewardHistoryRequestPatchInstalled = true;

    const originalFetch = window.fetch.bind(window);
    const historyMarker = "c0ld-clan-api-worker.opal-dde.workers.dev/api/clans/history";

    function shouldPatch(url) {
      return url.pathname === "/api/clans/history" || url.href.includes(historyMarker);
    }

    function activeRankRange() {
      const active = document.querySelector(".reward-range-btn.active[data-range]")?.dataset?.range || "1-4";
      if (active === "5-11") return { min: 5, max: 11 };
      if (active === "12-51") return { min: 12, max: 51 };
      return { min: 1, max: 4 };
    }

    function bucketMinutesForHours(hours) {
      if (hours <= 1) return 5;
      if (hours <= 12) return 30;
      return 60;
    }

    window.fetch = function patchedFetch(input, init) {
      try {
        const rawUrl = typeof input === "string" ? input : input?.url;
        if (rawUrl) {
          const url = new URL(rawUrl, window.location.href);
          if (shouldPatch(url)) {
            const hours = Number(url.searchParams.get("hours") || "12");
            const range = activeRankRange();

            url.searchParams.set("rank_min", String(range.min));
            url.searchParams.set("rank_max", String(range.max));
            url.searchParams.set("bucket_minutes", String(bucketMinutesForHours(hours)));
            url.searchParams.set("include_baseline", "1");
            if (!url.searchParams.has("limit")) url.searchParams.set("limit", "50000");

            if (typeof input === "string") return originalFetch(url.toString(), init);
            return originalFetch(new Request(url.toString(), input), init);
          }
        }
      } catch (err) {
        console.warn("Reward history request patch skipped", err);
      }

      return originalFetch(input, init);
    };
  }

  installRewardHistoryRequestPatch();

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