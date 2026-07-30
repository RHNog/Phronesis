# PHR-WORKFLOW-004 — Snapshot-Powered Vendor Workspace

## Feature Metadata

- Feature ID: `PHR-WORKFLOW-004`
- Status: Product Review Ready
- Category: Product / Workflow / UX / Database / Local integration
- Priority: Critical
- Delivery lane: Standard
- Source: CTO direction on 2026-07-29
- Supersedes: `PHR-UX-007` as the primary placement of snapshot pricing; preserves its importer, repository, search, history, and quick-lookup compatibility surface.

## Problem

Vendor Workspace contains Phronesis's buying policy, offer ladder, and BUY / NEGOTIATE / PASS decision pipeline, but it currently fetches a separate daily market estimate after an identity-first workflow. `PHR-UX-007` contains the newer strict snapshot repository and fast catalogue search, but it is a phone-first reference surface and explicitly avoids recommendations. Splitting those capabilities prevents the card-show operator from moving from an authoritative catalogue row to a buying decision in one fast desktop workflow.

The Pricing Update Tool already downloads complete Magic, Pokémon, and One Piece catalogues during four scheduled runs per day. Phronesis does not yet consume those completed catalogues automatically.

## Approved Outcome

Make Vendor Workspace a desktop-first card-show buying station powered by the latest verified catalogue snapshots. One interaction must take an operator from catalogue search through exact printing, finish, condition, asking price, business profile, offer ladder, and BUY / NEGOTIATE / PASS decision. Mobile is a responsive backup using the same repository, API, and business logic.

## Users And Operating Context

- Primary: vendor or buyer operating a laptop/desktop at a card show.
- Secondary: the same operator using a phone as a backup.
- Expected network: intermittent. Previously imported last-known-good snapshots remain available locally.
- Primary data source: completed TCGplayer catalogue downloads produced by `/Volumes/JarvisSSD/Projects/TCGPlayer Tools/Price Updating`.

## Architecture Boundary

```text
Pricing Update Tool verified catalogue completion checkpoint
  -> Phronesis read-only run-state observer
  -> stable completed catalog file
  -> strict TCGplayer catalogue adapter
  -> transactional/idempotent SQLite import
  -> latest price + change-only history + operational status
  -> one pricing search API
  -> desktop Vendor Workspace and mobile adaptation
  -> existing Business Profile, evaluation, offer ladder, and decision engines
```

Phronesis follows the upstream completion checkpoints; it does not hardcode or recreate the four schedules. It reads no partially downloaded catalogue. It does not modify Pricing Update Tool code, schedules, Postgres data, credentials, browser automation, or publication behavior.

## Confirmed Upstream Contract

- Schedules currently fire daily at 00:00, 06:00, 12:00, and 18:00.
- Current run state is stored at `state/run_state.json` under the Pricing Update Tool root.
- `steps["export_catalog::<game>"]` is written only after download verification passes.
- The run state contains the current `run_dir`.
- Completed files are named `catalog_magic.csv`, `catalog_pokemon.csv`, and `catalog_onepiece.csv`.
- Catalogue files are deleted after a completed Pricing Update Tool run, so Phronesis opens a completed file promptly after observing its checkpoint.
- The catalogue header is the stable 16-column TCGplayer export header verified from repository evidence.

## Normalization Rules

- Active categories: `magic-en`, `pokemon-en`, and `onepiece-en`.
- TCGplayer row ID is retained as the source SKU.
- A deterministic product key groups condition-specific source SKUs by category, set, product name, collector number, language, and finish/treatment.
- `Unopened` is sealed product with no condition.
- Grade prefixes map to NM, LP, MP, HP, and DMG.
- Finish/treatment and non-English language suffixes encoded in the TCGplayer condition string are preserved instead of collapsed.
- Market price is the preferred evaluation reference. When it is absent, delivered low is the explicit fallback.
- Listing is `TCG Low Price`; delivered low is `TCG Low Price With Shipping`; exported shipping is their non-negative difference when both exist.
- Currency parser accepts the catalogue's observed precision and stores rounded cents.
- Unknown conditions, product lines, malformed values, duplicate price identities, and schema drift fail closed before activation.

## Reliability Rules

- Category, source hash, contract version, and completion checkpoint make each upstream receipt idempotent.
- An unchanged catalogue at a later checkpoint advances freshness without duplicating price history.
- Import writes are transactional. A failed import cannot replace active data.
- Last-known-good data remains searchable after observer or import failure.
- Operational state records pending, importing, current, duplicate, and failed outcomes without secrets.
- Snapshot time is derived from the verified upstream checkpoint and stored as an ISO instant; the source catalogue date used by existing history remains a UTC calendar date.
- The observer tolerates temporarily incomplete JSON while the upstream process writes run state.
- The observer must not follow symlinks outside the configured Pricing Update Tool root.
- Only configured game/file pairs are eligible.

## Desktop Experience

The production route remains `/vendor`. At desktop widths it uses three persistent work areas:

1. Catalogue search and result selection.
2. Exact identity, condition, snapshot evidence, freshness, and movement.
3. Asking price, Business Profile, strategy, offer ladder, and decision.

The workflow is keyboard-first, keeps decision-critical context visible, avoids a separate pricing page, and recalculates as inputs change. `/price-lookup` remains a compatibility quick lookup backed by the same data.

Catalogue results and selected evidence include the canonical `CardThumbnail` presentation under `PHR-UI-002`. Local pricing renders first. Verified provider artwork enriches the result asynchronously and provider failure falls back to the existing placeholder without affecting search or decisions.

## Mobile Adaptation

At narrow widths the same work areas become a single-column staged flow. Search, selection, condition, asking price, and decision remain usable at 320px. No mobile-only repository, API, calculation, or business rule is permitted.

## Non-Goals

- Live marketplace calls, scraping, or changes to TCGplayer automation.
- Pricing Update Tool scheduler or pricing-method changes.
- Payment, purchase execution, inventory intake, alerts, accounts, or team permissions.
- Barcode, camera, OCR, or voice capture.
- Hosted production deployment or public release.
- New games without a verified catalogue contract.

## Implementation Slice Plan

Plan fingerprint: `PHR-WORKFLOW-004-standard-v1`

1. **Catalogue contract and observer** — normalize real TCGplayer catalogue rows, observe verified upstream checkpoints, and expose durable operational status. Rollback: remove observer/adapter and retain `PHR-UX-007` repository behavior.
2. **Repository integration** — group source SKUs into product/finish identities, preserve condition prices and change-only history, support all three verified categories, and expose status/category APIs. Rollback: database is local and may be recreated from the last source snapshot; no upstream state is changed.
3. **Desktop Vendor Workspace** — replace the separate identity/market-fetch path on `/vendor` with snapshot search plus the existing evaluation engines. Preserve `/price-lookup`. Rollback: restore prior `/vendor` composition.
4. **Mobile adaptation and operational handoff** — verify responsive behavior, offline last-good use, watcher command/runbook, and end-to-end import-to-decision behavior.

No slice changes approved scope, product behavior, financial policy, or upstream operation. The plan is automatically accepted under the canonical workflow.

## Acceptance Criteria

1. A completed upstream catalogue checkpoint becomes active in Phronesis within five minutes while the observer is running.
2. A partial file, incomplete checkpoint, schema drift, unknown condition, or malformed row cannot replace the last-good snapshot.
3. Reprocessing the same completed catalogue is a no-op.
4. A failed import leaves the prior snapshot operational and exposes an actionable local status.
5. Magic, Pokémon, and One Piece are independently selectable and report independent freshness.
6. Desktop operators can search, select exact product/finish/condition, enter an asking price, and reach an offer decision on `/vendor` without navigating away.
7. Snapshot source, age, freshness, movement, market price, delivered low, and fallback use are explicit.
8. Business Profile and Strategy reuse existing engines; there is no duplicate offer or decision implementation.
9. Mobile at 320px preserves the same core action and data semantics.
10. Focused importer, observer, repository, API, evaluation-integration, keyboard, responsive, lint, build, and diff checks pass or retain only separately documented baseline debt.
11. Result and selected-evidence thumbnails use verified source/provider artwork when available and stable placeholders otherwise.

## Recovery

Stop the observer to stop ingestion. Since it is read-only upstream and transactional locally, recovery uses the last-good SQLite database or a fresh import. Never delete the upstream catalogue, run state, Pricing Update Tool database, or retained Phronesis rollback checkout.
