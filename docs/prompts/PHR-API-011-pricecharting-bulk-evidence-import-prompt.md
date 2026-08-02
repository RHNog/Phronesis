# PHR-API-011 Implementation Prompt

## Project Context

Project Phronesis is an evidence-driven decision-intelligence and card-show operating platform. The local TCGplayer catalogue remains the operational source for product search and buying evidence. PriceCharting is a separately attributed provider of current ungraded and graded values, product metadata, and provider aliases.

Documentation is part of implementation. Follow the feature specification before changing code.

## Feature ID

`PHR-API-011`

## Objective

Implement the owner-operated, transactional PriceCharting bulk CSV importer specified by `PHR-API-011`. Import and stage the complete owner-provided Pokémon dataset, promote only collision-free exact English single-card mappings, persist independent PriceCharting observations, expose active imported evidence to the existing Graded Area, and produce a deterministic coverage report. Do not implement recurring network acquisition or scheduling.

## Delivery Lane And Slices

Use the Standard Lane with three ordered, independently verifiable slices:

1. **Receipt, schema, and staging** — immutable source receipt, strict CSV contract, normalized records, database migration, dry-run command, quarantine reasons, and idempotency.
2. **Identity resolution and promotion** — versioned Pokémon resolver, one-to-one collision gate, candidate diagnostics, atomic promotion, last-good pointer, independent observations, and deterministic coverage report.
3. **Consumption and operations** — imported-evidence read model for the existing Graded Area, compact Settings/provider-health summary, full regression evidence, and documentation reconciliation.

Do not begin a later slice until the prior slice has a durable checkpoint and focused tests.

## Required Reading

- `AGENTS.md`
- `.agents/WORKFLOW.md`
- `.agents/roles/engineer.md`
- `docs/api/PHR-API-011-pricecharting-bulk-evidence-import.md`
- `docs/api/PHR-API-010-pricecharting-graded-evidence.md`
- `docs/architecture/PHR-ARCH-007-cross-game-identity-ontology.md`
- `docs/architecture/PHR-ARCH-013-cross-market-identity-bridge.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `docs/technical/PHR-TECH-006-event-snapshot-activation.md`
- `docs/testing/PHR-API-011-pricecharting-bulk-evidence-import-validation.md`
- Relevant Next.js 16.2.12 guides under `node_modules/next/dist/docs/` before changing Route Handlers or server/client component boundaries.

## Implementation Requirements

### Slice 1 — Receipt, Schema, And Staging

- Add provider-neutral receipt, normalized-record, mapping, candidate, observation, metric, and active-state persistence inside the configured pricing database.
- Keep migrations additive and restart-safe.
- Implement an exact versioned adapter for the approved PriceCharting 27-column CSV.
- Parse USD values into integer cents and preserve absent values as `NULL`.
- Preserve PriceCharting ID as the provider primary key and retain TCG ID/UPC/ASIN/ePID only as typed corroborating aliases.
- Quarantine invalid dates, numeric/unknown genres, malformed prices, row-width drift, and unsupported records with explicit reason codes.
- Copy and hash the raw source into ignored immutable local receipt storage before any apply operation.
- Add a local command whose default is dry-run and whose explicit `--apply` flag is required for promotion.
- Make repeat processing of the same source/schema/game receipt idempotent.

### Slice 2 — Identity Resolution And Promotion

- Implement pure, named, versioned Pokémon matching methods in the exact order defined by the specification.
- Preserve set, collector prefix/suffix/denominator, language, finish, stamp/promo/edition, and other physical qualifiers.
- Do not treat bare `tcg-id`, UPC, price, sales volume, release date, or name similarity as automatic identity proof.
- Enforce one active PriceCharting product per Phronesis target SKU and one active target per PriceCharting product.
- Quarantine every source-to-target or target-to-source collision; never select by price, order, recency, or score.
- Stage English sealed products but keep them non-promoted unless the strict sealed rule in the specification is proven.
- Persist PriceCharting observations outside TCGplayer-owned `pricing_latest` and `pricing_history` lanes.
- Promote one complete receipt atomically after all reconciliation checks pass.
- Preserve and reactivate the prior active receipt on rollback without deleting history.
- Produce a deterministic JSON report with method attribution, denominators, reasons, field coverage, hashes, and crosswalk fingerprint.

### Slice 3 — Consumption And Operations

- Let the existing Graded Area read the latest active imported PriceCharting evidence first and retain the existing live adapter as explicit manual refresh/verification.
- Show provider attribution and observation age; never imply imported evidence is TCGplayer evidence.
- Add only a compact provider-operations summary in Settings/provider health: last successful receipt, source age, active game, accepted/review/collision/unmatched counts, and recurrence disabled.
- Preserve current responsive layout and authorization boundaries.
- Reconcile Feature Registry, Atlas, Decisions, Roadmap, release notes, testing evidence, implementation report, conformance report, CTO Structure, and Product Development Memory.

## Constraints

- Do not modify TCGplayer `pricing_products`, `pricing_latest`, `pricing_history`, Direct Low precedence, delivered-low semantics, or current search identity.
- Do not change recommended-offer calculations.
- Do not use PriceCharting as artwork evidence.
- Do not automatically adopt reviewable, ambiguous, collided, unsupported, or unmatched records.
- Do not implement One Piece, Magic, recurring scheduling, authenticated bulk download, browser upload, scraping, or provider-plan purchase.
- Do not add a dependency unless repository-native parsing and SQLite facilities are demonstrably insufficient.
- Do not expose `PRICECHARTING_API_TOKEN`, environment data, or authenticated URLs.
- Preserve unrelated owner changes in the dirty worktree.

## Expected Architecture

Keep these boundaries independently testable:

- `PriceChartingCsvAdapter` — raw schema and provider vocabulary.
- `ProviderImportReceiptRepository` — immutable receipts and active-state pointer.
- `ProviderEvidenceStagingRepository` — normalized records and diagnostics.
- `PokemonPriceChartingResolver` — game-specific identity rules.
- `ProviderEvidencePromoter` — collision checks and one atomic activation.
- `ProviderEvidenceRepository` — active and historical read models.
- `ProviderImportReport` — deterministic metrics and fingerprints.
- CLI orchestration — local dry-run/apply only.

Avoid a parallel pricing catalogue. Phronesis products remain canonical targets; PriceCharting records remain typed external Market Identities and observations.

## Testing Expectations

- Follow `docs/testing/PHR-API-011-pricecharting-bulk-evidence-import-validation.md`.
- Use deterministic, secret-free fixtures for schema, prices, languages, variants, collisions, sealed records, malformed data, and repeated receipts.
- Run the owner source in dry-run mode and reconcile the documented measured baseline. Do not apply the owner file during automated tests.
- Prove that a failure at every promotion boundary preserves the prior active receipt.
- Prove PriceCharting values cannot change TCG Direct Low, TCG Low, TCG Market, delivered low, artwork, offer recommendations, Inventory, Event Ledger, purchase receipts, or Display Case.
- Run focused tests, the complete supported suite, standalone TypeScript, warning-free lint, production build, and diff hygiene.

## Documentation Updates

- `docs/api/PHR-API-011-pricecharting-bulk-evidence-import.md`
- `docs/testing/PHR-API-011-pricecharting-bulk-evidence-import-validation.md`
- `docs/implementation-reports/PHR-API-011-pricecharting-bulk-evidence-import-report.md`
- `docs/reviews/PHR-API-011-pricecharting-bulk-evidence-import-conformance-review.md`
- `docs/release-notes/PHR-API-011.md`
- `docs/FEATURE_REGISTRY.md`
- `docs/ATLAS.md`
- `docs/DECISIONS.md`
- `docs/ROADMAP.md`
- `docs/product-development/CURRENT_CTO_STRUCTURE.md`
- `docs/product-development/CONVERSATION_HISTORY.md`

## Acceptance Criteria

- The approved Pokémon CSV contract imports through dry-run and apply modes.
- The same file is idempotent.
- Exact one-to-one mapping and collision quarantine match the specification.
- Against the measured source pair, the dry run reproduces or explicitly reconciles the documented 13,957 collision-free candidate ceiling and 13,596 graded-candidate count.
- Automatic acceptance may be lower than the measured candidate ceiling. It may be higher only when new versioned identity evidence explicitly explains and tests the increase.
- The 5,206 measured collision rows across 2,372 targets remain non-active.
- Failed or partial imports preserve last-good evidence.
- Existing operational and financial behavior is unchanged.
- All required validation and documentation gates pass.

## Non-Goals

- Recurring acquisition or scheduling.
- One Piece or Magic activation.
- Image acquisition.
- Sealed fuzzy reconciliation.
- Review-queue editing UI.
- Replacing the existing live PriceCharting verification adapter.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep every source and target identity auditable.
- Prefer explicit reason codes over heuristic scores.
- Never weaken a collision or ambiguity gate to reach a coverage percentage.
- Present future scheduler, One Piece, Magic, and review-console ideas separately from this implementation.
