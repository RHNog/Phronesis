# PHR-API-014 — LigaPokemon Catalogue Reconciliation Implementation Prompt

## Project Context

Phronesis uses exact physical-product identity, provider-owned evidence, and fail-closed regional promotion. Documentation is part of implementation.

## Feature ID

`PHR-API-014`

## Objective

Build an isolated, deterministic LigaPokemon-to-English-TCGplayer crosswalk from the latest complete provider snapshot, refresh it after recurring acquisition, and expose exact matched evidence in Vendor Workspace without exposing Pokémon arbitrage candidates yet.

## Required Reading

- `docs/api/PHR-API-014-ligapokemon-catalogue-reconciliation.md`
- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/technical/PHR-TECH-012-arbitrage-data-plane-continuity.md`
- `lib/regional/RegionalIntelligenceRepository.ts`
- `lib/pricing/artwork.ts`

## Implementation Requirements

- Extract or share bounded Pokémon set normalization without weakening existing artwork behavior.
- Add pure Pokémon card-name, set, collector, finish, and treatment identity normalization.
- Add isolated transactional crosswalk/evidence persistence and a typed validation report.
- Discover only a complete LigaPokemon snapshot and hash-bind the result.
- Quarantine unsupported variants, multiple targets, and target collisions.
- Add an atomic report-writing command and package script.
- Trigger reconciliation after recurring LigaPokemon snapshot success while keeping candidate exposure disabled.
- Route regional evidence lookup by approved category/provider: LigaMagic for `magic-en`, LigaPokemon for `pokemon-en`, and no fallback for other categories.
- Return explicit provider provenance and only exact `MATCHED` evidence.
- Render the provider-aware evidence in the existing responsive Vendor Workspace regional panel.

## Constraints

- Preserve all existing dirty work and the complete LigaPokemon authority changes.
- Do not replace, truncate, or reinterpret the Magic regional tables.
- Do not use fuzzy text similarity, containment, price, rarity, color, or row order as identity proof.
- Do not expose Pokémon rows through Arbitrage APIs or candidate ranking in this feature.
- Do not substitute LigaMagic evidence for Pokémon, LigaPokemon evidence for Magic, or another printing for an unmatched SKU.
- Do not add network access or dependencies.

## Expected Architecture

Complete LigaPokemon snapshot -> pure Pokémon identity policy -> isolated Pokémon reconciliation repository -> transactional crosswalk/evidence tables -> provider-aware regional evidence query -> existing Vendor Workspace panel. Recurring acquisition invokes the command only after `DRY_RUN_COMPLETE`; Arbitrage candidate exposure remains a later acceptance gate.

## Testing Expectations

- Unit tests for set aliases, collector normalization, bounded title cleanup, finish mapping, special-treatment quarantine, ambiguity, and collisions.
- Integration tests proving isolated tables, idempotency, source/pricing fingerprints, and preservation of Magic rows.
- Repository/API contract tests proving exact provider routing, provider provenance, fail-closed missing tables, and no cross-game fallback.
- Vendor panel regression assertion for visible provider provenance.
- Live build against the verified 167,912-row snapshot with direct SQLite audit.
- Full repository tests, TypeScript, lint, build, plist validation, and diff hygiene.

## Documentation Updates

- Specification, validation, release notes, conformance review, Decisions, Atlas, Roadmap, Feature Registry, Structure, handoff, and conversation memory.

## Acceptance Criteria

- The live crosswalk contains only exact unique identities, reports deterministic evidence, survives repeat build unchanged, becomes an automatic post-snapshot step, and supplies exact provider-labeled Vendor Workspace evidence without entering the Arbitrage queue.

## Non-Goals

- Pattern/vintage/foreign-language inference, fuzzy matching, new UI surfaces, route-cost configuration, availability verification, or Pokémon opportunity exposure.

## Notes For AI Coding Agents

- Prefer a smaller defensible match set over an expanded uncertain one.
- Preserve rejected evidence and report why it was not promoted.
- Do not claim independent approval for same-session conformance.

## Implementation Result

Completed on 2026-08-05. Provider-aware regional lookup now returns exact LigaMagic evidence for `magic-en` and exact LigaPokemon evidence for `pokemon-en`, including visible source provenance in Vendor Workspace. The live Pikachu V `043/185` SKU returns LigaPokemon consumer-low R$38.99 and average R$42.07. Pokémon Arbitrage exposure remains outside this work order.
