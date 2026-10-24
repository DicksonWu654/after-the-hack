/* After the Hack: page logic. Every number comes from window.ATH (data/bundle.js). */
(function () {
  "use strict";
  const A = window.ATH;
  if (!A) { console.error("data/bundle.js did not load"); return; }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, attrs, html) => {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* One-time builds as blocks scroll into view. The final state is the default: the "pre" class that hides
     marks is only added when JS, IntersectionObserver and motion are all available. */
  const builds = !reduceMotion && "IntersectionObserver" in window;
  function onView(node) {
    if (!node || !builds) return;
    node.classList.add("pre");
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      node.classList.add("go");
      node.classList.remove("pre");
    }, { threshold: 0, rootMargin: "0px 0px -18% 0px" });
    io.observe(node);
  }

  /* ---------------------------------------------------------------- data access */
  const canon = {};
  A.canon.numbers.forEach((n) => { canon[n.id] = n; });
  const N = (id) => canon[id].numeric;
  const D = (k) => A.derived[k].v;
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return `${d} ${MON[m - 1]} ${y}`; };
  const period = A.built_from.snapshot.period.split("..");

  const I = A.inc;
  const rows = I.rows.map((a, i) => {
    const m = /(\d{4})(\d{2})(\d{2})/.exec(a[0]);
    const date = a[11] || (m ? `${m[1]}-${m[2]}-${m[3]}` : "");
    const r = {
      i, id: a[0], name: a[1], loss: a[2] || 0, chain: (I.chains[a[3]] || "").split(";").filter(Boolean).join(", "),
      enf: a[4], rec: a[5], ret: a[6] || 0, oth: a[7] || 0, ch: a[8] || "", dprk: a[9] || 0, alias: a[10] || "",
      date, who: a[12] || "", ev: a[13] || "", split: a[14] || "",
    };
    r.unver = (r.ret > 0 || r.oth > 0) && (r.ev === "x" || "cunvq".includes(r.rec));
    r.label = I.famous_label[r.id] || r.name;
    return r;
  });
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const maxLoss = Math.max(...rows.map((r) => r.loss));

  /* ---------------------------------------------------------------- formatting */
  const int = (v) => Math.round(v).toLocaleString("en-US");
  function money(v) {
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (v >= 1e8) return "$" + Math.round(v / 1e6) + "M";
    if (v >= 1e7) return "$" + (v / 1e6).toFixed(1) + "M";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    return "$" + int(v);
  }
  const pctTxt = (v) => (Number.isInteger(v) ? String(v) : String(+(+v).toFixed(1))) + "%";
  function fmt(v, f) {
    if (v === undefined || v === null || v === "") return "";
    switch (f) {
      case "int": return int(v);
      case "B1": return "$" + (v / 1e9).toFixed(1) + "B";
      case "B2": return "$" + (v / 1e9).toFixed(2) + "B";
      case "usd": return money(v);
      case "p": return v + "%";
      case "p0": return Math.round(v) + "%";
      case "p1": return (+v).toFixed(1) + "%";
      case "n": return String(v);
      case "mo0": return String(Math.round(v / 30.4375));
      case "mo1": return (v / 30.4375).toFixed(1);
      default: return String(v);
    }
  }

  /* values computed in the page (documented in new-copy-manifest.md) */
  const X = {
    since: period[0].slice(0, 4),
    asof: fmtDate(period[1]),
    period: `${fmtDate(period[0])} to ${fmtDate(period[1])}`,
    last_year: period[1].slice(0, 4),
  };
  const arrestsBy = Object.fromEntries(A.charts.arrests.map((a) => [a.name, a]));
  /* C1 still counts recovery amounts the lookup marks "reported, not verified"; say so while the bundle shows a gap */
  {
    const C1 = canon.C1.numeric, nU = rows.filter((r) => r.unver).length;
    const gap = typeof C1.pct_ex_unverified === "number" && Math.abs(C1.pct - C1.pct_ex_unverified) >= 0.05;
    X.unver_note = nU && gap
      ? (nU === 1 ? "One recovery amount in these totals is reported but not verified. Without it, the recovered share is "
                  : `${nU} recovery amounts in these totals are reported but not verified. Without them, the recovered share is `) + (+C1.pct_ex_unverified).toFixed(1) + "%."
      : "";
  }
  X.fast_cases = ["Platypus Finance", "Mango Markets"].map((n) => `${n} (${arrestsBy[n].days} days)`).join(" and ");

  function get(key) {
    const parts = key.split(".");
    const h = parts.shift();
    let v;
    if (h === "d") v = A.derived[parts.shift()]?.v;
    else if (h === "f") v = A.facts[parts.shift()]?.v;
    else if (h === "x") v = X[parts.shift()];
    else v = canon[h] && canon[h].numeric;
    for (const p of parts) { if (v === undefined || v === null) break; v = v[p]; }
    return v;
  }
  function fill(root) {
    $$("[data-k]", root).forEach((e) => {
      const k = e.getAttribute("data-k");
      if (k.startsWith("x.sel_")) return;
      const v = get(k);
      if (v === undefined || v === null) { console.warn("missing value", k); return; }
      e.textContent = fmt(v, e.getAttribute("data-f"));
    });
  }

  /* ---------------------------------------------------------------- outcome sentences (new-copy-manifest rules) */
  const CH = { f: "frozen", s: "seized or recovered by court order", w: "rescued", h: "frozen by the chain", k: "recovered by a fork or rollback", o: "recovered" };
  const CHS = { f: "frozen by an issuer, exchange or protocol", s: "seized or recovered by court order", w: "rescued", h: "frozen by the chain", k: "recovered by a fork or rollback", o: "recovered", r: "returned" };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function ofLoss(a, loss) {
    if (!loss) return "";
    const p = (a / loss) * 100;
    if (!(p >= 0.1 && p <= 99.5)) return "";
    return ` (${p >= 10 ? Math.round(p) : p.toFixed(1)}% of the loss)`;
  }
  function recLine(r) {
    if (r.unver) return `A recovery of about ${money(r.ret + r.oth)} is reported but not verified.`;
    const out = [];
    if (r.ret > 0) {
      if (r.who === "a") out.push(`The attacker returned ${money(r.ret)}${ofLoss(r.ret, r.loss)}.`);
      else if (r.who === "b") out.push(`Bot operators returned ${money(r.ret)}.`);
      else if (r.who === "m") out.push(`An MEV builder returned ${money(r.ret)}.`);
      else out.push(`${money(r.ret)} was returned${ofLoss(r.ret, r.loss)}.`);
    }
    if (r.oth > 0) {
      if (r.split) {
        const parts = r.split.split(",").map((p) => { const [c, v] = p.split(":"); return `${money(+v)} ${CHS[c] || "recovered"}`; });
        out.push(cap(parts.join(" and ")) + ".");
      } else out.push(`${money(r.oth)} ${CH[r.ch] || "recovered"}.`);
    }
    if (out.length) return out.join(" ");
    switch (r.rec) {
      case "n": return r.ev === "p" ? "No recovery recorded; the sources were only partly checked." : "No recovery recorded in the sources checked.";
      case "v": return "No return by the attacker found.";
      case "c": return "A recovery is claimed but not verified.";
      case "q": return "Some funds recovered, amount not quantified.";
      case "r": return "Some funds recovered.";
      default: return "Recovery outcome not checked.";
    }
  }
  const ENF = {
    c: "Someone was arrested or charged for the hack.", l: "Charges only for handling the loot.", v: "Civil or regulatory action only.",
    o: "An arrest on other grounds.", n: "No arrest or charge for this hack found.", u: "Arrest and charge status is not established in this dataset.",
  };
  const outcome = (r) => I.lines[r.id] || `${recLine(r)} ${ENF[r.enf] || ENF.u}`;
  const metaLine = (r) => [fmtDate(r.date), `reported loss ${money(r.loss)}`, r.chain].filter(Boolean).join(", ");
  function tagsFor(r) {
    const t = [];
    if (r.enf === "c") t.push(["arr", "Arrested or charged"]);
    if (r.unver) t.push(["mut", "Recovery reported, not verified"]);
    else {
      if (r.ret > 0) t.push(["ret", { a: "Attacker returned funds", b: "Bot operators returned funds", m: "MEV builder returned funds" }[r.who] || "Recorded return"]);
      if (r.oth > 0) t.push(["oth", r.split ? "Recovered by more than one channel" : ({ f: "Frozen", s: "Seized or recovered by court order", w: "Rescued", h: "Frozen by the chain", k: "Recovered by a fork or rollback" }[r.ch] || "Other recorded recovery")]);
    }
    if (r.dprk) t.push(["dprk", { 2: "North Korea, government attribution", 1: "North Korea, firm attribution", 3: "North Korea, researcher-list lead only" }[r.dprk]]);
    return t;
  }
  const tagHTML = (r) => tagsFor(r).map(([c, l]) => `<span class="tag ${c}">${esc(l)}</span>`).join("");
  function barHTML(r, scale) {
    const s = scale || r.loss || 1;
    const w = (v) => Math.max(0, Math.min(100, (v / s) * 100));
    const ret = r.unver ? 0 : r.ret, oth = r.unver ? 0 : r.oth;
    return `<span class="full" style="width:${w(r.loss)}%"></span>` +
      (ret ? `<span class="seg ret" style="left:0;width:${w(ret)}%"></span>` : "") +
      (oth ? `<span class="seg oth" style="left:${w(ret)}%;width:${w(oth)}%"></span>` : "");
  }

  /* ---------------------------------------------------------------- toast, copy, images */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 1800);
  }
  const baseURL = () => location.href.split("#")[0];
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg || "Link copied"); }
    catch (e) {
      const ta = el("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast(msg || "Link copied"); } catch (e2) { toast("Copy failed. The link is " + text); }
      ta.remove();
    }
  }
  const SITE_HOST = (document.querySelector('link[rel="canonical"]').href || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  function wrapText(ctx, text, maxW) {
    const words = text.split(" "); const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  async function saveCard(o) {
    try { await Promise.all(["66px Departure", "400 30px Atkinson", "700 30px Atkinson"].map((f) => document.fonts.load(f))); } catch (e) { /* fonts optional */ }
    const W = 1200, H = 675, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#0a0d13"; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(169,179,195,0.10)";
    for (let gx = 11; gx < W; gx += 22) for (let gy = 11; gy < H; gy += 22) x.fillRect(gx, gy, 1.4, 1.4);
    x.fillStyle = o.color || "#e7ebf1"; x.fillRect(0, 0, 12, H);
    x.fillStyle = "#e7ebf1"; x.font = "33px Departure"; x.textBaseline = "alphabetic";
    x.fillText("After_the_Hack", 64, 84);
    let y = 84;
    if (o.kicker) { x.fillStyle = "#a9b3c3"; x.font = "400 26px Atkinson"; x.fillText(o.kicker, 64, 128); y = 128; }
    x.fillStyle = o.color || "#e7ebf1";
    let big = o.big, size = o.bigSize || 154;
    x.font = `${size}px Departure`;
    while (x.measureText(big).width > W - 128 && size > 44) { size -= 11; x.font = `${size}px Departure`; }
    y += size + 24;
    x.fillText(big, 60, y);
    if (o.sub) { x.fillStyle = "#a9b3c3"; x.font = "44px Departure"; x.fillText(o.sub, 64 + x.measureText(" ").width, y); }
    x.fillStyle = "#e7ebf1"; x.font = "400 36px Atkinson";
    const lines = wrapText(x, o.text, W - 128).slice(0, 5);
    y += 64;
    lines.forEach((l) => { x.fillText(l, 64, y); y += 48; });
    if (o.foot) {
      x.fillStyle = "#7f8aa0"; x.font = "400 23px Atkinson";
      wrapText(x, o.foot, W - 128).slice(0, 3).forEach((l) => { y += 4; x.fillText(l, 64, y + 18); y += 30; });
    }
    x.fillStyle = "#7f8aa0"; x.font = "400 22px Atkinson";
    x.fillText(SITE_HOST, 64, H - 40);
    c.toBlob((b) => {
      if (!b) { toast("Could not make the image"); return; }
      const a = el("a", { href: URL.createObjectURL(b), download: o.file || "after-the-hack.png" });
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast("Image saved");
    }, "image/png");
  }

  /* ---------------------------------------------------------------- hero trace graph */
  function trace() {
    const stage = $("#trace-stage"), svg = $("#trace-svg");
    const NS = "http://www.w3.org/2000/svg";
    const flows = [
      { key: "ret", share: N("R2").pct_of_all, color: "#44e3bf", node: "#tn-ret" },
      { key: "oth", share: N("C4").master_pct, color: "#8db8ff", node: "#tn-oth" },
      { key: "none", share: D("unrecovered_pct"), color: "#7f8aa0", node: "#tn-none" },
    ];
    let geo = [], parts = [], raf = 0, last = 0, running = !reduceMotion, visible = true;
    const btn = $("#motion");
    const setBtn = () => { btn.setAttribute("aria-label", running ? "Pause animation" : "Play animation"); btn.setAttribute("aria-pressed", String(!running)); btn.title = running ? "Pause animation" : "Play animation"; };
    setBtn();

    function layout() {
      const sr = stage.getBoundingClientRect();
      const rr = $("#tn-root").getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height}`);
      svg.innerHTML = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#0f141d"/><rect width="1.6" height="6" fill="rgba(127,138,160,.45)"/></pattern></defs>`;
      const x0 = rr.right - sr.left, top = rr.top - sr.top + 10, H = rr.height - 20;
      const total = flows.reduce((s, f) => s + f.share, 0);
      let acc = 0;
      geo = flows.map((f) => {
        const th = (f.share / total) * H;
        const ys = top + acc + th / 2; acc += th;
        const tr = $(f.node).getBoundingClientRect();
        const x1 = tr.left - sr.left, y1 = tr.top - sr.top + tr.height / 2;
        const th1 = Math.max(4, Math.min(th, tr.height - 14));
        const xm = (x0 + x1) / 2;
        const d = `M${x0},${ys - th / 2} C${xm},${ys - th / 2} ${xm},${y1 - th1 / 2} ${x1},${y1 - th1 / 2} L${x1},${y1 + th1 / 2} C${xm},${y1 + th1 / 2} ${xm},${ys + th / 2} ${x0},${ys + th / 2} Z`;
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        if (f.key === "none") { p.setAttribute("fill", "url(#hatch)"); p.setAttribute("stroke", "rgba(127,138,160,.55)"); p.setAttribute("stroke-dasharray", "3 3"); }
        else { p.setAttribute("fill", f.color); p.setAttribute("fill-opacity", "0.30"); p.setAttribute("stroke", f.color); p.setAttribute("stroke-opacity", "0.8"); }
        p.setAttribute("stroke-width", "1");
        svg.appendChild(p);
        return { f, x0, ys, x1, y1, xm, th, th1 };
      });
      const g = document.createElementNS(NS, "g");
      svg.appendChild(g);
      if (!parts.length) {
        const TOT = 46;
        flows.forEach((f, k) => {
          const n = Math.max(4, Math.round((f.share / total) * TOT));
          for (let j = 0; j < n; j++) parts.push({ k, t: Math.random(), u: Math.random() * 1.6 - 0.8, v: 0.75 + Math.random() * 0.5 });
        });
      }
      parts.forEach((p) => {
        const r = document.createElementNS(NS, "rect");
        r.setAttribute("width", "4"); r.setAttribute("height", "4");
        r.setAttribute("fill", flows[p.k].key === "none" ? "#c7cfdb" : flows[p.k].color);
        g.appendChild(r); p.el = r;
      });
      paint();
    }
    function pos(G, t, u) {
      const mt = 1 - t, b0 = mt * mt * mt, b1 = 3 * mt * mt * t, b2 = 3 * mt * t * t, b3 = t * t * t;
      const x = b0 * G.x0 + b1 * G.xm + b2 * G.xm + b3 * G.x1;
      const y = (b0 + b1) * G.ys + (b2 + b3) * G.y1;
      const half = (b0 + b1) * G.th / 2 + (b2 + b3) * G.th1 / 2;
      return [x, y + u * half];
    }
    function paint() {
      parts.forEach((p) => {
        const G = geo[p.k]; if (!G) return;
        const [x, y] = pos(G, p.t, p.u);
        p.el.setAttribute("x", (x - 2).toFixed(1)); p.el.setAttribute("y", (y - 2).toFixed(1));
        const fade = G.f.key === "none" ? Math.max(0, Math.min(1, (1 - p.t) / 0.25)) : Math.min(1, (1 - p.t) / 0.04);
        p.el.setAttribute("opacity", (Math.min(1, p.t / 0.05) * fade).toFixed(2));
      });
    }
    function tick(ts) {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      parts.forEach((p) => { p.t += dt * 0.26 * p.v; if (p.t > 1) { p.t -= 1; p.u = Math.random() * 1.6 - 0.8; } });
      paint();
      raf = running && visible ? requestAnimationFrame(tick) : 0;
    }
    let grown = reduceMotion;
    const start = () => { if (grown && !raf && running && visible) { last = 0; raf = requestAnimationFrame(tick); } };
    btn.addEventListener("click", () => { running = !running; setBtn(); if (running) start(); else { cancelAnimationFrame(raf); raf = 0; } });
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(stage);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) start(); });
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 60); }).observe(stage);
    layout();
    /* ribbons grow out of the root box once, then the squares start moving */
    if (!grown) {
      const w = stage.getBoundingClientRect().width, x0 = geo[0] ? geo[0].x0 : 0;
      if (svg.animate) svg.animate([{ clipPath: `inset(0 ${Math.max(0, w - x0)}px 0 0)` }, { clipPath: "inset(0 0px 0 0)" }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
      setTimeout(() => { grown = true; start(); }, svg.animate ? 600 : 0);
    }
    start();
  }

  /* ---------------------------------------------------------------- famous hacks: scoreboard */
  const ENF_SHORT = { c: "Arrested or charged", l: "Laundering charges only", v: "Civil or regulatory action only", o: "Arrest on other grounds", n: "No arrest or charge found", u: "Arrest status not established" };
  function caselog() {
    const host = $("#caselog");
    const fam = I.famous.map((id) => byId[id]);
    const scale = Math.max(...fam.map((r) => r.loss));
    host.innerHTML = fam.map((r, k) => {
      const p = ((r.ret + r.oth) / r.loss) * 100;
      const ptxt = p >= 99.5 ? "100%" : p >= 1 ? Math.round(p) + "%" : p > 0 ? p.toFixed(1) + "%" : "0%";
      const pcls = r.unver || !p ? "c-none" : (r.ret >= r.oth ? "c-ret" : "c-oth");
      const d = (ms) => `--d:${k * 70 + ms}ms`;
      return `<details class="sc"><summary>
        <span class="sc-top"><span class="sc-name">${esc(r.label)} <small>${esc(r.date.slice(0, 4))}</small></span><span class="sc-loss">${money(r.loss)} <small>reported loss</small></span></span>
        <span class="case-bar sc-bar" aria-hidden="true">${barHTML(r, scale)}</span>
        <span class="sc-side"><span class="sc-pct ${pcls} gf" style="${d(380)}">${ptxt}<small>${r.unver ? "reported, not verified" : "recovered"}</small></span><span class="sc-arr${r.enf === "c" ? " on" : ""}">${esc(ENF_SHORT[r.enf] || ENF_SHORT.u)}</span></span>
        <span class="sc-x" aria-hidden="true"></span>
      </summary><div class="sc-more"><p class="case-line">${esc(outcome(r))}</p><p class="case-meta">${esc(metaLine(r))}</p><div class="tags">${tagHTML(r)}</div><a class="btn sm" href="#hack=${encodeURIComponent(r.id)}">Show in the look-up</a></div></details>`;
    }).join("");
    $$(".sc", host).forEach((s, k) => $$(".sc-bar > span", s).forEach((b, j) => { b.classList.add("gx"); b.style.setProperty("--d", `${k * 70 + (j ? 260 : 0)}ms`); }));
    onView(host);
  }

  /* ---------------------------------------------------------------- the short version: six tiles */
  function findings() {
    const S1 = N("S1"), E2 = N("E2"), E3 = N("E3"), R4 = N("R4"), D1 = N("D1"), D3 = N("D3");
    const e3d = E3.median_days_2016_plus_in_headline_scope;
    const list = [
      { id: "unrecovered", jump: "recovery", big: fmt(D("unrecovered_pct"), "p0"), cls: "c-none", color: "#e7ebf1",
        label: "of stolen dollars has no recorded recovery",
        text: `of stolen dollars has no recorded recovery. ${fmt(N("R2").pct_of_all, "p1")} was returned by attackers or insiders and ${fmt(N("C4").master_pct, "p1")} was recovered through other channels, such as freezes, seizures and chain halts.`,
        foot: `Includes company claims and unchecked outcomes, whose results remain unknown. ${int(S1.n)} hacks, tracker-reported USD.${X.unver_note ? " " + X.unver_note : ""}` },
      { id: "arrests", jump: "arrests", big: int(E2.master_all[0]), sub: `of ${int(S1.n)}`, cls: "c-arr", color: "#ff5c93",
        label: "hacks are known to have led to an arrest or charge for the hack itself",
        text: `hacks are known to have led to an arrest or charge for the hack itself. That is about 1 in ${int(E2.one_in)}.`,
        foot: `Arrests were searched for the largest hacks and a list of known cases, so ${int(E2.master_all[0])} is a floor. ${N("E1").top100_strict} of the 100 largest hacks have one. One incident match is inferred.` },
      { id: "bounty", jump: "bounties", big: fmt(D("opening_median_pct"), "p"), cls: "c-ret", color: "#44e3bf",
        label: "median opening bounty offer in the recorded on-chain sample",
        text: `is the usual opening bounty offer. ${D("openings_table_10")} of ${D("openings_table_n")} on-chain openings dated 2020 or later were exactly ${fmt(D("opening_median_pct"), "p")} of the loss.`,
        foot: `The yearly median opening was ${fmt(D("opening_median_pct"), "p")} in every year from ${N("R3").opening_yearly_median_10_since} on.` },
      { id: "returns", jump: "bounties", big: String(R4.median_days_from_incident), sub: "days", cls: "c-ret", color: "#44e3bf",
        label: `median time to the first substantive return, in ${R4.n_dated} dated cases`,
        text: `is the median time to the first substantive return, in ${R4.n_dated} dated cases. ${R4.within_7d} came within a week.`,
        foot: "Timed by block timestamps. Includes flagged cases and returns by people other than the main exploiter. These are large, well-documented returns and may not represent other cases." },
      { id: "wait", jump: "arrests", big: fmt(e3d, "mo0"), sub: "months", cls: "c-arr", color: "#ff5c93",
        label: `median time to the first recorded action against a person, in ${E3.n_2016_plus_in_headline_scope} dated cases`,
        text: `is about the median time from a hack to the first recorded action against a person (${e3d} days).`,
        foot: `${E3.n_2016_plus_in_headline_scope} dated cases, including laundering cases and one employee detention.` },
      { id: "north-korea", jump: "dprk", big: fmt(D1.gov.pct, "p"), cls: "c-dprk", color: "#ffc34d",
        label: "of stolen dollars came from hacks a government attributes to North Korea",
        text: `of stolen dollars came from hacks a government attributes to North Korea, just ${fmt(D("dprk_gov_count_pct"), "p")} of all hacks. ${fmt(D3.gov_only_pct, "p")} of those dollars were recorded as recovered or frozen.`,
        foot: `Government-attributed tier. The recovery figure counts company claims; with only Bybit's corroborated freeze it is ${fmt(D3.gov_only_bybit_corroborated_pct, "p")}.` },
    ];
    const kickOf = (id) => { const b = $(`#${id} .kick b`); return b ? b.textContent.trim() : ""; };
    const host = $("#finds");
    list.forEach((f, k) => {
      const name = f.big + (f.sub ? " " + f.sub : "");
      const a = el("div", { class: "tile gf", id: "n-" + f.id, style: `--d:${k * 70}ms` });
      a.innerHTML = `<a class="tile-a" href="#${f.jump}"><span class="tile-n ${f.cls}">${esc(f.big)}${f.sub ? `<small>${esc(f.sub)}</small>` : ""}</span><span class="tile-l">${esc(f.label)}</span><span class="tile-t">${esc(kickOf(f.jump))}</span></a>
        <button class="tile-sh" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="n-${f.id}-menu" aria-label="Share ${esc(name)}">${SHARE_SVG}</button>
        <div class="tile-menu" id="n-${f.id}-menu" hidden><button type="button" data-act="link">Copy link</button><button type="button" data-act="img">Save image</button></div>`;
      const btn = $(".tile-sh", a), menu = $(".tile-menu", a);
      const close = (refocus) => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); if (refocus) btn.focus(); };
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.hidden;
        $$(".tile-menu").forEach((m) => { m.hidden = true; m.previousElementSibling.setAttribute("aria-expanded", "false"); });
        if (open) { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); $("button", menu).focus(); }
      });
      menu.addEventListener("keydown", (e) => { if (e.key === "Escape") close(true); });
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-act]"); if (!b) return;
        if (b.dataset.act === "link") copy(baseURL() + "#n-" + f.id);
        else saveCard({ big: f.big, sub: f.sub, text: f.text, foot: f.foot, color: f.color, file: `after-the-hack-${f.id}.png` });
        close(true);
      });
      host.appendChild(a);
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".tile-menu, .tile-sh")) $$(".tile-menu").forEach((m) => { if (!m.hidden) { m.hidden = true; m.previousElementSibling.setAttribute("aria-expanded", "false"); } }); });
    onView(host);
  }

  /* ---------------------------------------------------------------- explorer (the dump) */
  const EX = (function () {
    const dump = $("#dump");
    const lg = Math.log10(maxLoss / 1e3);
    rows.forEach((r) => {
      r.byte = r.loss <= 1e3 ? 0 : Math.max(0, Math.min(255, Math.round((255 * Math.log10(r.loss / 1e3)) / lg)));
      r.hex = r.byte.toString(16).padStart(2, "0");
      r.cls = (r.enf === "c" ? "c " : "") + (!r.unver && r.ret > 0 ? "r " : (!r.unver && r.oth > 0 ? "o " : "")) + (r.dprk === 2 ? "dg" : "");
    });
    const FILTERS = [
      { k: "", label: "All hacks", sw: "", test: () => true },
      { k: "c", label: "Arrested or charged", sw: "arr", test: (r) => r.enf === "c", desc: "a person was arrested or charged for the hack itself" },
      { k: "r", label: "Recorded returns", sw: "ret", test: (r) => !r.unver && r.ret > 0, desc: "some of the money was recorded as returned" },
      { k: "o", label: "Other recoveries", sw: "oth", test: (r) => !r.unver && r.oth > 0, desc: "some funds were recovered by freezes, seizures, rescues or other recorded channels" },
      { k: "dprk", label: "North Korea: government", sw: "dprk", test: (r) => r.dprk === 2, desc: "a government attributes the hack to North Korea" },
    ];
    let lastOff = -1, filter = FILTERS[0], cols = 0, tiny = false, sel = byId["20250221-bybit"] ? byId["20250221-bybit"].i : 0, cells = [];

    const chips = $("#chips");
    FILTERS.forEach((f) => {
      const n = rows.filter(f.test).length;
      const b = el("button", { class: "chip", type: "button", "aria-pressed": f.k ? "false" : "true", "data-f": f.k });
      b.innerHTML = (f.sw ? `<span class="sw ${f.sw}"></span>` : "") + esc(f.label) + (f.k ? ` <b>${int(n)}</b>` : "");
      b.addEventListener("click", () => setFilter(f));
      chips.appendChild(b);
    });
    function setFilter(f) {
      filter = f;
      $$(".chip", chips).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f.k)));
      if (f.k) dump.setAttribute("data-f", f.k); else dump.removeAttribute("data-f");
      let n = 0;
      cells.forEach((c, i) => { const hit = f.test(rows[i]); c.classList.toggle("hit", hit); if (hit) n++; });
      $("#filter-note").textContent = f.k ? `${int(n)} of ${int(rows.length)} hacks: ${f.desc}.` + (f.k !== "c" ? " Pink cells stay pink: they are the arrested or charged ones." : "") : "";
    }

    function build() {
      const w = dump.clientWidth - 20;
      const ncols = w >= 760 ? 32 : (w >= 520 ? 24 : 16);
      const offW = w >= 520 ? 66 : 0;
      const cell = (w - offW) / ncols;
      const isTiny = cell < 18;
      if (ncols === cols && isTiny === tiny && offW === lastOff && cells.length) return;
      cols = ncols; tiny = isTiny; lastOff = offW;
      dump.classList.toggle("tiny", tiny);
      dump.classList.toggle("nooff", offW === 0);
      dump.style.setProperty("--cols", cols);
      dump.innerHTML = "";
      cells = [];
      const frag = document.createDocumentFragment();
      for (let s = 0; s < rows.length; s += cols) {
        const row = el("div", { class: "dump-row", role: "presentation" });
        row.appendChild(el("span", { class: "dump-off", "aria-hidden": "true", text: rows[s].date.slice(0, 7) }));
        const cs = el("div", { class: "dump-cells", role: "presentation" });
        for (let i = s; i < Math.min(s + cols, rows.length); i++) {
          const r = rows[i];
          const c = el("span", { class: "cell " + r.cls, role: "option", id: "cell-" + i, tabindex: "-1", "aria-selected": "false", "aria-label": `${r.label}, ${money(r.loss)}, ${fmtDate(r.date)}`, title: `${r.label}, ${money(r.loss)}`, "data-i": i });
          c.textContent = r.hex;
          cs.appendChild(c); cells.push(c);
        }
        row.appendChild(cs); frag.appendChild(row);
      }
      dump.appendChild(frag);
      setFilter(filter);
      mark(sel, false);
    }
    function mark(i, focus) {
      cells.forEach((c) => { if (c.classList.contains("sel")) { c.classList.remove("sel"); c.setAttribute("aria-selected", "false"); c.tabIndex = -1; } });
      const c = cells[i]; if (!c) return;
      c.classList.add("sel"); c.setAttribute("aria-selected", "true"); c.tabIndex = 0;
      if (focus) c.focus({ preventScroll: true });
    }
    function show(r) {
      $("#rd-off").textContent = `cell 0x${r.i.toString(16).padStart(3, "0")} of ${int(rows.length)}`;
      $("#rd-name").textContent = r.label;
      const al = $("#rd-alias");
      if (r.alias) { al.hidden = false; al.textContent = `Also listed as ${r.alias}`; } else al.hidden = true;
      $("#rd-meta").textContent = metaLine(r);
      $("#rd-bar").innerHTML = barHTML(r);
      $("#rd-line").textContent = outcome(r);
      $("#rd-note").hidden = !(r.ev === "p" && r.rec !== "u");
      $("#rd-tags").innerHTML = tagHTML(r);
    }
    function reveal(c) {
      if (dump.scrollHeight > dump.clientHeight + 2) dump.scrollTop = c.offsetTop - dump.clientHeight / 2;
      else c.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
    function select(i, opt) {
      opt = opt || {};
      sel = Math.max(0, Math.min(rows.length - 1, i));
      mark(sel, !!opt.focus);
      show(rows[sel]);
      if (opt.scroll && cells[sel]) reveal(cells[sel]);
    }
    dump.addEventListener("click", (e) => { const c = e.target.closest(".cell"); if (c) select(+c.dataset.i, { focus: true }); });
    dump.addEventListener("keydown", (e) => {
      const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, PageDown: cols * 8, PageUp: -cols * 8 };
      let n = null;
      if (e.key in map) n = sel + map[e.key];
      else if (e.key === "Home") n = sel - (sel % cols);
      else if (e.key === "End") n = Math.min(rows.length - 1, sel - (sel % cols) + cols - 1);
      if (n === null) return;
      e.preventDefault();
      select(Math.max(0, Math.min(rows.length - 1, n)), { focus: true });
      cells[sel].scrollIntoView({ block: "nearest" });
    });
    function step(d) {
      let i = sel;
      for (let k = 0; k < rows.length; k++) { i = (i + d + rows.length) % rows.length; if (filter.test(rows[i])) break; }
      select(i, { scroll: false });
    }
    $("#rd-prev").addEventListener("click", () => step(-1));
    $("#rd-next").addEventListener("click", () => step(1));
    $("#rd-link").addEventListener("click", () => copy(baseURL() + "#hack=" + encodeURIComponent(rows[sel].id)));
    $("#rd-img").addEventListener("click", () => {
      const r = rows[sel];
      const color = r.enf === "c" ? "#ff5c93" : (!r.unver && r.ret > 0 ? "#44e3bf" : (!r.unver && r.oth > 0 ? "#8db8ff" : "#e7ebf1"));
      saveCard({ kicker: metaLine(r), big: r.label, bigSize: 99, text: outcome(r), foot: tagsFor(r).map((t) => t[1]).join(". ") + (tagsFor(r).length ? "." : "") + (r.ev === "p" && r.rec !== "u" ? " Recovery sources were checked in part only." : ""), color, file: `after-the-hack-${r.id}.png` });
    });

    /* search */
    const q = $("#q"), res = $("#results"), cnt = $("#q-count");
    const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
    rows.forEach((r) => { r.key = norm(r.label + " " + r.name + " " + r.alias); });
    function search() {
      const s = norm(q.value);
      res.innerHTML = "";
      if (!s) { res.hidden = true; cnt.textContent = ""; return []; }
      const hits = rows.filter((r) => r.key.includes(s));
      hits.sort((a, b) => ((b.key.startsWith(s) || b.key.includes(" " + s)) - (a.key.startsWith(s) || a.key.includes(" " + s))) || b.loss - a.loss);
      const top = hits.slice(0, 8);
      cnt.textContent = !hits.length ? "No hack in the dataset matches that name." : hits.length === 1 ? "1 match." : hits.length > top.length ? `${int(hits.length)} matches. Showing the top ${top.length} matches.` : `${hits.length} matches.`;
      top.forEach((r) => {
        const li = el("li");
        const b = el("button", { type: "button", "data-i": r.i });
        b.innerHTML = `<span>${esc(r.label)}${r.alias ? ` <span class="small">(${esc(r.alias)})</span>` : ""}</span><span class="rl">${money(r.loss)}, ${r.date.slice(0, 4)}</span>`;
        li.appendChild(b); res.appendChild(li);
      });
      res.hidden = !top.length;
      return top;
    }
    q.addEventListener("input", search);
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const t = search(); if (t[0]) { pick(t[0].i); } e.preventDefault(); }
      else if (e.key === "ArrowDown") { const b = $("button", res); if (b) { b.focus(); e.preventDefault(); } }
      else if (e.key === "Escape") { q.value = ""; search(); }
    });
    res.addEventListener("keydown", (e) => {
      const bs = $$("button", res), k = bs.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && k < bs.length - 1) { bs[k + 1].focus(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { (k > 0 ? bs[k - 1] : q).focus(); e.preventDefault(); }
      else if (e.key === "Escape") { q.focus(); res.hidden = true; }
    });
    function pick(i) {
      res.hidden = true;
      select(i, { scroll: true, focus: false });
      cnt.textContent = `Showing ${rows[i].label}.`;
    }
    res.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) pick(+b.dataset.i); });

    let rt;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 80); }).observe(dump);
    build();
    show(rows[sel]);
    if (cells[sel] && dump.scrollHeight > dump.clientHeight + 2) dump.scrollTop = cells[sel].offsetTop - dump.clientHeight / 2;
    return { select, build };
  })();

  /* ---------------------------------------------------------------- charts */
  function annual() {
    const a = A.charts.annual, max = Math.max(...a.map((r) => r.loss_usd));
    $("#annual").innerHTML = a.map((r, i) => `<div class="hbar"><span class="y">${r.year}</span><span class="track"><span class="fill gx" style="width:${(r.loss_usd / max) * 100}%;--d:${i * 30}ms"></span></span><span class="v"><b>${fmt(r.loss_usd, r.loss_usd >= 1e9 ? "B2" : "usd")}</b>, ${int(r.n)} hacks, largest ${esc(r.largest)}</span></div>`).join("");
    onView($("#annual"));
  }

  const CHAN = {
    "voluntary return (attacker/insider)": ["Returned by the attacker or an insider", "#44e3bf"],
    "issuer / exchange / protocol freeze": ["Frozen by an issuer, exchange or protocol", "#8db8ff"],
    "law-enforcement seizure / court": ["Seized by police or a court", "#4f7fd6"],
    "chain-level: halt / validator / security council": ["Chain halt or validator freeze", "#c3d8ff"],
    "chain-level: hard fork / rollback": ["Hard fork or rollback", "#2f5aa8"],
    "white-hat / MEV rescue": ["White-hat or MEV rescue", "#e6eeff"],
    "other / unspecified": ["Other or unspecified", "#7f8aa0"],
  };
  function channels() {
    const ch = N("C3").channels;
    const host = $("#channels");
    host.innerHTML = `<div class="stack gx" role="img" aria-label="${esc(ch.map((c) => `${(CHAN[c.channel] || [c.channel])[0]} ${c.pct}%`).join(", "))}">${ch.map((c) => `<span style="width:${c.pct}%;background:${(CHAN[c.channel] || [0, "#7f8aa0"])[1]}"></span>`).join("")}</div>
      <ul class="legend">${ch.map((c, i) => `<li class="gf" style="--d:${120 + i * 50}ms"><span class="sw" style="background:${(CHAN[c.channel] || [0, "#7f8aa0"])[1]}"></span><span>${esc((CHAN[c.channel] || [c.channel])[0])}<br><span class="small">${fmt(c.usd, c.usd >= 1e9 ? "B2" : "usd")}, ${c.incidents} hacks</span></span><b>${c.pct}%</b></li>`).join("")}</ul>`;
    onView(host);
  }

  function human(d) {
    if (d < 1) { const h = Math.round(d * 24); return `${h} hour${h === 1 ? "" : "s"}`; }
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  function clock() {
    const CLS = { attacker_return: "ret", law_enforcement_seizure: "slow", first_arrest: "arr" };
    const rowsC = A.charts.clock.map((c) => ({ label: c.label, median: c.median, n: c.n, cls: CLS[c.key] || "" }));
    rowsC.sort((a, b) => a.median - b.median);
    const lo = Math.log10(1 / 24), hi = Math.log10(365.25 * 5);
    const x = (d) => ((Math.log10(Math.max(d, 1 / 24)) - lo) / (hi - lo)) * 100;
    const host = $("#clock");
    host.innerHTML = rowsC.map((r) => {
      const p = x(r.median), left = p > 66;
      return `<div class="clock-row"><div class="clock-l">${esc(r.label)} <small>(${r.n} case${r.n === 1 ? "" : "s"})</small></div>
        <div class="clock-t" role="img" aria-label="${esc(r.label)}: median ${human(r.median)}"><span class="dot ${r.cls}" style="left:${p}%;--t:${Math.round(150 + p * 4.5)}ms"></span><span class="lbl" style="${left ? `right:${100 - p}%;` : `left:${p}%;`}">${human(r.median)}</span></div></div>`;
    }).join("") + `<div class="clock-axis" aria-hidden="true">${[[1 / 24, "1 hour"], [1, "1 day"], [7, "1 week"], [30.4, "1 month"], [365.25, "1 year"], [1826, "5 years"]].map(([d, l]) => `<span style="left:${x(d)}%">${l}</span>`).join("")}</div>`;
    onView(host);
  }

  function offers() {
    const o = A.charts.openings;
    $("#offers").innerHTML = o.map((r, k) => {
      const sq = Array.from({ length: r.n }, (_, i) => `<i class="gp${i < r.exactly_10 ? " on" : ""}" style="--d:${k * 45 + (i < r.exactly_10 ? 0 : 200)}ms"></i>`).join("");
      return `<div class="offer-row"><span class="y">${r.year}</span><span class="units" role="img" aria-label="${r.year}: ${r.exactly_10} of ${r.n} openings were exactly 10%">${sq}</span><span class="v"><b>${r.exactly_10} of ${r.n}</b> exactly 10%. Median ${pctTxt(r.median)}.</span></div>`;
    }).join("");
    onView($("#offers"));
  }

  function returnsStrip() {
    const R = A.charts.returns, R4 = N("R4");
    const max = Math.ceil(Math.max(...R.map((r) => r.days)) / 7) * 7;
    const bins = {};
    const pts = R.slice().sort((a, b) => a.days - b.days).map((r, i) => {
      const b = Math.round(r.days / (max / 46));
      bins[b] = (bins[b] || 0) + 1;
      return `<span class="pt gp" title="${esc(r.name)}, ${r.days} days" style="left:${(r.days / max) * 100}%;top:${62 - 6 - (bins[b] - 1) * 12}px;--d:${i * 18}ms"></span>`;
    }).join("");
    const ticks = [];
    for (let d = 0; d <= max; d += 7) ticks.push(`<span class="tk${d === 0 ? " first" : d + 7 > max ? " last" : ""}" style="left:${(d / max) * 100}%">${d} days</span>`);
    $("#returns").innerHTML = `<div class="strip" role="img" aria-label="${R4.within_7d} of ${R4.n_dated} first returns came within 7 days. Median ${R4.median_days_from_incident} days.">
      <span class="wk" style="left:${(7 / max) * 100}%"><span>1 week: ${R4.within_7d} of ${R4.n_dated} before this line</span></span>
      <span class="axis"></span>${pts}${ticks.join("")}</div>`;
    onView($("#returns"));
  }

  const cleanName = (s) => s.replace(/ \(DeFiLlama name: .*\)$/, "");
  function grid100() {
    const t = A.charts.top100, c = A.charts.top100_counts;
    const cls = { charged_for_hack: "c", laundering_side_only: "l", civil_or_regulatory_only: "v", not_for_the_hack: "v" };
    const g = $("#grid100");
    g.innerHTML = t.map((r, i) => `<i class="gp ${cls[r.status] || ""}${r.dprk_gov ? " dg" : ""}" style="--d:${i * 4}ms" title="#${r.rank} ${esc(cleanName(r.name))}, ${money(r.loss)}"></i>`).join("");
    g.setAttribute("aria-label", `Of the 100 largest hacks: ${c.charged_for_hack} with a person charged for the hack itself, ${c.laundering_side_only} with charges only for laundering, ${c.civil_or_regulatory_only + c.not_for_the_hack} with civil or regulatory action or an arrest on other grounds, ${c.none_found} with none found.`);
    const dg = t.filter((r) => r.dprk_gov).length;
    $("#grid100-key").innerHTML = `<li><span class="sw arr"></span>Charged for the hack itself (${c.charged_for_hack})</li>
      <li><span class="sw" style="border:2px solid var(--arr)"></span>Charged only for laundering (${c.laundering_side_only})</li>
      <li><span class="sw" style="background:var(--ink-3)"></span>Civil or regulatory only, or arrest on other grounds (${c.civil_or_regulatory_only + c.not_for_the_hack})</li>
      <li><span class="sw dim"></span>None found (${c.none_found})</li>
      <li><span class="sw" style="background:var(--dprk);height:4px"></span>North Korea, government attribution (${dg})</li>`;
    const names = t.filter((r) => r.status === "charged_for_hack").map((r) => cleanName(r.name));
    $("#grid100-names").textContent = `Charged for the hack itself: ${names.join(", ")}.`;
    onView(g);
  }

  function arrestList() {
    const a = A.charts.arrests, max = Math.max(...a.map((r) => r.days));
    $("#arrest-list").innerHTML = a.map((r) => {
      const c = !r.in_scope ? "out" : (r.kind ? "side" : "");
      return `<div class="ar"><div class="ar-n">${esc(r.name)}${r.kind ? `<small>${esc(r.kind)}</small>` : ""}</div><div class="ar-t"><span class="b ${c}" style="width:${(r.days / max) * 100}%"></span><span class="d" style="left:${(r.days / max) * 100}%">${int(r.days)} days</span></div></div>`;
    }).join("");
    // keep the day label inside the track for long bars
    $$("#arrest-list .ar").forEach((row, i) => { if (a[i].days / max > 0.8) { const d = $(".d", row); d.style.left = "auto"; d.style.right = (100 - (a[i].days / max) * 100) + "%"; d.style.paddingRight = "6px"; d.style.color = "var(--ink)"; d.style.top = "-14px"; } });
  }

  const PEOPLE = [
    ["convicted_or_pleaded", "Convicted, pleaded guilty, or plea agreement on file", "conv"],
    ["at_large_or_not_in_custody", "Charged; no public custody record found", "free"],
    ["pending", "Pending", ""],
    ["acquitted", "Acquitted", ""],
    ["conviction_vacated_or_acquitted_appeal_pending", "Conviction vacated or acquitted, appeal pending", ""],
    ["outcome_unknown", "Outcome unknown", ""],
  ];
  function people() {
    const o = A.charts.outcomes, d = A.charts.outcomes_detail;
    $("#people").innerHTML = PEOPLE.map(([k, l, c], g) => `<div class="pg"><div class="pg-l"><b>${o[k]}</b>${esc(l)}</div><div class="pg-u" aria-hidden="true">${Array.from({ length: o[k] }, (_, j) => `<i class="gf ${c}" style="--d:${g * 90 + j * 12}ms"></i>`).join("")}</div></div>`).join("");
    onView($("#people"));
    $("#people-names").innerHTML = `<dl class="defs">${PEOPLE.map(([k, l]) => `<div><dt>${esc(l)}</dt><dd>${(d[k] || []).map(esc).join("; ")}</dd></div>`).join("")}</dl>`;
  }

  function pairRow(label, v, color, note) {
    return `<div class="pair-r"><div class="pl"><span>${esc(label)}${note ? ` <span class="small">${esc(note)}</span>` : ""}</span><b>${v}%</b></div><div class="pt" role="img" aria-label="${esc(label)}: ${v}%"><span class="gx" style="width:${v}%;background:${color}"></span></div></div>`;
  }
  function dprk() {
    const D1 = N("D1"), D3 = N("D3");
    $("#dprk-share").innerHTML = pairRow("Share of all hacks", D("dprk_gov_count_pct"), "var(--dprk)") + pairRow("Share of stolen dollars", D1.gov.pct, "var(--dprk)");
    $("#dprk-rec").innerHTML = pairRow("Government attribution to North Korea", D3.gov_only_pct, "var(--dprk)") + pairRow("Outside the government, firm and researcher-list groups", D3.non_dprk_pct, "var(--oth)");
    onView($("#dprk-share")); onView($("#dprk-rec"));
  }

  function hbars(host, items) {
    const max = 100;
    host.innerHTML = items.map((r) => `<div class="hbar"><span class="y" style="font-size:14px;line-height:1.2">${esc(r.y)}</span><span class="track"><span class="fill gx" style="width:${(r.v / max) * 100}%;background:${r.color || "var(--ink)"}"></span></span><span class="v"><b>${r.v}%</b> ${esc(r.note)}</span></div>`).join("");
  }
  function attacks() {
    const k1 = A.attack.k1.eras, k4 = A.attack.k4.eras;
    hbars($("#k1"), k1.map((e) => ({ y: e.label.replace(" (to 18 Oct)", ""), v: e.ctor_pct, note: `(${e.ctor} of ${e.n}), ${e.usd_pct}% by dollars` })));
    hbars($("#k4"), k4.map((e) => ({ y: e.label, v: e.direct_pct, note: `(${e.direct} of ${e.n}), ${e.dates}` })));
    $$("#k1 .hbar, #k4 .hbar").forEach((h) => h.classList.add("wide"));
    const V = N("V1");
    const VEC = [["private-key/compromised-infra", "Compromised keys or infrastructure"], ["smart-contract logic", "Smart-contract logic bug"], ["social-engineering", "Social engineering"], ["supply-chain", "Supply chain"], ["oracle/price-manipulation", "Oracle or price manipulation"], ["access-control", "Access control"]];
    const vmax = 40;
    $("#vectors").innerHTML = VEC.map(([k, l]) => `<div class="vec-r"><div class="vec-l">${esc(l)}</div><div class="vec-b" role="img" aria-label="${esc(l)}: ${V.pct_dollars[k]}% of dollars, ${V.pct_count[k]}% of hacks">
      <div><span class="gx" style="width:${(V.pct_dollars[k] / vmax) * 100}%;background:var(--ink)"></span><em style="left:${(V.pct_dollars[k] / vmax) * 100}%">${V.pct_dollars[k]}%</em></div>
      <div><span class="gx" style="width:${(V.pct_count[k] / vmax) * 100}%;background:var(--ink-3)"></span><em style="left:${(V.pct_count[k] / vmax) * 100}%">${V.pct_count[k]}%</em></div></div></div>`).join("");
    onView($("#k1")); onView($("#k4")); onView($("#vectors"));
  }

  /* ---------------------------------------------------------------- on-chain messages */
  const short = (h) => (h && h.length > 14 ? h.slice(0, 8) + "…" + h.slice(-6) : h || "");
  function gap(a, b) {
    let s = Math.round((Date.parse(b) - Date.parse(a)) / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    if (d) return `${d}d ${h}h later`;
    if (h) return `${h}h ${m}m later`;
    return `${m}m ${s}s later`;
  }
  let msgN = 0;
  function msgHTML(q, opts) {
    const id = "m" + (msgN++);
    const side = q.side === "attacker" ? "side-a" : "side-p";
    const t = q.time.replace("T", " ").replace("Z", "");
    const text = q.segments.map(esc).join(q.complete ? "\n" : '<span class="el"> [...] </span>');
    const hex = q.hex.replace(/(..)/g, "$1 ").trim();
    return `<article class="msg${opts && opts.reply ? " reply" : ""}" aria-label="${esc(q.role_label)}, ${esc(q.case)}, ${esc(fmtDate(q.time))}">
      <div class="msg-h"><div class="who"><span><b class="${side}">${esc(q.role_label)}</b>, ${esc(q.case)}</span><span>${esc(fmtDate(q.time))}, ${esc(t.slice(11))} UTC</span></div></div>
      <div class="msg-b"><div class="msg-v" role="group" aria-label="View input data as"><button type="button" aria-pressed="true" data-v="txt" aria-controls="${id}">Text</button><button type="button" aria-pressed="false" data-v="hex" aria-controls="${id}">Hex</button></div>
        <div id="${id}"><p class="msg-text">${text}</p><p class="msg-hex" hidden>0x ${hex} ...<br><span class="small">First ${q.hex.length / 2} bytes of the input data.</span></p></div>
        <p class="msg-ctx">${esc(q.context)}</p>${txHTML(q)}</div></article>`;
  }
  function txHTML(q) {
    return `<details class="tx"><summary>Transaction</summary><p>tx <a href="${esc(q.link)}">${esc(short(q.hash))}</a> on ${esc(cap(q.chain))}${q.block ? `, block ${esc(int(+q.block))}` : ""}${q.from ? `<br>from <code>${esc(short(q.from))}</code>${q.to ? ` to <code>${esc(short(q.to))}</code>` : ""}` : ""}</p></details>`;
  }
  /* the Shezmu negotiation as a two-sided chat: project on the left, attacker on the right */
  function chat() {
    const Q = Object.fromEntries(A.quotes.map((q) => [q.rank, q]));
    const a = Q[2], b = Q[3];
    const bub = (q, d) => {
      const t = q.time.replace("T", " ").replace("Z", "");
      const text = q.segments.map(esc).join(q.complete ? "\n" : '<span class="el"> [...] </span>');
      return `<div class="bub ${q.side === "attacker" ? "a" : "p"} gf" style="--d:${d}ms"><div class="bub-h"><b>${esc(q.role_label)}</b><span>${esc(fmtDate(q.time))}, ${esc(t.slice(11))} UTC</span></div>
        <p class="bub-t">${text}</p>${txHTML(q)}</div>`;
    };
    const host = $("#chat");
    host.innerHTML = `<figure class="chat" aria-label="On-chain messages, ${esc(a.case.replace(/ (attacker|project)$/, ""))}"><figcaption class="chat-cap">${esc(a.context)}</figcaption>
      ${bub(a, 0)}<div class="chat-gap gf" style="--d:450ms"><span>${gap(a.time, b.time)}</span></div>${bub(b, 800)}
      <p class="chat-ctx gf" style="--d:1000ms">${esc(b.context)}</p></figure>`;
    onView($(".chat", host));
  }
  /* outreach: two bars, share of known cases where money came back */
  function outreach() {
    const R5 = N("R5");
    const rowsO = [
      ["Team reached out", R5.outreach_return_pct, D("outreach_yes_returned"), D("outreach_yes_known"), "var(--ret)"],
      ["No outreach", R5.no_outreach_return_pct, D("outreach_no_returned"), D("outreach_no_known"), "var(--ink-3)"],
    ];
    const host = $("#outreach");
    host.innerHTML = rowsO.map(([l, v, a, n, c], k) => `<div class="cmp-r"><div class="cmp-l"><span>${esc(l)} <span class="small">(${int(a)} of ${int(n)} known cases)</span></span><b style="color:${c}">${v}%</b></div>
      <div class="cmp-t" role="img" aria-label="${esc(l)}: money came back in ${v}% of known cases, ${int(a)} of ${int(n)}"><span class="gx" style="width:${v}%;background:${c};--d:${k * 160}ms"></span></div></div>`).join("");
    onView(host);
  }
  function messages() {
    // all messages, grouped by case; cases by editorial rank, oldest first within a case
    const groups = {};
    A.quotes.forEach((q) => { (groups[q.case] = groups[q.case] || []).push(q); });
    const order = Object.keys(groups).sort((a, b) => Math.min(...groups[a].map((q) => q.rank)) - Math.min(...groups[b].map((q) => q.rank)));
    $("#msgs-all").innerHTML = order.map((k) => groups[k].sort((a, b) => Date.parse(a.time) - Date.parse(b.time)).map((q) => msgHTML(q)).join("")).join("");
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".msg-v button"); if (!b) return;
      const box = document.getElementById(b.getAttribute("aria-controls"));
      $$("button", b.parentNode).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $(".msg-text", box).hidden = b.dataset.v !== "txt";
      $(".msg-hex", box).hidden = b.dataset.v !== "hex";
    });
  }

  /* ---------------------------------------------------------------- method */
  function method() {
    const linkify = (s) => {
      const m = /^(https?:\/\/[^\s;,]+)(.*)$/.exec(s.trim());
      return m ? `<a href="${esc(m[1])}">${esc(m[1])}</a>${esc(m[2])}` : `<code>${esc(s)}</code>`;
    };
    $("#canon").innerHTML = A.canon.numbers.map((n) => {
      const srcs = n.sources.flatMap((s) => s.split(" ; "));
      return `<details><summary><b>${esc(n.id)}</b><span>${esc(n.question)}</span></summary><div class="cv">
        <p><strong>${esc(n.canonical_value)}</strong></p>
        <p>${esc(n.definition)}</p>
        <p>Confidence: ${esc(n.confidence || "not stated")}${n.confidence_reason ? ". " + esc(n.confidence_reason) : ""}</p>
        <ul>${srcs.map((s) => `<li>${linkify(s)}</li>`).join("")}</ul></div></details>`;
    }).join("");
    const kb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
    $("#dl tbody").innerHTML = A.downloads.map((d) => `<tr><td><a href="${esc(d.file)}" download>${esc(d.file.replace(/^data\//, ""))}</a></td><td>${esc(d.desc)}</td><td class="num">${kb(d.bytes)}</td></tr>`).join("");
  }

  /* ---------------------------------------------------------------- section links, nav, share */
  const SHARE_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M7 2.8h2V10H7zM8 0l4 4-1.4 1.4L8 2.8 5.4 5.4 4 4zM2 7h3v2H4v5h8V9h-1V7h3v9H2z"/></svg>';
  const LINK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 2h5v2H4v8h8V9h2v5H2zM9 2h5v5h-2V5.4L7.7 9.7 6.3 8.3 10.6 4H9z"/></svg>';
  function sectionLinks() {
    $$(".sec .h2").forEach((h) => {
      const sec = h.closest("section");
      const b = el("button", { class: "anchor", type: "button", "aria-label": "Copy link to " + h.textContent.trim() }, LINK_SVG);
      b.addEventListener("click", () => copy(baseURL() + "#" + sec.id));
      h.appendChild(b);
    });
    const links = $$(".nav a");
    const map = Object.fromEntries(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        const a = map[e.target.id];
        if (a) { a.setAttribute("aria-current", "true"); const nav = $(".nav"); const l = a.offsetLeft - 20; if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: l, behavior: "auto" }); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => io.observe(s));
    $("#share-site").addEventListener("click", async () => {
      const text = `${int(N("S1").n)} crypto hacks since ${X.since}, ${fmt(N("S1").total_usd, "B1")} stolen. Only ${N("E2").master_all[0]} are known to have led to an arrest or charge.`;
      const url = (document.querySelector('link[rel="canonical"]') || {}).href || baseURL();
      if (navigator.share) { try { await navigator.share({ title: "After the Hack", text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
      copy(url);
    });
  }

  function deepLink() {
    const m = /^#hack=(.+)$/.exec(location.hash);
    if (m) {
      const r = byId[decodeURIComponent(m[1])];
      if (r) { EX.select(r.i, { scroll: true }); setTimeout(() => $("#readout").scrollIntoView({ block: "start" }), 50); }
    } else if (location.hash.length > 1) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) { openAround(t); setTimeout(() => t.scrollIntoView(), 50); }
    }
  }
  function openAround(t) {
    if (t.tagName === "DETAILS") t.open = true;
    for (let d = t.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href").length < 2) return;
    const t = document.getElementById(a.getAttribute("href").slice(1));
    if (t) openAround(t);
  });

  /* ---------------------------------------------------------------- go */
  fill(document);
  $$(".unver-note").forEach((e) => { e.textContent = X.unver_note ? " " + X.unver_note : ""; });
  caselog();
  findings();
  annual(); channels(); clock(); offers(); returnsStrip(); grid100(); arrestList(); people(); dprk(); attacks();
  chat(); outreach(); messages();
  method();
  sectionLinks();
  trace();
  deepLink();
  window.addEventListener("hashchange", deepLink);
  document.documentElement.setAttribute("data-ready", "1");
})();
