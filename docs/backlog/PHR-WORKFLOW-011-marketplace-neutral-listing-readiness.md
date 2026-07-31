# PHR-WORKFLOW-011 — Marketplace-Neutral Listing Readiness

## Feature ID

`PHR-WORKFLOW-011`

## Status

Backlog — Deferred

## Priority

Medium

## Category

Backlog / Workflow / Inventory / Marketplace

## Objective

Prepare owned inventory for a future sales channel without publishing, reserving external stock, or pretending that a draft is an executable listing.

## Background

`PHR-WORKFLOW-008` through `PHR-WORKFLOW-010` establish truthful intake, on-hand quantity, location, counts, and dispositions. Listing readiness is the next inventory dependency, but regional arbitrage validation is the active priority.

## Proposed Solution

Add marketplace-neutral readiness gates, explicit internal reservations, price and margin evidence, draft listing records, review, approval, cancellation, and auditable state transitions. Channel publication remains a separately authorized integration.

## Functional Requirements

- Require exact owned identity, known available quantity, condition, location, and acquisition evidence before readiness.
- Distinguish available, internally reserved, draft, approved, cancelled, and externally published states.
- Preserve target price, fee/cost assumptions, expected margin, operator notes, and review evidence.
- Prevent drafts and reservations from decrementing inventory as if a sale occurred.
- Release reservations explicitly on cancellation or expiry.
- Keep marketplace-specific payloads behind future adapters.

## Non-Functional Requirements

- Fail closed when quantity, identity, condition, or cost evidence is incomplete.
- Preserve append-only audit history and module authorization.
- Remain desktop-first and mobile-adaptive.
- Perform no external marketplace mutation in this backlog slice.

## Acceptance Criteria

- A user can determine why an owned item is or is not listing-ready.
- Reserved quantity cannot exceed truthful on-hand quantity.
- Draft, approval, cancellation, and reservation release are auditable.
- No listing is published and no payment, shipping, repricing, or settlement behavior is implied.

## Dependencies

- `PHR-WORKFLOW-008`
- `PHR-WORKFLOW-009`
- `PHR-WORKFLOW-010`

## Future Enhancements

- Marketplace-specific publication adapters.
- Automatic repricing, order ingestion, settlement, shipping, returns, and accounting export.

## Traceability

- Originating direction: Product Owner backlog request on 2026-07-30.
- Implementation prompt: none while deferred.
- Last modified: 2026-07-30.
- Modification reason: preserve listing readiness as a bounded backlog item while regional arbitrage validation becomes active.
