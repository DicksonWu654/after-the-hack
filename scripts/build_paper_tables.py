#!/usr/bin/env python3
"""Fill the generated tables of paper/source/after-the-hack.tables.md from the project CSV/JSON files.

The paper holds placeholder blocks of the form

    <!-- TABLE:name -->
    ...generated markdown...
    <!-- /TABLE:name -->

This script recomputes every block from data/ and rewrites the paper in place, so prose can be edited freely and
tables are never hand-typed. It also runs consistency checks against data/canonical_numbers.json (headline totals)
and aborts if a table disagrees with a canonical number.

Usage:
    python3 -I scripts/build_paper_tables.py            # rewrite the paper's table blocks
    python3 -I scripts/build_paper_tables.py --check    # recompute and compare, exit 1 if the paper is stale
    python3 -I scripts/build_paper_tables.py --list     # list available table names
"""
import csv
import json
import os
import re
import statistics
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")
PAPER = os.path.join(ROOT, "paper", "source", "after-the-hack.tables.md")


# ---------------------------------------------------------------- helpers
def rows(path):
    with open(os.path.join(D, path), encoding="utf8", newline="") as f:
        return list(csv.DictReader(f))


def jload(path):
    with open(os.path.join(D, path), encoding="utf8") as f:
        return json.load(f)


def usd(v, dec=None):
    """Compact USD: $1.66B, $610M, $4.5M, $820k."""
    v = float(v)
    a = abs(v)
    if a >= 1e9:
        return "$%.2fB" % (v / 1e9)
    if a >= 1e6:
        d = 0 if a >= 1e8 else 1
        s = ("%." + str(d) + "f") % (v / 1e6)
        if s.endswith(".0"):
            s = s[:-2]
        return "$%sM" % s
    if a >= 1e3:
        return "$%dk" % round(v / 1e3)
    return "$%d" % round(v)


def pct(v, d=1):
    return ("%." + str(d) + "f%%") % float(v)


def esc(s):
    return (s or "").replace("|", "/").replace("\n", " ").strip()


def table(header, body, align=None):
    align = align or ["l"] + ["r"] * (len(header) - 1)
    sep = ["---:" if a == "r" else ":---" for a in align]
    out = ["| " + " | ".join(header) + " |", "|" + "|".join(sep) + "|"]
    for r in body:
        out.append("| " + " | ".join(str(c) for c in r) + " |")
    return "\n".join(out)


def headline_rows():
    """Use the explicit 1,377-row headline membership flag, in_headline=1."""
    out = []
    for x in rows("incidents_master.csv"):
        if x["in_headline"] != "1" or not ("2016" <= x["date"][:4] <= "2026"):
            continue
        try:
            x["L"] = float(x["loss_usd_reported"])
        except ValueError:
            continue
        if x["L"] <= 0:
            continue
        out.append(x)
    return out


H = headline_rows()
SUMMARY = jload("baseline/headline_summary.json")
CANON = jload("canonical_numbers.json")


def check(cond, msg):
    if not cond:
        sys.exit("CONSISTENCY CHECK FAILED: " + msg)


# canonical anchors (S1: headline incident count, total loss and the count of incidents of $1M or more)
_S1 = next(n for n in CANON["numbers"] if n["id"] == "S1")["numeric"]
N_HEAD = _S1["n"]
check(len(H) == N_HEAD, "headline incident count %d != canonical S1 n %d" % (len(H), N_HEAD))
check(abs(sum(x["L"] for x in H) - _S1["total_usd"]) < 1, "headline loss %.0f != canonical S1 total %d" % (sum(x["L"] for x in H), _S1["total_usd"]))

VEC_LABEL = {
    "private-key/compromised-infra": "Private key / compromised infrastructure",
    "smart-contract logic": "Smart-contract logic",
    "social-engineering": "Social engineering",
    "supply-chain": "Supply chain",
    "oracle/price-manipulation": "Oracle / price manipulation",
    "access-control": "Access control",
    "reentrancy": "Reentrancy",
    "rug/insider": "Rug pull / insider",
    "other": "Other",
}
CAT_LABEL = {"defi": "DeFi protocol", "cex": "Centralized exchange", "bridge": "Bridge", "other": "Other", "wallet": "Wallet"}
ATTR_LABEL = {
    "dprk_gov_attributed": "DPRK, government-attributed",
    "dprk_firm_attributed": "DPRK, firm-attributed",
}


# ---------------------------------------------------------------- tables
def t_verification_effect():
    a = jload("baseline/headline_before_verification_pass.json")
    b = SUMMARY
    def r(label, fb, fa):
        return [label, fb, fa]
    body = [
        r("Loss in scope", "%s, %s incidents" % (usd(a["all"]["loss"]), f"{a['all']['n']:,}"), "%s, %s incidents" % (usd(b["all"]["loss"]), f"{b['all']['n']:,}")),
        r("Recovered, all channels (counted USD, capped at 100% per incident)", "%s (%s)" % (usd(a["all"]["recovered"]), pct(a["all"]["pct_all"])), "%s (%s)" % (usd(b["all"]["recovered"]), pct(b["all"]["pct_all"]))),
        r("Recovered share excluding chain-level interventions", pct(a["all"]["pct_ex_chain"]), pct(b["all"]["pct_ex_chain"])),
        r("Recovered share excluding the three largest recoveries", pct(a["all"]["pct_ex_top3"]), pct(b["all"]["pct_ex_top3"])),
        r("Incidents of $1M or more with a documented recovery", "%d of %d (%s)" % (a["all"]["n_ge1m_documented"], a["all"]["n_ge1m"], pct(a["all"]["pct_count_ge1m"])), "%d of %d (%s)" % (b["all"]["n_ge1m_documented"], b["all"]["n_ge1m"], pct(b["all"]["pct_count_ge1m"]))),
        r("Top 150 by loss: recovered share of loss", pct(a["top150"]["pct_all"]), pct(b["top150"]["pct_all"])),
        r("DPRK, government-attributed", "%d incidents, %s (%s)" % (a["dprk"]["n_gov"], usd(a["dprk"]["loss_gov"]), pct(a["dprk"]["pct_gov"])), "%d incidents, %s (%s)" % (b["dprk"]["n_gov"], usd(b["dprk"]["loss_gov"]), pct(b["dprk"]["pct_gov"]))),
        r("DPRK, government plus firm attributed", "%d incidents, %s (%s)" % (a["dprk"]["n_gov_firm"], usd(a["dprk"]["loss_gov_firm"]), pct(a["dprk"]["pct_gov_firm"])), "%d incidents, %s (%s)" % (b["dprk"]["n_gov_firm"], usd(b["dprk"]["loss_gov_firm"]), pct(b["dprk"]["pct_gov_firm"]))),
        r("DPRK vs non-DPRK recovered share of loss", "%s vs %s" % (pct(a["dprk"]["recovered_pct_dprk"]), pct(a["dprk"]["recovered_pct_non_dprk"])), "%s vs %s" % (pct(b["dprk"]["recovered_pct_dprk"]), pct(b["dprk"]["recovered_pct_non_dprk"]))),
    ]
    return table(["Measure", "Before: first-layer master", "After: verified master"], body, ["l", "l", "l"])


def t_verified_check():
    cc = SUMMARY["top150"]["verified_check"]
    meaning = {
        "verified_agree": "the verification pass agrees with the first-layer values (a press or firm source matches within about 15%)",
        "corrected": "value, classification or scope changed by the verification pass",
        "checked_none_found": "the pass searched and found no recovery or claim; the master also records none",
        "not_corroborated": "master carries a recovery claim that the pass could not corroborate; kept and flagged",
        "": "not re-checked (entered the top 150 after scope changes)",
    }
    order = ["verified_agree", "corrected", "checked_none_found", "not_corroborated", ""]
    body = []
    for k in order:
        n, usdv = cc[k]
        body.append([k if k else "not re-checked", n, usd(usdv) if usdv else "$0", meaning[k]])
    return table(["Verification verdict (top 150 by loss)", "Incidents", "Counted recovered", "Meaning"], body, ["l", "r", "r", "l"])


def t_coverage():
    body = []
    for x in rows("baseline/outcome_check_coverage.csv"):
        body.append([
            x["scope"], f"{int(x['n']):,}", x["n_full"], x["n_partial"], x["n_none"], x["n_recovered_any"],
            usd(x["recovered_usd"]), pct(x["recovered_pct_of_all_loss"]),
        ])
    return table(["Scope", "Incidents", "Outcome check full", "Partial", "None", "With a recovery", "Recovered (counted USD)", "Share of loss"], body)


def t_annual():
    body = []
    tn = tl = 0
    for x in rows("baseline/annual_totals.csv"):
        y = x["year"] + (" (to 21 Oct)" if x["year"] == "2026" else "")
        tn += int(x["n_incidents"])
        tl += float(x["loss_usd"])
        body.append([y, x["n_incidents"], usd(x["loss_usd"]), x["n_ge_1M"], usd(x["median_usd"]), "%s %s" % (x["largest_name"], usd(x["largest_usd"]))])
    check(tn == N_HEAD, "annual total n %d" % tn)
    body.append(["**All**", "**%s**" % f"{tn:,}", "**%s**" % usd(tl), "**%d**" % _S1["n_ge_1m"], "", ""])
    return table(["Year", "Incidents", "Loss (USD at the time)", "Incidents of $1M or more", "Median incident", "Largest incident"], body, ["l", "r", "r", "r", "r", "l"])


def t_sources():
    body = []
    for x in rows("baseline/source_comparison.csv"):
        if int(x["year"]) < 2021:
            continue
        pub = x["published_totals"] or "n/a"
        pub = re.sub(r"(?<![\w$.])(\d+(?:\.\d+)?B)", r"$\1", pub)
        body.append([x["year"], "%s (%s)" % (usd(x["this_dataset_usd"]), x["this_dataset_n"]), "%s (%s)" % (usd(x["defillama_raw_usd_excl_lubian"]), x["defillama_raw_n"]), esc(pub)])
    return table(["Year", "This dataset: loss (incidents)", "DeFiLlama raw, excluding LuBian (rows)", "Published totals (Chainalysis, CertiK, TRM)"], body, ["l", "r", "r", "l"])


def _share_table(key, labels, header):
    cnt = defaultdict(int)
    loss = defaultdict(float)
    for x in H:
        cnt[x[key]] += 1
        loss[x[key]] += x["L"]
    T = sum(loss.values())
    body = []
    for k in sorted(loss, key=lambda k: -loss[k]):
        body.append([labels.get(k, k), f"{cnt[k]:,}", pct(100 * cnt[k] / len(H)), usd(loss[k]), pct(100 * loss[k] / T)])
    body.append(["**All**", "**%s**" % f"{len(H):,}", "**100%**", "**%s**" % usd(T), "**100%**"])
    return table([header, "Incidents", "Share of incidents", "Loss", "Share of loss"], body)


def t_vector():
    # canonical V1 anchors
    loss = defaultdict(float)
    for x in H:
        loss[x["vector"]] += x["L"]
    T = sum(loss.values())
    _V1 = next(n for n in CANON["numbers"] if n["id"] == "V1")["numeric"]["pct_dollars"]
    check(round(100 * loss["private-key/compromised-infra"] / T, 1) == _V1["private-key/compromised-infra"], "V1 key share")
    check(round(100 * loss["smart-contract logic"] / T, 1) == _V1["smart-contract logic"], "V1 contract share")
    return _share_table("vector", VEC_LABEL, "Attack vector")


def t_category():
    loss = defaultdict(float)
    for x in H:
        loss[x["category"]] += x["L"]
    T = sum(loss.values())
    check(round(100 * loss["defi"] / T, 1) == next(n for n in CANON["numbers"] if n["id"] == "V2")["numeric"]["pct_dollars"]["defi"], "V2 defi share")
    return _share_table("category", CAT_LABEL, "Target type")


def t_vector_year():
    sv = rows("baseline/share_vector_by_year.csv")
    by = defaultdict(dict)
    for x in sv:
        by[x["year"]][x["vector"]] = float(x["pct_of_year_loss"])
    cols = ["private-key/compromised-infra", "smart-contract logic", "social-engineering", "supply-chain"]
    body = []
    for y in sorted(by):
        other = sum(v for k, v in by[y].items() if k not in cols)
        body.append([y + (" (to 21 Oct)" if y == "2026" else "")] + [pct(by[y].get(c, 0)) for c in cols] + [pct(other)])
    return table(["Year", "Key / infrastructure", "Contract logic", "Social engineering", "Supply chain", "All other"], body)


def t_top20():
    body = []
    short = {"dprk_gov_attributed": "DPRK (gov)", "dprk_firm_attributed": "DPRK (firm)", "unknown": "none", "other_known": "other"}
    for x in rows("baseline/top20.csv"):
        rec = "none documented"
        if float(x["recovered_usd_at_time"] or 0) > 0:
            rec = "%s (%s)" % (pct(x["recovered_pct"]), usd(x["recovered_usd_at_time"]))
        name = re.sub(r"\s*\(DeFiLlama name:.*?\)", "", x["name"])
        body.append([x["rank"], x["date"], name, usd(x["loss_usd"]), x["vector"], short.get(x["attribution"], x["attribution"]), rec])
    return table(["#", "Date", "Incident", "Loss", "Vector", "Attribution tier", "Recovered"], body, ["r", "l", "l", "r", "l", "l", "r"])


def t_open_pct():
    body = []
    for x in rows("negotiation_tables/paper_table__terms__opening_pct_by_year.csv"):
        body.append([x["year"], x["n"], "%g%%" % float(x["median"]), x["exactly_10"], pct(100 * float(x["share_exactly_10"]), 0), x["ge_20"], pct(100 * float(x["share_ge_20"]), 0)])
    return table(["Year", "Openings", "Median offer", "Exactly 10%", "Share exactly 10%", "20% or more", "Share 20% or more"], body)


def t_return_year():
    body = []
    for x in rows("negotiation_tables/paper_table__prev__any_return_by_year.csv"):
        body.append([x["year"], x["yes"], x["no"], x["unknown"], pct(100 * float(x["share_of_known"]))])
    return table(["Year", "Returned", "Not returned", "Unresolved", "Share of known outcomes"], body)


def t_outreach():
    body = []
    lab = {"yes": "Team reached out", "no": "No outreach", "unknown": "Outreach unknown"}
    for x in rows("negotiation_tables/paper_table__cond__return_by_outreach.csv"):
        if x["stratum"] != "pooled":
            continue
        body.append([lab[x["team_reached_out"]], x["yes"], x["no"], x["unknown"], x["known"], pct(100 * float(x["share_of_known"]))])
    return table(["Incident group", "Returned", "Not returned", "Unresolved", "Known outcomes", "Share of known"], body)


def t_settlements():
    body = []
    vals = []
    for x in rows("negotiation_cases_public.csv"):
        if x["in_settlement_split_stats"] != "y":
            continue
        rs = float(x["returned_share_of_loss"])
        if x.get("frozen_or_seized_usd"):
            rs = min(1.0, (float(x["returned_usd"]) + float(x["frozen_or_seized_usd"])) / float(x["loss_usd"]))
        vals.append(1 - rs)
        body.append([x["incident"], x["incident_date"][:7], usd(x["loss_usd"]), pct(100 * rs), pct(100 * (1 - rs))])
    med = statistics.median(vals)
    check(len(vals) == 10, "settlement sample n=%d" % len(vals))
    check(round(100 * med, 1) == 3.0, "median retained %.2f" % (100 * med))
    body.append(["**Median (n=10)**", "", "", pct(100 * (1 - med)), "**%s**" % pct(100 * med)])
    return table(["Incident", "Month", "Loss", "Share recovered", "Share retained"], body)


def _rv(x):
    try:
        R = float(x["recovered_usd_capped"]) if x.get("recovered_usd_capped") not in ("", None) else 0.0
    except ValueError:
        R = 0.0
    R = min(x["L"], R)
    ret = float(x["returned_usd"]) if x["returned_usd"] not in ("", None) else 0.0
    return min(R, ret)


def t_voluntary_top():
    items = sorted(((_rv(x), x) for x in H), key=lambda t: -t[0])
    total = sum(v for v, _ in items)
    check(abs(total - SUMMARY["voluntary"]["total"]) < 1e5, "voluntary total %s" % total)
    body = []
    for v, x in items[:10]:
        body.append([re.sub(r"\s*\(DeFiLlama name:.*?\)", "", x["name"]), x["date"][:4], usd(x["L"]), usd(v), pct(100 * v / x["L"]), pct(100 * v / total)])
    body.append(["**All voluntary returns (%d incidents)**" % sum(1 for v, _ in items if v > 0), "", "", "**%s**" % usd(total), "", "**100%**"])
    return table(["Incident", "Year", "Loss", "Returned voluntarily (counted USD)", "Share of that loss", "Share of all voluntary dollars"], body)


def t_recovery_year():
    body = []
    for x in rows("baseline/recovery_by_year.csv"):
        body.append([
            {"2026": "2026 (to 21 Oct)", "ALL": "**All**"}.get(x["year"], x["year"]), usd(x["loss_all"]), usd(x["recovered_usd_at_time"]), pct(x["recovered_pct_of_all_loss"]),
            usd(x["voluntary_returned_usd"]), x["n_ge_1M"], x["n_ge_1M_recovered_documented"], pct(x["pct_count_documented_of_ge_1M"]), x["n_ge_1M_unknown_not_checked"],
        ])
    return table(["Incident year", "Loss", "Recovered (any channel)", "Share of loss", "of which voluntary", "Incidents of $1M or more", "with documented recovery", "Share", "never outcome-checked"], body)


def t_sensitivity():
    body = []
    for x in rows("baseline/recovery_sensitivity.csv"):
        top = re.sub(r"\s*\(DeFiLlama name:.*", "", x["top_recovery_incident"])
        body.append([x["year"], pct(x["recovered_pct_all"]), pct(x["recovered_pct_excl_chain_level_containment"]), pct(x["recovered_pct_excl_top_recovery_incident_from_num_and_denom"]), pct(x["recovered_pct_excl_top3_recovery_incidents_from_num_and_denom"]), "%s (%s)" % (top, usd(x["top_recovery_usd"]))])
    return table(["Incident year", "All channels", "Excluding chain-level interventions", "Excluding largest recovery", "Excluding three largest", "Largest recovery"], body)


def t_channels():
    allc = {x["channel"]: x for x in rows("baseline/recovery_channel_mix.csv")}
    t150 = {x["channel"]: x for x in rows("baseline/top150_recovery_channel_mix.csv")}
    body = []
    for ch, x in allc.items():
        y = t150[ch]
        body.append([ch, usd(x["recovered_usd_at_time"]), x["n_incidents"], pct(x["pct_of_recovered_usd"]), usd(y["recovered_usd_at_time"]), y["n_incidents"], pct(y["pct_of_recovered_usd"])])
    tot = sum(float(x["recovered_usd_at_time"]) for x in allc.values())
    tot150 = sum(float(x["recovered_usd_at_time"]) for x in t150.values())
    body.append(["**Total**", "**%s**" % usd(tot), "", "**100%**", "**%s**" % usd(tot150), "", "**100%**"])
    return table(["Allocated recovery channel", "All scope: recovered", "Incidents", "Share", "Top 150: recovered", "Incidents", "Share"], body)


def t_speed():
    ev = [x for x in rows("recovery_events.csv") if x["include_in_sums"] == "y" and x["days_after_incident"]]
    by = defaultdict(list)
    for x in ev:
        by[x["channel"]].append(float(x["days_after_incident"]))
    names = {
        "chain_intervention": "Chain halt, validator freeze, fork or rollback",
        "protocol_freeze_or_pause": "Protocol freeze or pause",
        "stablecoin_issuer_freeze": "Stablecoin issuer freeze",
        "whitehat_rescue": "White-hat rescue",
        "exchange_freeze": "Exchange freeze",
        "multi_channel_freeze": "Multi-channel freeze (Bybit, Bitget)",
        "law_enforcement_seizure": "Law-enforcement seizure",
        "unspecified_recovery": "Other recovery (innocent recipient return)",
    }
    order = ["protocol_freeze_or_pause", "whitehat_rescue", "chain_intervention", "stablecoin_issuer_freeze", "exchange_freeze", "multi_channel_freeze", "unspecified_recovery", "law_enforcement_seizure"]
    f1 = next(x["numeric"] for x in CANON["numbers"] if x["id"] == "F1")
    check(statistics.median(by["law_enforcement_seizure"]) == f1["median_days"]["law_enforcement_seizure"], "LE seizure median")
    check(statistics.median(by["chain_intervention"]) == 1, "chain median")
    check(statistics.median(by["exchange_freeze"]) == 3, "exchange median")

    def d(v):
        return ("%g" % v)

    body = []
    for k in order:
        v = by[k]
        body.append([names[k], len(v), d(statistics.median(v)), "%s to %s" % (d(min(v)), d(max(v)))])
    return table(["Action", "Counted events with a date", "Median days after the incident", "Range (days)"], body, ["l", "r", "r", "r"])


def t_dprk_year():
    body = []
    for x in rows("baseline/dprk_by_year.csv"):
        y = x["year"]
        if y.upper() == "ALL":
            y = "**All**"
        body.append([y, x["n_gov"], usd(x["loss_gov"]), pct(x["pct_loss_gov"]), x["n_firm"], usd(x["loss_firm"]), pct(x["pct_loss_gov_or_firm"])])
    return table(["Year", "Gov-attributed incidents", "Gov-attributed loss", "Share of year loss", "Firm-attributed incidents", "Firm-attributed loss", "Share of year loss, gov plus firm"], body)


def t_time_arrest():
    st = jload("law_enforcement_stats.json")
    cases = {c["case_id"]: c for c in rows("law_enforcement_cases.csv")}
    # E3 set membership (canonical_numbers.json E3.numeric.e3_set): which of the 16 are in the headline scope / the E2 set
    e3 = {x["key"]: x for x in next(n for n in CANON["numbers"] if n["id"] == "E3")["numeric"]["e3_set"]}
    items = []
    for key, days in st["time_to_first_person_action_days_by_incident"].items():
        cid = key if key in cases else key + "-1"
        if key == "GOX":
            cid = "GOX-3"
        c = cases[cid]
        check(int(float(c["days_from_incident_to_first_action"])) == int(days), "days mismatch %s" % cid)
        items.append((days, c, e3[key]))
    items.sort(key=lambda t: t[0])
    check(statistics.median([d for d, _, _ in items]) == st["time_median_days"], "arrest median")
    in_scope = [d for d, _, e in items if e["in_headline_scope"]]
    overlap = [d for d, _, e in items if e["in_e2_set"]]
    check(len(in_scope) == 14 and statistics.median(in_scope) == 439.5, "in-scope arrest median 439.5 (n=14)")
    check(len(overlap) == 11 and statistics.median(overlap) == 439, "E2-overlap arrest median 439 (n=11)")
    body = []
    for days, c, e in items:
        inc = re.sub(r"\s*\(.*", "", c["incident"])
        if e["in_e2_set"]:
            scope = "yes (one of the 16 in Section 6.1)"
        elif e["in_headline_scope"]:
            scope = "in the headline scope; laundering-side or detention only"
        else:
            scope = "no (pre-2016 incident, outside the headline set)"
        body.append([inc, c["incident_date"][:4], "{:,}".format(int(days)), esc(c["action_type"])[:70], c["evidence_grade"], scope])
    n = lambda v: "{:,}".format(round(v))
    body.append(["**Median, this sample (n=16)**", "", "**%s**" % n(st["time_median_days"]), "mean %s; interquartile range %s to %s" % (n(st["time_mean_days"]), n(st["time_q1_q3"][0]), n(st["time_q1_q3"][1])), "", ""])
    body.append(["**Median, 2016+ incidents inside the headline scope (n=14)**", "", "**%g**" % statistics.median(in_scope), "drops Mt. Gox and Silk Road", "", ""])
    body.append(["**Median, the 11 also in the 16 of Section 6.1**", "", "**%g**" % statistics.median(overlap), "charged for the hack itself", "", ""])
    return table(["Incident", "Year", "Days to first public action against a person", "First action", "Evidence grade", "Counted in the %d of %s?" % (next(n for n in CANON["numbers"] if n["id"] == "E2")["numeric"]["master_all"][0], f"{N_HEAD:,}")], body, ["l", "r", "r", "l", "l", "l"])


def t_outcomes():
    st = jload("law_enforcement_stats.json")
    det = st["individual_outcomes_detail"]
    lab = {
        "convicted_or_pleaded": st["individual_outcome_labels"]["convicted_or_pleaded"],
        "conviction_vacated_or_acquitted_appeal_pending": "Conviction vacated or acquitted, US appeal pending",
        "acquitted": "Acquitted",
        "pending": "Pending",
        "outcome_unknown": "Outcome unknown",
        "at_large_or_not_in_custody": "Charged, not in custody",
    }
    order = list(lab)
    check(sum(st["individual_outcomes"].values()) == 23, "23 individuals")
    body = []
    for k in order:
        names = det.get(k, [])
        label = st["individual_outcome_labels"].get(k, lab[k])
        body.append([label, st["individual_outcomes"][k], esc("; ".join(names))])
    body.append(["**Total**", "**23**", ""])
    return table(["Outcome", "People", "Who"], body, ["l", "r", "l"])


def t_canonical():
    body = []
    for n in CANON["numbers"]:
        body.append([n["id"], esc(n["question"]), esc(n["canonical_value"]), n["confidence"]])
    return table(["Id", "Question", "Canonical value (definition in the project file)", "Confidence"], body, ["l", "l", "l", "l"])


RECENT_TAG = {
    "Infini": "20% offered; no public acceptance found through 21 Oct 2026",
    "Bybit": "FBI named DPRK in 5 days; about $42.9M frozen (corroborated; the company later claimed $78.9M, 5.4%); make-whole from balance sheet",
    "KiloEx": "10% offer; returned in about 3 days",
    "Loopscale": "10% plus release; reported full recovery in 2 days (split unverified)",
    "Cetus (Sui)": "no public reply found through 21 Oct 2026 to a roughly $6M offer; validators froze $162M",
    "GMX V1": "10% for 90% back in 48h; accepted (on chain)",
    "Verus-Ethereum Bridge": "24h offer; 4,052 ETH returned, 1,350 ETH kept (on chain)",
    "Renegade": "10% offer; over 90% returned in 45 minutes",
    "Ostium": "no public negotiation found through 21 Oct 2026; $650k recovered, channel unstated",
    "Wanchain (Cardano-BNB bridge)": "10% offer; no public return found through 21 Oct 2026",
    "AFX Bridge": "30% offer; no public return found through 21 Oct 2026",
    "Coldcard seed-generation thefts": "white hats secured 52.37 BTC; no public attacker negotiation found through 21 Oct 2026",
    "Moonwell (MAMO market, Base)": "no public bounty, negotiation or return found through 21 Oct 2026",
    "Tectonic / Cronos": "detected about 36 minutes in, then chain halted and rolled back; $111.2M restored",
    "Liquid Network (Blockstream)": "3,400 BTC returned; 598.5 BTC withheld; provider swaps enabled 20 Oct, federation peg-outs restricted",
    "Bitget": "about $340k frozen by issuers (CEO claims about $1.07M); no public negotiation found through 21 Oct 2026",
    "NEAR Intents": "told publicly \"We have identified you\" (not named); 48h ultimatum; 100% returned",
    "79thVault (79AU, BNB Chain)": "10% message (authenticity doubted); 92.3% returned (single source)",
    "Drift Protocol": "no public return or freeze found through 21 Oct 2026; Tether finances reimbursement",
    "Kelp DAO (rsETH/LayerZero)": "Arbitrum Council froze 30,766 ETH (about $71M); court restraint",
}


# Loss labels where the master/CSV figure differs from the canonical wording (see data/canonical_numbers.json M1, M2, M3)
RECENT_LOSS = {"Bybit": "$1.46B", "Liquid Network (Blockstream)": "~$320M", "Bitget": "$387M"}
# Verification status per case (data/briefs/onchain-verification.md)
RECENT_VERIF = {
    "GMX V1": "offer and reply decoded on chain; amounts reported",
    "Verus-Ethereum Bridge": "offer and returns decoded on chain",
    "Liquid Network (Blockstream)": "attacker messages decoded on chain; amounts reported",
    "Bybit": "FBI PSA is primary; recovery figures reported",
    "Makina": "offer and return decoded on chain",
    "ChainConnect": "acceptance and return decoded on chain",
}
# Incident dates where the sibling negotiation file differs from the master/on-chain date
# (Verus: drain at block 25118335, 2026-05-17T23:55:23Z; data/canonical_numbers.json R4 alt_figures)
RECENT_DATE = {"Verus-Ethereum Bridge": "2026-05-17"}
# Two on-chain-verified cases that are not rows of negotiation_cases_public.csv
# (data/briefs/onchain-verification.md sections 2 and 3; data/onchain_returns.csv)
RECENT_EXTRA = [
    {"incident": "Makina", "incident_date": "2026-01-20", "loss": "~$4.2M", "tag": "up to 10% offer to an MEV builder; 920.7 ETH returned after 51h47m, 102.3 ETH (10%) kept", "share": "90.0%"},
    {"incident": "ChainConnect", "incident_date": "2026-07-26", "loss": "~$650k", "tag": "one-line acceptance as a whitehat; 280 ETH returned about 14 hours later", "share": "n/a"},
]


def t_recent():
    cases = [x for x in rows("negotiation_cases_public.csv") if x["incident_date"] >= "2025-01-01"]
    items = []
    for x in cases:
        rs = x["returned_share_of_loss"]
        name = x["incident"]
        dt = RECENT_DATE.get(name, x["incident_date"])
        items.append((dt, [
            name, dt, RECENT_LOSS.get(name, usd(x["loss_usd"])),
            RECENT_TAG.get(name, esc(x["outcome"])[:100]), pct(100 * float(rs)) if rs else "n/a", RECENT_VERIF.get(name, "reported"),
        ]))
    for e in RECENT_EXTRA:
        items.append((e["incident_date"], [e["incident"], e["incident_date"], e["loss"], e["tag"], e["share"], RECENT_VERIF[e["incident"]]]))
    items.sort(key=lambda t: t[0])
    return table(["Incident", "Date", "Loss", "Terms and outcome", "Returned share of loss", "Verification"], [r for _, r in items], ["l", "l", "r", "l", "r", "l"])


def _attack_rows():
    """Section 8 sample: data/attack_contracts.csv (758 enriched DeFiHackLabs EVM exploits)."""
    return rows("attack_contracts.csv")


def _k(entry):
    return next(n for n in CANON["numbers"] if n["id"] == entry)["numeric"]


def t_attack_same_tx():
    """Table 23: same-tx (constructor) share, same-tx-or-same-block share, USD-weighted share, deploy-to-attack lag (K1, K2)."""
    R = _attack_rows()
    check(len(R) == 758, "attack_contracts rows %d != 758" % len(R))
    eras = [("2020-22", "2020 to 2022"), ("2023", "2023"), ("2024", "2024"), ("2025", "2025"), ("2026", "2026 (to 18 Oct)")]
    acc = {e: dict(n=0, ctor=0, sb=0, usd=0.0, usd_ctor=0.0) for e, _ in eras}
    for r in R:
        e = "2020-22" if r["year"] < "2023" else r["year"]
        a = acc[e]
        fp = r["incident"] == "Fortress Loans"  # likely false positive, verification A1
        ctor = r["constructor_attack"] == "True" and not fp
        sb = (r["constructor_attack"] == "True" or r["deployed_in_attack_tx"] == "True" or "deployed_same_block" in r["frontrun_protection_signals"]) and not fp
        a["n"] += 1
        a["ctor"] += ctor
        a["sb"] += sb
        try:
            L = float(r["loss_usd"])
        except ValueError:
            continue
        a["usd"] += L
        a["usd_ctor"] += L if ctor else 0.0
    k1, k2 = _k("K1")["by_era"], _k("K2")["by_era"]
    body = []
    for e, label in eras:
        a = acc[e]
        n_pct = round(100 * a["ctor"] / a["n"], 1)
        sb_pct = round(100 * a["sb"] / a["n"], 1)
        usd_pct = round(100 * a["usd_ctor"] / a["usd"], 1)
        check((a["n"], a["ctor"], n_pct, sb_pct, usd_pct) == (k1[e]["n"], k1[e]["ctor"], k1[e]["ctor_pct"], k1[e]["sametx_or_block_pct"], k1[e]["usd_share_pct"]), "K1 %s" % e)
        lag = k2[e]
        med = "%.1f" % lag["median_min"] if lag["median_min"] else "0"
        nz = "%.1f" % lag["median_nonzero_min"] + (" (n=%d, unstable)" % lag["n_nonzero"] if e == "2025" else "")
        body.append([label, a["n"], "%d (%s)" % (a["ctor"], pct(n_pct)), pct(sb_pct), pct(usd_pct), "%s (n=%d)" % (med, lag["n"]), nz])
    return table(["Era", "Enriched exploits", "Same-tx attacks (share)", "Same-tx or same-block", "Share of known USD loss", "Median lag, min (attacker-deployed)", "Median lag excl. zero-lag, min"], body)


def t_attack_funding_era():
    """Table 24: sampled Ethereum incidents with a resolved first funder by sanction era (K4)."""
    k4 = _k("K4")["by_era"]
    t2c = {x["tornado_era"][0]: x for x in rows("tables/t2c_ethereum_tornado_share_by_era.csv")}
    labels = [("A", "Before designation (to 7 Aug 2022)"), ("B", "Sanctioned (8 Aug 2022 to 20 Mar 2025)"), ("C", "After delisting (from 21 Mar 2025)")]
    body = []
    for key, label in labels:
        e, t = k4[key], t2c[key]
        check(e["n"] == int(t["n_resolved"]) and e["direct"] + e["hop"] == int(t["tornado_direct_or_hop2"]) and e["railgun"] == int(t["railgun"]), "K4 era %s" % key)
        anyp = e["direct"] + e["hop"] + e["railgun"]
        check(anyp == int(t["any_privacy_tool"]), "K4 any tool %s" % key)
        body.append([label, e["n"], "%d (%s)" % (e["direct"], pct(e["direct_pct"])), "%d (%s)" % (e["direct"] + e["hop"], pct(e["incl_hop_pct"])), e["railgun"], "%d (%s)" % (anyp, pct(100 * anyp / e["n"]))])
    return table(["Era", "Sampled Ethereum incidents with a resolved first funder", "Tornado, direct", "Tornado, incl. one hop", "Railgun", "Any privacy tool"], body)


TABLES = {k[2:]: v for k, v in list(globals().items()) if k.startswith("t_") and callable(v)}

# ---------------------------------------------------------------- driver
BLOCK = re.compile(r"(<!-- TABLE:(?P<name>[a-z0-9_]+) -->\n)(?P<body>.*?)(\n<!-- /TABLE:(?P=name) -->)", re.S)


def render(text):
    missing = []

    def sub(m):
        name = m.group("name")
        if name not in TABLES:
            missing.append(name)
            return m.group(0)
        return m.group(1) + TABLES[name]() + m.group(4)

    out = BLOCK.sub(sub, text)
    if missing:
        sys.exit("unknown table names in paper: " + ", ".join(missing))
    return out


def main():
    if "--list" in sys.argv:
        print("\n".join(sorted(TABLES)))
        return
    with open(PAPER, encoding="utf8") as f:
        text = f.read()
    new = render(text)
    if "--check" in sys.argv:
        sys.exit(0 if new == text else 1)
    if new != text:
        with open(PAPER, "w", encoding="utf8") as f:
            f.write(new)
    print("tables rendered: %d blocks" % len(BLOCK.findall(new)))


if __name__ == "__main__":
    main()
