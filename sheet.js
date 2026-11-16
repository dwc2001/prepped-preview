/* The reserve sheet on a phone: it follows the finger, keeps the speed it was
   released with, and can be caught again while it is still moving.

   PreppedSheet.attach(card, scrim, dismiss)
   card: the sheet. scrim: the dim layer behind it. dismiss: called once the sheet has left. */
(function () {
  var phone = window.matchMedia("(max-width: 767px)");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Where a flick would come to rest (the same curve scrolling uses). */
  function project(v) { var d = 0.998; return (v / 1000) * d / (1 - d); }
  /* Past the top edge the sheet follows less and less. */
  function resist(over, size) { return (over * size * 0.55) / (size + 0.55 * Math.abs(over)); }

  function attach(card, scrim, dismiss) {
    var grab = document.createElement("div");
    grab.className = "rs-grab";
    grab.setAttribute("aria-hidden", "true");
    card.insertBefore(grab, card.firstChild);

    var y = 0, frame = 0, drag = null, done = false;

    function place(v) {
      y = v;
      card.style.transform = "translateY(" + v.toFixed(1) + "px)";
      var h = card.offsetHeight || 1;
      scrim.style.opacity = String(0.6 * Math.max(0, Math.min(1, 1 - v / h)));
    }
    function release() {
      card.style.transition = ""; card.style.transform = "";
      scrim.style.transition = ""; scrim.style.opacity = "";
    }
    function stop() { if (frame) { cancelAnimationFrame(frame); frame = 0; } }

    /* A spring with no bounce, started from wherever the sheet is, at the speed it has. */
    function spring(target, velocity, then) {
      stop();
      if (calm.matches) { place(target); then(); return; }
      var w = 2 * Math.PI / 0.3, x0 = y - target, b = velocity + w * x0, t0 = performance.now();
      (function step(now) {
        var t = (now - t0) / 1000, e = Math.exp(-w * t);
        var x = (x0 + b * t) * e, v = (b - w * (x0 + b * t)) * e;
        place(target + x);
        if (Math.abs(x) < 0.5 && Math.abs(v) < 20) { place(target); frame = 0; then(); return; }
        frame = requestAnimationFrame(step);
      })(t0);
    }

    function down(e) {
      if (!phone.matches || done) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("button, a, input, label")) return;
      stop();
      card.style.transition = "none"; scrim.style.transition = "none";
      drag = { id: e.pointerId, startY: e.clientY, from: y, moved: false, trail: [{ t: e.timeStamp, y: e.clientY }] };
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.startY;
      if (!drag.moved) {
        if (Math.abs(dy) < 10) return;           /* a small dead zone, so a tap is not a drag */
        drag.moved = true; drag.startY = e.clientY; dy = 0;
        try { card.setPointerCapture(e.pointerId); } catch (err) {}
      }
      var next = drag.from + dy;
      place(next < 0 ? -resist(-next, card.offsetHeight) : next);
      drag.trail.push({ t: e.timeStamp, y: e.clientY });
      if (drag.trail.length > 6) drag.trail.shift();
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!d.moved) { if (y === 0) release(); return; }
      var a = d.trail[0], z = d.trail[d.trail.length - 1];
      var v = z.t > a.t ? (z.y - a.y) / (z.t - a.t) * 1000 : 0;   /* px per second */
      var h = card.offsetHeight;
      if (y + project(v) > h / 3) {
        done = true;
        spring(h + 24, Math.max(v, 0), dismiss);
      } else {
        spring(0, v, release);
      }
    }

    grab.addEventListener("pointerdown", down);
    var head = card.querySelector(".rs-head");
    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".rs-head")) down(e);
    });
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", up);
  }

  window.PreppedSheet = { attach: attach };
})();
