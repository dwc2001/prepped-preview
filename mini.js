/* On a phone the pack picture scrolls away while you add modules, so a small
   copy of it stays under the top bar. It reads the real picture, so the two never disagree. */
(function () {
  var P = window.PREPPED;
  var pack = document.getElementById("pack");
  var mini = document.getElementById("mini");
  if (!pack || !mini) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var row = el("div", "mini-row");
  row.appendChild(el("span", "mini-core"));
  var rations = [];
  for (var i = 0; i < 4; i++) { var r = el("span", "mini-ration"); row.appendChild(r); rations.push(r); }
  row.appendChild(el("span", "mini-gap"));
  var pips = {};
  P.addons.forEach(function (a) { var p = el("span", "mini-pip"); row.appendChild(p); pips[a.id] = p; });
  var words = el("p", "small mini-words");
  mini.appendChild(row);
  mini.appendChild(words);

  function read() {
    var people = Number(pack.getAttribute("data-people")) || 1;
    rations.forEach(function (r, idx) { r.classList.toggle("is-out", idx >= people); });
    var on = [];
    var tiles = pack.querySelectorAll(".tile.addon");
    P.addons.forEach(function (a, idx) {
      var added = tiles[idx] && !tiles[idx].classList.contains("is-off");
      pips[a.id].classList.toggle("is-on", !!added);
      if (added) on.push(a.name);
    });
    words.textContent = on.length ? "Added: " + on.join(", ") : "The pack as it comes. No modules added.";
  }

  new MutationObserver(read).observe(pack, { attributes: true, subtree: true, attributeFilter: ["class", "data-people"] });
  read();
})();
