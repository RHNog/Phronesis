# PHR-TECH-007 Engineer Prompt — Durable Local Artwork Cache

## Objective

Implement a secure, ignored, same-origin local cache for already-authorized raster card artwork and connect official Bandai One Piece artwork without changing pricing or buying logic.

## Required Reading

- `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/architecture/PHR-ARCH-007-cross-game-identity-ontology.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`

## Implementation Requirements

- Build an exact-host/path allowlisted raster cache with bounded downloads, signature validation, atomic writes, metadata, and request coalescing.
- Serve cached images through a same-origin route and rewrite provider artwork responses to that route.
- Build a bounded official Bandai One Piece search adapter from the English card-list response.
- Match product/set, collector number, base name, and variant evidence conservatively; keep ambiguous records on the placeholder.
- Add focused provider, resolver, cache, and integration tests.

## Constraints

- Preserve exact TCGplayer snapshot prices, conditions, SKUs, and evaluation inputs.
- No bulk catalogue download, upstream Pricing Update Tool mutation, credentials, public deployment, commit, push, or publication.
- Record Product Owner authorization as attested, not independently verified.
- Do not weaken the Riftbound authorization boundary.

## Acceptance Criteria

- One Piece results can show strictly matched official images through the durable local cache.
- Repeated image retrieval performs no second provider request.
- Invalid inputs fail closed and all existing pricing behavior remains available.
