/**
 * Ledger — portfolio client
 * -----------------------------------------------------------
 * Include AFTER auth-client.js on any page using the portfolio
 * (analysis.html, portfolio.html). Talks to server/portfolio.js.
 */
(function () {
  "use strict";

  const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:4000"
    : ""; // deployed: relative path, proxied through vercel.json to Render — keeps the login cookie same-origin
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
