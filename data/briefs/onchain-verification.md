# On-chain verification of quoted negotiation messages and return transactions

Run date: 2026-10-21. Script: `scripts/verify_onchain.py`. Data: `data/onchain_verification.csv` (message checks), `data/onchain_returns.csv` (return-tx checks). Raw RPC responses: `data/raw/onchain/` (gitignored).

## 1. Bottom line

- All 29 rows of `example_messages.csv` exist on chain and their calldata decodes as UTF-8 text. None is a mismatch: 15 are exact byte-for-byte, 14 are 'close' because the CSV flattened line breaks or truncated the text (every 'close' row is explained in its `notes` field; none changes the wording).
- Across all 48 verification rows (29 example rows plus 19 rows built from `negotiation_cases_public.csv` and from hashes found while checking): exact 16, close 21, mismatch 6, not_found 5.
- The mismatches are all in the press-sourced case table and are informative: a quote attributed to the wrong tx (GMX, Liquid), paraphrases presented as quotes (KyberSwap), a tx called a 'data tx' that has no calldata (Verus), and a one-word 'sorry' that is a fragment of a 287-char apology (Euler). See section 4.
- 5 not_found rows are quotes with no tx hash in the source (Mango, Thala, NEAR Intents, Loopscale, plus one Euler row with no quote text). They cannot be verified from chain data and should be cited to the press source only.
- Return transactions: ChainConnect (280 ETH) and Makina (920.7 ETH) match claimed amount, asset, sender and recipient exactly; Verus returned 4,052 ETH, not the 4,052.4 ETH the offer asked for. Shezmu's and Euler's returns could not be verified (section 3).

## 2. Ranked shortlist for the thread (12 messages)

Ranking: (a) exact decode and a verified return or reply pairing first, (b) then quotability and narrative value, (c) role evidence weakest last. Texts below are exact substrings of the decoded calldata (or the OP_RETURN payload for Bitcoin). Quote the decoded text, not the CSV text, where line breaks matter.

### 1. ChainConnect: one-line acceptance

> I accept the proposal as a whitehat. Please contact me via Blockscan Chat to discuss the details.

- Context: ChainConnect bridge exploit (26 Jul 2026, about $650k). The exploiter accepts the project's offer in one line and about 14 hours later returns 280 ETH (return tx verified, see section 3).
- Link: https://etherscan.io/tx/0x37e544644c83c379f71b2c2096605fce311935d88ac1cbd58277a4da94266483
- Chain / block / time: ethereum, block 25643343, 2026-07-30T04:41:35Z
- From -> to: `0xd86cbc1892bfda05f3d7e6c17c71709b6ae957a5` -> `0x68d447e2a4c6e7c1945725939a0cbcb4a67f9b30`
- Text match: exact (full text)
- Role evidence: Strongest role evidence in the set. The sender (0xd86cbc18...) is the address that later sends the 280 ETH return and is the address ChainConnect's confirmation message calls 'the controller'; two-way message pairing with the project address 0x68d447e2... verified.

### 2. Shezmu: 20% counter-offer

> Hi there - thanks for reaching out. Sure we can talk about the refund, but only considering 20% as bounty.
> btw I have no problem with that KYC.

- Context: Shezmu (Sep 2024, about $4.9M). The exploiter counters the project's 10% offer, which had threatened a KYC-link report, with 20%, 3h52m after the offer.
- Link: https://etherscan.io/tx/0xbe91cdf5fd9c60d886014105229278ad4bf46a1ff6e3f458ca37dcdc58f0d43e
- Chain / block / time: ethereum, block 20795911, 2024-09-21T02:15:47Z
- From -> to: `0xfaf2484adf637837001404ff95716de1fc3b4331` -> `0x2604c6b2e0cf38e5ba66b2a5dd93461740d1dbee`
- Text match: exact on the text (the dataset CSV had flattened the line break)
- Role evidence: Reply pairing verified: the sender 0xfaf2484a... is the addressee of Shezmu's offer (0x3e3b04aa...) and replies to that offer's sender.

### 3. Shezmu: '20% is a deal'

> 20% is a deal. Please send the funds to our treasury: 0xA004e4ceDea8497d6f028463e6756a5e6296bAd3 thank you for your cooperation

- Context: Shezmu. The project accepts the 20% counter 5m12s later (02:15:47 to 02:20:59 UTC). The same treasury address received 137 WETH and 9,346 DAI from the exploiter's address; the full return was NOT verified (section 3).
- Link: https://etherscan.io/tx/0x43df03749111104ab01ebd51d86b8378c6441c4a53a01d1a79564b2b27b5ceba
- Chain / block / time: ethereum, block 20795937, 2024-09-21T02:20:59Z
- From -> to: `0x2604c6b2e0cf38e5ba66b2a5dd93461740d1dbee` -> `0xfaf2484adf637837001404ff95716de1fc3b4331`
- Text match: exact (full text)
- Role evidence: Two-way pairing with the exploiter's reply verified; the message names the same treasury address that the first offer named. Project identity otherwise rests on dataset coding.

### 4. Makina: 10% Safe Harbor offer to an MEV builder

> we offer up to a 10% bounty for funds rescued by WhiteHats
> [...]
> Or if anonymity is preferred please return 920.7 ETH directly to 0x62244C74e1d09b3D86EF7342d354b5D7770bDE10 to settle this matter.

- Context: Makina (Jan 2026, about $4.2M). Safe Harbor-style offer to the MEV builder that received 1,023 ETH. 51h47m later the builder returns exactly 920.7 ETH, leaving 102.3 ETH (exactly 10%). Both txs verified (section 3).
- Link: https://etherscan.io/tx/0xc5c5898eaf8c9ac7bee2c28eb971e8c5fee51c9ecdaf48b42c3357186c0235bf
- Chain / block / time: ethereum, block 24275089, 2026-01-20T09:28:11Z
- From -> to: `0xc558839da31b9fd0649cbb4406b9168ad5984df6` -> `0xbed26250db2097318386f540fd546acedf7bde25`
- Text match: close: identical to the decoded calldata except line breaks and spacing; the excerpts are exact substrings
- Role evidence: The message recipient (0xbed26250...) is the address that received the 1,023 ETH and sent the 920.7 ETH return. Project-side sender identity is dataset coding only.

### 5. Verus: 1,350 ETH bounty offer

> We will also post a public acknowledgement, referencing the 1350 ETH and publicly state that we consider those funds to be your bounty.

- Context: Verus-Ethereum bridge (May 2026). Offer of a 1,350 ETH bounty for return of the rest. 5h34m later 4,052 ETH arrives at the address named in the offer; 3 minutes after that 1,350 ETH moves to a separate address that still holds exactly 1,350 ETH today (section 3).
- Link: https://etherscan.io/tx/0x3ce93e671fd83ec14efc409102ac4af49434d1bedf50730c8eb471917e0789b6
- Chain / block / time: ethereum, block 25144144, 2026-05-21T14:12:59Z
- From -> to: `0xd498061f357447940f494e142b24695b51f59883` -> `0x65cb8b128bf6e690761044cceca422bb239c25f9`
- Text match: exact substring. The press-sourced quote in negotiation_cases_public.csv has '1,350 ETH'; the chain text says '1350 ETH'
- Role evidence: The offer was addressed to 0x65cb8b12..., the same address that sent the 4,052 ETH return and the 1,350 ETH transfer. Offer sender (0xd498061f...) has dataset class 'unknown'.

### 6. Euler: 'No intention of keeping what is not ours'

> We want to make this easy on all those affected. No intention of keeping what is not ours. Setting up secure communication. Let us come to an agreement.

- Context: Euler Finance (Mar 2023, about $197M). First attacker reply, nearly 6 days after the project's $1M-reward ultimatum.
- Link: https://etherscan.io/tx/0xcc73d182db1f36dbadf14205de7d543cfd1343396b50d34c768529aaab46a1c0
- Chain / block / time: ethereum, block 16870191, 2023-03-20T16:51:59Z
- From -> to: `0xb66cd966670d962c227b3eaba30a872dbfb995db` -> `0xee009faf00cf54c1b4387829af7a8dc5f0c8c8c5`
- Text match: exact (full text)
- Role evidence: Two-way pairing verified against the project's first message (0x539c6fff...). Euler's returns were not re-verified on-chain here.

### 7. Euler: $1M arrest-reward ultimatum

> Following up on our message from yesterday. If 90% of the funds are not returned within 24 hours, tomorrow we will launch a $1M reward for information that leads to your arrest and the return of all funds.

- Context: Euler Finance. The project's ultimatum: 90% back in 24 hours or a $1M reward for information leading to arrest.
- Link: https://etherscan.io/tx/0x8f2b61a0c70012df1e3d918e7ac6486a1c332a9e530f3d4061735c6620f960d9
- Chain / block / time: ethereum, block 16828833, 2023-03-14T21:22:47Z
- From -> to: `0xee009faf00cf54c1b4387829af7a8dc5f0c8c8c5` -> `0xb66cd966670d962c227b3eaba30a872dbfb995db`
- Text match: exact (full text)
- Role evidence: Sender is the project-coded address 0xee009faf...; two-way pairing with the attacker reply verified.

### 8. KyberSwap Elastic: the exploiter's 'treaty'

> A small error was made, rounding in the wrong direction, it could have been made by anyone.
> [...]
> I require my demands to be met by December 10, otherwise, the treaty falls through.
> [...]
> - Kyber Director

- Context: KyberSwap Elastic (Nov 2023). The exploiter's 'treaty' demands control of the company and the DAO instead of a bounty.
- Link: https://etherscan.io/tx/0x0479da9d6a3a29b294d6337630ea0a482e7ec7223f3b6e6d72442f6c450264d4
- Chain / block / time: ethereum, block 18684303, 2023-11-30T12:04:23Z
- From -> to: `0x50275e0b7261559ce1644014d4b78d4aa63be836` -> `0x91c9d4373b077ef8082f468c7c97f2c499e36f5b`
- Text match: exact substrings of a 2,658-char message. The case-table paraphrase 'temporary complete control of KyberDAO' is NOT verbatim: the chain says 'Temporary full authority and ownership over the governance mechanism (KyberDAO)' and separately 'Complete executive control over Kyber (the company)'
- Role evidence: Sender 0x50275e0b... is the address KyberSwap's outreach messages (0xcd34182974..., 0xfeb8bd9132...) were addressed to; consistent with the exploiter replying, not independently labelled.

### 9. Liquid Network: 'You SHALL pay 10%'

> You SHALL pay 10% using your own money as bug bounty or you will cause all your holders a 15% loss

- Context: Liquid Network / Blockstream (Sep 2026). After a first OP_RETURN note 'we are whitehats. contact us on chain' (tx c103de95..., 2026-09-06, exact), the same address demands that Blockstream pay a 10% bounty from its own money (2026-09-09).
- Link: https://mempool.space/tx/f7055f6c8dd00f404e48c12483ae740180f658db206733505bb27b015e579588
- Chain / block / time: bitcoin, block 966199, 2026-09-09T11:45:49Z
- From -> to: `bc1ql4mfu6aundtkksxklfajs2h3t9nzcd6gyqjlte` -> `bc1qdlld6antmv4xug242ed83q7k4rqw50cwfns38szx4qu2f4jwaxxsuhwxxr,bc1ql4mfu6aundtkksxklfajs2h3t9nzcd6gyqjlte`
- Text match: exact substring of the OP_RETURN text. The case table cites the first tx (c103de95...) for this quote, but that tx holds only the 'we are whitehats' line; the 'SHALL pay 10%' text is in f7055f6c...
- Role evidence: Both txs spend from the same bitcoin address (bc1ql4mfu6...). That this address is the exploiter rests on TRM's attribution, not on chain data.

### 10. Rho Markets: 'admit that it was not an exploit'

> Hello RHO team, our MEV bot have profited from your price oracle misconfiguration.
> [...]
> But first we would like you to admit that it was not an exploit or a hack, but a misconfiguration on your end.

- Context: Rho Markets (Jul 2024). An MEV operator offers to 'fully return' the funds, but only if the protocol admits it was a misconfiguration and not a hack.
- Link: https://etherscan.io/tx/0xab7bc87fca7df222000b870fbe55750c33b3ea0461a8ba8a8ddbe530a1934248
- Chain / block / time: ethereum, block 20340732, 2024-07-19T12:59:11Z
- From -> to: `0xe000008459b74a91e306a47c808061dfa372000e` -> `0x83e987c3fd6b4e43a8514e69b71ea09ff0ac4716`
- Text match: exact (full text)
- Role evidence: Weaker role evidence: attacker class from dataset coding only; no paired message in this set.

### 11. Wintermute: 'Stay Optimistic!'

> Hello, Vitalik, I believe in you, just want to know your opinion on this.
> [...]
> And hello Wintermute, sorry, I only have 18M and this is what I can return.
> [...]
> Stay Optimistic!

- Context: Wintermute / Optimism (Jun 2022). The exploiter's note to Vitalik and Wintermute, posted on Optimism, alongside a partial return.
- Link: https://optimistic.etherscan.io/tx/0x48464e4a6459062ac07efb4959fe8a6f90843f74922e68f71a929b33969f8f37
- Chain / block / time: optimism, block 11119220, 2022-06-10T06:25:45Z
- From -> to: `0x60b28637879b5a09d21b68040020ffbf7dba5107` -> `0xd8da6bf26964af9d7eed9e03e53415d37aa96045`
- Text match: close: identical except line breaks
- Role evidence: Recipient 0xd8da6bf2... is the well-known vitalik.eth address. Attacker class from dataset coding only; no paired message; return amount not verified here.

### 12. Wormhole: $10M bounty offer

> This is the Wormhole Deployer:
> [...]
> present you a bug bounty of $10 million for exploit details, and returning the wETH
> [...]
> You can reach out to us at [contact redacted]

- Context: Wormhole (Feb 2022, about $326M). The first on-chain bounty offer, $10M, never taken up.
- Link: https://etherscan.io/tx/0x2d8b7901bff18ae6abe1a50aebe44b70559f39ff357b21340843d368b9486859
- Chain / block / time: ethereum, block 14128723, 2022-02-02T20:15:31Z
- From -> to: `0x96d13cbeffe7bae169b9032fe69ed56eb07b300f` -> `0x629e7da20197a5429d30da36e77d06cdf796b71a`
- Text match: exact on the full text, which contains a raw 0x19 control byte where an apostrophe was intended ('We<0x19>d like'); excerpts avoid it
- Role evidence: Weakest role evidence: the message self-identifies as the Wormhole Deployer; dataset class 'unknown'; the address 0x96d13cbe... was not independently tied to Wormhole here.

Runners-up, all exact decodes: Euler `0x539c6fff...` (first project message), Euler `0xedd8102c...` (attacker apology, contains profanity), Nomad 'interceptor' message (exact after stripping a 4-byte binary prefix; per the prior inventory one of a 209-address broadcast, so weak as a 'negotiation' example), Zunami 20% offer, Thetanuts 10% letter (no verified return), KyberSwap Polygon 'front runner' confirmation.

## 3. Return transactions

| Case | Tx | Asset / amount (on-chain) | Claimed | From | To | Time (UTC) | Verdict |
|---|---|---|---|---|---|---|---|
| row 4 (ChainConnect confirmation text) + row 3 note | `0xe78bfae09b...` | ETH 280 | 280 | `0xd86cbc1892...` | `0x840b3de19e...` | 2026-07-30T18:30:59Z | amount exact; sender match; recipient match |
| row 5 (Makina) note 'returned 920.7 ETH after 51h47m' | `0x0d23fea549...` | ETH 920.7 | 920.7 | `0xbed26250db...` | `0x62244c74e1...` | 2026-01-22T13:15:11Z | amount exact; sender match; recipient match |
| row 5 (Makina) message text: '1,023 ETH you received at tran | `0x14d2725f4c...` | ETH 1023 | 1023 | `0xa6c248384c...` | `0xbed26250db...` | 2026-01-20T03:51:47Z | amount exact; sender n/a (none claimed); recipient match |
| row 15 (Verus-Ethereum Bridge) 'return tx' | `0xb428dae60a...` | ETH 4052 | 4052.4 | `0x65cb8b128b...` | `0xf9ab28cb7b...` | 2026-05-21T19:47:11Z | amount close; sender n/a (none claimed); recipient match |
| row 15 (Verus-Ethereum Bridge) 'kept-ETH data tx' | `0x84aada67c4...` | ETH 1350 | 1350 | `0x65cb8b128b...` | `0xa8d3662af2...` | 2026-05-21T19:49:59Z | amount exact; sender match; recipient n/a (none claimed) |
| row 6-8 (Shezmu): observed attacker->treasury WETH transfer, | `0x95121e2c16...` | WETH (0xc0 137 | none | `0xfaf2484adf...` | `0xa004e4cede...` | 2024-09-21T03:22:47Z | amount n/a (no amount claimed); sender match; recipient match |
| row 6-8 (Shezmu): observed attacker->treasury DAI transfer,  | `0xec97799ad0...` | DAI (0x6b1 9346 | none | `0xfaf2484adf...` | `0xa004e4cede...` | 2024-09-21T03:06:23Z | amount n/a (no amount claimed); sender match; recipient match |
| row 6-8 (Shezmu): 282.18 WETH inflow to the treasury from a  | `0xe04dc8d2f6...` | WETH (0xc0 282.18 | none | `0x089a2011b5...` | `0xa004e4cede...` | 2024-09-21T00:49:11Z | amount n/a (no amount claimed); sender n/a (none claimed); recipient match |

- ChainConnect: 280 ETH from the attacker-class address to 0x840B3De1..., 13h49m after the acceptance message. Matches the project's own confirmation message on every field.
- Makina: return found by listing the builder's outgoing txs (Blockscout), then verified over JSON-RPC. 51.78 h after the offer, matching the dataset's '51h47m'. The 1,023 ETH inbound tx (0x14d2725f...) is also verified.
- Verus: the 'return tx' sends 4,052 ETH to the address named in the offer, 0.4 ETH less than the 4,052.4 ETH the offer specified. The cited 'kept-ETH data tx' is a plain 1,350 ETH transfer with no calldata, 2m48s later; its recipient 0xa8d3662a... still holds exactly 1,350 ETH (queried 2026-10-21). Retained share 1,350 / 5,402 = 24.99%, consistent with the case table's 25%.
- Shezmu: no return tx is cited in the sources. The exploiter address sent 137 WETH and 9,346 DAI to the treasury Shezmu named in its messages, and the treasury also received 282.18 WETH from an unlinked address earlier that night. These amounts do not show an 80% return of a $4.9M loss, so the Shezmu return is unverified; do not cite a return amount from this check.
- Euler: the three tx hashes the master dataset lists for Euler (0x3097830e..., 0x465a6780..., 0x47ac3527...) are calls from 0xb2698c2d... to attack contract 0x036cec1a... on 2023-03-13 08:56-09:09 UTC, before any message; they are attack txs, not returns. The 'over $177M returned' figure was not re-derived from chain data.
- Not checked: GMX, Kyber Polygon, Thala, NEAR Intents, Loopscale (no return tx in the sources; Loopscale is on Solana and Thala on Aptos; NEAR Intents has no hash) and the Liquid return (no hash cited).

## 4. Discrepancies between the sources and the chain

- GMX V1: the case table cites 0x92a39e66... (Arbiscan) for the attacker's 'Ok, funds will be returned later'. That tx is GMX's own 10% offer. The attacker reply is 0x1d806cbb... (Arbitrum, 2025-07-11 06:29:00 UTC) and reads 'ok, funds will be returned later' in lower case.
- Liquid: the quote 'You SHALL pay 10% ...' is cited to tx c103de95..., which contains only 'we are whitehats. contact us on chain'. The quoted text is in f7055f6c... (2026-09-09).
- KyberSwap Elastic: the sentence 'A small error was made, rounding in the wrong direction, it could have been made by anyone.' is verbatim in 0x0479da9d.... 'Temporary complete control of KyberDAO' is a blend of two different phrases (see item 8). 'agents from any of the 206 sovereignties' is verbatim.
- Verus: the quoted line says '1,350 ETH'; the chain text says '1350 ETH'. The cited 'kept-ETH data tx' has no calldata. The offer asked for 4,052.4 ETH back; 4,052 ETH arrived.
- Euler: 'sorry' (tx input) is not accurate. Tx 0xedd8102c... is a 287-char apology that contains 'I'm sorry'. The 'no intention of keeping what is not ours' quote is verbatim in 0xcc73d182... (not cited in the source; found by text search).
- Control bytes: Wormhole (0x19 for an apostrophe) and the KyberSwap law-enforcement message (0x19 in 'users funds') carry a raw 0x19 byte. Replace with an apostrophe in a thread but say the quote is lightly cleaned, or avoid the affected sentence.
- Poly Network (0xbd66349e...): the calldata begins 'TX 0x98b6316d... DECRYPTED:' and wraps the offer in quotes, so it appears to be a decrypted echo of an earlier message, not the original text. Verify before quoting.
- Timestamps: all 29 example rows carry the same block time on chain as the dataset's `msg_utc`.
- The prior master dataset (messages_master.csv) does not contain the KyberSwap Elastic treaty (0x0479da9d...); it was found only through the press-cited hash.

## 5. Method and limits

- Each tx was fetched with `eth_getTransactionByHash`, `eth_getTransactionReceipt` and `eth_getBlockByNumber` from public JSON-RPC (publicnode first). publicnode intermittently returns null for txs that exist (including a 2026 receipt and the 2022 Wormhole tx), so null is never treated as 'not found' on its own: 6-7 free fallback endpoints per chain are tried, the tx is cross-checked on a second endpoint where available (calldata, from, to, value, block must agree; 42 of 43 unique EVM txs were confirmed by two endpoints; the Polygon KyberSwap tx came from a single endpoint), and Blockscout is a last resort.
- Bitcoin txs come from mempool.space; OP_RETURN payloads were parsed from the output scripts.
- Calldata was decoded as UTF-8 text and compared with the quote: exact, close (whitespace, case or truncation only, always explained) or mismatch. A 4-byte binary prefix before the text (Nomad) was stripped and reported. Chain data was treated as untrusted text and never executed; the script runs with `python3 -I`.
- Sender role: chain data cannot prove who controls an address. The check compares the on-chain from/to with the prior dataset's record, looks for opposite-direction messages between the same two addresses in this set, and for sender-was-previously-addressee. 'Attacker' and 'project' labels therefore remain dataset or press attributions, except where a message, a return tx and a confirmation message tie the same address together (ChainConnect, Makina, Verus, Shezmu).
- Each row's `notes` field records which endpoints served the tx and whether they agreed. The 2022 Optimism message was served by mainnet.optimism.io and optimism.drpc.org.
