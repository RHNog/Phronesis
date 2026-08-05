# PHR-API-015 — Engineer Implementation Report

## Delivered

- Added bounded Pokémon HTML-entity and ampersand normalization.
- Added `regional_product_equivalence`, a provider-aware target ledger with one disposition per TCGplayer product.
- Populated Magic from the existing accepted crosswalk and Pokémon through ordered exact/compatible structural tiers, treating unnamed material qualifiers as compatible rather than exact.
- Preserved ambiguity, source absence, sealed absence, hashes, source generations, methods, confidence, and deterministic fingerprints.
- Extended evidence lookup and its API with match quality and target disposition.
- Added exact/compatible/unavailable/ambiguous Vendor Workspace language and an explicit compatible-evidence Arbitrage exclusion.
- Rebuilt both provider ledgers against the operational database and confirmed Lucario V at R$29.99.

## Main Files

- `lib/regional/ProductEquivalence.ts`
- `lib/pricing/pokemonIdentity.ts`
- `lib/regional/PokemonRegionalReconciliationRepository.ts`
- `lib/regional/RegionalIntelligenceRepository.ts`
- `lib/regional/domain.ts`
- `app/api/regional/evidence/route.ts`
- `features/vendor/components/RegionalMarketPanel.tsx`
- `tests/pokemon-regional-reconciliation.test.ts`
- `tests/snapshot-vendor-workspace.test.ts`

## Verification

Full 404/404 tests, TypeScript, lint, production build, live database invariants, Lucario regression, and repeated Pokémon complete-snapshot fingerprints pass. Exact Magic Arbitrage queries were not widened.

## Deployment

The launch-managed private runtime was restarted from the validated production build. Local and tailnet Vendor Workspace return HTTP 200; Lucario returns exact R$29.99 LigaPokemon evidence with match metadata; the public event gateway remains restricted and returns 404 for Settings. Compatible evidence remains excluded from exact Arbitrage. Product Review remains pending, and repository publication is authorized in the same delivery.
