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
| Compatible | 2,539 | 2,681 |
| Ambiguous | 102 | 103 |
| Unavailable | 13,949 | 13,003 |
| Exact + compatible | 32,600 | 33,545 |
| With Liga consumer price | not previously exposed as the Vendor read | 33,190 |

The revised policy adds 803 exact, 142 compatible, and one explicit ambiguous disposition. No previously exact or compatible target is downgraded. Compared with the former Vendor Workspace read path, which exposed only 25,549 legacy exact targets, 7,996 additional matches become eligible.

Final fingerprints:

- Source crosswalk: `fedfd9adb99e465f351189f4a5f8a02e96943b8af908baae6da175f1fb37de70`
- Target ledger: `27f87216714097d7a0cb1eb1e2a17a966f5faf4ec2236fc0b6a4d4881b84aa93`

## Operational Application

- A consistent 1.8 GB backup was created at `/Volumes/JarvisSSD/Projects/Phronesis/.data/backups/mobile-review-before-phr-api-016-20260807T143515Z.sqlite`; its integrity is `ok` and it preserves the 32,600-row eligible baseline.
- The verified build updated the operational crosswalk, evidence, and target ledger in one transaction.
- Operational SQLite integrity is `ok` after the build.
- Gardevoir GX `tcg:aa08ddfcb92850dc0442d62d` resolves `EXACT` by `EXACT_POKEMON_STRUCTURAL_SET_NAME_COLLECTOR_FINISH_V1`, confidence 92, to Gardevoir-GX, Hidden Fates, `SV75`, Holofoil, NM, EN, consumer low/average/high R$169.90.

## Product Verification

- Full suite: 465/465 passing.
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

## Boundaries Verified

- No ambiguous or unavailable disposition returns evidence.
- Compatible evidence is not written into the strict source crosswalk and is not queried by Arbitrage.
- No provider acquisition, authentication, credential, browser profile, source snapshot, offer, purchase, inventory, marketplace, or public transport state changed.
