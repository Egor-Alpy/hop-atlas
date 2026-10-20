/* =====================================================================
   Атлас ХПП — общие рисованные элементы: шишка и лист хмеля.
   Одни и те же контуры используются на canvas (глобус) и в SVG
   (орнаменты, виньетки, ботанический лист).

   Ботаника Humulus lupulus:
   • лист — 3 лопасти, сердцевидное основание, ПИЛЬЧАТЫЙ край, зубцы
     смотрят к вершине лопасти, жилки пальчатые из одной точки;
   • шишка — веретено из черепитчатых прицветников рядами,
     кончики заострены, сверху короткий черешок;
   • лоза вьётся по часовой стрелке (если смотреть сверху).
===================================================================== */
(function () {
  "use strict";
  var HA = window.HA;
  var r2 = function (v) { return Math.round(v * 100) / 100; };

  /* ---------------- Шишка ----------------
     cx — ось, top — верх тела шишки, H — высота, W — ширина.
     Возвращает контуры прицветников (нижние ряды первыми — верхние
     перекрывают их черепицей), жилки и черешок. */
  var ROWS = [[1, 0.5], [2, 0.8], [3, 1], [2, 1], [3, 0.92], [2, 0.7], [1, 0.4]];
  function conePaths(cx, top, H, W) {
    var n = ROWS.length, step = H / (n + 0.75), len = step * 1.85;
    var scales = [], veins = "";
    ROWS.forEach(function (row, ri) {
      var cnt = row[0], f = row[1];
      var y = top + ri * step, hw = (W / 2) * f, sw = (2 * hw) / cnt;
      for (var k = 0; k < cnt; k++) {
        var xl = cx - hw + k * sw, xr = xl + sw, xm = (xl + xr) / 2;
        var L = len * (ri === n - 1 ? 1.12 : 1);
        var tip = xm + (xm - cx) * 0.08; // кончик чуть отклонён наружу
        scales.push({
          ri: ri,
          side: (xm - cx) / (W / 2 || 1),
          d: "M" + r2(xl) + "," + r2(y) +
            "C" + r2(xl) + "," + r2(y + L * 0.6) + " " + r2(tip - sw * 0.24) + "," + r2(y + L * 0.9) + " " + r2(tip) + "," + r2(y + L) +
            "C" + r2(tip + sw * 0.24) + "," + r2(y + L * 0.9) + " " + r2(xr) + "," + r2(y + L * 0.6) + " " + r2(xr) + "," + r2(y)
        });
        veins += "M" + r2(xm) + "," + r2(y + L * 0.36) + "L" + r2(tip) + "," + r2(y + L * 0.8);
      }
    });
    scales.sort(function (a, b) { return b.ri - a.ri; });
    var stem = "M" + r2(cx + W * 0.08) + "," + r2(top - H * 0.2) +
      "C" + r2(cx - W * 0.1) + "," + r2(top - H * 0.12) + " " + r2(cx + W * 0.05) + "," + r2(top - H * 0.03) + " " + r2(cx) + "," + r2(top + step * 0.5);
    return { scales: scales, veins: veins, stem: stem };
  }

  var CONE_FILL = { light: "#E7E6AE", mid: "#CFD47E", dark: "#A7B552" };
  function coneFill(side) { return side < -0.2 ? CONE_FILL.light : side > 0.3 ? CONE_FILL.dark : CONE_FILL.mid; }

  /* SVG-разметка шишки. opt: {sw, ink, flat, fill} */
  function coneSVG(cx, top, H, W, opt) {
    opt = opt || {};
    var sw = opt.sw || 0.8, ink = opt.ink || "currentColor";
    var c = conePaths(cx, top, H, W);
    var s = '<path d="' + c.stem + '" fill="none" stroke="' + ink + '" stroke-width="' + r2(sw) + '" stroke-linecap="round"/>';
    c.scales.forEach(function (sc) {
      var fill = opt.fill || (opt.flat ? CONE_FILL.mid : coneFill(sc.side));
      s += '<path d="' + sc.d + 'Z" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + r2(sw * 0.8) + '" stroke-linejoin="round"/>';
    });
    if (H > 14) s += '<path d="' + c.veins + '" fill="none" stroke="' + ink + '" stroke-width="' + r2(sw * 0.42) + '" stroke-opacity=".6"/>';
    return s;
  }

  /* ---------------- Лист хмеля ----------------
     Контур в единичных координатах: черешок крепится к стеблю в (0,0),
     лист смотрит вверх (−y). Левая половина от выемки основания
     до вершины средней лопасти, правая — зеркальная.
     Метки: t — вершина лопасти, s — пазуха, b — основание.            */
  var HALF = [
    [0, -0.55, "b"], [-0.16, -0.40], [-0.42, -0.38], [-0.68, -0.52], [-0.88, -0.76], [-1.0, -1.04], [-1.04, -1.32, "t"],
    [-0.86, -1.26], [-0.7, -1.22], [-0.6, -1.24, "s"], [-0.58, -1.5], [-0.48, -1.8], [-0.32, -2.04], [-0.15, -2.2], [0, -2.32, "t"]
  ];
  /* верхние листья хмеля часто цельные, сердцевидные — второй контур */
  var HEART = [
    [0, -0.52, "b"], [-0.2, -0.38], [-0.5, -0.4], [-0.76, -0.6], [-0.92, -0.92], [-0.9, -1.3], [-0.72, -1.64], [-0.44, -1.94], [-0.18, -2.16], [0, -2.3, "t"]
  ];
  function mirror(half) { return half.concat(half.slice(0, -1).reverse().map(function (p) { return [-p[0], p[1], p[2]]; })); }
  // полный обход: левая половина вверх, затем правая вниз
  var OUTLINES = { lobed: mirror(HALF), heart: mirror(HEART) };

  function catmull(pts, seg) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < seg; k++) {
        var t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice(0, 2));
    return out;
  }

  /* Контур листа размера s (s ≈ полуширина). teeth — пильчатый край. */
  var leafCache = {};
  function leafOutline(s, teeth, kind) {
    kind = kind || "lobed";
    var key = s + "|" + teeth + "|" + kind;
    if (leafCache[key]) return leafCache[key];
    var OUTLINE = OUTLINES[kind] || OUTLINES.lobed;
    // делим контур на рёбра между помеченными точками
    var edges = [], cur = [OUTLINE[0]];
    for (var i = 1; i < OUTLINE.length; i++) {
      cur.push(OUTLINE[i]);
      if (OUTLINE[i][2]) { edges.push(cur); cur = [OUTLINE[i]]; }
    }
    var d = "";
    var cxm = 0, cym = -1.3; // примерный центр листа — для направления наружу
    edges.forEach(function (e, ei) {
      var ascending = !!(e[e.length - 1][2] === "t"); // идём к вершине лопасти
      var pts = catmull(e, 5);
      if (ei === 0) d += "M" + r2(pts[0][0] * s) + "," + r2(pts[0][1] * s);
      if (!teeth) {
        for (var k = 1; k < pts.length; k++) d += "L" + r2(pts[k][0] * s) + "," + r2(pts[k][1] * s);
        return;
      }
      // равномерные зубцы вдоль ребра
      var len = 0, acc = [0];
      for (var k2 = 1; k2 < pts.length; k2++) { len += Math.hypot(pts[k2][0] - pts[k2 - 1][0], pts[k2][1] - pts[k2 - 1][1]); acc.push(len); }
      var nT = Math.max(2, Math.round(len / 0.13));
      var at = function (u) {
        var L = u * len, j = 1;
        while (j < acc.length - 1 && acc[j] < L) j++;
        var t = (L - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1);
        return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t];
      };
      // у основания (первое и последнее ребро) зубцы мельче
      var amp = (ei === 0 || ei === edges.length - 1) ? 0.035 : 0.06;
      for (var q = 0; q < nT; q++) {
        var a = at(q / nT), b = at((q + 1) / nT);
        var fx = ascending ? 0.78 : 0.22;
        var mx = a[0] + (b[0] - a[0]) * fx, my = a[1] + (b[1] - a[1]) * fx;
        var dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
        var nx = dy / dl, ny = -dx / dl;
        if ((mx + nx * 0.05 - cxm) * (mx + nx * 0.05 - cxm) + (my + ny * 0.05 - cym) * (my + ny * 0.05 - cym) <
            (mx - cxm) * (mx - cxm) + (my - cym) * (my - cym)) { nx = -nx; ny = -ny; }
        d += "L" + r2((mx + nx * amp) * s) + "," + r2((my + ny * amp) * s) + "L" + r2(b[0] * s) + "," + r2(b[1] * s);
      }
    });
    d += "Z";
    leafCache[key] = d;
    return d;
  }
  /* жилки: средняя и две боковые из одной точки, вторичные — короче */
  function leafVeins(s) {
    var P = function (x, y) { return r2(x * s) + "," + r2(y * s); };
    return "M" + P(0, 0) + "L" + P(0, -0.5) +           // черешок
      "M" + P(0, -0.5) + "Q" + P(0.02, -1.4) + " " + P(0, -2.2) +
      "M" + P(0, -0.52) + "Q" + P(-0.46, -0.84) + " " + P(-0.94, -1.3) +
      "M" + P(0, -0.52) + "Q" + P(0.46, -0.84) + " " + P(0.94, -1.3) +
      "M" + P(0, -0.54) + "Q" + P(-0.36, -0.56) + " " + P(-0.6, -0.6) +
      "M" + P(0, -0.54) + "Q" + P(0.36, -0.56) + " " + P(0.6, -0.6) +
      "M" + P(-0.4, -0.9) + "L" + P(-0.36, -1.18) + "M" + P(0.4, -0.9) + "L" + P(0.36, -1.18) +
      "M" + P(0, -1.3) + "Q" + P(-0.14, -1.42) + " " + P(-0.26, -1.66) + "M" + P(0, -1.3) + "Q" + P(0.14, -1.42) + " " + P(0.26, -1.66) +
      "M" + P(0, -1.7) + "Q" + P(-0.1, -1.8) + " " + P(-0.18, -1.98) + "M" + P(0, -1.7) + "Q" + P(0.1, -1.8) + " " + P(0.18, -1.98);
  }

  /* SVG-разметка листа: x,y — точка крепления черешка, rot — поворот (град). */
  function leafSVG(x, y, rot, s, opt) {
    opt = opt || {};
    var ink = opt.ink || "currentColor", sw = opt.sw || 0.8;
    var teeth = opt.teeth !== false && s >= 7;
    var d = leafOutline(s, teeth, opt.kind);
    var g = '<g transform="translate(' + r2(x) + " " + r2(y) + ") rotate(" + r2(rot) + ')">';
    if (opt.wash !== false) {
      g += '<path d="' + d + '" fill="' + (opt.washLight || "#C5D189") + '" fill-opacity=".7" transform="translate(' + r2(s * 0.05) + " " + r2(s * 0.04) + ')"/>';
      g += '<path d="' + d + '" fill="' + (opt.fill || "#9DB35A") + '" fill-opacity="' + (opt.fillOpacity || 0.72) + '"/>';
    }
    g += '<path d="' + d + '" fill="none" stroke="' + ink + '" stroke-width="' + r2(sw) + '" stroke-linejoin="round"/>';
    if (s >= 6) g += '<path d="' + leafVeins(s) + '" fill="none" stroke="' + ink + '" stroke-width="' + r2(sw * 0.55) + '" stroke-opacity=".55" stroke-linecap="round"/>';
    return g + "</g>";
  }

  /* Знак-печать: шишка в двойном круге (логотип, favicon, подвал) */
  function sealSVG(size, opt) {
    opt = opt || {};
    var ink = opt.ink || "#33281D", bg = opt.bg || "none", c = size / 2;
    var s = '<circle cx="' + c + '" cy="' + c + '" r="' + r2(c - 1) + '" fill="' + bg + '" stroke="' + ink + '" stroke-width="1.1"/>';
    s += '<circle cx="' + c + '" cy="' + c + '" r="' + r2(c - 3.6) + '" fill="none" stroke="' + ink + '" stroke-width=".55"/>';
    // насечки по кольцу
    var t = "";
    for (var k = 0; k < 40; k++) {
      var a = (k / 40) * Math.PI * 2;
      t += "M" + r2(c + Math.cos(a) * (c - 3.6)) + "," + r2(c + Math.sin(a) * (c - 3.6)) + "L" + r2(c + Math.cos(a) * (c - 2.2)) + "," + r2(c + Math.sin(a) * (c - 2.2));
    }
    s += '<path d="' + t + '" stroke="' + ink + '" stroke-width=".4"/>';
    var H = size * 0.48, W = H * 0.62;
    s += leafSVG(c - 1, c - H * 0.36, -52, size * 0.085, { ink: ink, sw: 0.6, teeth: false });
    s += leafSVG(c + 1, c - H * 0.38, 50, size * 0.075, { ink: ink, sw: 0.6, teeth: false });
    s += '<g>' + coneSVG(c, c - H * 0.36, H, W, { ink: ink, sw: 0.7 }) + "</g>";
    return s;
  }

  HA.art = {
    conePaths: conePaths,
    coneFill: coneFill,
    coneSVG: coneSVG,
    leafOutline: leafOutline,
    leafVeins: leafVeins,
    leafSVG: leafSVG,
    sealSVG: sealSVG,
    r2: r2
  };
})();
