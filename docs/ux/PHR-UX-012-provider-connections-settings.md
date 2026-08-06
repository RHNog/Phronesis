# PHR-UX-012 — Provider Connections Settings

## Feature ID

`PHR-UX-012`

## Status

Completed — CTO Accepted; Secure Registration Gated

## Objective

Make provider configuration health, activation requirements, and eventual registration controls discoverable in Settings without exposing secrets through compatibility mode.

## Product Decision

Settings is the canonical provider-control surface. The first slice displays live configured/enabled state and exact registration requirements. Credential entry remains locked until an authenticated owner session and encrypted server-side credential store are installed; unauthenticated tailnet users must never be allowed to write or read provider secrets.

## Acceptance Criteria

- Settings shows JustTCG, eBay Browse, and CardTrader health.
- Each provider identifies the server-side registration and activation requirements without returning values.
- The panel clearly explains why credential registration is locked.
- Provider secrets remain absent from page data, API responses, logs, and tracked files.
- The Employee login readiness checklist gives the exact private GitHub callback and safe OPTIONAL-to-REQUIRED rollout.

## Non-Goals

- Persisting secrets before required owner authentication is operational.
- Public provider registration or account creation.
- Inferring quotas or enabling scraping.

## Traceability

- Origin: Product Owner request, 2026-07-30.
- Work order: `docs/prompts/PHR-UX-012-provider-connections-settings-prompt.md`.
- Validation: `docs/testing/PHR-UX-012-provider-connections-settings-validation.md`.
