# PHR-UX-011 — Offer-First Buying Decision

## Feature ID

`PHR-UX-011`

## Status

Implemented — Product Review Ready

## Priority

High

## Category

UX / Decision Intelligence / Vendor Workflow

## Objective

Show the recommended buying offer immediately after an exact card and condition are selected.

## Proposed Solution

Create the canonical evaluation from snapshot evidence with a neutral asking-price seed so the established Strategy and Offer Ladder engines can calculate opening, target, recommended, and maximum offers. Asking price becomes a secondary optional comparison input that adds BUY / NEGOTIATE / PASS classification without gating the offer ladder.

## Functional Requirements

- Prominently show recommended offer on selection.
- Show opening, target, and maximum/walk-away values.
- Keep seller asking price secondary and optional.
- When asking price is entered, show the canonical action and suggested counter comparison.
- Reuse existing evaluation, assessment, strategy, and decision engines.

## Acceptance Criteria

- A priced selection shows an offer ladder before asking price entry.
- Asking price changes comparison output but does not invent a second ladder.
- Unpriced selections retain an honest unavailable state.

## Dependencies

- `PHR-WORKFLOW-004`
- `PHR-UX-009`

## Non-Goals

- New intelligence formulas.
- Automated purchasing.

## Traceability

- Origin: Product Owner request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-UX-011-offer-first-buying-decision-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-07-30.
