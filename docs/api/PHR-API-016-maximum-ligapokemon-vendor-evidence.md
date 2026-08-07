# PHR-API-016 — Maximum LigaPokémon Vendor Evidence Coverage

## Feature ID

`PHR-API-016`

Feature IDs are permanent and must not be changed after assignment.

## Title

Maximum LigaPokémon Vendor Evidence Coverage

## Status

Completed — Privately Live; Product Review Ready

## Priority

Critical

## Category

API / Database / Identity / Market Evidence / Reliability / UX

## Objective

Expose the maximum defensible LigaPokémon evidence for an exact TCGplayer Pokémon selection in Vendor Workspace while preserving printing, finish, language, artwork-treatment, provenance, and ambiguity boundaries.

## Background

The promoted LigaPokémon snapshot already contains substantially more usable evidence than the legacy source-oriented exact crosswalk exposes. The operational target-equivalence ledger currently classifies 30,061 TCGplayer products as exact and 2,539 as bounded compatible, while the live Vendor Workspace read path still consumes only 25,549 legacy exact target mappings.

Gardevoir GX `SV75/SV94` demonstrates a second gap. TCGplayer names its set `Hidden Fates: Shiny Vault`; LigaPokémon names the same SV-prefixed subset printing `Hidden Fates`. Exact name, collector numerator, finish, language, and source uniqueness are present, but the set-label policy does not yet admit this explicit subset convention.

## Problem Statement

Vendor Workspace incorrectly reports some available LigaPokémon evidence as unreconciled. A broad fuzzy join would create unacceptable false matches across reprints, finishes, stamped variants, and set subsets, but retaining only the original exact source crosswalk unnecessarily hides thousands of bounded equivalents already classified by the repository.

## Proposed Solution

Maintain two intentionally separate reconciliation products:

1. The collision-safe source crosswalk remains the authority for strict source adoption and Arbitrage.
2. A provider-aware target-equivalence ledger classifies every TCGplayer target as `EXACT`, `COMPATIBLE`, `AMBIGUOUS`, or `UNAVAILABLE` using ordered deterministic tiers.

Vendor Workspace may display `EXACT` and `COMPATIBLE` rows with match quality, method, confidence, reason, provider, source run, condition, and language. It must display a truthful disposition for ambiguous or unavailable products. Compatible evidence is comparison-only and remains excluded from Arbitrage.

Add an explicit Hidden Fates Shiny Vault identity rule: `Hidden Fates: Shiny Vault` and `Hidden Fates` may reconcile only when the target collector numerator begins with `SV`, the normalized card name and physical finish agree, the market is English Near Mint, and the strongest applicable candidate tier resolves to one semantic source identity with one evidence signature.

## Functional Requirements

- Build `regional_product_equivalence` for every English Pokémon TCGplayer target whenever the verified LigaPokémon snapshot or Pokémon catalogue changes.
- Preserve `regional_pokemon_crosswalk` as the strict source-oriented exact crosswalk.
- Classify each target as `EXACT`, `COMPATIBLE`, `AMBIGUOUS`, or `UNAVAILABLE` with a stable method, confidence, reason, source receipt, source hash, pricing fingerprint, and reconciliation timestamp.
- Prefer the existing accepted exact source crosswalk, then ordered deterministic exact tiers, then explicitly bounded compatible tiers.
- Admit presentation-only HTML entity and ampersand drift.
- Admit explicit set aliases and bounded structural set decorations.
- Admit the Hidden Fates Shiny Vault subset convention only under the SV-collector guard.
- Admit a source candidate only when the strongest applicable tier yields one semantic identity and one evidence signature.
- Return exact and compatible evidence to Vendor Workspace with visible quality and confidence.
- Return ambiguous or unavailable disposition details instead of a generic unmatched message.
- Preserve provider, promoted source-run ID, source condition, source language, observation timestamp, and exact Liga identity.
- Rebuild after a complete promoted LigaPokémon snapshot and after a verified Pokémon catalogue import.
- Produce deterministic coverage totals and fingerprints.

## Non-Functional Requirements

### Performance

Build indexes in memory, write in one transaction, and read one indexed target-equivalence row per selected product.

### Scalability

The ledger must cover the complete Pokémon catalogue and remain provider-scoped so other regional providers can use the same disposition contract independently.

### Maintainability

Identity normalization, candidate classification, persistence, read projection, and UI presentation remain separate modules with named match methods and tests.

### Reliability

Reject incomplete snapshot receipts, fail closed on collisions, update crosswalk/evidence/equivalence atomically, retain the last successful operational database on failure, and produce deterministic fingerprints.

### Accessibility

Match quality and unavailable states must use text, not colour alone.

### Offline Support

Vendor reads use the locally promoted last-good snapshot and require no provider request.

### Security

Never expose provider credentials, browser profiles, local paths, or acquisition controls. Existing Vendor Workspace authorization remains required.

### Extensibility

New compatibility rules require a named bounded policy, regression fixtures, measured coverage impact, and ambiguity proof.

### Responsiveness

Evidence and disposition copy must remain readable without horizontal overflow on the existing phone layout.

## User Stories

- As a buyer, I want every safely reconciled LigaPokémon value beside TCGplayer, so that available Brazilian market evidence is not hidden.
- As an operator, I want compatible evidence clearly distinguished from an exact printing, so that I can use it without mistaking it for a strict identity proof.
- As an auditor, I want the source run and match method, so that I can reproduce why a value appeared.

## Acceptance Criteria

- Gardevoir GX, Hidden Fates: Shiny Vault, `SV75/SV94`, Holofoil resolves uniquely to LigaPokémon Gardevoir-GX, Hidden Fates, `SV75`, Holofoil from the latest complete snapshot.
- Vendor Workspace consumes every `EXACT` and `COMPATIBLE` target-equivalence row with evidence, rather than only legacy exact source rows.
- The live baseline gains at least the 7,051 already-classified target matches hidden by the former read path.
- Ambiguous and unavailable targets remain unpriced and display their disposition reason.
- Compatible matches are visibly labelled and excluded from Arbitrage.
- Source condition, language, run ID, observation time, match method, and confidence remain available in the response.
- Repeated builds over identical inputs produce the same crosswalk and target-ledger fingerprints.
- Full tests, TypeScript, lint, production build, live API verification, and phone-layout checks pass.

## Edge Cases

- A set alias leaves more than one semantic source identity: classify `AMBIGUOUS`.
- Duplicate source rows disagree on evidence values: classify `AMBIGUOUS`.
- A Hidden Fates target lacks an `SV` collector prefix: do not use the Shiny Vault subset rule.
- A finish differs: do not promote it to exact; only an explicitly defined compatible finish-family tier may apply.
- A non-English, non-NM, sealed, or incomplete target identity remains unavailable.
- A new acquisition fails: retain the last-good operational evidence and ledger.

## Dependencies

- `PHR-API-013` recurring Liga network acquisition.
- `PHR-UX-013` regional Vendor Workspace evidence composition.
- `PHR-ARCH-006` identity fidelity and treatment model.
- Operational pricing catalogue and SQLite evidence database.

## Future Enhancements

- Add provider-specific reviewed aliases from measured unavailable families.
- Add an Administration coverage explorer for exact, compatible, ambiguous, and unavailable populations.
- Support other regional Pokémon providers through independent ledgers.

## Technical Notes

Use canonical presentation normalization, collector numerators, physical finish, explicit set aliases, and material-treatment guards. Never use price, row order, rarity, colour, broad containment, edit distance, or unbounded fuzzy text as identity evidence. The target ledger is additive; no compatible row may mutate the strict source crosswalk or Arbitrage query.

## UI / UX Notes

Exact evidence uses the current regional styling. Compatible evidence uses a distinct textual `Compatible Liga equivalent` label, confidence, and reason. Ambiguous/unavailable panels explain the specific disposition. Keep TCGplayer and LigaPokémon inside the existing raw-card evidence card; PriceCharting remains the collapsed card below.

## Success Metrics

- 100% of target products receive a disposition.
- Zero ambiguous or unavailable rows are presented as prices.
- At least 32,600 current target matches become eligible for Vendor Workspace before new bounded rules.
- Gardevoir GX SV75 resolves from the promoted snapshot.

## Open Questions

- None for this delivery. Further aliases require measured evidence and a separate bounded revision.

## Traceability

- Originating prompt: Product Owner request on 2026-08-07 for the most LigaPokémon matches available, prompted by unreconciled Gardevoir GX SV75.
- Related implementation prompt: `docs/prompts/PHR-API-016-maximum-ligapokemon-vendor-evidence-prompt.md`.
- Related tests: `tests/pokemon-regional-reconciliation.test.ts`, `tests/regional-intelligence.test.ts`.
- Related release notes: `docs/release-notes/PHR-API-016.md`.
- Last modified: 2026-08-07.
- Modification reason: record the completed reconciliation, operational coverage, live deployment, and acquisition/catalogue rebuild integration.

## Implementation Evidence

- Operational target ledger: 30,864 exact, 2,681 compatible, 103 ambiguous, and 13,003 unavailable dispositions.
- Vendor-eligible coverage: 33,545 targets, including 33,190 with Liga consumer price evidence.
- Gardevoir GX SV75 resolves at 92% exact structural confidence to promoted HIF/SV75 Holofoil evidence at R$169.90.
- Validation: `docs/testing/PHR-API-016-maximum-ligapokemon-vendor-evidence-validation.md`.
- Implementation report: `docs/implementation-reports/PHR-API-016-maximum-ligapokemon-vendor-evidence-report.md`.
- Same-session conformance: `docs/reviews/PHR-API-016-maximum-ligapokemon-vendor-evidence-conformance-review.md`.
