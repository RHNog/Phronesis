# Official BCB PTAX Exchange Rate

## Added

- Automatic hourly-on-use retrieval of the latest official BCB PTAX USD closing quotation.
- Separate official buy and sell evidence with source, observation, retrieval, attempt, and degraded-state timestamps.
- Direction-correct costing: PTAX sell for US→Brazil and PTAX buy for Brazil→US.
- Read-only official FX evidence and explicit refresh control in Settings.

## Reliability

- Weekend/holiday lookback selects the latest available close.
- Timeout, malformed response, or provider outage retains the last successful quote and exposes a sanitized error.
- Repeated ordinary reads inside one hour do not trigger additional BCB requests.

## Safety

- No credential, unofficial fallback, new scheduler, transaction, LigaMagic schedule, or new dependency was introduced.
- Direction-specific operating costs remain explicit and unset values still block actionable arbitrage.
