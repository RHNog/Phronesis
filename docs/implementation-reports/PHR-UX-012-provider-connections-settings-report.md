# PHR-UX-012 — Provider Connections And Regional Acquisition Health Implementation Report

Date: 2026-08-07

Settings → Providers now begins with a dedicated Regional marketplaces group. LigaMagic and LigaPokémon project the existing `PHR-API-013` atomic receipt into a bounded read-only health contract. The server checks only whether each private provider configuration exists and returns an allowlisted status, schedule, completion time, snapshot ID, promotion result, and sanitized outcome. It never reads or returns profile contents, credentials, cookies, tokens, or configuration values, and recognized local filesystem paths are redacted.

The provider catalogue is now organized by purpose. Regional marketplaces lead; Market and valuation feeds render JustTCG followed immediately by PriceCharting, eBay Browse, and CardTrader; specialized services contain PkmnPrices Sealed and PSA Certificates. PriceCharting snapshot summaries remain on its own card. Long operational statuses wrap independently from descriptions so the two-column Admin layout remains readable.

The provider-health Route Handler now requires `ADMINISTRATION:VIEW`. A visible Refresh status action performs an uncached read and announces completion or failure without reloading Settings. Credential-backed setup remains owner-only and encrypted; Liga cards deliberately contain no password, Save, Remove, or remote acquisition action.

The private `:9444` deployment now points to the canonical regional-acquisition evidence root. Live verification returned LigaMagic `REAUTHENTICATION_REQUIRED`, LigaPokémon `SUCCESS` with promoted snapshot `dry-run-20260805T070105248Z`, JustTCG `DISABLED`, and PriceCharting `READY`. Automated, type, lint, warning-free production build, API, and browser layout/interaction evidence is recorded in `docs/testing/PHR-UX-012-provider-connections-settings-validation.md`.
