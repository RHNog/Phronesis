# PHR-API-014 — LigaPokemon Catalogue Reconciliation Validation

## Status

Passed. The complete 167,912-identity LigaPokemon snapshot reconciles deterministically to an isolated English Pokémon TCGplayer crosswalk, exact matches are live in Vendor Workspace with explicit provider provenance, Magic remains isolated, and Pokémon remains absent from Arbitrage.

## Live Evidence

- Source run: `dry-run-20260805T070105248Z`.
- Source database SHA-256: `506b31ec3cc743b7e847c3f7c71ed0c84355eab02f672402cb82671022471b6c`.
- Pokémon pricing fingerprint: `29092a7200b040597c45b736b330bd4c692a2b1e91923cb8bfd6020b257c6f01`.
- Total source identities: 167,912.
- Exact unique matches: 25,200 (15.01%).
- Exact matches with LigaPokemon consumer-low evidence: 25,034.
- Exact matches with TCGplayer Near Mint evidence: 25,013.
- Exact matches with both evidence lanes: 24,895 (98.79% of matches).
- Exact unmatched: 131,630.
- Unsupported explicit foreign-market rows: 8,474.
- Unsupported treatment rows: 2,600.
- Ambiguous target-collision rows: 8.
- Crosswalk SHA-256 fingerprint: `295be8d699da35d13b8df82a59a6d46ae9a51fd6f337e6c60b3a7f3259c91d9a` on two consecutive builds.

## Identity And Isolation Audit

- Every `MATCHED` row has one existing `pokemon-en` target SKU.
- Zero accepted target SKUs have more than one LigaPokemon identity.
- All explicit `(JP)`, `(Coreano)`, and `(French)` source-set rows are `UNSUPPORTED_MARKET_SCOPE`; `(EN)` and `(English)` remain eligible.
- The eight collision rows are four Professor's Research finish/character targets for which LigaPokemon publishes both colon and parenthesis title spellings. Every member of each collision group is `AMBIGUOUS` under `TARGET_COLLISION_QUARANTINE_V1`.
- The Magic crosswalk remains 329,301 rows with 131,885 matches and fingerprint `38dfd400845f0aea1b9835b8a7502d3b0e2f3d46abdac75f5b41dd9d69fa1a42`.
- The live Arbitrage API still returns 50 candidates, all `magic-en`; Pokémon evidence is not included in its candidate query.

## Automated Evidence

- Focused pricing, regional-provider, Pokémon, and Vendor Workspace tests: 54/54 passed.
- Full supported repository suite: 402/402 passed.
- TypeScript, lint, production build, both launchd plist validations, and diff hygiene passed.

## Operational Continuity

- A complete recurring LigaPokemon snapshot invokes the isolated Pokémon crosswalk command before provider success is recorded.
- A verified `pokemon-en` catalogue checkpoint rebuilds the crosswalk when a complete LigaPokemon snapshot exists and skips cleanly otherwise.
- The report is written atomically to ignored `.data/regional/pokemon-crosswalk-validation.json`.

## Vendor Workspace Evidence

- `RegionalIntelligenceRepository.evidenceFor` routes `magic-en` only to LigaMagic tables and `pokemon-en` only to LigaPokemon tables; other categories and absent Pokémon tables return `null`.
- Live Pokémon request for `tcg:3191420d96ce55402e9e891c` returns `sourceProvider: LigaPokemon`, Pikachu V, Vivid Voltage, collector 43, Holofoil, consumer low 3,899 centavos, and average 4,207 centavos.
- A live matched Magic request returns `sourceProvider: LigaMagic`; no cross-game fallback is possible.
- Vendor Workspace renders the provider name in the exact-match regional panel. TCGplayer prices and snapshots remain independent.

## Remaining Gate

Product Owner acceptance covers exact Vendor Workspace evidence only. Separate acceptance is still required before Pokémon crosswalk rows can feed regional candidate calculations or the Arbitrage queue. Route costs and executable availability remain independent opportunity-actionability gates.
