# PHR-API-004 — Product Artwork Coverage Implementation Report

## Outcome

Phronesis now converts provider-specific commerce titles into bounded discovery identities, resolves Pokémon and One Piece artwork through indexed exact matching, persists verified SKU mappings in local SQLite, and can prepare a bounded high-value image set before an event.

## Root Cause

TCGplayer appends collector numbers to many product names, such as `Mega Dragonite ex - 152/217`, while TCGdex indexes the card as `Mega Dragonite ex`. The route queried the longer commerce title and received no provider cards even though the correct assets existed. One Piece discovery also queried only the user's raw phrase rather than each visible collector identity. Provider successes with zero attached artwork were incorrectly reported as operational.

## Implementation

- Strip only bounded trailing collector/card-number decorations for provider discovery.
- Normalize documented Pokémon set-era and promo-label conventions while preserving special-printing boundaries.
- Query visible One Piece collector numbers independently and parse stacked parenthetical/bracket descriptors.
- Replace repeated filter scans with set/name/collector indexes for catalogue-scale resolution.
- Add `pricing_artwork_resolutions`, keyed by category/SKU and guarded by the complete artwork identity.
- Reuse verified raw provider URLs across restarts and wrap them through the existing same-origin durable cache route.
- Return `NO_MATCH` for a healthy provider with no exact visible mapping.
- Add `npm run artwork:warm`, with bounded provider pagination/query concurrency, transactional category reconciliation, auditable counts, priority ordering, and configurable image-prefetch limits.

## Operational Result

The active event database was reconciled to 32,566 exact Pokémon and 3,224 exact One Piece product mappings. One thousand priority images are retained locally. Ambiguous special variants and unsupported sealed images were deliberately removed from the persistent resolution index rather than allowed to display base artwork.

## Boundaries

No price, inventory, buying decision, credential, external account, public deployment, or upstream catalogue state changed. Provider metadata was read only. Image bytes were limited to the explicit 1,000-asset readiness boundary.
