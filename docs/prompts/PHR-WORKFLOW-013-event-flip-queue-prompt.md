# Implementation Prompt — PHR-WORKFLOW-013 Event Flip Queue

Execution status: **Completed — Product Review Pending**

## Project Context

Phronesis records card-show Purchases as immutable receipts and receipt-backed General Inventory. Documentation is implementation and the active objective adds a fast sorting-to-Case workflow without duplicating ownership.

## Feature ID

`PHR-WORKFLOW-013`

## Objective

Build an event-scoped, purchase-derived Event Flip queue with multi-card selection, editable intended Sale prices, and one idempotent Add-to-Case action.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-013-event-flip-queue.md`
- `docs/workflows/PHR-WORKFLOW-014-display-case-inventory.md`
- `docs/workflows/PHR-WORKFLOW-008-receipt-backed-inventory-intake.md`
- `docs/database/PHR-WORKFLOW-014-display-case-schema.md`

## Implementation Requirements

- Derive actionable exact `SINGLE` candidates from receipt-backed Inventory for the active event.
- Show sealed, Bulk, and description-only purchases as truthful non-actionable outcomes.
- Compute available-to-flip from underlying on-hand minus active Case allocation.
- Support one-to-50 selection, quantities, editable positive Sale prices, market-reference suggestion only when present, and retry-safe batch submission.
- Add dedicated authorized API and responsive Event Flip route/panel.
- Add an eligible-line `Send to Display Case` control, required intended Case price, and Case quantity defaulting to one to Vendor Workspace purchase checkout; enforce the purchased-quantity ceiling and preserve Event Flip for every unallocated copy.

## Constraints

- No copied queue state, duplicate ownership, provider call, cost-derived price, Bulk identity fabrication, destructive migration, dependency, or external transaction.
- Preserve receipt, cost, General Inventory, Event Ledger, and prepared Event Stock evidence.

## Expected Architecture

Receipt/Inventory evidence is the queue source. A thin authorized Route Handler delegates to a server-only Display Case repository. Only allocation batch/movement/price evidence persists.

## Testing Expectations

- Exact, partial, multi-card, sealed, Bulk, manual, voided, oversubscribed, retry, cross-workspace, closed-event, and rollback tests.
- Full tests, TypeScript, lint, build, diff hygiene, private health, desktop, and 390px review.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Sprint History, Changelog, validation, implementation report, conformance, release notes, handoff, and conversation memory.

## Acceptance Criteria

- Every acceptance criterion in `PHR-WORKFLOW-013` passes without duplicating or decrementing owned quantity on Case allocation.

## Non-Goals

- Bulk itemization, Binder implementation, repricing automation, labels, scanners, public deployment, commit, or push.

## Completion Evidence

- Implemented in `app/event-flip`, `app/api/event-flip`, `features/events/EventFlipWorkspace.tsx`, and the server-only Display Case repository.
- Verified by `tests/display-case-control.test.ts`, the full deterministic suite, TypeScript, lint, production build, private health, and responsive browser review.
- Conformance record: `docs/reviews/PHR-WORKFLOW-013-event-flip-queue-conformance-review.md`.
