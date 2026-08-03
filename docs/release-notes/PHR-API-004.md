# PHR-API-004 — Product Artwork Coverage

## 2026-08-02 Celebrations Mini Tin Identity Revision

- Preserved eight regional Mini Tins as separate TCG-derived market identities rather than treating their artwork as one Display gallery.
- Added deterministic Kanto–Galar to `gen1`–`gen8` artwork reconciliation within the exact Celebrations/Mini Tin boundary.
- Left `Celebrations Mini Tin Display` unresolved because individual tin artwork is not valid display-product evidence.
- Applied eight exact mappings to the active database, raising total visible sealed coverage from 483 to 491 of 2,894 products.

## 2026-08-02 Community Pokémon Gap-Fill Revision

- Added a bounded PokéFiles catalogue importer that validates the public project client and resolves exact English set, collector, and material-name identity.
- Added an immutable-commit `ptcg-assets` manifest importer for exact Pokémon sealed set/product-class/descriptor matches without cloning the repository.
- Populated 31,286 Pokémon single mappings (71.54% of the current local single rows) and 356 sealed mappings (12.31%). The sealed recovery pass added 165 mappings over the initial result.
- Cached the 1,500 highest-priority unique sources locally with zero final failures and exact TCGdex repair for one dead upstream URL.
- Recovered plural mini-tin/tin/deck/collection paths, exact modern set labels, promo-ID/card-name matches, mixed-product exact filenames, and component-suffixed product assets.
- Preserved 1,019 possible-but-non-exact and 1,517 unmatched/unsupported sealed rows as placeholders with audit reasons.
- Added deterministic reruns, insert-if-missing-or-stale persistence, strict source allowlists, pinned provenance, and local ignored run reports.

## 2026-08-01 Event-Readiness Revision

- Fixed Pokémon thumbnails missing when TCGplayer product titles include collector-number suffixes.
- Added exact visible-card queries for One Piece and deterministic stacked-descriptor handling.
- Added restart-safe verified artwork mappings in the pricing database.
- Added truthful `NO_MATCH` provider status.
- Added a bounded readiness command for full exact metadata reconciliation and high-priority local image retention.
- Prepared 32,566 Pokémon product mappings, 3,224 One Piece product mappings, and 1,000 locally retained priority images in the active event database.
- Preserved placeholders for sealed products and special/stamped/serial/manga/event printings without an authoritative unique asset.
