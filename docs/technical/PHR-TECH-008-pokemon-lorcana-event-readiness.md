# PHR-TECH-008 — Pokémon And Lorcana Event Readiness

## Feature ID

`PHR-TECH-008`

## Title

Pokémon artwork fidelity and Lorcana catalogue activation

## Status

Completed

## Priority

Critical

## Category

Technical / API / Database / Local Integration / Reliability

## Objective

Make Pokémon thumbnails materially more complete and make Lorcana searchable with current snapshot prices and locally retained artwork before the August 1, 2026 card-show event.

## Background

Magic, Pokémon, and One Piece currently have active local catalogue snapshots. Pokémon uses TCGdex, but strict matching misses known TCGplayer/TCGdex set-label differences. Lorcana already has a working Lorcast identity/artwork provider and is registered in the observer, but no Lorcana catalogue receipt is loaded.

The adjacent Pricing Update Tool working tree already contains an uncommitted catalogue-configuration revision that includes Lorcana and Riftbound. Its July 30 00:00 scheduled run failed during store visibility handling before catalogue export. Phronesis must not edit, stage, commit, or otherwise absorb that separate dirty worktree.

## Proposed Solution

1. Add a Pokémon-only, explicit and tested set-alias registry at the strict snapshot-artwork boundary. Canonicalize both catalogue and provider set labels through that registry before set/collector/name matching.
2. Preserve fail-closed behavior: aliases may reconcile only known equivalent set names and cannot relax collector-number, normalized-name, language, or ambiguity rules.
3. Acquire one Lorcana catalogue through the Pricing Update Tool's existing authenticated, catalogue-only export path without hiding inventory or running pricing/publishing phases.
4. Copy the completed export into Phronesis ignored storage, calculate and retain its SHA-256 evidence, then import it transactionally into the active last-known-good SQLite repository as `lorcana-en`.
5. Verify unified search, Lorcast resolution, same-origin durable image caching, desktop behavior, and mobile adaptation.
6. Leave Riftbound explicitly deferred.

## Functional Requirements

- Pokémon matching recognizes only documented TCGplayer/TCGdex set-name equivalences.
- Pokémon still requires a unique set plus collector-number/name-compatible printing before assigning artwork.
- Unmatched, ambiguous, World Collection, language-mismatched, or provider-missing Pokémon records retain placeholders.
- Lorcana acquisition uses the exact TCGplayer `Lorcana TCG` category and produces a stable regular CSV.
- The source CSV is retained under ignored `.data/pricing-catalogues/` storage and is hash-verifiable before import.
- Lorcana imports through the existing TCGplayer catalogue adapter and pricing repository; no second data model is introduced.
- Failed Lorcana acquisition or import leaves every existing catalogue and last-good snapshot available.
- Successful Lorcana searches resolve artwork through Lorcast and eligible images are retained by `PHR-TECH-007` on demand or through a bounded prewarm.

## Non-Functional Requirements

### Performance

No per-row provider calls. Provider lookup remains query-scoped, cached, and coalesced.

### Maintainability

Pokémon aliases live in one named, exported, testable registry rather than scattered string replacements.

### Reliability

Acquisition, archive verification, import, and activation fail closed. Existing last-good data is never replaced by a partial file.

### Security

Use the already-owned local authenticated browser profile without reading, copying, logging, or changing credentials. No secret enters Phronesis.

### Offline Support

Imported Lorcana prices and already-retained artwork remain usable without provider access.

### Responsiveness

The desktop-first Vendor Workspace remains primary and the current 390px mobile adaptation remains usable without horizontal overflow.

## User Stories

- As a card-show buyer, I want Pokémon thumbnails to appear for known equivalent set labels so that I identify cards quickly.
- As a card-show buyer, I want Lorcana in the same search and decision workflow so that I do not switch tools or guess prices.

## Acceptance Criteria

- Focused tests prove the known Pokémon alias families resolve and ambiguous/mismatched printings do not.
- A representative `pikachu` runtime search resolves materially more artwork than the pre-change 12 of 40 sample.
- The active repository returns Lorcana singles or sealed results for a representative query.
- The Lorcana artwork endpoint is `OPERATIONAL` and resolves at least one strict catalogue mapping.
- At least one mapped Lorcana image is served from the same-origin durable cache.
- Focused tests, supported full suite, lint, application build/type check, diff hygiene, and private desktop/mobile checks are recorded honestly.

## Edge Cases

- A set alias with multiple cards sharing a collector number remains unresolved unless name evidence selects one unique printing.
- Provider records without usable image URLs do not create cache entries.
- A login-expired or unavailable catalogue session stops acquisition without changing store state.
- A schema-drifted or truncated Lorcana CSV is rejected before repository activation.
- A repeated identical receipt is idempotent.

## Dependencies

- `PHR-API-002` cross-game catalogue artwork providers.
- `PHR-TECH-006` resilient catalogue ingestion.
- `PHR-TECH-007` durable local artwork cache.
- `PHR-WORKFLOW-004` snapshot-powered Vendor Workspace.

## Future Enhancements

- Provider-assisted diagnostics that suggest—but never automatically activate—new explicit set aliases.
- Automatic Lorcana receipt ingestion after the Pricing Update Tool's separate catalogue revision is canonically adopted and produces completed receipts.

## Technical Notes

Riftbound is deferred and excluded. The Pricing Update Tool is a separate dirty repository; Phronesis may read a bounded completed export but must not edit its code or repository state in this assignment.

## UI / UX Notes

No redesign is required. Existing fixed thumbnail slots, placeholders, artwork grouping, Finish selection, and Condition selection remain unchanged.

## Success Metrics

- Pokémon sample mapping exceeds the 12/40 pre-change baseline without false-positive fixtures.
- Lorcana produces searchable price evidence and at least one locally retained thumbnail.

## Open Questions

- None blocking. Further Pokémon aliases are evidence-driven follow-up work.

## Traceability

- Originating direction: Product Owner, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-TECH-008-pokemon-lorcana-event-readiness-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-008-pokemon-lorcana-event-readiness-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-008.md`.
- Last modified: 2026-07-30.
- Modification reason: authorize Pokémon fidelity remediation and immediate Lorcana acquisition/activation while deferring Riftbound.
