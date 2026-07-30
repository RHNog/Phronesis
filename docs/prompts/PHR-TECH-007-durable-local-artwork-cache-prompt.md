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

## 2026-07-30 Bounded Remediation Amendment

### Objective

Restore artwork that the strict resolver already maps but the durable cache cannot fetch, and make partial Lorcana catalogue searches produce a provider-compatible lookup without broadening identity matching.

### Required Work

- Send a stable, non-secret Phronesis User-Agent with provider image downloads; preserve the existing allowlist, redirect, size, MIME, signature, checksum, and atomic-write controls.
- Derive Pokémon and Lorcana provider queries from the first exact single-card catalogue result. For Lorcana only, replace the TCGplayer name/version separator with whitespace before querying Lorcast.
- Keep strict set and collector-number resolution unchanged; do not attach an image based only on text similarity.
- Add focused regression tests for request headers and Lorcana query formation.
- Verify the exact Mox Opal and Mulan examples through the running local/private service, then prewarm only the verified mapped thumbnails.

### Constraints

No pricing, buying-decision, inventory, provider-account, credential, schedule, Riftbound, public-deployment, provider-wide bulk-download, force-push, history-rewrite, or destructive-cache change.
