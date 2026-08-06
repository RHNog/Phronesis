# PHR-WORKFLOW-014 Engineer Report — Display Case Inventory

Date: 2026-07-31

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Added additive SQLite Case batches, stable Case items, append-only `ADD`/`REMOVE`/`SALE`/`REVERSAL` movements, price history, physical counts, and nullable Event Sale linkage.
- Added one Display Case panel that presents prepared opening stock and purchase-derived Event Flip cards together while preserving separate storage and source labels.
- Added one merged Event Sale-options contract reused by Event Ledger and Vendor Workspace Quick Sale.
- Made Case-linked Sale, underlying General Inventory decrement, Event Ledger write, and Case movement one immediate transaction; reasoned reversal restores both only when later General count evidence has not made restoration ambiguous.
- Added idempotent Return to General, price editing, append-only physical counts, source-aware summaries, and combined Case verification CSV output.
- Added direct Vendor checkout placement with Case quantity defaulting to one, a purchased-quantity ceiling, a required handler-entered Case Sale price, and `VENDOR_CHECKOUT` price provenance inside the receipt transaction.
- Exposed total owned, reserved in Case, and generally available quantities in General Inventory, and rejected dispositions, counts, or receipt voids that would violate an active Case reservation or Sale dependency.
- Renamed the existing Inventory presentation to General Inventory and added Event Flip and Display Case to the shared entitlement-filtered navigation.

## Evidence

Focused Display Case controls pass 6/6 and the complete behavioral suite passes 290/290. Standalone TypeScript, warning-free lint, Next.js production build, diff hygiene, private-service health, desktop review, and 390 × 844 review pass. Both new panels avoid horizontal overflow and keep required actions at least 44px. See `docs/testing/PHR-WORKFLOW-014-display-case-inventory-validation.md`.

## Boundaries

Prepared Sheet stock remains separate from receipt-backed ownership. Case price is intended/list evidence; actual whole-Sale amount remains Event Ledger evidence and is not allocated across items. Manual/untracked Sales do not decrement Case. Binder Inventory, Bulk itemization, settlement, accounting, marketplace publication, public deployment, commit, and push remain outside this increment.
