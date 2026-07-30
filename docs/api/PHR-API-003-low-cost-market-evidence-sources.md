# PHR-API-003 — Low-Cost Market Evidence Sources

## Feature ID

`PHR-API-003`

## Status

Planned

## Priority

High

## Category

API / Market Evidence / Provider Governance

## Objective

Enrich monitored cards with legitimate low-cost valuation and active-listing evidence while representing completed-sale evidence only when a source actually supplies completed transactions.

## Proposed Solution

Retain authorized Pricing Update Tool snapshots as the broad baseline, batch watched variants through the existing JustTCG integration, add disabled-by-default eBay Browse and CardTrader listing adapters, and ingest first-party Phronesis or account-owned marketplace transactions as observed sales.

## Evidence Contract

- `MARKET_ESTIMATE`: provider-derived valuation or aggregate market price.
- `ACTIVE_LISTING`: an available asking price with source, shipping, condition, and observation time.
- `OBSERVED_SALE`: an actual completed transaction with source, sale time, and provenance.
- No adapter may project an active listing or aggregate estimate into `OBSERVED_SALE`.

## Functional Requirements

- Provider credentials remain server-only and providers are disabled when absent.
- Refresh budgets, batching, caching, backoff, and freshness are explicit.
- JustTCG free-tier limits are respected before any paid-plan recommendation.
- eBay and CardTrader listing queries are bounded to watched or actively inspected variants.
- First-party sales can be recorded without an external provider.
- Unsupported sold evidence is displayed as unavailable, not inferred.

## Acceptance Criteria

- Evidence types remain distinct through provider, repository, API, and UI layers.
- Provider absence or quota exhaustion does not break existing snapshot monitoring.
- No scraper is introduced.
- Any new paid plan or external account remains separately authorized.

## Non-Goals

- Scraping TCGplayer, eBay, Cardmarket, or provider pages.
- Claiming marketplace-wide sold-copy coverage without licensed access.
- Riftbound provider work.

## Traceability

- Origin: Product Owner approval and provider research on 2026-07-30.
- Implementation prompt: `docs/prompts/PHR-API-003-low-cost-market-evidence-sources-prompt.md`.
- Last modified: 2026-07-30.
