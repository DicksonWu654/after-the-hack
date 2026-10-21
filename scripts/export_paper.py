#!/usr/bin/env python3
"""Refresh the paper from the data files and write the public copies (shipped as scripts/export_paper.py).

1. Recompute the generated tables of paper/source/after-the-hack.tables.md (scripts/build_paper_tables.py).
2. Write paper/after-the-hack.md (the same text with the <!-- TABLE --> markers removed).
3. Render paper/paper.html with python-markdown (extensions: tables, toc).
4. Write site/paper.html: the same page with a link back to the interactive site, so a static host that serves
   site/ serves the paper at /paper.html. The page is self-contained (inline CSS, no external requests).

The HTML renderer is fixed on purpose: python-markdown only, no pandoc fallback, so the same input gives
the same HTML on every machine with the same `markdown` version (tested with 3.10.2).
Install it with `pip install markdown`. The script exits with an error if the package is missing.

Usage (from the repository root): python3 scripts/export_paper.py
"""
import re
import subprocess
import sys
from pathlib import Path

try:
    import markdown
except ImportError:
    sys.exit("export_paper.py needs the python-markdown package to render paper.html: pip install markdown")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "paper" / "source" / "after-the-hack.tables.md"
subprocess.run([sys.executable, "-I", str(ROOT / "scripts" / "build_paper_tables.py")], check=True)
text = SRC.read_text(encoding="utf8")
public = re.sub(r"^<!-- /?TABLE:[a-z0-9_]+ -->\n", "", text, flags=re.M)
assert "TABLE:" not in public
(ROOT / "paper" / "after-the-hack.md").write_text(public, encoding="utf8")

CSS = ("body{font:17px/1.55 Georgia,serif;max-width:46em;margin:2em auto;padding:0 1em;color:#1a1f24}"
       "table{border-collapse:collapse;font:14px/1.35 system-ui,sans-serif;margin:1em 0;display:block;overflow-x:auto}"
       "th,td{border:1px solid #ccd;padding:.3em .55em;vertical-align:top}th{background:#f0f2f5}"
       "h1,h2,h3{font-family:system-ui,sans-serif;line-height:1.2}code{font-size:.9em}")
body = markdown.markdown(public, extensions=["tables", "toc"])


def page(extra=""):
    return ("<!doctype html><html lang=en><meta charset=utf-8>"
            "<meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>After the Hack: paper</title><style>{CSS}</style><body>{extra}{body}</body></html>\n")


(ROOT / "paper" / "paper.html").write_text(page(), encoding="utf8")
if (ROOT / "site").is_dir():
    (ROOT / "site" / "paper.html").write_text(
        page("<p><a href=\"index.html\">&larr; After the Hack: interactive site</a></p>"), encoding="utf8")
print("paper written (markdown %s)" % markdown.__version__)
