# PHR-TECH-006 — Event Snapshot Activation And Resilient Ingestion

## Feature ID

`PHR-TECH-006`

## Status

Product Review Ready

## Priority

Critical

## Category

Technical / Database / Local Integration / Reliability

## Objective

Activate the freshest available Pricing Update Tool catalogues in Phronesis immediately and preserve every verified four-times-daily catalogue receipt through the August 1, 2026 card-show event.

## Background

The Pricing Update Tool successfully downloads Magic, Pokémon, and One Piece catalogues at 00:00, 06:00, 12:00, and 18:00. Its raw CSV files are transient and are deleted after each completed pricing cycle. The persistent Phronesis observer started after the July 29 18:00 cycle, so it could not import that cycle from the deleted files even though the same current catalogue rows remained available in the tool's local Postgres tables.

## Approved Solution

1. Recover the July 29 18:20 catalogues through read-only Postgres exports into an ignored Phronesis archive.
2. Import the normalized catalogue slices into the isolated mobile/desktop review database with the verified upstream completion times.
3. Keep the existing observer running continuously and archive each future verified CSV before importing it.
4. Accept the observed composite Magic export only by filtering configured, known product lines: import `Magic` rows for `magic-en`, ignore the known Pokémon and One Piece rows present in that composite source, and fail closed on any unknown product line.
5. Preserve source hashes and last-good transactional behavior. Do not modify Pricing Update Tool code, schedules, credentials, Postgres rows, marketplace inventory, or publication behavior.

## Immediate Activation Evidence

- Source cycle: July 29, 2026 at approximately 18:20 America/New_York.
- Raw archive: `.data/pricing-catalogues/20260729_182153/`.
- Normalized recovery archive: `.data/pricing-catalogues/20260729_182153/normalized/`.
- Magic: 795,931 rows, 162,091 products, checkpoint `2026-07-29T18:21:30-04:00`.
- Pokémon: 221,545 rows, 46,621 products, checkpoint `2026-07-29T18:21:44-04:00`.
- One Piece: 34,842 rows, 7,290 products, checkpoint `2026-07-29T18:21:53-04:00`.
- Active database: `.data/mobile-review.sqlite`.

## Functional Requirements

- Verified upstream files are copied to the local archive before import begins.
- Archive finalization is atomic and idempotent by category, checkpoint, and source hash.
- A copied archive must hash-identically to the verified source before it is accepted.
- The observer must continue serving the prior snapshot if archive or import work fails.
- Composite exports may contain only the three configured product lines; any other product line fails the import.
- Each category remains independently searchable and independently fresh.
- No retention deletion is automated before the event.

## Non-Functional Requirements

### Performance

Archival plus import must finish inside the normal transient catalogue lifetime and must not hold up the Pricing Update Tool.

### Reliability

Archive and import operations are fail-closed. Existing last-good SQLite data remains usable after any failure.

### Security

The recovery path uses read-only SQL queries, writes only under ignored Phronesis `.data/`, and never reads or records credentials.

### Offline Support

Imported prices remain usable without provider or marketplace network access.

## Acceptance Criteria

- All three July 29 catalogues are active and report non-stale timestamps on desktop and phone.
- The composite Magic source imports only Magic rows and still rejects an unknown product line.
- A verified upstream catalogue is archived before activation.
- Reprocessing the same receipt does not duplicate history.
- Focused ingestion tests, lint, build, and diff checks pass or retain only documented baseline debt.

## Recovery

Stop the Phronesis observer to stop future ingestion. Retain the last-good SQLite database and archived catalogues. Never delete or modify Pricing Update Tool data as part of Phronesis recovery.

## Non-Goals

- Triggering an extra marketplace pricing cycle.
- Changing the upstream four-times-daily schedule.
- Publishing prices, hiding inventory, or changing live store state.
- Automatic archive deletion before the event.

## Traceability

- Origin: Product Owner direction on 2026-07-29 to begin fresh snapshot acquisition for the August 1 event.
- Implementation prompt: `docs/prompts/PHR-TECH-006-event-snapshot-activation-prompt.md`.
- Related workflow: `PHR-WORKFLOW-004`.
- Last modified: 2026-07-29.
