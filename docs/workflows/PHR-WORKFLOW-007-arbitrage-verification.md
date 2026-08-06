# PHR-WORKFLOW-007 — Two-Way Arbitrage Verification

## Status

Implemented — Product Review Pending

## Priority

High

## Category

Workflow / Decision Intelligence / Audit

## Objective

Rank possible US↔Brazil opportunities while requiring a human-recorded executable price and quantity before Phronesis calls an opportunity actionable.

## Proposed Workflow

1. Detect an indicative cross-market spread for an exact crosswalk identity.
2. Confirm fresh regional evidence and a complete direction-specific cost profile.
3. Apply the selected direction's nullable target profile and rank by expected net profit, profit margin, ROI, evidence age, and confidence.
4. Operator verifies a real listing or dealer offer and records price, quantity, seller/buyer label, timestamp, and notes.
5. Phronesis recalculates against verified availability.
6. Candidate becomes `ACTIONABLE`, remains `INDICATIVE`, or is rejected/expired.

## State Model

- `INDICATIVE`
- `IDENTITY_VERIFIED`
- `COSTED`
- `AVAILABILITY_VERIFIED`
- `ACTIONABLE`
- `STALE`
- `REJECTED`

States may advance only when their evidence gates pass. Source or FX staleness can demote a candidate.

## Functional Requirements

- Support US-to-Brazil vending and Brazil-to-US buylist/export directions independently.
- Expose acquisition market/value/currency and exit market/value/currency explicitly for the selected direction.
- Preserve gross proceeds, gross spread, every cost component, total cost, net profit, profit margin, ROI, evidence timestamps, and rule version.
- Store route-specific nullable targets for acquisition-value range, gross resale value, gross spread, net profit, profit margin, ROI, and evidence age.
- Treat unset targets as absent policy, not zero. Target satisfaction never replaces the identity, freshness, cost, or availability gates.
- Use `net profit / gross proceeds` for profit margin and `net profit / total cost` for ROI.
- Provide a ranked Opportunities view with direction, confidence, blockers, and verification action.
- Persist verification observations as auditable append-only records.
- Never submit an order, reserve stock, or contact a marketplace.

## Acceptance Criteria

- No candidate reaches `ACTIONABLE` from a marketplace benchmark alone.
- Missing FX, cost, identity, freshness, or availability is visible as a blocker.
- Switching direction visibly reverses acquisition and exit roles and applies the correct route-specific currencies and target profile.
- Threshold misses are explained independently from evidence-gate blockers.
- Recalculation is deterministic and tested.
- Operators with `INTELLIGENCE:OPERATE` can verify; viewers cannot mutate evidence.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-006`
- `PHR-UX-013`

## Traceability

- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-31.
