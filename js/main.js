/* =========================================================
   LEDGER — shared client engine
   ========================================================= */

(function () {
  "use strict";

  // ---------------- Stock universe ----------------
  const SECTORS = ["Technology", "Artificial Intelligence", "Aerospace & Defense", "Agriculture", "Automotive", "Energy", "Healthcare", "Financials", "Consumer", "ETFs & Index Funds"];

  const STOCKS = [
    { t: "AAPL", n: "Apple Inc.", s: "Technology", base: 231.40, vol: 0.006 },
    { t: "MSFT", n: "Microsoft Corp.", s: "Technology", base: 468.20, vol: 0.005 },
    { t: "CRM",  n: "Salesforce Inc.", s: "Technology", base: 312.10, vol: 0.008 },
    { t: "NVDA", n: "NVIDIA Corp.", s: "Artificial Intelligence", base: 172.80, vol: 0.013 },
    { t: "PLTR", n: "Palantir Technologies", s: "Artificial Intelligence", base: 118.60, vol: 0.02 },
    { t: "AI",   n: "C3.ai Inc.", s: "Artificial Intelligence", base: 28.90, vol: 0.024 },
    { t: "LMT",  n: "Lockheed Martin", s: "Aerospace & Defense", base: 487.30, vol: 0.007 },
    { t: "BA",   n: "Boeing Co.", s: "Aerospace & Defense", base: 196.50, vol: 0.016 },
    { t: "RTX",  n: "RTX Corporation", s: "Aerospace & Defense", base: 141.20, vol: 0.007 },
    { t: "DE",   n: "Deere & Company", s: "Agriculture", base: 452.70, vol: 0.007 },
    { t: "ADM",  n: "Archer-Daniels-Midland", s: "Agriculture", base: 53.10, vol: 0.009 },
    { t: "CTVA", n: "Corteva Inc.", s: "Agriculture", base: 61.80, vol: 0.008 },
    { t: "TSLA", n: "Tesla Inc.", s: "Automotive", base: 268.90, vol: 0.022 },
    { t: "TM",   n: "Toyota Motor Corp.", s: "Automotive", base: 198.40, vol: 0.006 },
    { t: "F",    n: "Ford Motor Co.", s: "Automotive", base: 11.20, vol: 0.014 },
    { t: "XOM",  n: "Exxon Mobil Corp.", s: "Energy", base: 114.60, vol: 0.008 },
    { t: "NEE",  n: "NextEra Energy", s: "Energy", base: 71.40, vol: 0.007 },
    { t: "CVX",  n: "Chevron Corp.", s: "Energy", base: 152.30, vol: 0.007 },
    { t: "JNJ",  n: "Johnson & Johnson", s: "Healthcare", base: 152.80, vol: 0.005 },
    { t: "LLY",  n: "Eli Lilly & Co.", s: "Healthcare", base: 812.40, vol: 0.011 },
    { t: "UNH",  n: "UnitedHealth Group", s: "Healthcare", base: 318.60, vol: 0.009 },
    { t: "JPM",  n: "JPMorgan Chase", s: "Financials", base: 231.90, vol: 0.006 },
    { t: "GS",   n: "Goldman Sachs", s: "Financials", base: 612.30, vol: 0.008 },
    { t: "V",    n: "Visa Inc.", s: "Financials", base: 341.70, vol: 0.005 },
    { t: "MCD",  n: "McDonald's Corp.", s: "Consumer", base: 300.00, vol: 0.005 },
    { t: "HD",   n: "Home Depot Inc.", s: "Consumer", base: 380.00, vol: 0.006 },
    { t: "SPY",  n: "SPDR S&P 500 ETF", s: "ETFs & Index Funds", base: 620.00, vol: 0.004 },
    { t: "QQQ",  n: "Invesco QQQ Trust (Nasdaq-100)", s: "ETFs & Index Funds", base: 540.00, vol: 0.005 },
    { t: "DIA",  n: "SPDR Dow Jones ETF", s: "ETFs & Index Funds", base: 440.00, vol: 0.004 },
    { t: "VTI",  n: "Vanguard Total Stock Market ETF", s: "ETFs & Index Funds", base: 300.00, vol: 0.004 }
  ];

  function seedHistory(stock) {
    const points = [];
    let p = stock.base * (1 - stock.vol * 3);
    for (let i = 0; i < 60; i++) {
      const drift = (Math.random() - 0.48) * stock.vol * p;
      p = Math.max(0.5, p + drift);
      points.push(+p.toFixed(2));
    }
    return points;
  }

  STOCKS.forEach((s) => {
    s.history = seedHistory(s);
    s.price = s.history[s.history.length - 1];
    s.prevClose = s.history[0];
    s.open = s.price;
  });

  function pctChange(stock) {
    return ((stock.price - stock.prevClose) / stock.prevClose) * 100;
  }

  const now = Date.now();
  const TIMESTAMPS = [];
  for (let i = 0; i < 60; i++) {
    TIMESTAMPS.push(new Date(now - (59 - i) * 2500));
  }
  window.LedgerTimestamps = TIMESTAMPS;

  function pushTimestamp(date) {
    TIMESTAMPS.push(date);
    if (TIMESTAMPS.length > 120) TIMESTAMPS.shift();
  }
  window.LedgerPushTimestamp = pushTimestamp;

  function tick() {
    if (window.LEDGER_LIVE_MODE) return;
    STOCKS.forEach((s) => {
      const drift = (Math.random() - 0.49) * s.vol * s.price;
      s.price = Math.max(0.5, +(s.price + drift).toFixed(2));
      s.history.push(s.price);
      if (s.history.length > 120) s.history.shift();
    });
    pushTimestamp(new Date());
    document.dispatchEvent(new CustomEvent("ledger:tick"));
  }

  setInterval(tick, 2500);

  const RateLimiter = {
    buckets: {},
    allow(key, max, windowMs) {
      const now = Date.now();
      const b = (this.buckets[key] = this.buckets[key] || []);
      while (b.length && now - b[0] > windowMs) b.shift();
      if (b.length >= max) return false;
      b.push(now);
      return true;
    }
  };
  window.LedgerRateLimiter = RateLimiter;
  window.LedgerStocks = STOCKS;
  window.LedgerSectors = SECTORS;
  window.LedgerPct = pctChange;

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
    }
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      if (a.getAttribute("href") === here) a.classList.add("active");
    });
  });

  function renderTicker() {
    const track = document.getElementById("tickerTrack");
    if (!track) return;
    const items = STOCKS.map((s) => {
      const chg = pctChange(s);
      const cls = chg >= 0 ? "up" : "down";
      const arrow = chg >= 0 ? "▲" : "▼";
      return `<span class="ticker-item"><b>${s.t}</b><span class="mono">$${s.price.toFixed(2)}</span><span class="${cls}">${arrow} ${Math.abs(chg).toFixed(2)}%</span></span>`;
    });
    track.innerHTML = items.join("") + items.join("");
  }
  document.addEventListener("DOMContentLoaded", renderTicker);
  document.addEventListener("ledger:tick", () => {
    const track = document.getElementById("tickerTrack");
    if (!track) return;
    const spans = track.querySelectorAll(".ticker-item");
    const n = STOCKS.length;
    spans.forEach((el, i) => {
      const s = STOCKS[i % n];
      const chg = pctChange(s);
      const cls = chg >= 0 ? "up" : "down";
      const arrow = chg >= 0 ? "▲" : "▼";
      el.innerHTML = `<b>${s.t}</b><span class="mono">$${s.price.toFixed(2)}</span><span class="${cls}">${arrow} ${Math.abs(chg).toFixed(2)}%</span>`;
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const q = item.querySelector(".faq-q");
      if (!q) return;
      q.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    });
  });

  function chartOptionsBase() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { display: true, grid: { display: false }, ticks: { color: "#8A93A0", font: { family: "IBM Plex Mono", size: 10 }, maxTicksLimit: 6 } },
        y: { display: true, grid: { color: "#ECEEE8" }, ticks: { color: "#8A93A0", font: { family: "IBM Plex Mono", size: 10 } } }
      }
    };
  }
  window.LedgerChartOptionsBase = chartOptionsBase;

  function lineDataset(history, color) {
    return {
      data: history,
      borderColor: color,
      backgroundColor: color + "22",
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.25
    };
  }
  window.LedgerLineDataset = lineDataset;

  function timeLabels(count) {
    const slice = TIMESTAMPS.slice(-count);
    return slice.map((d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }
  window.LedgerTimeLabels = timeLabels;

  window.LedgerAuth = {
    users: [],
    currentUser: null,
    signup(name, email, password) {
      if (this.users.find((u) => u.email === email)) return { ok: false, msg: "An account with that email already exists." };
      this.users.push({ name, email, password, joined: new Date().toISOString() });
      this.currentUser = email;
      return { ok: true };
    },
    login(email, password) {
      const u = this.users.find((u) => u.email === email && u.password === password);
      if (!u) return { ok: false, msg: "Incorrect email or password." };
      this.currentUser = email;
      return { ok: true };
    },
    logout() {
      this.currentUser = null;
    },
    get() {
      return this.users.find((u) => u.email === this.currentUser) || null;
    }
  };
})();