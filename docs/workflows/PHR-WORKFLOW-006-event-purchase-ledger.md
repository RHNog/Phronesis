# PHR-WORKFLOW-006 — Event Purchase Ledger

## Feature ID

`PHR-WORKFLOW-006`

## Status

Completed — CTO Accepted

## Priority

High

## Category

Workflow / Database / Vendor Operations / Audit

## Objective

Record what Phronesis operators purchase during an event without forcing low-value bulk into card-by-card inventory.

## Proposed Solution

Add a server-persisted event cart and append-only purchase receipts. Exact catalogue products retain their identity and decision-time evidence. A static Bulk line accepts one or more supported product lines, required total paid, optional approximate quantity or weight, and required notes. Vendor Workspace operators may finalize their own receipts for event speed; administrators can audit and append corrections or voids.

## Functional Requirements

- Create or resume an event session with name, date, location, and optional budget.
- Add exact single or sealed lines from the selected buying decision.
- Capture quantity, recommended offer, actual paid price, and notes.
- Add Bulk with multi-select Magic, Pokémon, One Piece, and Lorcana product lines.
- Require total paid and notes for Bulk; quantity/weight are optional.
- Persist the active cart by workspace and operator.
- Finalize an immutable receipt with operator and timestamp.
- Corrections and voids append audit events rather than silently rewriting purchases.
- Keep purchase ledger separate from Inventory.

## Non-Functional Requirements

- Server authorization is `VENDOR_WORKSPACE:OPERATE` for cart and own receipt creation.
- Administration access is required for cross-operator review, correction, or void.
- Idempotency prevents duplicate checkout submission.
- Desktop first; mobile remains a complete backup flow.

## Acceptance Criteria

- An operator can combine exact cards, sealed products, and one mixed Bulk line in a receipt.
- A completed receipt survives reload and identifies its operator.
- Bulk never requires card-by-card registration.
- Unauthorized modules cannot read or mutate ledger data.

## Dependencies

- `PHR-ARCH-011`
- `PHR-UX-011`
- Pricing repository identities

## Non-Goals

- Inventory intake automation.
- Payments, accounting exports, seller CRM, or marketplace transactions.
- Riftbound.

## Traceability

- Origin: Product Owner request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-006-event-purchase-ledger-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-07-30.
