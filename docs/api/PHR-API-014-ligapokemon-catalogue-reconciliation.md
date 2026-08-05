# PHR-API-014 — LigaPokemon Catalogue Reconciliation

## Feature ID

`PHR-API-014`

## Title

Exact LigaPokemon-to-TCGplayer catalogue reconciliation

## Status

Completed — Vendor Evidence Live; Arbitrage Exposure Gated

## Priority

Critical

## Category

API / Database / Identity / Market Evidence / Reliability / Workflow / Testing

## Objective

Reconcile the latest complete LigaPokemon snapshot to the English Pokémon TCGplayer catalogue through exact, auditable physical-product identity rules, and expose accepted exact evidence in Vendor Workspace while preserving the existing LigaMagic crosswalk and quarantining every unsupported, ambiguous, or colliding identity.

## Background

`PHR-API-013` now produces a verified 18-collection LigaPokemon snapshot with 167,912 unique identities and durable provider `SUCCESS`. Pokémon regional promotion remained intentionally gated until a separate exact crosswalk could prove how LigaPokemon edition, collector, and finish semantics correspond to the canonical TCGplayer catalogue.

## Problem Statement

The operational database contains 46,626 English Pokémon TCGplayer products, but no durable mapping from LigaPokemon identities to those products. Reusing the Magic tables would overwrite the active 131,869-match LigaMagic crosswalk, while fuzzy set or finish matching could silently merge foreign sets, reverse holos, pattern treatments, vintage editions, or duplicate catalogue targets.

## Proposed Solution

- Add isolated `regional_pokemon_crosswalk` and `regional_pokemon_evidence` tables in the operational pricing database.
- Discover only the latest complete LigaPokemon snapshot and hash-bind each reconciliation to that snapshot and the current pricing-catalogue fingerprint.
- Match only one canonical English Pokémon single through exact normalized card name, bounded explicit set equivalence, normalized collector numerator, and physical finish.
- Map LigaPokemon blank, `Foil`, and `Reverse Foil` only to TCGplayer `Normal`, `Holofoil`, and `Reverse Holofoil` respectively.
- Quarantine Poké Ball, Master Ball, vintage edition, foreign-set, ambiguous, and target-collision semantics unless an exact physical treatment is independently proved.
- Write an atomic ignored validation report and rebuild it automatically after every complete recurring LigaPokemon snapshot.
- Project exact matched Pokémon evidence through the existing regional-evidence API and Vendor Workspace panel with explicit LigaPokemon provenance.
- Keep Pokémon rows out of the Arbitrage decision queue until a separate Product Owner acceptance explicitly approves opportunity economics and candidate exposure.

## Functional Requirements

- Reconciliation reads `ligapokemon_price` only from a `DRY_RUN_COMPLETE` manifest and never from partial raw files.
- The target catalogue is restricted to `category_id='pokemon-en'`, `product_type='SINGLE'`, and English catalogue identity.
- Card-name normalization may remove only a trailing printed collector suffix that exactly agrees with the row collector; other qualifiers remain identity-bearing.
- Collector normalization compares the printed numerator, preserves alphabetic prefixes/suffixes, and removes presentation-only leading zeros.
- Set reconciliation uses the bounded Pokémon set aliases already accepted by snapshot artwork plus presentation-only TCGplayer era/code prefixes. No containment, edit distance, or broad fuzzy matching is allowed.
- Source extras map exactly: blank to `Normal`, `Foil` to `Holofoil`, and `Reverse Foil` to `Reverse Holofoil`. Every other source extra is `UNSUPPORTED_VARIANT`.
- Exactly one target produces `MATCHED`; zero produces `UNMATCHED`; multiple targets produce `AMBIGUOUS`.
- If more than one LigaPokemon source identity resolves to one target SKU, every member of that collision is quarantined as `AMBIGUOUS`.
- Rebuilds replace only the Pokémon crosswalk/evidence tables inside one transaction and preserve the Magic crosswalk, cost profile, availability verification, and last-good pricing data.
- The report includes source run/hash, pricing fingerprint, counts, price coverage, collision counts, top unmatched sets, and a deterministic crosswalk fingerprint.
- The recurring orchestrator reports LigaPokemon success only when both snapshot creation and Pokémon crosswalk rebuild succeed.
- Regional evidence lookup routes `magic-en` to the LigaMagic crosswalk and `pokemon-en` to the isolated LigaPokemon crosswalk; unsupported categories fail closed with no evidence.
- Only `MATCHED` Pokémon rows may be returned. Unmatched, ambiguous, unsupported-treatment, unsupported-market, and collision-quarantined rows return no regional evidence.
- The regional evidence response identifies its source provider so Vendor Workspace never labels LigaPokemon evidence as LigaMagic evidence.
- Vendor Workspace renders provider name, observation timestamp, exact set/collector/finish identity, and available BRL price lanes without changing TCGplayer snapshot prices.

## Non-Functional Requirements

### Performance

Build indexed in-memory target keys once, scan each 167,912-row source identity once, and complete without per-card network calls.

### Scalability

Provider-specific tables prevent cross-game primary-key collisions while retaining a future path to a source-provider-aware generic regional evidence model.

### Maintainability

Keep Pokémon identity normalization pure and separately tested; keep snapshot discovery, persistence, reporting, and orchestration adapters distinct.

### Reliability

Use query-only source access, transactional replacement, hash-bound receipts, target-collision quarantine, and atomic report replacement.

### Accessibility

The regional panel preserves semantic section labeling, readable loading and unmatched states, and provider provenance in visible text.

### Offline Support

The complete source snapshot, operational TCGplayer catalogue, crosswalk tables, and validation report remain locally queryable without provider access.

### Security

No credentials, cookies, browser storage, request data, network scraping, or external mutation is introduced.

### Extensibility

Later work may expose accepted Pokémon candidates through the existing regional intelligence API without changing source acquisition.

### Responsiveness

The existing responsive regional panel remains usable on mobile and desktop without introducing a separate Pokémon layout.

## User Stories

- As the Product Owner, I want LigaPokemon identities reconciled to the US catalogue so regional Pokémon evidence becomes measurable without guessed matches.
- As an operator, I want every unmatched or ambiguous row retained with a reason so remediation is evidence-driven.
- As an engineer, I want recurring Pokémon snapshots to refresh their crosswalk automatically without modifying Magic reconciliation.
- As a vendor, I want the accepted LigaPokemon price for the exact Pokémon printing visible beside TCGplayer evidence so I can compare markets without treating a fuzzy candidate as fact.

## Acceptance Criteria

- A complete live LigaPokemon snapshot produces a deterministic isolated crosswalk report.
- All accepted rows have exactly one Pokémon TCGplayer SKU under exact name, set, collector, and finish identity.
- Special patterns, unsupported finishes, ambiguous targets, and source-to-target collisions cannot become matched.
- Repeated builds are idempotent and do not change the Magic crosswalk fingerprint or candidate count.
- The recurring orchestrator rebuilds the Pokémon crosswalk after a complete snapshot and reports reconciliation failure explicitly.
- An exact `pokemon-en` SKU returns LigaPokemon evidence with explicit provider provenance through `/api/regional/evidence`; quarantined or unmatched SKUs return `null`.
- Existing exact `magic-en` evidence continues to return LigaMagic provenance through the same API.
- Vendor Workspace displays both providers through one source-aware panel while Arbitrage remains Magic-only.
- Focused tests, full tests, TypeScript, lint, production build, diff hygiene, and live database audit pass.

## Edge Cases

- A TCGplayer title repeats the printed collector after a dash: remove it only when the suffix agrees with the target collector.
- A collector contains alphabetic prefixes or suffixes: retain them; do not coerce it to an unrelated numeric identity.
- A set label differs only by a documented TCGplayer prefix or explicit alias: reconcile it; unrelated translated, Japanese, Chinese, promotional, or special-product sets remain unmatched.
- A card exists under more than one finish: source extras must select exactly one physical finish.
- Multiple source rows resolve to one SKU: quarantine the complete collision group.
- Snapshot or catalogue changes: rebuild under new source and pricing fingerprints; never mix generations.
- Pokémon tables have not yet been initialized: return no evidence rather than failing the Vendor Workspace request.
- A category has no approved regional provider: return no evidence and do not fall back to another game or provider.

## Dependencies

- `PHR-API-013` complete recurring LigaPokemon snapshots.
- `PHR-TECH-012` operational pricing database continuity.
- `PHR-API-004` English Pokémon TCGplayer catalogue identity.
- Existing bounded Pokémon set aliases used by snapshot artwork.

## Future Enhancements

- Evidence-backed Poké Ball, Master Ball, vintage edition, and foreign-language treatment mappings.
- Product Owner-approved Pokémon regional candidate exposure and opportunity ranking.
- Owner-facing reconciliation health and exception review.

## Technical Notes

The verified live result contains 25,200 exact unique matches, including 24,884 with both LigaPokemon consumer-low and TCGplayer Near Mint evidence. Eight punctuation-duplicate Professor's Research rows are quarantined across four target collision groups. Explicit foreign-market labels account for 8,474 quarantined rows and unsupported treatments for 2,600. Two consecutive builds produced fingerprint `295be8d699da35d13b8df82a59a6d46ae9a51fd6f337e6c60b3a7f3259c91d9a`.

Regional evidence remains provider-owned. `magic-en` reads only `regional_crosswalk` plus `regional_evidence`; `pokemon-en` reads only `regional_pokemon_crosswalk` plus `regional_pokemon_evidence`. The API does not union candidates across games and does not use price as identity proof.

## UI / UX Notes

Reuse the existing regional market panel. Show `LigaMagic` or `LigaPokemon` as visible provenance, retain the exact-match badge and observation time, and keep the existing unmatched/quarantined explanation. Regional evidence supplements rather than overwrites the TCGplayer snapshot card.

## Success Metrics

- Zero accepted ambiguous or colliding identities.
- Zero mutation of the existing Magic crosswalk.
- Deterministic repeated fingerprint for unchanged source and catalogue generations.
- Every accepted identity has both LigaPokemon and TCGplayer evidence provenance.

## Open Questions

- What verified evidence is sufficient to admit Poké Ball, Master Ball, and vintage edition treatments in a later policy version?
- Product Owner acceptance is still required before matched Pokémon rows enter the Arbitrage queue; the 2026-08-05 approval covers Vendor Workspace evidence only.

## Traceability

- Originating prompt: Product Owner request to reconcile the completed LigaPokemon acquisition, 2026-08-04.
- Related implementation prompt: `docs/prompts/PHR-API-014-ligapokemon-catalogue-reconciliation-prompt.md`.
- Related tests: `docs/testing/PHR-API-014-ligapokemon-catalogue-reconciliation-validation.md`.
- Related release notes: `docs/release-notes/PHR-API-014.md`.
- Related review: `docs/reviews/PHR-LIGAPOKEMON-CATALOGUE-RECONCILIATION-conformance-review.md`.
- Last modified: 2026-08-05.
- Modification reason: approve provider-aware exact LigaPokemon evidence in Vendor Workspace while retaining the separate Arbitrage exposure gate.
