#!/usr/bin/env python3
"""Build the data bundle for the "After the Hack" site.

Reads the project's canonical numbers, CSVs and the on-chain verification brief,
copies the downloadable files into site/data/, and writes site/data/bundle.js
(window.ATH = {...}) so the static page works from file:// and over HTTP.

Every figure the page prints resolves either to data/canonical_numbers.json
(by id + numeric path) or to a derived entry below that names its source file.
Text facts quoted from canonical prose are asserted to appear verbatim in that
prose, and every on-chain quote excerpt is asserted to be a substring of the
decoded calldata in data/onchain_verification.csv.

Run: python3 -I site/build.py
"""
import csv
import json
import re
import shutil
import statistics
import sys
from datetime import datetime
from pathlib import Path

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent
DATA = ROOT / "data"
OUT = SITE / "data"
OUT.mkdir(exist_ok=True)


def rcsv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


canon = json.loads((DATA / "canonical_numbers.json").read_text())
byid = {n["id"]: n for n in canon["numbers"]}
derived = {}  # key -> {"v": value, "src": [...], "def": "..."}
problems = []


def derive(key, value, src, definition):
    derived[key] = {"v": value, "src": src if isinstance(src, list) else [src], "def": definition}


# ---------------------------------------------------------------- text facts
# Short phrases lifted from canonical prose; the build fails if the phrase is
# no longer present in the named canonical field, so copy cannot drift.
# The seizure range is read from F1's own prose (not typed here) and checked against F1's numeric median.
_le = re.search(r"two counted seizures were reported (\d[\d,]*) and (\d[\d,]*) days", byid["F1"]["canonical_value"])
LE_RANGE = f"{_le.group(1)} and {_le.group(2)} days" if _le else "F1 seizure range not found"
if _le and statistics.median([int(_le.group(i).replace(",", "")) for i in (1, 2)]) != byid["F1"]["numeric"]["median_days"]["law_enforcement_seizure"]:
    problems.append("F1 seizure range does not match F1 numeric median")
elif not _le:
    problems.append("F1 seizure range not found in canonical_value")

FACTS = [
    ("cronos_minutes", "~36 min", "F1", "canonical_value"),
    ("cronos_pct", "92.4%", "F1", "canonical_value"),
    ("bitfinex_days", "~2,015", "F1", "canonical_value"),
    ("le_range", LE_RANGE, "F1", "canonical_value"),
    ("bybit_btc_days", "~12 days", "M2", "canonical_value"),
    ("bybit_thorchain", "72%", "M2", "canonical_value"),
    ("mango_kept", "41%", "R3", "tweet"),
    ("verus_kept", "25%", "R3", "canonical_value"),
    ("returns_band", "14-22%", "R5", "canonical_value"),
    ("issuer_freeze_range", "1-11%", "F2", "canonical_value"),
    ("bybit_tether", "$181k", "F2", "canonical_value"),
    ("drift_bridged", "~$232M", "M8", "canonical_value"),
    ("drift_hours", "~6 hours", "M8", "canonical_value"),
    ("bitget_thorchain", "~$269M", "M3", "canonical_value"),
    ("kelp_eth", "30,766 ETH", "M4", "canonical_value"),
    ("cetus_vote", "90.9%", "M5", "canonical_value"),
    ("liquid_hours", "25h40m", "M1", "canonical_value"),
    ("near_deadline", "48-hour", "M6", "canonical_value"),
    ("prison_terms", "12, 18, 36, 60 months", "E4", "canonical_value"),
    ("e3_defi_days", "439 days", "E3", "canonical_value"),
    ("platypus_days", "Platypus 6 days", "E3", "canonical_value"),
    ("mango_days", "Mango 76", "E3", "canonical_value"),
    ("ofac_actions", "OFAC actions against DPRK actors or their addresses: 4", "D4", "canonical_value"),
    ("it_worker_pleas", "5 guilty pleas", "D4", "canonical_value"),
    ("kept_offer_exact", "exactly the offer in 21", "R3", "canonical_value"),
    ("reply_return", "65 of 79", "R5", "definition"),
    ("reply_silent", "3 of 100", "R5", "definition"),
    ("key_known_cases", "7 of 138", "R1", "tweet"),
    ("audit_floor", "146 of our 1,377", "A1", "canonical_value"),
    ("halfyear_range", "26-46%", "K4", "canonical_value"),
    ("halfyear_n", "n 23-50", "K4", "canonical_value"),
    ("railgun_pct", "22.4%", "K4", "canonical_value"),
    ("surge_ratio", "3.1x", "K5", "canonical_value"),
    ("usd26_surge", "$2.12B", "K5", "canonical_value"),
    ("usd25_surge", "$2.71B", "K5", "canonical_value"),
    ("usd_third", "about a third more per month", "K5", "canonical_value"),
    ("mev_replay", "SecuredFi 5 Sep 2026, BiFi 17 Oct 2026", "K9", "canonical_value"),
    ("unverified_pct", "94%", "K6", "definition"),
]
facts = {}
for key, text, cid, field in FACTS:
    hay = byid[cid][field]
    if text not in hay:
        problems.append(f"fact {key}: {text!r} not found in {cid}.{field}")
    facts[key] = {"v": text, "id": cid}

# ------------------------------------------------------------ derived values
out_rows = rcsv(DATA / "negotiation_tables/paper_table__cond__return_by_outreach.csv")
pooled = {r["team_reached_out"]: r for r in out_rows if r["stratum"] == "pooled"}
src_out = "data/negotiation_tables/paper_table__cond__return_by_outreach.csv"
derive("outreach_yes_returned", int(pooled["yes"]["yes"]), src_out, "Known-outcome incidents where the team reached out and a voluntary return followed (pooled stratum).")
derive("outreach_yes_known", int(pooled["yes"]["known"]), src_out, "Known-outcome incidents where the team reached out (pooled stratum).")
derive("outreach_no_returned", int(pooled["no"]["yes"]), src_out, "Known-outcome incidents with no outreach that still saw a voluntary return (pooled stratum).")
derive("outreach_no_known", int(pooled["no"]["known"]), src_out, "Known-outcome incidents with no outreach (pooled stratum).")

v1 = byid["V1"]["numeric"]
operational = ["private-key/compromised-infra", "social-engineering", "supply-chain"]
derive("operational_count_pct", round(sum(v1["pct_count"][k] for k in operational), 1),
       "data/canonical_numbers.json (V1.numeric.pct_count)",
       "Share of headline incidents (by count) whose vector is key/infra compromise, social engineering or supply chain: the sum of the three V1 count shares.")
c1 = byid["C1"]["numeric"]
derive("unrecovered_pct", round(100 - c1["pct"], 1), "data/canonical_numbers.json (C1.numeric.pct)",
       "100% minus the any-channel recovered share (C1): stolen dollars with no documented recovery by any channel.")
c2 = byid["C2"]["numeric"]
derive("return_strict_n", 18, "data/canonical_numbers.json (R4.scenarios.excluding_all_flagged_18)", "Dated returns left after setting aside the five flagged rows (Shezmu, Value DeFi, TrustedVolumes, Makina, Nomad).")
derive("channel_gap_usd", byid["C3"]["numeric"]["channels"][0]["usd"] - byid["R2"]["numeric"]["voluntary_usd"],
       "data/canonical_numbers.json (C3.channels minus R2.voluntary_usd)",
       "Attacker-return dollars in the recovery channel chart minus the returned-funds total (R2). Zero since 2026-10-21: both count the same incidents and dollars (non-voluntary money was recoded out of returned_usd and unverified returns left the voluntary channel).")
derive("unchecked_ge1m", c2["n_ge1m"] - c2["checked"], "data/canonical_numbers.json (C2)",
       "Incidents of $1M or more whose recovery outcome was never checked (recovery_status=unknown_not_checked).")
derive("unrecovered_usd", byid["S1"]["numeric"]["total_usd"] - c1["recovered_usd"],
       "data/canonical_numbers.json (S1.total_usd minus C1.recovered_usd)",
       "Headline loss minus documented recovery by any channel, USD at the time.")
d2 = byid["D2"]["numeric"]
derive("dprk_count_pct", round(100 * d2["gov_plus_firm"][0] / d2["gov_plus_firm"][1], 1), "data/canonical_numbers.json (D2)",
       "DPRK-attributed incidents (government or firm tier) as a share of all 1,377 headline incidents.")
derive("dprk_gov_count_pct", round(100 * d2["gov"][0] / d2["gov"][1], 1), "data/canonical_numbers.json (D2)",
       "Government-attributed DPRK incidents as a share of all 1,377 headline incidents.")
e2 = byid["E2"]["numeric"]
derive("arrest_all_pct", round(100 * e2["master_all"][0] / e2["master_all"][1], 1), "data/canonical_numbers.json (E2)", "Share of all headline incidents with a person arrested or charged for the hack itself.")
derive("arrest_ge1m_pct", round(100 * e2["master_ge1m"][0] / e2["master_ge1m"][1], 1), "data/canonical_numbers.json (E2)", "Share of headline incidents of $1M or more with a person arrested or charged for the hack itself.")

# Opening offers by year (on-chain bounty openings)
open_rows = rcsv(DATA / "negotiation_tables/paper_table__terms__opening_pct_by_year.csv")
openings = [{"year": int(r["year"]), "n": int(r["n"]), "median": num(r["median"]),
             "exactly_10": int(r["exactly_10"]), "lt_10": int(r["lt_10"]), "gt_10": int(r["gt_10"])} for r in open_rows]
tot_open = sum(o["n"] for o in openings)
tot_10 = sum(o["exactly_10"] for o in openings)
# The by-year table starts in 2020; R3's 183/104 also counts earlier openings.
since21 = {o["median"] for o in openings if o["year"] >= 2021}
if since21 != {10.0}:
    problems.append(f"opening median since 2021 is no longer 10 in every year: {sorted(since21)}")
derive("opening_median_pct", 10.0 if since21 == {10.0} else None, "data/negotiation_tables/paper_table__terms__opening_pct_by_year.csv",
       "Median opening bounty offer, as a share of the loss. The by-year table gives 10% in every year from 2021 to 2026 (build fails if that stops holding).")
derive("openings_table_n", tot_open, "data/negotiation_tables/paper_table__terms__opening_pct_by_year.csv", "On-chain opening bounty offers dated 2020 or later (the by-year table).")
derive("openings_table_10", tot_10, "data/negotiation_tables/paper_table__terms__opening_pct_by_year.csv", "Openings dated 2020 or later that offered exactly 10%.")

# Return latency: the re-audited sample (data/return_latency_audit.csv, 23 dated voluntary returns).
# Days run from the exploit transaction time to the first return transaction time.
# The five rows the audit flags as weaker are kept in the 23 and drawn differently:
# FLAGGED_NOTE names why; dropping all five gives the "strictest 18" sample (R4 numeric).
FLAGGED_NOTE = {
    "Shezmu": "first return verified on chain, but the reported 80% return is not",
    "Value DeFi": "counts returns to individual victims, not the protocol",
    "TrustedVolumes": "ambiguous: the 15 May transfer is not confirmed by press; the July return would be 71 days",
    "Makina": "returned by the MEV builder that held the funds, not by the exploiter",
    "Nomad Bridge": "about 300 copycat wallets returned funds, not one attacker",
}


def utc(s):
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ")


lat = rcsv(DATA / "return_latency_audit.csv")
returns = []
for r in lat:
    d = (utc(r["first_return_time_utc"]) - utc(r["exploit_time_utc"])).total_seconds() / 86400
    returns.append({"name": r["name"], "days": round(d, 2), "flag": FLAGGED_NOTE.get(r["name"], ""),
                    "confidence": r["confidence"], "partial": r["first_return_kind"].startswith("partial")})
r4 = byid["R4"]["numeric"]
if len(returns) != r4["n_dated"]:
    problems.append(f"return latency rows {len(returns)} != R4 n_dated")
if sorted(r["name"] for r in returns if r["flag"]) != sorted(FLAGGED_NOTE):
    problems.append("flagged return rows do not match FLAGGED_NOTE")
ret_days = [r["days"] for r in returns]
strict = [r["days"] for r in returns if not r["flag"]]
for label, got, want in [("median", round(statistics.median(ret_days), 1), r4["median_days_from_incident"]),
                         ("within 7d", sum(d <= 7 for d in ret_days), r4["within_7d"]),
                         ("within 30d", sum(d <= 30 for d in ret_days), r4["within_30d"]),
                         ("strict-18 n", len(strict), 18),
                         ("strict-18 median", round(statistics.median(strict), 2), round(r4["median_days_strict_18"], 2)),
                         ("strict-18 within 7d", sum(d <= 7 for d in strict), r4["within_7d_strict_18"]),
                         ("no-Shezmu median", round(statistics.median([r["days"] for r in returns if r["name"] != "Shezmu"]), 2), round(r4["median_days_excl_shezmu"], 2))]:
    if got != want:
        problems.append(f"return latency {label}: computed {got}, R4 says {want}")

# Recovery-action timing (counted rows of recovery_events.csv)
CH = {
    "chain_intervention": "Chain halt, validator freeze, fork or rollback",
    "protocol_freeze_or_pause": "Protocol pause",
    "stablecoin_issuer_freeze": "Stablecoin issuer freeze",
    "exchange_freeze": "Exchange freeze",
    "whitehat_rescue": "White-hat rescue",
    "multi_channel_freeze": "Multi-party freeze",
    "law_enforcement_seizure": "Law-enforcement seizure",
}
ev = rcsv(DATA / "recovery_events.csv")
timing = {}
for r in ev:
    d = num(r["days_after_incident"])
    if r["include_in_sums"] != "y" or d is None:
        continue
    timing.setdefault(r["channel"], []).append({"name": re.sub(r"\s*\(.*$", "", r["incident"]).strip(), "days": d,
                                                "usd": num(r["amount_recovered_usd"]), "loss": num(r["loss_usd"])})
f1 = byid["F1"]["numeric"]["median_days"]
for ch, rows in timing.items():
    med = statistics.median([x["days"] for x in rows])
    if ch in f1 and abs(med - f1[ch]) > 1e-6:
        problems.append(f"timing median for {ch} = {med}, F1 says {f1[ch]}")

# Time to first arrest / charge
les = json.loads((DATA / "law_enforcement_stats.json").read_text())
cases = rcsv(DATA / "law_enforcement_cases.csv")


def case_name(code):
    for c in cases:
        if c["case_id"] == code or c["case_id"].startswith(code + "-"):
            return re.sub(r"\s*\(.*$", "", c["incident"]).split(" / ")[0].strip().rstrip(",")
    return code


e3 = byid["E3"]["numeric"]
e3set = {x["key"]: x for x in e3["e3_set"]}
KIND = {"hack_itself": "", "laundering_side": "laundering-side arrest", "detained_non_perpetrator": "engineer detained, not the attacker",
        "pre_2016_incident": "pre-2016 incident, outside the 1,377"}
arrests = []
for k, v in les["time_to_first_person_action_days_by_incident"].items():
    e = e3set.get(k)
    if not e or e["days"] != v:
        problems.append(f"arrest case {k} missing or different in E3 numeric.e3_set")
        continue
    arrests.append({"name": case_name(k), "days": v, "in_scope": bool(e["in_headline_scope"]), "kind": KIND.get(e["kind"], e["kind"])})
if len(arrests) != e3["n"] or statistics.median([a["days"] for a in arrests]) != e3["median_days"]:
    problems.append("arrest timing median differs from E3")
arrests_in = [a["days"] for a in arrests if a["in_scope"]]
if len(arrests_in) != e3["n_2016_plus_in_headline_scope"] or statistics.median(arrests_in) != e3["median_days_2016_plus_in_headline_scope"]:
    problems.append("in-scope arrest timing median differs from E3")

clock_rows = [{"key": k, "label": CH[k], "pts": timing[k]} for k in CH if k in timing]
clock_rows.append({"key": "attacker_return", "label": "Attacker returns funds", "pts": returns})
# E3 is a separate sample from E2 and includes laundering cases and one employee detention, so the row is
# "first recorded action against a person". Points, n and median all come from the 14 in-scope cases
# (439.5 days); the full 16-case figures are kept as n_all / median_all.
clock_rows.append({"key": "first_arrest", "label": "First recorded action against a person",
                   "pts": [a for a in arrests if a["in_scope"]]})
for row in clock_rows:
    row["median"] = statistics.median([p["days"] for p in row["pts"]])
    row["n"] = len(row["pts"])
    if row["key"] == "first_arrest":
        if row["n"] != e3["n_2016_plus_in_headline_scope"] or row["median"] != e3["median_days_2016_plus_in_headline_scope"]:
            problems.append("clock first_arrest row differs from E3 in-scope cohort")
        row["n_all"] = len(arrests)
        row["median_all"] = e3["median_days"]
        row["n_in_scope"] = row["n"]
clock_rows.sort(key=lambda r: r["median"])
clock_src = ["data/recovery_events.csv (include_in_sums=y)",
             "data/return_latency_audit.csv",
             "data/law_enforcement_stats.json (time_to_first_person_action_days_by_incident)"]

# Top 100 by loss with enforcement status (master; data/top100_master_enforcement.csv)
master = rcsv(DATA / "incidents_master.csv")
period = canon["data_snapshot"]["period"].split("..")
if len(master) != 1573 or sum(r["headline_scope"] == "1" for r in master) != 1450:
    problems.append("incidents_master.csv row counts changed: update the downloads description")
head = [r for r in master if r["in_headline"] == "1"]
head.sort(key=lambda r: -num(r["loss_usd_reported"]))
if len(head) != byid["S1"]["numeric"]["n"]:
    problems.append(f"in_headline rows {len(head)} != S1 n")
scope_old = [r for r in master if r["headline_scope"] == "1" and num(r["loss_usd_reported"]) and period[0] <= r["date"][:10] <= period[1]]
if {r["id"] for r in scope_old} != {r["id"] for r in head}:
    problems.append("in_headline differs from headline_scope=1 within the period and a USD loss")
t100 = rcsv(DATA / "top100_master_enforcement.csv")
if [r["id"] for r in t100] != [r["id"] for r in head[:100]]:
    problems.append("top100_master_enforcement.csv ids differ from the master ranking by loss")
CASE_OF = {"20250221-bybit": "M2", "20260401-drift-trade": "M8", "20260418-kelp": "M4", "20260924-bitget": "M3",
           "20260906-liquid-network": "M1", "20250522-cetus-clmm": "M5"}
top100 = []
for r in t100:
    loss = num(r["loss_usd_reported"])
    alt = byid[CASE_OF[r["id"]]]["numeric"]["loss_usd"] if r["id"] in CASE_OF else None
    top100.append({"rank": int(r["rank"]), "name": r["name"], "date": r["date"], "loss": loss, "status": r["enforcement_status"],
                   "arrest": r["enforcement_status"] == "charged_for_hack", "dprk_gov": r["attribution"] == "dprk_gov_attributed",
                   "grade": r["attribution_source_grade"], "text_loss": alt if alt and abs(alt - loss) > 0.5e6 else None})
n_arr = sum(t["arrest"] for t in top100)
if n_arr != byid["E1"]["numeric"]["top100_strict"]:
    problems.append(f"top100 arrest flags {n_arr} != E1 {byid['E1']['numeric']['top100_strict']}")
n_laund = sum(t["status"] == "laundering_side_only" for t in top100)
if n_arr + n_laund != byid["E1"]["numeric"]["top100_broad"]:
    problems.append("top100 charged + laundering-side != E1 top100_broad")
if sum(t["dprk_gov"] for t in top100) != byid["D4"]["numeric"]["top100_dprk_gov"]:
    problems.append("top100 DPRK government count != D4")
top100_counts = {k: sum(t["status"] == k for t in top100) for k in
                 ["charged_for_hack", "laundering_side_only", "civil_or_regulatory_only", "not_for_the_hack", "none_found", "not_checked"]}
derive("top100_none_found", top100_counts["none_found"], "data/top100_master_enforcement.csv", "Top-100 incidents with no arrest or charge found in the sources searched.")
derive("top100_not_checked", top100_counts["not_checked"], "data/top100_master_enforcement.csv", "Top-100 incidents with no arrest search recorded (enforcement_status=not_checked); 0 since 2026-10-21, when 15 incidents that the verification pass searched and found nothing for were relabelled none_found.")
derive("top100_laundering", n_laund, "data/top100_master_enforcement.csv", "Top-100 incidents where people were charged only for handling or buying the loot (Coincheck, Bitfinex, StableMagnet).")
derive("top100_other_enf", top100_counts["civil_or_regulatory_only"] + top100_counts["not_for_the_hack"], "data/top100_master_enforcement.csv",
       "Top-100 incidents with only a civil or regulatory action, or an arrest that was not for the hack itself.")
g = byid["D1"]["numeric"]["gov_tier_source_grade"]
derive("dprk_gov_secondary_rows", g["secondary_rows"], "data/canonical_numbers.json (D1.gov_tier_source_grade)", "Government-tier DPRK rows whose attribution is read through a secondary source.")
derive("dprk_gov_rows", g["rows"], "data/canonical_numbers.json (D1.gov_tier_source_grade)", "Government-tier DPRK rows.")
derive("dprk_gov_secondary_usd", g["secondary_usd"], "data/canonical_numbers.json (D1.gov_tier_source_grade)", "Dollars in the government-tier rows read through secondary sources.")
derive("dprk_gov_usd_all", g["usd"], "data/canonical_numbers.json (D1.gov_tier_source_grade)", "Dollars in all government-tier rows.")
gm = [r for r in head if r["attribution"] == "dprk_gov_attributed"]
if (len(gm), sum(1 for r in gm if r["attribution_source_grade"].startswith("secondary"))) != (g["rows"], g["secondary_rows"]):
    problems.append("government-tier source grade counts differ between master and D1")

# DPRK initial access (dprk_incidents.csv)
dp = rcsv(DATA / "dprk_incidents.csv")
IA = {"key_or_infra_compromise": "Key or infrastructure compromise", "supply_chain": "Supply chain (vendor, wallet UI)",
      "social_engineering": "Social engineering", "unknown": "Unknown", "insider_it_worker": "Insider IT worker",
      "smart_contract_exploit": "Smart-contract exploit"}
ia = {}
for r in dp:
    k = r["initial_access_class"]
    a = ia.setdefault(k, {"key": k, "label": IA.get(k, k), "n": 0, "usd": 0.0})
    a["n"] += 1
    a["usd"] += num(r["loss_usd"]) or 0
dprk_access = sorted(ia.values(), key=lambda a: -a["usd"])
derive("dprk_rows", len(dp), "data/dprk_incidents.csv", "Rows in the DPRK incident file (government, firm and speculative tiers).")
derive("dprk_contract_rows", ia.get("smart_contract_exploit", {}).get("n", 0), "data/dprk_incidents.csv",
       "DPRK incident rows whose initial access is a smart-contract exploit.")

period_end = canon["data_snapshot"]["period"].split("..")[1]
MONTH_NAMES = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
# "Code is law" defences scoreboard: parsed from the arrests brief table
brief = (ROOT / "data/briefs/arrests-and-prosecutions.md").read_text()
m = re.search(r'"Code is law" and "I only used public functions" defences:\s*\n\n(.*?)\n\n', brief, re.S)
defences = []
if m:
    for line in m.group(1).splitlines()[2:]:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 3:
            defences.append({"case": cells[0], "defence": cells[1], "result": cells[2]})
if not defences:
    problems.append("defences table not found in arrests brief")
ASOF = "as of " + str(int(period_end[8:10])) + " " + MONTH_NAMES[int(period_end[5:7]) - 1] + " " + period_end[:4]
for d in defences:  # court outcomes that are still open get a date stamp
    if re.search(r"appeal pending|retrial", d["result"]) and "as of" not in d["result"]:
        d["result"] = d["result"].rstrip(".") + f" ({ASOF})"

# Annual totals
s2 = byid["S2"]["numeric"]
annual = [{"year": int(y), **v} for y, v in sorted(s2.items())]

# Marquee cases timeline
MONTHS = {m: i + 1 for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}
cases_tl = []
for cid in ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"]:
    q = byid[cid]["question"]
    mm = re.match(r"(.*?) \((\w{3}) (\d{4})\)", q)
    cases_tl.append({"id": cid, "name": mm.group(1), "month": MONTHS[mm.group(2)], "year": int(mm.group(3)),
                     "label": f"{mm.group(2)} {mm.group(3)}"})
cases_tl.sort(key=lambda c: (c["year"], c["month"]))

# ------------------------------------------------------- on-chain quote cards
ver = rcsv(DATA / "onchain_verification.csv")
by_hash = {}
for r in ver:
    if r["tx_hash"]:
        by_hash.setdefault(r["tx_hash"].lower(), r)
md = (ROOT / "data/briefs/onchain-verification.md").read_text()
sec = md.split("\n## 2. Ranked shortlist", 1)[1].split("\n## 3. ", 1)[0]
entries = re.split(r"\n### ", sec)[1:]
GROUP = {"Wormhole": "offer", "Euler: $1M": "offer", "Makina": "offer", "Verus": "offer",
         "Euler: 'No": "reply", "Shezmu: 20%": "reply", "Shezmu: '20%": "reply", "ChainConnect": "reply",
         "Liquid": "terms", "KyberSwap": "terms", "Rho": "terms", "Wintermute": "terms"}


def norm(s):
    return re.sub(r"\s+", " ", s.replace("\\x19", "'").replace("\x19", "'")).strip()


# Third-party contact details (e-mails, @handles, Telegram links, Discord invites) are never published; same patterns as
# scripts/verify_onchain.py (data/onchain_verification.csv is already redacted, this keeps the brief's quote excerpts consistent with it).
CONTACT_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+"
                        r"|(?<![\w/.@])@[A-Za-z_][A-Za-z0-9_]{2,31}"
                        r"|(?:https?://)?(?:t\.me|telegram\.me|telegram\.dog)/[A-Za-z0-9_+/\-]+"
                        r"|(?:https?://)?(?:discord\.gg|discord(?:app)?\.com/invite)/[A-Za-z0-9\-]+"
                        r"|(?:https?://)?(?:signal\.me|wa\.me)/[A-Za-z0-9_+/#\-]+")


def redact(t):
    return CONTACT_RE.sub("[contact redacted]", t)


def clean_context(t):
    """Drop references internal to the verification brief; wording otherwise verbatim."""
    t = re.sub(r",? see section \d+", "", t)
    t = re.sub(r" ?\(section \d+\)", "", t)
    t = re.sub(r" This message is not in the prior [\w() -]+ master dataset\.", "", t)
    t = t.replace("was NOT verified", "was not verified")
    t = t.replace("still holds exactly 1,350 ETH today", "still held exactly 1,350 ETH when queried on 21 Oct 2026")
    return t


quotes = []
for e in entries:
    title_line, body = e.split("\n", 1)
    rank, title = title_line.split(". ", 1)
    qlines = [l[2:] if l.startswith("> ") else l[1:] for l in body.splitlines() if l.startswith(">")]
    segs, cur = [], []
    for l in qlines:
        if l.strip() == "[...]":
            segs.append("\n".join(cur)); cur = []
        else:
            cur.append(l)
    segs.append("\n".join(cur))
    segs = [redact(x) for x in segs]
    fields = dict(re.findall(r"^- ([^:]+): (.*)$", body, re.M))
    link = fields.get("Link", "").strip()
    h = link.rstrip("/").split("/")[-1].lower()
    row = by_hash.get(h)
    if not row:
        problems.append(f"quote {title}: tx {h} not in onchain_verification.csv"); continue
    dec = norm(redact(row["decoded_text"]))
    for s in segs:
        if norm(s) not in dec:
            problems.append(f"quote {title}: excerpt not in decoded calldata: {s[:60]!r}")
    cls = re.search(r"dataset class=(\w+)", row["sender_role_check"])
    full = norm("".join(segs)) == dec
    group = next((g for k, g in GROUP.items() if title.startswith(k)), "terms")
    quotes.append({
        "rank": int(rank), "title": title, "group": group, "segments": segs, "complete": full and len(segs) == 1,
        "context": redact(clean_context(fields.get("Context", "").strip())), "link": link, "chain": row["chain"], "hash": row["tx_hash"],
        "block": row["block"], "time": row["timestamp_utc"], "from": row["from"], "to": row["to"],
        "match": row["verified_text_match"], "role": cls.group(1) if cls else "unknown",
        "role_evidence": redact(re.sub(r"\s*WARNING:.*$", "", fields.get("Role evidence", "").strip())), "text_match_note": redact(fields.get("Text match", "").strip()),
        "hex": segs[0].encode("utf-8").hex()[:96],
    })
# Sender labels where the dataset class is 'unknown': short readings of the
# brief's own "Role evidence" line, which the card also shows in full.
ROLE_OVERRIDE = {"Wormhole": ("project", "Project (self-identified)"),
                 "KyberSwap": ("attacker", "Exploiter (replying address)"),
                 "Verus": ("project", "Project side"),
                 "Liquid": ("attacker", "Attacker (per TRM attribution)")}
for q in quotes:
    side, label = {"attacker": ("attacker", "Attacker"), "protocol": ("project", "Project")}.get(q["role"], ("unknown", "Unlabelled sender"))
    for k, v in ROLE_OVERRIDE.items():
        if q["title"].startswith(k) and q["role"] == "unknown":
            side, label = v
    q["side"], q["role_label"] = side, label
    q["case"] = q["title"].split(":")[0]
quotes.sort(key=lambda q: q["time"])
derive("quotes_n", len(quotes), "data/briefs/onchain-verification.md section 2", "Messages in the verified on-chain shortlist.")

# ----------------------------------------------------------- attack anatomy
# data/attack.json is generated here from canonical entries K1-K9 plus the chart tables
# in data/tables/ (and two raw files for the monthly counts), then every figure is
# re-derived from the underlying rows and checked against the canonical numbers.
k1, k2, k3, k4, k5, k6, k7, k8, k9 = (byid[f"K{i}"] for i in range(1, 10))
ERAS = ["2020-22", "2023", "2024", "2025", "2026"]
ERA_LABEL = {"2020-22": "2020 to 2022", "2023": "2023", "2024": "2024", "2025": "2025", "2026": "2026 (to 18 Oct)"}


def check(label, got, want):
    if got != want:
        problems.append(f"attack {label}: computed {got!r}, canonical says {want!r}")


def era_of(year):
    return "2020-22" if int(year) <= 2022 else str(int(year))


def pct1(a, b):
    return round(100 * a / b, 1)


ac = rcsv(DATA / "attack_contracts.csv")
check("attack_contracts rows", len(ac), k1["numeric"]["sample_n"])
k1by = k1["numeric"]["by_era"]
k1rows = []
for era in ERAS:
    rs = [r for r in ac if era_of(r["year"]) == era]
    fp = lambda r: r["incident"] == "Fortress Loans"  # the one verified false positive (K1 definition)
    ctor = [r for r in rs if r["constructor_attack"] == "True" and not fp(r)]
    same = [r for r in rs if not fp(r) and (r["constructor_attack"] == "True" or r["deployed_in_attack_tx"] == "True"
                                            or "deployed_same_block" in r["frontrun_protection_signals"]
                                            or "deployed_in_attack_tx" in r["frontrun_protection_signals"])]
    usd_all = sum(num(r["loss_usd"]) or 0 for r in rs)
    usd_ctor = sum(num(r["loss_usd"]) or 0 for r in ctor)
    row = {"era": era, "label": ERA_LABEL[era], "n": len(rs), "ctor": len(ctor), "ctor_pct": pct1(len(ctor), len(rs)),
           "same_or_block": len(same), "same_or_block_pct": pct1(len(same), len(rs)),
           "usd_pct": round(100 * usd_ctor / usd_all, 1), "usd_rows": sum(1 for r in rs if num(r["loss_usd"]))}
    want = k1by[era]
    for a, b in [("n", "n"), ("ctor", "ctor"), ("ctor_pct", "ctor_pct"), ("same_or_block", "sametx_or_block"),
                 ("same_or_block_pct", "sametx_or_block_pct"), ("usd_pct", "usd_share_pct"), ("usd_rows", "usd_known_rows")]:
        check(f"K1 {era} {a}", row[a], want[b])
    k1rows.append(row)
for fact in ("2023 4.7% (9/190)", "2024 14.3% (26/182)", "2025 40.5% (62/153)", "2026 34.1% (47/138)", "0/95",
             "49.0% in 2025 and 44.2% in 2026", "25.1% (2024), 8.2% (2025), 10.9% (2026)", "24 of 25"):
    if fact not in k1["canonical_value"]:
        problems.append(f"K1 text no longer contains {fact!r}")
t5 = {r["era"]: r for r in rcsv(DATA / "tables/t5_frontrun_protection_signals_by_era.csv")}
for row in k1rows:  # the table agrees with the rows once the false positive is set aside
    tr = next(v for k, v in t5.items() if k.startswith(row["era"]))
    if row["era"] != "2020-22":
        check(f"K1 t5 {row['era']}", num(tr["constructor_attack_pct"]), row["ctor_pct"])

t4 = {r["era"].split(" ")[0]: r for r in rcsv(DATA / "tables/t4_deploy_to_attack_lag_by_era.csv")}
k2rows = []
for era in ERAS:
    w = k2["numeric"]["by_era"][era]
    tr = t4[era]
    check(f"K2 {era} n", int(tr["n_attacker_deployed"]), w["n"])
    check(f"K2 {era} median", num(tr["median_min"]), w["median_min"])
    check(f"K2 {era} zero-lag share", num(tr["same_tx_pct"]), w["zero_pct"])
    k2rows.append({"era": era, "label": ERA_LABEL[era], "n": w["n"], "median_min": w["median_min"], "zero_pct": w["zero_pct"],
                   "strict_pct": w["strict_pct"], "n_nonzero": w["n_nonzero"], "median_nonzero_min": w["median_nonzero_min"]})
check("K2 flat range", [min(r["median_nonzero_min"] for r in k2rows if r["era"] != "2025"), max(r["median_nonzero_min"] for r in k2rows if r["era"] != "2025")],
      k2["numeric"]["flat_range_min"])

t1b = {r["era"].split(" ")[0]: r for r in rcsv(DATA / "tables/t1b_vector_share_pct_dhl_sample.csv")}
t3f = {r["era"].split(" ")[0]: r for r in rcsv(DATA / "tables/t3_flash_loan_share_by_era.csv")}
VEC = [("oracle_price_manipulation", "oracle_pct", "Oracle or price manipulation"), ("access_control", "access_control_pct", "Access control"),
       ("business_logic_accounting", "business_logic_pct", "Business logic or accounting"), ("reentrancy", "reentrancy_pct", "Reentrancy")]
k3vec = []
for col, key, label in VEC:
    vals = [num(t1b[e][col]) for e in ERAS]
    check(f"K3 {key}", vals, [k3["numeric"][key][e] for e in ERAS])
    k3vec.append({"key": col, "label": label, "pct": vals})
k3flash = [num(t3f[e]["flash_share_pct"]) for e in ERAS]
check("K3 flash share", k3flash, [k3["numeric"]["flash_loan_pct"][e] for e in ERAS])
k3n = [int(t3f[e]["n"]) for e in ERAS]
check("K3 era n matches K1", k3n, [r["n"] for r in k1rows])

# Funding, Ethereum only (t2c holds the Ethereum-only counts the canonical shares are computed on)
t2c = rcsv(DATA / "tables/t2c_ethereum_tornado_share_by_era.csv")
k4rows = []
for tr, (ek, lab, dates) in zip(t2c, [("A", "Before the sanctions", "to 7 Aug 2022"), ("B", "During the sanctions", "8 Aug 2022 to 20 Mar 2025"),
                                      ("C", "After the delisting", "from 21 Mar 2025")]):
    w = k4["numeric"]["by_era"][ek]
    n = int(tr["n_resolved"])
    check(f"K4 {ek} n", n, w["n"])
    check(f"K4 {ek} direct+hop", int(tr["tornado_direct_or_hop2"]), w["direct"] + w["hop"])
    check(f"K4 {ek} railgun", int(tr["railgun"]), w["railgun"])
    check(f"K4 {ek} direct pct", pct1(w["direct"], n), w["direct_pct"])
    check(f"K4 {ek} hop pct", pct1(w["direct"] + w["hop"], n), w["incl_hop_pct"])
    k4rows.append({"era": ek, "label": lab, "dates": dates, "n": n, "direct": w["direct"], "hop": w["hop"],
                   "direct_pct": w["direct_pct"], "incl_hop_pct": w["incl_hop_pct"], "railgun": w["railgun"]})
check("K4 direct list", [r["direct_pct"] for r in k4rows], k4["numeric"]["direct_only_pct"])
check("K4 hop list", [r["incl_hop_pct"] for r in k4rows], k4["numeric"]["incl_one_hop_pct"])
if not ("13 of 58" in k4["canonical_value"] and "22.4%" in k4["canonical_value"]):
    problems.append("K4 Railgun sentence changed")

# Copycat wave: the nine documented Compound-v2 members (t9b) plus Onyx, Radiant and Sonne (K9 definition)
w9 = k9["numeric"]["compound_v2_wave"]
t9b = [r for r in rcsv(DATA / "tables/t9b_documented_copycat_waves.csv") if r["wave"].startswith("compound_v2")]
first_row = {}
for r in ac:
    first_row.setdefault(r["incident"], r)  # first listed row per incident (WiseLending appears twice)
wave = {r["incident"]: first_row[r["incident"]] for r in t9b}
for extra in ("OnyxProtocol", "RadiantCapital", "Sonne Finance"):
    wave[extra] = first_row[extra]
check("K9 wave members", sorted(wave), sorted(w9["incidents"]))
wave_rows = sorted(({"name": k, "date": v["date"][:10], "loss": num(v["loss_usd"])} for k, v in wave.items()), key=lambda x: x["date"])
check("K9 first", wave_rows[0]["date"], w9["first"])
check("K9 last", wave_rows[-1]["date"], w9["last"])
check("K9 usd sum", int(sum(x["loss"] for x in wave_rows)), w9["usd_known_sum"])
check("K9 n", len(wave_rows), w9["n"])
derive("k9_erc_wave_n", 6, "data/canonical_numbers.json (K9 canonical_value)",
       "Incidents in the ERC-2771 forwarder or unchecked-multicall wave, May 2025 to Sep 2026, as stated in K9 (taken from DeFiHackLabs notes, not recomputed here).")
k9other = [{"label": "Read-only reentrancy", "n": k9["numeric"]["read_only_reentrancy_n"], "span": "Oct 2022 to Jul 2023"},
           {"label": "ERC-2771 forwarder or unchecked multicall", "n": 6, "span": "May 2025 to Sep 2026"}]
if "ERC-2771 forwarder / unchecked multicall (6, May 2025 to Sep 2026)" not in k9["canonical_value"] or "7 incidents, 2022-10-24 to 2023-07-30" not in k9["canonical_value"]:
    problems.append("K9 other-wave text changed")

# Monthly record counts: DeFiLlama (t0b) and SlowMist (raw parsed pages), 2025 and Jan-Sep 2026
t0b = {r["ym"]: r for r in rcsv(DATA / "tables/t0b_monthly_counts_2024_2026.csv")}
sm_rows = rcsv(DATA / "slowmist_record_links_2026-10-21.csv")
sm_count = {}
for r in sm_rows:
    sm_count[r["date"][:7]] = sm_count.get(r["date"][:7], 0) + 1
months = []
for y in (2025, 2026):
    for m in range(1, 13 if y == 2025 else 10):
        ym = f"{y}-{m:02d}"
        months.append({"ym": ym, "year": y, "month": m, "defillama": int(t0b[ym]["defillama_hacks"]), "slowmist": sm_count.get(ym, 0)})
n5 = k5["numeric"]
dl25 = sum(x["defillama"] for x in months if x["year"] == 2025)
dl26 = sum(x["defillama"] for x in months if x["year"] == 2026 and x["month"] >= 3)
sm25 = sum(x["slowmist"] for x in months if x["year"] == 2025)
sm26 = sum(x["slowmist"] for x in months if x["year"] == 2026 and x["month"] >= 3)
check("K5 DeFiLlama 2025", dl25, n5["dl25"])
check("K5 DeFiLlama Mar-Sep 2026", dl26, n5["dl26"])
check("K5 SlowMist 2025", sm25, n5["sm25"])
check("K5 SlowMist Mar-Sep 2026", sm26, n5["sm26"])
check("K5 DeFiLlama 2025 per month", round(dl25 / 12, 1), n5["dl25_pm"])
check("K5 DeFiLlama 2026 per month", round(dl26 / 7, 1), n5["dl26_pm"])
check("K5 SlowMist 2025 per month", round(sm25 / 12, 1), n5["sm25_pm"])
check("K5 SlowMist 2026 per month", round(sm26 / 7, 1), n5["sm26_pm"])
ratio_usd = (n5["usd26"] / 7) / (n5["usd25"] / 12)
if not 1.3 <= ratio_usd <= 1.38:
    problems.append(f"K5 dollars per month ratio {ratio_usd:.2f} no longer matches 'about a third more per month'")
check("K5 monthly 2026 list", [x["defillama"] for x in months if x["year"] == 2026 and x["month"] >= 3], [26, 35, 45, 33, 39, 48, 37])
monthly_csv = ["ym,defillama_hacks,slowmist_incidents"] + [f"{x['ym']},{x['defillama']},{x['slowmist']}" for x in months]
(OUT / "attack_monthly_counts.csv").write_text("\n".join(monthly_csv) + "\n")

# AI evidence: each card pulls its URL and evidence grade from data/ai_incident_claims.csv
claims = rcsv(DATA / "ai_incident_claims.csv")
check("K6 claims", len(claims), k6["numeric"]["claims_n"])
grades = {}
for c in claims:
    grades[c["evidence_grade"]] = grades.get(c["evidence_grade"], 0) + 1
check("K6 grades", grades, k6["numeric"]["grades"])


def claim(date, start):
    hits = [c for c in claims if c["date"] == date and c["incident"].startswith(start)]
    if len(hits) != 1:
        problems.append(f"ai claim {date} {start!r}: {len(hits)} rows in ai_incident_claims.csv")
        return {"url": "", "grade": ""}
    return hits[0]


def card(date, start, kid, title, body, when, must):
    c = claim(date, start)
    src = byid[kid]
    # a canonical source may be a truncated prefix of the full URL in the claims log (K8 s1ngularity is): accept a prefix
    if c["url"] and not any(c["url"].startswith(x) for x in re.findall(r"https?://[^\s,;)]+", " ".join(src["sources"]))):
        problems.append(f"ai card {title}: {c['url']} is not among {kid} sources")
    for m in must:
        if m not in src["canonical_value"]:
            problems.append(f"ai card {title}: {m!r} not in {kid} canonical_value")
    return {"title": title, "body": body, "when": when, "url": c["url"], "grade": c["evidence_grade"], "id": kid}


ai = {
    "verified_exploits": k6["numeric"]["verified_in_the_wild_ai_exploits"],
    "claims_n": k6["numeric"]["claims_n"], "grades": k6["numeric"]["grades"],
    "scans": {k: k6["numeric"][k] for k in ("dhl_solidity_files_scanned", "dhl_scan_hits", "attacker_contracts_scanned", "attacker_contracts_with_llm_markers")},
    "capability": [
        card("2025-12-01", "Anthropic SCONE-bench", "K7", "SCONE-bench, Anthropic",
             "Ten models wrote working exploits for 207 of 405 historical contracts (51.1%, best of 8 attempts) in a simulator, worth $550.1M of simulated value.",
             "1 Dec 2025", ["207 of 405", "$550.1M"]),
        card("2025-07-08", "A1 exploit-generation agent", "K7", "A1 agent, Gervais and Zhou",
             "An agent exploited 63% of 36 real vulnerable contracts, up to $8.59M per exploit. The authors' simulation of historical attacks puts success at 86-89% if run at disclosure and 6-21% a week later.",
             "Jul 2025", ["63% success on 36", "$8.59M"]),
        card("2026-02-18", "EVMbench", "K7", "EVMbench, Paradigm and OpenAI",
             "Vendor-reported: top models exploited under 20% of critical Code4rena bugs earlier, and GPT-5.3-Codex over 70%.",
             "18 Feb 2026", ["under 20%", "over 70%"]),
    ],
    "attacker_use": [
        card("2025-11-05", "GTIG", "K8", "Google GTIG, UNC1069 and Gemini",
             "A North Korea-linked group used Gemini for crypto research, wallet-data locations and lures, and tried to develop crypto-theft code. Accounts were disabled.",
             "5 Nov 2025", ["UNC1069", "attempted to develop crypto-theft code"]),
        card("2025-08-27", "Anthropic threat report", "K8", "Anthropic, DPRK IT workers",
             "North Korean operatives used Claude to get and keep remote jobs at US tech firms. The report does not mention crypto theft.",
             "27 Aug 2025", ["remote jobs at US tech firms"]),
        card("2026-09-10", "Anthropic threat report Sep", "K8", "Anthropic, September 2026 threat report",
             "Covers December 2025 to August 2026. Documents AI-assisted exploit development, including automated exploit foundries run by a China-based espionage group against security appliances. It describes no in-the-wild crypto or DeFi exploit.",
             "10 Sep 2026", ["automated exploit foundries", "no in-the-wild crypto or DeFi exploit"]),
        card("2025-08-26", "Nx s1ngularity", "K8", "s1ngularity npm malware",
             "Malware in a popular build tool ran victims' installed claude, gemini and q command-line tools to hunt for wallet files and secrets.",
             "26 to 27 Aug 2025", ["s1ngularity", "wallet files"]),
        card("2025-06-18", "BlueNoroff/TA444", "K8", "Huntress, BlueNoroff deepfake Zoom",
             "An employee at a cryptocurrency foundation joined a Zoom call with several deepfakes of senior leaders from their own company and external contacts, who pushed a malicious extension.",
             "18 Jun 2025", ["BlueNoroff/TA444", "deepfakes"]),
    ],
    "not_counted": [
        {"title": "TRM Labs via Bloomberg on the April 2026 heists", "body": "Called AI help \"highly likely\" for the two April heists, reported as Drift and Kelp, with no evidence offered. Neither incident involved exploit code: Drift was a six-month social-engineering operation and Kelp a single verifier plus compromised RPC nodes.",
         "url": claim("2026-04-18", "Drift")["url"], "grade": "speculation"},
        {"title": "Chainalysis on unverified contracts", "body": "Says AI is \"likely accelerating\" attacks on four incidents worth $36.7M but attributes none of them to AI. Headlines that say otherwise overstate it.",
         "url": claim("2026-01-08", "Truebit")["url"], "grade": "speculation"},
        {"title": "Opinion pieces", "body": "Warnings from an Immunefi executive and a former OpenZeppelin CTO name no incident, transaction or protocol.",
         "url": claim("2026-06-11", "Immunefi")["url"], "grade": "speculation"},
    ],
}
for needle in ("TRM via Bloomberg", "\"highly likely\"", "Chainalysis on unverified contracts", "no incident attributed to AI"):
    if needle not in k6["canonical_value"]:
        problems.append(f"K6 text no longer contains {needle!r}")
if ai["grades"].get("speculation") != 6:
    problems.append("K6 speculation count changed")

attack = {
    "built_from": {"canonical_generated": canon["generated"], "entries": ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9"]},
    "sources": ["data/canonical_numbers.json (K1-K9)", "data/attack_contracts.csv", "data/ai_incident_claims.csv",
                "data/tables/t0b_monthly_counts_2024_2026.csv", "data/tables/t1b_vector_share_pct_dhl_sample.csv",
                "data/tables/t2c_ethereum_tornado_share_by_era.csv", "data/tables/t3_flash_loan_share_by_era.csv",
                "data/tables/t4_deploy_to_attack_lag_by_era.csv", "data/tables/t5_frontrun_protection_signals_by_era.csv",
                "data/tables/t9b_documented_copycat_waves.csv", "hacked.slowmist.io (parsed records)"],
    "k1": {"eras": k1rows, "precision": k1["numeric"]["precision_lenient"], "fp": k1["numeric"]["false_positive_removed"]},
    "k2": {"eras": k2rows},
    "k3": {"eras": [ERA_LABEL[e] for e in ERAS], "vectors": k3vec, "flash_pct": k3flash},
    "k4": {"eras": k4rows},
    "k5": {"months": months},
    "k9": {"wave": wave_rows, "other": k9other},
    "ai": ai,
}
(OUT / "attack.json").write_text(json.dumps(attack, ensure_ascii=False, indent=1) + "\n")

# ------------------------------------------------------------- downloads
DOWNLOADS = [
    ("canonical_numbers.json", "Canonical headline numbers with definitions, sources and confidence"),
    ("incidents_master.csv", "One row per incident (1,573 rows; in_headline=1 marks the 1,377 in the headline set, headline_scope=1 a wider 1,450)"),
    ("baseline/annual_totals.csv", "Losses and counts by year"),
    ("baseline/share_vector_by_year.csv", "Attack-vector shares by year, by dollars and by count"),
    ("baseline/recovery_by_year.csv", "Recovered and returned dollars by year"),
    ("baseline/recovery_channel_mix.csv", "Recovered dollars by channel"),
    ("baseline/dprk_by_year.csv", "DPRK-attributed losses by year and tier"),
    ("onchain_verification.csv", "Decoded on-chain negotiation messages and match verdicts"),
    ("onchain_returns.csv", "On-chain checks of return transactions"),
    ("negotiation_cases_public.csv", "Public negotiation and return cases"),
    ("recovery_events.csv", "Freezes, seizures, halts and rescues with timing"),
    ("law_enforcement_cases.csv", "Arrests, charges and outcomes by defendant"),
    ("law_enforcement_stats.json", "Arrest-rate and time-to-arrest statistics"),
    ("dprk_incidents.csv", "DPRK incidents with attribution tier, access vector and laundering path"),
    ("return_latency_audit.csv", "Re-audited timing of the 23 dated voluntary returns, with flags"),
    ("top100_master_enforcement.csv", "The 100 largest incidents with enforcement status and attribution source grade"),
    ("attack_contracts.csv", "758 reproducible EVM exploits (DeFiHackLabs) with attack contract, funding source, deploy-to-attack lag and same-transaction flags"),
    ("ai_incident_claims.csv", f"{len(claims)} AI-related claims about hacks, each graded verified, credible claim or speculation, with source links"),
    ("tables/t0b_monthly_counts_2024_2026.csv", "Monthly record counts, DeFiHackLabs and DeFiLlama, 2024 to October 2026"),
    ("tables/t1b_vector_share_pct_dhl_sample.csv", "Attack-vector shares by era in the DeFiHackLabs sample"),
    ("tables/t2c_ethereum_tornado_share_by_era.csv", "Ethereum attacker funding through Tornado Cash and Railgun, by sanctions era"),
    ("tables/t3_flash_loan_share_by_era.csv", "Flash-loan share of exploits by era"),
    ("tables/t4_deploy_to_attack_lag_by_era.csv", "Deploy-to-attack lag of attacker-deployed contracts, by era"),
    ("tables/t5_frontrun_protection_signals_by_era.csv", "Same-transaction (constructor) attack share and front-running signals, by era"),
    ("tables/t9b_documented_copycat_waves.csv", "Documented copycat waves: lending-market exploits (Compound- and Aave-style forks) and read-only reentrancy"),
]
downloads = []
for rel, desc in DOWNLOADS:
    src = DATA / rel
    dst = OUT / Path(rel).name
    shutil.copyfile(src, dst)
    downloads.append({"file": f"data/{dst.name}", "desc": desc, "bytes": dst.stat().st_size, "origin": f"data/{rel}"})

# SlowMist records: date and link only (the tracker is All Rights Reserved; its record text is not redistributed)
SM_KEEP = ["date", "ref_url"]
with open(OUT / "slowmist_parsed_2026-10-21.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=SM_KEEP, extrasaction="ignore")
    w.writeheader()
    w.writerows(sm_rows)
downloads.append({"file": "data/slowmist_parsed_2026-10-21.csv",
                  "desc": "SlowMist hack tracker records: date and reference link only (name, loss and method are not redistributed); used for monthly counts",
                  "bytes": (OUT / "slowmist_parsed_2026-10-21.csv").stat().st_size, "origin": "hacked.slowmist.io (description column removed)"})

# the generated attack.json and monthly counts are downloads too
for name, desc in [("attack.json", "Chart data and evidence cards behind the attack-anatomy section, generated from K1-K9"),
                   ("attack_monthly_counts.csv", "Monthly record counts, DeFiLlama and SlowMist, 2025 to September 2026")]:
    downloads.append({"file": f"data/{name}", "desc": desc, "bytes": (OUT / name).stat().st_size, "origin": "generated by site/build.py"})

# ------------------------------------------------------------ incident index (look-up box, dot field, famous hacks)
# One compact row per headline incident. Outcome sentences are composed in the browser from these fields only.
ENF_CODE = {"charged_for_hack": "c", "laundering_side_only": "l", "civil_or_regulatory_only": "v", "not_for_the_hack": "o",
            "none_found": "n", "not_checked": "u"}
REC_CODE = {"recovered_documented": "r", "recovered_unquantified": "q", "claimed_unverified": "c", "no_voluntary_return_found": "v",
            "no_public_record_found": "n", "no_recovery_in_sources_checked": "n", "unknown_not_checked": "u"}
CHAN_CODE = {"issuer / exchange / protocol freeze": "f", "law-enforcement seizure / court": "s", "white-hat / MEV rescue": "w",
             "chain-level: halt / validator / security council": "h", "chain-level: hard fork / rollback": "k", "other / unspecified": "o"}
ATTR_CODE = {"dprk_gov_attributed": 2, "dprk_firm_attributed": 1}
# researcher-list-only rows sit in the firm tier but D1 calls them leads, so they get their own code (3)
LEAD_GRADE = "firm_researcher_list_only"
SPLIT_CODE = dict(CHAN_CODE, **{"voluntary return (attacker/insider)": "r"})
RETURNER_CODE = {"attacker": "a", "bot operators": "b", "MEV builder": "m", "not identified": "x"}


def returner_code(r):
    """Who handed the money back, from the structured master column `returner`."""
    if r["returner"] not in RETURNER_CODE:
        problems.append(f"incident index: unknown returner {r['returner']!r} on {r['id']}")
    return RETURNER_CODE.get(r["returner"], "x")


def split_code(r):
    out = []
    for part in (r["channel_split"] or "").split(";"):
        if "=" not in part:
            continue
        k, v = part.rsplit("=", 1)
        k = k.strip()
        if k not in SPLIT_CODE:
            problems.append(f"incident index: unknown channel_split class {k!r} on {r['id']}")
            continue
        out.append(f"{SPLIT_CODE[k]}:{int(round(float(v)))}")
    return ",".join(out)


chains = []
inc_rows = []
for r in sorted(head, key=lambda r: (r["date"], r["id"])):
    loss = num(r["loss_usd_reported"])
    cap = num(r["recovered_usd_capped"]) or 0.0
    ret = min(num(r["returned_usd"]) or 0.0, loss, cap) if cap else 0.0
    oth = max(0.0, cap - ret)
    if r["id"] == "20250221-bybit":  # company-stated freeze total replaced by the corroborated figure (M2), as on the page
        oth = byid["M2"]["numeric"]["frozen_corroborated_usd"]
    for field, code, label in ((r["enforcement_status"], ENF_CODE, "enforcement_status"), (r["recovery_status"], REC_CODE, "recovery_status")):
        if field not in code:
            problems.append(f"incident index: unknown {label} {field!r} on {r['id']}")
    if oth and r["channel_class"] and r["channel_class"] not in CHAN_CODE:
        problems.append(f"incident index: unknown channel_class {r['channel_class']!r} on {r['id']}")
    chain = r["chain"].strip()
    if chain not in chains:
        chains.append(chain)
    m_alias = re.match(r"^(.*?) \(DeFiLlama name: (.*)\)$", r["name"])
    name, alias = (m_alias.group(1), m_alias.group(2)) if m_alias else (r["name"], "")
    dprk = ATTR_CODE.get(r["attribution"], 0)
    if dprk == 1 and r["attribution_source_grade"] == LEAD_GRADE:
        dprk = 3
    # evidence: "" fully checked in the 2026-10-21 pass, p checked in part only, x amount not verified
    ev = "" if r["outcome_checked"] == "full" else "p"
    if (ret > 0 or oth > 0) and r["verified_check"] == "not_corroborated":
        ev = "x"
    row = [r["id"], name, int(loss), chains.index(chain), ENF_CODE.get(r["enforcement_status"], "u"), REC_CODE.get(r["recovery_status"], "u"),
           int(round(ret)), int(round(oth)), CHAN_CODE.get(r["channel_class"], "o") if oth else "", dprk, alias,
           r["date"] if r["id"][:8] != r["date"].replace("-", "")[:8] else "",
           returner_code(r) if ret > 0 else "", ev, split_code(r) if oth else ""]
    while row[-1] == "":
        row.pop()
    inc_rows.append(row)
if len(inc_rows) != byid["S1"]["numeric"]["n"]:
    problems.append("incident index row count != S1 n")
if sum(1 for r in inc_rows if r[4] == "c") != byid["E2"]["numeric"]["master_all"][0]:
    problems.append("incident index charged count != E2")
if sum(1 for r in inc_rows if r[9] == 2) != byid["D1"]["numeric"]["gov"]["n"]:
    problems.append("incident index DPRK government count != D1")
if abs(sum(r[6] for r in inc_rows) - byid["R2"]["numeric"]["voluntary_usd"]) > 2e6:
    problems.append("incident index returned dollars != R2")
inc_ids = {r[0] for r in inc_rows}
FAMOUS = ["20250221-bybit", "20220323-ronin-bridge", "20210810-poly-network", "20230313-euler-v1", "20221112-ftx", "20220202-portal"]
FAMOUS_LABEL = {"20221112-ftx": "FTX hack"}
STRIP_QUOTES = [{"rank": 7, "id": "20230313-euler-v1"}, {"rank": 11, "id": "20220605-wintermute"}, {"rank": 8, "id": "20231122-kyberswap-elastic"}]
for i in FAMOUS + [q["id"] for q in STRIP_QUOTES]:
    if i not in inc_ids:
        problems.append(f"incident index: {i} missing")
for q in STRIP_QUOTES:
    if q["rank"] not in {x["rank"] for x in quotes}:
        problems.append(f"quote strip: rank {q['rank']} missing")
# Authored outcome lines for the incidents shown in the famous strip and the message strip (and wherever else they come up).
# Amounts come from the index row or the canonical value named in new-copy-manifest.md; the qualifications come from the
# recovery and arrest columns of incidents_master.csv and the 2026-10-21 copy check. The generic builder in hero.js covers the rest.
byrow = {r[0]: r for r in inc_rows}
mrow = {r["id"]: r for r in head}


def fm(v, d=0):
    t = f"{v / 1e6:.{d}f}"
    return "$" + (t.rstrip("0").rstrip(".") if "." in t else t) + "M"


def expect(i, enf, rec=None):
    if byrow[i][4] != enf or (rec and byrow[i][5] != rec):
        problems.append(f"outcome line: {i} coding changed (enf {byrow[i][4]}, rec {byrow[i][5]}); rewrite its line")


if "Tether" not in mrow["20221112-ftx"]["recovered_channel"]:
    problems.append("outcome line: FTX recovered_channel no longer names the Tether freeze")
if "Buterin" not in mrow["20220605-wintermute"]["recovered_channel"]:
    problems.append("outcome line: Wintermute recovered_channel no longer names the Buterin return")
for i, e, rc in (("20250221-bybit", "n", "r"), ("20220323-ronin-bridge", "n", "r"), ("20230313-euler-v1", "n", "r"),
                 ("20221112-ftx", "c", "r"), ("20220202-portal", "n", "r"), ("20220605-wintermute", "n", "r"), ("20231122-kyberswap-elastic", "c", "r")):
    expect(i, e, rc)
NOARR = "No arrest or charge for the hack found."
# Poly Network (about $578M returned, about $33M frozen) and the other famous rows without a line here use the generic builder in hero.js.
lines = {
    "20250221-bybit": f"Bybit reported {fm(byid['M2']['numeric']['frozen_corroborated_usd'], 1)} frozen in the first days. {NOARR}",
    "20220323-ronin-bridge": f"At least {fm(byrow['20220323-ronin-bridge'][7])} seized, according to Chainalysis. {NOARR}",
    "20230313-euler-v1": f"Stolen assets valued at about {fm(byrow['20230313-euler-v1'][2])} at the time of the hack were recovered. No arrest or charge for this hack found.",
    "20221112-ftx": f"Three people were charged in the SIM-swap theft linked to FTX. Tether froze about {fm(byrow['20221112-ftx'][7], 1)} of the stolen USDT.",
    "20220202-portal": f"About {fm(byrow['20220202-portal'][7])} net recovered under a court order in February 2023. {NOARR}",
    "20220605-wintermute": f"The attacker returned 17M OP (about {fm(byrow['20220605-wintermute'][6], 2)}); another 1M OP (about {fm(byrow['20220605-wintermute'][7], 2)}) came back through Buterin. No arrest or charge for this hack found.",
    "20231122-kyberswap-elastic": f"Bot operators returned about {fm(byrow['20231122-kyberswap-elastic'][6], 2)}; another ${byrow['20231122-kyberswap-elastic'][7]:,} was rescued from locked pools. The main exploiter was charged.",
}
incidents = {"chains": chains, "rows": inc_rows, "famous": FAMOUS, "famous_label": FAMOUS_LABEL, "strip": STRIP_QUOTES, "lines": lines}

bundle = {
    "built_from": {"canonical_generated": canon["generated"], "snapshot": canon["data_snapshot"]},
    "canon": canon, "derived": derived, "facts": facts,
    "charts": {"annual": annual, "openings": openings, "returns": returns, "clock": clock_rows, "clock_src": clock_src,
               "top100": top100, "top100_counts": top100_counts, "dprk_access": dprk_access, "defences": defences, "cases": cases_tl,
               "outcomes": les["individual_outcomes"], "outcomes_detail": les["individual_outcomes_detail"],
               "arrests": sorted(arrests, key=lambda a: a["days"])},
    "quotes": quotes, "attack": attack, "downloads": downloads, "inc": incidents,
}
OUT.mkdir(exist_ok=True)
(OUT / "bundle.js").write_text("window.ATH = " + json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + ";\n")
(OUT / "quotes.json").write_text(json.dumps(quotes, ensure_ascii=False, indent=1))

if problems:
    print("BUILD PROBLEMS:", *problems, sep="\n  ")
    sys.exit(1)
print(f"ok: {len(quotes)} quotes, {len(derived)} derived, {len(facts)} facts, {len(downloads)} downloads, attack={'yes' if attack else 'no'}")
