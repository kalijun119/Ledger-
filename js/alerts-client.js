/**
 * Ledger — alerts client
 * -----------------------------------------------------------
 * Include AFTER auth-client.js on any page using alerts
 * (analysis.html, account.html). Talks to server/alerts.js.
 */
(function () {
  "use strict";

  const API_BASE = "https://ledger-server-5ea8.onrender.com"; // keep in sync with the other *-client.js files

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

  window.LedgerAlerts = {
    async list() {
      const r = await api("/api/alerts");
      if (!r.ok) return { ok: false, msg: r.msg, alerts: [] };
      return { ok: true, alerts: r.data.alerts };
    },
    async create(ticker, direction, targetPrice) {
      return api("/api/alerts", { method: "POST", body: JSON.stringify({ ticker, direction, targetPrice }) });
    },
    async remove(id) {
      return api(`/api/alerts/${id}`, { method: "DELETE" });
    }
  };
})();