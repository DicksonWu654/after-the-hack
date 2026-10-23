"""Small helpers for keeping original source links beside Wayback links."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Mapping

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAP = ROOT / "data/source_archive_map.csv"
URL_RE = re.compile(r"https?://[^\s<>\]\[\"']+")


def load_archive_map(path: str | Path = DEFAULT_MAP) -> dict[str, str]:
    """Load available archive URLs keyed by the exact original URL."""
    mapping: dict[str, str] = {}
    try:
        with Path(path).open(encoding="utf-8", newline="") as fh:
            for row in csv.DictReader(fh):
                if row.get("original_url") and row.get("archive_url"):
                    mapping[row["original_url"]] = row["archive_url"]
    except FileNotFoundError:
        pass
    return mapping


def append_archive_urls(text: str, archive_map: Mapping[str, str] | None = None) -> str:
    """Keep each original source URL and append its available archive URL, idempotently."""
    mapping = archive_map if archive_map is not None else load_archive_map()

    def replace(match: re.Match[str]) -> str:
        raw = match.group(0)
        original = raw.rstrip(".,;)")
        archive = mapping.get(original)
        if not archive:
            return raw
        if archive in text[match.end():match.end() + 500]:
            return raw
        return f"{original} (archive: {archive}){raw[len(original):]}"

    return URL_RE.sub(replace, text)


def append_archive_urls_csv(value: str, archive_map: Mapping[str, str] | None = None) -> str:
    """Enrich a CSV source-list cell; callers remain responsible for CSV quoting."""
    return append_archive_urls(value, archive_map)
