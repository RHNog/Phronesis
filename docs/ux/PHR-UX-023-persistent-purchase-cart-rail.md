# PHR-UX-023 — Persistent Purchase Cart Rail

## Status
Implemented — Product Review Ready

## Objective
Keep the active purchase visible while buyers repeat search, evidence review, price entry, and intake.

## Solution
The Event station uses a persistent two-column desktop composition: selected-product/Bulk intake on the left and the recommended offer plus editable Purchase Cart on the right. The cart rail is sticky within the viewport. A successful exact intake reloads the canonical server cart and moves focus-adjacent visibility to the rail; no local shadow cart is created. Narrow screens retain intake-before-cart stacking.

## Acceptance Criteria
- Every successful intake appears directly in the right cart rail.
- Value, quantity, removal, Case routing, payment, and finalization remain in the canonical cart.
- The rail stays visible during ordinary desktop workspace scrolling and never overlays evidence.
- Phone layout has no horizontal overflow.

## Traceability
- Prompt: `docs/prompts/PHR-UX-023-persistent-purchase-cart-rail-prompt.md`
- Implementation: `features/vendor/components/VendorCheckout.tsx`, `features/vendor/components/SnapshotVendorWorkspace.tsx`
- Last modified: 2026-08-01
