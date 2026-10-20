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
  const categories = [["Fees & charges", "#6fc3a0", "₹5,000", "40%"], ["Food", "#e3b341", "₹2,500", "20%"], ["Shopping", "#a855f7", "₹2,200", "17%"], ["Groceries", "#5aad3f", "₹1,290", "10%"], ["Bills", "#4a90e2", "₹961", "8%"]];
  const steps = [
    ["Income and spent, side by side", "Choose All, Monthly or Yearly, pick a month, and see what came in and what went out. Each number shows the change from the previous month.", "You always know how much is left after spending."],
    ["Insights in plain words", "Instead of making you read charts, SpendTrack writes the key point for you, like which category cost the most.", "The one thing worth noticing this month."],
    ["See which days spiked", "The daily trend plots every day of the month. Follow the dot to a spike and see the exact amount spent that day.", "Spot the day a big expense happened."],
    ["Income against spending", "Six months of income and spending sit in paired bars, so you can tell right away whether you saved or overspent.", "Are you spending more than you earn?"],
    ["Where the money went", "The donut splits your total spend by category with a percentage for each, so the biggest slice stands out.", "Your biggest category at a glance."],
    ["Categories, ranked", "Top categories are ranked by amount with their share of the total, using the same icons and colors as your transactions.", "What to cut first if you want to spend less."]
  ];
  const legend = categories.map(([n,c,,p]) => `<span><b><i style="background:${c}"></i>${n}</b><strong>${p}</strong></span>`).join("");
  const rank = categories.map(([n,c,a,p]) => `<div class="demo-rank-row"><span class="demo-icon" style="--c:${c}">${n[0]}</span><div><strong>${n}</strong><div class="demo-track"><i style="--w:${p};--c:${c}"></i></div></div><div><strong>${a}</strong><br><small>${p} of total</small></div></div>`).join("");
  const bars = [[9,4],[14,6.2],[11,5],[18,7.5],[27.6,12.6],[15,9]].map(([i,s])=>`<div class="demo-month" style="--i:${i/30*100}%;--s:${s/30*100}%"><i></i><i></i></div>`).join("");
  const cards = [
    `<article class="report-demo" role="img" aria-label="Income and spending summary card"><div class="demo-pills"><span>All</span><span class="selected">Monthly</span><span>Yearly</span><span class="demo-chip">Sep 2026 <span aria-hidden="true">⌄</span></span></div><div class="demo-statrow"><div class="demo-stat"><small>▏ Income</small><strong>₹27,600</strong><em>↗ +0% vs last month</em></div><div class="demo-stat spent"><small>▏ Spent</small><strong>₹12,619</strong><em>↗ +0% vs last month</em></div></div><div class="demo-leftover"><span>Left over this month</span><strong>₹14,981</strong></div></article>`,
    `<article class="report-demo" role="img" aria-label="Spending insights"><h3>✦ Spending Insights</h3><div class="demo-insight">↘ &nbsp; Your highest spending category is Fees &amp; charges (₹5,000).</div><div class="demo-insight red">↗ &nbsp; You spent ₹12,619 during this period.</div></article>`,
    `<article class="report-demo" role="img" aria-label="Daily spending trend chart"><h3>Spending Trend <span class="demo-chip" style="float:right">Daily</span></h3><svg class="trend-svg" viewBox="0 0 500 260"><g stroke="#555" stroke-width="1"><path d="M55 35H480M55 80H480M55 125H480M55 170H480"/></g><g fill="#999" font-size="12"><text x="8" y="40">₹4K</text><text x="8" y="85">₹3K</text><text x="8" y="130">₹2K</text><text x="8" y="175">₹1K</text><text x="53" y="220">1</text><text x="120" y="220">5</text><text x="190" y="220">10</text><text x="260" y="220">15</text><text x="330" y="220">20</text><text x="400" y="220">25</text><text x="465" y="220">30</text></g><path d="M55 195 Q65 185 70 198 Q78 210 83 166 Q90 130 96 195 Q104 211 111 105 Q118 60 126 193 Q136 211 144 174 Q153 150 160 199 L240 199 Q248 130 257 199 L270 199 Q280 195 286 45 Q292 25 299 198 L380 198 Q392 187 402 197 Q412 205 424 198 Q435 190 444 190 Q453 198 462 198 Q470 198 477 166" fill="none" stroke="#4de09a" stroke-width="3" stroke-linecap="round"/><circle cx="286" cy="45" r="7" fill="#4de09a" stroke="white" stroke-width="2"/><rect x="218" y="5" width="137" height="26" rx="8" fill="#17231f" stroke="#4de09a"/><text x="230" y="23" fill="white" font-size="12">17 Sep · ₹3,800</text></svg></article>`,
    `<article class="report-demo" role="img" aria-label="Income versus spending for six months"><h3>Income vs Spent <span class="demo-chip" style="float:right">Last 6 months</span></h3><p style="color:#bbb">🟩 Income　 🟥 Spent</p><div class="demo-bar-chart">${bars}</div><div class="demo-labels"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></article>`,
    `<article class="report-demo" role="img" aria-label="Spending by category donut chart"><h3>Spending by Category</h3><div class="demo-cat"><div class="demo-donut"><span>₹12.6K<small>Total Spent</small></span></div><div class="demo-legend">${legend}</div></div></article>`,
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
  const cardsEl = [...visuals.children];
  let active = -1, queued = false;
  function activate(index) {
    if (index === active) return; active = index; root.dataset.step = index;
    title.textContent = steps[index][0]; description.textContent = steps[index][1]; takeaway.textContent = steps[index][2];
    progress.firstChild.textContent = `${index+1} / 6`;
    dotButtons.forEach((b,i) => i === index ? b.setAttribute("aria-current","step") : b.removeAttribute("aria-current"));
    cardsEl.forEach((card,i) => card.classList.toggle("is-active", i === index));
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
