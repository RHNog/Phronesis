# PHR-TECH-012 — Arbitrage Data-Plane Continuity Implementation Prompt

## Project Context

Phronesis is an evidence-driven collectible decision system. Documentation is part of implementation.

## Feature ID

`PHR-TECH-012`

## Objective

Eliminate operational pricing-database divergence, keep regional crosswalks synchronized, and prevent long-running imports from blocking durable capture of later upstream catalogue exports.

## Required Reading

- `docs/technical/PHR-TECH-012-arbitrage-data-plane-continuity.md`
- `docs/architecture/PHR-ARCH-013-regional-vending-and-arbitrage.md`
- `docs/workflows/PHR-WORKFLOW-007-arbitrage-verification.md`
- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`

## Implementation Requirements

- Add one shared operational pricing-database resolver with explicit environment override.
- Route runtime and maintenance call sites through it.
- Make private review start through the supervised launcher.
- Rebuild regional crosswalk exactly once after a new Magic catalogue import.
- Preserve last-good state and sanitized errors.
- Add atomic, hash-bound capture receipts below the ignored catalogue archive.
- Keep the observer parent limited to fast capture and run imports/reconciliation in at most one child process.
- Import exclusively from the durable archived path and recover interrupted receipts idempotently.
- Preserve per-category post-import watchlist refresh, JustTCG enrichment, and Magic/Pokémon reconciliation behavior in the importer.
- Align freshness with the six-hour source schedule, using an eight-hour grace window and visible overdue state rather than a seven-day current window.

## Constraints

- Do not rename or delete either existing live database in this slice.
- Do not invent costs, availability, matches, or provider data.
- Do not change TCGplayer acquisition logic in the sibling Pricing Update Tool.
- Do not delete captured archives or receipts on failure.
- Do not block the capture loop on SQLite import, enrichment, or regional reconciliation.

## Expected Architecture

`supervisor -> capture observer -> atomic archive + receipt -> single importer child -> PricingRepository -> category post-import refresh/reconciliation`. The capture observer remains available throughout importer work.

## Testing Expectations

- Resolver and explicit-override tests.
- Private LaunchAgent supervision assertion.
- New-vs-unchanged Magic checkpoint reconciliation coverage.
- Sequential upstream completion test proving later catalogues are captured while an importer is active.
- Receipt hash validation, idempotent drain, interrupted-state recovery, and fail-closed corruption tests.
- Full deterministic repository gates.

## Documentation Updates

- Specification, validation, implementation report, conformance review, release notes.
- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Structure, handoff, and conversation memory.

## Acceptance Criteria

- The verified operational database yields regional candidates, all supported entry points resolve consistently, and no completed catalogue can be lost because another category is importing.

## Non-Goals

- Database file rename, cost assumptions, availability fabrication, external Pricing Update Tool rewrite, or provider-side mutation.

## Notes For AI Coding Agents

- Preserve unrelated user changes and ignored evidence.
- Never print secret-bearing environment values.
