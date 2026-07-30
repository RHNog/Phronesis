# PHR-UX-010 Engineer Work Order

## Feature ID

`PHR-UX-010`

## Objective

Add a pre-creation composer to manual Market Watch additions while retaining Vendor Workspace one-action tracking.

## Required Reading

- `docs/ux/PHR-UX-010-watch-entry-composer.md`
- `docs/workflows/PHR-WORKFLOW-005-identity-backed-price-monitoring.md`

## Implementation Requirements

- Intercept command-palette additions and display exact identity, target choice, notes, and reason.
- Require a positive target or explicit no-target selection.
- Persist the configured entry through the existing server API.
- Preserve idempotency, undo, edit, keyboard behavior, and mobile adaptation.

## Constraints

- Do not add multiple watchlist UI or mandatory configuration to Vendor Workspace one-action tracking.

## Testing Expectations

- Focused component/domain tests plus the supported full gates.

## Documentation Updates

- Shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.
