# Engineer Report — Official BCB PTAX Exchange Rate

Date: 2026-07-30

## Outcome

Phronesis now obtains BRL/USD automatically from Banco Central do Brasil and applies the correct official quote side to each arbitrage direction.

## Delivered

- Fixed-destination, timeout-bounded BCB PTAX closing provider.
- Eight-day business-close lookback with schema/spread/timestamp validation.
- Additive SQLite migration for official buy/sell and refresh provenance.
- One-hour persisted automatic refresh on profile and opportunity reads.
- In-process request coalescing and last-good retention with sanitized failure state.
- Direction-correct regional calculation and seven-day official-publication freshness bound.
- Read-only official FX Settings panel plus authorized forced refresh.

## Operational Result

The private JarvisSSD deployment persisted official buy `5.0733` and sell `5.0739` for the July 30 closing bulletin. FX no longer requires owner entry. Cross-border fixed and variable costs remain intentionally explicit and currently unset, so candidate actionability remains safely blocked until configured.

## Files

Implementation is concentrated in `lib/regional/BcbPtaxProvider.ts`, the regional domain/repository/server boundary, authorized regional routes, Settings, focused tests, and documentation.
