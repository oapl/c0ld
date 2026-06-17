(() => {
  function mark() {
    document.querySelectorAll(".chart-box[data-site-chart='1']").forEach(canvas => {
      canvas.dataset.profileChartEnhanced = "1";
      canvas.dataset.profileHoverBound = "1";
    });
  }

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
