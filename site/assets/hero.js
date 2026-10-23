/* After the Hack: the dot field, famous hacks, finding-card pictures, look-up box, message strip, share links and section navigation.
   Everything here reads window.ATH (data/bundle.js): the incident index is one row per headline incident, and every outcome
   sentence is composed from the fields in that row. */
(function () {
  "use strict";
  var A = window.ATH, U = window.ATHfmt;
  if (!A || !U || !A.inc) return;
  var esc = U.esc, FMT = U.FMT, money = U.money, R = U.resolve;
  function $(id) { return document.getElementById(id); }
  function num(key) { var r = R(key); return r ? r.v : 0; }

  // ------------------------------------------------------------ incident index
  var CH = A.inc.chains;
  var INC = A.inc.rows.map(function (r, idx) {
    return { i: idx, id: r[0], name: r[1], loss: r[2], chain: CH[r[3]] || "", enf: r[4], rec: r[5], ret: r[6], oth: r[7], ch: r[8], dprk: r[9],
      alias: r[10] || "", date: r[11] || (r[0].slice(0, 4) + "-" + r[0].slice(4, 6) + "-" + r[0].slice(6, 8)),
      who: r[12] || "", ev: r[13] || "", split: r[14] ? r[14].split(",").map(function (c) { var p = c.split(":"); return { k: p[0], v: +p[1] }; }) : [] };
  });
  var LINES = A.inc.lines || {};
  var N = INC.length, BYID = {};
  INC.forEach(function (x) { BYID[x.id] = x; x._k = norm(x.name + " " + x.alias); });
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

  var ENF_TXT = { c: "Someone was arrested or charged for the hack.", l: "Charges only for handling the loot.", v: "Civil or regulatory action only.",
    o: "An arrest on other grounds.", n: "No arrest or charge for this hack found.", u: "Arrest and charge status is not established in this dataset." };
  var REC_TXT = { u: "Recovery outcome not checked.", n: "No recovery recorded in the sources checked.", v: "No return by the attacker found.",
    c: "A recovery is claimed but not verified.", q: "Some funds recovered, amount not quantified.", r: "Some funds recovered." };
  // verbs for money that was not returned: only the channel the data names; "o" (unspecified) stays a plain "recovered"
  var CH_TXT = { f: "frozen", s: "seized or recovered by court order", w: "rescued", h: "frozen by the chain", k: "recovered by a fork or rollback", o: "recovered", r: "returned" };
  var SPLIT_TXT = { f: "frozen by an issuer, exchange or protocol", s: "seized or recovered by court order", w: "rescued", h: "frozen by the chain", k: "recovered by a fork or rollback", o: "recovered", r: "returned" };
  var WHO_TXT = { a: "The attacker returned ", b: "Bot operators returned ", m: "An MEV builder returned " };
  var CHAN_TAG = { f: "Frozen", s: "Seized or recovered by court order", w: "Rescued", h: "Frozen by the chain", k: "Recovered by a fork or rollback", o: "Other recorded recovery" };
  function pctOf(v, loss) { var p = 100 * v / loss; return p < 10 ? FMT.p1(p) : FMT.p0(p); }
  function recLine(i) {
    var hasAmt = i.ret > 0 || i.oth > 0;
    // an amount whose evidence is unverified, or whose status code says unknown, claimed or none, is never printed as a completed recovery
    if (hasAmt && (i.ev === "x" || "cunqv".indexOf(i.rec) >= 0)) return "A recovery of about " + money(i.ret + i.oth) + " is reported but not verified.";
    var p = [];
    if (i.ret > 0) {
      var share = i.ret < i.loss * 0.995 && i.ret >= i.loss * 0.001 ? " (" + pctOf(i.ret, i.loss) + " of the loss)" : "";
      p.push(WHO_TXT[i.who] ? WHO_TXT[i.who] + money(i.ret) + share + "." : money(i.ret) + " was returned" + share + ".");
    }
    if (i.oth > 0) {
      if (i.split.length) p.push(i.split.map(function (c) { return money(c.v) + " " + (SPLIT_TXT[c.k] || "recovered"); }).join(" and ") + ".");
      else p.push(money(i.oth) + " " + (CH_TXT[i.ch] || "recovered") + ".");
    }
    if (!p.length) p.push(i.rec === "n" && i.ev === "p" ? "No recovery recorded; the sources were only partly checked." : REC_TXT[i.rec] || REC_TXT.u);
    return p.join(" ");
  }
  function outcome(i) { return LINES[i.id] || (recLine(i) + " " + ENF_TXT[i.enf]); }
  function meta(i) { return U.dateText(i.date) + ", reported loss " + money(i.loss) + (i.chain ? ", " + i.chain : ""); }

  var FILTERS = [
    { k: "charged", label: "Arrested or charged", c: "var(--charged)", test: function (i) { return i.enf === "c"; }, desc: "in red: someone was arrested or charged for the hack." },
    { k: "returned", label: "Recorded returns", c: "var(--s1)", test: function (i) { return i.ret > 0; }, desc: "in blue: some of the money was recorded as returned." },
    { k: "frozen", label: "Other recoveries", c: "var(--s2)", test: function (i) { return i.oth > 0; }, desc: "in amber: some funds were recovered by freezes, seizures, rescues or other recorded channels." },
    { k: "dprk", label: "North Korea: government", c: "var(--s3)", test: function (i) { return i.dprk === 2; }, desc: "in purple: a government attributes the hack to North Korea." }
  ];
  FILTERS.forEach(function (f) { f.n = INC.filter(f.test).length; });
  var charged = function (i) { return i.enf === "c"; };

  // ------------------------------------------------------------ clipboard, toast
  var toastEl = $("toast"), toastT = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }
  function baseUrl() { return location.href.split("#")[0]; }
  function copy(text, msg) {
    function done() { toast(msg || "Link copied"); }
    function fallback() {
      var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-999px;top:0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function hackUrl(i) { return baseUrl() + "#hack=" + i.id; }

  // ------------------------------------------------------------ dot field
  var svg = $("dotfield"), frame = svg && svg.parentNode;
  var filter = FILTERS[0], order = "date", sel = null, showHint = false, cols = 1, pitch = 8, W = 0;
  var seq = INC.slice(), pos = [], dots = [], ring = null, readout = $("dot-read");

  function hl(i) { return filter.test(i) || charged(i); }
  function buildDots() {
    var h = "";
    INC.forEach(function (i) {
      h += '<circle class="d' + (charged(i) ? " c" : "") + (i.ret > 0 ? " r" : "") + (i.oth > 0 ? " z" : "") + (i.dprk === 2 ? " k" : "") + '" data-i="' + i.i + '" r="3"/>';
    });
    svg.innerHTML = h + '<circle class="sel" r="0" cx="-20" cy="-20"/>';
    var cs = svg.querySelectorAll("circle.d");
    dots = [].slice.call(cs);
    ring = svg.querySelector("circle.sel");
  }
  function orderSeq() {
    seq = order === "size" ? INC.slice().sort(function (a, b) { return b.loss - a.loss || a.i - b.i; }) : INC.slice();
    seq.forEach(function (x, k) { x._k2 = k; });
  }
  function layout() {
    var w = Math.floor(frame.clientWidth - 24);
    if (w < 100) return;
    W = w;
    var target = w < 500 ? 8.3 : w < 900 ? 10.5 : 14;
    cols = Math.max(10, Math.floor(w / target)); pitch = w / cols;
    var rows = Math.ceil(N / cols), H = Math.ceil(rows * pitch);
    svg.setAttribute("viewBox", "0 0 " + w + " " + H); svg.style.height = H + "px";
    seq.forEach(function (x, k) {
      var el = dots[x.i];
      el.setAttribute("cx", ((k % cols) + 0.5) * pitch); el.setAttribute("cy", (Math.floor(k / cols) + 0.5) * pitch);
    });
    restyle(); place();
  }
  function rBase() { return pitch * 0.34; }
  function rBig() { return pitch * 0.66; }
  function restyle() {
    svg.setAttribute("data-f", filter.k);
    INC.forEach(function (x) { dots[x.i].setAttribute("r", (hl(x) ? rBig() : rBase()).toFixed(2)); });
    // highlighted dots draw on top
    var g = svg, last = ring;
    INC.forEach(function (x) { if (hl(x)) g.insertBefore(dots[x.i], last); });
  }
  function place() {
    if (!sel) { ring.setAttribute("r", 0); return; }
    var el = dots[sel.i];
    ring.setAttribute("cx", el.getAttribute("cx")); ring.setAttribute("cy", el.getAttribute("cy"));
    ring.setAttribute("r", (rBig() + 3).toFixed(2));
  }
  function highlighted() { return seq.filter(hl); }

  function setKey() {
    var key = $("dots-key");
    key.innerHTML = "<b>" + FMT.int(filter.n) + "</b> of " + FMT.int(N) + " hacks, " + esc(filter.desc) + (filter.k === "charged" ? "" : " Red dots stay red: they are the arrested or charged ones.");
  }
  function buildChips() {
    var host = $("chips");
    host.innerHTML = FILTERS.map(function (f) {
      return '<button type="button" class="chip" data-f="' + f.k + '" style="--c:' + f.c + '" aria-pressed="' + (f === filter) + '"><i></i>' + esc(f.label) + " <b>" + FMT.int(f.n) + "</b></button>";
    }).join("");
    host.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      filter = FILTERS.filter(function (f) { return f.k === b.getAttribute("data-f"); })[0];
      [].forEach.call(host.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      setKey(); restyle(); place(); paintReadout();
    });
    var ord = $("order");
    ord.innerHTML = '<span id="order-l">Order:</span><button type="button" data-o="date" aria-pressed="true">By date</button><button type="button" data-o="size" aria-pressed="false">By size</button>';
    ord.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-o]"); if (!b) return;
      order = b.getAttribute("data-o");
      [].forEach.call(ord.querySelectorAll("button"), function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      orderSeq(); layout();
    });
  }

  function pickColor(i) {
    if (charged(i)) return "var(--charged)";
    if (filter.test(i)) return filter.c;
    return "var(--axis)";
  }
  var rInfo, rPrev, rNext, rCopy;
  function buildReadout() {
    readout.innerHTML = '<div class="r-info" aria-live="polite"></div><div class="r-act">' +
      '<button type="button" class="btn" data-a="prev">&lsaquo; Previous</button><button type="button" class="btn" data-a="next">Next &rsaquo;</button>' +
      '<button type="button" class="btn" data-a="copy"><span class="ic ic-link" aria-hidden="true"></span>Copy link</button></div>';
    rInfo = readout.querySelector(".r-info");
    readout.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "copy") { if (sel) { copy(hackUrl(sel)); try { history.replaceState(null, "", "#hack=" + sel.id); } catch (er) {} } else toast("Pick a dot first"); }
      else step(a === "next" ? 1 : -1);
    });
  }
  function paintReadout() {
    if (!sel) {
      readout.style.setProperty("--c", "var(--axis)");
      rInfo.innerHTML = '<p class="r-meta">Tap, hover or use the arrow keys on the dots to see a hack. Red dots led to an arrest or charge.</p>';
      return;
    }
    readout.style.setProperty("--c", pickColor(sel));
    rInfo.innerHTML = '<p class="r-name">' + esc(sel.name) + '</p><p class="r-meta">' + esc(meta(sel)) + '</p><p class="r-out">' + esc(outcome(sel)) + "</p>" +
      (showHint ? '<p class="r-hint">Tap, hover or use the arrow keys on the dots to see another hack.</p>' : "");
  }
  function select(i, opts) {
    sel = i; showHint = !!(opts && opts.hint); place(); paintReadout();
    if (opts && opts.scroll) { var r = svg.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) svg.scrollIntoView({ block: "center" }); }
  }
  function step(dir) {
    var hs = highlighted(); if (!hs.length) return;
    var k = sel ? sel._k2 : (dir > 0 ? -1 : N), nxt = null;
    if (dir > 0) { for (var a = 0; a < hs.length; a++) if (hs[a]._k2 > k) { nxt = hs[a]; break; } nxt = nxt || hs[0]; }
    else { for (var b = hs.length - 1; b >= 0; b--) if (hs[b]._k2 < k) { nxt = hs[b]; break; } nxt = nxt || hs[hs.length - 1]; }
    select(nxt);
  }
  function at(e) {
    var r = svg.getBoundingClientRect(), s = W / r.width, x = (e.clientX - r.left) * s, y = (e.clientY - r.top) * s;
    var c0 = Math.floor(x / pitch), r0 = Math.floor(y / pitch), best = null, bd = 1e9, bestH = null, bhd = 1e9;
    for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) {
      var c = c0 + dx, rr = r0 + dy; if (c < 0 || c >= cols || rr < 0) continue;
      var k = rr * cols + c; if (k >= N) continue;
      var d2 = Math.pow((c + 0.5) * pitch - x, 2) + Math.pow((rr + 0.5) * pitch - y, 2), it = seq[k];
      if (d2 < bd) { bd = d2; best = it; }
      if (hl(it) && d2 < bhd) { bhd = d2; bestH = it; }
    }
    // a highlighted dot within about 2.4 dot pitches wins over a closer plain one: the red dots are the ones people go for
    return bestH && bhd < Math.pow(pitch * 2.4, 2) ? bestH : best;
  }
  function bindField() {
    svg.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") { var it = at(e); if (it && it !== sel) select(it); } });
    svg.addEventListener("click", function (e) { var it = at(e); if (it) select(it); });
    svg.addEventListener("focus", function () { if (!sel) { var hs = highlighted(); select(hs[0] || seq[0]); } });
    svg.addEventListener("keydown", function (e) {
      if (!sel) return;
      var k = sel._k2, nk = k;
      switch (e.key) {
        case "ArrowRight": nk = k + 1; break; case "ArrowLeft": nk = k - 1; break;
        case "ArrowDown": nk = k + cols; break; case "ArrowUp": nk = k - cols; break;
        case "PageDown": nk = k + cols * 5; break; case "PageUp": nk = k - cols * 5; break;
        case "Home": nk = 0; break; case "End": nk = N - 1; break;
        case "n": case "N": step(1); e.preventDefault(); return;
        case "p": case "P": step(-1); e.preventDefault(); return;
        case "Enter": case " ": copy(hackUrl(sel)); e.preventDefault(); return;
        default: return;
      }
      e.preventDefault(); select(seq[Math.max(0, Math.min(N - 1, nk))]);
    });
  }

  function initDots() {
    if (!svg) return;
    buildChips(); buildReadout(); buildDots(); orderSeq(); setKey(); paintReadout(); bindField(); layout();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 100); });
    if (window.ResizeObserver) new ResizeObserver(function () { var w = Math.floor(frame.clientWidth - 24); if (w !== W) layout(); }).observe(frame);
    var s = $("save-hero"); if (s) s.addEventListener("click", saveHero);
  }

  // ------------------------------------------------------------ famous hacks
  function initFamous() {
    var host = $("famous-list"); if (!host) return;
    host.innerHTML = A.inc.famous.map(function (id) {
      var i = BYID[id], label = A.inc.famous_label[id] || i.name;
      return '<article class="fcard' + (charged(i) ? " is-charged" : "") + '" aria-label="' + esc(label) + '"><div class="f-top"><i class="f-dot" aria-hidden="true"></i><span>' + esc(i.date.slice(0, 4)) + "</span></div>" +
        "<h3>" + esc(label) + '</h3><div class="f-amt">' + esc(money(i.loss)) + '</div><p class="f-out">' + esc(outcome(i)) + "</p></article>";
    }).join("");
  }

  // ------------------------------------------------------------ pictures on the finding cards
  function mini(host, on, color) {
    var h = ""; for (var k = 0; k < 100; k++) h += "<i" + (k < on ? ' class="on"' : "") + "></i>";
    host.innerHTML = '<div class="mini" style="--c:' + color + '">' + h + "</div>";
  }
  function initViz() {
    var a = $("viz-arrests"), b = $("viz-bounty"), d = $("viz-dprk"), w = $("viz-wait");
    if (a) mini(a, num("E1.top100_strict"), "var(--charged)");
    if (b) mini(b, Math.round(100 * num("d.openings_table_10") / num("d.openings_table_n")), "var(--s1)");
    if (d) mini(d, Math.round(num("D1.gov.pct")), "var(--s3)");
    if (w) {
      var e3 = U.byId.E3.numeric, days = e3.e3_set.filter(function (c) { return c.in_headline_scope; }).map(function (c) { return c.days; }).sort(function (x, y) { return x - y; });
      var lo = Math.log(3), hi = Math.log(3652), med = e3.median_days_2016_plus_in_headline_scope, h = "";
      days.forEach(function (v) { h += '<i style="left:' + (100 * (Math.log(Math.max(v, 3)) - lo) / (hi - lo)).toFixed(1) + '%"></i>'; });
      h += '<i class="med" style="left:' + (100 * (Math.log(med) - lo) / (hi - lo)).toFixed(1) + '%"></i>';
      w.innerHTML = '<div class="strip-line">' + h + "</div>";
    }
  }

  // ------------------------------------------------------------ look up a hack
  var q = $("q"), resEl = $("results"), cnt = $("q-count"), card = $("hackcard"), cur = null;
  function search(text) {
    var t = norm(text); if (!t) return [];
    var toks = t.split(" ");
    return INC.filter(function (i) { return toks.every(function (k) { return i._k.indexOf(k) >= 0; }); }).sort(function (a, b) {
      var sa = a._k.indexOf(t) === 0 ? 0 : 1, sb = b._k.indexOf(t) === 0 ? 0 : 1;
      return sa - sb || b.loss - a.loss;
    });
  }
  function tags(i) {
    var t = [];
    if (charged(i)) t.push(["Arrested or charged", "var(--charged)"]);
    if (i.ret > 0) t.push([i.who === "a" ? "Attacker returned funds" : i.who === "b" ? "Bot operators returned funds" : i.who === "m" ? "MEV builder returned funds" : "Recorded return", "var(--s1)"]);
    if (i.oth > 0) t.push([i.split.length ? "Recovered by more than one channel" : CHAN_TAG[i.ch] || "Other recorded recovery", "var(--s2)"]);
    if (i.dprk === 2) t.push(["North Korea, government attribution", "var(--s3)"]);
    if (i.dprk === 1) t.push(["North Korea, firm attribution", "var(--s3)"]);
    if (i.dprk === 3) t.push(["North Korea, researcher-list lead only", "var(--s3)"]);
    return t;
  }
  function showCard(i, fromHash) {
    cur = i;
    var t = tags(i);
    card.classList.remove("empty");
    card.style.setProperty("--c", charged(i) ? "var(--charged)" : i.ret > 0 ? "var(--s1)" : i.oth > 0 ? "var(--s2)" : "var(--axis)");
    card.innerHTML = "<h3>" + esc(i.name) + '</h3><p class="h-meta">' + esc(meta(i)) + (i.alias ? ". Listed as " + esc(i.alias) + " by DeFiLlama" : "") + '</p><p class="h-out">' + esc(outcome(i)) + "</p>" + (i.ev === "p" && !LINES[i.id] ? '<p class="h-note">Recovery sources were checked in part only.</p>' : "") +
      (t.length ? '<ul class="h-tags">' + t.map(function (x) { return '<li style="--c:' + x[1] + '"><i></i>' + esc(x[0]) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="h-act"><button type="button" class="btn" data-a="copy"><span class="ic ic-link" aria-hidden="true"></span>Copy link</button><button type="button" class="btn" data-a="dot">Show its dot</button></div>';
    if (fromHash) select(i);
  }
  function emptyCard() {
    card.classList.add("empty"); card.style.setProperty("--c", "var(--axis)");
    card.innerHTML = "Pick a hack to see its recorded outcome: the reported loss, whether any money came back, and whether anyone was charged.";
  }
  function renderResults() {
    var list = search(q.value), shown = list.slice(0, 8);
    resEl.innerHTML = shown.map(function (i, k) {
      return '<li><button type="button" role="option" data-id="' + esc(i.id) + '" aria-selected="' + (cur === i) + '"><span class="rs-name">' + esc(i.name) + '</span><span class="rs-meta">' + esc(i.date.slice(0, 4) + ", " + money(i.loss)) + "</span></button></li>";
    }).join("");
    q.setAttribute("aria-expanded", shown.length ? "true" : "false");
    cnt.textContent = !q.value.trim() ? "" : !list.length ? "No hack in the dataset matches that name." : list.length > shown.length ? list.length + " matches. Showing the top " + shown.length + " matches." : list.length + (list.length === 1 ? " match." : " matches.");
    return shown;
  }
  function initLookup() {
    if (!q) return;
    emptyCard();
    q.addEventListener("input", renderResults);
    q.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var s = renderResults(); if (s[0]) { showCard(s[0]); e.preventDefault(); } }
      if (e.key === "ArrowDown") { var f = resEl.querySelector("button"); if (f) { f.focus(); e.preventDefault(); } }
    });
    resEl.addEventListener("click", function (e) { var b = e.target.closest("button[data-id]"); if (b) { showCard(BYID[b.getAttribute("data-id")]); renderResults(); } });
    resEl.addEventListener("keydown", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (e.key === "ArrowDown" && b.parentNode.nextElementSibling) { b.parentNode.nextElementSibling.querySelector("button").focus(); e.preventDefault(); }
      if (e.key === "ArrowUp") { var p = b.parentNode.previousElementSibling; (p ? p.querySelector("button") : q).focus(); e.preventDefault(); }
    });
    card.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b || !cur) return;
      if (b.getAttribute("data-a") === "copy") { copy(hackUrl(cur)); try { history.replaceState(null, "", "#hack=" + cur.id); } catch (er) {} }
      else { select(cur, { scroll: true }); $("top").scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    // test hooks
    window.ATHlookup = { search: function (t) { return search(t).map(function (i) { return { id: i.id, name: i.name, loss: i.loss, date: i.date }; }); }, outcome: function (id) { return outcome(BYID[id]); } };
  }

  // ------------------------------------------------------------ what they said
  function initSaid() {
    var host = $("said-list"); if (!host) return;
    host.innerHTML = A.inc.strip.map(function (s) {
      var qu = A.quotes.filter(function (x) { return x.rank === s.rank; })[0], i = BYID[s.id];
      if (!qu || !i) return "";
      var msg = qu.segments.map(function (t) { return esc(t.trim()); }).join('\n<span class="gap">[...]</span>\n');
      return '<figure class="sq" style="--k:' + (qu.side === "project" ? "var(--s1)" : "var(--s2)") + '"><span class="who">' + esc(qu.role_label) + ", " + esc(U.dateText(qu.time)) + "</span>" +
        "<blockquote>" + msg + "</blockquote><figcaption><b>" + esc(i.name) + "</b>, " + esc(money(i.loss)) + ". " + esc(outcome(i)) + "</figcaption></figure>";
    }).join("");
  }

  // ------------------------------------------------------------ share links
  function addAnchor(host, id, label, cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "anchor" + (cls ? " " + cls : ""); b.setAttribute("aria-label", "Copy link to " + label);
    b.innerHTML = '<span class="ic ic-link" aria-hidden="true"></span>';
    b.addEventListener("click", function () { copy(baseUrl() + "#" + id); try { history.replaceState(null, "", "#" + id); } catch (e) {} });
    host.appendChild(b); return b;
  }
  function initShare() {
    document.querySelectorAll(".chapter").forEach(function (c) {
      var k = c.querySelector(".kicker"), h = c.querySelector("h2");
      if (k && c.id) { k.style.display = "flex"; k.style.alignItems = "center"; addAnchor(k, c.id, (h ? h.textContent.trim() : "this section")); }
    });
    document.querySelectorAll(".strip").forEach(function (s) {
      var h = s.querySelector(":scope > h2"); if (!h || !s.id) return;
      var w = document.createElement("div"); w.className = "hhead"; h.parentNode.insertBefore(w, h); w.appendChild(h);
      addAnchor(w, s.id, h.textContent.trim());
    });
    document.querySelectorAll("figure.fig").forEach(function (f) {
      var t = f.querySelector(".ft"); if (f.id) addAnchor(f, f.id, t ? t.textContent.trim() : "this chart");
    });
    document.querySelectorAll(".fnd").forEach(function (f) {
      addAnchor(f, f.id, "this finding");
      var b = document.createElement("button"); b.type = "button"; b.className = "anchor img"; b.setAttribute("aria-label", "Save this finding as an image");
      b.innerHTML = '<span class="ic ic-img" aria-hidden="true"></span>'; b.addEventListener("click", function () { saveCard(f); }); f.appendChild(b);
    });
  }

  // ------------------------------------------------------------ save as image (1200 x 630, drawn on a canvas)
  function cv(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function resolveColor(v) { // "var(--x)" -> concrete colour
    var m = /^var\((--[\w-]+)\)$/.exec(v); return m ? cv(m[1]) : v;
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(" "), line = "", lines = [];
    words.forEach(function (w) { var t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    lines.forEach(function (l, k) { ctx.fillText(l, x, y + k * lh); });
    return y + lines.length * lh;
  }
  function download(c, name) {
    c.toBlob(function (b) {
      if (!b) return;
      var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000); toast("Image saved");
    }, "image/png");
  }
  function frame2(draw, name) {
    var load = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 60px "Schibsted Grotesk"'), document.fonts.load('500 24px "Schibsted Grotesk"')]) : Promise.resolve();
    load.then(function () {
      var S = 2, c = document.createElement("canvas"); c.width = 1200 * S; c.height = 630 * S;
      var ctx = c.getContext("2d"); ctx.scale(S, S);
      ctx.fillStyle = cv("--surface") || "#fff"; ctx.fillRect(0, 0, 1200, 630);
      draw(ctx);
      ctx.fillStyle = cv("--ink"); ctx.font = '700 24px "Schibsted Grotesk", sans-serif'; ctx.textAlign = "right"; ctx.fillText("After the Hack", 1100, 592); ctx.textAlign = "left";
      download(c, name);
    });
  }
  function saveHero() {
    frame2(function (ctx) {
      var ink = cv("--ink"), muted = cv("--muted"), x0 = 100, w = 1000;
      ctx.fillStyle = ink; ctx.font = '800 54px "Schibsted Grotesk", sans-serif';
      var head = FMT.int(N) + " hacks, " + FMT.B1(num("S1.total_usd")) + " in reported losses. Only " + FMT.int(num("E2.master_all.0")) + " are known to have led to an arrest or charge.";
      var y = wrapText(ctx, head, x0, 110, w, 62);
      var top = y + 14, cols2 = 66, p = w / cols2, rows = Math.ceil(N / cols2);
      INC.forEach(function (it, k) {
        var h = hl(it), c = charged(it) ? cv("--charged") : filter.test(it) ? resolveColor(filter.c) : cv("--dot");
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x0 + ((k % cols2) + 0.5) * p, top + (Math.floor(k / cols2) + 0.5) * p, h ? p * 0.46 : p * 0.32, 0, 7); ctx.fill();
      });
      ctx.fillStyle = muted; ctx.font = '500 20px "Schibsted Grotesk", sans-serif';
      ctx.fillText("Each dot is one hack. " + filter.label + ": " + FMT.int(filter.n) + ". Red dots stay red. Losses are tracker-reported USD.", x0, top + rows * p + 36);
    }, "after-the-hack-dots.png");
  }
  function saveCard(f) {
    var big = f.querySelector(".fnd-big"), txt = f.querySelector(".fnd-txt"), ft = f.querySelector(".fnd-foot");
    // the footer caveat travels with the picture; the link text "Definition" is dropped
    var foot = ft ? ft.textContent.replace(/\s+/g, " ").replace(/\s*Definition\s*$/, "").trim() : "";
    var key = f.querySelector(".ledger-key");
    var keyTxt = key ? [].map.call(key.children, function (c) { return c.textContent.replace(/\s+/g, " ").trim(); }).join("  |  ") : "";
    frame2(function (ctx) {
      ctx.fillStyle = cv("--ink"); ctx.font = '800 150px "Schibsted Grotesk", sans-serif'; ctx.fillText(big.textContent.trim(), 100, 230);
      ctx.fillStyle = cv("--ink-2"); ctx.font = '500 38px "Schibsted Grotesk", sans-serif';
      var y = wrapText(ctx, txt.textContent.replace(/\s+/g, " ").trim(), 100, 310, 1000, 50);
      ctx.fillStyle = cv("--muted"); ctx.font = '500 24px "Schibsted Grotesk", sans-serif';
      if (keyTxt) y = wrapText(ctx, keyTxt, 100, y + 10, 1000, 32);
      if (foot) wrapText(ctx, foot, 100, y + 18, 1000, 32);
    }, "after-the-hack-" + f.id + ".png");
  }

  // ------------------------------------------------------------ navigation, hash targets, disclosures
  function openParents(el) { for (var p = el; p; p = p.parentElement) if (p.tagName === "DETAILS" && !p.open) p.open = true; }
  function reveal() {
    var h = decodeURIComponent(location.hash || "");
    if (!h || h === "#") return;
    var m = /^#hack=(.+)$/.exec(h);
    if (m) { var i = BYID[m[1]]; if (i) { showCard(i, true); q.value = i.name; renderResults(); setTimeout(function () { $("lookup").scrollIntoView(); }, 30); } return; }
    var el = document.getElementById(h.slice(1));
    if (el && !/^#def-/.test(h)) { openParents(el); setTimeout(function () { el.scrollIntoView(); }, 30); }
  }
  function initNav() {
    var j = $("jump");
    if (j) j.addEventListener("change", function () { if (j.value) { location.hash = j.value; j.value = ""; } });
    window.addEventListener("hashchange", reveal);
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-open], a.fn");
      if (!a) return;
      var t = document.getElementById((a.getAttribute("data-open") || a.getAttribute("href").slice(1)));
      if (t) openParents(t);
    });
    document.addEventListener("toggle", function (e) { if (e.target.tagName === "DETAILS" && e.target.open && window.ATHcharts) window.ATHcharts.render(false); }, true);
  }

  initDots(); initFamous(); initViz(); initLookup(); initSaid(); initShare(); initNav();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (svg) layout(); });
  reveal();
  if (!/^#hack=/.test(decodeURIComponent(location.hash || "")) && !sel) {
    // first load: start on the largest headline hack so the readout and a highlighted dot are visible straight away
    select(INC.reduce(function (a, b) { return b.loss > a.loss ? b : a; }), { hint: true });
  }
  window.ATHhero = { select: function (id) { var i = BYID[id]; if (i) select(i); }, count: function () { return { n: N, filters: FILTERS.map(function (f) { return [f.k, f.n]; }) }; } };
})();
