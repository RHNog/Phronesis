# PHR-UX-019 Compact Checkout Offer

## Feature ID

`PHR-UX-019`

## Title

Expandable Recommended Offer Above The Cart

## Status

Implemented — Product Review Ready

## Priority

Critical

## Category

UX / UI / Vendor Operations / Buying Decision

## Objective

Keep the recommended offer in the buyer's cart-composition sightline without occupying a large permanent panel.

## Problem Statement

The current offer ladder lives in the lower Buying decision panel, away from the adjacent checkout. It consumes substantial vertical space and requires the operator to scan between analytical and transactional bands.

## Proposed Solution

Render one native expandable offer tile immediately above Current purchase inside the Event station. Its collapsed summary shows the recommended offer and a small `TCG Low` / `TCG Market` footnote. Expansion reveals opening, target, and walk-away values. Remove the duplicate large offer summary from Buying decision while retaining profile, strategy, asking-price comparison, Regional evidence, and evaluation behavior.

## Functional Requirements

- The collapsed tile always exposes the recommended offer when evaluation is ready.
- The footnote labels listing price as `TCG Low` and market price as `TCG Market`; missing fields show `Unavailable`.
- Expansion reveals opening, target, and walk-away values from the existing negotiation ladder.
- The tile appears directly above the cart, uses no new calculation, and does not alter the actual-price default.
- The tile is absent when no ready offer exists.

## Non-Functional Requirements

### Accessibility

Use native `details` / `summary`, visible keyboard focus, semantic labels, and a minimum 44px summary target.

### Responsiveness

Footnotes wrap safely at 390px and the expanded ladder does not widen the Event station.

### Reliability

The existing purchase-evaluation result remains the single source of truth.

## Acceptance Criteria

- The recommended offer tile precedes Current purchase in DOM and visual order.
- Collapsed content contains the suggested offer, TCG Low, and TCG Market.
- Expanded content contains opening, target, and walk-away values.
- The previous large offer summary is not duplicated in Buying decision.
- Existing checkout, evaluation, desktop, and phone gates pass.

## Dependencies

- `PHR-UX-018` Adjacent Search And Checkout Workspace.
- Existing `PurchaseEvaluation` and `VendorCheckout`.

## Traceability

- Originating request: Product Owner Vendor Workspace release direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-UX-019-compact-checkout-offer-prompt.md`.
- Related tests: `tests/snapshot-vendor-workspace.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-019.md`.
- Last modified: 2026-08-01.
- Modification reason: Implementation and responsive browser evidence recorded.
