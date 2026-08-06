# PHR-UX-020 — Editable Purchase Cart

## 2026-08-01 — Product Review Ready

- Exact purchase lines now edit unit value and quantity directly inside the cart.
- Bulk lines now edit total paid and optional approximate count.
- Every cart item exposes explicit Save changes and Remove item actions.
- Unsaved edits block finalization, and reducing purchase quantity safely clamps pending Display Case quantity.
- Submitted receipts and downstream ledger/Inventory/Case evidence remain immutable.
- Verification passes 315/315 tests plus TypeScript, warning-free lint, production build, and live desktop/phone interaction gates.
