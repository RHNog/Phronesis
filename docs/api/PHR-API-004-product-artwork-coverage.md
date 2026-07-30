# PHR-API-004 — Product Artwork Coverage

## Feature ID

`PHR-API-004`

## Status

Implemented — Product Review Ready

## Priority

High

## Category

API / Artwork / Identity / Local Storage

## Objective

Extend honest, durable artwork coverage to sealed products and special Pokémon products without attaching images to uncertain identities.

## Proposed Solution

Separate card-art resolution from product-art resolution. Prefer an authoritative catalogue photo, then an exact provider match, then an owner-curated local image bound to the exact catalogue SKU. Query bounded visible Pokémon artwork groups independently so an earlier code-card result cannot starve later singles. Retain placeholders when exact identity is unavailable.

## Functional Requirements

- Preserve existing strict Magic, Pokémon, Lorcana, and One Piece card-art paths.
- Resolve bounded visible result groups rather than one first-name query per category.
- Return repository-provided sealed URLs immediately when present.
- Add an exact-SKU curated artwork registry and protected upload/import boundary.
- Serve curated files through the existing same-origin durable cache safeguards.
- Never infer TCGplayer CDN URLs from SKU.
- Keep Riftbound deferred.

## Non-Functional Requirements

- Artwork never changes pricing or decision identity.
- Unsupported or ambiguous products retain honest placeholders.
- File type, size, and exact SKU ownership are validated.

## Acceptance Criteria

- One unmatched result cannot prevent other visible Pokémon singles from resolving.
- Sealed catalogue URLs render where supplied.
- An owner can bind a validated local image to an exact sealed or special-product SKU.
- First Partner results remain placeholders unless exact artwork is verified or curated.

## Dependencies

- `PHR-API-002`
- `PHR-TECH-007`
- `PHR-TECH-008`

## Non-Goals

- Guessing artwork from similarly named cards.
- Provider-wide image downloads.
- Riftbound artwork.

## Traceability

- Origin: Product Owner artwork request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-API-004-product-artwork-coverage-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-07-30.
