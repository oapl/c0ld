(() => {
  const API_URL = "https://c0ld-clan-api-worker.opal-dde.workers.dev/api/ps99/versions?limit=500";
  const DEFAULT_COLOR = "rgba(88, 166, 255, 0.56)";
  const ACTIVE_COLOR = "rgba(88, 166, 255, 0.96)";

  let events = [];
  let loadPromise = null;

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function eventTime(row) {
    for (const value of [row?.current_published_at, row?.detected_at, row?.created_at]) {
      const time = new Date(value || 0).getTime();
      if (Number.isFinite(time) && time > 0) return time;
    }
    return null;
  }

  function normalize(payload) {
    const rootPlaceId = String(payload?.root_place_id || "").trim();
    if (!rootPlaceId) return [];

    const unique = new Map();
    for (const row of Array.isArray(payload?.events) ? payload.events : []) {
      if (String(row?.place_id || "").trim() !== rootPlaceId) continue;

      const t = eventTime(row);
      const version = finiteNumber(row?.current_version);
      if (t === null || version === null) continue;

      const event = {
        t,
        rawT: new Date(t).toISOString(),
        version,
        previousVersion: finiteNumber(row?.previous_version),
        placeId: rootPlaceId,
        placeName: String(row?.place_name || "Pet Simulator 99").trim() || "Pet Simulator 99",
        publishedAt: row?.current_published_at || null,
        detectedAt: row?.detected_at || null
      };

      unique.set(`${version}:${t}`, event);
    }

    return [...unique.values()].sort((a, b) => a.t - b.t);
  }

  async function load() {
    if (loadPromise) return loadPromise;

    loadPromise = fetch(API_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    })
      .then(response => {
        if (!response.ok) throw new Error(`PS99 version history HTTP ${response.status}`);
        return response.json();
      })
      .then(payload => {
        events = normalize(payload);
        window.dispatchEvent(new CustomEvent("ps99-version-markers-loaded", { detail: { events } }));
        return events;
      })
      .catch(error => {
        console.warn("Could not load PS99 update markers.", error);
        return events;
      });

    return loadPromise;
  }

  function between(minT, maxT) {
    if (!Number.isFinite(minT) || !Number.isFinite(maxT)) return [];
    return events.filter(event => event.t >= minT && event.t <= maxT);
  }

  function draw(ctx, options = {}) {
    const minT = Number(options.minT);
    const maxT = Number(options.maxT);
    const top = Number(options.top);
    const bottom = Number(options.bottom);
    const x = options.x;
    if (!ctx || typeof x !== "function" || !Number.isFinite(top) || !Number.isFinite(bottom)) return [];

    const markers = between(minT, maxT).map(event => ({ ...event, x: x(event) }));
    if (!markers.length) return markers;

    ctx.save();
    ctx.strokeStyle = options.color || DEFAULT_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (const marker of markers) {
      ctx.beginPath();
      ctx.moveTo(Math.round(marker.x) + 0.5, top);
      ctx.lineTo(Math.round(marker.x) + 0.5, bottom);
      ctx.stroke();
    }

    ctx.restore();
    return markers;
  }

  function nearest(markers, mouseX, threshold = 8) {
    if (!Array.isArray(markers) || !markers.length || !Number.isFinite(mouseX)) return null;

    let match = null;
    let distance = Number(threshold);
    for (const marker of markers) {
      const candidate = Math.abs(Number(marker.x) - mouseX);
      if (candidate <= distance) {
        match = marker;
        distance = candidate;
      }
    }
    return match;
  }

  function highlight(ctx, marker, top, bottom) {
    if (!ctx || !marker || !Number.isFinite(marker.x)) return;
    ctx.save();
    ctx.strokeStyle = ACTIVE_COLOR;
    ctx.fillStyle = ACTIVE_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(Math.round(marker.x) + 0.5, top);
    ctx.lineTo(Math.round(marker.x) + 0.5, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(marker.x, top + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tooltipHtml(marker, formatDateTime) {
    const when = typeof formatDateTime === "function"
      ? formatDateTime(marker.rawT)
      : new Date(marker.t).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    return `<strong>PS99 Update #${Number(marker.version).toLocaleString("en-US")}</strong><div>Published: ${when}</div>`;
  }

  window.Ps99VersionMarkers = {
    load,
    draw,
    nearest,
    highlight,
    tooltipHtml,
    normalize
  };
})();
