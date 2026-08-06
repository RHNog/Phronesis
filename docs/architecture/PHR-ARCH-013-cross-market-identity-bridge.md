# PHR-ARCH-013 — Cross-Market Identity Bridge

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

Architecture / Identity / Market Evidence / Database

## Objective

Create the closest defensible approach to complete LigaMagic/TCGplayer catalogue reconciliation while preserving deterministic, auditable printing fidelity and refusing invented matches.

## Background

`PHR-API-005` produced a verified local LigaMagic snapshot containing 329,301 unique English/Near Mint identities. Phronesis already holds the TCGplayer-centred catalogue used by Vendor Workspace. Actionable regional pricing requires the two sources to refer to the exact same printing, language, treatment, and finish.

## Problem Statement

Names alone are insufficient. Editions, collector numbers, punctuation, promos, finishes, and LigaMagic's `Textless` export dimension can create plausible but incorrect joins. A false match would contaminate buying and arbitrage recommendations.

## Proposed Solution

Build a versioned crosswalk from normalized card name, normalized edition, collector number, language, and finish. A match is accepted only when it resolves to one canonical product. Every row records source hashes, method, confidence, and rejection reason. `Textless` rows are quarantined until explicit treatment evidence exists.

The acquired-data validation revision adds evidence-derived edition aliases. A LigaMagic edition may alias one TCGplayer edition only when at least two independent exact name + collector + finish anchors each resolve to one structurally compatible target edition, every structurally compatible anchor agrees on that target, no competing compatible target exists, deterministic structural edition tokens remain compatible, and language, promotion, Commander, remastered identity, anthology volume, art-series, token, Planechase, Eternal legality, border, digital-only, Ampersand, or other material-treatment context is preserved symmetrically. Reprint anchors whose edition is structurally incompatible with the LigaMagic source edition do not poison an otherwise unanimous edition relationship and cannot supply evidence for it.

The catalogue-coverage revision recognizes an evidence-backed asymmetry: TCGplayer legitimately omits collector numbers for some historical catalogue products while LigaMagic provides one. After exact full-identity and alias-assisted full-identity matching fail, Phronesis may adopt a collector-less TCGplayer row only when normalized card name, exact or accepted-alias edition, and finish resolve to exactly one TCGplayer product whose collector number is blank. The LigaMagic collector number remains in lineage; it is never discarded to compare two populated but different collector numbers.

Wizards records that printed collector numbers began with Exodus in June 1998 and premium/foil cards began with Urza's Legacy in February 1999. For an explicit pre-Exodus edition, Phronesis may therefore treat two populated but different catalogue-order values as nonprinting metadata only when exact normalized edition, card name, and finish resolve to one product. The finish remains mandatory, so a LigaMagic Foil shell cannot attach to a Normal-only historical product. Source: `https://magic.wizards.com/en/news/making-magic/which-came-first-2022-03-14`.

Three historical edition-label equivalences are explicit and versioned: `Limited Edition Alpha → Alpha Edition`, `Limited Edition Beta → Beta Edition`, and `International Collectors' Edition → International Edition`. They may resolve only to one collector-less target with the same normalized card name and finish. TCGplayer's `(CE)` and `(IE)` card-name suffixes are removed only inside the corresponding Collector's/International edition context.

Catalogue-structure mappings are also explicit and versioned. They cover LigaMagic's `Prerelease Events`, `Magic Player Rewards`, `Pro Tour Promos`, `Friday Night Magic`, `Media Inserts (EN)`, `Judge Gift Program`, `Arena League`, `Magic Game Day Cards`, `WPN/Gateway`, and `The List` groupings plus treatment-specific Mystery Booster catalogues. The LigaMagic codes establish `fsmb2` (Future Sight), `wbmb2` (White Border), `pcmb2` (MB2 playtest), `cmb1` (original convention playtest), and `cmb2` (the `No PW Symbol` convention generation). Generic `mb2` and generic Mystery Booster rows are not substitutes for these treatment-specific identities and remain unresolved unless another exact rule applies.

World Championship and early Pro Tour deck cards use a separate evidence-derived metadata bridge. LigaMagic embeds player code, two-digit year, optional sideboard status, and sometimes copy letter in the card name; TCGplayer spells out year, player, original set, and sideboard status. A player-code relationship requires at least three independent exact base-card/year/sideboard anchors, every unambiguous anchor must agree on one TCGplayer player, and the final product must be unique by player, year, base card, sideboard status, and Normal finish. Copy/land-art duplicates remain ambiguous rather than collapsing.

LigaMagic sometimes stores a printing treatment in the edition label while TCGplayer stores the same treatment in the product name. Phronesis moves only a documented, versioned LigaMagic treatment vocabulary into the candidate product name. It includes Extended Art, Surge Foil, Foil Etched, Retro Frame, Borderless and its named frame families, Showcase families, Halo/Galaxy/Mana/Textured/Ripple/Fracture/First-Place foils, Anime/Japanese art, Schematic, Sketch, Rulebook, Source Material, scene cards, and known LigaMagic misspellings such as `Bordeless`. The code-owned map is authoritative; unknown labels do not enter this path. Adoption still requires exact normalized card name, collector number, finish, one structurally compatible base edition, and exactly one resulting product.

The inverse product-name asymmetry is handled separately. When LigaMagic supplies the base card name and TCGplayer appends one or more parenthetical treatment labels, Phronesis may remove only labels from the same documented treatment vocabulary. The collector number and finish must remain exact, the editions must remain structurally compatible, the reduced name must be exact, and the target must be unique. This path does not remove arbitrary parentheticals or infer an undocumented treatment.

LigaMagic Art Series rows encode the physical side and signature state in Portuguese/English product annotations and often suffix the base collector with `a` or `b`; TCGplayer encodes Art Card and Gold-Stamped Signature in the product name and uses the base numeric collector. Phronesis accepts only the Art side, requires the same signature state, compatible Art Series edition, base numeric collector, Normal finish, exact reduced card name, and one target. `Stat Card` reverse-side rows stay unresolved because they are not separate TCGplayer products. The acquired TCGplayer snapshot represents all 4,847 Art Series products as Normal, so LigaMagic's duplicated Art Series Foil dimension is a catalogue shell and is quarantined.

Outside Art Series, a one-letter LigaMagic collector suffix may be removed only when the remaining numeric collector exactly equals the TCGplayer collector, normalized product name and finish are exact, edition structure is compatible, and one target remains. This narrow rule reconciles catalogue variant markers without weakening populated collector-number equality generally.

Token matching is catalogue-wide rather than set-specific. LigaMagic and TCGplayer token names are reduced only by removing the terminal product word, exact numeric card annotations, and power/toughness text. One-face tokens compare one normalized face; double-sided tokens compare both normalized faces and both numeric collector sides as unordered identities. The base edition must remain structurally compatible, finish must match, and the result must be unique. A single-side shell cannot attach to a two-face target merely because one face agrees.

LigaMagic's generic `(Variants)` buckets do not identify a treatment label, but the printed collector number and finish can still identify it. This path is restricted to editions ending exactly in `(Variants)`: collector and finish must be exact, the TCGplayer edition must be structurally compatible with the LigaMagic base edition, the TCGplayer product name must reduce to the LigaMagic card name only by removing trailing parenthetical treatment labels, and exactly one product may remain.

LigaMagic's exported `Textless` dimension is treated as a catalogue shell, not proof of a textless printing. It remains quarantined even when it carries duplicated price values. Coverage reports distinguish emitted source rows, supported Normal/Foil rows, accepted mappings, price-comparable mappings, and unresolved priced rows. “Closest to 100%” therefore means maximizing deterministic supported coverage, not changing the denominator or forcing uncertain mappings.

LigaMagic also emits Foil catalogue shells for sets that predate premium Magic cards. Those rows are impossible as printing identities and are quarantined before alias derivation or matching. The allowlist covers all pre-Urza's Legacy sets represented in the acquired catalogue plus explicit historical/black-border catalogue labels; Urza's Legacy and later legitimate foils remain eligible.

LigaMagic additionally mirrors some foil-only treatment editions into a Normal export row. A Normal row whose edition explicitly names Foil Etched, Gilded, Surge, Ripple, Galaxy, Textured, Halo, Mana, Fracture, or First-Place Foil is quarantined rather than attached to the corresponding foil-only TCGplayer product.

The bridge enforces target-side uniqueness after the full cascade. If multiple LigaMagic identities resolve to one TCGplayer product, Phronesis keeps a single result only when exactly one candidate has a strictly stronger method priority: exact identity, then evidence-derived alias, then exact-edition blank-collector recovery, then alias-edition blank-collector recovery. Ties and all weaker competing identities are changed to explicit ambiguity. The accepted crosswalk therefore contains no duplicated TCGplayer targets.

## Functional Requirements

- Discover the latest completed LigaMagic snapshot without enabling a schedule.
- Map blank `Extras` to Normal and `Foil` to Foil; quarantine `Textless` by default.
- Use exact normalized equality and explicit edition aliases only; do not use fuzzy similarity for canonical adoption.
- Evidence-derived edition aliases require at least two conflict-free, structurally compatible anchors, unanimous compatible-target agreement, deterministic edition-name compatibility, and qualifier preservation; they are versioned in the validation report.
- Prefer the complete name + edition + collector + finish identity whenever both catalogues provide it.
- Within the terminal parenthetical metadata chain, remove only an annotation whose normalized value exactly repeats that row's collector number. This reconciles forms such as `Plains (#279)` and `Card (0313) (Showcase)` without deleting adjacent treatment text.
- Permit a missing-TCG-collector recovery only for a unique normalized name + exact/accepted-alias edition + finish candidate whose TCGplayer collector field is blank.
- Never use the collector-less recovery when the TCGplayer collector field is populated, when multiple products share the reduced key, or when language/treatment evidence differs.
- For the explicit pre-Exodus allowlist only, permit one unique exact-edition + name + finish match despite differing populated catalogue-order values; never extend this rule to a modern, alias-only, duplicate-name, or finish-mismatched row.
- Permit only the documented historical edition-label equivalences, and require a unique collector-less target plus exact finish.
- Permit only the documented catalogue-structure mappings; require a unique normalized target name and exact finish, and preserve Future Sight, White Border, playtest generation, and `No PW Symbol` context.
- Derive World Championship/Pro Tour player-code mappings only from at least three unanimous anchors, then require a unique player + year + card + sideboard + finish target.
- Move only a documented LigaMagic edition treatment into the TCGplayer product name and retain full collector, finish, compatible-base-edition, and uniqueness requirements.
- Remove a TCGplayer product-name treatment suffix only when every removed label is documented and collector, finish, compatible edition, reduced name, and target uniqueness remain exact.
- Match Art Series only by compatible Art Series edition, base numeric collector, Art-side name, identical signature state, Normal finish, and one physical target; never adopt Stat-side or Foil-shell rows.
- Reconcile a one-letter LigaMagic collector suffix only to the exact numeric TCGplayer base collector with exact normalized name and finish, compatible edition, and one target.
- Match tokens only from normalized one- or two-face name identity, the corresponding one- or two-side collector identity, exact finish, a compatible base edition, and one unique target.
- Quarantine a LigaMagic Foil shell when its edition predates premium Magic printing; never let it seed an alias or attach to a Normal product.
- Quarantine a LigaMagic Normal shell when its edition explicitly names a foil-only treatment.
- Resolve a generic `(Variants)` row only through exact collector, exact finish, compatible base edition, treatment-suffix-only name reduction, and one remaining product.
- Resolve a LigaMagic identity to exactly one Phronesis product or preserve an explicit unmatched/ambiguous state.
- Enforce one accepted LigaMagic identity per TCGplayer target; quarantine target collisions unless one candidate has a unique strictly stronger method priority.
- Persist crosswalk lineage, source hashes, timestamps, and reason codes.
- Provide a reproducible build command and coverage report.
- Report full-identity, alias-assisted, missing-TCG-collector, pre-Exodus nonprinted-collector, comparable-price, unresolved-priced, ambiguous, and quarantined counts plus deterministic crosswalk fingerprint.
- Rebuilding the same source pair must be idempotent.

## Non-Functional Requirements

### Performance

The full local source pair must reconcile through indexed/batched operations without loading both catalogues into a quadratic in-memory comparison.

### Reliability

The bridge fails closed on missing source, hash drift, ambiguity, unsupported finish, malformed identity, populated collector conflict, or an unproven edition relationship.

### Security

No LigaMagic session material, cookies, credentials, or private request data enters the crosswalk or repository.

### Offline Support

Crosswalk generation and consumption operate entirely from verified local snapshots.

## User Stories

- As a buyer, I want Brazilian and US evidence attached to the exact printing so that a recommendation does not compare different cards.
- As an operator, I want unmatched rows explained so that coverage can improve without silently guessing.
- As an operator, I want a truthful coverage denominator and reason-code breakdown so that a high percentage cannot hide quarantined or unresolved catalogue rows.

## Acceptance Criteria

- Every accepted mapping is one-to-one and reproducible.
- No TCGplayer target appears in more than one accepted mapping.
- A collector-less recovery is accepted only when the target collector is absent and the reduced exact key is unique.
- Ambiguous, unsupported, and Textless rows cannot enter actionable calculations.
- Coverage and reason counts are available to operators.
- Focused tests cover punctuation, present and absent collector numbers, finish mapping, aliases, ambiguity, catalogue shells, and idempotency.

## Edge Cases

- Promo editions with different marketplace labels.
- Collector numbers with leading zeros, prefixes, suffixes, or denominators.
- Art Series Art/Stat sides, signature suffixes, and duplicated Foil export shells.
- Foil-only treatment editions duplicated into LigaMagic Normal rows.
- Multiple LigaMagic source identities converging on one TCGplayer target.
- A normalized identity resolving to multiple TCGplayer SKUs.
- LigaMagic rows with no collector number.
- TCGplayer historical rows with a blank collector number while LigaMagic provides one.
- Multiple blank-collector TCGplayer products sharing the same name, edition, and finish.
- LigaMagic `Textless` rows repeating Normal prices without independent treatment evidence.
- Identical membership duplicates already reconciled in `PHR-API-005`.

## Dependencies

- `PHR-API-005`
- `PHR-ARCH-007`
- `PHR-TECH-006`

## Technical Notes

Keep normalization pure and tested. Keep snapshot discovery and SQLite persistence server-only. Implement the matching cascade as named, versioned methods in strict-to-relaxed order. Store accepted mappings separately from candidate diagnostics so downstream consumers cannot mistake a candidate for canonical identity. Preserve the source collector number even when the target omits it.

## UI / UX Notes

Coverage belongs in Settings/Provider Operations. Operators should see matched, unmatched, ambiguous, unsupported, and stale counts with plain-language reasons.

## Success Metrics

- Zero ambiguous or populated-collector-conflict mappings adopted.
- Zero quarantined Textless rows used in decisions.
- Repeated builds produce the same crosswalk fingerprint.
- Every increase in coverage is attributable to a documented method and independently countable.

## Implementation Evidence

Two independent full rebuilds of the same 329,301-row LigaMagic source and TCGplayer snapshot produced byte-identical reports and the crosswalk fingerprint `8b96e2472cd3504d06a75bc475b158ef8bec5a722f2570b2bb33d133f8c22304`.

- Accepted unique mappings: 131,869, with zero duplicated TCGplayer targets.
- Method attribution: 73,104 exact; 24,185 evidence-derived edition alias; 4,452 missing TCGplayer collector (4,286 exact edition and 166 alias edition); 495 pre-Exodus nonprinted collector; 856 explicit historical edition; 2,976 explicit catalogue structure; 950 World Championship metadata; 12,867 edition-treatment-to-product-name; 3,672 documented product-treatment suffix; 2,235 Art Series physical identity; 185 one-letter collector suffix; 2,644 token identity, including 2,185 double-sided; and 3,248 generic variant identity.
- Supported identities after catalogue-shell quarantine: 203,936; accepted supported coverage: 64.66%.
- Supported identities carrying LigaMagic consumer price: 156,779; accepted consumer-priced mappings: 130,183, or 83.04%.
- Accepted mappings carrying any LigaMagic price: 130,976 of 163,172 supported priced identities, or 80.27%.
- Accepted mappings with both LigaMagic consumer and TCGplayer Near Mint evidence in the operational review database: 129,816, or 98.44% of all accepted mappings.
- Fail-closed residuals: 71,770 unmatched and 297 ambiguous, including 74 source-to-target collision quarantines; no ambiguous row was adopted.
- Quarantine: 109,763 unsupported `Textless` shells, 7,787 historically impossible Foil shells, 4,845 Art Series Foil shells, and 2,970 Normal mirrors of foil-only treatments. None can enter a decision.
- Priced residual queue: 26,309 unmatched and 287 ambiguous identities still carry LigaMagic consumer evidence and remain unavailable to Arbitrage until an exact target is proven.

The remaining gap is not treated as a percentage defect to be hidden. It is a labelled residual catalogue queue: missing upstream TCGplayer product families, LigaMagic-only shells, non-unique identities, and as-yet unproven catalogue conventions remain unresolved until new deterministic evidence exists.

## Open Questions

- Which remaining Mystery Booster, Mystery Booster 2, World Championship, and digital/remastered families have an actual exact TCGplayer product rather than a LigaMagic-only catalogue shell?
- Which unresolved priced rows can gain a unique mapping from new upstream catalogue evidence without weakening printing, treatment, language, or finish fidelity?

## Traceability

- Originating approval: Product Owner request on 2026-07-30 to turn LigaMagic data into vending and arbitrage intelligence.
- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Validation remediation prompt: `docs/prompts/PHR-ARCH-013-crosswalk-validation-remediation-prompt.md`.
- Last modified: 2026-07-31.
- Modification reason: Product Owner reopened coverage with an explicit closest-defensible-to-100% objective and requested deeper LigaMagic catalogue handling.
