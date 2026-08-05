# PHR-API-015 — Maximum Liga Equivalence Coverage Implementation Prompt

## Project Context

Phronesis compares exact TCGplayer catalogue selections with locally acquired LigaMagic and LigaPokemon evidence. Documentation is part of implementation. The exact source crosswalk remains the Arbitrage boundary; this increment adds a broader, labelled Vendor Workspace equivalence layer.

## Feature ID

`PHR-API-015`

## Objective

Account for every Magic and English Pokémon TCGplayer product in a provider-aware equivalence ledger, maximize structurally defensible Brazil-price coverage, fix encoded LigaPokemon identity fields, and expose exact versus compatible evidence truthfully.

## Required Reading

- `docs/api/PHR-API-015-maximum-liga-equivalence-coverage.md`
- `docs/api/PHR-API-014-ligapokemon-catalogue-reconciliation.md`
- `docs/architecture/PHR-ARCH-013-cross-market-identity-bridge.md`
- `lib/regional/PokemonRegionalReconciliationRepository.ts`
- `lib/regional/RegionalIntelligenceRepository.ts`
- `lib/pricing/pokemonIdentity.ts`
- `features/vendor/components/RegionalMarketPanel.tsx`

## Implementation Requirements

- Add the provider/category-scoped target equivalence ledger and transactional rebuild behavior.
- Populate the Magic ledger from the existing accepted crosswalk without changing Magic Arbitrage identity.
- Add bounded HTML-entity and ampersand normalization to Pokémon identity.
- Implement the ordered exact/compatible Pokémon candidate tiers from the specification with deterministic ambiguity handling.
- Persist a disposition for every supported target, including sealed/unavailable rows.
- Extend reports and fingerprints with target-ledger coverage.
- Return match quality, method, confidence, and explanation with regional evidence.
- Render exact and compatible evidence with accurate visible language.
- Prove compatible evidence cannot enter Arbitrage.
- Add the Lucario V regression and complete-ledger coverage tests.

## Constraints

- Do not use price, row order, rarity, color, edit distance, or unbounded fuzzy matching as identity evidence.
- Do not replace or weaken the original exact source crosswalk.
- Do not expose compatible rows through Arbitrage or availability verification.
- Do not invent sealed identities or prices absent from provider exports.
- Do not add network access, dependencies, credentials, or external mutations.

## Expected Architecture

Complete provider snapshot + current TCGplayer catalogue -> original exact source crosswalk -> additive TCGplayer-target equivalence classifier -> provider-aware target ledger -> regional evidence DTO -> Vendor Workspace exact/compatible presentation. Arbitrage continues to query only the original exact source crosswalk.

## Testing Expectations

- Pure normalization tests for HTML entities and ampersands.
- Repository tests for every-target disposition, tier precedence, compatible finish families, ambiguity, unavailable sealed items, idempotency, and provider isolation.
- API/domain/UI assertions for match-quality metadata and labels.
- Regression test for Lucario V `27/73` and R$29.99 source evidence.
- Full tests, TypeScript, lint, build, deterministic live-snapshot rebuild, and diff checks.

## Documentation Updates

- Feature specification, validation, release notes, conformance review, Feature Registry, Atlas, Decisions, Roadmap, Project State, Structure, handoff, and conversation memory.

## Acceptance Criteria

- Every supported TCGplayer target has one disposition; every displayed Brazil price points to an acquired Liga identity; exact/compatible semantics are visible; Lucario is fixed; Arbitrage remains exact-only; all gates pass.

## Non-Goals

- New provider acquisition, sealed catalogue scraping, foreign-language collapse, automatic promotional-treatment approval, or Pokémon Arbitrage activation.

## Notes For AI Coding Agents

- Maximum coverage means maximum defensible evidence, not manufactured equivalence.
- Preserve unrelated work and do not commit, push, or deploy without separate authority.
