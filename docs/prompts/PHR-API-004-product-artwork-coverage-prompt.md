# PHR-API-004 Engineer Work Order

## Feature ID

`PHR-API-004`

## Objective

Resolve visible artwork groups independently and support exact-SKU curated images for sealed and special products.

## Required Reading

- `docs/api/PHR-API-004-product-artwork-coverage.md`
- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- Local Next.js image and route-handler guides.

## Implementation Requirements

- Preserve strict provider matching.
- Query bounded visible artwork identities independently.
- Prefer catalogue URLs and exact curated SKU mappings for sealed/special products.
- Validate and serve curated files through a closed same-origin boundary.

## Constraints

- No guessed CDN paths, provider-wide downloads, ambiguous artwork, or Riftbound.

## Testing Expectations

- Multi-result Pokémon coverage, sealed URL, curated mapping, security, and full repository gates.

## Documentation Updates

- Shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.
