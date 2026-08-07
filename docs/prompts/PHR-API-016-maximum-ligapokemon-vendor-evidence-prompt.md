# PHR-API-016 — Maximum LigaPokémon Vendor Evidence Implementation Prompt

## Project Context

Project Phronesis is the internal engineering initiative responsible for developing an evidence-driven decision intelligence platform for collectible markets.

Documentation is part of implementation. Follow the originating feature specification before changing code.

## Feature ID

`PHR-API-016`

## Objective

Restore the provider-aware Pokémon target-equivalence ledger to the active Vendor Workspace branch, expose all exact and bounded-compatible LigaPokémon evidence, and add a guarded Hidden Fates Shiny Vault subset identity that resolves Gardevoir GX SV75 without weakening printing fidelity.

## Required Reading

- `docs/api/PHR-API-016-maximum-ligapokemon-vendor-evidence.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/architecture/PHR-ARCH-006-identity-fidelity-treatment-model.md`
- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`

## Implementation Requirements

- Add the canonical Pokémon identity normalization and target-equivalence modules to the active branch.
- Build the strict source crosswalk and additive target ledger transactionally from a verified complete LigaPokémon snapshot.
- Preserve the accepted exact source crosswalk and Arbitrage isolation.
- Add an explicit SV-collector-guarded Hidden Fates Shiny Vault set compatibility rule.
- Add only the measured special-distribution comparison tier named in the feature specification; require exact name/collector/finish and one semantic source/evidence signature.
- Read `EXACT` and `COMPATIBLE` target-equivalence evidence in Vendor Workspace, with a fallback for operational databases that predate the ledger.
- Return and render provider, source run, condition, language, match quality, method, confidence, and reason.
- Return a disposition for `AMBIGUOUS` and `UNAVAILABLE` targets.
- Rebuild Pokémon reconciliation after complete provider snapshots and verified Pokémon catalogue imports.
- Back up and transactionally rebuild the operational reconciliation only after isolated tests pass.
- Quantify before/after coverage and prove the exact Gardevoir GX SKU.

## Constraints

- Do not use fuzzy text, edit distance, price, rarity, row order, or visual colour as identity evidence.
- Do not admit Base Set Shadowless or World Championship products through the distribution proxy.
- Do not map a Hidden Fates non-SV collector through the Shiny Vault subset rule.
- Do not present compatible evidence as exact.
- Do not expose compatible evidence to Arbitrage.
- Do not modify acquisition credentials, browser profiles, or the source snapshot.
- Preserve the combined TCGplayer/Liga card and collapsed PriceCharting placement from `PHR-UX-013`.

## Expected Architecture

Verified LigaPokémon snapshot and verified TCGplayer catalogue feed a deterministic reconciliation repository. That repository atomically writes source evidence, the strict source crosswalk, and a provider-aware target-equivalence ledger. The server read repository selects exact or compatible evidence for one target SKU and projects its disposition. The authorized route serializes that projection. The existing client panel renders match quality and provenance inside Vendor Workspace.

## Testing Expectations

- Unit fixtures for identity entities, aliases, collector normalization, finish policy, material treatment, and the Hidden Fates SV guard.
- Integration fixtures for exact, compatible, ambiguous, unavailable, sealed, foreign, duplicate-signature, and idempotent builds.
- Route/read-model tests for ledger preference, legacy fallback, provider provenance, and disposition.
- Full automated tests, TypeScript, lint, production build, diff checks, SQLite integrity, live API, and mobile no-overflow validation.
- Transactional live rebuild with a recoverable database backup and before/after coverage report.

## Documentation Updates

- `docs/api/PHR-API-016-maximum-ligapokemon-vendor-evidence.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/testing/PHR-API-016-maximum-ligapokemon-vendor-evidence-validation.md`
- `docs/implementation-reports/PHR-API-016-maximum-ligapokemon-vendor-evidence-report.md`
- `docs/reviews/PHR-API-016-maximum-ligapokemon-vendor-evidence-conformance-review.md`
- `docs/release-notes/PHR-API-016.md`
- `docs/FEATURE_REGISTRY.md`, `docs/PROMPTS.md`, `docs/CHANGELOG.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATE.md`, and product conversation history.

## Acceptance Criteria

- The active branch exposes all safely classified target-ledger evidence.
- Gardevoir GX `tcg:aa08ddfcb92850dc0442d62d` resolves to the unique LigaPokémon SV75 Holofoil evidence.
- The complete target population receives a deterministic disposition and no ambiguous/unavailable row is priced.
- Compatible matches are visible and explicitly comparison-only.
- The private deployment and all verification gates pass.

## Non-Goals

- Fuzzy cross-market identity.
- Automatic correction of TCGplayer or LigaPokémon catalogues.
- Changes to offer policy, acquisition scheduling, credentials, or PriceCharting.
- Public deployment.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
- Existing implementation history may be recovered as a shortcut, but reconcile it with the current branch's provider and provenance contract instead of copying it blindly.
