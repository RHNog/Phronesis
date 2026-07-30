# PHR-WORKFLOW-006 — Event Purchase Ledger Schema

Date: 2026-07-30

The ignored Phronesis application database owns `purchase_events`, `purchase_cart_lines`, `purchase_receipts`, `purchase_receipt_lines`, and `purchase_audit_events`.

- Event and cart rows are scoped by workspace and operator.
- Exact lines retain catalogue category/SKU plus decision-time market and offer evidence.
- Bulk lines retain one or more supported product lines, total paid, notes, and optional approximate quantity.
- Checkout copies cart lines into immutable receipt lines in one transaction and uses an idempotency key.
- Voids append an audit event and a void marker; receipt line facts are not silently rewritten.
- `VENDOR_WORKSPACE:OPERATE` owns event/cart/own checkout operations. `ADMINISTRATION:ADMIN` owns void operations.

This schema does not create inventory, payments, accounting exports, seller records, or marketplace transactions.
