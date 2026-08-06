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

## 2026-08-02 Community Gap-Fill Implementation

Phronesis now discovers PokéFiles' public catalogue client without persisting its anonymous key, validates the matching Supabase project, paginates sets/cards within hard ceilings, and normalizes upstream URLs into strict Pokémon identities. Material descriptors such as staff, stamped, prize, event, and championship never collapse onto generic artwork.

The sealed path reads the `1niceroli/ptcg-assets` recursive Git tree at one immutable commit rather than cloning its approximately 2 GB history. It excludes non-product media and `_to_sort`, identifies English Pokémon sets through the canonical set manifest, classifies package forms, and accepts only exact set/class matches with unique descriptor proof. Every accepted mapping, ambiguity, and bounded unmatched sample is written to an ignored audit report.

The initial active apply stored 31,286 exact single mappings and 191 exact sealed mappings. The Product Owner challenged the sealed result, and a second audit found under-classified plural package directories, exact set-label gaps, unused mixed-product assets, and promo identifiers embedded in filenames. Deterministic recovery added 165 mappings through explicit product classes, promo-card name corroboration, exact filename/package/year preservation, and explicit half-display separation.

Final coverage is 71.54% for current Pokémon single rows and 12.31% for sealed rows (356 / 2,892). The final idempotency run stored no additional mappings and cached all 1,500 priority sources. A dead PokémonTCG image was replaced by its exact TCGdex identity; allowlisted GitHub community files sent as `application/octet-stream` are accepted only after raster-signature validation, with a command-local 16 MiB prewarm ceiling.

No paid Scrydex API was called, public client credential was persisted, price/offer/inventory evidence was changed, valid same-identity mapping was overwritten by a community source, or ambiguous sealed image was guessed.
