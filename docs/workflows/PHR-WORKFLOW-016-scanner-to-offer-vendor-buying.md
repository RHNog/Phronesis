# PHR-WORKFLOW-016 — Scanner-To-Offer Vendor Buying

## Feature ID

`PHR-WORKFLOW-016`

## Status

Planned

## Priority

High

## Category

Workflow / Vendor Buying / UX / Identity / Pricing / Audit

## Objective

Let a buyer load qualified English Magic cards, press Start, review exceptions, confirm price-material finish/condition, apply an existing buying preset, and review an evidence-backed offer without managing scan files.

## Requirements

- Reuse current canonical identity, pricing, offer, purchase, and inventory boundaries.
- Persist scan progress and allow safe cancel/resume.
- Show accepted, review, abstained, and failed counts separately.
- Prevent an unresolved card from entering an offer.
- Bind each offer line to recognition evidence, price snapshot, buying preset, and operator decisions.
- Keep draft offer creation separate from purchase finalization and downstream listing.
- Complete a Designer gate before product UI implementation.

## Acceptance Criteria

- An offline qualified batch reaches a reviewable offer with full evidence traceability.
- Exception decisions are explicit and auditable.
- No scan failure silently changes another card's result.

## Dependencies

- `PHR-TECH-013`, `PHR-TECH-014`, and `PHR-ARCH-015`.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Last modified: 2026-08-04.
