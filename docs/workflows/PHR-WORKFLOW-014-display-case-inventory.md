# PHR-WORKFLOW-014 Display Case Inventory

## Feature ID

`PHR-WORKFLOW-014`

## Title

Event Display Case Inventory

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

Workflow / Database / Inventory / Event Operations / Audit / Reporting / UX

## Objective

Provide one authoritative panel for every card expected to be physically exposed in the active event Display Case, reduce it through linked Sales, and reconcile expected versus physically counted quantities at event close.

## Background

`PHR-WORKFLOW-012` provides prepared opening event stock from a Google Sheet. `PHR-WORKFLOW-013` adds newly purchased exact cards during the event. These sources must become one visible selling surface without duplicating General Inventory ownership or losing source provenance.

## Problem Statement

Phronesis currently has prepared event stock and receipt-backed General Inventory, but no dedicated Case control. New purchases cannot be reserved for physical display, the Sale picker cannot distinguish Case cards from imported opening stock, and an end-of-event operator cannot verify all exposed cards from one panel.

## Proposed Solution

Create an event-scoped Display Case allocation ledger over receipt-backed exact `SINGLE` lots. A Case item retains its underlying inventory lot and current intended Sale price. Append-only `ADD`, `REMOVE`, `SALE`, and `REVERSAL` movements derive the expected Case quantity. Case Sales atomically decrement both Case quantity and the underlying General Inventory on-hand quantity; reversal restores both when no later General Inventory count makes restoration ambiguous.

The Display Case panel presents two truthful sources together:

1. Prepared opening stock imported by `PHR-WORKFLOW-012`.
2. Event Flip cards allocated from receipt-backed General Inventory.

The sources remain distinct in storage and reporting. Their combined presentation is the operational answer to “what should be exposed in the Case now?”

## Functional Requirements

- Add `Event Flip`, `Display Case`, and renamed `General Inventory` destinations using the existing entitlement-filtered navigation source.
- Display Case loads the active event or latest closed event and shows prepared opening stock plus purchase-derived Case items.
- Purchase-derived items expose identity, condition, current Sale price, unit cost evidence, source receipt/lot, total added, sold, expected in Case, latest physical count, and variance.
- Prepared opening stock remains governed by its immutable import/movement/count contract and is labelled as a separate source.
- A handler may update an intended Case Sale price with append-only price evidence.
- An eligible Vendor Workspace purchase line may declare its intended Case Sale price and Case quantity before checkout. Case quantity defaults to one and cannot exceed purchased quantity. Receipt finalization, Inventory intake, partial/full Case allocation, and initial Case price evidence commit or roll back together.
- A handler may return unsold expected units from the Case to General Inventory with a reason; receipt and total owned quantity remain unchanged.
- The canonical Sale picker searches both prepared stock and purchase-derived Case items and visibly labels the source.
- A Sale item can link to at most one prepared-stock item or one Case item. The server owns canonical identity, price snapshot, and available quantity.
- A Case-linked Sale, underlying Inventory decrement, Event Ledger Sale, and Case movement commit in one immediate transaction.
- Whole-Sale actual amount remains on the Event Ledger. Current Case Sale price is stored as per-item list-price evidence and is never treated as allocated realized revenue.
- Reversal appends compensation and restores underlying on-hand quantity only when its recorded General Inventory count revision is still current.
- Manual/untracked Sales remain available but do not decrement Case quantity.
- General Inventory prevents disposition of Case-reserved units and exposes total on hand, reserved in Case, and available outside Case.
- Physical Case counts are append-only observations with a required reason and do not rewrite movement history.
- Combined verification summary/report exposes prepared and purchase-derived opening/added, sold, expected, counted, variance, and untracked Sale units.
- New allocation, price, return, and ordinary Sale actions require an active event. Counts and reports remain available after close.

## Non-Functional Requirements

### Performance

Case search returns the best 40 results within 100 ms for 10,000 active items on supported hardware. Summary and verification remain event-scoped and indexed.

### Scalability

Stable Case items plus append-only movement, price, count, and batch records support later multiple cases, zones, staff assignment, labels, and Binder allocation.

### Maintainability

Display Case persistence is server-only. Thin Route Handlers authorize and validate DTOs. Both Sale UIs reuse one merged Sale-options contract.

### Reliability

Allocation, Sale/decrement, reversal/restore, return, price, and count operations are idempotent or append-only and transactional. General and Case quantities cannot become negative.

### Accessibility

Source labels, search, prices, quantities, counts, return actions, and reports are keyboard-operable, explicitly named, announced, and at least 44px.

### Offline Support

All Case behavior is local and independent of Google, catalogue, or marketplace availability after source persistence.

### Security

Case panels require `INVENTORY:VIEW`; Case mutations require `INVENTORY:OPERATE`. Sale options and Sales retain the existing `VENDOR_WORKSPACE` authorization. Repository ownership checks apply independently.

### Extensibility

The allocation model can add Binder, grading, vault, and multiple physical Case lanes without changing acquisition or Event Ledger evidence.

### Responsiveness

Case summary, source sections, search, price/count/return controls, and report downloads remain complete at 390px without horizontal overflow.

## User Stories

- As a seller, I can search the exact card visible in the Case and reduce it through the same Sale I am recording.
- As a handler, I can see what should physically be in the Case and return a card to General Inventory.
- As an event manager, I can compare expected versus counted Case stock from both opening and same-day purchases.

## Acceptance Criteria

- Multi-card Event Flip allocation produces receipt-linked Case items with correct prices and quantities.
- Vendor Workspace checkout can route eligible exact single-card lines directly to Case only after a valid Case price is supplied, without a transient unreserved state.
- Both Sale surfaces search and decrement prepared and purchase-derived Case items atomically.
- Underlying General Inventory total, reserved, available, Sale decrement, and reversal remain mathematically consistent.
- Oversell, duplicate retry, receipt void, later-count reversal, cross-workspace, and closed-event actions fail safely.
- Combined Display Case verification and CSV report identify each source and preserve variance without inferred loss.
- Navigation, tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and 390px review pass.

## Edge Cases

- The same SKU bought on separate receipts remains separate lot provenance even when presentation groups it visually.
- A Case price may change without rewriting prior Sale-time price snapshots.
- Returning units cannot exceed expected unsold Case quantity.
- A Case Sale after a later General Inventory count cannot be reversed automatically.
- Prepared Sheet stock has no underlying General Inventory lot and must never fabricate one.
- A manual Sale resembling a Case item remains untracked unless the operator explicitly selects the Case result.

## Dependencies

- `PHR-WORKFLOW-008` through `PHR-WORKFLOW-010` General Inventory evidence.
- `PHR-WORKFLOW-012` Event Stock Control.
- `PHR-WORKFLOW-013` Event Flip Queue.
- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-UX-015` Vendor Workspace Quick Sale.

## Future Enhancements

- Multiple named physical cases or shelves.
- Printable price labels and scanner-assisted counts.
- Event-to-event carryover and explicit allocation to Binder Inventory.

## Technical Notes

Add event Case item, batch, movement, price, and count tables. Case items reference immutable receipt-backed Inventory lots. Add a nullable `event_case_item_id` to Event Sale rows. Sale/reversal coordination stays inside `PurchaseLedgerRepository` over the shared SQLite connection. General available quantity is on-hand minus expected Case allocation.

## UI / UX Notes

Lead with `Expected in Case`, `Sold from Case`, `Counted`, and `Variance`. Visually separate `Opening display stock` from `Event flips`, but use one Sale search. Keep reconciliation collapsed during live selling and prominent after event close.

## Success Metrics

- Zero duplicated owned units between General Inventory and Display Case.
- Zero Case-linked Sales that fail to decrement underlying owned quantity.
- One combined expected-versus-counted report for all visible Case sources.

## Open Questions

- None blocking. Binder rules and Bulk itemization remain deferred.

## Traceability

- Originating direction: Product Owner request on 2026-07-31 under `PHR-STRUCT-20260731-006`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-014-display-case-inventory-prompt.md`.
- Related implementation report: `docs/implementation-reports/PHR-WORKFLOW-014-display-case-inventory-report.md`.
- Related database design: `docs/database/PHR-WORKFLOW-014-display-case-schema.md`.
- Related tests: `tests/display-case-control.test.ts` and existing Event/Inventory suites.
- Related validation: `docs/testing/PHR-WORKFLOW-014-display-case-inventory-validation.md`.
- Related conformance review: `docs/reviews/PHR-WORKFLOW-014-display-case-inventory-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-014.md`.
- Last modified: 2026-07-31.
- Modification reason: implementation, responsive verification, and conformance evidence completed for Product Review.
