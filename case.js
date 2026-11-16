/* The pack, seen from above. Shared by both pages.

   var pack = PreppedPack.mount(el, { people: 2, addons: [], onPick: fn });
   pack.set({ people: 3 });               change household size (1 to 4)
   pack.set({ addons: ["pets", "comms"] }) fill those add-on slots under the pack
   pack.pick(null)                         clear the picked module

   onPick(module) is called with { id, name, line, items, kind } when a module
   is tapped, or null when the pick is cleared. kind is "core", "ration" or "addon".
   Nothing is picked until the person taps. */
(function () {
  var P = window.PREPPED;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(root, opts) {
    opts = opts || {};
    var state = { people: opts.people || 2, addons: (opts.addons || []).slice(), picked: null };
    var tiles = [];

    root.classList.add("pack");
    root.textContent = "";

    var row = el("div", "pack-row");
    root.appendChild(row);

    /* The Core */
    var core = el("div", "unit unit-core");
    var coreName = el("div", "unit-name");
    coreName.appendChild(el("span", "", "Core"));
    coreName.appendChild(el("span", "", "One per pack"));
    core.appendChild(coreName);
    var grid = el("div", "tiles");
    P.core.forEach(function (m) {
      grid.appendChild(makeTile(m, "core", m.id));
    });
    core.appendChild(grid);
    row.appendChild(core);

    /* Four Ration bays; only as many as there are people are shown */
    var rations = [];
    for (var i = 1; i <= 4; i++) {
      var r = el("div", "unit ration");
      var name = el("div", "unit-name");
      name.appendChild(el("span", "", "Ration " + i));
      name.appendChild(el("span", "", "14 days"));
      r.appendChild(name);
      var t = makeTile(P.ration, "ration", "ration-" + i, true);
      t.setAttribute("aria-label", "Ration case " + i + ", 14 days for one person");
      var days = el("div", "days");
      days.setAttribute("aria-hidden", "true");
      for (var d = 0; d < 14; d++) days.appendChild(el("span"));
      t.appendChild(days);
      var sip = el("div", "sip");
      sip.appendChild(el("span", "", "Water"));
      sip.appendChild(el("span", "", "3 days"));
      t.appendChild(sip);
      r.appendChild(t);
      row.appendChild(r);
      rations.push(r);
    }

    /* Add-on modules: six fixed slots under the pack, filled when chosen */
    var dock = el("div", "dock");
    var addonEls = {};
    if (opts.dock !== false) {
      root.appendChild(dock);
      P.addons.forEach(function (a) {
        var t = makeTile({ id: a.id, name: a.name, line: a.line, items: a.items }, "addon", "addon-" + a.id, true);
        t.classList.add("addon", "is-off");
        t.appendChild(el("b", "", a.name));
        t.appendChild(el("i", "", a.perPerson ? "One per person" : "One per pack"));
        dock.appendChild(t);
        addonEls[a.id] = t;
      });
    }

    function makeTile(m, kind, key, bare) {
      var b = el("button", "tile");
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      if (!bare) {
        b.appendChild(el("b", "", m.name));
        b.appendChild(el("i", "", m.line));
      }
      b.addEventListener("click", function () {
        pick(state.picked === key ? null : key);
      });
      tiles.push({ key: key, node: b, module: m, kind: kind });
      return b;
    }

    function pick(key) {
      state.picked = key;
      var found = null;
      tiles.forEach(function (t) {
        var on = t.key === key;
        t.node.setAttribute("aria-pressed", on ? "true" : "false");
        if (on) found = t;
      });
      if (opts.onPick) {
        opts.onPick(found ? {
          id: found.module.id, name: found.module.name, line: found.module.line,
          items: found.module.items, kind: found.kind
        } : null);
      }
    }

    function render() {
      root.setAttribute("data-people", String(state.people));
      rations.forEach(function (r, idx) {
        var show = idx < state.people;
        r.classList.toggle("is-out", !show);
        r.querySelector(".tile").tabIndex = show ? 0 : -1;
        r.setAttribute("aria-hidden", show ? "false" : "true");
      });
      /* A picked Ration that is no longer in the pack is cleared */
      if (state.picked && state.picked.indexOf("ration-") === 0) {
        if (Number(state.picked.split("-")[1]) > state.people) pick(null);
      }
      if (opts.dock === false) return;
      P.addons.forEach(function (a) {
        var on = state.addons.indexOf(a.id) !== -1;
        addonEls[a.id].classList.toggle("is-off", !on);
        addonEls[a.id].setAttribute("aria-label", a.name + " module, " + (on ? "in your pack" : "not added"));
      });
    }

    render();

    return {
      set: function (next) {
        if (next.people) state.people = Math.max(1, Math.min(4, next.people));
        if (next.addons) state.addons = next.addons.slice();
        render();
      },
      pick: pick,
      get: function () { return { people: state.people, addons: state.addons.slice(), picked: state.picked }; }
    };
  }

  window.PreppedPack = { mount: mount };
})();
