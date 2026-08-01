# PHR-WORKFLOW-013 Engineer Report — Event Flip Queue

Date: 2026-07-31

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Added an event-scoped Event Flip workspace derived directly from finalized Purchase receipts and receipt-backed Inventory lots; no copied queue table or duplicate ownership was introduced.
- Made exact `SINGLE` lots actionable with selection, quantity, and editable positive intended Sale price controls for batches of up to 50 lots.
- Kept exact sealed products, aggregate Bulk lots, and description-only manual Purchases visible as truthful General-only outcomes with their blocking reason.
- Calculated flip availability as underlying on-hand quantity minus active Display Case reservation.
- Added retry-stable batch allocation with request-fingerprint validation, atomic rollback, source receipt/lot provenance, and append-only allocation/price evidence.
- Added a Vendor Workspace fast path that lets a buyer enter purchased quantity, mark an eligible cart line for Case, keep Case quantity defaulted to one but editable through purchased quantity, enter the required intended Sale price, and finalize the receipt, Inventory lot, and Case reservation in one transaction. Unallocated copies remain available in Event Flip.
- Added responsive navigation and presentation for `/event-flip`, including a phone-width full-row search and a batch bar that becomes sticky only after a selection exists.

## Evidence

Focused Event Flip/Display Case tests pass 6/6 and the complete behavioral suite passes 290/290. Standalone TypeScript, warning-free lint, Next.js production build, diff hygiene, private-service health, desktop review, and 390 × 844 review pass. Phone controls measure 44–48px, horizontal overflow is zero, and the browser console is clean. See `docs/testing/PHR-WORKFLOW-013-event-flip-queue-validation.md`.

## Boundaries

This increment does not itemize Bulk, infer price from cost, automate repricing, call a provider, create a Binder workflow, process payment, publish publicly, create an external transaction, commit, or push.
