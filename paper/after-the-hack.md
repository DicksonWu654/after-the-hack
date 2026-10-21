# After the Hack: Returns, Recovery, and Consequences in Crypto Thefts, 2016-2026

*Data through 21 October 2026. Builds on the authors' unpublished prior study "One hack in eight" [1].*

## Abstract

Public accounts of crypto theft stop at the loss figure. This paper follows 1,377 hacks and exploits with a published USD loss, 1 January 2016 to 21 October 2026, worth $16.52B at the time of theft, through what happened next: whether the attacker gave money back, whether anyone froze or seized it, and whether anyone was charged. The master table joins DeFiLlama, SlowMist, rekt.news and DeFiHackLabs with curated outcome layers. The top-150 outcome layer was re-checked in a separate verification pass, and the verification verdict took precedence wherever the two differed.

About 18.8% of stolen dollars ($3.11B of $16.52B) has a documented recovery by some channel, but three cases make up a third of that, and without them the figure is 13.0%. Attackers voluntarily return funds in roughly one large exploit in eight (12.5%, estimated in our earlier paper), and 10% is the going bounty: 104 of 183 on-chain opening offers were exactly 10%. When money does come back it comes fast (median 2.4 days after the exploit in 23 dated returns, 21 of them inside a week; the sample is biased fast). When it does not, it usually stays gone. Freezes work only on assets that an issuer or a governed chain controls, and only if they act within hours. Prosecution is rare and slow: 9 of the 100 largest hacks, and 16 of the 1,377 incidents overall (about 1 in 86), have led to a person being charged for the hack. In a separate sample of 16 cases with a dated first arrest (some pre-2016 or laundering-side), the median wait was 608 days; for the 14 of those cases that are 2016 or later incidents in our scope it was 439.5 days. The people prosecuted are mostly insiders and exploiters within reach of Western courts. North Korea is behind at least 22.6% of stolen dollars from 2.3% of incidents on government attribution alone (34% to 39.1% of dollars, from up to 6.9% of incidents, with firm and researcher attributions). Recovery in North Korean cases is 3.8% once two outliers are removed, and we found no public record of a North Korean operator of an exchange or bridge theft being arrested.

In a separate sample of 758 reproducible EVM exploits, attacks that run inside the attack contract's own deployment transaction rose from about 0% in 2020 to 2022 to 40.5% in 2025 (34.1% in 2026), though only 8% to 11% of the dollars, and Tornado Cash still directly funded 30.2% of attacker wallets on Ethereum after its 2025 delisting. Recorded incidents rose 2.3 to 3.1 times from 2025 to March-September 2026 on two trackers while dollars rose far less, and we found no verified in-the-wild exploit written by AI, only attacker use of AI in social engineering and tooling.

We label each claim as reported (press, firm or company statement) or verified (a primary record we read: a decoded chain transaction, a court docket, a DOJ release or an FBI notice), and we keep make-whole payments by victims out of every recovery figure.

## 1 Introduction

A hack ends in one of a few ways. The attacker launders the money and disappears. The attacker, or someone who intercepted the funds, gives some of it back. A party with a lever (a stablecoin issuer, an exchange, a validator set) freezes it. Police or a court take it years later. Or the victim's own balance sheet pays the users and the stolen money is simply gone. Annual reports from Chainalysis, CertiK, Immunefi and TRM give totals and, increasingly, a recovered share [2, 3, 4, 5, 6], but they differ in scope, they count different things as recovery, and none follows individual incidents through every channel to an outcome.

This paper extends "One hack in eight" [1], which asked one question: when a protocol is drained, how often does the attacker give the money back, on what terms, and does messaging the attacker matter? That paper found that public "returned" fields were mostly wrong. Of 247 returns inherited from earlier datasets, 59 held up against post-mortems and chain traces; the rest were reimbursements, freezes, seizures, front-running rescues or a different hack of the same protocol. We reuse its frame, its findings and its numbers, and cite them rather than re-derive them. Here we widen the question to every channel through which stolen money comes back, and to the consequences for the people who took it.

The contributions are:

1. **A master incident table** of 1,377 headline incidents with a USD loss at the time of theft, outcome fields for voluntary return, freeze or seizure, and arrest or charge, and a provenance trail for every curated value (Section 2).
2. **One recovery measure across all channels.** Recoveries are valued at theft-date USD, capped at 100% of each incident's loss, with voluntary return, freezes, seizures, chain-level interventions and white-hat rescues kept separate and make-whole payments excluded. We report sensitivities because three events dominate the dollars (Section 5).
3. **A reconciliation with the earlier return estimates.** The "one in eight" rate, the dollar share returned voluntarily and the all-channel recovery share are three different quantities. We show how they relate (Sections 4 and 5).
4. **A docket-verified account of legal consequences:** the share of hacks that end in an arrest or charge, how long it takes, what happens to the 23 people charged, and what happened to the "code is law" defences (Section 6).
5. **A tiered account of North Korean (DPRK) theft:** share of dollars and of incidents at each attribution tier, tactics, laundering speed, recovery, and the record of indictments without arrests (Section 7).
6. **Verified negotiation messages.** Quoted messages and return transactions were decoded from chain data, and several press-reported quotes and timings were corrected (Sections 2 and 4).
7. **Attack contracts and AI.** In a sample of 758 reproducible EVM exploits, we measure the rise of same-transaction attacks, vector drift and copycat waves, Tornado Cash and Railgun funding, the 2026 count surge, and what is and is not documented about AI in attacks (Section 8).
8. **Implications** for protocol teams, stablecoin issuers and chains, and law enforcement (Section 9).

A note on reading. Every number carries its denominator in the same sentence or table. "Reported" means a press, firm or company statement. "Verified" means a primary record that we read ourselves. Most loss and recovery figures in this paper are reported figures, and we say so where it matters. Absence is stated as "no public record found", which is a search result and not proof that nothing happened.

## 2 Data and methods

### 2.1 The master incident table

The base list is the DeFiLlama hacks dataset (1,313 rows pulled on 21 October 2026), which has a consistent schema and a dollar amount [7]. We add 149 rows from SlowMist Hacked where a USD amount of $100k or more is stated and no DeFiLlama match exists [8]. The rekt.news leaderboard (328 rows with article links) and the DeFiHackLabs README (155 incidents) are used to confirm incidents and to find outcome sentences and sources, not as loss sources [9, 10]. Researcher compilations of DPRK incidents (the tayvano Lazarus and BlueNoroff list, pinned to a commit) are used for attribution leads only [11].

The master file has 1,573 rows. The headline scope used throughout is 1,377 incidents with a stated USD loss between 1 January 2016 and 21 October 2026, totalling $16.52B (659 incidents of $1M or more account for $16.32B). The scope rules are:

- Duplicates are merged. Non-theft events are excluded: bug-locked funds, lost-key lawsuits, a bankruptcy, white-hat disclosures.
- The LuBian mining-pool outflow of December 2020 ($3.5B in DeFiLlama) is excluded because its provenance is contested.
- Researcher-list-only rows (99 incidents from the tayvano compilation) are excluded from totals.
- Large single-source rows are excluded pending corroboration: any DeFiLlama-only row of $50M or more that no other list confirms (two rows, plus Gate 2018 at $235M).
- Four rows were moved out of scope in the verification pass: Nobitex (funds burned by hacktivists, not stolen), Ravencoin (an inflation bug with no victim funds), CoinBene (a hack that was never confirmed) and Nesa (realised proceeds of about $0.3M against a $50M pre-crash notional).
- Pure rug pulls and scams are mostly out. Personal-wallet theft and phishing of individuals are largely absent.

A coverage check of August to October 2026 incidents changed six rows on 21 October 2026. The Ledger supply-chain theft through the reseller CryptoBilis (9 October) was added at $93M [125, 126]. Several outlets now carry it, every dollar figure is an analyst estimate ($86M to $102M), and Ledger has confirmed a hardware implant in one device and the reseller link, with no total. D'CENT's App Wallet theft (September, XRP) was added at SlowMist's $6.57M, a floor: analysts count about 12.4M XRP from 7,393 wallets, roughly $17M [135]. The KITE Foundation incident (DeFiLlama $13.34M) was dropped, because the foundation says no tokens were lost and the affected tokens are frozen. Astroport and Drop are counted once, as the Neutron governance attack, at the reported $9.3M exposure; the realised loss is not established [132, 133]. MANTRA, Meter and Pirate Chain stay in the master with no loss figure: each source value is the notional price of the chain's own tokens, drained from its wallets or newly minted, and realised proceeds are unknown. KiiChain ($9.7M) and TAC ($7.5M) are counted at their pre-exploit valuations, although attackers realised about $1.6M and $1.0M, so their realised losses are overstated.

**Valuation.** Losses are USD at the time of the incident, taken from DeFiLlama or the SlowMist entry, and never re-priced. Recoveries are valued at theft-date USD where the units are known (Bitfinex and Verus are computed from units), capped at 100% of each incident's loss, with no double counting between a return and an overlapping freeze. Where only a later-date USD value exists, the figure is carried as the source gives it and flagged. Bitfinex illustrates why: about 94,000 of 119,754 BTC (78.5%) were seized in 2022 at a value of $3.6B, against a theft-date loss of $72M. We count the recovery as $56.5M, which is 78.5% of the theft-date loss. Euler's in-kind return is carried at the full $197M loss (100%) and not at a later-price value of $240M, which would exceed the loss. That figure is not computed from units: it follows the project's own post-mortem account of a full recovery [112]. Liquid's return is price-based: the master carries $266.5M, which is 83.3% of the $320M loss, whereas counting units gives 85.0% (3,400 of 3,998.5 BTC).

**Make-whole is not recovery.** When an exchange, foundation or consortium repays users from its own balance sheet, the stolen money has not come back. Those payments are recorded in a separate field and never added to the recovered share (Section 5.7).

### 2.2 Curated outcome layers and verification provenance

Outcome fields come from four layers, applied in order, with the later layer winning a conflict.

1. **Curated rows** written in the first research pass from sources that were fetched, each with an evidence code: V1 (primary source fetched), V2 (reputable secondary fetched), V3 (a SlowMist or rekt summary of a project statement) or P (a row from a prior project, not re-fetched).
2. **Sibling streams** of this project (recoveries, DPRK, legal cases, make-whole events), the master table of the authors' earlier negotiation study (unpublished), and the DPRK compilation [1, 11]. Every match is logged, and every disagreement between layers is recorded.
3. **A top-150 outcome layer.** Fifteen research agents with live web search covered 134 of the 150 largest incidents; the other 16 already carried a primary or reputable source. Six verifier agents then re-checked 72 claims.
4. **An independent verification pass applied on top of that layer.** Three further agents, using web search and page fetches only, re-checked all 150 incidents field by field (voluntary return, freeze or seizure, arrest, make-whole): 601 field rows. For ranks 51 to 150 the earlier layer's output was not read before the verdicts were formed; for ranks 1 to 50 it was consulted only afterwards. The verdicts were: agree 204, no public record found 343, new finding 22, CSV value unsupported 27, disagree 5. The verification pass is applied after the earlier layer, and **where the two differ, the verification verdict took precedence.** The same step applied corrections from three further verification passes: recent events, legal records and on-chain messages.

The top-150 layer was treated as unverified until a verification verdict existed, and no unchecked output of it stands in the master. Table 1 shows what the pass changed. Recoveries moved little in total, but several individual figures changed materially. Euler was corrected from an impossible 122% of loss to the recovery that the project's own post-mortem describes (Section 2.1). Cashio's $14.38M return, Drift's $3.36M freeze and Harmony's $2.5M freeze were removed because no source corroborated them. Poly Network's $33M freeze was dropped from the sum because returned plus frozen would have been 105% of the loss. Four incidents left the scope, and AlphaPo was cut by $37.3M for an overlap with CoinsPaid.

**Table 1.** Effect of the verification pass on headline measures (first-layer master before, verified master after).

| Measure | Before: first-layer master | After: verified master |
|:---|:---|:---|
| Loss in scope | $16.70B, 1,381 incidents | $16.52B, 1,377 incidents |
| Recovered, all channels (theft-date USD, capped at 100% per incident) | $3.06B (18.3%) | $3.11B (18.8%) |
| Recovered share excluding chain-level interventions | 15.5% | 16.1% |
| Recovered share excluding the three largest recoveries | 12.5% | 13.0% |
| Incidents of $1M or more with a documented recovery | 147 of 662 (22.2%) | 150 of 659 (22.8%) |
| Top 150 by loss: recovered share of loss | 19.5% | 19.9% |
| DPRK, government-attributed | 33 incidents, $3.84B (23.0%) | 32 incidents, $3.74B (22.6%) |
| DPRK, government plus firm attributed | 96 incidents, $6.53B (39.1%) | 95 incidents, $6.45B (39.1%) |
| DPRK vs non-DPRK recovered share of loss | 7.8% vs 25.1% | 8.3% vs 25.5% |

The verification pass also classifies every top-150 row (Table 2). Nine rows still carry a recovery or claim that the pass could not corroborate. They are kept and flagged, and only one of them (Meerkat Finance, $29.4M) carries counted dollars. Five incidents that entered the top 150 after the scope changes were not re-checked.

**Table 2.** Verification verdict on each of the 150 largest incidents.

| Verification verdict (top 150 by loss) | Incidents | Counted recovered | Meaning |
|:---|---:|---:|:---|
| verified_agree | 44 | $1.63B | the verification pass agrees with the first-layer values (a press or firm source matches within about 15%) |
| corrected | 33 | $1.14B | value, classification or scope changed by the verification pass |
| checked_none_found | 59 | $0 | the pass searched and found no recovery or claim; the master also records none |
| not_corroborated | 9 | $29.4M | master carries a recovery claim that the pass could not corroborate; kept and flagged |
| not re-checked | 5 | $10M | not re-checked (entered the top 150 after scope changes) |

Agreement means that a press or firm source matches the first-layer value within about 15%. It does not mean the amount was checked on chain or against a court record. Rows where the pass found nothing and the master also has nothing are "no public record found", never "none".

### 2.3 Outcome checks and coverage

Each incident carries an outcome-check level. "Full" means voluntary return, freeze or seizure, and arrest were each searched. "Partial" means some were. "None" means the outcome was never checked. For the top 150 incidents the check is full for 147. Below that, coverage thins quickly (Table 3). Of the 659 incidents of $1M or more, 147 have a full check, 265 a partial one, and 247 (37%) none. A recovery rate computed over all 659 is therefore a documented-recovery floor: dollars count only where a recovery is documented. We do not assume that the unchecked incidents recovered nothing, only that no recovery is documented for them. Where it matters we give the rate over checked incidents as well.

**Table 3.** Outcome-check coverage and documented recovery by scope.

| Scope | Incidents | Outcome check full | Partial | None | With a recovery | Recovered (theft-date USD) | Share of loss |
|:---|---:|---:|---:|---:|---:|---:|---:|
| top 150 by loss | 150 | 147 | 2 | 1 | 58 | $2.80B | 19.9% |
| top 100 by loss | 100 | 100 | 0 | 0 | 43 | $2.63B | 20.0% |
| >= $1M | 659 | 147 | 265 | 247 | 141 | $3.10B | 19.0% |
| all headline scope | 1,377 | 147 | 445 | 785 | 179 | $3.11B | 18.8% |

Recovery statuses are: documented recovery, recovery announced but unquantified, claimed but unverified, no recovery in the sources checked, no voluntary return found (other channels not checked), no public record found (all channels searched), and not checked. Only documented, quantified recoveries add dollars. The "with a recovery" column of Table 3 counts incidents with positive counted dollars (141 of the 659 incidents of $1M or more). The 150 of 659 (22.8%) used in the text counts every incident with status "documented recovery", which includes nine whose recovery is documented but whose amount no source states (Pizza DeFi, Samudai, EigenLayer, Term Finance, Yala, UXLINK, Wanchain, Coinsbuy and Nomic).

### 2.4 Attribution tiers

DPRK attribution is tiered, and every share in this paper names its tier. **Government-attributed** means the FBI, DOJ, OFAC or Treasury, the UN panel or the Multilateral Sanctions Monitoring Team, South Korean or Japanese police, or a joint statement. **Firm-attributed** means Chainalysis, TRM, Elliptic, ZachXBT, a victim's forensics provider, or the tayvano researcher list. Within the firm tier, 47 rows ($0.83B) rest only on membership of the researcher list, which is a lead and not an attribution. We therefore report three figures: government only, government plus firm excluding researcher-list-only rows, and everything. Tiers for the 2026 incidents (Drift, Kelp, Bitget) are firm or victim-side only, because we found no government attribution for them.

**Source grade of the government tier.** The government tier names who attributed the theft, not how we checked it. Of its 32 rows ($3.74B), only Bybit (an FBI notice, $1.40B in the master) and DMM (the Japan National Police Agency page, $305M) were read at a primary source by us, and two more (a combined $60M) are matches to DOJ pleadings that we inferred. Twenty-seven of the 32 rows, $1.35B of the $3.74B (36%), are read through secondary sources: Wikipedia or press coverage, the tayvano researcher tabulation of the Multilateral Sanctions Monitoring Team report, a sibling dataset, or a recalled statement whose fbi.gov page returned an error (the Ronin row cites a primary source that we did not read). The tier is therefore the attribution as publicly reported by government bodies, and not a set of attributions we verified one by one. The tier is also sensitive to one row: Coincheck ($534M, 2018) sits in it only because press reporting (CyberScoop) cites a UN panel report. Without Coincheck the government-tier share is about 19.4% ($3.21B of $16.52B).

### 2.5 On-chain message verification

Negotiation messages are published in transaction calldata (or in a Bitcoin OP_RETURN). We re-fetched the transactions behind 29 example messages from the earlier paper and 19 further rows built from press-reported cases and from hashes found along the way, using public JSON-RPC endpoints with fallbacks and mempool.space for Bitcoin [12]. Of the 29 example messages, all exist on chain and decode as UTF-8 text: 15 match exactly and 14 differ only in line breaks or truncation. Across all 48 rows the verdicts were 16 exact, 21 close, 6 mismatch and 5 not found. Exact means the decoded text equals the published quote, and close means it differs only in line breaks, truncation or a few characters, so we do not claim that any text matches byte for byte beyond the 16 exact rows. Of 43 unique EVM transactions, 42 were confirmed by two independent endpoints and one by a single endpoint.

The six mismatches were all in press-sourced case tables, and they changed what we write. The GMX attacker's "ok, funds will be returned later" [115] is a different transaction from GMX's own 10% offer. The Liquid attacker's "You SHALL pay 10%" demand [32] is in a different transaction from its first "we are whitehats" note [113]. A "temporary complete control of KyberDAO" quote for KyberSwap blended two separate phrases. A "data transaction" in the Verus case is a plain 1,350 ETH transfer with no calldata. A one-word "sorry" in the Euler case is a fragment of a 287-character apology. Return transactions were verified for ChainConnect (280 ETH), Makina (920.7 ETH) and Verus (4,052 ETH, against 4,052.4 ETH asked). The five "not found" rows are quotes with no transaction hash in the source (Mango, Thala, NEAR Intents, Loopscale and one Euler row); they are cited to the press only.

Chain data authenticates that a message was published, not who sent it. The labels "attacker" and "project" remain press or dataset attributions, except where a message, a return and a confirmation tie the same address together (ChainConnect, Makina, Verus, Shezmu).

### 2.6 Legal records

Court dockets were read through CourtListener and DOJ releases from the DOJ site or archived copies [13]. We opened the dockets for Mango (Eisenberg), the MEV-Boost relay case (Peraire-Bueno), Uranium Finance (Spalletta), Crema and Nirvana (Ahmed), KyberSwap and Indexed (Medjedovic), and the FTX SIM-swap case, and the DOJ releases for the DPRK indictments and forfeitures. Several items did not survive checking: Nomad's suspect was "extradited" in one TRM Labs headline [121], but the body of that post says Israel arrested him and approved extradition; the only sources for the approval are TRM and a BleepingComputer paraphrase of it, and no source shows a transfer to the United States. Bybit's civil suit was filed in 2026, not 2025. An October 2024 forfeiture complaint traces to a 2023 theft of about $41M, not to a different, larger figure of 2021-22 thefts that an unpublished brief had given. On 21 October 2026 we re-read the FTX SIM-swap, Spalletta, Eisenberg appeal, Bybit and Kim dockets through CourtListener's RECAP search, which is a crowd-sourced mirror of PACER and can omit entries. Where the FBI site could not be read, FBI attributions rest on secondary sources and are labelled that way.

### 2.7 What the table does not cover

The table is a union of public trackers, not a census. It is a floor against Chainalysis and CertiK, whose annual totals are 4% to 25% higher for 2021 to 2025 because they include personal-wallet theft and, for CertiK, phishing and scams (Table 5). Detection and listing improve over time, so incident counts rise faster than real activity; dollars are more stable than counts, and 2016 and 2017 (5 and 7 incidents) are too thin to read as a trend. Search budgets ran out in several research passes, several primary pages returned 403 or 404, and nothing was checked on chain except the message and return transactions above. Section 10 collects the limitations.

## 3 Scale and anatomy

### 3.1 How much, how often, how concentrated

The master table counts $16.52B stolen across 1,377 incidents, 659 of which are $1M or more ($16.32B). Annual losses peaked in 2022 ($3.54B across 196 incidents, driven by Ronin and the BNB bridge) and again in 2025 ($2.57B, of which Bybit at $1.4B in the master is 54.0%). The year 2026 stands at $2.33B across 308 incidents with ten weeks to go. The five years 2016 to 2020 total $1.95B (Table 4).

**Table 4.** Incidents and losses by year (headline scope: 1,377 incidents with a USD loss, USD at the time of theft).

| Year | Incidents | Loss (USD at the time) | Incidents of $1M or more | Median incident | Largest incident |
|:---|---:|---:|---:|---:|:---|
| 2016 | 5 | $136M | 4 | $2M | Bitfinex $72M |
| 2017 | 7 | $140M | 7 | $7.7M | NiceHash $64M |
| 2018 | 26 | $902M | 11 | $450k | Coincheck $534M |
| 2019 | 20 | $211M | 13 | $6.5M | Upbit $49.3M |
| 2020 | 52 | $561M | 28 | $1.8M | KuCoin $281M |
| 2021 | 134 | $2.66B | 91 | $3.1M | Poly Network $611M |
| 2022 | 196 | $3.54B | 105 | $1.1M | Ronin Bridge $624M |
| 2023 | 229 | $1.64B | 99 | $700k | Mixin Network $200M |
| 2024 | 235 | $1.83B | 109 | $700k | DMM Bitcoin $305M |
| 2025 | 165 | $2.57B | 77 | $782k | Bybit $1.40B |
| 2026 (to 21 Oct) | 308 | $2.33B | 115 | $471k | Bitget $387M |
| **All** | **1,377** | **$16.52B** | **659** |  |  |

Counts are not comparable across years. Coverage improves sharply after 2020, and 2026 has 308 incidents largely because small recent incidents are well covered. Dollars are the more stable series.

Losses are concentrated. The median incident is $820,000, and 718 of 1,377 incidents (52.0%) are under $1M. The 10 largest incidents account for 33.5% of all dollars, and Bybit alone for 8.5% of the ten-year total. A reader who wants the typical case should look at the median and the count; a reader who wants the money should look at a handful of exchange and bridge heists. Table 5 compares annual totals with the published trackers.

**Table 5.** Annual totals in this dataset against raw DeFiLlama and published industry totals.

| Year | This dataset: loss (incidents) | DeFiLlama raw, excluding LuBian (rows) | Published totals (Chainalysis, CertiK, TRM) |
|:---|---:|---:|:---|
| 2021 | $2.66B (134) | $2.87B (127) | $3.2B (Chainalysis) |
| 2022 | $3.54B (196) | $3.63B (185) | $3.8B at publication, $3.7B in later report (Chainalysis); $3.7B (CertiK) |
| 2023 | $1.64B (229) | $1.63B (197) | $1.7B (Chainalysis); >$1.8B across 751 incidents (CertiK) |
| 2024 | $1.83B (235) | $1.67B (217) | $2.2B (Chainalysis); $2.446B (CertiK, per its 2025 report) |
| 2025 | $2.57B (165) | $2.72B (148) | >$3.4B through early Dec (Chainalysis); $3.353B (CertiK) |
| 2026 | $2.33B (308) | $2.34B (305) | H1: $1.32B (CertiK, via ForkLog); Jan-Apr: ~$0.76B (TRM, derived from 577M = 76%) |

This dataset sits 4% to 25% below the published totals for 2021 to 2025 [2, 3, 14, 15, 16, 17, 18]. Chainalysis and CertiK include personal-wallet theft and unnamed victims, and CertiK includes phishing and scams: its 2025 report counts $722.9M of phishing losses across 248 incidents in 2025 alone [3]. The gap to CertiK for 2025 is about $0.78B, which phishing alone could explain. This is a consistent explanation and not a reconciliation. The list is a floor on what the industry reports, and it is built from incidents that can be named.

### 3.2 Vectors: by dollars and by count

By dollars, compromised keys and infrastructure lead (35.0%), ahead of smart-contract logic (24.8%). By count the order reverses: contract logic is 35.7% of incidents and key or infrastructure compromise 15.7% (Table 6). Adding social engineering (11.4% of dollars) and supply chain (11.0%) to key compromise, operational failures are 57% of all stolen dollars. The vector label comes from DeFiLlama's own classification and technique fields mapped to a nine-class taxonomy, overridden where we read the source. It is coarse, and single-incident reclassification moves dollar shares: Bybit alone is 8.5% of dollars.

**Table 6.** Attack vector by incident count and by dollars (1,377 incidents, $16.52B).

| Attack vector | Incidents | Share of incidents | Loss | Share of loss |
|:---|---:|---:|---:|---:|
| Private key / compromised infrastructure | 216 | 15.7% | $5.78B | 35.0% |
| Smart-contract logic | 491 | 35.7% | $4.10B | 24.8% |
| Social engineering | 70 | 5.1% | $1.88B | 11.4% |
| Supply chain | 40 | 2.9% | $1.82B | 11.0% |
| Oracle / price manipulation | 182 | 13.2% | $941M | 5.7% |
| Access control | 214 | 15.5% | $791M | 4.8% |
| Reentrancy | 65 | 4.7% | $473M | 2.9% |
| Other | 57 | 4.1% | $407M | 2.5% |
| Rug pull / insider | 42 | 3.1% | $323M | 2.0% |
| **All** | **1,377** | **100%** | **$16.52B** | **100%** |

The mix has moved. Table 7 shows each year's share of dollars. Since 2024 (1 January 2024 to 21 October 2026, $6.7B), key and infrastructure compromise is 31.5% of dollars, supply chain 23.1%, contract logic 20.1% and social engineering 14.8%. Two thirds of recently stolen dollars therefore came from people and infrastructure being compromised, and contract bugs fell to a fifth. The 2025 supply-chain share of 56.1% is the Bybit and Safe{Wallet} compromise alone, and the 2024 social-engineering share of 35.0% is driven by DMM Bitcoin and Radiant. The direction is robust over three years of data; the point values are not.

**Table 7.** Share of each year's dollar loss by vector.

| Year | Key / infrastructure | Contract logic | Social engineering | Supply chain | All other |
|:---|---:|---:|---:|---:|---:|
| 2016 | 54.3% | 0.0% | 0.0% | 0.0% | 45.7% |
| 2017 | 71.3% | 0.0% | 0.7% | 6.5% | 21.5% |
| 2018 | 73.1% | 2.3% | 0.0% | 0.0% | 24.6% |
| 2019 | 90.4% | 0.3% | 0.0% | 0.0% | 9.2% |
| 2020 | 57.3% | 8.2% | 0.1% | 0.4% | 34.1% |
| 2021 | 26.0% | 35.9% | 2.6% | 5.2% | 30.2% |
| 2022 | 26.4% | 37.5% | 18.0% | 0.2% | 18.0% |
| 2023 | 42.1% | 24.0% | 10.7% | 6.7% | 16.4% |
| 2024 | 39.2% | 11.7% | 35.0% | 0.2% | 13.9% |
| 2025 | 14.7% | 18.1% | 2.3% | 56.1% | 8.9% |
| 2026 (to 21 Oct) | 44.1% | 28.9% | 12.8% | 4.8% | 9.4% |

### 3.3 Targets

DeFi protocols account for 35.3% of dollars and 76.6% of incidents, centralized exchanges for 33.8% of dollars from 6.7% of incidents, and bridges for 22.6% (Table 8). Bridges were 54% of 2022 dollars and 34% of 2026 dollars. Centralized exchanges were 66% of 2025 dollars, almost all of it Bybit. Target type is a single label per incident and large events dominate it.

**Table 8.** Target type by incident count and by dollars (1,377 incidents, $16.52B).

| Target type | Incidents | Share of incidents | Loss | Share of loss |
|:---|---:|---:|---:|---:|
| DeFi protocol | 1,055 | 76.6% | $5.84B | 35.3% |
| Centralized exchange | 92 | 6.7% | $5.59B | 33.8% |
| Bridge | 117 | 8.5% | $3.74B | 22.6% |
| Other | 88 | 6.4% | $808M | 4.9% |
| Wallet | 25 | 1.8% | $542M | 3.3% |
| **All** | **1,377** | **100%** | **$16.52B** | **100%** |

Table 9 lists the 20 largest incidents with their outcomes. Where the master carries a company-stated recovery (Bybit's $78.9M, KuCoin's $239M) it is counted and flagged; the corroborated Bybit figure is $42.9M, which moves the all-channel recovery share from 18.8% to 18.6%. The 5.6% in the Bybit row of Table 9 is the company claim divided by the master's $1.40B loss; the corroborated figure is 2.9% of $1.46B (the company claim is 5.4% of $1.46B). The master carries Bybit at the DeFiLlama figure of $1.4B; this paper uses $1.46B (the Bybit and Elliptic count, against about $1.5B in the FBI notice) when naming the incident.

**Table 9.** The 20 largest incidents by loss.

| # | Date | Incident | Loss | Vector | Attribution tier | Recovered |
|---:|:---|:---|---:|:---|:---|---:|
| 1 | 2025-02-21 | Bybit | $1.40B | supply-chain | DPRK (gov) | 5.6% ($78.9M) |
| 2 | 2022-03-23 | Ronin Bridge | $624M | private-key/compromised-infra | DPRK (gov) | 4.8% ($30M) |
| 3 | 2021-08-10 | Poly Network | $611M | smart-contract logic | none | 99.8% ($610M) |
| 4 | 2022-10-06 | BNB Chain Token Hub bridge | $570M | smart-contract logic | none | 5.9% ($33.5M) |
| 5 | 2018-01-26 | Coincheck | $534M | private-key/compromised-infra | DPRK (gov) | none documented |
| 6 | 2022-11-12 | FTX | $450M | social-engineering | other | none documented |
| 7 | 2026-09-24 | Bitget | $387M | private-key/compromised-infra | DPRK (firm) | 0.2% ($840k) |
| 8 | 2022-02-02 | Wormhole | $326M | smart-contract logic | none | 42.9% ($140M) |
| 9 | 2026-09-06 | Liquid Network | $320M | smart-contract logic | none | 83.3% ($266M) |
| 10 | 2024-05-31 | DMM Bitcoin | $305M | social-engineering | DPRK (gov) | none documented |
| 11 | 2026-04-01 | Drift Trade | $295M | social-engineering | DPRK (firm) | none documented |
| 12 | 2026-04-18 | Kelp | $293M | private-key/compromised-infra | DPRK (firm) | 24.3% ($71.1M) |
| 13 | 2024-02-09 | PlayDapp | $290M | private-key/compromised-infra | DPRK (firm) | none documented |
| 14 | 2020-09-29 | KuCoin | $281M | private-key/compromised-infra | DPRK (firm) | 85.2% ($239M) |
| 15 | 2024-07-18 | WazirX: India | $235M | social-engineering | DPRK (gov) | 1.3% ($3M) |
| 16 | 2025-05-22 | Cetus CLMM | $223M | smart-contract logic | none | 72.6% ($162M) |
| 17 | 2023-09-23 | Mixin Network | $200M | private-key/compromised-infra | none | none documented |
| 18 | 2023-03-13 | Euler V1 | $197M | smart-contract logic | none | 100.0% ($197M) |
| 19 | 2021-12-04 | Bitmart | $196M | private-key/compromised-infra | none | none documented |
| 20 | 2022-08-01 | Nomad | $190M | smart-contract logic | none | 19.7% ($37.5M) |

### 3.4 Audited, yet hacked

At least 334 of 4,005 de-duplicated incident events (8.3%) concern a project that had a prior public audit report from a top firm in a corpus of public audit reports compiled by the authors (12,394 engagements, unpublished; no part of the corpus or the linkage is shipped with this paper, so these audit figures cannot be reproduced from the release) [19]. By the same linkage, 147 of our 1,377 headline incidents (10.7%, worth $1.51B or 9.2% of dollars) match an earlier audit report by exact normalized name within three days. The corpus linkage found 334 events by year as 7 (2020), 26 (2021), 33 (2022), 79 (2023), 70 (2024), 50 (2025) and 69 (2026). A manual check of 50 sampled links found the entity link correct in 48 (96.0%). Of those 50, 27 were direct exploits, 8 were non-exploit events, 2 were indirect exposure and 13 could not be verified.

This is a floor and an entity link, and it is not a rate of audit failure. Recall is unmeasured: audits by firms outside the corpus, CertiK audits and reports from before 2020 are invisible to it. The denominator mixes scams and non-contract events. A direct attack may hit a frontend, a key or an account rather than audited code, and no bytecode overlap was established. There is no control population of unexploited audited projects, so audit-failure rates and comparisons between auditors cannot be estimated. The supportable statement is that at least 1 in 12 hacked-project events involves a project with a public audit by a top firm beforehand.

## 4 Negotiation and voluntary returns

### 4.1 How often attackers give the money back

Our earlier paper estimated that attackers voluntarily return funds in roughly one large exploit or key compromise in eight [1]. That study is unpublished. The aggregate tables behind the figures we quote from it (the 12.5% rate, the 183 opening offers, the 35 retention cases) are shipped in data/negotiation_tables/, and a public subset of its case rows is in data/negotiation_cases_public.csv. The frame is 1,078 exploits and key compromises of $100k or more, or $1M-class with any negotiation signal, from 2016 to mid-2026, built from nine public registries. Of those, 98 returns were confirmed. If the 503 incidents where reviewers found no evidence either way behave like the incidents the reviewers swept one by one, the rate is 12.5%. With no assumption at all the bounds are 9.1% to 55.8%, and among the 575 incidents with a known outcome it is 17%. Return is far rarer for stolen keys (7 of 138 known cases) than for contract exploits (91 of 437 known cases), and many of the largest hacks are key compromises.

The master table gives an independent floor. Voluntary return is documented in 110 incidents (8.0% of 1,377) and in 78 of the 659 incidents of $1M or more (11.8%). Among incidents where voluntary return was actually reviewed, it is 78 of 363 (21.0%). The master floor and the earlier estimate agree. The master's 22.8% (150 of 659) is a different quantity: the share of $1M-plus incidents with a documented recovery by any channel, including freezes and seizures, and it must not be read as a return rate.

In dollars, voluntary returns total $1.68B, 10.2% of the $16.52B stolen (8.7% before the Liquid Network return). Three cases (Poly Network at $610M, Liquid Network at $266M and Euler at $197M) account for 64.0% of voluntary dollars, and without them voluntary return is $608M, about 3.7% of dollars stolen (Table 10). The earlier paper's 8.2% ($1.31B of $16.05B across 571 incidents with a known outcome and loss, cut at 5 September 2026 and before Liquid) agrees once scope and date are aligned. The dollars are a handful of famous events, and this is why case series mislead.

**Table 10.** The ten largest voluntary returns (theft-date USD, capped at the loss).

| Incident | Year | Loss | Returned voluntarily (theft-date USD) | Share of that loss | Share of all voluntary dollars |
|:---|---:|---:|---:|---:|---:|
| Poly Network | 2021 | $611M | $610M | 99.8% | 36.3% |
| Liquid Network | 2026 | $320M | $266M | 83.3% | 15.9% |
| Euler V1 | 2023 | $197M | $197M | 100.0% | 11.7% |
| Mango Markets V3 | 2022 | $115M | $67M | 58.3% | 4.0% |
| Munchables | 2024 | $62.5M | $62.5M | 100.0% | 3.7% |
| GMX V1 EVM | 2025 | $42M | $40.1M | 95.5% | 2.4% |
| Nomad | 2022 | $190M | $37.5M | 19.7% | 2.2% |
| ThalaSwap | 2024 | $25.5M | $25.2M | 98.7% | 1.5% |
| dForce Lending | 2020 | $25M | $24.3M | 97.2% | 1.4% |
| Gala | 2024 | $22.3M | $22.3M | 100.0% | 1.3% |
| **All voluntary returns (103 incidents)** |  |  | **$1.68B** |  | **100%** |

### 4.2 The bounty norm: 10% is the price

When a team opens negotiations, it offers 10%. Of 183 recorded on-chain opening offers, 104 were exactly 10%, and the median opening offer was 10% in every year from 2021 to 2026 (Table 11) [1]. The tail has widened: offers of 20% or more were none of 13 openings in 2021, 10 of 44 in 2023 and 14 of 36 in 2026. Part of that is a change in who is being hacked, because smaller losses draw larger percentages. The largest offer on record, Balancer's 20% of $128M, drew no reply. In dollars the median opening offer is $290,000 (181 offers with a loss figure, 45 above $1M).

**Table 11.** Opening bounty offers in the team's first on-chain message, by year.

| Year | Openings | Median offer | Exactly 10% | Share exactly 10% | 20% or more | Share 20% or more |
|:---|---:|---:|---:|---:|---:|---:|
| 2020 | 2 | 12.145% | 1 | 50% | 0 | 0% |
| 2021 | 13 | 10% | 8 | 62% | 0 | 0% |
| 2022 | 23 | 10% | 11 | 48% | 3 | 13% |
| 2023 | 44 | 10% | 25 | 57% | 10 | 23% |
| 2024 | 36 | 10% | 23 | 64% | 11 | 31% |
| 2025 | 27 | 10% | 14 | 52% | 10 | 37% |
| 2026 | 36 | 10% | 20 | 56% | 14 | 39% |

The convention has a pre-hack twin. Immunefi-style bug bounty programs commonly set critical rewards at 10% of funds affected, with a program-specific cap (from program pages seen in search results and not re-fetched). SEAL's Safe Harbor framework sets no standard percentage; its worked example is 10% capped at $1M, and ENS's adopted proposal is 10% with a $250k aggregate cap [20, 21]. The post-hack 10% is the same convention applied without a cap, which is why exploit bounties are large relative to anything paid before an attack. The Immunefi platform paid about $13.45M for 837 valid bugs in the first half of 2026 [22]. The Liquid attacker's withheld $47M alone is about 3.5 times that.

### 4.3 What attackers keep

When attackers settle, they keep about what was offered. Among 35 incidents with both an opening offer and a recorded retention, the attacker kept exactly the offered share in 21, less in 6 and more in 8; the median kept is 10%, equal to the median offered [1]. Counter-offers are uncommon: the earlier paper found 11, and 8 ended in a return, at anything from 0% to 50% kept.

For recent public settlements we use a second, narrower sample: 10 negotiated returns with a stated returned share and a settled split (Table 12). The median retained share is 3.0%, with a range from 0% (Poly Network, Euler, Munchables and NEAR Intents) to 25% (Verus). Poly Network and Euler are carried at 0% retained because the funds came back in full (the $33M Tether froze at Poly was never in the attacker's hands). The sample is selected on success, so it describes how deals end and not how often deals happen. Liquid and Mango are excluded: Liquid's withheld coins are leverage for a refused bounty and not a settlement, and Mango's 41% was a 2022 governance vote. Adding either back moves the median to 4.8%, and adding both moves it to 5.8%.

**Table 12.** Settled negotiated returns with a stated returned share.

| Incident | Month | Loss | Share returned | Share retained |
|:---|---:|---:|---:|---:|
| Poly Network | 2021-08 | $610M | 100.0% | 0.0% |
| Euler Finance | 2023-03 | $197M | 100.0% | 0.0% |
| Munchables (Blast) | 2024-03 | $62.8M | 100.0% | 0.0% |
| Thala (Aptos) | 2024-11 | $25.5M | 98.8% | 1.2% |
| KiloEx | 2025-04 | $7.4M | 93.2% | 6.8% |
| GMX V1 | 2025-07 | $42M | 95.2% | 4.8% |
| Verus-Ethereum Bridge | 2026-05 | $11.4M | 75.0% | 25.0% |
| Renegade | 2026-05 | $209k | 90.9% | 9.1% |
| NEAR Intents | 2026-10 | $3.8M | 100.0% | 0.0% |
| 79thVault (79AU, BNB Chain) | 2026-10 | $12.5M | 92.3% | 7.7% |
| **Median (n=10)** |  |  | 97.0% | **3.0%** |

The right tail is where the news is. Verus (May 2026) retained 24.99% (1,350 of 5,402 ETH), the largest realized retention in the sample, after offering a 24-hour deal on chain. Mango retained 41%. Opening anchors stay at 10% while final splits spread both ways: 79thVault retained 7.7%, KiloEx about 7% and GMX 5% to 10%.

### 4.4 Speed

Returns that happen are fast. We re-audited the dates of the 23 voluntary returns whose first return transaction could be dated, reading each return transaction's block timestamp and measuring from the exploit transaction (data/return_latency_audit.csv). The median first return landed 2.4 days after the exploit, and 21 of the 23 came inside a week. The two later ones are TrustedVolumes and SafeMoon. All 23 fall within 30 days if TrustedVolumes' 15 May transfer counts as a return, and 22 of 23 if only its July return does. Two sensitivities matter. Dropping Shezmu, whose first return is verified but whose reported 80% return is not, gives a median of 2.8 days (n=22, 20 inside a week). Dropping every flagged row (also Value DeFi, which counts returns to individual victims, TrustedVolumes, whose first transfer is ambiguous, Makina, returned by an MEV builder, and Nomad, returned by many copycat wallets) gives the strictest 18-case sample, a median of 3.3 days with 17 of 18 inside a week. An earlier draft reported 3.1 days and 20 of 23; that figure measured from date-only incident dates and overstated latency by up to a day. Measured from the team's first message (17 cases, from the earlier paper and not re-audited), the median lag was 42 hours, with 8 of 17 inside 24 hours [1]. These 23 are the large, well-documented returns (median loss $6.7M against $2.2M for undated ones), so the figure is biased fast, but the direction is robust: a return comes within days or not at all. Teams are quick as well. Among 187 outreach cases with a timestamp, the median first message went out 1.1 days after the incident. Liquid's return was confirmed 25 hours 40 minutes after the drain and about 7 hours after Blockstream's PGP-signed "safe to return" message. NEAR Intents' return arrived within about 36 hours of detection.

### 4.5 Does messaging matter?

Teams that reached out saw a return in 36.5% of known cases, against 3.5% for teams that did not (Table 13) [1]. This is a strong association and not evidence of cause, because teams reach out when the attacker already looks willing. Outreach roughly doubled between 2020 and 2026 (from a third of known cases in 2020 to about 60% in 2023, 2024 and 2026) while the return rate among known outcomes stayed between 14% and 22% (Table 14). The strongest correlate of a return is whether the attacker answers at all: 65 of 79 repliers returned something against 3 of 100 silent attackers, though replies were coded in the same review pass as returns. The one reply measure that does not pass through the reviewer's narrative, an attacker message found by chain scan, gives 6 of 7 against 50 of 143. No tested tactic (offer size, deadline, legal threat, non-pursuit promise, tone) shows a measurable association with return, in tests too small to detect a moderate effect: the minimum detectable odds ratio was between 3.3 and 4.4. We do not write "messaging works". We write that responders who reached an attacker usually did so because the attacker was already willing to talk.

**Table 13.** Any voluntary return by outreach status (frame of 1,078 large exploits and key compromises).

| Incident group | Returned | Not returned | Unresolved | Known outcomes | Share of known |
|:---|---:|---:|---:|---:|---:|
| Team reached out | 80 | 139 | 82 | 219 | 36.5% |
| No outreach | 9 | 247 | 26 | 256 | 3.5% |
| Outreach unknown | 9 | 91 | 395 | 100 | 9.0% |

**Table 14.** Any voluntary return by incident year (known outcomes only; 2026 is partial with 109 of 167 incidents unresolved).

| Year | Returned | Not returned | Unresolved | Share of known outcomes |
|:---|---:|---:|---:|---:|
| 2016 | 0 | 2 | 2 | 0.0% |
| 2017 | 0 | 4 | 4 | 0.0% |
| 2018 | 1 | 9 | 15 | 10.0% |
| 2019 | 2 | 7 | 16 | 22.2% |
| 2020 | 5 | 19 | 23 | 20.8% |
| 2021 | 15 | 68 | 64 | 18.1% |
| 2022 | 16 | 80 | 69 | 16.7% |
| 2023 | 20 | 88 | 62 | 18.5% |
| 2024 | 16 | 83 | 74 | 16.2% |
| 2025 | 10 | 61 | 53 | 14.1% |
| 2026 | 13 | 45 | 109 | 22.4% |

### 4.6 What the messages say

Most replies are terse. Quotes below were decoded from chain data (verified) unless marked reported.

ChainConnect (July 2026, about $650k) accepted in one line (verified, exact), and about 14 hours later returned 280 ETH from the same address [12, 23]:

> I accept the proposal as a whitehat. Please contact me via Blockscan Chat to discuss the details.

Euler (March 2023, $197M). The team's ultimatum read: "If 90% of the funds are not returned within 24 hours, tomorrow we will launch a $1M reward for information that leads to your arrest and the return of all funds." [114] The attacker's first reply came nearly six days later (verified, exact) [24, 25]:

> We want to make this easy on all those affected. No intention of keeping what is not ours. Setting up secure communication. Let us come to an agreement.

Makina (January 2026, about $4.2M) sent a Safe Harbor-style offer to the MEV builder that held 1,023 ETH. About 52 hours later the builder returned exactly 920.7 ETH, leaving 102.3 ETH, which is 10% (verified; the text matches except line breaks) [26].

Verus (May 2026, about $11.5M) offered on chain to "publicly state that we consider those funds to be your bounty", referencing 1350 ETH. The 4,052 ETH return arrived about five and a half hours later, and a plain 1,350 ETH transfer, with no calldata, followed three minutes after that (verified) [27, 28].

KyberSwap (November 2023, $47M). The exploiter's message ran to 2,658 characters and demanded "Complete executive control over Kyber (the company)" and, separately, "Temporary full authority and ownership over the governance mechanism (KyberDAO)", declaring that "the treaty falls through" if its demands were not met by 10 December (verified, exact substrings) [29, 30]. No funds were returned.

Wormhole (February 2022, $326M). The deployer address posted a $10 million bounty "for exploit details, and returning the wETH" (verified). The attacker never took it up, and Jump Crypto replaced the funds [31].

The Liquid Network case is the largest return-plus-dispute in the record (Section 4.7). Its first message, in a Bitcoin OP_RETURN on 6 September 2026, read "we are whitehats. contact us on chain" (verified, exact) [113]. On 9 September the same address demanded "You SHALL pay 10% using your own money as bug bounty or you will cause all your holders a 15% loss" (verified, exact) [32, 33]. We do not quote other messages from that address, which contain abusive claims about named individuals. Blockstream's reply on 11 September, as reported by The Block, was "It is not white-hat activity. It is theft." (reported) [34].

Two further quotes are reported and unverified on chain. NEAR's general manager wrote "We have identified you, sir." in a public 48-hour ultimatum. The attacker's transaction note, "We've returned all the funds, we were in the wrong", is the attacker's and not NEAR's, and no transaction hash for it appears in our sources [35]. Eisenberg's statement after the Mango vote, "I believe all of our actions were legal open market actions, using the protocol as designed", was made in public and not on chain (reported) [36].

### 4.7 Recent cases

Table B1 in the appendix lists the 2025 and 2026 cases with their terms and outcomes. Five of them show the range of outcomes.

**Liquid Network (September 2026, about $320M).** A range-proof verification cache collision in Elements let the attacker mint 3,998.5 unbacked L-BTC on 6 September; 3,996.0 BTC were released by the peg-out [37]. The attacker returned 3,400 BTC (85.0% by units; $266.5M in the master, 83.3% at theft-date price), confirmed 25 hours 40 minutes after the drain. It withheld 598.5 BTC (14.97%, about $47M; 3,998.5 minted less 3,400 returned) against a 10% bounty that Blockstream refused. Blockstream's own incident assessment (23 September) puts "approximately 602 BTC" outstanding [39]. The two figures measure different things: 598.5 BTC is what the attacker holds, and about 602 BTC is the federation's peg shortfall. On 21 October Liquid's peg audit showed 4,234.76 L-BTC against 3,632.23 BTC, a 602.53 BTC gap, and the attacker's 598.50 BTC sat unspent in one Bitcoin output created on 9 September (block 966,199) [137]. No source we read explains the remaining 4.03 BTC. This is a voluntary return and not a settled split, so it is excluded from Table 12. As of 21 October 2026 the standoff was unresolved. On 11 October, the last earlier date we had, peg-outs had been suspended for 35 days and an external audit was underway [38, 39]. The attacker is unidentified and no arrest or charge has been found.

**NEAR Intents (October 2026, about $3.8M).** Twenty-three failed deposits created unbacked balances. NEAR told the attacker publicly that it had identified them ("We have identified you, sir."), without publishing a name, set a 48-hour deadline, and received 100% back within about 36 hours of detection, with no bounty reported to the attacker [35, 40]. The identification method was not disclosed, and we cannot tell whether the identification was real. The only pressure on record is the public statement. No bounty was reported, and money did not make the cleanest recent return. A separate $300,000 reward went to a different researcher for another bug in the same function.

**Verus bridge (May 2026, about $11.5M).** A 24-hour offer to treat the retained coins as a bounty and not pursue the attacker was accepted for 75%. The attacker returned 4,052 ETH and kept 1,350 ETH, 24.99% of the haul [28]. A later exploit of the same flaw by a different attacker took about $7.5M.

**Cetus (May 2025, $223M).** Cetus offered the attacker about $6M (2,324 ETH) to return the rest and drop the matter, and received no reply. Recovery came instead from Sui validators, who froze about $162M (72.6%) within a day (Section 5.4) [41, 42].

**Drift (April 2026, $295M in the master), the counter-case.** Chainalysis counts about $285M and press reports range from $270M to $295M; we use the master's figure in tables and say so here. No funds were frozen or returned that we could find. About $232M of USDC was bridged through Circle's CCTP in over 100 transactions across about six hours, per ZachXBT (an allegation), and then converted to ETH [43, 44]. A Tether-backed package of up to $127.5 million pays users but is make-whole financing and not recovery [45, 120]. The exploiter sent about 44,510 ETH (about $109M) to Tornado Cash on 20 and 21 October, 25,700 ETH of it on the first day, per Onchain Lens as relayed by several outlets; trackers disagree on how much is still held (roughly 56,000 to 63,000 ETH), and a mixer deposit does not show a cash-out [138]. Drift's DFX claims opened on 1 October with about $3.1M of USDT in the recovery pool against about $295M of verified losses, so Tether's "up to $127.5 million" is a commitment ceiling and not cash in the pool [139]. The pattern is the one the earlier paper found for stolen keys. Where the attacker is a state actor with laundering channels, there is no negotiation to have. Hacken's 2025 report reaches the same conclusion: access-control and DPRK-linked incidents rarely result in recovery [46].

### 4.8 Returning does not buy immunity

A protocol's promise not to pursue binds nobody but the protocol. Eisenberg returned about $67M through a Mango DAO vote and was arrested 76 days after the exploit. Ahmed negotiated a partial return, kept the rest and was charged about a year later. Eisenberg's deal was approved by a vote of the Mango DAO, so the victim did agree to it; he was prosecuted anyway. Full-return deals with a public bounty (Euler, GMX) have so far produced no charge, but the sample is tiny and the confounders large (nationality, whether the victim wanted law enforcement involved, publicity). Returning is not legal immunity. The accurate statement is that returners with a full-return deal have so far not been charged, and no rate can be given.

## 5 Recovery channels

### 5.1 The all-channel share

Across all channels, 18.8% of stolen dollars ($3.11B of $16.52B) has a documented recovery. The numerator is every documented recovery (voluntary return, issuer, exchange or protocol freeze, law-enforcement seizure, chain halt or rollback, white-hat or MEV rescue), valued at theft-date USD and capped at 100% of each incident's loss. The denominator is all 1,377 incidents, including those whose outcome was never checked. The figure splits into 10.2% voluntary return ($1.68B) and 8.6% non-voluntary channels ($1.42B).

Three incidents dominate: Poly Network ($610M), Liquid Network ($266M) and KuCoin ($239M, an exchange statement). Without them, in numerator and denominator, the share is 13.0%. Without chain-level interventions it is 16.1%. With Bybit at its corroborated $42.9M instead of the company claim of $78.9M it is 18.6%. The better reading of a typical year is the 13.0%, and the honest summary is that most incidents have no documented recovery (785 of the 1,377 were never outcome-checked, so this describes the record and does not prove that nothing came back).

By count, 150 of 659 incidents of $1M or more (22.8%) have a documented recovery, and 36.4% of the 412 whose outcome was checked. Among the 150 largest incidents, 58 (38.7%) have one, worth 19.9% of their $14.11B; among the top 100, 43 do, worth 20.0% of their dollars. For the largest hacks recovery is the exception but not rare, and it is usually partial.

**Table 15.** Recovery by incident year (theft-date USD; cohorts include later returns, seizures and interventions).

| Incident year | Loss | Recovered (any channel) | Share of loss | of which voluntary | Incidents of $1M or more | with documented recovery | Share | never outcome-checked |
|:---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2016 | $136M | $117M | 85.8% | $0 | 4 | 2 | 50.0% | 1 |
| 2017 | $140M | $31M | 22.1% | $0 | 7 | 1 | 14.3% | 3 |
| 2018 | $902M | $24M | 2.7% | $37k | 11 | 2 | 18.2% | 2 |
| 2019 | $211M | $3.3M | 1.6% | $0 | 13 | 3 | 23.1% | 7 |
| 2020 | $561M | $291M | 51.9% | $40M | 28 | 8 | 28.6% | 12 |
| 2021 | $2.66B | $776M | 29.2% | $648M | 91 | 18 | 19.8% | 26 |
| 2022 | $3.54B | $404M | 11.4% | $183M | 105 | 22 | 21.0% | 35 |
| 2023 | $1.64B | $346M | 21.1% | $259M | 99 | 23 | 23.2% | 36 |
| 2024 | $1.83B | $225M | 12.3% | $163M | 109 | 27 | 24.8% | 38 |
| 2025 | $2.57B | $361M | 14.1% | $80.3M | 77 | 21 | 27.3% | 21 |
| 2026 (to 21 Oct) | $2.33B | $528M | 22.6% | $308M | 115 | 23 | 20.0% | 66 |
| **All** | $16.52B | $3.11B | 18.8% | $1.68B | 659 | 150 | 22.8% | 247 |

The yearly series is lumpy because single events dominate it. The 2016 figure is The DAO fork, 2020 is KuCoin, 2021 is Poly Network, 2023 is Euler, 2025 is Cetus and 2026 is Liquid. Removing the three largest recoveries leaves every year at 8.9% or less (Table 16).

**Table 16.** Recovered share of loss by incident year under four treatments.

| Incident year | All channels | Excluding chain-level interventions | Excluding largest recovery | Excluding three largest | Largest recovery |
|:---|---:|---:|---:|---:|---:|
| 2016 | 85.8% | 41.6% | 74.6% | 0.0% | The DAO ($60M) |
| 2017 | 22.1% | 22.1% | 0.0% | 0.0% | Tether ($31M) |
| 2018 | 2.7% | 2.7% | 1.2% | 0.0% | Bithumb ($14M) |
| 2019 | 1.6% | 1.6% | 0.5% | 0.0% | BitPoint ($2.3M) |
| 2020 | 51.9% | 51.9% | 18.3% | 7.9% | KuCoin ($239M) |
| 2021 | 29.2% | 28.3% | 8.1% | 5.4% | Poly Network ($610M) |
| 2022 | 11.4% | 11.4% | 8.2% | 5.5% | Wormhole ($140M) |
| 2023 | 21.1% | 21.1% | 10.3% | 4.7% | Euler V1 ($197M) |
| 2024 | 12.3% | 12.1% | 9.2% | 7.0% | Munchables ($62.5M) |
| 2025 | 14.1% | 7.8% | 8.5% | 8.9% | Cetus CLMM ($162M) |
| 2026 | 22.6% | 14.4% | 13.0% | 4.9% | Liquid Network ($266M) |
| ALL | 18.8% | 16.1% | 15.7% | 13.0% | Poly Network ($610M) |

**Industry trackers.** Published trackers put frozen-or-returned funds at roughly 5% to 13% of losses in a normal year: Immunefi 5.2% (2022), 13.4% (2023), 7.7% (2024) and 0.4% (Q1 2025); SlowMist 13.2% (2025); CertiK 7.6% (H1 2025) and 8.8% (H1 2026), which are our divisions of CertiK's published totals because CertiK prints no percentage [4, 5, 47, 48, 49, 50]. One or two mega-events can swing a period past 30%: CertiK's September 2026 figure is 35.5% ($273M of $769M), almost all of it Liquid's return [51]. Our incident-year cohorts run higher (11.4% for 2022, 21.1% for 2023, 12.3% for 2024, 14.1% for 2025) because they include returns and seizures that arrived after the trackers' snapshots, and chain interventions, valued at theft date.

### 5.2 By channel

Of the $3.11B recovered, 54.1% was handed back by the attacker or an insider, 17.2% came from issuer, exchange or protocol freezes, 10.6% from law-enforcement seizure or court action, 8.4% from chain halts, validator freezes or security-council freezes, 5.8% from hard forks and rollbacks, 2.3% from white-hat and MEV rescues, and 1.6% from other or unspecified channels (Table 17). Chain-level halts and forks together are 14.2%. Each incident is assigned wholly to its primary channel, and the voluntary row ($1.68B, 103 incidents) equals the returned-funds total behind the 10.2% voluntary share.

**Table 17.** Recovered dollars by primary channel, all scope and top 150.

| Primary channel per incident | All scope: recovered | Incidents | Share | Top 150: recovered | Incidents | Share |
|:---|---:|---:|---:|---:|---:|---:|
| voluntary return (attacker/insider) | $1.68B | 103 | 54.1% | $1.48B | 21 | 52.9% |
| issuer / exchange / protocol freeze | $534M | 32 | 17.2% | $515M | 20 | 18.4% |
| law-enforcement seizure / court | $330M | 11 | 10.6% | $327M | 9 | 11.7% |
| chain-level: halt / validator / security council | $261M | 9 | 8.4% | $233M | 2 | 8.3% |
| chain-level: hard fork / rollback | $179M | 3 | 5.8% | $171M | 2 | 6.1% |
| white-hat / MEV rescue | $70.4M | 19 | 2.3% | $38.3M | 4 | 1.4% |
| other / unspecified | $48.8M | 13 | 1.6% | $37.1M | 4 | 1.3% |
| **Total** | **$3.11B** |  | **100%** | **$2.80B** |  | **100%** |

Counting only non-voluntary channels, the master gives 8.6% of stolen dollars. A stricter, curated freeze brief gives 6.6% ($1.13B of $17.2B on the raw DeFiLlama denominator) and 3.5% ($594M) once chain-level "damage averted" in two cases (BNB Chain 2022 and Cronos 2026) is excluded [52]. The two streams bracket the answer between 3.5% and 8.6%, and the gap is definitional. The freeze brief counts the BNB 2022 halt at $429M, the value of minted BNB that stayed on chain after validators stopped the chain, which the master rejects: that figure is derived by subtraction, and the halt stopped further outflow rather than returning stolen money. The master counts BNB at the $34M that Tether and Circle froze. The freeze brief excludes company claims (KuCoin, Bybit) that the master carries and flags. All of these are documented-only lower bounds.

The earlier paper's priced-channel table ranks seizures first (49% of priced dollars) because it includes the LuBian forfeiture at its forfeiture value ($3.5B) and counts reimbursement by the victim (18%), both of which this paper excludes [1].

### 5.3 Speed decides

Time from incident to the recovery action is the strongest pattern in the channel data (Table 18). Chain halts and validator freezes act within a median of one day, issuer freezes in a median of 1.5 days, exchange freezes in 3 days, and law-enforcement seizures from 169 days to over 5 years (a median of 331 days across the three dated seizures counted in the sums; Bitfinex, about 2,015 days or 5.5 years, is not in the sums). Counts are small (2 to 5 dated events per channel) and some times are approximate ("hours" is coded as 0.3 days or less), so treat the medians as orders of magnitude.

**Table 18.** Days from incident to the recovery action, by channel (counted events with a date). The multi-channel row is the two dated rows, Bybit and Bitget; WazirX has no dated freeze row. Cronos is coded at 0.46 days (detection about 36 minutes in, block production resumed about 11 hours after the attack).

| Action | Counted events with a date | Median days after the incident | Range (days) |
|:---|---:|---:|---:|
| Protocol freeze or pause | 2 | 0.25 | 0 to 0.5 |
| White-hat rescue | 2 | 0.5 | 0 to 1 |
| Chain halt, validator freeze, fork or rollback | 5 | 1 | 0.125 to 33 |
| Stablecoin issuer freeze | 2 | 1.5 | 1 to 2 |
| Exchange freeze | 4 | 3 | 0 to 11 |
| Multi-channel freeze (Bybit, Bitget) | 2 | 6.5 | 3 to 10 |
| Law-enforcement seizure | 3 | 331 | 169 to 1389 |

Containment within hours preserved about 73% to 100% of the value at risk where it happened (Cetus 73%, BNB Chain 76% as damage averted, Cronos 92%, Venus 100%); that is value preserved, not the recovered share of Table 15. Venus paused within 20 minutes and finished a forced liquidation inside about 7 hours. Cronos detected the Tectonic exploit about 36 minutes after it began, then halted the chain and rolled it back, restoring $111.2M of the $120.4M borrowed (92.4%); $9.19M (7.6%) had already left. The post-mortem does not state when the halt took effect [53, 54]. BNB Chain halted about 3 hours after the first malicious withdrawal. Sui validators froze $162M of Cetus's $223M (72.6%) by the next day [42]. A same-day freeze after the money was swapped caught a few percent: Tether froze $181k of the roughly $1.46B taken from Bybit.

Attackers move faster than most responses. Stolen stablecoins in the Bitget case were reportedly converted within 41 minutes (a single outlet) [55]. Bybit's ETH was converted to BTC in about 12 days, 72% through THORChain, and Arkham called the proceeds "fully laundered" on day 12 (that is layering, not final cash-out) [56]. Seizures arrive on a different clock: 169 days (Ronin, US), 331 days (Ronin, Norway), about 1,384 days (Uranium Finance) and about 2,015 days (Bitfinex). Uranium was hacked in April 2021 and seized in February 2025.

### 5.4 What can be frozen

Only three kinds of stolen asset can be frozen after the fact: tokens controlled by an issuer (USDT, USDC, EURe), project tokens with admin controls, and native assets on chains with a coordinated validator set or council (Sui, Arbitrum, Cronos, BNB Chain, Berachain, the Cosmos Hub). ETH, BTC, DAI and XMR on open chains cannot [52]. The overlap between what an issuer can freeze and what hackers steal is small. Issuer freezes caught 1% to 11% of an incident's loss in the counted cases (Poly Network $33M of $611M, 5.4%; Multichain 2.0%). Bybit was almost entirely ETH-denominated. In Mixin's $200M loss, Elliptic's breakdown was $95.3M in ETH, $23.7M in BTC and $23.6M in USDT, and the attacker had converted USDT to DAI to avoid a freeze.

Attackers price freezes in. Cetus's USDC was blacklisted only after it had been swapped to ETH, per ZachXBT. The Poly Network attacker said publicly that the locked USDT had tainted the plan. KuCoin's attackers moved into decentralized exchanges because centralized venues freeze. Bancor froze BNT in 2018 but could not freeze ETH. Bitget asked THORChain to halt and was declined; BlockSec estimates about $269M passed through it by 29 September [57].

Aggregate issuer figures do not measure hack recovery. Tether reports more than $4.4B frozen for law enforcement since inception, and the T3 Financial Crime Unit more than $450M since 2024, but both cover all crime and neither publishes a hack-only split, so neither belongs in a recovery rate [58, 59]. Freezing is also not returning: a frozen token reaches a victim only after a court or the issuer acts, and for 21 of 25 exchange and issuer freezes in the earlier paper no source says whether the funds were released [1].

### 5.5 Chain-level interventions and the controversy

Chain-level actions recover the most dollars per event and carry the most cost. They are available only where a validator set or council can act, and most of the biggest hacks (Ronin, Harmony, Wormhole, Bybit, Drift outside Arbitrum) happened where no such lever existed or where the funds had already left. The cases are:

- **The DAO (2016):** a hard fork 33 days later made about 3.6M ETH (about $50M then) refundable. It created Ethereum Classic.
- **BNB Chain (2022):** a halt about 3 hours in, followed by governance votes on freezing and burning.
- **Cetus on Sui (2025):** validators refused to process transactions from attacker addresses, and 90.9% of votes on 29 May moved the frozen funds to a multisig held by Cetus, OtterSec and the Sui Foundation [42, 60].
- **Cronos (2026):** a rollback of 10,961 blocks (1 hour 54 minutes of history), including unrelated users' transactions. Cronos's statement: "It was a hard decision, taken together with the validators, weighing the finality users expect from a chain against the funds at risk." [53, 54]
- **Flow (December 2025):** a planned six-hour rollback that "blindsided" bridge partners was dropped on 30 December in favour of targeted remediation. It was planned and abandoned, never executed [61, 62].
- **Neutron and the Cosmos Hub (September 2026):** after a malicious governance proposal gave an attacker admin control of Astroport and Drop contracts on Neutron, Cosmos Hub validators halted the Hub for nearly 25 hours and on restart moved 1,227,121 ATOM (about $2.1M) from the attacker-linked address into a 4-of-6 validator multisig. The ATOM are secured, not returned: a proposal to refund them to the attacker drew about 95% No with Veto [132, 133].
- **Qubic (October 2026):** after about 2.94 trillion QU ($1.3M to $1.4M) were drained from 1,404 wallets through weak seed generation, the network's Computors halted the chain. The project says 87.1% never left the chain and is frozen, and MEXC froze the account that received the rest; nothing has been returned, and the project-reported split is unverified [134].
- **Kelp on Arbitrum (April 2026):** the Arbitrum Security Council froze 30,766 ETH (about $71M, 24.3% of the master's $293M) on 20 April, about two days after the hack, by moving it to an intermediary wallet with no owner key [63, 64].

The criticisms are specific. A Sui validator, Chainflow, pointed out that a freeze needs more than a third of stake, that Sui's Nakamoto coefficient is 19, that many validators hold Foundation stake, and that the vote could close in two days [65]. Rollbacks discard honest users' transactions. Each success is a precedent, and the same lever exists on other chains.

Kelp shows that a freeze is not a recovery. Plaintiffs holding unpaid terrorism judgments against North Korea (about $877M face; they are not Kelp victims) served a restraining notice on the frozen ETH on 30 April or 1 May. On 8 May a federal judge modified it to let the Arbitrum DAO vote and transfer the ETH to an Aave-controlled wallet, left the creditors' claims intact, and reserved the question of whether the ETH is North Korean property. An Arbitrum Snapshot vote approved release with 90.96%. Whether the ETH has left Arbitrum custody is unverified [66, 67, 68]. The creditors' turnover motion against the garnishee Aave LLC (S.D.N.Y. 1:25-mc-00527, filed 22 May 2026) had been fully briefed since 2 July and had no ruling on the docket as of 20 October 2026. The creditors have also moved for a determination of rights against fifty wallet owners (fully briefed on 15 October), and papers on a separate turnover motion and Circle's motion to vacate are due on 30 October and 6 November [127]. Even a successful freeze of DPRK-attributed funds can be tied up by competing claimants.

### 5.6 Stablecoin issuers: the Circle and Tether dispute

Tether acts on its own judgment and on law-enforcement requests; Circle freezes only on legal direction. ZachXBT said in March 2025 that Circle took more than 24 hours to blacklist a Bybit address while Tether acted within hours; Circle's chief executive replied that this was "not accurate at all" and that he did not "think the market or users benefit if a private company makes their own judgements to seize funds" [118]. In April 2026 ZachXBT alleged that more than $420M of illicit USDC went unfrozen across 15 hack and fraud cases since 2022, including about $232M in Drift [43]. A class action in the District of Massachusetts (McCollum, for 100 or more Drift users) alleges aiding and abetting conversion and negligence by Circle, and cites a 16-wallet freeze a week earlier in a sealed civil case as proof that Circle can act fast; that batch caught innocent businesses, and a Goated.com wallet was unfrozen after three days [69, 70]. These are allegations, not findings, and no ruling has been found. Circle's stance is a policy choice, not a technical limit, and Tether's broader freezing power draws its own criticism as discretionary.

### 5.7 Made whole is not recovered

Several recent victims, among them Bybit, Drift and Cetus, were paid by someone other than the thief. We did not measure whether this is a growing share of cases, because no series of make-whole payments by year exists in our data. We record these payments separately and never count them as recovery.

- **Bybit** replaced about $1.46B from its own balance sheet, securing 447,000 ETH within 72 hours through bridge loans and purchases, while about $42.9M was frozen within three days. Bybit's later claims of recovered or frozen funds ($73M in September 2025, $78.9M in August 2026) are company statements and unaudited [71, 72].
- **Kelp**: a consortium called DeFi United led by Aave pledged more than $300M. A third-party tracker showed $221.65M raised and 100,338 ETH received on chain on 21 October 2026, and Kelp says its backing was restored on 25 May [73, 74]. Pledges are not deliveries.
- **Drift**: a Tether-backed recovery package of up to $127.5 million [45, 120].
- **Cetus**: $37M ($30M from a Sui Foundation loan, $7M from Cetus reserves) funded the relaunch.
- **Bitget**: a user protection fund of $464M (a company claim). **Upbit (2025)**: the exchange said it covered the entire loss from its own holdings. **Wormhole**: the 1:1 backing was restored by a funder widely reported as Jump Crypto. **Coincheck** repaid about 260,000 users from its own capital.

The earlier paper priced 52 reimbursements at $1.36B against $1.54B lost (88%), but those are the generous cases; coverage was announced as full in 57 of 129 reimbursed incidents, partial in 54, and the median announcement came 3 days after the incident. Where the attacker kept the money, 204 of the 277 victims the paper could classify (74%) recovered something anyway, and the most common source was their own treasury [1]. The first decision after a drain is the reimbursement decision.

## 6 Legal consequences

### 6.1 How often a hack ends in an arrest or charge

Of the 100 largest hacks, 9 (9%) have led to a person being arrested or charged for the hack itself: FTX (the SIM-swap theft), Nomad, Mango Markets, NiceHash, Uranium Finance, KyberSwap Elastic, Coinrail, Josh Jones and IRA Financial. Twelve of 100 if laundering-side and related cases are added (Coincheck, Bitfinex, StableMagnet), and 11 of the 150 largest. NiceHash rests on a DOJ indictment of the DPRK trio for an unnamed Slovenian company, matched by inference; without it the count is 8. Three of the nine (Coinrail, Josh Jones, IRA Financial) are small single-incident press cases. The safe summary is about 1 in 10 of the largest hacks. An independent count on the raw DeFiLlama list, which ranks differently and treats Coincheck's buyers and Mt. Gox as person-level, finds 8 strict.

Across all incidents the rate is about 1 in 86. Sixteen of 1,377 headline incidents (1.2%) have a person arrested or charged for the hack, and 16 of the 659 incidents of $1M or more (2.4%). The independent count on the raw list is 14 of 1,313 (1.1%) and 14 of 595 non-rug incidents of $1M or more (2.4%), and 10 of 195 incidents of $10M or more (5.1%). Arrests were searched systematically only for the top 150 and a sibling case list, so small incidents are under-counted, and all of these are lower bounds from public records. Top-100 hacks with a person charged are $1.03B of $13.12B (7.9%) in the master.

Several cases that a press search would surface are not counted. BitGrail ended in a civil repayment order and a management ban, with no criminal charge confirmed. Multichain's CEO was detained in May 2023, before the July outflows, with no disclosed charges. A CoinDCX engineer whose laptop was infected through a fake freelance job was detained a week after the theft, and a police official, quoted by The Indian Express and relayed by Decrypt, said he was "totally in the dark" [122]. A 2026 arrest in Saint Martin concerns the November 2025 theft from a US Marshals-linked wallet, a different event from the October 2024 one in the top 150, and we found no official source linking the person arrested to the top-150 event. For Bybit, we found no criminal charge or DOJ forfeiture action.

### 6.2 How long it takes

The median time from incident to the first public arrest, indictment, unsealing or detention of a person is 608 days (about 20 months). This is a separate sample of 16 cases with a dated first action, and it is not the 16 incidents of Section 6.1: only 11 cases are in both. The timing sample adds Mt. Gox (2011) and Silk Road (2012), which are before 2016 and outside the 1,377 incidents, the laundering-side cases of Bitfinex and Coincheck, and the detention of the CoinDCX engineer. It lacks Coinrail, Josh Jones, 2gether, IRA Financial and Yala, which have no dated first action in our case file. The mean is 972 days and the interquartile range 354 to 1,650 days. Seventy-five percent took more than a year (Table 19). For the 14 cases that are 2016 or later incidents inside the 1,377 scope the median is 439.5 days (about 14.5 months), and for the 11 that are also in the 16 of Section 6.1 it is 439 days. Among DeFi-era US-led cases (2021 and later, n=9) the median is 439 days. The fast cases involved a KYC-verified exchange or a public identity: Platypus (6 days; two French brothers traced to a Binance account) and Mango (76 days). The sample is right-censored, because incidents with no arrest yet are absent, so the true median for all eventual arrests is longer. Dropping the CoinDCX engineer and the Coincheck loot buyers leaves 14 cases with a median of 722 days.

**Table 19.** Days from incident to first public action against a person, in a separate sample of 16 cases (some pre-2016 or laundering-side; excludes in-rem actions and placeholders). The last column shows whether the case is one of the 16 incidents of 1,377 in Section 6.1.

| Incident | Year | Days to first public action against a person | First action | Evidence grade | Counted in the 16 of 1,377? |
|:---|---:|---:|:---|:---|:---|
| Platypus Finance | 2023 | 6 | arrest | B | yes (one of the 16 in Section 6.1) |
| CoinDCX | 2025 | 7 | detention/arrest | B | in the headline scope; laundering-side or detention only |
| Mango Markets | 2022 | 76 | arrest (complaint) + indictment | A | yes (one of the 16 in Section 6.1) |
| Nirvana Finance | 2022 | 348 | arrest + indictment unsealed | A | yes (one of the 16 in Section 6.1) |
| Crema Finance | 2022 | 374 | arrest + indictment unsealed | A | yes (one of the 16 in Section 6.1) |
| MEV-Boost relay / Ethereum validator-bot exploit | 2023 | 409 | arrest + indictment unsealed | A | yes (one of the 16 in Section 6.1) |
| FTX hack | 2022 | 439 | indictment (2024-01-18) / arrest (Powell Rule 5 hearing 2024-01-24) | B | yes (one of the 16 in Section 6.1) |
| KyberSwap Elastic | 2023 | 440 | indictment (returned 2024-12-30 under seal; unsealed 2025-02-03) | A | yes (one of the 16 in Section 6.1) |
| Coincheck | 2018 | 775 | arrest (receiving/exchanging stolen NEM) | B | in the headline scope; laundering-side or detention only |
| Nomad bridge | 2022 | 1,004 | arrest at Ben Gurion airport (8-count indictment filed Aug 2023, N.D.  | B | yes (one of the 16 in Section 6.1) |
| Slovenian crypto company, Dec 2017 | 2017 | 1,169 | indictment unsealed (superseding; Park first charged by complaint 2018 | A | yes (one of the 16 in Section 6.1) |
| Indexed Finance | 2021 | 1,209 | indictment (returned 2024-12-30 under seal; unsealed 2025-02-03) | A | yes (one of the 16 in Section 6.1) |
| Uranium Finance | 2021 | 1,797 | indictment filed 2026-03-26; surrendered 2026-03-30 | A | yes (one of the 16 in Section 6.1) |
| Bitfinex | 2016 | 2,016 | arrest | A | in the headline scope; laundering-side or detention only |
| Mt. Gox | 2011 | 2,140 | arrest (Greece, at US request) | B | no (pre-2016 incident, outside the headline set) |
| Silk Road withdrawal-flaw theft | 2012 | 3,342 | search warrant/seizure (arrest same period) | B | no (pre-2016 incident, outside the headline set) |
| **Median, this sample (n=16)** |  | **608** | mean 972; interquartile range 354 to 1,650 |  |  |
| **Median, 2016+ incidents inside the headline scope (n=14)** |  | **439.5** | drops Mt. Gox and Silk Road |  |  |
| **Median, the 11 also in the 16 of Section 6.1** |  | **439** | charged for the hack itself |  |  |

### 6.3 What happens to the people charged

Of 23 individuals charged or arrested for a hack or its laundering, 8 were convicted or pleaded (35%), 1 had a conviction vacated with a US appeal pending as of 21 October 2026, 2 were acquitted, 3 are pending, 1 has an unknown outcome and 8 are charged and not in custody (Table 20). Of the 11 whose cases reached a verdict or plea, 8 ended in a conviction or a plea. Seven of the eight are guilty pleas. Powell is in this group on a plea agreement filed under seal in August 2024 and unsealed in April 2025; the docket shows no sentencing date and we did not see a change-of-plea entry, so his plea is inferred from the filed agreement [130]. Prison terms that are on record are 12, 18, 36 and 60 months; Hernandez was sentenced to 12 months of probation. The largest theft ever solved, Bitfinex (119,754 BTC), produced a five-year sentence for Lichtenstein and 18 months for Morgan [75].

**Table 20.** Outcomes for the 23 individuals charged or arrested for a hack or its laundering (verified against DOJ releases and dockets, 21 October 2026).

| Outcome | People | Who |
|:---|---:|:---|
| Convicted or pleaded | 8 | Ahmed; Lichtenstein; Morgan; Zhong; Vinnik (US plea; swapped to Russia before sentencing); Powell (plea agreement filed 2024-08-07, unsealed 2025-04-14; sentencing not set); Hernandez (sentenced 2025-12-08 to 12 months probation); Spalletta (convicted 2026-10-07, sentencing set for 2027-02-16) |
| Conviction vacated or acquitted, US appeal pending | 1 | Eisenberg (counts 1-2 vacated for venue, count 3 acquitted; US appeal pending) |
| Acquitted | 2 | a 22-year-old suspect (Platypus, France); his brother (Platypus, France) |
| Pending | 3 | Anton Peraire-Bueno (retrial ordered ready 2027-06-07); James Peraire-Bueno (same); the Nomad suspect (arrested in Israel; extradition approved; transfer to US unconfirmed) |
| Outcome unknown | 1 | Rohn (no public disposition found; co-defendant Powell has a plea agreement on file) |
| Charged, not in custody | 8 | Medjedovic; Bilyuchenko; Verner; Park Jin Hyok; Jon Chang Hyok; Kim Il; Tian Yinyin; Li Jiadong |
| **Total** | **23** |  |

Criminal cases rarely return money. Recovery through them is dominated by two bitcoin seizures from people who sat on coins for years: Bitfinex (about 95,000 BTC, $3.6B at seizure) and Zhong's Silk Road theft (50,676 BTC, $3.36B at seizure). Everything else is small: Ahmed about $12.3M, Uranium about $31M, Ronin about $30M and a pending forfeiture of $15.1M of DPRK-linked USDT.

Three jury trials have been held. Eisenberg (Mango) was convicted on all three counts on 18 April 2024. On 23 May 2025 the court vacated counts one and two for improper venue and entered a judgment of acquittal on count three, wire fraud, for want of a false representation on a permissionless platform; the government filed a notice of appeal on 22 July 2025 (Second Circuit No. 25-1782), briefing closed with the government's reply on 28 August 2026, and as of 21 October 2026 we found no argument date or decision, so the appeal is pending [76, 77, 78, 79, 131]. The Peraire-Bueno brothers (a MEV-Boost relay exploit) ended in a mistrial on 7 November 2025 after a deadlocked jury; a Rule 29 motion was argued on 13 March 2026 with no ruling found, and an order of 2 April 2026 told the parties to be ready for retrial on 7 June 2027. We last read the docket on 28 September 2026 and found no later ruling or date change as of 21 October 2026, but we did not re-read it on that day [80]. Spalletta (Uranium Finance) was convicted on all counts on 7 October 2026 after a six-day trial before Judge Rakoff, with about $31M seized in February 2025; sentencing is set for 16 February 2027, and trial counsel was relieved by an order of 14 October 2026 [81, 82].

### 6.4 "Code is law" defences

Defendants have argued that they only used public functions of public code. The record is mixed (Table 21).

**Table 21.** Outcomes of "I only used the code as written" defences.

| Case | Defence | Result |
|:---|:---|:---|
| Mango (Eisenberg) | no rules were broken; the DAO consented | convicted; counts 1-2 vacated on venue, count 3 acquitted for no misrepresentation; US appeal pending as of 21 Oct 2026 |
| Platypus (two brothers) | public contract, "ethical hacker" [123] | acquitted in France in December 2023 |
| MEV-Boost relay (Peraire-Bueno) | market speculation; validators acted as designed | hung jury; retrial ordered ready for 7 June 2027 (as of 21 Oct 2026) |
| Crema and Nirvana (Ahmed) | none; pleaded guilty | 3 years |
| Uranium Finance (Spalletta) | only public functions, no forged credentials | convicted on all counts; motion to dismiss denied |
| KyberSwap and Indexed (Medjedovic) | none in court; publicly argued that the code allowed it | at large |

Two cases went the defendant's way in court: Platypus (an acquittal at first instance in France; we did not find whether prosecutors appealed) and Mango (counts 1-2 vacated for improper venue and a judgment of acquittal on count 3 for want of a false representation, with the government's appeal pending). Neither is a ruling that the conduct was legal. One case produced a hung jury, one a jury loss (Spalletta, charged under the computer fraud and money laundering statutes) and one a plea. The Platypus court said the case was not "a carte blanche" for exploiting public code [83]. The fight is over venue, whether wire fraud requires a misrepresentation, and which statute is charged. Computer-fraud and laundering charges have survived so far.

### 6.5 Who gets caught

Almost everyone prosecuted for a hack or its laundering was an insider, a US person, or reachable by a cooperating state: Ahmed (a senior security engineer), Eisenberg (a trader), Spalletta, the Peraire-Bueno brothers, Lichtenstein and Morgan, Zhong, the FTX SIM-swap crew, plus a Canadian, two Frenchmen and a suspect arrested in Israel. They were found through a KYC-verified cash-out (Platypus), by moving or spending coins (Bitfinex, Zhong, Spalletta), through public identities (Mango), or through sleuthing by victims and third parties. The sources we read rarely credit on-chain analysis alone; a name usually came from an exchange record, a seizure or a cooperating victim. Russian-speaking attackers appear as fugitives (the Mt. Gox defendants Bilyuchenko and Verner) or are swapped (Vinnik was traded to Russia in February 2025 before sentencing). For the 2025 and 2026 incidents in Table B1, the recovery that happened came, where the channel is stated, from chain halts, validator freezes, issuer freezes, white-hat rescues or negotiated returns, and not from prosecutors.

## 7 North Korea

### 7.1 A small share of incidents, a large share of dollars

North Korean actors are behind at least 22.6% of the dollars stolen since 2016 on government attribution alone: $3.74B across 32 incidents, out of the $16.52B in the 1,377 headline incidents. That is 22.6% of the dollars from 2.3% of the incidents. Twenty-eight of those 32 rows ($1.65B of the $3.74B) are read through secondary sources (Section 2.4). Adding attributions from firms (Chainalysis, TRM, Elliptic, ZachXBT or the victim's forensics provider) gives 34% ($5.62B) when rows whose only basis is membership of a public researcher list are excluded, and 39.1% ($6.45B across 95 incidents) when they are included. The 47 researcher-list-only rows ($0.83B) are leads, not attributions, which is why the middle figure exists [11].

By count the picture reverses, and each dollar share pairs with the incident share of its own tier: 22.6% of dollars comes from 2.3% of incidents on government attribution alone (32 of 1,377), and 39.1% from 6.9% of incidents with firm and researcher attributions (95 of 1,377). The 95 incidents are 12.7% of the 659 incidents of $1M or more (84 of 659). Among the 100 largest incidents on the master ranking, 14 are government-attributed, worth $3.63B or 27.7% of the top-100 value (Bybit, Ronin, Coincheck, DMM Bitcoin, WazirX, Harmony, Atomic Wallet, Phemex, Radiant, Upbit, BingX, Stake.com, CoinsPaid and BigONE). Published counts agree on the order of magnitude: Chainalysis counts about 7% of incidents in 2023 (20 of 282) and 15.5% in 2024 (47 of 303), although its text says 20% for 2024 [16, 17]. A few exchange, custody and bridge heists do most of the damage. The two April 2026 incidents (Drift and Kelp, $577M in TRM's count) are 59% of the $972M that TRM counts across 207 incidents in the first half of 2026; the 59% is our own division of those two figures and not a TRM statistic [6]. The $577M is TRM's figure for the two attacks, against $588M for them in our master ($295M and $293M). The government-tier share is sensitive to Coincheck, whose government attribution rests on press reporting of a UN panel report: without it the share is about 19.4%, not 22.6%.

**Table 22.** North Korea-attributed incidents and loss by year in the master table (government tier, and firm tier on top; USD at theft date; share is of that year's headline loss).

| Year | Gov-attributed incidents | Gov-attributed loss | Share of year loss | Firm-attributed incidents | Firm-attributed loss | Share of year loss, gov plus firm |
|:---|---:|---:|---:|---:|---:|---:|
| 2016 | 0 | $0 | 0.0% | 1 | $1.5M | 1.1% |
| 2017 | 0 | $0 | 0.0% | 1 | $64M | 45.8% |
| 2018 | 1 | $534M | 59.2% | 4 | $124M | 73.0% |
| 2019 | 1 | $49.3M | 23.3% | 3 | $23.1M | 34.3% |
| 2020 | 0 | $0 | 0.0% | 4 | $305M | 54.4% |
| 2021 | 0 | $0 | 0.0% | 7 | $200M | 7.5% |
| 2022 | 2 | $724M | 20.4% | 3 | $108M | 23.5% |
| 2023 | 4 | $201M | 12.3% | 10 | $305M | 30.9% |
| 2024 | 20 | $716M | 39.2% | 11 | $376M | 59.8% |
| 2025 | 4 | $1.51B | 58.9% | 12 | $135M | 64.1% |
| 2026 | 0 | $0 | 0.0% | 7 | $1.07B | 46.1% |
| **All** | 32 | $3.74B | 22.6% | 63 | $2.72B | 39.1% |

The year shares track the published ones within a few points. Our 2024 figure (39.2% government, 59.8% with firms) sits beside Chainalysis's 61% and TRM's 39%, and the two firms differ because their total-loss denominators differ [17, 84]. In 2025 the share is 58.9% on government attribution and 64.1% with firms, driven by a single event: the Bybit theft ($1.46B) is 72% of Chainalysis's $2.02B North Korea total for the year [2, 85]. Our master table is a lower bound on the firms' totals, since it covers about half of what Chainalysis attributes to the country in 2022 and about four fifths in 2024 (government plus firm tiers, $0.83B of about $1.7B and $1.09B of $1.34B), and omits small attributed incidents that are not public item by item.

Attribution is the weakest link in this section and the 2026 cases show why. Government attribution exists for Bybit (an FBI notice of 26 February 2025) and for older cases. Drift, Kelp and Bitget are firm-attributed only, Kelp's attribution comes from the victim-side forensics provider, and Chainalysis revised its 2023 North Korea total down from about $1.0B to $660.5M because some earlier attributions were "likely no longer related" [16, 63, 85].

### 7.2 Access is human, not code

Of the 47 incidents in our dedicated North Korea dataset, one is a classic smart-contract exploit (Qubit, $80M). By value the leading classes are key or infrastructure compromise (16 incidents, $2.31B), supply-chain or signing-interface compromise (2 incidents, $1.69B, Bybit and WazirX), social engineering (6 incidents, $1.31B, including Ronin, DMM, Radiant and Drift), unknown (7, $0.53B), insider IT workers (15, $0.11B) and the Qubit exploit ($0.08B). TRM reports that infrastructure compromises were about 15% of first-half 2026 incidents but about 76% of value [6].

The techniques are consistent across years: a fake recruiter or contractor with malware, a trojanised trading application, or an in-person meeting by a proxy; then signer deception (the interface shows a benign transaction while the signer approves a malicious one); then a rapid strike. Ronin (2022) began with a fake job offer and a malicious PDF. DMM Bitcoin (2024) began with a fake recruiter and "a supposed pre-employment test" that compromised a custody vendor [124]. Bybit (2025) ran through a compromised Safe{Wallet} developer machine and malicious JavaScript served to the exchange's cold-wallet signers [85]. Drift (2026) involved in-person social engineering and a governance configuration with a two-of-five council and no timelock. Kelp (2026) combined an RPC-node compromise with a denial-of-service attack that forced failover [84]. Pre-funding attacker wallets through a mixer hours to weeks ahead appears in Kelp (about 10 hours) and Drift.

North Korean IT-worker schemes are a separate stream. The multilateral monitoring team estimates $3,500 to $10,000 per month per worker, with up to 12 false identities each, and the DOJ's November 2025 action covered five guilty pleas and 136 affected US companies [86, 87]. On 13 October 2026 the DOJ announced the arrests of two more US nationals under a four-count wire fraud, money laundering and identity theft indictment from the Northern District of Ohio, which describes a scheme of about $3M in revenue affecting more than 70 US companies; they are charged, not convicted [128]. Insider thefts in our dataset are small except Munchables ($62.5M), where the North Korea link is a ZachXBT identification of the developer and no government attribution has been found.

### 7.3 Laundering

The front end is fast and the back end is long. In the Bybit case the stolen tokens were swapped to ETH within minutes, spread across about 50 wallets within about two hours, and converted to BTC through THORChain (72% of the roughly 500,000 ETH bridged, per Arkham), and Arkham called the proceeds "fully laundered" on 5 March 2025, 12 days after the theft [56]. That describes conversion and layering, not final cash-out: eXch alone handled about $200M (about 15%) before it announced a shutdown, and ZachXBT alleges that a Chinese-language network laundered more than $1B over a longer period (single source, unverified) [88, 89]. Chainalysis models a three-wave cycle of about 45 days for 2022 to 2025 thefts: DeFi and mixers in days 0 to 5, limited-KYC exchanges and bridges in days 6 to 10, and no-KYC exchanges, guarantee services and Chinese-language networks in days 20 to 45. It finds that North Korea moves about 60% of its volume in transfers under $500k and over-indexes on Chinese-language money movement, Huione and mixing [2].

The path is built around freezes. Actors convert issuer-controlled tokens to native assets first, which is why the freeze channel in Section 5.4 catches so little [90]. The first OFAC mixer designations (Blender in 2022, Tornado Cash in 2022, Sinbad in 2023) followed Lazarus use of each, and Tornado Cash was delisted on 21 March 2025 [91, 92, 93].

### 7.4 Recovery

Recovery is lower for North Korean thefts. Of the 95 incidents with gov-or-firm attribution ($6.45B), 8.3% of dollars has a documented recovery. Two outliers drive that: KuCoin 2020 ($239M, mostly freezable ERC-20 tokens, on the exchange's own statement) and Munchables 2024 (an insider returned the keys after being identified). Without them the share is 3.8%. On government attribution alone it is 3.4%. All other incidents recover 25.5% of dollars, or 16.6% without the three largest returns. Voluntary return is almost absent: the one North Korea case that returned money voluntarily had an insider who had been doxxed.

What recovery there is comes from freezes and court orders. Bybit's day-one freezes were $42.9M (about 2.9% of $1.46B), including Tether's $181k; the company's later claims of $73M and $78.9M are unaudited [72]. Arbitrum's freeze of $71M from Kelp is the largest, and it is tied up in the creditor dispute described in Section 5.5. The DOJ's civil forfeiture complaints sought $15.1M of USDT linked to four 2023 thefts of about $37M, $100M, $138M and $107M at unnamed platforms [87]. Ronin produced about $30M, the first seizure of its kind, after OFAC listed the getaway wallet [94].

### 7.5 Indictments, sanctions and no arrests

We found no public record of any North Korean operator of an exchange or bridge theft being arrested. The list of formal actions is indictments in absentia: Park Jin Hyok (complaint in 2018), Jon Chang Hyok, Kim Il and Park (unsealed 17 February 2021, including three crypto thefts totalling $112M), the Chinese over-the-counter launderers Tian Yinyin and Li Jiadong (2 March 2020, more than $100M of laundered exchange-hack proceeds), and a Foreign Trade Bank representative with Chinese launderers in April 2023 [95, 96, 97]. Treasury designated eight North Korean bankers and two entities on 4 November 2025 [98]. There have been four OFAC actions naming North Korean hacking groups or their wallet addresses (2019, 2020 and two in April 2022) and four DOJ in-rem actions. That count leaves out the three mixer designations of Section 7.3, which targeted the services and not North Korean persons, and the November 2025 banker designations above, so the number of OFAC actions touching the topic is higher. The only people we found in custody are US and Ukrainian facilitators of IT-worker fraud: five who pleaded guilty in November 2025, and two US nationals arrested in October 2026 who are charged, not convicted [128]. For Bybit we found no DOJ criminal or forfeiture action naming the theft; the exchange itself sued North Korea, its Reconnaissance General Bureau and Lazarus in the District of Columbia (No. 1:26-cv-02173, Judge Bates) on 18 June 2026, under seal. The court granted a temporary restraining order on 19 June and a renewed one on 16 July, granted a preliminary injunction in part on 30 July, and unsealed the case on 6 August; service on the defendants through the State Department began on 25 August [99, 129]. Bybit reports freezing more than $30.5M across more than 28 exchanges and custodians; we did not check that figure against the court record.

For a protocol the implication is hard. Against this adversary, deterrence by prosecution is absent and recovery depends on the first 48 hours. Section 8 takes up the new question of how much the attack surface changes when attackers use models; the evidence we have on state actors and AI so far concerns employment fraud and social engineering, not exploit development [100, 101].

## 8 Attack contracts and AI

The previous sections follow the money after a theft. This section looks at the theft itself, through the on-chain footprint of reproducible EVM exploits: how attacker contracts and habits changed, whether the 2026 jump in recorded incidents shows in more than one tracker, and what is documented about artificial intelligence in attacks. The findings are count-based and cover a different, smaller population than the 1,377 incidents of the earlier sections. We do not join them to the outcome layers, and none is a recovery or enforcement result.

### 8.1 Data

The sample is built from DeFiHackLabs (DHL), a public repository of proof-of-concept reproductions of incidents [102]. At the commit we used, the README lists 897 entries from 2017 to October 2026, of which 793 from 2020 onward cite an attack transaction. We pulled the transaction, receipt and code for each from public JSON-RPC nodes and block-explorer indexers, and enriched 758 of the 793 (95.6%); the other 35 failed on missing transactions or RPC errors. By chain the 758 are BSC 345, Ethereum 306 and 107 on other chains. By year they are 95 for 2020 to 2022, 190 for 2023, 182 for 2024, 153 for 2025 and 138 for 2026 to 18 October.

Four limits shape the results below.

- **Selection.** DHL contains incidents that someone reproduced. It is EVM only, BSC-heavy, and favours small DeFi and token exploits over key compromises and exchange hacks. Key compromise is 0% to 3% of the sample but 8% to 15% of DeFiLlama's all-hack incidents [7]. The trends describe reproducible contract exploits, not hacks in general, and as counts they are not comparable with the dollar shares of Section 3.
- **BSC is partly sampled.** BSC has no keyless indexer. Contract-creation and funding lookups for BSC rows were found by archive-state bisection on a deterministic 50% sample. The constructor flag (Section 8.2) is read from the cited transaction and is not affected. Funder resolution is complete for the 306 Ethereum wallets but covers only 2 to 6 of 22 to 41 BSC wallets a year, so the funding results (Section 8.4) are Ethereum only, and the lag covers only attacker-deployed contracts whose creation was found.
- **Contribution gaps.** DHL added 1 to 6 entries a month from September 2025 to February 2026, against 22 to 26 in June to August 2025. That is a contribution gap, not a lull in attacks, so DHL cannot give monthly counts (Section 8.5).
- **Approximate labels.** Vector labels come from keyword matching on DHL's reason text, address labels are an October 2023 snapshot, and 139 of 758 rows have no USD loss, so we use loss only to weight. Sampled flags were re-checked against chain data, and the canonical entries are K1 to K9 in Appendix A.

### 8.2 Same-transaction attacks

An attack contract that runs its exploit inside its own constructor is deployed and used in one transaction, leaving no gap for a monitor, front-runner or white hat between deployment and use. We flag a row as a constructor attack when the attack transaction cited by DHL creates a contract.

The share rose from about zero to over a third: 4.7% in 2023 (9 of 190), 14.3% in 2024 (26 of 182), 40.5% in 2025 (62 of 153) and 34.1% in 2026 (47 of 138). In 2020 to 2022 it was 0 of 95 after removing one false positive (Fortress Loans, 2022). Adding rows where the contract was deployed and used in the same block but in separate transactions gives 15.4% in 2024, 49.0% in 2025 and 44.2% in 2026 (K1). The rise appears inside each chain, so it is not a change in chain mix: on Ethereum it went from 0 of 39 (2020 to 2022) to 4.1%, 12.8%, 56.1% and 36.2%, and on BSC from 0 of 51 (2020 to 2022, after the same false-positive removal; 2.0% before it) to 5.2%, 12.7%, 29.0% and 28.0%.

**Checks.** We re-fetched 25 flagged rows. All are contract-creation transactions, and 24 of 25 (96%, Wilson interval 80.5% to 99.3%) are consistent with an exploit executed inside the creation transaction. A stricter test, requiring visible value flow to the attacker inside that transaction, passes 18 of 25 (72%); at that rate the 2025 share would be about 29%, still far above the 2020 to 2022 level. None of 15 unflagged rows was a creation transaction (two were created in the same block as the attack, in a different transaction).

**Dollars.** Weighted by reported USD loss, the same-transaction share is much smaller: 0.9% in 2023, 25.1% in 2024, 8.2% in 2025 and 10.9% in 2026. The shift in counts is therefore among small and mid-sized exploits. The dollar shares move a lot from year to year, and we did not decompose them.

**Lag.** The median time between deploying an attacker-controlled contract and using it fell from 10.3 minutes in 2020 to 2022 to 4.2 minutes in 2023 and 2024, and to zero seconds in 2025 and 2026 (n = 44, 90, 97, 84 and 75) (K2). That is the same pattern: strictly same-transaction rows are 60.7% of the 2025 lag set and 53.3% of the 2026 set. With zero-lag rows removed, the median is flat at 10.3, 5.2, 10.9 and 6.0 minutes for 2020 to 2022, 2023, 2024 and 2026 (2025 has only 24 such rows and an unstable 185.4). Attackers stopped doing two steps. They did not get faster at doing them.

**Table 23.** Same-transaction attacks and deploy-to-attack lag in the DeFiHackLabs EVM sample, by year.

| Era | Enriched exploits | Same-tx attacks (share) | Same-tx or same-block | Share of known USD loss | Median lag, min (attacker-deployed) | Median lag excl. zero-lag, min |
|:---|---:|---:|---:|---:|---:|---:|
| 2020 to 2022 | 95 | 0 (0.0%) | 0.0% | 0.0% | 10.3 (n=44) | 10.3 |
| 2023 | 190 | 9 (4.7%) | 6.3% | 0.9% | 4.2 (n=90) | 5.2 |
| 2024 | 182 | 26 (14.3%) | 15.4% | 25.1% | 4.2 (n=97) | 10.9 |
| 2025 | 153 | 62 (40.5%) | 49.0% | 8.2% | 0 (n=84) | 185.4 (n=24, unstable) |
| 2026 (to 18 Oct) | 138 | 47 (34.1%) | 44.2% | 10.9% | 0 (n=75) | 6.0 |

### 8.3 Vector drift and copycat waves

The vector mix changed more slowly (K3). In the sample, oracle and price manipulation fell from 27.4% of incidents in 2020 to 2022 to 15.9% to 20.3% in 2024 to 2026, not monotonically. Access-control bugs about doubled, from 9.5% in 2020 to 2022 and 10.5% in 2023 to 20% to 22% from 2024. Business logic and accounting was the largest group from 2023 (31% to 40%) and second to oracle manipulation in 2020 to 2022 (24.2% versus 27.4%), and reentrancy faded after 2023 (7.9% to 1.3% and 2.9%). Flash loans appear in 52% to 72% of exploits by any evidence, but only 13% to 43% by an on-chain flash-loan event, so the high figure leans on PoC code. They accompany 81% to 100% of oracle exploits but 13% to 33% of access-control ones, so flash-loan use stays high while the oracle share falls. DeFiLlama's all-hack data points the same way, more mildly [7]. Point values rest on keyword labels; the direction is what two datasets support.

Exploits also arrive in waves (K9). DHL's headings and dates show 12 lending-market exploits of one bug class, empty-market donation or rounding inflation, across Compound- and Aave-style forks and similar lending code (Radiant Capital, for example, is an Aave V2 fork), between 15 April 2023 and 14 May 2024: HundredFinance, BaoCommunity, WiseLending, kTAF, Onyx Protocol, Raft, MahaLend, MetaLend, bZx, Channels Finance, Radiant Capital and Sonne Finance. Their reported losses sum to $38M. Nine carry a matching DHL label and three (Onyx, Radiant, Sonne) were added by keyword match, so "same bug class" rests on labels, not bytecode comparison. Other documented clusters are 7 read-only reentrancy incidents (24 October 2022 to 30 July 2023) and 6 ERC-2771 forwarder or unchecked-multicall incidents (May 2025 to September 2026). Two 2026 entries, SecuredFi (5 September) and BiFi (17 October), record an MEV bot replaying a revealed attack within a block. Sixteen sampled incidents carry an explicit white-hat or rescue marker. That is a floor, and intent is unverified, because a searcher who copies an exploit can profit as easily as rescue.

### 8.4 Funding and privacy tools

Do attackers still fund their wallets through Tornado Cash after sanctions? On Ethereum, where funder resolution is near complete, yes (K4). We resolved a funder for 306 wallets in three eras set by the US Treasury's designation of Tornado Cash on 8 August 2022 [91] and its delisting on 21 March 2025 [93]. Tornado's pools funded the attacker wallet directly in 35.5% of cases before designation (11 of 31), 30.2% during sanctions (57 of 189) and 30.2% after delisting (26 of 86). Counting one pass-through hop via an unlabeled wallet, the figures are 38.7%, 37.6% and 33.7%. We quote the direct figures unless we say otherwise, because the 18 one-hop cases (of 112 Tornado-attributed wallets) infer a connection and do not prove common control. Half-year shares from mid-2022 swing between 26% and 46% on 23 to 50 wallets each, so "did not collapse" is supported and "flat" is not.

What changed was a second tool. Railgun, identified by its relay-adapter contract, funded 14 sampled wallets, 13 of them between March and October 2026 (13 of 58 resolved Ethereum wallets in 2026, 22.4%). A 14th, from April 2024, is unconfirmed. After delisting, 42 of 86 wallets (48.8%) were funded by Tornado or Railgun. Whether Railgun is displacing Tornado is not established: the one-hop Tornado share moved from 37.6% to 33.7%, which is within the noise of these samples. A re-check against chain data confirmed 7 of 7 direct Tornado, 3 of 3 one-hop and 3 of 3 Railgun cases. We could not match Railgun's address to an official deployment list, so that label rests on contract source.

**Table 24.** Funding source of attacker wallets on Ethereum, by Tornado Cash sanction era (wallets with a resolved funder).

| Era | Wallets with resolved funder | Tornado, direct | Tornado, incl. one hop | Railgun | Any privacy tool |
|:---|---:|---:|---:|---:|---:|
| Before designation (to 7 Aug 2022) | 31 | 11 (35.5%) | 12 (38.7%) | 0 | 12 (38.7%) |
| Sanctioned (8 Aug 2022 to 20 Mar 2025) | 189 | 57 (30.2%) | 71 (37.6%) | 0 | 71 (37.6%) |
| After delisting (from 21 Mar 2025) | 86 | 26 (30.2%) | 29 (33.7%) | 13 | 42 (48.8%) |

### 8.5 The 2026 count surge

Recorded exploits rose sharply in 2026 (K5). DeFiLlama lists 148 hacks in 2025 (12.3 a month) and 263 from March to September 2026 (37.6 a month), a factor of 3.1 [7]. SlowMist's independent archive shows 202 and 270, from 16.8 to 38.6 a month [8]. Incidents of $1M or more on DeFiLlama rose from 5.8 to 13.1 a month (69 and 92 incidents), which are the records least likely to be marginal additions. So it is not only a DeFiLlama coverage change. The rekt.news leaderboard of the largest losses rose only 1.4 times [9], and DHL shows no surge, though its gaps make that uninformative.

Dollars rose far less. Recorded losses were $2.12B from March to September 2026 against $2.71B in all of 2025, which is about a third more per month, against a tripling in counts. The rise is concentrated in smart-contract incidents (about 4.7 to 19 a month), while private-key and infrastructure incidents rose only about 1.9 times. Both trackers could have widened scope together, and recent months may be revised upward later (we did not measure this). The data cannot say whether there are more attacks, more detection or more reporting, and nothing in them supports attributing the surge to AI.

### 8.6 What is documented about AI

We logged 28 AI-related claims from June to October 2026 coverage and primary pages, and graded each: 12 verified against a primary source we read, 10 credible but not fully checked, 6 speculation. By category, seven are attacker use of AI tooling, four are attacker social engineering, four are capability research and six are AI agents as victims; the rest are defence or other. None is an AI-written exploit used in the wild.

**Capability evidence is strong, and it is simulation.** Anthropic's SCONE-bench built 405 historical contracts from DHL and reported that ten models produced working exploits for 207 (51.11%, best of 8 attempts), worth $550.1M in a simulator [103]. On contracts that post-date the models' cutoff the figure was $4.6M, and a run over 2,849 recent contracts found two novel bugs, worth $3,694 simulated against $3,476 in API cost. A separate academic agent, A1, succeeded on 63% of 36 real vulnerable contracts, and its own simulation of historical attacks puts success at 86% to 89% if run at disclosure and 6% to 21% after a week [104]. Paradigm and OpenAI's EVMbench (18 February 2026) reported over 70% of critical Code4rena bugs exploited by the best model, against under 20% earlier (vendor-reported) [105] (K7). These are measurements of what models can do, not of what attackers did. SCONE-bench is itself drawn from DHL, and DHL's recent commits now carry AI co-author trailers (4 of the last 100 at our check) [111], so benchmark success and AI-shaped dataset features should not be read as confirming each other.

**No verified in-the-wild AI-written exploit.** We found no post-mortem, security-firm statement, PoC comment or verified attacker-contract source that attributes a real exploit to an AI model (K6). The null result has low power: only 15 attacker contracts since 2024 have verified source (none with AI-style markers), and unverified bytecode carries no comments. It is absence of public evidence, not evidence of absence. The constructor shift (Section 8.2), just-in-time wallets and the 2026 count surge are what scripted pipelines would produce, and also what humans following public PoC templates would produce. The data cannot separate them.

**Attackers do use AI, in social engineering and tooling.** Google's threat-intelligence group reported in November 2025 that a DPRK-linked cluster, UNC1069, used Gemini for crypto research, wallet-data locations and lure text and attempted to develop crypto-theft code, while UNC4899 used it for code and exploit research; accounts were disabled [106]. Anthropic reported in August 2025 that DPRK operatives used Claude to obtain and keep remote jobs at US technology firms [101]. The Nx "s1ngularity" npm malware of 26 to 27 August 2025 invoked victims' installed AI command-line tools to hunt for wallet files and secrets [107]. Huntress described a June 2025 BlueNoroff intrusion in which an employee at a cryptocurrency foundation joined a Zoom call with several deepfakes of senior leaders from their own company and external contacts [108]. Anthropic's September 2026 threat report (published 10 September, covering December 2025 to August 2026) documents AI-assisted exploit development, including automated exploit foundries run by a China-based espionage group against security appliances; it describes no in-the-wild crypto or DeFi exploit [136]. This fits Section 7.2: DPRK access is human, not code.

**Speculation, labeled.** TRM Labs' blog (30 April 2026) said analysts "speculate" that DPRK is adding AI to reconnaissance and social engineering [110], and a Bloomberg story the next month, which we could read only through a newsletter summary [119], quoted TRM investigator Nick Carlsen as saying it was "highly likely" that the attackers behind the two April 2026 heists, which other coverage names as Drift and Kelp, had AI help. No evidence was offered, the quote is an inference from how sophisticated the attacks were, and neither incident involved exploit code. Chainalysis (9 June 2026) described $36.7M lost across four incidents in unverified contracts and said AI was "likely accelerating" such attacks, but it did not attribute any of the four to AI [109]. Headlines that said otherwise overstate the report, and opinion pieces warning of a coming wave name no incident. We treat all of these as questions, not findings.

The consequence for the rest of this paper is limited. Nothing in this evidence shows that AI has changed the recovery, return or enforcement patterns of Sections 4 to 7. What the data do show is a shift toward one-transaction attacks among small and mid-sized exploits, which removes the pre-deployment window that front-runners and white hats once had, and a persistent reliance on mixers for funding.

## 9 Discussion

### 9.1 What works

Three things recover money, and they share one property: they act before the proceeds are converted into something nobody can stop.

**Speed.** Chain halts and validator freezes act in about a day, issuer freezes in 1.5 days, exchange freezes in 3 days, and seizures in 169 days to over 5 years (Section 5.3). The cases where containment happened in hours kept about 73% to 100% of value (Cronos 92.4%, Cetus 72.6%, Venus a full forced liquidation). Voluntary returns follow the same clock; Liquid's attacker, for example, returned 85% in about 26 hours. In our re-audited dated sample of 23 returns, the first return arrives at a median of 2.4 days after the exploit (21 of 23 inside a week), and in the earlier paper's smaller sample from the first on-chain message at a median of 42 hours (Section 4.4) [1]. Within each channel the early hours matter more than the channel.

**Freezable assets.** Only issuer tokens, tokens with admin controls and native assets on chains with a coordinating validator set can be frozen. The overlap between that set and the assets thieves take is small (Section 5.4). Attackers who know this convert first. The channel share is therefore a property of asset design as much as of response quality: a protocol or chain that holds value in freezable form has more recovery options, and one that holds ETH, BTC or DAI on an open chain has none.

**Identification.** Most successful prosecutions in our records began with a name or an identifiable counterparty: a public identity, an insider or a KYC-verified cash-out. A minority began with tracing, where the thief moved or spent coins (Bitfinex, Zhong, Spalletta). Where the attacker is anonymous and foreign we found no arrest, and none at all for the largest cases; where an arrest did follow, the first one came a median of 14.5 to 20 months after the hack (Section 6.2). Identification also drives negotiation. A reachable, identifiable counterparty is the condition under which the 10% offer works: in the earlier paper, 80 of 219 incidents where a protocol messaged the attacker saw a return (36.5%) against 9 of 256 with no outreach (3.5%), though that association is not a causal estimate because protocols message when they expect an answer [1].

### 9.2 For protocols

**Pre-negotiated bounties.** The 10% norm is a focal point that both sides already use: 104 of 183 bounty openings in the earlier paper were exactly 10%, and the median share kept by attackers who returned money was 10% (n=35), 21 of them exactly the offer [1]. A bounty published before an incident turns that convention into an instruction. SEAL's Safe Harbor sets no standard percentage, and its terms apply to identified whitehats rescuing funds from an active exploit; it excludes an attacker who starts an exploit and then "rescues" the funds. ENS adopted 10% with a $250k aggregate cap, KYC and OFAC screening, and 72-hour return [20, 21]. It cannot settle with an anonymous attacker, so a protocol needs both the registry for whitehats and a standing, public after-the-fact offer for everyone else. The post-hack 10% is uncapped and therefore much larger than pre-hack payouts, and the protocol's comparison is 10% against total loss.

**Monitoring and response time.** Recovery rates in our data are determined in the first hours. A protocol needs an alert path to the issuers and chain operators that can freeze, a pause mechanism it can use without a governance vote, and a pre-agreed contact with the SEAL 911 and investigator community. Bybit's 72-hour reimbursement shows what a balance sheet can do after the fact; Cronos shows what detection in 36 minutes, followed by a halt and rollback, can do before.

**One-transaction attacks.** In 40.5% of sampled 2025 exploits and 34.1% of 2026 ones the contract was deployed and used in one transaction (Section 8.2). A monitor that waits for a suspicious deployment has nothing to see in those cases, so detection has to key on the first drain, and the pause and freeze paths above have to work in the first block or two. This is an implication of a count-based sample of small and mid-sized exploits, not a measured effect on recovery.

**Reimbursement policy.** Several recent victims (Bybit, Drift and Cetus among them) were made whole by someone other than the thief; we did not measure a trend, but the first decision after a drain is whether to cover users (Section 5.7). That decision should be made in advance, because announcing coverage later does not change whether the thief returns anything but does change whether users leave.

### 9.3 For issuers and chains

The dispute between Tether and Circle is a policy dispute, not a technical one. Tether acts quickly on its own judgment and is criticised for discretion; Circle acts only on legal direction and is criticised for delay (Section 5.6). The data say that issuer freezes catch 1% to 11% of a loss in the counted cases because the thief converts first, so the only way to improve the channel is faster action in the first hours, which requires either a pre-agreed rule (for example, a published emergency-freeze procedure with a short review window) or an accepted discretion. Chains with validator or council freeze power should publish their process before they need it. The controversy in Cetus and Cronos was about who decides and how quickly a vote can close, not about whether the technique works; Kelp shows that a freeze does not end the matter when creditors file claims against the frozen property.

### 9.4 For law enforcement and policymakers

Three patterns matter. First, the arrest rate is 1.2% of incidents (16 of 1,377, about 1 in 86) and 9% of the 100 largest, and the median delay in a separate sample of 16 cases is 20 months (14.5 months for the 14 of them inside our scope), so a victim should not plan around prosecution. Second, the successes involve cooperating jurisdictions and persons with fiat exposure; for foreign state actors there are indictments and sanctions but no custody, and the practical tools are freezes and designations. Third, outcomes in court are mixed on the law: two of the six cases in Table 21 went the defendant's way in court (an acquittal at first instance in Platypus, and Mango counts 1 to 3, vacated for venue or acquitted for want of a misrepresentation, under appeal), one produced a hung jury and one ended with the defendant at large, while computer-fraud and laundering theories have survived. Prosecutors and legislatures will need clarity on venue, misrepresentation and which statute fits permissionless code.

Two implications for policy follow. Recovery channels with the highest per-event yield (chain halts, issuer freezes) run on private discretion with no standard of review, and the cases where discretion was exercised are the ones with litigation. And the numbers that policymakers see (tracker percentages in the 5% to 13% range in a normal year) are lower than the share in our master table, because trackers snapshot early and exclude chain-level actions; the choice of denominator and cohort should be stated whenever a recovery rate is quoted.

## 10 Limitations

**Coverage.** The master table starts from four public lists and a curated layer, and it is not a census. Outcomes were checked for 412 of the 659 incidents of $1M or more; the other 247 were never checked, and "no recovery found" for the checked ones means no public record found, not none. The 18.8% share is therefore a documented-only floor: an incident with no documented recovery adds no dollars, but that does not mean it recovered nothing, and the 247 unchecked incidents are unknown, not unrecovered. Small incidents are under-covered, and arrests for small incidents were searched only through a sibling case list.

**Reported versus verified.** Many figures are reported by a company, a tracker or one outlet. We separate them in the tables: verified means the figure was checked against a primary or on-chain source; reported means a single secondary source. Company claims (KuCoin's 84%, Bybit's $73M and $78.9M, Bitget's $464M fund and its CEO's $1.07M freeze claim) are carried as claims and, where they move a headline, shown as a sensitivity. For Bitget's freeze, independent counts are $0.34M to $0.84M, and the master carries the upper end ($0.84M, which includes swaps blocked mid-flight) rather than the CEO's figure. The recovery share changes by 0.2 points under the Bybit choice and by 5.8 points when the three largest recoveries are removed.

**Attribution.** North Korean attribution uses three tiers. Firm-level attributions can be revised (Chainalysis lowered 2023 by a third), and 2026 cases are preliminary. The 34% and 39.1% shares are upper-tier figures; the 22.6% is the floor on attribution as reported, and 27 of its 32 rows ($1.35B) were read through secondary sources (Section 2.4).

**Provenance.** This project was compiled with AI research agents; every headline figure was re-checked against its source, and errors are possible. The top-150 outcome layer came from a first research pass. An independent verification pass then re-checked 601 field rows (204 agree, 343 find no public record, 22 find new information, 27 are unsupported by the CSV and 5 disagree), and where the two disagreed the verification verdict took precedence. Five top-150 rows were not re-checked. The verification reduces but does not remove error, and a reader who wants to rely on a single incident should read the row's source.

**Valuation.** Everything is in USD at theft date. Recoveries are valued at the same date and capped at 100% of the incident's loss, so an asset that later rose or fell in price changes nothing. Valuing the LuBian forfeiture or Bitfinex seizure at the seizure date would increase the law-enforcement channel many times over.

**Attack-contract sample.** Section 8 rests on 758 reproducible EVM exploits from one public list. It is BSC-heavy, count-based, partly sampled on BSC, missing most key compromises and exchange hacks, and not joined to the outcome layers. The AI evidence is mostly vendor or secondary reporting, several primary pages were read only through summaries, and an absence of public attribution to AI is not evidence that none occurred.

**Causation.** Associations in Sections 4 and 9 (outreach and return, amount offered and amount returned) are observational. Protocols that message attackers differ from those that do not.

**Right-censoring.** Time-to-arrest medians cover only incidents with an arrest and are biased low relative to all eventual arrests. Pending cases and appeals (Eisenberg, Peraire-Bueno, Spalletta's sentencing on 16 February 2027, Powell's sentencing) were open on 21 October 2026.

**Sources.** Some figures come from secondary coverage because primary pages were blocked (DOJ archive pages, the multilateral monitoring team's PDF); they are flagged in the project briefs. Program terms for Immunefi come from search results, not a direct fetch, and are described as such.

## 11 Conclusion

Most stolen crypto is not recovered. Across 1,377 incidents and $16.52B stolen between 2016 and October 2026, 18.8% has a documented recovery by any channel, 13.0% without the three largest, and a typical year of tracked recoveries is 5% to 13%. Returns by attackers are the largest channel (10.2% of dollars) and are concentrated in a few cases. Voluntary return accounts for 54.1% of recovered dollars, and most of the rest comes from actions taken within days. Legal consequences are rarer than the public assumes: 1.2% of incidents lead to an arrest or charge, 9% of the 100 largest, with a median wait of 20 months in a separate sample of 16 cases (14.5 months for those inside our scope), and conviction usually follows a plea. North Korea is behind at least 22.6% of the dollars on government attribution from 2.3% of incidents (34% to 39.1% of dollars with firm attributions, from up to 6.9% of incidents), and we found no operator arrested.

On the attack side, a sample of 758 reproducible EVM exploits shows a shift to one-transaction attack contracts (about 0% in 2020 to 2022, 40.5% in 2025), mixers still funding about 30% of Ethereum attacker wallets after Tornado Cash's delisting, and a rise of 2.3 to 3.1 times in recorded incidents from 2025 to March-September 2026 that dollars did not match. We found no verified exploit written by AI in the wild, and the AI evidence we could verify is capability research and attacker use in social engineering and tooling.

The practical lesson is that the outcome of a hack is decided in its first days by choices made before it: which assets are freezable, who can act, what the pre-agreed offer is and whether the victim has decided to make users whole. The data support four recommendations for protocols and policy: publish a standing bounty and a freeze contact path before an incident, keep value in forms that a coordinating party can freeze where that is acceptable, measure recovery with a stated denominator and cohort, and treat identification of the attacker, not code, as the condition under which both negotiation and enforcement work.

## References

1. Authors' unpublished prior study: One hack in eight: returns after crypto exploits (draft, not yet published). Unpublished; aggregate tables shipped in data/negotiation_tables/ (public case rows in data/negotiation_cases_public.csv). Headline figures R1, R3 and R5 rest on it.
2. Chainalysis, Crypto hacking and stolen funds (2026 edition). https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/
3. CertiK, Hack3d: The Web3 Security Report 2025. https://certik.com/blog/hack3d-the-web3-security-report-2025
4. CertiK, Hack3d H1 2026 report. https://www.certik.com/blog/certik-hack3d-h1-2026-report
5. Immunefi, Crypto Losses Report 2022. https://immunefi.com/blog/research/immunefi-crypto-losses-report-2022/
6. TRM Labs, H1 2026 crypto hacks reach record high as losses fall below $1 billion. https://www.trmlabs.com/resources/blog/h1-2026-crypto-hacks-reach-record-high-as-losses-fall-below-usd-1-billion
7. DeFiLlama, Hacks dashboard and API. https://defillama.com/hacks ; https://api.llama.fi/hacks
8. SlowMist, Hacked: blockchain hacked archive and statistics. https://hacked.slowmist.io/statistics/?c=all&d=all
9. rekt.news, Leaderboard. https://rekt.news/leaderboard/
10. SunWeb3Sec, DeFiHackLabs. https://raw.githubusercontent.com/SunWeb3Sec/DeFiHackLabs/625c8c4f23048924066d81a8e2e8175e110d8bc7/README.md
11. tayvano, lazarus-bluenoroff-research (commit 11f7a31). https://github.com/tayvano/lazarus-bluenoroff-research/tree/11f7a31
12. Project working note: on-chain verification of negotiation messages (unpublished project brief; a scrubbed copy is shipped as data/briefs/onchain-verification.md and the rows are in data/onchain_verification.csv).
13. Project working note: legal verification of arrests, charges and dockets (unpublished project brief; only an excerpt on the "code is law" defences is shipped as data/briefs/arrests-and-prosecutions.md, and the case rows are in data/law_enforcement_cases.csv).
14. Chainalysis, 2022 Biggest Year Ever For Crypto Hacking. https://www.chainalysis.com/blog/2022-biggest-year-ever-for-crypto-hacking/
15. Chainalysis, 2022 Crypto Crime Report: Introduction. https://www.chainalysis.com/blog/2022-crypto-crime-report-introduction/
16. Chainalysis, Crypto hacking and stolen funds (2024 edition). https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2024/
17. Chainalysis, Crypto hacking and stolen funds (2025 edition). https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2025/
18. Cointelegraph, Crypto hack losses fall 51% in 2023 (CertiK). https://cointelegraph.com/news/crypto-hack-losses-51-percent-decline-2023-certik
19. Authors' corpus of public web3 audit reports (unpublished findings draft). Unpublished; no tables are shipped, so headline A1 cannot be reproduced from this release.
20. Security Alliance, SEAL Whitehat Safe Harbor overview. https://frameworks.securityalliance.org/safe-harbor/overview/
21. ENS DAO, Proposal EP 6.19 (Safe Harbor). https://docs.ens.domains/dao/proposals/6.19
22. The Block, Immunefi whitehat payouts, H1 2026. https://www.theblock.co/post/407707
23. ChainConnect: whitehat acceptance message (Ethereum transaction). https://etherscan.io/tx/0x37e544644c83c379f71b2c2096605fce311935d88ac1cbd58277a4da94266483
24. Euler: attacker reply message (Ethereum transaction). https://etherscan.io/tx/0xcc73d182db1f36dbadf14205de7d543cfd1343396b50d34c768529aaab46a1c0
25. The Block, Euler hacker returns funds. https://www.theblock.co/post/224705/euler-hacker-returns-funds
26. Makina: Safe Harbor-style offer to MEV builder (Ethereum transaction). https://etherscan.io/tx/0xc5c5898eaf8c9ac7bee2c28eb971e8c5fee51c9ecdaf48b42c3357186c0235bf
27. Verus: on-chain bounty offer (Ethereum transaction). https://etherscan.io/tx/0x3ce93e671fd83ec14efc409102ac4af49434d1bedf50730c8eb471917e0789b6
28. The Block, Verus bridge exploiter returns 4,052 ETH. https://www.theblock.co/post/402319/verus-bridge-exploiter-returns-4052-eth
29. KyberSwap Elastic: exploiter message (Ethereum transaction). https://etherscan.io/tx/0x0479da9d6a3a29b294d6337630ea0a482e7ec7223f3b6e6d72442f6c450264d4
30. The Block, Kyber hacker control message. https://www.theblock.co/post/265429/kyber-hacker-control-message
31. Wormhole: $10M bounty offer (Ethereum transaction). https://etherscan.io/tx/0x2d8b7901bff18ae6abe1a50aebe44b70559f39ff357b21340843d368b9486859
32. Liquid Network: 'You SHALL pay 10%' message (Bitcoin transaction). https://mempool.space/tx/f7055f6c8dd00f404e48c12483ae740180f658db206733505bb27b015e579588
33. TRM Labs, 2026's biggest hack to date: Liquid Network. https://www.trmlabs.com/resources/blog/2026s-biggest-hack-to-date-attackers-drained-usd-319-million-in-bitcoin-from-liquid-network-then-returned-85-of-funds
34. The Block, Blockstream refuses ransom demand for remaining 600 BTC from Liquid exploit. https://www.theblock.co/news/ecosystems/2026-09-11-blockstream-refuses-ransom-demand-for-remaining-600-btc-from-liquid-exploit-414247
35. Decrypt, NEAR Intents recovers $3.8 million after 48-hour ultimatum. https://decrypt.co/380014/near-intents-recovers-3-8-million-after-48-hour-ultimatum
36. The Block, Mango Markets exploiter comes clean, claims all actions were legal. https://www.theblock.co/post/177424/mango-markets-exploiter-comes-clean-claims-all-actions-were-legal
37. crypto.news, Liquid Network $320 million drain. https://crypto.news/liquid-network-320-million-drain-cache-bug-unbacked-bitcoin/
38. Bitcoin.com News, Liquid Network at 86% backing. https://news.bitcoin.com/crypto-news/liquid-network-at-86-backing-as-bitcoin-redemption-freeze-drags-on/
39. Liquid Network, security incident assessment. https://blog.liquid.net/liquid-network-security-incident-assessment/
40. KuCoin News, NEAR Intents post-mortem report. https://www.kucoin.com/news/flash/near-intents-releases-post-mortem-report-on-3-8m-vulnerability
41. The Block, Cetus protocol offers hacker bounty. https://www.theblock.co/post/355511/cetus-protocol-sui-bounty
42. The Block, Sui community passes governance vote to recover stolen Cetus funds. https://www.theblock.co/post/356347/sui-community-passes-governance-vote-to-recover-stolen-cetus-funds-blocked-by-validators-in-223m-heist
43. The Block, ZachXBT accuses Circle of slow USDC freezes ($420 million). https://www.theblock.co/amp/post/396296/blockchain-sleuth-zachxbt-accuses-circle-slow-usdc-freezes-420-million-illicit-funds
44. Chainalysis, Lessons from the Drift hack. https://www.chainalysis.com/blog/lessons-from-the-drift-hack/
45. The Block, Drift $127 million Tether recovery pivots to USDC/USDT. https://www.theblock.co/post/397735/drift-127-million-tether-recovery-pivots-circle-usdc-usdt-280-million-exploit
46. Hacken, 2025 Yearly Security Report. https://assets.hacken.io/assets/Hacken-2025-Yearly-Security-Report.pdf
47. Immunefi, Crypto Losses Report 2023. https://immunefi.com/blog/research/immunefi-crypto-losses-report-2023/
48. Immunefi, Crypto Losses 2024 report. https://immunefi.com/blog/research/immunefi-crypto-losses-2024-report/
49. Immunefi, Crypto Losses Q1 2025 report. https://immunefi.com/blog/research/immunefi-crypto-losses-q1-2025-report/
50. Unlock Blockchain, Cyberattacks on digital assets surge in 2025 (SlowMist figures). https://www.unlock-bc.com/156111/cyberattacks-on-digital-assets-surge-in-2025-as-stolen-funds-jump-46/
51. GNcrypto, September crypto hacks hit 2026 high at $768.5 million (CertiK figures). https://www.gncrypto.news/news/september-crypto-hacks-hit-2026-high-768-5-million-losses/
52. Project working note: freezes, seizures and recovery (unpublished project brief, not shipped; the events are in data/recovery_events.csv).
53. The Block, Cronos post-mortem. https://www.theblock.co/news/ecosystems/2026-09-08-cronos-post-mortem-413724
54. CoinDesk, Cronos executes controversial blockchain rollback to recover $111 million. https://www.coindesk.com/business/2026/09/08/cronos-executes-controversial-blockchain-rollback-to-recover-crypto-worth-usd111-million
55. ChangeNOW, Q3 2026 crypto hacks report. https://changenow.io/blog/q3-2026-crypto-hacks-report
56. Arkham Intelligence, Lazarus bridged $1.3B of Bybit ETH to Bitcoin. https://info.arkm.com/research/lazarus-bridged-1-3b-of-bybit-eth-to-bitcoin
57. BlockSec, Bitget hack laundering fund tracing. https://blocksec.com/blog/bitget-hack-laundering-fund-tracing
58. The Block, Tether freezes $344 million in USDT on Tron (cumulative figures). https://www.theblock.co/post/398599/tether-freezes-344-million-in-usdt-on-tron-after-wallets-flagged-by-u-s-authorities
59. The Block, Tether, Tron and TRM freeze over $450 million (T3 FCU). https://www.theblock.co/post/401252/tether-tron-trm-labs-freeze-over-450-million-in-illicit-crypto-assets
60. Sui Foundation, Cetus incident response: on-chain community vote. https://suifoundation.ghost.io/cetus-incident-response-onchain-community-vote/
61. The Block, Flow's planned rollback blindsided some partners. https://www.theblock.co/post/383808/flows-controversial-planned-rollback-to-undo-3-9-million-exploit-blindsided-some-partners
62. Cryptopolitan, Flow scraps rollback plan. https://www.cryptopolitan.com/flow-scraps-rollback-plan/
63. Chainalysis, KelpDAO bridge exploit (April 2026). https://www.chainalysis.com/blog/kelpdao-bridge-exploit-april-2026/
64. CoinDesk, Inside the $71 million freeze on Arbitrum. https://www.coindesk.com/tech/2026/04/22/inside-the-usd71-million-freeze-on-arbitrum-that-has-the-crypto-world-questioning-what-decentralization-really-means
65. Chainflow, Official response to the Cetus exploit and Sui governance vote. https://chainflow.io/chainflows-official-response-to-the-cetus-exploit-and-sui-governance-vote/
66. Cointelegraph, Court lets Arbitrum DAO transfer $71M in ETH tied to North Korea hack to Aave. https://cointelegraph.com/news/court-lets-arbitrum-dao-to-transfer-71m-in-eth-tied-to-north-korea-hack-to-aave
67. The Block, North Korea terrorism creditors move to seize Arbitrum-frozen Kelp ETH. https://www.theblock.co/post/399819/north-korea-terrorism-creditors-move-to-seize-arbitrum-frozen-kelp-dao-eth-ahead-of-defi-united-vote
68. Cointelegraph, Arbitrum vote on proposal to unfreeze $71M ETH passes with 90% majority. https://cointelegraph.com/news/arbitrum-vote-on-proposal-to-unfreeze-71m-eth-passes-with-90-majority
69. The Paypers, Circle faces class action lawsuit over failure to freeze funds in Drift exploit. https://thepaypers.com/fraud-and-fincrime/news/circle-faces-class-action-lawsuit-over-failure-to-freeze-funds-in-drift-protocol-exploit
70. The Block, Circle class action lawsuit over the Drift exploit. https://www.theblock.co/post/397840/circle-class-action-lawsuit-drift-exploit
71. AGBI, Crypto bounty hunters helped salvage Bybit's business. https://www.agbi.com/analysis/cybersecurity/2025/09/crypto-bounty-hunters-helped-salvage-bybits-business/
72. Decrypt, Bybit sues North Korea over $1.5B hack, wins order freezing assets. https://decrypt.co/375180/bybit-sues-north-korea-over-1-5b-hack-wins-order-freezing-assets
73. DeFi United campaign tracker. https://defiunited.live/
74. Cointelegraph, KelpDAO says rsETH restored five weeks after protocol hack. https://cointelegraph.com/news/kelpdao-says-rseth-restored-5-weeks-after-protocol-hack
75. US DOJ (D.C.), Bitfinex hacker sentenced for money laundering conspiracy. https://www.justice.gov/usao-dc/pr/bitfinex-hacker-sentenced-money-laundering-conspiracy-involving-billions-stolen
76. US DOJ (SDNY), Man convicted in $110 million cryptocurrency scheme. https://www.justice.gov/usao-sdny/pr/man-convicted-110-million-cryptocurrency-scheme
77. The Block, US judge overturns fraud convictions of Mango Markets exploiter Eisenberg. https://www.theblock.co/post/355666/u-s-judge-overturns-fraud-convictions-of-mango-markets-exploiter-eisenberg-determining-improper-venue
78. DL News, Prosecutors appeal acquittal of Mango Markets exploiter. https://www.dlnews.com/articles/defi/prosecutors-appeal-acquittal-of-mango-markets-exploiter/
79. CourtListener, United States v. Eisenberg docket. https://www.courtlistener.com/docket/66709457/united-states-v-eisenberg/
80. CourtListener, United States v. Peraire-Bueno docket. https://www.courtlistener.com/docket/68532347/united-states-v-peraire-bueno/
81. US DOJ (SDNY), Jonathan Spalletta convicted of defrauding crypto exchange over $50 million in hacks. https://www.justice.gov/usao-sdny/pr/jonathan-spalletta-convicted-defrauding-crypto-exchange-over-50-million-hacks-0
82. CourtListener, United States v. Spalletta docket. https://www.courtlistener.com/docket/73112434/united-states-v-spalletta/
83. The Block, Platypus Finance hackers cleared of criminal charges (Le Monde). https://theblock.co/post/265797/platypus-finance-hackers-cleared-of-criminal-charges-le-monde
84. TRM Labs, North Korea stole 76% of all crypto hack value in 2026 with just two attacks. https://www.trmlabs.com/resources/blog/north-korea-stole-76-of-all-crypto-hack-value-in-2026-with-just-two-attacks
85. FBI IC3, Public Service Announcement PSA250226 (Bybit, TraderTraitor). https://www.ic3.gov/PSA/2025/PSA250226
86. Chainalysis, MSMT report on North Korean cyber threats. https://www.chainalysis.com/blog/msmt-report-north-korea-dprk-cyber-threats/
87. US DOJ, Nationwide actions to combat illicit North Korean government activity (14 Nov 2025). https://www.justice.gov/opa/pr/justice-department-announces-nationwide-actions-combat-illicit-north-korean-government
88. Elliptic, The rise and fall of eXch. https://www.elliptic.co/blog/the-rise-and-fall-of-exch-the-dark-service-used-by-north-korea-to-launder-200-million-stolen-from-bybit
89. CryptoNinjas, ZachXBT says Chinese crime ring laundered $1B for Lazarus. https://www.cryptoninjas.net/news/zachxbt-says-chinese-crime-ring-laundered-1b-for-lazarus-after-1-5b-bybit-hack/
90. Elliptic, Bybit hack: largest in history. https://www.elliptic.co/blog/bybit-hack-largest-in-history
91. US Treasury, Press release jy0916 (Tornado Cash designation). https://home.treasury.gov/news/press-releases/jy0916
92. US Treasury, Press release jy1933 (Sinbad designation). https://home.treasury.gov/news/press-releases/jy1933
93. US Treasury, Press release sb0057 (Tornado Cash delisting). https://home.treasury.gov/news/press-releases/sb0057
94. The Block, Chainalysis and US law enforcement recover $30 million from Ronin exploit. https://www.theblock.co/amp/post/168663/chainalysis-and-us-law-enforcement-recover-30-million-from-north-korea-linked-ronin-exploit
95. US DOJ, Three North Korean military hackers indicted (2021). https://www.justice.gov/archives/opa/pr/three-north-korean-military-hackers-indicted-wide-ranging-scheme-commit-cyberattacks-and
96. US DOJ, Two Chinese nationals charged with laundering over $100 million (2020). https://www.justice.gov/archives/opa/pr/two-chinese-nationals-charged-laundering-over-100-million-cryptocurrency-exchange-hack
97. US DOJ, North Korean Foreign Trade Bank representative charged (2023). https://www.justice.gov/archives/opa/pr/north-korean-foreign-trade-bank-representative-charged-crypto-laundering-conspiracies
98. US Treasury, Press release sb0302 (4 Nov 2025 DPRK bankers designations). https://home.treasury.gov/news/press-releases/sb0302
99. CoinDesk, Bybit sues North Korea and Lazarus Group over $1.5 billion hack. https://www.coindesk.com/policy/2026/08/07/bybit-sues-north-korea-and-lazarus-group-over-usd1-5-billion-hack-secures-asset-freeze
100. TRM Labs, The 2026 AI in Crime Adoption Index. https://www.trmlabs.com/reports-and-whitepapers/the-2026-ai-in-crime-adoption-index
101. Anthropic, Detecting and countering misuse (August 2025). https://www.anthropic.com/news/detecting-countering-misuse-aug-2025
102. SunWeb3Sec, DeFiHackLabs (commit 23c7bd83ccb4524972a9493617fcc8764ab6269b, used for Section 8). https://github.com/SunWeb3Sec/DeFiHackLabs
103. Anthropic, AI agents find $4.6M in blockchain smart contract exploits (SCONE-bench, 1 Dec 2025). https://www.anthropic.com/research/smart-contracts
104. Gervais and Zhou, AI Agent Smart Contract Exploit Generation (A1), arXiv 2507.05558. https://arxiv.org/abs/2507.05558
105. Paradigm, EVMbench (18 Feb 2026). https://www.paradigm.xyz/2026/02/evmbench
106. Google Threat Intelligence Group, Threat actor usage of AI tools (5 Nov 2025). https://cloud.google.com/blog/topics/threat-intelligence/threat-actor-usage-of-ai-tools
107. StepSecurity, Popular Nx build system package compromised with data-stealing malware (s1ngularity, 26-27 Aug 2025). https://stepsecurity.io/blog/supply-chain-security-alert-popular-nx-build-system-package-compromised-with-data-stealing-malware
108. Huntress, Inside a BlueNoroff Web3 intrusion (18 Jun 2025). https://www.huntress.com/blog/inside-bluenoroff-web3-intrusion-analysis
109. Chainalysis, Attackers exploiting unverified smart contracts (9 Jun 2026). https://www.chainalysis.com/blog/attackers-exploiting-unverified-smart-contracts/
110. TRM Labs, North Korea stole 76% of all crypto hack value in 2026 with just two attacks (30 Apr 2026; the source of the "speculate" sentence on DPRK and AI; same post as [84]). https://www.trmlabs.com/resources/blog/north-korea-stole-76-of-all-crypto-hack-value-in-2026-with-just-two-attacks
111. SunWeb3Sec, DeFiHackLabs commit e6330a8b29 (Claude co-author trailer, GitHub API). https://api.github.com/repos/SunWeb3Sec/DeFiHackLabs/commits/e6330a8b29
112. Euler Labs, War and peace: behind the scenes of Euler's $240M exploit recovery. https://www.euler.finance/blog/war-peace-behind-the-scenes-of-eulers-240m-exploit-recovery
113. Liquid Network: first attacker message, "we are whitehats. contact us on chain" (Bitcoin transaction). https://mempool.space/tx/c103de95817b43f2df635ec6f35ff126ca26a7c6d20570c4b01866b2b3e69a19
114. Euler: the team's ultimatum message (Ethereum transaction). https://etherscan.io/tx/0x8f2b61a0c70012df1e3d918e7ac6486a1c332a9e530f3d4061735c6620f960d9
115. GMX V1: attacker reply, "ok, funds will be returned later" (Arbitrum transaction). https://arbiscan.io/tx/0x1d806cbb459b06d1b8af6ae2555fc9e0efa0f20d3eb023781eeb31f4919feac0
116. Gizmodo, North Korea very likely behind $388 million hack of crypto exchange Bitget (reports Elliptic's assessment). https://gizmodo.com/north-korea-very-likely-behind-388-million-hack-of-crypto-exchange-bitget-2000817421
117. TRM Labs, Bitget loses $351.6 million in hot wallet breach in likely North Korea attack. https://www.trmlabs.com/resources/blog/bitget-loses-usd-3516-million-in-hot-wallet-breach-in-likely-north-korea-attack
118. DL News, Circle's slow response to freeze Bybit hack funds fuels 'bad actor' accusations (2 Mar 2025). https://www.dlnews.com/articles/people-culture/circle-slow-response-freeze-bybit-hack-bad-actor-accusations
119. Cybersecurity Docket (Bloomberg summary, 15 May 2026), AI-Hacking Threat Pushes $130 Billion Crypto Sector to the Brink. https://cybersecurity-docket.beehiiv.com/p/ai-hacking-threat-pushes-130b-crypto-sector-to-the-brink
120. FinanceFeeds, Tether backs Drift Protocol with $127.5M plan following $280M exploit. https://financefeeds.com/tether-backs-drift-protocol-with-127-5m-plan-following-280m-exploit/
121. TRM Labs, Key suspect in $190M Nomad Bridge exploit extradited to the United States (headline; the page body says Israel arrested the suspect and approved extradition). https://www.trmlabs.com/resources/blog/key-suspect-in-190m-nomad-bridge-exploit-extradited-to-the-united-states
122. Decrypt, CoinDCX Employee Arrested Over $44M Exchange Hack. https://decrypt.co/332903/coindcx-employee-arrested-over-44m-exchange-hack
123. Cointelegraph, Platypus exploiters walk free after claiming to be ethical hackers. https://cointelegraph.com/news/platypus-hacker-france-8-5-m-ethical-hacker
124. The Hacker News, North Korean Hackers Pull Off $308M Bitcoin Heist from Crypto Firm DMM Bitcoin. https://thehackernews.com/2024/12/north-korean-hackers-pull-off-308m.html
125. CoinDesk, Ledger investigates potential wallet tampering after reports of $86 million in crypto stolen (9 Oct 2026). https://www.coindesk.com/business/2026/10/09/ledger-investigates-potential-wallet-tampering-after-reports-of-usd86-million-in-crypto-stolen
126. Bitquery, Ledger CryptoBilis hack investigation. https://bitquery.io/investigations/ledger-cryptobilis-hack
127. CourtListener, Kim v. Democratic People's Republic of Korea (S.D.N.Y. 1:25-mc-00527) docket. https://www.courtlistener.com/docket/71941310/kim-v-the-democratic-peoples-republic-of-korea/
128. US DOJ, Justice Department Announces Coordinated Actions to Combat North Korean Remote IT Worker Schemes Affecting More than 70 U.S. Companies (13 Oct 2026, release 26-1171). https://justice.gov/opa/pr/justice-department-announces-coordinated-actions-combat-north-korean-remote-it-worker
129. CourtListener, Bybit Technology Ltd v. Democratic People's Republic of Korea (D.D.C. 1:26-cv-02173) docket. https://www.courtlistener.com/docket/73727990/bybit-technology-limited-v-democratic-peoples-republic-of-korea/
130. CourtListener, United States v. Powell (D.D.C. 1:24-cr-00038) docket. https://www.courtlistener.com/docket/68215367/united-states-v-powell/
131. CourtListener, United States v. Eisenberg (2d Cir. No. 25-1782) docket. https://www.courtlistener.com/docket/71456896/united-states-of-america-v-eisenberg-usa/
132. Protos, Cosmos Hub halts for 24 hours after Neutron governance attack (23 Sep 2026). https://protos.com/cosmos-hub-halts-for-24-hours-after-neutron-governance-attack/
133. Unchained, Cosmos Hub restarts and moves $2.1 million in stolen tokens out of an attacker's wallet (23 Sep 2026). https://unchainedcrypto.com/cosmos-hub-restarts-and-moves-2-1-million-in-stolen-tokens-out-of-an-attackers-wallet/
134. Cointelegraph, Qubic freezes chain after attacker drains 1.4K wallets with weak seeds (19 Oct 2026). https://cointelegraph.com/news/qubic-freezes-chain-after-attacker-drains-14k-wallets-with-weak-seeds
135. Cryptobriefing, D'CENT wallet attack drains XRP. https://cryptobriefing.com/dcent-wallet-attack-drains-xrp/
136. Anthropic, Detecting and countering misuse of AI: September 2026 (10 Sep 2026). https://www-cdn.anthropic.com/e50be2e51e7695dc4b1366a37a245a597377d3b5/Anthropic-Detecting-and-countering-091026.pdf
137. mempool.space, Bitcoin transaction f7055f6c8dd00f404e48c12483ae740180f658db206733505bb27b015e579588 (attacker output, block 966,199) and Liquid Network reserves and pegs APIs (liquid.network/api/v1/liquid/reserves and /pegs, read 21 Oct 2026). https://mempool.space/tx/f7055f6c8dd00f404e48c12483ae740180f658db206733505bb27b015e579588
138. Crypto.news, Drift hacker sends $109M in ETH to Tornado Cash (21 Oct 2026). https://crypto.news/drift-hacker-109m-eth-tornado-cash/
139. Solana Compass, Drift opens DFX claims for April exploit losses (1 Oct 2026). https://solanacompass.com/news/drift-opens-dfx-claims-for-april-exploit-losses-with-redemptions-starting-near-1-cent-per-dollar

## Appendix A Canonical numbers

Each number used in the paper, with its definition, scope and confidence, from the project's canonical-numbers register (`data/canonical_numbers.json`).

**Table A1.** Canonical numbers.

| Id | Question | Canonical value (definition in the project file) | Confidence |
|:---|:---|:---|:---|
| S1 | How much has been stolen in total? | $16.52B across 1,377 hacks and exploits with a stated USD loss, 1 Jan 2016 to 21 Oct 2026 (659 incidents of $1M or more = $16.32B) | high |
| S2 | How much was stolen each year? | 2021 $2.66B (134); 2022 $3.54B (196); 2023 $1.64B (229); 2024 $1.83B (235); 2025 $2.57B (165); 2026 $2.33B (308) (2026 to 21 Oct); 2016-2020 total $1.95B | high |
| S3 | How concentrated are the losses? | Median incident $820,000; 718 of 1377 incidents (52.0%) are under $1M; the 10 largest are 33.5% of all dollars; Bybit alone is 8.5% (2025: 54.0%) | high |
| V1 | What are the main attack vectors? | By dollars: private-key/compromised-infra 35.0%; smart-contract logic 24.8%; social-engineering 11.4%; supply-chain 11.0%; oracle/price-manipulation 5.7%; access-control 4.8%. By count: smart-contract logic 35.7%, key/infra compromise 15.7%, access control 15.5%, oracle manipulation 13.2%. Key compromise + social engineering + supply chain = 57% of dollars. | medium |
| V2 | Which kinds of target lose the most? | DeFi 35.3%, CEX 33.8%, bridges 22.6%, other 4.9%, wallets 3.3% of dollars; by count DeFi 76.6% | medium |
| V3 | How has the mix shifted recently? | 2024 to 21 Oct 2026 ($6.7B): key/infra 31.5%, supply chain 23.1%, contract logic 20.1%, social engineering 14.8%. 2025 supply-chain share is 56.1% (Bybit/Safe{Wallet} alone); 2024 social engineering 35.0% (DMM, Radiant). | medium |
| R1 | How often do attackers give the money back? | About 1 in 8 large exploits and key compromises (12.5%); range 8.5% to 14% across frames. Documented count: 110 incidents in our master (8.0% of 1,377), 78 of 659 incidents of $1M or more (11.8%); among those where voluntary return was reviewed, 78 of 364 (21.0%) | medium |
| R2 | What share of stolen dollars comes back voluntarily? | About 10% of stolen dollars ($1.68B of $16.52B = 10.2%; 8.7% before Liquid Network); only ~3.7% without the three largest returns (Poly Network, Liquid, Euler) | medium |
| R3 | What is the typical bounty / split? | 10% is the price: median opening offer 10% in every year (104 of 183 openings are exactly 10%); attackers who settle keep the offered share (median 10%, n=35; exactly the offer in 21). Recent public negotiated returns retained a median 3.0% (n=10, range 0% to 25%). | high |
| R4 | How fast do returns happen? | Median first return 2.4 days after the exploit (n=23 dated returns; 2.8 days without Shezmu, whose 80% return is not verified on chain); 21 of 23 inside a week (20 of 22 without Shezmu); all 23 within 30 days if TrustedVolumes' 15 May transfer is a return (22 of 23 if only its July return counts). Median 42 hours after the team's first message (n=17; 8 of 17 within 24h; not re-audited). Liquid: 25h40m after the drain; NEAR Intents: ~36h after detection. | medium |
| R5 | Does messaging matter? | Messaging is strongly associated with a return but not shown to cause one. Teams that reached out saw a return in 36.5% of known cases vs 3.5% without outreach (80 of 219 vs 9 of 256); outreach roughly doubled 2020-2026 while the return rate stayed 14-22%; no tested term (offer size, deadline, legal threat, non-pursuit promise, tone) shows a measurable effect. | medium |
| C1 | What share of stolen dollars is recovered through ANY channel? | 18.8% ($3.11B of $16.52B). Sensitivities: 16.1% without chain-level interventions, 13.0% without the three largest recoveries (numerator and denominator), 18.6% with Bybit at its corroborated $42.9M instead of the company claim. | medium |
| C2 | How often (by count) does a hack have any recovery? | 150 of 659 incidents of $1M or more (22.8%) have a documented recovery; 36.4% of the 412 whose outcome was checked. Top 150 by loss: 58 of 150 (38.7%), 19.9% of their dollars; top 100: 43 of 100, 20.0% of dollars. | medium |
| C3 | Which channels recover the money? | Of recovered dollars (primary channel per incident): voluntary return (attacker/insider) 54.1% ($1681M, 103 incidents); issuer / exchange / protocol freeze 17.2% ($534M, 32 incidents); law-enforcement seizure / court 10.6% ($330M, 11 incidents); chain-level: halt / validator / security council 8.4% ($261M, 9 incidents); chain-level: hard fork / rollback 5.8% ($179M, 3 incidents); white-hat / MEV rescue 2.3% ($70M, 19 incidents); other / unspecified 1.6% ($49M, 13 incidents). Chain-level halts/forks together = 14.2%. | medium |
| C4 | How much comes back through non-voluntary channels (freeze, seizure, halt, rescue)? | 8.6% of stolen dollars ($1.42B); 3.5%-6.6% in the stricter freeze brief | medium |
| C5 | Do published industry trackers agree? | Industry trackers put recovery (frozen + returned) at roughly 5-13% of losses in a typical year: Immunefi 5.2% (2022), 13.4% (2023), 7.7% (2024), 0.4% (Q1 2025); CertiK 7.6% (H1 2025), 8.8% (H1 2026); SlowMist 13.2% (2025). | high |
| F1 | How fast do freezes and other recoveries happen? | Chain halts/validator freezes: minutes to ~2 days (median 1 day; Cronos detected the attack ~36 min after it began, halted the chain and rolled it back, restoring 92.4% (the halt time is not stated; block production resumed ~11h after the attack; the events file codes 0.46 days); Cetus froze within a day, 72.6%; BNB 2022 ~3h). Issuer freezes: hours to ~2 days (median 1.5). Exchange freezes: 0-11 days (median 3). Law-enforcement seizures: 169 days to 5+ years (the 3 counted seizures took 169, 331 and 1,389 days, median 331; the Uranium day count is to mid-Feb 2025, month-only evidence; Bitfinex ~2,015 days, 5.5 years, is excluded from the sums). | low |
| F2 | Which stolen assets can actually be frozen? | Only issuer-controlled tokens (USDT, USDC, EURe), project tokens with admin controls, and native assets on governed chains (Sui, Arbitrum, Cronos, BNB, Berachain) can be frozen. ETH/BTC/DAI/XMR on open chains cannot. Issuer freezes caught 1-11% of an incident's loss (Poly $33M of $611M = 5.4%; Multichain 2.0%; Bybit Tether $181k). | medium |
| E1 | What share of the biggest hacks end in an arrest or charge? | 9 of the 100 largest hacks (9%) have a person arrested or charged for the hack itself; 12 counting laundering-side and related cases; 11 of the 150 largest. Safe phrasing: about 1 in 10. | medium |
| E2 | What share of all hacks end in an arrest or charge? | 16 of 1,377 headline incidents (1.2%, about 1 in 86); 16 of 659 incidents of $1M or more (2.4%, about 1 in 41). Sibling count on the raw DeFiLlama list: 14 of 1,313 (1.1%); 14 of 595 non-rug incidents of $1M or more (2.4%). | medium |
| E3 | How long until the first arrest or charge? | In a SEPARATE sample of 16 cases with a dated first arrest, charge or detention (not the 16 incidents counted in E2; 11 overlap), the median is 608 days (about 20 months) from incident to first public action against a person (IQR 354-1,650; mean 972); 75% took over a year. Restricted to the 14 cases that are 2016+ incidents inside the 1,377 scope: median 439.5 days; restricted to the 11 cases that are also in the E2 set: median 439 days. Fast cases (Platypus 6 days, Mango 76) involved a KYC'd exchange or a public identity. | medium |
| E4 | What happens to those who are charged? | Of 23 individuals charged or arrested for a hack or its laundering: 8 convicted or pleaded (35%), 1 conviction vacated/acquitted with US appeal pending, 2 acquitted, 3 pending, 1 outcome unknown, 8 charged and not in custody. Among the 11 whose cases reached a verdict or plea, 8 were convictions or pleas (the Powell case is a plea agreement on file); prison terms 12, 18, 36, 60 months, and Hernandez got 12 months probation. | medium |
| D1 | What share of stolen dollars is DPRK? | Government-attributed: 22.6% ($3.74B across 32 incidents); adding firm attributions: 34% excluding researcher-list-only rows ($5.62B), up to 39.1% ($6.45B, 95 incidents) including them. By year (gov / gov+firm): 2024 39.2% / 59.8%; 2025 58.9% / 64.1%. | medium |
| D2 | What share of incidents (by count) is DPRK? | 6.9% of headline incidents (95 of 1,377; government-attributed 2.3%, 32 incidents); 12.7% of incidents of $1M or more (84 of 659). Chainalysis counts: ~7% of incidents in 2023 (20 of 282), 15.5% in 2024 (47 of 303). | medium |
| D3 | Is recovery lower for DPRK hacks? | Yes. DPRK-attributed (gov+firm, 95 incidents, $6.45B): 8.3% of dollars recovered, only 3.8% once KuCoin (exchange-claimed 84%) and Munchables (insider handed over keys) are removed. Government-attributed alone: 3.4%. Everything else: 25.5% (16.7% without the three largest returns). | medium |
| D4 | Have any DPRK hackers been arrested? | We found no public record of any DPRK operator of an exchange or bridge theft being arrested. Indicted in absentia: Park Jin Hyok, Jon Chang Hyok, Kim Il (2021); Chinese OTC launderers Tian Yinyin and Li Jiadong (2020) and others. In custody or charged: only US and Ukrainian IT-worker facilitators (5 guilty pleas in November 2025; two more US nationals were arrested in October 2026 on an N.D. Ohio indictment announced 13 October and are charged, not convicted). OFAC actions against DPRK actors or their addresses: 4 (13 Sep 2019 Lazarus, Bluenoroff and Andariel; 2 Mar 2020 the Chinese OTC launderers; 14 and 22 Apr 2022 Ronin addresses). Separately OFAC designated three mixers that laundered Lazarus proceeds (Blender 6 May 2022, Tornado Cash 8 Aug 2022, delisted 21 Mar 2025, Sinbad 29 Nov 2023); those are not counted as actions against DPRK hackers. DOJ in-rem actions: 4. We found no DOJ criminal or forfeiture action for Bybit; Bybit filed a private civil suit (D.D.C. No. 1:26-cv-02173, Judge Bates; filed under seal 2026-06-18, preliminary injunction granted in part 2026-07-30, unsealed 2026-08-06). | high |
| A1 | How many hacked projects had been audited? | At least 334 of 4,005 de-duplicated incident events (8.3%) concern a project with a prior public audit report from a Tier-A firm in the corpus (12,394 engagements); 146 of our 1,377 headline incidents (10.6%; $1.50B, 9.1% of dollars) match by exact normalized name within +/-3 days. This is a floor and an entity link, not a failure rate. | low |
| K1 | How common are same-transaction (constructor) attacks, and is the share growing? | Share of enriched EVM exploits in the DeFiHackLabs sample (n=758) where the exploit ran inside the attack contract's own deployment transaction: 2023 4.7% (9/190); 2024 14.3% (26/182); 2025 40.5% (62/153); 2026 34.1% (47/138); ~0% in 2020-22 (0/95 after removing one false positive, Fortress Loans). Same-tx or same-block (deployed and attacked in the same block, separate txs): 49.0% in 2025 and 44.2% in 2026 (15.4% in 2024). USD-weighted the share is far smaller, 25.1% (2024), 8.2% (2025), 10.9% (2026): the shift is among small and mid exploits. Flag precision 24 of 25 sampled (96%, Wilson 80.5-99.3%). | medium |
| K2 | Did the time between deploying an attack contract and using it get shorter? | Median deploy-to-attack lag for attacker-deployed contracts: 2020-22 10.3 min, 2023 4.2 min, 2024 4.2 min, 2025 0 s, 2026 0 s (n=44/90/97/84/75). The drop to zero is the same-transaction pattern, not faster two-step attacks: excluding zero-lag rows the median is 10.3 min (2020-22), 5.2 (2023), 10.9 (2024) and 6.0 (2026), i.e. flat at roughly 5-11 minutes (2025, n=24, is unstable at 185.4 min). Strictly same-tx (deployed inside the attack tx) is 60.7% of the lag set in 2025 and 53.3% in 2026; the other zero-lag rows are same-block, separate tx. | medium |
| K3 | How has the attack-vector mix changed in reproducible EVM exploits? | DeFiHackLabs EVM sample, share of incidents by era (2020-22 / 2023 / 2024 / 2025 / 2026): oracle/price manipulation 27.4 / 25.8 / 15.9 / 20.3 / 19.6% (down from ~27% to 16-20% in 2024-26, not monotonic); access control 9.5 / 10.5 / 21.4 / 20.3 / 21.7% (about doubled from 2024); business logic/accounting 24.2 / 39.5 / 30.8 / 39.2 / 31.2%; reentrancy 6.3 / 7.9 / 7.7 / 1.3 / 2.9% (fades after 2023). Flash loans appear in 61.1 / 72.1 / 56.6 / 51.6 / 53.6% of exploits (52-72%; on-chain flash-loan event only 12.6 / 32.6 / 33 / 30.7 / 42.8%). | medium |
| K4 | Do attackers still fund their wallets through Tornado Cash after the sanctions? | Yes, it did not collapse after the sanctions. Ethereum attacker wallets with a resolved funder (n=31/189/86): Tornado direct-pool funding 35.5% before the 8 Aug 2022 OFAC designation, 30.2% during sanctions, 30.2% after the 21 Mar 2025 delisting. Including one pass-through hop via an unlabeled wallet (the headline in the brief) it is 38.7/37.6/33.7%. Half-year swings (26-46%, n 23-50) mean "did not collapse", not "flat". Railgun funded 14 sampled wallets, 13 of them in Mar-Oct 2026 (13 of 58 resolved Ethereum wallets in 2026, 22.4%). | medium |
| K5 | Did the number of recorded exploits surge in 2026? | Yes in recorded count, cause untestable. DeFiLlama: 12.3 hacks/month in 2025 (148) vs 37.6/month in Mar-Sep 2026 (263), 3.1x; incidents of $1M or more 5.8 to 13.1/month; SlowMist (independent tracker) 16.8 to 38.6/month. Dollars rose far less (about a third more per month): $2.12B in Mar-Sep 2026 vs $2.71B in all of 2025. DeFiHackLabs shows no surge. No AI attribution is supported. | medium |
| K6 | Has any real exploit been verifiably written or found by AI? | No verified case. We found no post-mortem, security-firm statement, PoC comment or verified attacker-contract source that attributes an in-the-wild exploit to an AI model. Of 28 AI-related claims logged (data/ai_incident_claims.csv): 12 verified (mostly lab results, tool use in malware, social engineering or defender-side), 10 credible-claim, 6 speculation. Speculation is flagged, not findings: TRM via Bloomberg on the two April 2026 heists, reported as Drift and Kelp ("highly likely" AI-assisted, no evidence offered), Chainalysis on unverified contracts (no incident attributed to AI), the Immunefi and OpenZeppelin-alumni opinion pieces. The constructor-attack shift, just-in-time wallets and the 2026 count surge are consistent with scripted pipelines but equally with human use of public PoC templates. | medium |
| K7 | What do the AI exploit benchmarks actually show? | AI can reproduce known exploits in simulation; this is capability, not attacker behaviour. SCONE-bench (Anthropic, 1 Dec 2025): 10 models produced working exploits for 207 of 405 historical contracts (51.11%, best of 8 attempts), $550.1M of simulated value; on post-cutoff contracts $4.6M; zero-day run on 2,849 contracts found 2 novel bugs ($3,694 simulated, API cost $3,476). A1 agent (Gervais and Zhou, arXiv 2507.05558): 63% success on 36 real vulnerable contracts, up to $8.59M per exploit; the authors' simulation of historical attacks puts success at 86-89% if run at disclosure vs 6-21% after a week. EVMbench (Paradigm and OpenAI, 18 Feb 2026): top models exploited under 20% of critical Code4rena bugs earlier and GPT-5.3-Codex over 70% (vendor-reported). | high |
| K8 | Are attackers using AI at all? | Yes, in social engineering and tooling, not (verified) in writing contract exploits. Verified: Google GTIG (5 Nov 2025): DPRK-linked UNC1069 used Gemini for crypto research, wallet-data locations and lures and attempted to develop crypto-theft code; UNC4899 for code and exploit research (accounts disabled; GTIG does not say Gemini made the deepfakes). Anthropic (27 Aug 2025): DPRK operatives used Claude to get and keep remote jobs at US tech firms; separate "vibe hacking" extortion of 17+ organizations. s1ngularity npm malware (26-27 Aug 2025) invoked victims' installed claude/gemini/q CLIs to find wallet files and secrets (StepSecurity). Huntress (18 Jun 2025): BlueNoroff/TA444 Zoom call in which an employee at a cryptocurrency foundation met several deepfakes of senior leaders from their own company and external contacts. Anthropic (10 Sep 2026 threat report, covering Dec 2025 to Aug 2026): AI-assisted exploit development including automated exploit foundries run by a China-based espionage group, against security appliances; the report describes no in-the-wild crypto or DeFi exploit. Speculation flagged: TRM on the two April 2026 heists, reported as Drift and Kelp. | high |
| K9 | Do exploits come in copycat waves? | Yes. 12 lending-market exploits of one bug class (empty-market donation / rounding inflation) across Compound- and Aave-style forks and similar lending code in 13 months (2023-04-15 to 2024-05-14): HundredFinance, BaoCommunity, WiseLending, kTAF, OnyxProtocol, Raft_fi, MahaLend, MetaLend, bZxProtocol, ChannelsFinance, RadiantCapital, Sonne Finance; reported losses sum to $38M across the 12 with a USD figure. Other documented waves in DeFiHackLabs headings: read-only reentrancy (7 incidents, 2022-10-24 to 2023-07-30), ERC-2771 forwarder / unchecked multicall (6, May 2025 to Sep 2026), and MEV-bot replay of a revealed attack (SecuredFi 5 Sep 2026, BiFi 17 Oct 2026). 16 sampled incidents carry an explicit white-hat or rescue marker (a floor; intent unverified). | medium |
| M1 | Liquid Network (Sep 2026) | ~$320M (3,998.5 L-BTC minted; 3,996.0 BTC released); attacker returned 3,400 BTC (85.0% by units; $266.5M in the master = 83.3% at theft-date price) confirmed 25h40m after the drain and ~7h after Blockstream's PGP "safe to return" message; 598.5 BTC (14.97%, ~$47M) withheld as leverage for a 10% bounty Blockstream refused ("It is not white-hat activity. It is theft."). Unresolved as of 2026-10-21: the attacker's 598.50 BTC sat unspent since Bitcoin block 966,199 (2026-09-09), and Liquid's peg audit showed a 602.53 BTC gap (4,234.76 L-BTC against 3,632.23 BTC), a different measure (the federation's shortfall) from the coins the attacker holds; attacker unidentified, no arrest or charge found. | medium |
| M2 | Bybit (Feb 2025) | $1.46B (Bybit/Elliptic; FBI PSA ~$1.5B; master carries $1.4B). FBI attributed it to TraderTraitor/DPRK on 2025-02-26 (primary). ~$42.9M frozen within ~3 days (2.9%); Bybit itself later claims >$73M (Sept 2025) and $78.9M recovered-or-frozen (Aug 2026; 5.4%), unaudited. ETH-to-BTC conversion done in ~12 days (Arkham), 72% via THORChain. We found no DOJ criminal or forfeiture action; Bybit sued DPRK privately (D.D.C. No. 1:26-cv-02173, Judge Bates; filed under seal 2026-06-18; TROs 2026-06-19 and 2026-07-16; preliminary injunction granted in part 2026-07-30; unsealed 2026-08-06). Bybit made users whole from its own balance sheet. | medium |
| M3 | Bitget (Sep 2026) | $387M (first reported $351.6M; Chainalysis $387M across 23 transfers). Attribution: firm-tier only (Chainalysis "DPRK-attributed", Elliptic "highly likely", TRM "has not definitively attributed"); no government attribution. Recovery ~$0.34M frozen by issuers (0.09%); CEO claims $1.07M (0.28%, single source); BlockSec $0.84M includes ~$503K of swaps blocked mid-flight. THORChain declined to halt (~$269M passed through). | medium |
| M4 | KelpDAO (Apr 2026) | $292M (116,500 rsETH; master $293M). Arbitrum Security Council froze 30,766 ETH (~$71M, 24.3%) on 2026-04-20, ~2 days after the hack; a creditor restraining notice (terrorism-judgment holders, ~$877M face) was modified 2026-05-08 to let the DAO transfer to Aave; the creditors' turnover motion against Aave (S.D.N.Y. 1:25-mc-00527, ECF 60) is briefed with no ruling seen as of 2026-10-20; release from custody unverified. DPRK attribution is firm/victim-side (LayerZero preliminary, via Chainalysis; TRM). DeFi United pledged >$300M ($221.65M raised per a third-party tracker); Kelp says backing was restored 2026-05-25. Pledges are make-whole, not recovery. | medium |
| M5 | Cetus (May 2025) | $223M (2025-05-22); Sui validators froze ~$162M (72.6%) by the next day; governance vote closed 2025-05-29 with 90.9% to move the funds to a Cetus/OtterSec/Sui Foundation multisig; attacker had already bridged 20,920 ETH (~$56.3M). Cetus offered the attacker ~$6M (2,324 ETH) to return the rest; no reply. Attacker unknown; no arrest or charge found. Sui Foundation $30M loan funded the relaunch. | high |
| M6 | NEAR Intents (Oct 2026) | ~$3.8M (23 failed deposits creating unbacked balances; withdrawals Sep 29 to Oct 1; paused Oct 1); 100% returned within ~36 hours of detection after a public 48-hour ultimatum ("We have identified you, sir." is NEAR GM Shevchenko's). No bounty to the attacker reported; the attacker's note ("We've returned all the funds, we were in the wrong") has no tx hash in our sources. A separate $300,000 reward went to another researcher. | medium |
| M7 | Verus-Ethereum bridge (May 2026) | ~$11.4-11.6M (Blockaid $11.58M; 5,402 ETH after swaps); Verus offered on 2026-05-21 that returning 4,052.4 ETH within 24h would be treated as the attacker keeping the rest as a bounty and no pursuit; 4,052 ETH arrived on chain, 1,350 ETH kept = 24.99% retained, the largest realized retention in the settlement sample (a later separate exploit of the same flaw took ~$7.5M by a different attacker). | high |
| M8 | Drift (Apr 2026), the counter-case | ~$285M (Chainalysis; press $270-295M); firm-attributed DPRK ("preliminary on-chain indicators"); no freeze found (the $3.36M Circle figure was unsupported); ~$232M USDC bridged via Circle CCTP in 100+ transactions over ~6 hours (ZachXBT allegation); Circle class action (D. Mass., McCollum) pending; Tether-backed recovery package "up to $127.5 million" is make-whole financing, not recovery; about 44,510 ETH (~$109M) to Tornado Cash over 20-21 Oct 2026 (25,700 ETH on the first day; the total is the Onchain Lens count, relayed by several outlets); trackers disagree on what is still held (roughly 56,000 to 63,000 ETH); DFX claims opened 2026-10-01 with about $3.1M USDT in the pool against about $295M of verified losses, and the Tether "up to $127.5 million" is a commitment ceiling, not cash in the pool. | medium |

## Appendix B Recent cases

**Table B1.** Recent incidents (2025 to October 2026) with the outcome of the attacker's response, the amount returned or recovered where documented, and how it was verified.

| Incident | Date | Loss | Terms and outcome | Returned share of loss | Verification |
|:---|:---|---:|:---|---:|:---|
| Infini | 2025-02-21 | $50M | 20% offered; no public record of acceptance | n/a | reported |
| Bybit | 2025-02-21 | $1.46B | FBI named DPRK in 5 days; about $42.9M frozen (corroborated; the company later claimed $78.9M, 5.4%); make-whole from balance sheet | 2.9% | FBI PSA is primary; recovery figures reported |
| KiloEx | 2025-04-14 | $7.4M | 10% offer; returned in about 3 days | 93.2% | reported |
| Loopscale | 2025-04-26 | $5.8M | 10% plus release; reported full recovery in 2 days (split unverified) | n/a | reported |
| Cetus (Sui) | 2025-05-22 | $223M | no reply to a roughly $6M offer; validators froze $162M | n/a | reported |
| GMX V1 | 2025-07-09 | $42M | 10% for 90% back in 48h; accepted (on chain) | 95.2% | offer and reply decoded on chain; amounts reported |
| Makina | 2026-01-20 | ~$4.2M | up to 10% offer to an MEV builder; 920.7 ETH returned after 51h47m, 102.3 ETH (10%) kept | 90.0% | offer and return decoded on chain |
| Drift Protocol | 2026-04-01 | $285M | no return, no freeze found; Tether financing is make-whole | n/a | reported |
| Kelp DAO (rsETH/LayerZero) | 2026-04-18 | $292M | Arbitrum Council froze 30,766 ETH (about $71M); court restraint | n/a | reported |
| Renegade | 2026-05-09 | $209k | 10% offer; over 90% returned in 45 minutes | 90.9% | reported |
| Verus-Ethereum Bridge | 2026-05-17 | $11.4M | 24h offer; 4,052 ETH returned, 1,350 ETH kept (on chain) | 75.0% | offer and returns decoded on chain |
| Ostium | 2026-07-15 | $23.8M | no negotiation found; $650k recovered, channel unstated | n/a | reported |
| Wanchain (Cardano-BNB bridge) | 2026-07-20 | $10M | 10% offer; no return reported | n/a | reported |
| AFX Bridge | 2026-07-22 | $24.1M | 30% offer; no return reported | n/a | reported |
| ChainConnect | 2026-07-26 | ~$650k | one-line acceptance as a whitehat; 280 ETH returned about 14 hours later | n/a | acceptance and return decoded on chain |
| Coldcard seed-generation thefts | 2026-07-31 | $113M | white hats secured 52.37 BTC; no attacker negotiation | 2.8% | reported |
| Moonwell (MAMO market, Base) | 2026-08-27 | $8.7M | no bounty, negotiation or return found | n/a | reported |
| Tectonic / Cronos | 2026-08-30 | $120M | detected about 36 minutes in, then chain halted and rolled back; $111.2M restored | 92.4% | reported |
| Liquid Network (Blockstream) | 2026-09-06 | ~$320M | 3,400 BTC returned; 598.5 BTC withheld for a 10% bounty; unresolved | 85.0% | attacker messages decoded on chain; amounts reported |
| Bitget | 2026-09-24 | $387M | about $340k frozen by issuers (CEO claims about $1.07M); no negotiation | 0.1% | reported |
| NEAR Intents | 2026-10-01 | $3.8M | told publicly "We have identified you" (not named); 48h ultimatum; 100% returned | 100.0% | reported |
| 79thVault (79AU, BNB Chain) | 2026-10-07 | $12.5M | 10% message (authenticity doubted); 92.3% returned (single source) | 92.3% | reported |

Bitget's recovered share is 0.2% ($840k) in Table 9, which carries the upper end of the independent counts including blocked swaps, and 0.1% here, which counts only the roughly $340k of issuer freezes. The Bybit loss is $1.46B in the text and $1.40B in the master tables, which carry the DeFiLlama figure. Bybit's 2.9% is the corroborated $42.9M over $1.46B; the company's own later claim of $78.9M is 5.4% of $1.46B, and Table 9 shows it as 5.6% because it divides by the master's $1.40B. The Verus date is that of the drain (17 May 2026, 23:55 UTC), and the offer followed on 21 May.
