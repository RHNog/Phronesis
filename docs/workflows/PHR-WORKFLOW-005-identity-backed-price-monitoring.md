# PHR-WORKFLOW-005 — Identity-Backed Price Monitoring

## Feature ID

`PHR-WORKFLOW-005`

## Status

Planned

## Priority

High

## Category

Product / Workflow / UX / Database

## Objective

Turn Market Watch into a persistent, user-owned, low-friction card-price monitoring workflow that refreshes with verified catalogue snapshots.

## Proposed Solution

Allow an authorized user to track an exact artwork, finish, condition, and language in one action from any catalogue result. Store memberships server-side, use a default watchlist and sensible refresh defaults, preserve undo, and refresh tracked entries after each verified four-daily Pricing Update Tool checkpoint.

## Functional Requirements

- One primary `Track price` action after exact variant selection.
- No mandatory target price or watchlist choice.
- Per-user default watchlist and server-owned persistence.
- Idempotent tracking and immediate undo.
- Four-daily refresh triggered by verified catalogue checkpoints, not a competing schedule.
- Current estimate, change since tracking, freshness, target gap, active listing evidence, and observed-sale evidence remain visibly distinct.
- Login resumes the intended tracking action and card context.

## UI / UX Notes

Tracking succeeds inline without a blocking configuration modal. Advanced target, shipping, condition, provider, and alert settings are available after creation. Desktop is primary; mobile is a complete adaptation rather than a separate workflow.

## Acceptance Criteria

- An authorized user can track a selected variant in one action.
- Membership persists across browsers and devices for that user.
- Duplicate actions do not create duplicate memberships.
- Snapshot refresh updates watched entries without issuing unnecessary provider calls.
- Another user cannot read or mutate memberships without an authorized workspace role.

## Dependencies

- `PHR-TECH-009` green baseline.
- `PHR-ARCH-011` identity and entitlements.
- Existing `PHR-WORKFLOW-001`, `PHR-UX-003`, `PHR-UX-004`, and `PHR-WORKFLOW-004` behavior.

## Non-Goals

- Public social watchlists.
- SMS alerts.
- Marketplace trading or automatic purchases.
- Full portfolio analytics.

## Traceability

- Origin: Product Owner approval on 2026-07-30.
- Implementation prompt: `docs/prompts/PHR-WORKFLOW-005-identity-backed-price-monitoring-prompt.md`.
- Last modified: 2026-07-30.
