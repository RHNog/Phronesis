# Implementation Prompt — PHR-UX-019 Compact Checkout Offer

## Feature ID

`PHR-UX-019`

## Objective

Move the ready recommended-offer summary above the current cart as a compact native expandable tile with TCG Low and TCG Market footnotes.

## Required Reading

- `docs/ux/PHR-UX-019-compact-checkout-offer.md`
- `docs/ux/PHR-UX-018-adjacent-search-checkout-workspace.md`
- `features/vendor/components/SnapshotVendorWorkspace.tsx`
- `features/vendor/components/VendorCheckout.tsx`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

## Constraints

- Reuse the existing evaluation. Do not alter calculation, cart, API, database, authorization, or event behavior.

## Testing Expectations

- Assert tile placement, collapsed values, expanded ladder, no duplicate summary, responsive containment, and existing workflow regressions.

## Acceptance Criteria

- Every criterion in the specification passes.
