/* Home page behaviour. */
(function () {
  var P = window.PREPPED;
  var WORDS = ["", "one", "two", "three", "four"];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* What is inside: the pack picture, the people picker, the contents panel */
  var panel = document.getElementById("inside-panel");
  var pack = window.PreppedPack.mount(document.getElementById("pack"), {
    people: 2,
    dock: false,
    onPick: function (m) {
      panel.textContent = "";
      if (!m) { tally(); return; }
      var open = el("div", "inside-open inside-swap");
      var what = el("div", "inside-what");
      what.appendChild(el("h3", "h3", m.name));
      what.appendChild(el("p", "body", m.kind === "ration" ? "One case for each person." : "In the Core, shared by the household."));
      var box = el("div", "inside");
      var list = el("ul");
      m.items.forEach(function (it) { list.appendChild(el("li", "", it)); });
      box.appendChild(list);
      open.appendChild(what);
      open.appendChild(box);
      panel.appendChild(open);
    }
  });

  /* Before anything is tapped: what the whole pack adds up to for this household */
  function tally() {
    var n = pack ? pack.get().people : 2;
    panel.textContent = "";
    var open = el("div", "inside-open inside-swap");
    var what = el("div", "inside-what");
    what.appendChild(el("h3", "h3", n === 1 ? "For one person" : "For " + WORDS[n] + " people"));
    what.appendChild(el("p", "body", "Tap any module to see what is in it."));
    var box = el("div", "inside");
    var list = el("ul");
    [
      (42 * n) + " meals, " + P.days + " days each",
      (3 * n) + " days of sealed water, then the filter",
      n === 1 ? "A blanket, a bivvy and a headlamp" : "A blanket, a bivvy and a headlamp each",
      "One Core, shared",
      n === 1 ? "Two cases on the shelf" : (n + 1) + " cases on the shelf"
    ].forEach(function (it) { list.appendChild(el("li", "", it)); });
    box.appendChild(list);
    open.appendChild(what);
    open.appendChild(box);
    panel.appendChild(open);
  }
  tally();

  var seg = document.getElementById("people");
  seg.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-people]");
    if (!b) return;
    var n = Number(b.getAttribute("data-people"));
    seg.setAttribute("data-value", String(n));
    Array.prototype.forEach.call(seg.querySelectorAll("button"), function (x) {
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
    pack.set({ people: n });
    if (!pack.get().picked) tally();
  });

  /* Modules */
  var addonRows = document.getElementById("addon-rows");
  P.addons.forEach(function (a) {
    var li = el("li");
    var row = el("div", "row");
    row.appendChild(el("span", "row-name", a.name));
    row.appendChild(el("span", "row-line", a.line));
    var price = el("span", "row-price num", P.money(a.price));
    if (a.perPerson) price.appendChild(el("small", "", "per person"));
    row.appendChild(price);
    li.appendChild(row);
    addonRows.appendChild(li);
  });

  /* Sizes */
  var sizeRows = document.getElementById("size-rows");
  P.sizes.forEach(function (s) {
    var li = el("li");
    var a = el("a", "row");
    a.href = "build.html?people=" + s.people;
    a.setAttribute("aria-label", s.name + ", " + P.money(s.price) + ". Build this pack");
    a.appendChild(el("span", "row-name", s.name));
    a.appendChild(el("span", "row-line", "The Core and " + WORDS[s.people] + " Ration " + (s.people === 1 ? "case" : "cases") + "."));
    var go = el("span", "row-go");
    go.appendChild(el("span", "row-price num", P.money(s.price)));
    go.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h12M10.5 4.5 15 9l-4.5 4.5"/></svg>');
    a.appendChild(go);
    li.appendChild(a);
    sizeRows.appendChild(li);
  });

  /* Sections rise once as you reach them. Two triggers, so nothing can stay hidden:
     the observer, and a plain position check on scroll. */
  var waiting = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function show(n) {
    n.classList.add("is-in");
    waiting = waiting.filter(function (x) { return x !== n; });
    if (!waiting.length) window.removeEventListener("scroll", check);
  }
  function check() {
    var line = window.innerHeight * 0.92;
    waiting.slice().forEach(function (n) {
      if (n.getBoundingClientRect().top < line) show(n);
    });
  }
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    waiting.forEach(function (n) { io.observe(n); });
  }
  check();
})();
