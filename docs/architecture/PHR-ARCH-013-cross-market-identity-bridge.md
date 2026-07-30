# PHR-ARCH-013 — Cross-Market Identity Bridge

## Status

Product Review Ready

## Priority

Critical

## Category

Architecture / Identity / Market Evidence / Database

## Objective

Create a deterministic, auditable bridge between LigaMagic collection-export identities and Phronesis's canonical TCGplayer catalogue identities without weakening printing fidelity.

## Background

`PHR-API-005` produced a verified local LigaMagic snapshot containing 329,301 unique English/Near Mint identities. Phronesis already holds the TCGplayer-centred catalogue used by Vendor Workspace. Actionable regional pricing requires the two sources to refer to the exact same printing and finish.

## Problem Statement

Names alone are insufficient. Editions, collector numbers, punctuation, promos, finishes, and LigaMagic's `Textless` export dimension can create plausible but incorrect joins. A false match would contaminate buying and arbitrage recommendations.

## Proposed Solution

Build a versioned crosswalk from normalized card name, normalized edition, collector number, language, and finish. A match is accepted only when it resolves to one canonical product. Every row records source hashes, method, confidence, and rejection reason. `Textless` rows are quarantined until explicit treatment evidence exists.

## Functional Requirements

- Discover the latest completed LigaMagic snapshot without enabling a schedule.
- Map blank `Extras` to Normal and `Foil` to Foil; quarantine `Textless` by default.
- Use exact normalized equality and explicit edition aliases only; do not use fuzzy similarity for canonical adoption.
- Resolve a LigaMagic identity to exactly one Phronesis product or preserve an explicit unmatched/ambiguous state.
- Persist crosswalk lineage, source hashes, timestamps, and reason codes.
- Provide a reproducible build command and coverage report.
- Rebuilding the same source pair must be idempotent.

## Non-Functional Requirements

### Performance

The full local source pair must reconcile through indexed/batched operations without loading both catalogues into a quadratic in-memory comparison.

### Reliability

The bridge fails closed on missing source, hash drift, ambiguity, unsupported finish, or malformed identity.

### Security

No LigaMagic session material, cookies, credentials, or private request data enters the crosswalk or repository.

### Offline Support

Crosswalk generation and consumption operate entirely from verified local snapshots.

## User Stories

- As a buyer, I want Brazilian and US evidence attached to the exact printing so that a recommendation does not compare different cards.
- As an operator, I want unmatched rows explained so that coverage can improve without silently guessing.

## Acceptance Criteria

- Every accepted mapping is one-to-one and reproducible.
- Ambiguous, unsupported, and Textless rows cannot enter actionable calculations.
- Coverage and reason counts are available to operators.
- Focused tests cover punctuation, collector numbers, finish mapping, aliases, ambiguity, and idempotency.

## Edge Cases

- Promo editions with different marketplace labels.
- Collector numbers with leading zeros, prefixes, suffixes, or denominators.
- A normalized identity resolving to multiple TCGplayer SKUs.
- LigaMagic rows with no collector number.
- Identical membership duplicates already reconciled in `PHR-API-005`.

## Dependencies

- `PHR-API-005`
- `PHR-ARCH-007`
- `PHR-TECH-006`

## Technical Notes

Keep normalization pure and tested. Keep snapshot discovery and SQLite persistence server-only. Store accepted mappings separately from candidate diagnostics so downstream consumers cannot mistake a candidate for canonical identity.

## UI / UX Notes

Coverage belongs in Settings/Provider Operations. Operators should see matched, unmatched, ambiguous, unsupported, and stale counts with plain-language reasons.

## Success Metrics

- Zero ambiguous mappings adopted.
- Zero quarantined Textless rows used in decisions.
- Repeated builds produce the same crosswalk fingerprint.

## Open Questions

- Which additional LigaMagic edition aliases can be proven from repository evidence after the first coverage run?

## Traceability

- Originating approval: Product Owner request on 2026-07-30 to turn LigaMagic data into vending and arbitrage intelligence.
- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Last modified: 2026-07-30.
- Modification reason: approved program structure.
