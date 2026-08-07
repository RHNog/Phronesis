# Implementation Prompt — PHR-UX-016 Intent-Aware Catalogue Search

## Project Context

Phronesis searches imported multi-game catalogue snapshots through local SQLite FTS5 and requires explicit exact-result selection before downstream evaluation.

## Feature ID

`PHR-UX-016`

## Objective

Preserve structured shorthand behavior, make One Piece codes such as `OP13 booster` retrieve canonical set titles, and add conservative indexed name-typo correction such as `Gsrdevoir → Gardevoir` without weakening explicit selection.

## Required Reading

- `docs/ux/PHR-UX-016-intent-aware-catalogue-search.md`
- `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- `lib/pricing/repository.ts`
- `lib/pricing/domain.ts`
- `lib/pricing/searchPlan.ts`

## Implementation Requirements

- Add a pure, bounded pricing query-plan module.
- Expand only documented structured set-code equivalents.
- Use the same plan for FTS candidate retrieval and relevance scoring.
- Return and display interpretation metadata.
- Prove the screenshot query against deterministic and active local catalogue data.
- Add a pure One Piece set-code derivation module for OP/EB/ST/PRB families.
- Persist only dominant, sufficiently evidenced, semantically compatible code-to-title aliases from imported exact single-card rows.
- Bootstrap aliases for an existing populated database and refresh them within One Piece catalogue import transactions.
- Add multiword phrase alternatives to the shared query plan and make scorer coverage phrase-aware.
- Merge category-specific interpretation metadata in unified search.
- Prove `OP13 booster` returns Carrying On His Will sealed products while `OP13` still returns singles.
- Normalize One Piece collector-number query tokens to the catalogue's three-digit form, so `22` and `022` retrieve the same `*-022` identity.
- Prove the reported `Monkey.D.Luffy OP16 22` query retrieves `OP16-022` while unrelated required terms still reject the candidate.
- Build and transactionally refresh a category-scoped name vocabulary and trigram index.
- Attempt bounded Damerau-Levenshtein correction only after the literal plan returns no candidates, and require a dominant runner-up-separated candidate.
- Return `Did you mean …? Showing matches for …` interpretation metadata for accepted corrections.

## Constraints

- No hand-authored OP13 title mapping, fuzzy identity adoption, external provider call, source-catalogue mutation, raw SQLite MATCH syntax, dependency, or auto-selection. Typo correction is discovery only.
- Preserve explicit human choice and existing search behavior.
- Special-event/reprint labels, tied candidates, and weak evidence fail closed.

## Expected Architecture

Imported One Piece singles → exact collector-code extraction → dominant compatible set-title evidence → local alias table. Raw query → normalized/coalesced logical tokens → static plus resolved bounded alias groups → escaped phrase-aware FTS expression → candidates → alias-aware score → unified response with merged optional interpretations.

## Testing Expectations

- Unit tests for alias plans, One Piece derivation/fail-closed rules, and integration tests for `SH03 → SWSH03` plus `OP13 → Carrying On His Will` singles/sealed behavior.
- Existing pricing/search tests, full suite, TypeScript, lint, build, and 390px runtime reproduction.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Sprint History, Changelog, Agent Handoff, conversation memory, validation, report, conformance, and release notes.

## Acceptance Criteria

- `Charizard v sh03` remains correct; `OP13 booster` returns the intended Carrying On His Will sealed options and explains the interpretation without weakening all-token matching or identity selection.

## Non-Goals

- Natural-language extraction, OCR, barcode, voice, or cross-market identity reconciliation.

## Notes For AI Coding Agents

- Search discovery may broaden visible candidates; it must never silently change canonical identity evidence.
