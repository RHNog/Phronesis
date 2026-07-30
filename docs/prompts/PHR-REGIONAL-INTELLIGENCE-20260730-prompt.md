# Engineer Work Order — Regional Vending And Arbitrage Intelligence

## Feature IDs

`PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`

## Objective

Implement a fail-closed exact LigaMagic/TCGplayer identity bridge, regional evidence and explicit cost truth, offer-first Brazilian vending guidance, and two-way arbitrage candidate verification.

## Required Reading

- `docs/architecture/PHR-ARCH-013-cross-market-identity-bridge.md`
- `docs/api/PHR-API-006-regional-market-evidence.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/workflows/PHR-WORKFLOW-007-arbitrage-verification.md`
- `docs/design/PHR-UX-013-regional-vending-intelligence.md`
- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`

## Ordered Slices

1. Crosswalk domain, server-only repository, reproducible build command, coverage evidence, and focused tests.
2. Regional evidence DTOs, FX/cost profiles, deterministic calculations, authorized APIs, and Settings controls.
3. Vendor Workspace regional evidence and pricing-intent presentation reusing the canonical purchase engine.
4. Ranked two-way arbitrage candidates, append-only availability verification, Opportunities UI, and integration validation.

## Constraints

- Do not enable or install the 03:00 LigaMagic schedule.
- Do not scrape marketplace pages or automate transactions.
- Treat Compra as consumer retail and Venda as dealer-buy benchmark.
- Never infer unknown cost as zero or call an unverified benchmark actionable.
- Quarantine Textless and every ambiguous cross-market identity.
- Preserve unrelated worktree and ignored local data.
- No public deployment, force push, or history rewriting.

## Testing Expectations

- Pure domain tests for identity and economic calculations.
- Repository migration/idempotency tests.
- Authorization tests for reads and mutations.
- UI integration tests for matched, incomplete, stale, and verified states.
- Full suite, standalone TypeScript, lint, production build, and diff hygiene at each checkpoint.

## Acceptance Criteria

- Exact regional evidence appears for a matched Vendor Workspace card.
- An owner can configure timestamped FX/cost assumptions without storing secrets.
- Candidate ranking is deterministic and truthfully gated.
- Availability verification can advance a costed candidate to actionable; benchmark data alone cannot.
