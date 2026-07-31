# PHR-UX-013 — Regional Vending Intelligence

## Status

Implemented — Product Review Pending

## Priority

High

## Category

Product / UX / UI / Decision Intelligence

## Objective

Make the selected-card decision useful for Brazilian vending immediately by showing regional retail, dealer-buy benchmark, and recommended buy/list ranges with evidence freshness.

## Problem Statement

Vendor Workspace currently centres US-dollar catalogue evidence. Brazilian card-show decisions require the local market context without making the operator interpret raw export columns.

## Proposed Solution

Extend the existing Buying Decision panel rather than creating a parallel engine. The immediate hierarchy is recommended offer, Brazilian market context, then secondary seller ask and detailed evidence. Pricing modes include quick-sale, market, and patient-listing views.

## Functional Requirements

- Show LigaMagic consumer retail (`Compra`) and dealer buy benchmark (`Venda`) in BRL for the exact selected printing.
- Show source age and identity confidence before any recommendation.
- Present recommended buy, quick-sale ask, market ask, and patient ask as explainable ranges.
- Preserve the existing seller-asking-price comparison as secondary input.
- Clearly distinguish unavailable, stale, unmatched, and ambiguous states.
- Remain desktop-first with a single-column mobile adaptation.
- Keep all four direction-specific cost inputs in Settings while allowing them to remain empty until the Product Owner defines policy.
- Add nullable, direction-specific target profiles in Settings: acquisition-value range, minimum gross resale value, minimum gross spread, minimum net profit, minimum profit margin, minimum ROI, and maximum evidence age. Every monetary field must name its currency.
- Define profit margin as net profit divided by gross proceeds and ROI as net profit divided by total cost; never use the labels interchangeably.
- Applying a target filters or labels a candidate but cannot satisfy identity, freshness, cost, or executable-availability gates.
- Present Arbitrage as a decision workspace with an evidence summary, direction filters, visible blockers, net-first economics, and a focused availability-verification action.
- Replace the wide-table dependency with responsive candidate cards that preserve printing identity, direction, source prices, net result, ROI, freshness, and gate state.
- Make direction changes materially visible. `US → Brazil` must label the US value as acquisition and the Brazil value as exit/gross evidence; `Brazil → US` must reverse those roles. A direction toggle may not merely change the route caption while leaving an unlabeled price pair unchanged.
- Label LigaMagic evidence by commercial meaning: `Compra` is store retail (consumer acquisition) and `Venda` is dealer-buy benchmark. Do not present either as an executable offer without verification.

## Accessibility And Responsiveness

- Keyboard-accessible controls, semantic headings, visible focus, and non-colour status labels.
- Desktop keeps evidence and decision visible together; mobile stacks recommendation before details.

## Acceptance Criteria

- A matched fresh card exposes local evidence without manual catalogue switching.
- No recommendation appears as certain when costs or evidence are incomplete.
- Existing purchase evaluation and checkout paths remain unchanged unless the operator explicitly adds a line.
- Empty costs are labelled as intentionally awaiting Product Owner policy and link the operator back to Settings.
- Arbitrage remains usable at 390px without horizontal scrolling and never presents missing net economics as zero.
- Selecting either direction changes acquisition/exit labels, units, target profile, and explanatory copy so the route can be understood without comparing screenshots.
- Settings preserves null targets as `No target` and validates percentages, currencies, range order, and maximum evidence age.
- Candidate cards show gross proceeds, total cost, net profit, profit margin, and ROI as distinct quantities when calculation inputs exist.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-006`
- `PHR-UX-011`
- `PHR-WORKFLOW-006`

## Traceability

- Designer direction: `docs/design/PHR-UX-013-regional-vending-intelligence.md`.
- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-31.
- Modification reason: Product Owner rejected direction-indistinguishable cards and required precise arbitrage targets plus closest-defensible catalogue matching.
