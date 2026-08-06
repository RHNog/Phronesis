# PHR-BR-001 — TCG Direct Low Precedence

## Status
Implemented — Product Review Ready

## Priority
Critical

## Objective
Use TCGplayer Direct-qualified pricing as the primary buying reference whenever the exact catalogue SKU and condition provide it.

## Business Rule
The reference ladder is `TCG Direct Low → TCG Market Price → delivered TCG Low fallback → unavailable`. Direct Low is condition/SKU-specific and must not be inferred across variants, finishes, languages, or grades. When present it drives the canonical MarketPrice consumed by evaluation, recommended offer, negotiation ladder, and purchase intake default. TCG Low, delivered low, and Market remain visible as secondary evidence.

## Functional Requirements
- Parse `TCG Direct Low` from every verified catalogue row as exact cents.
- Version the catalogue contract so existing latest snapshots are automatically re-imported with the previously discarded column.
- Persist it in latest and historical snapshots; a Direct Low change creates new history evidence.
- Highlight it above every other price metric in Snapshot Evidence and the compact offer tile.
- Fall back without changing behavior when Direct Low is blank.
- Never substitute Direct Low from another condition or artwork.

## Acceptance Criteria
- A card with Direct Low evaluates from Direct Low even when it exceeds Market and TCG Low.
- A card without it retains the prior reference ladder.
- The exported value survives import, SQLite hydration, unified search, UI, and checkout.

## Traceability
- Prompt: `docs/prompts/PHR-BR-001-tcg-direct-low-precedence-prompt.md`
- Tests: `tests/pricing-catalog-sync.test.ts`, `tests/snapshot-vendor-workspace.test.ts`
- Last modified: 2026-08-01
