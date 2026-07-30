# PHR-API-003 Engineer Work Order

## Feature ID

`PHR-API-003`

## Objective

Add bounded low-cost market-estimate and active-listing adapters without scraping or falsifying completed-sale evidence.

## Required Reading

- `docs/api/PHR-API-003-low-cost-market-evidence-sources.md`
- Existing Market Ontology, Market Evidence Layer, repository, replay, and provider SDK specifications

## Implementation Requirements

- Extend evidence contracts only where necessary to preserve estimate/listing/sale separation.
- Batch watched variants through JustTCG within configured budgets.
- Implement disabled-by-default eBay Browse and CardTrader adapters behind server-only configuration.
- Add first-party observed-sale persistence.
- Add replay fixtures and deterministic adapter tests.

## Constraints

- No scraping.
- No external account creation, credential generation, or paid-plan activation without Product Owner authorization.
- No provider call on ordinary watchlist initial load.
- Riftbound remains deferred.

## Acceptance Criteria

- Deterministic provider, quota, repository, evidence-classification, and failure-mode tests pass.
- Existing monitoring works when every optional provider is disabled.
