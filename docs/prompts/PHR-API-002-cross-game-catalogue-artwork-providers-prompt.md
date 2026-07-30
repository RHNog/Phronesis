# PHR-API-002 Implementation Prompt

## Project Context

Phronesis uses local TCGplayer catalogue snapshots for price evidence and separate identity providers for artwork. Documentation is implementation.

## Objective

Connect immediately authorized Pokémon and Lorcana artwork, prepare verified Lorcana/Riftbound catalogue receipts, and preserve explicit authorization boundaries for One Piece and Riftbound providers.

## Required Reading

- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/ui/PHR-UI-002-snapshot-catalogue-thumbnails.md`
- `docs/architecture/PHR-ARCH-004-identity-platform.md`
- `docs/architecture/PHR-ARCH-007-cross-game-identity-ontology.md`

## Implementation Requirements

- Add a bounded TCGdex v2 Pokémon identity/artwork provider with cached set metadata, request coalescing, typed normalization, and deterministic tests.
- Dispatch the existing artwork route across Scryfall, Pokémon, and Lorcast.
- Return explicit authorization states for One Piece and Riftbound without external calls.
- Register Lorcana and Riftbound catalogue sources and categories without triggering upstream work.
- Keep provider data out of pricing and decision fields.

## Constraints

- No dependency installation, credential creation, paid plan, external account mutation, Riot application, upstream tool mutation, schedule change, scrape, bulk image download, commit, push, or deployment.
- Preserve the dirty event-readiness tree.
- Never use Scrydex Riftbound assets or guessed One Piece image URLs.

## Testing Expectations

- Provider normalization, cache/failure, strict matching, catalogue source, and artwork-route coverage.
- Lint, application build/type check, focused suite, full-suite baseline, diff hygiene, and runtime verification.
