#!/usr/bin/env python3
"""Render the site's social preview image (1200x630) from canonical_numbers.json and the built bundle.

The headline numbers (incident count, dollars stolen, arrests or charges) come from data/canonical_numbers.json.
The dot field lists the headline incidents in date order, one dot each, red where the incident index marks someone
arrested or charged for the hack; it is read from the bundle that site/build.py writes, so run build.py first.

Usage:
    python3 cards/og.py            # writes site/assets/og-card.png
    python3 cards/og.py --out og-test.png
"""
import argparse
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SITE = HERE.parent / "site"
W, H = 1200, 630


def load():
    canon = json.loads((ROOT / "data" / "canonical_numbers.json").read_text())
    by = {n["id"]: n["numeric"] for n in canon["numbers"] if n.get("numeric")}
    n = by["S1"]["n"]
    total = by["S1"]["total_usd"]
    charged = by["E2"]["master_all"][0]
    assert by["E2"]["master_all"][1] == n, "E2 denominator != S1 incident count"
    raw = (SITE / "data" / "bundle.js").read_text()
    ath = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
    rows = ath["inc"]["rows"]
    flags = [1 if r[4] == "c" else 0 for r in rows]
    assert len(flags) == n and sum(flags) == charged, "incident index disagrees with canonical counts"
    return n, total, charged, flags


def page_html(n, total, charged, flags):
    fonts = SITE / "assets" / "fonts"
    cols = 80
    pad = 64
    pitch = (W - 2 * pad) / cols
    rows = -(-len(flags) // cols)
    top = H - 44 - rows * pitch
    dots = []
    for i, f in enumerate(flags):
        cx = pad + (i % cols) * pitch + pitch / 2
        cy = top + (i // cols) * pitch + pitch / 2
        if not f:
            dots.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3.6" fill="#c3c6cb"/>')
    for i, f in enumerate(flags):  # red dots last so they sit on top
        if f:
            cx = pad + (i % cols) * pitch + pitch / 2
            cy = top + (i // cols) * pitch + pitch / 2
            dots.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="6.2" fill="#c62d3d"/>')
    money = f"${total / 1e9:.1f}B"
    return f"""<!doctype html><meta charset="utf-8"><style>
@font-face {{ font-family: S; src: url(file://{fonts}/schibsted.woff2) format("woff2"); font-weight: 400 800; }}
@font-face {{ font-family: M; src: url(file://{fonts}/plexmono-500.woff2) format("woff2"); font-weight: 500; }}
html, body {{ margin: 0; background: #f5f4f0; }}
#c {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; background: #f5f4f0; color: #14181f; font-family: S, sans-serif; }}
.eb {{ position: absolute; left: {pad}px; top: 44px; font: 500 20px M, monospace; letter-spacing: .12em; color: #5a626d; text-transform: uppercase; }}
h1 {{ position: absolute; left: {pad}px; top: 84px; margin: 0; width: {W - 2 * pad}px; font-weight: 800; font-size: 60px; line-height: 1.06; letter-spacing: -0.035em; }}
h1 b {{ color: #c62d3d; font-weight: 800; }}
svg {{ position: absolute; left: 0; top: 0; }}
.ft {{ position: absolute; right: {pad}px; bottom: 14px; font: 500 16px M, monospace; color: #5a626d; }}
</style>
<div id="c">
<div class="eb">After the Hack</div>
<h1>{n:,} hacks, {money} in reported losses. Only <b>{charged}</b> are known to have led to an arrest or charge.</h1>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">{''.join(dots)}</svg>
</div>
<script>document.fonts.ready.then(function () {{ window.__ready = true; }});</script>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(SITE / "assets" / "og-card.png"))
    a = ap.parse_args()
    n, total, charged, flags = load()
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "og.html"
        f.write_text(page_html(n, total, charged, flags))
        with sync_playwright() as p:
            try:
                b = p.chromium.launch()
            except Exception:
                c = sorted(Path.home().glob(".cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell"))
                b = p.chromium.launch(executable_path=str(c[-1]))
            pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
            pg.goto(f"file://{f}")
            pg.wait_for_function("window.__ready === true")
            pg.locator("#c").screenshot(path=a.out)
            b.close()
    print("wrote", a.out, f"({n:,} hacks, ${total / 1e9:.1f}B, {charged} charged)")


if __name__ == "__main__":
    main()
