// Scroll-driven Reports story. Step timing comes from the Reports track's --step value.
(() => {
  const track = document.querySelector(".reports-track");
  if (!track) return;
  const pinned = track.querySelector(".reports-detail");
  const root = track.querySelector(".reports-story"); // Receives data-step for the card animations.
  if (!pinned || !root) return;
  const title = root.querySelector(".reports-copy h2");
  const description = root.querySelector(".reports-description");
  const takeaway = root.querySelector(".reports-takeaway span");
  const progress = root.querySelector(".reports-progress");
  const visuals = root.querySelector(".reports-visuals");
  const categories = [["Fees & charges", "#6fc3a0", "₹5,000", "40%", "qicon-fees"], ["Food", "#e3b341", "₹2,500", "20%", "qicon-food"], ["Shopping", "#a855f7", "₹2,200", "17%", "qicon-shopping"], ["Groceries", "#5aad3f", "₹1,290", "10%", "qicon-groceries"], ["Bills", "#4a90e2", "₹961", "8%", "qicon-bills"]];
  const steps = [
    ["Income and spent, side by side", "Choose All, Monthly or Yearly, pick a month, and see what came in and what went out. Each number shows the change from the previous month.", "You always know how much is left after spending."],
    ["Insights in plain words", "Instead of making you read charts, SpendTrack writes the key point for you, like which category cost the most.", "The one thing worth noticing this month."],
    ["See which days spiked", "The daily trend plots every day of the month. Hover or drag across the chart to see the exact amount spent on any day.", "Spot the day a big expense happened."],
    ["Income against spending", "Six months of income and spending sit in paired bars, so you can tell right away whether you saved or overspent.", "Are you spending more than you earn?"],
    ["Where the money went", "The donut splits your total spend by category with a percentage for each, so the biggest slice stands out.", "Your biggest category at a glance."],
    ["Categories, ranked", "Top categories are ranked by amount with their share of the total, using the same icons and colors as your transactions.", "What to cut first if you want to spend less."]
  ];
  const rank = categories.map(([n,c,a,p,icon]) => `<div class="demo-rank-row"><span class="demo-icon" style="--c:${c}" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#${icon}"></use></svg></span><div><strong>${n}</strong><div class="demo-track"><i style="--w:${p};--c:${c}"></i></div></div><div><strong>${a}</strong><br><small>${p} of total</small></div></div>`).join("");
  const MONTHS = [["May",9000,4000],["Jun",14000,6200],["Jul",11000,5000],["Aug",18000,7500],["Sep",27600,12619],["Oct",15000,9000]];
  const MONTH_MAX = 30000;
  const money = n => "₹" + n.toLocaleString("en-IN");
  const bars = MONTHS.map(([m, inc, sp]) =>
    `<div class="demo-month" title="${m} · Income ${money(inc)} · Spent ${money(sp)}" style="--i:${(inc / MONTH_MAX * 100).toFixed(1)}%;--s:${(sp / MONTH_MAX * 100).toFixed(1)}%"><i></i><i></i></div>`
  ).join("");
  const monthLabels = MONTHS.map(([m]) => `<span>${m}</span>`).join("");
  const TREND = {
    w: 560, h: 300, l: 54, r: 540, t: 64, b: 248, max: 3000,
    data: [1200,1250,1700,1820,2000,2300,2520,2280,2160,2200,2230,2200,2350,2600,2240,2420,2800,3500,2170,2150,2000,2100,2200,2400,2210,2650,2260,2200,2200,3000]
  };
  const TIP_W = 132, TIP_H = 50;
  const trendX = i => +(TREND.l + i * (TREND.r - TREND.l) / (TREND.data.length - 1)).toFixed(1);
  const trendY = v => +(TREND.b - v / TREND.max * (TREND.b - TREND.t)).toFixed(1);
  const inr = v => "₹" + v.toLocaleString("en-IN");

  function monotonePath(pts) {
    const n = pts.length, dx = [], m = [], tg = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i+1][0] - pts[i][0]; m[i] = (pts[i+1][1] - pts[i][1]) / dx[i]; }
    tg[0] = m[0]; tg[n-1] = m[n-2];
    for (let i = 1; i < n - 1; i++) tg[i] = m[i-1] * m[i] <= 0 ? 0 : (m[i-1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { tg[i] = tg[i+1] = 0; continue; }
      const a = tg[i] / m[i], c = tg[i+1] / m[i], s = a*a + c*c;
      if (s > 9) { const k = 3 / Math.sqrt(s); tg[i] = k * a * m[i]; tg[i+1] = k * c * m[i]; }
    }
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + tg[i] * h).toFixed(1)} ${(pts[i+1][0] - h).toFixed(1)} ${(pts[i+1][1] - tg[i+1] * h).toFixed(1)} ${pts[i+1][0]} ${pts[i+1][1]}`;
    }
    return d;
  }

  function trendCardHTML() {
    const { w, h, l, r, t, b, data } = TREND;
    const pts = data.map((v, i) => [trendX(i), trendY(v)]);
    const line = monotonePath(pts);
    const area = `${line} L${pts[pts.length-1][0]} ${b} L${pts[0][0]} ${b} Z`;
    const yTicks = [0, 1000, 2000, 3000].map(v =>
      `<line class="${v === 0 ? "trend-axis" : "trend-grid"}" x1="${l}" x2="${r}" y1="${trendY(v)}" y2="${trendY(v)}"/>` +
      `<text class="trend-label" x="${l - 12}" y="${trendY(v) + 4}" text-anchor="end">${v === 0 ? "₹0" : "₹" + v / 1000 + "K"}</text>`).join("");
    const xTicks = [1, 5, 10, 15, 20, 25, 30].map(d =>
      `<line class="trend-axis" x1="${trendX(d-1)}" x2="${trendX(d-1)}" y1="${b}" y2="${b + 5}"/>` +
      `<text class="trend-label" x="${trendX(d-1)}" y="${b + 24}" text-anchor="middle">${d}</text>`).join("");
    return `<article class="report-demo" data-trend role="img" aria-label="Daily spending for September. The highest day is 17 Sep at ₹2,800."><h3>Spending Trend <span class="demo-chip" style="float:right">Daily</span></h3><svg class="trend-svg" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4de09a" stop-opacity=".26"/><stop offset="1" stop-color="#4de09a" stop-opacity="0"/></linearGradient></defs>${yTicks}<line class="trend-axis" x1="${l}" x2="${l}" y1="${t}" y2="${b}"/>${xTicks}<path class="trend-area" d="${area}"/><path class="trend-line" pathLength="1" d="${line}"/><rect class="trend-hit" x="${l}" y="${t - 24}" width="${r - l}" height="${b - t + 24}"/><g class="trend-pin"><line class="trend-guide"/><g class="trend-cursor"><circle class="trend-halo" r="11"/><circle class="trend-dot" r="5.5"/><g class="trend-tip"><rect rx="12" width="${TIP_W}" height="${TIP_H}"/><text class="tip-date"></text><text class="tip-amt"></text></g></g></g></svg></article>`;
  }

  function setupTrend(card) {
    const { l, r, b, w, data } = TREND, peak = data.indexOf(Math.max(...data));
    const svg = card.querySelector(".trend-svg"), hit = card.querySelector(".trend-hit");
    const guide = card.querySelector(".trend-guide"), cursor = card.querySelector(".trend-cursor");
    const rect = card.querySelector(".trend-tip rect"), dateEl = card.querySelector(".tip-date"), amtEl = card.querySelector(".tip-amt");
    function show(i) {
      const x = trendX(i), y = trendY(data[i]);
      guide.setAttribute("x1", x); guide.setAttribute("x2", x); guide.setAttribute("y1", y); guide.setAttribute("y2", b);
      cursor.setAttribute("transform", `translate(${x} ${y})`);
      const tx = Math.min(Math.max(x, l + TIP_W / 2), r - TIP_W / 2) - x;
      const ty = y - 16 - TIP_H >= 4 ? -16 - TIP_H : 16;
      rect.setAttribute("x", tx - TIP_W / 2); rect.setAttribute("y", ty);
      dateEl.setAttribute("x", tx); dateEl.setAttribute("y", ty + 20);
      amtEl.setAttribute("x", tx); amtEl.setAttribute("y", ty + 40);
      dateEl.textContent = `${i + 1} Sep${i === peak ? " · Peak" : ""}`;
      amtEl.textContent = inr(data[i]);
    }
    const dayAt = e => {
      const bb = svg.getBoundingClientRect(), sx = (e.clientX - bb.left) * (w / bb.width);
      return Math.max(0, Math.min(data.length - 1, Math.round((sx - l) / ((r - l) / (data.length - 1)))));
    };
    show(peak);
    hit.addEventListener("pointerdown", e => show(dayAt(e)));
    hit.addEventListener("pointermove", e => show(dayAt(e)));
    hit.addEventListener("pointerleave", () => show(peak));
  }
  const DONUT = {
    r: 46, stroke: 18, gap: 0,
    parts: [["Fees & charges","#6fc3a0",40],["Food","#e3b341",20],["Shopping","#a855f7",17],["Groceries","#5aad3f",10],["Bills","#4a90e2",8],["Other","#5b6469",5]]
  };
  function donutHTML() {
    const C = 2 * Math.PI * DONUT.r;
    let start = 0;
    const arcs = DONUT.parts.map(([name, color, pct], i) => {
      const len = pct / 100 * C;
      const html = `<circle class="demo-arc" cx="60" cy="60" r="${DONUT.r}" style="--c:${color};--a:${(len - DONUT.gap).toFixed(2)};--b:${(C - len + DONUT.gap).toFixed(2)};--n:${i};stroke-dashoffset:${(-start).toFixed(2)}"/>`;
      start += len;
      return html;
    }).join("");
    const legendRows = DONUT.parts.map(([name, color, pct]) =>
      `<span><b><i style="background:${color}"></i>${name}</b><strong>${pct}%</strong></span>`).join("");
    const label = DONUT.parts.map(([name, , pct]) => `${name} ${pct}%`).join(", ");
    return `<article class="report-demo report-demo--donut" role="img" aria-label="Spending by category. Total ₹12,619. ${label}."><h3>Spending by Category</h3><div class="demo-cat"><div class="demo-donut" style="--circ:${C.toFixed(2)}"><svg viewBox="0 0 120 120" aria-hidden="true">${arcs}</svg><span>₹12.6K<small>Total Spent</small></span></div><div class="demo-legend">${legendRows}</div></div></article>`;
  }
  const cards = [
    `<article class="report-demo" role="img" aria-label="Income ₹27,600, spent ₹12,619, left over this month ₹14,981"><div class="demo-pills"><span>All</span><span class="selected">Monthly</span><span>Yearly</span><span class="demo-chip">Sep 2026 <svg class="demo-chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div><div class="demo-statrow"><div class="demo-stat"><small class="demo-label"><i class="demo-bar"></i>Income</small><strong data-count="27600">₹27,600</strong><em>↗ +0% vs last month</em></div><div class="demo-stat spent"><small class="demo-label"><i class="demo-bar"></i>Spent</small><strong data-count="12619">₹12,619</strong><em>↗ +0% vs last month</em></div></div><div class="demo-leftover"><span>Left over this month</span><strong data-count="14981">₹14,981</strong></div></article>`,
    `<article class="report-demo" role="img" aria-label="Spending insights"><h3>✦ Spending Insights</h3><div class="demo-insight">↘ &nbsp; Your highest spending category is Fees &amp; charges (₹5,000).</div><div class="demo-insight red">↗ &nbsp; You spent ₹12,619 during this period.</div></article>`,
    trendCardHTML(),
    `<article class="report-demo" role="img" aria-label="Income versus spending for the last six months. September: income ₹27,600, spent ₹12,619."><h3>Income vs Spent <span class="demo-chip" style="float:right">Last 6 months</span></h3><div class="demo-legend-row"><span><i></i>Income</span><span><i></i>Spent</span></div><div class="demo-bar-chart">${bars}</div><div class="demo-labels">${monthLabels}</div></article>`,
    donutHTML(),
    `<article class="report-demo" role="img" aria-label="Top spending categories ranked"><h3>Top Categories</h3><div class="demo-rank">${rank}</div></article>`
  ];
  progress.append("1 / 6");
  const dotWrap = document.createElement("div"); dotWrap.className = "reports-dots";
  function pinMetrics() {
    const trackTop = track.getBoundingClientRect().top + scrollY;
    const pinTop = parseFloat(getComputedStyle(pinned).top) || 0;
    const distance = Math.max(1, track.offsetHeight - pinned.offsetHeight);
    return {start: trackTop - pinTop, distance};
  }
  const dotButtons = steps.map((_, index) => {
    const button = document.createElement("button"); button.className = "reports-dot"; button.type = "button";
    button.setAttribute("aria-label", `Go to report ${index+1}: ${steps[index][0]}`);
    button.addEventListener("click", () => {
      const {start, distance} = pinMetrics();
      window.scrollTo({
        top: start + (index + 0.5) * distance / steps.length,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
    dotWrap.append(button); return button;
  });
  progress.append(dotWrap); visuals.innerHTML = cards.join("");
  setupTrend(visuals.querySelector("[data-trend]"));
  const cardsEl = [...visuals.children];
  let active = -1, queued = false;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const counters = [...visuals.querySelectorAll("[data-count]")];
  const rupee = n => "₹" + Math.round(n).toLocaleString("en-IN");
  let counterRaf = 0, inView = !("IntersectionObserver" in window);
  function setCounters(f) { counters.forEach(el => { el.textContent = rupee(+el.dataset.count * f); }); }
  function playCounters() {
    cancelAnimationFrame(counterRaf);
    if (reduceMotion.matches) { setCounters(1); return; }
    const start = performance.now(), duration = 1100;
    setCounters(0);
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      setCounters(1 - Math.pow(1 - t, 3));
      if (t < 1) counterRaf = requestAnimationFrame(tick);
    };
    counterRaf = requestAnimationFrame(tick);
  }
  if (!reduceMotion.matches && "IntersectionObserver" in window) setCounters(0);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const was = inView; inView = entry.isIntersecting;
      if (inView && !was && active === 0) playCounters();
    }, { threshold: 0.4 }).observe(pinned);
  }
  function activate(index) {
    if (index === active) return; active = index; root.dataset.step = index;
    title.textContent = steps[index][0]; description.textContent = steps[index][1]; takeaway.textContent = steps[index][2];
    progress.firstChild.textContent = `${index+1} / 6`;
    dotButtons.forEach((b,i) => i === index ? b.setAttribute("aria-current","step") : b.removeAttribute("aria-current"));
    cardsEl.forEach((card,i) => card.classList.toggle("is-active", i === index));
    if (index === 0) { if (inView) playCounters(); }
    else { cancelAnimationFrame(counterRaf); setCounters(1); }
  }
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const {start, distance} = pinMetrics();
      const p = Math.max(0, Math.min(1, (scrollY - start) / distance));
      activate(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    });
  }
  window.addEventListener("scroll", onScroll, {passive:true}); window.addEventListener("resize", onScroll, {passive:true}); onScroll();
})();
