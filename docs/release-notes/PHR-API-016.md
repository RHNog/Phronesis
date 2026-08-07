# PHR-API-016 — Maximum LigaPokémon Vendor Evidence Coverage

## Summary

Vendor Workspace now exposes all deterministic exact and bounded-compatible LigaPokémon equivalents rather than only the legacy exact source crosswalk. Gardevoir GX SV75 is reconciled to the promoted LigaPokémon snapshot.

## Operator Impact

- Eligible selected-card coverage increases from 25,549 visible legacy matches to 34,176 exact/compatible matches, including 33,795 with Liga consumer-price evidence.
- Gardevoir GX Hidden Fates: Shiny Vault shows HIF/SV75 Holofoil evidence at R$169.90.
- Compatible evidence is visibly labelled with confidence and reason and is excluded from Arbitrage.
- Ambiguous and unavailable products explain their disposition instead of silently substituting another variation.
- Future complete LigaPokémon snapshots and Pokémon catalogue updates rebuild the target ledger automatically.
- Explicit special-distribution families can now contribute a comparison-only compatible match when name, collector, finish, and source uniqueness all agree; 776 collisions remain visibly quarantined.

## Safety

The strict source crosswalk and Arbitrage remain exact-only. Identity rules do not use fuzzy text, price, rarity, row order, or colour. The live rebuild was transactional and has a verified pre-change backup.
