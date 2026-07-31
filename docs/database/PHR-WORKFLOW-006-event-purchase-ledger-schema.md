# PHR-WORKFLOW-006 — Event Cash Ledger Schema

## Revision

2026-07-31 additive revision of the existing Event Purchase Ledger.

## Existing Tables Preserved

- `phronesis_purchase_event`
- `phronesis_purchase_cart_line`
- `phronesis_purchase_receipt`
- `phronesis_purchase_receipt_line`
- `phronesis_purchase_audit`

No receipt, cart, Inventory, or audit row is removed or rewritten by migration.

## Event Additions

`phronesis_purchase_event` gains nullable/additive fields:

- `currency`: `USD` or `BRL`; new events require it.
- `opening_cash_cents`: declared opening drawer amount; new events require it.
- `closed_at`, `closing_cash_cents`, `closing_expected_cash_cents`, `closing_variance_cents`, and `closed_by_user_id`: immutable closing evidence captured at the close boundary.

Legacy event rows may retain null opening/currency evidence and must not be used to fabricate a drawer balance.

## Event Ledger Entries

`phronesis_event_ledger_entry` owns:

- workspace, event, operator, and idempotency identity;
- entry type: `SALE`, `PURCHASE`, `CASH_ADJUSTMENT`, or `REVERSAL`;
- payment method: `CASH`, `CARD`, `TRANSFER`, or `OTHER`;
- positive transaction amount and explicit signed `cash_effect_cents`;
- optional description/note and linked purchase receipt;
- optional reversal reference to exactly one original entry;
- immutable creation timestamp.

Unique constraints prevent duplicate operator/idempotency writes, duplicate receipt linkage, and multiple reversals of one entry.

## Sold Items

`phronesis_event_sale_item` stores ordered immutable Sale children:

- ledger entry ID and position;
- required human-entered item description;
- positive whole-number quantity.

These rows intentionally contain no catalogue SKU, Inventory lot, cost basis, or disposition reference.

## Transaction Rules

- Manual Sale/Purchase/Adjustment creation and its item rows commit together.
- Purchase receipt, receipt lines, Inventory intake, and linked ledger Purchase commit together.
- Receipt void, Inventory deactivation, and linked cash reversal commit together.
- Closing records actual cash, expected cash, and variance only after calculating the current event snapshot inside the same serialized write boundary. Later administrative receipt corrections do not rewrite that close snapshot.
- Reads and writes are workspace-scoped; mutations require `VENDOR_WORKSPACE:OPERATE`.

## Derived Values

- `expected_cash = opening_cash + active cash Sale amounts - active cash Purchase amounts + active cash adjustments`
- `closing_variance = closing_cash - expected_cash`
- `net_event_cash_movement = all active Sale amounts - all active Purchase amounts`

`net_event_cash_movement` is not profit, revenue recognition, settlement, or accounting income.
