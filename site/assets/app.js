/* After the Hack: number filling, definitions, theme, negotiation thread, cases, methods.
   All figures come from window.ATH (data/bundle.js, built by build.py from the project data). */
(function () {
  "use strict";
  var A = window.ATH;
  if (!A) { document.body.insertAdjacentHTML("afterbegin", '<p style="padding:16px;font-family:sans-serif">The data bundle (data/bundle.js) did not load. Run build.py, then reload.</p>'); return; }

  var byId = {};
  A.canon.numbers.forEach(function (n) { byId[n.id] = n; });
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fixed(v, d) { return Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function dateText(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1] : iso; }

  var FMT = {
    int: function (v) { return Math.round(v).toLocaleString("en-US"); },
    d0: function (v) { return fixed(v, 0); },
    d1: function (v) { return fixed(v, 1); },
    p0: function (v) { return fixed(v, 0) + "%"; },
    p1: function (v) { return fixed(v, 1) + "%"; },
    p2: function (v) { return fixed(v, 2) + "%"; },
    fp0: function (v) { return fixed(v * 100, 0) + "%"; },
    fp1: function (v) { return fixed(v * 100, 1) + "%"; },
    B1: function (v) { return "$" + fixed(v / 1e9, 1) + "B"; },
    B2: function (v) { return "$" + fixed(v / 1e9, 2) + "B"; },
    M0: function (v) { return "$" + fixed(v / 1e6, 0) + "M"; },
    M1: function (v) { return "$" + fixed(v / 1e6, 1) + "M"; },
    M2: function (v) { return "$" + fixed(v / 1e6, 2) + "M"; },
    usd: function (v) { return "$" + Math.round(v).toLocaleString("en-US"); },
    "in": function (v) { return "1 in " + Math.round(1 / v); },
    mo0: function (v) { return fixed(v / 30.4375, 0); },
    mo1: function (v) { return fixed(v / 30.4375, 1); },
    date: function (v) { return dateText(v); },
    x: function (v) { return String(v); }
  };
  function money(v) { return v >= 1e9 ? FMT.B2(v) : v >= 1e8 ? FMT.M0(v) : v >= 1e6 ? FMT.M1(v) : FMT.usd(v); }

  function periodText() {
    var p = A.canon.data_snapshot.period.split("..");
    return dateText(p[0]) + " to " + dateText(p[1]);
  }

  // Resolve "C1.pct", "C3.channels.0.usd", "d.key", "f.key", "meta.period".
  function resolve(key) {
    var parts = key.split(".");
    var head = parts[0];
    if (head === "meta") {
      if (parts[1] === "period") return { v: periodText(), src: { kind: "meta" } };
      if (parts[1] === "generated") return { v: A.canon.generated, src: { kind: "meta" } };
    }
    if (head === "d") { var d = A.derived[parts[1]]; return d ? { v: d.v, src: { kind: "derived", d: d } } : null; }
    if (head === "f") { var f = A.facts[parts[1]]; return f ? { v: f.v, src: { kind: "canon", id: f.id } } : null; }
    var n = byId[head];
    if (!n) return null;
    // numeric keys may contain dots-free names with spaces or slashes; walk greedily
    var cur = n.numeric, i = 1;
    while (i < parts.length && cur != null) {
      var k = parts[i], j = i;
      while (!(k in Object(cur)) && j + 1 < parts.length) { j++; k += "." + parts[j]; }
      cur = cur[k]; i = j + 1;
    }
    return cur == null ? null : { v: cur, src: { kind: "canon", id: head } };
  }

  var missing = [];
  function fill(root) {
    (root || document).querySelectorAll("[data-n]").forEach(function (el) {
      var spec = el.getAttribute("data-n").split("|");
      var r = resolve(spec[0]);
      if (!r) { missing.push(spec[0]); el.textContent = "?"; return; }
      var f = FMT[spec[1] || "x"] || FMT.x;
      el.textContent = f(r.v);
      if (r.src.kind !== "meta") {
        el.classList.add("n");
        if (el.hasAttribute("data-flat")) el.classList.add("flat");
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        el.setAttribute("aria-haspopup", "dialog");
        el.setAttribute("aria-expanded", "false");
        el.__src = r.src;
      }
    });
  }
  window.ATHfmt = { FMT: FMT, money: money, esc: esc, dateText: dateText, resolve: resolve, byId: byId, srcItem: srcItem };

  // ------------------------------------------------------------ definition popover
  var pop = document.getElementById("pop");
  var popFor = null, hideTimer = null;
  // A source string is either "URL" or "URL (annotation)" or plain text (e.g. "project brief (not published): research/x.md").
  // Only the first whitespace-delimited token is ever a link, and only when it starts with http(s)://; the rest is text.
  var REPO = "https://github.com/DicksonWu654/after-the-hack/blob/main/";
  function srcItem(s) {
    s = String(s == null ? "" : s).trim();
    var rp = /^(data\/[A-Za-z0-9_.\/-]+?\.(?:csv|json|md))([,;.]*)(?:\s+([\s\S]*))?$/.exec(s);
    if (rp) return '<a href="' + REPO + esc(rp[1]) + '" rel="noopener" target="_blank">' + esc(rp[1]) + "</a>" + esc(rp[2] || "") + (rp[3] ? " " + esc(rp[3]) : "");
    var m = /^(https?:\/\/\S+)(?:\s+([\s\S]*))?$/.exec(s);
    if (!m) return esc(s);
    var url = m[1], note = m[2] || "", tail = /[,;.]+$/.exec(url);
    if (tail) { url = url.slice(0, url.length - tail[0].length); note = (tail[0] + (note ? " " + note : "")).replace(/^[,;.]+\s*$/, ""); }
    var label = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (label.length > 70) label = label.slice(0, 69) + "\u2026";
    return '<a href="' + esc(url) + '" rel="noopener" target="_blank">' + esc(label) + "</a>" + (note ? " " + esc(note) : "");
  }
  function popHTML(src) {
    if (src.kind === "derived") {
      return '<p class="q" id="pop-q">How this number is derived</p><p class="d">' + esc(src.d.def) + '</p><p class="meta">Source: ' + src.d.src.map(srcItem).join("; ") + "</p>";
    }
    var n = byId[src.id];
    var def = n.definition.length > 520 ? n.definition.slice(0, 500).replace(/\s\S*$/, "") + "..." : n.definition;
    return '<p class="q" id="pop-q">' + esc(n.question) + '</p><p class="d">' + esc(def) + "</p>" +
      '<p class="meta"><span class="conf">' + esc(n.confidence) + ' confidence</span><a href="#def-' + n.id + '">Full definition (' + n.id + ")</a></p>" +
      '<p class="meta">Sources: ' + n.sources.slice(0, 3).map(srcItem).join("; ") + (n.sources.length > 3 ? "; and more" : "") + "</p>";
  }
  function place(el) {
    var r = el.getBoundingClientRect();
    pop.hidden = false;
    var pw = pop.offsetWidth, ph = pop.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), vw - pw - 8);
    var top = r.bottom + 8;
    if (top + ph > window.innerHeight - 8 && r.top - ph - 8 > 56) top = r.top - ph - 8;
    pop.style.left = (left + window.scrollX) + "px";
    pop.style.top = (top + window.scrollY) + "px";
  }
  function show(el) {
    clearTimeout(hideTimer);
    if (popFor && popFor !== el) popFor.setAttribute("aria-expanded", "false");
    popFor = el;
    pop.innerHTML = popHTML(el.__src);
    pop.id = "pop";
    el.setAttribute("aria-controls", "pop");
    el.setAttribute("aria-expanded", "true");
    place(el);
  }
  function hideNow() {
    pop.hidden = true;
    if (popFor) { popFor.setAttribute("aria-expanded", "false"); popFor.removeAttribute("aria-controls"); }
    popFor = null;
  }
  function hide(now) {
    clearTimeout(hideTimer);
    if (now) hideNow(); else hideTimer = setTimeout(hideNow, 180);
  }
  // Input modality: touch must not rely on hover or focus (a tap fires emulated mouseover, focus and click in turn),
  // so on touch the popover opens and closes on click only. Keyboard focus shows it; Enter/Space moves focus inside.
  var lastInput = "mouse";
  document.addEventListener("pointerdown", function (e) { lastInput = e.pointerType === "touch" ? "touch" : "mouse"; }, true);
  document.addEventListener("keydown", function (e) { if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") lastInput = "keyboard"; }, true);
  function isNum(t) { var el = t && t.closest && t.closest(".n"); return el && el.__src ? el : null; }
  document.addEventListener("mouseover", function (e) {
    if (lastInput === "touch") return;
    var el = isNum(e.target);
    if (el) show(el);
    else if (e.target.closest && e.target.closest("#pop")) clearTimeout(hideTimer);
  });
  document.addEventListener("mouseout", function (e) {
    if (lastInput === "touch") return;
    var el = e.target.closest && (e.target.closest(".n") || e.target.closest("#pop"));
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget)) && !pop.contains(document.activeElement)) hide();
  });
  var quiet = false; // set while focus returns to a number after Escape
  document.addEventListener("focusin", function (e) { var el = isNum(e.target); if (el && !quiet && lastInput === "keyboard") show(el); });
  document.addEventListener("focusout", function (e) {
    if (lastInput === "touch" || pop.hidden) return;
    var to = e.relatedTarget;
    if (pop.contains(e.target)) { if (!(to && (pop.contains(to) || to === popFor))) hide(true); return; }
    if (isNum(e.target) && !(to && pop.contains(to)) && !pop.matches(":hover")) hide();
  });
  document.addEventListener("click", function (e) {
    var el = isNum(e.target);
    if (el) {
      if (popFor === el && !pop.hidden && lastInput !== "keyboard") hide(true);
      else { show(el); if (lastInput === "keyboard") pop.focus({ preventScroll: true }); }
      return;
    }
    if (!(e.target.closest && e.target.closest("#pop"))) hide(true);
  });
  function closeAndReturn() {
    var f = popFor; hide(true);
    if (f) { quiet = true; f.focus({ preventScroll: true }); quiet = false; }
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); closeAndReturn(); return; }
    var num = isNum(e.target);
    if (num && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); show(num);
      pop.focus({ preventScroll: true }); // links inside are now reachable with Tab
      return;
    }
    if (num && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { // roving focus between numbers in the same paragraph
      var sib = num.__sibs, i = sib ? sib.indexOf(num) : -1, nx = i < 0 ? null : sib[i + (e.key === "ArrowRight" ? 1 : -1)];
      if (nx) { e.preventDefault(); nx.focus(); }
      return;
    }
    if (e.key === "Tab" && pop.contains(e.target)) { // keep the tab order sane: leaving the dialog returns to its number
      var links = pop.querySelectorAll("a[href]"), first = links[0], last = links[links.length - 1];
      var atStart = e.target === pop || e.target === first, atEnd = !links.length || e.target === last;
      if (e.shiftKey ? atStart : atEnd) { e.preventDefault(); closeAndReturn(); }
    }
  });
  window.addEventListener("scroll", function () { if (popFor && !pop.hidden) place(popFor); }, { passive: true });

  // ------------------------------------------------------------ theme
  var btn = document.getElementById("theme-btn");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function current() { return document.documentElement.getAttribute("data-theme") || (mq.matches ? "dark" : "light"); }
  function label() { btn.setAttribute("aria-pressed", current() === "dark" ? "true" : "false"); }
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("ath-theme", next); } catch (e) {}
    label();
  });
  if (mq.addEventListener) mq.addEventListener("change", label);
  label();

  // ------------------------------------------------------------ hero ledger bar
  (function () {
    var bar = document.getElementById("ledger-bar");
    var total = byId.S1.numeric.total_usd;
    var parts = [[byId.R2.numeric.voluntary_usd, "var(--s1)"], [byId.C4.numeric.master_usd, "var(--s2)"], [A.derived.unrecovered_usd.v, "var(--lost)"]];
    if (!bar) return;
    bar.innerHTML = parts.map(function (p) { return '<span style="flex:' + (p[0] / total) + ' 1 0; background:' + p[1] + '"></span>'; }).join("");
  })();

  // ------------------------------------------------------------ negotiation thread
  (function () {
    var host = document.getElementById("thread");
    var CHAIN = { ethereum: "Ethereum", optimism: "Optimism", bitcoin: "Bitcoin", arbitrum: "Arbitrum", polygon: "Polygon" };
    function explorer(link) {
      if (/optimistic\.etherscan/.test(link)) return "Optimism Etherscan";
      if (/etherscan\.io/.test(link)) return "Etherscan";
      if (/mempool\.space/.test(link)) return "mempool.space";
      return "explorer";
    }
    // The context starts with a short "Case (date, amount)." label; the one-line note is the sentence after it.
    function firstSentence(t) {
      var parts = String(t || "").replace(/([.!?])\s+(?=[A-Z0-9'"])/g, "$1\u0001").split("\u0001");
      return (parts.length > 1 && parts[0].length < 70 ? parts[1] : parts[0]).trim();
    }
    function short(h) { return h.length > 16 ? h.slice(0, 8) + "…" + h.slice(-6) : h; }
    function when(iso) { var t = iso.slice(11, 16); return dateText(iso) + ", " + t + " UTC"; }
    function gap(a, b) {
      var s = (Date.parse(b) - Date.parse(a)) / 1000;
      var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.round((s % 3600) / 60);
      if (d) return d + (d === 1 ? " day " : " days ") + h + (h === 1 ? " hour" : " hours") + " later";
      if (h) return h + (h === 1 ? " hour " : " hours ") + m + " minutes later";
      return m + " minutes later";
    }
    var groups = {}, order = [];
    A.quotes.forEach(function (q) {
      if (!groups[q.case]) { groups[q.case] = []; order.push(q.case); }
      groups[q.case].push(q);
    });
    order.sort(function (a, b) {
      return Math.min.apply(null, groups[a].map(function (q) { return q.rank; })) - Math.min.apply(null, groups[b].map(function (q) { return q.rank; }));
    });
    host.innerHTML = order.map(function (c) {
      var qs = groups[c].slice().sort(function (a, b) { return a.time < b.time ? -1 : 1; });
      return '<section class="case" aria-label="' + esc(c) + '"><h3 class="case-name">' + esc(c) + "</h3>" + qs.map(function (q, i) {
        var msg = q.segments.map(function (s) { return esc(s.trim()); }).join('<span class="gap">[…]</span>');
        var hexText = q.chain === "bitcoin" ? "OP_RETURN " + q.hex : "0x" + q.hex;
        var html = (i ? '<p class="tx-gap">' + gap(qs[i - 1].time, q.time) + "</p>" : "") +
          '<article class="tx ' + q.side + '" aria-label="' + esc(q.role_label + ", " + c + ", " + dateText(q.time)) + '">' +
          '<div class="tx-top"><span class="who">' + esc(q.role_label) + "</span><span>" + esc(when(q.time)) + "</span></div>" +
          '<div class="tx-hex" aria-hidden="true">' + esc(hexText) + "</div>" +
          '<blockquote class="tx-msg">' + msg + "</blockquote>" +
          '<p class="tx-ctx">' + esc(firstSentence(q.context)) + "</p>" +
          '<div class="tx-meta"><span>' + esc(CHAIN[q.chain] || q.chain) + "</span><span>Block " + Number(q.block).toLocaleString("en-US") + "</span>" +
          '<span>' + (q.complete ? "Full decoded message" : "Excerpts of the decoded message") + "</span>" +
          '<a href="' + esc(q.link) + '" rel="noopener" target="_blank" aria-label="View transaction on ' + explorer(q.link) + '">' + esc(short(q.hash)) + "</a></div>" +
          "<details><summary>Context and checks</summary>" + (firstSentence(q.context) !== q.context ? "<p><b>Context:</b> " + esc(q.context) + "</p>" : "") + "<p><b>Text:</b> " + esc(q.text_match_note) + "</p><p><b>Sender:</b> " + esc(q.role_evidence) + "</p></details>" +
          "</article>";
        return html;
      }).join("") + "</section>";
    }).join("");
  })();

  // ------------------------------------------------------------ recent cases
  document.querySelectorAll("#cases-list li[data-case]").forEach(function (li) {
    var id = li.getAttribute("data-case");
    var meta = A.charts.cases.filter(function (c) { return c.id === id; })[0];
    var n = byId[id].numeric;
    li.querySelector(".when").textContent = meta ? meta.label : "";
    var loss = li.querySelector(".loss");
    loss.textContent = money(n.loss_usd);
    loss.setAttribute("data-n", id + ".loss_usd|x");
    var back = li.querySelector(".back");
    var r = resolve(back.getAttribute("data-back"));
    var kind = back.getAttribute("data-kind");
    var pct = r ? r.v : 0;
    if (back.getAttribute("data-of") && r) pct = 100 * r.v / resolve(back.getAttribute("data-of")).v;
    if (kind === "returned-inverse") pct = 100 - pct;
    var words = kind === "frozen" ? " frozen or recovered" : kind === "zero" ? " recovered" : " returned by the attacker";
    var unit = back.getAttribute("data-unit");
    // a missing or zero figure is shown as "No recovery recorded", never as a drawn 0% bar
    if (kind === "zero" && r && r.v > 0) pct = 100 * r.v / n.loss_usd;
    if (!r || (kind === "zero" && !(r.v > 0)) || (kind !== "returned-inverse" && pct === 0)) {
      back.innerHTML = '<span class="back-none">' + (r ? "No recovery recorded" : "Figure not available") + "</span>";
      return;
    }
    var txt = (pct < 1 ? fixed(pct, 2) : fixed(pct, 1)) + "%";
    back.innerHTML = '<div class="track" role="img" aria-label="' + txt + words + '"><span class="fill' + (kind === "frozen" ? " frozen" : "") + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></div><span>' + txt + words + (unit ? " (" + esc(unit) + ")" : "") + "</span>";
  });
  // the loss spans become plain numbers with a definition (formatted above)
  document.querySelectorAll("#cases-list .loss").forEach(function (el) {
    var id = el.closest("li").getAttribute("data-case");
    el.removeAttribute("data-n");
    el.classList.add("n"); el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); el.setAttribute("aria-expanded", "false");
    el.__src = { kind: "canon", id: id };
  });

  // ------------------------------------------------------------ code-is-law scoreboard
  document.querySelector("#defences tbody").innerHTML = A.charts.defences.map(function (d) {
    return "<tr><td>" + esc(d.case) + "</td><td>" + esc(d.defence) + "</td><td>" + esc(d.result) + "</td></tr>";
  }).join("");

  // ------------------------------------------------------------ downloads, definitions, sources
  document.querySelector("#downloads tbody").innerHTML = A.downloads.map(function (d) {
    var kb = d.bytes > 1e6 ? fixed(d.bytes / 1e6, 1) + " MB" : Math.max(1, Math.round(d.bytes / 1e3)) + " KB";
    return '<tr><td><a href="' + esc(d.file) + '" download>' + esc(d.file.replace("data/", "")) + "</a></td><td>" + esc(d.desc) + '</td><td class="r">' + kb + "</td></tr>";
  }).join("");

  document.getElementById("defs").innerHTML = A.canon.numbers.map(function (n) {
    var alts = (n.alt_figures || []).map(function (a) { return "<li>" + esc(a.figure) + ": " + esc(a.why) + "</li>"; }).join("");
    return '<details id="def-' + n.id + '"><summary><span class="id">' + n.id + "</span><span>" + esc(n.question) + '</span></summary><div class="dbody">' +
      "<p><b>Canonical value.</b> " + esc(n.canonical_value) + "</p><p><b>Definition.</b> " + esc(n.definition) + "</p>" +
      "<p><b>Confidence: " + esc(n.confidence) + ".</b> " + esc(n.confidence_reason || "") + "</p>" +
      "<p><b>Sources</b></p><ul>" + n.sources.map(function (s) { return "<li>" + srcItem(s) + "</li>"; }).join("") + "</ul>" +
      (alts ? "<p><b>Other published figures and why they differ</b></p><ul>" + alts + "</ul>" : "") + "</div></details>";
  }).join("") + (A.canon.reconciliations || []).map(function (r, i) {
    return '<details id="rec-' + i + '"><summary><span class="id">R' + (i + 1) + "</span><span>Reconciliation: " + esc(r.topic) + '</span></summary><div class="dbody"><p>' + esc(r.explanation) + "</p></div></details>";
  }).join("");

  function openDef() {
    var h = location.hash;
    if (!/^#def-/.test(h)) return;
    var d = document.getElementById(h.slice(1));
    if (d) { d.open = true; d.classList.add("flash"); setTimeout(function () { d.classList.remove("flash"); }, 1600); }
  }
  window.addEventListener("hashchange", openDef);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#def-"]');
    if (a) { var d = document.getElementById(a.getAttribute("href").slice(1)); if (d) d.open = true; hide(true); }
  });

  var urls = [], seen = {};
  A.canon.numbers.forEach(function (n) {
    n.sources.concat((n.alt_figures || []).map(function (a) { return a.source; })).forEach(function (s) {
      (String(s).match(/https?:\/\/[^\s,;)]+/g) || []).forEach(function (u) { if (!seen[u]) { seen[u] = 1; urls.push(u); } });
    });
  });
  // Only external URLs are listed. Some definitions also cite project notes that are not published; those stay plain text inside the definitions.
  document.getElementById("sources").innerHTML = urls.map(function (u) { return "<li>" + srcItem(u) + "</li>"; }).join("");

  // ------------------------------------------------------------ attack anatomy (data/attack.json, embedded in the bundle)
  (function () {
    var sec = document.getElementById("attack-anatomy");
    var a = A.attack, host = document.getElementById("ai-panel");
    if (!sec) return;
    if (!a || !a.ai || !host) { sec.hidden = true; return; }
    var ai = a.ai;
    function host_(u) { var t = String(u).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); return t.length > 44 ? t.slice(0, 42) + "..." : t; }
    function item(c, withGrade) {
      return '<div class="ai-item"><h5>' + esc(c.title) + "</h5>" + (c.when ? '<p class="when">' + esc(c.when) + (withGrade && c.grade ? ", " + esc(c.grade) : "") + "</p>" : "") +
        "<p>" + esc(c.body) + "</p>" + (c.url ? '<p class="src">Source: <a href="' + esc(c.url) + '" rel="noopener" target="_blank">' + esc(host_(c.url)) + "</a>" +
        (c.id ? ", checked in <a href=\"#def-" + c.id + '">' + c.id + "</a>" : "") + "</p>" : "") + "</div>";
    }
    var g = ai.grades, total = ai.claims_n;
    var parts = [["verified", g.verified, "var(--s1)", "verified"], ["credible claim", g["credible claim"], "var(--s2)", "credible claim"], ["speculation", g.speculation, "var(--lost)", "speculation"]];
    host.innerHTML =
      '<div class="ai-verdict"><div class="zero" aria-hidden="true">' + ai.verified_exploits + '</div>' +
      '<p class="claim"><span class="sr-only">' + ai.verified_exploits + " </span>verified AI-written or AI-found exploits in a real hack</p>" +
      '<div class="grades"><div class="grade-bar" role="img" aria-label="Of ' + total + " AI-related claims logged: " + parts.map(function (p) { return p[1] + " " + p[3]; }).join(", ") + '">' +
      parts.map(function (p) { return '<span style="flex:' + p[1] + ' 1 0; background:' + p[2] + '"></span>'; }).join("") + "</div>" +
      '<ul class="grade-key">' + parts.map(function (p) { return '<li><i style="--c:' + p[2] + '"></i>' + esc(p[0]) + ": " + p[1] + " of " + total + " claims</li>"; }).join("") + "</ul>" +
      '<p class="grade-note">Verified means a primary source was read and supports the claim as worded. Most verified items are lab results, tooling in malware, social engineering or defence. Speculation is listed below, separate from the findings.</p></div></div>' +
      '<div class="ai-col" style="--k: var(--s1)"><h4>What AI can do, in simulation</h4><p class="sub">Simulation results on known vulnerabilities, as reported by the vendors and labs that ran them.</p>' +
      ai.capability.map(function (c) { return item(c, false); }).join("") + "</div>" +
      '<div class="ai-col" style="--k: var(--s2)"><h4>What attackers are documented doing with AI</h4><p class="sub">Vendor reports of AI-assisted lures, job fraud and malware tooling, described at the campaign level.</p>' +
      ai.attacker_use.map(function (c) { return item(c, false); }).join("") + "</div>" +
      '<div class="ai-skip"><h4>Unconfirmed claims we reviewed</h4><p class="sub">Opinion and unsourced commentary about AI and hacking.</p><div class="list">' +
      ai.not_counted.map(function (c) { return item({ title: c.title, body: c.body, url: c.url }, false); }).join("") + "</div></div>";
    sec.hidden = false;
  })();

  // note under the top-100 grid: master losses that differ from the figures used in the text
  (function () {
    var host = document.getElementById("top100-note");
    if (!host) return;
    var diff = A.charts.top100.filter(function (d) { return d.text_loss; });
    host.textContent = diff.length ? "Table losses are the master dataset's; in the text " + diff.map(function (d) { return d.name.replace(/ Trade$/, "") + " is " + money(d.text_loss) + " (here " + money(d.loss) + ")"; }).join(", ") + "." : "";
  })();

  fill(document);

  // M3: hide a clause whose figure is zero ("were never searched" when nothing was left unsearched)
  document.querySelectorAll("[data-nz]").forEach(function (el) {
    var r = resolve(el.getAttribute("data-nz"));
    if (r && Number(r.v) === 0) el.hidden = true;
  });

  // One tab stop per paragraph/figure caption/table cell: the first number in each block is tabbable, ArrowLeft/ArrowRight move
  // between the others. Mouse and touch still reach every number.
  (function () {
    var blocks = [];
    document.querySelectorAll(".n[tabindex]").forEach(function (el) {
      var blk = el.closest("p,li,figcaption,td,th,h1,h2,h3,h4,h5,dt,dd,.clock,.chapter-head") || el.parentElement;
      if (!blk.__ns) { blk.__ns = []; blocks.push(blk); }
      blk.__ns.push(el);
    });
    blocks.forEach(function (blk) {
      blk.__ns.forEach(function (el, i) { el.__sibs = blk.__ns; el.setAttribute("tabindex", i ? "-1" : "0"); if (!i) el.classList.add("n-first"); });
    });
    window.ATHtabstops = blocks.length;
  })();
  if (missing.length && window.console) console.warn("Unresolved data keys:", missing);
  window.ATHmissing = missing;
  if (location.hash) openDef();
})();
