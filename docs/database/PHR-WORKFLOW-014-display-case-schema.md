# PHR-WORKFLOW-014 Display Case Schema

Implementation status: **Implemented — Product Review Pending**

## Scope

Additive local SQLite evidence for receipt-backed Case allocation, Sale/return movements, intended prices, physical counts, and atomic linkage to Event Ledger Sales.

## Tables

### `phronesis_event_case_batch`

- `id`, `workspace_id`, `event_id`, `actor_user_id`, `idempotency_key`, request fingerprint, and `created_at`.
- Unique workspace/actor/idempotency key prevents duplicate multi-card allocation.

### `phronesis_event_case_item`

- `id`, `workspace_id`, `event_id`, `inventory_lot_id` ownership/provenance.
- Canonical identity snapshot: category, SKU, name, set, collector, variant, language, condition.
- `current_sale_price_cents` is the current intended Case price, not realized revenue.
- `normalized_search`, creator, creation, and update timestamps.
- One Case item per event/inventory lot preserves lot-level acquisition provenance.

### `phronesis_event_case_movement`

- `id`, ownership, Case item, Inventory lot, optional batch, optional Event Ledger entry, and Sale-item position.
- `movement_type` is `ADD`, `REMOVE`, `SALE`, or `REVERSAL`.
- `quantity_delta` is signed and non-zero.
- Sale movements record the underlying Inventory count revision and Case price snapshot.
- Quantity-changing handler returns carry a retry-stable idempotency key.
- Unique batch/position and ledger-entry/item/position constraints enforce idempotency.

### `phronesis_event_case_price`

- Append-only Case item price, actor, reason/source, and timestamp.
- Current price is materialized on the Case item; history remains authoritative evidence.

### `phronesis_event_case_count`

- Append-only non-negative observed quantity, reason, actor, and timestamp.
- Latest observation produces variance without rewriting movements.

### `phronesis_event_sale_item` additive column

- `event_case_item_id` is nullable and mutually exclusive with `event_stock_item_id` for a tracked Sale row.
- Case sale price remains in `unit_list_price_cents`; whole-Sale actual amount remains on the ledger entry.

## Derived Rules

- Expected Case quantity = sum of ADD + REMOVE + SALE + REVERSAL deltas.
- Available to flip = underlying Inventory on-hand − expected Case quantity.
- General available quantity = the same available-to-flip value.
- Case sold quantity = absolute active net SALE/REVERSAL delta.
- Count variance = latest Case physical count − expected Case quantity.

## Atomic Rules

- Case allocation validates and appends movements inside one immediate transaction.
- Vendor direct-to-Case checkout uses the receipt idempotency boundary and a receipt-derived Case batch key; the Inventory lot is resolved only after receipt-backed intake inside the same outer transaction.
- A Case Sale appends the Event Ledger row and Sale items, appends Case movement, and decrements underlying Inventory current quantity in one transaction.
- Reversal checks the recorded Inventory count revision, appends compensation, and restores underlying Inventory in one transaction.
- Prepared Google-Sheet stock remains in the existing `phronesis_event_stock_*` tables and has no fabricated Inventory lot.

## Migration And Recovery

- All tables and the Sale-item column are additive.
- Existing General Inventory, prepared Event Stock, and manual Sales remain readable unchanged.
- If a transaction fails, neither Case nor underlying Inventory quantity is partially changed.
