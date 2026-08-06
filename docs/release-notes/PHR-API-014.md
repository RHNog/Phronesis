# PHR-API-014 — LigaPokemon Catalogue Reconciliation

## Summary

Phronesis now reconciles complete LigaPokemon snapshots to the English Pokémon TCGplayer catalogue through exact, collision-safe physical-product identity and stores the result independently from LigaMagic.

## Delivered

- Isolated transactional Pokémon crosswalk and evidence tables.
- Exact normalized name, bounded set alias, collector numerator, and finish matching.
- Explicit quarantine for foreign-market labels, unsupported treatments, ambiguous targets, and source-to-target collisions.
- Complete-manifest database binding, row-count verification, source hash, catalogue fingerprint, deterministic crosswalk fingerprint, and atomic validation report.
- Automatic rebuild after complete recurring LigaPokemon acquisition and verified Pokémon catalogue checkpoints.
- Provider-aware regional evidence lookup with exact category isolation and visible LigaMagic/LigaPokemon provenance.
- Existing responsive Vendor Workspace regional panel now shows accepted Pokémon BRL evidence without changing TCGplayer pricing or Arbitrage.

## Live Result

Snapshot `dry-run-20260805T070105248Z` produced 25,200 exact matches from 167,912 identities. Of those, 24,895 have both LigaPokemon consumer-low and TCGplayer Near Mint evidence. The crosswalk remains fingerprint `295be8d699da35d13b8df82a59a6d46ae9a51fd6f337e6c60b3a7f3259c91d9a`; zero accepted target collisions or missing targets remain. Live Pikachu V `043/185` evidence displays LigaPokemon low R$38.99 and average R$42.07.

## Boundary

Pokémon rows do not yet enter Arbitrage. Vendor evidence approval does not authorize candidate exposure, cost economics, or executable availability assumptions.
