/* Phone menu: the button in the bar opens the section links under it. */
(function () {
  var bar = document.querySelector(".bar");
  var btn = document.getElementById("bar-menu");
  if (!bar || !btn) return;
  function set(open) {
    bar.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  btn.addEventListener("click", function () { set(!bar.classList.contains("is-open")); });
  document.addEventListener("click", function (e) {
    if (!bar.classList.contains("is-open")) return;
    if (e.target.closest("#bar-sheet a") || !e.target.closest(".bar")) set(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && bar.classList.contains("is-open")) { set(false); btn.focus(); }
  });
})();

/* On the home page, the bar shows which section you are in. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.bar-links a[href^="#"]'));
  if (!links.length) return;
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var ticking = false;
  function mark() {
    ticking = false;
    var line = window.innerHeight * 0.4, current = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < line) current = i; });
    var last = targets[targets.length - 1];
    if (last && last.getBoundingClientRect().bottom < line) current = -1;
    links.forEach(function (a, i) {
      if (i === current) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(mark); }
  }, { passive: true });
  mark();
})();

/* Light and dark. Follows the device until the person picks one; the pick is remembered. */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById("theme-btn");
  var row = document.getElementById("theme-row");
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var SUN = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.4"/><path d="M10 2.2v1.9M10 15.900v1.900M2.200 10h1.900M15.900 10h1.900M4.500 4.500l1.300 1.300M14.200 14.200l1.300 1.300M4.500 15.500l1.300-1.300M14.200 5.800l1.300-1.300"/></svg>';
  var MOON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16.500 11.600A6.800 6.800 0 0 1 8.400 3.500a6.800 6.800 0 1 0 8.100 8.100z"/></svg>';

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : system.matches;
  }
  function paint() {
    var dark = isDark();
    if (btn) {
      btn.innerHTML = dark ? SUN : MOON;
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    if (row) row.setAttribute("aria-checked", dark ? "true" : "false");
    var bg = getComputedStyle(root).getPropertyValue("--page").trim();
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
      m.setAttribute("content", bg);
    });
  }
  function flip() {
    var next = isDark() ? "light" : "dark";
    root.classList.add("theme-fade");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("prepped-theme", next); } catch (e) {}
    paint();
    setTimeout(function () { root.classList.remove("theme-fade"); }, 280);
  }
  if (btn) btn.addEventListener("click", flip);
  if (row) row.addEventListener("click", flip);
  if (system.addEventListener) system.addEventListener("change", paint);
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  paint();
})();
