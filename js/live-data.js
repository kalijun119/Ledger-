/**
 * Ledger — live data client
 * -----------------------------------------------------------
 * Drop this in AFTER main.js on every page (see index.html for
 * the include order). It turns on window.LEDGER_LIVE_MODE, which
 * tells main.js's simulation to stand down, then feeds real
 * quotes from your backend proxy (server/server.js) into the
 * exact same window.LedgerStocks array and "ledger:tick" event
 * that every page's chart/table code already listens for — so
 * none of your page code needs to change.
 *
 * Set API_BASE below to wherever you're running server/server.js.
 */
(function () {
  "use strict";

  const API_BASE = "https://ledger-server-5ea8.onrender.com"; // change to your deployed backend URL
  const POLL_MS = 15000; // how often the BROWSER re-checks the backend's cache
                          // (safe to poll often — the backend is serving its own
                          // cache, not hitting Finnhub per request)

  window.LEDGER_LIVE_MODE = true;

  async function refreshQuotes() {
    try {
      const res = await fetch(`${API_BASE}/api/quotes`);
      if (!res.ok) throw new Error(`quotes -> ${res.status}`);
      const data = await res.json();
      window.LedgerStocks.forEach((s) => {
        const q = data.quotes[s.t];
        if (!q || typeof q.c !== "number") return; // no data yet for this ticker
        s.price = q.c;
        s.open = q.o || s.open;
        s.prevClose = q.pc || s.prevClose;
        s.history.push(q.c);
        if (s.history.length > 120) s.history.shift();
      });
      document.dispatchEvent(new CustomEvent("ledger:tick"));
      document.dispatchEvent(new CustomEvent("ledger:live-update", { detail: { lastUpdated: data.lastUpdated } }));
    } catch (err) {
      console.error("Ledger live data: quote refresh failed, showing last known values.", err);
      // Deliberately do NOT fall back to the random walk here — showing stale-but-real
      // data with a clear "last updated" timestamp is more honest than faking movement.
    }
  }

  window.LedgerFetchRealHistory = async function (ticker) {
    try {
      const res = await fetch(`${API_BASE}/api/history/${ticker}`);
      if (!res.ok) throw new Error(`history -> ${res.status}`);
      const data = await res.json();
      if (data.s !== "ok" || !Array.isArray(data.c) || !Array.isArray(data.t)) return null;
      return {
        closes: data.c,
        dates: data.t.map((epochSeconds) => new Date(epochSeconds * 1000))
      };
    } catch (err) {
      console.error("Ledger live data: history fetch failed.", err);
      return null;
    }
  };
  refreshQuotes();
  setInterval(refreshQuotes, POLL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshQuotes(); // catch up immediately instead of waiting on a throttled timer
    }
  });
})();