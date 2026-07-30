# PHR-UX-013 — Regional Vending Intelligence

## Status

Product Review Ready

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

## Accessibility And Responsiveness

- Keyboard-accessible controls, semantic headings, visible focus, and non-colour status labels.
- Desktop keeps evidence and decision visible together; mobile stacks recommendation before details.

## Acceptance Criteria

- A matched fresh card exposes local evidence without manual catalogue switching.
- No recommendation appears as certain when costs or evidence are incomplete.
- Existing purchase evaluation and checkout paths remain unchanged unless the operator explicitly adds a line.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-006`
- `PHR-UX-011`
- `PHR-WORKFLOW-006`

## Traceability

- Designer direction: `docs/design/PHR-UX-013-regional-vending-intelligence.md`.
- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-30.
