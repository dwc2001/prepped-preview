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
