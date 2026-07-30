# PHR-API-002 — Cross-Game Catalogue Artwork Providers

## Feature ID

`PHR-API-002`

## Status

Product Review Ready — Bandai Revision

## Priority

Critical

## Category

API / Identity / Local Integration / Provider Governance

## Objective

Provide trustworthy thumbnail artwork for every catalogue game through approved identity-provider boundaries while keeping snapshot prices, search, and buying decisions operational when artwork is unavailable.

## Background

The July 29 TCGplayer catalogues contain one non-empty photo URL across more than 1.3 million rows. Magic enrichment through Scryfall proved the non-blocking architecture. The Pricing Update Tool configuration now includes Magic, Pokémon, One Piece, Riftbound, and Lorcana catalogue exports, although the completed July 29 receipt contains only the first three.

## Provider Decision Matrix

| Game | Provider | Decision | Reason |
|---|---|---|---|
| Magic | Scryfall | Operational | Existing Phronesis identity provider, printing artwork, strict matching, cache and request pacing. |
| Pokémon | TCGdex | Approved for immediate connection | Current multilingual Pokémon database, stable card/set IDs, documented low/high image assets, open API, and MIT-licensed database implementation. |
| Lorcana | Lorcast | Operational; connect to snapshot artwork | Existing Phronesis provider returns all printings and CDN-hosted small/normal/large images. |
| One Piece | Bandai official English card list | Authorized for immediate connection | Product Owner attested on 2026-07-29 that Phronesis has Bandai authorization. The official list exposes card-number, product/set, rarity/type, and variant-specific image assets. This authorization is user-supplied and is not independently verified by the repository. |
| Riftbound | Riot API | Required official provider, activation pending | Riot's policy requires an approved app-specific API key and prohibits external or unofficial Riftbound card assets. |

The public OPTCG API is not approved as a production One Piece dependency because its own repository states that its code license grants no rights to its data or card images and deployed data access is gated. Scrydex remains a possible structured fallback but is no longer the primary One Piece plan. Scrydex must not be used for Riftbound artwork because Riot expressly requires Riftbound assets to come from the Riot API.

## Proposed Solution

- Dispatch catalogue artwork by category through one server-only provider resolver.
- Reuse Scryfall and Lorcast, retain TCGdex, add a bounded official Bandai One Piece adapter, and leave Riftbound in an explicit `AUTHORIZATION_REQUIRED` state.
- Match provider records to snapshot products using category, normalized set, collector/card number, language, and presentation-normalized name. Never choose an ambiguous printing.
- Cache provider responses, coalesce identical in-flight searches, debounce client enrichment separately, and return placeholders on every provider failure.
- Add Lorcana and Riftbound catalogue source registrations now so Phronesis can consume verified files if the already-configured Pricing Update Tool emits them. Do not trigger or alter the upstream schedule.

## Functional Requirements

- Artwork provider status is one of `OPERATIONAL`, `NOT_SUPPORTED`, `AUTHORIZATION_REQUIRED`, `UNAVAILABLE`, or `NO_QUERY`.
- Price results render before provider artwork.
- Provider records never alter snapshot prices, conditions, source SKUs, or evaluation inputs.
- Pokémon searches use TCGdex v2 card briefs plus a cached set-name registry and documented low/high WebP assets.
- Lorcast searches request all printings and reuse API-returned image URIs.
- Riftbound images cannot activate without a Riot app-specific key and approved application.
- One Piece requests use the official English card-list search, retain the official asset identity, and rely on the Product Owner's recorded authorization attestation.
- Ambiguous One Piece variants remain placeholders; base, single parallel, and explicitly typed SP records may resolve only when product/set, collector number, name, and variant evidence agree.

## Non-Functional Requirements

### Performance

One debounced search per represented game and stabilized query; no per-row provider requests.

### Reliability

Provider failure is non-blocking and cached local snapshot data remains fully usable.

### Security

All optional credentials remain server-only environment variables and never enter responses, logs, repository files, or client bundles.

### Extensibility

Provider dispatch and strict resolver rules remain category-based so future providers do not add game-specific branching to the Vendor Workspace component.

## Acceptance Criteria

- Magic, Pokémon, and Lorcana provider responses can resolve strict catalogue artwork.
- One Piece returns strictly matched official artwork and Riftbound returns an honest authorization state without guessed images.
- Lorcana and Riftbound are registered as inactive-until-receipt catalogue sources.
- Provider failure does not affect unified search, variant choice, price evidence, or evaluation.
- Focused provider, resolver, build, lint, and runtime checks pass.

## Non-Goals

- Purchasing an API plan, creating credentials, accepting external commercial terms, or submitting a Riot application.
- Provider-wide crawling or bulk image acquisition beyond bounded official search results authorized by the Product Owner.
- Using image-provider prices in snapshot decisions.

## Traceability

- Product direction: 2026-07-29 cross-game thumbnail request.
- Implementation prompt: `docs/prompts/PHR-API-002-cross-game-catalogue-artwork-providers-prompt.md`.
- Related UX: `PHR-UX-008`.
- Validation: `docs/testing/PHR-API-002-cross-game-catalogue-artwork-providers-validation.md`.
- Release note: `docs/release-notes/PHR-API-002.md`.
- Last modified: 2026-07-29.
