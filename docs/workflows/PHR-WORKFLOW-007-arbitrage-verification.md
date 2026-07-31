# PHR-WORKFLOW-007 — Two-Way Arbitrage Verification

## Status

Completed — Executable Availability Gated

## Priority

High

## Category

Workflow / Decision Intelligence / Audit

## Objective

Rank possible US↔Brazil opportunities while requiring a human-recorded executable price and quantity before Phronesis calls an opportunity actionable.

## Proposed Workflow

1. Detect an indicative cross-market spread for an exact crosswalk identity.
2. Confirm fresh regional evidence and a complete direction-specific cost profile.
3. Rank the candidate by expected net profit, ROI, evidence age, and confidence.
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
- Preserve gross spread, every cost component, net profit, ROI, evidence timestamps, and rule version.
- Provide a ranked Opportunities view with direction, confidence, blockers, and verification action.
- Persist verification observations as auditable append-only records.
- Never submit an order, reserve stock, or contact a marketplace.

## Acceptance Criteria

- No candidate reaches `ACTIONABLE` from a marketplace benchmark alone.
- Missing FX, cost, identity, freshness, or availability is visible as a blocker.
- Recalculation is deterministic and tested.
- Operators with `INTELLIGENCE:OPERATE` can verify; viewers cannot mutate evidence.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-006`
- `PHR-UX-013`

## Traceability

- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-30.
