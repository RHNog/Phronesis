# PHR-UX-013 — Regional Vending Intelligence

## Status

Implemented — Privately Live; Product Review Ready

## Priority

High

## Category

Product / UX / UI / Decision Intelligence

## Objective

Make the selected-card decision useful for Brazilian vending immediately by showing regional retail, dealer-buy benchmark, and recommended buy/list ranges with evidence freshness.

## Problem Statement

Vendor Workspace currently centres US-dollar catalogue evidence. Brazilian card-show decisions require the local market context without making the operator interpret raw export columns.

The approved combined raw-card evidence composition was later regressed: PriceCharting became an always-expanded panel above TCGplayer values, while Liga evidence moved away from Snapshot evidence and into the separate Buying decision panel. The regional API also remained Magic-only even after an exact promoted LigaPokémon crosswalk became available. This makes the phone workflow long, obscures the primary raw-card comparison, and incorrectly suggests that PriceCharting graded evidence precedes TCGplayer/Liga raw-card evidence.

## Proposed Solution

Restore one selected-card raw-market evidence stack inside Snapshot evidence rather than creating another engine:

1. TCGplayer plus the exact applicable Liga provider in one combined raw-card card.
2. PriceCharting as a collapsed optional disclosure immediately below that combined card.
3. Buying decision and seller ask remain separate decision controls and must not own the raw regional evidence panel.

Magic uses LigaMagic; English Pokémon uses LigaPokémon. Other games show TCGplayer only. Regional reads use the promoted operational last-good snapshot and disclose provider, observation time, and source run ID. Pricing modes include quick-sale, market, and patient-listing views.

## Functional Requirements

- Show LigaMagic consumer retail (`Compra`) and dealer buy benchmark (`Venda`) in BRL for the exact selected printing.
- Show LigaPokémon consumer retail (`Compra`) and dealer buy benchmark (`Venda`) in BRL for an exact promoted English Pokémon printing, including its source condition and language when present.
- Show bounded-compatible LigaPokémon evidence when `PHR-API-016` proves one deterministic equivalent; label it as compatible, disclose confidence and reason, and keep it outside Arbitrage.
- Choose LigaMagic only for `magic-en`, LigaPokémon only for `pokemon-en`, and never imply Liga coverage for another catalogue.
- Read the latest promoted last-good evidence already present in the operational pricing database. A failed or reauthentication-required acquisition must not erase or hide that snapshot.
- Include the source provider and snapshot run ID in the regional evidence response and visible provenance.
- Show source age and identity confidence before any recommendation.
- Present recommended buy, quick-sale ask, market ask, and patient ask as explainable ranges.
- Preserve the existing seller-asking-price comparison as secondary input.
- Keep TCGplayer and Liga raw-card values inside one bordered `Raw-card market evidence` card in Snapshot evidence.
- Place the PriceCharting card immediately after that combined card, closed by default, with a minimum 44-pixel summary control.
- Do not issue a PriceCharting lookup until the disclosure is expanded; collapse must keep it secondary and reduce initial phone work.
- PriceCharting values remain independent graded corroboration and never overwrite TCGplayer, Liga, artwork, or the offer reference.
- Show provider-specific price movement for `7D`, `30D`, `3M`, and `1Y` from retained local observations.
- Keep TCGplayer and Liga history inside the raw-card card and PriceCharting history inside the collapsed PriceCharting disclosure.
- Honor the active user's enabled-provider preferences; disabled evidence never silently participates in the visible offer reference.
- Clearly distinguish unavailable, stale, unmatched, and ambiguous states.
- Prefer the provider-aware target-equivalence disposition over the legacy source-crosswalk read so all safely classified target matches are available.
- Remain desktop-first with a single-column mobile adaptation.
- Keep all four direction-specific cost inputs in Settings while allowing them to remain empty until the Product Owner defines policy.
- Add nullable, direction-specific target profiles in Settings: acquisition-value range, minimum gross resale value, minimum gross spread, minimum net profit, minimum profit margin, minimum ROI, and maximum evidence age. Every monetary field must name its currency.
- Define profit margin as net profit divided by gross proceeds and ROI as net profit divided by total cost; never use the labels interchangeably.
- Applying a target filters or labels a candidate but cannot satisfy identity, freshness, cost, or executable-availability gates.
- Present Arbitrage as a decision workspace with an evidence summary, direction filters, visible blockers, net-first economics, and a focused availability-verification action.
- Replace the wide-table dependency with responsive candidate cards that preserve printing identity, direction, source prices, net result, ROI, freshness, and gate state.
- Make direction changes materially visible. `US → Brazil` must label the US value as acquisition and the Brazil value as exit/gross evidence; `Brazil → US` must reverse those roles. A direction toggle may not merely change the route caption while leaving an unlabeled price pair unchanged.
- Label LigaMagic evidence by commercial meaning: `Compra` is store retail (consumer acquisition) and `Venda` is dealer-buy benchmark. Do not present either as an executable offer without verification.

## Accessibility And Responsiveness

- Keyboard-accessible controls, semantic headings, visible focus, and non-colour status labels.
- Desktop keeps evidence and decision visible together; mobile stacks recommendation before details.
- On mobile, the selected-card order is identity/condition, combined TCGplayer/Liga raw-card card, collapsed PriceCharting disclosure, then later decision controls. No expanded PriceCharting grid may precede raw-card evidence.

## Acceptance Criteria

- A matched fresh card exposes local evidence without manual catalogue switching.
- A matched Magic card labels LigaMagic and the latest promoted LigaMagic snapshot run.
- A matched Pokémon card labels LigaPokémon and the latest promoted LigaPokémon snapshot run.
- Gardevoir GX SV75 and other safely classified exact/compatible targets expose LigaPokémon evidence with visible match quality; ambiguous and unavailable targets remain unpriced.
- The PriceCharting disclosure is closed on selection and appears after the combined TCGplayer/Liga card.
- Range/provider history controls remain usable at 390 pixels, show an honest sparse-history state, and never combine USD and BRL on one scale.
- Expanding PriceCharting loads its evidence; leaving it closed performs no PriceCharting request.
- No recommendation appears as certain when costs or evidence are incomplete.
- Existing purchase evaluation and checkout paths remain unchanged unless the operator explicitly adds a line.
- Empty costs are labelled as intentionally awaiting Product Owner policy and link the operator back to Settings.
- Arbitrage remains usable at 390px without horizontal scrolling and never presents missing net economics as zero.
- Selecting either direction changes acquisition/exit labels, units, target profile, and explanatory copy so the route can be understood without comparing screenshots.
- Settings preserves null targets as `No target` and validates percentages, currencies, range order, and maximum evidence age.
- Candidate cards show gross proceeds, total cost, net profit, profit margin, and ROI as distinct quantities when calculation inputs exist.

## Dependencies

- `PHR-ARCH-013`
- `PHR-API-006`
- `PHR-UX-011`
- `PHR-WORKFLOW-006`
- `PHR-API-010`
- `PHR-API-013`
- `PHR-API-016`
- `PHR-API-017`
- `PHR-ARCH-017`
- `PHR-UX-022`

## Traceability

- Designer direction: `docs/design/PHR-UX-013-regional-vending-intelligence.md`.
- Related implementation prompt: `docs/prompts/PHR-REGIONAL-INTELLIGENCE-20260730-prompt.md`.
- Current revision work order: `docs/prompts/PHR-UX-013-vendor-evidence-composition-prompt.md`.
- Last modified: 2026-08-07.
- Modification reason: add provider-specific retained history and personal provider visibility without changing the approved evidence stack.

## Implementation Evidence

- Vendor Workspace now renders TCGplayer plus the applicable Liga provider inside one `Raw-card market evidence` card.
- The provider-aware read model consumes exact Magic rows plus exact/bounded-compatible Pokémon target dispositions and exposes a truthful ambiguous/unavailable reason otherwise.
- Live LigaMagic evidence resolves from last-good run `dry-run-20260730T203243818Z`; live LigaPokémon evidence resolves from run `dry-run-20260805T070105248Z` and preserves condition/language provenance.
- Live Pokémon coverage is 30,864 exact plus 3,312 compatible targets; Gardevoir GX SV75 resolves to HIF/SV75 Holofoil at R$169.90 with 92% exact structural confidence.
- PriceCharting is a closed-by-default disclosure immediately below the combined card, resets closed when selection changes, and begins its lookup only after expansion.
- Validation: `docs/testing/PHR-UX-013-arbitrage-presentation-validation.md`.
- Implementation report: `docs/implementation-reports/PHR-UX-013-vendor-evidence-composition-report.md`.
- Same-session conformance: `docs/reviews/PHR-UX-013-vendor-evidence-composition-conformance-review.md`; Product Owner acceptance remains independent.
