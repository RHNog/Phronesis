# PHR-UX-022 Implementation Prompt

## Project Context

Phronesis is a snapshot-first Vendor Workspace. TCGplayer is the selected-condition raw-card pricing authority; LigaMagic and LigaPokemon provide exact reconciled Brazilian evidence; PriceCharting and certificate lookup are optional grading evidence. Documentation is part of implementation.

## Feature ID

`PHR-UX-022`

## Objective

Compose TCGplayer and exact Liga evidence into one primary pricing card and place all grading information in one collapsed disclosure immediately below it.

## Required Reading

- `docs/ux/PHR-UX-022-selection-focused-vendor-workspace.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/api/PHR-API-009-grading-certificate-lookup.md`
- `docs/api/PHR-API-010-pricecharting-graded-evidence.md`
- `docs/api/PHR-API-014-ligapokemon-catalogue-reconciliation.md`
- Relevant Next.js image, metadata-icon, and accessibility guides under `node_modules/next/dist/docs/`.

## Implementation Requirements

- Move `RegionalMarketPanel` from Buying decision into the selected Snapshot evidence pricing card.
- Keep TCG price state, reference precedence, movement, snapshot/source data, and Track price inside that same card.
- Convert `PriceChartingGradedArea` into a collapsed native disclosure directly below combined pricing.
- Render `GradingCertificateLookup` inside that disclosure and remove its separate Buying decision placement.
- Preserve exact-match fail-closed provider behavior and every existing API boundary.
- Add structural tests for source order, one regional instance, one grading boundary, provider provenance, and absence of duplicate grading/regional controls.

## Constraints

- Do not change price math, evaluation, offer ladder, watchlist persistence, regional matching, provider acquisition, or transaction behavior.
- Do not open grading by default or present graded values as TCG/Liga raw-card evidence.
- Preserve all unrelated dirty-worktree changes.

## Expected Architecture

`SnapshotVendorWorkspace` composes one combined pricing section. `RegionalMarketPanel` stays responsible only for exact regional fetch/render states. `PriceChartingGradedArea` owns the single grading disclosure and embeds the existing certificate-control presentation without duplicating its API logic.

## Testing Expectations

- Extend `tests/snapshot-vendor-workspace.test.ts` with ordering and duplication assertions.
- Preserve grading certificate tests and regional provider tests.
- Run focused tests, full tests, standalone TypeScript, lint, production build, diff hygiene, and private runtime probes.

## Documentation Updates

- Update the feature specification, validation record, release note, Feature Registry, Prompt History, Current CTO Structure, Conversation History, Atlas, and Agent Handoff when materially affected.

## Acceptance Criteria

- All acceptance criteria in `PHR-UX-022` pass without a second pricing or grading model.

## Non-Goals

- Arbitrage activation, new pricing providers, certificate-provider activation, or marketplace transactions.
