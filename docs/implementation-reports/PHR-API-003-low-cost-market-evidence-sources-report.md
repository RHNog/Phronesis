# PHR-API-003 Engineer Report

Date: 2026-07-30
Feature: `PHR-API-003`

## Outcome

Market Watch now has a provider-neutral, user-owned evidence layer that keeps estimates, active listings, and observed sales distinct. It supports local first-party sale observations today and has disabled-by-default official adapters for eBay Browse and CardTrader.

## Implementation

- Added typed `MARKET_ESTIMATE`, `ACTIVE_LISTING`, and `OBSERVED_SALE` contracts.
- Added evidence persistence, read/record APIs, and an explicit-refresh endpoint.
- Added eBay Browse fixed-price normalization and exact-blueprint CardTrader marketplace normalization.
- Added opt-in, budgeted JustTCG watch enrichment after newly verified catalogue receipts.
- Added Market Watch UI for saved evidence, explicit official-listing refresh, and first-party observed-sale entry.

## Verification

Provider-focused 5/5 and integrated 220/220 tests pass with TypeScript, lint, build, migration, and diff gates.

## External activation

Official listing adapters remain inactive without credentials/approvals. The implementation makes no claim of marketplace-wide sold-copy coverage.
