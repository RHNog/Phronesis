# PHR-WORKFLOW-005 Engineer Work Order

## Feature ID

`PHR-WORKFLOW-005`

## Objective

Implement persistent one-action card tracking and verified four-daily refresh after identity authorization is operational.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-005-identity-backed-price-monitoring.md`
- `docs/workflows/PHR-WORKFLOW-001-market-watch-mvp.md`
- `docs/ux/PHR-UX-003-capability-aware-workflows.md`
- `docs/ux/PHR-UX-004-watch-history.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`

## Implementation Requirements

- Persist user-owned watchlists and memberships on the server.
- Preserve exact market identity, creation metadata, refresh history, target behavior, removal, and undo.
- Add a default-watchlist one-action tracking path from catalogue results.
- Trigger refresh from verified snapshot completion receipts.
- Keep provider acquisition out of initial page load.
- Add accessible desktop and mobile behavior with deterministic tests.

## Constraints

- Do not create a second snapshot scheduler.
- Do not merge market estimates, listings, and observed sales.
- Do not require advanced configuration to track a card.

## Acceptance Criteria

- Tracking, persistence, authorization, idempotency, undo, refresh, and responsive interaction tests pass.
