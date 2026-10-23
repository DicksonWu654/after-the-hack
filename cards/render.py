#!/usr/bin/env python3
"""Render the After the Hack thread cards (1600x900 CSS px at 2x) with Playwright.

Every number on a card is read from data/canonical_numbers.json (structured `numeric` blocks, plus a few
short facts regex-lifted from the canonical prose) or from data/briefs/onchain-verification.md.
If a source value moves or disappears, this script fails loudly instead of printing a stale number.

Usage:
    python3 cards/render.py              # light cards -> out/, dark variants -> out/dark/, contact sheet
    python3 cards/render.py --only 06,09 # subset (ids as in CARDS)
    python3 cards/render.py --no-dark
"""
import argparse
import csv
import functools
import http.server
import json
import re
import socketserver
import statistics
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ARTICLE = ROOT  # cards/ and site/ are siblings; the dev server serves the repo root
OUT = HERE / "out"

# (file stem, template card id).  The stem starts with the tweet number it belongs to (thread-final.txt, 20 tweets).
CARDS = [
    ("01-cover", "cover"),
    ("02-recovery-ledger", "ledger"),
    ("03-vector-mix", "vectors"),
    ("04-recovery-channels", "channels"),
    ("05-bounty-norm", "bounty"),
    ("06-shezmu-onchain", "shezmu"),
    ("07-return-speed", "speed"),
    ("08-outreach", "outreach"),
    ("09-euler-onchain", "euler"),
    ("10-bybit-freeze", "bybit"),
    ("11-chain-freezes", "freezes"),
    ("12-arrests-1-in-10", "arrests"),
    ("12b-arrest-delay", "delay"),
    ("13-charged-outcomes", "outcomes"),
    ("14-dprk-share", "dprk"),
    ("15-dprk-recovery", "dprk_recovery"),
    ("16-same-tx-attacks", "sametx"),
    ("17-ai-claims", "ai"),
    ("18-liquid-onchain", "liquid"),
    ("19-near-intents", "near"),
    ("20-closing", "closing"),
]

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# ----------------------------------------------------------------------------- data
def load_canon():
    canon = json.loads((ROOT / "data" / "canonical_numbers.json").read_text())
    return canon, {n["id"]: n for n in canon["numbers"]}


def build_data():
    canon, by = load_canon()
    D = {cid: n.get("numeric") for cid, n in by.items()}

    def txt(cid, pattern, field="canonical_value", cast=str):
        m = re.search(pattern, by[cid][field])
        if not m:
            raise SystemExit(f"canonical {cid}.{field}: pattern not found: {pattern}")
        return cast(m.group(1)) if m.lastindex == 1 else tuple(cast(g) for g in m.groups())

    def need(cid, phrase):
        if phrase not in by[cid]["canonical_value"]:
            raise SystemExit(f"canonical {cid}: expected phrase missing: {phrase!r}")

    snap = canon["data_snapshot"]
    y0, y1 = snap["period"].split("..")
    end = y1.split("-")
    period = f"{y0[:4]}–{MONTHS[int(end[1]) - 1]} {end[0]}"
    D["meta"] = {
        "n": snap["headline_rows"],
        "total_usd": snap["headline_loss_usd"],
        "period": period,
        "generated": canon["generated"],
        "sample_end": txt("K1", r"2026 to (\d{1,2} [A-Z][a-z]{2})\b", field="definition"),
        "dataset": f"After the Hack dataset, {snap['headline_rows']:,} incidents {period}",
    }

    # sanity: the two recovery pieces must add up to the headline
    # (compared in dollars: the rounded one-decimal shares can differ from the rounded sum by 0.1)
    assert abs(D["R2"]["voluntary_usd"] + D["C4"]["master_usd"] - D["C1"]["recovered_usd"]) < 1e6, "R2 + C4 != C1"
    assert abs(D["R2"]["pct_of_all"] + D["C4"]["master_pct"] - D["C1"]["pct"]) < 0.11, "R2 + C4 != C1 (pct)"
    assert abs(sum(c["pct"] for c in D["C3"]["channels"]) - 100) < 0.5
    need("E1", "about 1 in 10")
    need("R4", "21 of 23 inside a week")
    need("M6", "~36 hours")

    ex = {}
    ex["unrecovered_pct"] = round(100 - D["C1"]["pct"], 1)
    ex["one_in_n_voluntary"] = round(1 / D["R1"]["paper_rate"])
    ex["cronos_min"] = txt("F1", r"Cronos detected the attack ~(\d+) min", cast=int)
    ex["cronos_pct"] = txt("F1", r"restoring ([\d.]+)%", cast=float)
    # "Law-enforcement seizures: 169 days to 5+ years (the two counted seizures took 169 and 1,389 days, median 779; ... Bitfinex ~2,015 days ...)"
    toint = lambda s: int(s.replace(",", ""))
    ex["seizure_lo"], ex["seizure_hi"], ex["seizure_median"] = txt("F1", r"the (?:two|\w+) counted seizures took ([\d,]+) and ([\d,]+) days, median ([\d,]+)", cast=toint)
    ex["seizure_bitfinex"] = txt("F1", r"Bitfinex ~([\d,]+) days", cast=toint)
    assert D["F1"]["n"]["law_enforcement_seizure"] == 2, "F1 counted seizures are no longer two"
    assert ex["seizure_median"] == D["F1"]["median_days"]["law_enforcement_seizure"], "F1 seizure median != canonical numeric"
    ex["bybit_tether_usd"] = txt("F2", r"Bybit Tether \$(\d+)k", cast=int) * 1000
    ex["mango_kept_pct"] = txt("R3", r"Mango kept (\d+)%", field="tweet", cast=int)
    ex["platypus_days"] = txt("E3", r"Platypus (\d+) days", cast=int)
    ex["mango_days"] = txt("E3", r"Mango (\d+)\)", cast=int)
    ex["liquid_hours"] = txt("M1", r"(\d+)h(\d+)m after the drain", cast=int)
    ex["liquid_hours"] = round(ex["liquid_hours"][0] + ex["liquid_hours"][1] / 60)
    ex["near_quote"] = txt("M6", r'"(We have identified you)')
    assert D["M1"]["status_date"] == "2026-10-21"
    # E3, restricted to the 14 cases that are 2016+ incidents inside the 1,377 scope (canonical median 439.5 days)
    e3 = [c for c in D["E3"]["e3_set"] if c["in_headline_scope"]]
    days = sorted(c["days"] for c in e3)
    med = statistics.median(days)
    assert len(days) == D["E3"]["n_2016_plus_in_headline_scope"], "E3 in-scope n moved"
    assert abs(med - D["E3"]["median_days_2016_plus_in_headline_scope"]) < 0.01, "E3 in-scope median moved"
    by_key = {c["key"]: c["days"] for c in e3}
    ex["e3_days"] = days
    ex["e3_scope_n"] = len(days)
    ex["e3_scope_median"] = med
    ex["e3_over_year"] = sum(1 for d_ in days if d_ > 365)
    ex["e3_over_year_pct"] = round(100 * ex["e3_over_year"] / len(days))
    ex["e3_fast"] = {"PLAT": by_key["PLAT"], "MANGO": by_key["MANGO"]}
    ex["e3_named"] = {c["key"]: c["incident"] for c in e3}
    (ex["outreach_yes_ret"], ex["outreach_yes_n"],
     ex["outreach_no_ret"], ex["outreach_no_n"]) = txt("R5", r"\((\d+) of (\d+) vs (\d+) of (\d+)\)", cast=int)
    assert (ex["outreach_yes_n"], ex["outreach_no_n"]) == (D["R5"]["outreach_n"], D["R5"]["no_outreach_n"])
    ex["near_deadline_h"] = txt("M6", r"(\d+)-hour ultimatum", cast=int)
    ex["blockstream_quote"] = txt("M1", r'refused \("([^"]+)"\)')
    ex["dprk_2025_gov_pct"] = D["D1"]["by_year"]["2025"]["gov_pct"]
    ex["top3_recoveries"] = "Poly Network, Liquid and KuCoin"  # names as in the tweet; share is C1.pct_ex_top3
    D["x"] = ex

    D["quotes"] = parse_verification()
    D["latency"] = parse_latency(D["R4"])
    return D


def parse_latency(r4):
    """Days from exploit to first return for each documented return (data/return_latency_audit.csv), cross-checked
    against the canonical R4 numbers so a stale CSV or JSON fails loudly."""
    from datetime import datetime
    f = lambda t: datetime.strptime(t, "%Y-%m-%dT%H:%M:%SZ")
    rows = list(csv.DictReader((ROOT / "data" / "return_latency_audit.csv").open()))
    rows = [{"name": r["name"], "days": round((f(r["first_return_time_utc"]) - f(r["exploit_time_utc"])).total_seconds() / 86400, 3)}
            for r in rows]
    med = statistics.median(r["days"] for r in rows)
    assert len(rows) == r4["n_dated"], "latency csv n != canonical R4 n"
    assert abs(med - r4["median_days_from_incident"]) < 0.06, f"latency csv median {med} != canonical {r4['median_days_from_incident']}"
    assert sum(r["days"] <= 7 for r in rows) == r4["within_7d"], "latency csv within-7d != canonical"
    assert max(r["days"] for r in rows) <= 30 and r4["within_30d"] == r4["n_dated"]
    return rows


def parse_verification():
    path = ROOT / "data" / "briefs" / "onchain-verification.md"
    md = path.read_text()
    run = re.search(r"Run date: (\d{4}-\d{2}-\d{2})", md).group(1)
    shortlist = md.split("## 2. Ranked shortlist", 1)[1].split("\n## 3.", 1)[0]
    blocks = re.split(r"\n### (?=\d+\. )", shortlist)[1:]
    out = {}
    for b in blocks:
        head, rest = b.split("\n", 1)
        num, title = head.split(". ", 1)
        quote = "\n".join(ln[2:] for ln in rest.splitlines() if ln.startswith("> "))
        link = re.search(r"- Link: (\S+)", rest).group(1)
        chain, block, ts = re.search(r"- Chain / block / time: (\w+), block (\d+), (\S+)", rest).groups()
        frm, to = re.search(r"- From -> to: `([^`]+)` -> `([^`]+)`", rest).groups()
        txhash = link.rstrip("/").split("/")[-1]
        out[int(num)] = {"title": title, "text": quote, "link": link, "chain": chain, "block": block,
                         "time": ts, "from": frm, "to": to, "tx": txhash}
    # the card text must stay exact: guard the lines the thread quotes
    must = {
        2: "only considering 20% as bounty.",
        3: "20% is a deal.",
        6: "No intention of keeping what is not ours.",
        7: "If 90% of the funds are not returned within 24 hours, tomorrow we will launch a $1M reward for information that leads to your arrest",
        9: "You SHALL pay 10% using your own money as bug bounty",
    }
    for k, frag in must.items():
        if frag not in out[k]["text"]:
            raise SystemExit(f"verification entry {k}: expected quote fragment missing: {frag!r}")
    return {"run_date": run, "items": out}


# ----------------------------------------------------------------------------- server / render
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(Quiet, directory=str(ARTICLE))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def launch(p):
    """Use Playwright's own browser if present, else any installed chromium build under ~/.cache/ms-playwright."""
    try:
        return p.chromium.launch()
    except Exception:
        cands = sorted(Path.home().glob(".cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell")) + \
            sorted(Path.home().glob(".cache/ms-playwright/chromium-*/chrome-linux*/chrome"))
        if not cands:
            raise
        return p.chromium.launch(executable_path=str(cands[-1]))


def render(only=None, dark=True):
    D = build_data()
    (OUT / "dark").mkdir(parents=True, exist_ok=True)
    srv, port = serve()
    data_js = "window.CARD_DATA = " + json.dumps(D) + ";"
    made = []
    with sync_playwright() as p:
        browser = launch(p)
        ctx = browser.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2)
        ctx.add_init_script(data_js)
        for theme in (["light", "dark"] if dark else ["light"]):
            for stem, cid in CARDS:
                if only and not any(stem.startswith(o) or cid == o for o in only):
                    continue
                page = ctx.new_page()
                msgs = []
                page.on("console", lambda m: msgs.append(m.text) if m.type in ("error", "warning") else None)
                page.on("pageerror", lambda e: msgs.append(str(e)))
                page.goto(f"http://127.0.0.1:{port}/cards/template.html?card={cid}&theme={theme}")
                page.wait_for_function("window.__ready === true", timeout=15000)
                page.evaluate("document.fonts.ready")
                over = page.evaluate("window.__overflow()")
                if over:
                    print(f"  WARN {stem} [{theme}] overflow: {over}")
                if msgs:
                    print(f"  WARN {stem} [{theme}] console: {msgs}")
                dest = (OUT / "dark" if theme == "dark" else OUT) / f"{stem}.png"
                page.locator("#card").screenshot(path=str(dest))
                page.close()
                made.append(dest)
                print("wrote", dest.relative_to(ROOT))
        browser.close()
    srv.shutdown()
    return made


def contact_sheet():
    from PIL import Image, ImageDraw, ImageFont

    files = [OUT / f"{stem}.png" for stem, _ in CARDS if (OUT / f"{stem}.png").exists()]
    cols, tw = 3, 640
    th = tw * 9 // 16
    gap, cap = 24, 34
    rows = -(-len(files) // cols)
    W = cols * tw + (cols + 1) * gap
    H = rows * (th + cap) + (rows + 1) * gap
    sheet = Image.new("RGB", (W, H), (226, 229, 233))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(str(ARTICLE / "site" / "assets" / "fonts" / "plexmono-400.woff2"), 20)
    except Exception:
        font = ImageFont.load_default()
    for i, f in enumerate(files):
        r, c = divmod(i, cols)
        x = gap + c * (tw + gap)
        y = gap + r * (th + cap + gap)
        im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (x, y))
        d.text((x, y + th + 6), f.stem, fill=(40, 48, 58), font=font)
    dest = OUT / "contact-sheet.png"
    sheet.save(dest)
    print("wrote", dest.relative_to(ROOT), sheet.size)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--no-dark", action="store_true")
    a = ap.parse_args()
    only = [s for s in a.only.split(",") if s] or None
    render(only, dark=not a.no_dark)
    contact_sheet()
