# PHR-API-017 — Provider Price History Implementation Prompt

## Project Context

Project Phronesis is an evidence-driven decision platform for collectible markets. Documentation is part of implementation.

## Feature ID

`PHR-API-017`

## Objective

Retain and expose provider-specific exact-card history for 7D, 30D, 3M, and 1Y, then render it in the approved Vendor Workspace hierarchy without fabricating data or combining currencies.

## Required Reading

- `docs/api/PHR-API-017-provider-price-history.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/design/PHR-MARKET-PERSONALIZATION-20260807.md`
- `docs/product-development/PHR-MARKET-PERSONALIZATION-20260807-slice-plan.md`

## Implementation Requirements

- Reuse `pricing_history` and historical applied PriceCharting observations.
- Add idempotent append-only regional observations during successful Magic/Pokémon reconciliation.
- Add a bounded authorized market-history projection and route.
- Render provider/range controls, textual movement, honest sparse states, and accessible responsive charts.
- Keep PriceCharting history inside its collapsed disclosure.

## Constraints

- Never interpolate missing facts, merge USD/BRL, or call an external provider on chart interaction.
- Preserve provider provenance and the approved raw-card/PriceCharting hierarchy.

## Expected Architecture

Provider-owned append-only tables feed one server projection DTO. Focused client chart components consume the DTO and own only range/provider presentation state.

## Testing Expectations

- Repository history, route authorization/validation, sparse/range, currency, chart presentation, full suite, type, lint, build, and live responsive checks.

## Documentation Updates

- Specification, validation, report, conformance review, release notes, registry, roadmap/state, prompts, changelog, and product memory.

## Acceptance Criteria

- All four ranges and applicable enabled providers work for an exact selected card without evidence invention or hierarchy regression.

## Non-Goals

- Cross-currency normalization, forecasting, provider acquisition, or sales-volume modeling.

## Notes For AI Coding Agents

- Preserve unrelated user changes and keep every route authorized close to its data source.
