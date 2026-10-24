# After the Hack

What happens to stolen crypto after a hack: how much comes back, by what route, how fast, and who is ever charged. The study follows 1,377 hacks and exploits with a published USD loss (1 Jan 2016 to 21 Oct 2026, $16.52B at time of theft), plus a separate sample of 758 reproducible EVM exploits for the attack-side findings.

- Interactive site: https://after-the-hack.shadow654.chatgpt.site
- Repository: https://github.com/DicksonWu654/after-the-hack

This repository holds the interactive site, the thread and its cards, and the public data behind them.

**Compiled with AI research agents, so there will be mistakes.** Every claim links its source, and corrections are welcome (see "Report a correction" below).

## Headline numbers

| Finding | Figure |
|:---|:---|
| Dataset | 1,377 incidents, $16.52B (659 of them $1M or more, $16.32B) |
| Recovered by any route | 19.0% of dollars ($3.14B); 13.2% without the three largest recoveries |
| Returned voluntarily by the attacker or an insider | 10.0% of dollars ($1.65B); about 1 in 8 large exploits and key compromises |
| Speed of voluntary returns | median first return 2.4 days after the exploit; 21 of 23 dated returns within a week (a sample biased toward fast, visible returns) |
| People charged or arrested for the hack | 16 of 1,377 incidents (1.2%); 9 of the 100 largest |
| North Korea | 22.6% of dollars from 2.3% of incidents on government attribution alone (39.1% of dollars, 95 incidents, with firm attributions); 8.3% of the government-plus-firm money recovered (3.8% without KuCoin and Munchables; 3.4% on government attribution alone); we found no one in custody for an exchange or bridge theft |
| Attack side (758 EVM exploits) | exploits run inside the attack contract's own deployment transaction rose from about 0% (2020-22) to 40.5% (2025) and 34.1% (2026), though only 8% to 11% of the dollars |
| Recorded incidents | rose 2.3 to 3.1 times from 2025 to March-September 2026 on two trackers (DeFiLlama 12.3 to 37.6 a month, SlowMist 16.8 to 38.6); dollars rose about a third per month |

Every figure has a definition, sources and a confidence grade in `data/canonical_numbers.json`. The master column dictionary is in [data/README.md](data/README.md).

## Contents

| Path | What it is |
|:---|:---|
| `site/` | The built interactive site: a self-contained static directory with relative links (open `site/index.html`, or serve the folder as it is). `site/data/` holds the downloadable CSV/JSON |
| `thread/thread-launch.txt`, `thread/card-map.csv`, `cards/` | The thread and the source for its cards (PNGs are not included) |
| `CHANGELOG.md`, `LICENSE` | What changed between releases; the licence terms |
| `data/` | Public data: `incidents_master.csv` (1,573 rows; `in_headline=1` marks the headline set), `canonical_numbers.json`, `law_enforcement_cases.csv`, `law_enforcement_stats.json`, `recovery_events.csv`, `makes_whole_events.csv`, `dprk_incidents.csv`, `negotiation_cases_public.csv`, `onchain_verification.csv`, `onchain_returns.csv`, `return_latency_audit.csv`, `top100_master_enforcement.csv`, `aggregate_recovery_stats.csv`, `attack_contracts.csv`, `ai_incident_claims.csv`, `slowmist_record_links_2026-10-21.csv`, `tables/`, `baseline/`, `negotiation_tables/` |
| `data/briefs/` | Two excerpts of the working notes that the site builder and card renderer read (the on-chain message shortlist and one paragraph on prosecution defences) |
| `scripts/` | `build_source_provenance.py` and `source_provenance.py` (source-access annotations), and `csv_integrity.py` (CSV checks); `site/build.py` rebuilds the site data and `cards/render.py` renders cards |
| `requirements.txt` | Python packages for the builders |

## Reproduce

Dependencies: Python 3.10 or newer (run with 3.12.3). The source-provenance and site builders use only the standard library. `cards/render.py` needs Playwright with Chromium and Pillow (not needed for the site).

```
pip install -r requirements.txt
python3 -I scripts/csv_integrity.py --tree .  # check CSV row widths and vocabulary
python3 -I scripts/build_source_provenance.py --root .  # refresh source-access annotations
python3 site/build.py             # rebuild site/data (bundle.js, quotes.json, downloads); exits non-zero if a displayed figure does not match
playwright install chromium       # once, for the cards
python3 cards/render.py           # render the cards to cards/out (add --no-dark for light cards only)
python3 cards/og.py               # render site/assets/og-card.png from canonical figures and the built bundle
```

A GitHub Actions workflow (`.github/workflows/rebuild.yml`) checks CSV integrity and runs the source-provenance and site builders on every push and fails if the committed outputs differ from a fresh build.

What the builders check and what they do not:

- The site builder and the card renderer take their figures from `data/canonical_numbers.json` and from the shipped CSVs, and stop with an error when a figure they display does not match the canonical value or the recomputation they make from a shipped CSV (for example, the return-latency median).
- `canonical_numbers.json` is itself computed from the CSVs by `scripts/build_canonical_numbers.py` in the working repository. That script also reads raw caches that are not published here, so it is not part of this repository and the builders here do not recompute `canonical_numbers.json` from `incidents_master.csv`. A change made to `incidents_master.csv` alone, without regenerating `canonical_numbers.json`, would not be caught by these builders.
- The raw caches (tracker snapshots, fetched pages, an on-chain RPC cache) and the scripts that fetch and curate them are not included. `canonical_numbers.json` and `incidents_master.csv` are shipped as results.

## Methods in brief

- **Scope.** Hacks and exploits with a published USD loss, valued at theft-date USD. Recoveries are capped at 100% of each incident's loss. Reimbursement by the victim or an exchange is a make-whole, not a recovery.
- **Base list.** DeFiLlama's hacks list plus SlowMist-only rows of $100k or more, cross-matched to rekt and DeFiHackLabs, then curated row by row with a source and an evidence code.
- **Outcomes.** For the 150 largest incidents, research agents with web search checked voluntary return, freeze or seizure, arrest and make-whole; an independent second pass re-checked every field. Unknown is not none: rows with no public record say so.
- **Law enforcement.** Court dockets and DOJ releases where available; named defendants appear only where an official or court source supports the name, otherwise a role is given.
- **On-chain checks.** Negotiation messages and return transactions were decoded on public RPC endpoints (`data/onchain_verification.csv`, `data/onchain_returns.csv`). Contact details in decoded messages (email addresses, phone numbers, chat handles and links) were redacted, and every shipped text file was scanned for them with pattern checks. Pattern checks can miss things: if you find a contact detail that should not be here, tell us and we will remove it.
- **Attack side.** 758 reproducible EVM exploits from the DeFiHackLabs index, enriched with deployment, funding and timing data, with a separate 28-claim log of AI-related records graded verified, credible or speculation in `data/ai_incident_claims.csv`. The log retains each source's scope and evidence limits.

## Limitations

- Most dollar figures are as reported by victims, trackers or press; only a minority are verified on chain.
- The dataset is built from public trackers, so it understates small, unreported and unattributed incidents, and recoveries that were never announced.
- The 23 dated returns and 16 arrest-timing cases are small, visible samples. Medians from them are descriptive, not forecasts.
- Labels for attack vectors and bug classes come from tracker headings and keywords, not from code analysis.
- Counts of recorded incidents can rise because of better detection or reporting, not only more attacks; the data cannot separate these.
- Court and docket statuses are as of 21 October 2026 and can have changed.
- Parts of the argument rest on an unpublished prior study of negotiation messages by the same authors; its aggregate tables are in `data/negotiation_tables/` and its row-level data are not published.
- Compiled with AI research agents and checked by further agents and by recomputation, not by a human audit of every row. Errors are possible; see "Report a correction".

## Sources and third-party data

Incident lists and figures come from public sources and are cited by URL in each data row: DeFiLlama (hacks API), SlowMist Hacked, rekt.news, DeFiHackLabs, Chainalysis, TRM Labs, Elliptic, Immunefi, CertiK public reports (cited as aggregate figures and per-incident links only), DOJ and Treasury releases, CourtListener dockets, and project post-mortems. These belong to their owners.

- SlowMist Hacked (hacked.slowmist.io) states "All Rights Reserved" and publishes no licence for reuse. We therefore do not redistribute its record table. `data/slowmist_record_links_2026-10-21.csv` (also in `site/data/`) holds only each record's date and the reference link it cites, and `site/data/attack_monthly_counts.csv` holds the monthly counts we derived. Names, losses and methods from the SlowMist table are not included.
- `data/attack_contracts.csv` derives from the DeFiHackLabs index (check its licence before reuse) and public on-chain data.
- We make no claim over third-party content; if you own a source and want a row changed or removed, tell us.

## Report a correction

Open an issue at https://github.com/DicksonWu654/after-the-hack/issues. The most useful report names the incident (the `id` column of `data/incidents_master.csv`), says which field or sentence is wrong, and links a source that shows the right value. If you own a source and want a row changed or removed, say so in the issue. Accepted corrections are listed in `CHANGELOG.md`.

## Licence

- Code (`scripts/`, `site/build.py`, `site/assets/*.js`, `site/assets/style.css`, `cards/`) is released under the MIT License.
- Data and text (`data/`, `thread/` and the written content of `site/`) are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0): https://creativecommons.org/licenses/by/4.0/ . Attribute as "After the Hack".
- Fonts in `site/assets/fonts` keep their SIL Open Font License 1.1 (full text in `site/assets/fonts/LICENSE.txt`).
- Third-party material is not covered by either licence; see "Sources and third-party data".

The full terms are in `LICENSE`.
