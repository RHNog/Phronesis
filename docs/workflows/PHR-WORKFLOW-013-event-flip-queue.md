# PHR-WORKFLOW-013 Event Flip Queue

## Feature ID

`PHR-WORKFLOW-013`

## Title

Purchase-Fed Event Flip Queue

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

Workflow / Inventory / Event Operations / Audit / UX

## Objective

Turn every event Purchase into immediate sorting work so a handler can select several newly acquired exact cards, set their intended Case Sale prices, and add them to the active event Display Case in one action.

## Background

`PHR-WORKFLOW-008` already converts finalized exact, sealed, and Bulk receipt lines into receipt-backed General Inventory lots. Event sellers nevertheless need a dedicated operational queue for cards that can be inspected, priced, and placed into the physical display case during the same event.

## Problem Statement

Purchased cards currently enter General Inventory but do not surface as actionable show-floor work. A handler would need to find the receipt or lot again, manually copy its identity, and separately create display stock, creating delay, duplicate quantities, and weak provenance.

## Proposed Solution

Derive the Event Flip queue from receipt-backed General Inventory and manual Purchase ledger evidence for the selected event. Exact `SINGLE` lots are actionable. Their available-to-flip quantity is owned on-hand quantity minus active Display Case allocation. The handler can select up to 50 exact-card lots, choose a positive quantity for each, review or edit an intended Sale price, and add the batch to the Display Case through one idempotent transaction.

Exact sealed products and aggregate Bulk lots remain visible as General Inventory outcomes but cannot be represented as specific Case cards. Description-only manual Purchases remain visible as unitemized evidence. They require a separately approved itemization workflow before becoming eligible.

## Functional Requirements

- Every non-voided receipt from the current event appears in Event Flip immediately after checkout without another intake write.
- Exact `SINGLE` receipt lines expose card identity, printing, condition, quantity acquired, underlying on-hand quantity, already-cased quantity, available-to-flip quantity, unit cost, and source receipt.
- Exact `SEALED`, Bulk, and description-only manual Purchase evidence appears in a clearly separated non-actionable section with a truthful reason.
- A handler can select one to 50 exact-card lots, choose a positive whole-unit quantity no greater than available-to-flip, and provide a positive integer-cent Sale price for each.
- The Sale price defaults to the receipt's market-reference snapshot when one exists; missing evidence remains blank and must not be inferred from cost or recommended offer.
- One `Add selected to Display Case` action creates or updates the event Case item, appends allocation and price evidence, and returns the refreshed queue and Case summary.
- Vendor Workspace purchase checkout provides the same fast path before receipt finalization: each eligible exact single-card cart line can be marked `Send to Display Case` with a required positive intended Sale price. Case quantity defaults to one, remains editable up to the purchased line quantity, and leaves every unallocated copy available in General Inventory/Event Flip. Finalization creates the receipt, Inventory lot, and Case reservation atomically.
- A cart line left in General Inventory remains immediately available in Event Flip; the inline Vendor action does not replace the sorting queue.
- A retry-stable idempotency key prevents duplicate Case allocation from repeated submission.
- Adding to the Case reserves owned units but does not change receipt quantity, acquisition cost, or total owned on-hand quantity.
- Voided receipts and foreign-workspace/event lots fail closed.
- A receipt cannot be voided while units remain in the Case or while an unreconciled Case Sale depends on it.
- Only the active event accepts new Case allocation. Closed events remain reportable.

## Non-Functional Requirements

### Performance

The current-event queue uses indexed local receipt/inventory/case evidence and returns within 150 ms for 10,000 receipt-backed lots on supported hardware.

### Scalability

Queue state is derived rather than copied. Allocation batches and per-lot movements support later scanners, work assignments, grading holds, and additional storage lanes.

### Maintainability

The server repository owns eligibility, quantity, pricing, idempotency, and ownership checks. UI selection is presentation only.

### Reliability

Batch allocation and price evidence commit completely or roll back completely. Concurrent allocation uses the same immediate SQLite transaction as quantity validation.

### Accessibility

Rows use labelled checkboxes, quantity and price controls, visible selection state, keyboard operation, announced errors/status, and 44px actions.

### Offline Support

The queue and allocation are fully local after Purchase persistence and require no pricing or identity provider.

### Security

Reads require `INVENTORY:VIEW`; allocation requires `INVENTORY:OPERATE`; every lot, receipt, event, and batch is workspace-authorized in the repository.

### Extensibility

The queue can later accept itemized Bulk cards, barcode scans, handler assignment, grading lanes, and Binder allocation without changing receipt evidence.

### Responsiveness

Multi-select, quantity, Sale price, source evidence, blocked outcomes, and batch action remain usable at 390px without horizontal overflow.

## User Stories

- As a handler, I can see every newly purchased exact card without re-entering it.
- As a handler, I can price and case several cards in one action.
- As an owner, I can prove which receipt lot supplied every displayed unit.

## Acceptance Criteria

- Exact single-card checkout appears in Event Flip immediately and with the correct available quantity.
- Sealed, Bulk, manual, voided, foreign, oversubscribed, duplicate, and closed-event cases fail or present truthfully.
- Multi-select allocation, editable Sale prices, idempotency, and atomic rollback are deterministic and tested.
- Adding to Case changes reserved/general-available quantities without duplicating or decrementing total owned quantity.
- Full tests, TypeScript, lint, production build, diff hygiene, private runtime, desktop, and 390px review pass.

## Edge Cases

- A receipt line with quantity greater than one can be partially allocated; the remainder stays available in Event Flip.
- Re-adding the same lot updates its current Case price and appends more allocation only when available quantity remains.
- A missing market reference does not produce a suggested price.
- A later General Inventory disposition cannot consume reserved Case units.
- A general physical count below reserved Case quantity is rejected until the Case is reconciled.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-WORKFLOW-014` Display Case Inventory.
- `PHR-ARCH-011` module authorization.

## Future Enhancements

- Itemize Bulk cards into exact identities.
- Assign queue rows to handlers and measure sorting throughput.
- Barcode/QR intake and printable price labels.

## Technical Notes

Use receipt-backed `phronesis_inventory_lot` rows as the queue source. Do not create a copied queue table. Persist only idempotent Case allocation batches, item price history, and movements. Available-to-flip is underlying on-hand minus active Case expected quantity.

## UI / UX Notes

Lead with `Ready to flip`, `Already in Case`, and `Needs itemization / General only` summaries. Keep filters and selection sticky on desktop. Use stacked cards and a bottom batch action on phone. Never default a price from acquisition cost.

## Success Metrics

- Zero duplicate card entry between Purchase and Case.
- Zero over-allocation beyond owned quantity.
- One multi-card action from sorting decision to Case visibility.
- One purchase action from agreed buy price and Case price to receipt-backed Case visibility.

## Open Questions

- None blocking. Bulk itemization and Binder rules are separately deferred.

## Traceability

- Originating direction: Product Owner request on 2026-07-31 under `PHR-STRUCT-20260731-006`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-013-event-flip-queue-prompt.md`.
- Related implementation report: `docs/implementation-reports/PHR-WORKFLOW-013-event-flip-queue-report.md`.
- Related tests: `tests/display-case-control.test.ts`.
- Related validation: `docs/testing/PHR-WORKFLOW-013-event-flip-queue-validation.md`.
- Related conformance review: `docs/reviews/PHR-WORKFLOW-013-event-flip-queue-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-013.md`.
- Last modified: 2026-07-31.
- Modification reason: implementation, responsive verification, and conformance evidence completed for Product Review.
