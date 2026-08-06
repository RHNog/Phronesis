# PHR-WORKFLOW-012 Event Stock Schema

## Scope

Additive local SQLite evidence for an event-specific sellable-stock manifest, quantity movements, and physical counts.

## Tables

### `phronesis_event_stock_import`

- `id` text primary key.
- `workspace_id`, `event_id` ownership.
- `source_name`, `source_hash`, `contract_version` provenance.
- `row_count`, `total_quantity` validated totals.
- `status` is `ACTIVE` or `SUPERSEDED`.
- `imported_by_user_id`, `imported_at` audit.
- Unique event/hash idempotency.
- Partial unique index permits one active import per event.

### `phronesis_event_stock_item`

- `id` text primary key.
- `workspace_id`, `event_id`, `import_id`, `source_row` provenance.
- `name`, `unit_price_cents`, `opening_quantity`, `color`, `variation` canonical imported evidence.
- `normalized_search` bounded local discovery text.
- Unique import/source row and unique normalized option identity per import.

### `phronesis_event_stock_movement`

- `id` text primary key.
- `workspace_id`, `event_id`, `stock_item_id` ownership.
- `ledger_entry_id`, `sale_item_position` linkage.
- `movement_type` is `SALE` or `REVERSAL`.
- `quantity_delta` is signed and non-zero; Sales are negative, reversals positive.
- `actor_user_id`, `created_at` audit.
- Unique ledger entry/item/position prevents duplicate application.

### `phronesis_event_stock_count`

- `id` text primary key.
- `workspace_id`, `event_id`, `stock_item_id` ownership.
- `counted_quantity` non-negative observed quantity.
- `reason`, `actor_user_id`, `created_at` audit.
- Latest observation is selected by timestamp and identifier; history remains append-only.

### `phronesis_event_sale_item` additive column

- `event_stock_item_id` nullable reference-like identifier.
- `unit_list_price_cents`, `color`, and `variation` nullable Sale-time snapshots.
- Legacy and manual Sale rows remain valid with all new columns null.

## Derived Rules

- Expected remaining = opening quantity + sum of all stock movements.
- Sold quantity = absolute sum of active Sale movements after compensating reversals.
- Latest count variance = counted quantity − expected remaining.
- Whole-Sale actual amount remains on `phronesis_event_ledger_entry`; per-item list price is not allocated actual revenue.

## Migration And Recovery

- All tables and Sale-item columns are additive through `CREATE TABLE IF NOT EXISTS` and column guards.
- Existing events and Sales read unchanged.
- No existing table is rebuilt and no historical value is backfilled or inferred.
- A failed import, Sale, reversal, or count transaction rolls back completely.
