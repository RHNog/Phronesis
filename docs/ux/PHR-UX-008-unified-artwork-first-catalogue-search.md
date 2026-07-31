# PHR-UX-008 — Unified Artwork-First Catalogue Search

## Feature ID

`PHR-UX-008`

## Status

Product Review Ready

## Priority

Critical

## Category

Product / UX / UI / Search / Workflow

## Objective

Remove manual catalogue switching and collapse finish duplicates into one artwork-first result, with exact finish and condition selected after the user chooses the card.

## Problem Statement

Vendor Workspace currently searches only the manually selected game. It renders one result per TCGplayer product SKU, causing identical Normal/Foil/Holofoil artwork to appear multiple times and forcing users to identify a finish before selecting the card.

## Proposed Solution

1. A single search queries every loaded catalogue and globally ranks matches.
2. Each result visibly identifies its game; selection, not typed-character heuristics, commits the workflow to a catalogue.
3. Single-card results group products by artwork identity: category, product family, normalized card name, set, collector number, and language. Finish-only and numeric presentation suffixes do not create another artwork result; real art/treatment descriptors such as Borderless, Showcase, or Alternate Art remain distinct.
4. Selecting an artwork reveals an explicit Finish menu containing its exact TCGplayer product SKUs. Normal/nonfoil is preferred by the existing Variant Resolution Policy when available, but the menu remains visible and editable.
5. Condition selection follows finish selection and continues to resolve exact snapshot evidence for that SKU.
6. Sealed products remain discrete products and are not collapsed across SKUs.

`PHR-UX-016` additively interprets bounded, documented structured set-code shorthand before the same global search. The interpretation affects retrieval and ranking only; it does not alter grouping, catalogue identity, or the requirement that the operator select an exact result.

## Functional Requirements

- No catalogue dropdown is required for ordinary search.
- Results from all loaded games share one ranked list and carry visible game labels.
- Ambiguous names may show multiple games; Phronesis never silently hides a valid match because another catalogue scored slightly higher.
- Duplicate finish products sharing an artwork identity render once.
- Result price presentation uses the selected/preferred finish and current condition, clearly indicating when multiple finishes exist.
- Clicking or pressing Enter on an artwork selects the group and exposes Finish before Condition.
- Changing finish resets asking price and recalculates evidence/evaluation from the selected SKU.
- Keyboard up/down/Enter/Escape behavior remains available.
- Artwork enrichment may merge only groups whose strict provider image identity is equal; it cannot merge different collector numbers or art descriptors speculatively.

## Non-Functional Requirements

### Performance

One local API request searches all configured categories. FTS work remains bounded per category and the response is capped globally.

### Reliability

If one category is unavailable or has no data, loaded categories continue to return results and category freshness remains visible.

### Accessibility

Game identity, card identity, finish count, selected finish, and condition are programmatically named. Finish and condition controls preserve 44px targets and keyboard operation.

### Responsiveness

Desktop remains a three-column buying station. Mobile preserves one-column order and does not reintroduce a catalogue switch.

## Acceptance Criteria

- Typing a query returns matching Magic, Pokémon, One Piece, Lorcana, or Riftbound catalogue products without manual switching when those catalogues are loaded.
- A Normal/Foil pair with the same artwork renders once and exposes both options after selection.
- Distinct collector numbers and explicit alternate-art treatments remain separate results.
- Finish changes select the exact SKU and its condition prices.
- Search, selection, thumbnails, and buying decisions work at desktop and 390px without horizontal overflow.

## Edge Cases

- Same card name in multiple games: show both with game labels.
- Category not loaded: omit its products and retain its freshness state; do not show a misleading no-results claim for all games.
- Only one finish: show the finish as a single selected value without requiring an extra confirmation.
- Provider image unavailable: use the canonical placeholder and group only by deterministic catalogue identity.

## Dependencies

- `PHR-WORKFLOW-004` Snapshot-Powered Vendor Workspace.
- `PHR-API-002` Cross-Game Catalogue Artwork Providers.
- Existing Variant Resolution Policy and condition pricing contract.
- `PHR-UX-016` Intent-Aware Catalogue Search for bounded structured shorthand.

## Non-Goals

- Fuzzy AI classification of the game from free text.
- Merging cards across sets or collector numbers.
- Changing buying formulas, Business Profiles, Intelligence engines, or decision thresholds.

## Traceability

- Product direction: 2026-07-29 automatic catalogue and artwork-first variant request.
- Implementation prompt: `docs/prompts/PHR-UX-008-unified-artwork-first-catalogue-search-prompt.md`.
- Related tests: `tests/snapshot-vendor-workspace.test.ts`, `tests/pricing-catalog-sync.test.ts`.
- Validation: `docs/testing/PHR-UX-008-unified-artwork-first-catalogue-search-validation.md`.
- Release note: `docs/release-notes/PHR-UX-008.md`.
- Last modified: 2026-07-31.
