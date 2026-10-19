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

const form = document.querySelector("#waitlist-form");
const emailInput = document.querySelector("#email");
const message = document.querySelector("#form-message");

if (form && emailInput && message) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    message.classList.remove("success", "error");
    if (!validEmail) {
      message.textContent = "Please enter a valid email address.";
      message.classList.add("error");
      emailInput.focus();
      return;
    }

    // The landing page is static at this stage. Do not imply that an email
    // was saved until a real waitlist provider/backend has been connected.
    message.textContent = "Looks good! The waitlist isn't connected yet, so your email has not been saved. We'll connect signup before launch.";
    message.classList.add("success");
  });
}
