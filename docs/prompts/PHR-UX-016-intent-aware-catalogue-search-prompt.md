# Implementation Prompt — PHR-UX-016 Intent-Aware Catalogue Search

## Project Context

Phronesis searches imported multi-game catalogue snapshots through local SQLite FTS5 and requires explicit exact-result selection before downstream evaluation.

## Feature ID

`PHR-UX-016`

## Objective

Make structured shorthand such as `Charizard v sh03` retrieve and rank the canonical `SWSH03: Darkness Ablaze` printing first.

## Required Reading

- `docs/ux/PHR-UX-016-intent-aware-catalogue-search.md`
- `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- `lib/pricing/repository.ts`
- `lib/pricing/domain.ts`

## Implementation Requirements

- Add a pure, bounded pricing query-plan module.
- Expand only documented structured set-code equivalents.
- Use the same plan for FTS candidate retrieval and relevance scoring.
- Return and display interpretation metadata.
- Prove the screenshot query against deterministic and active local catalogue data.

## Constraints

- No fuzzy identity adoption, external provider call, catalogue mutation, raw SQLite MATCH syntax, dependency, or auto-selection.
- Preserve explicit human choice and existing search behavior.

## Expected Architecture

Raw query → normalized logical tokens → bounded alias groups → escaped FTS expression → candidates → alias-aware score → unified response with optional interpretation.

## Testing Expectations

- Unit tests for alias plans and integration test for `SH03 → SWSH03` first result.
- Existing pricing/search tests, full suite, TypeScript, lint, build, and 390px runtime reproduction.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Sprint History, Changelog, Agent Handoff, conversation memory, validation, report, conformance, and release notes.

## Acceptance Criteria

- `Charizard v sh03` returns the intended Darkness Ablaze option first and explains the interpretation without regressions.

## Non-Goals

- General typo/trigram search, OCR, barcode, voice, or cross-market identity reconciliation.

## Notes For AI Coding Agents

- Search discovery may broaden visible candidates; it must never silently change canonical identity evidence.
