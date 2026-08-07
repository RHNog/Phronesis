# PHR-UX-012 — Provider Connections Settings

## Feature ID

`PHR-UX-012`

## Title

Provider Connections And Regional Acquisition Health

## Status

Completed — Operational Health Live; Product Review Ready

## Priority

High

## Category

UX / UI / Settings / Provider Governance / Security / Operations

## Objective

Make every operational provider's current configuration, activation requirement, and last-known health discoverable in one focused Settings panel without exposing provider credentials or misplacing provider cards elsewhere in Administration.

## Background

The first Provider Connections slice covered JustTCG, eBay Browse, and CardTrader, then accumulated PkmnPrices, PSA, and PriceCharting. `PHR-API-013` later added recurring LigaMagic and LigaPokemon acquisition with a private atomic status receipt, but Settings never consumed it. The Settings Control Center subsequently separated Providers from other administrative work, while the provider card catalogue and ordering remained stale.

## Problem Statement

An owner can see PriceCharting and credential-backed services but cannot see LigaMagic or LigaPokemon acquisition health. The absence hides actionable states such as reauthentication, successful snapshot creation, source-count mismatch, and promotion status. A flat provider grid also gives PriceCharting no stable semantic placement and makes provider order look accidental.

## Proposed Solution

Keep Settings → Providers as the only provider-control surface and divide it into three explicit groups:

1. **Regional marketplaces:** LigaMagic, then LigaPokémon.
2. **Market and valuation feeds:** JustTCG, then PriceCharting, eBay Browse, and CardTrader.
3. **Specialized services:** PkmnPrices Sealed, then PSA Certificates.

The server reads the existing private `PHR-API-013` atomic status receipt and returns only a sanitized operational projection. Regional cards display configuration, schedule, last completion, snapshot receipt, promotion result, and the sanitized provider outcome. They do not accept credentials: owner authentication remains in each isolated local browser profile. Credential-backed cards retain encrypted owner-only setup.

## Functional Requirements

- Show LigaMagic and LigaPokémon as the first provider group.
- Read regional health from `PHRONESIS_REGIONAL_ACQUISITION_ROOT/status.json`, defaulting safely to the repository-owned private data root when explicitly configured at deployment.
- Report `NOT_CONFIGURED`, `NEVER_RUN`, `RUNNING`, `SUCCESS`, `REAUTHENTICATION_REQUIRED`, `SCHEMA_DRIFT`, `SOURCE_COUNT_MISMATCH`, `SKIPPED_SAME_DAY`, or `FAILED` without converting one state into another.
- Show the last completed timestamp, snapshot run ID, promotion status, daily 03:00 America/New_York schedule, and sanitized outcome message when available.
- Determine configured state from the presence of the provider's private configuration file without reading or returning its contents.
- Keep Liga browser-profile authentication outside the credential vault and render no password field, Save, or Remove action for either Liga provider.
- Place PriceCharting inside Market and valuation feeds after JustTCG and before listing providers.
- Keep PriceCharting snapshot summaries attached only to its own card.
- Provide a visible Refresh status action that performs a fresh uncached authorized read and announces completion or failure.
- Require Administration view authorization for the provider-health route because the component exists only inside Administration Settings.

## Non-Functional Requirements

### Performance

Read one bounded JSON receipt and two configuration-file existence checks per refresh. Do not scan acquisition runs or provider profiles.

### Scalability

Provider definitions and group membership remain data-driven so another provider can be placed without duplicating card rendering.

### Maintainability

Keep private filesystem projection in a server-only Liga health module. The Client Component consumes a serializable response and contains no filesystem or environment access.

### Reliability

Missing, malformed, or unreadable status returns an honest configured/never-run or not-configured state. It must not break the other provider cards.

### Accessibility

Groups have headings and descriptions, provider cards retain semantic headings and definition lists, Refresh is at least 44 pixels, and status feedback uses a live region.

### Offline Support

Settings reads local Phronesis evidence and remains independent of provider network availability. It does not trigger a Liga acquisition.

### Security

- Never return profile paths, credentials, cookies, browser storage, tokens, request bodies, or raw provider configuration.
- Return only allowlisted status fields and a bounded sanitized message.
- Keep credential mutation behind permanent `ADMINISTRATION:ADMIN` identity.
- Do not add public provider control.

### Extensibility

Future owner-authorized acquisition actions may use separate audited routes without changing the read-only health projection.

### Responsiveness

Groups and cards use one column on phones, two on large screens, and three only on wide screens without horizontal overflow.

## User Stories

- As the owner, I want LigaMagic and LigaPokémon health in Settings so I can see whether regional evidence is current or needs intervention.
- As the owner, I want PriceCharting grouped with valuation feeds so its placement communicates its function.
- As an administrator, I want to refresh status without reloading or scrolling through unrelated Settings panels.

## Acceptance Criteria

- The live Providers panel renders the three groups in the specified order.
- LigaMagic displays the current `REAUTHENTICATION_REQUIRED` receipt truthfully when that is the stored outcome.
- LigaPokémon displays the current successful snapshot and promotion evidence when that is the stored outcome.
- PriceCharting appears only in Market and valuation feeds and follows JustTCG.
- Liga cards expose no credential controls or secret-bearing data.
- Missing/malformed receipts fail safely and other provider cards still render.
- Focused tests, the full suite, TypeScript, lint, production build, diff checks, responsive browser review, live API evidence, and private deployment pass.

## Edge Cases

- No status receipt but configuration exists: show `NEVER_RUN`.
- No receipt and no configuration: show `NOT_CONFIGURED`.
- One provider outcome is absent: derive only that provider's safe fallback.
- A legacy generic `FAILED` message contains a classified failure: reuse the existing sanitizer/classifier.
- A run is in progress with no completion: show `RUNNING` and omit last completion.
- The receipt is malformed or unavailable: do not retain a false client-side success after refresh.

## Dependencies

- `PHR-API-013` recurring Liga network acquisition.
- `PHR-UX-029` Settings Control Center.
- `PHR-ARCH-016` permanent Administration authorization.
- Existing provider credential vault and provider-health route.

## Future Enhancements

- Audited owner actions for opening the local reauthentication workflow or triggering a bounded acquisition.
- Freshness policy and alerting once Product Owner thresholds are defined.

## Technical Notes

Use `readRegionalAcquisitionStatus` as the receipt parser and project it through a new server-only helper. Runtime deployment must set `PHRONESIS_REGIONAL_ACQUISITION_ROOT` to the canonical acquisition evidence root when the app runs from a worktree.

## UI / UX Notes

Regional marketplaces lead because they are Phronesis-owned acquisition operations requiring owner attention. PriceCharting remains a market/valuation feed; it is neither an Administration overview card nor a regional marketplace. Managed Liga cards use an operational details block instead of a fake credential form.

## Success Metrics

- Two of two Liga providers have visible truthful health.
- Zero provider secrets or profile paths cross the API.
- PriceCharting has one deterministic group and position.
- One refresh updates every provider card without a page reload.

## Open Questions

- Whether an owner-authorized UI action should launch local provider reauthentication remains a separate security/workflow decision.

## Traceability

- Originating prompt: Product Owner immediate deployment correction, 2026-08-07.
- Related implementation prompt: `docs/prompts/PHR-UX-012-provider-connections-settings-prompt.md`.
- Related implementation report: `docs/implementation-reports/PHR-UX-012-provider-connections-settings-report.md`.
- Related tests: `docs/testing/PHR-UX-012-provider-connections-settings-validation.md`.
- Related conformance review: `docs/reviews/PHR-ARTWORK-PROVIDER-SETTINGS-20260730-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-UX-012-provider-connections-settings.md`.
- Last modified: 2026-08-07.
- Modification reason: add missing Liga acquisition health, deterministic provider grouping, and correct PriceCharting placement.
