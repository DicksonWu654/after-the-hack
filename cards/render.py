#!/usr/bin/env python3
"""Render the After the Hack thread cards (1600x900 CSS px at 2x) with Playwright, in the site's design.

The cards are drawn by template.html, which reads every number at render time from site/data/bundle.js (built by
site/build.py from data/canonical_numbers.json and the data files) and from CARD_EXTRA, filled here from
data/law_enforcement_cases.csv and two screenshots of the built site. Each number on a card is registered with its
source key; this script writes them to thread/card-map.csv. A missing or moved source value stops the render.

Usage:
    python3 cards/render.py              # all cards -> out/, card map, out/contact-600.png
    python3 cards/render.py --only 03,08 # subset (tweet numbers or card ids)
    python3 cards/render.py --site-url https://example.org   # host shown in the screenshot cards
The cards are dark only; --no-dark is accepted for older callers and does nothing.
"""
import argparse
import base64
import csv
import functools
import http.server
import json
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ARTICLE = ROOT  # cards/ and site/ are siblings; the dev server serves the repo root
OUT = HERE / "out"
SITE_URL = "https://after-the-hack.shadow654.chatgpt.site"

# (card number, file stem, template card id). The AI card was dropped (owner, 2026-10-23); the site screenshots
# are cards 12 and 13. The card number is the tweet number in thread/thread-launch.txt.
CARDS = [
    (1, "01-cover", "cover"),
    (2, "02-recovery-ledger", "ledger"),
    (3, "03-poly-network", "poly"),
    (4, "04-euler-onchain", "euler"),
    (5, "05-bybit-freeze", "bybit"),
    (6, "06-north-korea", "dprk"),
    (7, "07-ftx-charges", "ftx"),
    (8, "08-bounty-shezmu", "bounty"),
    (9, "09-arrests-top100", "arrests"),
    (10, "10-court-outcomes", "court"),
    (11, "11-chain-freezes", "chain"),
    (12, "12-site-lookup", "site_lookup"),
    (13, "13-site-home", "site_home"),
]
CASE_IDS = {"FTX-1", "FTX-2", "FTX-3", "URAN-1", "MANGO-1"}


# ----------------------------------------------------------------------------- data
def extra_cases():
    rows = list(csv.DictReader((ROOT / "data" / "law_enforcement_cases.csv").open(encoding="utf8")))
    keep = [{k: r[k] for k in ("case_id", "incident", "defendant", "outcome")} for r in rows if r["case_id"] in CASE_IDS]
    if {r["case_id"] for r in keep} != CASE_IDS:
        raise SystemExit(f"law_enforcement_cases.csv: missing case rows {CASE_IDS - {r['case_id'] for r in keep}}")
    return keep


def check_quotes():
    """The message cards quote the bundle's verified messages; make sure each quoted text is still in the on-chain
    verification record the bundle was built from."""
    md = (ROOT / "data" / "briefs" / "onchain-verification.md").read_text(encoding="utf8")
    flat = " ".join(md.split())
    raw = (ARTICLE / "site" / "data" / "bundle.js").read_text(encoding="utf8")
    ath = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
    for q in ath["quotes"]:
        if q["rank"] in (2, 3, 6, 7):
            for seg in q["segments"]:
                if " ".join(seg.split())[:60] not in flat:
                    raise SystemExit(f"quote rank {q['rank']} not found in the verification record: {seg[:60]!r}")


# ----------------------------------------------------------------------------- server / browser
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


def site_shots(browser, port):
    """Two screenshots of the built site (desktop, 2x): the look-up with Poly Network selected, and the first screen."""
    ctx = browser.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=2, reduced_motion="reduce")
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    shots = {}
    pg.goto(f"http://127.0.0.1:{port}/site/index.html")
    pg.wait_for_selector("html[data-ready='1']")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(300)
    shots["home"] = pg.screenshot(type="png")
    pg.goto(f"http://127.0.0.1:{port}/site/index.html#hack=20210810-poly-network")
    pg.wait_for_selector("html[data-ready='1']")
    pg.wait_for_timeout(300)
    pg.evaluate("window.scrollTo(0, document.getElementById('q').getBoundingClientRect().top + window.scrollY - 96)")
    pg.wait_for_timeout(300)
    shots["lookup"] = pg.screenshot(type="png")
    ctx.close()
    if errs:
        raise SystemExit(f"site errors while taking screenshots: {errs}")
    return {k: "data:image/png;base64," + base64.b64encode(v).decode() for k, v in shots.items()}


# ----------------------------------------------------------------------------- render
def render(only=None, site_url=SITE_URL):
    check_quotes()
    OUT.mkdir(parents=True, exist_ok=True)
    srv, port = serve()
    made, nums = [], []
    with sync_playwright() as p:
        browser = launch(p)
        extra = {"cases": extra_cases(), "site_host": site_url.split("://", 1)[-1].rstrip("/"), "shots": site_shots(browser, port)}
        ctx = browser.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2)
        ctx.add_init_script("window.CARD_EXTRA = " + json.dumps(extra) + ";")
        for tweet, stem, cid in CARDS:
            if only and not any(o in (stem, cid, str(tweet), f"{tweet:02d}") for o in only):
                continue
            page = ctx.new_page()
            msgs = []
            page.on("console", lambda m: msgs.append(m.text) if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: msgs.append(str(e)))
            page.on("requestfailed", lambda r: msgs.append("failed request " + r.url))
            page.goto(f"http://127.0.0.1:{port}/cards/template.html?card={cid}")
            page.wait_for_function("window.__ready === true", timeout=15000)
            err = page.evaluate("window.__error || ''")
            if err:
                raise SystemExit(f"{stem}: {err}")
            over = page.evaluate("window.__overflow()")
            if over:
                print(f"  WARN {stem} overflow: {over}")
            if msgs:
                print(f"  WARN {stem} console: {msgs}")
            dest = OUT / f"{stem}.png"
            page.locator("#card").screenshot(path=str(dest))
            seen = set()
            for text, key in page.evaluate("window.__nums"):
                if (text, key) not in seen:
                    seen.add((text, key))
                    nums.append((tweet, dest.name, text, key))
            page.close()
            made.append(dest)
            print("wrote", dest.relative_to(ARTICLE.parent) if ARTICLE.parent in dest.parents else dest)
        browser.close()
    srv.shutdown()
    if not only:
        write_map(nums)
    return made


def write_map(nums):
    dest = ARTICLE / "thread" / "card-map.csv"
    with dest.open("w", newline="", encoding="utf8") as f:
        w = csv.writer(f)
        w.writerow(["tweet_no", "card_file", "number_on_card", "source_key"])
        for row in nums:
            w.writerow(row)
        for tweet, stem, cid in CARDS:
            if cid.startswith("site_"):
                w.writerow([tweet, stem + ".png", "(screenshot)", "numbers inside the screenshot are rendered by the site from site/data/bundle.js"])
    print("wrote", dest, f"({len(nums)} numbers)")


def contact_sheet():
    from PIL import Image, ImageDraw, ImageFont

    files = [OUT / f"{stem}.png" for _, stem, _ in CARDS if (OUT / f"{stem}.png").exists()]
    cols, tw = 2, 600
    th = tw * 9 // 16
    gap, cap = 24, 30
    rows = -(-len(files) // cols)
    W = cols * tw + (cols + 1) * gap
    H = rows * (th + cap) + (rows + 1) * gap
    sheet = Image.new("RGB", (W, H), (21, 28, 40))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSansMono.ttf", 16)
    except Exception:
        font = ImageFont.load_default()
    for i, f in enumerate(files):
        r, c = divmod(i, cols)
        x = gap + c * (tw + gap)
        y = gap + r * (th + cap + gap)
        im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (x, y))
        d.text((x, y + th + 6), f.stem, fill=(169, 179, 195), font=font)
    dest = OUT / "contact-600.png"
    sheet.save(dest)
    print("wrote", dest, sheet.size)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--no-dark", action="store_true", help="accepted for older callers; the cards are dark only")
    ap.add_argument("--site-url", default=SITE_URL)
    a = ap.parse_args()
    only = [s for s in a.only.split(",") if s] or None
    render(only, a.site_url)
    contact_sheet()
