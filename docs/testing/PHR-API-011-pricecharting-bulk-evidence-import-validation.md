# PHR-API-011 — PriceCharting Bulk Evidence Import Validation Plan

## Status

Passed — Same-Session Conformance; Owner Activation Pending

## Purpose

Verify that PriceCharting bulk evidence is complete, reproducible, collision-free, independently attributed, and unable to alter existing TCGplayer or event-operational truth.

## Deterministic Fixture Matrix

### Schema And Parsing

- Exact 27-column contract succeeds.
- BOM and CRLF/LF inputs normalize identically.
- Missing, reordered, duplicated, or additional columns fail closed unless covered by a later explicit schema version.
- Quoted commas and escaped quotes parse correctly.
- Empty price becomes `NULL`; `$0.00` remains zero; malformed, negative, non-finite, or locale-swapped prices fail or quarantine according to the contract.
- Price values round deterministically to integer cents.
- Leading-zero identifiers remain strings.
- Impossible release dates, numeric genres, malformed row widths, and unsupported products receive stable reason codes.

### Receipt And Idempotency

- Raw bytes are copied and hashed before apply.
- The same provider/game/schema/source hash cannot duplicate a receipt, mapping, or observation.
- A changed price produces a new observation fingerprint without changing identity mapping.
- An unchanged identity and unchanged observations produce no duplicate history.
- A changed provider identity fingerprint invalidates automatic mapping reuse and returns the row to resolution.

### Identity Matching

- Exact name, set, full collector, language, and physical variant resolves one target.
- Leading-zero numerator equivalence succeeds only when prefix/suffix and denominator remain compatible.
- Set aliases require documented versioned evidence.
- Denominator, language, edition, stamp, promo, staff, shadowless, error, foil, reverse, or other physical mismatch fails closed.
- Name-only and name-plus-number with incompatible set evidence do not resolve.
- Bare PriceCharting TCG ID does not resolve without a typed local TCGplayer Product alias.
- Collector-less recovery requires exact set/name/language/variant and one target.
- Non-standard Pokémon collectibles remain unsupported or unmatched instead of attaching to similarly named TCG cards.

### Collision And Ambiguity

- Two PriceCharting products targeting one Phronesis SKU place every involved row in `TARGET_COLLISION`.
- One PriceCharting product targeting multiple equally valid SKUs becomes `AMBIGUOUS`.
- Source order, price, sales volume, release date, and provider row order cannot break a tie.
- Accepted mappings satisfy unique source and target constraints at promotion time.
- Collision counts and target identities appear in the report without activating observations.

### Sealed

- Valid English sealed rows stage successfully.
- Exact sealed mappings require the specification's independent identity evidence.
- Shared names across booster pack, box, case, bundle, and deck remain separate.
- Sparse or duplicated UPC cannot resolve identity alone.
- Price and release date never resolve a sealed mapping.

### Observation Semantics

- Every PriceCharting price lane remains attributed to PriceCharting and USD.
- Ungraded does not populate TCG Direct Low, TCG Low, TCG Market, or delivered low.
- Grade 7/7.5, 8/8.5, 9, 9.5, PSA 10, BGS 10, CGC 10, and SGC 10 remain distinct lanes.
- Missing grades remain absent and never inherit an adjacent grade.
- Current-only values append at the receipt observation time and do not rewrite earlier receipts.

### Atomic Promotion And Recovery

- A fully valid staged receipt promotes in one transaction.
- Failure before mapping insert, during observation insert, before pointer swap, and after a forced constraint violation rolls back completely.
- The prior active receipt remains queryable and selected after failure.
- Dry-run changes no active table or pointer.
- Pointer-based rollback restores the prior internally complete receipt without deleting the rejected receipt.

## Measured-Source Reconciliation Gate

Run the owner-provided Pokémon source as a local dry run against the current configured pricing database. Record source and target hashes because catalogue drift can change counts.

For the measured 2026-08-01 source pair, require:

- 91,572 total PriceCharting rows.
- 45,627 English rows: 44,186 Singles and 1,441 Sealed.
- 13,957 collision-free strong source/target candidates before the implementation resolver applies any stricter exclusion.
- 13,596 collision-free candidate target SKUs carry graded price evidence.
- 5,206 otherwise strong source rows across 2,372 colliding targets remain non-active.
- No accepted sealed mapping unless it satisfies the separately asserted strict sealed evidence rule.

The automatic accepted count may be lower than the candidate benchmark and must explain every stricter exclusion. Later source or Phronesis changes may alter the benchmark only when the report records the new hashes, denominators, method counts, and reason-code deltas. A higher coverage count alone is not a pass.

## Negative-Effect Regression Gate

Snapshot before and after apply in an isolated database and prove no unintended change to:

- `pricing_products`
- TCGplayer `pricing_latest` and `pricing_history`
- TCG Direct Low precedence
- Vendor Workspace recommended offer
- Search result identity and ordering
- Artwork mappings and cache
- Watchlists
- Inventory and Display Case
- Event Ledger, purchase cart, receipts, or cash totals

## Operational And UI Gate

- The existing Graded Area shows imported active evidence with provider attribution and observation age.
- Live manual PriceCharting verification remains available and separately identified.
- Settings reports last receipt, current game, accepted/review/collision/unmatched counts, age, and `Recurring acquisition disabled` without exposing secrets.
- Keyboard, screen-reader naming, 200%/400% zoom, 390px containment, and desktop layout remain conformant for touched surfaces.

## Required Commands

- Focused importer and repository tests.
- Full supported `npm test` suite.
- Standalone TypeScript validation.
- Warning-free ESLint.
- Production build.
- `git diff --check` and scoped diff review.

## Acceptance Verdict

`PASS — PRODUCT REVIEW READY`, with owner activation intentionally pending. Provider network transmission and recurring scheduling remain outside this validation plan.

## Validation Evidence — 2026-08-01

- Focused importer suite: 21/21 passed.
- Full supported suite: 338/338 passed.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed on Next.js 16.2.12.
- `git diff --check`: passed.
- Dry-run isolation fixture proves `pricing_latest.market_price_cents` and `direct_low_cents` remain unchanged and no active pointer is created.
- Apply fixture proves transactional mapping/observation creation and exact-SKU Graded Area retrieval.
- Collision fixture proves two provider products converging on one target produce zero active mappings.
- Variant fixture proves an unqualified source cannot attach to a reverse-holo target.
- Schema-drift and repeated-receipt fixtures fail closed and remain idempotent.

Measured owner-file dry run:

- Source hash: `a06dcdde0093d82d9c727f390d5d5913eadba1cb1334eb7f683cb34f0d4faac1`.
- 91,572 source and staged rows.
- 33,379 automatic one-to-one candidates; 32,099 contain graded evidence.
- 1,704 collision rows across 745 targets, 387 ambiguous, 5,851 unmatched, 1,425 sealed review, 189 quarantined, and 48,637 unsupported/non-English.
- Automatic coverage is 80.78% of the 41,321 eligible English single rows and 76.33% of the 43,732 local Pokémon single SKUs.
- Active receipt before and after: none.
- The accepted count exceeds the earlier heuristic ceiling through tested normalization of local names containing collector decorations and exact collector numerator/full-denominator equivalence. Exact normalized set identity and bidirectional physical-variation parity remain mandatory. The result therefore represents a stricter implemented crosswalk, not fuzzy threshold expansion.

Resolver-v9 fixtures additionally prove naturally holographic base-printing resolution, modern set-prefix/base-set aliases, denominator-gated Sun & Moon Base Set identity, unique local Promo-set resolution, exact-set/exact-collector printed-name aliases, whole-token qualifier safety, collector-derived rarity labels, Poké Ball/Master Ball pattern separation, special-release rejection, Shadowless set identity, SH-numbered Shiny treatment, sibling-proven base/Holo separation, exact World Championship player annotations, Prize Pack routing, and `Non-Holo` exclusion. The implementation validation is same-session engineering/conformance evidence and is not represented as independent approval.
