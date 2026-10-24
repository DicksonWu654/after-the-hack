# Changelog

Dates are the data snapshot date. Corrections are welcome: see the README, "Report a correction".

## Data coding corrections, 23 October 2026

The incident and loss denominator stays at 1,377 incidents and $16,516,848,367. Counted recovery rises from $3,105,350,612 (18.8%) to $3,137,737,346 (19.0%). Voluntary recovery changes from $1,681,375,837 (10.2%) to $1,648,736,037 (10.0%); other recovery changes from $1,423,974,776 (8.6%) to $1,489,001,310 (9.0%). The ex-top-three recovery sensitivity changes from 13.0% to 13.2%.

FTX adds the Elliptic-reported $31.5M stolen-USDT freeze. Paxos's separate ~$19M PAXG freeze is documented and excluded pending theft-address reconciliation. Saga 2024 and Rocket Perp retain unverified claims with zero counted recovery. Samudai's $200 return survives percentage rounding. Poly Network allocates ~$578M voluntary and ~$33M frozen. Wintermute's 17M OP attacker return and 1M OP return through Buterin use the same loss-implied $0.88/OP. Norwegian Ronin recovery remains outside additive totals while overlap is unresolved.

The master adds a structured returner field, documented in data/README.md. Opening offers use the shipped 2020-or-later cohort, 102 of 181 exactly 10%, and the timing definition names its 14-case sample and 11 overlaps with the strict enforcement set. The separate event-stream summary and annual channel table rebuild from the corrected inputs.

## Accuracy and provenance corrections, 23 October 2026

In the first correction batch, the data snapshot remained 21 October 2026 and headline incident, loss and recovery totals were unchanged. The subsequent data coding batch above supersedes its recovery totals. Corrections covered legal outcome labels and review dates, the headline filter, stale summary figures, recovery timing and incident-weighted funding descriptions. Liquid's $266.5M return remains explicitly press-reported, with its BTC-unit share stated separately.

Recovery channel figures retain the builder's documented component allocation. Mixed incidents can appear in multiple channel rows; the earlier whole-incident caption was inaccurate. Paid Network's shifted CSV fields are repaired with speculative attribution preserved. Legal placeholder incident dates are blank with precision flags.

Canonical evidence paths point to shipped repository files. A publication-limits note states where detailed prior-study inputs are unavailable. Original source links retain available archive links and source-access limits; the archive lookup attempted 269 URLs and retried all 169 initial rate-limit responses. It found 106 snapshots, 122 successful no-snapshot results and 41 unresolved rate-limit responses. The five named dead-link repairs include a project-reported StakeWise subrow correction from $20.7M to approximately $19.7M, while the master Balancer total remains $27.7M.

## 2026-10-21: first public release

Data snapshot through 21 October 2026.

What is in it

- The interactive site, the thread and its card sources, and the public data: 1,377 hacks and exploits with a published USD loss ($16.52B at time of theft), a 758-exploit EVM sample for the attack-side findings, and a 28-claim log of AI-related claims. Headline figures and their definitions are in `data/canonical_numbers.json`.

Method decisions that change what the numbers mean

- Recoveries are valued at theft-date USD and capped at 100% of each incident's loss. A make-whole by the victim or an exchange is not counted as a recovery.
- A verification pass re-checked the 150 largest incidents field by field (voluntary return, freeze or seizure, arrest, make-whole) and took precedence over the earlier research layer. It changed several individual figures: Euler was corrected from an impossible 122% of loss; Cashio's $14.38M return, Drift's $3.36M freeze and Harmony's $2.5M freeze were removed because no source corroborated them; Poly Network's $33M freeze was dropped from the sum to avoid double counting; AlphaPo was reduced by $37.3M for an overlap with CoinsPaid. Recovered share overall moved little.
- Four rows left the headline scope because they are not thefts or were never confirmed: Nobitex (funds burned by hacktivists), Ravencoin (inflation bug, no victim funds), CoinBene (hack never confirmed) and Nesa (realised proceeds of about $0.3M against a $50M pre-crash notional).
- A coverage check of August to October 2026 incidents changed six rows: the Ledger supply-chain theft ($93M, an analyst estimate) and D'CENT's App Wallet theft ($6.57M, a floor) were added, the KITE Foundation incident was dropped (the foundation reports no tokens lost), Astroport and Drop are counted once as the Neutron governance attack, and UNCX was raised from $86K to $1.49M. MANTRA, Meter and Pirate Chain have no loss figure because each source value is the notional price of the chain's own tokens.
- Nine top-150 rows still carry a recovery claim that no source corroborated; they are kept and flagged (`not_corroborated` in `verified_check`). Only one of them carries counted dollars.

Data handling

- SlowMist Hacked states "All Rights Reserved" and publishes no reuse licence, so its record table is not redistributed. `data/slowmist_record_links_2026-10-21.csv` holds only each record's date and cited link, and `site/data/attack_monthly_counts.csv` holds the monthly counts derived from it.
- Third-party contact details in decoded on-chain messages (email addresses, phone numbers, chat handles and links) were redacted at source. Automated pattern scans cover the shipped files; they can miss things.
- Column names in `data/incidents_master.csv`: the verification-pass fields are `verified_check` and `verified_check_voluntary`, `verified_check_freeze_seizure`, `verified_check_arrest`, `verified_check_made_whole`, with the basis and source links in `verification_basis` and `verification_sources`.

Known gaps

- The raw caches (tracker snapshots, fetched pages, an on-chain RPC cache) and the scripts that fetch and curate them are not published. `canonical_numbers.json` and `incidents_master.csv` are shipped as results; the builders here do not recompute them from raw sources.
- Parts of the argument rest on an unpublished earlier study of negotiation messages by the same authors; only its aggregate tables are in `data/negotiation_tables/`.
- This project was compiled with AI research agents, so there will be mistakes.
