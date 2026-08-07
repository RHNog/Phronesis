# PHR-API-016 — Maximum LigaPokémon Vendor Evidence Validation

Date: 2026-08-07

## Automated Contract

- Pokémon identity fixtures cover presentation entities, ampersands, collector numerators, exact finishes, market scope, material treatments, explicit set aliases, and guarded set subsets.
- Hidden Fates `SV75/SV94` is compatible with LigaPokémon `Hidden Fates · SV75`; a numeric Hidden Fates collector is not.
- Generations Radiant Collection requires an `RC` collector. Double Crisis extended provider labelling is admitted only by the target-equivalence tier, preserving the strict source crosswalk.
- Integration fixtures cover exact, bounded compatible, ambiguous, unavailable, sealed, foreign, duplicate-signature, target-collision, deterministic fingerprint, and legacy read fallback behavior.
- Recurring acquisition, catalogue observer, direct catalogue import, and the package command all retain Pokémon reconciliation continuity.

## Complete Snapshot Dry Run

Input snapshot: `dry-run-20260805T070105248Z`, 167,912 unique identities, zero conflicting duplicates.

The implementation ran twice against a disposable copy of the operational database before live application. The final report was deterministic and SQLite integrity returned `ok`.

| Target disposition | Before | After |
| --- | ---: | ---: |
| Exact | 30,061 | 30,864 |
| Compatible | 2,539 | 3,312 |
| Ambiguous | 102 | 776 |
| Unavailable | 13,949 | 11,699 |
| Exact + compatible | 32,600 | 34,176 |
| With Liga consumer price | not previously exposed as the Vendor read | 33,795 |

The complete policy adds 803 exact and 773 compatible targets over the original ledger. The final special-distribution revision contributes 631 of those compatible targets and explicitly quarantines 673 additional collisions. No previously exact or compatible target is downgraded. Compared with the former Vendor Workspace read path, which exposed only 25,549 legacy exact targets, 8,627 additional matches become eligible.

Final fingerprints:

- Source crosswalk: `fedfd9adb99e465f351189f4a5f8a02e96943b8af908baae6da175f1fb37de70`
- Target ledger: `e0d4015e92ad4f4d3016b62b49bd004cedb6e44061f2887c514aa2e7b82e3ad7`

## Operational Application

- A consistent 1.8 GB backup was created at `/Volumes/JarvisSSD/Projects/Phronesis/.data/backups/mobile-review-before-phr-api-016-20260807T143515Z.sqlite`; its integrity is `ok` and it preserves the 32,600-row eligible baseline.
- The verified build updated the operational crosswalk, evidence, and target ledger in one transaction.
- Operational SQLite integrity is `ok` after the build.
- Gardevoir GX `tcg:aa08ddfcb92850dc0442d62d` resolves `EXACT` by `EXACT_POKEMON_STRUCTURAL_SET_NAME_COLLECTOR_FINISH_V1`, confidence 92, to Gardevoir-GX, Hidden Fates, `SV75`, Holofoil, NM, EN, consumer low/average/high R$169.90.

## Product Verification

- Full suite: 470/470 passing.
- Focused reconciliation, regional repository, and Vendor Workspace tests: 26/26 passing.
- Standalone TypeScript: passing.
- ESLint: passing without warnings.
- Next.js 16.2.12 production build: passing.
- Diff hygiene: passing.
- Private local and tailnet Vendor routes return HTTP 200 after the exact listener restart.
- Signed-in live Vendor selection renders Gardevoir as `LigaPokémon · exact printing`, the promoted run, HIF/SV75/Holofoil, NM/EN, R$169.90, method reason, and 92% confidence.
- Signed-in live Vendor selection renders `Charizard (Black Dot Error)` as `compatible Liga equivalent`, 72% confidence, and explicitly excludes it from Arbitrage.
- The live regional evidence panel is 328 pixels wide with equal client/scroll width and zero overflowing descendants.
- PriceCharting remains collapsed directly below the raw-card evidence card.

## 2026-08-07 — Special-Distribution Expansion

- The compatibility tier is limited to explicit Prize Pack, Jumbo, Deck Exclusive, Alternate Art Promo, Countdown, Professor Program, First Partner, Trainer Kit/Battle Stadium, and League/Championship source families.
- A target must still agree on normalized card name, collector numerator, and exact finish and must have one unique eligible source/evidence pair.
- Base Set Shadowless and World Championship identities are excluded from the proxy tier.
- Special-distribution evidence remains comparison-only and never enters the strict source crosswalk or Arbitrage.

## Boundaries Verified

- No ambiguous or unavailable disposition returns evidence.
- Compatible evidence is not written into the strict source crosswalk and is not queried by Arbitrage.
- No provider acquisition, authentication, credential, browser profile, source snapshot, offer, purchase, inventory, marketplace, or public transport state changed.
