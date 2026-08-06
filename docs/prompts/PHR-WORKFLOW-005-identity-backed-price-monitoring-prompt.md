# PHR-WORKFLOW-005 Engineer Work Order

## Feature ID

`PHR-WORKFLOW-005`

## Objective

Implement persistent one-action card tracking now behind the reversible identity boundary, then add verified four-daily refresh. Do not require live identity activation to preserve existing watch data.

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
- Do not delete browser-local memberships during migration.
- Do not silently assign legacy memberships to a real user.

## Expected Architecture

- A server-only watchlist repository owns memberships and watch-owned history.
- API routes authorize `MARKET_WATCH` access and resolve either the authenticated user or the explicit legacy-local compatibility principal.
- Browser-local entries are a one-way, idempotent migration input and recoverable cache; the server response becomes authoritative.
- Vendor Workspace submits the exact selected snapshot identity and receives created-versus-existing status for inline confirmation and undo.
- Provider acquisition remains outside initial load and is never triggered by tracking.

## Acceptance Criteria

- Tracking, persistence, authorization, idempotency, undo, refresh, and responsive interaction tests pass.
