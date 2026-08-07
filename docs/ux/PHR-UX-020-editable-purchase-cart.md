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

Let a Vendor Workspace operator correct purchase value and quantity directly inside the open cart, remove an unwanted line, clear the full owned draft, and attach private photographic evidence before the immutable receipt is finalized.

## Background

Purchase intake already stores an employee-owned server cart and exposes line removal. Value and quantity corrections currently require removing and recreating the line, which slows event intake and increases re-entry risk.

## Proposed Solution

Render persistent inline numeric editors on every open cart line. Exact products edit unit purchase price and purchased quantity. Bulk edits total paid and its optional approximate count. Each line exposes an explicit `Save changes` action, a prominent `Remove item` action, and one optional private purchase photo. The cart exposes a guarded `Clear cart` action. Draft mutations remain limited to the employee-owned active-event cart; checkout copies attached photo metadata into the immutable receipt line while ledger, Inventory, and Display Case calculations remain unchanged.

## Functional Requirements

- Exact cart lines expose editable unit purchase price and quantity from 1 through 1000.
- Bulk cart lines expose editable total paid and an optional positive approximate count.
- Purchase value must remain a positive integer-cent value.
- Save updates the existing line identity rather than removing/recreating it.
- Remove deletes only the requesting operator's unsubmitted cart line and clears any pending direct-to-Case selection for that line.
- `Clear cart` requires an inline confirmation that names the number of saved lines. Confirmation deletes every unsubmitted line owned by the requesting operator in the exact active event, clears local Case selections and unsaved-editor state, and never changes another operator's cart or a finalized receipt.
- A reduced exact quantity clamps any pending Case quantity so it cannot exceed the purchase quantity.
- Cart subtotal refreshes from persisted values after a successful save.
- Checkout refuses to finalize while any visible cart editor has unsaved changes.
- Each exact or Bulk cart line accepts at most one JPEG, PNG, WebP, GIF, or AVIF image no larger than 8 MB. File content must match its declared raster media type; SVG, HTML, empty, oversized, and malformed payloads fail closed.
- An upload is authorized against the requesting operator's exact active-event cart line. Replacing a photo atomically changes the line reference and retires the prior draft object; removing a photo changes only the draft line.
- Cart responses expose bounded photo metadata and an authorized private image URL, never a filesystem path.
- Checkout preserves the photo reference inside the immutable receipt-line payload. Clearing or removing an unsubmitted line retires its draft photo; finalization does not delete receipt evidence.
- Photo retrieval requires authorized Vendor Workspace access and a workspace-owned cart or receipt reference. It is not public, cache-shared, or usable as catalogue artwork.
- Already-finalized receipts, purchase ledger entries, Inventory lots, and Case allocations remain immutable through this feature.

## Non-Functional Requirements

### Reliability

The server verifies active-event and workspace/operator ownership for every update. Cart clearing is one database transaction. Photo bytes use a private application-owned object store with signature, size, digest, and identifier validation; the authoritative line reference is updated only after a valid object is durably written.

### Accessibility

Every numeric and file input has a persistent label, invalid or upload state is announced through descriptive text, the image has useful alternative text, and Save, Remove, Clear, upload, and confirmation controls meet the 44px touch target.

### Responsiveness

Editors form two columns when space permits. Photo preview and clear confirmation remain within the cart rail and stack without horizontal overflow at 390px.

### Security

Client input cannot change identity, condition, recommendation, market evidence, event, workspace, or operator ownership. Photo GET/POST/DELETE endpoints reauthorize every request and never trust a client-supplied filesystem path or receipt association.

## Acceptance Criteria

- An exact cart line can change unit value and quantity, persist after reload, and produce the corrected subtotal and receipt total.
- A Bulk line can change total value and optional approximate count without changing product-line or note evidence.
- Invalid or foreign cart mutations fail closed.
- `Remove item` is visible on every line and the removed line does not appear after reload.
- `Clear cart` removes all and only the requesting operator's saved active-event lines after explicit confirmation, leaves finalized receipts intact, and returns an empty persisted cart after reload.
- A valid phone-camera or file-picker image can be attached, previewed, replaced, and removed from an owned line; invalid, oversized, foreign-line, and foreign-workspace requests fail closed.
- A finalized receipt retains its attached photo and authorized retrieval while the source cart is empty.
- Pending Case quantity remains within an edited exact purchase quantity.
- Existing checkout, receipt, ledger, Inventory, Display Case, desktop, and phone gates pass.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-WORKFLOW-013` Event Flip Queue.
- `PHR-WORKFLOW-014` Display Case Inventory.
- `PHR-UX-018` Adjacent Search And Checkout Workspace.

## Non-Goals

- Editing submitted receipts, multiple photos per line, image annotation, OCR, automatic bulk identification, public sharing, catalogue-artwork replacement, splitting/merging lines, changing card identity or condition, editing notes/product lines, price allocation, payment processing, or post-checkout corrections.

## Traceability

- Originating request: Product Owner cart-editing direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-UX-020-editable-purchase-cart-prompt.md`.
- Related tests: `tests/card-show-operations.test.ts` and `tests/snapshot-vendor-workspace.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-020.md`.
- Last modified: 2026-08-07.
- Modification reason: Add operator-scoped Clear Cart and one durable private purchase-evidence photo per cart line, with Bulk intake as the primary use case.
