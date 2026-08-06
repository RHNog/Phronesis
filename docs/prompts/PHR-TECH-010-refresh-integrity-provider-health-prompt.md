# PHR-TECH-010 Engineer Work Order

## Project Context

Phronesis is a private, snapshot-first card-show decision platform. Documentation is part of implementation.

## Feature ID

`PHR-TECH-010`

## Objective

Make Market Watch refresh and provider health truthful, catalogue-aware, structured, and last-good preserving.

## Required Reading

- `docs/technical/PHR-TECH-010-refresh-integrity-provider-health.md`
- `docs/workflows/PHR-WORKFLOW-005-identity-backed-price-monitoring.md`
- `docs/api/PHR-API-003-low-cost-market-evidence-sources.md`

## Implementation Requirements

- Correct refresh status precedence and targetless metrics.
- Parse non-JSON failures safely and return structured route errors.
- Reconcile legacy watch identity only through a unique strict catalogue match.
- Prefer local catalogue evidence and preserve last-good observations on failure.
- Replace implied upstream quota with secret-free provider configuration health.

## Constraints

- No scraping, provider-wide refresh, secret exposure, or destructive watch migration.
- Preserve unrelated working-tree changes and existing history.

## Testing Expectations

- Unit tests for targetless metrics, failed attempts, structured errors, and reconciliation.
- Existing watchlist and market suites; full repository gates.

## Documentation Updates

- Shared validation, release note, report, conformance review, registry, roadmap, and memory.

## Acceptance Criteria

- Every acceptance criterion in the specification passes with reproducible evidence.

## Non-Goals

- External account or credential mutation.
