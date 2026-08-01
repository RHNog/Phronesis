# PHR-API-004 — Product Artwork Coverage

## Feature ID

`PHR-API-004`

## Status

Completed — CTO Accepted

## Priority

High

## Category

API / Artwork / Identity / Local Storage

## Objective

Extend honest, durable artwork coverage to Pokémon and One Piece catalogue singles, sealed products, and special products without attaching images to uncertain identities. Make tomorrow's event catalogue resilient by resolving and retaining as many exact card identities as the authoritative providers permit before the event begins.

## Proposed Solution

Separate card-art resolution from product-art resolution. Normalize commerce-only title suffixes before provider discovery, prefer an authoritative catalogue photo, then an exact provider match, then an owner-curated local image bound to the exact catalogue SKU. Query bounded visible Pokémon and One Piece artwork identities independently so an unrelated result cannot starve later singles. Persist only verified SKU-to-provider resolutions and retain their image bytes in the durable local cache. Retain placeholders when exact identity is unavailable.

An operator-invoked readiness command may enumerate authoritative provider metadata and compare it with locally loaded Pokémon and One Piece singles. It may persist exact resolutions for the full local catalogue while prefetching image bytes only for a configurable, bounded, high-priority subset. This metadata index and bounded byte prewarm are not permission for speculative matching, an unbounded image crawl, or provider redistribution.

## Functional Requirements

- Preserve existing strict Magic, Pokémon, Lorcana, and One Piece card-art paths.
- Remove bounded trailing collector/card-number decorations from provider discovery names while preserving the original catalogue identity for exact resolution.
- Resolve bounded visible result groups rather than one first-name or raw-user query per category.
- Query One Piece by exact visible card identities/card numbers, not only the free-text search phrase.
- Persist verified resolution metadata by category, SKU, and complete artwork identity; ignore a persisted record when that identity changes.
- Reuse persisted resolutions on later searches and after process restarts.
- Report `NO_MATCH` when a provider is healthy but no exact visible identity resolves; reserve `OPERATIONAL` for responses that contain artwork.
- Provide an idempotent readiness command that indexes authoritative Pokémon and One Piece card metadata, stores exact local mappings, ranks mapped products by current value, and prefetches no more image assets than its explicit limit.
- Return repository-provided sealed URLs immediately when present.
- Add an exact-SKU curated artwork registry and protected upload/import boundary.
- Serve curated files through the existing same-origin durable cache safeguards.
- Never infer TCGplayer CDN URLs from SKU.
- Keep Riftbound deferred.

## Non-Functional Requirements

- Artwork never changes pricing or decision identity.
- Unsupported or ambiguous products retain honest placeholders.
- File type, size, and exact SKU ownership are validated.
- Provider metadata enumeration and image prefetch use bounded pagination/concurrency, emit auditable counts, and continue safely when an individual query or asset fails.
- The readiness command can be rerun without duplicating resolution rows or cache assets.

## Acceptance Criteria

- One unmatched result cannot prevent other visible Pokémon singles from resolving.
- A TCGplayer title such as `Mega Dragonite ex - 152/217` discovers the `Mega Dragonite ex` provider family and resolves only the exact set/collector printing.
- One Piece visible results are discovered by their own exact identities and retain base/parallel/SP ambiguity safeguards.
- Exact provider mappings survive a service restart and are invalidated by an identity change.
- A provider with no exact match returns `NO_MATCH`, not a false operational success.
- One readiness run can resolve the locally loaded Pokémon and One Piece singles and prefetch a bounded high-priority subset for offline/local event reliability.
- Sealed catalogue URLs render where supplied.
- An owner can bind a validated local image to an exact sealed or special-product SKU.
- First Partner results remain placeholders unless exact artwork is verified or curated.

## Dependencies

- `PHR-API-002`
- `PHR-TECH-007`
- `PHR-TECH-008`

## Non-Goals

- Guessing artwork from similarly named cards.
- Unbounded or recurring provider-wide image downloads. Full authoritative card-metadata enumeration is allowed for exact local identity indexing; image-byte prefetch remains explicitly bounded.
- Guessing a sealed-product image from a condition SKU or card artwork.
- Riftbound artwork.

## Traceability

- Origin: Product Owner artwork request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-API-004-product-artwork-coverage-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-08-01.
- Remediation: Magic provider queries now use exact visible card names, and unique name/collector identity may bridge provider set-label drift without weakening Pokémon or ambiguous-printing safeguards.
- Event-readiness revision: Product Owner requested a single-pass Pokémon and One Piece coverage hardening for the 2026-08-02 event. The revision authorizes authoritative metadata enumeration, persistent exact resolution indexing, and explicitly bounded high-priority image prefetch while preserving fail-closed identity matching.
