#!/usr/bin/env python3
"""Render the site's social preview image (1200x630) from the built bundle, in the site's own design.

The page is served from site/ and the card is drawn on a canvas with the site's fonts; every number comes from
window.ATH (site/data/bundle.js, written by site/build.py), so run build.py first. The headline numbers are also
checked against data/canonical_numbers.json.

Usage:
    python3 cards/og.py            # writes site/assets/og-card.png
    python3 cards/og.py --out og-test.png
"""
import argparse
import base64
import functools
import http.server
import json
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SITE = HERE.parent / "site"
W, H = 1200, 630

DRAW = r"""async () => {
  const A = window.ATH; const c = {}; A.canon.numbers.forEach(n => c[n.id] = n.numeric);
  await Promise.all(["55px Departure", "700 30px Atkinson", "400 30px Atkinson"].map(f => document.fonts.load(f)));
  const W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0a0d13'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(169,179,195,0.10)'; for (let gx = 11; gx < W; gx += 22) for (let gy = 11; gy < H; gy += 22) x.fillRect(gx, gy, 1.4, 1.4);
  const n = c.S1.n.toLocaleString('en-US'), tot = '$' + (c.S1.total_usd / 1e9).toFixed(1) + 'B', arr = c.E2.master_all[0];
  x.fillStyle = '#e7ebf1'; x.font = '33px Departure'; x.fillText('After_the_Hack', 64, 80);
  x.font = '88px Departure'; x.fillText(n + ' hacks.', 60, 200);
  x.fillStyle = '#a9b3c3'; x.fillText(tot + ' stolen.', 60, 296);
  x.font = '700 36px Atkinson'; x.fillStyle = '#e7ebf1';
  const pre = 'Only ', mid = String(arr), post = ' are known to have led to an arrest or charge.';
  x.fillText(pre, 64, 368); let px = 64 + x.measureText(pre).width; x.fillStyle = '#ff5c93'; x.fillText(mid, px, 368);
  px += x.measureText(mid).width; x.fillStyle = '#e7ebf1'; x.fillText(post, px, 368);
  const r = c.R2.pct_of_all, o = c.C4.master_pct, u = A.derived.unrecovered_pct.v; const bx = 64, by = 420, bw = W - 128, bh = 54;
  x.fillStyle = '#44e3bf'; x.fillRect(bx, by, bw * r / 100, bh);
  x.fillStyle = '#8db8ff'; x.fillRect(bx + bw * r / 100, by, bw * o / 100, bh);
  const hx = bx + bw * (r + o) / 100, hw = bw * u / 100;
  x.save(); x.beginPath(); x.rect(hx, by, hw, bh); x.clip(); x.fillStyle = '#0f141d'; x.fillRect(hx, by, hw, bh);
  x.strokeStyle = 'rgba(127,138,160,.55)'; x.lineWidth = 1.6;
  for (let k = -bh; k < hw; k += 7) { x.beginPath(); x.moveTo(hx + k, by + bh); x.lineTo(hx + k + bh, by); x.stroke(); } x.restore();
  x.strokeStyle = '#2f3b4f'; x.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
  x.font = '400 24px Atkinson';
  x.fillStyle = '#44e3bf'; x.fillText(r.toFixed(1) + '% returned', 64, 512);
  x.fillStyle = '#8db8ff'; x.fillText(o.toFixed(1) + '% other recorded recovery', 270, 512);
  x.fillStyle = '#e7ebf1'; x.textAlign = 'right'; x.fillText(u.toFixed(1) + '% no recorded recovery', W - 64, 512); x.textAlign = 'left';
  x.fillStyle = '#7f8aa0'; x.font = '400 22px Atkinson';
  x.fillText('Crypto hacks since ' + A.built_from.snapshot.period.slice(0, 4) + ': where the money went, who negotiated, who got caught.', 64, 580);
  return cv.toDataURL('image/png');
}"""


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def launch(p):
    try:
        return p.chromium.launch()
    except Exception:
        c = sorted(Path.home().glob(".cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell"))
        if not c:
            raise
        return p.chromium.launch(executable_path=str(c[-1]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(SITE / "assets" / "og-card.png"))
    a = ap.parse_args()
    canon = json.loads((ROOT / "data" / "canonical_numbers.json").read_text())
    by = {n["id"]: n["numeric"] for n in canon["numbers"] if n.get("numeric")}
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(SITE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            b = launch(p)
            pg = b.new_page(viewport={"width": W, "height": H}, reduced_motion="reduce")
            pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/index.html")
            pg.wait_for_selector("html[data-ready='1']")
            got = pg.evaluate("() => { const c = {}; window.ATH.canon.numbers.forEach(n => c[n.id] = n.numeric); return [c.S1.n, c.S1.total_usd, c.E2.master_all[0]]; }")
            assert got == [by["S1"]["n"], by["S1"]["total_usd"], by["E2"]["master_all"][0]], "bundle and canonical_numbers.json disagree: rerun site/build.py"
            data = pg.evaluate(DRAW)
            b.close()
    finally:
        srv.shutdown()
    Path(a.out).write_bytes(base64.b64decode(data.split(",", 1)[1]))
    print("wrote", a.out, f"({got[0]:,} hacks, ${got[1] / 1e9:.1f}B, {got[2]} charged)")


if __name__ == "__main__":
    main()
