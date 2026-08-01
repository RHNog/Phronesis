# PHR-UX-020 Editable Purchase Cart

## Feature ID

`PHR-UX-020`

## Title

Editable Vendor Purchase Cart

## Status

Implemented — Product Review Ready

## Priority

Critical

## Category

UX / UI / Workflow / Vendor Operations / Purchase Integrity

## Objective

Let a Vendor Workspace operator correct purchase value and quantity directly inside the open cart and remove an unwanted line before the immutable receipt is finalized.

## Background

Purchase intake already stores an employee-owned server cart and exposes line removal. Value and quantity corrections currently require removing and recreating the line, which slows event intake and increases re-entry risk.

## Proposed Solution

Render persistent inline numeric editors on every open cart line. Exact products edit unit purchase price and purchased quantity. Bulk edits total paid and its optional approximate count. Each line exposes an explicit `Save changes` action and a prominent `Remove item` action. Updates mutate only the employee-owned active-event cart payload; receipt, ledger, Inventory, and Display Case evidence remain unchanged until checkout.

## Functional Requirements

- Exact cart lines expose editable unit purchase price and quantity from 1 through 1000.
- Bulk cart lines expose editable total paid and an optional positive approximate count.
- Purchase value must remain a positive integer-cent value.
- Save updates the existing line identity rather than removing/recreating it.
- Remove deletes only the requesting operator's unsubmitted cart line and clears any pending direct-to-Case selection for that line.
- A reduced exact quantity clamps any pending Case quantity so it cannot exceed the purchase quantity.
- Cart subtotal refreshes from persisted values after a successful save.
- Checkout refuses to finalize while any visible cart editor has unsaved changes.
- Already-finalized receipts, purchase ledger entries, Inventory lots, and Case allocations remain immutable through this feature.

## Non-Functional Requirements

### Reliability

The server verifies active-event and workspace/operator ownership for every update and performs one atomic row update.

### Accessibility

Every numeric input has a persistent label, invalid state is announced through descriptive text, and Save/Remove controls meet the 44px touch target.

### Responsiveness

Editors form two columns when space permits and stack without horizontal overflow at 390px.

### Security

Client input cannot change identity, condition, recommendation, market evidence, event, workspace, or operator ownership.

## Acceptance Criteria

- An exact cart line can change unit value and quantity, persist after reload, and produce the corrected subtotal and receipt total.
- A Bulk line can change total value and optional approximate count without changing product-line or note evidence.
- Invalid or foreign cart mutations fail closed.
- `Remove item` is visible on every line and the removed line does not appear after reload.
- Pending Case quantity remains within an edited exact purchase quantity.
- Existing checkout, receipt, ledger, Inventory, Display Case, desktop, and phone gates pass.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-WORKFLOW-013` Event Flip Queue.
- `PHR-WORKFLOW-014` Display Case Inventory.
- `PHR-UX-018` Adjacent Search And Checkout Workspace.

## Non-Goals

- Editing submitted receipts, splitting/merging lines, changing card identity or condition, editing notes/product lines, price allocation, payment processing, or post-checkout corrections.

## Traceability

- Originating request: Product Owner cart-editing direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-UX-020-editable-purchase-cart-prompt.md`.
- Related tests: `tests/card-show-operations.test.ts` and `tests/snapshot-vendor-workspace.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-020.md`.
- Last modified: 2026-08-01.
- Modification reason: Implementation and live responsive verification evidence recorded.
