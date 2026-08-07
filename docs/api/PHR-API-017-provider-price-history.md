# PHR-API-017 — Provider Price History And Movement

## Feature ID

`PHR-API-017`

Feature IDs are permanent and must not be changed after assignment.

## Title

Provider Price History And Movement

## Status

Completed — Privately Live; Product Review Ready

## Priority

High

## Category

API / Database / Market Evidence / UI / UX / Reliability

## Objective

Let an authorized Vendor Workspace user inspect truthful price evolution for the exact selected printing over 7 days, 30 days, 3 months, or 1 year, with every provider and currency kept distinct.

## Background

Phronesis already retains append-only TCGplayer pricing snapshots and PriceCharting import observations. LigaMagic and LigaPokémon currently expose only the promoted last-good observation. Vendor Workspace therefore shows only a latest-versus-previous TCGplayer sentence and cannot render a provider-specific time series.

## Problem Statement

The operator cannot determine whether an exact printing is moving up, down, or remaining flat across the evidence providers they use. Combining USD and BRL into one chart, inventing missing historical points, or treating a compatible Liga proxy as exact would be misleading.

## Proposed Solution

Introduce a unified, read-only market-history contract backed by provider-owned append-only observations. The contract returns independently selectable provider series for one exact Phronesis category/SKU and condition. Vendor Workspace presents 7D, 30D, 3M, and 1Y controls, provider tabs, accessible latest/change summaries, and a compact responsive SVG. TCGplayer and the applicable Liga provider remain in the raw-card evidence card. PriceCharting history remains inside the existing collapsed PriceCharting disclosure.

## Functional Requirements

- Add `GET /api/market/history` for one bounded category, SKU, condition, and supported range.
- Support `7D`, `30D`, `3M`, and `1Y` without fabricating observations outside retained history.
- Return TCGplayer Market, Direct Low, and Delivered Low series in USD when present.
- Append LigaMagic and LigaPokémon consumer/dealer evidence to a durable regional history table during every successful reconciliation.
- Return Liga consumer and dealer series in BRL with match quality, source run, and evidence time.
- Return PriceCharting evidence lanes in USD from applied import receipts, including historical receipts.
- Keep provider, currency, lane, condition, category, SKU, observation time, and source provenance explicit.
- Deduplicate an identical provider observation idempotently.
- Include no more than a bounded number of chronological points per series while retaining the first and latest point in range.
- Show an honest one-point state when only a current observation exists.
- Calculate movement from retained first/latest observations only; no interpolation is evidence.
- Honor the signed-in user's enabled-provider preferences when deciding which history controls Vendor Workspace exposes.

## Non-Functional Requirements

### Performance

Every provider read uses indexed category/SKU/time lookups. The route is bounded to one selected identity and at most 366 points per series.

### Scalability

The response is provider-neutral and may accept additional providers and lanes without changing range semantics.

### Maintainability

Provider storage stays provider-owned; one projection service shapes the common DTO. Chart rendering consumes only the DTO.

### Reliability

Failed imports or reconciliation runs do not delete historical observations or replace the last-good active evidence.

### Accessibility

Range and provider controls are keyboard accessible, at least 44 pixels high, have explicit selected state, and expose textual change summaries independent of color or SVG.

### Offline Support

All chart reads use locally retained evidence. No provider request is triggered by changing range or provider.

### Security

The route requires `VENDOR_WORKSPACE:VIEW`, returns no provider credentials or local paths, and accepts only enumerated ranges and bounded identity values.

### Extensibility

Future sales-volume bars, additional currencies, and provider subscriptions may extend the DTO without rewriting retained facts.

### Responsiveness

The chart, legends, and segmented controls must work at 390 pixels with no horizontal page overflow.

## User Stories

- As a buyer, I want to compare 7D through 1Y movement for the provider I trust, so that I can distinguish a stable price from a temporary spike.
- As an auditor, I want every point tied to its provider and observation time, so that a chart never obscures provenance.

## Acceptance Criteria

- An exact selected card exposes 7D, 30D, 3M, and 1Y controls.
- TCGplayer, LigaMagic/LigaPokémon, and PriceCharting series remain separate and use the correct currency.
- One retained point renders as `History begins here`, not a flat invented line.
- Changing range/provider performs a local authorized read and does not mutate or fetch external provider data.
- PriceCharting stays below the raw-card card and closed by default.
- Focused repository/route/UI tests, full tests, TypeScript, lint, build, live API, and 390-pixel review pass.

## Edge Cases

- A range has no observation: show a truthful empty state.
- A provider has multiple lanes: preserve lane labels; never average them into one undisclosed value.
- A compatible Liga mapping changes: retain the point's historical match quality and provenance.
- An invalid range, category, SKU, or condition fails with a bounded client error.

## Dependencies

- `PHR-UX-013` regional Vendor Workspace composition.
- `PHR-API-012` PriceCharting snapshots.
- `PHR-API-013` Liga network acquisition.
- `PHR-API-016` provider-aware LigaPokémon reconciliation.
- Local pricing SQLite database.

## Future Enhancements

- Sales-volume overlays and alert annotations.
- Currency-normalized comparison as a separate, explicit FX-derived view.
- Server-side downsampling for multi-year history.

## Technical Notes

Use the existing `pricing_history` and `provider_market_observation` tables. Add one append-only regional history table populated only after a successful deterministic reconciliation. The API projection must never merge currencies on a shared scale.

## UI / UX Notes

Place raw-card history after TCGplayer/Liga current evidence and before `Track price`. Use provider buttons above a compact chart and the four range buttons below or directly above it. Keep PriceCharting history inside its expanded violet disclosure.

## Success Metrics

- 100% of rendered points carry provider, currency, lane, and observation time.
- Zero fabricated points or cross-currency lines.
- Range/provider changes remain responsive on phone and desktop.

## Open Questions

- None blocking this release.

## Traceability

- Originating prompt or work order: Product Owner request on 2026-08-07 for TCGplayer-like 7D/30D/3M/1Y movement across selected providers.
- Related implementation prompt: `docs/prompts/PHR-API-017-provider-price-history-prompt.md`.
- Related tests: `tests/provider-price-history.test.ts` and Vendor Workspace presentation tests.
- Related release notes: `docs/release-notes/PHR-API-017.md`.
- Last modified: 2026-08-07.
- Modification reason: record completed local history projection, responsive provider/range controls, live backfill, and private deployment evidence.
