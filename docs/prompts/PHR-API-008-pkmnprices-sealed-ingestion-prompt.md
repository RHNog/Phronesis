# Implementation Prompt — PHR-API-008 PkmnPrices Sealed Ingestion

## Project Context

Phronesis is a private collectible-market platform. Provider credits, exact identity, and last-good local data are governed resources.

## Feature ID

`PHR-API-008`

## Objective

Build a restart-safe newest-release-first sealed importer that uses at most 100 PkmnPrices credits per UTC day, all on `/v1/sealed`.

## Required Reading

- `docs/api/PHR-API-008-pkmnprices-sealed-ingestion.md`
- `docs/api/PHR-API-004-product-artwork-coverage.md`
- `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

## Implementation Requirements

- Add a strict PkmnPrices sealed client, open Pokémon release manifest reader, SQLite state repository, sync service, status route, Settings status, CLI, and supervised daily worker.
- Persist provider-charged credits and never exceed 100 per UTC day.
- Store every valid record and attach images only through exact TCGplayer ID or exact normalized name/set evidence.
- Preserve last-good data on every failure.

## Constraints

- No secret exposure, scraping, single-card credits, set-endpoint credits, price-history calls, fuzzy identity attachment, dependency, deployment, commit, or push.

## Testing Expectations

- Unit/integration coverage for recency, budgets, restarts, zero-result charges, plan denial, matching, and status redaction.
- Full TypeScript, lint, tests, production build, and diff hygiene.

## Acceptance Criteria

- Every acceptance criterion in the specification passes with reproducible evidence.
