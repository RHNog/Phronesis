# PHR Cross-Game Buying Engineer Report

Date: 2026-07-29
Features: `PHR-API-002`, `PHR-UX-008`

## Outcome

Vendor Workspace now searches every registered catalogue without a manual switch, groups finish-only duplicates into artwork-first results, and asks for the exact finish after the card is selected. Pokémon thumbnails are operational through TCGdex; the existing Scryfall and Lorcast paths remain provider-owned.

## Implementation

- Added a repository-level unified search response with per-category freshness and bounded global ranking.
- Added deterministic artwork identity grouping and exact finish-to-SKU selection.
- Added a server-only TCGdex provider, strict snapshot resolver normalization, and category-dispatched artwork API.
- Registered Lorcana and Riftbound catalogue sources already present in the Pricing Update Tool configuration.
- Preserved honest placeholders and explicit authorization states for unavailable providers.

## Provider boundary

- Operational: Magic/Scryfall, Pokémon/TCGdex, Lorcana/Lorcast.
- Operational through the authorized revision: One Piece/Bandai official English card list.
- Pending formal approval/key: Riftbound/Riot API.

The subsequent `PHR-TECH-007` revision adds durable local artwork caching and is reported separately in `docs/implementation-reports/PHR-TECH-007-durable-local-artwork-cache-report.md`.

## Exact implementation file list

- `app/api/pricing/artwork/route.ts`
- `app/api/pricing/search/route.ts`
- `config/pricingLookup.ts`
- `features/vendor/components/SnapshotVendorWorkspace.tsx`
- `lib/engines/identity/IdentityOrchestrator.ts`
- `lib/pricing/artwork.ts`
- `lib/pricing/domain.ts`
- `lib/pricing/repository.ts`
- `lib/pricing/tcgplayerCatalog.ts`
- `lib/pricing/types.ts`
- `lib/providers/tcgdex/TcgdexNormalizer.ts`
- `lib/providers/tcgdex/TcgdexProvider.ts`
- `lib/providers/tcgdex/TcgdexTypes.ts`
- `next.config.ts`
- `types/card.ts`
- `tests/identity-platform.test.ts`
- `tests/pokemon-identity-provider.test.ts`
- `tests/pricing-catalog-sync.test.ts`
- `tests/snapshot-artwork.test.ts`
- `tests/snapshot-vendor-workspace.test.ts`

Documentation files are registered under the two Feature IDs in Feature Registry, Prompt History, Structure, validation, release notes, roadmaps, architecture, Atlas, decisions, handoff, sprint history, changelog, and conversation memory.

## Designer review

**CONFORMS — PRODUCT REVIEW READY.** At 1440px the station preserves the intended three-column hierarchy; at 390px it becomes one column without overflow. Thumbnails support identification, game badges disambiguate catalogue ownership, and Finish is a clear intermediate choice before Condition.

## Negative-effect declaration

No upstream run or schedule change, account creation, paid-plan acceptance, credential write, unofficial Riftbound image, buying-logic change, inventory mutation, commit, push, deployment, or publication occurred.
