# PHR-API-008 PkmnPrices Sealed Ingestion

## Feature ID

`PHR-API-008`

## Title

PkmnPrices Release-Ordered Sealed Product Ingestion

## Status

Implemented — Product Review Ready; Credential Activation Pending

## Priority

Critical

## Category

API / Provider / Database / Artwork / Reliability

## Objective

Spend the configured daily PkmnPrices allowance only on sealed Pokémon products, process the newest releases before older releases, persist every returned record locally, and attach artwork only when a local sealed identity is exact.

## Background

Phronesis has thousands of sealed-product artwork gaps. PkmnPrices exposes sealed identities and images, but its documented sealed endpoint is available only to Pro and Business plans and charges at least one credit per request or one credit per returned item. Release dates are not part of the sealed response and the endpoint cannot sort by release date.

## Proposed Solution

Use the open Pokémon TCG set metadata only as the release-order queue. Query PkmnPrices `/v1/sealed` by the current set name, never call its card or set endpoints, and cap recorded UTC-day usage at 100 credits. Persist a per-set page cursor, the provider-reported charged credits, every sealed record, and exact local matches. A supervised background worker runs at service start and after each UTC reset. Missing credentials, plan denial, exhaustion, malformed responses, or upstream failure fail closed while last-good records remain available.

## Functional Requirements

- `PKMNPRICES_API_KEY` remains server-only.
- The daily Phronesis policy budget is exactly 100 credits and applies only to `/v1/sealed`.
- Open set metadata is sorted by release date descending; unfinished products for the newest release are requested first.
- Provider `x-credits-charged` is authoritative when present; its documented minimum-one rule is the fallback.
- A UTC-day usage ledger prevents retries, restarts, or manual runs from exceeding 100.
- Sealed records, set/page progress, provider status, and exact local resolution evidence are persisted in SQLite.
- A source-ID match is accepted only when exact normalized name and set also corroborate it; normalized exact name plus exact set is the only fallback.
- Ambiguous or unmatched records remain staged and never alter a local identity.
- Provider plan denial is reported as `ACCESS_REQUIRED`; it is not bypassed or scraped.

## Non-Functional Requirements

### Performance

At most the remaining daily budget is requested per page. No single-card or price-detail call is made.

### Reliability

State is idempotent across process restarts. Last-good records survive network, schema, authorization, and rate-limit failures.

### Security

Keys never enter client props, JSON responses, logs, documentation, or committed files.

### Extensibility

Provider records and exact resolutions are separated so future sealed sources can share the same local ingestion boundary.

## Acceptance Criteria

- Deterministic tests prove newest-first traversal, an exact 100-credit ceiling, restart idempotency, and safe 403 handling.
- The Settings provider card reports configuration, plan/access, UTC-day usage, and next release without revealing secrets.
- The runtime worker is dormant when the key is absent and automatically resumes after a configured service restart.
- Exact matched sealed images become available through the durable same-origin artwork route; ambiguous records do not.

## Edge Cases

- The documented Free plan has 100 credits but no sealed access; the system reports `ACCESS_REQUIRED` without substituting card calls.
- A zero-result response may still charge one credit and must advance the set cursor.
- A new release appearing ahead of the current cursor is processed first.
- If the open release manifest is unavailable, no provider credits are spent unless a previously persisted queue exists.

## Dependencies

- `PHR-API-004` Product Artwork Coverage.
- `PHR-TECH-007` Durable Local Artwork Cache.
- PokémonTCG open set metadata and PkmnPrices `/v1/sealed`.

## Non-Goals

- Scraping PkmnPrices, using sealed credits on singles, importing sealed price history, or fabricating catalogue matches.

## Traceability

- Originating request: Product Owner sealed-ingestion direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-API-008-pkmnprices-sealed-ingestion-prompt.md`.
- Related tests: `tests/pkmnprices-sealed-ingestion.test.ts`.
- Related release notes: `docs/release-notes/PHR-API-008.md`.
- Last modified: 2026-08-01.
- Modification reason: Implementation and verification evidence recorded; live provider activation remains credential- and plan-gated.
