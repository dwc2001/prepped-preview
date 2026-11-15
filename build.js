/* Build your pack: size, add-ons, summary and the Reserve dialog. */
(function () {
  var P = window.PREPPED;
  var KEY = "prepped-build";
  var WORDS = { 1: "one", 2: "two", 3: "three", 4: "four" };
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function addonById(id) { return P.addons.filter(function (a) { return a.id === id; })[0]; }
  function sizeFor(n) { return P.sizes.filter(function (s) { return s.people === n; })[0]; }
  function addonPrice(a, people) { return a.perPerson ? a.price * people : a.price; }

  /* ---------- State: URL first, then this session, then a sensible default ---------- */
  function clean(people, add) {
    people = Number(people);
    if (!(people >= 1 && people <= 4)) people = 2;
    people = Math.round(people);
    var ids = [];
    (add || []).forEach(function (id) { if (addonById(id) && ids.indexOf(id) === -1) ids.push(id); });
    return { people: people, addons: ids };
  }
  function load() {
    var q = new URLSearchParams(location.search);
    if (q.has("people") || q.has("add")) {
      return clean(q.get("people") || 2, (q.get("add") || "").split(",").filter(Boolean));
    }
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (s) return clean(s.people, s.addons);
    } catch (e) { /* storage blocked: fall through */ }
    return clean(2, []);
  }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
  }

  var state = load();

  /* ---------- Moves caused by a layout change glide instead of jumping ---------- */
  function flip(nodes, change) {
    nodes = nodes.filter(Boolean);
    var before = nodes.map(function (n) { return n.getBoundingClientRect().top; });
    change();
    nodes.forEach(function (n) { n.classList.remove("is-flip"); n.style.transform = ""; });
    var deltas = nodes.map(function (n, i) {
      var r = n.getBoundingClientRect();
      return r.height ? before[i] - r.top : 0;
    });
    nodes.forEach(function (n, i) {
      var d = deltas[i];
      /* A child moved by a parent in the list only needs its own share */
      nodes.forEach(function (p, j) { if (j !== i && p.contains(n)) d -= deltas[j]; });
      if (Math.abs(d) < 1) return;
      n.style.transform = "translateY(" + d + "px)";
    });
    void document.body.offsetHeight;
    nodes.forEach(function (n) {
      if (!n.style.transform) return;
      n.classList.add("is-flip");
      n.style.transform = "";
      n.addEventListener("transitionend", function done() {
        n.classList.remove("is-flip");
        n.removeEventListener("transitionend", done);
      });
    });
  }

  /* ---------- The pack picture and what is inside ---------- */
  var inside = $("inside");
  var pack = PreppedPack.mount($("pack"), {
    people: state.people,
    addons: state.addons,
    onPick: function (m) {
      flip([$("step-addons"), $("step-sum")], function () { showInside(m); });
    }
  });

  function showInside(m) {
    inside.textContent = "";
    if (!m) {
      inside.appendChild(el("p", "body inside-hint", "Tap any module to see what is in it."));
      return;
    }
    var box = el("div", "inside inside-swap");
    var head = el("div", "inside-head");
    var kind = m.kind === "core" ? "In the Core" : m.kind === "ration" ? "In each Ration case" : "Add-on module";
    head.appendChild(el("p", "small inside-kind", kind));
    head.appendChild(el("h2", "h3", m.name));
    head.appendChild(el("p", "body", m.line));
    box.appendChild(head);
    var ul = el("ul");
    m.items.forEach(function (t) { ul.appendChild(el("li", "", t)); });
    box.appendChild(ul);
    inside.appendChild(box);
  }

  /* ---------- Step 1: people ---------- */
  var seg = $("seg");
  seg.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-people]");
    if (!b) return;
    var n = Number(b.getAttribute("data-people"));
    if (n === state.people) return;
    state.people = n;
    update();
  });

  /* ---------- Step 2: add-on rows ---------- */
  var opts = $("opts");
  var rows = {};
  P.addons.forEach(function (a) {
    var b = el("button", "opt");
    b.type = "button";
    b.setAttribute("role", "switch");
    b.setAttribute("aria-checked", "false");
    b.setAttribute("data-id", a.id);
    var text = el("span", "opt-text");
    var top = el("span", "opt-top");
    top.appendChild(el("span", "opt-name", a.name));
    var price = el("span", "opt-price num");
    top.appendChild(price);
    text.appendChild(top);
    text.appendChild(el("span", "opt-line", a.line));
    b.appendChild(text);
    var sw = el("span", "switch");
    sw.setAttribute("aria-hidden", "true");
    b.appendChild(sw);
    b.addEventListener("click", function () {
      var i = state.addons.indexOf(a.id);
      if (i === -1) state.addons.push(a.id); else state.addons.splice(i, 1);
      /* Keep the order of the list, not the order of taps */
      state.addons = P.addons.map(function (x) { return x.id; }).filter(function (id) { return state.addons.indexOf(id) !== -1; });
      update();
    });
    opts.appendChild(b);
    rows[a.id] = { node: b, price: price };
  });

  /* ---------- Step 3: summary ---------- */
  var sum = $("sum");
  var shown = {};

  function sumLines() {
    var size = sizeFor(state.people);
    var lines = [{
      key: "pack", name: "Pack " + size.name.toLowerCase(),
      sub: "Core and " + state.people + " Ration case" + (state.people > 1 ? "s" : ""),
      price: size.price
    }];
    state.addons.forEach(function (id) {
      var a = addonById(id);
      lines.push({ key: id, name: a.name, sub: a.perPerson ? "One per person" : "", price: addonPrice(a, state.people) });
    });
    return lines;
  }

  function lineNode(l) {
    var li = el("li");
    var left = el("span");
    left.appendChild(el("span", "", l.name));
    if (l.sub) left.appendChild(el("span", "sum-sub", l.sub));
    li.appendChild(left);
    li.appendChild(el("span", "num", P.money(l.price)));
    return li;
  }

  function renderSum(animate) {
    var lines = sumLines();
    var next = {};
    sum.textContent = "";
    lines.forEach(function (l) {
      var li = lineNode(l);
      if (animate && !shown[l.key]) li.classList.add("is-new");
      sum.appendChild(li);
      next[l.key] = true;
    });
    shown = next;
  }

  /* ---------- One update for every change ---------- */
  function paint(animate) {
    var n = state.people;
    seg.setAttribute("data-value", String(n));
    seg.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", Number(b.getAttribute("data-people")) === n ? "true" : "false");
    });
    var word = WORDS[n];
    $("people-note").textContent = n === 1
      ? "One Ration case, 14 days of food."
      : word.charAt(0).toUpperCase() + word.slice(1) + " Ration cases, 14 days of food each.";

    P.addons.forEach(function (a) {
      var r = rows[a.id];
      var on = state.addons.indexOf(a.id) !== -1;
      r.node.setAttribute("aria-checked", on ? "true" : "false");
      r.price.textContent = a.perPerson ? P.money(a.price * n) + " for " + word : P.money(a.price);
    });

    renderSum(animate);
    var total = P.money(P.total(n, state.addons));
    $("total").textContent = total;
    $("total-phone").textContent = total;
    pack.set({ people: n, addons: state.addons });
  }

  function update() {
    flip([inside, $("step-addons"), $("step-sum"), $("sum-total"), $("reserve")], function () { paint(true); });
    save();
  }

  paint(false);

  /* ---------- Reserve dialog ---------- */
  var opener = null;
  var dlg = null;
  var lockedY = 0;

  function lock() {
    lockedY = window.scrollY;
    document.body.style.top = -lockedY + "px";
    document.body.classList.add("is-locked");
  }
  function unlock() {
    document.body.classList.remove("is-locked");
    document.body.style.top = "";
    window.scrollTo({ top: lockedY, behavior: "instant" });
  }

  function field(id, label, attrs) {
    var f = el("div", "field");
    var lab = el("label", "", label);
    lab.htmlFor = id;
    var input = el("input");
    input.id = id;
    Object.keys(attrs).forEach(function (k) { input.setAttribute(k, attrs[k]); });
    var err = el("p", "field-err");
    err.id = id + "-err";
    input.setAttribute("aria-describedby", err.id);
    f.appendChild(lab); f.appendChild(input); f.appendChild(err);
    return { wrap: f, input: input, err: err };
  }

  function summaryBlock() {
    var frag = document.createDocumentFragment();
    var ul = el("ul", "sum");
    sumLines().forEach(function (l) { ul.appendChild(lineNode(l)); });
    frag.appendChild(ul);
    var t = el("div", "sum-total");
    t.appendChild(el("span", "", "Total"));
    t.appendChild(el("span", "num", P.money(P.total(state.people, state.addons))));
    frag.appendChild(t);
    return frag;
  }

  function closeIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M6 6l12 12M18 6L6 18");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("fill", "none");
    svg.appendChild(p);
    return svg;
  }

  function openDialog(from) {
    if (dlg) return;
    opener = from;
    var root = el("div", "rs-root");
    var scrim = el("div", "rs-scrim");
    var wrap = el("div", "rs-wrap");
    var card = el("div", "rs");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "rs-title");

    var close = el("button", "btn btn-quiet btn-small rs-close");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.appendChild(closeIcon());
    close.addEventListener("click", closeDialog);
    card.appendChild(close);

    var body = el("div", "rs-body");
    card.appendChild(body);
    wrap.appendChild(card);
    root.appendChild(scrim);
    root.appendChild(wrap);
    document.body.appendChild(root);
    scrim.addEventListener("click", closeDialog);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeDialog(); });

    dlg = { root: root, card: card, body: body };
    showForm();
    lock();
    document.addEventListener("keydown", onKey, true);
    void root.offsetHeight; /* commit the closed state so the open state animates */
    root.classList.add("rs-open");
  }

  function showForm() {
    var body = dlg.body;
    body.textContent = "";
    var head = el("div", "rs-head");
    var h = el("h2", "h3", "Reserve your pack");
    h.id = "rs-title";
    head.appendChild(h);
    head.appendChild(el("p", "small", "No payment is taken. This is a preview of the site."));
    body.appendChild(head);

    var form = el("form", "rs-form");
    form.noValidate = true;
    var name = field("rs-name", "Full name", { type: "text", autocomplete: "name", autocapitalize: "words", enterkeyhint: "next" });
    var email = field("rs-email", "Email", { type: "email", autocomplete: "email", inputmode: "email", autocapitalize: "off", spellcheck: "false", enterkeyhint: "next" });
    var zip = field("rs-zip", "ZIP code", { type: "text", autocomplete: "postal-code", inputmode: "numeric", maxlength: "10", enterkeyhint: "done" });
    form.appendChild(name.wrap); form.appendChild(email.wrap); form.appendChild(zip.wrap);
    var submit = el("button", "btn btn-main", "Reserve");
    submit.type = "submit";
    form.appendChild(submit);
    body.appendChild(form);

    [name, email, zip].forEach(function (f) {
      f.input.addEventListener("input", function () {
        if (f.input.getAttribute("aria-invalid") === "true") { f.err.textContent = ""; f.input.removeAttribute("aria-invalid"); }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checks = [
        [name, name.input.value.trim().length >= 2, "Enter your full name."],
        [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.input.value.trim()), "Enter an email address like name@example.com."],
        [zip, /^\d{5}(-\d{4})?$/.test(zip.input.value.trim()), "Enter a 5 digit ZIP code, like 30301."]
      ];
      var first = null;
      checks.forEach(function (c) {
        var f = c[0];
        if (c[1]) { f.err.textContent = ""; f.input.removeAttribute("aria-invalid"); }
        else { f.err.textContent = c[2]; f.input.setAttribute("aria-invalid", "true"); if (!first) first = f.input; }
      });
      if (first) { first.focus(); return; }
      showDone();
    });
    name.input.focus({ preventScroll: true });
  }

  function showDone() {
    var body = dlg.body;
    body.textContent = "";
    var head = el("div", "rs-head inside-swap");
    var h = el("h2", "h3");
    h.id = "rs-title";
    h.appendChild(document.createTextNode("You’re Prepped"));
    h.appendChild(el("span", "stop", "."));
    head.appendChild(h);
    head.appendChild(el("p", "small", "Your reservation number"));
    head.appendChild(el("p", "rs-num num", "PR-" + String(10000 + Math.floor(Math.random() * 90000))));
    body.appendChild(head);
    body.appendChild(summaryBlock());
    var done = el("button", "btn btn-main rs-done", "Done");
    done.type = "button";
    done.addEventListener("click", closeDialog);
    body.appendChild(done);
    done.focus({ preventScroll: true });
  }

  function focusables() {
    return Array.prototype.slice.call(dlg.card.querySelectorAll("button, input, a[href]"))
      .filter(function (n) { return !n.disabled && n.offsetParent !== null; });
  }

  function onKey(e) {
    if (!dlg) return;
    if (e.key === "Escape") { e.preventDefault(); closeDialog(); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!dlg.card.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function closeDialog() {
    if (!dlg) return;
    var d = dlg;
    dlg = null;
    document.removeEventListener("keydown", onKey, true);
    d.root.classList.remove("rs-open");
    unlock();
    if (opener) opener.focus({ preventScroll: true });
    var gone = false;
    function remove() { if (!gone) { gone = true; d.root.remove(); } }
    d.card.addEventListener("transitionend", remove);
    setTimeout(remove, 400);
  }

  $("reserve").addEventListener("click", function () { openDialog(this); });
  $("reserve-phone").addEventListener("click", function () { openDialog(this); });
})();
