# PHR-UX-020 — Editable Purchase Cart

## 2026-08-07 — Clear Cart And Purchase Photos

- Event buyers can clear every item in their own unsubmitted active-event cart after a count-specific confirmation. Other operators and finalized receipts are not changed.
- Each exact or Bulk purchase line can retain one private phone-camera/file image, with preview, replace, and remove controls. Bulk collection evidence is the primary use case.
- Valid JPEG, PNG, WebP, GIF, and AVIF files are limited to 8 MB, content-validated, integrity-recorded, and served only after Vendor Workspace authorization.
- Draft deletion retires its image. Checkout retains the image reference inside the immutable receipt line for authorized later evidence review.
- Verification passes 19/19 focused and 472/472 full tests plus TypeScript, warning-free lint, production build, private runtime health, and 390×844 interaction/accessibility gates.

## 2026-08-01 — Product Review Ready

- Exact purchase lines now edit unit value and quantity directly inside the cart.
- Bulk lines now edit total paid and optional approximate count.
- Every cart item exposes explicit Save changes and Remove item actions.
- Unsaved edits block finalization, and reducing purchase quantity safely clamps pending Display Case quantity.
- Submitted receipts and downstream ledger/Inventory/Case evidence remain immutable.
- Verification passes 315/315 tests plus TypeScript, warning-free lint, production build, and live desktop/phone interaction gates.
