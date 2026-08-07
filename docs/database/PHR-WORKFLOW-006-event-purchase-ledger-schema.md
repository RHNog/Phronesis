# PHR-WORKFLOW-006 — Event Cash Ledger Schema

## Revision

2026-08-07 additive private purchase-evidence revision of the existing Event Purchase Ledger.

## Existing Tables Preserved

- `phronesis_purchase_event`
- `phronesis_purchase_cart_line`
- `phronesis_purchase_receipt`
- `phronesis_purchase_receipt_line`
- `phronesis_purchase_audit`

No receipt, cart, Inventory, or audit row is removed or rewritten by migration.

## Purchase Photo Metadata

No schema migration is required. An exact or Bulk cart-line JSON payload may contain one bounded `evidenceImage` metadata object with an opaque UUID, validated raster media type, byte size, SHA-256 digest, and creation timestamp. Checkout copies the complete line payload into its immutable receipt-line payload before deleting the cart row.

Image bytes live in a private application-owned object directory outside the public asset tree and database. `PHRONESIS_PURCHASE_EVIDENCE_PATH` may select the directory; otherwise it is a sibling of the authentication database. Files are never addressed by a client filename or filesystem path.

Authorized retrieval requires that the opaque object ID remains referenced by either a workspace-owned active cart line or a workspace-owned immutable receipt line. Removing or clearing a draft retires the unsubmitted object; checkout deliberately retains receipt evidence.

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
- nullable `product_owner_id`, where null means house inventory and a value must resolve to the same event/workspace's immutable product-owner roster.

These rows intentionally contain no catalogue SKU, Inventory lot, cost basis, or disposition reference.

## Event Product Owners

`phronesis_event_product_owner` stores the optional roster declared atomically before event opening:

- immutable owner ID, workspace ID, and event ID;
- normalized display name and optional short operator reference;
- stable roster position and creation timestamp;
- case-insensitive unique name within one event.

The table does not represent authentication membership, Inventory title, customer identity, a payable account, or a settlement. There is no post-opening roster mutation endpoint. Legacy events have an empty roster, and legacy/null sold-item references mean house inventory.

## Transaction Rules

- Manual Sale/Purchase/Adjustment creation and its item rows commit together.
- Event creation and its validated product-owner roster commit together.
- A sold-item owner reference is accepted only after the repository verifies the active event, workspace, and exact roster row inside the write transaction.
- Purchase receipt, receipt lines, Inventory intake, and linked ledger Purchase commit together.
- Clearing a cart deletes all and only the requesting operator's active-event draft lines in one transaction and records the bounded line count in purchase audit evidence. Private draft image retirement follows the committed database mutation on a best-effort, path-bounded basis.
- Receipt void, Inventory deactivation, and linked cash reversal commit together.
- Closing records actual cash, expected cash, and variance only after calculating the current event snapshot inside the same serialized write boundary. Later administrative receipt corrections do not rewrite that close snapshot.
- Reads and writes are workspace-scoped; mutations require `VENDOR_WORKSPACE:OPERATE`.

## Derived Values

- `expected_cash = opening_cash + active cash Sale amounts - active cash Purchase amounts + active cash adjustments`
- `closing_variance = closing_cash - expected_cash`
- `net_event_cash_movement = all active Sale amounts - all active Purchase amounts`

`net_event_cash_movement` is not profit, revenue recognition, settlement, or accounting income.
