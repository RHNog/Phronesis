# PHR-UX-013 — Vendor Evidence Composition Restoration Work Order

## Project Context

Phronesis already owns an exact TCGplayer/LigaMagic bridge, a promoted exact LigaPokémon crosswalk, selected-card pricing, and independent PriceCharting graded evidence. A later layout revision regressed the previously approved evidence hierarchy by moving Liga away from Snapshot evidence and expanding PriceCharting above primary raw-card values.

## Feature ID

`PHR-UX-013`

## Objective

Restore the selected-card Vendor Workspace evidence stack: combined TCGplayer plus applicable Liga raw-card information first, followed immediately by a closed optional PriceCharting disclosure. Consume the latest promoted last-good LigaMagic and LigaPokémon evidence from the operational pricing database.

## Required Reading

- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/design/PHR-UX-013-regional-vending-intelligence.md`
- `docs/api/PHR-API-010-pricecharting-graded-evidence.md`
- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/ux/PHR-UX-022-selection-focused-vendor-workspace.md`
- Historical composition at commit `dad5cb2` for `SnapshotVendorWorkspace.tsx` and `PriceChartingGradedArea.tsx`
- Current `RegionalIntelligenceRepository`, `RegionalMarketPanel`, regional evidence Route Handler, and Vendor Workspace tests

## Implementation Requirements

- Restore one bordered `Raw-card market evidence` section inside Snapshot evidence.
- Render TCGplayer values first and the applicable regional exact-match panel inside that section.
- Use LigaMagic for `magic-en`, LigaPokémon for `pokemon-en`, and no Liga claim for unsupported catalogues.
- Extend regional evidence reads to the promoted Pokémon tables while retaining Magic behavior.
- Order each regional read by newest observation/reconciliation and return provider ID/label, source run ID, condition, and language as allowlisted provenance.
- Use the operational database's promoted last-good evidence. Do not depend on the current acquisition attempt being successful and do not mutate snapshots.
- Restore PriceCharting as a closed-by-default `<details>` immediately after the combined card.
- Defer PriceCharting fetch until expansion and preserve independent evidence semantics.
- Keep one grading-certificate workflow and avoid duplicate controls.
- Remove the duplicate Regional panel from Buying decision.

## Constraints

- Do not fabricate a Liga match, provider, timestamp, condition, language, or snapshot run.
- Do not join Liga by fuzzy identity or weaken existing `MATCHED` crosswalk gates.
- Do not let PriceCharting alter TCGplayer/Liga values, selected artwork, or the offer calculation.
- Do not trigger provider acquisition, login, credential mutation, crosswalk rebuild, transaction, or publication.
- Preserve selection, condition, checkout, watch, evaluation, authorization, and responsive navigation behavior.

## Expected Architecture

Promoted operational Magic/Pokémon regional tables → one provider-aware repository read model → existing authorized regional evidence Route Handler → `RegionalMarketPanel` inside combined Snapshot evidence → lazy collapsed `PriceChartingGradedArea` directly below.

## Testing Expectations

- Repository tests for Magic and Pokémon provider/source provenance and newest matched evidence selection.
- Static composition tests enforcing combined-card ownership and exact PriceCharting order.
- Lazy PriceCharting disclosure contract tests.
- Full tests, standalone TypeScript, warning-free lint/build, diff hygiene, live API checks for one matched Magic and Pokémon card, and desktop/390-pixel browser review.

## Documentation Updates

- PHR-UX-013 specification and design direction.
- PHR-API-010 placement contract.
- Validation, release notes, implementation report, Atlas, Decisions, Roadmap, Prompt History, Current CTO Structure, Conversation History, Project State, and Agent Handoff.

## Acceptance Criteria

The deployed Vendor Workspace shows exact LigaMagic or LigaPokémon information within the selected card's TCGplayer raw-card card; PriceCharting is closed and directly below it; the live Magic response names the latest available `dry-run-20260730T203243818Z` snapshot; and all gates pass.

## Non-Goals

- Acquiring a newer LigaMagic snapshot while the saved profile requires reauthentication.
- Adding Pokémon arbitrage.
- Changing PriceCharting identity resolution, activation, subscription configuration, or pricing precedence.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this composition and provider-aware read-model restoration.
- Use the historical implementation as a shortcut, but reconcile it with current components and authorization rather than reverting unrelated later work.
- Same-session conformance is not independent Product Owner approval.
