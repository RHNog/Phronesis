# PHR-UX-022 — Selection-Focused Vendor Workspace

## Feature ID

`PHR-UX-022`

## Status

Implemented And Live — Product Review Ready

## Priority

High

## Category

UX / UI / Vendor Operations / Responsive Layout / Market Evidence

## Objective

Keep an exact selected card and every price needed for a buying decision in one coherent evidence hierarchy, without search-result scroll or separate TCGplayer and Liga locations.

## Background

Selecting a result already collapses search and promotes Snapshot evidence beside the Event station. TCGplayer evidence currently lives inside Snapshot evidence, LigaMagic or LigaPokemon evidence lives later inside Buying decision, and PriceCharting graded evidence appears before the primary raw-card prices.

## Problem Statement

The current order separates prices for the same exact printing and lets optional grading evidence interrupt the primary TCGplayer decision path. On a phone, an operator can see TCGplayer evidence without the reconciled Liga market values and must scroll into another panel to compare them.

## Proposed Solution

Selecting a result continues to collapse search. Snapshot evidence owns one combined `TCGplayer + Liga` pricing card containing the selected condition's TCGplayer reference, movement, provenance, exact provider-labelled LigaMagic or LigaPokemon evidence, and the existing price-tracking continuation. A single collapsed grading disclosure follows immediately below that card and contains PriceCharting graded evidence plus certificate lookup. Buying decision consumes the same existing reference and evaluation engines but no longer owns a duplicate regional-price panel or separate grading control.

## Functional Requirements

- Mouse, keyboard Enter, and touch selections enter focused mode.
- Render TCGplayer and exact reconciled Liga evidence inside one visibly bounded pricing card.
- Route `magic-en` only to LigaMagic and `pokemon-en` only to LigaPokemon; retain the explicit unmatched/quarantined state instead of substituting another printing.
- Preserve TCG Direct Low precedence, condition selection, movement, source SKU, snapshot date, and Track price behavior.
- Place one native, keyboard-operable grading disclosure directly below the combined pricing card and keep it collapsed by default.
- Load or reveal PriceCharting graded candidates only within the grading disclosure; do not let graded evidence overwrite raw-card TCGplayer or Liga evidence.
- Move certificate lookup into the same grading disclosure so grading has one discoverable location.
- Remove the duplicate regional panel and certificate lookup from Buying decision.
- Preserve one checkout, one cart, one evidence panel, one selected identity, and one decision engine.
- Clearing selection restores search without discarding its query/results.

## Non-Functional Requirements

### Reliability

Regional loading, unavailable, unmatched, and exact-match states must not hide or replace last-good TCGplayer evidence.

### Accessibility

The combined card has a semantic heading. The grading disclosure uses native `details`/`summary`, a minimum 44px target, visible focus, and an explicit affordance that does not rely on colour.

### Responsiveness

Desktop may use two-column price grids. Mobile stays single-column where necessary, keeps three bounded Liga retail modes, and introduces no horizontal scrolling at 390px.

### Maintainability

Existing pricing, regional, PriceCharting, certificate, watchlist, and evaluation APIs remain authoritative. This is composition and information hierarchy, not a second evidence model.

## User Stories

- As a buyer, I want TCGplayer and Liga prices together so I can compare the exact card without searching another panel.
- As a buyer, I want grading details collapsed below raw-card pricing so optional evidence does not interrupt the immediate decision.
- As a phone operator, I want one continuous evidence card with source and freshness so I can act quickly without losing context.

## Acceptance Criteria

- The selected-card source order is combined pricing card, collapsed grading disclosure, then the rest of the workflow.
- Exact Liga evidence is visible in the same card as TCGplayer pricing for reconciled Magic and Pokémon printings.
- Grading content is closed by default and expands by pointer, keyboard, and touch.
- Certificate lookup appears only inside the grading disclosure.
- Buying decision contains neither `RegionalMarketPanel` nor `GradingCertificateLookup`.
- Existing TCGplayer price math, watch creation, purchase evaluation, checkout, and search-focus behavior remain unchanged.
- Focused tests, the full suite, TypeScript, lint, production build, and private mobile/desktop runtime review pass.

## Edge Cases

- No selected condition price: keep the TCG missing-price/nearest-grade state and still show independently available exact Liga evidence.
- No Liga match: show the fail-closed unmatched explanation inside the combined card.
- Unsupported product line or sealed product: no fabricated Liga or grading evidence appears.
- PriceCharting unavailable or unconfigured: expanding grading explains the state without affecting primary pricing.
- Selection changes while grading is open: evidence reloads for the new exact SKU and cannot retain the prior card's candidates.

## Dependencies

- `PHR-WORKFLOW-004` Snapshot-Powered Vendor Workspace.
- `PHR-UX-013` Regional Vending Intelligence.
- `PHR-API-009` Grading Certificate Lookup.
- `PHR-API-010` PriceCharting Graded Evidence.
- `PHR-API-014` LigaPokemon Catalogue Reconciliation.

## Non-Goals

- Changing price calculations, exchange rates, arbitrage gates, provider matching, or offer policy.
- Showing Liga evidence for an unmatched, ambiguous, or quarantined printing.
- Treating graded-card prices as raw-card valuation.

## Technical Notes

`SnapshotVendorWorkspace` owns composition. `RegionalMarketPanel` remains the exact regional evidence client, and `PriceChartingGradedArea` becomes the single collapsed grading boundary. Certificate lookup may render an embedded presentation inside that boundary while retaining its existing API and validation logic.

## Traceability

- Originating direction: Product Owner request on 2026-08-05 to place Liga beside TCGplayer and collapse grading beneath the combined card.
- Prompt: `docs/prompts/PHR-UX-022-selection-focused-vendor-workspace-prompt.md`.
- Implementation: `features/vendor/components/SnapshotVendorWorkspace.tsx`, `RegionalMarketPanel.tsx`, `PriceChartingGradedArea.tsx`, and `GradingCertificateLookup.tsx`.
- Validation: `docs/testing/PHR-UX-022-selection-focused-vendor-workspace-validation.md`.
- Release notes: `docs/release-notes/PHR-UX-022.md`.
- Last modified: 2026-08-05.
- Modification reason: Unite exact raw-card market evidence and demote optional grading to one collapsed subordinate disclosure.
