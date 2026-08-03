# PHR-TECH-012 — Arbitrage Data-Plane Continuity Implementation Prompt

## Project Context

Phronesis is an evidence-driven collectible decision system. Documentation is part of implementation.

## Feature ID

`PHR-TECH-012`

## Objective

Eliminate operational pricing-database divergence and keep the regional crosswalk synchronized after new Magic catalogue checkpoints.

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

## Constraints

- Do not rename or delete either existing live database in this slice.
- Do not invent costs, availability, matches, or provider data.
- Do not change TCGplayer acquisition logic in the sibling Pricing Update Tool.

## Expected Architecture

`entry point -> shared database resolver -> PricingRepository`; new Magic checkpoint -> transactional regional reconciliation -> existing arbitrage query.

## Testing Expectations

- Resolver and explicit-override tests.
- Private LaunchAgent supervision assertion.
- New-vs-unchanged Magic checkpoint reconciliation coverage.
- Full deterministic repository gates.

## Documentation Updates

- Specification, validation, implementation report, conformance review, release notes.
- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Structure, handoff, and conversation memory.

## Acceptance Criteria

- The verified operational database yields regional candidates and all supported entry points resolve consistently.

## Non-Goals

- Database file rename, cost assumptions, availability fabrication, public deployment, or external tool rewrite.

## Notes For AI Coding Agents

- Preserve unrelated user changes and ignored evidence.
- Never print secret-bearing environment values.
