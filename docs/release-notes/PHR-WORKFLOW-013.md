# PHR-WORKFLOW-013 — Event Flip Queue

## 2026-07-31 — Product Review Ready

- Added a purchase-fed Event Flip panel that immediately derives sorting work from finalized event receipts and receipt-backed Inventory.
- Added multi-card selection, per-lot quantity, and editable intended Sale prices with one retry-safe Add-to-Case action.
- Added an inline Vendor Workspace `Send directly to Display Case` choice with Case quantity defaulting to one, editable up to purchased quantity, and a required Case Sale price before purchase finalization.
- Limited Case eligibility to exact single-card lots and kept sealed, Bulk, and manual Purchase outcomes visible with truthful General-only explanations.
- Preserved owned quantity on allocation while exposing on-hand, already reserved, and available-to-flip quantities.
- Added a responsive 390px workflow with full-width search, 44px controls, and an unobstructed empty state.
- Verified focused 6/6 and full 290/290 tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and phone presentation.
