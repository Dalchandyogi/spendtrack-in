const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".desktop-nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }));
}

const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  let scrollUpdatePending = false;
  const updateHeaderOnScroll = () => {
    if (scrollUpdatePending) return;
    scrollUpdatePending = true;
    window.requestAnimationFrame(() => {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 36);
      scrollUpdatePending = false;
    });
  };
  window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
  updateHeaderOnScroll();
}

/* Scroll-spy: highlight the nav link of the section currently on screen */
(() => {
  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const items = links
    .map((link) => ({ link, section: document.getElementById(link.getAttribute("href").slice(1)) }))
    .filter((item) => item.section)
    .sort((a, b) => a.section.getBoundingClientRect().top - b.section.getBoundingClientRect().top);
  if (!items.length) return;

  let current = null;
  let queued = false;

  const setActive = (item) => {
    if (item === current) return;
    current = item;
    items.forEach((entry) => {
      const on = entry === item;
      entry.link.classList.toggle("is-active", on);
      if (on) entry.link.setAttribute("aria-current", "location");
      else entry.link.removeAttribute("aria-current");
    });
  };

  const update = () => {
    queued = false;
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 90;
    const line = pad + 40;
    let active = null;
    items.forEach((item) => {
      const rect = item.section.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) active = item;
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) active = items[items.length - 1];
    setActive(active);
  };

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  window.addEventListener("hashchange", request);
  window.addEventListener("load", request);
  window.addEventListener("pageshow", request);
  request();
})();

const quickAddFlow = document.querySelector("[data-quickadd-flow]");
if (quickAddFlow) {
  const stages = [...quickAddFlow.querySelectorAll("[data-stage]")];
  const nodes = [...quickAddFlow.querySelectorAll("[data-flow-node]")];
  const routeSvg = quickAddFlow.querySelector(".quickadd-route");
  const routeBranches = quickAddFlow.querySelector(".quickadd-route-branches");
  const routeBase = quickAddFlow.querySelector(".quickadd-route-base");
  const routeProgress = quickAddFlow.querySelector(".quickadd-route-progress");
  const routeDot = quickAddFlow.querySelector(".quickadd-route-dot");
  const routeArrows = [...quickAddFlow.querySelectorAll(".quickadd-arrows span")];
  const sourceOptions = [...quickAddFlow.querySelectorAll("[data-upi-source]")];
  const doneButton = quickAddFlow.querySelector("[data-confirm-done]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transactions = [
    { app: "PhonePe", merchant: "Flipkart", amount: 114, category: "Shopping", description: "Paid to Flipkart · UPI", kind: "spent", time: "10:35 am" },
    { app: "Google Pay", merchant: "Cafe Coffee", amount: 280, category: "Food", description: "Coffee with friends · UPI", kind: "spent", time: "10:41 am" },
    { app: "Paytm", merchant: "Cashback received", amount: 1000, category: "Income", description: "Cashback received · UPI", kind: "income", time: "10:48 am" },
  ];
  let points = [];
  let segmentLengths = [];
  let routeLength = 0;
  let timer = 0;
  let frame = 0;
  let isVisible = !("IntersectionObserver" in window);
  let running = false;
  let dotSegment = 0;
  let dotProgress = 0;
  let transactionIndex = 0;
  let transactionCommitted = false;
  let transactionPending = false;
  let homeIncome = 29200;
  let homeSpent = 126579;

  const activeTransaction = () => transactions[transactionIndex % transactions.length];
  const money = (amount) => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
  const categoryIconName = { Food: "food", Shopping: "shopping", Income: "income", Bonus: "bonus", "Personal care": "personal" };

  function setCategoryIcon(container, category) {
    const iconUse = container && container.querySelector("use");
    if (iconUse) iconUse.setAttribute("href", `#qicon-${categoryIconName[category] || "other"}`);
  }

  function updateTransactionCopy() {
    const transaction = activeTransaction();
    const today = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    const values = {
      "[data-tx-merchant]": `${transaction.kind === "income" ? "Received" : "Paid"} ${money(transaction.amount)} · ${transaction.merchant}`,
      "[data-tx-app]": transaction.app,
      "[data-tx-time]": transaction.time,
      "[data-tx-category]": transaction.category,
      "[data-tx-date]": today,
      "[data-tx-description]": transaction.description,
      "[data-tx-amount]": `${transaction.kind === "income" ? "+" : "−"} ${money(transaction.amount)}`,
    };
    Object.entries(values).forEach(([selector, value]) => {
      const element = quickAddFlow.querySelector(selector);
      if (element) element.textContent = value;
    });
    setCategoryIcon(quickAddFlow.querySelector(".confirm-category-icon"), transaction.category);
    const categoryGrid = quickAddFlow.querySelector("[data-category-grid]");
    if (categoryGrid) categoryGrid.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("is-selected", item.dataset.category === transaction.category));
    sourceOptions.forEach((source, index) => source.classList.toggle("is-current", index === transactionIndex % sourceOptions.length));
  }

  function addTransactionToHome() {
    if (transactionCommitted) return;
    transactionCommitted = true;
    const transaction = activeTransaction();
    if (transaction.kind === "income") homeIncome += transaction.amount;
    else homeSpent += transaction.amount;
    const income = quickAddFlow.querySelector("[data-home-income]");
    const spent = quickAddFlow.querySelector("[data-home-spent]");
    if (income) income.textContent = money(homeIncome);
    if (spent) spent.textContent = money(homeSpent);
    const list = quickAddFlow.querySelector("[data-home-transactions]");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "phone-transaction is-new-transaction";
    const badge = document.createElement("i");
    badge.className = `tx-badge ${transaction.kind === "income" ? "green-tint" : "purple-tint"}`;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "category-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const iconUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
    iconUse.setAttribute("href", `#qicon-${categoryIconName[transaction.category] || "other"}`);
    icon.append(iconUse);
    badge.append(icon);
    const detail = document.createElement("span");
    const title = document.createElement("b");
    title.textContent = transaction.category;
    const subtitle = document.createElement("small");
    const transactionDate = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
    subtitle.textContent = `${transaction.app} · ${transactionDate} · ${transaction.time}`;
    detail.append(title, subtitle);
    const amount = document.createElement("strong");
    amount.className = transaction.kind === "income" ? "positive-amount" : "negative-amount";
    amount.textContent = `${transaction.kind === "income" ? "+" : "−"} ${money(transaction.amount)}`;
    row.append(badge, detail, amount);
    list.prepend(row);
    while (list.children.length > 3) list.lastElementChild.remove();
  }

  function updateRoute() {
    if (!routeSvg || !routeBase || !routeProgress || !routeDot) return;
    const svgRect = routeSvg.getBoundingClientRect();
    if (!svgRect.width || !svgRect.height) return;
    routeSvg.setAttribute("viewBox", `0 0 ${svgRect.width} ${svgRect.height}`);
    const nodePoints = nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - svgRect.left,
        y: rect.top + rect.height / 2 - svgRect.top,
      };
    });
    const selectedSource = sourceOptions[transactionIndex % sourceOptions.length];
    const sourcePoints = sourceOptions.map((source) => {
      const icon = source.querySelector("i") || source;
      const rect = icon.getBoundingClientRect();
      return { x: rect.right - svgRect.left, y: rect.top + rect.height / 2 - svgRect.top };
    });
    points = [...nodePoints];
    if (selectedSource && nodePoints.length) {
      const sourceIcon = selectedSource.querySelector("i") || selectedSource;
      const sourceRect = sourceIcon.getBoundingClientRect();
      const sourcePoint = {
        x: sourceRect.left + sourceRect.width / 2 - svgRect.left,
        y: sourceRect.top + sourceRect.height / 2 - svgRect.top,
      };
      const sharePoint = nodePoints[0];
      points = [sourcePoint, { x: sharePoint.x, y: sourcePoint.y }, ...nodePoints];
    }
    if (routeBranches && sourceOptions.length && nodePoints.length) {
      const sharePoint = nodePoints[0];
      const branchPaths = sourcePoints.map((point) => `M ${point.x} ${point.y} H ${sharePoint.x}`);
      const ys = sourcePoints.map((point) => point.y);
      branchPaths.push(`M ${sharePoint.x} ${Math.min(...ys)} V ${Math.max(...ys)}`);
      routeBranches.setAttribute("d", branchPaths.join(" "));
    }
    segmentLengths = [];
    routeLength = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      segmentLengths.push(length);
      routeLength += length;
      const arrow = routeArrows[index];
      if (arrow) {
        arrow.style.left = `${(start.x + end.x) / 2}px`;
        arrow.style.top = `${(start.y + end.y) / 2}px`;
        arrow.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(end.y - start.y, end.x - start.x)}rad)`;
      }
    }
    const route = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const downstreamStart = selectedSource ? 2 : 0;
    const downstreamRoute = points.slice(downstreamStart).map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    routeBase.setAttribute("d", downstreamRoute);
    routeProgress.setAttribute("d", route);
    renderDot(dotSegment, dotProgress);
  }

  function renderDot(segment, progress) {
    if (!points.length || !routeDot || !routeProgress) return;
    dotSegment = segment;
    dotProgress = progress;
    const start = points[Math.min(segment, points.length - 1)];
    const end = points[Math.min(segment + 1, points.length - 1)] || start;
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;
    routeDot.style.left = `${x}px`;
    routeDot.style.top = `${y}px`;
  }

  function resetStages() {
    stages.forEach((stage, index) => {
      stage.classList.remove("is-active", "is-complete", "is-revealed");
    });
    nodes.forEach((node, index) => { node.textContent = node.dataset.index || String(index + 2).padStart(2, "0"); });
    routeArrows.forEach((arrow) => arrow.classList.remove("is-passed"));
    sourceOptions.forEach((source) => source.classList.remove("is-current"));
    quickAddFlow.dataset.activeStage = "-1";
  }

  function revealStage(index) {
    stages.forEach((stage, stageIndex) => {
      stage.classList.toggle("is-revealed", stageIndex <= index);
      stage.classList.toggle("is-active", stageIndex === index);
      stage.classList.toggle("is-complete", stageIndex < index);
      const node = nodes[stageIndex];
      if (node) node.textContent = stageIndex < index ? "✓" : (node.dataset.index || "");
    });
    routeArrows.forEach((arrow, arrowIndex) => arrow.classList.toggle("is-passed", arrowIndex < index));
    sourceOptions.forEach((source, sourceIndex) => source.classList.toggle("is-current", sourceIndex === transactionIndex % sourceOptions.length));
    quickAddFlow.dataset.activeStage = String(index);
  }

  function stopSequence() {
    running = false;
    window.clearTimeout(timer);
    window.cancelAnimationFrame(frame);
    transactionPending = false;
    if (transactionCommitted) {
      transactionIndex = (transactionIndex + 1) % transactions.length;
      transactionCommitted = false;
    }
    resetStages();
    if (routeDot) routeDot.style.opacity = "0";
    dotSegment = 0;
    dotProgress = 0;
  }

  function animateToNext(segment, done) {
    updateRoute();
    if (!segmentLengths[segment] || !points.length) {
      done();
      return;
    }
    const startTime = performance.now();
    const duration = 850;
    const drawFrame = (now) => {
      if (!running) return;
      const rawProgress = Math.min(1, (now - startTime) / duration);
      const easedProgress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
      renderDot(segment, easedProgress);
      if (rawProgress < 1) frame = window.requestAnimationFrame(drawFrame);
      else done();
    };
    frame = window.requestAnimationFrame(drawFrame);
  }

  function scheduleStage(index) {
    if (!running) return;
    if (index === stages.length - 1) {
      timer = window.setTimeout(() => {
        transactionIndex = (transactionIndex + 1) % transactions.length;
        timer = window.setTimeout(beginCycle, 720);
      }, 2100);
      return;
    }
    if (index === stages.length - 2) {
      timer = window.setTimeout(() => {
        if (doneButton && !transactionCommitted) {
          doneButton.classList.add("is-pressing");
          doneButton.click();
        }
      }, 1050);
      return;
    }
    timer = window.setTimeout(() => {
      const firstSegment = index === 0 ? 0 : index + 1;
      const segmentCount = index === 0 ? 2 : 1;
      const animateSegment = (segmentOffset) => {
        if (segmentOffset >= segmentCount) {
          revealStage(index + 1);
          scheduleStage(index + 1);
          return;
        }
        animateToNext(firstSegment + segmentOffset, () => animateSegment(segmentOffset + 1));
      };
      animateSegment(0);
    }, 1150);
  }

  function beginCycle() {
    if (!running || reducedMotion.matches) return;
    resetStages();
    transactionCommitted = false;
    updateTransactionCopy();
    updateRoute();
    if (routeDot) routeDot.style.opacity = "1";
    renderDot(0, 0);
    timer = window.setTimeout(() => {
      revealStage(0);
      scheduleStage(0);
    }, 360);
  }

  if (doneButton) doneButton.addEventListener("click", () => {
    if (transactionCommitted || transactionPending || !running || quickAddFlow.dataset.activeStage !== "4") return;
    transactionPending = true;
    window.setTimeout(() => doneButton.classList.remove("is-pressing"), 220);
    animateToNext(5, () => {
      transactionPending = false;
      addTransactionToHome();
      revealStage(5);
      scheduleStage(5);
    });
  });

  function startSequence() {
    if (running || reducedMotion.matches || !isVisible) return;
    stopSequence();
    quickAddFlow.classList.add("is-animated");
    quickAddFlow.classList.remove("is-static");
    running = true;
    updateRoute();
    beginCycle();
  }

  function applyMotionPreference() {
    if (reducedMotion.matches) {
      stopSequence();
      quickAddFlow.classList.add("is-animated", "is-static");
      stages.forEach((stage) => stage.classList.add("is-revealed", "is-complete"));
      if (stages.length) stages[stages.length - 1].classList.add("is-active");
      quickAddFlow.dataset.activeStage = "static";
    } else {
      quickAddFlow.classList.remove("is-static");
      startSequence();
    }
  }

  quickAddFlow.classList.add("is-animated");
  updateRoute();
  if ("ResizeObserver" in window) new ResizeObserver(updateRoute).observe(quickAddFlow);
  else window.addEventListener("resize", updateRoute, { passive: true });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) startSequence();
      else stopSequence();
    }, { threshold: 0.15 });
    observer.observe(quickAddFlow);
  }
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", applyMotionPreference);
  else if (typeof reducedMotion.addListener === "function") reducedMotion.addListener(applyMotionPreference);
  applyMotionPreference();
}
