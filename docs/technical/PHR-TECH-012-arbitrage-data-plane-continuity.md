# PHR-TECH-012 — Arbitrage Data-Plane Continuity

## Feature ID

`PHR-TECH-012`

## Title

Arbitrage data-plane continuity

## Status

Implemented — live private verification passed

## Priority

Critical

## Category

Technical / Database / Reliability / Workflow / Testing

## Objective

Keep Phronesis catalogue search, regional crosswalks, and arbitrage candidates on one operational SQLite database across direct starts, private-review starts, catalogue refreshes, and runtime recovery.

## Background

The verified LigaMagic crosswalk contains 131,869 matched identities and 129,809 price-comparable candidate rows in `.data/mobile-review.sqlite`. A manually recovered private runtime started Next.js directly without `PHRONESIS_PRICING_DB_PATH`, opened `.data/pricing-lookup.sqlite`, and returned zero candidates. The second database contains current catalogue rows but a fully unmatched regional crosswalk.

The private LaunchAgent also starts raw Next.js rather than the repository launcher, so its pricing observer is absent even when the LaunchAgent is available.

## Problem Statement

Database-path defaults differ across runtime and maintenance scripts. A runtime recovery can silently select a different database, while a later Magic catalogue import does not automatically rebuild the LigaMagic crosswalk. The UI then reports zero exact candidates even though verified regional evidence exists.

## Proposed Solution

- Define one shared operational pricing-database resolver. Preserve `PHRONESIS_PRICING_DB_PATH` as an explicit override and make the existing private-review database the default operational file.
- Route server repositories and pricing/artwork/provider maintenance scripts through that resolver.
- Start private review through `scripts/start-phronesis.mjs` so the catalogue observer is supervised with Next.js.
- Make supervisor shutdown terminate its children and parent together so remote recovery cannot leave duplicate wrappers or orphaned Next.js listeners.
- After a newly imported Magic checkpoint, rebuild the regional crosswalk from the latest complete LigaMagic snapshot before reporting regional readiness.
- Record acquisition and reconciliation failures without deleting the last-good snapshot or fabricating candidates.

## Functional Requirements

- Direct and LaunchAgent starts resolve the same operational database without requiring ambient shell state.
- `pricing:sync`, `pricing:watch`, `regional:crosswalk`, PriceCharting, artwork, sealed, and server repositories use the same resolver unless an explicit test/operator override is supplied.
- A newly imported `magic-en` checkpoint triggers exactly one regional reconciliation after catalogue import.
- Non-Magic imports do not rebuild the Magic/LigaMagic crosswalk.
- A reconciliation failure leaves catalogue data and the previous committed crosswalk readable and emits a sanitized failure.
- Runtime recovery instructions preserve the operational database environment.

## Non-Functional Requirements

### Performance

Reconcile only after a new Magic import or a new regional snapshot, never on every ten-second observer poll.

### Scalability

The resolver and reconciliation hook must support additional regional providers without creating another operational pricing database.

### Maintainability

Database-path ownership lives in one module. Call sites must not independently invent fallback filenames.

### Reliability

Crosswalk replacement remains transactional. Last-good catalogue archives and provider snapshots are retained.

### Accessibility

No accessibility behavior changes.

### Offline Support

The last-good operational database remains queryable when upstream acquisition or network access fails.

### Security

No credentials, cookies, raw request values, or local secret contents enter logs or repository files.

### Extensibility

Future LigaPokemon reconciliation may reuse the same operational database and checkpoint hook after its source contract is verified.

### Responsiveness

The existing responsive arbitrage surface is preserved.

## User Stories

- As the Product Owner, I want exact arbitrage candidates to survive runtime recovery so that a service restart cannot silently switch data planes.
- As an operator, I want new catalogue checkpoints to refresh the regional crosswalk automatically.

## Acceptance Criteria

- The operational runtime lists the verified regional candidate population from the canonical database.
- All database-path call sites share the resolver or use an explicit test override.
- Private review supervises the pricing observer.
- A new Magic import invokes bounded crosswalk reconciliation; an unchanged checkpoint does not.
- Focused tests, full tests, TypeScript, lint, build, and diff hygiene pass.

## Edge Cases

- The explicit database path is empty or whitespace: ignore it and use the canonical default.
- The latest LigaMagic snapshot is absent: preserve existing regional state and report the missing dependency.
- Reconciliation fails after a successful catalogue import: catalogue health and regional health remain separate, visible facts.
- The upstream checkpoint is unchanged: do not rebuild.

## Dependencies

- `PHR-WORKFLOW-004` snapshot-powered Vendor Workspace.
- `PHR-ARCH-013` regional evidence architecture.
- `PHR-WORKFLOW-007` two-way arbitrage verification.
- `PHR-API-005` LigaMagic snapshots.

## Future Enhancements

- Rename the legacy `mobile-review.sqlite` filename through a separately verified atomic migration.

## Technical Notes

The legacy filename is retained to avoid a risky 1.2 GB live-data rename during this repair. Canonical ownership is semantic and enforced by one resolver; a later migration may change the filename without changing repository contracts.

## UI / UX Notes

No new UI is required. The existing zero-candidate state becomes truthful again once the live runtime uses the verified database.

## Success Metrics

- One operational pricing database is selected across supported entry points.
- More than zero exact regional candidates are returned from the verified live state.
- No duplicate crosswalk rebuild occurs for an unchanged checkpoint.

## Open Questions

- None blocking.

## Traceability

- Originating prompt: Product Owner arbitrage recovery request, 2026-08-03.
- Related implementation prompt: `docs/prompts/PHR-TECH-012-arbitrage-data-plane-continuity-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-012-arbitrage-data-plane-continuity-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-012.md`.
- Last modified: 2026-08-03.
- Modification reason: initial specification after live zero-candidate diagnosis.
