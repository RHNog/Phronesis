# PHR-UX-022 — Selection-Focused Vendor Workspace

## Status
Implemented — Product Review Ready

## Objective
Remove search-result scroll from the active buying decision once an exact card is selected.

## Solution
Selecting a result collapses the search field and full result list. Snapshot evidence takes the former result column beside the single canonical Event station. A persistent selected-identity bar provides a 44px `Search another card` action that clears selection and restores the prior search/results. Buying decision remains below the operational row.

## Acceptance Criteria
- Mouse, keyboard Enter, and touch selections enter focused mode.
- No duplicate checkout, cart, evidence panel, or transaction state exists.
- Phone order is selected identity, Snapshot evidence, Event station, Buying decision.
- Within Snapshot evidence, raw-card markets appear first in one TCGplayer/Liga card and optional PriceCharting appears immediately below as a closed disclosure under `PHR-UX-013`.
- Clearing selection restores search without discarding its query/results.

## Traceability
- Prompt: `docs/prompts/PHR-UX-022-selection-focused-vendor-workspace-prompt.md`
- Implementation: `features/vendor/components/SnapshotVendorWorkspace.tsx`
- Last modified: 2026-08-07 for selected-card evidence ordering.
