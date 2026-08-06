# PHR-API-015 — Maximum Liga Equivalence Coverage

## Feature ID

`PHR-API-015`

## Title

Maximum TCGplayer-to-Liga equivalence coverage

## Status

Implemented And Live — Product Review Ready

## Priority

Critical

## Category

API / Database / Identity / Market Evidence / Reliability / Testing

## Objective

Give every Magic and English Pokémon TCGplayer product an explicit, auditable LigaMagic or LigaPokemon reconciliation disposition, maximize defensible Brazil-price coverage, and distinguish exact printing matches from compatible market equivalents.

## Background

`PHR-API-014` deliberately admitted only exact LigaPokemon name, set, collector, and finish identity. That protected Arbitrage, but it also hid legitimate Brazil evidence when provider presentation differed. The reported Lucario V `27/73` is present in LigaPokemon with a R$29.99 foil price; LigaPokemon encoded the set as `Champion&rsquo;s Path`, so the literal entity text prevented an otherwise exact match.

Magic already has a mature multi-stage reconciler and covers 131,883 of 159,126 TCGplayer singles (82.88%). Pokémon covers 25,200 of 43,748 English TCGplayer singles (57.60%) under the original exact policy. The source collection exports do not contain sealed-product identities and do not contain every TCGplayer-exclusive code card, promotional treatment, language, or historical edition.

## Problem Statement

The current source-centric crosswalk answers which Liga rows matched, but it does not account for every TCGplayer target. Presentation-only HTML entities, title decorations, ampersand spelling, set prefixes, and compatible vintage finish families unnecessarily suppress legitimate evidence. Conversely, forcing a price onto a target for which Liga publishes no product would fabricate market evidence.

## Proposed Solution

- Preserve the exact source crosswalk used by Arbitrage.
- Add a provider-aware, TCGplayer-target equivalence ledger containing one row for every Magic and English Pokémon TCGplayer product.
- Classify each target as `EXACT`, `COMPATIBLE`, `AMBIGUOUS`, or `UNAVAILABLE` and persist the matching method, confidence, source generation, and explanation.
- Decode bounded HTML entities and canonicalize presentation-only ampersand spelling before Pokémon identity comparison.
- For Pokémon, select candidates through ordered structural tiers. Exact set + collector + finish may tolerate presentation-only title decoration because set/collector is the printed card identity. Material qualifiers such as Staff, Cosmos Holo, Jumbo, Shadowless, or pattern foils cannot be discarded; when Liga publishes only an otherwise unique generic identity, the result is compatible rather than exact. Compatible tiers may also bridge a generic Liga finish to a TCGplayer vintage edition only when name, set, and collector remain exact and the source candidate is unique.
- Never use price, row order, rarity, color, or the highest/lowest value to choose identity.
- Return exact and compatible evidence to Vendor Workspace with visible match-quality language. Keep compatible evidence out of Arbitrage and every executable-opportunity path.
- Treat every TCGplayer target as reconciled administratively even when its honest disposition is that no Liga identity exists in the acquired snapshot.

## Functional Requirements

- `regional_product_equivalence` contains exactly one provider row for every current `magic-en` and English `pokemon-en` TCGplayer product, including sealed products.
- Sealed products receive `UNAVAILABLE` because the authenticated Liga collection exports contain card identities, not sealed catalogue identities.
- Existing accepted LigaMagic rows populate the Magic target ledger without changing the Magic matching policy.
- Pokémon exact matching decodes numeric entities plus the bounded named entities found in acquired LigaPokemon identity fields, treats `&` and `and` as presentation equivalents, and preserves meaningful words.
- Pokémon candidate selection is deterministic and ordered:
  1. normalized name + set + collector + exact finish;
  2. normalized set + collector + exact finish with one semantic source identity and no unresolved material-treatment qualifier, allowing presentation-only title decoration drift;
  3. normalized name + collector + exact finish only when source and target set labels are structurally compatible and one semantic source identity remains;
  4. normalized set + collector + exact finish with one source identity when Liga omits a target material-treatment qualifier;
  5. normalized name + set + collector + compatible finish family with one semantic source identity;
  6. normalized set + collector + compatible finish family with one semantic source identity.
- Tiers 1–3 are `EXACT`; tiers 4–6 are `COMPATIBLE`. Multiple non-identical candidates are `AMBIGUOUS`; no candidate is `UNAVAILABLE`.
- HTML decoding never fetches network data and does not interpret arbitrary HTML.
- Every accepted evidence row retains the provider identity, source card/set/collector/finish, observation timestamp, match quality, method, and confidence.
- Regional evidence lookup may return `EXACT` or `COMPATIBLE` rows to Vendor Workspace. Compatible evidence is visibly labelled and cannot be described as exact.
- `RegionalIntelligenceRepository.listCandidates` and all Arbitrage queries continue to consume only the original exact `MATCHED` source crosswalk.
- Rebuilds replace only the applicable provider/category equivalence rows inside the existing reconciliation transaction.
- Reports include target totals, exact/compatible/ambiguous/unavailable counts, priced-target coverage, and a deterministic target-ledger fingerprint.
- Lucario V, Champion's Path, `27/73`, Holofoil resolves to the acquired LigaPokemon foil row and exposes R$29.99 low/average/high evidence.

## Non-Functional Requirements

### Performance

Build indexed identity maps once and scan each source and target row linearly without per-card network calls.

### Scalability

The provider-aware target ledger supports additional games and Liga providers without combining provider namespaces.

### Maintainability

Keep HTML decoding, identity normalization, candidate classification, persistence, reporting, and UI presentation separately testable.

### Reliability

Use transactional replacement, complete snapshot/hash binding, deterministic selection, explicit ambiguity, and last-good preservation.

### Accessibility

Match quality and limitations are visible text, not color-only signals.

### Offline Support

All reconciliation runs from the acquired local provider snapshots and local TCGplayer catalogue.

### Security

Do not add credentials, browser access, scraping, network requests, or client-readable secrets.

### Extensibility

Compatible evidence can support research and negotiation, but promotion into Arbitrage requires a separately approved policy.

### Responsiveness

The existing combined TCG/Liga pricing card must remain usable without horizontal overflow at phone width.

## User Stories

- As a vendor, I want the highest defensible Liga price coverage beside TCGplayer so presentation differences do not hide an existing Brazil market.
- As a vendor, I want compatible equivalents labelled separately from exact printings so I can judge the evidence appropriately.
- As the Product Owner, I want every TCGplayer product accounted for, including an explicit unavailable reason when Liga has no corresponding product.
- As an arbitrage operator, I want compatible proxies excluded from executable opportunity calculations.

## Acceptance Criteria

- Every current Magic and English Pokémon TCGplayer product has exactly one provider-specific equivalence-ledger disposition.
- Lucario V `27/73` displays the acquired LigaPokemon R$29.99 evidence as an exact match.
- Pokémon exact or compatible target coverage materially exceeds the 25,200-target baseline without price-based or fuzzy identity selection.
- Magic retains its 131,883 accepted targets and existing Arbitrage behavior.
- Compatible evidence is visually and structurally distinguishable from exact evidence.
- Ambiguous/unavailable targets never receive a fabricated price.
- Focused tests, full tests, TypeScript, lint, production build, deterministic rebuild, diff hygiene, and live-data audit pass.

## Edge Cases

- Encoded apostrophes and numeric entities decode before normalization.
- TCGplayer title qualifiers such as alternate art or Delta Species may differ while exact set, collector, and finish identify one source card.
- Staff, Cosmos Holo, Jumbo, Shadowless, stamped, and named pattern qualifiers remain material; an otherwise unique generic Liga identity is compatible, never exact.
- First Edition or Unlimited targets may receive only a generic Liga finish-family equivalent and must be labelled compatible.
- Provider rows with all price lanes zero can establish identity but display unavailable values.
- Code cards and collector-less promotional products remain unavailable unless the acquired Liga snapshot contains a unique structural identity.
- More than one non-identical source candidate remains ambiguous; price cannot break the tie.
- Foreign-market labels and unsupported special treatments remain outside eligible source candidates.

## Dependencies

- `PHR-API-014` exact LigaPokemon reconciliation.
- `PHR-ARCH-013` LigaMagic cross-market identity bridge.
- `PHR-API-013` complete recurring provider snapshots.
- `PHR-UX-022` combined TCG/Liga pricing card.

## Future Enhancements

- Acquire an authenticated Liga sealed-product catalogue if the provider offers one.
- Add owner-reviewed mappings for promotional treatments that cannot be proved structurally.
- Add a reconciliation-health surface with searchable unavailable/ambiguous buckets.

## Technical Notes

The target ledger is additive. Existing source crosswalks remain the only identity authority for Arbitrage. Vendor Workspace may consume broader equivalent evidence because its purpose is market comparison, provided match quality is explicit.

## UI / UX Notes

Use `exact printing` for exact evidence and `compatible Liga equivalent` for compatible evidence. Show the matching basis in concise secondary text. Do not present compatible evidence as the primary TCG offer reference or as verified availability.

## Success Metrics

- 100% target disposition coverage across both provider-supported games.
- Higher priced-target coverage than the current Pokémon baseline.
- Zero price-selected identity matches.
- Zero compatible rows entering Arbitrage.

## Open Questions

- None blocking. Literal 100% price coverage cannot be guaranteed when the acquired provider export has no corresponding identity; those targets receive an explicit `UNAVAILABLE` disposition rather than fabricated evidence.

## Traceability

- Originating prompt: Product Owner request for maximum Liga reconciliation after Lucario V lacked Brazil pricing, 2026-08-05.
- Related implementation prompt: `docs/prompts/PHR-API-015-maximum-liga-equivalence-coverage-prompt.md`.
- Related tests: `docs/testing/PHR-API-015-maximum-liga-equivalence-coverage-validation.md`.
- Related release notes: `docs/release-notes/PHR-API-015.md`.
- Implementation report: `docs/implementation-reports/PHR-API-015-maximum-liga-equivalence-coverage-report.md`.
- Conformance review: `docs/reviews/PHR-API-015-maximum-liga-equivalence-coverage-conformance-review.md`.
- Last modified: 2026-08-05.
- Modification reason: implementation, operational reconciliation, private deployment, and live runtime validation completed; Product Review remains pending.
