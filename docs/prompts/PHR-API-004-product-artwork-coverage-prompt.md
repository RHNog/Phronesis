# PHR-API-004 Engineer Work Order

## Feature ID

`PHR-API-004`

## Objective

Resolve Pokémon and One Piece artwork identities independently, persist exact mappings, and prepare a bounded high-priority local image set for the next event while preserving exact-SKU curated images for sealed and special products.

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

## Constraints

- No guessed CDN paths, ambiguous artwork, provider redistribution, unbounded image-byte acquisition, or Riftbound.
- Full provider card-metadata enumeration is permitted only for exact identity indexing against the loaded local catalogue.
- A failed or ambiguous mapping must remain a placeholder and must not change prices, inventory, or buying decisions.

## Testing Expectations

- Commerce-title normalization, multi-result Pokémon/One Piece coverage, persistence and invalidation, truthful diagnostics, bounded readiness behavior, sealed URL, curated mapping, security, and full repository gates.

## Documentation Updates

- Shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.
