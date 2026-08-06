# PHR-API-007 — Official BCB PTAX Exchange Rate

## Status

Completed — CTO Accepted

## Priority

Critical

## Category

API / Market Evidence / Reliability / Business Rule / UX

## Objective

Replace manually entered BRL/USD observations with automatically refreshed official Banco Central do Brasil PTAX closing rates while preserving direction-specific economics and last-good operation.

## Background

Regional vending and arbitrage currently depend on an owner-entered exchange rate. The Banco Central do Brasil publishes official PTAX daily closing buy and sell quotations through its open-data OData service and updates the dataset several times per day.

## Problem Statement

Manual FX entry is slow, can become stale, has weak provenance, and collapses the official buy/sell spread into one value. A provider outage must not erase previously valid regional economics.

## Proposed Solution

Add a server-only BCB PTAX provider that queries the latest eight calendar days and adopts the newest valid daily closing quotation. Refresh automatically on authorized regional-profile and arbitrage reads, no more than once per hour. Persist official buy, sell, observation, retrieval, attempt, source, and last-error evidence. Use the sell rate for US-to-Brazil acquisition costing and the buy rate for Brazil-to-US acquisition costing. Retain the last successful quote when the provider fails.

## Functional Requirements

- Fetch only from the fixed official BCB PTAX OData endpoint.
- Validate finite positive buy/sell rates, a non-negative spread, and a valid observation timestamp.
- Select the newest returned closing quotation across weekends and holidays.
- Automatically refresh when the last attempt is at least one hour old.
- Permit an authorized administrator to request an immediate refresh.
- Preserve the last-good quote and record a sanitized failure state when refresh fails.
- Make FX values and provenance read-only in Settings; keep direction-specific operating costs editable.
- Preserve the legacy single-rate field as the official sell quote for DTO/database compatibility.
- Block actionable calculations when official evidence is absent or no longer acceptably fresh.

## Non-Functional Requirements

### Reliability

Provider requests time out, do not overlap within one process, use persisted retry throttling, and never clear last-good values on failure.

### Security

The provider URL is constant, accepts no client-controlled destination, and sends no Phronesis credentials. Reads and forced refresh retain existing module authorization.

### Offline Support

The latest successful quote remains visible with an explicit refresh error. Calculations continue only while that quote remains within the bounded official freshness window.

### Performance

At most one automatic provider attempt is made per hour per persisted repository, independent of page views.

## User Stories

- As an operator, I want official FX to update automatically so regional opportunities do not depend on manual data entry.
- As a buyer, I want direction-specific official rates so the apparent spread is not overstated.
- As an administrator, I want visible provenance and last-good behavior so an upstream outage is understandable and recoverable.

## Acceptance Criteria

- A valid official response persists separate buy and sell PTAX closing rates with timestamps and provenance.
- US-to-Brazil calculations use PTAX sell; Brazil-to-US calculations use PTAX buy.
- Repeated reads inside one hour do not trigger another provider attempt.
- Provider failure retains the last-good quote and returns a truthful status.
- Settings no longer permits manual FX mutation and supports an explicit refresh action.
- Unit, integration, TypeScript, lint, build, diff, desktop, and mobile checks pass.

## Edge Cases

- Weekend or Brazilian holiday: use the latest closing quotation returned by the official period query.
- Empty or malformed response: reject it without replacing last-good data.
- Buy quote above sell quote: reject it as invalid.
- Network timeout: retain last-good evidence and persist a sanitized error.
- Fresh retrieval of an older official close: accept only within the bounded seven-day publication window.

## Dependencies

- `PHR-API-006`
- `PHR-WORKFLOW-007`
- Banco Central do Brasil PTAX open-data service

## Future Enhancements

- Persist quote history for historical arbitrage replay.
- Apply configurable commercial-card or remittance spreads separately from PTAX.

## Technical Notes

`CotacaoDolarPeriodo` returns one closing USD quotation per business day with `cotacaoCompra`, `cotacaoVenda`, and `dataHoraCotacao`. The BCB timestamp is interpreted in Brasília time (`UTC-03:00`).

## UI / UX Notes

Show buy, sell, official observation, last checked, source, and degraded status in a compact read-only panel. The manual cost inputs remain immediately below it.

## Success Metrics

- Zero manual FX fields in the operator workflow.
- Zero actionable candidates calculated from a missing or invalid official quote.
- Last-good quote survives simulated provider failure.

## Open Questions

- None for this bounded release.

## Traceability

- Originating request: CTO instruction on 2026-07-30 to automate FX using official information.
- Related implementation prompt: `docs/prompts/PHR-API-007-official-bcb-ptax-fx-prompt.md`.
- Related tests: `tests/bcb-ptax-provider.test.ts`, `tests/regional-intelligence.test.ts`.
- Related release notes: `docs/release-notes/PHR-API-007-official-bcb-ptax-fx.md`.
- Last modified: 2026-07-30.
- Modification reason: Initial approved specification.
