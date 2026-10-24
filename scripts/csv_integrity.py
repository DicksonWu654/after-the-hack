#!/usr/bin/env python3
"""Check CSV row widths and the DPRK initial-access vocabulary.

Run from the repository root with optional CSV paths, for example:
    python3 scripts/checks/csv_integrity.py data/*.csv
With no paths, all top-level data/*.csv files are checked.
"""
import argparse
import csv
import glob
import math
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[2]
VALID_INITIAL_ACCESS_CLASSES = {
    "insider_it_worker",
    "key_or_infra_compromise",
    "social_engineering",
    "smart_contract_exploit",
    "supply_chain",
    "unknown",
}


def check_recovery_split(record: dict[str, str]) -> list[str]:
    """An explicit split allocates the counted recovery; it is not an extra amount."""
    if not record.get("channel_split"):
        return []
    try:
        parts = [part.rsplit("=", 1) for part in record["channel_split"].split(";")]
        channels = [name.strip() for name, _ in parts]
        values = [float(value) for _, value in parts]
        counted = float(record.get("recovered_usd_capped") or 0)
        returned = min(counted, float(record.get("returned_usd") or 0))
        if any(not name for name in channels) or len(channels) != len(set(channels)):
            return ["recovery split has empty or duplicate channels"]
        if any(not math.isfinite(value) or value < 0 for value in values):
            return ["recovery split contains a negative or non-finite amount"]
        if not math.isfinite(counted) or abs(sum(values) - counted) > 1:
            return ["recovery split does not sum to counted recovery (within $1 rounding)"]
        voluntary = sum(value for name, value in zip(channels, values)
                        if name == "voluntary return (attacker/insider)")
        if abs(voluntary - returned) > 1:
            return ["recovery split voluntary component differs from counted returned_usd"]
    except (ValueError, TypeError):
        return ["malformed recovery split"]
    return []


def check_csv(path: Path) -> list[str]:
    errors = []
    try:
        with path.open("r", newline="", encoding="utf-8-sig") as stream:
            reader = csv.reader(stream)
            header = next(reader, None)
            if header is None:
                return [f"{path}: empty file"]
            if len(header) != len(set(header)):
                errors.append(f"{path}: duplicate column names in header")
            access_index = header.index("initial_access_class") if "initial_access_class" in header else None
            for line_number, row in enumerate(reader, start=2):
                if len(row) != len(header):
                    errors.append(
                        f"{path}:{line_number}: expected {len(header)} fields, found {len(row)}"
                    )
                    continue
                if "returner" in header:
                    record = dict(zip(header, row))
                    errors.extend(f"{path}:{line_number}: {error}"
                                  for error in check_recovery_split(record))
                    if record["returner"] not in {"attacker", "bot operators", "MEV builder", "not identified"}:
                        errors.append(f"{path}:{line_number}: invalid returner {record['returner']!r}")
                    if record.get("recovery_status") == "claimed_unverified":
                        if float(record.get("recovered_usd_capped") or 0) != 0:
                            errors.append(f"{path}:{line_number}: unverified claim counted as recovered USD")
                        if record.get("voluntary_return_status") == "yes":
                            errors.append(f"{path}:{line_number}: unverified claim counted as voluntary return")
                    if record.get("id") == "20231111-samudai" and record.get("recovery_status") == "recovered_documented":
                        if float(record.get("returned_usd") or 0) == 200 and float(record.get("recovered_usd_capped") or 0) != 200:
                            errors.append(f"{path}:{line_number}: Samudai $200 return lost through percentage rounding")
                if access_index is not None and row[access_index] not in VALID_INITIAL_ACCESS_CLASSES:
                    errors.append(
                        f"{path}:{line_number}: invalid initial_access_class "
                        f"{row[access_index]!r} (expected one of "
                        f"{', '.join(sorted(VALID_INITIAL_ACCESS_CLASSES))})"
                    )
    except (OSError, UnicodeError, csv.Error) as error:
        errors.append(f"{path}: cannot read CSV: {error}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", help="CSV files to check (default: data/*.csv)")
    parser.add_argument("--tree", type=Path, help="check every CSV below this public export tree")
    args = parser.parse_args()
    paths = [Path(value) for value in args.paths]
    if args.tree:
        paths.extend(sorted(args.tree.rglob("*.csv")))
    if not paths:
        paths = [Path(value) for value in sorted(glob.glob(str(ROOT / "data" / "*.csv")))]
    if not paths:
        parser.error("no CSV files found")

    errors = [error for path in paths for error in check_csv(path)]
    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"CSV integrity check failed: {len(errors)} issue(s)", file=sys.stderr)
        return 1
    print(f"CSV integrity check passed: {len(paths)} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
