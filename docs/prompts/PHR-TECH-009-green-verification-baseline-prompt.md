# PHR-TECH-009 Engineer Work Order

## Project Context

Project Phronesis must establish a deterministic green baseline before resuming price-monitoring development. Documentation is part of implementation.

## Feature ID

`PHR-TECH-009`

## Objective

Resolve the 29 standalone TypeScript configuration diagnostics and all 17 established behavioral-test failures without weakening current product contracts.

## Required Reading

- `docs/technical/PHR-TECH-009-green-verification-baseline.md`
- `docs/DECISIONS.md`
- `docs/ATLAS.md`
- Relevant feature specifications for each failing domain
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md`

## Implementation Requirements

- Enable explicit `.ts` test imports under the repository's no-emit TypeScript contract.
- Classify and repair each failure cluster.
- Replace the live Scryfall dependency in the identity boundary test with a deterministic injected provider or fixture.
- Preserve evaluation snapshot immutability.
- Reconcile evidence selection and provider eligibility with the Market Ontology and Market Evidence Layer.
- Reconcile readiness, negotiation, and intelligence assertions with current business-engine contracts.
- Record exact before/after evidence.

## Constraints

- Do not add price-monitoring, login, entitlement, or provider features in this slice.
- Do not install dependencies.
- Do not use live provider access in the test suite.
- Do not alter expectations solely to obtain a green result.
- Preserve all unrelated repository behavior.

## Testing Expectations

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Documentation Updates

- `docs/testing/PHR-TECH-009-green-verification-baseline-validation.md`
- `docs/release-notes/PHR-TECH-009.md`
- `docs/FEATURE_REGISTRY.md`
- `docs/ROADMAP.md`
- `docs/product-development/CONVERSATION_HISTORY.md` at acceptance

## Acceptance Criteria

- All 204 tests and every static/build gate pass.
- The validation record explains the disposition of all 17 prior failures and 29 prior diagnostics.

## Non-Goals

- Authentication.
- Watchlist persistence changes.
- New market providers.
- Deployment or provider credentials.
