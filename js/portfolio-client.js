/**
 * Ledger — portfolio client
 * -----------------------------------------------------------
 * Include AFTER auth-client.js on any page using the portfolio
 * (analysis.html, portfolio.html). Talks to server/portfolio.js.
 */
(function () {
  "use strict";

  const API_BASE = "https://ledger-server-5ea8.onrender.com"; // keep in sync with live-data.js/auth-client.js/watchlist-client.js

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

  window.LedgerPortfolio = {
    async get() {
      const r = await api("/api/portfolio");
      if (!r.ok) return { ok: false, msg: r.msg };
      return { ok: true, cash: r.data.cash, holdings: r.data.holdings };
    },
    async buy(ticker, shares) {
      return api("/api/portfolio/buy", { method: "POST", body: JSON.stringify({ ticker, shares }) });
    },
    async sell(ticker, shares) {
      return api("/api/portfolio/sell", { method: "POST", body: JSON.stringify({ ticker, shares }) });
    }
  };
})();