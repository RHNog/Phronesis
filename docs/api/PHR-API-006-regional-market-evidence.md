# PHR-API-006 — Regional Market Evidence And Cost Truth

## Status

Completed — Owner Cost Configuration Gated

## Priority

Critical

## Category

API / Market Evidence / Database / Business Rule

## Objective

Expose LigaMagic and TCGplayer observations as separate, timestamped evidence and calculate cross-market economics only from official exchange-rate evidence and explicit cost inputs.

## Problem Statement

Raw `Compra` and `Venda` fields are valuable but semantically easy to reverse. Currency conversion alone also overstates arbitrage because freight, tax, payment, marketplace, and operating costs may be unknown.

## Proposed Solution

Persist regional evidence with source semantics and freshness, plus official BCB PTAX FX and owner-managed cost profiles. `Compra` is Brazilian consumer retail evidence. `Venda` is a Brazilian store buy benchmark, not a guaranteed executable offer. Calculations expose gross and net spreads, missing-input reasons, and staleness.

## Functional Requirements

- Preserve low, average, and high LigaMagic `Compra` and `Venda` observations in BRL.
- Preserve TCGplayer market/listing/delivered observations in USD.
- Use delivered/listing evidence as the US acquisition benchmark for US-to-Brazil analysis and market/listing evidence as the US resale benchmark for Brazil-to-US analysis; never reuse one side silently for both directions.
- Store automatically refreshed official BCB PTAX closing buy/sell observations with provenance and last-good retention under `PHR-API-007`.
- Store direction-specific costs for US-to-Brazil and Brazil-to-US analysis.
- Never convert an unknown cost to zero implicitly.
- Return minimal authorized DTOs from a server-only DAL.
- Expose evidence and profile APIs with module authorization and validated input.
- Mark stale FX, stale source evidence, and incomplete cost profiles explicitly.

## Reliability And Security

- Last-good evidence survives failed refresh or rebuild.
- Mutations require `INTELLIGENCE:ADMIN`; reads require `INTELLIGENCE:VIEW`.
- No provider credentials or browser-session state is returned to clients.
- No marketplace transaction is executed.

## Acceptance Criteria

- Compra/Venda semantics are labelled correctly throughout storage, APIs, and UI.
- Unknown or stale FX/cost inputs prevent an `ACTIONABLE` arbitrage state.
- Deterministic tests cover both trade directions, negative spread, missing cost, and stale evidence.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-005`
- `PHR-API-003`
- `PHR-API-007`

## Traceability

- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-30 for official BCB PTAX automation.
