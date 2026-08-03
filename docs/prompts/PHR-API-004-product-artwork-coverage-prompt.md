# PHR-API-004 Engineer Work Order

## Feature ID

`PHR-API-004`

## Objective

Resolve Pokémon and One Piece artwork identities independently, persist exact mappings, and prepare a bounded high-priority local image set for the next event while preserving exact-SKU curated images for sealed and special products. For the 2026-08-02 revision, fill the maximum defensible Pokémon singles and sealed gaps from PokéFiles and immutable `ptcg-assets` commits without paid Scrydex API access.

## Required Reading

- `docs/api/PHR-API-004-product-artwork-coverage.md`
- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- Local Next.js image and route-handler guides.

## Implementation Requirements

- Preserve strict provider matching.
- Normalize provider discovery titles without weakening the exact catalogue identity used for resolution.
- Query bounded visible Pokémon and One Piece artwork identities independently.
- Persist resolved provider URLs by complete category/SKU identity and reuse them across restarts.
- Add truthful `NO_MATCH` diagnostics.
- Add an idempotent operator readiness command that enumerates authoritative Pokémon and One Piece metadata, resolves the loaded local singles catalogue, ranks verified mappings, and prefetches only an explicit bounded number of image assets with bounded concurrency.
- Prefer catalogue URLs and exact curated SKU mappings for sealed/special products.
- Validate and serve curated files through a closed same-origin boundary.
- Add a bounded PokéFiles public-catalogue client with validated public-client discovery, deterministic pagination, strict row normalization, and injected-fetch tests.
- Add a `ptcg-assets` manifest client pinned to a commit SHA; do not clone the full repository.
- Resolve PokéFiles singles by exact set, collector number, and material artwork name, with explicit protection for stamped/staff/prize/event variants.
- Resolve `ptcg-assets` sealed images by exact set, compatible product class, and unique descriptor evidence; quarantine multi-packshot, case, bundle, and same-class ambiguity.
- Add insert-if-missing-or-identity-stale persistence so community sources cannot overwrite a valid same-identity resolution.
- Extend durable-cache source policy only for the exact upstream hosts and path shapes used by accepted community records.
- Add an idempotent operator command that runs both sources, saves exact mappings, emits a local audit report, reports before/after coverage, and prefetches only an explicit bounded high-value subset.

## Constraints

- No guessed CDN paths, ambiguous artwork, paid Scrydex API call, source credential persistence, full `ptcg-assets` clone, provider redistribution, unbounded image-byte acquisition, or Riftbound.
- Full provider card-metadata enumeration is permitted only for exact identity indexing against the loaded local catalogue.
- A failed or ambiguous mapping must remain a placeholder and must not change prices, inventory, or buying decisions.
- Preserve unrelated PriceCharting work already present in the canonical working tree.

## Testing Expectations

- Commerce-title normalization, multi-result Pokémon/One Piece coverage, persistence and invalidation, PokéFiles parsing/pagination, material-variant protection, sealed-product classification and ambiguity, durable-host policy, truthful diagnostics, bounded readiness behavior, sealed URL, curated mapping, security, and full repository gates.

## Documentation Updates

- Shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.

## Execution Result — 2026-08-02

- Applied 31,286 exact Pokémon single mappings and 356 exact sealed mappings to the active pricing database after the recovery pass.
- Cached the 1,500 highest-priority unique image sources with zero final failures.
- Preserved 1,019 possible-but-non-exact sealed rows and 1,517 unmatched/unsupported rows as auditable non-matches.
- Verified repeat execution stores zero duplicate mappings.

## Sealed Recovery Work Order — 2026-08-02

- Repair deterministic source classification for plural `mini-tins`, `tins`, `decks`, and `collections` paths plus exact sleeved-booster/display conventions.
- Exclude `_work`, loose promo scans, language-specific roots, and unknown set directories.
- Add only exact one-to-one catalogue set aliases demonstrated by the active source manifest.
- Measure the recovered candidate pool before persistence.
- Enrich descriptors from embedded promo identifiers only when an exact public card record proves the enclosed identity.
- Do not map a regular ETB to a Pokémon Center ETB, a full display to a half display, one wrapper to a generic multi-art pack, or one edition image to another edition.
- Apply only newly exact mappings, retain a complete accepted/ambiguous audit, and re-run idempotency and full repository gates.

Recovery result: 165 additional exact mappings were added, raising sealed coverage from 191 (6.60%) to 356 (12.31%). The final rerun stored zero mappings and cached 1,500 / 1,500 priority sources.
