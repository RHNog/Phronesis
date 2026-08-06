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

The 2026-08-01 enhancement adds One Piece set-code resolution without maintaining a brittle hand-authored title list:

- Recognize compact, dashed, spaced, padded, and unpadded `OP`, `EB`, `ST`, and `PRB` numbered set codes.
- Derive each code's canonical human set name from exact imported single-card collector numbers and their catalogue set names.
- Persist only mappings supported by at least two distinct products and a dominant, semantically compatible set-name candidate.
- Exclude tournament, promotion, prerelease, championship, winner, anniversary, and other special-event catalogue labels from canonical set authority.
- Fail closed when the imported catalogue does not provide sufficient or unambiguous evidence.
- Add the derived set-name phrase as an alternative for the original code token, so `OP13 booster` requires both the OP13/Carrying On His Will intent and `booster`.

The approved collector-number amendment treats one-to-three-digit numeric One Piece query tokens as the catalogue's three-digit collector form. `22` therefore expands to `022`, while an already padded `022` remains literal. The expansion is category-scoped to One Piece, visible to the operator, bounded to one canonical alternative, and never drops card-name or set-code terms.

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
- `OP13 booster` must return sealed `Carrying On His Will` products and disclose `Understood OP13 as Carrying On His Will`.
- `OP13` alone must continue to return matching single cards; aliasing cannot suppress literal collector-code matches.
- One Piece aliases must refresh transactionally after a One Piece catalogue import and bootstrap deterministically for an already populated local database.
- Unified search must merge interpretation metadata from the category whose local catalogue supplied the alias.
- `Monkey.D.Luffy OP16 22` and `Monkey.D.Luffy OP16 022` must retrieve the same `OP16-022` identities.
- Collector normalization must not apply to four-digit values, alphanumeric tokens, or non-One Piece category searches.

## Non-Functional Requirements

### Performance

Expansion is bounded to no more than six alternatives per token and preserves indexed FTS retrieval.

### Scalability

Static spelling families remain pure query-planning rules. Catalogue-derived aliases use one local evidence table and one derivation module so new One Piece releases become searchable after import without UI changes or code-specific title edits.

### Maintainability

Candidate retrieval and scoring share the same normalized alias plan. UI code only renders returned interpretation metadata.

### Reliability

Unrecognized identifiers keep literal behavior. Ambiguous or weakly evidenced catalogue-derived aliases fail closed. Recognized shorthand may broaden visible candidates but cannot auto-select, persist a selected identity, or mutate catalogue identity.

### Accessibility

Interpretation feedback uses polite status text and does not interrupt keyboard search flow.

### Offline Support

All interpretation and search remain local against the imported SQLite catalogue.

### Security

Every FTS alternative is normalized and quote-escaped; raw MATCH syntax is never accepted.

### Extensibility

Future bounded families may include other evidence-derived game/set aliases, collector prefixes, language terms, OCR normalization, and spelling correction with explicit confidence.

### Responsiveness

Interpretation text wraps below the search field without changing the 390px result workflow.

## User Stories

- As an event operator, I can type the set shorthand I remember and immediately see the intended printing.
- As an owner, I can see how Phronesis interpreted shorthand before I select an exact card.
- As a One Piece operator, I can type the printed set code I know and still reach sealed products stored under the set's human title.

## Acceptance Criteria

- A deterministic repository test proves `Charizard v sh03` returns `SWSH03: Darkness Ablaze` first from the imported fixture.
- Query-plan tests cover case, leading-zero, canonical, shorthand, unknown-token, escaping, and bounded-expansion behavior.
- Existing search, grouping, pricing, and artwork tests remain green.
- Private phone review reproduces the screenshot query and returns the intended card without horizontal overflow or console errors.
- Repository tests prove `OP13 booster` resolves to `Carrying On His Will` sealed products while `OP13` still returns singles.
- Tests prove OP/EB/ST/PRB padded and unpadded parsing, special-label exclusion, low-evidence rejection, ambiguity rejection, multiword matching, and unified interpretation propagation.
- Regression tests prove `22 ↔ 022` collector equivalence and preserve all-token rejection for an unrelated card name.

## Edge Cases

- `sh` without digits is ordinary text and is not expanded.
- `sh999` may expand structurally but returns no result when no canonical set exists.
- Unknown alphanumeric terms remain literal.
- A shorthand that matches multiple visible products remains a result list requiring explicit user choice.
- A code supported only by a special-event set label, one product, or tied canonical candidates remains literal and does not acquire a derived interpretation.
- `ST01 booster` may correctly return no result because `ST01` resolves to a Starter Deck while `booster` remains required.
- `022` is already canonical and does not emit a redundant interpretation.
- `000`, values longer than three digits, and tokens containing letters are not treated as collector-number shorthand.
- A number in another game remains governed by that catalogue's existing literal search behavior.

## Dependencies

- `PHR-UX-008` Unified Artwork-First Catalogue Search.
- Local pricing repository and FTS5 index.
- Active Pokémon catalogue snapshot.

## Future Enhancements

- Typo-tolerant name retrieval using an indexed trigram strategy.
- Natural-language field extraction, OCR, barcode, and voice input.
- Evidence-backed aliases for other game catalogues.
- Optional explicit provider set registries when an authoritative catalogue exposes set-code metadata directly.

## Technical Notes

`pricingSearchPlan` remains the shared retrieval/scoring plan and accepts bounded resolved aliases. A separate pure One Piece derivation module extracts set codes from exact collector numbers, selects only a dominant compatible title, and persists evidence counts in `pricing_search_aliases`. Repository search resolves aliases before generating MATCH syntax. Multiword alternatives use FTS phrases and the same phrase-aware coverage rule in scoring. Return an optional `interpretations` array on search responses. Keep alias expansion separate from selected identity reconciliation; search is a discovery surface, not a crosswalk authority.

## UI / UX Notes

Render concise feedback such as `Understood SH03 as SWSH03` beneath the search help copy only when expansion occurred. Do not add a confirmation step because the operator still explicitly selects the exact result.

## Success Metrics

- `Charizard v sh03` reaches the intended SWSH03 card in the first result.
- `OP13 booster` reaches Carrying On His Will sealed products without a hard-coded OP13 title mapping.
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
- Last modified: 2026-08-01.
- Modification reason: extend intent-aware search from static Pokémon spelling aliases to evidence-derived One Piece set-code/title resolution and zero-padded One Piece collector-number equivalence after the reported `OP13 booster` and `OP16 22` failures.
