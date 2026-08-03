# PHR-API-012 — PriceCharting Multi-Game Daily Snapshots

## Feature ID

`PHR-API-012`

## Status

Implemented — Product Review Ready; Activation And Scheduler Gated

## Priority

Critical

## Category

API / Database / Identity / Market Evidence / Automation / Reliability

## Objective

Extend the receipt-backed PriceCharting importer from Pokémon to English Magic and English One Piece, maximize deterministic physical-card compatibility against the current Phronesis catalogue, and provide a restart-safe daily CSV acquisition routine that promotes only complete validated receipts.

## Background

`PHR-API-011` established immutable source receipts, reason-coded identity resolution, collision quarantine, independent PriceCharting observations, and atomic active-receipt pointers for Pokémon. The owner has now supplied a 130,186-row Magic guide and an 11,854-row One Piece guide. PriceCharting documents that Legendary subscribers can download complete CSV guides, that guides are generated once every 24 hours, and that CSV calls are limited to one every ten minutes.

The supplied Magic file contains 129,485 eligible Magic single rows and 694 sealed rows. Phronesis currently contains 158,857 Magic singles across 444 sets. The supplied One Piece file contains 6,122 eligible English single rows, 89 English sealed rows, and 5,643 non-English rows; Phronesis contains 6,894 English One Piece singles across 83 sets.

## Problem Statement

The current importer rejects every game profile except `pokemon-en`, assumes Pokémon collector syntax and finish semantics, and exposes only the Pokémon receipt in health and evidence reads. Manual CSV downloading also leaves snapshot freshness dependent on the owner.

Magic and One Piece cannot safely share the Pokémon resolver. Magic frequently separates foil and treatment in bracket qualifiers and may omit a collector number. One Piece embeds prefixed collector numbers such as `OP07-002` without `#`, represents parallels and promotional distributions through provider qualifiers, and mixes English and Japanese catalogues in one export. The PriceCharting `tcg-id` values in the supplied files do not form a semantically valid join to Phronesis `source_sku` values and therefore cannot be accepted without independent physical-identity agreement.

## Proposed Solution

1. Add versioned `magic-en` and `onepiece-en` identity profiles to the existing receipt importer.
2. Preserve the Pokémon v9 path unchanged.
3. Resolve Magic through canonical set aliases, exact normalized card name, collector evidence when present, finish parity, treatment annotations, and one-target uniqueness.
4. Resolve One Piece through canonical set aliases, exact normalized card name, prefixed collector number, language, distribution/treatment annotations, and one-target uniqueness. Cross-set promotional routing is allowed only when the source qualifier explicitly proves the alternate distribution and the resulting target is unique.
5. Keep Japanese One Piece rows unsupported for the English profile and preserve them in receipt metrics.
6. Continue routing sealed rows to review rather than automatically attaching them.
7. Keep every many-source-to-one-target result in `TARGET_COLLISION`; price, sales volume, release date, row order, and `tcg-id` cannot break ties.
8. Add encrypted Settings fields for the owner’s two PriceCharting CSV download URLs alongside the existing API token.
9. Add a server-only daily synchronizer that downloads from allow-listed HTTPS PriceCharting URLs, spaces provider CSV requests by at least ten minutes, validates the complete 27-column/game contract, imports each game independently, and atomically promotes its receipt.
10. Persist per-UTC-day sync state. A successful game is skipped for the rest of the day; a failed game may retry without affecting the active receipt.

## Functional Requirements

- Supported profiles are `pokemon-en`, `magic-en`, and `onepiece-en`.
- Every receipt records its profile-specific resolver version.
- Magic aliases are explicit and deterministic. No token-overlap score or edit-distance threshold may resolve a row.
- One Piece collector parsing must recognize `OP`, `ST`, `EB`, `P`, `PRB`, `EX`, `DP`, and equivalent supported prefixed forms, remove repeated trailing collector evidence, and preserve leading zeroes canonically.
- Physical qualifiers must distinguish base, foil, borderless, extended-art, showcase, retro-frame, etched, surge, serialized, alternate-art, parallel, manga, SP, pre-release, winner, promotional, reprint, and other explicitly supported treatments.
- An unqualified source may not attach to an annotated special treatment merely because name/set/collector agree.
- Provider `tcg-id` remains stored evidence but is never a sole or tie-breaking identity key.
- Non-English One Piece records remain `UNSUPPORTED/NON_ENGLISH` for `onepiece-en`.
- Sealed records remain `REVIEW_REQUIRED/SEALED_PROFILE_DEFERRED`.
- Evidence reads use the active receipt matching the requested target category.
- Health can report all three game profiles without exposing provider secrets or download URLs.
- Daily download URLs must be HTTPS on `pricecharting.com` or `www.pricecharting.com`, must not contain username/password components, and must never appear in logs, errors, reports, or client responses.
- Downloads must have the exact 27-column schema, non-empty rows, the expected game majority, and a complete byte hash before import.
- The synchronizer must enforce the documented ten-minute interval between CSV requests.
- A failed download, wrong-game file, schema change, shifted row, parse failure, collision failure, or promotion failure preserves the prior active pointer.
- The routine supports one-shot and watch modes. Watch mode targets one run per UTC day at the documented Phronesis operational time; database state prevents duplicate promotion after restarts.

## Non-Functional Requirements

### Reliability

Receipts are immutable, download promotion is atomic per game, and daily state is restart-safe. Partial cross-game success is explicit: one game may advance while another preserves its prior receipt.

### Security

The API token and guide URLs stay in the encrypted provider vault or server-only environment variables. URL validation prevents credential forwarding to another host. Secret-bearing values are redacted from all messages.

### Performance

Resolution uses precomputed indexes rather than per-row full-catalogue scans. The 130k-row Magic file must remain practical on the event MacBook.

### Auditability

Reports retain per-profile hashes, versions, denominators, methods, reason codes, language counts, product types, price lanes, and collision counts.

## User Stories

- As the owner, I want Magic and One Piece graded evidence attached to the same canonical products I use at an event.
- As a buyer, I want the selected card’s active PriceCharting evidence without opening a browser.
- As the owner, I want each subscribed guide refreshed once daily without manually downloading and importing files.
- As an auditor, I want uncertain, duplicate, Japanese, sealed, and malformed rows visible but inactive.

## Acceptance Criteria

- Both supplied owner files complete dry-run import without schema or runtime failure.
- Magic and One Piece mappings require exact versioned evidence and never use bare `tcg-id` identity.
- Every accepted mapping is one provider product to one Phronesis SKU and every target is unique within its receipt.
- English/non-English and single/sealed totals reconcile exactly to the source receipt.
- Coverage improvements and remaining residuals are recorded against source and catalogue hashes.
- Daily sync downloads only allow-listed PriceCharting URLs, validates the expected game, waits ten minutes between calls, and promotes only completed receipts.
- Same-day successful reruns perform no provider call or duplicate import.
- A failed second game does not roll back or corrupt the successfully promoted first game and does not replace its own previous active receipt.
- Settings can securely register the API token and both download URLs; none are returned to the browser.
- Pokémon importer behavior and v9 fixtures remain unchanged.
- TCG Direct Low, TCG Low, TCG Market, artwork, recommended offers, inventory, Event Ledger, and purchase receipts remain isolated from PriceCharting bulk observations.

## Non-Goals

- Automatic mapping of sealed PriceCharting rows.
- Importing Japanese One Piece into the English catalogue.
- Fuzzy name matching or probabilistic confidence thresholds.
- PriceCharting historical sales/history, which the provider does not expose through this CSV/API contract.
- Installing or enabling a host LaunchAgent without a separate operational action.
- Treating PriceCharting values as TCGplayer Direct Low or changing `PHR-BR-001` precedence.

## Dependencies

- `PHR-API-011` PriceCharting Bulk Evidence Import.
- `PHR-UX-021` Secure Provider Registration.
- Current TCGplayer-derived `pricing_products` catalogue.
- Legendary PriceCharting subscription with Magic and One Piece guide access.

## Recovery

- Keep the previous active receipt pointer for each game until the new receipt and observations commit.
- Retain failed receipts and daily failure state for diagnosis.
- Retry only the failed game; never delete or rewrite the last-good receipt.
- Disable watch mode or remove the two encrypted CSV URLs to stop external acquisition without affecting active evidence.

## Traceability

- Originating request: current CTO chat, 2026-08-01.
- Implementation prompt: `docs/prompts/PHR-API-012-pricecharting-multigame-daily-snapshots-prompt.md`.
- Validation: `docs/testing/PHR-API-012-pricecharting-multigame-daily-snapshots-validation.md`.
- Related decision: explicit evidence profiles and provider-host allow-list; no bare `tcg-id` join.
- Owner-file implementation result: Magic receipt 4 accepted 109,841 of 129,485 eligible singles (84.83%) and One Piece receipt 5 accepted 4,731 of 6,122 eligible English singles (77.28%), both as dry runs with no active-pointer mutation.
- Release notes: `docs/release-notes/PHR-API-012-pricecharting-multigame-daily-snapshots.md`.
- Last modified: 2026-08-01.
- Modification reason: completed multi-game reconciliation, secure daily acquisition routine, Settings integration, tests, and owner-file dry runs.
