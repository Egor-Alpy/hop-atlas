/* =====================================================================
   Кнопка «Открыть атлас»: при наведении кнопку обвивает хмель.
   Лоза поднимается от левого нижнего угла, идёт по верхнему краю
   и спускается справа; по ходу распускаются листья и повисают шишки.
   Курсор ушёл — всё сворачивается в обратном порядке.
   На сенсорных экранах (без наведения) хмель один раз прорастает,
   когда кнопка появляется на экране. Рисунок — из HA.art (те же лист
   и шишка, что на глобусе и в орнаментах).
===================================================================== */
(function () {
  "use strict";
  var HA = window.HA, A = HA.art, r2 = A.r2;
  var P = 30; // запас вокруг кнопки под листья и шишки

  function build(btn) {
    var host = btn.parentNode;
    var w = btn.offsetWidth, h = btn.offsetHeight;
    if (!w || !h) return;
    var old = host.querySelector(".atlas-vine");
    if (old) old.remove();
    var W = w + 2 * P, H = h + 2 * P;
    var x0 = P, y0 = P, x1 = P + w, y1 = P + h;

    // опорные точки лозы по краю кнопки (снаружи), с волной — лоза вьётся
    var pts = [], i, n;
    function wave(k, a) { return Math.sin(k * 0.55) * a; }
    n = Math.max(3, Math.round(h / 9));
    for (i = 0; i <= n; i++) pts.push([x0 - 4 + wave(i, 2.4), y1 + 4 - (h + 7) * (i / n)]);       // вверх по левому краю
    n = Math.max(6, Math.round(w / 11));
    for (i = 1; i <= n; i++) pts.push([x0 - 3 + (w + 6) * (i / n), y0 - 4 + wave(i + 3, 2.6)]);   // по верху
    n = Math.max(2, Math.round(h * 0.65 / 9));
    for (i = 1; i <= n; i++) pts.push([x1 + 4 + wave(i + 9, 2.2), y0 - 3 + h * 0.62 * (i / n)]);  // вниз по правому краю

    // сглаживание Катмулла — Рома
    var d = "M" + r2(pts[0][0]) + "," + r2(pts[0][1]);
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += "C" + r2(p1[0] + (p2[0] - p0[0]) / 6) + "," + r2(p1[1] + (p2[1] - p0[1]) / 6) + " " +
        r2(p2[0] - (p3[0] - p1[0]) / 6) + "," + r2(p2[1] - (p3[1] - p1[1]) / 6) + " " + r2(p2[0]) + "," + r2(p2[1]);
    }

    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "atlas-vine");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.style.width = W + "px"; svg.style.height = H + "px";
    svg.style.left = (btn.offsetLeft - P) + "px"; svg.style.top = (btn.offsetTop - P) + "px";
    svg.innerHTML = '<path class="v-stem" d="' + d + '" fill="none" stroke="#5C7A2B" stroke-width="2" stroke-linecap="round"/>';
    host.appendChild(svg);
    var stem = svg.querySelector(".v-stem"), L = stem.getTotalLength();
    stem.style.strokeDasharray = L.toFixed(1);
    stem.style.strokeDashoffset = L.toFixed(1);
    svg.style.setProperty("--len", L.toFixed(1));

    // листья, усики и шишки вдоль лозы
    var GROW = 0.95, items = "";
    function at(u) { var p = stem.getPointAtLength(L * u), q = stem.getPointAtLength(Math.min(L, L * u + 1)); return { x: p.x, y: p.y, a: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI }; }
    function outward(p) {
      // нормаль наружу от кнопки: слева — влево, сверху — вверх, справа — вправо
      if (p.x < x0 + 2) return -90 - 0;          // влево (лист «смотрит» вверх при rot 0 → поворот −90 = влево)
      if (p.x > x1 - 2) return 90;
      return 0;
    }
    var step = 34, cnt = Math.floor(L / step), side = 1;
    for (i = 1; i <= cnt; i++) {
      var u = (i - 0.4) / cnt;
      if (u > 0.97) break;
      var p = at(u), base = outward(p);
      side = -side;
      var rot = base + side * 38, sz = 6.4 + ((i * 7) % 3) * 0.7;
      var din = (0.18 + u * GROW).toFixed(2), dout = ((1 - u) * 0.28).toFixed(2);
      items += '<g class="v-item" style="--din:' + din + "s;--dout:" + dout + "s;transform-origin:" + r2(p.x) + "px " + r2(p.y) + 'px">' +
        A.leafSVG(p.x, p.y, rot, sz, { ink: "#33281D", sw: 0.6, kind: i % 3 === 0 ? "heart" : "lobed" }) + "</g>";
      // усик — завиток на каждом третьем узле
      if (i % 3 === 1) {
        var ta = (base - side * 50) * Math.PI / 180, tx = p.x + Math.sin(ta) * 9, ty = p.y - Math.cos(ta) * 9;
        items += '<g class="v-item v-item--tendril" style="--din:' + din + "s;--dout:" + dout + "s;transform-origin:" + r2(p.x) + "px " + r2(p.y) + 'px">' +
          '<path d="M' + r2(p.x) + "," + r2(p.y) + "Q" + r2((p.x + tx) / 2 + 3) + "," + r2((p.y + ty) / 2) + " " + r2(tx) + "," + r2(ty) +
          "q2.6,-1.6 1.2,-3.6 -2.4,-0.4 -1.6,1.8" + '" fill="none" stroke="#5C7A2B" stroke-width=".9" stroke-linecap="round"/></g>';
      }
    }
    // шишки: у левого верхнего угла, над серединой верхнего края справа и на правом спуске
    [0.27, 0.68, 0.93].forEach(function (u, k) {
      var p = at(u), ch = k === 1 ? 15 : 13, cw = ch * 0.64;
      var hx = p.x + (k === 2 ? 7 : k === 0 ? -6 : 0), hy = p.y + (k === 1 ? -2 : 2);
      var din = (0.42 + u * GROW).toFixed(2), dout = ((1 - u) * 0.22).toFixed(2);
      // висят на черешке; над кнопкой (k=1) — чуть сбоку, чтобы не закрывать надпись
      items += '<g class="v-item v-item--cone" style="--din:' + din + "s;--dout:" + dout + "s;transform-origin:" + r2(p.x) + "px " + r2(p.y) + 'px">' +
        '<path d="M' + r2(p.x) + "," + r2(p.y) + "Q" + r2((p.x + hx) / 2) + "," + r2(p.y - 3) + " " + r2(hx) + "," + r2(hy + 1) + '" fill="none" stroke="#5C7A2B" stroke-width="1"/>' +
        A.coneSVG(hx, hy + ch * 0.26, ch, cw, { ink: "#33281D", sw: 0.6 }) + "</g>";
    });
    svg.insertAdjacentHTML("beforeend", items);
    btn._vine = svg;
  }

  HA.initVineButtons = function () {
    HA.$$(".atlas-btn").forEach(function (btn) {
      var host = btn.parentNode;
      if (!host) return;
      host.classList.add("has-vine");
      function grow(on) { if (btn._vine) btn._vine.classList.toggle("is-grown", on); }
      var rebuild = function () { var g = btn._vine && btn._vine.classList.contains("is-grown"); build(btn); grow(!!g); };
      rebuild();
      btn.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") grow(true); });
      btn.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") grow(false); });
      btn.addEventListener("focus", function () { if (btn.matches(":focus-visible")) grow(true); });
      btn.addEventListener("blur", function () { grow(false); });
      var t = 0;
      window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(rebuild, 120); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
      // сенсорный экран: хмель прорастает, когда кнопка появляется на экране
      if (window.matchMedia && matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { setTimeout(function () { grow(true); }, 400); io.disconnect(); }
        }, { threshold: 0.9 });
        io.observe(btn);
      }
    });
  };
})();
