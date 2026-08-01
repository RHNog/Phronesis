# PHR-UX-018 Adjacent Search And Checkout Workspace

## Feature ID

`PHR-UX-018`

## Title

Adjacent Catalogue Search And Event Checkout

## Status

Implemented — Product Review Ready

## Priority

Critical

## Category

UX / UI / Vendor Operations / Checkout / Responsive Layout

## Objective

Make rapid event purchasing the primary Vendor Workspace composition by placing catalogue results and the Event checkout/cart side by side on desktop, so operators can select a card, enter the agreed price, and build the cart without scanning to a distant section.

## Background

Vendor Workspace currently presents catalogue results, Snapshot evidence, and Buying decision in a three-column row, then places Event checkout below the entire row. The checkout is functionally complete, but its distance from the selected result slows repeated price entry and cart composition during live buying.

## Problem Statement

After selecting a search result, the operator must move down the page to reach actual price, quantity, Add, current-cart, and Finalize controls. Repeating that movement for multiple cards creates avoidable event friction and weakens the spatial connection between the selected catalogue item and the cart being composed.

## Proposed Solution

Recompose Vendor Workspace into two responsive bands. The primary operational band places Catalogue results beside the existing Event station. The secondary analytical band places Snapshot evidence beside Buying decision. Preserve the single search field above both bands and preserve the existing component state, APIs, transaction behavior, and exact selection flow.

On narrow screens, retain one linear order: search, results, Event station, Snapshot evidence, then Buying decision. Inside the Event station, use one internal purchase column until the outer workspace provides enough width; only use its two-column selected-product/cart composition at the widest breakpoint.

## Functional Requirements

- At desktop widths, Catalogue results and Event station render in the same grid row.
- Event station remains the existing Purchase intake/Quick sale component and retains the current active event, draft cart, payment, Case routing, and finalize behavior.
- Selecting a catalogue result immediately updates the adjacent selected-product price composer.
- Actual agreed price, quantity, Add selected product, Current purchase total, cart lines, payment method, and Finalize remain present.
- Snapshot evidence and Buying decision move into a distinct second desktop row without losing any control or calculation.
- Catalogue keyboard navigation, artwork preview, TCGplayer verification, price tracking, Quick Sale, Bulk entry, and Display Case routing remain unchanged.
- At narrow widths the semantic order is results → checkout → evidence → decision.
- No duplicate VendorCheckout instance, cart state, or API request may be introduced.

## Non-Functional Requirements

### Performance

The change is layout-only and must add no fetch, render loop, provider request, or database operation.

### Scalability

The primary grid must tolerate longer result names, populated carts, and both event-station modes without fixed pixel overflow.

### Maintainability

Keep `VendorCheckout` as the single event-station owner. Layout ownership remains in `SnapshotVendorWorkspace`; business logic does not move.

### Reliability

Recomposition must preserve mounted component state while search selection changes. Cart drafts must not reset because of layout structure.

### Accessibility

DOM order must match the intended mobile reading order. Headings and existing labels remain intact; no visual-only order utility may diverge from keyboard order.

### Offline Support

Unchanged from existing Vendor Workspace and Event station behavior.

### Security

Authorization and server-side mutation boundaries remain unchanged.

### Extensibility

The two-band composition may later support a compact evidence drawer, but this increment does not hide or collapse analytical content.

### Responsiveness

Desktop uses adjacent results/checkout and adjacent evidence/decision. Phone uses a single column with no horizontal overflow and minimum 44px controls.

## User Stories

- As an event buyer, I want the cart next to search results so I can price and add multiple cards rapidly.
- As an event manager, I want the existing exact receipt, Inventory, Display Case, and ledger behavior preserved while the operator workflow becomes faster.

## Acceptance Criteria

- At desktop width, the Catalogue results and Event station bounding boxes overlap vertically and occupy distinct adjacent columns.
- Selecting a result makes its product name and recommended/default price available in the adjacent composer without scrolling to another page band.
- A multi-line cart can be composed and finalized through the same API and component as before.
- Snapshot evidence and Buying decision remain fully available below the primary buying band.
- At 390px, results precede Event station, which precedes Snapshot evidence and Buying decision, with no horizontal overflow.
- Existing deterministic behavior, TypeScript, lint, production build, private runtime, desktop, and phone gates pass.

## Edge Cases

- No active event: the adjacent station shows the existing Event Ledger setup action.
- No selected result: the adjacent composer shows the existing selection prompt and keeps the cart visible.
- Long or populated cart: station grows vertically without widening the page.
- Quick Sale mode: it remains in the adjacent station and does not inherit purchase-only grid constraints.
- View-only access: summary and access messaging retain their existing behavior.

## Dependencies

- `PHR-UX-008` unified artwork-first search.
- `PHR-UX-015` Vendor Workspace Quick Sale.
- `PHR-WORKFLOW-006` Event Cash Ledger.
- Existing `VendorCheckout` component and `/api/purchases` boundary.

## Future Enhancements

- Optional compact cart density and barcode/scanner focus loop.
- Operator-configurable analytical-panel collapse after measured event use.

## Technical Notes

Use one primary responsive CSS grid in `SnapshotVendorWorkspace` containing the results section and the single `VendorCheckout`. Use one secondary grid for Snapshot evidence and Buying decision. Change the Event station's internal two-column purchase breakpoint only as needed to avoid nesting minimum-width grids inside a narrower outer column.

## UI / UX Notes

Give checkout slightly more desktop width than results because it contains price entry and the current cart. Align both panels at the top. Preserve the cyan selection/action language and existing panel styling.

## Success Metrics

- Results and checkout are simultaneously visible at the standard private desktop review width.
- One selected-card add requires no page-band navigation.
- Zero new API calls and zero responsive overflow regressions.

## Open Questions

- None blocking this bounded layout rework.

## Traceability

- Originating request: Product Owner Vendor Workspace rework direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-UX-018-adjacent-search-checkout-workspace-prompt.md`.
- Related tests: `tests/snapshot-vendor-workspace.test.ts`, `tests/event-cash-ledger.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-018.md`.
- Last modified: 2026-08-01.
- Modification reason: Implementation, responsive verification, and conformance evidence recorded.
