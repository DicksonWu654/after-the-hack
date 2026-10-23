/* After the Hack: charts. Plain SVG, no library. Every chart reads window.ATH and ships a table view. */
(function () {
  "use strict";
  var A = window.ATH, U = window.ATHfmt;
  if (!A || !U) return;
  var esc = U.esc, FMT = U.FMT, money = U.money, byId = U.byId;
  var tip = document.getElementById("tip");

  // ---------------------------------------------------------------- helpers
  var ctx = document.createElement("canvas").getContext("2d");
  function tw(text, size, weight) { ctx.font = (weight || 400) + " " + (size || 12.5) + 'px "Schibsted Grotesk", system-ui, sans-serif'; return ctx.measureText(text).width; }
  function lin(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function logs(d0, d1, r0, r1) { var a = Math.log(d0), b = Math.log(d1); return function (v) { return r0 + (Math.log(Math.max(v, d0)) - a) / (b - a) * (r1 - r0); }; }
  function attr(o) { return Object.keys(o).map(function (k) { return k + '="' + esc(o[k]) + '"'; }).join(" "); }
  function rect(x, y, w, h, fill, extra) { return "<rect " + attr(Object.assign({ x: x.toFixed(1), y: y.toFixed(1), width: Math.max(0, w).toFixed(1), height: Math.max(0, h).toFixed(1), style: "fill:" + fill }, extra || {})) + "/>"; }
  // bar with a 4px rounded data end, square at the baseline (horizontal: rounded right end)
  function hbar(x, y, w, h, fill, extra) {
    if (w <= 0.5) return "";
    var r = Math.min(4, w / 2, h / 2);
    var d = "M" + x + "," + y + "h" + (w - r) + "a" + r + "," + r + " 0 0 1 " + r + "," + r + "v" + (h - 2 * r) + "a" + r + "," + r + " 0 0 1 " + (-r) + "," + r + "h" + (r - w) + "z";
    return "<path " + attr(Object.assign({ d: d, style: "fill:" + fill, "class": "mark" }, extra || {})) + "/>";
  }
  function hbarLeft(x, y, w, h, fill, extra) { // grows leftwards from x
    if (w <= 0.5) return "";
    var r = Math.min(4, w / 2, h / 2);
    var d = "M" + x + "," + y + "h" + (-(w - r)) + "a" + r + "," + r + " 0 0 0 " + (-r) + "," + r + "v" + (h - 2 * r) + "a" + r + "," + r + " 0 0 0 " + r + "," + r + "h" + (w - r) + "z";
    return "<path " + attr(Object.assign({ d: d, style: "fill:" + fill, "class": "mark" }, extra || {})) + "/>";
  }
  function vbar(x, yBase, w, h, fill, extra) { // grows up from yBase
    if (h <= 0.5) return "";
    var r = Math.min(4, w / 2, h / 2);
    var d = "M" + x + "," + yBase + "v" + (-(h - r)) + "a" + r + "," + r + " 0 0 1 " + r + "," + (-r) + "h" + (w - 2 * r) + "a" + r + "," + r + " 0 0 1 " + r + "," + r + "v" + (h - r) + "z";
    return "<path " + attr(Object.assign({ d: d, style: "fill:" + fill, "class": "mark" }, extra || {})) + "/>";
  }
  function text(x, y, s, cls, extra) { return "<text " + attr(Object.assign({ x: x.toFixed(1), y: y.toFixed(1), "class": cls || "lab" }, extra || {})) + ">" + esc(s) + "</text>"; }
  function svg(w, h, body, label) { return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '">' + body + "</svg>"; }
  function pct(v, d) { return FMT[d === 2 ? "p2" : d === 0 ? "p0" : "p1"](v); }
  function humanDays(d) {
    if (d < 0.05) return "same day";
    if (d < 1) return Math.round(d * 24) + " hours";
    if (d < 10) return FMT.d1(d) + (d === 1 ? " day" : " days");
    if (d < 365) return Math.round(d).toLocaleString("en-US") + " days";
    return Math.round(d).toLocaleString("en-US") + " days (" + FMT.d1(d / 365.25) + " years)";
  }
  function table(head, rows, numericCols) {
    numericCols = numericCols || [];
    return '<details class="tbl"><summary>Show the numbers</summary><div class="tblwrap"><table><thead><tr>' +
      head.map(function (h, i) { return '<th scope="col"' + (numericCols.indexOf(i) >= 0 ? ' class="r"' : "") + ">" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return "<td" + (numericCols.indexOf(i) >= 0 ? ' class="r"' : "") + ">" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div></details>";
  }

  // tooltip: any element with data-tip inside a chart
  function bindTips(el) {
    function showTip(t, x, y) {
      tip.innerHTML = t; tip.hidden = false;
      var w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth;
      var left = Math.min(Math.max(8, x - w / 2), vw - w - 8), top = y - h - 14;
      if (top < 56) top = y + 18;
      tip.style.left = (left + window.scrollX) + "px"; tip.style.top = (top + window.scrollY) + "px";
    }
    var hot = null;
    el.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tip]");
      if (!t) { tip.hidden = true; return; }
      var r = t.getBoundingClientRect(); showTip(t.getAttribute("data-tip"), r.left + r.width / 2, r.top);
    });
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var t = e.target.closest("[data-tip]");
      if (hot && hot !== t) hot.classList.remove("is-hot");
      if (!t) { tip.hidden = true; hot = null; return; }
      hot = t; t.classList.add("is-hot");
      showTip(t.getAttribute("data-tip"), e.clientX, e.clientY);
    });
    el.addEventListener("pointerleave", function (e) { if (e.pointerType === "touch") return; tip.hidden = true; if (hot) hot.classList.remove("is-hot"); hot = null; });
    el.addEventListener("focusin", function (e) {
      var t = e.target.closest("[data-tip]"); if (!t) return;
      var r = t.getBoundingClientRect(); showTip(t.getAttribute("data-tip"), r.left + r.width / 2, r.top);
    });
    el.addEventListener("focusout", function () { tip.hidden = true; });
  }
  document.addEventListener("click", function (e) { if (!(e.target.closest && e.target.closest("[data-tip]"))) tip.hidden = true; });
  function tipAttr(html) { return html; } // stored raw; content is built from escaped strings only

  var charts = {};
  function mount(name, fn) { charts[name] = fn; }
  function renderAll(force) {
    document.querySelectorAll("[data-chart]").forEach(function (el) {
      var w = Math.round(el.clientWidth);
      if (!w) return;
      if (!force && el.__w === w) return;
      el.__w = w;
      var fn = charts[el.getAttribute("data-chart")];
      if (!fn) return;
      var out = fn(w);
      el.innerHTML = out.svg;
      if (!el.__bound) { bindTips(el); el.__bound = true; }
      if (out.table && !el.__table) {
        el.insertAdjacentHTML("afterend", out.table);
        el.__table = true;
      }
    });
  }
  var narrow = function (w) { return w < 560; };

  // ---------------------------------------------------------------- 1. annual totals
  mount("annual", function (W) {
    var data = A.charts.annual;
    var H = narrow(W) ? 250 : 300, m = { t: 26, r: 4, b: 28, l: 44 };
    var max = Math.ceil(Math.max.apply(null, data.map(function (d) { return d.loss_usd; })) / 1e9);
    var y = lin(0, max * 1e9, H - m.b, m.t);
    var band = (W - m.l - m.r) / data.length, bw = Math.min(24, band * 0.62);
    var maxYear = data.reduce(function (a, b) { return b.loss_usd > a.loss_usd ? b : a; });
    var last = data[data.length - 1];
    var out = "";
    for (var g = 0; g <= max; g++) {
      out += '<line class="' + (g ? "grid" : "base") + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(g * 1e9) + '" y2="' + y(g * 1e9) + '"/>';
      out += text(m.l - 8, y(g * 1e9) + 4, "$" + g + "B", "tick", { "text-anchor": "end" });
    }
    data.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2;
      var isLast = d === last;
      var t = "<b>" + d.year + (isLast ? " to 21 Oct" : "") + "</b><br>" + esc(FMT.B2(d.loss_usd)) + " across " + d.n + " incidents<br>Largest: " + esc(d.largest);
      out += '<g data-tip="' + esc(t) + '">' + rect(m.l + band * i, m.t - 20, band, H - m.t - m.b + 20, "transparent", { "class": "hit" }) +
        vbar(cx - bw / 2, y(0), bw, y(0) - y(d.loss_usd), isLast ? "var(--stolen-ytd, var(--axis))" : "var(--stolen, var(--ink-2))") + "</g>";
      var showYear = !narrow(W) || i % 2 === 0 || isLast;
      if (showYear) out += text(cx, H - m.b + 18, narrow(W) ? "'" + String(d.year).slice(2) : String(d.year), "tick", { "text-anchor": "middle" });
      if (d === maxYear || isLast || (!narrow(W) && d.loss_usd > 2.4e9)) {
        out += text(cx, y(d.loss_usd) - 7, FMT.B1(d.loss_usd), "val", { "text-anchor": "middle" });
      }
    });
    if (!narrow(W)) out += text(m.l + band * (data.length - 1) + band / 2, y(last.loss_usd) - 22, "to 21 Oct", "tick", { "text-anchor": "middle" });
    return {
      svg: svg(W, H, out, "Column chart of dollars stolen per year, 2016 to 2026; the peak is " + maxYear.year + " at " + FMT.B2(maxYear.loss_usd)),
      table: table(["Year", "Stolen (USD at the time)", "Incidents", "Largest incident"], data.map(function (d) { return [d.year + (d === last ? " (to 21 Oct)" : ""), FMT.B2(d.loss_usd), d.n, d.largest]; }), [1, 2])
    };
  });

  // ---------------------------------------------------------------- 2. vectors butterfly
  var FAMILY = { "private-key/compromised-infra": "s1", "social-engineering": "s1", "supply-chain": "s1",
    "smart-contract logic": "s2", "access-control": "s2", "oracle/price-manipulation": "s2", "reentrancy": "s2", "other": "lost", "rug/insider": "lost" };
  var VLABEL = { "private-key/compromised-infra": "Private key or infrastructure compromise", "social-engineering": "Social engineering", "supply-chain": "Supply chain",
    "smart-contract logic": "Smart-contract logic bug", "access-control": "Access control", "oracle/price-manipulation": "Oracle or price manipulation", "reentrancy": "Reentrancy",
    "other": "Other", "rug/insider": "Rug pull or insider" };
  mount("vectors", function (W) {
    var v = byId.V1.numeric;
    var keys = Object.keys(v.pct_dollars).sort(function (a, b) { return v.pct_dollars[b] - v.pct_dollars[a]; });
    var rowH = 46, m = { t: 30, b: 6 }, H = m.t + keys.length * rowH + m.b;
    var mid = W / 2, half = W / 2 - 46, x = lin(0, 40, 0, half);
    var out = text(mid - 8, 14, "← Share of incidents", "lab-strong", { "text-anchor": "end" }) + text(mid + 8, 14, "Share of dollars →", "lab-strong");
    keys.forEach(function (k, i) {
      var y0 = m.t + i * rowH, c = "var(--" + FAMILY[k] + ")";
      var t = "<b>" + esc(VLABEL[k]) + "</b><br>" + esc(pct(v.pct_dollars[k])) + " of dollars<br>" + esc(pct(v.pct_count[k])) + " of incidents";
      out += '<g data-tip="' + esc(t) + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" });
      out += text(mid, y0 + 13, VLABEL[k], "lab", { "text-anchor": "middle" });
      var by = y0 + 20, bh = 14;
      out += hbarLeft(mid - 1, by, x(v.pct_count[k]), bh, c) + hbar(mid + 1, by, x(v.pct_dollars[k]), bh, c);
      out += text(mid - 1 - x(v.pct_count[k]) - 6, by + 11, pct(v.pct_count[k]), "val", { "text-anchor": "end" });
      out += text(mid + 1 + x(v.pct_dollars[k]) + 6, by + 11, pct(v.pct_dollars[k]), "val");
      out += '<line class="base" x1="' + mid + '" x2="' + mid + '" y1="' + (by - 3) + '" y2="' + (by + bh + 3) + '"/>';
      out += "</g>";
    });
    return {
      svg: svg(W, H, out, "Butterfly chart comparing each attack vector's share of incidents with its share of dollars"),
      table: table(["Vector", "Share of dollars", "Share of incidents"], keys.map(function (k) { return [VLABEL[k], pct(v.pct_dollars[k]), pct(v.pct_count[k])]; }), [1, 2])
    };
  });

  // ---------------------------------------------------------------- 3. openings waffle
  mount("openings", function (W) {
    var rows = A.charts.openings;
    var gt = rows.reduce(function (s, r) { return s + r.gt_10; }, 0), lt = rows.reduce(function (s, r) { return s + r.lt_10; }, 0);
    var exact = rows.reduce(function (s, r) { return s + r.exactly_10; }, 0), total = rows.reduce(function (s, r) { return s + r.n; }, 0);
    var rest = total - exact - gt - lt; // table openings with no stated size class
    var cells = [];
    for (var i = 0; i < exact; i++) cells.push(["s1", "Exactly 10%"]);
    for (i = 0; i < gt; i++) cells.push(["s2", "More than 10%"]);
    for (i = 0; i < lt + Math.max(0, rest); i++) cells.push(["lost", "Less than 10%"]);
    var cols = W < 420 ? 15 : W < 700 ? 23 : 37, gap = 3;
    var size = Math.min(18, Math.floor((W - (cols - 1) * gap) / cols));
    var rowsN = Math.ceil(cells.length / cols), H = rowsN * (size + gap) + 30;
    var out = "";
    cells.forEach(function (c, i) {
      var cx = (i % cols) * (size + gap), cy = Math.floor(i / cols) * (size + gap);
      out += rect(cx, cy, size, size, "var(--" + c[0] + ")", { rx: 2, "data-tip": "<b>" + c[1] + "</b>", "class": "mark" });
    });
    out += text(0, H - 8, exact + " of " + total + " openings offered exactly 10%", "lab-strong");
    return {
      svg: svg(W, H, out, exact + " of " + total + " opening offers were exactly 10%, " + gt + " were above 10%, " + lt + " below"),
      table: table(["Year", "Openings", "Median offer", "Exactly 10%", "Above 10%", "Below 10%"], rows.map(function (r) { return [r.year, r.n, pct(r.median), r.exactly_10, r.gt_10, r.lt_10]; }), [1, 2, 3, 4, 5])
    };
  });

  // ---------------------------------------------------------------- 4. return latency strip
  function beeswarm(pts, xf, r) { // simple vertical dodge
    var placed = [];
    return pts.map(function (p) {
      var x = xf(p.days), lane = 0;
      for (var k = 0; k < 12; k++) {
        lane = k % 2 ? (k + 1) / 2 : -k / 2;
        var clash = placed.some(function (q) { return q.lane === lane && Math.abs(q.x - x) < r * 2 + 1; });
        if (!clash) break;
      }
      var o = { p: p, x: x, lane: lane }; placed.push(o); return o;
    });
  }
  var DAY_TICKS = [[1 / 24, "1 hour"], [1, "1 day"], [7, "1 week"], [30, "1 month"], [365, "1 year"], [3652, "10 years"]];
  mount("returns", function (W) {
    var pts = A.charts.returns.slice().sort(function (a, b) { return a.days - b.days; });
    var m = { l: 8, r: 16 }, H = 150, cy = 62, r = 5;
    var x = logs(1 / 24, 40, m.l, W - m.r);
    var out = "";
    [[1 / 24, "1 hour"], [1, "1 day"], [7, "1 week"], [30, "30 days"]].forEach(function (t) {
      out += '<line class="grid" x1="' + x(t[0]) + '" x2="' + x(t[0]) + '" y1="14" y2="' + (H - 28) + '"/>' + text(x(t[0]), H - 10, t[1], "tick", { "text-anchor": t[0] < 0.1 ? "start" : "middle" });
    });
    var med = byId.R4.numeric.median_days_from_incident, med18 = byId.R4.numeric.median_days_strict_18;
    out += '<line class="base" x1="' + x(med) + '" x2="' + x(med) + '" y1="18" y2="' + (H - 34) + '" style="stroke:var(--ink);stroke-width:2"/>' + text(x(med) - 6, 14, "median " + FMT.d1(med) + " days, all " + pts.length, "lab-strong", { "text-anchor": "end" });
    out += '<line x1="' + x(med18) + '" x2="' + x(med18) + '" y1="18" y2="' + (H - 34) + '" style="stroke:var(--ink-2);stroke-width:1.5;stroke-dasharray:4 3"/>' + text(x(med18) + 6, 14, FMT.d1(med18) + (narrow(W) ? " ex-flagged" : " without the five flagged"), "lab");
    beeswarm(pts, x, r).forEach(function (o) {
      var f = o.p.flag, style = f ? "fill:var(--surface);stroke:var(--s1);stroke-width:2.5" : "fill:var(--s1)";
      out += '<circle class="mark ring" cx="' + o.x.toFixed(1) + '" cy="' + (cy + o.lane * (r * 2 + 2)).toFixed(1) + '" r="' + r + '" style="' + style + '" data-tip="' + esc("<b>" + esc(o.p.name) + "</b><br>first return after " + humanDays(o.p.days) + (f ? "<br>Flagged: " + esc(f) : "")) + '"/>';
    });
    return {
      svg: svg(W, H, out, "Dot strip of days from hack to first return; median " + FMT.d1(med) + " days, " + FMT.d1(med18) + " without the five flagged returns"),
      table: table(["Incident", "Days from hack to first return", "Flag"], pts.map(function (p) { return [p.name, FMT.d1(p.days), p.flag]; }), [1])
    };
  });

  // ---------------------------------------------------------------- 5. outreach
  mount("outreach", function (W) {
    var d = A.derived;
    var rows = [["Team reached out", byId.R5.numeric.outreach_return_pct, d.outreach_yes_returned.v, d.outreach_yes_known.v],
      ["No outreach", byId.R5.numeric.no_outreach_return_pct, d.outreach_no_returned.v, d.outreach_no_known.v]];
    var rowH = 50, H = rows.length * rowH + 22, x = lin(0, 100, 0, W - 150);
    var out = "";
    [0, 25, 50, 75, 100].forEach(function (g) { out += '<line class="' + (g ? "grid" : "base") + '" x1="' + x(g) + '" x2="' + x(g) + '" y1="0" y2="' + (H - 18) + '"/>' + text(x(g), H - 4, g + "%", "tick", { "text-anchor": g === 0 ? "start" : "middle" }); });
    rows.forEach(function (r, i) {
      var y0 = i * rowH;
      out += '<g data-tip="' + esc("<b>" + r[0] + "</b><br>" + r[2] + " of " + r[3] + " known cases saw a return") + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" }) +
        text(0, y0 + 14, r[0], "lab") + hbar(x(0), y0 + 20, x(r[1]), 16, "var(--s1)") +
        text(x(r[1]) + 8, y0 + 33, pct(r[1]) + "  (" + r[2] + " of " + r[3] + ")", "val") + "</g>";
    });
    return { svg: svg(W, H, out, "Return rate with outreach " + pct(rows[0][1]) + ", without " + pct(rows[1][1])),
      table: table(["Group", "Return rate", "Returned", "Known cases"], rows.map(function (r) { return [r[0], pct(r[1]), r[2], r[3]]; }), [1, 2, 3]) };
  });

  // ---------------------------------------------------------------- 6. recovery channels
  var CHLABEL = { "voluntary return (attacker/insider)": "Returned by the attacker or an insider", "issuer / exchange / protocol freeze": "Issuer, exchange or protocol freeze",
    "law-enforcement seizure / court": "Law-enforcement seizure or court order", "chain-level: halt / validator / security council": "Chain halt, validators or security council",
    "chain-level: hard fork / rollback": "Hard fork or rollback", "white-hat / MEV rescue": "White-hat or MEV rescue", "other / unspecified": "Other or unspecified" };
  mount("channels", function (W) {
    var ch = byId.C3.numeric.channels;
    var rowH = 46, H = ch.length * rowH + 4, labW = narrow(W) ? 0 : 0;
    var maxV = ch[0].usd, x = lin(0, maxV, 0, W - 170);
    var out = "";
    ch.forEach(function (c, i) {
      var y0 = i * rowH, col = i === 0 ? "var(--s1)" : c.channel.indexOf("other") === 0 ? "var(--lost)" : "var(--s2)";
      var lab = CHLABEL[c.channel] || c.channel;
      out += '<g data-tip="' + esc("<b>" + esc(lab) + "</b><br>" + FMT.B2(c.usd) + ", " + pct(c.pct) + " of recovered dollars<br>" + c.incidents + " incidents") + '">' +
        rect(0, y0, W, rowH, "transparent", { "class": "hit" }) + text(labW, y0 + 14, lab, "lab") +
        hbar(labW, y0 + 20, x(c.usd), 16, col) + text(labW + x(c.usd) + 8, y0 + 33, money(c.usd) + ", " + c.incidents + " incidents", "val") + "</g>";
    });
    return { svg: svg(W, H, out, "Bar chart of recovered dollars by channel; attacker returns lead with " + pct(ch[0].pct)),
      table: table(["Channel", "Recovered (USD at theft date)", "Share of recovered", "Incidents"], ch.map(function (c) { return [CHLABEL[c.channel] || c.channel, FMT.B2(c.usd), pct(c.pct), c.incidents]; }), [1, 2, 3]) };
  });

  // ---------------------------------------------------------------- 7. the clock
  var CLOCK_COLOR = { attacker_return: "s1", law_enforcement_seizure: "stolen", first_arrest: "stolen" };
  mount("clock", function (W) {
    var rows = A.charts.clock, small = narrow(W);
    var m = { l: 6, r: 14, t: 6 }, laneH = small ? 66 : 50, H = m.t + rows.length * laneH + 34, r = 4.5;
    var x = logs(1 / 24, 3652, m.l, W - m.r);
    var out = "";
    DAY_TICKS.forEach(function (t, i) {
      if (small && (t[0] === 7 || t[0] === 30)) return;
      var lab = small && t[0] > 3000 ? "10 yrs" : t[1];
      out += '<line class="grid" x1="' + x(t[0]) + '" x2="' + x(t[0]) + '" y1="' + m.t + '" y2="' + (H - 26) + '"/>' +
        text(x(t[0]), H - 8, lab, "tick", { "text-anchor": i === 0 ? "start" : i === DAY_TICKS.length - 1 ? "end" : "middle" });
    });
    rows.forEach(function (row, i) {
      var y0 = m.t + i * laneH, cy = y0 + (small ? 48 : 34), col = "var(--" + (CLOCK_COLOR[row.key] || "s2") + ")";
      out += text(m.l, y0 + 14, row.label + (small || row.median_all ? "" : " (n=" + row.n + ")"), "lab-strong");
      var medTxt = "median " + humanDays(row.median) + (row.median_all ? (small ? " (" + row.n_in_scope + " in scope)" : " (" + row.n_in_scope + " in scope; " + Math.round(row.median_all).toLocaleString("en-US") + " for all " + row.n + ")") : "");
      if (small) out += text(m.l, y0 + 30, "n=" + row.n + ", " + medTxt, "lab");
      else out += text(W - m.r, y0 + 14, medTxt, "lab", { "text-anchor": "end" });
      out += '<line class="base" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + cy + '" y2="' + cy + '" style="stroke:var(--grid)"/>';
      beeswarm(row.pts.slice().sort(function (a, b) { return a.days - b.days; }), x, r).forEach(function (o) {
        var lane = Math.max(-1, Math.min(1, o.lane));
        var hollow = o.p.flag || o.p.in_scope === false;
        out += '<circle class="mark ring" cx="' + o.x.toFixed(1) + '" cy="' + (cy + lane * 7).toFixed(1) + '" r="' + r + '" style="' + (hollow ? "fill:var(--surface);stroke:" + col + ";stroke-width:2" : "fill:" + col) + '" data-tip="' +
          esc("<b>" + esc(o.p.name) + "</b><br>" + esc(row.label) + ": " + humanDays(o.p.days) + (o.p.flag ? "<br>Flagged: " + esc(o.p.flag) : "") + (o.p.kind ? "<br>" + esc(o.p.kind) : "")) + '"/>';
      });
      out += '<rect x="' + (x(row.median) - 1.5).toFixed(1) + '" y="' + (cy - 11) + '" width="3" height="22" rx="1.5" style="fill:var(--ink)"/>';
    });
    var tbl = [];
    rows.forEach(function (row) { row.pts.forEach(function (p) { tbl.push([row.label, p.name, FMT.d1(p.days), p.flag || p.kind || ""]); }); });
    return { svg: svg(W, H, out, "Timeline on a log scale from one hour to ten years showing when recoveries, returns and arrests happen"),
      table: table(["Channel", "Case", "Days after the hack", "Note"], tbl, [2]) };
  });

  // ---------------------------------------------------------------- 8. DPRK vs others recovery
  mount("dprkrec", function (W) {
    var d = byId.D3.numeric;
    var all = [["North Korea, government attribution", d.gov_only_pct, "s3"], ["No government or firm attribution to North Korea", d.non_dprk_pct, "s1"],
      ["North Korea, government or firm attribution", d.gov_plus_firm_pct, "s3"], ["North Korea, government or firm, without KuCoin and Munchables", d.gov_plus_firm_ex_outliers_pct, "s3"],
      ["No government or firm attribution, without the three largest returns", d.non_dprk_ex_top3_pct, "s1"]];
    var rows = all.slice(0, 2);
    var rowH = 46, H = rows.length * rowH + 20, x = lin(0, 30, 0, W - 60);
    var out = "";
    [0, 10, 20, 30].forEach(function (g) { out += '<line class="' + (g ? "grid" : "base") + '" x1="' + x(g) + '" x2="' + x(g) + '" y1="0" y2="' + (H - 18) + '"/>' + text(x(g), H - 4, g + "%", "tick", { "text-anchor": g ? "middle" : "start" }); });
    rows.forEach(function (r, i) {
      var y0 = i * rowH;
      out += '<g data-tip="' + esc("<b>" + esc(r[0]) + "</b><br>" + pct(r[1]) + " of dollars recovered") + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" }) +
        text(0, y0 + 14, r[0], "lab") + hbar(0, y0 + 20, x(r[1]), 16, "var(--" + r[2] + ")") + text(x(r[1]) + 8, y0 + 33, pct(r[1]), "val") + "</g>";
    });
    return { svg: svg(W, H, out, "Recovered share: North Korea, government attribution, " + pct(d.gov_only_pct) + " versus " + pct(d.non_dprk_pct) + " for other hacks"),
      table: table(["Group", "Share of dollars recovered"], all.map(function (r) { return [r[0], pct(r[1])]; }), [1]) };
  });

  // ---------------------------------------------------------------- 9. top 100 grid
  var ENF = { charged_for_hack: ["Person arrested or charged for the hack", "yes, for the hack"], laundering_side_only: ["Laundering-side arrests only", "laundering-side only"],
    civil_or_regulatory_only: ["Civil or regulatory action only", "civil or regulatory only"], not_for_the_hack: ["An arrest that was not for the hack", "arrest, not for the hack"],
    none_found: ["None found for the hack", "none found"], not_checked: ["Not checked for arrests", "not checked"] };
  var GRADE = { primary_read: "primary source read", primary_cited_not_read: "primary source cited, not read", primary_read_inferred_match: "primary source read, match inferred",
    secondary_wikipedia_or_press: "secondary (Wikipedia or press)", secondary_msmt_via_tayvano: "secondary (UN monitors via a tabulation)", secondary_msmt_via_sibling_dataset: "secondary (sibling dataset)",
    secondary_recalled_unread: "secondary (recalled, page unread)", firm_report: "firm report", firm_researcher_list_only: "firm researcher list only" };
  function cleanName(n) { return String(n).replace(/\s*\(DeFiLlama name:[^)]*\)\s*$/, ""); }
  mount("top100", function (W) {
    // HTML grid: one focusable tile per hack. The 12 largest are drawn as double-size tiles with their names.
    var t = A.charts.top100, cols = W >= 760 ? 20 : 8, gap = 4;
    var tile = Math.floor((W - (cols - 1) * gap) / cols);
    var html = '<div class="t100" style="--cols:' + cols + ";--tile:" + tile + 'px">';
    t.forEach(function (d, i) {
      var big = i < 12, status = (ENF[d.status] || [d.status])[0], nm = cleanName(d.name), yr = d.date.slice(0, 4);
      var cls = "t" + (big ? " big" : "") + (d.arrest ? " c" : "") + (d.status === "laundering_side_only" ? " l" : "") + (d.status === "not_checked" ? " nc" : "") + (d.dprk_gov ? " k" : "");
      var tt = "<b>#" + d.rank + " " + esc(nm) + "</b><br>" + esc(money(d.loss)) + ", " + yr + "<br>" + esc(status) + (d.dprk_gov ? "<br>Government-attributed to North Korea" : "");
      var label = "#" + d.rank + ", " + nm + ", " + money(d.loss) + ", " + yr + ". " + status + (d.dprk_gov ? ". Government-attributed to North Korea" : "");
      var inner = big ? '<span class="rk">#' + d.rank + '</span><span class="nm">' + esc(nm) + '</span><span class="am">' + esc(money(d.loss)) + "</span>"
        : (tile >= 30 ? '<span class="rk" style="position:absolute;left:4px;top:4px">' + d.rank + "</span>" : "");
      html += '<button type="button" class="' + cls + '" data-tip="' + esc(tt) + '" aria-label="' + esc(label) + '">' + inner + "</button>";
    });
    html += "</div>";
    return { svg: html,
      table: table(["Rank", "Incident", "Loss (master dataset)", "Year", "Arrest or charge, for the hack", "Gov.-attributed DPRK", "Attribution source"], t.map(function (d) { return [d.rank, cleanName(d.name), money(d.loss), d.date.slice(0, 4), (ENF[d.status] || ["", d.status])[1], d.dprk_gov ? "yes" : "", d.grade ? (GRADE[d.grade] || d.grade) : ""]; }), [0, 2]) };
  });

  // ---------------------------------------------------------------- 10. arrest timing
  mount("arrests", function (W) {
    var rows = A.charts.arrests, small = narrow(W);
    var labW = small ? 0 : 230, rowH = small ? 40 : 28, T = 22, H = rows.length * rowH + 30 + T;
    var x = logs(3, 3652, labW + 8, W - 70);
    var out = "";
    [[7, "1 week"], [30, "1 month"], [365, "1 year"], [3652, "10 years"]].forEach(function (t) {
      out += '<line class="grid" x1="' + x(t[0]) + '" x2="' + x(t[0]) + '" y1="14" y2="' + (H - 24) + '"/>' + text(x(t[0]), H - 6, t[1], "tick", { "text-anchor": t[0] > 3000 ? "end" : "middle" });
    });
    var med = byId.E3.numeric.median_days_2016_plus_in_headline_scope, medAll = byId.E3.numeric.median_days, nIn = byId.E3.numeric.n_2016_plus_in_headline_scope;
    // On narrow screens the case name sits above its dot, so draw the median lines only through the dot band of each row
    // (a full-height line would strike through the names).
    function medLine(v, style) {
      if (!small) return '<line x1="' + x(v) + '" x2="' + x(v) + '" y1="14" y2="' + (H - 24) + '" style="' + style + '"/>';
      return rows.map(function (r, i) { var y0 = T + i * rowH; return '<line x1="' + x(v) + '" x2="' + x(v) + '" y1="' + (y0 + 19) + '" y2="' + (y0 + rowH) + '" style="' + style + '"/>'; }).join("");
    }
    out += medLine(med, "stroke:var(--ink);stroke-width:2") + medLine(medAll, "stroke:var(--ink-2);stroke-width:1.5;stroke-dasharray:4 3");
    rows.forEach(function (r, i) {
      var y0 = T + i * rowH, cy = small ? y0 + 28 : y0 + 14, out_ = !r.in_scope;
      out += '<g data-tip="' + esc("<b>" + esc(r.name) + "</b><br>" + humanDays(r.days) + " to first public action" + (r.kind ? "<br>" + esc(r.kind) : "")) + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" });
      out += small ? text(0, y0 + 12, r.name + (r.kind ? " (" + r.kind.split(",")[0] + ")" : ""), "lab halo") : text(labW, cy + 4, r.name, "lab halo", { "text-anchor": "end" });
      out += '<line x1="' + (labW + 8) + '" x2="' + x(r.days) + '" y1="' + cy + '" y2="' + cy + '" style="stroke:var(--axis);stroke-width:1.5"/>';
      out += '<circle class="mark ring" cx="' + x(r.days) + '" cy="' + cy + '" r="5" style="' + (out_ ? "fill:var(--surface);stroke:var(--stolen);stroke-width:2.5" : "fill:var(--stolen)") + '"/>';
      out += text(x(r.days) + 9, cy + 4, Math.round(r.days).toLocaleString("en-US"), "val") + "</g>";
    });
    out += text(x(med) - 5, 10, "median " + Math.round(med) + " (" + nIn + " in scope)", "lab-strong", { "text-anchor": "end" });
    out += text(x(medAll) + 5, 10, Math.round(medAll) + " (all " + rows.length + ")", "lab");
    return { svg: svg(W, H, out, "Days from hack to first arrest or charge for a separate sample of " + rows.length + " cases; median " + Math.round(med) + " days for the " + nIn + " inside our data, " + Math.round(medAll) + " for all"),
      table: table(["Incident", "Days to first arrest or charge", "Note"], rows.map(function (r) { return [r.name, r.days, r.kind]; }), [1]) };
  });

  // ---------------------------------------------------------------- 11. outcomes for 23 people
  var OUTLABEL = { convicted_or_pleaded: "Convicted, pleaded guilty, or plea agreement on file", at_large_or_not_in_custody: "Charged, not in custody", pending: "Pending",
    acquitted: "Acquitted", conviction_vacated_or_acquitted_appeal_pending: "Conviction vacated, appeal pending", outcome_unknown: "Outcome unknown" };
  mount("outcomes", function (W) {
    var o = A.charts.outcomes, det = A.charts.outcomes_detail;
    var keys = Object.keys(OUTLABEL).filter(function (k) { return k in o; });
    var small = narrow(W), labW = small ? 0 : 250, rowH = small ? 44 : 32, H = keys.length * rowH + 4, r = 7;
    var out = "";
    keys.forEach(function (k, i) {
      var y0 = i * rowH, cy = small ? y0 + 30 : y0 + 16, names = det[k] || [];
      out += small ? text(0, y0 + 13, OUTLABEL[k] + " (" + o[k] + ")", "lab") : text(labW - 12, cy + 4, OUTLABEL[k], "lab", { "text-anchor": "end" });
      for (var j = 0; j < o[k]; j++) {
        var cx = labW + r + 1 + j * (r * 2 + 5);
        out += '<circle class="mark ring" cx="' + cx + '" cy="' + cy + '" r="' + r + '" style="fill:' + (k === "convicted_or_pleaded" ? "var(--charged)" : "var(--stolen)") + '" data-tip="' + esc("<b>" + esc(names[j] || "Person " + (j + 1)) + "</b><br>" + OUTLABEL[k]) + '"/>';
      }
      if (!small) out += text(labW + o[k] * (r * 2 + 5) + 6, cy + 4, String(o[k]), "val");
    });
    var tbl = [];
    keys.forEach(function (k) { (det[k] || []).forEach(function (n) { tbl.push([OUTLABEL[k], n]); }); });
    return { svg: svg(W, H, out, "Outcomes for " + A.canon.numbers.filter(function (n) { return n.id === "E4"; })[0].numeric.individuals + " people charged"),
      table: table(["Outcome", "Person"], tbl) };
  });

  // ---------------------------------------------------------------- 12. DPRK share of $ vs incidents
  mount("dprkshare", function (W) {
    var d1 = byId.D1.numeric, d = A.derived;
    var groups = [["Government-attributed", d1.gov.pct, d.dprk_gov_count_pct.v, d1.gov.n], ["Government or firm attribution", d1.gov_plus_firm.pct, d.dprk_count_pct.v, d1.gov_plus_firm.n]];
    var gH = 78, H = groups.length * gH + 20, x = lin(0, 50, 0, W - 60);
    var out = "";
    [0, 10, 20, 30, 40, 50].forEach(function (g) { if (narrow(W) && g % 20 && g) return; out += '<line class="' + (g ? "grid" : "base") + '" x1="' + x(g) + '" x2="' + x(g) + '" y1="0" y2="' + (H - 18) + '"/>' + text(x(g), H - 4, g + "%", "tick", { "text-anchor": g ? "middle" : "start" }); });
    groups.forEach(function (g, i) {
      var y0 = i * gH;
      out += text(0, y0 + 14, g[0] + " (" + g[3] + " incidents)", "lab-strong");
      out += '<g data-tip="' + esc("<b>" + g[0] + "</b><br>" + pct(g[1]) + " of stolen dollars") + '">' + hbar(0, y0 + 22, x(g[1]), 16, "var(--s3)") + text(x(g[1]) + 8, y0 + 35, pct(g[1]) + " of dollars", "val") + "</g>";
      out += '<g data-tip="' + esc("<b>" + g[0] + "</b><br>" + pct(g[2]) + " of incidents") + '">' + hbar(0, y0 + 42, x(g[2]), 16, "var(--lost)") + text(x(g[2]) + 8, y0 + 55, pct(g[2]) + " of incidents", "val") + "</g>";
    });
    return { svg: svg(W, H, out, "North Korea's share of dollars versus share of incidents"),
      table: table(["Tier", "Incidents", "Share of dollars", "Share of incidents"], groups.map(function (g) { return [g[0], g[3], pct(g[1]), pct(g[2])]; }), [1, 2, 3]) };
  });

  // ---------------------------------------------------------------- 13. DPRK share by year
  mount("dprkyear", function (W) {
    var by = byId.D1.numeric.by_year, years = Object.keys(by).sort();
    var H = narrow(W) ? 230 : 260, m = { t: 22, r: 4, b: 26, l: 40 };
    var y = lin(0, 100, H - m.b, m.t), band = (W - m.l - m.r) / years.length, bw = Math.min(24, band * 0.62);
    var out = "";
    [0, 25, 50, 75, 100].forEach(function (g) { out += '<line class="' + (g ? "grid" : "base") + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>' + text(m.l - 8, y(g) + 4, g + "%", "tick", { "text-anchor": "end" }); });
    years.forEach(function (yr, i) {
      var v = by[yr], cx = m.l + band * i + band / 2;
      var tt = "<b>" + yr + "</b><br>Government-attributed: " + pct(v.gov_pct) + "<br>With firm attribution: " + pct(v.gov_or_firm_pct);
      out += '<g data-tip="' + esc(tt) + '">' + rect(m.l + band * i, m.t, band, H - m.t - m.b, "transparent", { "class": "hit" });
      var hGov = y(0) - y(v.gov_pct), hAll = y(0) - y(v.gov_or_firm_pct);
      if (hAll - hGov > 0.5) out += vbar(cx - bw / 2, y(v.gov_pct) - (hGov > 0 ? 2 : 0), bw, hAll - hGov - (hGov > 0 ? 2 : 0), "var(--lost)");
      if (hGov > 0.5) out += rect(cx - bw / 2, y(v.gov_pct), bw, hGov, "var(--s3)", { "class": "mark" });
      out += "</g>";
      if (!narrow(W) || i % 2 === 0 || i === years.length - 1) out += text(cx, H - m.b + 17, narrow(W) ? "'" + yr.slice(2) : yr, "tick", { "text-anchor": "middle" });
      if (yr === "2025" || yr === "2018") out += text(cx, y(v.gov_or_firm_pct) - 6, pct(v.gov_or_firm_pct, 0), "val", { "text-anchor": "middle" });
    });
    return { svg: svg(W, H, out, "North Korea's share of each year's stolen dollars, 2016 to 2026"),
      table: table(["Year", "Government-attributed", "Government or firm"], years.map(function (yr) { return [yr, pct(by[yr].gov_pct), pct(by[yr].gov_or_firm_pct)]; }), [1, 2]) };
  });

  // ---------------------------------------------------------------- 14. DPRK initial access
  mount("dprkaccess", function (W) {
    var rows = A.charts.dprk_access, x = lin(0, rows[0].usd, 0, W - 80);
    // wrap long labels onto a second line instead of letting them run off the chart
    var per = Math.max(18, Math.floor(W / 6.6));
    function wrap(s) {
      var words = s.split(" "), lines = [], cur = "";
      words.forEach(function (w) { if (cur && (cur + " " + w).length > per) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; });
      if (cur) lines.push(cur);
      return lines;
    }
    var y0 = 0, out = "";
    rows.forEach(function (r) {
      var lines = wrap(r.label + " (" + r.n + ")"), rowH = 32 + 15 * lines.length, col = r.key === "unknown" ? "var(--lost)" : "var(--s3)";
      var lab = lines.map(function (l, k) { return text(0, y0 + 14 + 15 * k, l, "lab"); }).join("");
      var by = y0 + 6 + 15 * lines.length;
      out += '<g data-tip="' + esc("<b>" + esc(r.label) + "</b><br>" + FMT.B2(r.usd) + " across " + r.n + " rows") + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" }) +
        lab + hbar(0, by, x(r.usd), 16, col) + text(x(r.usd) + 8, by + 13, money(r.usd), "val") + "</g>";
      y0 += rowH;
    });
    return { svg: svg(W, y0 + 4, out, "North Korean initial access by dollars stolen; key or infrastructure compromise leads"),
      table: table(["Initial access", "Rows", "Stolen (USD)"], rows.map(function (r) { return [r.label, r.n, FMT.B2(r.usd)]; }), [1, 2]) };
  });

  if (A.attack) {
  // ================================================================ attack anatomy (data: A.attack, built from K1 to K9)
  var AT = A.attack;
  var SHORT = { "2020-22": "2020-22", "2023": "2023", "2024": "2024", "2025": "2025", "2026": "2026" };
  function pc(v) { return FMT.p1(v); }

  // ---------------------------------------------------------------- A1. same-transaction attacks by year
  mount("sametx", function (W) {
    var eras = AT.k1.eras;
    var host = document.querySelector('[data-chart="sametx"]');
    var view = host.getAttribute("data-view") || "ctor";
    var small = narrow(W);
    var H = small ? 270 : 320, m = { t: 30, r: 4, b: 28, l: 44 };
    var maxV = view === "block" ? 60 : 50;
    var y = lin(0, maxV, H - m.b, m.t);
    var band = (W - m.l - m.r) / eras.length, out = "";
    for (var g = 0; g <= maxV; g += 10) {
      out += '<line class="' + (g ? "grid" : "base") + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>' + text(m.l - 8, y(g) + 4, g + "%", "tick", { "text-anchor": "end" });
    }
    var bw = view === "usd" ? Math.min(small ? 24 : 34, band * 0.4) : Math.min(44, band * 0.62);
    eras.forEach(function (e, i) {
      var cx = m.l + band * i + band / 2;
      var tip = "<b>" + esc(e.label) + "</b><br>" + e.ctor + " of " + e.n + " exploits (" + pc(e.ctor_pct) + ") ran inside the contract's own deployment" +
        "<br>" + e.same_or_block + " of " + e.n + " (" + pc(e.same_or_block_pct) + ") in the same transaction or the same block" +
        "<br>" + pc(e.usd_pct) + " of dollars lost, among " + e.usd_rows + " rows with a USD figure";
      out += '<g data-tip="' + esc(tip) + '">' + rect(m.l + band * i, m.t - 20, band, H - m.t - m.b + 20, "transparent", { "class": "hit" });
      if (view === "usd") {
        var x1 = cx - bw - 2, x2 = cx + 2;
        out += vbar(x1, y(0), bw, y(0) - y(e.ctor_pct), "var(--s1)") + vbar(x2, y(0), bw, y(0) - y(e.usd_pct), "var(--s2)");
        if (e.ctor_pct === 0 && e.usd_pct === 0) out += text(cx, y(0) - 7, "0%", "val", { "text-anchor": "middle" });
        else {
          out += text(x1 + bw / 2, y(e.ctor_pct) - 6, small ? FMT.p0(e.ctor_pct) : FMT.p1(e.ctor_pct), "val", { "text-anchor": "middle", style: "font-size:12px" });
          out += text(x2 + bw / 2, y(e.usd_pct) - 6, small ? FMT.p0(e.usd_pct) : FMT.p1(e.usd_pct), "val", { "text-anchor": "middle", style: "font-size:12px" });
        }
      } else {
        var v = view === "block" ? e.same_or_block_pct : e.ctor_pct;
        out += vbar(cx - bw / 2, y(0), bw, y(0) - y(v), "var(--s1)");
        out += text(cx, y(v) - 7, v === 0 ? "0%" : pc(v), "val", { "text-anchor": "middle" });
      }
      out += "</g>";
      out += text(cx, H - m.b + 18, e.era === "2026" && !small ? "2026 to Oct" : SHORT[e.era], "tick", { "text-anchor": "middle" });
    });
    if (view === "usd") {
      out += rect(m.l, 4, 11, 11, "var(--s1)", { rx: 2 }) + text(m.l + 17, 14, "Share of exploits", "lab") +
        rect(m.l + (small ? 128 : 140), 4, 11, 11, "var(--s2)", { rx: 2 }) + text(m.l + (small ? 145 : 157), 14, "Share of dollars lost", "lab");
    }
    var label = { ctor: "Column chart of the share of exploits run inside the attack contract's own deployment, by year: 0% in 2020 to 2022, " + pc(eras[1].ctor_pct) + " in 2023, " + pc(eras[2].ctor_pct) + " in 2024, " + pc(eras[3].ctor_pct) + " in 2025, " + pc(eras[4].ctor_pct) + " in 2026",
      block: "Column chart of the share of exploits in the same transaction or same block as deployment: " + pc(eras[3].same_or_block_pct) + " in 2025 and " + pc(eras[4].same_or_block_pct) + " in 2026",
      usd: "Paired columns comparing the share of exploits with the share of dollars lost that were same-transaction attacks; dollars are " + pc(eras[3].usd_pct) + " in 2025 against " + pc(eras[3].ctor_pct) + " of exploits" }[view];
    return {
      svg: svg(W, H, out, label),
      table: table(["Years", "Exploits", "Same transaction", "Share", "Same transaction or same block", "Share", "Share of dollars", "Rows with a USD figure"],
        eras.map(function (e) { return [e.label, e.n, e.ctor, pc(e.ctor_pct), e.same_or_block, pc(e.same_or_block_pct), pc(e.usd_pct), e.usd_rows]; }), [1, 2, 3, 4, 5, 6, 7])
    };
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".seg button");
    if (!b) return;
    var fig = b.closest("figure"), host = fig.querySelector("[data-chart]");
    fig.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    host.setAttribute("data-view", b.getAttribute("data-view"));
    renderAll(true);
  });

  // ---------------------------------------------------------------- A2. deploy-to-attack lag without the zero-lag rows
  function minLabel(v) { return FMT.d1(v) + " min"; }
  mount("lag", function (W) {
    var rows = AT.k2.eras, small = narrow(W);
    var rowH = small ? 56 : 46, m = { t: 4, b: 30, l: small ? 6 : 200, r: small ? 8 : 12 };
    var H = m.t + rows.length * rowH + m.b;
    var x = logs(1, 400, m.l, W - m.r - (small ? 120 : 190));
    var out = "";
    [[1, "1 min"], [10, "10 min"], [100, "100 min"]].forEach(function (t) {
      var ok = x(t[0]) <= W - m.r - 40;
      if (!ok) return;
      out += '<line class="grid" x1="' + x(t[0]) + '" x2="' + x(t[0]) + '" y1="' + m.t + '" y2="' + (H - m.b) + '"/>' + text(x(t[0]), H - 10, t[1], "tick", { "text-anchor": t[0] === 1 ? "start" : "middle" });
    });
    rows.forEach(function (r, i) {
      var y0 = m.t + i * rowH, cy = small ? y0 + 38 : y0 + rowH / 2;
      var allTxt = "median of all " + r.n + (r.median_min === 0 ? ": 0 s" : ": " + FMT.d1(r.median_min) + " min");
      var hollow = r.n_nonzero < 30;
      var tip = "<b>" + esc(r.label) + "</b><br>All " + r.n + " attacker-deployed contracts: median " + (r.median_min === 0 ? "0 seconds" : FMT.d1(r.median_min) + " minutes") +
        "<br>" + (r.n - r.n_nonzero) + " of " + r.n + " attacked with no gap (" + pc(r.zero_pct) + ")<br>Without those: median " + FMT.d1(r.median_nonzero_min) + " minutes across " + r.n_nonzero + " contracts" + (hollow ? "<br>Fewer than 30 contracts: read with care" : "");
      out += '<g data-tip="' + esc(tip) + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" });
      if (small) out += text(m.l, y0 + 14, r.label, "lab-strong") + text(m.l, y0 + 30, allTxt, "lab");
      else out += text(m.l - 14, cy - 2, r.label, "lab-strong", { "text-anchor": "end" }) + text(m.l - 14, cy + 14, allTxt, "lab", { "text-anchor": "end" });
      out += '<line x1="' + m.l + '" x2="' + x(r.median_nonzero_min) + '" y1="' + cy + '" y2="' + cy + '" style="stroke:var(--axis);stroke-width:1.5"/>';
      out += '<circle class="mark ring" cx="' + x(r.median_nonzero_min) + '" cy="' + cy + '" r="6" style="' + (hollow ? "fill:var(--surface);stroke:var(--s1);stroke-width:2.5" : "fill:var(--s1)") + '"/>';
      out += text(x(r.median_nonzero_min) + 11, cy + 4, minLabel(r.median_nonzero_min) + " (" + r.n_nonzero + ")", "val") + "</g>";
    });
    return {
      svg: svg(W, H, out, "Dot chart on a log scale of the median minutes from deployment to attack without zero-lag attacks: about 5 to 11 minutes in each era, with 2025 at " + FMT.d1(rows[3].median_nonzero_min) + " minutes on only " + rows[3].n_nonzero + " contracts"),
      table: table(["Years", "Attacker-deployed contracts", "Median, all (minutes)", "Attacks with zero lag", "Contracts with a gap", "Median of those (minutes)"],
        rows.map(function (r) { return [r.label, r.n, FMT.d1(r.median_min), pc(r.zero_pct), r.n_nonzero, FMT.d1(r.median_nonzero_min)]; }), [1, 2, 3, 4, 5])
    };
  });

  // ---------------------------------------------------------------- A3. vector drift, small multiples
  var VSHORT = { oracle_price_manipulation: "Oracle manipulation", access_control: "Access control", business_logic_accounting: "Business logic", reentrancy: "Reentrancy" };
  mount("drift", function (W) {
    var vs = AT.k3.vectors, eras = AT.k3.eras, small = narrow(W);
    var cols = W >= 820 ? 4 : 2, gap = small ? 14 : 22, pw = (W - gap * (cols - 1)) / cols;
    var ph = small ? 150 : 170, rowsN = Math.ceil(vs.length / cols), H = rowsN * (ph + 12);
    var yl = ["2020-22", "2023", "2024", "2025", "2026"];
    var out = "";
    vs.forEach(function (v, k) {
      var px = (k % cols) * (pw + gap), py = Math.floor(k / cols) * (ph + 12);
      var top = py + 34, base = py + ph - 22, y = lin(0, 45, base, top), band = pw / v.pct.length, bw = Math.min(30, band * 0.62);
      out += text(px, py + 12, VSHORT[v.key], "lab-strong");
      [0, 15, 30, 45].forEach(function (g) { out += '<line class="' + (g ? "grid" : "base") + '" x1="' + px + '" x2="' + (px + pw) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>'; });
      v.pct.forEach(function (val, i) {
        var cx = px + band * i + band / 2;
        var tip = "<b>" + esc(v.label) + "</b><br>" + esc(eras[i]) + ": " + pc(val) + " of " + AT.k1.eras[i].n + " exploits";
        out += '<g data-tip="' + esc(tip) + '">' + rect(px + band * i, top - 14, band, base - top + 14, "transparent", { "class": "hit" }) + vbar(cx - bw / 2, base, bw, base - y(val), "var(--s2)") + "</g>";
        out += text(cx, y(val) - 5, FMT.d1(val), "val", { "text-anchor": "middle", style: "font-size:12px" });
        out += text(cx, base + 15, small ? "'" + yl[i].slice(2, 4) : (i === 0 ? "20-22" : yl[i]), "tick", { "text-anchor": "middle", style: "font-size:12px" });
      });
    });
    return {
      svg: svg(W, H, out, "Four small column charts of attack-vector share by era. Oracle manipulation falls from " + pc(vs[0].pct[0]) + " to " + pc(vs[0].pct[4]) + "; access control rises from " + pc(vs[1].pct[0]) + " to " + pc(vs[1].pct[4]) + "; reentrancy falls to " + pc(vs[3].pct[4])),
      table: table(["Vector, share of incidents"].concat(eras), vs.map(function (v) { return [v.label].concat(v.pct.map(pc)); }).concat([["Flash loan used (any evidence)"].concat(AT.k3.flash_pct.map(pc))]), [1, 2, 3, 4, 5])
    };
  });

  // ---------------------------------------------------------------- A4. Compound-v2 copycat wave
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  mount("waves", function (W) {
    var rows = AT.k9.wave, small = narrow(W);
    var labW = small ? 0 : 150, rowH = small ? 40 : 28, T = 4, B = 30, H = T + rows.length * rowH + B;
    var d0 = Date.parse("2023-04-01"), d1 = Date.parse("2024-05-31");
    var x = lin(d0, d1, labW + 12, W - (small ? 52 : 70));
    var maxL = Math.max.apply(null, rows.map(function (r) { return r.loss; }));
    var out = "";
    (small ? ["2023-04-01", "2023-10-01", "2024-04-01"] : ["2023-04-01", "2023-07-01", "2023-10-01", "2024-01-01", "2024-04-01"]).forEach(function (d, i) {
      var t = Date.parse(d), mo = +d.slice(5, 7) - 1;
      out += '<line class="grid" x1="' + x(t) + '" x2="' + x(t) + '" y1="' + T + '" y2="' + (H - B) + '"/>' + text(x(t), H - 10, MON[mo] + (small ? " '" + d.slice(2, 4) : " " + d.slice(0, 4)), "tick", { "text-anchor": i === 0 ? "start" : "middle" });
    });
    rows.forEach(function (r, i) {
      var y0 = T + i * rowH, cy = small ? y0 + 28 : y0 + rowH / 2, cx = x(Date.parse(r.date)), rad = 3.5 + 7 * Math.sqrt(r.loss / maxL);
      var tip = "<b>" + esc(r.name) + "</b><br>" + esc(U.dateText(r.date)) + "<br>Reported loss " + esc(money(r.loss));
      out += '<g data-tip="' + esc(tip) + '">' + rect(0, y0, W, rowH, "transparent", { "class": "hit" });
      out += small ? text(0, y0 + 12, r.name, "lab") : text(labW, cy + 4, r.name, "lab", { "text-anchor": "end" });
      out += '<line x1="' + (labW + 12) + '" x2="' + cx + '" y1="' + cy + '" y2="' + cy + '" style="stroke:var(--axis);stroke-width:1"/>';
      out += '<circle class="mark ring" cx="' + cx.toFixed(1) + '" cy="' + cy + '" r="' + rad.toFixed(1) + '" style="fill:var(--s2)"/>';
      var right = cx < W - 120;
      out += text(right ? cx + rad + 6 : cx - rad - 6, cy + 4, money(r.loss), "val", { "text-anchor": right ? "start" : "end" }) + "</g>";
    });
    return {
      svg: svg(W, H, out, rows.length + " lending-market exploits of one bug class between " + U.dateText(rows[0].date) + " and " + U.dateText(rows[rows.length - 1].date)),
      table: table(["Date", "Incident", "Reported loss (USD)"], rows.map(function (r) { return [U.dateText(r.date), r.name, money(r.loss)]; }), [2])
    };
  });

  // ---------------------------------------------------------------- A5. funding by sanctions era
  mount("funding", function (W) {
    var rows = AT.k4.eras, small = narrow(W);
    var gH = small ? 134 : 104, T = 2, B = 22, H = T + rows.length * gH + B, mR = small ? 120 : 170;
    var x = lin(0, 50, 0, W - mR);
    var out = "";
    [0, 10, 20, 30, 40, 50].forEach(function (g) {
      if (small && g % 20 && g) return;
      out += '<line class="' + (g ? "grid" : "base") + '" x1="' + x(g) + '" x2="' + x(g) + '" y1="' + T + '" y2="' + (H - B) + '"/>' + text(x(g), H - 6, g + "%", "tick", { "text-anchor": g ? "middle" : "start" });
    });
    rows.forEach(function (r, i) {
      var y0 = T + i * gH;
      var bars = [["Direct from Tornado Cash", r.direct, r.direct_pct, "var(--s1)"], ["Direct or one hop", r.direct + r.hop, r.incl_hop_pct, "var(--s1-wash)"],
        ["Railgun", r.railgun, Math.round(1000 * r.railgun / r.n) / 10, "var(--s2)"]];
      if (small) out += text(0, y0 + 14, r.label + ", " + r.n + " wallets", "lab-strong") + text(0, y0 + 30, r.dates, "lab");
      else out += text(0, y0 + 14, r.label + " (" + r.dates + "), " + r.n + " wallets", "lab-strong");
      bars.forEach(function (b, j) {
        var by = y0 + (small ? 40 : 24) + j * 24;
        var tip = "<b>" + esc(r.label) + "</b><br>" + esc(b[0]) + ": " + b[1] + " of " + r.n + " wallets (" + pc(b[2]) + ")";
        out += '<g data-tip="' + esc(tip) + '">' + rect(0, by - 2, W, 22, "transparent", { "class": "hit" }) + (b[1] ? hbar(x(0) + 1, by + 1, x(b[2]) - 2, 15, b[3], b[3] === "var(--s1-wash)" ? { style: "fill:var(--s1-wash);stroke:var(--s1);stroke-width:2" } : null) : '<rect x="0" y="' + by + '" width="2" height="17" style="fill:' + b[3] + '"/>');
        out += text(x(b[2]) + 8, by + 13, (b[1] ? pc(b[2]) : "0%") + " (" + b[1] + " of " + r.n + ")", "val") + "</g>";
      });
    });
    return {
      svg: svg(W, H, out, "Bar groups by sanctions era: direct Tornado Cash funding " + rows.map(function (r) { return pc(r.direct_pct); }).join(", ") + "; with one hop " + rows.map(function (r) { return pc(r.incl_hop_pct); }).join(", ") + "; Railgun funded " + rows[2].railgun + " of " + rows[2].n + " wallets after the delisting"),
      table: table(["Era", "Wallets with a resolved funder", "Direct from Tornado", "Share", "Direct or one hop", "Share", "Railgun"],
        rows.map(function (r) { return [r.label + " (" + r.dates + ")", r.n, r.direct, pc(r.direct_pct), r.direct + r.hop, pc(r.incl_hop_pct), r.railgun]; }), [1, 2, 3, 4, 5, 6])
    };
  });

  // ---------------------------------------------------------------- A6. monthly counts, two trackers
  mount("monthly", function (W) {
    var ms = AT.k5.months, small = narrow(W);
    var cols = W >= 760 ? 2 : 1, gap = 28, pw = (W - gap * (cols - 1)) / cols;
    var ph = small ? 200 : 230, H = Math.ceil(2 / cols) * (ph + 14);
    var trackers = [["defillama", "DeFiLlama", "dl25_pm", "dl26_pm"], ["slowmist", "SlowMist", "sm25_pm", "sm26_pm"]];
    var n5 = byId.K5.numeric, out = "";
    trackers.forEach(function (t, k) {
      var px = (k % cols) * (pw + gap), py = Math.floor(k / cols) * (ph + 14);
      var m = { l: 30, r: 34, top: py + 44, bot: py + ph - 22 };
      var y = lin(0, 60, m.bot, m.top), xw = pw - m.l - m.r, xs = function (i) { return px + m.l + xw * i / 11; };
      out += text(px, py + 12, t[1], "lab-strong") + text(px, py + 28, FMT.d1(n5[t[2]]) + " a month in 2025, " + FMT.d1(n5[t[3]]) + " in Mar to Sep 2026", "lab", { style: "font-size:12px" });
      [0, 20, 40, 60].forEach(function (g) {
        out += '<line class="' + (g ? "grid" : "base") + '" x1="' + (px + m.l) + '" x2="' + (px + pw - m.r + 6) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>' + text(px + m.l - 6, y(g) + 4, String(g), "tick", { "text-anchor": "end" });
      });
      [2025, 2026].forEach(function (yr) {
        var pts = ms.filter(function (r) { return r.year === yr; });
        var col = yr === 2025 ? "var(--stolen)" : "var(--s1)";
        var d = pts.map(function (r, i) { return (i ? "L" : "M") + xs(r.month - 1).toFixed(1) + "," + y(r[t[0]]).toFixed(1); }).join("");
        out += '<path d="' + d + '" style="fill:none;stroke:' + col + ';stroke-width:2;stroke-linejoin:round"/>';
        pts.forEach(function (r) { out += '<circle cx="' + xs(r.month - 1).toFixed(1) + '" cy="' + y(r[t[0]]).toFixed(1) + '" r="3" style="fill:' + col + '"/>'; });
        var last = pts[pts.length - 1];
        out += text(xs(last.month - 1) + 8, y(last[t[0]]) + 4, String(yr), "val", { style: "fill:var(--ink)" });
      });
      for (var i = 0; i < 12; i++) {
        var a = ms.filter(function (r) { return r.year === 2025 && r.month === i + 1; })[0], b = ms.filter(function (r) { return r.year === 2026 && r.month === i + 1; })[0];
        var tip = "<b>" + MON[i] + "</b><br>" + t[1] + " 2025: " + a[t[0]] + (b ? "<br>" + t[1] + " 2026: " + b[t[0]] : "<br>2026: October is partial; November and December are still ahead");
        out += '<g data-tip="' + esc(tip) + '">' + rect(xs(i) - xw / 22, m.top - 8, xw / 11, m.bot - m.top + 8, "transparent", { "class": "hit" }) + "</g>";
        if (!small || i % 2 === 0) out += text(xs(i), m.bot + 16, MON[i], "tick", { "text-anchor": "middle", style: "font-size:12px" });
      }
    });
    var tbl = [];
    for (var i = 0; i < 12; i++) {
      var a = ms.filter(function (r) { return r.year === 2025 && r.month === i + 1; })[0], b = ms.filter(function (r) { return r.year === 2026 && r.month === i + 1; })[0];
      tbl.push([MON[i], a.defillama, b ? b.defillama : "", a.slowmist, b ? b.slowmist : ""]);
    }
    return {
      svg: svg(W, H, out, "Two line charts of recorded incidents per month, 2025 against 2026, for DeFiLlama and SlowMist: both run at roughly 12 to 17 a month in 2025 and about 38 a month from March to September 2026"),
      table: table(["Month", "DeFiLlama 2025", "DeFiLlama 2026", "SlowMist 2025", "SlowMist 2026"], tbl, [1, 2, 3, 4])
    };
  });

  }

  // ---------------------------------------------------------------- render + resize
  window.ATHcharts = { render: renderAll };
  function go() { renderAll(false); }
  go();
  var t;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(go, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { renderAll(true); });
})();
