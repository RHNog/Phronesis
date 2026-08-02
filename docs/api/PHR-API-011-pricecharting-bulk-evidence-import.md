# PHR-API-011 — PriceCharting Bulk Evidence Import

## Feature ID

`PHR-API-011`

## Title

Transactional PriceCharting Bulk Evidence Import And Identity Reconciliation

## Status

Implemented — Product Review Ready; Dry Run Complete, Activation Pending

## Priority

High

## Category

API / Database / Identity / Market Evidence / Workflow / Reliability

## Objective

Import a complete PriceCharting price-guide CSV into Phronesis as independently attributed market evidence, attach only collision-free exact identities, preserve every unresolved record for later improvement, and establish a provider-neutral ingestion boundary that can accept separately audited One Piece and Magic datasets without redesigning the system.

## Background

`PHR-API-010` added a secure, rate-limited live PriceCharting adapter and a separately attributed Graded Area. The live adapter is useful for individual verification but is inefficient for broad catalogue coverage. PriceCharting also supplies a daily bulk CSV containing current ungraded, graded, retail, release-date, sales-volume, and cross-provider identity evidence.

The owner-provided Pokémon export contains 91,572 records. A read-only comparison against the current Phronesis Pokémon catalogue found 45,627 English records, including 44,186 singles and 1,441 sealed products. The current Phronesis catalogue contains 43,732 Pokémon single SKUs and 2,892 Pokémon sealed SKUs.

The first strict comparison produced 19,163 strong row-level candidates across 16,329 Phronesis single SKUs. A mandatory one-to-one collision gate reduces the collision-free candidate ceiling to 13,957 PriceCharting records and 13,957 Phronesis SKUs. Of those candidates, 13,596 carry graded evidence. The importer may accept fewer after its stricter versioned identity rules run; these figures are a measured reconciliation benchmark, not a matching quota. Another 5,206 otherwise strong PriceCharting rows converge on 2,372 Phronesis targets and must remain quarantined until the physical-variant distinction is proven.

## Problem Statement

Phronesis does not yet have a bulk PriceCharting ingestion contract. Directly merging the CSV into `pricing_products` or `pricing_latest` would create several unacceptable risks:

- PriceCharting IDs identify PriceCharting products, while Phronesis SKUs represent TCGplayer-centred physical market variants.
- PriceCharting `tcg-id` is populated on many rows but is not unique and is not equivalent to the TCGplayer SKU identifiers retained by the current importer.
- Multiple PriceCharting products can converge on one Phronesis SKU when stamped, promotional, edition, error, or other physical distinctions are lost.
- The CSV contains non-English catalogues, sealed products, non-standard Pokémon collectibles, sparse and duplicated UPC values, malformed genre rows, and anomalous release dates.
- PriceCharting provides no artwork field and no TCG Direct Low value.
- A partial, malformed, or interrupted import must never displace the current TCGplayer snapshot or the last-good PriceCharting evidence.

## Proposed Solution

Create a provider-neutral `ProviderEvidenceImportPipeline` with a first adapter named `PriceChartingCsvAdapter`. The pipeline has five explicit phases:

1. **Receipt** — copy the source into immutable ignored local storage, hash it, record its byte count and acquisition facts, and assign one import receipt.
2. **Validation and normalization** — validate the complete schema, parse provider values into typed staging records, and reject or quarantine malformed rows without changing active evidence.
3. **Identity resolution** — run a game-specific, versioned matching cascade and produce accepted candidates, reviewable candidates, ambiguity, collision, unmatched, and quarantine records.
4. **Atomic promotion** — activate only an internally coherent, collision-free mapping and observation set in one database transaction while retaining the prior active receipt as rollback.
5. **Coverage reporting** — persist denominators, method attribution, field coverage, collision counts, unmatched reason codes, and a deterministic crosswalk fingerprint.

The first implementation is an owner-operated local command with dry-run as the default and an explicit `--apply` promotion flag. Network acquisition and recurring scheduling are deliberately deferred. The same importer contracts must make the later scheduler an orchestration layer rather than a second ingestion system.

## System Boundaries

```text
Owner-provided PriceCharting CSV
        |
        v
Immutable source receipt + SHA-256
        |
        v
Strict PriceCharting adapter
        |
        v
Provider staging records
        |
        v
Versioned game identity resolver
        |-------------------------------|
        v                               v
Accepted one-to-one mappings       Review / ambiguous /
        |                          collision / unmatched /
        v                          quarantined records
Independent provider observations
        |
        v
Graded Area and future evidence consumers

TCGplayer pricing_products/pricing_latest remain unchanged.
```

## Functional Requirements

### Import Command

- Add one local command equivalent to:

  ```text
  npm run pricecharting:import -- --file <absolute-csv-path> --game pokemon-en
  npm run pricecharting:import -- --file <absolute-csv-path> --game pokemon-en --apply
  ```

- Dry-run is the default and performs every step except active-state promotion.
- `--apply` is accepted only after validation and resolution complete successfully.
- The command must never print a provider token, environment-file contents, or raw private path beyond the operator-supplied source path.
- The command must emit a compact human summary and write a complete JSON coverage report beside the immutable local receipt.

### Immutable Receipt

- Copy the source into ignored local storage before parsing it for promotion.
- Record provider, dataset kind, declared game profile, schema-contract version, source SHA-256, byte count, source row count, observed file modification time, import start/completion time, application version, and outcome.
- Address idempotency by `(provider, dataset_kind, game_profile, source_hash, schema_contract_version)`.
- Importing the same receipt again must return `ALREADY_IMPORTED` or the existing dry-run result without duplicating mappings or observations.
- Never overwrite or delete an earlier receipt during import.

### Schema Validation

- Require the exact approved 27-column PriceCharting contract unless an explicitly versioned adapter supports a later schema.
- Normalize UTF-8 BOM, CRLF/LF, and quoted CSV fields without silently accepting a shifted column count.
- Parse currency strings into integer USD cents. Reject negative, non-finite, and malformed currency values.
- Treat identifiers as strings, preserving leading zeros where semantically meaningful.
- Validate dates as real calendar dates. Quarantine placeholder or impossible values such as year `0001`.
- Quarantine numeric or unknown `genre` values rather than inferring product type.
- Preserve empty fields as `NULL`; never convert an absent value to zero.
- Record all validation and quarantine reason codes with row numbers and provider IDs.

### Provider-Normalized Record

Each staged PriceCharting record must preserve at least:

- PriceCharting product ID.
- Console/catalogue name.
- Product name.
- Parsed game profile and language.
- Product type: Single, Sealed, Unsupported Collectible, or Unresolved.
- Parsed base name, set evidence, collector number, and bracketed variation qualifiers.
- PriceCharting TCG ID, UPC, ASIN, and ePID as typed aliases when present.
- Release date and sales volume.
- Ungraded, grade 7/7.5, grade 8/8.5, grade 9, grade 9.5, PSA 10, BGS 10, CGC 10, and SGC 10 prices.
- Retail loose/CIB/new buy and sell values.
- Identity fingerprint and observation fingerprint.
- Source receipt and source row number.

### Identity Resolution States

Every provider record must end in exactly one state:

- `AUTO_ACCEPTED`
- `REVIEW_REQUIRED`
- `AMBIGUOUS`
- `TARGET_COLLISION`
- `UNMATCHED`
- `QUARANTINED`
- `UNSUPPORTED`
- `SUPERSEDED`

Only `AUTO_ACCEPTED` records can become active evidence without owner review.

### Pokémon Single Matching Cascade

Matching methods are named, versioned, ordered from strictest to weakest, and independently countable.

1. **Existing accepted provider mapping** — reuse a prior PriceCharting-ID mapping only when the provider identity fingerprint and target identity fingerprint remain unchanged.
2. **Exact physical identity** — exact normalized name, compatible exact set identity, full canonical collector number, English language, compatible physical variation, and one unclaimed target.
3. **Documented set-alias identity** — exact normalized name, a documented set alias, collector-number equivalence that preserves prefix/suffix and rejects denominator conflict, English language, compatible physical variation, and one unclaimed target.
4. **Collector-less exact identity** — only when collector evidence is absent on both sides and exact name, exact set, language, variation, and target uniqueness remain sufficient.

The following are never automatic:

- Name-only or name-plus-number matches with incompatible set evidence.
- A bare PriceCharting `tcg-id` without a typed, independently verified local TCGplayer Product alias.
- Any mapping that drops stamped, staff, prerelease, error, shadowless, first-edition, serial, language, foil, reverse, promo, or other physical qualifiers.
- Any source-to-target or target-to-source collision.
- A collector-number denominator conflict.
- Non-English data in the English game profile.
- Non-TCG Pokémon collectibles mixed into the normal Pokémon TCG catalogue.

### Collision Policy

- The active mapping is one PriceCharting product ID to one Phronesis physical SKU and one Phronesis physical SKU to one active PriceCharting product ID.
- If multiple otherwise strong PriceCharting records converge on one Phronesis SKU, quarantine all involved records as `TARGET_COLLISION`.
- A future explicit alias decision may prove two provider IDs represent the same physical item, but that decision must be versioned, documented, and separately tested. The importer never chooses the highest price, newest row, or first row.
- The current measured baseline contains 5,206 colliding PriceCharting rows across 2,372 Phronesis targets; this is a required validation fixture and not an ignorable residual.

### Sealed Policy

- Stage all valid English sealed records and report their evidence coverage.
- Do not automatically promote a sealed mapping in the first implementation unless exact provider mapping or exact normalized product name plus exact set and a second non-price identity signal prove uniqueness.
- UPC is corroboration only because the supplied dataset is sparse and contains duplicates.
- Price, sales volume, or release proximity can never resolve sealed identity.
- A dedicated sealed identity profile is a later enhancement of this same feature, not a reason to weaken the first single-card resolver.

### Price And Evidence Semantics

- Store PriceCharting values as independent USD market observations linked to the accepted PriceCharting Market Identity.
- Never write PriceCharting values into TCGplayer-owned `pricing_latest`, `pricing_history`, `market_price_cents`, `direct_low_cents`, or delivered-low fields.
- Preserve the current business precedence:

  1. TCG Direct Low when available.
  2. Existing TCG Low/delivered-low and TCG Market evidence according to the approved buying rule.
  3. PriceCharting as separately attributed graded and corroborating evidence.

- PriceCharting Ungraded is not TCG Direct Low.
- The first implementation may display imported evidence in the existing Graded Area but must not change recommended-offer calculations.
- Current-only CSV values are append-only observations at the receipt timestamp. A later receipt may supersede active display state but must not rewrite history.

### Atomic Promotion And Last-Good Behavior

- Staging and resolution occur outside active evidence tables.
- Promotion uses one database transaction and one active-receipt pointer per provider/game/dataset.
- Promotion must verify receipt completeness, schema version, row-count reconciliation, accepted-map uniqueness, zero active target collisions, and observation foreign keys.
- Any failure rolls back the entire promotion and leaves the previous active receipt available.
- A dry run cannot alter active pointers, mappings, observations, TCGplayer data, Inventory, Event Ledger, Vendor cart, or Display Case.
- Rollback is pointer-based activation of the prior internally complete receipt; raw evidence and audit records remain append-only.

### Coverage Report

Every run must report:

- Source, validated, staged, quarantined, unsupported, accepted, review-required, ambiguous, collision, and unmatched counts.
- Counts by game, language, product type, matching method, price field, and reason code.
- Distinct provider IDs and distinct target SKUs.
- Source-to-target and target-to-source collision counts.
- Exact one-to-one accepted coverage over both the PriceCharting denominator and Phronesis denominator.
- Graded-field, release-date, sales-volume, retail, UPC, and TCG-ID coverage.
- Deterministic source hash, normalized-record hash, crosswalk fingerprint, and promoted observation fingerprint.
- Prior active receipt and new active receipt when promotion occurs.

### Database Design

Add provider-neutral tables inside the configured local pricing database. Final names may follow repository conventions, but semantic ownership must remain equivalent to:

- `provider_import_receipt`
- `provider_import_record`
- `provider_identity_mapping`
- `provider_identity_candidate`
- `provider_market_observation`
- `provider_import_metric`
- `provider_import_active_state`

Required constraints:

- Unique provider record: `(provider_id, provider_product_id, receipt_id)`.
- Unique active source mapping: `(provider_id, provider_product_id, game_profile)`.
- Partial or transactional uniqueness for one active mapping per Phronesis target SKU and provider.
- Observation uniqueness: `(provider_id, provider_product_id, evidence_lane, observed_at, receipt_id)`.
- Foreign keys from observations to provider records and accepted mappings.
- Indexed lookup by provider product ID, target category/SKU, mapping state, receipt, game, language, product type, and observed time.

Raw provider payload values may be stored only when bounded, non-secret, and required for audit. Normalized columns remain the query contract.

## Non-Functional Requirements

### Performance

- Match through indexed keys and bounded candidate sets; never compare every source row with every Phronesis product.
- The current 91,572-row source must validate, resolve, and produce a dry-run report in a practical local operation without blocking Vendor Workspace reads for the full analysis duration.
- Active promotion must keep the write transaction bounded to staged-to-active database operations.
- Existing Vendor Workspace search latency and TCGplayer refresh latency must not regress.

### Scalability

- Provider parsing is isolated from game matching.
- Game profiles own set aliases, collector normalization, language vocabulary, variation compatibility, and unsupported-product taxonomy.
- Adding One Piece or Magic requires a separately audited game profile and dataset, not new receipt, staging, observation, or promotion infrastructure.

### Maintainability

- Schema-contract, normalization-contract, and resolver versions are explicit.
- Matching methods are pure, named, independently tested functions.
- Coverage improvements require adding or strengthening a documented method; thresholds cannot silently change.

### Reliability

- Fail closed on schema drift, truncated source, malformed price, invalid identity, hash drift, collision, or database failure.
- Preserve last-good active evidence through every failure.
- Repeated imports of the same receipt are idempotent.

### Accessibility

- Future Settings status uses text labels in addition to color for Current, Dry Run, Failed, Review Required, and Stale states.
- Graded evidence retains provider attribution and readable grade labels.

### Offline Support

- Validation, matching, reporting, and consumption run entirely from the verified local receipt after acquisition.
- The first implementation makes no provider network request.

### Security

- Bulk import does not require the API token.
- A future acquisition worker must reuse the encrypted provider credential boundary and keep the token server-only.
- CSV cells are untrusted data and cannot become formulas, shell commands, SQL fragments, paths, or HTML.
- No raw secret or authenticated download URL is persisted in reports.

### Extensibility

- The pipeline exposes provider adapter, game profile, evidence-lane registry, receipt store, resolver, promoter, and report writer interfaces.
- PriceCharting-specific field names stop at the adapter boundary.

### Responsiveness

- No new primary application page is required in the first implementation.
- Any Settings summary must remain compact and phone-safe; the full residual report remains a downloadable/local artifact.

## User Stories

- As a buyer, I want graded values preloaded for the exact card so that I can evaluate a slab without waiting for several provider calls.
- As an owner, I want every rejected match explained so that coverage can improve without silently pricing the wrong card.
- As an operator, I want the last-good dataset to survive a malformed daily file.
- As a developer, I want Pokémon, One Piece, and Magic to share one import transaction and evidence model while retaining separate identity rules.

## Acceptance Criteria

- The owner-provided Pokémon file imports through an exact versioned schema contract.
- Dry-run is default and produces a complete deterministic report without changing active evidence.
- Apply mode promotes one complete receipt atomically and is idempotent.
- Every accepted mapping is one-to-one, collision-free, method-attributed, and reproducible.
- The measured current source reproduces the 13,957 collision-free candidate ceiling and 13,596 graded-candidate count, or explains source/catalogue/hash drift and every stricter exclusion.
- The accepted automatic mapping total may be lower than the candidate ceiling. It may be higher only when a documented, tested identity method proves additional targets.
- The 5,206 measured colliding rows across 2,372 targets are not promoted.
- PriceCharting data never changes TCG Direct Low, TCG Market, TCG Low, delivered low, artwork, or recommended offer.
- A failed import preserves the prior active receipt.
- The full suite, focused importer tests, TypeScript, warning-free lint, production build, and diff hygiene pass.

## Edge Cases

- PriceCharting product name contains collector, grade, language, promo, error, or treatment text in brackets.
- Collector number has leading zeros, alphabetic prefixes/suffixes, or a denominator that disagrees with Phronesis.
- Two PriceCharting products target one Phronesis SKU.
- One PriceCharting record has more than one equally valid Phronesis target.
- PriceCharting TCG ID is duplicated across variants.
- UPC is blank, malformed, or duplicated.
- `genre` is numeric or unknown.
- Release date is absent, impossible, or a placeholder.
- A PriceCharting record represents Topps, KFC, sticker, toy, oversized, or another non-standard collectible.
- A sealed product shares a name with a booster pack, box, case, bundle, or deck variant.
- The same file is imported twice, a process stops after staging, or promotion fails after the prior receipt is active.

## Dependencies

- `PHR-API-010` PriceCharting Graded Evidence.
- `PHR-ARCH-007` Cross-Game Identity Ontology.
- `PHR-ARCH-013` Cross-Market Identity Bridge.
- `PHR-WORKFLOW-004` Snapshot-Powered Vendor Workspace.
- `PHR-TECH-006` Event Snapshot Activation And Resilient Ingestion.
- Configured local pricing database and encrypted provider credential boundary.

## Future Enhancements

- Daily authenticated PriceCharting CSV acquisition and recurring scheduler.
- Owner review workflow for `REVIEW_REQUIRED`, `AMBIGUOUS`, and `TARGET_COLLISION` records.
- Dedicated sealed matching profile.
- Separately audited One Piece and Magic game profiles.
- Other provider bulk adapters using the same receipt and evidence infrastructure.

## Technical Notes

The first implementation should introduce the generalized boundaries only to the degree exercised by PriceCharting; it must not build speculative provider abstractions with no test consumer. PriceCharting ID is the provider primary key. `tcg-id`, UPC, ASIN, and ePID are typed corroborating aliases. Market observations are immutable evidence, not canonical product fields.

The active receipt pointer is the consumer boundary. Historical receipts, mappings, candidates, and observations remain queryable for audit. A provider identity fingerprint excludes current prices so ordinary price changes do not invalidate a mapping. An observation fingerprint includes the complete price ladder and current metadata so unchanged daily files do not duplicate history.

## UI / UX Notes

The existing Graded Area consumes the active collision-free evidence and continues to offer live manual verification. Imported values must show PriceCharting attribution and observation date. A stale or absent bulk receipt must remain visible and must not be presented as current evidence.

Settings may show only the operational summary: configured credential, last successful receipt, source age, accepted/review/collision/unmatched counts, current game coverage, and whether recurring acquisition is disabled. It must not expose raw rows or secrets.

## Success Metrics

- Zero target collisions promoted.
- Zero PriceCharting observations written into TCGplayer-owned price lanes.
- Zero schema-drift or partial receipts activated.
- Deterministic crosswalk fingerprint on repeated dry runs of the same source pair.
- The report reconciles accepted graded mappings against the measured 13,596 collision-free graded-candidate benchmark without treating that benchmark as a quota.
- Every non-accepted record has one durable resolution state and reason code.
- One Piece and Magic require only new audited game profiles and datasets, not a replacement ingestion architecture.

## Open Questions

- Which PriceCharting plan endpoint and response headers should the later acquisition worker use to prove daily snapshot completion and source date?
- Which of the current target collisions are true provider aliases versus missing physical-variant distinctions in the Phronesis catalogue?
- Which additional typed TCGplayer Product identifiers can be retained upstream to strengthen future cross-provider resolution?

## Traceability

- Originating direction: Product Owner request on 2026-08-01 to devise the importer before implementing recurrence and then extend PriceCharting to One Piece and Magic.
- Related implementation prompt: `docs/prompts/PHR-API-011-pricecharting-bulk-evidence-import-prompt.md`.
- Related tests: `docs/testing/PHR-API-011-pricecharting-bulk-evidence-import-validation.md`.
- Related release notes: `docs/release-notes/PHR-API-011.md`.
- Implementation report: `docs/implementation-reports/PHR-API-011-pricecharting-bulk-evidence-import.md`.
- Last modified: 2026-08-01.
- Modification reason: Recomputed the owner-file dry run with resolver v9 and documented the expanded exact-identity rules, residuals, and validation evidence.

## Implementation Evidence

- `npm run pricecharting:import -- --file <path> --game pokemon-en` is dry-run by default; `--apply` is the only activation path.
- Seven additive provider-evidence tables preserve receipts, normalized records, candidates, mappings, observations, metrics, and the active receipt pointer.
- The Graded Area consumes active imported evidence by exact category/SKU before falling back to the separately attributed live verifier.
- Settings reports bulk receipt health without exposing rows or credentials.
- The owner source hash `a06dcdde0093d82d9c727f390d5d5913eadba1cb1334eb7f683cb34f0d4faac1` staged 91,572 rows in final dry-run receipt `3`; no active pointer exists.
- Resolver `pokemon-en-v9` produced 33,379 one-to-one automatic candidates, 32,099 with graded evidence, 1,704 target-collision rows across 745 targets, 387 ambiguous rows, 5,851 unmatched rows, 1,425 sealed review rows, 189 quarantined rows, and 48,637 unsupported/non-English rows. Automatic coverage is 80.78% of 41,321 eligible English-single rows and 76.33% of 43,732 local Pokémon single SKUs.
- Resolver v9 extends exact coverage through bounded, fixture-gated identity facts: decorated local-name removal; leading-zero/full-denominator collector compatibility; explicit modern/base/promo/championship aliases; four printed-name alias families; token-boundary qualifier handling; collector-proven target rarity labels; Poké Ball/Master Ball pattern parity; Shadowless set identity; SH-numbered legacy Shiny treatment; exact annotation tie-breaking; explicit Prize Pack routing; and base/Holo pairing only when a sibling provider row proves the finish family. `Non-Holo` is explicitly excluded from Holo matching.
- The resolver does not use price, row order, bare TCG ID, generic name containment, edit distance, or fuzzy thresholds. Generic League, World Championship without matching year/player annotation, Dunkin/Topps, name-only, collector-only, and under-specified legacy finish residuals remain non-active.
