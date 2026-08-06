# PHR-UX-011 Engineer Work Order

## Feature ID

`PHR-UX-011`

## Objective

Show the canonical offer ladder immediately after priced-card selection and make seller asking price secondary.

## Required Reading

- `docs/ux/PHR-UX-011-offer-first-buying-decision.md`
- `docs/ux/PHR-UX-009-visible-buying-intelligence-panel.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`

## Implementation Requirements

- Reuse the existing evaluation pipeline and expose recommended, opening, target, and maximum offers before an asking price exists.
- Apply seller asking price only to comparison and decision state.
- Preserve no-evidence states and existing Intelligence presentation.

## Constraints

- No new formulas or parallel decision engine.

## Testing Expectations

- Deterministic offer-first and asking-price comparison tests, responsive checks, and full gates.

## Documentation Updates

- Shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.
