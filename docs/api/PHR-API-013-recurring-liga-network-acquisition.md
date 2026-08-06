# PHR-API-013 — Recurring Liga Network Acquisition

## Feature ID

`PHR-API-013`

## Title

Recurring LigaMagic and LigaPokemon snapshot acquisition

## Status

Implemented — schedule active; LigaPokemon snapshot verified

## Priority

Critical

## Category

API / Market Evidence / Browser Automation / Reliability / Workflow / Testing

## Objective

Run a conservative daily 03:00 authenticated LigaMagic collection export, rebuild regional evidence after a complete snapshot, and add a fail-closed LigaPokemon acquisition profile that can advance only after an owner-authenticated pilot proves its exact export contract.

## Background

`PHR-API-005` proved the LigaMagic account-owned collection-export workflow with a dedicated Chrome profile, 37 collections, 329,301 unique identities, exact quantity reconciliation, and zero conflicting duplicates. Scheduling was deliberately deferred. The Product Owner now authorizes recurring LigaMagic acquisition and asks to add LigaPokemon.

Official LigaPokemon pages confirm the same authenticated collection and `?view=colecao/export` boundary. An owner-authenticated pilot on 2026-08-03 established the exact 20-column CSV contract without exposing credentials, cookies, or browser storage.

## Problem Statement

LigaMagic regional evidence is frozen at the July 30 supervised run. There is no durable scheduled job, overlap lock, last-run status, or automatic crosswalk handoff. LigaPokemon has no dedicated profile, schema receipt, snapshot assembly, or recurrence boundary.

## Proposed Solution

- Generalize the proven Liga collection-export client through allowlisted provider contracts for LigaMagic and LigaPokemon.
- Preserve separate owner-only profile, configuration, run, and receipt roots for each provider.
- Keep exact provider hosts, export routes, format labels, CSV schemas, and database table prefixes explicit and fail closed on drift.
- Add a once-only regional acquisition orchestrator with an exclusive lock, atomic status receipt, last-good preservation, and sanitized errors.
- Run LigaMagic daily at 03:00 America/New_York through a repository-owned per-user LaunchAgent definition.
- Register LigaPokemon profile/pilot/full-snapshot commands. Recurrence reports `NOT_CONFIGURED` until the Product Owner completes login and a pilot validates the exact format; it must not scrape public marketplace pages or assume schema compatibility.
- After a complete provider snapshot, rebuild its operational regional crosswalk. `PHR-API-014` supplies the isolated exact Pokémon crosswalk; Pokémon promotion into Arbitrage remains separately gated.

## Functional Requirements

- Provider configuration allowlists only `ligamagic.com.br`/`www.ligamagic.com.br` or `ligapokemon.com.br`/`www.ligapokemon.com.br` and the authenticated `colecao/export` view.
- Each provider uses a distinct ignored browser profile, debug port, configuration, run root, and receipts.
- The owner performs login, CAPTCHA, and verification in ordinary Chrome. Automation never enters or reads credentials.
- The owner profile/login and pilot use the same visible dedicated Chrome session. The pilot attaches only after owner authentication and never reads credentials, cookies, or browser storage.
- Recurring export relaunches the same isolated profile in ordinary Chrome, waits for its loopback-only CDP endpoint, and attaches after page startup. LigaPokemon's browser challenge removes the authenticated controls from both headless and Playwright-launched headed contexts even when the saved session itself is valid.
- Pilot and full acquisition discover collections, deterministic ordering, exact provider CSV format, and the unique export control semantically.
- Every raw export is hash-bound and reconciles advertised quantity, rows, and summed quantity.
- A stable advertised/exported count mismatch is classified as `SOURCE_COUNT_MISMATCH` unless an exact Product Owner authorization exists.
- The approved count exceptions are exact LigaPokemon collection contracts: `Lote 10 (9.704 cards)` is authoritative at 9,700, `Lote 4 (9.870 cards)` at 9,868, `Lote RF 3 (9.983 cards)` at 9,982, and `Lote RF 6 (7.681 cards)` at 7,679. Each was independently repeat-exported byte-identically before Product Owner authorization. Receipts and snapshots preserve source-advertised and authoritative values plus `PRODUCT_OWNER_EXPORT` provenance. Any other label or quantity fails closed.
- The recurring orchestrator prevents overlap, records provider outcomes, preserves last-good runs, and never deletes failed evidence automatically.
- LigaMagic success triggers regional reconciliation against the canonical pricing database.
- LigaPokemon success triggers `PHR-API-014` reconciliation and is recorded only when both snapshot and crosswalk complete.
- LigaPokemon absence or expired authentication is explicit and does not invalidate last-good LigaMagic evidence.
- The LaunchAgent definition schedules 03:00 local time and uses the canonical JarvisSSD checkout.

## Non-Functional Requirements

### Performance

Providers run sequentially with conservative pacing; no per-card network requests are introduced.

### Scalability

Provider contracts support additional Liga-family sites without sharing profiles or weakening host/schema validation.

### Maintainability

Browser acquisition, provider contracts, CSV parsing, snapshot assembly, orchestration, and regional promotion remain separate modules.

### Reliability

Use run-specific staging, an exclusive lock, atomic status writes, exact hashes, transactional snapshot assembly, and last-good preservation.

### Accessibility

Owner authentication remains visible ordinary-browser interaction. No production UI changes in this slice.

### Offline Support

Completed raw exports, manifests, and SQLite snapshots remain queryable without provider access.

### Security

- Never record passwords, cookies, tokens, CSRF values, request bodies, query values, or browser storage.
- Never bypass CAPTCHA, rate limits, authentication, or access controls.
- Never scrape anonymous marketplace pages.
- Keep profiles and acquisition evidence ignored and owner-readable only.

### Extensibility

LigaPokemon may enter regional arbitrage only through the verified `PHR-API-014` exact identity crosswalk and a separate Product Owner evidence/candidate decision.

### Responsiveness

Not applicable to this command-line acquisition slice.

## User Stories

- As the Product Owner, I want fresh LigaMagic evidence each day without manually exporting 37 collections.
- As the Product Owner, I want LigaPokemon added through the same safe authentication boundary without guessed data.
- As an operator, I want a failed provider to preserve the last-good snapshot and explain the exact next action.

## Acceptance Criteria

- LigaMagic once-only acquisition can run from the existing dedicated profile and produces a complete verified snapshot or a sanitized reauthentication result.
- The recurring orchestrator prevents overlap and writes an atomic status receipt.
- The repository-owned LaunchAgent validates and schedules 03:00 local time.
- LigaPokemon profile and pilot commands use an isolated allowlisted profile and fail closed before schema promotion.
- No public marketplace scraping, credential capture, transaction, or provider mutation occurs.
- Focused tests, full tests, TypeScript, lint, build, plist validation, and diff hygiene pass.

## Edge Cases

- Mac sleeps through 03:00: launchd may run the calendar job after wake; the acquisition lock and same-day success receipt prevent duplicate promotion.
- Authentication expires: preserve last good and record `REAUTHENTICATION_REQUIRED`.
- A provider changes headers or format labels: preserve raw evidence and record `SCHEMA_DRIFT` without promotion.
- One provider succeeds and the other fails: record both outcomes independently.
- A previous process owns the lock: return `ALREADY_RUNNING` without starting another browser.

## Dependencies

- `PHR-API-005` LigaMagic authenticated export snapshots.
- `PHR-TECH-012` canonical operational pricing database.
- Existing Google Chrome and `playwright-core`.
- Owner-controlled LigaMagic and LigaPokemon accounts.

## Future Enhancements

- Product Owner-approved two-way Pokémon candidate exposure over the exact `PHR-API-014` crosswalk.
- Owner-facing acquisition health in Settings after the backend contract stabilizes.

## Technical Notes

LigaPokemon's public site and terms were inspected read-only on 2026-08-03. The Product Owner then completed one-time login in the isolated profile; the authenticated controls and exact CSV bytes were validated through the fail-closed pilot.

## UI / UX Notes

CLI outcomes use concise provider-specific states and exact reauthentication instructions. Secrets are never echoed.

## Success Metrics

- One complete LigaMagic snapshot per authorized day or one actionable failure receipt.
- Zero overlapping acquisitions.
- Zero credential/session values in repository or generated receipts.
- LigaPokemon records provider success only after a complete count-reconciled snapshot and successful exact regional crosswalk rebuild.

## Open Questions

- What evidence, cost, and executable-availability policy must be accepted before `PHR-API-014` mappings enter Arbitrage?

## Traceability

- Originating prompt: Product Owner arbitrage and recurring acquisition request, 2026-08-03.
- Related implementation prompt: `docs/prompts/PHR-API-013-recurring-liga-network-acquisition-prompt.md`.
- Related tests: `docs/testing/PHR-API-013-recurring-liga-network-acquisition-validation.md`.
- Related release notes: `docs/release-notes/PHR-API-013.md`.
- Last modified: 2026-08-04.
- Modification reason: connect successful LigaPokemon acquisition to the implemented `PHR-API-014` exact reconciliation while retaining the separate Arbitrage-exposure gate.
