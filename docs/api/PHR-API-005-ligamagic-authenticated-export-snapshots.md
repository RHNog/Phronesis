# PHR-API-005 — LigaMagic Authenticated Export Snapshots

## Feature ID

`PHR-API-005`

## Title

LigaMagic authenticated collection-export snapshots

## Status

Completed — Schedule Gated

## Priority

Critical

## Category

API / Market Evidence / Local Integration / Browser Automation / Reliability

## Objective

Use LigaMagic's account-owned collection CSV export to create a complete, locally retained, auditable Magic pricing snapshot without scraping marketplace pages or requiring the Product Owner to download each collection manually.

## Background

LigaMagic is the lead Magic marketplace and default pricing reference for the Product Owner's Brazilian operations. The account contains 37 collections covering roughly 330,000 English Near Mint Magic items and variations. LigaMagic caps collections at 10,000 entries but provides an authenticated CSV export with English edition/name, edition code, collector number, condition, language, extras, and price summaries.

The Product Owner defines LigaMagic semantics as follows:

- `Compra`: price a consumer pays to acquire the card from a store.
- `Venda`: price a store is willing to pay to acquire the card from a consumer.

Anonymous automation receives HTTP 403. The approved source is the site's own authenticated collection-export workflow.

## Problem Statement

Manual export of every collection is slow, error-prone, and cannot reliably support daily Brazilian market evidence or future cross-market arbitrage. Phronesis needs a conservative authenticated export client, exact schema validation, durable raw evidence, and a fail-closed merged snapshot.

## Proposed Solution

1. Create a dedicated Chrome persistent profile under ignored `.data/ligamagic/browser-profile/`.
2. Launch that profile as ordinary Chrome, with no Playwright attachment, while the Product Owner performs login, CAPTCHA, and any verification personally. Never accept, read, copy, log, or store the password outside the browser profile.
3. For export only, relaunch the saved profile as ordinary Chrome on a dedicated local debugging port and attach Playwright over CDP after authentication has already been established. This mirrors the locally proven TCGPlayer Pricing Tool boundary and avoids attempting authentication inside an automation-launched browser.
4. Discover the current collection options from the authenticated export form instead of hardcoding 37 lots.
5. Select deterministic card-number ordering and the explicit `Padrão LigaMagic CSV [Modelo para Coleções]` format. The shorter `Padrão LigaMagic CSV` format is a distinct 13-column, price-free export and must be rejected.
6. Export one supervised pilot collection while recording sanitized request/response/download behavior.
7. Export every discovered collection sequentially for a non-scheduled dry run with conservative pacing and bounded retry.
8. Preserve each raw file with collection label, advertised card quantity, exported row count and quantity, export timestamp, byte size, and SHA-256 receipt.
9. Decode mixed UTF-8/Windows-1252 input, validate the 19-column contract, normalize BRL values to integer centavos, and reject malformed values.
10. Merge rows by exact LigaMagic identity: English edition, edition code, English card name, collector number, extras, condition, and language.
11. Produce an ignored SQLite dry-run snapshot and JSON manifest without activating a daily schedule or replacing another provider's data.

## Functional Requirements

- `ligamagic:profile` opens only the configured LigaMagic export origin in an ordinary, dedicated Chrome profile without Playwright connected, then exits while the user controls authentication.
- `ligamagic:pilot` exports one named or first discovered collection and records sanitized request behavior plus a validated raw receipt.
- `ligamagic:dry-run` discovers and exports every visible collection, validates each advertised card count against the CSV `Quantidade` sum, records unique-entry rows separately, and creates a merged snapshot only after every collection succeeds.
- Export selection is semantic: collection options must look like named collections with advertised card counts; ordering must expose `Número do Card`; format must expose the exact collection-model CSV option. The price-free 13-column format is never accepted as equivalent.
- Request capture excludes headers, cookies, storage, query values, and request bodies. It retains only method, origin, path, query-key names, resource type, status, safe response metadata, and download evidence.
- The CSV parser accepts a UTF-8 BOM and isolated Windows-1252 bytes without corrupting valid UTF-8 sequences.
- Required identity and price columns are exact and versioned. Schema drift fails before snapshot creation.
- `Compra` values normalize to consumer-facing store prices; `Venda` values normalize to store buy offers. Zero remains explicit absence/unavailable evidence and is not converted into a market price.
- Exact duplicate identities are reported. Conflicting duplicates remain visible and prevent the dry run from claiming an unqualified complete snapshot.
- The dry run records checkpoint start/end times because 37 exports are not an atomic upstream transaction.
- No schedule is installed, enabled, or modified.

## Non-Functional Requirements

### Performance

Process roughly 330,000 rows locally without per-row network calls. Export collections sequentially to minimize LigaMagic load.

### Scalability

Discover collection count dynamically and support more than 37 collections without code changes.

### Maintainability

Separate browser acquisition, CSV contract/normalization, receipt validation, and SQLite snapshot assembly.

### Reliability

Use run-specific staging, hashes, exact row-count checks, atomic final-file rename, and last-good preservation. Authentication expiry, CAPTCHA, 403/429, incomplete download, schema drift, or collection-count mismatch stops the run with actionable evidence.

### Accessibility

No production UI is added in this slice. Authentication remains a normal visible browser interaction controlled by the user.

### Offline Support

Validated raw exports and the completed dry-run snapshot remain queryable locally without LigaMagic access.

### Security

- No password, cookie, session token, CSRF value, browser storage, or raw request body enters Git, logs, manifests, or Phronesis databases.
- No Safari or default-Chrome cookie database is copied, read, or modified; only the dedicated LigaMagic Chrome profile is used.
- Browser profile and all downloaded data remain under ignored `.data/ligamagic/` with owner-only local permissions where supported.
- The automation must not bypass CAPTCHA, rate limits, authentication, or access controls.

### Extensibility

The normalized snapshot must preserve source identity and evidence semantics for later exact crosswalk and arbitrage features without embedding arbitrage formulas in acquisition.

### Responsiveness

Not applicable to this command-line/local integration slice.

## User Stories

- As the owner, I want every LigaMagic collection exported without manual repetition so that Brazilian pricing evidence stays maintainable.
- As a buyer, I want `Compra` and `Venda` kept distinct so that future arbitrage does not reverse acquisition and liquidation values.
- As an operator, I want failed or expired authentication to stop safely and tell me to reauthenticate.

## Acceptance Criteria

- A dedicated ignored profile opens the authenticated export workflow without copying credentials.
- One supervised collection download produces a sanitized request trace, raw SHA-256 receipt, and schema-valid normalized result.
- A complete dry run exports every discovered collection and reconciles every advertised card count against summed CSV quantity. Row count remains a separate unique-entry measure because one exported row may represent quantity greater than one.
- A merged SQLite snapshot and manifest report total rows, unique identities, duplicate/conflict counts, price coverage, checkpoint window, and every raw source hash.
- Mixed encoding, malformed schema, truncated export, missing collection, duplicate conflict, authentication expiry, and HTTP failure have focused tests or deterministic validation.
- Supported full suite, standalone TypeScript, warning-free lint, production build, and diff checks pass.

## Edge Cases

- A login page replaces the export form: stop with `REAUTHENTICATION_REQUIRED`.
- LigaMagic changes option labels or CSV headers: stop with `SCHEMA_DRIFT` and preserve raw evidence.
- A collection is renamed or added: discovery updates the run manifest automatically.
- An exported quantity differs from the selector card count: reject the run. A lower row count is valid only when summed `Quantidade` reconciles exactly.
- The same exact identity appears in multiple collections: retain provenance, report duplication, and distinguish identical from price-conflicting duplicates.
- Isolated Windows-1252 bytes appear in an otherwise UTF-8 file: decode deterministically without replacement characters.
- The browser presents CAPTCHA or verification: stop for user interaction; do not attempt bypass.

## Dependencies

- Existing installed Google Chrome.
- `playwright-core` using Chrome rather than downloading a bundled browser.
- TCGPlayer Pricing Tool's locally proven plain-Chrome authentication plus post-login CDP attachment pattern, inspected read-only on 2026-07-30.
- `PHR-API-003` market-evidence distinctions.
- `PHR-WORKFLOW-004` verified snapshot and last-good reliability precedent.

## Future Enhancements

- 03:00 America/New_York daily launchd execution with next-wake recovery.
- Exact LigaMagic-to-TCGplayer/Scryfall crosswalk with quarantine.
- USD/BRL landed-cost and two-way arbitrage intelligence.
- LigaPokémon acquisition after separate approval and evidence.

## Technical Notes

The dry-run database is provider-owned and must not mutate the canonical TCGplayer pricing repository. No anonymous fetch, marketplace-page scraping, schedule, or arbitrage action is in scope.

## UI / UX Notes

The CLI must print concise state transitions and an explicit instruction when user-controlled login is required. It must never print session material.

## Success Metrics

- 100% of discovered collections exported or the run fails closed.
- 100% of raw files have hashes, exact advertised-quantity reconciliation, recorded row counts, and schema validation.
- Zero credential/session values in repository or run evidence.
- Complete dry-run snapshot covers the account's advertised collection rows with quantified duplicates/conflicts.

## Open Questions

- None blocking for the supervised dry run. Scheduling and arbitrage-cost assumptions remain future gates.

## Traceability

- Originating direction: Product Owner, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-API-005-ligamagic-authenticated-export-snapshots-prompt.md`.
- Related tests: `docs/testing/PHR-API-005-ligamagic-authenticated-export-snapshots-validation.md`.
- Related release notes: `docs/release-notes/PHR-API-005.md`.
- Last modified: 2026-07-30.
- Modification reason: record successful plain-Chrome/CDP acquisition, exact quantity semantics, supervised pilot evidence, and the complete non-scheduled dry-run snapshot.
