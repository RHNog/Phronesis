# PHR-UX-016 Intent-Aware Catalogue Search

## Feature ID

`PHR-UX-016`

## Title

Intent-Aware Catalogue Search

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

UX / Search / Catalogue / Identity / Performance

## Objective

Interpret common catalogue shorthand and structured identifiers so an operator reaches the right card with minimal typing while preserving explicit human selection and avoiding false identity adoption.

## Background

Unified Vendor Workspace search uses SQLite FTS5 prefix matching across name, set, collector number, and variant. The active Pokémon catalogue contains `Charizard V` in `SWSH03: Darkness Ablaze`, but `Charizard v sh03` returns zero results.

## Problem Statement

The current query requires every normalized token to be a literal prefix of an indexed token. `sh03` is a human shorthand for `SWSH03`, but it is not the literal beginning of `swsh03`; candidate retrieval therefore fails before the existing relevance scorer can recognize that `sh03` occurs within the set code.

## Proposed Solution

Add a deterministic pricing-query interpreter that classifies likely structured identifiers, expands only documented equivalent set-code spellings, and builds an FTS query whose logical term groups preserve all user intent. Ranking consumes the same alias equivalence and rewards exact name, exact set code, collector number, and full token coverage. The response explains any expansion, such as `SH03 understood as SWSH03`.

The first approved alias family covers common Pokémon era code normalization:

- `SH03`, `SH3`, `SWSH03`, and `SWSH3` are equivalent search spellings for canonical `SWSH03`.
- Leading-zero variants are equivalent for canonical `SWSH`, `SM`, `SV`, and `XY` numbered codes.
- Expansion changes candidate retrieval and ranking only. It never rewrites catalogue identity or auto-selects a result.

## Functional Requirements

- Preserve Unicode/diacritic/punctuation normalization and all existing name, set, collector, finish, and sealed-product search behavior.
- Produce a query plan containing normalized tokens, bounded aliases, FTS term groups, and human-readable interpretations.
- Require every logical user token group to match at least one canonical or alias spelling.
- Build FTS groups with escaped exact-prefix alternatives; do not concatenate raw user syntax into SQLite MATCH.
- Score an alias match as full structured-token coverage and rank exact card-name plus exact set-code intent ahead of name-only results.
- Return interpretations in unified and category-specific search DTOs.
- Vendor Workspace presents the interpretation without claiming automatic identity certainty.
- `Charizard v sh03` must return the canonical `SWSH03: Darkness Ablaze` artwork first.
- Existing `Charizard v` ranking and multi-catalogue routing must not regress.

## Non-Functional Requirements

### Performance

Expansion is bounded to no more than six alternatives per token and preserves indexed FTS retrieval.

### Scalability

Alias families are pure data/rules in one query-planning module and can be extended per catalogue without UI or repository branching.

### Maintainability

Candidate retrieval and scoring share the same normalized alias plan. UI code only renders returned interpretation metadata.

### Reliability

Unrecognized identifiers keep literal behavior. Ambiguous shorthand may broaden visible candidates but cannot auto-select, persist, or mutate an identity.

### Accessibility

Interpretation feedback uses polite status text and does not interrupt keyboard search flow.

### Offline Support

All interpretation and search remain local against the imported SQLite catalogue.

### Security

Every FTS alternative is normalized and quote-escaped; raw MATCH syntax is never accepted.

### Extensibility

Future bounded families may include documented game/set aliases, collector prefixes, language terms, OCR normalization, and spelling correction with explicit confidence.

### Responsiveness

Interpretation text wraps below the search field without changing the 390px result workflow.

## User Stories

- As an event operator, I can type the set shorthand I remember and immediately see the intended printing.
- As an owner, I can see how Phronesis interpreted shorthand before I select an exact card.

## Acceptance Criteria

- A deterministic repository test proves `Charizard v sh03` returns `SWSH03: Darkness Ablaze` first from the imported fixture.
- Query-plan tests cover case, leading-zero, canonical, shorthand, unknown-token, escaping, and bounded-expansion behavior.
- Existing search, grouping, pricing, and artwork tests remain green.
- Private phone review reproduces the screenshot query and returns the intended card without horizontal overflow or console errors.

## Edge Cases

- `sh` without digits is ordinary text and is not expanded.
- `sh999` may expand structurally but returns no result when no canonical set exists.
- Unknown alphanumeric terms remain literal.
- A shorthand that matches multiple visible products remains a result list requiring explicit user choice.

## Dependencies

- `PHR-UX-008` Unified Artwork-First Catalogue Search.
- Local pricing repository and FTS5 index.
- Active Pokémon catalogue snapshot.

## Future Enhancements

- Typo-tolerant name retrieval using an indexed trigram strategy.
- Natural-language field extraction, OCR, barcode, and voice input.
- Evidence-backed aliases for other game catalogues.

## Technical Notes

Create a pure `pricingSearchPlan` module used by both repository candidate retrieval and `searchScore`. Return an optional `interpretations` array on search responses. Keep alias expansion separate from identity reconciliation; search is a discovery surface, not a crosswalk authority.

## UI / UX Notes

Render concise feedback such as `Understood SH03 as SWSH03` beneath the search help copy only when expansion occurred. Do not add a confirmation step because the operator still explicitly selects the exact result.

## Success Metrics

- `Charizard v sh03` reaches the intended SWSH03 card in the first result.
- No increase in automatic identity adoption; search remains selection-driven.
- No measurable regression in bounded local search latency.

## Open Questions

- Typo correction beyond structured aliases remains a separately measured search-quality increment.

## Traceability

- Originating direction: Product Owner screenshot and request on 2026-07-31 under `PHR-STRUCT-20260731-005`.
- Related implementation prompt: `docs/prompts/PHR-UX-016-intent-aware-catalogue-search-prompt.md`.
- Related tests: `tests/pricing-lookup.test.ts`.
- Related validation: `docs/testing/PHR-UX-016-intent-aware-catalogue-search-validation.md`.
- Related implementation report: `docs/implementation-reports/PHR-UX-016-intent-aware-catalogue-search-report.md`.
- Related conformance review: `docs/reviews/PHR-UX-016-intent-aware-catalogue-search-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-UX-016.md`.
- Last modified: 2026-07-31.
- Modification reason: deterministic implementation, full verification, and private 390px reproduction of the reported failure completed.
