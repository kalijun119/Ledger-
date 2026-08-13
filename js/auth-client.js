/**
 * Ledger — real accounts client
 * -----------------------------------------------------------
 * Include this AFTER main.js on account.html. It replaces the
 * in-memory window.LedgerAuth demo with one that talks to your
 * backend's real /api/signup, /api/login, /api/logout, /api/me
 * routes (added by server/auth.js) — so accounts now survive a
 * refresh, a browser restart, and a computer restart.
 */
(function () {
  "use strict";

  const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:4000"
    : ""; // deployed: relative path, proxied through vercel.json to Render — keeps the login cookie same-origin

  let cachedUser = null;

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

  window.LedgerAuth = {
    async signup(name, email, password, securityQuestion, securityAnswer) {
      const r = await api("/api/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, securityQuestion, securityAnswer })
      });
      if (!r.ok) return { ok: false, msg: r.msg };
      cachedUser = r.data.user;
      return { ok: true };
    },
    async login(email, password) {
      const r = await api("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (!r.ok) return { ok: false, msg: r.msg };
      cachedUser = r.data.user;
      return { ok: true };
    },
    async logout() {
      await api("/api/logout", { method: "POST" });
      cachedUser = null;
    },
    async checkSession() {
      const r = await api("/api/me");
      cachedUser = r.ok ? r.data.user : null;
      return cachedUser;
    },
    async changePassword(currentPassword, newPassword) {
      const r = await api("/api/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      if (!r.ok) return { ok: false, msg: r.msg };
      return { ok: true };
    },
    async deleteAccount(password) {
      const r = await api("/api/delete-account", { method: "POST", body: JSON.stringify({ password }) });
      if (!r.ok) return { ok: false, msg: r.msg };
      cachedUser = null;
      return { ok: true };
    },
    async getSecurityQuestion(email) {
      const r = await api(`/api/security-question?email=${encodeURIComponent(email)}`);
      if (!r.ok) return { ok: false, msg: r.msg };
      return { ok: true, question: r.data.question };
    },
    async resetWithAnswer(email, answer, newPassword) {
      const r = await api("/api/reset-with-answer", {
        method: "POST",
        body: JSON.stringify({ email, answer, newPassword })
      });
      if (!r.ok) return { ok: false, msg: r.msg };
      return { ok: true };
    },
    get() {
      return cachedUser;
    }
  };
})();
