/**
 * Ledger — watchlist client
 * -----------------------------------------------------------
 * Include this AFTER auth-client.js on any page that needs the
 * watchlist (analysis.html, account.html). Talks to the backend
 * routes added by server/watchlist.js.
 */
(function () {
  "use strict";

  const API_BASE = "https://ledger-server-5ea8.onrender.com"; // change to your deployed backend URL — keep in sync with live-data.js/auth-client.js

  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Something went wrong." };
    return { ok: true, data };
  }

  window.LedgerWatchlist = {
    async list() {
      const r = await api("/api/watchlist");
      if (!r.ok) return { ok: false, msg: r.msg, tickers: [] };
      return { ok: true, tickers: r.data.tickers };
    },
    async add(ticker) {
      return api("/api/watchlist", { method: "POST", body: JSON.stringify({ ticker }) });
    },
    async remove(ticker) {
      return api(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" });
    }
  };
})();
