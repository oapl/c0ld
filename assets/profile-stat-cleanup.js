(() => {
  const REMOVED_LABELS = new Set([
    "first active date",
    "worst rank",
    "best rank"
  ]);

  let running = false;

  function cleanProfileStats() {
    if (running) return;
    running = true;

    document.querySelectorAll(".stat-row").forEach(row => {
      const label = row.querySelector(".stat-label")?.textContent?.trim().toLowerCase();
      if (label && REMOVED_LABELS.has(label)) {
        row.remove();
      }
    });

    running = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanProfileStats);
  } else {
    cleanProfileStats();
  }

  window.addEventListener("pageshow", cleanProfileStats);

  const observer = new MutationObserver(cleanProfileStats);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
