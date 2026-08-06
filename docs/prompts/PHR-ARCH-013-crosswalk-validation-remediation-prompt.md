# PHR-ARCH-013 Crosswalk Validation Remediation — Engineer Prompt

## Feature ID

`PHR-ARCH-013`

## Objective

Run the verified LigaMagic snapshot against the active TCGplayer-centred Magic catalogue, quantify exact coverage, safely recover systematic edition-label drift, and produce durable reproducible validation evidence.

## Required Reading

- `docs/architecture/PHR-ARCH-013-cross-market-identity-bridge.md`
- `docs/api/PHR-API-006-regional-market-evidence.md`
- `docs/workflows/PHR-WORKFLOW-007-arbitrage-verification.md`
- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`

## Implementation Requirements

- Preserve exact name, collector number, finish, and one-to-one SKU matching.
- Derive an edition alias only when unique relaxed identity anchors for one LigaMagic edition all resolve to one TCGplayer edition with no competing target, deterministic structural edition tokens remain compatible, and language or material-treatment qualifiers are preserved.
- Require at least two independent anchors before adopting a derived alias.
- Persist exact versus alias match method and reason.
- Continue quarantining Textless and every ambiguous candidate.
- Report supported coverage, exact/alias matches, price availability, comparable rows, alias evidence, unmatched edition concentration, and a deterministic crosswalk fingerprint.
- Write a sanitized ignored local report and keep the CLI output reproducible.

## Constraints

- No fuzzy matching, guessed printing, Textless adoption, scraping, provider request, schedule activation, external transaction, or cost assumption.
- No public deployment, new dependency, destructive migration, or credential/session disclosure.

## Testing Expectations

- Derived alias adoption, insufficient anchors, conflicting targets, ambiguity quarantine, Textless quarantine, deterministic fingerprint, and existing arbitrage gates.
- Full tests, standalone TypeScript, lint, build, diff hygiene, and repeated real-data validation.

## Acceptance Criteria

- The real acquired source pair produces an explained coverage report.
- Alias matches are reproducible and supported by recorded conflict-free anchors.
- Rebuilding the same inputs produces the same crosswalk fingerprint.
- Remaining gaps are categorized rather than silently guessed.

## Non-Goals

- Owner cost configuration, executable availability verification, automatic orders, marketplace publication, or the LigaMagic schedule.
