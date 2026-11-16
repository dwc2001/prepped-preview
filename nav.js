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
