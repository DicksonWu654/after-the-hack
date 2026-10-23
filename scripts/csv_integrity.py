#!/usr/bin/env python3
"""Check CSV row widths and the DPRK initial-access vocabulary.

Run from the repository root with optional CSV paths, for example:
    python3 scripts/checks/csv_integrity.py data/*.csv
With no paths, all top-level data/*.csv files are checked.
"""
import argparse
import csv
import glob
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
