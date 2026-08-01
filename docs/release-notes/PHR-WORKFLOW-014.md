# PHR-WORKFLOW-014 — Display Case Inventory

## 2026-07-31 — Product Review Ready

- Added receipt-linked Display Case allocation, price, return, Sale, reversal, and physical-count evidence without duplicating General Inventory ownership.
- Added one source-labelled Display Case view for prepared opening stock and event-flip cards.
- Added one Sale search used by Event Ledger and Vendor Workspace, with atomic Case and underlying Inventory reduction for explicitly selected Case cards.
- Added General Inventory reserved/available quantities and guards against dispositions, counts, or receipt voids that would invalidate Case evidence.
- Added atomic receipt-to-Case placement from Vendor Workspace with a one-unit default, purchased-quantity ceiling, and explicit Case price evidence recorded before checkout.
- Added combined expected/count/variance verification and CSV reporting while preserving whole-Sale amount separately from Case list price.
- Reserved `PHR-WORKFLOW-015` for future Binder Inventory without adding a premature route, schema, or control.
- Verified focused 6/6 and full 290/290 tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and phone presentation.
