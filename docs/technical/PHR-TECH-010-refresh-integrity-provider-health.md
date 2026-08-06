# PHR-TECH-010 — Refresh Integrity And Provider Health

## Feature ID

`PHR-TECH-010`

## Status

Completed — CTO Accepted

## Priority

Critical

## Category

Technical / Reliability / Market Watch / API

## Objective

Make every Market Watch refresh truthful, catalogue-aware, recoverable, and diagnosable without losing last-known-good evidence.

## Background

Snapshot-created watches use exact catalogue SKUs, while older command-palette watches can contain provider printing identifiers. A manual refresh of one such Magic watch could not join to the local catalogue, then received no valid live-provider evidence. The client recorded the failed attempt as a recent refresh and the API returned an unstructured server error.

## Proposed Solution

Resolve a watch against the verified pricing catalogue before requesting external evidence. Exact SKU lookup remains authoritative; a legacy watch may be reconciled only when normalized game, name, collector number, finish, language, and product type produce one unambiguous physical match. Set is preferred when labels agree, but unique reconciliation tolerates evidenced provider label drift such as Scryfall “Store Championships” versus the catalogue “Game Day & Store Championship Promos.” Preserve the membership key while upgrading its stored catalogue identity. Return structured JSON failures, preserve the last successful observation, and expose provider configuration health separately from a local request budget.

## Functional Requirements

- Exact catalogue watches refresh from the local pricing repository first.
- Legacy provider identities are reconciled only on a unique strict match.
- Ambiguous or missing matches fail honestly without rewriting identity.
- Failed attempts do not change `lastRefresh`, `lastObservation`, valuation, trend, or history.
- `Refresh Failed` takes precedence over recent-refresh presentation.
- Target difference and target state remain unavailable when no target is set.
- Market snapshot routes convert expected provider failures into structured JSON.
- Provider health reports configured, enabled, and usable state without exposing secrets or claiming upstream quota.

## Non-Functional Requirements

- No provider request is required when verified catalogue evidence can answer the watch.
- Reconciliation is deterministic and idempotent.
- Last-known-good market evidence survives all failed attempts.
- Secrets remain server-side and are never returned by health endpoints.

## User Stories

- As an operator, I want refresh failures to explain the real problem so I can recover quickly.
- As an owner, I want legacy watches repaired safely when catalogue identity is unambiguous.

## Acceptance Criteria

- A failed refresh never displays as recently refreshed.
- A watch with target `0` has no target difference.
- The API always returns parseable JSON for expected refresh failures.
- An exact or uniquely reconciled catalogue watch refreshes without a live-provider call.
- Provider health is truthful and secret-free.

## Edge Cases

- Multiple catalogue candidates remain unresolved.
- A sealed product cannot reconcile to a single.
- A configured provider that is disabled is reported as disabled, not healthy.
- Existing last-good evidence is preserved when every provider fails.

## Dependencies

- `PHR-WORKFLOW-005`
- `PHR-API-003`
- Verified pricing repository

## Non-Goals

- Bulk provider refresh.
- Scraping or inferred sold-copy evidence.
- Automatic external credential creation.

## Traceability

- Origin: Product Owner event-operations improvement approval, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-TECH-010-refresh-integrity-provider-health-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Related release notes: `docs/release-notes/PHR-CARD-SHOW-OPERATIONS-20260730.md`.
- Last modified: 2026-07-30.
- Modification reason: Initial approved specification.
